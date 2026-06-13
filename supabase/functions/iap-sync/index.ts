// IAP sync — receives a verified purchase event and updates subscriptions + profiles.
// Two callers:
//  1) Native client after a successful RevenueCat purchase (POST with CustomerInfo).
//     Caller is the authenticated app user (verify_jwt = true). We trust the
//     RevenueCat customerInfo because the client SDK validates Apple receipts
//     against RevenueCat's servers; for stronger validation, also configure
//     the RevenueCat webhook below.
//  2) RevenueCat webhook (POST with Authorization: Bearer <REVENUECAT_WEBHOOK_AUTH>).
//     We require a shared-secret bearer token in the Authorization header.
//
// In both cases we upsert into public.subscriptions and flip profiles.is_premium.
// On the first successful unlock we send a purchase-confirmation email
// (idempotent via the subscription/transaction id).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PRICE_TIERS: Record<string, { amount_cents: number; currency: string; label: string }> = {
  "com.scaniq.pro.monthly": { amount_cents: 1900, currency: "USD", label: "ScanIQ Pro - Monthly" },
};

const ClientPayload = z.object({
  source: z.literal("client"),
  entitlement_active: z.boolean(),
  product_id: z.string().min(1).max(128),
  transaction_id: z.string().min(1).max(256).optional(),
  original_transaction_id: z.string().min(1).max(256).optional(),
  expires_at: z.string().datetime().nullable().optional(),
  period_start: z.string().datetime().nullable().optional(),
  will_renew: z.boolean().optional(),
  discount_code: z.string().trim().min(1).max(64).optional(),
});

const WebhookPayload = z.object({
  source: z.literal("webhook"),
  event: z.object({
    type: z.string(),
    app_user_id: z.string(),
    product_id: z.string().optional(),
    transaction_id: z.string().optional(),
    original_transaction_id: z.string().optional(),
    expiration_at_ms: z.number().nullable().optional(),
    purchased_at_ms: z.number().optional(),
    environment: z.string().optional(),
  }).passthrough(),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const WEBHOOK_SECRET = Deno.env.get("REVENUECAT_WEBHOOK_AUTH");

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return json({ error: "invalid_body" }, 400);
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    let userId: string;
    let productId: string;
    let active: boolean;
    let txId: string;
    let expiresAt: string | null;
    let periodStart: string | null;
    let willRenew: boolean;
    let env: "live" | "sandbox" = "live";
    let discountCode: string | undefined;

    if ((body as any).source === "webhook") {
      const authz = req.headers.get("Authorization") ?? "";
      const presented = authz.startsWith("Bearer ") ? authz.slice(7).trim() : "";
      if (!WEBHOOK_SECRET || presented !== WEBHOOK_SECRET) {
        return json({ error: "unauthorized" }, 401);
      }
      const parsed = WebhookPayload.safeParse(body);
      if (!parsed.success) return json({ error: "invalid_webhook", details: parsed.error.flatten() }, 400);
      const e = parsed.data.event;
      userId = e.app_user_id;
      productId = e.product_id ?? "com.scaniq.pro.monthly";
      const type = (e.type || "").toUpperCase();
      active = !["EXPIRATION", "CANCELLATION", "REFUND", "SUBSCRIPTION_PAUSED"].includes(type);
      txId = e.transaction_id ?? e.original_transaction_id ?? `rc_${userId}_${productId}`;
      expiresAt = e.expiration_at_ms ? new Date(e.expiration_at_ms).toISOString() : null;
      periodStart = e.purchased_at_ms ? new Date(e.purchased_at_ms).toISOString() : null;
      willRenew = active && !["CANCELLATION"].includes(type);
      env = e.environment === "SANDBOX" ? "sandbox" : "live";
    } else {
      // Client-driven sync — require authenticated user
      const authHeader = req.headers.get("Authorization") ?? "";
      const userClient = createClient(SUPABASE_URL, ANON, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: userData, error: userErr } = await userClient.auth.getUser();
      if (userErr || !userData.user) return json({ error: "unauthorized" }, 401);

      const parsed = ClientPayload.safeParse(body);
      if (!parsed.success) return json({ error: "invalid_payload", details: parsed.error.flatten() }, 400);
      const p = parsed.data;
      userId = userData.user.id;
      productId = p.product_id;
      active = p.entitlement_active;
      txId = p.transaction_id ?? p.original_transaction_id ?? `rc_${userId}_${productId}`;
      expiresAt = p.expires_at ?? null;
      periodStart = p.period_start ?? null;
      willRenew = p.will_renew ?? active;
      discountCode = p.discount_code;
    }

    const tier = PRICE_TIERS[productId] ?? { amount_cents: 1900, currency: "USD", label: productId };
    const subId = `iap_${userId}_${productId}`;
    const status = active ? "active" : "canceled";

    // Resolve optional discount code → row
    let discountCodeId: string | null = null;
    let amountSavedCents = 0;
    if (discountCode && active) {
      const { data: code } = await admin
        .from("discount_codes")
        .select("id, discount_type, amount, currency, active, expires_at, max_uses, times_used")
        .eq("code", discountCode.toUpperCase())
        .eq("active", true)
        .maybeSingle();
      if (code && (!code.expires_at || new Date(code.expires_at) > new Date()) &&
          (code.max_uses == null || code.times_used < code.max_uses)) {
        discountCodeId = code.id;
        amountSavedCents = code.discount_type === "percentage"
          ? Math.round((tier.amount_cents * Number(code.amount)) / 100)
          : Math.round(Number(code.amount) * 100);
      }
    }

    // Upsert subscription. Reuse the historical paddle_* column names which now
    // store the IAP transaction id and user key.
    const { data: existing } = await admin
      .from("subscriptions")
      .select("id, status")
      .eq("paddle_subscription_id", subId)
      .maybeSingle();

    const subPayload = {
      user_id: userId,
      paddle_subscription_id: subId,
      paddle_customer_id: `iap_${userId}`,
      product_id: productId,
      price_id: productId,
      status,
      current_period_start: periodStart,
      current_period_end: expiresAt,
      cancel_at_period_end: !willRenew,
      environment: env,
      amount_paid_cents: tier.amount_cents - amountSavedCents,
      currency: tier.currency,
      ...(discountCodeId ? { discount_code_id: discountCodeId } : {}),
      updated_at: new Date().toISOString(),
    };

    const { data: upserted, error: upErr } = await admin
      .from("subscriptions")
      .upsert(subPayload, { onConflict: "paddle_subscription_id" })
      .select("id")
      .single();
    if (upErr) return json({ error: upErr.message }, 500);

    await admin.from("profiles").update({ is_premium: active }).eq("id", userId);

    // First-time activation → record redemption + send confirmation email
    const firstTimeActivation = active && (!existing || existing.status !== "active");
    if (firstTimeActivation) {
      if (discountCodeId && upserted?.id) {
        await admin.from("discount_redemptions").insert({
          code_id: discountCodeId,
          user_id: userId,
          subscription_id: upserted.id,
          code_text: (discountCode ?? "").toUpperCase(),
          amount_saved_cents: amountSavedCents,
          currency: tier.currency,
        });
        // bump times_used best-effort
        await admin.rpc as any; // no-op placeholder; using direct update below
        await admin.from("discount_codes")
          .update({ times_used: (await admin.from("discount_codes").select("times_used").eq("id", discountCodeId).single()).data?.times_used + 1 || 1 })
          .eq("id", discountCodeId);
      }

      // Send confirmation email
      try {
        const { data: prof } = await admin.from("profiles").select("email, display_name").eq("id", userId).maybeSingle();
        const recipient = prof?.email;
        if (recipient) {
          const priceLabel = `$${(tier.amount_cents / 100).toFixed(0)} / month`;
          await fetch(`${SUPABASE_URL}/functions/v1/send-transactional-email`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${SERVICE_ROLE}`,
            },
            body: JSON.stringify({
              templateName: "welcome-receipt",
              recipientEmail: recipient,
              idempotencyKey: `iap-${txId}`,
              purpose: "transactional",
              templateData: {
                language: "en",
                productName: tier.label,
                price: priceLabel,
              },
            }),
          });
        }
      } catch (e) {
        console.error("[iap-sync] email send failed", e);
      }
    }

    return json({ ok: true, active, subscription_id: upserted?.id });
  } catch (e) {
    console.error("[iap-sync] error", e);
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

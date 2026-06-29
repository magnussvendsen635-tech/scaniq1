// Admin-only financials/analytics endpoint.
// Returns revenue overview, tier counts, transaction list, and daily signups
// for the last 30 days.


import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json({ error: "unauthorized" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE);
    const { data: isAdmin } = await admin.rpc("is_admin", { _user_id: userData.user.id });
    if (!isAdmin) return json({ error: "forbidden" }, 403);

    const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [subsRes, profilesRes, usersRes, redemptionsRes, signupsRes] = await Promise.all([
      admin
        .from("subscriptions")
        .select("id, user_id, product_id, status, amount_paid_cents, currency, current_period_end, created_at, environment, discount_code_id")
        .order("created_at", { ascending: false })
        .limit(500),
      admin.from("profiles").select("id, email, is_premium"),
      admin.auth.admin.listUsers({ perPage: 1000 }),
      admin
        .from("discount_redemptions")
        .select("id, code_text, code_id, user_id, subscription_id, amount_saved_cents, currency, created_at")
        .order("created_at", { ascending: false })
        .limit(500),
      admin.from("profiles").select("created_at").gte("created_at", since30.toISOString()),
    ]);

    const profileById = new Map<string, any>();
    for (const p of profilesRes.data ?? []) profileById.set(p.id, p);
    const emailById = new Map<string, string | null>();
    for (const u of usersRes.data?.users ?? []) emailById.set(u.id, u.email ?? null);

    const subs = subsRes.data ?? [];
    const active = subs.filter((s: any) =>
      ["active", "trialing"].includes(s.status) &&
      (!s.current_period_end || new Date(s.current_period_end) > new Date())
    );

    // Total revenue = sum of all amount_paid_cents for live, non-zero rows
    const totalRevenueCents = subs
      .filter((s: any) => s.environment === "live")
      .reduce((acc: number, s: any) => acc + (s.amount_paid_cents ?? 0), 0);

    const premiumUserIds = new Set(active.map((s: any) => s.user_id));
    const totalUsers = profilesRes.data?.length ?? 0;
    const premiumCount = premiumUserIds.size;
    const basicCount = Math.max(0, totalUsers - premiumCount);

    const transactions = subs.map((s: any) => ({
      id: s.id,
      email: emailById.get(s.user_id) ?? profileById.get(s.user_id)?.email ?? s.user_id,
      tier: s.product_id?.includes("monthly") ? "Premium $19/mo" : s.product_id ?? "—",
      amount_cents: s.amount_paid_cents ?? 0,
      currency: s.currency ?? "USD",
      status: s.status,
      environment: s.environment,
      discount_code_id: s.discount_code_id ?? null,
      created_at: s.created_at,
    }));

    const redemptions = (redemptionsRes.data ?? []).map((r: any) => ({
      ...r,
      email: emailById.get(r.user_id) ?? profileById.get(r.user_id)?.email ?? r.user_id,
    }));

    // Daily signups
    const dayKey = (iso: string) => new Date(iso).toISOString().slice(0, 10);
    const counts = new Map<string, number>();
    for (const r of signupsRes.data ?? []) counts.set(dayKey(r.created_at), (counts.get(dayKey(r.created_at)) ?? 0) + 1);
    const signups_daily: { date: string; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      signups_daily.push({ date: d, count: counts.get(d) ?? 0 });
    }

    return json({
      revenue: {
        total_cents: totalRevenueCents,
        currency: "USD",
        premium_count: premiumCount,
        basic_count: basicCount,
        active_subscriptions: active.length,
      },
      transactions,
      redemptions,
      signups_daily,
    });
  } catch (e) {
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

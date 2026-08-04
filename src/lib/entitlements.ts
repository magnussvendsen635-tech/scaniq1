import { supabase } from "@/integrations/supabase/client";
import { RC_CONFIG } from "@/config/revenuecat";

/**
 * Shared RevenueCat / entitlement plumbing.
 *
 * Used by:
 *  - `useIAP`      → purchase & restore
 *  - `useSubscription` → start-up verification, so a fresh install never shows
 *    premium-locked screens to a user who already owns a subscription.
 *
 * Apple is the merchant of record. The client never decides entitlement on its
 * own: RevenueCat's CustomerInfo is forwarded to the `iap-sync` edge function,
 * which is the single source of truth for `subscriptions` / `profiles.is_premium`.
 */

export const RC_API_KEY_IOS = RC_CONFIG.iosApiKey;
export const ENTITLEMENT_ID = RC_CONFIG.entitlementId;

export const isNative = (): boolean =>
  typeof (window as any).Capacitor?.isNativePlatform === "function"
    ? (window as any).Capacitor.isNativePlatform()
    : false;

/** RevenueCat is usable at all (native shell + configured API key). */
export const iapAvailable = (): boolean => isNative() && !!RC_API_KEY_IOS;

let configured = false;
let configuredUser: string | undefined;

export async function configureRC(appUserID: string | undefined) {
  if (!iapAvailable()) return;
  try {
    const { Purchases, LOG_LEVEL } = await import("@revenuecat/purchases-capacitor");
    if (!configured) {
      await Purchases.setLogLevel({ level: LOG_LEVEL.WARN });
      await Purchases.configure({ apiKey: RC_API_KEY_IOS, appUserID });
      configured = true;
      configuredUser = appUserID;
      return;
    }
    // Already configured (e.g. anonymously before sign-in) — attach the
    // signed-in user so purchases are credited to the right account.
    if (appUserID && appUserID !== configuredUser) {
      try {
        await Purchases.logIn({ appUserID });
        configuredUser = appUserID;
      } catch {
        /* non-fatal */
      }
    }
  } catch (e) {
    console.error("[IAP] RevenueCat configure failed", e);
  }
}

/** Active entitlement: prefer the configured one, else any active entitlement. */
export function activeEntitlement(ci: any) {
  const active = ci?.entitlements?.active ?? {};
  return active[ENTITLEMENT_ID] ?? Object.values(active)[0];
}

export async function syncCustomerInfoToBackend(fallbackProductId: string, ci: any) {
  const ent: any = activeEntitlement(ci);
  await supabase.functions.invoke("iap-sync", {
    body: {
      source: "client",
      entitlement_active: !!ent,
      product_id: ent?.productIdentifier ?? fallbackProductId,
      entitlement_id: ent?.identifier ?? ENTITLEMENT_ID,
      revenuecat_customer_id: ci?.originalAppUserId ?? undefined,
      transaction_id: ci?.originalAppUserId ?? undefined,
      original_transaction_id: ent?.originalPurchaseDate ?? undefined,
      expires_at: ent?.expirationDate ?? null,
      period_start: ent?.latestPurchaseDate ?? null,
      will_renew: ent?.willRenew ?? !!ent,
    },
  });
}

/**
 * Pull the current CustomerInfo from RevenueCat/StoreKit and push it to the
 * backend. Returns whether Apple currently reports an active entitlement,
 * or `null` when RevenueCat is unavailable (web preview, missing key).
 */
export async function syncEntitlementNow(
  userId: string | undefined,
  fallbackProductId = "com.scaniq.monthly"
): Promise<boolean | null> {
  if (!iapAvailable()) return null;
  try {
    await configureRC(userId);
    const { Purchases } = await import("@revenuecat/purchases-capacitor");
    const { customerInfo } = await Purchases.getCustomerInfo();
    await syncCustomerInfoToBackend(fallbackProductId, customerInfo);
    return !!activeEntitlement(customerInfo);
  } catch (e) {
    console.warn("[IAP] entitlement sync failed", e);
    return null;
  }
}

/* ------------------------------------------------------------------ *
 * Start-up verification
 * ------------------------------------------------------------------ */

const bootstrapped = new Map<string, Promise<boolean | null>>();
const BOOTSTRAP_TIMEOUT_MS = 6000;

/**
 * Runs once per app launch per user, before premium-locked screens resolve.
 * On a fresh install there is no local cache, so `useSubscription` awaits this
 * to make sure StoreKit has been consulted and `iap-sync` has written the row
 * before anything is rendered as locked.
 *
 * Always resolves (never rejects) and is hard-capped by a timeout so a slow or
 * offline StoreKit call can never block the app.
 */
export function bootstrapEntitlement(userId: string | undefined): Promise<boolean | null> {
  if (!userId || !iapAvailable()) return Promise.resolve(null);
  const existing = bootstrapped.get(userId);
  if (existing) return existing;

  const run = Promise.race([
    syncEntitlementNow(userId),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), BOOTSTRAP_TIMEOUT_MS)),
  ]).catch(() => null);

  bootstrapped.set(userId, run);
  return run;
}

/** Force the next `bootstrapEntitlement` call to hit StoreKit again. */
export function resetEntitlementBootstrap(userId?: string) {
  if (userId) bootstrapped.delete(userId);
  else bootstrapped.clear();
}

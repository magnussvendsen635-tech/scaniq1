import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { RC_CONFIG } from "@/config/revenuecat";

/**
 * Native In-App Purchase hook backed by RevenueCat / StoreKit.
 *
 * App Store Connect products:
 *   - com.scaniq.monthly  (auto-renewable monthly subscription — "Premium")
 *   - scaniq.yearly       (auto-renewable yearly subscription — "Basic")
 *
 * RevenueCat:
 *   - Entitlement identifier: see RC_CONFIG.entitlementId
 *   - Current offering must contain both packages above
 *
 * Apple is the merchant of record. After a purchase the SDK returns
 * CustomerInfo, which we forward to the `iap-sync` edge function — the single
 * source of truth for `subscriptions` and `profiles.is_premium`.
 */

export const IAP_PRODUCTS = {
  monthly: "com.scaniq.monthly" as const,
  yearly: "scaniq.yearly" as const,
} as const;

export type IAPProductId = (typeof IAP_PRODUCTS)[keyof typeof IAP_PRODUCTS];

const RC_API_KEY_IOS = RC_CONFIG.iosApiKey;
const ENTITLEMENT_ID = RC_CONFIG.entitlementId;

const isNative = (): boolean =>
  typeof (window as any).Capacitor?.isNativePlatform === "function"
    ? (window as any).Capacitor.isNativePlatform()
    : false;

let configured = false;

async function configureRC(appUserID: string | undefined) {
  if (!isNative() || !RC_API_KEY_IOS) return;
  try {
    const { Purchases, LOG_LEVEL } = await import("@revenuecat/purchases-capacitor");
    if (!configured) {
      await Purchases.setLogLevel({ level: LOG_LEVEL.WARN });
      await Purchases.configure({ apiKey: RC_API_KEY_IOS, appUserID });
      configured = true;
      return;
    }
    // Already configured (e.g. anonymous) — attach the signed-in user so the
    // purchase is credited to the right account.
    if (appUserID) {
      try {
        await Purchases.logIn({ appUserID });
      } catch {
        /* non-fatal */
      }
    }
  } catch (e) {
    console.error("[IAP] RevenueCat configure failed", e);
  }
}

/** Active entitlement: prefer the configured one, else any active entitlement. */
function activeEntitlement(ci: any) {
  const active = ci?.entitlements?.active ?? {};
  return active[ENTITLEMENT_ID] ?? Object.values(active)[0];
}

function findPackage(offering: any, productId: IAPProductId) {
  const pkgs: any[] = offering?.availablePackages ?? [];
  return (
    pkgs.find((p) => p?.product?.identifier === productId) ??
    (productId === IAP_PRODUCTS.monthly ? offering?.monthly : offering?.annual) ??
    null
  );
}

async function syncCustomerInfoToBackend(productId: IAPProductId, ci: any) {
  const ent: any = activeEntitlement(ci);
  await supabase.functions.invoke("iap-sync", {
    body: {
      source: "client",
      entitlement_active: !!ent,
      product_id: ent?.productIdentifier ?? productId,
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

export function useIAP() {
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [monthlyPriceLabel, setMonthlyPriceLabel] = useState<string>("$19");
  const [yearlyPriceLabel, setYearlyPriceLabel] = useState<string>("$119");
  const offeringRef = useRef<any>(null);

  const loadOfferings = useCallback(async () => {
    if (!isNative() || !RC_API_KEY_IOS) return null;
    const { data } = await supabase.auth.getUser();
    await configureRC(data.user?.id);
    const { Purchases } = await import("@revenuecat/purchases-capacitor");
    const offerings = await Purchases.getOfferings();
    const current = offerings.current;
    offeringRef.current = current;
    const monthly = findPackage(current, IAP_PRODUCTS.monthly);
    const yearly = findPackage(current, IAP_PRODUCTS.yearly);
    if (monthly?.product?.priceString) setMonthlyPriceLabel(monthly.product.priceString);
    if (yearly?.product?.priceString) setYearlyPriceLabel(yearly.product.priceString);
    return current;
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await loadOfferings();
      } catch (e) {
        console.warn("[IAP] getOfferings failed", e);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadOfferings]);

  const purchase = async (productId: IAPProductId): Promise<{ success: boolean }> => {
    setLoading(true);
    try {
      if (!isNative()) {
        toast.info("In-App Purchase", {
          description: "Subscriptions are purchased through the App Store in the ScanIQ iOS app.",
        });
        return { success: false };
      }
      if (!RC_API_KEY_IOS) {
        toast.error("Payments are temporarily unavailable", {
          description: "Please try again later or contact support.",
        });
        return { success: false };
      }
      const { Purchases } = await import("@revenuecat/purchases-capacitor");
      const offering = offeringRef.current ?? (await loadOfferings());
      const pkg = findPackage(offering, productId);
      if (!pkg) {
        toast.error("This subscription is not available right now", {
          description: "Please check your connection and try again.",
        });
        return { success: false };
      }
      const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });
      await syncCustomerInfoToBackend(productId, customerInfo);
      const ok = !!activeEntitlement(customerInfo);
      if (!ok) {
        toast.error("Purchase could not be verified", {
          description: "If you were charged, tap Restore purchases.",
        });
      }
      return { success: ok };
    } catch (e: any) {
      if (e?.userCancelled || e?.code === "1" || /cancel/i.test(String(e?.message ?? ""))) {
        return { success: false };
      }
      toast.error("Purchase failed", { description: e?.message });
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const restore = async (): Promise<{ restored: boolean }> => {
    setLoading(true);
    try {
      if (!isNative() || !RC_API_KEY_IOS) {
        toast.info("Restore purchases is only available in the iOS app");
        return { restored: false };
      }
      const { data } = await supabase.auth.getUser();
      await configureRC(data.user?.id);
      const { Purchases } = await import("@revenuecat/purchases-capacitor");
      const { customerInfo } = await Purchases.restorePurchases();
      await syncCustomerInfoToBackend(IAP_PRODUCTS.monthly, customerInfo);
      return { restored: !!activeEntitlement(customerInfo) };
    } catch (e: any) {
      toast.error("Restore failed", { description: e?.message });
      return { restored: false };
    } finally {
      setLoading(false);
    }
  };

  return { purchase, restore, loading, ready, monthlyPriceLabel, yearlyPriceLabel, isNative: isNative() };
}

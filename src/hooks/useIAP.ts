import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { RC_CONFIG } from "@/config/revenuecat";

/**
 * Native In-App Purchase hook backed by RevenueCat.
 *
 * Configure in App Store Connect:
 *   - com.scaniq.pro.monthly  (auto-renewable subscription, $19/month)
 *
 * Configure in RevenueCat:
 *   - Entitlement identifier: "pro"
 *   - Offering with the monthly package above
 *   - Paste your iOS public SDK key into src/config/revenuecat.ts
 *
 * Apple is the merchant of record. Apple handles payment, receipt, and refunds.
 * After a successful purchase the SDK gives us CustomerInfo; we forward the
 * relevant fields to the `iap-sync` edge function which is the single source
 * of truth for our `subscriptions` table and `profiles.is_premium`.
 */

export const IAP_PRODUCTS = {
  monthly: "com.scaniq.pro.monthly" as const,
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
  if (configured || !isNative()) return;
  if (!RC_API_KEY_IOS) {
    console.warn("[IAP] VITE_RC_API_KEY_IOS missing — RevenueCat not configured");
    return;
  }
  try {
    const { Purchases, LOG_LEVEL } = await import("@revenuecat/purchases-capacitor");
    await Purchases.setLogLevel({ level: LOG_LEVEL.WARN });
    await Purchases.configure({ apiKey: RC_API_KEY_IOS, appUserID });
    configured = true;
  } catch (e) {
    console.error("[IAP] RevenueCat configure failed", e);
  }
}

async function syncCustomerInfoToBackend(productId: IAPProductId, ci: any) {
  const ent = ci?.entitlements?.active?.[ENTITLEMENT_ID];
  await supabase.functions.invoke("iap-sync", {
    body: {
      source: "client",
      entitlement_active: !!ent,
      product_id: ent?.productIdentifier ?? productId,
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
  const [monthlyPriceLabel, setMonthlyPriceLabel] = useState<string>("$19");
  const offeringRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!isNative() || !RC_API_KEY_IOS) return;
      const { data } = await supabase.auth.getUser();
      await configureRC(data.user?.id);
      try {
        const { Purchases } = await import("@revenuecat/purchases-capacitor");
        const offerings = await Purchases.getOfferings();
        if (cancelled) return;
        const current = offerings.current;
        offeringRef.current = current;
        const monthly = current?.monthly ?? current?.availablePackages?.find((p: any) => p.identifier === "$rc_monthly");
        if (monthly?.product?.priceString) setMonthlyPriceLabel(monthly.product.priceString);
      } catch (e) {
        console.warn("[IAP] getOfferings failed", e);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const purchase = async (productId: IAPProductId): Promise<{ success: boolean }> => {
    setLoading(true);
    try {
      if (!isNative()) {
        toast.info("In-App Purchase", {
          description: "Purchases are only available in the native iOS app via the App Store.",
        });
        return { success: false };
      }
      if (!RC_API_KEY_IOS) {
        toast.error("Payment system not yet configured", {
          description: "RevenueCat API key missing. Contact support.",
        });
        return { success: false };
      }
      const { Purchases } = await import("@revenuecat/purchases-capacitor");
      const offerings = offeringRef.current ?? (await Purchases.getOfferings()).current;
      const pkg = offerings?.availablePackages?.find((p: any) => p.product?.identifier === productId)
        ?? offerings?.monthly;
      if (!pkg) {
        toast.error("Product not available");
        return { success: false };
      }
      const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });
      await syncCustomerInfoToBackend(productId, customerInfo, opts?.discountCode);
      return { success: !!customerInfo?.entitlements?.active?.[ENTITLEMENT_ID] };
    } catch (e: any) {
      if (e?.userCancelled) return { success: false };
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
        toast.info("Restore purchases is only available in the native app");
        return { restored: false };
      }
      const { Purchases } = await import("@revenuecat/purchases-capacitor");
      const { customerInfo } = await Purchases.restorePurchases();
      await syncCustomerInfoToBackend(IAP_PRODUCTS.monthly, customerInfo);
      return { restored: !!customerInfo?.entitlements?.active?.[ENTITLEMENT_ID] };
    } catch (e: any) {
      toast.error("Restore failed", { description: e?.message });
      return { restored: false };
    } finally {
      setLoading(false);
    }
  };

  return { purchase, restore, loading, monthlyPriceLabel };
}

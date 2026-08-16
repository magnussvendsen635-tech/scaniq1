import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  RC_API_KEY_IOS,
  activeEntitlement,
  configureRC,
  isNative,
  syncCustomerInfoToBackend,
  syncEntitlementNow,
  resetEntitlementBootstrap,
} from "@/lib/entitlements";
import { FALLBACK_PRICES } from "@/config/revenuecat";

/** Formats the App Store reference amount using the browser locale. */
function formatFallback(amount: number) {
  try {
    return new Intl.NumberFormat(navigator.language || "en-US", {
      style: "currency",
      currency: FALLBACK_PRICES.currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `$${amount}`;
  }
}

/**
 * Native In-App Purchase hook backed by RevenueCat / StoreKit.
 *
 * App Store Connect products:
 *   - com.scaniq.monthly  (auto-renewable monthly subscription — "Premium")
 *   - scaniq.yearly       (auto-renewable yearly subscription — "Basic")
 *
 * Apple is the merchant of record. After a purchase or restore the SDK returns
 * CustomerInfo, which we forward to the `iap-sync` edge function — the single
 * source of truth for `subscriptions` and `profiles.is_premium`.
 */

export const IAP_PRODUCTS = {
  monthly: "com.scaniq.monthly" as const,
  yearly: "scaniq.yearly" as const,
} as const;

export type IAPProductId = (typeof IAP_PRODUCTS)[keyof typeof IAP_PRODUCTS];

export interface RestoreResult {
  /** Apple reported an active entitlement for this Apple ID. */
  restored: boolean;
  /** Nothing to restore vs. the call itself failed. */
  outcome: "restored" | "nothing_to_restore" | "unavailable" | "error";
  /** Product identifier Apple restored, when known. */
  productId?: string;
  /** Renewal / expiry date of the restored entitlement, when known. */
  expiresAt?: string | null;
  message?: string;
}

function findPackage(offering: any, productId: IAPProductId) {
  const pkgs: any[] = offering?.availablePackages ?? [];
  return (
    pkgs.find((p) => p?.product?.identifier === productId) ??
    (productId === IAP_PRODUCTS.monthly ? offering?.monthly : offering?.annual) ??
    null
  );
}

export function useIAP() {
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  /** Localized, App Store-formatted price strings. `null` until StoreKit answers. */
  const [monthlyPriceLabel, setMonthlyPriceLabel] = useState<string | null>(null);
  const [yearlyPriceLabel, setYearlyPriceLabel] = useState<string | null>(null);
  const [monthlyPrice, setMonthlyPrice] = useState<number | null>(null);
  const [yearlyPrice, setYearlyPrice] = useState<number | null>(null);
  const [currencyCode, setCurrencyCode] = useState<string | null>(null);
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
    if (typeof monthly?.product?.price === "number") setMonthlyPrice(monthly.product.price);
    if (typeof yearly?.product?.price === "number") setYearlyPrice(yearly.product.price);
    const cc = monthly?.product?.currencyCode ?? yearly?.product?.currencyCode ?? null;
    if (cc) setCurrencyCode(cc);
    return current;
  }, []);


  useEffect(() => {
    let cancelled = false;
    (async () => {
      // StoreKit can answer late right after launch — retry a few times so the
      // plan cards always end up with the real localized priceString.
      for (let attempt = 0; attempt < 4 && !cancelled; attempt++) {
        try {
          const current = await loadOfferings();
          if (!isNative() || findPackage(current, IAP_PRODUCTS.monthly)?.product?.priceString) break;
        } catch (e) {
          console.warn("[IAP] getOfferings failed", e);
        }
        await new Promise((r) => setTimeout(r, 1200));
      }
      if (cancelled) return;
      // Web preview has no StoreKit: show the App Store reference price rather
      // than an empty box. Native always overrides this with the real price.
      setMonthlyPriceLabel((v) => v ?? formatFallback(FALLBACK_PRICES.monthly));
      setYearlyPriceLabel((v) => v ?? formatFallback(FALLBACK_PRICES.yearly));
      setMonthlyPrice((v) => v ?? FALLBACK_PRICES.monthly);
      setYearlyPrice((v) => v ?? FALLBACK_PRICES.yearly);
      setCurrencyCode((v) => v ?? FALLBACK_PRICES.currency);
      setReady(true);
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
      const { data: u } = await supabase.auth.getUser();
      resetEntitlementBootstrap(u.user?.id);
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

  const restore = async (): Promise<RestoreResult> => {
    setLoading(true);
    try {
      if (!isNative() || !RC_API_KEY_IOS) {
        return {
          restored: false,
          outcome: "unavailable",
          message: "Restore purchases is only available in the ScanIQ iOS app.",
        };
      }
      const { data } = await supabase.auth.getUser();
      await configureRC(data.user?.id);
      const { Purchases } = await import("@revenuecat/purchases-capacitor");
      const { customerInfo } = await Purchases.restorePurchases();
      await syncCustomerInfoToBackend(IAP_PRODUCTS.monthly, customerInfo);
      // Any later start-up check should re-read StoreKit rather than reuse this launch's result.
      resetEntitlementBootstrap(data.user?.id);
      const ent: any = activeEntitlement(customerInfo);
      if (!ent) return { restored: false, outcome: "nothing_to_restore" };
      return {
        restored: true,
        outcome: "restored",
        productId: ent?.productIdentifier,
        expiresAt: ent?.expirationDate ?? null,
      };
    } catch (e: any) {
      // Cancelling the App Store password sheet is not an error.
      const msg = String(e?.message ?? "");
      if (e?.userCancelled || /cancel/i.test(msg)) {
        return { restored: false, outcome: "nothing_to_restore", message: msg };
      }
      return { restored: false, outcome: "error", message: msg || "Restore failed" };
    } finally {
      setLoading(false);
    }
  };

  /** Re-read StoreKit and push the result to the backend (no UI side effects). */
  const syncEntitlement = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    return syncEntitlementNow(data.user?.id);
  }, []);

  /** Yearly savings vs. 12x monthly, computed from real StoreKit prices. */
  const yearlySavingsPercent =
    monthlyPrice && yearlyPrice && monthlyPrice > 0
      ? Math.max(0, Math.round((1 - yearlyPrice / (monthlyPrice * 12)) * 100))
      : null;

  return {
    purchase,
    restore,
    syncEntitlement,
    loading,
    ready,
    monthlyPriceLabel,
    yearlyPriceLabel,
    monthlyPrice,
    yearlyPrice,
    currencyCode,
    yearlySavingsPercent,
    isNative: isNative(),
  };
}

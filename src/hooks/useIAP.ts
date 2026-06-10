import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

/**
 * Native In-App Purchase hook for Apple StoreKit & Google Play Billing.
 *
 * Product IDs to configure in App Store Connect and Google Play Console:
 *   - com.scaniq.pro.monthly       (monthly auto-renewable subscription)
 *   - com.scaniq.pro.yearly        (yearly auto-renewable subscription)
 *   - com.scaniq.streak.repair     (one-time consumable)
 *
 * Subscriptions are handled directly by Apple App Store and Google Play
 * Billing. Apple / Google act as the merchant for every in-app purchase:
 * they take the payment, issue the receipt and manage refunds.
 *
 * Wire up to a real SDK on device. Recommended: RevenueCat
 * (@revenuecat/purchases-capacitor) — handles StoreKit + Play Billing,
 * receipt validation, and entitlements with one API. Replace the TODO
 * blocks below with the SDK calls.
 */

export type IAPProductId =
  | "com.scaniq.pro.monthly"
  | "com.scaniq.pro.yearly"
  | "com.scaniq.streak.repair";

export const IAP_PRODUCTS = {
  monthly: "com.scaniq.pro.monthly" as const,
  yearly: "com.scaniq.pro.yearly" as const,
  streakRepair: "com.scaniq.streak.repair" as const,
};

const isNative = (): boolean =>
  typeof (window as any).Capacitor?.isNativePlatform === "function"
    ? (window as any).Capacitor.isNativePlatform()
    : false;

/** Unlocks premium in the local DB after a verified native purchase. */
async function unlockPremium(productId: IAPProductId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const isYearly = productId === IAP_PRODUCTS.yearly;
  const periodEnd = new Date();
  if (isYearly) periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  else periodEnd.setMonth(periodEnd.getMonth() + 1);

  // NOTE: DB columns are historically named paddle_* — they now store the
  // native IAP transaction id and the App Store / Play Store customer key.
  await supabase.from("subscriptions").upsert(
    {
      user_id: user.id,
      paddle_subscription_id: `iap_${user.id}_${productId}`,
      paddle_customer_id: `iap_${user.id}`,
      product_id: productId,
      price_id: productId,
      status: "active",
      current_period_end: periodEnd.toISOString(),
      environment: "live",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "paddle_subscription_id" }
  );
  await supabase.from("profiles").update({ is_premium: true }).eq("id", user.id);
}

export function useIAP() {
  const [loading, setLoading] = useState(false);

  const purchase = async (productId: IAPProductId): Promise<{ success: boolean }> => {
    setLoading(true);
    try {
      if (!isNative()) {
        toast.info("In-App Purchase", {
          description:
            "Purchases are only available in the native iOS / Android app via the App Store and Google Play.",
        });
        return { success: false };
      }
      // TODO: Replace with RevenueCat / StoreKit / Play Billing call.
      throw new Error("Native IAP SDK not yet configured");
    } catch (e: any) {
      toast.error("Purchase failed", { description: e?.message });
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const restore = async (): Promise<{ restored: boolean }> => {
    setLoading(true);
    try {
      if (!isNative()) {
        toast.info("Restore purchases is only available in the native app");
        return { restored: false };
      }
      // TODO: const { customerInfo } = await Purchases.restorePurchases();
      return { restored: false };
    } finally {
      setLoading(false);
    }
  };

  return { purchase, restore, loading, unlockPremium };
}

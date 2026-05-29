import { useState } from "react";
import { toast } from "sonner";

/**
 * Native App Store In-App Purchase hook (stub).
 *
 * Apple Product IDs (to be configured in App Store Connect):
 *   - com.scaniq.pro.monthly   ($19 / month)
 *   - com.scaniq.pro.yearly    ($179 / year)
 *   - com.scaniq.streak.repair ($3 one-time)
 *
 * When the native layer is wired up (e.g. RevenueCat via @revenuecat/purchases-capacitor,
 * or @capacitor-community/in-app-purchases), replace the bodies below with the SDK calls.
 * Those SDKs surface Apple's native StoreKit payment sheet — no web redirect.
 */

export type IAPProductId =
  | "com.scaniq.pro.monthly"
  | "com.scaniq.pro.yearly"
  | "com.scaniq.streak.repair";

const isNative = (): boolean => {
  // Capacitor sets this global once @capacitor/core is initialised on device.
  return typeof (window as any).Capacitor?.isNativePlatform === "function"
    ? (window as any).Capacitor.isNativePlatform()
    : false;
};

export function useIAP() {
  const [loading, setLoading] = useState(false);

  const purchase = async (productId: IAPProductId): Promise<{ success: boolean }> => {
    setLoading(true);
    try {
      if (!isNative()) {
        toast.info("In-App Purchase", {
          description:
            "App Store-betaling åbnes kun i den native iOS-app. Konfigurer Apple Product IDs i App Store Connect for at aktivere betalingsarket.",
        });
        return { success: false };
      }

      // TODO: Replace with RevenueCat / StoreKit call. Example with RevenueCat:
      //   const offerings = await Purchases.getOfferings();
      //   const pkg = offerings.current?.availablePackages.find(p => p.product.identifier === productId);
      //   const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg! });
      //   return { success: !!customerInfo.entitlements.active["pro"] };
      throw new Error("Native IAP SDK not yet configured");
    } catch (e: any) {
      toast.error("Køb mislykkedes", { description: e?.message });
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const restore = async (): Promise<{ restored: boolean }> => {
    setLoading(true);
    try {
      if (!isNative()) {
        toast.info("Gendan køb er kun tilgængelig i app'en");
        return { restored: false };
      }
      // TODO: await Purchases.restorePurchases();
      return { restored: false };
    } finally {
      setLoading(false);
    }
  };

  return { purchase, restore, loading };
}

export const IAP_PRODUCTS = {
  monthly: "com.scaniq.pro.monthly" as const,
  yearly: "com.scaniq.pro.yearly" as const,
  streakRepair: "com.scaniq.streak.repair" as const,
};

import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check, Loader2, Sparkles, RefreshCw, Settings } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useT } from "@/i18n/useT";
import type { TKey } from "@/i18n/translations";
import { useAuth } from "@/hooks/useAuth";
import { useIAP, IAP_PRODUCTS } from "@/hooks/useIAP";
import { usePaddleCheckout } from "@/hooks/usePaddleCheckout";
import { useSubscription } from "@/hooks/useSubscription";
import { Input } from "@/components/ui/input";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { supabase } from "@/integrations/supabase/client";
import { getPaddleEnvironment } from "@/lib/paddle";
import logo from "@/assets/scaniq-leaf-logo.png";

const featureKeys: TKey[] = [
  "premium.feat_scans",
  "premium.feat_macros",
  "premium.feat_trends",
  "premium.feat_priority",
];

const isNativePlatform = (): boolean =>
  typeof (window as any).Capacitor?.isNativePlatform === "function"
    ? (window as any).Capacitor.isNativePlatform()
    : false;

export default function Premium() {
  const nav = useNavigate();
  const t = useT();
  const { user } = useAuth();
  const { isActive, subscription, refetch } = useSubscription();
  const { purchase, restore: restoreIAP, loading: iapLoading } = useIAP();
  const { openCheckout, loading: paddleLoading } = usePaddleCheckout();
  const loading = iapLoading || paddleLoading;
  const [plan, setPlan] = useState<"month" | "year">("year");
  const [restoring, setRestoring] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [promoInput, setPromoInput] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState(false);

  const monthlyBase = 19;
  const yearlyBase = 179;
  const discount = promoApplied ? 0.1 : 0;
  const monthlyPrice = (monthlyBase * (1 - discount)).toFixed(2);
  const yearlyPrice = (yearlyBase * (1 - discount)).toFixed(2);
  const displayPrice = (n: string) => (n.endsWith(".00") ? n.slice(0, -3) : n);

  const applyPromo = () => {
    if (promoInput.trim().toUpperCase() === "PROMO10") {
      setPromoApplied(true);
      setPromoError(false);
      toast.success("Rabatkode anvendt! 10% trukket fra");
    } else {
      setPromoApplied(false);
      setPromoError(true);
      toast.error("Ugyldig kode");
    }
  };

  const upgrade = async () => {
    if (!user) {
      toast.error("Du skal være logget ind");
      return;
    }
    if (isNativePlatform()) {
      const productId = plan === "month" ? IAP_PRODUCTS.monthly : IAP_PRODUCTS.yearly;
      const { success } = await purchase(productId);
      if (success) {
        toast.success("Tak for dit køb!");
        await refetch();
      }
      return;
    }
    // Web → Paddle
    try {
      const priceId = plan === "month" ? "kcally_premium_monthly" : "kcally_premium_yearly";
      await openCheckout({
        priceId,
        customerEmail: user.email,
        customData: {
          userId: user.id,
          ...(promoApplied ? { promoCode: "PROMO10" } : {}),
        },
        discountCode: promoApplied ? "PROMO10" : undefined,
        successUrl: `${window.location.origin}/profile?checkout=success`,
      });
    } catch (e: any) {
      toast.error("Kunne ikke åbne betaling", { description: e?.message });
    }
  };

  const restore = async () => {
    setRestoring(true);
    try {
      if (isNativePlatform()) {
        await restoreIAP();
      }
      await refetch();
      if (isActive) toast.success("Dit abonnement er gendannet");
      else toast("Intet aktivt abonnement fundet");
    } finally {
      setRestoring(false);
    }
  };

  const openPortal = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal", {
        body: { environment: getPaddleEnvironment() },
      });
      if (error || !data?.url) throw new Error(error?.message || "Kunne ikke åbne portal");
      window.open(data.url, "_blank");
    } catch (e: any) {
      toast.error("Kunne ikke åbne abonnementsstyring", { description: e?.message });
    } finally {
      setPortalLoading(false);
    }
  };

  return (
    <div className="k-page bg-[hsl(40_40%_97%)] min-h-screen overflow-y-auto" style={{ paddingBottom: 100 }}>
      <PaymentTestModeBanner />

      <header className="flex items-center gap-3 mb-6 pt-2">
        <button
          onClick={() => nav(-1)}
          aria-label="Tilbage"
          className="k-tap w-10 h-10 rounded-full bg-white border border-border/60 flex items-center justify-center shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-semibold tracking-tight">{t("premium.title")}</h1>
      </header>

      {/* Hero */}
      <section className="rounded-3xl bg-white border border-border/50 p-7 mb-6 text-center shadow-[0_8px_30px_-12px_hsl(24_95%_55%/0.25)]">
        <div className="relative w-20 h-20 mx-auto mb-4">
          <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,hsl(24_95%_60%/0.45)_0%,transparent_70%)] blur-xl scale-125" />
          <div className="relative w-20 h-20 rounded-full overflow-hidden shadow-[0_6px_20px_hsl(24_95%_55%/0.35)]">
            <img src={logo} alt="ScanIQ" className="w-full h-full object-cover" />
          </div>
        </div>
        <h2 className="text-2xl font-semibold tracking-tight">{t("premium.unlock")}</h2>
        <p className="text-sm text-muted-foreground mt-1.5 max-w-xs mx-auto">
          {t("premium.unlock_sub")}
        </p>
      </section>

      {/* Features */}
      <section className="rounded-3xl bg-white border border-border/50 p-5 mb-6 shadow-sm">
        <div className="space-y-3">
          {featureKeys.map((k) => (
            <div key={k} className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-[hsl(24_95%_53%/0.12)] flex items-center justify-center shrink-0">
                <Check className="w-4 h-4 text-[hsl(24_95%_45%)]" strokeWidth={3} />
              </div>
              <span className="text-sm font-medium text-foreground/90">{t(k)}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Plans */}
      <section className="grid grid-cols-2 gap-3 mb-5">
        <PlanOption
          active={plan === "month"}
          onClick={() => setPlan("month")}
          title={t("premium.monthly")}
          price={`$${displayPrice(monthlyPrice)}`}
          oldPrice={promoApplied ? `$${monthlyBase}` : undefined}
          unit={t("premium.per_month")}
          sub={t("premium.cancel_anytime")}
        />
        <PlanOption
          active={plan === "year"}
          onClick={() => setPlan("year")}
          title={t("premium.yearly")}
          price={`$${displayPrice(yearlyPrice)}`}
          oldPrice={promoApplied ? `$${yearlyBase}` : undefined}
          unit={t("premium.per_year")}
          sub={t("premium.lifetime")}
          badge="Most Popular"
          highlight
        />
      </section>

      <Button
        onClick={upgrade}
        disabled={isActive || loading}
        className="w-full h-14 rounded-2xl bg-[hsl(24_95%_53%)] hover:bg-[hsl(24_95%_48%)] text-white text-base font-semibold tracking-tight shadow-[0_10px_24px_-8px_hsl(24_95%_55%/0.6)] transition-all"
      >
        {loading ? (
          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
        ) : (
          <Sparkles className="w-5 h-5 mr-2" />
        )}
        {isActive ? t("premium.youre_premium") : t("premium.upgrade_now")}
      </Button>

      {isActive && subscription && (
        <Button
          onClick={openPortal}
          disabled={portalLoading}
          variant="outline"
          className="w-full h-12 rounded-2xl mt-3"
        >
          {portalLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Settings className="w-4 h-4 mr-2" />}
          Administrér abonnement
        </Button>
      )}

      <p className="text-[11px] text-muted-foreground text-center mt-3 px-6 leading-relaxed">
        Abonnementet fornyes automatisk. Du kan opsige når som helst.
      </p>

      {/* Footer actions */}
      <footer className="mt-8 pt-6 border-t border-border/50">
        <div className="grid grid-cols-2 gap-2 mb-2">
          <FooterAction
            icon={<RefreshCw className="w-4 h-4" />}
            label={restoring ? "Gendanner…" : "Gendan køb"}
            onClick={restore}
            disabled={restoring}
          />
          <div className="flex gap-2 items-center h-11">
            <Input
              value={promoInput}
              onChange={(e) => { setPromoInput(e.target.value); setPromoError(false); }}
              placeholder="Rabatkode"
              disabled={promoApplied}
              className={"h-11 rounded-xl flex-1 text-sm " + (promoError ? "border-destructive" : promoApplied ? "border-green-500" : "")}
            />
            <Button
              onClick={promoApplied ? () => { setPromoApplied(false); setPromoInput(""); } : applyPromo}
              disabled={!promoApplied && !promoInput.trim()}
              variant="outline"
              className="h-11 rounded-xl px-3 shrink-0 text-sm"
            >
              {promoApplied ? "Fjern" : "Anvend"}
            </Button>
          </div>
        </div>
        {promoApplied && (
          <p className="text-xs text-green-600 mb-2 font-medium">
            ✓ Rabatkode anvendt! 10% trukket fra ved checkout
          </p>
        )}
        {promoError && (
          <p className="text-xs text-destructive mb-2 font-medium">Ugyldig kode</p>
        )}
        <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground flex-wrap">
          <button onClick={() => nav("/terms")} className="hover:text-foreground transition-colors underline-offset-4 hover:underline">
            Servicevilkår
          </button>
          <span className="text-border">·</span>
          <button onClick={() => nav("/refund")} className="hover:text-foreground transition-colors underline-offset-4 hover:underline">
            Refundering
          </button>
          <span className="text-border">·</span>
          <button onClick={() => nav("/privacy")} className="hover:text-foreground transition-colors underline-offset-4 hover:underline">
            Privatlivspolitik
          </button>
        </div>
      </footer>
    </div>
  );
}

const PlanOption = ({
  active, onClick, title, price, oldPrice, unit, sub, badge, highlight,
}: {
  active: boolean; onClick: () => void; title: string; price: string;
  oldPrice?: string; unit: string; sub: string; badge?: string; highlight?: boolean;
}) => (
  <button
    onClick={onClick}
    className={
      "k-tap p-5 text-left relative rounded-2xl transition-all border " +
      (active
        ? "border-[hsl(24_95%_53%)] bg-white shadow-[0_8px_24px_-10px_hsl(24_95%_55%/0.5)] ring-2 ring-[hsl(24_95%_53%/0.25)]"
        : "border-border/60 bg-white shadow-sm hover:shadow-md") +
      (highlight && !active ? " ring-1 ring-[hsl(24_95%_53%/0.3)]" : "")
    }
  >
    {badge && (
      <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px] font-semibold uppercase tracking-wider bg-[hsl(24_95%_53%)] text-white rounded-full px-2.5 py-0.5 shadow-sm whitespace-nowrap">
        {badge}
      </span>
    )}
    <div className="text-[11px] tracking-wider uppercase font-semibold text-muted-foreground">{title}</div>
    <div className="mt-2 flex items-baseline gap-1.5 flex-wrap">
      <span className="text-3xl font-bold tracking-tight">{price}</span>
      {oldPrice && <span className="text-sm text-muted-foreground line-through">{oldPrice}</span>}
      <span className="text-xs text-muted-foreground">{unit}</span>
    </div>
    <div className="text-xs mt-1 text-muted-foreground">{sub}</div>
  </button>
);

const FooterAction = ({ icon, label, onClick, disabled }: {
  icon: React.ReactNode; label: string; onClick: () => void; disabled?: boolean;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="k-tap flex items-center justify-center gap-2 h-11 rounded-xl bg-white border border-border/60 text-sm font-medium text-foreground/80 hover:text-foreground hover:border-border transition-all disabled:opacity-60"
  >
    {icon}
    {label}
  </button>
);

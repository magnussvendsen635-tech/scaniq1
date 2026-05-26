import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check, Sparkles, Loader2, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useT } from "@/i18n/useT";
import type { TKey } from "@/i18n/translations";
import { useAuth } from "@/hooks/useAuth";
import { usePaddleCheckout } from "@/hooks/usePaddleCheckout";
import { useSubscription } from "@/hooks/useSubscription";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import logo from "@/assets/scaniq-leaf-logo.png";

const featureKeys: TKey[] = [
  "premium.feat_scans",
  "premium.feat_macros",
  "premium.feat_workouts",
  "premium.feat_trends",
  "premium.feat_priority",
];

export default function Premium() {
  const nav = useNavigate();
  const t = useT();
  const { user } = useAuth();
  const { isActive } = useSubscription();
  const { openCheckout, loading } = usePaddleCheckout();
  const [plan, setPlan] = useState<"month" | "year">("year");

  const upgrade = async () => {
    if (!user) {
      toast.error("Du skal være logget ind");
      return;
    }
    try {
      await openCheckout({
        priceId: plan === "month" ? "kcally_premium_monthly" : "kcally_premium_yearly",
        customerEmail: user.email,
        customData: { userId: user.id },
        successUrl: `${window.location.origin}/profile?checkout=success`,
      });
    } catch (e: any) {
      toast.error("Kunne ikke åbne betaling", { description: e?.message });
    }
  };

  return (
    <div className="k-page">
      <PaymentTestModeBanner />
      <header className="flex items-center gap-3 mb-6">
        <button
          onClick={() => nav(-1)}
          className="k-tap w-10 h-10 rounded-none bg-card border-2 border-foreground flex items-center justify-center shadow-[3px_3px_0_0_hsl(var(--foreground))]"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-black tracking-tight uppercase">{t("premium.title")}</h1>
      </header>

      <div className="border-2 border-foreground bg-card p-6 mb-5 text-center shadow-[6px_6px_0_0_hsl(var(--foreground))]">
        <div className="w-20 h-20 rounded-full bg-background border-2 border-foreground flex items-center justify-center mx-auto mb-4 overflow-hidden">
          <img src={logo} alt="Scaniq" className="w-full h-full object-contain p-1" />
        </div>
        <h2 className="text-2xl font-black uppercase tracking-tight">{t("premium.unlock")}</h2>
        <p className="text-sm text-muted-foreground mt-1">{t("premium.unlock_sub")}</p>
      </div>

      <div className="space-y-2 mb-5">
        {featureKeys.map((k) => (
          <div
            key={k}
            className="border-2 border-foreground bg-card p-4 flex items-center gap-3 shadow-[3px_3px_0_0_hsl(var(--foreground))]"
          >
            <div className="w-7 h-7 rounded-none bg-foreground flex items-center justify-center shrink-0">
              <Check className="w-4 h-4 text-background" strokeWidth={3} />
            </div>
            <span className="text-sm font-medium">{t(k)}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <PlanOption
          active={plan === "month"}
          onClick={() => setPlan("month")}
          title={t("premium.monthly")}
          price="$19"
          unit={t("premium.per_month")}
          sub={t("premium.cancel_anytime")}
        />
        <PlanOption
          active={plan === "year"}
          onClick={() => setPlan("year")}
          title={t("premium.yearly")}
          price="$179"
          unit={t("premium.per_year")}
          sub={t("premium.lifetime")}
          badge={t("premium.best_price")}
        />
      </div>

      <Button
        onClick={upgrade}
        disabled={isActive || loading}
        className="w-full h-14 rounded-none border-2 border-foreground bg-[hsl(24_95%_53%)] hover:bg-[hsl(24_95%_48%)] text-white text-base font-black uppercase tracking-wide shadow-[5px_5px_0_0_hsl(var(--foreground))] hover:shadow-[3px_3px_0_0_hsl(var(--foreground))] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
      >
        {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Zap className="w-5 h-5 mr-2" strokeWidth={3} />}
        {isActive ? t("premium.youre_premium") : t("premium.upgrade_now")}
      </Button>
    </div>
  );
}

const PlanOption = ({
  active,
  onClick,
  title,
  price,
  unit,
  sub,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  price: string;
  unit: string;
  sub: string;
  badge?: string;
}) => (
  <button
    onClick={onClick}
    className={
      "border-2 border-foreground k-tap p-5 text-left relative transition-all " +
      (active
        ? "bg-foreground text-background shadow-[5px_5px_0_0_hsl(24_95%_53%)]"
        : "bg-card shadow-[3px_3px_0_0_hsl(var(--foreground))]")
    }
  >
    {badge && (
      <span className="absolute -top-2 -right-2 text-[9px] font-black uppercase tracking-widest bg-[hsl(24_95%_53%)] border-2 border-foreground px-2 py-1 text-white">
        {badge}
      </span>
    )}
    <div className={"text-xs tracking-widest uppercase font-bold " + (active ? "text-background/70" : "text-muted-foreground")}>{title}</div>
    <div className="mt-2 flex items-baseline gap-1">
      <span className="text-3xl font-black">{price}</span>
      <span className={"text-xs " + (active ? "text-background/70" : "text-muted-foreground")}>{unit}</span>
    </div>
    <div className={"text-xs mt-1 " + (active ? "text-background/70" : "text-muted-foreground")}>{sub}</div>
  </button>
);

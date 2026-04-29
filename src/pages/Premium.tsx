import { useNavigate } from "react-router-dom";
import { useKStore } from "@/store/useKStore";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Crown, Check, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useT } from "@/i18n/useT";
import type { TKey } from "@/i18n/translations";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

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
  const { setPremium, premium } = useKStore();
  const { user } = useAuth();
  const [plan, setPlan] = useState<"month" | "year">("year");

  const upgrade = async () => {
    // NOTE: is_premium is server-controlled and can only be set by a backend
    // payment flow (Stripe webhook / edge function). The local flag below is
    // for UI feedback only — it does NOT grant real premium until the backend
    // updates the profile.
    toast.info("Payment flow not configured", {
      description: "Connect a payment provider to enable real upgrades.",
    });
    setPremium(true); // local-only preview
    nav("/profile");
  };

  return (
    <div className="k-page">
      <header className="flex items-center gap-3 mb-6">
        <button onClick={() => nav(-1)} className="k-tap w-10 h-10 rounded-full bg-card border border-border/60 flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-semibold tracking-tight">{t("premium.title")}</h1>
      </header>

      <div className="k-card p-6 mb-5 bg-gradient-primary !border-transparent shadow-glow text-center">
        <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center mx-auto mb-3">
          <Crown className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-2xl font-semibold text-white">{t("premium.unlock")}</h2>
        <p className="text-sm text-white/80 mt-1">{t("premium.unlock_sub")}</p>
      </div>

      <div className="space-y-2 mb-5">
        {featureKeys.map((k) => (
          <div key={k} className="k-card p-4 flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-gradient-soft flex items-center justify-center">
              <Check className="w-4 h-4 text-primary-glow" />
            </div>
            <span className="text-sm">{t(k)}</span>
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
        disabled={premium}
        className="w-full h-14 rounded-2xl bg-gradient-primary text-base font-semibold shadow-glow hover:opacity-90"
      >
        <Sparkles className="w-5 h-5 mr-2" />
        {premium ? t("premium.youre_premium") : t("premium.upgrade_now")}
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
      "k-card k-tap p-5 text-left relative " + (active ? "ring-2 ring-primary shadow-glow bg-gradient-soft" : "")
    }
  >
    {badge && (
      <span className="absolute top-3 right-3 text-[9px] font-bold uppercase tracking-widest bg-gradient-primary px-2 py-1 rounded-full text-white">
        {badge}
      </span>
    )}
    <div className="text-xs text-muted-foreground tracking-widest uppercase">{title}</div>
    <div className="mt-2 flex items-baseline gap-1">
      <span className="text-3xl font-semibold k-gradient-text">{price}</span>
      <span className="text-xs text-muted-foreground">{unit}</span>
    </div>
    <div className="text-xs text-muted-foreground mt-1">{sub}</div>
  </button>
);

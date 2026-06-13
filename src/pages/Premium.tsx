import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check, Loader2, Sparkles, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useT } from "@/i18n/useT";
import type { TKey } from "@/i18n/translations";
import { useAuth } from "@/hooks/useAuth";
import { useIAP, IAP_PRODUCTS } from "@/hooks/useIAP";
import { useSubscription } from "@/hooks/useSubscription";
import { Input } from "@/components/ui/input";
import logo from "@/assets/scaniq-leaf-logo.png";

const featureKeys: TKey[] = [
  "premium.feat_scans",
  "premium.feat_macros",
  "premium.feat_trends",
  "premium.feat_priority",
];

export default function Premium() {
  const nav = useNavigate();
  const t = useT();
  const { user } = useAuth();
  const { isActive, refetch } = useSubscription();
  const { purchase, restore: restoreIAP, loading, monthlyPriceLabel } = useIAP();
  const [restoring, setRestoring] = useState(false);
  const [discountCode, setDiscountCode] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<"basic" | "premium">("premium");

  const upgrade = async () => {
    if (!user) { toast.error(t("premium.must_sign_in")); return; }
    const code = discountCode.trim().toUpperCase().slice(0, 32);
    const { success } = await purchase(IAP_PRODUCTS.monthly, code ? { discountCode: code } : undefined);
    if (success) {
      toast.success(t("premium.thanks"));
      await refetch();
    }
  };

  const restore = async () => {
    setRestoring(true);
    try {
      await restoreIAP();
      await refetch();
      if (isActive) toast.success(t("premium.restored"));
      else toast(t("premium.no_active"));
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="k-page bg-[hsl(40_40%_97%)] min-h-screen overflow-y-auto" style={{ paddingBottom: 100 }}>
      <header className="flex items-center gap-3 mb-6 pt-2">
        <button
          onClick={() => nav(-1)}
          aria-label={t("common.back")}
          className="k-tap w-10 h-10 rounded-full bg-white border border-border/60 flex items-center justify-center shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-semibold tracking-tight">{t("premium.title")}</h1>
      </header>

      <section className="rounded-3xl bg-white border border-border/50 p-7 mb-6 text-center shadow-[0_8px_30px_-12px_hsl(24_95%_55%/0.25)]">
        <div className="relative w-20 h-20 mx-auto mb-4">
          <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,hsl(24_95%_60%/0.45)_0%,transparent_70%)] blur-xl scale-125" />
          <div className="relative w-20 h-20 rounded-full overflow-hidden shadow-[0_6px_20px_hsl(24_95%_55%/0.35)]">
            <img src={logo} alt="ScanIQ" className="w-full h-full object-cover" />
          </div>
        </div>
        <h2 className="text-2xl font-semibold tracking-tight">{t("premium.unlock")}</h2>
        <p className="text-sm text-muted-foreground mt-1.5 max-w-xs mx-auto">{t("premium.unlock_sub")}</p>
      </section>

      {/* Tier comparison: Basic vs Premium */}
      <section className="grid grid-cols-2 gap-3 mb-5">
        <div className="rounded-2xl border border-border/60 bg-white p-5 shadow-sm">
          <div className="text-[11px] tracking-wider uppercase font-semibold text-muted-foreground">Basic</div>
          <div className="mt-2 flex items-baseline gap-1.5 flex-wrap">
            <span className="text-3xl font-bold tracking-tight">$179</span>
            <span className="text-xs text-muted-foreground">{t("premium.per_year")}</span>
          </div>
          <div className="text-xs mt-1 text-muted-foreground">3 scans / day</div>
        </div>
        <div className="rounded-2xl border border-[hsl(24_95%_53%)] bg-white p-5 shadow-[0_8px_24px_-10px_hsl(24_95%_55%/0.5)] ring-2 ring-[hsl(24_95%_53%/0.25)] relative">
          <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px] font-semibold uppercase tracking-wider bg-[hsl(24_95%_53%)] text-white rounded-full px-2.5 py-0.5 shadow-sm whitespace-nowrap">
            {t("premium.most_popular")}
          </span>
          <div className="text-[11px] tracking-wider uppercase font-semibold text-muted-foreground">Premium</div>
          <div className="mt-2 flex items-baseline gap-1.5 flex-wrap">
            <span className="text-3xl font-bold tracking-tight">{monthlyPriceLabel}</span>
            <span className="text-xs text-muted-foreground">{t("premium.per_month")}</span>
          </div>
          <div className="text-xs mt-1 text-muted-foreground">{t("premium.cancel_anytime")}</div>
        </div>
      </section>

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

      <section className="mb-4">
        <label className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mb-1.5 block">
          Discount code (optional)
        </label>
        <Input
          value={discountCode}
          onChange={(e) => setDiscountCode(e.target.value.toUpperCase().slice(0, 32))}
          placeholder=""
          className="h-12 rounded-xl bg-white"
          maxLength={32}
        />
      </section>

      <Button
        onClick={upgrade}
        disabled={isActive || loading}
        className="w-full h-14 rounded-2xl bg-[hsl(24_95%_53%)] hover:bg-[hsl(24_95%_48%)] text-white text-base font-semibold tracking-tight shadow-[0_10px_24px_-8px_hsl(24_95%_55%/0.6)] transition-all"
      >
        {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Sparkles className="w-5 h-5 mr-2" />}
        {isActive ? t("premium.youre_premium") : t("premium.upgrade_now")}
      </Button>

      <p className="text-[11px] text-muted-foreground text-center mt-3 px-6 leading-relaxed">
        {t("premium.auto_renew_note")}
      </p>

      <footer className="mt-8 pt-6 border-t border-border/50">
        <div className="grid grid-cols-1 gap-2 mb-2">
          <button
            onClick={restore}
            disabled={restoring}
            className="k-tap flex items-center justify-center gap-2 h-11 rounded-xl bg-white border border-border/60 text-sm font-medium text-foreground/80 hover:text-foreground hover:border-border transition-all disabled:opacity-60"
          >
            <RefreshCw className="w-4 h-4" />
            {restoring ? t("premium.restoring") : t("premium.restore")}
          </button>
        </div>
        <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground flex-wrap mt-4">
          <button onClick={() => nav("/terms")} className="hover:text-foreground transition-colors underline-offset-4 hover:underline">{t("landing.footer_terms")}</button>
          <span className="text-border">·</span>
          <button onClick={() => nav("/refund")} className="hover:text-foreground transition-colors underline-offset-4 hover:underline">{t("landing.footer_refund")}</button>
          <span className="text-border">·</span>
          <button onClick={() => nav("/privacy")} className="hover:text-foreground transition-colors underline-offset-4 hover:underline">{t("landing.footer_privacy")}</button>
        </div>
      </footer>
    </div>
  );
}

import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Sparkles } from "lucide-react";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n/useT";
import type { TKey } from "@/i18n/translations";
import logo from "@/assets/scaniq-leaf-logo.png";

const featureKeys: TKey[] = [
  "premium.feat_scans",
  "premium.feat_macros",
  "premium.feat_workouts",
  "premium.feat_trends",
  "premium.feat_priority",
];

export default function Pricing() {
  const nav = useNavigate();
  const t = useT();
  return (
    <div className="k-page bg-[hsl(40_40%_97%)] min-h-screen overflow-y-auto max-w-2xl mx-auto" style={{ paddingBottom: 60 }}>
      <Seo
        title="Priser — KCALLY Premium"
        description="KCALLY Premium fra $19/måned eller $179/år. 14 dages pengene-tilbage-garanti via Paddle."
        path="/pricing"
      />
      <header className="flex items-center gap-3 mb-6 pt-2">
        <button
          onClick={() => nav(-1)}
          aria-label="Tilbage"
          className="k-tap w-10 h-10 rounded-full bg-white border border-border/60 flex items-center justify-center shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-semibold tracking-tight">Priser</h1>
      </header>

      <section className="rounded-3xl bg-white border border-border/50 p-7 mb-6 text-center shadow-[0_8px_30px_-12px_hsl(24_95%_55%/0.25)]">
        <div className="relative w-20 h-20 mx-auto mb-4">
          <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,hsl(24_95%_60%/0.45)_0%,transparent_70%)] blur-xl scale-125" />
          <div className="relative w-20 h-20 rounded-full overflow-hidden shadow-[0_6px_20px_hsl(24_95%_55%/0.35)]">
            <img src={logo} alt="KCALLY" className="w-full h-full object-cover" />
          </div>
        </div>
        <h2 className="text-2xl font-semibold tracking-tight">{t("premium.unlock")}</h2>
        <p className="text-sm text-muted-foreground mt-1.5 max-w-xs mx-auto">{t("premium.unlock_sub")}</p>
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

      <section className="grid grid-cols-2 gap-3 mb-5">
        <div className="p-5 rounded-2xl bg-white border border-border/60 shadow-sm">
          <div className="text-[11px] tracking-wider uppercase font-semibold text-muted-foreground">{t("premium.monthly")}</div>
          <div className="mt-2 flex items-baseline gap-1.5"><span className="text-3xl font-bold">$19</span><span className="text-xs text-muted-foreground">{t("premium.per_month")}</span></div>
          <div className="text-xs mt-1 text-muted-foreground">{t("premium.cancel_anytime")}</div>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-[hsl(24_95%_53%)] shadow-[0_8px_24px_-10px_hsl(24_95%_55%/0.5)] ring-2 ring-[hsl(24_95%_53%/0.25)] relative">
          <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px] font-semibold uppercase tracking-wider bg-[hsl(24_95%_53%)] text-white rounded-full px-2.5 py-0.5">Most Popular</span>
          <div className="text-[11px] tracking-wider uppercase font-semibold text-muted-foreground">{t("premium.yearly")}</div>
          <div className="mt-2 flex items-baseline gap-1.5"><span className="text-3xl font-bold">$179</span><span className="text-xs text-muted-foreground">{t("premium.per_year")}</span></div>
          <div className="text-xs mt-1 text-muted-foreground">{t("premium.lifetime")}</div>
        </div>
      </section>

      <Button
        onClick={() => nav("/auth")}
        className="w-full h-14 rounded-2xl bg-[hsl(24_95%_53%)] hover:bg-[hsl(24_95%_48%)] text-white text-base font-semibold shadow-[0_10px_24px_-8px_hsl(24_95%_55%/0.6)]"
      >
        <Sparkles className="w-5 h-5 mr-2" />
        Kom i gang
      </Button>

      <p className="text-[11px] text-muted-foreground text-center mt-3 px-6 leading-relaxed">
        Abonnementet fornyes automatisk. 14 dages pengene-tilbage-garanti.
        Web-betalinger håndteres af Paddle.com som Merchant of Record.
      </p>

      <footer className="mt-8 pt-6 border-t border-border/50">
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground flex-wrap">
          <button onClick={() => nav("/terms")} className="hover:text-foreground underline-offset-4 hover:underline">Servicevilkår</button>
          <span className="text-border">·</span>
          <button onClick={() => nav("/refund")} className="hover:text-foreground underline-offset-4 hover:underline">Refunderingspolitik</button>
          <span className="text-border">·</span>
          <button onClick={() => nav("/privacy")} className="hover:text-foreground underline-offset-4 hover:underline">Privatlivspolitik</button>
        </div>
      </footer>
    </div>
  );
}

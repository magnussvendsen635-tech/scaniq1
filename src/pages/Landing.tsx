import { Link, Navigate } from "react-router-dom";
import { ArrowRight, Camera, Sparkles, LineChart, Flame, Shield, Check } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useKStore } from "@/store/useKStore";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n/useT";
import logo from "@/assets/scaniq-leaf-logo.png";

export default function Landing() {
  const { session, loading } = useAuth();
  const onboarded = useKStore((s) => s.onboarded);
  const t = useT();

  if (loading) return <div className="min-h-screen bg-background" />;
  if (session) return <Navigate to={onboarded ? "/app" : "/onboarding"} replace />;

  return (
    <div className="min-h-screen bg-[hsl(40_40%_97%)] text-foreground">
      <Seo
        title="ScanIQ — AI Nutrition & Fitness Tracker"
        description="Scan your food with AI, track macros, water and workouts. Reach your goals with ScanIQ, a Kinetex Intelligens product."
        path="/"
      />

      <header className="sticky top-0 z-30 backdrop-blur-md bg-white/70 border-b border-border/50">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-5 py-3">
          <Link to="/" className="flex items-center gap-2.5">
            <img src={logo} alt="ScanIQ" className="w-8 h-8 rounded-full object-cover" />
            <span className="text-base font-semibold tracking-[0.18em] k-gradient-text">ScanIQ</span>
          </Link>
          <nav className="hidden sm:flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/pricing" className="hover:text-foreground transition-colors">{t("landing.nav_pricing")}</Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">{t("landing.nav_terms")}</Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">{t("landing.nav_privacy")}</Link>
          </nav>
          <Link to="/auth">
            <Button className="h-9 px-4 rounded-full bg-[hsl(24_95%_53%)] hover:bg-[hsl(24_95%_48%)] text-white text-sm font-semibold">
              {t("landing.nav_login")}
            </Button>
          </Link>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,hsl(24_95%_60%/0.25)_0%,transparent_70%)] blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,hsl(120_40%_45%/0.18)_0%,transparent_70%)] blur-3xl" />
        </div>

        <div className="relative max-w-6xl mx-auto px-5 pt-16 pb-20 sm:pt-24 sm:pb-28 text-center">
          <img src={logo} alt="ScanIQ logo" className="h-24 w-24 mx-auto mb-6 rounded-full object-cover" />

          <div className="inline-flex items-center gap-2 rounded-full bg-white border border-border/60 px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-[hsl(24_95%_53%)]" />
            {t("landing.hero_badge")}
          </div>

          <h1 className="mt-6 text-4xl sm:text-6xl font-bold tracking-tight leading-[1.05]">
            {t("landing.hero_h1_a")}
            <br />
            <span className="k-gradient-text">{t("landing.hero_h1_b")}</span>
          </h1>

          <p className="mt-5 max-w-xl mx-auto text-base sm:text-lg text-muted-foreground leading-relaxed">
            {t("landing.hero_sub")}
          </p>

          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/auth" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto h-13 px-7 rounded-2xl bg-[hsl(24_95%_53%)] hover:bg-[hsl(24_95%_48%)] text-white text-base font-semibold shadow-[0_10px_30px_-8px_hsl(24_95%_55%/0.55)]">
                {t("landing.cta_get_started")}
                <ArrowRight className="w-5 h-5 ml-1" />
              </Button>
            </Link>
            <Link to="/pricing" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto h-13 px-7 rounded-2xl border-border bg-white text-base font-semibold">
                {t("landing.cta_view_pricing")}
              </Button>
            </Link>
          </div>

          <p className="mt-5 text-xs text-muted-foreground">{t("landing.cta_disclaimer")}</p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-5 pb-20">
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { icon: Camera, title: t("landing.f1_t"), desc: t("landing.f1_d") },
            { icon: LineChart, title: t("landing.f2_t"), desc: t("landing.f2_d") },
            { icon: Flame, title: t("landing.f3_t"), desc: t("landing.f3_d") },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-3xl bg-white border border-border/50 p-6 shadow-sm">
              <div className="w-11 h-11 rounded-2xl bg-[hsl(24_95%_53%/0.12)] flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-[hsl(24_95%_45%)]" />
              </div>
              <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-5 pb-20">
        <div className="rounded-3xl bg-gradient-to-br from-[hsl(24_95%_53%)] to-[hsl(14_90%_50%)] p-8 sm:p-12 text-white shadow-[0_20px_60px_-20px_hsl(24_95%_55%/0.6)]">
          <div className="grid sm:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">{t("landing.value_t")}</h2>
              <p className="mt-3 text-white/90 text-base leading-relaxed">{t("landing.value_d")}</p>
            </div>
            <ul className="space-y-3">
              {[t("landing.v1"), t("landing.v2"), t("landing.v3"), t("landing.v4")].map((f) => (
                <li key={f} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" strokeWidth={3} />
                  </div>
                  <span className="text-sm font-medium">{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-5 pb-20">
        <div className="rounded-3xl bg-white border border-border/50 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-[hsl(120_40%_45%/0.12)] flex items-center justify-center shrink-0">
            <Shield className="w-6 h-6 text-[hsl(120_40%_30%)]" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold tracking-tight">{t("landing.trust_t")}</h3>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{t("landing.trust_d")}</p>
          </div>
          <Link to="/pricing">
            <Button variant="outline" className="rounded-xl border-border bg-white whitespace-nowrap">
              {t("landing.cta_view_pricing")}
            </Button>
          </Link>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-5 pb-20 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">{t("landing.cta_ready_t")}</h2>
        <p className="mt-3 text-muted-foreground">{t("landing.cta_ready_sub")}</p>
        <Link to="/auth">
          <Button className="mt-7 h-13 px-8 rounded-2xl bg-[hsl(24_95%_53%)] hover:bg-[hsl(24_95%_48%)] text-white text-base font-semibold shadow-[0_10px_30px_-8px_hsl(24_95%_55%/0.55)]">
            {t("landing.cta_ready_btn")}
            <ArrowRight className="w-5 h-5 ml-1" />
          </Button>
        </Link>
      </section>

      <footer className="border-t border-border/50 bg-white">
        <div className="max-w-6xl mx-auto px-5 py-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <img src={logo} alt="ScanIQ" className="w-7 h-7 rounded-full object-cover" />
              <span className="text-sm font-semibold tracking-[0.18em] k-gradient-text">ScanIQ</span>
            </div>
            <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <Link to="/pricing" className="hover:text-foreground transition-colors">{t("landing.footer_pricing")}</Link>
              <Link to="/terms" className="hover:text-foreground transition-colors">{t("landing.footer_terms")}</Link>
              <Link to="/refund" className="hover:text-foreground transition-colors">{t("landing.footer_refund")}</Link>
              <Link to="/privacy" className="hover:text-foreground transition-colors">{t("landing.footer_privacy")}</Link>
            </nav>
          </div>
          <p className="mt-6 text-xs text-muted-foreground">
            {t("landing.footer_copyright")} · Kinetex Intelligens · scaniqapp1@gmail.com
          </p>
        </div>
      </footer>
    </div>
  );
}

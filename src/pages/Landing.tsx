// ⚠️ HARD RESET — previous Landing implementation deleted in full.
// This file is the single source of truth for the public landing page.
import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import useEmblaCarousel from "embla-carousel-react";
import { Camera, LineChart, Sparkles, Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useKStore } from "@/store/useKStore";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n/useT";
import logo from "@/assets/scaniq-logo-new.png";
import slideScan from "@/assets/slide-scan.jpg";
import slideMacros from "@/assets/slide-macros.jpg";
import slideInsights from "@/assets/slide-insights.jpg";
import slidePrivacy from "@/assets/slide-privacy.jpg";

const BRAND = "hsl(24 95% 53%)";
const BRAND_DARK = "hsl(24 95% 48%)";
const BG = "hsl(40 40% 97%)";

export default function Landing() {
  const { session, loading } = useAuth();
  const onboarded = useKStore((s) => s.onboarded);
  const t = useT();
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: "center" });
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  if (loading) return <div className="min-h-screen" style={{ background: BG }} />;
  if (session) return <Navigate to={onboarded ? "/app" : "/onboarding"} replace />;

  // Landing page is English-only by product decision (public marketing page).
  const slides = [
    {
      icon: Camera,
      image: slideScan,
      title: "AI Scanning",
      desc: "Snap a photo of your meal and our AI instantly identifies the food and breaks it down into calories and macros.",
    },
    {
      icon: LineChart,
      image: slideMacros,
      title: "Macro Tracking",
      desc: "See protein, carbs and fat at a glance with clean charts that keep you on track toward your daily goal.",
    },
    {
      icon: Sparkles,
      image: slideInsights,
      title: "Intelligent Health Insights",
      desc: "Visualize your progress with smart data trends. We analyze your long-term patterns to help you transform your health.",
    },
    {
      icon: Shield,
      image: slidePrivacy,
      title: "Privacy First",
      desc: "Your data stays yours. Encrypted in transit and at rest, with full GDPR rights — access, export or delete anytime.",
    },
  ];

  return (
    <div
      className="min-h-screen flex flex-col text-foreground"
      style={{ background: BG }}
    >
      <Seo
        title="ScanIQ — AI Nutrition & Fitness Tracker"
        description="Master your macros, transform your health. Scan meals with your camera, get macros in seconds — by Kinetex Intelligence."
        path="/"
      />

      {/* Top — logo at 2x size */}
      <header className="pt-10 pb-4 flex flex-col items-center">
        <img
          src={logo}
          alt="ScanIQ"
          className="w-28 h-28 sm:w-32 sm:h-32 object-contain"
        />
        <span
          className="mt-3 text-2xl font-bold tracking-[0.18em]"
          style={{ color: BRAND }}
        >
          ScanIQ
        </span>
      </header>

      {/* Hero */}
      <div className="px-6 text-center max-w-2xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight">
          Master your macros,
          <br />
          <span style={{ color: BRAND }}>transform your health.</span>
        </h1>
        <p className="mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed">
          Track every meal in seconds with AI-powered food scanning, macro insights, streaks, water tracking and personalized recipes — all in one simple app.
        </p>
      </div>

      {/* Center — horizontal PageView with 4 slides */}
      <div className="flex-1 flex flex-col justify-center py-8 min-h-0">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex">
            {slides.map(({ icon: Icon, image, title, desc }, i) => (
              <div key={i} className="min-w-0 shrink-0 grow-0 basis-full px-6">
                <div className="max-w-md mx-auto rounded-3xl bg-white border border-border/50 shadow-sm overflow-hidden text-center">
                  {/* Full-width rectangular illustration filling the top container */}
                  <div className="w-full aspect-[16/10] bg-[hsl(40_40%_97%)]">
                    <img
                      src={image}
                      alt={title}
                      loading="lazy"
                      width={1280}
                      height={800}
                      className="w-full h-full object-cover block"
                    />
                  </div>
                  <div className="p-6">
                    <div
                      className="w-10 h-10 mx-auto rounded-xl flex items-center justify-center mb-3"
                      style={{ background: "hsl(24 95% 53% / 0.12)" }}
                    >
                      <Icon className="w-5 h-5" style={{ color: BRAND_DARK }} />
                    </div>
                    <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                      {desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2 mt-5">
          {slides.map((_, i) => (
            <button
              key={i}
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => emblaApi?.scrollTo(i)}
              className="h-2 rounded-full transition-all"
              style={{
                width: selected === i ? 24 : 8,
                background: selected === i ? BRAND : "hsl(24 20% 80%)",
              }}
            />
          ))}
        </div>
      </div>

      {/* Bottom — fixed Sign up (orange) and Log in (outline) */}
      <div className="px-6 pb-6 pt-2 space-y-3 max-w-md mx-auto w-full">
        <Link to="/auth?mode=signup" className="block">
          <Button
            className="w-full h-12 rounded-2xl text-white text-base font-semibold shadow-[0_10px_30px_-8px_hsl(24_95%_55%/0.55)]"
            style={{ background: BRAND }}
          >
            Sign up
          </Button>
        </Link>
        <Link to="/auth" className="block">
          <Button
            variant="outline"
            className="w-full h-12 rounded-2xl bg-white border-border text-base font-semibold"
          >
            Log in
          </Button>
        </Link>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-white">
        <div className="max-w-md mx-auto px-6 py-5">
          <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
            <Link to="/pricing" className="hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">
              Terms of Service
            </Link>
            <Link to="/refund" className="hover:text-foreground transition-colors">
              Refund Policy
            </Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
          </nav>
          <p className="mt-3 text-center text-[11px] text-muted-foreground">
            © 2026 ScanIQ — a Kinetex Intelligence product. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Seo } from "@/components/Seo";
import {
  ScanLine,
  BarChart3,
  Droplets,
  Heart,
  Zap,
  ChevronRight,
  Apple,
  Trophy,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Seo
        title="ScanIQ"
        description="Scan din mad med ét billede. ScanIQ analyserer kalorier, makroer og sundhedsscore automatisk og hjælper dig med at nå dine mål."
        path="/"
      />

      {/* Hero */}
      <header className="max-w-2xl mx-auto px-6 pt-10 pb-16">
        <div className="flex items-center gap-3 mb-10">
          <Logo size={48} />
          <span className="text-2xl font-bold tracking-tight">ScanIQ</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.1] mb-5">
          Scan din mad.
          <br />
          <span className="text-[hsl(14_100%_55%)]">Få fuldt overblik.</span>
        </h1>

        <p className="text-lg text-muted-foreground leading-relaxed max-w-md mb-8">
          Tag et billede af dit måltid — vores AI genkender maden, beregner kalorier, makroer og
          sundhedsscore på få sekunder. Nemmere tracking findes ikke.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            to="/auth"
            className="inline-flex items-center justify-center gap-2 h-14 px-8 rounded-2xl bg-[hsl(14_100%_55%)] hover:bg-[hsl(14_100%_50%)] text-white font-bold text-base shadow-[0_10px_24px_-8px_hsl(14_100%_55%/0.6)] transition-colors"
          >
            Kom i gang
            <ChevronRight className="w-5 h-5" />
          </Link>
          <Link
            to="/pricing"
            className="inline-flex items-center justify-center gap-2 h-14 px-8 rounded-2xl bg-card border-[3px] border-foreground font-bold text-base shadow-[4px_4px_0_hsl(var(--foreground))] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_hsl(var(--foreground))] transition-all"
          >
            Se priser
          </Link>
        </div>
      </header>

      {/* Feature grid */}
      <section className="max-w-2xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-bold tracking-tight mb-6">
          Alt du behøver for at holde styr på din kost
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FeatureCard
            Icon={ScanLine}
            title="AI Mad-scanning"
            desc="Tag et billede — AI genkender ingredienser og beregner kalorier på sekunder."
          />
          <FeatureCard
            Icon={BarChart3}
            title="Kalorie-tracking"
            desc="Se dit daglige kaloriebudget, forbrug og resterende kcal i realtid."
          />
          <FeatureCard
            Icon={Apple}
            title="Makro-indsigter"
            desc="Følg protein, kulhydrat og fedt med visuelle målere og daglige mål."
          />
          <FeatureCard
            Icon={Heart}
            title="Sundhedsscore"
            desc="Få en helhedsvurdering af hvert måltid baseret på næringsindhold."
          />
          <FeatureCard
            Icon={Droplets}
            title="Vand-tracking"
            desc="Log dit vandindtag og hold dig hydreret hele dagen."
          />
          <FeatureCard
            Icon={Trophy}
            title="Streaks & Fremskridt"
            desc="Hold motivationen oppe med daglige streaks og ugesammenfatninger."
          />
        </div>
      </section>

      {/* How it works */}
      <section className="bg-card border-y-[3px] border-foreground">
        <div className="max-w-2xl mx-auto px-6 py-16">
          <h2 className="text-2xl font-bold tracking-tight mb-8 text-center">
            Så nemt er det
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Step number="1" title="Scan" desc="Tag et billede af din mad." />
            <Step number="2" title="Analyse" desc="AI beregner kalorier og makroer." />
            <Step number="3" title="Track" desc="Se dit forbrug og nå dine mål." />
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="max-w-2xl mx-auto px-6 py-16 text-center">
        <div className="k-card p-8 sm:p-10 bg-gradient-to-br from-[hsl(14_100%_60%)] to-[hsl(14_100%_50%)] text-white border-white/20">
          <Zap className="w-10 h-10 mx-auto mb-4 text-white" />
          <h2 className="text-2xl font-bold tracking-tight mb-3">
            Klar til at komme i gang?
          </h2>
          <p className="text-white/90 mb-6 max-w-sm mx-auto">
            Opret en gratis konto på under et minut. Opgrader når som helst til ScanIQ Pro for
            ubegrænset scanning og avancerede indsigter.
          </p>
          <Link
            to="/auth"
            className="inline-flex items-center justify-center gap-2 h-14 px-8 rounded-2xl bg-white text-[hsl(14_100%_55%)] font-bold text-base shadow-[0_8px_20px_-4px_rgba(0,0,0,0.2)] hover:bg-white/90 transition-colors"
          >
            Kom i gang gratis
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t-[3px] border-foreground bg-card">
        <div className="max-w-2xl mx-auto px-6 py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <Logo size={32} />
              <span className="text-sm font-semibold">ScanIQ</span>
            </div>

            <div className="flex items-center gap-5 text-sm text-muted-foreground flex-wrap justify-center">
              <Link to="/terms" className="hover:text-foreground underline-offset-4 hover:underline transition-colors">
                Terms of Service
              </Link>
              <Link to="/privacy" className="hover:text-foreground underline-offset-4 hover:underline transition-colors">
                Privacy Policy
              </Link>
              <Link to="/refund" className="hover:text-foreground underline-offset-4 hover:underline transition-colors">
                Refund Policy
              </Link>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-border/50 text-center text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} KCALLY (handelsnavn: ScanIQ). Alle rettigheder forbeholdes.
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  Icon,
  title,
  desc,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
}) {
  return (
    <div className="k-card p-5 flex flex-col gap-3 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_hsl(var(--foreground))] transition-all">
      <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <h3 className="font-bold text-base mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function Step({ number, title, desc }: { number: string; title: string; desc: string }) {
  return (
    <div className="text-center">
      <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-foreground text-background flex items-center justify-center text-lg font-extrabold border-[3px] border-foreground shadow-[3px_3px_0_hsl(var(--accent))]">
        {number}
      </div>
      <h3 className="font-bold text-base mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}

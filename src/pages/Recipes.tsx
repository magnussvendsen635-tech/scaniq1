import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChefHat, Sparkles } from "lucide-react";

export default function Recipes() {
  const nav = useNavigate();
  return (
    <div className="k-page pb-32">
      <header className="flex items-center gap-3 mb-8">
        <button
          onClick={() => nav(-1)}
          className="k-tap w-10 h-10 rounded-full bg-card border border-border/60 flex items-center justify-center"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-semibold tracking-tight">Opskrifter</h1>
      </header>

      <div className="k-card p-8 bg-gradient-surface relative overflow-hidden text-center">
        <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-gradient-primary opacity-20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-primary-glow/15 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col items-center">
          <div className="w-20 h-20 rounded-3xl bg-gradient-primary flex items-center justify-center shadow-glow mb-6">
            <ChefHat className="w-10 h-10 text-primary-foreground" strokeWidth={2.2} />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-card border border-border/60 mb-4">
            <Sparkles className="w-3.5 h-3.5 text-primary-glow" />
            <span className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">
              Coming soon
            </span>
          </div>

          <h2 className="text-2xl font-semibold tracking-tight mb-3">
            Recipes coming soon 🍽️
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
            We're building a premium recipe experience with healthy meals, world cuisine,
            smoothies, snacks & smart AI meal plans.
          </p>
          <p className="text-xs text-muted-foreground/70 mt-4 italic">
            Launching in a future update.
          </p>
        </div>
      </div>
    </div>
  );
}

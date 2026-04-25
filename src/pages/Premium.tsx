import { useNavigate } from "react-router-dom";
import { useKStore } from "@/store/useKStore";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Crown, Check, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const features = [
  "Unlimited food scans",
  "Advanced macro insights",
  "100+ premium workouts",
  "Custom meal plans",
  "Progress trends & exports",
  "Priority new features",
];

export default function Premium() {
  const nav = useNavigate();
  const { setPremium, premium } = useKStore();
  const [plan, setPlan] = useState<"month" | "lifetime">("lifetime");

  const upgrade = () => {
    setPremium(true);
    toast.success("Welcome to Premium 🎉", { description: "All features unlocked." });
    nav("/profile");
  };

  return (
    <div className="k-page">
      <header className="flex items-center gap-3 mb-6">
        <button onClick={() => nav(-1)} className="k-tap w-10 h-10 rounded-full bg-card border border-border/60 flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-semibold tracking-tight">Premium</h1>
      </header>

      <div className="k-card p-6 mb-5 bg-gradient-primary !border-transparent shadow-glow text-center">
        <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center mx-auto mb-3">
          <Crown className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-2xl font-semibold text-white">Unlock KCALLY Pro</h2>
        <p className="text-sm text-white/80 mt-1">Everything you need to reach your goal.</p>
      </div>

      <div className="space-y-2 mb-5">
        {features.map((f) => (
          <div key={f} className="k-card p-4 flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-gradient-soft flex items-center justify-center">
              <Check className="w-4 h-4 text-primary-glow" />
            </div>
            <span className="text-sm">{f}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <PlanOption
          active={plan === "month"}
          onClick={() => setPlan("month")}
          title="Monthly"
          price="$19"
          unit="/ month"
          sub="Cancel anytime"
        />
        <PlanOption
          active={plan === "lifetime"}
          onClick={() => setPlan("lifetime")}
          title="Lifetime"
          price="$189"
          unit="once"
          sub="Best value"
          badge="Save 80%"
        />
      </div>

      <Button
        onClick={upgrade}
        disabled={premium}
        className="w-full h-14 rounded-2xl bg-gradient-primary text-base font-semibold shadow-glow hover:opacity-90"
      >
        <Sparkles className="w-5 h-5 mr-2" />
        {premium ? "You're Premium" : "Upgrade now"}
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

import { Link, useNavigate } from "react-router-dom";
import { useKStore } from "@/store/useKStore";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Flame, Settings as SettingsIcon, RotateCcw, LogOut, Crown, ChevronRight } from "lucide-react";
import { toast } from "sonner";

const goalLabel = { lose: "Lose Fat", gain: "Gain Muscle", maintain: "Maintain" } as const;

export default function Profile() {
  const nav = useNavigate();
  const { user, streak, premium, resetDay, setOnboarded } = useKStore();

  return (
    <div className="k-page">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Profile</h1>
        <Logo size={36} />
      </header>

      {/* Hero */}
      <div className="k-card p-6 mb-4 bg-gradient-surface relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-gradient-primary opacity-20 blur-3xl" />
        <div className="relative flex items-center gap-4">
          <div className="w-16 h-16 rounded-3xl bg-gradient-primary flex items-center justify-center shadow-glow">
            <span className="text-2xl font-semibold text-white">K</span>
          </div>
          <div className="flex-1">
            <div className="text-xs text-muted-foreground tracking-widest uppercase">Goal</div>
            <div className="text-xl font-semibold">{goalLabel[user.goal]}</div>
          </div>
          <div className="flex flex-col items-center px-3 py-2 rounded-2xl bg-card border border-border/60">
            <Flame className="w-5 h-5 text-primary-glow" />
            <span className="text-lg font-semibold leading-tight">{streak}</span>
            <span className="text-[9px] uppercase tracking-widest text-muted-foreground">streak</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <Stat label="Weight" value={`${user.weight}`} unit="kg" />
        <Stat label="Calories" value={`${user.calories}`} unit="kcal" />
        <Stat label="Protein" value={`${user.protein}`} unit="g" />
      </div>

      {!premium && (
        <Link to="/premium" className="k-card k-tap p-5 mb-4 flex items-center gap-4 bg-gradient-primary !border-transparent shadow-glow">
          <div className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center">
            <Crown className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-white">Go Premium</div>
            <div className="text-xs text-white/70">Unlock unlimited features</div>
          </div>
          <ChevronRight className="w-5 h-5 text-white/80" />
        </Link>
      )}

      <div className="k-card divide-y divide-border/60 overflow-hidden">
        <Row Icon={SettingsIcon} title="Edit Settings" sub="Goals, macros, weight" onClick={() => nav("/settings")} />
        <Row
          Icon={RotateCcw}
          title="Reset Day"
          sub="Clear today's meals & workouts"
          onClick={() => {
            resetDay();
            toast.success("Day reset");
          }}
        />
        <Row
          Icon={LogOut}
          title="Logout"
          sub="Restart onboarding"
          danger
          onClick={() => {
            setOnboarded(false);
            nav("/onboarding", { replace: true });
          }}
        />
      </div>
    </div>
  );
}

const Stat = ({ label, value, unit }: { label: string; value: string; unit: string }) => (
  <div className="k-card p-4 text-center">
    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
    <div className="mt-1.5 flex items-baseline justify-center gap-1">
      <span className="text-xl font-semibold">{value}</span>
      <span className="text-[10px] text-muted-foreground">{unit}</span>
    </div>
  </div>
);

const Row = ({ Icon, title, sub, onClick, danger }: { Icon: any; title: string; sub: string; onClick: () => void; danger?: boolean }) => (
  <button onClick={onClick} className="w-full p-4 flex items-center gap-4 hover:bg-surface-2 transition-colors text-left">
    <div className={"w-10 h-10 rounded-2xl flex items-center justify-center " + (danger ? "bg-destructive/15" : "bg-gradient-soft")}>
      <Icon className={"w-4.5 h-4.5 " + (danger ? "text-destructive" : "text-primary-glow")} />
    </div>
    <div className="flex-1">
      <div className={"font-medium " + (danger ? "text-destructive" : "")}>{title}</div>
      <div className="text-xs text-muted-foreground">{sub}</div>
    </div>
    <ChevronRight className="w-4 h-4 text-muted-foreground" />
  </button>
);

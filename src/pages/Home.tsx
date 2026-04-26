import { Link } from "react-router-dom";
import { useKStore, caloriesToday, macrosToday, caloriesBurnedToday } from "@/store/useKStore";
import { Logo } from "@/components/Logo";
import { Ring } from "@/components/Ring";
import { Camera, Dumbbell, BarChart3, User, Flame, ChevronRight, Heart, Leaf, Sparkles } from "lucide-react";
import { useT } from "@/i18n/useT";
import { PremiumLock } from "@/components/PremiumLock";

export default function Home() {
  const t = useT();
  const { user, meals, workouts, streak, premium } = useKStore();
  const eaten = caloriesToday(meals);
  const burned = caloriesBurnedToday(workouts);
  const remaining = Math.max(0, user.calories - eaten + burned);
  const m = macrosToday(meals);
  const motivation = t("app.tagline");

  return (
    <div className="k-page">
      <header className="flex items-center justify-between mb-6">
        <Logo size={40} withText />
        <Link to="/profile" className="k-tap flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card border border-border/60">
          <Flame className="w-4 h-4 text-primary-glow" />
          <span className="text-sm font-semibold">{streak}</span>
        </Link>
      </header>

      <p className="text-sm text-muted-foreground mb-6 italic">{motivation}</p>

      {/* Hero ring card */}
      <div className="k-card p-6 mb-5 bg-gradient-surface relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-gradient-primary opacity-20 blur-3xl" />
        <div className="relative flex flex-col items-center">
          <Ring value={Math.min(1, eaten / Math.max(1, user.calories))} size={220}>
            <div className="text-center">
              <div className="text-5xl font-semibold tracking-tight k-gradient-text">{remaining}</div>
              <div className="text-xs text-muted-foreground mt-1 tracking-widest uppercase">{t("home.kcal_left")}</div>
            </div>
          </Ring>
          <div className="mt-6 grid grid-cols-3 w-full text-center">
            <Stat label={t("home.goal")} value={user.calories} />
            <Stat label={t("home.eaten")} value={eaten} accent />
            <Stat label={t("home.burned")} value={burned} />
          </div>
        </div>
      </div>

      {/* Macros */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <MacroBar label={t("home.protein")} value={m.protein} target={user.protein} />
        <MacroBar label={t("home.carbs")} value={m.carbs} target={user.carbs} />
        <MacroBar label={t("home.fat")} value={m.fat} target={user.fat} />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <ActionCard to="/scan" Icon={Camera} title={t("home.log_food")} sub={t("home.scan_meal")} gradient />
        <ActionCard to="/workouts" Icon={Dumbbell} title={t("home.workouts")} sub={t("home.burn_calories")} />
        <ActionCard to="/progress" Icon={BarChart3} title={t("home.progress")} sub={t("home.see_week")} />
        <ActionCard to="/profile" Icon={User} title={t("home.profile")} sub={t("home.settings_plan")} />
      </div>
    </div>
  );
}

const Stat = ({ label, value, accent = false }: { label: string; value: number; accent?: boolean }) => (
  <div>
    <div className={"text-xl font-semibold " + (accent ? "k-gradient-text" : "")}>{value}</div>
    <div className="text-[10px] tracking-widest uppercase text-muted-foreground">{label}</div>
  </div>
);

const MacroBar = ({ label, value, target }: { label: string; value: number; target: number }) => {
  const pct = Math.min(100, (value / Math.max(1, target)) * 100);
  return (
    <div className="k-card p-4">
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-xs text-muted-foreground">{Math.round(value)}/{target}g</span>
      </div>
      <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-primary rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

const ActionCard = ({ to, Icon, title, sub, gradient }: { to: string; Icon: any; title: string; sub: string; gradient?: boolean }) => (
  <Link
    to={to}
    className={
      "k-card k-tap p-5 flex flex-col gap-3 group " + (gradient ? "bg-gradient-primary !border-transparent shadow-glow" : "")
    }
  >
    <div className={"w-11 h-11 rounded-2xl flex items-center justify-center " + (gradient ? "bg-white/15" : "bg-gradient-soft")}>
      <Icon className={"w-5 h-5 " + (gradient ? "text-white" : "text-primary-glow")} />
    </div>
    <div>
      <div className={"font-semibold " + (gradient ? "text-white" : "")}>{title}</div>
      <div className={"text-xs " + (gradient ? "text-white/70" : "text-muted-foreground")}>{sub}</div>
    </div>
    <ChevronRight className={"w-4 h-4 ml-auto -mt-6 " + (gradient ? "text-white/70" : "text-muted-foreground")} />
  </Link>
);

import { useKStore } from "@/store/useKStore";
import { CalendarCheck, Target, Droplet, Scale } from "lucide-react";

export const WeeklyReport = () => {
  const { meals, water, waterGoal, weights, user, workouts } = useKStore();

  // Last 7 days
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    days.push(new Date(Date.now() - i * 86400000).toISOString().slice(0, 10));
  }

  // Days hit calorie goal (within ±15%)
  let goalHits = 0;
  let waterHits = 0;
  let mealsLogged = 0;
  let totalCal = 0;
  for (const d of days) {
    const dayMeals = meals.filter((m) => new Date(m.at).toISOString().slice(0, 10) === d);
    const cal = dayMeals.reduce((a, b) => a + b.calories, 0);
    totalCal += cal;
    mealsLogged += dayMeals.length;
    if (cal >= user.calories * 0.85 && cal <= user.calories * 1.15) goalHits++;
    const w = water[d] ?? 0;
    if (w >= waterGoal * 0.8) waterHits++;
  }

  // Weight change last 7 days
  const weekAgo = Date.now() - 7 * 86400000;
  const recent = [...weights].sort((a, b) => a.at - b.at);
  const oldest = recent.find((w) => w.at >= weekAgo) ?? recent[0];
  const newest = recent[recent.length - 1];
  const wDelta = newest && oldest ? newest.weight - oldest.weight : 0;

  const weekWorkouts = workouts.filter((w) => w.at >= weekAgo).length;
  const weekBurned = workouts.filter((w) => w.at >= weekAgo).reduce((a, b) => a + b.caloriesBurned, 0);

  return (
    <div className="k-card p-5 mb-4 bg-gradient-surface relative overflow-hidden">
      <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-gradient-primary opacity-10 blur-3xl" />
      <div className="relative">
        <div className="flex items-center gap-2 mb-4">
          <CalendarCheck className="w-4 h-4 text-primary-glow" />
          <h3 className="font-semibold">This week's summary</h3>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <Stat Icon={Target} label="Calorie goal hit" value={`${goalHits}/7`} sub="days" />
          <Stat Icon={Droplet} label="Water goal hit" value={`${waterHits}/7`} sub="days" />
          <Stat
            Icon={Scale}
            label="Weight change"
            value={`${wDelta > 0 ? "+" : ""}${wDelta.toFixed(1)}`}
            sub="kg"
          />
          <Stat Icon={Flame} label="Workouts" value={`${weekWorkouts}`} sub={`${weekBurned} kcal`} />
        </div>

        <div className="text-xs text-muted-foreground border-t border-border/60 pt-3">
          <span className="text-foreground font-semibold">{mealsLogged}</span> meals logged ·{" "}
          <span className="text-foreground font-semibold">{Math.round(totalCal / 7)}</span> kcal/day average
        </div>
      </div>
    </div>
  );
};

const Stat = ({ Icon, label, value, sub }: { Icon: any; label: string; value: string; sub: string }) => (
  <div className="rounded-2xl bg-card/60 border border-border/40 p-3">
    <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
      <Icon className="w-3 h-3" />
      {label}
    </div>
    <div className="text-xl font-semibold">{value}</div>
    <div className="text-[10px] text-muted-foreground">{sub}</div>
  </div>
);

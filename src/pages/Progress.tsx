import { useKStore } from "@/store/useKStore";
import { useT } from "@/i18n/useT";
import { PremiumLock } from "@/components/PremiumLock";
import { WeeklyReport } from "@/components/WeeklyReport";

export default function Progress() {
  const t = useT();
  const { meals, workouts, user, history, premium } = useKStore();

  // Build last 7 days
  const days: { label: string; date: string; cal: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const key = d.toISOString().slice(0, 10);
    const cal =
      meals.filter((m) => new Date(m.at).toISOString().slice(0, 10) === key).reduce((a, b) => a + b.calories, 0) ||
      history[key]?.calories ||
      0;
    days.push({ label: d.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 1), date: key, cal });
  }
  const max = Math.max(user.calories, ...days.map((d) => d.cal), 1);

  const totalWeek = days.reduce((a, b) => a + b.cal, 0);
  const avg = Math.round(totalWeek / 7);
  const burned = workouts.reduce((a, b) => a + b.caloriesBurned, 0);

  return (
    <div className="k-page">
      <h1 className="text-3xl font-semibold tracking-tight mb-6">{t("progress.title")}</h1>

      <WeeklyReport />

      {!premium ? (
        <PremiumLock>
          <div className="space-y-4">
            <div className="k-card p-5 bg-gradient-surface">
              <div className="flex items-baseline justify-between mb-4">
                <div>
                  <div className="text-xs text-muted-foreground tracking-widest uppercase">{t("progress.cal_7d")}</div>
                  <div className="text-3xl font-semibold k-gradient-text">—<span className="text-sm text-muted-foreground"> {t("progress.avg_per_day")}</span></div>
                </div>
                <div className="text-xs text-muted-foreground">{t("progress.goal")} {user.calories}</div>
              </div>
              <div className="flex items-end justify-between gap-2 h-40">
                {[40, 65, 50, 80, 45, 70, 90].map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full flex-1 flex items-end">
                      <div className={"w-full rounded-t-xl " + (i === 6 ? "bg-gradient-primary" : "bg-surface-3")} style={{ height: `${h}%` }} />
                    </div>
                    <span className="text-[10px] text-muted-foreground">·</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="k-card p-5">
              <div className="text-xs text-muted-foreground tracking-widest uppercase">{t("progress.weight")}</div>
              <div className="text-3xl font-semibold">—<span className="text-sm text-muted-foreground"> kg</span></div>
              <svg viewBox="0 0 300 80" className="w-full h-20 mt-3">
                <path d="M0,55 C40,45 80,60 120,40 C160,20 200,50 240,30 C260,22 280,28 300,20" stroke="hsl(var(--primary-glow))" strokeWidth="2" fill="none" strokeLinecap="round" />
              </svg>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <SummaryCard label={t("progress.week_total")} value="—" unit={t("common.kcal")} />
              <SummaryCard label={t("progress.workouts")} value="—" unit="" />
              <SummaryCard label={t("progress.meals_logged")} value="—" unit="" />
            </div>
          </div>
        </PremiumLock>
      ) : (
        <>
      {/* Calories per day chart */}
      <div className="k-card p-5 mb-4 bg-gradient-surface">
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <div className="text-xs text-muted-foreground tracking-widest uppercase">{t("progress.cal_7d")}</div>
            <div className="text-3xl font-semibold k-gradient-text">{avg}<span className="text-sm text-muted-foreground"> {t("progress.avg_per_day")}</span></div>
          </div>
          <div className="text-xs text-muted-foreground">{t("progress.goal")} {user.calories}</div>
        </div>
        <div className="flex items-end justify-between gap-2 h-40">
          {days.map((d, i) => {
            const h = Math.max(4, (d.cal / max) * 100);
            const isToday = i === days.length - 1;
            return (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex-1 flex items-end">
                  <div
                    className={"w-full rounded-t-xl transition-all duration-700 " + (isToday ? "bg-gradient-primary shadow-glow" : "bg-surface-3")}
                    style={{ height: `${h}%` }}
                  />
                </div>
                <span className={"text-[10px] " + (isToday ? "text-foreground font-semibold" : "text-muted-foreground")}>{d.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Weight chart */}
      <div className="k-card p-5 mb-4">
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <div className="text-xs text-muted-foreground tracking-widest uppercase">{t("progress.weight")}</div>
            <div className="text-3xl font-semibold">{user.weight}<span className="text-sm text-muted-foreground"> kg</span></div>
          </div>
        </div>
        <svg viewBox="0 0 300 80" className="w-full h-20">
          <defs>
            <linearGradient id="lg" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.5" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M0,55 C40,45 80,60 120,40 C160,20 200,50 240,30 C260,22 280,28 300,20 L300,80 L0,80 Z" fill="url(#lg)" />
          <path d="M0,55 C40,45 80,60 120,40 C160,20 200,50 240,30 C260,22 280,28 300,20" stroke="hsl(var(--primary-glow))" strokeWidth="2" fill="none" strokeLinecap="round" />
        </svg>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <SummaryCard label={t("progress.week_total")} value={`${totalWeek}`} unit={t("common.kcal")} />
        <SummaryCard label={t("progress.workouts")} value={`${workouts.length}`} unit="" />
        <SummaryCard label={t("progress.meals_logged")} value={`${meals.length}`} unit="" />
      </div>
        </>
      )}
    </div>
  );
}

const SummaryCard = ({ label, value, unit }: { label: string; value: string; unit: string }) => (
  <div className="k-card p-4">
    <div className="text-[10px] tracking-widest uppercase text-muted-foreground">{label}</div>
    <div className="mt-2 flex items-baseline gap-1">
      <span className="text-2xl font-semibold">{value}</span>
      {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
    </div>
  </div>
);

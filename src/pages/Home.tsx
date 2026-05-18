import { Link } from "react-router-dom";
import { useKStore, caloriesToday, macrosToday, caloriesBurnedToday } from "@/store/useKStore";
import { Logo } from "@/components/Logo";
import { Ring } from "@/components/Ring";
import { Camera, Dumbbell, BarChart3, User, Flame, ChevronRight, Heart, Leaf, Sparkles, ScanLine, Star, Scale, ChefHat } from "lucide-react";
import { useT } from "@/i18n/useT";
import { PremiumLock } from "@/components/PremiumLock";
import { StreakCard } from "@/components/StreakCard";
import { HealthScoreCard } from "@/components/HealthScoreCard";
import { HealthSyncCard } from "@/components/HealthSyncCard";
import { WaterCard } from "@/components/WaterCard";

import { RemindersCard } from "@/components/RemindersCard";

export default function Home() {
  const t = useT();
  const { user, meals, workouts, streak, premium } = useKStore();
  const eaten = caloriesToday(meals);
  const burned = caloriesBurnedToday(workouts);
  const remaining = Math.max(0, user.calories - eaten + burned);
  const m = macrosToday(meals);
  const motivation = t("app.tagline");
  const lastMeal = meals.length ? [...meals].sort((a, b) => b.at - a.at)[0] : null;
  const firstName = (user.name ?? "").trim().split(/\s+/)[0];
  const hour = new Date().getHours();
  const greet = hour < 10 ? "God morgen" : hour < 14 ? "God dag" : hour < 18 ? "God eftermiddag" : "God aften";

  return (
    <div className="k-page pb-32">
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <Logo size={40} withText={!firstName} />
          {firstName && (
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{greet}</div>
              <div className="text-base font-bold leading-tight truncate">{firstName} 👋</div>
            </div>
          )}
        </div>
        <Link to="/profile" className="k-tap flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card border border-border/60">
          <Flame className="w-4 h-4 text-primary-glow" />
          <span className="text-sm font-semibold">{streak}</span>
        </Link>
      </header>

      {/* PRIMARY CTA — AI food scan is the hero of the app */}
      <Link
        to="/scan?auto=1"
        className="k-tap relative block mb-5 rounded-3xl overflow-hidden bg-gradient-primary p-6 border-[3px] border-foreground shadow-[0_12px_32px_-8px_hsl(var(--primary)/0.55)] active:scale-[0.98] transition-transform"
      >
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-background/25 backdrop-blur flex items-center justify-center border-[3px] border-foreground shrink-0">
            <ScanLine className="w-8 h-8 text-foreground" strokeWidth={2.6} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-widest text-foreground/80 font-bold mb-0.5">Food scan</div>
            <div className="font-bold text-foreground text-xl leading-tight">
              {lastMeal ? "Tap to scan your food 📸" : "Scan your first meal 📸"}
            </div>
            {lastMeal && (
              <div className="text-xs text-foreground/85 mt-1 font-medium truncate">
                Last scan: {lastMeal.calories} kcal · {lastMeal.name}
              </div>
            )}
          </div>
        </div>
      </Link>

      <p className="text-xs text-muted-foreground mb-5 italic px-1">{motivation}</p>

      {/* Streak card */}
      <StreakCard />

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
          {/* Tracking progress bar */}
          <div className="mt-5 w-full">
            <div className="flex items-baseline justify-between mb-1.5">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                {Math.round(Math.min(100, (eaten / Math.max(1, user.calories)) * 100))}% {t("home.of_goal")}
              </span>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                {Math.max(0, user.calories - eaten)} {t("home.kcal_remaining")}
              </span>
            </div>
            <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-primary rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (eaten / Math.max(1, user.calories)) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Daily health verdict */}
      <HealthScoreCard />

      {/* Water tracking */}
      <WaterCard />





      {/* Macros */}
      {premium ? (
        <div className="grid grid-cols-3 gap-3 mb-5">
          <MacroBar label={t("home.protein")} value={m.protein} target={user.protein} />
          <MacroBar label={t("home.carbs")} value={m.carbs} target={user.carbs} />
          <MacroBar label={t("home.fat")} value={m.fat} target={user.fat} />
        </div>
      ) : (
        <div className="mb-5">
          <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2 px-1">{t("home.macros")}</div>
          <PremiumLock>
            <div className="grid grid-cols-3 gap-3">
              <MacroBar label={t("home.protein")} value={m.protein} target={user.protein} />
              <MacroBar label={t("home.carbs")} value={m.carbs} target={user.carbs} />
              <MacroBar label={t("home.fat")} value={m.fat} target={user.fat} />
            </div>
          </PremiumLock>
        </div>
      )}

      {/* Premium insights */}
      {!premium && (
        <div className="grid grid-cols-1 gap-3 mb-5">
          <PremiumLock>
            <InsightCard Icon={Heart} title={t("home.heart_healthy")} rows={[["Sodium", "—/2300mg"], ["Cholesterol", "—/300mg"], ["Sat. fat", "—/20g"]]} />
          </PremiumLock>
          <div className="grid grid-cols-2 gap-3">
            <PremiumLock>
              <InsightCard Icon={Leaf} title={t("home.low_carb")} rows={[["Net carbs", "—g"], ["Sugar", "—g"], ["Fiber", "—g"]]} />
            </PremiumLock>
            <PremiumLock>
              <InsightCard Icon={Sparkles} title={t("home.custom_overview")} rows={[["Carbs", "—g"], ["Fat", "—g"], ["Protein", "—g"]]} />
            </PremiumLock>
          </div>
        </div>
      )}

      {/* Quick add favorites */}
      <Link
        to="/favorites"
        className="k-card k-tap p-5 mb-3 flex items-center gap-4 bg-card group"
      >
        <div className="w-12 h-12 rounded-2xl bg-gradient-soft flex items-center justify-center shrink-0">
          <Star className="w-6 h-6 text-primary-glow" strokeWidth={2.5} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-foreground">Quick add</div>
          <div className="text-xs text-muted-foreground">Favorites & recent meals — one tap</div>
        </div>
        <ChevronRight className="w-5 h-5 text-foreground" />
      </Link>


      {/* Reminders */}
      <RemindersCard />

      {/* Health sync (Apple Health / Google Fit) */}
      <HealthSyncCard />

      {/* Quick actions — secondary features */}
      <div className="grid grid-cols-2 gap-3">
        <ActionCard to="/progress" Icon={BarChart3} title={t("home.progress")} sub={t("home.see_week")} />
        <ActionCard to="/weight" Icon={Scale} title="Weight" sub="Track & log progress" />
        <ActionCard to="/recipes" Icon={ChefHat} title="Recipes" sub="Browse & generate" />
        <ActionCard to="/workouts" Icon={Dumbbell} title={t("home.workouts")} sub={t("home.burn_calories")} />
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

const InsightCard = ({ Icon, title, rows }: { Icon: any; title: string; rows: [string, string][] }) => (
  <div className="k-card p-5">
    <div className="flex items-center gap-2 mb-3">
      <div className="w-8 h-8 rounded-xl bg-gradient-soft flex items-center justify-center">
        <Icon className="w-4 h-4 text-primary-glow" />
      </div>
      <span className="font-semibold text-sm">{title}</span>
    </div>
    <div className="space-y-2">
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{label}</span>
          <span className="font-medium">{value}</span>
        </div>
      ))}
    </div>
  </div>
);

const ActionCard = ({ to, Icon, title, sub }: { to: string; Icon: any; title: string; sub: string; gradient?: boolean }) => (
  <Link
    to={to}
    className="relative overflow-hidden rounded-3xl p-5 flex flex-col gap-4 group transition-all duration-300 active:scale-[0.97] bg-gradient-to-br from-[hsl(14_100%_60%)] via-[hsl(20_100%_58%)] to-[hsl(8_95%_55%)] shadow-[0_8px_24px_-6px_hsl(14_100%_55%/0.5),inset_0_1px_0_0_hsl(0_0%_100%/0.25)] border border-[hsl(0_0%_100%/0.15)]"
  >
    {/* Glossy highlight */}
    <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
    {/* Soft glow blob */}
    <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-white/15 rounded-full blur-2xl pointer-events-none" />

    <div className="relative w-11 h-11 rounded-2xl flex items-center justify-center bg-white/25 backdrop-blur-sm border border-white/30 shadow-inner">
      <Icon className="w-5 h-5 text-white" strokeWidth={2.5} />
    </div>
    <div className="relative">
      <div className="font-bold text-white text-base tracking-tight">{title}</div>
      <div className="text-xs text-white/85 font-medium mt-0.5">{sub}</div>
    </div>
    <ChevronRight className="relative w-5 h-5 ml-auto -mt-7 text-white transition-transform duration-300 group-hover:translate-x-1" strokeWidth={2.5} />
  </Link>
);


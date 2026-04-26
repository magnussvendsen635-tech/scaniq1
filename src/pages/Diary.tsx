import { Link } from "react-router-dom";
import { useKStore, caloriesToday, macrosToday } from "@/store/useKStore";
import { Camera, Heart } from "lucide-react";
import { useT } from "@/i18n/useT";

export default function Diary() {
  const t = useT();
  const { meals, user } = useKStore();
  const today = new Date().toISOString().slice(0, 10);
  const todayMeals = meals.filter((m) => new Date(m.at).toISOString().slice(0, 10) === today);
  const cal = caloriesToday(meals);
  const m = macrosToday(meals);

  return (
    <div className="k-page">
      <h1 className="text-3xl font-semibold tracking-tight mb-6">{t("diary.title")}</h1>

      <div className="k-card p-5 mb-5 bg-gradient-surface">
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <div className="text-xs text-muted-foreground tracking-widest uppercase">{t("common.today")}</div>
            <div className="text-4xl font-semibold k-gradient-text">{cal}<span className="text-base text-muted-foreground"> / {user.calories} {t("common.kcal")}</span></div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <T label={t("home.protein")} v={Math.round(m.protein)} />
          <T label={t("home.carbs")} v={Math.round(m.carbs)} />
          <T label={t("home.fat")} v={Math.round(m.fat)} />
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-muted-foreground tracking-widest uppercase">{t("diary.meals")}</h2>
        <Link to="/scan" className="k-tap text-sm font-semibold k-gradient-text">+ {t("common.add")}</Link>
      </div>

      {todayMeals.length === 0 ? (
        <Link to="/scan" className="k-card k-tap p-8 flex flex-col items-center text-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-soft flex items-center justify-center">
            <Camera className="w-6 h-6 text-primary-glow" />
          </div>
          <div className="font-semibold">{t("diary.no_meals")}</div>
          <div className="text-sm text-muted-foreground">{t("diary.no_meals_sub")}</div>
        </Link>
      ) : (
        <div className="space-y-3">
          {todayMeals.map((meal) => (
            <div key={meal.id} className="k-card p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-soft flex items-center justify-center shrink-0">
                <span className="text-lg font-semibold">{meal.name.charAt(0)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{meal.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  P {meal.protein}g · C {meal.carbs}g · F {meal.fat}g
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold">{meal.calories}</div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1 justify-end">
                  <Heart className="w-3 h-3" /> {meal.healthScore}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const T = ({ label, v }: { label: string; v: number }) => (
  <div className="text-center">
    <div className="text-lg font-semibold">{v}g</div>
    <div className="text-[10px] tracking-widest uppercase text-muted-foreground">{label}</div>
  </div>
);

import { Link } from "react-router-dom";
import { useKStore, caloriesToday, macrosToday, micronutrientsToday, type MealCategory } from "@/store/useKStore";
import { Camera, Heart, Sun, UtensilsCrossed, Moon, Cookie, Plus, Star, Trash2 } from "lucide-react";
import { useT } from "@/i18n/useT";
import { toast } from "sonner";

const CATEGORIES: { key: MealCategory; label: string; Icon: any }[] = [
  { key: "breakfast", label: "Breakfast", Icon: Sun },
  { key: "lunch", label: "Lunch", Icon: UtensilsCrossed },
  { key: "dinner", label: "Dinner", Icon: Moon },
  { key: "snack", label: "Snacks", Icon: Cookie },
];

export default function Diary() {
  const t = useT();
  const { meals, user, removeMeal } = useKStore();
  const today = new Date().toISOString().slice(0, 10);
  const todayMeals = meals.filter((m) => new Date(m.at).toISOString().slice(0, 10) === today);
  const cal = caloriesToday(meals);
  const m = macrosToday(meals);
  const micro = micronutrientsToday(meals);
  const hasMicro = micro.fiber + micro.sugar + micro.sodium + micro.saturatedFat + micro.cholesterol > 0;

  const grouped: Record<MealCategory, typeof todayMeals> = { breakfast: [], lunch: [], dinner: [], snack: [] };
  for (const meal of todayMeals) {
    const cat = (meal.category ?? "snack") as MealCategory;
    grouped[cat].push(meal);
  }

  return (
    <div className="k-page">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">{t("diary.title")}</h1>
        <Link to="/favorites" className="k-tap flex items-center gap-1.5 px-3 py-2 rounded-full bg-card border border-border/60 text-sm">
          <Star className="w-4 h-4 text-primary-glow" />
          <span className="font-medium">Quick add</span>
        </Link>
      </div>

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

      {hasMicro && (
        <div className="k-card p-4 mb-5">
          <div className="text-xs text-muted-foreground tracking-widest uppercase mb-3">{t("micro.title")}</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {micro.fiber > 0 && <MicroRow label={t("micro.fiber")} value={`${micro.fiber.toFixed(1)}g`} />}
            {micro.sugar > 0 && <MicroRow label={t("micro.sugar")} value={`${micro.sugar.toFixed(1)}g`} />}
            {micro.saturatedFat > 0 && <MicroRow label={t("micro.sat_fat")} value={`${micro.saturatedFat.toFixed(1)}g`} />}
            {micro.sodium > 0 && <MicroRow label={t("micro.sodium")} value={`${Math.round(micro.sodium)}mg`} />}
            {micro.cholesterol > 0 && <MicroRow label={t("micro.cholesterol")} value={`${Math.round(micro.cholesterol)}mg`} />}
          </div>
        </div>
      )}

      {todayMeals.length === 0 ? (
        <Link to="/scan" className="k-card k-tap p-8 flex flex-col items-center text-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-soft flex items-center justify-center">
            <Camera className="w-6 h-6 text-primary-glow" />
          </div>
          <div className="font-semibold">{t("diary.no_meals")}</div>
          <div className="text-sm text-muted-foreground">{t("diary.no_meals_sub")}</div>
        </Link>
      ) : (
        <div className="space-y-5">
          {CATEGORIES.map(({ key, label, Icon }) => {
            const list = grouped[key];
            const catCals = list.reduce((a, b) => a + b.calories, 0);
            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-2 px-1">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-gradient-soft flex items-center justify-center">
                      <Icon className="w-3.5 h-3.5 text-primary-glow" />
                    </div>
                    <span className="text-sm font-semibold">{label}</span>
                    {catCals > 0 && <span className="text-xs text-muted-foreground">· {catCals} kcal</span>}
                  </div>
                  <Link to="/scan" className="k-tap w-7 h-7 rounded-full bg-card border border-border/60 flex items-center justify-center">
                    <Plus className="w-3.5 h-3.5" />
                  </Link>
                </div>
                {list.length === 0 ? (
                  <Link to="/scan" className="k-card k-tap p-3 flex items-center justify-center text-xs text-muted-foreground border-dashed">
                    + Add {label.toLowerCase()}
                  </Link>
                ) : (
                  <div className="space-y-2">
                    {list.map((meal) => (
                      <div key={meal.id} className="k-card p-3 flex items-center gap-3 group">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-soft flex items-center justify-center shrink-0">
                          <span className="text-sm font-semibold">{meal.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{meal.name}</div>
                          <div className="text-[11px] text-muted-foreground mt-0.5">
                            P {meal.protein}g · C {meal.carbs}g · F {meal.fat}g
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-sm">{meal.calories}</div>
                          <div className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1 justify-end">
                            <Heart className="w-2.5 h-2.5" /> {meal.healthScore}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            removeMeal(meal.id);
                            toast.success("Meal removed");
                          }}
                          className="k-tap w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-60 hover:opacity-100"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
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

const MicroRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-medium">{value}</span>
  </div>
);

import { useNavigate } from "react-router-dom";
import { useKStore, categoryForNow } from "@/store/useKStore";
import { ArrowLeft, Star, Plus, Trash2, Heart } from "lucide-react";
import { toast } from "sonner";
import { useT } from "@/i18n/useT";

export default function Favorites() {
  const nav = useNavigate();
  const t = useT();
  const { favorites, removeFavorite, addMeal, meals } = useKStore();

  const recent = (() => {
    const seen = new Set<string>();
    const out: typeof meals = [];
    for (const m of meals) {
      const k = m.name.toLowerCase();
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(m);
      if (out.length >= 10) break;
    }
    return out;
  })();

  const quickAdd = (m: { name: string; calories: number; protein: number; carbs: number; fat: number; healthScore: number; fiber?: number; sugar?: number; sodium?: number; saturatedFat?: number; cholesterol?: number }) => {
    addMeal({
      id: crypto.randomUUID(),
      name: m.name,
      calories: m.calories,
      protein: m.protein,
      carbs: m.carbs,
      fat: m.fat,
      fiber: m.fiber,
      sugar: m.sugar,
      sodium: m.sodium,
      saturatedFat: m.saturatedFat,
      cholesterol: m.cholesterol,
      healthScore: m.healthScore,
      category: categoryForNow(),
      at: Date.now(),
    });
    toast.success(t("fav.added"), { description: `${m.name} · ${m.calories} kcal` });
  };

  return (
    <div className="k-page">
      <header className="flex items-center gap-3 mb-6">
        <button onClick={() => nav(-1)} className="k-tap w-10 h-10 rounded-full bg-card border border-border/60 flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-semibold tracking-tight flex-1">{t("fav.title")}</h1>
      </header>

      {/* Favorites */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3 px-1">
          <Star className="w-4 h-4 text-primary-glow" />
          <h2 className="text-sm font-medium text-muted-foreground tracking-widest uppercase">{t("fav.section")}</h2>
        </div>
        {favorites.length === 0 ? (
          <div className="k-card p-6 text-center text-sm text-muted-foreground">
            {t("fav.empty")}
          </div>
        ) : (
          <div className="space-y-2.5">
            {favorites.map((f) => (
              <div key={f.id} className="k-card p-4 flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-soft flex items-center justify-center shrink-0">
                  <span className="text-base font-semibold">{f.name.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{f.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {f.calories} kcal · P {f.protein}g · C {f.carbs}g · F {f.fat}g
                  </div>
                </div>
                <button onClick={() => quickAdd(f)} className="k-tap w-10 h-10 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow shrink-0">
                  <Plus className="w-4 h-4 text-foreground" strokeWidth={3} />
                </button>
                <button onClick={() => removeFavorite(f.id)} className="k-tap w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent */}
      {recent.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3 px-1">
            <Heart className="w-4 h-4 text-primary-glow" />
            <h2 className="text-sm font-medium text-muted-foreground tracking-widest uppercase">{t("fav.recent")}</h2>
          </div>
          <div className="space-y-2.5">
            {recent.map((m) => (
              <div key={m.id} className="k-card p-4 flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-soft flex items-center justify-center shrink-0">
                  <span className="text-base font-semibold">{m.name.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{m.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {m.calories} kcal · P {m.protein}g · C {m.carbs}g · F {m.fat}g
                  </div>
                </div>
                <button onClick={() => quickAdd(m)} className="k-tap w-10 h-10 rounded-2xl bg-card border border-border flex items-center justify-center shrink-0">
                  <Plus className="w-4 h-4" strokeWidth={2.5} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

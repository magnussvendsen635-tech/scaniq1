import { useEffect, useState } from "react";
import { useKStore, caloriesToday, macrosToday } from "@/store/useKStore";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, RefreshCw, Plus } from "lucide-react";
import { toast } from "sonner";
import { categoryForNow } from "@/store/useKStore";
import { useT } from "@/i18n/useT";

interface Suggestion {
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  healthScore: number;
}

export const MealSuggestions = () => {
  const t = useT();
  const { user, meals, addMeal, premium } = useKStore();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);

  const eaten = caloriesToday(meals);
  const m = macrosToday(meals);
  const remainingCal = Math.max(0, user.calories - eaten);
  const remainingProtein = Math.max(0, user.protein - m.protein);
  const remainingCarbs = Math.max(0, user.carbs - m.carbs);
  const remainingFat = Math.max(0, user.fat - m.fat);

  const fetchSuggestions = async () => {
    if (remainingCal < 100) {
      toast.info("You've hit your goal!", { description: "No more meals needed today." });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("meal-suggest", {
        body: {
          remainingCal,
          remainingProtein,
          remainingCarbs,
          remainingFat,
          diet: user.diet,
          mealType: categoryForNow(),
        },
      });
      if (error) throw error;
      setSuggestions(data.suggestions ?? []);
    } catch (err: any) {
      toast.error("Couldn't load suggestions", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (premium && remainingCal >= 100 && suggestions.length === 0) {
      fetchSuggestions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [premium]);

  const addSuggestion = (s: Suggestion) => {
    addMeal({
      id: crypto.randomUUID(),
      name: s.name,
      calories: s.calories,
      protein: s.protein,
      carbs: s.carbs,
      fat: s.fat,
      healthScore: s.healthScore,
      category: categoryForNow(),
      at: Date.now(),
    });
    toast.success("Added to diary", { description: `${s.name} · ${s.calories} kcal` });
    setSuggestions((prev) => prev.filter((x) => x.name !== s.name));
  };

  if (!premium) return null;
  if (remainingCal < 100) return null;

  return (
    <div className="k-card p-5 mb-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary-glow" />
          <h3 className="font-semibold text-sm">{t("meal.ideas_for_you")}</h3>
        </div>
        <button
          onClick={fetchSuggestions}
          disabled={loading}
          className="k-tap w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        {remainingCal} kcal · {remainingProtein}g protein left
      </p>

      {loading && suggestions.length === 0 && (
        <div className="space-y-2.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-2xl bg-surface-3 animate-pulse" />
          ))}
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="space-y-2.5">
          {suggestions.map((s) => (
            <div key={s.name} className="rounded-2xl border border-border/60 p-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{s.name}</div>
                <div className="text-[11px] text-muted-foreground line-clamp-1">{s.description}</div>
                <div className="text-[11px] text-muted-foreground mt-1">
                  {s.calories} kcal · P {s.protein}g · C {s.carbs}g · F {s.fat}g
                </div>
              </div>
              <button onClick={() => addSuggestion(s)} className="k-tap w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center shrink-0 shadow-glow">
                <Plus className="w-4 h-4 text-foreground" strokeWidth={3} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Search, Sparkles, Plus, Clock, Flame, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RECIPES, type Recipe } from "@/data/recipes";
import { useKStore, categoryForNow } from "@/store/useKStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "high-protein", label: "High protein" },
  { id: "low-carb", label: "Low carb" },
  { id: "low-cal", label: "Low cal" },
  { id: "vegetarian", label: "Vegetarian" },
  { id: "quick", label: "Quick" },
] as const;

export default function Recipes() {
  const { addMeal, language } = useKStore();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [open, setOpen] = useState<Recipe | null>(null);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const filtered = useMemo(() => {
    return RECIPES.filter((r) => {
      const matchQ = !q || r.name.toLowerCase().includes(q.toLowerCase()) || r.ingredients.join(" ").toLowerCase().includes(q.toLowerCase());
      const matchF = filter === "all" || r.tags.includes(filter as any);
      return matchQ && matchF;
    });
  }, [q, filter]);

  const logRecipe = (r: Recipe) => {
    addMeal({
      id: crypto.randomUUID(),
      name: r.name,
      calories: r.calories,
      protein: r.protein,
      carbs: r.carbs,
      fat: r.fat,
      healthScore: 8,
      at: Date.now(),
      category: categoryForNow(),
    });
    toast({ title: "Logged to diary", description: r.name });
    setOpen(null);
  };

  const generate = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("recipe-generate", {
        body: { prompt: aiPrompt, language },
      });
      if (error) throw error;
      const r = data?.recipe;
      if (!r) throw new Error("No recipe");
      const recipe: Recipe = {
        id: `ai-${Date.now()}`,
        name: r.name, emoji: r.emoji || "🍽️", category: r.category,
        tags: ["quick"], minutes: r.minutes, servings: r.servings,
        calories: r.calories, protein: r.protein, carbs: r.carbs, fat: r.fat,
        ingredients: r.ingredients, steps: r.steps,
      };
      setOpen(recipe);
      setAiPrompt("");
    } catch (e: any) {
      toast({ title: "AI error", description: e?.message ?? "Try again", variant: "destructive" });
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="px-5 pt-12 pb-3 flex items-center gap-3">
        <Link to="/" className="k-tap p-2 -ml-2 rounded-xl"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="text-2xl font-semibold">Recipes</h1>
      </div>

      <div className="px-5 space-y-3">
        {/* AI generator */}
        <div className="k-card p-4 border border-border/60 bg-gradient-to-br from-primary/10 to-transparent">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <div className="text-sm font-medium">AI Recipe Generator</div>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="e.g. high protein pasta under 600 kcal"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && generate()}
            />
            <Button onClick={generate} disabled={aiLoading || !aiPrompt.trim()}>
              {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Generate"}
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search recipes" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap border transition ${
                filter === f.id ? "bg-primary text-primary-foreground border-primary" : "border-border/60 text-muted-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="space-y-2 mt-3">
          {filtered.map((r) => (
            <button key={r.id} onClick={() => setOpen(r)} className="k-card k-tap p-3 w-full flex items-center gap-3 text-left">
              <div className="w-12 h-12 rounded-2xl bg-surface-2 flex items-center justify-center text-2xl">{r.emoji}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{r.name}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-3 mt-0.5">
                  <span className="flex items-center gap-1"><Flame className="w-3 h-3" />{r.calories} kcal</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{r.minutes}m</span>
                  <span>P{r.protein}</span>
                </div>
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-10">No recipes match your filters.</div>
          )}
        </div>
      </div>

      <Dialog open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          {open && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span className="text-2xl">{open.emoji}</span>{open.name}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-2 text-center">
                  {[
                    { l: "Cal", v: open.calories },
                    { l: "P", v: `${open.protein}g` },
                    { l: "C", v: `${open.carbs}g` },
                    { l: "F", v: `${open.fat}g` },
                  ].map((s) => (
                    <div key={s.l} className="rounded-xl bg-surface-2/40 p-2">
                      <div className="text-xs text-muted-foreground">{s.l}</div>
                      <div className="text-sm font-semibold">{s.v}</div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 text-xs text-muted-foreground">
                  <Badge variant="secondary">{open.category}</Badge>
                  <Badge variant="secondary">{open.minutes} min</Badge>
                  <Badge variant="secondary">{open.servings} serv</Badge>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Ingredients</div>
                  <ul className="text-sm space-y-1 list-disc pl-5">
                    {open.ingredients.map((i, n) => <li key={n}>{i}</li>)}
                  </ul>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Steps</div>
                  <ol className="text-sm space-y-1 list-decimal pl-5">
                    {open.steps.map((s, n) => <li key={n}>{s}</li>)}
                  </ol>
                </div>
                <Button className="w-full" onClick={() => logRecipe(open)}>
                  <Plus className="w-4 h-4 mr-1" /> Log to diary
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Search, Sparkles, Plus, Clock, Flame, Loader2, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RECIPES, type Recipe, type RecipeCategory, type RecipeTag } from "@/data/recipes";
import { useKStore, categoryForNow } from "@/store/useKStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const SECTIONS: { id: RecipeCategory; label: string }[] = [
  { id: "breakfast", label: "Morgenmad" },
  { id: "lunch", label: "Frokost" },
  { id: "dinner", label: "Aftensmad" },
  { id: "snack", label: "Mellemmåltid" },
];

const FILTERS: { id: "all" | RecipeTag; label: string }[] = [
  { id: "all", label: "Alle" },
  { id: "high-protein", label: "Højt protein" },
  { id: "low-carb", label: "Low carb" },
  { id: "low-cal", label: "Low cal" },
  { id: "vegetarian", label: "Vegetar" },
  { id: "quick", label: "Hurtige" },
];

// Faste farve-gradienter (semantiske tokens), valgt deterministisk pr. opskrift
const GRADIENTS = [
  "from-primary/30 via-primary/10 to-transparent",
  "from-accent/30 via-accent/10 to-transparent",
  "from-secondary/40 via-secondary/10 to-transparent",
  "from-primary/20 via-accent/15 to-transparent",
  "from-muted/40 via-muted/10 to-transparent",
];
const gradFor = (id: string) => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return GRADIENTS[h % GRADIENTS.length];
};

const RecipeCard = ({ r, onClick, size = "lg" }: { r: Recipe; onClick: () => void; size?: "lg" | "sm" }) => (
  <button
    onClick={onClick}
    className={`k-tap relative shrink-0 overflow-hidden rounded-2xl border border-border/60 bg-surface-2 text-left ${
      size === "lg" ? "w-44 h-56" : "w-36 h-44"
    }`}
  >
    <div className={`absolute inset-0 bg-gradient-to-br ${gradFor(r.id)}`} />
    <div className="absolute inset-0 flex items-center justify-center text-7xl opacity-90 drop-shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
      {r.emoji}
    </div>
    <div className="absolute top-2 left-2 text-[10px] uppercase tracking-widest text-foreground/80 bg-background/40 backdrop-blur px-2 py-0.5 rounded-full">
      {r.minutes} min
    </div>
    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-background/95 via-background/70 to-transparent">
      <div className="text-sm font-medium leading-tight line-clamp-2">{r.name}</div>
      <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-2">
        <Flame className="w-3 h-3" /> {r.calories} kcal
        <span>·</span>
        <span>P{r.protein}</span>
      </div>
    </div>
  </button>
);

export default function Recipes() {
  const { addMeal, language } = useKStore();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [seeAll, setSeeAll] = useState<RecipeCategory | "search" | null>(null);
  const [open, setOpen] = useState<Recipe | null>(null);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(60);

  const matches = (r: Recipe) => {
    const matchQ = !q || r.name.toLowerCase().includes(q.toLowerCase()) || r.ingredients.join(" ").toLowerCase().includes(q.toLowerCase());
    const matchF = filter === "all" || r.tags.includes(filter as RecipeTag);
    return matchQ && matchF;
  };

  const filtered = useMemo(() => RECIPES.filter(matches), [q, filter]);
  const bySection = useMemo(() => {
    const m: Record<RecipeCategory, Recipe[]> = { breakfast: [], lunch: [], dinner: [], snack: [] };
    for (const r of filtered) m[r.category].push(r);
    return m;
  }, [filtered]);

  const hot = useMemo(() => filtered.slice(0, 6), [filtered]);

  const isSearching = q.trim().length > 0 || filter !== "all";

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
    toast({ title: "Logget i dagbog", description: r.name });
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
      if (!r) throw new Error("Ingen opskrift");
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
      toast({ title: "AI fejl", description: e?.message ?? "Prøv igen", variant: "destructive" });
    } finally {
      setAiLoading(false);
    }
  };

  const gridList = seeAll && seeAll !== "search" ? bySection[seeAll] : filtered;

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="px-5 pt-12 pb-3 flex items-center gap-3">
        {seeAll ? (
          <button onClick={() => { setSeeAll(null); setVisibleCount(60); }} className="k-tap p-2 -ml-2 rounded-xl"><ArrowLeft className="w-5 h-5" /></button>
        ) : (
          <Link to="/" className="k-tap p-2 -ml-2 rounded-xl"><ArrowLeft className="w-5 h-5" /></Link>
        )}
        <h1 className="text-2xl font-semibold">
          {seeAll === "search" ? "Søgning" : seeAll ? SECTIONS.find((s) => s.id === seeAll)?.label : "Opskrifter"}
        </h1>
        <div className="ml-auto text-xs text-muted-foreground">{RECIPES.length}+</div>
      </div>

      {/* Søgning + filter */}
      <div className="px-5 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9 h-11 rounded-2xl bg-surface-2 border-border/60"
            placeholder="Find opskrifter"
            value={q}
            onChange={(e) => { setQ(e.target.value); if (e.target.value && !seeAll) setSeeAll("search"); if (!e.target.value && seeAll === "search") setSeeAll(null); }}
          />
          <SlidersHorizontal className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-primary" />
        </div>

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
      </div>

      {/* AI generator */}
      {!seeAll && (
        <div className="px-5 mt-4">
          <div className="k-card p-4 border border-border/60 bg-gradient-to-br from-primary/15 to-transparent">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <div className="text-sm font-medium">AI opskriftsgenerator</div>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="fx 'højt protein pasta under 600 kcal'"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && generate()}
              />
              <Button onClick={generate} disabled={aiLoading || !aiPrompt.trim()}>
                {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Generér"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Sektioner eller grid-view */}
      {!seeAll ? (
        <div className="mt-5 space-y-6">
          {/* Hot lige nu */}
          {hot.length > 0 && (
            <section>
              <div className="px-5 flex items-center justify-between mb-2">
                <h2 className="text-xs uppercase tracking-widest text-muted-foreground">Hot lige nu</h2>
              </div>
              <div className="flex gap-3 overflow-x-auto px-5 pb-2 snap-x">
                {hot.map((r) => (
                  <div key={r.id} className="snap-start">
                    <RecipeCard r={r} onClick={() => setOpen(r)} size="lg" />
                  </div>
                ))}
              </div>
            </section>
          )}

          {SECTIONS.map((s) => {
            const list = bySection[s.id];
            if (list.length === 0) return null;
            return (
              <section key={s.id}>
                <div className="px-5 flex items-center justify-between mb-2">
                  <h2 className="text-xs uppercase tracking-widest text-muted-foreground">{s.label}</h2>
                  <button onClick={() => { setSeeAll(s.id); setVisibleCount(60); }} className="text-xs text-primary font-medium">Se alle</button>
                </div>
                <div className="flex gap-3 overflow-x-auto px-5 pb-2 snap-x">
                  {list.slice(0, 12).map((r) => (
                    <div key={r.id} className="snap-start">
                      <RecipeCard r={r} onClick={() => setOpen(r)} size="sm" />
                    </div>
                  ))}
                </div>
              </section>
            );
          })}

          {filtered.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-10">Ingen opskrifter matcher.</div>
          )}
        </div>
      ) : (
        <div className="px-5 mt-4">
          <div className="grid grid-cols-2 gap-3">
            {gridList.slice(0, visibleCount).map((r) => (
              <RecipeCard key={r.id} r={r} onClick={() => setOpen(r)} size="sm" />
            ))}
          </div>
          {gridList.length > visibleCount && (
            <Button variant="outline" className="w-full mt-4" onClick={() => setVisibleCount((n) => n + 60)}>
              Vis flere ({gridList.length - visibleCount} tilbage)
            </Button>
          )}
          {gridList.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-10">Ingen opskrifter matcher.</div>
          )}
        </div>
      )}

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
                    { l: "Kcal", v: open.calories },
                    { l: "P", v: `${open.protein}g` },
                    { l: "K", v: `${open.carbs}g` },
                    { l: "F", v: `${open.fat}g` },
                  ].map((s) => (
                    <div key={s.l} className="rounded-xl bg-surface-2/40 p-2">
                      <div className="text-xs text-muted-foreground">{s.l}</div>
                      <div className="text-sm font-semibold">{s.v}</div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 flex-wrap text-xs text-muted-foreground">
                  <Badge variant="secondary">{open.category}</Badge>
                  <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />{open.minutes} min</Badge>
                  {open.tags.map((t) => <Badge key={t} variant="outline">{t}</Badge>)}
                </div>
                <div>
                  <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Ingredienser</div>
                  <ul className="text-sm space-y-1 list-disc pl-5">
                    {open.ingredients.map((i, n) => <li key={n}>{i}</li>)}
                  </ul>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Sådan gør du</div>
                  <ol className="text-sm space-y-1 list-decimal pl-5">
                    {open.steps.map((s, n) => <li key={n}>{s}</li>)}
                  </ol>
                </div>
                <Button className="w-full" onClick={() => logRecipe(open)}>
                  <Plus className="w-4 h-4 mr-1" /> Log i dagbog
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

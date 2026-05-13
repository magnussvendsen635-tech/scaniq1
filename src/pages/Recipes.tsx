import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft, Search, Sparkles, Plus, Clock, Flame, Loader2, Thermometer, Users,
  Crown, Lock, ChevronRight, Dumbbell, Leaf, Zap, Heart, Target, Salad, Beef, Apple,
  GlassWater, IceCream, CupSoda, Package,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RECIPES, type Recipe, type RecipeTag } from "@/data/recipes";
import { useKStore, categoryForNow } from "@/store/useKStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { recipeImage } from "@/lib/recipeImage";
import { useSubscription } from "@/hooks/useSubscription";

type Goal =
  | "lose-fat" | "build-muscle" | "eat-healthier" | "high-protein"
  | "low-cal" | "keto" | "vegetarian" | "fast";

const GOALS: { id: Goal; label: string; icon: any; gradient: string }[] = [
  { id: "lose-fat",     label: "Tab fedt",       icon: Flame,    gradient: "from-accent/30 to-accent/5" },
  { id: "build-muscle", label: "Byg muskler",    icon: Dumbbell, gradient: "from-primary/25 to-primary/5" },
  { id: "eat-healthier",label: "Spis sundere",   icon: Heart,    gradient: "from-accent/25 to-primary/5" },
  { id: "high-protein", label: "Højt protein",   icon: Beef,     gradient: "from-primary/30 to-accent/10" },
  { id: "low-cal",      label: "Lav kalorie",    icon: Target,   gradient: "from-accent/20 to-accent/5" },
  { id: "keto",         label: "Keto",           icon: Zap,      gradient: "from-primary/25 to-accent/10" },
  { id: "vegetarian",   label: "Vegetar",        icon: Leaf,     gradient: "from-accent/20 to-primary/5" },
  { id: "fast",         label: "Hurtige måltider", icon: Apple,  gradient: "from-accent/30 to-primary/10" },
];

type Category = {
  id: string;
  label: string;
  sub: string;
  filter: (r: Recipe) => boolean;
  hero: string; // unsplash photo id
  icon: any;
};

const CATEGORIES: Category[] = [
  { id: "vitality",    label: "Vitality",      sub: "Energi & velvære",      filter: (r) => r.tags.includes("low-cal") || r.calories < 380, hero: "photo-1490474504059-bf2db5ab2348", icon: Heart },
  { id: "high-protein",label: "Højt protein",  sub: "30g+ protein",           filter: (r) => r.protein >= 28, hero: "photo-1532550907401-a500c9a57435", icon: Beef },
  { id: "low-cal",     label: "Lav kalorie",   sub: "Under 400 kcal",         filter: (r) => r.calories <= 400, hero: "photo-1512621776951-a57141f2eefd", icon: Target },
  { id: "muscle",      label: "Muskelopbygning", sub: "Højt protein + carbs", filter: (r) => r.protein >= 24 && r.calories >= 450, hero: "photo-1546964124-0cce460f38ef", icon: Dumbbell },
  { id: "snacks",      label: "Sunde snacks",  sub: "Smart i farten",         filter: (r) => r.category === "snack", hero: "photo-1606312619070-d48b4c652a52", icon: Apple },
  { id: "quick",       label: "Hurtige måltider", sub: "Under 15 min",        filter: (r) => r.minutes <= 12, hero: "photo-1551183053-bf91a1d81141", icon: Zap },
  { id: "vegetarian",  label: "Vegetar",       sub: "Plantebaseret",          filter: (r) => r.tags.includes("vegetarian"), hero: "photo-1540420773420-3366772f4999", icon: Leaf },
  { id: "keto",        label: "Keto",          sub: "Low carb, high fat",     filter: (r) => r.tags.includes("low-carb") && r.fat >= 14, hero: "photo-1565958011703-44f9829ba187", icon: Flame },
];

const goalFilter: Record<Goal, (r: Recipe) => boolean> = {
  "lose-fat":      (r) => r.calories <= 420 && r.protein >= 20,
  "build-muscle":  (r) => r.protein >= 28 && r.calories >= 450,
  "eat-healthier": (r) => r.calories <= 500 && (r.tags.includes("vegetarian") || r.protein >= 18),
  "high-protein":  (r) => r.protein >= 28,
  "low-cal":       (r) => r.calories <= 380,
  "keto":          (r) => r.tags.includes("low-carb") && r.fat >= 14,
  "vegetarian":    (r) => r.tags.includes("vegetarian"),
  "fast":          (r) => r.minutes <= 12,
};

const heroUrl = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

/* ---------------- Recipe Card ---------------- */

function RecipeCard({
  r, onClick, size = "lg", locked,
}: {
  r: Recipe; onClick: () => void; size?: "lg" | "sm" | "row"; locked?: boolean;
}) {
  const w = size === "row" ? 360 : size === "lg" ? 500 : 360;
  const img = recipeImage(r.name, w);
  const dim =
    size === "row" ? "w-full h-28"
    : size === "lg" ? "w-56 h-72"
    : "w-44 h-60";

  return (
    <button
      onClick={onClick}
      className={`k-tap relative shrink-0 overflow-hidden rounded-3xl border-2 border-foreground/10 bg-surface text-left shadow-[0_6px_20px_-10px_hsl(var(--foreground)/0.25)] ${dim} ${size === "row" ? "flex" : ""}`}
    >
      {size === "row" ? (
        <>
          <div className="relative w-28 h-28 shrink-0">
            <img src={img} alt={r.name} loading="lazy" className={`w-full h-full object-cover ${locked ? "blur-md scale-110" : ""}`} />
          </div>
          <div className="flex-1 p-3 flex flex-col justify-center min-w-0">
            <div className="text-sm font-semibold leading-tight truncate">{r.name}</div>
            <div className="mt-1 text-[11px] text-muted-foreground flex items-center gap-2">
              <span className="inline-flex items-center gap-1"><Flame className="w-3 h-3" /> {r.calories}</span>
              <span>·</span>
              <span>{r.protein}g protein</span>
              <span>·</span>
              <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" /> {r.minutes}m</span>
            </div>
          </div>
          {locked && <LockBadge corner />}
        </>
      ) : (
        <>
          <img src={img} alt={r.name} loading="lazy" className={`absolute inset-0 w-full h-full object-cover ${locked ? "blur-md scale-110" : ""}`} />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/85 via-foreground/15 to-transparent" />
          <div className="absolute top-2 left-2 inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-widest bg-background/85 backdrop-blur px-2 py-1 rounded-full text-foreground border border-foreground/10">
            <Clock className="w-3 h-3" /> {r.minutes} min
          </div>
          {r.protein >= 25 && (
            <div className="absolute top-2 right-2 text-[10px] font-bold uppercase tracking-widest bg-accent text-accent-foreground px-2 py-1 rounded-full border border-foreground/10">
              {r.protein}g P
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 p-3 text-background">
            <div className={`font-semibold leading-tight line-clamp-2 ${size === "lg" ? "text-base" : "text-sm"}`}>{r.name}</div>
            <div className="text-[11px] opacity-90 mt-1 flex items-center gap-1">
              <Flame className="w-3 h-3" /> {r.calories} kcal
            </div>
          </div>
          {locked && <LockOverlay />}
        </>
      )}
    </button>
  );
}

function LockBadge({ corner }: { corner?: boolean }) {
  return (
    <div className={`absolute ${corner ? "top-2 right-2" : "top-2 right-2"} w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center shadow-lg`}>
      <Lock className="w-3.5 h-3.5" />
    </div>
  );
}

function LockOverlay() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/30 backdrop-blur-[2px]">
      <div className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center shadow-xl">
        <Lock className="w-4 h-4" />
      </div>
      <div className="text-[10px] uppercase tracking-widest font-semibold text-background bg-foreground/80 px-2 py-1 rounded-full">
        Premium
      </div>
    </div>
  );
}

/* ---------------- Page ---------------- */

export default function Recipes() {
  const { addMeal, language } = useKStore();
  const { isActive: isPremium } = useSubscription();
  const [q, setQ] = useState("");
  const [view, setView] = useState<{ kind: "category"; cat: Category } | { kind: "goal"; goal: Goal } | { kind: "search" } | null>(null);
  const [open, setOpen] = useState<Recipe | null>(null);
  const [quizOpen, setQuizOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [visible, setVisible] = useState(40);

  // Premium gate: lock ~40% of catalogue (deterministic by id hash)
  const isLocked = (r: Recipe) => {
    if (isPremium) return false;
    let h = 0;
    for (let i = 0; i < r.id.length; i++) h = (h * 31 + r.id.charCodeAt(i)) >>> 0;
    return (h % 10) >= 2; // 80% locked behind premium
  };

  const filteredByQ = useMemo(() => {
    if (!q.trim()) return RECIPES;
    const k = q.toLowerCase();
    return RECIPES.filter((r) => r.name.toLowerCase().includes(k) || r.ingredients.join(" ").toLowerCase().includes(k));
  }, [q]);

  const featured = useMemo(() => RECIPES.filter((r) => r.protein >= 25 && r.minutes <= 20).slice(0, 8), []);

  const openRecipe = (r: Recipe) => {
    if (isLocked(r)) {
      toast({ title: "Premium opskrift", description: "Opgrader for at låse op for alle opskrifter." });
      return;
    }
    setOpen(r);
  };

  const logRecipe = (r: Recipe) => {
    addMeal({
      id: crypto.randomUUID(), name: r.name,
      calories: r.calories, protein: r.protein, carbs: r.carbs, fat: r.fat,
      healthScore: 8, at: Date.now(), category: categoryForNow(),
    });
    toast({ title: "Logget i dagbog", description: r.name });
    setOpen(null);
  };

  const generate = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("recipe-generate", { body: { prompt: aiPrompt, language } });
      if (error) throw error;
      const r = data?.recipe;
      if (!r) throw new Error("Ingen opskrift");
      setOpen({
        id: `ai-${Date.now()}`, name: r.name, emoji: r.emoji || "🍽️", category: r.category,
        tags: ["quick"], minutes: r.minutes, servings: r.servings,
        calories: r.calories, protein: r.protein, carbs: r.carbs, fat: r.fat,
        ingredients: r.ingredients, steps: r.steps,
      });
      setAiPrompt("");
    } catch (e: any) {
      toast({ title: "AI fejl", description: e?.message ?? "Prøv igen", variant: "destructive" });
    } finally {
      setAiLoading(false);
    }
  };

  /* --------- Category / Goal / Search view --------- */
  if (view) {
    const list =
      view.kind === "category" ? RECIPES.filter(view.cat.filter)
      : view.kind === "goal" ? RECIPES.filter(goalFilter[view.goal])
      : filteredByQ;
    const title =
      view.kind === "category" ? view.cat.label
      : view.kind === "goal" ? GOALS.find((g) => g.id === view.goal)?.label ?? "Plan"
      : "Søgning";
    const sub =
      view.kind === "category" ? view.cat.sub
      : view.kind === "goal" ? "Anbefalede opskrifter til dit mål"
      : `${list.length} resultater`;
    const heroId =
      view.kind === "category" ? view.cat.hero
      : view.kind === "goal" ? CATEGORIES.find((c) => c.id === view.goal)?.hero ?? "photo-1546069901-ba9599a7e63c"
      : "photo-1546069901-ba9599a7e63c";

    return (
      <div className="min-h-screen bg-background pb-28">
        <div className="relative h-56">
          <img src={heroUrl(heroId, 1400)} alt={title} className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-background/10" />
          <button onClick={() => { setView(null); setVisible(40); }} className="absolute top-10 left-4 k-tap w-10 h-10 rounded-full bg-background/90 backdrop-blur border-2 border-foreground/10 flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="absolute bottom-4 left-5 right-5">
            <div className="text-xs uppercase tracking-widest text-foreground/70 font-semibold">{sub}</div>
            <h1 className="text-3xl font-bold mt-1">{title}</h1>
            <div className="text-xs text-muted-foreground mt-1">{list.length} opskrifter</div>
          </div>
        </div>

        <div className="px-5 mt-5 space-y-3">
          {list.slice(0, visible).map((r) => (
            <RecipeCard key={r.id} r={r} onClick={() => openRecipe(r)} size="row" locked={isLocked(r)} />
          ))}
          {list.length > visible && (
            <Button variant="outline" className="w-full rounded-2xl border-2 border-foreground/15" onClick={() => setVisible((n) => n + 40)}>
              Vis flere ({list.length - visible} tilbage)
            </Button>
          )}
          {list.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-10">Ingen opskrifter matcher.</div>
          )}

          {!isPremium && (
            <UpgradeBanner />
          )}
        </div>

        <RecipeDialog open={open} setOpen={setOpen} logRecipe={logRecipe} />
      </div>
    );
  }

  /* --------- Main page --------- */
  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="px-5 pt-12 pb-3 flex items-center gap-3">
        <Link to="/" className="k-tap p-2 -ml-2 rounded-xl"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="text-2xl font-bold">Opskrifter</h1>
        <div className="ml-auto text-xs text-muted-foreground">{RECIPES.length}+</div>
      </div>

      {/* Search */}
      <div className="px-5">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-10 h-12 rounded-2xl bg-surface border-2 border-foreground/10"
            placeholder="Søg opskrifter, ingredienser…"
            value={q}
            onChange={(e) => { setQ(e.target.value); if (e.target.value) setView({ kind: "search" }); }}
          />
        </div>
      </div>

      {/* Find your plan – hero */}
      <section className="px-5 mt-5">
        <div className="relative overflow-hidden rounded-3xl border-2 border-foreground/15 bg-foreground text-background">
          <img
            src={heroUrl("photo-1490645935967-10de6ba17061", 1200)}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-foreground/90 via-foreground/70 to-accent/40" />
          <div className="relative p-5">
            <div className="text-[10px] uppercase tracking-widest font-semibold opacity-90 inline-flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> AI Plan Finder
            </div>
            <h2 className="text-2xl font-bold mt-1 leading-tight">Find din plan</h2>
            <p className="text-sm opacity-90 mt-1">Svar på et hurtigt quiz – få opskrifter der matcher dit mål.</p>
            <button
              onClick={() => setQuizOpen(true)}
              className="k-tap mt-4 inline-flex items-center gap-2 bg-accent text-accent-foreground font-semibold px-4 py-2.5 rounded-full border-2 border-background/0 shadow-lg"
            >
              Start quiz <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Goal chips */}
      <section className="mt-5">
        <div className="px-5 flex items-center justify-between mb-2">
          <h2 className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Vælg dit mål</h2>
        </div>
        <div className="flex gap-3 overflow-x-auto px-5 pb-2 snap-x">
          {GOALS.map((g) => {
            const Icon = g.icon;
            return (
              <button
                key={g.id}
                onClick={() => { setView({ kind: "goal", goal: g.id }); setVisible(40); }}
                className={`k-tap snap-start shrink-0 w-36 h-28 rounded-2xl border-2 border-foreground/10 bg-gradient-to-br ${g.gradient} text-left p-3 flex flex-col justify-between`}
              >
                <Icon className="w-5 h-5 text-foreground" />
                <div>
                  <div className="text-sm font-semibold leading-tight">{g.label}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">Tryk for opskrifter</div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Featured */}
      <section className="mt-5">
        <div className="px-5 flex items-center justify-between mb-2">
          <h2 className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Anbefalet til dig</h2>
        </div>
        <div className="flex gap-3 overflow-x-auto px-5 pb-2 snap-x">
          {featured.map((r) => (
            <div key={r.id} className="snap-start">
              <RecipeCard r={r} onClick={() => openRecipe(r)} size="lg" locked={isLocked(r)} />
            </div>
          ))}
        </div>
      </section>

      {/* Categories grid */}
      <section className="mt-5 px-5">
        <h2 className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-3">Kategorier</h2>
        <div className="grid grid-cols-2 gap-3">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => { setView({ kind: "category", cat: c }); setVisible(40); }}
              className="k-tap relative h-36 rounded-3xl overflow-hidden border-2 border-foreground/15 text-left"
            >
              <img src={heroUrl(c.hero, 600)} alt={c.label} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/85 via-foreground/30 to-transparent" />
              <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-background/90 backdrop-blur flex items-center justify-center border border-foreground/10">
                <c.icon className="w-4 h-4 text-foreground" />
              </div>
              <div className="absolute bottom-3 left-3 right-3 text-background">
                <div className="text-base font-bold leading-tight">{c.label}</div>
                <div className="text-[11px] opacity-90">{c.sub}</div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* AI generator */}
      <section className="mt-5 px-5">
        <div className="rounded-3xl p-4 border-2 border-foreground/15 bg-gradient-to-br from-accent/15 via-surface to-surface">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-accent" />
            <div className="text-sm font-semibold">AI opskriftsgenerator</div>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="fx 'højt protein pasta under 600 kcal'"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && generate()}
              className="rounded-2xl border-2 border-foreground/10"
            />
            <Button onClick={generate} disabled={aiLoading || !aiPrompt.trim()} className="rounded-2xl">
              {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Generér"}
            </Button>
          </div>
        </div>
      </section>

      {!isPremium && (
        <div className="px-5 mt-5">
          <UpgradeBanner />
        </div>
      )}

      {/* Quiz Dialog */}
      <Dialog open={quizOpen} onOpenChange={setQuizOpen}>
        <DialogContent className="max-w-md rounded-3xl border-2 border-foreground/15">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent" /> Find din plan
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground -mt-2">Hvad er dit mål lige nu? Vi viser dig opskrifter der matcher.</p>
          <div className="grid grid-cols-2 gap-3 mt-3">
            {GOALS.map((g) => {
              const Icon = g.icon;
              return (
                <button
                  key={g.id}
                  onClick={() => { setQuizOpen(false); setView({ kind: "goal", goal: g.id }); setVisible(40); }}
                  className={`k-tap rounded-2xl border-2 border-foreground/10 bg-gradient-to-br ${g.gradient} p-3 text-left h-24 flex flex-col justify-between`}
                >
                  <Icon className="w-5 h-5" />
                  <div className="text-sm font-semibold leading-tight">{g.label}</div>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      <RecipeDialog open={open} setOpen={setOpen} logRecipe={logRecipe} />
    </div>
  );
}

/* ---------------- Upgrade banner ---------------- */

function UpgradeBanner() {
  return (
    <Link
      to="/premium"
      className="k-tap relative block overflow-hidden rounded-3xl border-2 border-foreground/15 p-5 bg-foreground text-background"
    >
      <img src={heroUrl("photo-1490645935967-10de6ba17061", 800)} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
      <div className="absolute inset-0 bg-gradient-to-br from-foreground/90 to-accent/30" />
      <div className="relative flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-accent text-accent-foreground flex items-center justify-center shadow-lg">
          <Crown className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-widest font-semibold opacity-90">Lås alle opskrifter op</div>
          <div className="text-base font-bold leading-tight">Unlock all recipes</div>
          <div className="text-xs opacity-80 mt-0.5">Få ubegrænset adgang til 2.000+ opskrifter</div>
        </div>
        <div className="bg-accent text-accent-foreground font-semibold text-sm px-3 py-2 rounded-full whitespace-nowrap">
          Get Premium
        </div>
      </div>
    </Link>
  );
}

/* ---------------- Recipe Detail ---------------- */

function RecipeDialog({
  open, setOpen, logRecipe,
}: {
  open: Recipe | null;
  setOpen: (r: Recipe | null) => void;
  logRecipe: (r: Recipe) => void;
}) {
  return (
    <Dialog open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
      <DialogContent className="max-w-md max-h-[88vh] overflow-y-auto p-0 rounded-3xl border-2 border-foreground/15">
        {open && (
          <>
            <div className="relative h-56">
              <img src={recipeImage(open.name, 900)} alt={open.name} className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
              <div className="absolute bottom-3 left-4 right-4">
                <DialogHeader className="text-left">
                  <DialogTitle className="text-2xl font-bold">{open.name}</DialogTitle>
                </DialogHeader>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-4 gap-2 text-center">
                {[
                  { l: "Kcal", v: open.calories },
                  { l: "P", v: `${open.protein}g` },
                  { l: "K", v: `${open.carbs}g` },
                  { l: "F", v: `${open.fat}g` },
                ].map((s) => (
                  <div key={s.l} className="rounded-2xl bg-surface-2/60 border-2 border-foreground/10 p-2">
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{s.l}</div>
                    <div className="text-sm font-bold">{s.v}</div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 flex-wrap text-xs">
                <Badge variant="secondary" className="rounded-full">{open.category}</Badge>
                <Badge variant="secondary" className="rounded-full"><Clock className="w-3 h-3 mr-1" />{open.minutes} min</Badge>
                {open.tags.map((t) => <Badge key={t} variant="outline" className="rounded-full">{t}</Badge>)}
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">Ingredienser</div>
                <ul className="text-sm space-y-1 list-disc pl-5">
                  {open.ingredients.map((i, n) => <li key={n}>{i}</li>)}
                </ul>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">Sådan gør du</div>
                <ol className="text-sm space-y-1 list-decimal pl-5">
                  {open.steps.map((s, n) => <li key={n}>{s}</li>)}
                </ol>
              </div>
              <Button className="w-full rounded-2xl" onClick={() => logRecipe(open)}>
                <Plus className="w-4 h-4 mr-1" /> Log i dagbog
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

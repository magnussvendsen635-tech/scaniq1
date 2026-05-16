import { useMemo, useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft, Search, Sparkles, Plus, Clock, Flame, Loader2, Thermometer, Users,
  Crown, Lock, ChevronRight, Dumbbell, Leaf, Zap, Heart, Target, Beef, Apple,
  GlassWater, IceCream, CupSoda, Package, Sun, Sandwich, ChefHat, Cookie, Globe2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RECIPES, type Recipe } from "@/data/recipes";
import { useKStore, categoryForNow } from "@/store/useKStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { recipeImage } from "@/lib/recipeImage";
import { useSubscription } from "@/hooks/useSubscription";

/* ================== TYPES ================== */

type FilterId =
  | "all" | "high-protein" | "low-cal" | "mealprep"
  | "weight-loss" | "muscle-gain" | "under-15" | "vegetarian";

const FILTERS: { id: FilterId; label: string; test: (r: Recipe) => boolean }[] = [
  { id: "all",          label: "Alle",          test: () => true },
  { id: "high-protein", label: "Højt protein",  test: (r) => r.protein >= 28 },
  { id: "low-cal",      label: "Lav kalorie",   test: (r) => r.calories <= 380 },
  { id: "muscle-gain",  label: "Muskelopbygning", test: (r) => r.protein >= 28 && r.calories >= 450 },
  { id: "weight-loss",  label: "Vægttab",       test: (r) => r.calories <= 420 && r.protein >= 20 },
  { id: "under-15",     label: "Under 15 min",  test: (r) => r.minutes <= 15 },
  { id: "mealprep",     label: "Meal prep",     test: (r) => r.tags.includes("mealprep") },
  { id: "vegetarian",   label: "Vegetar",       test: (r) => r.tags.includes("vegetarian") },
];

type MealCategory = {
  id: "breakfast" | "lunch" | "dinner" | "snack" | "smoothie" | "dessert" | "drink";
  label: string;
  sub: string;
  icon: any;
  hero: string;
};

const MEAL_CATEGORIES: MealCategory[] = [
  { id: "breakfast", label: "Morgenmad",  sub: "Start dagen rigtigt", icon: Sun,        hero: "photo-1490645935967-10de6ba17061" },
  { id: "lunch",     label: "Frokost",    sub: "Hurtigt & mættende",  icon: Sandwich,   hero: "photo-1551248429-40975aa4de74" },
  { id: "dinner",    label: "Aftensmad",  sub: "Premium retter",      icon: ChefHat,    hero: "photo-1467003909585-2f8a72700288" },
  { id: "snack",     label: "Snacks",     sub: "Smart i farten",      icon: Cookie,     hero: "photo-1606312619070-d48b4c652a52" },
  { id: "smoothie",  label: "Smoothies",  sub: "Bær & protein",       icon: GlassWater, hero: "photo-1502741224143-90386d7f8c7e" },
  { id: "dessert",   label: "Desserter",  sub: "Sundere søde sager",  icon: IceCream,   hero: "photo-1606313564200-e75d5e30476c" },
  { id: "drink",     label: "Drinks",     sub: "Mocktails & latte",   icon: CupSoda,    hero: "photo-1556679343-c7306c1976bc" },
];

const COUNTRIES: { id: string; name: string; flag: string; hero: string }[] = [
  { id: "India",    name: "Indien",   flag: "🇮🇳", hero: "photo-1565557623262-b51c2513a641" },
  { id: "Italy",    name: "Italien",  flag: "🇮🇹", hero: "photo-1574071318508-1cdbab80d002" },
  { id: "Japan",    name: "Japan",    flag: "🇯🇵", hero: "photo-1579871494447-9811cf80d66c" },
  { id: "Mexico",   name: "Mexico",   flag: "🇲🇽", hero: "photo-1565299585323-38d6b0865b47" },
  { id: "Thailand", name: "Thailand", flag: "🇹🇭", hero: "photo-1559314809-0d155014e29e" },
  { id: "Korea",    name: "Korea",    flag: "🇰🇷", hero: "photo-1583224994076-ae3e1c81c1e0" },
  { id: "USA",      name: "USA",      flag: "🇺🇸", hero: "photo-1568901346375-23c9450c58cd" },
  { id: "Greece",   name: "Grækenland", flag: "🇬🇷", hero: "photo-1540189549336-e6e99c3679fe" },
];

const heroUrl = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

/* ================== CARDS ================== */

function RecipeCard({
  r, onClick, size = "lg", locked,
}: {
  r: Recipe; onClick: () => void; size?: "lg" | "sm" | "row"; locked?: boolean;
}) {
  const w = size === "row" ? 360 : size === "lg" ? 600 : 360;
  const img = recipeImage(r.name, w);
  const dim =
    size === "row" ? "w-full h-28"
    : size === "lg" ? "w-56 h-72"
    : "w-44 h-60";

  return (
    <button
      onClick={onClick}
      className={`k-tap relative shrink-0 overflow-hidden rounded-3xl border-2 border-foreground/10 bg-surface text-left shadow-[0_10px_28px_-12px_hsl(var(--foreground)/0.35)] transition-transform active:scale-[0.98] ${dim} ${size === "row" ? "flex" : ""}`}
    >
      {size === "row" ? (
        <>
          <div className="relative w-28 h-28 shrink-0">
            <img src={img} alt={r.name} loading="lazy" className={`w-full h-full object-cover ${locked ? "blur-md scale-110" : ""}`} />
          </div>
          <div className="flex-1 p-3 flex flex-col justify-center min-w-0">
            <div className="text-sm font-semibold leading-tight line-clamp-2">{r.name}</div>
            <div className="mt-1 text-[11px] text-muted-foreground flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1"><Flame className="w-3 h-3" /> {r.calories}</span>
              <span>·</span>
              <span>{r.protein}g protein</span>
              <span>·</span>
              <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" /> {r.minutes}m</span>
            </div>
          </div>
          {locked && <LockBadge />}
        </>
      ) : (
        <>
          <img src={img} alt={r.name} loading="lazy" className={`absolute inset-0 w-full h-full object-cover ${locked ? "blur-md scale-110" : ""}`} />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/85 via-foreground/20 to-transparent" />
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

function LockBadge() {
  return (
    <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center shadow-lg">
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

/* ================== PAGE ================== */

export default function Recipes() {
  const { addMeal, language } = useKStore();
  const { isActive: isPremium } = useSubscription();
  const [q, setQ] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterId>("all");
  const [view, setView] = useState<
    | { kind: "category"; cat: MealCategory }
    | { kind: "country"; id: string; name: string; hero: string }
    | { kind: "search" }
    | null
  >(null);
  const [open, setOpen] = useState<Recipe | null>(null);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [visible, setVisible] = useState(40);

  const isLocked = (r: Recipe) => {
    if (isPremium) return false;
    let h = 0;
    for (let i = 0; i < r.id.length; i++) h = (h * 31 + r.id.charCodeAt(i)) >>> 0;
    return (h % 10) >= 2; // ~80% locked
  };

  /* ---------- Sticky filter shadow on scroll ---------- */
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ---------- Apply filter to a recipe set ---------- */
  const applyFilter = (list: Recipe[]) => {
    const f = FILTERS.find((x) => x.id === activeFilter)!;
    return list.filter(f.test);
  };

  const filteredByQ = useMemo(() => {
    const k = q.trim().toLowerCase();
    if (!k) return RECIPES;
    return RECIPES.filter((r) =>
      r.name.toLowerCase().includes(k) ||
      r.ingredients.join(" ").toLowerCase().includes(k) ||
      (r.cuisine && r.cuisine.toLowerCase().includes(k)),
    );
  }, [q]);

  const featured = useMemo(
    () => RECIPES.filter((r) => r.protein >= 25 && r.minutes <= 20).slice(0, 8),
    [],
  );

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
      const rec = data?.recipe;
      if (!rec) throw new Error("Ingen opskrift");
      setOpen({
        id: `ai-${Date.now()}`, name: rec.name, emoji: rec.emoji || "🍽️", category: rec.category,
        tags: ["quick"], minutes: rec.minutes, servings: rec.servings,
        calories: rec.calories, protein: rec.protein, carbs: rec.carbs, fat: rec.fat,
        ingredients: rec.ingredients, steps: rec.steps,
      });
      setAiPrompt("");
    } catch (e: any) {
      toast({ title: "AI fejl", description: e?.message ?? "Prøv igen", variant: "destructive" });
    } finally {
      setAiLoading(false);
    }
  };

  /* ================== VIEW: Category / Country / Search ================== */
  if (view) {
    let baseList: Recipe[] = [];
    let title = "";
    let sub = "";
    let heroId = "photo-1546069901-ba9599a7e63c";

    if (view.kind === "category") {
      baseList = RECIPES.filter((r) => r.category === view.cat.id);
      title = view.cat.label;
      sub = view.cat.sub;
      heroId = view.cat.hero;
    } else if (view.kind === "country") {
      baseList = RECIPES.filter((r) => r.cuisine === view.id);
      title = view.name;
      sub = "Autentisk-inspirerede opskrifter";
      heroId = view.hero;
    } else {
      baseList = filteredByQ;
      title = q ? `“${q}”` : "Søgning";
      sub = `${baseList.length} resultater`;
    }

    const list = applyFilter(baseList);

    return (
      <div className="min-h-screen bg-background pb-32">
        <div className="relative h-60">
          <img src={heroUrl(heroId, 1400)} alt={title} className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-background/0" />
          <button
            onClick={() => { setView(null); setVisible(40); setQ(""); }}
            className="absolute top-10 left-4 k-tap w-10 h-10 rounded-full bg-background/90 backdrop-blur border-2 border-foreground/10 flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="absolute bottom-4 left-5 right-5">
            <div className="text-xs uppercase tracking-widest text-foreground/70 font-semibold">{sub}</div>
            <h1 className="text-3xl font-bold mt-1">{title}</h1>
            <div className="text-xs text-muted-foreground mt-1">{list.length} opskrifter</div>
          </div>
        </div>

        <FilterBar active={activeFilter} setActive={setActiveFilter} sticky scrolled={scrolled} />

        <div className="px-5 mt-4 space-y-3">
          {list.slice(0, visible).map((r) => (
            <RecipeCard key={r.id} r={r} onClick={() => openRecipe(r)} size="row" locked={isLocked(r)} />
          ))}
          {list.length > visible && (
            <Button
              variant="outline"
              className="w-full rounded-2xl border-2 border-foreground/15"
              onClick={() => setVisible((n) => n + 40)}
            >
              Vis flere ({list.length - visible} tilbage)
            </Button>
          )}
          {list.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-10">Ingen opskrifter matcher.</div>
          )}

          {!isPremium && <UpgradeBanner />}
        </div>

        <RecipeDialog open={open} setOpen={setOpen} logRecipe={logRecipe} />
      </div>
    );
  }

  /* ================== MAIN VIEW ================== */
  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="px-5 pt-12 pb-3 flex items-center gap-3">
        <Link to="/" className="k-tap p-2 -ml-2 rounded-xl"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="text-2xl font-bold">Opskrifter</h1>
        <div className="ml-auto text-xs text-muted-foreground">{RECIPES.length}</div>
      </div>

      {/* Search */}
      <div className="px-5">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-10 h-12 rounded-2xl bg-surface border-2 border-foreground/10"
            placeholder="Søg opskrifter, ingredienser, lande…"
            value={q}
            onChange={(e) => { setQ(e.target.value); if (e.target.value) setView({ kind: "search" }); }}
          />
        </div>
      </div>

      {/* Find your plan – AI hero */}
      <section className="px-5 mt-4">
        <div className="relative overflow-hidden rounded-3xl border-2 border-foreground/15 bg-foreground text-background">
          <img src={heroUrl("photo-1490645935967-10de6ba17061", 1200)} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-br from-foreground/90 via-foreground/70 to-accent/40" />
          <div className="relative p-5">
            <div className="text-[10px] uppercase tracking-widest font-semibold opacity-90 inline-flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> AI Plan Finder
            </div>
            <h2 className="text-2xl font-bold mt-1 leading-tight">Find din plan</h2>
            <p className="text-sm opacity-90 mt-1">Filtrér efter mål — vi viser opskrifter der passer.</p>
          </div>
        </div>
      </section>

      {/* Meal categories */}
      <section className="mt-5 px-5">
        <h2 className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-3">Kategorier</h2>
        <div className="grid grid-cols-2 gap-3">
          {MEAL_CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => { setView({ kind: "category", cat: c }); setVisible(40); }}
              className="k-tap relative h-36 rounded-3xl overflow-hidden border-2 border-foreground/15 text-left shadow-[0_8px_22px_-12px_hsl(var(--foreground)/0.35)] transition-transform active:scale-[0.98]"
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

      {/* World Cuisine */}
      <section className="mt-6">
        <div className="px-5 flex items-center justify-between mb-3">
          <h2 className="text-xs uppercase tracking-widest text-muted-foreground font-semibold inline-flex items-center gap-1.5">
            <Globe2 className="w-3.5 h-3.5" /> World Cuisine
          </h2>
          <span className="text-[10px] text-muted-foreground">Bladr efter land</span>
        </div>
        <div className="flex gap-3 overflow-x-auto px-5 pb-2 snap-x">
          {COUNTRIES.map((c) => (
            <button
              key={c.id}
              onClick={() => { setView({ kind: "country", id: c.id, name: c.name, hero: c.hero }); setVisible(40); }}
              className="k-tap snap-start shrink-0 w-40 h-48 rounded-3xl overflow-hidden border-2 border-foreground/15 relative text-left shadow-[0_8px_22px_-12px_hsl(var(--foreground)/0.35)]"
            >
              <img src={heroUrl(c.hero, 500)} alt={c.name} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/85 via-foreground/20 to-transparent" />
              <div className="absolute top-2 left-2 text-2xl">{c.flag}</div>
              <div className="absolute bottom-3 left-3 right-3 text-background">
                <div className="text-base font-bold leading-tight">{c.name}</div>
                <div className="text-[10px] opacity-90 uppercase tracking-widest">Autentisk</div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="mt-6">
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

      {/* AI generator */}
      <section className="mt-6 px-5">
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

      <RecipeDialog open={open} setOpen={setOpen} logRecipe={logRecipe} />
    </div>
  );
}

/* ================== STICKY FILTER BAR ================== */

function FilterBar({
  active, setActive, sticky, scrolled,
}: {
  active: FilterId; setActive: (id: FilterId) => void; sticky?: boolean; scrolled?: boolean;
}) {
  return (
    <div
      className={[
        sticky ? "sticky top-0 z-30" : "",
        "bg-background/85 backdrop-blur-xl",
        scrolled ? "shadow-[0_4px_18px_-12px_hsl(var(--foreground)/0.35)] border-b border-foreground/10" : "",
        "transition-all",
      ].join(" ")}
    >
      <div className="flex gap-2 overflow-x-auto px-5 py-3 snap-x">
        {FILTERS.map((f) => {
          const on = active === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setActive(f.id)}
              className={[
                "snap-start shrink-0 k-tap whitespace-nowrap px-3.5 h-9 rounded-full border-2 text-xs font-semibold transition-colors",
                on
                  ? "bg-foreground text-background border-foreground"
                  : "bg-surface text-foreground border-foreground/15 hover:border-foreground/30",
              ].join(" ")}
            >
              {f.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ================== UPGRADE BANNER ================== */

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
          <div className="text-xs opacity-80 mt-0.5">300 unikke opskrifter inkl. World Cuisine</div>
        </div>
        <div className="bg-accent text-accent-foreground font-semibold text-sm px-3 py-2 rounded-full whitespace-nowrap">
          Get Premium
        </div>
      </div>
    </Link>
  );
}

/* ================== RECIPE VARIANTS (regel-baseret) ================== */

type Variant = "normal" | "lowcal" | "vegetar";

const VEG_SWAP = (s: string) =>
  s
    .replace(/kyllingebryst|kyllingelår|kylling/gi, "tofu")
    .replace(/oksekød|hakket okse|hakkebøf|bøf/gi, "linser")
    .replace(/laks|tun|torsk|rejer|fisk/gi, "halloumi")
    .replace(/bacon|skinke|svinekød|pulled pork/gi, "røget tempeh");

function applyVariant(r: Recipe, v: Variant): Recipe {
  if (v === "normal") return r;
  if (v === "lowcal") {
    return {
      ...r,
      calories: Math.round(r.calories * 0.7),
      carbs: Math.round(r.carbs * 0.65),
      fat: Math.round(r.fat * 0.55),
      protein: Math.round(r.protein * 0.95),
      ingredients: r.ingredients.map((i) =>
        i
          .replace(/(\d+)\s*g\s+(pasta|ris|nudler|kartoffel|kartofler|brød)/gi, (_m, n, food) =>
            `${Math.round(Number(n) * 0.65)}g ${food} (mindre portion)`,
          )
          .replace(/olie/gi, "lidt olie / spray"),
      ),
      steps: r.steps,
    };
  }
  // vegetar
  return {
    ...r,
    name: r.name + " (vegetar)",
    protein: Math.round(r.protein * 0.85),
    fat: Math.round(r.fat * 0.95),
    ingredients: r.ingredients.map(VEG_SWAP),
    steps: r.steps.map(VEG_SWAP),
    tags: Array.from(new Set([...r.tags, "vegetarian"])),
  };
}

const VARIANTS: { id: Variant; label: string }[] = [
  { id: "normal",  label: "Normal" },
  { id: "lowcal",  label: "Lav kalorie" },
  { id: "vegetar", label: "Vegetar" },
];

/* ================== RECIPE DETAIL ================== */

function RecipeDialog({
  open, setOpen, logRecipe,
}: {
  open: Recipe | null;
  setOpen: (r: Recipe | null) => void;
  logRecipe: (r: Recipe) => void;
}) {
  const [variant, setVariant] = useState<Variant>("normal");
  // reset variant when opening a new recipe
  useEffect(() => { setVariant("normal"); }, [open?.id]);
  const adjusted = open ? applyVariant(open, variant) : null;
  return (
    <Dialog open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto p-0 rounded-3xl border-2 border-foreground/15">
        {open && adjusted && (
          <>
            {/* Premium hero */}
            <div className="relative h-64">
              <img src={recipeImage(open.name, 1000)} alt={open.name} className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
              {open.cuisine && (
                <div className="absolute top-3 left-3 inline-flex items-center gap-1 text-[10px] uppercase tracking-widest font-semibold bg-background/90 backdrop-blur px-2.5 py-1 rounded-full border border-foreground/10">
                  <Globe2 className="w-3 h-3" /> {open.cuisine}
                </div>
              )}
              <div className="absolute bottom-3 left-4 right-4">
                <DialogHeader className="text-left">
                  <DialogTitle className="text-2xl font-bold leading-tight">{adjusted.name}</DialogTitle>
                </DialogHeader>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* Variant pills */}
              <div className="flex gap-1.5 p-1 rounded-2xl bg-surface-2/60 border-2 border-foreground/10">
                {VARIANTS.map((v) => {
                  const on = variant === v.id;
                  return (
                    <button
                      key={v.id}
                      onClick={() => setVariant(v.id)}
                      className={[
                        "flex-1 k-tap rounded-xl px-2 py-2 text-xs font-semibold transition-colors",
                        on ? "bg-foreground text-background shadow-sm" : "text-muted-foreground hover:text-foreground",
                      ].join(" ")}
                    >
                      {v.label}
                    </button>
                  );
                })}
              </div>

              {/* Macros */}
              <div className="grid grid-cols-4 gap-2 text-center">
                {[
                  { l: "Kcal", v: adjusted.calories },
                  { l: "Protein", v: `${adjusted.protein}g` },
                  { l: "Kulhydrat", v: `${adjusted.carbs}g` },
                  { l: "Fedt", v: `${adjusted.fat}g` },
                ].map((s) => (
                  <div key={s.l} className="rounded-2xl bg-surface-2/60 border-2 border-foreground/10 p-2">
                    <div className="text-[9px] uppercase tracking-widest text-muted-foreground">{s.l}</div>
                    <div className="text-sm font-bold">{s.v}</div>
                  </div>
                ))}
              </div>

              {/* Meta badges */}
              <div className="flex gap-2 flex-wrap text-xs">
                <Badge variant="secondary" className="rounded-full"><Clock className="w-3 h-3 mr-1" />{adjusted.minutes} min</Badge>
                <Badge variant="secondary" className="rounded-full"><Users className="w-3 h-3 mr-1" />{adjusted.servings} portion{adjusted.servings > 1 ? "er" : ""}</Badge>
                {adjusted.tempC && (
                  <Badge variant="secondary" className="rounded-full"><Thermometer className="w-3 h-3 mr-1" />{adjusted.tempC}°C</Badge>
                )}
                {adjusted.tags.filter((t) => t !== "worldcuisine").slice(0, 4).map((t) => (
                  <Badge key={t} variant="outline" className="rounded-full">{t}</Badge>
                ))}
              </div>

              {/* Ingredients */}
              <div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">Ingredienser</div>
                <ul className="text-sm space-y-1.5">
                  {adjusted.ingredients.map((i, n) => (
                    <li key={n} className="flex gap-2 items-start">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                      <span>{i}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Steps — next-step style */}
              <div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">Sådan gør du</div>
                <ol className="space-y-2">
                  {adjusted.steps.map((s, n) => (
                    <li key={n} className="flex gap-3 items-start rounded-2xl bg-surface-2/50 border border-foreground/10 p-3">
                      <span className="shrink-0 w-7 h-7 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-bold">{n + 1}</span>
                      <span className="text-sm leading-snug">{s}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <Button className="w-full rounded-2xl h-12 text-base font-semibold" onClick={() => logRecipe(adjusted)}>
                <Plus className="w-4 h-4 mr-1" /> Log i dagbog
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

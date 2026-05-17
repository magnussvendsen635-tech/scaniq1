import { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft, Search, Plus, Clock, Flame, Thermometer, Users,
  ChevronRight, Sun, Sandwich, ChefHat, Cookie, GlassWater, IceCream, CupSoda, Globe2, Minus,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RECIPES, type Recipe } from "@/data/recipes";
import { useKStore, categoryForNow } from "@/store/useKStore";
import { toast } from "@/hooks/use-toast";
import { recipeImage } from "@/lib/recipeImage";

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
  label: string; sub: string; icon: any; hero: string;
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

/* ================== ALPHABETICAL SORT (starts-with priority) ================== */

function sortBySearch(list: Recipe[], q: string): Recipe[] {
  const k = q.trim().toLowerCase();
  if (!k) return [...list].sort((a, b) => a.name.localeCompare(b.name, "da"));
  return [...list].sort((a, b) => {
    const an = a.name.toLowerCase();
    const bn = b.name.toLowerCase();
    const aStarts = an.startsWith(k) ? 0 : an.split(/\s+/).some(w => w.startsWith(k)) ? 1 : 2;
    const bStarts = bn.startsWith(k) ? 0 : bn.split(/\s+/).some(w => w.startsWith(k)) ? 1 : 2;
    if (aStarts !== bStarts) return aStarts - bStarts;
    return an.localeCompare(bn, "da");
  });
}

/* ================== CARDS ================== */

function RecipeCard({
  r, onClick, size = "lg",
}: {
  r: Recipe; onClick: () => void; size?: "lg" | "sm" | "row";
}) {
  const w = size === "row" ? 360 : size === "lg" ? 600 : 360;
  const fallback = recipeImage(r.name, w);
  const img = `/recipes/${r.id}.jpg`;
  const onErr = (e: any) => { if (e.currentTarget.src !== fallback) e.currentTarget.src = fallback; };
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
            <img src={img} onError={onErr} alt={r.name} loading="lazy" className="w-full h-full object-cover" />
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
          <ChevronRight className="w-4 h-4 text-muted-foreground self-center mr-3 shrink-0" />
        </>
      ) : (
        <>
          <img src={img} onError={onErr} alt={r.name} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
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
        </>
      )}
    </button>
  );
}

/* ================== PAGE ================== */

export default function Recipes() {
  const { addMeal } = useKStore();
  const [q, setQ] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterId>("all");
  const [view, setView] = useState<
    | { kind: "category"; cat: MealCategory }
    | { kind: "country"; id: string; name: string; hero: string }
    | null
  >(null);
  const [open, setOpen] = useState<Recipe | null>(null);
  const [visible, setVisible] = useState(40);

  /* ---------- Sticky filter shadow on scroll ---------- */
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const applyFilter = (list: Recipe[]) => {
    const f = FILTERS.find((x) => x.id === activeFilter)!;
    return list.filter(f.test);
  };

  const searchResults = useMemo(() => {
    const k = q.trim().toLowerCase();
    if (!k) return [];
    const matched = RECIPES.filter((r) =>
      r.name.toLowerCase().includes(k) ||
      r.ingredients.join(" ").toLowerCase().includes(k) ||
      (r.cuisine && r.cuisine.toLowerCase().includes(k)),
    );
    return sortBySearch(matched, q);
  }, [q]);

  const featured = useMemo(
    () => RECIPES.filter((r) => r.protein >= 25 && r.minutes <= 20).slice(0, 8),
    [],
  );

  const openRecipe = (r: Recipe) => setOpen(r);

  const logRecipe = (r: Recipe) => {
    addMeal({
      id: crypto.randomUUID(), name: r.name,
      calories: r.calories, protein: r.protein, carbs: r.carbs, fat: r.fat,
      healthScore: 8, at: Date.now(), category: categoryForNow(),
    });
    toast({ title: "Logget i dagbog", description: r.name });
    setOpen(null);
  };

  /* ---------- Reusable search input (rendered ONCE per view to preserve focus) ---------- */
  const SearchInput = (
    <div className="relative">
      <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
      <Input
        className="pl-10 h-12 rounded-2xl bg-surface border-2 border-foreground/10"
        placeholder="Søg opskrifter, ingredienser, lande…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        autoComplete="off"
      />
    </div>
  );

  /* ================== VIEW: Category / Country ================== */
  if (view) {
    let baseList: Recipe[] =
      view.kind === "category"
        ? RECIPES.filter((r) => r.category === view.cat.id)
        : RECIPES.filter((r) => r.cuisine === view.id);
    const title = view.kind === "category" ? view.cat.label : view.name;
    const sub = view.kind === "category" ? view.cat.sub : "Autentisk-inspirerede opskrifter";
    const heroId = view.kind === "category" ? view.cat.hero : view.hero;

    const list = sortBySearch(applyFilter(baseList), "");

    return (
      <div className="min-h-screen bg-background pb-32">
        <div className="relative h-60">
          <img src={heroUrl(heroId, 1400)} alt={title} className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-background/0" />
          <button
            onClick={() => { setView(null); setVisible(40); }}
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
            <RecipeCard key={r.id} r={r} onClick={() => openRecipe(r)} size="row" />
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
        </div>

        <RecipeDialog open={open} setOpen={setOpen} logRecipe={logRecipe} />
      </div>
    );
  }

  /* ================== MAIN VIEW ================== */
  const showingSearch = q.trim().length > 0;

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="px-5 pt-12 pb-3 flex items-center gap-3">
        <Link to="/" className="k-tap p-2 -ml-2 rounded-xl"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="text-2xl font-bold">Opskrifter</h1>
        <div className="ml-auto text-xs text-muted-foreground">{RECIPES.length}</div>
      </div>

      <div className="px-5">{SearchInput}</div>

      {showingSearch ? (
        <div className="px-5 mt-4 space-y-3">
          <div className="text-xs text-muted-foreground">{searchResults.length} resultater for "{q}"</div>
          {searchResults.slice(0, visible).map((r) => (
            <RecipeCard key={r.id} r={r} onClick={() => openRecipe(r)} size="row" />
          ))}
          {searchResults.length > visible && (
            <Button
              variant="outline"
              className="w-full rounded-2xl border-2 border-foreground/15"
              onClick={() => setVisible((n) => n + 40)}
            >
              Vis flere ({searchResults.length - visible} tilbage)
            </Button>
          )}
          {searchResults.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-10">Ingen opskrifter matcher "{q}".</div>
          )}
        </div>
      ) : (
        <>
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
                  <RecipeCard r={r} onClick={() => openRecipe(r)} size="lg" />
                </div>
              ))}
            </div>
          </section>
        </>
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
  return {
    ...r,
    name: r.name + " (vegetar)",
    protein: Math.round(r.protein * 0.85),
    fat: Math.round(r.fat * 0.95),
    ingredients: r.ingredients.map(VEG_SWAP),
    steps: r.steps.map(VEG_SWAP),
    tags: Array.from(new Set([...r.tags, "vegetarian" as const])),
  };
}

const VARIANTS: { id: Variant; label: string }[] = [
  { id: "normal",  label: "Normal" },
  { id: "lowcal",  label: "Lav kalorie" },
  { id: "vegetar", label: "Vegetar" },
];

/* ================== SERVINGS SCALER ================== */

const FRACTIONS: Record<string, number> = { "½": 0.5, "¼": 0.25, "¾": 0.75, "⅓": 1/3, "⅔": 2/3 };

function fmtQty(n: number): string {
  if (n < 1 && n > 0) {
    if (Math.abs(n - 0.5) < 0.05) return "½";
    if (Math.abs(n - 0.25) < 0.05) return "¼";
    if (Math.abs(n - 0.75) < 0.05) return "¾";
    return n.toFixed(2).replace(/\.?0+$/, "");
  }
  if (Math.abs(n - Math.round(n)) < 0.05) return String(Math.round(n));
  return (Math.round(n * 10) / 10).toString();
}

/** Scale leading numeric quantity in an ingredient string by multiplier. */
function scaleIngredient(line: string, mult: number): string {
  // Pattern: optional unicode fraction OR number (int/decimal), then unit/space
  return line.replace(
    /^(\s*)(½|¼|¾|⅓|⅔|\d+(?:[.,]\d+)?)(\s*)(g|kg|ml|dl|l|stk|spsk|tsk|knsp\.?|skiver?|skive|fed|dåse|dåser|pose|poser|kop|kopper|håndfuld|håndfulde)?\b/i,
    (_m, lead, num, sp, unit) => {
      const base = FRACTIONS[num] ?? Number(String(num).replace(",", "."));
      if (!isFinite(base)) return _m;
      const scaled = base * mult;
      return `${lead}${fmtQty(scaled)}${sp || " "}${unit || ""}`.trimEnd() + (unit ? "" : "");
    },
  );
}

function scaleRecipe(r: Recipe, servings: number): Recipe {
  const baseServ = r.servings || 1;
  const mult = servings / baseServ;
  return {
    ...r,
    servings,
    calories: Math.round(r.calories * mult),
    protein: Math.round(r.protein * mult),
    carbs: Math.round(r.carbs * mult),
    fat: Math.round(r.fat * mult),
    ingredients: r.ingredients.map((i) => scaleIngredient(i, mult)),
  };
}

/* ================== RECIPE DETAIL ================== */

function RecipeDialog({
  open, setOpen, logRecipe,
}: {
  open: Recipe | null;
  setOpen: (r: Recipe | null) => void;
  logRecipe: (r: Recipe) => void;
}) {
  const [variant, setVariant] = useState<Variant>("normal");
  const [servings, setServings] = useState(1);
  useEffect(() => { setVariant("normal"); setServings(1); }, [open?.id]);

  const adjusted = useMemo(() => {
    if (!open) return null;
    return scaleRecipe(applyVariant(open, variant), servings);
  }, [open, variant, servings]);

  return (
    <Dialog open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto p-0 rounded-3xl border-2 border-foreground/15">
        {open && adjusted && (
          <>
            <div className="relative h-64">
              <img src={`/recipes/${open.id}.jpg`} onError={(e:any)=>{e.currentTarget.src = recipeImage(open.name, 1000);}} alt={open.name} className="absolute inset-0 w-full h-full object-cover" />
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

              {/* Servings counter */}
              <div className="flex items-center justify-between rounded-2xl bg-surface-2/60 border-2 border-foreground/10 p-2 pl-4">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <div className="text-sm font-semibold">Antal personer</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setServings((s) => Math.max(1, s - 1))}
                    className="k-tap w-9 h-9 rounded-xl bg-background border-2 border-foreground/15 flex items-center justify-center disabled:opacity-40"
                    disabled={servings <= 1}
                    aria-label="Færre personer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <div className="min-w-[2ch] text-center text-base font-bold tabular-nums">{servings}</div>
                  <button
                    onClick={() => setServings((s) => Math.min(20, s + 1))}
                    className="k-tap w-9 h-9 rounded-xl bg-foreground text-background flex items-center justify-center"
                    aria-label="Flere personer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Macros (scaled) */}
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
              <div className="text-[10px] text-muted-foreground text-center -mt-2">
                Total for {servings} {servings === 1 ? "person" : "personer"}
              </div>

              {/* Meta badges */}
              <div className="flex gap-2 flex-wrap text-xs">
                <Badge variant="secondary" className="rounded-full"><Clock className="w-3 h-3 mr-1" />{adjusted.minutes} min</Badge>
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

              {/* Steps */}
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

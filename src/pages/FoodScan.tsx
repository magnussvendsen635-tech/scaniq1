import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useKStore, caloriesToday, categoryForNow, type MealCategory } from "@/store/useKStore";
import { Camera, Sparkles, ArrowLeft, Heart, Check, Crown, Sun, UtensilsCrossed, Moon, Cookie, Search, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useT } from "@/i18n/useT";
import { PremiumLock } from "@/components/PremiumLock";
import { PremiumWrapper } from "@/components/PremiumWrapper";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";

interface FoodItem {
  name: string;
  calories: number;
}

interface Per100g {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  saturatedFat?: number;
  cholesterol?: number;
}

interface Result {
  name: string;
  items?: FoodItem[];
  // Portion totals as returned by the AI (kept as a fallback when per100g is missing)
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  saturatedFat?: number;
  cholesterol?: number;
  healthScore: number;
  confidence?: number;
  satietyHours?: number;
  energyEffect?: string;
  vitaminA?: number;
  vitaminC?: number;
  vitaminD?: number;
  vitaminE?: number;
  vitaminB12?: number;
  calcium?: number;
  iron?: number;
  magnesium?: number;
  potassium?: number;
  zinc?: number;
  novaGroup?: 1 | 2 | 3 | 4;
  ultraProcessedPercent?: number;
  // NEW: ground-truth per-100g values + total weight of the portion
  per100g?: Per100g;
  totalGrams?: number;
  // Hidden oil/dressing kcal returned by AI for the visible portion.
  // These are SEPARATE from `calories` / `per100g` — only added when toggle is ON.
  hiddenOilKcal?: number;
  hiddenDressingKcal?: number;
}

// Global calculation: (per100g / 100) * totalConsumedGrams
// Falls back to ratio scaling of original totals if per100g is missing.
type Scaled = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  saturatedFat?: number;
  cholesterol?: number;
};
function scaleNutrition(r: Result, grams: number, accuracy: number = 1): Scaled {
  const g = Math.max(0, Number(grams) || 0);
  const a = Math.max(0.5, Math.min(2, Number(accuracy) || 1));
  const p = r.per100g;
  let s: Scaled;
  if (p) {
    const f = g / 100;
    const r1 = (v: number) => Math.round(v * f * 10) / 10;
    s = {
      calories: Math.round((p.calories ?? 0) * f),
      protein: Math.round((p.protein ?? 0) * f),
      carbs: Math.round((p.carbs ?? 0) * f),
      fat: Math.round((p.fat ?? 0) * f),
      fiber: p.fiber !== undefined ? r1(p.fiber) : undefined,
      sugar: p.sugar !== undefined ? r1(p.sugar) : undefined,
      sodium: p.sodium !== undefined ? Math.round(p.sodium * f) : undefined,
      saturatedFat: p.saturatedFat !== undefined ? r1(p.saturatedFat) : undefined,
      cholesterol: p.cholesterol !== undefined ? Math.round(p.cholesterol * f) : undefined,
    };
  } else if (r.totalGrams && r.totalGrams > 0) {
    const f = g / r.totalGrams;
    const r1 = (v?: number) => (v === undefined ? undefined : Math.round(v * f * 10) / 10);
    s = {
      calories: Math.round(r.calories * f),
      protein: Math.round(r.protein * f),
      carbs: Math.round(r.carbs * f),
      fat: Math.round(r.fat * f),
      fiber: r1(r.fiber),
      sugar: r1(r.sugar),
      sodium: r.sodium !== undefined ? Math.round(r.sodium * f) : undefined,
      saturatedFat: r1(r.saturatedFat),
      cholesterol: r.cholesterol !== undefined ? Math.round(r.cholesterol * f) : undefined,
    };
  } else {
    // No per100g and no totalGrams reference: treat the AI's totals as per-100g
    // so the displayed values still scale with the entered weight.
    const f = g / 100;
    const r1 = (v?: number) => (v === undefined ? undefined : Math.round(v * f * 10) / 10);
    s = {
      calories: Math.round((r.calories ?? 0) * f),
      protein: Math.round((r.protein ?? 0) * f),
      carbs: Math.round((r.carbs ?? 0) * f),
      fat: Math.round((r.fat ?? 0) * f),
      fiber: r1(r.fiber),
      sugar: r1(r.sugar),
      sodium: r.sodium !== undefined ? Math.round(r.sodium * f) : undefined,
      saturatedFat: r1(r.saturatedFat),
      cholesterol: r.cholesterol !== undefined ? Math.round(r.cholesterol * f) : undefined,
    };
  }
  // Apply calorie accuracy modifier (compensates AI underestimation)
  s.calories = Math.round(s.calories * a);
  return s;
}


type Portion = "small" | "medium" | "large";
type FoodSource = "homemade" | "store" | "restaurant";
type Step = "portion" | "capture" | "result";

// Industrially formulated brands / products that are ALWAYS NOVA 4,
// regardless of how the user logs them (the homemade modifier does not apply).
const ALWAYS_ULTRA = /\b(pringles|doritos|lays|cheetos|ruffles|tostitos|oreo|nutella|haribo|skittles|mars|snickers|twix|kitkat|kit kat|bounty|milky way|toblerone|daim|smarties|ben\s*&\s*jerry'?s?|ben and jerry'?s?|h[äa]agen[\s-]?dazs|magnum|cornetto|coca[\s-]?cola|coke|pepsi|fanta|sprite|7up|red bull|monster|rockstar|cocio|nesquik|cheerios|frosties|cornflakes|coco pops|special k|pop[\s-]?tarts|maggi|cup noodles|instant nudler|hot pockets|lunchables|spam|slim jim|chips ahoy|ritz)\b/i;

// NOVA-style processing classification (1 = whole food, 4 = ultra-processed).
// Source-aware:
//   - homemade   → capped at NOVA 2 (green) unless an industrial brand is detected
//   - restaurant → minimum NOVA 3 (added oils/fats/culinary prep)
//   - store      → can be 1-4 depending on signals
// Industrial brands (Pringles, Ben & Jerry's, …) are ALWAYS locked at NOVA 4.
// Manufactured snacks / sodas / candy → always NOVA 4 regardless of source
const SNACK_ULTRA = /\b(chips|crisps|cola|sodavand|soda|energidrik|energy drink|slik|candy|gummi|lakrids|liquorice|cornflakes|frosties|coco pops|instant noodle|instant nudler|softice|milkshake|protein bar|chokoladebar|chocolate bar|donut|donuts|nuggets|hotdog|hot dog|pølser i dåse|formkød|reconstituted|popcorn med smør|microwave popcorn)\b/i;

// Complex composite meals — context dependent (homemade vs store/restaurant)
const COMPLEX_MEAL = /\b(pizza|burger|cheeseburger|hamburger|lasagne|lasagna|sandwich|wrap|tortilla pizza|kebab|shawarma|sushi|pasta carbonara|pasta bolognese|spaghetti bolognese|risotto|gryderet|stew|curry|tikka masala|pad thai|pho|ramen|nudelret|paella|enchilada|burrito|taco|quesadilla)\b/i;

// Raw, single-ingredient whole foods
const RAW_WHOLE = /\b(æble|banan|pære|appelsin|citron|bær|jordbær|blåbær|hindbær|brombær|drue|kiwi|melon|vandmelon|mango|ananas|avocado|tomat|agurk|gulerod|peberfrugt|squash|asparges|broccoli|blomkål|spinat|salat|kål|løg|hvidløg|svamp|kartoffel|sød kartoffel|råris|brune ris|havregryn|havre|quinoa|bønner|linser|kikærter|æg|kyllingebryst|kyllingelår|kalkun|oksekød|hakket okse|svinekød|laks|torsk|tun frisk|rejer|tofu|tempeh|nødder|mandler|valnødder|cashew|hasselnød|frø|chiafrø|hørfrø|fruit|vegetable|apple|banana|pear|orange|berries|egg|chicken breast|raw steak|steak|salmon|cod|rice|oats|plain oats)\b/i;

// NOVA-style processing classification (1 = whole food, 4 = ultra-processed).
function estimateNova(r: Result, source: FoodSource = "homemade"): 1 | 2 | 3 | 4 {
  const name = (r.name || "").toLowerCase();
  const items = (r.items || []).map((i) => i.name.toLowerCase()).join(" ");
  const text = ` ${name} ${items} `;

  // 1) Industrial brand or manufactured snack → always NOVA 4
  if (ALWAYS_ULTRA.test(text) || SNACK_ULTRA.test(text)) return 4;

  // 2) Industrial additives in ingredient list → NOVA 4
  const additives = /\b(e\d{3}|emulgator|emulsifier|lecithin|carrageenan|maltodextrin|dextrose|invertsukker|glucose-fructose|fruktose sirup|hfcs|aspartame|aspartam|sucralose|acesulfame|saccharin|stevia glycoside|natriumbenzoat|sodium benzoate|kaliumsorbat|potassium sorbate|nitrit|nitrate|msg|mononatriumglutamat|smagsforstærker|flavour enhancer|kunstig aroma|artificial flavou?r|farvestof|colou?ring|stabilisator|stabili[sz]er|fortykningsmiddel|thickener|surhedsregulerende|acidity regulator|konserveringsmiddel|preservative|hydrogenated|hærdet fedt|palmolein|modified starch|modificeret stivelse|isolat|hydrolysat|protein isolate|hydrolysed protein|gum arabic|xanthan|guar gum|mono- og diglycerider|propylene glycol|propylenglycol|tbhq|bht|bha)\b/i;
  if (additives.test(text)) return 4;

  // 3) Complex composite meal → source-dependent
  if (COMPLEX_MEAL.test(text)) {
    if (source === "homemade") return 3;
    return 4; // store / restaurant
  }

  // 4) Raw single-ingredient whole food
  const culinary = /\b(mælk|yoghurt|skyr|hytteost|ost|cheese|smør|olie|mel|flour|honning|honey|sukker|salt|eddike|krydderi|herbs|butter|oil|sugar)\b/i;
  const processed = /\b(brød|bread|rugbrød|pasta|røget|smoked|saltet|cured|syltet|pickled|dåse|canned|marmelade|saft|juice|bacon|skinke|pålæg|fetaost|frikadelle|bolle|pandekage|omelet|suppe|soup|wok|risotto)\b/i;
  if (RAW_WHOLE.test(text) && !processed.test(text) && !culinary.test(text)) return 1;

  // 5) Traditionally processed
  if (processed.test(text)) {
    let nova: 1 | 2 | 3 | 4 = 3;
    // Nutrition tiebreaker
    let score = 0;
    if ((r.sugar ?? 0) > 25) score += 2;
    else if ((r.sugar ?? 0) > 15) score += 1;
    if ((r.sodium ?? 0) > 800) score += 2;
    else if ((r.sodium ?? 0) > 500) score += 1;
    if ((r.saturatedFat ?? 0) > 12) score += 1;
    if (score >= 4) nova = 4;
    if (source === "homemade" && nova > 3) nova = 3;
    return nova;
  }

  // 6) Pure culinary ingredient (sugar/oil/butter/cheese) → NOVA 2
  if (culinary.test(text)) return 2;

  // 7) Fallback by source
  if (source === "restaurant") return 3;
  if (source === "store") return 3;
  return 2;
}

// Apply the processing modifier on top of an AI-provided NOVA group.
// Strict rules: manufactured snacks/brands always NOVA 4; complex meals
// re-evaluated against the chosen source so "hjemmelavet" stays NOVA 3.
function applyProcessingModifier(r: Result, source: FoodSource, aiNova?: 1 | 2 | 3 | 4): 1 | 2 | 3 | 4 {
  const text = ` ${(r.name || "").toLowerCase()} ${(r.items || []).map((i) => i.name.toLowerCase()).join(" ")} `;
  if (ALWAYS_ULTRA.test(text) || SNACK_ULTRA.test(text)) return 4;
  if (COMPLEX_MEAL.test(text)) {
    return source === "homemade" ? 3 : 4;
  }
  if (RAW_WHOLE.test(text)) {
    // Don't let an AI overestimate a plain raw ingredient
    return 1;
  }
  if (typeof aiNova !== "number") return estimateNova(r, source);
  let nova: 1 | 2 | 3 | 4 = aiNova;
  if (source === "homemade" && nova > 3) nova = 3;
  if (source === "restaurant" && nova < 3) nova = 3;
  return nova;
}


const NOVA_META: Record<1 | 2 | 3 | 4, { title: string; desc: string; emoji: string; icon: string; bar: string; badge: string; border: string }> = {
  1: {
    title: "Hele råvarer",
    desc: "Naturlige, uforarbejdede ingredienser. Et godt grundlag i din kost.",
    emoji: "🥦",
    icon: "bg-emerald-500/15 text-emerald-600",
    bar: "bg-emerald-500",
    badge: "bg-emerald-500/15 text-emerald-700",
    border: "border-emerald-500/30",
  },
  2: {
    title: "Kulinariske ingredienser",
    desc: "Hele råvarer kombineret med køkkenets klassikere som olie, smør, salt, sukker eller mel.",
    emoji: "🌾",
    icon: "bg-lime-500/15 text-lime-700",
    bar: "bg-lime-500",
    badge: "bg-lime-500/15 text-lime-700",
    border: "border-lime-500/30",
  },
  3: {
    title: "Forarbejdet",
    desc: "Mere bearbejdet end hele råvarer, men helt fint i moderate mængder.",
    emoji: "🥫",
    icon: "bg-amber-500/15 text-amber-700",
    bar: "bg-amber-500",
    badge: "bg-amber-500/15 text-amber-700",
    border: "border-amber-500/30",
  },
  4: {
    title: "Ultra-forarbejdet",
    desc: "Industrielt fremstillet med tilsætningsstoffer og smagsforstærkere.",
    emoji: "🏭",
    icon: "bg-orange-500/15 text-orange-700",
    bar: "bg-orange-500",
    badge: "bg-orange-500/15 text-orange-700",
    border: "border-orange-500/40",
  },
};


export default function FoodScan() {
  const nav = useNavigate();
  const t = useT();
  const { user: profile } = useAuth();
  const { user, meals, addMeal, calorieAccuracy } = useKStore();
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  // Total weight (grams) auto-detected from AI scan. No longer user-editable on result screen.
  const [consumedGrams, setConsumedGrams] = useState<number>(0);
  // User-editable calorie override. When set, replaces the AI-computed total.
  const [caloriesOverride, setCaloriesOverride] = useState<number | null>(null);
  const [previews, setPreviews] = useState<string[]>([]);
  const [portion, setPortion] = useState<Portion>("medium");
  const [foodSource, setFoodSource] = useState<FoodSource>("homemade");
  const [addOil, setAddOil] = useState<boolean>(false);
  const [addDressing, setAddDressing] = useState<boolean>(false);
  const [step, setStep] = useState<Step>("portion");
  const [category, setCategory] = useState<MealCategory>(categoryForNow());
  
  const [scansUsed, setScansUsed] = useState<number>(0);
  const [dailyUsed, setDailyUsed] = useState<number>(0);
  const [isPremiumServer, setIsPremiumServer] = useState<boolean>(false);
  const [limitReached, setLimitReached] = useState(false);
  const [scanStatus, setScanStatus] = useState<string>("");
  const [scanProgress, setScanProgress] = useState<number>(0);

  useEffect(() => {
    if (!scanning) { setScanProgress(0); return; }
    setScanProgress(2);
    const id = setInterval(() => {
      setScanProgress((p) => (p < 95 ? p + Math.max(1, Math.round((96 - p) / 18)) : p));
    }, 180);
    return () => clearInterval(id);
  }, [scanning]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchGrams, setSearchGrams] = useState<string>("");
  const [searching, setSearching] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const capturingRef = useRef(false);
  const REQUIRED_PHOTOS = 2;
  const MAX_PHOTOS = 3;
  const DAILY_LIMIT = 20;
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const todayUTC = () => new Date().toISOString().slice(0, 10);
  const canScan = isPremiumServer || isAdmin;
  const preview = previews[previews.length - 1] ?? null;

  const refreshQuota = async () => {
    if (!profile) return { daily: dailyUsed, premium: isPremiumServer };
    const { data } = await supabase
      .from("profiles")
      .select("scan_count, is_premium, daily_scan_count, last_scan_date")
      .eq("id", profile.id)
      .maybeSingle();
    const scans = data?.scan_count ?? scansUsed;
    const serverPremium = !!data?.is_premium;
    const today = todayUTC();
    const daily = data?.last_scan_date === today ? (data?.daily_scan_count ?? 0) : 0;
    setScansUsed(scans);
    setDailyUsed(daily);
    setIsPremiumServer(serverPremium);
    setLimitReached(!isAdmin && daily >= DAILY_LIMIT);
    return { daily, premium: serverPremium };
  };

  const [searchParams, setSearchParams] = useSearchParams();

  // Fetch scan quota from server
  useEffect(() => {
    if (!profile) return;
    refreshQuota();
    supabase.rpc("has_role", { _user_id: profile.id, _role: "admin" }).then(({ data }) => {
      setIsAdmin(!!data);
    });
  }, [profile]);




  // Auto-open camera when arriving via ?auto=1 (from bottom-nav scan button)
  useEffect(() => {
    if (searchParams.get("auto") !== "1") return;
    if (!profile) return;
    const timer = setTimeout(() => {
      if (fileRef.current) fileRef.current.value = "";
      fileRef.current?.click();
      const next = new URLSearchParams(searchParams);
      next.delete("auto");
      setSearchParams(next, { replace: true });
    }, 150);
    return () => clearTimeout(timer);
  }, [profile, searchParams, setSearchParams]);

  const fileToDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const maxSide = 1280;
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not process image"));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.78));
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Could not read image"));
      };
      img.src = objectUrl;
    });

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const file = input.files?.[0];
    // Reset the input value immediately so the same file can be re-picked next
    // time and so a stale selection never re-fires on subsequent opens.
    input.value = "";
    if (!file) return;
    if (capturingRef.current) return;
    capturingRef.current = true;
    try {
      const quota = await refreshQuota();
      if (!quota.premium) {
        toast.error("Premium required", { description: "Scanning is a Premium feature." });
        nav("/premium");
        return;
      }
      if (quota.daily >= DAILY_LIMIT) {
        setLimitReached(true);
        setStep("portion");
        toast.error("Daily limit reached", { description: `You've used all ${DAILY_LIMIT} scans for today. Try again tomorrow.` });
        return;
      }

      const dataUrl = await fileToDataUrl(file);
      setResult(null);
      setPreviews((prev) => [...prev, dataUrl].slice(0, MAX_PHOTOS));
    } finally {
      capturingRef.current = false;
    }
  };

  const openFilePicker = () => {
    if (!fileRef.current) return;
    // Reset the input before opening so the previous file isn't re-submitted.
    fileRef.current.value = "";
    fileRef.current.click();
  };

  // The phone's native camera is opened via the hidden file input
  // (type="file" + capture="environment"). Both "start" and "capture"
  // simply re-open the system camera/file picker.
  const startCamera = () => openFilePicker();
  const captureFromCamera = () => openFilePicker();


  const removePhoto = (idx: number) => {
    setPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const applyResult = (data: any) => {
    const num = (v: any) => (typeof v === "number" && isFinite(v) ? v : undefined);
    const p100 = data.per100g && typeof data.per100g === "object"
      ? {
          calories: Number(data.per100g.calories) || 0,
          protein: Number(data.per100g.protein) || 0,
          carbs: Number(data.per100g.carbs) || 0,
          fat: Number(data.per100g.fat) || 0,
          fiber: num(data.per100g.fiber),
          sugar: num(data.per100g.sugar),
          sodium: num(data.per100g.sodium),
          saturatedFat: num(data.per100g.saturatedFat),
          cholesterol: num(data.per100g.cholesterol),
        }
      : undefined;
    const totalGrams = num(data.totalGrams);
    const next: Result = {
      name: data.name,
      items: Array.isArray(data.items)
        ? data.items.map((it: any) => ({ name: String(it.name), calories: Math.round(Number(it.calories) || 0) }))
        : undefined,
      calories: Math.round(data.calories),
      protein: Math.round(data.protein),
      carbs: Math.round(data.carbs),
      fat: Math.round(data.fat),
      fiber: typeof data.fiber === "number" ? Math.round(data.fiber * 10) / 10 : undefined,
      sugar: typeof data.sugar === "number" ? Math.round(data.sugar * 10) / 10 : undefined,
      sodium: typeof data.sodium === "number" ? Math.round(data.sodium) : undefined,
      saturatedFat: typeof data.saturatedFat === "number" ? Math.round(data.saturatedFat * 10) / 10 : undefined,
      cholesterol: typeof data.cholesterol === "number" ? Math.round(data.cholesterol) : undefined,
      healthScore: Math.round(data.healthScore),
      confidence: data.confidence,
      satietyHours: typeof data.satietyHours === "number" ? data.satietyHours : undefined,
      energyEffect: typeof data.energyEffect === "string" ? data.energyEffect : undefined,
      vitaminA: num(data.vitaminA),
      vitaminC: num(data.vitaminC),
      vitaminD: num(data.vitaminD),
      vitaminE: num(data.vitaminE),
      vitaminB12: num(data.vitaminB12),
      calcium: num(data.calcium),
      iron: num(data.iron),
      magnesium: num(data.magnesium),
      potassium: num(data.potassium),
      zinc: num(data.zinc),
      novaGroup: [1, 2, 3, 4].includes(Number(data.novaGroup)) ? (Number(data.novaGroup) as 1 | 2 | 3 | 4) : undefined,
      ultraProcessedPercent: num(data.ultraProcessedPercent),
      per100g: p100,
      totalGrams: totalGrams,
      hiddenOilKcal: num(data.hiddenOilKcal),
      hiddenDressingKcal: num(data.hiddenDressingKcal),
    };
    setResult(next);
    setCaloriesOverride(null);
    // Auto-detect total weight from scan so calories display immediately.
    const detected = totalGrams && totalGrams > 0
      ? Math.round(totalGrams)
      : (p100 && p100.calories > 0 && next.calories > 0
          ? Math.round((next.calories / p100.calories) * 100)
          : 100);
    setConsumedGrams(Math.max(1, detected));
    if (typeof data.scans_used === "number") setScansUsed(data.scans_used);
    if (typeof data.daily_used === "number") {
      setDailyUsed(data.daily_used);
      if (data.daily_used >= DAILY_LIMIT) setLimitReached(true);
    }
  };


  const runManualSearch = async () => {
    const q = searchQuery.trim();
    const grams = searchGrams.trim();
    if (q.length < 2) {
      toast.error("Type at least 2 characters");
      return;
    }
    const fullQuery = grams ? `${grams}g ${q}` : q;
    const quota = await refreshQuota();
    if (!quota.premium) {
      toast.error("Premium required");
      nav("/premium");
      return;
    }
    if (quota.daily >= DAILY_LIMIT) {
      setLimitReached(true);
      setSearchOpen(false);
      toast.error("Daily limit reached");
      return;
    }
    setSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke("food-search", { body: { query: fullQuery } });
      if (error || !data) {
        const s = (error as any)?.context?.status;
        if (s === 403) { toast.error("Premium required"); nav("/premium"); }
        else if (s === 429) {
          let payload: any = null;
          try { payload = await (error as any)?.context?.json?.(); } catch {}
          if (payload?.error === "rate_limited") toast.error("Slow down", { description: payload?.message });
          else { await refreshQuota(); toast.error("Daily limit reached"); }
        }
        else toast.error("Search failed", { description: (error as any)?.message ?? "Unknown error" });
        return;
      }
      applyResult(data);
      setSearchOpen(false);
      setSearchQuery("");
      setSearchGrams("");
      setStep("result");
    } catch (err: any) {
      toast.error("Search failed", { description: err?.message ?? "Unknown error" });
    } finally {
      setSearching(false);
    }
  };

  const callScan = async (imgs: string[], strategy: "primary" | "fallback") => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000);
    try {
      const invokePromise = supabase.functions.invoke("scan-food", {
        body: { images: imgs, portion, source: foodSource, strategy, addOil, addDressing },
      });
      const { data, error } = await Promise.race([
        invokePromise,
        new Promise<never>((_, reject) => controller.signal.addEventListener("abort", () => reject(new Error("Scan timed out")), { once: true })),
      ]);
      clearTimeout(timeout);
      return { data, error };
    } catch (e) {
      clearTimeout(timeout);
      return { data: null, error: e as any };
    }
  };

  const scan = async () => {
    if (previews.length < REQUIRED_PHOTOS) {
      toast.error(`Need ${REQUIRED_PHOTOS} photos`, { description: "Take photos from different angles for accurate analysis." });
      return;
    }
    const quota = await refreshQuota();
    if (quota.daily >= DAILY_LIMIT) {
      setLimitReached(true);
      setStep("portion");
      setPreviews([]);
      setResult(null);
      setScanStatus("");
      toast.error("Daily limit reached", { description: `You've used all ${DAILY_LIMIT} scans for today. Try again tomorrow.` });
      return;
    }
    setScanning(true);
    setResult(null);
    setStep("capture");
    setScanStatus("🔍 Analyzing your food…");
    try {
      let { data, error } = await callScan(previews, "primary");

      // Retry with stronger model + OCR-focused prompt on failure / timeout / low confidence
      const status = (error as any)?.context?.status;
      const lowConfidence = data && typeof data.confidence === "number" && data.confidence < 0.35;
      const shouldRetry = (error && status !== 403 && status !== 402 && status !== 429) || lowConfidence;

      if (shouldRetry) {
        setScanStatus("🤔 First try wasn't confident — retrying with smarter model…");
        // Wait out the server-side scan cooldown (5s) before retrying
        await new Promise((r) => setTimeout(r, 5500));
        const retry = await callScan(previews, "fallback");
        if (!retry.error) {
          data = retry.data;
          error = null;
        } else if (!data) {
          error = retry.error;
        }
      }

      if (error || !data) {
        const s = (error as any)?.context?.status;
        if (s === 403) {
          toast.error("Premium required", { description: "Scanning is a Premium feature." });
          setStep("portion");
          setPreviews([]);
          setResult(null);
          nav("/premium");
        } else if (s === 429) {
          // Could be daily cap or rate limit — read payload and refresh quota
          let payload: any = null;
          try { payload = await (error as any)?.context?.json?.(); } catch {}
          if (payload?.error === "rate_limited") {
            toast.error("Slow down", { description: payload?.message || "Please wait a moment before scanning again." });
          } else {
            const q = await refreshQuota();
            if (q.daily >= DAILY_LIMIT) {
              setLimitReached(true);
              setStep("portion");
              setPreviews([]);
              setResult(null);
              toast.error("Daily limit reached", { description: `You've used all ${DAILY_LIMIT} scans for today.` });
            } else {
              toast.error("Rate limit", { description: "Try again in a moment." });
            }
          }
        } else if (s === 402) {
          toast.error("Out of AI credits", { description: "Add funds to continue." });
        } else {
          toast.error("Scan failed", { description: (error as any)?.message ?? "Unknown error" });
        }
        return;
      }

      setScanStatus("✅ Done");
      applyResult(data);
      setStep("result");
    } catch (err: any) {
      toast.error("Scan failed", { description: err?.message ?? "Unknown error" });
    } finally {
      setScanning(false);
    }
  };

  const save = () => {
    if (!result) return;
    const s = scaleNutrition(result, consumedGrams, calorieAccuracy);
    const finalCalories = caloriesOverride ?? s.calories;
    addMeal({
      id: crypto.randomUUID(),
      name: result.name,
      calories: finalCalories,
      protein: s.protein,
      carbs: s.carbs,
      fat: s.fat,
      fiber: s.fiber,
      sugar: s.sugar,
      sodium: s.sodium,
      saturatedFat: s.saturatedFat,
      cholesterol: s.cholesterol,
      healthScore: result.healthScore,
      category,
      at: Date.now(),
    });
    toast.success(t("scan.meal_added"), { description: `${finalCalories} ${t("scan.kcal_logged")}` });
    nav("/diary");
  };

  const scaledBase: Scaled | null = result ? scaleNutrition(result, consumedGrams, calorieAccuracy) : null;
  // Scale items proportionally so they match the total
  const itemRatio = result && result.calories > 0 && scaledBase
    ? scaledBase.calories / result.calories
    : 1;
  const scaledItems = result?.items?.map((it) => ({
    name: it.name,
    calories: Math.round((it.calories || 0) * itemRatio),
  }));
  // Hidden oil/dressing: ONLY added when the user explicitly turns the toggle ON.
  // Values come from the AI scaled to the visible portion, then re-scaled if the
  // user adjusts the consumed grams. The user's toggle is always the final word.
  const hiddenScaleF = result?.totalGrams && result.totalGrams > 0
    ? consumedGrams / result.totalGrams
    : 1;
  const hiddenOilKcal = addOil
    ? Math.max(0, Math.round((result?.hiddenOilKcal ?? 0) * hiddenScaleF))
    : 0;
  const hiddenDressingKcal = addDressing
    ? Math.max(0, Math.round((result?.hiddenDressingKcal ?? 0) * hiddenScaleF))
    : 0;
  const hiddenKcal = hiddenOilKcal + hiddenDressingKcal;
  // Force Total to equal the sum of items when items exist, so displays never conflict
  const itemsSumBase = scaledItems?.reduce((a, b) => a + b.calories, 0) ?? 0;
  const itemsSum = itemsSumBase + hiddenKcal;
  const computedCalories = scaledBase
    ? (scaledItems && scaledItems.length > 0 ? itemsSumBase : scaledBase.calories) + hiddenKcal
    : 0;
  const displayedCalories = caloriesOverride ?? computedCalories;
  const scaled: Scaled | null = scaledBase
    ? {
        ...scaledBase,
        calories: displayedCalories,
      }
    : null;
  const remaining = Math.max(0, user.calories - caloriesToday(meals) - (scaled?.calories ?? 0));
  

  

  return (
    <div className="k-page">

      <header className="flex items-center gap-3 mb-6">
        <button onClick={() => nav(-1)} className="k-tap w-10 h-10 rounded-full bg-card border border-border/60 flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-semibold tracking-tight flex-1">{t("scan.title")}</h1>
        <span className="text-xs px-2.5 py-1 rounded-full bg-card border border-border/60 text-muted-foreground">
          {dailyUsed}/{DAILY_LIMIT} today
        </span>
      </header>

      <PremiumWrapper
        title="Scan er en Premium-funktion"
        description="Opgradér til ScanIQ Pro for at scanne mad og se detaljerede resultater."
      >


      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={onPick}
      />

      {limitReached ? (
        <div className="k-card p-6 text-center bg-gradient-soft animate-fade-in">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-primary flex items-center justify-center mb-4 shadow-glow">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold mb-2">{t("scan.daily_limit_title")}</h2>
          <p className="text-sm text-muted-foreground mb-5">
            {t("scan.daily_limit_sub")} ({DAILY_LIMIT})
          </p>
          <Button onClick={() => nav("/diary")} className="w-full h-14 rounded-2xl bg-gradient-primary text-base font-semibold shadow-glow">
            {t("scan.view_diary")}
          </Button>
        </div>
      ) : !canScan ? (
        <PremiumLock>
          <div className="relative aspect-[3/4] w-full rounded-3xl overflow-hidden border-[3px] border-foreground bg-card mb-5 shadow-card">
            <ScannerBackdrop />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
              <div className="w-16 h-16 rounded-2xl bg-primary border-[3px] border-foreground flex items-center justify-center mb-3">
                <Camera className="w-8 h-8 text-foreground" />
              </div>
              <p className="text-foreground/70 text-sm font-medium">{t("scan.point")}</p>
            </div>
          </div>
          <Button onClick={startCamera} className="w-full h-14 rounded-2xl bg-gradient-primary text-base font-semibold shadow-glow">
            {t("scan.cta")}
          </Button>
        </PremiumLock>
      ) : (
        <>
          {/* Portion step */}
          {step === "portion" && !result && (
            <div className="animate-fade-in">
              {/* Camera preview hero */}
              <button
                onClick={startCamera}
                className="k-tap relative aspect-[4/3] w-full rounded-3xl overflow-hidden border-[3px] border-foreground bg-card mb-5 shadow-card group"
                aria-label="Open camera"
              >
                <ScannerBackdrop />
                {/* Native system camera is opened via the hidden file input */}
                {preview ? (
                  <img src={preview} alt="" className="absolute inset-0 w-full h-full object-cover" />
                ) : null}
                {[
                  "top-4 left-4 border-t-[3px] border-l-[3px]",
                  "top-4 right-4 border-t-[3px] border-r-[3px]",
                  "bottom-4 left-4 border-b-[3px] border-l-[3px]",
                  "bottom-4 right-4 border-b-[3px] border-r-[3px]",
                ].map((c, i) => (
                  <div key={i} className={`absolute w-10 h-10 rounded-md border-primary ${c}`} />
                ))}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 bg-background/10">
                  <div className="w-16 h-16 rounded-2xl bg-primary border-[3px] border-foreground flex items-center justify-center mb-3 shadow-glow group-active:scale-95 transition-transform">
                    <Camera className="w-8 h-8 text-foreground" />
                  </div>
                  <p className="text-foreground/80 text-sm font-semibold">
                    {previews.length === 0
                      ? t("scan.point")
                      : previews.length >= REQUIRED_PHOTOS
                        ? `${previews.length}/${REQUIRED_PHOTOS} ${t("scan.photos_ready")}`
                        : `${previews.length}/${REQUIRED_PHOTOS} ${t("scan.photos_taken")}`}
                  </p>
                  <label
                    onClick={(e) => e.stopPropagation()}
                    className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-border text-xs font-medium cursor-pointer hover:border-primary"
                  >
                    {t("scan.upload_from_device")}
                    <input type="file" accept="image/*" className="hidden" onChange={onPick} />
                  </label>
                </div>
              </button>

              <div className="k-card p-5 mb-5">
                <h2 className="text-lg font-semibold mb-1">{t("scan.meal_type")}</h2>
                <p className="text-sm text-muted-foreground mb-4">{t("scan.meal_type_sub")}</p>
                <div className="grid grid-cols-4 gap-2">
                  {([
                    ["breakfast", Sun, t("diary.cat_breakfast")],
                    ["lunch", UtensilsCrossed, t("diary.cat_lunch")],
                    ["dinner", Moon, t("diary.cat_dinner")],
                    ["snack", Cookie, t("diary.cat_snack")],
                  ] as [MealCategory, any, string][]).map(([c, Icon, label]) => (
                    <button
                      key={c}
                      onClick={() => setCategory(c)}
                      className={`k-tap rounded-2xl p-3 border-2 transition-all flex flex-col items-center gap-1 ${
                        category === c ? "border-primary bg-primary/10 shadow-glow" : "border-border bg-card"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-[11px] font-semibold">{label}</span>
                    </button>
                  ))}
              </div>

              <div className="k-card p-5 mb-5">
                <h2 className="text-lg font-semibold mb-1">{t("scan.source")}</h2>
                <p className="text-sm text-muted-foreground mb-4">{t("scan.source_sub")}</p>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    ["homemade", "🏠", t("scan.source_home")],
                    ["store", "🛒", t("scan.source_store")],
                    ["restaurant", "🍽️", t("scan.source_restaurant")],
                  ] as [FoodSource, string, string][]).map(([s, emoji, label]) => (
                    <button
                      key={s}
                      onClick={() => setFoodSource(s)}
                      className={`k-tap rounded-2xl p-3 border-2 transition-all flex flex-col items-center gap-1 ${
                        foodSource === s ? "border-primary bg-primary/10 shadow-glow" : "border-border bg-card"
                      }`}
                    >
                      <span className="text-xl leading-none">{emoji}</span>
                      <span className="text-[11px] font-semibold text-center leading-tight">{label}</span>
                    </button>
                  ))}
                </div>
              </div>


              </div>


              {/* Photo thumbnails — always visible with placeholder slots */}
              <div className="k-card p-4 mb-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs tracking-widest uppercase">
                    {previews.length >= REQUIRED_PHOTOS ? (
                      <span className="text-primary font-semibold">{previews.length}/{REQUIRED_PHOTOS} {t("scan.photos_ready").toUpperCase()}</span>
                    ) : (
                      <span className="text-muted-foreground">{previews.length}/{REQUIRED_PHOTOS} {t("scan.photos_taken").toUpperCase()}</span>
                    )}
                  </div>
                  {previews.length >= REQUIRED_PHOTOS && (
                    <div className="flex items-center gap-1 text-xs text-primary font-semibold">
                      <Check className="w-3.5 h-3.5" />
                      {t("scan.ready")}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {Array.from({ length: REQUIRED_PHOTOS }).map((_, i) => {
                    const src = previews[i];
                    if (src) {
                      return (
                        <div key={i} className="relative aspect-square rounded-xl overflow-hidden border-2 border-border">
                          <img src={src} alt="" className="w-full h-full object-cover" />
                          <div className="absolute top-1 left-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-sm">
                            <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} />
                          </div>
                          <button
                            onClick={() => removePhoto(i)}
                            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-background/80 backdrop-blur flex items-center justify-center"
                            aria-label={t("scan.remove_photo")}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    }
                    const isNext = i === previews.length;
                    return (
                      <button
                        key={i}
                        onClick={isNext ? openFilePicker : undefined}
                        disabled={!isNext}
                        className={`aspect-square rounded-xl border-2 border-dashed flex items-center justify-center transition-colors ${
                          isNext
                            ? "border-primary/60 text-primary hover:border-primary hover:bg-primary/5"
                            : "border-border text-muted-foreground/50"
                        }`}
                      >
                        <Plus className="w-7 h-7" />
                      </button>
                    );
                  })}
                </div>
                {previews.length < REQUIRED_PHOTOS && (
                  <p className="text-xs text-muted-foreground mt-2">
                    📸 {t("scan.take_more_hint")}
                  </p>
                )}
              </div>

              {previews.length >= REQUIRED_PHOTOS ? (
                <Button
                  onClick={() => scan()}
                  disabled={scanning}
                  className="w-full h-14 rounded-2xl bg-gradient-primary text-base font-semibold shadow-glow hover:opacity-90"
                >
                  <Sparkles className="w-5 h-5 mr-1" />
                  {t("scan.analyze_photos")} ({previews.length})
                </Button>
              ) : (
                <Button
                  onClick={captureFromCamera}
                  className="w-full h-14 rounded-2xl bg-gradient-primary text-base font-semibold shadow-glow hover:opacity-90"
                >
                  <Camera className="w-5 h-5 mr-1" />
                  {previews.length === 0
                    ? `${t("scan.take_first_photo")} (0/${REQUIRED_PHOTOS})`
                    : `${t("scan.take_next_photo")} (${previews.length}/${REQUIRED_PHOTOS})`}
                </Button>
              )}

              <button
                onClick={() => setSearchOpen(true)}
                className="k-tap w-full mt-3 h-12 rounded-2xl border-2 border-border bg-card text-sm font-semibold flex items-center justify-center gap-2 hover:border-primary transition-colors"
              >
                <Search className="w-4 h-4" />
                {t("scan.search_manually_instead")}
              </button>
            </div>
          )}

          {/* Camera viewport during scan & result */}
          {step !== "portion" && (
            <div className="relative aspect-[3/4] w-full rounded-3xl overflow-hidden border-[3px] border-foreground bg-card mb-5 shadow-card">
              <ScannerBackdrop />
              {preview && (
                <img src={preview} alt="" className="absolute inset-0 w-full h-full object-cover opacity-50" />
              )}
              {[
                "top-6 left-6 border-t-[3px] border-l-[3px]",
                "top-6 right-6 border-t-[3px] border-r-[3px]",
                "bottom-6 left-6 border-b-[3px] border-l-[3px]",
                "bottom-6 right-6 border-b-[3px] border-r-[3px]",
              ].map((c, i) => (
                <div key={i} className={`absolute w-12 h-12 rounded-md border-primary ${c}`} />
              ))}
              {scanning && (
                <>
                  <div className="absolute left-6 right-6 h-0.5 bg-primary shadow-[0_0_20px_hsl(var(--primary))] animate-scan-line" />
                  <div className="pointer-events-none absolute top-0 bottom-0 left-1/2 -translate-x-[68px] w-[2px] bg-primary/80 shadow-[0_0_24px_hsl(var(--primary))]" />
                  <div className="pointer-events-none absolute top-0 bottom-0 left-1/2 translate-x-[68px] w-[2px] bg-primary/80 shadow-[0_0_24px_hsl(var(--primary))]" />
                </>
              )}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
                {scanning ? (
                  <div className="relative flex items-center justify-center">
                    <div className="absolute w-36 h-36 rounded-full border-2 border-primary/70 shadow-[0_0_50px_hsl(var(--primary))] animate-pulse" />
                    <div className="relative w-32 h-32 rounded-full bg-black/75 backdrop-blur-sm border border-primary/60 flex flex-col items-center justify-center">
                      <span className="text-white text-base font-semibold tracking-wide">ScanIQ…</span>
                      <span className="text-white/80 text-[11px] mt-1">{t("scan.analyzing")} {scanProgress}%</span>
                    </div>
                  </div>
                ) : result ? (
                  <div className="animate-scale-in">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-primary border-[3px] border-foreground flex items-center justify-center mb-3">
                      <Check className="w-8 h-8 text-foreground" strokeWidth={3} />
                    </div>
                    <p className="text-2xl font-bold text-foreground">{result.name}</p>
                  </div>
                ) : null}
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-4 animate-fade-in">
              <div className="k-card p-5 bg-gradient-soft">
                <div className="flex items-baseline justify-between">
                  <div>
                    <div className="text-xs text-muted-foreground tracking-widest uppercase">{t("scan.calories")}</div>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={20000}
                      value={displayedCalories === 0 ? "" : displayedCalories}
                      onChange={(e) => {
                        const raw = e.target.value;
                        if (raw === "") { setCaloriesOverride(0); return; }
                        const v = parseInt(raw, 10);
                        if (Number.isFinite(v)) setCaloriesOverride(Math.min(20000, Math.max(0, v)));
                      }}
                      className="bg-transparent border-0 outline-none p-0 m-0 text-5xl font-semibold k-gradient-text w-[5ch] focus:outline-none focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      aria-label="Edit total calories"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card">
                      <Heart className="w-4 h-4 text-primary-glow" />
                      <span className="text-sm font-semibold">{result.healthScore}/10</span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-3">
                  {t("scan.remaining_pre")} <span className="text-foreground font-semibold">{remaining} kcal</span> {t("scan.remaining_post")}
                </p>
                {typeof result.confidence === "number" && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {result.confidence >= 0.75 ? "AI confidence" : "Estimated"}: <span className="text-foreground font-medium">{Math.round(result.confidence * 100)}%</span>
                  </p>
                )}
              </div>


              {(() => {
                const nova = applyProcessingModifier(result, foodSource, result.novaGroup);
                const subKey = (`scan.nutrition_focus_nova${nova}` as const);
                const styles: Record<1 | 2 | 3 | 4, string> = {
                  1: "bg-lime-200 text-lime-950",
                  2: "bg-green-300 text-green-950",
                  3: "bg-yellow-200 text-yellow-950",
                  4: "bg-red-300 text-red-950",
                };
                const labelStyles: Record<1 | 2 | 3 | 4, string> = {
                  1: "text-lime-950/70",
                  2: "text-green-950/70",
                  3: "text-yellow-950/70",
                  4: "text-red-950/70",
                };
                const badgeStyles: Record<1 | 2 | 3 | 4, string> = {
                  1: "bg-lime-400 text-lime-950",
                  2: "bg-green-400 text-green-950",
                  3: "bg-yellow-400 text-yellow-950",
                  4: "bg-red-400 text-red-950",
                };
                return (
                  <div
                    key={`nova-${nova}-${result.name}`}
                    className={`rounded-xl p-4 border-2 border-black ${styles[nova]}`}
                    style={{ boxShadow: "4px 4px 0px 0px #000" }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className={`text-[11px] tracking-widest uppercase font-bold ${labelStyles[nova]}`}>{t("scan.nutrition_focus")}</div>
                      <span className={`text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full border border-black ${badgeStyles[nova]}`}>
                        NOVA {nova}
                      </span>
                    </div>
                    <div className="text-sm leading-snug font-semibold">{t(subKey)}</div>
                  </div>
                );
              })()}


              {(result.satietyHours || result.energyEffect) && (
                <div className="k-card p-4 bg-gradient-soft border border-primary/20">
                  <div className="text-xs text-muted-foreground tracking-widest uppercase mb-2">{t("scan.real_life_score")}</div>
                  {result.satietyHours !== undefined && (
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-muted-foreground">{t("scan.satiety")}</span>
                      <span className="font-semibold">~{result.satietyHours.toFixed(1)} {t("scan.satiety_hours")}</span>
                    </div>
                  )}
                  {result.energyEffect && (
                    <p className="text-sm text-foreground mt-1">⚡ {result.energyEffect}</p>
                  )}
                </div>
              )}

              {scaledItems && scaledItems.length > 0 && (
                <div className="k-card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs text-muted-foreground tracking-widest uppercase">{t("scan.items")}</div>
                    <div className="text-[10px] text-muted-foreground">{t("scan.items_sum")}: {itemsSum} kcal</div>
                  </div>
                  <ul className="divide-y divide-border">
                    {scaledItems.map((it, i) => (
                      <li key={i} className="flex justify-between py-2 text-sm">
                        <span className="text-foreground capitalize">{it.name}</span>
                        <span className="text-muted-foreground">{it.calories} kcal</span>
                      </li>
                    ))}
                    {hiddenOilKcal > 0 && (
                      <li className="flex justify-between py-2 text-sm">
                        <span className="text-foreground">Olie (est.)</span>
                        <span className="text-muted-foreground">+{hiddenOilKcal} kcal</span>
                      </li>
                    )}
                    {hiddenDressingKcal > 0 && (
                      <li className="flex justify-between py-2 text-sm">
                        <span className="text-foreground">Dressing (est.)</span>
                        <span className="text-muted-foreground">+{hiddenDressingKcal} kcal</span>
                      </li>
                    )}
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <Macro label={t("home.protein")} value={scaled?.protein ?? 0} />
                <Macro label={t("home.carbs")} value={scaled?.carbs ?? 0} />
                <Macro label={t("home.fat")} value={scaled?.fat ?? 0} />
              </div>

              {(scaled?.fiber !== undefined || scaled?.sugar !== undefined || scaled?.sodium !== undefined || scaled?.saturatedFat !== undefined || scaled?.cholesterol !== undefined) && (
                <div className="k-card p-4">
                  <div className="text-xs text-muted-foreground tracking-widest uppercase mb-3">{t("micro.title")}</div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
                    {scaled?.fiber !== undefined && (
                      <Micro label={t("micro.fiber")} value={`${scaled.fiber}g`} />
                    )}
                    {scaled?.sugar !== undefined && (
                      <Micro label={t("micro.sugar")} value={`${scaled.sugar}g`} />
                    )}
                    {scaled?.saturatedFat !== undefined && (
                      <Micro label={t("micro.sat_fat")} value={`${scaled.saturatedFat}g`} />
                    )}
                    {scaled?.sodium !== undefined && (
                      <Micro label={t("micro.sodium")} value={`${scaled.sodium}mg`} />
                    )}
                    {scaled?.cholesterol !== undefined && (
                      <Micro label={t("micro.cholesterol")} value={`${scaled.cholesterol}mg`} />
                    )}
                  </div>
                </div>
              )}


              {(() => {
                const vitamins: { label: string; value?: number; unit: string }[] = [
                  { label: "Vitamin A", value: result.vitaminA, unit: "µg" },
                  { label: "Vitamin C", value: result.vitaminC, unit: "mg" },
                  { label: "Vitamin D", value: result.vitaminD, unit: "µg" },
                  { label: "Vitamin E", value: result.vitaminE, unit: "mg" },
                  { label: "Vitamin B12", value: result.vitaminB12, unit: "µg" },
                ];
                const minerals: { label: string; value?: number; unit: string }[] = [
                  { label: "Calcium", value: result.calcium, unit: "mg" },
                  { label: "Iron", value: result.iron, unit: "mg" },
                  { label: "Magnesium", value: result.magnesium, unit: "mg" },
                  { label: "Potassium", value: result.potassium, unit: "mg" },
                  { label: "Zinc", value: result.zinc, unit: "mg" },
                ];
                const hasAny = [...vitamins, ...minerals].some((x) => x.value !== undefined);
                if (!hasAny) return null;
                const fmt = (n: number) => (n >= 10 ? Math.round(n).toString() : (Math.round(n * 10) / 10).toString());
                return (
                  <div className="k-card p-4">
                    <div className="text-xs text-muted-foreground tracking-widest uppercase mb-3">{t("scan.vitamins_minerals")}</div>
                    <div className="mb-3">
                      <div className="text-[11px] font-semibold text-foreground/70 mb-1.5">{t("scan.vitamins")}</div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        {vitamins.filter(v => v.value !== undefined).map((v) => (
                          <Micro key={v.label} label={v.label} value={`${fmt(v.value!)}${v.unit}`} />
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold text-foreground/70 mb-1.5">{t("scan.minerals")}</div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        {minerals.filter(v => v.value !== undefined).map((v) => (
                          <Micro key={v.label} label={v.label} value={`${fmt(v.value!)}${v.unit}`} />
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setResult(null);
                    setPreviews([]);
                    setStep("portion");
                  }}
                  className="h-12 rounded-2xl border-border bg-card"
                >
                  {t("scan.rescan")}
                </Button>
                <Button onClick={save} className="h-12 rounded-2xl bg-gradient-primary shadow-glow hover:opacity-90 font-semibold">
                  {t("scan.add_to_diary")}
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Manual search dialog */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-background/80 backdrop-blur-md animate-fade-in p-4">
          <div className="w-full max-w-md bg-card border-2 border-border rounded-3xl p-5 shadow-card animate-scale-in">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">{t("scan.search_manually")}</h3>
              <button
                onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
                className="k-tap w-9 h-9 rounded-full bg-background border border-border flex items-center justify-center"
                aria-label={t("scan.close")}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              {t("scan.search_help")}
            </p>
            <Input
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !searching) runManualSearch(); }}
              placeholder={t("scan.search_placeholder")}
              maxLength={200}
              className="h-12 rounded-2xl mb-2"
            />
            <div className="flex items-center gap-2 mb-3">
              <Input
                type="number"
                inputMode="numeric"
                min={1}
                max={5000}
                value={searchGrams}
                onChange={(e) => setSearchGrams(e.target.value)}
                placeholder={t("scan.search_grams_optional")}
                className="h-12 rounded-2xl flex-1"
              />
              <span className="text-sm text-muted-foreground">g</span>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {[50, 100, 150, 200, 250, 300].map((g) => (
                <button
                  key={g}
                  onClick={() => setSearchGrams(String(g))}
                  className={`k-tap text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    searchGrams === String(g)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card border-border text-muted-foreground hover:border-primary"
                  }`}
                >
                  {g}g
                </button>
              ))}
            </div>
            <Button
              onClick={runManualSearch}
              disabled={searching || searchQuery.trim().length < 2}
              className="w-full h-12 rounded-2xl bg-gradient-primary font-semibold shadow-glow"
            >
              {searching ? (
                <>
                  <Sparkles className="w-4 h-4 mr-1 animate-pulse" />
                  {t("scan.looking_up")}
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-1" />
                  {t("scan.search_btn")}
                </>
              )}
            </Button>
            <p className="text-[11px] text-muted-foreground mt-3 text-center">
              {t("scan.search_count")} ({dailyUsed}/{DAILY_LIMIT})
            </p>
          </div>
        </div>
      )}
      </PremiumWrapper>
    </div>
  );
}

const Macro = ({ label, value }: { label: string; value: number }) => (
  <div className="k-card p-4 text-center">
    <div className="text-2xl font-semibold">{value}<span className="text-sm text-muted-foreground">g</span></div>
    <div className="text-[10px] tracking-widest uppercase text-muted-foreground mt-1">{label}</div>
  </div>
);

const Micro = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-medium">{value}</span>
  </div>
);

const ScannerBackdrop = () => (
  <>
    <div
      className="absolute inset-0 opacity-[0.06]"
      style={{
        backgroundImage:
          "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }}
    />
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,hsl(var(--primary)/0.18),transparent_65%)]" />
  </>
);

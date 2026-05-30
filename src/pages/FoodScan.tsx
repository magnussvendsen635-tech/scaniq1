import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useKStore, caloriesToday, categoryForNow, type MealCategory } from "@/store/useKStore";
import { Camera, Sparkles, ArrowLeft, Heart, Check, Flame, Crown, Star, Sun, UtensilsCrossed, Moon, Cookie, Search, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useT } from "@/i18n/useT";
import { PremiumLock } from "@/components/PremiumLock";
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
function estimateNova(r: Result, source: FoodSource = "homemade"): 1 | 2 | 3 | 4 {
  const name = (r.name || "").toLowerCase();
  const items = (r.items || []).map((i) => i.name.toLowerCase()).join(" ");
  const text = ` ${name} ${items} `;

  const brandUltra = ALWAYS_ULTRA.test(text);
  const ultra = /\b(chips|crisps|cola|sodavand|soda|energidrik|energy drink|slik|candy|gummi|cornflakes|frosties|instant noodle|instant nudler|færdigret|ready meal|frozen meal|softice|milkshake|protein bar|chokoladebar|donut|donuts|mcdonald|burger king|kfc|domino)\b/i;
  const whole = /\b(æble|banan|pære|appelsin|citron|bær|jordbær|blåbær|hindbær|drue|kiwi|melon|mango|ananas|avocado|tomat|agurk|gulerod|peberfrugt|squash|asparges|broccoli|spinat|salat|kål|løg|hvidløg|svamp|kartoffel|ris|havregryn|quinoa|bønner|linser|kikærter|æg|kylling|kalkun|oksekød|svinekød|laks|torsk|rejer|tofu|nødder|mandler|valnødder|frø|fruit|vegetable|apple|banana|egg|chicken|beef|salmon|rice|oats)\b/i;
  const culinary = /\b(mælk|yoghurt|skyr|hytteost|ost|cheese|smør|olie|mel|flour|honning|honey|sukker|salt|eddike|krydderi|herbs|butter|oil|sugar)\b/i;
  const processed = /\b(pizza|burger|sandwich|wrap|tortilla|pita|bolle|frikadelle|lasagne|gryderet|stew|suppe|soup|risotto|omelet|pandekage|wok|pålæg|skinke|bacon|pølse|marmelade|saft|juice|brød|bread|rugbrød|pasta)\b/i;

  let nova: 1 | 2 | 3 | 4 = 2;
  if (brandUltra || ultra.test(text)) nova = 4;
  else if (whole.test(text) && !processed.test(text) && !culinary.test(text)) nova = 1;
  else if (processed.test(text)) nova = 3;
  else if (culinary.test(text)) nova = 2;

  // Nutrition tiebreaker for ultra-processed signals
  let score = 0;
  if ((r.sugar ?? 0) > 25) score += 2;
  else if ((r.sugar ?? 0) > 15) score += 1;
  if ((r.sodium ?? 0) > 800) score += 2;
  else if ((r.sodium ?? 0) > 500) score += 1;
  if ((r.saturatedFat ?? 0) > 12) score += 1;
  if (score >= 4 && nova < 4) nova = 4;

  // Industrial brands always stay NOVA 4 — source modifier cannot lower it.
  if (brandUltra) return 4;
  // Source-aware overrides
  if (source === "homemade" && nova > 2) nova = 2; // home cooking → green
  if (source === "restaurant" && nova < 3) nova = 3; // restaurant always has culinary processing
  // store can be anything 1-4

  return nova;
}

// Apply the processing modifier on top of an AI-provided NOVA group so the
// source selector (homemade / store / restaurant) still drives the final
// score, while industrial brands remain locked at NOVA 4.
function applyProcessingModifier(r: Result, source: FoodSource, aiNova?: 1 | 2 | 3 | 4): 1 | 2 | 3 | 4 {
  const text = ` ${(r.name || "").toLowerCase()} ${(r.items || []).map((i) => i.name.toLowerCase()).join(" ")} `;
  if (ALWAYS_ULTRA.test(text)) return 4;
  if (typeof aiNova !== "number") return estimateNova(r, source);
  let nova: 1 | 2 | 3 | 4 = aiNova;
  if (source === "homemade" && nova > 2) nova = 2;
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
  const { user, meals, addMeal, streak, addFavorite, isFavorite, calorieAccuracy } = useKStore();
  const [celebrate, setCelebrate] = useState<{ count: number } | null>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  // User-editable total weight (grams) for the current result. Drives all displayed nutrition.
  const [consumedGrams, setConsumedGrams] = useState<number>(0);
  const [previews, setPreviews] = useState<string[]>([]);
  const [portion, setPortion] = useState<Portion>("medium");
  const [foodSource, setFoodSource] = useState<FoodSource>("homemade");
  const [step, setStep] = useState<Step>("portion");
  const [category, setCategory] = useState<MealCategory>(categoryForNow());
  
  const [scansUsed, setScansUsed] = useState<number>(0);
  const [dailyUsed, setDailyUsed] = useState<number>(0);
  const [isPremiumServer, setIsPremiumServer] = useState<boolean>(false);
  const [limitReached, setLimitReached] = useState(false);
  const [scanStatus, setScanStatus] = useState<string>("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchGrams, setSearchGrams] = useState<string>("");
  const [searching, setSearching] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const REQUIRED_PHOTOS = 2;
  const MAX_PHOTOS = 3;
  const DAILY_LIMIT = 20;
  const ADMIN_IDS = new Set<string>(["cc4070c8-9c27-4ffb-9f5d-2b5a72dd5814"]);
  const isAdmin = !!profile && ADMIN_IDS.has(profile.id);
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
    setLimitReached(!ADMIN_IDS.has(profile.id) && daily >= DAILY_LIMIT);
    return { daily, premium: serverPremium };
  };

  const [searchParams, setSearchParams] = useSearchParams();

  // Fetch scan quota from server
  useEffect(() => {
    if (!profile) return;
    refreshQuota();
  }, [profile]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  // Auto-open camera when arriving via ?auto=1 (from bottom-nav scan button)
  useEffect(() => {
    if (searchParams.get("auto") !== "1") return;
    if (!profile) return;
    const timer = setTimeout(() => {
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
    const file = e.target.files?.[0];
    if (!file) return;

    const quota = await refreshQuota();
    if (!quota.premium) {
      toast.error("Premium required", { description: "Scanning is a Premium feature." });
      e.target.value = "";
      nav("/premium");
      return;
    }
    if (quota.daily >= DAILY_LIMIT) {
      setLimitReached(true);
      setStep("portion");
      toast.error("Daily limit reached", { description: `You've used all ${DAILY_LIMIT} scans for today. Try again tomorrow.` });
      e.target.value = "";
      return;
    }

    const dataUrl = await fileToDataUrl(file);
    e.target.value = "";
    setResult(null);
    setPreviews((prev) => {
      const next = [...prev, dataUrl].slice(0, MAX_PHOTOS);
      return next;
    });
    // Stay on portion step so user can see thumbnails + Analyze button.
    // We only switch to "capture" view once scanning actually starts.
  };

  const startCamera = () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      fileRef.current?.click();
      return;
    }

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false })
      .then((stream) => {
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => undefined);
        }
        setCameraReady(true);
      })
      .catch(() => fileRef.current?.click());
  };

  const captureFromCamera = () => {
    const video = videoRef.current;
    if (!cameraReady || !video || video.readyState < 2) {
      startCamera();
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 960;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      fileRef.current?.click();
      return;
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.78);
    setResult(null);
    setPreviews((prev) => [...prev, dataUrl].slice(0, MAX_PHOTOS));
  };

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
    };
    setResult(next);
    // Auto-detect total weight from scan so calories display immediately.
    // The weight field remains an optional manual override.
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
        body: { images: imgs, portion, source: foodSource, strategy },
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
    const prevStreak = streak;
    const prevDate = useKStore.getState().lastActiveDate;
    addMeal({
      id: crypto.randomUUID(),
      name: result.name,
      calories: s.calories,
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
    const newStreak = useKStore.getState().streak;
    const grew = newStreak > prevStreak || prevDate !== useKStore.getState().lastActiveDate;
    if (grew) {
      setCelebrate({ count: newStreak });
      setTimeout(() => {
        setCelebrate(null);
        toast.success(t("scan.meal_added"), { description: `${s.calories} ${t("scan.kcal_logged")}` });
        nav("/diary");
      }, 1800);
    } else {
      toast.success(t("scan.meal_added"), { description: `${s.calories} ${t("scan.kcal_logged")}` });
      nav("/diary");
    }
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
  // Burger detection: add 250 kcal for hidden cooking fats & dressings the camera can't see
  const BURGER_HIDDEN_KCAL = 250;
  const isBurger = !!result && (
    /burger|cheeseburger|hamburger/i.test(result.name ?? "") ||
    (result.items ?? []).some((it) => /burger|cheeseburger|hamburger|bun|patty/i.test(it.name ?? ""))
  );
  const hiddenKcal = isBurger ? BURGER_HIDDEN_KCAL : 0;
  // Force Total to equal the sum of items when items exist, so displays never conflict
  const itemsSumBase = scaledItems?.reduce((a, b) => a + b.calories, 0) ?? 0;
  const itemsSum = itemsSumBase + hiddenKcal;
  const scaled: Scaled | null = scaledBase
    ? {
        ...scaledBase,
        calories: (scaledItems && scaledItems.length > 0 ? itemsSumBase : scaledBase.calories) + hiddenKcal,
      }
    : null;
  const remaining = Math.max(0, user.calories - caloriesToday(meals) - (scaled?.calories ?? 0));
  

  

  return (
    <div className="k-page">
      {celebrate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md animate-fade-in">
          <div className="text-center px-8 animate-scale-in">
            <div className="relative mx-auto w-40 h-40 mb-6">
              <div className="absolute inset-0 rounded-full bg-gradient-primary opacity-30 blur-3xl animate-ping" />
              <div className="absolute inset-0 rounded-full bg-gradient-primary flex items-center justify-center shadow-glow">
                <Flame className="w-20 h-20 text-white drop-shadow-lg" />
              </div>
            </div>
            <div className="text-7xl font-bold k-gradient-text mb-2">{celebrate.count}</div>
            <div className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-3">{t("common.day_streak")}</div>
            <p className="text-lg font-semibold">{t("scan.keep_fire")}</p>
            <p className="text-sm text-muted-foreground mt-1">{t("scan.streak_sub")}</p>
          </div>
        </div>
      )}

      <header className="flex items-center gap-3 mb-6">
        <button onClick={() => nav(-1)} className="k-tap w-10 h-10 rounded-full bg-card border border-border/60 flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-semibold tracking-tight flex-1">{t("scan.title")}</h1>
        <span className="text-xs px-2.5 py-1 rounded-full bg-card border border-border/60 text-muted-foreground">
          {dailyUsed}/{DAILY_LIMIT} today
        </span>
      </header>

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
          <h2 className="text-xl font-bold mb-2">Daily scan limit reached</h2>
          <p className="text-sm text-muted-foreground mb-5">
            You've used all <span className="text-foreground font-semibold">{DAILY_LIMIT} scans</span> for today. The counter resets at midnight (UTC).
          </p>
          <Button onClick={() => nav("/diary")} className="w-full h-14 rounded-2xl bg-gradient-primary text-base font-semibold shadow-glow">
            View diary
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
                <video
                  ref={videoRef}
                  className="absolute inset-0 w-full h-full object-cover"
                  autoPlay
                  muted
                  playsInline
                />
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
                    {previews.length === 0 ? t("scan.point") : `Photo ${previews.length}/${REQUIRED_PHOTOS}`}
                  </p>
                  <label
                    onClick={(e) => e.stopPropagation()}
                    className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-border text-xs font-medium cursor-pointer hover:border-primary"
                  >
                    Upload from device
                    <input type="file" accept="image/*" className="hidden" onChange={onPick} />
                  </label>
                </div>
              </button>

              <div className="k-card p-5 mb-5">
                <h2 className="text-lg font-semibold mb-1">{t("scan.meal_type")}</h2>
                <p className="text-sm text-muted-foreground mb-4">{t("scan.meal_type_sub")}</p>
                <div className="grid grid-cols-4 gap-2">
                  {([
                    ["breakfast", Sun, "Breakfast"],
                    ["lunch", UtensilsCrossed, "Lunch"],
                    ["dinner", Moon, "Dinner"],
                    ["snack", Cookie, "Snack"],
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

              {/* Photo thumbnails */}
              {previews.length > 0 && (
                <div className="k-card p-4 mb-3">
                  <div className="text-xs text-muted-foreground tracking-widest uppercase mb-2">
                    Photos {previews.length}/{REQUIRED_PHOTOS} required
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {previews.map((src, i) => (
                      <div key={i} className="relative aspect-square rounded-xl overflow-hidden border-2 border-border">
                        <img src={src} alt="" className="w-full h-full object-cover" />
                        <button
                          onClick={() => removePhoto(i)}
                          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-background/80 backdrop-blur flex items-center justify-center"
                          aria-label="Remove photo"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    {previews.length < MAX_PHOTOS && (
                      <button
                        onClick={captureFromCamera}
                        className="aspect-square rounded-xl border-2 border-dashed border-border flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                      >
                        <Plus className="w-6 h-6" />
                      </button>
                    )}
                  </div>
                  {previews.length < REQUIRED_PHOTOS && (
                    <p className="text-xs text-muted-foreground mt-2">
                      📸 Take {REQUIRED_PHOTOS - previews.length} more photo{REQUIRED_PHOTOS - previews.length === 1 ? "" : "s"} from a different angle (top + side) for accurate analysis.
                    </p>
                  )}
                </div>
              )}

              {previews.length >= REQUIRED_PHOTOS ? (
                <Button
                  onClick={() => scan()}
                  disabled={scanning}
                  className="w-full h-14 rounded-2xl bg-gradient-primary text-base font-semibold shadow-glow hover:opacity-90"
                >
                  <Sparkles className="w-5 h-5 mr-1" />
                  Analyze {previews.length} photos
                </Button>
              ) : (
                <Button
                  onClick={captureFromCamera}
                  className="w-full h-14 rounded-2xl bg-gradient-primary text-base font-semibold shadow-glow hover:opacity-90"
                >
                  <Camera className="w-5 h-5 mr-1" />
                  {previews.length === 0 ? `Take photo 1 of ${REQUIRED_PHOTOS}` : `Take photo ${previews.length + 1} of ${REQUIRED_PHOTOS}`}
                </Button>
              )}

              <button
                onClick={() => setSearchOpen(true)}
                className="k-tap w-full mt-3 h-12 rounded-2xl border-2 border-border bg-card text-sm font-semibold flex items-center justify-center gap-2 hover:border-primary transition-colors"
              >
                <Search className="w-4 h-4" />
                Search manually instead
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
                <div className="absolute left-6 right-6 h-0.5 bg-primary shadow-[0_0_20px_hsl(var(--primary))] animate-scan-line" />
              )}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
                {scanning ? (
                  <>
                    <div className="relative w-20 h-20 mb-4">
                      <div className="absolute inset-0 rounded-full bg-primary animate-ping opacity-40" />
                      <div className="absolute inset-0 rounded-full bg-primary border-[3px] border-foreground flex items-center justify-center">
                        <Sparkles className="w-9 h-9 text-foreground" />
                      </div>
                    </div>
                    <p className="text-sm text-foreground/70 font-medium">{t("scan.identifying")}</p>
                    {scanStatus && (
                      <p className="text-xs text-foreground/60 mt-2 px-4 max-w-[260px]">{scanStatus}</p>
                    )}
                  </>
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
                    <div className="text-5xl font-semibold k-gradient-text">{scaled?.calories ?? 0}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        if (isFavorite(result.name)) {
                          toast.info("Already in favorites");
                          return;
                        }
                        const s = scaled ?? scaleNutrition(result, consumedGrams, calorieAccuracy);
                        addFavorite({
                          name: result.name,
                          calories: s.calories,
                          protein: s.protein,
                          carbs: s.carbs,
                          fat: s.fat,
                          healthScore: result.healthScore,
                          fiber: s.fiber,
                          sugar: s.sugar,
                          sodium: s.sodium,
                          saturatedFat: s.saturatedFat,
                          cholesterol: s.cholesterol,
                        });
                        toast.success("Saved to favorites ⭐");
                      }}
                      className="k-tap w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center"
                      aria-label="Save as favorite"
                    >
                      <Star className={`w-4 h-4 ${isFavorite(result.name) ? "fill-primary-glow text-primary-glow" : "text-muted-foreground"}`} />
                    </button>
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

                {/* Total weight editor — drives ALL displayed nutrition via (per100g / 100) * grams */}
                <div className="mt-4 pt-4 border-t border-border/60">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground tracking-widest uppercase">Total weight</span>
                    {result.per100g && (
                      <span className="text-[10px] text-muted-foreground">
                        {Math.round(result.per100g.calories)} kcal / 100g
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={5000}
                      placeholder="g"
                      value={consumedGrams === 0 ? "" : consumedGrams}
                      onChange={(e) => {
                        const raw = e.target.value;
                        if (raw === "") { setConsumedGrams(0); return; }
                        const v = parseInt(raw, 10);
                        if (Number.isFinite(v)) setConsumedGrams(Math.min(5000, Math.max(0, v)));
                      }}
                      className="h-11 rounded-xl flex-1"
                    />
                    <span className="text-sm text-muted-foreground">g</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {[50, 100, 150, 200, 250, 300, 400].map((g) => (
                      <button
                        key={g}
                        onClick={() => setConsumedGrams(g)}
                        className={`k-tap text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                          consumedGrams === g
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-card border-border text-muted-foreground hover:border-primary"
                        }`}
                      >
                        {g}g
                      </button>
                    ))}
                  </div>
                </div>
              </div>


              {(() => {
                const nova = applyProcessingModifier(result, foodSource, result.novaGroup);
                const subKey = nova <= 2 ? "scan.nutrition_focus_sub" : "scan.nutrition_focus_processed";
                return (
                  <div className="k-card p-4">
                    <div className="text-xs text-muted-foreground tracking-widest uppercase mb-1">{t("scan.nutrition_focus")}</div>
                    <div className="text-sm text-foreground leading-snug">{t(subKey)}</div>
                  </div>
                );
              })()}


              {(result.satietyHours || result.energyEffect) && (
                <div className="k-card p-4 bg-gradient-soft border border-primary/20">
                  <div className="text-xs text-muted-foreground tracking-widest uppercase mb-2">Real life score</div>
                  {result.satietyHours !== undefined && (
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Mæthed</span>
                      <span className="font-semibold">~{result.satietyHours.toFixed(1)} timer</span>
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
                    <div className="text-xs text-muted-foreground tracking-widest uppercase">Items</div>
                    <div className="text-[10px] text-muted-foreground">Sum: {itemsSum} kcal</div>
                  </div>
                  <ul className="divide-y divide-border">
                    {scaledItems.map((it, i) => (
                      <li key={i} className="flex justify-between py-2 text-sm">
                        <span className="text-foreground capitalize">{it.name}</span>
                        <span className="text-muted-foreground">{it.calories} kcal</span>
                      </li>
                    ))}
                    {hiddenKcal > 0 && (
                      <li className="flex justify-between py-2 text-sm">
                        <span className="text-foreground">Skjult olie & dressing (est.)</span>
                        <span className="text-muted-foreground">+{hiddenKcal} kcal</span>
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
                    <div className="text-xs text-muted-foreground tracking-widest uppercase mb-3">Vitamins & minerals</div>
                    <div className="mb-3">
                      <div className="text-[11px] font-semibold text-foreground/70 mb-1.5">Vitamins</div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        {vitamins.filter(v => v.value !== undefined).map((v) => (
                          <Micro key={v.label} label={v.label} value={`${fmt(v.value!)}${v.unit}`} />
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold text-foreground/70 mb-1.5">Minerals</div>
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
              <h3 className="text-lg font-semibold">Search food manually</h3>
              <button
                onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
                className="k-tap w-9 h-9 rounded-full bg-background border border-border flex items-center justify-center"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Type the food name, and optionally exact grams. Examples: "apple", "pasta carbonara", "skyr".
            </p>
            <Input
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !searching) runManualSearch(); }}
              placeholder="e.g. banana"
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
                placeholder="grams (optional)"
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
                  Looking up…
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-1" />
                  Search
                </>
              )}
            </Button>
            <p className="text-[11px] text-muted-foreground mt-3 text-center">
              Counts as 1 scan toward your daily limit ({dailyUsed}/{DAILY_LIMIT})
            </p>
          </div>
        </div>
      )}
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

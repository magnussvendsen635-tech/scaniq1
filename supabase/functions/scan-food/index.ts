// Edge function: analyze a food image with Lovable AI Gateway (Gemini)
// AI food scanner — scans are currently free and unlimited.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Daily scan cap for premium users (covers food + barcode combined).
const DAILY_SCAN_LIMIT = 30;
// Minimum seconds between scans (anti-bot rate limit, shared with barcode lookup).
const SCAN_COOLDOWN_SECONDS = 5;
// Admin status is checked via the is_admin() RPC against the user_roles table.

const HIDDEN_FAT_ITEM_PATTERN = /hidden|skjult|oil|olie|dressing|butter|smør|fat|fedt|mayo|remoulade|aioli|sauce|sovs/i;
const RAW_NOVA1_ITEM_PATTERN = /cucumber|agurk|banana|banan|apple|æble|orange|appelsin|berry|berries|bær|grape|druer|tomato|tomat|carrot|gulerod|pepper|peberfrugt|lettuce|salat|cabbage|kål|celery|selleri|radish|radise|spinach|spinat|broccoli|cauliflower|blomkål|courgette|zucchini/i;

// User toggles are the SINGLE source of truth for hidden oil & dressing.
// When the toggle is OFF, the value is forced to 0 no matter what the AI returned.
// When ON, the AI's portion-scaled estimate is used (but raw NOVA 1 whole foods are still 0).
function enforceHiddenToggles(
  parsed: Record<string, unknown>,
  addOil: boolean,
  addDressing: boolean,
) {
  // Strip any oil/dressing items the AI tried to sneak into the items list.
  if (Array.isArray(parsed.items)) {
    parsed.items = (parsed.items as Array<Record<string, unknown>>).filter(
      (item) => !HIDDEN_FAT_ITEM_PATTERN.test(String(item?.name ?? "")),
    );
  }

  let oil = Math.max(0, Number(parsed.hiddenOilKcal) || 0);
  let dressing = Math.max(0, Number(parsed.hiddenDressingKcal) || 0);

  if (!addOil) oil = 0;
  if (!addDressing) dressing = 0;

  // Hard safety: raw NOVA 1 whole foods never get hidden oil/dressing.
  const items = Array.isArray(parsed.items) ? parsed.items as Array<Record<string, unknown>> : [];
  const foodText = `${String(parsed.name ?? "")} ${items.map((i) => String(i?.name ?? "")).join(" ")}`;
  const isRawNova1 = parsed.novaGroup === 1 || RAW_NOVA1_ITEM_PATTERN.test(foodText);
  if (isRawNova1) {
    oil = 0;
    dressing = 0;
  }

  parsed.hiddenOilKcal = oil;
  parsed.hiddenDressingKcal = dressing;
  return parsed;
}

// Server-side sanity check for per-100g macros and portion totals.
// GUARANTEES:
//   • protein + carbs + fat per 100g NEVER exceeds 100g (physically impossible otherwise).
//   • Portion totals ALWAYS equal round(per100g / 100 * totalGrams) — no free-hand invention.
//   • kcal per 100g is coherent with macros (protein*4 + carbs*4 + fat*9), tolerated ±20%.
function enforceMacroSanity(parsed: Record<string, unknown>) {
  const per = (parsed.per100g ?? {}) as Record<string, number>;
  const grams = Math.max(0, Number(parsed.totalGrams) || 0);

  let protein = Math.max(0, Number(per.protein) || 0);
  let carbs = Math.max(0, Number(per.carbs) || 0);
  let fat = Math.max(0, Number(per.fat) || 0);

  // Hard clamp: no single macro over 100g / 100g.
  protein = Math.min(protein, 100);
  carbs = Math.min(carbs, 100);
  fat = Math.min(fat, 100);

  // If sum > 100g, proportionally scale down to fit (keeps ratio, fixes AI hallucination).
  const macroSum = protein + carbs + fat;
  if (macroSum > 100) {
    const scale = 100 / macroSum;
    protein = Math.round(protein * scale * 10) / 10;
    carbs = Math.round(carbs * scale * 10) / 10;
    fat = Math.round(fat * scale * 10) / 10;
  }

  // Recompute kcal per 100g from Atwater factors if AI value is way off.
  const atwater = protein * 4 + carbs * 4 + fat * 9;
  let kcal100 = Math.max(0, Number(per.calories) || 0);
  if (atwater > 0 && (kcal100 <= 0 || Math.abs(kcal100 - atwater) / atwater > 0.2)) {
    kcal100 = Math.round(atwater);
  }

  const fiber100 = Math.max(0, Number(per.fiber) || 0);
  const sugar100 = Math.min(carbs, Math.max(0, Number(per.sugar) || 0));
  const sodium100 = Math.max(0, Number(per.sodium) || 0);
  const satFat100 = Math.min(fat, Math.max(0, Number(per.saturatedFat) || 0));
  const chol100 = Math.max(0, Number(per.cholesterol) || 0);

  parsed.per100g = {
    calories: Math.round(kcal100),
    protein,
    carbs,
    fat,
    fiber: fiber100,
    sugar: sugar100,
    sodium: Math.round(sodium100),
    saturatedFat: satFat100,
    cholesterol: Math.round(chol100),
  };

  // ALWAYS recompute totals from per100g × grams — never trust AI-invented portion numbers.
  const factor = grams / 100;
  parsed.calories = Math.round(kcal100 * factor);
  parsed.protein = Math.round(protein * factor * 10) / 10;
  parsed.carbs = Math.round(carbs * factor * 10) / 10;
  parsed.fat = Math.round(fat * factor * 10) / 10;
  parsed.fiber = Math.round(fiber100 * factor * 10) / 10;
  parsed.sugar = Math.round(sugar100 * factor * 10) / 10;
  parsed.sodium = Math.round(sodium100 * factor);
  parsed.saturatedFat = Math.round(satFat100 * factor * 10) / 10;
  parsed.cholesterol = Math.round(chol100 * factor);

  // Sync the single-item calorie sum with the recomputed total when there's exactly one item.
  if (Array.isArray(parsed.items) && parsed.items.length === 1) {
    (parsed.items[0] as Record<string, unknown>).calories = parsed.calories;
  }

  return parsed;
}

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ---- Auth ----
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // ---- Block check ----
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || null;
    const device = req.headers.get("x-device-fingerprint") || null;
    const { data: blocked } = await adminClient.rpc("is_blocked", {
      _user_id: userId,
      _ip: ip,
      _device: device,
    });
    if (blocked) {
      return new Response(JSON.stringify({ error: "blocked", message: "Your access has been blocked." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- Quota check ----
    const { data: profile, error: profErr } = await adminClient
      .from("profiles")
      .select("scan_count, is_premium, daily_scan_count, last_scan_date, last_scan_at")
      .eq("id", userId)
      .maybeSingle();

    if (profErr) {
      console.error("profile fetch error", profErr);
      return new Response(JSON.stringify({ error: "Profile lookup failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const today = todayUTC();
    const scanCount = profile?.scan_count ?? 0;
    const isPremium = profile?.is_premium ?? false;
    const { data: isAdmin } = await adminClient.rpc("is_admin", { _user_id: userId });
    const lastDate = profile?.last_scan_date ?? null;
    // Reset daily counter if it's a new day
    const dailyUsed = lastDate === today ? (profile?.daily_scan_count ?? 0) : 0;

    // Premium required to scan at all (admins bypass)
    if (!isPremium && !isAdmin) {
      return new Response(
        JSON.stringify({
          error: "premium_required",
          message: "Scanning is a Premium feature. Upgrade to start scanning.",
          is_premium: false,
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Rate limit: enforce cooldown between scans (anti-bot) — admins bypass
    if (!isAdmin && profile?.last_scan_at) {
      const lastMs = new Date(profile.last_scan_at).getTime();
      const elapsedSec = (Date.now() - lastMs) / 1000;
      if (elapsedSec < SCAN_COOLDOWN_SECONDS) {
        const retryAfter = Math.ceil(SCAN_COOLDOWN_SECONDS - elapsedSec);
        return new Response(
          JSON.stringify({
            error: "rate_limited",
            message: `Please wait ${retryAfter}s before scanning again.`,
            retry_after: retryAfter,
          }),
          {
            status: 429,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
              "Retry-After": String(retryAfter),
            },
          },
        );
      }
    }

    if (!isAdmin && dailyUsed >= DAILY_SCAN_LIMIT) {
      return new Response(
        JSON.stringify({
          error: "daily_scan_limit_reached",
          message: `Daily scan limit reached (${DAILY_SCAN_LIMIT}/day). Try again tomorrow.`,
          daily_used: dailyUsed,
          daily_limit: DAILY_SCAN_LIMIT,
          is_premium: isPremium,
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ---- Input ----
    const body = await req.json();
    const { portion, strategy } = body;
    const addOil = body.addOil === true;
    const addDressing = body.addDressing === true;
    const source: "homemade" | "store" | "restaurant" =
      body.source === "store" || body.source === "restaurant" ? body.source : "homemade";
    const homemadeRecipes: Array<{ name: string; calories: number; protein?: number; carbs?: number; fat?: number }> =
      Array.isArray(body.homemadeRecipes) ? body.homemadeRecipes.slice(0, 20) : [];

    // ---- User language (drives all human-readable output strings) ----
    const LANG_NAMES: Record<string, string> = {
      da: "Danish", en: "English", de: "German", fr: "French", es: "Spanish",
      it: "Italian", nl: "Dutch", sv: "Swedish", no: "Norwegian", fi: "Finnish",
      is: "Icelandic", pt: "Portuguese", pl: "Polish", cs: "Czech", sk: "Slovak",
      hu: "Hungarian", ro: "Romanian", bg: "Bulgarian", el: "Greek", tr: "Turkish",
      ru: "Russian", uk: "Ukrainian", ar: "Arabic", he: "Hebrew", fa: "Persian",
      hi: "Hindi", bn: "Bengali", ur: "Urdu", th: "Thai", vi: "Vietnamese",
      id: "Indonesian", ms: "Malay", ja: "Japanese", ko: "Korean", zh: "Mandarin Chinese",
      yue: "Cantonese",
    };
    const langCode = typeof body.language === "string" && body.language.length > 0 ? body.language : "en";
    const languageName = LANG_NAMES[langCode] ?? langCode;

    let images: string[] = [];
    if (Array.isArray(body.images)) {
      images = body.images.filter((x: unknown) => typeof x === "string" && x.length > 0);
    } else if (typeof body.image === "string") {
      images = [body.image];
    }
    if (images.length === 0) {
      return new Response(JSON.stringify({ error: "Missing images (data URLs)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    images = images.slice(0, 3);

    const portionLabel: "small" | "medium" | "large" =
      portion === "small" || portion === "large" ? portion : "medium";
    const portionHint = {
      small: "The user indicates this is a SMALL portion (~60-70% of a typical serving). Scale calories and macros accordingly.",
      medium: "The user indicates this is a MEDIUM/typical portion size.",
      large: "The user indicates this is a LARGE portion (~140-160% of a typical serving). Scale calories and macros accordingly.",
    }[portionLabel];

    const useFallback = strategy === "fallback";
    const model = useFallback ? "google/gemini-2.5-pro" : "google/gemini-2.5-flash";
    const extraHint = useFallback
      ? " RETRY MODE: previous attempt failed or was low-confidence. Look EXTRA carefully — read any text/labels/brands on packaging (OCR), zoom mentally on the product, and make your best guess even if partial. NEVER refuse."
      : "";

    // Build a homemade-priority addendum + recipe-matching block.
    const homemadeBlock = source === "homemade"
      ? (
        "HOMEMADE MODE — The user has explicitly marked this meal as HOMEMADE. Prefer homemade defaults over restaurant/industrial defaults: " +
        "  • Smaller average portion size than a restaurant plate. " +
        "  • Less added oil/butter/salt unless visibly present. " +
        "  • Use NOVA 1-3 unless an industrial branded item is clearly visible (NOVA 4 only for visible industrial packaging). " +
        "  • Use kitchen recipe standards (USDA home-cooked entries) not chain-restaurant entries. " +
        (homemadeRecipes.length > 0
          ? "RECIPE MATCHING — Below is the user's personal recipe database (their saved 'Favorites'/homemade meals). FIRST, try to visually match the dish in the photo to one of these recipes by name and visible components. If a confident match (>=0.7) exists, USE THAT RECIPE'S calorie + macro values as your baseline (scaled to the visible portion via totalGrams), and set the result `name` to the matched recipe name. If no good match, fall back to general homemade analysis. User's recipes (JSON): " +
            JSON.stringify(homemadeRecipes) + ". "
          : "")
      )
      : (source === "restaurant"
        ? "RESTAURANT MODE — Assume restaurant-typical portion, cooking fat and salt levels. "
        : "STORE MODE — Assume packaged/industrial product values when in doubt. ");



    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- AI call ----
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0,
        top_p: 1,
        seed: 42,
        messages: [
          {
            role: "system",
            content:
              "You are a food data tracker. Your ONLY job is to objectively identify food and report nutrition facts. You are NOT a doctor, dietitian, coach or health advisor. " +
              "MEAL TYPE RULE — The selected Meal Type (Breakfast, Lunch, Dinner, Snack) is ONLY used for UI categorization in the user's diary. It MUST have 0% influence on the portion size, calorie, or macro estimation. Estimate calories and portion size SOLELY based on the visual volume of the food in the photo, completely ignoring whether it is logged as a snack or dinner. " +
              "SOURCE METADATA BAN (CRITICAL) — Completely ignore the user-provided Food Source / origin / mode (Homemade, Store-bought, Restaurant) for ALL nutrition, NOVA, calorie, macro, hidden-oil and dressing calculations. Do not reward or penalize any source. Never infer oil, dressing, processing level, portion size, or calorie density from where the food came from. Analyze ONLY the physical food item visible in the photo. A raw cucumber is cucumber only in every mode. A burger is a prepared dish in every mode. " +
              "STRICTLY FORBIDDEN — never give dietary, health, medical or lifestyle advice. NEVER tell the user what they should or shouldn't eat. NEVER use words like 'avoid', 'stay away', 'bad', 'unhealthy', 'dangerous', 'toxic', 'junk', 'guilty', 'cheat', 'too much', 'cut down', 'eat instead'. NEVER suggest alternatives or improvements. NEVER warn about health effects. Output must be purely analytical: ingredients, calories, macros, micros, and the NOVA processing category — nothing more. This is required to comply with Apple App Store Medical Guidelines. " +
              "TONE — strictly neutral, factual, supportive. Describe what the food IS, never what it does to the user's health. " +
              "INGREDIENT HONESTY — Only list ingredients you can actually SEE. Never assume oil, flour, butter, sugar, additives or preservatives unless clearly visible (oily surface, labelled package, visible breading). If unsure, say 'possible ingredients detected' and lower your confidence. A whole apple has ONE ingredient: apple. " +
              "PROCESSING LEVEL (NOVA) — Classify based on the visible food item, not the source label. " +
              "  • NOVA 1 (unprocessed / minimally processed): single natural foods — apple, banana, egg, plain rice, plain chicken breast, broccoli, fish, raw vegetables, fresh fruit. Almost ALWAYS NOVA 1. " +
              "  • NOVA 2 (processed culinary ingredients): items used in cooking — oil, butter, salt, sugar, flour, vinegar, herbs. Or whole foods combined with them (boiled potatoes with butter, salad with olive oil, plain yoghurt with honey). " +
              "  • NOVA 3 (processed foods): combinations of NOVA 1 + NOVA 2 made in a kitchen — pizza, pasta, bread, sandwiches, cheese, cured meats, canned beans, a steak fried in butter with salt. " +
              "  • NOVA 4 (ultra-processed): ONLY clearly industrial formulations with additives, flavour enhancers, emulsifiers, preservatives — soda, chips, candy, instant noodles, ready meals, packaged sweets/pastries, energy drinks, fast-food chain products, factory-made sausages, breakfast cereals like Frosties/Cornflakes. " +
              "  Default DOWN if unsure. A photo of fruit must never be NOVA 4. " +
              "STEP 1 — IDENTIFY (do NOT confuse similar foods): " +
              "  • SOUP vs YOGHURT vs SKYR vs PORRIDGE — critical distinction:" +
              "    - SOUP (suppe): liquid surface, broth, often steaming. ~50-80 kcal/100g." +
              "    - SKYR: thick, matte, very white, often with berries/granola. ~60-70 kcal/100g, high protein 10-12g." +
              "    - YOGHURT: smoother shinier, white/cream. ~60-100 kcal/100g, protein 4-6g." +
              "    - PORRIDGE: visible grains/oats, thick, beige. ~80-110 kcal/100g." +
              "  • Plate → name each component honestly. " +
              "  • Packaged product → read brand + product name (OCR). " +
              "STEP 2 — COUNT & WEIGH (CRITICAL — do this BEFORE outputting any calorie number): " +
              "  (a) COUNT items: Detect the EXACT number of distinct items in the photo (e.g. 4 separate bananas = 4, not 1; 3 eggs = 3; 6 strawberries = 6). Multiply per-item weight by the count. Never collapse multiple visible items into a single serving. " +
              "  (b) SCALE CUES: Use real-world references to estimate size — adult hand ~18-19cm, finger width ~2cm, plate ~26cm, fork ~20cm, bowl ~300-400ml, glass ~250ml, smartphone ~15cm. If a hand is holding the food, calibrate against the hand. " +
              "  (c) CALORIE-DENSITY SANITY CHECK — physical volume ≠ calories. Apply realistic per-100g baselines: " +
              "      • Water-dense vegetables (cabbage, iceberg/romaine lettuce, cucumber, tomato, courgette/zucchini, bell pepper, celery, radish, spinach, broccoli, cauliflower): ~15-30 kcal/100g. A huge bowl of salad or shredded cabbage is still only ~20-30 kcal/100g — do NOT overestimate based on bulk. " +
              "      • Dense fruits: banana ~89 kcal/100g (a medium/large banana ≈ 100-120g peeled → ~90-105 kcal PER banana; multiply by count), apple ~52 kcal/100g (medium ~180g → ~95 kcal), avocado ~160 kcal/100g, grapes ~67 kcal/100g. " +
              "      • Cooked starches: rice/pasta ~130-160 kcal/100g cooked, bread ~250-280 kcal/100g, potato ~80 kcal/100g boiled. " +
              "      • Proteins: chicken breast ~165 kcal/100g, salmon ~200 kcal/100g, egg ~155 kcal/100g (one egg ~50g → ~78 kcal). " +
              "      • Fats/oils/nuts: 600-900 kcal/100g. " +
              "  (d) Estimate totalGrams = sum of (count × per-item grams) for whole items, or visual volume × density for mixed dishes. IGNORE the meal-type label when sizing. For liquids treat ml as grams. " +
              "  (e) Only AFTER totalGrams is fixed, compute calories = per100g.calories / 100 * totalGrams. Never reverse-engineer grams from a guessed calorie number. " +
              "  (f) HIDDEN OIL & DRESSING — USER TOGGLES ARE ABSOLUTE LAW: " +
              `      • The user controls two toggles. CURRENT STATE: addOil=${addOil}, addDressing=${addDressing}. ` +
              "      • These toggles are the ONLY source of truth. You are STRICTLY FORBIDDEN from inferring, guessing, or auto-adding any hidden oil/butter/dressing/sauce calories outside of these toggles. " +
              "      • Report hidden oil and dressing as TWO SEPARATE TOP-LEVEL FIELDS: `hiddenOilKcal` and `hiddenDressingKcal`. These MUST NEVER be folded into `calories`, `per100g`, `fat`, `saturatedFat`, or the `items` array. The base `calories` and `per100g` describe ONLY the visible food itself, with no hidden cooking fat baked in. " +
              "      • Do NOT create any item in the `items` array named 'Skjult olie', 'Hidden oil', 'Dressing', 'Sovs', 'Mayo', 'Aioli' or similar. Use only the two top-level fields. " +
              `      • addOil=${addOil}: ${addOil ? "ON → PERFORM A VISUAL ESTIMATE of cooking oil/butter actually used, based on what you SEE in the photo: dish type (sautéed/pan-fried/deep-fried/roasted/raw), oily sheen, glossiness, fried surface color, and the actual totalGrams of the visible portion. FLAT/CONSTANT numbers are FORBIDDEN — the value MUST scale linearly with totalGrams and with cooking method intensity. Reference grams of fat per gram of food (then × 9 kcal/g): light sauté ≈ 0.03-0.05 g_fat/g_food, generous pan-fry ≈ 0.06-0.10, deep-fried ≈ 0.10-0.20, roasted veg with light oil ≈ 0.02-0.04, raw/steamed dish ≈ 0. Compute: hiddenOilKcal = round(totalGrams × g_fat_per_g × 9). Two photos of the same dish at different sizes MUST give proportionally different numbers." : "OFF → hiddenOilKcal MUST be exactly 0. Do not add any cooking-fat calories regardless of what you see."} ` +
              `      • addDressing=${addDressing}: ${addDressing ? "ON → PERFORM A VISUAL ESTIMATE of dressing/sauce/mayo/aioli ACTUALLY VISIBLE on the dish. Look at coverage area, pooling, thickness, and the totalGrams of the portion. FLAT numbers are FORBIDDEN — scale with visible dressing volume AND portion size. Reference grams of dressing per gram of food: light drizzle ≈ 0.02-0.04 g/g, normal coating ≈ 0.05-0.08, heavy mayo/aioli/creamy ≈ 0.08-0.15. Typical dressing energy density ≈ 4-6 kcal/g (vinaigrette ~4, mayo/aioli ~6.5). Compute: hiddenDressingKcal = round(totalGrams × g_dressing_per_g × kcal_per_g). If no dressing is visible at all, return 0 even with toggle ON." : "OFF → hiddenDressingKcal MUST be exactly 0. Do not add any dressing calories regardless of what you see."} ` +
              "      • HARD SAFETY: For raw NOVA 1 whole foods (cucumber, agurk, raw fruit, raw vegetables, plain salad leaves with no visible dressing), both hiddenOilKcal and hiddenDressingKcal MUST be 0 even if the corresponding toggle is ON. " +
              "      • If a toggle is OFF, the corresponding kcal field MUST be 0. No exceptions, no overrides. The user's choice wins over your visual guess. " +
              "PACKAGED PRODUCT RULE (CRITICAL): If the photo shows a packaged product (bottle, can, box, bag, wrapper) — soda bottle, Pringles can, candy bar, bread bag, chocolate, chips, energy drink etc. — the user is logging the WHOLE package, not a tiny taste. ALWAYS use the FULL net weight / volume printed on (or typical for) that package as totalGrams. Examples: 0.5L Coca-Cola bottle = 500g, standard Pringles can = 165g, Snickers bar = 50g, 1.5L soda = 1500g, 330ml can = 330g, 200g chocolate bar = 200g, package of buns/rolls = full package weight. Never default to 50g or 100g for a clearly whole packaged product. Read the label (OCR) when visible; otherwise use the standard retail size for that exact product. " +
              "STEP 3 — NUTRITION: ALWAYS produce values per 100g (`per100g`) using accurate USDA/European/Nordic database values for the identified food. Then compute the totals for the portion using the formula: total = round(per100g_value / 100 * totalGrams). Calories, protein, carbs, fat, fiber, sugar, sodium, saturatedFat and cholesterol totals MUST match this formula exactly. Never invent a portion calorie number that contradicts per100g * grams. " +
              "STEP 3b — FEDT- & DRESSING-DETEKTIV (OBLIGATORISK, advisory lag — kører UAFHÆNGIGT af addOil/addDressing toggles): " +
              "  • Analyser billedet for olie, dressing, sauce, mayo, smør, smeltet ost, fryerskorpe og glans. " +
              "  • MATEMATISK KRAV: total_kcal SKAL = sum(hovedingredienser) + skjulte_kilder_estimat. Aldrig kun tekst — altid tal. " +
              "  • SKALERING: `hiddenSourcesEstimateKcal` SKAL skalere med portionsstørrelsen (totalGrams) og med hvor meget olie/dressing der faktisk ses. En lille burger og en kæmpe burger må ALDRIG få samme tal. Brug ca. 0.03–0.15 g fedt/dressing pr. g mad × 6–9 kcal/g afhængigt af synlig mængde. Faste/konstante tal som '200' er FORBUDT. " +
              "  • RESTAURANT-STANDARD (KRITISK): Hvis måltidet kommer fra en restaurant/cafe/takeaway (steak sandwich, burger, club sandwich, wrap, panini, pasta-ret, salatbowle med protein osv.), SKAL du estimere mod en REALISTISK RESTAURANT-PORTION — IKKE en let hjemmelavet version. Restauranter bruger generøst smør/olie på pande og grill, smører brød med fedt, tilsætter dressing/mayo/aioli, og portionerne er store. Hvis du er i tvivl mellem to estimater, VÆLG ALTID DEN ØVRE GRÆNSE. En typisk restaurant-steak-sandwich ligger fx 700–950 kcal, ikke 400–500. Skjulte kilder må ALDRIG være 0 for restaurantmad. " +
              "  • RÅVARE-UNDTAGELSE: Et helt æble, en banan, et glas vand, en rå agurk → `hiddenSourcesEstimateKcal` = 0. " +
              "  • RECOGNISED BRAND/CHAIN CONTEXT (HØJESTE PRIORITET): Hvis du genkender et specifikt brand eller produkt på etiketten (YoPRO, Arla Protein, Barebells, Nick's, Maxi Nutrition, Pringles, Snickers, Big Mac, Coca-Cola, Monster osv.), SKAL du bruge din interne viden om det faktiske produkts officielle næringsindhold — IKKE et visuelt gæt baseret på protein-tallet på forsiden. Brandets officielle tal vinder altid over visuel estimering. " +
              "  • PROTEIN-DRIK REGEL (KRITISK): Når produktet er en proteindrik/proteinshake/protein milk (YoPRO drik, Arla Protein drik, Barebells shake, Nick's shake, Maxi Nutrition shake osv.), gælder: " +
              "      - Kalorier pr. flaske/portion SKAL ligge i intervallet 150–160 kcal (typisk 250–330 ml). " +
              "      - Hvis din beregning kommer over 180 kcal, har du sandsynligvis overestimeret kulhydraterne — genovervej og reducér carbs/sukker. " +
              "      - STOP SUKKER-GÆTTERI: Antag IKKE at der er sukker i en proteindrik. Mange er sukkerfri/low-sugar (typisk 2–6 g kulhydrater, heraf 1–3 g sukker). Tilskriv kun sukker hvis du faktisk kan se ordet 'sukker' / 'sugar' / 'cukier' eller en sukkerindholds-værdi på etiketten via OCR. Default sugar = 0–3 g for proteindrikke. " +
              "      - hiddenSourcesEstimateKcal = 0 for emballerede proteindrikke (intet skjult fedt/dressing i en lukket flaske). " +
              "  • VISUEL PRIORITERINGS-REGEL (HØJESTE PRIORITET, slår intern database): Tekst og marketing-claims på emballagen vinder ALTID over din interne database/standard-model. " +
              "      - Hvis du via OCR ser 'NO ADDED SUGAR' / 'NO ADDED SUGARS' / 'UTEN TILSAT SUKKER' / 'INGEN TILSAT SUKKER' / 'SUGAR FREE' / 'ZERO SUGAR' / 'CUKIER 0' eller lignende, er det STRENGT FORBUDT at sætte sugar > 5 g, og 'Tilsat sukker' MÅ IKKE optræde i criticalIngredients. Sæt sugar lavt (0–3 g pr. portion). " +
              "      - Hvis du ser 'HIGH PROTEIN' / 'PROTEIN+' / 'PROTEIN' som hoved-claim, skal sugar-default automatisk justeres til <3 g, uanset hvad din standard-model for 'milkshake/yoghurt-drik' ellers ville foreslå. " +
              "      - Hvis du genkender et kendt produkt (fx 'Nutramino Nutra-Go', 'YoPRO', 'Arla Protein', 'Barebells'), SKAL du proaktivt lede efter tekst på emballagen der modbeviser din interne database FØR du gætter på sukker eller kalorier. " +
              "  • ZERO / SUGAR-FREE PRODUKTER (KRITISK): Hvis produktet er kategoriseret som 'Zero', 'Sugar-Free', 'Diet', 'Light' med sukkerfri-claim (Coca-Cola Zero, Pepsi Max, Coke Zero, Monster Zero, Sprite Zero, Red Bull Sugarfree osv.), er det STRENGT FORBUDT at inkludere 'Tilsat sukker' / 'Added sugar' i criticalIngredients. Fjern det automatisk. Generelt: hvis sugar < 1 g pr. portion, må 'Tilsat sukker' ALDRIG stå i criticalIngredients. " +
              "  • NOVA-LOGIK (intelligent klassificering — restaurantmad ≠ industri): " +
              "      - RESTAURANT-/CAFE-/TAKEAWAY-RETTER tilberedt i et køkken (steak sandwich, burger lavet på stedet, club sandwich, wrap, pasta, pizza fra pizzeria, salat med dressing) → NOVA 3 som standard. Brug KUN NOVA 4 hvis du ser TYDELIGE tegn på industrielt fyld (færdiglavede frosne bøffer/nuggets, tydeligt industriel sauce-emballage, fastfood-kæde-produkt som Big Mac/Whopper). I tvivl → NOVA 3, ALDRIG NOVA 4. " +
              "      - DRIKKEVARER & EMBALLEREDE INDUSTRIPRODUKTER (sodavand/cola, energidrik, juice fra karton, chips, slik, instant nudler, færdigpakkede kager, proteinbarer) → ALTID NOVA 4, selv hvis købt på en restaurant. Kilde-stedet ændrer ikke produktets forarbejdningsgrad. " +
              "      - NOVA 1 KUN til rene råvarer (et æble, rå broccoli, rent ubehandlet kød/fisk). " +
              "      - NOVA 2 til rene tilberedningsingredienser (olie, smør, sukker, mel). " +
              "  • OBJEKTIVITET — returnér altid et realistisk kcal-interval i `caloriesMin` og `caloriesMax` (caloriesMin ≤ calories ≤ caloriesMax, typisk ±10–25%). " +
              "  • REASONING — udfyld `detectiveReasoning` på dansk med kort sætning der NAVNGIVER præcis hvad du ser. Nævn kun de kilder der faktisk er til stede: hvis der KUN er olie/glans og ingen synlig dressing, skriv 'olie' (fx 'Jeg har inkluderet 90 kcal for olie pga. olieglans på kødet'); hvis der KUN er dressing, skriv 'dressing'; hvis begge dele er synlige, nævn begge. Skriv aldrig 'dressing' når der ingen dressing er. Hvis estimatet er 0, forklar kort hvorfor (fx 'Rå frugt, ingen synlige fedtkilder'). " +
              "STEP 4 — HEALTH SCORE 1-10: a NEUTRAL nutrient-density score, NOT a verdict. 10 = nutrient-dense whole foods, 1 = nutrient-poor. Do not interpret it for the user. " +
              "STEP 5 — REAL-LIFE EFFECT: estimate satiety_hours and a one-sentence neutral energy_effect in Danish describing energy/satiety pattern only (e.g. 'Stabil energi i 3 timer', 'Hurtigt energiboost der falder igen efter ca. 1 time'). NEVER advice, NEVER judgement. " +
              "STEP 6 — VITAMINS & MINERALS: realistic per-portion values from USDA/Nordic data. 0 if truly absent. " +
              "STEP 7 — ERNÆRINGSEKSPERT-LOGIK (OBLIGATORISK for hver scanning): " +
              "  (a) TØRVÆGT vs SPISEFÆRDIG VÆGT: Afgør altid om de rapporterede værdier er for tørvægt (rå ris, tørret pasta, havregryn, tørrede bønner, tørrede linser) eller for spisefærdig/tilberedt vægt (kogt ris, kogt pasta, dåse-tun i vand, tilberedt kød). Standard USDA/Nordic-værdier for 'rice raw' ≈ 360 kcal/100g mens 'rice cooked' ≈ 130 kcal/100g. Vælg det format der matcher hvad brugeren FAKTISK spiser/logger, og skriv det eksplicit i detectiveReasoning (fx 'Værdierne er for kogt ris' eller 'Værdierne er for tørvægt havregryn — tilføj ~2,5x vand'). " +
              "  (b) MAKRO SANITY CHECK: Læg protein + kulhydrater + fedt sammen pr. 100g. Summen MÅ ALDRIG overstige 100g. Hvis din foreløbige beregning giver >100g, er tallene forkerte — ret dem ned til realistiske USDA/Nordic-værdier FØR du kalder report_nutrition. Tjek også at kcal ≈ protein*4 + carbs*4 + fat*9 (±15%). Hvis afvigelsen er større, genberegn. " +
              "  (c) OPSKRIFTS-LOGIK (mangler-tilberedningsingredienser): Hvis produktet er en RÅVARE der næsten aldrig spises alene og kræver tilberedning med andre ingredienser (grødris → mælk, havregryn → mælk/vand, tørret pasta → sauce, tørrede bønner → væske, kagemix → æg/smør/mælk, pandekagemix → mælk/æg), SKAL du tilføje en klar note i detectiveReasoning på dansk om hvad brugeren MANGLER at logge og hvor mange kalorier det typisk tilføjer (fx 'Husk at logge mælk til din risengrød — 5 dl sødmælk ≈ 320 kcal'). " +
              "  (d) ETIKET-ANALYSE — RÅVARE-OVERRIDE: Ignorér automatiske 'ultra-processed' / NOVA 4-tags fra eksterne databaser hvis produktet visuelt er en ren råvare (hel frugt, hel grøntsag, rent kød, rent fisk, rene tørrede korn/bælgfrugter uden tilsætning). Vurder selv NOVA-niveauet ud fra den faktiske ingrediensliste du kan se — ikke ud fra en generisk database-etiket. Default DOWN i tvivl. " +
              "  (e) EKSPERT-NOTE OUTPUT: Din samlede ekspert-vurdering (tørvægt/spisefærdig-kontekst + tilberedningstips + eventuelle rettelser fra sanity check) SKAL skrives på dansk i `detectiveReasoning`-feltet som en kort, faktuel note. Ingen kostråd, ingen sundhedsdomme — kun ernæringsfaglige oplysninger. " +
              "  (f) BAGSIDE-PRIORITET (KRITISK — slår produktnavn/forside): For ALLE emballerede produkter SKAL du prioritere teksten på BAGSIDEN af emballagen (ingrediensliste + næringsdeklaration/nutrition table) HØJERE end produktnavnet på forsiden, brandet, marketing-claims eller din interne database-antagelse. Du må ALDRIG klassificere NOVA-niveau, tilsat sukker, kalorier, makroer eller ingredienser ud fra produktnavnet alene (fx 'chokoladenødder' ≠ automatisk NOVA 1 whole food — læs ingredienslisten: hvis der står sukker, glukosesirup, palmeolie, emulgator, aroma → NOVA 4). Konkret arbejdsgang: (1) Læs OCR på bagsiden først — ingrediensliste OG næringstabel. (2) Hvis ingredienslisten indeholder tilsat sukker, sirup, olier, emulgatorer (E-numre, lecithin), aromaer, farvestoffer, konserveringsmidler, smagsforstærkere eller >5 ingredienser med industrielle navne → klassificer som NOVA 4 uanset hvor 'naturligt' navnet lyder. (3) Brug de faktiske tal fra næringstabellen til calories/protein/carbs/fat/sugar/salt frem for gæt baseret på kategori. (4) Hvis bagsiden IKKE er synlig eller ulæselig, skriv eksplicit i detectiveReasoning 'Bagside ikke synlig — estimeret ud fra produktnavn, lavere konfidens' og sænk confidence. Forsidenavnet er KUN et hint til identifikation, ALDRIG kilden til næringsværdier eller forarbejdningsgrad. " +
              "STEP 8 — ETIKET-CITAT & ANTI-GÆT (OBLIGATORISK for ALLE emballerede produkter): " +
              "  (a) CITAT FØRST: `detectiveReasoning` SKAL ALTID starte med præcis denne sætning på dansk: 'Jeg læser følgende fra etiketten: ' efterfulgt af en ordret gengivelse (verbatim OCR) af den tekst du faktisk kan læse på pakken — produktnavn, evt. undertekst/claims, ingrediensliste hvis synlig, og næringstabel-værdier hvis synlige (fx 'Energi 360 kcal, protein 7g, kulhydrat 78g, fedt 1g pr. 100g'). Ingen omskrivning, ingen fortolkning i dette citat — bare hvad der står. Derefter må du tilføje din ekspert-note (STEP 7e) i samme felt. " +
              "  (b) FORBUD MOD GÆT FRA HUKOMMELSE: Hvis der IKKE er en synlig næringstabel på billedet (energi/kcal + protein + kulhydrat + fedt pr. 100g), er det STRENGT FORBUDT at bruge produktnavnet, brandet eller din interne database/hukommelse til at udfylde calories/protein/carbs/fat/sugar/salt. Du må ALDRIG opfinde tal eller hente dem fra typiske USDA/Nordic-værdier for kategorien i denne situation. " +
              "  (c) HÅNDTERING NÅR TABEL MANGLER: Hvis næringstabellen ikke er synlig/læselig, SKAL du: (1) skrive eksakt sætningen 'Jeg kan ikke læse næringsindholdet på billedet' i detectiveReasoning efter citat-blokken, (2) sætte calories, protein, carbs, fat, sugar, salt til 0, (3) sætte confidence ≤ 0.25, (4) opfordre brugeren på dansk til at tage et nyt billede af bagsiden med næringstabellen synlig. Undtagelse: KUN hvis brugeren eksplicit har skrevet portion/vægt i tekst-hint og produktet er en ren råvare uden emballage (fx et æble på et bord), må du bruge USDA-standardværdier — og du skal så skrive 'Råvare uden emballage — bruger USDA-standardværdier' i noten. " +
              "  (d) DELVIS LÆSBAR TABEL: Hvis kun nogle værdier er læselige (fx kun kcal og protein), rapportér KUN de læselige og sæt de manglende til 0 med note om hvad der mangler. Aldrig gæt det manglende. " +
              "STEP 9 — PORTION-TABEL & MATEMATISK PRÆCISION (OBLIGATORISK): " +
              "  (a) VÆGT-ESTIMAT: For enhver tallerken/portion SKAL du give et kvalificeret visuelt estimat af portionsvægten i gram (estimatedPortionGrams). Vis dit ræsonnement kort i noten (fx 'Estimeret 250g baseret på tallerken-størrelse'). " +
              "  (b) OBLIGATORISK PORTIONS-TABEL i detectiveReasoning: Efter etiket-citatet og ekspert-noten SKAL du ALTID indsætte en markdown-tabel med præcis denne struktur (udskift [X] og [Total] med rigtige tal, og [X]g i header med det faktiske estimerede portionsvægt): \n\n| Nutrient | Per 100g | Your Portion (Est. [X]g) |\n|---|---|---|\n| Calories | [X] kcal | [Total] kcal |\n| Protein | [X]g | [Total]g |\n| Carbs | [X]g | [Total]g |\n| Fat | [X]g | [Total]g |\n\n" +
              "  (c) BEREGNING: 'Your Portion'-kolonnen SKAL beregnes som (værdi pr. 100g) × (estimeret vægt / 100). Ingen afrunding der ændrer meningen — max 1 decimal for makroer, heltal for kcal. " +
              "  (d) MATEMATISK SIKKERHED: Protein + Carbs + Fat pr. 100g må ALDRIG overstige 100g. Hvis dine tal bryder dette, afvis scanningen: skriv 'Matematisk umuligt — indtast manuelt' i detectiveReasoning, sæt confidence ≤ 0.2 og alle makroer til 0. " +
              "  (e) LABEL UNREADABLE FALLBACK: Hvis etiketten ikke kan læses OG produktet ikke er en synlig råvare, skriv 'Label unreadable, please enter manually' i detectiveReasoning (i tillæg til STEP 8c-håndteringen). " +
              "  (f) EXPERT NOTE: Efter tabellen tilføj kort note om tørvægt vs spisefærdig vægt og eventuelle tilsætningsstoffer/forarbejdning (fx 'Tørvægt — 100g ris bliver ~300g kogt' eller 'Indeholder emulgatorer og aroma'). " +
              "ALWAYS call report_nutrition — også når tabellen mangler (så bruger 0-værdier + lav confidence + klar besked i detectiveReasoning som beskrevet i STEP 8c).",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this food. ${images.length > 1 ? `You are given ${images.length} photos of THE SAME meal from different angles — use ALL of them together to better identify items and estimate portion size. Do NOT count items twice.` : ""} ${portionHint}${extraHint} ${homemadeBlock}Identify each component separately, estimate grams, then compute total calories + macros + micros + healthScore (1-10). Be realistic and decisive. NO health advice — only data.`,
              },
              ...images.map((url) => ({ type: "image_url", image_url: { url } })),
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "report_nutrition",
              description: "Report estimated nutrition facts for the identified food.",
              parameters: {
                type: "object",
                properties: {
                  name: { type: "string", description: "Short descriptive name including main components" },
                  items: {
                    type: "array",
                    description: "List of individual food items identified",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string", description: "Name of the food item" },
                        calories: { type: "number", description: "kcal for this item" },
                      },
                      required: ["name", "calories"],
                      additionalProperties: false,
                    },
                  },
                  totalGrams: { type: "number", description: "MANDATORY. Estimated total weight of the portion shown in grams (food + sauce, excluding plate). This is the ground truth used to scale all per-100g values. Use visual cues (plate ~26cm, fork ~20cm, bowl ~300-400ml, glass ~250ml). For drinks, use ml as grams." },
                  per100g: {
                    type: "object",
                    description: "MANDATORY. Nutrition values normalized to exactly 100 grams of the identified food, using accurate USDA / European / Nordic database values. Do NOT scale these to the portion — they MUST be per 100g.",
                    properties: {
                      calories: { type: "number", description: "kcal per 100g" },
                      protein: { type: "number", description: "grams of protein per 100g" },
                      carbs: { type: "number", description: "grams of carbs per 100g" },
                      fat: { type: "number", description: "grams of fat per 100g" },
                      fiber: { type: "number", description: "grams of fiber per 100g" },
                      sugar: { type: "number", description: "grams of sugar per 100g" },
                      sodium: { type: "number", description: "mg of sodium per 100g" },
                      saturatedFat: { type: "number", description: "grams of saturated fat per 100g" },
                      cholesterol: { type: "number", description: "mg of cholesterol per 100g" },
                    },
                    required: ["calories", "protein", "carbs", "fat", "fiber", "sugar", "sodium", "saturatedFat", "cholesterol"],
                    additionalProperties: false,
                  },
                  calories: { type: "number", description: "Total kcal for the portion = round(per100g.calories / 100 * totalGrams)" },
                  protein: { type: "number", description: "Total grams of protein for the portion = round(per100g.protein / 100 * totalGrams)" },
                  carbs: { type: "number", description: "Total grams of carbohydrates for the portion = round(per100g.carbs / 100 * totalGrams)" },
                  fat: { type: "number", description: "Total grams of fat for the portion = round(per100g.fat / 100 * totalGrams)" },
                  fiber: { type: "number", description: "Total grams of dietary fiber for the portion" },
                  sugar: { type: "number", description: "Total grams of sugar for the portion" },
                  sodium: { type: "number", description: "Total milligrams of sodium for the portion" },
                  saturatedFat: { type: "number", description: "Total grams of saturated fat for the portion" },
                  cholesterol: { type: "number", description: "Total milligrams of cholesterol for the portion" },
                  healthScore: { type: "number", description: "1-10 health rating" },
                  confidence: { type: "number", description: "0-1 confidence in the estimate" },
                  satietyHours: { type: "number", description: "Estimated hours user stays full (0.5-5)" },
                  energyEffect: { type: "string", description: "Short Danish sentence about real-life energy effect, e.g. 'Stabil energi i 3 timer' or 'Lav energi efter 1 time'" },
                  vitaminA: { type: "number", description: "Vitamin A in micrograms (µg RAE)" },
                  vitaminC: { type: "number", description: "Vitamin C in milligrams (mg)" },
                  vitaminD: { type: "number", description: "Vitamin D in micrograms (µg)" },
                  vitaminE: { type: "number", description: "Vitamin E in milligrams (mg)" },
                  vitaminB12: { type: "number", description: "Vitamin B12 in micrograms (µg)" },
                  calcium: { type: "number", description: "Calcium in milligrams (mg)" },
                  iron: { type: "number", description: "Iron in milligrams (mg)" },
                  magnesium: { type: "number", description: "Magnesium in milligrams (mg)" },
                  potassium: { type: "number", description: "Potassium in milligrams (mg)" },
                  zinc: { type: "number", description: "Zinc in milligrams (mg)" },
                  novaGroup: { type: "number", description: "NOVA processing group 1-4. 1=unprocessed, 2=culinary ingredient, 3=processed, 4=ultra-processed. Objective classification only, no judgement." },
                  ultraProcessedPercent: { type: "number", description: "Estimated percentage (0-100) of the portion that is ultra-processed by weight. 0 for whole foods." },
                  hiddenOilKcal: { type: "number", description: "Hidden cooking oil/butter calories for the visible portion. MUST be 0 when addOil toggle is OFF. When ON, estimate scaled to portion size. NEVER folded into `calories` or `per100g`." },
                  hiddenDressingKcal: { type: "number", description: "Hidden dressing/sauce/mayo calories for the visible portion. MUST be 0 when addDressing toggle is OFF. When ON, estimate scaled to portion size. NEVER folded into `calories` or `per100g`." },
                  hiddenSourcesEstimateKcal: { type: "number", description: "ADVISORY detective estimate of TOTAL hidden-calorie sources (oil + dressing + sauce + butter + mayo) visible in the photo. Independent of toggles. Always non-zero if ANY visual cue exists. Never folded into `calories`." },
                  caloriesMin: { type: "number", description: "Lower bound of realistic kcal range for the portion (caloriesMin ≤ calories)." },
                  caloriesMax: { type: "number", description: "Upper bound of realistic kcal range for the portion (calories ≤ caloriesMax)." },
                  detectiveReasoning: { type: "string", description: "Short Danish sentence explaining the hidden-source estimate and visual evidence." },
                },
                required: ["name", "items", "totalGrams", "per100g", "calories", "protein", "carbs", "fat", "fiber", "sugar", "sodium", "saturatedFat", "cholesterol", "healthScore", "confidence", "satietyHours", "energyEffect", "vitaminA", "vitaminC", "vitaminD", "vitaminE", "vitaminB12", "calcium", "iron", "magnesium", "potassium", "zinc", "novaGroup", "ultraProcessedPercent", "hiddenOilKcal", "hiddenDressingKcal", "hiddenSourcesEstimateKcal", "caloriesMin", "caloriesMax", "detectiveReasoning"],

                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "report_nutrition" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit reached. Try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add funds to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      return new Response(JSON.stringify({ error: "AI did not return structured nutrition" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = enforceMacroSanity(
      enforceHiddenToggles(JSON.parse(toolCall.function.arguments), addOil, addDressing),
    );

    // ---- Increment counters after successful scan ----
    const newDaily = dailyUsed + 1;
    await adminClient
      .from("profiles")
      .update({
        scan_count: scanCount + 1,
        daily_scan_count: newDaily,
        last_scan_date: today,
        last_scan_at: new Date().toISOString(),
      })
      .eq("id", userId);

    return new Response(
      JSON.stringify({
        ...parsed,
        scans_used: scanCount + 1,
        daily_used: newDaily,
        daily_limit: DAILY_SCAN_LIMIT,
        is_premium: isPremium,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("scan-food error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

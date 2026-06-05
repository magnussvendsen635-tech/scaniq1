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
// Admin user IDs — bypass all quota and cooldown limits.
const ADMIN_USER_IDS = new Set<string>([
  "7d5a801c-8bac-4eb9-bcd3-3bd8c20b28f0",
]);

const HIDDEN_FAT_ITEM_PATTERN = /hidden|skjult|oil|olie|dressing|butter|smør|fat|fedt/i;
const RAW_NOVA1_ITEM_PATTERN = /cucumber|agurk|banana|banan|apple|æble|orange|appelsin|berry|berries|bær|grape|druer|tomato|tomat|carrot|gulerod|pepper|peberfrugt|lettuce|salat|cabbage|kål|celery|selleri|radish|radise|spinach|spinat|broccoli|cauliflower|blomkål|courgette|zucchini/i;

function forceZeroHiddenFatForRawNova1(parsed: Record<string, unknown>) {
  const items = Array.isArray(parsed.items) ? parsed.items as Array<Record<string, unknown>> : [];
  const foodText = `${String(parsed.name ?? "")} ${items.map((item) => String(item?.name ?? "")).join(" ")}`;
  const isRawNova1WholeFood = parsed.novaGroup === 1 || RAW_NOVA1_ITEM_PATTERN.test(foodText);

  if (!isRawNova1WholeFood) return parsed;

  let hiddenCalories = 0;
  parsed.items = items.map((item) => {
    if (!HIDDEN_FAT_ITEM_PATTERN.test(String(item?.name ?? ""))) return item;
    hiddenCalories += typeof item.calories === "number" ? item.calories : Number(item.calories) || 0;
    return { ...item, calories: 0 };
  });

  if (hiddenCalories > 0 && typeof parsed.calories === "number") {
    parsed.calories = Math.max(0, Math.round(parsed.calories - hiddenCalories));
    const oilFatGrams = hiddenCalories / 9;
    if (typeof parsed.fat === "number") parsed.fat = Math.max(0, Math.round(parsed.fat - oilFatGrams));
    if (typeof parsed.saturatedFat === "number") parsed.saturatedFat = Math.max(0, Math.round(parsed.saturatedFat - oilFatGrams * 0.15));
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
    const isAdmin = ADMIN_USER_IDS.has(userId);
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
    const { portion, strategy, source } = body;
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

    const sourceLabel: "homemade" | "store" | "restaurant" =
      source === "store" || source === "restaurant" ? source : "homemade";
    const sourceHint = {
      homemade:
        "FOOD SOURCE = HOMEMADE. Assume the meal is cooked from scratch with fresh ingredients. Homemade meals (pizza, burgers, pasta, soup, bread) MUST NEVER be classified as NOVA 4. They land in NOVA 1, 2 or 3 depending on whether oils/salts/butter are involved — never ultra-processed.",
      store:
        "FOOD SOURCE = STORE-BOUGHT (supermarket product). Evaluate as a typical mass-produced supermarket product. If you can see industrial packaging, branded wrappers, or it's a known packaged product, classify as NOVA 3 or NOVA 4 based on visible additives, preservatives or industrial formulation cues.",
      restaurant:
        "FOOD SOURCE = RESTAURANT / TAKEOUT. Evaluate as restaurant or takeout food. Restaurant meals typically include added fats, oils and culinary preparation — minimum NOVA 3. Use NOVA 4 only for clearly industrial fast-food items (e.g. fast-food chain burger menus, deep-fried packaged items).",
    }[sourceLabel];

    const useFallback = strategy === "fallback";
    const model = useFallback ? "google/gemini-2.5-pro" : "google/gemini-2.5-flash";
    const extraHint = useFallback
      ? " RETRY MODE: previous attempt failed or was low-confidence. Look EXTRA carefully — read any text/labels/brands on packaging (OCR), zoom mentally on the product, and make your best guess even if partial. NEVER refuse."
      : "";


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
              "MEAL TYPE RULE — The selected Meal Type (Breakfast, Lunch, Dinner, Snack) is ONLY used for UI categorization in the user's diary. It MUST have 0% influence on the portion size, calorie, or macro estimation. Estimate calories and portion size SOLELY based on the visual volume of the food in the photo (e.g. the size of the burger, the plate, or the salad bowl) and the selected Food Source (Homemade, Store-bought, Restaurant), completely ignoring whether it is logged as a snack or dinner. A small snack-sized plate of pasta and a dinner-sized plate of pasta must be judged purely by what the camera sees. " +
              "STRICTLY FORBIDDEN — never give dietary, health, medical or lifestyle advice. NEVER tell the user what they should or shouldn't eat. NEVER use words like 'avoid', 'stay away', 'bad', 'unhealthy', 'dangerous', 'toxic', 'junk', 'guilty', 'cheat', 'too much', 'cut down', 'eat instead'. NEVER suggest alternatives or improvements. NEVER warn about health effects. Output must be purely analytical: ingredients, calories, macros, micros, and the NOVA processing category — nothing more. This is required to comply with Apple App Store Medical Guidelines. " +
              "TONE — strictly neutral, factual, supportive. Describe what the food IS, never what it does to the user's health. " +
              "INGREDIENT HONESTY — Only list ingredients you can actually SEE. Never assume oil, flour, butter, sugar, additives or preservatives unless clearly visible (oily surface, labelled package, visible breading). If unsure, say 'possible ingredients detected' and lower your confidence. A whole apple has ONE ingredient: apple. " +
              "PROCESSING LEVEL (NOVA) — Be fair and source-aware. " +
              "  • NOVA 1 (unprocessed / minimally processed): single natural foods — apple, banana, egg, plain rice, plain chicken breast, broccoli, fish, raw vegetables, fresh fruit. Almost ALWAYS NOVA 1. " +
              "  • NOVA 2 (processed culinary ingredients): items used in cooking — oil, butter, salt, sugar, flour, vinegar, herbs. Or whole foods combined with them (boiled potatoes with butter, salad with olive oil, plain yoghurt with honey). " +
              "  • NOVA 3 (processed foods): combinations of NOVA 1 + NOVA 2 made in a kitchen — homemade pizza, homemade pasta, homemade bread, sandwiches, cheese, cured meats, canned beans, a steak fried in butter with salt. " +
              "  • NOVA 4 (ultra-processed): ONLY clearly industrial formulations with additives, flavour enhancers, emulsifiers, preservatives — soda, chips, candy, instant noodles, ready meals, packaged sweets/pastries, energy drinks, fast-food chain products, factory-made sausages, breakfast cereals like Frosties/Cornflakes. " +
              "  Default DOWN if unsure. A photo of fruit must never be NOVA 4. " +
              `  SOURCE-AWARE RULES (the user told us the food source — RESPECT IT): ${sourceHint} ` +
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
              "  (f) HIDDEN OILS & FATS RULE (CRITICAL — most cooked food contains oil/butter the user can't see): " +
              "      • ALWAYS add hidden cooking fat for: fried foods, pan-cooked dishes, stir-fries, sautéed vegetables, roasted vegetables, hot home-cooked dinners, restaurant/takeout/fast food (burgers, fries, pizza, kebab, shawarma, pasta dishes, risotto, curries, wok dishes, omelettes, scrambled eggs, pancakes, grilled meat with marinade, sauces, dressings on salads). Typical hidden fat: 5-15g oil/butter per portion (≈ 45-135 kcal). Fast food / fried food can hide 20-40g fat. Reflect this in fat, saturatedFat and total calories — do NOT report a suspiciously low number for an obviously cooked/fast-food dish. " +
              "      • NEVER add hidden oil/fat to: raw whole fruit (banana, apple, berries, grapes, orange), raw whole vegetables (cucumber, tomato, carrot, bell pepper), plain salad leaves with NO visible dressing, boiled/steamed plain vegetables, plain boiled eggs, plain boiled potatoes/rice/pasta with nothing on them, raw nuts, plain yoghurt/skyr/milk, plain bread, packaged products (use the label). For these single-ingredient whole/raw foods, use the pure USDA per100g values as-is. " +
              "      • When in doubt for a HOT cooked dish or restaurant meal → assume oil/butter WAS used. When in doubt for a raw/whole single-ingredient food → assume NO added fat. " +
              "PACKAGED PRODUCT RULE (CRITICAL): If the photo shows a packaged product (bottle, can, box, bag, wrapper) — soda bottle, Pringles can, candy bar, bread bag, chocolate, chips, energy drink etc. — the user is logging the WHOLE package, not a tiny taste. ALWAYS use the FULL net weight / volume printed on (or typical for) that package as totalGrams. Examples: 0.5L Coca-Cola bottle = 500g, standard Pringles can = 165g, Snickers bar = 50g, 1.5L soda = 1500g, 330ml can = 330g, 200g chocolate bar = 200g, package of buns/rolls = full package weight. Never default to 50g or 100g for a clearly whole packaged product. Read the label (OCR) when visible; otherwise use the standard retail size for that exact product. " +
              "STEP 3 — NUTRITION: ALWAYS produce values per 100g (`per100g`) using accurate USDA/European/Nordic database values for the identified food. Then compute the totals for the portion using the formula: total = round(per100g_value / 100 * totalGrams). Calories, protein, carbs, fat, fiber, sugar, sodium, saturatedFat and cholesterol totals MUST match this formula exactly. Never invent a portion calorie number that contradicts per100g * grams. " +
              "STEP 4 — HEALTH SCORE 1-10: a NEUTRAL nutrient-density score, NOT a verdict. 10 = nutrient-dense whole foods, 1 = nutrient-poor. Do not interpret it for the user. " +
              "STEP 5 — REAL-LIFE EFFECT: estimate satiety_hours and a one-sentence neutral energy_effect in Danish describing energy/satiety pattern only (e.g. 'Stabil energi i 3 timer', 'Hurtigt energiboost der falder igen efter ca. 1 time'). NEVER advice, NEVER judgement. " +
              "STEP 6 — VITAMINS & MINERALS: realistic per-portion values from USDA/Nordic data. 0 if truly absent. " +
              "ALWAYS call report_nutrition with your best estimate — lower confidence instead of refusing.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this food. ${images.length > 1 ? `You are given ${images.length} photos of THE SAME meal from different angles — use ALL of them together to better identify items and estimate portion size. Do NOT count items twice.` : ""} ${portionHint} ${sourceHint}${extraHint} Identify each component separately, estimate grams, then compute total calories + macros + micros + healthScore (1-10). Be realistic and decisive. NO health advice — only data.`,
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
                },
                required: ["name", "items", "totalGrams", "per100g", "calories", "protein", "carbs", "fat", "fiber", "sugar", "sodium", "saturatedFat", "cholesterol", "healthScore", "confidence", "satietyHours", "energyEffect", "vitaminA", "vitaminC", "vitaminD", "vitaminE", "vitaminB12", "calcium", "iron", "magnesium", "potassium", "zinc", "novaGroup", "ultraProcessedPercent"],

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

    const parsed = JSON.parse(toolCall.function.arguments);

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

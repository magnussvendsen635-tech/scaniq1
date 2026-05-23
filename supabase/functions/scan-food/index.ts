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
    const lastDate = profile?.last_scan_date ?? null;
    // Reset daily counter if it's a new day
    const dailyUsed = lastDate === today ? (profile?.daily_scan_count ?? 0) : 0;

    // Premium required to scan at all
    if (!isPremium) {
      return new Response(
        JSON.stringify({
          error: "premium_required",
          message: "Scanning is a Premium feature. Upgrade to start scanning.",
          is_premium: false,
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Rate limit: enforce cooldown between scans (anti-bot)
    if (profile?.last_scan_at) {
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

    if (dailyUsed >= DAILY_SCAN_LIMIT) {
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
    // Accept either `images: string[]` (preferred, multi-angle) or legacy `image: string`
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
    // Cap to 3 images max to control payload size
    images = images.slice(0, 3);

    const portionLabel: "small" | "medium" | "large" =
      portion === "small" || portion === "large" ? portion : "medium";
    const portionHint = {
      small: "The user indicates this is a SMALL portion (~60-70% of a typical serving). Scale calories and macros accordingly.",
      medium: "The user indicates this is a MEDIUM/typical portion size.",
      large: "The user indicates this is a LARGE portion (~140-160% of a typical serving). Scale calories and macros accordingly.",
    }[portionLabel];

    // Retry strategy: "fallback" uses the stronger Pro model + OCR-focused prompt
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
        messages: [
          {
            role: "system",
            content:
              "You are an expert nutritionist with world-class visual food recognition. You analyze ANY food: homemade meals, restaurant dishes, packaged snacks, drinks, bakery, fruit, raw ingredients — Danish, Nordic, European, US, Asian, Middle Eastern. Never refuse. " +
              "TONE — ALWAYS supportive, neutral and non-judgmental. Talk like Lifesum / MyFitnessPal / Yazio. NEVER use fear-based wording such as 'avoid', 'stay away', 'bad food', 'unhealthy', 'dangerous', 'toxic'. Prefer balanced phrasing like 'a great whole-food choice', 'reasonably balanced meal', 'more processed than whole foods, but completely fine in moderation', 'contains some processed ingredients'. " +
              "INGREDIENT HONESTY — Only list ingredients you can actually SEE in the image. Do NOT assume oil, flour, butter, sugar, additives or preservatives unless they are clearly visible (e.g. a glistening oily surface, a labelled package, visible breading). If unsure, say 'possible ingredients detected' and lower your confidence instead of inventing things. A whole apple has ONE ingredient: apple. A boiled egg has ONE ingredient: egg. " +
              "PROCESSING LEVEL (NOVA) — Be FAIR and realistic. " +
              "  • NOVA 1 (whole / unprocessed): single natural foods — apple, banana, egg, plain rice, plain chicken breast, broccoli, fish, raw vegetables, fresh fruit. These are almost ALWAYS NOVA 1. " +
              "  • NOVA 2 (culinary ingredients): whole foods + simple kitchen ingredients (oil, butter, salt, sugar, flour, herbs). E.g. boiled potatoes with butter, salad with olive oil, plain yoghurt with honey. " +
              "  • NOVA 3 (processed): homemade or simply-processed dishes combining several real ingredients — homemade pizza, homemade pasta, sandwiches, wraps, bread, cheese, cured meats, canned beans. Homemade meals are NOT automatically ultra-processed. " +
              "  • NOVA 4 (ultra-processed): ONLY for clearly industrial formulations — soda, chips, candy, instant noodles, ready meals, packaged sweets/pastries, energy drinks, fast-food chain products, hot dogs from factory pølser, cereal like Frosties/Cornflakes. " +
              "  Default to the LOWER NOVA category if you are unsure. A photo of fruit must never be NOVA 4. " +
              "STEP 1 — IDENTIFY (be EXTREMELY careful, do NOT confuse similar foods): " +
              "  • SOUP vs YOGHURT vs SKYR vs PORRIDGE — critical distinction:" +
              "    - SOUP (suppe): liquid surface, often steaming, served in bowl, broth visible, may contain vegetables/meat/noodles. USE ~50-80 kcal/100g." +
              "    - SKYR: thick Icelandic dairy, very white, matte/grainy surface, often with berries/granola on top. USE ~60-70 kcal/100g (high protein 10-12g)." +
              "    - YOGHURT: smoother shinier surface than skyr, white/cream colored, may have fruit. USE ~60-100 kcal/100g (lower protein 4-6g)." +
              "    - PORRIDGE (havregrød/risengrød): visible grains/oats, thick, off-white/beige. USE ~80-110 kcal/100g." +
              "  • Plate of food → name each component honestly (only what you actually see). " +
              "  • Packaged product → read brand + product name from label (OCR). " +
              "STEP 2 — WEIGH: Estimate grams (or ml for liquids) from visual cues automatically (plate ~26cm, fork ~20cm, bowl ~300-400ml, glass ~250ml). The user did NOT provide a portion size — you must estimate it yourself from the image. Ignore any hint from the client. " +
              "STEP 3 — NUTRITION: Use accurate USDA/European/Nordic database values per 100g. Realistic ranges: dinner plate 400-900 kcal, soup bowl 150-350 kcal, skyr 150g ~100 kcal, yoghurt 150g ~120 kcal, candy bag 100g ~350 kcal, soda 330ml ~140 kcal. " +
              "STEP 4 — HEALTH SCORE 1-10: 10=whole foods/vegetables/lean protein. 8-9=skyr, soup with vegetables, oatmeal, homemade balanced meals. 7=yoghurt with fruit, homemade pizza with veg. 4-6=mixed (pasta+sauce, burger). 2-3=candy, chips, soda, pastries. 1=pure sugar/deep-fried. " +
              "STEP 5 — REAL-LIFE EFFECT: Estimate satiety_hours (high protein/fiber/fat = 3-5h, sugar/refined carbs = 0.5-1.5h) and energy_effect — one short, neutral, supportive Danish sentence like 'Stabil energi i 3 timer' or 'Giver et hurtigt energiboost, men mætheden falder hurtigt' (NEVER scary or scolding). " +
              "STEP 6 — VITAMINS & MINERALS: Estimate realistic values per portion using USDA/Nordic data. Use 0 if truly absent. " +
              "ALWAYS call report_nutrition with your best estimate even if uncertain — lower the confidence value instead of refusing.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this food. ${images.length > 1 ? `You are given ${images.length} photos of THE SAME meal from different angles — use ALL of them together to better identify items and estimate portion size (depth, volume, plate coverage). Do NOT count items twice.` : ""} ${portionHint}${extraHint} Identify each component separately, estimate grams, then compute total calories + macros + micros + healthScore (1-10). Be realistic and decisive.`,
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
                  calories: { type: "number", description: "Total kcal for the portion shown" },
                  protein: { type: "number", description: "Total grams of protein" },
                  carbs: { type: "number", description: "Total grams of carbohydrates" },
                  fat: { type: "number", description: "Total grams of fat" },
                  fiber: { type: "number", description: "Total grams of dietary fiber" },
                  sugar: { type: "number", description: "Total grams of sugar" },
                  sodium: { type: "number", description: "Total milligrams of sodium" },
                  saturatedFat: { type: "number", description: "Total grams of saturated fat" },
                  cholesterol: { type: "number", description: "Total milligrams of cholesterol" },
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
                },
                required: ["name", "items", "calories", "protein", "carbs", "fat", "fiber", "sugar", "sodium", "saturatedFat", "cholesterol", "healthScore", "confidence", "satietyHours", "energyEffect", "vitaminA", "vitaminC", "vitaminD", "vitaminE", "vitaminB12", "calcium", "iron", "magnesium", "potassium", "zinc"],
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

// Edge function: manual food search — returns nutrition for a free-text query
// Same auth + premium + cooldown + daily-limit rules as scan-food.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DAILY_SCAN_LIMIT = 30;
const SCAN_COOLDOWN_SECONDS = 10;

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    // Block check (IP + user_id + device fingerprint)
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

    const { data: profile, error: profErr } = await adminClient
      .from("profiles")
      .select("scan_count, is_premium, daily_scan_count, last_scan_date, last_scan_at")
      .eq("id", userId)
      .maybeSingle();

    if (profErr) {
      return new Response(JSON.stringify({ error: "Profile lookup failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const today = todayUTC();
    const scanCount = profile?.scan_count ?? 0;
    const isPremium = profile?.is_premium ?? false;
    const lastDate = profile?.last_scan_date ?? null;
    const dailyUsed = lastDate === today ? (profile?.daily_scan_count ?? 0) : 0;

    if (!isPremium) {
      return new Response(
        JSON.stringify({
          error: "premium_required",
          message: "Search is a Premium feature. Upgrade to start.",
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (profile?.last_scan_at) {
      const elapsedSec = (Date.now() - new Date(profile.last_scan_at).getTime()) / 1000;
      if (elapsedSec < SCAN_COOLDOWN_SECONDS) {
        const retryAfter = Math.ceil(SCAN_COOLDOWN_SECONDS - elapsedSec);
        return new Response(
          JSON.stringify({
            error: "rate_limited",
            message: `Please wait ${retryAfter}s before searching again.`,
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
          message: `Daily limit reached (${DAILY_SCAN_LIMIT}/day). Try again tomorrow.`,
          daily_used: dailyUsed,
          daily_limit: DAILY_SCAN_LIMIT,
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { query } = await req.json();
    if (!query || typeof query !== "string" || query.trim().length < 2 || query.length > 200) {
      return new Response(JSON.stringify({ error: "Query must be 2-200 characters" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "You are a nutrition database expert with knowledge of USDA, European, and Nordic food data. " +
              "The user describes a food in free text (Danish, English, or any language) — possibly with a quantity (e.g. 'medium apple', '1 ispind', '200g pasta carbonara', 'glas appelsinjuice', 'Haribo Mix 100g'). " +
              "Parse: identify the food + parse the portion size into a precise total weight in grams (default to a typical/medium serving if not specified; for drinks treat ml as grams). " +
              "ALWAYS return BOTH per-100g values (per100g) AND the totalGrams of the requested portion. The per-100g values MUST come from accurate USDA/European/Nordic database data for the identified food. " +
              "The portion totals (calories, protein, carbs, fat, fiber, sugar, sodium, saturatedFat, cholesterol) MUST be computed as: total = round(per100g_value / 100 * totalGrams). Never invent portion totals that contradict this formula. " +
              "Also estimate vitamins (A µg RAE, C mg, D µg, E mg, B12 µg) and minerals (calcium mg, iron mg, magnesium mg, potassium mg, zinc mg) for the portion. Use 0 if truly absent. " +
              "Health score 1-10: 10=whole foods/vegetables/lean protein, 7-8=mostly healthy, 4-6=mixed, 2-3=candy/chips/soda/pastries, 1=pure sugar/deep-fried. " +
              "Always call report_nutrition. Set confidence based on how specific the query was (vague=0.5, specific with weight=0.95).",
          },
          {
            role: "user",
            content: `Look up nutrition for: "${query.trim()}"`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "report_nutrition",
              description: "Return nutrition facts for the described food and portion.",
              parameters: {
                type: "object",
                properties: {
                  name: { type: "string", description: "Cleaned-up name of the food incl. portion (e.g. 'Medium apple (~180g)')" },
                  items: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        calories: { type: "number" },
                      },
                      required: ["name", "calories"],
                      additionalProperties: false,
                    },
                  },
                  totalGrams: { type: "number", description: "Total weight of the requested portion in grams (for liquids treat ml as grams)." },
                  per100g: {
                    type: "object",
                    description: "Nutrition values per exactly 100g of the identified food (USDA/European/Nordic accurate).",
                    properties: {
                      calories: { type: "number" },
                      protein: { type: "number" },
                      carbs: { type: "number" },
                      fat: { type: "number" },
                      fiber: { type: "number" },
                      sugar: { type: "number" },
                      sodium: { type: "number" },
                      saturatedFat: { type: "number" },
                      cholesterol: { type: "number" },
                    },
                    required: ["calories", "protein", "carbs", "fat", "fiber", "sugar", "sodium", "saturatedFat", "cholesterol"],
                    additionalProperties: false,
                  },
                  calories: { type: "number" },
                  protein: { type: "number" },
                  carbs: { type: "number" },
                  fat: { type: "number" },
                  fiber: { type: "number" },
                  sugar: { type: "number" },
                  sodium: { type: "number" },
                  saturatedFat: { type: "number" },
                  cholesterol: { type: "number" },

                  healthScore: { type: "number" },
                  confidence: { type: "number" },
                  vitaminA: { type: "number", description: "Vitamin A in µg RAE" },
                  vitaminC: { type: "number", description: "Vitamin C in mg" },
                  vitaminD: { type: "number", description: "Vitamin D in µg" },
                  vitaminE: { type: "number", description: "Vitamin E in mg" },
                  vitaminB12: { type: "number", description: "Vitamin B12 in µg" },
                  calcium: { type: "number", description: "Calcium in mg" },
                  iron: { type: "number", description: "Iron in mg" },
                  magnesium: { type: "number", description: "Magnesium in mg" },
                  potassium: { type: "number", description: "Potassium in mg" },
                  zinc: { type: "number", description: "Zinc in mg" },
                },
                required: ["name", "items", "totalGrams", "per100g", "calories", "protein", "carbs", "fat", "fiber", "sugar", "sodium", "saturatedFat", "cholesterol", "healthScore", "confidence", "vitaminA", "vitaminC", "vitaminD", "vitaminE", "vitaminB12", "calcium", "iron", "magnesium", "potassium", "zinc"],
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
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
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
    console.error("food-search error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

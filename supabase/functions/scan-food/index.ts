// Edge function: analyze a food image with Lovable AI Gateway (Gemini)
// Enforces 1 free scan per user — premium users get unlimited.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FREE_SCAN_LIMIT = 2;

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

    // ---- Quota check ----
    const { data: profile, error: profErr } = await adminClient
      .from("profiles")
      .select("scan_count, is_premium")
      .eq("id", userId)
      .maybeSingle();

    if (profErr) {
      console.error("profile fetch error", profErr);
      return new Response(JSON.stringify({ error: "Profile lookup failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const scanCount = profile?.scan_count ?? 0;
    const isPremium = profile?.is_premium ?? false;

    if (!isPremium && scanCount >= FREE_SCAN_LIMIT) {
      return new Response(
        JSON.stringify({
          error: "scan_limit_reached",
          message: "Free scan used. Upgrade to premium for unlimited scans.",
          scan_count: scanCount,
          limit: FREE_SCAN_LIMIT,
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ---- Input ----
    const { image, portion, strategy } = await req.json();
    if (!image || typeof image !== "string") {
      return new Response(JSON.stringify({ error: "Missing image (data URL)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "You are an expert nutritionist with deep visual food recognition skills. You analyze ANY food: homemade meals (kartofler+sovs, lasagne, gryderet), restaurant dishes, packaged snacks (chips, slik, vingummi, chokolade), drinks (sodavand, juice, øl), bakery, fruit, raw ingredients — Danish, Nordic, European, US, Asian, Middle Eastern. Never refuse. " +
              "STEP 1 — IDENTIFY: Look carefully and list EVERY visible item separately. " +
              "  • Plate of food → name each component (e.g. 'kogte kartofler', 'brun sovs', 'frikadelle', 'agurkesalat'). " +
              "  • Packaged product → read brand + product name from label if visible (e.g. 'Haribo Mix', 'Matilde kakaomælk', 'Lays Paprika'). If only the bag/wrapper is visible, infer typical product. " +
              "  • Bowl/glass → identify content + estimate volume. " +
              "  • Candy/sweets bag → identify type (vingummi, lakrids, chokolade) and estimate weight of bag or visible portion. " +
              "STEP 2 — WEIGH: Estimate grams (or ml for drinks) per item using visual reference (plate ~26cm, fork ~20cm, hand, standard glass ~250ml, candy bag ~150-300g). Apply portion modifier (small=70%, medium=100%, large=150%). " +
              "STEP 3 — NUTRITION: Use accurate USDA/European/Nordic database values per 100g. Realistic ranges: dinner plate 400-900 kcal, candy bag 100g ~350 kcal, soda 330ml ~140 kcal, chips 30g ~160 kcal. Compute totals for actual estimated weight. " +
              "STEP 4 — HEALTH SCORE 1-10: " +
              "  10 = whole foods, vegetables, lean protein. 7-8 = mostly healthy with refined carbs. 4-6 = mixed (pasta+sauce, burger). 2-3 = candy, chips, soda, pastries, fast food. 1 = pure sugar/deep-fried. " +
              "  Penalize: sat fat >10g, added sugar >15g, sodium >800mg. Reward: fiber >5g, protein, vegetables. " +
              "ALWAYS call report_nutrition with your best estimate even if uncertain — lower the confidence value instead of refusing.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this food image. ${portionHint} Identify each component separately, estimate grams, then compute total calories + macros + micros + healthScore (1-10). Be realistic and decisive.`,
              },
              { type: "image_url", image_url: { url: image } },
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
                },
                required: ["name", "items", "calories", "protein", "carbs", "fat", "fiber", "sugar", "sodium", "saturatedFat", "cholesterol", "healthScore", "confidence"],
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

    // ---- Increment scan_count after successful scan ----
    if (!isPremium) {
      await adminClient
        .from("profiles")
        .update({ scan_count: scanCount + 1 })
        .eq("id", userId);
    }

    return new Response(
      JSON.stringify({
        ...parsed,
        scans_used: isPremium ? null : scanCount + 1,
        scan_limit: isPremium ? null : FREE_SCAN_LIMIT,
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

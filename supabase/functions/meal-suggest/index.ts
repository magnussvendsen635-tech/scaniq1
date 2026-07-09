import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // ---- Auth ----
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
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
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Daily AI quota (max 20/day/user)
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: quota } = await adminClient.rpc("check_and_increment_ai_quota", {
      _user_id: (claimsData.claims as any).sub, _endpoint: "meal-suggest", _limit: 20,
    });
    const q = Array.isArray(quota) ? quota[0] : quota;
    if (q && q.allowed === false) {
      return new Response(JSON.stringify({ error: "daily_limit_reached", message: "Daily AI limit reached (20/day). Try again tomorrow." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const remainingCal = Math.max(0, Math.min(10000, Number(body.remainingCal) || 0));
    const remainingProtein = Math.max(0, Math.min(1000, Number(body.remainingProtein) || 0));
    const remainingCarbs = Math.max(0, Math.min(1000, Number(body.remainingCarbs) || 0));
    const remainingFat = Math.max(0, Math.min(1000, Number(body.remainingFat) || 0));
    const diet = typeof body.diet === "string" ? body.diet.slice(0, 50) : "";
    const mealType = typeof body.mealType === "string" ? body.mealType.slice(0, 50) : "";

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) { console.error("LOVABLE_API_KEY missing"); return new Response(JSON.stringify({ error: "service_unavailable" }), { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }); }

    const dietHint = diet && diet !== "none" ? `Diet preference: ${diet}.` : "";
    const prompt = `Suggest 3 ${mealType || "meal"} ideas for someone who has roughly:
- ${remainingCal} kcal remaining today
- ${remainingProtein}g protein, ${remainingCarbs}g carbs, ${remainingFat}g fat remaining
${dietHint}

Each suggestion should fit comfortably within these remaining macros (use about 1/3 to 2/3 of the remaining calories per meal). Return realistic, simple meals that a normal person can prepare or buy. Keep names short.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You suggest realistic meal ideas with accurate nutrition estimates. Always reply with the suggest_meals tool." },
          { role: "user", content: prompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_meals",
              description: "Return 3 meal suggestions",
              parameters: {
                type: "object",
                properties: {
                  suggestions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        description: { type: "string", description: "1 short sentence describing the meal" },
                        calories: { type: "number" },
                        protein: { type: "number" },
                        carbs: { type: "number" },
                        fat: { type: "number" },
                        healthScore: { type: "number", description: "1-10" },
                      },
                      required: ["name", "description", "calories", "protein", "carbs", "fat", "healthScore"],
                    },
                  },
                },
                required: ["suggestions"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "suggest_meals" } },
      }),
    });

    if (response.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (response.status === 402) {
      return new Response(JSON.stringify({ error: "Out of credits" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return new Response(JSON.stringify({ error: "ai_error" }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");

    const args = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(args), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("meal-suggest error:", err);
    return new Response(JSON.stringify({ error: "internal_error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
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

    const body = await req.json();
    const meals = Array.isArray(body.meals) ? body.meals.slice(0, 50) : [];
    const target = Math.max(0, Math.min(20000, Number(body.target) || 0));
    const macros = body.macros ?? { targetP: 0, targetC: 0, targetF: 0, protein: 0, carbs: 0, fat: 0 };
    const micro = body.micro ?? { fiber: 0, sugar: 0, sodium: 0 };
    const language = typeof body.language === "string" ? body.language.slice(0, 10) : "en";

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const totalCals = meals.reduce((a: number, m: any) => a + (Number(m?.calories) || 0), 0);
    const list = meals
      .map((m: any) => `${String(m?.name ?? "").slice(0, 60)} (${Number(m?.calories) || 0}kcal, P${Number(m?.protein) || 0} C${Number(m?.carbs) || 0} F${Number(m?.fat) || 0})`)
      .join(", ") || "no meals yet";

    const lang = language === "da" ? "Danish" : "English";
    const sys = `You are a friendly nutrition coach. Reply in ${lang}. Max 2 short sentences. Be concrete: mention what the user is missing or did well today. Use 1 emoji max.`;
    const user = `Daily target: ${target} kcal, protein ${macros.targetP}g, carbs ${macros.targetC}g, fat ${macros.targetF}g.
So far today: ${totalCals} kcal, P${Math.round(Number(macros.protein) || 0)}g, C${Math.round(Number(macros.carbs) || 0)}g, F${Math.round(Number(macros.fat) || 0)}g.
Fiber ${(Number(micro.fiber) || 0).toFixed(1)}g, sugar ${(Number(micro.sugar) || 0).toFixed(1)}g, sodium ${Math.round(Number(micro.sodium) || 0)}mg.
Meals: ${list}.
Give one short, actionable insight.`;

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [{ role: "system", content: sys }, { role: "user", content: user }],
      }),
    });

    if (r.status === 429) return new Response(JSON.stringify({ error: "rate_limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (r.status === 402) return new Response(JSON.stringify({ error: "payment_required" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!r.ok) {
      const t = await r.text();
      console.error("AI error:", r.status, t);
      return new Response(JSON.stringify({ error: "ai_error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const data = await r.json();
    const summary = data.choices?.[0]?.message?.content?.trim() ?? "";
    return new Response(JSON.stringify({ summary }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("diary-summary error:", e);
    return new Response(JSON.stringify({ error: "internal_error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

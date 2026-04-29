const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { meals, target, macros, micro, language } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const totalCals = meals.reduce((a: number, m: any) => a + (m.calories || 0), 0);
    const list = meals.map((m: any) => `${m.name} (${m.calories}kcal, P${m.protein} C${m.carbs} F${m.fat})`).join(", ") || "no meals yet";

    const lang = language === "da" ? "Danish" : "English";
    const sys = `You are a friendly nutrition coach. Reply in ${lang}. Max 2 short sentences. Be concrete: mention what the user is missing or did well today. Use 1 emoji max.`;
    const user = `Daily target: ${target} kcal, protein ${macros.targetP}g, carbs ${macros.targetC}g, fat ${macros.targetF}g.
So far today: ${totalCals} kcal, P${Math.round(macros.protein)}g, C${Math.round(macros.carbs)}g, F${Math.round(macros.fat)}g.
Fiber ${micro.fiber.toFixed(1)}g, sugar ${micro.sugar.toFixed(1)}g, sodium ${Math.round(micro.sodium)}mg.
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
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

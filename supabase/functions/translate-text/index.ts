// Translates an array of English strings into a target language using Lovable AI.
// Public (no auth) — used for legal/static page localization.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const texts: string[] = Array.isArray(body.texts) ? body.texts.slice(0, 200) : [];
    const lang: string = typeof body.language === "string" ? body.language.slice(0, 16) : "en";

    if (!texts.length) {
      return new Response(JSON.stringify({ translations: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (lang.split("-")[0] === "en") {
      return new Response(JSON.stringify({ translations: texts }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const sys = `You are a professional translator. Translate every input string into the language with BCP-47 code "${lang}". Preserve meaning, tone, markdown, punctuation and placeholders like {foo}. Do NOT translate brand names: ScanIQ, Kinetex Intelligens, Apple, Google, App Store, Google Play, Premium. Return ONLY a JSON object: {"translations": [string, ...]} with the same length and order as the input. No commentary.`;
    const user = JSON.stringify({ texts });

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: sys },
          { role: "user", content: user },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (r.status === 429 || r.status === 402) {
      return new Response(JSON.stringify({ translations: texts, error: "rate_limited" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!r.ok) {
      const t = await r.text();
      throw new Error(`AI gateway ${r.status}: ${t.slice(0, 200)}`);
    }

    const data = await r.json();
    const content: string = data?.choices?.[0]?.message?.content ?? "{}";
    let out: string[] = texts;
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed?.translations) && parsed.translations.length === texts.length) {
        out = parsed.translations.map((x: any, i: number) => (typeof x === "string" && x.trim() ? x : texts[i]));
      }
    } catch { /* fall back to source */ }

    return new Response(JSON.stringify({ translations: out }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface Product {
  name: string;
  brand?: string;
  imageUrl?: string;
  barcode: string;
  servingSize: number;
  servingLabel: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  saturatedFat?: number;
  healthScore: number;
}

const OFF_HOSTS = [
  "https://world.openfoodfacts.org",
  "https://dk.openfoodfacts.org",
  "https://us.openfoodfacts.org",
  "https://uk.openfoodfacts.org",
  "https://fr.openfoodfacts.org",
  "https://de.openfoodfacts.org",
  "https://es.openfoodfacts.org",
  "https://it.openfoodfacts.org",
  "https://nl.openfoodfacts.org",
  "https://se.openfoodfacts.org",
  "https://no.openfoodfacts.org",
  "https://ca.openfoodfacts.org",
  "https://au.openfoodfacts.org",
];

const OFF_FIELDS = [
  "product_name",
  "product_name_en",
  "product_name_fr",
  "product_name_de",
  "product_name_es",
  "product_name_it",
  "product_name_da",
  "product_name_nl",
  "product_name_sv",
  "product_name_no",
  "product_name_nb",
  "product_name_pt",
  "product_name_ja",
  "generic_name",
  "generic_name_en",
  "generic_name_da",
  "brands",
  "image_front_small_url",
  "image_front_url",
  "image_url",
  "nutriments",
  "serving_quantity",
  "serving_size",
  "categories_tags",
].join(",");

function asNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value.replace(",", "."));
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function computeHealthScore(p: { sugar?: number; saturatedFat?: number; sodium?: number; fiber?: number; protein: number }) {
  let score = 7;
  if ((p.sugar ?? 0) > 15) score -= 2;
  else if ((p.sugar ?? 0) > 5) score -= 1;
  if ((p.saturatedFat ?? 0) > 5) score -= 1;
  if ((p.sodium ?? 0) > 600) score -= 1;
  if ((p.fiber ?? 0) >= 3) score += 1;
  if (p.protein >= 10) score += 1;
  return Math.max(1, Math.min(10, score));
}

function parseProduct(raw: any, fallbackBarcode: string): Product | null {
  const n = raw?.nutriments ?? {};
  const servingQuantity = asNumber(raw?.serving_quantity);
  const hasServing = asNumber(n["energy-kcal_serving"]) !== undefined && !!servingQuantity;
  const serving = hasServing ? servingQuantity! : 100;
  const suffix = hasServing ? "_serving" : "_100g";

  let calories = Math.round(asNumber(n[`energy-kcal${suffix}`]) ?? asNumber(n["energy-kcal_100g"]) ?? 0);
  if (!calories) {
    const kj = asNumber(n[`energy${suffix}`]) ?? asNumber(n["energy_100g"]);
    if (kj) calories = Math.round(kj / 4.184);
  }

  const protein = Math.round(asNumber(n[`proteins${suffix}`]) ?? asNumber(n["proteins_100g"]) ?? 0);
  const carbs = Math.round(asNumber(n[`carbohydrates${suffix}`]) ?? asNumber(n["carbohydrates_100g"]) ?? 0);
  const fat = Math.round(asNumber(n[`fat${suffix}`]) ?? asNumber(n["fat_100g"]) ?? 0);
  const fiberRaw = asNumber(n[`fiber${suffix}`]) ?? asNumber(n["fiber_100g"]);
  const sugarRaw = asNumber(n[`sugars${suffix}`]) ?? asNumber(n["sugars_100g"]);
  const saturatedRaw = asNumber(n[`saturated-fat${suffix}`]) ?? asNumber(n["saturated-fat_100g"]);
  const sodiumRaw = asNumber(n[`sodium${suffix}`]) ?? asNumber(n["sodium_100g"]);
  const fiber = fiberRaw !== undefined ? Math.round(fiberRaw * 10) / 10 : undefined;
  const sugar = sugarRaw !== undefined ? Math.round(sugarRaw * 10) / 10 : undefined;
  const saturatedFat = saturatedRaw !== undefined ? Math.round(saturatedRaw * 10) / 10 : undefined;
  const sodium = sodiumRaw !== undefined ? Math.round(sodiumRaw * 1000) : undefined;

  if (!calories && !protein && !carbs && !fat) return null;

  const name =
    raw.product_name_da ||
    raw.product_name ||
    raw.product_name_en ||
    raw.product_name_fr ||
    raw.product_name_de ||
    raw.product_name_es ||
    raw.product_name_it ||
    raw.product_name_nl ||
    raw.product_name_sv ||
    raw.product_name_no ||
    raw.product_name_nb ||
    raw.product_name_pt ||
    raw.product_name_ja ||
    raw.generic_name_da ||
    raw.generic_name ||
    raw.generic_name_en ||
    "Unknown product";

  return {
    name,
    brand: raw.brands,
    imageUrl: raw.image_front_small_url || raw.image_front_url || raw.image_url,
    barcode: raw.code || fallbackBarcode,
    servingSize: serving,
    servingLabel: hasServing ? `1 portion (${serving}g)` : "100g",
    calories,
    protein,
    carbs,
    fat,
    fiber,
    sugar,
    sodium,
    saturatedFat,
    healthScore: computeHealthScore({ sugar, saturatedFat, sodium, fiber, protein }),
  };
}

function barcodeVariants(barcode: string) {
  const variants = new Set([barcode]);
  if (barcode.length === 12) variants.add(`0${barcode}`);
  if (barcode.length === 13 && barcode.startsWith("0")) variants.add(barcode.slice(1));
  if (barcode.length === 14) variants.add(barcode.replace(/^0+/, ""));
  return [...variants].filter((v) => /^\d{8,14}$/.test(v));
}

async function fetchJson(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2800);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": "KcalApp/1.0 (food barcode lookup; https://lovable.app)",
      },
    });
    if (!res.ok) return null;
    return await res.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function lookupDirect(host: string, code: string, version: "v3" | "v2" | "v0") {
  const url =
    version === "v0"
      ? `${host}/api/v0/product/${encodeURIComponent(code)}.json`
      : `${host}/api/${version}/product/${encodeURIComponent(code)}.json?fields=${OFF_FIELDS}`;
  const data = await fetchJson(url);
  const product = data?.product;
  if (!product) return null;
  return parseProduct({ ...product, code: data.code || product.code || code }, code);
}

async function firstValid(promises: Promise<Product | null>[]) {
  try {
    return await Promise.any(promises.map((p) => p.then((value) => (value ? value : Promise.reject()))));
  } catch {
    return null;
  }
}

async function lookupOpenFoodFacts(barcode: string) {
  const variants = barcodeVariants(barcode);

  for (const version of ["v3", "v2"] as const) {
    const found = await firstValid(variants.map((code) => lookupDirect(OFF_HOSTS[0], code, version)));
    if (found) return found;
  }

  for (const version of ["v3", "v2"] as const) {
    const found = await firstValid(
      OFF_HOSTS.slice(1).flatMap((host) => variants.map((code) => lookupDirect(host, code, version))),
    );
    if (found) return found;
  }

  const legacy = await firstValid(OFF_HOSTS.map((host) => lookupDirect(host, barcode, "v0")));
  if (legacy) return legacy;

  for (const code of variants) {
    const data = await fetchJson(
      `https://world.openfoodfacts.org/cgi/search.pl?code=${encodeURIComponent(code)}&search_terms=${encodeURIComponent(code)}&search_simple=1&action=process&json=1&page_size=3&fields=${OFF_FIELDS}`,
    );
    for (const hit of data?.products ?? []) {
      const parsed = parseProduct({ ...hit, code: hit.code || code }, code);
      if (parsed) return parsed;
    }
  }

  return null;
}

// Fallback: ask Lovable AI to identify the product from the barcode using its training knowledge.
// Many candy, snack, drink and regional products are missing from Open Food Facts but well-known to LLMs.
async function lookupWithAI(barcode: string): Promise<Product | null> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) return null;

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          {
            role: "system",
            content:
              "You are a food product expert with deep knowledge of global packaged food, candy, chocolate, chips, soda, energy drinks, supplements, and regional products (Danish, Nordic, European, US, Asian). " +
              "Given a barcode (EAN/UPC), identify the product if you recognize it OR if you can infer it from the barcode prefix (country code) + common products. " +
              "Use realistic nutrition values per typical serving. Examples: Haribo Goldbears (100g) ~343 kcal, Coca-Cola 330ml ~139 kcal, Snickers bar 50g ~245 kcal. " +
              "If you have NO confident guess, set found=false. Otherwise call report_product with realistic values. Be generous — better to give a reasonable estimate of a likely product than refuse.",
          },
          {
            role: "user",
            content: `Identify the food product with barcode: ${barcode}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "report_product",
              description: "Report identified packaged food product with nutrition.",
              parameters: {
                type: "object",
                properties: {
                  found: { type: "boolean" },
                  name: { type: "string" },
                  brand: { type: "string" },
                  servingSize: { type: "number", description: "Grams in one typical serving" },
                  servingLabel: { type: "string", description: "e.g. '1 bar (50g)' or '1 can (330ml)'" },
                  calories: { type: "number" },
                  protein: { type: "number" },
                  carbs: { type: "number" },
                  fat: { type: "number" },
                  fiber: { type: "number" },
                  sugar: { type: "number" },
                  sodium: { type: "number", description: "milligrams" },
                  saturatedFat: { type: "number" },
                  healthScore: { type: "number", description: "1-10. Candy/soda 1-3, chips 2-4, granola bars 4-6, plain dairy 6-8, whole foods 8-10" },
                  confidence: { type: "number", description: "0-1" },
                },
                required: ["found", "name", "servingSize", "servingLabel", "calories", "protein", "carbs", "fat", "sugar", "saturatedFat", "sodium", "healthScore", "confidence"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "report_product" } },
      }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    const args = data?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) return null;
    const p = JSON.parse(args);
    if (!p.found || (p.confidence ?? 0) < 0.35) return null;

    return {
      name: p.name,
      brand: p.brand,
      barcode,
      servingSize: p.servingSize || 100,
      servingLabel: p.servingLabel || `1 portion (${p.servingSize || 100}g)`,
      calories: Math.round(p.calories),
      protein: Math.round(p.protein),
      carbs: Math.round(p.carbs),
      fat: Math.round(p.fat),
      fiber: p.fiber !== undefined ? Math.round(p.fiber * 10) / 10 : undefined,
      sugar: Math.round((p.sugar ?? 0) * 10) / 10,
      sodium: Math.round(p.sodium ?? 0),
      saturatedFat: Math.round((p.saturatedFat ?? 0) * 10) / 10,
      healthScore: Math.max(1, Math.min(10, Math.round(p.healthScore))),
    };
  } catch (e) {
    console.error("AI barcode lookup failed", e);
    return null;
  }
}

async function lookupBarcode(barcode: string) {
  const off = await lookupOpenFoodFacts(barcode);
  if (off) return off;
  return await lookupWithAI(barcode);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json().catch(() => null);
    const barcode = String(body?.barcode ?? "").trim();
    if (!/^\d{8,14}$/.test(barcode)) {
      return new Response(JSON.stringify({ error: "Invalid barcode" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const product = await lookupBarcode(barcode);
    return new Response(JSON.stringify({ product }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("lookup-barcode error", error);
    return new Response(JSON.stringify({ error: "Lookup failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
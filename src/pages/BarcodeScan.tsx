import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";
import { ArrowLeft, Barcode, Check, Loader2, Heart, Camera, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useKStore, caloriesToday } from "@/store/useKStore";

interface Product {
  name: string;
  brand?: string;
  imageUrl?: string;
  barcode: string;
  servingSize: number; // grams used for displayed values
  servingLabel: string; // e.g. "100g" or "1 portion (30g)"
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

type Step = "scan" | "loading" | "result" | "notfound";

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

// Try multiple Open Food Facts regional mirrors + Open Beauty/Pet/Products Facts
// for maximum global coverage (US, UK, EU, Asia, etc.)
const OFF_HOSTS = [
  "https://world.openfoodfacts.org",      // global food
  "https://us.openfoodfacts.org",         // US-specific mirror
  "https://world.openproductsfacts.org",  // general products
  "https://world.openbeautyfacts.org",    // cosmetics (some scanned items)
];

function parseProduct(p: any, barcode: string): Product | null {
  const n = p.nutriments ?? {};
  const hasServing = typeof n["energy-kcal_serving"] === "number" && p.serving_quantity;
  const serving = hasServing ? Number(p.serving_quantity) : 100;
  const suffix = hasServing ? "_serving" : "_100g";

  let calories = Math.round(Number(n[`energy-kcal${suffix}`] ?? n["energy-kcal_100g"] ?? 0));
  // Fallback: convert kJ → kcal if kcal missing
  if (!calories) {
    const kj = Number(n[`energy${suffix}`] ?? n["energy_100g"] ?? 0);
    if (kj) calories = Math.round(kj / 4.184);
  }
  const protein = Math.round(Number(n[`proteins${suffix}`] ?? n["proteins_100g"] ?? 0));
  const carbs = Math.round(Number(n[`carbohydrates${suffix}`] ?? n["carbohydrates_100g"] ?? 0));
  const fat = Math.round(Number(n[`fat${suffix}`] ?? n["fat_100g"] ?? 0));
  const fiber = n[`fiber${suffix}`] !== undefined ? Math.round(Number(n[`fiber${suffix}`]) * 10) / 10 : undefined;
  const sugar = n[`sugars${suffix}`] !== undefined ? Math.round(Number(n[`sugars${suffix}`]) * 10) / 10 : undefined;
  const saturatedFat = n[`saturated-fat${suffix}`] !== undefined ? Math.round(Number(n[`saturated-fat${suffix}`]) * 10) / 10 : undefined;
  const sodium = n[`sodium${suffix}`] !== undefined ? Math.round(Number(n[`sodium${suffix}`]) * 1000) : undefined;

  if (!calories && !protein && !carbs && !fat) return null;

  // Pick best name across many language fields (handles all countries)
  const name =
    p.product_name ||
    p.product_name_en ||
    p.product_name_fr ||
    p.product_name_de ||
    p.product_name_es ||
    p.product_name_it ||
    p.product_name_da ||
    p.product_name_nl ||
    p.product_name_sv ||
    p.product_name_pt ||
    p.product_name_ja ||
    p.generic_name ||
    p.generic_name_en ||
    "Unknown product";

  return {
    name,
    brand: p.brands,
    imageUrl: p.image_front_small_url || p.image_front_url || p.image_url,
    barcode,
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

async function lookupBarcode(barcode: string): Promise<Product | null> {
  // Try each mirror in order, return first hit with usable nutrition
  for (const host of OFF_HOSTS) {
    try {
      const res = await fetch(
        `${host}/api/v2/product/${encodeURIComponent(barcode)}.json?fields=product_name,product_name_en,product_name_fr,product_name_de,product_name_es,product_name_it,product_name_da,product_name_nl,product_name_sv,product_name_pt,product_name_ja,generic_name,generic_name_en,brands,image_front_small_url,image_front_url,image_url,nutriments,serving_quantity`
      );
      if (!res.ok) continue;
      const data = await res.json();
      if (data.status !== 1 || !data.product) continue;
      const parsed = parseProduct(data.product, barcode);
      if (parsed) return parsed;
    } catch (e) {
      console.warn(`OFF mirror ${host} failed`, e);
      // try next mirror
    }
  }
  return null;
}

export default function BarcodeScan() {
  const nav = useNavigate();
  const { user, meals, addMeal } = useKStore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const [step, setStep] = useState<Step>("scan");
  const [product, setProduct] = useState<Product | null>(null);
  const [servings, setServings] = useState(1);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [manual, setManual] = useState("");
  const [cameraError, setCameraError] = useState<string | null>(null);

  const stopCamera = () => {
    try { controlsRef.current?.stop(); } catch {}
    controlsRef.current = null;
  };

  const startCamera = async () => {
    setCameraError(null);
    setStep("scan");
    setProduct(null);
    setScannedCode(null);

    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.CODE_128,
      BarcodeFormat.CODE_39,
      BarcodeFormat.QR_CODE,
    ]);
    const reader = new BrowserMultiFormatReader(hints);

    try {
      const controls = await reader.decodeFromVideoDevice(
        undefined,
        videoRef.current!,
        async (result, _err, ctrl) => {
          if (result) {
            const code = result.getText();
            ctrl.stop();
            controlsRef.current = null;
            await handleCode(code);
          }
        }
      );
      controlsRef.current = controls;
    } catch (err: any) {
      console.error("Camera error", err);
      setCameraError(err?.message || "Could not access camera. Allow camera access or enter the barcode manually.");
    }
  };

  const handleCode = async (code: string) => {
    setScannedCode(code);
    setStep("loading");
    const p = await lookupBarcode(code);
    if (!p) {
      setStep("notfound");
      return;
    }
    setProduct(p);
    setServings(1);
    setStep("result");
  };

  const submitManual = (e: React.FormEvent) => {
    e.preventDefault();
    const code = manual.trim();
    if (!/^\d{6,14}$/.test(code)) {
      toast.error("Enter a valid barcode (6–14 digits)");
      return;
    }
    stopCamera();
    handleCode(code);
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = () => {
    if (!product) return;
    const mult = Math.max(0.25, servings);
    addMeal({
      id: crypto.randomUUID(),
      name: product.brand ? `${product.brand} – ${product.name}` : product.name,
      calories: Math.round(product.calories * mult),
      protein: Math.round(product.protein * mult),
      carbs: Math.round(product.carbs * mult),
      fat: Math.round(product.fat * mult),
      fiber: product.fiber !== undefined ? Math.round(product.fiber * mult * 10) / 10 : undefined,
      sugar: product.sugar !== undefined ? Math.round(product.sugar * mult * 10) / 10 : undefined,
      sodium: product.sodium !== undefined ? Math.round(product.sodium * mult) : undefined,
      saturatedFat: product.saturatedFat !== undefined ? Math.round(product.saturatedFat * mult * 10) / 10 : undefined,
      healthScore: product.healthScore,
      at: Date.now(),
    });
    toast.success("Added to diary", { description: `${Math.round(product.calories * mult)} kcal logged` });
    nav("/diary");
  };

  const remaining = product
    ? Math.max(0, user.calories - caloriesToday(meals) - Math.round(product.calories * servings))
    : 0;

  return (
    <div className="k-page">
      <header className="flex items-center gap-3 mb-6">
        <button
          onClick={() => { stopCamera(); nav(-1); }}
          className="k-tap w-10 h-10 rounded-full bg-card border-[3px] border-foreground flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold tracking-tight flex-1">Scan barcode</h1>
        <div className="w-10 h-10 rounded-2xl bg-accent border-[3px] border-foreground flex items-center justify-center">
          <Barcode className="w-5 h-5 text-foreground" strokeWidth={2.5} />
        </div>
      </header>

      {/* SCAN STEP */}
      {step === "scan" && (
        <div className="animate-fade-in">
          <div className="relative aspect-[3/4] w-full rounded-3xl overflow-hidden border-[3px] border-foreground bg-foreground mb-5 shadow-card">
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover"
              playsInline
              muted
              autoPlay
            />
            {/* Corner brackets */}
            {[
              "top-6 left-6 border-t-[3px] border-l-[3px]",
              "top-6 right-6 border-t-[3px] border-r-[3px]",
              "bottom-6 left-6 border-b-[3px] border-l-[3px]",
              "bottom-6 right-6 border-b-[3px] border-r-[3px]",
            ].map((c, i) => (
              <div key={i} className={`absolute w-12 h-12 rounded-md border-accent ${c}`} />
            ))}
            {/* Scan line */}
            <div className="absolute left-8 right-8 top-1/2 h-0.5 bg-accent shadow-[0_0_20px_hsl(var(--accent))] animate-pulse" />
            {/* Hint */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-card border-[3px] border-foreground text-xs font-bold">
              Point camera at barcode
            </div>
            {cameraError && (
              <div className="absolute inset-0 bg-card flex flex-col items-center justify-center text-center px-6">
                <div className="w-14 h-14 rounded-2xl bg-destructive border-[3px] border-foreground flex items-center justify-center mb-3">
                  <AlertCircle className="w-7 h-7 text-white" />
                </div>
                <p className="font-bold mb-1">Camera unavailable</p>
                <p className="text-sm text-muted-foreground">{cameraError}</p>
              </div>
            )}
          </div>

          <form onSubmit={submitManual} className="k-card p-4 mb-3">
            <label className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-2 block">
              Or enter barcode manually
            </label>
            <div className="flex gap-2">
              <Input
                value={manual}
                onChange={(e) => setManual(e.target.value)}
                inputMode="numeric"
                placeholder="e.g. 5740900403666"
                className="h-12 rounded-2xl border-[3px] border-foreground font-mono"
              />
              <Button
                type="submit"
                className="h-12 px-5 rounded-2xl bg-gradient-primary font-bold border-[3px] border-foreground"
              >
                Look up
              </Button>
            </div>
          </form>

          {cameraError && (
            <Button
              onClick={startCamera}
              variant="outline"
              className="w-full h-12 rounded-2xl border-[3px] border-foreground font-bold"
            >
              <Camera className="w-4 h-4 mr-2" />
              Try camera again
            </Button>
          )}
        </div>
      )}

      {/* LOADING */}
      {step === "loading" && (
        <div className="k-card p-10 text-center animate-fade-in">
          <Loader2 className="w-12 h-12 mx-auto animate-spin text-accent mb-4" strokeWidth={2.5} />
          <p className="font-bold text-lg">Looking up product…</p>
          {scannedCode && <p className="text-sm text-muted-foreground font-mono mt-1">{scannedCode}</p>}
        </div>
      )}

      {/* NOT FOUND */}
      {step === "notfound" && (
        <div className="k-card p-8 text-center animate-fade-in">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-destructive border-[3px] border-foreground flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-white" />
          </div>
          <p className="font-bold text-lg mb-1">Product not found</p>
          <p className="text-sm text-muted-foreground mb-2">
            Barcode <span className="font-mono text-foreground">{scannedCode}</span> isn't in the database yet.
          </p>
          <p className="text-xs text-muted-foreground mb-5">
            Try the AI food scanner instead, or scan a different product.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={startCamera}
              className="h-12 rounded-2xl border-[3px] border-foreground font-bold"
            >
              Scan again
            </Button>
            <Button
              onClick={() => nav("/scan")}
              className="h-12 rounded-2xl bg-gradient-primary font-bold border-[3px] border-foreground"
            >
              AI scan
            </Button>
          </div>
        </div>
      )}

      {/* RESULT */}
      {step === "result" && product && (
        <div className="space-y-4 animate-fade-in">
          <div className="k-card p-5 bg-gradient-soft">
            <div className="flex gap-4 items-start">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-20 h-20 rounded-2xl object-cover border-[3px] border-foreground bg-card shrink-0"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl border-[3px] border-foreground bg-card flex items-center justify-center shrink-0">
                  <Barcode className="w-8 h-8 text-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                {product.brand && (
                  <div className="text-xs uppercase tracking-widest text-muted-foreground font-bold">
                    {product.brand}
                  </div>
                )}
                <div className="font-bold text-lg leading-tight">{product.name}</div>
                <div className="flex items-center gap-2 mt-2">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-card border-[3px] border-foreground">
                    <Heart className="w-3.5 h-3.5 text-accent" strokeWidth={2.5} />
                    <span className="text-xs font-bold">{product.healthScore}/10</span>
                  </div>
                  <div className="text-[10px] font-mono text-muted-foreground">{product.barcode}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Servings */}
          <div className="k-card p-4">
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Servings</span>
              <span className="text-xs text-muted-foreground">per {product.servingLabel}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <Button
                onClick={() => setServings((s) => Math.max(0.25, Math.round((s - 0.5) * 4) / 4))}
                variant="outline"
                className="h-12 w-12 rounded-2xl border-[3px] border-foreground font-bold text-xl"
              >
                −
              </Button>
              <div className="text-3xl font-black tabular-nums flex-1 text-center">{servings}</div>
              <Button
                onClick={() => setServings((s) => Math.round((s + 0.5) * 4) / 4)}
                variant="outline"
                className="h-12 w-12 rounded-2xl border-[3px] border-foreground font-bold text-xl"
              >
                +
              </Button>
            </div>
          </div>

          {/* Calories big */}
          <div className="k-card p-5 bg-gradient-soft">
            <div className="flex items-baseline justify-between">
              <div>
                <div className="text-xs text-muted-foreground tracking-widest uppercase font-bold">Calories</div>
                <div className="text-5xl font-black k-gradient-text">
                  {Math.round(product.calories * servings)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground tracking-widest uppercase font-bold">Remaining</div>
                <div className="text-2xl font-bold">{remaining}</div>
              </div>
            </div>
          </div>

          {/* Macros */}
          <div className="grid grid-cols-3 gap-3">
            <Macro label="Protein" value={Math.round(product.protein * servings)} />
            <Macro label="Carbs" value={Math.round(product.carbs * servings)} />
            <Macro label="Fat" value={Math.round(product.fat * servings)} />
          </div>

          {/* Micros */}
          {(product.fiber !== undefined || product.sugar !== undefined || product.sodium !== undefined || product.saturatedFat !== undefined) && (
            <div className="k-card p-4">
              <div className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-3">Per serving × {servings}</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {product.fiber !== undefined && (
                  <Row label="Fiber" value={`${(product.fiber * servings).toFixed(1)}g`} />
                )}
                {product.sugar !== undefined && (
                  <Row label="Sugar" value={`${(product.sugar * servings).toFixed(1)}g`} />
                )}
                {product.saturatedFat !== undefined && (
                  <Row label="Sat. fat" value={`${(product.saturatedFat * servings).toFixed(1)}g`} />
                )}
                {product.sodium !== undefined && (
                  <Row label="Sodium" value={`${Math.round(product.sodium * servings)}mg`} />
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button
              variant="outline"
              onClick={startCamera}
              className="h-14 rounded-2xl border-[3px] border-foreground font-bold"
            >
              Scan another
            </Button>
            <Button
              onClick={save}
              className="h-14 rounded-2xl bg-gradient-primary font-bold border-[3px] border-foreground shadow-card"
            >
              <Check className="w-5 h-5 mr-1" strokeWidth={3} />
              Add to diary
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

const Macro = ({ label, value }: { label: string; value: number }) => (
  <div className="k-card p-4 text-center">
    <div className="text-2xl font-black k-gradient-text">{value}g</div>
    <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mt-1">{label}</div>
  </div>
);

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-bold tabular-nums">{value}</span>
  </div>
);

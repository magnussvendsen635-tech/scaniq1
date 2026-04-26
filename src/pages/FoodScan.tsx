import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useKStore, caloriesToday } from "@/store/useKStore";
import { FOOD_NAMES } from "@/data/exercises";
import { Camera, Sparkles, ArrowLeft, Heart, Check, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Result {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  healthScore: number;
}

const rand = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a;

export default function FoodScan() {
  const nav = useNavigate();
  const { user, meals, addMeal, streak } = useKStore();
  const [celebrate, setCelebrate] = useState<{ count: number } | null>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const scan = async () => {
    setScanning(true);
    setResult(null);
    await new Promise((r) => setTimeout(r, 1400));
    const calories = rand(200, 700);
    const protein = rand(10, 45);
    const fat = rand(5, 30);
    const carbs = Math.max(5, Math.round((calories - protein * 4 - fat * 9) / 4));
    const r: Result = {
      name: FOOD_NAMES[rand(0, FOOD_NAMES.length - 1)],
      calories,
      protein,
      carbs,
      fat,
      healthScore: rand(4, 10),
    };
    setResult(r);
    setScanning(false);
  };

  const save = () => {
    if (!result) return;
    const prevStreak = streak;
    const prevDate = useKStore.getState().lastActiveDate;
    addMeal({
      id: crypto.randomUUID(),
      name: result.name,
      calories: result.calories,
      protein: result.protein,
      carbs: result.carbs,
      fat: result.fat,
      healthScore: result.healthScore,
      at: Date.now(),
    });
    const newStreak = useKStore.getState().streak;
    const grew = newStreak > prevStreak || prevDate !== useKStore.getState().lastActiveDate;
    if (grew) {
      setCelebrate({ count: newStreak });
      setTimeout(() => {
        setCelebrate(null);
        toast.success("Meal added", { description: `${result.calories} kcal logged.` });
        nav("/diary");
      }, 1800);
    } else {
      toast.success("Meal added", { description: `${result.calories} kcal logged.` });
      nav("/diary");
    }
  };

  const remaining = Math.max(0, user.calories - caloriesToday(meals) - (result?.calories ?? 0));

  return (
    <div className="k-page">
      <header className="flex items-center gap-3 mb-6">
        <button onClick={() => nav(-1)} className="k-tap w-10 h-10 rounded-full bg-card border border-border/60 flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-semibold tracking-tight">Scan Food</h1>
      </header>

      {/* Camera viewport */}
      <div className="relative aspect-[3/4] w-full rounded-3xl overflow-hidden border border-border/60 bg-gradient-surface mb-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,hsl(var(--primary)/0.18),transparent_60%)]" />
        {/* Corner brackets */}
        {[
          "top-6 left-6 border-t-2 border-l-2",
          "top-6 right-6 border-t-2 border-r-2",
          "bottom-6 left-6 border-b-2 border-l-2",
          "bottom-6 right-6 border-b-2 border-r-2",
        ].map((c, i) => (
          <div key={i} className={`absolute w-10 h-10 rounded-md border-primary/70 ${c}`} />
        ))}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          {scanning ? (
            <>
              <div className="relative w-20 h-20 mb-4">
                <div className="absolute inset-0 rounded-full bg-gradient-primary animate-ping opacity-40" />
                <div className="absolute inset-0 rounded-full bg-gradient-primary flex items-center justify-center shadow-glow">
                  <Sparkles className="w-9 h-9 text-white" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">Identifying your meal…</p>
            </>
          ) : result ? (
            <div className="animate-scale-in">
              <Check className="w-14 h-14 mx-auto text-primary-glow mb-2" />
              <p className="text-2xl font-semibold">{result.name}</p>
            </div>
          ) : (
            <>
              <Camera className="w-14 h-14 text-muted-foreground/70 mb-3" />
              <p className="text-muted-foreground text-sm">Point at your meal and tap Scan</p>
            </>
          )}
        </div>
      </div>

      {!result && (
        <Button
          disabled={scanning}
          onClick={scan}
          className="w-full h-14 rounded-2xl bg-gradient-primary text-base font-semibold shadow-glow hover:opacity-90"
        >
          {scanning ? "Scanning…" : "Scan Food"}
        </Button>
      )}

      {result && (
        <div className="space-y-4 animate-fade-in">
          <div className="k-card p-5 bg-gradient-soft">
            <div className="flex items-baseline justify-between">
              <div>
                <div className="text-xs text-muted-foreground tracking-widest uppercase">Calories</div>
                <div className="text-5xl font-semibold k-gradient-text">{result.calories}</div>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card">
                <Heart className="w-4 h-4 text-primary-glow" />
                <span className="text-sm font-semibold">{result.healthScore}/10</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-3">You have <span className="text-foreground font-semibold">{remaining} kcal</span> remaining today.</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Macro label="Protein" value={result.protein} />
            <Macro label="Carbs" value={result.carbs} />
            <Macro label="Fat" value={result.fat} />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button variant="outline" onClick={scan} className="h-12 rounded-2xl border-border bg-card">Rescan</Button>
            <Button onClick={save} className="h-12 rounded-2xl bg-gradient-primary shadow-glow hover:opacity-90 font-semibold">Add to diary</Button>
          </div>
        </div>
      )}
    </div>
  );
}

const Macro = ({ label, value }: { label: string; value: number }) => (
  <div className="k-card p-4 text-center">
    <div className="text-2xl font-semibold">{value}<span className="text-sm text-muted-foreground">g</span></div>
    <div className="text-[10px] tracking-widest uppercase text-muted-foreground mt-1">{label}</div>
  </div>
);

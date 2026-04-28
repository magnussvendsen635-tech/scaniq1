import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useKStore } from "@/store/useKStore";
import { ArrowLeft, Scale, TrendingDown, TrendingUp, Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function Weight() {
  const nav = useNavigate();
  const { user, weights, logWeight, removeWeight, autoAdjustGoal, setAutoAdjustGoal } = useKStore();
  const [val, setVal] = useState<string>(String(user.weight));

  const submit = () => {
    const kg = parseFloat(val);
    if (!kg || kg < 25 || kg > 400) {
      toast.error("Invalid weight");
      return;
    }
    logWeight(kg);
    toast.success("Weight logged", {
      description: autoAdjustGoal ? "Calorie goal auto-adjusted" : undefined,
    });
  };

  // Build chart data — last 30 entries sorted oldest -> newest
  const sorted = [...weights].sort((a, b) => a.at - b.at).slice(-30);
  const chartData = sorted.length > 0 ? sorted : [{ weight: user.weight, at: Date.now() }];
  const minW = Math.min(...chartData.map((w) => w.weight)) - 1;
  const maxW = Math.max(...chartData.map((w) => w.weight)) + 1;
  const range = Math.max(1, maxW - minW);

  const start = sorted[0]?.weight ?? user.weight;
  const latest = sorted[sorted.length - 1]?.weight ?? user.weight;
  const diff = latest - start;
  const toGoal = latest - user.targetWeight;

  return (
    <div className="k-page">
      <header className="flex items-center gap-3 mb-6">
        <button onClick={() => nav(-1)} className="k-tap w-10 h-10 rounded-full bg-card border border-border/60 flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-semibold tracking-tight flex-1">Weight tracker</h1>
      </header>

      {/* Hero */}
      <div className="k-card p-6 mb-4 bg-gradient-surface relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-gradient-primary opacity-20 blur-3xl" />
        <div className="relative">
          <div className="text-xs text-muted-foreground tracking-widest uppercase">Current weight</div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-5xl font-semibold k-gradient-text">{latest.toFixed(1)}</span>
            <span className="text-base text-muted-foreground">kg</span>
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs">
            <span className="flex items-center gap-1 text-muted-foreground">
              {diff < 0 ? <TrendingDown className="w-3.5 h-3.5 text-primary-glow" /> : diff > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
              <span className="text-foreground font-medium">{diff > 0 ? "+" : ""}{diff.toFixed(1)} kg</span> total
            </span>
            <span className="text-muted-foreground">
              Goal <span className="text-foreground font-medium">{user.targetWeight} kg</span> ({toGoal > 0 ? "-" : "+"}{Math.abs(toGoal).toFixed(1)})
            </span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="k-card p-5 mb-4">
        <div className="text-xs text-muted-foreground tracking-widest uppercase mb-3">Trend</div>
        <svg viewBox="0 0 300 120" className="w-full h-32">
          <defs>
            <linearGradient id="wlg" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.4" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
            </linearGradient>
          </defs>
          {(() => {
            const pts = chartData.map((w, i) => {
              const x = (i / Math.max(1, chartData.length - 1)) * 300;
              const y = 110 - ((w.weight - minW) / range) * 100;
              return [x, y];
            });
            const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ");
            const area = `${line} L300,120 L0,120 Z`;
            return (
              <>
                <path d={area} fill="url(#wlg)" />
                <path d={line} stroke="hsl(var(--primary-glow))" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                {pts.map((p, i) => (
                  <circle key={i} cx={p[0]} cy={p[1]} r="3" fill="hsl(var(--primary-glow))" />
                ))}
              </>
            );
          })()}
        </svg>
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
          <span>{minW.toFixed(1)} kg</span>
          <span>{maxW.toFixed(1)} kg</span>
        </div>
      </div>

      {/* Quick log */}
      <div className="k-card p-5 mb-4">
        <div className="text-xs text-muted-foreground tracking-widest uppercase mb-3">Log new weight</div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setVal(String(Math.max(25, (parseFloat(val) || 0) - 0.1).toFixed(1)))}
            className="k-tap w-11 h-11 rounded-2xl bg-card border border-border flex items-center justify-center"
          >
            <Minus className="w-4 h-4" />
          </button>
          <Input
            type="number"
            step="0.1"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            className="text-center text-xl font-semibold h-11 rounded-2xl"
          />
          <button
            onClick={() => setVal(String((parseFloat(val) || 0) + 0.1).slice(0, 6))}
            className="k-tap w-11 h-11 rounded-2xl bg-card border border-border flex items-center justify-center"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <Button onClick={submit} className="w-full h-12 mt-3 rounded-2xl bg-gradient-primary font-semibold shadow-glow">
          <Scale className="w-4 h-4 mr-2" /> Log weight
        </Button>
        <label className="flex items-center justify-between mt-4 text-sm">
          <span className="text-muted-foreground">Auto-adjust calorie goal</span>
          <input
            type="checkbox"
            checked={autoAdjustGoal}
            onChange={(e) => setAutoAdjustGoal(e.target.checked)}
            className="w-5 h-5 accent-primary"
          />
        </label>
      </div>

      {/* History */}
      {weights.length > 0 && (
        <div className="k-card divide-y divide-border/60 overflow-hidden">
          <div className="p-4 text-xs text-muted-foreground tracking-widest uppercase">History</div>
          {weights.slice(0, 20).map((w) => (
            <div key={w.at} className="flex items-center justify-between p-4">
              <div>
                <div className="font-medium">{w.weight.toFixed(1)} kg</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(w.at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                </div>
              </div>
              <button onClick={() => removeWeight(w.at)} className="k-tap w-9 h-9 rounded-xl flex items-center justify-center hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

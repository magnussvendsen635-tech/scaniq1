import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { EXERCISES, type Exercise } from "@/data/exercises";
import { useKStore } from "@/store/useKStore";
import { Button } from "@/components/ui/button";
import { Flame, Play, Pause, RotateCcw, Search, X, Lock, Dumbbell, ArrowUp, ArrowDown, Zap } from "lucide-react";
import { Ring } from "@/components/Ring";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n/useT";
import type { TKey } from "@/i18n/translations";
import { PremiumLock } from "@/components/PremiumLock";

const CATS = ["All", "Cardio", "HIIT", "Strength", "Mobility", "Sport"] as const;
const CAT_KEYS: Record<(typeof CATS)[number], TKey> = {
  All: "workouts.cat_all",
  Cardio: "workouts.cat_cardio",
  HIIT: "workouts.cat_hiit",
  Strength: "workouts.cat_strength",
  Mobility: "workouts.cat_mobility",
  Sport: "workouts.cat_sport",
};

export default function Workouts() {
  const t = useT();
  const { addWorkout, premium } = useKStore();
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<(typeof CATS)[number]>("All");
  const [active, setActive] = useState<Exercise | null>(null);
  const [duration, setDuration] = useState(20); // minutes
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0); // seconds
  const intervalRef = useRef<number | null>(null);

  const list = useMemo(
    () =>
      EXERCISES.filter(
        (e) => (cat === "All" || e.category === cat) && e.name.toLowerCase().includes(q.toLowerCase())
      ),
    [q, cat]
  );

  useEffect(() => {
    if (!running) return;
    intervalRef.current = window.setInterval(() => {
      setElapsed((s) => {
        if (s + 1 >= duration * 60) {
          setRunning(false);
          return duration * 60;
        }
        return s + 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [running, duration]);

  const burnedNow = active ? Math.round((elapsed / 60) * active.kcalPerMin) : 0;

  const close = () => {
    setActive(null);
    setRunning(false);
    setElapsed(0);
  };

  const finish = () => {
    if (!active || elapsed === 0) return close();
    addWorkout({
      id: crypto.randomUUID(),
      name: active.name,
      minutes: Math.round(elapsed / 60),
      caloriesBurned: burnedNow,
      at: Date.now(),
    });
    toast.success(t("workouts.logged"), { description: `${burnedNow} ${t("workouts.kcal_burned")}` });
    close();
  };

  return (
    <div className="k-page">
      <h1 className="text-3xl font-semibold tracking-tight mb-5">{t("workouts.title")}</h1>

      {!premium ? (
        <PremiumLock>
          <div className="space-y-2.5">
            {EXERCISES.slice(0, 8).map((e) => (
              <div key={e.name} className="k-card w-full p-4 flex items-center gap-4 text-left">
                <div className="w-11 h-11 rounded-2xl bg-gradient-soft flex items-center justify-center shrink-0">
                  <Flame className="w-5 h-5 text-primary-glow" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{e.name}</div>
                  <div className="text-xs text-muted-foreground">{e.category}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">{e.kcalPerMin}</div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">kcal/min</div>
                </div>
              </div>
            ))}
          </div>
        </PremiumLock>
      ) : (
        <>

      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("workouts.search")}
          className="w-full h-12 rounded-2xl bg-card border border-border/60 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/60"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-4 -mx-4 px-4">
        {CATS.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={cn(
              "px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap k-tap transition shrink-0",
              cat === c ? "bg-gradient-primary text-white shadow-glow" : "bg-card border border-border/60 text-muted-foreground"
            )}
          >
            {t(CAT_KEYS[c])}
          </button>
        ))}
      </div>

      <div className="space-y-2.5">
        {list.map((e) => (
          <button
            key={e.name}
            onClick={() => {
              if (!premium) {
                toast(t("workouts.upgrade_toast"), { description: t("workouts.upgrade_toast_sub") });
                nav("/premium");
                return;
              }
              setActive(e);
              setElapsed(0);
              setRunning(false);
            }}
            className="k-card k-tap w-full p-4 flex items-center gap-4 text-left"
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-soft flex items-center justify-center shrink-0">
              {premium ? (
                <Flame className="w-5 h-5 text-primary-glow" />
              ) : (
                <Lock className="w-5 h-5 text-primary-glow" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{e.name}</div>
              <div className="text-xs text-muted-foreground">{e.category}</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold">{e.kcalPerMin}</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">kcal/min</div>
            </div>
          </button>
        ))}
      </div>

      {/* Active exercise modal */}
      {active && (
        <div className="fixed inset-0 z-[60] bg-background/90 backdrop-blur-xl animate-fade-in flex items-end md:items-center justify-center p-4">
          <div className="w-full max-w-md k-card p-6 bg-gradient-surface relative">
            <button onClick={close} className="absolute top-4 right-4 w-9 h-9 rounded-full bg-card border border-border/60 flex items-center justify-center k-tap">
              <X className="w-4 h-4" />
            </button>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">{active.category}</div>
            <h2 className="text-2xl font-semibold mt-1 mb-6">{active.name}</h2>

            <div className="flex flex-col items-center mb-6">
              <Ring value={elapsed / (duration * 60)} size={210}>
                <div className="text-center">
                  <div className="text-4xl font-semibold tracking-tight tabular-nums k-gradient-text">
                    {String(Math.floor(elapsed / 60)).padStart(2, "0")}:{String(elapsed % 60).padStart(2, "0")}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 tracking-widest uppercase">{burnedNow} {t("common.kcal")}</div>
                </div>
              </Ring>
            </div>

            <div className="mb-6">
              <div className="flex justify-between text-xs text-muted-foreground mb-2">
                <span>{t("workouts.duration")}</span>
                <span>
                  {duration < 60
                    ? `${duration} min`
                    : duration % 60 === 0
                    ? `${duration / 60} h`
                    : `${Math.floor(duration / 60)} h ${duration % 60} min`}
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={80}
                value={duration <= 60 ? duration : 60 + (duration - 60) / 15}
                disabled={running}
                onChange={(e) => {
                  const idx = Number(e.target.value);
                  const mins = idx <= 60 ? idx : 60 + (idx - 60) * 15;
                  setDuration(mins);
                }}
                className="w-full accent-[hsl(var(--primary))]"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1 uppercase tracking-widest">
                <span>1 min</span>
                <span>1 h</span>
                <span>6 h</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Button variant="outline" className="h-12 rounded-2xl border-border bg-card" onClick={() => { setRunning(false); setElapsed(0); }}>
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => setRunning((r) => !r)}
                className="h-12 rounded-2xl bg-gradient-primary shadow-glow font-semibold col-span-1"
              >
                {running ? <><Pause className="w-4 h-4 mr-1" />{t("workouts.pause")}</> : <><Play className="w-4 h-4 mr-1" />{t("workouts.start")}</>}
              </Button>
              <Button onClick={finish} variant="outline" className="h-12 rounded-2xl border-border bg-card font-semibold">
                {t("common.save")}
              </Button>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}

import { Link } from "react-router-dom";
import { useState, useMemo, useEffect } from "react";
import { useKStore, type MealCategory } from "@/store/useKStore";
import { Camera, Heart, Sun, UtensilsCrossed, Moon, Cookie, Plus, Trash2, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { useT } from "@/i18n/useT";
import type { TKey } from "@/i18n/translations";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { DailyTasks } from "@/components/DailyTasks";

const CATEGORIES: { key: MealCategory; labelKey: TKey; addKey: TKey; Icon: any }[] = [
  { key: "breakfast", labelKey: "diary.cat_breakfast", addKey: "diary.add_breakfast", Icon: Sun },
  { key: "lunch", labelKey: "diary.cat_lunch", addKey: "diary.add_lunch", Icon: UtensilsCrossed },
  { key: "dinner", labelKey: "diary.cat_dinner", addKey: "diary.add_dinner", Icon: Moon },
  { key: "snack", labelKey: "diary.cat_snack", addKey: "diary.add_snack", Icon: Cookie },
];

const ymd = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
const startOfWeek = (d: Date) => {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // Monday = 0
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
};

export default function Diary() {
  const t = useT();
  const { meals, user, removeMeal, language, weights, logWeight } = useKStore() as any;
  const [selected, setSelected] = useState<Date>(new Date());
  const [weekStart, setWeekStart] = useState<Date>(startOfWeek(new Date()));
  const [summary, setSummary] = useState<string>("");
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [weightDialogOpen, setWeightDialogOpen] = useState(false);
  const [weightInput, setWeightInput] = useState<string>("");
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  // Keep calendar in sync with the real current date (rolls over at midnight,
  // and when the user returns to the tab on a new day).
  useEffect(() => {
    const syncToToday = () => {
      const now = new Date();
      const todayKey = ymd(now);
      setSelected((prev) => (ymd(prev) === todayKey ? prev : now));
      setWeekStart((prev) => {
        const next = startOfWeek(now);
        return ymd(prev) === ymd(next) ? prev : next;
      });
    };
    syncToToday();
    const onVis = () => { if (document.visibilityState === "visible") syncToToday(); };
    document.addEventListener("visibilitychange", onVis);
    const interval = window.setInterval(syncToToday, 60 * 1000);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.clearInterval(interval);
    };
  }, []);

  const lastMealAt: Date | null = useMemo(() => {
    if (!meals || meals.length === 0) return null;
    const sorted = [...meals].sort((a: any, b: any) => new Date(b.at).getTime() - new Date(a.at).getTime());
    return new Date(sorted[0].at);
  }, [meals]);

  const selectedKey = ymd(selected);
  const isToday = selectedKey === ymd(new Date());

  const dayMeals = useMemo(
    () => meals.filter((m: any) => ymd(new Date(m.at)) === selectedKey),
    [meals, selectedKey]
  );

  const cal = dayMeals.reduce((a: number, b: any) => a + b.calories, 0);
  const macros = dayMeals.reduce(
    (acc: any, m: any) => ({ protein: acc.protein + m.protein, carbs: acc.carbs + m.carbs, fat: acc.fat + m.fat }),
    { protein: 0, carbs: 0, fat: 0 }
  );
  const micro = dayMeals.reduce(
    (acc: any, m: any) => ({
      fiber: acc.fiber + (m.fiber ?? 0),
      sugar: acc.sugar + (m.sugar ?? 0),
      sodium: acc.sodium + (m.sodium ?? 0),
      saturatedFat: acc.saturatedFat + (m.saturatedFat ?? 0),
      cholesterol: acc.cholesterol + (m.cholesterol ?? 0),
    }),
    { fiber: 0, sugar: 0, sodium: 0, saturatedFat: 0, cholesterol: 0 }
  );
  const hasMicro = micro.fiber + micro.sugar + micro.sodium + micro.saturatedFat + micro.cholesterol > 0;

  const grouped: Record<MealCategory, any[]> = { breakfast: [], lunch: [], dinner: [], snack: [] };
  for (const meal of dayMeals) {
    const cat = (meal.category ?? "snack") as MealCategory;
    grouped[cat].push(meal);
  }

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  const fetchSummary = async () => {
    if (dayMeals.length === 0) {
      setSummary("");
      return;
    }
    setLoadingSummary(true);
    try {
      const { data, error } = await supabase.functions.invoke("diary-summary", {
        body: {
          meals: dayMeals,
          target: user.calories,
          macros: { ...macros, targetP: user.protein, targetC: user.carbs, targetF: user.fat },
          micro,
          language: language || "en",
        },
      });
      if (error) throw error;
      setSummary(data?.summary || "");
    } catch (e: any) {
      console.error("summary error", e);
      toast.error("Couldn't load insight");
    } finally {
      setLoadingSummary(false);
    }
  };

  // Auto-load summary when day or meal count changes
  useEffect(() => {
    setSummary("");
    if (dayMeals.length > 0) fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKey, dayMeals.length]);

  const dayLabels = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(language || undefined, { weekday: "narrow" });
    return weekDays.map((d) => fmt.format(d));
  }, [language, weekDays]);

  return (
    <div className="k-page">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-semibold tracking-tight">{t("diary.title")}</h1>
      </div>


      {/* Week date picker */}
      <div className="k-card p-3 mb-4">
        <div className="flex items-center justify-between mb-2 px-1">
          <button
            onClick={() => {
              const d = new Date(weekStart);
              d.setDate(d.getDate() - 7);
              setWeekStart(d);
            }}
            className="k-tap w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="text-sm font-medium">
            {selected.toLocaleDateString(language || undefined, { weekday: "long", day: "numeric", month: "long" })}
          </div>
          <button
            onClick={() => {
              const d = new Date(weekStart);
              d.setDate(d.getDate() + 7);
              setWeekStart(d);
            }}
            className="k-tap w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((d, i) => {
            const key = ymd(d);
            const isSel = key === selectedKey;
            const isTod = key === ymd(new Date());
            const dayCals = meals
              .filter((m: any) => ymd(new Date(m.at)) === key)
              .reduce((a: number, b: any) => a + b.calories, 0);
            return (
              <button
                key={key}
                onClick={() => setSelected(d)}
                className={`k-tap flex flex-col items-center py-2 rounded-xl transition-all ${
                  isSel ? "bg-gradient-primary text-primary-foreground" : "hover:bg-muted"
                }`}
              >
                <span className={`text-[10px] uppercase tracking-widest ${isSel ? "opacity-90" : "text-muted-foreground"}`}>
                  {dayLabels[i]}
                </span>
                <span className={`text-base font-semibold mt-0.5 ${isTod && !isSel ? "text-primary-glow" : ""}`}>
                  {d.getDate()}
                </span>
                {dayCals > 0 && (
                  <span className={`text-[9px] mt-0.5 ${isSel ? "opacity-90" : "text-muted-foreground"}`}>
                    {dayCals}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="k-card p-5 mb-4 bg-gradient-surface">
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <div className="text-xs text-muted-foreground tracking-widest uppercase">
              {isToday ? t("common.today") : selected.toLocaleDateString(language || undefined, { weekday: "short", day: "numeric", month: "short" })}
            </div>
            <div className="text-4xl font-semibold k-gradient-text">
              {cal}
              <span className="text-base text-muted-foreground"> / {user.calories} {t("common.kcal")}</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <T label={t("home.protein")} v={Math.round(macros.protein)} />
          <T label={t("home.carbs")} v={Math.round(macros.carbs)} />
          <T label={t("home.fat")} v={Math.round(macros.fat)} />
        </div>
      </div>

      {/* Weight trend chart + horizontal calendar strip — rebuilt from scratch */}
      {(() => {
        // ---------- Month days (1..N) ----------
        const year = selected.getFullYear();
        const month = selected.getMonth();
        const DAYS = new Date(year, month + 1, 0).getDate();
        const days = Array.from({ length: DAYS }, (_, i) => {
          const d = new Date(year, month, i + 1);
          d.setHours(0, 0, 0, 0);
          return { date: d, key: ymd(d), day: i + 1 };
        });

        // ---------- Weight per day (last entry wins) ----------
        const byDay = new Map<string, number>();
        const sortedW = [...(weights || [])].sort((a: any, b: any) => a.at - b.at);
        for (const w of sortedW) byDay.set(ymd(new Date(w.at)), w.weight);

        const logged = days
          .map((d) => ({ ...d, weight: byDay.get(d.key) ?? null }))
          .filter((d) => d.weight != null) as { date: Date; key: string; day: number; weight: number }[];

        // ---------- Fixed clean Y-axis 70..85 kg ----------
        const Y_MIN = 70;
        const Y_MAX = 85;
        const Y_STEP = 5; // 70, 75, 80, 85
        const ticks: number[] = [];
        for (let v = Y_MAX; v >= Y_MIN; v -= Y_STEP) ticks.push(v);

        // ---------- SVG geometry ----------
        const VB_W = 320, VB_H = 140;
        const X0 = 30, X1 = 312, Y0 = 12, Y1 = 118;
        const xForDay = (day: number) => X0 + ((day - 1) * (X1 - X0)) / (DAYS - 1);
        const yFor = (v: number) => {
          const c = Math.max(Y_MIN, Math.min(Y_MAX, v));
          return Y1 - ((c - Y_MIN) / (Y_MAX - Y_MIN)) * (Y1 - Y0);
        };

        // ---------- Smooth line connecting only logged points ----------
        const pts = logged
          .slice()
          .sort((a, b) => a.day - b.day)
          .map((d) => ({ x: xForDay(d.day), y: yFor(d.weight), d }));

        // Catmull-Rom → cubic Bezier for a clean wavy curve
        let linePath = "";
        if (pts.length === 1) {
          linePath = `M${pts[0].x},${pts[0].y}`;
        } else if (pts.length > 1) {
          linePath = `M${pts[0].x},${pts[0].y}`;
          for (let i = 0; i < pts.length - 1; i++) {
            const p0 = pts[i - 1] || pts[i];
            const p1 = pts[i];
            const p2 = pts[i + 1];
            const p3 = pts[i + 2] || p2;
            const c1x = p1.x + (p2.x - p0.x) / 6;
            const c1y = p1.y + (p2.y - p0.y) / 6;
            const c2x = p2.x - (p3.x - p1.x) / 6;
            const c2y = p2.y - (p3.y - p1.y) / 6;
            linePath += ` C${c1x},${c1y} ${c2x},${c2y} ${p2.x},${p2.y}`;
          }
        }

        // ---------- Stats ----------
        const chrono = pts.map((p) => p.d);
        const current = chrono.length ? chrono[chrono.length - 1].weight : user?.weight ?? 0;
        const lastAt = chrono.length ? chrono[chrono.length - 1].date.getTime() : null;
        const weekRef = lastAt
          ? chrono.slice(0, -1).reverse().find((d) => lastAt - d.date.getTime() >= 6 * 86400000)
          : null;
        const weeklyChange = weekRef ? current - weekRef.weight : null;
        const startW = sortedW.length ? sortedW[0].weight : user?.weight ?? 0;
        const target = user?.targetWeight ?? startW;
        const totalProgress = startW && target && startW !== target
          ? Math.max(0, Math.min(100, ((startW - current) / (startW - target)) * 100))
          : 0;

        const hovered = hoverIdx != null ? pts[hoverIdx] : null;

        return (
          <div className="k-card p-5 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs text-muted-foreground tracking-widest uppercase">Weight trend</div>
              <button
                onClick={() => {
                  setWeightInput(String(byDay.get(selectedKey) ?? current ?? ""));
                  setWeightDialogOpen(true);
                }}
                className="k-tap text-[11px] font-medium px-3 py-1.5 rounded-full bg-gradient-primary text-primary-foreground"
              >
                Update Weight
              </button>
            </div>

            {/* ---------- Chart ---------- */}
            <div className="relative">
              <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="w-full h-32 overflow-visible">
                {ticks.map((v, i) => {
                  const y = yFor(v);
                  return (
                    <g key={v}>
                      <line x1={X0} y1={y} x2={X1} y2={y} stroke="hsl(var(--border))" strokeOpacity="0.4" strokeDasharray="2 4" />
                      <text x="0" y={y + 3} fontSize="8" fill="hsl(var(--muted-foreground))">{v}</text>
                    </g>
                  );
                })}
                {linePath && (
                  <path d={linePath} stroke="#f97316" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                )}
                {pts.map((p, i) => (
                  <g key={p.d.key}>
                    <circle cx={p.x} cy={p.y} r={3.5} fill="#f97316" />
                    <rect
                      x={p.x - 8}
                      y={Y0}
                      width={16}
                      height={Y1 - Y0 + 8}
                      fill="transparent"
                      onMouseEnter={() => setHoverIdx(i)}
                      onMouseLeave={() => setHoverIdx(null)}
                      onClick={() => setSelected(new Date(p.d.date))}
                      style={{ cursor: "pointer" }}
                    />
                  </g>
                ))}
                {hovered && (
                  <line x1={hovered.x} x2={hovered.x} y1={Y0} y2={Y1} stroke="#f97316" strokeOpacity="0.4" strokeDasharray="2 2" />
                )}
              </svg>
              {hovered && (
                <div
                  className="absolute pointer-events-none -translate-x-1/2 -translate-y-full px-2 py-1 rounded-md bg-foreground text-background text-[10px] font-medium shadow-md whitespace-nowrap"
                  style={{ left: `${(hovered.x / VB_W) * 100}%`, top: `${(hovered.y / VB_H) * 100}%` }}
                >
                  {hovered.d.date.toLocaleDateString(language || undefined, { day: "numeric", month: "short" })}
                  {" · "}
                  {hovered.d.weight.toFixed(1)} kg
                </div>
              )}
            </div>

            {/* ---------- Stat modules ---------- */}
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="rounded-xl bg-card/40 p-3">
                <div className="text-[9px] uppercase tracking-widest text-muted-foreground">Current</div>
                <div className="text-base font-semibold tabular-nums mt-1">{current ? `${current.toFixed(1)} kg` : "—"}</div>
              </div>
              <div className="rounded-xl bg-card/40 p-3">
                <div className="text-[9px] uppercase tracking-widest text-muted-foreground">Weekly</div>
                <div className={`text-base font-semibold tabular-nums mt-1 ${weeklyChange == null ? "" : weeklyChange < 0 ? "text-emerald-500" : weeklyChange > 0 ? "text-orange-500" : ""}`}>
                  {weeklyChange == null ? "—" : `${weeklyChange > 0 ? "+" : ""}${weeklyChange.toFixed(1)} kg`}
                </div>
              </div>
              <div className="rounded-xl bg-card/40 p-3">
                <div className="text-[9px] uppercase tracking-widest text-muted-foreground">Progress</div>
                <div className="text-base font-semibold tabular-nums mt-1">{Math.round(totalProgress)}%</div>
              </div>
            </div>

            {/* Calendar strip — clean 1..31 only */}
            <div className="mt-4" style={{ display: "grid", gridTemplateColumns: `repeat(${DAYS}, minmax(0, 1fr))` }}>
              {days.map((d) => (
                <button
                  key={d.key}
                  onClick={() => setSelected(new Date(d.date))}
                  className="k-tap flex items-center justify-center min-h-[36px] text-[10px] tabular-nums text-muted-foreground hover:text-foreground"
                >
                  {d.day}
                </button>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Update Weight dialog */}
      {weightDialogOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setWeightDialogOpen(false)}
        >
          <div
            className="w-full max-w-sm k-card p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Log weight</div>
            <div className="text-sm font-medium mb-4">
              {selected.toLocaleDateString(language || undefined, { weekday: "long", day: "numeric", month: "long" })}
            </div>
            <div className="flex items-center gap-2 mb-4">
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                autoFocus
                value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
                placeholder="kg"
                className="flex-1 bg-card/40 rounded-xl px-4 py-3 text-base font-semibold outline-none border border-border focus:border-primary"
              />
              <span className="text-sm text-muted-foreground">kg</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setWeightDialogOpen(false)}
                className="k-tap flex-1 py-2.5 rounded-xl bg-card/40 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const v = parseFloat(weightInput.replace(",", "."));
                  if (!isFinite(v) || v <= 0) { toast.error("Enter a valid weight"); return; }
                  // store entry timestamped on the selected day (noon, to be stable)
                  const at = new Date(selected);
                  at.setHours(12, 0, 0, 0);
                  // Remove any prior entry for that day, then log
                  const prior = (weights || []).filter((w: any) => ymd(new Date(w.at)) === selectedKey);
                  prior.forEach((p: any) => (useKStore.getState() as any).removeWeight(p.at));
                  // override timestamp by patching after logWeight
                  logWeight(v);
                  const state = useKStore.getState() as any;
                  const last = state.weights[0];
                  if (last) {
                    state.removeWeight(last.at);
                    useKStore.setState({ weights: [{ weight: v, at: at.getTime() }, ...state.weights.filter((w: any) => w.at !== last.at)], user: { ...state.user, weight: v } });
                  }
                  setWeightDialogOpen(false);
                  toast.success("Weight saved");
                }}
                className="k-tap flex-1 py-2.5 rounded-xl bg-gradient-primary text-primary-foreground text-sm font-semibold"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}



      {lastMealAt && (
        <div className="k-card p-3 mb-4 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{t("diary.last_log_time")}</span>
          <span className="text-sm font-medium tabular-nums">
            {lastMealAt.toLocaleString(language || undefined, {
              weekday: "short",
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      )}



      {/* AI insight */}
      {dayMeals.length > 0 && (
        <div className="k-card p-4 mb-4 bg-gradient-soft border-primary/20">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-primary flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">{t("diary.ai_insight")}</div>
              {loadingSummary ? (
                <div className="text-sm text-muted-foreground animate-pulse">{t("diary.analyzing")}</div>
              ) : summary ? (
                <div className="text-sm leading-relaxed">{summary}</div>
              ) : (
                <button onClick={fetchSummary} className="text-sm text-primary-glow font-medium k-tap">
                  {t("diary.get_insight")}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Daily tasks (date-bound) */}
      <DailyTasks day={selectedKey} />

      {hasMicro && (
        <div className="k-card p-4 mb-5">
          <div className="text-xs text-muted-foreground tracking-widest uppercase mb-3">{t("micro.title")}</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {micro.fiber > 0 && <MicroRow label={t("micro.fiber")} value={`${micro.fiber.toFixed(1)}g`} />}
            {micro.sugar > 0 && <MicroRow label={t("micro.sugar")} value={`${micro.sugar.toFixed(1)}g`} />}
            {micro.saturatedFat > 0 && <MicroRow label={t("micro.sat_fat")} value={`${micro.saturatedFat.toFixed(1)}g`} />}
            {micro.sodium > 0 && <MicroRow label={t("micro.sodium")} value={`${Math.round(micro.sodium)}mg`} />}
            {micro.cholesterol > 0 && <MicroRow label={t("micro.cholesterol")} value={`${Math.round(micro.cholesterol)}mg`} />}
          </div>
        </div>
      )}

      {dayMeals.length === 0 ? (
        <Link to="/scan" className="k-card k-tap p-8 flex flex-col items-center text-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-soft flex items-center justify-center">
            <Camera className="w-6 h-6 text-primary-glow" />
          </div>
          
          <div className="text-sm text-muted-foreground">{t("diary.no_meals_sub")}</div>
        </Link>
      ) : (
        <div className="space-y-5">
          {CATEGORIES.map(({ key, labelKey, addKey, Icon }) => {
            const list = grouped[key];
            const catCals = list.reduce((a, b) => a + b.calories, 0);
            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-2 px-1">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-gradient-soft flex items-center justify-center">
                      <Icon className="w-3.5 h-3.5 text-primary-glow" />
                    </div>
                    <span className="text-sm font-semibold">{t(labelKey)}</span>
                    {catCals > 0 && <span className="text-xs text-muted-foreground">· {catCals} kcal</span>}
                  </div>
                  <Link to="/scan" className="k-tap w-7 h-7 rounded-full bg-card border border-border/60 flex items-center justify-center">
                    <Plus className="w-3.5 h-3.5" />
                  </Link>
                </div>
                {list.length === 0 ? (
                  <Link to="/scan" className="k-card k-tap p-3 flex items-center justify-center text-xs text-muted-foreground border-dashed">
                    {t(addKey)}
                  </Link>
                ) : (
                  <div className="space-y-2">
                    {list.map((meal: any) => (
                      <div key={meal.id} className="k-card p-3 flex items-center gap-3 group">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-soft flex items-center justify-center shrink-0">
                          <span className="text-sm font-semibold">{meal.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{meal.name}</div>
                          <div className="text-[11px] text-muted-foreground mt-0.5">
                            P {meal.protein}g · C {meal.carbs}g · F {meal.fat}g
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-sm">{meal.calories}</div>
                          <div className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1 justify-end">
                            <Heart className="w-2.5 h-2.5" /> {meal.healthScore}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            removeMeal(meal.id);
                            toast.success(t("diary.meal_removed"));
                          }}
                          className="k-tap w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-60 hover:opacity-100"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const T = ({ label, v }: { label: string; v: number }) => (
  <div className="text-center">
    <div className="text-lg font-semibold">{v}g</div>
    <div className="text-[10px] tracking-widest uppercase text-muted-foreground">{label}</div>
  </div>
);

const MicroRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-medium">{value}</span>
  </div>
);

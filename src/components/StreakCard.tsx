import { Link } from "react-router-dom";
import { Flame, Snowflake } from "lucide-react";
import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import { useKStore } from "@/store/useKStore";
import { useT } from "@/i18n/useT";
import { toast } from "sonner";

export function StreakCard() {
  const t = useT();
  const { streak, lastActiveDate, frozenDays, freezeStreak, freezesLeftThisWeek } = useKStore();
  const today = new Date().toISOString().slice(0, 10);
  const activeToday = lastActiveDate === today;
  const flameRef = useRef<HTMLDivElement | null>(null);
  const prevStreakRef = useRef(streak);

  // Confetti pop when streak increments
  useEffect(() => {
    if (streak > prevStreakRef.current && streak > 0) {
      const el = flameRef.current;
      const origin = el
        ? (() => {
            const r = el.getBoundingClientRect();
            return { x: (r.left + r.width / 2) / window.innerWidth, y: (r.top + r.height / 2) / window.innerHeight };
          })()
        : { x: 0.5, y: 0.3 };
      confetti({
        particleCount: 60,
        startVelocity: 35,
        spread: 70,
        scalar: 0.85,
        ticks: 120,
        origin,
        colors: ["#ff7a18", "#ffb347", "#ffd700", "#ff4d4d", "#ffffff"],
      });
    }
    prevStreakRef.current = streak;
  }, [streak]);

  // Build 7-day rolling view (Mon-Sun aware via getDay letters)
  const days: { dateStr: string; label: string; done: boolean; isToday: boolean; frozen: boolean }[] = [];
  const dayLetters = ["S", "M", "T", "O", "T", "F", "L"]; // DA: Søn Man Tirs Ons Tors Fre Lør
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const dateStr = d.toISOString().slice(0, 10);
    const isToday = i === 0;
    const done = streak > i || (isToday && activeToday);
    const frozenAt = frozenDays[dateStr];
    const frozen = !!frozenAt && frozenAt > Date.now();
    days.push({ dateStr, label: dayLetters[d.getDay()], done, isToday, frozen });
  }

  const headline = streak > 0 ? t("streak.dont_break") : t("streak.start_today");
  const sub = streak > 0 ? t("streak.scan_to_grow") : t("scan.streak_sub");
  const freezesLeft = freezesLeftThisWeek();
  const frozenToday = !!frozenDays[today] && frozenDays[today] > Date.now();

  const handleFreeze = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const r = freezeStreak();
    if (!r.ok) {
      toast.error(r.reason === "limit" ? "Du har brugt begge frys denne uge" : "Streak er allerede frosset i dag");
      return;
    }
    toast.success(`Streak frosset i 24t ❄️`, { description: `${r.remaining} frys tilbage denne uge.` });
  };

  return (
    <Link
      to="/scan"
      className="k-card k-tap p-5 mb-5 bg-gradient-surface relative overflow-hidden block"
    >
      <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-gradient-primary opacity-20 blur-3xl" />
      <div className="relative flex items-center gap-4 mb-4">
        <div ref={flameRef} className="relative w-14 h-14 shrink-0">
          {streak > 0 && !frozenToday && (
            <>
              <div className="absolute inset-0 rounded-2xl bg-orange-500/50 blur-2xl animate-pulse" />
              <div className="absolute -inset-1 rounded-2xl bg-yellow-400/30 blur-xl" />
            </>
          )}
          <div
            className={
              "relative w-14 h-14 rounded-2xl flex items-center justify-center shadow-[0_8px_24px_-4px_rgba(249,115,22,0.6)] " +
              (frozenToday
                ? "bg-gradient-to-br from-sky-400 to-cyan-500"
                : "bg-gradient-to-br from-orange-500 via-orange-400 to-yellow-400")
            }
          >
            {frozenToday ? (
              <Snowflake className="w-7 h-7 text-white drop-shadow" />
            ) : (
              <Flame
                className="w-7 h-7 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)]"
                fill="url(#flameGrad)"
                strokeWidth={1.5}
              />
            )}
            {/* SVG gradient definition for the filled flame */}
            <svg width="0" height="0" className="absolute">
              <defs>
                <linearGradient id="flameGrad" x1="0" y1="1" x2="0" y2="0">
                  <stop offset="0%" stopColor="#f97316" />
                  <stop offset="60%" stopColor="#fb923c" />
                  <stop offset="100%" stopColor="#facc15" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1.5">
            <span className="text-4xl font-bold k-gradient-text leading-none">{streak}</span>
            <span className="text-xs uppercase tracking-widest text-muted-foreground">
              {streak === 1 ? t("streak.day") : t("streak.days")}
            </span>
          </div>
          <div className="font-semibold text-sm mt-1 truncate">{headline}</div>
          <div className="text-xs text-muted-foreground truncate">{sub}</div>
        </div>
        <button
          onClick={handleFreeze}
          disabled={freezesLeft <= 0 || frozenToday}
          className={
            "shrink-0 px-3 py-2 rounded-xl text-[11px] font-semibold flex flex-col items-center gap-0.5 transition " +
            (frozenToday
              ? "bg-sky-500/20 text-sky-300"
              : freezesLeft > 0
              ? "bg-card border border-border/60 hover:bg-surface-2"
              : "bg-surface-3 text-muted-foreground/60")
          }
        >
          <Snowflake className="w-3.5 h-3.5" />
          <span>Frys</span>
          <span className="text-[9px] opacity-70">{freezesLeft}/2</span>
        </button>
      </div>

      <div className="relative">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
          {t("streak.this_week")}
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {days.map((d, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div
                className={
                  "w-full aspect-square rounded-xl flex items-center justify-center transition-all " +
                  (d.frozen
                    ? "bg-gradient-to-br from-sky-400 to-cyan-500 shadow-[0_0_12px_-2px_hsl(200_100%_60%/0.6)]"
                    : d.done
                    ? "bg-gradient-primary shadow-glow"
                    : d.isToday
                    ? "bg-card border-2 border-dashed border-primary/50"
                    : "bg-surface-2 border border-border/40")
                }
              >
                {d.frozen ? (
                  <Snowflake className="w-3.5 h-3.5 text-white" />
                ) : (
                  <Flame
                    className={
                      "w-3.5 h-3.5 " +
                      (d.done
                        ? "text-white"
                        : d.isToday
                        ? "text-primary-glow"
                        : "text-muted-foreground/40")
                    }
                  />
                )}
              </div>
              <span
                className={
                  "text-[10px] font-medium " +
                  (d.isToday ? "text-primary-glow" : "text-muted-foreground")
                }
              >
                {d.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Link>
  );
}

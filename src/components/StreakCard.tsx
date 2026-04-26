import { Link } from "react-router-dom";
import { Flame } from "lucide-react";
import { useKStore } from "@/store/useKStore";
import { useT } from "@/i18n/useT";

export function StreakCard() {
  const t = useT();
  const { streak, lastActiveDate } = useKStore();
  const today = new Date().toISOString().slice(0, 10);
  const activeToday = lastActiveDate === today;

  // Build a 7-day rolling label of weekdays starting from 6 days ago
  const days: { label: string; done: boolean; isToday: boolean }[] = [];
  const dayLetters = ["S", "M", "T", "W", "T", "F", "S"];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const isToday = i === 0;
    // mark as done if within current streak window
    const done = streak > i || (isToday && activeToday);
    days.push({ label: dayLetters[d.getDay()], done, isToday });
  }

  const headline = streak > 0 ? t("streak.dont_break") : t("streak.start_today");
  const sub = streak > 0 ? t("streak.scan_to_grow") : t("scan.streak_sub");

  return (
    <Link
      to="/scan"
      className="k-card k-tap p-5 mb-5 bg-gradient-surface relative overflow-hidden block"
    >
      <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-gradient-primary opacity-20 blur-3xl" />
      <div className="relative flex items-center gap-4 mb-4">
        <div className="relative w-14 h-14 shrink-0">
          {streak > 0 && (
            <div className="absolute inset-0 rounded-2xl bg-gradient-primary opacity-40 blur-xl animate-pulse" />
          )}
          <div className="relative w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow">
            <Flame className="w-7 h-7 text-white drop-shadow" />
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
                  (d.done
                    ? "bg-gradient-primary shadow-glow"
                    : d.isToday
                    ? "bg-card border-2 border-dashed border-primary/50"
                    : "bg-surface-2 border border-border/40")
                }
              >
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

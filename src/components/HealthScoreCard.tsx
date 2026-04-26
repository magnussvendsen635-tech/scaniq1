import { useKStore, caloriesToday, macrosToday } from "@/store/useKStore";
import { useT } from "@/i18n/useT";
import { CheckCircle2, AlertCircle, XCircle, Sparkles } from "lucide-react";

type Verdict = "empty" | "healthy" | "ok" | "unhealthy";

function computeVerdict(args: {
  cal: number;
  protein: number;
  carbs: number;
  fat: number;
  targetCal: number;
  targetProtein: number;
}): Verdict {
  const { cal, protein, fat, targetCal, targetProtein } = args;
  if (cal <= 0) return "empty";

  let score = 0;
  // Protein ratio against target so far (scaled to share of day)
  const dayShare = Math.min(1, cal / Math.max(1, targetCal));
  const expectedProtein = targetProtein * dayShare;
  const proteinRatio = protein / Math.max(1, expectedProtein);
  if (proteinRatio >= 0.9) score += 2;
  else if (proteinRatio >= 0.6) score += 1;

  // Fat share of calories (good range 20-35%)
  const fatPct = (fat * 9) / Math.max(1, cal);
  if (fatPct >= 0.2 && fatPct <= 0.35) score += 2;
  else if (fatPct <= 0.45) score += 1;

  // Calorie overshoot
  if (cal <= targetCal * 1.05) score += 1;

  if (score >= 4) return "healthy";
  if (score >= 2) return "ok";
  return "unhealthy";
}

export function HealthScoreCard() {
  const t = useT();
  const { user, meals } = useKStore();
  const cal = caloriesToday(meals);
  const m = macrosToday(meals);
  const verdict = computeVerdict({
    cal,
    protein: m.protein,
    carbs: m.carbs,
    fat: m.fat,
    targetCal: user.calories,
    targetProtein: user.protein,
  });

  const map = {
    empty: { Icon: Sparkles, dot: "bg-muted", ring: "border-border/60", title: t("health.empty"), sub: t("health.empty_sub"), tone: "text-muted-foreground" },
    healthy: { Icon: CheckCircle2, dot: "bg-emerald-500", ring: "border-emerald-500/40", title: t("health.healthy"), sub: t("health.healthy_sub"), tone: "text-emerald-500" },
    ok: { Icon: AlertCircle, dot: "bg-amber-500", ring: "border-amber-500/40", title: t("health.ok"), sub: t("health.ok_sub"), tone: "text-amber-500" },
    unhealthy: { Icon: XCircle, dot: "bg-red-500", ring: "border-red-500/40", title: t("health.unhealthy"), sub: t("health.unhealthy_sub"), tone: "text-red-500" },
  } as const;

  const v = map[verdict];
  const Icon = v.Icon;

  return (
    <div className={`k-card p-4 mb-5 flex items-center gap-4 border ${v.ring}`}>
      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${v.dot}/15 bg-opacity-15`}>
        <Icon className={`w-5 h-5 ${v.tone}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{t("health.title")}</div>
        <div className="font-semibold text-sm truncate">{v.title}</div>
        <div className="text-xs text-muted-foreground truncate">{v.sub}</div>
      </div>
      <div className={`w-2.5 h-2.5 rounded-full ${v.dot} shadow-glow`} />
    </div>
  );
}

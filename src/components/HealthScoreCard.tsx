import { useState } from "react";
import { useKStore, caloriesToday, macrosToday } from "@/store/useKStore";
import { useT } from "@/i18n/useT";
import { CheckCircle2, AlertCircle, XCircle, Sparkles, ChevronRight, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

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
  const dayShare = Math.min(1, cal / Math.max(1, targetCal));
  const expectedProtein = targetProtein * dayShare;
  const proteinRatio = protein / Math.max(1, expectedProtein);
  if (proteinRatio >= 0.9) score += 2;
  else if (proteinRatio >= 0.6) score += 1;

  const fatPct = (fat * 9) / Math.max(1, cal);
  if (fatPct >= 0.2 && fatPct <= 0.35) score += 2;
  else if (fatPct <= 0.45) score += 1;

  if (cal <= targetCal * 1.05) score += 1;

  if (score >= 4) return "healthy";
  if (score >= 2) return "ok";
  return "unhealthy";
}

// 1-10 score + breakdown of what's good and what's lacking
function computeDetailedScore(args: {
  cal: number;
  protein: number;
  carbs: number;
  fat: number;
  targetCal: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
}) {
  const { cal, protein, carbs, fat, targetCal, targetProtein, targetCarbs, targetFat } = args;
  const dayShare = Math.min(1, cal / Math.max(1, targetCal));

  const expectedProtein = targetProtein * dayShare;
  const expectedCarbs = targetCarbs * dayShare;
  const expectedFat = targetFat * dayShare;

  const proteinRatio = protein / Math.max(1, expectedProtein);
  const carbsRatio = carbs / Math.max(1, expectedCarbs);
  const fatRatio = fat / Math.max(1, expectedFat);
  const calRatio = cal / Math.max(1, targetCal);
  const fatPct = (fat * 9) / Math.max(1, cal);

  // points out of 10
  let pts = 0;
  // protein 0-3
  if (proteinRatio >= 0.9 && proteinRatio <= 1.2) pts += 3;
  else if (proteinRatio >= 0.7) pts += 2;
  else if (proteinRatio >= 0.5) pts += 1;
  // fat balance 0-3
  if (fatPct >= 0.2 && fatPct <= 0.35) pts += 3;
  else if (fatPct >= 0.15 && fatPct <= 0.4) pts += 2;
  else if (fatPct <= 0.5) pts += 1;
  // carbs 0-2
  if (carbsRatio >= 0.7 && carbsRatio <= 1.2) pts += 2;
  else if (carbsRatio >= 0.5) pts += 1;
  // calories 0-2
  if (calRatio <= 1.05 && calRatio >= 0.6) pts += 2;
  else if (calRatio <= 1.2) pts += 1;

  const score = Math.max(1, Math.min(10, pts));

  type Status = "good" | "low" | "high";
  const items: { label: string; status: Status; detail: string }[] = [
    {
      label: "Protein",
      status: proteinRatio >= 0.9 ? (proteinRatio > 1.3 ? "high" : "good") : "low",
      detail: `${Math.round(protein)}g / ${Math.round(expectedProtein)}g`,
    },
    {
      label: "Carbs",
      status: carbsRatio >= 0.7 ? (carbsRatio > 1.3 ? "high" : "good") : "low",
      detail: `${Math.round(carbs)}g / ${Math.round(expectedCarbs)}g`,
    },
    {
      label: "Fat",
      status: fatPct >= 0.2 && fatPct <= 0.35 ? "good" : fatPct > 0.35 ? "high" : "low",
      detail: `${Math.round(fat)}g (${Math.round(fatPct * 100)}%)`,
    },
    {
      label: "Calories",
      status: calRatio >= 0.6 && calRatio <= 1.05 ? "good" : calRatio > 1.05 ? "high" : "low",
      detail: `${Math.round(cal)} / ${targetCal} kcal`,
    },
  ];

  return { score, items };
}

export function HealthScoreCard() {
  const t = useT();
  const [open, setOpen] = useState(false);
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
  const isEmpty = verdict === "empty";

  const detailed = !isEmpty
    ? computeDetailedScore({
        cal,
        protein: m.protein,
        carbs: m.carbs,
        fat: m.fat,
        targetCal: user.calories,
        targetProtein: user.protein,
        targetCarbs: user.carbs,
        targetFat: user.fat,
      })
    : null;

  const scoreTone =
    detailed && detailed.score >= 8 ? "text-emerald-500" : detailed && detailed.score >= 5 ? "text-amber-500" : "text-red-500";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`k-card k-tap p-4 mb-5 flex items-center gap-4 border w-full text-left ${v.ring}`}
        aria-label={t("health.title")}
      >
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${v.dot}/15 bg-opacity-15`}>
          <Icon className={`w-5 h-5 ${v.tone}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{t("health.title")}</div>
          <div className="font-semibold text-sm truncate">
            {isEmpty ? v.title : `${v.title} · ${detailed!.score}/10`}
          </div>
          <div className="text-xs text-muted-foreground truncate">{v.sub}</div>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("health.title")}</DialogTitle>
            <DialogDescription>
              {isEmpty ? v.sub : v.title}
            </DialogDescription>
          </DialogHeader>

          {isEmpty ? (
            <div className="py-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-muted/30 mx-auto flex items-center justify-center mb-3">
                <Sparkles className="w-7 h-7 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">{t("health.empty_sub")}</p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Score */}
              <div className="flex flex-col items-center py-3">
                <div className={`text-6xl font-semibold tracking-tight ${scoreTone}`}>
                  {detailed!.score}
                  <span className="text-2xl text-muted-foreground font-normal">/10</span>
                </div>
                <div className="mt-3 w-full h-2 bg-surface-3 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-primary transition-all"
                    style={{ width: `${detailed!.score * 10}%` }}
                  />
                </div>
              </div>

              {/* Breakdown */}
              <div className="space-y-2">
                {detailed!.items.map((it) => {
                  const StatusIcon = it.status === "good" ? CheckCircle2 : it.status === "low" ? TrendingDown : TrendingUp;
                  const tone =
                    it.status === "good" ? "text-emerald-500" : it.status === "low" ? "text-amber-500" : "text-red-500";
                  return (
                    <div key={it.label} className="flex items-center gap-3 p-3 rounded-xl bg-surface-2/40 border border-border/40">
                      <StatusIcon className={`w-5 h-5 shrink-0 ${tone}`} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">{it.label}</div>
                        <div className="text-xs text-muted-foreground">{it.detail}</div>
                      </div>
                      <div className={`text-[10px] uppercase tracking-widest font-semibold ${tone}`}>
                        {it.status === "good" ? "OK" : it.status === "low" ? "Low" : "High"}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Tips */}
              <div className="text-xs text-muted-foreground leading-relaxed bg-surface-2/30 rounded-xl p-3 border border-border/40 flex gap-2">
                <Minus className="w-3 h-3 mt-0.5 shrink-0" />
                <span>{v.sub}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

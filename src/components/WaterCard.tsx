import { useState } from "react";
import { Droplet, Plus, RotateCcw } from "lucide-react";
import { useKStore, waterToday } from "@/store/useKStore";
import { useT } from "@/i18n/useT";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const QUICK_AMOUNTS = [
  { ml: 250, labelKey: "water.glass" as const, icon: "🥛" },
  { ml: 500, labelKey: "water.bottle" as const, icon: "💧" },
  { ml: 750, labelKey: "water.large" as const, icon: "🍶" },
];

export function WaterCard() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const { water, waterGoal, addWater, resetWaterToday } = useKStore();
  const ml = waterToday(water);
  const pct = Math.min(100, (ml / Math.max(1, waterGoal)) * 100);
  const liters = (ml / 1000).toFixed(ml < 1000 ? 2 : 1);
  const goalL = (waterGoal / 1000).toFixed(1);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="k-card k-tap p-4 mb-5 w-full text-left flex items-center gap-4 border border-border/60"
        aria-label={t("water.title")}
      >
        <div className="relative w-11 h-11 rounded-2xl bg-sky-500/15 flex items-center justify-center overflow-hidden">
          <div
            className="absolute bottom-0 left-0 right-0 bg-sky-500/40 transition-all"
            style={{ height: `${pct}%` }}
          />
          <Droplet className="w-5 h-5 text-sky-500 relative" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{t("water.title")}</div>
          <div className="font-semibold text-sm">
            {liters}L <span className="text-muted-foreground font-normal">/ {goalL}L</span>
          </div>
          <div className="mt-1.5 h-1 bg-surface-3 rounded-full overflow-hidden">
            <div
              className="h-full bg-sky-500 rounded-full transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <Plus className="w-4 h-4 text-muted-foreground shrink-0" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Droplet className="w-5 h-5 text-sky-500" />
              {t("water.title")}
            </DialogTitle>
            <DialogDescription>{t("water.sub")}</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center py-3">
            <div className="text-5xl font-semibold tracking-tight text-sky-500">
              {liters}
              <span className="text-2xl text-muted-foreground font-normal">L</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {t("water.goal")}: {goalL}L · {Math.round(pct)}%
            </div>
            <div className="mt-4 w-full h-2 bg-surface-3 rounded-full overflow-hidden">
              <div
                className="h-full bg-sky-500 transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-2">
            {QUICK_AMOUNTS.map((q) => (
              <button
                key={q.ml}
                onClick={() => addWater(q.ml)}
                className="k-card k-tap p-4 flex flex-col items-center gap-1 border border-border/60 hover:border-sky-500/60 transition-colors"
              >
                <div className="text-2xl">{q.icon}</div>
                <div className="text-sm font-semibold">+{q.ml}ml</div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{t(q.labelKey)}</div>
              </button>
            ))}
          </div>

          <div className="flex gap-2 mt-2">
            <Button
              variant="outline"
              className="flex-1 h-11 rounded-xl"
              onClick={() => addWater(-250)}
              disabled={ml <= 0}
            >
              −250ml
            </Button>
            <Button
              variant="outline"
              className="flex-1 h-11 rounded-xl"
              onClick={resetWaterToday}
              disabled={ml <= 0}
            >
              <RotateCcw className="w-4 h-4 mr-1.5" />
              {t("water.reset")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

import { useState } from "react";
import { Activity, RefreshCw, Loader2 } from "lucide-react";
import { isHealthAvailable, requestHealthPermissions, readTodayHealth, healthPlatform } from "@/lib/health";
import { useKStore } from "@/store/useKStore";
import { toast } from "@/hooks/use-toast";
import { useT } from "@/i18n/useT";

export function HealthSyncCard() {
  const t = useT();
  const [loading, setLoading] = useState(false);
  const [snapshot, setSnapshot] = useState<{ steps?: number; cal?: number; weight?: number } | null>(null);
  const { logWeight, addWorkout } = useKStore();
  const platform = healthPlatform();
  const available = isHealthAvailable();

  const sync = async () => {
    setLoading(true);
    try {
      const ok = await requestHealthPermissions();
      if (!ok) {
        toast({ title: t("health.permission_denied"), description: t("health.enable_in_settings"), variant: "destructive" });
        return;
      }
      const data = await readTodayHealth();
      setSnapshot({ steps: data.steps, cal: data.caloriesBurned, weight: data.weightKg });
      if (data.weightKg && data.weightKg > 20 && data.weightKg < 300) logWeight(data.weightKg);
      if (data.caloriesBurned && data.caloriesBurned > 30) {
        addWorkout({
          id: crypto.randomUUID(),
          name: platform === "ios" ? "Apple Health" : "Google Fit",
          minutes: 0,
          caloriesBurned: data.caloriesBurned,
          at: Date.now(),
        });
      }
      toast({ title: t("health.synced"), description: `${data.steps ?? 0} ${t("health.steps")} · ${data.caloriesBurned ?? 0} kcal` });
    } catch (e: any) {
      toast({ title: t("health.sync_failed"), description: e?.message ?? t("health.try_again"), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (!available) {
    return (
      <div className="k-card p-4 mb-3 border border-border/40 bg-surface-2/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-surface-3 flex items-center justify-center">
            <Activity className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium">{t("health.unavailable_title")}</div>
            <div className="text-xs text-muted-foreground">{t("health.unavailable_sub")}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button onClick={sync} disabled={loading} className="k-card k-tap p-4 mb-3 border border-border/60 w-full text-left">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-primary/15 flex items-center justify-center">
          {loading ? <Loader2 className="w-5 h-5 text-primary animate-spin" /> : <Activity className="w-5 h-5 text-primary" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium">{platform === "ios" ? "Apple Health" : "Google Fit"}</div>
          <div className="text-xs text-muted-foreground">
            {snapshot ? `${snapshot.steps ?? 0} ${t("health.steps")} · ${snapshot.cal ?? 0} kcal` : t("health.tap_to_sync")}
          </div>
        </div>
        <RefreshCw className="w-4 h-4 text-muted-foreground" />
      </div>
    </button>
  );
}

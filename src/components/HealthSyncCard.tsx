import { useState, useEffect } from "react";
import { Activity, RefreshCw, Loader2 } from "lucide-react";
import { isHealthAvailable, requestHealthPermissions, readTodayHealth, healthPlatform } from "@/lib/health";
import { useKStore } from "@/store/useKStore";
import { toast } from "@/hooks/use-toast";

export function HealthSyncCard() {
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
        toast({ title: "Permission denied", description: "Enable health access in Settings.", variant: "destructive" });
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
      toast({ title: "Synced!", description: `${data.steps ?? 0} steps · ${data.caloriesBurned ?? 0} kcal burned` });
    } catch (e: any) {
      toast({ title: "Sync failed", description: e?.message ?? "Try again", variant: "destructive" });
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
            <div className="text-sm font-medium">Apple Health & Google Fit</div>
            <div className="text-xs text-muted-foreground">Available in the native app only.</div>
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
            {snapshot ? `${snapshot.steps ?? 0} steps · ${snapshot.cal ?? 0} kcal` : "Tap to sync today's data"}
          </div>
        </div>
        <RefreshCw className="w-4 h-4 text-muted-foreground" />
      </div>
    </button>
  );
}

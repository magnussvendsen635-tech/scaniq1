import { useEffect, useRef } from "react";
import { useKStore, waterToday } from "@/store/useKStore";
import { Bell, BellOff } from "lucide-react";
import { toast } from "sonner";

const STORAGE_KEY = "kcally-reminders-last";

export const RemindersCard = () => {
  const { reminders, setReminders, water, waterGoal, meals, weights } = useKStore();
  const intervalRef = useRef<number | null>(null);

  const enable = async () => {
    if (!("Notification" in window)) {
      toast.error("Notifications not supported on this device");
      return;
    }
    const perm = await Notification.requestPermission();
    if (perm !== "granted") {
      toast.error("Permission denied");
      return;
    }
    setReminders({ enabled: true });
    toast.success("Reminders enabled");
  };

  const disable = () => {
    setReminders({ enabled: false });
    toast.success("Reminders disabled");
  };

  // Reminder loop — runs while app is open
  useEffect(() => {
    if (!reminders.enabled) {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      return;
    }
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;

    const fire = (key: string, title: string, body: string) => {
      try {
        const last = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
        const todayKey = new Date().toISOString().slice(0, 10) + ":" + key;
        if (last[todayKey]) return;
        new Notification(title, { body, icon: "/favicon.ico" });
        last[todayKey] = Date.now();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(last));
      } catch {}
    };

    const check = () => {
      const now = new Date();
      const h = now.getHours();
      const todayDate = now.toISOString().slice(0, 10);

      // Water — every few hours during day if behind goal
      if (reminders.water && h >= 10 && h <= 21) {
        const drank = waterToday(water);
        const expected = (waterGoal * (h - 8)) / 12;
        if (drank < expected * 0.6 && (h === 11 || h === 14 || h === 17 || h === 20)) {
          fire(`water-${h}`, "💧 Time to hydrate", `You've had ${drank}ml today. Goal: ${waterGoal}ml.`);
        }
      }

      // Meals
      if (reminders.meals) {
        const todayMeals = meals.filter((m) => new Date(m.at).toISOString().slice(0, 10) === todayDate);
        const cats = new Set(todayMeals.map((m) => m.category));
        if (h >= 9 && h < 11 && !cats.has("breakfast")) fire("breakfast", "🌅 Don't forget breakfast", "Log your morning meal.");
        if (h >= 12 && h < 14 && !cats.has("lunch")) fire("lunch", "🍽️ Time for lunch?", "Log your lunch when you're done.");
        if (h >= 18 && h < 20 && !cats.has("dinner")) fire("dinner", "🍝 Don't forget dinner", "Log your evening meal.");
      }

      // Weight — once a week (Sunday morning)
      if (reminders.weight && now.getDay() === 0 && h === 9) {
        const lastWeigh = weights[0]?.at ?? 0;
        if (Date.now() - lastWeigh > 6 * 86400000) {
          fire("weight", "⚖️ Weekly weigh-in", "Time to log your weight and check progress.");
        }
      }
    };

    check();
    intervalRef.current = window.setInterval(check, 5 * 60 * 1000); // every 5 min
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [reminders, water, waterGoal, meals, weights]);

  return (
    <div className="k-card p-5 mb-4 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${reminders.enabled ? "bg-gradient-primary shadow-glow" : "bg-surface-3"}`}>
        {reminders.enabled ? <Bell className="w-5 h-5 text-foreground" /> : <BellOff className="w-5 h-5 text-muted-foreground" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold">Reminders</div>
        <div className="text-xs text-muted-foreground">
          {reminders.enabled ? "Water · meals · weekly weigh-in" : "Get nudged to log meals & drink water"}
        </div>
      </div>
      <button
        onClick={reminders.enabled ? disable : enable}
        className={`k-tap px-4 py-2 rounded-2xl text-sm font-semibold ${reminders.enabled ? "bg-card border border-border" : "bg-gradient-primary shadow-glow"}`}
      >
        {reminders.enabled ? "Off" : "Enable"}
      </button>
    </div>
  );
};

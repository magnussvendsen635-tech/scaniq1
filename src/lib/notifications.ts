// Native local notifications for ScanIQ
// Uses @capacitor/local-notifications on iOS/Android, no-ops on web.
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import type { Meal, MealCategory, ReminderSettings } from "@/store/useKStore";

const isNative = () => Capacitor.isNativePlatform();

const MOTIVATION = [
  "Stay consistent today 💪",
  "Small steps. Big results 🌱",
  "Your future self will thank you ✨",
];

const MEAL_COPY: Record<MealCategory, { title: string; body: string }> = {
  breakfast: { title: "Don't forget breakfast 🍳", body: "Log your morning meal in ScanIQ." },
  lunch:     { title: "Time to log your lunch 🍽️", body: "Snap a photo and stay on track." },
  dinner:    { title: "Dinner reminder 🍴", body: "Close out your day with a logged meal." },
  snack:     { title: "Snack time? 🥨", body: "Quick log keeps your streak alive." },
};

const WATER_TITLES = ["Time to hydrate 💧", "Sip break 💦", "Water check 💧"];

/** Ask once. Returns true if granted (or already granted), false otherwise. */
export async function ensurePermission(asked: boolean): Promise<boolean> {
  if (!isNative()) return false;
  if (asked) {
    const state = await LocalNotifications.checkPermissions();
    return state.display === "granted";
  }
  const req = await LocalNotifications.requestPermissions();
  return req.display === "granted";
}

function parseHM(s: string | undefined, fallback: [number, number]): [number, number] {
  if (!s) return fallback;
  const [h, m] = s.split(":").map((x) => parseInt(x, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return fallback;
  return [h, m];
}

function dateAt(h: number, m: number, dayOffset = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(h, m, 0, 0);
  return d;
}

/** Cancels everything we scheduled. */
export async function cancelAllScanIQ() {
  if (!isNative()) return;
  try {
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length) {
      await LocalNotifications.cancel({ notifications: pending.notifications.map((n) => ({ id: n.id })) });
    }
  } catch {}
}

/**
 * Reschedule all reminders based on current settings + today's logged meals.
 * Skips meal categories that are already logged today.
 */
export async function rescheduleReminders(opts: {
  reminders: ReminderSettings;
  meals: Meal[];
}) {
  if (!isNative()) return;
  await cancelAllScanIQ();
  const { reminders, meals } = opts;
  if (!reminders.enabled) return;

  const todayStr = new Date().toISOString().slice(0, 10);
  const loggedToday = new Set(
    meals.filter((m) => new Date(m.at).toISOString().slice(0, 10) === todayStr).map((m) => m.category),
  );

  const notifs: any[] = [];
  const now = Date.now();
  let id = 100;

  // Meal reminders — only if not yet logged today, otherwise schedule for tomorrow.
  if (reminders.meals) {
    const slots: { key: MealCategory; hm: [number, number] }[] = [
      { key: "breakfast", hm: parseHM(reminders.breakfastTime, [8, 0]) },
      { key: "lunch",     hm: parseHM(reminders.lunchTime,     [12, 30]) },
      { key: "dinner",    hm: parseHM(reminders.dinnerTime,    [18, 30]) },
    ];
    for (const s of slots) {
      const todayAt = dateAt(s.hm[0], s.hm[1], 0);
      const future = loggedToday.has(s.key) || todayAt.getTime() < now
        ? dateAt(s.hm[0], s.hm[1], 1) // tomorrow
        : todayAt;
      notifs.push({
        id: id++,
        title: MEAL_COPY[s.key].title,
        body: MEAL_COPY[s.key].body,
        schedule: { at: future, allowWhileIdle: true },
      });
    }
  }

  // Water reminders — repeat every N hours during waking window (08–21).
  if (reminders.water) {
    const every = reminders.waterEveryHours ?? 3;
    for (let h = 9; h <= 21; h += every) {
      const at = dateAt(h, 0, 0);
      const future = at.getTime() < now ? dateAt(h, 0, 1) : at;
      notifs.push({
        id: id++,
        title: WATER_TITLES[(h / every) | 0 % WATER_TITLES.length] || WATER_TITLES[0],
        body: "A quick sip keeps you on track.",
        schedule: { at: future, every: "day", allowWhileIdle: true },
      });
    }
  }

  // Daily motivation nudge — 1×/day, evening
  notifs.push({
    id: id++,
    title: MOTIVATION[new Date().getDate() % MOTIVATION.length],
    body: "Open ScanIQ to keep your streak going.",
    schedule: { at: dateAt(20, 30, dateAt(20, 30).getTime() < now ? 1 : 0), every: "day", allowWhileIdle: true },
  });

  if (notifs.length) {
    try {
      await LocalNotifications.schedule({ notifications: notifs });
    } catch (e) {
      console.warn("[notifications] schedule failed", e);
    }
  }
}

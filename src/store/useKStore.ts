import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Goal = "lose" | "gain" | "maintain";
export type Activity = "sedentary" | "light" | "moderate" | "active" | "athlete";
export type Pace = "aggressive" | "balanced" | "slow";
export type Frequency = "0-1" | "2-3" | "4+";
export type Diet = "none" | "high-protein" | "low-carb" | "vegetarian";
export type MealCategory = "breakfast" | "lunch" | "dinner" | "snack";

export interface Meal {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  healthScore: number;
  at: number; // timestamp
  category?: MealCategory;
  // Optional micronutrients (returned from AI scan)
  fiber?: number;
  sugar?: number;
  sodium?: number; // mg
  saturatedFat?: number;
  cholesterol?: number; // mg
}

export interface FavoriteMeal {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  healthScore: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  saturatedFat?: number;
  cholesterol?: number;
  addedAt: number;
}

export interface WorkoutLog {
  id: string;
  name: string;
  minutes: number;
  caloriesBurned: number;
  at: number;
}

export interface WeightEntry {
  weight: number;
  at: number; // timestamp
}

export interface UserProfile {
  name: string;
  age: number;
  weight: number; // kg
  targetWeight: number; // kg
  height: number; // cm
  goal: Goal;
  activity: Activity;
  pace: Pace;
  frequency: Frequency;
  diet: Diet;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface ReminderSettings {
  enabled: boolean;
  water: boolean;
  meals: boolean;
  weight: boolean;
  permissionAsked?: boolean;
  breakfastTime?: string; // "HH:mm"
  lunchTime?: string;
  dinnerTime?: string;
  waterEveryHours?: number;
}

interface KState {
  onboarded: boolean;
  language: string;
  user: UserProfile;
  meals: Meal[];
  workouts: WorkoutLog[];
  favorites: FavoriteMeal[];
  weights: WeightEntry[];
  reminders: ReminderSettings;
  streak: number;
  lastActiveDate: string; // YYYY-MM-DD
  // history per day for progress
  history: Record<string, { calories: number; weight: number }>;
  premium: boolean;
  avatar: string | null;
  water: Record<string, number>;
  waterGoal: number;
  autoAdjustGoal: boolean;
  frozenDays: Record<string, number>;

  setOnboarded: (v: boolean) => void;
  setLanguage: (code: string) => void;
  setAvatar: (dataUrl: string | null) => void;
  updateUser: (u: Partial<UserProfile>) => void;
  addMeal: (m: Meal) => void;
  removeMeal: (id: string) => void;
  addWorkout: (w: WorkoutLog) => void;
  resetDay: () => void;
  tickStreak: () => void;
  checkStreakExpiry: () => void;
  setPremium: (v: boolean) => void;
  addWater: (ml: number) => void;
  setWaterGoal: (ml: number) => void;
  resetWaterToday: () => void;
  addFavorite: (m: Omit<FavoriteMeal, "id" | "addedAt">) => void;
  removeFavorite: (id: string) => void;
  isFavorite: (name: string) => boolean;
  logWeight: (kg: number) => void;
  removeWeight: (at: number) => void;
  setReminders: (r: Partial<ReminderSettings>) => void;
  setAutoAdjustGoal: (v: boolean) => void;
  recomputePlan: () => void;
  freezeStreak: () => { ok: boolean; reason?: string; remaining: number };
  freezesLeftThisWeek: () => number;
}

// Local-timezone YYYY-MM-DD (so streak boundaries match the user's device day).
const today = (): string => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
const addDaysLocal = (dateStr: string, delta: number): string => {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + delta);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
};
const dayKey = (ts: number): string => {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const useKStore = create<KState>()(
  persist(
    (set, get) => ({
      onboarded: false,
      language: "en",
      user: {
        name: "",
        age: 28,
        weight: 75,
        targetWeight: 73,
        height: 175,
        goal: "lose",
        activity: "moderate",
        pace: "balanced",
        frequency: "2-3",
        diet: "none",
        calories: 2200,
        protein: 150,
        carbs: 220,
        fat: 70,
      },
      meals: [],
      workouts: [],
      favorites: [],
      weights: [],
      reminders: { enabled: false, water: true, meals: true, weight: true },
      streak: 0,
      lastActiveDate: "",
      history: {},
      premium: false,
      avatar: null,
      water: {},
      waterGoal: 2500,
      autoAdjustGoal: true,
      frozenDays: {},

      setOnboarded: (v) => set({ onboarded: v }),
      setLanguage: (code) => set({ language: code }),
      setAvatar: (dataUrl) => set({ avatar: dataUrl }),
      updateUser: (u) => set({ user: { ...get().user, ...u } }),
      addMeal: (m) => {
        const meals = [m, ...get().meals];
        set({ meals });
        get().tickStreak();
        const d = today();
        const dayCals = meals.filter((x) => dayKey(x.at) === d).reduce((a, b) => a + b.calories, 0);
        set({ history: { ...get().history, [d]: { calories: dayCals, weight: get().user.weight } } });
      },
      removeMeal: (id) => set({ meals: get().meals.filter((m) => m.id !== id) }),
      addWorkout: (w) => set({ workouts: [w, ...get().workouts] }),
      resetDay: () => {
        const d = today();
        const meals = get().meals.filter((m) => dayKey(m.at) !== d);
        const workouts = get().workouts.filter((m) => dayKey(m.at) !== d);
        set({ meals, workouts });
      },
      tickStreak: () => {
        const d = today();
        const last = get().lastActiveDate;
        if (last === d) return; // already counted today
        const frozen = get().frozenDays;
        const now = Date.now();
        // Walk back day-by-day from yesterday toward last active date.
        // Streak continues only if every intervening day is frozen-active.
        let continued = false;
        if (last) {
          let walker = addDaysLocal(d, -1);
          while (walker > last) {
            const f = frozen[walker];
            if (!f || f < now) break;
            walker = addDaysLocal(walker, -1);
          }
          if (walker === last) continued = true;
        }
        const prev = get().streak;
        const next = continued ? prev + 1 : 1;
        set({ streak: next, lastActiveDate: d });
      },
      checkStreakExpiry: () => {
        const d = today();
        const last = get().lastActiveDate;
        if (!last || last === d) return;
        const frozen = get().frozenDays;
        const now = Date.now();
        // Walk back from yesterday to last active date — every gap day must be frozen-active.
        let walker = addDaysLocal(d, -1);
        let bridged = true;
        while (walker > last) {
          const f = frozen[walker];
          if (!f || f < now) { bridged = false; break; }
          walker = addDaysLocal(walker, -1);
        }
        // If last < yesterday and not fully bridged → at least one full day missed → reset.
        if (!bridged && get().streak !== 0) {
          set({ streak: 0 });
        }
      },
      setPremium: (v) => set({ premium: v }),
      addWater: (ml) => {
        const d = today();
        const water = { ...get().water, [d]: Math.max(0, (get().water[d] ?? 0) + ml) };
        set({ water });
      },
      setWaterGoal: (ml) => set({ waterGoal: Math.max(500, Math.min(6000, ml)) }),
      resetWaterToday: () => {
        const d = today();
        const water = { ...get().water };
        delete water[d];
        set({ water });
      },
      addFavorite: (m) => {
        if (get().favorites.some((f) => f.name.toLowerCase() === m.name.toLowerCase())) return;
        const fav: FavoriteMeal = { ...m, id: crypto.randomUUID(), addedAt: Date.now() };
        set({ favorites: [fav, ...get().favorites] });
      },
      removeFavorite: (id) => set({ favorites: get().favorites.filter((f) => f.id !== id) }),
      isFavorite: (name) => get().favorites.some((f) => f.name.toLowerCase() === name.toLowerCase()),
      logWeight: (kg) => {
        const entry: WeightEntry = { weight: kg, at: Date.now() };
        const weights = [entry, ...get().weights];
        set({ weights, user: { ...get().user, weight: kg } });
        if (get().autoAdjustGoal) get().recomputePlan();
      },
      removeWeight: (at) => set({ weights: get().weights.filter((w) => w.at !== at) }),
      setReminders: (r) => set({ reminders: { ...get().reminders, ...r } }),
      setAutoAdjustGoal: (v) => set({ autoAdjustGoal: v }),
      recomputePlan: () => {
        const u = get().user;
        const plan = computePlan({ weight: u.weight, height: u.height, activity: u.activity, goal: u.goal });
        set({ user: { ...u, ...plan } });
      },
      freezesLeftThisWeek: () => {
        const weekStart = startOfISOWeek(new Date()).toISOString().slice(0, 10);
        const used = Object.keys(get().frozenDays).filter((d) => d >= weekStart).length;
        return Math.max(0, 2 - used);
      },
      freezeStreak: () => {
        const d = today();
        const frozen = { ...get().frozenDays };
        if (frozen[d] && frozen[d] > Date.now()) {
          return { ok: false, reason: "already_frozen", remaining: get().freezesLeftThisWeek() };
        }
        const left = get().freezesLeftThisWeek();
        if (left <= 0) return { ok: false, reason: "limit", remaining: 0 };
        frozen[d] = Date.now() + 24 * 60 * 60 * 1000;
        set({ frozenDays: frozen });
        return { ok: true, remaining: left - 1 };
      },
    }),
    { name: "kcally-store-v1" }
  )
);

function startOfISOWeek(d: Date): Date {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7; // Monday=0
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - day);
  return date;
}

// Helpers
export function caloriesToday(meals: Meal[]) {
  const d = today();
  return meals.filter((m) => dayKey(m.at) === d).reduce((a, b) => a + b.calories, 0);
}
export function macrosToday(meals: Meal[]) {
  const d = today();
  return meals
    .filter((m) => dayKey(m.at) === d)
    .reduce(
      (acc, m) => ({ protein: acc.protein + m.protein, carbs: acc.carbs + m.carbs, fat: acc.fat + m.fat }),
      { protein: 0, carbs: 0, fat: 0 }
    );
}
export function caloriesBurnedToday(workouts: WorkoutLog[]) {
  const d = today();
  return workouts.filter((w) => dayKey(w.at) === d).reduce((a, b) => a + b.caloriesBurned, 0);
}
export function waterToday(water: Record<string, number>) {
  const d = today();
  return water[d] ?? 0;
}
export function micronutrientsToday(meals: Meal[]) {
  const d = today();
  return meals
    .filter((m) => dayKey(m.at) === d)
    .reduce(
      (acc, m) => ({
        fiber: acc.fiber + (m.fiber ?? 0),
        sugar: acc.sugar + (m.sugar ?? 0),
        sodium: acc.sodium + (m.sodium ?? 0),
        saturatedFat: acc.saturatedFat + (m.saturatedFat ?? 0),
        cholesterol: acc.cholesterol + (m.cholesterol ?? 0),
      }),
      { fiber: 0, sugar: 0, sodium: 0, saturatedFat: 0, cholesterol: 0 }
    );
}

// Auto-detect meal category based on time of day
export function categoryForNow(d: Date = new Date()): MealCategory {
  const h = d.getHours();
  if (h < 10) return "breakfast";
  if (h < 14) return "lunch";
  if (h < 17) return "snack";
  if (h < 22) return "dinner";
  return "snack";
}

// Calculate calories from onboarding (Mifflin-St Jeor simplified, assume male 30y)
export function computePlan(p: { weight: number; height: number; activity: Activity; goal: Goal }) {
  const bmr = 10 * p.weight + 6.25 * p.height - 5 * 30 + 5;
  const factor = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, athlete: 1.9 }[p.activity];
  let cals = Math.round(bmr * factor);
  if (p.goal === "lose") cals -= 500;
  if (p.goal === "gain") cals += 350;
  cals = Math.max(1400, cals);
  const protein = Math.round(p.weight * 2);
  const fat = Math.round((cals * 0.25) / 9);
  const carbs = Math.round((cals - protein * 4 - fat * 9) / 4);
  return { calories: cals, protein, carbs, fat };
}

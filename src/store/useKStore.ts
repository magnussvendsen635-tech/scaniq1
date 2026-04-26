import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Goal = "lose" | "gain" | "maintain";
export type Activity = "sedentary" | "light" | "moderate" | "active" | "athlete";
export type Pace = "aggressive" | "balanced" | "slow";
export type Frequency = "0-1" | "2-3" | "4+";
export type Diet = "none" | "high-protein" | "low-carb" | "vegetarian";

export interface Meal {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  healthScore: number;
  at: number; // timestamp
}

export interface WorkoutLog {
  id: string;
  name: string;
  minutes: number;
  caloriesBurned: number;
  at: number;
}

export interface UserProfile {
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

interface KState {
  onboarded: boolean;
  user: UserProfile;
  meals: Meal[];
  workouts: WorkoutLog[];
  streak: number;
  lastActiveDate: string; // YYYY-MM-DD
  // history per day for progress
  history: Record<string, { calories: number; weight: number }>;
  premium: boolean;

  setOnboarded: (v: boolean) => void;
  updateUser: (u: Partial<UserProfile>) => void;
  addMeal: (m: Meal) => void;
  addWorkout: (w: WorkoutLog) => void;
  resetDay: () => void;
  tickStreak: () => void;
  setPremium: (v: boolean) => void;
}

const today = () => new Date().toISOString().slice(0, 10);

export const useKStore = create<KState>()(
  persist(
    (set, get) => ({
      onboarded: false,
      user: {
        age: 28,
        weight: 75,
        targetWeight: 70,
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
      streak: 0,
      lastActiveDate: "",
      history: {},
      premium: false,

      setOnboarded: (v) => set({ onboarded: v }),
      updateUser: (u) => set({ user: { ...get().user, ...u } }),
      addMeal: (m) => {
        const meals = [m, ...get().meals];
        set({ meals });
        get().tickStreak();
        // update history snapshot
        const d = today();
        const dayCals = meals.filter((x) => new Date(x.at).toISOString().slice(0, 10) === d).reduce((a, b) => a + b.calories, 0);
        set({ history: { ...get().history, [d]: { calories: dayCals, weight: get().user.weight } } });
      },
      addWorkout: (w) => set({ workouts: [w, ...get().workouts] }),
      resetDay: () => {
        const d = today();
        const meals = get().meals.filter((m) => new Date(m.at).toISOString().slice(0, 10) !== d);
        const workouts = get().workouts.filter((m) => new Date(m.at).toISOString().slice(0, 10) !== d);
        set({ meals, workouts });
      },
      tickStreak: () => {
        const d = today();
        const last = get().lastActiveDate;
        if (last === d) return;
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        let next: number;
        if (!last) next = 1; // first ever
        else if (last === yesterday) next = get().streak + 1; // continued
        else next = 1; // missed a day -> reset
        set({ streak: next, lastActiveDate: d });
      },
      setPremium: (v) => set({ premium: v }),
    }),
    { name: "kcally-store-v1" }
  )
);

// Helpers
export function caloriesToday(meals: Meal[]) {
  const d = today();
  return meals.filter((m) => new Date(m.at).toISOString().slice(0, 10) === d).reduce((a, b) => a + b.calories, 0);
}
export function macrosToday(meals: Meal[]) {
  const d = today();
  return meals
    .filter((m) => new Date(m.at).toISOString().slice(0, 10) === d)
    .reduce(
      (acc, m) => ({ protein: acc.protein + m.protein, carbs: acc.carbs + m.carbs, fat: acc.fat + m.fat }),
      { protein: 0, carbs: 0, fat: 0 }
    );
}
export function caloriesBurnedToday(workouts: WorkoutLog[]) {
  const d = today();
  return workouts.filter((w) => new Date(w.at).toISOString().slice(0, 10) === d).reduce((a, b) => a + b.caloriesBurned, 0);
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

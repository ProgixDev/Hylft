import { Platform } from "react-native";
import { supabase } from "./supabase";

const API_BASE = __DEV__
  ? Platform.OS === "android"
    ? "http://10.0.2.2:3000/api"
    : "http://localhost:3000/api"
  : "https://your-production-url.com/api";

async function authFetch(path: string, options: RequestInit = {}) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `API error ${res.status}`);
  }
  return res.json();
}

export const api = {
  // ── Users ────────────────────────────────────────────────
  getProfile: () => authFetch("/users/me"),
  createProfile: (data: Record<string, unknown>) =>
    authFetch("/users/me", { method: "POST", body: JSON.stringify(data) }),
  updateProfile: (data: Record<string, unknown>) =>
    authFetch("/users/me", { method: "PATCH", body: JSON.stringify(data) }),
  completeOnboarding: (data: Record<string, unknown>) =>
    authFetch("/users/me/onboarding", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // ── Nutrition ────────────────────────────────────────────
  getMeals: (date: string) =>
    authFetch(`/nutrition/meals?date=${date}`),
  getMealsRange: (start: string, end: string) =>
    authFetch(`/nutrition/meals/range?start=${start}&end=${end}`),
  addMeal: (data: Record<string, unknown>) =>
    authFetch("/nutrition/meals", { method: "POST", body: JSON.stringify(data) }),
  deleteMeal: (id: string) =>
    authFetch(`/nutrition/meals/${id}`, { method: "DELETE" }),
  getDailySummary: (date: string) =>
    authFetch(`/nutrition/summary/daily?date=${date}`),
  getWeeklySummary: (start: string, end: string) =>
    authFetch(`/nutrition/summary/weekly?start=${start}&end=${end}`),
  getNutritionGoals: () =>
    authFetch("/nutrition/goals"),
  updateNutritionGoals: (data: Record<string, unknown>) =>
    authFetch("/nutrition/goals", { method: "PATCH", body: JSON.stringify(data) }),
  getCustomFoods: () =>
    authFetch("/nutrition/custom-foods"),
  createCustomFood: (data: Record<string, unknown>) =>
    authFetch("/nutrition/custom-foods", { method: "POST", body: JSON.stringify(data) }),
  deleteCustomFood: (id: string) =>
    authFetch(`/nutrition/custom-foods/${id}`, { method: "DELETE" }),

  // ── Health ───────────────────────────────────────────────
  getHealthSnapshot: (date: string) =>
    authFetch(`/health/snapshots?date=${date}`),
  getHealthSnapshotsRange: (start: string, end: string) =>
    authFetch(`/health/snapshots/range?start=${start}&end=${end}`),
  upsertHealthSnapshot: (data: Record<string, unknown>) =>
    authFetch("/health/snapshots", { method: "POST", body: JSON.stringify(data) }),
  getWorkouts: (date: string) =>
    authFetch(`/health/workouts?date=${date}`),
  getWorkoutsRange: (start: string, end: string) =>
    authFetch(`/health/workouts/range?start=${start}&end=${end}`),
  addWorkout: (data: Record<string, unknown>) =>
    authFetch("/health/workouts", { method: "POST", body: JSON.stringify(data) }),
  deleteWorkout: (id: string) =>
    authFetch(`/health/workouts/${id}`, { method: "DELETE" }),
};

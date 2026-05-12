import { Platform } from "react-native";
import { supabase } from "./supabase";
import { getFoodByCodeOFF, searchFoodsOFF } from "./openFoodFactsApi";

// Primary source: EXPO_PUBLIC_API_BASE_URL from `.env` (Expo injects this at
// build time). When unset, fall back to sensible dev/prod defaults so the
// app still works without a local .env file.
const ENV_BASE = process.env.EXPO_PUBLIC_API_BASE_URL;
const DEFAULT_DEV_BASE =
  Platform.OS === "android"
    ? "http://10.0.2.2:3000/api"
    : "http://localhost:3000/api";
const DEFAULT_PROD_BASE = "https://hylft2-0.onrender.com/api";

const API_BASE =
  ENV_BASE && ENV_BASE.length > 0
    ? ENV_BASE
    : __DEV__
      ? DEFAULT_DEV_BASE
      : DEFAULT_PROD_BASE;

async function authFetch(path: string, options: RequestInit = {}) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${session.access_token}`);
  if (options.body) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
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
  getPublicProfile: (userId: string) => authFetch(`/users/${userId}`),
  getUserStats: (userId: string) => authFetch(`/users/${userId}/stats`),
  searchUsers: (q: string, limit = 20) => {
    const qs = new URLSearchParams({ q, limit: String(limit) });
    return authFetch(`/users/search?${qs.toString()}`);
  },
  signAvatarUpload: (data: { ext?: string } = {}) =>
    authFetch("/users/me/avatar/sign-upload", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  deleteAvatar: () =>
    authFetch("/users/me/avatar", { method: "DELETE" }),

  // ── Nutrition / Alimentation ────────────────────────────
  // Food search and detail lookup hit Open Food Facts directly from the
  // device — no auth needed, one less hop than going through our server.
  searchFood: (
    q: string,
    lang: "fr" | "en" = "fr",
    page = 0,
    pageSize = 20,
  ) => searchFoodsOFF(q, lang, page, pageSize),
  getFoodDetails: (id: string) => getFoodByCodeOFF(id, "fr"),
  getFoodHistory: (limit = 20) =>
    authFetch(`/nutrition/food-history?limit=${limit}`),
  recordFoodSelection: (data: {
    food_id: string;
    food_name: string;
    image_url?: string;
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  }) =>
    authFetch("/nutrition/food-history", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getMeals: (date: string) =>
    authFetch(`/nutrition/meals?date=${date}`),
  addMeal: (data: Record<string, unknown>) =>
    authFetch("/nutrition/meals", { method: "POST", body: JSON.stringify(data) }),
  deleteMeal: (id: string) =>
    authFetch(`/nutrition/meals/${id}`, { method: "DELETE" }),
  getAlimentationDaily: (date: string) =>
    authFetch(`/nutrition/daily?date=${date}`),
  upsertAlimentationDaily: (data: {
    date: string;
    water_ml?: number;
    weight_kg?: number;
    notes?: string;
  }) =>
    authFetch("/nutrition/daily", { method: "PUT", body: JSON.stringify(data) }),
  getDailySummary: (date: string) =>
    authFetch(`/nutrition/summary?date=${date}`),
  getAlimentationHistory: (start: string, end: string) =>
    authFetch(`/nutrition/history?start=${start}&end=${end}`),
  getNutritionGoals: () => authFetch("/nutrition/goals"),
  updateNutritionGoals: (data: Record<string, unknown>) =>
    authFetch("/nutrition/goals", { method: "PATCH", body: JSON.stringify(data) }),

  // ── Routines ─────────────────────────────────────────────
  getRoutines: () =>
    authFetch("/routines"),
  getAdminRoutines: (params: {
    category?: "challenge" | "body_focus";
    sub_category?: string;
  } = {}) => {
    const qs = new URLSearchParams();
    if (params.category) qs.set("category", params.category);
    if (params.sub_category) qs.set("sub_category", params.sub_category);
    const s = qs.toString();
    return authFetch(`/routines/admin/library${s ? `?${s}` : ""}`);
  },
  getRoutine: (id: string) =>
    authFetch(`/routines/${id}`),
  createRoutine: (data: Record<string, unknown>) =>
    authFetch("/routines", { method: "POST", body: JSON.stringify(data) }),
  updateRoutine: (id: string, data: Record<string, unknown>) =>
    authFetch(`/routines/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteRoutine: (id: string) =>
    authFetch(`/routines/${id}`, { method: "DELETE" }),
  incrementRoutineCompleted: (id: string) =>
    authFetch(`/routines/${id}/completed`, { method: "POST" }),

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
  getWorkoutsHistory: (limit = 20, before?: string | null) => {
    const qs = new URLSearchParams({ limit: String(limit) });
    if (before) qs.set("before", before);
    return authFetch(`/health/workouts/history?${qs.toString()}`);
  },
  getWorkoutDetail: (id: string) => authFetch(`/health/workouts/${id}`),
  addWorkout: (data: Record<string, unknown>) =>
    authFetch("/health/workouts", { method: "POST", body: JSON.stringify(data) }),
  deleteWorkout: (id: string) =>
    authFetch(`/health/workouts/${id}`, { method: "DELETE" }),

  // ── Social / Follows ────────────────────────────────────
  follow: (userId: string) =>
    authFetch(`/follows/${userId}`, { method: "POST" }),
  unfollow: (userId: string) =>
    authFetch(`/follows/${userId}`, { method: "DELETE" }),
  getFollowStats: (userId: string) =>
    authFetch(`/follows/${userId}/stats`),
  listFollowers: (userId: string, cursor?: string, limit?: number) => {
    const qs = new URLSearchParams();
    if (cursor) qs.set("cursor", cursor);
    if (limit) qs.set("limit", String(limit));
    const s = qs.toString();
    return authFetch(`/follows/${userId}/followers${s ? `?${s}` : ""}`);
  },
  listFollowing: (userId: string, cursor?: string, limit?: number) => {
    const qs = new URLSearchParams();
    if (cursor) qs.set("cursor", cursor);
    if (limit) qs.set("limit", String(limit));
    const s = qs.toString();
    return authFetch(`/follows/${userId}/following${s ? `?${s}` : ""}`);
  },
  isFollowing: (userId: string) =>
    authFetch(`/follows/${userId}/is-following`),
  listIncomingFollowRequests: () =>
    authFetch("/follow-requests/incoming"),
  acceptFollowRequest: (requesterId: string) =>
    authFetch(`/follow-requests/${requesterId}/accept`, { method: "POST" }),
  rejectFollowRequest: (requesterId: string) =>
    authFetch(`/follow-requests/${requesterId}/reject`, { method: "POST" }),
  cancelOutgoingFollowRequest: (targetId: string) =>
    authFetch(`/follow-requests/outgoing/${targetId}`, { method: "DELETE" }),

  // ── Weight history ──────────────────────────────────────
  listWeightEntries: (params: {
    start?: string;
    end?: string;
    limit?: number;
  } = {}) => {
    const qs = new URLSearchParams();
    if (params.start) qs.set("start", params.start);
    if (params.end) qs.set("end", params.end);
    if (params.limit) qs.set("limit", String(params.limit));
    const s = qs.toString();
    return authFetch(`/weight${s ? `?${s}` : ""}`);
  },
  upsertWeightEntry: (data: {
    entry_date: string;
    weight_kg: number;
    note?: string;
  }) =>
    authFetch("/weight", { method: "POST", body: JSON.stringify(data) }),
  deleteWeightEntry: (date: string) =>
    authFetch(`/weight/${date}`, { method: "DELETE" }),

  // ── Notifications ───────────────────────────────────────
  listNotifications: (params: {
    unread?: boolean;
    limit?: number;
    cursor?: string;
  } = {}) => {
    const qs = new URLSearchParams();
    if (params.unread) qs.set("unread", "true");
    if (params.limit) qs.set("limit", String(params.limit));
    if (params.cursor) qs.set("cursor", params.cursor);
    const s = qs.toString();
    return authFetch(`/notifications${s ? `?${s}` : ""}`);
  },
  getUnreadNotificationsCount: () =>
    authFetch("/notifications/unread-count"),
  markNotificationRead: (id: string) =>
    authFetch(`/notifications/${id}/read`, { method: "POST" }),
  markAllNotificationsRead: () =>
    authFetch("/notifications/read-all", { method: "POST" }),
  deleteNotification: (id: string) =>
    authFetch(`/notifications/${id}`, { method: "DELETE" }),

  // ── Exercises catalog ───────────────────────────────────
  listExercises: (params: {
    body_part?: string;
    equipment?: string;
    difficulty?: "beginner" | "intermediate" | "advanced";
    search?: string;
    limit?: number;
    cursor?: string;
  } = {}) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null) qs.set(k, String(v));
    }
    const s = qs.toString();
    return authFetch(`/exercises${s ? `?${s}` : ""}`);
  },
  getExerciseBodyParts: () => authFetch("/exercises/body-parts"),
  getExerciseEquipments: () => authFetch("/exercises/equipments"),
  getExerciseById: (id: string) => authFetch(`/exercises/${id}`),
  getExerciseByExternalId: (externalId: string) =>
    authFetch(`/exercises/external/${externalId}`),
};

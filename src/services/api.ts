import { Platform } from "react-native";
import { supabase } from "./supabase";

const API_BASE = __DEV__
  ? Platform.OS === "android"
    ? "http://10.0.2.2:3000/api"
    : "http://localhost:3000/api"
  : "https://hylft2-0.onrender.com/api";

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

  // ── Routines ─────────────────────────────────────────────
  getRoutines: () =>
    authFetch("/routines"),
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
  addWorkout: (data: Record<string, unknown>) =>
    authFetch("/health/workouts", { method: "POST", body: JSON.stringify(data) }),
  deleteWorkout: (id: string) =>
    authFetch(`/health/workouts/${id}`, { method: "DELETE" }),

  // ── Feed / Posts ─────────────────────────────────────────
  listPosts: (params: {
    scope?: "timeline" | "author";
    author_id?: string;
    limit?: number;
    cursor?: string;
  } = {}) => {
    const qs = new URLSearchParams();
    if (params.scope) qs.set("scope", params.scope);
    if (params.author_id) qs.set("author_id", params.author_id);
    if (params.limit) qs.set("limit", String(params.limit));
    if (params.cursor) qs.set("cursor", params.cursor);
    const s = qs.toString();
    return authFetch(`/posts${s ? `?${s}` : ""}`);
  },
  getPost: (id: string) => authFetch(`/posts/${id}`),
  createPost: (data: Record<string, unknown>) =>
    authFetch("/posts", { method: "POST", body: JSON.stringify(data) }),
  updatePost: (id: string, data: Record<string, unknown>) =>
    authFetch(`/posts/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deletePost: (id: string) =>
    authFetch(`/posts/${id}`, { method: "DELETE" }),
  likePost: (id: string) =>
    authFetch(`/posts/${id}/like`, { method: "POST" }),
  unlikePost: (id: string) =>
    authFetch(`/posts/${id}/like`, { method: "DELETE" }),
  signPostMediaUpload: (data: { count: number; ext?: string }) =>
    authFetch("/posts/media/sign-upload", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // ── Comments ─────────────────────────────────────────────
  listComments: (postId: string) =>
    authFetch(`/posts/${postId}/comments`),
  createComment: (postId: string, data: Record<string, unknown>) =>
    authFetch(`/posts/${postId}/comments`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateComment: (id: string, data: Record<string, unknown>) =>
    authFetch(`/comments/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteComment: (id: string) =>
    authFetch(`/comments/${id}`, { method: "DELETE" }),
  likeComment: (id: string) =>
    authFetch(`/comments/${id}/like`, { method: "POST" }),
  unlikeComment: (id: string) =>
    authFetch(`/comments/${id}/like`, { method: "DELETE" }),

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

  // ── Schedule ─────────────────────────────────────────────
  getSchedule: () => authFetch("/schedule"),
  upsertScheduleAssignment: (
    dayOfWeek: number,
    data: { is_rest_day: boolean; routine_id?: string | null },
  ) =>
    authFetch(`/schedule/${dayOfWeek}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteScheduleAssignment: (dayOfWeek: number) =>
    authFetch(`/schedule/${dayOfWeek}`, { method: "DELETE" }),

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

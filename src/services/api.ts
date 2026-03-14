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
};

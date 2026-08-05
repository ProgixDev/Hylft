/**
 * HealthContext
 * Provides device health data (steps, calories burned, workouts)
 * from Health Connect (Android) or Apple HealthKit (iOS).
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api } from "../services/api";
import {
  DailyCaloriesBurned,
  DailySteps,
  HealthService,
  WorkoutSession,
} from "../services/healthService";

interface ServerWorkout {
  id: string;
  date: string;
  duration_minutes: number;
  calories_burned: number;
  source?: string;
  name?: string;
}

interface DailyHealthSnapshot {
  steps: number;
  calories_burned: number;
  active_minutes: number;
  distance_km?: number;
  water_ml?: number;
}

// ── Types ──────────────────────────────────────────────────────────────────
interface HealthContextType {
  // State
  isAvailable: boolean;
  isPermissionGranted: boolean;
  isLoading: boolean;

  // Today's data (from device health platform)
  todaySteps: number;
  todayCaloriesBurned: number;
  todayWorkouts: WorkoutSession[];

  // Today's data (from server)
  todayServerWorkouts: ServerWorkout[];
  todayServerSnapshot: DailyHealthSnapshot | null;
  /** kcal burned today from manually-logged workouts on server */
  todayManualCalories: number;
  /** Active minutes today: max(server snapshot, sum of server workouts) */
  todayActiveMinutes: number;

  // Weekly data
  weeklySteps: DailySteps[];
  weeklyCaloriesBurned: DailyCaloriesBurned[];
  weeklyWorkouts: WorkoutSession[];

  // Actions
  initialize: () => Promise<boolean>;
  requestPermissions: () => Promise<boolean>;
  refreshData: () => Promise<void>;
  refreshToday: () => Promise<void>;
}

const STORAGE_KEYS = {
  isEnabled: "@hylift_health_enabled",
  todayCache: "@hylift_health_today",
  weekCache: "@hylift_health_week",
};

const HealthContext = createContext<HealthContextType | undefined>(undefined);

// ── Helpers ────────────────────────────────────────────────────────────────
function getWeekRange(): { start: Date; end: Date } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((day + 6) % 7));

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return { start: monday, end: sunday };
}

function getTodayRange(): { start: Date; end: Date } {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  return { start, end };
}

// ── Provider ───────────────────────────────────────────────────────────────
export function HealthProvider({ children }: { children: React.ReactNode }) {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isPermissionGranted, setIsPermissionGranted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [todaySteps, setTodaySteps] = useState(0);
  const [todayCaloriesBurned, setTodayCaloriesBurned] = useState(0);
  const [todayWorkouts, setTodayWorkouts] = useState<WorkoutSession[]>([]);
  const [todayServerWorkouts, setTodayServerWorkouts] = useState<ServerWorkout[]>([]);
  const [todayServerSnapshot, setTodayServerSnapshot] =
    useState<DailyHealthSnapshot | null>(null);

  const [weeklySteps, setWeeklySteps] = useState<DailySteps[]>([]);
  const [weeklyCaloriesBurned, setWeeklyCaloriesBurned] = useState<
    DailyCaloriesBurned[]
  >([]);
  const [weeklyWorkouts, setWeeklyWorkouts] = useState<WorkoutSession[]>([]);

  // ── Load cached data on mount ──────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const [todayCache, weekCache] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.todayCache),
          AsyncStorage.getItem(STORAGE_KEYS.weekCache),
        ]);

        if (todayCache) {
          const parsed = JSON.parse(todayCache);
          // Only use cache if it's from today
          const cachedDate = parsed.date;
          const todayStr = new Date().toISOString().split("T")[0];
          if (cachedDate === todayStr) {
            setTodaySteps(parsed.steps ?? 0);
            setTodayCaloriesBurned(parsed.caloriesBurned ?? 0);
            setTodayWorkouts(parsed.workouts ?? []);
          }
        }

        if (weekCache) {
          const parsed = JSON.parse(weekCache);
          setWeeklySteps(parsed.steps ?? []);
          setWeeklyCaloriesBurned(parsed.caloriesBurned ?? []);
          setWeeklyWorkouts(parsed.workouts ?? []);
        }

        // Check if health was previously enabled
        const wasEnabled = await AsyncStorage.getItem(STORAGE_KEYS.isEnabled);
        if (wasEnabled === "true") {
          const available = await HealthService.init();
          setIsAvailable(available);
          setIsPermissionGranted(available);
        }
      } catch (error) {
        console.warn("[HealthContext] Cache load failed:", error);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // ── Initialize health platform ─────────────────────────────────────────
  const initialize = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      const available = await HealthService.init();
      setIsAvailable(available);

      if (available) {
        await AsyncStorage.setItem(STORAGE_KEYS.isEnabled, "true");
      }

      return available;
    } catch (error) {
      console.warn("[HealthContext] Init failed:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Request permissions ────────────────────────────────────────────────
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      const result = await HealthService.requestPermissions();
      setIsPermissionGranted(result.granted);
      return result.granted;
    } catch (error) {
      console.warn("[HealthContext] Permission request failed:", error);
      return false;
    }
  }, []);

  // ── Fetch today's server data (workouts + snapshot) ───────────────────
  const refreshServerToday = useCallback(async () => {
    const todayStr = new Date().toISOString().split("T")[0];
    try {
      const [workoutsRes, snapshotRes] = await Promise.allSettled([
        api.getWorkouts(todayStr),
        api.getHealthSnapshot(todayStr),
      ]);
      if (workoutsRes.status === "fulfilled") {
        const list = Array.isArray(workoutsRes.value)
          ? (workoutsRes.value as ServerWorkout[])
          : ((workoutsRes.value as any)?.items as ServerWorkout[]) ?? [];
        setTodayServerWorkouts(list);
      }
      if (snapshotRes.status === "fulfilled" && snapshotRes.value) {
        setTodayServerSnapshot(snapshotRes.value as DailyHealthSnapshot);
      }
    } catch (error) {
      console.warn("[HealthContext] Server today refresh failed:", error);
    }
  }, []);

  // ── Refresh today's data from device + server ────────────────────────
  const refreshToday = useCallback(async () => {
    // Always refresh server-side today data, regardless of HC/HK permission
    await refreshServerToday();

    if (!isAvailable || !isPermissionGranted) return;

    try {
      const { start, end } = getTodayRange();

      const [steps, calories, workouts] = await Promise.all([
        HealthService.getSteps(start, end),
        HealthService.getCaloriesBurned(start, end),
        HealthService.getWorkouts(start, end),
      ]);

      const totalSteps = steps.reduce((s, d) => s + d.count, 0);
      const totalCalories = calories.reduce(
        (s, d) => s + d.totalCalories,
        0
      );
      const activeMinutes = workouts.reduce(
        (m, w) => m + (w.durationMinutes || 0),
        0
      );

      setTodaySteps(totalSteps);
      setTodayCaloriesBurned(totalCalories);
      setTodayWorkouts(workouts);

      // Persist to server snapshot so /health/snapshots stays current.
      const todayStr = new Date().toISOString().split("T")[0];
      try {
        await api.upsertHealthSnapshot({
          date: todayStr,
          steps: totalSteps,
          calories_burned: Math.round(totalCalories),
          active_minutes: activeMinutes,
        });
        setTodayServerSnapshot((prev) => ({
          ...(prev || { steps: 0, calories_burned: 0, active_minutes: 0 }),
          steps: totalSteps,
          calories_burned: Math.round(totalCalories),
          active_minutes: activeMinutes,
        }));
      } catch (e) {
        console.warn("[HealthContext] Snapshot upsert failed:", e);
      }

      // Cache
      AsyncStorage.setItem(
        STORAGE_KEYS.todayCache,
        JSON.stringify({
          date: todayStr,
          steps: totalSteps,
          caloriesBurned: totalCalories,
          workouts,
        })
      );
    } catch (error) {
      console.warn("[HealthContext] Refresh today failed:", error);
    }
  }, [isAvailable, isPermissionGranted, refreshServerToday]);

  // ── Refresh full week data ─────────────────────────────────────────────
  const refreshData = useCallback(async () => {
    if (!isAvailable || !isPermissionGranted) return;

    try {
      setIsLoading(true);
      const { start, end } = getWeekRange();

      const [steps, calories, workouts] = await Promise.all([
        HealthService.getSteps(start, end),
        HealthService.getCaloriesBurned(start, end),
        HealthService.getWorkouts(start, end),
      ]);

      setWeeklySteps(steps);
      setWeeklyCaloriesBurned(calories);
      setWeeklyWorkouts(workouts);

      // Cache
      AsyncStorage.setItem(
        STORAGE_KEYS.weekCache,
        JSON.stringify({
          steps,
          caloriesBurned: calories,
          workouts,
        })
      );

      // Also refresh today
      await refreshToday();
    } catch (error) {
      console.warn("[HealthContext] Refresh data failed:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isAvailable, isPermissionGranted, refreshToday]);

  // ── Auto-refresh when permissions are granted ──────────────────────────
  useEffect(() => {
    if (isAvailable && isPermissionGranted) {
      refreshData();
    }
  }, [isAvailable, isPermissionGranted, refreshData]);

  // ── Fetch server-side today data on mount (works without HC/HK) ───────
  useEffect(() => {
    void refreshServerToday();
  }, [refreshServerToday]);

  // ── Derived: manual workout calories + active minutes today ───────────
  const todayManualCalories = useMemo(() => {
    return todayServerWorkouts.reduce(
      (sum, w) => sum + (w.calories_burned || 0),
      0,
    );
  }, [todayServerWorkouts]);

  const todayActiveMinutes = useMemo(() => {
    const fromServerWorkouts = todayServerWorkouts.reduce(
      (m, w) => m + (w.duration_minutes || 0),
      0,
    );
    const fromDeviceWorkouts = todayWorkouts.reduce(
      (m, w) => m + (w.durationMinutes || 0),
      0,
    );
    const fromSnapshot = todayServerSnapshot?.active_minutes || 0;
    return Math.max(fromServerWorkouts, fromDeviceWorkouts, fromSnapshot);
  }, [todayServerWorkouts, todayWorkouts, todayServerSnapshot]);

  const value = useMemo(
    () => ({
      isAvailable,
      isPermissionGranted,
      isLoading,
      todaySteps,
      todayCaloriesBurned,
      todayWorkouts,
      todayServerWorkouts,
      todayServerSnapshot,
      todayManualCalories,
      todayActiveMinutes,
      weeklySteps,
      weeklyCaloriesBurned,
      weeklyWorkouts,
      initialize,
      requestPermissions,
      refreshData,
      refreshToday,
    }),
    [
      isAvailable,
      isPermissionGranted,
      isLoading,
      todaySteps,
      todayCaloriesBurned,
      todayWorkouts,
      todayServerWorkouts,
      todayServerSnapshot,
      todayManualCalories,
      todayActiveMinutes,
      weeklySteps,
      weeklyCaloriesBurned,
      weeklyWorkouts,
      initialize,
      requestPermissions,
      refreshData,
      refreshToday,
    ]
  );

  return (
    <HealthContext.Provider value={value}>{children}</HealthContext.Provider>
  );
}

export function useHealth() {
  const context = useContext(HealthContext);
  if (!context) {
    throw new Error("useHealth must be used within HealthProvider");
  }
  return context;
}

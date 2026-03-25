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
import {
  DailyCaloriesBurned,
  DailySteps,
  HealthService,
  WorkoutSession,
} from "../services/healthService";

// ── Types ──────────────────────────────────────────────────────────────────
interface HealthContextType {
  // State
  isAvailable: boolean;
  isPermissionGranted: boolean;
  isLoading: boolean;

  // Today's data
  todaySteps: number;
  todayCaloriesBurned: number;
  todayWorkouts: WorkoutSession[];

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

  // ── Refresh today's data ───────────────────────────────────────────────
  const refreshToday = useCallback(async () => {
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

      setTodaySteps(totalSteps);
      setTodayCaloriesBurned(totalCalories);
      setTodayWorkouts(workouts);

      // Cache
      const todayStr = new Date().toISOString().split("T")[0];
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
  }, [isAvailable, isPermissionGranted]);

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

  const value = useMemo(
    () => ({
      isAvailable,
      isPermissionGranted,
      isLoading,
      todaySteps,
      todayCaloriesBurned,
      todayWorkouts,
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

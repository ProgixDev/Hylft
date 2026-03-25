/**
 * NutritionContext
 * Manages meal logging, daily calorie/macro tracking, and nutrition goals.
 * Calls the NestJS server API for persistence (not Supabase directly).
 * Uses AsyncStorage for offline cache.
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
import type { MealEntry, MealType } from "../services/nutritionApi";

// ── Types ──────────────────────────────────────────────────────────────────
export interface NutritionGoals {
  calorieGoal: number;
  proteinGoal: number;
  carbsGoal: number;
  fatGoal: number;
}

export interface DailyNutritionSummary {
  date: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  meals: MealEntry[];
}

interface NutritionContextType {
  goals: NutritionGoals;
  todayMeals: MealEntry[];
  todaySummary: DailyNutritionSummary;
  weekSummaries: DailyNutritionSummary[];
  isLoading: boolean;

  addMeal: (meal: Omit<MealEntry, "id" | "userId" | "loggedAt">) => Promise<void>;
  removeMeal: (mealId: string) => Promise<void>;
  updateGoals: (goals: Partial<NutritionGoals>) => Promise<void>;
  refreshToday: () => Promise<void>;
  refreshWeek: () => Promise<void>;
  getMealsForDate: (date: string) => Promise<MealEntry[]>;
}

const DEFAULT_GOALS: NutritionGoals = {
  calorieGoal: 2200,
  proteinGoal: 150,
  carbsGoal: 250,
  fatGoal: 70,
};

const STORAGE_KEYS = {
  goals: "@hylift_nutrition_goals",
  todayMeals: "@hylift_today_meals",
};

const NutritionContext = createContext<NutritionContextType | undefined>(
  undefined
);

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

function getWeekRange(): { start: string; end: string } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((day + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return {
    start: monday.toISOString().split("T")[0],
    end: sunday.toISOString().split("T")[0],
  };
}

function summarizeMeals(date: string, meals: MealEntry[]): DailyNutritionSummary {
  const dayMeals = meals.filter((m) => m.date === date);
  return {
    date,
    totalCalories: dayMeals.reduce((s, m) => s + m.calories, 0),
    totalProtein: dayMeals.reduce((s, m) => s + m.protein, 0),
    totalCarbs: dayMeals.reduce((s, m) => s + m.carbs, 0),
    totalFat: dayMeals.reduce((s, m) => s + m.fat, 0),
    meals: dayMeals,
  };
}

function mapServerMeal(row: any): MealEntry {
  return {
    id: row.id,
    userId: row.user_id,
    date: row.date,
    mealType: row.meal_type as MealType,
    foodId: row.food_id,
    foodName: row.food_name,
    servings: row.servings,
    calories: row.calories,
    protein: row.protein,
    carbs: row.carbs,
    fat: row.fat,
    loggedAt: row.logged_at ?? row.created_at,
  };
}

export function NutritionProvider({ children }: { children: React.ReactNode }) {
  const [goals, setGoals] = useState<NutritionGoals>(DEFAULT_GOALS);
  const [todayMeals, setTodayMeals] = useState<MealEntry[]>([]);
  const [weekMeals, setWeekMeals] = useState<MealEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const today = getToday();

  // ── Load cached data on mount ──────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const [storedGoals, storedMeals] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.goals),
          AsyncStorage.getItem(STORAGE_KEYS.todayMeals),
        ]);

        if (storedGoals) setGoals(JSON.parse(storedGoals));
        if (storedMeals) {
          const parsed: MealEntry[] = JSON.parse(storedMeals);
          setTodayMeals(parsed.filter((m) => m.date === today));
        }
      } catch (error) {
        console.warn("[NutritionContext] Load cache failed:", error);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [today]);

  // ── Sync goals from server on mount ────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const serverGoals = await api.getNutritionGoals();
        if (serverGoals) {
          const mapped: NutritionGoals = {
            calorieGoal: serverGoals.calorie_goal ?? DEFAULT_GOALS.calorieGoal,
            proteinGoal: serverGoals.protein_goal ?? DEFAULT_GOALS.proteinGoal,
            carbsGoal: serverGoals.carbs_goal ?? DEFAULT_GOALS.carbsGoal,
            fatGoal: serverGoals.fat_goal ?? DEFAULT_GOALS.fatGoal,
          };
          setGoals(mapped);
          AsyncStorage.setItem(STORAGE_KEYS.goals, JSON.stringify(mapped));
        }
      } catch {
        // Use cached goals — user may be offline
      }
    })();
  }, []);

  // ── Actions ────────────────────────────────────────────────────────────
  const addMeal = useCallback(
    async (meal: Omit<MealEntry, "id" | "userId" | "loggedAt">) => {
      try {
        const serverMeal = await api.addMeal({
          date: meal.date,
          meal_type: meal.mealType,
          food_id: meal.foodId,
          food_name: meal.foodName,
          servings: meal.servings,
          calories: meal.calories,
          protein: meal.protein,
          carbs: meal.carbs,
          fat: meal.fat,
        });

        const mapped = mapServerMeal(serverMeal);

        setTodayMeals((prev) => {
          const updated = [...prev, mapped];
          AsyncStorage.setItem(STORAGE_KEYS.todayMeals, JSON.stringify(updated));
          return updated;
        });
      } catch (error) {
        console.warn("[NutritionContext] addMeal failed:", error);
        // Offline fallback: add locally
        const localMeal: MealEntry = {
          ...meal,
          id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
          userId: "local",
          loggedAt: new Date().toISOString(),
        };
        setTodayMeals((prev) => {
          const updated = [...prev, localMeal];
          AsyncStorage.setItem(STORAGE_KEYS.todayMeals, JSON.stringify(updated));
          return updated;
        });
      }
    },
    []
  );

  const removeMeal = useCallback(async (mealId: string) => {
    setTodayMeals((prev) => {
      const updated = prev.filter((m) => m.id !== mealId);
      AsyncStorage.setItem(STORAGE_KEYS.todayMeals, JSON.stringify(updated));
      return updated;
    });

    try {
      await api.deleteMeal(mealId);
    } catch (error) {
      console.warn("[NutritionContext] deleteMeal failed:", error);
    }
  }, []);

  const updateGoals = useCallback(async (newGoals: Partial<NutritionGoals>) => {
    setGoals((prev) => {
      const updated = { ...prev, ...newGoals };
      AsyncStorage.setItem(STORAGE_KEYS.goals, JSON.stringify(updated));

      // Sync to server
      api.updateNutritionGoals({
        calorie_goal: updated.calorieGoal,
        protein_goal: updated.proteinGoal,
        carbs_goal: updated.carbsGoal,
        fat_goal: updated.fatGoal,
      }).catch((e) => console.warn("[NutritionContext] updateGoals failed:", e));

      return updated;
    });
  }, []);

  const refreshToday = useCallback(async () => {
    try {
      const serverMeals = await api.getMeals(today);
      const meals = (serverMeals ?? []).map(mapServerMeal);
      setTodayMeals(meals);
      AsyncStorage.setItem(STORAGE_KEYS.todayMeals, JSON.stringify(meals));
    } catch (error) {
      console.warn("[NutritionContext] refreshToday failed:", error);
    }
  }, [today]);

  const refreshWeek = useCallback(async () => {
    try {
      const { start, end } = getWeekRange();
      const serverMeals = await api.getMealsRange(start, end);
      const meals = (serverMeals ?? []).map(mapServerMeal);
      setWeekMeals(meals);
    } catch (error) {
      console.warn("[NutritionContext] refreshWeek failed:", error);
    }
  }, []);

  const getMealsForDate = useCallback(async (date: string): Promise<MealEntry[]> => {
    try {
      const serverMeals = await api.getMeals(date);
      return (serverMeals ?? []).map(mapServerMeal);
    } catch {
      return [];
    }
  }, []);

  // ── Computed ───────────────────────────────────────────────────────────
  const todaySummary = useMemo(
    () => summarizeMeals(today, todayMeals),
    [today, todayMeals]
  );

  const weekSummaries = useMemo(() => {
    const todayObj = new Date();
    todayObj.setHours(0, 0, 0, 0);
    const day = todayObj.getDay();
    const monday = new Date(todayObj);
    monday.setDate(todayObj.getDate() - ((day + 6) % 7));

    const allMeals = [...weekMeals, ...todayMeals];
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = d.toISOString().split("T")[0];
      return summarizeMeals(dateStr, allMeals);
    });
  }, [weekMeals, todayMeals]);

  const value = useMemo(
    () => ({
      goals,
      todayMeals,
      todaySummary,
      weekSummaries,
      isLoading,
      addMeal,
      removeMeal,
      updateGoals,
      refreshToday,
      refreshWeek,
      getMealsForDate,
    }),
    [goals, todayMeals, todaySummary, weekSummaries, isLoading, addMeal, removeMeal, updateGoals, refreshToday, refreshWeek, getMealsForDate]
  );

  return (
    <NutritionContext.Provider value={value}>
      {children}
    </NutritionContext.Provider>
  );
}

export function useNutrition() {
  const context = useContext(NutritionContext);
  if (!context) {
    throw new Error("useNutrition must be used within NutritionProvider");
  }
  return context;
}

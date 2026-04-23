/**
 * NutritionContext — backend-only (Supabase via /nutrition API).
 * Source of truth is the server. No AsyncStorage, no local fallback.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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

export interface AlimentationDaily {
  waterMl: number;
  weightKg: number | null;
  notes: string[]; // stored as JSON-encoded array in the `notes` column
}

export interface DailyNutritionSummary {
  date: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  meals: MealEntry[];
  daily: AlimentationDaily;
}

interface NutritionContextType {
  goals: NutritionGoals;
  selectedDate: string; // YYYY-MM-DD
  todayMeals: MealEntry[];
  todaySummary: DailyNutritionSummary;
  daily: AlimentationDaily;
  isLoading: boolean;

  selectDate: (date: string) => void;
  refresh: () => Promise<void>;

  addMeal: (meal: Omit<MealEntry, "id" | "userId" | "loggedAt">) => Promise<void>;
  removeMeal: (mealId: string) => Promise<void>;
  updateGoals: (goals: Partial<NutritionGoals>) => Promise<void>;

  setWater: (ml: number) => void;
  setWeight: (kg: number) => void;
  addNote: (text: string) => void;
}

const DEFAULT_GOALS: NutritionGoals = {
  calorieGoal: 2200,
  proteinGoal: 150,
  carbsGoal: 250,
  fatGoal: 70,
};

const EMPTY_DAILY: AlimentationDaily = {
  waterMl: 0,
  weightKg: null,
  notes: [],
};

const NutritionContext = createContext<NutritionContextType | undefined>(
  undefined,
);

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

function parseNotes(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter((n) => typeof n === "string");
  if (typeof raw !== "string") return [];
  const trimmed = raw.trim();
  if (!trimmed) return [];
  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) return parsed.filter((n) => typeof n === "string");
  } catch {
    // fallback: treat as single note
  }
  return [trimmed];
}

function mapServerMeal(row: any): MealEntry {
  return {
    id: row.id,
    userId: row.user_id,
    date: row.date,
    mealType: row.meal_type as MealType,
    foodId: row.food_id ?? undefined,
    foodName: row.food_name,
    servings: Number(row.servings) || 0,
    calories: Number(row.calories) || 0,
    protein: Number(row.protein) || 0,
    carbs: Number(row.carbs) || 0,
    fat: Number(row.fat) || 0,
    loggedAt: row.logged_at ?? new Date().toISOString(),
  };
}

function mapServerDaily(row: any): AlimentationDaily {
  if (!row) return { ...EMPTY_DAILY };
  return {
    waterMl: Number(row.water_ml) || 0,
    weightKg: row.weight_kg != null ? Number(row.weight_kg) : null,
    notes: parseNotes(row.notes),
  };
}

function mapServerGoals(row: any): NutritionGoals {
  if (!row) return DEFAULT_GOALS;
  return {
    calorieGoal: Number(row.calorie_goal) || DEFAULT_GOALS.calorieGoal,
    proteinGoal: Number(row.protein_goal) || DEFAULT_GOALS.proteinGoal,
    carbsGoal: Number(row.carbs_goal) || DEFAULT_GOALS.carbsGoal,
    fatGoal: Number(row.fat_goal) || DEFAULT_GOALS.fatGoal,
  };
}

export function NutritionProvider({ children }: { children: React.ReactNode }) {
  const [goals, setGoals] = useState<NutritionGoals>(DEFAULT_GOALS);
  const [selectedDate, setSelectedDate] = useState<string>(getToday());
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [daily, setDaily] = useState<AlimentationDaily>(EMPTY_DAILY);
  const [isLoading, setIsLoading] = useState(true);

  // Debounce timers for daily upserts
  const dailyDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load goals once on mount ───────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const serverGoals = await api.getNutritionGoals();
        setGoals(mapServerGoals(serverGoals));
      } catch (error) {
        console.warn("[NutritionContext] Load goals failed:", error);
      }
    })();
  }, []);

  // ── Load summary for selectedDate ──────────────────────────────────────
  const loadSummary = useCallback(async (date: string) => {
    setIsLoading(true);
    try {
      const summary = await api.getDailySummary(date);
      const rows = Array.isArray(summary?.meals) ? summary.meals : [];
      setMeals(rows.map(mapServerMeal));
      setDaily(mapServerDaily(summary?.daily));
    } catch (error) {
      console.warn("[NutritionContext] Load summary failed:", error);
      setMeals([]);
      setDaily(EMPTY_DAILY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSummary(selectedDate);
  }, [selectedDate, loadSummary]);

  // ── Actions ────────────────────────────────────────────────────────────
  const selectDate = useCallback((date: string) => {
    setSelectedDate(date);
  }, []);

  const refresh = useCallback(async () => {
    await loadSummary(selectedDate);
  }, [loadSummary, selectedDate]);

  const addMeal = useCallback(
    async (meal: Omit<MealEntry, "id" | "userId" | "loggedAt">) => {
      try {
        const row = await api.addMeal({
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
        const mapped = mapServerMeal(row);
        if (mapped.date === selectedDate) {
          setMeals((prev) => [...prev, mapped]);
        }
      } catch (error) {
        console.warn("[NutritionContext] addMeal failed:", error);
        throw error;
      }
    },
    [selectedDate],
  );

  const removeMeal = useCallback(async (mealId: string) => {
    const prev = meals;
    setMeals((m) => m.filter((x) => x.id !== mealId));
    try {
      await api.deleteMeal(mealId);
    } catch (error) {
      console.warn("[NutritionContext] deleteMeal failed, reverting:", error);
      setMeals(prev);
    }
  }, [meals]);

  const updateGoals = useCallback(async (patch: Partial<NutritionGoals>) => {
    const next = { ...goals, ...patch };
    setGoals(next);
    try {
      await api.updateNutritionGoals({
        calorie_goal: next.calorieGoal,
        protein_goal: next.proteinGoal,
        carbs_goal: next.carbsGoal,
        fat_goal: next.fatGoal,
      });
    } catch (error) {
      console.warn("[NutritionContext] updateGoals failed:", error);
    }
  }, [goals]);

  // ── Daily upsert (debounced) ───────────────────────────────────────────
  const scheduleDailyUpsert = useCallback(
    (payload: { water_ml?: number; weight_kg?: number; notes?: string }) => {
      if (dailyDebounceRef.current) clearTimeout(dailyDebounceRef.current);
      const date = selectedDate;
      dailyDebounceRef.current = setTimeout(() => {
        api
          .upsertAlimentationDaily({ date, ...payload })
          .catch((err) =>
            console.warn("[NutritionContext] upsertDaily failed:", err),
          );
      }, 400);
    },
    [selectedDate],
  );

  const setWater = useCallback((ml: number) => {
    const value = Math.max(0, Math.round(ml));
    setDaily((d) => ({ ...d, waterMl: value }));
    scheduleDailyUpsert({ water_ml: value });
  }, [scheduleDailyUpsert]);

  const setWeight = useCallback((kg: number) => {
    const value = Math.max(0, kg);
    setDaily((d) => ({ ...d, weightKg: value }));
    scheduleDailyUpsert({ weight_kg: value });
  }, [scheduleDailyUpsert]);

  const addNote = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    let nextNotes: string[] = [];
    setDaily((d) => {
      nextNotes = [trimmed, ...d.notes];
      return { ...d, notes: nextNotes };
    });
    // Fire immediately (not debounced) so new notes aren't swallowed
    if (dailyDebounceRef.current) clearTimeout(dailyDebounceRef.current);
    api
      .upsertAlimentationDaily({
        date: selectedDate,
        notes: JSON.stringify(nextNotes),
      })
      .catch((err) =>
        console.warn("[NutritionContext] upsertDaily(notes) failed:", err),
      );
  }, [selectedDate]);

  // ── Computed summary ───────────────────────────────────────────────────
  const todaySummary = useMemo<DailyNutritionSummary>(() => {
    const totals = meals.reduce(
      (acc, m) => ({
        calories: acc.calories + m.calories,
        protein: acc.protein + m.protein,
        carbs: acc.carbs + m.carbs,
        fat: acc.fat + m.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );
    return {
      date: selectedDate,
      totalCalories: totals.calories,
      totalProtein: totals.protein,
      totalCarbs: totals.carbs,
      totalFat: totals.fat,
      meals,
      daily,
    };
  }, [selectedDate, meals, daily]);

  const value = useMemo(
    () => ({
      goals,
      selectedDate,
      todayMeals: meals,
      todaySummary,
      daily,
      isLoading,
      selectDate,
      refresh,
      addMeal,
      removeMeal,
      updateGoals,
      setWater,
      setWeight,
      addNote,
    }),
    [
      goals,
      selectedDate,
      meals,
      todaySummary,
      daily,
      isLoading,
      selectDate,
      refresh,
      addMeal,
      removeMeal,
      updateGoals,
      setWater,
      setWeight,
      addNote,
    ],
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

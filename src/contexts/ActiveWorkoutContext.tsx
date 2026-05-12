import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Routine } from "../data/mockData";
import { api } from "../services/api";
import { estimateCaloriesBurned } from "../utils/calorieEstimator";
import { useAuth } from "./AuthContext";
import { useHealth } from "./HealthContext";

export interface ExerciseSet {
  id: string;
  setNumber: number;
  previousKg?: number;
  previousReps?: number;
  kg: string;
  reps: string;
  isCompleted: boolean;
}

/** Exercise entry within a workout session */
export interface WorkoutExerciseEntry {
  id: string;
  exerciseId: number;
  name: string;
  muscles: { id: number; name: string; name_en: string }[];
  equipment: { id: number; name: string }[];
  sets: ExerciseSet[];
  notes?: string;
  addedAt: number;
}

interface ActiveWorkout {
  id: string;
  duration: number;
  volume: number;
  sets: number;
  exercises: WorkoutExerciseEntry[];
}

/** A single set inside the Hevy-style guided player. */
export interface PlayerSet {
  id: string;
  kg: string;
  reps: string;
  isWarmup: boolean;
  isCompleted: boolean;
  /** Last time the user trained this set, for the PREVIOUS column. */
  previousKg?: number;
  previousReps?: number;
}

/** Per-exercise state inside the Hevy-style guided player. */
export interface GuidedPlayerExercise {
  id: string;
  name: string;
  gifUrl?: string;
  bodyPart?: string;
  target?: string;
  equipment?: string;
  /** Target rep range string (e.g. "10-12"). */
  targetReps?: string;
  /** User notes — persisted with the workout. */
  notes: string;
  /** Per-exercise rest, in seconds — persisted with the workout. */
  restSeconds: number;
  sets: PlayerSet[];
}

export interface GuidedPlayerState {
  routineId: string;
  routineName: string;
  exercises: GuidedPlayerExercise[];
  /** When the active rest timer ends (epoch ms). */
  restEndsAt?: number;
  /** Exercise id that started the active rest timer. */
  restExerciseId?: string;
}

interface ActiveWorkoutContextType {
  activeWorkout: ActiveWorkout | null;
  isPaused: boolean;
  startWorkout: (workout: ActiveWorkout) => void;
  updateWorkout: (updates: Partial<ActiveWorkout>) => void;
  discardWorkout: () => void;
  pauseWorkout: () => void;
  resumeWorkout: () => void;
  togglePause: () => void;
  saveWorkout: (name?: string) => Promise<void>;
  addExerciseToWorkout: (exercise: any) => void;
  removeExerciseFromWorkout: (exerciseEntryId: string) => void;
  updateExerciseEntry: (
    exerciseEntryId: string,
    updates: Partial<WorkoutExerciseEntry>,
  ) => void;
  addSetToExercise: (exerciseEntryId: string) => void;
  updateSet: (
    exerciseEntryId: string,
    setId: string,
    updates: Partial<ExerciseSet>,
  ) => void;
  removeSet: (exerciseEntryId: string, setId: string) => void;
  reorderExercise: (fromIndex: number, toIndex: number) => void;
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
  // ── Guided routine player ───────────────────────────────────────────
  guidedPlayer: GuidedPlayerState | null;
  startGuidedRoutine: (routine: Routine) => void;
  updateGuidedExercise: (
    exerciseId: string,
    updates: Partial<GuidedPlayerExercise>,
  ) => void;
  updatePlayerSet: (
    exerciseId: string,
    setId: string,
    updates: Partial<PlayerSet>,
  ) => void;
  addPlayerSet: (exerciseId: string) => void;
  removePlayerSet: (exerciseId: string, setId: string) => void;
  togglePlayerSetWarmup: (exerciseId: string, setId: string) => void;
  togglePlayerSetCompleted: (exerciseId: string, setId: string) => void;
  startPlayerRest: (exerciseId: string, seconds?: number) => void;
  stopPlayerRest: () => void;
  endGuidedRoutine: (save: boolean) => Promise<void>;
}

const ActiveWorkoutContext = createContext<
  ActiveWorkoutContextType | undefined
>(undefined);

export const useActiveWorkout = () => {
  const context = useContext(ActiveWorkoutContext);
  if (!context) {
    throw new Error(
      "useActiveWorkout must be used within ActiveWorkoutProvider",
    );
  }
  return context;
};

interface ActiveWorkoutProviderProps {
  children: ReactNode;
}

export const ActiveWorkoutProvider: React.FC<ActiveWorkoutProviderProps> = ({
  children,
}) => {
  const { userProfile } = useAuth();
  const { refreshToday: refreshHealthToday } = useHealth();
  const [activeWorkout, setActiveWorkout] = useState<ActiveWorkout | null>(
    null,
  );
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPaused, setIsPaused] = useState(true); // starts paused — user presses play
  const [guidedPlayer, setGuidedPlayer] = useState<GuidedPlayerState | null>(
    null,
  );
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  // ── Timer logic ──────────────────────────────────────────────────────
  useEffect(() => {
    if (activeWorkout && !isPaused) {
      timerRef.current = setInterval(() => {
        setActiveWorkout((prev) => {
          if (!prev) return prev;
          return { ...prev, duration: prev.duration + 1 };
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [activeWorkout !== null, isPaused]);

  const startWorkout = useCallback((workout: ActiveWorkout) => {
    const workoutWithExercises = {
      ...workout,
      exercises: workout.exercises || [],
    };
    setActiveWorkout(workoutWithExercises);
    setIsExpanded(true);
    setIsPaused(true); // paused until user presses play
    startTimeRef.current = Date.now();
  }, []);

  const updateWorkout = useCallback((updates: Partial<ActiveWorkout>) => {
    setActiveWorkout((prev) => {
      if (!prev) return prev;
      return { ...prev, ...updates };
    });
  }, []);

  const discardWorkout = useCallback(() => {
    setActiveWorkout(null);
    setIsExpanded(false);
    setIsPaused(false);
  }, []);

  const pauseWorkout = useCallback(() => setIsPaused(true), []);
  const resumeWorkout = useCallback(() => setIsPaused(false), []);
  const togglePause = useCallback(() => setIsPaused((p) => !p), []);

  // ── Save workout to server ───────────────────────────────────────────
  const saveWorkout = useCallback(async (name?: string) => {
    if (!activeWorkout) return;

    const totalVolume = activeWorkout.exercises.reduce((vol, ex) => {
      return vol + ex.sets
        .filter((s) => s.isCompleted)
        .reduce((sv, s) => sv + (parseFloat(s.kg) || 0) * (parseFloat(s.reps) || 0), 0);
    }, 0);

    const completedSets = activeWorkout.exercises.reduce(
      (count, ex) => count + ex.sets.filter((s) => s.isCompleted).length,
      0,
    );

    const today = new Date().toISOString().split("T")[0];
    const calories = estimateCaloriesBurned({
      workoutType: "strength",
      durationSeconds: activeWorkout.duration,
      weightKg: userProfile?.weight_kg ?? null,
    });

    const totalSets = activeWorkout.exercises.reduce(
      (count, ex) => count + ex.sets.length,
      0,
    );

    try {
      await api.addWorkout({
        name: name || "Workout",
        workout_type: "strength",
        date: today,
        start_time: new Date(startTimeRef.current).toISOString(),
        end_time: new Date().toISOString(),
        duration_minutes: Math.round(activeWorkout.duration / 60),
        calories_burned: calories,
        source: "manual",
        total_volume_kg: Number(totalVolume.toFixed(2)),
        total_sets: totalSets,
        completed_sets: completedSets,
        exercise_count: activeWorkout.exercises.length,
        exercises: activeWorkout.exercises.map((ex) => ({
          name: ex.name,
          exercise_id: ex.exerciseId ?? null,
          gif_url: (ex as any).gifUrl ?? null,
          sets: ex.sets.map((s) => ({
            kg: s.kg,
            reps: s.reps,
            completed: s.isCompleted,
          })),
        })),
        notes: `Volume: ${Math.round(totalVolume)}kg | Sets: ${completedSets}`,
      });
      void refreshHealthToday();
    } catch (error) {
      console.warn("[ActiveWorkout] Save to server failed:", error);
    }

    setActiveWorkout(null);
    setIsExpanded(false);
    setIsPaused(false);
  }, [activeWorkout, userProfile, refreshHealthToday]);

  // ── Exercise/set management ──────────────────────────────────────────
  const addExerciseToWorkout = useCallback((exercise: any) => {
    setActiveWorkout((prev) => {
      if (!prev) return prev;

      const initialSet: ExerciseSet = {
        id: `${Date.now()}-${Math.random()}`,
        setNumber: 1,
        kg: "",
        reps: "",
        isCompleted: false,
      };

      const entry: WorkoutExerciseEntry = {
        id: `${Date.now()}-${Math.random()}`,
        exerciseId: exercise.id,
        name: exercise.name,
        muscles: exercise.muscles || [],
        equipment: exercise.equipment || [],
        sets: [initialSet],
        addedAt: Date.now(),
      };

      return {
        ...prev,
        exercises: [...prev.exercises, entry],
        sets: prev.sets + 1,
      };
    });
  }, []);

  const addSetToExercise = useCallback((exerciseEntryId: string) => {
    setActiveWorkout((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        exercises: prev.exercises.map((ex) => {
          if (ex.id !== exerciseEntryId) return ex;
          const lastSet = ex.sets[ex.sets.length - 1];
          const newSet: ExerciseSet = {
            id: `${Date.now()}-${Math.random()}`,
            setNumber: ex.sets.length + 1,
            previousKg: lastSet?.isCompleted
              ? parseFloat(lastSet.kg) || undefined
              : lastSet?.previousKg,
            previousReps: lastSet?.isCompleted
              ? parseFloat(lastSet.reps) || undefined
              : lastSet?.previousReps,
            kg: lastSet?.kg || "",
            reps: lastSet?.reps || "",
            isCompleted: false,
          };
          return { ...ex, sets: [...ex.sets, newSet] };
        }),
      };
    });
  }, []);

  const updateSet = useCallback(
    (exerciseEntryId: string, setId: string, updates: Partial<ExerciseSet>) => {
      setActiveWorkout((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          exercises: prev.exercises.map((ex) => {
            if (ex.id !== exerciseEntryId) return ex;
            return {
              ...ex,
              sets: ex.sets.map((s) =>
                s.id === setId ? { ...s, ...updates } : s,
              ),
            };
          }),
        };
      });
    },
    [],
  );

  const removeSet = useCallback((exerciseEntryId: string, setId: string) => {
    setActiveWorkout((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        exercises: prev.exercises.map((ex) => {
          if (ex.id !== exerciseEntryId) return ex;
          const filtered = ex.sets.filter((s) => s.id !== setId);
          return {
            ...ex,
            sets: filtered.map((s, i) => ({ ...s, setNumber: i + 1 })),
          };
        }),
      };
    });
  }, []);

  const reorderExercise = useCallback((fromIndex: number, toIndex: number) => {
    setActiveWorkout((prev) => {
      if (!prev) return prev;
      if (
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= prev.exercises.length ||
        toIndex >= prev.exercises.length
      )
        return prev;
      const exercises = [...prev.exercises];
      const [removed] = exercises.splice(fromIndex, 1);
      exercises.splice(toIndex, 0, removed);
      return { ...prev, exercises };
    });
  }, []);

  const removeExerciseFromWorkout = useCallback((exerciseEntryId: string) => {
    setActiveWorkout((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        exercises: prev.exercises.filter((ex) => ex.id !== exerciseEntryId),
        sets: Math.max(0, prev.sets - 1),
      };
    });
  }, []);

  const updateExerciseEntry = useCallback(
    (exerciseEntryId: string, updates: Partial<WorkoutExerciseEntry>) => {
      setActiveWorkout((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          exercises: prev.exercises.map((ex) =>
            ex.id === exerciseEntryId ? { ...ex, ...updates } : ex,
          ),
        };
      });
    },
    [],
  );

  // ── Guided routine player ──────────────────────────────────────────
  const buildPlayerExercises = useCallback(
    (routine: Routine): GuidedPlayerExercise[] => {
      return routine.exercises.map((ex) => {
        const sets: PlayerSet[] = Array.from({ length: Math.max(1, ex.sets) }).map(
          (_, i) => {
            const target = ex.setTargets?.[i];
            const kgValue = target?.targetKg ?? ex.targetWeight ?? 0;
            const repsValue = target?.targetReps ?? ex.reps ?? "";
            return {
              id: `${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,
              kg: kgValue > 0 ? String(kgValue) : "",
              reps: repsValue ? String(repsValue) : "",
              isWarmup: false,
              isCompleted: false,
            };
          },
        );
        return {
          id: ex.id,
          name: ex.name,
          gifUrl: ex.gifUrl,
          bodyPart: ex.bodyPart,
          target: ex.target,
          equipment: ex.equipment,
          targetReps: ex.reps,
          notes: ex.notes ?? "",
          restSeconds: ex.restTime ?? 60,
          sets,
        };
      });
    },
    [],
  );

  const startGuidedRoutine = useCallback(
    (routine: Routine) => {
      setGuidedPlayer({
        routineId: routine.id,
        routineName: routine.name,
        exercises: buildPlayerExercises(routine),
      });
      const workoutId = `workout-${Date.now()}`;
      setActiveWorkout({
        id: workoutId,
        duration: 0,
        volume: 0,
        sets: 0,
        exercises: [],
      });
      setIsExpanded(false);
      setIsPaused(false);
      startTimeRef.current = Date.now();
    },
    [buildPlayerExercises],
  );

  const updateGuidedExercise = useCallback(
    (exerciseId: string, updates: Partial<GuidedPlayerExercise>) => {
      setGuidedPlayer((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          exercises: prev.exercises.map((ex) =>
            ex.id === exerciseId ? { ...ex, ...updates } : ex,
          ),
        };
      });
    },
    [],
  );

  const updatePlayerSet = useCallback(
    (exerciseId: string, setId: string, updates: Partial<PlayerSet>) => {
      setGuidedPlayer((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          exercises: prev.exercises.map((ex) => {
            if (ex.id !== exerciseId) return ex;
            return {
              ...ex,
              sets: ex.sets.map((s) =>
                s.id === setId ? { ...s, ...updates } : s,
              ),
            };
          }),
        };
      });
    },
    [],
  );

  const addPlayerSet = useCallback((exerciseId: string) => {
    setGuidedPlayer((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        exercises: prev.exercises.map((ex) => {
          if (ex.id !== exerciseId) return ex;
          const last = ex.sets[ex.sets.length - 1];
          const newSet: PlayerSet = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            kg: last?.kg ?? "",
            reps: last?.reps ?? "",
            isWarmup: false,
            isCompleted: false,
          };
          return { ...ex, sets: [...ex.sets, newSet] };
        }),
      };
    });
  }, []);

  const removePlayerSet = useCallback((exerciseId: string, setId: string) => {
    setGuidedPlayer((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        exercises: prev.exercises.map((ex) => {
          if (ex.id !== exerciseId) return ex;
          return { ...ex, sets: ex.sets.filter((s) => s.id !== setId) };
        }),
      };
    });
  }, []);

  const togglePlayerSetWarmup = useCallback(
    (exerciseId: string, setId: string) => {
      setGuidedPlayer((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          exercises: prev.exercises.map((ex) => {
            if (ex.id !== exerciseId) return ex;
            return {
              ...ex,
              sets: ex.sets.map((s) =>
                s.id === setId ? { ...s, isWarmup: !s.isWarmup } : s,
              ),
            };
          }),
        };
      });
    },
    [],
  );

  const startPlayerRest = useCallback(
    (exerciseId: string, secondsOverride?: number) => {
      setGuidedPlayer((prev) => {
        if (!prev) return prev;
        const ex = prev.exercises.find((e) => e.id === exerciseId);
        const seconds = secondsOverride ?? ex?.restSeconds ?? 60;
        if (seconds <= 0) return prev;
        return {
          ...prev,
          restEndsAt: Date.now() + seconds * 1000,
          restExerciseId: exerciseId,
        };
      });
    },
    [],
  );

  const stopPlayerRest = useCallback(() => {
    setGuidedPlayer((prev) => {
      if (!prev) return prev;
      const { restEndsAt: _r, restExerciseId: _e, ...rest } = prev;
      return { ...rest };
    });
  }, []);

  const togglePlayerSetCompleted = useCallback(
    (exerciseId: string, setId: string) => {
      let willComplete = false;
      let restSecondsForExercise = 0;
      setGuidedPlayer((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          exercises: prev.exercises.map((ex) => {
            if (ex.id !== exerciseId) return ex;
            restSecondsForExercise = ex.restSeconds;
            return {
              ...ex,
              sets: ex.sets.map((s) => {
                if (s.id !== setId) return s;
                willComplete = !s.isCompleted;
                return { ...s, isCompleted: !s.isCompleted };
              }),
            };
          }),
        };
      });
      if (willComplete && restSecondsForExercise > 0) {
        startPlayerRest(exerciseId, restSecondsForExercise);
      }
    },
    [startPlayerRest],
  );

  const endGuidedRoutine = useCallback(
    async (save: boolean) => {
      const player = guidedPlayer;
      if (!player) return;

      const completedFlat = player.exercises.flatMap((ex) =>
        ex.sets
          .filter((s) => s.isCompleted)
          .map((s) => ({
            exerciseId: ex.id,
            kg: parseFloat(s.kg) || 0,
            reps: parseInt(s.reps, 10) || 0,
            isWarmup: s.isWarmup,
          })),
      );

      if (save && completedFlat.length > 0 && activeWorkout) {
        const totalVolume = completedFlat.reduce(
          (sum, s) => sum + (s.isWarmup ? 0 : s.kg * s.reps),
          0,
        );
        const today = new Date().toISOString().split("T")[0];
        const calories = estimateCaloriesBurned({
          workoutType: "routine",
          durationSeconds: activeWorkout.duration,
          weightKg: userProfile?.weight_kg ?? null,
        });
        const totalSets = player.exercises.reduce(
          (count, ex) => count + ex.sets.length,
          0,
        );

        try {
          await api.addWorkout({
            name: player.routineName,
            workout_type: "strength",
            date: today,
            start_time: new Date(startTimeRef.current).toISOString(),
            end_time: new Date().toISOString(),
            duration_minutes: Math.round(activeWorkout.duration / 60),
            calories_burned: calories,
            source: "routine",
            routine_id: player.routineId,
            total_volume_kg: Number(totalVolume.toFixed(2)),
            total_sets: totalSets,
            completed_sets: completedFlat.length,
            exercise_count: player.exercises.length,
            exercises: player.exercises.map((ex) => ({
              name: ex.name,
              exercise_id: ex.id ?? null,
              gif_url: ex.gifUrl ?? null,
              notes: ex.notes || undefined,
              rest_seconds: ex.restSeconds,
              sets: ex.sets
                .filter((s) => s.isCompleted)
                .map((s) => ({
                  kg: s.kg,
                  reps: s.reps,
                  completed: true,
                  is_warmup: s.isWarmup,
                })),
            })),
            notes: `Routine: ${player.routineName} | Volume: ${Math.round(totalVolume)}kg | Sets: ${completedFlat.length}`,
          });
        } catch (error) {
          console.warn("[ActiveWorkout] Guided save failed:", error);
        }

        try {
          await api.incrementRoutineCompleted(player.routineId);
        } catch (error) {
          console.warn("[ActiveWorkout] Routine completion increment failed:", error);
        }
        void refreshHealthToday();
      }

      setGuidedPlayer(null);
      setActiveWorkout(null);
      setIsExpanded(false);
      setIsPaused(false);
    },
    [guidedPlayer, activeWorkout, userProfile, refreshHealthToday],
  );

  return (
    <ActiveWorkoutContext.Provider
      value={{
        activeWorkout,
        isPaused,
        startWorkout,
        updateWorkout,
        discardWorkout,
        pauseWorkout,
        resumeWorkout,
        togglePause,
        saveWorkout,
        addExerciseToWorkout,
        removeExerciseFromWorkout,
        updateExerciseEntry,
        addSetToExercise,
        updateSet,
        removeSet,
        reorderExercise,
        isExpanded,
        setIsExpanded,
        guidedPlayer,
        startGuidedRoutine,
        updateGuidedExercise,
        updatePlayerSet,
        addPlayerSet,
        removePlayerSet,
        togglePlayerSetWarmup,
        togglePlayerSetCompleted,
        startPlayerRest,
        stopPlayerRest,
        endGuidedRoutine,
      }}
    >
      {children}
    </ActiveWorkoutContext.Provider>
  );
};

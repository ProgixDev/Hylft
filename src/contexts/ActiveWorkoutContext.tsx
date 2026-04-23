import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Routine, RoutineExercise } from "../data/mockData";
import { api } from "../services/api";

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

/** Phases of the full-screen guided routine player. */
export type PlayerPhase = "EXERCISE" | "LOG_SET" | "REST" | "COMPLETE";

export interface LoggedSet {
  exerciseIndex: number;
  setIndex: number;
  kg: number;
  reps: number;
  completedAt: number;
}

export interface GuidedPlayerState {
  routineId: string;
  routineName: string;
  exercises: RoutineExercise[];
  phase: PlayerPhase;
  currentExerciseIndex: number;
  currentSetIndex: number;
  loggedSets: LoggedSet[];
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
    exerciseIndex: number,
    updates: Partial<RoutineExercise>,
  ) => void;
  completeCurrentSet: (actualKg: number, actualReps: number) => void;
  skipRest: () => void;
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

    try {
      await api.addWorkout({
        name: name || "Workout",
        workout_type: "strength",
        date: today,
        start_time: new Date(startTimeRef.current).toISOString(),
        end_time: new Date().toISOString(),
        duration_minutes: Math.round(activeWorkout.duration / 60),
        calories_burned: Math.round(activeWorkout.duration * 0.1), // rough estimate
        source: "manual",
        exercises: activeWorkout.exercises.map((ex) => ({
          name: ex.name,
          sets: ex.sets.map((s) => ({
            kg: s.kg,
            reps: s.reps,
            completed: s.isCompleted,
          })),
        })),
        notes: `Volume: ${Math.round(totalVolume)}kg | Sets: ${completedSets}`,
      });
    } catch (error) {
      console.warn("[ActiveWorkout] Save to server failed:", error);
    }

    setActiveWorkout(null);
    setIsExpanded(false);
    setIsPaused(false);
  }, [activeWorkout]);

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
  const startGuidedRoutine = useCallback((routine: Routine) => {
    setGuidedPlayer({
      routineId: routine.id,
      routineName: routine.name,
      exercises: routine.exercises.map((ex) => ({ ...ex })),
      phase: "EXERCISE",
      currentExerciseIndex: 0,
      currentSetIndex: 0,
      loggedSets: [],
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
  }, []);

  const updateGuidedExercise = useCallback(
    (exerciseIndex: number, updates: Partial<RoutineExercise>) => {
      setGuidedPlayer((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          exercises: prev.exercises.map((ex, i) =>
            i === exerciseIndex ? { ...ex, ...updates } : ex,
          ),
        };
      });
    },
    [],
  );

  const completeCurrentSet = useCallback(
    (actualKg: number, actualReps: number) => {
      setGuidedPlayer((prev) => {
        if (!prev) return prev;
        const { currentExerciseIndex, currentSetIndex, exercises } = prev;
        const currentExercise = exercises[currentExerciseIndex];
        if (!currentExercise) return prev;

        const newLogged: LoggedSet = {
          exerciseIndex: currentExerciseIndex,
          setIndex: currentSetIndex,
          kg: actualKg,
          reps: actualReps,
          completedAt: Date.now(),
        };

        const loggedSets = [...prev.loggedSets, newLogged];

        const isLastSet = currentSetIndex + 1 >= currentExercise.sets;
        const isLastExercise = currentExerciseIndex + 1 >= exercises.length;

        if (isLastSet && isLastExercise) {
          return { ...prev, loggedSets, phase: "COMPLETE" };
        }

        return { ...prev, loggedSets, phase: "REST" };
      });
    },
    [],
  );

  const skipRest = useCallback(() => {
    setGuidedPlayer((prev) => {
      if (!prev) return prev;
      const { currentExerciseIndex, currentSetIndex, exercises } = prev;
      const currentExercise = exercises[currentExerciseIndex];
      if (!currentExercise) return prev;

      const isLastSet = currentSetIndex + 1 >= currentExercise.sets;
      if (isLastSet) {
        const nextExerciseIndex = currentExerciseIndex + 1;
        if (nextExerciseIndex >= exercises.length) {
          return { ...prev, phase: "COMPLETE" };
        }
        return {
          ...prev,
          phase: "EXERCISE",
          currentExerciseIndex: nextExerciseIndex,
          currentSetIndex: 0,
        };
      }

      return {
        ...prev,
        phase: "EXERCISE",
        currentSetIndex: currentSetIndex + 1,
      };
    });
  }, []);

  const endGuidedRoutine = useCallback(
    async (save: boolean) => {
      const player = guidedPlayer;
      if (!player) return;

      if (save && player.loggedSets.length > 0 && activeWorkout) {
        const totalVolume = player.loggedSets.reduce(
          (sum, s) => sum + s.kg * s.reps,
          0,
        );
        const today = new Date().toISOString().split("T")[0];
        try {
          await api.addWorkout({
            name: player.routineName,
            workout_type: "strength",
            date: today,
            start_time: new Date(startTimeRef.current).toISOString(),
            end_time: new Date().toISOString(),
            duration_minutes: Math.round(activeWorkout.duration / 60),
            calories_burned: Math.round(activeWorkout.duration * 0.1),
            source: "routine",
            exercises: player.exercises.map((ex, exIdx) => ({
              name: ex.name,
              sets: player.loggedSets
                .filter((s) => s.exerciseIndex === exIdx)
                .map((s) => ({
                  kg: String(s.kg),
                  reps: String(s.reps),
                  completed: true,
                })),
            })),
            notes: `Routine: ${player.routineName} | Volume: ${Math.round(totalVolume)}kg | Sets: ${player.loggedSets.length}`,
          });
        } catch (error) {
          console.warn("[ActiveWorkout] Guided save failed:", error);
        }

        try {
          await api.incrementRoutineCompleted(player.routineId);
        } catch (error) {
          console.warn("[ActiveWorkout] Routine completion increment failed:", error);
        }
      }

      setGuidedPlayer(null);
      setActiveWorkout(null);
      setIsExpanded(false);
      setIsPaused(false);
    },
    [guidedPlayer, activeWorkout],
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
        completeCurrentSet,
        skipRest,
        endGuidedRoutine,
      }}
    >
      {children}
    </ActiveWorkoutContext.Provider>
  );
};

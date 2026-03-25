import React, { createContext, ReactNode, useContext, useState } from "react";
import { RoutineExercise } from "../data/mockData";
import { ExerciseDbExercise } from "../services/exerciseDbApi";

export interface RoutineDraft {
  name: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  targetMuscles: string[];
  exercises: RoutineExercise[];
}

interface CreateRoutineContextType {
  isCreating: boolean;
  draft: RoutineDraft;
  initCreation: () => void;
  clearCreation: () => void;
  updateDraft: (updates: Partial<Omit<RoutineDraft, "exercises">>) => void;
  addExercisesToRoutine: (exercises: ExerciseDbExercise[]) => void;
  removeExerciseFromRoutine: (id: string) => void;
  updateRoutineExercise: (
    id: string,
    updates: Partial<RoutineExercise>,
  ) => void;
  reorderRoutineExercise: (fromIndex: number, toIndex: number) => void;
}

const DEFAULT_DRAFT: RoutineDraft = {
  name: "",
  description: "",
  difficulty: "intermediate",
  targetMuscles: [],
  exercises: [],
};

const CreateRoutineContext = createContext<
  CreateRoutineContextType | undefined
>(undefined);

export const useCreateRoutine = () => {
  const ctx = useContext(CreateRoutineContext);
  if (!ctx)
    throw new Error(
      "useCreateRoutine must be used within CreateRoutineProvider",
    );
  return ctx;
};

export const CreateRoutineProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [draft, setDraft] = useState<RoutineDraft>({ ...DEFAULT_DRAFT });

  const initCreation = () => {
    setDraft({ ...DEFAULT_DRAFT });
    setIsCreating(true);
  };

  const clearCreation = () => {
    setDraft({ ...DEFAULT_DRAFT });
    setIsCreating(false);
  };

  const updateDraft = (updates: Partial<Omit<RoutineDraft, "exercises">>) => {
    setDraft((prev) => ({ ...prev, ...updates }));
  };

  const addExercisesToRoutine = (exercises: ExerciseDbExercise[]) => {
    const defaultSets = 3;
    const mapped: RoutineExercise[] = exercises.map((ex) => ({
      id: ex.id,
      name: ex.name,
      sets: defaultSets,
      reps: "8-12",
      restTime: 90,
      trainingTime: 0,
      targetWeight: 0,
      setTargets: Array.from({ length: defaultSets }, (_, i) => ({
        setNumber: i + 1,
        targetKg: 0,
        targetReps: "8-12",
      })),
    }));

    setDraft((prev) => {
      // Avoid duplicates
      const existingIds = new Set(prev.exercises.map((e) => e.id));
      const newOnes = mapped.filter((e) => !existingIds.has(e.id));
      // Merge target muscles from new exercises
      const allMuscles = new Set([
        ...prev.targetMuscles,
        ...exercises.map((e) => e.target).filter(Boolean),
      ]);
      return {
        ...prev,
        exercises: [...prev.exercises, ...newOnes],
        targetMuscles: Array.from(allMuscles),
      };
    });
  };

  const removeExerciseFromRoutine = (id: string) => {
    setDraft((prev) => ({
      ...prev,
      exercises: prev.exercises.filter((e) => e.id !== id),
    }));
  };

  const updateRoutineExercise = (
    id: string,
    updates: Partial<RoutineExercise>,
  ) => {
    setDraft((prev) => ({
      ...prev,
      exercises: prev.exercises.map((e) => {
        if (e.id !== id) return e;
        const updated = { ...e, ...updates };

        // Sync setTargets when sets count changes
        if (updates.sets !== undefined && updates.sets !== e.sets) {
          const currentTargets = updated.setTargets ?? [];
          updated.setTargets = Array.from({ length: updates.sets }, (_, i) => {
            if (i < currentTargets.length) return currentTargets[i];
            return {
              setNumber: i + 1,
              targetKg: updated.targetWeight ?? 0,
              targetReps: updated.reps ?? "8-12",
            };
          });
        }

        return updated;
      }),
    }));
  };

  const reorderRoutineExercise = (fromIndex: number, toIndex: number) => {
    setDraft((prev) => {
      const arr = [...prev.exercises];
      const [item] = arr.splice(fromIndex, 1);
      arr.splice(toIndex, 0, item);
      return { ...prev, exercises: arr };
    });
  };

  return (
    <CreateRoutineContext.Provider
      value={{
        isCreating,
        draft,
        initCreation,
        clearCreation,
        updateDraft,
        addExercisesToRoutine,
        removeExerciseFromRoutine,
        updateRoutineExercise,
        reorderRoutineExercise,
      }}
    >
      {children}
    </CreateRoutineContext.Provider>
  );
};

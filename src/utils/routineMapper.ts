import { Routine, RoutineExercise } from "../data/mockData";

export type ApiRoutine = {
  id: string;
  user_id: string | null;
  name: string;
  description?: string | null;
  exercises?: RoutineExercise[] | null;
  estimated_duration?: number | null;
  target_muscles?: string[] | null;
  difficulty: "beginner" | "intermediate" | "advanced";
  last_used?: string | null;
  times_completed?: number | null;
  is_public?: boolean | null;
  is_admin_routine?: boolean | null;
  category?: string | null;
  sub_category?: string | null;
  duration_days?: number | null;
  color_hex?: string | null;
};

export function mapRoutine(routine: ApiRoutine): Routine {
  return {
    id: routine.id,
    userId: routine.user_id ?? "admin",
    name: routine.name,
    description: routine.description ?? "",
    exercises: routine.exercises ?? [],
    estimatedDuration: routine.estimated_duration ?? 0,
    targetMuscles: routine.target_muscles ?? [],
    difficulty: routine.difficulty,
    lastUsed: routine.last_used ?? undefined,
    timesCompleted: routine.times_completed ?? 0,
  };
}

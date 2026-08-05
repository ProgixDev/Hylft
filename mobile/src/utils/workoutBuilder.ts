/**
 * Utility that converts a `Routine` (from mockData) into a fully-populated
 * `ActiveWorkout` object ready for `startWorkout()`.
 */
import {
    ExerciseSet,
    WorkoutExerciseEntry,
} from "../contexts/ActiveWorkoutContext";
import { Routine } from "../data/mockData";

export function buildActiveWorkoutFromRoutine(routine: Routine): {
  id: string;
  duration: number;
  volume: number;
  sets: number;
  exercises: WorkoutExerciseEntry[];
} {
  let totalSets = 0;

  const exercises: WorkoutExerciseEntry[] = routine.exercises.map((ex) => {
    totalSets += ex.sets;

    const sets: ExerciseSet[] = Array.from({ length: ex.sets }).map((_, i) => ({
      id: `${Date.now()}-${Math.random()}-${i}`,
      setNumber: i + 1,
      kg: "",
      reps: ex.reps,
      isCompleted: false,
    }));

    return {
      id: `${Date.now()}-${Math.random()}`,
      exerciseId: 0,
      name: ex.name,
      muscles: [],
      equipment: [],
      sets,
      notes: ex.notes,
      addedAt: Date.now(),
    };
  });

  return {
    id: `workout-${Date.now()}`,
    duration: 0,
    volume: 0,
    sets: totalSets,
    exercises,
  };
}

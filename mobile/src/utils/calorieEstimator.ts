// MET values per workout type (compendium of physical activities, simplified).
const MET_BY_TYPE: Record<string, number> = {
  strength: 5.0,
  weights: 5.0,
  cardio: 7.5,
  running: 9.0,
  cycling: 7.5,
  hiit: 8.0,
  yoga: 3.0,
  pilates: 3.5,
  mobility: 2.5,
  stretching: 2.3,
  walking: 3.5,
  swimming: 8.0,
  routine: 5.0,
};

const DEFAULT_MET = 5.0;
const FALLBACK_WEIGHT_KG = 70;

export interface CalorieEstimateInput {
  workoutType?: string | null;
  durationSeconds: number;
  weightKg?: number | null;
}

/** kcal = MET × weight_kg × hours */
export function estimateCaloriesBurned(input: CalorieEstimateInput): number {
  const { workoutType, durationSeconds, weightKg } = input;
  if (!durationSeconds || durationSeconds <= 0) return 0;

  const met =
    (workoutType && MET_BY_TYPE[workoutType.toLowerCase()]) || DEFAULT_MET;
  const weight = weightKg && weightKg > 0 ? weightKg : FALLBACK_WEIGHT_KG;
  const hours = durationSeconds / 3600;
  return Math.round(met * weight * hours);
}

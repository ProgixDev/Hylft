// Shared computation for personalized daily nutrition goals.
// Mirrored on the server (server/src/nutrition/nutrition.utils.ts) — keep in sync.

export interface ProfileForGoals {
  weightKg?: number | null;
  heightCm?: number | null;
  age?: number | null;
  gender?: string | null;
  activityLevel?: string | null;
  workoutFrequency?: number | null;
  weightGoal?: string | null;
}

export interface ComputedNutritionGoals {
  calorieGoal: number;
  proteinGoal: number;
  carbsGoal: number;
  fatGoal: number;
}

const FALLBACK: ComputedNutritionGoals = {
  calorieGoal: 2200,
  proteinGoal: 150,
  carbsGoal: 250,
  fatGoal: 70,
};

export function ageFromDateOfBirth(dob?: string | null): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const ms = Date.now() - d.getTime();
  return Math.floor(ms / (365.25 * 24 * 3600 * 1000));
}

function activityMultiplier(p: ProfileForGoals): number {
  const lvl = (p.activityLevel || "").toLowerCase();
  if (lvl.includes("sedentary")) return 1.2;
  if (lvl.includes("moderate")) return 1.55;
  if (lvl.includes("very") || lvl.includes("active")) return 1.725;
  if (lvl.includes("extreme")) return 1.9;
  if (lvl.includes("light")) return 1.375;

  const freq = p.workoutFrequency ?? 0;
  if (freq >= 6) return 1.725;
  if (freq >= 3) return 1.55;
  if (freq >= 1) return 1.375;
  return 1.2;
}

function goalAdjustment(weightGoal?: string | null): number {
  const g = (weightGoal || "").toLowerCase();
  if (g.includes("lose")) return -500;
  if (g.includes("build") || g.includes("muscle") || g.includes("gain"))
    return 300;
  return 0;
}

function activityWaterBonusMl(p: ProfileForGoals): number {
  const lvl = (p.activityLevel || "").toLowerCase();
  if (lvl.includes("extreme")) return 1000;
  if (lvl.includes("very") || lvl.includes("active")) return 750;
  if (lvl.includes("moderate")) return 500;
  if (lvl.includes("light")) return 250;
  if (lvl.includes("sedentary")) return 0;

  const freq = p.workoutFrequency ?? 0;
  if (freq >= 6) return 750;
  if (freq >= 3) return 500;
  if (freq >= 1) return 250;
  return 0;
}

/**
 * Compute a personalized daily water target (ml).
 * Base: 35 ml per kg of body weight, plus a bonus for activity level.
 * Falls back to 2000 ml when weight is unknown. Clamped to [1500, 4000].
 */
export function computeWaterGoalMl(profile: ProfileForGoals): number {
  const w = Number(profile.weightKg);
  if (!w || w <= 0) return 2000;
  const base = w * 35;
  const total = base + activityWaterBonusMl(profile);
  const rounded = Math.round(total / 50) * 50;
  return Math.max(1500, Math.min(4000, rounded));
}

/**
 * Compute personalized daily targets using Mifflin-St Jeor BMR
 * × activity multiplier ± goal adjustment.
 * Falls back to {2200, 150, 250, 70} when profile inputs are missing.
 */
export function computeNutritionGoals(
  profile: ProfileForGoals,
): ComputedNutritionGoals {
  const w = Number(profile.weightKg);
  const h = Number(profile.heightCm);
  const age = Number(profile.age);
  if (!w || !h || !age) return { ...FALLBACK };

  const gender = (profile.gender || "").toLowerCase();
  const bmr = 10 * w + 6.25 * h - 5 * age + (gender === "female" ? -161 : 5);
  const tdee = bmr * activityMultiplier(profile);
  const calories = Math.max(1200, Math.round(tdee + goalAdjustment(profile.weightGoal)));

  return {
    calorieGoal: calories,
    proteinGoal: Math.round((calories * 0.3) / 4),
    carbsGoal: Math.round((calories * 0.45) / 4),
    fatGoal: Math.round((calories * 0.25) / 9),
  };
}

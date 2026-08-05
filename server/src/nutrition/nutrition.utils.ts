// Personalized daily nutrition target computation.
// Mirrored on the client (src/utils/nutritionGoals.ts) — keep in sync.

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
  calorie_goal: number;
  protein_goal: number;
  carbs_goal: number;
  fat_goal: number;
}

const FALLBACK: ComputedNutritionGoals = {
  calorie_goal: 2200,
  protein_goal: 150,
  carbs_goal: 250,
  fat_goal: 70,
};

export function ageFromDateOfBirth(dob?: string | null): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const ms = Date.now() - d.getTime();
  return Math.floor(ms / (365.25 * 24 * 3600 * 1000));
}

function activityMultiplier(p: ProfileForGoals): number {
  const lvl = (p.activityLevel || '').toLowerCase();
  if (lvl.includes('sedentary')) return 1.2;
  if (lvl.includes('moderate')) return 1.55;
  if (lvl.includes('very') || lvl.includes('active')) return 1.725;
  if (lvl.includes('extreme')) return 1.9;
  if (lvl.includes('light')) return 1.375;

  const freq = p.workoutFrequency ?? 0;
  if (freq >= 6) return 1.725;
  if (freq >= 3) return 1.55;
  if (freq >= 1) return 1.375;
  return 1.2;
}

function goalAdjustment(weightGoal?: string | null): number {
  const g = (weightGoal || '').toLowerCase();
  if (g.includes('lose')) return -500;
  if (g.includes('build') || g.includes('muscle') || g.includes('gain'))
    return 300;
  return 0;
}

export function computeNutritionGoals(
  profile: ProfileForGoals,
): ComputedNutritionGoals {
  const w = Number(profile.weightKg);
  const h = Number(profile.heightCm);
  const age = Number(profile.age);
  if (!w || !h || !age) return { ...FALLBACK };

  const gender = (profile.gender || '').toLowerCase();
  const bmr = 10 * w + 6.25 * h - 5 * age + (gender === 'female' ? -161 : 5);
  const tdee = bmr * activityMultiplier(profile);
  const calories = Math.max(
    1200,
    Math.round(tdee + goalAdjustment(profile.weightGoal)),
  );

  return {
    calorie_goal: calories,
    protein_goal: Math.round((calories * 0.3) / 4),
    carbs_goal: Math.round((calories * 0.45) / 4),
    fat_goal: Math.round((calories * 0.25) / 9),
  };
}

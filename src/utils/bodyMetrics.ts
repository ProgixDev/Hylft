export function calcBMI(weightKg: number, heightCm: number): number {
  if (!weightKg || !heightCm || heightCm <= 0) return 0;
  const m = heightCm / 100;
  return +(weightKg / (m * m)).toFixed(1);
}

export function calcBMR(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: string,
): number {
  if (!weightKg || !heightCm || !age) return 0;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return Math.round(gender === "female" ? base - 161 : base + 5);
}

export type BMICategory =
  | "underweight"
  | "healthy"
  | "overweight"
  | "obese"
  | "unknown";

export function bmiCategory(bmi: number): BMICategory {
  if (!bmi) return "unknown";
  if (bmi < 18.5) return "underweight";
  if (bmi < 25) return "healthy";
  if (bmi < 30) return "overweight";
  return "obese";
}

export function bmiCategoryColor(cat: BMICategory): string {
  switch (cat) {
    case "underweight":
      return "#4A90D9";
    case "healthy":
      return "#34C759";
    case "overweight":
      return "#F5A623";
    case "obese":
      return "#FF3B30";
    default:
      return "#888";
  }
}

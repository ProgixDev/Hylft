/**
 * Nutrition types.
 * Food search and meal CRUD live on the backend — use `api` from ./api.ts.
 */

export type MealType = "breakfast" | "lunch" | "snack" | "dinner";

export interface FoodItem {
  id: string;
  name: string;
  imageUrl?: string;
  calories: number; // per 100g
  protein: number;
  carbs: number;
  fat: number;
  brand?: string;
  servingSize?: number; // grams in one serving/portion, when known
  sugars?: number;
  fiber?: number;
  saturatedFat?: number;
  monounsaturatedFat?: number;
  polyunsaturatedFat?: number;
  transFat?: number;
  cholesterol?: number;
  polyols?: number;
  starch?: number;
  alcohol?: number;
  water?: number;
  caffeine?: number;
  potassium?: number;
  calcium?: number;
  magnesium?: number;
  iron?: number;
  zinc?: number;
  phosphorus?: number;
  vitaminA?: number;
  vitaminB1?: number;
  vitaminB2?: number;
  vitaminB3?: number;
  vitaminB5?: number;
  vitaminB6?: number;
  vitaminB7?: number;
  vitaminB9?: number;
  vitaminB12?: number;
  vitaminC?: number;
  vitaminD?: number;
  vitaminE?: number;
  vitaminK?: number;
  salt?: number;
  nutriScore?: string;
  novaGroup?: number;
  ecoScore?: string;
}

export interface FoodSearchResponse {
  items: FoodItem[];
  hasMore: boolean;
  nextPage: number | null;
}

export interface FoodHistoryItem extends FoodItem {
  useCount: number;
  lastUsedAt: string;
}

export interface MealEntry {
  id: string;
  userId: string;
  date: string;
  mealType: MealType;
  foodId?: string;
  foodName: string;
  imageUrl?: string;
  servings: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  loggedAt: string;
}

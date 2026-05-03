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
  servings: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  loggedAt: string;
}

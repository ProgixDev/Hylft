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
  /** True for private foods the user created themselves (not OpenFoodFacts). */
  isUserFood?: boolean;
}

/** FoodItem ids for user-created foods are prefixed so they never collide with OFF barcodes. */
export const USER_FOOD_ID_PREFIX = "user:";

export const isUserFoodId = (id: string) => id.startsWith(USER_FOOD_ID_PREFIX);

/** Row shape returned by GET/POST /nutrition/user-foods. */
export interface UserFoodRow {
  id: string;
  name: string;
  brand: string | null;
  barcode: string | null;
  serving_size_g: number | string | null;
  calories: number | string;
  protein: number | string;
  carbs: number | string;
  fat: number | string;
  /** Optional detailed values per 100 g, keyed like FoodItem. */
  nutrients?: Partial<Record<UserFoodNutrientKey, number>> | null;
}

/** Detailed FoodItem fields a user can fill in when creating a food. */
export type UserFoodNutrientKey = Extract<
  keyof FoodItem,
  | "sugars" | "fiber" | "polyols" | "starch"
  | "saturatedFat" | "monounsaturatedFat" | "polyunsaturatedFat" | "transFat" | "cholesterol"
  | "salt" | "potassium" | "calcium" | "magnesium" | "iron" | "zinc" | "phosphorus"
  | "vitaminA" | "vitaminB1" | "vitaminB2" | "vitaminB3" | "vitaminB5" | "vitaminB6"
  | "vitaminB7" | "vitaminB9" | "vitaminB12" | "vitaminC" | "vitaminD" | "vitaminE" | "vitaminK"
  | "water" | "alcohol" | "caffeine"
>;

export function userFoodToFoodItem(row: UserFoodRow): FoodItem {
  const serving = Number(row.serving_size_g);
  return {
    ...(row.nutrients ?? {}),
    id: `${USER_FOOD_ID_PREFIX}${row.id}`,
    name: row.name,
    brand: row.brand ?? undefined,
    servingSize: serving > 0 ? serving : undefined,
    calories: Number(row.calories) || 0,
    protein: Number(row.protein) || 0,
    carbs: Number(row.carbs) || 0,
    fat: Number(row.fat) || 0,
    isUserFood: true,
  };
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

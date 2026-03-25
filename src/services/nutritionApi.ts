/**
 * Nutrition API Service — USDA FoodData Central
 * https://fdc.nal.usda.gov/api-guide
 *
 * 100% free, 300K+ lab-verified foods, full nutrition data.
 * DEMO_KEY: 30 req/hour | Free signup key: 1000 req/hour
 * Get your key: https://fdc.nal.usda.gov/api-key-signup.html
 */

const USDA_BASE = "https://api.nal.usda.gov/fdc/v1";
const USDA_API_KEY = "TIk2lrHzI3mT37W9C4DgoXb4BZ3YeDK5TmFRe1fu";

// ── Types ──────────────────────────────────────────────────────────────────
export interface NutritionInfo {
  calories: number;      // kcal per serving
  protein: number;       // g
  carbs: number;         // g
  fat: number;           // g
  fiber: number;         // g
  sugar: number;         // g
  sodium: number;        // g
  servingSize: string;
  caloriesPerServing: number;
  proteinPerServing: number;
  carbsPerServing: number;
  fatPerServing: number;
}

export interface FoodProduct {
  id: string;
  name: string;
  brand: string;
  imageUrl: string | null;
  nutrition: NutritionInfo;
  categories: string;
  nutriScore: string | null;
  novaGroup: number | null;
}

export interface FoodSearchResult {
  products: FoodProduct[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface CustomFood {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
}

export type MealType = "breakfast" | "lunch" | "snack" | "dinner";

export interface MealEntry {
  id: string;
  userId: string;
  date: string;
  mealType: MealType;
  foodId: string | null;
  foodName: string;
  servings: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  loggedAt: string;
}

// ── USDA Nutrient IDs ──────────────────────────────────────────────────────
// 1008 = Energy (kcal)
// 1003 = Protein (g)
// 1005 = Carbohydrate (g)
// 1004 = Total fat (g)
// 1079 = Fiber (g)
// 2000 = Total sugars (g)
// 1093 = Sodium (mg)

function getNutrient(nutrients: any[], id: number): number {
  return nutrients?.find((n: any) => n.nutrientId === id)?.value ?? 0;
}

function parseUSDAFood(food: any): FoodProduct {
  const nutrients = food.foodNutrients ?? [];

  const calories = Math.round(getNutrient(nutrients, 1008));
  const protein = Math.round(getNutrient(nutrients, 1003) * 10) / 10;
  const carbs = Math.round(getNutrient(nutrients, 1005) * 10) / 10;
  const fat = Math.round(getNutrient(nutrients, 1004) * 10) / 10;
  const fiber = Math.round(getNutrient(nutrients, 1079) * 10) / 10;
  const sugar = Math.round(getNutrient(nutrients, 2000) * 10) / 10;
  const sodiumMg = getNutrient(nutrients, 1093);

  const servingSizeNum = food.servingSize ?? 100;
  const servingSizeUnit = food.servingSizeUnit ?? "g";
  const servingSize = `${servingSizeNum}${servingSizeUnit}`;

  // Capitalize first letter of each word for cleaner display
  const name = (food.description ?? "Unknown")
    .toLowerCase()
    .replace(/\b\w/g, (c: string) => c.toUpperCase());

  return {
    id: String(food.fdcId ?? Date.now()),
    name,
    brand: food.brandName ?? food.brandOwner ?? "",
    imageUrl: null,
    nutrition: {
      calories,
      protein,
      carbs,
      fat,
      fiber,
      sugar,
      sodium: Math.round(sodiumMg) / 1000,
      servingSize,
      caloriesPerServing: calories,
      proteinPerServing: protein,
      carbsPerServing: carbs,
      fatPerServing: fat,
    },
    categories: food.foodCategory ?? "",
    nutriScore: null,
    novaGroup: null,
  };
}

// ── API Methods ────────────────────────────────────────────────────────────
export const NutritionApi = {
  /**
   * Search for foods by name.
   * Uses USDA Foundation + SR Legacy (generic whole foods) and Branded foods.
   */
  async searchFood(
    query: string,
    page: number = 1,
    pageSize: number = 20,
    _lang: string = "en"
  ): Promise<FoodSearchResult> {
    try {
      const url =
        `${USDA_BASE}/foods/search?api_key=${USDA_API_KEY}` +
        `&query=${encodeURIComponent(query)}` +
        `&pageSize=${pageSize}` +
        `&pageNumber=${page}` +
        `&dataType=Foundation,SR%20Legacy,Branded`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`USDA API error: ${response.status}`);
      }

      const data = await response.json();
      const foods: any[] = data.foods ?? [];

      return {
        products: foods.map(parseUSDAFood),
        totalCount: data.totalHits ?? 0,
        page: data.currentPage ?? 1,
        pageSize,
      };
    } catch (error) {
      console.warn("[NutritionApi] Search failed:", error);
      return { products: [], totalCount: 0, page: 1, pageSize };
    }
  },

  /**
   * Get a single food by its FDC ID.
   */
  async getFoodById(fdcId: string): Promise<FoodProduct | null> {
    try {
      const url = `${USDA_BASE}/food/${fdcId}?api_key=${USDA_API_KEY}`;
      const response = await fetch(url);
      if (!response.ok) return null;
      const data = await response.json();
      return parseUSDAFood(data);
    } catch {
      return null;
    }
  },

  /**
   * Barcode lookup — not supported by USDA.
   */
  async getProductByBarcode(_barcode: string): Promise<FoodProduct | null> {
    return null;
  },

  /**
   * Calculate nutrition for a given serving amount.
   * USDA data is per 100g, so we scale.
   */
  calculateForServing(
    nutrition: NutritionInfo,
    grams: number
  ): {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  } {
    const factor = grams / 100;
    return {
      calories: Math.round(nutrition.calories * factor),
      protein: Math.round(nutrition.protein * factor * 10) / 10,
      carbs: Math.round(nutrition.carbs * factor * 10) / 10,
      fat: Math.round(nutrition.fat * factor * 10) / 10,
    };
  },
};

/**
 * Open Food Facts API Service
 * Free, open-source nutrition database with 3M+ products.
 * No API key required. Rate limit: 100 req/min.
 * Docs: https://openfoodfacts.github.io/openfoodfacts-server/api/
 */

const BASE_URL = "https://world.openfoodfacts.org";

// ── Types ──────────────────────────────────────────────────────────────────
export interface NutritionInfo {
  calories: number; // kcal per 100g
  protein: number; // g per 100g
  carbs: number; // g per 100g
  fat: number; // g per 100g
  fiber: number; // g per 100g
  sugar: number; // g per 100g
  sodium: number; // g per 100g
  servingSize: string; // e.g. "30g", "1 cup"
  caloriesPerServing: number;
  proteinPerServing: number;
  carbsPerServing: number;
  fatPerServing: number;
}

export interface FoodProduct {
  id: string; // barcode or internal id
  name: string;
  brand: string;
  imageUrl: string | null;
  nutrition: NutritionInfo;
  categories: string;
  nutriScore: string | null; // A, B, C, D, E
  novaGroup: number | null; // 1-4
}

export interface FoodSearchResult {
  products: FoodProduct[];
  totalCount: number;
  page: number;
  pageSize: number;
}

// ── Custom Food (manual entry) ─────────────────────────────────────────────
export interface CustomFood {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
}

// ── Meal Log Entry ─────────────────────────────────────────────────────────
export type MealType = "breakfast" | "lunch" | "snack" | "dinner";

export interface MealEntry {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  mealType: MealType;
  foodId: string | null; // null for custom entries
  foodName: string;
  servings: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  loggedAt: string; // ISO timestamp
}

// ── Helpers ────────────────────────────────────────────────────────────────
function parseNutrition(nutriments: any, product: any): NutritionInfo {
  const caloriesPer100g = nutriments?.["energy-kcal_100g"] ?? 0;
  const proteinPer100g = nutriments?.proteins_100g ?? 0;
  const carbsPer100g = nutriments?.carbohydrates_100g ?? 0;
  const fatPer100g = nutriments?.fat_100g ?? 0;
  const fiberPer100g = nutriments?.fiber_100g ?? 0;
  const sugarPer100g = nutriments?.sugars_100g ?? 0;
  const sodiumPer100g = nutriments?.sodium_100g ?? 0;

  const servingSize = product?.serving_size ?? "100g";
  const servingQuantity = product?.serving_quantity ?? 100;
  const factor = servingQuantity / 100;

  return {
    calories: Math.round(caloriesPer100g),
    protein: Math.round(proteinPer100g * 10) / 10,
    carbs: Math.round(carbsPer100g * 10) / 10,
    fat: Math.round(fatPer100g * 10) / 10,
    fiber: Math.round(fiberPer100g * 10) / 10,
    sugar: Math.round(sugarPer100g * 10) / 10,
    sodium: Math.round(sodiumPer100g * 1000) / 1000,
    servingSize,
    caloriesPerServing: Math.round(caloriesPer100g * factor),
    proteinPerServing: Math.round(proteinPer100g * factor * 10) / 10,
    carbsPerServing: Math.round(carbsPer100g * factor * 10) / 10,
    fatPerServing: Math.round(fatPer100g * factor * 10) / 10,
  };
}

function parseProduct(raw: any): FoodProduct {
  return {
    id: raw.code ?? raw._id ?? "",
    name: raw.product_name ?? raw.product_name_fr ?? "Unknown",
    brand: raw.brands ?? "",
    imageUrl: raw.image_small_url ?? raw.image_url ?? null,
    nutrition: parseNutrition(raw.nutriments, raw),
    categories: raw.categories ?? "",
    nutriScore: raw.nutriscore_grade ?? null,
    novaGroup: raw.nova_group ?? null,
  };
}

// ── API Methods ────────────────────────────────────────────────────────────
export const NutritionApi = {
  /**
   * Search for food products by name.
   * @param query - search term (e.g. "chicken breast", "yaourt")
   * @param page - page number (1-indexed)
   * @param pageSize - results per page (max 100)
   * @param lang - language code ("en" or "fr")
   */
  async searchFood(
    query: string,
    page: number = 1,
    pageSize: number = 20,
    lang: string = "en"
  ): Promise<FoodSearchResult> {
    try {
      const url = `${BASE_URL}/cgi/search.pl?search_terms=${encodeURIComponent(
        query
      )}&search_simple=1&action=process&json=1&page=${page}&page_size=${pageSize}&lc=${lang}&fields=code,product_name,product_name_fr,brands,image_small_url,image_url,nutriments,serving_size,serving_quantity,categories,nutriscore_grade,nova_group`;

      const response = await fetch(url, {
        headers: {
          "User-Agent": "Hylift/1.0 (hylift@app.com)",
        },
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      return {
        products: (data.products ?? []).map(parseProduct),
        totalCount: data.count ?? 0,
        page: data.page ?? 1,
        pageSize,
      };
    } catch (error) {
      console.warn("[NutritionApi] Search failed:", error);
      return { products: [], totalCount: 0, page: 1, pageSize };
    }
  },

  /**
   * Get a product by barcode.
   * Useful for scanning barcodes with the camera.
   */
  async getProductByBarcode(barcode: string): Promise<FoodProduct | null> {
    try {
      const url = `${BASE_URL}/api/v2/product/${barcode}?fields=code,product_name,product_name_fr,brands,image_small_url,image_url,nutriments,serving_size,serving_quantity,categories,nutriscore_grade,nova_group`;

      const response = await fetch(url, {
        headers: {
          "User-Agent": "Hylift/1.0 (hylift@app.com)",
        },
      });

      if (!response.ok) return null;

      const data = await response.json();
      if (data.status !== 1 || !data.product) return null;

      return parseProduct(data.product);
    } catch (error) {
      console.warn("[NutritionApi] Barcode lookup failed:", error);
      return null;
    }
  },

  /**
   * Calculate nutrition for a given serving amount.
   * @param nutrition - base nutrition info (per 100g)
   * @param grams - amount in grams
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

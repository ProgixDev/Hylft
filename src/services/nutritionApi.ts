/**
 * Nutrition API Service — Open Food Facts
 * FREE, multilingual, community-driven food database.
 *
 * Uses country-specific subdomains (fr/world) for language.
 * App identification via query params to avoid React Native
 * stripping the User-Agent header (which causes 503).
 */

const MAX_RESULTS = 20;

// ── Types ──────────────────────────────────────────────────────────────────
export type MealType = "breakfast" | "lunch" | "snack" | "dinner";

export interface FoodItem {
  id: string;
  name: string;
  calories: number; // per 100g
  protein: number; // grams per 100g
  carbs: number; // grams per 100g
  fat: number; // grams per 100g
}

export interface MealEntry {
  id: string;
  date: string;
  mealType: MealType;
  foodName: string;
  servings: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  loggedAt: string;
}

// ── Open Food Facts types ─────────────────────────────────────────────────
interface OFFProduct {
  product_name?: string;
  product_name_fr?: string;
  product_name_en?: string;
  nutriments?: {
    "energy-kcal_100g"?: number;
    "proteins_100g"?: number;
    "carbohydrates_100g"?: number;
    "fat_100g"?: number;
  };
}

interface OFFResponse {
  products: OFFProduct[];
}

// ── Helpers ───────────────────────────────────────────────────────────────
function safeNum(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function getName(p: OFFProduct, lang: "fr" | "en"): string {
  if (lang === "fr") return p.product_name_fr || p.product_name || p.product_name_en || "";
  return p.product_name_en || p.product_name || p.product_name_fr || "";
}

function isValid(p: OFFProduct): boolean {
  if (!p.product_name && !p.product_name_fr && !p.product_name_en) return false;
  if (!p.nutriments) return false;
  if (safeNum(p.nutriments["energy-kcal_100g"]) === 0) return false;
  return true;
}

// ── API Service ─────────────────────────────────────────────────────────────
export const NutritionApi = {
  /**
   * Search food items on Open Food Facts.
   * @param query - search term ("poulet", "chicken breast", etc.)
   * @param lang  - "fr" or "en" (default "fr")
   */
  async searchFood(query: string, lang: "fr" | "en" = "fr"): Promise<FoodItem[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];

    const MAX_RETRIES = 2;

    for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
      try {
        console.log(`[NutritionApi] "${trimmed}" (${lang}) — attempt ${attempt}`);

        const subdomain = lang === "fr" ? "fr" : "world";
        const url = `https://${subdomain}.openfoodfacts.net/cgi/search.pl` +
          `?search_terms=${encodeURIComponent(trimmed)}` +
          `&search_simple=1&json=1&page_size=25&lc=${lang}` +
          `&fields=product_name,product_name_fr,product_name_en,nutriments` +
          `&app_name=HylftApp&app_version=1.0&app_platform=mobile`;

        const controller = new AbortController();
        const tid = setTimeout(() => controller.abort(), 12000);

        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(tid);

        if (res.status === 503 || res.status === 429) {
          if (attempt <= MAX_RETRIES) {
            console.warn(`[NutritionApi] ${res.status}, retrying...`);
            await new Promise((r) => setTimeout(r, 2000 * attempt));
            continue;
          }
          throw new Error(`API error: ${res.status}`);
        }

        if (!res.ok) throw new Error(`API error: ${res.status}`);

        const data: OFFResponse = await res.json();
        if (!Array.isArray(data.products)) return [];

        const items = data.products
          .filter(isValid)
          .slice(0, MAX_RESULTS)
          .map((p, i) => ({
            id: `off-${i}-${Date.now()}`,
            name: getName(p, lang) || "Unknown",
            calories: safeNum(p.nutriments?.["energy-kcal_100g"]),
            protein: safeNum(p.nutriments?.["proteins_100g"]),
            carbs: safeNum(p.nutriments?.["carbohydrates_100g"]),
            fat: safeNum(p.nutriments?.["fat_100g"]),
          }))
          .filter((item) => item.name !== "Unknown");

        console.log(`[NutritionApi] ✅ ${items.length} results`);
        return items;
      } catch (error) {
        if (attempt <= MAX_RETRIES) {
          console.warn(`[NutritionApi] Error attempt ${attempt}, retrying...`);
          await new Promise((r) => setTimeout(r, 2000 * attempt));
          continue;
        }
        console.error("[NutritionApi] ❌ Search failed:", error);
        return [];
      }
    }

    return [];
  },
};

/**
 * Direct Open Food Facts client — called from the device, no server hop.
 *
 * Why direct: OFF is free, public, no auth, and one network hop is ~150ms
 * faster than going through our NestJS proxy. We only proxy things that
 * need auth (history, meals).
 */
import type {
  FoodItem,
  FoodSearchResponse,
} from "./nutritionApi";

// Primary: Search-a-licious (Elasticsearch-backed, typically <500ms).
// Fallbacks: v2 search, then legacy CGI — both are slow but more complete.
const SEARCH_A_LICIOUS_URL = "https://search.openfoodfacts.org/search";
const OFF_V2_SEARCH_URL = "https://world.openfoodfacts.org/api/v2/search";
const OFF_CGI_SEARCH_URL = "https://world.openfoodfacts.org/cgi/search.pl";
const OFF_PRODUCT_URL = "https://world.openfoodfacts.org/api/v2/product";

const REQUEST_TIMEOUT_MS = 5000;
const MAX_RETRIES = 1;
const BASE_BACKOFF_MS = 500;

// In-memory result cache so repeat searches (same query + page) return instantly.
const CACHE_TTL_MS = 1000 * 60 * 5; // 5 min
const CACHE_MAX_ENTRIES = 100;
const searchCache = new Map<string, { result: any; expiresAt: number }>();

function cacheGet(key: string): any | null {
  const entry = searchCache.get(key);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    searchCache.delete(key);
    return null;
  }
  return entry.result;
}

function cacheSet(key: string, result: any): void {
  if (searchCache.size >= CACHE_MAX_ENTRIES) {
    const first = searchCache.keys().next().value;
    if (first) searchCache.delete(first);
  }
  searchCache.set(key, { result, expiresAt: Date.now() + CACHE_TTL_MS });
}

interface OFFNutriments {
  "energy-kcal_100g"?: number;
  proteins_100g?: number;
  carbohydrates_100g?: number;
  fat_100g?: number;
}

interface OFFProduct {
  code?: string;
  product_name?: string;
  product_name_fr?: string;
  product_name_en?: string;
  nutriments?: OFFNutriments;
  image_small_url?: string;
  image_front_small_url?: string;
  image_url?: string;
  image_front_url?: string;
}

interface OFFSearchResponse {
  products?: OFFProduct[];
  count?: number;
  page?: number;
  page_size?: number;
  page_count?: number;
}

const FIELDS = [
  "code",
  "product_name",
  "product_name_fr",
  "product_name_en",
  "nutriments",
  "image_small_url",
  "image_front_small_url",
  "image_url",
  "image_front_url",
].join(",");

function safeNum(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function pickName(p: OFFProduct, lang: "fr" | "en"): string {
  if (lang === "fr") {
    return (
      p.product_name_fr || p.product_name || p.product_name_en || ""
    ).trim();
  }
  return (
    p.product_name_en || p.product_name || p.product_name_fr || ""
  ).trim();
}

function pickImage(p: OFFProduct): string | undefined {
  return (
    p.image_small_url ||
    p.image_front_small_url ||
    p.image_url ||
    p.image_front_url ||
    undefined
  );
}

/**
 * OFF image URLs have a size suffix in the path
 * (".../front_fr.13.200.jpg"). Swap it for a larger size.
 *  - `400`: ~3-4× sharper, still fast to download
 *  - `"full"`: original; high quality but can be large/slow
 *
 * Non-OFF URLs (or already-large URLs) pass through unchanged.
 */
export function upgradeOFFImage(
  url: string | undefined,
  size: 400 | "full" = 400,
): string | undefined {
  if (!url) return undefined;
  return url.replace(
    /\.(100|200|400|full)\.(jpg|jpeg|png|webp)(\?|$)/i,
    `.${size}.$2$3`,
  );
}

function mapProduct(p: OFFProduct, lang: "fr" | "en", index: number): FoodItem | null {
  const name = pickName(p, lang);
  if (!name) return null;
  const calories = safeNum(p.nutriments?.["energy-kcal_100g"]);
  // Filter out junk products with zero kcal AND zero macros — OFF returns lots.
  const protein = safeNum(p.nutriments?.proteins_100g);
  const carbs = safeNum(p.nutriments?.carbohydrates_100g);
  const fat = safeNum(p.nutriments?.fat_100g);
  if (calories === 0 && protein === 0 && carbs === 0 && fat === 0) return null;

  return {
    id: p.code || `off-${Date.now()}-${index}`,
    name,
    imageUrl: pickImage(p),
    calories,
    protein,
    carbs,
    fat,
  };
}

async function fetchOnce(url: string): Promise<any> {
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "HylftApp/1.0 (mobile)",
      },
      signal: controller.signal,
    });
    if (!res.ok) {
      const err: any = new Error(`OFF error: ${res.status}`);
      err.status = res.status;
      throw err;
    }
    return await res.json();
  } finally {
    clearTimeout(tid);
  }
}

const isTransient = (err: any) =>
  err?.name === "AbortError" ||
  err?.status === 503 ||
  err?.status === 502 ||
  err?.status === 504 ||
  err?.status === 429;

async function fetchWithRetry(url: string): Promise<any> {
  let lastErr: any;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fetchOnce(url);
    } catch (err) {
      lastErr = err;
      if (!isTransient(err) || attempt === MAX_RETRIES) throw err;
      const backoff = BASE_BACKOFF_MS * Math.pow(2, attempt);
      await new Promise((r) => setTimeout(r, backoff));
    }
  }
  throw lastErr;
}

export async function searchFoodsOFF(
  query: string,
  lang: "fr" | "en" = "fr",
  page = 0,
  pageSize = 20,
): Promise<FoodSearchResponse> {
  const trimmed = (query || "").trim();
  if (!trimmed) return { items: [], hasMore: false, nextPage: null };

  const cacheKey = `${lang}:${page}:${pageSize}:${trimmed.toLowerCase()}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  // 1. Try Search-a-licious (fast).
  const fastResult = await trySearchALicious(trimmed, lang, page, pageSize);
  if (fastResult) {
    cacheSet(cacheKey, fastResult);
    return fastResult;
  }

  // 2. Fall back to legacy OFF endpoints (slower but more complete).
  const offPage = Math.max(1, page + 1);
  const params = new URLSearchParams({
    search_terms: trimmed,
    search_simple: "1",
    json: "1",
    page: String(offPage),
    page_size: String(pageSize),
    lc: lang,
    fields: FIELDS,
  });

  let data: OFFSearchResponse | null = null;
  let lastErr: unknown = null;
  for (const baseUrl of [OFF_V2_SEARCH_URL, OFF_CGI_SEARCH_URL]) {
    try {
      data = await fetchWithRetry(`${baseUrl}?${params.toString()}`);
      break;
    } catch (err) {
      lastErr = err;
    }
  }
  if (!data) {
    console.warn("[OFF] search failed (all endpoints):", lastErr);
    return { items: [], hasMore: false, nextPage: null };
  }

  const products = Array.isArray(data?.products) ? data.products : [];
  const items = products
    .map((p, i) => mapProduct(p, lang, i))
    .filter((it): it is FoodItem => it !== null);

  const total = safeNum(data?.count);
  const seen = page * pageSize + items.length;
  const hasMore = seen < total && products.length > 0;

  const result = { items, hasMore, nextPage: hasMore ? page + 1 : null };
  cacheSet(cacheKey, result);
  return result;
}

async function trySearchALicious(
  query: string,
  lang: "fr" | "en",
  page: number,
  pageSize: number,
): Promise<FoodSearchResponse | null> {
  const params = new URLSearchParams({
    q: query,
    page: String(Math.max(1, page + 1)),
    page_size: String(pageSize),
    langs: lang,
    fields: FIELDS,
  });
  try {
    const data: any = await fetchWithRetry(
      `${SEARCH_A_LICIOUS_URL}?${params.toString()}`,
    );
    const hits = Array.isArray(data?.hits) ? data.hits : [];
    const items = hits
      .map((h: OFFProduct, i: number) => mapProduct(h, lang, i))
      .filter((it: FoodItem | null): it is FoodItem => it !== null);
    const total = safeNum(data?.count);
    const seen = page * pageSize + items.length;
    const hasMore = seen < total && hits.length > 0;
    return { items, hasMore, nextPage: hasMore ? page + 1 : null };
  } catch (err) {
    console.warn("[OFF] search-a-licious failed, falling back:", err);
    return null;
  }
}

export async function getFoodByCodeOFF(
  code: string,
  lang: "fr" | "en" = "fr",
): Promise<FoodItem | null> {
  if (!code) return null;
  // Skip lookup for our locally-generated ids (e.g. "off-..." or "fallback-...").
  if (!/^\d{6,}$/.test(code)) return null;

  const url = `${OFF_PRODUCT_URL}/${encodeURIComponent(code)}.json?fields=${FIELDS}&lc=${lang}`;
  let data: any;
  try {
    data = await fetchWithRetry(url);
  } catch (err) {
    console.warn("[OFF] product lookup failed:", err);
    return null;
  }

  if (data?.status !== 1 || !data?.product) return null;
  return mapProduct(data.product, lang, 0);
}

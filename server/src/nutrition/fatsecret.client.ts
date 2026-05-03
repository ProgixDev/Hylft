import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface FatSecretFood {
  id: string;
  name: string;
  imageUrl?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface FatSecretSearchResult {
  items: FatSecretFood[];
  hasMore: boolean;
  nextPage: number | null;
}

const TOKEN_URL = 'https://oauth.fatsecret.com/connect/token';
const SEARCH_V3_URL = 'https://platform.fatsecret.com/rest/foods/search/v3';
const SEARCH_V1_URL = 'https://platform.fatsecret.com/rest/server.api';
const REQUEST_TIMEOUT_MS = 5000;

function safeNum(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

// FatSecret returns nutrition per serving. Normalize to per-100g using the
// metric serving info when available. Falls back to per-serving values.
function normalizeTo100g(
  serving: any,
): Pick<FatSecretFood, 'calories' | 'protein' | 'carbs' | 'fat'> {
  if (!serving) return { calories: 0, protein: 0, carbs: 0, fat: 0 };

  const cals = safeNum(serving.calories);
  const protein = safeNum(serving.protein);
  const carbs = safeNum(serving.carbohydrate);
  const fat = safeNum(serving.fat);

  const unit = String(serving.metric_serving_unit || '').toLowerCase();
  const amount = safeNum(serving.metric_serving_amount);

  if ((unit === 'g' || unit === 'ml') && amount > 0) {
    const factor = 100 / amount;
    return {
      calories: cals * factor,
      protein: protein * factor,
      carbs: carbs * factor,
      fat: fat * factor,
    };
  }

  return { calories: cals, protein, carbs, fat };
}

function pickServing(food: any): any {
  const servings = food?.servings?.serving;
  if (!servings) return null;
  const list = Array.isArray(servings) ? servings : [servings];
  // Prefer the one with metric grams, else the first.
  const metric = list.find(
    (s: any) =>
      String(s?.metric_serving_unit || '').toLowerCase() === 'g' ||
      String(s?.metric_serving_unit || '').toLowerCase() === 'ml',
  );
  return metric || list[0];
}

@Injectable()
export class FatSecretClient {
  private readonly logger = new Logger(FatSecretClient.name);
  private readonly clientId: string;
  private readonly clientSecret: string;
  private cachedToken: string | null = null;
  private tokenExpiresAt = 0;

  constructor(config: ConfigService) {
    this.clientId = config.get<string>('FATSECRET_CLIENT_ID') || '';
    this.clientSecret = config.get<string>('FATSECRET_CLIENT_SECRET') || '';
  }

  isConfigured(): boolean {
    return Boolean(this.clientId && this.clientSecret);
  }

  private async getToken(): Promise<string> {
    const now = Date.now();
    if (this.cachedToken && now < this.tokenExpiresAt) {
      return this.cachedToken;
    }

    const basic = Buffer.from(
      `${this.clientId}:${this.clientSecret}`,
    ).toString('base64');

    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      scope: 'basic premier',
    });

    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    let res: Response;
    try {
      res = await fetch(TOKEN_URL, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          Authorization: `Basic ${basic}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      });
    } finally {
      clearTimeout(tid);
    }

    if (!res.ok) {
      // Retry once with basic-only scope (some accounts don't have premier)
      const fallbackBody = new URLSearchParams({
        grant_type: 'client_credentials',
        scope: 'basic',
      });
      const res2 = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${basic}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: fallbackBody,
      });
      if (!res2.ok) {
        throw new Error(`FatSecret token error: ${res2.status}`);
      }
      const json2 = (await res2.json()) as any;
      this.cachedToken = json2.access_token;
      this.tokenExpiresAt =
        now + Math.max(60, safeNum(json2.expires_in) - 60) * 1000;
      return this.cachedToken!;
    }

    const json = (await res.json()) as any;
    this.cachedToken = json.access_token;
    this.tokenExpiresAt =
      now + Math.max(60, safeNum(json.expires_in) - 60) * 1000;
    return this.cachedToken!;
  }

  async searchFoods(opts: {
    query: string;
    page: number;
    pageSize: number;
    lang: 'fr' | 'en';
  }): Promise<FatSecretSearchResult> {
    if (!this.isConfigured()) {
      throw new Error('FatSecret not configured');
    }
    const token = await this.getToken();

    // Try v3 first (richer data + image_url). Fall back to v1.
    try {
      return await this.searchV3(token, opts);
    } catch (err) {
      this.logger.warn(
        `FatSecret v3 failed, falling back to v1: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      return await this.searchV1(token, opts);
    }
  }

  private async searchV3(
    token: string,
    opts: { query: string; page: number; pageSize: number; lang: 'fr' | 'en' },
  ): Promise<FatSecretSearchResult> {
    const params = new URLSearchParams({
      method: 'foods.search.v3',
      search_expression: opts.query,
      page_number: String(opts.page),
      max_results: String(opts.pageSize),
      format: 'json',
      include_food_images: 'true',
      include_food_attributes: 'false',
      flag_default_serving: 'true',
      language: opts.lang,
      region: opts.lang === 'fr' ? 'FR' : 'US',
    });

    const url = `${SEARCH_V3_URL}?${params.toString()}`;
    const data = await this.fetchJson(url, token);
    const results = data?.foods_search?.results?.food;
    const list = Array.isArray(results) ? results : results ? [results] : [];
    const totalResults = safeNum(data?.foods_search?.total_results);
    const seen = (opts.page + 1) * opts.pageSize;

    return {
      items: list.map((f: any) => this.mapFood(f)),
      hasMore: seen < totalResults,
      nextPage: seen < totalResults ? opts.page + 1 : null,
    };
  }

  private async searchV1(
    token: string,
    opts: { query: string; page: number; pageSize: number; lang: 'fr' | 'en' },
  ): Promise<FatSecretSearchResult> {
    const params = new URLSearchParams({
      method: 'foods.search',
      search_expression: opts.query,
      page_number: String(opts.page),
      max_results: String(opts.pageSize),
      format: 'json',
    });

    const url = `${SEARCH_V1_URL}?${params.toString()}`;
    const data = await this.fetchJson(url, token);
    const results = data?.foods?.food;
    const list = Array.isArray(results) ? results : results ? [results] : [];
    const totalResults = safeNum(data?.foods?.total_results);
    const seen = (opts.page + 1) * opts.pageSize;

    return {
      items: list.map((f: any) => this.mapV1Food(f)),
      hasMore: seen < totalResults,
      nextPage: seen < totalResults ? opts.page + 1 : null,
    };
  }

  private async fetchJson(url: string, token: string): Promise<any> {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });
      if (!res.ok) {
        throw new Error(`FatSecret error: ${res.status}`);
      }
      const json = (await res.json()) as any;
      if (json?.error) {
        throw new Error(`FatSecret error: ${json.error?.message || 'unknown'}`);
      }
      return json;
    } finally {
      clearTimeout(tid);
    }
  }

  private mapFood(food: any): FatSecretFood {
    const serving = pickServing(food);
    const norm = normalizeTo100g(serving);
    const imageUrl =
      food?.food_images?.food_image?.[0]?.image_url ||
      food?.food_images?.food_image?.image_url ||
      undefined;
    const brand = food?.brand_name ? `${food.brand_name} — ` : '';
    return {
      id: String(food?.food_id || ''),
      name: `${brand}${food?.food_name || ''}`.trim(),
      imageUrl,
      ...norm,
    };
  }

  private mapV1Food(food: any): FatSecretFood {
    // v1 returns a single text "food_description" string, not structured servings.
    // Best-effort parse: "Per 100g - Calories: 165kcal | Fat: 3.57g | Carbs: 0.00g | Protein: 31.02g"
    const desc = String(food?.food_description || '');
    const grab = (re: RegExp) => {
      const m = desc.match(re);
      return m ? safeNum(m[1]) : 0;
    };
    const brand = food?.brand_name ? `${food.brand_name} — ` : '';
    return {
      id: String(food?.food_id || ''),
      name: `${brand}${food?.food_name || ''}`.trim(),
      imageUrl: undefined,
      calories: grab(/Calories:\s*([\d.]+)/i),
      protein: grab(/Protein:\s*([\d.]+)/i),
      carbs: grab(/Carbs?:\s*([\d.]+)/i),
      fat: grab(/Fat:\s*([\d.]+)/i),
    };
  }
}

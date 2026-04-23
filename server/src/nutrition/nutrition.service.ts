import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CreateMealDto } from './dto/create-meal.dto';
import { UpdateGoalsDto } from './dto/update-goals.dto';
import { UpsertDailyDto } from './dto/upsert-daily.dto';

interface OFFProduct {
  product_name?: string;
  product_name_fr?: string;
  product_name_en?: string;
  code?: string;
  nutriments?: {
    'energy-kcal_100g'?: number;
    proteins_100g?: number;
    carbohydrates_100g?: number;
    fat_100g?: number;
  };
}

interface OFFResponse {
  products: OFFProduct[];
}

const OFF_MAX_RESULTS = 20;
const OFF_MAX_RETRIES = 2;

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function safeNum(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function offName(p: OFFProduct, lang: 'fr' | 'en'): string {
  if (lang === 'fr') return p.product_name_fr || p.product_name || p.product_name_en || '';
  return p.product_name_en || p.product_name || p.product_name_fr || '';
}

function offIsValid(p: OFFProduct): boolean {
  if (!p.product_name && !p.product_name_fr && !p.product_name_en) return false;
  if (!p.nutriments) return false;
  if (safeNum(p.nutriments['energy-kcal_100g']) === 0) return false;
  return true;
}

@Injectable()
export class NutritionService {
  private readonly logger = new Logger(NutritionService.name);
  private supabase: SupabaseClient;

  constructor(config: ConfigService) {
    this.supabase = createClient(
      config.get<string>('SUPABASE_URL')!,
      config.get<string>('SUPABASE_SERVICE_ROLE_KEY')!,
    );
  }

  // ── Meals ──────────────────────────────────────────────────────────────

  async getMeals(userId: string, date: string) {
    const { data, error } = await this.supabase
      .from('alimentation_meals')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .order('logged_at', { ascending: true });

    if (error) throw error;
    return data ?? [];
  }

  async getMealsRange(userId: string, startDate: string, endDate: string) {
    const { data, error } = await this.supabase
      .from('alimentation_meals')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })
      .order('logged_at', { ascending: true });

    if (error) throw error;
    return data ?? [];
  }

  async addMeal(userId: string, dto: CreateMealDto) {
    const { data, error } = await this.supabase
      .from('alimentation_meals')
      .insert({
        id: genId(),
        user_id: userId,
        date: dto.date,
        meal_type: dto.meal_type,
        food_id: dto.food_id ?? null,
        food_name: dto.food_name,
        servings: dto.servings,
        calories: dto.calories,
        protein: dto.protein,
        carbs: dto.carbs,
        fat: dto.fat,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteMeal(userId: string, mealId: string) {
    const { error } = await this.supabase
      .from('alimentation_meals')
      .delete()
      .eq('id', mealId)
      .eq('user_id', userId);

    if (error) throw error;
    return { deleted: true };
  }

  // ── Daily (water / weight / notes) ─────────────────────────────────────

  async getDaily(userId: string, date: string) {
    const { data, error } = await this.supabase
      .from('alimentation_daily')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .maybeSingle();

    if (error) throw error;
    return (
      data ?? {
        user_id: userId,
        date,
        water_ml: 0,
        weight_kg: null,
        notes: null,
      }
    );
  }

  async upsertDaily(userId: string, dto: UpsertDailyDto) {
    const payload: Record<string, any> = {
      user_id: userId,
      date: dto.date,
      updated_at: new Date().toISOString(),
    };
    if (dto.water_ml !== undefined) payload.water_ml = dto.water_ml;
    if (dto.weight_kg !== undefined) payload.weight_kg = dto.weight_kg;
    if (dto.notes !== undefined) payload.notes = dto.notes;

    const { data, error } = await this.supabase
      .from('alimentation_daily')
      .upsert(payload, { onConflict: 'user_id,date' })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // ── Summary & History ──────────────────────────────────────────────────

  async getDailySummary(userId: string, date: string) {
    const [meals, daily] = await Promise.all([
      this.getMeals(userId, date),
      this.getDaily(userId, date),
    ]);

    const totals = meals.reduce(
      (acc, meal) => ({
        calories: acc.calories + (Number(meal.calories) || 0),
        protein: acc.protein + (Number(meal.protein) || 0),
        carbs: acc.carbs + (Number(meal.carbs) || 0),
        fat: acc.fat + (Number(meal.fat) || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );

    return { date, ...totals, meals, daily };
  }

  async getHistory(userId: string, startDate: string, endDate: string) {
    const [meals, dailyRows] = await Promise.all([
      this.getMealsRange(userId, startDate, endDate),
      this.supabase
        .from('alimentation_daily')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', endDate)
        .then(({ data, error }) => {
          if (error) throw error;
          return data ?? [];
        }),
    ]);

    const mealsByDate: Record<string, any[]> = {};
    for (const m of meals) {
      (mealsByDate[m.date] ||= []).push(m);
    }
    const dailyByDate: Record<string, any> = {};
    for (const d of dailyRows) dailyByDate[d.date] = d;

    const dates = new Set<string>([
      ...Object.keys(mealsByDate),
      ...Object.keys(dailyByDate),
    ]);

    return Array.from(dates)
      .sort((a, b) => (a < b ? 1 : -1))
      .map((date) => {
        const dayMeals = mealsByDate[date] ?? [];
        return {
          date,
          calories: dayMeals.reduce((s, m) => s + (Number(m.calories) || 0), 0),
          protein: dayMeals.reduce((s, m) => s + (Number(m.protein) || 0), 0),
          carbs: dayMeals.reduce((s, m) => s + (Number(m.carbs) || 0), 0),
          fat: dayMeals.reduce((s, m) => s + (Number(m.fat) || 0), 0),
          meals: dayMeals,
          daily: dailyByDate[date] ?? {
            date,
            water_ml: 0,
            weight_kg: null,
            notes: null,
          },
        };
      });
  }

  // ── Goals ──────────────────────────────────────────────────────────────

  async getGoals(userId: string) {
    const { data, error } = await this.supabase
      .from('alimentation_goals')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return (
      data ?? {
        user_id: userId,
        calorie_goal: 2200,
        protein_goal: 150,
        carbs_goal: 250,
        fat_goal: 70,
      }
    );
  }

  async updateGoals(userId: string, dto: UpdateGoalsDto) {
    const { data, error } = await this.supabase
      .from('alimentation_goals')
      .upsert(
        {
          user_id: userId,
          ...dto,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      )
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // ── Open Food Facts proxy ──────────────────────────────────────────────

  async searchFood(q: string, lang: 'fr' | 'en' = 'fr') {
    const trimmed = (q || '').trim();
    if (!trimmed) return [];

    for (let attempt = 1; attempt <= OFF_MAX_RETRIES + 1; attempt++) {
      try {
        const subdomain = lang === 'fr' ? 'fr' : 'world';
        const url =
          `https://${subdomain}.openfoodfacts.net/cgi/search.pl` +
          `?search_terms=${encodeURIComponent(trimmed)}` +
          `&search_simple=1&json=1&page_size=25&lc=${lang}` +
          `&fields=code,product_name,product_name_fr,product_name_en,nutriments` +
          `&app_name=HylftApp&app_version=1.0&app_platform=server`;

        const controller = new AbortController();
        const tid = setTimeout(() => controller.abort(), 12000);
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(tid);

        if ((res.status === 503 || res.status === 429) && attempt <= OFF_MAX_RETRIES) {
          await new Promise((r) => setTimeout(r, 2000 * attempt));
          continue;
        }
        if (!res.ok) throw new Error(`OFF error: ${res.status}`);

        const data = (await res.json()) as OFFResponse;
        if (!Array.isArray(data.products)) return [];

        return data.products
          .filter(offIsValid)
          .slice(0, OFF_MAX_RESULTS)
          .map((p, i) => ({
            id: p.code || `off-${i}-${Date.now()}`,
            name: offName(p, lang) || 'Unknown',
            calories: safeNum(p.nutriments?.['energy-kcal_100g']),
            protein: safeNum(p.nutriments?.proteins_100g),
            carbs: safeNum(p.nutriments?.carbohydrates_100g),
            fat: safeNum(p.nutriments?.fat_100g),
          }))
          .filter((it) => it.name !== 'Unknown');
      } catch (error) {
        if (attempt <= OFF_MAX_RETRIES) {
          await new Promise((r) => setTimeout(r, 2000 * attempt));
          continue;
        }
        this.logger.error('OFF search failed', error as any);
        return [];
      }
    }
    return [];
  }
}

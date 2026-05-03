import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CreateMealDto } from './dto/create-meal.dto';
import { UpdateGoalsDto } from './dto/update-goals.dto';
import { UpsertDailyDto } from './dto/upsert-daily.dto';
import { RecordFoodHistoryDto } from './dto/record-food-history.dto';

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
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
        image_url: dto.image_url ?? null,
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

  // ── Food selection history ─────────────────────────────────────────────

  async getFoodHistory(userId: string, limit = 20) {
    const safeLimit = Math.min(50, Math.max(1, Math.floor(limit)));
    const { data, error } = await this.supabase
      .from('food_history')
      .select('*')
      .eq('user_id', userId)
      .order('last_used_at', { ascending: false })
      .limit(safeLimit);

    if (error) throw error;
    return (data ?? []).map((row: any) => ({
      id: row.food_id,
      name: row.food_name,
      imageUrl: row.image_url || undefined,
      calories: Number(row.calories) || 0,
      protein: Number(row.protein) || 0,
      carbs: Number(row.carbs) || 0,
      fat: Number(row.fat) || 0,
      useCount: Number(row.use_count) || 0,
      lastUsedAt: row.last_used_at,
    }));
  }

  async recordFoodSelection(userId: string, dto: RecordFoodHistoryDto) {
    // Try increment-on-conflict via upsert. We use ignoreDuplicates: false
    // to update last_used_at + bump use_count.
    const { data: existing } = await this.supabase
      .from('food_history')
      .select('use_count')
      .eq('user_id', userId)
      .eq('food_id', dto.food_id)
      .maybeSingle();

    const useCount = (existing?.use_count ?? 0) + 1;

    const { error } = await this.supabase.from('food_history').upsert(
      {
        user_id: userId,
        food_id: dto.food_id,
        food_name: dto.food_name,
        image_url: dto.image_url ?? null,
        calories: dto.calories ?? 0,
        protein: dto.protein ?? 0,
        carbs: dto.carbs ?? 0,
        fat: dto.fat ?? 0,
        use_count: useCount,
        last_used_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,food_id' },
    );

    if (error) throw error;
    return { ok: true, useCount };
  }
}

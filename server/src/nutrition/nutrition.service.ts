import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CreateMealDto } from './dto/create-meal.dto';
import { UpdateGoalsDto } from './dto/update-goals.dto';
import { UpsertDailyDto } from './dto/upsert-daily.dto';
import { RecordFoodHistoryDto } from './dto/record-food-history.dto';
import { UpsertFoodCustomValuesDto } from './dto/upsert-food-custom-values.dto';
import {
  ageFromDateOfBirth,
  computeNutritionGoals,
} from './nutrition.utils';

import { SubmitFoodCorrectionDto } from './dto/submit-food-correction.dto';
import { ReviewFoodCorrectionDto } from './dto/review-food-correction.dto';

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

    if (dto.weight_kg !== undefined && dto.weight_kg !== null) {
      await Promise.all([
        this.supabase
          .from('user_profiles')
          .update({ weight_kg: dto.weight_kg })
          .eq('id', userId),
        this.supabase
          .from('weight_entries')
          .upsert(
            {
              user_id: userId,
              entry_date: dto.date,
              weight_kg: dto.weight_kg,
            },
            { onConflict: 'user_id,entry_date' },
          ),
      ]).catch(() => {});
    }

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
    if (data) return data;

    // No goals row yet — derive a personalized target from the user profile
    // so KPIs reflect real numbers instead of a generic 2200 kcal default.
    const { data: profile } = await this.supabase
      .from('user_profiles')
      .select(
        'height_cm, weight_kg, date_of_birth, gender, fitness_goal, workout_frequency, experience_level',
      )
      .eq('id', userId)
      .maybeSingle();

    const computed = computeNutritionGoals({
      weightKg: profile?.weight_kg,
      heightCm: profile?.height_cm,
      age: ageFromDateOfBirth(profile?.date_of_birth),
      gender: profile?.gender,
      workoutFrequency: profile?.workout_frequency,
      activityLevel: profile?.experience_level,
      weightGoal: profile?.fitness_goal,
    });

    return { user_id: userId, ...computed };
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

  // ── Custom food values ────────────────────────────────────────────────

  async getFoodCustomValues(userId: string, foodId: string) {
    const { data, error } = await this.supabase
      .from('food_custom_values')
      .select('*')
      .eq('user_id', userId)
      .eq('food_id', foodId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    return {
      foodId: data.food_id,
      foodName: data.food_name,
      calories: Number(data.calories) || 0,
      protein: Number(data.protein) || 0,
      carbs: Number(data.carbs) || 0,
      fat: Number(data.fat) || 0,
    };
  }

  async upsertFoodCustomValues(userId: string, dto: UpsertFoodCustomValuesDto) {
    const { error } = await this.supabase.from('food_custom_values').upsert(
      {
        user_id: userId,
        food_id: dto.food_id,
        food_name: dto.food_name,
        calories: dto.calories,
        protein: dto.protein,
        carbs: dto.carbs,
        fat: dto.fat,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,food_id' },
    );

    if (error) throw error;
    return { ok: true };
  }

  // ── Food Corrections & Moderation ─────────────────────────────────────

  async submitFoodCorrection(userId: string, dto: SubmitFoodCorrectionDto) {
    // 1. Submit pending correction for admin moderation
    const { data: correction, error: correctionError } = await this.supabase
      .from('food_corrections')
      .insert({
        user_id: userId,
        food_id: dto.food_id,
        food_name: dto.food_name,
        brand: dto.brand ?? null,
        image_url: dto.image_url ?? null,
        original_calories: dto.original_calories ?? 0,
        original_protein: dto.original_protein ?? 0,
        original_carbs: dto.original_carbs ?? 0,
        original_fat: dto.original_fat ?? 0,
        original_sugars: dto.original_sugars ?? null,
        original_saturated_fat: dto.original_saturated_fat ?? null,
        original_monounsaturated_fat: dto.original_monounsaturated_fat ?? null,
        original_polyunsaturated_fat: dto.original_polyunsaturated_fat ?? null,
        original_trans_fat: dto.original_trans_fat ?? null,
        original_cholesterol: dto.original_cholesterol ?? null,
        original_polyols: dto.original_polyols ?? null,
        original_starch: dto.original_starch ?? null,
        original_alcohol: dto.original_alcohol ?? null,
        original_water: dto.original_water ?? null,
        original_caffeine: dto.original_caffeine ?? null,
        original_potassium: dto.original_potassium ?? null,
        original_calcium: dto.original_calcium ?? null,
        original_magnesium: dto.original_magnesium ?? null,
        original_iron: dto.original_iron ?? null,
        original_zinc: dto.original_zinc ?? null,
        original_phosphorus: dto.original_phosphorus ?? null,
        original_vitamin_a: dto.original_vitamin_a ?? null,
        original_vitamin_b1: dto.original_vitamin_b1 ?? null,
        original_vitamin_b2: dto.original_vitamin_b2 ?? null,
        original_vitamin_b3: dto.original_vitamin_b3 ?? null,
        original_vitamin_b5: dto.original_vitamin_b5 ?? null,
        original_vitamin_b6: dto.original_vitamin_b6 ?? null,
        original_vitamin_b7: dto.original_vitamin_b7 ?? null,
        original_vitamin_b9: dto.original_vitamin_b9 ?? null,
        original_vitamin_b12: dto.original_vitamin_b12 ?? null,
        original_vitamin_c: dto.original_vitamin_c ?? null,
        original_vitamin_d: dto.original_vitamin_d ?? null,
        original_vitamin_e: dto.original_vitamin_e ?? null,
        original_vitamin_k: dto.original_vitamin_k ?? null,
        original_fiber: dto.original_fiber ?? null,
        original_salt: dto.original_salt ?? null,
        original_serving_size: dto.original_serving_size ?? null,
        calories: dto.calories,
        protein: dto.protein,
        carbs: dto.carbs,
        fat: dto.fat,
        sugars: dto.sugars ?? null,
        saturated_fat: dto.saturated_fat ?? null,
        monounsaturated_fat: dto.monounsaturated_fat ?? null,
        polyunsaturated_fat: dto.polyunsaturated_fat ?? null,
        trans_fat: dto.trans_fat ?? null,
        cholesterol: dto.cholesterol ?? null,
        polyols: dto.polyols ?? null,
        starch: dto.starch ?? null,
        alcohol: dto.alcohol ?? null,
        water: dto.water ?? null,
        caffeine: dto.caffeine ?? null,
        potassium: dto.potassium ?? null,
        calcium: dto.calcium ?? null,
        magnesium: dto.magnesium ?? null,
        iron: dto.iron ?? null,
        zinc: dto.zinc ?? null,
        phosphorus: dto.phosphorus ?? null,
        vitamin_a: dto.vitamin_a ?? null,
        vitamin_b1: dto.vitamin_b1 ?? null,
        vitamin_b2: dto.vitamin_b2 ?? null,
        vitamin_b3: dto.vitamin_b3 ?? null,
        vitamin_b5: dto.vitamin_b5 ?? null,
        vitamin_b6: dto.vitamin_b6 ?? null,
        vitamin_b7: dto.vitamin_b7 ?? null,
        vitamin_b9: dto.vitamin_b9 ?? null,
        vitamin_b12: dto.vitamin_b12 ?? null,
        vitamin_c: dto.vitamin_c ?? null,
        vitamin_d: dto.vitamin_d ?? null,
        vitamin_e: dto.vitamin_e ?? null,
        vitamin_k: dto.vitamin_k ?? null,
        fiber: dto.fiber ?? null,
        salt: dto.salt ?? null,
        serving_size: dto.serving_size ?? null,
        status: 'pending',
      })
      .select()
      .single();

    // 2. Also keep user's personal draft values updated
    await this.supabase.from('food_custom_values').upsert(
      {
        user_id: userId,
        food_id: dto.food_id,
        food_name: dto.food_name,
        calories: dto.calories,
        protein: dto.protein,
        carbs: dto.carbs,
        fat: dto.fat,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,food_id' },
    );

    if (correctionError && correctionError.code !== '42P01') {
      this.logger.warn(`Could not insert food_correction: ${correctionError.message}`);
    }

    return { ok: true, correctionId: correction?.id, status: 'pending' };
  }

  async getAdminFoodCorrections(status?: string, limit = 50) {
    let query = this.supabase
      .from('food_corrections')
      .select(
        `*,
        user:user_profiles!food_corrections_user_id_fkey(id, username, display_name, avatar_url)`,
      )
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) {
      // If table does not exist yet, fallback gracefully
      this.logger.warn(`getAdminFoodCorrections query failed: ${error.message}`);
      return { corrections: [], stats: { total: 0, pending: 0, approved: 0, rejected: 0 } };
    }

    // Get count stats
    const { data: allItems } = await this.supabase
      .from('food_corrections')
      .select('status');

    const stats = {
      total: allItems?.length ?? 0,
      pending: allItems?.filter((i) => i.status === 'pending').length ?? 0,
      approved: allItems?.filter((i) => i.status === 'approved').length ?? 0,
      rejected: allItems?.filter((i) => i.status === 'rejected').length ?? 0,
    };

    return { corrections: data ?? [], stats };
  }

  async reviewFoodCorrection(
    adminId: string,
    correctionId: string,
    dto: ReviewFoodCorrectionDto,
  ) {
    const status = dto.action === 'approve' ? 'approved' : 'rejected';

    const { data: correction, error: fetchError } = await this.supabase
      .from('food_corrections')
      .select('*')
      .eq('id', correctionId)
      .single();

    if (fetchError || !correction) {
      throw new Error(`Correction not found: ${fetchError?.message}`);
    }

    // Update status in food_corrections
    const { error: updateError } = await this.supabase
      .from('food_corrections')
      .update({
        status,
        rejection_reason: dto.rejection_reason ?? null,
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', correctionId);

    if (updateError) throw updateError;

    // If approved, push to verified_food_values table
    if (status === 'approved') {
      await this.supabase.from('verified_food_values').upsert(
        {
          food_id: correction.food_id,
          food_name: correction.food_name,
          brand: correction.brand ?? null,
          image_url: correction.image_url ?? null,
          calories: correction.calories,
          protein: correction.protein,
          carbs: correction.carbs,
          fat: correction.fat,
          sugars: correction.sugars ?? null,
          saturated_fat: correction.saturated_fat ?? null,
          monounsaturated_fat: correction.monounsaturated_fat ?? null,
          polyunsaturated_fat: correction.polyunsaturated_fat ?? null,
          trans_fat: correction.trans_fat ?? null,
          cholesterol: correction.cholesterol ?? null,
          polyols: correction.polyols ?? null,
          starch: correction.starch ?? null,
          alcohol: correction.alcohol ?? null,
          water: correction.water ?? null,
          caffeine: correction.caffeine ?? null,
          potassium: correction.potassium ?? null,
          calcium: correction.calcium ?? null,
          magnesium: correction.magnesium ?? null,
          iron: correction.iron ?? null,
          zinc: correction.zinc ?? null,
          phosphorus: correction.phosphorus ?? null,
          vitamin_a: correction.vitamin_a ?? null,
          vitamin_b1: correction.vitamin_b1 ?? null,
          vitamin_b2: correction.vitamin_b2 ?? null,
          vitamin_b3: correction.vitamin_b3 ?? null,
          vitamin_b5: correction.vitamin_b5 ?? null,
          vitamin_b6: correction.vitamin_b6 ?? null,
          vitamin_b7: correction.vitamin_b7 ?? null,
          vitamin_b9: correction.vitamin_b9 ?? null,
          vitamin_b12: correction.vitamin_b12 ?? null,
          vitamin_c: correction.vitamin_c ?? null,
          vitamin_d: correction.vitamin_d ?? null,
          vitamin_e: correction.vitamin_e ?? null,
          vitamin_k: correction.vitamin_k ?? null,
          fiber: correction.fiber ?? null,
          salt: correction.salt ?? null,
          serving_size: correction.serving_size ?? null,
          verified_by: adminId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'food_id' },
      );
    }

    return { ok: true, id: correctionId, status };
  }
}

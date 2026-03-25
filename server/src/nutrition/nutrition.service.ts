import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CreateMealDto } from './dto/create-meal.dto';
import { UpdateGoalsDto } from './dto/update-goals.dto';
import { CreateCustomFoodDto } from './dto/create-custom-food.dto';

@Injectable()
export class NutritionService implements OnModuleInit {
  private supabase: SupabaseClient;
  private readonly logger = new Logger(NutritionService.name);
  private tablesReady = false;

  constructor(config: ConfigService) {
    this.supabase = createClient(
      config.get<string>('SUPABASE_URL')!,
      config.get<string>('SUPABASE_SERVICE_ROLE_KEY')!,
    );
  }

  async onModuleInit() {
    await this.ensureTables();
  }

  private async ensureTables(): Promise<void> {
    if (this.tablesReady) return;

    const { error } = await this.supabase.rpc('ensure_nutrition_tables');

    if (error) {
      this.logger.error('Failed to ensure nutrition tables', error.message);
    } else {
      this.tablesReady = true;
      this.logger.log('Nutrition tables are ready');
    }
  }

  private async run<T>(
    op: () => PromiseLike<{ data: T | null; error: any }>,
  ): Promise<{ data: T | null; error: any }> {
    await this.ensureTables();
    const result = await op();

    if (result.error?.code === '42P01') {
      this.logger.warn('Nutrition table missing — recreating and retrying...');
      this.tablesReady = false;
      await this.ensureTables();
      return op();
    }

    return result;
  }

  // ── Meals ──────────────────────────────────────────────────────────────

  async getMeals(userId: string, date: string) {
    const { data, error } = await this.run(() =>
      this.supabase
        .from('meal_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('date', date)
        .order('logged_at', { ascending: true }),
    );

    if (error) throw error;
    return data ?? [];
  }

  async getMealsRange(userId: string, startDate: string, endDate: string) {
    const { data, error } = await this.run(() =>
      this.supabase
        .from('meal_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true })
        .order('logged_at', { ascending: true }),
    );

    if (error) throw error;
    return data ?? [];
  }

  async addMeal(userId: string, dto: CreateMealDto) {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

    const { data, error } = await this.run(() =>
      this.supabase
        .from('meal_logs')
        .insert({
          id,
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
        .single(),
    );

    if (error) throw error;
    return data;
  }

  async deleteMeal(userId: string, mealId: string) {
    const { error } = await this.run(() =>
      this.supabase
        .from('meal_logs')
        .delete()
        .eq('id', mealId)
        .eq('user_id', userId),
    );

    if (error) throw error;
    return { deleted: true };
  }

  // ── Daily Summary ──────────────────────────────────────────────────────

  async getDailySummary(userId: string, date: string) {
    const meals = await this.getMeals(userId, date);

    const totals = meals.reduce(
      (acc, meal) => ({
        calories: acc.calories + (meal.calories ?? 0),
        protein: acc.protein + (meal.protein ?? 0),
        carbs: acc.carbs + (meal.carbs ?? 0),
        fat: acc.fat + (meal.fat ?? 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );

    return { date, ...totals, meals };
  }

  async getWeeklySummary(userId: string, startDate: string, endDate: string) {
    const meals = await this.getMealsRange(userId, startDate, endDate);

    // Group by date
    const byDate: Record<string, any[]> = {};
    for (const meal of meals) {
      if (!byDate[meal.date]) byDate[meal.date] = [];
      byDate[meal.date].push(meal);
    }

    return Object.entries(byDate).map(([date, dayMeals]) => ({
      date,
      calories: dayMeals.reduce((s, m) => s + (m.calories ?? 0), 0),
      protein: dayMeals.reduce((s, m) => s + (m.protein ?? 0), 0),
      carbs: dayMeals.reduce((s, m) => s + (m.carbs ?? 0), 0),
      fat: dayMeals.reduce((s, m) => s + (m.fat ?? 0), 0),
      meals: dayMeals,
    }));
  }

  // ── Goals ──────────────────────────────────────────────────────────────

  async getGoals(userId: string) {
    const { data, error } = await this.run(() =>
      this.supabase
        .from('user_nutrition_goals')
        .select('*')
        .eq('user_id', userId)
        .single(),
    );

    if (error?.code === 'PGRST116') {
      // No goals set yet — return defaults
      return {
        user_id: userId,
        calorie_goal: 2200,
        protein_goal: 150,
        carbs_goal: 250,
        fat_goal: 70,
      };
    }
    if (error) throw error;
    return data;
  }

  async updateGoals(userId: string, dto: UpdateGoalsDto) {
    const { data, error } = await this.run(() =>
      this.supabase
        .from('user_nutrition_goals')
        .upsert({
          user_id: userId,
          ...dto,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single(),
    );

    if (error) throw error;
    return data;
  }

  // ── Custom Foods ───────────────────────────────────────────────────────

  async getCustomFoods(userId: string) {
    const { data, error } = await this.run(() =>
      this.supabase
        .from('custom_foods')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
    );

    if (error) throw error;
    return data ?? [];
  }

  async createCustomFood(userId: string, dto: CreateCustomFoodDto) {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

    const { data, error } = await this.run(() =>
      this.supabase
        .from('custom_foods')
        .insert({
          id,
          user_id: userId,
          name: dto.name,
          calories: dto.calories,
          protein: dto.protein,
          carbs: dto.carbs,
          fat: dto.fat,
          serving_size: dto.serving_size ?? '100g',
        })
        .select()
        .single(),
    );

    if (error) throw error;
    return data;
  }

  async deleteCustomFood(userId: string, foodId: string) {
    const { error } = await this.run(() =>
      this.supabase
        .from('custom_foods')
        .delete()
        .eq('id', foodId)
        .eq('user_id', userId),
    );

    if (error) throw error;
    return { deleted: true };
  }
}

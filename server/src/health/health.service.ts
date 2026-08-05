import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { UpsertSnapshotDto } from './dto/upsert-snapshot.dto';
import { CreateWorkoutLogDto } from './dto/create-workout-log.dto';

@Injectable()
export class HealthService {
  private supabase: SupabaseClient;

  constructor(config: ConfigService) {
    this.supabase = createClient(
      config.get<string>('SUPABASE_URL')!,
      config.get<string>('SUPABASE_SERVICE_ROLE_KEY')!,
    );
  }

  // ── Daily Snapshots ────────────────────────────────────────────────────

  async getSnapshot(userId: string, date: string) {
    const { data, error } = await this.supabase
      .from('daily_health_snapshots')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .single();

    if (error?.code === 'PGRST116') {
      return {
        user_id: userId,
        date,
        steps: 0,
        calories_burned: 0,
        active_minutes: 0,
        distance_km: 0,
        water_ml: 0,
      };
    }
    if (error) throw error;
    return data;
  }

  async getSnapshotsRange(userId: string, startDate: string, endDate: string) {
    const { data, error } = await this.supabase
      .from('daily_health_snapshots')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (error) throw error;
    return data ?? [];
  }

  async upsertSnapshot(userId: string, dto: UpsertSnapshotDto) {
    const { data, error } = await this.supabase
      .from('daily_health_snapshots')
      .upsert({
        user_id: userId,
        date: dto.date,
        steps: dto.steps,
        calories_burned: dto.calories_burned,
        active_minutes: dto.active_minutes ?? 0,
        distance_km: dto.distance_km ?? 0,
        water_ml: dto.water_ml ?? 0,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,date' })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // ── Workout Logs ───────────────────────────────────────────────────────

  async getWorkouts(userId: string, date: string) {
    const { data, error } = await this.supabase
      .from('workout_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .order('start_time', { ascending: true });

    if (error) throw error;
    return data ?? [];
  }

  async getWorkoutsRange(userId: string, startDate: string, endDate: string) {
    const { data, error } = await this.supabase
      .from('workout_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (error) throw error;
    return data ?? [];
  }

  async addWorkout(userId: string, dto: CreateWorkoutLogDto) {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

    const { data, error } = await this.supabase
      .from('workout_logs')
      .insert({
        id,
        user_id: userId,
        name: dto.name,
        workout_type: dto.workout_type ?? 'general',
        date: dto.date,
        start_time: dto.start_time ?? null,
        end_time: dto.end_time ?? null,
        duration_minutes: dto.duration_minutes,
        calories_burned: dto.calories_burned,
        source: dto.source ?? 'manual',
        routine_id: dto.routine_id ?? null,
        total_volume_kg: dto.total_volume_kg ?? 0,
        total_sets: dto.total_sets ?? 0,
        completed_sets: dto.completed_sets ?? 0,
        exercise_count: dto.exercise_count ?? 0,
        exercises: dto.exercises ?? null,
        notes: dto.notes ?? null,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getWorkoutsHistory(
    userId: string,
    limit: number,
    before: string | null,
  ) {
    let query = this.supabase
      .from('workout_logs')
      .select(
        'id, name, date, start_time, end_time, duration_minutes, calories_burned, source, routine_id, total_volume_kg, total_sets, completed_sets, exercise_count, exercises, created_at',
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (before) {
      query = query.lt('created_at', before);
    }

    const { data, error } = await query;
    if (error) throw error;

    const rows = data ?? [];
    const nextCursor =
      rows.length === limit ? rows[rows.length - 1].created_at : null;
    return { items: rows, nextCursor };
  }

  async getWorkoutDetail(userId: string, workoutId: string) {
    const { data, error } = await this.supabase
      .from('workout_logs')
      .select('*')
      .eq('id', workoutId)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  }

  async deleteWorkout(userId: string, workoutId: string) {
    const { error } = await this.supabase
      .from('workout_logs')
      .delete()
      .eq('id', workoutId)
      .eq('user_id', userId);

    if (error) throw error;
    return { deleted: true };
  }
}

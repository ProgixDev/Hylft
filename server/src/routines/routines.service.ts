import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CreateRoutineDto } from './dto/create-routine.dto';
import { UpdateRoutineDto } from './dto/update-routine.dto';

@Injectable()
export class RoutinesService {
  private supabase: SupabaseClient;

  constructor(config: ConfigService) {
    this.supabase = createClient(
      config.get<string>('SUPABASE_URL')!,
      config.get<string>('SUPABASE_SERVICE_ROLE_KEY')!,
    );
  }

  async getRoutines(userId: string) {
    const { data, error } = await this.supabase
      .from('routines')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
  }

  async getRoutine(userId: string, routineId: string) {
    const { data, error } = await this.supabase
      .from('routines')
      .select('*')
      .eq('id', routineId)
      .eq('user_id', userId)
      .single();

    if (error?.code === 'PGRST116') throw new NotFoundException('Routine not found');
    if (error) throw error;
    return data;
  }

  async createRoutine(userId: string, dto: CreateRoutineDto) {
    const id = `routine-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

    const { data, error } = await this.supabase
      .from('routines')
      .insert({
        id,
        user_id: userId,
        name: dto.name,
        description: dto.description ?? '',
        difficulty: dto.difficulty,
        target_muscles: dto.targetMuscles ?? [],
        exercises: dto.exercises,
        estimated_duration: dto.estimatedDuration ?? 0,
        times_completed: 0,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateRoutine(userId: string, routineId: string, dto: UpdateRoutineDto) {
    const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.difficulty !== undefined) updateData.difficulty = dto.difficulty;
    if (dto.targetMuscles !== undefined) updateData.target_muscles = dto.targetMuscles;
    if (dto.exercises !== undefined) updateData.exercises = dto.exercises;
    if (dto.estimatedDuration !== undefined) updateData.estimated_duration = dto.estimatedDuration;

    const { data, error } = await this.supabase
      .from('routines')
      .update(updateData)
      .eq('id', routineId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error?.code === 'PGRST116') throw new NotFoundException('Routine not found');
    if (error) throw error;
    return data;
  }

  async deleteRoutine(userId: string, routineId: string) {
    const { error } = await this.supabase
      .from('routines')
      .delete()
      .eq('id', routineId)
      .eq('user_id', userId);

    if (error) throw error;
    return { deleted: true };
  }

  async incrementCompleted(userId: string, routineId: string) {
    const routine = await this.getRoutine(userId, routineId);
    const newCount = ((routine as any)?.times_completed ?? 0) + 1;

    const { data, error } = await this.supabase
      .from('routines')
      .update({
        times_completed: newCount,
        last_used: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', routineId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

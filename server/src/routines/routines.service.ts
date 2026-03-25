import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CreateRoutineDto } from './dto/create-routine.dto';
import { UpdateRoutineDto } from './dto/update-routine.dto';

@Injectable()
export class RoutinesService implements OnModuleInit {
  private supabase: SupabaseClient;
  private readonly logger = new Logger(RoutinesService.name);
  private tableReady = false;

  constructor(config: ConfigService) {
    this.supabase = createClient(
      config.get<string>('SUPABASE_URL')!,
      config.get<string>('SUPABASE_SERVICE_ROLE_KEY')!,
    );
  }

  async onModuleInit() {
    await this.ensureTable();
  }

  private async ensureTable(): Promise<void> {
    if (this.tableReady) return;

    const { error } = await this.supabase.rpc('ensure_routines_table');

    if (error) {
      this.logger.error('Failed to ensure routines table', error.message);
    } else {
      this.tableReady = true;
      this.logger.log('Routines table is ready');
    }
  }

  private async run<T>(
    op: () => PromiseLike<{ data: T | null; error: any }>,
  ): Promise<{ data: T | null; error: any }> {
    await this.ensureTable();
    const result = await op();

    if (result.error?.code === '42P01') {
      this.logger.warn('Routines table missing — recreating and retrying...');
      this.tableReady = false;
      await this.ensureTable();
      return op();
    }

    return result;
  }

  async getRoutines(userId: string) {
    const { data, error } = await this.run(() =>
      this.supabase
        .from('routines')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
    );

    if (error) throw error;
    return data ?? [];
  }

  async getRoutine(userId: string, routineId: string) {
    const { data, error } = await this.run(() =>
      this.supabase
        .from('routines')
        .select('*')
        .eq('id', routineId)
        .eq('user_id', userId)
        .single(),
    );

    if (error?.code === 'PGRST116') throw new NotFoundException('Routine not found');
    if (error) throw error;
    return data;
  }

  async createRoutine(userId: string, dto: CreateRoutineDto) {
    const id = `routine-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

    const { data, error } = await this.run(() =>
      this.supabase
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
        .single(),
    );

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

    const { data, error } = await this.run(() =>
      this.supabase
        .from('routines')
        .update(updateData)
        .eq('id', routineId)
        .eq('user_id', userId)
        .select()
        .single(),
    );

    if (error?.code === 'PGRST116') throw new NotFoundException('Routine not found');
    if (error) throw error;
    return data;
  }

  async deleteRoutine(userId: string, routineId: string) {
    const { error } = await this.run(() =>
      this.supabase
        .from('routines')
        .delete()
        .eq('id', routineId)
        .eq('user_id', userId),
    );

    if (error) throw error;
    return { deleted: true };
  }

  async incrementCompleted(userId: string, routineId: string) {
    // Get current count, then increment
    const routine = await this.getRoutine(userId, routineId);
    const newCount = ((routine as any)?.times_completed ?? 0) + 1;

    const { data, error } = await this.run(() =>
      this.supabase
        .from('routines')
        .update({
          times_completed: newCount,
          last_used: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', routineId)
        .eq('user_id', userId)
        .select()
        .single(),
    );

    if (error) throw error;
    return data;
  }
}

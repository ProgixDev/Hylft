import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import { CreateRoutineDto } from './dto/create-routine.dto';
import { UpdateRoutineDto } from './dto/update-routine.dto';

const COVERS_BUCKET = 'covers';
const ALLOWED_COVER_EXTS = ['jpg', 'jpeg', 'png', 'webp', 'heic'] as const;

@Injectable()
export class RoutinesService {
  private supabase: SupabaseClient;
  private supabaseUrl: string;

  constructor(config: ConfigService) {
    this.supabaseUrl = config.get<string>('SUPABASE_URL')!;
    this.supabase = createClient(
      this.supabaseUrl,
      config.get<string>('SUPABASE_SERVICE_ROLE_KEY')!,
    );
  }

  async getRoutines(userId: string) {
    const { data, error } = await this.supabase
      .from('routines')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
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
      .is('deleted_at', null)
      .single();

    if (error?.code === 'PGRST116') {
      const { data: adminRoutine, error: adminError } = await this.supabase
        .from('routines')
        .select('*')
        .eq('id', routineId)
        .eq('is_admin_routine', true)
        .eq('is_public', true)
        .is('deleted_at', null)
        .single();

      if (adminError?.code === 'PGRST116')
        throw new NotFoundException('Routine not found');
      if (adminError) throw adminError;
      return adminRoutine;
    }
    if (error) throw error;
    return data;
  }

  async getAdminRoutines(category?: string, subCategory?: string) {
    let query = this.supabase
      .from('routines')
      .select('*')
      .eq('is_admin_routine', true)
      .eq('is_public', true)
      .is('deleted_at', null)
      .order('category', { ascending: true })
      .order('sub_category', { ascending: true })
      .order('estimated_duration', { ascending: true });

    if (category) query = query.eq('category', category);
    if (subCategory) query = query.eq('sub_category', subCategory);

    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  }

  async createRoutine(userId: string, dto: CreateRoutineDto) {
    const id = `routine-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

    const insertData: Record<string, any> = {
      id,
      user_id: userId,
      name: dto.name,
      description: dto.description ?? '',
      target_muscles: dto.targetMuscles ?? [],
      exercises: dto.exercises,
      estimated_duration: dto.estimatedDuration ?? 0,
      times_completed: 0,
    };
    if (dto.wallpaperUrl) insertData.wallpaper_url = dto.wallpaperUrl;

    const { data, error } = await this.supabase
      .from('routines')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateRoutine(userId: string, routineId: string, dto: UpdateRoutineDto) {
    const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.targetMuscles !== undefined) updateData.target_muscles = dto.targetMuscles;
    if (dto.exercises !== undefined) updateData.exercises = dto.exercises;
    if (dto.estimatedDuration !== undefined) updateData.estimated_duration = dto.estimatedDuration;
    if (dto.wallpaperUrl !== undefined) updateData.wallpaper_url = dto.wallpaperUrl;

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

  async signCoverUpload(userId: string, ext?: string) {
    const finalExt = (ext ?? 'jpg').toLowerCase();
    if (!ALLOWED_COVER_EXTS.includes(finalExt as (typeof ALLOWED_COVER_EXTS)[number])) {
      throw new BadRequestException('Unsupported image extension');
    }
    const storage_path = `user/${userId}/${Date.now()}-${randomUUID()}.${finalExt}`;
    const { data, error } = await this.supabase.storage
      .from(COVERS_BUCKET)
      .createSignedUploadUrl(storage_path);
    if (error) throw error;
    const public_url = `${this.supabaseUrl}/storage/v1/object/public/${COVERS_BUCKET}/${storage_path}`;
    return {
      bucket: COVERS_BUCKET,
      storage_path,
      signed_url: data.signedUrl,
      token: data.token,
      public_url,
    };
  }

  async incrementCompleted(userId: string, routineId: string) {
    const routine = await this.getRoutine(userId, routineId);
    const newCount = ((routine as any)?.times_completed ?? 0) + 1;

    const payload = {
      times_completed: newCount,
      last_used: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = (routine as any)?.is_admin_routine
      ? await this.supabase
          .from('routines')
          .update(payload)
          .eq('id', routineId)
          .eq('is_admin_routine', true)
          .select()
          .single()
      : await this.supabase
          .from('routines')
          .update(payload)
          .eq('id', routineId)
          .eq('user_id', userId)
          .select()
          .single();

    if (error) throw error;
    return data;
  }
}

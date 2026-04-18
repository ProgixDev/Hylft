import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { UpsertAssignmentDto } from './dto/upsert-assignment.dto';

@Injectable()
export class ScheduleService {
  private supabase: SupabaseClient;

  constructor(config: ConfigService) {
    this.supabase = createClient(
      config.get<string>('SUPABASE_URL')!,
      config.get<string>('SUPABASE_SERVICE_ROLE_KEY')!,
    );
  }

  async list(userId: string) {
    const { data, error } = await this.supabase
      .from('schedule_assignments')
      .select('*')
      .eq('user_id', userId)
      .order('day_of_week', { ascending: true });
    if (error) throw error;
    return { items: data ?? [] };
  }

  async upsert(userId: string, dayOfWeek: number, dto: UpsertAssignmentDto) {
    if (dayOfWeek < 0 || dayOfWeek > 6)
      throw new BadRequestException('day_of_week must be 0-6');
    if (dto.is_rest_day && dto.routine_id)
      throw new BadRequestException('Rest day cannot have a routine_id');
    if (!dto.is_rest_day && !dto.routine_id)
      throw new BadRequestException('Non-rest day requires a routine_id');

    const { data, error } = await this.supabase
      .from('schedule_assignments')
      .upsert(
        {
          user_id: userId,
          day_of_week: dayOfWeek,
          is_rest_day: dto.is_rest_day,
          routine_id: dto.is_rest_day ? null : dto.routine_id,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,day_of_week' },
      )
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async remove(userId: string, dayOfWeek: number) {
    const { error } = await this.supabase
      .from('schedule_assignments')
      .delete()
      .eq('user_id', userId)
      .eq('day_of_week', dayOfWeek);
    if (error) throw error;
    return { deleted: true };
  }
}

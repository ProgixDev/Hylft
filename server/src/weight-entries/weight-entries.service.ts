import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { UpsertWeightDto } from './dto/upsert-weight.dto';

@Injectable()
export class WeightEntriesService {
  private supabase: SupabaseClient;

  constructor(config: ConfigService) {
    this.supabase = createClient(
      config.get<string>('SUPABASE_URL')!,
      config.get<string>('SUPABASE_SERVICE_ROLE_KEY')!,
    );
  }

  async listRange(userId: string, start?: string, end?: string, limit = 365) {
    let q = this.supabase
      .from('weight_entries')
      .select('*')
      .eq('user_id', userId)
      .order('entry_date', { ascending: false })
      .limit(limit);
    if (start) q = q.gte('entry_date', start);
    if (end) q = q.lte('entry_date', end);
    const { data, error } = await q;
    if (error) throw error;
    return { items: data ?? [] };
  }

  async upsert(userId: string, dto: UpsertWeightDto) {
    const { data, error } = await this.supabase
      .from('weight_entries')
      .upsert(
        {
          user_id: userId,
          entry_date: dto.entry_date,
          weight_kg: dto.weight_kg,
          note: dto.note ?? null,
        },
        { onConflict: 'user_id,entry_date' },
      )
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async remove(userId: string, entryDate: string) {
    const { data, error } = await this.supabase
      .from('weight_entries')
      .delete()
      .eq('user_id', userId)
      .eq('entry_date', entryDate)
      .select('id')
      .single();
    if (error?.code === 'PGRST116')
      throw new NotFoundException('Weight entry not found');
    if (error) throw error;
    return { deleted: true, id: (data as { id: string }).id };
  }
}

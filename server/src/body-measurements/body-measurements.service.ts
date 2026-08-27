import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { UpsertBodyMeasurementDto } from './dto/upsert-body-measurement.dto';

@Injectable()
export class BodyMeasurementsService {
  private supabase: SupabaseClient;

  constructor(config: ConfigService) {
    this.supabase = createClient(
      config.get<string>('SUPABASE_URL')!,
      config.get<string>('SUPABASE_SERVICE_ROLE_KEY')!,
    );
  }

  async listAll(
    userId: string,
    metric?: string,
    start?: string,
    end?: string,
    limit = 365,
  ) {
    let q = this.supabase
      .from('body_measurements')
      .select('*')
      .eq('user_id', userId)
      .order('measurement_date', { ascending: false })
      .limit(limit);
    if (metric) q = q.eq('metric', metric);
    if (start) q = q.gte('measurement_date', start);
    if (end) q = q.lte('measurement_date', end);
    const { data, error } = await q;
    if (error) throw error;
    return { items: data ?? [] };
  }

  async getLatest(userId: string) {
    const { data, error } = await this.supabase
      .from('body_measurements')
      .select('*')
      .eq('user_id', userId)
      .order('measurement_date', { ascending: false });
    if (error) throw error;

    // Deduplicate: keep first (most recent) entry per metric
    const seen = new Set<string>();
    const latest = (data ?? []).filter((row) => {
      if (seen.has(row.metric)) return false;
      seen.add(row.metric);
      return true;
    });
    return { items: latest };
  }

  async upsert(userId: string, dto: UpsertBodyMeasurementDto) {
    const { data, error } = await this.supabase
      .from('body_measurements')
      .upsert(
        {
          user_id: userId,
          metric: dto.metric,
          value: dto.value,
          measurement_date: dto.measurement_date,
        },
        { onConflict: 'user_id,metric,measurement_date' },
      )
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async bulkUpsert(
    userId: string,
    entries: { metric: string; value: number; measurement_date: string }[],
  ) {
    if (entries.length === 0) return { count: 0 };
    const rows = entries.map((e) => ({
      user_id: userId,
      metric: e.metric,
      value: e.value,
      measurement_date: e.measurement_date,
    }));
    const { data, error } = await this.supabase
      .from('body_measurements')
      .upsert(rows, { onConflict: 'user_id,metric,measurement_date' })
      .select('id');
    if (error) throw error;
    return { count: (data ?? []).length };
  }

  async remove(userId: string, id: string) {
    const { data, error } = await this.supabase
      .from('body_measurements')
      .delete()
      .eq('user_id', userId)
      .eq('id', id)
      .select('id')
      .single();
    if (error?.code === 'PGRST116')
      throw new NotFoundException('Body measurement not found');
    if (error) throw error;
    return { deleted: true, id: (data as { id: string }).id };
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ListExercisesQueryDto } from './dto/list-exercises-query.dto';

@Injectable()
export class ExercisesService {
  private supabase: SupabaseClient;

  constructor(config: ConfigService) {
    this.supabase = createClient(
      config.get<string>('SUPABASE_URL')!,
      config.get<string>('SUPABASE_SERVICE_ROLE_KEY')!,
    );
  }

  async list(q: ListExercisesQueryDto) {
    const limit = q.limit ?? 50;
    let query = this.supabase
      .from('exercises')
      .select('*')
      .order('name', { ascending: true })
      .limit(limit);

    if (q.body_part) query = query.eq('body_part', q.body_part);
    if (q.equipment) query = query.eq('equipment', q.equipment);
    if (q.difficulty) query = query.eq('difficulty', q.difficulty);
    if (q.search) query = query.ilike('name', `%${q.search}%`);
    if (q.cursor) query = query.gt('name', q.cursor);

    const { data, error } = await query;
    if (error) throw error;
    const rows = (data ?? []) as Array<{ name: string }>;
    return {
      items: rows,
      next_cursor: rows.length === limit ? rows[rows.length - 1].name : null,
    };
  }

  async byId(id: string) {
    const { data, error } = await this.supabase
      .from('exercises')
      .select('*')
      .eq('id', id)
      .single();
    if (error?.code === 'PGRST116')
      throw new NotFoundException('Exercise not found');
    if (error) throw error;
    return data;
  }

  async byExternalId(externalId: string) {
    const { data, error } = await this.supabase
      .from('exercises')
      .select('*')
      .eq('external_id', externalId)
      .single();
    if (error?.code === 'PGRST116')
      throw new NotFoundException('Exercise not found');
    if (error) throw error;
    return data;
  }

  async bodyParts() {
    const { data, error } = await this.supabase
      .from('exercises')
      .select('body_part')
      .order('body_part', { ascending: true });
    if (error) throw error;
    const set = new Set<string>();
    for (const r of (data ?? []) as Array<{ body_part: string }>) {
      if (r.body_part) set.add(r.body_part);
    }
    return { items: Array.from(set) };
  }

  async equipments() {
    const { data, error } = await this.supabase
      .from('exercises')
      .select('equipment')
      .order('equipment', { ascending: true });
    if (error) throw error;
    const set = new Set<string>();
    for (const r of (data ?? []) as Array<{ equipment: string }>) {
      if (r.equipment) set.add(r.equipment);
    }
    return { items: Array.from(set) };
  }
}

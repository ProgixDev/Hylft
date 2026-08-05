import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class NotificationsService {
  private supabase: SupabaseClient;

  constructor(config: ConfigService) {
    this.supabase = createClient(
      config.get<string>('SUPABASE_URL')!,
      config.get<string>('SUPABASE_SERVICE_ROLE_KEY')!,
    );
  }

  async list(userId: string, unreadOnly: boolean, limit: number, cursor?: string) {
    let q = this.supabase
      .from('notifications')
      .select(
        `id, type, target_type, target_id, read_at, created_at,
         actor:user_profiles!notifications_actor_id_fkey(id, username, display_name, avatar_url)`,
      )
      .eq('recipient_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (unreadOnly) q = q.is('read_at', null);
    if (cursor) q = q.lt('created_at', cursor);
    const { data, error } = await q;
    if (error) throw error;
    const rows = (data ?? []) as Array<{ created_at: string }>;
    return {
      items: rows,
      next_cursor:
        rows.length === limit ? rows[rows.length - 1].created_at : null,
    };
  }

  async unreadCount(userId: string) {
    const { count, error } = await this.supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', userId)
      .is('read_at', null);
    if (error) throw error;
    return { unread: count ?? 0 };
  }

  async markRead(userId: string, id: string) {
    const now = new Date().toISOString();
    const { data, error } = await this.supabase
      .from('notifications')
      .update({ read_at: now })
      .eq('id', id)
      .eq('recipient_id', userId)
      .is('read_at', null)
      .select()
      .single();
    if (error?.code === 'PGRST116')
      throw new NotFoundException('Notification not found');
    if (error) throw error;
    return data;
  }

  async markAllRead(userId: string) {
    const now = new Date().toISOString();
    const { error } = await this.supabase
      .from('notifications')
      .update({ read_at: now })
      .eq('recipient_id', userId)
      .is('read_at', null);
    if (error) throw error;
    return { ok: true };
  }

  async remove(userId: string, id: string) {
    const { error } = await this.supabase
      .from('notifications')
      .delete()
      .eq('id', id)
      .eq('recipient_id', userId);
    if (error) throw error;
    return { deleted: true };
  }
}

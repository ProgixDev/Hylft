import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

type FollowRequestStatus = 'pending' | 'accepted' | 'rejected';

@Injectable()
export class SocialService {
  private supabase: SupabaseClient;

  constructor(config: ConfigService) {
    this.supabase = createClient(
      config.get<string>('SUPABASE_URL')!,
      config.get<string>('SUPABASE_SERVICE_ROLE_KEY')!,
    );
  }

  async follow(followerId: string, followeeId: string) {
    if (followerId === followeeId)
      throw new BadRequestException('Cannot follow yourself');

    const { data: target, error: tErr } = await this.supabase
      .from('user_profiles')
      .select('id, is_private')
      .eq('id', followeeId)
      .single();
    if (tErr?.code === 'PGRST116') throw new NotFoundException('User not found');
    if (tErr) throw tErr;

    if ((target as { is_private: boolean }).is_private) {
      const { error } = await this.supabase
        .from('follow_requests')
        .upsert(
          { requester_id: followerId, target_id: followeeId, status: 'pending' },
          { onConflict: 'requester_id,target_id' },
        );
      if (error) throw error;
      return { state: 'pending' as const };
    }

    const { error } = await this.supabase
      .from('follows')
      .insert({ follower_id: followerId, followee_id: followeeId });
    if (error && (error as { code?: string }).code !== '23505') throw error;
    return { state: 'following' as const };
  }

  async unfollow(followerId: string, followeeId: string) {
    const { error: fErr } = await this.supabase
      .from('follows')
      .delete()
      .eq('follower_id', followerId)
      .eq('followee_id', followeeId);
    if (fErr) throw fErr;
    // Also remove any pending/rejected request record for cleanliness.
    const { error: rErr } = await this.supabase
      .from('follow_requests')
      .delete()
      .eq('requester_id', followerId)
      .eq('target_id', followeeId);
    if (rErr) throw rErr;
    return { state: 'not_following' as const };
  }

  async stats(userId: string) {
    const [followers, following] = await Promise.all([
      this.supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('followee_id', userId),
      this.supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId),
    ]);
    if (followers.error) throw followers.error;
    if (following.error) throw following.error;
    return {
      followers_count: followers.count ?? 0,
      following_count: following.count ?? 0,
    };
  }

  async listFollowers(userId: string, limit = 50, cursor?: string) {
    let q = this.supabase
      .from('follows')
      .select(
        `created_at, follower:user_profiles!follows_follower_id_fkey(id, username, display_name, avatar_url, is_private)`,
      )
      .eq('followee_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (cursor) q = q.lt('created_at', cursor);
    const { data, error } = await q;
    if (error) throw error;
    return {
      items: data ?? [],
      next_cursor:
        data && data.length === limit
          ? (data[data.length - 1] as { created_at: string }).created_at
          : null,
    };
  }

  async listFollowing(userId: string, limit = 50, cursor?: string) {
    let q = this.supabase
      .from('follows')
      .select(
        `created_at, followee:user_profiles!follows_followee_id_fkey(id, username, display_name, avatar_url, is_private)`,
      )
      .eq('follower_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (cursor) q = q.lt('created_at', cursor);
    const { data, error } = await q;
    if (error) throw error;
    return {
      items: data ?? [],
      next_cursor:
        data && data.length === limit
          ? (data[data.length - 1] as { created_at: string }).created_at
          : null,
    };
  }

  async isFollowing(followerId: string, followeeId: string) {
    const { data, error } = await this.supabase
      .from('follows')
      .select('follower_id')
      .eq('follower_id', followerId)
      .eq('followee_id', followeeId)
      .maybeSingle();
    if (error) throw error;
    return { is_following: !!data };
  }

  // ── follow_requests ────────────────────────────────────────────────────

  async listIncomingRequests(userId: string) {
    const { data, error } = await this.supabase
      .from('follow_requests')
      .select(
        `created_at, status, requester:user_profiles!follow_requests_requester_id_fkey(id, username, display_name, avatar_url)`,
      )
      .eq('target_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return { items: data ?? [] };
  }

  async respondToRequest(
    targetId: string,
    requesterId: string,
    action: 'accept' | 'reject',
  ) {
    const status: FollowRequestStatus = action === 'accept' ? 'accepted' : 'rejected';
    const { data, error } = await this.supabase
      .from('follow_requests')
      .update({ status, responded_at: new Date().toISOString() })
      .eq('requester_id', requesterId)
      .eq('target_id', targetId)
      .eq('status', 'pending')
      .select()
      .single();
    if (error?.code === 'PGRST116')
      throw new NotFoundException('Pending request not found');
    if (error) throw error;

    if (action === 'accept') {
      const { error: insErr } = await this.supabase
        .from('follows')
        .insert({ follower_id: requesterId, followee_id: targetId });
      if (insErr && (insErr as { code?: string }).code !== '23505')
        throw insErr;
    }
    return data;
  }

  async cancelOutgoingRequest(requesterId: string, targetId: string) {
    const { error } = await this.supabase
      .from('follow_requests')
      .delete()
      .eq('requester_id', requesterId)
      .eq('target_id', targetId)
      .eq('status', 'pending');
    if (error) throw error;
    return { cancelled: true };
  }
}

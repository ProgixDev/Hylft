import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

const AVATARS_BUCKET = 'avatars';
const ALLOWED_AVATAR_EXTS = ['jpg', 'jpeg', 'png', 'webp', 'heic'] as const;

@Injectable()
export class UsersService {
  private supabase: SupabaseClient;
  private supabaseUrl: string;

  constructor(config: ConfigService) {
    this.supabaseUrl = config.get<string>('SUPABASE_URL')!;
    this.supabase = createClient(
      this.supabaseUrl,
      config.get<string>('SUPABASE_SERVICE_ROLE_KEY')!,
    );
  }

  async getProfile(userId: string) {
    const { data, error } = await this.supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') throw new NotFoundException('Profile not found');
      throw error;
    }
    return data;
  }

  async createProfile(userId: string, dto: CreateProfileDto) {
    const { data, error } = await this.supabase
      .from('user_profiles')
      .upsert({ id: userId, ...dto })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') throw new ConflictException('Username already taken');
      throw error;
    }
    return data;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const payload = await this.withSyncedDisplayName(userId, dto);
    const { data, error } = await this.supabase
      .from('user_profiles')
      .update(payload)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') throw new NotFoundException('Profile not found');
      if (error.code === '23505') throw new ConflictException('Username already taken');
      throw error;
    }
    return data;
  }

  // Case-insensitive prefix/substring search across username + display_name.
  // Excludes the viewer and hydrates is_following for each row.
  async searchUsers(
    viewerId: string,
    rawQuery: string,
    limit = 20,
  ) {
    const q = (rawQuery ?? '').trim();
    if (q.length === 0) return { items: [] };
    const pattern = `%${q.replace(/[\%_]/g, (m) => `\\${m}`)}%`;
    const capped = Math.min(Math.max(limit, 1), 50);

    const { data, error } = await this.supabase
      .from('user_profiles')
      .select(
        'id, username, display_name, avatar_url, bio, is_private',
      )
      .neq('id', viewerId)
      .or(`username.ilike.${pattern},display_name.ilike.${pattern}`)
      .order('username', { ascending: true })
      .limit(capped);
    if (error) throw error;

    const rows =
      (data ?? []) as Array<{
        id: string;
        username: string | null;
        display_name: string | null;
        avatar_url: string | null;
        bio: string | null;
        is_private: boolean;
      }>;

    // Hydrate follow state in one query.
    const ids = rows.map((r) => r.id);
    let following = new Set<string>();
    let pending = new Set<string>();
    if (ids.length > 0) {
      const [{ data: fRows, error: fErr }, { data: pRows, error: pErr }] =
        await Promise.all([
          this.supabase
            .from('follows')
            .select('followee_id')
            .eq('follower_id', viewerId)
            .in('followee_id', ids),
          this.supabase
            .from('follow_requests')
            .select('target_id')
            .eq('requester_id', viewerId)
            .eq('status', 'pending')
            .in('target_id', ids),
        ]);
      if (fErr) throw fErr;
      if (pErr) throw pErr;
      following = new Set(
        (fRows ?? []).map((r: { followee_id: string }) => r.followee_id),
      );
      pending = new Set(
        (pRows ?? []).map((r: { target_id: string }) => r.target_id),
      );
    }

    return {
      items: rows.map((r) => ({
        ...r,
        is_following: following.has(r.id),
        has_pending_request: pending.has(r.id),
      })),
    };
  }

  // Public-safe profile subset for viewing other users. Returns null-safe
  // fields and respects is_private (posts count still visible; post content
  // is governed separately by the feed RLS).
  async getPublicProfile(targetId: string) {
    const { data, error } = await this.supabase
      .from('user_profiles')
      .select(
        'id, username, display_name, first_name, last_name, avatar_url, cover_url, bio, is_private, fitness_goals, experience_level, created_at',
      )
      .eq('id', targetId)
      .single();
    if (error) {
      if (error.code === 'PGRST116') throw new NotFoundException('Profile not found');
      throw error;
    }
    return data;
  }

  async signAvatarUpload(userId: string, ext?: string) {
    const finalExt = (ext ?? 'jpg').toLowerCase();
    if (!ALLOWED_AVATAR_EXTS.includes(finalExt as (typeof ALLOWED_AVATAR_EXTS)[number])) {
      throw new BadRequestException('Unsupported image extension');
    }
    const storage_path = `${userId}/${Date.now()}-${randomUUID()}.${finalExt}`;
    const { data, error } = await this.supabase.storage
      .from(AVATARS_BUCKET)
      .createSignedUploadUrl(storage_path);
    if (error) throw error;
    const public_url = `${this.supabaseUrl}/storage/v1/object/public/${AVATARS_BUCKET}/${storage_path}`;
    return {
      bucket: AVATARS_BUCKET,
      storage_path,
      signed_url: data.signedUrl,
      token: data.token,
      public_url,
    };
  }

  async deleteAvatar(userId: string) {
    // Fetch current avatar_url to optionally remove the storage object.
    const { data: prev } = await this.supabase
      .from('user_profiles')
      .select('avatar_url')
      .eq('id', userId)
      .single();

    const prevUrl = (prev as { avatar_url: string | null } | null)?.avatar_url;
    if (prevUrl) {
      const marker = `/${AVATARS_BUCKET}/`;
      const idx = prevUrl.indexOf(marker);
      if (idx >= 0) {
        const path = prevUrl.substring(idx + marker.length);
        // Best-effort; ignore errors if object is already gone.
        await this.supabase.storage.from(AVATARS_BUCKET).remove([path]);
      }
    }

    const { error } = await this.supabase
      .from('user_profiles')
      .update({ avatar_url: null })
      .eq('id', userId);
    if (error) throw error;
    return { avatar_url: null };
  }

  async getUserStats(targetId: string) {
    const [{ count: postsCount, error: pErr }, followStats, likesRes] =
      await Promise.all([
        this.supabase
          .from('posts')
          .select('id', { count: 'exact', head: true })
          .eq('author_id', targetId)
          .is('deleted_at', null),
        this.getFollowCounts(targetId),
        this.supabase
          .from('posts')
          .select('likes_count')
          .eq('author_id', targetId)
          .is('deleted_at', null),
      ]);
    if (pErr) throw pErr;
    if (likesRes.error) throw likesRes.error;
    const likesCount = ((likesRes.data ?? []) as Array<{ likes_count: number }>)
      .reduce((s, r) => s + (r.likes_count ?? 0), 0);
    return {
      posts_count: postsCount ?? 0,
      followers_count: followStats.followers_count,
      following_count: followStats.following_count,
      likes_count: likesCount,
    };
  }

  // Keep display_name in sync with first_name/last_name whenever the caller
  // updates either half but does not explicitly provide display_name.
  private async withSyncedDisplayName(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<Record<string, unknown>> {
    const out: Record<string, unknown> = { ...dto };
    const touchesName =
      dto.first_name !== undefined || dto.last_name !== undefined;
    if (!touchesName || dto.display_name !== undefined) return out;

    let firstName = dto.first_name;
    let lastName = dto.last_name;
    if (firstName === undefined || lastName === undefined) {
      const { data } = await this.supabase
        .from('user_profiles')
        .select('first_name, last_name')
        .eq('id', userId)
        .single();
      const prev = (data ?? {}) as {
        first_name: string | null;
        last_name: string | null;
      };
      if (firstName === undefined) firstName = prev.first_name ?? '';
      if (lastName === undefined) lastName = prev.last_name ?? '';
    }
    const full = `${(firstName ?? '').trim()} ${(lastName ?? '').trim()}`.trim();
    out.display_name = full.length > 0 ? full : null;
    return out;
  }

  private async getFollowCounts(targetId: string) {
    const [followersRes, followingRes] = await Promise.all([
      this.supabase
        .from('follows')
        .select('followee_id', { count: 'exact', head: true })
        .eq('followee_id', targetId),
      this.supabase
        .from('follows')
        .select('follower_id', { count: 'exact', head: true })
        .eq('follower_id', targetId),
    ]);
    return {
      followers_count: followersRes.count ?? 0,
      following_count: followingRes.count ?? 0,
    };
  }

  async completeOnboarding(userId: string, dto: UpdateProfileDto) {
    const payload = await this.withSyncedDisplayName(userId, dto);
    const { data, error } = await this.supabase
      .from('user_profiles')
      .update({ ...payload, onboarding_completed: true })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') throw new NotFoundException('Profile not found');
      throw error;
    }
    return data;
  }
}

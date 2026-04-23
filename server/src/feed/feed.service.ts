import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { ListPostsQueryDto } from './dto/list-posts-query.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { SignMediaUploadDto } from './dto/media-upload.dto';

const POST_MEDIA_BUCKET = 'post-media';
const MEDIA_SIGNED_READ_TTL = 60 * 60; // 1h

type PostRow = {
  id: string;
  author_id: string;
  kind: string;
  caption: string | null;
  privacy: 'public' | 'followers' | 'private';
  workout_session_id: string | null;
  weight_entry_id: string | null;
  stats: Record<string, unknown> | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

@Injectable()
export class FeedService {
  private supabase: SupabaseClient;

  constructor(config: ConfigService) {
    this.supabase = createClient(
      config.get<string>('SUPABASE_URL')!,
      config.get<string>('SUPABASE_SERVICE_ROLE_KEY')!,
    );
  }

  // ── Media: signed upload URLs ──────────────────────────────────────────

  async signMediaUploads(userId: string, dto: SignMediaUploadDto) {
    const ext = dto.ext ?? 'jpg';
    const uploads: Array<{ storage_path: string; signed_url: string; token: string }> = [];
    for (let i = 0; i < dto.count; i++) {
      const path = `${userId}/${Date.now()}-${randomUUID()}.${ext}`;
      const { data, error } = await this.supabase.storage
        .from(POST_MEDIA_BUCKET)
        .createSignedUploadUrl(path);
      if (error) throw error;
      uploads.push({
        storage_path: path,
        signed_url: data.signedUrl,
        token: data.token,
      });
    }
    return { bucket: POST_MEDIA_BUCKET, uploads };
  }

  // ── Posts ──────────────────────────────────────────────────────────────

  async createPost(userId: string, dto: CreatePostDto) {
    const { data: post, error } = await this.supabase
      .from('posts')
      .insert({
        author_id: userId,
        kind: dto.kind ?? 'standard',
        caption: dto.caption ?? null,
        privacy: dto.privacy,
        weight_entry_id: dto.weight_entry_id ?? null,
        stats: dto.stats ?? null,
      })
      .select()
      .single();
    if (error) throw error;

    if (dto.media.length > 0) {
      const rows = dto.media.map((m, idx) => ({
        post_id: (post as PostRow).id,
        position: idx,
        storage_path: m.storage_path,
        width: m.width ?? null,
        height: m.height ?? null,
      }));
      const { error: mErr } = await this.supabase.from('post_media').insert(rows);
      if (mErr) throw mErr;
    }

    return this.hydratePost(userId, (post as PostRow).id);
  }

  async updatePost(userId: string, postId: string, dto: UpdatePostDto) {
    const { data, error } = await this.supabase
      .from('posts')
      .update({
        ...(dto.caption !== undefined ? { caption: dto.caption } : {}),
        ...(dto.privacy !== undefined ? { privacy: dto.privacy } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq('id', postId)
      .eq('author_id', userId)
      .is('deleted_at', null)
      .select()
      .single();

    if (error?.code === 'PGRST116') throw new NotFoundException('Post not found');
    if (error) throw error;
    return this.hydratePost(userId, (data as PostRow).id);
  }

  async deletePost(userId: string, postId: string) {
    const { data, error } = await this.supabase
      .from('posts')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', postId)
      .eq('author_id', userId)
      .is('deleted_at', null)
      .select('id')
      .single();
    if (error?.code === 'PGRST116') throw new NotFoundException('Post not found');
    if (error) throw error;
    return { deleted: true, id: (data as { id: string }).id };
  }

  async getPost(userId: string, postId: string) {
    return this.hydratePost(userId, postId);
  }

  async listPosts(userId: string, q: ListPostsQueryDto) {
    const limit = q.limit ?? 20;
    const scope = q.scope ?? 'timeline';

    const buildBase = () =>
      this.supabase
        .from('posts')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(limit);

    let allRows: PostRow[];
    let allVisible: PostRow[];

    if (scope === 'author') {
      if (!q.author_id) return { items: [], next_cursor: null };
      let query = buildBase().eq('author_id', q.author_id);
      if (q.cursor) query = query.lt('created_at', q.cursor);
      const { data, error } = await query;
      if (error) throw error;
      allRows = (data ?? []) as PostRow[];
      allVisible = allRows.filter((p) => this.canView(userId, p, null));
    } else {
      // Timeline: own posts + followees first, fill remaining slots with global public posts.
      const followeeIds = await this.getFolloweeIds(userId);
      const authorIds = Array.from(new Set([userId, ...followeeIds]));

      let followerQ = buildBase().in('author_id', authorIds);
      if (q.cursor) followerQ = followerQ.lt('created_at', q.cursor);
      const { data: fData, error: fErr } = await followerQ;
      if (fErr) throw fErr;

      const followerRows = (fData ?? []) as PostRow[];
      const followerVisible = followerRows.filter((p) => this.canView(userId, p, null));

      if (followerVisible.length < limit) {
        // Fill remaining slots with public posts from non-followed users.
        const remaining = limit - followerVisible.length;
        const inList = `(${authorIds.join(',')})`;
        let globalQ = buildBase()
          .eq('privacy', 'public')
          .not('author_id', 'in', inList)
          .limit(remaining);
        if (q.cursor) globalQ = globalQ.lt('created_at', q.cursor);
        const { data: gData, error: gErr } = await globalQ;
        if (gErr) throw gErr;
        const globalRows = (gData ?? []) as PostRow[];
        allRows = [...followerRows, ...globalRows];
        allVisible = [...followerVisible, ...globalRows];
      } else {
        allRows = followerRows;
        allVisible = followerVisible;
      }
    }

    const hydrated = await this.hydratePostsBatch(userId, allVisible);

    const next_cursor =
      hydrated.length === limit ? allRows[allRows.length - 1].created_at : null;

    return { items: hydrated, next_cursor };
  }

  // ── Likes ──────────────────────────────────────────────────────────────

  async likePost(userId: string, postId: string) {
    await this.assertPostVisible(userId, postId);
    const { error } = await this.supabase
      .from('post_likes')
      .insert({ post_id: postId, user_id: userId });
    // 23505 = already liked; treat as idempotent success.
    if (error && (error as { code?: string }).code !== '23505') throw error;
    return { liked: true };
  }

  async unlikePost(userId: string, postId: string) {
    const { error } = await this.supabase
      .from('post_likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId);
    if (error) throw error;
    return { liked: false };
  }

  async likeComment(userId: string, commentId: string) {
    await this.assertCommentVisible(userId, commentId);
    const { error } = await this.supabase
      .from('comment_likes')
      .insert({ comment_id: commentId, user_id: userId });
    if (error && (error as { code?: string }).code !== '23505') throw error;
    return { liked: true };
  }

  async unlikeComment(userId: string, commentId: string) {
    const { error } = await this.supabase
      .from('comment_likes')
      .delete()
      .eq('comment_id', commentId)
      .eq('user_id', userId);
    if (error) throw error;
    return { liked: false };
  }

  // ── Comments ───────────────────────────────────────────────────────────

  async listComments(userId: string, postId: string) {
    await this.assertPostVisible(userId, postId);

    const { data, error } = await this.supabase
      .from('comments')
      .select(
        `id, post_id, author_id, parent_comment_id, body, likes_count, created_at, updated_at,
         author:user_profiles!comments_author_id_fkey(id, username, display_name, avatar_url)`,
      )
      .eq('post_id', postId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true });
    if (error) throw error;

    const rows = (data ?? []) as Array<
      Record<string, unknown> & { id: string; parent_comment_id: string | null }
    >;
    const likedIds = await this.commentsLikedByUser(
      userId,
      rows.map((r) => r.id),
    );
    const decorated = rows.map((r) => ({ ...r, is_liked: likedIds.has(r.id) }));

    // Nest replies under their parent.
    const byId = new Map<string, Record<string, unknown> & { replies: unknown[] }>();
    const roots: Array<Record<string, unknown>> = [];
    for (const r of decorated) {
      const node = { ...r, replies: [] as unknown[] };
      byId.set(r.id, node);
    }
    for (const r of decorated) {
      const node = byId.get(r.id)!;
      if (r.parent_comment_id) {
        const parent = byId.get(r.parent_comment_id);
        if (parent) parent.replies.push(node);
        else roots.push(node);
      } else {
        roots.push(node);
      }
    }
    return { items: roots };
  }

  async createComment(userId: string, postId: string, dto: CreateCommentDto) {
    await this.assertPostVisible(userId, postId);

    if (dto.parent_comment_id) {
      const { data: parent, error: pErr } = await this.supabase
        .from('comments')
        .select('id, post_id, parent_comment_id, deleted_at')
        .eq('id', dto.parent_comment_id)
        .single();
      if (pErr?.code === 'PGRST116')
        throw new NotFoundException('Parent comment not found');
      if (pErr) throw pErr;
      const p = parent as {
        id: string;
        post_id: string;
        parent_comment_id: string | null;
        deleted_at: string | null;
      };
      if (p.deleted_at) throw new NotFoundException('Parent comment not found');
      if (p.post_id !== postId)
        throw new ForbiddenException('Parent comment belongs to another post');
      if (p.parent_comment_id)
        throw new ForbiddenException('Replies may not be nested further');
    }

    const { data, error } = await this.supabase
      .from('comments')
      .insert({
        post_id: postId,
        author_id: userId,
        parent_comment_id: dto.parent_comment_id ?? null,
        body: dto.body,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async updateComment(userId: string, commentId: string, dto: UpdateCommentDto) {
    const { data, error } = await this.supabase
      .from('comments')
      .update({ body: dto.body, updated_at: new Date().toISOString() })
      .eq('id', commentId)
      .eq('author_id', userId)
      .is('deleted_at', null)
      .select()
      .single();
    if (error?.code === 'PGRST116')
      throw new NotFoundException('Comment not found');
    if (error) throw error;
    return data;
  }

  async deleteComment(userId: string, commentId: string) {
    const { data, error } = await this.supabase
      .from('comments')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', commentId)
      .eq('author_id', userId)
      .is('deleted_at', null)
      .select('id')
      .single();
    if (error?.code === 'PGRST116')
      throw new NotFoundException('Comment not found');
    if (error) throw error;
    return { deleted: true, id: (data as { id: string }).id };
  }

  // ── Internals ──────────────────────────────────────────────────────────

  private canView(
    viewerId: string,
    post: PostRow,
    followees: Set<string> | null,
  ): boolean {
    if (post.deleted_at) return false;
    if (post.author_id === viewerId) return true;
    if (post.privacy === 'public') return true;
    if (post.privacy === 'followers') {
      if (!followees) return true; // caller pre-filtered via SQL
      return followees.has(post.author_id);
    }
    return false;
  }

  private async assertPostVisible(userId: string, postId: string) {
    const { data, error } = await this.supabase
      .from('posts')
      .select('*')
      .eq('id', postId)
      .is('deleted_at', null)
      .single();
    if (error?.code === 'PGRST116')
      throw new NotFoundException('Post not found');
    if (error) throw error;
    const post = data as PostRow;
    const followees =
      post.privacy === 'followers'
        ? new Set(await this.getFolloweeIds(userId))
        : null;
    if (!this.canView(userId, post, followees))
      throw new ForbiddenException('Not allowed to view this post');
    return post;
  }

  private async assertCommentVisible(userId: string, commentId: string) {
    const { data, error } = await this.supabase
      .from('comments')
      .select('id, post_id, deleted_at')
      .eq('id', commentId)
      .single();
    if (error?.code === 'PGRST116')
      throw new NotFoundException('Comment not found');
    if (error) throw error;
    const c = data as { id: string; post_id: string; deleted_at: string | null };
    if (c.deleted_at) throw new NotFoundException('Comment not found');
    await this.assertPostVisible(userId, c.post_id);
    return c;
  }

  private async getFolloweeIds(userId: string): Promise<string[]> {
    const { data, error } = await this.supabase
      .from('follows')
      .select('followee_id')
      .eq('follower_id', userId);
    if (error) throw error;
    return (data ?? []).map((r: { followee_id: string }) => r.followee_id);
  }

  private async postsLikedByUser(
    userId: string,
    postIds: string[],
  ): Promise<Set<string>> {
    if (postIds.length === 0) return new Set();
    const { data, error } = await this.supabase
      .from('post_likes')
      .select('post_id')
      .eq('user_id', userId)
      .in('post_id', postIds);
    if (error) throw error;
    return new Set((data ?? []).map((r: { post_id: string }) => r.post_id));
  }

  private async commentsLikedByUser(
    userId: string,
    commentIds: string[],
  ): Promise<Set<string>> {
    if (commentIds.length === 0) return new Set();
    const { data, error } = await this.supabase
      .from('comment_likes')
      .select('comment_id')
      .eq('user_id', userId)
      .in('comment_id', commentIds);
    if (error) throw error;
    return new Set(
      (data ?? []).map((r: { comment_id: string }) => r.comment_id),
    );
  }

  private async signMediaRead(paths: string[]) {
    if (paths.length === 0) return new Map<string, string>();
    const { data, error } = await this.supabase.storage
      .from(POST_MEDIA_BUCKET)
      .createSignedUrls(paths, MEDIA_SIGNED_READ_TTL);
    if (error) throw error;
    const map = new Map<string, string>();
    for (const row of data ?? []) {
      if (row.signedUrl && row.path) map.set(row.path, row.signedUrl);
    }
    return map;
  }

  private async hydratePost(viewerId: string, postId: string) {
    const { data, error } = await this.supabase
      .from('posts')
      .select(
        `*, author:user_profiles!posts_author_id_fkey(id, username, display_name, avatar_url, bio, is_private),
         media:post_media(position, storage_path, width, height)`,
      )
      .eq('id', postId)
      .single();
    if (error?.code === 'PGRST116')
      throw new NotFoundException('Post not found');
    if (error) throw error;
    const row = data as PostRow & {
      author: unknown;
      media: Array<{
        position: number;
        storage_path: string;
        width: number | null;
        height: number | null;
      }>;
    };

    const followees =
      row.privacy === 'followers'
        ? new Set(await this.getFolloweeIds(viewerId))
        : null;
    if (!this.canView(viewerId, row, followees))
      throw new ForbiddenException('Not allowed to view this post');

    const likeSet = await this.postsLikedByUser(viewerId, [row.id]);
    const urls = await this.signMediaRead(
      row.media.map((m) => m.storage_path),
    );
    const media = row.media
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((m) => ({ ...m, url: urls.get(m.storage_path) ?? null }));

    return { ...row, media, is_liked: likeSet.has(row.id) };
  }

  private async hydratePostsBatch(viewerId: string, posts: PostRow[]) {
    if (posts.length === 0) return [];
    const ids = posts.map((p) => p.id);

    const [{ data: authors, error: aErr }, { data: media, error: mErr }, likeSet] =
      await Promise.all([
        this.supabase
          .from('user_profiles')
          .select('id, username, display_name, avatar_url, bio, is_private')
          .in(
            'id',
            Array.from(new Set(posts.map((p) => p.author_id))),
          ),
        this.supabase
          .from('post_media')
          .select('post_id, position, storage_path, width, height')
          .in('post_id', ids),
        this.postsLikedByUser(viewerId, ids),
      ]);
    if (aErr) throw aErr;
    if (mErr) throw mErr;

    const authorById = new Map(
      (authors ?? []).map((a: { id: string }) => [a.id, a]),
    );
    const mediaByPost = new Map<string, typeof media>();
    for (const m of (media ?? []) as Array<{ post_id: string }>) {
      const arr = (mediaByPost.get(m.post_id) as unknown[]) ?? [];
      arr.push(m);
      mediaByPost.set(m.post_id, arr as typeof media);
    }

    const allPaths = ((media ?? []) as Array<{ storage_path: string }>).map(
      (m) => m.storage_path,
    );
    const urls = await this.signMediaRead(allPaths);

    return posts.map((p) => {
      const postMedia = ((mediaByPost.get(p.id) as unknown[]) ?? []) as Array<{
        position: number;
        storage_path: string;
        width: number | null;
        height: number | null;
      }>;
      const sorted = postMedia
        .slice()
        .sort((a, b) => a.position - b.position)
        .map((m) => ({ ...m, url: urls.get(m.storage_path) ?? null }));
      return {
        ...p,
        author: authorById.get(p.author_id) ?? null,
        media: sorted,
        is_liked: likeSet.has(p.id),
      };
    });
  }
}

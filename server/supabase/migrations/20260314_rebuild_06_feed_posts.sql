-- Rebuild file 6/8 — see 20260314_rebuild_01_extensions_and_profiles.sql for context.
-- posts + post_media are live (server/src/users/users.service.ts reads
-- posts.likes_count; server/scripts/seed-feed.mjs inserts posts/post_media
-- directly with the `post-media` storage bucket). post_likes/comments/
-- comment_likes have no server API endpoints yet — no current call site
-- creates or reads them — but they're recreated here anyway because they're
-- the direct source of posts.likes_count/comments_count via the counter
-- triggers below, matching the README's documented hylft_0009 design.
-- Flag this in review: dead code paths today, ready for when likes/comments
-- endpoints are built.

create table if not exists posts (
  id             uuid primary key default gen_random_uuid(),
  author_id      uuid not null references user_profiles(id) on delete cascade,
  kind           text not null default 'standard',
  caption        text,
  privacy        text not null default 'public' check (privacy in ('public','followers','private')),
  stats          jsonb,
  likes_count    integer not null default 0,
  comments_count integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deleted_at     timestamptz
);

create index if not exists posts_author_idx on posts (author_id, created_at desc) where deleted_at is null;

create table if not exists post_media (
  id            uuid primary key default gen_random_uuid(),
  post_id       uuid not null references posts(id) on delete cascade,
  position      integer not null default 0,
  storage_path  text not null,
  created_at    timestamptz not null default now()
);

create index if not exists post_media_post_idx on post_media (post_id, position);

create table if not exists post_likes (
  post_id     uuid not null references posts(id) on delete cascade,
  user_id     uuid not null references user_profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists comments (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references posts(id) on delete cascade,
  author_id   uuid not null references user_profiles(id) on delete cascade,
  parent_id   uuid references comments(id) on delete cascade,
  body        text not null,
  created_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create index if not exists comments_post_idx on comments (post_id, created_at) where deleted_at is null;

create table if not exists comment_likes (
  comment_id  uuid not null references comments(id) on delete cascade,
  user_id     uuid not null references user_profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (comment_id, user_id)
);

-- Read access rule shared by posts/post_media/comments RLS below: the
-- author, or anyone for a public post, or followers for a followers-only post.
create or replace function public.can_view_post(p_post_id uuid, p_viewer uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select case
    when p.privacy = 'public' then true
    when p.author_id = p_viewer then true
    when p.privacy = 'followers' and exists (
      select 1 from follows f
      where f.follower_id = p_viewer and f.followee_id = p.author_id
    ) then true
    else false
  end
  from posts p
  where p.id = p_post_id and p.deleted_at is null;
$$;

create or replace function public.posts_sync_likes_count()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if (tg_op = 'INSERT') then
    update posts set likes_count = likes_count + 1 where id = new.post_id;
  elsif (tg_op = 'DELETE') then
    update posts set likes_count = greatest(0, likes_count - 1) where id = old.post_id;
  end if;
  return null;
end;
$$;

drop trigger if exists post_likes_sync_count on post_likes;
create trigger post_likes_sync_count
  after insert or delete on post_likes
  for each row execute function public.posts_sync_likes_count();

create or replace function public.posts_sync_comments_count()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if (tg_op = 'INSERT') then
    update posts set comments_count = comments_count + 1 where id = new.post_id;
  elsif (tg_op = 'DELETE') then
    update posts set comments_count = greatest(0, comments_count - 1) where id = old.post_id;
  end if;
  return null;
end;
$$;

drop trigger if exists comments_sync_count on comments;
create trigger comments_sync_count
  after insert or delete on comments
  for each row execute function public.posts_sync_comments_count();

alter table posts enable row level security;
alter table post_media enable row level security;
alter table post_likes enable row level security;
alter table comments enable row level security;
alter table comment_likes enable row level security;

drop policy if exists "posts_select_viewable" on posts;
create policy "posts_select_viewable" on posts
  for select using (deleted_at is null and can_view_post(id, auth.uid()));

drop policy if exists "posts_manage_own" on posts;
create policy "posts_manage_own" on posts
  for all using (auth.uid() = author_id) with check (auth.uid() = author_id);

drop policy if exists "post_media_select_viewable" on post_media;
create policy "post_media_select_viewable" on post_media
  for select using (can_view_post(post_id, auth.uid()));

drop policy if exists "post_media_manage_own" on post_media;
create policy "post_media_manage_own" on post_media
  for all using (
    exists (select 1 from posts p where p.id = post_id and p.author_id = auth.uid())
  );

drop policy if exists "post_likes_select_viewable" on post_likes;
create policy "post_likes_select_viewable" on post_likes
  for select using (can_view_post(post_id, auth.uid()));

drop policy if exists "post_likes_manage_own" on post_likes;
create policy "post_likes_manage_own" on post_likes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "comments_select_viewable" on comments;
create policy "comments_select_viewable" on comments
  for select using (deleted_at is null and can_view_post(post_id, auth.uid()));

drop policy if exists "comments_manage_own" on comments;
create policy "comments_manage_own" on comments
  for all using (auth.uid() = author_id) with check (auth.uid() = author_id);

drop policy if exists "comment_likes_select_viewable" on comment_likes;
create policy "comment_likes_select_viewable" on comment_likes
  for select using (
    exists (
      select 1 from comments c where c.id = comment_id and can_view_post(c.post_id, auth.uid())
    )
  );

drop policy if exists "comment_likes_manage_own" on comment_likes;
create policy "comment_likes_manage_own" on comment_likes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================
-- Migration: 20260314_rebuild_01_extensions_and_profiles.sql
-- ============================================

-- Rebuild file 1/8 — reconstructed after the original Supabase project
-- (ref xmezqfgmzdeybivelhtu) was lost with no backup. The original foundational
-- schema (README.md rows "create_user_profiles" .. "hylft_0013") was applied
-- directly via MCP and never saved as .sql, so this is a from-scratch rebuild
-- derived by reading every server/src + mobile/src call site that touches
-- these tables. See the reconstruction report for assumptions/gaps.
--
-- This file: extensions + user_profiles (final cumulative shape) + the
-- handle_new_user() signup trigger on auth.users.

create extension if not exists citext;
create extension if not exists pgcrypto;

create table if not exists user_profiles (
  id                    uuid primary key references auth.users(id) on delete cascade,
  username              citext not null unique,
  display_name          text,
  first_name            text,
  last_name             text,
  bio                   text,
  avatar_url            text,
  cover_url             text,
  fitness_goal          text,
  experience_level      text,
  unit_system           text not null default 'metric' check (unit_system in ('metric','imperial')),
  height_cm             numeric,
  weight_kg             numeric,
  target_weight_kg      numeric,
  date_of_birth         date,
  gender                text,
  workout_frequency     integer,
  focus_areas           text[],
  onboarding_completed  boolean not null default false,
  is_private            boolean not null default false,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists user_profiles_username_idx on user_profiles (username);

alter table user_profiles enable row level security;

drop policy if exists "user_profiles_select_all" on user_profiles;
create policy "user_profiles_select_all" on user_profiles
  for select using (true);

drop policy if exists "user_profiles_update_own" on user_profiles;
create policy "user_profiles_update_own" on user_profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "user_profiles_insert_own" on user_profiles;
create policy "user_profiles_insert_own" on user_profiles
  for insert with check (auth.uid() = id);

-- Guarantees a row exists the instant a Supabase Auth user is created, so
-- mobile/server reads never 404 before onboarding fills in real details
-- (mobile/src/contexts/AuthContext.tsx signUp -> setGetStartedCompleted
-- upserts the real profile afterwards). Username fallback uses the full
-- user id so it can never collide; the exception handler is defensive
-- belt-and-suspenders so a freak conflict can never fail a signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.user_profiles (id, username)
  values (new.id, 'user_' || replace(new.id::text, '-', ''))
  on conflict (id) do nothing;
  return new;
exception
  when unique_violation then
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================
-- Migration: 20260314_rebuild_02_social_follows.sql
-- ============================================

-- Rebuild file 2/8 — see 20260314_rebuild_01_extensions_and_profiles.sql for context.
-- follows + follow_requests, backing server/src/social/social.service.ts and
-- users.service.ts. FK column names matter: social.service.ts joins via
-- Supabase's implicit-FK syntax (e.g. `user_profiles!follows_follower_id_fkey`),
-- which relies on Postgres's default `<table>_<column>_fkey` constraint naming
-- — do not rename these constraints.

create table if not exists follows (
  follower_id  uuid not null references user_profiles(id) on delete cascade,
  followee_id  uuid not null references user_profiles(id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (follower_id, followee_id)
);

create index if not exists follows_followee_idx on follows (followee_id);

alter table follows enable row level security;

drop policy if exists "follows_select_all" on follows;
create policy "follows_select_all" on follows
  for select using (true);

drop policy if exists "follows_manage_own" on follows;
create policy "follows_manage_own" on follows
  for all using (auth.uid() = follower_id) with check (auth.uid() = follower_id);

create table if not exists follow_requests (
  requester_id   uuid not null references user_profiles(id) on delete cascade,
  target_id      uuid not null references user_profiles(id) on delete cascade,
  status         text not null default 'pending' check (status in ('pending','accepted','rejected')),
  created_at     timestamptz not null default now(),
  responded_at   timestamptz,
  primary key (requester_id, target_id)
);

create index if not exists follow_requests_target_idx on follow_requests (target_id, status);

alter table follow_requests enable row level security;

drop policy if exists "follow_requests_select_participant" on follow_requests;
create policy "follow_requests_select_participant" on follow_requests
  for select using (auth.uid() = requester_id or auth.uid() = target_id);

drop policy if exists "follow_requests_insert_own" on follow_requests;
create policy "follow_requests_insert_own" on follow_requests
  for insert with check (auth.uid() = requester_id);

drop policy if exists "follow_requests_update_participant" on follow_requests;
create policy "follow_requests_update_participant" on follow_requests
  for update using (auth.uid() = requester_id or auth.uid() = target_id);

drop policy if exists "follow_requests_delete_own" on follow_requests;
create policy "follow_requests_delete_own" on follow_requests
  for delete using (auth.uid() = requester_id);

-- ============================================
-- Migration: 20260314_rebuild_03_exercise_catalog.sql
-- ============================================

-- Rebuild file 3/8 — see 20260314_rebuild_01_extensions_and_profiles.sql for context.
-- exercises: ExerciseDB mirror. Confirmed against server/src/exercises/exercises.service.ts
-- and server/scripts/seed-exercises.mjs / upload-exercise-gifs.mjs: body_part,
-- target_muscle, equipment, difficulty are plain filterable text columns, NOT
-- foreign keys into normalized lookup tables — the original hylft_0004
-- `muscle_groups`/`equipment` catalog tables are not queried anywhere in the
-- live app, so they are intentionally omitted here (see reconstruction report).

create table if not exists exercises (
  id                bigserial primary key,
  external_id       text not null unique,
  name              text not null,
  body_part         text,
  target_muscle     text,
  secondary_muscles text[],
  equipment         text,
  gif_url           text,
  instructions      text[],
  difficulty        text check (difficulty in ('beginner','intermediate','advanced')),
  synced_at         timestamptz,
  created_at        timestamptz not null default now()
);

create index if not exists exercises_name_idx on exercises (name);
create index if not exists exercises_body_part_idx on exercises (body_part);
create index if not exists exercises_equipment_idx on exercises (equipment);
create index if not exists exercises_difficulty_idx on exercises (difficulty);

alter table exercises enable row level security;

drop policy if exists "exercises_select_all" on exercises;
create policy "exercises_select_all" on exercises
  for select using (true);

-- ============================================
-- Migration: 20260314_rebuild_04_routines.sql
-- ============================================

-- Rebuild file 4/8 — see 20260314_rebuild_01_extensions_and_profiles.sql for context.
-- routines: flat table with a jsonb `exercises` blob (matches
-- server/src/routines/routines.service.ts and server/scripts/seed-home-routines.mjs
-- exactly). The original hylft_0005 normalized `routine_exercises` /
-- `routine_set_targets` tables are intentionally NOT recreated — per
-- server/supabase/migrations/README.md's own "Deferred" section, that
-- backfill never happened and nothing in the live app queries them.
--
-- id is app-generated text (`routine-<ts><rand>` / `admin-*` for seeded
-- rows), not a uuid — do not change to uuid, createRoutine()/seed scripts
-- insert explicit string ids.

create table if not exists routines (
  id                  text primary key,
  user_id             uuid references user_profiles(id) on delete cascade,
  name                text not null,
  description         text default '',
  difficulty          text check (difficulty in ('beginner','intermediate','advanced')),
  target_muscles      text[] default '{}',
  exercises           jsonb not null default '[]'::jsonb,
  estimated_duration  integer default 0,
  times_completed     integer not null default 0,
  last_used           timestamptz,
  is_public           boolean not null default false,
  is_admin_routine    boolean not null default false,
  category            text,
  sub_category        text,
  duration_days       integer,
  color_hex           text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  deleted_at          timestamptz
);

create index if not exists routines_user_idx on routines (user_id) where deleted_at is null;
create index if not exists routines_admin_idx on routines (is_admin_routine, is_public, category, sub_category) where deleted_at is null;

alter table routines enable row level security;

drop policy if exists "routines_select_own_or_public" on routines;
create policy "routines_select_own_or_public" on routines
  for select using (
    deleted_at is null
    and (auth.uid() = user_id or is_public = true)
  );

drop policy if exists "routines_manage_own" on routines;
create policy "routines_manage_own" on routines
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================
-- Migration: 20260314_rebuild_05_health_and_weight.sql
-- ============================================

-- Rebuild file 5/8 — see 20260314_rebuild_01_extensions_and_profiles.sql for context.
-- daily_health_snapshots + workout_logs (server/src/health/health.service.ts)
-- + weight_entries (server/src/weight-entries/weight-entries.service.ts).
--
-- workout_logs is a flat table with a jsonb `exercises` blob (matches
-- health.service.ts addWorkout exactly, id is app-generated text, not uuid).
-- The original hylft_0006 normalized `workout_sessions` /
-- `workout_session_exercises` / `workout_sets` tables and hylft_0008's
-- `device_workouts` are intentionally NOT recreated — nothing in the live
-- app queries them (same "Deferred" situation as routine_exercises, see
-- reconstruction report).

create table if not exists daily_health_snapshots (
  user_id          uuid not null references user_profiles(id) on delete cascade,
  date             date not null,
  steps            integer not null default 0,
  calories_burned  numeric not null default 0,
  active_minutes   integer not null default 0,
  distance_km      numeric not null default 0,
  water_ml         integer not null default 0,
  updated_at       timestamptz not null default now(),
  primary key (user_id, date)
);

alter table daily_health_snapshots enable row level security;

drop policy if exists "daily_health_snapshots_owner" on daily_health_snapshots;
create policy "daily_health_snapshots_owner" on daily_health_snapshots
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists workout_logs (
  id                 text primary key,
  user_id            uuid not null references user_profiles(id) on delete cascade,
  name               text not null,
  workout_type       text not null default 'general',
  date               date not null,
  start_time         timestamptz,
  end_time           timestamptz,
  duration_minutes   numeric not null default 0,
  calories_burned    numeric not null default 0,
  source             text not null default 'manual' check (source in ('manual','routine','health_connect','apple_health')),
  routine_id         text references routines(id) on delete set null,
  total_volume_kg    numeric not null default 0,
  total_sets         integer not null default 0,
  completed_sets     integer not null default 0,
  exercise_count     integer not null default 0,
  exercises          jsonb,
  notes              text,
  created_at         timestamptz not null default now()
);

create index if not exists workout_logs_user_date_idx on workout_logs (user_id, date);
create index if not exists workout_logs_user_created_idx on workout_logs (user_id, created_at desc);

alter table workout_logs enable row level security;

drop policy if exists "workout_logs_owner" on workout_logs;
create policy "workout_logs_owner" on workout_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists weight_entries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references user_profiles(id) on delete cascade,
  entry_date  date not null,
  weight_kg   numeric not null,
  note        text,
  created_at  timestamptz not null default now(),
  unique (user_id, entry_date)
);

create index if not exists weight_entries_user_date_idx on weight_entries (user_id, entry_date desc);

alter table weight_entries enable row level security;

drop policy if exists "weight_entries_owner" on weight_entries;
create policy "weight_entries_owner" on weight_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================
-- Migration: 20260314_rebuild_06_feed_posts.sql
-- ============================================

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

-- ============================================
-- Migration: 20260314_rebuild_07_notifications.sql
-- ============================================

-- Rebuild file 7/8 — see 20260314_rebuild_01_extensions_and_profiles.sql for context.
-- notifications (server/src/notifications/notifications.service.ts): the
-- join `user_profiles!notifications_actor_id_fkey` relies on the default
-- Postgres FK constraint name for the actor_id column — do not rename it.
-- Auto-notify triggers fire on follow/like/comment, matching the README's
-- documented hylft_0010 design; comment vs reply is distinguished by
-- comments.parent_id being null or not.

create table if not exists notifications (
  id            uuid primary key default gen_random_uuid(),
  recipient_id  uuid not null references user_profiles(id) on delete cascade,
  actor_id      uuid references user_profiles(id) on delete cascade,
  type          text not null check (type in ('follow','follow_request','like','comment','reply')),
  target_type   text,
  target_id     uuid,
  read_at       timestamptz,
  created_at    timestamptz not null default now()
);

create index if not exists notifications_recipient_idx on notifications (recipient_id, created_at desc);
create index if not exists notifications_recipient_unread_idx on notifications (recipient_id) where read_at is null;

alter table notifications enable row level security;

drop policy if exists "notifications_owner" on notifications;
create policy "notifications_owner" on notifications
  for all using (auth.uid() = recipient_id) with check (auth.uid() = recipient_id);

create or replace function public.notify_on_follow()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.notifications (recipient_id, actor_id, type, target_type, target_id)
  values (new.followee_id, new.follower_id, 'follow', 'user_profiles', new.follower_id);
  return new;
end;
$$;

drop trigger if exists follows_notify on follows;
create trigger follows_notify
  after insert on follows
  for each row execute function public.notify_on_follow();

create or replace function public.notify_on_post_like()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_author uuid;
begin
  select author_id into v_author from posts where id = new.post_id;
  if v_author is not null and v_author <> new.user_id then
    insert into public.notifications (recipient_id, actor_id, type, target_type, target_id)
    values (v_author, new.user_id, 'like', 'post', new.post_id);
  end if;
  return new;
end;
$$;

drop trigger if exists post_likes_notify on post_likes;
create trigger post_likes_notify
  after insert on post_likes
  for each row execute function public.notify_on_post_like();

create or replace function public.notify_on_comment()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_author uuid;
  v_parent_author uuid;
begin
  select author_id into v_author from posts where id = new.post_id;
  if v_author is not null and v_author <> new.author_id then
    insert into public.notifications (recipient_id, actor_id, type, target_type, target_id)
    values (v_author, new.author_id, 'comment', 'post', new.post_id);
  end if;

  if new.parent_id is not null then
    select author_id into v_parent_author from comments where id = new.parent_id;
    if v_parent_author is not null and v_parent_author <> new.author_id and v_parent_author <> v_author then
      insert into public.notifications (recipient_id, actor_id, type, target_type, target_id)
      values (v_parent_author, new.author_id, 'reply', 'comment', new.parent_id);
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists comments_notify on comments;
create trigger comments_notify
  after insert on comments
  for each row execute function public.notify_on_comment();

-- ============================================
-- Migration: 20260314_rebuild_08_storage_buckets.sql
-- ============================================

-- Rebuild file 8/8 — see 20260314_rebuild_01_extensions_and_profiles.sql for context.
-- `avatars` and `wallpapers` buckets/policies already exist via
-- server/supabase/migrations/20260422_profile_media.sql — do NOT recreate
-- them here. `covers` is a genuine gap in the existing (non-reconstructed)
-- 20260422_covers_catalog.sql: that file only runs
-- `update storage.buckets set public = true where id = 'covers'` — it
-- assumes the bucket already exists, which was only ever true because
-- someone created it by hand in the original (now-lost) project. Its read
-- policy is already defined there; only the bucket row is missing, so it's
-- created here.
--
-- post-media: server/scripts/seed-feed.mjs uploads to path `${userId}/...`
-- (owner-folder convention, same as avatars). README describes this bucket
-- as auth-only (not public), unlike avatars.
--
-- exercise-gifs: server/scripts/upload-exercise-gifs.mjs uploads self-hosted
-- exercise gifs and only ever calls .storage.from('exercise-gifs').upload(...)
-- — it never creates the bucket itself, so it must exist before that script runs.
--
-- mock_profiles_onboarding: mobile/src/app/get-started/ready.tsx reads 9
-- public files (1.jpg..7.jpg, 8.avif, 9.avif) from this bucket for decorative
-- onboarding avatars. The bucket is recreated here, but the actual image
-- files are NOT in this repo and were lost with the old project — re-upload
-- them manually (dashboard Storage tab) once you have the source images, or
-- swap ready.tsx to a different asset source. Purely decorative; the app
-- works without them (marquee just renders empty).

insert into storage.buckets (id, name, public)
values ('post-media', 'post-media', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('exercise-gifs', 'exercise-gifs', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('mock_profiles_onboarding', 'mock_profiles_onboarding', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('covers', 'covers', true)
on conflict (id) do nothing;

drop policy if exists "post_media_bucket_read_authenticated" on storage.objects;
create policy "post_media_bucket_read_authenticated" on storage.objects
  for select using (bucket_id = 'post-media' and auth.role() = 'authenticated');

drop policy if exists "post_media_bucket_insert_own" on storage.objects;
create policy "post_media_bucket_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'post-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "post_media_bucket_delete_own" on storage.objects;
create policy "post_media_bucket_delete_own" on storage.objects
  for delete using (
    bucket_id = 'post-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "exercise_gifs_read_public" on storage.objects;
create policy "exercise_gifs_read_public" on storage.objects
  for select using (bucket_id = 'exercise-gifs');

drop policy if exists "mock_profiles_onboarding_read_public" on storage.objects;
create policy "mock_profiles_onboarding_read_public" on storage.objects
  for select using (bucket_id = 'mock_profiles_onboarding');

-- ============================================
-- Migration: 20260422_alimentation.sql
-- ============================================

-- Alimentation feature: meals, daily (water/weight/notes), goals.

create table if not exists alimentation_meals (
  id         text primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  date       date not null,
  meal_type  text not null check (meal_type in ('breakfast','lunch','snack','dinner')),
  food_id    text,
  food_name  text not null,
  servings   numeric not null default 1,
  calories   numeric not null default 0,
  protein    numeric not null default 0,
  carbs      numeric not null default 0,
  fat        numeric not null default 0,
  logged_at  timestamptz not null default now()
);

create index if not exists alimentation_meals_user_date_idx
  on alimentation_meals (user_id, date);

create table if not exists alimentation_daily (
  user_id     uuid not null references auth.users(id) on delete cascade,
  date        date not null,
  water_ml    integer not null default 0,
  weight_kg   numeric,
  notes       text,
  updated_at  timestamptz not null default now(),
  primary key (user_id, date)
);

create table if not exists alimentation_goals (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  calorie_goal  integer not null default 2200,
  protein_goal  integer not null default 150,
  carbs_goal    integer not null default 250,
  fat_goal      integer not null default 70,
  updated_at    timestamptz not null default now()
);

alter table alimentation_meals enable row level security;
alter table alimentation_daily enable row level security;
alter table alimentation_goals enable row level security;

drop policy if exists "alimentation_meals_owner" on alimentation_meals;
create policy "alimentation_meals_owner" on alimentation_meals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "alimentation_daily_owner" on alimentation_daily;
create policy "alimentation_daily_owner" on alimentation_daily
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "alimentation_goals_owner" on alimentation_goals;
create policy "alimentation_goals_owner" on alimentation_goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================
-- Migration: 20260422_covers_catalog.sql
-- ============================================

-- Catalog of selectable profile cover images hosted in the `covers` bucket.
-- Users pick from this catalog; they do not upload. Premium-tier rows are
-- gated by subscription (client-enforced for now, server-enforced later).

create table if not exists covers (
  id            bigserial primary key,
  storage_path  text not null unique,
  tier          text not null default 'free' check (tier in ('free','premium')),
  sort_order    int not null default 0,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

-- Make the covers bucket public so the stored public_url resolves without auth.
update storage.buckets set public = true where id = 'covers';

-- Everyone (even anon) can read covers bucket objects.
drop policy if exists "covers_read_public" on storage.objects;
create policy "covers_read_public" on storage.objects
  for select using (bucket_id = 'covers');

-- Seed from whatever is already in the bucket, sorted by name.
insert into covers (storage_path, tier, sort_order)
select o.name, 'free',
       row_number() over (order by o.name)
  from storage.objects o
 where o.bucket_id = 'covers'
on conflict (storage_path) do nothing;

-- ============================================
-- Migration: 20260422_profile_media.sql
-- ============================================

-- Profile media: cover wallpapers + avatars storage.
--
-- After running this migration, upload the 16 default wallpaper files to the
-- `wallpapers` bucket with paths matching `default/01.jpg` .. `default/16.jpg`.
-- The `wallpapers` table is seeded with rows pointing at those public URLs.

-- 1) Extend user_profiles with a cover image URL.
alter table if exists user_profiles
  add column if not exists cover_url text;

-- 2) Wallpapers catalog.
create table if not exists wallpapers (
  id           smallint primary key,
  storage_path text    not null,
  public_url   text    not null,
  sort_order   smallint not null default 0,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);

-- Seed 16 default wallpapers. The public_url is the standard Supabase public
-- object URL format; adjust the project ref via a one-off update if needed.
do $$
declare
  base text := current_setting('app.settings.storage_public_base', true);
begin
  if base is null or base = '' then
    -- Fallback placeholder; replace via sql once the project ref is known.
    base := 'https://YOUR-PROJECT-REF.supabase.co/storage/v1/object/public/wallpapers';
  end if;

  insert into wallpapers (id, storage_path, public_url, sort_order)
  select
    i,
    format('default/%s.jpg', lpad(i::text, 2, '0')),
    format('%s/default/%s.jpg', base, lpad(i::text, 2, '0')),
    i
  from generate_series(1, 16) as g(i)
  on conflict (id) do nothing;
end $$;

-- 3) Storage buckets (public read; write restricted via RLS below).
insert into storage.buckets (id, name, public)
values ('wallpapers', 'wallpapers', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- 4) RLS on storage.objects for the avatars bucket.
-- Path convention: `${userId}/${timestamp}-${uuid}.${ext}` so the first path
-- segment is the owning user's id.
drop policy if exists "avatars_read_public" on storage.objects;
create policy "avatars_read_public" on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "avatars_insert_own" on storage.objects;
create policy "avatars_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "avatars_update_own" on storage.objects;
create policy "avatars_update_own" on storage.objects
  for update using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "avatars_delete_own" on storage.objects;
create policy "avatars_delete_own" on storage.objects
  for delete using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Wallpapers bucket: readable by anyone, writable only by service role.
drop policy if exists "wallpapers_read_public" on storage.objects;
create policy "wallpapers_read_public" on storage.objects
  for select using (bucket_id = 'wallpapers');

-- ============================================
-- Migration: 20260422_profile_names.sql
-- ============================================

-- Split display name into first_name + last_name.
-- display_name remains as a server-maintained "full name" convenience.

alter table if exists user_profiles
  add column if not exists first_name text,
  add column if not exists last_name  text;

-- Best-effort backfill: split existing display_name on the first whitespace.
update user_profiles
set
  first_name = coalesce(first_name, split_part(display_name, ' ', 1)),
  last_name  = coalesce(
    last_name,
    nullif(btrim(substring(display_name from position(' ' in display_name) + 1)), '')
  )
where display_name is not null
  and (first_name is null or last_name is null);

-- ============================================
-- Migration: 20260423_seed_home_just_for_you_and_stretch.sql
-- ============================================

-- Seed admin routines for Home: Just For You + Stretch & Warm Up
-- Idempotent: upsert on routines.id

with
ex as (
  select external_id, name
  from public.exercises
),
seed as (
  select * from (
    values
      (
        'admin-jfy-killer-chest',
        'Killer Chest Routine',
        'Power chest session with pressing and fly variations.',
        'intermediate',
        array['pectorals','delts','triceps']::text[],
        10,
        'just_for_you',
        'killer_chest',
        '#FF6B35'
      ),
      (
        'admin-jfy-quick-abs',
        '7 Min Abs',
        'Short core finisher to fire up your abs quickly.',
        'beginner',
        array['abs']::text[],
        7,
        'just_for_you',
        'quick_abs',
        '#F5A623'
      ),
      (
        'admin-stretch-sleepy-time',
        'Sleepy Time Stretching',
        'Relaxing cooldown mobility routine for evening recovery.',
        'beginner',
        array['abs','glutes','hamstrings']::text[],
        12,
        'stretch_warm_up',
        'sleepy_time',
        '#4A90D9'
      ),
      (
        'admin-stretch-tabata-4min',
        '4 Min Tabata',
        'Quick Tabata warm-up to elevate heart rate before training.',
        'intermediate',
        array['quads','glutes','delts']::text[],
        4,
        'stretch_warm_up',
        'tabata_4min',
        '#EF4444'
      ),
      (
        'admin-stretch-morning',
        'Morning Stretch',
        'Morning mobility flow to wake up hips, back, and shoulders.',
        'beginner',
        array['upper back','hamstrings','delts']::text[],
        8,
        'stretch_warm_up',
        'morning_stretch',
        '#22C55E'
      )
  ) as t(
    id,
    name,
    description,
    difficulty,
    target_muscles,
    estimated_duration,
    category,
    sub_category,
    color_hex
  )
),
resolved as (
  select
    s.*,
    (
      select jsonb_agg(
        jsonb_build_object(
          'id', e.external_id,
          'name', e.name,
          'sets', x.sets,
          'reps', x.reps,
          'restTime', x.rest_time,
          'trainingTime', coalesce(x.training_time, 0),
          'targetWeight', coalesce(x.target_weight, 0),
          'setTargets', (
            select jsonb_agg(
              jsonb_build_object(
                'setNumber', gs,
                'targetKg', coalesce(x.target_weight, 0),
                'targetReps', x.reps
              )
            )
            from generate_series(1, x.sets) gs
          )
        )
      )
      from (
        select * from (
          values
            ('admin-jfy-killer-chest','%barbell bench press%',4,'8-10',90,null,60),
            ('admin-jfy-killer-chest','%incline bench press%',3,'10',75,null,45),
            ('admin-jfy-killer-chest','%dumbbell fly%',3,'12',60,null,14),
            ('admin-jfy-killer-chest','%push-up%',3,'15',45,null,null),

            ('admin-jfy-quick-abs','%air bike%',3,'20',30,null,null),
            ('admin-jfy-quick-abs','%alternate heel touchers%',3,'20',30,null,null),
            ('admin-jfy-quick-abs','%3/4 sit-up%',3,'15',30,null,null),
            ('admin-jfy-quick-abs','%incline side plank%',3,'30s',30,30,null),

            ('admin-stretch-sleepy-time','%hamstring stretch%',2,'40s',20,40,null),
            ('admin-stretch-sleepy-time','%neck side stretch%',2,'30s',20,30,null),
            ('admin-stretch-sleepy-time','%rear deltoid stretch%',2,'30s',20,30,null),
            ('admin-stretch-sleepy-time','%calf stretch with hands against wall%',2,'30s',20,30,null),

            ('admin-stretch-tabata-4min','%mountain climber%',8,'20s',10,20,null),
            ('admin-stretch-tabata-4min','%jump squat%',8,'20s',10,20,null),
            ('admin-stretch-tabata-4min','%walking high knees lunge%',8,'20s',10,20,null),
            ('admin-stretch-tabata-4min','%bodyweight drop jump squat%',8,'20s',10,20,null),

            ('admin-stretch-morning','%chest and front of shoulder stretch%',2,'30s',15,30,null),
            ('admin-stretch-morning','%kneeling lat stretch%',2,'30s',15,30,null),
            ('admin-stretch-morning','%hamstring stretch%',2,'30s',15,30,null),
            ('admin-stretch-morning','%neck side stretch%',2,'30s',15,30,null)
        ) as m(rid, pattern, sets, reps, rest_time, training_time, target_weight)
        where m.rid = s.id
      ) x
      join lateral (
        select ex.external_id, ex.name
        from ex
        where ex.name ilike x.pattern
        order by ex.name asc
        limit 1
      ) e on true
    ) as exercises
  from seed s
)
insert into public.routines (
  id,
  user_id,
  name,
  description,
  difficulty,
  target_muscles,
  exercises,
  estimated_duration,
  is_public,
  is_admin_routine,
  category,
  sub_category,
  duration_days,
  color_hex,
  updated_at
)
select
  r.id,
  null,
  r.name,
  r.description,
  r.difficulty,
  r.target_muscles,
  coalesce(r.exercises, '[]'::jsonb),
  r.estimated_duration,
  true,
  true,
  r.category,
  r.sub_category,
  null,
  r.color_hex,
  now()
from resolved r
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  difficulty = excluded.difficulty,
  target_muscles = excluded.target_muscles,
  exercises = excluded.exercises,
  estimated_duration = excluded.estimated_duration,
  is_public = excluded.is_public,
  is_admin_routine = excluded.is_admin_routine,
  category = excluded.category,
  sub_category = excluded.sub_category,
  duration_days = excluded.duration_days,
  color_hex = excluded.color_hex,
  updated_at = excluded.updated_at;

-- ============================================
-- Migration: 20260503_food_history.sql
-- ============================================

-- Recently/frequently used foods per user. Powers the "Recent" section
-- on the food-search screen and persists across devices.

create table if not exists food_history (
  user_id       uuid not null references auth.users(id) on delete cascade,
  food_id       text not null,
  food_name     text not null,
  image_url     text,
  calories      numeric not null default 0,
  protein       numeric not null default 0,
  carbs         numeric not null default 0,
  fat           numeric not null default 0,
  use_count     integer not null default 1,
  last_used_at  timestamptz not null default now(),
  primary key (user_id, food_id)
);

create index if not exists food_history_user_recent_idx
  on food_history (user_id, last_used_at desc);

alter table food_history enable row level security;

drop policy if exists food_history_owner on food_history;
create policy food_history_owner on food_history
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================
-- Migration: 20260503_meal_image_url.sql
-- ============================================

-- Persist the food thumbnail URL on each meal entry so the alimentation
-- tab can render images without re-querying the image lookup service.

alter table alimentation_meals
  add column if not exists image_url text;

-- ============================================
-- Migration: 20260503_clear_food_history_legacy.sql
-- ============================================

-- Wipe food_history rows that were populated by the previous nutrition
-- providers (FatSecret / OpenFoodFacts). Their food_id formats and image
-- URLs no longer resolve after the migration to Spoonacular, so the cards
-- showed broken thumbnails or stale data when users reopened the search.
--
-- Safe to run as a one-shot truncate: per-user history rebuilds on next
-- food selection via NutritionService.recordFoodSelection.

truncate table public.food_history;

-- ============================================
-- Migration: 20260507_remove_schedule_add_routine_wallpaper.sql
-- ============================================

-- Drop the per-day routine assignment system. Routines are now standalone
-- entities (no day binding); the home page renders a user-selected carousel.
DROP TABLE IF EXISTS public.schedule_assignments;

-- Routines now carry an optional wallpaper image (Supabase storage public URL
-- or a covers.public_url chosen via the wallpaper picker).
ALTER TABLE public.routines
  ADD COLUMN IF NOT EXISTS wallpaper_url text;

-- ============================================
-- Migration: 20260512_workout_logs_source_allow_routine.sql
-- ============================================

-- Allow 'routine' as a workout_logs.source value (used when a guided routine
-- is completed via ActiveWorkoutContext.endGuidedRoutine).
alter table public.workout_logs
  drop constraint if exists workout_logs_source_check;

alter table public.workout_logs
  add constraint workout_logs_source_check
  check (source in ('manual', 'routine', 'health_connect', 'apple_health'));

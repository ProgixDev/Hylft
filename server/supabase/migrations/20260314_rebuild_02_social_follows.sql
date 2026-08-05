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

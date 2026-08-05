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

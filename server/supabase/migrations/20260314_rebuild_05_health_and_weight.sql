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

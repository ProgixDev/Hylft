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

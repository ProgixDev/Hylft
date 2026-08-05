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

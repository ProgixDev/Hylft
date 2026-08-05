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

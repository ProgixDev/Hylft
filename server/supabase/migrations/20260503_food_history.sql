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

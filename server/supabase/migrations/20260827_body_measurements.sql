create table if not exists body_measurements (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references user_profiles(id) on delete cascade,
  metric           text not null,
  value            numeric not null,
  measurement_date date not null,
  created_at       timestamptz not null default now(),
  unique (user_id, metric, measurement_date)
);

create index if not exists idx_body_measurements_user_metric_date
  on body_measurements (user_id, metric, measurement_date desc);

alter table body_measurements enable row level security;

drop policy if exists "body_measurements_owner" on body_measurements;
create policy "body_measurements_owner" on body_measurements
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

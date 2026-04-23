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

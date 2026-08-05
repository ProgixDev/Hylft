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

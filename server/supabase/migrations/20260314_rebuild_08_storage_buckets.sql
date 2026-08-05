-- Rebuild file 8/8 — see 20260314_rebuild_01_extensions_and_profiles.sql for context.
-- `avatars` and `wallpapers` buckets/policies already exist via
-- server/supabase/migrations/20260422_profile_media.sql — do NOT recreate
-- them here. `covers` is a genuine gap in the existing (non-reconstructed)
-- 20260422_covers_catalog.sql: that file only runs
-- `update storage.buckets set public = true where id = 'covers'` — it
-- assumes the bucket already exists, which was only ever true because
-- someone created it by hand in the original (now-lost) project. Its read
-- policy is already defined there; only the bucket row is missing, so it's
-- created here.
--
-- post-media: server/scripts/seed-feed.mjs uploads to path `${userId}/...`
-- (owner-folder convention, same as avatars). README describes this bucket
-- as auth-only (not public), unlike avatars.
--
-- exercise-gifs: server/scripts/upload-exercise-gifs.mjs uploads self-hosted
-- exercise gifs and only ever calls .storage.from('exercise-gifs').upload(...)
-- — it never creates the bucket itself, so it must exist before that script runs.
--
-- mock_profiles_onboarding: mobile/src/app/get-started/ready.tsx reads 9
-- public files (1.jpg..7.jpg, 8.avif, 9.avif) from this bucket for decorative
-- onboarding avatars. The bucket is recreated here, but the actual image
-- files are NOT in this repo and were lost with the old project — re-upload
-- them manually (dashboard Storage tab) once you have the source images, or
-- swap ready.tsx to a different asset source. Purely decorative; the app
-- works without them (marquee just renders empty).

insert into storage.buckets (id, name, public)
values ('post-media', 'post-media', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('exercise-gifs', 'exercise-gifs', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('mock_profiles_onboarding', 'mock_profiles_onboarding', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('covers', 'covers', true)
on conflict (id) do nothing;

drop policy if exists "post_media_bucket_read_authenticated" on storage.objects;
create policy "post_media_bucket_read_authenticated" on storage.objects
  for select using (bucket_id = 'post-media' and auth.role() = 'authenticated');

drop policy if exists "post_media_bucket_insert_own" on storage.objects;
create policy "post_media_bucket_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'post-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "post_media_bucket_delete_own" on storage.objects;
create policy "post_media_bucket_delete_own" on storage.objects
  for delete using (
    bucket_id = 'post-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "exercise_gifs_read_public" on storage.objects;
create policy "exercise_gifs_read_public" on storage.objects
  for select using (bucket_id = 'exercise-gifs');

drop policy if exists "mock_profiles_onboarding_read_public" on storage.objects;
create policy "mock_profiles_onboarding_read_public" on storage.objects
  for select using (bucket_id = 'mock_profiles_onboarding');

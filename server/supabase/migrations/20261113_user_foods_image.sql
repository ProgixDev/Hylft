-- Photo for user-created foods (taken with the camera or picked from the gallery).
-- Uploaded via signed URLs issued by the API, so no storage.objects policies are
-- needed; files live under unguessable paths: user/<user_id>/<timestamp>-<uuid>.<ext>

ALTER TABLE user_foods ADD COLUMN IF NOT EXISTS image_url text;

insert into storage.buckets (id, name, public)
values ('food-images', 'food-images', true)
on conflict (id) do nothing;

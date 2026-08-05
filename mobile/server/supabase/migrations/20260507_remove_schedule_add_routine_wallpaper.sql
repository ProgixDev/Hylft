-- Drop the per-day routine assignment system. Routines are now standalone
-- entities (no day binding); the home page renders a user-selected carousel.
DROP TABLE IF EXISTS public.schedule_assignments;

-- Routines now carry an optional wallpaper image (Supabase storage public URL
-- or a covers.public_url chosen via the wallpaper picker).
ALTER TABLE public.routines
  ADD COLUMN IF NOT EXISTS wallpaper_url text;

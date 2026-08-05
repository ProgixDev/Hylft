# Hylift 2.0 — Applied Migrations

Authoritative record of DDL applied to the Hylift Supabase project
(`xmezqfgmzdeybivelhtu`). Applied directly via the Supabase MCP on 2026-04-18.

| Version | Name | Purpose |
|---|---|---|
| 20260314132818 | create_user_profiles | (pre-existing) |
| 20260314150618 | create_user_profiles_table | (pre-existing) |
| 20260314150729 | create_ensure_user_profiles_function | (pre-existing; to be retired) |
| 20260418162446 | hylft_0001_extensions_and_enums | citext, btree_gin + 9 enums |
| 20260418162614 | hylft_0002_profiles_additive_and_user_settings | Additive cols on `user_profiles` + `user_settings` + `handle_new_user` trigger on `auth.users` |
| 20260418162629 | hylft_0003_social | `follows`, `follow_requests` + RLS |
| 20260418162640 | hylft_0004_exercise_catalog | `muscle_groups`, `equipment`, `exercises` (ExerciseDB mirror target) |
| 20260418162655 | hylft_0005_routines_normalized | `routine_exercises`, `routine_set_targets` + `routines.is_public`/`deleted_at` |
| 20260418162718 | hylft_0006_workouts_normalized | `workout_sessions`, `workout_session_exercises`, `workout_sets` + totals triggers |
| 20260418162725 | hylft_0007_nutrition_additive | `custom_foods.serving_size_g`/`updated_at`, `meal_logs.custom_food_id`, indexes |
| 20260418162741 | hylft_0008_health_additive_weight_and_device_workouts | `daily_health_snapshots` additions, `weight_entries`, `device_workouts` |
| 20260418162821 | hylft_0009_feed | `posts`, `post_media`, `post_likes`, `comments`, `comment_likes` + `can_view_post()` + counters |
| 20260418162845 | hylft_0010_notifications | `notifications` + auto-notify triggers (follow/like/comment/reply) |
| 20260418162849 | hylft_0011_schedule_assignments | Weekly day-of-week routine/rest assignments |
| 20260418162900 | hylft_0012_storage_buckets_and_policies | `avatars` (public) + `post-media` (auth) buckets + owner-folder RLS |
| 20260418163002 | hylft_0013_security_hardening | Pin `search_path` on 12 functions; drop overly broad avatars SELECT policy |

## Reproducing locally

Install Supabase CLI, then:

```bash
cd server
supabase link --project-ref xmezqfgmzdeybivelhtu
supabase db pull   # materializes remote migrations into ./supabase/migrations
```

## Remaining advisor findings (not addressable via SQL)

- `auth_leaked_password_protection` — enable in the Supabase dashboard
  (Authentication → Policies → "Leaked password protection").

## Deferred (plan §3 Step 3 — next session)

1. Rename `user_profiles` → `profiles` in lockstep with NestJS service refactor.
2. Backfill `workout_logs.exercises` JSON → `workout_sessions` + `workout_session_exercises` + `workout_sets`.
3. Backfill `routines.exercises` JSON → `routine_exercises` + `routine_set_targets`.
4. Drop `ensure_user_profiles_table`, `ensure_nutrition_tables`, `ensure_health_tables`, `ensure_routines_table` RPCs + the `run()` retry wrapper in every NestJS service.
5. Seed the `exercises` catalog from ExerciseDB (one-shot + nightly cron in `ExercisesModule`).

-- Allow 'routine' as a workout_logs.source value (used when a guided routine
-- is completed via ActiveWorkoutContext.endGuidedRoutine).
alter table public.workout_logs
  drop constraint if exists workout_logs_source_check;

alter table public.workout_logs
  add constraint workout_logs_source_check
  check (source in ('manual', 'routine', 'health_connect', 'apple_health'));

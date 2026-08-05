-- Seed admin routines for Home: Just For You + Stretch & Warm Up
-- Idempotent: upsert on routines.id

with
ex as (
  select external_id, name
  from public.exercises
),
seed as (
  select * from (
    values
      (
        'admin-jfy-killer-chest',
        'Killer Chest Routine',
        'Power chest session with pressing and fly variations.',
        'intermediate',
        array['pectorals','delts','triceps']::text[],
        10,
        'just_for_you',
        'killer_chest',
        '#FF6B35'
      ),
      (
        'admin-jfy-quick-abs',
        '7 Min Abs',
        'Short core finisher to fire up your abs quickly.',
        'beginner',
        array['abs']::text[],
        7,
        'just_for_you',
        'quick_abs',
        '#F5A623'
      ),
      (
        'admin-stretch-sleepy-time',
        'Sleepy Time Stretching',
        'Relaxing cooldown mobility routine for evening recovery.',
        'beginner',
        array['abs','glutes','hamstrings']::text[],
        12,
        'stretch_warm_up',
        'sleepy_time',
        '#4A90D9'
      ),
      (
        'admin-stretch-tabata-4min',
        '4 Min Tabata',
        'Quick Tabata warm-up to elevate heart rate before training.',
        'intermediate',
        array['quads','glutes','delts']::text[],
        4,
        'stretch_warm_up',
        'tabata_4min',
        '#EF4444'
      ),
      (
        'admin-stretch-morning',
        'Morning Stretch',
        'Morning mobility flow to wake up hips, back, and shoulders.',
        'beginner',
        array['upper back','hamstrings','delts']::text[],
        8,
        'stretch_warm_up',
        'morning_stretch',
        '#22C55E'
      )
  ) as t(
    id,
    name,
    description,
    difficulty,
    target_muscles,
    estimated_duration,
    category,
    sub_category,
    color_hex
  )
),
resolved as (
  select
    s.*,
    (
      select jsonb_agg(
        jsonb_build_object(
          'id', e.external_id,
          'name', e.name,
          'sets', x.sets,
          'reps', x.reps,
          'restTime', x.rest_time,
          'trainingTime', coalesce(x.training_time, 0),
          'targetWeight', coalesce(x.target_weight, 0),
          'setTargets', (
            select jsonb_agg(
              jsonb_build_object(
                'setNumber', gs,
                'targetKg', coalesce(x.target_weight, 0),
                'targetReps', x.reps
              )
            )
            from generate_series(1, x.sets) gs
          )
        )
      )
      from (
        select * from (
          values
            ('admin-jfy-killer-chest','%barbell bench press%',4,'8-10',90,null,60),
            ('admin-jfy-killer-chest','%incline bench press%',3,'10',75,null,45),
            ('admin-jfy-killer-chest','%dumbbell fly%',3,'12',60,null,14),
            ('admin-jfy-killer-chest','%push-up%',3,'15',45,null,null),

            ('admin-jfy-quick-abs','%air bike%',3,'20',30,null,null),
            ('admin-jfy-quick-abs','%alternate heel touchers%',3,'20',30,null,null),
            ('admin-jfy-quick-abs','%3/4 sit-up%',3,'15',30,null,null),
            ('admin-jfy-quick-abs','%incline side plank%',3,'30s',30,30,null),

            ('admin-stretch-sleepy-time','%hamstring stretch%',2,'40s',20,40,null),
            ('admin-stretch-sleepy-time','%neck side stretch%',2,'30s',20,30,null),
            ('admin-stretch-sleepy-time','%rear deltoid stretch%',2,'30s',20,30,null),
            ('admin-stretch-sleepy-time','%calf stretch with hands against wall%',2,'30s',20,30,null),

            ('admin-stretch-tabata-4min','%mountain climber%',8,'20s',10,20,null),
            ('admin-stretch-tabata-4min','%jump squat%',8,'20s',10,20,null),
            ('admin-stretch-tabata-4min','%walking high knees lunge%',8,'20s',10,20,null),
            ('admin-stretch-tabata-4min','%bodyweight drop jump squat%',8,'20s',10,20,null),

            ('admin-stretch-morning','%chest and front of shoulder stretch%',2,'30s',15,30,null),
            ('admin-stretch-morning','%kneeling lat stretch%',2,'30s',15,30,null),
            ('admin-stretch-morning','%hamstring stretch%',2,'30s',15,30,null),
            ('admin-stretch-morning','%neck side stretch%',2,'30s',15,30,null)
        ) as m(rid, pattern, sets, reps, rest_time, training_time, target_weight)
        where m.rid = s.id
      ) x
      join lateral (
        select ex.external_id, ex.name
        from ex
        where ex.name ilike x.pattern
        order by ex.name asc
        limit 1
      ) e on true
    ) as exercises
  from seed s
)
insert into public.routines (
  id,
  user_id,
  name,
  description,
  difficulty,
  target_muscles,
  exercises,
  estimated_duration,
  is_public,
  is_admin_routine,
  category,
  sub_category,
  duration_days,
  color_hex,
  updated_at
)
select
  r.id,
  null,
  r.name,
  r.description,
  r.difficulty,
  r.target_muscles,
  coalesce(r.exercises, '[]'::jsonb),
  r.estimated_duration,
  true,
  true,
  r.category,
  r.sub_category,
  null,
  r.color_hex,
  now()
from resolved r
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  difficulty = excluded.difficulty,
  target_muscles = excluded.target_muscles,
  exercises = excluded.exercises,
  estimated_duration = excluded.estimated_duration,
  is_public = excluded.is_public,
  is_admin_routine = excluded.is_admin_routine,
  category = excluded.category,
  sub_category = excluded.sub_category,
  duration_days = excluded.duration_days,
  color_hex = excluded.color_hex,
  updated_at = excluded.updated_at;

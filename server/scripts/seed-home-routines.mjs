import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const ROUTINES = [
  {
    id: 'admin-challenge-fullbody',
    name: 'Full Body Challenge',
    description:
      'A 28-day bodyweight program hitting every major muscle group. Perfect for building a solid fitness foundation.',
    difficulty: 'beginner',
    target_muscles: ['abs', 'chest', 'lats', 'glutes'],
    estimated_duration: 30,
    category: 'challenge',
    sub_category: 'full_body',
    duration_days: 28,
    color_hex: '#1565C0',
    exercises: [
      { search: '3/4 sit-up', reps: '15', sets: 3, restTime: 60 },
      { search: 'air bike', reps: '20', sets: 3, restTime: 60 },
      { search: 'chin-up', reps: '8', sets: 3, restTime: 90 },
      { search: 'archer push up', reps: '10', sets: 3, restTime: 90 },
      { search: 'curtsey squat', reps: '15', sets: 3, restTime: 60 },
      { search: 'drop jump squat', reps: '10', sets: 3, restTime: 90 },
    ],
  },
  {
    id: 'admin-challenge-upperbody',
    name: 'Sculpt Upper Body',
    description:
      'A 28-day cable and bodyweight program sculpting your chest, back, shoulders, and arms.',
    difficulty: 'intermediate',
    target_muscles: ['lats', 'pectorals', 'delts', 'biceps', 'triceps'],
    estimated_duration: 45,
    category: 'challenge',
    sub_category: 'upper_body',
    duration_days: 28,
    color_hex: '#2E7D9A',
    exercises: [
      { search: 'cable pulldown', reps: '10-12', sets: 4, restTime: 90 },
      { search: 'cable shoulder press', reps: '10-12', sets: 4, restTime: 90 },
      { search: 'cable lateral raise', reps: '12-15', sets: 3, restTime: 60 },
      { search: 'cable curl', reps: '12', sets: 3, restTime: 60 },
      { search: 'cable hammer curl', reps: '12', sets: 3, restTime: 60 },
      { search: 'chest dip', reps: '10', sets: 3, restTime: 90 },
      { search: 'diamond push-up', reps: '12', sets: 3, restTime: 60 },
      { search: 'close-grip push-up', reps: '15', sets: 3, restTime: 60 },
    ],
  },
  {
    id: 'admin-challenge-lowerbody',
    name: 'Lower Body Blast',
    description:
      'A 21-day heavy lower-body program maximizing strength and size in your quads, hamstrings, and glutes.',
    difficulty: 'advanced',
    target_muscles: ['glutes', 'quads', 'hamstrings'],
    estimated_duration: 55,
    category: 'challenge',
    sub_category: 'lower_body',
    duration_days: 21,
    color_hex: '#6A1FB1',
    exercises: [
      {
        search: 'barbell full squat',
        reps: '6-8',
        sets: 5,
        restTime: 120,
        targetWeight: 80,
      },
      {
        search: 'barbell deadlift',
        reps: '5',
        sets: 4,
        restTime: 180,
        targetWeight: 100,
      },
      {
        search: 'barbell lunge',
        reps: '8',
        sets: 4,
        restTime: 90,
        targetWeight: 60,
      },
      {
        search: 'barbell high bar squat',
        reps: '8',
        sets: 4,
        restTime: 120,
        targetWeight: 75,
      },
      {
        search: 'barbell front squat',
        reps: '8',
        sets: 3,
        restTime: 120,
        targetWeight: 65,
      },
      {
        search: 'barbell glute bridge',
        reps: '10',
        sets: 4,
        restTime: 90,
        targetWeight: 70,
      },
    ],
  },
  {
    id: 'admin-focus-abs-beginner',
    name: 'Abs - Beginner',
    description:
      'Foundational bodyweight core work to activate and strengthen your abs from scratch.',
    difficulty: 'beginner',
    target_muscles: ['abs'],
    estimated_duration: 15,
    category: 'body_focus',
    sub_category: 'abs',
    color_hex: '#4CAF50',
    exercises: [
      { search: '3/4 sit-up', reps: '15', sets: 3, restTime: 45 },
      { search: 'air bike', reps: '20', sets: 3, restTime: 45 },
      { search: 'alternate heel touchers', reps: '20', sets: 3, restTime: 30 },
      { search: '45° side bend', reps: '15', sets: 3, restTime: 30 },
      {
        search: 'incline side plank',
        reps: '30s',
        sets: 3,
        restTime: 45,
        trainingTime: 30,
      },
      {
        search: 'arms overhead full sit-up',
        reps: '12',
        sets: 3,
        restTime: 45,
      },
    ],
  },
  {
    id: 'admin-focus-abs-intermediate',
    name: 'Abs - Intermediate',
    description:
      'Weighted and stability-ball core exercises to build a stronger, more defined midsection.',
    difficulty: 'intermediate',
    target_muscles: ['abs'],
    estimated_duration: 22,
    category: 'body_focus',
    sub_category: 'abs',
    color_hex: '#4CAF50',
    exercises: [
      {
        search: 'dumbbell side bend',
        reps: '15',
        sets: 4,
        restTime: 60,
        targetWeight: 10,
      },
      {
        search: 'spell caster',
        reps: '12',
        sets: 4,
        restTime: 60,
        targetWeight: 8,
      },
      { search: 'crunch (stability ball)', reps: '15', sets: 4, restTime: 45 },
      {
        search: 'russian twist',
        reps: '20',
        sets: 4,
        restTime: 60,
        targetWeight: 4,
      },
      { search: 'stability ball crunch', reps: '15', sets: 4, restTime: 45 },
      { search: 'pull-in (stability ball)', reps: '12', sets: 4, restTime: 60 },
    ],
  },
  {
    id: 'admin-focus-abs-advanced',
    name: 'Abs - Advanced',
    description:
      'High-volume weighted core work pushing your abs with progressive overload.',
    difficulty: 'advanced',
    target_muscles: ['abs'],
    estimated_duration: 27,
    category: 'body_focus',
    sub_category: 'abs',
    color_hex: '#4CAF50',
    exercises: [
      {
        search: 'dumbbell side bend',
        reps: '20',
        sets: 5,
        restTime: 30,
        targetWeight: 15,
      },
      {
        search: 'spell caster',
        reps: '15',
        sets: 5,
        restTime: 45,
        targetWeight: 12,
      },
      {
        search: 'russian twist',
        reps: '25',
        sets: 5,
        restTime: 45,
        targetWeight: 6,
      },
      { search: 'crunch (stability ball)', reps: '20', sets: 5, restTime: 30 },
      { search: 'stability ball crunch', reps: '20', sets: 5, restTime: 30 },
      { search: 'pull-in (stability ball)', reps: '15', sets: 5, restTime: 45 },
    ],
  },
  {
    id: 'admin-focus-arm-beginner',
    name: 'Arms - Beginner',
    description:
      'Bodyweight and band exercises to build bicep and tricep strength for beginners.',
    difficulty: 'beginner',
    target_muscles: ['biceps', 'triceps'],
    estimated_duration: 16,
    category: 'body_focus',
    sub_category: 'arm',
    color_hex: '#FF9800',
    exercises: [
      {
        search: 'band alternating biceps curl',
        reps: '12',
        sets: 3,
        restTime: 60,
      },
      { search: 'biceps pull-up', reps: '8', sets: 3, restTime: 90 },
      { search: 'biceps narrow pull-ups', reps: '8', sets: 3, restTime: 90 },
      { search: 'close-grip push-up', reps: '12', sets: 3, restTime: 60 },
      { search: 'diamond push-up', reps: '10', sets: 3, restTime: 60 },
      { search: 'bench dip', reps: '15', sets: 3, restTime: 60 },
    ],
  },
  {
    id: 'admin-focus-arm-intermediate',
    name: 'Arms - Intermediate',
    description:
      'Cable isolation work combined with bodyweight pressing to fully pump biceps and triceps.',
    difficulty: 'intermediate',
    target_muscles: ['biceps', 'triceps'],
    estimated_duration: 24,
    category: 'body_focus',
    sub_category: 'arm',
    color_hex: '#FF9800',
    exercises: [
      { search: 'cable curl', reps: '10-12', sets: 4, restTime: 60 },
      { search: 'cable hammer curl', reps: '12', sets: 4, restTime: 60 },
      { search: 'cable preacher curl', reps: '10', sets: 4, restTime: 75 },
      { search: 'cable triceps pushdown', reps: '12', sets: 4, restTime: 60 },
      {
        search: 'cable overhead tricep extension',
        reps: '12',
        sets: 4,
        restTime: 60,
      },
      { search: 'close-grip push-up', reps: '15', sets: 3, restTime: 60 },
    ],
  },
  {
    id: 'admin-focus-arm-advanced',
    name: 'Arms - Advanced',
    description:
      'High-volume barbell and cable arm session built for serious size and strength gains.',
    difficulty: 'advanced',
    target_muscles: ['biceps', 'triceps'],
    estimated_duration: 30,
    category: 'body_focus',
    sub_category: 'arm',
    color_hex: '#FF9800',
    exercises: [
      {
        search: 'barbell curl',
        reps: '8-10',
        sets: 5,
        restTime: 75,
        targetWeight: 35,
      },
      {
        search: 'barbell reverse curl',
        reps: '10',
        sets: 4,
        restTime: 75,
        targetWeight: 25,
      },
      { search: 'cable curl', reps: '12', sets: 4, restTime: 60 },
      {
        search: 'barbell lying triceps extension',
        reps: '10',
        sets: 4,
        restTime: 90,
        targetWeight: 30,
      },
      {
        search: 'cable overhead tricep extension',
        reps: '12',
        sets: 4,
        restTime: 60,
      },
      { search: 'diamond push-up', reps: '15', sets: 4, restTime: 45 },
    ],
  },
  {
    id: 'admin-focus-back-beginner',
    name: 'Back - Beginner',
    description:
      'Simple pull-focused routine to build posture, width, and back awareness.',
    difficulty: 'beginner',
    target_muscles: ['lats', 'upper back'],
    estimated_duration: 16,
    category: 'body_focus',
    sub_category: 'back',
    color_hex: '#2196F3',
    exercises: [
      { search: 'band assisted pull-up', reps: '10', sets: 3, restTime: 75 },
      { search: 'chin-up', reps: '8', sets: 3, restTime: 90 },
      { search: 'cable pulldown', reps: '12', sets: 3, restTime: 75 },
      { search: 'cable seated row', reps: '12', sets: 3, restTime: 75 },
      { search: 'inverted row', reps: '12', sets: 3, restTime: 60 },
      { search: 'superman', reps: '15', sets: 3, restTime: 45 },
    ],
  },
  {
    id: 'admin-focus-back-intermediate',
    name: 'Back - Intermediate',
    description:
      'Classic pulling session combining vertical and horizontal patterns for thickness and width.',
    difficulty: 'intermediate',
    target_muscles: ['lats', 'upper back'],
    estimated_duration: 24,
    category: 'body_focus',
    sub_category: 'back',
    color_hex: '#2196F3',
    exercises: [
      { search: 'cable pulldown', reps: '10-12', sets: 4, restTime: 75 },
      { search: 'cable seated row', reps: '10-12', sets: 4, restTime: 75 },
      {
        search: [
          'close grip lat pulldown',
          'parallel grip lat pulldown',
          'reverse grip machine lat pulldown',
        ],
        reps: '12',
        sets: 4,
        restTime: 75,
      },
      {
        search: ['machine row', 'cable seated row'],
        reps: '12',
        sets: 3,
        restTime: 75,
      },
      {
        search: ['straight arm pulldown', 'cable straight arm pulldown'],
        reps: '15',
        sets: 3,
        restTime: 60,
      },
      {
        search: ['face pull', 'cable rear delt row'],
        reps: '15',
        sets: 3,
        restTime: 45,
      },
    ],
  },
  {
    id: 'admin-focus-back-advanced',
    name: 'Back - Advanced',
    description:
      'Heavy back day with barbell and machine work to maximize width, thickness, and power.',
    difficulty: 'advanced',
    target_muscles: ['lats', 'upper back', 'traps'],
    estimated_duration: 28,
    category: 'body_focus',
    sub_category: 'back',
    color_hex: '#2196F3',
    exercises: [
      {
        search: 'barbell deadlift',
        reps: '5',
        sets: 5,
        restTime: 180,
        targetWeight: 110,
      },
      {
        search: 'barbell bent over row',
        reps: '8',
        sets: 4,
        restTime: 120,
        targetWeight: 70,
      },
      {
        search: 'weighted pull-up',
        reps: '8',
        sets: 4,
        restTime: 120,
        targetWeight: 10,
      },
      {
        search: 't-bar row',
        reps: '10',
        sets: 4,
        restTime: 90,
        targetWeight: 50,
      },
      {
        search: [
          'close grip lat pulldown',
          'parallel grip lat pulldown',
          'reverse grip machine lat pulldown',
        ],
        reps: '12',
        sets: 4,
        restTime: 75,
      },
      {
        search: ['face pull', 'cable rear delt row'],
        reps: '15',
        sets: 3,
        restTime: 45,
      },
    ],
  },
  {
    id: 'admin-focus-leg-beginner',
    name: 'Legs - Beginner',
    description:
      'Low-impact leg routine to build strength and control through full lower-body basics.',
    difficulty: 'beginner',
    target_muscles: ['glutes', 'quads', 'abductors'],
    estimated_duration: 15,
    category: 'body_focus',
    sub_category: 'leg',
    color_hex: '#E91E63',
    exercises: [
      {
        search: ['bodyweight squat', 'squat'],
        reps: '15',
        sets: 3,
        restTime: 45,
      },
      {
        search: ['bodyweight lunge', 'walking lunge'],
        reps: '12',
        sets: 3,
        restTime: 45,
      },
      {
        search: ['glute bridge', 'glute bridge on floor'],
        reps: '15',
        sets: 3,
        restTime: 45,
      },
      { search: 'curtsey squat', reps: '12', sets: 3, restTime: 45 },
      {
        search: ['step-up', 'dumbbell step-up'],
        reps: '12',
        sets: 3,
        restTime: 45,
      },
      {
        search: ['wall sit', 'chair squat', 'squat'],
        reps: '30s',
        sets: 3,
        restTime: 45,
        trainingTime: 30,
      },
    ],
  },
  {
    id: 'admin-focus-leg-intermediate',
    name: 'Legs - Intermediate',
    description:
      'Balanced lower-body hypertrophy session for quads, glutes, and hamstrings.',
    difficulty: 'intermediate',
    target_muscles: ['glutes', 'quads', 'hamstrings'],
    estimated_duration: 24,
    category: 'body_focus',
    sub_category: 'leg',
    color_hex: '#E91E63',
    exercises: [
      {
        search: 'barbell full squat',
        reps: '8-10',
        sets: 4,
        restTime: 90,
        targetWeight: 60,
      },
      {
        search: 'barbell lunge',
        reps: '10',
        sets: 4,
        restTime: 75,
        targetWeight: 40,
      },
      {
        search: 'barbell glute bridge',
        reps: '12',
        sets: 4,
        restTime: 75,
        targetWeight: 50,
      },
      {
        search: ['romanian deadlift', 'barbell romanian deadlift'],
        reps: '10',
        sets: 4,
        restTime: 90,
        targetWeight: 60,
      },
      {
        search: ['leg press', 'smith leg press'],
        reps: '12',
        sets: 3,
        restTime: 75,
        targetWeight: 100,
      },
      { search: 'walking lunge', reps: '12', sets: 3, restTime: 60 },
    ],
  },
  {
    id: 'admin-focus-leg-advanced',
    name: 'Legs - Advanced',
    description:
      'Heavy compound leg work for athletes chasing elite strength and lower-body development.',
    difficulty: 'advanced',
    target_muscles: ['glutes', 'quads', 'hamstrings'],
    estimated_duration: 30,
    category: 'body_focus',
    sub_category: 'leg',
    color_hex: '#E91E63',
    exercises: [
      {
        search: 'barbell full squat',
        reps: '6',
        sets: 5,
        restTime: 150,
        targetWeight: 90,
      },
      {
        search: 'barbell deadlift',
        reps: '5',
        sets: 5,
        restTime: 180,
        targetWeight: 110,
      },
      {
        search: 'barbell front squat',
        reps: '8',
        sets: 4,
        restTime: 120,
        targetWeight: 70,
      },
      {
        search: 'barbell lunge',
        reps: '8',
        sets: 4,
        restTime: 90,
        targetWeight: 60,
      },
      {
        search: 'barbell glute bridge',
        reps: '10',
        sets: 4,
        restTime: 90,
        targetWeight: 80,
      },
      {
        search: ['romanian deadlift', 'barbell romanian deadlift'],
        reps: '8',
        sets: 4,
        restTime: 120,
        targetWeight: 80,
      },
    ],
  },
  {
    id: 'admin-focus-shoulder-beginner',
    name: 'Shoulders - Beginner',
    description:
      'Intro shoulder session to improve control, posture, and delt activation.',
    difficulty: 'beginner',
    target_muscles: ['delts'],
    estimated_duration: 16,
    category: 'body_focus',
    sub_category: 'shoulder',
    color_hex: '#9C27B0',
    exercises: [
      {
        search: ['dumbbell shoulder press', 'dumbbell seated shoulder press'],
        reps: '12',
        sets: 3,
        restTime: 60,
        targetWeight: 8,
      },
      {
        search: 'dumbbell lateral raise',
        reps: '15',
        sets: 3,
        restTime: 45,
        targetWeight: 5,
      },
      {
        search: 'dumbbell front raise',
        reps: '12',
        sets: 3,
        restTime: 45,
        targetWeight: 5,
      },
      {
        search: 'rear delt raise',
        reps: '12',
        sets: 3,
        restTime: 45,
        targetWeight: 5,
      },
      {
        search: 'upright row',
        reps: '12',
        sets: 3,
        restTime: 60,
        targetWeight: 20,
      },
      {
        search: ['face pull', 'cable rear delt row'],
        reps: '15',
        sets: 3,
        restTime: 45,
      },
    ],
  },
  {
    id: 'admin-focus-shoulder-intermediate',
    name: 'Shoulders - Intermediate',
    description:
      'Cable and dumbbell shoulder workout covering all delt heads for shape and strength.',
    difficulty: 'intermediate',
    target_muscles: ['delts'],
    estimated_duration: 22,
    category: 'body_focus',
    sub_category: 'shoulder',
    color_hex: '#9C27B0',
    exercises: [
      { search: 'cable shoulder press', reps: '10-12', sets: 4, restTime: 75 },
      { search: 'cable lateral raise', reps: '12', sets: 4, restTime: 60 },
      {
        search: ['cable front raise', 'cable front shoulder raise'],
        reps: '12',
        sets: 3,
        restTime: 60,
      },
      { search: 'cable upright row', reps: '12', sets: 3, restTime: 75 },
      {
        search: 'alternate side press',
        reps: '10',
        sets: 3,
        restTime: 75,
        targetWeight: 12,
      },
      {
        search: ['rear delt raise', 'dumbbell rear delt raise'],
        reps: '12',
        sets: 3,
        restTime: 60,
        targetWeight: 8,
      },
    ],
  },
  {
    id: 'admin-focus-shoulder-advanced',
    name: 'Shoulders - Advanced',
    description:
      'Heavy barbell overhead pressing and raises for elite shoulder strength and boulder-delt development.',
    difficulty: 'advanced',
    target_muscles: ['delts'],
    estimated_duration: 28,
    category: 'body_focus',
    sub_category: 'shoulder',
    color_hex: '#9C27B0',
    exercises: [
      {
        search: 'barbell seated overhead press',
        reps: '6-8',
        sets: 5,
        restTime: 120,
        targetWeight: 60,
      },
      {
        search: 'close grip military press',
        reps: '8',
        sets: 4,
        restTime: 120,
        targetWeight: 55,
      },
      {
        search: 'barbell upright row',
        reps: '8',
        sets: 4,
        restTime: 90,
        targetWeight: 40,
      },
      {
        search: 'barbell rear delt raise',
        reps: '10',
        sets: 4,
        restTime: 75,
        targetWeight: 20,
      },
      {
        search: 'barbell front raise',
        reps: '10',
        sets: 3,
        restTime: 75,
        targetWeight: 25,
      },
      {
        search: 'wide military press',
        reps: '8',
        sets: 4,
        restTime: 120,
        targetWeight: 50,
      },
    ],
  },
  {
    id: 'admin-jfy-killer-chest',
    name: 'Killer Chest Routine',
    description:
      'Power chest session with pressing and fly variations for a strong upper-body pump.',
    difficulty: 'intermediate',
    target_muscles: ['pectorals', 'delts', 'triceps'],
    estimated_duration: 10,
    category: 'just_for_you',
    sub_category: 'killer_chest',
    color_hex: '#FF6B35',
    exercises: [
      {
        search: ['barbell bench press', 'bench press'],
        reps: '8-10',
        sets: 4,
        restTime: 90,
        targetWeight: 60,
      },
      {
        search: ['incline bench press', 'incline barbell bench press'],
        reps: '10',
        sets: 3,
        restTime: 75,
        targetWeight: 45,
      },
      {
        search: ['dumbbell fly', 'dumbbell flyes', 'dumbbell chest fly'],
        reps: '12',
        sets: 3,
        restTime: 60,
        targetWeight: 14,
      },
      { search: ['push-up', 'push up'], reps: '15', sets: 3, restTime: 45 },
    ],
  },
  {
    id: 'admin-jfy-quick-abs',
    name: '7 Min Abs',
    description:
      'Short and effective core routine to hit your abs in just a few minutes.',
    difficulty: 'beginner',
    target_muscles: ['abs'],
    estimated_duration: 7,
    category: 'just_for_you',
    sub_category: 'quick_abs',
    color_hex: '#F5A623',
    exercises: [
      { search: 'air bike', reps: '20', sets: 3, restTime: 30 },
      { search: 'alternate heel touchers', reps: '20', sets: 3, restTime: 30 },
      { search: '3/4 sit-up', reps: '15', sets: 3, restTime: 30 },
      {
        search: 'incline side plank',
        reps: '30s',
        sets: 3,
        restTime: 30,
        trainingTime: 30,
      },
    ],
  },
  {
    id: 'admin-stretch-sleepy-time',
    name: 'Sleepy Time Stretching',
    description:
      'Relaxing cooldown mobility flow for better recovery and sleep readiness.',
    difficulty: 'beginner',
    target_muscles: ['hamstrings', 'upper back', 'abs'],
    estimated_duration: 12,
    category: 'stretch_warm_up',
    sub_category: 'sleepy_time',
    color_hex: '#4A90D9',
    exercises: [
      {
        search: 'hamstring stretch',
        reps: '40s',
        sets: 2,
        restTime: 20,
        trainingTime: 40,
      },
      {
        search: 'neck side stretch',
        reps: '30s',
        sets: 2,
        restTime: 20,
        trainingTime: 30,
      },
      {
        search: 'rear deltoid stretch',
        reps: '30s',
        sets: 2,
        restTime: 20,
        trainingTime: 30,
      },
      {
        search: 'calf stretch with hands against wall',
        reps: '30s',
        sets: 2,
        restTime: 20,
        trainingTime: 30,
      },
    ],
  },
  {
    id: 'admin-stretch-tabata-4min',
    name: '4 Min Tabata',
    description:
      'Quick Tabata warm-up to elevate heart rate before your workout.',
    difficulty: 'intermediate',
    target_muscles: ['quads', 'glutes', 'delts'],
    estimated_duration: 4,
    category: 'stretch_warm_up',
    sub_category: 'tabata_4min',
    color_hex: '#EF4444',
    exercises: [
      {
        search: 'mountain climber',
        reps: '20s',
        sets: 8,
        restTime: 10,
        trainingTime: 20,
      },
      {
        search: 'jump squat',
        reps: '20s',
        sets: 8,
        restTime: 10,
        trainingTime: 20,
      },
      {
        search: 'walking high knees lunge',
        reps: '20s',
        sets: 8,
        restTime: 10,
        trainingTime: 20,
      },
      {
        search: 'bodyweight drop jump squat',
        reps: '20s',
        sets: 8,
        restTime: 10,
        trainingTime: 20,
      },
    ],
  },
  {
    id: 'admin-stretch-morning',
    name: 'Morning Stretch',
    description:
      'Morning mobility sequence to wake up your spine, shoulders, and legs.',
    difficulty: 'beginner',
    target_muscles: ['upper back', 'hamstrings', 'delts'],
    estimated_duration: 8,
    category: 'stretch_warm_up',
    sub_category: 'morning_stretch',
    color_hex: '#22C55E',
    exercises: [
      {
        search: 'chest and front of shoulder stretch',
        reps: '30s',
        sets: 2,
        restTime: 15,
        trainingTime: 30,
      },
      {
        search: 'kneeling lat stretch',
        reps: '30s',
        sets: 2,
        restTime: 15,
        trainingTime: 30,
      },
      {
        search: 'hamstring stretch',
        reps: '30s',
        sets: 2,
        restTime: 15,
        trainingTime: 30,
      },
      {
        search: 'neck side stretch',
        reps: '30s',
        sets: 2,
        restTime: 15,
        trainingTime: 30,
      },
    ],
  },
];

function buildSetTargets(sets, reps, targetWeight = 0) {
  return Array.from({ length: sets }, (_, index) => ({
    setNumber: index + 1,
    targetKg: targetWeight,
    targetReps: reps,
  }));
}

function buildPatterns(search) {
  const base = Array.isArray(search) ? search : [search];
  const patterns = new Set();

  for (const item of base) {
    patterns.add(`%${item}%`);

    const tokens = item
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (tokens.length > 0) {
      patterns.add(`%${tokens.join('%')}%`);
      patterns.add(`%${tokens.slice(0, 3).join('%')}%`);
    }
  }

  return Array.from(patterns);
}

async function findExercise(search) {
  for (const pattern of buildPatterns(search)) {
    const { data, error } = await supabase
      .from('exercises')
      .select('external_id,name')
      .ilike('name', pattern)
      .order('name', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (data) return data;
  }

  throw new Error(`Exercise not found for search "${JSON.stringify(search)}"`);
}

async function mapExercise(exerciseConfig) {
  const exercise = await findExercise(exerciseConfig.search);
  const targetWeight = exerciseConfig.targetWeight ?? 0;

  return {
    id: exercise.external_id,
    name: exercise.name,
    sets: exerciseConfig.sets,
    reps: exerciseConfig.reps,
    restTime: exerciseConfig.restTime,
    trainingTime: exerciseConfig.trainingTime ?? 0,
    targetWeight,
    setTargets: buildSetTargets(
      exerciseConfig.sets,
      exerciseConfig.reps,
      targetWeight,
    ),
  };
}

async function upsertRoutine(routineConfig) {
  const exercises = [];
  for (const exerciseConfig of routineConfig.exercises) {
    exercises.push(await mapExercise(exerciseConfig));
  }

  const row = {
    id: routineConfig.id,
    user_id: null,
    name: routineConfig.name,
    description: routineConfig.description,
    difficulty: routineConfig.difficulty,
    target_muscles: routineConfig.target_muscles,
    exercises,
    estimated_duration: routineConfig.estimated_duration,
    is_public: true,
    is_admin_routine: true,
    category: routineConfig.category,
    sub_category: routineConfig.sub_category,
    duration_days: routineConfig.duration_days ?? null,
    color_hex: routineConfig.color_hex,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from('routines').upsert(row, {
    onConflict: 'id',
  });

  if (error) throw error;
  console.log(`[seed-home-routines] upserted ${routineConfig.id}`);
}

async function main() {
  for (const routine of ROUTINES) {
    await upsertRoutine(routine);
  }

  const { count, error } = await supabase
    .from('routines')
    .select('*', { count: 'exact', head: true })
    .eq('is_admin_routine', true)
    .is('deleted_at', null);

  if (error) throw error;
  console.log(`[seed-home-routines] done. admin routines count: ${count}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

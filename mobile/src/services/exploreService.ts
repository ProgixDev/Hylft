/**
 * Explore Routines Service
 *
 * Provides curated community/template routines for the "Explore" section.
 * wger.de's public REST API does not expose shared/community routines, so
 * templates are defined here with real exercise names that wger recognises.
 *
 * The returned objects are fully compatible with the app's `Routine` type, so
 * they work with `RoutineCard`, `buildActiveWorkoutFromRoutine`, etc.
 */

import { Routine } from "../data/mockData";

// ─── Extended type ────────────────────────────────────────────────────────────

/** A curated template routine — superset of Routine with explore-specific meta. */
export interface ExploreRoutine extends Routine {
  /** High-level category used for the filter chips */
  category: ExploreCategory;
  /** Author / programme name shown on the card */
  author: string;
  /** Total weekly frequency (days per week) */
  daysPerWeek: number;
  /** Brief tags summarising the programme */
  tags: string[];
}

export type ExploreCategory =
  | "Full Body"
  | "Push"
  | "Pull"
  | "Legs"
  | "Upper"
  | "Lower"
  | "Core"
  | "Cardio";

// ─── Template data ────────────────────────────────────────────────────────────

const TEMPLATES: ExploreRoutine[] = [
  // ── Full Body ───────────────────────────────────────────────────────────────
  {
    id: "explore-full-body-beginner",
    userId: "template",
    name: "Full Body Beginner",
    description:
      "A classic 3-day full-body programme that builds strength across all major muscle groups. Perfect starting point for anyone new to lifting.",
    category: "Full Body",
    author: "Hylift Team",
    daysPerWeek: 3,
    estimatedDuration: 45,
    timesCompleted: 0,
    targetMuscles: ["Chest", "Back", "Quads", "Hamstrings", "Shoulders"],
    tags: ["Strength", "3-day split", "Compound"],
    exercises: [
      {
        id: "expl-squat",
        name: "Barbell Squat",
        sets: 3,
        reps: "8",
        restTime: 120,
      },
      {
        id: "expl-bench",
        name: "Bench Press",
        sets: 3,
        reps: "8",
        restTime: 120,
      },
      {
        id: "expl-row",
        name: "Barbell Row",
        sets: 3,
        reps: "8",
        restTime: 90,
      },
      {
        id: "expl-ohp",
        name: "Overhead Press",
        sets: 3,
        reps: "8",
        restTime: 90,
      },
      {
        id: "expl-deadlift",
        name: "Deadlift",
        sets: 3,
        reps: "5",
        restTime: 180,
      },
    ],
  },

  {
    id: "explore-stronglifts-5x5",
    userId: "template",
    name: "StrongLifts 5×5",
    description:
      "One of the most proven beginner barbell programmes. Two alternating workouts, three days a week. Add weight every session.",
    category: "Full Body",
    author: "Mehdi – StrongLifts",
    daysPerWeek: 3,
    estimatedDuration: 45,
    timesCompleted: 0,
    targetMuscles: ["Quads", "Back", "Chest", "Glutes"],
    tags: ["5×5", "Linear Progression", "Barbell"],
    exercises: [
      {
        id: "expl-sl-squat",
        name: "Barbell Squat",
        sets: 5,
        reps: "5",
        restTime: 180,
      },
      {
        id: "expl-sl-bench",
        name: "Bench Press",
        sets: 5,
        reps: "5",
        restTime: 180,
      },
      {
        id: "expl-sl-row",
        name: "Barbell Row",
        sets: 5,
        reps: "5",
        restTime: 180,
      },
    ],
  },

  // ── Push ────────────────────────────────────────────────────────────────────
  {
    id: "explore-push-day-ppl",
    userId: "template",
    name: "PPL – Push Day",
    description:
      "The Push session from the classic Push/Pull/Legs split. Focuses on chest, shoulders and triceps with a mix of compound and isolation work.",
    category: "Push",
    author: "Hylift Team",
    daysPerWeek: 6,
    estimatedDuration: 60,
    timesCompleted: 0,
    targetMuscles: ["Chest", "Shoulders", "Triceps"],
    tags: ["PPL", "Hypertrophy", "6-day split"],
    exercises: [
      {
        id: "expl-push-bench",
        name: "Bench Press",
        sets: 4,
        reps: "8",
        restTime: 120,
      },
      {
        id: "expl-push-incline",
        name: "Incline Dumbbell Press",
        sets: 3,
        reps: "10",
        restTime: 90,
      },
      {
        id: "expl-push-ohp",
        name: "Overhead Press",
        sets: 3,
        reps: "10",
        restTime: 90,
      },
      {
        id: "expl-push-lateral",
        name: "Lateral Raise",
        sets: 4,
        reps: "15",
        restTime: 60,
      },
      {
        id: "expl-push-pushdown",
        name: "Tricep Pushdown",
        sets: 3,
        reps: "12",
        restTime: 60,
      },
      {
        id: "expl-push-ote",
        name: "Overhead Tricep Extension",
        sets: 3,
        reps: "12",
        restTime: 60,
      },
    ],
  },

  {
    id: "explore-chest-blast",
    userId: "template",
    name: "Chest & Triceps Blast",
    description:
      "High-volume chest session with a dedicated triceps finisher. Great for adding upper-body mass quickly.",
    category: "Push",
    author: "Hylift Team",
    daysPerWeek: 2,
    estimatedDuration: 70,
    timesCompleted: 0,
    targetMuscles: ["Chest", "Triceps", "Front Delts"],
    tags: ["Volume", "Hypertrophy", "High Intensity"],
    exercises: [
      {
        id: "expl-cb-flat",
        name: "Bench Press",
        sets: 5,
        reps: "6",
        restTime: 150,
      },
      {
        id: "expl-cb-incline-bar",
        name: "Incline Barbell Press",
        sets: 4,
        reps: "8",
        restTime: 120,
      },
      {
        id: "expl-cb-decline",
        name: "Decline Dumbbell Press",
        sets: 3,
        reps: "10",
        restTime: 90,
      },
      {
        id: "expl-cb-flyes",
        name: "Cable Fly",
        sets: 3,
        reps: "12",
        restTime: 60,
      },
      {
        id: "expl-cb-dips",
        name: "Chest Dips",
        sets: 3,
        reps: "10",
        restTime: 90,
      },
      {
        id: "expl-cb-closegrip",
        name: "Close-Grip Bench Press",
        sets: 3,
        reps: "10",
        restTime: 90,
      },
      {
        id: "expl-cb-skullcrusher",
        name: "Skull Crusher",
        sets: 3,
        reps: "12",
        restTime: 60,
      },
    ],
  },

  // ── Pull ────────────────────────────────────────────────────────────────────
  {
    id: "explore-pull-day-ppl",
    userId: "template",
    name: "PPL – Pull Day",
    description:
      "The Pull session from the classic Push/Pull/Legs split. Back and biceps are trained through a full range of horizontal and vertical pulling movements.",
    category: "Pull",
    author: "Hylift Team",
    daysPerWeek: 6,
    estimatedDuration: 60,
    timesCompleted: 0,
    targetMuscles: ["Back", "Biceps", "Rear Delts"],
    tags: ["PPL", "Hypertrophy", "6-day split"],
    exercises: [
      {
        id: "expl-pull-pullup",
        name: "Pull Up",
        sets: 4,
        reps: "8",
        restTime: 120,
      },
      {
        id: "expl-pull-row",
        name: "Barbell Row",
        sets: 4,
        reps: "8",
        restTime: 120,
      },
      {
        id: "expl-pull-latpull",
        name: "Lat Pulldown",
        sets: 3,
        reps: "10",
        restTime: 90,
      },
      {
        id: "expl-pull-cablerow",
        name: "Seated Cable Row",
        sets: 3,
        reps: "12",
        restTime: 90,
      },
      {
        id: "expl-pull-barbcurl",
        name: "Barbell Curl",
        sets: 3,
        reps: "12",
        restTime: 60,
      },
      {
        id: "expl-pull-hammercurl",
        name: "Hammer Curl",
        sets: 3,
        reps: "15",
        restTime: 60,
      },
    ],
  },

  // ── Legs ────────────────────────────────────────────────────────────────────
  {
    id: "explore-leg-day-ppl",
    userId: "template",
    name: "PPL – Leg Day",
    description:
      "The Legs session from the Push/Pull/Legs split. Quad-dominant with a hamstring and calf accessory finish.",
    category: "Legs",
    author: "Hylift Team",
    daysPerWeek: 6,
    estimatedDuration: 65,
    timesCompleted: 0,
    targetMuscles: ["Quads", "Hamstrings", "Glutes", "Calves"],
    tags: ["PPL", "Hypertrophy", "6-day split"],
    exercises: [
      {
        id: "expl-leg-squat",
        name: "Barbell Squat",
        sets: 4,
        reps: "8",
        restTime: 180,
      },
      {
        id: "expl-leg-rdl",
        name: "Romanian Deadlift",
        sets: 3,
        reps: "10",
        restTime: 120,
      },
      {
        id: "expl-leg-press",
        name: "Leg Press",
        sets: 3,
        reps: "12",
        restTime: 90,
      },
      {
        id: "expl-leg-curl",
        name: "Leg Curl",
        sets: 3,
        reps: "12",
        restTime: 60,
      },
      {
        id: "expl-leg-ext",
        name: "Leg Extension",
        sets: 3,
        reps: "15",
        restTime: 60,
      },
      {
        id: "expl-leg-calf",
        name: "Standing Calf Raise",
        sets: 4,
        reps: "20",
        restTime: 60,
      },
    ],
  },

  {
    id: "explore-legs-power",
    userId: "template",
    name: "Power Legs",
    description:
      "Heavy compound leg work centred around squat variants and the deadlift. Builds raw lower-body strength.",
    category: "Legs",
    author: "Hylift Team",
    daysPerWeek: 2,
    estimatedDuration: 75,
    timesCompleted: 0,
    targetMuscles: ["Quads", "Hamstrings", "Glutes", "Lower Back"],
    tags: ["Power", "Strength", "Compound"],
    exercises: [
      {
        id: "expl-pl-backsquat",
        name: "Barbell Squat",
        sets: 5,
        reps: "5",
        restTime: 240,
      },
      {
        id: "expl-pl-frontsquat",
        name: "Front Squat",
        sets: 3,
        reps: "5",
        restTime: 180,
      },
      {
        id: "expl-pl-deadlift",
        name: "Deadlift",
        sets: 3,
        reps: "5",
        restTime: 240,
      },
      {
        id: "expl-pl-lunge",
        name: "Barbell Lunge",
        sets: 3,
        reps: "8",
        restTime: 120,
      },
      {
        id: "expl-pl-ghr",
        name: "Romanian Deadlift",
        sets: 3,
        reps: "8",
        restTime: 120,
      },
    ],
  },

  // ── Upper ───────────────────────────────────────────────────────────────────
  {
    id: "explore-upper-strength",
    userId: "template",
    name: "Upper Body Strength",
    description:
      "A focused upper-body day using heavy compound lifts to maximise strength and muscle mass across the chest, back and shoulders.",
    category: "Upper",
    author: "Hylift Team",
    daysPerWeek: 4,
    estimatedDuration: 55,
    timesCompleted: 0,
    targetMuscles: ["Chest", "Back", "Shoulders", "Biceps", "Triceps"],
    tags: ["Upper/Lower", "Strength", "4-day split"],
    exercises: [
      {
        id: "expl-up-bench",
        name: "Bench Press",
        sets: 4,
        reps: "6",
        restTime: 150,
      },
      {
        id: "expl-up-row",
        name: "Barbell Row",
        sets: 4,
        reps: "6",
        restTime: 150,
      },
      {
        id: "expl-up-ohp",
        name: "Overhead Press",
        sets: 3,
        reps: "8",
        restTime: 120,
      },
      {
        id: "expl-up-pullup",
        name: "Pull Up",
        sets: 3,
        reps: "8",
        restTime: 120,
      },
      {
        id: "expl-up-curl",
        name: "Barbell Curl",
        sets: 3,
        reps: "10",
        restTime: 60,
      },
      {
        id: "expl-up-dip",
        name: "Tricep Dips",
        sets: 3,
        reps: "10",
        restTime: 60,
      },
    ],
  },

  // ── Lower ───────────────────────────────────────────────────────────────────
  {
    id: "explore-lower-hypertrophy",
    userId: "template",
    name: "Lower Body Hypertrophy",
    description:
      "High-rep lower-body session designed for muscle growth. Combines squatting, hinging and isolation work for a complete leg pump.",
    category: "Lower",
    author: "Hylift Team",
    daysPerWeek: 4,
    estimatedDuration: 60,
    timesCompleted: 0,
    targetMuscles: ["Quads", "Hamstrings", "Glutes", "Calves"],
    tags: ["Upper/Lower", "Hypertrophy", "4-day split"],
    exercises: [
      {
        id: "expl-lo-squat",
        name: "Barbell Squat",
        sets: 4,
        reps: "10",
        restTime: 120,
      },
      {
        id: "expl-lo-rdl",
        name: "Romanian Deadlift",
        sets: 4,
        reps: "12",
        restTime: 90,
      },
      {
        id: "expl-lo-legpress",
        name: "Leg Press",
        sets: 3,
        reps: "15",
        restTime: 90,
      },
      {
        id: "expl-lo-bulgariansplit",
        name: "Bulgarian Split Squat",
        sets: 3,
        reps: "10",
        restTime: 90,
      },
      {
        id: "expl-lo-legcurl",
        name: "Leg Curl",
        sets: 3,
        reps: "15",
        restTime: 60,
      },
      {
        id: "expl-lo-calf",
        name: "Seated Calf Raise",
        sets: 4,
        reps: "20",
        restTime: 60,
      },
    ],
  },

  // ── Core ────────────────────────────────────────────────────────────────────
  {
    id: "explore-core-foundation",
    userId: "template",
    name: "Core Foundation",
    description:
      "A beginner-friendly core circuit that builds stability, anti-rotation strength and a strong midsection.",
    category: "Core",
    author: "Hylift Team",
    daysPerWeek: 3,
    estimatedDuration: 30,
    timesCompleted: 0,
    targetMuscles: ["Abs", "Obliques", "Lower Back", "Glutes"],
    tags: ["Core", "Stability", "No Equipment"],
    exercises: [
      {
        id: "expl-core-plank",
        name: "Plank",
        sets: 3,
        reps: "60s",
        restTime: 60,
      },
      {
        id: "expl-core-crunch",
        name: "Crunches",
        sets: 3,
        reps: "20",
        restTime: 45,
      },
      {
        id: "expl-core-legraise",
        name: "Leg Raise",
        sets: 3,
        reps: "15",
        restTime: 45,
      },
      {
        id: "expl-core-russian",
        name: "Russian Twist",
        sets: 3,
        reps: "20",
        restTime: 45,
      },
      {
        id: "expl-core-mountain",
        name: "Mountain Climbers",
        sets: 3,
        reps: "30s",
        restTime: 45,
      },
    ],
  },

  {
    id: "explore-core-advanced",
    userId: "template",
    name: "Advanced Core Circuit",
    description:
      "Weighted and high-difficulty movements for athletes who have already built a solid foundation. Targets every plane of core stability.",
    category: "Core",
    author: "Hylift Team",
    daysPerWeek: 3,
    estimatedDuration: 40,
    timesCompleted: 0,
    targetMuscles: ["Abs", "Obliques", "Hip Flexors", "Lower Back"],
    tags: ["Core", "Weighted", "Circuit"],
    exercises: [
      {
        id: "expl-corex-ab-wheel",
        name: "Ab Wheel Rollout",
        sets: 4,
        reps: "12",
        restTime: 60,
      },
      {
        id: "expl-corex-dragon",
        name: "Dragon Flag",
        sets: 3,
        reps: "8",
        restTime: 90,
      },
      {
        id: "expl-corex-hanging",
        name: "Hanging Leg Raise",
        sets: 3,
        reps: "15",
        restTime: 60,
      },
      {
        id: "expl-corex-pallof",
        name: "Pallof Press",
        sets: 3,
        reps: "12",
        restTime: 60,
      },
      {
        id: "expl-corex-woodchop",
        name: "Cable Woodchop",
        sets: 3,
        reps: "12",
        restTime: 60,
      },
    ],
  },
];

// ─── Public API ───────────────────────────────────────────────────────────────

/** Return all explore templates, optionally filtered by category. */
export function getExploreRoutines(opts?: {
  category?: ExploreCategory | "All";
  search?: string;
}): ExploreRoutine[] {
  let results = TEMPLATES;

  if (opts?.category && opts.category !== "All") {
    results = results.filter((r) => r.category === opts.category);
  }

  if (opts?.search?.trim()) {
    const q = opts.search.toLowerCase();
    results = results.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.targetMuscles.some((m) => m.toLowerCase().includes(q)) ||
        r.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }

  return results;
}

/** Look up a single template by id. */
export function getExploreRoutineById(id: string): ExploreRoutine | undefined {
  return TEMPLATES.find((r) => r.id === id);
}

/** All unique category values for filter chips. */
export const EXPLORE_CATEGORIES: ExploreCategory[] = [
  "Full Body",
  "Push",
  "Pull",
  "Legs",
  "Upper",
  "Lower",
  "Core",
  "Cardio",
];


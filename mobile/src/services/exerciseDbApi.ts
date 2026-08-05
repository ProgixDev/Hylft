// Exercises catalog adapter.
//
// Historically this module talked directly to https://oss.exercisedb.dev.
// Now it proxies our own `/api/exercises` endpoints (1,500-row mirror seeded
// from ExerciseDB, gifs partially self-hosted in the `exercise-gifs` bucket).
//
// The public types + function signatures are kept exactly as before so that
// the exercise picker, workout player, and CreateRoutine context don't need
// to change.

import {
  translateExerciseName,
  translateExerciseTerm,
} from "../utils/exerciseTranslator";
import { api } from "./api";

export type Difficulty = "beginner" | "intermediate" | "advanced";

export interface ExerciseDbExercise {
  id: string;
  name: string;
  target: string;
  equipment: string;
  bodyPart: string;
  gifUrl: string;
  secondaryMuscles: string[];
  difficulty: Difficulty;
  allBodyParts: string[];
  allEquipments: string[];
  // Canonical English values (lower-case); use these when filtering client-side.
  rawBodyParts: string[];
  rawEquipments: string[];
}

export interface ExerciseDbResponse {
  exercises: ExerciseDbExercise[];
  totalExercises: number;
  hasMore: boolean;
  nextCursor: string | null;
}

type BackendExercise = {
  id: string;
  external_id: string;
  name: string;
  name_fr: string | null;
  body_part: string;
  target_muscle: string;
  secondary_muscles: string[] | null;
  equipment: string;
  difficulty: Difficulty | null;
  gif_url: string | null;
  instructions: string[] | null;
};

// ─── Cache & throttle ────────────────────────────────────────────────────────

const CACHE_DURATION = 10 * 60 * 1000;
const apiCache = new Map<string, { data: unknown; expiresAt: number }>();

function getCached<T>(key: string): T | null {
  const entry = apiCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    apiCache.delete(key);
    return null;
  }
  return entry.data as T;
}
function setCached<T>(key: string, data: T): T {
  apiCache.set(key, { data, expiresAt: Date.now() + CACHE_DURATION });
  return data;
}

// ─── Difficulty helper (kept for callers that still import it) ──────────────

const EQUIPMENT_DIFFICULTY_MAP: Record<string, Difficulty> = {
  "body weight": "beginner",
  "resistance band": "beginner",
  band: "beginner",
  assisted: "beginner",
  rope: "beginner",
  dumbbell: "intermediate",
  cable: "intermediate",
  "ez barbell": "intermediate",
  kettlebell: "intermediate",
  "medicine ball": "intermediate",
  "stability ball": "intermediate",
  "swiss ball": "intermediate",
  "smith machine": "intermediate",
  roller: "intermediate",
  barbell: "advanced",
  "olympic barbell": "advanced",
  "trap bar": "advanced",
  hammer: "advanced",
  leverage: "advanced",
  "leverage machine": "advanced",
  sled: "advanced",
  "sled machine": "advanced",
};
export function getDifficulty(equipment: string): Difficulty {
  const key = equipment?.toLowerCase().trim() ?? "";
  return EQUIPMENT_DIFFICULTY_MAP[key] ?? "intermediate";
}

// ─── Mapping ─────────────────────────────────────────────────────────────────

function mapExercise(row: BackendExercise): ExerciseDbExercise {
  const equipment = row.equipment ?? "";
  const bodyPart = row.body_part ?? "";
  const target = row.target_muscle ?? "";
  const secondary = row.secondary_muscles ?? [];
  const difficulty: Difficulty =
    row.difficulty ?? getDifficulty(equipment);

  return {
    id: row.external_id,
    name: translateExerciseName(row.name),
    target: translateExerciseTerm(target, "targetMuscles"),
    equipment: translateExerciseTerm(equipment, "equipment"),
    bodyPart: translateExerciseTerm(bodyPart, "bodyParts"),
    gifUrl: row.gif_url ?? "",
    secondaryMuscles: secondary.map((m) =>
      translateExerciseTerm(m, "secondaryMuscles"),
    ),
    difficulty,
    allBodyParts: [translateExerciseTerm(bodyPart, "bodyParts")],
    allEquipments: [translateExerciseTerm(equipment, "equipment")],
    rawBodyParts: bodyPart ? [bodyPart.toLowerCase()] : [],
    rawEquipments: equipment ? [equipment.toLowerCase()] : [],
  };
}

// ─── Public API ──────────────────────────────────────────────────────────────

export async function fetchExercisesExerciseDb(options?: {
  cursor?: string | null;
  limit?: number;
  translate?: boolean;
  bodyParts?: string | null;
  equipments?: string | null;
}): Promise<ExerciseDbResponse> {
  const {
    cursor = null,
    limit = 20,
    bodyParts = null,
    equipments = null,
  } = options ?? {};
  const safeLimit = Math.min(Math.max(limit, 1), 100);
  const key = `list_${cursor ?? "start"}_${safeLimit}_${bodyParts ?? ""}_${equipments ?? ""}`;
  const cached = getCached<ExerciseDbResponse>(key);
  if (cached) return cached;

  try {
    const res: { items: BackendExercise[]; next_cursor: string | null } =
      await api.listExercises({
        limit: safeLimit,
        cursor: cursor ?? undefined,
        body_part: bodyParts ?? undefined,
        equipment: equipments ?? undefined,
      });
    const exercises = (res.items ?? []).map(mapExercise);
    const data: ExerciseDbResponse = {
      exercises,
      totalExercises: 1500,
      hasMore: !!res.next_cursor,
      nextCursor: res.next_cursor,
    };
    return setCached(key, data);
  } catch (err) {
    console.error("listExercises failed:", err);
    return { exercises: [], totalExercises: 0, hasMore: false, nextCursor: null };
  }
}

export async function searchExercisesExerciseDb(
  query: string,
  _translate: boolean = false,
): Promise<ExerciseDbExercise[]> {
  if (!query.trim()) return [];
  const key = `search_${query.toLowerCase()}`;
  const cached = getCached<ExerciseDbExercise[]>(key);
  if (cached) return cached;

  try {
    const res: { items: BackendExercise[] } = await api.listExercises({
      search: query.trim(),
      limit: 50,
    });
    const exercises = (res.items ?? []).map(mapExercise);
    return setCached(key, exercises);
  } catch (err) {
    console.error("search exercises failed:", err);
    return [];
  }
}

export async function fetchAllExercisesExerciseDb(filters: {
  bodyParts?: string | null;
  equipments?: string | null;
  translate?: boolean;
}): Promise<ExerciseDbExercise[]> {
  const { bodyParts = null, equipments = null } = filters;
  const all: ExerciseDbExercise[] = [];
  let cursor: string | null = null;
  for (let i = 0; i < 20; i++) {
    const page = await fetchExercisesExerciseDb({
      cursor,
      limit: 100,
      bodyParts,
      equipments,
    });
    all.push(...page.exercises);
    if (!page.hasMore || !page.nextCursor) break;
    cursor = page.nextCursor;
  }
  return all;
}

export async function findExerciseByNameExerciseDb(
  name: string,
): Promise<ExerciseDbExercise | null> {
  if (!name?.trim()) return null;
  const key = `byname_${name.toLowerCase().trim()}`;
  const cached = getCached<ExerciseDbExercise | null>(key);
  if (cached !== null) return cached;

  try {
    const results = await searchExercisesExerciseDb(name, false);
    const lower = name.toLowerCase().trim();
    const exact =
      results.find((ex) => ex.name.toLowerCase() === lower) ??
      results[0] ??
      null;
    return setCached(key, exact);
  } catch (err) {
    console.error("findByName failed:", err);
    return null;
  }
}

export async function getAvailableBodyPartsExerciseDb(): Promise<string[]> {
  const key = "bodyparts_list";
  const cached = getCached<string[]>(key);
  if (cached) return cached;
  try {
    const res: { items: string[] } = await api.getExerciseBodyParts();
    return setCached(key, res.items ?? []);
  } catch (err) {
    console.error("body parts list failed:", err);
    return [];
  }
}

export async function getAvailableEquipmentsExerciseDb(): Promise<string[]> {
  const key = "equipments_list";
  const cached = getCached<string[]>(key);
  if (cached) return cached;
  try {
    const res: { items: string[] } = await api.getExerciseEquipments();
    return setCached(key, res.items ?? []);
  } catch (err) {
    console.error("equipments list failed:", err);
    return [];
  }
}

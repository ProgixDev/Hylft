// ExerciseDB API Service (v1 - Free, Open Source)
// https://github.com/ExerciseDB/exercisedb-api
// ~1,300-1,500 exercises with GIFs - No API key required

import {
  translateExerciseName,
  translateExerciseTerm,
} from "../utils/exerciseTranslator";

export type Difficulty = "beginner" | "intermediate" | "advanced";

// ─── Rate Limiting & Caching ─────────────────────────────────────────────────
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

const CACHE_DURATION = 10 * 60 * 1000; // Cache for 10 minutes
const RATE_LIMIT_DELAY = 500; // Minimum 500ms between requests
let lastRequestTime = 0;

const apiCache = new Map<string, CacheEntry<any>>();

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
  apiCache.set(key, {
    data,
    timestamp: Date.now(),
    expiresAt: Date.now() + CACHE_DURATION,
  });
  return data;
}

async function throttledFetch(url: string): Promise<Response> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
    await new Promise((resolve) =>
      setTimeout(resolve, RATE_LIMIT_DELAY - timeSinceLastRequest),
    );
  }

  lastRequestTime = Date.now();

  // Retry logic with exponential backoff for 429 errors
  let retries = 3;
  let backoffMs = 1000; // Start with 1 second

  while (retries > 0) {
    try {
      const response = await fetch(url, { method: "GET" });

      // If not rate limited, return immediately
      if (response.status !== 429) {
        return response;
      }

      // Handle 429 with backoff
      if (retries > 1) {
        console.warn(
          `Rate limited (429). Retrying in ${backoffMs}ms... (${retries - 1} attempts left)`,
        );
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
        backoffMs *= 2; // Exponential backoff
        retries--;
      } else {
        return response; // Return the 429 response on last attempt
      }
    } catch (error) {
      if (retries > 1) {
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
        backoffMs *= 2;
        retries--;
      } else {
        throw error;
      }
    }
  }

  throw new Error("Max retries exceeded");
}

// Derive difficulty from primary equipment
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
  sled: "advanced",
};

export function getDifficulty(equipment: string): Difficulty {
  const key = equipment?.toLowerCase().trim() ?? "";
  return EQUIPMENT_DIFFICULTY_MAP[key] ?? "intermediate";
}

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
  // Untranslated, canonical English values (lower-case as returned by the API).
  // Use these for filter matching so it works regardless of UI language.
  rawBodyParts: string[];
  rawEquipments: string[];
}

export interface ExerciseDbResponse {
  exercises: ExerciseDbExercise[];
  totalExercises: number;
  hasMore: boolean;
  nextCursor: string | null;
}

// V1 API - Free, public endpoint, no auth needed
// https://oss.exercisedb.dev/api/v1/exercises
const EXERCISEDB_BASE = "https://oss.exercisedb.dev";

// ─── Shared API response types ────────────────────────────────────────────────
interface ApiExercise {
  exerciseId: string;
  name: string;
  gifUrl: string;
  targetMuscles: string[];
  bodyParts: string[];
  equipments: string[];
  secondaryMuscles?: string[];
}

function mapExercise(
  ex: ApiExercise,
  translate: boolean = false,
): ExerciseDbExercise {
  const equipment = ex.equipments?.[0] || "";
  const bodyPart = ex.bodyParts?.[0] || "";
  const target = ex.targetMuscles?.[0] || "";

  // Always use translateApiData - it will translate based on current language
  return {
    id: ex.exerciseId,
    name: translateExerciseName(ex.name),
    target: translateExerciseTerm(target, "targetMuscles"),
    equipment: translateExerciseTerm(equipment, "equipment"),
    bodyPart: translateExerciseTerm(bodyPart, "bodyParts"),
    gifUrl: ex.gifUrl,
    secondaryMuscles: (ex.secondaryMuscles ?? []).map((m) =>
      translateExerciseTerm(m, "secondaryMuscles"),
    ),
    difficulty: getDifficulty(equipment),
    allBodyParts: (ex.bodyParts ?? []).map((bp) =>
      translateExerciseTerm(bp, "bodyParts"),
    ),
    allEquipments: (ex.equipments ?? []).map((eq) =>
      translateExerciseTerm(eq, "equipment"),
    ),
    rawBodyParts: (ex.bodyParts ?? []).map((bp) => bp.toLowerCase()),
    rawEquipments: (ex.equipments ?? []).map((eq) => eq.toLowerCase()),
  };
}

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
    translate = false,
    bodyParts = null,
    equipments = null,
  } = options || {};
  const safeLimit = Math.min(Math.max(limit, 1), 100);
  const filterKey = `${bodyParts ?? ""}|${equipments ?? ""}`;
  const cacheKey = `exercises_${cursor ?? "start"}_${safeLimit}_${filterKey}_${translate ? "fr" : "en"}`;

  // Check cache first
  const cached = getCached<ExerciseDbResponse>(cacheKey);
  if (cached) return cached;

  try {
    const params = new URLSearchParams({ limit: String(safeLimit) });
    if (cursor) params.set("cursor", cursor);
    if (bodyParts) params.set("bodyParts", bodyParts.toLowerCase().trim());
    if (equipments) params.set("equipments", equipments.toLowerCase().trim());
    const url = `${EXERCISEDB_BASE}/api/v1/exercises?${params.toString()}`;
    const response = await throttledFetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    interface ApiResponse {
      success: boolean;
      meta?: {
        total?: number;
        hasNextPage?: boolean;
        nextCursor?: string | null;
      };
      data: ApiExercise[];
    }

    const result: ApiResponse = await response.json();
    const exercises = (result.data ?? []).map((ex) => mapExercise(ex, translate));

    const data: ExerciseDbResponse = {
      exercises,
      totalExercises: result.meta?.total ?? 1500,
      hasMore: result.meta?.hasNextPage ?? exercises.length === safeLimit,
      nextCursor: result.meta?.nextCursor ?? null,
    };

    return setCached(cacheKey, data);
  } catch (error) {
    console.error("ExerciseDb fetch error:", error);
    return { exercises: [], totalExercises: 0, hasMore: false, nextCursor: null };
  }
}

export async function searchExercisesExerciseDb(
  query: string,
  translate: boolean = false,
): Promise<ExerciseDbExercise[]> {
  if (!query.trim()) return [];

  const cacheKey = `search_${query.toLowerCase()}_${translate ? "fr" : "en"}`;
  const cached = getCached<ExerciseDbExercise[]>(cacheKey);
  if (cached) return cached;

  try {
    const url = `${EXERCISEDB_BASE}/api/v1/exercises/search?search=${encodeURIComponent(query)}&limit=50`;
    const response = await throttledFetch(url);

    if (!response.ok) return [];

    interface ApiResponse {
      success: boolean;
      data: ApiExercise[];
    }
    const result: ApiResponse = await response.json();
    const exercises = (result.data || []).map((ex) => mapExercise(ex, translate));
    return setCached(cacheKey, exercises);
  } catch (error) {
    console.error("ExerciseDb search error:", error);
    return [];
  }
}

// Fetch ALL exercises matching the given filters by paging through cursors.
// Used for guided/non-paginated callers; the picker should prefer the
// paginated `fetchExercisesExerciseDb` directly.
export async function fetchAllExercisesExerciseDb(filters: {
  bodyParts?: string | null;
  equipments?: string | null;
  translate?: boolean;
}): Promise<ExerciseDbExercise[]> {
  const { bodyParts = null, equipments = null, translate = false } = filters;
  const all: ExerciseDbExercise[] = [];
  let cursor: string | null = null;
  // Hard cap so a misuse can't loop forever.
  for (let i = 0; i < 20; i++) {
    const page = await fetchExercisesExerciseDb({
      cursor,
      limit: 100,
      translate,
      bodyParts,
      equipments,
    });
    all.push(...page.exercises);
    if (!page.hasMore || !page.nextCursor) break;
    cursor = page.nextCursor;
  }
  return all;
}

// Best-effort lookup by display name — used by the guided workout player
// to hydrate a routine exercise that has no cached gifUrl (e.g. mock data).
export async function findExerciseByNameExerciseDb(
  name: string,
): Promise<ExerciseDbExercise | null> {
  if (!name?.trim()) return null;

  const cacheKey = `byname_${name.toLowerCase().trim()}`;
  const cached = getCached<ExerciseDbExercise | null>(cacheKey);
  if (cached !== null) return cached;

  try {
    const results = await searchExercisesExerciseDb(name, false);
    const lower = name.toLowerCase().trim();
    const exact =
      results.find((ex) => ex.name.toLowerCase() === lower) ?? results[0] ?? null;
    return setCached(cacheKey, exact);
  } catch (error) {
    console.error("ExerciseDb findByName error:", error);
    return null;
  }
}

// Returns canonical English values (e.g. "back", "chest"). Display-time
// translation should happen at the call site via `translateExerciseTerm`.
// This keeps the value the user picks usable as an API filter param regardless
// of UI language.
export async function getAvailableBodyPartsExerciseDb(): Promise<string[]> {
  const cacheKey = `bodyparts_list`;
  const cached = getCached<string[]>(cacheKey);
  if (cached) return cached;

  try {
    const url = `${EXERCISEDB_BASE}/api/v1/bodyparts`;
    const response = await throttledFetch(url);

    if (!response.ok) return [];

    interface ApiResponse {
      success: boolean;
      data: { name: string }[];
    }
    const result: ApiResponse = await response.json();
    const bodyParts = (result.data || []).map((item) => item.name);
    return setCached(cacheKey, bodyParts);
  } catch (error) {
    console.error("ExerciseDb body parts list error:", error);
    return [];
  }
}

export async function getAvailableEquipmentsExerciseDb(): Promise<string[]> {
  const cacheKey = `equipments_list`;
  const cached = getCached<string[]>(cacheKey);
  if (cached) return cached;

  try {
    const url = `${EXERCISEDB_BASE}/api/v1/equipments`;
    const response = await throttledFetch(url);

    if (!response.ok) return [];

    interface ApiResponse {
      success: boolean;
      data: { name: string }[];
    }
    const result: ApiResponse = await response.json();
    const equipments = (result.data || []).map((item) => item.name);
    return setCached(cacheKey, equipments);
  } catch (error) {
    console.error("ExerciseDb equipments list error:", error);
    return [];
  }
}

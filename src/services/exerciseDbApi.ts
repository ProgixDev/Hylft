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
}

export interface ExerciseDbResponse {
  exercises: ExerciseDbExercise[];
  totalExercises: number;
  hasMore: boolean;
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

  return {
    id: ex.exerciseId,
    name: translate ? translateExerciseName(ex.name) : ex.name,
    target: translate
      ? translateExerciseTerm(target, "targetMuscles")
      : target,
    equipment: translate
      ? translateExerciseTerm(equipment, "equipment")
      : equipment,
    bodyPart: translate
      ? translateExerciseTerm(bodyPart, "bodyParts")
      : bodyPart,
    gifUrl: ex.gifUrl,
    secondaryMuscles: translate
      ? (ex.secondaryMuscles ?? []).map((m) =>
          translateExerciseTerm(m, "secondaryMuscles"),
        )
      : ex.secondaryMuscles ?? [],
    difficulty: getDifficulty(equipment),
    allBodyParts: translate
      ? (ex.bodyParts ?? []).map((bp) =>
          translateExerciseTerm(bp, "bodyParts"),
        )
      : ex.bodyParts ?? [],
    allEquipments: translate
      ? (ex.equipments ?? []).map((eq) =>
          translateExerciseTerm(eq, "equipment"),
        )
      : ex.equipments ?? [],
  };
}

export async function fetchExercisesExerciseDb(options?: {
  page?: number;
  limit?: number;
  translate?: boolean;
}): Promise<ExerciseDbResponse> {
  const { page = 0, limit = 20, translate = false } = options || {};
  const safeLimit = Math.min(Math.max(limit, 1), 100);
  const offset = page * safeLimit;
  const cacheKey = `exercises_${offset}_${safeLimit}_${translate ? "fr" : "en"}`;

  // Check cache first
  const cached = getCached<ExerciseDbResponse>(cacheKey);
  if (cached) return cached;

  try {
    const url = `${EXERCISEDB_BASE}/api/v1/exercises?offset=${offset}&limit=${safeLimit}`;
    const response = await throttledFetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    interface ApiResponse {
      success: boolean;
      metadata: {
        totalExercises: number;
        currentPage: number;
        totalPages: number;
      };
      data: ApiExercise[];
    }

    const result: ApiResponse = await response.json();
    const exercises = result.data.map((ex) => mapExercise(ex, translate));

    const data: ExerciseDbResponse = {
      exercises,
      totalExercises: result.metadata?.totalExercises || 1500,
      hasMore: exercises.length === safeLimit,
    };

    return setCached(cacheKey, data);
  } catch (error) {
    console.error("ExerciseDb fetch error:", error);
    return { exercises: [], totalExercises: 0, hasMore: false };
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
    const url = `${EXERCISEDB_BASE}/api/v1/exercises?search=${encodeURIComponent(query)}`;
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

export async function searchExercisesByBodyPartExerciseDb(
  bodyPart: string,
  translate: boolean = false,
): Promise<ExerciseDbExercise[]> {
  if (!bodyPart.trim()) return [];

  const normalizedBodyPart = bodyPart.toLowerCase().trim();
  const cacheKey = `bodypart_${normalizedBodyPart}_${translate ? "fr" : "en"}`;
  const cached = getCached<ExerciseDbExercise[]>(cacheKey);
  if (cached) return cached;

  try {
    const url = `${EXERCISEDB_BASE}/api/v1/bodyparts/${encodeURIComponent(normalizedBodyPart)}/exercises`;
    const response = await throttledFetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    interface ApiResponse {
      success: boolean;
      data: ApiExercise[];
    }
    const result: ApiResponse = await response.json();
    const exercises = (result.data || []).map((ex) => mapExercise(ex, translate));
    return setCached(cacheKey, exercises);
  } catch (error) {
    console.error("ExerciseDb body part search error:", error);
    return [];
  }
}

export async function fetchExercisesByEquipmentExerciseDb(
  equipment: string,
  translate: boolean = false,
): Promise<ExerciseDbExercise[]> {
  if (!equipment.trim()) return [];

  const normalizedEquipment = equipment.toLowerCase().trim();
  const cacheKey = `equipment_${normalizedEquipment}_${translate ? "fr" : "en"}`;
  const cached = getCached<ExerciseDbExercise[]>(cacheKey);
  if (cached) return cached;

  try {
    const url = `${EXERCISEDB_BASE}/api/v1/equipments/${encodeURIComponent(normalizedEquipment)}/exercises`;
    const response = await throttledFetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    interface ApiResponse {
      success: boolean;
      data: ApiExercise[];
    }
    const result: ApiResponse = await response.json();
    const exercises = (result.data || []).map((ex) => mapExercise(ex, translate));
    return setCached(cacheKey, exercises);
  } catch (error) {
    console.error("ExerciseDb equipment search error:", error);
    return [];
  }
}

export async function getAvailableBodyPartsExerciseDb(
  translate: boolean = false,
): Promise<string[]> {
  const cacheKey = `bodyparts_list_${translate ? "fr" : "en"}`;
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
    const bodyParts = translate
      ? (result.data || []).map((item) =>
          translateExerciseTerm(item.name, "bodyParts"),
        )
      : (result.data || []).map((item) => item.name);
    return setCached(cacheKey, bodyParts);
  } catch (error) {
    console.error("ExerciseDb body parts list error:", error);
    return [];
  }
}

export async function getAvailableEquipmentsExerciseDb(
  translate: boolean = false,
): Promise<string[]> {
  const cacheKey = `equipments_list_${translate ? "fr" : "en"}`;
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
    const equipments = translate
      ? (result.data || []).map((item) =>
          translateExerciseTerm(item.name, "equipment"),
        )
      : (result.data || []).map((item) => item.name);
    return setCached(cacheKey, equipments);
  } catch (error) {
    console.error("ExerciseDb equipments list error:", error);
    return [];
  }
}

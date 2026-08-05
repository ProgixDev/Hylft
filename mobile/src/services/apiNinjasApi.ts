// API Ninjas Exercise API Service
// https://api-ninjas.com/api/exercises

export interface ApiNinjasExercise {
  name: string;
  type: string;
  muscle: string;
  equipment: string;
  difficulty: string;
  instructions: string;
}

export interface ApiNinjasResponse {
  exercises: ApiNinjasExercise[];
  hasMore: boolean;
}

/** Language for API responses (e.g. names, instructions). */
export type ApiNinjasLanguage = "en" | "fr";

const API_NINJAS_BASE = "https://api.api-ninjas.com/v1";

// Get your free API key from: https://api-ninjas.com
const API_KEY = process.env.EXPO_PUBLIC_API_NINJAS_KEY || "5OmsQtr1dyTmd6eGGNuKCWnN0TBcIRZ2ElahhAJj";

function buildHeaders(language?: ApiNinjasLanguage): Record<string, string> {
  const headers: Record<string, string> = {
    "X-Api-Key": API_KEY,
  };
  if (language && language !== "en") {
    headers["Accept-Language"] = language === "fr" ? "fr" : language;
  }
  return headers;
}

function appendLanguageParam(url: string, language?: ApiNinjasLanguage): string {
  if (!language || language === "en") return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}lang=${encodeURIComponent(language)}`;
}

export async function fetchExercisesApiNinjas(options?: {
  muscle?: string;
  type?: string;
  offset?: number;
  language?: ApiNinjasLanguage;
}): Promise<ApiNinjasResponse> {
  const { muscle, type, offset = 0, language } = options || {};

  try {
    let url = `${API_NINJAS_BASE}/exercises?offset=${offset}`;

    if (muscle) url += `&muscle=${encodeURIComponent(muscle)}`;
    if (type) url += `&type=${encodeURIComponent(type)}`;
    url = appendLanguageParam(url, language);

    const response = await fetch(url, {
      method: "GET",
      headers: buildHeaders(language),
    });

    if (!response.ok) throw new Error("Failed to fetch exercises");

    const exercises: ApiNinjasExercise[] = await response.json();

    return {
      exercises,
      hasMore: exercises.length > 0,
    };
  } catch (error) {
    console.error("API Ninjas fetch error:", error);
    return {
      exercises: [],
      hasMore: false,
    };
  }
}

export async function searchExercisesApiNinjas(
  name: string,
  options?: { language?: ApiNinjasLanguage },
): Promise<ApiNinjasExercise[]> {
  if (!name.trim()) return [];

  try {
    let url = `${API_NINJAS_BASE}/exercises?name=${encodeURIComponent(name)}`;
    url = appendLanguageParam(url, options?.language);

    const response = await fetch(url, {
      method: "GET",
      headers: buildHeaders(options?.language),
    });

    if (!response.ok) return [];

    const exercises: ApiNinjasExercise[] = await response.json();
    return exercises;
  } catch (error) {
    console.error("API Ninjas search error:", error);
    return [];
  }
}

export async function getExercisesByMuscleApiNinjas(
  muscle: string,
  options?: { language?: ApiNinjasLanguage },
): Promise<ApiNinjasExercise[]> {
  try {
    let url = `${API_NINJAS_BASE}/exercises?muscle=${encodeURIComponent(muscle)}`;
    url = appendLanguageParam(url, options?.language);

    const response = await fetch(url, {
      method: "GET",
      headers: buildHeaders(options?.language),
    });

    if (!response.ok) return [];

    const exercises: ApiNinjasExercise[] = await response.json();
    return exercises;
  } catch (error) {
    console.error("API Ninjas muscle search error:", error);
    return [];
  }
}

export async function getExercisesByTypeApiNinjas(
  type: string,
  options?: { language?: ApiNinjasLanguage },
): Promise<ApiNinjasExercise[]> {
  try {
    let url = `${API_NINJAS_BASE}/exercises?type=${encodeURIComponent(type)}`;
    url = appendLanguageParam(url, options?.language);

    const response = await fetch(url, {
      method: "GET",
      headers: buildHeaders(options?.language),
    });

    if (!response.ok) return [];

    const exercises: ApiNinjasExercise[] = await response.json();
    return exercises;
  } catch (error) {
    console.error("API Ninjas type search error:", error);
    return [];
  }
}

// Get available muscle groups
export const AVAILABLE_MUSCLES = [
  "abdominals",
  "abductors",
  "adductors",
  "biceps",
  "calves",
  "chest",
  "forearms",
  "glutes",
  "hamstrings",
  "lats",
  "lower_back",
  "middle_back",
  "neck",
  "quadriceps",
  "shoulders",
  "traps",
  "triceps",
];

// Get available exercise types
export const AVAILABLE_TYPES = [
  "cardio",
  "powerlifting",
  "stretching",
  "strongman",
  "weightlifting",
];

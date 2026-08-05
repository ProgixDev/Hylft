// wger REST API v2 — public instance (no auth required for read-only exercise data)
const BASE_URL = "https://wger.de/api/v2";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WgerMuscle {
  id: number;
  name: string;
  name_en: string;
  is_front: boolean;
  image_url_main: string;
  image_url_secondary: string;
}

export interface WgerEquipment {
  id: number;
  name: string;
}

export interface WgerCategory {
  id: number;
  name: string;
}

export interface WgerExerciseImage {
  id: number;
  uuid: string;
  exercise_base: number;
  image: string;
  is_main: boolean;
}

export interface WgerExerciseTranslation {
  id: number;
  uuid: string;
  language: number;
  name: string;
  description: string;
}

export interface WgerExerciseInfo {
  id: number;
  uuid: string;
  category: WgerCategory;
  muscles: WgerMuscle[];
  muscles_secondary: WgerMuscle[];
  equipment: WgerEquipment[];
  images: WgerExerciseImage[];
  translations: WgerExerciseTranslation[];
  /**
   * Convenience — the English name resolved from translations (populated
   * by the helper below, NOT returned by the API directly on the list endpoint).
   */
  name: string;
  description: string;
}

export interface WgerListResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface WgerSearchSuggestion {
  value: string;
  data: {
    id: string;
    base_id: number;
    name: string;
    category: string;
    image: string | null;
    image_thumbnail: string | null;
  };
}

export interface WgerSearchResponse {
  suggestions: WgerSearchSuggestion[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resolveEnglishName(info: WgerExerciseInfo): string {
  // language id 2 = English on wger
  const en = info.translations.find((t) => t.language === 2);
  return en?.name ?? info.translations[0]?.name ?? `Exercise #${info.id}`;
}

function resolveDescription(info: WgerExerciseInfo): string {
  const en = info.translations.find((t) => t.language === 2);
  return en?.description ?? info.translations[0]?.description ?? "";
}

/** Strip HTML tags that wger includes in description fields */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

function enrichExerciseInfo(
  raw: Omit<WgerExerciseInfo, "name" | "description">,
): WgerExerciseInfo {
  const name = resolveEnglishName(raw as WgerExerciseInfo);
  const description = stripHtml(resolveDescription(raw as WgerExerciseInfo));
  return { ...raw, name, description } as WgerExerciseInfo;
}

// ─── API calls ────────────────────────────────────────────────────────────────

/**
 * Paginated list of exercises with full info (images, muscles, equipment).
 * @param page  1-based page number
 * @param limit results per page (max 100)
 * @param category wger category id (optional)
 * @param muscle  muscle id (optional)
 */
export async function fetchExercises(options?: {
  page?: number;
  limit?: number;
  category?: number;
  muscle?: number;
}): Promise<{
  exercises: WgerExerciseInfo[];
  hasMore: boolean;
  count: number;
}> {
  const limit = options?.limit ?? 20;
  const offset = ((options?.page ?? 1) - 1) * limit;

  const params = new URLSearchParams({
    format: "json",
    language: "2", // English
    limit: String(limit),
    offset: String(offset),
  });

  if (options?.category) params.set("category", String(options.category));
  if (options?.muscle) params.set("muscles", String(options.muscle));

  const res = await fetch(`${BASE_URL}/exerciseinfo/?${params}`);
  if (!res.ok) throw new Error(`wger exerciseinfo error: ${res.status}`);

  const data: WgerListResponse<Omit<WgerExerciseInfo, "name" | "description">> =
    await res.json();

  const exercises = data.results.map(enrichExerciseInfo);
  return {
    exercises,
    hasMore: data.next !== null,
    count: data.count,
  };
}

/**
 * Search exercises by name using wger's search endpoint.
 * Returns lightweight suggestions (name + image).
 */
export async function searchExercises(
  term: string,
): Promise<WgerSearchSuggestion[]> {
  if (!term.trim()) return [];

  const params = new URLSearchParams({
    term,
    language: "english",
    format: "json",
  });

  const res = await fetch(`${BASE_URL}/exercise/search/?${params}`);
  if (!res.ok) throw new Error(`wger search error: ${res.status}`);

  const data: WgerSearchResponse = await res.json();
  return data.suggestions ?? [];
}

/**
 * Fetch a single exercise by uuid with full detail.
 */
export async function fetchExerciseById(
  uuid: string,
): Promise<WgerExerciseInfo> {
  const res = await fetch(`${BASE_URL}/exerciseinfo/${uuid}/?format=json`);
  if (!res.ok)
    throw new Error(`wger exerciseinfo/${uuid} error: ${res.status}`);
  const raw: Omit<WgerExerciseInfo, "name" | "description"> = await res.json();
  return enrichExerciseInfo(raw);
}

/**
 * Fetch all muscles.
 */
export async function fetchMuscles(): Promise<WgerMuscle[]> {
  const res = await fetch(`${BASE_URL}/muscle/?format=json&limit=100`);
  if (!res.ok) throw new Error(`wger muscle error: ${res.status}`);
  const data: WgerListResponse<WgerMuscle> = await res.json();
  return data.results;
}

/**
 * Fetch all equipment.
 */
export async function fetchEquipment(): Promise<WgerEquipment[]> {
  const res = await fetch(`${BASE_URL}/equipment/?format=json&limit=100`);
  if (!res.ok) throw new Error(`wger equipment error: ${res.status}`);
  const data: WgerListResponse<WgerEquipment> = await res.json();
  return data.results;
}

/**
 * Fetch all exercise categories (chest, back, arms…).
 */
export async function fetchCategories(): Promise<WgerCategory[]> {
  const res = await fetch(
    `${BASE_URL}/exercisecategory/?format=json&limit=100`,
  );
  if (!res.ok) throw new Error(`wger exercisecategory error: ${res.status}`);
  const data: WgerListResponse<WgerCategory> = await res.json();
  return data.results;
}

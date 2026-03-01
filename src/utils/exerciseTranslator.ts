import i18n from "./i18n";

/**
 * Generic function to translate API data
 * If the key exists in the "api" collection, it returns the translation
 * Otherwise, it returns the original value
 */
export function translateApiData(value: string): string {
  if (!value) return value;

  const normalizedValue = value.toLowerCase().trim();
  const translationKey = `api.${normalizedValue}`;

  // Try to get translation
  const translated = i18n.t(translationKey);

  // If translation exists and is different from the key, return it
  if (translated && translated !== translationKey) {
    return translated;
  }

  // If no translation found, return original (capitalize first letter)
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * Translate exercise-related terms from API
 */
export function translateExerciseTerm(
  term: string,
  category: "bodyParts" | "equipment" | "targetMuscles" | "secondaryMuscles" = "bodyParts"
): string {
  if (!term) return term;

  // Use the generic translateApiData function
  return translateApiData(term);
}

export function translateExerciseName(name: string): string {
  if (!name) return name;

  // Use the generic translateApiData function
  return translateApiData(name);
}

/**
 * Translate routine names (for common routine names)
 */
export function translateRoutineName(name: string): string {
  if (!name) return name;

  // Use the generic translateApiData function
  return translateApiData(name);
}

/**
 * Translate routine category
 */
export function translateRoutineCategory(category: string): string {
  if (!category) return category;

  // Use the generic translateApiData function
  return translateApiData(category);
}

/**
 * Translate routine description
 */
export function translateRoutineDescription(description: string): string {
  if (!description) return description;

  const normalizedDesc = description.toLowerCase().trim();
  // Replace all non-alphanumeric characters with single underscore, then remove multiple underscores
  const normalizedKey = normalizedDesc.replace(/[^a-z0-9]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
  const translationKey = `api.${normalizedKey}`;

  // Try to get translation
  const translated = i18n.t(translationKey);

  // If translation exists and is different from the key, return it
  if (translated && translated !== translationKey) {
    return translated;
  }

  // If no translation found, return original
  return description;
}

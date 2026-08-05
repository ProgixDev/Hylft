import AsyncStorage from "@react-native-async-storage/async-storage";
import type { FoodHistoryItem, FoodItem } from "./nutritionApi";

const STORAGE_PREFIX = "@hylift_food_history_v2:";
const LEGACY_KEY = "@hylift_food_history_v1";
const MAX_ITEMS = 20;

const keyFor = (userId?: string | null) =>
  `${STORAGE_PREFIX}${userId ?? "anon"}`;

// Drop the v1 cache (shared across users + populated by the old FatSecret /
// OpenFoodFacts API). Safe to call repeatedly — it's a no-op once removed.
async function dropLegacyCache() {
  try {
    await AsyncStorage.removeItem(LEGACY_KEY);
  } catch {
    /* noop */
  }
}

export async function loadCachedHistory(
  userId?: string | null,
): Promise<FoodHistoryItem[]> {
  try {
    await dropLegacyCache();
    const raw = await AsyncStorage.getItem(keyFor(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0, MAX_ITEMS);
  } catch {
    return [];
  }
}

export async function saveCachedHistory(
  items: FoodHistoryItem[],
  userId?: string | null,
): Promise<void> {
  try {
    await AsyncStorage.setItem(
      keyFor(userId),
      JSON.stringify(items.slice(0, MAX_ITEMS)),
    );
  } catch {
    // noop — best-effort cache
  }
}

// Optimistic update after the user adds a food, before the server round-trip.
export async function bumpCachedHistory(
  food: FoodItem,
  userId?: string | null,
): Promise<FoodHistoryItem[]> {
  const current = await loadCachedHistory(userId);
  const now = new Date().toISOString();
  const idx = current.findIndex((it) => it.id === food.id);

  let next: FoodHistoryItem[];
  if (idx >= 0) {
    const existing = current[idx];
    const merged: FoodHistoryItem = {
      ...existing,
      ...food,
      useCount: existing.useCount + 1,
      lastUsedAt: now,
    };
    next = [merged, ...current.filter((_, i) => i !== idx)];
  } else {
    next = [{ ...food, useCount: 1, lastUsedAt: now }, ...current];
  }

  next = next.slice(0, MAX_ITEMS);
  await saveCachedHistory(next, userId);
  return next;
}

// Wipe every per-user food-history cache on this device. Call on sign-out.
export async function clearAllCachedHistory(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const targets = keys.filter(
      (k) => k.startsWith(STORAGE_PREFIX) || k === LEGACY_KEY,
    );
    if (targets.length > 0) await AsyncStorage.multiRemove(targets);
  } catch {
    /* noop */
  }
}

import AsyncStorage from "@react-native-async-storage/async-storage";
import type { FoodHistoryItem, FoodItem } from "./nutritionApi";

const STORAGE_KEY = "@hylift_food_history_v1";
const MAX_ITEMS = 20;

export async function loadCachedHistory(): Promise<FoodHistoryItem[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0, MAX_ITEMS);
  } catch {
    return [];
  }
}

export async function saveCachedHistory(items: FoodHistoryItem[]): Promise<void> {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(items.slice(0, MAX_ITEMS)),
    );
  } catch {
    // noop — best-effort cache
  }
}

// Optimistic update after the user adds a food, before the server round-trip.
export async function bumpCachedHistory(food: FoodItem): Promise<FoodHistoryItem[]> {
  const current = await loadCachedHistory();
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
  await saveCachedHistory(next);
  return next;
}

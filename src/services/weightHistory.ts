/**
 * Weight History Service
 * Tracks weight entries over time for profile charts.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@hylift_weight_history";

export interface WeightEntry {
  date: string; // YYYY-MM-DD
  weight: number; // kg
}

export const WeightHistory = {
  async getAll(): Promise<WeightEntry[]> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      return JSON.parse(raw) as WeightEntry[];
    } catch {
      return [];
    }
  },

  /** Add or update today's weight entry */
  async log(weight: number): Promise<void> {
    const today = new Date().toISOString().split("T")[0];
    const entries = await this.getAll();

    const existingIdx = entries.findIndex((e) => e.date === today);
    if (existingIdx >= 0) {
      entries[existingIdx].weight = weight;
    } else {
      entries.push({ date: today, weight });
    }

    // Keep last 90 days
    const sorted = entries.sort((a, b) => a.date.localeCompare(b.date)).slice(-90);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
  },

  /** Get entries for last N days */
  async getLastDays(days: number): Promise<WeightEntry[]> {
    const all = await this.getAll();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().split("T")[0];
    return all.filter((e) => e.date >= cutoffStr);
  },
};

/**
 * Weight History Service
 * Backed by the server (/api/weight). AsyncStorage is used as a local cache
 * to avoid flicker on cold start and for offline fallback.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "./api";

const CACHE_KEY = "@hylift_weight_history";

export interface WeightEntry {
  date: string; // YYYY-MM-DD
  weight: number; // kg
}

type BackendEntry = {
  id: string;
  user_id: string;
  entry_date: string; // YYYY-MM-DD
  weight_kg: number;
  note: string | null;
  created_at: string;
};

function toUi(rows: BackendEntry[]): WeightEntry[] {
  return rows
    .map((r) => ({ date: r.entry_date, weight: Number(r.weight_kg) }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

async function readCache(): Promise<WeightEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as WeightEntry[];
  } catch {
    return [];
  }
}

async function writeCache(entries: WeightEntry[]) {
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(entries));
  } catch {
    /* silent */
  }
}

export const WeightHistory = {
  async getAll(): Promise<WeightEntry[]> {
    try {
      const res: { items: BackendEntry[] } = await api.listWeightEntries({
        limit: 365,
      });
      const ui = toUi(res.items ?? []);
      await writeCache(ui);
      return ui;
    } catch {
      return readCache();
    }
  },

  /** Add or update today's weight entry */
  async log(weight: number): Promise<void> {
    const today = new Date().toISOString().split("T")[0];
    try {
      await api.upsertWeightEntry({ entry_date: today, weight_kg: weight });
    } catch {
      /* swallow; cache update below still makes the UI responsive */
    }

    const entries = await readCache();
    const idx = entries.findIndex((e) => e.date === today);
    if (idx >= 0) entries[idx].weight = weight;
    else entries.push({ date: today, weight });
    const sorted = entries
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-365);
    await writeCache(sorted);
  },

  /** Get entries for the last N days */
  async getLastDays(days: number): Promise<WeightEntry[]> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().split("T")[0];
    try {
      const res: { items: BackendEntry[] } = await api.listWeightEntries({
        start: cutoffStr,
      });
      const ui = toUi(res.items ?? []);
      await writeCache(ui);
      return ui;
    } catch {
      const all = await readCache();
      return all.filter((e) => e.date >= cutoffStr);
    }
  },
};

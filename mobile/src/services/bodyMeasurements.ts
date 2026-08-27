/**
 * Body Measurements Service
 * Backed by the server (/api/body-measurements). AsyncStorage is used as a
 * local cache to avoid flicker on cold start and for offline fallback.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "./api";

const CACHE_KEY = "@hylift_body_measurements";
const MIGRATED_KEY = "@hylift_body_measurements_migrated";

export type MeasurementEntry = { value: number; date: string };
export type LocalData = Record<string, MeasurementEntry[]>;

type BackendEntry = {
  id: string;
  user_id: string;
  metric: string;
  value: number;
  measurement_date: string;
  created_at: string;
};

/** Convert backend rows to the local grouped shape. */
function toLocal(rows: BackendEntry[]): LocalData {
  const result: LocalData = {};
  for (const row of rows) {
    if (!result[row.metric]) result[row.metric] = [];
    result[row.metric].push({
      value: Number(row.value),
      date: row.measurement_date,
    });
  }
  // Sort each metric's entries ascending by date
  for (const key of Object.keys(result)) {
    result[key].sort((a, b) => a.date.localeCompare(b.date));
  }
  return result;
}

async function readCache(): Promise<LocalData> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as LocalData;
  } catch {
    return {};
  }
}

async function writeCache(data: LocalData) {
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    /* silent */
  }
}

export const BodyMeasurements = {
  /** Fetch all measurements from API, cache locally, fallback to cache. */
  async getAll(): Promise<LocalData> {
    try {
      const res: { items: BackendEntry[] } = await api.listBodyMeasurements({
        limit: 365,
      });
      const local = toLocal(res.items ?? []);
      await writeCache(local);
      return local;
    } catch {
      return readCache();
    }
  },

  /** Get latest value per metric (optimized endpoint). */
  async getLatest(): Promise<BackendEntry[]> {
    try {
      const res: { items: BackendEntry[] } =
        await api.getLatestBodyMeasurements();
      return res.items ?? [];
    } catch {
      return [];
    }
  },

  /** Log a measurement. Upserts on server + updates local cache. */
  async log(metric: string, value: number): Promise<void> {
    const today = new Date().toISOString().split("T")[0];
    try {
      await api.upsertBodyMeasurement({
        metric,
        value,
        measurement_date: today,
      });
    } catch {
      /* swallow; cache update below still makes UI responsive */
    }

    const data = await readCache();
    if (!data[metric]) data[metric] = [];
    const idx = data[metric].findIndex((e) => e.date === today);
    if (idx >= 0) data[metric][idx].value = value;
    else data[metric].push({ value, date: today });
    data[metric].sort((a, b) => a.date.localeCompare(b.date));
    await writeCache(data);
  },

  /** Delete a measurement entry by server ID. */
  async remove(id: string): Promise<void> {
    await api.deleteBodyMeasurement(id);
  },

  /** One-time migration from AsyncStorage to server. */
  async migrateFromAsyncStorage(): Promise<void> {
    try {
      const migrated = await AsyncStorage.getItem(MIGRATED_KEY);
      if (migrated) return;

      const raw = await AsyncStorage.getItem(CACHE_KEY);
      if (!raw) {
        await AsyncStorage.setItem(MIGRATED_KEY, "1");
        return;
      }

      const data = JSON.parse(raw) as LocalData;
      const entries: { metric: string; value: number; measurement_date: string }[] = [];

      for (const [metric, items] of Object.entries(data)) {
        // Deduplicate by date (keep last value per date per metric)
        const byDate = new Map<string, number>();
        for (const item of items) {
          // Convert ISO timestamp to YYYY-MM-DD
          const dateStr = item.date.includes("T")
            ? item.date.split("T")[0]
            : item.date;
          byDate.set(dateStr, item.value);
        }
        for (const [date, value] of byDate) {
          entries.push({ metric, value, measurement_date: date });
        }
      }

      if (entries.length > 0) {
        await api.bulkUpsertBodyMeasurements(entries);
      }
      await AsyncStorage.setItem(MIGRATED_KEY, "1");
    } catch {
      // Migration failed — will retry on next open
    }
  },
};

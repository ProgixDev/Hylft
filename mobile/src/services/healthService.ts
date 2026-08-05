/**
 * Unified Health Service
 * Abstracts Health Connect (Android) and Apple HealthKit (iOS)
 * into a single API for the rest of the app.
 */
import { Platform } from "react-native";

// ── Types ──────────────────────────────────────────────────────────────────
export interface DailySteps {
  date: string; // YYYY-MM-DD
  count: number;
}

export interface DailyCaloriesBurned {
  date: string;
  totalCalories: number;
}

export interface WorkoutSession {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  caloriesBurned: number;
  type: string;
}

export interface HealthPermissionStatus {
  granted: boolean;
  permissions: string[];
}

// ── Android Health Connect ─────────────────────────────────────────────────
async function initHealthConnect(): Promise<boolean> {
  try {
    const {
      initialize,
      getSdkStatus,
      SdkAvailabilityStatus,
    } = require("react-native-health-connect");

    const isInitialized = await initialize();
    if (!isInitialized) return false;

    const status = await getSdkStatus();
    return status === SdkAvailabilityStatus.SDK_AVAILABLE;
  } catch (error) {
    console.warn("[HealthService] Health Connect init failed:", error);
    return false;
  }
}

async function requestHealthConnectPermissions(): Promise<HealthPermissionStatus> {
  try {
    const { requestPermission } = require("react-native-health-connect");

    const permissions = [
      { accessType: "read", recordType: "Steps" },
      { accessType: "read", recordType: "TotalCaloriesBurned" },
      { accessType: "read", recordType: "ActiveCaloriesBurned" },
      { accessType: "read", recordType: "ExerciseSession" },
      { accessType: "read", recordType: "HeartRate" },
      { accessType: "read", recordType: "Distance" },
      { accessType: "write", recordType: "Nutrition" },
    ];

    const granted = await requestPermission(permissions);
    return {
      granted: granted.length > 0,
      permissions: granted.map(
        (p: { accessType: string; recordType: string }) =>
          `${p.accessType}:${p.recordType}`
      ),
    };
  } catch (error) {
    console.warn("[HealthService] Permission request failed:", error);
    return { granted: false, permissions: [] };
  }
}

async function getHealthConnectSteps(
  startDate: Date,
  endDate: Date
): Promise<DailySteps[]> {
  try {
    const { readRecords } = require("react-native-health-connect");

    const result = await readRecords("Steps", {
      timeRangeFilter: {
        operator: "between",
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
      },
    });

    // Group by day
    const byDay: Record<string, number> = {};
    for (const record of result) {
      const day = new Date(record.startTime).toISOString().split("T")[0];
      byDay[day] = (byDay[day] || 0) + record.count;
    }

    return Object.entries(byDay).map(([date, count]) => ({ date, count }));
  } catch (error) {
    console.warn("[HealthService] Failed to read steps:", error);
    return [];
  }
}

async function getHealthConnectCaloriesBurned(
  startDate: Date,
  endDate: Date
): Promise<DailyCaloriesBurned[]> {
  try {
    const { readRecords } = require("react-native-health-connect");

    const result = await readRecords("TotalCaloriesBurned", {
      timeRangeFilter: {
        operator: "between",
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
      },
    });

    const byDay: Record<string, number> = {};
    for (const record of result) {
      const day = new Date(record.startTime).toISOString().split("T")[0];
      byDay[day] =
        (byDay[day] || 0) + (record.energy?.inKilocalories ?? 0);
    }

    return Object.entries(byDay).map(([date, totalCalories]) => ({
      date,
      totalCalories: Math.round(totalCalories),
    }));
  } catch (error) {
    console.warn("[HealthService] Failed to read calories:", error);
    return [];
  }
}

async function getHealthConnectWorkouts(
  startDate: Date,
  endDate: Date
): Promise<WorkoutSession[]> {
  try {
    const { readRecords } = require("react-native-health-connect");

    const result = await readRecords("ExerciseSession", {
      timeRangeFilter: {
        operator: "between",
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
      },
    });

    return result.map(
      (record: {
        metadata: { id: string };
        title?: string;
        exerciseType?: number;
        startTime: string;
        endTime: string;
      }) => {
        const start = new Date(record.startTime);
        const end = new Date(record.endTime);
        const durationMinutes = Math.round(
          (end.getTime() - start.getTime()) / 60000
        );
        return {
          id: record.metadata?.id ?? String(Date.now()),
          name: record.title ?? "Workout",
          startTime: record.startTime,
          endTime: record.endTime,
          durationMinutes,
          caloriesBurned: 0, // Calories come from TotalCaloriesBurned records
          type: String(record.exerciseType ?? "unknown"),
        };
      }
    );
  } catch (error) {
    console.warn("[HealthService] Failed to read workouts:", error);
    return [];
  }
}

// ── iOS Apple HealthKit ────────────────────────────────────────────────────
async function initHealthKit(): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const AppleHealthKit = require("react-native-health").default;

      const permissions = {
        permissions: {
          read: [
            AppleHealthKit.Constants.Permissions.StepCount,
            AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
            AppleHealthKit.Constants.Permissions.BasalEnergyBurned,
            AppleHealthKit.Constants.Permissions.Workout,
            AppleHealthKit.Constants.Permissions.HeartRate,
            AppleHealthKit.Constants.Permissions.DistanceWalkingRunning,
            AppleHealthKit.Constants.Permissions.Water,
          ],
          write: [
            AppleHealthKit.Constants.Permissions.EnergyConsumed,
          ],
        },
      };

      AppleHealthKit.initHealthKit(
        permissions,
        (error: string | null) => {
          if (error) {
            console.warn("[HealthService] HealthKit init failed:", error);
            resolve(false);
          } else {
            resolve(true);
          }
        }
      );
    } catch (error) {
      console.warn("[HealthService] HealthKit not available:", error);
      resolve(false);
    }
  });
}

async function getHealthKitSteps(
  startDate: Date,
  endDate: Date
): Promise<DailySteps[]> {
  return new Promise((resolve) => {
    try {
      const AppleHealthKit = require("react-native-health").default;

      AppleHealthKit.getDailyStepCountSamples(
        {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
        (
          error: string | null,
          results: Array<{ startDate: string; value: number }>
        ) => {
          if (error) {
            console.warn("[HealthService] Steps read failed:", error);
            resolve([]);
            return;
          }
          resolve(
            results.map((r) => ({
              date: new Date(r.startDate).toISOString().split("T")[0],
              count: Math.round(r.value),
            }))
          );
        }
      );
    } catch {
      resolve([]);
    }
  });
}

async function getHealthKitCaloriesBurned(
  startDate: Date,
  endDate: Date
): Promise<DailyCaloriesBurned[]> {
  return new Promise((resolve) => {
    try {
      const AppleHealthKit = require("react-native-health").default;

      AppleHealthKit.getActiveEnergyBurned(
        {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
        (
          error: string | null,
          results: Array<{ startDate: string; value: number }>
        ) => {
          if (error) {
            resolve([]);
            return;
          }
          // Group by day
          const byDay: Record<string, number> = {};
          for (const r of results) {
            const day = new Date(r.startDate).toISOString().split("T")[0];
            byDay[day] = (byDay[day] || 0) + r.value;
          }
          resolve(
            Object.entries(byDay).map(([date, totalCalories]) => ({
              date,
              totalCalories: Math.round(totalCalories),
            }))
          );
        }
      );
    } catch {
      resolve([]);
    }
  });
}

async function getHealthKitWorkouts(
  startDate: Date,
  endDate: Date
): Promise<WorkoutSession[]> {
  return new Promise((resolve) => {
    try {
      const AppleHealthKit = require("react-native-health").default;

      AppleHealthKit.getSamples(
        {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          type: "Workout",
        },
        (error: string | null, results: any[]) => {
          if (error) {
            resolve([]);
            return;
          }
          resolve(
            results.map((r: any) => {
              const start = new Date(r.start);
              const end = new Date(r.end);
              return {
                id: r.id ?? String(Date.now()),
                name: r.activityName ?? "Workout",
                startTime: r.start,
                endTime: r.end,
                durationMinutes: Math.round(
                  (end.getTime() - start.getTime()) / 60000
                ),
                caloriesBurned: Math.round(r.calories ?? 0),
                type: r.activityName ?? "unknown",
              };
            })
          );
        }
      );
    } catch {
      resolve([]);
    }
  });
}

// ── Unified Public API ─────────────────────────────────────────────────────
export const HealthService = {
  /**
   * Initialize the health platform (Health Connect or HealthKit).
   * Returns true if available and initialized.
   */
  async init(): Promise<boolean> {
    if (Platform.OS === "android") {
      return initHealthConnect();
    } else if (Platform.OS === "ios") {
      return initHealthKit();
    }
    return false;
  },

  /**
   * Request permissions from the user.
   * On iOS, this is handled during initHealthKit.
   */
  async requestPermissions(): Promise<HealthPermissionStatus> {
    if (Platform.OS === "android") {
      return requestHealthConnectPermissions();
    }
    // iOS permissions are requested during init
    return { granted: true, permissions: [] };
  },

  /**
   * Get daily step counts for a date range.
   */
  async getSteps(startDate: Date, endDate: Date): Promise<DailySteps[]> {
    if (Platform.OS === "android") {
      return getHealthConnectSteps(startDate, endDate);
    } else if (Platform.OS === "ios") {
      return getHealthKitSteps(startDate, endDate);
    }
    return [];
  },

  /**
   * Get daily calories burned for a date range.
   */
  async getCaloriesBurned(
    startDate: Date,
    endDate: Date
  ): Promise<DailyCaloriesBurned[]> {
    if (Platform.OS === "android") {
      return getHealthConnectCaloriesBurned(startDate, endDate);
    } else if (Platform.OS === "ios") {
      return getHealthKitCaloriesBurned(startDate, endDate);
    }
    return [];
  },

  /**
   * Get workout sessions for a date range.
   */
  async getWorkouts(
    startDate: Date,
    endDate: Date
  ): Promise<WorkoutSession[]> {
    if (Platform.OS === "android") {
      return getHealthConnectWorkouts(startDate, endDate);
    } else if (Platform.OS === "ios") {
      return getHealthKitWorkouts(startDate, endDate);
    }
    return [];
  },

  /**
   * Get today's step count.
   */
  async getTodaySteps(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const now = new Date();
    const steps = await this.getSteps(today, now);
    return steps.reduce((sum, s) => sum + s.count, 0);
  },

  /**
   * Get today's calories burned.
   */
  async getTodayCaloriesBurned(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const now = new Date();
    const cals = await this.getCaloriesBurned(today, now);
    return cals.reduce((sum, c) => sum + c.totalCalories, 0);
  },
};

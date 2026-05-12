import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "@hylift_has_seen_onboarding";

export async function hasSeenOnboarding(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(KEY);
    return value === "true";
  } catch {
    return false;
  }
}

export async function setHasSeenOnboarding(value: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, value ? "true" : "false");
  } catch {
    // ignore — onboarding will simply replay next launch
  }
}

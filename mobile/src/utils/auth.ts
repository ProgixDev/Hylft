import AsyncStorage from "@react-native-async-storage/async-storage";

const AUTH_KEY = "@hylift_auth";
const ONBOARDING_KEY = "@hylift_onboarding_completed";

export const auth = {
  // Check if user is logged in
  isLoggedIn: async (): Promise<boolean> => {
    try {
      const value = await AsyncStorage.getItem(AUTH_KEY);
      return value === "true";
    } catch (error) {
      console.error("Error checking auth status:", error);
      return false;
    }
  },

  // Set user as logged in
  setLoggedIn: async (): Promise<void> => {
    try {
      await AsyncStorage.setItem(AUTH_KEY, "true");
    } catch (error) {
      console.error("Error setting auth status:", error);
    }
  },

  // Log out user
  logout: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(AUTH_KEY);
    } catch (error) {
      console.error("Error logging out:", error);
    }
  },

  // Check if onboarding has been completed
  hasCompletedOnboarding: async (): Promise<boolean> => {
    try {
      const value = await AsyncStorage.getItem(ONBOARDING_KEY);
      return value === "true";
    } catch (error) {
      console.error("Error checking onboarding status:", error);
      return false;
    }
  },

  // Mark onboarding as completed
  setOnboardingCompleted: async (): Promise<void> => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, "true");
    } catch (error) {
      console.error("Error setting onboarding status:", error);
    }
  },
};

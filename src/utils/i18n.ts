import * as Localization from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";

import en from "../locales/en.json";
import fr from "../locales/fr.json";

const LANGUAGE_STORAGE_KEY = "@hylift_language";

// Get device language
const getDeviceLanguage = (): string => {
  const locale = Localization.getLocales()[0];
  const languageCode = locale?.languageCode || "en";
  return languageCode === "fr" ? "fr" : "en";
};

// Load saved language or use device language
export const getSavedLanguage = async (): Promise<string> => {
  try {
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (savedLanguage === "en" || savedLanguage === "fr") {
      return savedLanguage;
    }
    return getDeviceLanguage();
  } catch (error) {
    console.error("Error loading language:", error);
    return getDeviceLanguage();
  }
};

// Save language preference
export const saveLanguage = async (language: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch (error) {
    console.error("Error saving language:", error);
  }
};

// Initialize i18n
export const initI18n = async (): Promise<string> => {
  const language = await getSavedLanguage();

  // Only initialize if not already initialized
  if (!i18n.isInitialized) {
    // Wait for i18n to be initialized
    await i18n
      .use(initReactI18next)
      .init({
        compatibilityJSON: "v3",
        resources: {
          en: { translation: en },
          fr: { translation: fr },
        },
        lng: language,
        fallbackLng: "en",
        interpolation: {
          escapeValue: false,
        },
        react: {
          useSuspense: false,
        },
      });
  } else {
    // If already initialized, just change the language
    await i18n.changeLanguage(language);
  }

  return language;
};

// Change language
export const changeLanguage = async (language: string) => {
  await saveLanguage(language);
  await i18n.changeLanguage(language);
};

export default i18n;

import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { changeLanguage, initI18n } from "../utils/i18n";

type Language = "en" | "fr";

interface I18nContextType {
  language: Language;
  setLanguage: (language: Language) => Promise<void>;
  isLoading: boolean;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [isLoading, setIsLoading] = useState(true);

  // Initialize i18n on mount
  useEffect(() => {
    const initialize = async () => {
      try {
        const language = await initI18n();
        setLanguageState(language as Language);
      } catch (error) {
        console.error("Error initializing i18n:", error);
        setLanguageState("en"); // Fallback to English
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, []);

  const setLanguage = async (newLanguage: Language) => {
    try {
      await changeLanguage(newLanguage);
      setLanguageState(newLanguage);
      await AsyncStorage.setItem("@hylift_language", newLanguage);
    } catch (error) {
      console.error("Error changing language:", error);
    }
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, isLoading }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}

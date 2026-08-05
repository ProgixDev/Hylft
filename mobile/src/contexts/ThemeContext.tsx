import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Theme, themes, ThemeType } from "../constants/themes";

interface ThemeContextType {
  theme: Theme;
  themeType: ThemeType;
  setTheme: (themeType: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = "@hylift_theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeType, setThemeType] = useState<ThemeType>("male"); // Default to male

  // Load theme from storage on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (
          storedTheme &&
          (storedTheme === "male" || storedTheme === "female" || storedTheme === "dark")
        ) {
          setThemeType(storedTheme);
        }
      } catch (error) {
        console.error("Error loading theme:", error);
      }
    };

    loadTheme();
  }, []);

  // Save theme to storage when it changes
  const setTheme = async (newThemeType: ThemeType) => {
    try {
      setThemeType(newThemeType);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newThemeType);
    } catch (error) {
      console.error("Error saving theme:", error);
    }
  };

  const theme = themes[themeType];

  // Always provide theme, even before loading is complete
  return (
    <ThemeContext.Provider value={{ theme, themeType, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    // Return default theme if context is not available
    return {
      theme: themes.male,
      themeType: "male" as ThemeType,
      setTheme: () => {},
    };
  }
  return context;
}

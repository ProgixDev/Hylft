import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type FontScaleKey = "S" | "M" | "L" | "XL";

const SCALE_MAP: Record<FontScaleKey, number> = {
  S: 0.85,
  M: 1.0,
  L: 1.15,
  XL: 1.3,
};

const VALID_KEYS: FontScaleKey[] = ["S", "M", "L", "XL"];
const STORAGE_KEY = "@hylift_font_scale";

interface FontSizeContextType {
  scaleKey: FontScaleKey;
  fontScale: number;
  setScaleKey: (key: FontScaleKey) => void;
  fs: (base: number) => number;
}

const FontSizeContext = createContext<FontSizeContextType | undefined>(
  undefined,
);

export function FontSizeProvider({ children }: { children: React.ReactNode }) {
  const [scaleKey, setKey] = useState<FontScaleKey>("M");

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((v) => {
      if (v && VALID_KEYS.includes(v as FontScaleKey)) {
        setKey(v as FontScaleKey);
      }
    });
  }, []);

  const setScaleKey = useCallback(async (key: FontScaleKey) => {
    setKey(key);
    await AsyncStorage.setItem(STORAGE_KEY, key);
  }, []);

  const scale = SCALE_MAP[scaleKey];

  const fs = useCallback(
    (base: number) => Math.round(base * scale),
    [scale],
  );

  return (
    <FontSizeContext.Provider
      value={{ scaleKey, fontScale: scale, setScaleKey, fs }}
    >
      {children}
    </FontSizeContext.Provider>
  );
}

export function useFontSize() {
  const ctx = useContext(FontSizeContext);
  if (!ctx) {
    return {
      scaleKey: "M" as FontScaleKey,
      fontScale: 1,
      setScaleKey: (() => {}) as (key: FontScaleKey) => void,
      fs: (base: number) => base,
    };
  }
  return ctx;
}

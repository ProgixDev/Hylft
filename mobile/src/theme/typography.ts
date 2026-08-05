import type { TextStyle } from "react-native";

export const fontFamilies = {
  inter400: "Inter_400Regular",
  inter500: "Inter_500Medium",
  inter600: "Inter_600SemiBold",
  inter700: "Inter_700Bold",
  inter800: "Inter_800ExtraBold",
  mono700: "JetBrainsMono_700Bold",
} as const;

export const type: Record<string, TextStyle> = {
  h1: {
    fontFamily: fontFamilies.inter800,
    fontSize: 32,
    letterSpacing: -0.64,
    lineHeight: 33,
    textTransform: "uppercase",
  },
  body: {
    fontFamily: fontFamilies.inter400,
    fontSize: 17,
    letterSpacing: 0,
    lineHeight: 24,
  },
  cta: {
    fontFamily: fontFamilies.inter700,
    fontSize: 17,
    letterSpacing: 1.02,
    textTransform: "uppercase",
  },
  eyebrow: {
    fontFamily: fontFamilies.mono700,
    fontSize: 9,
    letterSpacing: 1.6,
    textTransform: "uppercase",
  },
  monoData: {
    fontFamily: fontFamilies.mono700,
    fontSize: 11,
    letterSpacing: 0,
  },
  progress: {
    fontFamily: fontFamilies.inter500,
    fontSize: 13,
  },
};

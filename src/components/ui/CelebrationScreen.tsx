import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { FONTS } from "../../constants/fonts";
import { useTheme } from "../../contexts/ThemeContext";
import ChipButton from "./ChipButton";

const { width: SW, height: SH } = Dimensions.get("window");
const GIF_SIZE = 160;

interface Props {
  headline: string;
  message: string;
  /** Ionicons name — used as fallback when gifSource is not provided */
  icon?: keyof typeof Ionicons.glyphMap;
  /** require('./path/to/file.gif') — displayed instead of the icon badge */
  gifSource?: any;
  /** Short all-caps label shown above the headline, e.g. "GOAL SET" */

  buttonLabel?: string;
  next: string;
}

export function CelebrationScreen({
  headline,
  message,
  icon = "sparkles",
  gifSource,

  buttonLabel = "Next",
  next,
}: Props) {
  const router = useRouter();
  const { theme } = useTheme();

  const visualScale = useRef(new Animated.Value(0.5)).current;
  const visualOpacity = useRef(new Animated.Value(0)).current;
  const textY = useRef(new Animated.Value(36)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const btnOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance sequence
    Animated.sequence([
      Animated.parallel([
        Animated.spring(visualScale, {
          toValue: 1,
          friction: 5,
          tension: 70,
          useNativeDriver: true,
        }),
        Animated.timing(visualOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(textY, {
          toValue: 0,
          duration: 420,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 420,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(btnOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // The get-started celebration steps are pinned to the light onboarding surface.
  const isLight = true;

  return (
    <View style={[s.root, { backgroundColor: "#FFFFFF" }]}>
      {/* Full-screen gradient layer */}

      {/* ── Visual zone (top ~55%) ── */}
      <View style={s.visualZone}>
        {/* Static inner glow */}
        {!gifSource && (
          <View
            style={[
              s.innerGlow,
              {
                backgroundColor: theme.primary.main + (isLight ? "15" : "20"),
              },
            ]}
          />
        )}

        {/* Main circle with GIF or icon */}
        <Animated.View
          style={[
            s.circle,
            {
              backgroundColor: gifSource
                ? "transparent"
                : theme.primary.main + (isLight ? "18" : "22"),
              borderColor: gifSource
                ? "transparent"
                : theme.primary.main + "55",
              opacity: visualOpacity,
              transform: [{ scale: visualScale }],
            },
          ]}
        >
          {gifSource ? (
            <Image source={gifSource} style={s.gif} contentFit="contain" />
          ) : (
            <View style={[s.iconBadge, {}]}>
              <Ionicons name={icon} size={70} color="#fff" />
            </View>
          )}
        </Animated.View>
      </View>

      {/* ── Text zone ── */}
      <Animated.View
        style={[
          s.textZone,
          {
            opacity: textOpacity,
            transform: [{ translateY: textY }],
          },
        ]}
      >
        <Text style={[s.headline, { color: "#111827" }]}>
          {headline}
        </Text>
        <Text style={[s.message, { color: theme.foreground.gray }]}>
          {message}
        </Text>
      </Animated.View>

      {/* ── CTA ── */}
      <Animated.View style={[s.btnArea, { opacity: btnOpacity }]}>
        <ChipButton
          title={buttonLabel}
          onPress={() => router.push(next as any)}
          variant="primary"
          size="lg"
          fullWidth
        />
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    overflow: "hidden",
  },
  ambient: {
    position: "absolute",
    width: SW * 1.5,
    height: SW * 1.5,
    borderRadius: SW * 0.75,
    top: -SW * 0.6,
    alignSelf: "center",
  },
  visualZone: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  innerGlow: {
    position: "absolute",
    width: GIF_SIZE + 28,
    height: GIF_SIZE + 28,
    borderRadius: (GIF_SIZE + 28) / 2,
  },
  circle: {
    width: GIF_SIZE,
    height: GIF_SIZE,
    borderRadius: GIF_SIZE / 2,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  gif: {
    width: GIF_SIZE - 16,
    height: GIF_SIZE - 16,
  },
  iconBadge: {
    width: GIF_SIZE - 16,
    height: GIF_SIZE - 16,
    borderRadius: (GIF_SIZE - 16) / 2,
    alignItems: "center",
    justifyContent: "center",
  },

  textZone: {
    alignItems: "center",
    paddingHorizontal: 28,
    paddingBottom: 28,
  },
  pill: {
    borderWidth: 1,
    borderRadius: 100,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 20,
  },
  pillText: {
    fontSize: 11,
    fontFamily: FONTS.bold,
    letterSpacing: 2.5,
    textTransform: "uppercase",
  },
  headline: {
    fontSize: 32,
    fontFamily: FONTS.extraBold,
    textAlign: "center",
    marginBottom: 12,
    lineHeight: 40,
  },
  message: {
    fontSize: 15,
    fontFamily: FONTS.regular,
    textAlign: "center",
    lineHeight: 24,
  },
  btnArea: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
});

export default CelebrationScreen;

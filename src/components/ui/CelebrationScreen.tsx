import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
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
import { Ionicons } from "@expo/vector-icons";
import ChipButton from "./ChipButton";
import { FONTS } from "../../constants/fonts";
import { Theme } from "../../constants/themes";
import { useTheme } from "../../contexts/ThemeContext";

const { width: SW, height: SH } = Dimensions.get("window");
const GIF_SIZE = 200;

interface Props {
  headline: string;
  message: string;
  /** Ionicons name — used as fallback when gifSource is not provided */
  icon?: keyof typeof Ionicons.glyphMap;
  /** require('./path/to/file.gif') — displayed instead of the icon badge */
  gifSource?: any;
  /** Short all-caps label shown above the headline, e.g. "GOAL SET" */
  badge?: string;
  buttonLabel?: string;
  next: string;
}

export function CelebrationScreen({
  headline,
  message,
  icon = "sparkles",
  gifSource,
  badge,
  buttonLabel = "Next",
  next,
}: Props) {
  const router = useRouter();
  const { theme } = useTheme();

  const visualScale = useRef(new Animated.Value(0.5)).current;
  const visualOpacity = useRef(new Animated.Value(0)).current;
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;
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

    // Expanding pulse rings (offset by half-cycle)
    const startRing = (
      anim: Animated.Value,
      delay: number,
    ) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 2200,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    };

    startRing(ring1, 0);
    startRing(ring2, 1100);
  }, []);

  const ringInterp = (anim: Animated.Value) => ({
    scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 2] }),
    opacity: anim.interpolate({
      inputRange: [0, 0.15, 1],
      outputRange: [0, 0.55, 0],
    }),
  });

  const r1 = ringInterp(ring1);
  const r2 = ringInterp(ring2);

  // Light themes need slightly different treatment for the glow
  const isLight =
    theme.background.dark === "#FFFFFF" ||
    theme.background.dark === "#FFF8F3";

  const glowStrength = isLight ? "20" : "28";

  return (
    <View style={[s.root, { backgroundColor: theme.background.dark }]}>
      {/* Full-screen gradient layer */}
      <LinearGradient
        colors={[theme.primary.main + "35", theme.background.dark + "00"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.65 }}
      />

      {/* Large ambient circle behind the visual */}
      <View
        style={[
          s.ambient,
          { backgroundColor: theme.primary.main + glowStrength },
        ]}
      />

      {/* ── Visual zone (top ~55%) ── */}
      <View style={s.visualZone}>
        {/* Expanding rings */}
        {[r1, r2].map((r, i) => (
          <Animated.View
            key={i}
            style={[
              s.ring,
              {
                borderColor: theme.primary.main,
                opacity: r.opacity,
                transform: [{ scale: r.scale }],
              },
            ]}
          />
        ))}

        {/* Static inner glow */}
        <View
          style={[
            s.innerGlow,
            { backgroundColor: theme.primary.main + (isLight ? "15" : "20") },
          ]}
        />

        {/* Main circle with GIF or icon */}
        <Animated.View
          style={[
            s.circle,
            {
              backgroundColor: theme.primary.main + (isLight ? "18" : "22"),
              borderColor: theme.primary.main + "55",
              opacity: visualOpacity,
              transform: [{ scale: visualScale }],
            },
          ]}
        >
          {gifSource ? (
            <Image
              source={gifSource}
              style={s.gif}
              contentFit="contain"
            />
          ) : (
            <View
              style={[s.iconBadge, { backgroundColor: theme.primary.main }]}
            >
              <Ionicons name={icon} size={76} color="#fff" />
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
        {badge && (
          <View
            style={[
              s.pill,
              {
                backgroundColor: theme.primary.main + "18",
                borderColor: theme.primary.main + "50",
              },
            ]}
          >
            <Text style={[s.pillText, { color: theme.primary.main }]}>
              {badge}
            </Text>
          </View>
        )}

        <Text style={[s.headline, { color: theme.foreground.white }]}>
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

const RING_SIZE = GIF_SIZE + 60;

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
  ring: {
    position: "absolute",
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 1.5,
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

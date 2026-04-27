import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { FONTS } from "../../constants/fonts";

const { width: SW, height: SH } = Dimensions.get("window");

const ICON_W = 200;
const ICON_H = Math.round(ICON_W * (706 / 1008)); // ≈ 140 — native icon aspect ratio

// Phase-5 lockup math:
//   Icon center shifts to SW/2 − 88 (X).  Visual half-width = 200×0.78/2 = 78.
//   Icon right edge after shift = SW/2 − 88 + 78 = SW/2 − 10.
//   Wordmark left edge = SW/2 − 10 + 16 (gap) = SW/2 + 6.
const WM_FULL_W = 158;
const WM_LEFT = SW / 2 + 6;
const WM_TOP = SH / 2 - 26; // optical cap-height center for ~42 px text

// Ellipse sits just below screen centre — acts as the "portal" the icon rises from.
// Extra 28 px padding so blur(10px) doesn't clip at the container edges.
const SHADOW_CY = SH / 2 + 80;
const SHADOW_PAD = 28;
const SHADOW_W = 310; // ellipse outer ring width
const SHADOW_H = 58; // ellipse outer ring height

const SMOOTH = Easing.bezier(0.4, 0, 0.2, 1);
const EASE_OUT = Easing.bezier(0.2, 0.8, 0.2, 1);

export interface SplashScreenProps {
  onAnimationComplete: () => void;
}

export default function SplashScreen({
  onAnimationComplete,
}: SplashScreenProps) {
  const screenAlpha = useRef(new Animated.Value(1)).current;
  const shadowAlpha = useRef(new Animated.Value(1)).current; // visible from t=0
  const shadowScX = useRef(new Animated.Value(1)).current; // scaleX: 1→0 (closes as icon rises)
  const iconAlpha = useRef(new Animated.Value(0)).current;
  const iconY = useRef(new Animated.Value(130)).current; // starts below, rises up
  const iconX = useRef(new Animated.Value(0)).current;
  const iconSc = useRef(new Animated.Value(0.6)).current;
  const wmW = useRef(new Animated.Value(0)).current;
  const wmAlpha = useRef(new Animated.Value(0)).current;
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;
  const dotsAlpha = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const ts: ReturnType<typeof setTimeout>[] = [];

    const pulseDot = (v: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(v, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
            easing: SMOOTH,
          }),
          Animated.timing(v, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
            easing: SMOOTH,
          }),
        ]),
      );

    // Phase 1 (t=350 ms) — loading dots only; ellipse is already visible at full opacity
    ts.push(
      setTimeout(() => {
        Animated.timing(dotsAlpha, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
          easing: SMOOTH,
        }).start();
        pulseDot(dot1, 0).start();
        pulseDot(dot2, 180).start();
        pulseDot(dot3, 360).start();
      }, 350),
    );

    // Phase 2 (t=800 ms) — icon rises from below the ellipse; ellipse closes behind it
    ts.push(
      setTimeout(() => {
        Animated.parallel([
          // Icon emerges upward
          Animated.timing(iconAlpha, {
            toValue: 1,
            duration: 350,
            useNativeDriver: true,
            easing: SMOOTH,
          }),
          Animated.timing(iconY, {
            toValue: 0,
            duration: 900,
            useNativeDriver: true,
            easing: EASE_OUT,
          }),
          Animated.timing(iconSc, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
            easing: EASE_OUT,
          }),
          // Ellipse pinches shut (scaleX) and fades as icon passes through
          Animated.timing(shadowScX, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
            easing: SMOOTH,
          }),
          Animated.timing(shadowAlpha, {
            toValue: 0,
            duration: 700,
            useNativeDriver: true,
            easing: SMOOTH,
          }),
        ]).start();
      }, 800),
    );

    // Phase 3 (t=1500 ms) — icon floats up
    ts.push(
      setTimeout(() => {
        Animated.timing(iconY, {
          toValue: -90,
          duration: 600,
          useNativeDriver: true,
          easing: EASE_OUT,
        }).start();
      }, 1500),
    );

    // Phase 4 (t=2200 ms) — icon returns to center
    ts.push(
      setTimeout(() => {
        Animated.timing(iconY, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
          easing: EASE_OUT,
        }).start();
      }, 2200),
    );

    // Phase 5 (t=2900 ms) — lockup forms: icon shifts left, wordmark wipes in
    ts.push(
      setTimeout(() => {
        wmAlpha.setValue(1);
        Animated.parallel([
          Animated.timing(iconX, {
            toValue: -88,
            duration: 700,
            useNativeDriver: true,
            easing: SMOOTH,
          }),
          Animated.timing(iconSc, {
            toValue: 0.78,
            duration: 700,
            useNativeDriver: true,
            easing: SMOOTH,
          }),
          Animated.timing(wmW, {
            toValue: WM_FULL_W,
            duration: 700,
            useNativeDriver: false,
            easing: SMOOTH,
          }),
        ]).start();
      }, 2900),
    );

    // Phase 7 (t=4900 ms) — whole screen fades out
    ts.push(
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(screenAlpha, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
            easing: SMOOTH,
          }),
          Animated.timing(dotsAlpha, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
            easing: SMOOTH,
          }),
        ]).start();
      }, 4900),
    );

    // Done (t=5600 ms)
    ts.push(setTimeout(onAnimationComplete, 5600));

    return () => ts.forEach(clearTimeout);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const dotStyle = (v: Animated.Value) => ({
    opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
    transform: [
      {
        scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.1] }),
      },
    ],
  });

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { opacity: screenAlpha }]}>
      {/* ── Background ──────────────────────────────────────── */}
      <LinearGradient
        colors={["#2A5CE0", "#1F47C9", "#1838A8"]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Ground shadow — concentric ellipses (radial gradient stops) + blur filter */}
      <Animated.View
        pointerEvents="none"
        style={[
          s.shadowWrap,
          { opacity: shadowAlpha, transform: [{ scaleX: shadowScX }] },
        ]}
      >
        <View style={s.sh3} />
        <View style={s.sh2} />
        <View style={s.sh1} />
      </Animated.View>

      {/* ── Icon ────────────────────────────────────────────── */}
      <Animated.View
        pointerEvents="none"
        style={[
          s.iconWrap,
          {
            opacity: iconAlpha,
            transform: [
              { translateY: iconY },
              { translateX: iconX },
              { scale: iconSc },
            ],
          },
        ]}
      >
        <Image
          source={require("../../../assets/images/icon.png")}
          style={{ width: ICON_W, height: ICON_H }}
          resizeMode="contain"
        />
      </Animated.View>

      {/* ── Wordmark (width-clipped wipe reveal) ────────────── */}
      <Animated.View
        pointerEvents="none"
        style={[s.wmOuter, { width: wmW, opacity: wmAlpha }]}
      >
        <Text style={s.wmText} numberOfLines={1}>
          HYLFT
        </Text>
      </Animated.View>

      {/* ── Loading dots ────────────────────────────────────── */}
      <Animated.View
        pointerEvents="none"
        style={[s.dotsRow, { opacity: dotsAlpha }]}
      >
        <Animated.View style={[s.dot, dotStyle(dot1)]} />
        <Animated.View style={[s.dot, dotStyle(dot2)]} />
        <Animated.View style={[s.dot, dotStyle(dot3)]} />
      </Animated.View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  // Radial glow approximation
  glow1: {
    position: "absolute",
    top: -SH * 0.15,
    left: SW / 2 - 180,
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: "rgba(120,160,255,0.14)",
  },
  glow2: {
    position: "absolute",
    top: -SH * 0.08,
    left: SW / 2 - 120,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "rgba(120,160,255,0.10)",
  },
  streak: {
    position: "absolute",
    top: 70,
    left: -SW * 0.2,
    width: SW * 1.4,
    height: 1.5,
    backgroundColor: "rgba(255,255,255,0.10)",
    transform: [{ rotate: "-1.5deg" }],
  },
  // Outer container — padding ensures blur doesn't clip at edges
  shadowWrap: {
    position: "absolute",
    top: SHADOW_CY - SHADOW_H / 2 - SHADOW_PAD,
    left: SW / 2 - SHADOW_W / 2 - SHADOW_PAD,
    width: SHADOW_W + SHADOW_PAD * 2,
    height: SHADOW_H + SHADOW_PAD * 2,
    alignItems: "center",
    justifyContent: "center",
    filter: [{ blur: 10 }],
  } as any,
  // Outer ring — soft transparent halo
  sh3: {
    position: "absolute",
    width: SHADOW_W,
    height: SHADOW_H,
    borderRadius: SHADOW_H / 2, // height/2 → true pill
    backgroundColor: "rgba(15,40,120,0.18)",
  },
  // Mid ring
  sh2: {
    position: "absolute",
    width: Math.round(SHADOW_W * 0.68),
    height: Math.round(SHADOW_H * 0.68),
    borderRadius: Math.round(SHADOW_H * 0.34),
    backgroundColor: "rgba(15,40,120,0.40)",
  },
  // Core — 80 % opacity centre
  sh1: {
    position: "absolute",
    width: Math.round(SHADOW_W * 0.38),
    height: Math.round(SHADOW_H * 0.38),
    borderRadius: Math.round(SHADOW_H * 0.19),
    backgroundColor: "rgba(15,40,120,0.65)",
  },
  // Icon: default center = (SW/2, SH/2); all motion via transform
  iconWrap: {
    position: "absolute",
    top: SH / 2 - ICON_H / 2,
    left: SW / 2 - ICON_W / 2,
    width: ICON_W,
    height: ICON_H,
    ...Platform.select({
      ios: {
        shadowColor: "#0A1950",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.45,
        shadowRadius: 24,
      },
    }),
  },
  // Wordmark container: overflow hidden → expanding width = left-to-right reveal
  wmOuter: {
    position: "absolute",
    top: WM_TOP,
    left: WM_LEFT,
    overflow: "hidden",
    height: 52,
    justifyContent: "center",
  },
  wmText: {
    fontSize: 42,
    fontFamily: FONTS.extraBold,
    letterSpacing: 42 * 0.02,
    color: "#FFFFFF",
    textShadowColor: "rgba(0,30,100,0.55)",
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 10,
    includeFontPadding: false,
  },
  dotsRow: {
    position: "absolute",
    bottom: 56,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
  },
});

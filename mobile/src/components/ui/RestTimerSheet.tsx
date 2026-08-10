import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Text } from "./ScaledText";
import Svg, { Circle } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { FONTS } from "../../constants/fonts";
import { useTheme } from "../../contexts/ThemeContext";

const { width: SCREEN_W } = Dimensions.get("window");

// ─── Circular progress constants ─────────────────────────────────────
const RING_SIZE = Math.min(SCREEN_W * 0.6, 250);
const STROKE_W = 7;
const RADIUS = (RING_SIZE - STROKE_W) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// ─── Animated SVG circle ─────────────────────────────────────────────
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Props {
  visible: boolean;
  endsAt: number;
  totalSeconds: number;
  onSkip: () => void;
  onAdjust: (delta: number) => void;
}

export default function RestTimerSheet({
  visible,
  endsAt,
  totalSeconds,
  onSkip,
  onAdjust,
}: Props) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, Math.round((endsAt - Date.now()) / 1000)),
  );

  // ── Slide-up animation ─────────────────────────────────────────────
  const slideAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 1 : 0,
      duration: 320,
      easing: visible ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [visible, slideAnim]);

  // ── SVG ring progress ──────────────────────────────────────────────
  const progressAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!visible) return;
    const msLeft = Math.max(0, endsAt - Date.now());
    const startRatio =
      totalSeconds > 0 ? Math.min(1, msLeft / 1000 / totalSeconds) : 0;
    progressAnim.setValue(startRatio);
    if (msLeft <= 0) return;
    const anim = Animated.timing(progressAnim, {
      toValue: 0,
      duration: msLeft,
      easing: Easing.linear,
      useNativeDriver: false,
    });
    anim.start();
    return () => anim.stop();
  }, [visible, endsAt, totalSeconds, progressAnim]);

  const strokeDashoffset = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [CIRCUMFERENCE, 0],
  });

  // ── Timer label tick ───────────────────────────────────────────────
  useEffect(() => {
    if (!visible) return;
    setRemaining(Math.max(0, Math.round((endsAt - Date.now()) / 1000)));
    const id = setInterval(() => {
      const next = Math.max(0, Math.round((endsAt - Date.now()) / 1000));
      setRemaining(next);
      if (next <= 0) {
        clearInterval(id);
        onSkip();
      }
    }, 250);
    return () => clearInterval(id);
  }, [visible, endsAt, onSkip]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [500, 0],
  });

  if (!visible) return null;

  const accentColor = theme.primary.main;
  const trackColor = "rgba(255,255,255,0.25)";

  return (
    <Animated.View
      style={[
        styles.overlay,
        { opacity: slideAnim },
      ]}
      pointerEvents={visible ? "auto" : "none"}
    >
      <Animated.View
        style={[
          styles.sheetWrapper,
          { transform: [{ translateY }] },
        ]}
      >
        {/* Flat background behind rounded corners */}
        <View style={[styles.sheetBg, { backgroundColor: theme.background.darker }]} />
        <View
          style={[
            styles.sheet,
            { backgroundColor: theme.background.darker },
          ]}
        >
          {/* ── Handle bar ──────────────────────────────────────────── */}
          <View style={styles.handleRow}>
            <View
              style={[styles.handle, { backgroundColor: theme.foreground.gray }]}
            />
          </View>

          {/* ── Header ──────────────────────────────────────────────── */}
          <View style={styles.header}>
            {/* Spacer to balance the close button */}
            <View style={{ width: 32 }} />
            <Text style={[styles.headerTitle, { color: theme.foreground.white }]}>
              {t("workoutPlayer.timer")}
            </Text>
            <TouchableOpacity
              style={[styles.closeBtn, { backgroundColor: theme.background.accent }]}
              onPress={onSkip}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="close" size={18} color={theme.foreground.white} />
            </TouchableOpacity>
          </View>

          {/* ── Separator ──────────────────────────────────────────── */}
          <View style={[styles.separator, { backgroundColor: theme.background.accent }]} />

          {/* ── Ring + adjust labels zone ─────────────────────────── */}
          <View style={styles.ringZone}>
            {/* SVG ring + timer in fixed-size box */}
            <View style={{ width: RING_SIZE, height: RING_SIZE }}>
              <Svg
                width={RING_SIZE}
                height={RING_SIZE}
                style={{ position: "absolute", top: 0, left: 0 }}
              >
                {/* Thin full circle in accent color (consumed trail) */}
                <Circle
                  cx={RING_SIZE / 2}
                  cy={RING_SIZE / 2}
                  r={RADIUS}
                  fill="none"
                  stroke={accentColor}
                  strokeWidth={2}
                  opacity={0.5}
                />
                {/* Progress */}
                <AnimatedCircle
                  cx={RING_SIZE / 2}
                  cy={RING_SIZE / 2}
                  r={RADIUS}
                  fill="none"
                  stroke={accentColor}
                  strokeWidth={STROKE_W}
                  strokeLinecap="round"
                  strokeDasharray={`${CIRCUMFERENCE}`}
                  strokeDashoffset={strokeDashoffset}
                  rotation="-90"
                  origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
                />
              </Svg>

              {/* Timer digits centered in ring */}
              <View style={styles.timerOverlay}>
                <Text style={[styles.timerText, { color: theme.foreground.white }]}>
                  {`${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`}
                </Text>
              </View>
            </View>

            {/* -15s / +15s anchored at bottom corners of ring */}
            <View style={styles.adjustRow}>
              <TouchableOpacity
                onPress={() => onAdjust(-15)}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={[styles.adjustText, { color: accentColor }]}>
                  -15s
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onAdjust(15)}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={[styles.adjustText, { color: accentColor }]}>
                  +15s
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Skip button ─────────────────────────────────────────── */}
          <TouchableOpacity
            style={[styles.skipBtn, { backgroundColor: theme.background.accent }]}
            onPress={onSkip}
            activeOpacity={0.7}
          >
            <Text style={[styles.skipBtnText, { color: theme.foreground.white }]}>
              {t("workoutPlayer.skipRest")}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
    justifyContent: "flex-end",
  },
  sheetWrapper: {},
  sheetBg: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 28,
    bottom: 0,
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  handleRow: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 4,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    opacity: 0.4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 12,
    paddingBottom: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    textAlign: "center",
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  separator: {
    height: 1,
    marginTop: 8,
  },
  ringZone: {
    alignItems: "center",
    marginTop: 16,
    marginBottom: 24,
  },
  timerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  timerText: {
    fontSize: 58,
    fontFamily: FONTS.extraBold,
    letterSpacing: -1,
  },
  adjustRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: RING_SIZE,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  adjustText: {
    fontSize: 15,
    fontFamily: FONTS.bold,
  },
  skipBtn: {
    alignItems: "center",
    paddingVertical: 16,
    borderRadius: 16,
  },
  skipBtnText: {
    fontSize: 15,
    fontFamily: FONTS.bold,
  },
});

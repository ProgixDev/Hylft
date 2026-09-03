import React, { useEffect, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Text } from "./ScaledText";
import Svg, { Circle } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { FONTS } from "../../constants/fonts";
import { useActiveWorkout } from "../../contexts/ActiveWorkoutContext";
import { useTheme } from "../../contexts/ThemeContext";

const RING_SIZE = 40;
const STROKE_W = 3;
const RADIUS = (RING_SIZE - STROKE_W) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function MiniRestTimer() {
  const { theme } = useTheme();
  const { guidedPlayer, stopPlayerRest, setRestTimerMinimized } = useActiveWorkout();
  const router = useRouter();

  const endsAt = guidedPlayer?.restEndsAt;
  const totalSeconds = guidedPlayer?.restTotalSeconds ?? 60;
  const visible = !!endsAt && endsAt > Date.now();

  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!visible || !endsAt) return;
    setRemaining(Math.max(0, Math.round((endsAt - Date.now()) / 1000)));
    const id = setInterval(() => {
      const next = Math.max(0, Math.round((endsAt - Date.now()) / 1000));
      setRemaining(next);
      if (next <= 0) {
        clearInterval(id);
        stopPlayerRest();
      }
    }, 250);
    return () => clearInterval(id);
  }, [visible, endsAt, stopPlayerRest]);

  if (!visible || remaining <= 0) return null;

  const progress = totalSeconds > 0 ? remaining / totalSeconds : 0;
  const dashOffset = CIRCUMFERENCE * (1 - progress);
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const accent = theme.primary.main;

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: theme.background.darker }]}
      activeOpacity={0.85}
      onPress={() => {
        setRestTimerMinimized(false);
        router.push("/workout-player");
      }}
    >
      {/* Mini ring */}
      <View style={{ width: RING_SIZE, height: RING_SIZE }}>
        <Svg width={RING_SIZE} height={RING_SIZE}>
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={accent}
            strokeWidth={1.5}
            opacity={0.3}
          />
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={accent}
            strokeWidth={STROKE_W}
            strokeLinecap="round"
            strokeDasharray={`${CIRCUMFERENCE}`}
            strokeDashoffset={dashOffset}
            rotation={-90}
            origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
          />
        </Svg>
        <View style={styles.ringCenter}>
          <Ionicons name="timer-outline" size={16} color={accent} />
        </View>
      </View>

      {/* Timer text */}
      <Text style={[styles.timerText, { color: theme.foreground.white }]}>
        {`${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`}
      </Text>

      {/* Skip button */}
      <TouchableOpacity
        style={[styles.skipBtn, { backgroundColor: theme.background.accent }]}
        onPress={(e) => {
          e.stopPropagation();
          stopPlayerRest();
        }}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="close" size={14} color={theme.foreground.gray} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 90,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  ringCenter: {
    position: "absolute",
    top: 0,
    left: 0,
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  timerText: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    letterSpacing: -0.5,
  },
  skipBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
});

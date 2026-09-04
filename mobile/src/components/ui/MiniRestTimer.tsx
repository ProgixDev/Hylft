import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Text } from "./ScaledText";
import Svg, { Circle } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { createAudioPlayer } from "expo-audio";
import { FONTS } from "../../constants/fonts";
import { useActiveWorkout } from "../../contexts/ActiveWorkoutContext";
import { useTheme } from "../../contexts/ThemeContext";

const TIMER_TICK_SOUND = require("../../../assets/timer-tick.wav");
const TIMER_DONE_SOUND = require("../../../assets/timer-done.wav");

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
  const hasTimer = !!endsAt;

  const [remaining, setRemaining] = useState(0);
  const [finished, setFinished] = useState(false);
  const prevRemaining = useRef(0);

  // Tick sound for last 10 seconds
  useEffect(() => {
    if (remaining > 0 && remaining <= 10 && remaining !== prevRemaining.current) {
      try {
        const tick = createAudioPlayer(TIMER_TICK_SOUND);
        tick.volume = 1;
        tick.play();
        setTimeout(() => { try { tick.release(); } catch {} }, 500);
      } catch {}
    }
    prevRemaining.current = remaining;
  }, [remaining]);

  useEffect(() => {
    if (!hasTimer || !endsAt) {
      setFinished(false);
      return;
    }
    let done = false;
    setRemaining(Math.max(0, Math.round((endsAt - Date.now()) / 1000)));
    const id = setInterval(() => {
      const next = Math.max(0, Math.round((endsAt - Date.now()) / 1000));
      setRemaining(next);
      if (next <= 0 && !done) {
        done = true;
        clearInterval(id);
        setFinished(true);
        try {
          const player = createAudioPlayer(TIMER_DONE_SOUND);
          player.volume = 1;
          player.play();
          setTimeout(() => { try { player.release(); } catch {} }, 2000);
        } catch {}
      }
    }, 250);
    return () => clearInterval(id);
  }, [hasTimer, endsAt]);

  if (!hasTimer) return null;
  if (!finished && remaining <= 0) return null;

  const progress = totalSeconds > 0 ? remaining / totalSeconds : 0;
  const dashOffset = CIRCUMFERENCE * (1 - progress);
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const isUrgent = remaining <= 10 && remaining > 0;
  const accent = finished ? "#34C759" : isUrgent ? "#FF6B6B" : theme.primary.main;

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: finished ? "#34C759" : theme.background.darker },
      ]}
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
            stroke={finished ? "rgba(255,255,255,0.3)" : accent}
            strokeWidth={1.5}
            opacity={0.3}
          />
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={finished ? "#fff" : accent}
            strokeWidth={STROKE_W}
            strokeLinecap="round"
            strokeDasharray={`${CIRCUMFERENCE}`}
            strokeDashoffset={finished ? 0 : dashOffset}
            rotation={-90}
            origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
          />
        </Svg>
        <View style={styles.ringCenter}>
          <Ionicons
            name={finished ? "checkmark" : "timer-outline"}
            size={16}
            color={finished ? "#fff" : accent}
          />
        </View>
      </View>

      {/* Timer text */}
      <Text style={[styles.timerText, { color: finished ? "#fff" : isUrgent ? "#FF6B6B" : theme.foreground.white }]}>
        {finished ? "GO!" : `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`}
      </Text>

      {/* Skip button */}
      <TouchableOpacity
        style={[styles.skipBtn, { backgroundColor: finished ? "rgba(255,255,255,0.2)" : theme.background.accent }]}
        onPress={(e) => {
          e.stopPropagation();
          stopPlayerRest();
        }}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="close" size={14} color={finished ? "#fff" : theme.foreground.gray} />
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

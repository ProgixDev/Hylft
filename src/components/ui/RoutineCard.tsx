import { Ionicons } from "@expo/vector-icons";
import React, { memo } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../contexts/ThemeContext";
import { Routine } from "../../data/mockData";
import {
  translateRoutineName,
  translateExerciseTerm,
} from "../../utils/exerciseTranslator";
import { FONTS } from "../../constants/fonts";

type Props = {
  routine: Routine;
  onPress?: () => void;
  onStart?: () => void;
  fullWidth?: boolean;
};

const DIFFICULTY_ACCENT: Record<string, { color: string }> = {
  beginner: { color: "#22C55E" },
  intermediate: { color: "#B652C7" },
  advanced: { color: "#EF4444" },
};

const RoutineCard = ({ routine, onPress, onStart, fullWidth = false }: Props) => {
  const { t } = useTranslation();
  const { theme, themeType } = useTheme();
  const translatedName = translateRoutineName(routine.name);

  const accent = DIFFICULTY_ACCENT[routine.difficulty] ?? { color: "#22C55E" };
  const isDark = themeType === "dark";

  const cardBg = isDark ? "#151719" : "#F8F9FB";
  const cardBorder = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.07)";
  const textPrimary = isDark ? "#F0E6D3" : "#0B0D0E";
  const textMuted = isDark ? "rgba(240,230,211,0.5)" : "rgba(11,13,14,0.45)";
  const statBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)";
  const divider = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";

  const shadow = Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOpacity: isDark ? 0.35 : 0.1,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 6 },
    },
    android: { elevation: isDark ? 6 : 3 },
    default: {},
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.88}
      style={[
        styles.card,
        { backgroundColor: cardBg, borderColor: cardBorder },
        fullWidth ? styles.cardFull : styles.cardFixed,
        shadow,
      ]}
    >
      {/* Left accent stripe */}
      <View style={[styles.accentStripe, { backgroundColor: accent.color }]} />

      <View style={styles.inner}>
        {/* Top row: name + times completed */}
        <View style={styles.topRow}>
          <Text style={[styles.name, { color: textPrimary }]} numberOfLines={1}>
            {translatedName}
          </Text>
          {routine.timesCompleted > 0 && (
            <View style={styles.completedPill}>
              <Ionicons name="checkmark-circle" size={12} color={textMuted} />
              <Text style={[styles.completedText, { color: textMuted }]}>
                {routine.timesCompleted}×
              </Text>
            </View>
          )}
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={[styles.statChip, { backgroundColor: statBg }]}>
            <Ionicons name="barbell-outline" size={13} color={accent.color} />
            <Text style={[styles.statText, { color: textPrimary }]}>
              {routine.exercises.length}{" "}
              <Text style={{ color: textMuted, fontFamily: FONTS.regular }}>
                {t("routines.exercises")}
              </Text>
            </Text>
          </View>
          <View style={[styles.statChip, { backgroundColor: statBg }]}>
            <Ionicons name="time-outline" size={13} color={accent.color} />
            <Text style={[styles.statText, { color: textPrimary }]}>
              {routine.estimatedDuration}
              <Text style={{ color: textMuted, fontFamily: FONTS.regular }}> min</Text>
            </Text>
          </View>
        </View>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: divider }]} />

        {/* Bottom row: muscles + start button */}
        <View style={styles.bottomRow}>
          <View style={styles.musclesRow}>
            {routine.targetMuscles.slice(0, 2).map((m, i) => (
              <Text key={i} style={[styles.muscle, { color: textMuted }]}>
                {i > 0 ? " · " : ""}
                {translateExerciseTerm(m, "targetMuscles")}
              </Text>
            ))}
            {routine.targetMuscles.length > 2 && (
              <Text style={[styles.muscle, { color: textMuted }]}>
                {" "}+{routine.targetMuscles.length - 2}
              </Text>
            )}
          </View>

          <Pressable
            onPress={onStart}
            accessibilityLabel={t("routines.startRoutine")}
            style={({ pressed }) => [
              styles.startBtn,
              { backgroundColor: accent.color, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Ionicons name="play" size={12} color="#fff" />
            <Text style={styles.startBtnText}>START</Text>
          </Pressable>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
    flexDirection: "row",
  },
  cardFixed: {
    width: 280,
    marginRight: 12,
  },
  cardFull: {
    width: "100%",
  },
  accentStripe: {
    width: 4,
  },
  inner: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 6,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  completedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    flexShrink: 0,
  },
  completedText: {
    fontFamily: FONTS.medium,
    fontSize: 11,
  },
  name: {
    fontFamily: FONTS.extraBold,
    fontSize: 16,
    letterSpacing: -0.2,
    flex: 1,
  },
  statsRow: {
    flexDirection: "row",
    gap: 6,
  },
  statChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statText: {
    fontFamily: FONTS.bold,
    fontSize: 12,
  },
  divider: {
    height: 1,
    marginVertical: 0,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  musclesRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    flexWrap: "nowrap",
  },
  muscle: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    textTransform: "capitalize",
  },
  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  startBtnText: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    color: "#fff",
    letterSpacing: 0.5,
  },
});

export default memo(RoutineCard);

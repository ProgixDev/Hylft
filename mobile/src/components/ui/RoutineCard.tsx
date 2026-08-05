import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
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
  compact?: boolean;
};

const NAVY = "#0A1628";
const NAVY_LIGHT = "#1A2F50";

const RoutineCard = ({
  routine,
  onPress,
  onStart,
  fullWidth = false,
  compact = false,
}: Props) => {
  const { t } = useTranslation();
  const { themeType } = useTheme();
  const translatedName = translateRoutineName(routine.name);

  const accent = NAVY;
  const isDark = themeType === "dark";

  const surfaceGradient: [string, string] = isDark
    ? ["#1A1D20", "#0D0F11"]
    : ["#FFFFFF", "#EDEFF2"];
  const cardBorder = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)";
  const textPrimary = isDark ? "#F0E6D3" : "#0B0D0E";
  const textMuted = isDark ? "rgba(240,230,211,0.55)" : "rgba(11,13,14,0.5)";
  const textDim = isDark ? "rgba(240,230,211,0.38)" : "rgba(11,13,14,0.4)";
  const statBg = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.035)";
  const statBorder = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const divider = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";

  const shadow = Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOpacity: isDark ? 0.4 : 0.12,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 8 },
    },
    android: { elevation: isDark ? 7 : 4 },
    default: {},
  });

  const muscles = routine.targetMuscles
    .slice(0, 2)
    .map((m) => translateExerciseTerm(m, "targetMuscles"))
    .join(" · ");
  const muscleExtra =
    routine.targetMuscles.length > 2
      ? ` +${routine.targetMuscles.length - 2}`
      : "";

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={[
        styles.card,
        { borderColor: cardBorder },
        fullWidth ? styles.cardFull : styles.cardFixed,
        shadow,
      ]}
    >
      <LinearGradient
        colors={surfaceGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.surface}
      >
        <View style={styles.body}>
          {/* Top row: routine name + completed count */}
          <View style={styles.topRow}>
            <Text
              style={[styles.name, { color: textPrimary }]}
              numberOfLines={1}
            >
              {translatedName}
            </Text>

            {routine.timesCompleted > 0 && (
              <View style={styles.completedPill}>
                <Ionicons
                  name="repeat"
                  size={11}
                  color={textMuted}
                />
                <Text style={[styles.completedText, { color: textMuted }]}>
                  ×{routine.timesCompleted}
                </Text>
              </View>
            )}
          </View>

          {/* Stats: boxed metrics — horizontal grid (list) or vertical stack (compact) */}
          <View
            style={[
              compact ? styles.statsStack : styles.statsGrid,
              { backgroundColor: statBg, borderColor: statBorder },
            ]}
          >
            <View style={compact ? styles.statRow : styles.statCell}>
              <Ionicons name="barbell" size={14} color={accent} />
              <Text style={[styles.statValue, { color: textPrimary }]}>
                {routine.exercises.length}
              </Text>
              <Text style={[styles.statLabel, { color: textDim }]}>
                {t("routines.exercises").toUpperCase()}
              </Text>
            </View>
            <View
              style={
                compact
                  ? [styles.statRowDivider, { backgroundColor: divider }]
                  : [styles.statDivider, { backgroundColor: divider }]
              }
            />
            <View style={compact ? styles.statRow : styles.statCell}>
              <Ionicons name="time" size={14} color={accent} />
              <Text style={[styles.statValue, { color: textPrimary }]}>
                {routine.estimatedDuration}
              </Text>
              <Text style={[styles.statLabel, { color: textDim }]}>MIN</Text>
            </View>
            <View
              style={
                compact
                  ? [styles.statRowDivider, { backgroundColor: divider }]
                  : [styles.statDivider, { backgroundColor: divider }]
              }
            />
            <View style={compact ? styles.statRow : styles.statCell}>
              <Ionicons name="layers" size={14} color={accent} />
              <Text style={[styles.statValue, { color: textPrimary }]}>
                {routine.targetMuscles.length}
              </Text>
              <Text style={[styles.statLabel, { color: textDim }]}>
                ZONES
              </Text>
            </View>
          </View>

          {/* Bottom: muscles + START button */}
          <View style={styles.bottomRow}>
            <View style={styles.musclesWrap}>
              <Ionicons
                name="body-outline"
                size={12}
                color={textMuted}
                style={{ marginRight: 4 }}
              />
              <Text
                style={[styles.muscles, { color: textMuted }]}
                numberOfLines={1}
              >
                {muscles}
                {muscleExtra}
              </Text>
            </View>

            <Pressable
              onPress={onStart}
              accessibilityLabel={t("routines.startRoutine")}
              style={({ pressed }) => [
                styles.startBtn,
                pressed && { opacity: 0.82, transform: [{ scale: 0.94 }] },
              ]}
            >
              <LinearGradient
                colors={[NAVY_LIGHT, NAVY]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.startBtnInner}
              >
                <Ionicons
                  name="play"
                  size={16}
                  color="#fff"
                  style={{ marginLeft: 2 }}
                />
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  cardFixed: {
    width: 280,
    marginRight: 12,
  },
  cardFull: {
    width: "100%",
  },
  surface: {
    flexDirection: "row",
  },
  body: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
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
  },
  completedText: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    letterSpacing: 0.4,
  },
  name: {
    fontFamily: FONTS.extraBold,
    fontSize: 17,
    letterSpacing: -0.2,
    textTransform: "uppercase",
    flex: 1,
  },
  statsGrid: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  statsStack: {
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    gap: 6,
  },
  statCell: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statRowDivider: {
    height: 1,
    width: "100%",
  },
  statValue: {
    fontFamily: FONTS.extraBold,
    fontSize: 14,
    letterSpacing: -0.2,
  },
  statLabel: {
    fontFamily: FONTS.bold,
    fontSize: 9,
    letterSpacing: 1,
  },
  statDivider: {
    width: 1,
    height: 22,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  musclesWrap: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    flexWrap: "nowrap",
  },
  muscles: {
    fontFamily: FONTS.semiBold,
    fontSize: 11,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    flexShrink: 1,
  },
  startBtn: {
    borderRadius: 999,
    overflow: "hidden",
  },
  startBtnInner: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default memo(RoutineCard);

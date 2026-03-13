import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Theme } from "../../constants/themes";
import { useActiveWorkout } from "../../contexts/ActiveWorkoutContext";
import { useTheme } from "../../contexts/ThemeContext";
import { getRoutineById } from "../../data/mockData";
import { formatDisplayDate } from "../../utils/dateFormatter";
import {
  translateApiData,
  translateExerciseName,
  translateExerciseTerm,
  translateRoutineDescription,
  translateRoutineName,
} from "../../utils/exerciseTranslator";

import { FONTS } from "../../constants/fonts";

const DIFFICULTY_COLORS = {
  beginner: { bg: "rgba(34, 197, 94, 0.15)", text: "#22c55e" },
  intermediate: { bg: "rgba(245, 158, 11, 0.15)", text: "#f59e0b" },
  advanced: { bg: "rgba(239, 68, 68, 0.15)", text: "#ef4444" },
};

const REST_LABEL = (seconds: number) => {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s === 0 ? `${m}m` : `${m}m ${s}s`;
};

const surfaceShadow = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
  },
  android: { elevation: 8 },
});

const controlShadow = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
  },
  android: { elevation: 4 },
});

export default function RoutineDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useTheme();
  const { t, i18n } = useTranslation();
  const styles = createStyles(theme);
  const router = useRouter();
  const { startWorkout } = useActiveWorkout();

  const routine = useMemo(() => getRoutineById(id), [id]);

  if (!routine) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Ionicons
          name="alert-circle-outline"
          size={48}
          color={theme.foreground.gray}
        />
        <Text style={styles.notFoundText}>{t("routines.routineNotFound")}</Text>
        <Pressable
          style={({ pressed }) => [
            styles.backFallback,
            pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] },
          ]}
          onPress={() => router.back()}
        >
          <Text style={styles.backFallbackText}>{t("routines.goBack")}</Text>
        </Pressable>
      </View>
    );
  }

  const difficultyColor =
    DIFFICULTY_COLORS[routine.difficulty] ?? DIFFICULTY_COLORS.intermediate;

  const totalSets = routine.exercises.reduce((sum, ex) => sum + ex.sets, 0);

  const handleStartRoutine = () => {
    startWorkout({
      id: `workout-${Date.now()}`,
      duration: 0,
      volume: 0,
      sets: 0,
      exercises: [],
    });
    router.back();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header]}>
        <Pressable
          style={({ pressed }) => [
            styles.backButton,
            pressed && { opacity: 0.7, transform: [{ scale: 0.93 }] },
          ]}
          onPress={() => router.back()}
        >
          <Ionicons
            name="chevron-back"
            size={22}
            color={theme.foreground.white}
          />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {translateRoutineName(routine.name)}
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroGlow} pointerEvents="none" />
          {/* Title Row */}
          <View style={styles.heroTitleRow}>
            <Text style={styles.heroName}>
              {translateRoutineName(routine.name)}
            </Text>
            <View
              style={[
                styles.difficultyBadge,
                { backgroundColor: difficultyColor.bg },
              ]}
            >
              <Text
                style={[styles.difficultyText, { color: difficultyColor.text }]}
              >
                {translateApiData(routine.difficulty)}
              </Text>
            </View>
          </View>

          {/* Description */}
          <Text style={styles.heroDescription}>
            {translateRoutineDescription(routine.description)}
          </Text>

          <View style={styles.heroDivider} />

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{routine.estimatedDuration}m</Text>
              <Text style={styles.statLabel}>{t("routines.duration")}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{routine.exercises.length}</Text>
              <Text style={styles.statLabel}>{t("routines.exercises")}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalSets}</Text>
              <Text style={styles.statLabel}>{t("createRoutine.sets")}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{routine.timesCompleted}</Text>
              <Text style={styles.statLabel}>{t("profile.done")}</Text>
            </View>
          </View>

          {/* Last used */}
          {routine.lastUsed && (
            <View style={styles.lastUsedRow}>
              <Ionicons
                name="time-outline"
                size={14}
                color={theme.foreground.gray}
              />
              <Text style={styles.lastUsedText}>
                {t("routines.lastUsed")}{" "}
                {formatDisplayDate(routine.lastUsed, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </Text>
            </View>
          )}
        </View>

        {/* Target Muscles */}
        <View>
          <Text style={styles.sectionTitle}>{t("routines.targetMuscles")}</Text>
          <View style={styles.musclesContainer}>
            {routine.targetMuscles.map((muscle, i) => (
              <View key={i} style={styles.muscleTag}>
                <Text style={styles.muscleTagText}>
                  {translateExerciseTerm(muscle, "targetMuscles")}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Exercise List */}
        <Text style={styles.sectionTitle}>{t("routines.exercises")}</Text>

        {routine.exercises.map((exercise, index) => (
          <View key={exercise.id} style={styles.exerciseCard}>
            {/* Number + Name */}
            <View style={styles.exerciseHeader}>
              <View style={styles.exerciseIndexBadge}>
                <Text style={styles.exerciseIndex}>{index + 1}</Text>
              </View>
              <Text style={styles.exerciseName}>
                {translateExerciseName(exercise.name)}
              </Text>
            </View>

            <View style={styles.exerciseDivider} />

            {/* Sets / Reps / Rest */}
            <View style={styles.exerciseMetaRow}>
              <View style={styles.exerciseMeta}>
                <Text style={styles.exerciseMetaValue}>{exercise.sets}</Text>
                <Text style={styles.exerciseMetaLabel}>
                  {t("createRoutine.sets")}
                </Text>
              </View>
              <View style={styles.exerciseMetaDivider} />
              <View style={styles.exerciseMeta}>
                <Text style={styles.exerciseMetaValue}>{exercise.reps}</Text>
                <Text style={styles.exerciseMetaLabel}>
                  {t("createRoutine.reps")}
                </Text>
              </View>
              <View style={styles.exerciseMetaDivider} />
              <View style={styles.exerciseMeta}>
                <Text style={styles.exerciseMetaValue}>
                  {REST_LABEL(exercise.restTime)}
                </Text>
                <Text style={styles.exerciseMetaLabel}>
                  {t("createRoutine.rest")}
                </Text>
              </View>
            </View>

            {/* Per-set preview strip */}
            <View style={styles.setPreviewRow}>
              {Array.from({ length: exercise.sets }).map((_, si) => (
                <View key={si} style={styles.setPreviewChip}>
                  <Text style={styles.setPreviewLabel}>
                    {t("createRoutine.sets")} {si + 1}
                  </Text>
                  <Text style={styles.setPreviewValue}>
                    {exercise.reps} {t("createRoutine.reps")}
                  </Text>
                </View>
              ))}
            </View>

            {/* Notes */}
            {exercise.notes && (
              <View style={styles.notesContainer}>
                <Ionicons
                  name="bulb-outline"
                  size={14}
                  color={theme.primary.main}
                />
                <Text style={styles.notesText}>
                  {translateApiData(exercise.notes)}
                </Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Sticky Start Button */}
      <View style={[styles.stickyBar]}>
        <Pressable
          style={({ pressed }) => [
            styles.startButton,
            pressed && { opacity: 0.88, transform: [{ scale: 0.98 }] },
          ]}
          onPress={handleStartRoutine}
        >
          <Ionicons name="play" size={18} color={theme.background.dark} />
          <Text style={styles.startButtonText}>
            {t("routines.startRoutine")}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background.dark,
    },
    centered: {
      justifyContent: "center",
      alignItems: "center",
    },
    notFoundText: {
      color: theme.foreground.gray,
      fontSize: 16,
      marginTop: 16,
    },
    backFallback: {
      marginTop: 16,
      paddingVertical: 12,
      paddingHorizontal: 28,
      backgroundColor: theme.primary.main,
      borderRadius: 22,
      ...controlShadow,
    },
    backFallbackText: {
      color: theme.background.dark,
      fontFamily: FONTS.bold,
      fontSize: 15,
    },
    // Header
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingBottom: 12,
    },
    backButton: {
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.background.darker,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(255,255,255,0.10)",
      ...controlShadow,
    },
    headerTitle: {
      fontSize: 17,
      fontFamily: FONTS.bold,
      color: theme.foreground.white,
      flex: 1,
      textAlign: "center",
    },
    // Content
    content: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 120,
      gap: 16,
    },
    // Hero Card
    heroCard: {
      backgroundColor: theme.background.darker,
      borderRadius: 24,
      padding: 20,
      overflow: "hidden",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(255,255,255,0.07)",
      ...surfaceShadow,
    },
    heroGlow: {
      position: "absolute",
      top: -40,
      right: -30,
      width: 160,
      height: 160,
      borderRadius: 80,
      backgroundColor: theme.primary.main + "12",
    },
    heroTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 8,
    },
    heroName: {
      fontSize: 22,
      fontFamily: FONTS.extraBold,
      color: theme.foreground.white,
      flex: 1,
    },
    difficultyBadge: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 20,
    },
    difficultyText: {
      fontSize: 11,
      fontFamily: FONTS.bold,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    heroDescription: {
      fontSize: 14,
      color: theme.foreground.gray,
      lineHeight: 21,
      marginBottom: 16,
    },
    heroDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: "rgba(255,255,255,0.08)",
      marginBottom: 16,
    },
    statsRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    statItem: {
      flex: 1,
      alignItems: "center",
    },
    statValue: {
      color: theme.foreground.white,
      fontSize: 18,
      fontFamily: FONTS.bold,
    },
    statLabel: {
      color: theme.foreground.gray,
      fontSize: 11,
      marginTop: 2,
    },
    statDivider: {
      width: StyleSheet.hairlineWidth,
      height: 28,
      backgroundColor: "rgba(255,255,255,0.10)",
    },
    lastUsedRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      marginTop: 14,
    },
    lastUsedText: {
      color: theme.foreground.gray,
      fontSize: 12,
    },
    // Section Title
    sectionTitle: {
      fontSize: 18,
      fontFamily: FONTS.bold,
      color: theme.foreground.white,
    },
    // Muscles
    musclesContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginTop: 8,
    },
    muscleTag: {
      backgroundColor: theme.background.darker,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: theme.primary.main + "30",
    },
    muscleTagText: {
      color: theme.primary.main,
      fontSize: 13,
      fontFamily: FONTS.semiBold,
      textTransform: "capitalize",
    },
    // Exercise Cards
    exerciseCard: {
      backgroundColor: theme.background.darker,
      borderRadius: 20,
      padding: 18,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(255,255,255,0.07)",
      ...surfaceShadow,
    },
    exerciseHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginBottom: 12,
    },
    exerciseIndexBadge: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: theme.primary.main + "20",
      alignItems: "center",
      justifyContent: "center",
    },
    exerciseIndex: {
      color: theme.primary.main,
      fontSize: 13,
      fontFamily: FONTS.bold,
    },
    exerciseName: {
      color: theme.foreground.white,
      fontSize: 16,
      fontFamily: FONTS.bold,
      flex: 1,
    },
    exerciseDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: "rgba(255,255,255,0.08)",
      marginBottom: 12,
    },
    exerciseMetaRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 14,
    },
    exerciseMeta: {
      flex: 1,
      alignItems: "center",
    },
    exerciseMetaValue: {
      color: theme.foreground.white,
      fontSize: 18,
      fontFamily: FONTS.bold,
    },
    exerciseMetaLabel: {
      color: theme.foreground.gray,
      fontSize: 11,
      marginTop: 2,
    },
    exerciseMetaDivider: {
      width: StyleSheet.hairlineWidth,
      height: 28,
      backgroundColor: "rgba(255,255,255,0.10)",
    },
    // Set Preview
    setPreviewRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
    },
    setPreviewChip: {
      backgroundColor: theme.background.dark,
      paddingVertical: 7,
      paddingHorizontal: 12,
      borderRadius: 10,
      alignItems: "center",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(255,255,255,0.07)",
    },
    setPreviewLabel: {
      color: theme.foreground.gray,
      fontSize: 10,
      marginBottom: 2,
    },
    setPreviewValue: {
      color: theme.foreground.white,
      fontSize: 12,
      fontFamily: FONTS.semiBold,
    },
    // Exercise Notes
    notesContainer: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 8,
      marginTop: 12,
      backgroundColor: theme.primary.main + "10",
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.primary.main + "20",
    },
    notesText: {
      color: theme.foreground.gray,
      fontSize: 13,
      flex: 1,
      lineHeight: 18,
    },
    // Sticky Bar
    stickyBar: {
      paddingHorizontal: 20,
      paddingTop: 14,
      backgroundColor: theme.background.dark,
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
        },
        android: { elevation: 8 },
      }),
    },
    startButton: {
      backgroundColor: theme.primary.main,
      borderRadius: 26,
      paddingVertical: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    startButtonText: {
      color: theme.background.dark,
      fontSize: 17,
      fontFamily: FONTS.extraBold,
    },
  });

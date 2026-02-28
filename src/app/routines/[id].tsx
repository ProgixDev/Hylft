import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Theme } from "../../constants/themes";
import { useActiveWorkout } from "../../contexts/ActiveWorkoutContext";
import { useTheme } from "../../contexts/ThemeContext";
import { formatDisplayDate } from "../../utils/dateFormatter";
import { getRoutineById } from "../../data/mockData";
import { translateRoutineName } from "../../utils/exerciseTranslator";

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
        <TouchableOpacity
          style={styles.backFallback}
          onPress={() => router.back()}
        >
          <Text style={styles.backFallbackText}>{t("routines.goBack")}</Text>
        </TouchableOpacity>
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
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={theme.foreground.white}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {i18n.language === "fr" ? translateRoutineName(routine.name) : routine.name}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Card */}
        <View style={styles.heroCard}>
          {/* Title Row */}
          <View style={styles.heroTitleRow}>
            <Text style={styles.heroName}>
              {i18n.language === "fr" ? translateRoutineName(routine.name) : routine.name}
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
                {routine.difficulty}
              </Text>
            </View>
          </View>

          {/* Description */}
          <Text style={styles.heroDescription}>{routine.description}</Text>

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
                {formatDisplayDate(routine.lastUsed, { month: "short", day: "numeric", year: "numeric" })}
              </Text>
            </View>
          )}
        </View>

        {/* Target Muscles */}
        <View>
          <Text style={styles.sectionTitle}>Target Muscles</Text>
          <View style={styles.musclesContainer}>
            {routine.targetMuscles.map((muscle, i) => (
              <View key={i} style={styles.muscleTag}>
                <Text style={styles.muscleTagText}>{muscle}</Text>
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
              <Text style={styles.exerciseName}>{exercise.name}</Text>
            </View>

            <View style={styles.exerciseDivider} />

            {/* Sets / Reps / Rest */}
            <View style={styles.exerciseMetaRow}>
              <View style={styles.exerciseMeta}>
                <Text style={styles.exerciseMetaValue}>{exercise.sets}</Text>
                <Text style={styles.exerciseMetaLabel}>Sets</Text>
              </View>
              <View style={styles.exerciseMetaDivider} />
              <View style={styles.exerciseMeta}>
                <Text style={styles.exerciseMetaValue}>{exercise.reps}</Text>
                <Text style={styles.exerciseMetaLabel}>Reps</Text>
              </View>
              <View style={styles.exerciseMetaDivider} />
              <View style={styles.exerciseMeta}>
                <Text style={styles.exerciseMetaValue}>
                  {REST_LABEL(exercise.restTime)}
                </Text>
                <Text style={styles.exerciseMetaLabel}>Rest</Text>
              </View>
            </View>

            {/* Per-set preview strip */}
            <View style={styles.setPreviewRow}>
              {Array.from({ length: exercise.sets }).map((_, si) => (
                <View key={si} style={styles.setPreviewChip}>
                  <Text style={styles.setPreviewLabel}>Set {si + 1}</Text>
                  <Text style={styles.setPreviewValue}>
                    {exercise.reps} reps
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
                <Text style={styles.notesText}>{exercise.notes}</Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Sticky Start Button */}
      <View style={styles.stickyBar}>
        <TouchableOpacity
          style={styles.startButton}
          onPress={handleStartRoutine}
          activeOpacity={0.85}
        >
          <Ionicons name="play" size={18} color={theme.background.dark} />
          <Text style={styles.startButtonText}>{t("routines.startRoutine")}</Text>
        </TouchableOpacity>
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
      marginTop: 12,
      paddingVertical: 10,
      paddingHorizontal: 24,
      backgroundColor: theme.primary.main,
      borderRadius: 10,
    },
    backFallbackText: {
      color: theme.background.dark,
      fontWeight: "700",
      fontSize: 14,
    },
    // Header
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.background.darker,
    },
    backButton: {
      padding: 8,
      marginLeft: -8,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.foreground.white,
      flex: 1,
      textAlign: "center",
    },
    // Content
    content: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 100, // space for sticky bar
      gap: 16,
    },
    // Hero Card
    heroCard: {
      backgroundColor: theme.background.darker,
      borderRadius: 18,
      padding: 18,
    },
    heroTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 8,
    },
    heroName: {
      fontSize: 22,
      fontWeight: "800",
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
      fontWeight: "700",
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
      height: 1,
      backgroundColor: theme.background.dark,
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
      fontWeight: "700",
    },
    statLabel: {
      color: theme.foreground.gray,
      fontSize: 11,
      marginTop: 2,
    },
    statDivider: {
      width: 1,
      height: 28,
      backgroundColor: theme.background.dark,
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
      fontWeight: "700",
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
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 20,
    },
    muscleTagText: {
      color: theme.primary.main,
      fontSize: 13,
      fontWeight: "600",
      textTransform: "capitalize",
    },
    // Exercise Cards
    exerciseCard: {
      backgroundColor: theme.background.darker,
      borderRadius: 16,
      padding: 16,
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
      fontWeight: "700",
    },
    exerciseName: {
      color: theme.foreground.white,
      fontSize: 16,
      fontWeight: "700",
      flex: 1,
    },
    exerciseDivider: {
      height: 1,
      backgroundColor: theme.background.dark,
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
      fontWeight: "700",
    },
    exerciseMetaLabel: {
      color: theme.foreground.gray,
      fontSize: 11,
      marginTop: 2,
    },
    exerciseMetaDivider: {
      width: 1,
      height: 28,
      backgroundColor: theme.background.dark,
    },
    // Set Preview
    setPreviewRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
    },
    setPreviewChip: {
      backgroundColor: theme.background.dark,
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: 8,
      alignItems: "center",
    },
    setPreviewLabel: {
      color: theme.foreground.gray,
      fontSize: 10,
      marginBottom: 2,
    },
    setPreviewValue: {
      color: theme.foreground.white,
      fontSize: 12,
      fontWeight: "600",
    },
    // Exercise Notes
    notesContainer: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 7,
      marginTop: 10,
      backgroundColor: theme.background.dark,
      padding: 10,
      borderRadius: 8,
    },
    notesText: {
      color: theme.foreground.gray,
      fontSize: 13,
      flex: 1,
      lineHeight: 18,
    },
    // Sticky Bar
    stickyBar: {
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderTopWidth: 1,
      borderTopColor: theme.background.darker,
      backgroundColor: theme.background.dark,
    },
    startButton: {
      backgroundColor: theme.primary.main,
      borderRadius: 14,
      paddingVertical: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    startButtonText: {
      color: theme.background.dark,
      fontSize: 16,
      fontWeight: "800",
    },
  });

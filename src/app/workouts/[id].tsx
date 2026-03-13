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
import { useTheme } from "../../contexts/ThemeContext";
import { formatDate } from "../../utils/dateFormatter";
import { translateExerciseName, translateApiData } from "../../utils/exerciseTranslator";
import { getWorkoutById } from "../../data/mockData";

import { FONTS } from "../../constants/fonts";

export default function WorkoutDetail() {
  const { t, i18n } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const router = useRouter();

  const workout = useMemo(() => getWorkoutById(id), [id]);

  if (!workout) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Ionicons
          name="alert-circle-outline"
          size={48}
          color={theme.foreground.gray}
        />
        <Text style={styles.notFoundText}>Workout not found</Text>
        <TouchableOpacity
          style={styles.backFallback}
          onPress={() => router.back()}
        >
          <Text style={styles.backFallbackText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const totalSets = workout.exercises.reduce((sum, ex) => sum + ex.sets, 0);

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
          {translateApiData(workout.name)}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Date & Time Strip */}
        <View style={styles.dateStrip}>
          <Ionicons
            name="calendar-outline"
            size={14}
            color={theme.foreground.gray}
          />
          <Text style={styles.dateStripText}>
            {formatDate(workout.date)}
          </Text>
          <View style={styles.timeRange}>
            <Text style={styles.timeText}>{workout.startTime}</Text>
            <Ionicons
              name="arrow-forward-outline"
              size={12}
              color={theme.foreground.gray}
            />
            <Text style={styles.timeText}>{workout.endTime}</Text>
          </View>
        </View>

        {/* Stats Hero */}
        <View style={styles.statsHero}>
          <View style={styles.statCard}>
            <Ionicons
              name="time-outline"
              size={22}
              color={theme.primary.main}
            />
            <Text style={styles.statCardValue}>{workout.duration}</Text>
            <Text style={styles.statCardLabel}>Minutes</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons
              name="barbell-outline"
              size={22}
              color={theme.primary.main}
            />
            <Text style={styles.statCardValue}>{workout.exercises.length}</Text>
            <Text style={styles.statCardLabel}>{t("routines.exercises")}</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons
              name="repeat-outline"
              size={22}
              color={theme.primary.main}
            />
            <Text style={styles.statCardValue}>{totalSets}</Text>
            <Text style={styles.statCardLabel}>{t("createRoutine.sets")}</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons
              name="flame-outline"
              size={22}
              color={theme.primary.main}
            />
            <Text style={styles.statCardValue}>{workout.caloriesBurned}</Text>
            <Text style={styles.statCardLabel}>Calories</Text>
          </View>
        </View>

        {/* Exercises */}
        <Text style={styles.sectionTitle}>{t("routines.exercises")}</Text>

        {workout.exercises.map((exercise, index) => (
          <View key={exercise.id} style={styles.exerciseCard}>
            {/* Exercise Header */}
            <View style={styles.exerciseHeader}>
              <View style={styles.exerciseIndexBadge}>
                <Text style={styles.exerciseIndex}>{index + 1}</Text>
              </View>
              <Text style={styles.exerciseName}>
                {translateExerciseName(exercise.name)}
              </Text>
            </View>

            <View style={styles.exerciseDivider} />

            {/* Exercise Stats Row */}
            <View style={styles.exerciseMetaRow}>
              <View style={styles.exerciseMeta}>
                <Text style={styles.exerciseMetaValue}>{exercise.sets}</Text>
                <Text style={styles.exerciseMetaLabel}>{t("createRoutine.sets")}</Text>
              </View>
              <View style={styles.exerciseMetaDivider} />
              <View style={styles.exerciseMeta}>
                <Text style={styles.exerciseMetaValue}>{exercise.reps}</Text>
                <Text style={styles.exerciseMetaLabel}>{t("createRoutine.reps")}</Text>
              </View>
              {exercise.weight && (
                <>
                  <View style={styles.exerciseMetaDivider} />
                  <View style={styles.exerciseMeta}>
                    <Text style={styles.exerciseMetaValue}>
                      {exercise.weight}
                    </Text>
                    <Text style={styles.exerciseMetaLabel}>{t("post.weight")}</Text>
                  </View>
                </>
              )}
              {exercise.duration && (
                <>
                  <View style={styles.exerciseMetaDivider} />
                  <View style={styles.exerciseMeta}>
                    <Text style={styles.exerciseMetaValue}>
                      {exercise.duration}
                    </Text>
                    <Text style={styles.exerciseMetaLabel}>{t("post.duration")}</Text>
                  </View>
                </>
              )}
            </View>

            {/* Sets Breakdown */}
            <View style={styles.setsBreakdown}>
              {Array.from({ length: exercise.sets }).map((_, setIdx) => (
                <View key={setIdx} style={styles.setRow}>
                  <View style={styles.setNumberBadge}>
                    <Text style={styles.setNumberText}>{setIdx + 1}</Text>
                  </View>
                  <Text style={styles.setDetail}>
                    {exercise.reps} {t("createRoutine.reps")}
                    {exercise.weight ? `  ·  ${exercise.weight}` : ""}
                  </Text>
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={theme.primary.main}
                    style={{ marginLeft: "auto" }}
                  />
                </View>
              ))}
            </View>

            {/* Notes */}
            {exercise.notes && (
              <View style={styles.exerciseNoteContainer}>
                <Ionicons
                  name="document-text-outline"
                  size={14}
                  color={theme.foreground.gray}
                />
                <Text style={styles.exerciseNote}>{translateApiData(exercise.notes)}</Text>
              </View>
            )}
          </View>
        ))}

        {/* Workout Notes */}
        {workout.notes && (
          <>
            <Text style={styles.sectionTitle}>Notes</Text>
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>{workout.notes}</Text>
            </View>
          </>
        )}
      </ScrollView>
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
      borderRadius: 22,
    },
    backFallbackText: {
      color: theme.background.dark,
      fontFamily: FONTS.bold,
      fontSize: 15,
    },
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
      fontFamily: FONTS.bold,
      color: theme.foreground.white,
      flex: 1,
      textAlign: "center",
    },
    content: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 48,
      gap: 16,
    },
    // Date Strip
    dateStrip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: theme.background.darker,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 12,
      flexWrap: "wrap",
    },
    dateStripText: {
      color: theme.foreground.white,
      fontSize: 13,
      flex: 1,
    },
    timeRange: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    timeText: {
      color: theme.foreground.gray,
      fontSize: 12,
    },
    // Stats Hero
    statsHero: {
      flexDirection: "row",
      gap: 8,
    },
    statCard: {
      flex: 1,
      backgroundColor: theme.background.darker,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: "center",
      gap: 4,
    },
    statCardValue: {
      color: theme.foreground.white,
      fontSize: 20,
      fontFamily: FONTS.bold,
    },
    statCardLabel: {
      color: theme.foreground.gray,
      fontSize: 11,
    },
    // Section
    sectionTitle: {
      fontSize: 18,
      fontFamily: FONTS.bold,
      color: theme.foreground.white,
      marginTop: 4,
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
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: theme.primary.main + "25",
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
      height: 1,
      backgroundColor: theme.background.dark,
      marginBottom: 12,
    },
    exerciseMetaRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-around",
      marginBottom: 14,
    },
    exerciseMeta: {
      alignItems: "center",
      flex: 1,
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
      width: 1,
      height: 28,
      backgroundColor: theme.background.dark,
    },
    // Sets Breakdown
    setsBreakdown: {
      gap: 6,
    },
    setRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: theme.background.dark,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
    },
    setNumberBadge: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: theme.background.darker,
      borderWidth: 1,
      borderColor: theme.primary.main + "40",
      alignItems: "center",
      justifyContent: "center",
    },
    setNumberText: {
      color: theme.foreground.gray,
      fontSize: 11,
      fontFamily: FONTS.semiBold,
    },
    setDetail: {
      color: theme.foreground.white,
      fontSize: 13,
    },
    exerciseNoteContainer: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 6,
      marginTop: 10,
      padding: 10,
      backgroundColor: theme.background.dark,
      borderRadius: 8,
    },
    exerciseNote: {
      color: theme.foreground.gray,
      fontSize: 13,
      flex: 1,
      lineHeight: 18,
    },
    // Workout Notes
    notesCard: {
      backgroundColor: theme.background.darker,
      borderRadius: 14,
      padding: 14,
    },
    notesText: {
      color: theme.foreground.white,
      fontSize: 14,
      lineHeight: 22,
    },
  });

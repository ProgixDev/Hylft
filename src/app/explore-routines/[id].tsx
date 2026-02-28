import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Alert,
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
import { addRoutine, getRoutinesByUserId } from "../../data/mockData";
import { translateRoutineName, translateRoutineCategory } from "../../utils/exerciseTranslator";
import {
    DIFFICULTY_META,
    getExploreRoutineById,
} from "../../services/exploreService";
import { buildActiveWorkoutFromRoutine } from "../../utils/workoutBuilder";

const REST_LABEL = (s: number) => {
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return rem === 0 ? `${m}m` : `${m}m ${rem}s`;
};

export default function ExploreRoutineDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useTheme();
  const { t, i18n } = useTranslation();
  const styles = createStyles(theme);
  const router = useRouter();
  const { startWorkout } = useActiveWorkout();

  const routine = getExploreRoutineById(id);

  // Check if this template has already been saved to the user's routines
  const alreadySaved = routine
    ? getRoutinesByUserId("1").some((r) => r.id === `saved-${routine.id}`)
    : false;
  const [saved, setSaved] = useState(alreadySaved);

  if (!routine) {
    return (
      <View style={[styles.container, styles.centred]}>
        <Ionicons
          name="alert-circle-outline"
          size={48}
          color={theme.foreground.gray}
        />
        <Text style={styles.notFoundText}>{t("routines.routineNotFound")}</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>{t("routines.goBack")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const diff = DIFFICULTY_META[routine.difficulty];
  const totalSets = routine.exercises.reduce((s, e) => s + e.sets, 0);

  const handleAddToMine = () => {
    if (saved) return;
    addRoutine({
      ...routine,
      id: `saved-${routine.id}`,
      userId: "1",
      timesCompleted: 0,
      lastUsed: undefined,
    });
    setSaved(true);
    const translatedName = i18n.language === "fr" ? translateRoutineName(routine.name) : routine.name;
    Alert.alert(t("routines.saved"), `"${translatedName}" ${t("routines.hasBeenAdded")}`);
  };

  const handleStart = () => {
    startWorkout(buildActiveWorkoutFromRoutine(routine));
    router.navigate("/(tabs)/workout" as any);
  };

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
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
          {t("routines.routineDetails")}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero block ── */}
        <View style={styles.heroBlock}>
          {/* Difficulty + category badges */}
          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: diff.bg }]}>
              <Text style={[styles.badgeText, { color: diff.text }]}>
                {diff.label}
              </Text>
            </View>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>
                {i18n.language === "fr" ? translateRoutineCategory(routine.category) : routine.category}
              </Text>
            </View>
          </View>

          <Text style={styles.routineName}>
            {i18n.language === "fr" ? translateRoutineName(routine.name) : routine.name}
          </Text>
          <Text style={styles.routineAuthor}>{t("routines.by")} {routine.author}</Text>
          <Text style={styles.routineDescription}>{routine.description}</Text>

          {/* Tags */}
          <View style={styles.tagsRow}>
            {routine.tags.map((tag, i) => (
              <View key={i} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Stats ── */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Ionicons
              name="barbell-outline"
              size={20}
              color={theme.primary.main}
            />
            <Text style={styles.statValue}>{routine.exercises.length}</Text>
            <Text style={styles.statLabel}>Exercises</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons
              name="time-outline"
              size={20}
              color={theme.primary.main}
            />
            <Text style={styles.statValue}>{routine.estimatedDuration}m</Text>
            <Text style={styles.statLabel}>Duration</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons
              name="layers-outline"
              size={20}
              color={theme.primary.main}
            />
            <Text style={styles.statValue}>{totalSets}</Text>
            <Text style={styles.statLabel}>{t("schedule.totalSets")}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons
              name="calendar-outline"
              size={20}
              color={theme.primary.main}
            />
            <Text style={styles.statValue}>{routine.daysPerWeek}×</Text>
            <Text style={styles.statLabel}>{t("routines.perWeek")}</Text>
          </View>
        </View>

        {/* ── Target muscles ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Target Muscles</Text>
          <View style={styles.musclesRow}>
            {routine.targetMuscles.map((m, i) => (
              <View key={i} style={styles.muscleTag}>
                <Text style={styles.muscleTagText}>{m}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Exercises ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("routines.exercises")}</Text>
          <View style={styles.exercisesList}>
            {routine.exercises.map((ex, idx) => (
              <View key={ex.id} style={styles.exerciseRow}>
                <View style={styles.exerciseIndex}>
                  <Text style={styles.exerciseIndexText}>{idx + 1}</Text>
                </View>
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseName}>{ex.name}</Text>
                  <Text style={styles.exerciseMeta}>
                    {ex.sets} {t("createRoutine.sets")} × {ex.reps} {t("createRoutine.reps")}
                    {ex.notes ? `  ·  ${ex.notes}` : ""}
                  </Text>
                </View>
                <View style={styles.exerciseRest}>
                  <Ionicons
                    name="timer-outline"
                    size={13}
                    color={theme.foreground.gray}
                  />
                  <Text style={styles.exerciseRestText}>
                    {REST_LABEL(ex.restTime)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ── Spacer for CTAs ── */}
        <View style={{ height: 24 }} />
      </ScrollView>

      {/* ── Sticky CTA bar ── */}
      <View style={styles.ctaBar}>
        <TouchableOpacity
          style={[
            styles.ctaButton,
            styles.ctaSecondary,
            saved && styles.ctaSaved,
          ]}
          onPress={handleAddToMine}
          disabled={saved}
        >
          <Ionicons
            name={saved ? "checkmark-circle" : "bookmark-outline"}
            size={18}
            color={saved ? theme.primary.main : theme.foreground.white}
          />
          <Text
            style={[
              styles.ctaSecondaryText,
              saved && { color: theme.primary.main },
            ]}
          >
            {saved ? "Saved" : "Add to Mine"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.ctaButton, styles.ctaPrimary]}
          onPress={handleStart}
        >
          <Ionicons name="play" size={18} color={theme.background.dark} />
          <Text style={styles.ctaPrimaryText}>Start Now</Text>
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
    centred: {
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
    },
    notFoundText: {
      fontSize: 16,
      color: theme.foreground.gray,
    },
    backLink: {
      color: theme.primary.main,
      fontWeight: "700",
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
    // Scroll
    scroll: { flex: 1 },
    scrollContent: { paddingBottom: 16 },
    // Hero
    heroBlock: {
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.background.darker,
    },
    badgeRow: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 12,
    },
    badge: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 20,
    },
    badgeText: {
      fontSize: 11,
      fontWeight: "700",
      textTransform: "uppercase",
    },
    categoryBadge: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 20,
      backgroundColor: theme.primary.main + "20",
      borderWidth: 1,
      borderColor: theme.primary.main + "50",
    },
    categoryBadgeText: {
      fontSize: 11,
      fontWeight: "700",
      color: theme.primary.main,
    },
    routineName: {
      fontSize: 26,
      fontWeight: "800",
      color: theme.foreground.white,
      marginBottom: 4,
      lineHeight: 32,
    },
    routineAuthor: {
      fontSize: 13,
      color: theme.foreground.gray,
      marginBottom: 10,
    },
    routineDescription: {
      fontSize: 14,
      color: theme.foreground.gray,
      lineHeight: 22,
      marginBottom: 14,
    },
    tagsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    tag: {
      backgroundColor: theme.background.darker,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 8,
    },
    tagText: {
      fontSize: 11,
      fontWeight: "600",
      color: theme.foreground.gray,
    },
    // Stats card
    statsCard: {
      flexDirection: "row",
      backgroundColor: theme.background.darker,
      marginHorizontal: 16,
      marginTop: 16,
      borderRadius: 16,
      paddingVertical: 16,
      paddingHorizontal: 8,
      borderWidth: 1,
      borderColor: theme.background.accent,
    },
    statItem: {
      flex: 1,
      alignItems: "center",
      gap: 4,
    },
    statDivider: {
      width: 1,
      backgroundColor: theme.background.accent,
      marginVertical: 4,
    },
    statValue: {
      fontSize: 17,
      fontWeight: "700",
      color: theme.foreground.white,
    },
    statLabel: {
      fontSize: 11,
      color: theme.foreground.gray,
    },
    // Sections
    section: {
      paddingHorizontal: 20,
      paddingTop: 24,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.foreground.white,
      marginBottom: 12,
    },
    // Muscles
    musclesRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    muscleTag: {
      backgroundColor: theme.primary.main + "18",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.primary.main + "40",
    },
    muscleTagText: {
      fontSize: 12,
      fontWeight: "600",
      color: theme.primary.main,
    },
    // Exercises list
    exercisesList: {
      gap: 10,
    },
    exerciseRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.background.darker,
      borderRadius: 12,
      padding: 14,
      gap: 12,
    },
    exerciseIndex: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: theme.background.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    exerciseIndexText: {
      fontSize: 12,
      fontWeight: "700",
      color: theme.foreground.gray,
    },
    exerciseInfo: {
      flex: 1,
    },
    exerciseName: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.foreground.white,
      marginBottom: 2,
    },
    exerciseMeta: {
      fontSize: 12,
      color: theme.foreground.gray,
    },
    exerciseRest: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
    },
    exerciseRestText: {
      fontSize: 11,
      color: theme.foreground.gray,
    },
    // CTA bar
    ctaBar: {
      flexDirection: "row",
      paddingHorizontal: 16,
      paddingVertical: 16,
      paddingBottom: 24,
      gap: 12,
      borderTopWidth: 1,
      borderTopColor: theme.background.darker,
      backgroundColor: theme.background.dark,
    },
    ctaButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 12,
      paddingVertical: 14,
      gap: 8,
    },
    ctaSecondary: {
      backgroundColor: theme.background.darker,
      borderWidth: 1,
      borderColor: theme.background.accent,
    },
    ctaSaved: {
      borderColor: theme.primary.main + "50",
      backgroundColor: theme.primary.main + "12",
    },
    ctaSecondaryText: {
      fontSize: 14,
      fontWeight: "700",
      color: theme.foreground.white,
    },
    ctaPrimary: {
      backgroundColor: theme.primary.main,
    },
    ctaPrimaryText: {
      fontSize: 14,
      fontWeight: "700",
      color: theme.background.dark,
    },
  });

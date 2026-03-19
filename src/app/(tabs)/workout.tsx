import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import RoutineCard from "../../components/ui/RoutineCard";
import WorkoutCard from "../../components/ui/WorkoutCard";
import { Theme } from "../../constants/themes";
import { useActiveWorkout } from "../../contexts/ActiveWorkoutContext";
import { useCreateRoutine } from "../../contexts/CreateRoutineContext";
import { useTheme } from "../../contexts/ThemeContext";
import {
  getRoutinesByUserId,
  getWorkoutsByUserId,
  Routine,
  Workout as WorkoutData,
} from "../../data/mockData";

import { FONTS } from "../../constants/fonts";

const surfaceShadow = Platform.select({
  ios: {
    shadowColor: "#000000",
    shadowOpacity: 0.2,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  android: { elevation: 8 },
  default: {},
});

const controlShadow = Platform.select({
  ios: {
    shadowColor: "#000000",
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  android: { elevation: 4 },
  default: {},
});

export default function Workout() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const router = useRouter();
  const [workouts, setWorkouts] = useState<WorkoutData[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const { startWorkout } = useActiveWorkout();
  const { initCreation } = useCreateRoutine();

  const [plusModalVisible, setPlusModalVisible] = useState(false);
  const scrollRef = useRef<ScrollView | null>(null);
  const routinesSectionY = useRef<number>(0);

  const loadData = useCallback(() => {
    setWorkouts(getWorkoutsByUserId("1"));
    setRoutines(getRoutinesByUserId("1"));
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reload routines when screen comes back into focus (e.g. after saving one)
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  // Subscribe to in-memory workout changes so new saves show immediately
  useEffect(() => {
    // lazy-import listener helpers from mockData to avoid circular imports
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { addWorkoutsListener } = require("../../data/mockData");
    const unsub = addWorkoutsListener(() => loadData());
    return () => unsub();
  }, [loadData]);

  const handleCreateRoutine = () => {
    setPlusModalVisible(false);
    initCreation();
    router.push("/create-routine" as any);
  };

  const handleStartEmptyWorkout = () => {
    startWorkout({
      id: `workout-${Date.now()}`,
      duration: 0,
      volume: 0,
      sets: 0,
      exercises: [],
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Image
          source={theme.logo}
          style={styles.headerLogo}
          resizeMode="contain"
        />
        <Pressable
          style={({ pressed }) => [
            styles.addButton,
            pressed && { opacity: 0.7, transform: [{ scale: 0.92 }] },
          ]}
          onPress={() => setPlusModalVisible(true)}
        >
          <Ionicons name="add" size={22} color={theme.foreground.white} />
        </Pressable>
      </View>

      {/* Plus modal */}
      <Modal
        transparent
        visible={plusModalVisible}
        animationType="fade"
        onRequestClose={() => setPlusModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setPlusModalVisible(false)}
        >
          <View style={styles.modalSheet}>
            <Pressable
              style={({ pressed }) => [
                styles.modalOption,
                pressed && { backgroundColor: "rgba(0,0,0,0.04)" },
              ]}
              onPress={() => {
                handleStartEmptyWorkout();
                setPlusModalVisible(false);
              }}
            >
              <Text style={styles.modalOptionText}>
                {t("workout.startEmptyWorkout")}
              </Text>
            </Pressable>

            <View style={styles.modalDivider} />

            <Pressable
              style={({ pressed }) => [
                styles.modalOption,
                pressed && { backgroundColor: "rgba(0,0,0,0.04)" },
              ]}
              onPress={handleCreateRoutine}
            >
              <Text style={styles.modalOptionText}>
                {t("workout.createRoutine")}
              </Text>
            </Pressable>

            <View style={styles.modalDivider} />

            <Pressable
              style={({ pressed }) => [
                styles.modalOption,
                pressed && { backgroundColor: "rgba(0,0,0,0.04)" },
              ]}
              onPress={() => {
                setPlusModalVisible(false);
              }}
            >
              <Text style={styles.modalOptionTextDanger}>
                {t("common.cancel")}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* Content */}
      <ScrollView
        ref={scrollRef}
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 70 }}
      >
        {/* Quick Actions - new layout */}
        <View style={styles.quickActionsColumn}>
          {/* Row 1: full-width Explore */}
          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              styles.actionButtonFull,
              pressed && { opacity: 0.88, transform: [{ scale: 0.98 }] },
            ]}
            onPress={() => router.push("/explore-routines" as any)}
          >
            <View style={[styles.actionBgIcon, { right: -12, bottom: -20 }]}>
              <Ionicons
                name="compass-outline"
                size={90}
                color={theme.primary.main}
              />
            </View>
            <View style={{ alignItems: "center", gap: 2 }}>
              <Text style={styles.actionButtonText}>
                {t("workout.exploreRoutines")}
              </Text>
              <Text style={styles.actionButtonSub}>
                {t("workout.browseCommunityTemplates")}
              </Text>
            </View>
          </Pressable>

          {/* Row 2: two buttons side-by-side */}
          <View style={styles.quickActionsRow}>
            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                pressed && { opacity: 0.88, transform: [{ scale: 0.98 }] },
              ]}
              onPress={handleStartEmptyWorkout}
            >
              <View style={[styles.actionBgIcon, { right: -14, bottom: -18 }]}>
                <Ionicons
                  name="fitness-outline"
                  size={70}
                  color={theme.primary.main}
                />
              </View>
              <Text style={styles.actionButtonText}>
                {t("workout.startEmptyWorkout")}
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                pressed && { opacity: 0.88, transform: [{ scale: 0.98 }] },
              ]}
              onPress={handleCreateRoutine}
            >
              <View style={[styles.actionBgIcon, { right: -14, bottom: -18 }]}>
                <Ionicons
                  name="create-outline"
                  size={70}
                  color={theme.primary.main}
                />
              </View>
              <Text style={styles.actionButtonText}>
                {t("workout.createRoutine")}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* My Routines Section */}
        <View
          style={styles.section}
          onLayout={(e) => {
            routinesSectionY.current = e.nativeEvent.layout.y;
          }}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t("workout.myRoutines")}</Text>
            <Pressable
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
              onPress={() => router.push("/routines" as any)}
            >
              <Text style={styles.seeAllText}>{t("common.seeAll")}</Text>
            </Pressable>
          </View>

          {routines.length === 0 ? (
            <View style={styles.emptyRoutines}>
              <Ionicons
                name="barbell"
                size={60}
                color={theme.foreground.gray}
              />
              <Text style={styles.emptyRoutinesText}>
                {t("workout.noRoutinesYet")}
              </Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.routinesScroll}
            >
              {routines.map((routine) => (
                <RoutineCard
                  key={routine.id}
                  routine={routine}
                  onPress={() => router.push(`/routines/${routine.id}` as any)}
                  onStart={() => router.push(`/routines/${routine.id}` as any)}
                />
              ))}
            </ScrollView>
          )}
        </View>

        {/* Recent Workouts Section */}
        {workouts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {t("workout.recentWorkouts")}
              </Text>
              <Pressable
                style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                onPress={() => router.push("/workouts" as any)}
              >
                <Text style={styles.seeAllText}>{t("common.seeAll")}</Text>
              </Pressable>
            </View>

            <View style={styles.workoutsList}>
              {workouts.map((workout) => (
                <WorkoutCard
                  key={workout.id}
                  workout={workout}
                  onPress={() => router.push(`/workouts/${workout.id}` as any)}
                  onStart={() => {
                    const active = {
                      id: `workout-${Date.now()}`,
                      duration: workout.duration || 0,
                      volume: 0,
                      sets: workout.exercises.reduce(
                        (s, e) => s + (e.sets || 0),
                        0,
                      ),
                      exercises: workout.exercises.map((ex) => ({
                        id: `${Date.now()}-${Math.random()}`,
                        exerciseId: 0,
                        name: ex.name,
                        muscles: [],
                        equipment: [],
                        sets: Array.from({ length: ex.sets }).map((_, i) => ({
                          id: `${Date.now()}-${Math.random()}-${i}`,
                          setNumber: i + 1,
                          kg: ex.weight || "",
                          reps: ex.reps || "",
                          isCompleted: false,
                        })),
                        addedAt: Date.now(),
                      })),
                    };
                    startWorkout(active);
                  }}
                />
              ))}
            </View>
          </View>
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
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingBottom: 8,
    },
    headerLogo: {
      height: 36,
      width: 110,
    },
    addButton: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.background.accent,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(0,0,0,0.08)",
      ...controlShadow,
    },
    content: {
      flex: 1,
    },
    // Quick Actions
    quickActionsColumn: {
      flexDirection: "column",
      paddingHorizontal: 16,
      paddingVertical: 8,
      gap: 8,
    },
    quickActionsRow: {
      flexDirection: "row",
      gap: 8,
    },
    actionButton: {
      flex: 1,
      backgroundColor: theme.background.darker,
      borderRadius: 16,
      paddingVertical: 14,
      paddingHorizontal: 12,
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(0,0,0,0.08)",
      overflow: "hidden",
      ...surfaceShadow,
    },
    actionBgIcon: {
      position: "absolute",
      opacity: 0.07,
    },
    actionButtonFull: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 14,
      paddingVertical: 12,
      gap: 10,
    },
    actionIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.background.dark,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 0,
    },
    actionButtonText: {
      fontSize: 13,
      fontFamily: FONTS.semiBold,
      color: theme.foreground.white,
      textAlign: "center",
    },
    actionButtonSub: {
      fontSize: 11,
      color: theme.foreground.gray,
      textAlign: "center",
    },
    // Sections
    section: {
      marginBottom: 16,
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      marginBottom: 8,
    },
    sectionTitle: {
      fontSize: 16,
      fontFamily: FONTS.bold,
      color: theme.foreground.white,
    },
    seeAllText: {
      fontSize: 12,
      fontFamily: FONTS.semiBold,
      color: theme.primary.main,
    },
    // Empty States
    emptyRoutines: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 28,
      paddingHorizontal: 32,
    },
    emptyRoutinesText: {
      fontSize: 14,
      color: theme.foreground.gray,
      textAlign: "center",
      marginTop: 12,
    },
    // Routines
    routinesScroll: {
      paddingHorizontal: 16,
      gap: 12,
    },
    routineCard: {
      width: 280,
      backgroundColor: theme.background.darker,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.background.darker,
    },
    routineHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 8,
    },
    routineName: {
      fontSize: 18,
      fontFamily: FONTS.bold,
      color: theme.foreground.white,
      flex: 1,
      marginRight: 8,
    },
    difficultyBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    difficulty_beginner: {
      backgroundColor: "#22c55e20",
    },
    difficulty_intermediate: {
      backgroundColor: "#f59e0b20",
    },
    difficulty_advanced: {
      backgroundColor: "#ef444420",
    },
    difficultyText: {
      fontSize: 10,
      fontFamily: FONTS.semiBold,
      color: theme.foreground.white,
      textTransform: "uppercase",
    },
    routineDescription: {
      fontSize: 13,
      color: theme.foreground.gray,
      marginBottom: 12,
      lineHeight: 18,
    },
    routineStats: {
      flexDirection: "row",
      gap: 16,
      marginBottom: 12,
    },
    routineStat: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    routineStatText: {
      fontSize: 12,
      color: theme.foreground.gray,
    },
    musclesContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
      marginBottom: 12,
    },
    muscleTag: {
      backgroundColor: theme.background.dark,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: theme.primary.main + "30",
    },
    muscleTagText: {
      fontSize: 11,
      fontFamily: FONTS.semiBold,
      color: theme.primary.main,
      textTransform: "capitalize",
    },
    completedText: {
      fontSize: 12,
      color: theme.foreground.gray,
      marginBottom: 12,
      fontStyle: "italic",
    },
    startRoutineButton: {
      backgroundColor: theme.primary.main,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 10,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    startRoutineButtonText: {
      fontSize: 14,
      fontFamily: FONTS.bold,
      color: theme.background.dark,
    },
    // Plus modal
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
    },
    modalSheet: {
      width: "100%",
      maxWidth: 480,
      backgroundColor: theme.background.darker,
      borderRadius: 22,
      paddingVertical: 8,
      overflow: "hidden",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(0,0,0,0.10)",
      ...surfaceShadow,
    },
    modalOption: {
      paddingVertical: 16,
      paddingHorizontal: 20,
      alignItems: "center",
      justifyContent: "center",
    },
    modalOptionText: {
      fontSize: 16,
      fontFamily: FONTS.bold,
      color: theme.foreground.white,
    },
    modalDivider: { height: 1, backgroundColor: theme.background.dark },
    modalOptionTextDanger: {
      fontSize: 16,
      fontFamily: FONTS.bold,
      color: "#ef4444",
    },
    // Workouts List
    workoutsList: {
      paddingHorizontal: 16,
      gap: 10,
    },
    workoutCard: {
      backgroundColor: theme.background.darker,
      borderRadius: 16,
      padding: 16,
      // Remove borderLeftWidth to match Routine card style
      // Instead, use a shadow or subtle border
      borderWidth: 1,
      borderColor: theme.background.dark,
    },
    workoutHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 12,
    },
    workoutTitleContainer: {
      flex: 1,
      paddingRight: 12,
    },
    workoutName: {
      fontSize: 18,
      fontFamily: FONTS.bold,
      color: theme.foreground.white,
      marginBottom: 4,
    },
    workoutDate: {
      fontSize: 13,
      color: theme.foreground.gray,
    },
    workoutDurationBadge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.background.dark,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      gap: 4,
      alignSelf: "flex-start",
    },
    workoutDurationText: {
      fontSize: 13,
      fontFamily: FONTS.semiBold,
      color: theme.primary.main,
    },
    workoutStatsRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginBottom: 16,
    },
    workoutStat: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    workoutStatDivider: {
      width: 1,
      height: 12,
      backgroundColor: theme.foreground.gray,
      opacity: 0.3,
    },
    workoutStatText: {
      fontSize: 13,
      fontFamily: FONTS.medium,
      color: theme.foreground.gray,
    },
    workoutExercisesTags: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    workoutExerciseTag: {
      backgroundColor: theme.background.dark,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
    },
    workoutExerciseTagText: {
      fontSize: 12,
      color: theme.foreground.white,
      fontFamily: FONTS.medium,
    },
    workoutExerciseMoreTag: {
      backgroundColor: theme.background.dark,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      opacity: 0.7,
    },
    workoutExerciseMoreText: {
      fontSize: 12,
      color: theme.foreground.gray,
      fontFamily: FONTS.semiBold,
    },
  });


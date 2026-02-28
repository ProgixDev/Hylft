import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
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
        <Text style={styles.headerTitle}>{t("workout.title")}</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setPlusModalVisible(true)}
        >
          <Ionicons name="add-circle" size={32} color={theme.primary.main} />
        </TouchableOpacity>
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
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                handleStartEmptyWorkout();
                setPlusModalVisible(false);
              }}
            >
              <Text style={styles.modalOptionText}>{t("workout.startEmptyWorkout")}</Text>
            </TouchableOpacity>

            <View style={styles.modalDivider} />

            <TouchableOpacity
              style={styles.modalOption}
              onPress={handleCreateRoutine}
            >
              <Text style={styles.modalOptionText}>{t("workout.createRoutine")}</Text>
            </TouchableOpacity>

            <View style={styles.modalDivider} />

            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                setPlusModalVisible(false);
              }}
            >
              <Text style={styles.modalOptionTextDanger}>{t("common.cancel")}</Text>
            </TouchableOpacity>
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
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonFull]}
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
              <Text style={styles.actionButtonText}>{t("workout.exploreRoutines")}</Text>
              <Text style={styles.actionButtonSub}>
                {t("workout.browseCommunityTemplates")}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Row 2: two buttons side-by-side */}
          <View style={styles.quickActionsRow}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleStartEmptyWorkout}
            >
              <View style={[styles.actionBgIcon, { right: -14, bottom: -18 }]}>
                <Ionicons
                  name="fitness-outline"
                  size={70}
                  color={theme.primary.main}
                />
              </View>
              <Text style={styles.actionButtonText}>{t("workout.startEmptyWorkout")}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleCreateRoutine}
            >
              <View style={[styles.actionBgIcon, { right: -14, bottom: -18 }]}>
                <Ionicons
                  name="create-outline"
                  size={70}
                  color={theme.primary.main}
                />
              </View>
              <Text style={styles.actionButtonText}>{t("workout.createRoutine")}</Text>
            </TouchableOpacity>
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
            <TouchableOpacity onPress={() => router.push("/routines" as any)}>
              <Text style={styles.seeAllText}>{t("common.seeAll")}</Text>
            </TouchableOpacity>
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
              <Text style={styles.sectionTitle}>{t("workout.recentWorkouts")}</Text>
              <TouchableOpacity onPress={() => router.push("/workouts" as any)}>
                <Text style={styles.seeAllText}>{t("common.seeAll")}</Text>
              </TouchableOpacity>
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
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.background.darker,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: "700",
      color: theme.foreground.white,
    },
    addButton: {
      padding: 4,
    },
    content: {
      flex: 1,
    },
    // Quick Actions
    quickActionsColumn: {
      flexDirection: "column",
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 12,
    },
    quickActionsRow: {
      flexDirection: "row",
      gap: 12,
    },
    actionButton: {
      flex: 1,
      backgroundColor: theme.background.darker,
      borderRadius: 12,
      paddingVertical: 18,
      paddingHorizontal: 12,
      alignItems: "center",
      gap: 8,
      borderWidth: 1,
      borderColor: theme.background.darker,
      overflow: "hidden",
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
      paddingHorizontal: 16,
      paddingVertical: 18,
      gap: 12,
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
      fontWeight: "600",
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
      marginBottom: 24,
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: theme.foreground.white,
    },
    seeAllText: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.primary.main,
    },
    // Empty States
    emptyRoutines: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 40,
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
      fontWeight: "700",
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
      fontWeight: "600",
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
      fontWeight: "600",
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
      fontWeight: "700",
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
      borderRadius: 14,
      paddingVertical: 8,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: theme.background.dark,
    },
    modalOption: {
      paddingVertical: 16,
      paddingHorizontal: 20,
      alignItems: "center",
      justifyContent: "center",
    },
    modalOptionText: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.foreground.white,
    },
    modalDivider: { height: 1, backgroundColor: theme.background.dark },
    modalOptionTextDanger: {
      fontSize: 16,
      fontWeight: "700",
      color: "#ef4444",
    },
    // Workouts List
    workoutsList: {
      paddingHorizontal: 16, // Use same standard padding as routines
      gap: 16,
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
      fontWeight: "700",
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
      fontWeight: "600",
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
      fontWeight: "500",
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
      fontWeight: "500",
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
      fontWeight: "600",
    },
  });

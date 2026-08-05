import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import WorkoutCard from "../../components/ui/WorkoutCard";
import { Theme } from "../../constants/themes";
import { useActiveWorkout } from "../../contexts/ActiveWorkoutContext";
import { useTheme } from "../../contexts/ThemeContext";
import { getWorkoutsByUserId, Workout } from "../../data/mockData";

import { FONTS } from "../../constants/fonts";

export default function AllWorkouts() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const router = useRouter();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const { startWorkout } = useActiveWorkout();

  const loadData = useCallback(() => {
    // For now, hardcode userId "1"
    const userWorkouts = getWorkoutsByUserId("1");
    // Sort by date descending (newest first)
    const sorted = [...userWorkouts].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
    setWorkouts(sorted);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

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
        <Text style={styles.headerTitle}>All Workouts</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {workouts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="time-outline"
              size={60}
              color={theme.foreground.gray}
            />
            <Text style={styles.emptyText}>
              No workout history yet. start training!
            </Text>
          </View>
        ) : (
          <>
            {workouts.map((workout) => (
              <WorkoutCard
                key={workout.id}
                workout={workout}
                fullWidth
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
      fontSize: 20,
      fontFamily: FONTS.bold,
      color: theme.foreground.white,
    },
    content: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
      gap: 16,
      paddingBottom: 40,
    },
    emptyState: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 60,
    },
    emptyText: {
      fontSize: 16,
      color: theme.foreground.gray,
      textAlign: "center",
      marginTop: 16,
    },
    // Workout Card
    workoutCard: {
      width: "100%",
      backgroundColor: theme.background.darker,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.background.darker,
    },
    workoutHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 8,
    },
    workoutName: {
      fontSize: 18,
      fontFamily: FONTS.bold,
      color: theme.foreground.white,
      marginBottom: 4,
    },
    workoutDate: {
      fontSize: 14,
      color: theme.foreground.gray,
    },
    durationBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: "rgba(34, 197, 94, 0.1)", // Green tint
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    durationText: {
      fontSize: 12,
      fontFamily: FONTS.semiBold,
      color: theme.primary.main,
    },
    divider: {
      height: 1,
      backgroundColor: theme.background.dark,
      marginVertical: 12,
    },
    statsRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-around", // Spread out stats evenly
    },
    statItem: {
      alignItems: "center",
    },
    statValue: {
      color: theme.foreground.white,
      fontSize: 16,
      fontFamily: FONTS.bold, // Bolder value
    },
    statLabel: {
      color: theme.foreground.gray,
      fontSize: 12,
      marginTop: 2,
    },
    statDivider: {
      width: 1,
      height: 24,
      backgroundColor: theme.background.dark,
    },
    exerciseTags: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    exerciseTag: {
      backgroundColor: theme.background.dark,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      maxWidth: "48%", // Limit width so 2 fit side-by-side easily
    },
    exerciseTagText: {
      fontSize: 12,
      color: theme.foreground.white,
    },
    moreTag: {
      backgroundColor: "rgba(0, 0, 0, 0.05)",
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    moreTagText: {
      fontSize: 12,
      fontFamily: FONTS.semiBold,
      color: theme.foreground.gray,
    },
  });

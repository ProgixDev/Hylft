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
import { useTranslation } from "react-i18next";
import RoutineCard from "../../components/ui/RoutineCard";
import { Theme } from "../../constants/themes";
import { useTheme } from "../../contexts/ThemeContext";
import { getRoutinesByUserId, Routine } from "../../data/mockData";

export default function AllRoutines() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const router = useRouter();
  const [routines, setRoutines] = useState<Routine[]>([]);

  const loadData = useCallback(() => {
    // For now, hardcode userId "1" as per the mock setup in other files
    setRoutines(getRoutinesByUserId("1"));
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
        <Text style={styles.headerTitle}>{t("routines.allRoutines")}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {routines.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="barbell-outline"
              size={60}
              color={theme.foreground.gray}
            />
            <Text style={styles.emptyText}>
              {t("routines.noRoutinesYetCreate")}
            </Text>
          </View>
        ) : (
          <>
            {routines.map((routine) => (
              <RoutineCard
                key={routine.id}
                routine={routine}
                fullWidth
                onPress={() => router.push(`/routines/${routine.id}` as any)}
                onStart={() => router.push(`/routines/${routine.id}` as any)}
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
      fontWeight: "700",
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
    routineCard: {
      width: "100%",
      backgroundColor: theme.background.darker,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.background.darker, // Or accent color if selected
    },
    routineHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
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
      borderRadius: 12,
    },
    difficulty_beginner: {
      backgroundColor: "rgba(34, 197, 94, 0.2)",
    },
    difficulty_intermediate: {
      backgroundColor: "rgba(245, 158, 11, 0.2)",
    },
    difficulty_advanced: {
      backgroundColor: "rgba(239, 68, 68, 0.2)",
    },
    difficultyText: {
      fontSize: 10,
      fontWeight: "600",
      color: theme.foreground.white,
      textTransform: "uppercase",
    },
    routineDescription: {
      fontSize: 14,
      color: theme.foreground.gray,
      marginBottom: 12,
      lineHeight: 20,
    },
    divider: {
      height: 1,
      backgroundColor: theme.background.dark,
      marginVertical: 12,
    },
    statsRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    statItem: {
      alignItems: "center",
      flex: 1,
    },
    statValue: {
      color: theme.foreground.white,
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 2,
    },
    statLabel: {
      color: theme.foreground.gray,
      fontSize: 12,
    },
    statDivider: {
      width: 1,
      height: 24,
      backgroundColor: theme.background.dark,
    },
    musclesContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 16, // Increased spacing before button
    },
    muscleTag: {
      backgroundColor: theme.background.dark,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 8,
    },
    muscleTagText: {
      fontSize: 12,
      fontWeight: "600",
      color: theme.primary.main,
      textTransform: "capitalize",
    },
    startRoutineButton: {
      backgroundColor: theme.primary.main,
      paddingVertical: 12,
      borderRadius: 12,
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
  });

import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import RoutineCard from "../../components/ui/RoutineCard";
import { Theme } from "../../constants/themes";
import { useTheme } from "../../contexts/ThemeContext";
import { getRoutinesByUserId, Routine } from "../../data/mockData";

import { FONTS } from "../../constants/fonts";

const surfaceShadow = Platform.select({
  ios: {
    shadowColor: "#000000",
    shadowOpacity: 0.2,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  android: {
    elevation: 8,
  },
  default: {},
});

const controlShadow = Platform.select({
  ios: {
    shadowColor: "#000000",
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  android: {
    elevation: 4,
  },
  default: {},
});

export default function AllRoutines() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
        <Pressable
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.backButtonPressed,
          ]}
          onPress={() => router.back()}
          hitSlop={8}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={theme.foreground.white}
          />
        </Pressable>
        <Image
          source={theme.logo}
          style={styles.headerLogo}
          resizeMode="contain"
        />
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 40 + insets.bottom },
        ]}
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
      paddingHorizontal: 20,
      paddingTop: 10,
      paddingBottom: 8,
    },
    backButton: {
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.background.accent,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(0,0,0,0.08)",
      ...controlShadow,
    },
    backButtonPressed: {
      opacity: 0.9,
      transform: [{ scale: 0.96 }],
    },
    headerLogo: {
      height: 26,
      width: 80,
    },
    content: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 40,
    },
    emptyState: {
      alignItems: "center",
      justifyContent: "center",
      marginTop: 60,
      marginHorizontal: 20,
      borderRadius: 26,
      paddingVertical: 48,
      paddingHorizontal: 24,
      backgroundColor: theme.background.accent,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(0,0,0,0.07)",
      ...surfaceShadow,
    },
    emptyText: {
      fontSize: 16,
      color: theme.foreground.gray,
      textAlign: "center",
      marginTop: 12,
      lineHeight: 22,
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
      fontFamily: FONTS.bold,
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
      fontFamily: FONTS.semiBold,
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
      fontFamily: FONTS.semiBold,
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
      fontFamily: FONTS.semiBold,
      color: theme.primary.main,
      textTransform: "capitalize",
    },
    startRoutineButton: {
      backgroundColor: theme.primary.main,
      paddingVertical: 12,
      borderRadius: 22,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    startRoutineButtonText: {
      fontSize: 15,
      fontFamily: FONTS.bold,
      color: theme.background.dark,
    },
  });

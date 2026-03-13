import { Ionicons } from "@expo/vector-icons";
import React, { memo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../contexts/ThemeContext";
import { Routine } from "../../data/mockData";
import { translateRoutineName, translateRoutineDescription, translateExerciseTerm, translateApiData } from "../../utils/exerciseTranslator";

import { FONTS } from "../../constants/fonts";

type Props = {
  routine: Routine;
  onPress?: () => void;
  onStart?: () => void;
  /** when true the card expands to full width (use on list/detail screens) */
  fullWidth?: boolean;
};

const RoutineCard = ({
  routine,
  onPress,
  onStart,
  fullWidth = false,
}: Props) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const translatedName = translateRoutineName(routine.name);

  const difficultyStyle = {
    beginner: styles.difficulty_beginner,
    intermediate: styles.difficulty_intermediate,
    advanced: styles.difficulty_advanced,
  }[routine.difficulty];

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.card, fullWidth && styles.cardFull]}
    >
      <View style={styles.header}>
        <Text style={styles.name} numberOfLines={1}>
          {translatedName}
        </Text>
        <View style={[styles.difficultyBadge, difficultyStyle]}>
          <Text style={styles.difficultyText}>{translateApiData(routine.difficulty)}</Text>
        </View>
      </View>

      <Text style={styles.description} numberOfLines={2}>
        {translateRoutineDescription(routine.description)}
      </Text>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{routine.exercises.length}</Text>
          <Text style={styles.statLabel}>{t("routines.exercises")}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{routine.estimatedDuration}m</Text>
          <Text style={styles.statLabel}>{t("routines.duration")}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{routine.timesCompleted}</Text>
          <Text style={styles.statLabel}>{t("routines.completed")}</Text>
        </View>
      </View>

      <View style={styles.musclesContainer}>
        {routine.targetMuscles.slice(0, 3).map((m, i) => (
          <View key={i} style={styles.muscleTag}>
            <Text style={styles.muscleTagText}>
              {translateExerciseTerm(m, "targetMuscles")}
            </Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        onPress={onStart}
        style={styles.startButton}
        activeOpacity={0.85}
      >
        <Text style={styles.startButtonText}>{t("routines.startRoutine")}</Text>
        <Ionicons
          name="arrow-forward"
          size={14}
          color={theme.background.dark}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const createStyles = (theme: ReturnType<typeof useTheme>["theme"]) =>
  StyleSheet.create({
    card: {
      width: 280,
      backgroundColor: theme.background.darker,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.background.darker,
      marginRight: 12,
    },
    cardFull: {
      width: "100%",
      marginRight: 0,
      marginBottom: 12,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 8,
    },
    name: {
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
      backgroundColor: "rgba(34,197,94,0.12)",
    },
    difficulty_intermediate: {
      backgroundColor: "rgba(245,158,11,0.12)",
    },
    difficulty_advanced: {
      backgroundColor: "rgba(239,68,68,0.12)",
    },
    difficultyText: {
      fontSize: 10,
      fontFamily: FONTS.semiBold,
      color: theme.foreground.white,
      textTransform: "uppercase",
    },
    description: {
      fontSize: 13,
      color: theme.foreground.gray,
      marginBottom: 12,
      lineHeight: 18,
    },
    statsRow: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 12,
    },
    statItem: {
      alignItems: "center",
      flex: 1,
    },
    statValue: {
      color: theme.foreground.white,
      fontSize: 14,
      fontFamily: FONTS.bold,
      marginBottom: 2,
    },
    statLabel: {
      color: theme.foreground.gray,
      fontSize: 12,
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
    startButton: {
      backgroundColor: theme.primary.main,
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 18,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    startButtonText: {
      fontSize: 13,
      fontFamily: FONTS.bold,
      color: theme.background.dark,
    },
  });

export default memo(RoutineCard);

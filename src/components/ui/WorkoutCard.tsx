import { Ionicons } from "@expo/vector-icons";
import React, { memo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../contexts/ThemeContext";
import { formatShortDate } from "../../utils/dateFormatter";
import { translateExerciseName, translateApiData } from "../../utils/exerciseTranslator";
import { Workout } from "../../data/mockData";

import { FONTS } from "../../constants/fonts";

type Props = {
  workout: Workout;
  onPress?: () => void;
  onStart?: () => void;
  /** expands card to full width when true */
  fullWidth?: boolean;
};

const WorkoutCard = ({
  workout,
  onPress,
  onStart,
  fullWidth = false,
}: Props) => {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const setsCount = workout.exercises.reduce(
    (acc, e) => acc + (e.sets || 0),
    0,
  );

  const formattedDate = formatShortDate(workout.date);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.card, fullWidth && styles.cardFull]}
    >
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Text style={styles.name}>{translateApiData(workout.name)}</Text>
          <Text style={styles.date}>{formattedDate}</Text>
        </View>
        <View style={styles.durationBadge}>
          <Ionicons name="time-outline" size={14} color={theme.primary.main} />
          <Text style={styles.durationText}>{workout.duration}m</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{workout.exercises.length}</Text>
          <Text style={styles.statLabel}>{t("schedule.exercises")}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{setsCount}</Text>
          <Text style={styles.statLabel}>{t("post.sets")}</Text>
        </View>
      </View>

      <View style={styles.tagsRow}>
        {workout.exercises.slice(0, 4).map((ex, i) => (
          <View key={i} style={styles.tag}>
            <Text style={styles.tagText} numberOfLines={1}>
              {translateExerciseName(ex.name)}
            </Text>
          </View>
        ))}
        {workout.exercises.length > 4 && (
          <View style={styles.moreTag}>
            <Text style={styles.moreText}>+{workout.exercises.length - 4}</Text>
          </View>
        )}
      </View>

      {/* Start button */}
      <TouchableOpacity
        onPress={onStart}
        activeOpacity={0.85}
        style={styles.startButton}
      >
        <Text style={styles.startButtonText}>{t("schedule.startWorkout")}</Text>
        <Ionicons name="arrow-forward" size={14} color={"#111"} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const createStyles = (theme: ReturnType<typeof useTheme>["theme"]) =>
  StyleSheet.create({
    card: {
      backgroundColor: theme.background.darker,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.background.dark,
      marginBottom: 12,
    },
    cardFull: {
      width: "100%",
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 12,
    },
    titleBlock: {
      flex: 1,
      paddingRight: 12,
    },
    name: {
      fontSize: 18,
      fontFamily: FONTS.bold,
      color: theme.foreground.white,
      marginBottom: 4,
    },
    date: {
      fontSize: 13,
      color: theme.foreground.gray,
    },
    durationBadge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.background.dark,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      gap: 6,
      alignSelf: "flex-start",
    },
    durationText: {
      fontSize: 13,
      fontFamily: FONTS.semiBold,
      color: theme.primary.main,
    },
    statsRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginBottom: 12,
    },
    statItem: {
      alignItems: "center",
      flex: 1,
    },
    statValue: {
      color: theme.foreground.white,
      fontSize: 16,
      fontFamily: FONTS.bold,
    },
    statLabel: {
      color: theme.foreground.gray,
      fontSize: 12,
      marginTop: 2,
    },
    tagsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    tag: {
      backgroundColor: theme.background.dark,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      maxWidth: "48%",
    },
    tagText: {
      fontSize: 12,
      color: theme.foreground.white,
    },
    moreTag: {
      backgroundColor: "rgba(255,255,255,0.03)",
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    moreText: {
      fontSize: 12,
      fontFamily: FONTS.semiBold,
      color: theme.foreground.gray,
    },
    startButton: {
      marginTop: 12,
      backgroundColor: theme.primary.main,
      paddingVertical: 12,
      borderRadius: 22,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    startButtonText: {
      color: theme.background.dark,
      fontSize: 15,
      fontFamily: FONTS.bold,
    },
  });

export default memo(WorkoutCard);

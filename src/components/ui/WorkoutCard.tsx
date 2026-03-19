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
  const { t } = useTranslation();
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
          <Text style={styles.name} numberOfLines={1}>{translateApiData(workout.name)}</Text>
          <Text style={styles.date}>{formattedDate}</Text>
        </View>
        <View style={styles.durationBadge}>
          <Ionicons name="time-outline" size={13} color={theme.primary.main} />
          <Text style={styles.durationText}>{workout.duration}m</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <Text style={styles.statText}>
          {workout.exercises.length} {t("schedule.exercises")}
        </Text>
        <View style={styles.statDot} />
        <Text style={styles.statText}>
          {setsCount} {t("post.sets")}
        </Text>
      </View>

      <View style={styles.tagsRow}>
        {workout.exercises.slice(0, 3).map((ex, i) => (
          <View key={i} style={styles.tag}>
            <Text style={styles.tagText} numberOfLines={1}>
              {translateExerciseName(ex.name)}
            </Text>
          </View>
        ))}
        {workout.exercises.length > 3 && (
          <View style={styles.moreTag}>
            <Text style={styles.moreText}>+{workout.exercises.length - 3}</Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        onPress={onStart}
        activeOpacity={0.85}
        style={styles.startButton}
      >
        <Text style={styles.startButtonText}>{t("schedule.startWorkout")}</Text>
        <Ionicons name="arrow-forward" size={13} color={theme.background.dark} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const createStyles = (theme: ReturnType<typeof useTheme>["theme"]) =>
  StyleSheet.create({
    card: {
      backgroundColor: theme.background.darker,
      borderRadius: 14,
      padding: 12,
      borderWidth: 1,
      borderColor: theme.background.dark,
    },
    cardFull: {
      width: "100%",
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 6,
    },
    titleBlock: {
      flex: 1,
      paddingRight: 10,
    },
    name: {
      fontSize: 15,
      fontFamily: FONTS.bold,
      color: theme.foreground.white,
      marginBottom: 2,
    },
    date: {
      fontSize: 11,
      color: theme.foreground.gray,
    },
    durationBadge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.background.dark,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      gap: 4,
      alignSelf: "flex-start",
    },
    durationText: {
      fontSize: 11,
      fontFamily: FONTS.semiBold,
      color: theme.primary.main,
    },
    statsRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginBottom: 6,
    },
    statText: {
      color: theme.foreground.gray,
      fontSize: 12,
      fontFamily: FONTS.medium,
    },
    statDot: {
      width: 3,
      height: 3,
      borderRadius: 1.5,
      backgroundColor: theme.foreground.gray,
      opacity: 0.5,
    },
    tagsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
    },
    tag: {
      backgroundColor: theme.background.dark,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      maxWidth: "45%",
    },
    tagText: {
      fontSize: 11,
      color: theme.foreground.white,
    },
    moreTag: {
      backgroundColor: "rgba(0,0,0,0.03)",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      alignItems: "center",
      justifyContent: "center",
    },
    moreText: {
      fontSize: 11,
      fontFamily: FONTS.semiBold,
      color: theme.foreground.gray,
    },
    startButton: {
      marginTop: 8,
      backgroundColor: theme.primary.main,
      paddingVertical: 8,
      borderRadius: 18,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 5,
    },
    startButtonText: {
      color: theme.background.dark,
      fontSize: 13,
      fontFamily: FONTS.bold,
    },
  });

export default memo(WorkoutCard);

import { Ionicons } from "@expo/vector-icons";
import React, { memo } from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../contexts/ThemeContext";
import { Routine } from "../../data/mockData";
import { translateRoutineName, translateExerciseTerm } from "../../utils/exerciseTranslator";

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
      </View>

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

      <View style={styles.bottomRow}>
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
          style={styles.playButton}
          activeOpacity={0.85}
          accessibilityLabel={t("routines.startRoutine")}
        >
          <Ionicons name="play" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const NAVY_CARD = "#0A1628";
const NAVY_CARD_LIGHT = "#1A2F50";
const NAVY_CARD_DEEP = "#07101F";
const NAVY_TEXT_MUTED = "rgba(255,255,255,0.72)";

const createStyles = (theme: ReturnType<typeof useTheme>["theme"]) => {
  const navyShadow = Platform.select({
    ios: {
      shadowColor: NAVY_CARD,
      shadowOpacity: 0.26,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 8 },
    },
    android: { elevation: 5 },
    default: {},
  });

  return StyleSheet.create({
    card: {
      width: 260,
      backgroundColor: NAVY_CARD,
      borderRadius: 14,
      padding: 12,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.14)",
      borderBottomWidth: 3,
      borderBottomColor: "rgba(0,0,0,0.24)",
      marginRight: 10,
      ...navyShadow,
    },
    cardFull: {
      width: "100%",
      marginRight: 0,
      marginBottom: 10,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 10,
    },
    name: {
      fontSize: 18,
      fontFamily: FONTS.bold,
      color: "#FFFFFF",
      flex: 1,
      marginRight: 8,
    },
    statsRow: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 10,
    },
    statItem: {
      alignItems: "center",
      flex: 1,
      backgroundColor: "rgba(255,255,255,0.08)",
      borderRadius: 10,
      paddingVertical: 8,
    },
    statValue: {
      color: "#FFFFFF",
      fontSize: 14,
      fontFamily: FONTS.bold,
      marginBottom: 2,
    },
    statLabel: {
      color: NAVY_TEXT_MUTED,
      fontSize: 12,
    },
    bottomRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
    },
    musclesContainer: {
      flex: 1,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 5,
    },
    muscleTag: {
      backgroundColor: NAVY_CARD_DEEP,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.12)",
    },
    muscleTagText: {
      fontSize: 11,
      fontFamily: FONTS.semiBold,
      color: NAVY_TEXT_MUTED,
      textTransform: "capitalize",
    },
    playButton: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: NAVY_CARD_LIGHT,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.16)",
    },
  });
};

export default memo(RoutineCard);

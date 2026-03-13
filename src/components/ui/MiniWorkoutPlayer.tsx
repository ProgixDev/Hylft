import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Theme } from "../../constants/themes";
import { useActiveWorkout } from "../../contexts/ActiveWorkoutContext";
import { useTheme } from "../../contexts/ThemeContext";

import { FONTS } from "../../constants/fonts";

interface MiniWorkoutPlayerProps {
  onExpand?: () => void;
}

export const MiniWorkoutPlayer: React.FC<MiniWorkoutPlayerProps> = ({
  onExpand,
}) => {
  const { theme } = useTheme();
  const { activeWorkout, discardWorkout } = useActiveWorkout();
  const styles = createStyles(theme);

  if (!activeWorkout) {
    return null;
  }

  // Format duration as mm:ss
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleDelete = (e: any) => {
    e.stopPropagation();
    discardWorkout();
  };

  return (
    <TouchableOpacity
      style={[styles.container, { bottom: 60 + 16 }]}
      onPress={onExpand}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="fitness" size={20} color={theme.primary.main} />
        </View>

        <View style={styles.info}>
          <Text style={styles.title}>Active Workout</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons
                name="time-outline"
                size={12}
                color={theme.foreground.gray}
              />
              <Text style={styles.stat}>
                {formatDuration(activeWorkout.duration)}
              </Text>
            </View>
            <Text style={styles.statSeparator}>•</Text>
            <View style={styles.statItem}>
              <Ionicons
                name="repeat-outline"
                size={12}
                color={theme.foreground.gray}
              />
              <Text style={styles.stat}>{activeWorkout.sets}</Text>
            </View>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
        <Ionicons name="trash-outline" size={24} color="#FF4444" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.background.darker,
      borderTopWidth: 1,
      borderTopColor: theme.background.accent,
      position: "absolute",
      bottom: 90,
      left: 16,
      right: 16,
      paddingHorizontal: 16,
      paddingVertical: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderRadius: 24,
      overflow: "hidden",
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: -2,
      },
      shadowOpacity: 0.35,
      shadowRadius: 8,
    },
    content: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 8,
      backgroundColor: theme.background.dark,
      alignItems: "center",
      justifyContent: "center",
    },
    info: {
      flex: 1,
    },
    title: {
      fontSize: 14,
      fontFamily: FONTS.bold,
      color: theme.foreground.white,
      marginBottom: 4,
    },
    statsRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    statItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    stat: {
      fontSize: 12,
      color: theme.foreground.gray,
      fontFamily: FONTS.semiBold,
    },
    statSeparator: {
      fontSize: 12,
      color: theme.foreground.gray,
      marginHorizontal: 2,
    },
    deleteButton: {
      padding: 8,
      borderRadius: 8,
      justifyContent: "center",
      alignItems: "center",
    },
  });

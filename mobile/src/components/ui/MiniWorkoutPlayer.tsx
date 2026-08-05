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
  const { activeWorkout, isPaused, togglePause, discardWorkout } =
    useActiveWorkout();
  const styles = createStyles(theme);

  if (!activeWorkout) {
    return null;
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleDelete = (e: any) => {
    e.stopPropagation();
    discardWorkout();
  };

  const handleTogglePause = (e: any) => {
    e.stopPropagation();
    togglePause();
  };

  const completedSets = activeWorkout.exercises.reduce(
    (count, ex) => count + ex.sets.filter((s) => s.isCompleted).length,
    0,
  );

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onExpand}
      activeOpacity={0.85}
    >
      {/* Play/Pause Button */}
      <TouchableOpacity style={styles.playPauseBtn} onPress={handleTogglePause}>
        <Ionicons
          name={isPaused ? "play" : "pause"}
          size={18}
          color="#fff"
        />
      </TouchableOpacity>

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {isPaused ? "Paused" : "Active Workout"}
        </Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons
              name="time-outline"
              size={12}
              color={isPaused ? theme.primary.main : theme.foreground.gray}
            />
            <Text style={[styles.stat, isPaused && { color: theme.primary.main }]}>
              {formatDuration(activeWorkout.duration)}
            </Text>
          </View>
          <Text style={styles.statSeparator}>·</Text>
          <View style={styles.statItem}>
            <Ionicons
              name="checkmark-circle-outline"
              size={12}
              color={theme.foreground.gray}
            />
            <Text style={styles.stat}>
              {completedSets} sets
            </Text>
          </View>
          <Text style={styles.statSeparator}>·</Text>
          <View style={styles.statItem}>
            <Ionicons
              name="barbell-outline"
              size={12}
              color={theme.foreground.gray}
            />
            <Text style={styles.stat}>
              {activeWorkout.exercises.length} ex
            </Text>
          </View>
        </View>
      </View>

      {/* Delete Button */}
      <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
        <Ionicons name="close-circle" size={22} color="#FF4444" />
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
      left: 12,
      right: 12,
      paddingHorizontal: 10,
      paddingVertical: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      borderRadius: 18,
      overflow: "hidden",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.35,
      shadowRadius: 8,
      elevation: 8,
    },
    playPauseBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.primary.main,
      alignItems: "center",
      justifyContent: "center",
    },
    info: {
      flex: 1,
    },
    title: {
      fontSize: 13,
      fontFamily: FONTS.bold,
      color: theme.foreground.white,
      marginBottom: 2,
    },
    statsRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    statItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
    },
    stat: {
      fontSize: 11,
      color: theme.foreground.gray,
      fontFamily: FONTS.semiBold,
    },
    statSeparator: {
      fontSize: 11,
      color: theme.foreground.gray,
      marginHorizontal: 1,
    },
    deleteButton: {
      padding: 4,
      borderRadius: 7,
      justifyContent: "center",
      alignItems: "center",
    },
  });

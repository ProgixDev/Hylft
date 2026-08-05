import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { FONTS } from "../../constants/fonts";
import { Theme } from "../../constants/themes";
import { useTheme } from "../../contexts/ThemeContext";
import { Routine } from "../../data/mockData";
import {
  translateExerciseName,
  translateExerciseTerm,
  translateRoutineDescription,
  translateRoutineName,
} from "../../utils/exerciseTranslator";

const { height: SCREEN_H } = Dimensions.get("window");
const SHEET_MAX_H = Math.round(SCREEN_H * 0.88);

const NAVY = "#0A1628";
const NAVY_LIGHT = "#1A2F50";

const REST_LABEL = (seconds: number) => {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s === 0 ? `${m}m` : `${m}m ${s}s`;
};

type Props = {
  visible: boolean;
  routine: Routine | null;
  onClose: () => void;
  onStart: (routine: Routine) => void;
};

export default function RoutineDetailModal({
  visible,
  routine,
  onClose,
  onStart,
}: Props) {
  const { t } = useTranslation();
  const { theme, themeType } = useTheme();
  const styles = createStyles(theme, themeType === "dark");

  const translateY = useRef(new Animated.Value(SHEET_MAX_H)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 280,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      opacity.setValue(0);
      translateY.setValue(SHEET_MAX_H);
    }
  }, [visible, opacity, translateY]);

  if (!routine) return null;

  const totalSets = routine.exercises.reduce((s, ex) => s + ex.sets, 0);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.overlay, { opacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View
          style={[
            styles.sheet,
            { transform: [{ translateY }] },
          ]}
        >
          {/* Drag handle */}
          <View style={styles.handleWrap}>
            <View style={styles.handle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title} numberOfLines={2}>
                {translateRoutineName(routine.name)}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeBtn,
                pressed && { opacity: 0.7, transform: [{ scale: 0.94 }] },
              ]}
              hitSlop={8}
            >
              <Ionicons
                name="close"
                size={20}
                color={theme.foreground.white}
              />
            </Pressable>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Description */}
            {!!routine.description && (
              <Text style={styles.description}>
                {translateRoutineDescription(routine.description)}
              </Text>
            )}

            {/* Stats row */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {routine.estimatedDuration}m
                </Text>
                <Text style={styles.statLabel}>
                  {t("routines.duration")}
                </Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {routine.exercises.length}
                </Text>
                <Text style={styles.statLabel}>
                  {t("routines.exercises")}
                </Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{totalSets}</Text>
                <Text style={styles.statLabel}>
                  {t("createRoutine.sets")}
                </Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {routine.timesCompleted}
                </Text>
                <Text style={styles.statLabel}>
                  {t("profile.done")}
                </Text>
              </View>
            </View>

            {/* Target muscles */}
            {routine.targetMuscles.length > 0 && (
              <View>
                <Text style={styles.sectionTitle}>
                  {t("routines.targetMuscles")}
                </Text>
                <View style={styles.musclesContainer}>
                  {routine.targetMuscles.map((m, i) => (
                    <View key={i} style={styles.muscleTag}>
                      <Text style={styles.muscleTagText}>
                        {translateExerciseTerm(m, "targetMuscles")}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Exercise list */}
            <Text style={styles.sectionTitle}>
              {t("routines.exercises")}
            </Text>
            {routine.exercises.map((exercise, index) => (
              <View key={exercise.id} style={styles.exerciseCard}>
                <View style={styles.exerciseHeader}>
                  <View style={styles.exerciseThumbWrap}>
                    {exercise.gifUrl ? (
                      <Image
                        source={{ uri: exercise.gifUrl }}
                        style={styles.exerciseThumb}
                        contentFit="cover"
                        autoplay={false}
                        transition={150}
                      />
                    ) : (
                      <View
                        style={[styles.exerciseThumb, styles.exerciseThumbPlaceholder]}
                      >
                        <Ionicons
                          name="barbell-outline"
                          size={22}
                          color={theme.foreground.gray}
                        />
                      </View>
                    )}
                    <View style={styles.exerciseIndexBadge}>
                      <Text style={styles.exerciseIndex}>{index + 1}</Text>
                    </View>
                  </View>
                  <Text style={styles.exerciseName} numberOfLines={2}>
                    {translateExerciseName(exercise.name)}
                  </Text>
                </View>

                <View style={styles.exerciseDivider} />

                <View style={styles.exerciseMetaRow}>
                  <View style={styles.exerciseMeta}>
                    <Text style={styles.exerciseMetaValue}>
                      {exercise.sets}
                    </Text>
                    <Text style={styles.exerciseMetaLabel}>
                      {t("createRoutine.sets")}
                    </Text>
                  </View>
                  <View style={styles.exerciseMetaDivider} />
                  <View style={styles.exerciseMeta}>
                    <Text style={styles.exerciseMetaValue}>
                      {exercise.reps}
                    </Text>
                    <Text style={styles.exerciseMetaLabel}>
                      {t("createRoutine.reps")}
                    </Text>
                  </View>
                  <View style={styles.exerciseMetaDivider} />
                  <View style={styles.exerciseMeta}>
                    <Text style={styles.exerciseMetaValue}>
                      {REST_LABEL(exercise.restTime)}
                    </Text>
                    <Text style={styles.exerciseMetaLabel}>
                      {t("createRoutine.rest")}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Sticky start button */}
          <View style={styles.stickyBar}>
            <Pressable
              onPress={() => {
                onStart(routine);
              }}
              style={({ pressed }) => [
                styles.startBtn,
                pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
              ]}
            >
              <LinearGradient
                colors={[NAVY_LIGHT, NAVY]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.startBtnInner}
              >
                <Ionicons name="play" size={18} color="#FFFFFF" />
                <Text style={styles.startBtnText}>
                  {t("routines.startRoutine")}
                </Text>
              </LinearGradient>
            </Pressable>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const createStyles = (theme: Theme, isDark: boolean) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.6)",
      justifyContent: "flex-end",
    },
    sheet: {
      maxHeight: SHEET_MAX_H,
      backgroundColor: theme.background.dark,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderColor: isDark
        ? "rgba(255,255,255,0.08)"
        : "rgba(0,0,0,0.08)",
      paddingBottom: Platform.OS === "ios" ? 24 : 16,
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOpacity: 0.3,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: -8 },
        },
        android: { elevation: 24 },
      }),
    },
    handleWrap: {
      alignItems: "center",
      paddingTop: 10,
      paddingBottom: 6,
    },
    handle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: isDark
        ? "rgba(255,255,255,0.18)"
        : "rgba(0,0,0,0.18)",
    },
    header: {
      flexDirection: "row",
      alignItems: "flex-start",
      paddingHorizontal: 20,
      paddingTop: 6,
      paddingBottom: 14,
      gap: 12,
    },
    title: {
      fontFamily: FONTS.extraBold,
      fontSize: 20,
      color: theme.foreground.white,
      textTransform: "uppercase",
      letterSpacing: -0.2,
    },
    closeBtn: {
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.background.darker,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark
        ? "rgba(255,255,255,0.08)"
        : "rgba(0,0,0,0.08)",
    },
    scroll: {
      flexGrow: 0,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingBottom: 20,
      gap: 16,
    },
    description: {
      fontFamily: FONTS.regular,
      fontSize: 14,
      lineHeight: 20,
      color: theme.foreground.gray,
    },
    statsRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.background.darker,
      borderRadius: 14,
      paddingVertical: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark
        ? "rgba(255,255,255,0.06)"
        : "rgba(0,0,0,0.06)",
    },
    statItem: {
      flex: 1,
      alignItems: "center",
    },
    statValue: {
      fontFamily: FONTS.extraBold,
      fontSize: 18,
      color: theme.foreground.white,
    },
    statLabel: {
      fontFamily: FONTS.medium,
      fontSize: 10,
      color: theme.foreground.gray,
      marginTop: 2,
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    statDivider: {
      width: StyleSheet.hairlineWidth,
      height: 28,
      backgroundColor: isDark
        ? "rgba(255,255,255,0.08)"
        : "rgba(0,0,0,0.08)",
    },
    sectionTitle: {
      fontFamily: FONTS.bold,
      fontSize: 15,
      color: theme.foreground.white,
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    musclesContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginTop: 10,
    },
    muscleTag: {
      backgroundColor: NAVY + "22",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: NAVY_LIGHT + "55",
    },
    muscleTagText: {
      fontFamily: FONTS.semiBold,
      fontSize: 12,
      color: isDark ? "#A8C4FF" : NAVY_LIGHT,
      textTransform: "capitalize",
    },
    exerciseCard: {
      backgroundColor: theme.background.darker,
      borderRadius: 14,
      padding: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark
        ? "rgba(255,255,255,0.05)"
        : "rgba(0,0,0,0.05)",
    },
    exerciseHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginBottom: 12,
    },
    exerciseThumbWrap: {
      position: "relative",
    },
    exerciseThumb: {
      width: 60,
      height: 60,
      borderRadius: 10,
      backgroundColor: isDark
        ? "rgba(255,255,255,0.04)"
        : "rgba(0,0,0,0.04)",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark
        ? "rgba(255,255,255,0.07)"
        : "rgba(0,0,0,0.07)",
    },
    exerciseThumbPlaceholder: {
      alignItems: "center",
      justifyContent: "center",
    },
    exerciseIndexBadge: {
      position: "absolute",
      top: -4,
      left: -4,
      minWidth: 22,
      height: 22,
      paddingHorizontal: 5,
      borderRadius: 7,
      backgroundColor: NAVY_LIGHT,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: theme.background.darker,
    },
    exerciseIndex: {
      fontFamily: FONTS.extraBold,
      fontSize: 11,
      color: "#FFFFFF",
    },
    exerciseName: {
      fontFamily: FONTS.bold,
      fontSize: 14,
      color: theme.foreground.white,
      flex: 1,
    },
    exerciseDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: isDark
        ? "rgba(255,255,255,0.06)"
        : "rgba(0,0,0,0.06)",
      marginBottom: 10,
    },
    exerciseMetaRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    exerciseMeta: {
      flex: 1,
      alignItems: "center",
    },
    exerciseMetaValue: {
      fontFamily: FONTS.extraBold,
      fontSize: 14,
      color: theme.foreground.white,
    },
    exerciseMetaLabel: {
      fontFamily: FONTS.medium,
      fontSize: 9,
      color: theme.foreground.gray,
      marginTop: 2,
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    exerciseMetaDivider: {
      width: StyleSheet.hairlineWidth,
      height: 22,
      backgroundColor: isDark
        ? "rgba(255,255,255,0.06)"
        : "rgba(0,0,0,0.06)",
    },
    stickyBar: {
      paddingHorizontal: 20,
      paddingTop: 12,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: isDark
        ? "rgba(255,255,255,0.06)"
        : "rgba(0,0,0,0.06)",
    },
    startBtn: {
      borderRadius: 14,
      overflow: "hidden",
    },
    startBtnInner: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 14,
    },
    startBtnText: {
      fontFamily: FONTS.extraBold,
      fontSize: 15,
      color: "#FFFFFF",
      letterSpacing: 1,
      textTransform: "uppercase",
    },
  });

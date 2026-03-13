import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Theme } from "../../../constants/themes";
import { useActiveWorkout } from "../../../contexts/ActiveWorkoutContext";
import { useTheme } from "../../../contexts/ThemeContext";
import { translateExerciseName, translateExerciseTerm, translateApiData } from "../../../utils/exerciseTranslator";
import {
  Difficulty,
  ExerciseDbExercise,
} from "../../../services/exerciseDbApi";

import { FONTS } from "../../../constants/fonts";

// ─── Constants ────────────────────────────────────────────────────────────────

const DIFFICULTY_CONFIG: Record<
  Difficulty,
  {
    label: string;
    color: string;
    bgColor: string;
    icon: "flash" | "fitness" | "flame";
  }
> = {
  beginner: {
    label: "Beginner",
    color: "#4CAF50",
    bgColor: "#4CAF5020",
    icon: "flash",
  },
  intermediate: {
    label: "Intermediate",
    color: "#FF9800",
    bgColor: "#FF980020",
    icon: "fitness",
  },
  advanced: {
    label: "Advanced",
    color: "#F44336",
    bgColor: "#F4433620",
    icon: "flame",
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ExerciseDetailPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { theme } = useTheme();
  const { exercise } = useLocalSearchParams<{ exercise: string }>();
  const { addExerciseToWorkout } = useActiveWorkout();
  const styles = createStyles(theme);

  const [exerciseData, setExerciseData] = useState<ExerciseDbExercise | null>(
    null,
  );

  useEffect(() => {
    if (exercise) {
      try {
        const parsed = JSON.parse(exercise);
        setExerciseData(parsed);
      } catch (e) {
        console.error("Failed to parse exercise data:", e);
      }
    }
  }, [exercise]);

  if (!exerciseData) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons
              name="arrow-back"
              size={24}
              color={theme.foreground.white}
            />
          </TouchableOpacity>
          <Text style={styles.title}>{t("exerciseDetail.title")}</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centered}>
          <Text style={styles.emptyText}>{t("exerciseDetail.notFound")}</Text>
        </View>
      </View>
    );
  }

  const diff = DIFFICULTY_CONFIG[exerciseData.difficulty ?? "intermediate"];

  const handleAddExercise = () => {
    addExerciseToWorkout(exerciseData);
    router.back();
  };

  const uniqueBodyParts = [
    ...new Set(
      exerciseData.allBodyParts?.length
        ? exerciseData.allBodyParts
        : [exerciseData.bodyPart],
    ),
  ].map(bp => translateExerciseTerm(bp, "bodyParts"));
  
  const uniqueEquipments = [
    ...new Set(
      exerciseData.allEquipments?.length
        ? exerciseData.allEquipments
        : [exerciseData.equipment],
    ),
  ].map(eq => translateExerciseTerm(eq, "equipment"));
  
  const secondaryMuscles = (exerciseData.secondaryMuscles ?? []).map(m => 
    translateExerciseTerm(m, "secondaryMuscles")
  );
  
  const targetMuscle = translateExerciseTerm(exerciseData.target || "", "targetMuscles");

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerBack}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={theme.foreground.white}
          />
        </TouchableOpacity>
        <Text style={styles.title}>Exercise Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* GIF Preview */}
        <View style={styles.videoContainer}>
          {exerciseData.gifUrl ? (
            <Image
              source={{ uri: exerciseData.gifUrl }}
              style={styles.video}
              contentFit="cover"
              transition={300}
            />
          ) : (
            <View style={styles.videoPlaceholder}>
              <Ionicons
                name="barbell-outline"
                size={64}
                color={theme.foreground.gray}
              />
            </View>
          )}
        </View>

        {/* Exercise name + tags */}
        <View style={styles.titleSection}>
          <Text style={styles.exerciseName}>
            {translateExerciseName(exerciseData.name)}
          </Text>
          <View style={styles.tagsRow}>
            {targetMuscle && (
              <View
                style={[
                  styles.tag,
                  {
                    backgroundColor: theme.primary.main + "20",
                    borderColor: theme.primary.main,
                  },
                ]}
              >
                <Text style={[styles.tagText, { color: theme.primary.main }]}>
                  {targetMuscle}
                </Text>
              </View>
            )}
            {uniqueBodyParts.map((bp, idx) => (
              <View key={`${bp}-${idx}`} style={styles.tag}>
                <Text style={styles.tagText}>{bp}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Stat grid */}
        <View style={styles.statGrid}>
          <View style={styles.statCard}>
            <Ionicons
              name="barbell-outline"
              size={20}
              color={theme.primary.main}
            />
            <Text style={styles.statLabel}>{t("exerciseDetail.equipment")}</Text>
            <Text style={styles.statValue} numberOfLines={2}>
              {uniqueEquipments.join(", ")}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name={diff.icon} size={20} color={diff.color} />
            <Text style={styles.statLabel}>{t("exerciseDetail.difficulty")}</Text>
            <Text style={[styles.statValue, { color: diff.color }]}>
              {translateApiData(diff.label.toLowerCase())}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons
              name="body-outline"
              size={20}
              color={theme.primary.main}
            />
            <Text style={styles.statLabel}>{t("exerciseDetail.bodyPart")}</Text>
            <Text style={styles.statValue} numberOfLines={2}>
              {uniqueBodyParts.join(", ")}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons
              name="locate-outline"
              size={20}
              color={theme.primary.main}
            />
            <Text style={styles.statLabel}>{t("exerciseDetail.target")}</Text>
            <Text style={styles.statValue} numberOfLines={2}>
              {targetMuscle}
            </Text>
          </View>
        </View>

        {/* Equipment */}
        {uniqueEquipments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("exerciseDetail.equipmentNeeded")}</Text>
            <View style={styles.badgeList}>
              {uniqueEquipments.map((eq) => (
                <View key={eq} style={styles.equipmentBadge}>
                  <Ionicons
                    name="barbell-outline"
                    size={14}
                    color={theme.primary.main}
                  />
                  <Text style={styles.equipmentText}>{eq}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Primary muscle */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("exerciseDetail.primaryMuscle")}</Text>
          <View style={styles.badgeList}>
            <View style={styles.primaryMuscleBadge}>
              <View
                style={[
                  styles.muscleDot,
                  { backgroundColor: theme.primary.main },
                ]}
              />
              <Text
                style={[styles.muscleText, { color: theme.foreground.white }]}
              >
                {targetMuscle}
              </Text>
              <View
                style={[
                  styles.primaryBadgePill,
                  { backgroundColor: theme.primary.main + "20" },
                ]}
              >
                <Text
                  style={[
                    styles.primaryBadgePillText,
                    { color: theme.primary.main },
                  ]}
                >
                  {t("exerciseDetail.primary")}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Secondary muscles */}
        {secondaryMuscles.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("exerciseDetail.secondaryMuscles")}</Text>
            <View style={styles.badgeList}>
              {secondaryMuscles.map((m) => (
                <View key={m} style={styles.muscleBadge}>
                  <View
                    style={[
                      styles.muscleDot,
                      { backgroundColor: theme.foreground.gray },
                    ]}
                  />
                  <Text style={styles.muscleText}>{m}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* How to perform */}
        <View style={[styles.section, styles.tipsCard]}>
          <View style={styles.tipsHeader}>
            <Ionicons
              name="information-circle-outline"
              size={18}
              color={theme.primary.main}
            />
            <Text style={styles.sectionTitle}>{t("exerciseDetail.howToPerform")}</Text>
          </View>
          <Text style={styles.description}>
            {t("exerciseDetail.focusOn", { target: targetMuscle })}{" "}
            {diff.label === "Advanced"
              ? t("exerciseDetail.advancedTip")
              : diff.label === "Beginner"
                ? t("exerciseDetail.beginnerTip")
                : t("exerciseDetail.intermediateTip")}
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Add to workout */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddExercise}
          activeOpacity={0.8}
        >
          <Ionicons
            name="add-circle"
            size={24}
            color={theme.background.dark}
            style={{ marginRight: 8 }}
          />
          <Text style={styles.addButtonText}>{t("exerciseDetail.addToWorkout")}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background.dark },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 16,
      backgroundColor: theme.background.darker,
    },
    headerBack: { padding: 4 },
    title: { fontSize: 18, fontFamily: FONTS.semiBold, color: theme.foreground.white },
    content: { flex: 1, paddingHorizontal: 16, paddingTop: 20 },
    centered: { flex: 1, justifyContent: "center", alignItems: "center" },
    emptyText: { fontSize: 16, color: theme.foreground.gray, marginTop: 12 },
    // GIF
    videoContainer: {
      width: "100%",
      height: 300,
      borderRadius: 20,
      overflow: "hidden",
      marginBottom: 20,
      backgroundColor: theme.background.darker,
    },
    video: { width: "100%", height: "100%" },
    videoPlaceholder: {
      width: "100%",
      height: "100%",
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme.background.darker,
    },
    // Title
    titleSection: { marginBottom: 20 },
    exerciseName: {
      fontSize: 26,
      fontFamily: FONTS.bold,
      color: theme.foreground.white,
      marginBottom: 12,
      textTransform: "capitalize",
    },
    tagsRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
    tag: {
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 20,
      backgroundColor: theme.background.accent,
      borderWidth: 1,
      borderColor: theme.background.accent,
    },
    tagText: {
      fontSize: 12,
      fontFamily: FONTS.semiBold,
      color: theme.foreground.gray,
      textTransform: "capitalize",
    },
    // Stat grid
    statGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      marginBottom: 24,
    },
    statCard: {
      flex: 1,
      minWidth: "45%",
      backgroundColor: theme.background.darker,
      borderRadius: 14,
      padding: 14,
      gap: 6,
      alignItems: "flex-start",
    },
    statLabel: {
      fontSize: 11,
      color: theme.foreground.gray,
      fontFamily: FONTS.semiBold,
    },
    statValue: {
      fontSize: 13,
      color: theme.foreground.white,
      fontFamily: FONTS.bold,
      textTransform: "capitalize",
    },
    // Sections
    section: { marginBottom: 24 },
    sectionTitle: {
      fontSize: 15,
      fontFamily: FONTS.bold,
      color: theme.foreground.white,
      marginBottom: 12,
    },
    badgeList: { gap: 8 },
    equipmentBadge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.background.darker,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 10,
      gap: 8,
    },
    equipmentText: {
      fontSize: 14,
      color: theme.foreground.white,
      textTransform: "capitalize",
    },
    primaryMuscleBadge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.background.darker,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 10,
      gap: 10,
      borderLeftWidth: 3,
      borderLeftColor: theme.primary.main,
    },
    muscleBadge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.background.darker,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 10,
      gap: 10,
      borderLeftWidth: 3,
      borderLeftColor: theme.foreground.gray + "60",
    },
    muscleDot: { width: 8, height: 8, borderRadius: 4 },
    muscleText: {
      flex: 1,
      fontSize: 14,
      color: theme.foreground.gray,
      textTransform: "capitalize",
    },
    primaryBadgePill: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
    },
    primaryBadgePillText: { fontSize: 10, fontFamily: FONTS.bold },
    // Tips
    tipsCard: {
      backgroundColor: theme.background.darker,
      borderRadius: 14,
      padding: 14,
    },
    tipsHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginBottom: 8,
    },
    description: { fontSize: 14, color: theme.foreground.gray, lineHeight: 22 },
    // Footer
    footer: {
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderTopWidth: 1,
      borderTopColor: theme.background.darker,
      backgroundColor: theme.background.dark,
    },
    addButton: {
      backgroundColor: theme.primary.main,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: 14,
      borderRadius: 12,
    },
    addButtonText: {
      fontSize: 16,
      fontFamily: FONTS.semiBold,
      color: theme.background.dark,
    },
  });

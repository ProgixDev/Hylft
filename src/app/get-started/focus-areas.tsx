import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Theme } from "../../constants/themes";
import { useTheme } from "../../contexts/ThemeContext";

import { FONTS } from "../../constants/fonts";
import ChipButton from "../../components/ui/ChipButton";

interface MuscleGroup {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}

const MUSCLE_GROUPS: MuscleGroup[] = [
  { id: "chest", icon: "fitness-outline", label: "Chest" },
  { id: "back", icon: "body-outline", label: "Back" },
  { id: "shoulders", icon: "arrow-up-circle-outline", label: "Shoulders" },
  { id: "arms", icon: "barbell-outline", label: "Arms" },
  { id: "core", icon: "ellipse-outline", label: "Core / Abs" },
  { id: "quads", icon: "walk-outline", label: "Quads" },
  { id: "hamstrings", icon: "footsteps-outline", label: "Hamstrings" },
  { id: "glutes", icon: "trending-up-outline", label: "Glutes" },
  { id: "calves", icon: "resize-outline", label: "Calves" },
  { id: "full_body", icon: "flash-outline", label: "Full Body" },
];

export default function FocusAreas() {
  const router = useRouter();
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((s) => s !== id)
        : prev.length < 5
          ? [...prev, id]
          : prev,
    );
  };

  const handleContinue = async () => {
    if (selected.length === 0) return;
    await AsyncStorage.setItem("@hylift_focus_areas", JSON.stringify(selected));
    router.navigate("/get-started/health-connect");
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.stepRow}>
          <Text style={[styles.stepText, { color: theme.primary.main }]}>
            STEP 10 OF 13
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: theme.primary.main,
                  width: `${(10 / 13) * 100}%`,
                },
              ]}
            />
          </View>
        </View>

        <Text style={styles.title}>Focus Areas</Text>
        <Text style={styles.subtitle}>
          Which muscles do you want to prioritize? Select up to 5.
        </Text>

        <View style={styles.grid}>
          {MUSCLE_GROUPS.map((muscle) => {
            const isSelected = selected.includes(muscle.id);
            return (
              <TouchableOpacity
                key={muscle.id}
                style={[
                  styles.chip,
                  {
                    borderColor: isSelected
                      ? theme.primary.main
                      : theme.background.accent,
                    backgroundColor: isSelected
                      ? theme.primary.main + "14"
                      : theme.background.darker,
                  },
                ]}
                onPress={() => toggle(muscle.id)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.chipIcon,
                    {
                      backgroundColor: isSelected
                        ? theme.primary.main + "25"
                        : theme.background.accent,
                    },
                  ]}
                >
                  <Ionicons
                    name={muscle.icon}
                    size={20}
                    color={
                      isSelected ? theme.primary.main : theme.foreground.gray
                    }
                  />
                </View>
                <Text
                  style={[
                    styles.chipLabel,
                    {
                      color: isSelected
                        ? theme.primary.main
                        : theme.foreground.white,
                    },
                  ]}
                >
                  {muscle.label}
                </Text>
                {isSelected && (
                  <Ionicons
                    name="checkmark-circle"
                    size={18}
                    color={theme.primary.main}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {selected.length > 0 && (
          <Text
            style={[styles.selectedCount, { color: theme.foreground.gray }]}
          >
            {selected.length}/5 selected
          </Text>
        )}

        {/* Visual preview */}
        {selected.length > 0 && (
          <View
            style={[
              styles.previewBox,
              { backgroundColor: theme.background.darker },
            ]}
          >
            <Ionicons
              name="sparkles-outline"
              size={16}
              color={theme.primary.main}
            />
            <Text
              style={[styles.previewText, { color: theme.foreground.gray }]}
            >
              Your workouts will emphasize{" "}
              <Text
                style={{ color: theme.foreground.white, fontFamily: FONTS.semiBold }}
              >
                {selected
                  .map(
                    (id) => MUSCLE_GROUPS.find((m) => m.id === id)?.label ?? id,
                  )
                  .join(", ")}
              </Text>{" "}
              with extra volume and weekly frequency.
            </Text>
          </View>
        )}
      </ScrollView>

      <ChipButton
        title="Continue"
        onPress={handleContinue}
        variant="primary"
        size="lg"
        fullWidth
        disabled={selected.length === 0}
      />
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background.dark,
      paddingHorizontal: 24,
      paddingBottom: 20,
    },
    scrollContent: {
      paddingBottom: 20,
    },
    stepRow: {
      marginBottom: 20,
      marginTop: 8,
    },
    stepText: {
      fontSize: 11,
      fontFamily: FONTS.bold,
      letterSpacing: 1.2,
      marginBottom: 8,
    },
    progressBar: {
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.background.accent,
    },
    progressFill: {
      height: "100%",
      borderRadius: 2,
    },
    title: {
      fontSize: 30,
      fontFamily: FONTS.bold,
      color: theme.foreground.white,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 15,
      color: theme.foreground.gray,
      marginBottom: 28,
      lineHeight: 22,
    },
    grid: {
      gap: 10,
    },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1.5,
      borderRadius: 14,
      padding: 14,
      gap: 12,
    },
    chipIcon: {
      width: 38,
      height: 38,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    chipLabel: {
      flex: 1,
      fontSize: 15,
      fontFamily: FONTS.semiBold,
    },
    selectedCount: {
      textAlign: "center",
      fontSize: 13,
      marginTop: 16,
    },
    previewBox: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
      padding: 14,
      borderRadius: 12,
      marginTop: 16,
    },
    previewText: {
      flex: 1,
      fontSize: 13,
      lineHeight: 20,
    },
  });
}

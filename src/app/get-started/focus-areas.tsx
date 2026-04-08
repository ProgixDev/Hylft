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
import { useTranslation } from "react-i18next";
import { Theme } from "../../constants/themes";
import { useTheme } from "../../contexts/ThemeContext";

import { FONTS } from "../../constants/fonts";
import ChipButton from "../../components/ui/ChipButton";

interface MuscleGroup {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const MUSCLE_GROUPS: MuscleGroup[] = [
  { id: "full_body", icon: "flash-outline" },
  { id: "chest", icon: "fitness-outline" },
  { id: "back", icon: "body-outline" },
  { id: "arms", icon: "barbell-outline" },
  { id: "core", icon: "ellipse-outline" },
  { id: "legs", icon: "walk-outline" },
];

export default function FocusAreas() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTranslation();
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
            {t("onboarding.stepOf", { current: 10, total: 13 })}
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

        <Text style={styles.title}>{t("onboarding.focusAreas.title")}</Text>
        <Text style={styles.subtitle}>
          {t("onboarding.focusAreas.subtitle")}
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
                  {t(`onboarding.focusAreas.muscles.${muscle.id}`)}
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
            {t("onboarding.focusAreas.selectedCount", { count: selected.length })}
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
              {t("onboarding.focusAreas.previewPrefix")}{" "}
              <Text
                style={{ color: theme.foreground.white, fontFamily: FONTS.semiBold }}
              >
                {selected
                  .map((id) => t(`onboarding.focusAreas.muscles.${id}`))
                  .join(", ")}
              </Text>{" "}
              {t("onboarding.focusAreas.previewSuffix")}
            </Text>
          </View>
        )}
      </ScrollView>

      <ChipButton
        title={t("common.continue")}
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
      paddingHorizontal: 20,
      paddingBottom: 16,
    },
    scrollContent: {
      paddingBottom: 16,
    },
    stepRow: {
      marginBottom: 14,
      marginTop: 4,
    },
    stepText: {
      fontSize: 11,
      fontFamily: FONTS.bold,
      letterSpacing: 1.2,
      marginBottom: 6,
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
      fontSize: 24,
      fontFamily: FONTS.bold,
      color: theme.foreground.white,
      marginBottom: 6,
    },
    subtitle: {
      fontSize: 13,
      color: theme.foreground.gray,
      marginBottom: 18,
      lineHeight: 20,
    },
    grid: {
      gap: 7,
    },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1.5,
      borderRadius: 10,
      padding: 10,
      gap: 10,
    },
    chipIcon: {
      width: 32,
      height: 32,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    chipLabel: {
      flex: 1,
      fontSize: 13,
      fontFamily: FONTS.semiBold,
    },
    selectedCount: {
      textAlign: "center",
      fontSize: 12,
      marginTop: 10,
    },
    previewBox: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 8,
      padding: 10,
      borderRadius: 10,
      marginTop: 10,
    },
    previewText: {
      flex: 1,
      fontSize: 13,
      lineHeight: 20,
    },
  });
}

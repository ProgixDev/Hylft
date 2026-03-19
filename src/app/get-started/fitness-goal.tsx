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

interface GoalOption {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const GOAL_ICONS: GoalOption[] = [
  { id: "build_muscle", icon: "barbell-outline" },
  { id: "lose_fat", icon: "flame-outline" },
  { id: "get_stronger", icon: "trophy-outline" },
  { id: "stay_fit", icon: "heart-outline" },
  { id: "athletic", icon: "flash-outline" },
  { id: "body_recomp", icon: "body-outline" },
];

export default function FitnessGoal() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(theme);
  const [selected, setSelected] = useState<string[]>([]);

  const toggleGoal = (id: string) => {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((g) => g !== id)
        : prev.length < 3
          ? [...prev, id]
          : prev,
    );
  };

  const handleContinue = async () => {
    if (selected.length === 0) return;
    await AsyncStorage.setItem(
      "@hylift_fitness_goals",
      JSON.stringify(selected),
    );
    router.navigate("/get-started/experience-level");
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
            {t("onboarding.stepOf", { current: 3, total: 13 })}
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: theme.primary.main,
                  width: `${(3 / 13) * 100}%`,
                },
              ]}
            />
          </View>
        </View>

        <Text style={styles.title}>{t("onboarding.fitnessGoal.title")}</Text>
        <Text style={styles.subtitle}>
          {t("onboarding.fitnessGoal.subtitle")}
        </Text>

        <View style={styles.grid}>
          {GOAL_ICONS.map((goal) => {
            const isSelected = selected.includes(goal.id);
            return (
              <TouchableOpacity
                key={goal.id}
                style={[
                  styles.goalCard,
                  {
                    borderColor: isSelected
                      ? theme.primary.main
                      : theme.background.accent,
                    backgroundColor: isSelected
                      ? theme.primary.main + "12"
                      : theme.background.darker,
                  },
                ]}
                onPress={() => toggleGoal(goal.id)}
                activeOpacity={0.7}
              >
                <View style={styles.goalCardContent}>
                  <View
                    style={[
                      styles.goalIcon,
                      {
                        backgroundColor: isSelected
                          ? theme.primary.main + "22"
                          : theme.background.accent,
                      },
                    ]}
                  >
                    <Ionicons
                      name={goal.icon}
                      size={24}
                      color={
                        isSelected ? theme.primary.main : theme.foreground.gray
                      }
                    />
                  </View>
                  <View style={styles.goalTextContainer}>
                    <Text
                      style={[
                        styles.goalLabel,
                        {
                          color: isSelected
                            ? theme.primary.main
                            : theme.foreground.white,
                        },
                      ]}
                    >
                      {t(`onboarding.fitnessGoal.goals.${goal.id}.label`)}
                    </Text>
                    <Text
                      style={[
                        styles.goalDesc,
                        { color: theme.foreground.gray },
                      ]}
                    >
                      {t(`onboarding.fitnessGoal.goals.${goal.id}.description`)}
                    </Text>
                  </View>
                  {isSelected && (
                    <View
                      style={[
                        styles.checkBadge,
                        { backgroundColor: theme.primary.main },
                      ]}
                    >
                      <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {selected.length > 0 && (
          <Text
            style={[styles.selectedCount, { color: theme.foreground.gray }]}
          >
            {t("onboarding.fitnessGoal.selectedCount", { count: selected.length })}
          </Text>
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
      flexDirection: "column",
      gap: 8,
    },
    goalCard: {
      borderWidth: 1.5,
      borderRadius: 12,
      padding: 12,
    },
    goalCardContent: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
    },
    goalCardTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 12,
    },
    goalTextContainer: {
      flex: 1,
    },
    goalIcon: {
      width: 40,
      height: 40,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    checkBadge: {
      width: 22,
      height: 22,
      borderRadius: 11,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    goalLabel: {
      fontSize: 14,
      fontFamily: FONTS.bold,
      marginBottom: 2,
    },
    goalDesc: {
      fontSize: 12,
      lineHeight: 17,
    },
    selectedCount: {
      textAlign: "center",
      fontSize: 12,
      marginTop: 12,
    },
  });
}

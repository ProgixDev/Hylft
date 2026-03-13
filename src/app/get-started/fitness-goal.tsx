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

interface GoalOption {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description: string;
}

const GOALS: GoalOption[] = [
  {
    id: "build_muscle",
    icon: "barbell-outline",
    label: "Build Muscle",
    description: "Gain size and strength with hypertrophy training",
  },
  {
    id: "lose_fat",
    icon: "flame-outline",
    label: "Lose Fat",
    description: "Cut body fat while preserving lean muscle mass",
  },
  {
    id: "get_stronger",
    icon: "trophy-outline",
    label: "Get Stronger",
    description: "Focus on increasing your 1RM and raw strength",
  },
  {
    id: "stay_fit",
    icon: "heart-outline",
    label: "Stay Fit & Healthy",
    description: "Maintain a balanced, active lifestyle",
  },
  {
    id: "athletic",
    icon: "flash-outline",
    label: "Athletic Performance",
    description: "Improve speed, agility, and sport-specific skills",
  },
  {
    id: "body_recomp",
    icon: "body-outline",
    label: "Body Recomposition",
    description: "Lose fat and gain muscle simultaneously",
  },
];

export default function FitnessGoal() {
  const router = useRouter();
  const { theme } = useTheme();
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
            STEP 2 OF 13
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: theme.primary.main,
                  width: `${(2 / 13) * 100}%`,
                },
              ]}
            />
          </View>
        </View>

        <Text style={styles.title}>What are your goals?</Text>
        <Text style={styles.subtitle}>
          Select up to 3 goals to personalize your training
        </Text>

        <View style={styles.grid}>
          {GOALS.map((goal) => {
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
                      {goal.label}
                    </Text>
                    <Text
                      style={[
                        styles.goalDesc,
                        { color: theme.foreground.gray },
                      ]}
                    >
                      {goal.description}
                    </Text>
                  </View>
                  {isSelected && (
                    <View
                      style={[
                        styles.checkBadge,
                        { backgroundColor: theme.primary.main },
                      ]}
                    >
                      <Ionicons name="checkmark" size={14} color="#0B0D0E" />
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
            {selected.length}/3 selected
          </Text>
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
      flexDirection: "column",
      gap: 12,
    },
    goalCard: {
      borderWidth: 1.5,
      borderRadius: 16,
      padding: 16,
    },
    goalCardContent: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
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
      width: 48,
      height: 48,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    checkBadge: {
      width: 26,
      height: 26,
      borderRadius: 13,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    goalLabel: {
      fontSize: 16,
      fontFamily: FONTS.bold,
      marginBottom: 4,
    },
    goalDesc: {
      fontSize: 13,
      lineHeight: 19,
    },
    selectedCount: {
      textAlign: "center",
      fontSize: 13,
      marginTop: 16,
    },
  });
}

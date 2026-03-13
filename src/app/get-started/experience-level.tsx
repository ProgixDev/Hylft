import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Theme } from "../../constants/themes";
import { useTheme } from "../../contexts/ThemeContext";

import { FONTS } from "../../constants/fonts";
import ChipButton from "../../components/ui/ChipButton";

interface LevelOption {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  timeframe: string;
  description: string;
}

const LEVELS: LevelOption[] = [
  {
    id: "beginner",
    icon: "leaf-outline",
    label: "Beginner",
    timeframe: "0 – 6 months",
    description:
      "New to the gym or coming back after a long break. Learning the basics of form and programming.",
  },
  {
    id: "intermediate",
    icon: "barbell-outline",
    label: "Intermediate",
    timeframe: "6 months – 2 years",
    description:
      "Consistent training, comfortable with compound lifts. Ready for structured programming.",
  },
  {
    id: "advanced",
    icon: "trophy-outline",
    label: "Advanced",
    timeframe: "2 – 5 years",
    description:
      "Strong foundation, periodized training, chasing PRs. Understands progressive overload.",
  },
  {
    id: "elite",
    icon: "diamond-outline",
    label: "Elite",
    timeframe: "5+ years",
    description:
      "Competitive lifter or experienced athlete. Training is highly individualized.",
  },
];

export default function ExperienceLevel() {
  const router = useRouter();
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [selected, setSelected] = useState<string>("");

  const handleContinue = async () => {
    if (!selected) return;
    await AsyncStorage.setItem("@hylift_experience_level", selected);
    router.navigate("/get-started/age");
  };

  return (
    <View style={styles.container}>
      <View style={{ flex: 1 }}>
        <View style={styles.stepRow}>
          <Text style={[styles.stepText, { color: theme.primary.main }]}>
            STEP 3 OF 13
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

        <Text style={styles.title}>Experience Level</Text>
        <Text style={styles.subtitle}>
          Help us match workouts to your skill level
        </Text>

        <View style={styles.list}>
          {LEVELS.map((level) => {
            const isSelected = selected === level.id;
            return (
              <TouchableOpacity
                key={level.id}
                style={[
                  styles.levelCard,
                  {
                    borderColor: isSelected
                      ? theme.primary.main
                      : theme.background.accent,
                    backgroundColor: isSelected
                      ? theme.primary.main + "10"
                      : theme.background.darker,
                  },
                ]}
                onPress={() => setSelected(level.id)}
                activeOpacity={0.7}
              >
                <View style={styles.levelLeft}>
                  <View
                    style={[
                      styles.iconCircle,
                      {
                        backgroundColor: isSelected
                          ? theme.primary.main + "22"
                          : theme.background.accent,
                      },
                    ]}
                  >
                    <Ionicons
                      name={level.icon}
                      size={20}
                      color={
                        isSelected ? theme.primary.main : theme.foreground.gray
                      }
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.labelRow}>
                      <Text
                        style={[
                          styles.levelLabel,
                          {
                            color: isSelected
                              ? theme.primary.main
                              : theme.foreground.white,
                          },
                        ]}
                      >
                        {level.label}
                      </Text>
                      <Text
                        style={[
                          styles.timeframe,
                          { color: theme.foreground.gray },
                        ]}
                      >
                        {level.timeframe}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.levelDesc,
                        { color: theme.foreground.gray },
                      ]}
                      numberOfLines={2}
                    >
                      {level.description}
                    </Text>
                  </View>
                </View>
                {isSelected && (
                  <View
                    style={[
                      styles.radioOuter,
                      { borderColor: theme.primary.main },
                    ]}
                  >
                    <View
                      style={[
                        styles.radioInner,
                        { backgroundColor: theme.primary.main },
                      ]}
                    />
                  </View>
                )}
                {!isSelected && (
                  <View
                    style={[
                      styles.radioOuter,
                      { borderColor: theme.foreground.gray },
                    ]}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <ChipButton
        title="Continue"
        onPress={handleContinue}
        variant="primary"
        size="lg"
        fullWidth
        disabled={!selected}
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
    list: {
      gap: 12,
    },
    levelCard: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1.5,
      borderRadius: 16,
      padding: 16,
      gap: 12,
    },
    levelLeft: {
      flex: 1,
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
    },
    iconCircle: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: "center",
      justifyContent: "center",
    },
    labelRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 4,
    },
    levelLabel: {
      fontSize: 16,
      fontFamily: FONTS.bold,
    },
    timeframe: {
      fontSize: 11,
      fontFamily: FONTS.medium,
    },
    levelDesc: {
      fontSize: 12,
      lineHeight: 18,
    },
    radioOuter: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      alignItems: "center",
      justifyContent: "center",
    },
    radioInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
  });
}

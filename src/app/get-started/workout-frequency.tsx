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

interface FreqOption {
  id: string;
  days: number;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const FREQUENCIES: FreqOption[] = [
  {
    id: "2",
    days: 2,
    label: "2 days / week",
    description: "Light schedule — perfect for beginners or busy weeks",
    icon: "walk-outline",
  },
  {
    id: "3",
    days: 3,
    label: "3 days / week",
    description: "Classic 3-day split — great balance of training and recovery",
    icon: "fitness-outline",
  },
  {
    id: "4",
    days: 4,
    label: "4 days / week",
    description:
      "Upper / Lower or Push / Pull — solid for intermediate lifters",
    icon: "barbell-outline",
  },
  {
    id: "5",
    days: 5,
    label: "5 days / week",
    description: "PPL or Bro split — serious volume for serious gains",
    icon: "flame-outline",
  },
  {
    id: "6",
    days: 6,
    label: "6 days / week",
    description: "PPL × 2 — maximum frequency for advanced athletes",
    icon: "flash-outline",
  },
];

export default function WorkoutFrequency() {
  const router = useRouter();
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [selected, setSelected] = useState<string>("");

  const handleContinue = async () => {
    if (!selected) return;
    await AsyncStorage.setItem("@hylift_workout_frequency", selected);
    router.navigate("/get-started/focus-areas");
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
            STEP 9 OF 13
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: theme.primary.main,
                  width: `${(9 / 13) * 100}%`,
                },
              ]}
            />
          </View>
        </View>

        <Text style={styles.title}>How often do you train?</Text>
        <Text style={styles.subtitle}>
          We&apos;ll build your weekly schedule around this
        </Text>

        <View style={styles.list}>
          {FREQUENCIES.map((freq) => {
            const isSelected = selected === freq.id;
            return (
              <TouchableOpacity
                key={freq.id}
                style={[
                  styles.freqCard,
                  {
                    borderColor: isSelected
                      ? theme.primary.main
                      : theme.background.accent,
                    backgroundColor: isSelected
                      ? theme.primary.main + "10"
                      : theme.background.darker,
                  },
                ]}
                onPress={() => setSelected(freq.id)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.daysBadge,
                    {
                      backgroundColor: isSelected
                        ? theme.primary.main
                        : theme.background.accent,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.daysNum,
                      {
                        color: isSelected ? "#0B0D0E" : theme.foreground.white,
                      },
                    ]}
                  >
                    {freq.days}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.freqLabel,
                      {
                        color: isSelected
                          ? theme.primary.main
                          : theme.foreground.white,
                      },
                    ]}
                  >
                    {freq.label}
                  </Text>
                  <Text
                    style={[styles.freqDesc, { color: theme.foreground.gray }]}
                  >
                    {freq.description}
                  </Text>
                </View>
                <Ionicons
                  name={freq.icon}
                  size={20}
                  color={
                    isSelected ? theme.primary.main : theme.foreground.gray
                  }
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

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
    list: {
      gap: 10,
    },
    freqCard: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1.5,
      borderRadius: 14,
      padding: 14,
      gap: 14,
    },
    daysBadge: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    daysNum: {
      fontSize: 18,
      fontFamily: FONTS.extraBold,
    },
    freqLabel: {
      fontSize: 15,
      fontFamily: FONTS.bold,
      marginBottom: 2,
    },
    freqDesc: {
      fontSize: 12,
      lineHeight: 17,
    },
  });
}

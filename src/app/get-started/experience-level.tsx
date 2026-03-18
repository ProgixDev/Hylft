import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Theme } from "../../constants/themes";
import { useTheme } from "../../contexts/ThemeContext";

import { FONTS } from "../../constants/fonts";
import ChipButton from "../../components/ui/ChipButton";

interface LevelOption {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const LEVELS: LevelOption[] = [
  { id: "beginner", icon: "leaf-outline" },
  { id: "intermediate", icon: "barbell-outline" },
  { id: "advanced", icon: "trophy-outline" },
  { id: "elite", icon: "diamond-outline" },
];

export default function ExperienceLevel() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTranslation();
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
            {t("onboarding.stepOf", { current: 4, total: 13 })}
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: theme.primary.main,
                  width: `${(4 / 13) * 100}%`,
                },
              ]}
            />
          </View>
        </View>

        <Text style={styles.title}>{t("onboarding.experienceLevel.title")}</Text>
        <Text style={styles.subtitle}>
          {t("onboarding.experienceLevel.subtitle")}
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
                        {t(`onboarding.experienceLevel.levels.${level.id}.label`)}
                      </Text>
                      <Text
                        style={[
                          styles.timeframe,
                          { color: theme.foreground.gray },
                        ]}
                      >
                        {t(`onboarding.experienceLevel.levels.${level.id}.timeframe`)}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.levelDesc,
                        { color: theme.foreground.gray },
                      ]}
                      numberOfLines={2}
                    >
                      {t(`onboarding.experienceLevel.levels.${level.id}.description`)}
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
        title={t("common.continue")}
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
      paddingHorizontal: 20,
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
    list: {
      gap: 8,
    },
    levelCard: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1.5,
      borderRadius: 12,
      padding: 12,
      gap: 10,
    },
    levelLeft: {
      flex: 1,
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
    },
    iconCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
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
      fontSize: 14,
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
      width: 20,
      height: 20,
      borderRadius: 10,
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

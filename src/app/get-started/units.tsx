import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
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

type UnitOption = {
  label: string;
  value: string;
};

export default function UnitsSelection() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(theme);
  const [selectedWeight, setSelectedWeight] = useState<string>("kg");
  const [selectedDistance, setSelectedDistance] = useState<string>("km");
  const [selectedHeight, setSelectedHeight] = useState<string>("cm");

  const weightOptions: UnitOption[] = [
    { label: t("onboarding.units.kilograms"), value: "kg" },
    { label: t("onboarding.units.pounds"), value: "lbs" },
  ];

  const distanceOptions: UnitOption[] = [
    { label: t("onboarding.units.kilometers"), value: "km" },
    { label: t("onboarding.units.miles"), value: "mi" },
  ];

  const heightOptions: UnitOption[] = [
    { label: t("onboarding.units.centimeters"), value: "cm" },
    { label: t("onboarding.units.inches"), value: "in" },
  ];

  const handleContinue = async () => {
    const unitSystem = selectedWeight === "kg" ? "metric" : "imperial";
    await AsyncStorage.setItem("@hylift_unit_system", unitSystem);
    router.navigate("/get-started/fitness-goal");
  };

  const renderOptionGroup = (
    title: string,
    options: UnitOption[],
    selected: string,
    onSelect: (value: string) => void,
  ) => (
    <View style={styles.optionGroup}>
      <Text style={styles.optionTitle}>{title}</Text>
      <View style={styles.optionsRow}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.optionButton,
              selected === option.value && styles.optionButtonSelected,
            ]}
            onPress={() => onSelect(option.value)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.optionText,
                selected === option.value && styles.optionTextSelected,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.stepRow}>
          <Text style={[styles.stepText, { color: theme.primary.main }]}>
            {t("onboarding.units.step")}
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: theme.primary.main,
                  width: `${(1 / 13) * 100}%`,
                },
              ]}
            />
          </View>
        </View>

        <Text style={styles.title}>{t("onboarding.units.title")}</Text>
        <Text style={styles.subtitle}>
          {t("onboarding.units.subtitle")}
        </Text>

        <View style={styles.optionsContainer}>
          {renderOptionGroup(
            t("onboarding.units.weight"),
            weightOptions,
            selectedWeight,
            setSelectedWeight,
          )}
          {renderOptionGroup(
            t("onboarding.units.distance"),
            distanceOptions,
            selectedDistance,
            setSelectedDistance,
          )}
          {renderOptionGroup(
            t("onboarding.units.height"),
            heightOptions,
            selectedHeight,
            setSelectedHeight,
          )}
        </View>
      </ScrollView>

      <ChipButton
        title={t("common.continue")}
        onPress={handleContinue}
        variant="primary"
        size="lg"
        fullWidth
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
    content: {
      flex: 1,
    },
    title: {
      fontSize: 32,
      fontFamily: FONTS.bold,
      color: theme.foreground.white,
      marginVertical: 8,
    },
    subtitle: {
      fontSize: 16,
      color: theme.foreground.gray,
      marginBottom: 20,
    },
    optionsContainer: {
      gap: 32,
    },
    optionGroup: {
      gap: 12,
    },
    optionTitle: {
      fontSize: 18,
      fontFamily: FONTS.semiBold,
      color: theme.foreground.white,
      marginBottom: 4,
    },
    optionsRow: {
      flexDirection: "row",
      gap: 12,
    },
    optionButton: {
      flex: 1,
      paddingVertical: 16,
      paddingHorizontal: 20,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: theme.foreground.gray,
      backgroundColor: theme.background.darker,
      alignItems: "center",
    },
    optionButtonSelected: {
      borderColor: theme.primary.main,
      backgroundColor: theme.background.accent,
    },
    optionText: {
      fontSize: 16,
      fontFamily: FONTS.semiBold,
      color: theme.foreground.gray,
    },
    optionTextSelected: {
      color: theme.primary.main,
    },
  });
}

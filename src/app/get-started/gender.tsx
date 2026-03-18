import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Theme } from "../../constants/themes";
import { useTheme } from "../../contexts/ThemeContext";
import ChipButton from "../../components/ui/ChipButton";

import { FONTS } from "../../constants/fonts";

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background.dark,
      paddingHorizontal: 20,
      paddingBottom: 16,
    },
    content: {
      flex: 1,
    },
    title: {
      fontSize: 24,
      fontFamily: FONTS.bold,
      color: theme.foreground.white,
      marginVertical: 6,
    },
    subtitle: {
      fontSize: 14,
      color: theme.foreground.gray,
      marginBottom: 28,
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
    optionsContainer: {
      gap: 12,
    },
    genderButton: {
      paddingVertical: 18,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: theme.foreground.gray,
      backgroundColor: theme.background.darker,
      alignItems: "center",
    },
    genderButtonSelected: {
      borderColor: theme.primary.main,
      backgroundColor: theme.background.accent,
    },
    genderText: {
      fontSize: 17,
      fontFamily: FONTS.semiBold,
      color: theme.foreground.gray,
    },
    genderTextSelected: {
      color: theme.primary.main,
    },
  });
}

export default function GenderSelection() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();
  const [selectedGender, setSelectedGender] = useState<string>("");

  const handleContinue = async () => {
    if (!selectedGender) return;
    setTheme(selectedGender as "male" | "female");
    await AsyncStorage.setItem("@hylift_gender", selectedGender);
    router.navigate("/get-started/units");
  };

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.stepRow}>
          <Text style={[styles.stepText, { color: theme.primary.main }]}>
            {t("onboarding.stepOf", { current: 1, total: 13 })}
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

        <Text style={styles.title}>{t("onboarding.gender.title")}</Text>
        <Text style={styles.subtitle}>
          {t("onboarding.gender.subtitle")}
        </Text>

        <View style={styles.optionsContainer}>
          <TouchableOpacity
            style={[
              styles.genderButton,
              selectedGender === "male" && styles.genderButtonSelected,
            ]}
            onPress={() => setSelectedGender("male")}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.genderText,
                selectedGender === "male" && styles.genderTextSelected,
              ]}
            >
              {t("onboarding.gender.male")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.genderButton,
              selectedGender === "female" && styles.genderButtonSelected,
            ]}
            onPress={() => setSelectedGender("female")}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.genderText,
                selectedGender === "female" && styles.genderTextSelected,
              ]}
            >
              {t("onboarding.gender.female")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ChipButton
        title={t("common.continue")}
        onPress={handleContinue}
        variant="primary"
        size="lg"
        fullWidth
        disabled={!selectedGender}
      />
    </View>
  );
}

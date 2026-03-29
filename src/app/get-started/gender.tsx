import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
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
      gap: 14,
    },
    genderCard: {
      borderRadius: 16,
      borderWidth: 2,
      borderColor: theme.background.accent,
      backgroundColor: theme.background.darker,
      height: 200,
      overflow: "hidden",
    },
    genderCardSelected: {
      borderColor: theme.primary.main,
    },
    genderImage: {
      width: "100%",
      height: "100%",
      position: "absolute",
    },
    genderText: {
      fontSize: 17,
      fontFamily: FONTS.bold,
      color: "#000000",
      position: "absolute",
      bottom: 12,
      left: 16,
      zIndex: 1,
    },
    genderTextSelected: {
      color: "#000000",
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
              styles.genderCard,
              selectedGender === "male" && styles.genderCardSelected,
            ]}
            onPress={() => setSelectedGender("male")}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.genderText,
                selectedGender === "male" && styles.genderTextSelected,
              ]}
            >
              {t("onboarding.gender.male")}
            </Text>
            <Image
              source={require("../../../assets/images/frameboy.png")}
              style={styles.genderImage}
              resizeMode="cover"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.genderCard,
              selectedGender === "female" && styles.genderCardSelected,
            ]}
            onPress={() => setSelectedGender("female")}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.genderText,
                selectedGender === "female" && styles.genderTextSelected,
              ]}
            >
              {t("onboarding.gender.female")}
            </Text>
            <Image
              source={require("../../../assets/images/framegirl.png")}
              style={[styles.genderImage, { top: 0 }]}
              resizeMode="cover"
            />
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

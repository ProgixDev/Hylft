import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ChipButton from "../../components/ui/ChipButton";
import { Theme } from "../../constants/themes";
import { useTheme } from "../../contexts/ThemeContext";

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
      color: "#ffffff",
      position: "absolute",
      bottom: 12,
      left: 16,
      zIndex: 1,
    },
    genderTextSelected: {
      color: "#ffffff",
    },
  });
}

export default function GenderSelection() {
  const router = useRouter();
  const params = useLocalSearchParams<{ flow?: string }>();
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();
  const [selectedGender, setSelectedGender] = useState<string>("");
  const isSignupFlow = params.flow === "signup";

  const handleContinue = async () => {
    if (!selectedGender) return;
    setTheme(selectedGender as "male" | "female");
    await AsyncStorage.setItem("@hylift_gender", selectedGender);
    if (isSignupFlow) {
      router.push("/get-started/age?flow=signup");
    } else {
      router.navigate("/get-started/units");
    }
  };

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.stepRow}>
          <Text style={[styles.stepText, { color: theme.primary.main }]}>
            {t("onboarding.stepOf", {
              current: isSignupFlow ? 6 : 1,
              total: 13,
            })}
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: theme.primary.main,
                  width: `${((isSignupFlow ? 6 : 1) / 13) * 100}%`,
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
              source={require("../../../assets/images/frameboy2.png")}
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
              source={require("../../../assets/images/framegirl2.png")}
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

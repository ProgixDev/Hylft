import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ScrollWheelPicker from "../../components/ui/ScrollWheelPicker";
import { FONTS } from "../../constants/fonts";
import { Theme } from "../../constants/themes";
import { useTheme } from "../../contexts/ThemeContext";

export default function HeightScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(theme);
  const [value, setValue] = useState(175);

  const handleContinue = async () => {
    await AsyncStorage.setItem("@hylift_height", value.toString());
    router.push("/get-started/weight");
  };

  return (
    <View style={styles.container}>
      <View style={{ flex: 1 }}>
        <View style={styles.stepRow}>
          <Text style={[styles.stepText, { color: theme.primary.main }]}>
            STEP 5 OF 13
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: theme.primary.main,
                  width: `${(5 / 13) * 100}%`,
                },
              ]}
            />
          </View>
        </View>

        <Text style={styles.title}>{t("onboarding.height.title")}</Text>
        <Text style={styles.subtitle}>{t("onboarding.height.subtitle")}</Text>

        <View style={styles.pickerContainer}>
          <ScrollWheelPicker
            min={100}
            max={250}
            step={1}
            defaultValue={175}
            onChange={setValue}
          />
        </View>
      </View>

      <TouchableOpacity
        style={styles.continueButton}
        onPress={handleContinue}
        activeOpacity={0.8}
      >
        <Text style={styles.continueButtonText}>{t("common.next")}</Text>
      </TouchableOpacity>
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
    pickerContainer: {
      flex: 1,
      justifyContent: "center",
    },
    continueButton: {
      backgroundColor: theme.primary.main,
      paddingVertical: 18,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    continueButtonText: {
      color: theme.background.dark,
      fontSize: 18,
      fontFamily: FONTS.bold,
    },
  });
}

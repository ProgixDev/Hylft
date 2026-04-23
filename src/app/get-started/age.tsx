import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";
import ChipButton from "../../components/ui/ChipButton";
import RulerPicker from "../../components/ui/RulerPicker";
import { FONTS } from "../../constants/fonts";
import { Theme } from "../../constants/themes";
import { useTheme } from "../../contexts/ThemeContext";

export default function AgeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ flow?: string }>();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(theme);
  const [value, setValue] = useState(25);
  const isSignupFlow = params.flow === "signup";

  const handleContinue = async () => {
    await AsyncStorage.setItem("@hylift_age", value.toString());
    if (isSignupFlow) {
      router.push("/get-started/height?flow=signup");
    } else {
      router.push("/get-started/height");
    }
  };

  return (
    <View style={styles.container}>
      <View style={{ flex: 1 }}>
        <View style={styles.stepRow}>
          <Text style={[styles.stepText, { color: theme.primary.main }]}>
            {t("onboarding.stepOf", {
              current: isSignupFlow ? 7 : 5,
              total: 13,
            })}
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: theme.primary.main,
                  width: `${((isSignupFlow ? 7 : 5) / 13) * 100}%`,
                },
              ]}
            />
          </View>
        </View>

        <Text style={styles.title}>{t("onboarding.age.title")}</Text>
        <Text style={styles.subtitle}>{t("onboarding.age.subtitle")}</Text>

        <View style={styles.pickerContainer}>
          <RulerPicker
            min={13}
            max={80}
            step={1}
            defaultValue={25}
            unit={t("onboarding.age.years", "ans")}
            onChange={setValue}
          />
        </View>
      </View>

      <ChipButton
        title={t("common.next")}
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
    pickerContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
  });
}

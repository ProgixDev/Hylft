import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";
import RulerPicker from "../../components/ui/RulerPicker";
import { FONTS } from "../../constants/fonts";
import { Theme } from "../../constants/themes";
import ChipButton from "../../components/ui/ChipButton";
import { useTheme } from "../../contexts/ThemeContext";

export default function WeightScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ flow?: string }>();
  const isSignupFlow = params.flow === "signup";
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(theme);
  const [value, setValue] = useState(75);

  const handleContinue = async () => {
    await AsyncStorage.setItem("@hylift_weight", value.toString());
    if (isSignupFlow) {
      router.push("/get-started/weekly-goal");
    } else {
      router.push("/get-started/target-weight");
    }
  };

  return (
    <View style={styles.container}>
      <View style={{ flex: 1 }}>
        <View style={styles.stepRow}>
          <Text style={[styles.stepText, { color: theme.primary.main }]}>
            {t("onboarding.stepOf", {
              current: isSignupFlow ? 9 : 7,
              total: 13,
            })}
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: theme.primary.main,
                  width: `${((isSignupFlow ? 9 : 7) / 13) * 100}%`,
                },
              ]}
            />
          </View>
        </View>

        <Text style={styles.title}>{t("onboarding.weight.title")}</Text>
        <Text style={styles.subtitle}>{t("onboarding.weight.subtitle")}</Text>

        <View style={styles.pickerContainer}>
          <RulerPicker
            min={30}
            max={200}
            step={0.5}
            defaultValue={75}
            unit="kg"
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

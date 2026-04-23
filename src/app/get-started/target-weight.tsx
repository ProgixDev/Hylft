import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import RulerPicker from "../../components/ui/RulerPicker";
import { FONTS } from "../../constants/fonts";
import { Theme } from "../../constants/themes";
import { useTheme } from "../../contexts/ThemeContext";
import ChipButton from "../../components/ui/ChipButton";

export default function TargetWeightScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ flow?: string }>();
  const isSignupFlow = params.flow === "signup";
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(theme);
  const [value, setValue] = useState(75);
  const [currentWeight, setCurrentWeight] = useState(75);

  useEffect(() => {
    AsyncStorage.getItem("@hylift_weight").then((stored) => {
      if (stored) {
        const parsed = parseFloat(stored);
        if (!isNaN(parsed)) {
          setCurrentWeight(parsed);
          setValue(parsed);
        }
      }
    });
  }, []);

  const handleContinue = async () => {
    await AsyncStorage.setItem("@hylift_target_weight", value.toString());
    if (isSignupFlow) {
      router.push("/get-started/workout-frequency?flow=signup");
    } else {
      router.push("/get-started/workout-frequency");
    }
  };

  const handleSkip = () => {
    if (isSignupFlow) {
      router.push("/get-started/workout-frequency?flow=signup");
    } else {
      router.push("/get-started/workout-frequency");
    }
  };

  const diff = Math.abs(currentWeight - value);
  const caloriesToBurn = Math.round(diff * 7700);
  const isLosing = value < currentWeight;
  const isGaining = value > currentWeight;
  const weeks = diff > 0 ? Math.round((diff / 0.5)) : 0;

  return (
    <View style={styles.container}>
      <View style={{ flex: 1 }}>
        <View style={styles.stepRow}>
          <Text style={[styles.stepText, { color: theme.primary.main }]}>
            {t("onboarding.stepOf", { current: 8, total: 13 })}
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: theme.primary.main,
                  width: `${(8 / 13) * 100}%`,
                },
              ]}
            />
          </View>
        </View>

        <Text style={styles.title}>
          {t("onboarding.targetWeight.title")}
        </Text>
        <Text style={styles.subtitle}>
          {t("onboarding.targetWeight.subtitle")}
        </Text>

        {/* Journey card */}
          <View style={styles.journeyCard}>
            <Image
              source={require("../../../assets/images/Vector.png")}
              style={styles.journeyBgImage}
              resizeMode="cover"
            />
            <View style={styles.journeyContent}>
              <View style={styles.journeyRow}>
                <View style={styles.journeyPoint}>
                  <Text style={styles.journeyPointLabel}>
                    {t("onboarding.targetWeight.current", "Actuel")}
                  </Text>
                  <Text style={styles.journeyPointValue}>{currentWeight} kg</Text>
                </View>
                <View style={styles.journeyArrow}>
                  <Text style={styles.journeyArrowText}>
                    {isLosing ? "▼" : "▲"} {diff.toFixed(1)} kg
                  </Text>
                </View>
                <View style={[styles.journeyPoint, { alignItems: "flex-end" }]}>
                  <Text style={styles.journeyPointLabel}>
                    {t("onboarding.targetWeight.target", "Objectif")}
                  </Text>
                  <Text style={[styles.journeyPointValue, { color: theme.primary.main }]}>
                    {value} kg
                  </Text>
                </View>
              </View>
              <View style={styles.journeyStats}>
                <View style={styles.journeyStat}>
                  <Text style={styles.journeyStatValue}>
                    {caloriesToBurn >= 1000
                      ? `${(caloriesToBurn / 1000).toFixed(0)}k`
                      : caloriesToBurn}
                  </Text>
                  <Text style={styles.journeyStatLabel}>
                    {isLosing
                      ? t("onboarding.targetWeight.calToBurn", "cal à brûler")
                      : t("onboarding.targetWeight.calToGain", "cal à gagner")}
                  </Text>
                </View>
                <View style={styles.journeyStatDivider} />
                <View style={styles.journeyStat}>
                  <Text style={styles.journeyStatValue}>~{weeks}</Text>
                  <Text style={styles.journeyStatLabel}>
                    {t("onboarding.targetWeight.weeks", "semaines")}
                  </Text>
                </View>
              </View>
            </View>
          </View>

        <View style={styles.pickerContainer}>
          <RulerPicker
            min={30}
            max={200}
            step={0.5}
            defaultValue={currentWeight}
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
      <TouchableOpacity
        style={styles.skipButton}
        onPress={handleSkip}
        activeOpacity={0.8}
      >
        <Text style={styles.skipButtonText}>{t("common.skip")}</Text>
      </TouchableOpacity>
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
    // Journey card
    journeyCard: {
      borderRadius: 18,
      overflow: "hidden",
      backgroundColor: theme.background.darker,
      marginBottom: 20,
    },
    journeyBgImage: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      height: "100%",
      width: "100%",
      opacity: 0.7,
    },
    journeyContent: {
      padding: 16,
    },
    journeyRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 14,
    },
    journeyPoint: {},
    journeyPointLabel: {
      fontSize: 11,
      fontFamily: FONTS.medium,
      color: theme.foreground.gray,
      marginBottom: 2,
    },
    journeyPointValue: {
      fontSize: 20,
      fontFamily: FONTS.extraBold,
      color: theme.foreground.white,
    },
    journeyArrow: {
      backgroundColor: theme.primary.main + "15",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
    },
    journeyArrowText: {
      fontSize: 12,
      fontFamily: FONTS.bold,
      color: theme.primary.main,
    },
    journeyStats: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.background.dark,
      borderRadius: 12,
      padding: 12,
    },
    journeyStat: {
      flex: 1,
      alignItems: "center",
    },
    journeyStatDivider: {
      width: 1,
      height: 28,
      backgroundColor: theme.background.accent,
    },
    journeyStatValue: {
      fontSize: 18,
      fontFamily: FONTS.extraBold,
      color: theme.primary.main,
    },
    journeyStatLabel: {
      fontSize: 10,
      fontFamily: FONTS.medium,
      color: theme.foreground.gray,
      marginTop: 2,
    },
    // Picker
    pickerContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    skipButton: {
      paddingVertical: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    skipButtonText: {
      color: theme.foreground.gray,
      fontSize: 14,
      fontFamily: FONTS.semiBold,
    },
  });
}

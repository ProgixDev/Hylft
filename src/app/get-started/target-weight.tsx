import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import RulerPicker from "../../components/ui/RulerPicker";
import { FONTS } from "../../constants/fonts";
import { useTheme } from "../../contexts/ThemeContext";
import ChipButton from "../../components/ui/ChipButton";
import SignupProgress from "../../components/ui/SignupProgress";

export default function TargetWeightScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ flow?: string }>();
  const isSignupFlow = params.flow === "signup";
  const { theme } = useTheme();
  const { t } = useTranslation();
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
  const weeks = diff > 0 ? Math.round(diff / 0.5) : 0;

  return (
    <View style={s.container}>
      <View style={{ flex: 1 }}>
        <SignupProgress current={8} total={13} />

        <Text style={s.title}>{t("onboarding.targetWeight.title")}</Text>
        <Text style={s.subtitle}>{t("onboarding.targetWeight.subtitle")}</Text>

        <View style={s.journeyCard}>
          <Image
            source={require("../../../assets/images/Vector.png")}
            style={s.journeyBgImage}
            resizeMode="cover"
          />
          <View style={s.journeyContent}>
            <View style={s.journeyRow}>
              <View style={s.journeyPoint}>
                <Text style={s.journeyPointLabel}>
                  {t("onboarding.targetWeight.current", "Actuel")}
                </Text>
                <Text style={s.journeyPointValue}>{currentWeight} kg</Text>
              </View>
              <View
                style={[
                  s.journeyArrow,
                  { backgroundColor: theme.primary.main + "20" },
                ]}
              >
                <Text style={[s.journeyArrowText, { color: theme.primary.main }]}>
                  {isLosing ? "▼" : "▲"} {diff.toFixed(1)} kg
                </Text>
              </View>
              <View style={[s.journeyPoint, { alignItems: "flex-end" }]}>
                <Text style={s.journeyPointLabel}>
                  {t("onboarding.targetWeight.target", "Objectif")}
                </Text>
                <Text style={[s.journeyPointValue, { color: theme.primary.main }]}>
                  {value} kg
                </Text>
              </View>
            </View>
            <View style={s.journeyStats}>
              <View style={s.journeyStat}>
                <Text style={[s.journeyStatValue, { color: theme.primary.main }]}>
                  {caloriesToBurn >= 1000
                    ? `${(caloriesToBurn / 1000).toFixed(0)}k`
                    : caloriesToBurn}
                </Text>
                <Text style={s.journeyStatLabel}>
                  {isLosing
                    ? t("onboarding.targetWeight.calToBurn", "cal à brûler")
                    : t("onboarding.targetWeight.calToGain", "cal à gagner")}
                </Text>
              </View>
              <View style={s.journeyStatDivider} />
              <View style={s.journeyStat}>
                <Text style={[s.journeyStatValue, { color: theme.primary.main }]}>
                  ~{weeks}
                </Text>
                <Text style={s.journeyStatLabel}>
                  {t("onboarding.targetWeight.weeks", "semaines")}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={s.pickerContainer}>
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
      <TouchableOpacity style={s.skipButton} onPress={handleSkip} activeOpacity={0.8}>
        <Text style={s.skipButtonText}>{t("common.skip")}</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 26,
    fontFamily: FONTS.extraBold,
    color: "#111827",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 18,
    lineHeight: 20,
  },
  journeyCard: {
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#F6F8FA",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#DDE3EA",
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
    color: "#64748B",
    marginBottom: 2,
  },
  journeyPointValue: {
    fontSize: 20,
    fontFamily: FONTS.extraBold,
    color: "#111827",
  },
  journeyArrow: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  journeyArrowText: {
    fontSize: 12,
    fontFamily: FONTS.bold,
  },
  journeyStats: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 12,
  },
  journeyStat: {
    flex: 1,
    alignItems: "center",
  },
  journeyStatDivider: {
    width: 1,
    height: 28,
    backgroundColor: "#DDE3EA",
  },
  journeyStatValue: {
    fontSize: 18,
    fontFamily: FONTS.extraBold,
  },
  journeyStatLabel: {
    fontSize: 10,
    fontFamily: FONTS.medium,
    color: "#64748B",
    marginTop: 2,
  },
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
    color: "#64748B",
    fontSize: 14,
    fontFamily: FONTS.semiBold,
  },
});

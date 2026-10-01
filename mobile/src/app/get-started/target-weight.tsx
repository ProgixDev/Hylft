import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "../../components/ui/ScaledText";
import RulerPicker from "../../components/ui/RulerPicker";
import { FONTS } from "../../constants/fonts";
import { useAuth } from "../../contexts/AuthContext";
import ChipButton from "../../components/ui/ChipButton";
import { SignupProgress } from "../../components/ui/SignupProgress";
import { api } from "../../services/api";

export default function TargetWeightScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ flow?: string; mode?: string }>();
  const isSignupFlow = params.flow === "signup";
  const isUpdate = params.mode === "update";
  const { userProfile, refreshUserProfile } = useAuth();
  const { t, i18n } = useTranslation();
  const isFr = i18n.language?.startsWith("fr");
  const insets = useSafeAreaInsets();

  const [value, setValue] = useState(70);
  const [initialValue, setInitialValue] = useState(70);
  const [currentWeight, setCurrentWeight] = useState(75);
  const [loaded, setLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem("@hylift_food_weight_current"),
      AsyncStorage.getItem("@hylift_weight"),
      AsyncStorage.getItem("@hylift_food_weight_target"),
      AsyncStorage.getItem("@hylift_target_weight"),
    ]).then(([fcw, w, ftw, tw]) => {
      const strCur = fcw || w;
      const parsedCur = strCur ? parseFloat(strCur) : null;
      const current =
        userProfile?.weight_kg ??
        (parsedCur && !isNaN(parsedCur) ? parsedCur : null);
      if (current && current > 0) {
        setCurrentWeight(current);
      }
      const strTarget = ftw || tw;
      const parsedTarget = strTarget ? parseFloat(strTarget) : null;
      const target =
        userProfile?.target_weight_kg ??
        (parsedTarget && !isNaN(parsedTarget) ? parsedTarget : null);
      if (target && target > 0) {
        setValue(target);
        setInitialValue(target);
      } else if (current && current > 0) {
        setValue(current);
        setInitialValue(current);
      }
      setLoaded(true);
    });
  }, [userProfile]);

  const handleContinue = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await Promise.all([
        AsyncStorage.setItem("@hylift_target_weight", value.toString()),
        AsyncStorage.setItem("@hylift_food_weight_target", value.toString()),
      ]);
      if (isUpdate) {
        try {
          await api.updateProfile({ target_weight_kg: value });
          await refreshUserProfile();
        } catch {}
        router.back();
      } else {
        if (isSignupFlow) {
          router.push("/get-started/workout-frequency?flow=signup");
        } else {
          router.push("/get-started/workout-frequency");
        }
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkip = () => {
    if (isSignupFlow) {
      router.push("/get-started/workout-frequency?flow=signup");
    } else {
      router.push("/get-started/workout-frequency");
    }
  };

  const handleBack = () => router.back();

  const diff = Math.abs(currentWeight - value);
  const caloriesToBurn = Math.round(diff * 7700);
  const isLosing = value < currentWeight;
  const weeks = diff > 0 ? Math.round(diff / 0.5) : 0;

  return (
    <View style={s.container}>
      {isUpdate && (
        <Text style={[s.title, { marginTop: 16, marginHorizontal: 20 }]}>
          {t("onboarding.targetWeight.title")}
        </Text>
      )}
      <ScrollView
        style={s.scrollView}
        contentContainerStyle={[
          s.scrollContent,
          { paddingBottom: Math.max(24, insets.bottom + 12) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flex: 1 }}>
          {!isUpdate && (
            <>
              <SignupProgress current={8} total={13} />
              <Text style={s.title}>{t("onboarding.targetWeight.title")}</Text>
            </>
          )}

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
                <View style={s.journeyArrow}>
                  <Text style={s.journeyArrowText}>
                    {isLosing ? "▼" : "▲"} {diff.toFixed(1)} kg
                  </Text>
                </View>
                <View style={[s.journeyPoint, { alignItems: "flex-end" }]}>
                  <Text style={s.journeyPointLabel}>
                    {t("onboarding.targetWeight.target", "Objectif")}
                  </Text>
                  <Text style={s.journeyPointValue}>{value} kg</Text>
                </View>
              </View>
              <View style={s.journeyStats}>
                <View style={s.journeyStat}>
                  <Text style={s.journeyStatValue}>
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
                  <Text style={s.journeyStatValue}>~{weeks}</Text>
                  <Text style={s.journeyStatLabel}>
                    {t("onboarding.targetWeight.weeks", "semaines")}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {loaded && (
            <View style={s.pickerCard}>
              <RulerPicker
                min={30}
                max={200}
                step={0.5}
                defaultValue={initialValue}
                unit="kg"
                onChange={setValue}
              />
            </View>
          )}
        </View>

      </ScrollView>
      <View style={[s.bottomActions, { paddingBottom: Math.max(16, insets.bottom) }]}>
        <View style={s.actionRow}>
          <View style={s.actionButton}>
            <ChipButton
              title={isUpdate ? t("common.cancel") : t("common.back")}
              onPress={handleBack}
              variant="secondary"
              size="lg"
              fullWidth
            />
          </View>
          <View style={s.actionButton}>
            <ChipButton
              threeD
              title={
                isUpdate
                  ? isFr
                    ? "Mettre à jour"
                    : "Update"
                  : t("common.next")
              }
              onPress={handleContinue}
              variant="primary"
              size="lg"
              fullWidth
              loading={isSaving}
            />
          </View>
        </View>
        {!isUpdate && (
          <TouchableOpacity
            style={s.skipButton}
            onPress={handleSkip}
            activeOpacity={0.8}
          >
            <Text style={s.skipButtonText}>{t("common.skip")}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FC",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    flexGrow: 1,
  },
  updateScrollContent: {
    paddingTop: 24,
  },
  scrollView: {
    flex: 1,
  },
  bottomActions: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  title: {
    fontSize: 26,
    fontFamily: FONTS.extraBold,
    color: "#102b4a",
    marginBottom: 18,
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },

  journeyCard: {
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#102b4a",
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
    color: "rgba(255,255,255,0.65)",
    marginBottom: 2,
  },
  journeyPointValue: {
    fontSize: 20,
    fontFamily: FONTS.extraBold,
    color: "#FFFFFF",
  },
  journeyArrow: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  journeyArrowText: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    color: "#FFFFFF",
  },
  journeyStats: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 10,
    padding: 12,
  },
  journeyStat: {
    flex: 1,
    alignItems: "center",
  },
  journeyStatValue: {
    fontSize: 18,
    fontFamily: FONTS.extraBold,
    color: "#FFFFFF",
  },
  journeyStatLabel: {
    fontSize: 10,
    fontFamily: FONTS.medium,
    color: "rgba(255,255,255,0.65)",
    marginTop: 2,
  },
  journeyStatDivider: {
    width: 1,
    height: 28,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  pickerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  skipButton: {
    alignItems: "center",
    paddingVertical: 12,
    marginTop: 8,
  },
  skipButtonText: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: "#9CA3AF",
  },
});

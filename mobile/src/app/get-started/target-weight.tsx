import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Image,
  Platform,
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
import { useTheme } from "../../contexts/ThemeContext";
import ChipButton from "../../components/ui/ChipButton";
import SignupProgress from "../../components/ui/SignupProgress";
import { api } from "../../services/api";

export default function TargetWeightScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ flow?: string; mode?: string }>();
  const isSignupFlow = params.flow === "signup";
  const isUpdate = params.mode === "update";
  const { theme } = useTheme();
  const { refreshUserProfile } = useAuth();
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
      const current = fcw || w;
      if (current) {
        const parsedCurrent = parseFloat(current);
        if (!isNaN(parsedCurrent) && parsedCurrent > 0) {
          setCurrentWeight(parsedCurrent);
        }
      }
      const target = ftw || tw;
      if (target) {
        const parsedTarget = parseFloat(target);
        if (!isNaN(parsedTarget) && parsedTarget > 0) {
          setValue(parsedTarget);
          setInitialValue(parsedTarget);
        }
      } else if (current) {
        const parsedCurrent = parseFloat(current);
        if (!isNaN(parsedCurrent) && parsedCurrent > 0) {
          setValue(parsedCurrent);
          setInitialValue(parsedCurrent);
        }
      }
      setLoaded(true);
    });
  }, []);

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

  const diff = Math.abs(currentWeight - value);
  const caloriesToBurn = Math.round(diff * 7700);
  const isLosing = value < currentWeight;
  const weeks = diff > 0 ? Math.round(diff / 0.5) : 0;

  return (
    <View
      style={[
        s.container,
        {
          paddingTop: isUpdate
            ? insets.top + (Platform.OS === "android" ? 12 : 6)
            : 0,
        },
      ]}
    >
      <ScrollView
        contentContainerStyle={[
          s.scrollContent,
          { paddingBottom: Math.max(24, insets.bottom + 12) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flex: 1 }}>
          {isUpdate ? (
            <View style={s.updateHeader}>
              <TouchableOpacity
                onPress={() => router.back()}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={s.backBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back" size={24} color="#102b4a" />
              </TouchableOpacity>
              <Text style={s.updateHeaderTitle}>
                {t("onboarding.targetWeight.title")}
              </Text>
            </View>
          ) : (
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
        {!isUpdate && (
          <TouchableOpacity
            style={s.skipButton}
            onPress={handleSkip}
            activeOpacity={0.8}
          >
            <Text style={s.skipButtonText}>{t("common.skip")}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
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
  title: {
    fontSize: 26,
    fontFamily: FONTS.extraBold,
    color: "#102b4a",
    marginBottom: 18,
  },
  updateHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    paddingVertical: 8,
  },
  backBtn: {
    padding: 6,
    marginRight: 12,
  },
  updateHeaderTitle: {
    fontSize: 22,
    fontFamily: FONTS.bold,
    color: "#102b4a",
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
  journeyPoint: {
    gap: 2,
  },
  journeyPointLabel: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: "rgba(255,255,255,0.7)",
  },
  journeyPointValue: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: "#FFFFFF",
  },
  journeyArrow: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  journeyArrowText: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    color: "#FFFFFF",
  },
  journeyStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.15)",
  },
  journeyStat: {
    alignItems: "center",
    gap: 2,
  },
  journeyStatValue: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: "#FFFFFF",
  },
  journeyStatLabel: {
    fontSize: 11,
    fontFamily: FONTS.medium,
    color: "rgba(255,255,255,0.7)",
  },
  journeyStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  pickerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 20,
    marginBottom: 20,
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

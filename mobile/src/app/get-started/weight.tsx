import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "../../components/ui/ScaledText";
import BmiGauge from "../../components/ui/BmiGauge";
import ChipButton from "../../components/ui/ChipButton";
import RulerPicker from "../../components/ui/RulerPicker";
import { SignupProgress } from "../../components/ui/SignupProgress";
import { FONTS } from "../../constants/fonts";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { api } from "../../services/api";
import { WeightHistory } from "../../services/weightHistory";

export default function WeightScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ flow?: string; mode?: string }>();
  const isSignupFlow = params.flow === "signup";
  const isUpdate = params.mode === "update";
  const { t, i18n } = useTranslation();
  const isFr = i18n.language?.startsWith("fr");
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { userProfile, refreshUserProfile } = useAuth();

  const [value, setValue] = useState(75);
  const [initialValue, setInitialValue] = useState(75);
  const [loaded, setLoaded] = useState(false);
  const [heightCm, setHeightCm] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem("@hylift_height"),
      AsyncStorage.getItem("@hylift_food_weight_current"),
      AsyncStorage.getItem("@hylift_weight"),
    ]).then(([h, fcw, w]) => {
      if (h) setHeightCm(parseFloat(h));
      const strVal = fcw || w;
      const parsedStr = strVal ? parseFloat(strVal) : null;
      const savedWeight =
        userProfile?.weight_kg ??
        (parsedStr && !isNaN(parsedStr) ? parsedStr : null);
      if (savedWeight && savedWeight > 0) {
        setValue(savedWeight);
        setInitialValue(savedWeight);
      }
      setLoaded(true);
    });
  }, [userProfile]);

  const bmi =
    heightCm && heightCm > 0 ? value / (heightCm / 100) ** 2 : null;

  const handleContinue = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      await Promise.all([
        AsyncStorage.setItem("@hylift_weight", value.toString()),
        AsyncStorage.setItem("@hylift_food_weight_current", value.toString()),
        WeightHistory.log(value),
        api
          .upsertAlimentationDaily({ date: today, weight_kg: value })
          .catch(() => {}),
      ]);

      if (isUpdate) {
        try {
          await api.updateProfile({ weight_kg: value });
          await refreshUserProfile();
        } catch {}
        router.back();
      } else {
        if (isSignupFlow) {
          router.push("/get-started/target-weight?flow=signup");
        } else {
          router.push("/get-started/target-weight");
        }
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => router.back();

  return (
    <View style={s.container}>
      <ScrollView
        style={s.scrollView}
        contentContainerStyle={[
          s.scrollContent,
          isUpdate && s.updateScrollContent,
          { paddingBottom: Math.max(32, insets.bottom + 16) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {!isUpdate && <SignupProgress current={isSignupFlow ? 9 : 7} total={13} />}
        <Text style={s.title}>{t("onboarding.weight.title")}</Text>

        {/* Ruler picker card */}
        {loaded && (
          <View style={s.card}>
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

        {/* BMI card */}
        {bmi !== null && (
          <View style={s.card}>
            <BmiGauge bmi={bmi} theme={theme} />
          </View>
        )}

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
    paddingBottom: 16,
  },
  updateScrollContent: {
    paddingTop: 24,
  },
  scrollView: {
    flex: 1,
  },
  title: {
    fontSize: 26,
    fontFamily: FONTS.extraBold,
    marginBottom: 16,
    color: "#102b4a",
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  bottomActions: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
});

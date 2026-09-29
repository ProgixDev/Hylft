import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "../../components/ui/ScaledText";
import BmiGauge from "../../components/ui/BmiGauge";
import ChipButton from "../../components/ui/ChipButton";
import RulerPicker from "../../components/ui/RulerPicker";
import SignupProgress from "../../components/ui/SignupProgress";
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
  const { refreshUserProfile } = useAuth();

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
      const savedWeight = fcw || w;
      if (savedWeight) {
        const parsed = parseFloat(savedWeight);
        if (!isNaN(parsed) && parsed > 0) {
          setValue(parsed);
          setInitialValue(parsed);
        }
      }
      setLoaded(true);
    });
  }, []);

  const bmi =
    heightCm && heightCm > 0 ? value / (heightCm / 100) ** 2 : null;

  const handleContinue = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await Promise.all([
        AsyncStorage.setItem("@hylift_weight", value.toString()),
        AsyncStorage.setItem("@hylift_food_weight_current", value.toString()),
      ]);
      void WeightHistory.log(value);

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
          { paddingBottom: Math.max(32, insets.bottom + 16) },
        ]}
        showsVerticalScrollIndicator={false}
      >
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
              {t("onboarding.weight.title")}
            </Text>
          </View>
        ) : (
          <>
            <SignupProgress current={isSignupFlow ? 9 : 7} total={13} />
            <Text style={s.title}>{t("onboarding.weight.title")}</Text>
          </>
        )}

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

        <View style={s.buttonWrap}>
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
    paddingBottom: 32,
  },
  title: {
    fontSize: 26,
    fontFamily: FONTS.extraBold,
    marginBottom: 20,
    color: "#102b4a",
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
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  buttonWrap: {
    marginTop: 8,
  },
});

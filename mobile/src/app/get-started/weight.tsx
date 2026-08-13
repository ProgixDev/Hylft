import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, View } from "react-native";
import { Text } from "../../components/ui/ScaledText";
import BmiGauge from "../../components/ui/BmiGauge";
import ChipButton from "../../components/ui/ChipButton";
import RulerPicker from "../../components/ui/RulerPicker";
import SignupProgress from "../../components/ui/SignupProgress";
import { FONTS } from "../../constants/fonts";
import { useTheme } from "../../contexts/ThemeContext";

export default function WeightScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ flow?: string }>();
  const isSignupFlow = params.flow === "signup";
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [value, setValue] = useState(75);
  const [heightCm, setHeightCm] = useState<number | null>(null);

  useEffect(() => {
    AsyncStorage.getItem("@hylift_height").then((h) => {
      if (h) setHeightCm(parseFloat(h));
    });
  }, []);

  const bmi =
    heightCm && heightCm > 0 ? value / (heightCm / 100) ** 2 : null;

  const handleContinue = async () => {
    await AsyncStorage.setItem("@hylift_weight", value.toString());
    if (isSignupFlow) {
      router.push("/get-started/target-weight?flow=signup");
    } else {
      router.push("/get-started/target-weight");
    }
  };

  return (
    <View style={s.container}>
      <ScrollView
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <SignupProgress current={isSignupFlow ? 9 : 7} total={13} />

        <Text style={s.title}>{t("onboarding.weight.title")}</Text>

        {/* Ruler picker card */}
        <View style={s.card}>
          <RulerPicker
            min={30}
            max={200}
            step={0.5}
            defaultValue={75}
            unit="kg"
            onChange={setValue}
          />
        </View>

        {/* BMI card */}
        {bmi !== null && (
          <View style={s.card}>
            <BmiGauge bmi={bmi} theme={theme} />
          </View>
        )}

        <View style={s.buttonWrap}>
          <ChipButton
            threeD
            title={t("common.next")}
            onPress={handleContinue}
            variant="primary"
            size="lg"
            fullWidth
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
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
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

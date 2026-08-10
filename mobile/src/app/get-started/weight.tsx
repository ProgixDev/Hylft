import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
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
    <View
      style={[s.container, { backgroundColor: theme.background.dark }]}
    >
      <View style={{ flex: 1 }}>
        <SignupProgress current={isSignupFlow ? 9 : 7} total={13} />

        <Text style={[s.title, { color: theme.foreground.white }]}>
          {t("onboarding.weight.title")}
        </Text>

        <View style={s.pickerContainer}>
          <RulerPicker
            min={30}
            max={200}
            step={0.5}
            defaultValue={75}
            unit="kg"
            onChange={setValue}
          />

          {bmi !== null && <BmiGauge bmi={bmi} theme={theme} />}
        </View>
      </View>

      <ChipButton
        threeD
        title={t("common.next")}
        onPress={handleContinue}
        variant="primary"
        size="lg"
        fullWidth
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 26,
    fontFamily: FONTS.extraBold,
    marginBottom: 18,
  },
  pickerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

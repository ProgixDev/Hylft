import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";
import RulerPicker from "../../components/ui/RulerPicker";
import { FONTS } from "../../constants/fonts";
import ChipButton from "../../components/ui/ChipButton";
import SignupProgress from "../../components/ui/SignupProgress";

export default function WeightScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ flow?: string }>();
  const isSignupFlow = params.flow === "signup";
  const { t } = useTranslation();
  const [value, setValue] = useState(75);

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
      <View style={{ flex: 1 }}>
        <SignupProgress current={isSignupFlow ? 9 : 7} total={13} />

        <Text style={s.title}>{t("onboarding.weight.title")}</Text>
        <Text style={s.subtitle}>{t("onboarding.weight.subtitle")}</Text>

        <View style={s.pickerContainer}>
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
  pickerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

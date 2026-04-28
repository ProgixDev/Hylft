import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";
import ChipButton from "../../components/ui/ChipButton";
import RulerPicker from "../../components/ui/RulerPicker";
import SignupProgress from "../../components/ui/SignupProgress";
import { FONTS } from "../../constants/fonts";

export default function AgeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ flow?: string }>();
  const { t } = useTranslation();
  const styles = createStyles();
  const [value, setValue] = useState(25);
  const isSignupFlow = params.flow === "signup";

  const handleContinue = async () => {
    await AsyncStorage.setItem("@hylift_age", value.toString());
    if (isSignupFlow) {
      router.push("/get-started/height?flow=signup");
    } else {
      router.push("/get-started/height");
    }
  };

  return (
    <View style={styles.container}>
      <View style={{ flex: 1 }}>
        <SignupProgress current={isSignupFlow ? 7 : 5} total={13} />

        <Text style={styles.title}>{t("onboarding.age.title")}</Text>
        <Text style={styles.subtitle}>{t("onboarding.age.subtitle")}</Text>

        <View style={styles.pickerContainer}>
          <RulerPicker
            min={13}
            max={80}
            step={1}
            defaultValue={25}
            unit={t("onboarding.age.years", "ans")}
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

function createStyles() {
  return StyleSheet.create({
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
}

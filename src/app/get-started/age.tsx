import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ScrollWheelPicker from "../../components/ui/ScrollWheelPicker";
import { FONTS } from "../../constants/fonts";
import { Theme } from "../../constants/themes";
import ChipButton from "../../components/ui/ChipButton";
import { useTheme } from "../../contexts/ThemeContext";

export default function AgeScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(theme);
  const [value, setValue] = useState(25);

  const handleContinue = async () => {
    await AsyncStorage.setItem("@hylift_age", value.toString());
    router.push("/get-started/height");
  };

  return (
    <View style={styles.container}>
      <View style={{ flex: 1 }}>
        <View style={styles.stepRow}>
          <Text style={[styles.stepText, { color: theme.primary.main }]}>
            STEP 4 OF 13
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: theme.primary.main,
                  width: `${(4 / 13) * 100}%`,
                },
              ]}
            />
          </View>
        </View>

        <Text style={styles.title}>{t("onboarding.age.title")}</Text>
        <Text style={styles.subtitle}>{t("onboarding.age.subtitle")}</Text>

        <View style={styles.pickerContainer}>
          <ScrollWheelPicker
            min={13}
            max={80}
            step={1}
            defaultValue={25}
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
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background.dark,
      paddingHorizontal: 24,
      paddingBottom: 20,
    },
    stepRow: {
      marginBottom: 20,
      marginTop: 8,
    },
    stepText: {
      fontSize: 11,
      fontFamily: FONTS.bold,
      letterSpacing: 1.2,
      marginBottom: 8,
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
      fontSize: 30,
      fontFamily: FONTS.bold,
      color: theme.foreground.white,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 15,
      color: theme.foreground.gray,
      marginBottom: 28,
      lineHeight: 22,
    },
    pickerContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
  });
}

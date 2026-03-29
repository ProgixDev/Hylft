import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ScrollWheelPicker, { ScrollWheelPickerRef } from "../../components/ui/ScrollWheelPicker";
import { Ionicons } from "@expo/vector-icons";
import { FONTS } from "../../constants/fonts";
import { Theme } from "../../constants/themes";
import ChipButton from "../../components/ui/ChipButton";
import { useTheme } from "../../contexts/ThemeContext";

export default function HeightScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(theme);
  const [value, setValue] = useState(175);
  const pickerRef = useRef<ScrollWheelPickerRef>(null);

  const handleContinue = async () => {
    await AsyncStorage.setItem("@hylift_height", value.toString());
    router.push("/get-started/weight");
  };

  return (
    <View style={styles.container}>
      <View style={{ flex: 1 }}>
        <View style={styles.stepRow}>
          <Text style={[styles.stepText, { color: theme.primary.main }]}>
            {t("onboarding.stepOf", { current: 6, total: 13 })}
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: theme.primary.main,
                  width: `${(6 / 13) * 100}%`,
                },
              ]}
            />
          </View>
        </View>

        <Text style={styles.title}>{t("onboarding.height.title")}</Text>
        <Text style={styles.subtitle}>{t("onboarding.height.subtitle")}</Text>

        <View style={styles.pickerContainer}>
          <TouchableOpacity
            style={styles.pmButton}
            onPress={() => {
              const newVal = Math.min(250, value + 1);
              setValue(newVal);
              pickerRef.current?.scrollToValue(newVal);
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={28} color={theme.primary.main} />
          </TouchableOpacity>

          <ScrollWheelPicker
            ref={pickerRef}
            min={100}
            max={250}
            step={1}
            defaultValue={175}
            onChange={setValue}
          />

          <TouchableOpacity
            style={styles.pmButton}
            onPress={() => {
              const newVal = Math.max(100, value - 1);
              setValue(newVal);
              pickerRef.current?.scrollToValue(newVal);
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="remove" size={28} color={theme.primary.main} />
          </TouchableOpacity>
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
      paddingHorizontal: 20,
      paddingBottom: 16,
    },
    stepRow: {
      marginBottom: 14,
      marginTop: 4,
    },
    stepText: {
      fontSize: 11,
      fontFamily: FONTS.bold,
      letterSpacing: 1.2,
      marginBottom: 6,
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
      fontSize: 24,
      fontFamily: FONTS.bold,
      color: theme.foreground.white,
      marginBottom: 6,
    },
    subtitle: {
      fontSize: 13,
      color: theme.foreground.gray,
      marginBottom: 18,
      lineHeight: 20,
    },
    pickerContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    pmButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      borderWidth: 2,
      borderColor: theme.primary.main,
      justifyContent: "center",
      alignItems: "center",
    },
  });
}

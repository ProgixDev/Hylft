import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import ChipButton from "../../components/ui/ChipButton";
import { FONTS } from "../../constants/fonts";
import { Theme } from "../../constants/themes";
import { useTheme } from "../../contexts/ThemeContext";

const WEEKLY_OPTIONS = [1, 2, 3, 4, 5, 6, 7];

export default function ObjectiveScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const styles = createStyles(theme);
  const [selected, setSelected] = useState<number | null>(null);

  const handleSelect = (days: number) => {
    setSelected(days);
  };

  const handleConfirm = async () => {
    if (!selected) return;
    await AsyncStorage.setItem("@hylift_home_weekly_objective", String(selected));
    router.back();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.8 }]}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{t("home.objective", "Objective")}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.title}>
          {t(
            "home.objectiveQuestion",
            "Combien de fois par semaine veux-tu t'entraîner ?"
          )}
        </Text>

        <View style={styles.optionsList}>
          {WEEKLY_OPTIONS.map((days) => {
            const isSelected = selected === days;
            return (
              <Pressable
                key={days}
                style={({ pressed }) => [
                  styles.optionCard,
                  {
                    borderColor: isSelected
                      ? theme.primary.main
                      : theme.background.accent,
                    backgroundColor: isSelected
                      ? theme.primary.main + "14"
                      : theme.background.darker,
                    opacity: pressed ? 0.9 : 1,
                  },
                ]}
                onPress={() => handleSelect(days)}
              >
                <Text style={styles.optionText}>
                  {t("home.objectiveOption", "{{count}} x semaine", { count: days })}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <ChipButton
        title={t("common.confirm", "Confirmer")}
        onPress={handleConfirm}
        variant="primary"
        size="lg"
        fullWidth
        disabled={!selected}
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
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingTop: 6,
      marginBottom: 14,
    },
    backButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.background.darker,
    },
    backButtonText: {
      fontFamily: FONTS.extraBold,
      fontSize: 18,
      color: theme.foreground.white,
      marginTop: -1,
    },
    headerTitle: {
      fontFamily: FONTS.bold,
      fontSize: 16,
      color: theme.foreground.white,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    headerSpacer: {
      width: 36,
      height: 36,
    },
    content: {
      paddingBottom: 24,
    },
    title: {
      fontFamily: FONTS.extraBold,
      fontSize: 24,
      color: theme.foreground.white,
      lineHeight: 31,
      marginBottom: 18,
    },
    optionsList: {
      gap: 10,
    },
    optionCard: {
      borderWidth: 1.5,
      borderRadius: 14,
      paddingVertical: 16,
      paddingHorizontal: 14,
    },
    optionText: {
      fontFamily: FONTS.bold,
      fontSize: 17,
      color: theme.foreground.white,
    },
  });
}

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
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
const DAY_OPTIONS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const OBJECTIVE_KEY = "@hylift_home_weekly_objective";
const OBJECTIVE_DAYS_KEY = "@hylift_home_weekly_objective_days";

export default function ObjectiveScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const styles = createStyles(theme);
  const [selected, setSelected] = useState<number | null>(null);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);

  useEffect(() => {
    let isMounted = true;

    const loadSavedObjective = async () => {
      try {
        const [savedObjective, savedDays] = await Promise.all([
          AsyncStorage.getItem(OBJECTIVE_KEY),
          AsyncStorage.getItem(OBJECTIVE_DAYS_KEY),
        ]);

        if (!isMounted) return;

        const parsedObjective = Number(savedObjective);
        if (Number.isFinite(parsedObjective) && parsedObjective >= 1 && parsedObjective <= 7) {
          setSelected(parsedObjective);
        }

        if (savedDays) {
          const parsedDays = JSON.parse(savedDays);
          if (Array.isArray(parsedDays)) {
            const valid = parsedDays
              .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)
              .slice(0, 7);
            setSelectedDays(valid);
          }
        }
      } catch {
        // Keep default UI state when storage is unavailable.
      }
    };

    loadSavedObjective();

    return () => {
      isMounted = false;
    };
  }, []);

  const canConfirm = useMemo(
    () => !!selected && selectedDays.length === selected,
    [selected, selectedDays]
  );

  const handleSelect = (days: number) => {
    setSelected(days);
    setSelectedDays((prev) => prev.slice(0, days));
  };

  const toggleDay = (dayIndex: number) => {
    if (!selected) return;

    setSelectedDays((prev) => {
      if (prev.includes(dayIndex)) {
        return prev.filter((d) => d !== dayIndex);
      }

      if (prev.length >= selected) {
        return prev;
      }

      return [...prev, dayIndex].sort((a, b) => a - b);
    });
  };

  const handleConfirm = async () => {
    if (!selected || selectedDays.length !== selected) return;
    await AsyncStorage.setItem(OBJECTIVE_KEY, String(selected));
    await AsyncStorage.setItem(OBJECTIVE_DAYS_KEY, JSON.stringify(selectedDays));
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

        <Text style={styles.daysTitle}>
          {t("home.objectiveChooseDays", "Choisis tes jours d'entraînement")}
        </Text>
        <Text style={styles.daysSubtitle}>
          {t(
            "home.objectiveChooseDaysHint",
            "Sélectionne {{selected}}/{{target}} jours",
            { selected: selectedDays.length, target: selected ?? 0 }
          )}
        </Text>

        <View style={styles.daysGrid}>
          {DAY_OPTIONS.map((dayLabel, dayIndex) => {
            const isActive = selectedDays.includes(dayIndex);
            const disabled = !selected;
            return (
              <Pressable
                key={dayLabel}
                style={({ pressed }) => [
                  styles.dayChip,
                  {
                    borderColor: isActive
                      ? theme.primary.main
                      : theme.background.accent,
                    backgroundColor: isActive
                      ? theme.primary.main + "16"
                      : theme.background.darker,
                    opacity: disabled ? 0.45 : pressed ? 0.9 : 1,
                  },
                ]}
                onPress={() => toggleDay(dayIndex)}
                disabled={disabled}
              >
                <Text
                  style={[
                    styles.dayChipText,
                    isActive && { color: theme.primary.main },
                  ]}
                >
                  {dayLabel}
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
        disabled={!canConfirm}
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
    daysTitle: {
      fontFamily: FONTS.bold,
      fontSize: 18,
      color: theme.foreground.white,
      marginTop: 18,
      marginBottom: 4,
    },
    daysSubtitle: {
      fontFamily: FONTS.regular,
      fontSize: 12,
      color: theme.foreground.gray,
      marginBottom: 10,
    },
    daysGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    dayChip: {
      minWidth: 64,
      borderWidth: 1.5,
      borderRadius: 12,
      paddingVertical: 10,
      paddingHorizontal: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    dayChipText: {
      fontFamily: FONTS.semiBold,
      fontSize: 13,
      color: theme.foreground.white,
    },
  });
}

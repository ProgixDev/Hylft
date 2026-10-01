import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "../../components/ui/ScaledText";
import AppBar from "../../components/ui/AppBar";
import { FONTS } from "../../constants/fonts";
import { Theme } from "../../constants/themes";
import { useNutrition } from "../../contexts/NutritionContext";
import { useTheme } from "../../contexts/ThemeContext";

type MealDistribution = {
  breakfast: number;
  lunch: number;
  dinner: number;
  snack: number;
};

const DEFAULT_DISTRIBUTION: MealDistribution = {
  breakfast: 0,
  lunch: 40,
  dinner: 50,
  snack: 10,
};

function createStyles(theme: Theme) {
  const isDark = theme.background.dark === "#0B0D0E";
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background.dark,
    },
    resetBtn: {
      padding: 6,
    },
    content: {
      paddingHorizontal: 18,
      paddingTop: 16,
    },
    infoCard: {
      borderWidth: 1.5,
      borderColor: "#0284C7",
      backgroundColor: isDark ? "#0A1B28" : "#F0F9FF",
      borderRadius: 14,
      padding: 16,
      marginBottom: 20,
    },
    infoText: {
      fontSize: 14,
      fontFamily: FONTS.medium,
      color: theme.foreground.white,
      lineHeight: 20,
      textAlign: "center",
    },
    listSection: {
      marginTop: 6,
    },
    mealRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 18,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.background.accent,
    },
    mealTitle: {
      fontSize: 17,
      fontFamily: FONTS.semiBold,
      color: theme.foreground.white,
      lineHeight: 22,
    },
    mealKcal: {
      fontSize: 14,
      fontFamily: FONTS.regular,
      color: theme.foreground.gray,
      marginTop: 4,
      lineHeight: 20,
    },
    pctPill: {
      borderWidth: 1.5,
      borderColor: theme.background.accent,
      borderRadius: 12,
      minWidth: 70,
      paddingVertical: 10,
      paddingHorizontal: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: isDark ? "#14191F" : "#F8F9FC",
    },
    pctPillText: {
      fontSize: 17,
      fontFamily: FONTS.bold,
      color: theme.foreground.white,
    },
    totalSection: {
      marginTop: 36,
      alignItems: "flex-end",
      paddingRight: 8,
    },
    totalText: {
      fontSize: 18,
      fontFamily: FONTS.bold,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.65)",
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 28,
    },
    modalCard: {
      width: "100%",
      maxWidth: 340,
      backgroundColor: isDark ? "#1E242B" : "#FFFFFF",
      borderRadius: 16,
      padding: 24,
      borderWidth: 1,
      borderColor: theme.background.accent,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.35,
      shadowRadius: 16,
      elevation: 10,
    },
    modalTitle: {
      fontSize: 18,
      fontFamily: FONTS.bold,
      color: theme.foreground.white,
      marginBottom: 16,
    },
    modalInput: {
      borderWidth: 1.5,
      borderColor: theme.primary.main,
      borderRadius: 10,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 18,
      fontFamily: FONTS.semiBold,
      color: theme.foreground.white,
      backgroundColor: isDark ? "#14191F" : "#F8F9FC",
      marginBottom: 24,
    },
    modalActions: {
      flexDirection: "row",
      justifyContent: "flex-end",
      alignItems: "center",
      gap: 20,
    },
    modalCancelBtn: {
      paddingVertical: 6,
      paddingHorizontal: 10,
    },
    modalCancelText: {
      fontSize: 14,
      fontFamily: FONTS.bold,
      color: theme.foreground.gray,
      letterSpacing: 0.5,
    },
    modalSaveBtn: {
      paddingVertical: 6,
      paddingHorizontal: 10,
    },
    modalSaveText: {
      fontSize: 14,
      fontFamily: FONTS.bold,
      letterSpacing: 0.5,
    },
  });
}

export default function CalorieDistributionScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const styles = createStyles(theme);
  const isFr = i18n.language?.startsWith("fr");
  const isDark = theme.background.dark === "#0B0D0E";
  const { goals: nutritionGoals } = useNutrition();

  const totalCalories = nutritionGoals?.calorieGoal || 1800;

  const [distribution, setDistribution] =
    useState<MealDistribution>(DEFAULT_DISTRIBUTION);
  const [editingKey, setEditingKey] = useState<keyof MealDistribution | null>(
    null
  );
  const [editingInput, setEditingInput] = useState("");

  const loadDistribution = useCallback(() => {
    AsyncStorage.getItem("@hylift_calorie_distribution").then((val) => {
      if (val) {
        try {
          const parsed = JSON.parse(val);
          if (parsed && typeof parsed === "object") {
            setDistribution({
              breakfast: Number(parsed.breakfast) || 0,
              lunch: Number(parsed.lunch) || 0,
              dinner: Number(parsed.dinner) || 0,
              snack: Number(parsed.snack) || 0,
            });
          }
        } catch {}
      }
    });
  }, []);

  useFocusEffect(loadDistribution);

  const handleReset = async () => {
    setDistribution(DEFAULT_DISTRIBUTION);
    await AsyncStorage.setItem(
      "@hylift_calorie_distribution",
      JSON.stringify(DEFAULT_DISTRIBUTION)
    );
  };

  const handleOpenEdit = (key: keyof MealDistribution) => {
    setEditingKey(key);
    setEditingInput(String(distribution[key]));
  };

  const handleSavePercentage = async () => {
    if (!editingKey) return;
    const parsed = parseInt(editingInput.replace(/[^0-9]/g, ""), 10);
    const validPct = isNaN(parsed) ? 0 : Math.min(100, Math.max(0, parsed));
    const nextDist = { ...distribution, [editingKey]: validPct };
    setDistribution(nextDist);
    await AsyncStorage.setItem(
      "@hylift_calorie_distribution",
      JSON.stringify(nextDist)
    );
    setEditingKey(null);
  };

  const totalPct =
    distribution.breakfast +
    distribution.lunch +
    distribution.dinner +
    distribution.snack;

  const mealsConfig: {
    key: keyof MealDistribution;
    titleFr: string;
    titleEn: string;
  }[] = [
    { key: "breakfast", titleFr: "Petit déjeuner", titleEn: "Breakfast" },
    { key: "lunch", titleFr: "Déjeuner", titleEn: "Lunch" },
    { key: "dinner", titleFr: "Dîner", titleEn: "Dinner" },
    { key: "snack", titleFr: "En-cas", titleEn: "Snack" },
  ];

  const getMealTitle = (key: keyof MealDistribution) => {
    const item = mealsConfig.find((m) => m.key === key);
    return isFr ? item?.titleFr : item?.titleEn;
  };

  return (
    <View style={styles.container}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Header */}
      <AppBar
        title={isFr ? "Répartition des calories" : "Calorie Distribution"}
        bordered
        actions={
          <TouchableOpacity
            onPress={handleReset}
            style={styles.resetBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh" size={22} color={theme.foreground.white} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(40, insets.bottom + 24) },
        ]}
      >
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            {isFr
              ? "Sachez que le fait de lancer un décompte de jeûne peut affecter votre répartition calorique."
              : "Starting a fasting timer may affect your calorie distribution."}
          </Text>
        </View>

        {/* List Section */}
        <View style={styles.listSection}>
          {mealsConfig.map((item) => {
            const pct = distribution[item.key];
            const kcal = Math.round(totalCalories * (pct / 100));
            return (
              <View key={item.key} style={styles.mealRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.mealTitle}>
                    {isFr ? item.titleFr : item.titleEn}
                  </Text>
                  <Text style={styles.mealKcal}>{kcal} kcal</Text>
                </View>

                <TouchableOpacity
                  style={styles.pctPill}
                  activeOpacity={0.7}
                  onPress={() => handleOpenEdit(item.key)}
                >
                  <Text style={styles.pctPillText}>{pct}%</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {/* Total Percent */}
        <View style={styles.totalSection}>
          <Text
            style={[
              styles.totalText,
              { color: totalPct === 100 ? "#0284C7" : "#EF4444" },
            ]}
          >
            {totalPct}%
          </Text>
        </View>
      </ScrollView>

      {/* Edit Percentage Modal */}
      <Modal
        visible={editingKey !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingKey(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setEditingKey(null)}
          />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {editingKey ? `${getMealTitle(editingKey)} (%)` : "(%)"}
            </Text>

            <TextInput
              style={styles.modalInput}
              value={editingInput}
              onChangeText={setEditingInput}
              keyboardType="numeric"
              placeholder="25"
              placeholderTextColor={theme.foreground.gray}
              selectionColor={theme.primary.main}
              autoFocus
              selectTextOnFocus
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setEditingKey(null)}
                style={styles.modalCancelBtn}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelText}>
                  {isFr ? "ANNULER" : "CANCEL"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSavePercentage}
                style={styles.modalSaveBtn}
                activeOpacity={0.7}
              >
                <Text
                  style={[styles.modalSaveText, { color: theme.primary.main }]}
                >
                  {isFr ? "ENREGISTRER" : "SAVE"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

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
import ChipButton from "../../components/ui/ChipButton";
import { FONTS } from "../../constants/fonts";
import { Theme } from "../../constants/themes";
import { useNutrition } from "../../contexts/NutritionContext";
import { useTheme } from "../../contexts/ThemeContext";

type MacroPlan = "balanced" | "high_protein" | "low_carb" | "keto" | "custom";

type MacroRatio = {
  carbs: number; // percentage
  protein: number;
  fat: number;
};

const PRESET_PLANS: {
  id: MacroPlan;
  titleFr: string;
  titleEn: string;
  descFr: string;
  descEn: string;
  ratios: MacroRatio;
}[] = [
  {
    id: "balanced",
    titleFr: "Équilibré (Par défaut)",
    titleEn: "Balanced (Default)",
    descFr: "50% Glucides • 30% Protéines • 20% Lipides",
    descEn: "50% Carbs • 30% Protein • 20% Fat",
    ratios: { carbs: 50, protein: 30, fat: 20 },
  },
  {
    id: "high_protein",
    titleFr: "Riche en protéines",
    titleEn: "High Protein",
    descFr: "40% Glucides • 40% Protéines • 20% Lipides",
    descEn: "40% Carbs • 40% Protein • 20% Fat",
    ratios: { carbs: 40, protein: 40, fat: 20 },
  },
  {
    id: "low_carb",
    titleFr: "Faible en glucides",
    titleEn: "Low Carb",
    descFr: "20% Glucides • 40% Protéines • 40% Lipides",
    descEn: "20% Carbs • 40% Protein • 40% Fat",
    ratios: { carbs: 20, protein: 40, fat: 40 },
  },
  {
    id: "keto",
    titleFr: "Cétogène (Keto)",
    titleEn: "Ketogenic (Keto)",
    descFr: "5% Glucides • 25% Protéines • 70% Lipides",
    descEn: "5% Carbs • 25% Protein • 70% Fat",
    ratios: { carbs: 5, protein: 25, fat: 70 },
  },
  {
    id: "custom",
    titleFr: "Personnalisé",
    titleEn: "Custom",
    descFr: "Ajustez vos pourcentages manuellement",
    descEn: "Manually adjust your percentages",
    ratios: { carbs: 50, protein: 30, fat: 20 },
  },
];

function createStyles(theme: Theme) {
  const isDark = theme.background.dark === "#0B0D0E";
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background.dark,
    },

    content: {
      paddingHorizontal: 20,
      paddingTop: 16,
    },
    sectionTitle: {
      fontSize: 14,
      fontFamily: FONTS.bold,
      color: theme.foreground.gray,
      textTransform: "uppercase",
      letterSpacing: 0.8,
      marginBottom: 12,
      marginTop: 8,
    },
    planCard: {
      borderWidth: 1.5,
      borderRadius: 12,
      padding: 16,
      marginBottom: 10,
      backgroundColor: isDark ? "#14191F" : "#FFFFFF",
      borderColor: theme.background.accent,
    },
    planCardSelected: {
      borderColor: theme.primary.main,
      backgroundColor: isDark ? "#122434" : "#F0F9FF",
    },
    planHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    planTitle: {
      fontSize: 16,
      fontFamily: FONTS.bold,
      color: theme.foreground.white,
    },
    planDesc: {
      fontSize: 13,
      fontFamily: FONTS.regular,
      color: theme.foreground.gray,
      marginTop: 4,
    },
    radioCircle: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: theme.foreground.gray,
      alignItems: "center",
      justifyContent: "center",
    },
    radioCircleSelected: {
      borderColor: theme.primary.main,
    },
    radioDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: theme.primary.main,
    },
    macroSection: {
      marginTop: 18,
      backgroundColor: isDark ? "#14191F" : "#FFFFFF",
      borderRadius: 14,
      padding: 18,
      borderWidth: 1,
      borderColor: theme.background.accent,
    },
    macroRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.background.accent,
    },
    macroDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      marginRight: 10,
    },
    macroInfo: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    macroName: {
      fontSize: 16,
      fontFamily: FONTS.semiBold,
      color: theme.foreground.white,
    },
    macroGrams: {
      fontSize: 14,
      fontFamily: FONTS.regular,
      color: theme.foreground.gray,
      marginTop: 2,
    },
    pctPill: {
      borderWidth: 1.5,
      borderColor: theme.background.accent,
      borderRadius: 10,
      minWidth: 62,
      paddingVertical: 8,
      paddingHorizontal: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: isDark ? "#1B222A" : "#F8F9FC",
    },
    pctPillText: {
      fontSize: 15,
      fontFamily: FONTS.bold,
      color: theme.foreground.white,
    },
    totalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingTop: 14,
    },
    totalLabel: {
      fontSize: 15,
      fontFamily: FONTS.bold,
      color: theme.foreground.white,
    },
    totalValue: {
      fontSize: 16,
      fontFamily: FONTS.bold,
    },
    footer: {
      paddingHorizontal: 20,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: theme.background.accent,
      backgroundColor: theme.background.dark,
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

export default function NutritionGoalsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const styles = createStyles(theme);
  const isFr = i18n.language?.startsWith("fr");
  const isDark = theme.background.dark === "#0B0D0E";
  const { goals: nutritionGoals, updateGoals } = useNutrition();

  const totalCalories = nutritionGoals?.calorieGoal || 2000;

  const [selectedPlan, setSelectedPlan] = useState<MacroPlan>("balanced");
  const [ratios, setRatios] = useState<MacroRatio>({
    carbs: 50,
    protein: 30,
    fat: 20,
  });
  const [editingMacro, setEditingMacro] = useState<keyof MacroRatio | null>(
    null
  );
  const [editingInput, setEditingInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const loadSavedPlan = useCallback(() => {
    Promise.all([
      AsyncStorage.getItem("@hylift_macro_plan"),
      AsyncStorage.getItem("@hylift_macro_ratios"),
    ]).then(([plan, r]) => {
      if (plan) setSelectedPlan(plan as MacroPlan);
      if (r) {
        try {
          const parsed = JSON.parse(r);
          if (parsed && typeof parsed === "object") {
            setRatios(parsed);
          }
        } catch {}
      }
    });
  }, []);

  useFocusEffect(loadSavedPlan);

  const handleSelectPlan = (plan: (typeof PRESET_PLANS)[number]) => {
    setSelectedPlan(plan.id);
    if (plan.id !== "custom") {
      setRatios(plan.ratios);
    }
  };

  const handleOpenEdit = (key: keyof MacroRatio) => {
    setSelectedPlan("custom");
    setEditingMacro(key);
    setEditingInput(String(ratios[key]));
  };

  const handleSaveRatio = () => {
    if (!editingMacro) return;
    const parsed = parseInt(editingInput.replace(/[^0-9]/g, ""), 10);
    const valid = isNaN(parsed) ? 0 : Math.min(100, Math.max(0, parsed));
    setRatios((prev) => ({ ...prev, [editingMacro]: valid }));
    setEditingMacro(null);
  };

  // Gram calculations
  // 1g Carbs = 4 kcal, 1g Protein = 4 kcal, 1g Fat = 9 kcal
  const carbsGrams = Math.round((totalCalories * (ratios.carbs / 100)) / 4);
  const proteinGrams = Math.round((totalCalories * (ratios.protein / 100)) / 4);
  const fatGrams = Math.round((totalCalories * (ratios.fat / 100)) / 9);

  const totalPct = ratios.carbs + ratios.protein + ratios.fat;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateGoals({
        carbsGoal: carbsGrams,
        proteinGoal: proteinGrams,
        fatGoal: fatGrams,
      });
      await AsyncStorage.multiSet([
        ["@hylift_macro_plan", selectedPlan],
        ["@hylift_macro_ratios", JSON.stringify(ratios)],
      ]);
      router.back();
    } catch (e) {
      console.warn("Failed to save macro goals", e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Header */}
      <AppBar
        title={isFr ? "Objectifs nutritionnels" : "Nutrition Goals"}
        bordered
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(30, insets.bottom + 16) },
        ]}
      >
        <Text style={styles.sectionTitle}>
          {isFr ? "Répartition des macronutriments" : "Macronutrient Plans"}
        </Text>

        {PRESET_PLANS.map((plan) => {
          const isSelected = selectedPlan === plan.id;
          return (
            <TouchableOpacity
              key={plan.id}
              style={[
                styles.planCard,
                isSelected && styles.planCardSelected,
              ]}
              activeOpacity={0.7}
              onPress={() => handleSelectPlan(plan)}
            >
              <View style={styles.planHeader}>
                <Text
                  style={[
                    styles.planTitle,
                    isSelected && { color: theme.primary.main },
                  ]}
                >
                  {isFr ? plan.titleFr : plan.titleEn}
                </Text>
                <View
                  style={[
                    styles.radioCircle,
                    isSelected && styles.radioCircleSelected,
                  ]}
                >
                  {isSelected && <View style={styles.radioDot} />}
                </View>
              </View>
              <Text style={styles.planDesc}>
                {isFr ? plan.descFr : plan.descEn}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* Live Macro Breakdown */}
        <View style={styles.macroSection}>
          <Text
            style={[
              styles.sectionTitle,
              { marginTop: 0, marginBottom: 8, color: theme.foreground.white },
            ]}
          >
            {isFr ? "Détail quotidien" : "Daily Breakdown"} ({totalCalories} kcal)
          </Text>

          {/* Glucides */}
          <View style={styles.macroRow}>
            <View style={styles.macroInfo}>
              <View style={[styles.macroDot, { backgroundColor: "#38BDF8" }]} />
              <View>
                <Text style={styles.macroName}>
                  {isFr ? "Glucides" : "Carbohydrates"}
                </Text>
                <Text style={styles.macroGrams}>
                  {carbsGrams}g • {Math.round(carbsGrams * 4)} kcal
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.pctPill}
              activeOpacity={0.7}
              onPress={() => handleOpenEdit("carbs")}
            >
              <Text style={styles.pctPillText}>{ratios.carbs}%</Text>
            </TouchableOpacity>
          </View>

          {/* Protéines */}
          <View style={styles.macroRow}>
            <View style={styles.macroInfo}>
              <View style={[styles.macroDot, { backgroundColor: "#F43F5E" }]} />
              <View>
                <Text style={styles.macroName}>
                  {isFr ? "Protéines" : "Protein"}
                </Text>
                <Text style={styles.macroGrams}>
                  {proteinGrams}g • {Math.round(proteinGrams * 4)} kcal
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.pctPill}
              activeOpacity={0.7}
              onPress={() => handleOpenEdit("protein")}
            >
              <Text style={styles.pctPillText}>{ratios.protein}%</Text>
            </TouchableOpacity>
          </View>

          {/* Lipides */}
          <View style={[styles.macroRow, { borderBottomWidth: 0 }]}>
            <View style={styles.macroInfo}>
              <View style={[styles.macroDot, { backgroundColor: "#FBBF24" }]} />
              <View>
                <Text style={styles.macroName}>
                  {isFr ? "Lipides" : "Fat"}
                </Text>
                <Text style={styles.macroGrams}>
                  {fatGrams}g • {Math.round(fatGrams * 9)} kcal
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.pctPill}
              activeOpacity={0.7}
              onPress={() => handleOpenEdit("fat")}
            >
              <Text style={styles.pctPillText}>{ratios.fat}%</Text>
            </TouchableOpacity>
          </View>

          {/* Total Percent */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>
              {isFr ? "Total des pourcentages" : "Total Percentage"}
            </Text>
            <Text
              style={[
                styles.totalValue,
                { color: totalPct === 100 ? theme.primary.main : "#EF4444" },
              ]}
            >
              {totalPct}%
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View
        style={[
          styles.footer,
          { paddingBottom: Math.max(16, insets.bottom + 8) },
        ]}
      >
        <ChipButton
          threeD
          title={isFr ? "Enregistrer" : "Save"}
          onPress={handleSave}
          variant="primary"
          size="lg"
          fullWidth
          loading={isSaving}
          disabled={totalPct !== 100}
        />
      </View>

      {/* Edit Ratio Modal */}
      <Modal
        visible={editingMacro !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingMacro(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setEditingMacro(null)}
          />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {editingMacro === "carbs"
                ? isFr
                  ? "Glucides (%)"
                  : "Carbohydrates (%)"
                : editingMacro === "protein"
                  ? isFr
                    ? "Protéines (%)"
                    : "Protein (%)"
                  : isFr
                    ? "Lipides (%)"
                    : "Fat (%)"}
            </Text>

            <TextInput
              style={styles.modalInput}
              value={editingInput}
              onChangeText={setEditingInput}
              keyboardType="numeric"
              placeholder="30"
              placeholderTextColor={theme.foreground.gray}
              selectionColor={theme.primary.main}
              autoFocus
              selectTextOnFocus
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setEditingMacro(null)}
                style={styles.modalCancelBtn}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelText}>
                  {isFr ? "ANNULER" : "CANCEL"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSaveRatio}
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

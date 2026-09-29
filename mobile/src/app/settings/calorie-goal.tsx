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
import { FONTS } from "../../constants/fonts";
import { Theme } from "../../constants/themes";
import { useNutrition } from "../../contexts/NutritionContext";
import { useTheme } from "../../contexts/ThemeContext";
import { computeNutritionGoals } from "../../utils/nutritionGoals";

const WEEKEND_CALORIE_OPTIONS = [
  { id: "sat_sun", labelFr: "Samedi et dimanche", labelEn: "Saturday and Sunday" },
  {
    id: "fri_sat_sun",
    labelFr: "Vendredi, samedi et dimanche",
    labelEn: "Friday, Saturday and Sunday",
  },
  { id: "fri_sat", labelFr: "Vendredi et samedi", labelEn: "Friday and Saturday" },
  {
    id: "none",
    labelFr: "Aucun jour en particulier",
    labelEn: "No particular day",
  },
];

function createStyles(theme: Theme) {
  const isDark = theme.background.dark === "#0B0D0E";
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background.dark,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.background.dark,
      paddingHorizontal: 16,
      paddingBottom: 14,
      borderBottomWidth: 1,
      borderBottomColor: theme.background.accent,
    },
    backBtn: {
      padding: 6,
      marginRight: 12,
    },
    headerTitle: {
      fontSize: 20,
      fontFamily: FONTS.bold,
      color: theme.foreground.white,
      letterSpacing: 0.2,
    },
    content: {
      paddingHorizontal: 18,
      paddingTop: 16,
    },
    infoCard: {
      borderWidth: 1.5,
      borderColor: "#0284C7", // Cyan/blue border as shown in screenshot
      backgroundColor: isDark ? "#0A1B28" : "#F0F9FF",
      borderRadius: 14,
      padding: 16,
      marginBottom: 14,
    },
    infoText: {
      fontSize: 14,
      fontFamily: FONTS.medium,
      color: theme.foreground.white,
      lineHeight: 20,
      textAlign: "center",
    },
    listSection: {
      marginTop: 10,
    },
    itemRow: {
      paddingVertical: 18,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.background.accent,
    },
    itemTitle: {
      fontSize: 17,
      fontFamily: FONTS.semiBold,
      color: theme.foreground.white,
      lineHeight: 22,
    },
    itemValue: {
      fontSize: 14,
      fontFamily: FONTS.regular,
      color: theme.foreground.gray,
      marginTop: 4,
      lineHeight: 20,
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
    modalDesc: {
      fontSize: 15,
      fontFamily: FONTS.regular,
      color: theme.foreground.white,
      lineHeight: 22,
      marginBottom: 24,
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
    // Weekend Picker options modal
    optionsContainer: {
      paddingVertical: 6,
    },
    optionItem: {
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.background.accent,
    },
    optionText: {
      fontSize: 16,
      fontFamily: FONTS.medium,
      color: theme.foreground.white,
    },
  });
}

export default function CalorieGoalScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const styles = createStyles(theme);
  const isFr = i18n.language?.startsWith("fr");
  const isDark = theme.background.dark === "#0B0D0E";
  const { goals: nutritionGoals, updateGoals } = useNutrition();

  // Dialogs state
  const [isCalorieModalVisible, setIsCalorieModalVisible] = useState(false);
  const [calorieInput, setCalorieInput] = useState("");
  const [isSavingCalories, setIsSavingCalories] = useState(false);

  // Recalculate Dialog
  const [isRecalcModalVisible, setIsRecalcModalVisible] = useState(false);
  const [calculatedKcal, setCalculatedKcal] = useState(2000);
  const [isSavingRecalc, setIsSavingRecalc] = useState(false);

  // Weekend Calories Dialog
  const [isWeekendModalVisible, setIsWeekendModalVisible] = useState(false);
  const [weekendChoice, setWeekendChoice] = useState("none");

  const loadData = useCallback(() => {
    AsyncStorage.getItem("@hylift_weekend_calories_days").then((val) => {
      if (val) setWeekendChoice(val);
    });
  }, []);

  useFocusEffect(loadData);

  const handleOpenCalorieModal = () => {
    setCalorieInput(String(nutritionGoals?.calorieGoal || 2000));
    setIsCalorieModalVisible(true);
  };

  const handleSaveCalories = async () => {
    const parsed = parseInt(calorieInput.replace(/[^0-9]/g, ""), 10);
    if (isNaN(parsed) || parsed < 500 || parsed > 12000) {
      setIsCalorieModalVisible(false);
      return;
    }
    setIsSavingCalories(true);
    try {
      await updateGoals({ calorieGoal: parsed });
      await AsyncStorage.setItem("@hylift_calorie_goal", parsed.toString());
      setIsCalorieModalVisible(false);
    } catch (e) {
      console.warn("Failed to save calories", e);
      setIsCalorieModalVisible(false);
    } finally {
      setIsSavingCalories(false);
    }
  };

  const handleOpenRecalculate = async () => {
    const [w, h, a, g, act, freq, goal] = await Promise.all([
      AsyncStorage.getItem("@hylift_food_weight_current"),
      AsyncStorage.getItem("@hylift_height"),
      AsyncStorage.getItem("@hylift_age"),
      AsyncStorage.getItem("@hylift_gender"),
      AsyncStorage.getItem("@hylift_activity_level"),
      AsyncStorage.getItem("@hylift_workout_frequency"),
      AsyncStorage.getItem("@hylift_goal"),
    ]);

    const computed = computeNutritionGoals({
      weightKg: w ? parseFloat(w) : 75,
      heightCm: h ? parseFloat(h) : 175,
      age: a ? parseInt(a, 10) : 25,
      gender: g || "male",
      activityLevel: act || "moderate",
      workoutFrequency: freq ? parseInt(freq, 10) : 3,
      weightGoal: goal || "lose_weight",
    });

    setCalculatedKcal(computed.calorieGoal);
    setIsRecalcModalVisible(true);
  };

  const handleConfirmRecalculate = async () => {
    setIsSavingRecalc(true);
    try {
      await updateGoals({ calorieGoal: calculatedKcal });
      await AsyncStorage.setItem(
        "@hylift_calorie_goal",
        calculatedKcal.toString()
      );
      setIsRecalcModalVisible(false);
    } catch (e) {
      console.warn("Failed to recalculate calories", e);
      setIsRecalcModalVisible(false);
    } finally {
      setIsSavingRecalc(false);
    }
  };

  const handleSelectWeekendChoice = async (id: string) => {
    setWeekendChoice(id);
    await AsyncStorage.setItem("@hylift_weekend_calories_days", id);
    setIsWeekendModalVisible(false);
  };

  const currentWeekendLabel =
    WEEKEND_CALORIE_OPTIONS.find((o) => o.id === weekendChoice)?.[
      isFr ? "labelFr" : "labelEn"
    ] || (isFr ? "Aucun jour en particulier" : "No particular day");

  const currentCalorieDisplay = `${(nutritionGoals?.calorieGoal || 2000).toLocaleString(
    isFr ? "fr-FR" : "en-US"
  )} kcal`;

  return (
    <View style={styles.container}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + (Platform.OS === "android" ? 12 : 6) },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={theme.foreground.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isFr ? "Objectif calorique" : "Calorie Goal"}
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(40, insets.bottom + 24) },
        ]}
      >
        {/* Info Cards */}
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            {isFr
              ? "Sachez que le fait de lancer un décompte de jeûne peut affecter votre objectif calorique."
              : "Starting a fasting timer may affect your calorie target."}
          </Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            {isFr
              ? "Activez les calories du week-end si vous souhaitez manger plus pendant le week-end."
              : "Enable weekend calories if you wish to eat more during weekends."}
          </Text>
        </View>

        {/* List Section */}
        <View style={styles.listSection}>
          {/* 1. Objectif calorique */}
          <TouchableOpacity
            style={styles.itemRow}
            activeOpacity={0.7}
            onPress={handleOpenCalorieModal}
          >
            <Text style={styles.itemTitle}>
              {isFr ? "Objectif calorique" : "Calorie goal"}
            </Text>
            <Text style={styles.itemValue}>{currentCalorieDisplay}</Text>
          </TouchableOpacity>

          {/* 2. Recalculer objectif calo. */}
          <TouchableOpacity
            style={styles.itemRow}
            activeOpacity={0.7}
            onPress={handleOpenRecalculate}
          >
            <Text style={styles.itemTitle}>
              {isFr ? "Recalculer objectif calo." : "Recalculate calorie goal"}
            </Text>
          </TouchableOpacity>

          {/* 3. Calories du week-end */}
          <TouchableOpacity
            style={styles.itemRow}
            activeOpacity={0.7}
            onPress={() => setIsWeekendModalVisible(true)}
          >
            <Text style={styles.itemTitle}>
              {isFr ? "Calories du week-end" : "Weekend calories"}
            </Text>
            <Text style={styles.itemValue}>{currentWeekendLabel}</Text>
          </TouchableOpacity>

          {/* 4. Répartition des calories */}
          <TouchableOpacity
            style={[styles.itemRow, { borderBottomWidth: 0 }]}
            activeOpacity={0.7}
            onPress={() => router.push("/settings/calorie-distribution")}
          >
            <Text style={styles.itemTitle}>
              {isFr ? "Répartition des calories" : "Calorie distribution"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ── Dialog 1: Objectif calorique ── */}
      <Modal
        visible={isCalorieModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsCalorieModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setIsCalorieModalVisible(false)}
          />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {isFr ? "Objectif calorique (kcal)" : "Calorie goal (kcal)"}
            </Text>

            <TextInput
              style={styles.modalInput}
              value={calorieInput}
              onChangeText={setCalorieInput}
              keyboardType="numeric"
              placeholder="2000"
              placeholderTextColor={theme.foreground.gray}
              selectionColor={theme.primary.main}
              autoFocus
              selectTextOnFocus
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setIsCalorieModalVisible(false)}
                style={styles.modalCancelBtn}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelText}>
                  {isFr ? "ANNULER" : "CANCEL"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSaveCalories}
                style={[
                  styles.modalSaveBtn,
                  isSavingCalories && { opacity: 0.7 },
                ]}
                activeOpacity={0.7}
                disabled={isSavingCalories}
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

      {/* ── Dialog 2: Recalculer objectif calo. ── */}
      <Modal
        visible={isRecalcModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsRecalcModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setIsRecalcModalVisible(false)}
          />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {isFr ? "Recalculer objectif calo." : "Recalculate calorie goal"}
            </Text>

            <Text style={styles.modalDesc}>
              {isFr
                ? `Selon vos paramètres actuels, votre nouvel objectif calorique est de ${calculatedKcal} kcal.`
                : `Based on your current profile settings, your new calorie goal is ${calculatedKcal} kcal.`}
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setIsRecalcModalVisible(false)}
                style={styles.modalCancelBtn}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelText}>
                  {isFr ? "ANNULER" : "CANCEL"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleConfirmRecalculate}
                style={[styles.modalSaveBtn, isSavingRecalc && { opacity: 0.7 }]}
                activeOpacity={0.7}
                disabled={isSavingRecalc}
              >
                <Text
                  style={[styles.modalSaveText, { color: theme.primary.main }]}
                >
                  {isFr ? "ENREGISTRER" : "SAVE"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Dialog 3: Calories du week-end ── */}
      <Modal
        visible={isWeekendModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsWeekendModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setIsWeekendModalVisible(false)}
          />
          <View style={[styles.modalCard, { paddingBottom: 16 }]}>
            <Text style={styles.modalTitle}>
              {isFr ? "Calories du week-end" : "Weekend calories"}
            </Text>

            <View style={styles.optionsContainer}>
              {WEEKEND_CALORIE_OPTIONS.map((opt, idx) => {
                const isSelected = weekendChoice === opt.id;
                const isLast = idx === WEEKEND_CALORIE_OPTIONS.length - 1;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    style={[
                      styles.optionItem,
                      isLast && { borderBottomWidth: 0 },
                    ]}
                    activeOpacity={0.7}
                    onPress={() => handleSelectWeekendChoice(opt.id)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        isSelected && {
                          color: theme.primary.main,
                          fontFamily: FONTS.bold,
                        },
                      ]}
                    >
                      {isFr ? opt.labelFr : opt.labelEn}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

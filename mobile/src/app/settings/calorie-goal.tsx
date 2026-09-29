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
import { useAuth } from "../../contexts/AuthContext";
import { useNutrition } from "../../contexts/NutritionContext";
import { useTheme } from "../../contexts/ThemeContext";
import { ageFromDateOfBirth, computeNutritionGoals } from "../../utils/nutritionGoals";

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

    content: {
      paddingHorizontal: 20,
      paddingTop: 20,
    },
    heroCard: {
      backgroundColor: theme.primary.main,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      overflow: "hidden",
    },
    heroTopRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    heroLabel: {
      fontSize: 12,
      fontFamily: FONTS.semiBold,
      color: "rgba(255,255,255,0.72)",
      letterSpacing: 0.7,
      textTransform: "uppercase",
    },
    heroEdit: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: "rgba(255,255,255,0.14)",
      alignItems: "center",
      justifyContent: "center",
    },
    heroValue: {
      fontSize: 36,
      fontFamily: FONTS.extraBold,
      color: "#FFFFFF",
      marginTop: 8,
      letterSpacing: -0.8,
    },
    heroSupport: {
      fontSize: 13,
      fontFamily: FONTS.medium,
      color: "rgba(255,255,255,0.78)",
      marginTop: 4,
    },
    heroFooter: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 18,
      paddingTop: 14,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: "rgba(255,255,255,0.28)",
    },
    heroFooterText: {
      flex: 1,
      fontSize: 12,
      fontFamily: FONTS.medium,
      color: "rgba(255,255,255,0.85)",
    },
    sectionLabel: {
      fontSize: 12,
      fontFamily: FONTS.bold,
      color: theme.foreground.gray,
      letterSpacing: 0.7,
      textTransform: "uppercase",
      marginBottom: 10,
    },
    settingsStack: {
      gap: 10,
    },
    settingCard: {
      borderTopWidth: 1.5,
      borderRightWidth: 1.5,
      borderBottomWidth: 1.5,
      borderLeftWidth: 1.5,
      borderColor: isDark ? "#3A424D" : "#CBD5E1",
      backgroundColor: isDark ? "#14191F" : "#FFFFFF",
      borderRadius: 12,
      padding: 14,
      flexDirection: "row",
      alignItems: "center",
    },
    settingIcon: {
      width: 42,
      height: 42,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    settingCopy: {
      flex: 1,
    },
    settingTitle: {
      fontSize: 15,
      fontFamily: FONTS.bold,
      color: theme.foreground.white,
    },
    settingValue: {
      fontSize: 12,
      fontFamily: FONTS.medium,
      color: theme.foreground.gray,
      marginTop: 3,
    },
    tipCard: {
      flexDirection: "row",
      alignItems: "flex-start",
      backgroundColor: isDark ? "#14191F" : theme.background.darker,
      borderRadius: 12,
      padding: 14,
      marginTop: 20,
    },
    tipText: {
      flex: 1,
      fontSize: 12,
      fontFamily: FONTS.medium,
      color: theme.foreground.gray,
      lineHeight: 18,
      marginLeft: 9,
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
  const { userProfile } = useAuth();

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
    const [fcw, altW, h, a, g, act, freq, goal] = await Promise.all([
      AsyncStorage.getItem("@hylift_food_weight_current"),
      AsyncStorage.getItem("@hylift_weight"),
      AsyncStorage.getItem("@hylift_height"),
      AsyncStorage.getItem("@hylift_age"),
      AsyncStorage.getItem("@hylift_gender"),
      AsyncStorage.getItem("@hylift_activity_level"),
      AsyncStorage.getItem("@hylift_workout_frequency"),
      AsyncStorage.getItem("@hylift_goal"),
    ]);

    const resolvedWeight =
      userProfile?.weight_kg ??
      (fcw ? parseFloat(fcw) : altW ? parseFloat(altW) : 75);

    const computed = computeNutritionGoals({
      weightKg: resolvedWeight,
      heightCm: userProfile?.height_cm ?? (h ? parseFloat(h) : 175),
      age: ageFromDateOfBirth(userProfile?.date_of_birth) ?? (a ? parseInt(a, 10) : 25),
      gender: userProfile?.gender || g || "male",
      activityLevel: act || "moderate",
      workoutFrequency: userProfile?.workout_frequency ?? (freq ? parseInt(freq, 10) : 3),
      weightGoal: userProfile?.fitness_goal || goal || "lose_weight",
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
      <AppBar
        title={isFr ? "Objectif calorique" : "Calorie Goal"}
        bordered
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(40, insets.bottom + 24) },
        ]}
      >
        <TouchableOpacity
          style={styles.heroCard}
          activeOpacity={0.86}
          onPress={handleOpenCalorieModal}
        >
          <View style={styles.heroTopRow}>
            <Text style={styles.heroLabel}>
              {isFr ? "Votre objectif quotidien" : "Your daily target"}
            </Text>
            <View style={styles.heroEdit}>
              <Ionicons name="pencil" size={16} color="#FFFFFF" />
            </View>
          </View>
          <Text style={styles.heroValue}>{currentCalorieDisplay}</Text>
          <Text style={styles.heroSupport}>
            {isFr ? "Touchez pour ajuster votre objectif" : "Tap to adjust your target"}
          </Text>
          <View style={styles.heroFooter}>
            <Ionicons name="flame-outline" size={16} color="#FFFFFF" />
            <Text style={styles.heroFooterText}>
              {isFr ? "Plan nutritionnel personnalisé" : "Personalized nutrition plan"}
            </Text>
            <Ionicons name="chevron-forward" size={17} color="#FFFFFF" />
          </View>
        </TouchableOpacity>

        <Text style={styles.sectionLabel}>
          {isFr ? "Personnaliser" : "Personalize"}
        </Text>
        <View style={styles.settingsStack}>
          <TouchableOpacity
            style={styles.settingCard}
            activeOpacity={0.7}
            onPress={handleOpenRecalculate}
          >
            <View style={[styles.settingIcon, { backgroundColor: theme.primary.main + "18" }]}>
              <Ionicons name="refresh" size={21} color={theme.primary.main} />
            </View>
            <View style={styles.settingCopy}>
              <Text style={styles.settingTitle}>
                {isFr ? "Recalculer l'objectif" : "Recalculate target"}
              </Text>
              <Text style={styles.settingValue}>
                {isFr ? "À partir de vos données actuelles" : "Using your current profile"}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.foreground.gray} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingCard}
            activeOpacity={0.7}
            onPress={() => setIsWeekendModalVisible(true)}
          >
            <View style={[styles.settingIcon, { backgroundColor: theme.primary.main + "18" }]}>
              <Ionicons name="sunny-outline" size={21} color={theme.primary.main} />
            </View>
            <View style={styles.settingCopy}>
              <Text style={styles.settingTitle}>
                {isFr ? "Flexibilité le week-end" : "Weekend flexibility"}
              </Text>
              <Text style={styles.settingValue}>{currentWeekendLabel}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.foreground.gray} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingCard}
            activeOpacity={0.7}
            onPress={() => router.push("/settings/calorie-distribution")}
          >
            <View style={[styles.settingIcon, { backgroundColor: theme.primary.main + "18" }]}>
              <Ionicons name="pie-chart-outline" size={21} color={theme.primary.main} />
            </View>
            <View style={styles.settingCopy}>
              <Text style={styles.settingTitle}>
                {isFr ? "Répartition des calories" : "Calorie distribution"}
              </Text>
              <Text style={styles.settingValue}>
                {isFr ? "Répartir vos calories sur la journée" : "Plan your calories across the day"}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.foreground.gray} />
          </TouchableOpacity>
        </View>

        <View style={styles.tipCard}>
          <Ionicons name="information-circle-outline" size={18} color={theme.foreground.gray} />
          <Text style={styles.tipText}>
            {isFr
              ? "Un décompte de jeûne peut modifier votre objectif calorique."
              : "Starting a fasting timer may affect your calorie target."}
          </Text>
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

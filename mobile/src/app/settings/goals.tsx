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
import { useTheme } from "../../contexts/ThemeContext";
import { useNutrition } from "../../contexts/NutritionContext";

type GoalItem = {
  id: string;
  title: string;
  value: string;
};

function getGoalDisplay(goalId: string, isFr: boolean) {
  switch (goalId) {
    case "lose_weight":
      return isFr ? "Perdre du poids" : "Lose weight";
    case "maintain":
      return isFr ? "Maintenir son poids" : "Maintain weight";
    case "gain_weight":
      return isFr ? "Prendre du poids" : "Gain weight";
    case "build_muscle":
      return isFr ? "Prendre du muscle" : "Build muscle";
    default:
      return isFr ? "Perdre du poids" : "Lose weight";
  }
}

function getActivityDisplay(
  level: string | null,
  freqStr: string | null,
  isFr: boolean
) {
  let resolvedLevel = level;
  if (!resolvedLevel && freqStr) {
    const f = parseInt(freqStr, 10);
    if (!isNaN(f)) {
      resolvedLevel =
        f >= 6
          ? "very_active"
          : f >= 4
            ? "active"
            : f >= 2
              ? "moderate"
              : "light";
    }
  }
  switch (resolvedLevel) {
    case "light":
    case "sedentary":
      return isFr ? "Faible" : "Light";
    case "moderate":
      return isFr ? "Modéré" : "Moderate";
    case "active":
      return isFr ? "Élevé" : "High";
    case "very_active":
      return isFr ? "Très haut" : "Very high";
    default:
      return isFr ? "Élevé" : "High";
  }
}

function getWeeklyGoalDisplay(
  weeklyKg: string | null,
  goal: string,
  isFr: boolean
) {
  if (weeklyKg) {
    const val = parseFloat(weeklyKg);
    if (!isNaN(val)) {
      if (val === 0) return isFr ? "0,0 kg" : "0.0 kg";
      const formatted = Math.abs(val)
        .toFixed(2)
        .replace(".", ",")
        .replace(/0+$/, "")
        .replace(/,$/, "");
      return val < 0 ? `-${formatted} kg` : `+${formatted} kg`;
    }
  }
  if (goal === "gain_weight" || goal === "build_muscle") {
    return isFr ? "+0,35 kg" : "+0.35 kg";
  }
  if (goal === "maintain") {
    return isFr ? "0,0 kg" : "0.0 kg";
  }
  return isFr ? "-0,5 kg" : "-0.5 kg";
}

function getMacroPlanDisplay(plan: string | null, isFr: boolean) {
  switch (plan) {
    case "high_protein":
      return isFr ? "Riche en protéines" : "High Protein";
    case "low_carb":
      return isFr ? "Faible en glucides" : "Low Carb";
    case "keto":
      return isFr ? "Cétogène (Keto)" : "Keto";
    case "custom":
      return isFr ? "Personnalisé" : "Custom";
    case "balanced":
    default:
      return isFr ? "Équilibré (Par défaut)" : "Balanced (Default)";
  }
}

function formatWeight(w: number | null, fallback: string) {
  if (w === null || isNaN(w) || w <= 0) return fallback;
  return `${w.toFixed(1).replace(".", ",")} kg`;
}

function createStyles(theme: Theme) {
  const isDark = theme.background.dark === "#0B0D0E";
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background.dark,
    },

    listContent: {
      paddingTop: 2,
    },
    itemRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 18,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.background.accent,
    },
    itemTitle: {
      fontSize: 15,
      fontFamily: FONTS.semiBold,
      color: theme.foreground.white,
      lineHeight: 20,
    },
    itemValue: {
      fontSize: 13,
      fontFamily: FONTS.regular,
      color: theme.foreground.gray,
      marginTop: 2,
      lineHeight: 18,
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
      marginBottom: 18,
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

export default function GoalsScreen() {
  const router = useRouter();
  const { i18n } = useTranslation();
  const { theme } = useTheme();
  const { goals: nutritionGoals, updateGoals } = useNutrition();
  const insets = useSafeAreaInsets();
  const styles = createStyles(theme);
  const isFr = i18n.language?.startsWith("fr");
  const isDark = theme.background.dark === "#0B0D0E";

  const { userProfile, refreshUserProfile } = useAuth();
  const [selectedGoal, setSelectedGoal] = useState<string>("lose_weight");
  const [currentWeight, setCurrentWeight] = useState<number | null>(null);
  const [targetWeight, setTargetWeight] = useState<number | null>(null);
  const [activityLevel, setActivityLevel] = useState<string | null>(null);
  const [workoutFrequency, setWorkoutFrequency] = useState<string | null>(null);
  const [weeklyGoalKg, setWeeklyGoalKg] = useState<string | null>(null);
  const [dailySteps, setDailySteps] = useState<number>(10000);
  const [macroPlan, setMacroPlan] = useState<string | null>(null);

  // Daily Steps Modal State
  const [isStepsModalVisible, setIsStepsModalVisible] = useState(false);
  const [stepsInput, setStepsInput] = useState("");
  const [isSavingSteps, setIsSavingSteps] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refreshUserProfile().catch(() => {});
      Promise.all([
        AsyncStorage.getItem("@hylift_goal"),
        AsyncStorage.getItem("@hylift_food_weight_current"),
        AsyncStorage.getItem("@hylift_weight"),
        AsyncStorage.getItem("@hylift_food_weight_target"),
        AsyncStorage.getItem("@hylift_target_weight"),
        AsyncStorage.getItem("@hylift_activity_level"),
        AsyncStorage.getItem("@hylift_workout_frequency"),
        AsyncStorage.getItem("@hylift_weekly_goal_kg"),
        AsyncStorage.getItem("@hylift_daily_steps_goal"),
        AsyncStorage.getItem("@hylift_macro_plan"),
      ]).then(([goal, fcw, w, ftw, tw, act, freq, wgKg, steps, plan]) => {
        if (goal) setSelectedGoal(goal);
        else if (userProfile?.fitness_goal) setSelectedGoal(userProfile.fitness_goal);
        const cw = userProfile?.weight_kg ?? (fcw ? parseFloat(fcw) : (w ? parseFloat(w) : null));
        if (cw != null && !isNaN(cw) && cw > 0) setCurrentWeight(cw);
        const tg = userProfile?.target_weight_kg ?? (ftw ? parseFloat(ftw) : (tw ? parseFloat(tw) : null));
        if (tg != null && !isNaN(tg) && tg > 0) setTargetWeight(tg);
        if (act) setActivityLevel(act);
        if (freq) setWorkoutFrequency(freq);
        if (wgKg) setWeeklyGoalKg(wgKg);
        if (steps) {
          const parsedSteps = parseInt(steps, 10);
          if (!isNaN(parsedSteps) && parsedSteps > 0) {
            setDailySteps(parsedSteps);
          }
        }
        if (plan) setMacroPlan(plan);
      });
    }, [refreshUserProfile, userProfile])
  );

  const handlePressGoal = (id: string) => {
    if (id === "objective") {
      router.push({
        pathname: "/get-started/goal",
        params: { mode: "update" },
      });
    } else if (id === "starting_weight") {
      router.push({
        pathname: "/get-started/weight",
        params: { mode: "update" },
      });
    } else if (id === "target_weight") {
      router.push({
        pathname: "/get-started/target-weight",
        params: { mode: "update" },
      });
    } else if (id === "activity_level") {
      router.push({
        pathname: "/get-started/workout-frequency",
        params: { mode: "update" },
      });
    } else if (id === "weekly_goal") {
      router.push({
        pathname: "/get-started/weekly-goal",
        params: { mode: "update" },
      });
    } else if (id === "calorie_goal") {
      router.push("/settings/calorie-goal");
    } else if (id === "steps_goal") {
      setStepsInput(String(dailySteps));
      setIsStepsModalVisible(true);
    } else if (id === "nutrition_goal") {
      router.push("/settings/nutrition-goals");
    }
  };

  const handleSaveSteps = async () => {
    const parsed = parseInt(stepsInput.replace(/[^0-9]/g, ""), 10);
    if (isNaN(parsed) || parsed < 500 || parsed > 100000) {
      setIsStepsModalVisible(false);
      return;
    }
    setIsSavingSteps(true);
    try {
      setDailySteps(parsed);
      await AsyncStorage.setItem("@hylift_daily_steps_goal", parsed.toString());
      setIsStepsModalVisible(false);
    } catch (e) {
      console.warn("Failed to save steps", e);
      setIsStepsModalVisible(false);
    } finally {
      setIsSavingSteps(false);
    }
  };

  const calorieValue = nutritionGoals?.calorieGoal
    ? `${nutritionGoals.calorieGoal.toLocaleString(isFr ? "fr-FR" : "en-US")} kcal`
    : "2 000 kcal";

  const displayedCurrentWeight = userProfile?.weight_kg ?? currentWeight;
  const displayedTargetWeight = userProfile?.target_weight_kg ?? targetWeight;

  const goals: GoalItem[] = [
    {
      id: "objective",
      title: isFr ? "Objectif" : "Goal",
      value: getGoalDisplay(selectedGoal, !!isFr),
    },
    {
      id: "starting_weight",
      title: isFr ? "Poids actuel" : "Starting weight",
      value: formatWeight(displayedCurrentWeight, isFr ? "70,0 kg" : "70.0 kg"),
    },
    {
      id: "target_weight",
      title: isFr ? "Poids cible" : "Target weight",
      value: formatWeight(displayedTargetWeight, isFr ? "65,0 kg" : "65.0 kg"),
    },
    {
      id: "activity_level",
      title: isFr ? "Niveau d'activité" : "Activity level",
      value: getActivityDisplay(activityLevel, workoutFrequency, !!isFr),
    },
    {
      id: "weekly_goal",
      title: isFr ? "Objectif hebdomadaire" : "Weekly goal",
      value: getWeeklyGoalDisplay(weeklyGoalKg, selectedGoal, !!isFr),
    },
    {
      id: "calorie_goal",
      title: isFr ? "Objectif calorique" : "Calorie goal",
      value: calorieValue,
    },
    {
      id: "steps_goal",
      title: isFr ? "Nombre de pas" : "Daily steps",
      value: dailySteps.toLocaleString(isFr ? "fr-FR" : "en-US"),
    },
    {
      id: "nutrition_goal",
      title: isFr ? "Objectifs nutritionnels" : "Nutrition goals",
      value: getMacroPlanDisplay(macroPlan, !!isFr),
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Header */}
      <AppBar
        title={isFr ? "Mes objectifs" : "My Goals"}
        bordered
      />

      {/* Goals list */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: Math.max(40, insets.bottom + 24) },
        ]}
      >
        {goals.map((goal) => {
          const isEditable = [
            "objective",
            "starting_weight",
            "target_weight",
            "activity_level",
            "weekly_goal",
            "calorie_goal",
            "steps_goal",
            "nutrition_goal",
          ].includes(goal.id);
          return (
            <TouchableOpacity
              key={goal.id}
              style={styles.itemRow}
              activeOpacity={isEditable ? 0.7 : 1}
              onPress={() => handlePressGoal(goal.id)}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle}>{goal.title}</Text>
                <Text style={styles.itemValue}>{goal.value}</Text>
              </View>
              {isEditable && (
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={theme.foreground.gray}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Daily Steps Modal */}
      <Modal
        visible={isStepsModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsStepsModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setIsStepsModalVisible(false)}
          />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {isFr ? "Nombre de pas" : "Daily steps"}
            </Text>

            <TextInput
              style={styles.modalInput}
              value={stepsInput}
              onChangeText={setStepsInput}
              keyboardType="numeric"
              placeholder="10000"
              placeholderTextColor={theme.foreground.gray}
              selectionColor={theme.primary.main}
              autoFocus
              selectTextOnFocus
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setIsStepsModalVisible(false)}
                style={styles.modalCancelBtn}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelText}>
                  {isFr ? "ANNULER" : "CANCEL"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSaveSteps}
                style={[
                  styles.modalSaveBtn,
                  isSavingSteps && { opacity: 0.7 },
                ]}
                activeOpacity={0.7}
                disabled={isSavingSteps}
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

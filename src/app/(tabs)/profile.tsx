import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { BarChart, LineChart } from "react-native-gifted-charts";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FONTS } from "../../constants/fonts";
import { Theme } from "../../constants/themes";
import { useHealth } from "../../contexts/HealthContext";
import { useNutrition } from "../../contexts/NutritionContext";
import { useTheme } from "../../contexts/ThemeContext";
import { WeightEntry, WeightHistory } from "../../services/weightHistory";

// ── Storage keys (same as onboarding / alimentation) ─────────────────────
const KEYS = {
  weight: "@hylift_food_weight_current",
  targetWeight: "@hylift_food_weight_target",
  height: "@hylift_height",
  age: "@hylift_age",
  gender: "@hylift_gender",
  fitnessGoals: "@hylift_fitness_goals",
  displayName: "@hylift_display_name",
  username: "@hylift_username",
};

type Period = "daily" | "weekly" | "monthly";

// ── Helpers ──────────────────────────────────────────────────────────────
function calcBMI(weightKg: number, heightCm: number): number {
  if (heightCm <= 0) return 0;
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

function bmiCategory(bmi: number): { label: string; color: string } {
  if (bmi < 18.5) return { label: "Insuffisant", color: "#4A90D9" };
  if (bmi < 25) return { label: "Normal", color: "#34C759" };
  if (bmi < 30) return { label: "Surpoids", color: "#F5A623" };
  return { label: "Obésité", color: "#ED6665" };
}

function calcBMR(weight: number, height: number, age: number, gender: string): number {
  // Mifflin-St Jeor
  if (gender === "female") return 10 * weight + 6.25 * height - 5 * age - 161;
  return 10 * weight + 6.25 * height - 5 * age + 5;
}

const DAY_LABELS_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const DAY_LABELS_EN = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// ── Component ────────────────────────────────────────────────────────────
export default function Profile() {
  const { t, i18n } = useTranslation();
  const { theme, themeType } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const styles = createStyles(theme);
  const isFr = i18n.language?.startsWith("fr");
  const dayLabels = isFr ? DAY_LABELS_FR : DAY_LABELS_EN;

  // Health & Nutrition data
  const { todayCaloriesBurned, weeklyCaloriesBurned } = useHealth();
  const { goals, todaySummary, weekSummaries } = useNutrition();

  // Local state from AsyncStorage
  const [weight, setWeight] = useState(70);
  const [targetWeight, setTargetWeight] = useState(65);
  const [height, setHeight] = useState(175);
  const [age, setAge] = useState(25);
  const [gender, setGender] = useState("male");
  const [fitnessGoals, setFitnessGoals] = useState<string[]>([]);
  const [displayName, setDisplayName] = useState("");
  const [weightHistory, setWeightHistory] = useState<WeightEntry[]>([]);

  // Period tabs
  const [caloriesPeriod, setCaloriesPeriod] = useState<Period>("weekly");
  const [weightPeriod, setWeightPeriod] = useState<Period>("weekly");
  const [nutritionPeriod, setNutritionPeriod] = useState<Period>("weekly");

  // Load data on focus
  useFocusEffect(
    useCallback(() => {
      (async () => {
        const [w, tw, h, a, g, fg, dn, wh] = await Promise.all([
          AsyncStorage.getItem(KEYS.weight),
          AsyncStorage.getItem(KEYS.targetWeight),
          AsyncStorage.getItem(KEYS.height),
          AsyncStorage.getItem(KEYS.age),
          AsyncStorage.getItem(KEYS.gender),
          AsyncStorage.getItem(KEYS.fitnessGoals),
          AsyncStorage.getItem(KEYS.displayName),
          WeightHistory.getLastDays(30),
        ]);

        if (w) setWeight(Number(w) || 70);
        if (tw) setTargetWeight(Number(tw) || 65);
        if (h) setHeight(Number(h) || 175);
        if (a) setAge(Number(a) || 25);
        if (g) setGender(g);
        if (fg) {
          try { setFitnessGoals(JSON.parse(fg)); } catch { /* */ }
        }
        if (dn) setDisplayName(dn);
        setWeightHistory(wh);
      })();
    }, []) // Empty deps is fine — useFocusEffect re-runs on every screen focus
  );

  // ── Computed values ────────────────────────────────────────────────────
  const bmi = calcBMI(weight, height);
  const bmiInfo = bmiCategory(bmi);
  const bmr = calcBMR(weight, height, age, gender);
  const weightDiff = weight - targetWeight;
  const weightProgress = targetWeight > 0
    ? Math.min(Math.max(0, 1 - Math.abs(weightDiff) / Math.max(weight, targetWeight)), 1)
    : 0;

  // ── Calories Burned chart data ────────────────────────────────────────
  const caloriesChartData = useMemo(() => {
    if (caloriesPeriod === "daily") {
      return [{ value: Math.round(todayCaloriesBurned), label: isFr ? "Auj." : "Today", frontColor: theme.primary.main }];
    }

    if (caloriesPeriod === "weekly") {
      return dayLabels.map((label, i) => {
        const entry = weeklyCaloriesBurned[i];
        return {
          value: entry ? Math.round(entry.totalCalories) : 0,
          label,
          frontColor: theme.primary.main,
        };
      });
    }

    // Monthly: repeat weekly data x4 as approximation
    const weeks = [1, 2, 3, 4].map((w) => {
      const total = weeklyCaloriesBurned.reduce((s, d) => s + d.totalCalories, 0);
      return { value: Math.round(total), label: `S${w}`, frontColor: theme.primary.main };
    });
    return weeks;
  }, [caloriesPeriod, todayCaloriesBurned, weeklyCaloriesBurned, theme.primary.main, dayLabels, isFr]);

  const totalCaloriesBurned = useMemo(() => {
    if (caloriesPeriod === "daily") return Math.round(todayCaloriesBurned);
    return weeklyCaloriesBurned.reduce((s, d) => s + Math.round(d.totalCalories), 0);
  }, [caloriesPeriod, todayCaloriesBurned, weeklyCaloriesBurned]);

  // ── Weight chart data ─────────────────────────────────────────────────
  const weightChartData = useMemo(() => {
    if (weightHistory.length === 0) {
      return [{ value: weight, label: isFr ? "Auj." : "Today" }];
    }

    let entries = weightHistory;
    if (weightPeriod === "daily") {
      entries = entries.slice(-7);
    } else if (weightPeriod === "weekly") {
      entries = entries.slice(-14);
    } else {
      entries = entries.slice(-30);
    }

    return entries.map((e) => ({
      value: e.weight,
      label: e.date.slice(5), // MM-DD
    }));
  }, [weightHistory, weightPeriod, weight, isFr]);

  // ── Nutrition chart data ──────────────────────────────────────────────
  const nutritionData = useMemo(() => {
    if (nutritionPeriod === "daily") {
      return {
        calories: { current: Math.round(todaySummary.totalCalories), goal: goals.calorieGoal },
        protein: { current: Math.round(todaySummary.totalProtein), goal: goals.proteinGoal },
        carbs: { current: Math.round(todaySummary.totalCarbs), goal: goals.carbsGoal },
        fat: { current: Math.round(todaySummary.totalFat), goal: goals.fatGoal },
      };
    }

    // Weekly or monthly: aggregate weekSummaries
    const multiplier = nutritionPeriod === "monthly" ? 4 : 1;
    const totals = weekSummaries.reduce(
      (acc, day) => ({
        calories: acc.calories + day.totalCalories,
        protein: acc.protein + day.totalProtein,
        carbs: acc.carbs + day.totalCarbs,
        fat: acc.fat + day.totalFat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    const days = nutritionPeriod === "monthly" ? 30 : 7;
    return {
      calories: { current: Math.round(totals.calories * multiplier), goal: goals.calorieGoal * days },
      protein: { current: Math.round(totals.protein * multiplier), goal: goals.proteinGoal * days },
      carbs: { current: Math.round(totals.carbs * multiplier), goal: goals.carbsGoal * days },
      fat: { current: Math.round(totals.fat * multiplier), goal: goals.fatGoal * days },
    };
  }, [nutritionPeriod, todaySummary, weekSummaries, goals]);

  // ── Goal labels ───────────────────────────────────────────────────────
  const goalLabels: Record<string, { icon: keyof typeof Ionicons.glyphMap; label: string }> = {
    build_muscle: { icon: "barbell-outline", label: isFr ? "Muscle" : "Build Muscle" },
    lose_fat: { icon: "flame-outline", label: isFr ? "Perte gras" : "Lose Fat" },
    get_stronger: { icon: "trophy-outline", label: isFr ? "Force" : "Strength" },
    stay_fit: { icon: "heart-outline", label: isFr ? "Forme" : "Stay Fit" },
    athletic: { icon: "flash-outline", label: isFr ? "Athlétique" : "Athletic" },
    body_recomp: { icon: "body-outline", label: isFr ? "Recomp" : "Recomp" },
  };

  // ── Renders ────────────────────────────────────────────────────────────
  const renderPeriodTabs = (current: Period, setter: (p: Period) => void) => (
    <View style={styles.periodTabs}>
      {(["daily", "weekly", "monthly"] as Period[]).map((p) => (
        <Pressable
          key={p}
          style={[styles.periodTab, current === p && styles.periodTabActive]}
          onPress={() => setter(p)}
        >
          <Text style={[styles.periodTabText, current === p && styles.periodTabTextActive]}>
            {p === "daily" ? (isFr ? "Jour" : "Day") : p === "weekly" ? (isFr ? "Semaine" : "Week") : (isFr ? "Mois" : "Month")}
          </Text>
        </Pressable>
      ))}
    </View>
  );

  const renderProgressBar = (
    label: string,
    current: number,
    goal: number,
    color: string,
    unit: string,
  ) => {
    const pct = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
    return (
      <View style={styles.progressItem} key={label}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>{label}</Text>
          <Text style={styles.progressValue}>
            <Text style={{ color: theme.foreground.white, fontFamily: FONTS.bold }}>
              {current}{unit}
            </Text>{" "}
            / {goal}{unit}
          </Text>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${pct}%`, backgroundColor: color }]} />
        </View>
      </View>
    );
  };

  const chartTextColor = theme.foreground.gray;

  return (
    <View style={styles.container}>
      {themeType === "female" && (
        <Image
          source={require("../../../assets/girly.png")}
          style={styles.bgOverlay}
          resizeMode="cover"
        />
      )}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 4, paddingBottom: Math.max(100, 24 + insets.bottom) }}
      >
        {/* ── Header ──────────────────────────────────────────────── */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{isFr ? "Profil" : "Profile"}</Text>
          <Pressable style={styles.settingsBtn} onPress={() => router.push("/settings" as any)}>
            <Ionicons name="settings-outline" size={20} color={theme.foreground.white} />
          </Pressable>
        </View>

        {/* ── User Card ───────────────────────────────────────────── */}
        <View style={styles.userCard}>
          <Pressable onPress={() => router.push("/settings/edit-profile" as any)}>
            <Image
              source={
                themeType === "female"
                  ? require("../../../assets/images/AuthPage/female/HoldingTwoWeights.jpg")
                  : require("../../../assets/images/AuthPage/HoldingTwoWeights.jpg")
              }
              style={styles.avatar}
            />
          </Pressable>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{displayName || (isFr ? "Utilisateur" : "User")}</Text>
            <Text style={styles.userMeta}>
              {age} {isFr ? "ans" : "y/o"} · {height} cm · {weight} kg
            </Text>
            {fitnessGoals.length > 0 && (
              <View style={styles.goalTags}>
                {fitnessGoals.slice(0, 3).map((g) => {
                  const info = goalLabels[g];
                  if (!info) return null;
                  return (
                    <View key={g} style={styles.goalTag}>
                      <Ionicons name={info.icon} size={12} color={theme.primary.main} />
                      <Text style={styles.goalTagText}>{info.label}</Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </View>

        {/* ── Progression Card ────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="trending-up" size={18} color={theme.primary.main} />{" "}
            {isFr ? "Progression" : "Progress"}
          </Text>

          {/* Weight progress */}
          <View style={styles.weightRow}>
            <View style={styles.weightBox}>
              <Text style={styles.weightBoxLabel}>{isFr ? "Actuel" : "Current"}</Text>
              <Text style={styles.weightBoxValue}>{weight} <Text style={styles.weightBoxUnit}>kg</Text></Text>
            </View>
            <View style={styles.weightArrow}>
              <Ionicons
                name={weightDiff > 0 ? "arrow-forward" : weightDiff < 0 ? "arrow-forward" : "checkmark"}
                size={20}
                color={theme.primary.main}
              />
              <Text style={[styles.weightDiffText, { color: weightDiff === 0 ? "#34C759" : theme.primary.main }]}>
                {weightDiff > 0 ? `-${weightDiff} kg` : weightDiff < 0 ? `+${Math.abs(weightDiff)} kg` : isFr ? "Atteint!" : "Reached!"}
              </Text>
            </View>
            <View style={styles.weightBox}>
              <Text style={styles.weightBoxLabel}>{isFr ? "Objectif" : "Target"}</Text>
              <Text style={styles.weightBoxValue}>{targetWeight} <Text style={styles.weightBoxUnit}>kg</Text></Text>
            </View>
          </View>

          {/* Progress bar */}
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${Math.round(weightProgress * 100)}%`, backgroundColor: "#34C759" }]} />
          </View>
          <Text style={styles.progressPct}>{Math.round(weightProgress * 100)}%</Text>

          {/* BMI & BMR */}
          <View style={styles.metricsRow}>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>BMI</Text>
              <Text style={[styles.metricValue, { color: bmiInfo.color }]}>{bmi.toFixed(1)}</Text>
              <Text style={[styles.metricSub, { color: bmiInfo.color }]}>{bmiInfo.label}</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>{isFr ? "Métab. basal" : "Basal Metab."}</Text>
              <Text style={styles.metricValue}>{Math.round(bmr)}</Text>
              <Text style={styles.metricSub}>kcal/{isFr ? "jour" : "day"}</Text>
            </View>
          </View>
        </View>

        {/* ── Calories Burned ─────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="flame" size={18} color="#FF6B35" />{" "}
            {isFr ? "Calories brûlées" : "Calories Burned"}
          </Text>
          {renderPeriodTabs(caloriesPeriod, setCaloriesPeriod)}

          <Text style={styles.bigStat}>
            {totalCaloriesBurned} <Text style={styles.bigStatUnit}>kcal</Text>
          </Text>

          <View style={styles.chartContainer}>
            <BarChart
              data={caloriesChartData}
              barWidth={caloriesChartData.length <= 4 ? 40 : 28}
              spacing={caloriesChartData.length <= 4 ? 30 : 14}
              roundedTop
              roundedBottom
              noOfSections={4}
              yAxisThickness={0}
              xAxisThickness={0}
              xAxisLabelTextStyle={{ color: chartTextColor, fontSize: 10, fontFamily: FONTS.semiBold }}
              yAxisTextStyle={{ color: chartTextColor, fontSize: 10 }}
              hideRules
              barBorderRadius={6}
              isAnimated
              height={140}
              width={280}
            />
          </View>
        </View>

        {/* ── Weight Analysis ─────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="analytics" size={18} color="#4A90D9" />{" "}
            {isFr ? "Analyse du poids" : "Weight Analysis"}
          </Text>
          {renderPeriodTabs(weightPeriod, setWeightPeriod)}

          <Text style={styles.bigStat}>
            {weight} <Text style={styles.bigStatUnit}>kg</Text>
          </Text>

          {weightChartData.length >= 1 ? (
            <View style={styles.chartContainer}>
              <LineChart
                data={weightChartData}
                color={theme.primary.main}
                thickness={3}
                noOfSections={4}
                yAxisThickness={0}
                xAxisThickness={0}
                xAxisLabelTextStyle={{ color: chartTextColor, fontSize: 9, fontFamily: FONTS.semiBold }}
                yAxisTextStyle={{ color: chartTextColor, fontSize: 10 }}
                hideRules
                curved={weightChartData.length > 2}
                isAnimated
                height={140}
                width={280}
                dataPointsColor={theme.primary.main}
                dataPointsRadius={5}
                startFillColor={`${theme.primary.main}30`}
                endFillColor={`${theme.primary.main}05`}
                areaChart
              />
            </View>
          ) : (
            <View style={styles.emptyChart}>
              <Ionicons name="scale-outline" size={32} color={theme.foreground.gray} />
              <Text style={styles.emptyChartText}>
                {isFr
                  ? "Mettez à jour votre poids dans Alimentation pour voir le graphe"
                  : "Update your weight in Alimentation to see the chart"}
              </Text>
            </View>
          )}
        </View>

        {/* ── Nutritional Intake ───────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="nutrition" size={18} color="#34C759" />{" "}
            {isFr ? "Apport nutritionnel" : "Nutritional Intake"}
          </Text>
          {renderPeriodTabs(nutritionPeriod, setNutritionPeriod)}

          <View style={styles.nutritionStats}>
            {renderProgressBar(isFr ? "Calories" : "Calories", nutritionData.calories.current, nutritionData.calories.goal, theme.primary.main, " kcal")}
            {renderProgressBar(isFr ? "Protéines" : "Protein", nutritionData.protein.current, nutritionData.protein.goal, "#4A90D9", "g")}
            {renderProgressBar(isFr ? "Glucides" : "Carbs", nutritionData.carbs.current, nutritionData.carbs.goal, "#F5A623", "g")}
            {renderProgressBar(isFr ? "Lipides" : "Fat", nutritionData.fat.current, nutritionData.fat.goal, "#ED6665", "g")}
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────
function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background.dark },
    bgOverlay: {
      position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
      width: "100%", height: "100%", opacity: 0.3,
    },
    header: {
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      paddingHorizontal: 20, paddingVertical: 10,
    },
    headerTitle: {
      fontFamily: FONTS.extraBold, fontSize: 26,
      color: theme.foreground.white, letterSpacing: -0.5,
    },
    settingsBtn: {
      width: 38, height: 38, borderRadius: 12,
      alignItems: "center", justifyContent: "center",
      backgroundColor: theme.background.accent,
    },

    // User Card
    userCard: {
      marginHorizontal: 20, marginBottom: 16, padding: 16,
      borderRadius: 20, backgroundColor: theme.background.darker,
      flexDirection: "row", alignItems: "center", gap: 14,
    },
    avatar: {
      width: 72, height: 72, borderRadius: 36,
      borderWidth: 2, borderColor: theme.primary.main,
    },
    userInfo: { flex: 1 },
    userName: {
      fontFamily: FONTS.bold, fontSize: 18, color: theme.foreground.white,
    },
    userMeta: {
      fontFamily: FONTS.semiBold, fontSize: 13, color: theme.foreground.gray, marginTop: 2,
    },
    goalTags: {
      flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8,
    },
    goalTag: {
      flexDirection: "row", alignItems: "center", gap: 4,
      paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
      backgroundColor: `${theme.primary.main}15`,
    },
    goalTagText: {
      fontFamily: FONTS.semiBold, fontSize: 11, color: theme.primary.main,
    },

    // Card
    card: {
      marginHorizontal: 20, marginBottom: 16, padding: 20,
      borderRadius: 20, backgroundColor: theme.background.darker,
    },
    sectionTitle: {
      fontFamily: FONTS.bold, fontSize: 17, color: theme.foreground.white,
      marginBottom: 16, letterSpacing: -0.3,
    },

    // Period Tabs
    periodTabs: {
      flexDirection: "row", backgroundColor: theme.background.dark,
      borderRadius: 12, padding: 3, marginBottom: 16,
    },
    periodTab: {
      flex: 1, alignItems: "center", justifyContent: "center",
      paddingVertical: 8, borderRadius: 10,
    },
    periodTabActive: {
      backgroundColor: theme.primary.main,
    },
    periodTabText: {
      fontFamily: FONTS.semiBold, fontSize: 12, color: theme.foreground.gray,
    },
    periodTabTextActive: {
      color: "#FFF",
    },

    // Weight Progress
    weightRow: {
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      marginBottom: 16,
    },
    weightBox: {
      alignItems: "center", flex: 1,
      padding: 12, borderRadius: 14,
      backgroundColor: theme.background.dark,
    },
    weightBoxLabel: {
      fontFamily: FONTS.semiBold, fontSize: 11, color: theme.foreground.gray,
      textTransform: "uppercase", letterSpacing: 0.5,
    },
    weightBoxValue: {
      fontFamily: FONTS.extraBold, fontSize: 22, color: theme.foreground.white, marginTop: 4,
    },
    weightBoxUnit: {
      fontSize: 14, color: theme.foreground.gray,
    },
    weightArrow: {
      alignItems: "center", paddingHorizontal: 8,
    },
    weightDiffText: {
      fontFamily: FONTS.bold, fontSize: 11, marginTop: 2,
    },

    progressBarBg: {
      height: 10, borderRadius: 5, backgroundColor: `${theme.foreground.gray}30`,
      overflow: "hidden",
    },
    progressBarFill: {
      height: "100%", borderRadius: 5,
    },
    progressPct: {
      fontFamily: FONTS.bold, fontSize: 12, color: "#34C759",
      textAlign: "right", marginTop: 6,
    },

    // Metrics
    metricsRow: {
      flexDirection: "row", marginTop: 16,
      backgroundColor: theme.background.dark, borderRadius: 14,
      padding: 14,
    },
    metricBox: {
      flex: 1, alignItems: "center",
    },
    metricDivider: {
      width: 1, backgroundColor: `${theme.foreground.gray}30`,
      marginHorizontal: 10,
    },
    metricLabel: {
      fontFamily: FONTS.semiBold, fontSize: 11, color: theme.foreground.gray,
      textTransform: "uppercase", letterSpacing: 0.3,
    },
    metricValue: {
      fontFamily: FONTS.extraBold, fontSize: 24, color: theme.foreground.white,
      marginTop: 4,
    },
    metricSub: {
      fontFamily: FONTS.semiBold, fontSize: 11, color: theme.foreground.gray, marginTop: 2,
    },

    // Big stat
    bigStat: {
      fontFamily: FONTS.extraBold, fontSize: 32, color: theme.foreground.white,
      textAlign: "center", marginBottom: 12,
    },
    bigStatUnit: {
      fontSize: 16, color: theme.foreground.gray,
    },

    // Chart
    chartContainer: {
      alignItems: "center", overflow: "hidden",
    },

    // Empty chart
    emptyChart: {
      alignItems: "center", paddingVertical: 30, gap: 10,
    },
    emptyChartText: {
      fontFamily: FONTS.regular, fontSize: 13, color: theme.foreground.gray,
      textAlign: "center", lineHeight: 18, paddingHorizontal: 20,
    },

    // Nutrition
    nutritionStats: {
      gap: 16,
    },
    progressItem: {},
    progressHeader: {
      flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end",
      marginBottom: 8,
    },
    progressLabel: {
      fontFamily: FONTS.bold, fontSize: 14, color: theme.foreground.white,
    },
    progressValue: {
      fontFamily: FONTS.semiBold, fontSize: 12, color: theme.foreground.gray,
    },
  });
}

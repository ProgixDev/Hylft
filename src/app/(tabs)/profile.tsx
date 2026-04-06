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
import Svg, { Circle } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FONTS } from "../../constants/fonts";
import { Theme } from "../../constants/themes";
import { useHealth } from "../../contexts/HealthContext";
import { useNutrition } from "../../contexts/NutritionContext";
import { useTheme } from "../../contexts/ThemeContext";
import { WeightEntry, WeightHistory } from "../../services/weightHistory";

const KEYS = {
  weight: "@hylift_food_weight_current",
  targetWeight: "@hylift_food_weight_target",
  height: "@hylift_height",
  age: "@hylift_age",
  gender: "@hylift_gender",
  fitnessGoals: "@hylift_fitness_goals",
  displayName: "@hylift_display_name",
};

type Period = "daily" | "weekly" | "monthly";

function calcBMI(w: number, h: number) { return h > 0 ? w / ((h / 100) ** 2) : 0; }

function bmiInfo(bmi: number) {
  if (bmi < 18.5) return { label: "Insuffisant", color: "#4A90D9" };
  if (bmi < 25) return { label: "Normal", color: "#34C759" };
  if (bmi < 30) return { label: "Surpoids", color: "#F5A623" };
  return { label: "Obésité", color: "#ED6665" };
}

function calcBMR(w: number, h: number, age: number, g: string) {
  return g === "female" ? 10 * w + 6.25 * h - 5 * age - 161 : 10 * w + 6.25 * h - 5 * age + 5;
}

// Mini ring for stats
function MiniRing({ pct, size, color, strokeWidth = 4 }: { pct: number; size: number; color: string; strokeWidth?: number }) {
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const o = c * (1 - Math.min(pct, 1));
  return (
    <Svg width={size} height={size}>
      <Circle cx={size / 2} cy={size / 2} r={r} stroke={`${color}20`} strokeWidth={strokeWidth} fill="none" />
      <Circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={strokeWidth} fill="none"
        strokeLinecap="round" strokeDasharray={`${c}`} strokeDashoffset={o} rotation="-90" origin={`${size / 2}, ${size / 2}`} />
    </Svg>
  );
}

export default function Profile() {
  const { i18n } = useTranslation();
  const { theme, themeType } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const styles = createStyles(theme);
  const isFr = i18n.language?.startsWith("fr");

  const { todayCaloriesBurned, weeklyCaloriesBurned } = useHealth();
  const { goals, todaySummary, weekSummaries } = useNutrition();

  const [weight, setWeight] = useState(70);
  const [targetWeight, setTargetWeight] = useState(65);
  const [height, setHeight] = useState(175);
  const [age, setAge] = useState(25);
  const [gender, setGender] = useState("male");
  const [fitnessGoals, setFitnessGoals] = useState<string[]>([]);
  const [displayName, setDisplayName] = useState("");
  const [weightHistory, setWeightHistory] = useState<WeightEntry[]>([]);

  const [caloriesPeriod, setCaloriesPeriod] = useState<Period>("weekly");
  const [weightPeriod, setWeightPeriod] = useState<Period>("weekly");
  const [nutritionPeriod, setNutritionPeriod] = useState<Period>("daily");

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const [w, tw, h, a, g, fg, dn, wh] = await Promise.all([
          AsyncStorage.getItem(KEYS.weight), AsyncStorage.getItem(KEYS.targetWeight),
          AsyncStorage.getItem(KEYS.height), AsyncStorage.getItem(KEYS.age),
          AsyncStorage.getItem(KEYS.gender), AsyncStorage.getItem(KEYS.fitnessGoals),
          AsyncStorage.getItem(KEYS.displayName), WeightHistory.getLastDays(30),
        ]);
        if (w) setWeight(Number(w) || 70);
        if (tw) setTargetWeight(Number(tw) || 65);
        if (h) setHeight(Number(h) || 175);
        if (a) setAge(Number(a) || 25);
        if (g) setGender(g);
        if (fg) { try { setFitnessGoals(JSON.parse(fg)); } catch { /* */ } }
        if (dn) setDisplayName(dn);
        setWeightHistory(wh);
      })();
    }, [])
  );

  const bmi = calcBMI(weight, height);
  const bmiData = bmiInfo(bmi);
  const bmr = calcBMR(weight, height, age, gender);
  const weightDiff = weight - targetWeight;

  // Calories chart
  const dayLabels = isFr ? ["L", "M", "M", "J", "V", "S", "D"] : ["M", "T", "W", "T", "F", "S", "S"];
  const caloriesChart = useMemo(() => {
    if (caloriesPeriod === "daily") {
      return [{ value: Math.round(todayCaloriesBurned), label: isFr ? "Auj" : "Today", frontColor: theme.primary.main }];
    }
    return dayLabels.map((label, i) => ({
      value: weeklyCaloriesBurned[i] ? Math.round(weeklyCaloriesBurned[i].totalCalories) : 0,
      label, frontColor: theme.primary.main,
    }));
  }, [caloriesPeriod, todayCaloriesBurned, weeklyCaloriesBurned, theme.primary.main, dayLabels, isFr]);

  const totalBurned = caloriesPeriod === "daily"
    ? Math.round(todayCaloriesBurned)
    : weeklyCaloriesBurned.reduce((s, d) => s + Math.round(d.totalCalories), 0);

  // Weight chart
  const weightChart = useMemo(() => {
    if (weightHistory.length === 0) return [{ value: weight, label: isFr ? "Auj" : "Today" }];
    const entries = weightPeriod === "daily" ? weightHistory.slice(-7) : weightPeriod === "weekly" ? weightHistory.slice(-14) : weightHistory.slice(-30);
    return entries.map((e) => ({ value: e.weight, label: e.date.slice(8) })); // DD
  }, [weightHistory, weightPeriod, weight, isFr]);

  // Nutrition
  const nutritionData = useMemo(() => {
    if (nutritionPeriod === "daily") {
      return {
        calories: { current: Math.round(todaySummary.totalCalories), goal: goals.calorieGoal },
        protein: { current: Math.round(todaySummary.totalProtein), goal: goals.proteinGoal },
        carbs: { current: Math.round(todaySummary.totalCarbs), goal: goals.carbsGoal },
        fat: { current: Math.round(todaySummary.totalFat), goal: goals.fatGoal },
      };
    }
    const mult = nutritionPeriod === "monthly" ? 4 : 1;
    const tot = weekSummaries.reduce((a, d) => ({
      cal: a.cal + d.totalCalories, pro: a.pro + d.totalProtein, car: a.car + d.totalCarbs, fat: a.fat + d.totalFat,
    }), { cal: 0, pro: 0, car: 0, fat: 0 });
    const days = nutritionPeriod === "monthly" ? 30 : 7;
    return {
      calories: { current: Math.round(tot.cal * mult), goal: goals.calorieGoal * days },
      protein: { current: Math.round(tot.pro * mult), goal: goals.proteinGoal * days },
      carbs: { current: Math.round(tot.car * mult), goal: goals.carbsGoal * days },
      fat: { current: Math.round(tot.fat * mult), goal: goals.fatGoal * days },
    };
  }, [nutritionPeriod, todaySummary, weekSummaries, goals]);

  const goalMap: Record<string, { icon: keyof typeof Ionicons.glyphMap; label: string }> = {
    build_muscle: { icon: "barbell-outline", label: isFr ? "Muscle" : "Muscle" },
    lose_fat: { icon: "flame-outline", label: isFr ? "Sèche" : "Cut" },
    get_stronger: { icon: "trophy-outline", label: isFr ? "Force" : "Strength" },
    stay_fit: { icon: "heart-outline", label: isFr ? "Forme" : "Fitness" },
    athletic: { icon: "flash-outline", label: isFr ? "Athlète" : "Athletic" },
    body_recomp: { icon: "body-outline", label: isFr ? "Recomp" : "Recomp" },
  };

  const renderTabs = (current: Period, setter: (p: Period) => void) => (
    <View style={styles.tabs}>
      {(["daily", "weekly", "monthly"] as Period[]).map((p) => (
        <Pressable key={p} style={[styles.tab, current === p && styles.tabActive]} onPress={() => setter(p)}>
          <Text style={[styles.tabText, current === p && styles.tabTextActive]}>
            {p === "daily" ? (isFr ? "Jour" : "Day") : p === "weekly" ? (isFr ? "Sem." : "Week") : (isFr ? "Mois" : "Month")}
          </Text>
        </Pressable>
      ))}
    </View>
  );

  const chartColor = theme.foreground.gray;

  return (
    <View style={styles.container}>
      {themeType === "female" && (
        <Image source={require("../../../assets/girly.png")} style={styles.bgOverlay} resizeMode="cover" />
      )}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 4, paddingBottom: Math.max(100, 24 + insets.bottom) }}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{isFr ? "Profil" : "Profile"}</Text>
          <Pressable style={styles.headerBtn} onPress={() => router.push("/settings" as any)}>
            <Ionicons name="settings-outline" size={18} color={theme.foreground.white} />
          </Pressable>
        </View>

        {/* ── User Card ───────────────────────────────────────────── */}
        <View style={styles.userCard}>
          <Pressable onPress={() => router.push("/settings/edit-profile" as any)}>
            <Image
              source={themeType === "female"
                ? require("../../../assets/images/AuthPage/female/HoldingTwoWeights.jpg")
                : require("../../../assets/images/AuthPage/HoldingTwoWeights.jpg")}
              style={styles.avatar}
            />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.userName}>{displayName || (isFr ? "Utilisateur" : "User")}</Text>
            <Text style={styles.userSub}>{age} {isFr ? "ans" : "y/o"} · {height} cm</Text>
            {fitnessGoals.length > 0 && (
              <View style={styles.goalRow}>
                {fitnessGoals.slice(0, 3).map((g) => {
                  const info = goalMap[g];
                  if (!info) return null;
                  return (
                    <View key={g} style={styles.goalPill}>
                      <Ionicons name={info.icon} size={10} color={theme.primary.main} />
                      <Text style={styles.goalPillText}>{info.label}</Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </View>

        {/* ── Stats Row ───────────────────────────────────────────── */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>{isFr ? "Poids" : "Weight"}</Text>
            <Text style={styles.statVal}>{weight}<Text style={styles.statUnit}> kg</Text></Text>
            <Text style={[styles.statDiff, { color: weightDiff === 0 ? "#34C759" : theme.primary.main }]}>
              {weightDiff > 0 ? `${weightDiff} kg à perdre` : weightDiff < 0 ? `${Math.abs(weightDiff)} kg à prendre` : (isFr ? "Objectif atteint" : "Goal reached")}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>IMC</Text>
            <Text style={[styles.statVal, { color: bmiData.color }]}>{bmi.toFixed(1)}</Text>
            <Text style={[styles.statDiff, { color: bmiData.color }]}>{bmiData.label}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>{isFr ? "Métab." : "BMR"}</Text>
            <Text style={styles.statVal}>{Math.round(bmr)}</Text>
            <Text style={styles.statDiff}>kcal/{isFr ? "j" : "d"}</Text>
          </View>
        </View>

        {/* ── Calories Burned ─────────────────────────────────────── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="flame" size={16} color="#FF6B35" />
            <Text style={styles.cardTitle}>{isFr ? "Calories brûlées" : "Calories Burned"}</Text>
          </View>
          {renderTabs(caloriesPeriod, setCaloriesPeriod)}
          <Text style={styles.bigNum}>{totalBurned} <Text style={styles.bigUnit}>kcal</Text></Text>
          <View style={styles.chartWrap}>
            <BarChart
              data={caloriesChart}
              barWidth={caloriesChart.length <= 2 ? 50 : 26}
              spacing={caloriesChart.length <= 2 ? 30 : 12}
              roundedTop roundedBottom
              noOfSections={3}
              yAxisThickness={0} xAxisThickness={0}
              xAxisLabelTextStyle={{ color: chartColor, fontSize: 10, fontFamily: FONTS.semiBold }}
              yAxisTextStyle={{ color: chartColor, fontSize: 9 }}
              hideRules barBorderRadius={5} isAnimated height={120} width={260}
            />
          </View>
        </View>

        {/* ── Weight Analysis ─────────────────────────────────────── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="analytics" size={16} color="#4A90D9" />
            <Text style={styles.cardTitle}>{isFr ? "Évolution du poids" : "Weight Trend"}</Text>
          </View>
          {renderTabs(weightPeriod, setWeightPeriod)}
          <Text style={styles.bigNum}>{weight} <Text style={styles.bigUnit}>kg</Text></Text>
          {weightChart.length >= 1 && (
            <View style={styles.chartWrap}>
              <LineChart
                data={weightChart}
                color={theme.primary.main} thickness={2.5}
                noOfSections={3}
                yAxisThickness={0} xAxisThickness={0}
                xAxisLabelTextStyle={{ color: chartColor, fontSize: 9, fontFamily: FONTS.semiBold }}
                yAxisTextStyle={{ color: chartColor, fontSize: 9 }}
                hideRules curved={weightChart.length > 2}
                isAnimated height={120} width={260}
                dataPointsColor={theme.primary.main} dataPointsRadius={4}
                startFillColor={`${theme.primary.main}25`} endFillColor={`${theme.primary.main}05`}
                areaChart
              />
            </View>
          )}
        </View>

        {/* ── Nutrition ───────────────────────────────────────────── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="nutrition" size={16} color="#34C759" />
            <Text style={styles.cardTitle}>{isFr ? "Apport nutritionnel" : "Nutrition"}</Text>
          </View>
          {renderTabs(nutritionPeriod, setNutritionPeriod)}

          {[
            { label: isFr ? "Calories" : "Calories", ...nutritionData.calories, color: theme.primary.main, unit: " kcal" },
            { label: isFr ? "Protéines" : "Protein", ...nutritionData.protein, color: "#4A90D9", unit: "g" },
            { label: isFr ? "Glucides" : "Carbs", ...nutritionData.carbs, color: "#F5A623", unit: "g" },
            { label: isFr ? "Lipides" : "Fat", ...nutritionData.fat, color: "#ED6665", unit: "g" },
          ].map((m) => {
            const pct = m.goal > 0 ? Math.min(m.current / m.goal, 1) : 0;
            return (
              <View key={m.label} style={styles.nutriRow}>
                <View style={styles.nutriInfo}>
                  <View style={[styles.nutriDot, { backgroundColor: m.color }]} />
                  <Text style={styles.nutriLabel}>{m.label}</Text>
                </View>
                <View style={styles.nutriBarWrap}>
                  <View style={styles.nutriBarBg}>
                    <View style={[styles.nutriBarFill, { width: `${pct * 100}%`, backgroundColor: m.color }]} />
                  </View>
                </View>
                <Text style={styles.nutriVal}>{m.current}<Text style={styles.nutriGoal}>/{m.goal}{m.unit}</Text></Text>
              </View>
            );
          })}
        </View>

      </ScrollView>
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background.dark },
    bgOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%", opacity: 0.3 },

    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 8 },
    headerTitle: { fontFamily: FONTS.extraBold, fontSize: 24, color: theme.foreground.white, letterSpacing: -0.5 },
    headerBtn: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: theme.background.accent },

    // User
    userCard: {
      marginHorizontal: 20, marginBottom: 12, padding: 14,
      borderRadius: 16, backgroundColor: theme.background.darker,
      flexDirection: "row", alignItems: "center", gap: 12,
    },
    avatar: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: theme.primary.main },
    userName: { fontFamily: FONTS.bold, fontSize: 16, color: theme.foreground.white },
    userSub: { fontFamily: FONTS.regular, fontSize: 12, color: theme.foreground.gray, marginTop: 1 },
    goalRow: { flexDirection: "row", gap: 6, marginTop: 6 },
    goalPill: {
      flexDirection: "row", alignItems: "center", gap: 3,
      paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6,
      backgroundColor: `${theme.primary.main}12`,
    },
    goalPillText: { fontFamily: FONTS.semiBold, fontSize: 10, color: theme.primary.main },

    // Stats
    statsRow: { flexDirection: "row", marginHorizontal: 20, gap: 8, marginBottom: 14 },
    statCard: {
      flex: 1, padding: 12, borderRadius: 14, backgroundColor: theme.background.darker,
      alignItems: "center",
    },
    statLabel: { fontFamily: FONTS.semiBold, fontSize: 10, color: theme.foreground.gray, textTransform: "uppercase", letterSpacing: 0.3 },
    statVal: { fontFamily: FONTS.extraBold, fontSize: 20, color: theme.foreground.white, marginTop: 4 },
    statUnit: { fontSize: 12, color: theme.foreground.gray },
    statDiff: { fontFamily: FONTS.regular, fontSize: 10, color: theme.foreground.gray, marginTop: 2, textAlign: "center" },

    // Card
    card: { marginHorizontal: 20, marginBottom: 12, padding: 16, borderRadius: 16, backgroundColor: theme.background.darker },
    cardHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
    cardTitle: { fontFamily: FONTS.bold, fontSize: 15, color: theme.foreground.white },

    // Tabs
    tabs: { flexDirection: "row", backgroundColor: theme.background.dark, borderRadius: 10, padding: 2, marginBottom: 12 },
    tab: { flex: 1, alignItems: "center", paddingVertical: 6, borderRadius: 8 },
    tabActive: { backgroundColor: theme.primary.main },
    tabText: { fontFamily: FONTS.semiBold, fontSize: 11, color: theme.foreground.gray },
    tabTextActive: { color: "#FFF" },

    bigNum: { fontFamily: FONTS.extraBold, fontSize: 28, color: theme.foreground.white, textAlign: "center", marginBottom: 8 },
    bigUnit: { fontSize: 14, color: theme.foreground.gray },

    chartWrap: { alignItems: "center", overflow: "hidden" },

    // Nutrition rows
    nutriRow: { flexDirection: "row", alignItems: "center", marginBottom: 12, gap: 8 },
    nutriInfo: { flexDirection: "row", alignItems: "center", gap: 5, width: 75 },
    nutriDot: { width: 6, height: 6, borderRadius: 3 },
    nutriLabel: { fontFamily: FONTS.semiBold, fontSize: 12, color: theme.foreground.white },
    nutriBarWrap: { flex: 1 },
    nutriBarBg: { height: 8, borderRadius: 4, backgroundColor: `${theme.foreground.gray}20` },
    nutriBarFill: { height: "100%", borderRadius: 4 },
    nutriVal: { fontFamily: FONTS.bold, fontSize: 11, color: theme.foreground.white, minWidth: 70, textAlign: "right" },
    nutriGoal: { fontFamily: FONTS.regular, color: theme.foreground.gray },
  });
}

import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { BarChart, LineChart, PieChart } from "react-native-gifted-charts";
import Svg, { Circle } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FONTS } from "../../constants/fonts";
import { Theme } from "../../constants/themes";
import { useHealth } from "../../contexts/HealthContext";
import { useNutrition } from "../../contexts/NutritionContext";
import { useTheme } from "../../contexts/ThemeContext";
import { WeightEntry, WeightHistory } from "../../services/weightHistory";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

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

// ── Ring component ─────────────────────────────────────────────────────────
function ProgressRing({ pct, size, color, strokeWidth = 6, children }: {
  pct: number; size: number; color: string; strokeWidth?: number; children?: React.ReactNode;
}) {
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const o = c * (1 - Math.min(pct, 1));
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={`${color}20`} strokeWidth={strokeWidth} fill="none" />
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={strokeWidth} fill="none"
          strokeLinecap="round" strokeDasharray={`${c}`} strokeDashoffset={o} rotation="-90" origin={`${size / 2}, ${size / 2}`} />
      </Svg>
      {children}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
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
  const [activityPeriod, setActivityPeriod] = useState<Period>("weekly");

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

  const dayLabels = isFr ? ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"] : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const todayIdx = (new Date().getDay() + 6) % 7;

  const caloriesChart = useMemo(() => {
    if (activityPeriod === "daily") {
      return [{ value: Math.round(todayCaloriesBurned), label: isFr ? "Auj" : "Today", frontColor: theme.primary.main }];
    }
    return dayLabels.map((label, i) => ({
      value: weeklyCaloriesBurned[i] ? Math.round(weeklyCaloriesBurned[i].totalCalories) : Math.round(Math.random() * 300 + 50),
      label,
      frontColor: i === todayIdx ? theme.primary.main : `${theme.foreground.gray}40`,
    }));
  }, [activityPeriod, todayCaloriesBurned, weeklyCaloriesBurned, theme, dayLabels, todayIdx, isFr]);

  const totalBurned = activityPeriod === "daily"
    ? Math.round(todayCaloriesBurned)
    : weeklyCaloriesBurned.reduce((s, d) => s + Math.round(d.totalCalories), 0);

  // Weight chart data
  const weightChart = useMemo(() => {
    if (weightHistory.length === 0) return [{ value: weight, label: isFr ? "Auj" : "Today" }];
    const entries = weightHistory.slice(-14);
    return entries.map((e) => ({ value: e.weight, label: e.date.slice(8) }));
  }, [weightHistory, weight, isFr]);

  return (
    <View style={styles.container}>
      {themeType === "female" && (
        <Image source={require("../../../assets/girly.png")} style={styles.bgOverlay} resizeMode="cover" />
      )}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 4, paddingBottom: Math.max(100, 24 + insets.bottom) }}>

        {/* ── Header ─────────────────────────────────────────────── */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="chevron-back" size={24} color={theme.foreground.white} />
          </Pressable>
          <Text style={styles.headerTitle}>{isFr ? "PROFIL" : "PROFILE"}</Text>
          <Pressable style={styles.headerBtn} onPress={() => router.push("/settings" as any)}>
            <Ionicons name="settings-outline" size={18} color={theme.foreground.white} />
          </Pressable>
        </View>

        {/* ── Activity Section ───────────────────────────────────── */}
        <Text style={styles.sectionTitle}>{isFr ? "Activité" : "Activity"}</Text>

        {/* Period tabs */}
        <View style={styles.periodRow}>
          {(["daily", "weekly", "monthly"] as Period[]).map((p) => {
            const active = p === activityPeriod;
            const label = p === "daily" ? (isFr ? "Jour" : "Today") : p === "weekly" ? (isFr ? "Semaine" : "Week") : (isFr ? "Mois" : "Month");
            return (
              <Pressable key={p} style={[styles.periodTab, active && styles.periodTabActive]} onPress={() => setActivityPeriod(p)}>
                <Text style={[styles.periodText, active && styles.periodTextActive]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* ── Weight Progress ──────────────────────────────────── */}
        <Text style={styles.sectionTitle}>{isFr ? "Évolution du poids" : "Weight Progress"}</Text>

        <View style={styles.chartCard}>
          <View style={styles.weightHeader}>
            <View>
              <Text style={styles.weightCurrent}>{weight} <Text style={styles.weightUnit}>kg</Text></Text>
              <Text style={styles.weightTarget}>
                {isFr ? "Objectif" : "Goal"}: {targetWeight} kg
              </Text>
            </View>
            <View style={[styles.weightBadge, {
              backgroundColor: weight <= targetWeight ? "#34C75920" : `${theme.primary.main}20`,
            }]}>
              <Ionicons
                name={weight <= targetWeight ? "trending-down" : "trending-up"}
                size={16}
                color={weight <= targetWeight ? "#34C759" : theme.primary.main}
              />
              <Text style={[styles.weightBadgeText, {
                color: weight <= targetWeight ? "#34C759" : theme.primary.main,
              }]}>
                {Math.abs(weight - targetWeight)} kg {weight <= targetWeight ? (isFr ? "atteint" : "reached") : (isFr ? "restant" : "left")}
              </Text>
            </View>
          </View>

          {weightChart.length >= 1 && (
            <View style={styles.chartWrap}>
              <LineChart
                data={weightChart}
                color={theme.primary.main} thickness={2.5}
                noOfSections={3}
                yAxisThickness={0} xAxisThickness={0}
                xAxisLabelTextStyle={{ color: theme.foreground.gray, fontSize: 9, fontFamily: FONTS.semiBold }}
                yAxisTextStyle={{ color: theme.foreground.gray, fontSize: 9 }}
                hideRules curved={weightChart.length > 2}
                isAnimated height={140} width={SCREEN_WIDTH - 80}
                dataPointsColor={theme.primary.main} dataPointsRadius={4}
                startFillColor={`${theme.primary.main}25`} endFillColor={`${theme.primary.main}05`}
                areaChart
              />
            </View>
          )}
        </View>

        {/* ── Body Stats ─────────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>{isFr ? "Corps" : "Body"}</Text>

        <View style={styles.bodyRow}>
          <View style={styles.bodyCard}>
            <Text style={styles.bodyLabel}>{isFr ? "Poids" : "Weight"}</Text>
            <Text style={styles.bodyValue}>{weight}<Text style={styles.bodyUnit}> kg</Text></Text>
          </View>
          <View style={styles.bodyCard}>
            <Text style={styles.bodyLabel}>IMC</Text>
            <Text style={[styles.bodyValue, { color: bmiData.color }]}>{bmi.toFixed(1)}</Text>
            <Text style={[styles.bodyBadge, { color: bmiData.color }]}>{bmiData.label}</Text>
          </View>
          <View style={styles.bodyCard}>
            <Text style={styles.bodyLabel}>{isFr ? "Métab." : "BMR"}</Text>
            <Text style={styles.bodyValue}>{Math.round(bmr)}</Text>
            <Text style={styles.bodyUnit}>kcal/{isFr ? "j" : "d"}</Text>
          </View>
        </View>

        {/* ── Calories Brûlées (Bar Chart) ────────────────────── */}
        <Text style={styles.sectionTitle}>{isFr ? "Calories brûlées" : "Calories Burned"}</Text>
        <View style={styles.chartCard}>
          <Text style={styles.chartTotal}>{totalBurned} <Text style={styles.chartTotalUnit}>kcal</Text></Text>
          <View style={styles.chartWrap}>
            <BarChart
              data={caloriesChart}
              barWidth={28}
              spacing={14}
              roundedTop roundedBottom
              noOfSections={3}
              yAxisThickness={0} xAxisThickness={0}
              xAxisLabelTextStyle={{ color: theme.foreground.gray, fontSize: 10, fontFamily: FONTS.semiBold }}
              yAxisTextStyle={{ color: theme.foreground.gray, fontSize: 9 }}
              hideRules barBorderRadius={6}
              isAnimated height={130} width={SCREEN_WIDTH - 80}
            />
          </View>
        </View>

        {/* ── Apport Nutritionnel (Bar Chart) ────────────────────── */}
        <Text style={styles.sectionTitle}>{isFr ? "Apport nutritionnel" : "Nutrition Intake"}</Text>
        <View style={styles.chartCard}>
          <View style={styles.chartWrap}>
            <BarChart
              data={[
                { value: Math.round(todaySummary.totalProtein), label: isFr ? "Prot" : "Prot", frontColor: "#4A90D9" },
                { value: Math.round(todaySummary.totalCarbs), label: isFr ? "Gluc" : "Carbs", frontColor: "#F5A623" },
                { value: Math.round(todaySummary.totalFat), label: isFr ? "Lip" : "Fat", frontColor: "#ED6665" },
              ]}
              barWidth={40}
              spacing={30}
              roundedTop roundedBottom
              noOfSections={3}
              yAxisThickness={0} xAxisThickness={0}
              xAxisLabelTextStyle={{ color: theme.foreground.gray, fontSize: 11, fontFamily: FONTS.semiBold }}
              yAxisTextStyle={{ color: theme.foreground.gray, fontSize: 9 }}
              yAxisSuffix="g"
              hideRules barBorderRadius={6}
              isAnimated height={130} width={SCREEN_WIDTH - 80}
            />
          </View>
          <View style={styles.nutriLegend}>
            {[
              { label: isFr ? "Protéines" : "Protein", val: `${Math.round(todaySummary.totalProtein)}/${goals.proteinGoal}g`, color: "#4A90D9" },
              { label: isFr ? "Glucides" : "Carbs", val: `${Math.round(todaySummary.totalCarbs)}/${goals.carbsGoal}g`, color: "#F5A623" },
              { label: isFr ? "Lipides" : "Fat", val: `${Math.round(todaySummary.totalFat)}/${goals.fatGoal}g`, color: "#ED6665" },
            ].map((l) => (
              <View key={l.label} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: l.color }]} />
                <Text style={styles.legendLabel}>{l.label}</Text>
                <Text style={styles.legendVal}>{l.val}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Séances par semaine (Bar Chart) ────────────────────── */}
        <Text style={styles.sectionTitle}>{isFr ? "Séances / semaine" : "Sessions / week"}</Text>
        <View style={styles.chartCard}>
          <View style={styles.chartWrap}>
            <BarChart
              data={dayLabels.map((label, i) => ({
                value: i <= todayIdx ? Math.round(Math.random() * 2) + (i === todayIdx ? 1 : 0) : 0,
                label,
                frontColor: i === todayIdx ? theme.primary.main : `${theme.foreground.gray}40`,
              }))}
              barWidth={28}
              spacing={14}
              roundedTop roundedBottom
              noOfSections={3}
              yAxisThickness={0} xAxisThickness={0}
              xAxisLabelTextStyle={{ color: theme.foreground.gray, fontSize: 10, fontFamily: FONTS.semiBold }}
              yAxisTextStyle={{ color: theme.foreground.gray, fontSize: 9 }}
              hideRules barBorderRadius={6}
              isAnimated height={100} width={SCREEN_WIDTH - 80}
            />
          </View>
        </View>

        {/* ── Groupes musculaires (Pie Chart) ────────────────────── */}
        <Text style={styles.sectionTitle}>{isFr ? "Répartition musculaire" : "Muscle Split"}</Text>
        <View style={styles.chartCard}>
          <View style={styles.pieRow}>
            <PieChart
              data={[
                { value: 30, color: theme.primary.main, text: "30%" },
                { value: 25, color: "#4A90D9", text: "25%" },
                { value: 20, color: "#F5A623", text: "20%" },
                { value: 15, color: "#34C759", text: "15%" },
                { value: 10, color: "#ED6665", text: "10%" },
              ]}
              donut
              radius={65}
              innerRadius={40}
              innerCircleColor={theme.background.darker}
              centerLabelComponent={() => (
                <Text style={styles.pieCenter}>5</Text>
              )}
            />
            <View style={styles.pieLegend}>
              {[
                { label: isFr ? "Jambes" : "Legs", pct: "30%", color: theme.primary.main },
                { label: isFr ? "Pectoraux" : "Chest", pct: "25%", color: "#4A90D9" },
                { label: isFr ? "Dos" : "Back", pct: "20%", color: "#F5A623" },
                { label: isFr ? "Épaules" : "Shoulders", pct: "15%", color: "#34C759" },
                { label: isFr ? "Bras" : "Arms", pct: "10%", color: "#ED6665" },
              ].map((m) => (
                <View key={m.label} style={styles.pieLegendRow}>
                  <View style={[styles.legendDot, { backgroundColor: m.color }]} />
                  <Text style={styles.pieLegendLabel}>{m.label}</Text>
                  <Text style={styles.pieLegendPct}>{m.pct}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* ── Résumé rapide ──────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>{isFr ? "Résumé" : "Summary"}</Text>
        <View style={styles.summaryGrid}>
          {[
            { icon: "flame-outline" as const, value: `${totalBurned}`, unit: "kcal", label: isFr ? "Brûlées" : "Burned", color: "#FF6B35" },
            { icon: "walk-outline" as const, value: "7 250", unit: "", label: isFr ? "Pas" : "Steps", color: "#4A90D9" },
            { icon: "water-outline" as const, value: "1.5", unit: "L", label: isFr ? "Eau" : "Water", color: "#34C759" },
            { icon: "time-outline" as const, value: "45", unit: "min", label: isFr ? "Actif" : "Active", color: "#F5A623" },
            { icon: "fitness-outline" as const, value: `${weight}`, unit: "kg", label: isFr ? "Poids" : "Weight", color: theme.primary.main },
            { icon: "heart-outline" as const, value: `${bmi.toFixed(1)}`, unit: "", label: "IMC", color: bmiData.color },
          ].map((s, i) => (
            <View key={i} style={styles.summaryItem}>
              <View style={[styles.summaryIcon, { backgroundColor: `${s.color}15` }]}>
                <Ionicons name={s.icon} size={20} color={s.color} />
              </View>
              <Text style={styles.summaryValue}>{s.value}<Text style={styles.summaryUnit}> {s.unit}</Text></Text>
              <Text style={styles.summaryLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

      </ScrollView>
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────
function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background.dark },
    bgOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%", opacity: 0.3 },

    // Header
    header: {
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      paddingHorizontal: 20, paddingVertical: 12,
    },
    headerTitle: { fontFamily: FONTS.extraBold, fontSize: 20, color: theme.foreground.white, letterSpacing: 1, textTransform: "uppercase" },
    headerBtn: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: theme.background.accent },

    // Section title
    sectionTitle: {
      fontFamily: FONTS.extraBold, fontSize: 18, color: theme.foreground.white,
      marginHorizontal: 20, marginTop: 16, marginBottom: 12,
    },

    // Period tabs
    periodRow: { flexDirection: "row", marginHorizontal: 20, gap: 10, marginBottom: 16 },
    periodTab: {
      paddingHorizontal: 22, paddingVertical: 10, borderRadius: 24,
      backgroundColor: theme.background.darker,
    },
    periodTabActive: { backgroundColor: theme.foreground.white },
    periodText: { fontFamily: FONTS.bold, fontSize: 13, color: theme.foreground.gray },
    periodTextActive: { color: theme.background.dark },

    // Chart
    chartCard: {
      marginHorizontal: 20, marginBottom: 8, padding: 16,
      borderRadius: 20, backgroundColor: theme.background.darker,
    },
    chartWrap: { alignItems: "center", overflow: "hidden" },

    // Weight progress header
    weightHeader: {
      flexDirection: "row", justifyContent: "space-between", alignItems: "center",
      marginBottom: 16,
    },
    weightCurrent: { fontFamily: FONTS.extraBold, fontSize: 28, color: theme.foreground.white },
    weightUnit: { fontSize: 14, color: theme.foreground.gray },
    weightTarget: { fontFamily: FONTS.regular, fontSize: 12, color: theme.foreground.gray, marginTop: 2 },
    weightBadge: {
      flexDirection: "row", alignItems: "center", gap: 4,
      paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    },
    weightBadgeText: { fontFamily: FONTS.bold, fontSize: 12 },

    // Body stats
    bodyRow: { flexDirection: "row", marginHorizontal: 20, gap: 8, marginBottom: 14 },
    bodyCard: {
      flex: 1, padding: 14, borderRadius: 16, backgroundColor: theme.background.darker,
      alignItems: "center",
    },
    bodyLabel: { fontFamily: FONTS.semiBold, fontSize: 10, color: theme.foreground.gray, textTransform: "uppercase", letterSpacing: 0.3 },
    bodyValue: { fontFamily: FONTS.extraBold, fontSize: 22, color: theme.foreground.white, marginTop: 4 },
    bodyUnit: { fontSize: 12, color: theme.foreground.gray },
    bodyBadge: { fontFamily: FONTS.regular, fontSize: 10, marginTop: 2 },

    // Chart total
    chartTotal: { fontFamily: FONTS.extraBold, fontSize: 24, color: theme.foreground.white, marginBottom: 8 },
    chartTotalUnit: { fontSize: 14, color: theme.foreground.gray },

    // Nutrition legend
    nutriLegend: { flexDirection: "row", justifyContent: "space-between", marginTop: 14 },
    legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
    legendDot: { width: 8, height: 8, borderRadius: 4 },
    legendLabel: { fontFamily: FONTS.semiBold, fontSize: 11, color: theme.foreground.gray },
    legendVal: { fontFamily: FONTS.bold, fontSize: 11, color: theme.foreground.white },

    // Pie chart
    pieRow: { flexDirection: "row", alignItems: "center", gap: 20 },
    pieCenter: { fontFamily: FONTS.extraBold, fontSize: 18, color: theme.foreground.white },
    pieLegend: { flex: 1, gap: 8 },
    pieLegendRow: { flexDirection: "row", alignItems: "center", gap: 6 },
    pieLegendLabel: { fontFamily: FONTS.medium, fontSize: 12, color: theme.foreground.white, flex: 1 },
    pieLegendPct: { fontFamily: FONTS.bold, fontSize: 12, color: theme.foreground.gray },

    // Summary grid
    summaryGrid: {
      flexDirection: "row", flexWrap: "wrap", marginHorizontal: 20,
      gap: 10, marginBottom: 16,
    },
    summaryItem: {
      width: (SCREEN_WIDTH - 60) / 3, padding: 14, borderRadius: 16,
      backgroundColor: theme.background.darker, alignItems: "center", gap: 6,
    },
    summaryIcon: {
      width: 40, height: 40, borderRadius: 20,
      alignItems: "center", justifyContent: "center",
    },
    summaryValue: { fontFamily: FONTS.extraBold, fontSize: 18, color: theme.foreground.white },
    summaryUnit: { fontSize: 11, color: theme.foreground.gray },
    summaryLabel: { fontFamily: FONTS.medium, fontSize: 10, color: theme.foreground.gray, textTransform: "uppercase" },
  });
}

import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Svg, { Circle } from "react-native-svg";
import { FONTS } from "../../constants/fonts";
import { Theme } from "../../constants/themes";
import { useHealth } from "../../contexts/HealthContext";
import { useNutrition } from "../../contexts/NutritionContext";
import { useTheme } from "../../contexts/ThemeContext";
import type { MealEntry, MealType } from "../../services/nutritionApi";
import { WeightHistory } from "../../services/weightHistory";

const STORAGE_KEYS = {
  waterMl: "@hylift_food_water_ml",
  weightCurrent: "@hylift_food_weight_current",
  weightTarget: "@hylift_food_weight_target",
  notesByDate: "@hylift_food_notes_by_date",
};

const WATER_GOAL_ML = 2000;
const GLASS_STEP_ML = 250;

const MEAL_CONFIG: { type: MealType; iconName: keyof typeof Ionicons.glyphMap; color: string; ratio: number }[] = [
  { type: "breakfast", iconName: "sunny", color: "#F5A623", ratio: 0.25 },
  { type: "lunch", iconName: "restaurant", color: "#4A90D9", ratio: 0.35 },
  { type: "dinner", iconName: "moon", color: "#8B5CF6", ratio: 0.3 },
  { type: "snack", iconName: "cafe", color: "#34C759", ratio: 0.1 },
];

// ── Circular Progress Ring ───────────────────────────────────────────────
function CalorieRing({ consumed, goal, burned, size, theme }: {
  consumed: number; goal: number; burned: number; size: number; theme: Theme;
}) {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const remaining = Math.max(goal - consumed + burned, 0);
  const pct = goal > 0 ? Math.min(consumed / goal, 1) : 0;
  const offset = circumference * (1 - pct);

  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={`${theme.foreground.gray}20`}
          strokeWidth={strokeWidth} fill="none"
        />
        <Circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={theme.primary.main}
          strokeWidth={strokeWidth} fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={offset}
          rotation="-90" origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={{ position: "absolute", alignItems: "center" }}>
        <Text style={{ fontFamily: FONTS.extraBold, fontSize: 28, color: theme.foreground.white }}>
          {Math.round(remaining)}
        </Text>
        <Text style={{ fontFamily: FONTS.semiBold, fontSize: 11, color: theme.foreground.gray, marginTop: -2 }}>
          kcal restant
        </Text>
      </View>
    </View>
  );
}

export default function Alimentation() {
  const router = useRouter();
  const { theme, themeType } = useTheme();
  const { t } = useTranslation();
  const { todayCaloriesBurned } = useHealth();
  const { goals, todayMeals, todaySummary, removeMeal } = useNutrition();
  const styles = createStyles(theme);

  const [waterMl, setWaterMl] = useState(0);
  const [weightCurrent, setWeightCurrent] = useState(70);
  const [weightTarget, setWeightTarget] = useState(65);
  const [noteInput, setNoteInput] = useState("");
  const [dailyNotes, setDailyNotes] = useState<string[]>([]);

  const today = useMemo(() => new Date().toISOString().split("T")[0], []);

  useEffect(() => {
    (async () => {
      try {
        const [savedWater, savedWeight, savedTarget, savedNotes] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.waterMl),
          AsyncStorage.getItem(STORAGE_KEYS.weightCurrent),
          AsyncStorage.getItem(STORAGE_KEYS.weightTarget),
          AsyncStorage.getItem(STORAGE_KEYS.notesByDate),
        ]);
        if (savedWater) setWaterMl(Number(savedWater) || 0);
        if (savedWeight) setWeightCurrent(Number(savedWeight) || 70);
        if (savedTarget) setWeightTarget(Number(savedTarget) || 65);
        if (savedNotes) {
          const parsed = JSON.parse(savedNotes) as Record<string, string[]>;
          setDailyNotes(parsed[today] ?? []);
        }
      } catch { /* */ }
    })();
  }, [today]);

  useEffect(() => { AsyncStorage.setItem(STORAGE_KEYS.waterMl, String(waterMl)); }, [waterMl]);
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEYS.weightCurrent, String(weightCurrent));
    WeightHistory.log(weightCurrent);
  }, [weightCurrent]);
  useEffect(() => { AsyncStorage.setItem(STORAGE_KEYS.weightTarget, String(weightTarget)); }, [weightTarget]);

  const caloriesEaten = todaySummary.totalCalories;
  const caloriesBurned = todayCaloriesBurned;

  const macros = [
    { key: "protein", label: t("food.protein", "Protéines"), current: todaySummary.totalProtein, goal: goals.proteinGoal, color: "#4A90D9" },
    { key: "carbs", label: t("food.carbs", "Glucides"), current: todaySummary.totalCarbs, goal: goals.carbsGoal, color: "#F5A623" },
    { key: "fat", label: t("food.fat", "Lipides"), current: todaySummary.totalFat, goal: goals.fatGoal, color: "#ED6665" },
  ];

  const getMealsForType = (type: MealType) => todayMeals.filter((m) => m.mealType === type);
  const getMealTypeCalories = (type: MealType) => getMealsForType(type).reduce((s, m) => s + m.calories, 0);
  const mealCalorieGoal = (ratio: number) => Math.round(goals.calorieGoal * ratio);

  const openFoodSearch = (mealType: MealType) => router.push(`/food-search?mealType=${mealType}` as any);

  const saveDailyNotes = async (nextNotes: string[]) => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.notesByDate);
      const parsed: Record<string, string[]> = raw ? JSON.parse(raw) : {};
      parsed[today] = nextNotes;
      await AsyncStorage.setItem(STORAGE_KEYS.notesByDate, JSON.stringify(parsed));
    } catch { /* */ }
  };

  const handleAddNote = async () => {
    const trimmed = noteInput.trim();
    if (!trimmed) return;
    const updated = [trimmed, ...dailyNotes];
    setDailyNotes(updated);
    setNoteInput("");
    await saveDailyNotes(updated);
  };

  const waterPct = Math.min(waterMl / WATER_GOAL_ML, 1);
  const waterGlasses = Math.floor(waterMl / GLASS_STEP_ML);

  return (
    <View style={styles.container}>
      {themeType === "female" && (
        <Image source={require("../../../assets/girly.png")} style={styles.bgOverlay} resizeMode="cover" />
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>{t("food.title", "Nutrition")}</Text>
            <Text style={styles.headerDate}>
              {new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}
            </Text>
          </View>
        </View>

        {/* ── Calorie Ring + Macros ─────────────────────────────────── */}
        <View style={styles.summaryCard}>
          <CalorieRing consumed={caloriesEaten} goal={goals.calorieGoal} burned={caloriesBurned} size={150} theme={theme} />

          <View style={styles.summaryStats}>
            <View style={styles.summaryStat}>
              <Text style={styles.summaryStatValue}>{Math.round(caloriesEaten)}</Text>
              <Text style={styles.summaryStatLabel}>{t("food.eaten", "Mangé")}</Text>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: `${theme.foreground.gray}30` }]} />
            <View style={styles.summaryStat}>
              <Text style={styles.summaryStatValue}>{Math.round(caloriesBurned)}</Text>
              <Text style={styles.summaryStatLabel}>{t("food.burned", "Brûlé")}</Text>
            </View>
          </View>

          {/* Macros inline */}
          <View style={styles.macrosRow}>
            {macros.map((m) => {
              const pct = m.goal > 0 ? Math.min(m.current / m.goal, 1) : 0;
              return (
                <View key={m.key} style={styles.macroChip}>
                  <View style={styles.macroChipHeader}>
                    <View style={[styles.macroDot, { backgroundColor: m.color }]} />
                    <Text style={styles.macroChipLabel}>{m.label}</Text>
                  </View>
                  <Text style={styles.macroChipValue}>
                    {Math.round(m.current)}<Text style={styles.macroChipUnit}>/{m.goal}g</Text>
                  </Text>
                  <View style={styles.macroChipBar}>
                    <View style={[styles.macroChipFill, { width: `${pct * 100}%`, backgroundColor: m.color }]} />
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* ── Meals ────────────────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>{t("food.mealsSection", "Repas")}</Text>

        {MEAL_CONFIG.map((item) => {
          const meals = getMealsForType(item.type);
          const consumed = getMealTypeCalories(item.type);
          const target = mealCalorieGoal(item.ratio);
          const pct = target > 0 ? Math.min(consumed / target, 1) : 0;

          return (
            <Pressable key={item.type} style={styles.mealCard} onPress={() => openFoodSearch(item.type)}>
              <View style={styles.mealTop}>
                <View style={[styles.mealIcon, { backgroundColor: `${item.color}18` }]}>
                  <Ionicons name={item.iconName} size={18} color={item.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.mealTitle}>{t(`food.${item.type}`)}</Text>
                  <View style={styles.mealBarRow}>
                    <View style={styles.mealBar}>
                      <View style={[styles.mealBarFill, { width: `${pct * 100}%`, backgroundColor: item.color }]} />
                    </View>
                    <Text style={styles.mealKcal}>{Math.round(consumed)}/{target}</Text>
                  </View>
                </View>
                <Pressable style={[styles.mealAddBtn, { borderColor: `${item.color}40` }]} onPress={() => openFoodSearch(item.type)}>
                  <Ionicons name="add" size={18} color={item.color} />
                </Pressable>
              </View>

              {meals.length > 0 && (
                <View style={styles.mealFoods}>
                  {meals.map((meal) => (
                    <View key={meal.id} style={styles.mealFoodRow}>
                      <Text style={styles.mealFoodName} numberOfLines={1}>{meal.foodName}</Text>
                      <Text style={styles.mealFoodKcal}>{Math.round(meal.calories)} kcal</Text>
                      <Pressable hitSlop={8} onPress={() => removeMeal(meal.id)}>
                        <Ionicons name="close" size={16} color={theme.foreground.gray} />
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}
            </Pressable>
          );
        })}

        {/* ── Water + Weight Row ────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>{t("food.water", "Hydratation")} & {t("food.bodyData", "Poids")}</Text>

        <View style={styles.dualRow}>
          {/* Water */}
          <View style={[styles.miniCard, { flex: 1 }]}>
            <Ionicons name="water" size={20} color="#4A90D9" />
            <Text style={styles.miniValue}>
              {(waterMl / 1000).toFixed(1)}<Text style={styles.miniUnit}> L</Text>
            </Text>
            <View style={styles.waterBarBg}>
              <View style={[styles.waterBarFill, { width: `${waterPct * 100}%` }]} />
            </View>
            <Text style={styles.miniSub}>{waterGlasses}/8 {t("food.glasses", "verres")}</Text>
            <View style={styles.waterBtns}>
              <Pressable style={styles.waterMinusBtn} onPress={() => setWaterMl((v) => Math.max(0, v - GLASS_STEP_ML))}>
                <Ionicons name="remove" size={16} color={theme.foreground.gray} />
              </Pressable>
              <Pressable style={styles.waterPlusBtn} onPress={() => setWaterMl((v) => Math.min(WATER_GOAL_ML * 2, v + GLASS_STEP_ML))}>
                <Ionicons name="add" size={16} color="#fff" />
              </Pressable>
            </View>
          </View>

          {/* Weight */}
          <View style={[styles.miniCard, { flex: 1 }]}>
            <Ionicons name="fitness" size={20} color={theme.primary.main} />
            <Text style={styles.miniValue}>
              {weightCurrent}<Text style={styles.miniUnit}> kg</Text>
            </Text>
            <Text style={styles.miniSub}>
              {t("food.target", "Cible")}: {weightTarget} kg
            </Text>
            <View style={styles.weightBtns}>
              <Pressable style={styles.weightBtn} onPress={() => setWeightCurrent((v) => Math.max(30, v - 1))}>
                <Ionicons name="remove" size={16} color={theme.foreground.gray} />
              </Pressable>
              <Pressable style={[styles.weightBtn, { backgroundColor: `${theme.primary.main}20` }]} onPress={() => setWeightCurrent((v) => Math.min(300, v + 1))}>
                <Ionicons name="add" size={16} color={theme.primary.main} />
              </Pressable>
            </View>
          </View>
        </View>

        {/* ── Notes ────────────────────────────────────────────────── */}
        <View style={styles.notesSection}>
          <View style={styles.noteInputRow}>
            <TextInput
              style={styles.noteInput}
              placeholder={t("food.notePlaceholder", "Note du jour...")}
              placeholderTextColor={theme.foreground.gray}
              value={noteInput}
              onChangeText={setNoteInput}
            />
            <Pressable style={styles.noteSendBtn} onPress={handleAddNote}>
              <Ionicons name="send" size={16} color="#fff" />
            </Pressable>
          </View>
          {dailyNotes.map((note, i) => (
            <View key={`${note}-${i}`} style={styles.noteChip}>
              <Text style={styles.noteChipText}>{note}</Text>
            </View>
          ))}
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
    scrollContent: { paddingBottom: 100, paddingTop: 8 },

    // Header
    header: { paddingHorizontal: 20, paddingBottom: 16 },
    headerTitle: { fontFamily: FONTS.extraBold, fontSize: 26, color: theme.foreground.white, letterSpacing: -0.5 },
    headerDate: { fontFamily: FONTS.semiBold, fontSize: 13, color: theme.foreground.gray, marginTop: 2, textTransform: "capitalize" },

    // Summary
    summaryCard: {
      marginHorizontal: 20, marginBottom: 20, padding: 20,
      borderRadius: 20, backgroundColor: theme.background.darker,
      alignItems: "center",
    },
    summaryStats: { flexDirection: "row", alignItems: "center", marginTop: 14, gap: 20 },
    summaryStat: { alignItems: "center" },
    summaryStatValue: { fontFamily: FONTS.bold, fontSize: 16, color: theme.foreground.white },
    summaryStatLabel: { fontFamily: FONTS.regular, fontSize: 11, color: theme.foreground.gray, marginTop: 2 },
    summaryDivider: { width: 1, height: 28 },

    // Macros
    macrosRow: { flexDirection: "row", gap: 8, marginTop: 16, width: "100%" },
    macroChip: { flex: 1, padding: 10, borderRadius: 12, backgroundColor: theme.background.dark },
    macroChipHeader: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 4 },
    macroDot: { width: 6, height: 6, borderRadius: 3 },
    macroChipLabel: { fontFamily: FONTS.semiBold, fontSize: 10, color: theme.foreground.gray, textTransform: "uppercase" },
    macroChipValue: { fontFamily: FONTS.bold, fontSize: 14, color: theme.foreground.white },
    macroChipUnit: { fontFamily: FONTS.regular, fontSize: 10, color: theme.foreground.gray },
    macroChipBar: { height: 4, borderRadius: 2, backgroundColor: `${theme.foreground.gray}20`, marginTop: 6 },
    macroChipFill: { height: "100%", borderRadius: 2 },

    // Section
    sectionLabel: {
      fontFamily: FONTS.bold, fontSize: 16, color: theme.foreground.white,
      marginHorizontal: 20, marginBottom: 10, marginTop: 4,
    },

    // Meals
    mealCard: {
      marginHorizontal: 20, marginBottom: 8, padding: 14,
      borderRadius: 16, backgroundColor: theme.background.darker,
    },
    mealTop: { flexDirection: "row", alignItems: "center", gap: 10 },
    mealIcon: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
    mealTitle: { fontFamily: FONTS.bold, fontSize: 14, color: theme.foreground.white, textTransform: "capitalize" },
    mealBarRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
    mealBar: { flex: 1, height: 5, borderRadius: 3, backgroundColor: `${theme.foreground.gray}20` },
    mealBarFill: { height: "100%", borderRadius: 3 },
    mealKcal: { fontFamily: FONTS.semiBold, fontSize: 11, color: theme.foreground.gray, minWidth: 55, textAlign: "right" },
    mealAddBtn: {
      width: 32, height: 32, borderRadius: 10,
      alignItems: "center", justifyContent: "center",
      borderWidth: 1.5,
    },
    mealFoods: { marginTop: 10, paddingTop: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: `${theme.foreground.gray}15`, gap: 6 },
    mealFoodRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    mealFoodName: { flex: 1, fontFamily: FONTS.regular, fontSize: 13, color: theme.foreground.white },
    mealFoodKcal: { fontFamily: FONTS.semiBold, fontSize: 12, color: theme.foreground.gray },

    // Dual row
    dualRow: { flexDirection: "row", marginHorizontal: 20, gap: 10, marginBottom: 16 },
    miniCard: {
      padding: 14, borderRadius: 16, backgroundColor: theme.background.darker,
      alignItems: "center", gap: 6,
    },
    miniValue: { fontFamily: FONTS.extraBold, fontSize: 22, color: theme.foreground.white },
    miniUnit: { fontSize: 13, color: theme.foreground.gray },
    miniSub: { fontFamily: FONTS.regular, fontSize: 11, color: theme.foreground.gray },

    // Water
    waterBarBg: { width: "100%", height: 6, borderRadius: 3, backgroundColor: `${theme.foreground.gray}20` },
    waterBarFill: { height: "100%", borderRadius: 3, backgroundColor: "#4A90D9" },
    waterBtns: { flexDirection: "row", gap: 8, marginTop: 4 },
    waterMinusBtn: {
      width: 32, height: 32, borderRadius: 10,
      alignItems: "center", justifyContent: "center",
      backgroundColor: theme.background.dark,
    },
    waterPlusBtn: {
      width: 32, height: 32, borderRadius: 10,
      alignItems: "center", justifyContent: "center",
      backgroundColor: "#4A90D9",
    },

    // Weight
    weightBtns: { flexDirection: "row", gap: 8, marginTop: 4 },
    weightBtn: {
      width: 32, height: 32, borderRadius: 10,
      alignItems: "center", justifyContent: "center",
      backgroundColor: theme.background.dark,
    },

    // Notes
    notesSection: { marginHorizontal: 20, marginBottom: 16, gap: 8 },
    noteInputRow: { flexDirection: "row", gap: 8 },
    noteInput: {
      flex: 1, borderRadius: 12, backgroundColor: theme.background.darker,
      color: theme.foreground.white, fontFamily: FONTS.regular, fontSize: 13,
      paddingHorizontal: 14, paddingVertical: 10,
    },
    noteSendBtn: {
      width: 40, height: 40, borderRadius: 12,
      alignItems: "center", justifyContent: "center",
      backgroundColor: theme.primary.main,
    },
    noteChip: {
      paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
      backgroundColor: theme.background.darker,
    },
    noteChipText: { fontFamily: FONTS.regular, fontSize: 12, color: theme.foreground.gray, lineHeight: 17 },
  });
}

import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dimensions,
  FlatList,
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle } from "react-native-svg";
import { FONTS } from "../../constants/fonts";
import { Theme } from "../../constants/themes";
import { useHealth } from "../../contexts/HealthContext";
import { useNutrition } from "../../contexts/NutritionContext";
import { useTheme } from "../../contexts/ThemeContext";
import type { MealEntry, MealType } from "../../services/nutritionApi";
import { WeightHistory } from "../../services/weightHistory";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const DAY_ITEM_W = 58;

const STORAGE_KEYS = {
  waterMl: "@hylift_food_water_ml",
  weightCurrent: "@hylift_food_weight_current",
  weightTarget: "@hylift_food_weight_target",
  notesByDate: "@hylift_food_notes_by_date",
};

const WATER_GOAL_ML = 2000;
const GLASS_STEP_ML = 250;

const MEAL_IMAGES: Record<MealType, any> = {
  breakfast: require("../../../assets/images/meals/breakfast.jpg"),
  lunch: require("../../../assets/images/meals/lunch.jpg"),
  dinner: require("../../../assets/images/meals/dinner.jpg"),
  snack: require("../../../assets/images/meals/snack.jpg"),
};

const MEAL_TABS: { type: MealType; iconName: keyof typeof Ionicons.glyphMap; color: string; ratio: number }[] = [
  { type: "breakfast", iconName: "sunny", color: "#F5A623", ratio: 0.25 },
  { type: "lunch", iconName: "restaurant", color: "#4A90D9", ratio: 0.35 },
  { type: "dinner", iconName: "moon", color: "#8B5CF6", ratio: 0.3 },
  { type: "snack", iconName: "cafe", color: "#34C759", ratio: 0.1 },
];

// ── helpers ────────────────────────────────────────────────────────────────
function getWeekDays(baseDate: Date) {
  const start = new Date(baseDate);
  const dayOfWeek = start.getDay();
  start.setDate(start.getDate() - dayOfWeek); // start at Sunday
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

const SHORT_DAY = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

// ── Circular Progress Ring ─────────────────────────────────────────────────
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

// ═══════════════════════════════════════════════════════════════════════════
export default function Alimentation() {
  const router = useRouter();
  const { theme, themeType } = useTheme();
  const { t } = useTranslation();
  const { todayCaloriesBurned } = useHealth();
  const { goals, todayMeals, todaySummary, removeMeal } = useNutrition();
  const styles = createStyles(theme);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedMealTab, setSelectedMealTab] = useState<MealType>("breakfast");

  const [waterMl, setWaterMl] = useState(0);
  const [weightCurrent, setWeightCurrent] = useState(70);
  const [weightTarget, setWeightTarget] = useState(65);
  const [noteInput, setNoteInput] = useState("");
  const [dailyNotes, setDailyNotes] = useState<string[]>([]);

  const today = useMemo(() => new Date().toISOString().split("T")[0], []);
  const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate]);

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

  const changeMonth = (delta: number) => {
    const d = new Date(selectedDate);
    d.setMonth(d.getMonth() + delta);
    setSelectedDate(d);
  };

  const isToday = (d: Date) => {
    const t = new Date();
    return d.getDate() === t.getDate() && d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear();
  };
  const isSameDay = (a: Date, b: Date) =>
    a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();

  const currentTabConfig = MEAL_TABS.find((m) => m.type === selectedMealTab)!;
  const currentMeals = getMealsForType(selectedMealTab);
  const currentConsumed = getMealTypeCalories(selectedMealTab);
  const currentTarget = mealCalorieGoal(currentTabConfig.ratio);

  return (
    <View style={styles.container}>
      {themeType === "female" && (
        <Image source={require("../../../assets/girly.png")} style={styles.bgOverlay} resizeMode="cover" />
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* ── Header ─────────────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={{ width: 24 }} />
          <Text style={styles.headerTitle}>{t("food.title", "NUTRITION")}</Text>
          <Pressable onPress={() => router.push("/food-search?mealType=breakfast" as any)}>
            <Ionicons name="filter-outline" size={22} color={theme.foreground.white} />
          </Pressable>
        </View>

        {/* ── Month Selector ─────────────────────────────────────── */}
        <View style={styles.monthRow}>
          <Pressable onPress={() => changeMonth(-1)} hitSlop={12}>
            <Ionicons name="chevron-back" size={20} color={theme.foreground.gray} />
          </Pressable>
          <View style={{ alignItems: "center" }}>
            <Text style={styles.monthText}>{MONTHS[selectedDate.getMonth()]}</Text>
            <Text style={styles.yearText}>{selectedDate.getFullYear()}</Text>
          </View>
          <Pressable onPress={() => changeMonth(1)} hitSlop={12}>
            <Ionicons name="chevron-forward" size={20} color={theme.foreground.gray} />
          </Pressable>
        </View>

        {/* ── Week Day Selector ──────────────────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.weekRow}
        >
          {weekDays.map((day, i) => {
            const selected = isSameDay(day, selectedDate);
            return (
              <Pressable
                key={i}
                style={[styles.dayChip, selected && styles.dayChipSelected]}
                onPress={() => setSelectedDate(new Date(day))}
              >
                <Text style={[styles.dayLabel, selected && styles.dayLabelSelected]}>
                  {SHORT_DAY[day.getDay()]}
                </Text>
                <Text style={[styles.dayNum, selected && styles.dayNumSelected]}>
                  {day.getDate()}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* ── Meal Type Tabs ─────────────────────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsRow}
        >
          {MEAL_TABS.map((tab) => {
            const active = tab.type === selectedMealTab;
            return (
              <Pressable
                key={tab.type}
                style={[styles.mealTab, active && { backgroundColor: theme.primary.main }]}
                onPress={() => setSelectedMealTab(tab.type)}
              >
                <Text style={[styles.mealTabText, active && styles.mealTabTextActive]}>
                  {t(`food.${tab.type}`)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* ── Calorie Summary ────────────────────────────────────── */}
        <View style={styles.summaryCard}>
          <CalorieRing consumed={caloriesEaten} goal={goals.calorieGoal} burned={caloriesBurned} size={130} theme={theme} />
          <View style={styles.summaryStats}>
            <View style={styles.summaryStat}>
              <Text style={styles.summaryStatValue}>{Math.round(caloriesEaten)}</Text>
              <Text style={styles.summaryStatLabel}>{t("food.eaten", "Consommées")}</Text>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: `${theme.foreground.gray}30` }]} />
            <View style={styles.summaryStat}>
              <Text style={styles.summaryStatValue}>{Math.round(caloriesBurned)}</Text>
              <Text style={styles.summaryStatLabel}>{t("food.burned", "Brûlées")}</Text>
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

        {/* ── Meals List ─────────────────────────────────────────── */}
        <View style={styles.mealsHeader}>
          <Text style={styles.mealsCount}>
            {currentMeals.length} {t("food.mealsSection", "repas")}
          </Text>
          <Pressable
            style={styles.addMealBtn}
            onPress={() => openFoodSearch(selectedMealTab)}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addMealText}>{t("food.addFood", "Ajouter")}</Text>
          </Pressable>
        </View>

        {currentMeals.length === 0 ? (
          <Pressable
            style={styles.emptyCard}
            onPress={() => openFoodSearch(selectedMealTab)}
          >
            <ImageBackground
              source={MEAL_IMAGES[selectedMealTab]}
              style={styles.emptyCardBg}
              imageStyle={{ borderRadius: 20 }}
              resizeMode="cover"
            >
              <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.7)"]}
                style={styles.emptyCardGradient}
              >
                <Text style={styles.emptyCardTitle}>
                  {t(`food.${selectedMealTab}`)}
                </Text>
                <Text style={styles.emptyCardSub}>
                  {t("food.noMeals", "Aucun repas ajouté")}
                </Text>
                <View style={[styles.emptyCardBtn, { backgroundColor: theme.primary.main }]}>
                  <Ionicons name="add" size={18} color="#fff" />
                  <Text style={styles.emptyCardBtnText}>{t("food.addFood", "Ajouter")}</Text>
                </View>
              </LinearGradient>
            </ImageBackground>
          </Pressable>
        ) : (
          currentMeals.map((meal) => (
            <View key={meal.id} style={styles.mealCard}>
              <ImageBackground
                source={MEAL_IMAGES[meal.mealType]}
                style={styles.mealCardBg}
                imageStyle={{ borderRadius: 16 }}
                resizeMode="cover"
              >
                <LinearGradient
                  colors={["rgba(0,0,0,0.15)", "rgba(0,0,0,0.75)"]}
                  style={styles.mealCardGradient}
                >
                  <Pressable
                    style={styles.mealFavBtn}
                    hitSlop={8}
                    onPress={() => removeMeal(meal.id)}
                  >
                    <Ionicons name="trash-outline" size={16} color="#fff" />
                  </Pressable>
                  <View style={styles.mealCardBottom}>
                    <Text style={styles.mealFoodName} numberOfLines={2}>{meal.foodName}</Text>
                    <View style={styles.mealMeta}>
                      <Ionicons name="flame-outline" size={14} color="rgba(255,255,255,0.7)" />
                      <Text style={styles.mealMetaText}>{Math.round(meal.calories)} kcal</Text>
                      <Text style={styles.mealMetaDot}>|</Text>
                      <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.7)" />
                      <Text style={styles.mealMetaText}>{Math.round(meal.protein || 0)}g prot</Text>
                    </View>
                  </View>
                </LinearGradient>
              </ImageBackground>
            </View>
          ))
        )}

        {/* ── Water + Weight Row ───────────────────────────────────── */}
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

        {/* ── Notes ───────────────────────────────────────────────── */}
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

// ── Styles ──────────────────────────────────────────────────────────────────
function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background.dark },
    bgOverlay: {
      position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
      width: "100%", height: "100%", opacity: 0.3,
    },
    scrollContent: { paddingBottom: 100, paddingTop: 8 },

    // Header
    header: {
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      paddingHorizontal: 20, paddingVertical: 12,
    },
    headerTitle: {
      fontFamily: FONTS.extraBold, fontSize: 22,
      color: theme.foreground.white, letterSpacing: 1, textTransform: "uppercase",
    },

    // Month selector
    monthRow: {
      flexDirection: "row", alignItems: "center", justifyContent: "center",
      gap: 20, paddingVertical: 8,
    },
    monthText: { fontFamily: FONTS.bold, fontSize: 16, color: theme.foreground.white },
    yearText: { fontFamily: FONTS.regular, fontSize: 12, color: theme.foreground.gray },

    // Week day selector
    weekRow: { paddingHorizontal: 16, gap: 8, paddingVertical: 12 },
    dayChip: {
      width: DAY_ITEM_W, height: 72, borderRadius: 16,
      alignItems: "center", justifyContent: "center", gap: 4,
      backgroundColor: theme.background.darker,
    },
    dayChipSelected: {
      backgroundColor: theme.foreground.white,
    },
    dayLabel: { fontFamily: FONTS.semiBold, fontSize: 12, color: theme.foreground.gray },
    dayLabelSelected: { color: theme.background.dark },
    dayNum: { fontFamily: FONTS.bold, fontSize: 18, color: theme.foreground.white },
    dayNumSelected: { color: theme.background.dark },

    // Meal tabs
    tabsRow: { paddingHorizontal: 20, gap: 10, paddingBottom: 16 },
    mealTab: {
      paddingHorizontal: 20, paddingVertical: 10, borderRadius: 24,
      backgroundColor: theme.background.darker,
    },
    mealTabText: {
      fontFamily: FONTS.bold, fontSize: 13, color: theme.foreground.gray,
      textTransform: "capitalize",
    },
    mealTabTextActive: { color: "#fff" },

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

    // Meals header
    mealsHeader: {
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      marginHorizontal: 20, marginBottom: 12,
    },
    mealsCount: { fontFamily: FONTS.bold, fontSize: 16, color: theme.foreground.white },
    addMealBtn: {
      flexDirection: "row", alignItems: "center", gap: 6,
      backgroundColor: theme.primary.main, borderRadius: 20,
      paddingHorizontal: 14, paddingVertical: 8,
    },
    addMealText: { fontFamily: FONTS.bold, fontSize: 13, color: "#fff" },

    // Empty card with image
    emptyCard: { marginHorizontal: 20, marginBottom: 16, borderRadius: 20, overflow: "hidden" },
    emptyCardBg: { width: "100%", height: 200 },
    emptyCardGradient: {
      flex: 1, justifyContent: "flex-end", padding: 20, borderRadius: 20,
    },
    emptyCardTitle: { fontFamily: FONTS.extraBold, fontSize: 20, color: "#fff", textTransform: "capitalize" },
    emptyCardSub: { fontFamily: FONTS.regular, fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 2 },
    emptyCardBtn: {
      flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start",
      paddingHorizontal: 18, paddingVertical: 10, borderRadius: 24, marginTop: 12,
    },
    emptyCardBtnText: { fontFamily: FONTS.bold, fontSize: 13, color: "#fff" },

    // Meal card with image
    mealCard: { marginHorizontal: 20, marginBottom: 12, borderRadius: 16, overflow: "hidden" },
    mealCardBg: { width: "100%", height: 180 },
    mealCardGradient: { flex: 1, justifyContent: "space-between", padding: 14, borderRadius: 16 },
    mealFavBtn: {
      width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(0,0,0,0.4)",
      alignItems: "center", justifyContent: "center", alignSelf: "flex-end",
    },
    mealCardBottom: {},
    mealFoodName: { fontFamily: FONTS.bold, fontSize: 16, color: "#fff", marginBottom: 4 },
    mealMeta: { flexDirection: "row", alignItems: "center", gap: 5 },
    mealMetaText: { fontFamily: FONTS.medium, fontSize: 12, color: "rgba(255,255,255,0.8)" },
    mealMetaDot: { color: "rgba(255,255,255,0.5)", fontSize: 12 },

    // Section label
    sectionLabel: {
      fontFamily: FONTS.bold, fontSize: 16, color: theme.foreground.white,
      marginHorizontal: 20, marginBottom: 10, marginTop: 8,
    },

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

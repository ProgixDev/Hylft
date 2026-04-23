import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Svg, { Circle } from "react-native-svg";
import AnimatedScreen from "../../components/ui/AnimatedScreen";
import { FONTS } from "../../constants/fonts";
import { Theme } from "../../constants/themes";
import { useHealth } from "../../contexts/HealthContext";
import { useNutrition } from "../../contexts/NutritionContext";
import { useTheme } from "../../contexts/ThemeContext";
import type { MealType } from "../../services/nutritionApi";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const WATER_GOAL_ML = 2000;
const GLASS_STEP_ML = 250;
const TOTAL_GLASSES = 8;
const DEFAULT_WEIGHT_KG = 70;
const DEFAULT_WEIGHT_TARGET = 65;

const MEAL_TABS: { type: MealType; emoji: string; color: string; ratio: number }[] = [
  { type: "breakfast", emoji: "🥐", color: "#F5A623", ratio: 0.25 },
  { type: "lunch", emoji: "🍝", color: "#4A90D9", ratio: 0.35 },
  { type: "dinner", emoji: "🥩", color: "#8B5CF6", ratio: 0.3 },
  { type: "snack", emoji: "🍎", color: "#34C759", ratio: 0.1 },
];

const SHORT_DAY = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

function toISODate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function fromISODate(s: string): Date {
  const [y, m, day] = s.split("-").map(Number);
  return new Date(y, (m || 1) - 1, day || 1);
}

// ── Ring ────────────────────────────────────────────────────────────────────
function Ring({ pct, size, strokeWidth, color, bgColor, children }: {
  pct: number; size: number; strokeWidth: number; color: string; bgColor: string; children?: React.ReactNode;
}) {
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const o = c * (1 - Math.min(pct, 1));
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={bgColor} strokeWidth={strokeWidth} fill="none" />
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={strokeWidth} fill="none"
          strokeLinecap="round" strokeDasharray={`${c}`} strokeDashoffset={o} rotation="-90" origin={`${size / 2}, ${size / 2}`} />
      </Svg>
      {children}
    </View>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
export default function Alimentation() {
  const router = useRouter();
  const { theme, themeType } = useTheme();
  const { t, i18n } = useTranslation();
  const isFr = i18n.language?.startsWith("fr");
  const { todayCaloriesBurned } = useHealth();
  const {
    goals,
    selectedDate,
    todayMeals,
    todaySummary,
    daily,
    selectDate,
    removeMeal,
    setWater,
    setWeight,
    addNote,
  } = useNutrition();
  const styles = createStyles(theme);

  const selectedDateObj = useMemo(() => fromISODate(selectedDate), [selectedDate]);
  const [noteInput, setNoteInput] = useState("");
  const [weightTarget] = useState(DEFAULT_WEIGHT_TARGET); // UI only, out of scope for backend

  const waterMl = daily.waterMl;
  const weightCurrent = daily.weightKg ?? DEFAULT_WEIGHT_KG;
  const dailyNotes = daily.notes;

  const caloriesEaten = todaySummary.totalCalories;
  const caloriesBurned = todayCaloriesBurned;
  const caloriesRemaining = Math.max(goals.calorieGoal - caloriesEaten + caloriesBurned, 0);
  const calPct = goals.calorieGoal > 0 ? Math.min(caloriesEaten / goals.calorieGoal, 1) : 0;

  const getMealsForType = (type: MealType) => todayMeals.filter((m) => m.mealType === type);
  const getMealTypeCalories = (type: MealType) => getMealsForType(type).reduce((s, m) => s + m.calories, 0);
  const mealCalorieGoal = (ratio: number) => Math.round(goals.calorieGoal * ratio);
  const openFoodSearch = (mealType: MealType) =>
    router.push(`/food-search?mealType=${mealType}&date=${selectedDate}` as any);

  const handleAddNote = () => {
    const trimmed = noteInput.trim();
    if (!trimmed) return;
    addNote(trimmed);
    setNoteInput("");
  };

  const waterGlasses = Math.floor(waterMl / GLASS_STEP_ML);

  const shiftDate = (delta: number) => {
    const d = new Date(selectedDateObj);
    d.setDate(d.getDate() + delta);
    selectDate(toISODate(d));
  };

  const isTodaySelected = toISODate(new Date()) === selectedDate;

  return (
    <AnimatedScreen style={styles.container}>
      {themeType === "female" && (
        <Image source={require("../../../assets/girly.png")} style={styles.bgOverlay} resizeMode="cover" />
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* ── Header ──────────────────────────────────────────── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>
              {isTodaySelected
                ? (isFr ? "Aujourd'hui" : "Today")
                : SHORT_DAY[selectedDateObj.getDay()] + " " + selectedDateObj.getDate()}
            </Text>
            <Text style={styles.headerSub}>
              {selectedDateObj.getDate()} {MONTHS[selectedDateObj.getMonth()]} {selectedDateObj.getFullYear()}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable onPress={() => router.push("/alimentation-history" as any)} style={styles.headerIconBtn} hitSlop={8}>
              <Ionicons name="time-outline" size={18} color={theme.foreground.gray} />
            </Pressable>
            <Pressable onPress={() => shiftDate(-1)} style={styles.headerIconBtn} hitSlop={8}>
              <Ionicons name="chevron-back" size={18} color={theme.foreground.gray} />
            </Pressable>
            <Pressable onPress={() => shiftDate(1)} style={styles.headerIconBtn} hitSlop={8}>
              <Ionicons name="chevron-forward" size={18} color={theme.foreground.gray} />
            </Pressable>
          </View>
        </View>

        {/* ── Résumé ─────────────────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{isFr ? "Résumé" : "Summary"}</Text>
          <Pressable onPress={() => router.push("/alimentation-history" as any)}>
            <Text style={styles.sectionLink}>{isFr ? "Historique" : "History"}</Text>
          </Pressable>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryNum}>{Math.round(caloriesEaten)}</Text>
              <Text style={styles.summaryLabel}>{isFr ? "Consommées" : "Eaten"}</Text>
            </View>

            <Ring pct={calPct} size={90} strokeWidth={8} color={theme.primary.main} bgColor={`${theme.foreground.gray}20`}>
              <Text style={styles.ringNum}>{Math.round(caloriesRemaining)}</Text>
              <Text style={styles.ringLabel}>{isFr ? "Restantes" : "Left"}</Text>
            </Ring>

            <View style={styles.summaryCol}>
              <Text style={styles.summaryNum}>{Math.round(caloriesBurned)}</Text>
              <Text style={styles.summaryLabel}>{isFr ? "Brûlées" : "Burned"}</Text>
            </View>
          </View>

          <View style={styles.macroRow}>
            {[
              { label: isFr ? "Glucides" : "Carbs", current: todaySummary.totalCarbs, goal: goals.carbsGoal },
              { label: isFr ? "Protéines" : "Protein", current: todaySummary.totalProtein, goal: goals.proteinGoal },
              { label: isFr ? "Lipides" : "Fat", current: todaySummary.totalFat, goal: goals.fatGoal },
            ].map((m) => (
              <View key={m.label} style={styles.macroItem}>
                <Text style={styles.macroLabel}>{m.label}</Text>
                <View style={styles.macroBar}>
                  <View style={[styles.macroBarFill, { width: `${m.goal > 0 ? Math.min(m.current / m.goal, 1) * 100 : 0}%`, backgroundColor: theme.primary.main }]} />
                </View>
                <Text style={styles.macroVal}>{Math.round(m.current)} / {m.goal} g</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Alimentation ───────────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{isFr ? "Alimentation" : "Food"}</Text>
        </View>

        {MEAL_TABS.map((item) => {
          const meals = getMealsForType(item.type);
          const consumed = getMealTypeCalories(item.type);
          const target = mealCalorieGoal(item.ratio);

          return (
            <View key={item.type}>
              <Pressable style={styles.mealRow} onPress={() => openFoodSearch(item.type)}>
                <Text style={styles.mealEmoji}>{item.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.mealName}>{t(`food.${item.type}`)} <Ionicons name="arrow-forward" size={12} color={theme.foreground.gray} /></Text>
                  <Text style={styles.mealKcal}>{Math.round(consumed)} / {target} kcal</Text>
                </View>
                <Pressable style={styles.mealPlusBtn} onPress={() => openFoodSearch(item.type)}>
                  <Ionicons name="add-circle-outline" size={28} color={theme.primary.main} />
                </Pressable>
              </Pressable>

              {meals.length > 0 && meals.map((meal) => (
                <View key={meal.id} style={styles.foodItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.foodName} numberOfLines={1}>{meal.foodName}</Text>
                    <Text style={styles.foodInfo}>{Math.round(meal.calories)} kcal</Text>
                  </View>
                  <Pressable hitSlop={8} onPress={() => removeMeal(meal.id)}>
                    <Ionicons name="close-circle" size={20} color={`${theme.foreground.gray}50`} />
                  </Pressable>
                </View>
              ))}
            </View>
          );
        })}

        {/* ── Suivi eau ──────────────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{isFr ? "Suivi de la consommation d'eau" : "Water Tracking"}</Text>
        </View>

        <View style={styles.waterCard}>
          <Text style={styles.waterTitle}>{isFr ? "Eau" : "Water"}</Text>
          <Text style={styles.waterGoal}>{isFr ? "Objectif" : "Goal"} : {(WATER_GOAL_ML / 1000).toFixed(2)} {isFr ? "litres" : "liters"}</Text>
          <Text style={styles.waterValue}>{(waterMl / 1000).toFixed(2)} L</Text>

          <View style={styles.glassRow}>
            {Array.from({ length: TOTAL_GLASSES }, (_, i) => (
              <Pressable key={i} onPress={() => setWater((i + 1) * GLASS_STEP_ML)}>
                <Ionicons
                  name={i < waterGlasses ? "water" : "water-outline"}
                  size={28}
                  color={i < waterGlasses ? "#4A90D9" : `${theme.foreground.gray}40`}
                />
              </Pressable>
            ))}
          </View>

          <View style={styles.waterBtns}>
            <Pressable style={styles.waterBtn} onPress={() => setWater(Math.max(0, waterMl - GLASS_STEP_ML))}>
              <Ionicons name="remove" size={18} color={theme.foreground.gray} />
            </Pressable>
            <Pressable style={[styles.waterBtn, { backgroundColor: "#4A90D9" }]} onPress={() => setWater(Math.min(WATER_GOAL_ML * 2, waterMl + GLASS_STEP_ML))}>
              <Ionicons name="add" size={18} color="#fff" />
            </Pressable>
          </View>
        </View>

        {/* ── Données corporelles ────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{isFr ? "Données corporelles" : "Body Data"}</Text>
        </View>

        <View style={styles.weightCard}>
          <Text style={styles.weightLabel}>{isFr ? "Poids" : "Weight"}</Text>
          <Text style={styles.weightGoal}>{isFr ? "Objectif" : "Goal"} : {weightTarget} kg</Text>
          <View style={styles.weightRow}>
            <Pressable style={styles.weightBtn} onPress={() => setWeight(Math.max(30, weightCurrent - 0.1))}>
              <Ionicons name="remove-circle-outline" size={32} color={theme.foreground.gray} />
            </Pressable>
            <Text style={styles.weightValue}>{weightCurrent.toFixed(1)} kg</Text>
            <Pressable style={styles.weightBtn} onPress={() => setWeight(Math.min(300, weightCurrent + 0.1))}>
              <Ionicons name="add-circle-outline" size={32} color={theme.primary.main} />
            </Pressable>
          </View>
        </View>

        {/* ── Notes ──────────────────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Notes</Text>
        </View>

        <View style={styles.noteCard}>
          <Text style={styles.notePrompt}>{isFr ? "Comment s'est passée votre journée ?" : "How was your day?"}</Text>
          <Text style={styles.notePromptSub}>{isFr ? "Gardez un oeil sur votre santé et vos émotions." : "Keep an eye on your health and emotions."}</Text>

          <View style={styles.noteInputRow}>
            <TextInput
              style={styles.noteInput}
              placeholder={isFr ? "Ajouter une note" : "Add a note"}
              placeholderTextColor={theme.foreground.gray}
              value={noteInput}
              onChangeText={setNoteInput}
              onSubmitEditing={handleAddNote}
            />
            <Pressable style={styles.noteSendBtn} onPress={handleAddNote}>
              <Ionicons name="send" size={16} color="#fff" />
            </Pressable>
          </View>

          {dailyNotes.map((note, i) => (
            <View key={`${note}-${i}`} style={styles.noteItem}>
              <Text style={styles.noteText}>{note}</Text>
            </View>
          ))}
        </View>

      </ScrollView>
    </AnimatedScreen>
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

    header: {
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      paddingHorizontal: 20, paddingVertical: 10,
    },
    headerTitle: { fontFamily: FONTS.extraBold, fontSize: 24, color: theme.foreground.white },
    headerSub: { fontFamily: FONTS.regular, fontSize: 12, color: theme.foreground.gray, marginTop: 2 },
    headerActions: { flexDirection: "row", gap: 6 },
    headerIconBtn: {
      width: 34, height: 34, borderRadius: 10, backgroundColor: theme.background.darker,
      alignItems: "center", justifyContent: "center",
    },

    sectionHeader: {
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      paddingHorizontal: 20, marginTop: 18, marginBottom: 10,
    },
    sectionTitle: { fontFamily: FONTS.extraBold, fontSize: 17, color: theme.foreground.white },
    sectionLink: { fontFamily: FONTS.bold, fontSize: 13, color: theme.primary.main },

    summaryCard: {
      marginHorizontal: 20, padding: 18, borderRadius: 18,
      backgroundColor: theme.background.darker,
    },
    summaryRow: {
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    },
    summaryCol: { alignItems: "center", width: 80 },
    summaryNum: { fontFamily: FONTS.extraBold, fontSize: 20, color: theme.foreground.white },
    summaryLabel: { fontFamily: FONTS.regular, fontSize: 11, color: theme.foreground.gray, marginTop: 2 },
    ringNum: { fontFamily: FONTS.extraBold, fontSize: 18, color: theme.foreground.white },
    ringLabel: { fontFamily: FONTS.regular, fontSize: 10, color: theme.foreground.gray, marginTop: -2 },

    macroRow: { marginTop: 16, gap: 10 },
    macroItem: { flexDirection: "row", alignItems: "center", gap: 8 },
    macroLabel: { fontFamily: FONTS.medium, fontSize: 12, color: theme.foreground.gray, width: 70 },
    macroBar: { flex: 1, height: 6, borderRadius: 3, backgroundColor: `${theme.foreground.gray}20` },
    macroBarFill: { height: "100%", borderRadius: 3 },
    macroVal: { fontFamily: FONTS.medium, fontSize: 11, color: theme.foreground.gray, width: 75, textAlign: "right" },

    mealRow: {
      flexDirection: "row", alignItems: "center", gap: 12,
      marginHorizontal: 20, paddingVertical: 14, paddingHorizontal: 14,
      backgroundColor: theme.background.darker, borderRadius: 14,
      marginBottom: 2,
    },
    mealEmoji: { fontSize: 24 },
    mealName: { fontFamily: FONTS.bold, fontSize: 14, color: theme.foreground.white, textTransform: "capitalize" },
    mealKcal: { fontFamily: FONTS.regular, fontSize: 12, color: theme.foreground.gray, marginTop: 1 },
    mealPlusBtn: { padding: 4 },

    foodItem: {
      flexDirection: "row", alignItems: "center", gap: 10,
      marginHorizontal: 20, paddingVertical: 10, paddingHorizontal: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: `${theme.foreground.gray}12`,
    },
    foodName: { fontFamily: FONTS.medium, fontSize: 13, color: theme.foreground.white },
    foodInfo: { fontFamily: FONTS.regular, fontSize: 11, color: theme.foreground.gray, marginTop: 1 },

    waterCard: {
      marginHorizontal: 20, padding: 18, borderRadius: 18,
      backgroundColor: theme.background.darker, alignItems: "center",
    },
    waterTitle: { fontFamily: FONTS.bold, fontSize: 15, color: theme.foreground.white },
    waterGoal: { fontFamily: FONTS.regular, fontSize: 12, color: theme.foreground.gray, marginTop: 2 },
    waterValue: { fontFamily: FONTS.extraBold, fontSize: 28, color: theme.foreground.white, marginTop: 8 },
    glassRow: { flexDirection: "row", gap: 6, marginTop: 14, flexWrap: "wrap", justifyContent: "center" },
    waterBtns: { flexDirection: "row", gap: 12, marginTop: 14 },
    waterBtn: {
      width: 36, height: 36, borderRadius: 18, backgroundColor: theme.background.dark,
      alignItems: "center", justifyContent: "center",
    },

    weightCard: {
      marginHorizontal: 20, padding: 18, borderRadius: 18,
      backgroundColor: theme.background.darker, alignItems: "center",
    },
    weightLabel: { fontFamily: FONTS.bold, fontSize: 15, color: theme.foreground.white },
    weightGoal: { fontFamily: FONTS.regular, fontSize: 12, color: theme.foreground.gray, marginTop: 2 },
    weightRow: { flexDirection: "row", alignItems: "center", gap: 24, marginTop: 12 },
    weightValue: { fontFamily: FONTS.extraBold, fontSize: 28, color: theme.foreground.white },
    weightBtn: {},

    noteCard: {
      marginHorizontal: 20, padding: 18, borderRadius: 18,
      backgroundColor: theme.background.darker, marginBottom: 16,
    },
    notePrompt: { fontFamily: FONTS.bold, fontSize: 14, color: theme.foreground.white, textAlign: "center" },
    notePromptSub: { fontFamily: FONTS.regular, fontSize: 12, color: theme.foreground.gray, textAlign: "center", marginTop: 4, marginBottom: 14 },
    noteInputRow: { flexDirection: "row", gap: 8 },
    noteInput: {
      flex: 1, borderRadius: 12, backgroundColor: theme.background.dark,
      color: theme.foreground.white, fontFamily: FONTS.regular, fontSize: 13,
      paddingHorizontal: 14, paddingVertical: 10,
    },
    noteSendBtn: {
      width: 40, height: 40, borderRadius: 12,
      alignItems: "center", justifyContent: "center",
      backgroundColor: theme.primary.main,
    },
    noteItem: {
      paddingVertical: 8, marginTop: 8,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: `${theme.foreground.gray}15`,
    },
    noteText: { fontFamily: FONTS.regular, fontSize: 13, color: theme.foreground.gray, lineHeight: 18 },
  });
}

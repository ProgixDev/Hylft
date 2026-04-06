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

const MEAL_CONFIG: {
  type: MealType;
  iconName: keyof typeof Ionicons.glyphMap;
  color: string;
  ratio: number;
}[] = [
  { type: "breakfast", iconName: "sunny", color: "#F5A623", ratio: 0.25 },
  { type: "lunch", iconName: "restaurant", color: "#4A90D9", ratio: 0.35 },
  { type: "dinner", iconName: "moon", color: "#8B5CF6", ratio: 0.3 },
  { type: "snack", iconName: "nutrition", color: "#34C759", ratio: 0.1 },
];

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
    const loadLocalState = async () => {
      try {
        const [savedWater, savedWeightCurrent, savedWeightTarget, savedNotesByDate] =
          await Promise.all([
            AsyncStorage.getItem(STORAGE_KEYS.waterMl),
            AsyncStorage.getItem(STORAGE_KEYS.weightCurrent),
            AsyncStorage.getItem(STORAGE_KEYS.weightTarget),
            AsyncStorage.getItem(STORAGE_KEYS.notesByDate),
          ]);

        if (savedWater) setWaterMl(Number(savedWater) || 0);
        if (savedWeightCurrent) setWeightCurrent(Number(savedWeightCurrent) || 70);
        if (savedWeightTarget) setWeightTarget(Number(savedWeightTarget) || 65);

        if (savedNotesByDate) {
          const parsed = JSON.parse(savedNotesByDate) as Record<string, string[]>;
          setDailyNotes(parsed[today] ?? []);
        }
      } catch (error) {
        console.warn("[Alimentation] Failed to load local state:", error);
      }
    };

    loadLocalState();
  }, [today]);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEYS.waterMl, String(waterMl));
  }, [waterMl]);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEYS.weightCurrent, String(weightCurrent));
    WeightHistory.log(weightCurrent);
  }, [weightCurrent]);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEYS.weightTarget, String(weightTarget));
  }, [weightTarget]);

  const caloriesEaten = todaySummary.totalCalories;
  const caloriesBurned = todayCaloriesBurned;
  const caloriesRemaining = Math.max(goals.calorieGoal - caloriesEaten + caloriesBurned, 0);

  const macros = [
    {
      key: "carbs",
      label: t("food.carbs", "Glucides"),
      current: todaySummary.totalCarbs,
      goal: goals.carbsGoal,
      color: "#F5A623",
    },
    {
      key: "protein",
      label: t("food.protein", "Protéines"),
      current: todaySummary.totalProtein,
      goal: goals.proteinGoal,
      color: "#4A90D9",
    },
    {
      key: "fat",
      label: t("food.fat", "Lipides"),
      current: todaySummary.totalFat,
      goal: goals.fatGoal,
      color: "#ED6665",
    },
  ];

  const getMealsForType = (type: MealType) => todayMeals.filter((m) => m.mealType === type);

  const getMealTypeCalories = (type: MealType) =>
    getMealsForType(type).reduce((sum, meal) => sum + meal.calories, 0);

  const mealCalorieGoal = (ratio: number) => Math.round(goals.calorieGoal * ratio);

  const openFoodSearch = (mealType: MealType) => {
    router.push(`/food-search?mealType=${mealType}` as any);
  };

  const saveDailyNotes = async (nextNotes: string[]) => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.notesByDate);
      const parsed: Record<string, string[]> = raw ? JSON.parse(raw) : {};
      parsed[today] = nextNotes;
      await AsyncStorage.setItem(STORAGE_KEYS.notesByDate, JSON.stringify(parsed));
    } catch (error) {
      console.warn("[Alimentation] Failed to save notes:", error);
    }
  };

  const handleAddNote = async () => {
    const trimmed = noteInput.trim();
    if (!trimmed) return;
    const updated = [trimmed, ...dailyNotes];
    setDailyNotes(updated);
    setNoteInput("");
    await saveDailyNotes(updated);
  };

  const handleDeleteMeal = (meal: MealEntry) => {
    removeMeal(meal.id);
  };

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
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t("food.title", "Journal Alimentaire")}</Text>
          <Text style={styles.headerDate}>
            {new Date().toLocaleDateString(undefined, {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </Text>
        </View>

        <View style={[styles.card, styles.bentoCard, { overflow: "hidden", backgroundColor: 'transparent' }]}>
          <Image 
            source={{ uri: "https://images.unsplash.com/photo-1547592166-23ac45744acd?q=80&w=800&auto=format&fit=crop" }} 
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
          />
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.35)' }]} />
          
          <Text style={styles.sectionTitle}>{t("food.dailySummary", "Bilan Nutritionnel")}</Text>
          
          <View style={styles.summaryBentoGrid}>
            <View style={[styles.bentoItem, styles.bentoItemMain]}>
              <Ionicons name="flame" size={24} color={theme.primary.main} />
              <Text style={styles.bentoMainValue}>{Math.round(caloriesRemaining)}</Text>
              <Text style={styles.bentoLabel}>{t("food.remaining", "kcal restantes")}</Text>
            </View>
            
            {/* CORRECTION : View à la place de div */}
            <View style={styles.bentoColumnRight}>
              <View style={[styles.bentoItem, styles.bentoItemSmall]}>
                <Text style={styles.bentoSmallValue}>{Math.round(caloriesEaten)}</Text>
                <Text style={styles.bentoLabel}>{t("food.eaten", "Mangées")}</Text>
              </View>
              <View style={[styles.bentoItem, styles.bentoItemSmall]}>
                <Text style={styles.bentoSmallValue}>{Math.round(caloriesBurned)}</Text>
                <Text style={styles.bentoLabel}>{t("food.burned", "Brûlées")}</Text>
              </View>
            </View>
          </View>

          <View style={styles.macrosSection}>
            {macros.map((macro) => {
              const percent = macro.goal > 0
                ? Math.min(Math.round((macro.current / macro.goal) * 100), 100)
                : 0;
              return (
                <View key={macro.key} style={styles.macroItem}>
                  <View style={styles.macroHeader}>
                    <Text style={styles.macroLabel}>{macro.label}</Text>
                    <Text style={styles.macroValue}>
                      <Text style={{ color: theme.foreground.white, fontFamily: FONTS.semiBold }}>
                        {Math.round(macro.current)}g
                      </Text>{" "}
                      / {macro.goal}g
                    </Text>
                  </View>
                  <View style={[styles.macroBarBg, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
                    <View
                      style={[
                        styles.macroBarFill,
                        { width: `${percent}%`, backgroundColor: macro.color },
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.mealsContainer}>
          <Text style={[styles.sectionTitle, { marginHorizontal: 20 }]}>{t("food.mealsSection", "Repas de la journée")}</Text>

          {MEAL_CONFIG.map((item) => {
            const meals = getMealsForType(item.type);
            const consumedMealCalories = getMealTypeCalories(item.type);
            const targetCalories = mealCalorieGoal(item.ratio);

            return (
              <View key={item.type} style={styles.mealCard}>
                <View style={styles.mealHeader}>
                  <View style={styles.mealHeaderLeft}>
                    <View style={[styles.mealIcon, { backgroundColor: `${item.color}15` }]}>
                      <Ionicons name={item.iconName} size={20} color={item.color} />
                    </View>
                    <View>
                      <Text style={styles.mealTitle}>{t(`food.${item.type}`)}</Text>
                      <Text style={styles.mealSubtitle}>
                        {Math.round(consumedMealCalories)} / {targetCalories} kcal
                      </Text>
                    </View>
                  </View>
                  <Pressable
                    style={[styles.addBtn, { backgroundColor: `${item.color}20` }]}
                    onPress={() => openFoodSearch(item.type)}
                  >
                    <Ionicons name="add" size={20} color={item.color} />
                  </Pressable>
                </View>

                {meals.length > 0 && (
                  <View style={styles.foodsList}>
                    {meals.map((meal) => (
                      <Pressable
                        key={meal.id}
                        style={styles.foodRow}
                        onLongPress={() => handleDeleteMeal(meal)}
                      >
                        <View style={styles.foodInfo}>
                          <Text style={styles.foodName} numberOfLines={1}>{meal.foodName}</Text>
                          <Text style={styles.foodMeta}>
                            P {Math.round(meal.protein)}g · G {Math.round(meal.carbs)}g · L {Math.round(meal.fat)}g
                          </Text>
                        </View>
                        <View style={styles.foodRight}>
                          <Text style={styles.foodCalories}>{Math.round(meal.calories)} kcal</Text>
                          <Pressable
                            style={styles.deleteFoodBtn}
                            onPress={() => handleDeleteMeal(meal)}
                          >
                            <Ionicons name="close-circle" size={20} color={theme.foreground.gray} />
                          </Pressable>
                        </View>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        <View style={styles.bentoRow}>
          <View style={[styles.card, styles.halfBentoCard, { backgroundColor: "#4A90D910" }]}>
            <View style={styles.bentoHeaderCompact}>
              <Ionicons name="water" size={20} color="#4A90D9" />
              <Text style={styles.sectionTitleCompact}>{t("food.water", "Eau")}</Text>
            </View>
            <View style={styles.waterTracker}>
              <Text style={styles.waterValue}>{(waterMl / 1000).toFixed(2)}<Text style={styles.waterUnit}> L</Text></Text>
              <Text style={styles.waterGoal}>/ {(WATER_GOAL_ML / 1000).toFixed(1)}L</Text>
            </View>
            <Pressable
              style={styles.waterBtn}
              onPress={() => setWaterMl((prev) => Math.min(prev + GLASS_STEP_ML, WATER_GOAL_ML * 2))}
            >
              <Text style={styles.waterBtnText}>+ 250 ml</Text>
            </Pressable>
          </View>

          <View style={[styles.card, styles.halfBentoCard]}>
            <View style={styles.bentoHeaderCompact}>
              <Ionicons name="scale" size={20} color={theme.foreground.white} />
              <Text style={styles.sectionTitleCompact}>{t("food.bodyData", "Poids")}</Text>
            </View>
            
            <View style={styles.weightBlock}>
              <Text style={styles.weightLabelMini}>Actuel</Text>
              <View style={styles.weightControls}>
                <Pressable onPress={() => setWeightCurrent((v) => Math.max(30, v - 1))}>
                  <Ionicons name="remove-circle-outline" size={22} color={theme.foreground.gray} />
                </Pressable>
                <Text style={styles.weightValueMini} numberOfLines={1} adjustsFontSizeToFit>{weightCurrent} kg</Text>
                <Pressable onPress={() => setWeightCurrent((v) => Math.min(300, v + 1))}>
                  <Ionicons name="add-circle-outline" size={22} color={theme.primary.main} />
                </Pressable>
              </View>
            </View>

            <View style={[styles.weightBlock, { marginTop: 8 }]}>
              <Text style={styles.weightLabelMini}>Cible</Text>
              <View style={styles.weightControls}>
                <Pressable onPress={() => setWeightTarget((v) => Math.max(30, v - 1))}>
                  <Ionicons name="remove-circle-outline" size={22} color={theme.foreground.gray} />
                </Pressable>
                <Text style={styles.weightValueMini} numberOfLines={1} adjustsFontSizeToFit>{weightTarget} kg</Text>
                <Pressable onPress={() => setWeightTarget((v) => Math.min(300, v + 1))}>
                  <Ionicons name="add-circle-outline" size={22} color={theme.primary.main} />
                </Pressable>
              </View>
            </View>
          </View>
        </View>

        <View style={[styles.card, styles.notesCard]}>
          <View style={styles.bentoHeaderCompact}>
            <Ionicons name="journal" size={20} color={theme.primary.main} />
            <Text style={styles.sectionTitleCompact}>{t("food.notes", "Journal & Notes")}</Text>
          </View>
          <TextInput
            style={styles.noteInput}
            placeholder={t("food.notePlaceholder", "Comment vous sentez-vous aujourd'hui ?")}
            placeholderTextColor={theme.foreground.gray}
            value={noteInput}
            onChangeText={setNoteInput}
            multiline
          />
          <Pressable style={styles.addNoteBtn} onPress={handleAddNote}>
            <Text style={styles.addNoteBtnText}>{t("food.addNote", "Enregistrer la note")}</Text>
          </Pressable>

          <View style={styles.notesList}>
            {dailyNotes.map((item, index) => (
              <View key={`${item}-${index}`} style={styles.noteItem}>
                <View style={styles.noteBullet} />
                <Text style={styles.noteText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background.dark },
    bgOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: "100%",
      height: "100%",
      opacity: 0.3,
    },
    scrollContent: { paddingBottom: 100, paddingTop: 10 },
    header: { paddingHorizontal: 20, paddingBottom: 20 },
    headerTitle: {
      fontFamily: FONTS.extraBold,
      fontSize: 28,
      color: theme.foreground.white,
      letterSpacing: -0.5,
    },
    headerDate: {
      fontFamily: FONTS.semiBold,
      fontSize: 14,
      color: theme.foreground.gray,
      marginTop: 4,
      textTransform: "capitalize",
    },
    card: {
      marginHorizontal: 20,
      marginBottom: 16,
      borderRadius: 24,
      backgroundColor: theme.background.darker,
      padding: 20,
    },
    sectionTitle: {
      fontFamily: FONTS.bold,
      fontSize: 18,
      color: theme.foreground.white,
      marginBottom: 16,
      letterSpacing: -0.3,
    },
    sectionTitleCompact: {
      fontFamily: FONTS.bold,
      fontSize: 16,
      color: theme.foreground.white,
      marginLeft: 8,
    },
    bentoCard: {
      paddingBottom: 24,
    },
    summaryBentoGrid: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 24,
    },
    bentoItem: {
      borderRadius: 20,
      backgroundColor: "rgba(255, 255, 255, 0.12)",
      padding: 16,
      justifyContent: "center",
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.18)",
    },
    bentoItemMain: {
      flex: 1.2,
      alignItems: "flex-start",
    },
    bentoColumnRight: {
      flex: 1,
      gap: 12,
    },
    bentoItemSmall: {
      flex: 1,
      alignItems: "center",
      padding: 12,
    },
    bentoMainValue: {
      fontFamily: FONTS.extraBold,
      fontSize: 32,
      color: theme.foreground.white,
      marginTop: 8,
    },
    bentoSmallValue: {
      fontFamily: FONTS.extraBold,
      fontSize: 18,
      color: theme.foreground.white,
    },
    bentoLabel: {
      fontFamily: FONTS.semiBold,
      fontSize: 12,
      color: "rgba(255, 255, 255, 0.8)",
      marginTop: 4,
      textAlign: "center",
    },
    macrosSection: {
      gap: 16,
    },
    macroItem: {},
    macroHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-end",
      marginBottom: 8,
    },
    macroLabel: {
      fontFamily: FONTS.bold,
      fontSize: 14,
      color: "#FFF",
    },
    macroValue: {
      fontFamily: FONTS.semiBold,
      fontSize: 12,
      color: "rgba(255, 255, 255, 0.8)",
    },
    macroBarBg: {
      height: 12,
      borderRadius: 6,
      overflow: "hidden",
    },
    macroBarFill: {
      height: "100%",
      borderRadius: 6,
    },
    mealsContainer: {
      marginBottom: 8,
    },
    mealCard: {
      marginHorizontal: 20,
      borderRadius: 24,
      backgroundColor: theme.background.darker,
      padding: 16,
      marginBottom: 12,
    },
    mealHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    mealHeaderLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    mealIcon: {
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
    },
    mealTitle: {
      fontFamily: FONTS.bold,
      fontSize: 16,
      color: theme.foreground.white,
      textTransform: "capitalize",
    },
    mealSubtitle: {
      fontFamily: FONTS.semiBold,
      fontSize: 13,
      color: theme.foreground.gray,
      marginTop: 2,
    },
    addBtn: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    foodsList: {
      marginTop: 16,
      paddingTop: 8,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.background.accent,
    },
    foodRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 10,
    },
    foodInfo: { flex: 1 },
    foodName: {
      fontFamily: FONTS.semiBold,
      fontSize: 14,
      color: theme.foreground.white,
    },
    foodMeta: {
      fontFamily: FONTS.semiBold,
      fontSize: 12,
      color: theme.foreground.gray,
      marginTop: 4,
    },
    foodCalories: {
      fontFamily: FONTS.bold,
      fontSize: 14,
      color: theme.foreground.white,
    },
    foodRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginLeft: 12,
    },
    deleteFoodBtn: {
      padding: 4,
    },
    bentoRow: {
      flexDirection: "row",
      paddingHorizontal: 20,
      gap: 12,
      marginBottom: 16,
    },
    halfBentoCard: {
      flex: 1,
      marginHorizontal: 0,
      marginBottom: 0,
      padding: 14,
    },
    bentoHeaderCompact: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 16,
    },
    waterTracker: {
      alignItems: "center",
      marginBottom: 16,
    },
    waterValue: {
      fontFamily: FONTS.extraBold,
      fontSize: 28,
      color: "#4A90D9",
    },
    waterUnit: {
      fontSize: 16,
    },
    waterGoal: {
      fontFamily: FONTS.semiBold,
      fontSize: 13,
      color: theme.foreground.gray,
    },
    waterBtn: {
      backgroundColor: "#4A90D9",
      paddingVertical: 10,
      borderRadius: 12,
      alignItems: "center",
    },
    waterBtnText: {
      fontFamily: FONTS.bold,
      fontSize: 13,
      color: "#FFF",
    },
    weightBlock: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: theme.background.dark,
      paddingHorizontal: 8,
      paddingVertical: 10,
      borderRadius: 12,
    },
    weightLabelMini: {
      fontFamily: FONTS.semiBold,
      fontSize: 12,
      color: theme.foreground.gray,
      flex: 1,
    },
    weightControls: {
      flexDirection: "row",
      alignItems: "center",
      gap: 2,
    },
    weightValueMini: {
      fontFamily: FONTS.bold,
      fontSize: 13,
      color: theme.foreground.white,
      minWidth: 32,
      textAlign: "center",
    },
    notesCard: {
      paddingTop: 16,
    },
    noteInput: {
      minHeight: 80,
      borderRadius: 16,
      backgroundColor: theme.background.dark,
      color: theme.foreground.white,
      fontFamily: FONTS.regular,
      fontSize: 14,
      paddingHorizontal: 16,
      paddingVertical: 14,
      marginBottom: 12,
      textAlignVertical: "top",
    },
    addNoteBtn: {
      backgroundColor: `${theme.primary.main}20`,
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: "center",
      marginBottom: 16,
    },
    addNoteBtnText: {
      fontFamily: FONTS.bold,
      fontSize: 13,
      color: theme.primary.main,
    },
    notesList: {
      gap: 12,
    },
    noteItem: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
    },
    noteBullet: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.primary.main,
      marginTop: 6,
    },
    noteText: {
      flex: 1,
      fontFamily: FONTS.regular,
      fontSize: 13,
      color: theme.foreground.gray,
      lineHeight: 20,
    },
  });
}
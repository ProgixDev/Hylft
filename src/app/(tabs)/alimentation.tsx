import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Animated,
  Image,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  UIManager,
  View,
} from "react-native";
import Svg, { Circle } from "react-native-svg";
import AnimatedScreen from "../../components/ui/AnimatedScreen";
import { FONTS } from "../../constants/fonts";
import { Theme } from "../../constants/themes";
import { useAuth } from "../../contexts/AuthContext";
import { useHealth } from "../../contexts/HealthContext";
import { useNutrition } from "../../contexts/NutritionContext";
import { useTheme } from "../../contexts/ThemeContext";
import { TutorialTarget } from "../../contexts/TutorialTargetContext";
import { api } from "../../services/api";
import type { MealType } from "../../services/nutritionApi";
import { WeightHistory } from "../../services/weightHistory";
import {
  ageFromDateOfBirth,
  computeWaterGoalMl,
} from "../../utils/nutritionGoals";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const DEFAULT_WATER_GOAL_ML = 2000;
const GLASS_STEP_ML = 250;
const DEFAULT_TOTAL_GLASSES = 8;
const DEFAULT_WEIGHT_KG = 70;
const DEFAULT_WEIGHT_TARGET = 65;
const NAVY_CARD = "#0A1628";
const NAVY_CARD_LIGHT = "#1A2F50";
const NAVY_CARD_DEEP = "#07101F";
const NAVY_TEXT_MUTED = "rgba(255,255,255,0.72)";
const NAVY_TEXT_SOFT = "rgba(255,255,255,0.55)";

const MEAL_TABS: {
  type: MealType;
  emoji: string;
  ratio: number;
}[] = [
  { type: "breakfast", emoji: "🥐", ratio: 0.25 },
  { type: "lunch", emoji: "🍝", ratio: 0.35 },
  { type: "dinner", emoji: "🥩", ratio: 0.3 },
  { type: "snack", emoji: "🍎", ratio: 0.1 },
];

const SHORT_DAY = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const MONTHS = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

function toISODate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function fromISODate(s: string): Date {
  const [y, m, day] = s.split("-").map(Number);
  return new Date(y, (m || 1) - 1, day || 1);
}

// ── Ring ────────────────────────────────────────────────────────────────────
function Ring({
  pct,
  size,
  strokeWidth,
  color,
  bgColor,
  children,
}: {
  pct: number;
  size: number;
  strokeWidth: number;
  color: string;
  bgColor: string;
  children?: React.ReactNode;
}) {
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const o = c * (1 - Math.min(pct, 1));
  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={bgColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${c}`}
          strokeDashoffset={o}
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
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
  const { userProfile, refreshUserProfile } = useAuth();
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

  const selectedDateObj = useMemo(
    () => fromISODate(selectedDate),
    [selectedDate],
  );
  const [noteInput, setNoteInput] = useState("");
  const [expandedMeals, setExpandedMeals] = useState<Record<MealType, boolean>>(
    {
      breakfast: false,
      lunch: false,
      dinner: false,
      snack: false,
    },
  );
  const chevronOpacityRefs = useRef<Record<MealType, Animated.Value>>({
    breakfast: new Animated.Value(1),
    lunch: new Animated.Value(1),
    dinner: new Animated.Value(1),
    snack: new Animated.Value(1),
  });
  const toggleMealExpanded = (type: MealType) => {
    LayoutAnimation.configureNext(
      LayoutAnimation.create(
        220,
        LayoutAnimation.Types.easeInEaseOut,
        LayoutAnimation.Properties.opacity,
      ),
    );
    setExpandedMeals((prev) => ({ ...prev, [type]: !prev[type] }));
    const opacity = chevronOpacityRefs.current[type];
    Animated.sequence([
      Animated.timing(opacity, {
        toValue: 0.2,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  };
  const [weightTarget] = useState(DEFAULT_WEIGHT_TARGET); // UI only, out of scope for backend
  const [weightInput, setWeightInput] = useState("");
  const [isEditingWeight, setIsEditingWeight] = useState(false);
  const [isSavingWeight, setIsSavingWeight] = useState(false);

  const waterMl = daily.waterMl;
  const weightCurrent = daily.weightKg ?? DEFAULT_WEIGHT_KG;
  const dailyNotes = daily.notes;

  const waterGoalMl = useMemo(
    () =>
      computeWaterGoalMl({
        weightKg: daily.weightKg ?? userProfile?.weight_kg,
        heightCm: userProfile?.height_cm,
        age: ageFromDateOfBirth(userProfile?.date_of_birth),
        gender: userProfile?.gender,
        activityLevel: userProfile?.experience_level,
        workoutFrequency: userProfile?.workout_frequency,
        weightGoal: userProfile?.fitness_goal,
      }) || DEFAULT_WATER_GOAL_ML,
    [daily.weightKg, userProfile],
  );
  const totalGlasses = Math.max(
    DEFAULT_TOTAL_GLASSES,
    Math.ceil(waterGoalMl / GLASS_STEP_ML),
  );

  const caloriesEaten = todaySummary.totalCalories;
  const caloriesBurned = todayCaloriesBurned;
  const caloriesRemaining = Math.max(
    goals.calorieGoal - caloriesEaten + caloriesBurned,
    0,
  );
  const getMealsForType = (type: MealType) =>
    todayMeals.filter((m) => m.mealType === type);
  const getMealTypeCalories = (type: MealType) =>
    getMealsForType(type).reduce((s, m) => s + m.calories, 0);
  const getMealTypeMacros = (type: MealType) =>
    getMealsForType(type).reduce(
      (acc, meal) => ({
        protein: acc.protein + meal.protein,
        fat: acc.fat + meal.fat,
        carbs: acc.carbs + meal.carbs,
      }),
      { protein: 0, fat: 0, carbs: 0 },
    );
  const mealCalorieGoal = (ratio: number) =>
    Math.round(goals.calorieGoal * ratio);
  const openFoodSearch = (mealType: MealType) =>
    router.push(
      `/food-search?mealType=${mealType}&date=${selectedDate}` as any,
    );

  const startEditWeight = () => {
    setWeightInput(weightCurrent.toFixed(1));
    setIsEditingWeight(true);
  };

  const handleSaveWeight = async () => {
    const parsed = parseFloat(weightInput.replace(",", "."));
    if (!parsed || parsed < 30 || parsed > 300) {
      setIsEditingWeight(false);
      return;
    }
    const rounded = Math.round(parsed * 10) / 10;
    setIsSavingWeight(true);
    try {
      setWeight(rounded);
      await Promise.all([
        api.updateProfile({ weight_kg: rounded }),
        WeightHistory.log(rounded),
      ]);
      await refreshUserProfile();
    } catch (err) {
      console.warn("[Alimentation] updateProfile(weight) failed:", err);
    } finally {
      setIsSavingWeight(false);
      setIsEditingWeight(false);
    }
  };

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
        {/* ── Header ──────────────────────────────────────────── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>
              {isTodaySelected
                ? isFr
                  ? "Aujourd'hui"
                  : "Today"
                : SHORT_DAY[selectedDateObj.getDay()] +
                  " " +
                  selectedDateObj.getDate()}
            </Text>
            <Text style={styles.headerSub}>
              {selectedDateObj.getDate()} {MONTHS[selectedDateObj.getMonth()]}{" "}
              {selectedDateObj.getFullYear()}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              onPress={() => router.push("/alimentation-history" as any)}
              style={styles.headerIconBtn}
              hitSlop={8}
            >
              <Ionicons name="time-outline" size={18} color="#FFFFFF" />
            </Pressable>
            <Pressable
              onPress={() => shiftDate(-1)}
              style={styles.headerIconBtn}
              hitSlop={8}
            >
              <Ionicons name="chevron-back" size={18} color="#FFFFFF" />
            </Pressable>
            <Pressable
              onPress={() => shiftDate(1)}
              style={styles.headerIconBtn}
              hitSlop={8}
            >
              <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>

        {/* ── Résumé ─────────────────────────────────────────── */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryTopRow}>
            <View style={styles.summarySide}>
              <Text style={styles.summarySideValue}>
                {Math.round(caloriesEaten)}
              </Text>
              <Text style={styles.summarySideLabel}>
                {isFr ? "Mangées" : "Eaten"}
              </Text>
            </View>

            <View style={styles.summaryCenter}>
              <Ring
                pct={
                  goals.calorieGoal > 0
                    ? caloriesEaten / (goals.calorieGoal + caloriesBurned)
                    : 0
                }
                size={130}
                strokeWidth={10}
                color={NAVY_CARD}
                bgColor="rgba(10,22,40,0.18)"
              >
                <Text style={styles.summaryCenterValue}>
                  {Math.round(caloriesRemaining).toLocaleString(
                    isFr ? "fr-FR" : "en-US",
                  )}
                </Text>
                <Text style={styles.summaryCenterLabel}>
                  {isFr ? "Restantes" : "Left"}
                </Text>
              </Ring>
            </View>

            <View style={styles.summarySide}>
              <Text style={styles.summarySideValue}>
                {Math.round(caloriesBurned)}
              </Text>
              <Text style={styles.summarySideLabel}>
                {isFr ? "Brûlées" : "Burned"}
              </Text>
            </View>
          </View>

          <View style={styles.macroBarRow}>
            {[
              {
                label: isFr ? "Glucides" : "Carbs",
                current: todaySummary.totalCarbs,
                goal: goals.carbsGoal,
                color: NAVY_CARD,
              },
              {
                label: isFr ? "Protéines" : "Protein",
                current: todaySummary.totalProtein,
                goal: goals.proteinGoal,
                color: NAVY_CARD_LIGHT,
              },
              {
                label: isFr ? "Lipides" : "Fat",
                current: todaySummary.totalFat,
                goal: goals.fatGoal,
                color: NAVY_CARD_DEEP,
              },
            ].map((m) => {
              const pct = m.goal > 0 ? Math.min(m.current / m.goal, 1) : 0;
              return (
                <View key={m.label} style={styles.macroBarItem}>
                  <Text style={styles.macroBarLabel}>{m.label}</Text>
                  <View style={styles.macroBarTrack}>
                    <View
                      style={[
                        styles.macroBarFill,
                        {
                          width: `${pct * 100}%`,
                          backgroundColor: m.color,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.macroBarValue}>
                    {Math.round(m.current)} / {m.goal} g
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* ── Alimentation ───────────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {isFr ? "Alimentation" : "Food"}
          </Text>
        </View>

        <View style={styles.mealsBlock}>
          {MEAL_TABS.map((item, index) => {
            const meals = getMealsForType(item.type);
            const consumed = getMealTypeCalories(item.type);
            const macros = getMealTypeMacros(item.type);
            const target = mealCalorieGoal(item.ratio);

            const isExpanded = expandedMeals[item.type];
            const isLast = index === MEAL_TABS.length - 1;
            return (
              <View key={item.type}>
                <Pressable
                  style={styles.mealRow}
                  onPress={() => toggleMealExpanded(item.type)}
                >
                  <Text style={styles.mealEmoji}>{item.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.mealName}>
                      {t(`food.${item.type}`)}
                    </Text>
                    <Text style={styles.mealKcal}>
                      {Math.round(consumed)} / {target} kcal
                    </Text>
                    <View style={styles.mealMacroRow}>
                      <Text style={styles.mealMacroText} numberOfLines={1}>
                        {isFr ? "Prot" : "Protein"} {Math.round(macros.protein)}
                        g
                      </Text>
                      <Text style={styles.mealMacroText} numberOfLines={1}>
                        {isFr ? "Lip" : "Fat"} {Math.round(macros.fat)}g
                      </Text>
                      <Text style={styles.mealMacroText} numberOfLines={1}>
                        {isFr ? "Gluc" : "Carbs"} {Math.round(macros.carbs)}g
                      </Text>
                    </View>
                  </View>
                  <View style={styles.mealActionsCol}>
                    <TutorialTarget
                      id={
                        item.type === "breakfast"
                          ? "alimentation.breakfastAddButton"
                          : `alimentation.${item.type}AddButton`
                      }
                      style={styles.mealPlusTarget}
                    >
                      <Pressable
                        style={styles.mealPlusBtn}
                        onPress={() => openFoodSearch(item.type)}
                      >
                        <Ionicons
                          name="add-circle-outline"
                          size={28}
                          color="#FFFFFF"
                        />
                      </Pressable>
                    </TutorialTarget>
                    <Pressable
                      style={styles.mealChevronBtn}
                      onPress={() => toggleMealExpanded(item.type)}
                      hitSlop={8}
                    >
                      <Animated.View
                        style={{
                          opacity: chevronOpacityRefs.current[item.type],
                        }}
                      >
                        <Ionicons
                          name={isExpanded ? "chevron-up" : "chevron-down"}
                          size={22}
                          color="#FFFFFF"
                        />
                      </Animated.View>
                    </Pressable>
                  </View>
                </Pressable>

                {isExpanded && meals.length === 0 && (
                  <View style={styles.foodEmpty}>
                    <Text style={styles.foodEmptyText}>
                      {isFr
                        ? "Aucun aliment ajouté pour ce repas."
                        : "No food added for this meal yet."}
                    </Text>
                  </View>
                )}

                {isExpanded &&
                  meals.length > 0 &&
                  meals.map((meal) => (
                    <View key={meal.id} style={styles.foodItem}>
                      {meal.imageUrl ? (
                        <Image
                          source={{ uri: meal.imageUrl }}
                          style={styles.foodThumb}
                          resizeMode="cover"
                        />
                      ) : (
                        <View
                          style={[styles.foodThumb, styles.foodThumbFallback]}
                        >
                          <Text style={styles.foodThumbInitial}>
                            {(meal.foodName || "?").charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={styles.foodName} numberOfLines={1}>
                          {meal.foodName}
                        </Text>
                        <Text style={styles.foodInfo}>
                          {Math.round(meal.calories)} kcal |{" "}
                          {isFr ? "Prot" : "Protein"} {Math.round(meal.protein)}
                          g{" | "}
                          {isFr ? "Lip" : "Fat"} {Math.round(meal.fat)}g{" | "}
                          {isFr ? "Gluc" : "Carbs"} {Math.round(meal.carbs)}g
                        </Text>
                      </View>
                      <Pressable
                        hitSlop={8}
                        onPress={() => removeMeal(meal.id)}
                      >
                        <Ionicons
                          name="close-circle"
                          size={20}
                          color={`${theme.foreground.gray}50`}
                        />
                      </Pressable>
                    </View>
                  ))}

                {!isLast && <View style={styles.mealDivider} />}
              </View>
            );
          })}
        </View>

        {/* ── Données corporelles ────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {isFr ? "Données corporelles" : "Body Data"}
          </Text>
        </View>

        <View style={styles.weightCard}>
          <Text style={styles.weightLabel}>{isFr ? "Poids" : "Weight"}</Text>
          <Text style={styles.weightGoal}>
            {isFr ? "Objectif" : "Goal"} : {weightTarget} kg
          </Text>
          <View style={styles.weightRow}>
            <Pressable
              style={styles.weightBtn}
              onPress={() => setWeight(Math.max(30, weightCurrent - 0.1))}
            >
              <Ionicons
                name="remove-circle-outline"
                size={32}
                color={theme.foreground.gray}
              />
            </Pressable>
            {isEditingWeight ? (
              <TextInput
                style={styles.weightInput}
                value={weightInput}
                onChangeText={setWeightInput}
                keyboardType="decimal-pad"
                autoFocus
                selectTextOnFocus
                onSubmitEditing={handleSaveWeight}
                onBlur={handleSaveWeight}
              />
            ) : (
              <Text style={styles.weightValue}>
                {weightCurrent.toFixed(1)} kg
              </Text>
            )}
            <Pressable
              style={styles.weightBtn}
              onPress={() => setWeight(Math.min(300, weightCurrent + 0.1))}
            >
              <Ionicons name="add-circle-outline" size={32} color="#FFFFFF" />
            </Pressable>
          </View>

          <Pressable
            style={[styles.weightSaveBtn, isSavingWeight && { opacity: 0.6 }]}
            disabled={isSavingWeight}
            onPress={isEditingWeight ? handleSaveWeight : startEditWeight}
          >
            <Ionicons
              name={isEditingWeight ? "checkmark" : "create-outline"}
              size={16}
              color="#fff"
            />
            <Text style={styles.weightSaveText}>
              {isEditingWeight
                ? isFr
                  ? "Enregistrer"
                  : "Save"
                : isFr
                  ? "Mettre à jour le poids"
                  : "Update weight"}
            </Text>
          </Pressable>
        </View>
        {/* ── Suivi eau ──────────────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {isFr ? "Suivi de la consommation d'eau" : "Water Tracking"}
          </Text>
        </View>

        <View style={styles.waterCard}>
          <Text style={styles.waterTitle}>{isFr ? "Eau" : "Water"}</Text>
          <Text style={styles.waterGoal}>
            {isFr ? "Objectif" : "Goal"} : {(waterGoalMl / 1000).toFixed(2)}{" "}
            {isFr ? "litres" : "liters"}
          </Text>
          <Text style={styles.waterValue}>{(waterMl / 1000).toFixed(2)} L</Text>

          <View style={styles.glassRow}>
            {Array.from({ length: totalGlasses }, (_, i) => (
              <Pressable
                key={i}
                onPress={() => setWater((i + 1) * GLASS_STEP_ML)}
              >
                <Ionicons
                  name={i < waterGlasses ? "water" : "water-outline"}
                  size={28}
                  color={i < waterGlasses ? "#FFFFFF" : NAVY_TEXT_SOFT}
                />
              </Pressable>
            ))}
          </View>

          <View style={styles.waterBtns}>
            <Pressable
              style={styles.waterBtn}
              onPress={() => setWater(Math.max(0, waterMl - GLASS_STEP_ML))}
            >
              <Ionicons name="remove" size={18} color={NAVY_TEXT_MUTED} />
            </Pressable>
            <Pressable
              style={[styles.waterBtn, styles.waterBtnPrimary]}
              onPress={() =>
                setWater(Math.min(waterGoalMl * 2, waterMl + GLASS_STEP_ML))
              }
            >
              <Ionicons name="add" size={18} color="#fff" />
            </Pressable>
          </View>
        </View>

        {/* ── Notes ──────────────────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Notes</Text>
        </View>

        <View style={styles.noteCard}>
          <Text style={styles.notePrompt}>
            {isFr
              ? "Comment s'est passée votre journée ?"
              : "How was your day?"}
          </Text>
          <Text style={styles.notePromptSub}>
            {isFr
              ? "Gardez un oeil sur votre santé et vos émotions."
              : "Keep an eye on your health and emotions."}
          </Text>

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
  const navyCard = {
    backgroundColor: NAVY_CARD,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    borderBottomWidth: 3,
    borderBottomColor: "rgba(0,0,0,0.24)",
    ...(Platform.OS === "ios"
      ? {
          shadowColor: NAVY_CARD,
          shadowOpacity: 0.26,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 8 },
        }
      : { elevation: 5 }),
  } as const;

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
    scrollContent: { paddingBottom: 100, paddingTop: 8 },

    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 10,
    },
    headerTitle: {
      fontFamily: FONTS.extraBold,
      fontSize: 24,
      color: theme.foreground.white,
    },
    headerSub: {
      fontFamily: FONTS.regular,
      fontSize: 12,
      color: theme.foreground.gray,
      marginTop: 2,
    },
    headerActions: { flexDirection: "row", gap: 6 },
    headerIconBtn: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: NAVY_CARD,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.14)",
      alignItems: "center",
      justifyContent: "center",
    },

    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      marginTop: 18,
      marginBottom: 10,
    },
    sectionTitle: {
      fontFamily: FONTS.extraBold,
      fontSize: 17,
      color: theme.foreground.white,
    },
    sectionLink: {
      fontFamily: FONTS.bold,
      fontSize: 13,
      color: NAVY_CARD_LIGHT,
    },

    summaryCard: {
      marginHorizontal: 20,
      padding: 18,
      borderRadius: 18,
    },
    summaryTopRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    summarySide: {
      flex: 1,
      alignItems: "center",
    },
    summarySideValue: {
      fontFamily: FONTS.extraBold,
      fontSize: 22,
      color: NAVY_CARD,
    },
    summarySideLabel: {
      fontFamily: FONTS.regular,
      fontSize: 12,
      color: NAVY_CARD,
      marginTop: 4,
    },
    summaryCenter: {
      alignItems: "center",
      justifyContent: "center",
    },
    summaryCenterValue: {
      fontFamily: FONTS.extraBold,
      fontSize: 28,
      color: NAVY_CARD,
    },
    summaryCenterLabel: {
      fontFamily: FONTS.regular,
      fontSize: 12,
      color: NAVY_CARD,
      marginTop: 2,
    },

    macroBarRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 22,
      gap: 14,
    },
    macroBarItem: {
      flex: 1,
    },
    macroBarLabel: {
      fontFamily: FONTS.semiBold,
      fontSize: 14,
      color: NAVY_CARD,
      marginBottom: 6,
      textAlign: "center",
    },
    macroBarTrack: {
      height: 10,
      borderRadius: 6,
      backgroundColor: "rgba(10,22,40,0.18)",
      overflow: "hidden",
    },
    macroBarFill: {
      height: "100%",
      borderRadius: 4,
    },
    macroBarValue: {
      fontFamily: FONTS.regular,
      fontSize: 12,
      color: NAVY_CARD,
      marginTop: 6,
      textAlign: "center",
    },

    mealsBlock: {
      marginHorizontal: 20,
      borderRadius: 18,
      overflow: "hidden",
      ...navyCard,
    },
    mealDivider: {
      height: 2,
      backgroundColor: "rgba(255,255,255,0.22)",
      marginHorizontal: 14,
    },
    mealRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 14,
      paddingHorizontal: 14,
    },
    mealEmoji: { fontSize: 24 },
    mealName: {
      fontFamily: FONTS.bold,
      fontSize: 14,
      color: "#FFFFFF",
      textTransform: "capitalize",
    },
    mealKcal: {
      fontFamily: FONTS.regular,
      fontSize: 12,
      color: NAVY_TEXT_MUTED,
      marginTop: 1,
    },
    mealMacroRow: {
      flexDirection: "row",
      gap: 6,
      marginTop: 6,
    },
    mealMacroText: {
      flex: 1,
      height: 22,
      lineHeight: 22,
      textAlign: "center",
      textAlignVertical: "center",
      fontFamily: FONTS.medium,
      fontSize: 10,
      color: NAVY_TEXT_MUTED,
      backgroundColor: "rgba(255,255,255,0.10)",
      borderRadius: 6,
      paddingHorizontal: 6,
      paddingVertical: 0,
      overflow: "hidden",
    },
    mealActionsCol: {
      alignItems: "center",
      justifyContent: "center",
      gap: 2,
    },
    mealPlusTarget: {
      alignSelf: "center",
    },
    mealPlusBtn: { padding: 4 },
    mealChevronBtn: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      alignItems: "center",
      justifyContent: "center",
    },
    foodItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: `${theme.foreground.gray}12`,
    },
    foodThumb: {
      width: 38,
      height: 38,
      borderRadius: 10,
      backgroundColor: theme.background.accent,
    },
    foodThumbFallback: {
      alignItems: "center",
      justifyContent: "center",
    },
    foodThumbInitial: {
      fontFamily: FONTS.bold,
      fontSize: 16,
      color: theme.foreground.gray,
    },
    foodName: {
      fontFamily: FONTS.medium,
      fontSize: 13,
      color: "#FFFFFF",
    },
    foodInfo: {
      fontFamily: FONTS.regular,
      fontSize: 11,
      color: "#FFFFFF",
      marginTop: 1,
    },
    foodEmpty: {
      paddingVertical: 10,
      paddingHorizontal: 14,
    },
    foodEmptyText: {
      fontFamily: FONTS.regular,
      fontSize: 12,
      color: NAVY_TEXT_SOFT,
      fontStyle: "italic",
    },

    waterCard: {
      marginHorizontal: 20,
      padding: 18,
      borderRadius: 18,
      alignItems: "center",
      ...navyCard,
    },
    waterTitle: {
      fontFamily: FONTS.bold,
      fontSize: 15,
      color: "#FFFFFF",
    },
    waterGoal: {
      fontFamily: FONTS.regular,
      fontSize: 12,
      color: NAVY_TEXT_MUTED,
      marginTop: 2,
    },
    waterValue: {
      fontFamily: FONTS.extraBold,
      fontSize: 28,
      color: "#FFFFFF",
      marginTop: 8,
    },
    glassRow: {
      flexDirection: "row",
      gap: 6,
      marginTop: 14,
      flexWrap: "wrap",
      justifyContent: "center",
    },
    waterBtns: { flexDirection: "row", gap: 12, marginTop: 14 },
    waterBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: NAVY_CARD_DEEP,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.14)",
      alignItems: "center",
      justifyContent: "center",
    },
    waterBtnPrimary: {
      backgroundColor: NAVY_CARD_LIGHT,
      borderColor: "rgba(255,255,255,0.18)",
    },

    weightCard: {
      marginHorizontal: 20,
      padding: 18,
      borderRadius: 18,
      alignItems: "center",
      ...navyCard,
    },
    weightLabel: {
      fontFamily: FONTS.bold,
      fontSize: 15,
      color: "#FFFFFF",
    },
    weightGoal: {
      fontFamily: FONTS.regular,
      fontSize: 12,
      color: NAVY_TEXT_MUTED,
      marginTop: 2,
    },
    weightRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 24,
      marginTop: 12,
    },
    weightValue: {
      fontFamily: FONTS.extraBold,
      fontSize: 28,
      color: "#FFFFFF",
    },
    weightInput: {
      fontFamily: FONTS.extraBold,
      fontSize: 28,
      color: "#FFFFFF",
      minWidth: 110,
      textAlign: "center",
      paddingVertical: 4,
      paddingHorizontal: 12,
      borderRadius: 10,
      backgroundColor: NAVY_CARD_DEEP,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.14)",
    },
    weightBtn: {},
    weightSaveBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: 16,
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 12,
      backgroundColor: NAVY_CARD_LIGHT,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.16)",
    },
    weightSaveText: {
      fontFamily: FONTS.bold,
      fontSize: 13,
      color: "#fff",
    },

    noteCard: {
      marginHorizontal: 20,
      padding: 18,
      borderRadius: 18,
      marginBottom: 16,
      ...navyCard,
    },
    notePrompt: {
      fontFamily: FONTS.bold,
      fontSize: 14,
      color: "#FFFFFF",
      textAlign: "center",
    },
    notePromptSub: {
      fontFamily: FONTS.regular,
      fontSize: 12,
      color: NAVY_TEXT_MUTED,
      textAlign: "center",
      marginTop: 4,
      marginBottom: 14,
    },
    noteInputRow: { flexDirection: "row", gap: 8 },
    noteInput: {
      flex: 1,
      borderRadius: 12,
      backgroundColor: NAVY_CARD_DEEP,
      color: "#FFFFFF",
      fontFamily: FONTS.regular,
      fontSize: 13,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    noteSendBtn: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: NAVY_CARD_LIGHT,
    },
    noteItem: {
      paddingVertical: 8,
      marginTop: 8,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: "rgba(255,255,255,0.12)",
    },
    noteText: {
      fontFamily: FONTS.regular,
      fontSize: 13,
      color: NAVY_TEXT_MUTED,
      lineHeight: 18,
    },
  });
}

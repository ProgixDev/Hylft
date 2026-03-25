import { Ionicons } from "@expo/vector-icons";
import BottomSheet, {
  BottomSheetScrollView,
  BottomSheetTextInput,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { PieChart } from "react-native-gifted-charts";
import { FONTS } from "../../constants/fonts";
import { Theme } from "../../constants/themes";
import { useNutrition } from "../../contexts/NutritionContext";
import { useTheme } from "../../contexts/ThemeContext";
import { NutritionApi } from "../../services/nutritionApi";
import type { FoodProduct, MealType } from "../../services/nutritionApi";

// ── Common foods shown before searching ──────────────────────────────────────
const POPULAR_SEARCHES = [
  "chicken breast",
  "rice",
  "egg",
  "banana",
  "oats",
  "milk",
  "bread",
  "pasta",
  "yogurt",
  "salmon",
  "apple",
  "avocado",
];

const MEAL_CONFIG: {
  type: MealType;
  iconName: keyof typeof Ionicons.glyphMap;
  color: string;
}[] = [
  { type: "breakfast", iconName: "sunny-outline", color: "#F5A623" },
  { type: "lunch", iconName: "restaurant-outline", color: "#4A90D9" },
  { type: "dinner", iconName: "moon-outline", color: "#8B5CF6" },
  { type: "snack", iconName: "cafe-outline", color: "#4CD964" },
];

export default function Alimentation() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { goals, todayMeals, todaySummary, addMeal, removeMeal } =
    useNutrition();

  const styles = createStyles(theme);

  // ── Bottom sheet refs ──────────────────────────────────────────────
  const foodSheetRef = useRef<BottomSheet>(null);
  const quickAddSheetRef = useRef<BottomSheet>(null);
  const foodSheetSnaps = useMemo(() => ["92%"], []);
  const quickAddSnaps = useMemo(() => ["55%"], []);

  // ── State ──────────────────────────────────────────────────────────
  const [activeMealType, setActiveMealType] = useState<MealType>("breakfast");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FoodProduct[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Quick add
  const [quickName, setQuickName] = useState("");
  const [quickCalories, setQuickCalories] = useState("");
  const [quickProtein, setQuickProtein] = useState("");
  const [quickCarbs, setQuickCarbs] = useState("");
  const [quickFat, setQuickFat] = useState("");

  // Water
  const [waterGlasses, setWaterGlasses] = useState(0);
  const WATER_GOAL = 8;

  // ── Derived ────────────────────────────────────────────────────────
  const consumed = todaySummary.totalCalories;
  const remaining = Math.max(goals.calorieGoal - consumed, 0);

  const macros = [
    { label: t("food.protein"), current: todaySummary.totalProtein, goal: goals.proteinGoal, color: "#4A90D9" },
    { label: t("food.carbs"), current: todaySummary.totalCarbs, goal: goals.carbsGoal, color: "#F5A623" },
    { label: t("food.fat"), current: todaySummary.totalFat, goal: goals.fatGoal, color: "#ED6665" },
  ];

  const donutData = [
    { value: Math.max(consumed, 1), color: theme.primary.main },
    { value: Math.max(remaining, 1), color: theme.background.accent },
  ];

  // ── Handlers ───────────────────────────────────────────────────────
  const openFoodSheet = (mealType: MealType) => {
    setActiveMealType(mealType);
    setSearchQuery("");
    setSearchResults([]);
    setHasSearched(false);
    foodSheetRef.current?.snapToIndex(0);
  };

  const openQuickAddSheet = (mealType: MealType) => {
    setActiveMealType(mealType);
    setQuickName("");
    setQuickCalories("");
    setQuickProtein("");
    setQuickCarbs("");
    setQuickFat("");
    quickAddSheetRef.current?.snapToIndex(0);
  };

  const handleSearch = useCallback(
    async (query?: string) => {
      const q = (query ?? searchQuery).trim();
      if (!q) return;
      setIsSearching(true);
      setHasSearched(true);
      try {
        const result = await NutritionApi.searchFood(q, 1, 20);
        setSearchResults(result.products);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [searchQuery],
  );

  const handleAddFood = async (product: FoodProduct) => {
    const today = new Date().toISOString().split("T")[0];
    await addMeal({
      date: today,
      mealType: activeMealType,
      foodId: product.id,
      foodName: product.name,
      servings: 1,
      calories: product.nutrition.caloriesPerServing || product.nutrition.calories,
      protein: product.nutrition.proteinPerServing || product.nutrition.protein,
      carbs: product.nutrition.carbsPerServing || product.nutrition.carbs,
      fat: product.nutrition.fatPerServing || product.nutrition.fat,
    });
    foodSheetRef.current?.close();
  };

  const handleQuickAdd = async () => {
    if (!quickName.trim()) return;
    const today = new Date().toISOString().split("T")[0];
    await addMeal({
      date: today,
      mealType: activeMealType,
      foodId: null,
      foodName: quickName.trim(),
      servings: 1,
      calories: parseInt(quickCalories) || 0,
      protein: parseFloat(quickProtein) || 0,
      carbs: parseFloat(quickCarbs) || 0,
      fat: parseFloat(quickFat) || 0,
    });
    quickAddSheetRef.current?.close();
  };

  const handleRemoveMeal = (mealId: string, foodName: string) => {
    Alert.alert(t("food.removeMeal"), `${t("food.removeMealConfirm")} "${foodName}"?`, [
      { text: t("common.cancel"), style: "cancel" },
      { text: t("common.delete"), style: "destructive", onPress: () => removeMeal(mealId) },
    ]);
  };

  const getMealsForType = (type: MealType) =>
    todayMeals.filter((m) => m.mealType === type);

  const getMealTypeCalories = (type: MealType) =>
    getMealsForType(type).reduce((s, m) => s + m.calories, 0);

  // ═══════════════════════════════════════════════════════════════════
  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 90 }}
      >
        {/* ── Header ──────────────────────────────────────────────── */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t("food.title")}</Text>
          <Text style={styles.headerDate}>
            {new Date().toLocaleDateString(undefined, {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </Text>
        </View>

        {/* ── Calorie Ring + Summary ──────────────────────────────── */}
        <View style={styles.summaryCard}>
          <View style={styles.ringRow}>
            <PieChart
              data={donutData}
              donut
              radius={55}
              innerRadius={42}
              innerCircleColor={theme.background.darker}
              centerLabelComponent={() => (
                <View style={{ alignItems: "center" }}>
                  <Text style={styles.ringValue}>{remaining}</Text>
                  <Text style={styles.ringLabel}>{t("food.left")}</Text>
                </View>
              )}
            />
            <View style={styles.ringStats}>
              <View style={styles.ringStat}>
                <Text style={styles.ringStatValue}>{goals.calorieGoal}</Text>
                <Text style={styles.ringStatLabel}>{t("food.goalLabel")}</Text>
              </View>
              <View style={styles.ringStatDivider} />
              <View style={styles.ringStat}>
                <Text style={styles.ringStatValue}>{consumed}</Text>
                <Text style={styles.ringStatLabel}>{t("food.eaten")}</Text>
              </View>
              <View style={styles.ringStatDivider} />
              <View style={styles.ringStat}>
                <Text style={styles.ringStatValue}>{remaining}</Text>
                <Text style={styles.ringStatLabel}>{t("food.remaining")}</Text>
              </View>
            </View>
          </View>

          <View style={styles.macrosRow}>
            {macros.map((macro) => {
              const pct = macro.goal > 0
                ? Math.min(Math.round((macro.current / macro.goal) * 100), 100)
                : 0;
              return (
                <View key={macro.label} style={styles.macroBar}>
                  <View style={styles.macroBarHeader}>
                    <Text style={styles.macroBarLabel}>{macro.label}</Text>
                    <Text style={styles.macroBarValue}>
                      {Math.round(macro.current)}/{macro.goal}g
                    </Text>
                  </View>
                  <View style={styles.macroBarBg}>
                    <View style={[styles.macroBarFill, { width: `${pct}%`, backgroundColor: macro.color }]} />
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* ── Meal Sections ───────────────────────────────────────── */}
        {MEAL_CONFIG.map(({ type, iconName, color }) => {
          const meals = getMealsForType(type);
          const mealCals = getMealTypeCalories(type);

          return (
            <View key={type} style={styles.mealSection}>
              <View style={styles.mealHeader}>
                <View style={styles.mealHeaderLeft}>
                  <View style={[styles.mealIcon, { backgroundColor: color + "15" }]}>
                    <Ionicons name={iconName} size={18} color={color} />
                  </View>
                  <View>
                    <Text style={styles.mealTitle}>{t(`food.${type}`)}</Text>
                    {mealCals > 0 && <Text style={styles.mealCals}>{mealCals} kcal</Text>}
                  </View>
                </View>
                <View style={styles.mealActions}>
                  <Pressable style={styles.mealActionBtn} onPress={() => openQuickAddSheet(type)}>
                    <Ionicons name="pencil-outline" size={16} color={theme.primary.main} />
                  </Pressable>
                  <Pressable
                    style={[styles.mealActionBtn, { backgroundColor: theme.primary.main }]}
                    onPress={() => openFoodSheet(type)}
                  >
                    <Ionicons name="add" size={18} color="#fff" />
                  </Pressable>
                </View>
              </View>

              {meals.length > 0 ? (
                meals.map((meal) => (
                  <Pressable
                    key={meal.id}
                    style={styles.foodRow}
                    onLongPress={() => handleRemoveMeal(meal.id, meal.foodName)}
                  >
                    <View style={styles.foodInfo}>
                      <Text style={styles.foodName} numberOfLines={1}>{meal.foodName}</Text>
                      <Text style={styles.foodMeta}>
                        {meal.servings > 1 ? `${meal.servings}x · ` : ""}
                        P: {Math.round(meal.protein)}g · C: {Math.round(meal.carbs)}g · F: {Math.round(meal.fat)}g
                      </Text>
                    </View>
                    <Text style={styles.foodCals}>{meal.calories}</Text>
                  </Pressable>
                ))
              ) : (
                <Pressable style={styles.emptyMeal} onPress={() => openFoodSheet(type)}>
                  <Ionicons name="add-circle-outline" size={20} color={theme.foreground.gray} />
                  <Text style={styles.emptyMealText}>{t("food.addFood")}</Text>
                </Pressable>
              )}
            </View>
          );
        })}

        {/* ── Water ───────────────────────────────────────────────── */}
        <View style={styles.waterSection}>
          <View style={styles.mealHeaderLeft}>
            <View style={[styles.mealIcon, { backgroundColor: "#2196F3" + "15" }]}>
              <Ionicons name="water-outline" size={18} color="#2196F3" />
            </View>
            <View>
              <Text style={styles.mealTitle}>{t("food.water")}</Text>
              <Text style={styles.mealCals}>{waterGlasses}/{WATER_GOAL} {t("food.glasses")}</Text>
            </View>
          </View>
          <View style={styles.waterRow}>
            {Array.from({ length: WATER_GOAL }, (_, i) => (
              <Pressable key={i} onPress={() => setWaterGlasses(i < waterGlasses ? i : i + 1)}>
                <Ionicons
                  name={i < waterGlasses ? "water" : "water-outline"}
                  size={28}
                  color={i < waterGlasses ? "#2196F3" : theme.background.accent}
                />
              </Pressable>
            ))}
          </View>
        </View>

        {/* ── Daily Total ─────────────────────────────────────────── */}
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>{t("food.dailyTotal")}</Text>
          <View style={styles.totalRow}>
            <View style={styles.totalItem}>
              <Text style={styles.totalValue}>{consumed}</Text>
              <Text style={styles.totalUnit}>kcal</Text>
            </View>
            <View style={styles.totalDivider} />
            <View style={styles.totalItem}>
              <Text style={styles.totalValue}>{Math.round(todaySummary.totalProtein)}g</Text>
              <Text style={styles.totalUnit}>{t("food.protein")}</Text>
            </View>
            <View style={styles.totalDivider} />
            <View style={styles.totalItem}>
              <Text style={styles.totalValue}>{Math.round(todaySummary.totalCarbs)}g</Text>
              <Text style={styles.totalUnit}>{t("food.carbs")}</Text>
            </View>
            <View style={styles.totalDivider} />
            <View style={styles.totalItem}>
              <Text style={styles.totalValue}>{Math.round(todaySummary.totalFat)}g</Text>
              <Text style={styles.totalUnit}>{t("food.fat")}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ═══ Food Search Bottom Sheet ════════════════════════════════ */}
      <BottomSheet
        ref={foodSheetRef}
        index={-1}
        snapPoints={foodSheetSnaps}
        enablePanDownToClose
        enableDynamicSizing={false}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        backgroundStyle={{ backgroundColor: theme.background.dark }}
        handleIndicatorStyle={{ backgroundColor: theme.background.accent }}
      >
        {/* Header */}
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>{t("food.searchFood")}</Text>
          <Pressable onPress={() => foodSheetRef.current?.close()}>
            <Ionicons name="close" size={22} color={theme.foreground.gray} />
          </Pressable>
        </View>

        {/* Search bar */}
        <View style={styles.sheetSearchBar}>
          <Ionicons name="search" size={18} color={theme.foreground.gray} />
          <BottomSheetTextInput
            style={styles.sheetSearchInput}
            placeholder={t("food.searchPlaceholder")}
            placeholderTextColor={theme.foreground.gray}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={() => handleSearch()}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => { setSearchQuery(""); setSearchResults([]); setHasSearched(false); }}>
              <Ionicons name="close-circle" size={18} color={theme.foreground.gray} />
            </Pressable>
          )}
        </View>

        <BottomSheetScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
          {/* Quick add link */}
          <Pressable
            style={styles.quickAddLink}
            onPress={() => { foodSheetRef.current?.close(); setTimeout(() => openQuickAddSheet(activeMealType), 300); }}
          >
            <Ionicons name="pencil-outline" size={15} color={theme.primary.main} />
            <Text style={styles.quickAddLinkText}>{t("food.quickAdd")}</Text>
          </Pressable>

          {/* Popular foods (before search) */}
          {!hasSearched && (
            <>
              <Text style={styles.sectionLabel}>{t("food.popular")}</Text>
              <View style={styles.popularChips}>
                {POPULAR_SEARCHES.map((food) => (
                  <Pressable
                    key={food}
                    style={styles.popularChip}
                    onPress={() => {
                      setSearchQuery(food);
                      handleSearch(food);
                    }}
                  >
                    <Text style={styles.popularChipText}>{food}</Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}

          {/* Search results */}
          {isSearching && (
            <Text style={styles.searchStatus}>{t("food.searching")}...</Text>
          )}
          {hasSearched && !isSearching && searchResults.length === 0 && (
            <Text style={styles.searchStatus}>{t("food.noResults")}</Text>
          )}
          {searchResults.map((product) => (
            <Pressable
              key={product.id}
              style={styles.resultRow}
              onPress={() => handleAddFood(product)}
            >
              <View style={styles.resultInfo}>
                <Text style={styles.resultName} numberOfLines={1}>{product.name}</Text>
                <Text style={styles.resultBrand} numberOfLines={1}>
                  {product.brand || t("food.generic")}
                  {product.nutrition.servingSize ? ` · ${product.nutrition.servingSize}` : ""}
                </Text>
                <Text style={styles.resultMacros}>
                  P: {product.nutrition.protein}g · C: {product.nutrition.carbs}g · F: {product.nutrition.fat}g
                </Text>
              </View>
              <View style={styles.resultCals}>
                <Text style={styles.resultCalsValue}>
                  {product.nutrition.caloriesPerServing || product.nutrition.calories}
                </Text>
                <Text style={styles.resultCalsUnit}>kcal</Text>
              </View>
              <Ionicons name="add-circle" size={24} color={theme.primary.main} style={{ marginLeft: 8 }} />
            </Pressable>
          ))}
        </BottomSheetScrollView>
      </BottomSheet>

      {/* ═══ Quick Add Bottom Sheet ══════════════════════════════════ */}
      <BottomSheet
        ref={quickAddSheetRef}
        index={-1}
        snapPoints={quickAddSnaps}
        enablePanDownToClose
        enableDynamicSizing={false}
        keyboardBehavior="fillParent"
        keyboardBlurBehavior="restore"
        backgroundStyle={{ backgroundColor: theme.background.darker }}
        handleIndicatorStyle={{ backgroundColor: theme.background.accent }}
      >
        <BottomSheetView style={styles.quickAddContent}>
          <Text style={styles.sheetTitle}>{t("food.quickAdd")}</Text>

          <BottomSheetTextInput
            style={styles.quickAddInput}
            placeholder={t("food.foodName")}
            placeholderTextColor={theme.foreground.gray}
            value={quickName}
            onChangeText={setQuickName}
          />

          <View style={styles.quickAddRow}>
            <View style={styles.quickAddField}>
              <Text style={styles.quickAddLabel}>kcal</Text>
              <BottomSheetTextInput
                style={styles.quickAddNumInput}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={theme.foreground.gray}
                value={quickCalories}
                onChangeText={setQuickCalories}
              />
            </View>
            <View style={styles.quickAddField}>
              <Text style={styles.quickAddLabel}>{t("food.protein")}</Text>
              <BottomSheetTextInput
                style={styles.quickAddNumInput}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={theme.foreground.gray}
                value={quickProtein}
                onChangeText={setQuickProtein}
              />
            </View>
            <View style={styles.quickAddField}>
              <Text style={styles.quickAddLabel}>{t("food.carbs")}</Text>
              <BottomSheetTextInput
                style={styles.quickAddNumInput}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={theme.foreground.gray}
                value={quickCarbs}
                onChangeText={setQuickCarbs}
              />
            </View>
            <View style={styles.quickAddField}>
              <Text style={styles.quickAddLabel}>{t("food.fat")}</Text>
              <BottomSheetTextInput
                style={styles.quickAddNumInput}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={theme.foreground.gray}
                value={quickFat}
                onChangeText={setQuickFat}
              />
            </View>
          </View>

          <View style={styles.quickAddButtons}>
            <Pressable style={styles.quickAddCancel} onPress={() => quickAddSheetRef.current?.close()}>
              <Text style={styles.quickAddCancelText}>{t("common.cancel")}</Text>
            </Pressable>
            <Pressable
              style={[styles.quickAddSave, { backgroundColor: theme.primary.main }]}
              onPress={handleQuickAdd}
            >
              <Text style={styles.quickAddSaveText}>{t("food.addFood")}</Text>
            </Pressable>
          </View>
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background.dark },
    header: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 14 },
    headerTitle: { fontFamily: FONTS.extraBold, fontSize: 24, color: theme.foreground.white },
    headerDate: { fontFamily: FONTS.regular, fontSize: 13, color: theme.foreground.gray, marginTop: 2 },

    summaryCard: { marginHorizontal: 20, backgroundColor: theme.background.darker, borderRadius: 20, padding: 18, marginBottom: 16 },
    ringRow: { flexDirection: "row", alignItems: "center", gap: 18 },
    ringValue: { fontFamily: FONTS.extraBold, fontSize: 20, color: theme.foreground.white },
    ringLabel: { fontFamily: FONTS.regular, fontSize: 10, color: theme.foreground.gray },
    ringStats: { flex: 1, flexDirection: "row", justifyContent: "space-around" },
    ringStat: { alignItems: "center" },
    ringStatValue: { fontFamily: FONTS.bold, fontSize: 16, color: theme.foreground.white },
    ringStatLabel: { fontFamily: FONTS.regular, fontSize: 10, color: theme.foreground.gray, marginTop: 2 },
    ringStatDivider: { width: 1, height: 28, backgroundColor: theme.background.accent },

    macrosRow: { marginTop: 16, gap: 10 },
    macroBar: {},
    macroBarHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
    macroBarLabel: { fontFamily: FONTS.semiBold, fontSize: 12, color: theme.foreground.white },
    macroBarValue: { fontFamily: FONTS.regular, fontSize: 11, color: theme.foreground.gray },
    macroBarBg: { height: 6, borderRadius: 3, backgroundColor: theme.background.accent, overflow: "hidden" },
    macroBarFill: { height: "100%", borderRadius: 3 },

    mealSection: { marginHorizontal: 20, backgroundColor: theme.background.darker, borderRadius: 16, padding: 14, marginBottom: 10 },
    mealHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
    mealHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
    mealIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
    mealTitle: { fontFamily: FONTS.bold, fontSize: 15, color: theme.foreground.white },
    mealCals: { fontFamily: FONTS.regular, fontSize: 11, color: theme.foreground.gray, marginTop: 1 },
    mealActions: { flexDirection: "row", gap: 8 },
    mealActionBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: theme.background.accent, alignItems: "center", justifyContent: "center" },

    foodRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.background.accent },
    foodInfo: { flex: 1 },
    foodName: { fontFamily: FONTS.semiBold, fontSize: 14, color: theme.foreground.white },
    foodMeta: { fontFamily: FONTS.regular, fontSize: 11, color: theme.foreground.gray, marginTop: 2 },
    foodCals: { fontFamily: FONTS.bold, fontSize: 15, color: theme.foreground.white, marginLeft: 8 },

    emptyMeal: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.background.accent },
    emptyMealText: { fontFamily: FONTS.regular, fontSize: 13, color: theme.foreground.gray },

    waterSection: { marginHorizontal: 20, backgroundColor: theme.background.darker, borderRadius: 16, padding: 14, marginBottom: 10 },
    waterRow: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 4, marginTop: 12 },

    totalCard: { marginHorizontal: 20, backgroundColor: theme.background.darker, borderRadius: 16, padding: 16, marginBottom: 16 },
    totalLabel: { fontFamily: FONTS.bold, fontSize: 15, color: theme.foreground.white, marginBottom: 12 },
    totalRow: { flexDirection: "row", justifyContent: "space-around", alignItems: "center" },
    totalItem: { alignItems: "center" },
    totalValue: { fontFamily: FONTS.bold, fontSize: 18, color: theme.foreground.white },
    totalUnit: { fontFamily: FONTS.regular, fontSize: 11, color: theme.foreground.gray, marginTop: 2 },
    totalDivider: { width: 1, height: 30, backgroundColor: theme.background.accent },

    // ── Bottom Sheet ─────────────────────────────
    sheetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingBottom: 10 },
    sheetTitle: { fontFamily: FONTS.bold, fontSize: 18, color: theme.foreground.white },
    sheetSearchBar: { flexDirection: "row", alignItems: "center", backgroundColor: theme.background.darker, marginHorizontal: 20, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, gap: 8, marginBottom: 8 },
    sheetSearchInput: { flex: 1, fontFamily: FONTS.regular, fontSize: 14, color: theme.foreground.white, padding: 0 },

    quickAddLink: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 10 },
    quickAddLinkText: { fontFamily: FONTS.semiBold, fontSize: 13, color: theme.primary.main },

    sectionLabel: { fontFamily: FONTS.bold, fontSize: 14, color: theme.foreground.white, marginTop: 8, marginBottom: 10 },
    popularChips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
    popularChip: { backgroundColor: theme.background.darker, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: theme.background.accent },
    popularChipText: { fontFamily: FONTS.semiBold, fontSize: 12, color: theme.foreground.white, textTransform: "capitalize" },

    searchStatus: { fontFamily: FONTS.regular, fontSize: 14, color: theme.foreground.gray, textAlign: "center", paddingVertical: 30 },

    resultRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.background.accent },
    resultInfo: { flex: 1 },
    resultName: { fontFamily: FONTS.semiBold, fontSize: 14, color: theme.foreground.white },
    resultBrand: { fontFamily: FONTS.regular, fontSize: 11, color: theme.foreground.gray, marginTop: 2 },
    resultMacros: { fontFamily: FONTS.regular, fontSize: 11, color: theme.foreground.gray, marginTop: 2 },
    resultCals: { alignItems: "center", marginLeft: 10 },
    resultCalsValue: { fontFamily: FONTS.bold, fontSize: 16, color: theme.foreground.white },
    resultCalsUnit: { fontFamily: FONTS.regular, fontSize: 10, color: theme.foreground.gray },

    // ── Quick Add Sheet ──────────────────────────
    quickAddContent: { paddingHorizontal: 20 },
    quickAddInput: { backgroundColor: theme.background.dark, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, fontFamily: FONTS.regular, color: theme.foreground.white, borderWidth: 1, borderColor: theme.background.accent, marginTop: 14, marginBottom: 12 },
    quickAddRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
    quickAddField: { flex: 1 },
    quickAddLabel: { fontFamily: FONTS.semiBold, fontSize: 10, color: theme.foreground.gray, marginBottom: 4, textTransform: "uppercase" },
    quickAddNumInput: { backgroundColor: theme.background.dark, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 10, fontSize: 14, fontFamily: FONTS.bold, color: theme.foreground.white, textAlign: "center", borderWidth: 1, borderColor: theme.background.accent },
    quickAddButtons: { flexDirection: "row", gap: 10 },
    quickAddCancel: { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: theme.background.accent, alignItems: "center" },
    quickAddCancelText: { fontFamily: FONTS.semiBold, fontSize: 14, color: theme.foreground.white },
    quickAddSave: { flex: 2, paddingVertical: 14, borderRadius: 14, alignItems: "center" },
    quickAddSaveText: { fontFamily: FONTS.bold, fontSize: 14, color: "#fff" },
  });
}

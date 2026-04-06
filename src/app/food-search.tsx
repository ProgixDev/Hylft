import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { FONTS } from "../constants/fonts";
import { Theme } from "../constants/themes";
import { useNutrition } from "../contexts/NutritionContext";
import { useTheme } from "../contexts/ThemeContext";
import type { FoodItem, MealType } from "../services/nutritionApi";
import { NutritionApi } from "../services/nutritionApi";

const VALID_MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

// One default search per meal type (avoids rate-limiting)
const DEFAULT_QUERY: Record<string, Record<MealType, string>> = {
  fr: {
    breakfast: "céréales petit déjeuner",
    lunch: "plat cuisiné",
    dinner: "soupe légumes",
    snack: "biscuit fruit",
  },
  en: {
    breakfast: "breakfast cereal",
    lunch: "chicken meal",
    dinner: "soup vegetable",
    snack: "snack bar fruit",
  },
};

export default function FoodSearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mealType?: string }>();
  const { theme } = useTheme();
  const { i18n } = useTranslation();
  const { addMeal } = useNutrition();
  const styles = createStyles(theme);
  const lang = i18n.language?.startsWith("fr") ? "fr" as const : "en" as const;
  const isFr = lang === "fr";

  const mealLabels: Record<MealType, string> = isFr
    ? { breakfast: "Petit déjeuner", lunch: "Déjeuner", dinner: "Dîner", snack: "Collation" }
    : { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner", snack: "Snack" };

  // Get meal type from params
  const selectedMealType: MealType = (() => {
    const rawMeal = Array.isArray(params.mealType)
      ? params.mealType[0]
      : params.mealType;
    return VALID_MEAL_TYPES.includes(rawMeal as MealType)
      ? (rawMeal as MealType)
      : "breakfast";
  })();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoodItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  // Load default foods on mount
  useEffect(() => {
    loadDefaultFoods();
  }, []);

  const loadDefaultFoods = async () => {
    setIsLoading(true);
    try {
      const langKey = lang === "fr" ? "fr" : "en";
      const q = DEFAULT_QUERY[langKey][selectedMealType];
      const items = await NutritionApi.searchFood(q, lang);
      setResults(items.slice(0, 12));
    } catch (error) {
      console.error("[Food Search] Failed to load defaults:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const items = await NutritionApi.searchFood(query, lang);
      setResults(items);
    } catch (error) {
      console.error("[Food Search] Search failed:", error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  const handleAddFood = async (food: FoodItem) => {
    const today = new Date().toISOString().split("T")[0];

    try {
      await addMeal({
        date: today,
        mealType: selectedMealType,
        foodId: food.id,
        foodName: food.name,
        servings: 1,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
      });

      // Mark as added but stay on screen to add more
      setAddedIds((prev) => new Set(prev).add(food.id));
      console.log(`[Food Search] Added "${food.name}" to ${selectedMealType}`);
    } catch (error) {
      console.error("[Food Search] Failed to add meal:", error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.foreground.white} />
        </Pressable>
        <Text style={styles.title}>{isFr ? "Rechercher" : "Search Food"}</Text>
        {addedIds.size > 0 ? (
          <Pressable style={styles.doneBtn} onPress={() => router.back()}>
            <Text style={styles.doneBtnText}>{addedIds.size} {isFr ? "ajouté(s)" : "added"}</Text>
            <Ionicons name="checkmark" size={16} color="#fff" />
          </Pressable>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {/* Meal Info */}
      <Text style={styles.mealInfo}>
        {isFr ? "Ajouter à : " : "Adding to: "}
        <Text style={styles.mealType}>{mealLabels[selectedMealType]}</Text>
      </Text>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={isFr ? "Rechercher un aliment (poulet, riz, oeuf...)" : "Search food (chicken, rice, egg...)"}
          placeholderTextColor={theme.foreground.gray}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          onSubmitEditing={handleSearch}
        />
        <Pressable
          style={[styles.searchBtn, isSearching && styles.searchBtnDisabled]}
          onPress={handleSearch}
          disabled={isSearching}
        >
          {isSearching ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Ionicons name="search" size={20} color="#fff" />
          )}
        </Pressable>
      </View>

      {/* Results */}
      {isLoading && results.length === 0 ? (
        <View style={styles.loadingState}>
          <ActivityIndicator color={theme.primary.main} size="large" />
          <Text style={styles.loadingText}>{isFr ? "Chargement des aliments..." : "Loading popular foods..."}</Text>
        </View>
      ) : results.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="close-circle" size={48} color={theme.foreground.gray} />
          <Text style={styles.emptyText}>{isFr ? "Aucun aliment trouvé" : "No foods found"}</Text>
          <Text style={styles.emptySubtext}>{isFr ? "Essayez un autre terme de recherche" : "Try searching for a different food"}</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          numColumns={1}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.foodCard}>
              <View style={styles.foodInfo}>
                <Text style={styles.foodName} numberOfLines={2}>
                  {item.name}
                </Text>
                <View style={styles.nutritionRow}>
                  <Text style={styles.caloriesText}>
                    {Math.round(item.calories)} kcal
                  </Text>
                </View>
                <View style={styles.macrosContainer}>
                  <View style={styles.macroItem}>
                    <Text style={styles.macroLabel}>{isFr ? "Prot." : "Protein"}</Text>
                    <Text style={styles.macroValue}>{item.protein.toFixed(1)}g</Text>
                  </View>
                  <View style={styles.macroItem}>
                    <Text style={styles.macroLabel}>{isFr ? "Gluc." : "Carbs"}</Text>
                    <Text style={styles.macroValue}>{item.carbs.toFixed(1)}g</Text>
                  </View>
                  <View style={styles.macroItem}>
                    <Text style={styles.macroLabel}>{isFr ? "Lip." : "Fat"}</Text>
                    <Text style={styles.macroValue}>{item.fat.toFixed(1)}g</Text>
                  </View>
                </View>
                <Text style={styles.serveNote}>{isFr ? "Pour 100g" : "Per 100g serving"}</Text>
              </View>

              <Pressable
                style={[styles.addBtn, addedIds.has(item.id) && styles.addBtnDone]}
                onPress={() => handleAddFood(item)}
              >
                <Ionicons name={addedIds.has(item.id) ? "checkmark" : "add"} size={28} color="#fff" />
              </Pressable>
            </View>
          )}
        />
      )}
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background.dark,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: theme.background.accent,
    },
    backBtn: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      fontFamily: FONTS.bold,
      fontSize: 18,
      color: theme.foreground.white,
      fontWeight: "700",
    },
    mealInfo: {
      fontFamily: FONTS.regular,
      fontSize: 12,
      color: theme.foreground.gray,
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 4,
    },
    mealType: {
      fontFamily: FONTS.bold,
      color: theme.primary.main,
      fontSize: 13,
    },
    searchContainer: {
      flexDirection: "row",
      gap: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    searchInput: {
      flex: 1,
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: theme.background.accent,
      backgroundColor: theme.background.darker,
      color: theme.foreground.white,
      fontFamily: FONTS.regular,
      fontSize: 14,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    searchBtn: {
      width: 48,
      height: 48,
      borderRadius: 10,
      backgroundColor: theme.primary.main,
      alignItems: "center",
      justifyContent: "center",
    },
    searchBtnDisabled: {
      opacity: 0.6,
    },
    emptyState: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 20,
    },
    emptyText: {
      fontFamily: FONTS.semiBold,
      fontSize: 16,
      color: theme.foreground.white,
      marginTop: 16,
      textAlign: "center",
    },
    emptySubtext: {
      fontFamily: FONTS.regular,
      fontSize: 13,
      color: theme.foreground.gray,
      marginTop: 8,
      textAlign: "center",
    },
    loadingState: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    loadingText: {
      fontFamily: FONTS.regular,
      fontSize: 14,
      color: theme.foreground.gray,
      marginTop: 12,
    },
    listContent: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 10,
      paddingBottom: 20,
    },
    foodCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.background.darker,
      borderWidth: 1,
      borderColor: theme.background.accent,
      borderRadius: 12,
      padding: 12,
      gap: 12,
      minHeight: 140,
    },
    foodInfo: {
      flex: 1,
      gap: 6,
    },
    foodName: {
      fontFamily: FONTS.bold,
      fontSize: 15,
      color: theme.foreground.white,
      fontWeight: "600",
      lineHeight: 18,
    },
    nutritionRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    caloriesText: {
      fontFamily: FONTS.semiBold,
      fontSize: 13,
      color: theme.primary.main,
      fontWeight: "700",
    },
    macrosContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 6,
    },
    macroItem: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 4,
      paddingHorizontal: 6,
      borderRadius: 6,
      backgroundColor: `${theme.primary.main}15`,
    },
    macroLabel: {
      fontFamily: FONTS.regular,
      fontSize: 9,
      color: theme.foreground.gray,
      textTransform: "uppercase",
    },
    macroValue: {
      fontFamily: FONTS.bold,
      fontSize: 12,
      color: theme.primary.main,
      fontWeight: "700",
    },
    serveNote: {
      fontFamily: FONTS.regular,
      fontSize: 10,
      color: theme.foreground.gray,
      fontStyle: "italic",
    },
    addBtn: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: theme.primary.main,
      alignItems: "center",
      justifyContent: "center",
    },
    addBtnDone: {
      backgroundColor: "#34C759",
    },
    doneBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: "#34C759",
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 14,
    },
    doneBtnText: {
      fontFamily: FONTS.bold,
      fontSize: 13,
      color: "#fff",
    },
  });
}

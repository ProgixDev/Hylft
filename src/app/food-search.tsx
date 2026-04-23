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
import { api } from "../services/api";
import type { FoodItem, MealType } from "../services/nutritionApi";

const VALID_MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

const AVATAR_COLORS = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#F7DC6F", "#DDA0DD", "#FFB347", "#87CEEB"];
const getAvatarColor = (name: string) => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

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
  const params = useLocalSearchParams<{ mealType?: string; date?: string }>();
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
      const items: FoodItem[] = await api.searchFood(q, lang);
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
      const items: FoodItem[] = await api.searchFood(query, lang);
      setResults(items);
    } catch (error) {
      console.error("[Food Search] Search failed:", error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  const targetDate = (() => {
    const raw = Array.isArray(params.date) ? params.date[0] : params.date;
    return raw && /^\d{4}-\d{2}-\d{2}$/.test(raw)
      ? raw
      : new Date().toISOString().split("T")[0];
  })();

  const handleAddFood = async (food: FoodItem) => {
    try {
      await addMeal({
        date: targetDate,
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
          renderItem={({ item }) => {
            const isAdded = addedIds.has(item.id);
            const avatarColor = getAvatarColor(item.name);
            return (
              <View style={[styles.foodCard, isAdded && styles.foodCardDone]}>
                <View style={[styles.foodAvatar, { backgroundColor: avatarColor + "22" }]}>
                  <Text style={[styles.foodAvatarText, { color: avatarColor }]}>
                    {item.name.charAt(0).toUpperCase()}
                  </Text>
                </View>

                <View style={styles.foodInfo}>
                  <Text style={styles.foodName} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <View style={styles.calorieRow}>
                    <View style={styles.caloriePill}>
                      <Text style={styles.calorieValue}>{Math.round(item.calories)}</Text>
                      <Text style={styles.calorieUnit}>kcal</Text>
                    </View>
                    <Text style={styles.servingDot}>·</Text>
                    <Text style={styles.serveNote}>100g</Text>
                  </View>
                  <View style={styles.macroRow}>
                    <View style={[styles.macroDot, { backgroundColor: "#3B82F6" }]} />
                    <Text style={styles.macroText}>P {item.protein.toFixed(1)}g</Text>
                    <View style={[styles.macroDot, { backgroundColor: "#F59E0B" }]} />
                    <Text style={styles.macroText}>C {item.carbs.toFixed(1)}g</Text>
                    <View style={[styles.macroDot, { backgroundColor: "#EF4444" }]} />
                    <Text style={styles.macroText}>F {item.fat.toFixed(1)}g</Text>
                  </View>
                </View>

                <Pressable
                  style={[styles.addBtn, isAdded && styles.addBtnDone]}
                  onPress={() => handleAddFood(item)}
                >
                  <Ionicons name={isAdded ? "checkmark" : "add"} size={22} color="#fff" />
                </Pressable>
              </View>
            );
          }}
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
      borderRadius: 14,
      padding: 12,
      gap: 12,
    },
    foodCardDone: {
      borderColor: "#34C75930",
      backgroundColor: theme.background.darker,
    },
    foodAvatar: {
      width: 50,
      height: 50,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    foodAvatarText: {
      fontFamily: FONTS.bold,
      fontSize: 22,
      fontWeight: "700",
    },
    foodInfo: {
      flex: 1,
      gap: 5,
    },
    foodName: {
      fontFamily: FONTS.bold,
      fontSize: 14,
      color: theme.foreground.white,
      lineHeight: 18,
    },
    calorieRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    caloriePill: {
      flexDirection: "row",
      alignItems: "baseline",
      gap: 2,
      backgroundColor: `${theme.primary.main}18`,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 20,
    },
    calorieValue: {
      fontFamily: FONTS.bold,
      fontSize: 13,
      color: theme.primary.main,
      fontWeight: "700",
    },
    calorieUnit: {
      fontFamily: FONTS.regular,
      fontSize: 10,
      color: theme.primary.main,
    },
    servingDot: {
      fontSize: 12,
      color: theme.foreground.gray,
    },
    serveNote: {
      fontFamily: FONTS.regular,
      fontSize: 11,
      color: theme.foreground.gray,
    },
    macroRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      flexWrap: "wrap",
    },
    macroDot: {
      width: 5,
      height: 5,
      borderRadius: 3,
    },
    macroText: {
      fontFamily: FONTS.regular,
      fontSize: 11,
      color: theme.foreground.gray,
      marginRight: 3,
    },
    addBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.primary.main,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
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

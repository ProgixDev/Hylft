import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    FlatList,
    Image,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { FoodCardSkeletonList } from "../components/ui/FoodCardSkeleton";
import { FONTS } from "../constants/fonts";
import { Theme } from "../constants/themes";
import { useNutrition } from "../contexts/NutritionContext";
import { useTheme } from "../contexts/ThemeContext";
import { TutorialTarget } from "../contexts/TutorialTargetContext";
import { api } from "../services/api";
import {
    bumpCachedHistory,
    loadCachedHistory,
    saveCachedHistory,
} from "../services/foodHistoryCache";
import type {
    FoodHistoryItem,
    FoodItem,
    FoodSearchResponse,
    MealType,
} from "../services/nutritionApi";

const VALID_MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner", "snack"];
const PAGE_SIZE = 20;

const AVATAR_COLORS = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#F7DC6F", "#DDA0DD", "#FFB347", "#87CEEB"];
const getAvatarColor = (name: string) =>
  AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length];

const DEFAULT_QUERY: Record<"fr" | "en", Record<MealType, string>> = {
  fr: {
    breakfast: "céréales petit déjeuner",
    lunch: "poulet riz",
    dinner: "soupe légumes",
    snack: "barre fruits",
  },
  en: {
    breakfast: "breakfast cereal",
    lunch: "chicken rice",
    dinner: "soup vegetable",
    snack: "snack bar fruit",
  },
};

export default function FoodSearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mealType?: string; date?: string }>();
  const { theme } = useTheme();
  const { t, i18n } = useTranslation();
  const { addMeal } = useNutrition();
  const styles = createStyles(theme);
  const lang = i18n.language?.startsWith("fr") ? ("fr" as const) : ("en" as const);
  const isFr = lang === "fr";

  const mealLabels: Record<MealType, string> = isFr
    ? { breakfast: "Petit déjeuner", lunch: "Déjeuner", dinner: "Dîner", snack: "Collation" }
    : { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner", snack: "Snack" };

  const selectedMealType: MealType = (() => {
    const rawMeal = Array.isArray(params.mealType) ? params.mealType[0] : params.mealType;
    return VALID_MEAL_TYPES.includes(rawMeal as MealType)
      ? (rawMeal as MealType)
      : "breakfast";
  })();

  const targetDate = (() => {
    const raw = Array.isArray(params.date) ? params.date[0] : params.date;
    return raw && /^\d{4}-\d{2}-\d{2}$/.test(raw)
      ? raw
      : new Date().toISOString().split("T")[0];
  })();

  const [query, setQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [items, setItems] = useState<FoodItem[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [history, setHistory] = useState<FoodHistoryItem[]>([]);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const requestIdRef = useRef(0);

  // Initial load: history (cached → server) + default search results.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const cached = await loadCachedHistory();
      if (!cancelled && cached.length > 0) setHistory(cached);

      api
        .getFoodHistory(20)
        .then((server: FoodHistoryItem[] | undefined) => {
          if (cancelled) return;
          if (!Array.isArray(server)) return;
          setHistory(server);
          saveCachedHistory(server);
        })
        .catch(() => {
          /* offline / unauthenticated / route not yet deployed: keep cached */
        });
    })();
    runSearch(DEFAULT_QUERY[lang][selectedMealType], 0);
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runSearch = useCallback(
    async (q: string, nextPage: number) => {
      const requestId = ++requestIdRef.current;
      const isFirstPage = nextPage === 0;

      if (isFirstPage) setIsLoading(true);
      else setIsLoadingMore(true);

      try {
        const raw = await api.searchFood(q, lang, nextPage, PAGE_SIZE);
        if (requestId !== requestIdRef.current) return; // stale

        // Tolerate both new ({items,hasMore,nextPage}) and legacy (FoodItem[])
        // server response shapes so the screen doesn't crash mid-deploy.
        const res: FoodSearchResponse = Array.isArray(raw)
          ? { items: raw, hasMore: false, nextPage: null }
          : {
              items: Array.isArray(raw?.items) ? raw.items : [],
              hasMore: Boolean(raw?.hasMore),
              nextPage: raw?.nextPage ?? null,
            };

        setActiveQuery(q);
        setPage(nextPage);
        setHasMore(res.hasMore);
        setItems((prev) => {
          if (isFirstPage) return res.items;
          // dedupe by id — FatSecret can repeat across pages occasionally.
          const seen = new Set(prev.map((it) => it.id));
          return [...prev, ...res.items.filter((it) => !seen.has(it.id))];
        });
      } catch (error) {
        console.error("[Food Search] Search failed:", error);
        if (requestId === requestIdRef.current && isFirstPage) {
          setItems([]);
          setHasMore(false);
        }
      } finally {
        if (requestId === requestIdRef.current) {
          if (isFirstPage) setIsLoading(false);
          else setIsLoadingMore(false);
        }
      }
    },
    [lang],
  );

  const handleSearch = () => {
    const trimmed = query.trim();
    if (!trimmed) {
      runSearch(DEFAULT_QUERY[lang][selectedMealType], 0);
      return;
    }
    runSearch(trimmed, 0);
  };

  const handleEndReached = () => {
    if (isLoading || isLoadingMore || !hasMore || !activeQuery) return;
    runSearch(activeQuery, page + 1);
  };

  const handleAddFood = async (food: FoodItem) => {
    setAddedIds((prev) => new Set(prev).add(food.id));
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

      // Optimistic local cache + fire-and-forget server record.
      const next = await bumpCachedHistory(food);
      setHistory(next);
      api
        .recordFoodSelection({
          food_id: food.id,
          food_name: food.name,
          image_url: food.imageUrl,
          calories: food.calories,
          protein: food.protein,
          carbs: food.carbs,
          fat: food.fat,
        })
        .catch(() => {
          /* cached locally — server retry not critical */
        });
    } catch (error) {
      console.error("[Food Search] Failed to add meal:", error);
      setAddedIds((prev) => {
        const next = new Set(prev);
        next.delete(food.id);
        return next;
      });
    }
  };

  const showHistorySection = !query.trim() && history.length > 0;

  const renderFoodCard = (item: FoodItem) => {
    const isAdded = addedIds.has(item.id);
    const avatarColor = getAvatarColor(item.name || "?");
    return (
      <View style={[styles.foodCard, isAdded && styles.foodCardDone]}>
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.foodImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.foodAvatar, { backgroundColor: avatarColor + "22" }]}>
            <Text style={[styles.foodAvatarText, { color: avatarColor }]}>
              {(item.name || "?").charAt(0).toUpperCase()}
            </Text>
          </View>
        )}

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
  };

  const ListHeader = showHistorySection ? (
    <View>
      <Text style={styles.sectionTitle}>{isFr ? "Récents" : "Recent"}</Text>
      <View style={styles.historyList}>
        {history.slice(0, 8).map((item) => (
          <View key={`hist-${item.id}`}>{renderFoodCard(item)}</View>
        ))}
      </View>
      <Text style={[styles.sectionTitle, { marginTop: 18 }]}>
        {isFr ? "Suggestions" : "Suggestions"}
      </Text>
    </View>
  ) : null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.foreground.white} />
        </Pressable>
        <Text style={styles.title}>{isFr ? "Rechercher" : "Search Food"}</Text>
        {addedIds.size > 0 ? (
          <Pressable style={styles.doneBtn} onPress={() => router.back()}>
            <Text style={styles.doneBtnText}>
              {addedIds.size} {isFr ? "ajouté(s)" : "added"}
            </Text>
            <Ionicons name="checkmark" size={16} color="#fff" />
          </Pressable>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      <Text style={styles.mealInfo}>
        {isFr ? "Ajouter à : " : "Adding to: "}
        <Text style={styles.mealType}>{mealLabels[selectedMealType]}</Text>
      </Text>

      <View style={styles.searchContainer}>
        <TutorialTarget id="foodSearch.searchInput" style={styles.searchInputTarget}>
          <TextInput
            style={styles.searchInput}
            placeholder={
              isFr
                ? "Rechercher un aliment (poulet, riz, oeuf...)"
                : "Search food (chicken, rice, egg...)"
            }
            placeholderTextColor={theme.foreground.gray}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
          />
        </TutorialTarget>
        <TutorialTarget id="foodSearch.searchButton">
          <Pressable
            style={[styles.searchBtn, isLoading && styles.searchBtnDisabled]}
            onPress={handleSearch}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Ionicons name="search" size={20} color="#fff" />
            )}
          </Pressable>
        </TutorialTarget>
      </View>

      {isLoading && items.length === 0 ? (
        <FoodCardSkeletonList count={6} />
      ) : items.length === 0 && !showHistorySection ? (
        <View style={styles.emptyState}>
          <Ionicons name="close-circle" size={48} color={theme.foreground.gray} />
          <Text style={styles.emptyText}>
            {isFr ? "Aucun aliment trouvé" : "No foods found"}
          </Text>
          <Text style={styles.emptySubtext}>
            {isFr ? "Essayez un autre terme de recherche" : "Try searching for a different food"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          numColumns={1}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={ListHeader}
          renderItem={({ item }) => renderFoodCard(item)}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.6}
          ListFooterComponent={
            isLoadingMore ? (
              <View style={{ paddingVertical: 8 }}>
                <FoodCardSkeletonList count={2} />
              </View>
            ) : null
          }
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
    searchInputTarget: {
      flex: 1,
    },
    searchInput: {
      width: "100%",
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
    sectionTitle: {
      fontFamily: FONTS.bold,
      fontSize: 13,
      color: theme.foreground.gray,
      textTransform: "uppercase",
      letterSpacing: 0.6,
      marginBottom: 8,
      marginTop: 2,
    },
    historyList: {
      gap: 10,
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
    foodImage: {
      width: 50,
      height: 50,
      borderRadius: 12,
      flexShrink: 0,
      backgroundColor: theme.background.accent,
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

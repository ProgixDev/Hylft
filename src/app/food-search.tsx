import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { FoodCardSkeletonList } from "../components/ui/FoodCardSkeleton";
import FoodDetailSheet from "../components/ui/FoodDetailSheet";
import { FONTS } from "../constants/fonts";
import { Theme } from "../constants/themes";
import { useAuth } from "../contexts/AuthContext";
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

const AVATAR_COLORS = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#F7DC6F",
  "#DDA0DD",
  "#FFB347",
  "#87CEEB",
];
const getAvatarColor = (name: string) =>
  AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length];

// OFF supports localized search via lc=fr/en, so we use language-specific
// defaults that bias toward foods relevant to the meal type.
const DEFAULT_QUERY: Record<"fr" | "en", Record<MealType, string>> = {
  fr: {
    breakfast: "céréales",
    lunch: "poulet",
    dinner: "saumon",
    snack: "amandes",
  },
  en: {
    breakfast: "oats",
    lunch: "chicken",
    dinner: "salmon",
    snack: "almonds",
  },
};

export default function FoodSearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mealType?: string; date?: string }>();
  const { theme } = useTheme();
  const { t, i18n } = useTranslation();
  const { addMeal } = useNutrition();
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const styles = createStyles(theme);
  const lang = i18n.language?.startsWith("fr")
    ? ("fr" as const)
    : ("en" as const);
  const isFr = lang === "fr";

  const mealLabels: Record<MealType, string> = isFr
    ? {
        breakfast: "Petit déjeuner",
        lunch: "Déjeuner",
        dinner: "Dîner",
        snack: "Collation",
      }
    : {
        breakfast: "Breakfast",
        lunch: "Lunch",
        dinner: "Dinner",
        snack: "Snack",
      };

  const selectedMealType: MealType = (() => {
    const rawMeal = Array.isArray(params.mealType)
      ? params.mealType[0]
      : params.mealType;
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
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const requestIdRef = useRef(0);

  // Initial load: history (cached → server) + default search results.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const cached = await loadCachedHistory(userId);
      if (!cancelled && cached.length > 0) setHistory(cached);

      api
        .getFoodHistory(20)
        .then((server: FoodHistoryItem[] | undefined) => {
          if (cancelled) return;
          if (!Array.isArray(server)) return;
          setHistory(server);
          saveCachedHistory(server, userId);
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
          // dedupe by id — Spoonacular can repeat across pages occasionally.
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

  const handleAddFood = async (food: FoodItem, servings: number = 1) => {
    setAddedIds((prev) => new Set(prev).add(food.id));
    try {
      await addMeal({
        date: targetDate,
        mealType: selectedMealType,
        foodId: food.id,
        foodName: food.name,
        imageUrl: food.imageUrl,
        servings,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
      });

      // Optimistic local cache + fire-and-forget server record.
      const next = await bumpCachedHistory(food, userId);
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

  const hasMacros = (item: FoodItem) =>
    item.calories > 0 || item.protein > 0 || item.carbs > 0 || item.fat > 0;

  const renderFoodCard = (item: FoodItem) => {
    const isAdded = addedIds.has(item.id);
    const avatarColor = getAvatarColor(item.name || "?");
    const showMacros = hasMacros(item);
    return (
      <Pressable
        style={({ pressed }) => [
          styles.foodCard,
          isAdded && styles.foodCardDone,
          pressed && { transform: [{ scale: 0.985 }], opacity: 0.92 },
        ]}
        onPress={() => setSelectedFood(item)}
      >
        <View style={styles.foodImageWrap}>
          {item.imageUrl ? (
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.foodImage}
              resizeMode="cover"
            />
          ) : (
            <View
              style={[
                styles.foodImage,
                styles.foodAvatar,
                { backgroundColor: avatarColor + "33" },
              ]}
            >
              <Text style={[styles.foodAvatarText, { color: avatarColor }]}>
                {(item.name || "?").charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.55)"]}
            style={styles.foodImageOverlay}
            pointerEvents="none"
          />
          {showMacros && (
            <View style={styles.foodCalBadge}>
              <Text style={styles.foodCalBadgeValue}>
                {Math.round(item.calories)}
              </Text>
              <Text style={styles.foodCalBadgeUnit}>kcal</Text>
            </View>
          )}
        </View>

        <View style={styles.foodInfo}>
          <Text style={styles.foodName} numberOfLines={2}>
            {item.name}
          </Text>
          {showMacros ? (
            <>
              <Text style={styles.foodPer100}>
                {isFr ? "pour 100g" : "per 100g"}
              </Text>
              <View style={styles.macroRow}>
                <View style={styles.macroChip}>
                  <Text style={styles.macroChipLabel}>
                    {isFr ? "Prot" : "Prot"}
                  </Text>
                  <Text style={styles.macroChipText}>
                    {item.protein.toFixed(0)}g
                  </Text>
                </View>
                <View style={styles.macroChip}>
                  <Text style={styles.macroChipLabel}>
                    {isFr ? "Gluc" : "Carb"}
                  </Text>
                  <Text style={styles.macroChipText}>
                    {item.carbs.toFixed(0)}g
                  </Text>
                </View>
                <View style={styles.macroChip}>
                  <Text style={styles.macroChipLabel}>
                    {isFr ? "Lip" : "Fat"}
                  </Text>
                  <Text style={styles.macroChipText}>
                    {item.fat.toFixed(0)}g
                  </Text>
                </View>
              </View>
            </>
          ) : (
            <Text style={styles.tapHint}>
              {isFr ? "Toucher pour voir les détails" : "Tap to view details"}
            </Text>
          )}
        </View>

        <View style={styles.actionWrap}>
          {isAdded ? (
            <View style={styles.addBtnDone}>
              <Ionicons name="checkmark" size={20} color="#fff" />
            </View>
          ) : (
            <View style={styles.addBtn}>
              <Ionicons name="add" size={22} color="#fff" />
            </View>
          )}
        </View>
      </Pressable>
    );
  };

  const renderHistoryChip = (item: FoodHistoryItem) => {
    const isAdded = addedIds.has(item.id);
    const avatarColor = getAvatarColor(item.name || "?");
    return (
      <Pressable
        key={`hist-${item.id}`}
        style={({ pressed }) => [
          styles.historyChip,
          pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
        ]}
        onPress={() => setSelectedFood(item)}
      >
        <View style={styles.historyImageWrap}>
          {item.imageUrl ? (
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.historyImage}
              resizeMode="cover"
            />
          ) : (
            <View
              style={[
                styles.historyImage,
                {
                  backgroundColor: avatarColor + "33",
                  alignItems: "center",
                  justifyContent: "center",
                },
              ]}
            >
              <Text
                style={[styles.historyAvatarLetter, { color: avatarColor }]}
              >
                {(item.name || "?").charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.7)"]}
            style={styles.historyImageOverlay}
            pointerEvents="none"
          />
          <View style={styles.historyCalPill}>
            <Text style={styles.historyCalText}>
              {Math.round(item.calories)}
            </Text>
          </View>
          {isAdded && (
            <View style={styles.historyAddedBadge}>
              <Ionicons name="checkmark" size={12} color="#fff" />
            </View>
          )}
        </View>
        <Text style={styles.historyName} numberOfLines={2}>
          {item.name}
        </Text>
      </Pressable>
    );
  };

  const ListHeader = showHistorySection ? (
    <View style={styles.historyHeaderWrap}>
      <Text style={styles.sectionTitle}>{isFr ? "Récents" : "Recent"}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.historyScrollContent}
      >
        {history.slice(0, 12).map(renderHistoryChip)}
      </ScrollView>
      <Text style={[styles.sectionTitle, { marginTop: 18 }]}>
        {isFr ? "Suggestions" : "Suggestions"}
      </Text>
    </View>
  ) : null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons
            name="arrow-back"
            size={24}
            color={theme.foreground.white}
          />
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
        <TutorialTarget
          id="foodSearch.searchInput"
          style={styles.searchInputTarget}
        >
          <TextInput
            style={styles.searchInput}
            placeholder={
              isFr
                ? "Rechercher en anglais (chicken, rice, milk...)"
                : "Search food (chicken, rice, milk...)"
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
          <Ionicons
            name="close-circle"
            size={48}
            color={theme.foreground.gray}
          />
          <Text style={styles.emptyText}>
            {isFr ? "Aucun aliment trouvé" : "No foods found"}
          </Text>
          <Text style={styles.emptySubtext}>
            {isFr
              ? "Essayez un autre terme de recherche"
              : "Try searching for a different food"}
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

      <FoodDetailSheet
        visible={!!selectedFood}
        food={selectedFood}
        mealLabel={selectedFood ? mealLabels[selectedMealType] : ""}
        isFr={isFr}
        isAdded={selectedFood ? addedIds.has(selectedFood.id) : false}
        onClose={() => setSelectedFood(null)}
        onAdd={(food, servings) => {
          setSelectedFood(null);
          handleAddFood(food, servings);
        }}
      />
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
      paddingHorizontal: 16,
    },
    historyHeaderWrap: {
      marginBottom: 4,
      paddingTop: 6,
    },
    historyScrollContent: {
      gap: 12,
      paddingHorizontal: 16,
      paddingBottom: 4,
    },
    historyChip: {
      width: 110,
      gap: 6,
    },
    historyImageWrap: {
      position: "relative",
      width: 110,
      height: 110,
      borderRadius: 14,
      overflow: "hidden",
      backgroundColor: theme.background.darker,
    },
    historyImage: {
      width: "100%",
      height: "100%",
    },
    historyImageOverlay: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      height: 60,
    },
    historyAvatarLetter: {
      fontFamily: FONTS.bold,
      fontSize: 44,
      fontWeight: "700",
    },
    historyCalPill: {
      position: "absolute",
      left: 6,
      bottom: 6,
      backgroundColor: "rgba(0,0,0,0.55)",
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 999,
    },
    historyCalText: {
      fontFamily: FONTS.bold,
      fontSize: 11,
      color: "#fff",
      fontWeight: "700",
    },
    historyAddedBadge: {
      position: "absolute",
      top: 6,
      right: 6,
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: "#34C759",
      alignItems: "center",
      justifyContent: "center",
    },
    historyName: {
      fontFamily: FONTS.semiBold,
      fontSize: 12,
      color: theme.foreground.white,
      lineHeight: 15,
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
      paddingVertical: 4,
      paddingBottom: 28,
    },
    foodCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.background.dark,
      paddingVertical: 12,
      paddingHorizontal: 16,
      gap: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: `${theme.foreground.gray}22`,
    },
    foodCardDone: {
      backgroundColor: `${"#34C759"}10`,
    },
    foodImageWrap: {
      width: 86,
      height: 86,
      borderRadius: 7,
      overflow: "hidden",
      position: "relative",
      flexShrink: 0,
      backgroundColor: theme.background.accent,
    },
    foodImage: {
      width: "100%",
      height: "100%",
    },
    foodImageOverlay: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      height: 48,
    },
    foodAvatar: {
      alignItems: "center",
      justifyContent: "center",
    },
    foodAvatarText: {
      fontFamily: FONTS.bold,
      fontSize: 36,
      fontWeight: "800",
    },
    foodCalBadge: {
      position: "absolute",
      left: 6,
      bottom: 6,
      flexDirection: "row",
      alignItems: "baseline",
      gap: 2,
      backgroundColor: "rgba(0,0,0,0.55)",
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 999,
    },
    foodCalBadgeValue: {
      fontFamily: FONTS.bold,
      fontSize: 12,
      color: "#fff",
      fontWeight: "800",
    },
    foodCalBadgeUnit: {
      fontFamily: FONTS.regular,
      fontSize: 9,
      color: "rgba(255,255,255,0.85)",
    },
    foodInfo: {
      flex: 1,
      gap: 6,
    },
    foodName: {
      fontFamily: FONTS.bold,
      fontSize: 15,
      color: theme.foreground.white,
      lineHeight: 19,
      letterSpacing: 0.1,
    },
    foodPer100: {
      fontFamily: FONTS.regular,
      fontSize: 10,
      color: theme.foreground.gray,
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    macroRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      flexWrap: "wrap",
      marginTop: 2,
    },
    macroChip: {
      flexDirection: "row",
      alignItems: "baseline",
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 999,
      backgroundColor: `${theme.primary.main}1F`,
    },
    macroChipLabel: {
      fontFamily: FONTS.regular,
      fontSize: 10,
      color: `${theme.primary.main}CC`,
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    macroChipText: {
      fontFamily: FONTS.bold,
      fontSize: 11,
      fontWeight: "700",
      color: theme.primary.main,
    },
    actionWrap: {
      flexShrink: 0,
    },
    addBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.primary.main,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: theme.primary.main,
      shadowOpacity: 0.5,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 3 },
      elevation: 4,
    },
    addBtnDone: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: "#34C759",
      alignItems: "center",
      justifyContent: "center",
    },
    tapHint: {
      fontFamily: FONTS.regular,
      fontSize: 11,
      color: theme.foreground.gray,
      fontStyle: "italic",
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

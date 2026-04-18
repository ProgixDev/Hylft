import { Ionicons } from "@expo/vector-icons";
import BottomSheet from "@gorhom/bottom-sheet";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import {
  Dimensions,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import ExploreRoutineFilterSheet from "../../components/ui/ExploreRoutineFilterSheet";
import { Theme } from "../../constants/themes";
import { useActiveWorkout } from "../../contexts/ActiveWorkoutContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useGenderedImages } from "../../hooks/useGenderedImages";
import {
  ExploreCategory,
  getExploreRoutines,
} from "../../services/exploreService";
import {
  translateRoutineName,
  translateApiData,
} from "../../utils/exerciseTranslator";
import { buildActiveWorkoutFromRoutine } from "../../utils/workoutBuilder";

import { FONTS } from "../../constants/fonts";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GRID_PADDING = 14;
const GRID_GAP = 12;
const CARD_WIDTH = (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP) / 2;

const cardShadow = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
  android: { elevation: 5 },
  default: {},
});

const diffColors: Record<string, string> = {
  beginner: "#4CAF50",
  intermediate: "#FF9800",
  advanced: "#F44336",
};

type DifficultyFilter = "All" | "beginner" | "intermediate" | "advanced";
type FilterTab = "difficulty" | "category";

export default function ExploreRoutines() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const router = useRouter();
  const { startWorkout } = useActiveWorkout();
  const genderedImages = useGenderedImages();
  const routineImages = genderedImages.routine;

  const filterSheetRef = useRef<BottomSheet>(null);

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<ExploreCategory | "All">(
    "All",
  );
  const [activeDifficulty, setActiveDifficulty] =
    useState<DifficultyFilter>("All");
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [activeFilterTab, setActiveFilterTab] =
    useState<FilterTab>("difficulty");

  const hasActiveFilters =
    activeDifficulty !== "All" || activeCategory !== "All";

  const activeFilterCount =
    (activeDifficulty !== "All" ? 1 : 0) + (activeCategory !== "All" ? 1 : 0);

  const handleClearFilters = () => {
    setActiveDifficulty("All");
    setActiveCategory("All");
  };

  const routines = useMemo(
    () =>
      getExploreRoutines({
        category: activeCategory,
        difficulty: activeDifficulty === "All" ? "All" : activeDifficulty,
        search,
      }),
    [activeCategory, activeDifficulty, search],
  );

  const handleStart = (routine: (typeof routines)[number]) => {
    startWorkout(buildActiveWorkoutFromRoutine(routine));
    router.navigate("/(tabs)/workout" as any);
  };

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={theme.foreground.white}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Explore Routines</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* ── Search ── */}
      <View style={styles.searchContainer}>
        <Ionicons
          name="search-outline"
          size={18}
          color={theme.foreground.gray}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search routines, muscles, tags…"
          placeholderTextColor={theme.foreground.gray}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Ionicons
              name="close-circle"
              size={18}
              color={theme.foreground.gray}
            />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Filter button bar ── */}
        <View style={styles.filterBar}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => {
              setFilterSheetOpen(true);
              filterSheetRef.current?.expand();
            }}
          >
            <Ionicons
              name="funnel-outline"
              size={18}
              color={theme.foreground.white}
            />
            <Text style={styles.filterButtonText}>Filters</Text>
            {hasActiveFilters && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Results count ── */}
        <Text style={styles.resultsCount}>
          {routines.length} routine{routines.length !== 1 ? "s" : ""}
        </Text>

        {/* ── Grid ── */}
        {routines.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="search-outline"
              size={40}
              color={theme.foreground.gray}
            />
            <Text style={styles.emptyTitle}>No routines found</Text>
            <Text style={styles.emptySubtitle}>
              Try adjusting your filters or search term.
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {routines.map((routine, i) => {
              const img = routineImages[i % routineImages.length];
              const diffColor =
                diffColors[routine.difficulty] ?? theme.primary.main;
              return (
                <Pressable
                  key={routine.id}
                  onPress={() =>
                    router.push(`/explore-routines/${routine.id}` as any)
                  }
                  onLongPress={() => handleStart(routine)}
                  style={({ pressed }) => [
                    styles.gridCard,
                    pressed && { opacity: 0.95, transform: [{ scale: 0.98 }] },
                  ]}
                >
                  <Image
                    source={img}
                    style={styles.gridCardImage}
                    resizeMode="cover"
                  />
                  <LinearGradient
                    colors={["transparent", "rgba(0,0,0,0.85)"]}
                    style={styles.gridCardGradient}
                  />
                  <View
                    style={[
                      styles.gridCardDiffBadge,
                      { backgroundColor: diffColor + "EE" },
                    ]}
                  >
                    <Text style={styles.gridCardDiffText}>
                      {translateApiData(routine.difficulty)}
                    </Text>
                  </View>
                  <View style={styles.gridCardContent}>
                    <Text style={styles.gridCardTitle} numberOfLines={2}>
                      {translateRoutineName(routine.name)}
                    </Text>
                    <View style={styles.gridCardMetaRow}>
                      <Ionicons
                        name="time-outline"
                        size={12}
                        color="rgba(255,255,255,0.85)"
                      />
                      <Text style={styles.gridCardMetaText}>
                        {routine.estimatedDuration} min
                      </Text>
                      <Text style={styles.gridCardMetaDot}>·</Text>
                      <Ionicons
                        name="barbell-outline"
                        size={12}
                        color="rgba(255,255,255,0.85)"
                      />
                      <Text style={styles.gridCardMetaText}>
                        {routine.exercises.length}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Filter Sheet */}
      <ExploreRoutineFilterSheet
        ref={filterSheetRef}
        isExpanded={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        activeTab={activeFilterTab}
        onTabChange={setActiveFilterTab}
        selectedDifficulty={activeDifficulty}
        onDifficultyChange={(d) => setActiveDifficulty(d || "All")}
        selectedCategory={activeCategory}
        onCategoryChange={(c) => setActiveCategory(c || "All")}
        hasActiveFilters={hasActiveFilters}
        onClearAll={handleClearFilters}
      />
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background.dark,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.background.darker,
    },
    backButton: {
      padding: 6,
      marginLeft: -6,
    },
    headerTitle: {
      fontSize: 17,
      fontFamily: FONTS.bold,
      color: theme.foreground.white,
    },
    // Search
    searchContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.background.darker,
      marginHorizontal: 14,
      marginTop: 8,
      marginBottom: 2,
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 7,
      borderWidth: 1,
      borderColor: theme.background.accent,
    },
    searchIcon: {
      marginRight: 6,
    },
    searchInput: {
      flex: 1,
      fontSize: 13,
      color: theme.foreground.white,
    },
    // Scroll
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 14,
      paddingBottom: 30,
    },
    // Filter bar
    filterBar: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      backgroundColor: theme.background.dark,
      borderBottomWidth: 1,
      borderBottomColor: theme.background.darker,
    },
    filterButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.background.darker,
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderWidth: 1,
      borderColor: theme.background.accent,
      gap: 6,
    },
    filterButtonText: {
      fontSize: 13,
      fontFamily: FONTS.semiBold,
      color: theme.foreground.white,
    },
    filterBadge: {
      marginLeft: "auto",
      backgroundColor: theme.primary.main,
      borderRadius: 9,
      width: 18,
      height: 18,
      alignItems: "center",
      justifyContent: "center",
    },
    filterBadgeText: {
      fontSize: 10,
      fontFamily: FONTS.bold,
      color: theme.background.dark,
    },
    // Results
    resultsCount: {
      fontSize: 11,
      color: theme.foreground.gray,
      paddingHorizontal: 14,
      paddingVertical: 8,
    },
    // Grid
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: GRID_GAP,
      paddingHorizontal: 0,
    },
    gridCard: {
      width: CARD_WIDTH,
      height: CARD_WIDTH * 1.3,
      borderRadius: 18,
      overflow: "hidden",
      backgroundColor: theme.background.darker,
      ...cardShadow,
    },
    gridCardImage: {
      position: "absolute",
      width: "100%",
      height: "100%",
    },
    gridCardGradient: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      height: "70%",
    },
    gridCardDiffBadge: {
      position: "absolute",
      top: 10,
      left: 10,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
    },
    gridCardDiffText: {
      fontSize: 9,
      fontFamily: FONTS.extraBold,
      color: "#fff",
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    gridCardContent: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      padding: 12,
      gap: 6,
    },
    gridCardTitle: {
      fontSize: 14,
      fontFamily: FONTS.extraBold,
      color: "#fff",
      lineHeight: 17,
    },
    gridCardMetaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    gridCardMetaText: {
      fontSize: 11,
      fontFamily: FONTS.semiBold,
      color: "rgba(255,255,255,0.85)",
    },
    gridCardMetaDot: {
      fontSize: 11,
      color: "rgba(255,255,255,0.5)",
      marginHorizontal: 2,
    },

    // Empty state
    emptyState: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 56,
      paddingHorizontal: 32,
      gap: 10,
    },
    emptyTitle: {
      fontSize: 15,
      fontFamily: FONTS.bold,
      color: theme.foreground.white,
    },
    emptySubtitle: {
      fontSize: 12,
      color: theme.foreground.gray,
      textAlign: "center",
      lineHeight: 18,
    },
  });

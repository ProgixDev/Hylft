import { Ionicons } from "@expo/vector-icons";
import BottomSheet from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import ExploreRoutineFilterSheet from "../../components/ui/ExploreRoutineFilterSheet";
import RoutineCard from "../../components/ui/RoutineCard";
import { Theme } from "../../constants/themes";
import { useActiveWorkout } from "../../contexts/ActiveWorkoutContext";
import { useTheme } from "../../contexts/ThemeContext";
import {
  ExploreCategory,
  getExploreRoutines,
} from "../../services/exploreService";
import { buildActiveWorkoutFromRoutine } from "../../utils/workoutBuilder";

import { FONTS } from "../../constants/fonts";

type DifficultyFilter = "All" | "beginner" | "intermediate" | "advanced";
type FilterTab = "difficulty" | "category";

export default function ExploreRoutines() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const router = useRouter();
  const { startWorkout } = useActiveWorkout();

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

        {/* ── List ── */}
        {routines.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="search-outline"
              size={56}
              color={theme.foreground.gray}
            />
            <Text style={styles.emptyTitle}>No routines found</Text>
            <Text style={styles.emptySubtitle}>
              Try adjusting your filters or search term.
            </Text>
          </View>
        ) : (
          routines.map((routine) => (
            <RoutineCard
              key={routine.id}
              routine={routine}
              fullWidth
              onPress={() =>
                router.push(`/explore-routines/${routine.id}` as any)
              }
              onStart={() => handleStart(routine)}
            />
          ))
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
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.background.darker,
    },
    backButton: {
      padding: 8,
      marginLeft: -8,
    },
    headerTitle: {
      fontSize: 20,
      fontFamily: FONTS.bold,
      color: theme.foreground.white,
    },
    // Search
    searchContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.background.darker,
      marginHorizontal: 16,
      marginTop: 12,
      marginBottom: 4,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: theme.background.accent,
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      color: theme.foreground.white,
    },
    // Scroll
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 40,
    },
    // Filter bar
    filterBar: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme.background.dark,
      borderBottomWidth: 1,
      borderBottomColor: theme.background.darker,
    },
    filterButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.background.darker,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: theme.background.accent,
      gap: 8,
    },
    filterButtonText: {
      fontSize: 15,
      fontFamily: FONTS.semiBold,
      color: theme.foreground.white,
    },
    filterBadge: {
      marginLeft: "auto",
      backgroundColor: theme.primary.main,
      borderRadius: 10,
      width: 22,
      height: 22,
      alignItems: "center",
      justifyContent: "center",
    },
    filterBadgeText: {
      fontSize: 11,
      fontFamily: FONTS.bold,
      color: theme.background.dark,
    },
    // Results
    resultsCount: {
      fontSize: 12,
      color: theme.foreground.gray,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    // List
    emptyState: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 80,
      paddingHorizontal: 40,
      gap: 12,
    },
    emptyTitle: {
      fontSize: 18,
      fontFamily: FONTS.bold,
      color: theme.foreground.white,
    },
    emptySubtitle: {
      fontSize: 14,
      color: theme.foreground.gray,
      textAlign: "center",
      lineHeight: 20,
    },
  });

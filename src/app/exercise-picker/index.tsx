import { Ionicons } from "@expo/vector-icons";
import BottomSheet from "@gorhom/bottom-sheet";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import ExerciseFilterSheet from "../../components/ui/ExerciseFilterSheet";
import { Theme } from "../../constants/themes";
import { useActiveWorkout } from "../../contexts/ActiveWorkoutContext";
import { useCreateRoutine } from "../../contexts/CreateRoutineContext";
import { useI18n } from "../../contexts/I18nContext";
import { useTheme } from "../../contexts/ThemeContext";
import {
  Difficulty,
  ExerciseDbExercise,
  fetchExercisesByEquipmentExerciseDb,
  fetchExercisesExerciseDb,
  getAvailableBodyPartsExerciseDb,
  getAvailableEquipmentsExerciseDb,
  searchExercisesByBodyPartExerciseDb,
  searchExercisesExerciseDb,
} from "../../services/exerciseDbApi";

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  beginner: "#4CAF50",
  intermediate: "#FF9800",
  advanced: "#F44336",
};

type FilterTab = "bodyPart" | "equipment" | "difficulty";

export default function ExercisePicker() {
  const router = useRouter();
  const { theme } = useTheme();
  const { language } = useI18n();
  const styles = createStyles(theme);
  const shouldTranslate = language === "fr";

  // Main state
  const [searchQuery, setSearchQuery] = useState("");
  const [exercises, setExercises] = useState<ExerciseDbExercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // multi-select state (select rows to add in bulk)
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { addExerciseToWorkout } = useActiveWorkout();
  const { isCreating, addExercisesToRoutine } = useCreateRoutine();

  // Filter state
  const filterSheetRef = useRef<BottomSheet>(null);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [activeFilterTab, setActiveFilterTab] = useState<FilterTab>("bodyPart");
  const [selectedBodyPart, setSelectedBodyPart] = useState<string | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<string | null>(
    null,
  );
  const [selectedDifficulty, setSelectedDifficulty] =
    useState<Difficulty | null>(null);
  const [bodyParts, setBodyParts] = useState<string[]>([]);
  const [equipments, setEquipments] = useState<string[]>([]);

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasActiveFilters =
    selectedBodyPart !== null ||
    selectedEquipment !== null ||
    selectedDifficulty !== null;

  const isSearchMode = searchQuery.trim().length > 0;
  const activeFilterCount =
    (selectedBodyPart ? 1 : 0) +
    (selectedEquipment ? 1 : 0) +
    (selectedDifficulty ? 1 : 0);

  // Load filter options
  useEffect(() => {
    Promise.all([
      getAvailableBodyPartsExerciseDb(shouldTranslate),
      getAvailableEquipmentsExerciseDb(shouldTranslate),
    ]).then(([bp, eq]) => {
      setBodyParts(bp);
      setEquipments(eq);
    });
  }, [shouldTranslate]);

  // Load exercises (paginated)
  const loadExercises = useCallback(
    async (reset = false) => {
      const targetPage = reset ? 0 : page;
      if (!reset && !hasMore) return;
      if (reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      try {
        const result = await fetchExercisesExerciseDb({
          page: targetPage,
          limit: 20,
          translate: shouldTranslate,
        });
        setExercises((prev) =>
          reset ? result.exercises : [...prev, ...result.exercises],
        );
        setHasMore(result.hasMore);
        setPage(reset ? 1 : targetPage + 1);
      } catch {
        /* silently ignore */
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [page, hasMore, shouldTranslate],
  );

  useEffect(() => {
    if (!isSearchMode && !hasActiveFilters) {
      loadExercises(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Client-side filter helper
  function applyClientFilters(items: ExerciseDbExercise[]) {
    let out = items;
    if (selectedBodyPart) {
      out = out.filter(
        (e) =>
          e.bodyPart.toLowerCase() === selectedBodyPart.toLowerCase() ||
          e.allBodyParts.some(
            (bp) => bp.toLowerCase() === selectedBodyPart.toLowerCase(),
          ),
      );
    }
    if (selectedEquipment) {
      out = out.filter(
        (e) =>
          e.equipment.toLowerCase() === selectedEquipment.toLowerCase() ||
          e.allEquipments.some(
            (eq) => eq.toLowerCase() === selectedEquipment.toLowerCase(),
          ),
      );
    }
    if (selectedDifficulty) {
      out = out.filter((e) => e.difficulty === selectedDifficulty);
    }
    return out;
  }

  // Search debounce
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!searchQuery.trim()) return;

    searchTimeout.current = setTimeout(async () => {
      setLoading(true);
      try {
        let results = await searchExercisesExerciseDb(searchQuery, shouldTranslate);
        results = applyClientFilters(results);
        setExercises(results);
        setHasMore(false);
      } catch {
        setExercises([]);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, selectedBodyPart, selectedEquipment, selectedDifficulty, shouldTranslate]);

  // Filter mode fetch
  useEffect(() => {
    if (searchQuery.trim()) return;

    if (!hasActiveFilters) {
      setPage(0);
      setHasMore(true);
      loadExercises(true);
      return;
    }

    (async () => {
      setLoading(true);
      try {
        let results: ExerciseDbExercise[] = [];

        // Fetch a broad base of exercises
        if (selectedBodyPart) {
          // If body part selected, get all exercises for that body part
          results = await searchExercisesByBodyPartExerciseDb(selectedBodyPart, shouldTranslate);
        } else if (selectedEquipment) {
          // If equipment selected, get all exercises for that equipment
          results =
            await fetchExercisesByEquipmentExerciseDb(selectedEquipment, shouldTranslate);
        } else {
          // If only difficulty or no specific filter, get a large set
          const broad = await fetchExercisesExerciseDb({ page: 0, limit: 100, translate: shouldTranslate });
          results = broad.exercises;
        }

        // Apply ALL selected filters (even if we already fetched for one, apply the others too)
        results = applyClientFilters(results);
        setExercises(results);
        setHasMore(false);
      } catch (error) {
        console.error("Filter fetch error:", error);
        setExercises([]);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBodyPart, selectedEquipment, selectedDifficulty, shouldTranslate]);

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedBodyPart(null);
    setSelectedEquipment(null);
    setSelectedDifficulty(null);
  };

  // Render exercise card
  const renderExerciseRow = useCallback(
    ({ item }: { item: ExerciseDbExercise }) => {
      const diffColor = DIFFICULTY_COLORS[item.difficulty];
      const idKey = item.id;
      const isSelected = selectedIds.includes(idKey);

      const toggle = () => {
        setSelectedIds((prev) =>
          prev.includes(idKey)
            ? prev.filter((p) => p !== idKey)
            : [...prev, idKey],
        );
      };

      const handleNavigateDetail = () =>
        router.navigate({
          pathname: "/exercise-picker/[id]",
          params: { id: item.id, exercise: JSON.stringify(item) },
        });

      return (
        <TouchableOpacity
          style={[styles.exerciseRow, isSelected && styles.exerciseRowSelected]}
          onPress={toggle}
          activeOpacity={0.8}
        >
          <View
            style={[
              styles.exerciseThumbnailContainer,
              { borderWidth: 2, borderColor: diffColor },
            ]}
          >
            {item.gifUrl ? (
              <Image
                source={{ uri: item.gifUrl }}
                style={styles.exerciseThumbnail}
                contentFit="cover"
                transition={200}
              />
            ) : (
              <View style={styles.exerciseThumbnailPlaceholder}>
                <Ionicons
                  name="barbell-outline"
                  size={28}
                  color={theme.foreground.gray}
                />
              </View>
            )}

            {isSelected && (
              <View style={styles.selectedOverlay}>
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={theme.primary.main}
                />
              </View>
            )}
          </View>

          <View style={styles.exerciseInfo}>
            <Text style={styles.exerciseName} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.exerciseMeta} numberOfLines={1}>
              {item.target} · {item.bodyPart}
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleNavigateDetail}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel={`More info about ${item.name}`}
          >
            <Ionicons
              name="help-circle-outline"
              size={26}
              color={theme.primary.main}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      );
    },
    [styles, theme, router, selectedIds],
  );

  const renderFooter = () =>
    loadingMore ? (
      <ActivityIndicator
        size="small"
        color={theme.primary.main}
        style={{ marginVertical: 16 }}
      />
    ) : null;

  const handleAddSelected = () => {
    if (selectedIds.length === 0) return;
    const toAdd = exercises.filter((e) => selectedIds.includes(e.id));
    if (isCreating) {
      addExercisesToRoutine(toAdd);
    } else {
      toAdd.forEach((ex) => addExerciseToWorkout(ex));
    }
    router.back();
  };

  return (
    <>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={theme.foreground.white}
            />
          </TouchableOpacity>
          <Text style={styles.title}>Add Exercise</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Search + Filter row */}
        <View style={styles.searchRow}>
          <View style={styles.searchContainer}>
            <Ionicons
              name="search-outline"
              size={20}
              color={theme.foreground.gray}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder={t("exercisePicker.searchExercise")}
              placeholderTextColor={theme.foreground.gray}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              autoCorrect={false}
              autoCapitalize="none"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={theme.foreground.gray}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Filter button */}
          <TouchableOpacity
            style={[
              styles.filterButton,
              (filterSheetOpen || hasActiveFilters) &&
                styles.filterButtonActive,
            ]}
            onPress={() => {
              if (filterSheetOpen) {
                filterSheetRef.current?.close();
                setFilterSheetOpen(false);
              } else {
                filterSheetRef.current?.expand();
                setFilterSheetOpen(true);
              }
            }}
          >
            <Ionicons
              name="options-outline"
              size={22}
              color={
                filterSheetOpen || hasActiveFilters
                  ? theme.background.dark
                  : theme.foreground.white
              }
            />
            {activeFilterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Active filter summary chips - REMOVED */}

        {/* Exercise list */}
        {loading && exercises.length === 0 ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={theme.primary.main} />
          </View>
        ) : exercises.length === 0 && !loading ? (
          <View style={styles.centered}>
            <Ionicons
              name="search-outline"
              size={48}
              color={theme.foreground.gray}
            />
            <Text style={styles.emptyText}>{t("exercisePicker.noExercisesFound")}</Text>
            {hasActiveFilters && (
              <TouchableOpacity
                style={styles.emptyResetButton}
                onPress={clearAllFilters}
              >
                <Text style={styles.emptyResetText}>{t("exercisePicker.clearFilters")}</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <>
            <FlatList
              data={exercises}
              keyExtractor={(item, index) => `exercise-${item.id}-${index}`}
              renderItem={renderExerciseRow}
              contentContainerStyle={[
                styles.listContent,
                { paddingBottom: selectedIds.length > 0 ? 120 : 40 },
              ]}
              onEndReachedThreshold={0.3}
              onEndReached={() => {
                if (
                  !loadingMore &&
                  hasMore &&
                  !isSearchMode &&
                  !hasActiveFilters
                ) {
                  loadExercises(false);
                }
              }}
              ListFooterComponent={renderFooter}
              keyboardShouldPersistTaps="handled"
            />

            {selectedIds.length > 0 && (
              <View style={styles.bulkFooter} pointerEvents="box-none">
                <TouchableOpacity
                  style={styles.addSelectedButton}
                  onPress={handleAddSelected}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name="add-circle"
                    size={20}
                    color={theme.background.dark}
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.addSelectedText}>
                    {t("exercisePicker.addSelected", { count: selectedIds.length })}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </View>

      {/* Filter Sheet Modal */}
      <ExerciseFilterSheet
        ref={filterSheetRef}
        isExpanded={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        activeTab={activeFilterTab}
        onTabChange={setActiveFilterTab}
        selectedBodyPart={selectedBodyPart}
        onBodyPartChange={setSelectedBodyPart}
        selectedEquipment={selectedEquipment}
        onEquipmentChange={setSelectedEquipment}
        selectedDifficulty={selectedDifficulty}
        onDifficultyChange={setSelectedDifficulty}
        bodyParts={bodyParts}
        equipments={equipments}
        hasActiveFilters={hasActiveFilters}
        onClearAll={clearAllFilters}
      />
    </>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background.dark },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingBottom: 16,
    },
    backButton: { padding: 8, borderRadius: 8 },
    title: { fontSize: 20, fontWeight: "700", color: theme.foreground.white },
    // Search row
    searchRow: {
      flexDirection: "row",
      alignItems: "center",
      marginHorizontal: 20,
      marginBottom: 12,
      gap: 10,
    },
    searchContainer: {
      flex: 1,
      height: 46, // match filter button height
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.background.darker,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 0,
    },
    searchIcon: { marginRight: 8 },
    searchInput: { flex: 1, color: theme.foreground.white, fontSize: 16 },
    filterButton: {
      width: 46,
      height: 46,
      borderRadius: 12,
      backgroundColor: theme.background.darker,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: "transparent",
    },
    filterButtonActive: {
      backgroundColor: theme.primary.main,
      borderColor: theme.primary.main,
    },
    filterBadge: {
      position: "absolute",
      top: 6,
      right: 6,
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: theme.background.dark,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: theme.primary.main,
    },
    filterBadgeText: {
      fontSize: 9,
      fontWeight: "700",
      color: theme.primary.main,
    },
    // Exercise list
    listContent: { paddingHorizontal: 20, paddingBottom: 40 },
    exerciseRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.background.darker,
      gap: 12,
    },
    exerciseThumbnailContainer: {
      position: "relative",
      width: 64,
      height: 64,
      borderRadius: 12,
      overflow: "hidden",
      backgroundColor: theme.background.darker,
    },
    exerciseThumbnail: { width: 64, height: 64 },
    selectedOverlay: {
      position: "absolute",
      top: 6,
      right: 6,
      zIndex: 3,
    },
    exerciseRowSelected: {
      backgroundColor: theme.background.accent,
    },
    bulkFooter: {
      position: "absolute",
      left: 20,
      right: 20,
      bottom: 18,
      alignItems: "center",
    },
    addSelectedButton: {
      backgroundColor: theme.primary.main,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOpacity: 0.12,
      shadowRadius: 6,
      elevation: 4,
    },
    addSelectedText: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.background.dark,
    },
    exerciseThumbnailPlaceholder: {
      width: 64,
      height: 64,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.background.accent,
      borderRadius: 12,
    },
    exerciseInfo: { flex: 1, gap: 3 },
    exerciseName: {
      fontSize: 15,
      fontWeight: "700",
      color: theme.foreground.white,
      textTransform: "capitalize",
    },
    exerciseMeta: {
      fontSize: 12,
      color: theme.foreground.gray,
      textTransform: "capitalize",
    },
    exerciseTagRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      flexWrap: "wrap",
    },
    exerciseEquipment: {
      fontSize: 11,
      color: theme.primary.main,
      fontWeight: "600",
      textTransform: "capitalize",
    },
    difficultyPill: {
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 10,
      borderWidth: 1,
    },
    difficultyPillText: {
      fontSize: 10,
      fontWeight: "700",
      textTransform: "capitalize",
    },
    centered: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
    },
    emptyText: { fontSize: 16, color: theme.foreground.gray },
    emptyResetButton: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 20,
      backgroundColor: theme.primary.main + "20",
      borderWidth: 1,
      borderColor: theme.primary.main,
    },
    emptyResetText: {
      fontSize: 14,
      color: theme.primary.main,
      fontWeight: "600",
    },
  });

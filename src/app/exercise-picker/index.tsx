import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import ExerciseFilterSheet from "../../components/ui/ExerciseFilterSheet";
import { Theme } from "../../constants/themes";
import { useActiveWorkout } from "../../contexts/ActiveWorkoutContext";
import { useCreateRoutine } from "../../contexts/CreateRoutineContext";
import { useI18n } from "../../contexts/I18nContext";
import { useTheme } from "../../contexts/ThemeContext";
import {
  Difficulty,
  ExerciseDbExercise,
  fetchExercisesExerciseDb,
  getAvailableBodyPartsExerciseDb,
  getAvailableEquipmentsExerciseDb,
  searchExercisesExerciseDb,
} from "../../services/exerciseDbApi";
import { translateExerciseName, translateExerciseTerm } from "../../utils/exerciseTranslator";

import { FONTS } from "../../constants/fonts";

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  beginner: "#4CAF50",
  intermediate: "#FF9800",
  advanced: "#F44336",
};

type FilterTab = "bodyPart" | "equipment" | "difficulty";

export default function ExercisePicker() {
  const router = useRouter();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { language } = useI18n();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const shouldTranslate = language === "fr";

  // Main state
  const [searchQuery, setSearchQuery] = useState("");
  const [exercises, setExercises] = useState<ExerciseDbExercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  // multi-select state (select rows to add in bulk)
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { addExerciseToWorkout } = useActiveWorkout();
  const { isCreating, addExercisesToRoutine } = useCreateRoutine();

  // Filter state
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [activeFilterTab, setActiveFilterTab] = useState<FilterTab>("bodyPart");
  // View mode toggle
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
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

  // Load filter options (canonical English values; display translation happens in the chip)
  useEffect(() => {
    Promise.all([
      getAvailableBodyPartsExerciseDb(),
      getAvailableEquipmentsExerciseDb(),
    ]).then(([bp, eq]) => {
      setBodyParts(bp);
      setEquipments(eq);
    });
  }, []);

  // Load exercises (paginated)
  const loadExercises = useCallback(
    async (reset = false) => {
      if (!reset && !hasMore) return;
      if (reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      try {
        const result = await fetchExercisesExerciseDb({
          cursor: reset ? null : cursor,
          limit: 20,
          translate: shouldTranslate,
          bodyParts: selectedBodyPart,
          equipments: selectedEquipment,
        });
        const filtered = selectedDifficulty
          ? result.exercises.filter((e) => e.difficulty === selectedDifficulty)
          : result.exercises;
        setExercises((prev) => (reset ? filtered : [...prev, ...filtered]));
        setHasMore(result.hasMore);
        setCursor(result.nextCursor);
      } catch {
        /* silently ignore */
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [
      cursor,
      hasMore,
      shouldTranslate,
      selectedBodyPart,
      selectedEquipment,
      selectedDifficulty,
    ],
  );

  // Filter / language change → reset cursor and reload from the top
  // (skipped when in search mode; the search effect below owns that path)
  useEffect(() => {
    if (isSearchMode) return;
    setCursor(null);
    setHasMore(true);
    loadExercises(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedBodyPart,
    selectedEquipment,
    selectedDifficulty,
    shouldTranslate,
    isSearchMode,
  ]);

  // Search debounce — search endpoint can't be combined with server-side
  // body-part / equipment filters, so apply them client-side on the result set.
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!searchQuery.trim()) return;

    searchTimeout.current = setTimeout(async () => {
      setLoading(true);
      try {
        const raw = await searchExercisesExerciseDb(searchQuery, shouldTranslate);
        const filtered = raw.filter((e) => {
          if (
            selectedBodyPart &&
            !e.rawBodyParts.includes(selectedBodyPart.toLowerCase())
          )
            return false;
          if (
            selectedEquipment &&
            !e.rawEquipments.includes(selectedEquipment.toLowerCase())
          )
            return false;
          if (selectedDifficulty && e.difficulty !== selectedDifficulty)
            return false;
          return true;
        });
        setExercises(filtered);
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

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedBodyPart(null);
    setSelectedEquipment(null);
    setSelectedDifficulty(null);
  };

  const toggleSelected = useCallback((idKey: string) => {
    setSelectedIds((prev) =>
      prev.includes(idKey)
        ? prev.filter((p) => p !== idKey)
        : [...prev, idKey],
    );
  }, []);

  // List row
  const renderExerciseRow = useCallback(
    ({ item }: { item: ExerciseDbExercise }) => {
      const diffColor = DIFFICULTY_COLORS[item.difficulty];
      const isSelected = selectedIds.includes(item.id);

      const handleNavigateDetail = () =>
        router.navigate({
          pathname: "/exercise-picker/[id]",
          params: { id: item.id, exercise: JSON.stringify(item) },
        });

      return (
        <TouchableOpacity
          style={[styles.exerciseRow, isSelected && styles.exerciseRowSelected]}
          onPress={() => toggleSelected(item.id)}
          activeOpacity={0.85}
        >
          <View style={styles.exerciseThumbnailContainer}>
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
                  size={22}
                  color={theme.foreground.gray}
                />
              </View>
            )}
            <View
              style={[styles.difficultyDot, { backgroundColor: diffColor }]}
            />
          </View>

          <View style={styles.exerciseInfo}>
            <Text style={styles.exerciseName} numberOfLines={1}>
              {translateExerciseName(item.name)}
            </Text>
            <View style={styles.exerciseMetaRow}>
              <Ionicons
                name="body-outline"
                size={11}
                color={theme.foreground.gray}
              />
              <Text style={styles.exerciseMeta} numberOfLines={1}>
                {translateExerciseTerm(item.bodyPart, "bodyParts")}
              </Text>
              <View style={styles.metaDot} />
              <Ionicons
                name="barbell-outline"
                size={11}
                color={theme.foreground.gray}
              />
              <Text style={styles.exerciseMeta} numberOfLines={1}>
                {translateExerciseTerm(item.equipment, "equipment")}
              </Text>
            </View>
          </View>

          <View style={styles.rowActions}>
            <TouchableOpacity
              onPress={handleNavigateDetail}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel={`More info about ${item.name}`}
              style={styles.infoButton}
            >
              <Ionicons
                name="information-circle-outline"
                size={20}
                color={theme.foreground.gray}
              />
            </TouchableOpacity>
            <View
              style={[
                styles.selectIndicator,
                isSelected && styles.selectIndicatorActive,
              ]}
            >
              {isSelected && (
                <Ionicons
                  name="checkmark"
                  size={14}
                  color={theme.background.dark}
                />
              )}
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [styles, theme, router, selectedIds, toggleSelected],
  );

  // Grid card
  const renderExerciseCard = useCallback(
    ({ item }: { item: ExerciseDbExercise }) => {
      const diffColor = DIFFICULTY_COLORS[item.difficulty];
      const isSelected = selectedIds.includes(item.id);

      const handleNavigateDetail = () =>
        router.navigate({
          pathname: "/exercise-picker/[id]",
          params: { id: item.id, exercise: JSON.stringify(item) },
        });

      return (
        <TouchableOpacity
          style={[styles.gridCard, isSelected && styles.gridCardSelected]}
          onPress={() => toggleSelected(item.id)}
          activeOpacity={0.85}
        >
          <View style={styles.gridThumbWrap}>
            {item.gifUrl ? (
              <Image
                source={{ uri: item.gifUrl }}
                style={styles.gridThumb}
                contentFit="cover"
                transition={200}
              />
            ) : (
              <View style={styles.gridThumbPlaceholder}>
                <Ionicons
                  name="barbell-outline"
                  size={32}
                  color={theme.foreground.gray}
                />
              </View>
            )}

            {/* difficulty pill */}
            <View
              style={[styles.gridDifficulty, { backgroundColor: diffColor }]}
            />

            {/* info button */}
            <TouchableOpacity
              onPress={handleNavigateDetail}
              hitSlop={6}
              style={styles.gridInfoButton}
              accessibilityLabel={`More info about ${item.name}`}
            >
              <Ionicons
                name="information-circle"
                size={18}
                color={theme.foreground.white}
              />
            </TouchableOpacity>

            {/* selection state */}
            <View
              style={[
                styles.gridSelectIndicator,
                isSelected && styles.gridSelectIndicatorActive,
              ]}
            >
              {isSelected && (
                <Ionicons
                  name="checkmark"
                  size={14}
                  color={theme.background.dark}
                />
              )}
            </View>
          </View>

          <View style={styles.gridInfo}>
            <Text style={styles.gridName} numberOfLines={2}>
              {translateExerciseName(item.name)}
            </Text>
            <Text style={styles.gridMeta} numberOfLines={1}>
              {translateExerciseTerm(item.bodyPart, "bodyParts")}
            </Text>
          </View>
        </TouchableOpacity>
      );
    },
    [styles, theme, router, selectedIds, toggleSelected],
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
          <Text style={styles.title}>{t("workout.addExercise")}</Text>
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

          {/* View mode toggle */}
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() =>
              setViewMode((m) => (m === "list" ? "grid" : "list"))
            }
            accessibilityLabel={
              viewMode === "list" ? "Switch to grid view" : "Switch to list view"
            }
          >
            <Ionicons
              name={viewMode === "list" ? "grid-outline" : "list-outline"}
              size={20}
              color={theme.foreground.white}
            />
          </TouchableOpacity>

          {/* Filter button */}
          <TouchableOpacity
            style={[
              styles.iconButton,
              hasActiveFilters && styles.iconButtonActive,
            ]}
            onPress={() => setFilterSheetOpen(true)}
          >
            <Ionicons
              name="options-outline"
              size={20}
              color={
                hasActiveFilters
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
              size={36}
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
              key={viewMode}
              data={exercises}
              keyExtractor={(item, index) => `exercise-${item.id}-${index}`}
              renderItem={
                viewMode === "grid" ? renderExerciseCard : renderExerciseRow
              }
              numColumns={viewMode === "grid" ? 2 : 1}
              columnWrapperStyle={
                viewMode === "grid" ? styles.gridColumnWrapper : undefined
              }
              contentContainerStyle={[
                styles.listContent,
                { paddingBottom: selectedIds.length > 0 ? 120 : 40 },
              ]}
              onEndReachedThreshold={0.3}
              onEndReached={() => {
                if (!loadingMore && hasMore && !isSearchMode) {
                  loadExercises(false);
                }
              }}
              ListFooterComponent={renderFooter}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
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

      {/* Filter Modal */}
      <ExerciseFilterSheet
        visible={filterSheetOpen}
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
      paddingHorizontal: 16,
      paddingTop: 4,
      paddingBottom: 12,
    },
    backButton: {
      width: 38,
      height: 38,
      borderRadius: 12,
      backgroundColor: theme.background.darker,
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      fontSize: 18,
      fontFamily: FONTS.bold,
      color: theme.foreground.white,
    },
    // Search row
    searchRow: {
      flexDirection: "row",
      alignItems: "center",
      marginHorizontal: 16,
      marginBottom: 14,
      gap: 8,
    },
    searchContainer: {
      flex: 1,
      height: 44,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.background.darker,
      borderRadius: 12,
      paddingHorizontal: 12,
    },
    searchIcon: { marginRight: 8 },
    searchInput: {
      flex: 1,
      color: theme.foreground.white,
      fontSize: 14,
      fontFamily: FONTS.medium,
      paddingVertical: 0,
    },
    iconButton: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: theme.background.darker,
      alignItems: "center",
      justifyContent: "center",
    },
    iconButtonActive: {
      backgroundColor: theme.primary.main,
    },
    filterBadge: {
      position: "absolute",
      top: 2,
      right: 2,
      minWidth: 16,
      height: 16,
      paddingHorizontal: 4,
      borderRadius: 8,
      backgroundColor: theme.background.dark,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1.5,
      borderColor: theme.primary.main,
    },
    filterBadgeText: {
      fontSize: 9,
      fontFamily: FONTS.bold,
      color: theme.primary.main,
    },
    // Exercise list (rows)
    listContent: { paddingHorizontal: 16, paddingBottom: 30 },
    exerciseRow: {
      flexDirection: "row",
      alignItems: "center",
      padding: 10,
      marginBottom: 8,
      backgroundColor: theme.background.darker,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: "transparent",
      gap: 12,
    },
    exerciseThumbnailContainer: {
      position: "relative",
      width: 56,
      height: 56,
      borderRadius: 12,
      overflow: "hidden",
      backgroundColor: theme.background.accent,
    },
    exerciseThumbnail: { width: 56, height: 56 },
    difficultyDot: {
      position: "absolute",
      bottom: 4,
      right: 4,
      width: 8,
      height: 8,
      borderRadius: 4,
      borderWidth: 1.5,
      borderColor: theme.background.darker,
    },
    exerciseRowSelected: {
      borderColor: theme.primary.main,
      backgroundColor: theme.background.accent,
    },
    rowActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    infoButton: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
    },
    selectIndicator: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 1.5,
      borderColor: theme.foreground.gray,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "transparent",
    },
    selectIndicatorActive: {
      backgroundColor: theme.primary.main,
      borderColor: theme.primary.main,
    },
    exerciseMetaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginTop: 2,
    },
    metaDot: {
      width: 3,
      height: 3,
      borderRadius: 1.5,
      backgroundColor: theme.foreground.gray,
      marginHorizontal: 4,
    },
    // Grid view
    gridColumnWrapper: {
      gap: 12,
    },
    gridCard: {
      flex: 1,
      backgroundColor: theme.background.darker,
      borderRadius: 16,
      overflow: "hidden",
      marginBottom: 12,
      borderWidth: 1.5,
      borderColor: "transparent",
    },
    gridCardSelected: {
      borderColor: theme.primary.main,
    },
    gridThumbWrap: {
      position: "relative",
      width: "100%",
      aspectRatio: 1,
      backgroundColor: theme.background.accent,
    },
    gridThumb: { width: "100%", height: "100%" },
    gridThumbPlaceholder: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    gridDifficulty: {
      position: "absolute",
      top: 8,
      left: 8,
      width: 10,
      height: 10,
      borderRadius: 5,
      borderWidth: 2,
      borderColor: "rgba(0,0,0,0.4)",
    },
    gridInfoButton: {
      position: "absolute",
      top: 6,
      right: 6,
      width: 26,
      height: 26,
      borderRadius: 13,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(0,0,0,0.5)",
    },
    gridSelectIndicator: {
      position: "absolute",
      bottom: 8,
      right: 8,
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: theme.foreground.white,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(0,0,0,0.4)",
    },
    gridSelectIndicatorActive: {
      backgroundColor: theme.primary.main,
      borderColor: theme.primary.main,
    },
    gridInfo: {
      paddingHorizontal: 10,
      paddingVertical: 10,
      gap: 2,
    },
    gridName: {
      fontSize: 12,
      fontFamily: FONTS.bold,
      color: theme.foreground.white,
      textTransform: "capitalize",
    },
    gridMeta: {
      fontSize: 10,
      fontFamily: FONTS.medium,
      color: theme.foreground.gray,
      textTransform: "capitalize",
    },
    bulkFooter: {
      position: "absolute",
      left: 16,
      right: 16,
      bottom: 14,
      alignItems: "center",
    },
    addSelectedButton: {
      backgroundColor: theme.primary.main,
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 18,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOpacity: 0.12,
      shadowRadius: 6,
      elevation: 4,
    },
    addSelectedText: {
      fontSize: 13,
      fontFamily: FONTS.bold,
      color: theme.background.dark,
    },
    exerciseThumbnailPlaceholder: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    exerciseInfo: { flex: 1, gap: 2 },
    exerciseName: {
      fontSize: 14,
      fontFamily: FONTS.bold,
      color: theme.foreground.white,
      textTransform: "capitalize",
    },
    exerciseMeta: {
      fontSize: 11,
      color: theme.foreground.gray,
      fontFamily: FONTS.medium,
      textTransform: "capitalize",
    },
    centered: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
    },
    emptyText: { fontSize: 14, color: theme.foreground.gray },
    emptyResetButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 16,
      backgroundColor: theme.primary.main + "20",
      borderWidth: 1,
      borderColor: theme.primary.main,
    },
    emptyResetText: {
      fontSize: 12,
      color: theme.primary.main,
      fontFamily: FONTS.semiBold,
    },
  });

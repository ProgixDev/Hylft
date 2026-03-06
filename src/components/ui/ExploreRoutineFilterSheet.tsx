import BottomSheet, {
  BottomSheetScrollView,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import React, { Dispatch, forwardRef, SetStateAction, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Theme } from "../../constants/themes";
import { useTheme } from "../../contexts/ThemeContext";
import {
  EXPLORE_CATEGORIES,
  ExploreCategory,
} from "../../services/exploreService";
import { translateRoutineCategory } from "../../utils/exerciseTranslator";

type FilterTab = "difficulty" | "category";

interface ExploreRoutineFilterSheetProps {
  isExpanded?: boolean;
  onClose?: () => void;
  activeTab: FilterTab;
  onTabChange: Dispatch<SetStateAction<FilterTab>>;
  selectedDifficulty: "All" | "beginner" | "intermediate" | "advanced" | null;
  onDifficultyChange: (
    difficulty: "All" | "beginner" | "intermediate" | "advanced" | null,
  ) => void;
  selectedCategory: ExploreCategory | "All" | null;
  onCategoryChange: (category: ExploreCategory | "All" | null) => void;
  hasActiveFilters: boolean;
  onClearAll: () => void;
}

// DIFFICULTIES will be translated dynamically

const ExploreRoutineFilterSheet = forwardRef<
  BottomSheet,
  ExploreRoutineFilterSheetProps
>(
  (
    {
      isExpanded,
      onClose,
      activeTab,
      onTabChange,
      selectedDifficulty,
      onDifficultyChange,
      selectedCategory,
      onCategoryChange,
      hasActiveFilters,
      onClearAll,
    },
    ref,
  ) => {
    const { theme } = useTheme();
    const { t, i18n } = useTranslation();
    const styles = createStyles(theme);
    const snapPoints = useMemo(() => ["100%"], []);

    const renderChip = (
      label: string,
      selected: boolean,
      onPress: () => void,
    ) => (
      <TouchableOpacity
        key={label}
        style={[styles.chip, selected && styles.chipActive]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <Text
          numberOfLines={1}
          ellipsizeMode="tail"
          style={[styles.chipText, selected && styles.chipTextActive]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );

    const renderTabContent = () => {
      switch (activeTab) {
        case "difficulty":
          return (
            <View style={styles.chipContainer}>
              {[
                {
                  label:
                    i18n.language === "fr"
                      ? t("filters.allLevels")
                      : "All Levels",
                  value: "All",
                },
                {
                  label:
                    i18n.language === "fr" ? t("filters.beginner") : "Beginner",
                  value: "beginner",
                },
                {
                  label:
                    i18n.language === "fr"
                      ? t("filters.intermediate")
                      : "Intermediate",
                  value: "intermediate",
                },
                {
                  label:
                    i18n.language === "fr" ? t("filters.advanced") : "Advanced",
                  value: "advanced",
                },
              ].map(({ label, value }) =>
                renderChip(label, selectedDifficulty === value, () =>
                  onDifficultyChange(
                    selectedDifficulty === value ? null : value,
                  ),
                ),
              )}
            </View>
          );
        case "category":
          return (
            <View style={styles.chipContainer}>
              {(["All", ...EXPLORE_CATEGORIES] as const).map((cat) => {
                const displayLabel =
                  cat === "All"
                    ? i18n.language === "fr"
                      ? t("filters.allCategories")
                      : "All Categories"
                    : i18n.language === "fr"
                      ? translateRoutineCategory(cat)
                      : cat;
                return renderChip(displayLabel, selectedCategory === cat, () =>
                  onCategoryChange(selectedCategory === cat ? null : cat),
                );
              })}
            </View>
          );
      }
    };

    const getTabLabel = (tab: FilterTab) => {
      switch (tab) {
        case "difficulty":
          return t("filters.level");
        case "category":
          return t("filters.category");
      }
    };

    return (
      <BottomSheet
        ref={ref}
        index={isExpanded ? 0 : -1}
        snapPoints={snapPoints}
        enablePanDownToClose
        enableDynamicSizing={false}
        onClose={onClose}
        backgroundStyle={styles.bottomSheetBackground}
        handleIndicatorStyle={styles.handleIndicator}
      >
        <BottomSheetView style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Filter Routines</Text>
            {hasActiveFilters && (
              <TouchableOpacity style={styles.clearButton} onPress={onClearAll}>
                <Text style={styles.clearButtonText}>Reset</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Tabs */}
          <View style={styles.tabsContainer}>
            {(["difficulty", "category"] as const).map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === tab && styles.tabActive]}
                onPress={() => onTabChange(tab)}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === tab && styles.tabTextActive,
                  ]}
                >
                  {getTabLabel(tab)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <BottomSheetScrollView
            contentContainerStyle={styles.scrollViewContent}
          >
            {renderTabContent()}
            <View style={styles.footerSpacer} />
          </BottomSheetScrollView>
        </BottomSheetView>
      </BottomSheet>
    );
  },
);

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    bottomSheetBackground: {
      backgroundColor: theme.background.dark,
    },
    handleIndicator: {
      backgroundColor: theme.foreground.gray,
      opacity: 0.9,
      width: 40,
      height: 4,
      marginVertical: 8,
    },
    container: {
      flex: 1,
      paddingHorizontal: 20,
      paddingBottom: 20,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    title: {
      fontSize: 22,
      fontWeight: "700",
      color: theme.foreground.white,
    },
    clearButton: {
      padding: 4,
    },
    clearButtonText: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.primary.main,
    },
    tabsContainer: {
      flexDirection: "row",
      paddingHorizontal: 18,
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.background.accent,
      gap: 8,
    },
    tab: {
      flex: 1,
      paddingVertical: 6,
      paddingHorizontal: 8,
      borderRadius: 8,
      backgroundColor: theme.background.accent,
      alignItems: "center",
    },
    tabActive: {
      backgroundColor: theme.primary.main,
    },
    tabText: {
      fontSize: 13,
      fontWeight: "600",
      color: theme.foreground.gray,
    },
    tabTextActive: {
      color: theme.background.dark,
    },
    scrollViewContent: {
      padding: 18,
      paddingBottom: 36,
    },
    chipContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      marginBottom: 18,
    },
    chip: {
      flexBasis: "48%",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 12,
      backgroundColor: theme.background.accent,
      borderWidth: 1,
      borderColor: theme.background.accent,
      marginBottom: 8,
    },
    chipActive: {
      backgroundColor: theme.primary.main,
      borderColor: theme.primary.main,
    },
    chipText: {
      fontSize: 12,
      fontWeight: "600",
      color: theme.foreground.gray,
      textAlign: "center",
    },
    chipTextActive: {
      color: theme.background.dark,
      fontWeight: "700",
    },
    footerSpacer: {
      height: 40,
    },
  });

ExploreRoutineFilterSheet.displayName = "ExploreRoutineFilterSheet";

export default ExploreRoutineFilterSheet;
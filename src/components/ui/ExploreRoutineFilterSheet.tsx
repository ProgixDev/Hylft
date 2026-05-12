import BottomSheet, {
  BottomSheetScrollView,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import React, { forwardRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Theme } from "../../constants/themes";
import { useTheme } from "../../contexts/ThemeContext";
import {
  EXPLORE_CATEGORIES,
  ExploreCategory,
} from "../../services/exploreService";
import { translateRoutineCategory } from "../../utils/exerciseTranslator";

import { FONTS } from "../../constants/fonts";

interface ExploreRoutineFilterSheetProps {
  isExpanded?: boolean;
  onClose?: () => void;
  selectedCategory: ExploreCategory | "All" | null;
  onCategoryChange: (category: ExploreCategory | "All" | null) => void;
  hasActiveFilters: boolean;
  onClearAll: () => void;
}

const ExploreRoutineFilterSheet = forwardRef<
  BottomSheet,
  ExploreRoutineFilterSheetProps
>(
  (
    {
      isExpanded,
      onClose,
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
            <Text style={styles.title}>{t("filters.category")}</Text>
            {hasActiveFilters && (
              <TouchableOpacity style={styles.clearButton} onPress={onClearAll}>
                <Text style={styles.clearButtonText}>Reset</Text>
              </TouchableOpacity>
            )}
          </View>

          <BottomSheetScrollView
            contentContainerStyle={styles.scrollViewContent}
          >
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
      fontFamily: FONTS.bold,
      color: theme.foreground.white,
    },
    clearButton: {
      padding: 4,
    },
    clearButtonText: {
      fontSize: 14,
      fontFamily: FONTS.semiBold,
      color: theme.primary.main,
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
      fontFamily: FONTS.semiBold,
      color: theme.foreground.gray,
      textAlign: "center",
    },
    chipTextActive: {
      color: theme.background.dark,
      fontFamily: FONTS.bold,
    },
    footerSpacer: {
      height: 40,
    },
  });

ExploreRoutineFilterSheet.displayName = "ExploreRoutineFilterSheet";

export default ExploreRoutineFilterSheet;

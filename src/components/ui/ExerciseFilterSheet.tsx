import BottomSheet, {
  BottomSheetScrollView,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import React, { Dispatch, forwardRef, SetStateAction, useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Theme } from "../../constants/themes";
import { useTheme } from "../../contexts/ThemeContext";
import { Difficulty } from "../../services/exerciseDbApi";

type FilterTab = "bodyPart" | "equipment" | "difficulty";

interface ExerciseFilterSheetProps {
  /** open state (full-screen) — matches ActiveWorkoutSheet behavior */
  isExpanded?: boolean;
  onClose?: () => void;
  activeTab: FilterTab;
  onTabChange: Dispatch<SetStateAction<FilterTab>>;
  selectedBodyPart: string | null;
  onBodyPartChange: (bodyPart: string | null) => void;
  selectedEquipment: string | null;
  onEquipmentChange: (equipment: string | null) => void;
  selectedDifficulty: Difficulty | null;
  onDifficultyChange: (difficulty: Difficulty | null) => void;
  bodyParts: string[];
  equipments: string[];
  hasActiveFilters: boolean;
  onClearAll: () => void;
}

// DIFFICULTIES will be translated dynamically

const ExerciseFilterSheet = forwardRef<BottomSheet, ExerciseFilterSheetProps>(
  (
    {
      isExpanded,
      onClose,
      activeTab,
      onTabChange,
      selectedBodyPart,
      onBodyPartChange,
      selectedEquipment,
      onEquipmentChange,
      selectedDifficulty,
      onDifficultyChange,
      bodyParts,
      equipments,
      hasActiveFilters,
      onClearAll,
    },
    ref,
  ) => {
    const { t, i18n } = useTranslation();
    const { theme } = useTheme();
    const styles = createStyles(theme);
    const snapPoints = useMemo(() => ["100%"], []); // full-screen like ActiveWorkoutSheet

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
          {label.charAt(0).toUpperCase() + label.slice(1)}
        </Text>
      </TouchableOpacity>
    );

    const renderTabContent = () => {
      switch (activeTab) {
        case "difficulty":
          return (
            <View style={styles.chipContainer}>
              {[
                { label: t("filters.beginner"), value: "beginner" },
                { label: t("filters.intermediate"), value: "intermediate" },
                { label: t("filters.advanced"), value: "advanced" },
              ].map(({ label, value }) =>
                renderChip(label, selectedDifficulty === value, () =>
                  onDifficultyChange(
                    selectedDifficulty === value ? null : value,
                  ),
                ),
              )}
            </View>
          );
        case "bodyPart":
          return (
            <View style={styles.chipContainer}>
              {bodyParts.map((bp) =>
                renderChip(bp, selectedBodyPart === bp, () =>
                  onBodyPartChange(selectedBodyPart === bp ? null : bp),
                ),
              )}
            </View>
          );
        case "equipment":
          return (
            <View style={styles.chipContainer}>
              {equipments.map((eq) =>
                renderChip(eq, selectedEquipment === eq, () =>
                  onEquipmentChange(selectedEquipment === eq ? null : eq),
                ),
              )}
            </View>
          );
      }
    };

    const getTabLabel = (tab: FilterTab) => {
      switch (tab) {
        case "bodyPart":
          return t("filters.bodyPart");
        case "equipment":
          return t("filters.equipment");
        case "difficulty":
          return t("filters.difficulty");
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
            <Text style={styles.title}>{t("filters.filterExercises")}</Text>
            {hasActiveFilters && (
              <TouchableOpacity style={styles.clearButton} onPress={onClearAll}>
                <Text style={styles.clearButtonText}>{t("filters.reset")}</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Tabs */}
          <View style={styles.tabsContainer}>
            {(["bodyPart", "equipment", "difficulty"] as const).map((tab) => (
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
    /* Match ActiveWorkoutSheet styles for full-screen look */
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
      fontFamily: "Poppins-SemiBold",
      color: theme.foreground.white,
    },
    clearButton: {
      padding: 4,
    },
    clearButtonText: {
      fontSize: 14,
      fontFamily: "Poppins-Medium",
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
      fontFamily: "Poppins-Medium",
      color: theme.foreground.gray,
    },
    tabTextActive: {
      color: theme.background.dark,
    },
    scrollViewContent: {
      padding: 18,
      paddingBottom: 36,
    },
    /* Make chips look even: two-column grid, smaller text + tighter padding */
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
      fontFamily: "Poppins-Medium",
      color: theme.foreground.gray,
      textAlign: "center",
    },
    chipTextActive: {
      color: theme.background.dark,
      fontFamily: "Poppins-SemiBold",
    },
    footerSpacer: {
      height: 40,
    },
  });

ExerciseFilterSheet.displayName = 'ExerciseFilterSheet';

export default ExerciseFilterSheet;

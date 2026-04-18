import { Ionicons } from "@expo/vector-icons";
import React, { Dispatch, SetStateAction, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  LayoutChangeEvent,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { FONTS } from "../../constants/fonts";
import { Theme } from "../../constants/themes";
import { useTheme } from "../../contexts/ThemeContext";
import { Difficulty } from "../../services/exerciseDbApi";
import { translateExerciseTerm } from "../../utils/exerciseTranslator";

type FilterTab = "bodyPart" | "equipment" | "difficulty";

interface ExerciseFilterSheetProps {
  visible: boolean;
  onClose: () => void;
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

const TAB_ICONS: Record<FilterTab, keyof typeof Ionicons.glyphMap> = {
  bodyPart: "body-outline",
  equipment: "barbell-outline",
  difficulty: "speedometer-outline",
};

const ExerciseFilterSheet: React.FC<ExerciseFilterSheetProps> = ({
  visible,
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
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // Sliding indicator behind the active tab
  const TAB_ORDER: FilterTab[] = ["bodyPart", "equipment", "difficulty"];
  const TAB_GAP = 4;
  const TAB_PADDING = 4;
  const [tabsWidth, setTabsWidth] = useState(0);
  const tabWidth = tabsWidth
    ? (tabsWidth - TAB_PADDING * 2 - TAB_GAP * (TAB_ORDER.length - 1)) /
      TAB_ORDER.length
    : 0;
  const indicatorX = useSharedValue(0);

  useEffect(() => {
    if (!tabWidth) return;
    const idx = TAB_ORDER.indexOf(activeTab);
    indicatorX.value = withSpring(idx * (tabWidth + TAB_GAP), {
      damping: 18,
      stiffness: 180,
      mass: 0.6,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, tabWidth]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
  }));

  const onTabsLayout = (e: LayoutChangeEvent) => {
    setTabsWidth(e.nativeEvent.layout.width);
  };

  const renderChip = (
    label: string,
    key: string,
    selected: boolean,
    onPress: () => void,
    icon?: keyof typeof Ionicons.glyphMap,
  ) => (
    <Pressable
      key={key}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.chipActive,
        pressed && { opacity: 0.75, transform: [{ scale: 0.98 }] },
      ]}
      onPress={onPress}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={14}
          color={selected ? theme.background.dark : theme.foreground.gray}
          style={{ marginRight: 6 }}
        />
      )}
      <Text
        numberOfLines={1}
        ellipsizeMode="tail"
        style={[styles.chipText, selected && styles.chipTextActive]}
      >
        {label.charAt(0).toUpperCase() + label.slice(1)}
      </Text>
      {selected && (
        <Ionicons
          name="checkmark"
          size={14}
          color={theme.background.dark}
          style={{ marginLeft: 6 }}
        />
      )}
    </Pressable>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "difficulty": {
        const items: { label: string; value: Difficulty; icon: keyof typeof Ionicons.glyphMap }[] = [
          { label: t("filters.beginner"), value: "beginner", icon: "leaf-outline" },
          { label: t("filters.intermediate"), value: "intermediate", icon: "flame-outline" },
          { label: t("filters.advanced"), value: "advanced", icon: "flash-outline" },
        ];
        return (
          <View style={styles.chipContainer}>
            {items.map(({ label, value, icon }) =>
              renderChip(
                label,
                value,
                selectedDifficulty === value,
                () =>
                  onDifficultyChange(
                    selectedDifficulty === value ? null : value,
                  ),
                icon,
              ),
            )}
          </View>
        );
      }
      case "bodyPart":
        return (
          <View style={styles.chipContainer}>
            {bodyParts.map((bp) =>
              renderChip(
                translateExerciseTerm(bp, "bodyParts"),
                bp,
                selectedBodyPart === bp,
                () => onBodyPartChange(selectedBodyPart === bp ? null : bp),
              ),
            )}
          </View>
        );
      case "equipment":
        return (
          <View style={styles.chipContainer}>
            {equipments.map((eq) =>
              renderChip(
                translateExerciseTerm(eq, "equipment"),
                eq,
                selectedEquipment === eq,
                () => onEquipmentChange(selectedEquipment === eq ? null : eq),
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

  // Quick summary of currently-selected values shown under the header.
  const summaryItems = [
    selectedBodyPart && translateExerciseTerm(selectedBodyPart, "bodyParts"),
    selectedEquipment && translateExerciseTerm(selectedEquipment, "equipment"),
    selectedDifficulty && t(`filters.${selectedDifficulty}`),
  ].filter(Boolean) as string[];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropTouchable} onPress={onClose} />

        <View style={styles.modalCard}>
          {/* Drag indicator */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{t("filters.filterExercises")}</Text>
              {summaryItems.length > 0 && (
                <Text style={styles.subtitle} numberOfLines={1}>
                  {summaryItems.join(" · ")}
                </Text>
              )}
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.closeButton,
                pressed && { opacity: 0.7 },
              ]}
              onPress={onClose}
              hitSlop={8}
            >
              <Ionicons
                name="close"
                size={20}
                color={theme.foreground.white}
              />
            </Pressable>
          </View>

          {/* Tabs */}
          <View style={styles.tabsContainer} onLayout={onTabsLayout}>
            {/* Sliding active indicator */}
            {tabWidth > 0 && (
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.tabIndicator,
                  { width: tabWidth },
                  indicatorStyle,
                ]}
              />
            )}
            {TAB_ORDER.map((tab) => {
              const active = activeTab === tab;
              return (
                <Pressable
                  key={tab}
                  style={({ pressed }) => [
                    styles.tab,
                    pressed && { opacity: 0.85 },
                  ]}
                  onPress={() => onTabChange(tab)}
                >
                  <Ionicons
                    name={TAB_ICONS[tab]}
                    size={16}
                    color={
                      active ? theme.background.dark : theme.foreground.gray
                    }
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[styles.tabText, active && styles.tabTextActive]}
                  >
                    {getTabLabel(tab)}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Content */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {renderTabContent()}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.55)",
      justifyContent: "flex-end",
    },
    backdropTouchable: {
      ...StyleSheet.absoluteFillObject,
    },
    modalCard: {
      backgroundColor: theme.background.dark,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingTop: 8,
      paddingBottom: 18,
      height: "50%",
      shadowColor: "#000",
      shadowOpacity: 0.35,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: -4 },
      elevation: 12,
    },
    handle: {
      alignSelf: "center",
      width: 42,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.foreground.gray,
      opacity: 0.4,
      marginBottom: 10,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 20,
      marginBottom: 14,
      gap: 12,
    },
    title: {
      fontSize: 20,
      fontFamily: FONTS.bold,
      color: theme.foreground.white,
    },
    subtitle: {
      marginTop: 2,
      fontSize: 12,
      fontFamily: FONTS.medium,
      color: theme.primary.main,
    },
    closeButton: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: theme.background.darker,
      alignItems: "center",
      justifyContent: "center",
    },
    tabsContainer: {
      position: "relative",
      flexDirection: "row",
      marginHorizontal: 20,
      backgroundColor: theme.background.darker,
      borderRadius: 12,
      padding: 4,
      gap: 4,
    },
    tabIndicator: {
      position: "absolute",
      top: 4,
      bottom: 4,
      left: 4,
      borderRadius: 9,
      backgroundColor: theme.primary.main,
    },
    tab: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 10,
      borderRadius: 9,
    },
    tabText: {
      fontSize: 12,
      fontFamily: FONTS.semiBold,
      color: theme.foreground.gray,
    },
    tabTextActive: {
      color: theme.background.dark,
    },
    scrollView: {
      marginTop: 14,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingBottom: 12,
    },
    chipContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 20,
      backgroundColor: theme.background.darker,
      borderWidth: 1,
      borderColor: "transparent",
    },
    chipActive: {
      backgroundColor: theme.primary.main,
      borderColor: theme.primary.main,
    },
    chipText: {
      fontSize: 12,
      fontFamily: FONTS.medium,
      color: theme.foreground.gray,
    },
    chipTextActive: {
      color: theme.background.dark,
      fontFamily: FONTS.bold,
    },
  });

ExerciseFilterSheet.displayName = "ExerciseFilterSheet";

export default ExerciseFilterSheet;

import { Ionicons } from "@expo/vector-icons";
import React, { Dispatch, SetStateAction, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  LayoutChangeEvent,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Text } from "./ScaledText";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { FONTS } from "../../constants/fonts";
import { Theme } from "../../constants/themes";
import { useTheme } from "../../contexts/ThemeContext";
import { translateExerciseTerm } from "../../utils/exerciseTranslator";

type FilterTab = "bodyPart" | "equipment";

const BODY_PART_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  back: "body-outline",
  cardio: "heart-outline",
  chest: "body-outline",
  "lower arms": "hand-left-outline",
  "lower legs": "footsteps-outline",
  neck: "body-outline",
  shoulders: "body-outline",
  "upper arms": "fitness-outline",
  "upper legs": "walk-outline",
  waist: "body-outline",
};

const EQUIPMENT_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  barbell: "barbell-outline",
  dumbbell: "barbell-outline",
  cable: "link-outline",
  "body weight": "body-outline",
  band: "resize-outline",
  "leverage machine": "cog-outline",
  kettlebell: "fitness-outline",
  "medicine ball": "football-outline",
  "ez barbell": "barbell-outline",
  "olympic barbell": "barbell-outline",
  "trap bar": "barbell-outline",
  roller: "ellipse-outline",
  rope: "link-outline",
  "stability ball": "ellipse-outline",
  assisted: "hand-right-outline",
  weighted: "barbell-outline",
};

interface ExerciseFilterSheetProps {
  visible: boolean;
  onClose: () => void;
  activeTab: FilterTab;
  onTabChange: Dispatch<SetStateAction<FilterTab>>;
  selectedBodyPart: string | null;
  onBodyPartChange: (bodyPart: string | null) => void;
  selectedEquipment: string | null;
  onEquipmentChange: (equipment: string | null) => void;
  bodyParts: string[];
  equipments: string[];
  hasActiveFilters: boolean;
  onClearAll: () => void;
}

const TAB_ICONS: Record<FilterTab, keyof typeof Ionicons.glyphMap> = {
  bodyPart: "body-outline",
  equipment: "barbell-outline",
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
  bodyParts,
  equipments,
  hasActiveFilters,
  onClearAll,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // Sliding indicator behind the active tab
  const TAB_ORDER: FilterTab[] = ["bodyPart", "equipment"];
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

  const renderGridItem = (
    label: string,
    key: string,
    selected: boolean,
    onPress: () => void,
    icon: keyof typeof Ionicons.glyphMap,
  ) => (
    <Pressable
      key={key}
      style={({ pressed }) => [
        styles.gridItem,
        selected && styles.gridItemActive,
        pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] },
      ]}
      onPress={onPress}
    >
      <View
        style={[
          styles.gridIconWrap,
          selected && styles.gridIconWrapActive,
        ]}
      >
        <Ionicons
          name={icon}
          size={20}
          color={selected ? "#fff" : theme.foreground.gray}
        />
      </View>
      <Text
        numberOfLines={2}
        style={[styles.gridItemText, selected && styles.gridItemTextActive]}
      >
        {label}
      </Text>
    </Pressable>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "bodyPart":
        return (
          <View style={styles.grid}>
            {bodyParts.map((bp) =>
              renderGridItem(
                translateExerciseTerm(bp, "bodyParts"),
                bp,
                selectedBodyPart === bp,
                () => onBodyPartChange(selectedBodyPart === bp ? null : bp),
                BODY_PART_ICONS[bp] ?? "body-outline",
              ),
            )}
          </View>
        );
      case "equipment":
        return (
          <View style={styles.grid}>
            {equipments.map((eq) =>
              renderGridItem(
                translateExerciseTerm(eq, "equipment"),
                eq,
                selectedEquipment === eq,
                () => onEquipmentChange(selectedEquipment === eq ? null : eq),
                EQUIPMENT_ICONS[eq] ?? "ellipse-outline",
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
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View style={styles.modalCard}>
          {/* Drag indicator */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{t("filters.filterExercises")}</Text>
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

          {/* Footer */}
          <View style={styles.footer}>
            {hasActiveFilters ? (
              <Pressable onPress={onClearAll} hitSlop={8}>
                <Text style={styles.clearText}>
                  {t("filters.clearAll")}
                </Text>
              </Pressable>
            ) : (
              <View />
            )}
            <Pressable
              style={({ pressed }) => [
                styles.applyBtn,
                pressed && { opacity: 0.85 },
              ]}
              onPress={onClose}
            >
              <Text style={styles.applyBtnText}>
                {t("filters.apply")}
              </Text>
            </Pressable>
          </View>
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
    modalCard: {
      backgroundColor: theme.background.dark,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingTop: 8,
      paddingBottom: 24,
      maxHeight: "70%",
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
      justifyContent: "space-between",
      paddingHorizontal: 20,
      marginBottom: 14,
    },
    title: {
      fontSize: 20,
      fontFamily: FONTS.bold,
      color: theme.foreground.white,
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
      marginTop: 16,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingBottom: 8,
    },
    // 2-column grid like Hevy
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    gridItem: {
      width: "48%",
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.background.darker,
      borderRadius: 14,
      paddingVertical: 14,
      paddingHorizontal: 14,
      borderWidth: 1.5,
      borderColor: "transparent",
      gap: 12,
    },
    gridItemActive: {
      borderColor: theme.primary.main,
      backgroundColor: theme.primary.main + "15",
    },
    gridIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.background.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    gridIconWrapActive: {
      backgroundColor: theme.primary.main,
    },
    gridItemText: {
      flex: 1,
      fontSize: 13,
      fontFamily: FONTS.semiBold,
      color: theme.foreground.gray,
    },
    gridItemTextActive: {
      color: theme.foreground.white,
    },
    // Footer
    footer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingTop: 12,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.background.accent,
    },
    clearText: {
      fontSize: 14,
      fontFamily: FONTS.medium,
      color: theme.foreground.gray,
    },
    applyBtn: {
      backgroundColor: theme.primary.main,
      borderRadius: 12,
      paddingHorizontal: 24,
      paddingVertical: 12,
    },
    applyBtnText: {
      fontSize: 14,
      fontFamily: FONTS.bold,
      color: "#fff",
    },
  });

ExerciseFilterSheet.displayName = "ExerciseFilterSheet";

export default ExerciseFilterSheet;

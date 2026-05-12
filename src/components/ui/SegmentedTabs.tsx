import { BlurView } from "expo-blur";
import React, { useEffect } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { FONTS } from "../../constants/fonts";
import { Theme } from "../../constants/themes";

const TRACK_PADDING = 4;
const ACTIVE_NAVY = "#0A1628";
const DEFAULT_ITEM_WIDTH = 92;

export type SegmentedTabsItem<T extends string> = {
  value: T;
  label: string;
};

export type SegmentedTabsProps<T extends string> = {
  value: T;
  onChange: (next: T) => void;
  items: SegmentedTabsItem<T>[];
  theme: Theme;
  themeType: "dark" | "light";
  itemWidth?: number;
  style?: any;
};

export function SegmentedTabs<T extends string>({
  value,
  onChange,
  items,
  theme,
  themeType,
  itemWidth = DEFAULT_ITEM_WIDTH,
  style,
}: SegmentedTabsProps<T>) {
  const activeIdx = Math.max(
    0,
    items.findIndex((it) => it.value === value),
  );
  const x = useSharedValue(activeIdx * itemWidth);

  useEffect(() => {
    x.value = withTiming(activeIdx * itemWidth, { duration: 280 });
  }, [activeIdx, itemWidth, x]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }],
  }));

  const styles = createStyles(theme, itemWidth);
  const blurTint = themeType === "dark" ? "dark" : "light";

  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.track}>
        <Animated.View
          style={[styles.indicator, indicatorStyle]}
          pointerEvents="none"
        >
          <BlurView
            intensity={50}
            tint={blurTint}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.indicatorOverlay} />
        </Animated.View>
        {items.map((it) => {
          const active = it.value === value;
          return (
            <Pressable
              key={it.value}
              style={styles.item}
              onPress={() => onChange(it.value)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.text, active && styles.textActive]}>
                {it.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const createStyles = (theme: Theme, itemWidth: number) =>
  StyleSheet.create({
    wrap: {
      alignItems: "center",
      marginBottom: 16,
    },
    track: {
      flexDirection: "row",
      padding: TRACK_PADDING,
      borderRadius: 10,
      backgroundColor: theme.background.darker,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: `${theme.foreground.gray}30`,
      overflow: "hidden",
      ...(Platform.OS === "ios"
        ? {
            shadowColor: "#000",
            shadowOpacity: 0.12,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 4 },
          }
        : { elevation: 2 }),
    },
    indicator: {
      position: "absolute",
      top: TRACK_PADDING,
      left: TRACK_PADDING,
      width: itemWidth,
      bottom: TRACK_PADDING,
      borderRadius: 10,
      overflow: "hidden",
      backgroundColor: ACTIVE_NAVY,
    },
    indicatorOverlay: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: 10,
      backgroundColor: ACTIVE_NAVY,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: `${ACTIVE_NAVY}55`,
    },
    item: {
      width: itemWidth,
      paddingVertical: 9,
      alignItems: "center",
      justifyContent: "center",
    },
    text: {
      fontFamily: FONTS.bold,
      fontSize: 13,
      color: theme.foreground.gray,
    },
    textActive: { color: "#FFFFFF" },
  });

export default SegmentedTabs;

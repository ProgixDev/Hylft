import { Ionicons } from "@expo/vector-icons";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { LayoutChangeEvent, Pressable, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { FONTS } from "../../constants/fonts";
import { useTheme } from "../../contexts/ThemeContext";

type IconName = keyof typeof Ionicons.glyphMap;

const ICON_MAP: Record<string, { default: IconName; focused: IconName }> = {
  home: { default: "home-outline", focused: "home" },
  alimentation: { default: "restaurant-outline", focused: "restaurant" },
  workout: { default: "barbell-outline", focused: "barbell" },
  feed: { default: "newspaper-outline", focused: "newspaper" },
  profile: { default: "person-outline", focused: "person" },
};

const PILL_SPRING = { damping: 18, stiffness: 180, mass: 0.9 };

export function CustomTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const [barWidth, setBarWidth] = useState(0);
  const tabCount = state.routes.length;
  const tabWidth = tabCount > 0 ? barWidth / tabCount : 0;

  const indicatorX = useSharedValue(0);
  const indicatorScale = useSharedValue(1);

  useEffect(() => {
    if (!tabWidth) return;
    indicatorX.value = withSpring(state.index * tabWidth, PILL_SPRING);
    // Subtle squash/stretch for extra smoothness.
    indicatorScale.value = withTiming(
      0.85,
      { duration: 120, easing: Easing.out(Easing.quad) },
      () => {
        indicatorScale.value = withSpring(1, PILL_SPRING);
      },
    );
  }, [state.index, tabWidth, indicatorX, indicatorScale]);

  const indicatorStyle = useAnimatedStyle(() => ({
    width: tabWidth,
    transform: [
      { translateX: indicatorX.value },
      { scaleX: indicatorScale.value },
    ],
  }));

  const activeColor = theme.primary.main;

  return (
    <View
      style={styles.container}
      onLayout={(e: LayoutChangeEvent) => setBarWidth(e.nativeEvent.layout.width)}
    >
      {/* Sliding indicator pill */}
      {tabWidth > 0 && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.indicator,
            { backgroundColor: activeColor + "1A" },
            indicatorStyle,
          ]}
        />
      )}

      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const iconConfig = ICON_MAP[route.name.toLowerCase()];

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: "tabLongPress",
            target: route.key,
          });
        };

        return (
          <TabButton
            key={route.key}
            routeName={route.name}
            isFocused={isFocused}
            tabIndex={index}
            activeIndex={state.index}
            iconName={
              isFocused && iconConfig
                ? iconConfig.focused
                : iconConfig
                  ? iconConfig.default
                  : "help-outline"
            }
            onPress={onPress}
            onLongPress={onLongPress}
          />
        );
      })}
    </View>
  );
}

interface TabButtonProps {
  routeName: string;
  isFocused: boolean;
  tabIndex: number;
  activeIndex: number;
  iconName: IconName;
  onPress: () => void;
  onLongPress: () => void;
}

function TabButton({
  routeName,
  isFocused,
  tabIndex,
  activeIndex,
  iconName,
  onPress,
  onLongPress,
}: TabButtonProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(theme);

  const focus = useSharedValue(isFocused ? 1 : 0);
  const press = useSharedValue(0);

  useEffect(() => {
    focus.value = withSpring(isFocused ? 1 : 0, {
      damping: 16,
      stiffness: 200,
      mass: 0.8,
    });
  }, [isFocused, focus]);

  // Determine slide direction (left vs right) based on jump relative to active tab.
  const direction = tabIndex - activeIndex;

  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(focus.value, [0, 1], [1, 1.15]) },
      { translateY: interpolate(focus.value, [0, 1], [0, -1]) },
      { scale: interpolate(press.value, [0, 1], [1, 0.88]) },
    ],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: focus.value,
    transform: [
      {
        translateX: interpolate(
          focus.value,
          [0, 1],
          [direction >= 0 ? -10 : 10, 0],
        ),
      },
    ],
    maxWidth: interpolate(focus.value, [0, 1], [0, 120]),
  }));

  const activeColor = theme.primary.main;
  const isDark = theme.background.dark === "#0B0D0E";
  const inactiveColor = isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)";
  const color = isFocused ? activeColor : inactiveColor;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={() => {
        press.value = withTiming(1, { duration: 90 });
      }}
      onPressOut={() => {
        press.value = withTiming(0, { duration: 140 });
      }}
      style={styles.tabButton}
    >
      <View style={styles.content}>
        <Animated.View style={iconStyle}>
          <Ionicons name={iconName} size={21} color={color} />
        </Animated.View>
        <Animated.Text
          style={[styles.label, { color: activeColor }, labelStyle]}
          numberOfLines={1}
        >
          {t(("tabs." + routeName.toLowerCase()) as any)}
        </Animated.Text>
      </View>
    </Pressable>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      position: "absolute",
      bottom: 0,
      left: 0,
      width: "100%",
      height: 60,
      flexDirection: "row",
      backgroundColor: theme.background.dark,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.background.accent,
      alignItems: "center",
      paddingHorizontal: 6,
      zIndex: 50,
    },
    indicator: {
      position: "absolute",
      top: 8,
      bottom: 8,
      left: 0,
      borderRadius: 16,
    },
    tabButton: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      height: "100%",
    },
    content: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingHorizontal: 6,
      overflow: "hidden",
    },
    label: {
      fontFamily: FONTS.semiBold,
      fontSize: 12,
      overflow: "hidden",
    },
  });

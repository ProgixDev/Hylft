import { Ionicons } from "@expo/vector-icons";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
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

const ACTIVE_FLEX = 2.2;
const INACTIVE_FLEX = 1;
const SPRING = { damping: 22, stiffness: 260, mass: 0.7 };

export function CustomTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  return (
    <View style={styles.container}>
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
  iconName: IconName;
  onPress: () => void;
  onLongPress: () => void;
}

function TabButton({
  routeName,
  isFocused,
  iconName,
  onPress,
  onLongPress,
}: TabButtonProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(theme);

  const flex = useSharedValue(isFocused ? ACTIVE_FLEX : INACTIVE_FLEX);
  const labelOpacity = useSharedValue(isFocused ? 1 : 0);
  const bgOpacity = useSharedValue(isFocused ? 1 : 0);

  React.useEffect(() => {
    flex.value = withSpring(isFocused ? ACTIVE_FLEX : INACTIVE_FLEX, SPRING);
    labelOpacity.value = withSpring(isFocused ? 1 : 0, SPRING);
    bgOpacity.value = withSpring(isFocused ? 1 : 0, SPRING);
  }, [isFocused, flex, labelOpacity, bgOpacity]);

  const outerStyle = useAnimatedStyle(() => ({
    flex: flex.value,
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: labelOpacity.value,
  }));

  const pillStyle = useAnimatedStyle(() => ({
    opacity: bgOpacity.value,
  }));

  const activeColor = theme.primary.main;
  const isDark = theme.background.dark === "#0B0D0E";
  const inactiveColor = isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)";
  const color = isFocused ? activeColor : inactiveColor;

  return (
    <Animated.View style={[styles.tabOuter, outerStyle]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={isFocused ? { selected: true } : {}}
        onPress={onPress}
        onLongPress={onLongPress}
        style={styles.tabButton}
      >
        {/* Active pill background */}
        <Animated.View
          style={[
            styles.pill,
            { backgroundColor: activeColor + "14" },
            pillStyle,
          ]}
        />

        {/* Content */}
        <View style={styles.content}>
          <Ionicons name={iconName} size={21} color={color} />
          {isFocused && (
            <Animated.Text
              style={[styles.label, { color: activeColor }, labelStyle]}
              numberOfLines={1}
            >
              {t(("tabs." + routeName.toLowerCase()) as any)}
            </Animated.Text>
          )}
        </View>
      </Pressable>
    </Animated.View>
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
  tabOuter: {
    height: 44,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    position: "relative",
  },
  pill: {
    position: "absolute",
    top: 0,
    left: 4,
    right: 4,
    bottom: 0,
    borderRadius: 14,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  label: {
    fontFamily: FONTS.semiBold,
    fontSize: 12,
  },
});

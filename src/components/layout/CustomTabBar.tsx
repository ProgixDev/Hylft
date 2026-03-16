import { Ionicons } from "@expo/vector-icons";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { FONTS } from "../../constants/fonts";
import { useTheme } from "../../contexts/ThemeContext";

type IconName = keyof typeof Ionicons.glyphMap;

const ICON_MAP: Record<string, { default: IconName; focused: IconName }> = {
  home: { default: "home-outline", focused: "home" },
  feed: { default: "flame-outline", focused: "flame" },
  workout: { default: "barbell-outline", focused: "barbell" },
  schedule: { default: "calendar-outline", focused: "calendar" },
  profile: { default: "person-outline", focused: "person" },
};

const ACTIVE_FLEX = 2.6;
const INACTIVE_FLEX = 1;
const TIMING_CONFIG = { duration: 300 };

export function CustomTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  return (
    <View
      style={[
        styles.container,
        {
          height: 60,
        },
      ]}
    >
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

  const flex = useSharedValue(isFocused ? ACTIVE_FLEX : INACTIVE_FLEX);
  const scale = useSharedValue(isFocused ? 1.05 : 1);
  const labelOpacity = useSharedValue(isFocused ? 1 : 0);
  const innerScaleX = useSharedValue(isFocused ? 1 : 0.5);

  React.useEffect(() => {
    flex.value = withTiming(isFocused ? ACTIVE_FLEX : INACTIVE_FLEX, TIMING_CONFIG);
    scale.value = withTiming(isFocused ? 1.05 : 1, TIMING_CONFIG);
    labelOpacity.value = withTiming(isFocused ? 1 : 0, TIMING_CONFIG);
    innerScaleX.value = withTiming(isFocused ? 1 : 0.5, TIMING_CONFIG);
  }, [isFocused, flex, scale, labelOpacity, innerScaleX]);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    flex: flex.value,
  }));

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedLabelStyle = useAnimatedStyle(() => ({
    opacity: labelOpacity.value,
  }));

  const animatedInnerStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: innerScaleX.value }],
  }));

  const animatedContentStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: innerScaleX.value === 0 ? 1 : 1 / innerScaleX.value }],
  }));

  const activeColor = theme.primary.main;
  const inactiveColor = "rgba(255,255,255,0.55)";
  const color = isFocused ? activeColor : inactiveColor;

  return (
    <Animated.View style={[styles.tabButtonOuter, animatedContainerStyle]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={isFocused ? { selected: true } : {}}
        onPress={onPress}
        onLongPress={onLongPress}
        style={styles.tabButton}
      >
        <Animated.View
          style={[
            styles.tabItemContainer,
            isFocused && {
              backgroundColor: activeColor + "1A",
              borderWidth: 1,
              borderColor: activeColor + "33",
              borderRadius: 18,
              alignSelf: "stretch",
              marginHorizontal: 6,
            },
            animatedInnerStyle,
          ]}
        >
          <Animated.View style={[styles.contentWrapper, animatedContentStyle]}>
            <Animated.View style={[styles.iconContainer, animatedIconStyle]}>
              <Ionicons name={iconName} size={22} color={color} />
            </Animated.View>
            {isFocused && (
              <Animated.Text
                style={[styles.label, { color }, animatedLabelStyle]}
                numberOfLines={1}
              >
                {t(("tabs." + routeName.toLowerCase()) as any)}
              </Animated.Text>
            )}
          </Animated.View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: "100%",
    flexDirection: "row",
    backgroundColor: "#0B0D0E",
    borderTopWidth: 0.5,
    borderTopColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 50,
  },
  tabButtonOuter: {
    height: "100%",
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    paddingVertical: 6,
  },
  tabItemContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  contentWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontFamily: FONTS.medium,
    fontSize: 11,
    marginTop: 3,
  },
});

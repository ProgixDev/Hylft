import { Ionicons } from "@expo/vector-icons";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import React from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../contexts/ThemeContext";

type IconName = keyof typeof Ionicons.glyphMap;

const ICON_MAP: Record<string, { default: IconName; focused: IconName }> = {
  home: { default: "flame-outline", focused: "flame" },
  workout: { default: "barbell-outline", focused: "barbell" },
  schedule: { default: "calendar-outline", focused: "calendar" },
  profile: { default: "person-outline", focused: "person" },
};

export function CustomTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  const styles = createStyles(theme);

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: Platform.OS === "ios" ? insets.bottom : 12,
        },
      ]}
    >
      {/* Tab Buttons */}
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
            isFocused={isFocused}
            iconName={isFocused ? iconConfig.focused : iconConfig.default}
            onPress={onPress}
            onLongPress={onLongPress}
          />
        );
      })}
    </View>
  );
}

interface TabButtonProps {
  isFocused: boolean;
  iconName: IconName;
  onPress: () => void;
  onLongPress: () => void;
}

function TabButton({
  isFocused,
  iconName,
  onPress,
  onLongPress,
}: TabButtonProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);

  const styles = createStyles(theme);

  React.useEffect(() => {
    scale.value = withSpring(isFocused ? 1.1 : 1, {
      damping: 420,
      stiffness: 950,
    });
    translateY.value = withSpring(isFocused ? -2 : 0, {
      damping: 420,
      stiffness: 950,
    });
  }, [isFocused, scale, translateY]);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [styles.tabButton, pressed && { opacity: 0.6 }]}
    >
      <Animated.View style={[styles.iconContainer, animatedIconStyle]}>
        <Ionicons
          name={iconName}
          size={24}
          color={isFocused ? theme.primary.main : theme.foreground.gray}
        />
      </Animated.View>
    </Pressable>
  );
}

function createStyles(theme: any) {
  return StyleSheet.create({
    container: {
      position: "absolute",
      bottom: Platform.OS === "ios" ? 20 : 16,
      left: 16,
      right: 16,
      flexDirection: "row",
      backgroundColor: theme.background.darker,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: "rgba(255,255,255,0.08)",
      borderRadius: 26,
      overflow: "hidden",
      paddingTop: 10,
      zIndex: 50,
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -6 },
          shadowOpacity: 0.35,
          shadowRadius: 16,
        },
        android: { elevation: 10 },
      }),
    },
    tabButton: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 2,
    },
    iconContainer: {
      marginBottom: 0,
    },
  });
}

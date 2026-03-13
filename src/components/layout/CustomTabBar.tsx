import { Ionicons } from "@expo/vector-icons";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { FONTS } from "../../constants/fonts";
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
  const { theme } = useTheme();

  const styles = createStyles(theme);

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
  const scale = useSharedValue(1);

  const styles = createStyles(theme);

  React.useEffect(() => {
    scale.value = withTiming(isFocused ? 1.05 : 1, { duration: 200 });
  }, [isFocused, scale]);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const activeColor = theme.primary.main;
  const inactiveColor = "rgba(255,255,255,0.55)";
  const color = isFocused ? activeColor : inactiveColor;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.tabButton}
    >
      <View
        style={[
          styles.tabItemContainer,
          isFocused && { backgroundColor: activeColor + "1A" },
        ]}
      >
        <Animated.View style={[styles.iconContainer, animatedIconStyle]}>
          <Ionicons name={iconName} size={22} color={color} />
        </Animated.View>
        <Text style={[styles.label, { color }]}>
          {t(("tabs." + routeName.toLowerCase()) as any)}
        </Text>
      </View>
    </Pressable>
  );
}

function createStyles(theme: any) {
  return StyleSheet.create({
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
    tabButton: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      height: "100%",
    },
    tabItemContainer: {
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 16,
      paddingVertical: 6,
      borderRadius: 16,
    },
    iconContainer: {
      alignItems: "center",
      justifyContent: "center",
    },
    label: {
      fontFamily: FONTS.medium,
      fontSize: 11,
      marginTop: 4,
    },
  });
}

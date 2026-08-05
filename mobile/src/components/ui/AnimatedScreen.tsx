import { useFocusEffect } from "expo-router";
import React, { useCallback } from "react";
import { StyleProp, ViewStyle } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

interface AnimatedScreenProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Direction for the slide in effect. */
  direction?: "up" | "down" | "left" | "right";
  /** Offset distance in px for the slide. */
  offset?: number;
  /** Duration in ms. */
  duration?: number;
}

/**
 * Wraps a tab/screen to run a smooth fade + slide animation
 * every time it gains focus.
 */
export function AnimatedScreen({
  children,
  style,
  direction = "up",
  offset = 24,
  duration = 360,
}: AnimatedScreenProps) {
  const opacity = useSharedValue(0);
  const translate = useSharedValue(offset);

  useFocusEffect(
    useCallback(() => {
      opacity.value = 0;
      translate.value = offset;
      opacity.value = withTiming(1, {
        duration,
        easing: Easing.out(Easing.cubic),
      });
      translate.value = withTiming(0, {
        duration,
        easing: Easing.out(Easing.cubic),
      });
      return () => {};
    }, [opacity, translate, offset, duration]),
  );

  const animatedStyle = useAnimatedStyle(() => {
    const t = translate.value;
    let transform: any[] = [];
    switch (direction) {
      case "up":
        transform = [{ translateY: t }];
        break;
      case "down":
        transform = [{ translateY: -t }];
        break;
      case "left":
        transform = [{ translateX: t }];
        break;
      case "right":
        transform = [{ translateX: -t }];
        break;
    }
    return {
      opacity: opacity.value,
      transform,
    };
  });

  return (
    <Animated.View style={[{ flex: 1 }, style, animatedStyle]}>
      {children}
    </Animated.View>
  );
}

export default AnimatedScreen;

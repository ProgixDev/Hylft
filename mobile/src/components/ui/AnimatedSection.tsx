import { useFocusEffect } from "expo-router";
import React, { useCallback } from "react";
import { StyleProp, ViewStyle } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

interface AnimatedSectionProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Stagger delay in ms before the animation starts. */
  delay?: number;
  /** Slide offset in px. */
  offset?: number;
  /** Slide direction. */
  direction?: "up" | "down" | "left" | "right";
  /** Duration in ms. */
  duration?: number;
  /** When true, also scale in slightly for a pop effect. */
  scale?: boolean;
}

/**
 * Plays a fade + slide (+ optional scale) entrance every time the parent
 * screen gains focus. Used to stagger sections/cards on the home page.
 */
export function AnimatedSection({
  children,
  style,
  delay = 0,
  offset = 20,
  direction = "up",
  duration = 420,
  scale = false,
}: AnimatedSectionProps) {
  const opacity = useSharedValue(0);
  const translate = useSharedValue(offset);
  const scaleVal = useSharedValue(scale ? 0.94 : 1);

  useFocusEffect(
    useCallback(() => {
      opacity.value = 0;
      translate.value = offset;
      scaleVal.value = scale ? 0.94 : 1;

      const easing = Easing.out(Easing.cubic);
      opacity.value = withDelay(delay, withTiming(1, { duration, easing }));
      translate.value = withDelay(delay, withTiming(0, { duration, easing }));
      if (scale) {
        scaleVal.value = withDelay(delay, withTiming(1, { duration, easing }));
      }
      return () => {};
    }, [opacity, translate, scaleVal, delay, offset, duration, scale]),
  );

  const animatedStyle = useAnimatedStyle(() => {
    const t = translate.value;
    const translateTransform =
      direction === "up"
        ? { translateY: t }
        : direction === "down"
          ? { translateY: -t }
          : direction === "left"
            ? { translateX: t }
            : { translateX: -t };
    return {
      opacity: opacity.value,
      transform: [translateTransform, { scale: scaleVal.value }],
    };
  });

  return (
    <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
  );
}

export default AnimatedSection;

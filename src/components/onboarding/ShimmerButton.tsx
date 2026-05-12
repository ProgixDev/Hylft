import React, { useEffect } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../../theme/colors";
import { fontFamilies, type } from "../../theme/typography";
import { spacing, timings } from "../../theme/spacing";

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
};

const BUTTON_WIDTH_FALLBACK = 320;

export default function ShimmerButton({
  label,
  onPress,
  disabled = false,
  style,
}: Props) {
  const [width, setWidth] = React.useState(BUTTON_WIDTH_FALLBACK);
  const pressed = useSharedValue(0);
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, {
        duration: timings.shimmerMs,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      false,
    );
  }, [shimmer]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - pressed.value * 0.02 }],
  }));

  const shimmerWidth = width * 0.3;
  const shimmerStyle = useAnimatedStyle(() => {
    const translateX =
      -shimmerWidth + shimmer.value * (width + shimmerWidth * 1.4);
    return {
      transform: [{ translateX }, { skewX: "-20deg" }],
    };
  });

  const overlayPressedStyle = useAnimatedStyle(() => ({
    opacity: pressed.value,
  }));

  return (
    <Animated.View style={[containerStyle, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={disabled ? undefined : onPress}
        onPressIn={() => {
          pressed.value = withTiming(1, { duration: timings.ctaPressMs });
        }}
        onPressOut={() => {
          pressed.value = withTiming(0, { duration: timings.ctaPressMs });
        }}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        disabled={disabled}
        style={({ pressed: isPressed }) => [
          styles.button,
          { opacity: disabled ? 0.4 : 1, overflow: "hidden" },
          isPressed && { backgroundColor: colors.bluePressed },
        ]}
      >
        <LinearGradient
          colors={[colors.blue, colors.blueBright]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: colors.bluePressed },
            overlayPressedStyle,
          ]}
        />
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.insetTop]} />
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.insetBottom]} />
        <Animated.View
          pointerEvents="none"
          style={[
            styles.shimmer,
            { width: shimmerWidth },
            shimmerStyle,
          ]}
        >
          <LinearGradient
            colors={[
              "rgba(255,255,255,0)",
              "rgba(255,255,255,0.4)",
              "rgba(255,255,255,0)",
            ]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
        <Text style={styles.label}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    height: spacing.ctaHeight,
    borderRadius: spacing.ctaRadius,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.blue,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.55,
    shadowRadius: 18,
    elevation: 10,
  },
  insetTop: {
    height: 1,
    bottom: undefined,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  insetBottom: {
    top: undefined,
    height: 2,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  shimmer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
  },
  label: {
    ...type.cta,
    fontFamily: fontFamilies.inter700,
    color: colors.white,
  },
});

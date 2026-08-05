import { Ionicons } from "@expo/vector-icons";
import React, { useCallback } from "react";
import { Image, StyleSheet } from "react-native";
import { TapGestureHandler } from "react-native-gesture-handler";
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from "react-native-reanimated";

interface LikeableImageProps {
  uri: string;
  style?: any;
  onLike?: () => void;
  isLiked?: boolean;
}

export default function LikeableImage({
  uri,
  style,
  onLike,
  isLiked = false,
}: LikeableImageProps) {
  const tapCount = useSharedValue(0);
  const trophyScale = useSharedValue(0);
  const trophyOpacity = useSharedValue(0);

  const handleDoubleTap = useCallback(() => {
    tapCount.value = tapCount.value + 1;

    // Always show trophy animation for UX
    // Animate trophy
    trophyScale.value = 0;
    trophyOpacity.value = 1;

    // Fast spring animation
    trophyScale.value = withSpring(1.2, {
      damping: 3,
      stiffness: 250,
    });

    // Fade out quickly
    setTimeout(() => {
      trophyOpacity.value = withTiming(0, {
        duration: 300,
        easing: Easing.inOut(Easing.ease),
      });
    }, 300);

    // Only trigger like callback if not already liked
    if (!isLiked) {
      onLike?.();
    }
  }, [isLiked, onLike, tapCount, trophyScale, trophyOpacity]);

  const trophyAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: trophyScale.value }],
    opacity: trophyOpacity.value,
  }));

  return (
    <TapGestureHandler
      numberOfTaps={2}
      onActivated={handleDoubleTap}
      waitFor={[]}
    >
      <Animated.View style={style}>
        <Image source={{ uri }} style={styles.image} />

        {/* Trophy overlay - shown on double tap */}
        <Animated.View
          style={[styles.trophyContainer, trophyAnimatedStyle]}
          pointerEvents="none"
        >
          <Ionicons name="trophy" size={60} color="#FFD700" />
        </Animated.View>
      </Animated.View>
    </TapGestureHandler>
  );
}

const styles = StyleSheet.create({
  image: {
    width: "100%",
    height: "100%",
  },
  trophyContainer: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -30,
    marginTop: -30,
    width: 60,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
  },
});

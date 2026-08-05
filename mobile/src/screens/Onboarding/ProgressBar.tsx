import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../../theme/colors";
import { spacing, timings } from "../../theme/spacing";

type Props = {
  activeIndex: 0 | 1 | 2;
};

export default function ProgressBar({ activeIndex }: Props) {
  return (
    <View style={styles.root}>
      {[0, 1, 2].map((i) => (
        <Segment key={i} index={i} activeIndex={activeIndex} />
      ))}
    </View>
  );
}

function Segment({
  index,
  activeIndex,
}: {
  index: number;
  activeIndex: number;
}) {
  const progress = useSharedValue(
    index < activeIndex ? 1 : index > activeIndex ? 0 : 0,
  );

  useEffect(() => {
    if (index < activeIndex) {
      progress.value = 1;
    } else if (index > activeIndex) {
      progress.value = 0;
    } else {
      progress.value = 0;
      progress.value = withTiming(1, {
        duration: timings.slideHoldMs,
        easing: Easing.linear,
      });
    }
  }, [activeIndex, index, progress]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View style={styles.seg}>
      <Animated.View style={[styles.fillWrap, fillStyle]}>
        <LinearGradient
          colors={[colors.blue, colors.blueLight]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.fill}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: "absolute",
    top: spacing.progressTopOffset,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.progressInsetH,
    flexDirection: "row",
    gap: spacing.progressSegmentGap,
    zIndex: 4,
  },
  seg: {
    flex: 1,
    height: spacing.progressSegmentHeight,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.12)",
    overflow: "hidden",
  },
  fillWrap: {
    height: "100%",
    overflow: "hidden",
    borderRadius: 2,
    shadowColor: colors.blue,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 6,
  },
  fill: {
    flex: 1,
    borderRadius: 2,
  },
});

import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "../../contexts/ThemeContext";

/**
 * A skeleton placeholder with a highlight band that sweeps left→right,
 * instead of a flat opacity pulse. The band is a horizontal gradient
 * (transparent → highlight → transparent) translated across the element's
 * measured width, clipped to its rounded corners.
 */
export function Shimmer({
  style,
  baseColor,
  highlightColor,
}: {
  style?: any;
  baseColor: string;
  highlightColor: string;
}) {
  const [width, setWidth] = useState(0);
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 1100, easing: Easing.linear }),
      -1,
      false,
    );
  }, [progress]);

  const animated = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(progress.value, [0, 1], [-width, width]) },
    ],
  }));

  return (
    <View
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width;
        if (w && Math.abs(w - width) > 1) setWidth(w);
      }}
      style={[
        { backgroundColor: baseColor, borderRadius: 8, overflow: "hidden" },
        style,
      ]}
    >
      {width > 0 && (
        <Animated.View style={[StyleSheet.absoluteFill, animated]}>
          <LinearGradient
            colors={["transparent", highlightColor, "transparent"]}
            locations={[0, 0.5, 1]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      )}
    </View>
  );
}

export function PostSkeleton() {
  const { theme } = useTheme();
  const isDark = theme.background.dark === "#0B0D0E";
  const base = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const highlight = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.10)";

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Shimmer
          style={styles.avatar}
          baseColor={base}
          highlightColor={highlight}
        />
        <View style={{ flex: 1, gap: 6 }}>
          <Shimmer
            style={{ height: 12, width: "45%", borderRadius: 6 }}
            baseColor={base}
            highlightColor={highlight}
          />
          <Shimmer
            style={{ height: 10, width: "25%", borderRadius: 6 }}
            baseColor={base}
            highlightColor={highlight}
          />
        </View>
      </View>

      <View style={{ gap: 6, marginTop: 14 }}>
        <Shimmer
          style={{ height: 12, width: "92%", borderRadius: 6 }}
          baseColor={base}
          highlightColor={highlight}
        />
        <Shimmer
          style={{ height: 12, width: "76%", borderRadius: 6 }}
          baseColor={base}
          highlightColor={highlight}
        />
      </View>

      <Shimmer
        style={styles.media}
        baseColor={base}
        highlightColor={highlight}
      />

      <View style={styles.actionsRow}>
        <Shimmer
          style={styles.actionPill}
          baseColor={base}
          highlightColor={highlight}
        />
        <Shimmer
          style={styles.actionPill}
          baseColor={base}
          highlightColor={highlight}
        />
        <Shimmer
          style={styles.actionPill}
          baseColor={base}
          highlightColor={highlight}
        />
      </View>
    </View>
  );
}

export function PostSkeletonList({ count = 3 }: { count?: number }) {
  return (
    <View>
      {Array.from({ length: count }).map((_, i) => (
        <PostSkeleton key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginHorizontal: 12,
    marginVertical: 6,
    borderRadius: 18,
    backgroundColor: "rgba(127,127,127,0.04)",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  media: {
    width: "100%",
    height: 200,
    borderRadius: 14,
    marginTop: 14,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  actionPill: {
    height: 22,
    width: 62,
    borderRadius: 11,
  },
});

export default PostSkeleton;

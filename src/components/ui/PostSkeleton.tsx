import React, { useEffect } from "react";
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

export function Shimmer({
  style,
  baseColor,
  highlightColor,
}: {
  style?: any;
  baseColor: string;
  highlightColor: string;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      false,
    );
  }, [progress]);

  const animated = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.5, 1], [0.5, 1, 0.5]),
    backgroundColor: progress.value > 0.5 ? highlightColor : baseColor,
  }));

  return (
    <Animated.View
      style={[{ backgroundColor: baseColor, borderRadius: 8 }, style, animated]}
    />
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

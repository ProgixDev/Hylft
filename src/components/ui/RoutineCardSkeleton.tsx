import React from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { Shimmer } from "./PostSkeleton";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type Props = {
  compact?: boolean;
};

export function RoutineCardSkeleton({ compact = false }: Props) {
  const { themeType } = useTheme();
  const isDark = themeType === "dark";

  const base = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const highlight = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.10)";
  const surfaceBg = isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.025)";

  return (
    <View style={[styles.card, { backgroundColor: surfaceBg }]}>
      <View style={styles.body}>
        {/* Top row: title placeholder + completed pill placeholder */}
        <View style={styles.topRow}>
          <Shimmer
            style={{ height: 16, width: "55%", borderRadius: 6 }}
            baseColor={base}
            highlightColor={highlight}
          />
          <Shimmer
            style={{ height: 12, width: 30, borderRadius: 6 }}
            baseColor={base}
            highlightColor={highlight}
          />
        </View>

        {/* Stats placeholder — flat row of shimmers, no container box */}
        {compact ? (
          <View style={styles.statsStack}>
            <Shimmer
              style={{ height: 12, width: "70%", borderRadius: 6 }}
              baseColor={base}
              highlightColor={highlight}
            />
            <Shimmer
              style={{ height: 12, width: "55%", borderRadius: 6 }}
              baseColor={base}
              highlightColor={highlight}
            />
            <Shimmer
              style={{ height: 12, width: "60%", borderRadius: 6 }}
              baseColor={base}
              highlightColor={highlight}
            />
          </View>
        ) : (
          <View style={styles.statsRow}>
            <Shimmer
              style={{ height: 14, width: 48, borderRadius: 6 }}
              baseColor={base}
              highlightColor={highlight}
            />
            <Shimmer
              style={{ height: 14, width: 48, borderRadius: 6 }}
              baseColor={base}
              highlightColor={highlight}
            />
            <Shimmer
              style={{ height: 14, width: 48, borderRadius: 6 }}
              baseColor={base}
              highlightColor={highlight}
            />
          </View>
        )}

        {/* Bottom row: muscles placeholder + play button placeholder */}
        <View style={styles.bottomRow}>
          <Shimmer
            style={{ height: 11, width: "50%", borderRadius: 6 }}
            baseColor={base}
            highlightColor={highlight}
          />
          <Shimmer
            style={styles.startBtn}
            baseColor={base}
            highlightColor={highlight}
          />
        </View>
      </View>
    </View>
  );
}

export function RoutineCardSkeletonList({
  count = 4,
  compact = false,
  layout = "list",
}: {
  count?: number;
  compact?: boolean;
  layout?: "list" | "grid";
}) {
  if (layout === "grid") {
    return (
      <View style={styles.grid}>
        {Array.from({ length: count }).map((_, i) => (
          <View key={i} style={styles.gridCell}>
            <RoutineCardSkeleton compact={compact} />
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, i) => (
        <RoutineCardSkeleton key={i} compact={compact} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 12,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 12,
  },
  gridCell: {
    width: (SCREEN_WIDTH - 40 - 12) / 2,
  },
  card: {
    width: "100%",
    borderRadius: 14,
    overflow: "hidden",
  },
  body: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 14,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  statsStack: {
    gap: 8,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  startBtn: {
    width: 36,
    height: 36,
    borderRadius: 999,
  },
});

export default RoutineCardSkeleton;

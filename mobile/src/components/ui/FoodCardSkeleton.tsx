import React from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { Shimmer } from "./PostSkeleton";

export function FoodCardSkeleton() {
  const { theme } = useTheme();
  const isDark = theme.background.dark === "#0B0D0E";
  const base = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)";
  const highlight = isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.10)";

  return (
    <View
      style={[
        styles.card,
        { borderBottomColor: `${theme.foreground.gray}22` },
      ]}
    >
      <Shimmer style={styles.image} baseColor={base} highlightColor={highlight} />

      <View style={styles.info}>
        <Shimmer
          style={{ height: 14, width: "82%", borderRadius: 6 }}
          baseColor={base}
          highlightColor={highlight}
        />
        <Shimmer
          style={{ height: 14, width: "54%", borderRadius: 6 }}
          baseColor={base}
          highlightColor={highlight}
        />
        <Shimmer
          style={{ height: 9, width: 64, borderRadius: 5, marginTop: 2 }}
          baseColor={base}
          highlightColor={highlight}
        />
        <View style={styles.chipsRow}>
          <Shimmer style={styles.chip} baseColor={base} highlightColor={highlight} />
          <Shimmer style={styles.chip} baseColor={base} highlightColor={highlight} />
          <Shimmer style={styles.chip} baseColor={base} highlightColor={highlight} />
        </View>
      </View>

      <Shimmer
        style={styles.addBtn}
        baseColor={base}
        highlightColor={highlight}
      />
    </View>
  );
}

export function FoodCardSkeletonList({ count = 6 }: { count?: number }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, i) => (
        <FoodCardSkeleton key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingVertical: 4,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  image: {
    width: 86,
    height: 86,
    borderRadius: 7,
  },
  info: {
    flex: 1,
    gap: 7,
  },
  chipsRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 3,
  },
  chip: {
    height: 22,
    width: 52,
    borderRadius: 999,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
});

export default FoodCardSkeleton;

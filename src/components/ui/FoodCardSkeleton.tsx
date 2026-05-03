import React from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { Shimmer } from "./PostSkeleton";

export function FoodCardSkeleton() {
  const { theme } = useTheme();
  const isDark = theme.background.dark === "#0B0D0E";
  const base = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const highlight = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.10)";

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.background.darker,
          borderColor: theme.background.accent,
        },
      ]}
    >
      <Shimmer
        style={styles.avatar}
        baseColor={base}
        highlightColor={highlight}
      />
      <View style={{ flex: 1, gap: 6 }}>
        <Shimmer
          style={{ height: 12, width: "75%", borderRadius: 6 }}
          baseColor={base}
          highlightColor={highlight}
        />
        <Shimmer
          style={{ height: 14, width: 90, borderRadius: 20 }}
          baseColor={base}
          highlightColor={highlight}
        />
        <Shimmer
          style={{ height: 10, width: "60%", borderRadius: 6 }}
          baseColor={base}
          highlightColor={highlight}
        />
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 12,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
});

export default FoodCardSkeleton;

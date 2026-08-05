import React from "react";
import { Platform, StyleSheet, View, type ViewStyle } from "react-native";
import { BlurView } from "expo-blur";
import { colors } from "../../theme/colors";
import { spacing } from "../../theme/spacing";

type Props = {
  children: React.ReactNode;
  style?: ViewStyle;
};

export default function GlassCard({ children, style }: Props) {
  return (
    <View style={[styles.outer, style]}>
      {Platform.OS !== "web" && (
        <BlurView
          intensity={30}
          tint="dark"
          style={StyleSheet.absoluteFill}
        />
      )}
      <View style={styles.tint} />
      <View style={styles.inner}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderRadius: spacing.glassRadius,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    overflow: "hidden",
    backgroundColor: "rgba(10,18,39,0.4)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 6,
  },
  tint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.glassBg,
  },
  inner: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
});

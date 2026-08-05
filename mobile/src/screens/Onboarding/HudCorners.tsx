import React from "react";
import { StyleSheet, View } from "react-native";
import { colors } from "../../theme/colors";
import { spacing } from "../../theme/spacing";

export default function HudCorners() {
  const size = spacing.hudCornerSize;
  return (
    <View pointerEvents="none" style={styles.root}>
      <View style={[styles.corner, styles.tl, { width: size, height: size }]} />
      <View style={[styles.corner, styles.tr, { width: size, height: size }]} />
      <View style={[styles.corner, styles.bl, { width: size, height: size }]} />
      <View style={[styles.corner, styles.br, { width: size, height: size }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: "absolute",
    top: spacing.hudCornerInsetTop,
    bottom: spacing.hudCornerInsetBottom,
    left: spacing.hudCornerInsetSide,
    right: spacing.hudCornerInsetSide,
    zIndex: 2,
  },
  corner: {
    position: "absolute",
    borderColor: colors.hudStrokeStrong,
  },
  tl: {
    top: 0,
    left: 0,
    borderTopWidth: 1,
    borderLeftWidth: 1,
  },
  tr: {
    top: 0,
    right: 0,
    borderTopWidth: 1,
    borderRightWidth: 1,
  },
  bl: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 1,
    borderLeftWidth: 1,
  },
  br: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 1,
    borderRightWidth: 1,
  },
});

import React from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";
import { colors } from "../../theme/colors";

type Props = {
  children?: React.ReactNode;
  style?: ViewStyle;
};

export default function MeshBackground({ children, style }: Props) {
  return (
    <View style={[styles.root, style]}>
      <LinearGradient
        colors={[colors.navyDeep, colors.navyAbyss]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      <Svg
        style={StyleSheet.absoluteFill}
        width="100%"
        height="100%"
        preserveAspectRatio="none"
      >
        <Defs>
          <RadialGradient
            id="meshTop"
            cx="50%"
            cy="0%"
            rx="120%"
            ry="80%"
            fx="50%"
            fy="0%"
            gradientUnits="objectBoundingBox"
          >
            <Stop offset="0%" stopColor="#2D7FF9" stopOpacity="0.30" />
            <Stop offset="60%" stopColor="#2D7FF9" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient
            id="meshBottom"
            cx="100%"
            cy="100%"
            rx="80%"
            ry="60%"
            fx="100%"
            fy="100%"
            gradientUnits="objectBoundingBox"
          >
            <Stop offset="0%" stopColor="#2D7FF9" stopOpacity="0.20" />
            <Stop offset="70%" stopColor="#2D7FF9" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#meshTop)" />
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#meshBottom)" />
      </Svg>

      <Scanlines />

      {children}
    </View>
  );
}

function Scanlines() {
  const lines = [];
  for (let y = 0; y < 1200; y += 3) {
    lines.push(
      <View
        key={y}
        style={[styles.scanline, { top: y, backgroundColor: colors.scanline }]}
      />,
    );
  }
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {lines}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.navyDeep,
    overflow: "hidden",
  },
  scanline: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
  },
});

import React from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Text as SvgText } from "react-native-svg";
import { colors } from "../../theme/colors";
import { fontFamilies } from "../../theme/typography";

type Props = {
  value: "01" | "02" | "03";
};

export default function BackgroundNumeral({ value }: Props) {
  return (
    <View pointerEvents="none" style={styles.root}>
      <Svg width={180} height={140}>
        <SvgText
          x={0}
          y={120}
          fontFamily={fontFamilies.mono700}
          fontWeight="700"
          fontSize={120}
          fill="transparent"
          stroke={colors.hudStroke}
          strokeWidth={1}
        >
          {value}
        </SvgText>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: "absolute",
    top: 90,
    right: 12,
    zIndex: 2,
  },
});

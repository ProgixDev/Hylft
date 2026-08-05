import React from "react";
import { Text, type TextStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
import { colors } from "../../theme/colors";

type Props = {
  text: string;
  style?: TextStyle | TextStyle[];
};

export default function GradientText({ text, style }: Props) {
  return (
    <MaskedView
      maskElement={<Text style={style}>{text}</Text>}
    >
      <LinearGradient
        colors={[colors.blue, colors.blueLight]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
      >
        <Text style={[style, { opacity: 0 }]}>{text}</Text>
      </LinearGradient>
    </MaskedView>
  );
}

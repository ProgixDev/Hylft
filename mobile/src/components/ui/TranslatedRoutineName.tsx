import React from "react";
import { TextProps } from "react-native";
import { Text } from "./ScaledText";
import { translateApiData } from "../../utils/exerciseTranslator";

interface Props extends TextProps {
  name: string;
}

export function TranslatedRoutineName({ name, ...props }: Props) {
  const translatedName = translateApiData(name);

  return <Text {...props}>{translatedName}</Text>;
}

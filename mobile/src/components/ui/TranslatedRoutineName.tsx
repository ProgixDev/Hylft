import React from "react";
import { Text, TextProps } from "react-native";
import { translateApiData } from "../../utils/exerciseTranslator";

interface Props extends TextProps {
  name: string;
}

export function TranslatedRoutineName({ name, ...props }: Props) {
  const translatedName = translateApiData(name);

  return <Text {...props}>{translatedName}</Text>;
}

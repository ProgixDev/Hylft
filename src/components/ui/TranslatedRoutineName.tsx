import React from "react";
import { Text, TextProps } from "react-native";
import { useTranslation } from "react-i18next";
import { translateRoutineName } from "../../utils/exerciseTranslator";

interface Props extends TextProps {
  name: string;
}

export function TranslatedRoutineName({ name, ...props }: Props) {
  const { i18n } = useTranslation();
  const translatedName =
    i18n.language === "fr" ? translateRoutineName(name) : name;

  return <Text {...props}>{translatedName}</Text>;
}

import React from "react";
import { Text, TextProps } from "react-native";
import { useTranslation } from "react-i18next";
import { translateExerciseName } from "../../utils/exerciseTranslator";

interface Props extends TextProps {
  name: string;
}

export function TranslatedExerciseName({ name, ...props }: Props) {
  const { i18n } = useTranslation();
  const translatedName =
    i18n.language === "fr" ? translateExerciseName(name) : name;

  return <Text {...props}>{translatedName}</Text>;
}

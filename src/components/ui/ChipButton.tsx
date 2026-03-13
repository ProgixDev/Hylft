import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { FONTS } from "../../constants/fonts";
import { Theme } from "../../constants/themes";
import { useTheme } from "../../contexts/ThemeContext";

interface ChipButtonProps {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  disabled?: boolean;
}

export default function ChipButton({
  label,
  onPress,
  variant = "primary",
  size = "md",
  fullWidth = false,
  disabled = false,
}: ChipButtonProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <Pressable
      style={[
        styles.base,
        variant === "primary" ? styles.primary : styles.secondary,
        size === "sm" ? styles.sm : size === "lg" ? styles.lg : styles.md,
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text
        style={[
          styles.text,
          variant === "primary" ? styles.primaryText : styles.secondaryText,
          size === "lg" && styles.lgText,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    base: {
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
    },
    primary: {
      backgroundColor: theme.primary.main,
    },
    secondary: {
      backgroundColor: "transparent",
    },
    sm: {
      paddingVertical: 10,
      paddingHorizontal: 20,
    },
    md: {
      paddingVertical: 14,
      paddingHorizontal: 28,
    },
    lg: {
      paddingVertical: 18,
      paddingHorizontal: 32,
    },
    fullWidth: {
      width: "100%",
    },
    disabled: {
      opacity: 0.4,
    },
    text: {
      fontFamily: FONTS.bold,
      fontSize: 16,
    },
    primaryText: {
      color: theme.background.dark,
    },
    secondaryText: {
      color: theme.foreground.gray,
    },
    lgText: {
      fontSize: 18,
    },
  });
}

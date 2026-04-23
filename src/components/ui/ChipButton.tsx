import React from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { FONTS } from "../../constants/fonts";
import { Theme } from "../../constants/themes";
import { useTheme } from "../../contexts/ThemeContext";

interface ChipButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "chip" | "white" | "google";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  loading?: boolean;
}

const SIZE_CONFIG = {
  sm: { height: 32, paddingHorizontal: 16, fontSize: 13 },
  md: { height: 44, paddingHorizontal: 24, fontSize: 15 },
  lg: { height: 52, paddingHorizontal: 32, fontSize: 17 },
} as const;

export default function ChipButton({
  title,
  onPress,
  variant = "primary",
  size = "md",
  fullWidth = false,
  disabled = false,
  icon,
  iconPosition = "left",
  loading = false,
}: ChipButtonProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const config = SIZE_CONFIG[size];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        {
          height: config.height,
          minHeight: 44,
          paddingHorizontal: config.paddingHorizontal,
          borderRadius: config.height / 2,
        },
        variant === "primary" && styles.primary,
        variant === "secondary" && styles.secondary,
        variant === "chip" && styles.chip,
        variant === "white" && styles.white,
        variant === "google" && styles.google,
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        pressed && !isDisabled && { opacity: 0.8 },
      ]}
      onPress={onPress}
      disabled={isDisabled}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={
            variant === "secondary"
              ? theme.primary.main
              : variant === "google"
                ? GOOGLE_BLUE
              : variant === "white"
                ? theme.background.dark
                : theme.background.dark
          }
        />
      ) : (
        <View style={styles.content}>
          {icon && iconPosition === "left" && <View style={styles.iconLeft}>{icon}</View>}
          <Text
            style={[
              styles.text,
              { fontSize: variant === "chip" ? 13 : config.fontSize },
              variant === "primary" && styles.primaryText,
              variant === "secondary" && styles.secondaryText,
              variant === "chip" && styles.chipText,
              variant === "white" && styles.whiteText,
              variant === "google" && styles.googleText,
            ]}
          >
            {title}
          </Text>
          {icon && iconPosition === "right" && <View style={styles.iconRight}>{icon}</View>}
        </View>
      )}
    </Pressable>
  );
}

const GOOGLE_BLUE = "#1A73E8";

function createStyles(theme: Theme) {
  return StyleSheet.create({
    base: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },
    primary: {
      backgroundColor: theme.primary.main,
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.15,
          shadowRadius: 4,
        },
        android: {
          elevation: 3,
        },
      }),
    },
    secondary: {
      backgroundColor: "transparent",
      borderWidth: 1.5,
      borderColor: theme.primary.main,
    },
    chip: {
      backgroundColor: theme.primary.main,
    },
    white: {
      backgroundColor: "#FFFFFF",
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.12,
          shadowRadius: 4,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    google: {
      backgroundColor: "#FFFFFF",
      borderWidth: 1,
      borderColor: GOOGLE_BLUE,
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 4,
        },
        android: {
          elevation: 1,
        },
      }),
    },
    fullWidth: {
      width: "100%",
    },
    disabled: {
      opacity: 0.4,
    },
    content: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },
    iconLeft: {
      marginRight: 10,
    },
    iconRight: {
      marginLeft: 10,
    },
    text: {
      fontFamily: FONTS.semiBold,
    },
    primaryText: {
      color: theme.background.dark,
    },
    secondaryText: {
      color: theme.primary.main,
    },
    chipText: {
      fontFamily: FONTS.medium,
      color: theme.background.dark,
    },
    whiteText: {
      color: theme.background.dark,
    },
    googleText: {
      color: GOOGLE_BLUE,
    },
  });
}

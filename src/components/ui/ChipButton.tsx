import React from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  StyleProp,
  Text,
  TextStyle,
  View,
  ViewStyle,
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
  threeD?: boolean;
  depthColor?: string;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

const SIZE_CONFIG = {
  sm: { height: 32, paddingHorizontal: 16, fontSize: 13 },
  md: { height: 44, paddingHorizontal: 24, fontSize: 15 },
  lg: { height: 56, paddingHorizontal: 32, fontSize: 16 },
} as const;

const DEFAULT_BORDER_RADIUS = 10;

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
  threeD = false,
  depthColor,
  borderRadius,
  style,
  textStyle,
}: ChipButtonProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const config = SIZE_CONFIG[size];
  const isDisabled = disabled || loading;
  const radius = borderRadius ?? DEFAULT_BORDER_RADIUS;
  const isThreeD = threeD && variant === "primary";
  const primaryDepthColor = depthColor ?? getPrimaryDepthColor(theme.primary.main);

  const renderContent = () =>
    loading ? (
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
            textStyle,
          ]}
        >
          {title}
        </Text>
        {icon && iconPosition === "right" && <View style={styles.iconRight}>{icon}</View>}
      </View>
    );

  if (isThreeD) {
    return (
      <Pressable
        style={({ pressed }) => [
          styles.threeDShell,
          fullWidth && styles.fullWidth,
          isDisabled && styles.disabled,
          pressed && !isDisabled && styles.threeDShellPressed,
          style,
        ]}
        onPress={onPress}
        disabled={isDisabled}
        android_ripple={{ color: "rgba(255,255,255,0.14)" }}
      >
        {({ pressed }) => (
          <View
            style={[
              styles.threeDBase,
              {
                borderRadius: radius,
                backgroundColor: primaryDepthColor,
              },
            ]}
          >
            <View
              style={[
                styles.base,
                styles.primary,
                {
                  height: config.height,
                  minHeight: 44,
                  paddingHorizontal: config.paddingHorizontal,
                  borderRadius: radius,
                  transform: [{ translateY: pressed && !isDisabled ? 8 : 0 }],
                },
              ]}
            >
              {renderContent()}
            </View>
          </View>
        )}
      </Pressable>
    );
  }

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        {
          height: config.height,
          minHeight: 44,
          paddingHorizontal: config.paddingHorizontal,
          borderRadius: radius,
        },
        variant === "primary" && styles.primary,
        variant === "secondary" && styles.secondary,
        variant === "chip" && styles.chip,
        variant === "white" && styles.white,
        variant === "google" && styles.google,
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
    >
      {renderContent()}
    </Pressable>
  );
}

const GOOGLE_BLUE = "#1A73E8";

function getPrimaryDepthColor(primary: string) {
  if (primary.toUpperCase() === "#D4A44C") return "#8A6424";
  if (primary.toUpperCase() === "#C48A6A") return "#8A5B43";
  return "#071527";
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    base: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    threeDShell: {
      borderRadius: DEFAULT_BORDER_RADIUS,
      ...Platform.select({
        ios: {
          shadowColor: "#071527",
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.16,
          shadowRadius: 14,
        },
        android: {
          elevation: 5,
        },
      }),
    },
    threeDShellPressed: {
      transform: [{ scale: 0.99 }],
    },
    threeDBase: {
      paddingBottom: 9,
      overflow: "hidden",
    },
    primary: {
      backgroundColor: theme.primary.main,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.22)",
      ...Platform.select({
        ios: {
          shadowColor: theme.primary.main,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.28,
          shadowRadius: 16,
        },
        android: {
          elevation: 6,
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
      opacity: 0.45,
    },
    pressed: {
      opacity: 0.88,
      transform: [{ translateY: 1 }],
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
      fontFamily: FONTS.bold,
    },
    secondaryText: {
      color: theme.primary.main,
    },
    chipText: {
      fontFamily: FONTS.medium,
      color: theme.background.dark,
    },
    whiteText: {
      color: "#111111",
    },
    googleText: {
      color: GOOGLE_BLUE,
    },
  });
}

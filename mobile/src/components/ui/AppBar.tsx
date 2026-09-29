import React from "react";
import {
  StyleSheet,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
  type TextStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Text } from "./ScaledText";
import { FONTS } from "../../constants/fonts";
import { useTheme } from "../../contexts/ThemeContext";

export interface AppBarProps {
  title?: string | React.ReactNode;
  titleAlign?: "left" | "center";
  showBack?: boolean;
  onBack?: () => void;
  leading?: React.ReactNode;
  actions?: React.ReactNode;
  backgroundColor?: string;
  color?: string;
  bordered?: boolean;
  borderColor?: string;
  style?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
}

export default function AppBar({
  title,
  titleAlign = "left",
  showBack = true,
  onBack,
  leading,
  actions,
  backgroundColor,
  color,
  bordered = false,
  borderColor,
  style,
  titleStyle,
}: AppBarProps) {
  const router = useRouter();
  const { theme } = useTheme();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const resolvedBg = backgroundColor ?? "transparent";
  const resolvedColor = color ?? theme.foreground.white;
  const resolvedBorderColor = borderColor ?? theme.background.accent;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: resolvedBg,
          borderBottomWidth: bordered ? 1 : 0,
          borderBottomColor: resolvedBorderColor,
        },
        style,
      ]}
    >
      {/* Leading / Back Button */}
      {leading ? (
        <View style={styles.leadingContainer}>{leading}</View>
      ) : showBack ? (
        <View style={styles.leadingContainer}>
          <TouchableOpacity
            onPress={handleBack}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.backBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={resolvedColor} />
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Title */}
      <View
        style={[
          styles.titleContainer,
          titleAlign === "center" && styles.titleCenter,
        ]}
      >
        {typeof title === "string" ? (
          <Text
            style={[styles.title, { color: resolvedColor }, titleStyle]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {title}
          </Text>
        ) : (
          title
        )}
      </View>

      {/* Actions (Trailing) */}
      {actions ? (
        <View style={styles.actionsContainer}>{actions}</View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    zIndex: 10,
  },
  leadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginRight: 8,
  },
  backBtn: {
    padding: 6,
    marginLeft: -6,
  },
  titleContainer: {
    flex: 1,
    justifyContent: "center",
  },
  titleCenter: {
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    letterSpacing: 0.2,
  },
  actionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginLeft: 8,
  },
});

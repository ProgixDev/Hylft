import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { FONTS } from "../../constants/fonts";
import { Theme } from "../../constants/themes";
import { useTheme } from "../../contexts/ThemeContext";

type Variant = "default" | "destructive" | "success";

type Props = {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: Variant;
  icon?: keyof typeof Ionicons.glyphMap;
  onConfirm: () => void;
  onCancel: () => void;
};

const variantAccent = (variant: Variant, theme: Theme) => {
  if (variant === "destructive") return "#EF4444";
  if (variant === "success") return "#22C55E";
  return theme.primary.main;
};

const defaultIcon = (variant: Variant): keyof typeof Ionicons.glyphMap => {
  if (variant === "destructive") return "alert-circle";
  if (variant === "success") return "checkmark-circle";
  return "help-circle";
};

export default function ConfirmationModal({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel,
  variant = "default",
  icon,
  onConfirm,
  onCancel,
}: Props) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const accent = variantAccent(variant, theme);
  const iconName = icon ?? defaultIcon(variant);

  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          damping: 16,
          stiffness: 220,
        }),
      ]).start();
    } else {
      opacity.setValue(0);
      scale.setValue(0.92);
    }
  }, [visible, opacity, scale]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <Animated.View style={[styles.overlay, { opacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
        <Animated.View
          style={[styles.card, { transform: [{ scale }] }]}
        >
          <LinearGradient
            colors={[accent + "28", "transparent"]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.cardGlow}
            pointerEvents="none"
          />

          <View style={[styles.iconWrap, { backgroundColor: accent + "22" }]}>
            <Ionicons name={iconName} size={30} color={accent} />
          </View>

          <Text style={styles.title}>{title}</Text>
          {!!message && <Text style={styles.message}>{message}</Text>}

          <View style={styles.actions}>
            <Pressable
              onPress={onCancel}
              style={({ pressed }) => [
                styles.btn,
                styles.btnGhost,
                pressed && styles.btnPressed,
              ]}
            >
              <Text style={styles.btnGhostText} numberOfLines={2}>
                {cancelLabel ?? t("common.cancel")}
              </Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.btn,
                styles.btnPrimary,
                { backgroundColor: accent },
                pressed && styles.btnPressed,
              ]}
            >
              <Text style={styles.btnPrimaryText} numberOfLines={2}>
                {confirmLabel ?? t("common.confirm")}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.55)",
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 28,
    },
    card: {
      width: "100%",
      maxWidth: 380,
      backgroundColor: theme.background.darker,
      borderRadius: 28,
      paddingTop: 28,
      paddingBottom: 20,
      paddingHorizontal: 22,
      alignItems: "center",
      overflow: "hidden",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(255,255,255,0.06)",
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOpacity: 0.35,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: 12 },
        },
        android: { elevation: 14 },
      }),
    },
    cardGlow: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 140,
    },
    iconWrap: {
      width: 64,
      height: 64,
      borderRadius: 32,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 14,
    },
    title: {
      fontSize: 20,
      fontFamily: FONTS.extraBold,
      color: theme.foreground.white,
      textAlign: "center",
      marginBottom: 6,
    },
    message: {
      fontSize: 14,
      lineHeight: 20,
      fontFamily: FONTS.regular,
      color: theme.foreground.gray,
      textAlign: "center",
      marginBottom: 20,
      paddingHorizontal: 4,
    },
    actions: {
      flexDirection: "row",
      gap: 10,
      width: "100%",
      marginTop: 4,
    },
    btn: {
      flex: 1,
      borderRadius: 18,
      paddingVertical: 14,
      alignItems: "center",
      justifyContent: "center",
    },
    btnGhost: {
      backgroundColor: theme.background.accent,
    },
    btnGhostText: {
      color: theme.foreground.white,
      fontFamily: FONTS.bold,
      fontSize: 15,
      textAlign: "center",
    },
    btnPrimary: {
      // backgroundColor set inline from accent
    },
    btnPrimaryText: {
      color: "#FFFFFF",
      fontFamily: FONTS.extraBold,
      fontSize: 15,
      textAlign: "center",
    },
    btnPressed: {
      opacity: 0.85,
      transform: [{ scale: 0.98 }],
    },
  });

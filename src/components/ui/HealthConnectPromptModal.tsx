import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
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
import { useAuth } from "../../contexts/AuthContext";
import { useHealth } from "../../contexts/HealthContext";
import { useTheme } from "../../contexts/ThemeContext";

const SNOOZE_KEY = "@hylift_health_prompt_snoozed_until";
const DISMISSED_KEY = "@hylift_health_prompt_dismissed";
const SNOOZE_HOURS = 24;

export default function HealthConnectPromptModal() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { session } = useAuth();
  const {
    isAvailable,
    isPermissionGranted,
    isLoading,
    initialize,
    requestPermissions,
    refreshData,
  } = useHealth();

  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(40)).current;

  // Decide whether to show: signed in, not granted, not dismissed, snooze expired
  const evaluate = useCallback(async () => {
    if (!session || isLoading) return;
    if (isPermissionGranted) {
      setVisible(false);
      return;
    }
    const [dismissed, snoozedUntil] = await Promise.all([
      AsyncStorage.getItem(DISMISSED_KEY),
      AsyncStorage.getItem(SNOOZE_KEY),
    ]);
    if (dismissed === "true") return;
    if (snoozedUntil && Date.now() < Number(snoozedUntil)) return;
    setVisible(true);
  }, [session, isLoading, isPermissionGranted]);

  useEffect(() => {
    void evaluate();
  }, [evaluate]);

  useFocusEffect(
    useCallback(() => {
      void evaluate();
    }, [evaluate]),
  );

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fade, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(slide, {
          toValue: 0,
          duration: 260,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fade.setValue(0);
      slide.setValue(40);
    }
  }, [visible, fade, slide]);

  const handleConnect = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const available = isAvailable || (await initialize());
      if (!available) {
        // Device doesn't support HC/HK — don't keep nagging
        await AsyncStorage.setItem(DISMISSED_KEY, "true");
        setVisible(false);
        return;
      }
      const granted = await requestPermissions();
      if (granted) {
        await refreshData();
        await AsyncStorage.removeItem(SNOOZE_KEY);
        setVisible(false);
      } else {
        // User denied in system dialog — snooze rather than nag again now
        await snooze();
      }
    } finally {
      setBusy(false);
    }
  };

  const snooze = async () => {
    const until = Date.now() + SNOOZE_HOURS * 3600 * 1000;
    await AsyncStorage.setItem(SNOOZE_KEY, String(until));
    setVisible(false);
  };

  const styles = createStyles(theme);
  const platformLabel =
    Platform.OS === "ios" ? "Apple Health" : "Health Connect";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={snooze}
    >
      <Animated.View style={[styles.backdrop, { opacity: fade }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={snooze} />
        <Animated.View
          style={[
            styles.card,
            {
              transform: [{ translateY: slide }],
              opacity: fade,
            },
          ]}
        >
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons
              name={Platform.OS === "ios" ? "heart-pulse" : "google-fit"}
              size={36}
              color={theme.primary.main}
            />
          </View>
          <Text style={styles.title}>
            {t("healthPrompt.title", "Connectez {{platform}}", {
              platform: platformLabel,
            })}
          </Text>
          <Text style={styles.message}>
            {t(
              "healthPrompt.message",
              "Hylift peut suivre automatiquement vos pas, calories brûlées et minutes d'activité pour mettre à jour vos KPIs santé en temps réel.",
            )}
          </Text>

          <View style={styles.bullets}>
            {[
              t("healthPrompt.bullet1", "Pas quotidiens"),
              t("healthPrompt.bullet2", "Calories brûlées"),
              t("healthPrompt.bullet3", "Minutes d'activité"),
            ].map((b) => (
              <View key={b} style={styles.bulletRow}>
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={theme.primary.main}
                />
                <Text style={styles.bulletText}>{b}</Text>
              </View>
            ))}
          </View>

          <Pressable
            style={[styles.primaryBtn, busy && { opacity: 0.6 }]}
            onPress={handleConnect}
            disabled={busy}
          >
            <Text style={styles.primaryBtnText}>
              {busy
                ? t("common.loading", "Chargement...")
                : t("healthPrompt.connectNow", "Connecter maintenant")}
            </Text>
          </Pressable>
          <Pressable style={styles.secondaryBtn} onPress={snooze}>
            <Text style={styles.secondaryBtnText}>
              {t("healthPrompt.later", "Me le rappeler plus tard")}
            </Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.65)",
      justifyContent: "flex-end",
    },
    card: {
      backgroundColor: theme.background.dark,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingHorizontal: 24,
      paddingTop: 24,
      paddingBottom: 36,
      borderTopWidth: 1,
      borderColor: `${theme.primary.main}33`,
    },
    iconWrap: {
      alignSelf: "center",
      width: 72,
      height: 72,
      borderRadius: 24,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: `${theme.primary.main}22`,
      marginBottom: 16,
    },
    title: {
      fontFamily: FONTS.extraBold,
      fontSize: 22,
      color: theme.foreground.white,
      textAlign: "center",
    },
    message: {
      fontFamily: FONTS.medium,
      fontSize: 14,
      color: theme.foreground.gray,
      textAlign: "center",
      marginTop: 10,
      lineHeight: 20,
    },
    bullets: {
      marginTop: 20,
      marginBottom: 24,
      gap: 10,
    },
    bulletRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    bulletText: {
      fontFamily: FONTS.semiBold,
      fontSize: 14,
      color: theme.foreground.white,
    },
    primaryBtn: {
      backgroundColor: theme.primary.main,
      paddingVertical: 16,
      borderRadius: 16,
      alignItems: "center",
    },
    primaryBtnText: {
      fontFamily: FONTS.bold,
      fontSize: 15,
      color: "#fff",
    },
    secondaryBtn: {
      paddingVertical: 14,
      alignItems: "center",
      marginTop: 8,
    },
    secondaryBtnText: {
      fontFamily: FONTS.semiBold,
      fontSize: 14,
      color: theme.foreground.gray,
    },
  });
}

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Clipboard from "expo-clipboard";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { FONTS } from "../../constants/fonts";
import { Theme } from "../../constants/themes";
import { useTheme } from "../../contexts/ThemeContext";

const { height: SCREEN_H } = Dimensions.get("window");
const SHEET_H = Math.round(SCREEN_H * 0.62);

interface Props {
  visible: boolean;
  userId: string | null;
  username?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  onClose: () => void;
}

export default function ShareProfileModal({
  visible,
  userId,
  username,
  displayName,
  avatarUrl: _avatarUrl,
  onClose,
}: Props) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [copied, setCopied] = useState(false);

  const translateY = useRef(new Animated.Value(SHEET_H)).current;
  const backdrop = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(visible);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(backdrop, {
          toValue: 1,
          duration: 260,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (mounted) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: SHEET_H,
          duration: 260,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(backdrop, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) setMounted(false);
      });
    }
  }, [visible, translateY, backdrop, mounted]);

  const link = useMemo(
    () => (userId ? `hylift://user/${userId}` : ""),
    [userId],
  );

  const handleCopy = async () => {
    if (!link) return;
    await Clipboard.setStringAsync(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleShare = async () => {
    if (!link) return;
    try {
      await Share.share({
        message: `Decouvre ${username ? `@${username}` : displayName ?? "ce profil"} sur Hylift : ${link}`,
        url: link,
      });
    } catch {
      /* cancelled */
    }
  };

  if (!mounted) return null;

  const initial = (displayName || username || "?").trim().charAt(0).toUpperCase();

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.root}>
        <Animated.View style={[styles.backdrop, { opacity: backdrop }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            { transform: [{ translateY }] },
          ]}
        >
          <LinearGradient
            colors={[`${theme.primary.main}26`, "transparent"]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />

          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={styles.title}>Partager le profil</Text>
            <Text style={styles.subtitle}>
              Laissez les autres scanner ceci pour ouvrir votre profil
            </Text>
          </View>

          <View style={styles.qrWrap}>
            <View style={styles.qrCard}>
              {link ? (
                <QRCode
                  value={link}
                  size={180}
                  color="#0b0b0f"
                  backgroundColor="#ffffff"
                />
              ) : null}
              <View style={styles.qrCenter}>
                <View style={styles.qrCenterRing}>
                  <Text style={styles.qrCenterInitial}>{initial}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.identity}>
            <Text style={styles.name} numberOfLines={1}>
              {displayName || (username ? `@${username}` : "Profil")}
            </Text>
            {username ? (
              <Text style={styles.handle}>@{username}</Text>
            ) : null}
          </View>

          <View style={styles.actions}>
            <Pressable
              style={({ pressed }) => [
                styles.actionBtn,
                pressed && { opacity: 0.85 },
              ]}
              onPress={handleCopy}
            >
              <Ionicons
                name={copied ? "checkmark" : "link-outline"}
                size={18}
                color={theme.foreground.white}
              />
              <Text style={styles.actionText}>
                {copied ? "Copie" : "Copier le lien"}
              </Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.actionBtn,
                styles.actionPrimary,
                pressed && { opacity: 0.9 },
              ]}
              onPress={handleShare}
            >
              <Ionicons
                name="share-social"
                size={18}
                color={theme.background.dark}
              />
              <Text style={[styles.actionText, styles.actionPrimaryText]}>
                Partager
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    root: { flex: 1, justifyContent: "flex-end" },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.55)",
    },
    sheet: {
      height: SHEET_H,
      backgroundColor: theme.background.dark,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingHorizontal: 22,
      paddingBottom: 28,
      overflow: "hidden",
    },
    handle: {
      alignSelf: "center",
      width: 44,
      height: 5,
      borderRadius: 3,
      backgroundColor: "rgba(255,255,255,0.2)",
      marginTop: 10,
    },
    header: { alignItems: "center", marginTop: 14 },
    title: {
      color: theme.foreground.white,
      fontFamily: FONTS.extraBold,
      fontSize: 18,
    },
    subtitle: {
      marginTop: 4,
      color: theme.foreground.gray,
      fontFamily: FONTS.regular,
      fontSize: 12,
    },
    qrWrap: { alignItems: "center", marginTop: 18 },
    qrCard: {
      padding: 16,
      borderRadius: 22,
      backgroundColor: "#fff",
      shadowColor: theme.primary.main,
      shadowOpacity: 0.35,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 8 },
      elevation: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    qrCenter: {
      ...StyleSheet.absoluteFillObject,
      alignItems: "center",
      justifyContent: "center",
    },
    qrCenterRing: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: theme.primary.main,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 4,
      borderColor: "#fff",
    },
    qrCenterInitial: {
      color: theme.background.dark,
      fontFamily: FONTS.extraBold,
      fontSize: 18,
    },
    identity: { alignItems: "center", marginTop: 16 },
    name: {
      color: theme.foreground.white,
      fontFamily: FONTS.extraBold,
      fontSize: 18,
      maxWidth: 260,
    },
    handle: {
      marginTop: 2,
      color: theme.foreground.gray,
      fontFamily: FONTS.medium,
      fontSize: 13,
    },
    actions: {
      flexDirection: "row",
      gap: 10,
      marginTop: 20,
    },
    actionBtn: {
      flex: 1,
      height: 50,
      borderRadius: 14,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: theme.background.accent,
    },
    actionPrimary: { backgroundColor: theme.primary.main },
    actionText: {
      color: theme.foreground.white,
      fontFamily: FONTS.semiBold,
      fontSize: 14,
    },
    actionPrimaryText: { color: theme.background.dark },
  });
}

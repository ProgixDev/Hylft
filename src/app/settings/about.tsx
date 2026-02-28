import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Theme } from "../../constants/themes";
import { useTheme } from "../../contexts/ThemeContext";

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background.dark },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.background.accent,
    },
    backBtn: { padding: 6, marginRight: 8 },
    headerTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: theme.foreground.white,
    },
    hero: {
      alignItems: "center",
      paddingTop: 40,
      paddingBottom: 32,
      borderBottomWidth: 1,
      borderBottomColor: theme.background.accent,
    },
    logo: { width: 80, height: 80, borderRadius: 20, marginBottom: 16 },
    appName: {
      fontSize: 28,
      fontWeight: "800",
      color: theme.foreground.white,
      marginBottom: 4,
    },
    tagline: {
      fontSize: 14,
      color: theme.foreground.gray,
      textAlign: "center",
      paddingHorizontal: 32,
    },
    versionBadge: {
      marginTop: 16,
      paddingHorizontal: 16,
      paddingVertical: 6,
      borderRadius: 20,
      backgroundColor: theme.background.accent,
    },
    versionText: { fontSize: 13, color: theme.primary.main, fontWeight: "600" },
    section: { marginTop: 28, marginHorizontal: 16 },
    sectionTitle: {
      fontSize: 12,
      fontWeight: "700",
      color: theme.foreground.gray,
      textTransform: "uppercase",
      letterSpacing: 0.8,
      marginBottom: 12,
    },
    card: {
      backgroundColor: theme.background.accent,
      borderRadius: 14,
      overflow: "hidden",
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: theme.background.darker,
    },
    rowLast: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    rowIcon: {
      width: 34,
      height: 34,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    rowLabel: {
      flex: 1,
      fontSize: 15,
      fontWeight: "500",
      color: theme.foreground.white,
    },
    rowValue: { fontSize: 14, color: theme.foreground.gray },
    statGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      marginTop: 12,
    },
    statCard: {
      flex: 1,
      minWidth: "44%",
      backgroundColor: theme.background.accent,
      borderRadius: 14,
      padding: 16,
      alignItems: "center",
    },
    statValue: {
      fontSize: 22,
      fontWeight: "800",
      color: theme.primary.main,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      color: theme.foreground.gray,
      textAlign: "center",
    },
    socialRow: {
      flexDirection: "row",
      justifyContent: "center",
      gap: 16,
      marginTop: 20,
    },
    socialBtn: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.background.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    footer: {
      textAlign: "center",
      fontSize: 12,
      color: theme.foreground.gray,
      marginTop: 32,
      marginBottom: 16,
      lineHeight: 18,
    },
  });
}

export default function About() {
  const { t } = useTranslation();
  const router = useRouter();
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons
            name="chevron-back"
            size={26}
            color={theme.foreground.white}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("about.title")}</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <Image source={theme.logo} style={styles.logo} resizeMode="contain" />
          <Text style={styles.appName}>Hylift</Text>
          <Text style={styles.tagline}>
            {t("about.tagline")}
          </Text>
          <View style={styles.versionBadge}>
            <Text style={styles.versionText}>{t("about.version")}</Text>
          </View>
        </View>

        {/* App Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("about.appInfo")}</Text>
          <View style={styles.card}>
            {[
              {
                icon: "code-slash-outline",
                bg: "#1c3a5e",
                label: t("about.developer"),
                value: "DigitariaWebs",
              },
              {
                icon: "globe-outline",
                bg: "#1a3a2a",
                label: t("about.platform"),
                value: "iOS & Android",
              },
              {
                icon: "calendar-outline",
                bg: "#3a2a1a",
                label: t("about.released"),
                value: "2026",
              },
              {
                icon: "language-outline",
                bg: "#2a1a3a",
                label: t("about.technologies"),
                value: "React Native · Expo",
                last: true,
              },
            ].map((item, i, arr) => (
              <View
                key={item.label}
                style={i === arr.length - 1 ? styles.rowLast : styles.row}
              >
                <View style={[styles.rowIcon, { backgroundColor: item.bg }]}>
                  <Ionicons
                    name={item.icon as any}
                    size={17}
                    color={theme.foreground.white}
                  />
                </View>
                <Text style={styles.rowLabel}>{item.label}</Text>
                <Text style={styles.rowValue}>{item.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("about.byTheNumbers")}</Text>
          <View style={styles.statGrid}>
            {[
              { value: "10K+", label: t("about.exercisesInDatabase") },
              { value: "50+", label: t("about.muscleGroupsTracked") },
              { value: "∞", label: t("about.workoutsYouCanLog") },
              { value: "Free", label: t("about.andAlwaysWillBe") },
            ].map((s) => (
              <View key={s.label} style={styles.statCard}>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Links */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("about.links")}</Text>
          <View style={styles.card}>
            {[
              {
                icon: "document-text-outline",
                bg: "#1a3a3a",
                label: t("settings.termsOfService"),
                onPress: () => router.push("/settings/terms" as any),
              },
              {
                icon: "shield-checkmark-outline",
                bg: "#2a1a3a",
                label: t("settings.privacyPolicy"),
                onPress: () => router.push("/settings/privacy" as any),
              },
              {
                icon: "open-outline",
                bg: "#1c3a5e",
                label: t("about.website"),
                onPress: () => Linking.openURL("https://digitariawebs.com"),
                last: true,
              },
            ].map((item, i, arr) => (
              <TouchableOpacity
                key={item.label}
                style={i === arr.length - 1 ? styles.rowLast : styles.row}
                onPress={item.onPress}
                activeOpacity={0.7}
              >
                <View style={[styles.rowIcon, { backgroundColor: item.bg }]}>
                  <Ionicons
                    name={item.icon as any}
                    size={17}
                    color={theme.foreground.white}
                  />
                </View>
                <Text style={styles.rowLabel}>{item.label}</Text>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={theme.foreground.gray}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Social */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("about.followUs")}</Text>
          <View style={styles.socialRow}>
            {[
              { icon: "logo-instagram", url: "https://instagram.com" },
              { icon: "logo-twitter", url: "https://twitter.com" },
              { icon: "logo-tiktok", url: "https://tiktok.com" },
            ].map((s) => (
              <TouchableOpacity
                key={s.icon}
                style={styles.socialBtn}
                onPress={() => Linking.openURL(s.url)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={s.icon as any}
                  size={22}
                  color={theme.foreground.white}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Text style={styles.footer}>
          {t("about.madeWithLove")}
        </Text>
      </ScrollView>
    </View>
  );
}

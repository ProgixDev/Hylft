import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Theme } from "../../constants/themes";
import { useTheme } from "../../contexts/ThemeContext";

import { FONTS } from "../../constants/fonts";

const LAST_UPDATED = "January 1, 2026";

const SECTIONS = [
  {
    title: "Information We Collect",
    icon: "layers-outline" as const,
    body: "We collect information you provide directly, including:\n\n• Account information: username, email, password\n• Profile data: display name, bio, avatar photo\n• Fitness data: workouts, exercises, sets, reps, weight lifted, duration\n• User-generated content: posts, photos, comments, captions\n• Health data (if Health Connect is enabled): steps, heart rate, calories\n\nWe also collect usage data automatically, including app interactions, device information, and performance logs.",
  },
  {
    title: "How We Use Your Information",
    icon: "cog-outline" as const,
    body: "We use your information to:\n\n• Provide and improve the Hylift service\n• Personalize your experience and recommendations\n• Enable social features (follow, post, comment)\n• Send notifications and workout reminders (if enabled)\n• Analyze usage to improve app performance\n• Comply with legal obligations\n\nWe do not sell your personal data to third parties.",
  },
  {
    title: "Data Sharing",
    icon: "share-social-outline" as const,
    body: "Your public profile, posts, and workout summaries are visible to other Hylift users. If you set your account to Private, only approved followers can see your content.\n\nWe may share anonymized, aggregated data with third parties for analytics. We will share personal data when legally required (e.g., court order) or to protect the safety of users.",
  },
  {
    title: "Health Data",
    icon: "heart-outline" as const,
    body: "If you connect Health Connect, we access health metrics only with your explicit permission. Health data is used solely to display your stats within the app. We do not share identifiable health data with advertisers or third-party analytics providers.\n\nYou can disconnect Health Connect at any time in Settings → Connected Apps.",
  },
  {
    title: "Data Storage & Security",
    icon: "shield-checkmark-outline" as const,
    body: "Your data is stored securely using industry-standard encryption at rest and in transit (TLS). We implement access controls, regular security audits, and monitor for suspicious activity.\n\nDespite these measures, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security.",
  },
  {
    title: "Your Rights",
    icon: "person-circle-outline" as const,
    body: "Depending on your location, you may have rights including:\n\n• Access: Request a copy of your personal data\n• Correction: Request correction of inaccurate data\n• Deletion: Request deletion of your account and data\n• Portability: Receive your data in a portable format\n• Objection: Object to certain processing of your data\n\nTo exercise any right, contact us at privacy@hylift.app.",
  },
  {
    title: "Cookies & Tracking",
    icon: "radio-button-on-outline" as const,
    body: "The Hylift mobile app does not use traditional browser cookies. We use local storage and AsyncStorage for preferences. We use analytics SDKs that may collect device identifiers to help us understand app usage and diagnose issues.",
  },
  {
    title: "Children's Privacy",
    icon: "happy-outline" as const,
    body: "Hylift is not directed to children under 13. We do not knowingly collect personal information from children under 13. If you believe we have inadvertently collected such information, please contact us immediately and we will delete it.",
  },
  {
    title: "Changes to This Policy",
    icon: "refresh-outline" as const,
    body: "We may update this Privacy Policy from time to time. We will notify you of significant changes by posting a notice in the app or sending a push notification. Your continued use of the App after changes take effect constitutes acceptance of the updated policy.",
  },
  {
    title: "Contact Us",
    icon: "mail-outline" as const,
    body: "For privacy-related questions or to exercise your data rights, contact us at:\n\nprivacy@hylift.app\n\nDigitariaWebs\n© 2026 All rights reserved.",
  },
];

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
      fontFamily: FONTS.bold,
      color: theme.foreground.white,
    },
    metaBanner: {
      margin: 16,
      padding: 14,
      borderRadius: 12,
      backgroundColor: theme.background.accent,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    metaText: { fontSize: 13, color: theme.foreground.gray },
    metaBold: { fontFamily: FONTS.semiBold, color: theme.foreground.white },
    intro: {
      marginHorizontal: 16,
      marginBottom: 16,
      padding: 16,
      borderRadius: 12,
      backgroundColor: theme.background.accent,
    },
    introText: { fontSize: 14, color: theme.foreground.gray, lineHeight: 22 },
    sectionCard: {
      marginHorizontal: 16,
      marginBottom: 10,
      borderRadius: 12,
      backgroundColor: theme.background.accent,
      overflow: "hidden",
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 14,
      gap: 12,
    },
    sectionIcon: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: theme.background.darker,
      alignItems: "center",
      justifyContent: "center",
    },
    sectionTitle: {
      flex: 1,
      fontSize: 15,
      fontFamily: FONTS.bold,
      color: theme.foreground.white,
    },
    divider: {
      height: 1,
      backgroundColor: theme.background.darker,
      marginHorizontal: 16,
    },
    sectionBody: { paddingHorizontal: 16, paddingBottom: 16 },
    sectionText: { fontSize: 14, color: theme.foreground.gray, lineHeight: 22 },
    footer: {
      textAlign: "center",
      fontSize: 12,
      color: theme.foreground.gray,
      marginVertical: 24,
      lineHeight: 18,
    },
  });
}

export default function Privacy() {
  const router = useRouter();
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [openSection, setOpenSection] = useState<number | null>(null);

  const toggle = (idx: number) =>
    setOpenSection(openSection === idx ? null : idx);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons
            name="chevron-back"
            size={26}
            color={theme.foreground.white}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View style={styles.metaBanner}>
          <Ionicons
            name="shield-checkmark-outline"
            size={22}
            color={theme.primary.main}
          />
          <Text style={styles.metaText}>
            Last updated: <Text style={styles.metaBold}>{LAST_UPDATED}</Text>
          </Text>
        </View>

        <View style={styles.intro}>
          <Text style={styles.introText}>
            At Hylift, we are committed to protecting your privacy. This policy
            explains what data we collect, how we use it, and the choices you
            have. Tap any section to expand it.
          </Text>
        </View>

        {SECTIONS.map((s, idx) => (
          <View key={s.title} style={styles.sectionCard}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => toggle(idx)}
              activeOpacity={0.7}
            >
              <View style={styles.sectionIcon}>
                <Ionicons name={s.icon} size={16} color={theme.primary.main} />
              </View>
              <Text style={styles.sectionTitle}>{s.title}</Text>
              <Ionicons
                name={openSection === idx ? "chevron-up" : "chevron-down"}
                size={17}
                color={theme.foreground.gray}
              />
            </TouchableOpacity>
            {openSection === idx && (
              <>
                <View style={styles.divider} />
                <View style={styles.sectionBody}>
                  <Text style={styles.sectionText}>{s.body}</Text>
                </View>
              </>
            )}
          </View>
        ))}

        <Text style={styles.footer}>
          © 2026 Hylift · DigitariaWebs. All rights reserved.
        </Text>
      </ScrollView>
    </View>
  );
}

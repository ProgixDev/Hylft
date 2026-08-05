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
    title: "1. Acceptance of Terms",
    body: "By accessing or using Hylift (\u201cthe App\u201d), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the App. We reserve the right to modify these terms at any time, and continued use of the App constitutes acceptance of any modifications.",
  },
  {
    title: "2. Use of the Service",
    body: "Hylift is intended for personal, non-commercial use only. You agree not to:\n- Use the App for any unlawful purpose\n- Post content that is offensive, harmful, or violates third-party rights\n- Attempt to gain unauthorized access to any part of the App\n- Scrape, crawl, or harvest data from the App without permission\n- Impersonate other users or create misleading accounts",
  },
  {
    title: "3. User Accounts",
    body: "You must be at least 13 years old to create an account. You are responsible for maintaining the confidentiality of your credentials and for all activity under your account. Notify us immediately if you suspect unauthorized use of your account.\n\nWe reserve the right to suspend or terminate accounts that violate these Terms.",
  },
  {
    title: "4. User Content",
    body: "You retain ownership of content you post on Hylift. By posting content, you grant us a non-exclusive, worldwide, royalty-free license to use, display, and reproduce your content in connection with providing the service.\n\nYou represent that you have all rights needed to grant this license and that your content does not violate any laws or third-party rights.",
  },
  {
    title: "5. Health & Fitness Disclaimer",
    body: "The workouts, exercises, and nutritional information provided in Hylift are for informational purposes only and do not constitute medical advice. Always consult a qualified healthcare professional before beginning any new exercise or diet program.\n\nHylift is not responsible for any injuries, health issues, or damages resulting from use of information provided in the App.",
  },
  {
    title: "6. Privacy",
    body: "Your use of the App is also governed by our Privacy Policy, which is incorporated into these Terms by reference. Please review our Privacy Policy to understand our practices.",
  },
  {
    title: "7. Intellectual Property",
    body: "All content, features, and functionality of Hylift — including but not limited to text, graphics, logos, icons, images, and software — are the exclusive property of Hylift and DigitariaWebs, and are protected by applicable intellectual property laws.",
  },
  {
    title: "8. Limitation of Liability",
    body: "To the maximum extent permitted by law, Hylift and its affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of, or inability to use, the App or its content.",
  },
  {
    title: "9. Termination",
    body: "We may terminate or suspend your account at our sole discretion, without prior notice, for conduct that we believe violates these Terms or is harmful to other users, us, third parties, or for any other reason.",
  },
  {
    title: "10. Contact Us",
    body: "If you have questions about these Terms, please contact us at:\nsupport@hylift.app\n\nDigitariaWebs\nAll rights reserved.",
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
      gap: 10,
    },
    sectionTitle: {
      flex: 1,
      fontSize: 15,
      fontFamily: FONTS.bold,
      color: theme.foreground.white,
    },
    sectionBody: {
      paddingHorizontal: 16,
      paddingBottom: 16,
    },
    sectionText: {
      fontSize: 14,
      color: theme.foreground.gray,
      lineHeight: 22,
    },
    divider: {
      height: 1,
      backgroundColor: theme.background.darker,
      marginHorizontal: 16,
    },
    footer: {
      textAlign: "center",
      fontSize: 12,
      color: theme.foreground.gray,
      marginVertical: 24,
      lineHeight: 18,
    },
  });
}

export default function Terms() {
  const router = useRouter();
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [openSection, setOpenSection] = useState<number | null>(0);

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
        <Text style={styles.headerTitle}>Terms of Service</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View style={styles.metaBanner}>
          <Ionicons
            name="document-text-outline"
            size={22}
            color={theme.primary.main}
          />
          <Text style={styles.metaText}>
            Last updated: <Text style={styles.metaBold}>{LAST_UPDATED}</Text>
          </Text>
        </View>

        {SECTIONS.map((s, idx) => (
          <View key={s.title} style={styles.sectionCard}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => toggle(idx)}
              activeOpacity={0.7}
            >
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

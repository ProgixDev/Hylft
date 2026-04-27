import { Ionicons } from "@expo/vector-icons";
import { Sitemap, useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { FONTS } from "../../constants/fonts";
import { useTheme } from "../../contexts/ThemeContext";

export default function DevRoutesScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color={theme.foreground.white} />
        </TouchableOpacity>
        <Text style={styles.title}>Developer Routes</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>
          Tap any route below to navigate. Dynamic routes may require params.
        </Text>
        <View style={styles.sitemapCard}>
          <Sitemap />
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>["theme"]) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background.dark,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.background.accent,
    },
    headerSpacer: {
      width: 26,
      height: 26,
    },
    title: {
      color: theme.foreground.white,
      fontFamily: FONTS.bold,
      fontSize: 18,
    },
    content: {
      padding: 16,
      paddingBottom: 32,
      gap: 10,
    },
    subtitle: {
      color: theme.foreground.gray,
      fontFamily: FONTS.regular,
      fontSize: 13,
    },
    sitemapCard: {
      backgroundColor: "#ffffff",
      borderRadius: 12,
      padding: 12,
      overflow: "hidden",
    },
  });

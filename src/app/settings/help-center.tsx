import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  LayoutAnimation,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Theme } from "../../constants/themes";
import { useTheme } from "../../contexts/ThemeContext";

if (Platform.OS === "android") {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

const FAQ_DATA = [
  {
    category: "Getting Started",
    icon: "rocket-outline" as const,
    items: [
      {
        q: "How do I log my first workout?",
        a: "Go to the Workout tab, tap the '+' button in the top right, then select 'Start Workout'. Add exercises by tapping 'Add Exercise', log your sets and reps, then finish by tapping 'Complete Workout'.",
      },
      {
        q: "How do I create a routine?",
        a: "In the Workout tab, tap the '+' button and select 'Create Routine'. Give your routine a name, add exercises with their sets and reps, then save. You can start any saved routine from the Routines section.",
      },
      {
        q: "How do I follow other users?",
        a: "Visit a user's profile by tapping their avatar or username in the Home feed. Then tap the 'Follow' button on their profile page. If their account is private, they'll need to approve your request.",
      },
    ],
  },
  {
    category: "Workouts & Tracking",
    icon: "barbell-outline" as const,
    items: [
      {
        q: "Can I track multiple exercises per workout?",
        a: "Yes! During an active workout you can add as many exercises as you like. Tap 'Add Exercise' to search from our database of thousands of exercises.",
      },
      {
        q: "How are calories calculated?",
        a: "Calorie estimates are based on exercise type, your body weight (set in your profile), workout duration, and intensity. For the most accurate results, keep your profile information up to date.",
      },
      {
        q: "Can I edit a completed workout?",
        a: "You can view past workouts in the Workout tab under the History section. Editing completed workouts will be available in a future update.",
      },
      {
        q: "What is the day streak?",
        a: "Your streak counts the number of consecutive days you've logged at least one workout. Missing a day resets your streak to zero.",
      },
    ],
  },
  {
    category: "Account & Privacy",
    icon: "person-circle-outline" as const,
    items: [
      {
        q: "How do I make my account private?",
        a: "Go to Settings → Account → toggle 'Private Account' on. Only your approved followers will be able to see your posts and workout activity.",
      },
      {
        q: "How do I change my password?",
        a: "Go to Settings → Account → Change Password. Enter your current password and then set a new one. Make sure your new password meets all the strength requirements.",
      },
      {
        q: "Can I delete my account?",
        a: "Yes. Go to Settings, scroll to the bottom and tap 'Delete Account'. This action is permanent and will remove all your data, posts, and progress. It cannot be undone.",
      },
    ],
  },
  {
    category: "Social Features",
    icon: "people-outline" as const,
    items: [
      {
        q: "How do I share a post?",
        a: "After completing a workout, you'll be prompted to share it. You can add up to 4 photos, a caption, and workout stats. Your followers will see it in their Home feed.",
      },
      {
        q: "How do I report inappropriate content?",
        a: "Long-press any post or comment and select 'Report'. Alternatively, visit the user's profile, tap the three-dot menu, and choose 'Report'. Our team reviews all reports promptly.",
      },
    ],
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
      fontWeight: "700",
      color: theme.foreground.white,
    },
    searchContainer: {
      margin: 16,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.background.accent,
      borderRadius: 12,
      paddingHorizontal: 12,
      gap: 8,
    },
    searchInput: {
      flex: 1,
      paddingVertical: 12,
      fontSize: 15,
      color: theme.foreground.white,
    },
    categorySection: { marginBottom: 8 },
    categoryHeader: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 8,
    },
    categoryTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: theme.foreground.gray,
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    faqCard: {
      marginHorizontal: 16,
      marginBottom: 6,
      borderRadius: 12,
      overflow: "hidden",
      backgroundColor: theme.background.accent,
    },
    faqQuestion: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 14,
      gap: 12,
    },
    faqQText: {
      flex: 1,
      fontSize: 15,
      fontWeight: "600",
      color: theme.foreground.white,
      lineHeight: 21,
    },
    faqAnswer: {
      paddingHorizontal: 16,
      paddingBottom: 16,
    },
    faqAText: {
      fontSize: 14,
      color: theme.foreground.gray,
      lineHeight: 21,
    },
    divider: {
      height: 1,
      backgroundColor: theme.background.darker,
      marginHorizontal: 16,
    },
    noResults: { alignItems: "center", paddingTop: 60 },
    noResultsText: {
      fontSize: 16,
      color: theme.foreground.gray,
      marginTop: 12,
    },
    contactSection: {
      margin: 16,
      marginTop: 8,
      padding: 20,
      backgroundColor: theme.background.accent,
      borderRadius: 16,
      alignItems: "center",
    },
    contactTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.foreground.white,
      marginTop: 12,
      marginBottom: 6,
    },
    contactSubtitle: {
      fontSize: 13,
      color: theme.foreground.gray,
      textAlign: "center",
      lineHeight: 19,
      marginBottom: 14,
    },
    contactBtn: {
      paddingHorizontal: 28,
      paddingVertical: 10,
      borderRadius: 20,
      backgroundColor: theme.primary.main,
    },
    contactBtnText: {
      fontSize: 14,
      fontWeight: "700",
      color: theme.background.dark,
    },
  });
}

interface FAQItemProps {
  question: string;
  answer: string;
  isLast: boolean;
  styles: ReturnType<typeof createStyles>;
  theme: Theme;
}

function FAQItem({ question, answer, isLast, styles, theme }: FAQItemProps) {
  const [open, setOpen] = useState(false);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((v) => !v);
  };

  return (
    <>
      <TouchableOpacity
        style={styles.faqQuestion}
        onPress={toggle}
        activeOpacity={0.7}
      >
        <Text style={styles.faqQText}>{question}</Text>
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={18}
          color={theme.foreground.gray}
        />
      </TouchableOpacity>
      {open && (
        <View style={styles.faqAnswer}>
          <Text style={styles.faqAText}>{answer}</Text>
        </View>
      )}
      {!isLast && <View style={styles.divider} />}
    </>
  );
}

export default function HelpCenter() {
  const { t } = useTranslation();
  const router = useRouter();
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? FAQ_DATA.map((cat) => ({
        ...cat,
        items: cat.items.filter(
          (item) =>
            item.q.toLowerCase().includes(search.toLowerCase()) ||
            item.a.toLowerCase().includes(search.toLowerCase()),
        ),
      })).filter((cat) => cat.items.length > 0)
    : FAQ_DATA;

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
        <Text style={styles.headerTitle}>{t("helpCenter.title")}</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons
            name="search-outline"
            size={18}
            color={theme.foreground.gray}
          />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder={t("helpCenter.searchQuestions")}
            placeholderTextColor={theme.foreground.gray}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons
                name="close-circle"
                size={18}
                color={theme.foreground.gray}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* FAQ Categories */}
        {filtered.length === 0 ? (
          <View style={styles.noResults}>
            <Ionicons
              name="search-outline"
              size={48}
              color={theme.foreground.gray}
            />
            <Text style={styles.noResultsText}>{t("helpCenter.noResults")} &quot;{search}&quot;</Text>
          </View>
        ) : (
          filtered.map((cat) => (
            <View key={cat.category} style={styles.categorySection}>
              <View style={styles.categoryHeader}>
                <Ionicons
                  name={cat.icon}
                  size={18}
                  color={theme.primary.main}
                />
                <Text style={styles.categoryTitle}>
                  {cat.category === "Getting Started" ? t("helpCenter.gettingStarted") :
                   cat.category === "Workouts & Tracking" ? t("helpCenter.workoutsTracking") :
                   cat.category === "Account & Privacy" ? t("helpCenter.accountPrivacy") :
                   cat.category === "Social Features" ? t("helpCenter.socialFeatures") :
                   cat.category}
                </Text>
              </View>
              <View style={styles.faqCard}>
                {cat.items.map((item, idx) => (
                  <FAQItem
                    key={item.q}
                    question={item.q}
                    answer={item.a}
                    isLast={idx === cat.items.length - 1}
                    styles={styles}
                    theme={theme}
                  />
                ))}
              </View>
            </View>
          ))
        )}

        {/* Contact support */}
        <View style={styles.contactSection}>
          <Ionicons name="mail-outline" size={36} color={theme.primary.main} />
          <Text style={styles.contactTitle}>{t("helpCenter.stillNeedHelp")}</Text>
          <Text style={styles.contactSubtitle}>
            {t("helpCenter.cantFindWhat")}
          </Text>
          <TouchableOpacity
            style={styles.contactBtn}
            activeOpacity={0.8}
            onPress={() => {}}
          >
            <Text style={styles.contactBtnText}>{t("helpCenter.contactSupport")}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

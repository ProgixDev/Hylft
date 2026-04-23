import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Theme } from "../../constants/themes";
import { useTheme } from "../../contexts/ThemeContext";

import { FONTS } from "../../constants/fonts";
import ChipButton from "../../components/ui/ChipButton";

export default function EmailPreferences() {
  const router = useRouter();
  const params = useLocalSearchParams<{ flow?: string }>();
  const isSignupFlow = params.flow === "signup";
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(theme);

  const handleAccept = () => {
    // TODO: Save email preference
    router.navigate(isSignupFlow ? "/get-started/account" : "/get-started/ready");
  };

  const handleDecline = () => {
    // TODO: Save email preference
    router.navigate(isSignupFlow ? "/get-started/account" : "/get-started/ready");
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.stepRow}>
          <Text style={[styles.stepText, { color: theme.primary.main }]}>
            {t("onboarding.stepOf", { current: 12, total: 13 })}
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: theme.primary.main,
                  width: `${(12 / 13) * 100}%`,
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <MaterialIcons name="email" size={80} color={theme.primary.main} />
          </View>

          <Text style={styles.title}>{t("onboarding.emailPreferences.title")}</Text>
          <Text style={styles.promiseText}>
            {t("onboarding.emailPreferences.promise")}
          </Text>

          <View style={styles.listContainer}>
            <View style={styles.listItem}>
              <MaterialIcons
                name="lightbulb-outline"
                size={24}
                color={theme.primary.main}
              />
              <Text style={styles.listItemText}>
                {t("onboarding.emailPreferences.tips")}
              </Text>
            </View>
            <View style={styles.listItem}>
              <MaterialIcons
                name="new-releases"
                size={24}
                color={theme.primary.main}
              />
              <Text style={styles.listItemText}>{t("onboarding.emailPreferences.newFeatures")}</Text>
            </View>
            <View style={styles.listItem}>
              <MaterialIcons
                name="local-offer"
                size={24}
                color={theme.primary.main}
              />
              <Text style={styles.listItemText}>{t("onboarding.emailPreferences.promotions")}</Text>
            </View>
            <View style={styles.listItem}>
              <MaterialIcons
                name="logout"
                size={24}
                color={theme.primary.main}
              />
              <Text style={styles.listItemText}>{t("onboarding.emailPreferences.optOut")}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.buttonsContainer}>
        <ChipButton
          title={t("onboarding.emailPreferences.accept")}
          onPress={handleAccept}
          variant="primary"
          size="lg"
          fullWidth
        />

        <TouchableOpacity
          style={styles.declineButton}
          onPress={handleDecline}
          activeOpacity={0.7}
        >
          <Text style={styles.declineButtonText}>{t("onboarding.emailPreferences.decline")}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background.dark,
      paddingHorizontal: 20,
      paddingBottom: 16,
    },
    scrollContent: {
      paddingBottom: 16,
    },
    stepRow: {
      marginBottom: 14,
      marginTop: 4,
    },
    stepText: {
      fontSize: 11,
      fontFamily: FONTS.bold,
      letterSpacing: 1.2,
      marginBottom: 6,
    },
    progressBar: {
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.background.accent,
    },
    progressFill: {
      height: "100%",
      borderRadius: 2,
    },
    content: {
      flex: 1,
      alignItems: "center",
    },
    iconContainer: {
      marginBottom: 20,
      marginTop: 12,
    },
    title: {
      fontSize: 24,
      fontFamily: FONTS.bold,
      color: theme.foreground.white,
      textAlign: "center",
      marginBottom: 8,
    },
    promiseText: {
      fontSize: 14,
      color: theme.foreground.gray,
      textAlign: "center",
      marginBottom: 24,
      fontStyle: "italic",
    },
    listContainer: {
      width: "100%",
      gap: 16,
    },
    listItem: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
    },
    listItemText: {
      fontSize: 14,
      color: theme.foreground.white,
      flex: 1,
      lineHeight: 21,
    },
    buttonsContainer: {
      gap: 8,
    },
    declineButton: {
      paddingVertical: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    declineButtonText: {
      color: theme.foreground.white,
      fontSize: 14,
      fontFamily: FONTS.semiBold,
    },
  });

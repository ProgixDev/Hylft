import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
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
import ChipButton from "../../components/ui/ChipButton";

export default function HealthConnect() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(theme);

  const handleEnableHealthConnect = () => {
    // TODO: Enable Health Connect integration
    router.navigate("/get-started/email-preferences");
  };

  const handleNotNow = () => {
    router.navigate("/get-started/email-preferences");
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
            {t("onboarding.stepOf", { current: 11, total: 13 })}
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: theme.primary.main,
                  width: `${(11 / 13) * 100}%`,
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons
              name="heart-pulse"
              size={80}
              color={theme.primary.main}
            />
          </View>

          <Text style={styles.title}>{t("onboarding.healthConnect.title")}</Text>
          <Text style={styles.subtitle}>
            {t("onboarding.healthConnect.subtitle")}
          </Text>

          <View style={styles.benefitsContainer}>
            <View style={styles.benefitItem}>
              <MaterialCommunityIcons
                name="check-circle"
                size={24}
                color={theme.primary.main}
              />
              <Text style={styles.benefitText}>
                {t("onboarding.healthConnect.activityTracking")}
              </Text>
            </View>
            <View style={styles.benefitItem}>
              <MaterialCommunityIcons
                name="check-circle"
                size={24}
                color={theme.primary.main}
              />
              <Text style={styles.benefitText}>
                {t("onboarding.healthConnect.recommendations")}
              </Text>
            </View>
            <View style={styles.benefitItem}>
              <MaterialCommunityIcons
                name="check-circle"
                size={24}
                color={theme.primary.main}
              />
              <Text style={styles.benefitText}>{t("onboarding.healthConnect.insights")}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.buttonsContainer}>
        <ChipButton
          title={t("onboarding.healthConnect.enable")}
          onPress={handleEnableHealthConnect}
          variant="primary"
          size="lg"
          fullWidth
        />

        <TouchableOpacity
          style={styles.notNowButton}
          onPress={handleNotNow}
          activeOpacity={0.7}
        >
          <Text style={styles.notNowButtonText}>{t("onboarding.healthConnect.notNow")}</Text>
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
      marginBottom: 10,
    },
    subtitle: {
      fontSize: 14,
      color: theme.foreground.gray,
      textAlign: "center",
      lineHeight: 21,
      marginBottom: 24,
    },
    benefitsContainer: {
      width: "100%",
      gap: 14,
    },
    benefitItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    benefitText: {
      fontSize: 14,
      color: theme.foreground.white,
      flex: 1,
    },
    buttonsContainer: {
      gap: 8,
    },
    notNowButton: {
      paddingVertical: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    notNowButtonText: {
      color: theme.foreground.white,
      fontSize: 14,
      fontFamily: FONTS.semiBold,
    },
  });

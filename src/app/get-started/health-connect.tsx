import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
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
            STEP 11 OF 13
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

          <Text style={styles.title}>Connect Your Health Data</Text>
          <Text style={styles.subtitle}>
            Sync your fitness data automatically to track your progress and get
            personalized insights
          </Text>

          <View style={styles.benefitsContainer}>
            <View style={styles.benefitItem}>
              <MaterialCommunityIcons
                name="check-circle"
                size={24}
                color={theme.primary.main}
              />
              <Text style={styles.benefitText}>
                Automatic activity tracking
              </Text>
            </View>
            <View style={styles.benefitItem}>
              <MaterialCommunityIcons
                name="check-circle"
                size={24}
                color={theme.primary.main}
              />
              <Text style={styles.benefitText}>
                Personalized recommendations
              </Text>
            </View>
            <View style={styles.benefitItem}>
              <MaterialCommunityIcons
                name="check-circle"
                size={24}
                color={theme.primary.main}
              />
              <Text style={styles.benefitText}>Better progress insights</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.buttonsContainer}>
        <ChipButton
          title="Enable Health Connect"
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
          <Text style={styles.notNowButtonText}>Not Now</Text>
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
      paddingHorizontal: 24,
      paddingBottom: 20,
    },
    scrollContent: {
      paddingBottom: 20,
    },
    stepRow: {
      marginBottom: 20,
      marginTop: 8,
    },
    stepText: {
      fontSize: 11,
      fontFamily: FONTS.bold,
      letterSpacing: 1.2,
      marginBottom: 8,
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
      marginBottom: 32,
      marginTop: 20,
    },
    title: {
      fontSize: 32,
      fontFamily: FONTS.bold,
      color: theme.foreground.white,
      textAlign: "center",
      marginBottom: 16,
    },
    subtitle: {
      fontSize: 16,
      color: theme.foreground.gray,
      textAlign: "center",
      lineHeight: 24,
      marginBottom: 40,
    },
    benefitsContainer: {
      width: "100%",
      gap: 20,
    },
    benefitItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    benefitText: {
      fontSize: 16,
      color: theme.foreground.white,
      flex: 1,
    },
    buttonsContainer: {
      gap: 12,
    },
    notNowButton: {
      paddingVertical: 18,
      alignItems: "center",
      justifyContent: "center",
    },
    notNowButtonText: {
      color: theme.foreground.white,
      fontSize: 16,
      fontFamily: FONTS.semiBold,
    },
  });

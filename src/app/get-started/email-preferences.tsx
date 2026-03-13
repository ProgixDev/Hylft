import { MaterialIcons } from "@expo/vector-icons";
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

export default function EmailPreferences() {
  const router = useRouter();
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const handleAccept = () => {
    // TODO: Save email preference
    router.navigate("/get-started/ready");
  };

  const handleDecline = () => {
    // TODO: Save email preference
    router.navigate("/get-started/ready");
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
            STEP 12 OF 13
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

          <Text style={styles.title}>Can we send you emails?</Text>
          <Text style={styles.promiseText}>
            No spam, promise. We hate it too.
          </Text>

          <View style={styles.listContainer}>
            <View style={styles.listItem}>
              <MaterialIcons
                name="lightbulb-outline"
                size={24}
                color={theme.primary.main}
              />
              <Text style={styles.listItemText}>
                Tips for getting the most out of Hylift
              </Text>
            </View>
            <View style={styles.listItem}>
              <MaterialIcons
                name="new-releases"
                size={24}
                color={theme.primary.main}
              />
              <Text style={styles.listItemText}>New feature announcements</Text>
            </View>
            <View style={styles.listItem}>
              <MaterialIcons
                name="local-offer"
                size={24}
                color={theme.primary.main}
              />
              <Text style={styles.listItemText}>Promotional offers</Text>
            </View>
            <View style={styles.listItem}>
              <MaterialIcons
                name="logout"
                size={24}
                color={theme.primary.main}
              />
              <Text style={styles.listItemText}>Opt out anytime</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.buttonsContainer}>
        <ChipButton
          title="Sure!"
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
          <Text style={styles.declineButtonText}>No, thanks</Text>
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
      marginBottom: 12,
    },
    promiseText: {
      fontSize: 16,
      color: theme.foreground.gray,
      textAlign: "center",
      marginBottom: 40,
      fontStyle: "italic",
    },
    listContainer: {
      width: "100%",
      gap: 24,
    },
    listItem: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 16,
    },
    listItemText: {
      fontSize: 16,
      color: theme.foreground.white,
      flex: 1,
      lineHeight: 24,
    },
    buttonsContainer: {
      gap: 12,
    },
    declineButton: {
      paddingVertical: 18,
      alignItems: "center",
      justifyContent: "center",
    },
    declineButtonText: {
      color: theme.foreground.white,
      fontSize: 16,
      fontFamily: FONTS.semiBold,
    },
  });

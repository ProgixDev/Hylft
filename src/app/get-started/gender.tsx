import { useRouter } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Theme } from "../../constants/themes";
import { useTheme } from "../../contexts/ThemeContext";
import ChipButton from "../../components/ui/ChipButton";

import { FONTS } from "../../constants/fonts";

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background.dark,
      paddingHorizontal: 32,
      paddingBottom: 20,
    },
    content: {
      flex: 1,
    },
    title: {
      fontSize: 32,
      fontFamily: FONTS.bold,
      color: theme.foreground.white,
      marginVertical: 8,
    },
    subtitle: {
      fontSize: 16,
      color: theme.foreground.gray,
      marginBottom: 50,
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
    optionsContainer: {
      gap: 16,
    },
    genderButton: {
      paddingVertical: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: theme.foreground.gray,
      backgroundColor: theme.background.darker,
      alignItems: "center",
    },
    genderButtonSelected: {
      borderColor: theme.primary.main,
      backgroundColor: theme.background.accent,
    },
    genderText: {
      fontSize: 20,
      fontFamily: FONTS.semiBold,
      color: theme.foreground.gray,
    },
    genderTextSelected: {
      color: theme.primary.main,
    },
  });
}

export default function GenderSelection() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [selectedGender, setSelectedGender] = useState<string>("");

  const handleContinue = () => {
    if (!selectedGender) return;
    // Save gender preference and set theme
    setTheme(selectedGender as "male" | "female");
    router.navigate("/get-started/workout-frequency");
  };

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.stepRow}>
          <Text style={[styles.stepText, { color: theme.primary.main }]}>
            STEP 8 OF 13
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: theme.primary.main,
                  width: `${(8 / 13) * 100}%`,
                },
              ]}
            />
          </View>
        </View>

        <Text style={styles.title}>What&apos;s your birth gender?</Text>
        <Text style={styles.subtitle}>
          This helps us provide personalized recommendations
        </Text>

        <View style={styles.optionsContainer}>
          <TouchableOpacity
            style={[
              styles.genderButton,
              selectedGender === "male" && styles.genderButtonSelected,
            ]}
            onPress={() => setSelectedGender("male")}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.genderText,
                selectedGender === "male" && styles.genderTextSelected,
              ]}
            >
              Male
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.genderButton,
              selectedGender === "female" && styles.genderButtonSelected,
            ]}
            onPress={() => setSelectedGender("female")}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.genderText,
                selectedGender === "female" && styles.genderTextSelected,
              ]}
            >
              Female
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ChipButton
        title="Continue"
        onPress={handleContinue}
        variant="primary"
        size="lg"
        fullWidth
        disabled={!selectedGender}
      />
    </View>
  );
}

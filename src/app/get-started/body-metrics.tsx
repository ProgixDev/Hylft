import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Theme } from "../../constants/themes";
import { useTheme } from "../../contexts/ThemeContext";

import { FONTS } from "../../constants/fonts";

export default function BodyMetrics() {
  const router = useRouter();
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const [age, setAge] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [targetWeight, setTargetWeight] = useState("");
  const [heightUnit] = useState("cm"); // read from earlier preferences
  const [weightUnit] = useState("kg");

  const canContinue =
    age.trim() !== "" && height.trim() !== "" && weight.trim() !== "";

  const handleContinue = async () => {
    if (!canContinue) return;
    await AsyncStorage.multiSet([
      ["@hylift_age", age],
      ["@hylift_height", height],
      ["@hylift_weight", weight],
      ["@hylift_target_weight", targetWeight],
    ]);
    router.navigate("/get-started/workout-frequency");
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.background.dark }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.container}>
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.stepRow}>
            <Text style={[styles.stepText, { color: theme.primary.main }]}>
              STEP 5 OF 10
            </Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: theme.primary.main,
                    width: `${(5 / 10) * 100}%`,
                  },
                ]}
              />
            </View>
          </View>

          <Text style={styles.title}>Body Metrics</Text>
          <Text style={styles.subtitle}>
            These help us estimate calories burned and set realistic targets
          </Text>

          {/* Age */}
          <View style={styles.fieldGroup}>
            <Text
              style={[styles.fieldLabel, { color: theme.foreground.white }]}
            >
              Age
            </Text>
            <View
              style={[
                styles.inputRow,
                {
                  backgroundColor: theme.background.darker,
                  borderColor: theme.background.accent,
                },
              ]}
            >
              <Ionicons
                name="calendar-outline"
                size={18}
                color={theme.foreground.gray}
              />
              <TextInput
                style={[styles.input, { color: theme.foreground.white }]}
                placeholder="25"
                placeholderTextColor={theme.foreground.gray + "66"}
                keyboardType="number-pad"
                maxLength={3}
                value={age}
                onChangeText={setAge}
              />
              <Text
                style={[styles.unitLabel, { color: theme.foreground.gray }]}
              >
                years
              </Text>
            </View>
          </View>

          {/* Height */}
          <View style={styles.fieldGroup}>
            <Text
              style={[styles.fieldLabel, { color: theme.foreground.white }]}
            >
              Height
            </Text>
            <View
              style={[
                styles.inputRow,
                {
                  backgroundColor: theme.background.darker,
                  borderColor: theme.background.accent,
                },
              ]}
            >
              <Ionicons
                name="resize-outline"
                size={18}
                color={theme.foreground.gray}
              />
              <TextInput
                style={[styles.input, { color: theme.foreground.white }]}
                placeholder="175"
                placeholderTextColor={theme.foreground.gray + "66"}
                keyboardType="decimal-pad"
                maxLength={5}
                value={height}
                onChangeText={setHeight}
              />
              <Text
                style={[styles.unitLabel, { color: theme.foreground.gray }]}
              >
                {heightUnit}
              </Text>
            </View>
          </View>

          {/* Current Weight */}
          <View style={styles.fieldGroup}>
            <Text
              style={[styles.fieldLabel, { color: theme.foreground.white }]}
            >
              Current Weight
            </Text>
            <View
              style={[
                styles.inputRow,
                {
                  backgroundColor: theme.background.darker,
                  borderColor: theme.background.accent,
                },
              ]}
            >
              <Ionicons
                name="scale-outline"
                size={18}
                color={theme.foreground.gray}
              />
              <TextInput
                style={[styles.input, { color: theme.foreground.white }]}
                placeholder="80"
                placeholderTextColor={theme.foreground.gray + "66"}
                keyboardType="decimal-pad"
                maxLength={6}
                value={weight}
                onChangeText={setWeight}
              />
              <Text
                style={[styles.unitLabel, { color: theme.foreground.gray }]}
              >
                {weightUnit}
              </Text>
            </View>
          </View>

          {/* Target Weight (optional) */}
          <View style={styles.fieldGroup}>
            <View style={styles.fieldLabelRow}>
              <Text
                style={[styles.fieldLabel, { color: theme.foreground.white }]}
              >
                Target Weight
              </Text>
              <Text
                style={[styles.optionalText, { color: theme.foreground.gray }]}
              >
                Optional
              </Text>
            </View>
            <View
              style={[
                styles.inputRow,
                {
                  backgroundColor: theme.background.darker,
                  borderColor: theme.background.accent,
                },
              ]}
            >
              <Ionicons
                name="trending-down-outline"
                size={18}
                color={theme.foreground.gray}
              />
              <TextInput
                style={[styles.input, { color: theme.foreground.white }]}
                placeholder="75"
                placeholderTextColor={theme.foreground.gray + "66"}
                keyboardType="decimal-pad"
                maxLength={6}
                value={targetWeight}
                onChangeText={setTargetWeight}
              />
              <Text
                style={[styles.unitLabel, { color: theme.foreground.gray }]}
              >
                {weightUnit}
              </Text>
            </View>
          </View>

          {/* Info note */}
          <View
            style={[
              styles.infoBox,
              { backgroundColor: theme.primary.main + "10" },
            ]}
          >
            <Ionicons
              name="shield-checkmark-outline"
              size={16}
              color={theme.primary.main}
            />
            <Text style={[styles.infoText, { color: theme.foreground.gray }]}>
              Your data is stored locally and never shared. You can change these
              anytime in Settings.
            </Text>
          </View>
        </ScrollView>

        <TouchableOpacity
          style={[
            styles.continueButton,
            !canContinue && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          activeOpacity={0.8}
          disabled={!canContinue}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
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
    title: {
      fontSize: 30,
      fontFamily: FONTS.bold,
      color: theme.foreground.white,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 15,
      color: theme.foreground.gray,
      marginBottom: 28,
      lineHeight: 22,
    },
    fieldGroup: {
      marginBottom: 22,
    },
    fieldLabel: {
      fontSize: 15,
      fontFamily: FONTS.semiBold,
      marginBottom: 8,
    },
    fieldLabelRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    optionalText: {
      fontSize: 12,
      fontStyle: "italic",
    },
    inputRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 14,
      paddingVertical: 14,
      borderRadius: 12,
      borderWidth: 1.5,
      gap: 10,
    },
    input: {
      flex: 1,
      fontSize: 18,
      fontFamily: FONTS.semiBold,
      padding: 0,
    },
    unitLabel: {
      fontSize: 14,
      fontFamily: FONTS.medium,
    },
    infoBox: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
      padding: 14,
      borderRadius: 12,
      marginTop: 8,
    },
    infoText: {
      flex: 1,
      fontSize: 12,
      lineHeight: 18,
    },
    continueButton: {
      backgroundColor: theme.primary.main,
      paddingVertical: 18,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    continueButtonDisabled: {
      opacity: 0.4,
    },
    continueButtonText: {
      color: theme.background.dark,
      fontSize: 18,
      fontFamily: FONTS.bold,
    },
  });
}

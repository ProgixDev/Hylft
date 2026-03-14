import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Theme } from "../../constants/themes";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { supabase } from "../../services/supabase";

import { FONTS } from "../../constants/fonts";

export default function Ready() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user, setGetStartedCompleted } = useAuth();
  const styles = createStyles(theme);

  useEffect(() => {
    const saveProfile = async () => {
      setGetStartedCompleted();

      if (user) {
        const [
          age,
          heightCm,
          weightKg,
          targetWeightKg,
          gender,
          fitnessGoals,
          experienceLevel,
          workoutFrequency,
          focusAreas,
          unitSystem,
        ] = await Promise.all([
          AsyncStorage.getItem("@hylift_age"),
          AsyncStorage.getItem("@hylift_height"),
          AsyncStorage.getItem("@hylift_weight"),
          AsyncStorage.getItem("@hylift_target_weight"),
          AsyncStorage.getItem("@hylift_gender"),
          AsyncStorage.getItem("@hylift_fitness_goals"),
          AsyncStorage.getItem("@hylift_experience_level"),
          AsyncStorage.getItem("@hylift_workout_frequency"),
          AsyncStorage.getItem("@hylift_focus_areas"),
          AsyncStorage.getItem("@hylift_unit_system"),
        ]);

        // Calculate date_of_birth from age
        let dateOfBirth: string | null = null;
        if (age) {
          const now = new Date();
          now.setFullYear(now.getFullYear() - parseInt(age, 10));
          dateOfBirth = now.toISOString().split("T")[0];
        }

        await supabase.from("user_profiles").upsert({
          id: user.id,
          username:
            user.user_metadata?.username ||
            "user_" + user.id.substring(0, 8),
          unit_system: unitSystem || null,
          height_cm: heightCm ? parseFloat(heightCm) : null,
          weight_kg: weightKg ? parseFloat(weightKg) : null,
          target_weight_kg: targetWeightKg
            ? parseFloat(targetWeightKg)
            : null,
          date_of_birth: dateOfBirth,
          gender: gender || null,
          fitness_goal: fitnessGoals || null,
          experience_level: experienceLevel || null,
          workout_frequency: workoutFrequency
            ? parseInt(workoutFrequency, 10)
            : null,
          focus_areas: focusAreas ? JSON.parse(focusAreas) : null,
          onboarding_completed: true,
        });
      }
    };

    saveProfile();

    const timer = setTimeout(() => {
      router.navigate("/(tabs)/schedule");
    }, 1500);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons
            name="check-circle"
            size={120}
            color={theme.primary.main}
          />
        </View>

        <Text style={styles.title}>You&apos;re Ready!</Text>
        <Text style={styles.subtitle}>
          Let&apos;s start your fitness journey together
        </Text>
      </View>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background.dark,
      paddingHorizontal: 32,
      paddingBottom: 20,
      justifyContent: "center",
      alignItems: "center",
    },
    content: {
      alignItems: "center",
    },
    iconContainer: {
      marginBottom: 40,
    },
    title: {
      fontSize: 40,
      fontFamily: FONTS.bold,
      color: theme.foreground.white,
      textAlign: "center",
      marginBottom: 16,
    },
    subtitle: {
      fontSize: 18,
      color: theme.foreground.gray,
      textAlign: "center",
      lineHeight: 28,
    },
  });

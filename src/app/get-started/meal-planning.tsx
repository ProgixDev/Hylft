import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ChipButton from "../../components/ui/ChipButton";
import SignupProgress from "../../components/ui/SignupProgress";
import { FONTS } from "../../constants/fonts";
import { Theme } from "../../constants/themes";
import { useTheme } from "../../contexts/ThemeContext";

const OPTIONS: {
  id: "never" | "rarely" | "occasionally" | "frequently" | "always";
  label: string;
  desc: string;
}[] = [
  { id: "never", label: "Never", desc: "I eat whatever shows up" },
  { id: "rarely", label: "Rarely", desc: "Once in a while" },
  { id: "occasionally", label: "Occasionally", desc: "Some days, not most" },
  { id: "frequently", label: "Frequently", desc: "Most days I plan" },
  { id: "always", label: "Always", desc: "I plan every meal" },
];

export default function MealPlanningScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [selected, setSelected] = useState<string>("");
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slide, {
        toValue: 0,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fade, slide]);

  const handleContinue = async () => {
    if (!selected) return;
    await AsyncStorage.setItem("@hylift_meal_planning", selected);
    router.push("/get-started/meal-congrats");
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={{
          flex: 1,
          opacity: fade,
          transform: [{ translateY: slide }],
        }}
      >
        <SignupProgress current={4} total={13} />

        <Text style={styles.title}>How often do you plan meals in advance?</Text>
        <Text style={styles.subtitle}>
          No judgment — we'll meet you where you are.
        </Text>

        <View style={styles.list}>
          {OPTIONS.map((o) => {
            const isSelected = selected === o.id;
            return (
              <TouchableOpacity
                key={o.id}
                activeOpacity={0.85}
                onPress={() => setSelected(o.id)}
                style={[
                  styles.card,
                  {
                    borderColor: isSelected
                      ? theme.primary.main
                      : theme.background.accent,
                    backgroundColor: isSelected
                      ? theme.primary.main + "14"
                      : theme.background.darker,
                  },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.cardTitle,
                      {
                        color: isSelected
                          ? theme.primary.main
                          : theme.foreground.white,
                      },
                    ]}
                  >
                    {o.label}
                  </Text>
                  <Text style={[styles.cardDesc, { color: theme.foreground.gray }]}>
                    {o.desc}
                  </Text>
                </View>
                <View
                  style={[
                    styles.radio,
                    {
                      borderColor: isSelected
                        ? theme.primary.main
                        : theme.background.accent,
                      backgroundColor: isSelected
                        ? theme.primary.main
                        : "transparent",
                    },
                  ]}
                >
                  {isSelected && (
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </Animated.View>

      <ChipButton
        title="Continue"
        onPress={handleContinue}
        variant="primary"
        size="lg"
        fullWidth
        disabled={!selected}
      />
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background.dark,
      paddingHorizontal: 20,
      paddingBottom: 16,
    },
    title: {
      fontSize: 24,
      fontFamily: FONTS.bold,
      color: theme.foreground.white,
      marginBottom: 6,
    },
    subtitle: {
      fontSize: 13,
      color: theme.foreground.gray,
      lineHeight: 20,
      marginBottom: 18,
    },
    list: {
      gap: 10,
    },
    card: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1.5,
      borderRadius: 14,
      padding: 14,
    },
    cardTitle: {
      fontSize: 15,
      fontFamily: FONTS.bold,
      marginBottom: 2,
    },
    cardDesc: {
      fontSize: 12,
    },
    radio: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      alignItems: "center",
      justifyContent: "center",
    },
  });
}

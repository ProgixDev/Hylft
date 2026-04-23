import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  ScrollView,
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

const HABITS: {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { id: "eat_balanced", label: "Eat balanced meals", icon: "nutrition-outline" },
  { id: "drink_water", label: "Drink more water", icon: "water-outline" },
  { id: "sleep_well", label: "Sleep better", icon: "moon-outline" },
  { id: "move_daily", label: "Move every day", icon: "walk-outline" },
  { id: "strength", label: "Build strength", icon: "barbell-outline" },
  { id: "reduce_stress", label: "Reduce stress", icon: "leaf-outline" },
  { id: "cut_sugar", label: "Cut added sugar", icon: "ice-cream-outline" },
  { id: "track_progress", label: "Track progress", icon: "stats-chart-outline" },
  { id: "mindful_eating", label: "Eat mindfully", icon: "happy-outline" },
];

export default function HabitsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [selected, setSelected] = useState<string[]>([]);
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

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleContinue = async () => {
    if (selected.length === 0) return;
    await AsyncStorage.setItem("@hylift_habits", JSON.stringify(selected));
    router.push("/get-started/habits-congrats");
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
        <SignupProgress current={3} total={13} />

        <Text style={styles.title}>Which healthy habits matter to you?</Text>
        <Text style={styles.subtitle}>
          Select all that apply. We'll nudge you on the ones you pick.
        </Text>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 16 }}
        >
          <View style={styles.grid}>
            {HABITS.map((h) => {
              const isSelected = selected.includes(h.id);
              return (
                <TouchableOpacity
                  key={h.id}
                  activeOpacity={0.85}
                  onPress={() => toggle(h.id)}
                  style={[
                    styles.chip,
                    {
                      borderColor: isSelected
                        ? theme.primary.main
                        : theme.background.accent,
                      backgroundColor: isSelected
                        ? theme.primary.main + "18"
                        : theme.background.darker,
                    },
                  ]}
                >
                  <Ionicons
                    name={h.icon}
                    size={18}
                    color={
                      isSelected ? theme.primary.main : theme.foreground.gray
                    }
                  />
                  <Text
                    style={[
                      styles.chipLabel,
                      {
                        color: isSelected
                          ? theme.primary.main
                          : theme.foreground.white,
                      },
                    ]}
                  >
                    {h.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {selected.length > 0 && (
            <Text style={[styles.count, { color: theme.foreground.gray }]}>
              {selected.length} selected
            </Text>
          )}
        </ScrollView>
      </Animated.View>

      <ChipButton
        title="Continue"
        onPress={handleContinue}
        variant="primary"
        size="lg"
        fullWidth
        disabled={selected.length === 0}
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
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      borderWidth: 1.5,
      borderRadius: 999,
      paddingVertical: 10,
      paddingHorizontal: 14,
    },
    chipLabel: {
      fontSize: 13,
      fontFamily: FONTS.semiBold,
    },
    count: {
      textAlign: "center",
      fontSize: 12,
      marginTop: 14,
    },
  });
}

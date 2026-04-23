import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
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

type GoalOption = {
  id: string;
  label: string;
  sub: string;
  kgPerWeek: number;
  pace: "slow" | "steady" | "fast";
};

const LOSS_OPTIONS: GoalOption[] = [
  { id: "lose_0_25", label: "Lose 0.25 kg / week", sub: "Easy and sustainable", kgPerWeek: -0.25, pace: "slow" },
  { id: "lose_0_5", label: "Lose 0.5 kg / week", sub: "Recommended", kgPerWeek: -0.5, pace: "steady" },
  { id: "lose_0_75", label: "Lose 0.75 kg / week", sub: "Ambitious", kgPerWeek: -0.75, pace: "fast" },
  { id: "lose_1_0", label: "Lose 1 kg / week", sub: "Aggressive", kgPerWeek: -1.0, pace: "fast" },
];

const GAIN_OPTIONS: GoalOption[] = [
  { id: "gain_0_2", label: "Gain 0.2 kg / week", sub: "Lean, slow bulk", kgPerWeek: 0.2, pace: "slow" },
  { id: "gain_0_35", label: "Gain 0.35 kg / week", sub: "Recommended", kgPerWeek: 0.35, pace: "steady" },
  { id: "gain_0_5", label: "Gain 0.5 kg / week", sub: "Ambitious", kgPerWeek: 0.5, pace: "fast" },
];

const MAINTAIN_OPTIONS: GoalOption[] = [
  { id: "maintain", label: "Maintain weight", sub: "Keep your current weight", kgPerWeek: 0, pace: "steady" },
];

export default function WeeklyGoalScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [goal, setGoal] = useState<string>("");
  const [selected, setSelected] = useState<string>("");
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    AsyncStorage.getItem("@hylift_goal").then((v) => setGoal(v || "lose_weight"));
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

  const options = useMemo<GoalOption[]>(() => {
    if (goal === "gain_weight" || goal === "build_muscle") return GAIN_OPTIONS;
    if (goal === "maintain") return MAINTAIN_OPTIONS;
    return LOSS_OPTIONS;
  }, [goal]);

  const headline = useMemo(() => {
    if (goal === "gain_weight" || goal === "build_muscle") return "What's your weekly gain goal?";
    if (goal === "maintain") return "Confirm your weekly goal";
    return "What's your weekly loss goal?";
  }, [goal]);

  const handleContinue = async () => {
    if (!selected) return;
    const picked = options.find((o) => o.id === selected);
    if (picked) {
      await AsyncStorage.setItem("@hylift_weekly_goal", picked.id);
      await AsyncStorage.setItem(
        "@hylift_weekly_goal_kg",
        picked.kgPerWeek.toString(),
      );
    }
    router.push("/get-started/account");
  };

  const paceColor = (pace: GoalOption["pace"]) => {
    if (pace === "slow") return "#22C55E";
    if (pace === "steady") return theme.primary.main;
    return "#F59E0B";
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
        <SignupProgress current={9} total={13} />

        <Text style={styles.title}>{headline}</Text>
        <Text style={styles.subtitle}>
          You can change this any time — small steady wins compound.
        </Text>

        <View style={styles.list}>
          {options.map((o) => {
            const isSelected = selected === o.id;
            const color = paceColor(o.pace);
            return (
              <TouchableOpacity
                key={o.id}
                activeOpacity={0.85}
                onPress={() => setSelected(o.id)}
                style={[
                  styles.card,
                  {
                    borderColor: isSelected ? color : theme.background.accent,
                    backgroundColor: isSelected
                      ? color + "14"
                      : theme.background.darker,
                  },
                ]}
              >
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor: isSelected
                        ? color + "22"
                        : theme.background.accent,
                    },
                  ]}
                >
                  <Ionicons
                    name={
                      o.kgPerWeek < 0
                        ? "trending-down"
                        : o.kgPerWeek > 0
                          ? "trending-up"
                          : "remove"
                    }
                    size={20}
                    color={isSelected ? color : theme.foreground.gray}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.cardTitle,
                      {
                        color: isSelected ? color : theme.foreground.white,
                      },
                    ]}
                  >
                    {o.label}
                  </Text>
                  <Text style={[styles.cardDesc, { color: theme.foreground.gray }]}>
                    {o.sub}
                  </Text>
                </View>
                {isSelected && (
                  <View style={[styles.check, { backgroundColor: color }]}>
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  </View>
                )}
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
      gap: 12,
      borderWidth: 1.5,
      borderRadius: 14,
      padding: 14,
    },
    badge: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    cardTitle: {
      fontSize: 15,
      fontFamily: FONTS.bold,
      marginBottom: 2,
    },
    cardDesc: {
      fontSize: 12,
    },
    check: {
      width: 22,
      height: 22,
      borderRadius: 11,
      alignItems: "center",
      justifyContent: "center",
    },
  });
}

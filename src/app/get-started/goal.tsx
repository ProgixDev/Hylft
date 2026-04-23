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

const GOALS: {
  id: "lose_weight" | "maintain" | "gain_weight" | "build_muscle";
  label: string;
  desc: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    id: "lose_weight",
    label: "Lose weight",
    desc: "Burn fat, feel lighter",
    icon: "trending-down-outline",
  },
  {
    id: "maintain",
    label: "Maintain weight",
    desc: "Stay where you are",
    icon: "remove-outline",
  },
  {
    id: "gain_weight",
    label: "Gain weight",
    desc: "Fuel up, add size",
    icon: "trending-up-outline",
  },
  {
    id: "build_muscle",
    label: "Build muscle",
    desc: "Get stronger and leaner",
    icon: "barbell-outline",
  },
];

export default function GoalScreen() {
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
    await AsyncStorage.setItem("@hylift_goal", selected);
    router.push("/get-started/goal-congrats");
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
        <SignupProgress current={2} total={13} />

        <Text style={styles.title}>What's your main goal?</Text>
        <Text style={styles.subtitle}>
          Pick one — we'll tailor everything in Hylift around it.
        </Text>

        <View style={styles.list}>
          {GOALS.map((g) => {
            const isSelected = selected === g.id;
            return (
              <TouchableOpacity
                key={g.id}
                activeOpacity={0.8}
                onPress={() => setSelected(g.id)}
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
                <View
                  style={[
                    styles.iconWrap,
                    {
                      backgroundColor: isSelected
                        ? theme.primary.main + "22"
                        : theme.background.accent,
                    },
                  ]}
                >
                  <Ionicons
                    name={g.icon}
                    size={22}
                    color={
                      isSelected ? theme.primary.main : theme.foreground.gray
                    }
                  />
                </View>
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
                    {g.label}
                  </Text>
                  <Text style={[styles.cardDesc, { color: theme.foreground.gray }]}>
                    {g.desc}
                  </Text>
                </View>
                {isSelected && (
                  <View
                    style={[
                      styles.check,
                      { backgroundColor: theme.primary.main },
                    ]}
                  >
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
    iconWrap: {
      width: 42,
      height: 42,
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

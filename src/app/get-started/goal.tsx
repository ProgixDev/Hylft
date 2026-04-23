import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
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
  recommended?: boolean;
}[] = [
  {
    id: "lose_weight",
    label: "Lose weight",
    desc: "Burn fat, feel lighter and more energetic",
    icon: "trending-down-outline",
    recommended: true,
  },
  {
    id: "maintain",
    label: "Maintain weight",
    desc: "Keep your current weight and stay consistent",
    icon: "remove-outline",
  },
  {
    id: "gain_weight",
    label: "Gain weight",
    desc: "Fuel up, add size and healthy mass",
    icon: "trending-up-outline",
  },
  {
    id: "build_muscle",
    label: "Build muscle",
    desc: "Get stronger, leaner and more defined",
    icon: "barbell-outline",
  },
];

export default function GoalScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string>("");
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(28)).current;

  const goals = [
    {
      ...GOALS[0],
      label: t("onboarding.goalFlow.options.lose_weight.label"),
      desc: t("onboarding.goalFlow.options.lose_weight.description"),
    },
    {
      ...GOALS[1],
      label: t("onboarding.goalFlow.options.maintain.label"),
      desc: t("onboarding.goalFlow.options.maintain.description"),
    },
    {
      ...GOALS[2],
      label: t("onboarding.goalFlow.options.gain_weight.label"),
      desc: t("onboarding.goalFlow.options.gain_weight.description"),
    },
    {
      ...GOALS[3],
      label: t("onboarding.goalFlow.options.build_muscle.label"),
      desc: t("onboarding.goalFlow.options.build_muscle.description"),
    },
  ];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 440,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slide, {
        toValue: 0,
        duration: 440,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleContinue = async () => {
    if (!selected) return;
    await AsyncStorage.setItem("@hylift_goal", selected);
    router.push("/get-started/goal-congrats");
  };

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <Animated.View
        style={{ flex: 1, opacity: fade, transform: [{ translateY: slide }] }}
      >
        <SignupProgress current={2} total={13} />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{t("onboarding.goalFlow.title")}</Text>
          <Text style={styles.subtitle}>
            {t("onboarding.goalFlow.subtitle")}
          </Text>
        </View>

        {/* Cards */}
        <View style={styles.list}>
          {goals.map((g) => {
            const isSelected = selected === g.id;
            return (
              <TouchableOpacity
                key={g.id}
                activeOpacity={0.82}
                onPress={() => setSelected(g.id)}
                style={[
                  styles.card,
                  {
                    borderColor: isSelected
                      ? theme.primary.main
                      : theme.background.accent,
                    backgroundColor: isSelected
                      ? theme.primary.main + "16"
                      : theme.background.darker,
                  },
                ]}
              >
                {/* Left icon */}
                <View
                  style={[
                    styles.iconWrap,
                    {
                      backgroundColor: isSelected
                        ? theme.primary.main + "28"
                        : theme.background.accent,
                    },
                  ]}
                >
                  <Ionicons
                    name={g.icon}
                    size={26}
                    color={
                      isSelected ? theme.primary.main : theme.foreground.gray
                    }
                  />
                </View>

                {/* Text */}
                <View style={{ flex: 1 }}>
                  <View style={styles.labelRow}>
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
                    {g.recommended && (
                      <View
                        style={[
                          styles.tag,
                          {
                            backgroundColor: theme.primary.main + "22",
                            borderColor: theme.primary.main + "55",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.tagText,
                            { color: theme.primary.main },
                          ]}
                        >
                          {t("onboarding.goalFlow.popular")}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text
                    style={[styles.cardDesc, { color: theme.foreground.gray }]}
                  >
                    {g.desc}
                  </Text>
                </View>

                {/* Checkmark */}
                <View
                  style={[
                    styles.check,
                    {
                      backgroundColor: isSelected
                        ? theme.primary.main
                        : "transparent",
                      borderColor: isSelected
                        ? theme.primary.main
                        : theme.background.accent,
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
        title={t("common.continue")}
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
    header: {
      marginBottom: 20,
    },
    title: {
      fontSize: 26,
      fontFamily: FONTS.extraBold,
      color: theme.foreground.white,
      marginBottom: 6,
      lineHeight: 32,
    },
    subtitle: {
      fontSize: 14,
      color: theme.foreground.gray,
      lineHeight: 21,
    },
    list: {
      gap: 12,
    },
    card: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      borderWidth: 1.5,
      borderRadius: 18,
      padding: 16,
    },
    iconWrap: {
      width: 54,
      height: 54,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    labelRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 4,
    },
    cardTitle: {
      fontSize: 16,
      fontFamily: FONTS.bold,
    },
    tag: {
      borderWidth: 1,
      borderRadius: 100,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    tagText: {
      fontSize: 10,
      fontFamily: FONTS.bold,
      letterSpacing: 0.5,
    },
    cardDesc: {
      fontSize: 13,
      lineHeight: 18,
    },
    check: {
      width: 26,
      height: 26,
      borderRadius: 13,
      borderWidth: 2,
      alignItems: "center",
      justifyContent: "center",
    },
  });
}

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

const LEVELS: {
  id: "sedentary" | "light" | "moderate" | "active" | "very_active";
  label: string;
  desc: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    id: "sedentary",
    label: "Sedentary",
    desc: "Mostly sitting, little exercise",
    icon: "cafe-outline",
  },
  {
    id: "light",
    label: "Lightly active",
    desc: "Light walks, occasional workouts",
    icon: "walk-outline",
  },
  {
    id: "moderate",
    label: "Moderately active",
    desc: "3–5 workouts or active job",
    icon: "bicycle-outline",
  },
  {
    id: "active",
    label: "Very active",
    desc: "Daily workouts, on your feet",
    icon: "fitness-outline",
  },
  {
    id: "very_active",
    label: "Extra active",
    desc: "Intense training or physical job",
    icon: "flame-outline",
  },
];

export default function ActivityLevel() {
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
    await AsyncStorage.setItem("@hylift_activity_level", selected);
    router.push("/get-started/gender?flow=signup");
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
        <SignupProgress current={5} total={13} />

        <Text style={styles.title}>What's your baseline activity level?</Text>
        <Text style={styles.subtitle}>
          Pick the one that best describes your typical week.
        </Text>

        <View style={styles.list}>
          {LEVELS.map((lv) => {
            const isSelected = selected === lv.id;
            return (
              <TouchableOpacity
                key={lv.id}
                activeOpacity={0.85}
                onPress={() => setSelected(lv.id)}
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
                    name={lv.icon}
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
                    {lv.label}
                  </Text>
                  <Text style={[styles.cardDesc, { color: theme.foreground.gray }]}>
                    {lv.desc}
                  </Text>
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
  });
}

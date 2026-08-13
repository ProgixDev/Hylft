import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Text } from "../../components/ui/ScaledText";
import ChipButton from "../../components/ui/ChipButton";
import SignupProgress from "../../components/ui/SignupProgress";
import { FONTS } from "../../constants/fonts";
import { useTheme } from "../../contexts/ThemeContext";



const HABITS: {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  accent: string;
  tint: string;
}[] = [
  {
    id: "eat_balanced",
    icon: "nutrition-outline",
    accent: "#059669",
    tint: "#ECFDF5",
  },
  {
    id: "drink_water",
    icon: "water-outline",
    accent: "#0369A1",
    tint: "#EFF6FF",
  },
  {
    id: "sleep_well",
    icon: "moon-outline",
    accent: "#6D28D9",
    tint: "#F5F3FF",
  },
  {
    id: "move_daily",
    icon: "walk-outline",
    accent: "#C2410C",
    tint: "#FFF7ED",
  },
  {
    id: "strength",
    icon: "barbell-outline",
    accent: "#0F766E",
    tint: "#F0FDFA",
  },
  {
    id: "reduce_stress",
    icon: "leaf-outline",
    accent: "#4D7C0F",
    tint: "#F7FEE7",
  },
  {
    id: "cut_sugar",
    icon: "ice-cream-outline",
    accent: "#9D174D",
    tint: "#FDF2F8",
  },
  {
    id: "track_progress",
    icon: "stats-chart-outline",
    accent: "#1D4ED8",
    tint: "#EFF6FF",
  },
  {
    id: "mindful_eating",
    icon: "happy-outline",
    accent: "#92400E",
    tint: "#FFFBEB",
  },
];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function HabitTile({
  habit,
  index,
  selected,
  onPress,
  label,
}: {
  habit: (typeof HABITS)[number];
  index: number;
  selected: boolean;
  onPress: () => void;
  label: string;
}) {
  const { theme } = useTheme();
  const primaryColor = theme.primary.main;

  const entrance = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(entrance, {
      toValue: 1,
      delay: 90 + index * 35,
      tension: 58,
      friction: 9,
      useNativeDriver: true,
    }).start();
  }, [entrance, index]);

  const pressIn = () => {
    Animated.spring(scale, {
      toValue: 0.95,
      speed: 40,
      bounciness: 0,
      useNativeDriver: true,
    }).start();
  };

  const pressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      speed: 28,
      bounciness: 6,
      useNativeDriver: true,
    }).start();
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      hitSlop={4}
      style={[
        styles.tileShell,
        {
          opacity: entrance,
          transform: [
            {
              translateY: entrance.interpolate({
                inputRange: [0, 1],
                outputRange: [16, 0],
              }),
            },
            { scale },
          ],
        },
      ]}
    >
      <View
        style={[
          styles.tileFace,
          {
            backgroundColor: selected ? primaryColor + "18" : "#FFFFFF",
            borderColor: selected ? primaryColor : "#E5E7EB",
          },
        ]}
      >
        <View style={[styles.tileIcon, { backgroundColor: "#E5E7EB" }]}>
          <Ionicons
            name={habit.icon}
            size={24}
            color={selected ? primaryColor : "#6B7280"}
          />
        </View>
        <Text style={styles.tileLabel} numberOfLines={2}>
          {label}
        </Text>
        {selected && (
          <View style={[styles.tileCheck, { backgroundColor: primaryColor }]} />
        )}
      </View>
    </AnimatedPressable>
  );
}

export default function HabitsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string[]>([]);

  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(28)).current;

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
  }, [fade, slide]);

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleContinue = async () => {
    if (selected.length === 0) return;
    await AsyncStorage.setItem("@hylift_habits", JSON.stringify(selected));
    router.push("/get-started/meal-planning");
  };

  return (
    <View style={[styles.container, { backgroundColor: "#F8F9FC" }]}>
      <Animated.View
        style={{ flex: 1, opacity: fade, transform: [{ translateY: slide }] }}
      >
        <SignupProgress current={3} total={13} />

        <View style={styles.header}>
          <Text style={styles.title}>{t("onboarding.habits.title")}</Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.grid}
        >
          {HABITS.map((h, index) => {
            const isSelected = selected.includes(h.id);
            return (
              <HabitTile
                key={h.id}
                habit={h}
                index={index}
                selected={isSelected}
                onPress={() => toggle(h.id)}
                label={t(`onboarding.habits.options.${h.id}`)}
              />
            );
          })}
        </ScrollView>
      </Animated.View>

      <ChipButton
        threeD
        title={t("common.continue")}
        onPress={handleContinue}
        variant="primary"
        size="lg"
        fullWidth
        disabled={selected.length === 0}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontFamily: FONTS.extraBold,
    lineHeight: 32,
    color: "#102b4a",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingBottom: 16,
  },
  tileShell: {
    width: "48%",
    borderRadius: 14,
  },
  tileFace: {
    minHeight: 110,
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 12,
    justifyContent: "space-between",
  },
  tileIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  tileLabel: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    lineHeight: 18,
    paddingRight: 18,
    color: "#102b4a",
  },
  tileCheck: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 20,
    height: 20,
    borderRadius: 10,
  },
});

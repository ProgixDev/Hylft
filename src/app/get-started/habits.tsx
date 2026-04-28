import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import ChipButton from "../../components/ui/ChipButton";
import SignupProgress from "../../components/ui/SignupProgress";
import { FONTS } from "../../constants/fonts";

const BG = "#FBFCFA";

const HABITS: {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  accent: string;
  depth: string;
  tint: string;
}[] = [
  {
    id: "eat_balanced",
    icon: "nutrition-outline",
    accent: "#22C17A",
    depth: "#168E5A",
    tint: "#EAF8F1",
  },
  {
    id: "drink_water",
    icon: "water-outline",
    accent: "#38BDF8",
    depth: "#0284C7",
    tint: "#E8F7FF",
  },
  {
    id: "sleep_well",
    icon: "moon-outline",
    accent: "#8B5CF6",
    depth: "#6D28D9",
    tint: "#F3EEFF",
  },
  {
    id: "move_daily",
    icon: "walk-outline",
    accent: "#F97316",
    depth: "#C2410C",
    tint: "#FFF1E6",
  },
  {
    id: "strength",
    icon: "barbell-outline",
    accent: "#14B8A6",
    depth: "#0F766E",
    tint: "#E8FAF7",
  },
  {
    id: "reduce_stress",
    icon: "leaf-outline",
    accent: "#84CC16",
    depth: "#4D7C0F",
    tint: "#F3FCE7",
  },
  {
    id: "cut_sugar",
    icon: "ice-cream-outline",
    accent: "#EC4899",
    depth: "#BE185D",
    tint: "#FCE7F3",
  },
  {
    id: "track_progress",
    icon: "stats-chart-outline",
    accent: "#3B82F6",
    depth: "#1D5FC4",
    tint: "#EDF4FF",
  },
  {
    id: "mindful_eating",
    icon: "happy-outline",
    accent: "#F59E0B",
    depth: "#C87504",
    tint: "#FFF4DF",
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
  const entrance = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const pressDepth = useRef(new Animated.Value(0)).current;

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
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 0.99,
        speed: 40,
        bounciness: 0,
        useNativeDriver: true,
      }),
      Animated.spring(pressDepth, {
        toValue: 5,
        speed: 40,
        bounciness: 0,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const pressOut = () => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        speed: 28,
        bounciness: 6,
        useNativeDriver: true,
      }),
      Animated.spring(pressDepth, {
        toValue: 0,
        speed: 26,
        bounciness: 6,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      hitSlop={4}
      android_ripple={{ color: "rgba(255,255,255,0.18)" }}
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
      <View style={[styles.tileBase, { backgroundColor: habit.depth }]}>
        <Animated.View
          style={[
            styles.tileFace,
            {
              backgroundColor: selected ? habit.accent : "#FFFFFF",
              borderColor: selected ? habit.accent : "#E8EDF0",
              transform: [{ translateY: pressDepth }],
            },
          ]}
        >
          <View
            style={[
              styles.tileIcon,
              {
                backgroundColor: selected
                  ? "rgba(255,255,255,0.22)"
                  : habit.tint,
              },
            ]}
          >
            <Ionicons
              name={habit.icon}
              size={24}
              color={selected ? "#FFFFFF" : habit.accent}
            />
          </View>
          <Text
            style={[
              styles.tileLabel,
              { color: selected ? "#FFFFFF" : "#111827" },
            ]}
            numberOfLines={2}
          >
            {label}
          </Text>
          <View
            style={[
              styles.tileCheck,
              {
                backgroundColor: selected ? "#FFFFFF" : habit.tint,
                borderColor: selected ? "#FFFFFF" : habit.accent + "55",
              },
            ]}
          >
            {selected && (
              <Ionicons name="checkmark" size={12} color={habit.accent} />
            )}
          </View>
        </Animated.View>
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
    <View style={styles.container}>
      <Animated.View
        style={{ flex: 1, opacity: fade, transform: [{ translateY: slide }] }}
      >
        <SignupProgress current={3} total={13} />

        <View style={styles.header}>
          <Text style={styles.title}>{t("onboarding.habits.title")}</Text>
          <Text style={styles.subtitle}>{t("onboarding.habits.subtitle")}</Text>
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
    backgroundColor: BG,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontFamily: FONTS.extraBold,
    color: "#111827",
    marginBottom: 6,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 14,
    color: "#64748B",
    lineHeight: 21,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    paddingBottom: 16,
  },
  tileShell: {
    width: "48%",
    borderRadius: 18,
    ...Platform.select({
      ios: {
        shadowColor: "#102018",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 14,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  tileBase: {
    borderRadius: 18,
    paddingBottom: 7,
    overflow: "hidden",
  },
  tileFace: {
    minHeight: 118,
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
    justifyContent: "space-between",
  },
  tileIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  tileLabel: {
    fontSize: 15,
    fontFamily: FONTS.bold,
    lineHeight: 19,
    paddingRight: 18,
  },
  tileCheck: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Animated,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { Text } from "../../components/ui/ScaledText";
import SignupProgress from "../../components/ui/SignupProgress";
import { FONTS } from "../../constants/fonts";
import { useTheme } from "../../contexts/ThemeContext";

const OPTIONS: {
  id: "never" | "rarely" | "occasionally" | "frequently" | "always";
  bars: number;
}[] = [
  { id: "never", bars: 1 },
  { id: "rarely", bars: 2 },
  { id: "occasionally", bars: 3 },
  { id: "frequently", bars: 4 },
  { id: "always", bars: 5 },
];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function MealOptionCard({
  option,
  selected,
  onPress,
  label,
}: {
  option: (typeof OPTIONS)[number];
  selected: boolean;
  onPress: () => void;
  label: string;
}) {
  const { theme } = useTheme();
  const primaryColor = theme.primary.main;

  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () => {
    Animated.spring(scale, {
      toValue: 0.99,
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
      hitSlop={6}
      android_ripple={{ color: "rgba(255,255,255,0.18)" }}
      style={[s.cardShell, { transform: [{ scale }] }]}
    >
      <View
        style={[
          s.cardFace,
          {
            backgroundColor: selected ? primaryColor + "18" : theme.background.darker,
            borderColor: selected ? primaryColor : theme.background.accent,
          },
        ]}
      >
        <View style={s.cardCopy}>
          <Text
            style={[
              s.cardTitle,
              { color: selected ? primaryColor : theme.foreground.white },
            ]}
          >
            {label}
          </Text>
        </View>

        <View style={s.progressWrap}>
          <View
            style={[
              s.progressTrack,
              {
                backgroundColor: selected
                  ? primaryColor + "38"
                  : theme.background.accent,
              },
            ]}
          >
            <View
              style={[
                s.progressFill,
                {
                  width: `${option.bars * 20}%`,
                  backgroundColor: selected ? primaryColor : theme.foreground.white,
                },
              ]}
            />
          </View>
          <View style={s.progressDots}>
            {Array.from({ length: 5 }).map((_, i) => {
              const active = i < option.bars;
              return (
                <View
                  key={i}
                  style={[
                    s.progressDot,
                    {
                      backgroundColor: active
                        ? selected
                          ? primaryColor
                          : theme.foreground.white
                        : selected
                          ? primaryColor + "40"
                          : theme.foreground.gray + "40",
                    },
                  ]}
                />
              );
            })}
          </View>
        </View>
      </View>
    </AnimatedPressable>
  );
}

export default function MealPlanningScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [selected, setSelected] = useState<string>("");
  const [isNavigating, setIsNavigating] = useState(false);

  const handleSelect = async (id: string) => {
    if (isNavigating) return;
    setSelected(id);
    setIsNavigating(true);
    try {
      await AsyncStorage.setItem("@hylift_meal_planning", id);
    } finally {
      router.push("/get-started/gender?flow=signup");
    }
  };

  return (
    <View style={[s.container, { backgroundColor: theme.background.dark }]}>
      <View style={{ flex: 1 }}>
        <SignupProgress current={4} total={13} />

        <View style={s.header}>
          <Text style={[s.title, { color: theme.foreground.white }]}>{t("onboarding.mealPlanning.title")}</Text>
        </View>

        <View style={s.list}>
          {OPTIONS.map((o) => {
            const isSelected = selected === o.id;
            return (
              <MealOptionCard
                key={o.id}
                option={o}
                selected={isSelected}
                onPress={() => void handleSelect(o.id)}
                label={t(`onboarding.mealPlanning.options.${o.id}.label`)}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  header: {
    marginBottom: 36,
  },
  title: {
    fontSize: 26,
    fontFamily: FONTS.extraBold,
    lineHeight: 32,
  },
  list: {
    gap: 14,
  },
  cardShell: {
    borderRadius: 16,
  },
  cardFace: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    minHeight: 78,
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  cardCopy: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    lineHeight: 23,
    fontFamily: FONTS.extraBold,
  },
  progressWrap: {
    width: 112,
    gap: 8,
    flexShrink: 0,
  },
  progressTrack: {
    height: 12,
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
  },
  progressDots: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
});

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
            backgroundColor: selected ? primaryColor + "18" : '#FFFFFF',
            borderColor: selected ? primaryColor : '#E5E7EB',
          },
        ]}
      >
        <View style={s.cardCopy}>
          <Text
            style={[
              s.cardTitle,
              { color: selected ? primaryColor : "#102b4a" },
            ]}
          >
            {label}
          </Text>
        </View>

        <View style={s.dashRow}>
          {Array.from({ length: 5 }).map((_, i) => {
            const active = i < option.bars;
            return (
              <View
                key={i}
                style={[
                  s.dash,
                  {
                    backgroundColor: active
                      ? selected ? primaryColor : "#102b4a"
                      : "#D1D5DB",
                  },
                ]}
              />
            );
          })}
        </View>
      </View>
    </AnimatedPressable>
  );
}

export default function MealPlanningScreen() {
  const router = useRouter();
  const { t } = useTranslation();
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
    <View style={[s.container, { backgroundColor: '#F8F9FC' }]}>
      <View style={{ flex: 1 }}>
        <SignupProgress current={4} total={13} />

        <View style={s.header}>
          <Text style={s.title}>{t("onboarding.mealPlanning.title")}</Text>
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
    color: "#102b4a",
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
  dashRow: {
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
    flexShrink: 0,
  },
  dash: {
    width: 18,
    height: 5,
    borderRadius: 3,
  },
});

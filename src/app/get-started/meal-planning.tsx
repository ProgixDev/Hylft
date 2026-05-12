import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import SignupProgress from "../../components/ui/SignupProgress";
import { FONTS } from "../../constants/fonts";
import { useTheme } from "../../contexts/ThemeContext";

function getPrimaryDepth(primary: string): string {
  if (primary.toUpperCase() === "#D4A44C") return "#8A6424";
  if (primary.toUpperCase() === "#C48A6A") return "#8A5B43";
  return "#071527";
}

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
  const depthColor = getPrimaryDepth(primaryColor);

  const scale = useRef(new Animated.Value(1)).current;
  const pressDepth = useRef(new Animated.Value(0)).current;

  const pressIn = () => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 0.99,
        speed: 40,
        bounciness: 0,
        useNativeDriver: true,
      }),
      Animated.spring(pressDepth, {
        toValue: 6,
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
      hitSlop={6}
      android_ripple={{ color: "rgba(255,255,255,0.18)" }}
      style={[s.cardShell, { transform: [{ scale }] }]}
    >
      <View style={[s.cardBase, { backgroundColor: selected ? depthColor : "#D1D5DB" }]}>
        <Animated.View
          style={[
            s.cardFace,
            {
              backgroundColor: selected ? primaryColor : "#FFFFFF",
              borderColor: selected ? primaryColor : "#E5E7EB",
              transform: [{ translateY: pressDepth }],
            },
          ]}
        >
          <View style={s.cardCopy}>
            <Text
              style={[
                s.cardTitle,
                { color: selected ? "#FFFFFF" : "#111827" },
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
                    ? "rgba(255,255,255,0.22)"
                    : "#E5E7EB",
                },
              ]}
            >
              <View
                style={[
                  s.progressFill,
                  {
                    width: `${option.bars * 20}%`,
                    backgroundColor: selected ? "#FFFFFF" : "#374151",
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
                            ? "#FFFFFF"
                            : "#374151"
                          : selected
                            ? "rgba(255,255,255,0.3)"
                            : "#D1D5DB",
                      },
                    ]}
                  />
                );
              })}
            </View>
          </View>
        </Animated.View>
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
    <View style={s.container}>
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
    backgroundColor: "#FBFCFA",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  header: {
    marginBottom: 36,
  },
  title: {
    fontSize: 26,
    fontFamily: FONTS.extraBold,
    color: "#111827",
    lineHeight: 32,
  },
  list: {
    gap: 14,
  },
  cardShell: {
    borderRadius: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#102018",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.11,
        shadowRadius: 15,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  cardBase: {
    borderRadius: 20,
    paddingBottom: 8,
    overflow: "hidden",
  },
  cardFace: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    minHeight: 78,
    borderWidth: 1,
    borderRadius: 20,
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

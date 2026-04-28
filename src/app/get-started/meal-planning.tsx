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

const OPTIONS: {
  id: "never" | "rarely" | "occasionally" | "frequently" | "always";
  bars: number;
  accent: string;
  depth: string;
  tint: string;
}[] = [
  {
    id: "never",
    bars: 1,
    accent: "#64748B",
    depth: "#475569",
    tint: "#F1F5F9",
  },
  {
    id: "rarely",
    bars: 2,
    accent: "#38BDF8",
    depth: "#0284C7",
    tint: "#E8F7FF",
  },
  {
    id: "occasionally",
    bars: 3,
    accent: "#F97316",
    depth: "#C2410C",
    tint: "#FFF1E6",
  },
  {
    id: "frequently",
    bars: 4,
    accent: "#8B5CF6",
    depth: "#6D28D9",
    tint: "#F3EEFF",
  },
  {
    id: "always",
    bars: 5,
    accent: "#22C17A",
    depth: "#168E5A",
    tint: "#EAF8F1",
  },
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
      <View style={[s.cardBase, { backgroundColor: option.depth }]}>
        <Animated.View
          style={[
            s.cardFace,
            {
              backgroundColor: selected ? option.accent : "#FFFFFF",
              borderColor: selected ? option.accent : "#E8EDF0",
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
                    ? "rgba(255,255,255,0.28)"
                    : option.tint,
                },
              ]}
            >
              <View
                style={[
                  s.progressFill,
                  {
                    width: `${option.bars * 20}%`,
                    backgroundColor: selected ? "#FFFFFF" : option.accent,
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
                            : option.accent
                          : selected
                            ? "rgba(255,255,255,0.35)"
                            : "#DDE3EA",
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
          <Text style={s.subtitle}>
            {t("onboarding.mealPlanning.subtitle")}
          </Text>
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

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

const BORDER = "#DDE3EA";
const SURFACE = "#F6F8FA";

type GoalOption = {
  id: string;
  label: string;
  sub: string;
  kgPerWeek: number;
  pace: "slow" | "steady" | "fast";
};

const LOSS_OPTIONS: GoalOption[] = [
  {
    id: "lose_0_25",
    label: "0.25 kg / week",
    sub: "Easy and sustainable",
    kgPerWeek: -0.25,
    pace: "slow",
  },
  {
    id: "lose_0_5",
    label: "0.5 kg / week",
    sub: "Recommended balance",
    kgPerWeek: -0.5,
    pace: "steady",
  },
  {
    id: "lose_0_75",
    label: "0.75 kg / week",
    sub: "Ambitious pace",
    kgPerWeek: -0.75,
    pace: "fast",
  },
  {
    id: "lose_1_0",
    label: "1 kg / week",
    sub: "Aggressive cut",
    kgPerWeek: -1.0,
    pace: "fast",
  },
];

const GAIN_OPTIONS: GoalOption[] = [
  {
    id: "gain_0_2",
    label: "0.2 kg / week",
    sub: "Lean, slow bulk",
    kgPerWeek: 0.2,
    pace: "slow",
  },
  {
    id: "gain_0_35",
    label: "0.35 kg / week",
    sub: "Recommended",
    kgPerWeek: 0.35,
    pace: "steady",
  },
  {
    id: "gain_0_5",
    label: "0.5 kg / week",
    sub: "Aggressive bulk",
    kgPerWeek: 0.5,
    pace: "fast",
  },
];

const MAINTAIN_OPTIONS: GoalOption[] = [
  {
    id: "maintain",
    label: "Maintain weight",
    sub: "Keep your current weight",
    kgPerWeek: 0,
    pace: "steady",
  },
];

const PACE_COLORS = {
  slow: "#22C55E",
  steady: "#3B82F6",
  fast: "#F59E0B",
};

const PACE_LABELS = {
  slow: "Gentle",
  steady: "Balanced",
  fast: "Aggressive",
};

export default function WeeklyGoalScreen() {
  const router = useRouter();
  const [goal, setGoal] = useState<string>("");
  const [selected, setSelected] = useState<string>("");
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(28)).current;

  useEffect(() => {
    AsyncStorage.getItem("@hylift_goal").then((v) =>
      setGoal(v || "lose_weight"),
    );
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

  const options = useMemo<GoalOption[]>(() => {
    if (goal === "gain_weight" || goal === "build_muscle") return GAIN_OPTIONS;
    if (goal === "maintain") return MAINTAIN_OPTIONS;
    return LOSS_OPTIONS;
  }, [goal]);

  const headline = useMemo(() => {
    if (goal === "gain_weight" || goal === "build_muscle")
      return "What's your weekly gain goal?";
    if (goal === "maintain") return "Confirm your weekly goal";
    return "What's your weekly loss goal?";
  }, [goal]);

  const handleSelect = (id: string) => {
    setSelected(id);
  };

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
    router.push("/get-started/ready");
  };

  return (
    <View style={s.container}>
      <Animated.View
        style={{ flex: 1, opacity: fade, transform: [{ translateY: slide }] }}
      >
        <SignupProgress current={9} total={13} />

        <View style={s.header}>
          <Text style={s.title}>{headline}</Text>
          <Text style={s.subtitle}>
            Small steady wins compound — you can always adjust later.
          </Text>
        </View>

        <View style={s.list}>
          {options.map((o) => {
            const isSelected = selected === o.id;
            const paceColor = PACE_COLORS[o.pace];
            return (
              <View key={o.id}>
                <TouchableOpacity
                  activeOpacity={0.72}
                  onPress={() => handleSelect(o.id)}
                  style={[
                    s.card,
                    {
                      borderColor: isSelected ? paceColor : BORDER,
                      backgroundColor: isSelected ? paceColor + "10" : SURFACE,
                    },
                  ]}
                >
                  <View
                    style={[
                      s.iconWrap,
                      {
                        backgroundColor: isSelected
                          ? paceColor + "18"
                          : "#FFFFFF",
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
                      size={26}
                      color={isSelected ? paceColor : "#64748B"}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <View style={s.labelRow}>
                      <Text
                        style={[
                          s.cardTitle,
                          { color: isSelected ? paceColor : "#111827" },
                        ]}
                      >
                        {o.label}
                      </Text>
                      <View
                        style={[
                          s.paceTag,
                          {
                            backgroundColor: paceColor + "20",
                            borderColor: paceColor + "55",
                          },
                        ]}
                      >
                        <Text style={[s.paceTagText, { color: paceColor }]}>
                          {PACE_LABELS[o.pace]}
                        </Text>
                      </View>
                    </View>
                    <Text style={s.cardDesc}>{o.sub}</Text>
                  </View>

                  <View
                    style={[
                      s.check,
                      {
                        backgroundColor: isSelected ? paceColor : "transparent",
                        borderColor: isSelected ? paceColor : "#64748B",
                      },
                    ]}
                  >
                    {isSelected && (
                      <Ionicons name="checkmark" size={14} color="#fff" />
                    )}
                  </View>
                </TouchableOpacity>
              </View>
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

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
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
    gap: 12,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 10,
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
  paceTag: {
    borderWidth: 1,
    borderRadius: 100,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  paceTagText: {
    fontSize: 10,
    fontFamily: FONTS.bold,
    letterSpacing: 0.5,
  },
  cardDesc: {
    fontSize: 13,
    lineHeight: 18,
    color: "#64748B",
  },
  check: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
});

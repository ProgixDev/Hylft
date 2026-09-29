import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "../../components/ui/ScaledText";
import ChipButton from "../../components/ui/ChipButton";
import { SignupProgress } from "../../components/ui/SignupProgress";
import { FONTS } from "../../constants/fonts";
import { useTheme } from "../../contexts/ThemeContext";

const BORDER = "#E5E7EB";
const SURFACE = "#FFFFFF";

type GoalOption = {
  id: string;
  labelFr: string;
  labelEn: string;
  subFr: string;
  subEn: string;
  kgPerWeek: number;
  pace: "slow" | "steady" | "fast";
};

const LOSS_OPTIONS: GoalOption[] = [
  {
    id: "lose_0_25",
    labelFr: "0,25 kg / semaine",
    labelEn: "0.25 kg / week",
    subFr: "Facile et durable",
    subEn: "Easy and sustainable",
    kgPerWeek: -0.25,
    pace: "slow",
  },
  {
    id: "lose_0_5",
    labelFr: "0,50 kg / semaine",
    labelEn: "0.50 kg / week",
    subFr: "Équilibre recommandé",
    subEn: "Recommended balance",
    kgPerWeek: -0.5,
    pace: "steady",
  },
  {
    id: "lose_0_75",
    labelFr: "0,75 kg / semaine",
    labelEn: "0.75 kg / week",
    subFr: "Rythme ambitieux",
    subEn: "Ambitious pace",
    kgPerWeek: -0.75,
    pace: "fast",
  },
  {
    id: "lose_1_0",
    labelFr: "1,00 kg / semaine",
    labelEn: "1.00 kg / week",
    subFr: "Perte agressive",
    subEn: "Aggressive cut",
    kgPerWeek: -1.0,
    pace: "fast",
  },
];

const GAIN_OPTIONS: GoalOption[] = [
  {
    id: "gain_0_2",
    labelFr: "0,20 kg / semaine",
    labelEn: "0.20 kg / week",
    subFr: "Prise de masse propre",
    subEn: "Lean, slow bulk",
    kgPerWeek: 0.2,
    pace: "slow",
  },
  {
    id: "gain_0_35",
    labelFr: "0,35 kg / semaine",
    labelEn: "0.35 kg / week",
    subFr: "Recommandé",
    subEn: "Recommended",
    kgPerWeek: 0.35,
    pace: "steady",
  },
  {
    id: "gain_0_5",
    labelFr: "0,50 kg / semaine",
    labelEn: "0.50 kg / week",
    subFr: "Prise de masse rapide",
    subEn: "Aggressive bulk",
    kgPerWeek: 0.5,
    pace: "fast",
  },
];

const MAINTAIN_OPTIONS: GoalOption[] = [
  {
    id: "maintain",
    labelFr: "Maintenir son poids",
    labelEn: "Maintain weight",
    subFr: "Garder votre poids actuel",
    subEn: "Keep your current weight",
    kgPerWeek: 0,
    pace: "steady",
  },
];

const PACE_LABELS_FR = {
  slow: "Doux",
  steady: "Équilibré",
  fast: "Agressif",
};

const PACE_LABELS_EN = {
  slow: "Gentle",
  steady: "Balanced",
  fast: "Aggressive",
};

export default function WeeklyGoalScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ flow?: string; mode?: string }>();
  const isUpdate = params.mode === "update";
  const { theme } = useTheme();
  const { i18n } = useTranslation();
  const isFr = i18n.language?.startsWith("fr");

  const [goal, setGoal] = useState<string>("");
  const [selected, setSelected] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(28)).current;

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem("@hylift_goal"),
      AsyncStorage.getItem("@hylift_weekly_goal"),
      AsyncStorage.getItem("@hylift_weekly_goal_kg"),
    ]).then(([g, wg, wgKg]) => {
      const userGoal = g || "lose_weight";
      setGoal(userGoal);
      if (wg) {
        setSelected(wg);
      } else if (wgKg) {
        const kg = parseFloat(wgKg);
        const match =
          userGoal === "gain_weight" || userGoal === "build_muscle"
            ? GAIN_OPTIONS.find((o) => Math.abs(o.kgPerWeek - kg) < 0.05)
            : userGoal === "maintain"
              ? MAINTAIN_OPTIONS[0]
              : LOSS_OPTIONS.find((o) => Math.abs(o.kgPerWeek - kg) < 0.05);
        if (match) setSelected(match.id);
      } else {
        if (userGoal === "gain_weight" || userGoal === "build_muscle") {
          setSelected("gain_0_35");
        } else if (userGoal === "maintain") {
          setSelected("maintain");
        } else {
          setSelected("lose_0_5");
        }
      }
    });

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

  const options = useMemo<GoalOption[]>(() => {
    if (goal === "gain_weight" || goal === "build_muscle") return GAIN_OPTIONS;
    if (goal === "maintain") return MAINTAIN_OPTIONS;
    return LOSS_OPTIONS;
  }, [goal]);

  const headline = useMemo(() => {
    if (goal === "gain_weight" || goal === "build_muscle")
      return isFr
        ? "Quel est votre objectif de gain hebdo ?"
        : "What's your weekly gain goal?";
    if (goal === "maintain")
      return isFr
        ? "Quel est votre objectif hebdomadaire ?"
        : "What's your weekly goal?";
    return isFr
      ? "Quel est votre objectif de perte hebdo ?"
      : "What's your weekly loss goal?";
  }, [goal, isFr]);

  const handleSelect = (id: string) => {
    setSelected(id);
  };

  const handleContinue = async () => {
    if (!selected || isSaving) return;
    setIsSaving(true);
    try {
      const picked = options.find((o) => o.id === selected);
      if (picked) {
        await AsyncStorage.setItem("@hylift_weekly_goal", picked.id);
        await AsyncStorage.setItem(
          "@hylift_weekly_goal_kg",
          picked.kgPerWeek.toString()
        );
      }
      if (isUpdate) {
        router.back();
      } else {
        router.push("/get-started/ready");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => router.back();

  return (
    <View style={s.container}>
      <Animated.View
        style={{ flex: 1, opacity: fade, transform: [{ translateY: slide }] }}
      >
        {!isUpdate && <SignupProgress current={9} total={13} />}

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[
            { paddingBottom: 16 },
            isUpdate && { paddingTop: 24 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={s.header}>
            <Text style={s.title}>{headline}</Text>
          </View>

          <View style={s.list}>
            {options.map((o) => {
              const isSelected = selected === o.id;
              const primary = theme.primary.main;
              const paceMap = isFr ? PACE_LABELS_FR : PACE_LABELS_EN;
              return (
                <View key={o.id}>
                  <TouchableOpacity
                    activeOpacity={0.72}
                    onPress={() => handleSelect(o.id)}
                    style={[
                      s.card,
                      {
                        borderColor: isSelected ? primary : BORDER,
                        backgroundColor: isSelected ? primary + "10" : SURFACE,
                      },
                    ]}
                  >
                    <View
                      style={[
                        s.iconWrap,
                        {
                          backgroundColor: isSelected
                            ? primary + "18"
                            : "#F1F5F9",
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
                        size={24}
                        color={isSelected ? primary : "#64748B"}
                      />
                    </View>

                    <View style={{ flex: 1 }}>
                      <View style={s.labelRow}>
                        <Text
                          style={[
                            s.cardTitle,
                            { color: isSelected ? primary : "#102b4a" },
                          ]}
                        >
                          {isFr ? o.labelFr : o.labelEn}
                        </Text>
                        <View
                          style={[
                            s.paceTag,
                            {
                              backgroundColor: primary + "15",
                              borderColor: primary + "40",
                            },
                          ]}
                        >
                          <Text style={[s.paceTagText, { color: primary }]}>
                            {paceMap[o.pace]}
                          </Text>
                        </View>
                      </View>
                      <Text style={s.cardDesc} numberOfLines={1}>
                        {isFr ? o.subFr : o.subEn}
                      </Text>
                    </View>

                    <View
                      style={[
                        s.check,
                        {
                          backgroundColor: isSelected ? primary : "transparent",
                          borderColor: isSelected ? primary : "#CBD5E1",
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
        </ScrollView>
      </Animated.View>

      <View style={{ paddingTop: 12, paddingBottom: Math.max(16, insets.bottom) }}>
        <View style={s.actionRow}>
          <View style={s.actionButton}>
            <ChipButton
              title={isUpdate ? (isFr ? "Annuler" : "Cancel") : isFr ? "Retour" : "Back"}
              onPress={handleBack}
              variant="secondary"
              size="lg"
              fullWidth
            />
          </View>
          <View style={s.actionButton}>
            <ChipButton
              threeD
              title={
                isUpdate
                  ? isFr
                    ? "Mettre à jour"
                    : "Update"
                  : isFr
                    ? "Continuer"
                    : "Continue"
              }
              onPress={handleContinue}
              variant="primary"
              size="lg"
              fullWidth
              disabled={!selected}
              loading={isSaving}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FC",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },

  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontFamily: FONTS.extraBold,
    color: "#102b4a",
    lineHeight: 32,
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  list: {
    gap: 8,
  },
  card: {
    height: 72,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: FONTS.bold,
  },
  paceTag: {
    borderWidth: 1,
    borderRadius: 100,
    paddingHorizontal: 7,
    paddingVertical: 1,
  },
  paceTagText: {
    fontSize: 10,
    fontFamily: FONTS.bold,
    letterSpacing: 0.5,
  },
  cardDesc: {
    fontSize: 12,
    lineHeight: 16,
    color: "#64748B",
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
});

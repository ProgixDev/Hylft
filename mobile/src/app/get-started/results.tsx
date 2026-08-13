import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Image,
    ScrollView,
    StyleProp,
    StyleSheet,
    View,
    ViewStyle,
} from "react-native";
import { Text } from "../../components/ui/ScaledText";
import ChipButton from "../../components/ui/ChipButton";
import { FONTS } from "../../constants/fonts";
import { useTheme } from "../../contexts/ThemeContext";
import en from "../../locales/en.json";
import fr from "../../locales/fr.json";

function ResultCard({
  children,
  style,
  shellStyle,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  shellStyle?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[s.cardShell, shellStyle]}>
      <View style={[s.cardFace, style]}>{children}</View>
    </View>
  );
}

function IconCircle({ name }: { name: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={[s.iconCircle, { backgroundColor: "#E8EAF0" }]}>
      <Ionicons name={name} size={22} color="#102b4a" />
    </View>
  );
}

export default function ResultsScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();

  if (!i18n.exists("onboarding.results.congratsTitle")) {
    i18n.addResourceBundle("en", "translation", en, true, true);
    i18n.addResourceBundle("fr", "translation", fr, true, true);
  }

  const [bmi, setBmi] = useState(0);
  const [fitnessLevel, setFitnessLevel] = useState("intermediate");
  const [activityLevel, setActivityLevel] = useState("moderate");
  const [targetAreas, setTargetAreas] = useState<string[]>(["full_body"]);

  const [calories, setCalories] = useState(2500);
  const [protein, setProtein] = useState(120);
  const [carbs, setCarbs] = useState(300);
  const [fat, setFat] = useState(90);
  const [cups, setCups] = useState(10);

  const [weeklyGoal, setWeeklyGoal] = useState(4);

  useEffect(() => {
    async function loadData() {
      try {
        const [
          heightStr,
          weightStr,
          ageStr,
          genderStr,
          expLvl,
          actLvl,
          focuses,
          workoutFrequency,
          weightGoal,
        ] = await Promise.all([
          AsyncStorage.getItem("@hylift_height"),
          AsyncStorage.getItem("@hylift_weight"),
          AsyncStorage.getItem("@hylift_age"),
          AsyncStorage.getItem("@hylift_gender"),
          AsyncStorage.getItem("@hylift_experience_level"),
          AsyncStorage.getItem("@hylift_activity_level"),
          AsyncStorage.getItem("@hylift_focus_areas"),
          AsyncStorage.getItem("@hylift_workout_frequency"),
          AsyncStorage.getItem("@hylift_goal"),
        ]);

        let h = 175;
        let w = 75;
        let age = 25;
        let gender = "male";

        if (heightStr) h = parseFloat(heightStr);
        if (weightStr) w = parseFloat(weightStr);
        if (ageStr) age = parseInt(ageStr, 10);
        if (genderStr) gender = genderStr.toLowerCase();

        let cm = h < 1 ? 175 : h;
        let meter = cm / 100;
        let currentBmi = w / (meter * meter);
        setBmi(currentBmi);

        if (expLvl) setFitnessLevel(expLvl);
        if (actLvl) {
          setActivityLevel(actLvl);
        } else if (workoutFrequency) {
          const frequency = parseInt(workoutFrequency, 10);
          if (!isNaN(frequency)) {
            setActivityLevel(
              frequency >= 5
                ? "very_active"
                : frequency >= 3
                  ? "moderate"
                  : "light",
            );
          }
        }

        if (focuses) {
          try {
            let parsed = JSON.parse(focuses);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setTargetAreas(parsed.map((x: any) => String(x)));
            }
          } catch {}
        }

        if (workoutFrequency) {
          let n = parseInt(workoutFrequency.replace(/[^0-9]/g, ""));
          if (!isNaN(n)) setWeeklyGoal(n);
        }

        let bmr =
          10 * w + 6.25 * cm - 5 * age + (gender === "female" ? -161 : 5);

        let activityMultiplier = 1.375;
        if (actLvl) {
          const l = actLvl.toLowerCase();
          if (l.includes("sedentary")) activityMultiplier = 1.2;
          else if (l.includes("moderate")) activityMultiplier = 1.55;
          else if (l.includes("active") || l.includes("very"))
            activityMultiplier = 1.725;
          else if (l.includes("extreme")) activityMultiplier = 1.9;
        }

        let tdee = bmr * activityMultiplier;

        let targetCalories = tdee;
        if (weightGoal === "lose_weight") {
          targetCalories -= 500;
        } else if (
          weightGoal === "build_muscle" ||
          weightGoal === "gain_weight"
        ) {
          targetCalories += 300;
        }

        targetCalories = Math.round(targetCalories);

        let proteinCalories = targetCalories * 0.3;
        let fatCalories = targetCalories * 0.25;
        let carbsCalories = targetCalories * 0.45;

        setCalories(targetCalories);
        setProtein(Math.round(proteinCalories / 4));
        setFat(Math.round(fatCalories / 9));
        setCarbs(Math.round(carbsCalories / 4));

        let dailyWaterMl = w * 35;
        setCups(parseFloat((dailyWaterMl / 240).toFixed(1)));
      } catch (err) {
        console.error(err);
      }
    }
    loadData();
  }, []);

  const getBmiStatus = (bmiVal: number) => {
    if (bmiVal < 18.5)
      return { key: "underweight", color: "#3B82F6", left: "15%" };
    if (bmiVal >= 18.5 && bmiVal <= 24.9)
      return { key: "healthy", color: "#84CC16", left: "45%" };
    if (bmiVal >= 25 && bmiVal <= 29.9)
      return { key: "overweight", color: "#EAB308", left: "70%" };
    return { key: "obese", color: "#EF4444", left: "90%" };
  };

  const bmiStatus = getBmiStatus(bmi);
  const fitnessLevelLabel = t(
    `onboarding.experienceLevel.levels.${fitnessLevel}.label`,
    { defaultValue: fitnessLevel },
  );
  const activityLevelLabel = t(
    `onboarding.activityLevel.options.${activityLevel}.label`,
    { defaultValue: activityLevel },
  );
  const targetAreasLabel = targetAreas
    .map((area) =>
      t(`onboarding.focusAreas.muscles.${area}`, { defaultValue: area }),
    )
    .join(", ");

  return (
    <View style={s.root}>
      <StatusBar style="dark" backgroundColor="transparent" />
      <ScrollView
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={s.header}>
          <Image source={theme.logo} style={s.logo} resizeMode="contain" />
          <Text style={s.congratsTitle}>
            {t("onboarding.results.congratsTitle")}
          </Text>
          <Text style={s.congratsSub}>
            {t("onboarding.results.congratsSubtitle")}
          </Text>
        </View>

        {/* BMI Card */}
        <ResultCard>
          <Text style={s.cardLabel}>
            {t("onboarding.results.bmiIndex")}
          </Text>
          <View style={s.bmiRow}>
            <Text style={s.bmiValue}>
              {bmi > 0 ? bmi.toFixed(2) : "--.--"}
            </Text>
            <View
              style={[s.badge, { backgroundColor: `${bmiStatus.color}20` }]}
            >
              <Text style={[s.badgeText, { color: bmiStatus.color }]}>
                {t(`onboarding.results.bmiStatus.${bmiStatus.key}`)}
              </Text>
            </View>
          </View>

          <View style={s.sliderContainer}>
            <LinearGradient
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              colors={["#3B82F6", "#84CC16", "#EAB308", "#EF4444"]}
              style={s.sliderTrack}
            >
              {Array.from({ length: 40 }).map((_, i) => (
                <View key={i} style={s.tick} />
              ))}
            </LinearGradient>

            {bmi > 0 && (
              <View style={[s.sliderThumb, { left: bmiStatus.left as any }]} />
            )}
          </View>

          <View style={s.sliderLabels}>
            <Text style={s.sliderLabel}>
              {t("onboarding.results.bmiStatus.underweight")}
            </Text>
            <Text style={s.sliderLabel}>
              {t("onboarding.results.bmiStatus.normal")}
            </Text>
            <Text style={s.sliderLabel}>
              {t("onboarding.results.bmiStatus.overweight")}
            </Text>
            <Text style={s.sliderLabel}>
              {t("onboarding.results.bmiStatus.obese")}
            </Text>
          </View>
        </ResultCard>

        {/* Stats Card */}
        <ResultCard>
          <View style={s.statRow}>
            <IconCircle name="triangle-outline" />
            <View style={s.statText}>
              <Text style={s.cardLabel}>
                {t("onboarding.results.fitnessLevel")}
              </Text>
              <Text style={s.statValue}>{fitnessLevelLabel}</Text>
            </View>
          </View>

          <View style={s.divider} />

          <View style={s.statRow}>
            <IconCircle name="bar-chart-outline" />
            <View style={s.statText}>
              <Text style={s.cardLabel}>
                {t("onboarding.results.activityLevel")}
              </Text>
              <Text style={s.statValue}>{activityLevelLabel}</Text>
            </View>
          </View>

          <View style={s.divider} />

          <View style={s.statRow}>
            <IconCircle name="locate-outline" />
            <View style={s.statText}>
              <Text style={s.cardLabel}>
                {t("onboarding.results.targetAreas")}
              </Text>
              <Text style={s.statValue}>{targetAreasLabel}</Text>
            </View>
          </View>
        </ResultCard>

        {/* Nutrition Plan */}
        <Text style={s.sectionTitle}>
          {t("onboarding.results.nutritionPlan")}
        </Text>

        {/* Calorie Card — dark */}
        <View style={s.calorieCard}>
          <View style={s.calorieHeader}>
            <View style={s.calorieIcon}>
              <Ionicons name="flame" size={20} color="#FFF" />
            </View>
            <Text style={s.calorieLabel}>
              {t("onboarding.results.calorieGoal")}
            </Text>
          </View>
          <View style={s.calorieValueRow}>
            <Text style={s.calorieValue}>{calories}</Text>
            <Text style={s.calorieUnit}>
              kcal / {t("onboarding.results.perDay").replace("par ", "")}
            </Text>
          </View>
        </View>

        {/* Macros Card */}
        <ResultCard style={s.macrosRow}>
          <View style={s.macroItem}>
            <Text style={s.cardLabel}>
              {t("onboarding.results.protein")}
            </Text>
            <Text style={s.macroValue}>{protein}g</Text>
            <Text style={s.macroPerDay}>
              {t("onboarding.results.perDay")}
            </Text>
          </View>
          <View style={s.macroDivider} />
          <View style={s.macroItem}>
            <Text style={s.cardLabel}>
              {t("onboarding.results.carbs")}
            </Text>
            <Text style={s.macroValue}>{carbs}g</Text>
            <Text style={s.macroPerDay}>
              {t("onboarding.results.perDay")}
            </Text>
          </View>
          <View style={s.macroDivider} />
          <View style={s.macroItem}>
            <Text style={s.cardLabel}>
              {t("onboarding.results.fat")}
            </Text>
            <Text style={s.macroValue}>{fat}g</Text>
            <Text style={s.macroPerDay}>
              {t("onboarding.results.perDay")}
            </Text>
          </View>
        </ResultCard>

        {/* Water + Weekly Goal — side by side, equal height */}
        <View style={s.bottomRow}>
          <ResultCard shellStyle={s.bottomCardShell} style={s.bottomCard}>
            <View style={[s.iconCircle, { backgroundColor: "#E8EAF0", alignSelf: "flex-start" }]}>
              <Ionicons name="water-outline" size={20} color="#102b4a" />
            </View>
            <Text style={[s.cardLabel, { marginTop: 8 }]}>
              {t("onboarding.results.waterGoal")}
            </Text>
            <View style={s.bottomValueRow}>
              <Text style={s.bottomValue}>{cups}</Text>
              <Text style={s.bottomUnit}>
                {t("onboarding.results.cups")}
              </Text>
            </View>
          </ResultCard>

          <ResultCard shellStyle={s.bottomCardShell} style={s.bottomCard}>
            <View style={[s.iconCircle, { backgroundColor: "#E8EAF0", alignSelf: "flex-start" }]}>
              <Ionicons name="construct-outline" size={20} color="#102b4a" />
            </View>
            <Text style={[s.cardLabel, { marginTop: 8 }]}>
              {t("onboarding.results.weeklyGoalLabel")}
            </Text>
            <View style={s.bottomValueRow}>
              <Text style={s.bottomValue}>{weeklyGoal}</Text>
              <Text style={s.bottomUnit}>
                {t("onboarding.results.workoutsUnit")}
              </Text>
            </View>
          </ResultCard>
        </View>

        <View style={s.buttonWrap}>
          <ChipButton
            threeD
            title={t("onboarding.results.getMyPlan")}
            onPress={() => router.push("/get-started/account")}
            variant="primary"
            size="lg"
            fullWidth
          />
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F8F9FC",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 20,
    alignItems: "center",
  },
  logo: {
    width: 112,
    height: 52,
    marginBottom: 14,
  },
  congratsTitle: {
    color: "#102b4a",
    fontSize: 28,
    fontFamily: FONTS.extraBold,
    marginBottom: 4,
  },
  congratsSub: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: "#6B7280",
  },
  cardShell: {
    borderRadius: 18,
    marginBottom: 14,
  },
  cardFace: {
    borderRadius: 18,
    padding: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cardLabel: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  bmiRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    marginBottom: 18,
  },
  bmiValue: {
    fontSize: 34,
    fontFamily: FONTS.extraBold,
    color: "#102b4a",
    marginRight: 12,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
  },
  badgeText: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  sliderContainer: {
    height: 30,
    justifyContent: "center",
    marginBottom: 8,
    position: "relative",
  },
  sliderTrack: {
    height: 18,
    borderRadius: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 2,
    alignItems: "center",
    overflow: "hidden",
  },
  tick: {
    width: 2,
    height: "60%",
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  sliderThumb: {
    position: "absolute",
    width: 6,
    height: 26,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sliderLabel: {
    fontSize: 11,
    fontFamily: FONTS.medium,
    color: "#6B7280",
  },
  // Stats card
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 4,
  },
  statText: {
    flex: 1,
  },
  statValue: {
    fontSize: 17,
    fontFamily: FONTS.bold,
    color: "#102b4a",
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginVertical: 12,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  // Section
  sectionTitle: {
    fontSize: 20,
    fontFamily: FONTS.extraBold,
    color: "#102b4a",
    marginTop: 8,
    marginBottom: 14,
  },
  // Calorie card — dark
  calorieCard: {
    backgroundColor: "#102b4a",
    borderRadius: 18,
    padding: 20,
    marginBottom: 14,
  },
  calorieHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 6,
  },
  calorieIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  calorieLabel: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  calorieValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    marginTop: 4,
  },
  calorieValue: {
    fontSize: 40,
    fontFamily: FONTS.extraBold,
    color: "#FFFFFF",
  },
  calorieUnit: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: "rgba(255,255,255,0.6)",
  },
  // Macros
  macrosRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-start",
  },
  macroItem: {
    alignItems: "center",
    flex: 1,
  },
  macroValue: {
    fontSize: 24,
    fontFamily: FONTS.extraBold,
    color: "#102b4a",
    marginTop: 6,
  },
  macroPerDay: {
    fontSize: 11,
    fontFamily: FONTS.medium,
    color: "#9CA3AF",
    marginTop: 2,
  },
  macroDivider: {
    width: 1,
    height: 60,
    backgroundColor: "#F0F0F0",
    alignSelf: "center",
  },
  // Bottom row
  bottomRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "stretch",
  },
  bottomCardShell: {
    flex: 1,
    marginBottom: 14,
  },
  bottomCard: {
    flex: 1,
    alignItems: "flex-start",
  },
  buttonWrap: {
    marginTop: 4,
    marginBottom: 8,
  },
  bottomValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
    marginTop: 4,
  },
  bottomValue: {
    fontSize: 28,
    fontFamily: FONTS.extraBold,
    color: "#102b4a",
  },
  bottomUnit: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    color: "#6B7280",
  },
});

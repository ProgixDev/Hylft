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
import { Theme } from "../../constants/themes";
import { useTheme } from "../../contexts/ThemeContext";
import en from "../../locales/en.json";
import fr from "../../locales/fr.json";

function ResultCard({
  children,
  style,
  theme,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  theme: Theme;
}) {
  return (
    <View style={s.cardShell}>
      <View
        style={[
          s.cardFace,
          {
            backgroundColor: theme.background.darker,
            borderColor: theme.background.accent,
          },
          style,
        ]}
      >
        {children}
      </View>
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

        // BMI Calculation
        let cm = h < 1 ? 175 : h;
        let meter = cm / 100;
        let currentBmi = w / (meter * meter);
        setBmi(currentBmi);

        // Display states mapping
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

        // BMR Calculation (Mifflin-St Jeor)
        let bmr =
          10 * w + 6.25 * cm - 5 * age + (gender === "female" ? -161 : 5);

        // Activity Multiplier
        let activityMultiplier = 1.375; // Default light
        if (actLvl) {
          const l = actLvl.toLowerCase();
          if (l.includes("sedentary")) activityMultiplier = 1.2;
          else if (l.includes("moderate")) activityMultiplier = 1.55;
          else if (l.includes("active") || l.includes("very"))
            activityMultiplier = 1.725;
          else if (l.includes("extreme")) activityMultiplier = 1.9;
        }

        // TDEE (Total Daily Energy Expenditure)
        let tdee = bmr * activityMultiplier;

        // Adjust calories based on goal
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

        // Macros ratio: roughly 30% Protein, 25% Fat, 45% Carbs
        // Protein: ~2g per kg is also a good standard. We'll use calories percentages:
        let proteinCalories = targetCalories * 0.3;
        let fatCalories = targetCalories * 0.25;
        let carbsCalories = targetCalories * 0.45;

        let dailyProtein = Math.round(proteinCalories / 4);
        let dailyFat = Math.round(fatCalories / 9);
        let dailyCarbs = Math.round(carbsCalories / 4);

        setCalories(targetCalories);
        setProtein(dailyProtein);
        setFat(dailyFat);
        setCarbs(dailyCarbs);

        // Hydration: ~35ml per kg of bodyweight
        let dailyWaterMl = w * 35;
        // 1 cup = 240 ml
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
    <View style={[s.root, { backgroundColor: theme.background.dark }]}>
      <StatusBar style="light" backgroundColor="transparent" translucent />
      <ScrollView
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.header}>
          <Image
            source={theme.logo}
            style={s.logo}
            resizeMode="contain"
          />
          <Text style={s.congratsTitle}>
            {t("onboarding.results.congratsTitle")}
          </Text>
          <Text style={[s.congratsSub, { color: theme.foreground.gray }]}>
            {t("onboarding.results.congratsSubtitle")}
          </Text>
        </View>

        {/* BMI CARD */}
        <ResultCard theme={theme}>
          <Text style={[s.cardTitle, { color: theme.foreground.white }]}>
            {t("onboarding.results.bmiIndex")}
          </Text>
          <View style={s.bmiRow}>
            <Text style={[s.bmiValue, { color: theme.foreground.white }]}>
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
            <Text style={[s.sliderLabel, { color: theme.foreground.gray }]}>
              {t("onboarding.results.bmiStatus.underweight")}
            </Text>
            <Text style={[s.sliderLabel, { color: theme.foreground.gray }]}>
              {t("onboarding.results.bmiStatus.normal")}
            </Text>
            <Text style={[s.sliderLabel, { color: theme.foreground.gray }]}>
              {t("onboarding.results.bmiStatus.overweight")}
            </Text>
            <Text style={[s.sliderLabel, { color: theme.foreground.gray }]}>
              {t("onboarding.results.bmiStatus.obese")}
            </Text>
          </View>
        </ResultCard>

        {/* FITNESS LEVEL CARD */}
        <ResultCard theme={theme}>
          <View style={s.statRow}>
            <Ionicons
              name="triangle-outline"
              size={28}
              color="#259CFF"
              style={s.icon}
            />
            <View>
              <Text style={[s.statLabel, { color: theme.foreground.gray }]}>
                {t("onboarding.results.fitnessLevel")}
              </Text>
              <Text style={[s.statValue, { color: theme.foreground.white }]}>
                {fitnessLevelLabel}
              </Text>
            </View>
          </View>

          <View style={s.statRow}>
            <Ionicons
              name="stats-chart"
              size={26}
              color="#4F46E5"
              style={s.icon}
            />
            <View>
              <Text style={[s.statLabel, { color: theme.foreground.gray }]}>
                {t("onboarding.results.activityLevel")}
              </Text>
              <Text style={[s.statValue, { color: theme.foreground.white }]}>
                {activityLevelLabel}
              </Text>
            </View>
          </View>

          <View style={[s.statRow, { marginBottom: 0 }]}>
            <Ionicons
              name="locate-outline"
              size={28}
              color="#38BDF8"
              style={s.icon}
            />
            <View>
              <Text style={[s.statLabel, { color: theme.foreground.gray }]}>
                {t("onboarding.results.targetAreas")}
              </Text>
              <Text style={[s.statValue, { color: theme.foreground.white }]}>
                {targetAreasLabel}
              </Text>
            </View>
          </View>
        </ResultCard>

        {/* NUTRITION PLAN */}
        <Text style={[s.sectionTitle, { color: theme.foreground.white }]}>
          {t("onboarding.results.nutritionPlan")}
        </Text>

        <ResultCard theme={theme} style={{ alignItems: "center" }}>
          <Text style={s.emoji}>🔥</Text>
          <Text style={[s.statLabel, { color: theme.foreground.gray }]}>
            {t("onboarding.results.calorieGoal")}
          </Text>
          <Text style={[s.bigValue, { color: theme.foreground.white }]}>
            {calories} <Text style={s.unit}>kcal</Text>
          </Text>
          <Text style={[s.perDay, { color: theme.foreground.gray }]}>
            {t("onboarding.results.perDay")}
          </Text>
        </ResultCard>

        <ResultCard
          theme={theme}
          style={{ flexDirection: "row", justifyContent: "space-around" }}
        >
          <View style={s.macroItem}>
            <Text style={s.emoji}>🥚</Text>
            <Text style={[s.statLabel, { color: theme.foreground.gray }]}>
              {t("onboarding.results.protein")}
            </Text>
            <Text style={[s.macroValue, { color: theme.foreground.white }]}>
              {protein}g
            </Text>
            <Text style={[s.perDay, { color: theme.foreground.gray }]}>
              {t("onboarding.results.perDay")}
            </Text>
          </View>
          <View style={s.macroItem}>
            <Text style={s.emoji}>🍚</Text>
            <Text style={[s.statLabel, { color: theme.foreground.gray }]}>
              {t("onboarding.results.carbs")}
            </Text>
            <Text style={[s.macroValue, { color: theme.foreground.white }]}>
              {carbs}g
            </Text>
            <Text style={[s.perDay, { color: theme.foreground.gray }]}>
              {t("onboarding.results.perDay")}
            </Text>
          </View>
          <View style={s.macroItem}>
            <Text style={s.emoji}>🧈</Text>
            <Text style={[s.statLabel, { color: theme.foreground.gray }]}>
              {t("onboarding.results.fat")}
            </Text>
            <Text style={[s.macroValue, { color: theme.foreground.white }]}>
              {fat}g
            </Text>
            <Text style={[s.perDay, { color: theme.foreground.gray }]}>
              {t("onboarding.results.perDay")}
            </Text>
          </View>
        </ResultCard>

        <ResultCard theme={theme} style={{ alignItems: "center" }}>
          <Text style={s.emoji}>💧</Text>
          <Text style={[s.statLabel, { color: theme.foreground.gray }]}>
            {t("onboarding.results.waterGoal")}
          </Text>
          <Text style={[s.bigValue, { color: theme.foreground.white }]}>
            {cups} <Text style={s.unit}>{t("onboarding.results.cups")}</Text>
          </Text>
          <Text style={[s.perDay, { color: theme.foreground.gray }]}>
            {t("onboarding.results.perDay")}
          </Text>
        </ResultCard>
        <ResultCard theme={theme} style={{ alignItems: "center" }}>
          <Text style={s.emoji}>💪</Text>
          <Text style={[s.statLabel, { color: theme.foreground.gray }]}>
            {t("onboarding.results.workoutsCount", { count: weeklyGoal })}
          </Text>
          <Text style={[s.bigValue, { color: theme.foreground.white }]}>
            {t("onboarding.results.weeklyGoal")}
          </Text>
        </ResultCard>
      </ScrollView>

      <View style={[s.footer, { backgroundColor: theme.background.dark + "E6" }]}>
        <ChipButton
          threeD
          title={t("onboarding.results.getMyPlan")}
          onPress={() => router.push("/get-started/account")}
        />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 130,
  },
  header: {
    marginBottom: 24,
    alignItems: "center",
  },
  logo: {
    width: 112,
    height: 52,
    marginBottom: 14,
  },
  congratsTitle: {
    color: "#259CFF",
    fontSize: 28,
    fontFamily: FONTS.extraBold,
    marginBottom: 4,
  },
  congratsSub: {
    fontSize: 16,
    fontFamily: FONTS.medium,
  },
  cardShell: {
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: "#0F2445",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.11,
    shadowRadius: 18,
    elevation: 5,
  },
  cardFace: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
  },
  cardTitle: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    marginBottom: 12,
  },
  bmiRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  bmiValue: {
    fontSize: 34,
    fontFamily: FONTS.extraBold,
    marginRight: 12,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badgeText: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    textTransform: "uppercase",
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
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  icon: {
    width: 40,
  },
  statLabel: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    marginTop: 10,
    marginBottom: 16,
  },
  emoji: {
    fontSize: 32,
    marginBottom: 10,
  },
  bigValue: {
    fontSize: 34,
    fontFamily: FONTS.extraBold,
    marginTop: 4,
  },
  unit: {
    fontSize: 22,
    fontFamily: FONTS.bold,
  },
  perDay: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    marginTop: 6,
  },
  macroItem: {
    alignItems: "center",
  },
  macroValue: {
    fontSize: 24,
    fontFamily: FONTS.extraBold,
    marginTop: 4,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 34,
  },
});

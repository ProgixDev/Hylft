import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Dimensions,
    Image,
    ImageBackground,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { BarChart } from "react-native-gifted-charts";
import { FONTS } from "../../constants/fonts";
import { Theme } from "../../constants/themes";
import { useHealth } from "../../contexts/HealthContext";
import { useNutrition } from "../../contexts/NutritionContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useGenderedImages } from "../../hooks/useGenderedImages";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CHALLENGE_CARD_WIDTH = SCREEN_WIDTH * 0.78;

const DAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"];
const DAY_LABELS_SHORT = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

type DayStatus = "completed" | "missed" | "pending" | "off";


// Difficulty bolts component
function DifficultyBolts({ level, theme }: { level: number; theme: Theme }) {
  return (
    <View style={{ flexDirection: "row", gap: 2, marginTop: 4 }}>
      {[1, 2, 3].map((i) => (
        <Ionicons
          key={i}
          name="flash"
          size={14}
          color={i <= level ? theme.primary.main : "#D1D5DB"}
        />
      ))}
    </View>
  );
}

export default function Home() {
  const router = useRouter();
  const { theme, themeType, setTheme } = useTheme();
  const { t } = useTranslation();
  const { goals, todaySummary, weekSummaries } = useNutrition();
  const { todaySteps, todayCaloriesBurned, weeklyCaloriesBurned } = useHealth();
  const genderedImages = useGenderedImages();
  const [selectedBodyFocus, setSelectedBodyFocus] = useState(0);
  const [weeklyObjective, setWeeklyObjective] = useState(3);

  const now = new Date();
  const todayDayIndex = (now.getDay() + 6) % 7; // Convert Sun=0 to Mon=0 based

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      const loadObjective = async () => {
        try {
          const saved = await AsyncStorage.getItem("@hylift_home_weekly_objective");
          const parsed = Number(saved);
          if (
            isMounted &&
            Number.isFinite(parsed) &&
            parsed >= 1 &&
            parsed <= 7
          ) {
            setWeeklyObjective(parsed);
          }
        } catch {
          // Keep default objective when storage is unavailable.
        }
      };

      loadObjective();
      return () => {
        isMounted = false;
      };
    }, [])
  );

  const weekDays = useMemo(() => {
    const monday = new Date(now);
    monday.setHours(0, 0, 0, 0);
    monday.setDate(now.getDate() - todayDayIndex);

    return DAY_LABELS_SHORT.map((label, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      return {
        label,
        dayOfMonth: date.getDate(),
        isToday: index === todayDayIndex,
      };
    });
  }, [now, todayDayIndex]);

  const scheduledIndices = useMemo(() => {
    const target = Math.min(Math.max(weeklyObjective, 1), 7);
    const days = new Set<number>();

    for (let i = 0; i < target; i += 1) {
      days.add((todayDayIndex + i) % 7);
    }

    return days;
  }, [todayDayIndex, weeklyObjective]);

  const weekDayStatuses = useMemo<DayStatus[]>(() => {
    return DAY_LABELS_SHORT.map((_, index) => {
      if (!scheduledIndices.has(index)) return "off";
      if (index < todayDayIndex) return "missed";
      if (index === todayDayIndex) return "completed";
      return "pending";
    });
  }, [scheduledIndices, todayDayIndex]);

  const styles = createStyles(theme);

  // ── Derived calorie data from contexts ─────────────────────────────────
  const caloriesConsumed = todaySummary.totalCalories;
  const caloriesBurned = todayCaloriesBurned;
  const caloriesRemaining = goals.calorieGoal - caloriesConsumed + caloriesBurned;
  const consumedPercent = goals.calorieGoal > 0
    ? Math.round((caloriesConsumed / goals.calorieGoal) * 100)
    : 0;

  const donutData = [
    {
      value: Math.max(caloriesConsumed, 1),
      color: theme.primary.main,
      gradientCenterColor: theme.primary.light,
    },
    {
      value: Math.max(goals.calorieGoal - caloriesConsumed, 0),
      color: theme.background.accent,
    },
  ];

  const macros = useMemo(() => ({
    protein: { current: todaySummary.totalProtein, goal: goals.proteinGoal, color: "#4A90D9" },
    carbs: { current: todaySummary.totalCarbs, goal: goals.carbsGoal, color: "#F5A623" },
    fat: { current: todaySummary.totalFat, goal: goals.fatGoal, color: "#ED6665" },
  }), [todaySummary, goals]);

  // Build weekly burned data from Health context (fallback to 0 for missing days)
  const weeklyBurnedData = useMemo(() => {
    return DAY_LABELS.map((label, i) => {
      const dayData = weeklyCaloriesBurned[i];
      return {
        value: dayData?.totalCalories ?? 0,
        label,
      };
    });
  }, [weeklyCaloriesBurned]);

  const bodyFocusOptions = [
    t("home.abs"),
    t("home.arm"),
    t("home.back"),
    t("home.leg"),
    t("home.shoulder"),
  ];

  const challenges = [
    {
      days: 28,
      title: t("home.fullBodyChallenge"),
      desc: t("home.fullBodyChallengeDesc"),
      image: genderedImages.challenge[0],
      color: "#1565C0",
    },
    {
      days: 28,
      title: t("home.sculptUpperBody"),
      desc: t("home.sculptUpperBodyDesc"),
      image: genderedImages.challenge[1],
      color: "#2E7D9A",
    },
    {
      days: 21,
      title: t("home.lowerBodyBlast"),
      desc: t("home.lowerBodyBlastDesc"),
      image: genderedImages.challenge[2],
      color: "#6A1B9A",
    },
  ];

  const selectedLabel = bodyFocusOptions[selectedBodyFocus];

  const bodyFocusExercises = [
    {
      name: selectedLabel + " " + t("home.beginner"),
      duration: "15 mins",
      exercises: 16,
      difficulty: 1,
      image: genderedImages.bodyFocus[selectedBodyFocus % genderedImages.bodyFocus.length],
    },
    {
      name: selectedLabel + " " + t("home.intermediate"),
      duration: "24 mins",
      exercises: 21,
      difficulty: 2,
      image: genderedImages.bodyFocus[(selectedBodyFocus + 1) % genderedImages.bodyFocus.length],
    },
    {
      name: selectedLabel + " " + t("home.advanced"),
      duration: "27 mins",
      exercises: 21,
      difficulty: 3,
      image: genderedImages.bodyFocus[(selectedBodyFocus + 2) % genderedImages.bodyFocus.length],
    },
  ];

  const justForYouWorkouts = [
    {
      name: t("home.killerChestRoutine"),
      duration: "10 min",
      level: t("home.intermediate"),
      image: genderedImages.bodyFocus[0],
    },
    {
      name: t("home.sevenMinAbs"),
      duration: "7 min",
      level: t("home.beginner"),
      image: genderedImages.bodyFocus[1],
    },
  ];

  const stretchWorkouts = [
    {
      name: t("home.sleepyTimeStretching"),
      image: genderedImages.bodyFocus[2],
    },
    {
      name: t("home.fourMinTabata"),
      image: genderedImages.bodyFocus[3],
    },
    {
      name: t("home.morningStretch"),
      image: genderedImages.bodyFocus[0],
    },
  ];

  return (
    <View style={styles.container}>
      {themeType === "female" && (
        <Image
          source={require("../../../assets/girly.png")}
          style={styles.girlBg}
          resizeMode="cover"
        />
      )}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 90 }}
      >
        {/* ── Header ──────────────────────────────────────────────── */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t("home.homeWorkout")}</Text>
          <View style={styles.headerRight}>
            {(themeType === "male" || themeType === "dark") && (
              <Pressable
                onPress={() => setTheme(themeType === "dark" ? "male" : "dark")}
                style={({ pressed }) => [
                  styles.darkModeBtn,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Ionicons
                  name={themeType === "dark" ? "sunny" : "moon"}
                  size={20}
                  color={themeType === "dark" ? "#D4A44C" : theme.foreground.gray}
                />
              </Pressable>
            )}
            <Ionicons name="flame" size={26} color="#FF4444" />
            <Pressable
              style={({ pressed }) => [
                styles.proBadge,
                pressed && { opacity: 0.8 },
              ]}
              onPress={() => router.navigate("/settings" as any)}
            >
              <Ionicons name="diamond" size={13} color="#fff" />
              <Text style={styles.proBadgeText}>{t("home.pro")}</Text>
            </Pressable>
          </View>
        </View>

        {/* ── Calorie Summary (Donut + Stats) ─────────────────────── */}
{/* ── Résumé Santé (Bento Grid) ───────────────────────── */}
        <Text style={styles.sectionTitle}>{t("home.healthSummary", "RÉSUMÉ SANTÉ")}</Text>
        <View style={styles.healthGrid}>
          {[
            {
              icon: "fire" as const,
              iconType: "mci" as const,
              color: "#FF6B35",
              gradient: ["rgba(0,0,0,0.4)", "rgba(0,0,0,0.6)"] as const,
              image: genderedImages.health.calories,
              label: t("home.burned", "Brûlées"),
              value: caloriesBurned,
              goal: 1000,
              unit: "kcal",
            },
            {
              icon: "shoe-sneaker" as const,
              iconType: "mci" as const,
              color: "#4A90D9",
              gradient: ["rgba(0,0,0,0.4)", "rgba(0,0,0,0.6)"] as const,
              image: genderedImages.health.steps,
              label: t("home.steps", "Pas"),
              value: todaySteps || 0,
              goal: 10000,
              unit: "",
            },
            {
              icon: "food-apple" as const,
              iconType: "mci" as const,
              color: "#34C759",
              gradient: ["rgba(0,0,0,0.4)", "rgba(0,0,0,0.6)"] as const,
              image: genderedImages.health.food,
              label: t("home.eaten", "Consommées"),
              value: caloriesConsumed,
              goal: goals.calorieGoal,
              unit: "kcal",
            },
            {
              icon: "timer-outline" as const,
              iconType: "ion" as const,
              color: "#F5A623",
              gradient: ["rgba(0,0,0,0.4)", "rgba(0,0,0,0.6)"] as const,
              image: genderedImages.health.activity,
              label: t("home.activity", "Activité"),
              value: 45,
              goal: 60,
              unit: "min",
            },
          ].map((item, index) => {
            const percent = Math.min(Math.round((item.value / item.goal) * 100), 100);
            return (
              <ImageBackground
                key={index}
                source={item.image}
                style={styles.healthTile}
                imageStyle={styles.healthTileImage}
                resizeMode="cover"
              >
                <LinearGradient
                  colors={[item.gradient[0], item.gradient[1]]}
                  style={styles.healthTileOverlay}
                >
                  <View style={styles.healthTileTop}>
                    <View style={styles.healthTileIcon}>
                      {item.iconType === "mci" ? (
                        <MaterialCommunityIcons name={item.icon as any} size={18} color="#FFF" />
                      ) : (
                        <Ionicons name={item.icon as any} size={18} color="#FFF" />
                      )}
                    </View>
                    <Text style={styles.healthTilePercent}>{percent}%</Text>
                  </View>
                  <Text style={styles.healthTileValue}>
                    {item.goal >= 10000 ? `${(item.value / 1000).toFixed(1)}k` : item.value}
                  </Text>
                  <Text style={styles.healthTileLabel}>{item.label}</Text>
                  <Text style={styles.healthTileGoal}>
                    / {item.goal >= 10000 ? `${item.goal / 1000}k` : item.goal} {item.unit}
                  </Text>
                </LinearGradient>
              </ImageBackground>
            );
          })}
        </View>


        {/* ── Séances de la semaine ─────────────────────────────── */}
        <View style={styles.weekSessionsCard}>
          <View style={styles.weekSessionsHeader}>
            <Text style={styles.weekSessionsTitle}>
              {t("home.weekSessions", "SÉANCES DE LA SEMAINE")}
            </Text>
            <Text style={styles.weekObjectiveText}>
              {t("home.objectiveOption", "{{count}} x semaine", {
                count: weeklyObjective,
              })}
            </Text>
            <Pressable
              style={({ pressed }) => [
                styles.objectiveBtn,
                pressed && { opacity: 0.85 },
              ]}
              onPress={() => router.push("/objective")}
            >
              <Text style={styles.objectiveBtnText}>
                {t("home.objective", "OBJECTIVE")}
              </Text>
            </Pressable>
          </View>

          {/* Day chips row */}
          <View style={styles.weekChipsRow}>
            {weekDays.map((day, index) => {
              const status = weekDayStatuses[index];
              const isCompleted = status === "completed";
              const isMissed = status === "missed";
              const isOff = status === "off";
              return (
                <View
                  key={index}
                  style={[
                    styles.weekChip,
                    isCompleted && styles.weekChipCompleted,
                    isMissed && styles.weekChipMissed,
                    isOff && styles.weekChipOff,
                    !isCompleted && !isMissed && styles.weekChipPending,
                    day.isToday && styles.weekChipToday,
                  ]}
                >
                  <Text
                    style={[
                      styles.weekChipLabel,
                      (isCompleted || isMissed || day.isToday) &&
                        styles.weekChipLabelActive,
                    ]}
                  >
                    {day.label}
                  </Text>
                  <Text
                    style={[
                      styles.weekChipDate,
                      (isCompleted || isMissed || day.isToday) &&
                        styles.weekChipLabelActive,
                    ]}
                  >
                    {day.dayOfMonth}
                  </Text>
                  {isCompleted && (
                    <Ionicons name="checkmark" size={18} color="#fff" />
                  )}
                  {isMissed && (
                    <Ionicons name="close" size={18} color="#fff" />
                  )}
                  {!isCompleted && !isMissed && !isOff && (
                    <Text style={styles.weekChipDash}>—</Text>
                  )}
                  {isOff && <Text style={styles.weekChipOffMark}>•</Text>}
                </View>
              );
            })}
          </View>

          {/* Next workout card */}
          <Pressable
            style={({ pressed }) => [
              styles.nextWorkoutCard,
              pressed && { opacity: 0.95, transform: [{ scale: 0.98 }] },
            ]}
            onPress={() => router.navigate("/workout" as any)}
          >
            <Image
              source={genderedImages.nextWorkout}
              style={styles.nextWorkoutImage}
              resizeMode="cover"
            />
            <LinearGradient
              colors={["rgba(0,0,0,0.1)", "rgba(0,0,0,0.7)"]}
              style={styles.nextWorkoutGradient}
            />
            <View style={styles.nextWorkoutContent}>
              <View style={styles.nextWorkoutInfo}>
                <Text style={styles.nextWorkoutName}>
                  {t("home.todaysWorkout", "LEGS DAY: CUISSES & MOLLETS")}
                </Text>
                <Text style={styles.nextWorkoutMeta}>
                  {t("home.today", "Aujourd'hui")}, 17:30 | 50 min
                </Text>
              </View>
              <Pressable
                style={({ pressed }) => [
                  styles.nextWorkoutBtn,
                  pressed && { opacity: 0.9 },
                ]}
                onPress={() => router.navigate("/workout" as any)}
              >
                <Text style={styles.nextWorkoutBtnText}>
                  {t("home.start", "DÉMARRER")}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </View>

        {/* ── Calories Burned Chart ───────────────────────────────── */}
        <View style={styles.chartCard}>
          <View style={styles.chartCardHeader}>
            <Text style={styles.chartCardTitle}>
              {t("home.caloriesBurned")}
            </Text>
            <View style={styles.chartTotalBadge}>
              <MaterialCommunityIcons
                name="fire"
                size={14}
                color="#FF6B35"
              />
              <Text style={styles.chartTotalText}>
                {weeklyBurnedData.reduce((s, d) => s + d.value, 0)} kcal
              </Text>
            </View>
          </View>
          <View style={{ alignItems: "center", marginTop: 4 }}>
            <BarChart
              data={weeklyBurnedData.map((item, i) => ({
                ...item,
                frontColor:
                  i === weeklyBurnedData.length - 1
                    ? theme.primary.main
                    : theme.primary.main + "50",
                topLabelComponent:
                  i === weeklyBurnedData.length - 1
                    ? () => (
                        <Text
                          style={[
                            styles.barTopLabel,
                            { color: theme.primary.main },
                          ]}
                        >
                          {item.value}
                        </Text>
                      )
                    : undefined,
              }))}
              width={SCREEN_WIDTH - 100}
              height={120}
              barWidth={24}
              spacing={18}
              initialSpacing={8}
              noOfSections={3}
              maxValue={700}
              yAxisColor="transparent"
              xAxisColor="transparent"
              yAxisTextStyle={styles.chartAxisText}
              xAxisLabelTextStyle={styles.chartXLabel}
              hideRules
              isAnimated
              animationDuration={600}
              barBorderRadius={8}
            />
          </View>
        </View>

        {/* ── Challenge Section ───────────────────────────────────── */}
        <Text style={styles.sectionTitle}>{t("home.challenge")}</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.challengeScroll}
          snapToInterval={CHALLENGE_CARD_WIDTH + 14}
          decelerationRate="fast"
        >
          {challenges.map((challenge, index) => (
            <View key={index} style={styles.challengeCard}>
              <Image
                source={challenge.image}
                style={styles.challengeImage}
                resizeMode="cover"
              />
              <LinearGradient
                colors={[
                  "transparent",
                  "rgba(0,0,0,0.3)",
                  challenge.color + "E6",
                ]}
                style={styles.challengeGradient}
              />
              <View style={styles.challengeContent}>
                <View style={styles.challengeDaysBadge}>
                  <Text style={styles.challengeDaysText}>
                    {challenge.days} {t("home.days")}
                  </Text>
                </View>
                <Text style={styles.challengeTitle}>{challenge.title}</Text>
                <Text style={styles.challengeDesc} numberOfLines={3}>
                  {challenge.desc}
                </Text>
                <Pressable
                  style={({ pressed }) => [
                    styles.challengeStartBtn,
                    pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] },
                  ]}
                >
                  <Text style={styles.challengeStartText}>
                    {t("home.start").toUpperCase()}
                  </Text>
                </Pressable>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* ── Body Focus Section ──────────────────────────────────── */}
        <Text style={styles.sectionTitle}>{t("home.bodyFocus")}</Text>

        {/* Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScroll}
        >
          {bodyFocusOptions.map((option, index) => (
            <Pressable
              key={index}
              style={[
                styles.chip,
                selectedBodyFocus === index && styles.chipActive,
              ]}
              onPress={() => setSelectedBodyFocus(index)}
            >
              <Text
                style={[
                  styles.chipText,
                  selectedBodyFocus === index && styles.chipTextActive,
                ]}
              >
                {option}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Exercise List */}
        <View style={styles.exerciseList}>
          {bodyFocusExercises.map((exercise, index) => (
            <Pressable
              key={index}
              style={({ pressed }) => [
                styles.exerciseRow,
                pressed && { opacity: 0.8 },
              ]}
            >
              <Image
                source={exercise.image}
                style={styles.exerciseImage}
                resizeMode="cover"
              />
              <View style={styles.exerciseInfo}>
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                <Text style={styles.exerciseMeta}>
                  {exercise.duration} · {exercise.exercises}{" "}
                  {t("home.exercises")}
                </Text>
                <DifficultyBolts level={exercise.difficulty} theme={theme} />
              </View>
            </Pressable>
          ))}
        </View>

        {/* ── Custom Workout Section ──────────────────────────────── */}
        <Text style={styles.sectionTitle}>{t("home.customWorkout")}</Text>
        <Pressable
          style={({ pressed }) => [
            styles.customWorkoutCard,
            pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
          ]}
          onPress={() => router.navigate("/create-routine" as any)}
        >
          <LinearGradient
            colors={[theme.primary.light, theme.primary.main]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.customWorkoutGradient}
          >
            <View style={styles.customWorkoutContent}>
              <Text style={styles.customWorkoutTitle}>
                {t("home.createYourOwn")}
              </Text>
              <Pressable
                style={({ pressed }) => [
                  styles.goButton,
                  pressed && { opacity: 0.9, transform: [{ scale: 0.95 }] },
                ]}
                onPress={() => router.navigate("/create-routine" as any)}
              >
                <Text style={styles.goButtonText}>GO</Text>
              </Pressable>
            </View>
            <View style={styles.customWorkoutIconContainer}>
              <MaterialCommunityIcons
                name="pencil-ruler"
                size={56}
                color="rgba(255,255,255,0.25)"
              />
            </View>
          </LinearGradient>
        </Pressable>

        {/* ── Just For You Section ─────────────────────────────────── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>{t("home.justForYou")}</Text>
          <Pressable
            onPress={() => router.navigate("/search" as any)}
            style={({ pressed }) => pressed && { opacity: 0.7 }}
          >
            <Text style={styles.moreLink}>
              {t("home.more")} {">"}
            </Text>
          </Pressable>
        </View>
        <View style={styles.justForYouList}>
          {justForYouWorkouts.map((workout, index) => (
            <Pressable
              key={index}
              style={({ pressed }) => [
                styles.justForYouRow,
                pressed && { opacity: 0.8 },
              ]}
            >
              <Image
                source={workout.image}
                style={styles.justForYouImage}
                resizeMode="cover"
              />
              <View style={styles.justForYouInfo}>
                <Text style={styles.justForYouName}>{workout.name}</Text>
                <Text style={styles.justForYouMeta}>
                  {workout.duration} · {workout.level}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>

        {/* ── Stretch & Warm Up Section ────────────────────────────── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>
            {t("home.stretchAndWarmUp")}
          </Text>
          <Pressable
            onPress={() => router.navigate("/search" as any)}
            style={({ pressed }) => pressed && { opacity: 0.7 }}
          >
            <Text style={styles.moreLink}>
              {t("home.more")} {">"}
            </Text>
          </Pressable>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.stretchScroll}
        >
          {stretchWorkouts.map((workout, index) => (
            <Pressable
              key={index}
              style={({ pressed }) => [
                styles.stretchCard,
                pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
              ]}
            >
              <Image
                source={workout.image}
                style={styles.stretchImage}
                resizeMode="cover"
              />
              <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.6)"]}
                style={styles.stretchGradient}
              />
              <Text style={styles.stretchName} numberOfLines={2}>
                {workout.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </ScrollView>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background.dark,
    },
    girlBg: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: "100%",
      height: "100%",
      opacity: 0.3,
    },

    // ── Header ────────────────────────────────
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingTop: 4,
      paddingBottom: 12,
    },
    headerTitle: {
      fontFamily: FONTS.extraBold,
      fontSize: 22,
      color: theme.foreground.white,
      letterSpacing: 0.5,
    },
    headerRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    darkModeBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.background.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    proBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: "#F5A623",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
    },
    proBadgeText: {
      fontFamily: FONTS.bold,
      fontSize: 12,
      color: "#fff",
      letterSpacing: 0.5,
    },

    // ── Calorie Summary Card ──────────────────
    calorieCard: {
      marginHorizontal: 20,
      backgroundColor: theme.background.darker,
      borderRadius: 20,
      padding: 18,
      marginBottom: 14,
    },
    calorieCardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    calorieCardTitle: {
      fontFamily: FONTS.bold,
      fontSize: 17,
      color: theme.foreground.white,
    },
    calorieGoalBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: theme.primary.main + "12",
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    calorieGoalText: {
      fontFamily: FONTS.semiBold,
      fontSize: 12,
      color: theme.primary.main,
    },
    donutRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 8,
    },
    donutCenterValue: {
      fontFamily: FONTS.extraBold,
      fontSize: 20,
      color: theme.foreground.white,
    },
    donutCenterLabel: {
      fontFamily: FONTS.regular,
      fontSize: 10,
      color: theme.foreground.gray,
      marginTop: -2,
    },
    calorieStatsCol: {
      gap: 12,
      flex: 1,
      marginLeft: 20,
    },
    calorieMiniCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: theme.background.accent + "60",
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    calorieMiniIcon: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    calorieMiniValue: {
      fontFamily: FONTS.bold,
      fontSize: 16,
      color: theme.foreground.white,
    },
    calorieMiniLabel: {
      fontFamily: FONTS.regular,
      fontSize: 11,
      color: theme.foreground.gray,
    },
    progressBarBg: {
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.background.accent,
      marginTop: 18,
      overflow: "hidden",
    },
    progressBarFill: {
      height: "100%",
      borderRadius: 3,
    },
    progressText: {
      fontFamily: FONTS.regular,
      fontSize: 11,
      color: theme.foreground.gray,
      marginTop: 6,
      textAlign: "right",
    },

    // ── Macros Row ────────────────────────────
    macrosContainer: {
      flexDirection: "row",
      marginHorizontal: 20,
      gap: 10,
      marginBottom: 18,
    },
    macroCard: {
      flex: 1,
      alignItems: "center",
      backgroundColor: theme.background.darker,
      borderRadius: 16,
      paddingVertical: 14,
      paddingHorizontal: 6,
      gap: 6,
    },
    macroPercent: {
      fontFamily: FONTS.bold,
      fontSize: 10,
    },
    macroLabel: {
      fontFamily: FONTS.semiBold,
      fontSize: 12,
      color: theme.foreground.white,
    },
    macroGrams: {
      fontFamily: FONTS.bold,
      fontSize: 13,
      color: theme.foreground.white,
    },
    macroGramsGoal: {
      fontFamily: FONTS.regular,
      fontSize: 11,
      color: theme.foreground.gray,
    },

    // ── Chart Card ────────────────────────────
    chartCard: {
      marginHorizontal: 20,
      backgroundColor: theme.background.darker,
      borderRadius: 20,
      padding: 18,
      marginBottom: 24,
    },
    chartCardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    chartCardTitle: {
      fontFamily: FONTS.bold,
      fontSize: 17,
      color: theme.foreground.white,
    },
    chartTotalBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: "#FF6B35" + "12",
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    chartTotalText: {
      fontFamily: FONTS.semiBold,
      fontSize: 12,
      color: "#FF6B35",
    },
    chartAxisText: {
      fontFamily: FONTS.regular,
      fontSize: 9,
      color: theme.foreground.gray,
    },
    chartXLabel: {
      fontFamily: FONTS.semiBold,
      fontSize: 11,
      color: theme.foreground.gray,
    },
    barTopLabel: {
      fontFamily: FONTS.bold,
      fontSize: 10,
      marginBottom: 4,
    },

    // ── Week Sessions ─────────────────────────
    weekSessionsCard: {
      marginHorizontal: 20,
      backgroundColor: theme.background.darker,
      borderRadius: 20,
      padding: 18,
      marginBottom: 24,
    },
    weekSessionsHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 16,
      gap: 10,
    },
    weekSessionsTitle: {
      fontFamily: FONTS.extraBold,
      fontSize: 16,
      color: theme.foreground.white,
      letterSpacing: 0.5,
      textTransform: "uppercase",
      flex: 1,
    },
    weekObjectiveText: {
      fontFamily: FONTS.semiBold,
      fontSize: 11,
      color: theme.foreground.gray,
      textTransform: "uppercase",
    },
    objectiveBtn: {
      borderWidth: 1,
      borderColor: theme.primary.main,
      backgroundColor: theme.primary.main + "12",
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    objectiveBtnText: {
      fontFamily: FONTS.bold,
      fontSize: 11,
      color: theme.primary.main,
      letterSpacing: 0.5,
      textTransform: "uppercase",
    },
    weekChipsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 6,
      marginBottom: 18,
    },
    weekChip: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 8,
      borderRadius: 12,
      gap: 4,
    },
    weekChipCompleted: {
      backgroundColor: "#22C55E",
    },
    weekChipMissed: {
      backgroundColor: "#EF4444",
    },
    weekChipPending: {
      backgroundColor: theme.background.accent,
    },
    weekChipOff: {
      backgroundColor: theme.background.accent + "66",
    },
    weekChipToday: {
      borderWidth: 1,
      borderColor: theme.primary.main,
    },
    weekChipLabel: {
      fontFamily: FONTS.bold,
      fontSize: 11,
      color: theme.foreground.gray,
      textTransform: "capitalize",
    },
    weekChipDate: {
      fontFamily: FONTS.semiBold,
      fontSize: 10,
      color: theme.foreground.gray,
    },
    weekChipLabelActive: {
      color: "#fff",
    },
    weekChipDash: {
      fontFamily: FONTS.bold,
      fontSize: 14,
      color: theme.foreground.gray,
    },
    weekChipOffMark: {
      fontFamily: FONTS.bold,
      fontSize: 14,
      color: theme.foreground.gray,
    },

    // ── Next Workout Card ─────────────────────
    nextWorkoutCard: {
      height: 120,
      borderRadius: 16,
      overflow: "hidden",
      borderWidth: 2,
      borderColor: theme.primary.main + "40",
    },
    nextWorkoutImage: {
      width: "100%",
      height: "100%",
      position: "absolute",
    },
    nextWorkoutGradient: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      height: "100%",
    },
    nextWorkoutContent: {
      flex: 1,
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "space-between",
      padding: 14,
    },
    nextWorkoutInfo: {
      flex: 1,
    },
    nextWorkoutName: {
      fontFamily: FONTS.extraBold,
      fontSize: 16,
      color: "#fff",
      marginBottom: 4,
    },
    nextWorkoutMeta: {
      fontFamily: FONTS.regular,
      fontSize: 12,
      color: "rgba(255,255,255,0.8)",
      fontStyle: "italic",
    },
    nextWorkoutBtn: {
      backgroundColor: theme.primary.main,
      borderRadius: 20,
      paddingHorizontal: 20,
      paddingVertical: 10,
      marginLeft: 10,
    },
    nextWorkoutBtnText: {
      fontFamily: FONTS.extraBold,
      fontSize: 13,
      color: "#fff",
      letterSpacing: 0.5,
    },

    // ── Section Title ─────────────────────────
    sectionTitle: {
      fontFamily: FONTS.bold,
      fontSize: 18,
      color: theme.foreground.white,
      paddingHorizontal: 20,
      marginBottom: 14,
    },

    // ── Challenge Cards ───────────────────────
    challengeScroll: {
      paddingLeft: 20,
      paddingRight: 6,
      paddingBottom: 24,
    },
    challengeCard: {
      width: CHALLENGE_CARD_WIDTH,
      height: 340,
      borderRadius: 20,
      overflow: "hidden",
      marginRight: 14,
      backgroundColor: "#1565C0",
    },
    challengeImage: {
      width: "100%",
      height: "100%",
      position: "absolute",
    },
    challengeGradient: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      height: "75%",
    },
    challengeContent: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      padding: 20,
    },
    challengeDaysBadge: {
      alignSelf: "flex-start",
      marginBottom: 6,
    },
    challengeDaysText: {
      fontFamily: FONTS.bold,
      fontSize: 13,
      color: "#4FC3F7",
      letterSpacing: 1,
    },
    challengeTitle: {
      fontFamily: FONTS.extraBold,
      fontSize: 26,
      color: "#fff",
      lineHeight: 30,
      marginBottom: 8,
    },
    challengeDesc: {
      fontFamily: FONTS.regular,
      fontSize: 12,
      color: "rgba(255,255,255,0.8)",
      lineHeight: 17,
      marginBottom: 16,
    },
    challengeStartBtn: {
      backgroundColor: "#fff",
      borderRadius: 28,
      paddingVertical: 12,
      alignItems: "center",
    },
    challengeStartText: {
      fontFamily: FONTS.bold,
      fontSize: 14,
      color: "#1a1a1a",
      letterSpacing: 1,
    },

    // ── Body Focus Chips ──────────────────────
    chipsScroll: {
      paddingHorizontal: 20,
      gap: 8,
      marginBottom: 16,
    },
    chip: {
      paddingHorizontal: 20,
      paddingVertical: 9,
      borderRadius: 22,
      borderWidth: 1.5,
      borderColor: theme.background.accent,
      backgroundColor: theme.background.dark,
    },
    chipActive: {
      backgroundColor: theme.foreground.white,
      borderColor: theme.foreground.white,
    },
    chipText: {
      fontFamily: FONTS.medium,
      fontSize: 13,
      color: theme.foreground.gray,
    },
    chipTextActive: {
      color: theme.background.dark,
      fontFamily: FONTS.semiBold,
    },

    // ── Exercise List ─────────────────────────
    exerciseList: {
      paddingHorizontal: 20,
      marginBottom: 24,
    },
    exerciseRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: "rgba(0,0,0,0.08)",
    },
    exerciseImage: {
      width: 100,
      height: 80,
      borderRadius: 12,
    },
    exerciseInfo: {
      flex: 1,
      marginLeft: 14,
    },
    exerciseName: {
      fontFamily: FONTS.bold,
      fontSize: 15,
      color: theme.foreground.white,
    },
    exerciseMeta: {
      fontFamily: FONTS.regular,
      fontSize: 13,
      color: theme.foreground.gray,
      marginTop: 3,
    },

    // ── Custom Workout Card ───────────────────
    customWorkoutCard: {
      marginHorizontal: 20,
      borderRadius: 18,
      overflow: "hidden",
      marginBottom: 20,
    },
    customWorkoutGradient: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 24,
      minHeight: 120,
    },
    customWorkoutContent: {
      flex: 1,
    },
    customWorkoutTitle: {
      fontFamily: FONTS.extraBold,
      fontSize: 24,
      color: "#fff",
      lineHeight: 30,
    },
    customWorkoutSubtitle: {
      fontFamily: FONTS.regular,
      fontSize: 13,
      color: "rgba(255,255,255,0.8)",
      marginTop: 6,
    },
    customWorkoutIconContainer: {
      marginLeft: 16,
    },
    goButton: {
      backgroundColor: "#fff",
      borderRadius: 24,
      paddingHorizontal: 28,
      paddingVertical: 10,
      alignSelf: "flex-start",
      marginTop: 14,
    },
    goButtonText: {
      fontFamily: FONTS.bold,
      fontSize: 15,
      color: theme.primary.main,
    },
// ── Résumé Santé (Bento Grid) ─────────────────────────
    healthGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginHorizontal: 20,
      gap: 10,
      marginBottom: 20,
    },
    healthTile: {
      width: (SCREEN_WIDTH - 50) / 2,
      borderRadius: 18,
      overflow: "hidden",
    },
    healthTileImage: {
      borderRadius: 18,
    },
    healthTileOverlay: {
      padding: 14,
      borderRadius: 18,
    },
    healthTileTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    healthTileIcon: {
      width: 36,
      height: 36,
      borderRadius: 12,
      backgroundColor: "rgba(255,255,255,0.25)",
      justifyContent: "center",
      alignItems: "center",
    },
    healthTilePercent: {
      fontFamily: FONTS.bold,
      fontSize: 13,
      color: "rgba(255,255,255,0.9)",
    },
    healthTileValue: {
      fontFamily: FONTS.extraBold,
      fontSize: 24,
      color: "#FFFFFF",
    },
    healthTileLabel: {
      fontFamily: FONTS.semiBold,
      fontSize: 12,
      color: "rgba(255,255,255,0.85)",
      marginTop: 2,
    },
    healthTileGoal: {
      fontFamily: FONTS.medium,
      fontSize: 11,
      color: "rgba(255,255,255,0.7)",
      marginTop: 1,
    },
    // ── Section Header Row (with More link) ───
    sectionHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingRight: 20,
      marginBottom: 0,
    },
    moreLink: {
      fontFamily: FONTS.semiBold,
      fontSize: 14,
      color: theme.primary.main,
    },

    // ── Just For You ──────────────────────────
    justForYouList: {
      paddingHorizontal: 20,
      marginBottom: 24,
    },
    justForYouRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: "rgba(0,0,0,0.08)",
    },
    justForYouImage: {
      width: 100,
      height: 80,
      borderRadius: 12,
    },
    justForYouInfo: {
      flex: 1,
      marginLeft: 14,
    },
    justForYouName: {
      fontFamily: FONTS.bold,
      fontSize: 15,
      color: theme.foreground.white,
    },
    justForYouMeta: {
      fontFamily: FONTS.regular,
      fontSize: 13,
      color: theme.foreground.gray,
      marginTop: 3,
    },

    // ── Stretch & Warm Up ─────────────────────
    stretchScroll: {
      paddingLeft: 20,
      paddingRight: 6,
      paddingBottom: 20,
    },
    stretchCard: {
      width: SCREEN_WIDTH * 0.42,
      height: 180,
      borderRadius: 14,
      overflow: "hidden",
      marginRight: 12,
      backgroundColor: theme.background.accent,
    },
    stretchImage: {
      width: "100%",
      height: "100%",
      position: "absolute",
    },
    stretchGradient: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      height: "50%",
    },
    stretchName: {
      position: "absolute",
      bottom: 12,
      left: 12,
      right: 12,
      fontFamily: FONTS.bold,
      fontSize: 14,
      color: "#fff",
    },
  });
}

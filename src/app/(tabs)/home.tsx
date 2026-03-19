import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dimensions,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { FONTS } from "../../constants/fonts";
import { Theme } from "../../constants/themes";
import { useTheme } from "../../contexts/ThemeContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CHALLENGE_CARD_WIDTH = SCREEN_WIDTH * 0.78;

const challengeImages = [
  require("../../../assets/images/OnBoarding/ManWithTwoWeights.jpg"),
  require("../../../assets/images/AuthPage/PullUp.jpg"),
  require("../../../assets/images/AuthPage/HoldingTwoWeights.jpg"),
];

const bodyFocusImages = [
  require("../../../assets/images/AuthPage/DeadLiftIGuess.jpg"),
  require("../../../assets/images/OnBoarding/ManWithOneWeights.jpg"),
  require("../../../assets/images/AuthPage/OneKneeOnTheGround.jpg"),
  require("../../../assets/images/AuthPage/PullUp.jpg"),
];

function getWeekDays(): { date: Date; dayNum: number }[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((day + 6) % 7));

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return { date: d, dayNum: d.getDate() };
  });
}

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
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [selectedBodyFocus, setSelectedBodyFocus] = useState(0);
  const [weeklyGoal] = useState(6);
  const [completedDays] = useState(0);

  const styles = createStyles(theme);
  const weekDays = getWeekDays();
  const todayDate = new Date().getDate();

  const bodyFocusOptions = [
    t("home.abs"),
    t("home.arm"),
    t("home.chest"),
    t("home.leg"),
    t("home.shoulder"),
  ];

  const challenges = [
    {
      days: 28,
      title: t("home.fullBodyChallenge"),
      desc: t("home.fullBodyChallengeDesc"),
      image: challengeImages[0],
      color: "#1565C0",
    },
    {
      days: 28,
      title: t("home.sculptUpperBody"),
      desc: t("home.sculptUpperBodyDesc"),
      image: challengeImages[1],
      color: "#2E7D9A",
    },
    {
      days: 21,
      title: t("home.lowerBodyBlast"),
      desc: t("home.lowerBodyBlastDesc"),
      image: challengeImages[2],
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
      image: bodyFocusImages[selectedBodyFocus % bodyFocusImages.length],
    },
    {
      name: selectedLabel + " " + t("home.intermediate"),
      duration: "24 mins",
      exercises: 21,
      difficulty: 2,
      image: bodyFocusImages[(selectedBodyFocus + 1) % bodyFocusImages.length],
    },
    {
      name: selectedLabel + " " + t("home.advanced"),
      duration: "27 mins",
      exercises: 21,
      difficulty: 3,
      image: bodyFocusImages[(selectedBodyFocus + 2) % bodyFocusImages.length],
    },
  ];

  const justForYouWorkouts = [
    {
      name: t("home.killerChestRoutine"),
      duration: "10 min",
      level: t("home.intermediate"),
      image: bodyFocusImages[0],
    },
    {
      name: t("home.sevenMinAbs"),
      duration: "7 min",
      level: t("home.beginner"),
      image: bodyFocusImages[1],
    },
  ];

  const stretchWorkouts = [
    {
      name: t("home.sleepyTimeStretching"),
      image: bodyFocusImages[2],
    },
    {
      name: t("home.fourMinTabata"),
      image: bodyFocusImages[3],
    },
    {
      name: t("home.morningStretch"),
      image: bodyFocusImages[0],
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 90 }}
      >
        {/* ── Header ──────────────────────────────────────────────── */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t("home.homeWorkout")}</Text>
          <View style={styles.headerRight}>
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

        {/* ── Search Bar ──────────────────────────────────────────── */}
        <Pressable
          style={styles.searchBar}
          onPress={() => router.navigate("/search" as any)}
        >
          <Ionicons name="search" size={18} color={theme.foreground.gray} />
          <TextInput
            style={styles.searchInput}
            placeholder={t("home.searchPlaceholder")}
            placeholderTextColor={theme.foreground.gray}
            editable={false}
            pointerEvents="none"
          />
        </Pressable>

        {/* ── Weekly Goal ─────────────────────────────────────────── */}
        <View style={styles.weeklyGoalCard}>
          <View style={styles.weeklyGoalHeader}>
            <Text style={styles.weeklyGoalTitle}>{t("home.weeklyGoal")}</Text>
            <View style={styles.weeklyGoalRight}>
              <Text style={styles.weeklyGoalCount}>
                <Text style={styles.weeklyGoalCountBold}>{completedDays}</Text>
                /{weeklyGoal}
              </Text>
              <Ionicons
                name="pencil"
                size={14}
                color={theme.foreground.gray}
              />
            </View>
          </View>

          {/* Day numbers row */}
          <View style={styles.weekDaysRow}>
            {weekDays.map((day, index) => {
              const isToday = day.dayNum === todayDate;
              return (
                <View key={index} style={styles.weekDayItem}>
                  <View
                    style={[
                      styles.weekDayCircle,
                      isToday && styles.weekDayCircleActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.weekDayNumber,
                        isToday && styles.weekDayNumberActive,
                      ]}
                    >
                      {day.dayNum}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Motivational message */}
          <View style={styles.motivationalRow}>
            <Image
              source={require("../../../assets/images/OnBoarding/ManLookingUp.jpg")}
              style={styles.motivationalAvatar}
            />
            <View style={styles.motivationalBubble}>
              <Text style={styles.motivationalText}>
                {t("home.motivationalMessage")}
              </Text>
            </View>
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
            colors={["#4A90D9", "#2563EB"]}
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

    // ── Search Bar ────────────────────────────
    searchBar: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.background.darker,
      marginHorizontal: 20,
      borderRadius: 28,
      paddingHorizontal: 16,
      paddingVertical: Platform.OS === "ios" ? 12 : 8,
      gap: 10,
      marginBottom: 20,
    },
    searchInput: {
      flex: 1,
      fontFamily: FONTS.regular,
      fontSize: 14,
      color: theme.foreground.white,
      padding: 0,
    },

    // ── Weekly Goal ───────────────────────────
    weeklyGoalCard: {
      marginHorizontal: 20,
      backgroundColor: theme.background.darker,
      borderRadius: 16,
      padding: 18,
      marginBottom: 24,
    },
    weeklyGoalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 18,
    },
    weeklyGoalTitle: {
      fontFamily: FONTS.bold,
      fontSize: 17,
      color: theme.foreground.white,
    },
    weeklyGoalRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    weeklyGoalCount: {
      fontFamily: FONTS.medium,
      fontSize: 16,
      color: theme.foreground.gray,
    },
    weeklyGoalCountBold: {
      fontFamily: FONTS.bold,
      fontSize: 20,
      color: theme.primary.main,
    },

    // ── Week Days Row ─────────────────────────
    weekDaysRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 18,
    },
    weekDayItem: {
      alignItems: "center",
    },
    weekDayCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
    },
    weekDayCircleActive: {
      borderWidth: 2,
      borderColor: theme.primary.main,
      backgroundColor: theme.primary.main + "10",
    },
    weekDayNumber: {
      fontFamily: FONTS.medium,
      fontSize: 14,
      color: theme.foreground.gray,
    },
    weekDayNumberActive: {
      fontFamily: FONTS.bold,
      color: theme.primary.main,
    },

    // ── Motivational Row ──────────────────────
    motivationalRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.background.accent,
      borderRadius: 12,
      padding: 12,
      gap: 12,
    },
    motivationalAvatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
    },
    motivationalBubble: {
      flex: 1,
    },
    motivationalText: {
      fontFamily: FONTS.medium,
      fontSize: 13,
      color: theme.foreground.white,
      lineHeight: 18,
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
      color: "#2563EB",
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

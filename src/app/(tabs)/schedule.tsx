import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dimensions,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ViewToken,
} from "react-native";
import { FONTS } from "../../constants/fonts";
import { Theme } from "../../constants/themes";
import { useActiveWorkout } from "../../contexts/ActiveWorkoutContext";
import { useTheme } from "../../contexts/ThemeContext";
import {
  addScheduleListener,
  getRecentWorkouts,
  getRoutineById,
  getScheduleForDate,
  ScheduledDay,
} from "../../data/mockData";
import { formatDisplayDate, formatWeekday } from "../../utils/dateFormatter";
import {
  translateExerciseTerm,
  translateRoutineDescription,
  translateRoutineName,
} from "../../utils/exerciseTranslator";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const MY_USER_ID = "1";

const workoutImages = [
  require("../../../assets/images/OnBoarding/ManWithTwoWeights.jpg"),
  require("../../../assets/images/AuthPage/PullUp.jpg"),
  require("../../../assets/images/AuthPage/HoldingTwoWeights.jpg"),
  require("../../../assets/images/OnBoarding/ManWithOneWeights.jpg"),
  require("../../../assets/images/AuthPage/DeadLiftIGuess.jpg"),
  require("../../../assets/images/OnBoarding/ManLookingUp.jpg"),
];

function toISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getDayLabel(offset: number, t: (key: string) => string): string {
  if (offset === -1) return t("schedule.yesterday");
  if (offset === 0) return t("schedule.today");
  if (offset === 1) return t("schedule.tomorrow");
  return t("schedule.in2Days");
}

function buildSlides(t: (key: string) => string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return [-1, 0, 1, 2].map((offset) => {
    const d = new Date(today);
    d.setDate(today.getDate() + offset);
    return {
      offset,
      date: toISO(d),
      label: getDayLabel(offset, t),
      shortDayName: formatWeekday(d, { weekday: "short" }),
      dayNumber: formatDisplayDate(d, { day: "numeric" }),
      dayName: formatWeekday(d),
      displayDate: formatDisplayDate(d),
    };
  });
}

type Slide = ReturnType<typeof buildSlides>[number];

export default function Schedule() {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const router = useRouter();
  const { startWorkout } = useActiveWorkout();
  const flatListRef = useRef<FlatList<Slide>>(null);
  const styles = createStyles(theme);

  const slides = buildSlides(t);
  const todayIndex = 1;

  const [activeIndex, setActiveIndex] = useState(todayIndex);
  const [scheduleData, setScheduleData] = useState<
    Record<string, ScheduledDay | undefined>
  >({});

  const loadData = useCallback(() => {
    const map: Record<string, ScheduledDay | undefined> = {};
    slides.forEach((slide) => {
      map[slide.date] = getScheduleForDate(slide.date, MY_USER_ID);
    });
    setScheduleData(map);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadData();
    const unsub = addScheduleListener(loadData);
    return () => unsub();
  }, [loadData]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  // Weekly stats
  const recentWorkouts = getRecentWorkouts(MY_USER_ID, 7);
  const totalWorkouts = recentWorkouts.length;
  const totalMinutes = recentWorkouts.reduce((s, w) => s + w.duration, 0);
  const totalExercises = recentWorkouts.reduce((s, w) => s + w.exercises.length, 0);

  useEffect(() => {
    const timer = setTimeout(() => {
      flatListRef.current?.scrollToIndex({ index: todayIndex, animated: false });
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setActiveIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 80,
  }).current;

  const handleScrollToIndex = (index: number) => {
    flatListRef.current?.scrollToIndex({ index, animated: true });
  };

  const handleStartWorkout = (slide: Slide) => {
    const schedDay = scheduleData[slide.date];
    if (!schedDay?.routineId) return;
    const routine = getRoutineById(schedDay.routineId);
    if (!routine) return;

    startWorkout({
      id: `workout-${Date.now()}`,
      duration: 0,
      volume: 0,
      sets: 0,
      exercises: routine.exercises.map((exercise, index) => ({
        id: `entry-${Date.now()}-${index}`,
        exerciseId: 0,
        name: exercise.name,
        muscles: [],
        equipment: [],
        notes: exercise.notes,
        addedAt: Date.now(),
        sets: Array.from({ length: exercise.sets }, (_, setIndex) => ({
          id: `set-${Date.now()}-${index}-${setIndex}`,
          setNumber: setIndex + 1,
          kg: "",
          reps: exercise.reps.includes("-")
            ? exercise.reps.split("-")[0]
            : exercise.reps,
          isCompleted: false,
        })),
      })),
    });
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 90 }}
    >
      {/* ── Header ──────────────────────────────────────── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>{t("schedule.mySchedule")}</Text>
          <Text style={styles.headerDate}>
            {formatDisplayDate(new Date(), {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </Text>
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.calendarBtn,
            pressed && { opacity: 0.8 },
          ]}
          onPress={() => router.push(`/schedule/${toISO(new Date())}` as any)}
        >
          <Ionicons name="calendar" size={20} color={theme.primary.main} />
        </Pressable>
      </View>

      {/* ── Day Switcher (original 4-day bar) ──────────── */}
      <View style={styles.daySwitcher}>
        {slides.map((slide, index) => {
          const isActive = index === activeIndex;
          return (
            <Pressable
              key={slide.date}
              style={[
                styles.daySwitcherItem,
                isActive && {
                  backgroundColor: theme.primary.main,
                },
              ]}
              onPress={() => handleScrollToIndex(index)}
            >
              <Text
                style={[
                  styles.daySwitcherLabel,
                  { color: isActive ? "#fff" : theme.foreground.gray },
                ]}
              >
                {slide.shortDayName}
              </Text>
              <Text
                style={[
                  styles.daySwitcherDate,
                  {
                    color: isActive ? "#fff" : theme.foreground.white,
                    opacity: isActive ? 1 : 0.78,
                  },
                ]}
              >
                {slide.dayNumber}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* ── Carousel + Static content ─────────────────── */}
      <FlatList
        ref={flatListRef}
        data={slides}
        keyExtractor={(item) => item.date}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
        renderItem={({ item: slide, index: slideIndex }) => {
          const schedDay = scheduleData[slide.date];
          const routine = schedDay?.routineId
            ? getRoutineById(schedDay.routineId)
            : undefined;
          const isRest = !schedDay || schedDay.status === "rest";
          const isCompleted = schedDay?.status === "completed";
          const isToday = slide.offset === 0;

          const totalSets = routine
            ? routine.exercises.reduce((sum, e) => sum + e.sets, 0)
            : 0;

          return (
            <View style={{ width: SCREEN_WIDTH, paddingTop: 8 }}>
              {isRest ? (
                /* ── Rest Day ─────────────────────────────── */
                <View style={styles.restCard}>
                  <Image
                    source={workoutImages[5]}
                    style={styles.restCardImage}
                    resizeMode="cover"
                  />
                  <LinearGradient
                    colors={["transparent", "rgba(0,0,0,0.8)"]}
                    style={styles.restCardGradient}
                  />
                  <View style={styles.restCardContent}>
                    <View style={styles.restIconCircle}>
                      <Ionicons name="moon" size={28} color="#E8D5B7" />
                    </View>
                    <Text style={styles.restCardTitle}>
                      {t("schedule.restDay")}
                    </Text>
                    <Text style={styles.restCardSubtitle}>
                      {t("schedule.recoveryIsPart")}
                    </Text>
                  </View>

                  <View style={styles.recoveryTips}>
                    {[
                      { icon: "water-outline" as const, text: t("schedule.stayHydrated"), color: "#4FC3F7" },
                      { icon: "bed-outline" as const, text: t("schedule.get8hSleep"), color: "#9C8FE8" },
                      { icon: "body-outline" as const, text: t("schedule.lightStretching"), color: "#66BB6A" },
                    ].map((tip, i) => (
                      <View key={i} style={styles.recoveryTipRow}>
                        <View style={[styles.recoveryTipIcon, { backgroundColor: tip.color + "20" }]}>
                          <Ionicons name={tip.icon} size={16} color={tip.color} />
                        </View>
                        <Text style={styles.recoveryTipText}>{tip.text}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : routine ? (
                <>
                  {/* ── Workout Hero Card ─────────────────── */}
                  <Pressable
                    style={({ pressed }) => [
                      styles.heroCard,
                      pressed && { opacity: 0.95, transform: [{ scale: 0.99 }] },
                    ]}
                    onPress={() => router.push(`/schedule/${slide.date}` as any)}
                  >
                    <Image
                      source={workoutImages[slideIndex % workoutImages.length]}
                      style={styles.heroImage}
                      resizeMode="cover"
                    />
                    <LinearGradient
                      colors={["rgba(0,0,0,0.1)", "rgba(0,0,0,0.4)", "rgba(0,0,0,0.85)"]}
                      style={styles.heroGradient}
                    />

                    {/* Status badge */}
                    <View style={styles.heroBadgeRow}>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: isCompleted ? "#4CAF5033" : theme.primary.main + "33" },
                        ]}
                      >
                        <Ionicons
                          name={isCompleted ? "checkmark-circle" : "time-outline"}
                          size={12}
                          color={isCompleted ? "#4CAF50" : "#fff"}
                        />
                        <Text style={styles.statusBadgeText}>
                          {isCompleted ? t("schedule.completed") : t("schedule.scheduled")}
                        </Text>
                      </View>
                    </View>

                    {/* Day label */}
                    <View style={styles.heroDayLabel}>
                      <Text style={styles.heroDayLabelText}>
                        {slide.label.toUpperCase()}
                      </Text>
                    </View>

                    <View style={styles.heroContent}>
                      <Text style={styles.heroRoutineName}>
                        {translateRoutineName(routine.name)}
                      </Text>
                      <Text style={styles.heroDesc} numberOfLines={2}>
                        {translateRoutineDescription(routine.description)}
                      </Text>

                      <View style={styles.heroStatsRow}>
                        <View style={styles.heroStat}>
                          <Ionicons name="barbell-outline" size={14} color="rgba(255,255,255,0.8)" />
                          <Text style={styles.heroStatText}>
                            {routine.exercises.length} {t("schedule.exercises")}
                          </Text>
                        </View>
                        <View style={styles.heroStatDivider} />
                        <View style={styles.heroStat}>
                          <Ionicons name="layers-outline" size={14} color="rgba(255,255,255,0.8)" />
                          <Text style={styles.heroStatText}>{totalSets} sets</Text>
                        </View>
                        <View style={styles.heroStatDivider} />
                        <View style={styles.heroStat}>
                          <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.8)" />
                          <Text style={styles.heroStatText}>{routine.estimatedDuration} min</Text>
                        </View>
                      </View>

                      <View style={styles.musclePillsRow}>
                        {routine.targetMuscles.map((m) => (
                          <View key={m} style={styles.musclePill}>
                            <Text style={styles.musclePillText}>
                              {i18n.language === "fr" ? translateExerciseTerm(m, "targetMuscles") : m}
                            </Text>
                          </View>
                        ))}
                      </View>

                      {!isCompleted && isToday && (
                        <Pressable
                          style={({ pressed }) => [
                            styles.startWorkoutBtn,
                            pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] },
                          ]}
                          onPress={() => handleStartWorkout(slide)}
                        >
                          <Ionicons name="play" size={18} color="#1a1a1a" />
                          <Text style={styles.startWorkoutText}>{t("schedule.startWorkout")}</Text>
                        </Pressable>
                      )}
                      {isCompleted && (
                        <View style={styles.completedBanner}>
                          <Ionicons name="trophy" size={18} color="#FFD700" />
                          <Text style={styles.completedBannerText}>{t("schedule.viewSummary")}</Text>
                        </View>
                      )}
                    </View>
                  </Pressable>
                </>
              ) : (
                <View style={styles.noRoutineCard}>
                  <Ionicons name="calendar-outline" size={40} color={theme.foreground.gray} />
                  <Text style={styles.noRoutineText}>{t("schedule.noRoutineAssigned")}</Text>
                </View>
              )}

            </View>
          );
        }}
        style={{ height: 430 }}
      />

      {/* ── Static content (doesn't change with day) ──── */}

      {/* Tip of the Day */}
      <Pressable
        style={({ pressed }) => [
          styles.tipCard,
          pressed && { opacity: 0.95 },
        ]}
      >
        <Image
          source={workoutImages[3]}
          style={styles.tipImage}
          resizeMode="cover"
        />
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.8)"]}
          style={styles.tipGradient}
        />
        <View style={styles.tipContent}>
          <View style={styles.tipBadge}>
            <Ionicons name="bulb" size={12} color="#FFD700" />
            <Text style={styles.tipBadgeText}>{t("schedule.tipOfDay")}</Text>
          </View>
          <Text style={styles.tipText}>{t("schedule.motivationQuote")}</Text>
        </View>
      </Pressable>

      {/* Weekly Stats */}
      <View style={styles.statsCard}>
        <View style={styles.statsInnerRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: "#FF6B35" }]}>{totalWorkouts}</Text>
            <Text style={styles.statLabel}>{t("home.workouts")}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.primary.main }]}>{totalMinutes}</Text>
            <Text style={styles.statLabel}>min</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: "#9C8FE8" }]}>{totalExercises}</Text>
            <Text style={styles.statLabel}>{t("home.exercises")}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background.dark,
    },

    // Header
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      paddingHorizontal: 20,
      paddingTop: 4,
      paddingBottom: 6,
    },
    headerTitle: {
      fontFamily: FONTS.extraBold,
      fontSize: 22,
      color: theme.foreground.white,
      letterSpacing: 0.3,
    },
    headerDate: {
      fontFamily: FONTS.medium,
      fontSize: 13,
      color: theme.foreground.gray,
      marginTop: 2,
    },
    calendarBtn: {
      width: 40,
      height: 40,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.primary.main + "15",
      marginTop: 2,
    },

    // Day Switcher (4-day bar)
    daySwitcher: {
      flexDirection: "row",
      marginHorizontal: 20,
      backgroundColor: theme.background.darker,
      borderRadius: 18,
      padding: 4,
      gap: 4,
      marginTop: 10,
      marginBottom: 4,
    },
    daySwitcherItem: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 10,
      borderRadius: 14,
    },
    daySwitcherLabel: {
      fontFamily: FONTS.bold,
      fontSize: 10,
      letterSpacing: 0.8,
      textTransform: "uppercase",
    },
    daySwitcherDate: {
      fontFamily: FONTS.bold,
      fontSize: 18,
      marginTop: 1,
      letterSpacing: -0.4,
    },

    // Rest Day Card
    restCard: {
      marginHorizontal: 20,
      borderRadius: 22,
      overflow: "hidden",
      backgroundColor: theme.background.darker,
      marginBottom: 20,
    },
    restCardImage: {
      width: "100%",
      height: 160,
    },
    restCardGradient: {
      position: "absolute",
      left: 0,
      right: 0,
      top: 0,
      height: 160,
    },
    restCardContent: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 160,
      alignItems: "center",
      justifyContent: "center",
    },
    restIconCircle: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: "rgba(255,255,255,0.15)",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 10,
    },
    restCardTitle: {
      fontFamily: FONTS.bold,
      fontSize: 20,
      color: "#fff",
    },
    restCardSubtitle: {
      fontFamily: FONTS.regular,
      fontSize: 13,
      color: "rgba(255,255,255,0.7)",
      marginTop: 4,
      textAlign: "center",
      paddingHorizontal: 30,
    },
    recoveryTips: {
      padding: 16,
      gap: 10,
    },
    recoveryTipRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    recoveryTipIcon: {
      width: 34,
      height: 34,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    recoveryTipText: {
      fontFamily: FONTS.medium,
      fontSize: 13,
      color: theme.foreground.white,
      flex: 1,
    },

    // Hero Workout Card
    heroCard: {
      marginHorizontal: 20,
      borderRadius: 22,
      overflow: "hidden",
      marginBottom: 20,
    },
    heroImage: {
      width: "100%",
      height: 400,
    },
    heroGradient: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      height: "100%",
    },
    heroBadgeRow: {
      position: "absolute",
      top: 16,
      right: 16,
    },
    heroDayLabel: {
      position: "absolute",
      top: 16,
      left: 16,
    },
    heroDayLabelText: {
      fontFamily: FONTS.bold,
      fontSize: 11,
      color: "rgba(255,255,255,0.7)",
      letterSpacing: 1.2,
    },
    statusBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 20,
    },
    statusBadgeText: {
      fontFamily: FONTS.semiBold,
      fontSize: 11,
      color: "#fff",
    },
    heroContent: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      padding: 20,
    },
    heroRoutineName: {
      fontFamily: FONTS.extraBold,
      fontSize: 22,
      color: "#fff",
      lineHeight: 26,
      marginBottom: 4,
    },
    heroDesc: {
      fontFamily: FONTS.regular,
      fontSize: 13,
      color: "rgba(255,255,255,0.75)",
      lineHeight: 18,
      marginBottom: 12,
    },
    heroStatsRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
    },
    heroStat: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
    },
    heroStatText: {
      fontFamily: FONTS.medium,
      fontSize: 12,
      color: "rgba(255,255,255,0.8)",
    },
    heroStatDivider: {
      width: 1,
      height: 12,
      backgroundColor: "rgba(255,255,255,0.3)",
      marginHorizontal: 10,
    },
    musclePillsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
      marginBottom: 16,
    },
    musclePill: {
      backgroundColor: "rgba(255,255,255,0.18)",
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    musclePillText: {
      fontFamily: FONTS.medium,
      fontSize: 11,
      color: "#fff",
      textTransform: "capitalize",
    },
    startWorkoutBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: "#fff",
      borderRadius: 28,
      height: 48,
    },
    startWorkoutText: {
      fontFamily: FONTS.bold,
      fontSize: 15,
      color: "#1a1a1a",
    },
    completedBanner: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: "rgba(255,215,0,0.15)",
      borderRadius: 28,
      height: 48,
    },
    completedBannerText: {
      fontFamily: FONTS.bold,
      fontSize: 15,
      color: "#FFD700",
    },

    // Tip Card
    tipCard: {
      marginHorizontal: 20,
      height: 120,
      borderRadius: 18,
      overflow: "hidden",
      marginBottom: 14,
    },
    tipImage: {
      width: "100%",
      height: "100%",
      position: "absolute",
    },
    tipGradient: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      height: "100%",
    },
    tipContent: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      padding: 16,
      gap: 5,
    },
    tipBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
    },
    tipBadgeText: {
      fontFamily: FONTS.bold,
      fontSize: 10,
      color: "#FFD700",
      letterSpacing: 0.8,
      textTransform: "uppercase",
    },
    tipText: {
      fontFamily: FONTS.semiBold,
      fontSize: 13,
      color: "#fff",
      lineHeight: 18,
    },

    // Stats
    statsCard: {
      marginHorizontal: 20,
      backgroundColor: theme.background.darker,
      borderRadius: 18,
      paddingVertical: 16,
      paddingHorizontal: 10,
      marginBottom: 14,
    },
    statsInnerRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    statItem: {
      flex: 1,
      alignItems: "center",
      gap: 2,
    },
    statDivider: {
      width: StyleSheet.hairlineWidth,
      height: 28,
      backgroundColor: "rgba(0,0,0,0.1)",
    },
    statValue: {
      fontFamily: FONTS.bold,
      fontSize: 22,
    },
    statLabel: {
      fontFamily: FONTS.regular,
      fontSize: 11,
      color: theme.foreground.gray,
    },

    // No routine
    noRoutineCard: {
      marginHorizontal: 20,
      borderRadius: 20,
      backgroundColor: theme.background.darker,
      padding: 40,
      alignItems: "center",
      gap: 10,
      marginBottom: 20,
    },
    noRoutineText: {
      fontFamily: FONTS.medium,
      fontSize: 14,
      color: theme.foreground.gray,
      textAlign: "center",
    },
  });
}

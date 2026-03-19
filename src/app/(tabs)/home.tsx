import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { FONTS } from "../../constants/fonts";
import { Theme } from "../../constants/themes";
import { useActiveWorkout } from "../../contexts/ActiveWorkoutContext";
import { useTheme } from "../../contexts/ThemeContext";
import {
  getRecentWorkouts,
  getRoutineById,
  getScheduleForDate,
  getScheduleForDateRange,
  getUserById,
  Routine,
  ScheduledDay,
} from "../../data/mockData";
import {
  translateRoutineDescription,
  translateRoutineName,
} from "../../utils/exerciseTranslator";

const MY_USER_ID = "1";

const controlShadow = Platform.select({
  ios: {
    shadowColor: "#000000",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  android: { elevation: 6 },
  default: {},
});

function toISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getWeekDays(): { date: Date; iso: string; dayShort: string }[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((day + 6) % 7));

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return {
      date: d,
      iso: toISO(d),
      dayShort: d.toLocaleDateString("en", { weekday: "short" }).slice(0, 3),
    };
  });
}


// ── Main Component ───────────────────────────────────────────────────────────
export default function Home() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { startWorkout } = useActiveWorkout();

  const [todaySchedule, setTodaySchedule] = useState<ScheduledDay | undefined>();
  const [todayRoutine, setTodayRoutine] = useState<Routine | undefined>();
  const [weekSchedule, setWeekSchedule] = useState<ScheduledDay[]>([]);
  const [weeklyStats, setWeeklyStats] = useState({
    workoutsCompleted: 0,
    totalMinutes: 0,
    totalCalories: 0,
    weeklyGoal: 5,
  });

  const user = getUserById(MY_USER_ID);
  const styles = createStyles(theme);

  useFocusEffect(
    useCallback(() => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = toISO(today);

      // Today's schedule
      const sched = getScheduleForDate(todayISO, MY_USER_ID);
      setTodaySchedule(sched);
      if (sched?.routineId) {
        setTodayRoutine(getRoutineById(sched.routineId));
      } else {
        setTodayRoutine(undefined);
      }

      // This week's schedule
      const weekDays = getWeekDays();
      const weekStart = weekDays[0].iso;
      const weekEnd = weekDays[6].iso;
      const weekSched = getScheduleForDateRange(weekStart, weekEnd, MY_USER_ID);
      setWeekSchedule(weekSched);

      // Weekly stats
      const completed = weekSched.filter((s) => s.status === "completed").length;
      const recentWorkouts = getRecentWorkouts(MY_USER_ID, 7);
      const totalMins = recentWorkouts.reduce((sum, w) => sum + w.duration, 0);
      const totalCals = recentWorkouts.reduce(
        (sum, w) => sum + w.caloriesBurned,
        0,
      );

      setWeeklyStats({
        workoutsCompleted: completed,
        totalMinutes: totalMins,
        totalCalories: totalCals,
        weeklyGoal: 5,
      });
    }, []),
  );

  const handleStartWorkout = () => {
    if (todayRoutine) {
      startWorkout({
        id: `workout-${Date.now()}`,
        duration: 0,
        volume: 0,
        sets: 0,
        exercises: todayRoutine.exercises.map((ex, exIdx) => ({
          id: `entry-${Date.now()}-${exIdx}`,
          exerciseId: exIdx + 1,
          name: ex.name,
          muscles: [],
          equipment: [],
          sets: Array.from({ length: ex.sets }, (_, i) => ({
            id: `${ex.id}-set-${i}`,
            setNumber: i + 1,
            kg: "",
            reps: ex.reps,
            isCompleted: false,
          })),
          notes: ex.notes || "",
          addedAt: Date.now(),
        })),
      });
    }
  };

  const weekDays = getWeekDays();
  const todayISO = toISO(new Date());

  const goalPct = Math.round(
    (weeklyStats.workoutsCompleted / weeklyStats.weeklyGoal) * 100,
  );
  const activityPct = Math.min(
    Math.round((weeklyStats.totalMinutes / 300) * 100),
    100,
  );
  const calPct = Math.min(
    Math.round((weeklyStats.totalCalories / 3000) * 100),
    100,
  );

  return (
    <View style={styles.container}>
      {/* Header + Greeting */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image
            source={{ uri: user?.avatar }}
            style={styles.greetingAvatar}
          />
          <View>
            <Text style={styles.greetingText}>
              {t("home.hello")}, {user?.username}!
            </Text>
            <Text style={styles.greetingSubtext}>
              {t("home.letsGetMoving")}
            </Text>
          </View>
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.iconButton,
            pressed && { opacity: 0.7, transform: [{ scale: 0.92 }] },
          ]}
          onPress={() => router.navigate("/notifications" as any)}
        >
          <Ionicons
            name="notifications-outline"
            size={18}
            color={theme.foreground.white}
          />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }}
      >
        {/* ── Health Summary ─────────────────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Ionicons name="stats-chart" size={14} color={theme.primary.main} />
          <Text style={styles.sectionTitle}>{t("home.healthSummary")}</Text>
        </View>
        <View style={styles.statsList}>
          {/* Workouts */}
          <View style={styles.statRow}>
            <View style={[styles.statIconBox, { backgroundColor: theme.primary.main + "1A" }]}>
              <Ionicons name="barbell-outline" size={18} color={theme.primary.main} />
            </View>
            <View style={styles.statInfo}>
              <View style={styles.statTextRow}>
                <Text style={styles.statLabel}>{t("home.workouts")}</Text>
                <Text style={[styles.statValue, { color: theme.primary.main }]}>
                  {weeklyStats.workoutsCompleted}/{weeklyStats.weeklyGoal}
                </Text>
              </View>
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${Math.min(goalPct, 100)}%`, backgroundColor: theme.primary.main },
                  ]}
                />
              </View>
            </View>
          </View>

          {/* Calories */}
          <View style={styles.statRow}>
            <View style={[styles.statIconBox, { backgroundColor: "#FF6B351A" }]}>
              <Ionicons name="flame-outline" size={18} color="#FF6B35" />
            </View>
            <View style={styles.statInfo}>
              <View style={styles.statTextRow}>
                <Text style={styles.statLabel}>{t("home.calories")}</Text>
                <Text style={[styles.statValue, { color: "#FF6B35" }]}>
                  {weeklyStats.totalCalories}/3000
                </Text>
              </View>
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${Math.min(calPct, 100)}%`, backgroundColor: "#FF6B35" },
                  ]}
                />
              </View>
            </View>
          </View>

          {/* Activity */}
          <View style={styles.statRow}>
            <View style={[styles.statIconBox, { backgroundColor: "#4FC3F71A" }]}>
              <Ionicons name="time-outline" size={18} color="#4FC3F7" />
            </View>
            <View style={styles.statInfo}>
              <View style={styles.statTextRow}>
                <Text style={styles.statLabel}>{t("home.activity")}</Text>
                <Text style={[styles.statValue, { color: "#4FC3F7" }]}>
                  {weeklyStats.totalMinutes}/300 min
                </Text>
              </View>
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${Math.min(activityPct, 100)}%`, backgroundColor: "#4FC3F7" },
                  ]}
                />
              </View>
            </View>
          </View>
        </View>

        {/* ── Weekly Sessions ────────────────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Ionicons
            name="calendar-outline"
            size={18}
            color={theme.primary.main}
          />
          <Text style={styles.sectionTitle}>
            {t("home.weekSessions")}
          </Text>
        </View>
        <View style={styles.weekRow}>
          {weekDays.map((day) => {
            const sched = weekSchedule.find((s) => s.date === day.iso);
            const isToday = day.iso === todayISO;
            const isCompleted = sched?.status === "completed";
            const isScheduled = sched?.status === "scheduled";
            const isRest = sched?.status === "rest";
            const isMissed =
              !sched?.status &&
              day.iso < todayISO;

            let bgColor = theme.background.accent;
            let borderColor = "transparent";
            let iconName: keyof typeof Ionicons.glyphMap | null = null;
            let iconColor = theme.foreground.gray;

            if (isCompleted) {
              bgColor = "#4CAF50" + "33";
              borderColor = "#4CAF50";
              iconName = "checkmark";
              iconColor = "#4CAF50";
            } else if (isMissed) {
              bgColor = "#F4433633";
              borderColor = "#F44336";
              iconName = "close";
              iconColor = "#F44336";
            } else if (isToday && isScheduled) {
              bgColor = theme.primary.main + "22";
              borderColor = theme.primary.main;
            } else if (isRest) {
              bgColor = theme.background.accent;
            }

            return (
              <View key={day.iso} style={styles.weekDayCol}>
                <Text
                  style={[
                    styles.weekDayLabel,
                    isToday && { color: theme.primary.main },
                  ]}
                >
                  {day.dayShort}
                </Text>
                <View
                  style={[
                    styles.weekDayCircle,
                    {
                      backgroundColor: bgColor,
                      borderColor,
                      borderWidth: isToday || isCompleted || isMissed ? 2 : 1,
                    },
                    !isToday &&
                      !isCompleted &&
                      !isMissed && {
                        borderColor: "rgba(0,0,0,0.08)",
                      },
                  ]}
                >
                  {iconName ? (
                    <Ionicons name={iconName} size={16} color={iconColor} />
                  ) : (
                    <Text
                      style={[
                        styles.weekDayText,
                        isToday && { color: theme.primary.main },
                      ]}
                    >
                      {isRest || (!isScheduled && day.iso >= todayISO)
                        ? "-"
                        : day.date.getDate()}
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* ── Today's Workout Card ───────────────────────────────────── */}
        <View style={styles.workoutSectionHeader}>
          <Ionicons
            name="flash-outline"
            size={18}
            color={theme.primary.main}
          />
          <Text style={styles.workoutSectionTitle}>
            {todaySchedule?.status === "rest"
              ? t("home.restDay")
              : t("home.todaysWorkout")}
          </Text>
        </View>

        {todayRoutine && todaySchedule?.status !== "rest" ? (
          <Pressable
            style={({ pressed }) => [
              styles.workoutCard,
              pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
            ]}
            onPress={() => router.push("/schedule/" as any)}
          >

            <View style={styles.workoutCardContent}>
              <View style={{ flex: 1 }}>
                <Text style={styles.workoutCardTitle}>
                  {translateRoutineName(todayRoutine.name)}
                </Text>
                <Text style={styles.workoutCardDesc}>
                  {translateRoutineDescription(todayRoutine.description)}
                </Text>
                <View style={styles.workoutCardMeta}>
                  <View style={styles.workoutMetaItem}>
                    <Ionicons
                      name="barbell-outline"
                      size={14}
                      color={theme.foreground.gray}
                    />
                    <Text style={styles.workoutMetaText}>
                      {todayRoutine.exercises.length} {t("home.exercises")}
                    </Text>
                  </View>
                  <View style={styles.workoutMetaItem}>
                    <Ionicons
                      name="time-outline"
                      size={14}
                      color={theme.foreground.gray}
                    />
                    <Text style={styles.workoutMetaText}>
                      {todayRoutine.estimatedDuration} min
                    </Text>
                  </View>
                  <View style={styles.workoutMetaItem}>
                    <Ionicons
                      name="trophy-outline"
                      size={14}
                      color={theme.foreground.gray}
                    />
                    <Text style={styles.workoutMetaText}>
                      {todayRoutine.difficulty}
                    </Text>
                  </View>
                </View>
                {/* Muscle tags */}
                <View style={styles.muscleTags}>
                  {todayRoutine.targetMuscles.slice(0, 4).map((muscle) => (
                    <View key={muscle} style={styles.muscleTag}>
                      <Text style={styles.muscleTagText}>{muscle}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <View style={styles.workoutActions}>
                <Pressable
                  style={({ pressed }) => [
                    styles.detailsButton,
                    pressed && { opacity: 0.85, transform: [{ scale: 0.95 }] },
                  ]}
                  onPress={() => router.push("/schedule/" as any)}
                >
                  <Ionicons name="eye-outline" size={16} color={theme.primary.main} />
                  <Text style={styles.detailsButtonText}>
                    {t("home.viewDetails")}
                  </Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.startButton,
                    pressed && { opacity: 0.85, transform: [{ scale: 0.95 }] },
                  ]}
                  onPress={handleStartWorkout}
                >
                  <Ionicons name="play" size={20} color="#fff" />
                </Pressable>
              </View>
            </View>
          </Pressable>
        ) : (
          <View style={styles.restDayCard}>
            <Ionicons
              name="moon-outline"
              size={36}
              color={theme.primary.main}
            />
            <Text style={styles.restDayTitle}>{t("home.restDayTitle")}</Text>
            <Text style={styles.restDaySubtext}>
              {t("home.restDayMessage")}
            </Text>
          </View>
        )}
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
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingBottom: 12,
    },
    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    iconButton: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.background.accent,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(0,0,0,0.08)",
    },
    greetingAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 2,
      borderColor: theme.primary.main,
    },
    greetingText: {
      fontFamily: FONTS.bold,
      fontSize: 16,
      color: theme.foreground.white,
    },
    greetingSubtext: {
      fontFamily: FONTS.regular,
      fontSize: 11,
      color: theme.foreground.gray,
    },

    // Section headers
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingTop: 20,
      paddingBottom: 10,
      gap: 6,
    },
    sectionTitle: {
      fontFamily: FONTS.bold,
      fontSize: 12,
      color: theme.foreground.white,
      letterSpacing: 0.5,
      textTransform: "uppercase",
    },

    // Stats list
    statsList: {
      paddingHorizontal: 16,
      gap: 8,
    },
    statRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.background.accent,
      borderRadius: 12,
      padding: 12,
      gap: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(0,0,0,0.06)",
    },
    statIconBox: {
      width: 32,
      height: 32,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    statInfo: {
      flex: 1,
      gap: 4,
    },
    statTextRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    statLabel: {
      fontFamily: FONTS.medium,
      fontSize: 12,
      color: theme.foreground.white,
    },
    statValue: {
      fontFamily: FONTS.bold,
      fontSize: 12,
    },
    progressBarBg: {
      height: 4,
      borderRadius: 2,
      backgroundColor: "rgba(0,0,0,0.08)",
      overflow: "hidden",
    },
    progressBarFill: {
      height: 4,
      borderRadius: 2,
    },

    // Week row
    weekRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingBottom: 4,
    },
    weekDayCol: {
      alignItems: "center",
      gap: 4,
    },
    weekDayLabel: {
      fontFamily: FONTS.medium,
      fontSize: 10,
      color: theme.foreground.gray,
    },
    weekDayCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    weekDayText: {
      fontFamily: FONTS.semiBold,
      fontSize: 11,
      color: theme.foreground.gray,
    },

    // Workout section header (larger than compact sections above)
    workoutSectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingTop: 20,
      paddingBottom: 10,
      gap: 6,
    },
    workoutSectionTitle: {
      fontFamily: FONTS.bold,
      fontSize: 12,
      color: theme.foreground.white,
      letterSpacing: 0.5,
      textTransform: "uppercase",
    },

    // Workout card
    workoutCard: {
      marginHorizontal: 16,
      borderRadius: 14,
      backgroundColor: theme.background.accent,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: theme.primary.main + "33",
      ...controlShadow,
    },
    workoutCardContent: {
      padding: 14,
    },
    workoutCardTitle: {
      fontFamily: FONTS.bold,
      fontSize: 15,
      color: theme.foreground.white,
      textTransform: "uppercase",
    },
    workoutCardDesc: {
      fontFamily: FONTS.regular,
      fontSize: 12,
      color: theme.foreground.gray,
      marginTop: 4,
    },
    workoutCardMeta: {
      flexDirection: "row",
      gap: 12,
      marginTop: 8,
    },
    workoutMetaItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    workoutMetaText: {
      fontFamily: FONTS.medium,
      fontSize: 12,
      color: theme.foreground.gray,
    },
    muscleTags: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 4,
      marginTop: 8,
    },
    muscleTag: {
      backgroundColor: theme.primary.main + "1A",
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    muscleTagText: {
      fontFamily: FONTS.medium,
      fontSize: 10,
      color: theme.primary.main,
      textTransform: "capitalize",
    },
    workoutActions: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 12,
    },
    detailsButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      backgroundColor: theme.primary.main + "1A",
      height: 44,
      marginRight: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.primary.main + "40",
    },
    detailsButtonText: {
      fontFamily: FONTS.bold,
      fontSize: 13,
      color: theme.primary.main,
    },
    startButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.primary.main,
      alignItems: "center",
      justifyContent: "center",
    },

    // Rest day
    restDayCard: {
      marginHorizontal: 16,
      borderRadius: 14,
      backgroundColor: theme.background.accent,
      padding: 20,
      alignItems: "center",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(0,0,0,0.06)",
    },
    restDayTitle: {
      fontFamily: FONTS.bold,
      fontSize: 15,
      color: theme.foreground.white,
      marginTop: 8,
    },
    restDaySubtext: {
      fontFamily: FONTS.regular,
      fontSize: 13,
      color: theme.foreground.gray,
      marginTop: 6,
      textAlign: "center",
    },
  });
}

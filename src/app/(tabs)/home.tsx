import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Animated,
    Dimensions,
    Image,
    ImageBackground,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import AnimatedScreen from "../../components/ui/AnimatedScreen";
import AnimatedSection from "../../components/ui/AnimatedSection";
import ProModal from "../../components/ui/ProModal";
import { FONTS } from "../../constants/fonts";
import { Theme } from "../../constants/themes";
import { useActiveWorkout } from "../../contexts/ActiveWorkoutContext";
import { useAuth } from "../../contexts/AuthContext";
import { useHealth } from "../../contexts/HealthContext";
import { useNutrition } from "../../contexts/NutritionContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useGenderedImages } from "../../hooks/useGenderedImages";
import { api } from "../../services/api";
import { hasProEntitlement } from "../../services/googlePlayBilling";
import { ApiRoutine, mapRoutine } from "../../utils/routineMapper";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CHALLENGE_CARD_WIDTH = SCREEN_WIDTH * 0.78;

const DAY_LABELS_SHORT = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const WEEKDAY_OPTIONS = [
  { id: "monday", shortKey: "mon", index: 0 },
  { id: "tuesday", shortKey: "tue", index: 1 },
  { id: "wednesday", shortKey: "wed", index: 2 },
  { id: "thursday", shortKey: "thu", index: 3 },
  { id: "friday", shortKey: "fri", index: 4 },
  { id: "saturday", shortKey: "sat", index: 5 },
  { id: "sunday", shortKey: "sun", index: 6 },
] as const;
type WorkoutDayId = (typeof WEEKDAY_OPTIONS)[number]["id"];
const OBJECTIVE_KEY = "@hylift_home_weekly_objective";
const OBJECTIVE_DAYS_KEY = "@hylift_home_weekly_objective_days";
const WORKOUT_DAYS_KEY = "@hylift_workout_days";
const WORKOUT_REMINDER_KEY = "@hylift_workout_reminder";
const WORKOUT_REMINDER_TIME_KEY = "@hylift_workout_reminder_time";
const DISPLAY_NAME_KEY = "@hylift_display_name";

type HomeRoutineGroup = Record<string, Record<string, ApiRoutine>>;
type ScheduleAssignment = {
  day_of_week: number;
  is_rest_day: boolean;
  routine_id?: string | null;
};

const VALID_WORKOUT_DAY_IDS = new Set<string>(
  WEEKDAY_OPTIONS.map((day) => day.id),
);

function parseWorkoutDayIds(value: string | null): WorkoutDayId[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (day): day is WorkoutDayId =>
        typeof day === "string" && VALID_WORKOUT_DAY_IDS.has(day),
    );
  } catch {
    return [];
  }
}

function parseDayIndices(value: string | null): number[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6)
      .slice(0, 7);
  } catch {
    return [];
  }
}

function indicesToWorkoutDayIds(indices: number[]): WorkoutDayId[] {
  return WEEKDAY_OPTIONS.filter((day) => indices.includes(day.index)).map(
    (day) => day.id,
  );
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const CHIP_CYAN  = { face: "#0E7490", depth: "#075985", text: "#F0FDFF", border: "#67E8F9" };
const CHIP_GREEN = { face: "#16A34A", depth: "#14532D", text: "#F0FDF4", border: "#86EFAC" };
const CHIP_GRAY  = { face: "#1F2A37", depth: "#111827", text: "#6B7280", border: "#374151" };

function DayChip3D({
  shortLabel,
  dayOfMonth,
  isToday,
  isWorkoutDay,
  hasPlan,
}: {
  shortLabel: string;
  dayOfMonth: number;
  isToday: boolean;
  isWorkoutDay: boolean;
  hasPlan: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const depth = useRef(new Animated.Value(0)).current;

  const pressIn = () =>
    Animated.parallel([
      Animated.spring(scale, { toValue: 0.96, speed: 40, bounciness: 0, useNativeDriver: true }),
      Animated.spring(depth, { toValue: 4,  speed: 40, bounciness: 0, useNativeDriver: true }),
    ]).start();

  const pressOut = () =>
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, speed: 28, bounciness: 6, useNativeDriver: true }),
      Animated.spring(depth, { toValue: 0, speed: 26, bounciness: 6, useNativeDriver: true }),
    ]).start();

  const palette = !hasPlan ? CHIP_GRAY : isWorkoutDay ? CHIP_CYAN : CHIP_GREEN;

  return (
    <AnimatedPressable
      onPressIn={pressIn}
      onPressOut={pressOut}
      style={[
        chipStyles.shell,
        isToday && { borderColor: palette.border, borderWidth: 2 },
        { transform: [{ scale }] },
      ]}
    >
      <View style={[chipStyles.depthLayer, { backgroundColor: palette.depth }]}>
        <Animated.View
          style={[
            chipStyles.face,
            { backgroundColor: palette.face, transform: [{ translateY: depth }] },
          ]}
        >
          <Text style={[chipStyles.label, { color: palette.text }]}>{shortLabel}</Text>
          <Text style={[chipStyles.date, { color: palette.text }]}>{dayOfMonth}</Text>
          {isToday && <View style={[chipStyles.todayDot, { backgroundColor: palette.border }]} />}
        </Animated.View>
      </View>
    </AnimatedPressable>
  );
}

const chipStyles = StyleSheet.create({
  shell: {
    flex: 1,
    borderRadius: 13,
  },
  depthLayer: {
    borderRadius: 13,
    paddingBottom: 4,
    overflow: "hidden",
  },
  face: {
    borderRadius: 13,
    paddingVertical: 14,
    alignItems: "center",
    gap: 4,
  },
  label: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    textTransform: "capitalize",
  },
  date: {
    fontFamily: FONTS.extraBold,
    fontSize: 15,
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 1,
  },
});

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
  const { theme, themeType } = useTheme();
  const { t } = useTranslation();
  const { goals, todaySummary } = useNutrition();
  const { todaySteps, todayCaloriesBurned } = useHealth();
  const { user } = useAuth();
  const { startGuidedRoutine } = useActiveWorkout();
  const genderedImages = useGenderedImages();
  const [selectedBodyFocus, setSelectedBodyFocus] = useState(0);
  const [workoutDayIds, setWorkoutDayIds] = useState<WorkoutDayId[]>([]);
  const [scheduleAssignments, setScheduleAssignments] = useState<
    ScheduleAssignment[]
  >([]);
  const [userRoutines, setUserRoutines] = useState<ApiRoutine[]>([]);
  const [workoutRemindersEnabled, setWorkoutRemindersEnabled] =
    useState(false);
  const [workoutReminderTime, setWorkoutReminderTime] = useState("17:30");
  const [displayName, setDisplayName] = useState("");
  const [isProModalVisible, setIsProModalVisible] = useState(false);
  const [adminRoutines, setAdminRoutines] = useState<HomeRoutineGroup>({});
  const [isRestDayModalVisible, setIsRestDayModalVisible] = useState(false);

  const now = new Date();
  const todayDayIndex = (now.getDay() + 6) % 7; // Convert Sun=0 to Mon=0 based

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      const loadWeeklySetup = async () => {
        try {
          const [
            savedWorkoutDays,
            savedObjective,
            savedObjectiveDays,
            savedName,
            savedReminder,
            savedReminderTime,
          ] = await Promise.all([
            AsyncStorage.getItem(WORKOUT_DAYS_KEY),
            AsyncStorage.getItem(OBJECTIVE_KEY),
            AsyncStorage.getItem(OBJECTIVE_DAYS_KEY),
            AsyncStorage.getItem(DISPLAY_NAME_KEY),
            AsyncStorage.getItem(WORKOUT_REMINDER_KEY),
            AsyncStorage.getItem(WORKOUT_REMINDER_TIME_KEY),
          ]);
          if (isMounted && savedName) setDisplayName(savedName);
          if (isMounted && savedReminder !== null) {
            setWorkoutRemindersEnabled(savedReminder === "true");
          }
          if (isMounted && savedReminderTime) {
            setWorkoutReminderTime(savedReminderTime);
          }

          let nextWorkoutDayIds = parseWorkoutDayIds(savedWorkoutDays);
          if (nextWorkoutDayIds.length === 0) {
            nextWorkoutDayIds = indicesToWorkoutDayIds(
              parseDayIndices(savedObjectiveDays),
            );
          }
          if (nextWorkoutDayIds.length === 0) {
            const parsedObjective = Number(savedObjective);
            if (
              Number.isFinite(parsedObjective) &&
              parsedObjective >= 1 &&
              parsedObjective <= 7
            ) {
              const fallbackDays = Array.from(
                { length: parsedObjective },
                (_, offset) => (todayDayIndex + offset) % 7,
              );
              nextWorkoutDayIds = indicesToWorkoutDayIds(fallbackDays);
            }
          }

          if (isMounted) setWorkoutDayIds(nextWorkoutDayIds);
        } catch {
          // Keep the current setup when storage is unavailable.
        }

        try {
          const [scheduleRes, routinesRes] = await Promise.all([
            api.getSchedule(),
            api.getRoutines(),
          ]);
          if (!isMounted) return;

          const scheduleItems = Array.isArray(scheduleRes?.items)
            ? scheduleRes.items
            : [];
          setScheduleAssignments(
            scheduleItems.filter(
              (item: ScheduleAssignment) =>
                Number.isInteger(item.day_of_week) &&
                item.day_of_week >= 0 &&
                item.day_of_week <= 6,
            ),
          );
          setUserRoutines(Array.isArray(routinesRes) ? routinesRes : []);
        } catch (error) {
          console.warn("[Home] load weekly setup failed:", error);
        }
      };

      loadWeeklySetup();
      return () => {
        isMounted = false;
      };
    }, [todayDayIndex]),
  );

  useEffect(() => {
    let isMounted = true;

    const loadAdminRoutines = async () => {
      try {
        const res = (await api.getAdminRoutines()) as ApiRoutine[];
        if (!isMounted) return;

        const grouped = (res ?? []).reduce<HomeRoutineGroup>((acc, routine) => {
          const category = routine.category ?? "";
          const subCategory = routine.sub_category ?? "";
          if (!category || !subCategory) return acc;
          if (!acc[category]) acc[category] = {};
          acc[category][`${subCategory}:${routine.difficulty}`] = routine;
          return acc;
        }, {});

        setAdminRoutines(grouped);
      } catch (error) {
        console.warn("[Home] load admin routines failed:", error);
      }
    };

    loadAdminRoutines();
    return () => {
      isMounted = false;
    };
  }, []);

  const weekDays = useMemo(() => {
    const monday = new Date(now);
    monday.setHours(0, 0, 0, 0);
    monday.setDate(now.getDate() - todayDayIndex);

    return WEEKDAY_OPTIONS.map((weekday, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      return {
        id: weekday.id,
        index: weekday.index,
        shortLabel: t(
          `onboarding.workoutFrequency.shortDays.${weekday.shortKey}`,
          DAY_LABELS_SHORT[index],
        ),
        longLabel: t(`onboarding.workoutFrequency.days.${weekday.id}`),
        dayOfMonth: date.getDate(),
        isToday: index === todayDayIndex,
      };
    });
  }, [now, t, todayDayIndex]);

  const workoutDaySet = useMemo(() => new Set(workoutDayIds), [workoutDayIds]);

  const selectedWorkoutDays = useMemo(
    () => weekDays.filter((day) => workoutDaySet.has(day.id)),
    [weekDays, workoutDaySet],
  );

  const assignmentByDay = useMemo(() => {
    const map = new Map<number, ScheduleAssignment>();
    scheduleAssignments.forEach((assignment) => {
      if (!assignment.is_rest_day && assignment.routine_id) {
        map.set(assignment.day_of_week, assignment);
      }
    });
    return map;
  }, [scheduleAssignments]);

  const routineById = useMemo(() => {
    const map = new Map<string, ApiRoutine>();
    userRoutines.forEach((routine) => map.set(routine.id, routine));
    return map;
  }, [userRoutines]);

  const centeredDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const offset = i - 3;
      const date = new Date(now);
      date.setHours(0, 0, 0, 0);
      date.setDate(now.getDate() + offset);
      const dayIndex = (date.getDay() + 6) % 7;
      const weekday = WEEKDAY_OPTIONS[dayIndex];
      return {
        key: `${date.toISOString().slice(0, 10)}`,
        shortLabel: t(
          `onboarding.workoutFrequency.shortDays.${weekday.shortKey}`,
          DAY_LABELS_SHORT[dayIndex],
        ),
        dayOfMonth: date.getDate(),
        isToday: offset === 0,
        isWorkoutDay: workoutDaySet.has(weekday.id),
      };
    });
  }, [now, workoutDaySet, t]);

  const featuredWorkoutDay = useMemo(() => {
    if (selectedWorkoutDays.length === 0) return undefined;
    const todayWorkoutDay = selectedWorkoutDays.find(
      (day) => day.index === todayDayIndex,
    );
    if (todayWorkoutDay) return todayWorkoutDay;

    return (
      selectedWorkoutDays.find((day) => day.index > todayDayIndex) ??
      selectedWorkoutDays[0]
    );
  }, [selectedWorkoutDays, todayDayIndex]);

  const featuredRoutine = useMemo(() => {
    if (!featuredWorkoutDay) return undefined;
    const routineId = assignmentByDay.get(featuredWorkoutDay.index)?.routine_id;
    return routineId ? routineById.get(routineId) : undefined;
  }, [assignmentByDay, featuredWorkoutDay, routineById]);

  const todayWorkoutDay = useMemo(
    () => selectedWorkoutDays.find((d) => d.index === todayDayIndex),
    [selectedWorkoutDays, todayDayIndex],
  );
  const isTodayWorkoutDay = !!todayWorkoutDay;
  const todayRoutine = useMemo(() => {
    if (!todayWorkoutDay) return undefined;
    const routineId = assignmentByDay.get(todayWorkoutDay.index)?.routine_id;
    return routineId ? routineById.get(routineId) : undefined;
  }, [assignmentByDay, todayWorkoutDay, routineById]);

  const nextWorkoutDay = useMemo(() => {
    if (selectedWorkoutDays.length === 0) return undefined;
    return (
      selectedWorkoutDays.find((d) => d.index > todayDayIndex) ??
      selectedWorkoutDays[0]
    );
  }, [selectedWorkoutDays, todayDayIndex]);

  const styles = createStyles(theme);

  // ── Derived calorie data from contexts ─────────────────────────────────
  const caloriesConsumed = todaySummary.totalCalories;
  const caloriesBurned = todayCaloriesBurned;

  const macros = useMemo(
    () => ({
      protein: {
        current: todaySummary.totalProtein,
        goal: goals.proteinGoal,
        color: "#4A90D9",
      },
      carbs: {
        current: todaySummary.totalCarbs,
        goal: goals.carbsGoal,
        color: "#F5A623",
      },
      fat: {
        current: todaySummary.totalFat,
        goal: goals.fatGoal,
        color: "#ED6665",
      },
    }),
    [todaySummary, goals],
  );

  const bodyFocusOptions = [
    t("home.abs"),
    t("home.arm"),
    t("home.back"),
    t("home.leg"),
    t("home.shoulder"),
  ];

  const challengeRoutines = adminRoutines.challenge ?? {};
  const bodyFocusRoutines = adminRoutines.body_focus ?? {};
  const justForYouRoutines = adminRoutines.just_for_you ?? {};
  const stretchWarmUpRoutines = adminRoutines.stretch_warm_up ?? {};

  const handleStartRoutine = useCallback(
    (routine?: ApiRoutine) => {
      if (!routine) return;
      startGuidedRoutine(mapRoutine(routine));
      router.push("/workout-player" as any);
    },
    [router, startGuidedRoutine],
  );

  const handleSetupWorkoutDay = useCallback(
    (day: NonNullable<typeof featuredWorkoutDay>) => {
      router.push({
        pathname: "/create-routine",
        params: {
          fromWeekSetup: "1",
          dayOfWeek: String(day.index),
          dayLabel: day.longLabel,
        },
      } as any);
    },
    [router],
  );

  const challenges = [
    {
      routine: challengeRoutines["full_body:beginner"],
      days: challengeRoutines["full_body:beginner"]?.duration_days ?? 28,
      title: t("home.fullBodyChallenge"),
      desc: t("home.fullBodyChallengeDesc"),
      image: genderedImages.challenge[0],
      color: "#1565C0",
    },
    {
      routine: challengeRoutines["upper_body:intermediate"],
      days: challengeRoutines["upper_body:intermediate"]?.duration_days ?? 28,
      title: t("home.sculptUpperBody"),
      desc: t("home.sculptUpperBodyDesc"),
      image: genderedImages.challenge[1],
      color: "#2E7D9A",
    },
    {
      routine: challengeRoutines["lower_body:advanced"],
      days: challengeRoutines["lower_body:advanced"]?.duration_days ?? 21,
      title: t("home.lowerBodyBlast"),
      desc: t("home.lowerBodyBlastDesc"),
      image: genderedImages.challenge[2],
      color: themeType === "dark" ? "#C79A3B" : "#6A1B9A",
    },
  ];

  const selectedLabel = bodyFocusOptions[selectedBodyFocus];
  const selectedBodyFocusKey = ["abs", "arm", "back", "leg", "shoulder"][
    selectedBodyFocus
  ];

  const bodyFocusExercises = [
    {
      routine: bodyFocusRoutines[`${selectedBodyFocusKey}:beginner`],
      name: selectedLabel + " " + t("home.beginner"),
      duration: `${bodyFocusRoutines[`${selectedBodyFocusKey}:beginner`]?.estimated_duration ?? 15} mins`,
      exercises:
        bodyFocusRoutines[`${selectedBodyFocusKey}:beginner`]?.exercises
          ?.length ?? 16,
      difficulty: 1,
      image:
        genderedImages.bodyFocus[
          selectedBodyFocus % genderedImages.bodyFocus.length
        ],
    },
    {
      routine: bodyFocusRoutines[`${selectedBodyFocusKey}:intermediate`],
      name: selectedLabel + " " + t("home.intermediate"),
      duration: `${bodyFocusRoutines[`${selectedBodyFocusKey}:intermediate`]?.estimated_duration ?? 24} mins`,
      exercises:
        bodyFocusRoutines[`${selectedBodyFocusKey}:intermediate`]?.exercises
          ?.length ?? 21,
      difficulty: 2,
      image:
        genderedImages.bodyFocus[
          (selectedBodyFocus + 1) % genderedImages.bodyFocus.length
        ],
    },
    {
      routine: bodyFocusRoutines[`${selectedBodyFocusKey}:advanced`],
      name: selectedLabel + " " + t("home.advanced"),
      duration: `${bodyFocusRoutines[`${selectedBodyFocusKey}:advanced`]?.estimated_duration ?? 27} mins`,
      exercises:
        bodyFocusRoutines[`${selectedBodyFocusKey}:advanced`]?.exercises
          ?.length ?? 21,
      difficulty: 3,
      image:
        genderedImages.bodyFocus[
          (selectedBodyFocus + 2) % genderedImages.bodyFocus.length
        ],
    },
  ];

  const justForYouWorkouts = [
    {
      routine: justForYouRoutines["killer_chest:intermediate"],
      name: t("home.killerChestRoutine"),
      duration: `${justForYouRoutines["killer_chest:intermediate"]?.estimated_duration ?? 10} min`,
      level:
        justForYouRoutines["killer_chest:intermediate"]?.difficulty ===
        "beginner"
          ? t("home.beginner")
          : justForYouRoutines["killer_chest:intermediate"]?.difficulty ===
              "advanced"
            ? t("home.advanced")
            : t("home.intermediate"),
      image: genderedImages.bodyFocus[0],
    },
    {
      routine: justForYouRoutines["quick_abs:beginner"],
      name: t("home.sevenMinAbs"),
      duration: `${justForYouRoutines["quick_abs:beginner"]?.estimated_duration ?? 7} min`,
      level:
        justForYouRoutines["quick_abs:beginner"]?.difficulty === "advanced"
          ? t("home.advanced")
          : justForYouRoutines["quick_abs:beginner"]?.difficulty ===
              "intermediate"
            ? t("home.intermediate")
            : t("home.beginner"),
      image: genderedImages.bodyFocus[1],
    },
  ];

  const stretchWorkouts = [
    {
      routine: stretchWarmUpRoutines["sleepy_time:beginner"],
      name: t("home.sleepyTimeStretching"),
      image: genderedImages.bodyFocus[2],
    },
    {
      routine: stretchWarmUpRoutines["tabata_4min:intermediate"],
      name: t("home.fourMinTabata"),
      image: genderedImages.bodyFocus[3],
    },
    {
      routine: stretchWarmUpRoutines["morning_stretch:beginner"],
      name: t("home.morningStretch"),
      image: genderedImages.bodyFocus[0],
    },
  ];

  return (
    <AnimatedScreen style={styles.container}>
      <ProModal
        visible={isProModalVisible}
        onClose={() => setIsProModalVisible(false)}
      />
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
        <AnimatedSection delay={0}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{t("tabs.home")}</Text>
            <View style={styles.headerRight}>
              <Pressable
                style={({ pressed }) => [
                  styles.proBadge,
                  pressed && { opacity: 0.8 },
                ]}
                onPress={async () => {
                  if (!user?.id) return;
                  if (await hasProEntitlement(user.id)) return;
                  setIsProModalVisible(true);
                }}
              >
                <Ionicons name="diamond" size={13} color="#fff" />
                <Text style={styles.proBadgeText}>Pro</Text>
              </Pressable>
            </View>
          </View>
        </AnimatedSection>

        {/* ── Greeting ────────────────────────────────────────── */}
        <AnimatedSection delay={80}>
          <Text style={styles.greeting}>
            {(() => {
              const name =
                displayName ||
                (user?.user_metadata as { username?: string } | undefined)
                  ?.username ||
                user?.email?.split("@")[0] ||
                "";
              const greeting =
                now.getHours() < 18
                  ? t("home.goodMorning", "Good morning")
                  : t("home.goodEvening", "Good evening");
              return name ? `${greeting}, ${name}` : greeting;
            })()}
          </Text>
        </AnimatedSection>

        {/* ── Calorie Summary (Donut + Stats) ─────────────────────── */}
        {/* ── Résumé Santé (Bento Grid) ───────────────────────── */}
        <AnimatedSection delay={160}>
          <Text style={styles.sectionTitle}>
            {t("home.healthSummary", "RÉSUMÉ SANTÉ")}
          </Text>
        </AnimatedSection>
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
            const percent = Math.min(
              Math.round((item.value / item.goal) * 100),
              100,
            );
            return (
              <AnimatedSection key={index} delay={200 + index * 90} scale>
                <ImageBackground
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
                          <MaterialCommunityIcons
                            name={item.icon as any}
                            size={18}
                            color="#FFF"
                          />
                        ) : (
                          <Ionicons
                            name={item.icon as any}
                            size={18}
                            color="#FFF"
                          />
                        )}
                      </View>
                      <Text style={styles.healthTilePercent}>{percent}%</Text>
                    </View>
                    <Text style={styles.healthTileValue}>
                      {item.goal >= 10000
                        ? `${(item.value / 1000).toFixed(1)}k`
                        : Math.round(item.value)}
                    </Text>
                    <Text style={styles.healthTileLabel}>{item.label}</Text>
                    <Text style={styles.healthTileGoal}>
                      /{" "}
                      {item.goal >= 10000 ? `${item.goal / 1000}k` : item.goal}{" "}
                      {item.unit}
                    </Text>
                  </LinearGradient>
                </ImageBackground>
              </AnimatedSection>
            );
          })}
        </View>

        {/* Weekly workout sessions */}
        <AnimatedSection delay={560} scale>
          <View style={styles.weekSessionsCard}>
            <View style={styles.weekSessionsHeader}>
              <View style={styles.weekSessionsTitleBlock}>
                <Text style={styles.weekSessionsTitle}>
                  {t("home.weekSessions", "SEANCES DE LA SEMAINE")}
                </Text>
                <Text style={styles.weekObjectiveText}>
                  {selectedWorkoutDays.length > 0
                    ? t(
                        "home.objectiveOption",
                        "{{count}} x semaine",
                        { count: selectedWorkoutDays.length },
                      )
                    : t("home.noWorkoutDaysTitle", "Choose workout days")}
                </Text>
              </View>
              <Pressable
                style={({ pressed }) => [
                  styles.weekSettingsBtn,
                  pressed && { opacity: 0.85 },
                ]}
                onPress={() => router.push("/objective")}
                accessibilityRole="button"
                accessibilityLabel={t(
                  "home.configureWeek",
                  "Configure workout week",
                )}
              >
                <Ionicons
                  name="settings-outline"
                  size={19}
                  color={theme.primary.main}
                />
              </Pressable>
            </View>

            {/* Day chips row — today always centred */}
            <View style={styles.weekChipsRow}>
              {centeredDays.map((day) => (
                <DayChip3D
                  key={day.key}
                  shortLabel={day.shortLabel}
                  dayOfMonth={day.dayOfMonth}
                  isToday={day.isToday}
                  isWorkoutDay={day.isWorkoutDay}
                  hasPlan={selectedWorkoutDays.length > 0}
                />
              ))}
            </View>

            {/* Legend */}
            <View style={styles.chipLegendRow}>
              <View style={styles.chipLegendItem}>
                <View style={[styles.chipLegendDot, { backgroundColor: CHIP_CYAN.face }]} />
                <Text style={styles.chipLegendText}>
                  {t("home.workoutDay", "Séance")}
                </Text>
              </View>
              <View style={styles.chipLegendItem}>
                <View style={[styles.chipLegendDot, { backgroundColor: CHIP_GREEN.face }]} />
                <Text style={styles.chipLegendText}>
                  {t("home.restDay", "Repos")}
                </Text>
              </View>
            </View>

            {selectedWorkoutDays.length === 0 ? (
              /* ── No days configured ── */
              <Pressable
                style={({ pressed }) => [
                  styles.nextWorkoutCard,
                  pressed && { opacity: 0.95, transform: [{ scale: 0.98 }] },
                ]}
                onPress={() => router.push("/objective")}
              >
                <Image
                  source={genderedImages.nextWorkout}
                  style={styles.nextWorkoutImage}
                  resizeMode="cover"
                />
                <LinearGradient
                  colors={["rgba(0,0,0,0.12)", "rgba(0,0,0,0.78)"]}
                  style={styles.nextWorkoutGradient}
                />
                <View style={styles.nextWorkoutContent}>
                  <View style={styles.nextWorkoutInfo}>
                    <Text style={styles.nextWorkoutName}>
                      {t("home.noWorkoutDaysTitle", "Choose workout days")}
                    </Text>
                    <Text style={styles.nextWorkoutMeta}>
                      {t(
                        "home.noWorkoutDaysMessage",
                        "Pick the days you train so your week can be planned.",
                      )}
                    </Text>
                  </View>
                  <View style={styles.nextWorkoutBtn}>
                    <Text style={styles.nextWorkoutBtnText}>
                      {t("home.chooseDays", "Choose")}
                    </Text>
                  </View>
                </View>
              </Pressable>
            ) : isTodayWorkoutDay ? (
              /* ── Today is a workout day ── */
              <Pressable
                style={({ pressed }) => [
                  styles.nextWorkoutCard,
                  pressed && { opacity: 0.95, transform: [{ scale: 0.98 }] },
                ]}
                onPress={() =>
                  todayRoutine
                    ? handleStartRoutine(todayRoutine)
                    : handleSetupWorkoutDay(todayWorkoutDay!)
                }
              >
                <Image
                  source={genderedImages.nextWorkout}
                  style={styles.nextWorkoutImage}
                  resizeMode="cover"
                />
                <LinearGradient
                  colors={["rgba(0,0,0,0.12)", "rgba(0,0,0,0.78)"]}
                  style={styles.nextWorkoutGradient}
                />
                <View style={styles.nextWorkoutContent}>
                  <View style={styles.nextWorkoutInfo}>
                    <Text style={styles.nextWorkoutName} numberOfLines={2}>
                      {todayRoutine?.name ??
                        t("home.setupDayRoutine", "{{day}} workout", {
                          day: todayWorkoutDay!.longLabel,
                        })}
                    </Text>
                    <View style={styles.sessionDetails}>
                      <View style={styles.sessionTag}>
                        <Ionicons
                          name="barbell-outline"
                          size={12}
                          color="rgba(255,255,255,0.82)"
                        />
                        <Text style={styles.sessionTagText} numberOfLines={1}>
                          {todayRoutine
                            ? `${todayRoutine.exercises?.length ?? 0} ${t("home.exercises")}`
                            : t("home.addExercisesToRoutine", "Add exercises, save, and keep the day ready.")}
                        </Text>
                      </View>
                      <View style={styles.sessionTag}>
                        <Ionicons
                          name="time-outline"
                          size={12}
                          color="rgba(255,255,255,0.82)"
                        />
                        <Text style={styles.sessionTagText} numberOfLines={1}>
                          {todayRoutine
                            ? `${todayWorkoutDay!.longLabel} · ${todayRoutine.estimated_duration ?? 0} min`
                            : t("home.needsRoutine", "Needs routine")}
                        </Text>
                      </View>
                      <View style={styles.sessionTag}>
                        <Ionicons
                          name="alarm-outline"
                          size={12}
                          color="rgba(255,255,255,0.82)"
                        />
                        <Text style={styles.sessionTagText} numberOfLines={1}>
                          {workoutRemindersEnabled
                            ? t("home.reminderAt", "Reminder {{time}}", { time: workoutReminderTime })
                            : t("home.remindersOff", "Reminders off")}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.nextWorkoutBtn}>
                    <Text style={styles.nextWorkoutBtnText}>
                      {todayRoutine
                        ? t("home.start", "Démarrer")
                        : t("home.setupRoutine", "Configurer")}
                    </Text>
                  </View>
                </View>
              </Pressable>
            ) : (
              /* ── Today is a rest day ── */
              <Pressable
                style={({ pressed }) => [
                  styles.nextWorkoutCard,
                  styles.restDayCard,
                  pressed && { opacity: 0.95, transform: [{ scale: 0.98 }] },
                ]}
                onPress={() => setIsRestDayModalVisible(true)}
              >
                <LinearGradient
                  colors={["#0F2027", "#1A3A4A", "#0D1F2D"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                {/* decorative orbs */}
                <View style={styles.restOrb1} />
                <View style={styles.restOrb2} />

                <View style={styles.restDayContent}>
                  {/* top row: moon + text */}
                  <View style={styles.restDayLeft}>
                    <View style={styles.restMoonWrap}>
                      <Text style={styles.restMoonEmoji}>🌙</Text>
                    </View>
                    <View style={{ gap: 4, maxWidth: "65%" }}>
                      <Text style={styles.restDayTitle}>
                        {t("home.restDay", "Jour de repos")}
                      </Text>
                      <Text style={styles.restDaySubtitle}>
                        {t("home.restDayMessage", "Récupération & bien-être")}
                      </Text>
                      {nextWorkoutDay && (
                        <View style={styles.nextWorkoutTag}>
                          <Ionicons name="calendar-outline" size={11} color="#67E8F9" />
                          <Text style={styles.nextWorkoutTagText}>
                            {t("home.nextWorkout", "Prochain : {{day}}", {
                              day: nextWorkoutDay.longLabel,
                            })}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                  {/* Voir button pinned bottom-right */}
                  <View style={styles.restDayBtn}>
                    <Text style={styles.restDayBtnText}>
                      {t("home.seeMore", "Voir")}
                    </Text>
                  </View>
                </View>
              </Pressable>
            )}

          </View>
        </AnimatedSection>

        {/* ── Challenge Section ───────────────────────────────────── */}
        <AnimatedSection delay={640}>
          <Text style={styles.sectionTitle}>{t("home.challenge")}</Text>
        </AnimatedSection>
        <AnimatedSection delay={700} direction="left" offset={40}>
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
                    onPress={() => handleStartRoutine(challenge.routine)}
                  >
                    <Text style={styles.challengeStartText}>
                      {t("home.start").toUpperCase()}
                    </Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </ScrollView>
        </AnimatedSection>

        {/* ── Body Focus Section ──────────────────────────────────── */}
        <AnimatedSection delay={780}>
          <Text style={styles.sectionTitle}>{t("home.bodyFocus")}</Text>
        </AnimatedSection>

        {/* Filter Chips */}
        <AnimatedSection delay={840} direction="left" offset={30}>
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
        </AnimatedSection>

        {/* Exercise List */}
        <View style={styles.exerciseList}>
          {bodyFocusExercises.map((exercise, index) => (
            <AnimatedSection
              key={index}
              delay={900 + index * 70}
              direction="left"
              offset={30}
            >
              <Pressable
                style={({ pressed }) => [
                  styles.exerciseRow,
                  pressed && { opacity: 0.8 },
                ]}
                onPress={() => handleStartRoutine(exercise.routine)}
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
            </AnimatedSection>
          ))}
        </View>

        {/* ── Custom Workout Section ──────────────────────────────── */}
        <AnimatedSection delay={1100}>
          <Text style={styles.sectionTitle}>{t("home.customWorkout")}</Text>
        </AnimatedSection>
        <AnimatedSection delay={1160} scale>
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
        </AnimatedSection>

        {/* ── Just For You Section ─────────────────────────────────── */}
        <AnimatedSection delay={1240}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>{t("home.justForYou")}</Text>
          </View>
        </AnimatedSection>
        <View style={styles.justForYouList}>
          {justForYouWorkouts.map((workout, index) => (
            <AnimatedSection
              key={index}
              delay={1300 + index * 70}
              direction="left"
              offset={30}
            >
              <Pressable
                style={({ pressed }) => [
                  styles.justForYouRow,
                  pressed && { opacity: 0.8 },
                  !workout.routine && { opacity: 0.6 },
                ]}
                onPress={() => handleStartRoutine(workout.routine)}
                disabled={!workout.routine}
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

                <Ionicons
                  name="flame"
                  size={22}
                  color="#FF6B35"
                  style={{ marginLeft: "auto" }}
                />
              </Pressable>
            </AnimatedSection>
          ))}
        </View>

        {/* ── Stretch & Warm Up Section ────────────────────────────── */}
        <AnimatedSection delay={1460}>
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
        </AnimatedSection>
        <AnimatedSection delay={1520} direction="left" offset={40}>
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
                  !workout.routine && { opacity: 0.6 },
                ]}
                onPress={() => handleStartRoutine(workout.routine)}
                disabled={!workout.routine}
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
        </AnimatedSection>
      </ScrollView>

      {/* ── Rest Day Modal ──────────────────────────────────────── */}
      <Modal
        visible={isRestDayModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsRestDayModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setIsRestDayModalVisible(false)}
        >
          <Pressable style={styles.restModal} onPress={() => {}}>
            <LinearGradient
              colors={["#0F2027", "#1B3A4B"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.restModalOrb} />

            <Text style={styles.restModalEmoji}>🌙</Text>
            <Text style={styles.restModalTitle}>
              {t("home.restDayModalTitle", "Aujourd'hui, c'est repos !")}
            </Text>
            <Text style={styles.restModalBody}>
              {t(
                "home.restDayModalBody",
                "La récupération est aussi importante que l'entraînement. Profitez de cette journée pour vous hydrater, vous étirer et recharger vos batteries.",
              )}
            </Text>

            {nextWorkoutDay && (
              <View style={styles.restModalNextCard}>
                <Ionicons name="calendar-outline" size={16} color="#67E8F9" />
                <Text style={styles.restModalNextText}>
                  {t("home.nextWorkoutOn", "Prochaine séance : {{day}}", {
                    day: nextWorkoutDay.longLabel,
                  })}
                </Text>
              </View>
            )}

            <Pressable
              style={({ pressed }) => [
                styles.restModalBtn,
                pressed && { opacity: 0.88, transform: [{ scale: 0.97 }] },
              ]}
              onPress={() => setIsRestDayModalVisible(false)}
            >
              <Text style={styles.restModalBtnText}>
                {t("home.gotIt", "Compris !")}
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </AnimatedScreen>
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
    weekSessionsTitleBlock: {
      flex: 1,
      gap: 4,
    },
    weekSessionsTitle: {
      fontFamily: FONTS.extraBold,
      fontSize: 16,
      color: theme.foreground.white,
      letterSpacing: 0.5,
      textTransform: "uppercase",
      lineHeight: 20,
    },
    weekObjectiveText: {
      fontFamily: FONTS.semiBold,
      fontSize: 11,
      color: theme.foreground.gray,
      textTransform: "uppercase",
    },
    weekSettingsBtn: {
      width: 38,
      height: 38,
      borderWidth: 1,
      borderColor: theme.primary.main,
      backgroundColor: theme.primary.main + "12",
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
    },
    weekChipsRow: {
      flexDirection: "row",
      gap: 5,
      marginBottom: 10,
    },
    chipLegendRow: {
      flexDirection: "row",
      gap: 16,
      marginBottom: 16,
    },
    chipLegendItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    chipLegendDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    chipLegendText: {
      fontFamily: FONTS.medium,
      fontSize: 11,
      color: theme.foreground.gray,
    },
    // ── Next Workout Card ─────────────────────
    nextWorkoutCard: {
      height: 174,
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
    sessionDetails: {
      gap: 4,
      marginTop: 4,
    },
    sessionTag: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
    },
    sessionTagText: {
      fontFamily: FONTS.medium,
      fontSize: 11,
      color: "rgba(255,255,255,0.8)",
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
    greeting: {
      fontFamily: FONTS.bold,
      fontSize: 22,
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

    // ── Rest Day Card ─────────────────────────
    restDayCard: {
      borderColor: "rgba(103,232,249,0.25)",
    },
    restOrb1: {
      position: "absolute",
      width: 180,
      height: 180,
      borderRadius: 90,
      backgroundColor: "rgba(14,116,144,0.18)",
      top: -60,
      right: -40,
    },
    restOrb2: {
      position: "absolute",
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: "rgba(103,232,249,0.08)",
      bottom: -40,
      left: -20,
    },
    restDayContent: {
      flex: 1,
      flexDirection: "column",
      justifyContent: "space-between",
      padding: 16,
    },
    restDayLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
    },
    restMoonWrap: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: "rgba(103,232,249,0.12)",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: "rgba(103,232,249,0.25)",
    },
    restMoonEmoji: {
      fontSize: 26,
    },
    restDayTitle: {
      fontFamily: FONTS.extraBold,
      fontSize: 17,
      color: "#F0FDFF",
    },
    restDaySubtitle: {
      fontFamily: FONTS.medium,
      fontSize: 12,
      color: "#FFFFFF",
    },
    nextWorkoutTag: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginTop: 2,
    },
    nextWorkoutTagText: {
      fontFamily: FONTS.semiBold,
      fontSize: 11,
      color: "#67E8F9",
    },
    restDayBtn: {
      position: "absolute",
      bottom: 16,
      right: 16,
      backgroundColor: "rgba(103,232,249,0.15)",
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: "rgba(103,232,249,0.35)",
    },
    restDayBtnText: {
      fontFamily: FONTS.bold,
      fontSize: 13,
      color: "#67E8F9",
    },

    // ── Rest Day Modal ────────────────────────
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.65)",
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
    },
    restModal: {
      width: "100%",
      borderRadius: 28,
      overflow: "hidden",
      padding: 28,
      alignItems: "center",
      gap: 12,
      borderWidth: 1,
      borderColor: "rgba(103,232,249,0.2)",
    },
    restModalOrb: {
      position: "absolute",
      width: 220,
      height: 220,
      borderRadius: 110,
      backgroundColor: "rgba(14,116,144,0.22)",
      top: -80,
      right: -60,
    },
    restModalEmoji: {
      fontSize: 52,
      marginBottom: 4,
    },
    restModalTitle: {
      fontFamily: FONTS.extraBold,
      fontSize: 22,
      color: "#F0FDFF",
      textAlign: "center",
    },
    restModalBody: {
      fontFamily: FONTS.regular,
      fontSize: 14,
      color: "rgba(186,244,255,0.8)",
      textAlign: "center",
      lineHeight: 21,
      marginTop: 4,
    },
    restModalNextCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: "rgba(103,232,249,0.10)",
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: "rgba(103,232,249,0.25)",
      marginTop: 4,
      alignSelf: "stretch",
    },
    restModalNextText: {
      fontFamily: FONTS.semiBold,
      fontSize: 13,
      color: "#67E8F9",
    },
    restModalBtn: {
      marginTop: 8,
      backgroundColor: "#0E7490",
      borderRadius: 22,
      paddingHorizontal: 36,
      paddingVertical: 14,
      borderWidth: 1,
      borderColor: "rgba(103,232,249,0.4)",
    },
    restModalBtnText: {
      fontFamily: FONTS.extraBold,
      fontSize: 15,
      color: "#F0FDFF",
    },
  });
}

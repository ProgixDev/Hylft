import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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

const DISPLAY_NAME_KEY = "@hylift_display_name";
const HOME_CAROUSEL_ROUTINES_KEY = "@hylift_home_carousel_routines";

const DAY_LABELS_SHORT = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const DAY_SHORT_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

const CHIP_GREEN = { face: "#16A34A", text: "#F0FDF4", border: "#86EFAC" };
const CHIP_RED = { face: "#DC2626", text: "#FEF2F2", border: "#FCA5A5" };
const CHIP_GRAY = { face: "#374151", text: "#D1D5DB", border: "#6B7280" };

type DayState = "trained" | "missed" | "future";

function WeekDayChip({
  shortLabel,
  dayOfMonth,
  isToday,
  state,
}: {
  shortLabel: string;
  dayOfMonth: number;
  isToday: boolean;
  state: DayState;
}) {
  const palette =
    state === "trained" ? CHIP_GREEN : state === "missed" ? CHIP_RED : CHIP_GRAY;
  return (
    <View
      style={[
        weekChipStyles.shell,
        { backgroundColor: palette.face },
        isToday && { borderColor: palette.border, borderWidth: 2 },
      ]}
    >
      <Text style={[weekChipStyles.label, { color: palette.text }]}>
        {shortLabel}
      </Text>
      <Text style={[weekChipStyles.date, { color: palette.text }]}>
        {dayOfMonth}
      </Text>
      {isToday && (
        <View
          style={[weekChipStyles.todayDot, { backgroundColor: palette.border }]}
        />
      )}
    </View>
  );
}

const weekChipStyles = StyleSheet.create({
  shell: {
    flex: 1,
    borderRadius: 13,
    paddingVertical: 12,
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

type HomeRoutineGroup = Record<string, Record<string, ApiRoutine>>;

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
  const {
    todaySteps,
    todayCaloriesBurned,
    todayManualCalories,
    todayActiveMinutes,
    refreshToday: refreshHealthToday,
  } = useHealth();
  const { user } = useAuth();
  const { startGuidedRoutine } = useActiveWorkout();
  const genderedImages = useGenderedImages();
  const [selectedBodyFocus, setSelectedBodyFocus] = useState(0);
  const [userRoutines, setUserRoutines] = useState<ApiRoutine[]>([]);
  const [carouselRoutineIds, setCarouselRoutineIds] = useState<string[]>([]);
  const [isRoutinePickerVisible, setIsRoutinePickerVisible] = useState(false);
  const [trainedDayKeys, setTrainedDayKeys] = useState<Set<string>>(
    () => new Set(),
  );
  const [displayName, setDisplayName] = useState("");
  const [isProModalVisible, setIsProModalVisible] = useState(false);
  const [adminRoutines, setAdminRoutines] = useState<HomeRoutineGroup>({});

  const now = new Date();

  // Refresh today's health KPIs whenever the home tab gains focus
  useFocusEffect(
    useCallback(() => {
      void refreshHealthToday();
    }, [refreshHealthToday]),
  );

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      const loadHome = async () => {
        try {
          const [savedName, savedCarousel] = await Promise.all([
            AsyncStorage.getItem(DISPLAY_NAME_KEY),
            AsyncStorage.getItem(HOME_CAROUSEL_ROUTINES_KEY),
          ]);
          if (isMounted && savedName) setDisplayName(savedName);
          if (isMounted && savedCarousel) {
            try {
              const parsed = JSON.parse(savedCarousel);
              if (Array.isArray(parsed)) {
                setCarouselRoutineIds(
                  parsed.filter((v): v is string => typeof v === "string"),
                );
              }
            } catch {
              // ignore
            }
          }
        } catch {
          // ignore
        }

        try {
          const routinesRes = await api.getRoutines();
          if (!isMounted) return;
          setUserRoutines(Array.isArray(routinesRes) ? routinesRes : []);
        } catch (error) {
          console.warn("[Home] load routines failed:", error);
        }

        try {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const start = new Date(today);
          start.setDate(today.getDate() - 6);
          const end = new Date(today);
          const startStr = start.toISOString().slice(0, 10);
          const endStr = end.toISOString().slice(0, 10);
          const res = await api.getWorkoutsRange(startStr, endStr);
          if (!isMounted) return;
          const list = Array.isArray(res)
            ? res
            : Array.isArray((res as any)?.items)
              ? (res as any).items
              : [];
          const keys = new Set<string>();
          for (const w of list as Array<{ date?: string }>) {
            if (typeof w.date === "string" && w.date.length >= 10) {
              keys.add(w.date.slice(0, 10));
            }
          }
          setTrainedDayKeys(keys);
        } catch (error) {
          console.warn("[Home] load workouts range failed:", error);
        }
      };

      loadHome();
      return () => {
        isMounted = false;
      };
    }, []),
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

  const routineById = useMemo(() => {
    const map = new Map<string, ApiRoutine>();
    userRoutines.forEach((routine) => map.set(routine.id, routine));
    return map;
  }, [userRoutines]);

  const todayKey = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.toISOString().slice(0, 10);
  }, []);

  const centeredDays = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Array.from({ length: 7 }, (_, i) => {
      const offset = i - 3;
      const date = new Date(today);
      date.setDate(today.getDate() + offset);
      const dayIdx = (date.getDay() + 6) % 7;
      const key = date.toISOString().slice(0, 10);
      const isFuture = key > todayKey;
      const isToday = key === todayKey;
      const state: DayState =
        isFuture || isToday
          ? "future"
          : trainedDayKeys.has(key)
            ? "trained"
            : "missed";
      return {
        key,
        shortLabel: t(
          `onboarding.workoutFrequency.shortDays.${DAY_SHORT_KEYS[dayIdx]}`,
          DAY_LABELS_SHORT[dayIdx],
        ),
        dayOfMonth: date.getDate(),
        isToday,
        state,
      };
    });
  }, [todayKey, trainedDayKeys, t]);

  const carouselRoutines = useMemo(
    () =>
      carouselRoutineIds
        .map((id) => routineById.get(id))
        .filter((r): r is ApiRoutine => !!r),
    [carouselRoutineIds, routineById],
  );

  const persistCarouselRoutineIds = useCallback(async (ids: string[]) => {
    setCarouselRoutineIds(ids);
    try {
      await AsyncStorage.setItem(
        HOME_CAROUSEL_ROUTINES_KEY,
        JSON.stringify(ids),
      );
    } catch {
      // ignore
    }
  }, []);

  const toggleCarouselRoutine = useCallback(
    (routineId: string) => {
      const next = carouselRoutineIds.includes(routineId)
        ? carouselRoutineIds.filter((id) => id !== routineId)
        : [...carouselRoutineIds, routineId];
      void persistCarouselRoutineIds(next);
    },
    [carouselRoutineIds, persistCarouselRoutineIds],
  );

  const styles = createStyles(theme);

  // ── Derived calorie data from contexts ─────────────────────────────────
  const caloriesConsumed = todaySummary.totalCalories;
  // Combine HC/HK reading with manual workout calories. If HC/HK already
  // captured the workout (often the case on Android Health Connect since the
  // workout was logged via the API), it will return the larger value, so
  // taking the max avoids double counting.
  const caloriesBurned = Math.max(todayCaloriesBurned, todayManualCalories);

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

        {/* Weekly training overview */}
        <AnimatedSection delay={100} scale>
          <View style={styles.weekOverviewCard}>
            <Text style={styles.weekOverviewTitle}>
              {t("home.weekOverview", "SEANCES DE LA SEMAINE")}
            </Text>
            <View style={styles.weekChipsRow}>
              {centeredDays.map((day) => (
                <WeekDayChip
                  key={day.key}
                  shortLabel={day.shortLabel}
                  dayOfMonth={day.dayOfMonth}
                  isToday={day.isToday}
                  state={day.state}
                />
              ))}
            </View>
            <View style={styles.weekLegendRow}>
              <View style={styles.weekLegendItem}>
                <View
                  style={[
                    styles.weekLegendDot,
                    { backgroundColor: CHIP_GREEN.face },
                  ]}
                />
                <Text style={styles.weekLegendText}>
                  {t("home.legendTrained", "Séance")}
                </Text>
              </View>
              <View style={styles.weekLegendItem}>
                <View
                  style={[
                    styles.weekLegendDot,
                    { backgroundColor: CHIP_RED.face },
                  ]}
                />
                <Text style={styles.weekLegendText}>
                  {t("home.legendMissed", "Manquée")}
                </Text>
              </View>
              <View style={styles.weekLegendItem}>
                <View
                  style={[
                    styles.weekLegendDot,
                    { backgroundColor: CHIP_GRAY.face },
                  ]}
                />
                <Text style={styles.weekLegendText}>
                  {t("home.legendUpcoming", "À venir")}
                </Text>
              </View>
            </View>
          </View>
        </AnimatedSection>

        {/* My sessions carousel */}
        <AnimatedSection delay={120} scale>
          <View style={styles.weekSessionsCard}>
            <View style={styles.weekSessionsHeader}>
              <View style={styles.weekSessionsTitleBlock}>
                <Text style={styles.weekSessionsTitle}>
                  {t("home.mySessions", "MES SEANCES")}
                </Text>
                <Text style={styles.weekObjectiveText}>
                  {t("home.sessionsCount", "{{count}} séance(s)", {
                    count: carouselRoutines.length,
                  })}
                </Text>
              </View>
              <Pressable
                style={({ pressed }) => [
                  styles.weekSettingsBtn,
                  pressed && { opacity: 0.85 },
                ]}
                onPress={() => setIsRoutinePickerVisible(true)}
                accessibilityRole="button"
                accessibilityLabel={t(
                  "home.configureSessions",
                  "Configure sessions",
                )}
              >
                <Ionicons
                  name="settings-outline"
                  size={19}
                  color={theme.primary.main}
                />
              </Pressable>
            </View>

            {carouselRoutines.length === 0 ? (
              <Pressable
                style={({ pressed }) => [
                  styles.nextWorkoutCard,
                  pressed && { opacity: 0.95, transform: [{ scale: 0.98 }] },
                ]}
                onPress={() => setIsRoutinePickerVisible(true)}
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
                      {t("home.noSessionsTitle", "Choose your sessions")}
                    </Text>
                    <Text style={styles.nextWorkoutMeta}>
                      {t(
                        "home.noSessionsMessage",
                        "Pick the routines you want to see here.",
                      )}
                    </Text>
                  </View>
                  <View style={styles.nextWorkoutBtn}>
                    <Text style={styles.nextWorkoutBtnText}>
                      {t("home.chooseSessions", "Choose")}
                    </Text>
                  </View>
                </View>
              </Pressable>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToInterval={CHALLENGE_CARD_WIDTH + 12}
                decelerationRate="fast"
                contentContainerStyle={{ gap: 12, paddingRight: 8 }}
              >
                {carouselRoutines.map((routine) => (
                  <Pressable
                    key={routine.id}
                    style={({ pressed }) => [
                      styles.nextWorkoutCard,
                      styles.carouselCard,
                      pressed && {
                        opacity: 0.95,
                        transform: [{ scale: 0.98 }],
                      },
                    ]}
                    onPress={() => handleStartRoutine(routine)}
                  >
                    <Image
                      source={
                        routine.wallpaper_url
                          ? { uri: routine.wallpaper_url }
                          : genderedImages.nextWorkout
                      }
                      style={styles.nextWorkoutImage}
                      resizeMode="cover"
                    />
                    <LinearGradient
                      colors={["rgba(0,0,0,0.12)", "rgba(0,0,0,0.78)"]}
                      style={styles.nextWorkoutGradient}
                    />
                    <View style={styles.nextWorkoutContent}>
                      <View style={styles.nextWorkoutInfo}>
                        <Text
                          style={styles.nextWorkoutName}
                          numberOfLines={2}
                        >
                          {routine.name}
                        </Text>
                        <View style={styles.sessionDetails}>
                          <View style={styles.sessionTag}>
                            <Ionicons
                              name="barbell-outline"
                              size={12}
                              color="rgba(255,255,255,0.82)"
                            />
                            <Text
                              style={styles.sessionTagText}
                              numberOfLines={1}
                            >
                              {`${routine.exercises?.length ?? 0} ${t("home.exercises")}`}
                            </Text>
                          </View>
                          {(routine.estimated_duration ?? 0) > 0 && (
                            <View style={styles.sessionTag}>
                              <Ionicons
                                name="time-outline"
                                size={12}
                                color="rgba(255,255,255,0.82)"
                              />
                              <Text
                                style={styles.sessionTagText}
                                numberOfLines={1}
                              >
                                {`${routine.estimated_duration} min`}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                      <View style={styles.nextWorkoutBtn}>
                        <Text style={styles.nextWorkoutBtnText}>
                          {t("home.start", "Démarrer")}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </View>
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
              value: todayActiveMinutes,
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
                      {item.unit === ""
                        ? Math.round(item.value).toLocaleString()
                        : Number.isInteger(item.value)
                          ? Math.round(item.value)
                          : item.value.toFixed(1)}
                    </Text>
                    <Text style={styles.healthTileLabel}>{item.label}</Text>
                    <Text style={styles.healthTileGoal}>
                      /{" "}
                      {item.unit === ""
                        ? item.goal.toLocaleString()
                        : item.goal}{" "}
                      {item.unit}
                    </Text>
                  </LinearGradient>
                </ImageBackground>
              </AnimatedSection>
            );
          })}
        </View>
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

      {/* ── Routine picker for home carousel ──────────────────────── */}
      <Modal
        visible={isRoutinePickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsRoutinePickerVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setIsRoutinePickerVisible(false)}
        >
          <Pressable style={styles.routinePickerModal} onPress={() => {}}>
            <Text style={styles.routinePickerTitle}>
              {t("home.pickSessions", "Sélectionner les séances")}
            </Text>
            <Text style={styles.routinePickerSubtitle}>
              {t(
                "home.pickSessionsHint",
                "Choisis les séances à afficher dans le carrousel de l'accueil.",
              )}
            </Text>
            {userRoutines.length === 0 ? (
              <View style={styles.routinePickerEmpty}>
                <Text style={styles.routinePickerEmptyText}>
                  {t(
                    "home.noRoutinesYet",
                    "Vous n'avez pas encore de séances. Créez-en une depuis l'onglet Entraînement.",
                  )}
                </Text>
              </View>
            ) : (
              <ScrollView style={{ maxHeight: 360 }}>
                {userRoutines.map((routine) => {
                  const checked = carouselRoutineIds.includes(routine.id);
                  return (
                    <Pressable
                      key={routine.id}
                      style={({ pressed }) => [
                        styles.routinePickerRow,
                        checked && styles.routinePickerRowChecked,
                        pressed && { opacity: 0.85 },
                      ]}
                      onPress={() => toggleCarouselRoutine(routine.id)}
                    >
                      <View style={{ flex: 1 }}>
                        <Text
                          style={styles.routinePickerRowText}
                          numberOfLines={1}
                        >
                          {routine.name}
                        </Text>
                        <Text
                          style={styles.routinePickerRowMeta}
                          numberOfLines={1}
                        >
                          {`${routine.exercises?.length ?? 0} ${t("home.exercises")}`}
                        </Text>
                      </View>
                      <Ionicons
                        name={checked ? "checkbox" : "square-outline"}
                        size={22}
                        color={checked ? theme.primary.main : theme.foreground.gray}
                      />
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}
            <Pressable
              style={({ pressed }) => [
                styles.routinePickerCloseBtn,
                pressed && { opacity: 0.88 },
              ]}
              onPress={() => setIsRoutinePickerVisible(false)}
            >
              <Text style={styles.routinePickerCloseBtnText}>
                {t("common.done", "Terminé")}
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
    weekChipsRow: {
      flexDirection: "row",
      gap: 5,
      marginBottom: 10,
    },
    weekOverviewCard: {
      marginHorizontal: 20,
      backgroundColor: theme.background.darker,
      borderRadius: 20,
      padding: 18,
      marginBottom: 14,
    },
    weekOverviewTitle: {
      fontFamily: FONTS.extraBold,
      fontSize: 16,
      color: theme.foreground.white,
      letterSpacing: 0.5,
      textTransform: "uppercase",
      marginBottom: 14,
    },
    weekLegendRow: {
      flexDirection: "row",
      gap: 16,
      marginTop: 4,
      flexWrap: "wrap",
    },
    weekLegendItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    weekLegendDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    weekLegendText: {
      fontFamily: FONTS.medium,
      fontSize: 11,
      color: theme.foreground.gray,
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
    nextWorkoutContentColumn: {
      flex: 1,
      flexDirection: "column",
      justifyContent: "flex-end",
      padding: 14,
      gap: 10,
    },
    nextWorkoutActionsRow: {
      flexDirection: "row",
      gap: 8,
      alignItems: "center",
    },
    customizeWeekBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      backgroundColor: "rgba(255,255,255,0.12)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.4)",
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    customizeWeekBtnText: {
      fontFamily: FONTS.bold,
      fontSize: 12,
      color: "#fff",
      letterSpacing: 0.3,
    },
    startWorkoutBtn: {
      backgroundColor: theme.primary.main,
      borderRadius: 20,
      paddingHorizontal: 20,
      paddingVertical: 10,
      alignItems: "center",
      justifyContent: "center",
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
      padding: 10,
      borderRadius: 18,
    },
    healthTileTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    healthTileIcon: {
      width: 30,
      height: 30,
      borderRadius: 10,
      backgroundColor: "rgba(255,255,255,0.25)",
      justifyContent: "center",
      alignItems: "center",
    },
    healthTilePercent: {
      fontFamily: FONTS.bold,
      fontSize: 12,
      color: "rgba(255,255,255,0.9)",
    },
    healthTileValue: {
      fontFamily: FONTS.extraBold,
      fontSize: 20,
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
    weekSettingsBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.background.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    carouselCard: {
      width: CHALLENGE_CARD_WIDTH,
      borderWidth: 0,
    },
    sessionDetails: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
      marginTop: 6,
    },
    sessionTag: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: "rgba(255,255,255,0.12)",
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
    },
    sessionTagText: {
      fontFamily: FONTS.medium,
      fontSize: 11,
      color: "rgba(255,255,255,0.9)",
    },
    routinePickerModal: {
      width: "88%",
      backgroundColor: theme.background.darker,
      borderRadius: 20,
      padding: 22,
      gap: 12,
    },
    routinePickerTitle: {
      fontFamily: FONTS.extraBold,
      fontSize: 18,
      color: theme.foreground.white,
    },
    routinePickerSubtitle: {
      fontFamily: FONTS.regular,
      fontSize: 13,
      color: theme.foreground.gray,
      marginBottom: 4,
    },
    routinePickerEmpty: {
      paddingVertical: 24,
      alignItems: "center",
    },
    routinePickerEmptyText: {
      fontFamily: FONTS.regular,
      fontSize: 13,
      color: theme.foreground.gray,
      textAlign: "center",
    },
    routinePickerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingHorizontal: 12,
      paddingVertical: 12,
      borderRadius: 12,
      marginBottom: 6,
      backgroundColor: theme.background.accent + "60",
    },
    routinePickerRowChecked: {
      backgroundColor: theme.primary.main + "1F",
    },
    routinePickerRowText: {
      fontFamily: FONTS.bold,
      fontSize: 14,
      color: theme.foreground.white,
    },
    routinePickerRowMeta: {
      fontFamily: FONTS.regular,
      fontSize: 11,
      color: theme.foreground.gray,
      marginTop: 2,
    },
    routinePickerCloseBtn: {
      backgroundColor: theme.primary.main,
      borderRadius: 14,
      paddingVertical: 12,
      alignItems: "center",
      marginTop: 6,
    },
    routinePickerCloseBtnText: {
      fontFamily: FONTS.bold,
      fontSize: 14,
      color: "#fff",
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
      backgroundColor: "rgba(103,232,249,0.15)",
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: "rgba(103,232,249,0.35)",
    },
    restDayActionsRow: {
      position: "absolute",
      bottom: 16,
      right: 16,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    restCustomizeBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: "rgba(103,232,249,0.15)",
      borderWidth: 1,
      borderColor: "rgba(103,232,249,0.35)",
      alignItems: "center",
      justifyContent: "center",
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

import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dimensions,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Text } from "../../components/ui/ScaledText";
import { BarChart, LineChart } from "react-native-gifted-charts";
import Svg, { Circle } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AnimatedScreen from "../../components/ui/AnimatedScreen";
import SegmentedTabs from "../../components/ui/SegmentedTabs";
import AvatarActionSheet from "../../components/profile/AvatarActionSheet";
import CoverPickerModal from "../../components/profile/CoverPickerModal";
import ProfileHeader from "../../components/profile/ProfileHeader";
import ShareProfileModal from "../../components/profile/ShareProfileModal";
import { FONTS } from "../../constants/fonts";
import { Theme } from "../../constants/themes";
import { useAuth } from "../../contexts/AuthContext";
import { useHealth } from "../../contexts/HealthContext";
import { useNutrition } from "../../contexts/NutritionContext";
import { useTheme } from "../../contexts/ThemeContext";
import { HealthService, type DailySteps, type DailyCaloriesBurned } from "../../services/healthService";
import { api } from "../../services/api";
import {
  DEFAULT_USER_STATS,
  getProfileCache,
  setProfileCache,
  type MyProfile,
  type UserStats,
} from "../../services/preloadCache";
import { pickAndUploadAvatar } from "../../services/avatarUploader";
import { WeightEntry, WeightHistory } from "../../services/weightHistory";
import { Shimmer } from "../../components/ui/PostSkeleton";
import { BodyMeasurements } from "../../services/bodyMeasurements";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const KEYS = {
  weight: "@hylift_food_weight_current",
  targetWeight: "@hylift_food_weight_target",
  height: "@hylift_height",
  age: "@hylift_age",
  gender: "@hylift_gender",
  fitnessGoals: "@hylift_fitness_goals",
  displayName: "@hylift_display_name",
  goal: "@hylift_goal",
};

type Period = "weekly" | "monthly" | "3months" | "6months";

function toLocalDateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getLocalMonday(d: Date): Date {
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = date.getDay();
  const diff = (day + 6) % 7; // 0 for Mon, 1 for Tue, ..., 6 for Sun
  date.setDate(date.getDate() - diff);
  return date;
}

function computeNiceYMax(maxVal: number, sections: number = 3, minDefault: number = 60): number {
  if (maxVal <= 0) return minDefault;
  // Give ~15% headroom above the highest bar so tooltips fit comfortably
  const target = maxVal * 1.15;
  const rawStep = target / sections;

  const mag = Math.pow(10, Math.floor(Math.log10(Math.max(1, rawStep))));
  const norm = rawStep / mag;

  const steps = [1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 6, 7.5, 8, 10];
  let chosenMult = 10;
  for (const s of steps) {
    if (norm <= s) {
      chosenMult = s;
      break;
    }
  }
  const cleanStep = chosenMult * mag;
  const result = Math.round(cleanStep * sections);
  return Math.max(result, minDefault);
}

function computePeriodBars({
  period,
  dateMap,
  isFr,
  primaryColor,
  mutedColor,
  labelColor = "#8E8E93",
  todayValue = 0,
  minDefault = 60,
}: {
  period: "weekly" | "monthly" | "3months" | "6months";
  dateMap: Record<string, number>;
  isFr: boolean;
  primaryColor: string;
  mutedColor: string;
  labelColor?: string;
  todayValue?: number;
  minDefault?: number;
}) {
  const now = new Date();

  if (period === "weekly") {
    const dayLabels = isFr
      ? ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]
      : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const todayIdx = (now.getDay() + 6) % 7;
    const monday = getLocalMonday(now);
    const bars = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
      const dStr = toLocalDateString(d);
      const isToday = i === todayIdx;
      const isFuture = i > todayIdx;
      const val = isFuture ? 0 : Math.round(dateMap[dStr] || (isToday ? todayValue : 0));
      const dateFormatted = d.toLocaleDateString(isFr ? "fr-FR" : "en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      bars.push({
        value: val,
        label: dayLabels[i],
        labelComponent: () => (
          <View style={{ width: 40, marginLeft: -12, alignItems: "center" }}>
            <Text style={{ fontSize: 10, fontFamily: FONTS.semiBold, color: labelColor }}>
              {dayLabels[i]}
            </Text>
          </View>
        ),
        frontColor: isToday ? primaryColor : (val > 0 ? primaryColor : mutedColor),
        dateFormatted,
        isToday,
      });
    }
    const total = bars.reduce((s, b) => s + b.value, 0);
    const average = Math.round(total / (todayIdx + 1));
    const maxVal = Math.max(...bars.map((d) => d.value), 0);
    const maxValue = computeNiceYMax(maxVal, 3, minDefault);
    return {
      bars,
      total,
      average,
      maxValue,
      barWidth: 16,
      spacing: 22,
      initialSpacing: 18,
      isWeek: true,
      periodLabel: isFr ? "Cette semaine" : "This week",
    };
  }

  if (period === "monthly") {
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayDate = now.getDate();
    const bars = [];
    let totalAll = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day);
      const dStr = toLocalDateString(d);
      const isToday = day === todayDate;
      const isFuture = day > todayDate;
      const val = isFuture ? 0 : Math.round(dateMap[dStr] || (isToday ? todayValue : 0));
      totalAll += val;

      const dateFormatted = d.toLocaleDateString(isFr ? "fr-FR" : "en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      // Show clear milestone numbers: 1, 7, 14, 21, 28
      const showLabel = day === 1 || day === 7 || day === 14 || day === 21 || day === 28;

      bars.push({
        value: val,
        label: showLabel ? String(day) : "",
        labelWidth: showLabel ? 26 : 0,
        labelComponent: showLabel ? () => (
          <View style={{ width: 30, marginLeft: -13, alignItems: "center" }}>
            <Text style={{ fontSize: 10, fontFamily: FONTS.semiBold, color: labelColor }}>
              {String(day)}
            </Text>
          </View>
        ) : undefined,
        frontColor: isToday ? primaryColor : (val > 0 ? primaryColor : mutedColor),
        dateFormatted,
        isToday,
      });
    }

    const average = Math.round(totalAll / Math.max(1, todayDate));
    const maxVal = Math.max(...bars.map((d) => d.value), 0);
    const maxValue = computeNiceYMax(maxVal, 3, minDefault);
    return {
      bars,
      total: totalAll,
      average,
      maxValue,
      barWidth: 4,
      spacing: 4.5,
      initialSpacing: 8,
      isWeek: false,
      periodLabel: isFr ? "Ce mois-ci" : "This month",
    };
  }

  if (period === "3months" || period === "6months") {
    const numMonths = period === "3months" ? 3 : 6;
    const monthsFr = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
    const monthsEn = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthNames = isFr ? monthsFr : monthsEn;

    const barWidth = numMonths === 3 ? 20 : 14;
    const spacing = numMonths === 3 ? 65 : 28;
    const initialSpacing = numMonths === 3 ? 42 : 18;

    const bars = [];
    let totalAll = 0;
    let totalDays = 0;

    for (let m = numMonths - 1; m >= 0; m--) {
      const targetMonthDate = new Date(now.getFullYear(), now.getMonth() - m, 1);
      const year = targetMonthDate.getFullYear();
      const month = targetMonthDate.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const isCurrentMonth = m === 0;
      const daysCount = isCurrentMonth ? now.getDate() : daysInMonth;

      let monthSum = 0;
      for (let day = 1; day <= daysCount; day++) {
        const d = new Date(year, month, day);
        const dStr = toLocalDateString(d);
        const isToday = isCurrentMonth && day === now.getDate();
        const val = dateMap[dStr] || (isToday ? todayValue : 0);
        monthSum += val;
      }

      totalAll += monthSum;
      totalDays += daysCount;
      const monthAvg = Math.round(monthSum / Math.max(1, daysCount));
      const dateFormatted = targetMonthDate.toLocaleDateString(isFr ? "fr-FR" : "en-US", {
        month: "long",
        year: "numeric",
      });

      bars.push({
        value: monthAvg,
        label: monthNames[month],
        labelComponent: () => (
          <View style={{ width: 50, marginLeft: -(50 - barWidth) / 2, alignItems: "center" }}>
            <Text style={{ fontSize: 10, fontFamily: FONTS.semiBold, color: labelColor }}>
              {monthNames[month]}
            </Text>
          </View>
        ),
        frontColor: isCurrentMonth ? primaryColor : (monthAvg > 0 ? primaryColor : mutedColor),
        dateFormatted,
        isCurrentMonth,
      });
    }

    const average = Math.round(totalAll / Math.max(1, totalDays));
    const maxVal = Math.max(...bars.map((d) => d.value), 0);
    const maxValue = computeNiceYMax(maxVal, 3, minDefault);
    return {
      bars,
      total: totalAll,
      average,
      maxValue,
      barWidth,
      spacing,
      initialSpacing,
      isWeek: false,
      periodLabel: period === "3months" ? (isFr ? "3 derniers mois" : "Last 3 months") : (isFr ? "6 derniers mois" : "Last 6 months"),
    };
  }

  return { bars: [], total: 0, average: 0, maxValue: 100, barWidth: 26, spacing: 16, initialSpacing: 16, isWeek: true, periodLabel: "" };
}

function calcBMI(w: number, h: number) { return h > 0 ? w / ((h / 100) ** 2) : 0; }
function bmiInfo(bmi: number) {
  if (bmi < 18.5) return { label: "Insuffisant", color: "#4A90D9" };
  if (bmi < 25) return { label: "Normal", color: "#34C759" };
  if (bmi < 30) return { label: "Surpoids", color: "#F5A623" };
  return { label: "Obésité", color: "#ED6665" };
}
function calcBMR(w: number, h: number, age: number, g: string) {
  return g === "female" ? 10 * w + 6.25 * h - 5 * age - 161 : 10 * w + 6.25 * h - 5 * age + 5;
}

function getMacroPlanLabel(plan: string | null, isFr: boolean) {
  switch (plan) {
    case "high_protein":
      return isFr ? "Riche en protéines" : "High protein";
    case "low_carb":
      return isFr ? "Faible en glucides" : "Low carb";
    case "keto":
      return isFr ? "Cétogène" : "Keto";
    case "custom":
      return isFr ? "Personnalisé" : "Custom";
    case "balanced":
    default:
      return isFr ? "Par défaut" : "Default";
  }
}

// ── Ring component ─────────────────────────────────────────────────────────
function ProgressRing({ pct, size, color, strokeWidth = 6, children }: {
  pct: number; size: number; color: string; strokeWidth?: number; children?: React.ReactNode;
}) {
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const o = c * (1 - Math.min(pct, 1));
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.12)" strokeWidth={strokeWidth} fill="none" />
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={strokeWidth} fill="none"
          strokeLinecap="round" strokeDasharray={`${c}`} strokeDashoffset={o} rotation="-90" origin={`${size / 2}, ${size / 2}`} />
      </Svg>
      {children}
    </View>
  );
}

const NAVY_CARD = "#0A1628";
const NAVY_CARD_LIGHT = "#1A2F50";
const NAVY_CARD_DEEP = "#07101F";
const NAVY_TEXT_MUTED = "rgba(255,255,255,0.72)";
const NAVY_TEXT_SOFT = "rgba(255,255,255,0.55)";
const PERIOD_ACTIVE_NAVY = "#0A1628";

function buildPeriodItems(isFr: boolean): { value: Period; label: string }[] {
  return [
    { value: "weekly", label: isFr ? "Semaine" : "Week" },
    { value: "monthly", label: isFr ? "Mois" : "Month" },
    { value: "3months", label: isFr ? "3 mois" : "3 Months" },
    { value: "6months", label: isFr ? "6 mois" : "6 Months" },
  ];
}

// ═══════════════════════════════════════════════════════════════════════════

export default function Profile() {
  const { i18n } = useTranslation();
  const { theme, themeType } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const styles = createStyles(theme);
  const isFr = i18n.language?.startsWith("fr");
  const { user, userProfile, refreshUserProfile } = useAuth();
  const cachedForUser = getProfileCache(user?.id);
  const cachedProfile = cachedForUser?.profile ?? null;
  const cachedStats = cachedForUser?.stats ?? DEFAULT_USER_STATS;

  const [myProfile, setMyProfile] = useState<MyProfile | null>(cachedProfile);
  const [isProfileLoading, setIsProfileLoading] = useState(!cachedProfile);
  const [userStats, setUserStats] = useState<UserStats>(cachedStats);
  const hasLoadedProfileRef = useRef(!!cachedProfile);
  const [coverPickerOpen, setCoverPickerOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [avatarSheetOpen, setAvatarSheetOpen] = useState(false);

  const {
    todayCaloriesBurned,
    weeklyCaloriesBurned,
    todaySteps,
    weeklySteps,
    isAvailable: healthAvailable,
    isPermissionGranted: healthGranted,
    initialize: healthInitialize,
    requestPermissions: healthRequestPermissions,
    refreshData: healthRefreshData,
  } = useHealth();
  const { daily, goals: nutritionGoals, todaySummary } = useNutrition();
  const [healthBusy, setHealthBusy] = useState(false);

  // ── Period history states (for weekly, monthly, 3months, 6months) ──
  const [periodWorkouts, setPeriodWorkouts] = useState<any[]>([]);
  const [periodNutrition, setPeriodNutrition] = useState<any[]>([]);
  const [periodSteps, setPeriodSteps] = useState<DailySteps[]>([]);
  const [periodCaloriesBurned, setPeriodCaloriesBurned] = useState<DailyCaloriesBurned[]>([]);
  const [isPeriodLoading, setIsPeriodLoading] = useState(false);

  const handleConnectHealth = useCallback(async () => {
    if (healthBusy) return;
    setHealthBusy(true);
    try {
      let available = healthAvailable;
      if (!available) {
        available = await healthInitialize();
      }
      if (!available) return;
      const granted = healthGranted || (await healthRequestPermissions());
      if (granted) {
        await healthRefreshData();
      }
    } finally {
      setHealthBusy(false);
    }
  }, [
    healthBusy,
    healthAvailable,
    healthGranted,
    healthInitialize,
    healthRequestPermissions,
    healthRefreshData,
  ]);

  const [weight, setWeight] = useState(70);
  const [targetWeight, setTargetWeight] = useState(65);
  const [height, setHeight] = useState(175);
  const [age, setAge] = useState(25);
  const [gender, setGender] = useState("male");
  const [fitnessGoals, setFitnessGoals] = useState<string[]>([]);
  const [userGoal, setUserGoal] = useState("lose_weight");
  const [macroPlan, setMacroPlan] = useState<string | null>(null);
  const [dailyStepsGoal, setDailyStepsGoal] = useState<number>(10000);
  const [calorieGoal, setCalorieGoal] = useState<number>(2000);
  const [displayName, setDisplayName] = useState("");
  const [weightHistory, setWeightHistory] = useState<WeightEntry[]>([]);
  const [activityPeriod, setActivityPeriod] = useState<Period>("weekly");
  const [summaryMode, setSummaryMode] = useState<"total" | "average">("total");
  const [bodyMeasurements, setBodyMeasurements] = useState<Record<string, { value: number; date: string }[]>>({});
  const [progressionScore, setProgressionScore] = useState(0);
  const [dailyProgress, setDailyProgress] = useState<{
    progress_pct: number;
    steps: { value: number; goal: number; pct: number };
    calories: { value: number; goal: number; pct: number };
    water: { value: number; goal: number; pct: number };
    weight_delta: number | null;
  } | null>(null);

  const periodDateRange = useMemo(() => {
    const end = new Date();
    const start = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    if (activityPeriod === "weekly") {
      const day = end.getDay();
      start.setDate(end.getDate() - ((day + 6) % 7));
    } else if (activityPeriod === "monthly") {
      start.setMonth(start.getMonth() - 1);
    } else if (activityPeriod === "3months") {
      start.setMonth(start.getMonth() - 3);
    } else if (activityPeriod === "6months") {
      start.setMonth(start.getMonth() - 6);
    }
    const startStr = toLocalDateString(start);
    const endStr = toLocalDateString(end);
    return { start, end, startStr, endStr };
  }, [activityPeriod]);

  // Fetch period data (workouts, nutrition, steps, calories burned)
  useEffect(() => {
    let active = true;
    (async () => {
      setIsPeriodLoading(true);
      try {
        const { start, end, startStr, endStr } = periodDateRange;
        const [workoutsRes, nutritionRes, stepsRes, calsBurnedRes] = await Promise.all([
          api.getWorkoutsRange(startStr, endStr).catch((e) => {
            console.warn("[Profile] getWorkoutsRange:", e);
            return [];
          }),
          api.getAlimentationHistory(startStr, endStr).catch((e) => {
            console.warn("[Profile] getAlimentationHistory:", e);
            return [];
          }),
          healthGranted ? HealthService.getSteps(start, end).catch(() => []) : Promise.resolve([]),
          healthGranted ? HealthService.getCaloriesBurned(start, end).catch(() => []) : Promise.resolve([]),
        ]);

        if (!active) return;

        setPeriodWorkouts(Array.isArray(workoutsRes) ? workoutsRes : []);
        setPeriodNutrition(Array.isArray(nutritionRes) ? nutritionRes : []);
        setPeriodSteps(Array.isArray(stepsRes) ? stepsRes : []);
        setPeriodCaloriesBurned(Array.isArray(calsBurnedRes) ? calsBurnedRes : []);
      } catch (err) {
        console.warn("[Profile] Failed to load period metrics:", err);
      } finally {
        if (active) setIsPeriodLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [periodDateRange, healthGranted]);

  const loadProfileAndStats = useCallback(async () => {
    if (!user?.id) {
      setMyProfile(null);
      setUserStats(DEFAULT_USER_STATS);
      setIsProfileLoading(false);
      hasLoadedProfileRef.current = false;
      return;
    }

    const cached = getProfileCache(user.id);
    if (cached) {
      setMyProfile(cached.profile);
      setUserStats(cached.stats);
      hasLoadedProfileRef.current = true;
    }

    setIsProfileLoading(!hasLoadedProfileRef.current);
    try {
      const [prof, stats] = await Promise.all([
        api.getProfile() as Promise<MyProfile>,
        api.getUserStats(user.id) as Promise<UserStats>,
      ]);
      setProfileCache({ userId: user.id, profile: prof, stats });
      setMyProfile(prof);
      setUserStats(stats);
    } catch {
      // swallow; header will still render with defaults.
    } finally {
      hasLoadedProfileRef.current = true;
      setIsProfileLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadProfileAndStats();
    }, [loadProfileAndStats]),
  );

  const handleSelectCover = async (url: string) => {
    const updated = (await api.updateProfile({ cover_url: url })) as MyProfile;
    setMyProfile((p) => (p ? { ...p, cover_url: updated.cover_url } : updated));
  };

  const handleUploadAvatar = async (source: "library" | "camera") => {
    const publicUrl = await pickAndUploadAvatar(source);
    if (!publicUrl) return;
    const updated = (await api.updateProfile({
      avatar_url: publicUrl,
    })) as MyProfile;
    setMyProfile((p) =>
      p ? { ...p, avatar_url: updated.avatar_url } : updated,
    );
  };

  const handleRemoveAvatar = async () => {
    await api.deleteAvatar();
    setMyProfile((p) => (p ? { ...p, avatar_url: null } : p));
  };

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const [
          w,
          tw,
          h,
          a,
          g,
          fg,
          dn,
          wh,
          bm,
          ug,
          plan,
          steps,
          savedCal,
          altW,
          altTw,
        ] = await Promise.all([
          AsyncStorage.getItem(KEYS.weight),
          AsyncStorage.getItem(KEYS.targetWeight),
          AsyncStorage.getItem(KEYS.height),
          AsyncStorage.getItem(KEYS.age),
          AsyncStorage.getItem(KEYS.gender),
          AsyncStorage.getItem(KEYS.fitnessGoals),
          AsyncStorage.getItem(KEYS.displayName),
          WeightHistory.getLastDays(30),
          BodyMeasurements.getAll(),
          AsyncStorage.getItem(KEYS.goal),
          AsyncStorage.getItem("@hylift_macro_plan"),
          AsyncStorage.getItem("@hylift_daily_steps_goal"),
          AsyncStorage.getItem("@hylift_calorie_goal"),
          AsyncStorage.getItem("@hylift_weight"),
          AsyncStorage.getItem("@hylift_target_weight"),
        ]);
        const latestWeightFromHistory = wh.length > 0 ? wh[wh.length - 1].weight : null;
        const resolvedW = userProfile?.weight_kg ?? latestWeightFromHistory ?? (w ? Number(w) : null) ?? (altW ? Number(altW) : null);
        if (resolvedW != null && !isNaN(resolvedW) && resolvedW > 0) setWeight(resolvedW);
        const resolvedTw = userProfile?.target_weight_kg ?? (tw ? Number(tw) : null) ?? (altTw ? Number(altTw) : null);
        if (resolvedTw != null && !isNaN(resolvedTw) && resolvedTw > 0) setTargetWeight(resolvedTw);
        if (h) setHeight(Number(h) || 175);
        if (a) setAge(Number(a) || 25);
        if (g) setGender(g);
        if (fg) {
          try {
            setFitnessGoals(JSON.parse(fg));
          } catch {
            /* */
          }
        }
        if (dn) setDisplayName(dn);
        if (ug) setUserGoal(ug);
        if (plan) setMacroPlan(plan);
        if (steps) {
          const parsedSteps = parseInt(steps, 10);
          if (!isNaN(parsedSteps) && parsedSteps > 0) {
            setDailyStepsGoal(parsedSteps);
          }
        }
        if (savedCal) {
          const parsedCal = parseInt(savedCal, 10);
          if (!isNaN(parsedCal) && parsedCal > 0) {
            setCalorieGoal(parsedCal);
          }
        }
        setWeightHistory(wh);
        setBodyMeasurements(bm);
        // Fetch server-computed stats
        try {
          const [scoreRes, progressRes] = await Promise.all([
            api.getProgressionScore() as Promise<{ score: number }>,
            api.getDailyProgress(activityPeriod) as Promise<typeof dailyProgress>,
          ]);
          setProgressionScore(scoreRes.score);
          setDailyProgress(progressRes);
        } catch {
          /* fallback to defaults */
        }
      })();
    }, [activityPeriod, userProfile])
  );

  // Refetch daily progress when period changes
  useEffect(() => {
    (async () => {
      try {
        const res = await api.getDailyProgress(activityPeriod) as typeof dailyProgress;
        setDailyProgress(res);
      } catch { /* */ }
    })();
  }, [activityPeriod]);

  const displayedWeight = userProfile?.weight_kg ?? weight;
  const displayedTarget = userProfile?.target_weight_kg ?? targetWeight;

  const bmi = calcBMI(displayedWeight, height);
  const bmiData = bmiInfo(bmi);
  const bmr = calcBMR(displayedWeight, height, age, gender);

  // ── Weight delta + daily progress from server ──
  const weightDelta = dailyProgress?.weight_delta ?? null;
  const dailyProgressPct = dailyProgress?.progress_pct ?? 0;

  // ── Weight goal calculations ──
  const initialWeight =
    weightHistory.length > 0 ? weightHistory[0].weight : displayedWeight;
  const isGainGoal =
    displayedTarget > initialWeight ||
    userGoal === "gain_weight" ||
    (userGoal === "build_muscle" && displayedTarget > displayedWeight);
  const isGoalReached = isGainGoal
    ? displayedWeight >= displayedTarget
    : displayedWeight <= displayedTarget;
  const diffFromTarget = Math.abs(displayedWeight - displayedTarget);

  // ── Body measurements (latest values) ──
  const latestMeasurements = useMemo(() => {
    const keys = ["waist", "hips", "chest", "shoulders", "thigh", "arm"];
    const defaults: Record<string, number> = {
      waist: 80,
      hips: 50,
      chest: 30,
      shoulders: 45,
      thigh: 35,
      arm: 30,
    };
    const result: { id: string; value: number; date: string }[] = [];
    for (const k of keys) {
      const entries = bodyMeasurements[k];
      if (entries?.length) {
        result.push({ id: k, ...entries[entries.length - 1] });
      } else if (defaults[k] !== undefined) {
        result.push({
          id: k,
          value: defaults[k],
          date: new Date().toISOString().split("T")[0],
        });
      }
    }
    return result;
  }, [bodyMeasurements]);

  const bodyComposition = useMemo(() => ({
    bodyFat: bodyMeasurements.body_fat?.at(-1) ?? null,
    muscleMass: bodyMeasurements.muscle_mass?.at(-1) ?? null,
  }), [bodyMeasurements]);

  const scoreLabel = useMemo(() => {
    if (progressionScore >= 80) return isFr ? "Super travail !" : "Great work!";
    if (progressionScore >= 60) return isFr ? "Bien joué !" : "Well done!";
    if (progressionScore >= 40) return isFr ? "Continue !" : "Keep going!";
    if (progressionScore >= 20) return isFr ? "Bon début !" : "Good start!";
    return isFr ? "C'est parti !" : "Let's go!";
  }, [progressionScore, isFr]);

  const scoreColor = useMemo(() => {
    if (progressionScore >= 80) return "#34C759";
    if (progressionScore >= 60) return "#4A90D9";
    if (progressionScore >= 40) return "#F5A623";
    return "#ED6665";
  }, [progressionScore]);

  const dayLabels = isFr ? ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"] : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const todayIdx = (new Date().getDay() + 6) % 7;
  const stepsMetrics = useMemo(() => {
    const stepsMap: Record<string, number> = {};
    const sourceSteps = periodSteps.length > 0 ? periodSteps : weeklySteps;
    sourceSteps.forEach((s) => {
      const cleanDate = typeof s.date === "string" ? s.date.split("T")[0] : toLocalDateString(new Date(s.date));
      stepsMap[cleanDate] = (stepsMap[cleanDate] || 0) + s.count;
    });

    const result = computePeriodBars({
      period: activityPeriod,
      dateMap: stepsMap,
      isFr,
      primaryColor: theme.primary.main,
      mutedColor: `${theme.foreground.gray}40`,
      labelColor: theme.foreground.gray,
      todayValue: todaySteps,
      minDefault: 300,
    });

    return {
      ...result,
      chartData: result.bars,
    };
  }, [activityPeriod, periodSteps, weeklySteps, todaySteps, theme, isFr]);

  // ── Nutrition metrics (Daily bars in Week, Week avg bars in Month, Month avg bars in 3m/6m) ──
  const nutritionMetrics = useMemo(() => {
    const targetKcal = nutritionGoals?.calorieGoal || calorieGoal || 2000;
    const nutritionMap: Record<string, number> = {};
    periodNutrition.forEach((n) => {
      if (n.date) {
        const cleanDate = typeof n.date === "string" ? n.date.split("T")[0] : toLocalDateString(new Date(n.date));
        nutritionMap[cleanDate] = Number(n.calories) || 0;
      }
    });
    const todayStr = toLocalDateString(new Date());
    if (todaySummary?.totalCalories && !nutritionMap[todayStr]) {
      nutritionMap[todayStr] = todaySummary.totalCalories;
    }

    const result = computePeriodBars({
      period: activityPeriod,
      dateMap: nutritionMap,
      isFr,
      primaryColor: "#FF6B00",
      mutedColor: `${theme.foreground.gray}40`,
      labelColor: theme.foreground.gray,
      todayValue: todaySummary?.totalCalories || 0,
      minDefault: 150,
    });

    return {
      ...result,
      chartData: result.bars,
      targetKcal,
    };
  }, [activityPeriod, periodNutrition, todaySummary, theme, isFr, nutritionGoals, calorieGoal]);

  // ── Calories burned metrics (Daily bars in Week, Week avg bars in Month, Month avg bars in 3m/6m) ──
  const caloriesBurnedMetrics = useMemo(() => {
    const burnedMap: Record<string, number> = {};
    const sourceBurned = periodCaloriesBurned.length > 0 ? periodCaloriesBurned : weeklyCaloriesBurned;
    sourceBurned.forEach((b) => {
      const cleanDate = typeof b.date === "string" ? b.date.split("T")[0] : toLocalDateString(new Date(b.date));
      burnedMap[cleanDate] = (burnedMap[cleanDate] || 0) + b.totalCalories;
    });

    const result = computePeriodBars({
      period: activityPeriod,
      dateMap: burnedMap,
      isFr,
      primaryColor: "#F5A623",
      mutedColor: `${theme.foreground.gray}40`,
      labelColor: theme.foreground.gray,
      todayValue: todayCaloriesBurned,
      minDefault: 90,
    });

    return {
      ...result,
      chartData: result.bars,
    };
  }, [activityPeriod, periodCaloriesBurned, weeklyCaloriesBurned, todayCaloriesBurned, theme, isFr]);

  // ── Workouts & activity time metrics (counts, durations like 30min, 40min...) ──
  const workoutMetrics = useMemo(() => {
    const count = periodWorkouts.length;
    const totalMinutes = periodWorkouts.reduce((s, w) => s + (Number(w.duration_minutes) || 0), 0);
    const avgMinutes = count > 0 ? Math.round(totalMinutes / count) : 0;
    const totalHours = Math.floor(totalMinutes / 60);
    const remMins = totalMinutes % 60;
    const durationFormatted = totalHours > 0 ? `${totalHours}h ${remMins}m` : `${remMins} min`;

    const sortedWorkouts = [...periodWorkouts].sort((a, b) => (b.date || "").localeCompare(a.date || ""));

    return {
      count,
      totalMinutes,
      avgMinutes,
      durationFormatted,
      workouts: sortedWorkouts,
    };
  }, [periodWorkouts]);

  const totalBurned = caloriesBurnedMetrics.total;

  // Weight chart data — driven entirely by the real WeightHistory log and filtered by activityPeriod
  const weightChart = useMemo(() => {
    const sorted = [...weightHistory].sort((a, b) =>
      a.date.localeCompare(b.date),
    );
    const todayStr = new Date().toISOString().split("T")[0];
    if (displayedWeight > 0) {
      const lastEntry = sorted[sorted.length - 1];
      if (!lastEntry) {
        sorted.push({ date: todayStr, weight: displayedWeight });
      } else if (lastEntry.date === todayStr) {
        lastEntry.weight = displayedWeight;
      } else if (lastEntry.date < todayStr && lastEntry.weight !== displayedWeight) {
        sorted.push({ date: todayStr, weight: displayedWeight });
      }
    }

    const now = new Date();
    const cutoff = new Date(now);
    if (activityPeriod === "weekly") {
      cutoff.setDate(cutoff.getDate() - 7);
    } else if (activityPeriod === "monthly") {
      cutoff.setMonth(cutoff.getMonth() - 1);
    } else if (activityPeriod === "3months") {
      cutoff.setMonth(cutoff.getMonth() - 3);
    } else if (activityPeriod === "6months") {
      cutoff.setMonth(cutoff.getMonth() - 6);
    }
    const cutoffStr = cutoff.toISOString().split("T")[0];
    const filtered = sorted.filter((e) => e.date >= cutoffStr);
    const listToDisplay = filtered.length > 0 ? filtered : sorted.slice(-14);

    const fmt = (iso: string) => {
      const d = new Date(iso);
      return `${d.getDate()}/${d.getMonth() + 1}`;
    };
    return listToDisplay
      .map((e) => ({ value: e.weight, label: fmt(e.date) }));
  }, [weightHistory, displayedWeight, activityPeriod]);

  const weightChartBounds = useMemo(() => {
    const values = weightChart.map((p) => p.value);
    if (values.length === 0) return { min: 0, max: 100 };
    const lo = Math.min(...values, displayedTarget);
    const hi = Math.max(...values, displayedTarget);
    const pad = Math.max(1, (hi - lo) * 0.4);
    return { min: Math.floor(lo - pad), max: Math.ceil(hi + pad) };
  }, [weightChart, displayedTarget]);

  return (
    <AnimatedScreen style={styles.container}>
      {themeType === "female" && (
        <Image source={require("../../../assets/girly.png")} style={styles.bgOverlay} resizeMode="cover" />
      )}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 4, paddingBottom: Math.max(100, 24 + insets.bottom) }}>
        {isProfileLoading ? <ProfileSkeleton /> : (
          <>

        {/* ── Profile Header ─────────────────────────────────────── */}
        <ProfileHeader
          mode="self"
          coverUrl={myProfile?.cover_url ?? null}
          avatarUrl={myProfile?.avatar_url ?? null}
          displayName={
            myProfile?.display_name ||
            myProfile?.username ||
            displayName ||
            (isFr ? "Profil" : "Profile")
          }
          username={myProfile?.username ?? null}
          memberSinceIso={myProfile?.created_at ?? null}
          badge={null}
          stats={{
            posts: userStats.posts_count,
            followers: userStats.followers_count,
            likes: userStats.likes_count,
          }}
          locale={i18n.language}
          onSettingsPress={() => router.push("/settings" as any)}
          onAvatarPress={() => setAvatarSheetOpen(true)}
          onCoverPress={() => setCoverPickerOpen(true)}
          onPrimaryPress={() => router.push("/settings/edit-profile" as any)}
          onSecondaryPress={() => setShareOpen(true)}
        />

        {/* ── Activity Section ───────────────────────────────────── */}
        <Text style={styles.sectionTitle}>{isFr ? "Activité" : "Activity"}</Text>

        {/* Period tabs (iOS-style glass segmented control) */}
        <SegmentedTabs<Period>
          value={activityPeriod}
          onChange={setActivityPeriod}
          items={buildPeriodItems(!!isFr)}
          itemWidth={Math.min(84, Math.floor((SCREEN_WIDTH - 48) / 4))}
          theme={theme}
          themeType={themeType as "dark" | "light"}
        />

        {/* ── Weight Progress ──────────────────────────────────── */}
        <Text style={styles.sectionTitle}>{isFr ? "Évolution du poids" : "Weight Progress"}</Text>

        <View style={styles.chartCard}>
          <View style={styles.weightHeader}>
            <View>
              <Text style={styles.weightCurrent}>{displayedWeight} <Text style={styles.weightUnit}>kg</Text></Text>
              <Text style={styles.weightTarget}>
                {isFr ? "Objectif" : "Goal"}: {displayedTarget} kg
              </Text>
            </View>
            <View style={{ alignItems: "flex-end", gap: 6 }}>
              <View style={[styles.weightBadge, {
                backgroundColor: isGoalReached ? "#34C75920" : `${theme.primary.main}20`,
              }]}>
                <Ionicons
                  name={isGoalReached ? "checkmark-circle" : (isGainGoal ? "trending-up" : "trending-down")}
                  size={16}
                  color={isGoalReached ? "#34C759" : theme.primary.main}
                />
                <Text style={[styles.weightBadgeText, {
                  color: isGoalReached ? "#34C759" : theme.primary.main,
                }]}>
                  {+diffFromTarget.toFixed(1)} kg {isGoalReached ? (isFr ? "atteint" : "reached") : (isFr ? "restant" : "left")}
                </Text>
              </View>
              {weightDelta !== null && (
                <View style={[styles.weightBadge, {
                  backgroundColor: weightDelta <= 0 ? "#34C75920" : "#ED666520",
                }]}>
                  <Ionicons
                    name={weightDelta <= 0 ? "trending-down" : "trending-up"}
                    size={14}
                    color={weightDelta <= 0 ? "#34C759" : "#ED6665"}
                  />
                  <Text style={[styles.weightBadgeText, {
                    color: weightDelta <= 0 ? "#34C759" : "#ED6665",
                  }]}>
                    {weightDelta > 0 ? "+" : ""}{weightDelta} kg
                  </Text>
                </View>
              )}
            </View>
          </View>

          {weightChart.length === 0 && (
            <View style={[styles.chartWrap, { alignItems: "center", justifyContent: "center", paddingVertical: 24 }]}>
              <Text style={{ color: theme.foreground.gray, fontFamily: FONTS.regular, fontSize: 12, textAlign: "center" }}>
                {isFr
                  ? "Aucun historique pour le moment.\nMettez à jour votre poids dans l'onglet Alimentation pour voir l'évolution."
                  : "No history yet.\nUpdate your weight from the Alimentation tab to see your progress."}
              </Text>
            </View>
          )}
          {weightChart.length >= 1 && (
            <View style={styles.chartWrap}>
              <LineChart
                data={weightChart}
                secondaryData={weightChart.map((p) => ({
                  ...p,
                  value: displayedTarget,
                }))}
                color={theme.primary.main}
                secondaryLineConfig={{
                  color: `${theme.foreground.gray}80`,
                  thickness: 1.5,
                  hideDataPoints: true,
                }}
                thickness={2.5}
                noOfSections={4}
                yAxisThickness={0}
                xAxisThickness={0}
                xAxisLabelTextStyle={{
                  color: theme.foreground.gray,
                  fontSize: 9,
                  fontFamily: FONTS.semiBold,
                }}
                yAxisTextStyle={{ color: theme.foreground.gray, fontSize: 9 }}
                yAxisOffset={weightChartBounds.min}
                maxValue={weightChartBounds.max - weightChartBounds.min}
                stepValue={
                  (weightChartBounds.max - weightChartBounds.min) / 4
                }
                hideRules
                curved={weightChart.length > 2}
                isAnimated
                height={160}
                width={SCREEN_WIDTH - 80}
                spacing={
                  (SCREEN_WIDTH - 100) / Math.max(weightChart.length - 1, 1)
                }
                initialSpacing={10}
                endSpacing={10}
                dataPointsColor={theme.primary.main}
                dataPointsRadius={4}
                textColor={theme.foreground.white}
                textShiftY={-6}
                textFontSize={10}
                startFillColor={`${theme.primary.main}30`}
                endFillColor={`${theme.primary.main}05`}
                startOpacity={0.6}
                endOpacity={0.05}
                areaChart
                pointerConfig={{
                  pointerStripHeight: 140,
                  pointerStripColor: `${theme.primary.main}50`,
                  pointerStripWidth: 2,
                  pointerColor: theme.primary.main,
                  radius: 5,
                  pointerLabelWidth: 80,
                  pointerLabelHeight: 46,
                  activatePointersOnLongPress: false,
                  autoAdjustPointerLabelPosition: true,
                  pointerLabelComponent: (items: any[]) => {
                    const item = items?.[0];
                    if (!item) return null;
                    return (
                      <View style={styles.chartPointerTooltip}>
                        <Text style={styles.chartPointerTooltipValue}>{item.value} kg</Text>
                        <Text style={styles.chartPointerTooltipLabel}>{item.label}</Text>
                      </View>
                    );
                  },
                }}
              />
            </View>
          )}
        </View>

        {/* ── 2. Steps (Pas) ────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>{isFr ? "Pas" : "Steps"}</Text>
        <View style={styles.chartCard}>
          <View style={styles.cardMetricsHeader}>
            <View>
              <Text style={styles.chartTotal}>
                {stepsMetrics.average.toLocaleString(isFr ? "fr-FR" : "en-US")}{" "}
                <Text style={styles.chartTotalUnit}>{isFr ? "pas/jour" : "steps/day"}</Text>
              </Text>
              <Text style={styles.chartSubLabel}>
                {isFr ? "Total" : "Total"}: {stepsMetrics.total.toLocaleString(isFr ? "fr-FR" : "en-US")} {isFr ? "pas" : "steps"}
              </Text>
            </View>
            <View style={styles.goalTag}>
              <MaterialCommunityIcons name="shoe-print" size={14} color={theme.primary.main} />
              <Text style={styles.goalTagText}>
                {isFr ? "Obj." : "Goal"}: {dailyStepsGoal.toLocaleString(isFr ? "fr-FR" : "en-US")}
              </Text>
            </View>
          </View>
          <View style={styles.chartWrap}>
            <BarChart
              key={`steps-barchart-${activityPeriod}-${stepsMetrics.chartData.length}-${stepsMetrics.maxValue}`}
              data={stepsMetrics.chartData}
              barWidth={stepsMetrics.barWidth}
              spacing={stepsMetrics.spacing}
              initialSpacing={stepsMetrics.initialSpacing}
              roundedTop
              noOfSections={3}
              maxValue={stepsMetrics.maxValue}
              overflowTop={30}
              yAxisThickness={0} xAxisThickness={0}
              xAxisLabelTextStyle={{ color: theme.foreground.gray, fontSize: 10, fontFamily: FONTS.semiBold }}
              yAxisTextStyle={{ color: theme.foreground.gray, fontSize: 9 }}
              formatYLabel={(val: string) => {
                const num = Math.round(Number(val));
                if (isNaN(num)) return val;
                if (num >= 10000) return `${Math.round(num / 1000)}k`;
                return num.toLocaleString(isFr ? "fr-FR" : "en-US");
              }}
              hideRules
              barBorderRadius={activityPeriod === "monthly" ? 2 : 4}
              isAnimated height={130} width={SCREEN_WIDTH - 80}
              renderTooltip={(item: any) => (
                <View style={[styles.barChartTooltip, { borderColor: `${theme.primary.main}45` }]}>
                  <Text style={[styles.barChartTooltipValue, { color: theme.primary.main }]}>
                    {item.value.toLocaleString(isFr ? "fr-FR" : "en-US")} {activityPeriod === "weekly" || activityPeriod === "monthly" ? (isFr ? "pas" : "steps") : (isFr ? "pas/j" : "steps/d")}
                  </Text>
                  {item.dateFormatted ? (
                    <Text style={styles.barChartTooltipDate}>{item.dateFormatted}</Text>
                  ) : null}
                </View>
              )}
              autoCenterTooltip
            />
          </View>
          <View style={styles.heroStatsDivider} />
          <View style={styles.heroStatsGrid}>
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatItemLabel}>{isFr ? "Total cumulé" : "Total steps"}</Text>
              <Text style={styles.heroStatItemValue}>
                {stepsMetrics.total.toLocaleString(isFr ? "fr-FR" : "en-US")}
              </Text>
            </View>
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatItemLabel}>{isFr ? "Objectif / jour" : "Daily goal"}</Text>
              <Text style={styles.heroStatItemValue}>
                {dailyStepsGoal.toLocaleString(isFr ? "fr-FR" : "en-US")}
              </Text>
            </View>
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatItemLabel}>{isFr ? "Atteinte" : "Completion"}</Text>
              <Text style={[styles.heroStatItemValue, { color: stepsMetrics.average >= dailyStepsGoal ? "#34C759" : theme.primary.main }]}>
                {Math.round((stepsMetrics.average / Math.max(1, dailyStepsGoal)) * 100)}%
              </Text>
            </View>
          </View>
        </View>

        {/* ── 3. Calories Consumed (Calories consommées) ─────────── */}
        <Text style={styles.sectionTitle}>{isFr ? "Calories consommées" : "Calories Consumed"}</Text>
        <View style={styles.chartCard}>
          <View style={styles.cardMetricsHeader}>
            <View>
              <Text style={styles.chartTotal}>
                {nutritionMetrics.average.toLocaleString(isFr ? "fr-FR" : "en-US")}{" "}
                <Text style={styles.chartTotalUnit}>{isFr ? "kcal/jour" : "kcal/day"}</Text>
              </Text>
              <Text style={styles.chartSubLabel}>
                {isFr ? "Total consommé" : "Total eaten"}: {nutritionMetrics.total.toLocaleString(isFr ? "fr-FR" : "en-US")} kcal
              </Text>
            </View>
            <View style={[styles.goalTag, { backgroundColor: "rgba(255,107,0,0.15)" }]}>
              <MaterialCommunityIcons name="silverware-fork-knife" size={14} color="#FF6B00" />
              <Text style={[styles.goalTagText, { color: "#FF6B00" }]}>
                {isFr ? "Obj." : "Goal"}: {nutritionMetrics.targetKcal.toLocaleString(isFr ? "fr-FR" : "en-US")}
              </Text>
            </View>
          </View>
          <View style={styles.chartWrap}>
            <BarChart
              key={`nutrition-barchart-${activityPeriod}-${nutritionMetrics.chartData.length}-${nutritionMetrics.maxValue}`}
              data={nutritionMetrics.chartData}
              barWidth={nutritionMetrics.barWidth}
              spacing={nutritionMetrics.spacing}
              initialSpacing={nutritionMetrics.initialSpacing}
              roundedTop
              noOfSections={3}
              maxValue={nutritionMetrics.maxValue}
              overflowTop={30}
              yAxisThickness={0} xAxisThickness={0}
              xAxisLabelTextStyle={{ color: theme.foreground.gray, fontSize: 10, fontFamily: FONTS.semiBold }}
              yAxisTextStyle={{ color: theme.foreground.gray, fontSize: 9 }}
              formatYLabel={(val: string) => {
                const num = Math.round(Number(val));
                if (isNaN(num)) return val;
                if (num >= 10000) return `${Math.round(num / 1000)}k`;
                return num.toLocaleString(isFr ? "fr-FR" : "en-US");
              }}
              hideRules
              barBorderRadius={activityPeriod === "monthly" ? 2 : 4}
              isAnimated height={130} width={SCREEN_WIDTH - 80}
              renderTooltip={(item: any) => (
                <View style={[styles.barChartTooltip, { borderColor: "rgba(255,107,0,0.40)" }]}>
                  <Text style={[styles.barChartTooltipValue, { color: "#FF6B00" }]}>
                    {item.value.toLocaleString(isFr ? "fr-FR" : "en-US")} {activityPeriod === "weekly" || activityPeriod === "monthly" ? "kcal" : (isFr ? "kcal/j" : "kcal/d")}
                  </Text>
                  {item.dateFormatted ? (
                    <Text style={styles.barChartTooltipDate}>{item.dateFormatted}</Text>
                  ) : null}
                </View>
              )}
              autoCenterTooltip
            />
          </View>
          <View style={styles.heroStatsDivider} />
          <View style={styles.heroStatsGrid}>
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatItemLabel}>{isFr ? "Total consommé" : "Total eaten"}</Text>
              <Text style={styles.heroStatItemValue}>
                {nutritionMetrics.total.toLocaleString(isFr ? "fr-FR" : "en-US")} kcal
              </Text>
            </View>
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatItemLabel}>{isFr ? "Objectif / jour" : "Daily target"}</Text>
              <Text style={styles.heroStatItemValue}>
                {nutritionMetrics.targetKcal.toLocaleString(isFr ? "fr-FR" : "en-US")} kcal
              </Text>
            </View>
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatItemLabel}>{isFr ? "Adhérence" : "Target %"}</Text>
              <Text style={[styles.heroStatItemValue, { color: "#FF6B00" }]}>
                {Math.round((nutritionMetrics.average / Math.max(1, nutritionMetrics.targetKcal)) * 100)}%
              </Text>
            </View>
          </View>
        </View>

        {/* ── 4. Calories Burned (Calories brûlées) ─────────────── */}
        <Text style={styles.sectionTitle}>{isFr ? "Calories brûlées" : "Calories Burned"}</Text>
        <View style={styles.chartCard}>
          <View style={styles.cardMetricsHeader}>
            <View>
              <Text style={styles.chartTotal}>
                {caloriesBurnedMetrics.average.toLocaleString(isFr ? "fr-FR" : "en-US")}{" "}
                <Text style={styles.chartTotalUnit}>{isFr ? "kcal/jour" : "kcal/day"}</Text>
              </Text>
              <Text style={styles.chartSubLabel}>
                {isFr ? "Total brûlé" : "Total burned"}: {caloriesBurnedMetrics.total.toLocaleString(isFr ? "fr-FR" : "en-US")} kcal
              </Text>
            </View>
            <View style={[styles.goalTag, { backgroundColor: "rgba(245,166,35,0.15)" }]}>
              <MaterialCommunityIcons name="fire" size={14} color="#F5A623" />
              <Text style={[styles.goalTagText, { color: "#F5A623" }]}>
                {isFr ? "Activité" : "Activity"}
              </Text>
            </View>
          </View>
          <View style={styles.chartWrap}>
            <BarChart
              key={`burned-barchart-${activityPeriod}-${caloriesBurnedMetrics.chartData.length}-${caloriesBurnedMetrics.maxValue}`}
              data={caloriesBurnedMetrics.chartData}
              barWidth={caloriesBurnedMetrics.barWidth}
              spacing={caloriesBurnedMetrics.spacing}
              initialSpacing={caloriesBurnedMetrics.initialSpacing}
              roundedTop
              noOfSections={3}
              maxValue={caloriesBurnedMetrics.maxValue}
              overflowTop={30}
              yAxisThickness={0} xAxisThickness={0}
              xAxisLabelTextStyle={{ color: theme.foreground.gray, fontSize: 10, fontFamily: FONTS.semiBold }}
              yAxisTextStyle={{ color: theme.foreground.gray, fontSize: 9 }}
              formatYLabel={(val: string) => {
                const num = Math.round(Number(val));
                if (isNaN(num)) return val;
                if (num >= 10000) return `${Math.round(num / 1000)}k`;
                return num.toLocaleString(isFr ? "fr-FR" : "en-US");
              }}
              hideRules
              barBorderRadius={activityPeriod === "monthly" ? 2 : 4}
              isAnimated height={130} width={SCREEN_WIDTH - 80}
              renderTooltip={(item: any) => (
                <View style={[styles.barChartTooltip, { borderColor: "rgba(245,166,35,0.40)" }]}>
                  <Text style={[styles.barChartTooltipValue, { color: "#F5A623" }]}>
                    {item.value.toLocaleString(isFr ? "fr-FR" : "en-US")} {activityPeriod === "weekly" || activityPeriod === "monthly" ? "kcal" : (isFr ? "kcal/j" : "kcal/d")}
                  </Text>
                  {item.dateFormatted ? (
                    <Text style={styles.barChartTooltipDate}>{item.dateFormatted}</Text>
                  ) : null}
                </View>
              )}
              autoCenterTooltip
            />
          </View>
          <View style={styles.heroStatsDivider} />
          <View style={styles.heroStatsGrid}>
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatItemLabel}>{isFr ? "Total brûlé" : "Total burned"}</Text>
              <Text style={styles.heroStatItemValue}>
                {caloriesBurnedMetrics.total.toLocaleString(isFr ? "fr-FR" : "en-US")} kcal
              </Text>
            </View>
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatItemLabel}>{isFr ? "Période" : "Period"}</Text>
              <Text style={styles.heroStatItemValue}>
                {activityPeriod === "weekly" ? "7 j" : activityPeriod === "monthly" ? "30 j" : activityPeriod === "3months" ? "90 j" : "180 j"}
              </Text>
            </View>
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatItemLabel}>{isFr ? "Intensité" : "Rate"}</Text>
              <Text style={[styles.heroStatItemValue, { color: "#F5A623" }]}>
                {caloriesBurnedMetrics.average > 400 ? (isFr ? "Élevée" : "High") : (isFr ? "Modérée" : "Moderate")}
              </Text>
            </View>
          </View>
        </View>

        {/* ── 5. Activities & Workouts (Activités & Séances) ─────── */}
        <Text style={styles.sectionTitle}>{isFr ? "Activités & Séances" : "Activities & Workouts"}</Text>
        <View style={styles.chartCard}>
          <View style={styles.activityStatsRow}>
            <View style={styles.activityStatPill}>
              <MaterialCommunityIcons name="dumbbell" size={18} color={theme.primary.main} />
              <Text style={styles.activityStatValue}>{workoutMetrics.count}</Text>
              <Text style={styles.activityStatLabel}>{isFr ? "Séances" : "Workouts"}</Text>
            </View>
            <View style={styles.activityStatPill}>
              <MaterialCommunityIcons name="timer-outline" size={18} color="#38BDF8" />
              <Text style={styles.activityStatValue}>{workoutMetrics.avgMinutes} <Text style={{ fontSize: 11 }}>min</Text></Text>
              <Text style={styles.activityStatLabel}>{isFr ? "Moy. / séance" : "Avg / session"}</Text>
            </View>
            <View style={styles.activityStatPill}>
              <MaterialCommunityIcons name="clock-time-four-outline" size={18} color="#A78BFA" />
              <Text style={styles.activityStatValue}>{workoutMetrics.durationFormatted}</Text>
              <Text style={styles.activityStatLabel}>{isFr ? "Temps total" : "Total time"}</Text>
            </View>
          </View>

          <View style={{ marginTop: 14 }}>
            <Text style={styles.historyListTitle}>
              {isFr ? "Historique des séances" : "Workout History"} ({workoutMetrics.workouts.length})
            </Text>

            {workoutMetrics.workouts.length === 0 ? (
              <View style={styles.emptyWorkoutsWrap}>
                <MaterialCommunityIcons name="dumbbell" size={32} color={`${theme.foreground.gray}40`} />
                <Text style={styles.emptyWorkoutsText}>
                  {isFr
                    ? "Aucune séance enregistrée sur cette période.\nDémarrez un entraînement pour remplir votre historique !"
                    : "No workouts recorded for this period.\nStart a workout to track your progress!"}
                </Text>
              </View>
            ) : (
              workoutMetrics.workouts.slice(0, 5).map((w, idx) => {
                const dateStr = w.date ? new Date(w.date).toLocaleDateString(isFr ? "fr-FR" : "en-US", { day: "numeric", month: "short" }) : "";
                const durMin = w.duration_minutes || 0;
                return (
                  <View key={w.id || idx} style={styles.workoutRow}>
                    <View style={styles.workoutRowLeft}>
                      <View style={styles.workoutIconWrap}>
                        <MaterialCommunityIcons
                          name={w.workout_type === "running" ? "run" : "dumbbell"}
                          size={18}
                          color={theme.primary.main}
                        />
                      </View>
                      <View>
                        <Text style={styles.workoutRowName}>{w.name || (isFr ? "Entraînement" : "Workout")}</Text>
                        <Text style={styles.workoutRowDate}>{dateStr}</Text>
                      </View>
                    </View>
                    <View style={{ alignItems: "flex-end", gap: 3 }}>
                      <View style={styles.durationPill}>
                        <MaterialCommunityIcons name="lightning-bolt" size={12} color="#38BDF8" />
                        <Text style={styles.durationPillText}>{durMin} min</Text>
                      </View>
                      {w.calories_burned ? (
                        <Text style={styles.workoutBurnedText}>🔥 {Math.round(w.calories_burned)} kcal</Text>
                      ) : null}
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </View>

        {/* ── Résumé de la semaine ────────────────────────────────── */}
        <View style={styles.summaryHeader}>
          <Text style={styles.sectionTitle}>{isFr ? "Résumé" : "Summary"}</Text>
          <Pressable
            style={styles.switchBtn}
            onPress={() => setSummaryMode((m) => m === "total" ? "average" : "total")}
          >
            <Text style={styles.switchText}>
              {summaryMode === "total" ? (isFr ? "Total" : "Total") : (isFr ? "Moyenne" : "Average")}
            </Text>
            <Ionicons name="swap-horizontal" size={14} color={theme.primary.main} />
          </Pressable>
        </View>
        <View style={styles.summaryGrid}>
          {(() => {
            const isAverage = summaryMode === "average";
            // Weekly aggregates from real sources only.
            const weekSteps = weeklySteps.reduce((s, d) => s + (d.count || 0), 0);
            // No weekly water history exposed yet — use today's value as the
            // "daily" reading and divide-by-1 in average mode.
            const todayWaterL = (daily.waterMl || 0) / 1000;
            type Item = {
              icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
              value: string;
              unit: string;
              label: string;
              gradient: [string, string];
            };
            const items: Item[] = [
              {
                icon: "fire",
                value: `${Math.round(
                  isAverage ? todayCaloriesBurned : totalBurned,
                )}`,
                unit: "kcal",
                label: isFr ? "Brûlées" : "Burned",
                gradient: ["#1A2F50", PERIOD_ACTIVE_NAVY],
              },
              {
                icon: "shoe-print",
                value: `${Math.round(
                  isAverage ? todaySteps : weekSteps,
                ).toLocaleString()}`,
                unit: "",
                label: isFr ? "Pas" : "Steps",
                gradient: ["#12395C", "#0A1628"],
              },
              {
                icon: "water",
                value: `${todayWaterL.toFixed(1)}`,
                unit: "L",
                label: isFr ? "Eau" : "Water",
                gradient: ["#1A2F50", "#07101F"],
              },
              {
                icon: "scale-bathroom",
                value: `${weight}`,
                unit: "kg",
                label: isFr ? "Poids" : "Weight",
                gradient: ["#12395C", PERIOD_ACTIVE_NAVY],
              },
              {
                icon: "calculator-variant",
                value: `${bmi.toFixed(1)}`,
                unit: bmiData.label,
                label: "IMC",
                gradient: ["#1A2F50", "#07101F"],
              },
              {
                icon: "fire-circle",
                value: `${Math.round(bmr)}`,
                unit: `kcal/${isFr ? "j" : "d"}`,
                label: isFr ? "Métab." : "BMR",
                gradient: ["#12395C", "#0A1628"],
              },
            ];
            return items;
          })().map((s, i) => (
            <View key={i} style={styles.summaryItem}>
              <LinearGradient
                colors={s.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.summaryCardGradient}
              >
                <View style={styles.summaryIconWrap}>
                  <MaterialCommunityIcons name={s.icon} size={22} color="#fff" />
                </View>
                <Text style={styles.summaryValue}>
                  {s.value}
                  {s.unit ? <Text style={styles.summaryUnit}> {s.unit}</Text> : null}
                </Text>
                <Text style={styles.summaryLabel}>{s.label}</Text>
              </LinearGradient>
            </View>
          ))}
        </View>

        {/* ── Progression du jour ────────────────────────────────── */}
        <Text style={styles.sectionTitle}>
          {isFr ? "Progression du jour" : "Daily Progress"}
        </Text>
        <View style={styles.navySectionCard}>
          <View style={{ alignItems: "center", paddingVertical: 12 }}>
            <ProgressRing pct={dailyProgressPct} size={120} color="#38BDF8" strokeWidth={10}>
              <Text style={{ fontFamily: FONTS.extraBold, fontSize: 24, color: "#FFFFFF" }}>
                {Math.round(dailyProgressPct * 100)}%
              </Text>
            </ProgressRing>
            <View style={{ flexDirection: "row", justifyContent: "space-around", width: "100%", marginTop: 16 }}>
              <View style={{ alignItems: "center" }}>
                <ProgressRing pct={dailyProgress?.steps.pct ?? 0} size={44} color="#38BDF8" strokeWidth={4}>
                  <MaterialCommunityIcons name="shoe-print" size={16} color="#38BDF8" />
                </ProgressRing>
                <Text style={{ fontFamily: FONTS.bold, fontSize: 10, color: NAVY_TEXT_MUTED, marginTop: 4 }}>
                  {isFr ? "Pas" : "Steps"}
                </Text>
              </View>
              <View style={{ alignItems: "center" }}>
                <ProgressRing pct={dailyProgress?.calories.pct ?? 0} size={44} color="#F5A623" strokeWidth={4}>
                  <MaterialCommunityIcons name="fire" size={16} color="#F5A623" />
                </ProgressRing>
                <Text style={{ fontFamily: FONTS.bold, fontSize: 10, color: NAVY_TEXT_MUTED, marginTop: 4 }}>
                  Calories
                </Text>
              </View>
              <View style={{ alignItems: "center" }}>
                <ProgressRing pct={dailyProgress?.water.pct ?? 0} size={44} color="#4FC3F7" strokeWidth={4}>
                  <MaterialCommunityIcons name="water" size={16} color="#4FC3F7" />
                </ProgressRing>
                <Text style={{ fontFamily: FONTS.bold, fontSize: 10, color: NAVY_TEXT_MUTED, marginTop: 4 }}>
                  {isFr ? "Eau" : "Water"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Mensurations ───────────────────────────────────────── */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginHorizontal: 20, marginTop: 16, marginBottom: 12 }}>
          <Text style={{ fontFamily: FONTS.extraBold, fontSize: 18, color: theme.foreground.white }}>
            {isFr ? "Mensurations" : "Body Measurements"}
          </Text>
          {latestMeasurements.length > 0 && (
            <Pressable
              onPress={() => router.push("/body-measurements" as any)}
              style={{ flexDirection: "row", alignItems: "center", gap: 3, paddingVertical: 4, paddingHorizontal: 6 }}
            >
              <Text style={{ fontFamily: FONTS.bold, fontSize: 12, color: "#38BDF8" }}>
                {isFr ? "Voir tout" : "View all"}
              </Text>
              <Ionicons name="chevron-forward" size={14} color="#38BDF8" />
            </Pressable>
          )}
        </View>
        <Pressable
          style={styles.navySectionCard}
          onPress={() => router.push("/body-measurements" as any)}
        >
          {latestMeasurements.length === 0 ? (
            <View style={{ alignItems: "center", paddingVertical: 18 }}>
              <View style={styles.emptyIconBadge}>
                <MaterialCommunityIcons name="tape-measure" size={28} color="#38BDF8" />
              </View>
              <Text style={{ fontFamily: FONTS.semiBold, fontSize: 14, color: "#FFFFFF", marginTop: 10 }}>
                {isFr ? "Aucune mesure enregistrée" : "No measurements recorded"}
              </Text>
              <Text style={{ fontFamily: FONTS.regular, fontSize: 12, color: NAVY_TEXT_MUTED, marginTop: 4, textAlign: "center" }}>
                {isFr ? "Suivez l'évolution de votre corps en ajoutant vos mesures" : "Track your body changes by adding measurements"}
              </Text>
              <View style={styles.addMeasurementPill}>
                <Ionicons name="add" size={15} color="#38BDF8" />
                <Text style={{ fontFamily: FONTS.bold, fontSize: 12, color: "#38BDF8" }}>
                  {isFr ? "Ajouter une mesure" : "Add measurement"}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.measurementsGrid}>
              {latestMeasurements.map((m) => {
                const config: Record<
                  string,
                  { label: { fr: string; en: string }; icon: keyof typeof MaterialCommunityIcons.glyphMap }
                > = {
                  waist: { label: { fr: "Taille", en: "Waist" }, icon: "tape-measure" },
                  hips: { label: { fr: "Hanches", en: "Hips" }, icon: "human-handsdown" },
                  chest: { label: { fr: "Poitrine", en: "Chest" }, icon: "tshirt-crew-outline" },
                  shoulders: { label: { fr: "Épaules", en: "Shoulders" }, icon: "arrow-expand-horizontal" },
                  thigh: { label: { fr: "Cuisse", en: "Thigh" }, icon: "run" },
                  arm: { label: { fr: "Bras", en: "Arm" }, icon: "arm-flex" },
                  calves: { label: { fr: "Mollets", en: "Calves" }, icon: "walk" },
                };
                const item = config[m.id] ?? {
                  label: { fr: m.id, en: m.id },
                  icon: "ruler" as const,
                };
                return (
                  <View key={m.id} style={styles.measurementItemCard}>
                    <View style={styles.measurementIconCircle}>
                      <MaterialCommunityIcons name={item.icon} size={15} color="#38BDF8" />
                    </View>
                    <View style={styles.measurementValueRow}>
                      <Text style={styles.measurementValue}>{m.value}</Text>
                      <Text style={styles.measurementUnit}>cm</Text>
                    </View>
                    <Text style={styles.measurementItemLabel} numberOfLines={1}>
                      {isFr ? item.label.fr : item.label.en}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </Pressable>

        {/* ── Composition corporelle ──────────────────────────────── */}
        <Text style={styles.sectionTitle}>
          {isFr ? "Composition corporelle" : "Body Composition"}
        </Text>
        <View style={[styles.navySectionCard, { marginBottom: 24 }]}>
          {!bodyComposition.bodyFat && !bodyComposition.muscleMass ? (
            <Pressable
              style={{ alignItems: "center", paddingVertical: 16 }}
              onPress={() => router.push("/body-measurements" as any)}
            >
              <MaterialCommunityIcons name="percent-circle-outline" size={32} color={NAVY_TEXT_MUTED} />
              <Text style={{ fontFamily: FONTS.regular, fontSize: 13, color: NAVY_TEXT_MUTED, marginTop: 8, textAlign: "center" }}>
                {isFr ? "Aucune donnée.\nAppuyez pour ajouter." : "No data.\nTap to add."}
              </Text>
            </Pressable>
          ) : (
            <View style={{ flexDirection: "row", justifyContent: "space-around", alignItems: "center" }}>
              <View style={{ alignItems: "center" }}>
                <ProgressRing
                  pct={bodyComposition.bodyFat ? Math.min(bodyComposition.bodyFat.value / 40, 1) : 0}
                  size={80}
                  color="#F5A623"
                  strokeWidth={7}
                >
                  <Text style={{ fontFamily: FONTS.extraBold, fontSize: 16, color: "#FFFFFF" }}>
                    {bodyComposition.bodyFat ? `${bodyComposition.bodyFat.value}%` : "—"}
                  </Text>
                </ProgressRing>
                <Text style={{ fontFamily: FONTS.bold, fontSize: 12, color: NAVY_TEXT_MUTED, marginTop: 8 }}>
                  {isFr ? "Masse grasse" : "Body fat"}
                </Text>
              </View>
              <View style={{ alignItems: "center" }}>
                <ProgressRing
                  pct={bodyComposition.muscleMass ? Math.min(bodyComposition.muscleMass.value / 50, 1) : 0}
                  size={80}
                  color="#34C759"
                  strokeWidth={7}
                >
                  <Text style={{ fontFamily: FONTS.extraBold, fontSize: 16, color: "#FFFFFF" }}>
                    {bodyComposition.muscleMass ? `${bodyComposition.muscleMass.value}%` : "—"}
                  </Text>
                </ProgressRing>
                <Text style={{ fontFamily: FONTS.bold, fontSize: 12, color: NAVY_TEXT_MUTED, marginTop: 8 }}>
                  {isFr ? "Masse musculaire" : "Muscle mass"}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* ── Score de progression ────────────────────────────────── */}
        <Text style={styles.sectionTitle}>
          {isFr ? "Score de progression" : "Progression Score"}
        </Text>
        <View style={[styles.navySectionCard, { marginBottom: 24 }]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
            <ProgressRing pct={progressionScore / 100} size={90} color={scoreColor} strokeWidth={8}>
              <Text style={{ fontFamily: FONTS.extraBold, fontSize: 28, color: "#FFFFFF" }}>
                {progressionScore}
              </Text>
            </ProgressRing>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: FONTS.bold, fontSize: 18, color: scoreColor }}>
                {scoreLabel}
              </Text>
              <Text style={{ fontFamily: FONTS.regular, fontSize: 12, color: NAVY_TEXT_MUTED, marginTop: 4, lineHeight: 18 }}>
                {isFr
                  ? "Basé sur ton activité, ton poids, ta nutrition et tes mesures."
                  : "Based on your activity, weight, nutrition, and measurements."}
              </Text>
            </View>
          </View>
        </View>
          </>
        )}

      </ScrollView>

      <CoverPickerModal
        visible={coverPickerOpen}
        currentUrl={myProfile?.cover_url ?? null}
        onClose={() => setCoverPickerOpen(false)}
        onSelect={handleSelectCover}
      />

      <AvatarActionSheet
        visible={avatarSheetOpen}
        hasAvatar={!!myProfile?.avatar_url}
        onClose={() => setAvatarSheetOpen(false)}
        onTakePhoto={() => handleUploadAvatar("camera")}
        onChooseLibrary={() => handleUploadAvatar("library")}
        onRemove={handleRemoveAvatar}
      />

      <ShareProfileModal
        visible={shareOpen}
        userId={user?.id ?? null}
        username={myProfile?.username ?? null}
        displayName={myProfile?.display_name ?? null}
        onClose={() => setShareOpen(false)}
      />
    </AnimatedScreen>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────
function ProfileSkeleton() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const isDark = theme.background.dark === "#0B0D0E";
  const base = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const highlight = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.10)";

  return (
    <>
      <View style={styles.skeletonHeaderWrap}>
        <Shimmer style={styles.skeletonCover} baseColor={base} highlightColor={highlight} />
        <View style={styles.skeletonAvatarShell}>
          <Shimmer style={styles.skeletonAvatar} baseColor={base} highlightColor={highlight} />
        </View>
        <View style={styles.skeletonHeaderBody}>
          <Shimmer style={styles.skeletonMemberSince} baseColor={base} highlightColor={highlight} />
          <Shimmer style={styles.skeletonName} baseColor={base} highlightColor={highlight} />
          <Shimmer style={styles.skeletonHandle} baseColor={base} highlightColor={highlight} />
          <View style={styles.skeletonStatsRow}>
            {Array.from({ length: 3 }).map((_, index) => (
              <View key={index} style={styles.skeletonStatCell}>
                <Shimmer style={styles.skeletonStatIcon} baseColor={base} highlightColor={highlight} />
                <Shimmer style={styles.skeletonStatValue} baseColor={base} highlightColor={highlight} />
                <Shimmer style={styles.skeletonStatLabel} baseColor={base} highlightColor={highlight} />
              </View>
            ))}
          </View>
          <View style={styles.skeletonActionRow}>
            <Shimmer style={styles.skeletonPrimaryAction} baseColor={base} highlightColor={highlight} />
            <Shimmer style={styles.skeletonSecondaryAction} baseColor={base} highlightColor={highlight} />
          </View>
        </View>
      </View>

      <Shimmer style={styles.skeletonSectionTitle} baseColor={base} highlightColor={highlight} />
      <View style={styles.periodRow}>
        {Array.from({ length: 3 }).map((_, index) => (
          <Shimmer key={index} style={styles.skeletonPeriodTab} baseColor={base} highlightColor={highlight} />
        ))}
      </View>

      <Shimmer style={styles.skeletonSectionTitle} baseColor={base} highlightColor={highlight} />
      <View style={styles.chartCard}>
        <View style={styles.skeletonWeightHeader}>
          <View>
            <Shimmer style={styles.skeletonMetricLarge} baseColor={base} highlightColor={highlight} />
            <Shimmer style={styles.skeletonMetricSmall} baseColor={base} highlightColor={highlight} />
          </View>
          <Shimmer style={styles.skeletonBadge} baseColor={base} highlightColor={highlight} />
        </View>
        <Shimmer style={styles.skeletonChart} baseColor={base} highlightColor={highlight} />
      </View>

      <View style={styles.goalsHeader}>
        <Shimmer style={{ width: 140, height: 24, borderRadius: 8 }} baseColor={base} highlightColor={highlight} />
        <Shimmer style={{ width: 60, height: 20, borderRadius: 6 }} baseColor={base} highlightColor={highlight} />
      </View>
      <View style={styles.goalsCard}>
        {Array.from({ length: 5 }).map((_, index) => (
          <React.Fragment key={index}>
            <View style={styles.goalRow}>
              <Shimmer style={{ width: 8, height: 8, borderRadius: 4, marginRight: 14 }} baseColor={base} highlightColor={highlight} />
              <Shimmer style={{ width: index % 2 === 0 ? 180 : 140, height: 16, borderRadius: 6 }} baseColor={base} highlightColor={highlight} />
            </View>
            {index < 4 && <View style={styles.goalDivider} />}
          </React.Fragment>
        ))}
      </View>

      <Shimmer style={styles.skeletonSectionTitle} baseColor={base} highlightColor={highlight} />
      <View style={styles.chartCard}>
        <Shimmer style={styles.skeletonMetricLarge} baseColor={base} highlightColor={highlight} />
        <Shimmer style={styles.skeletonChart} baseColor={base} highlightColor={highlight} />
      </View>

      <Shimmer style={styles.skeletonSectionTitle} baseColor={base} highlightColor={highlight} />
      <View style={styles.chartCard}>
        <Shimmer style={styles.skeletonChart} baseColor={base} highlightColor={highlight} />
        <View style={styles.skeletonLegendColumn}>
          {Array.from({ length: 3 }).map((_, index) => (
            <Shimmer key={index} style={styles.skeletonLegendRow} baseColor={base} highlightColor={highlight} />
          ))}
        </View>
      </View>

      <View style={styles.summaryHeader}>
        <Shimmer style={styles.skeletonSummaryTitle} baseColor={base} highlightColor={highlight} />
        <Shimmer style={styles.skeletonSummarySwitch} baseColor={base} highlightColor={highlight} />
      </View>
      <View style={styles.summaryGrid}>
        {Array.from({ length: 6 }).map((_, index) => (
          <Shimmer key={index} style={styles.skeletonSummaryCard} baseColor={base} highlightColor={highlight} />
        ))}
      </View>

      {/* Progress ring skeleton */}
      <Shimmer style={styles.skeletonSectionTitle} baseColor={base} highlightColor={highlight} />
      <Shimmer style={{ ...styles.skeletonChart, marginHorizontal: 20, height: 200 }} baseColor={base} highlightColor={highlight} />

      {/* Mensurations skeleton */}
      <Shimmer style={styles.skeletonSectionTitle} baseColor={base} highlightColor={highlight} />
      <Shimmer style={{ ...styles.skeletonChart, marginHorizontal: 20, height: 100 }} baseColor={base} highlightColor={highlight} />

      {/* Composition corporelle skeleton */}
      <Shimmer style={styles.skeletonSectionTitle} baseColor={base} highlightColor={highlight} />
      <Shimmer style={{ ...styles.skeletonChart, marginHorizontal: 20, height: 140, marginBottom: 24 }} baseColor={base} highlightColor={highlight} />
    </>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background.dark },
    bgOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%", opacity: 0.3 },

    skeletonHeaderWrap: {
      marginBottom: 8,
      paddingBottom: 16,
    },
    skeletonCover: {
      height: 220,
      marginHorizontal: 12,
      marginTop: 12,
      borderRadius: 12,
    },
    skeletonAvatarShell: {
      position: "absolute",
      top: 188,
      width: 96,
      height: 96,
      borderRadius: 12,
      padding: 4,
      backgroundColor: theme.background.dark,
      alignSelf: "center",
      alignItems: "center",
      justifyContent: "center",
    },
    skeletonAvatar: {
      width: "100%",
      height: "100%",
      borderRadius: 12,
    },
    skeletonHeaderBody: {
      paddingHorizontal: 20,
      paddingTop: 60,
      alignItems: "center",
    },
    skeletonMemberSince: {
      height: 12,
      width: 120,
      borderRadius: 6,
      marginBottom: 14,
    },
    skeletonName: {
      height: 24,
      width: "62%",
      borderRadius: 8,
      marginBottom: 10,
    },
    skeletonHandle: {
      height: 16,
      width: "34%",
      borderRadius: 8,
      marginBottom: 18,
    },
    skeletonStatsRow: {
      flexDirection: "row",
      alignSelf: "stretch",
      marginBottom: 16,
    },
    skeletonStatCell: {
      flex: 1,
      alignItems: "center",
      gap: 6,
    },
    skeletonStatIcon: {
      width: 18,
      height: 18,
      borderRadius: 9,
    },
    skeletonStatValue: {
      width: 40,
      height: 18,
      borderRadius: 8,
    },
    skeletonStatLabel: {
      width: 52,
      height: 12,
      borderRadius: 6,
    },
    skeletonActionRow: {
      flexDirection: "row",
      gap: 12,
      alignSelf: "stretch",
    },
    skeletonPrimaryAction: {
      flex: 1,
      height: 48,
      borderRadius: 12,
    },
    skeletonSecondaryAction: {
      flex: 1,
      height: 48,
      borderRadius: 12,
    },
    skeletonSectionTitle: {
      height: 20,
      width: 140,
      borderRadius: 8,
      marginHorizontal: 20,
      marginTop: 16,
      marginBottom: 12,
    },
    skeletonPeriodTab: {
      width: 92,
      height: 38,
      borderRadius: 12,
    },
    skeletonWeightHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    skeletonMetricLarge: {
      height: 28,
      width: 120,
      borderRadius: 10,
      marginBottom: 8,
    },
    skeletonMetricSmall: {
      height: 12,
      width: 84,
      borderRadius: 6,
    },
    skeletonBadge: {
      height: 34,
      width: 110,
      borderRadius: 12,
    },
    skeletonChart: {
      width: "100%",
      height: 150,
      borderRadius: 12,
    },
    skeletonLegendColumn: {
      gap: 10,
      marginTop: 14,
    },
    skeletonLegendRow: {
      width: "100%",
      height: 18,
      borderRadius: 9,
    },
    skeletonSummaryTitle: {
      width: 120,
      height: 20,
      borderRadius: 8,
      marginHorizontal: 20,
      marginTop: 16,
      marginBottom: 12,
    },
    skeletonSummarySwitch: {
      width: 90,
      height: 32,
      borderRadius: 12,
      marginTop: 16,
      marginBottom: 12,
    },
    skeletonSummaryCard: {
      width: "31.5%",
      minHeight: 120,
      borderRadius: 12,
    },

    // Header
    header: {
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      paddingHorizontal: 20, paddingVertical: 12,
    },
    headerTitle: { fontFamily: FONTS.extraBold, fontSize: 20, color: theme.foreground.white, letterSpacing: 1, textTransform: "uppercase" },
    headerBtn: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: theme.background.accent },

    // Section title
    sectionTitle: {
      fontFamily: FONTS.extraBold, fontSize: 18, color: theme.foreground.white,
      marginHorizontal: 20, marginTop: 16, marginBottom: 12,
    },

    // Health Connect row
    healthConnectRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: theme.background.accent,
      marginHorizontal: 20,
      borderRadius: 12,
      padding: 14,
    },
    healthConnectIcon: {
      width: 40, height: 40, borderRadius: 12,
      alignItems: "center", justifyContent: "center",
      backgroundColor: `${theme.primary.main}20`,
    },
    healthConnectTitle: {
      fontFamily: FONTS.bold, fontSize: 14, color: theme.foreground.white,
    },
    healthConnectSubtitle: {
      fontFamily: FONTS.medium, fontSize: 12, color: theme.foreground.gray, marginTop: 2,
    },

    // Goals section (Mes objectifs)
    goalsHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginHorizontal: 20,
      marginTop: 20,
      marginBottom: 12,
    },
    goalsSectionTitle: {
      fontFamily: FONTS.extraBold,
      fontSize: 22,
      color: theme.foreground.white,
    },
    goalsEditButton: {
      fontFamily: FONTS.bold,
      fontSize: 16,
      color: theme.primary.main,
    },
    goalsCard: {
      marginHorizontal: 20,
      marginBottom: 16,
      borderRadius: 16,
      backgroundColor: theme.background.darker,
      borderWidth: 1,
      borderColor: theme.background.accent,
      overflow: "hidden",
    },
    goalRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    goalDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.primary.main,
      marginRight: 14,
    },
    goalText: {
      fontFamily: FONTS.semiBold,
      fontSize: 15,
      color: theme.foreground.white,
    },
    goalDivider: {
      height: 1,
      backgroundColor: theme.background.accent,
    },

    // Period segmented control (iOS glass)
    periodRow: {
      flexDirection: "row",
      marginHorizontal: 20,
      gap: 10,
      marginBottom: 16,
    },

    // Chart
    chartCard: {
      marginHorizontal: 20, marginBottom: 8, padding: 16,
      borderRadius: 12, backgroundColor: theme.background.darker,
      overflow: "visible",
    },
    chartWrap: { alignItems: "center", overflow: "visible", paddingTop: 8 },
    chartPointerTooltip: {
      backgroundColor: "#0F1E36",
      paddingHorizontal: 8,
      paddingVertical: 5,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.25)",
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.4,
      shadowRadius: 5,
      elevation: 10,
      zIndex: 9999,
    },
    chartPointerTooltipValue: {
      fontFamily: FONTS.extraBold,
      fontSize: 12,
      color: "#FFFFFF",
    },
    chartPointerTooltipLabel: {
      fontFamily: FONTS.semiBold,
      fontSize: 9,
      color: NAVY_TEXT_MUTED,
      marginTop: 1,
    },
    barChartTooltip: {
      backgroundColor: "#161B22",
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 9,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.20)",
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.45,
      shadowRadius: 6,
      elevation: 12,
      zIndex: 9999,
      marginBottom: 6,
    },
    barChartTooltipValue: {
      fontFamily: FONTS.bold,
      fontSize: 13,
      color: "#FFFFFF",
    },
    barChartTooltipDate: {
      fontFamily: FONTS.medium,
      fontSize: 10,
      color: "rgba(255,255,255,0.65)",
      marginTop: 2,
    },

    // Navy Section Cards (Progression du jour, Mensurations, Composition corporelle, Score de progression)
    navySectionCard: {
      marginHorizontal: 20,
      marginBottom: 10,
      padding: 18,
      borderRadius: 18,
      backgroundColor: NAVY_CARD,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.10)",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.18,
      shadowRadius: 8,
      elevation: 4,
    },

    // Mensurations Redesign Styles
    measurementsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    measurementItemCard: {
      flexGrow: 1,
      flexBasis: "29%",
      maxWidth: "32%",
      backgroundColor: "rgba(255,255,255,0.04)",
      borderRadius: 14,
      paddingVertical: 12,
      paddingHorizontal: 6,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.07)",
      alignItems: "center",
      justifyContent: "center",
    },
    measurementIconCircle: {
      width: 28,
      height: 28,
      borderRadius: 8,
      backgroundColor: "rgba(56,189,248,0.12)",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 6,
    },
    measurementValueRow: {
      flexDirection: "row",
      alignItems: "baseline",
      gap: 2,
    },
    measurementValue: {
      fontFamily: FONTS.extraBold,
      fontSize: 16,
      color: "#FFFFFF",
    },
    measurementUnit: {
      fontFamily: FONTS.medium,
      fontSize: 10,
      color: NAVY_TEXT_SOFT,
    },
    measurementItemLabel: {
      fontFamily: FONTS.semiBold,
      fontSize: 11,
      color: NAVY_TEXT_MUTED,
      marginTop: 3,
      textAlign: "center",
    },
    emptyIconBadge: {
      width: 48,
      height: 48,
      borderRadius: 16,
      backgroundColor: "rgba(56,189,248,0.10)",
      alignItems: "center",
      justifyContent: "center",
    },
    addMeasurementPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: "rgba(56,189,248,0.12)",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      marginTop: 12,
    },

    devRoutesButton: {
      marginHorizontal: 20,
      marginTop: 10,
      marginBottom: 2,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: theme.primary.main,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    devRoutesButtonText: {
      fontFamily: FONTS.bold,
      fontSize: 14,
      color: theme.background.dark,
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },

    // Weight progress header
    weightHeader: {
      flexDirection: "row", justifyContent: "space-between", alignItems: "center",
      marginBottom: 16,
    },
    weightCurrent: { fontFamily: FONTS.extraBold, fontSize: 28, color: theme.foreground.white },
    weightUnit: { fontSize: 14, color: theme.foreground.gray },
    weightTarget: { fontFamily: FONTS.regular, fontSize: 12, color: theme.foreground.gray, marginTop: 2 },
    weightBadge: {
      flexDirection: "row", alignItems: "center", gap: 4,
      paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12,
    },
    weightBadgeText: { fontFamily: FONTS.bold, fontSize: 12 },

    // Chart total
    chartTotal: { fontFamily: FONTS.extraBold, fontSize: 24, color: theme.foreground.white, marginBottom: 8 },
    chartTotalUnit: { fontSize: 14, color: theme.foreground.gray },

    // Activity metric card headers & stats
    cardMetricsHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 12,
    },
    chartSubLabel: {
      fontFamily: FONTS.medium,
      fontSize: 12,
      color: theme.foreground.gray,
      marginTop: 2,
    },
    goalTag: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 10,
      backgroundColor: `${theme.primary.main}18`,
    },
    goalTagText: {
      fontFamily: FONTS.bold,
      fontSize: 11,
      color: theme.primary.main,
    },

    // Average hero card (for month, 3m, 6m tabs)
    averageHeroWrap: {
      paddingVertical: 4,
    },
    averageHeroRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      marginBottom: 16,
    },
    averageIconBadge: {
      width: 52,
      height: 52,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
    },
    averageHeroValue: {
      fontFamily: FONTS.extraBold,
      fontSize: 24,
      color: theme.foreground.white,
    },
    averageHeroUnit: {
      fontSize: 13,
      fontFamily: FONTS.medium,
      color: theme.foreground.gray,
    },
    averageHeroSubtitle: {
      fontFamily: FONTS.regular,
      fontSize: 12,
      color: theme.foreground.gray,
      marginTop: 2,
    },
    heroStatsDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: "rgba(255,255,255,0.12)",
      marginBottom: 12,
    },
    heroStatsGrid: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 8,
    },
    heroStatItem: {
      flex: 1,
      backgroundColor: "rgba(255,255,255,0.04)",
      paddingVertical: 10,
      paddingHorizontal: 8,
      borderRadius: 10,
      alignItems: "center",
    },
    heroStatItemLabel: {
      fontFamily: FONTS.medium,
      fontSize: 10,
      color: theme.foreground.gray,
      marginBottom: 4,
      textAlign: "center",
    },
    heroStatItemValue: {
      fontFamily: FONTS.extraBold,
      fontSize: 13,
      color: theme.foreground.white,
      textAlign: "center",
    },

    // Activity summary & workout history
    activityStatsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 8,
      marginBottom: 4,
    },
    activityStatPill: {
      flex: 1,
      backgroundColor: "rgba(255,255,255,0.05)",
      borderRadius: 12,
      paddingVertical: 10,
      paddingHorizontal: 6,
      alignItems: "center",
      gap: 3,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(255,255,255,0.10)",
    },
    activityStatValue: {
      fontFamily: FONTS.extraBold,
      fontSize: 15,
      color: theme.foreground.white,
      marginTop: 2,
    },
    activityStatLabel: {
      fontFamily: FONTS.semiBold,
      fontSize: 10,
      color: theme.foreground.gray,
      textAlign: "center",
    },
    historyListTitle: {
      fontFamily: FONTS.bold,
      fontSize: 13,
      color: theme.foreground.white,
      marginBottom: 10,
    },
    emptyWorkoutsWrap: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 20,
      gap: 8,
    },
    emptyWorkoutsText: {
      fontFamily: FONTS.regular,
      fontSize: 12,
      color: theme.foreground.gray,
      textAlign: "center",
      lineHeight: 18,
    },
    workoutRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 10,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: "rgba(255,255,255,0.08)",
    },
    workoutRowLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      flex: 1,
    },
    workoutIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: `${theme.primary.main}18`,
      alignItems: "center",
      justifyContent: "center",
    },
    workoutRowName: {
      fontFamily: FONTS.bold,
      fontSize: 13,
      color: theme.foreground.white,
    },
    workoutRowDate: {
      fontFamily: FONTS.regular,
      fontSize: 11,
      color: theme.foreground.gray,
      marginTop: 2,
    },
    durationPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
      backgroundColor: "rgba(56,189,248,0.14)",
    },
    durationPillText: {
      fontFamily: FONTS.bold,
      fontSize: 11,
      color: "#38BDF8",
    },
    workoutBurnedText: {
      fontFamily: FONTS.medium,
      fontSize: 10,
      color: "#F5A623",
    },

    // Summary header with switch
    summaryHeader: {
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      paddingRight: 20,
    },
    switchBtn: {
      flexDirection: "row", alignItems: "center", gap: 5,
      paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12,
      backgroundColor: `${theme.primary.main}15`,
    },
    switchText: { fontFamily: FONTS.bold, fontSize: 12, color: theme.primary.main },

    // Summary grid
    summaryGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      rowGap: 10,
      marginHorizontal: 20,
      marginBottom: 16,
    },
    summaryItem: {
      width: "31.5%",
      borderRadius: 12,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.16)",
      backgroundColor: PERIOD_ACTIVE_NAVY,
      ...(Platform.OS === "ios"
        ? {
            shadowColor: PERIOD_ACTIVE_NAVY,
            shadowOpacity: 0.28,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 8 },
          }
        : { elevation: 5 }),
    },
    summaryCardGradient: {
      paddingVertical: 15,
      paddingHorizontal: 10,
      alignItems: "center",
      gap: 8,
      minHeight: 120,
      justifyContent: "center",
      borderTopWidth: 1,
      borderTopColor: "rgba(255,255,255,0.18)",
      borderBottomWidth: 3,
      borderBottomColor: "rgba(0,0,0,0.22)",
    },
    summaryIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(255,255,255,0.14)",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(255,255,255,0.28)",
    },
    summaryValue: {
      fontFamily: FONTS.extraBold,
      fontSize: 18,
      color: "#fff",
      textAlign: "center",
    },
    summaryUnit: { fontSize: 11, color: "rgba(255,255,255,0.85)" },
    summaryLabel: {
      fontFamily: FONTS.bold,
      fontSize: 10,
      color: "rgba(255,255,255,0.9)",
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
  });
}

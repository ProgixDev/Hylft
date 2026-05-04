import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useTranslation } from "react-i18next";
import {
  Dimensions,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { BarChart, LineChart } from "react-native-gifted-charts";
import Svg, { Circle } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AnimatedScreen from "../../components/ui/AnimatedScreen";
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

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const KEYS = {
  weight: "@hylift_food_weight_current",
  targetWeight: "@hylift_food_weight_target",
  height: "@hylift_height",
  age: "@hylift_age",
  gender: "@hylift_gender",
  fitnessGoals: "@hylift_fitness_goals",
  displayName: "@hylift_display_name",
};

type Period = "daily" | "weekly" | "monthly";

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
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={`${color}20`} strokeWidth={strokeWidth} fill="none" />
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={strokeWidth} fill="none"
          strokeLinecap="round" strokeDasharray={`${c}`} strokeDashoffset={o} rotation="-90" origin={`${size / 2}, ${size / 2}`} />
      </Svg>
      {children}
    </View>
  );
}

// ── iOS-style glass segmented control ──────────────────────────────────────
const PERIOD_ITEM_WIDTH = 92;
const PERIOD_TRACK_PADDING = 4;
const PERIOD_ACTIVE_NAVY = "#0A1628";

function PeriodSegment({
  value,
  onChange,
  isFr,
  theme,
  themeType,
  styles,
}: {
  value: Period;
  onChange: (p: Period) => void;
  isFr: boolean;
  theme: Theme;
  themeType: string;
  styles: any;
}) {
  const periods: Period[] = ["daily", "weekly", "monthly"];
  const activeIdx = periods.indexOf(value);
  const x = useSharedValue(activeIdx * PERIOD_ITEM_WIDTH);

  useEffect(() => {
    x.value = withTiming(activeIdx * PERIOD_ITEM_WIDTH, { duration: 280 });
  }, [activeIdx, x]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }],
  }));

  const blurTint = themeType === "dark" ? "dark" : "light";

  return (
    <View style={styles.periodWrap}>
      <View style={styles.periodTrack}>
        <Animated.View
          style={[styles.periodIndicator, indicatorStyle]}
          pointerEvents="none"
        >
          <BlurView
            intensity={50}
            tint={blurTint}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.periodIndicatorOverlay} />
        </Animated.View>
        {periods.map((p) => {
          const active = p === value;
          const label =
            p === "daily"
              ? isFr ? "Jour" : "Today"
              : p === "weekly"
                ? isFr ? "Semaine" : "Week"
                : isFr ? "Mois" : "Month";
          return (
            <Pressable
              key={p}
              style={styles.periodItem}
              onPress={() => onChange(p)}
            >
              <Text
                style={[
                  styles.periodText,
                  active && styles.periodTextActive,
                ]}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════

export default function Profile() {
  const { i18n } = useTranslation();
  const { theme, themeType } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const styles = createStyles(theme);
  const isFr = i18n.language?.startsWith("fr");
  const { user } = useAuth();
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
  const { daily } = useNutrition();
  const [healthBusy, setHealthBusy] = useState(false);

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
  const [displayName, setDisplayName] = useState("");
  const [weightHistory, setWeightHistory] = useState<WeightEntry[]>([]);
  const [activityPeriod, setActivityPeriod] = useState<Period>("weekly");
  const [summaryMode, setSummaryMode] = useState<"total" | "average">("total");

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
        const [w, tw, h, a, g, fg, dn, wh] = await Promise.all([
          AsyncStorage.getItem(KEYS.weight), AsyncStorage.getItem(KEYS.targetWeight),
          AsyncStorage.getItem(KEYS.height), AsyncStorage.getItem(KEYS.age),
          AsyncStorage.getItem(KEYS.gender), AsyncStorage.getItem(KEYS.fitnessGoals),
          AsyncStorage.getItem(KEYS.displayName), WeightHistory.getLastDays(30),
        ]);
        if (w) setWeight(Number(w) || 70);
        if (tw) setTargetWeight(Number(tw) || 65);
        if (h) setHeight(Number(h) || 175);
        if (a) setAge(Number(a) || 25);
        if (g) setGender(g);
        if (fg) { try { setFitnessGoals(JSON.parse(fg)); } catch { /* */ } }
        if (dn) setDisplayName(dn);
        setWeightHistory(wh);
      })();
    }, [])
  );

  const bmi = calcBMI(weight, height);
  const bmiData = bmiInfo(bmi);
  const bmr = calcBMR(weight, height, age, gender);

  const dayLabels = isFr ? ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"] : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const todayIdx = (new Date().getDay() + 6) % 7;

  const caloriesChart = useMemo(() => {
    if (activityPeriod === "daily") {
      return [{ value: Math.round(todayCaloriesBurned), label: isFr ? "Auj" : "Today", frontColor: theme.primary.main }];
    }
    return dayLabels.map((label, i) => ({
      value: weeklyCaloriesBurned[i] ? Math.round(weeklyCaloriesBurned[i].totalCalories) : 0,
      label,
      frontColor: i === todayIdx ? theme.primary.main : `${theme.foreground.gray}40`,
    }));
  }, [activityPeriod, todayCaloriesBurned, weeklyCaloriesBurned, theme, dayLabels, todayIdx, isFr]);

  const totalBurned = activityPeriod === "daily"
    ? Math.round(todayCaloriesBurned)
    : weeklyCaloriesBurned.reduce((s, d) => s + Math.round(d.totalCalories), 0);

  // Weight chart data — driven entirely by the real WeightHistory log.
  const weightChart = useMemo(() => {
    const sorted = [...weightHistory].sort((a, b) =>
      a.date.localeCompare(b.date),
    );
    const fmt = (iso: string) => {
      const d = new Date(iso);
      return `${d.getDate()}/${d.getMonth() + 1}`;
    };
    return sorted
      .slice(-14)
      .map((e) => ({ value: e.weight, label: fmt(e.date) }));
  }, [weightHistory]);

  const weightChartBounds = useMemo(() => {
    const values = weightChart.map((p) => p.value);
    if (values.length === 0) return { min: 0, max: 100 };
    const lo = Math.min(...values, targetWeight);
    const hi = Math.max(...values, targetWeight);
    const pad = Math.max(1, (hi - lo) * 0.4);
    return { min: Math.floor(lo - pad), max: Math.ceil(hi + pad) };
  }, [weightChart, targetWeight]);

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
        <PeriodSegment
          value={activityPeriod}
          onChange={setActivityPeriod}
          isFr={!!isFr}
          theme={theme}
          themeType={themeType}
          styles={styles}
        />

        {/* ── Weight Progress ──────────────────────────────────── */}
        <Text style={styles.sectionTitle}>{isFr ? "Évolution du poids" : "Weight Progress"}</Text>

        <View style={styles.chartCard}>
          <View style={styles.weightHeader}>
            <View>
              <Text style={styles.weightCurrent}>{weight} <Text style={styles.weightUnit}>kg</Text></Text>
              <Text style={styles.weightTarget}>
                {isFr ? "Objectif" : "Goal"}: {targetWeight} kg
              </Text>
            </View>
            <View style={[styles.weightBadge, {
              backgroundColor: weight <= targetWeight ? "#34C75920" : `${theme.primary.main}20`,
            }]}>
              <Ionicons
                name={weight <= targetWeight ? "trending-down" : "trending-up"}
                size={16}
                color={weight <= targetWeight ? "#34C759" : theme.primary.main}
              />
              <Text style={[styles.weightBadgeText, {
                color: weight <= targetWeight ? "#34C759" : theme.primary.main,
              }]}>
                {Math.abs(weight - targetWeight)} kg {weight <= targetWeight ? (isFr ? "atteint" : "reached") : (isFr ? "restant" : "left")}
              </Text>
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
                  value: targetWeight,
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
              />
            </View>
          )}
        </View>

        {/* ── Santé connectée (Health Connect / HealthKit) ─────── */}
        <Text style={styles.sectionTitle}>
          {isFr ? "Santé connectée" : "Connected Health"}
        </Text>
        <Pressable
          style={styles.healthConnectRow}
          onPress={handleConnectHealth}
          disabled={healthBusy || (healthAvailable && healthGranted)}
        >
          <View style={styles.healthConnectIcon}>
            <MaterialCommunityIcons
              name={Platform.OS === "ios" ? "heart-pulse" : "google-fit"}
              size={22}
              color={theme.primary.main}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.healthConnectTitle}>
              {Platform.OS === "ios" ? "Apple Health" : "Health Connect"}
            </Text>
            <Text style={styles.healthConnectSubtitle}>
              {healthAvailable && healthGranted
                ? isFr
                  ? "Connecté · pas et calories synchronisés"
                  : "Connected · steps & calories syncing"
                : healthAvailable
                  ? isFr
                    ? "Disponible · appuyez pour autoriser"
                    : "Available · tap to grant permission"
                  : isFr
                    ? "Appuyez pour vérifier la disponibilité"
                    : "Tap to check availability"}
            </Text>
          </View>
          <Ionicons
            name={
              healthAvailable && healthGranted
                ? "checkmark-circle"
                : "chevron-forward"
            }
            size={22}
            color={
              healthAvailable && healthGranted
                ? "#34C759"
                : theme.foreground.gray
            }
          />
        </Pressable>

        {/* ── Calories Brûlées (Bar Chart) ────────────────────── */}
        <Text style={styles.sectionTitle}>{isFr ? "Calories brûlées" : "Calories Burned"}</Text>
        <View style={styles.chartCard}>
          <Text style={styles.chartTotal}>{totalBurned} <Text style={styles.chartTotalUnit}>kcal</Text></Text>
          <View style={styles.chartWrap}>
            <BarChart
              data={caloriesChart}
              barWidth={28}
              spacing={14}
              roundedTop roundedBottom
              noOfSections={3}
              yAxisThickness={0} xAxisThickness={0}
              xAxisLabelTextStyle={{ color: theme.foreground.gray, fontSize: 10, fontFamily: FONTS.semiBold }}
              yAxisTextStyle={{ color: theme.foreground.gray, fontSize: 9 }}
              hideRules barBorderRadius={6}
              isAnimated height={130} width={SCREEN_WIDTH - 80}
            />
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
      borderRadius: 24,
    },
    skeletonAvatarShell: {
      position: "absolute",
      top: 188,
      width: 96,
      height: 96,
      borderRadius: 48,
      padding: 4,
      backgroundColor: theme.background.dark,
      alignSelf: "center",
      alignItems: "center",
      justifyContent: "center",
    },
    skeletonAvatar: {
      width: "100%",
      height: "100%",
      borderRadius: 44,
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
      borderRadius: 14,
    },
    skeletonSecondaryAction: {
      flex: 1,
      height: 48,
      borderRadius: 14,
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
      borderRadius: 24,
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
      borderRadius: 18,
    },
    skeletonChart: {
      width: "100%",
      height: 150,
      borderRadius: 16,
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
      borderRadius: 16,
      marginTop: 16,
      marginBottom: 12,
    },
    skeletonSummaryCard: {
      width: "31.5%",
      minHeight: 120,
      borderRadius: 18,
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
      borderRadius: 16,
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

    // Period segmented control (iOS glass)
    periodWrap: {
      alignItems: "center",
      marginBottom: 16,
    },
    periodRow: {
      flexDirection: "row",
      marginHorizontal: 20,
      gap: 10,
      marginBottom: 16,
    },
    periodTrack: {
      flexDirection: "row",
      padding: PERIOD_TRACK_PADDING,
      borderRadius: 10,
      backgroundColor: theme.background.darker,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: `${theme.foreground.gray}30`,
      overflow: "hidden",
      ...(Platform.OS === "ios"
        ? {
            shadowColor: "#000",
            shadowOpacity: 0.12,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 4 },
          }
        : { elevation: 2 }),
    },
    periodIndicator: {
      position: "absolute",
      top: PERIOD_TRACK_PADDING,
      left: PERIOD_TRACK_PADDING,
      width: PERIOD_ITEM_WIDTH,
      bottom: PERIOD_TRACK_PADDING,
      borderRadius: 10,
      overflow: "hidden",
      backgroundColor: PERIOD_ACTIVE_NAVY,
    },
    periodIndicatorOverlay: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: 10,
      backgroundColor: PERIOD_ACTIVE_NAVY,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: `${PERIOD_ACTIVE_NAVY}55`,
    },
    periodItem: {
      width: PERIOD_ITEM_WIDTH,
      paddingVertical: 9,
      alignItems: "center",
      justifyContent: "center",
    },
    periodText: {
      fontFamily: FONTS.bold,
      fontSize: 13,
      color: theme.foreground.gray,
    },
    periodTextActive: { color: "#FFFFFF" },

    // Chart
    chartCard: {
      marginHorizontal: 20, marginBottom: 8, padding: 16,
      borderRadius: 20, backgroundColor: theme.background.darker,
    },
    chartWrap: { alignItems: "center", overflow: "hidden" },

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
      paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    },
    weightBadgeText: { fontFamily: FONTS.bold, fontSize: 12 },

    // Chart total
    chartTotal: { fontFamily: FONTS.extraBold, fontSize: 24, color: theme.foreground.white, marginBottom: 8 },
    chartTotalUnit: { fontSize: 14, color: theme.foreground.gray },

    // Summary header with switch
    summaryHeader: {
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      paddingRight: 20,
    },
    switchBtn: {
      flexDirection: "row", alignItems: "center", gap: 5,
      paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
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
      borderRadius: 18,
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
      borderRadius: 20,
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

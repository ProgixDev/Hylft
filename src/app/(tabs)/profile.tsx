import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
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
import { pickAndUploadAvatar } from "../../services/avatarUploader";
import { WeightEntry, WeightHistory } from "../../services/weightHistory";

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

// ═══════════════════════════════════════════════════════════════════════════
type MyProfile = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  created_at: string | null;
};

type UserStats = {
  posts_count: number;
  followers_count: number;
  following_count: number;
  likes_count: number;
};

export default function Profile() {
  const { i18n } = useTranslation();
  const { theme, themeType } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const styles = createStyles(theme);
  const isFr = i18n.language?.startsWith("fr");
  const { user } = useAuth();

  const [myProfile, setMyProfile] = useState<MyProfile | null>(null);
  const [userStats, setUserStats] = useState<UserStats>({
    posts_count: 0,
    followers_count: 0,
    following_count: 0,
    likes_count: 0,
  });
  const [coverPickerOpen, setCoverPickerOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [avatarSheetOpen, setAvatarSheetOpen] = useState(false);

  const { todayCaloriesBurned, weeklyCaloriesBurned } = useHealth();
  const { goals, todaySummary, weekSummaries } = useNutrition();

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
    if (!user?.id) return;
    try {
      const [prof, stats] = await Promise.all([
        api.getProfile() as Promise<MyProfile>,
        api.getUserStats(user.id) as Promise<UserStats>,
      ]);
      setMyProfile(prof);
      setUserStats(stats);
    } catch {
      // swallow; header will still render with defaults.
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
      value: weeklyCaloriesBurned[i] ? Math.round(weeklyCaloriesBurned[i].totalCalories) : Math.round(Math.random() * 300 + 50),
      label,
      frontColor: i === todayIdx ? theme.primary.main : `${theme.foreground.gray}40`,
    }));
  }, [activityPeriod, todayCaloriesBurned, weeklyCaloriesBurned, theme, dayLabels, todayIdx, isFr]);

  const totalBurned = activityPeriod === "daily"
    ? Math.round(todayCaloriesBurned)
    : weeklyCaloriesBurned.reduce((s, d) => s + Math.round(d.totalCalories), 0);

  // Weight chart data
  const weightChart = useMemo(() => {
    if (weightHistory.length === 0) return [{ value: weight, label: isFr ? "Auj" : "Today" }];
    const entries = weightHistory.slice(-14);
    return entries.map((e) => ({ value: e.weight, label: e.date.slice(8) }));
  }, [weightHistory, weight, isFr]);

  return (
    <AnimatedScreen style={styles.container}>
      {themeType === "female" && (
        <Image source={require("../../../assets/girly.png")} style={styles.bgOverlay} resizeMode="cover" />
      )}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 4, paddingBottom: Math.max(100, 24 + insets.bottom) }}>

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

        {/* Period tabs */}
        <View style={styles.periodRow}>
          {(["daily", "weekly", "monthly"] as Period[]).map((p) => {
            const active = p === activityPeriod;
            const label = p === "daily" ? (isFr ? "Jour" : "Today") : p === "weekly" ? (isFr ? "Semaine" : "Week") : (isFr ? "Mois" : "Month");
            return (
              <Pressable key={p} style={[styles.periodTab, active && styles.periodTabActive]} onPress={() => setActivityPeriod(p)}>
                <Text style={[styles.periodText, active && styles.periodTextActive]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>

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

          {weightChart.length >= 1 && (
            <View style={styles.chartWrap}>
              <LineChart
                data={weightChart}
                color={theme.primary.main} thickness={2.5}
                noOfSections={3}
                yAxisThickness={0} xAxisThickness={0}
                xAxisLabelTextStyle={{ color: theme.foreground.gray, fontSize: 9, fontFamily: FONTS.semiBold }}
                yAxisTextStyle={{ color: theme.foreground.gray, fontSize: 9 }}
                hideRules curved={weightChart.length > 2}
                isAnimated height={140} width={SCREEN_WIDTH - 80}
                dataPointsColor={theme.primary.main} dataPointsRadius={4}
                startFillColor={`${theme.primary.main}25`} endFillColor={`${theme.primary.main}05`}
                areaChart
              />
            </View>
          )}
        </View>

        {/* ── Body Stats ─────────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>{isFr ? "Corps" : "Body"}</Text>

        <View style={styles.bodyRow}>
          <View style={styles.bodyCard}>
            <Text style={styles.bodyLabel}>{isFr ? "Poids" : "Weight"}</Text>
            <Text style={styles.bodyValue}>{weight}<Text style={styles.bodyUnit}> kg</Text></Text>
          </View>
          <View style={styles.bodyCard}>
            <Text style={styles.bodyLabel}>IMC</Text>
            <Text style={[styles.bodyValue, { color: bmiData.color }]}>{bmi.toFixed(1)}</Text>
            <Text style={[styles.bodyBadge, { color: bmiData.color }]}>{bmiData.label}</Text>
          </View>
          <View style={styles.bodyCard}>
            <Text style={styles.bodyLabel}>{isFr ? "Métab." : "BMR"}</Text>
            <Text style={styles.bodyValue}>{Math.round(bmr)}</Text>
            <Text style={styles.bodyUnit}>kcal/{isFr ? "j" : "d"}</Text>
          </View>
        </View>

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

        {/* ── Apport Nutritionnel (Bar Chart) ────────────────────── */}
        <Text style={styles.sectionTitle}>{isFr ? "Apport nutritionnel" : "Nutrition Intake"}</Text>
        <View style={styles.chartCard}>
          <View style={styles.chartWrap}>
            <BarChart
              data={[
                { value: Math.round(todaySummary.totalProtein), label: isFr ? "Prot" : "Prot", frontColor: "#4A90D9" },
                { value: Math.round(todaySummary.totalCarbs), label: isFr ? "Gluc" : "Carbs", frontColor: "#F5A623" },
                { value: Math.round(todaySummary.totalFat), label: isFr ? "Lip" : "Fat", frontColor: "#ED6665" },
              ]}
              barWidth={40}
              spacing={30}
              roundedTop roundedBottom
              noOfSections={3}
              yAxisThickness={0} xAxisThickness={0}
              xAxisLabelTextStyle={{ color: theme.foreground.gray, fontSize: 11, fontFamily: FONTS.semiBold }}
              yAxisTextStyle={{ color: theme.foreground.gray, fontSize: 9 }}
              yAxisSuffix="g"
              hideRules barBorderRadius={6}
              isAnimated height={130} width={SCREEN_WIDTH - 80}
            />
          </View>
          <View style={styles.nutriLegend}>
            {[
              { label: isFr ? "Protéines" : "Protein", val: `${Math.round(todaySummary.totalProtein)}/${goals.proteinGoal}g`, color: "#4A90D9" },
              { label: isFr ? "Glucides" : "Carbs", val: `${Math.round(todaySummary.totalCarbs)}/${goals.carbsGoal}g`, color: "#F5A623" },
              { label: isFr ? "Lipides" : "Fat", val: `${Math.round(todaySummary.totalFat)}/${goals.fatGoal}g`, color: "#ED6665" },
            ].map((l) => (
              <View key={l.label} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: l.color }]} />
                <Text style={styles.legendLabel}>{l.label}</Text>
                <Text style={styles.legendVal}>{l.val}</Text>
              </View>
            ))}
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
            const divisor = summaryMode === "average" ? 7 : 1;
            const weekSteps = 48000;
            const weekWater = 10.5;
            const weekActive = 320;
            type Item = {
              icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
              value: string;
              unit: string;
              label: string;
              gradient: [string, string];
            };
            const items: Item[] = [
              { icon: "fire", value: `${Math.round(totalBurned / divisor)}`, unit: "kcal", label: isFr ? "Brûlées" : "Burned", gradient: ["#FF8A3D", "#FF3D6B"] },
              { icon: "shoe-print", value: `${Math.round(weekSteps / divisor).toLocaleString()}`, unit: "", label: isFr ? "Pas" : "Steps", gradient: ["#5AA9FF", "#2E6BFF"] },
              { icon: "water", value: `${(weekWater / divisor).toFixed(1)}`, unit: "L", label: isFr ? "Eau" : "Water", gradient: ["#4FD1C5", "#1FA37A"] },
              { icon: "timer-sand", value: `${Math.round(weekActive / divisor)}`, unit: "min", label: isFr ? "Actif" : "Active", gradient: ["#FFC75A", "#F59E0B"] },
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

        <DevRoutesSection />

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

const DEV_ROUTES: { label: string; path: string }[] = [
  { label: "Home (tab)", path: "/(tabs)/home" },
  { label: "Workout (tab)", path: "/(tabs)/workout" },
  { label: "Alimentation (tab)", path: "/(tabs)/alimentation" },
  { label: "Feed (tab)", path: "/(tabs)/feed" },
  { label: "Profile (tab)", path: "/(tabs)/profile" },
  { label: "Onboarding", path: "/OnBoarding" },
  { label: "Auth — index", path: "/auth" },
  { label: "Auth — sign in", path: "/auth/signin" },
  { label: "Auth — sign up", path: "/auth/signup" },
  { label: "Get Started — language", path: "/get-started/language" },
  { label: "Get Started — gender", path: "/get-started/gender" },
  { label: "Get Started — age", path: "/get-started/age" },
  { label: "Get Started — height", path: "/get-started/height" },
  { label: "Get Started — weight", path: "/get-started/weight" },
  { label: "Get Started — target weight", path: "/get-started/target-weight" },
  { label: "Get Started — fitness goal", path: "/get-started/fitness-goal" },
  { label: "Get Started — focus areas", path: "/get-started/focus-areas" },
  { label: "Get Started — experience level", path: "/get-started/experience-level" },
  { label: "Get Started — workout frequency", path: "/get-started/workout-frequency" },
  { label: "Get Started — units", path: "/get-started/units" },
  { label: "Get Started — email preferences", path: "/get-started/email-preferences" },
  { label: "Get Started — health connect", path: "/get-started/health-connect" },
  { label: "Get Started — ready", path: "/get-started/ready" },
  { label: "Settings — index", path: "/settings" },
  { label: "Settings — edit profile", path: "/settings/edit-profile" },
  { label: "Settings — change password", path: "/settings/change-password" },
  { label: "Settings — privacy", path: "/settings/privacy" },
  { label: "Settings — terms", path: "/settings/terms" },
  { label: "Settings — about", path: "/settings/about" },
  { label: "Settings — help center", path: "/settings/help-center" },
  { label: "Routines — list", path: "/routines" },
  { label: "Explore Routines", path: "/explore-routines" },
  { label: "Create Routine", path: "/create-routine" },
  { label: "Exercise Picker", path: "/exercise-picker" },
  { label: "Workouts — list", path: "/workouts" },
  { label: "Workout Player", path: "/workout-player" },
  { label: "Share Workout", path: "/share-workout" },
  { label: "Food Search", path: "/food-search" },
  { label: "Alimentation History", path: "/alimentation-history" },
  { label: "Search", path: "/search" },
  { label: "Search — scan", path: "/search/scan" },
  { label: "Notifications", path: "/notifications" },
  { label: "Objective", path: "/objective" },
  { label: "User Posts", path: "/user/posts" },
];

function DevRoutesSection() {
  const router = useRouter();
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.devContainer}>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        style={({ pressed }) => [styles.devToggle, pressed && { opacity: 0.85 }]}
      >
        <Ionicons name="construct" size={16} color={theme.foreground.white} />
        <Text style={styles.devToggleText}>
          DEV · {open ? "Hide" : "Show"} all screens
        </Text>
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={16}
          color={theme.foreground.white}
        />
      </Pressable>

      {open && (
        <View style={styles.devList}>
          {DEV_ROUTES.map((r) => (
            <Pressable
              key={r.path}
              onPress={() => router.push(r.path as any)}
              style={({ pressed }) => [
                styles.devItem,
                pressed && { opacity: 0.7 },
              ]}
            >
              <Text style={styles.devItemLabel}>{r.label}</Text>
              <Text style={styles.devItemPath}>{r.path}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────
function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background.dark },
    bgOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%", opacity: 0.3 },

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

    // Period tabs
    periodRow: { flexDirection: "row", marginHorizontal: 20, gap: 10, marginBottom: 16 },
    periodTab: {
      paddingHorizontal: 22, paddingVertical: 10, borderRadius: 24,
      backgroundColor: theme.background.darker,
    },
    periodTabActive: { backgroundColor: theme.foreground.white },
    periodText: { fontFamily: FONTS.bold, fontSize: 13, color: theme.foreground.gray },
    periodTextActive: { color: theme.background.dark },

    // Chart
    chartCard: {
      marginHorizontal: 20, marginBottom: 8, padding: 16,
      borderRadius: 20, backgroundColor: theme.background.darker,
    },
    chartWrap: { alignItems: "center", overflow: "hidden" },

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

    // Body stats
    bodyRow: { flexDirection: "row", marginHorizontal: 20, gap: 8, marginBottom: 14 },
    bodyCard: {
      flex: 1, padding: 14, borderRadius: 16, backgroundColor: theme.background.darker,
      alignItems: "center",
    },
    bodyLabel: { fontFamily: FONTS.semiBold, fontSize: 10, color: theme.foreground.gray, textTransform: "uppercase", letterSpacing: 0.3 },
    bodyValue: { fontFamily: FONTS.extraBold, fontSize: 22, color: theme.foreground.white, marginTop: 4 },
    bodyUnit: { fontSize: 12, color: theme.foreground.gray },
    bodyBadge: { fontFamily: FONTS.regular, fontSize: 10, marginTop: 2 },

    // Chart total
    chartTotal: { fontFamily: FONTS.extraBold, fontSize: 24, color: theme.foreground.white, marginBottom: 8 },
    chartTotalUnit: { fontSize: 14, color: theme.foreground.gray },

    // Nutrition legend
    nutriLegend: { flexDirection: "row", justifyContent: "space-between", marginTop: 14 },
    legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
    legendDot: { width: 8, height: 8, borderRadius: 4 },
    legendLabel: { fontFamily: FONTS.semiBold, fontSize: 11, color: theme.foreground.gray },
    legendVal: { fontFamily: FONTS.bold, fontSize: 11, color: theme.foreground.white },

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
      flexDirection: "row", flexWrap: "wrap", marginHorizontal: 20,
      gap: 10, marginBottom: 16,
    },
    summaryItem: {
      width: (SCREEN_WIDTH - 60) / 3,
      borderRadius: 18,
      overflow: "hidden",
      ...(Platform.OS === "ios"
        ? {
            shadowColor: "#000",
            shadowOpacity: 0.18,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 6 },
          }
        : { elevation: 4 }),
    },
    summaryCardGradient: {
      paddingVertical: 16,
      paddingHorizontal: 10,
      alignItems: "center",
      gap: 8,
      minHeight: 120,
      justifyContent: "center",
    },
    summaryIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(255,255,255,0.22)",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(255,255,255,0.35)",
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

    // Dev navigation
    devContainer: {
      marginHorizontal: 20,
      marginTop: 20,
      marginBottom: 40,
    },
    devToggle: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      backgroundColor: theme.background.darker,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.primary.main + "40",
    },
    devToggleText: {
      fontFamily: FONTS.bold,
      fontSize: 12,
      color: theme.foreground.white,
      letterSpacing: 0.5,
      textTransform: "uppercase",
    },
    devList: {
      marginTop: 10,
      borderRadius: 12,
      backgroundColor: theme.background.darker,
      overflow: "hidden",
    },
    devItem: {
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.foreground.gray + "20",
    },
    devItemLabel: {
      fontFamily: FONTS.semiBold,
      fontSize: 13,
      color: theme.foreground.white,
    },
    devItemPath: {
      fontFamily: FONTS.regular,
      fontSize: 11,
      color: theme.foreground.gray,
      marginTop: 2,
    },
  });
}

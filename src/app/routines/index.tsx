import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
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
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FONTS } from "../../constants/fonts";
import { Theme } from "../../constants/themes";
import { useTheme } from "../../contexts/ThemeContext";
import { Routine } from "../../data/mockData";
import { api } from "../../services/api";
import {
  translateApiData,
  translateRoutineDescription,
  translateRoutineName,
  translateExerciseTerm,
} from "../../utils/exerciseTranslator";

type ApiRoutine = {
  id: string;
  user_id: string;
  name: string;
  description?: string | null;
  exercises?: any[] | null;
  estimated_duration?: number | null;
  target_muscles?: string[] | null;
  difficulty: "beginner" | "intermediate" | "advanced";
  last_used?: string | null;
  times_completed?: number | null;
};

function mapRoutine(r: ApiRoutine): Routine {
  return {
    id: r.id,
    userId: r.user_id,
    name: r.name,
    description: r.description ?? "",
    exercises: (r.exercises ?? []) as any,
    estimatedDuration: r.estimated_duration ?? 0,
    targetMuscles: r.target_muscles ?? [],
    difficulty: r.difficulty,
    lastUsed: r.last_used ?? undefined,
    timesCompleted: r.times_completed ?? 0,
  };
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GRID_PADDING = 20;
const GRID_GAP = 12;
const CARD_WIDTH = (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP) / 2;

type DiffFilter = "all" | "beginner" | "intermediate" | "advanced";

const DIFF_GRADIENTS: Record<
  "beginner" | "intermediate" | "advanced",
  [string, string]
> = {
  beginner: ["#34D399", "#10B981"],
  intermediate: ["#FBBF24", "#F59E0B"],
  advanced: ["#FB7185", "#E11D48"],
};

const surfaceShadow = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  android: { elevation: 6 },
  default: {},
});

const heroShadow = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
  },
  android: { elevation: 10 },
  default: {},
});

export default function AllRoutines() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [routines, setRoutines] = useState<Routine[]>([]);
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState<DiffFilter>("all");

  const loadData = useCallback(async () => {
    try {
      const res = (await api.getRoutines()) as ApiRoutine[];
      setRoutines((res ?? []).map(mapRoutine));
    } catch (error) {
      console.warn("[Routines] load failed:", error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const totalCompleted = useMemo(
    () => routines.reduce((s, r) => s + (r.timesCompleted || 0), 0),
    [routines],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return routines.filter((r) => {
      if (difficulty !== "all" && r.difficulty !== difficulty) return false;
      if (!q) return true;
      return (
        translateRoutineName(r.name).toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q)
      );
    });
  }, [routines, search, difficulty]);

  const filters: { key: DiffFilter; label: string }[] = [
    { key: "all", label: t("common.all") },
    { key: "beginner", label: translateApiData("beginner") },
    { key: "intermediate", label: translateApiData("intermediate") },
    { key: "advanced", label: translateApiData("advanced") },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <Pressable
          style={({ pressed }) => [
            styles.iconButton,
            pressed && styles.pressed,
          ]}
          onPress={() => router.back()}
          hitSlop={8}
        >
          <Ionicons
            name="arrow-back"
            size={22}
            color={theme.foreground.white}
          />
        </Pressable>
        <Image
          source={theme.logo}
          style={styles.headerLogo}
          resizeMode="contain"
        />
        <Pressable
          style={({ pressed }) => [
            styles.iconButton,
            pressed && styles.pressed,
          ]}
          onPress={() => router.push("/explore-routines" as any)}
          hitSlop={8}
        >
          <Ionicons
            name="compass-outline"
            size={22}
            color={theme.foreground.white}
          />
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 120 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <LinearGradient
            colors={[theme.primary.main, theme.primary.light]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.heroOrb1} />
          <View style={styles.heroOrb2} />

          <View style={styles.heroContent}>
            <Text style={styles.heroEyebrow}>
              {t("routines.myRoutines").toUpperCase()}
            </Text>
            <Text style={styles.heroTitle}>
              {t("routines.allRoutines")}
            </Text>

            <View style={styles.heroStats}>
              <HeroStat
                value={String(routines.length)}
                label={t("routines.routinesLabel")}
              />
              <View style={styles.heroDivider} />
              <HeroStat
                value={String(totalCompleted)}
                label={t("routines.completed")}
              />
              <View style={styles.heroDivider} />
              <HeroStat
                value={String(
                  routines.reduce(
                    (s, r) => s + (r.exercises?.length || 0),
                    0,
                  ),
                )}
                label={t("routines.exercises")}
              />
            </View>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Ionicons
              name="search"
              size={18}
              color={theme.foreground.gray}
            />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder={t("routines.searchRoutines")}
              placeholderTextColor={theme.foreground.gray}
              style={styles.searchInput}
            />
            {search.length > 0 && (
              <Pressable onPress={() => setSearch("")} hitSlop={8}>
                <Ionicons
                  name="close-circle"
                  size={18}
                  color={theme.foreground.gray}
                />
              </Pressable>
            )}
          </View>
        </View>

        {/* Difficulty filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {filters.map((f) => {
            const active = difficulty === f.key;
            return (
              <Pressable
                key={f.key}
                onPress={() => setDifficulty(f.key)}
                style={[
                  styles.chip,
                  active && { backgroundColor: theme.primary.main },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    active && { color: "#FFFFFF" },
                  ]}
                >
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Grid */}
        {filtered.length === 0 ? (
          <EmptyState
            theme={theme}
            isFiltered={routines.length > 0}
            onCreate={() => router.push("/create-routine" as any)}
            onExplore={() => router.push("/explore-routines" as any)}
          />
        ) : (
          <View style={styles.grid}>
            {filtered.map((r, idx) => (
              <RoutineGridCard
                key={r.id}
                routine={r}
                theme={theme}
                index={idx}
                onPress={() => router.push(`/routines/${r.id}` as any)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Floating Create button */}
      <Pressable
        onPress={() => router.push("/create-routine" as any)}
        style={({ pressed }) => [
          styles.fab,
          { bottom: 24 + insets.bottom },
          pressed && { transform: [{ scale: 0.96 }] },
        ]}
      >
        <LinearGradient
          colors={[theme.primary.main, theme.primary.light]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Ionicons name="add" size={22} color="#FFFFFF" />
        <Text style={styles.fabText}>
          {t("routines.createRoutine")}
        </Text>
      </Pressable>
    </View>
  );
}

// ── Hero stat ──────────────────────────────────────────────────────────────
function HeroStat({ value, label }: { value: string; label: string }) {
  return (
    <View style={{ alignItems: "center", flex: 1 }}>
      <Text
        style={{
          color: "#FFFFFF",
          fontFamily: FONTS.extraBold,
          fontSize: 22,
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          color: "rgba(255,255,255,0.85)",
          fontFamily: FONTS.semiBold,
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: 0.8,
          marginTop: 2,
        }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

// ── Grid card ──────────────────────────────────────────────────────────────
function RoutineGridCard({
  routine,
  theme,
  index,
  onPress,
}: {
  routine: Routine;
  theme: Theme;
  index: number;
  onPress: () => void;
}) {
  const styles = cardStyles(theme);
  const gradient = DIFF_GRADIENTS[routine.difficulty];
  const name = translateRoutineName(routine.name);
  const desc = translateRoutineDescription(routine.description || "");

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && { transform: [{ scale: 0.98 }], opacity: 0.95 },
      ]}
    >
      {/* Top gradient banner */}
      <View style={styles.banner}>
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.bannerOrb} />

        <View style={styles.diffBadge}>
          <View
            style={[styles.diffDot, { backgroundColor: gradient[0] }]}
          />
          <Text style={styles.diffBadgeText}>
            {translateApiData(routine.difficulty)}
          </Text>
        </View>

        <View style={styles.bannerIconWrap}>
          <Ionicons name="barbell" size={28} color="#FFFFFF" />
        </View>
      </View>

      {/* Body */}
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        {!!desc && (
          <Text style={styles.desc} numberOfLines={2}>
            {desc}
          </Text>
        )}

        <View style={styles.metaRow}>
          <View style={styles.metaPill}>
            <Ionicons
              name="list-outline"
              size={12}
              color={theme.primary.main}
            />
            <Text style={styles.metaPillText}>
              {routine.exercises?.length || 0}
            </Text>
          </View>
          <View style={styles.metaPill}>
            <Ionicons
              name="time-outline"
              size={12}
              color={theme.primary.main}
            />
            <Text style={styles.metaPillText}>
              {routine.estimatedDuration || 0}m
            </Text>
          </View>
        </View>

        {routine.targetMuscles?.length > 0 && (
          <View style={styles.muscleRow}>
            {routine.targetMuscles.slice(0, 2).map((m, i) => (
              <Text key={i} style={styles.muscle} numberOfLines={1}>
                {translateExerciseTerm(m, "targetMuscles")}
              </Text>
            ))}
          </View>
        )}
      </View>
    </Pressable>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────
function EmptyState({
  theme,
  isFiltered,
  onCreate,
  onExplore,
}: {
  theme: Theme;
  isFiltered: boolean;
  onCreate: () => void;
  onExplore: () => void;
}) {
  const { t } = useTranslation();
  const styles = emptyStyles(theme);
  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={[theme.primary.main + "20", "transparent"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.iconCircle}>
        <Ionicons
          name={isFiltered ? "search-outline" : "barbell-outline"}
          size={40}
          color={theme.primary.main}
        />
      </View>
      <Text style={styles.title}>
        {isFiltered
          ? t("routines.noRoutinesFound")
          : t("routines.noRoutinesYetCreate")}
      </Text>
      {!isFiltered && (
        <View style={styles.actions}>
          <Pressable style={styles.primary} onPress={onCreate}>
            <Ionicons name="add" size={18} color="#FFFFFF" />
            <Text style={styles.primaryText}>
              {t("routines.createRoutine")}
            </Text>
          </Pressable>
          <Pressable style={styles.secondary} onPress={onExplore}>
            <Ionicons
              name="compass-outline"
              size={18}
              color={theme.primary.main}
            />
            <Text style={styles.secondaryText}>
              {t("routines.exploreRoutines")}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────
const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background.dark,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingBottom: 10,
    },
    iconButton: {
      width: 42,
      height: 42,
      borderRadius: 14,
      backgroundColor: theme.background.darker,
      alignItems: "center",
      justifyContent: "center",
    },
    pressed: {
      opacity: 0.85,
      transform: [{ scale: 0.96 }],
    },
    headerLogo: {
      height: 26,
      width: 80,
    },
    scrollContent: {
      paddingTop: 8,
    },
    // Hero
    hero: {
      marginHorizontal: 20,
      borderRadius: 28,
      overflow: "hidden",
      paddingVertical: 22,
      paddingHorizontal: 22,
      minHeight: 170,
      justifyContent: "flex-end",
      ...heroShadow,
    },
    heroOrb1: {
      position: "absolute",
      width: 200,
      height: 200,
      borderRadius: 100,
      backgroundColor: "rgba(255,255,255,0.12)",
      top: -80,
      right: -60,
    },
    heroOrb2: {
      position: "absolute",
      width: 140,
      height: 140,
      borderRadius: 70,
      backgroundColor: "rgba(255,255,255,0.08)",
      bottom: -50,
      left: -30,
    },
    heroContent: {
      zIndex: 1,
    },
    heroEyebrow: {
      color: "rgba(255,255,255,0.85)",
      fontFamily: FONTS.semiBold,
      fontSize: 11,
      letterSpacing: 1.5,
      marginBottom: 4,
    },
    heroTitle: {
      color: "#FFFFFF",
      fontFamily: FONTS.extraBold,
      fontSize: 28,
      marginBottom: 18,
    },
    heroStats: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "rgba(255,255,255,0.15)",
      borderRadius: 18,
      paddingVertical: 12,
      paddingHorizontal: 6,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(255,255,255,0.25)",
    },
    heroDivider: {
      width: StyleSheet.hairlineWidth,
      height: 28,
      backgroundColor: "rgba(255,255,255,0.3)",
    },
    // Search
    searchRow: {
      paddingHorizontal: 20,
      marginTop: 18,
    },
    searchBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: theme.background.darker,
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: Platform.OS === "ios" ? 12 : 6,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(0,0,0,0.06)",
    },
    searchInput: {
      flex: 1,
      color: theme.foreground.white,
      fontFamily: FONTS.regular,
      fontSize: 14,
      padding: 0,
    },
    // Filter chips
    filterRow: {
      paddingHorizontal: 20,
      paddingVertical: 14,
      gap: 8,
    },
    chip: {
      paddingHorizontal: 16,
      paddingVertical: 9,
      borderRadius: 22,
      backgroundColor: theme.background.darker,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(0,0,0,0.06)",
    },
    chipText: {
      color: theme.foreground.white,
      fontFamily: FONTS.semiBold,
      fontSize: 13,
    },
    // Grid
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      paddingHorizontal: GRID_PADDING,
      gap: GRID_GAP,
    },
    // FAB
    fab: {
      position: "absolute",
      right: 20,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderRadius: 30,
      overflow: "hidden",
      ...heroShadow,
    },
    fabText: {
      color: "#FFFFFF",
      fontFamily: FONTS.extraBold,
      fontSize: 14,
    },
  });

const cardStyles = (theme: Theme) =>
  StyleSheet.create({
    card: {
      width: CARD_WIDTH,
      borderRadius: 20,
      overflow: "hidden",
      backgroundColor: theme.background.darker,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(0,0,0,0.06)",
      ...surfaceShadow,
    },
    banner: {
      height: 84,
      padding: 10,
      justifyContent: "space-between",
      overflow: "hidden",
    },
    bannerOrb: {
      position: "absolute",
      width: 90,
      height: 90,
      borderRadius: 45,
      backgroundColor: "rgba(255,255,255,0.18)",
      top: -30,
      right: -20,
    },
    diffBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      alignSelf: "flex-start",
      backgroundColor: "rgba(255,255,255,0.9)",
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
    },
    diffDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    diffBadgeText: {
      fontSize: 10,
      fontFamily: FONTS.extraBold,
      color: "#0B0D0E",
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    bannerIconWrap: {
      alignSelf: "flex-end",
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: "rgba(255,255,255,0.22)",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(255,255,255,0.3)",
    },
    body: {
      padding: 12,
      gap: 6,
    },
    name: {
      fontSize: 15,
      fontFamily: FONTS.extraBold,
      color: theme.foreground.white,
    },
    desc: {
      fontSize: 11,
      lineHeight: 15,
      color: theme.foreground.gray,
      fontFamily: FONTS.regular,
    },
    metaRow: {
      flexDirection: "row",
      gap: 6,
      marginTop: 4,
    },
    metaPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 10,
      backgroundColor: theme.primary.main + "18",
    },
    metaPillText: {
      fontSize: 11,
      fontFamily: FONTS.bold,
      color: theme.primary.main,
    },
    muscleRow: {
      flexDirection: "row",
      gap: 4,
      marginTop: 2,
      flexWrap: "wrap",
    },
    muscle: {
      fontSize: 10,
      color: theme.foreground.gray,
      fontFamily: FONTS.semiBold,
      textTransform: "capitalize",
    },
  });

const emptyStyles = (theme: Theme) =>
  StyleSheet.create({
    wrap: {
      marginHorizontal: 20,
      marginTop: 20,
      padding: 28,
      borderRadius: 26,
      alignItems: "center",
      overflow: "hidden",
      backgroundColor: theme.background.darker,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(0,0,0,0.06)",
      ...surfaceShadow,
    },
    iconCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.primary.main + "18",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
    },
    title: {
      fontSize: 15,
      fontFamily: FONTS.bold,
      color: theme.foreground.white,
      textAlign: "center",
      lineHeight: 22,
      marginBottom: 18,
      paddingHorizontal: 10,
    },
    actions: {
      flexDirection: "row",
      gap: 10,
    },
    primary: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: theme.primary.main,
      paddingHorizontal: 18,
      paddingVertical: 11,
      borderRadius: 22,
    },
    primaryText: {
      color: "#FFFFFF",
      fontFamily: FONTS.extraBold,
      fontSize: 13,
    },
    secondary: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: theme.background.accent,
      paddingHorizontal: 18,
      paddingVertical: 11,
      borderRadius: 22,
    },
    secondaryText: {
      color: theme.primary.main,
      fontFamily: FONTS.extraBold,
      fontSize: 13,
    },
  });

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dimensions,
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
import { ApiRoutine, mapRoutine } from "../../utils/routineMapper";
import {
  translateRoutineName,
  translateExerciseTerm,
} from "../../utils/exerciseTranslator";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GRID_PADDING = 20;
const GRID_GAP = 12;
const CARD_WIDTH = (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP) / 2;
const NAVY_CARD = "#0A1628";
const NAVY_CARD_LIGHT = "#1A2F50";
const NAVY_CARD_DEEP = "#07101F";
const NAVY_TEXT_MUTED = "rgba(255,255,255,0.72)";

const surfaceShadow = Platform.select({
  ios: {
    shadowColor: NAVY_CARD,
    shadowOpacity: 0.26,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
  },
  android: { elevation: 5 },
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
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

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
      if (!q) return true;
      return (
        translateRoutineName(r.name).toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q)
      );
    });
  }, [routines, search]);

  return (
    <View style={styles.container}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 120 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={[styles.hero, { paddingTop: insets.top + 18 }]}>
          <LinearGradient
            colors={[theme.primary.main, theme.primary.light]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.heroOrb1} />
          <View style={styles.heroOrb2} />

          <Pressable
            style={({ pressed }) => [
              styles.heroBackButton,
              pressed && styles.pressed,
            ]}
            onPress={() => router.back()}
            hitSlop={8}
          >
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </Pressable>

          <View style={styles.heroContent}>
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
          <View style={styles.viewToggle}>
            {(["grid", "list"] as const).map((mode) => {
              const active = viewMode === mode;
              return (
                <Pressable
                  key={mode}
                  onPress={() => setViewMode(mode)}
                  style={[
                    styles.viewToggleButton,
                    active && styles.viewToggleButtonActive,
                  ]}
                  hitSlop={6}
                >
                  <Ionicons
                    name={mode === "grid" ? "grid-outline" : "list-outline"}
                    size={18}
                    color={active ? "#FFFFFF" : NAVY_TEXT_MUTED}
                  />
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Sessions */}
        {filtered.length === 0 ? (
          <EmptyState
            theme={theme}
            isFiltered={routines.length > 0}
            onCreate={() => router.push("/create-routine" as any)}
            onExplore={() => router.push("/explore-routines" as any)}
          />
        ) : viewMode === "list" ? (
          <View style={styles.list}>
            {filtered.map((r) => (
              <RoutineListCard
                key={r.id}
                routine={r}
                onPress={() => router.push(`/routines/${r.id}` as any)}
              />
            ))}
          </View>
        ) : (
          <View style={styles.grid}>
            {filtered.map((r, idx) => (
              <RoutineGridCard
                key={r.id}
                routine={r}
                theme={theme}
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
  onPress,
}: {
  routine: Routine;
  theme: Theme;
  onPress: () => void;
}) {
  const styles = cardStyles(theme);
  const name = translateRoutineName(routine.name);
  const primaryMuscles = routine.targetMuscles?.slice(0, 2) ?? [];
  const exerciseCount = routine.exercises?.length || 0;
  const duration = routine.estimatedDuration || 0;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && { transform: [{ scale: 0.98 }], opacity: 0.95 },
      ]}
    >
      <View style={styles.body}>
        <View style={styles.cardTopRow}>
          <Text style={styles.name} numberOfLines={2}>
            {name}
          </Text>
          <Ionicons name="chevron-forward" size={16} color={NAVY_TEXT_MUTED} />
        </View>

        <View style={styles.statGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{exerciseCount}</Text>
            <Text style={styles.statLabel}>Exos</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{duration}</Text>
            <Text style={styles.statLabel}>Min</Text>
          </View>
        </View>

        {primaryMuscles.length > 0 && (
          <View style={styles.muscleRow}>
            {primaryMuscles.map((m, i) => (
              <Text key={i} style={styles.muscle} numberOfLines={1}>
                {translateExerciseTerm(m, "targetMuscles")}
              </Text>
            ))}
          </View>
        )}

        <View style={styles.cardFooter}>
          <Text style={styles.footerText}>
            {routine.timesCompleted || 0}x terminée
          </Text>
          <View style={styles.footerLine}>
            <View
              style={[
                styles.footerLineFill,
                { width: `${Math.min((routine.timesCompleted || 0) * 18, 100)}%` },
              ]}
            />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function RoutineListCard({
  routine,
  onPress,
}: {
  routine: Routine;
  onPress: () => void;
}) {
  const styles = listCardStyles();
  const name = translateRoutineName(routine.name);
  const primaryMuscles = routine.targetMuscles?.slice(0, 2) ?? [];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && { transform: [{ scale: 0.99 }], opacity: 0.95 },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          <Ionicons name="chevron-forward" size={18} color={NAVY_TEXT_MUTED} />
        </View>
        <View style={styles.metaRow}>
          <View style={styles.metaPill}>
            <Ionicons name="list-outline" size={12} color="#FFFFFF" />
            <Text style={styles.metaPillText}>
              {routine.exercises?.length || 0}
            </Text>
          </View>
          <View style={styles.metaPill}>
            <Ionicons name="time-outline" size={12} color="#FFFFFF" />
            <Text style={styles.metaPillText}>
              {routine.estimatedDuration || 0}m
            </Text>
          </View>
          {!!routine.timesCompleted && (
            <View style={styles.metaPill}>
              <Ionicons name="checkmark-circle-outline" size={12} color="#FFFFFF" />
              <Text style={styles.metaPillText}>{routine.timesCompleted}</Text>
            </View>
          )}
        </View>
        {primaryMuscles.length > 0 && (
          <View style={styles.muscleRow}>
            {primaryMuscles.map((m, i) => (
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
    heroBackButton: {
      width: 42,
      height: 42,
      borderRadius: 14,
      backgroundColor: "rgba(255,255,255,0.16)",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(255,255,255,0.24)",
      zIndex: 2,
    },
    pressed: {
      opacity: 0.85,
      transform: [{ scale: 0.96 }],
    },
    scrollContent: {
      paddingTop: 0,
    },
    // Hero
    hero: {
      marginHorizontal: 0,
      borderRadius: 0,
      overflow: "hidden",
      justifyContent: "space-between",
      paddingBottom: 22,
      paddingHorizontal: 22,
      minHeight: 220,
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
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 20,
      marginTop: 18,
    },
    searchBox: {
      flex: 1,
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
    viewToggle: {
      flexDirection: "row",
      padding: 4,
      borderRadius: 16,
      backgroundColor: NAVY_CARD,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.14)",
      borderBottomWidth: 3,
      borderBottomColor: "rgba(0,0,0,0.22)",
    },
    viewToggleButton: {
      width: 34,
      height: 34,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    viewToggleButtonActive: {
      backgroundColor: NAVY_CARD_LIGHT,
    },
    // Grid
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      paddingHorizontal: GRID_PADDING,
      gap: GRID_GAP,
      paddingTop: 14,
    },
    list: {
      paddingHorizontal: 20,
      paddingTop: 14,
      gap: 10,
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
      padding: 14,
      backgroundColor: NAVY_CARD,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.14)",
      borderBottomWidth: 3,
      borderBottomColor: "rgba(0,0,0,0.24)",
      ...surfaceShadow,
    },
    body: {
      gap: 12,
    },
    cardTopRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 8,
    },
    name: {
      flex: 1,
      minHeight: 40,
      fontSize: 15,
      lineHeight: 20,
      fontFamily: FONTS.extraBold,
      color: "#FFFFFF",
    },
    statGrid: {
      flexDirection: "row",
      gap: 8,
    },
    statBox: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 9,
      borderRadius: 12,
      backgroundColor: NAVY_CARD_DEEP,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(255,255,255,0.12)",
    },
    statValue: {
      fontSize: 17,
      fontFamily: FONTS.extraBold,
      color: "#FFFFFF",
    },
    statLabel: {
      fontSize: 10,
      fontFamily: FONTS.bold,
      color: NAVY_TEXT_MUTED,
      marginTop: 2,
      textTransform: "uppercase",
    },
    muscleRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 5,
    },
    muscle: {
      fontSize: 10,
      color: NAVY_TEXT_MUTED,
      fontFamily: FONTS.semiBold,
      textTransform: "capitalize",
      backgroundColor: "rgba(255,255,255,0.09)",
      paddingHorizontal: 7,
      paddingVertical: 4,
      borderRadius: 7,
      overflow: "hidden",
    },
    cardFooter: {
      gap: 6,
    },
    footerText: {
      fontSize: 10,
      fontFamily: FONTS.bold,
      color: NAVY_TEXT_MUTED,
      textTransform: "uppercase",
    },
    footerLine: {
      height: 4,
      borderRadius: 2,
      overflow: "hidden",
      backgroundColor: "rgba(255,255,255,0.12)",
    },
    footerLineFill: {
      height: "100%",
      borderRadius: 2,
      backgroundColor: "#FFFFFF",
    },
  });

const listCardStyles = () =>
  StyleSheet.create({
    card: {
      flexDirection: "row",
      alignItems: "center",
      minHeight: 86,
      padding: 14,
      borderRadius: 18,
      backgroundColor: NAVY_CARD,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.14)",
      borderBottomWidth: 3,
      borderBottomColor: "rgba(0,0,0,0.24)",
      ...surfaceShadow,
    },
    content: {
      flex: 1,
      minWidth: 0,
      gap: 8,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    name: {
      flex: 1,
      fontSize: 16,
      fontFamily: FONTS.extraBold,
      color: "#FFFFFF",
    },
    metaRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
    },
    metaPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 10,
      backgroundColor: "rgba(255,255,255,0.10)",
    },
    metaPillText: {
      fontSize: 11,
      fontFamily: FONTS.bold,
      color: "#FFFFFF",
    },
    muscleRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 5,
    },
    muscle: {
      fontSize: 10,
      color: NAVY_TEXT_MUTED,
      fontFamily: FONTS.semiBold,
      textTransform: "capitalize",
      backgroundColor: "rgba(255,255,255,0.09)",
      paddingHorizontal: 7,
      paddingVertical: 4,
      borderRadius: 7,
      overflow: "hidden",
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

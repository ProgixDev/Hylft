import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
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
import AnimatedScreen from "../../components/ui/AnimatedScreen";
import AnimatedSection from "../../components/ui/AnimatedSection";
import RoutineCard from "../../components/ui/RoutineCard";
import { FONTS } from "../../constants/fonts";
import { Theme } from "../../constants/themes";
import { useActiveWorkout } from "../../contexts/ActiveWorkoutContext";
import { useCreateRoutine } from "../../contexts/CreateRoutineContext";
import { useTheme } from "../../contexts/ThemeContext";
import {
  getWorkoutsByUserId,
  Routine,
  Workout as WorkoutData,
} from "../../data/mockData";
import { useGenderedImages } from "../../hooks/useGenderedImages";
import { api } from "../../services/api";
import { ApiRoutine, mapRoutine } from "../../utils/routineMapper";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const ROUTINE_CARD_W = SCREEN_WIDTH * 0.65;

const diffColors: Record<string, { bg: string; text: string }> = {
  beginner: { bg: "#4CAF5030", text: "#4CAF50" },
  intermediate: { bg: "#FF980030", text: "#FF9800" },
  advanced: { bg: "#F4433630", text: "#F44336" },
};

const surfaceShadow = Platform.select({
  ios: {
    shadowColor: "#000000",
    shadowOpacity: 0.15,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
  android: { elevation: 6 },
  default: {},
});

export default function Workout() {
  const { t } = useTranslation();
  const { theme, themeType } = useTheme();
  const genderedImages = useGenderedImages();
  const router = useRouter();
  const styles = createStyles(theme);
  const routineImages = genderedImages.routine;

  const [workouts, setWorkouts] = useState<WorkoutData[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const { startWorkout, startGuidedRoutine } = useActiveWorkout();
  const { initCreation } = useCreateRoutine();
  const scrollRef = useRef<ScrollView | null>(null);

  const loadData = useCallback(async () => {
    setWorkouts(getWorkoutsByUserId("1"));
    try {
      const res = (await api.getRoutines()) as ApiRoutine[];
      setRoutines((res ?? []).map(mapRoutine));
    } catch (error) {
      console.warn("[Workout] load routines failed:", error);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { addWorkoutsListener } = require("../../data/mockData");
    const unsub = addWorkoutsListener(() => loadData());
    return () => unsub();
  }, [loadData]);

  const handleCreateRoutine = () => {
    initCreation();
    router.push("/create-routine" as any);
  };

  const handleStartEmptyWorkout = () => {
    startWorkout({
      id: `workout-${Date.now()}`,
      duration: 0,
      volume: 0,
      sets: 0,
      exercises: [],
    });
  };

  const handleStartRoutine = (routine: Routine) => {
    startGuidedRoutine(routine);
    router.push("/workout-player" as any);
  };

  // Stats
  const totalWorkouts = workouts.length;
  const totalMinutes = workouts.reduce((s, w) => s + w.duration, 0);
  const totalExercises = workouts.reduce((s, w) => s + w.exercises.length, 0);

  return (
    <AnimatedScreen style={styles.container}>
      {themeType === "female" && (
        <Image
          source={require("../../../assets/girly.png")}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: "100%",
            height: "100%",
            opacity: 0.3,
          }}
          resizeMode="cover"
        />
      )}
      {/* Header */}
      <AnimatedSection delay={0}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t("workout.title")}</Text>
      </View>
      </AnimatedSection>

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 90 }}
      >
        {/* ── Quick Start Hero ──────────────────────────────── */}
        <AnimatedSection delay={80} scale>
        <Pressable
          style={({ pressed }) => [
            styles.quickStartCard,
            pressed && { opacity: 0.95, transform: [{ scale: 0.99 }] },
          ]}
          onPress={handleStartEmptyWorkout}
        >
          <Image
            source={routineImages[0]}
            style={styles.quickStartImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={["rgba(0,0,0,0.2)", theme.primary.main + "DD"]}
            style={styles.quickStartGradient}
          />
          <View style={styles.quickStartContent}>
            <View style={styles.quickStartBadge}>
              <Ionicons name="flash" size={14} color="#FFD700" />
              <Text style={styles.quickStartBadgeText}>QUICK START</Text>
            </View>
            <Text style={styles.quickStartTitle}>
              {t("workout.startEmptyWorkout")}
            </Text>
            <Text style={styles.quickStartSub}>
              {t("workout.addExerciseToStart")}
            </Text>
            <View style={styles.quickStartBtn}>
              <Ionicons name="play" size={16} color={theme.primary.main} />
              <Text style={styles.quickStartBtnText}>GO</Text>
            </View>
          </View>
        </Pressable>
        </AnimatedSection>

        {/* ── My Routines ────────────────────────────────────── */}
        <AnimatedSection delay={180}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>{t("workout.myRoutines")}</Text>
          {routines.length > 0 && (
            <Pressable
              onPress={() => router.push("/routines" as any)}
              style={({ pressed }) => pressed && { opacity: 0.7 }}
            >
              <Text style={styles.moreLink}>
                {t("workout.viewAll")} {">"}
              </Text>
            </Pressable>
          )}
        </View>
        </AnimatedSection>

        <AnimatedSection delay={240} direction="left" offset={40}>
        {routines.length === 0 ? (
          <Pressable
            onPress={handleCreateRoutine}
            style={({ pressed }) => [
              styles.routinesEmpty,
              pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
            ]}
          >
            <Ionicons
              name="bookmark-outline"
              size={28}
              color={theme.primary.main}
            />
            <Text style={styles.routinesEmptyTitle}>
              {t("workout.noRoutinesYet")}
            </Text>
            <View style={styles.routinesEmptyBtn}>
              <Ionicons name="add" size={14} color={theme.background.dark} />
              <Text style={styles.routinesEmptyBtnText}>
                {t("workout.createFirstRoutine")}
              </Text>
            </View>
          </Pressable>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.routinesScroll}
          >
            {routines.slice(0, 6).map((routine) => (
              <RoutineCard
                key={routine.id}
                routine={routine}
                onPress={() => router.push(`/routines/${routine.id}` as any)}
                onStart={() => handleStartRoutine(routine)}
              />
            ))}
          </ScrollView>
        )}
        </AnimatedSection>

        {/* ── Recent Workouts ───────────────────────────────── */}
        {workouts.length > 0 && (
          <>
            <AnimatedSection delay={320}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>
                {t("workout.recentWorkouts")}
              </Text>
              <Pressable
                onPress={() => router.push("/workouts" as any)}
                style={({ pressed }) => pressed && { opacity: 0.7 }}
              >
                <Text style={styles.moreLink}>
                  {t("home.more")} {">"}
                </Text>
              </Pressable>
            </View>
            </AnimatedSection>

            <AnimatedSection delay={380} direction="left" offset={40}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recentScroll}
            >
              {workouts.slice(0, 5).map((workout, index) => (
                <Pressable
                  key={workout.id}
                  style={({ pressed }) => [
                    styles.recentCard,
                    pressed && { opacity: 0.95, transform: [{ scale: 0.98 }] },
                  ]}
                  onPress={() => router.push(`/workouts/${workout.id}` as any)}
                >
                  <Image
                    source={routineImages[(index + 1) % routineImages.length]}
                    style={styles.recentCardImage}
                    resizeMode="cover"
                  />
                  <LinearGradient
                    colors={["transparent", "rgba(0,0,0,0.75)"]}
                    style={styles.recentCardGradient}
                  />
                  <View style={styles.recentCardContent}>
                    <Text style={styles.recentCardName} numberOfLines={1}>
                      {workout.name}
                    </Text>
                    <View style={styles.recentCardMeta}>
                      <Ionicons
                        name="time-outline"
                        size={11}
                        color="rgba(255,255,255,0.7)"
                      />
                      <Text style={styles.recentCardMetaText}>
                        {workout.duration} min
                      </Text>
                      <Text style={styles.recentCardMetaText}>·</Text>
                      <Ionicons
                        name="barbell-outline"
                        size={11}
                        color="rgba(255,255,255,0.7)"
                      />
                      <Text style={styles.recentCardMetaText}>
                        {workout.exercises.length}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
            </AnimatedSection>
          </>
        )}

        {/* ── Create Routine CTA ─────────────────────────────── */}
        <AnimatedSection delay={460}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>{t("home.customWorkout")}</Text>
        </View>
        </AnimatedSection>
        <AnimatedSection delay={520} scale>
        <Pressable
          style={({ pressed }) => [
            styles.createCard,
            pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
          ]}
          onPress={handleCreateRoutine}
        >
          <LinearGradient
            colors={
              themeType === "dark"
                ? ["#CFA44A", "#A97B2C"]
                : [theme.primary.light, theme.primary.main]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.createGradient}
          >
            <View style={styles.createContent}>
              <Text style={styles.createTitle}>
                {t("workout.createRoutine")}
              </Text>
              <Text style={styles.createSub}>
                {t("workout.browseCommunityTemplates")}
              </Text>
              <View style={styles.createBtn}>
                <Text
                  style={[
                    styles.createBtnText,
                    themeType === "dark" && { color: "#A97B2C" },
                    themeType !== "dark" && { color: theme.primary.main },
                  ]}
                >
                  GO
                </Text>
              </View>
            </View>
            <MaterialCommunityIcons
              name="dumbbell"
              size={64}
              color="rgba(255,255,255,0.12)"
              style={{ marginRight: 10 }}
            />
          </LinearGradient>
        </Pressable>
        </AnimatedSection>

        {/* ── Explore Banner ────────────────────────────────── */}
        <AnimatedSection delay={620} scale>
        <Pressable
          style={({ pressed }) => [
            styles.exploreCard,
            pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
          ]}
          onPress={() => router.push("/explore-routines" as any)}
        >
          <Image
            source={routineImages[4]}
            style={styles.exploreImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.75)"]}
            style={styles.exploreGradient}
          />
          <View style={styles.exploreContent}>
            <Ionicons name="compass" size={22} color="#FFD700" />
            <Text style={styles.exploreTitle}>
              {t("workout.exploreRoutines")}
            </Text>
            <Text style={styles.exploreSub}>
              {t("workout.browseCommunityTemplates")}
            </Text>
          </View>
        </Pressable>
        </AnimatedSection>
      </ScrollView>
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

    // Header
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
    addBtn: {
      width: 40,
      height: 40,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.background.darker,
    },

    // Stats Strip
    statsStrip: {
      marginHorizontal: 20,
      marginBottom: 16,
      borderRadius: 18,
      overflow: "hidden",
      ...surfaceShadow,
    },
    statsStripGradient: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 14,
      paddingHorizontal: 8,
    },
    statsStripItem: {
      flex: 1,
      alignItems: "center",
      gap: 2,
    },
    statsStripValue: {
      fontFamily: FONTS.extraBold,
      fontSize: 22,
    },
    statsStripLabel: {
      fontFamily: FONTS.medium,
      fontSize: 11,
      color: theme.foreground.gray,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    statsStripDivider: {
      width: StyleSheet.hairlineWidth,
      height: 30,
      backgroundColor: theme.foreground.gray + "40",
    },

    // Routines (carousel + empty)
    routinesScroll: {
      paddingLeft: 20,
      paddingRight: 6,
      paddingBottom: 24,
    },
    routinesEmpty: {
      marginHorizontal: 20,
      marginBottom: 24,
      paddingVertical: 26,
      paddingHorizontal: 20,
      borderRadius: 18,
      backgroundColor: theme.background.darker,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.primary.main + "30",
      alignItems: "center",
      gap: 10,
    },
    routinesEmptyTitle: {
      fontFamily: FONTS.semiBold,
      fontSize: 14,
      color: theme.foreground.gray,
      textAlign: "center",
    },
    routinesEmptyBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: theme.primary.main,
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 18,
      marginTop: 4,
    },
    routinesEmptyBtnText: {
      fontFamily: FONTS.bold,
      fontSize: 12,
      color: theme.background.dark,
    },

    // Quick Start Hero
    quickStartCard: {
      marginHorizontal: 20,
      height: 200,
      borderRadius: 22,
      overflow: "hidden",
      marginBottom: 20,
    },
    quickStartImage: {
      width: "100%",
      height: "100%",
      position: "absolute",
    },
    quickStartGradient: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      height: "100%",
    },
    quickStartContent: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      padding: 20,
    },
    quickStartBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      alignSelf: "flex-start",
      marginBottom: 6,
    },
    quickStartBadgeText: {
      fontFamily: FONTS.bold,
      fontSize: 11,
      color: "#FFD700",
      letterSpacing: 1,
    },
    quickStartTitle: {
      fontFamily: FONTS.extraBold,
      fontSize: 20,
      color: "#fff",
      marginBottom: 4,
    },
    quickStartSub: {
      fontFamily: FONTS.regular,
      fontSize: 12,
      color: "rgba(255,255,255,0.7)",
      marginBottom: 14,
    },
    quickStartBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      backgroundColor: "#fff",
      borderRadius: 24,
      paddingVertical: 10,
      paddingHorizontal: 28,
      alignSelf: "flex-start",
    },
    quickStartBtnText: {
      fontFamily: FONTS.bold,
      fontSize: 14,
      color: theme.primary.main,
    },

    // Stats
    statsCard: {
      marginHorizontal: 20,
      backgroundColor: theme.background.darker,
      borderRadius: 18,
      paddingVertical: 16,
      paddingHorizontal: 10,
      marginBottom: 24,
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

    // Section Header
    sectionHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      marginBottom: 14,
    },
    sectionTitle: {
      fontFamily: FONTS.bold,
      fontSize: 18,
      color: theme.foreground.white,
    },
    moreLink: {
      fontFamily: FONTS.semiBold,
      fontSize: 14,
      color: theme.primary.main,
    },

    // Empty
    emptyState: {
      alignItems: "center",
      paddingVertical: 30,
      paddingHorizontal: 20,
      gap: 10,
      marginBottom: 20,
    },
    emptyStateText: {
      fontFamily: FONTS.medium,
      fontSize: 14,
      color: theme.foreground.gray,
      textAlign: "center",
    },

    // Routine Cards
    routineScroll: {
      paddingLeft: 20,
      paddingRight: 6,
      paddingBottom: 24,
    },
    routineCard: {
      width: ROUTINE_CARD_W,
      height: 220,
      borderRadius: 20,
      overflow: "hidden",
      marginRight: 14,
      backgroundColor: theme.background.accent,
    },
    routineCardImage: {
      width: "100%",
      height: "100%",
      position: "absolute",
    },
    routineCardGradient: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      height: "70%",
    },
    routineDiffBadge: {
      position: "absolute",
      top: 12,
      left: 12,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    routineDiffText: {
      fontFamily: FONTS.bold,
      fontSize: 10,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    routineCardContent: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      padding: 14,
    },
    routineCardName: {
      fontFamily: FONTS.bold,
      fontSize: 16,
      color: "#fff",
      marginBottom: 2,
    },
    routineCardDesc: {
      fontFamily: FONTS.regular,
      fontSize: 12,
      color: "rgba(255,255,255,0.7)",
      marginBottom: 8,
    },
    routineCardMeta: {
      flexDirection: "row",
      gap: 12,
    },
    routineMetaItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    routineMetaText: {
      fontFamily: FONTS.medium,
      fontSize: 11,
      color: "rgba(255,255,255,0.7)",
    },

    // Recent Workouts
    recentScroll: {
      paddingLeft: 20,
      paddingRight: 6,
      paddingBottom: 24,
    },
    recentCard: {
      width: SCREEN_WIDTH * 0.42,
      height: 160,
      borderRadius: 16,
      overflow: "hidden",
      marginRight: 12,
      backgroundColor: theme.background.accent,
    },
    recentCardImage: {
      width: "100%",
      height: "100%",
      position: "absolute",
    },
    recentCardGradient: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      height: "60%",
    },
    recentCardContent: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      padding: 12,
    },
    recentCardName: {
      fontFamily: FONTS.bold,
      fontSize: 13,
      color: "#fff",
      marginBottom: 4,
    },
    recentCardMeta: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    recentCardMetaText: {
      fontFamily: FONTS.regular,
      fontSize: 10,
      color: "rgba(255,255,255,0.7)",
    },

    // Create Routine
    createCard: {
      marginHorizontal: 20,
      borderRadius: 20,
      overflow: "hidden",
      marginBottom: 20,
    },
    createGradient: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 22,
      minHeight: 130,
    },
    createContent: {
      flex: 1,
    },
    createTitle: {
      fontFamily: FONTS.extraBold,
      fontSize: 20,
      color: "#fff",
      lineHeight: 24,
      marginBottom: 4,
    },
    createSub: {
      fontFamily: FONTS.regular,
      fontSize: 12,
      color: "rgba(255,255,255,0.7)",
      marginBottom: 14,
    },
    createBtn: {
      backgroundColor: "#fff",
      borderRadius: 22,
      paddingVertical: 8,
      paddingHorizontal: 24,
      alignSelf: "flex-start",
    },
    createBtnText: {
      fontFamily: FONTS.bold,
      fontSize: 14,
      color: "#6C63FF",
    },

    // Explore
    exploreCard: {
      marginHorizontal: 20,
      height: 140,
      borderRadius: 20,
      overflow: "hidden",
      marginBottom: 10,
    },
    exploreImage: {
      width: "100%",
      height: "100%",
      position: "absolute",
    },
    exploreGradient: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      height: "100%",
    },
    exploreContent: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      padding: 18,
    },
    exploreTitle: {
      fontFamily: FONTS.bold,
      fontSize: 17,
      color: "#fff",
      marginTop: 6,
    },
    exploreSub: {
      fontFamily: FONTS.regular,
      fontSize: 12,
      color: "rgba(255,255,255,0.7)",
      marginTop: 2,
    },
  });
}

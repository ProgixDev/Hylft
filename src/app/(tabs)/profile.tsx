import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Theme } from "../../constants/themes";
import { useTheme } from "../../contexts/ThemeContext";
import { translateRoutineName } from "../../utils/exerciseTranslator";
import {
  getPostsByUserId,
  getRoutinesByUserId,
  getUserById,
  getWorkoutsByUserId,
  Post,
  Routine,
  User,
  Workout,
} from "../../data/mockData";

// The currently authenticated user
const MY_USER_ID = "1";

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background.dark,
    },
    // ── Header ──────────────────────────────────────
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.background.accent,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: theme.foreground.white,
    },
    headerActions: {
      flexDirection: "row",
      gap: 4,
    },
    iconBtn: {
      padding: 8,
    },
    // ── Profile hero ─────────────────────────────────
    hero: {
      alignItems: "center",
      paddingTop: 28,
      paddingBottom: 20,
      paddingHorizontal: 16,
    },
    avatarWrapper: {
      position: "relative",
      marginBottom: 14,
    },
    avatar: {
      width: 96,
      height: 96,
      borderRadius: 48,
      borderWidth: 3,
      borderColor: theme.primary.main,
    },
    avatarEditBadge: {
      position: "absolute",
      bottom: 2,
      right: 2,
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: theme.primary.main,
      alignItems: "center",
      justifyContent: "center",
    },
    username: {
      fontSize: 20,
      fontWeight: "700",
      color: theme.foreground.white,
      marginBottom: 6,
    },
    bio: {
      fontSize: 14,
      color: theme.foreground.gray,
      textAlign: "center",
      lineHeight: 20,
      paddingHorizontal: 20,
      marginBottom: 18,
    },
    // ── Social stats ─────────────────────────────────
    statsRow: {
      flexDirection: "row",
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: theme.background.accent,
      marginHorizontal: 0,
    },
    statBox: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 16,
    },
    statDivider: {
      width: 1,
      backgroundColor: theme.background.accent,
      alignSelf: "stretch",
    },
    statNumber: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.foreground.white,
    },
    statLabel: {
      fontSize: 12,
      color: theme.foreground.gray,
      marginTop: 3,
    },
    // ── Fitness stats strip ──────────────────────────
    fitnessStrip: {
      flexDirection: "row",
      marginHorizontal: 16,
      marginTop: 20,
      marginBottom: 4,
      borderRadius: 12,
      backgroundColor: theme.background.accent,
      overflow: "hidden",
    },
    fitnessCard: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 14,
      paddingHorizontal: 4,
    },
    fitnessDivider: {
      width: 1,
      backgroundColor: theme.background.darker,
      alignSelf: "stretch",
    },
    fitnessIcon: {
      marginBottom: 4,
    },
    fitnessValue: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.primary.main,
    },
    fitnessLabel: {
      fontSize: 10,
      color: theme.foreground.gray,
      marginTop: 2,
      textAlign: "center",
    },
    // ── Tab switcher ─────────────────────────────────
    tabBar: {
      flexDirection: "row",
      marginTop: 20,
      borderBottomWidth: 1,
      borderColor: theme.background.accent,
    },
    tab: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 12,
      borderBottomWidth: 2,
      borderBottomColor: "transparent",
    },
    tabActive: {
      borderBottomColor: theme.primary.main,
    },
    tabText: {
      fontSize: 13,
      fontWeight: "600",
      color: theme.foreground.gray,
    },
    tabTextActive: {
      color: theme.primary.main,
    },
    // ── Posts grid ───────────────────────────────────
    postsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 3,
      padding: 3,
    },
    gridItem: {
      width: "32.5%",
      aspectRatio: 1,
      borderRadius: 6,
      overflow: "hidden",
    },
    gridImage: {
      width: "100%",
      height: "100%",
    },
    multipleIndicator: {
      position: "absolute",
      top: 6,
      right: 6,
    },
    // ── Empty states ─────────────────────────────────
    emptyState: {
      alignItems: "center",
      paddingVertical: 60,
    },
    emptyText: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.foreground.white,
      marginTop: 14,
      marginBottom: 6,
    },
    emptySubtext: {
      fontSize: 13,
      color: theme.foreground.gray,
      textAlign: "center",
      paddingHorizontal: 32,
    },
    // ── Routines list ─────────────────────────────────
    routinesList: {
      padding: 16,
      gap: 12,
    },
    routineCard: {
      backgroundColor: theme.background.accent,
      borderRadius: 12,
      padding: 16,
    },
    routineHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: 10,
    },
    routineInfo: {
      flex: 1,
    },
    routineName: {
      fontSize: 15,
      fontWeight: "700",
      color: theme.foreground.white,
      marginBottom: 3,
    },
    routineDesc: {
      fontSize: 12,
      color: theme.foreground.gray,
      lineHeight: 17,
    },
    difficultyBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 20,
      marginLeft: 10,
    },
    difficultyText: {
      fontSize: 11,
      fontWeight: "600",
    },
    routineMeta: {
      flexDirection: "row",
      gap: 16,
    },
    routineMetaItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
    },
    routineMetaText: {
      fontSize: 12,
      color: theme.foreground.gray,
    },
    muscleTagsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
      marginTop: 10,
    },
    muscleTag: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 20,
      backgroundColor: theme.background.darker,
    },
    muscleTagText: {
      fontSize: 11,
      color: theme.foreground.gray,
      textTransform: "capitalize",
    },
  });
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatCount(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return `${n}`;
}

function difficultyColor(
  d: Routine["difficulty"],
  theme: Theme,
): { bg: string; text: string } {
  if (d === "beginner") return { bg: "#1a3a2a", text: "#4ade80" };
  if (d === "intermediate") return { bg: "#2a2a10", text: theme.primary.main };
  return { bg: "#3a1a1a", text: "#f87171" };
}

function calcTotalVolume(workouts: Workout[]): string {
  const total = workouts.reduce(
    (sum, w) =>
      sum +
      w.exercises.reduce((es, e) => {
        const kg = parseFloat(e.weight?.replace(/[^0-9.]/g, "") || "0");
        const reps = parseInt(e.reps.split("-")[0]) || 0;
        return es + kg * e.sets * reps;
      }, 0),
    0,
  );
  if (total >= 1000) return `${(total / 1000).toFixed(1)}k`;
  return `${Math.round(total)}`;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function Profile() {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const router = useRouter();
  const styles = createStyles(theme);

  const [activeTab, setActiveTab] = useState<"posts" | "routines">("posts");
  const [user, setUser] = useState<User | undefined>(() =>
    getUserById(MY_USER_ID),
  );
  const [posts, setPosts] = useState<Post[]>(() =>
    getPostsByUserId(MY_USER_ID),
  );
  const [workouts, setWorkouts] = useState<Workout[]>(() =>
    getWorkoutsByUserId(MY_USER_ID),
  );
  const [routines, setRoutines] = useState<Routine[]>(() =>
    getRoutinesByUserId(MY_USER_ID),
  );

  useFocusEffect(
    useCallback(() => {
      setUser(getUserById(MY_USER_ID));
      setPosts(getPostsByUserId(MY_USER_ID));
      setWorkouts(getWorkoutsByUserId(MY_USER_ID));
      setRoutines(getRoutinesByUserId(MY_USER_ID));
    }, []),
  );

  if (!user) return null;

  const totalVolume = calcTotalVolume(workouts);

  // ── render helpers ──────────────────────────────────────────────────────────

  const renderPostsGrid = () => {
    if (posts.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons
            name="image-outline"
            size={58}
            color={theme.foreground.gray}
          />
          <Text style={styles.emptyText}>{t("profile.noPostsYet")}</Text>
          <Text style={styles.emptySubtext}>
            {t("profile.shareFirstWorkout")}
          </Text>
        </View>
      );
    }
    return (
      <View style={styles.postsGrid}>
        {posts.map((post, index) => (
          <TouchableOpacity
            key={post.id}
            style={styles.gridItem}
            activeOpacity={0.85}
            onPress={() =>
              router.navigate(
                `/user/posts?userId=${MY_USER_ID}&postIndex=${index}` as any,
              )
            }
          >
            <Image
              source={{ uri: post.images[0] }}
              style={styles.gridImage}
              resizeMode="cover"
            />
            {post.images.length > 1 && (
              <View style={styles.multipleIndicator}>
                <Ionicons
                  name="copy-outline"
                  size={14}
                  color={theme.foreground.white}
                />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderRoutinesList = () => {
    if (routines.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons
            name="barbell-outline"
            size={58}
            color={theme.foreground.gray}
          />
          <Text style={styles.emptyText}>{t("profile.noRoutinesYet")}</Text>
          <Text style={styles.emptySubtext}>
            {t("profile.createFirstRoutine")}
          </Text>
        </View>
      );
    }
    return (
      <View style={styles.routinesList}>
        {routines.map((routine) => {
          const colors = difficultyColor(routine.difficulty, theme);
          return (
            <TouchableOpacity
              key={routine.id}
              style={styles.routineCard}
              activeOpacity={0.8}
              onPress={() => router.navigate(`/routines/${routine.id}` as any)}
            >
              {/* name + difficulty */}
              <View style={styles.routineHeader}>
                <View style={styles.routineInfo}>
                  <Text style={styles.routineName}>
                    {i18n.language === "fr" ? translateRoutineName(routine.name) : routine.name}
                  </Text>
                  <Text style={styles.routineDesc} numberOfLines={2}>
                    {routine.description}
                  </Text>
                </View>
                <View
                  style={[
                    styles.difficultyBadge,
                    { backgroundColor: colors.bg },
                  ]}
                >
                  <Text style={[styles.difficultyText, { color: colors.text }]}>
                    {routine.difficulty}
                  </Text>
                </View>
              </View>

              {/* meta row */}
              <View style={styles.routineMeta}>
                <View style={styles.routineMetaItem}>
                  <Ionicons
                    name="time-outline"
                    size={14}
                    color={theme.foreground.gray}
                  />
                  <Text style={styles.routineMetaText}>
                    {routine.estimatedDuration} min
                  </Text>
                </View>
                <View style={styles.routineMetaItem}>
                  <Ionicons
                    name="barbell-outline"
                    size={14}
                    color={theme.foreground.gray}
                  />
                  <Text style={styles.routineMetaText}>
                    {routine.exercises.length} {t("profile.exercises")}
                  </Text>
                </View>
                <View style={styles.routineMetaItem}>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={14}
                    color={theme.foreground.gray}
                  />
                  <Text style={styles.routineMetaText}>
                    {routine.timesCompleted}× {t("profile.done")}
                  </Text>
                </View>
              </View>

              {/* muscle tags */}
              {routine.targetMuscles.length > 0 && (
                <View style={styles.muscleTagsRow}>
                  {routine.targetMuscles.map((m) => (
                    <View key={m} style={styles.muscleTag}>
                      <Text style={styles.muscleTagText}>{m}</Text>
                    </View>
                  ))}
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  // ── JSX ─────────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{user.username}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.push("/settings" as any)}
          >
            <Ionicons
              name="settings-outline"
              size={24}
              color={theme.foreground.white}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* ── Hero ── */}
        <View style={styles.hero}>
          <TouchableOpacity activeOpacity={0.9} style={styles.avatarWrapper}>
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
            <View style={styles.avatarEditBadge}>
              <Ionicons name="camera" size={14} color={theme.background.dark} />
            </View>
          </TouchableOpacity>
          <Text style={styles.username}>{user.username}</Text>
          <Text style={styles.bio}>{user.bio}</Text>
        </View>

        {/* ── Social stats ── */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{user.postsCount}</Text>
            <Text style={styles.statLabel}>{t("profile.posts")}</Text>
          </View>
          <View style={styles.statDivider} />
          <TouchableOpacity
            style={styles.statBox}
            activeOpacity={0.7}
            onPress={() =>
              router.push(`/user/follows/${user.id}?type=followers` as any)
            }
          >
            <Text style={styles.statNumber}>{formatCount(user.followers)}</Text>
            <Text style={styles.statLabel}>{t("profile.followers")}</Text>
          </TouchableOpacity>
          <View style={styles.statDivider} />
          <TouchableOpacity
            style={styles.statBox}
            activeOpacity={0.7}
            onPress={() =>
              router.push(`/user/follows/${user.id}?type=following` as any)
            }
          >
            <Text style={styles.statNumber}>{formatCount(user.following)}</Text>
            <Text style={styles.statLabel}>{t("profile.following")}</Text>
          </TouchableOpacity>
        </View>

        {/* ── Fitness stats strip ── */}
        <View style={styles.fitnessStrip}>
          <View style={styles.fitnessCard}>
            <Ionicons
              name="flame-outline"
              size={20}
              color={theme.primary.main}
              style={styles.fitnessIcon}
            />
            <Text style={styles.fitnessValue}>{workouts.length}</Text>
            <Text style={styles.fitnessLabel}>{t("profile.workouts")}</Text>
          </View>
          <View style={styles.fitnessDivider} />
          <View style={styles.fitnessCard}>
            <Ionicons
              name="barbell-outline"
              size={20}
              color={theme.primary.main}
              style={styles.fitnessIcon}
            />
            <Text style={styles.fitnessValue}>{totalVolume} kg</Text>
            <Text style={styles.fitnessLabel}>{t("profile.totalVolume")}</Text>
          </View>
          <View style={styles.fitnessDivider} />
          <View style={styles.fitnessCard}>
            <Ionicons
              name="calendar-outline"
              size={20}
              color={theme.primary.main}
              style={styles.fitnessIcon}
            />
            <Text style={styles.fitnessValue}>{routines.length}</Text>
            <Text style={styles.fitnessLabel}>{t("profile.routines")}</Text>
          </View>
          <View style={styles.fitnessDivider} />
          <View style={styles.fitnessCard}>
            <Ionicons
              name="trophy-outline"
              size={20}
              color={theme.primary.main}
              style={styles.fitnessIcon}
            />
            <Text style={styles.fitnessValue}>7</Text>
            <Text style={styles.fitnessLabel}>{t("profile.dayStreak")}</Text>
          </View>
        </View>

        {/* ── Tab bar ── */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "posts" && styles.tabActive]}
            onPress={() => setActiveTab("posts")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "posts" && styles.tabTextActive,
              ]}
            >
              {t("profile.posts")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "routines" && styles.tabActive]}
            onPress={() => setActiveTab("routines")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "routines" && styles.tabTextActive,
              ]}
            >
              {t("profile.routines")}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Tab content ── */}
        {activeTab === "posts" ? renderPostsGrid() : renderRoutinesList()}
      </ScrollView>
    </View>
  );
}

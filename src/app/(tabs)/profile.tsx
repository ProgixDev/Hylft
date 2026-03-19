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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Theme } from "../../constants/themes";
import { useTheme } from "../../contexts/ThemeContext";
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
import {
  translateApiData,
  translateExerciseTerm,
  translateRoutineDescription,
  translateRoutineName,
} from "../../utils/exerciseTranslator";

import { FONTS } from "../../constants/fonts";

// The currently authenticated user
const MY_USER_ID = "1";

const surfaceShadow = Platform.select({
  ios: {
    shadowColor: "#000000",
    shadowOpacity: 0.2,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  android: {
    elevation: 8,
  },
  default: {},
});

const controlShadow = Platform.select({
  ios: {
    shadowColor: "#000000",
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  android: {
    elevation: 4,
  },
  default: {},
});

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
      paddingHorizontal: 20,
      paddingTop: 6,
      paddingBottom: 4,
    },
    headerTitle: {
      fontSize: 22,
      fontFamily: FONTS.extraBold,
      color: theme.foreground.white,
      letterSpacing: -0.3,
    },
    iconBtn: {
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.background.accent,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(0,0,0,0.08)",
      ...controlShadow,
    },
    iconBtnPressed: {
      opacity: 0.9,
      transform: [{ scale: 0.96 }],
    },
    heroCard: {
      marginHorizontal: 20,
      marginTop: 4,
      borderRadius: 22,
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 14,
      backgroundColor: theme.background.accent,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(0,0,0,0.08)",
      overflow: "hidden",
      ...surfaceShadow,
    },
    heroGlow: {
      position: "absolute",
      width: 150,
      height: 150,
      borderRadius: 75,
      backgroundColor: theme.primary.main,
      opacity: 0.12,
      top: -60,
      right: -20,
    },
    hero: {
      alignItems: "center",
    },
    avatarButton: {
      position: "relative",
      marginBottom: 10,
      borderRadius: 46,
    },
    avatarButtonPressed: {
      opacity: 0.92,
      transform: [{ scale: 0.97 }],
    },
    avatarFrame: {
      padding: 3,
      borderRadius: 46,
      backgroundColor: "rgba(0,0,0,0.06)",
    },
    avatar: {
      width: 82,
      height: 82,
      borderRadius: 41,
      borderWidth: 2,
      borderColor: theme.primary.main,
      backgroundColor: theme.background.darker,
    },
    avatarEditBadge: {
      position: "absolute",
      bottom: 2,
      right: 2,
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: theme.foreground.white,
      alignItems: "center",
      justifyContent: "center",
      ...controlShadow,
    },
    username: {
      fontSize: 20,
      fontFamily: FONTS.bold,
      color: theme.foreground.white,
      marginBottom: 4,
      letterSpacing: -0.4,
    },
    bio: {
      fontSize: 12,
      color: theme.foreground.gray,
      textAlign: "center",
      lineHeight: 17,
      paddingHorizontal: 10,
      marginBottom: 12,
    },
    heroActions: {
      flexDirection: "row",
      justifyContent: "center",
    },
    primaryAction: {
      minHeight: 38,
      borderRadius: 19,
      paddingHorizontal: 16,
      backgroundColor: theme.primary.main,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 6,
      ...controlShadow,
    },
    primaryActionPressed: {
      opacity: 0.94,
      transform: [{ scale: 0.98 }],
    },
    primaryActionText: {
      fontSize: 13,
      fontFamily: FONTS.bold,
      color: theme.background.dark,
    },
    statsRow: {
      flexDirection: "row",
      gap: 8,
      marginHorizontal: 20,
      marginTop: 10,
    },
    statBox: {
      flex: 1,
      minHeight: 62,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 6,
      paddingVertical: 10,
      backgroundColor: theme.background.darker,
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(0,0,0,0.07)",
      ...surfaceShadow,
    },
    statBoxPressed: {
      opacity: 0.92,
      transform: [{ scale: 0.98 }],
    },
    statNumber: {
      fontSize: 16,
      fontFamily: FONTS.bold,
      color: theme.foreground.white,
      letterSpacing: -0.3,
    },
    statLabel: {
      fontSize: 11,
      color: theme.foreground.gray,
      marginTop: 2,
      textAlign: "center",
    },
    fitnessBar: {
      flexDirection: "row",
      marginTop: 12,
      paddingTop: 10,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: "rgba(0,0,0,0.08)",
      alignItems: "center",
    },
    fitnessStatItem: {
      flex: 1,
      alignItems: "center",
      gap: 3,
      paddingVertical: 2,
    },
    fitnessIconBadge: {
      width: 26,
      height: 26,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 1,
    },
    fitnessStatDivider: {
      width: StyleSheet.hairlineWidth,
      height: 32,
      backgroundColor: "rgba(0,0,0,0.08)",
    },
    fitnessValue: {
      fontSize: 15,
      fontFamily: FONTS.extraBold,
      letterSpacing: -0.4,
    },
    fitnessLabel: {
      fontSize: 9,
      color: theme.foreground.gray,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      textAlign: "center",
    },
    tabBar: {
      flexDirection: "row",
      marginHorizontal: 20,
      marginTop: 12,
      padding: 3,
      borderRadius: 16,
      backgroundColor: theme.background.accent,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(0,0,0,0.07)",
    },
    tab: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      minHeight: 34,
      borderRadius: 13,
    },
    tabActive: {
      backgroundColor: theme.background.darker,
      ...controlShadow,
    },
    tabPressed: {
      opacity: 0.92,
    },
    tabText: {
      fontSize: 12,
      fontFamily: FONTS.semiBold,
      color: theme.foreground.gray,
      letterSpacing: 0.1,
    },
    tabTextActive: {
      color: theme.foreground.white,
    },
    postsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 3,
      paddingHorizontal: 20,
      paddingTop: 12,
    },
    gridItem: {
      width: "32%",
      aspectRatio: 1,
      borderRadius: 12,
      overflow: "hidden",
      marginBottom: 3,
      backgroundColor: theme.background.accent,
    },
    gridItemPressed: {
      opacity: 0.94,
      transform: [{ scale: 0.98 }],
    },
    gridImage: {
      width: "100%",
      height: "100%",
    },
    multipleIndicator: {
      position: "absolute",
      top: 6,
      right: 6,
      borderRadius: 999,
      backgroundColor: "rgba(0,0,0,0.55)",
      paddingHorizontal: 5,
      paddingVertical: 3,
    },
    emptyState: {
      alignItems: "center",
      marginHorizontal: 20,
      marginTop: 12,
      borderRadius: 20,
      paddingVertical: 32,
      paddingHorizontal: 20,
      backgroundColor: theme.background.accent,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(0,0,0,0.07)",
      ...surfaceShadow,
    },
    emptyText: {
      fontSize: 15,
      fontFamily: FONTS.semiBold,
      color: theme.foreground.white,
      marginTop: 10,
      marginBottom: 4,
    },
    emptySubtext: {
      fontSize: 12,
      color: theme.foreground.gray,
      textAlign: "center",
      lineHeight: 17,
    },
    routinesList: {
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 4,
    },
    routineCard: {
      backgroundColor: theme.background.accent,
      borderRadius: 18,
      padding: 12,
      marginBottom: 8,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(0,0,0,0.08)",
      ...surfaceShadow,
    },
    routineCardPressed: {
      opacity: 0.94,
      transform: [{ scale: 0.985 }],
    },
    routineHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: 8,
    },
    routineInfo: {
      flex: 1,
      paddingRight: 10,
    },
    routineHeaderRight: {
      alignItems: "flex-end",
      gap: 8,
    },
    routineName: {
      fontSize: 14,
      fontFamily: FONTS.bold,
      color: theme.foreground.white,
      marginBottom: 3,
      letterSpacing: -0.3,
    },
    routineDesc: {
      fontSize: 12,
      color: theme.foreground.gray,
      lineHeight: 17,
    },
    difficultyBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 16,
    },
    difficultyText: {
      fontSize: 10,
      fontFamily: FONTS.bold,
    },
    routineChevron: {
      width: 26,
      height: 26,
      borderRadius: 13,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.background.darker,
    },
    routineMeta: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    routineMetaItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 5,
      borderRadius: 999,
      backgroundColor: theme.background.darker,
    },
    routineMetaText: {
      fontSize: 11,
      color: theme.foreground.gray,
    },
    muscleTagsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 5,
      marginTop: 8,
    },
    muscleTag: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: "rgba(0,0,0,0.05)",
    },
    muscleTagText: {
      fontSize: 10,
      color: theme.foreground.gray,
      textTransform: "capitalize",
    },
  });
}

// â”€â”€â”€ helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function formatCount(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return `${n}`;
}

function difficultyColor(
  d: Routine["difficulty"],
): { bg: string; text: string } {
  if (d === "beginner") return { bg: "#d1fae5", text: "#16a34a" };
  if (d === "intermediate") return { bg: "#fef3c7", text: "#d97706" };
  return { bg: "#fee2e2", text: "#dc2626" };
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

// â”€â”€â”€ Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function Profile() {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
  const goToEditProfile = () => router.push("/settings/edit-profile" as any);

  const renderSocialStat = (
    value: string,
    label: string,
    onPress?: () => void,
  ) => {
    const content = (
      <>
        <Text style={styles.statNumber}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </>
    );

    if (!onPress) {
      return <View style={styles.statBox}>{content}</View>;
    }

    return (
      <Pressable
        style={({ pressed }) => [
          styles.statBox,
          pressed && styles.statBoxPressed,
        ]}
        onPress={onPress}
        hitSlop={8}
      >
        {content}
      </Pressable>
    );
  };

  const renderPostsGrid = () => {
    if (posts.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons
            name="image-outline"
            size={44}
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
          <Pressable
            key={post.id}
            style={({ pressed }) => [
              styles.gridItem,
              pressed && styles.gridItemPressed,
            ]}
            onPress={() =>
              router.navigate(
                `/user/posts?userId=${MY_USER_ID}&postIndex=${index}` as any,
              )
            }
            hitSlop={4}
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
          </Pressable>
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
            size={44}
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
          const colors = difficultyColor(routine.difficulty);
          return (
            <Pressable
              key={routine.id}
              style={({ pressed }) => [
                styles.routineCard,
                pressed && styles.routineCardPressed,
              ]}
              onPress={() => router.navigate(`/routines/${routine.id}` as any)}
              hitSlop={6}
            >
              <View style={styles.routineHeader}>
                <View style={styles.routineInfo}>
                  <Text style={styles.routineName}>
                    {translateRoutineName(routine.name)}
                  </Text>
                  <Text style={styles.routineDesc} numberOfLines={2}>
                    {translateRoutineDescription(routine.description)}
                  </Text>
                </View>
                <View style={styles.routineHeaderRight}>
                  <View
                    style={[
                      styles.difficultyBadge,
                      { backgroundColor: colors.bg },
                    ]}
                  >
                    <Text
                      style={[styles.difficultyText, { color: colors.text }]}
                    >
                      {translateApiData(routine.difficulty)}
                    </Text>
                  </View>
                </View>
              </View>

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
                    {routine.timesCompleted} × {t("profile.done")}
                  </Text>
                </View>
              </View>

              {/* muscle tags */}
              {routine.targetMuscles.length > 0 && (
                <View style={styles.muscleTagsRow}>
                  {routine.targetMuscles.map((m) => (
                    <View key={m} style={styles.muscleTag}>
                      <Text style={styles.muscleTagText}>
                        {i18n.language === "fr"
                          ? translateExerciseTerm(m, "targetMuscles")
                          : m}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: 4,
          paddingBottom: Math.max(90, 24 + insets.bottom),
        }}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t("tabs.profile")}</Text>
          <Pressable
            style={({ pressed }) => [
              styles.iconBtn,
              pressed && styles.iconBtnPressed,
            ]}
            onPress={() => router.push("/settings" as any)}
            hitSlop={8}
          >
            <Ionicons
              name="settings-outline"
              size={20}
              color={theme.foreground.white}
            />
          </Pressable>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroGlow} />
          <View style={styles.hero}>
            <Pressable
              style={({ pressed }) => [
                styles.avatarButton,
                pressed && styles.avatarButtonPressed,
              ]}
              onPress={goToEditProfile}
              hitSlop={8}
            >
              <View style={styles.avatarFrame}>
                <Image source={{ uri: user.avatar }} style={styles.avatar} />
              </View>
              <View style={styles.avatarEditBadge}>
                <Ionicons
                  name="camera"
                  size={13}
                  color={theme.background.dark}
                />
              </View>
            </Pressable>
            <Text style={styles.username}>{user.username}</Text>
            <Text style={styles.bio}>{user.bio}</Text>
            <View style={styles.heroActions}>
              <Pressable
                style={({ pressed }) => [
                  styles.primaryAction,
                  pressed && styles.primaryActionPressed,
                ]}
                onPress={goToEditProfile}
                hitSlop={8}
              >
                <Ionicons
                  name="create-outline"
                  size={14}
                  color={theme.background.dark}
                />
                <Text style={styles.primaryActionText}>
                  {t("settings.editProfile")}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* â”€â”€ Fitness stat bar â”€â”€ */}
          <View style={styles.fitnessBar}>
            <View style={styles.fitnessStatItem}>
              <View
                style={[
                  styles.fitnessIconBadge,
                  { backgroundColor: "rgba(255,107,53,0.18)" },
                ]}
              >
                <Ionicons name="flame-outline" size={14} color="#FF6B35" />
              </View>
              <Text style={[styles.fitnessValue, { color: "#FF6B35" }]}>
                {workouts.length}
              </Text>
              <Text style={styles.fitnessLabel}>{t("profile.workouts")}</Text>
            </View>
            <View style={styles.fitnessStatItem}>
              <View
                style={[
                  styles.fitnessIconBadge,
                  { backgroundColor: theme.primary.main + "22" },
                ]}
              >
                <Ionicons
                  name="barbell-outline"
                  size={14}
                  color={theme.primary.main}
                />
              </View>
              <Text
                style={[styles.fitnessValue, { color: theme.primary.main }]}
              >
                {totalVolume} kg
              </Text>
              <Text style={styles.fitnessLabel}>
                {t("profile.totalVolume")}
              </Text>
            </View>
            <View style={styles.fitnessStatItem}>
              <View
                style={[
                  styles.fitnessIconBadge,
                  { backgroundColor: "rgba(245,166,35,0.18)" },
                ]}
              >
                <Ionicons name="trophy-outline" size={14} color="#F5A623" />
              </View>
              <Text style={[styles.fitnessValue, { color: "#F5A623" }]}>7</Text>
              <Text style={styles.fitnessLabel}>{t("profile.dayStreak")}</Text>
            </View>
          </View>
        </View>

        <View style={styles.statsRow}>
          {renderSocialStat(formatCount(user.postsCount), t("profile.posts"))}
          {renderSocialStat(
            formatCount(user.followers),
            t("profile.followers"),
            () => router.push(`/user/follows/${user.id}?type=followers` as any),
          )}
          {renderSocialStat(
            formatCount(user.following),
            t("profile.following"),
            () => router.push(`/user/follows/${user.id}?type=following` as any),
          )}
        </View>

        <View style={styles.tabBar}>
          <Pressable
            style={({ pressed }) => [
              styles.tab,
              activeTab === "posts" && styles.tabActive,
              pressed && styles.tabPressed,
            ]}
            onPress={() => setActiveTab("posts")}
            hitSlop={4}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "posts" && styles.tabTextActive,
              ]}
            >
              {t("profile.posts")}
            </Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.tab,
              activeTab === "routines" && styles.tabActive,
              pressed && styles.tabPressed,
            ]}
            onPress={() => setActiveTab("routines")}
            hitSlop={4}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "routines" && styles.tabTextActive,
              ]}
            >
              {t("profile.routines")}
            </Text>
          </Pressable>
        </View>

        {activeTab === "posts" ? renderPostsGrid() : renderRoutinesList()}
      </ScrollView>
    </View>
  );
}


import { Ionicons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

import { FONTS } from "../../constants/fonts";
import { Theme } from "../../constants/themes";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { api } from "../../services/api";
import { getProfileCache } from "../../services/preloadCache";

type WorkoutHistoryExercise = {
  name?: string;
  sets?: { kg?: string; reps?: string; completed?: boolean }[];
  gif_url?: string | null;
  image_url?: string | null;
  exercise_id?: string | number | null;
};

type WorkoutHistoryRow = {
  id: string;
  name: string | null;
  date: string;
  start_time: string | null;
  end_time: string | null;
  duration_minutes: number | null;
  calories_burned: number | null;
  source: string | null;
  routine_id: string | null;
  total_volume_kg: number | null;
  total_sets: number | null;
  completed_sets: number | null;
  exercise_count: number | null;
  exercises: WorkoutHistoryExercise[] | null;
  created_at: string;
};

type HistoryResponse = {
  items: WorkoutHistoryRow[];
  nextCursor: string | null;
};

const PAGE_SIZE = 20;
const PREVIEW_EXERCISES = 3;

function formatDuration(minutes: number | null, isFr: boolean) {
  const m = Math.max(0, Math.round(minutes ?? 0));
  if (m === 0) return isFr ? "0 min" : "0 min";
  const h = Math.floor(m / 60);
  const rem = m % 60;
  if (h === 0) return `${rem} min`;
  if (rem === 0) return `${h}h`;
  return `${h}h ${rem}min`;
}

function formatVolume(kg: number | null, isFr: boolean) {
  const v = Math.max(0, Math.round(kg ?? 0));
  const grouped = v
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, isFr ? " " : ",");
  return `${grouped} kg`;
}

function formatRelative(iso: string, isFr: boolean) {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "";
  const diff = Math.max(0, Date.now() - then);
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (isFr) {
    if (minutes < 1) return "à l'instant";
    if (minutes < 60) return `il y a ${minutes} min`;
    if (hours < 24) return `il y a ${hours}h`;
    if (days < 7) return `il y a ${days} j`;
    if (weeks < 4) return `il y a ${weeks} sem`;
    if (months < 12) return `il y a ${months} mois`;
    return `il y a ${years} an${years > 1 ? "s" : ""}`;
  }
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  if (weeks < 4) return `${weeks}w ago`;
  if (months < 12) return `${months} mo ago`;
  return `${years}y ago`;
}

function initialOf(name: string | null | undefined) {
  const s = (name || "").trim();
  if (!s) return "?";
  return s.charAt(0).toUpperCase();
}

export default function TrainingHistoryView() {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const isFr = !!i18n.language?.startsWith("fr");
  const styles = useMemo(() => createStyles(theme), [theme]);

  const profile = getProfileCache(user?.id)?.profile ?? null;
  const displayName =
    profile?.display_name?.trim() ||
    profile?.username?.trim() ||
    (user?.user_metadata as any)?.display_name ||
    (user?.user_metadata as any)?.username ||
    user?.email?.split("@")[0] ||
    "";
  const avatarUrl = profile?.avatar_url || null;

  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [sessions, setSessions] = useState<WorkoutHistoryRow[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadFirstPage = useCallback(async () => {
    setStatus("loading");
    try {
      const res = (await api.getWorkoutsHistory(
        PAGE_SIZE,
        null,
      )) as HistoryResponse;
      setSessions(res?.items ?? []);
      setCursor(res?.nextCursor ?? null);
      setStatus("ready");
    } catch (err) {
      console.warn("[TrainingHistoryView] load failed:", err);
      setStatus("error");
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (loadingMore || !cursor) return;
    setLoadingMore(true);
    try {
      const res = (await api.getWorkoutsHistory(
        PAGE_SIZE,
        cursor,
      )) as HistoryResponse;
      setSessions((prev) => [...prev, ...(res?.items ?? [])]);
      setCursor(res?.nextCursor ?? null);
    } catch (err) {
      console.warn("[TrainingHistoryView] loadMore failed:", err);
    } finally {
      setLoadingMore(false);
    }
  }, [cursor, loadingMore]);

  useEffect(() => {
    void loadFirstPage();
  }, [loadFirstPage]);

  if (status === "loading") {
    return (
      <View style={styles.stateWrap}>
        <ActivityIndicator color={theme.primary.main} />
      </View>
    );
  }

  if (status === "error") {
    return (
      <View style={styles.stateWrap}>
        <Ionicons
          name="cloud-offline-outline"
          size={36}
          color={theme.foreground.gray}
        />
        <Text style={styles.errorText}>{t("home.history.errorLoading")}</Text>
        <Pressable
          style={({ pressed }) => [
            styles.retryBtn,
            pressed && { opacity: 0.85 },
          ]}
          onPress={() => void loadFirstPage()}
        >
          <Text style={styles.retryBtnText}>{t("home.history.retry")}</Text>
        </Pressable>
      </View>
    );
  }

  if (sessions.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <View style={styles.emptyIconCircle}>
          <Ionicons
            name="barbell-outline"
            size={32}
            color={theme.primary.main}
          />
        </View>
        <Text style={styles.emptyTitle}>{t("home.history.emptyTitle")}</Text>
        <Text style={styles.emptyMessage}>
          {t("home.history.emptyMessage")}
        </Text>
        <Pressable
          style={({ pressed }) => [
            styles.ctaBtn,
            pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
          ]}
          onPress={() => router.push("/(tabs)/workout" as any)}
        >
          <Ionicons name="play" size={16} color="#FFFFFF" />
          <Text style={styles.ctaBtnText}>{t("home.history.emptyCta")}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.listWrap}>
      {sessions.map((s) => {
        const exercises = Array.isArray(s.exercises) ? s.exercises : [];
        const previewExercises = exercises.slice(0, PREVIEW_EXERCISES);
        const moreCount = Math.max(0, exercises.length - PREVIEW_EXERCISES);

        return (
          <View key={s.id} style={styles.card}>
            {/* Header */}
            <View style={styles.cardHeader}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <Text style={styles.avatarInitial}>
                    {initialOf(displayName)}
                  </Text>
                </View>
              )}
              <View style={styles.headerText}>
                <Text style={styles.username} numberOfLines={1}>
                  {displayName || t("home.history.untitled")}
                </Text>
                <Text style={styles.timeAgo} numberOfLines={1}>
                  {formatRelative(s.created_at || s.date, isFr)}
                </Text>
              </View>
            </View>

            {/* Title */}
            <Text style={styles.cardTitle} numberOfLines={2}>
              {s.name?.trim() || t("home.history.untitled")}
            </Text>

            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={styles.statBlock}>
                <Text style={styles.statLabel}>
                  {t("home.history.statTime")}
                </Text>
                <Text style={styles.statValue}>
                  {formatDuration(s.duration_minutes, isFr)}
                </Text>
              </View>
              <View style={styles.statBlock}>
                <Text style={styles.statLabel}>
                  {t("home.history.statVolume")}
                </Text>
                <Text style={styles.statValue}>
                  {formatVolume(s.total_volume_kg, isFr)}
                </Text>
              </View>
              <View style={styles.statBlock}>
                <Text style={styles.statLabel}>
                  {t("home.history.statSets")}
                </Text>
                <Text style={styles.statValue}>{s.completed_sets ?? 0}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Exercises preview */}
            {previewExercises.map((ex, idx) => {
              const setsCount = Array.isArray(ex.sets) ? ex.sets.length : 0;
              return (
                <View key={idx} style={styles.exerciseRow}>
                  <View style={styles.exerciseThumb}>
                    {ex.gif_url || ex.image_url ? (
                      <ExpoImage
                        source={{ uri: (ex.gif_url ?? ex.image_url) as string }}
                        style={styles.exerciseImg}
                        contentFit="cover"
                        autoplay={false}
                        transition={120}
                      />
                    ) : (
                      <Ionicons
                        name="barbell"
                        size={20}
                        color={theme.primary.main}
                      />
                    )}
                  </View>
                  <Text style={styles.exerciseText} numberOfLines={1}>
                    {t("home.history.setsCount", {
                      count: setsCount,
                      defaultValue: "{{count}} sets",
                    })}{" "}
                    {ex.name || ""}
                  </Text>
                </View>
              );
            })}

            {moreCount > 0 && (
              <Text style={styles.moreLink}>
                {t("home.history.seeMore", {
                  count: moreCount,
                  defaultValue: "Voir {{count}} exercices en plus",
                })}
              </Text>
            )}
          </View>
        );
      })}

      {cursor && (
        <Pressable
          style={({ pressed }) => [
            styles.loadMoreBtn,
            pressed && { opacity: 0.85 },
          ]}
          onPress={() => void loadMore()}
          disabled={loadingMore}
        >
          {loadingMore ? (
            <ActivityIndicator color={theme.primary.main} size="small" />
          ) : (
            <Text style={styles.loadMoreBtnText}>
              {t("home.history.loadMore")}
            </Text>
          )}
        </Pressable>
      )}
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    listWrap: {
      marginHorizontal: 16,
      gap: 14,
    },
    card: {
      padding: 16,
      borderRadius: 16,
      backgroundColor: theme.background.darker,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: `${theme.foreground.gray}25`,
    },
    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginBottom: 12,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: "#F26A2B",
    },
    avatarFallback: {
      alignItems: "center",
      justifyContent: "center",
    },
    avatarInitial: {
      fontFamily: FONTS.bold,
      fontSize: 18,
      color: "#FFFFFF",
    },
    headerText: {
      flex: 1,
      minWidth: 0,
    },
    username: {
      fontFamily: FONTS.bold,
      fontSize: 15,
      color: theme.foreground.white,
    },
    timeAgo: {
      fontFamily: FONTS.medium,
      fontSize: 12,
      color: theme.foreground.gray,
      marginTop: 1,
    },
    cardTitle: {
      fontFamily: FONTS.bold,
      fontSize: 22,
      color: theme.foreground.white,
      marginBottom: 12,
    },
    statsRow: {
      flexDirection: "row",
      gap: 20,
      marginBottom: 14,
    },
    statBlock: {
      flex: 1,
    },
    statLabel: {
      fontFamily: FONTS.medium,
      fontSize: 12,
      color: theme.foreground.gray,
      marginBottom: 2,
    },
    statValue: {
      fontFamily: FONTS.bold,
      fontSize: 15,
      color: theme.foreground.white,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: `${theme.foreground.gray}30`,
      marginBottom: 12,
    },
    exerciseRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 6,
    },
    exerciseThumb: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: `${theme.foreground.gray}18`,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    exerciseImg: {
      width: 44,
      height: 44,
    },
    exerciseText: {
      flex: 1,
      fontFamily: FONTS.bold,
      fontSize: 15,
      color: theme.foreground.white,
    },
    moreLink: {
      marginTop: 8,
      textAlign: "center",
      fontFamily: FONTS.medium,
      fontSize: 13,
      color: theme.foreground.gray,
    },
    stateWrap: {
      paddingVertical: 32,
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
    },
    errorText: {
      fontFamily: FONTS.medium,
      fontSize: 13,
      color: theme.foreground.gray,
      textAlign: "center",
      marginHorizontal: 24,
    },
    retryBtn: {
      marginTop: 6,
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 999,
      backgroundColor: theme.primary.main,
    },
    retryBtnText: {
      fontFamily: FONTS.bold,
      fontSize: 13,
      color: "#FFFFFF",
    },
    emptyWrap: {
      paddingVertical: 32,
      marginHorizontal: 20,
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    emptyIconCircle: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: `${theme.primary.main}18`,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 4,
    },
    emptyTitle: {
      fontFamily: FONTS.bold,
      fontSize: 16,
      color: theme.foreground.white,
      textAlign: "center",
    },
    emptyMessage: {
      fontFamily: FONTS.medium,
      fontSize: 13,
      color: theme.foreground.gray,
      textAlign: "center",
      marginHorizontal: 24,
    },
    ctaBtn: {
      marginTop: 12,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 999,
      backgroundColor: theme.primary.main,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    ctaBtnText: {
      fontFamily: FONTS.bold,
      fontSize: 13,
      color: "#FFFFFF",
    },
    loadMoreBtn: {
      marginTop: 4,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: theme.background.darker,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: `${theme.foreground.gray}30`,
      alignItems: "center",
      justifyContent: "center",
    },
    loadMoreBtnText: {
      fontFamily: FONTS.bold,
      fontSize: 13,
      color: theme.primary.main,
    },
  });

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { FONTS } from "../../constants/fonts";
import { Theme } from "../../constants/themes";
import { useTheme } from "../../contexts/ThemeContext";
import { api } from "../../services/api";

type SearchUser = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_private: boolean;
  is_following: boolean;
  has_pending_request: boolean;
};

type FollowState = "idle" | "following" | "pending";

function stateFor(user: SearchUser): FollowState {
  if (user.is_following) return "following";
  if (user.has_pending_request) return "pending";
  return "idle";
}

export default function Search() {
  const router = useRouter();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reqIdRef = useRef(0);
  const inputRef = useRef<TextInput | null>(null);

  useEffect(() => {
    const id = setTimeout(() => inputRef.current?.focus(), 80);
    return () => clearTimeout(id);
  }, []);

  const runSearch = useCallback(async (q: string) => {
    const reqId = ++reqIdRef.current;
    setError(null);
    if (!q.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = (await api.searchUsers(q.trim())) as { items: SearchUser[] };
      if (reqId !== reqIdRef.current) return;
      setResults(res.items ?? []);
    } catch (e) {
      if (reqId !== reqIdRef.current) return;
      setError(e instanceof Error ? e.message : String(e));
      setResults([]);
    } finally {
      if (reqId === reqIdRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(query), 220);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, runSearch]);

  const toggleFollow = useCallback(async (target: SearchUser) => {
    const prev = stateFor(target);
    // Optimistic update.
    setResults((rows) =>
      rows.map((u) =>
        u.id !== target.id
          ? u
          : {
              ...u,
              is_following: prev === "idle" ? !u.is_private : false,
              has_pending_request:
                prev === "idle" ? u.is_private : false,
            },
      ),
    );
    try {
      if (prev === "idle") {
        const res = (await api.follow(target.id)) as { state?: string };
        setResults((rows) =>
          rows.map((u) =>
            u.id !== target.id
              ? u
              : {
                  ...u,
                  is_following: res.state === "following",
                  has_pending_request: res.state === "pending",
                },
          ),
        );
      } else if (prev === "following") {
        await api.unfollow(target.id);
      } else if (prev === "pending") {
        await api.cancelOutgoingFollowRequest(target.id);
      }
    } catch {
      // Rollback on error.
      setResults((rows) =>
        rows.map((u) =>
          u.id !== target.id
            ? u
            : {
                ...u,
                is_following: prev === "following",
                has_pending_request: prev === "pending",
              },
        ),
      );
    }
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: SearchUser }) => {
      const state = stateFor(item);
      const label =
        state === "following"
          ? t("user.following")
          : state === "pending"
            ? t("search.pending", "Pending")
            : t("user.follow");
      return (
        <Pressable
          onPress={() => router.navigate(`/user/${item.id}` as any)}
          style={({ pressed }) => [
            styles.row,
            pressed && { opacity: 0.8 },
          ]}
        >
          <View style={styles.avatarWrap}>
            {item.avatar_url ? (
              <Image
                source={{ uri: item.avatar_url }}
                style={styles.avatar}
              />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Ionicons
                  name="person"
                  size={18}
                  color={theme.foreground.gray}
                />
              </View>
            )}
          </View>
          <View style={styles.rowText}>
            <View style={styles.nameRow}>
              <Text style={styles.username} numberOfLines={1}>
                {item.username ?? "—"}
              </Text>
              {item.is_private && (
                <View style={styles.privateBadge}>
                  <Ionicons
                    name="lock-closed"
                    size={10}
                    color={theme.foreground.gray}
                  />
                  <Text style={styles.privateBadgeText}>
                    {t("search.private", "Private")}
                  </Text>
                </View>
              )}
            </View>
            {item.display_name ? (
              <Text style={styles.displayName} numberOfLines={1}>
                {item.display_name}
              </Text>
            ) : null}
            {item.bio ? (
              <Text style={styles.bio} numberOfLines={1}>
                {item.bio}
              </Text>
            ) : null}
          </View>
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              toggleFollow(item);
            }}
            style={({ pressed }) => [
              styles.followBtn,
              state === "following" && styles.followBtnActive,
              state === "pending" && styles.followBtnPending,
              pressed && { opacity: 0.85 },
            ]}
          >
            <Text
              style={[
                styles.followBtnText,
                (state === "following" || state === "pending") &&
                  styles.followBtnTextAlt,
              ]}
            >
              {label}
            </Text>
          </Pressable>
        </Pressable>
      );
    },
    [theme, styles, t, toggleFollow, router],
  );

  const listHeader =
    query.trim().length === 0 ? (
      <View style={styles.intro}>
        <View style={styles.introIcon}>
          <Ionicons
            name="people-outline"
            size={26}
            color={theme.primary.main}
          />
        </View>
        <Text style={styles.introTitle}>
          {t("search.startTyping", "Start typing to search")}
        </Text>
        <Text style={styles.introHint}>
          {t(
            "search.startTypingHint",
            "Find and follow other athletes to see their posts in your feed.",
          )}
        </Text>
      </View>
    ) : null;

  const listEmpty = loading ? (
    <View style={styles.emptyWrap}>
      <ActivityIndicator color={theme.primary.main} />
    </View>
  ) : query.trim().length > 0 ? (
    <View style={styles.emptyWrap}>
      <Ionicons
        name="search-outline"
        size={32}
        color={theme.foreground.gray}
      />
      <Text style={styles.emptyTitle}>{t("search.noUsersFound")}</Text>
      <Text style={styles.emptyHint}>
        {t("search.tryDifferentUsername")}
      </Text>
    </View>
  ) : null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backBtn,
            pressed && { opacity: 0.6 },
          ]}
          hitSlop={8}
        >
          <Ionicons
            name="chevron-back"
            size={22}
            color={theme.foreground.white}
          />
        </Pressable>
        <Text style={styles.title}>{t("search.findPeople")}</Text>
        <Pressable
          onPress={() => router.push("/search/scan" as any)}
          style={({ pressed }) => [
            styles.backBtn,
            pressed && { opacity: 0.6 },
          ]}
          hitSlop={8}
        >
          <Ionicons
            name="qr-code-outline"
            size={22}
            color={theme.foreground.white}
          />
        </Pressable>
      </View>

      {/* Search bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={theme.foreground.gray} />
        <TextInput
          ref={inputRef}
          style={styles.searchInput}
          placeholder={t("search.searchPeople")}
          placeholderTextColor={theme.foreground.gray}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          onSubmitEditing={() => runSearch(query)}
        />
        {loading && query.trim().length > 0 ? (
          <ActivityIndicator size="small" color={theme.foreground.gray} />
        ) : query.length > 0 ? (
          <Pressable
            onPress={() => setQuery("")}
            hitSlop={6}
            style={({ pressed }) => pressed && { opacity: 0.6 }}
          >
            <Ionicons
              name="close-circle"
              size={18}
              color={theme.foreground.gray}
            />
          </Pressable>
        ) : null}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

function createStyles(theme: Theme) {
  const cardShadow = Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOpacity: 0.2,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
    },
    android: { elevation: 2 },
    default: {},
  });
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background.dark,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 12,
      paddingTop: 8,
      paddingBottom: 6,
    },
    backBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      fontSize: 17,
      fontFamily: FONTS.bold,
      color: theme.foreground.white,
    },
    searchBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginHorizontal: 12,
      marginTop: 4,
      marginBottom: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 14,
      backgroundColor: theme.background.darker,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(255,255,255,0.06)",
      ...cardShadow,
    },
    searchInput: {
      flex: 1,
      color: theme.foreground.white,
      fontSize: 14,
      fontFamily: FONTS.regular,
      paddingVertical: 0,
    },
    errorText: {
      color: "#e27171",
      fontSize: 12,
      textAlign: "center",
      paddingHorizontal: 16,
      paddingVertical: 6,
    },
    listContent: {
      paddingHorizontal: 12,
      paddingBottom: 24,
    },
    separator: {
      height: 6,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 14,
      backgroundColor: theme.background.darker,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(255,255,255,0.05)",
    },
    avatarWrap: {
      width: 46,
      height: 46,
      borderRadius: 23,
      padding: 2,
      backgroundColor: theme.primary.main + "30",
    },
    avatar: {
      width: "100%",
      height: "100%",
      borderRadius: 21,
      backgroundColor: theme.background.accent,
    },
    avatarFallback: {
      alignItems: "center",
      justifyContent: "center",
    },
    rowText: {
      flex: 1,
    },
    nameRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    username: {
      fontSize: 14,
      fontFamily: FONTS.semiBold,
      color: theme.foreground.white,
      flexShrink: 1,
    },
    privateBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
      backgroundColor: theme.background.accent,
    },
    privateBadgeText: {
      fontSize: 10,
      color: theme.foreground.gray,
      fontFamily: FONTS.semiBold,
    },
    displayName: {
      fontSize: 12,
      color: theme.foreground.white,
      marginTop: 1,
      opacity: 0.8,
    },
    bio: {
      fontSize: 11,
      color: theme.foreground.gray,
      marginTop: 2,
    },
    followBtn: {
      minWidth: 84,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 18,
      backgroundColor: theme.primary.main,
      alignItems: "center",
      justifyContent: "center",
    },
    followBtnActive: {
      backgroundColor: "transparent",
      borderWidth: 1,
      borderColor: theme.primary.main,
    },
    followBtnPending: {
      backgroundColor: theme.background.accent,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.12)",
    },
    followBtnText: {
      fontSize: 12,
      fontFamily: FONTS.bold,
      color: theme.background.dark,
    },
    followBtnTextAlt: {
      color: theme.foreground.white,
    },
    intro: {
      alignItems: "center",
      paddingHorizontal: 24,
      paddingTop: 36,
      paddingBottom: 12,
    },
    introIcon: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: theme.primary.main + "1A",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 12,
    },
    introTitle: {
      fontSize: 15,
      fontFamily: FONTS.bold,
      color: theme.foreground.white,
      marginBottom: 6,
    },
    introHint: {
      fontSize: 12,
      color: theme.foreground.gray,
      textAlign: "center",
      lineHeight: 16,
      maxWidth: 280,
    },
    emptyWrap: {
      alignItems: "center",
      paddingTop: 48,
      paddingHorizontal: 32,
      gap: 8,
    },
    emptyTitle: {
      fontSize: 14,
      fontFamily: FONTS.semiBold,
      color: theme.foreground.white,
    },
    emptyHint: {
      fontSize: 12,
      color: theme.foreground.gray,
      textAlign: "center",
    },
  });
}

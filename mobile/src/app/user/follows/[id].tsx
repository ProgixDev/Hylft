import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Theme } from "../../../constants/themes";
import { useTheme } from "../../../contexts/ThemeContext";
import { api } from "../../../services/api";

import { FONTS } from "../../../constants/fonts";

type BackendUser = {
  id: string;
  username?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
  is_private?: boolean | null;
  bio?: string | null;
};

type FollowRow = {
  created_at: string;
  follower?: BackendUser | null;
  followee?: BackendUser | null;
};

type ListResponse = { items: FollowRow[]; next_cursor: string | null };

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background.dark },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.background.accent,
    },
    backBtn: { padding: 6, marginRight: 8 },
    headerTitle: {
      fontSize: 20,
      fontFamily: FONTS.bold,
      color: theme.foreground.white,
    },
    tabBar: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: theme.background.accent,
    },
    tab: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 14,
      borderBottomWidth: 2,
      borderBottomColor: "transparent",
    },
    tabActive: { borderBottomColor: theme.primary.main },
    tabText: {
      fontSize: 15,
      fontFamily: FONTS.semiBold,
      color: theme.foreground.gray,
    },
    tabTextActive: { color: theme.primary.main },
    userItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    userAvatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
      marginRight: 12,
      backgroundColor: theme.background.darker,
    },
    userInfo: { flex: 1 },
    userName: {
      fontSize: 16,
      fontFamily: FONTS.semiBold,
      color: theme.foreground.white,
      marginBottom: 2,
    },
    userBio: { fontSize: 13, color: theme.foreground.gray, lineHeight: 18 },
    emptyContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 60,
    },
    emptyIcon: { marginBottom: 16 },
    emptyTitle: {
      fontSize: 18,
      fontFamily: FONTS.semiBold,
      color: theme.foreground.white,
      marginBottom: 8,
    },
    emptySubtitle: {
      fontSize: 14,
      color: theme.foreground.gray,
      textAlign: "center",
      paddingHorizontal: 32,
    },
  });
}

type UserItem = {
  id: string;
  username: string;
  avatar: string;
  bio: string;
};

export default function FollowsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  // Accept ?tab=followers|following (used from user profile); fall back to
  // legacy ?type= for back-compat.
  const params = useLocalSearchParams<{
    id: string;
    tab?: string;
    type?: string;
  }>();
  const initialTab =
    (params.tab as "followers" | "following") ??
    (params.type as "followers" | "following") ??
    "followers";
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const [activeTab, setActiveTab] = useState<"followers" | "following">(initialTab);
  const [followers, setFollowers] = useState<UserItem[]>([]);
  const [following, setFollowing] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState<string>("");

  const toItem = useCallback(
    (u: BackendUser | null | undefined): UserItem | null => {
      if (!u) return null;
      return {
        id: u.id,
        username: u.display_name || u.username || "unknown",
        avatar: u.avatar_url ?? "",
        bio: u.bio ?? "",
      };
    },
    [],
  );

  const load = useCallback(async () => {
    if (!params.id) return;
    setLoading(true);
    setError(null);
    try {
      const [followersRes, followingRes, profileRes] = await Promise.all([
        api.listFollowers(params.id, undefined, 100) as Promise<ListResponse>,
        api.listFollowing(params.id, undefined, 100) as Promise<ListResponse>,
        api.getPublicProfile(params.id) as Promise<BackendUser>,
      ]);
      setFollowers(
        (followersRes.items ?? [])
          .map((r) => toItem(r.follower))
          .filter((x): x is UserItem => !!x),
      );
      setFollowing(
        (followingRes.items ?? [])
          .map((r) => toItem(r.followee))
          .filter((x): x is UserItem => !!x),
      );
      setTitle(
        profileRes?.display_name ||
          profileRes?.username ||
          t("user.userNotFound"),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [params.id, t, toItem]);

  useEffect(() => {
    load();
  }, [load]);

  const currentList = activeTab === "followers" ? followers : following;

  const renderUserItem = ({ item }: { item: UserItem }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => router.push(`/user/${item.id}` as any)}
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: item.avatar || undefined }}
        style={styles.userAvatar}
      />
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.username}</Text>
        {item.bio ? (
          <Text style={styles.userBio} numberOfLines={2}>
            {item.bio}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name={activeTab === "followers" ? "people-outline" : "person-add-outline"}
        size={64}
        color={theme.foreground.gray}
        style={styles.emptyIcon}
      />
      <Text style={styles.emptyTitle}>
        {activeTab === "followers"
          ? t("user.noFollowersYet")
          : t("user.notFollowingAnyone")}
      </Text>
      <Text style={styles.emptySubtitle}>
        {activeTab === "followers"
          ? t("user.whenPeopleFollow")
          : t("user.whenUserFollows")}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons
            name="chevron-back"
            size={26}
            color={theme.foreground.white}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "followers" && styles.tabActive]}
          onPress={() => setActiveTab("followers")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "followers" && styles.tabTextActive,
            ]}
          >
            {t("user.followers")} ({followers.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "following" && styles.tabActive]}
          onPress={() => setActiveTab("following")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "following" && styles.tabTextActive,
            ]}
          >
            {t("user.following")} ({following.length})
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator color={theme.primary.main} />
        </View>
      ) : (
        <>
          {error ? (
            <Text
              style={{
                color: "#e27171",
                textAlign: "center",
                paddingVertical: 8,
              }}
            >
              {error}
            </Text>
          ) : null}
          <FlatList
            data={currentList}
            keyExtractor={(item) => item.id}
            renderItem={renderUserItem}
            ListEmptyComponent={renderEmptyState}
            showsVerticalScrollIndicator={false}
          />
        </>
      )}
    </View>
  );
}

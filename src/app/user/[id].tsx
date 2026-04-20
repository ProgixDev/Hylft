import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../contexts/ThemeContext";
import { api } from "../../services/api";
import { mapPostToUi, type BackendPost } from "../../services/feedMappers";
import type { PostData } from "../../components/ui/Post";

import { FONTS } from "../../constants/fonts";

type PublicProfile = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_private: boolean;
};

type FollowStats = { followers_count: number; following_count: number };

function compactNumber(n: number): string {
  if (n < 1000) return String(n);
  return `${(n / 1000).toFixed(1)}k`;
}

export default function UserProfile() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [stats, setStats] = useState<FollowStats>({
    followers_count: 0,
    following_count: 0,
  });
  const [isFollowing, setIsFollowing] = useState(false);
  const [pendingRequest, setPendingRequest] = useState(false);
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toggling, setToggling] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [profileRes, statsRes, followRes] = await Promise.all([
        api.getPublicProfile(id) as Promise<PublicProfile>,
        api.getFollowStats(id) as Promise<FollowStats>,
        api.isFollowing(id) as Promise<{ is_following: boolean }>,
      ]);
      setProfile(profileRes);
      setStats(statsRes);
      setIsFollowing(!!followRes.is_following);

      // Fetch posts only if public or already following.
      if (!profileRes.is_private || followRes.is_following) {
        try {
          const postsRes = (await api.listPosts({
            scope: "author",
            author_id: id,
            limit: 24,
          })) as { items: BackendPost[] };
          setPosts((postsRes.items ?? []).map(mapPostToUi));
        } catch {
          setPosts([]);
        }
      } else {
        setPosts([]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleToggleFollow = async () => {
    if (!id || toggling) return;
    setToggling(true);
    // Optimistic
    const wasFollowing = isFollowing;
    setIsFollowing(!wasFollowing);
    setStats((s) => ({
      ...s,
      followers_count: Math.max(
        s.followers_count + (wasFollowing ? -1 : 1),
        0,
      ),
    }));
    try {
      if (wasFollowing) {
        await api.unfollow(id);
        setPendingRequest(false);
      } else {
        const res = (await api.follow(id)) as {
          state: "following" | "pending";
        };
        setPendingRequest(res.state === "pending");
        if (res.state === "pending") {
          // follow_request → not actually following yet
          setIsFollowing(false);
          setStats((s) => ({
            ...s,
            followers_count: Math.max(s.followers_count - 1, 0),
          }));
        }
      }
    } catch {
      // rollback
      setIsFollowing(wasFollowing);
      setStats((s) => ({
        ...s,
        followers_count: Math.max(
          s.followers_count + (wasFollowing ? 1 : -1),
          0,
        ),
      }));
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <View
        style={[styles.container, { justifyContent: "center", alignItems: "center" }]}
      >
        <ActivityIndicator color={theme.primary.main} />
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View style={styles.container}>
        <Text style={{ color: theme.foreground.white, padding: 20 }}>
          {error ?? t("user.userNotFound")}
        </Text>
      </View>
    );
  }

  const displayName =
    profile.display_name ?? profile.username ?? t("user.userNotFound");

  const followLabel = pendingRequest
    ? t("user.requested", "Requested")
    : isFollowing
      ? t("user.following")
      : t("user.follow");

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={theme.foreground.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{displayName}</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.profileHeader}>
          <Image
            source={{ uri: profile.avatar_url || undefined }}
            style={styles.avatar}
          />
          <View style={styles.profileInfo}>
            <View style={styles.nameContainer}>
              <Text style={styles.username}>{displayName}</Text>
              {profile.is_private && (
                <Ionicons
                  name="lock-closed"
                  size={16}
                  color={theme.foreground.gray}
                  style={styles.lockIcon}
                />
              )}
            </View>
            {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{posts.length}</Text>
            <Text style={styles.statLabel}>{t("user.posts")}</Text>
          </View>
          <TouchableOpacity
            style={styles.statBox}
            onPress={() =>
              router.navigate(`/user/follows/${profile.id}?tab=followers` as any)
            }
          >
            <Text style={styles.statNumber}>
              {compactNumber(stats.followers_count)}
            </Text>
            <Text style={styles.statLabel}>{t("user.followers")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.statBox}
            onPress={() =>
              router.navigate(`/user/follows/${profile.id}?tab=following` as any)
            }
          >
            <Text style={styles.statNumber}>
              {compactNumber(stats.following_count)}
            </Text>
            <Text style={styles.statLabel}>{t("user.following")}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            styles.followButton,
            (isFollowing || pendingRequest) && styles.followingButton,
          ]}
          onPress={handleToggleFollow}
          disabled={toggling}
        >
          <Text
            style={[
              styles.followButtonText,
              (isFollowing || pendingRequest) && styles.followingButtonText,
            ]}
          >
            {followLabel}
          </Text>
        </TouchableOpacity>

        {profile.is_private && !isFollowing ? (
          <View style={styles.privateContainer}>
            <Ionicons
              name="lock-closed"
              size={64}
              color={theme.foreground.gray}
            />
            <Text style={styles.privateTitle}>
              {t("user.thisAccountIsPrivate")}
            </Text>
            <Text style={styles.privateSubtitle}>
              {t("user.followToSeePosts")}
            </Text>
          </View>
        ) : posts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="image-outline"
              size={64}
              color={theme.foreground.gray}
            />
            <Text style={styles.emptyTitle}>{t("user.noPostsYet")}</Text>
            <Text style={styles.emptySubtitle}>{t("user.userHasntShared")}</Text>
          </View>
        ) : (
          <View style={styles.postsSection}>
            <Text style={styles.postsTitle}>{t("user.posts")}</Text>
            <View style={styles.postsGrid}>
              {posts.map((post, index) => (
                <TouchableOpacity
                  key={post.id}
                  style={styles.gridItem}
                  onPress={() =>
                    router.navigate(
                      `/user/posts?userId=${profile.id}&postIndex=${index}` as any,
                    )
                  }
                >
                  {post.images[0] ? (
                    <Image
                      source={{ uri: post.images[0] }}
                      style={styles.gridImage}
                    />
                  ) : (
                    <View
                      style={[
                        styles.gridImage,
                        { backgroundColor: theme.background.darker },
                      ]}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>["theme"]) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background.dark },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.background.darker,
    },
    headerTitle: {
      fontSize: 20,
      fontFamily: FONTS.bold,
      color: theme.foreground.white,
    },
    spacer: { width: 28 },
    content: { flex: 1 },
    scrollContent: { paddingBottom: 24 },
    profileHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
      paddingHorizontal: 16,
      paddingVertical: 16,
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      marginRight: 16,
      backgroundColor: theme.background.darker,
    },
    profileInfo: { flex: 1 },
    nameContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 4,
    },
    username: {
      fontSize: 18,
      fontFamily: FONTS.bold,
      color: theme.foreground.white,
    },
    lockIcon: { marginLeft: 8 },
    bio: { fontSize: 13, color: theme.foreground.gray, marginBottom: 8 },
    statsContainer: {
      flexDirection: "row",
      justifyContent: "space-around",
      paddingHorizontal: 16,
      marginBottom: 20,
    },
    statBox: { alignItems: "center" },
    statNumber: {
      fontSize: 18,
      fontFamily: FONTS.bold,
      color: theme.foreground.white,
    },
    statLabel: {
      fontSize: 12,
      color: theme.foreground.gray,
      marginTop: 4,
    },
    followButton: {
      marginHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 22,
      backgroundColor: theme.primary.main,
      alignItems: "center",
      marginBottom: 24,
    },
    followingButton: {
      backgroundColor: theme.background.accent,
      borderWidth: 1,
      borderColor: theme.primary.main,
    },
    followButtonText: {
      fontSize: 15,
      fontFamily: FONTS.semiBold,
      color: theme.background.dark,
    },
    followingButtonText: { color: theme.primary.main },
    privateContainer: { alignItems: "center", paddingVertical: 60 },
    privateTitle: {
      fontSize: 18,
      fontFamily: FONTS.semiBold,
      color: theme.foreground.white,
      marginTop: 16,
      marginBottom: 8,
    },
    privateSubtitle: {
      fontSize: 14,
      color: theme.foreground.gray,
      textAlign: "center",
      paddingHorizontal: 32,
    },
    emptyState: { alignItems: "center", paddingVertical: 60 },
    emptyTitle: {
      fontSize: 18,
      fontFamily: FONTS.semiBold,
      color: theme.foreground.white,
      marginTop: 16,
      marginBottom: 8,
    },
    emptySubtitle: {
      fontSize: 14,
      color: theme.foreground.gray,
      textAlign: "center",
      paddingHorizontal: 32,
    },
    postsSection: { paddingHorizontal: 16 },
    postsTitle: {
      fontSize: 16,
      fontFamily: FONTS.bold,
      color: theme.foreground.white,
      marginBottom: 12,
    },
    postsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
    gridItem: {
      width: "32%",
      aspectRatio: 1,
      borderRadius: 8,
      overflow: "hidden",
    },
    gridImage: { width: "100%", height: "100%" },
  });

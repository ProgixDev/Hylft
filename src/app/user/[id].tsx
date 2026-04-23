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
import ProfileHeader from "../../components/profile/ProfileHeader";
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
  cover_url: string | null;
  bio: string | null;
  is_private: boolean;
  created_at: string | null;
};

type FollowStats = { followers_count: number; following_count: number };

type UserStats = {
  posts_count: number;
  followers_count: number;
  following_count: number;
  likes_count: number;
};

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
  const [userStats, setUserStats] = useState<UserStats>({
    posts_count: 0,
    followers_count: 0,
    following_count: 0,
    likes_count: 0,
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
      const [profileRes, statsRes, followRes, userStatsRes] = await Promise.all([
        api.getPublicProfile(id) as Promise<PublicProfile>,
        api.getFollowStats(id) as Promise<FollowStats>,
        api.isFollowing(id) as Promise<{ is_following: boolean; has_pending_request: boolean }>,
        api.getUserStats(id) as Promise<UserStats>,
      ]);
      setProfile(profileRes);
      setStats(statsRes);
      setUserStats(userStatsRes);
      setIsFollowing(!!followRes.is_following);
      setPendingRequest(!!followRes.has_pending_request);

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

    // Cancel a pending follow request (private account)
    if (pendingRequest) {
      setPendingRequest(false);
      try {
        await api.cancelOutgoingFollowRequest(id);
      } catch {
        setPendingRequest(true);
      } finally {
        setToggling(false);
      }
      return;
    }

    // Optimistic toggle for follow / unfollow
    const wasFollowing = isFollowing;
    setIsFollowing(!wasFollowing);
    const delta = wasFollowing ? -1 : 1;
    setStats((s) => ({
      ...s,
      followers_count: Math.max(s.followers_count + delta, 0),
    }));
    setUserStats((s) => ({
      ...s,
      followers_count: Math.max(s.followers_count + delta, 0),
    }));
    try {
      if (wasFollowing) {
        await api.unfollow(id);
      } else {
        const res = (await api.follow(id)) as {
          state: "following" | "pending";
        };
        if (res.state === "pending") {
          // follow_request sent → not actually following yet
          setPendingRequest(true);
          setIsFollowing(false);
          setStats((s) => ({
            ...s,
            followers_count: Math.max(s.followers_count - 1, 0),
          }));
          setUserStats((s) => ({
            ...s,
            followers_count: Math.max(s.followers_count - 1, 0),
          }));
        }
      }
    } catch {
      // rollback
      setIsFollowing(wasFollowing);
      const rollback = wasFollowing ? 1 : -1;
      setStats((s) => ({
        ...s,
        followers_count: Math.max(s.followers_count + rollback, 0),
      }));
      setUserStats((s) => ({
        ...s,
        followers_count: Math.max(s.followers_count + rollback, 0),
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

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
          <Ionicons
            name="chevron-back"
            size={28}
            color={theme.foreground.white}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
      >
        <ProfileHeader
          mode="public"
          coverUrl={profile.cover_url ?? null}
          avatarUrl={profile.avatar_url ?? null}
          displayName={displayName}
          username={profile.username ?? null}
          memberSinceIso={profile.created_at ?? null}
          badge={null}
          isFollowing={isFollowing}
          followPending={pendingRequest}
          stats={{
            posts: userStats.posts_count,
            followers: userStats.followers_count,
            likes: userStats.likes_count,
          }}
          locale={undefined}
          onActivityPress={() =>
            router.navigate(
              `/user/follows/${profile.id}?tab=followers` as any,
            )
          }
          onPrimaryPress={toggling ? undefined : handleToggleFollow}
          onSecondaryPress={() => {
            // Chat flow TBD — route to DM once available.
          }}
        />

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
    topBar: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingTop: 8,
      paddingBottom: 4,
    },
    content: { flex: 1 },
    scrollContent: { paddingBottom: 24 },
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
    postsSection: { paddingHorizontal: 12 },
    postsTitle: {
      fontSize: 16,
      fontFamily: FONTS.bold,
      color: theme.foreground.white,
      marginBottom: 10,
    },
    postsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 2 },
    gridItem: {
      width: "32%",
      aspectRatio: 1,
      borderRadius: 0,
      overflow: "hidden",
    },
    gridImage: { width: "100%", height: "100%" },
  });

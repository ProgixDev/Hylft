import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ProfileHeader from "../../components/profile/ProfileHeader";
import type { PostData } from "../../components/ui/Post";
import { Shimmer } from "../../components/ui/PostSkeleton";
import { useTheme } from "../../contexts/ThemeContext";
import { api } from "../../services/api";
import { mapPostToUi, type BackendPost } from "../../services/feedMappers";
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

function ProfileSkeleton({ theme }: { theme: ReturnType<typeof useTheme>["theme"] }) {
  const base = "rgba(255,255,255,0.08)";
  const highlight = "rgba(255,255,255,0.18)";
  return (
    <View style={{ flex: 1, backgroundColor: theme.background.dark }}>
      {/* Cover */}
      <Shimmer
        style={{ height: 220, marginHorizontal: 12, marginTop: 12, borderRadius: 24 }}
        baseColor={base}
        highlightColor={highlight}
      />
      {/* Avatar */}
      <View style={{ alignItems: "center", marginTop: -44 }}>
        <Shimmer
          style={{ width: 88, height: 88, borderRadius: 44, borderWidth: 3, borderColor: theme.background.dark }}
          baseColor={base}
          highlightColor={highlight}
        />
      </View>
      {/* Name + handle */}
      <View style={{ alignItems: "center", marginTop: 12, gap: 8, paddingHorizontal: 20 }}>
        <Shimmer style={{ height: 22, width: 160, borderRadius: 8 }} baseColor={base} highlightColor={highlight} />
        <Shimmer style={{ height: 14, width: 100, borderRadius: 6 }} baseColor={base} highlightColor={highlight} />
      </View>
      {/* Stats row */}
      <View style={{ flexDirection: "row", marginTop: 20, paddingHorizontal: 20, gap: 12 }}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={{ flex: 1, alignItems: "center", gap: 6 }}>
            <Shimmer style={{ height: 18, width: 40, borderRadius: 6 }} baseColor={base} highlightColor={highlight} />
            <Shimmer style={{ height: 12, width: 52, borderRadius: 4 }} baseColor={base} highlightColor={highlight} />
          </View>
        ))}
      </View>
      {/* Button */}
      <View style={{ marginTop: 16, paddingHorizontal: 20 }}>
        <Shimmer style={{ height: 48, borderRadius: 14 }} baseColor={base} highlightColor={highlight} />
      </View>
      {/* Posts grid */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 2, marginTop: 24, paddingHorizontal: 12 }}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Shimmer
            key={i}
            style={{ width: "32%", aspectRatio: 1, borderRadius: 4 }}
            baseColor={base}
            highlightColor={highlight}
          />
        ))}
      </View>
    </View>
  );
}

export default function UserProfile() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [userStats, setUserStats] = useState<UserStats>({
    posts_count: 0,
    followers_count: 0,
    following_count: 0,
    likes_count: 0,
  });
  const [isFollowing, setIsFollowing] = useState(false);
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toggling, setToggling] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [profileRes, followRes, userStatsRes] = await Promise.all([
        api.getPublicProfile(id) as Promise<PublicProfile>,
        api.isFollowing(id) as Promise<{ is_following: boolean }>,
        api.getUserStats(id) as Promise<UserStats>,
      ]);
      setProfile(profileRes);
      setUserStats(userStatsRes);
      setIsFollowing(!!followRes.is_following);

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
    const wasFollowing = isFollowing;
    setIsFollowing(!wasFollowing);
    setUserStats((s) => ({
      ...s,
      followers_count: Math.max(s.followers_count + (wasFollowing ? -1 : 1), 0),
    }));
    try {
      if (wasFollowing) {
        await api.unfollow(id);
      } else {
        await api.follow(id);
      }
    } catch {
      setIsFollowing(wasFollowing);
      setUserStats((s) => ({
        ...s,
        followers_count: Math.max(s.followers_count + (wasFollowing ? 1 : -1), 0),
      }));
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="chevron-back" size={28} color={theme.foreground.white} />
          </TouchableOpacity>
        </View>
        <ScrollView
          style={[styles.content, { backgroundColor: theme.background.dark }]}
          contentContainerStyle={styles.scrollContent}
        >
          <ProfileSkeleton theme={theme} />
        </ScrollView>
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
          <Ionicons name="chevron-back" size={28} color={theme.foreground.white} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <ProfileHeader
          mode="public"
          coverUrl={profile.cover_url ?? null}
          avatarUrl={profile.avatar_url ?? null}
          displayName={displayName}
          username={profile.username ?? null}
          memberSinceIso={profile.created_at ?? null}
          badge={null}
          isFollowing={isFollowing}
          stats={{
            posts: userStats.posts_count,
            followers: userStats.followers_count,
            likes: userStats.likes_count,
          }}
          locale={undefined}
          onPrimaryPress={toggling ? undefined : handleToggleFollow}
        />

        {posts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="image-outline" size={64} color={theme.foreground.gray} />
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
                    <Image source={{ uri: post.images[0] }} style={styles.gridImage} />
                  ) : (
                    <View style={[styles.gridImage, { backgroundColor: theme.background.darker }]} />
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
    gridItem: { width: "32%", aspectRatio: 1, overflow: "hidden" },
    gridImage: { width: "100%", height: "100%" },
  });

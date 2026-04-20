import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Post, { PostData } from "../../components/ui/Post";

const MOCK_POSTS: PostData[] = [
  {
    id: "mock-1",
    user: {
      id: "u-mock-1",
      username: "alex_lifts",
      avatar: "https://i.pravatar.cc/150?img=12",
    },
    images: [
      "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800",
    ],
    likes: 1284,
    caption: "New bench PR today! 💪 Hard work pays off.",
    comments: 47,
    timestamp: "2h ago",
    isLiked: false,
    weight: "225 lb",
    sets: "5",
    reps: "5",
  },
  {
    id: "mock-2",
    user: {
      id: "u-mock-2",
      username: "sarah_fit",
      avatar: "https://i.pravatar.cc/150?img=47",
    },
    images: [
      "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800",
      "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800",
    ],
    likes: 2841,
    caption: "Leg day done 🔥 Who's training with me tomorrow?",
    comments: 132,
    timestamp: "5h ago",
    isLiked: true,
    weight: "185 lb",
    sets: "4",
    reps: "8",
  },
  {
    id: "mock-3",
    user: {
      id: "u-mock-3",
      username: "mike_beast",
      avatar: "https://i.pravatar.cc/150?img=33",
    },
    images: [],
    likes: 421,
    caption: "Full body workout complete. Feeling unstoppable.",
    comments: 18,
    timestamp: "8h ago",
    isLiked: false,
    duration: "62 min",
  },
  {
    id: "mock-4",
    user: {
      id: "u-mock-4",
      username: "emma_strong",
      avatar: "https://i.pravatar.cc/150?img=24",
    },
    images: [
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800",
    ],
    likes: 892,
    caption: "Deadlift day! New personal best 🏆",
    comments: 64,
    timestamp: "1d ago",
    isLiked: false,
    weight: "315 lb",
    sets: "3",
    reps: "3",
  },
  {
    id: "mock-5",
    user: {
      id: "u-mock-5",
      username: "chris_gains",
      avatar: "https://i.pravatar.cc/150?img=58",
    },
    images: [
      "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800",
      "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800",
      "https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=800",
    ],
    likes: 3567,
    caption: "Morning pump hits different ☀️ Let's get it!",
    comments: 201,
    timestamp: "2d ago",
    isLiked: true,
  },
];
import { FONTS } from "../../constants/fonts";
import { Theme } from "../../constants/themes";
import { useTheme } from "../../contexts/ThemeContext";
import { useFeedTimeline } from "../../hooks/useFeedTimeline";
import { api } from "../../services/api";

const controlShadow = Platform.select({
  ios: {
    shadowColor: "#000000",
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  android: { elevation: 4 },
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
      paddingBottom: 8,
    },
    title: {
      fontFamily: FONTS.extraBold,
      fontSize: 22,
      color: theme.foreground.white,
    },
    headerIcons: {
      flexDirection: "row",
      gap: 8,
      alignItems: "center",
    },
    iconButton: {
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
    notificationBadge: {
      position: "absolute",
      top: 7,
      right: 7,
      width: 7,
      height: 7,
      borderRadius: 3.5,
      backgroundColor: theme.primary.main,
      borderWidth: 1.5,
      borderColor: theme.background.darker,
    },
    emptyWrap: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 32,
      paddingVertical: 64,
    },
    emptyText: {
      fontFamily: FONTS.regular,
      fontSize: 14,
      color: theme.foreground.gray,
      textAlign: "center",
    },
    errorText: {
      fontFamily: FONTS.regular,
      fontSize: 13,
      color: "#e27171",
      textAlign: "center",
      paddingHorizontal: 20,
      paddingVertical: 12,
    },
    footerLoading: {
      paddingVertical: 16,
      alignItems: "center",
    },
  });
}

export default function Feed() {
  const router = useRouter();
  const { theme, themeType } = useTheme();
  const { t } = useTranslation();
  const {
    posts,
    loading,
    refreshing,
    loadingMore,
    hasMore,
    error,
    refresh,
    loadMore,
    toggleLike,
  } = useFeedTimeline({ scope: "timeline" });
  const [unreadCount, setUnreadCount] = useState(0);

  const styles = createStyles(theme);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res: { unread: number } = await api.getUnreadNotificationsCount();
        if (!cancelled) setUnreadCount(res.unread ?? 0);
      } catch {
        /* silent */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const renderPost = useCallback(
    ({ item }: { item: PostData }) => <Post post={item} onLike={toggleLike} />,
    [toggleLike],
  );

  const listEmpty = loading ? null : (
    <View style={styles.emptyWrap}>
      <Text style={styles.emptyText}>{t("feed.empty", "No posts yet")}</Text>
    </View>
  );

  const listFooter = loadingMore ? (
    <View style={styles.footerLoading}>
      <ActivityIndicator color={theme.primary.main} />
    </View>
  ) : null;

  return (
    <View style={styles.container}>
      {themeType === "female" && (
        <Image
          source={require("../../../assets/girly.png")}
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%", opacity: 0.3 }}
          resizeMode="cover"
        />
      )}
      <View style={styles.header}>
        <Text style={styles.title}>{t("tabs.feed")}</Text>
        <View style={styles.headerIcons}>
          <Pressable
            style={({ pressed }) => [
              styles.iconButton,
              pressed && { opacity: 0.7, transform: [{ scale: 0.92 }] },
            ]}
            onPress={() => router.navigate("/search" as any)}
          >
            <Ionicons name="search" size={20} color={theme.foreground.white} />
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.iconButton,
              pressed && { opacity: 0.7, transform: [{ scale: 0.92 }] },
            ]}
            onPress={() => router.navigate("/notifications" as any)}
          >
            <Ionicons
              name="notifications-outline"
              size={20}
              color={theme.foreground.white}
            />
            {unreadCount > 0 && <View style={styles.notificationBadge} />}
          </Pressable>
        </View>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <FlatList
        data={[...MOCK_POSTS, ...posts]}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 90 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={theme.primary.main}
            colors={[theme.primary.main]}
          />
        }
        onEndReached={hasMore ? loadMore : undefined}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={listEmpty}
        ListFooterComponent={listFooter}
      />
    </View>
  );
}

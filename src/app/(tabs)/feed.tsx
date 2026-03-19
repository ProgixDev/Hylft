import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Post, { PostData } from "../../components/ui/Post";
import { FONTS } from "../../constants/fonts";
import { Theme } from "../../constants/themes";
import { useTheme } from "../../contexts/ThemeContext";
import { addPostsListener, getPostsWithUserData } from "../../data/mockData";

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
  });
}

export default function Feed() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount] = useState(3); // Example: 3 unread messages

  // Initialize posts with like state
  const [posts, setPosts] = useState<PostData[]>(
    () =>
      getPostsWithUserData().map((post) => ({
        id: post.id,
        user: {
          id: post.user.id,
          username: post.user.username,
          avatar: post.user.avatar,
          bio: post.user.bio,
        },
        images: post.images,
        likes: post.likes,
        caption: post.caption,
        comments: post.comments,
        timestamp: post.timestamp,
        isLiked: post.isLiked,
        weight: post.weight,
        reps: post.reps,
        sets: post.sets,
        duration: post.duration,
      })) as PostData[],
  );

  const styles = createStyles(theme);

  // Refresh feed whenever a new post is added (e.g. after a workout)
  useEffect(() => {
    const unsub = addPostsListener(() => {
      setPosts(
        getPostsWithUserData().map((post) => ({
          id: post.id,
          user: {
            id: post.user.id,
            username: post.user.username,
            avatar: post.user.avatar,
            bio: post.user.bio,
          },
          images: post.images,
          likes: post.likes,
          caption: post.caption,
          comments: post.comments,
          timestamp: post.timestamp,
          isLiked: post.isLiked,
          weight: post.weight,
          reps: post.reps,
          sets: post.sets,
          duration: post.duration,
        })) as PostData[],
      );
    });
    return unsub;
  }, []);

  const handleLike = useCallback((postId: string) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.id === postId
          ? {
              ...post,
              isLiked: !post.isLiked,
              likes: post.isLiked ? post.likes - 1 : post.likes + 1,
            }
          : post,
      ),
    );
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  }, []);

  const renderPost = useCallback(
    ({ item }: { item: PostData }) => <Post post={item} onLike={handleLike} />,
    [handleLike],
  );

  return (
    <View style={styles.container}>
      {/* Header */}
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

      {/* Posts Feed */}
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 90 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary.main}
            colors={[theme.primary.main]}
          />
        }
      />
    </View>
  );
}


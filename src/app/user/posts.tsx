import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import ImageCarousel from "../../components/ui/ImageCarousel";
import type { PostData } from "../../components/ui/Post";
import { useTheme } from "../../contexts/ThemeContext";
import { api } from "../../services/api";
import { mapPostToUi, type BackendPost } from "../../services/feedMappers";

import { FONTS } from "../../constants/fonts";

export default function UserPosts() {
  const { t } = useTranslation();
  const router = useRouter();
  const { userId, postIndex } = useLocalSearchParams<{
    userId?: string;
    postIndex?: string;
  }>();
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const flatListRef = useRef<FlatList<PostData>>(null);
  const initialIndex = Number.parseInt(postIndex ?? "0", 10) || 0;

  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPosts = async () => {
      if (!userId) {
        setPosts([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const res = (await api.listPosts({
          scope: "author",
          author_id: userId,
          limit: 50,
        })) as { items: BackendPost[] };
        setPosts((res.items ?? []).map(mapPostToUi));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load posts");
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, [userId]);

  const handleLike = async (postId: string) => {
    let prevState: { isLiked: boolean; likes: number } | null = null;
    setPosts((prevPosts) =>
      prevPosts.map((post) => {
        if (post.id !== postId) return post;
        prevState = { isLiked: post.isLiked, likes: post.likes };
        return {
          ...post,
          isLiked: !post.isLiked,
          likes: post.isLiked ? Math.max(post.likes - 1, 0) : post.likes + 1,
        };
      }),
    );

    try {
      if (prevState?.isLiked) await api.unlikePost(postId);
      else await api.likePost(postId);
    } catch {
      if (!prevState) return;
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId
            ? { ...post, isLiked: prevState!.isLiked, likes: prevState!.likes }
            : post,
        ),
      );
    }
  };

  useEffect(() => {
    // Jump directly to the clicked post without animation.
    if (
      flatListRef.current &&
      initialIndex > 0 &&
      initialIndex < posts.length
    ) {
      // Use setTimeout to ensure FlatList has rendered
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: initialIndex,
          animated: false,
        });
      }, 50);
    }
  }, [initialIndex, posts.length]);

  const handleUserPress = (userId: string) => {
    router.navigate(`/user/${userId}` as any);
  };

  const renderPost = ({ item }: { item: PostData }) => (
    <View style={styles.postContainer}>
      {/* Post Header */}
      <TouchableOpacity
        onPress={() => handleUserPress(item.user.id)}
        style={styles.postHeader}
      >
        {item.user.avatar ? (
          <Image source={{ uri: item.user.avatar }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={18} color={theme.foreground.gray} />
          </View>
        )}
        <Text style={styles.username}>{item.user.username}</Text>
      </TouchableOpacity>

      {/* Post Images */}
      <ImageCarousel
        images={item.images}
        style={styles.postImage}
        onLike={() => handleLike(item.id)}
        isLiked={item.isLiked}
      />

      {/* Actions */}
      <View style={styles.actionsContainer}>
        <View style={styles.leftActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleLike(item.id)}
          >
            <Ionicons
              name={item.isLiked ? "trophy" : "trophy-outline"}
              size={24}
              color={item.isLiked ? theme.primary.main : theme.foreground.white}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.navigate(`/comments/${item.id}` as any)}
          >
            <Ionicons
              name="chatbubble-outline"
              size={22}
              color={theme.foreground.white}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons
              name="share-outline"
              size={24}
              color={theme.foreground.white}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Likes and Caption */}
      <View style={styles.contentContainer}>
        <Text style={styles.likes}>
          {item.likes.toLocaleString()} {t("post.likes")}
        </Text>
        <View style={styles.captionContainer}>
          <Text style={styles.captionUsername}>{item.user.username}</Text>
          <Text style={styles.caption}> {item.caption}</Text>
        </View>
        {item.comments > 0 && (
          <TouchableOpacity
            onPress={() => router.navigate(`/comments/${item.id}` as any)}
          >
            <Text style={styles.viewComments}>
              {t("post.viewAllComments").replace(
                "{count}",
                String(item.comments),
              )}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons
            name="chevron-back"
            size={28}
            color={theme.foreground.white}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("user.posts")}</Text>
        <View style={styles.spacer} />
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={theme.primary.main} />
        </View>
      ) : error ? (
        <View style={styles.centerState}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : posts.length === 0 ? (
        <View style={styles.centerState}>
          <Text style={styles.emptyText}>{t("user.noPostsYet")}</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={posts}
          renderItem={renderPost}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          onScrollToIndexFailed={() => {
            flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
          }}
        />
      )}
    </View>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>["theme"]) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background.dark,
    },
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
    spacer: {
      width: 28,
    },
    postContainer: {
      marginBottom: 24,
    },
    listContent: {
      paddingBottom: 24,
    },
    centerState: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 24,
    },
    emptyText: {
      color: theme.foreground.gray,
      fontFamily: FONTS.medium,
      fontSize: 14,
    },
    errorText: {
      color: theme.foreground.white,
      fontFamily: FONTS.medium,
      fontSize: 14,
      textAlign: "center",
    },
    postHeader: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: 12,
    },
    avatarPlaceholder: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.background.darker,
    },
    username: {
      fontSize: 14,
      fontFamily: FONTS.semiBold,
      color: theme.foreground.white,
    },
    metricsContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      paddingHorizontal: 16,
      paddingBottom: 12,
    },
    metricItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: theme.background.darker,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
    },
    metricText: {
      fontSize: 12,
      fontFamily: FONTS.semiBold,
      color: theme.foreground.white,
    },
    postImage: {
      width: "100%",
      height: 400,
      backgroundColor: theme.background.darker,
    },
    actionsContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    leftActions: {
      flexDirection: "row",
      gap: 16,
    },
    actionButton: {
      padding: 4,
    },
    contentContainer: {
      paddingHorizontal: 16,
    },
    likes: {
      fontSize: 14,
      fontFamily: FONTS.semiBold,
      color: theme.foreground.white,
      marginBottom: 8,
    },
    captionContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
    },
    captionUsername: {
      fontSize: 14,
      fontFamily: FONTS.semiBold,
      color: theme.foreground.white,
    },
    caption: {
      fontSize: 14,
      color: theme.foreground.white,
      lineHeight: 20,
    },
    viewComments: {
      fontSize: 14,
      color: theme.foreground.gray,
      marginTop: 8,
    },
  });

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { memo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Image, Pressable, Share, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import ImageCarousel from "./ImageCarousel";

export type PostData = {
  id: string;
  user: {
    id: string;
    username: string;
    avatar: string;
    bio?: string;
  };
  images: string[]; // Support multiple images (1-4)
  likes: number;
  caption: string;
  comments: number;
  timestamp: string;
  isLiked: boolean;
  // Bodybuilding specific
  weight?: string;
  reps?: string;
  sets?: string;
  duration?: string;
};

type PostProps = {
  post: PostData;
  onLike: (postId: string) => void;
};

const Post = memo(
  ({ post, onLike }: PostProps) => {
    const { t } = useTranslation();
    const router = useRouter();
    const { theme } = useTheme();
    const [isSaved, setIsSaved] = useState(false);

    const handleUserPress = () => {
      router.navigate(`/user/${post.user.id}` as any);
    };

    const handleShare = async () => {
      try {
        await Share.share({
          message: `${t("post.checkOutPost")} ${post.user.username}!`,
          url: post.images[0],
          title: t("post.sharePost"),
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    };

    const handleSave = () => {
      setIsSaved(!isSaved);
    };

    const handleComments = () => {
      router.navigate(`/comments/${post.id}` as any);
    };

    const styles = createStyles(theme);

    return (
      <View style={styles.postContainer}>
        {/* Post Header */}
        <View style={styles.postHeader}>
          <Pressable
            onPress={handleUserPress}
            style={({ pressed }) => [
              styles.userHeaderButton,
              pressed && { opacity: 0.7 },
            ]}
          >
            <View style={styles.avatarWrapper}>
              <Image source={{ uri: post.user.avatar }} style={styles.avatar} />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.username}>{post.user.username}</Text>
              <Text style={styles.timestamp}>{post.timestamp}</Text>
            </View>
          </Pressable>
        </View>

        {/* Metrics Info - Above Image */}
        {(post.weight || post.reps || post.sets) && (
          <View style={styles.metricsSection}>
            <View style={styles.metricsContainer}>
              {post.weight && (
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>{t("post.weight")}</Text>
                  <Text style={styles.metricValue}>{post.weight}</Text>
                </View>
              )}
              {post.sets && (
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>{t("post.sets")}</Text>
                  <Text style={styles.metricValue}>{post.sets}</Text>
                </View>
              )}
              {post.reps && (
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>{t("post.reps")}</Text>
                  <Text style={styles.metricValue}>{post.reps}</Text>
                </View>
              )}
              {post.duration && (
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>{t("post.duration")}</Text>
                  <Text style={styles.metricValue}>{post.duration}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Post Images */}
        <ImageCarousel
          images={post.images}
          style={styles.postImage}
          onLike={() => onLike(post.id)}
          isLiked={post.isLiked}
        />

        {/* Post Actions */}
        <View style={styles.actionsContainer}>
          <View style={styles.leftActions}>
            <Pressable
              onPress={() => onLike(post.id)}
              style={({ pressed }) => [
                styles.actionButton,
                pressed && { opacity: 0.7, transform: [{ scale: 0.88 }] },
              ]}
            >
              <Ionicons
                name={post.isLiked ? "trophy" : "trophy-outline"}
                size={26}
                color={
                  post.isLiked ? theme.primary.main : theme.foreground.white
                }
              />
              {post.likes > 0 && (
                <Text
                  style={[
                    styles.actionCount,
                    post.isLiked && { color: theme.primary.main },
                  ]}
                >
                  {post.likes.toLocaleString()}
                </Text>
              )}
            </Pressable>
            <Pressable
              onPress={handleComments}
              style={({ pressed }) => [
                styles.actionButton,
                pressed && { opacity: 0.7, transform: [{ scale: 0.88 }] },
              ]}
            >
              <Ionicons
                name="chatbubble-outline"
                size={24}
                color={theme.foreground.white}
              />
              {post.comments > 0 && (
                <Text style={styles.actionCount}>{post.comments}</Text>
              )}
            </Pressable>
            <Pressable
              onPress={handleShare}
              style={({ pressed }) => [
                styles.actionButton,
                pressed && { opacity: 0.7, transform: [{ scale: 0.88 }] },
              ]}
            >
              <Ionicons
                name="share-outline"
                size={24}
                color={theme.foreground.white}
              />
            </Pressable>
          </View>
          <Pressable
            onPress={handleSave}
            style={({ pressed }) => [
              styles.actionButton,
              pressed && { opacity: 0.7, transform: [{ scale: 0.88 }] },
            ]}
          >
            <Ionicons
              name={isSaved ? "bookmark" : "bookmark-outline"}
              size={24}
              color={isSaved ? theme.primary.main : theme.foreground.white}
            />
          </Pressable>
        </View>

        {/* Post Info */}
        <View style={styles.postInfo}>
          <Text style={styles.caption}>
            <Text style={styles.username}>{post.user.username} </Text>
            {post.caption}
          </Text>
          {post.comments > 0 && (
            <Pressable
              onPress={handleComments}
              style={({ pressed }) => pressed && { opacity: 0.7 }}
            >
              <Text style={styles.viewComments}>
                {t("post.viewAllComments").replace(
                  "{count}",
                  String(post.comments),
                )}
              </Text>
            </Pressable>
          )}
        </View>
        <View style={styles.divider} />
      </View>
    );
  },
  (prevProps, nextProps) => {
    // Only re-render if the post data or like state changes
    return (
      prevProps.post.id === nextProps.post.id &&
      prevProps.post.isLiked === nextProps.post.isLiked &&
      prevProps.post.likes === nextProps.post.likes
    );
  },
);

Post.displayName = "Post";

const createStyles = (theme: ReturnType<typeof useTheme>["theme"]) =>
  StyleSheet.create({
    postContainer: {
      marginBottom: 0,
    },
    divider: {
      height: 8,
      backgroundColor: theme.background.dark,
    },
    postHeader: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    userHeaderButton: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    avatarWrapper: {
      width: 44,
      height: 44,
      borderRadius: 22,
      padding: 2,
      backgroundColor: theme.primary.main + "40",
      marginRight: 10,
    },
    avatar: {
      width: "100%",
      height: "100%",
      borderRadius: 20,
    },
    userInfo: {
      flex: 1,
    },
    username: {
      fontSize: 15,
      fontWeight: "600",
      color: theme.foreground.white,
    },
    timestamp: {
      fontSize: 12,
      color: theme.foreground.gray,
      marginTop: 2,
    },
    moreButton: {
      padding: 4,
    },
    postImage: {
      width: "100%",
      height: 400,
      backgroundColor: theme.background.darker,
    },
    actionsContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 8,
      paddingVertical: 6,
    },
    leftActions: {
      flexDirection: "row",
      gap: 0,
    },
    actionButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 8,
    },
    actionCount: {
      fontSize: 13,
      fontWeight: "600",
      color: theme.foreground.white,
    },
    metricsSection: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: "rgba(255,255,255,0.08)",
    },
    metricsContainer: {
      flexDirection: "row",
      gap: 12,
      flexWrap: "wrap",
    },
    metricItem: {
      flex: 1,
      minWidth: 70,
      alignItems: "center",
      paddingVertical: 6,
    },
    metricLabel: {
      fontSize: 11,
      color: theme.foreground.gray,
      marginBottom: 4,
    },
    metricValue: {
      fontSize: 14,
      fontWeight: "700",
      color: theme.foreground.white,
    },
    postInfo: {
      paddingHorizontal: 16,
      paddingTop: 2,
      paddingBottom: 12,
    },
    metadataContainer: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 12,
      flexWrap: "wrap",
    },
    metadataTag: {
      backgroundColor: theme.primary.main,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
    },
    metadataLabel: {
      fontSize: 12,
      fontWeight: "600",
      color: theme.background.dark,
    },
    likes: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.foreground.white,
      marginBottom: 8,
    },
    caption: {
      fontSize: 14,
      color: theme.foreground.white,
      lineHeight: 20,
      marginBottom: 4,
    },
    viewComments: {
      fontSize: 14,
      color: theme.foreground.gray,
      marginTop: 4,
    },
  });

export default Post;

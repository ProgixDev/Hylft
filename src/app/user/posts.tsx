import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import ImageCarousel from "../../components/ui/ImageCarousel";
import { useTheme } from "../../contexts/ThemeContext";
import { getPostsByUserId, getUserById } from "../../data/mockData";

interface UserPost {
  id: string;
  images: string[];
  likes: number;
  comments: number;
  caption: string;
  isLiked: boolean;
  user: {
    id: string;
    username: string;
    avatar: string;
  };
  weight?: string;
  sets?: string;
  reps?: string;
  duration?: string;
}

export default function UserPosts() {
  const { t } = useTranslation();
  const router = useRouter();
  const { userId, postIndex } = useLocalSearchParams();
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const flatListRef = useRef<FlatList>(null);
  const initialIndex = parseInt(postIndex as string) || 0;

  // Get posts for this user from centralized data
  const userPostsData = getPostsByUserId(userId as string);
  const user = getUserById(userId as string);

  const [posts, setPosts] = useState<UserPost[]>(
    userPostsData.map((post) => ({
      id: post.id,
      images: post.images,
      likes: post.likes,
      comments: post.comments,
      caption: post.caption,
      isLiked: false,
      user: {
        id: user?.id || "",
        username: user?.username || "",
        avatar: user?.avatar || "",
      },
      weight: post.weight,
      sets: post.sets,
      reps: post.reps,
      duration: post.duration,
    })),
  );

  const handleLike = (postId: string) => {
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
  };

  useEffect(() => {
    // Jump directly to the clicked post without animation
    if (flatListRef.current && initialIndex > 0) {
      // Use setTimeout to ensure FlatList has rendered
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: initialIndex,
          animated: false,
        });
      }, 50);
    }
  }, [initialIndex]);

  const handleUserPress = (userId: string) => {
    router.navigate(`/user/${userId}` as any);
  };

  const renderPost = ({ item }: { item: UserPost }) => (
    <View style={styles.postContainer}>
      {/* Post Header */}
      <TouchableOpacity
        onPress={() => handleUserPress(item.user.id)}
        style={styles.postHeader}
      >
        <Image source={{ uri: item.user.avatar }} style={styles.avatar} />
        <Text style={styles.username}>{item.user.username}</Text>
      </TouchableOpacity>

      {/* Metrics */}
      {(item.weight || item.sets || item.reps || item.duration) && (
        <View style={styles.metricsContainer}>
          {item.weight && (
            <View style={styles.metricItem}>
              <Ionicons name="barbell" size={16} color={theme.primary.main} />
              <Text style={styles.metricText}>{item.weight}</Text>
            </View>
          )}
          {item.sets && (
            <View style={styles.metricItem}>
              <Ionicons name="repeat" size={16} color={theme.primary.main} />
              <Text style={styles.metricText}>{item.sets} {t("user.sets")}</Text>
            </View>
          )}
          {item.reps && (
            <View style={styles.metricItem}>
              <Ionicons name="fitness" size={16} color={theme.primary.main} />
              <Text style={styles.metricText}>{item.reps} {t("user.reps")}</Text>
            </View>
          )}
          {item.duration && (
            <View style={styles.metricItem}>
              <Ionicons name="time" size={16} color={theme.primary.main} />
              <Text style={styles.metricText}>{item.duration}</Text>
            </View>
          )}
        </View>
      )}

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
        <Text style={styles.likes}>{item.likes.toLocaleString()} {t("post.likes")}</Text>
        <View style={styles.captionContainer}>
          <Text style={styles.captionUsername}>{item.user.username}</Text>
          <Text style={styles.caption}> {item.caption}</Text>
        </View>
        {item.comments > 0 && (
          <TouchableOpacity
            onPress={() => router.navigate(`/comments/${item.id}` as any)}
          >
            <Text style={styles.viewComments}>
              {t("post.viewAllComments").replace("{count}", String(item.comments))}
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

      {/* Posts List */}
      <FlatList
        ref={flatListRef}
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
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
      fontWeight: "700",
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
    username: {
      fontSize: 14,
      fontWeight: "600",
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
      fontWeight: "600",
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
      fontWeight: "600",
      color: theme.foreground.white,
      marginBottom: 8,
    },
    captionContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
    },
    captionUsername: {
      fontSize: 14,
      fontWeight: "600",
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

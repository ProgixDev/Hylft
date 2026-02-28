import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../contexts/ThemeContext";
import { getUserProfile } from "../../data/mockData";

export default function UserProfile() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { theme } = useTheme();
  const userProfileData = getUserProfile(id as string);
  const styles = createStyles(theme);
  const [isFollowing, setIsFollowing] = useState(userProfileData?.isFollowing || false);

  if (!userProfileData) {
    return (
      <View style={styles.container}>
        <Text style={{ color: theme.foreground.white }}>{t("user.userNotFound")}</Text>
      </View>
    );
  }

  const handleToggleFollow = () => {
    setIsFollowing(!isFollowing);
  };

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
        <Text style={styles.headerTitle}>{userProfileData.username}</Text>
        <View style={styles.spacer} />
      </View>

      {/* Profile Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <Image
            source={{ uri: userProfileData.avatar }}
            style={styles.avatar}
          />
          <View style={styles.profileInfo}>
            <View style={styles.nameContainer}>
              <Text style={styles.username}>{userProfileData.username}</Text>
              {userProfileData.isPrivate && (
                <Ionicons
                  name="lock-closed"
                  size={16}
                  color={theme.foreground.gray}
                  style={styles.lockIcon}
                />
              )}
            </View>
            <Text style={styles.bio}>{userProfileData.bio}</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{userProfileData.postsCount}</Text>
            <Text style={styles.statLabel}>{t("user.posts")}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>
              {userProfileData.followers > 1000
                ? (userProfileData.followers / 1000).toFixed(1) + "k"
                : userProfileData.followers}
            </Text>
            <Text style={styles.statLabel}>{t("user.followers")}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>
              {userProfileData.following > 1000
                ? (userProfileData.following / 1000).toFixed(1) + "k"
                : userProfileData.following}
            </Text>
            <Text style={styles.statLabel}>{t("user.following")}</Text>
          </View>
        </View>

        {/* Follow Button */}
        <TouchableOpacity
          style={[styles.followButton, isFollowing && styles.followingButton]}
          onPress={handleToggleFollow}
        >
          <Text
            style={[
              styles.followButtonText,
              isFollowing && styles.followingButtonText,
            ]}
          >
            {isFollowing ? t("user.following") : t("user.follow")}
          </Text>
        </TouchableOpacity>

        {/* Content Based on Privacy */}
        {userProfileData.isPrivate ? (
          <View style={styles.privateContainer}>
            <Ionicons
              name="lock-closed"
              size={64}
              color={theme.foreground.gray}
            />
            <Text style={styles.privateTitle}>{t("user.thisAccountIsPrivate")}</Text>
            <Text style={styles.privateSubtitle}>
              {t("user.followToSeePosts")}
            </Text>
          </View>
        ) : userProfileData.posts_data.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="image-outline"
              size={64}
              color={theme.foreground.gray}
            />
            <Text style={styles.emptyTitle}>{t("user.noPostsYet")}</Text>
            <Text style={styles.emptySubtitle}>
              {t("user.userHasntShared")}
            </Text>
          </View>
        ) : (
          <View style={styles.postsSection}>
            <Text style={styles.postsTitle}>{t("user.posts")}</Text>
            <View style={styles.postsGrid}>
              {userProfileData.posts_data.map((post, index) => (
                <TouchableOpacity
                  key={post.id}
                  style={styles.gridItem}
                  onPress={() =>
                    router.navigate(
                      `/user/posts?userId=${userProfileData.id}&postIndex=${index}` as any,
                    )
                  }
                >
                  <Image
                    source={{ uri: post.images[0] }}
                    style={styles.gridImage}
                  />
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
    content: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 24,
    },
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
    },
    profileInfo: {
      flex: 1,
    },
    nameContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 4,
    },
    username: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.foreground.white,
    },
    lockIcon: {
      marginLeft: 8,
    },
    bio: {
      fontSize: 13,
      color: theme.foreground.gray,
      marginBottom: 8,
    },
    statsContainer: {
      flexDirection: "row",
      justifyContent: "space-around",
      paddingHorizontal: 16,
      marginBottom: 20,
    },
    statBox: {
      alignItems: "center",
    },
    statNumber: {
      fontSize: 18,
      fontWeight: "700",
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
      borderRadius: 8,
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
      fontSize: 14,
      fontWeight: "600",
      color: theme.background.dark,
    },
    followingButtonText: {
      color: theme.primary.main,
    },
    privateContainer: {
      alignItems: "center",
      paddingVertical: 60,
    },
    privateTitle: {
      fontSize: 18,
      fontWeight: "600",
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
    emptyState: {
      alignItems: "center",
      paddingVertical: 60,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: "600",
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
    postsSection: {
      paddingHorizontal: 16,
    },
    postsTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.foreground.white,
      marginBottom: 12,
    },
    postsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 4,
    },
    gridItem: {
      width: "32%",
      aspectRatio: 1,
      borderRadius: 8,
      overflow: "hidden",
    },
    gridImage: {
      width: "100%",
      height: "100%",
    },
    postItem: {
      marginHorizontal: 16,
      marginBottom: 16,
      borderRadius: 12,
      overflow: "hidden",
      height: 300,
    },
    postImage: {
      width: "100%",
      height: "100%",
    },
    postOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.3)",
      justifyContent: "flex-end",
      padding: 16,
    },
    postStats: {
      flexDirection: "row",
      gap: 16,
    },
    stat: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: "rgba(0, 0, 0, 0.6)",
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
    },
    statText: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.foreground.white,
    },
  });


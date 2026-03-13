import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
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
import {
    getFollowers,
    getFollowing,
    getUserById,
    User,
} from "../../../data/mockData";

import { FONTS } from "../../../constants/fonts";

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background.dark,
    },
    // header
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.background.accent,
    },
    backBtn: {
      padding: 6,
      marginRight: 8,
    },
    headerTitle: {
      fontSize: 20,
      fontFamily: FONTS.bold,
      color: theme.foreground.white,
    },
    // tab bar
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
    tabActive: {
      borderBottomColor: theme.primary.main,
    },
    tabText: {
      fontSize: 15,
      fontFamily: FONTS.semiBold,
      color: theme.foreground.gray,
    },
    tabTextActive: {
      color: theme.primary.main,
    },
    // user item
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
    },
    userInfo: {
      flex: 1,
    },
    userName: {
      fontSize: 16,
      fontFamily: FONTS.semiBold,
      color: theme.foreground.white,
      marginBottom: 2,
    },
    userBio: {
      fontSize: 13,
      color: theme.foreground.gray,
      lineHeight: 18,
    },
    followBtn: {
      paddingHorizontal: 20,
      paddingVertical: 8,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.primary.main,
    },
    followBtnText: {
      fontSize: 13,
      fontFamily: FONTS.semiBold,
      color: theme.primary.main,
    },
    followingBtn: {
      backgroundColor: theme.primary.main,
    },
    followingBtnText: {
      color: theme.background.dark,
    },
    // empty state
    emptyContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 60,
    },
    emptyIcon: {
      marginBottom: 16,
    },
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

export default function FollowsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id, type = "followers" } = useLocalSearchParams();
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const user = getUserById(id as string);
  const [activeTab, setActiveTab] = useState<"followers" | "following">(
    type as "followers" | "following",
  );

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <Ionicons
              name="chevron-back"
              size={26}
              color={theme.foreground.white}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("user.userNotFound")}</Text>
        </View>
      </View>
    );
  }

  const followers = getFollowers(user.id);
  const following = getFollowing(user.id);
  const currentList = activeTab === "followers" ? followers : following;

  const renderUserItem = ({ item }: { item: User }) => {
    const isCurrentUser = item.id === "1"; // Assuming current user is "1"
    const isFollowingUser = following.some((f: User) => f.id === item.id);

    return (
      <TouchableOpacity
        style={styles.userItem}
        onPress={() => {
          if (!isCurrentUser) {
            router.push(`/user/${item.id}` as any);
          }
        }}
        activeOpacity={isCurrentUser ? 1 : 0.7}
      >
        <Image source={{ uri: item.avatar }} style={styles.userAvatar} />
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.username}</Text>
          <Text style={styles.userBio} numberOfLines={2}>
            {item.bio}
          </Text>
        </View>
        {!isCurrentUser && (
          <TouchableOpacity
            style={[styles.followBtn, isFollowingUser && styles.followingBtn]}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.followBtnText,
                isFollowingUser && styles.followingBtnText,
              ]}
            >
              {isFollowingUser ? t("user.following") : t("user.follow")}
            </Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name={
          activeTab === "followers" ? "people-outline" : "person-add-outline"
        }
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons
            name="chevron-back"
            size={26}
            color={theme.foreground.white}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{user.username}</Text>
      </View>

      {/* Tab Bar */}
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

      {/* User List */}
      <FlatList
        data={currentList}
        keyExtractor={(item) => item.id}
        renderItem={renderUserItem}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

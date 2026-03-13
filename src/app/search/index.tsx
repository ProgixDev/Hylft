import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../contexts/ThemeContext";
import { getAllUsers, User } from "../../data/mockData";

import { FONTS } from "../../constants/fonts";

export default function Search() {
  const router = useRouter();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<User[]>(getAllUsers());

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    return users.filter((user) =>
      user.username.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [searchQuery, users]);

  const handleToggleFollow = (userId: string) => {
    setUsers((prev) =>
      prev.map((user) =>
        user.id === userId ? { ...user, isFollowing: !user.isFollowing } : user,
      ),
    );
  };

  const renderUserItem = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={styles.userItemContainer}
      onPress={() => {
        // Navigate using the dynamic route pattern
        router.navigate(`/user/${item.id}` as any);
      }}
      activeOpacity={0.7}
    >
      <View style={styles.userItem}>
        <Image source={{ uri: item.avatar }} style={styles.userAvatar} />
        <View style={styles.userInfo}>
          <Text style={styles.username}>{item.username}</Text>
          <Text style={styles.bio}>{item.bio}</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.followButton,
            item.isFollowing && styles.followingButton,
          ]}
          onPress={(e) => {
            e.stopPropagation();
            handleToggleFollow(item.id);
          }}
        >
          <Text
            style={[
              styles.followButtonText,
              item.isFollowing && styles.followingButtonText,
            ]}
          >
            {item.isFollowing ? t("user.following") : t("user.follow")}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
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
        <Text style={styles.headerTitle}>{t("search.findPeople")}</Text>
        <View style={styles.spacer} />
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color={theme.foreground.gray}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder={t("search.searchPeople")}
          placeholderTextColor={theme.foreground.gray}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons
              name="close-circle"
              size={20}
              color={theme.foreground.gray}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Users List */}
      {filteredUsers.length > 0 ? (
        <FlatList
          data={filteredUsers}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id}
          scrollEnabled={true}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons
            name="search-outline"
            size={48}
            color={theme.foreground.gray}
          />
          <Text style={styles.emptyText}>{t("search.noUsersFound")}</Text>
          <Text style={styles.emptySubtext}>
            {t("search.tryDifferentUsername")}
          </Text>
        </View>
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
      fontSize: 24,
      fontFamily: FONTS.bold,
      color: theme.foreground.white,
    },
    spacer: {
      width: 28,
    },
    searchContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginHorizontal: 16,
      marginVertical: 12,
      paddingHorizontal: 12,
      borderRadius: 12,
      backgroundColor: theme.background.darker,
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      paddingVertical: 12,
      color: theme.foreground.white,
      fontSize: 14,
    },
    listContent: {
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    userItemContainer: {
      marginHorizontal: 0,
    },
    userItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 12,
      marginVertical: 6,
      borderRadius: 12,
      backgroundColor: theme.background.darker,
    },
    userAvatar: {
      width: 52,
      height: 52,
      borderRadius: 26,
      marginRight: 12,
    },
    userInfo: {
      flex: 1,
    },
    username: {
      fontSize: 14,
      fontFamily: FONTS.semiBold,
      color: theme.foreground.white,
      marginBottom: 4,
    },
    bio: {
      fontSize: 12,
      color: theme.foreground.gray,
    },
    followButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: theme.primary.main,
    },
    followingButton: {
      backgroundColor: theme.background.accent,
      borderWidth: 1,
      borderColor: theme.primary.main,
    },
    followButtonText: {
      fontSize: 12,
      fontFamily: FONTS.semiBold,
      color: theme.background.dark,
    },
    followingButtonText: {
      color: theme.primary.main,
    },
    emptyState: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 32,
    },
    emptyText: {
      fontSize: 18,
      fontFamily: FONTS.semiBold,
      color: theme.foreground.white,
      marginTop: 16,
      marginBottom: 8,
    },
    emptySubtext: {
      fontSize: 14,
      color: theme.foreground.gray,
      textAlign: "center",
    },
  });



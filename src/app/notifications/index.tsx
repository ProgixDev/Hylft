import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../contexts/ThemeContext";
import { getNotificationsWithUserData } from "../../data/mockData";

import { FONTS } from "../../constants/fonts";

interface NotificationWithUser {
  id: string;
  type: "like" | "follow" | "comment" | "mention";
  user: {
    id: string;
    username: string;
    avatar: string;
  };
  action: string;
  timestamp: string;
  postId?: string;
  isRead: boolean;
}

export default function Notifications() {
  const { t } = useTranslation();
  const router = useRouter();
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const notificationsData = useMemo(
    () => getNotificationsWithUserData() as NotificationWithUser[],
    [],
  );
  const [notifications, setNotifications] =
    useState<NotificationWithUser[]>(notificationsData);

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === id ? { ...notif, isRead: true } : notif,
      ),
    );
  };

  function getIconName(type: string): keyof typeof Ionicons.glyphMap {
    switch (type) {
      case "like":
        return "heart";
      case "follow":
        return "person-add";
      case "comment":
        return "chatbubble";
      case "mention":
        return "at";
      default:
        return "notifications";
    }
  }

  function getIconColor(type: string): string {
    switch (type) {
      case "like":
        return "#FF6B6B";
      case "follow":
        return theme.primary.main;
      case "comment":
        return "#4ECDC4";
      case "mention":
        return "#FFD700";
      default:
        return theme.foreground.gray;
    }
  }

  function getTranslatedAction(type: string, action: string): string {
    switch (action) {
      case "liked your post":
        return t("notifications.likedYourPost");
      case "started following you":
        return t("notifications.startedFollowingYou");
      case "commented on your post":
        return t("notifications.commentedOnYourPost");
      case "mentioned you in a comment":
        return t("notifications.mentionedYouInComment");
      default:
        return action;
    }
  }

  const renderNotification = ({ item }: { item: NotificationWithUser }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        !item.isRead && styles.notificationItemUnread,
      ]}
      onPress={() => handleMarkAsRead(item.id)}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: item.user.avatar }}
        style={styles.avatarContainer}
      />
      <View style={styles.contentContainer}>
        <Text style={styles.username}>{item.user.username}</Text>
        <Text style={styles.action}>{getTranslatedAction(item.type, item.action)}</Text>
        <Text style={styles.timestamp}>{item.timestamp}</Text>
      </View>
      <View style={styles.iconContainer}>
        <Ionicons
          name={getIconName(item.type)}
          size={15}
          color={getIconColor(item.type)}
        />
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
            size={24}
            color={theme.foreground.white}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("notifications.title")}</Text>
        <View style={styles.spacer} />
      </View>

      {/* Notifications List */}
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        scrollEnabled={true}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={{ alignItems: "center", marginTop: 28 }}>
            <Ionicons
              name="notifications-off-outline"
              size={36}
              color={theme.foreground.gray}
            />
            <Text style={{ color: theme.foreground.gray, marginTop: 8, fontSize: 13 }}>
              {t("notifications.noNotificationsYet")}
            </Text>
          </View>
        }
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
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.background.darker,
    },
    headerTitle: {
      fontSize: 17,
      fontFamily: FONTS.bold,
      color: theme.foreground.white,
    },
    spacer: {
      width: 24,
    },
    unreadBanner: {
      backgroundColor: theme.primary.main,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginHorizontal: 12,
      marginTop: 8,
      borderRadius: 10,
    },
    unreadText: {
      fontSize: 12,
      fontFamily: FONTS.semiBold,
      color: theme.background.dark,
    },
    listContent: {
      paddingHorizontal: 12,
      paddingVertical: 4,
    },
    notificationItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 10,
      paddingVertical: 8,
      marginVertical: 3,
      borderRadius: 10,
      backgroundColor: theme.background.darker,
    },
    notificationItemUnread: {
      backgroundColor: theme.background.accent,
    },
    avatarContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: 10,
      flexShrink: 0,
    },
    avatar: {
      fontSize: 18,
      fontFamily: FONTS.bold,
      color: theme.background.dark,
    },
    contentContainer: {
      flex: 1,
    },
    textRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginBottom: 2,
    },
    username: {
      fontSize: 13,
      fontFamily: FONTS.semiBold,
      color: theme.foreground.white,
      marginBottom: 2,
    },
    action: {
      fontSize: 12,
      color: theme.foreground.gray,
      marginBottom: 2,
    },
    timestamp: {
      fontSize: 10,
      color: theme.foreground.gray,
    },
    iconContainer: {
      marginLeft: 6,
      padding: 6,
      backgroundColor: theme.background.dark,
      borderRadius: 7,
    },
  });


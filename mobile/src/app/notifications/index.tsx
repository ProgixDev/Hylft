import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../contexts/ThemeContext";
import { api } from "../../services/api";

import { FONTS } from "../../constants/fonts";

type BackendNotificationType =
  | "like"
  | "follow"
  | "follow_request"
  | "comment"
  | "reply"
  | "mention"
  | "achievement";

type BackendNotification = {
  id: string;
  type: BackendNotificationType;
  target_type: string | null;
  target_id: string | null;
  read_at: string | null;
  created_at: string;
  actor: {
    id: string;
    username?: string | null;
    display_name?: string | null;
    avatar_url?: string | null;
  } | null;
};

interface NotificationWithUser {
  id: string;
  type: BackendNotificationType;
  user: { id: string; username: string; avatar: string };
  action: string;
  timestamp: string;
  postId?: string;
  isRead: boolean;
}

function actionKey(type: BackendNotificationType): string {
  switch (type) {
    case "like":
      return "notifications.likedYourPost";
    case "follow":
    case "follow_request":
      return "notifications.startedFollowingYou";
    case "comment":
    case "reply":
      return "notifications.commentedOnYourPost";
    case "mention":
      return "notifications.mentionedYouInComment";
    default:
      return "notifications.title";
  }
}

export default function Notifications() {
  const { t } = useTranslation();
  const router = useRouter();
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const [notifications, setNotifications] = useState<NotificationWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mapItem = useCallback(
    (n: BackendNotification): NotificationWithUser => ({
      id: n.id,
      type: n.type,
      user: {
        id: n.actor?.id ?? "",
        username: n.actor?.username ?? "unknown",
        avatar: n.actor?.avatar_url ?? "",
      },
      action: t(actionKey(n.type)),
      timestamp: n.created_at,
      postId:
        n.target_type === "post" && n.target_id ? n.target_id : undefined,
      isRead: !!n.read_at,
    }),
    [t],
  );

  const load = useCallback(async () => {
    try {
      const res: { items: BackendNotification[]; next_cursor: string | null } =
        await api.listNotifications({ limit: 50 });
      setNotifications((res.items ?? []).map(mapItem));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    }
  }, [mapItem]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await load();
      setLoading(false);
    })();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const handleMarkAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
    try {
      await api.markNotificationRead(id);
    } catch {
      /* best-effort */
    }
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

  const onItemPress = (item: NotificationWithUser) => {
    if (!item.isRead) handleMarkAsRead(item.id);
    if (item.postId) router.navigate(`/comments/${item.postId}` as any);
    else if (item.type === "follow" && item.user.id)
      router.navigate(`/user/${item.user.id}` as any);
  };

  const renderNotification = ({ item }: { item: NotificationWithUser }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        !item.isRead && styles.notificationItemUnread,
      ]}
      onPress={() => onItemPress(item)}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: item.user.avatar || undefined }}
        style={styles.avatarContainer}
      />
      <View style={styles.contentContainer}>
        <Text style={styles.username}>{item.user.username}</Text>
        <Text style={styles.action}>{item.action}</Text>
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

      {error ? (
        <Text
          style={{
            color: "#e27171",
            textAlign: "center",
            paddingHorizontal: 16,
            paddingVertical: 8,
          }}
        >
          {error}
        </Text>
      ) : null}

      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator color={theme.primary.main} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id}
          scrollEnabled={true}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.primary.main}
              colors={[theme.primary.main]}
            />
          }
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


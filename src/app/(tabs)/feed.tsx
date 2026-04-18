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
        data={posts}
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

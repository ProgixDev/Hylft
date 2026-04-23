import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback } from "react";
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
import FeedComposer from "../../components/feed/FeedComposer";
import AnimatedScreen from "../../components/ui/AnimatedScreen";
import Post, { PostData } from "../../components/ui/Post";
import { PostSkeletonList } from "../../components/ui/PostSkeleton";
import { FONTS } from "../../constants/fonts";
import { Theme } from "../../constants/themes";
import { useTheme } from "../../contexts/ThemeContext";
import { useFeedTimeline } from "../../hooks/useFeedTimeline";

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
      paddingTop: 8,
      paddingBottom: 8,
    },
    title: {
      fontFamily: FONTS.extraBold,
      fontSize: 22,
      color: theme.foreground.white,
    },
    searchPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 22,
      backgroundColor: theme.background.darker,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(255,255,255,0.08)",
      ...controlShadow,
    },
    searchPillText: {
      fontSize: 12,
      fontFamily: FONTS.semiBold,
      color: theme.foreground.gray,
    },
    emptyWrap: {
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 32,
      paddingVertical: 40,
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
    prependPost,
    removePost,
    patchPost,
  } = useFeedTimeline({ scope: "timeline" });
  const styles = createStyles(theme);

  const renderPost = useCallback(
    ({ item }: { item: PostData }) => (
      <Post
        post={item}
        onLike={toggleLike}
        onDeleted={removePost}
        onUpdated={patchPost}
      />
    ),
    [toggleLike, removePost, patchPost],
  );

  const listHeader = (
    <View>
      <View style={styles.header}>
        <Text style={styles.title}>{t("tabs.feed")}</Text>
        <Pressable
          onPress={() => router.navigate("/search" as any)}
          style={({ pressed }) => [
            styles.searchPill,
            pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
          ]}
          hitSlop={6}
        >
          <Ionicons
            name="search"
            size={16}
            color={theme.foreground.white}
          />
          <Text style={styles.searchPillText}>
            {t("search.findPeople")}
          </Text>
        </Pressable>
      </View>
      <FeedComposer onCreated={prependPost} />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );

  const listEmpty = loading ? (
    <PostSkeletonList count={4} />
  ) : (
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
    <AnimatedScreen style={styles.container}>
      {themeType === "female" && (
        <Image
          source={require("../../../assets/girly.png")}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: "100%",
            height: "100%",
            opacity: 0.3,
          }}
          resizeMode="cover"
        />
      )}

      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 90 }}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        ListFooterComponent={listFooter}
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
      />
    </AnimatedScreen>
  );
}

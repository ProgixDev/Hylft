import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { memo, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Image,
  Modal,
  Pressable,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { api } from "../../services/api";
import { formatPostTimestamp } from "../../utils/format";
import ImageCarousel from "./ImageCarousel";

import { FONTS } from "../../constants/fonts";

export type PostPrivacy = "public" | "followers" | "private";

export type PostData = {
  id: string;
  user: {
    id: string;
    username: string;
    avatar: string;
    bio?: string;
  };
  images: string[]; // Support multiple images (0-4)
  likes: number;
  caption: string;
  comments: number;
  timestamp: string;
  isLiked: boolean;
  privacy?: PostPrivacy;
};

type PostProps = {
  post: PostData;
  onLike: (postId: string) => void;
  onDeleted?: (postId: string) => void;
  onUpdated?: (postId: string, patch: { caption?: string; privacy?: PostPrivacy }) => void;
};

const Post = memo(
  ({ post, onLike, onDeleted, onUpdated }: PostProps) => {
    const { t, i18n } = useTranslation();
    const router = useRouter();
    const { theme } = useTheme();
    const { user } = useAuth();
    const [isSaved, setIsSaved] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [privacyOpen, setPrivacyOpen] = useState(false);
    const [editCaption, setEditCaption] = useState(post.caption);
    const [busy, setBusy] = useState(false);

    const isOwner = !!user && user.id === post.user.id;
    const isSeed = post.id.startsWith("mock-");
    const formattedTime = useMemo(
      () => formatPostTimestamp(post.timestamp, i18n.language),
      [post.timestamp, i18n.language],
    );

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

    const confirmDelete = () => {
      Alert.alert(
        t("post.deleteTitle", "Supprimer la publication ?"),
        t("post.deleteBody", "Cette action est irréversible."),
        [
          { text: t("common.cancel", "Annuler"), style: "cancel" },
          {
            text: t("post.delete", "Supprimer"),
            style: "destructive",
            onPress: async () => {
              try {
                setBusy(true);
                await api.deletePost(post.id);
                onDeleted?.(post.id);
              } catch (e) {
                Alert.alert(
                  t("common.error", "Erreur"),
                  e instanceof Error ? e.message : String(e),
                );
              } finally {
                setBusy(false);
              }
            },
          },
        ],
      );
    };

    const saveEdit = async () => {
      const next = editCaption.trim();
      try {
        setBusy(true);
        await api.updatePost(post.id, { caption: next });
        onUpdated?.(post.id, { caption: next });
        setEditOpen(false);
      } catch (e) {
        Alert.alert(
          t("common.error", "Erreur"),
          e instanceof Error ? e.message : String(e),
        );
      } finally {
        setBusy(false);
      }
    };

    const setPrivacy = async (value: PostPrivacy) => {
      try {
        setBusy(true);
        await api.updatePost(post.id, { privacy: value });
        onUpdated?.(post.id, { privacy: value });
        setPrivacyOpen(false);
      } catch (e) {
        Alert.alert(
          t("common.error", "Erreur"),
          e instanceof Error ? e.message : String(e),
        );
      } finally {
        setBusy(false);
      }
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
              <Text style={styles.timestamp}>{formattedTime}</Text>
            </View>
          </Pressable>
          <Pressable
            onPress={() => setMenuOpen(true)}
            style={({ pressed }) => [
              styles.moreButton,
              pressed && { opacity: 0.6 },
            ]}
            hitSlop={8}
          >
            <Ionicons
              name="ellipsis-vertical"
              size={18}
              color={theme.foreground.white}
            />
          </Pressable>
        </View>

        {/* Post Images */}
        {post.images.length > 0 && (
          <ImageCarousel
            images={post.images}
            style={styles.postImage}
            onLike={() => onLike(post.id)}
            isLiked={post.isLiked}
          />
        )}

        {/* Caption + view comments (above actions) */}
        {(post.caption.length > 0 || post.comments > 0) && (
          <View style={styles.postInfo}>
            {post.caption.length > 0 && (
              <Text style={styles.caption}>
                <Text style={styles.username}>{post.user.username} </Text>
                {post.caption}
              </Text>
            )}
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
        )}

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
                size={22}
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
                size={20}
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
                size={20}
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
              size={20}
              color={isSaved ? theme.primary.main : theme.foreground.white}
            />
          </Pressable>
        </View>

        <View style={styles.divider} />

        {/* Action menu */}
        <Modal
          visible={menuOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setMenuOpen(false)}
        >
          <Pressable
            style={styles.menuBackdrop}
            onPress={() => setMenuOpen(false)}
          >
            <Pressable style={styles.menuSheet} onPress={() => {}}>
              {isOwner && !isSeed && (
                <>
                  <Pressable
                    style={({ pressed }) => [
                      styles.menuItem,
                      pressed && { opacity: 0.6 },
                    ]}
                    onPress={() => {
                      setMenuOpen(false);
                      setEditCaption(post.caption);
                      setEditOpen(true);
                    }}
                  >
                    <Ionicons
                      name="create-outline"
                      size={18}
                      color={theme.foreground.white}
                    />
                    <Text style={styles.menuItemText}>
                      {t("post.edit", "Modifier")}
                    </Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [
                      styles.menuItem,
                      pressed && { opacity: 0.6 },
                    ]}
                    onPress={() => {
                      setMenuOpen(false);
                      setPrivacyOpen(true);
                    }}
                  >
                    <Ionicons
                      name="lock-closed-outline"
                      size={18}
                      color={theme.foreground.white}
                    />
                    <Text style={styles.menuItemText}>
                      {t("post.changePrivacy", "Confidentialité")}
                      {post.privacy ? `  · ${t(`post.privacy_${post.privacy}`, post.privacy)}` : ""}
                    </Text>
                  </Pressable>
                  <View style={styles.menuDivider} />
                  <Pressable
                    style={({ pressed }) => [
                      styles.menuItem,
                      pressed && { opacity: 0.6 },
                    ]}
                    onPress={() => {
                      setMenuOpen(false);
                      confirmDelete();
                    }}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={18}
                      color="#ff6b6b"
                    />
                    <Text style={[styles.menuItemText, { color: "#ff6b6b" }]}>
                      {t("post.delete", "Supprimer")}
                    </Text>
                  </Pressable>
                </>
              )}
              {(!isOwner || isSeed) && (
                <>
                  <Pressable
                    style={({ pressed }) => [
                      styles.menuItem,
                      pressed && { opacity: 0.6 },
                    ]}
                    onPress={() => {
                      setMenuOpen(false);
                      handleShare();
                    }}
                  >
                    <Ionicons
                      name="share-outline"
                      size={18}
                      color={theme.foreground.white}
                    />
                    <Text style={styles.menuItemText}>
                      {t("post.share", "Partager")}
                    </Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [
                      styles.menuItem,
                      pressed && { opacity: 0.6 },
                    ]}
                    onPress={() => {
                      setMenuOpen(false);
                      Alert.alert(
                        t("post.reportTitle", "Signaler"),
                        t("post.reportBody", "Merci, cette publication sera examinée."),
                      );
                    }}
                  >
                    <Ionicons
                      name="flag-outline"
                      size={18}
                      color={theme.foreground.white}
                    />
                    <Text style={styles.menuItemText}>
                      {t("post.report", "Signaler")}
                    </Text>
                  </Pressable>
                </>
              )}
            </Pressable>
          </Pressable>
        </Modal>

        {/* Edit caption modal */}
        <Modal
          visible={editOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setEditOpen(false)}
        >
          <Pressable
            style={styles.menuBackdrop}
            onPress={() => setEditOpen(false)}
          >
            <Pressable style={styles.editSheet} onPress={() => {}}>
              <Text style={styles.editTitle}>
                {t("post.edit", "Modifier la publication")}
              </Text>
              <TextInput
                style={styles.editInput}
                value={editCaption}
                onChangeText={setEditCaption}
                multiline
                maxLength={2200}
                placeholder={t("composer.placeholder", "Quoi de neuf ?")}
                placeholderTextColor={theme.foreground.gray}
              />
              <View style={styles.editActions}>
                <Pressable
                  onPress={() => setEditOpen(false)}
                  style={({ pressed }) => [
                    styles.editBtnGhost,
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <Text style={styles.editBtnGhostText}>
                    {t("common.cancel", "Annuler")}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={saveEdit}
                  disabled={busy}
                  style={({ pressed }) => [
                    styles.editBtnPrimary,
                    pressed && { opacity: 0.85 },
                    busy && { opacity: 0.5 },
                  ]}
                >
                  <Text style={styles.editBtnPrimaryText}>
                    {t("common.save", "Enregistrer")}
                  </Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </Modal>

        {/* Privacy modal */}
        <Modal
          visible={privacyOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setPrivacyOpen(false)}
        >
          <Pressable
            style={styles.menuBackdrop}
            onPress={() => setPrivacyOpen(false)}
          >
            <Pressable style={styles.menuSheet} onPress={() => {}}>
              {(
                [
                  { key: "public", icon: "earth-outline" },
                  { key: "followers", icon: "people-outline" },
                  { key: "private", icon: "lock-closed-outline" },
                ] as const
              ).map(({ key, icon }) => (
                <Pressable
                  key={key}
                  onPress={() => setPrivacy(key)}
                  disabled={busy}
                  style={({ pressed }) => [
                    styles.menuItem,
                    pressed && { opacity: 0.6 },
                  ]}
                >
                  <Ionicons
                    name={icon as any}
                    size={18}
                    color={theme.foreground.white}
                  />
                  <Text style={styles.menuItemText}>
                    {t(`post.privacy_${key}`, key)}
                  </Text>
                  {post.privacy === key && (
                    <Ionicons
                      name="checkmark"
                      size={18}
                      color={theme.primary.main}
                      style={{ marginLeft: "auto" }}
                    />
                  )}
                </Pressable>
              ))}
            </Pressable>
          </Pressable>
        </Modal>
      </View>
    );
  },
  (prevProps, nextProps) => {
    // Only re-render if the post data or like state changes
    return (
      prevProps.post.id === nextProps.post.id &&
      prevProps.post.isLiked === nextProps.post.isLiked &&
      prevProps.post.likes === nextProps.post.likes &&
      prevProps.post.caption === nextProps.post.caption &&
      prevProps.post.privacy === nextProps.post.privacy &&
      prevProps.post.timestamp === nextProps.post.timestamp
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
      height: 6,
      backgroundColor: theme.background.dark,
    },
    postHeader: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    userHeaderButton: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    avatarWrapper: {
      width: 36,
      height: 36,
      borderRadius: 18,
      padding: 2,
      backgroundColor: theme.primary.main + "40",
      marginRight: 8,
    },
    avatar: {
      width: "100%",
      height: "100%",
      borderRadius: 16,
    },
    userInfo: {
      flex: 1,
    },
    username: {
      fontSize: 13,
      fontFamily: FONTS.semiBold,
      color: theme.foreground.white,
    },
    timestamp: {
      fontSize: 11,
      color: theme.foreground.gray,
      marginTop: 1,
    },
    moreButton: {
      padding: 6,
      marginLeft: 4,
    },
    postImage: {
      width: "100%",
      height: 380,
      backgroundColor: theme.background.darker,
    },
    actionsContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 6,
      paddingVertical: 4,
    },
    leftActions: {
      flexDirection: "row",
      gap: 0,
    },
    actionButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 6,
    },
    actionCount: {
      fontSize: 12,
      fontFamily: FONTS.semiBold,
      color: theme.foreground.white,
    },
    postInfo: {
      paddingHorizontal: 12,
      paddingTop: 6,
      paddingBottom: 4,
    },
    caption: {
      fontSize: 13,
      color: theme.foreground.white,
      lineHeight: 18,
      marginBottom: 3,
    },
    viewComments: {
      fontSize: 13,
      color: theme.foreground.gray,
      marginTop: 3,
    },
    menuBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
    },
    menuSheet: {
      width: "100%",
      maxWidth: 320,
      backgroundColor: theme.background.darker,
      borderRadius: 14,
      paddingVertical: 6,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(255,255,255,0.08)",
    },
    menuItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    menuItemText: {
      fontSize: 14,
      fontFamily: FONTS.semiBold,
      color: theme.foreground.white,
    },
    menuDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: "rgba(255,255,255,0.08)",
      marginHorizontal: 10,
    },
    editSheet: {
      width: "100%",
      maxWidth: 380,
      backgroundColor: theme.background.darker,
      borderRadius: 14,
      padding: 16,
      gap: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(255,255,255,0.08)",
    },
    editTitle: {
      fontSize: 15,
      fontFamily: FONTS.bold,
      color: theme.foreground.white,
    },
    editInput: {
      minHeight: 90,
      maxHeight: 200,
      fontSize: 14,
      color: theme.foreground.white,
      fontFamily: FONTS.regular,
      backgroundColor: theme.background.dark,
      borderRadius: 10,
      padding: 10,
      textAlignVertical: "top",
    },
    editActions: {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: 8,
    },
    editBtnGhost: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 10,
    },
    editBtnGhostText: {
      fontSize: 13,
      fontFamily: FONTS.semiBold,
      color: theme.foreground.gray,
    },
    editBtnPrimary: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 10,
      backgroundColor: theme.primary.main,
    },
    editBtnPrimaryText: {
      fontSize: 13,
      fontFamily: FONTS.bold,
      color: theme.background.dark,
    },
  });

export default Post;

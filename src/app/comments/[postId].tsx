import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    FlatList,
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import type { PostData } from "../../components/ui/Post";
import { FONTS } from "../../constants/fonts";
import { useTheme } from "../../contexts/ThemeContext";
import { api } from "../../services/api";
import { mapPostToUi, type BackendPost } from "../../services/feedMappers";

type BackendAuthor = {
  id: string;
  username?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
};

type BackendComment = {
  id: string;
  post_id: string;
  author_id: string;
  parent_comment_id: string | null;
  body: string;
  likes_count: number;
  created_at: string;
  updated_at: string;
  is_liked: boolean;
  author: BackendAuthor | null;
  replies?: BackendComment[];
};

type UiComment = {
  id: string;
  parentId: string | null;
  text: string;
  timestamp: string;
  likes: number;
  isLiked: boolean;
  user: { id: string; username: string; avatar: string };
  replies: UiComment[];
};

function formatCommentDateHour(input: string, locale: string) {
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return input;
  const lang = locale.startsWith("fr") ? "fr-FR" : "en-US";
  const date = d.toLocaleDateString(lang, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const time = d.toLocaleTimeString(lang, {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${date} ${time}`;
}

function mapComment(c: BackendComment): UiComment {
  return {
    id: c.id,
    parentId: c.parent_comment_id,
    text: c.body,
    timestamp: c.created_at,
    likes: c.likes_count ?? 0,
    isLiked: !!c.is_liked,
    user: {
      id: c.author_id,
      username: c.author?.username ?? "unknown",
      avatar: c.author?.avatar_url ?? "",
    },
    replies: (c.replies ?? []).map(mapComment),
  };
}

export default function CommentsScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const [post, setPost] = useState<PostData | null>(null);
  const [comments, setComments] = useState<UiComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [commentText, setCommentText] = useState("");
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(
    new Set(),
  );

  const INITIAL_REPLIES_TO_SHOW = 0;

  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", () =>
      setIsKeyboardVisible(true),
    );
    const hide = Keyboard.addListener("keyboardDidHide", () =>
      setIsKeyboardVisible(false),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const load = useCallback(async () => {
    if (!postId) return;
    setLoading(true);
    setError(null);
    try {
      const [postRes, commentsRes] = await Promise.all([
        api.getPost(postId) as Promise<BackendPost>,
        api.listComments(postId) as Promise<{ items: BackendComment[] }>,
      ]);
      setPost(mapPostToUi(postRes));
      setComments((commentsRes.items ?? []).map(mapComment));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load comments");
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleLikeComment = useCallback(
    async (commentId: string, parentId: string | null) => {
      let prev: { isLiked: boolean; likes: number } | null = null;
      setComments((all) =>
        all.map((c) => {
          if (parentId == null && c.id === commentId) {
            prev = { isLiked: c.isLiked, likes: c.likes };
            return {
              ...c,
              isLiked: !c.isLiked,
              likes: c.isLiked ? Math.max(c.likes - 1, 0) : c.likes + 1,
            };
          }
          if (parentId != null && c.id === parentId) {
            return {
              ...c,
              replies: c.replies.map((r) => {
                if (r.id !== commentId) return r;
                prev = { isLiked: r.isLiked, likes: r.likes };
                return {
                  ...r,
                  isLiked: !r.isLiked,
                  likes: r.isLiked ? Math.max(r.likes - 1, 0) : r.likes + 1,
                };
              }),
            };
          }
          return c;
        }),
      );
      try {
        if (prev?.isLiked) await api.unlikeComment(commentId);
        else await api.likeComment(commentId);
      } catch {
        // rollback
        if (prev) {
          setComments((all) =>
            all.map((c) => {
              if (parentId == null && c.id === commentId) {
                return { ...c, isLiked: prev!.isLiked, likes: prev!.likes };
              }
              if (parentId != null && c.id === parentId) {
                return {
                  ...c,
                  replies: c.replies.map((r) =>
                    r.id === commentId
                      ? { ...r, isLiked: prev!.isLiked, likes: prev!.likes }
                      : r,
                  ),
                };
              }
              return c;
            }),
          );
        }
      }
    },
    [],
  );

  const handleSubmit = useCallback(async () => {
    const body = commentText.trim();
    if (!body || !postId || submitting) return;
    setSubmitting(true);
    try {
      const created = (await api.createComment(postId, {
        body,
        parent_comment_id: replyingTo ?? undefined,
      })) as BackendComment;

      // Hydrate the local list without a round-trip: fetch the author from the
      // existing comment or fall back to the backend shape.
      const ui = mapComment({ ...created, replies: [] });

      if (replyingTo) {
        setComments((all) =>
          all.map((c) =>
            c.id === replyingTo ? { ...c, replies: [...c.replies, ui] } : c,
          ),
        );
        setExpandedReplies((prev) => new Set(prev).add(replyingTo));
      } else {
        setComments((all) => [ui, ...all]);
      }

      setCommentText("");
      setReplyingTo(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  }, [commentText, postId, replyingTo, submitting]);

  const renderReply = (reply: UiComment, parentId: string) => (
    <View key={reply.id} style={styles.replyContainer}>
      <TouchableOpacity
        onPress={() => router.navigate(`/user/${reply.user.id}` as any)}
      >
        {reply.user.avatar ? (
          <Image
            source={{ uri: reply.user.avatar }}
            style={styles.replyAvatar}
          />
        ) : (
          <View style={styles.replyAvatarPlaceholder}>
            <Ionicons name="person" size={14} color={theme.foreground.gray} />
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.replyContent}>
        <View style={styles.replyTextContainer}>
          <Text style={styles.username}>{reply.user.username}</Text>
          <Text style={styles.replyText}>{reply.text}</Text>
        </View>

        <View style={styles.replyMeta}>
          <Text style={styles.timestamp}>
            {formatCommentDateHour(reply.timestamp, i18n.language)}
          </Text>
          {reply.likes > 0 && (
            <Text style={styles.likes}>
              {reply.likes}{" "}
              {reply.likes === 1 ? t("comments.like") : t("comments.likes")}
            </Text>
          )}
        </View>
      </View>

      <TouchableOpacity
        onPress={() => handleLikeComment(reply.id, parentId)}
        style={styles.likeButton}
      >
        <Ionicons
          name={reply.isLiked ? "heart" : "heart-outline"}
          size={14}
          color={reply.isLiked ? "#FF3B30" : theme.foreground.gray}
        />
      </TouchableOpacity>
    </View>
  );

  const renderComment = ({ item }: { item: UiComment }) => (
    <View>
      <View style={styles.commentContainer}>
        <TouchableOpacity
          onPress={() => router.navigate(`/user/${item.user.id}` as any)}
        >
          {item.user.avatar ? (
            <Image source={{ uri: item.user.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={16} color={theme.foreground.gray} />
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.commentContent}>
          <View style={styles.commentTextContainer}>
            <Text style={styles.username}>{item.user.username}</Text>
            <Text style={styles.commentText}>{item.text}</Text>
          </View>

          <View style={styles.commentMeta}>
            <Text style={styles.timestamp}>
              {formatCommentDateHour(item.timestamp, i18n.language)}
            </Text>
            {item.likes > 0 && (
              <Text style={styles.likes}>
                {item.likes}{" "}
                {item.likes === 1 ? t("comments.like") : t("comments.likes")}
              </Text>
            )}
            <TouchableOpacity onPress={() => setReplyingTo(item.id)}>
              <Text style={styles.replyButton}>{t("comments.reply")}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => handleLikeComment(item.id, null)}
          style={styles.likeButton}
        >
          <Ionicons
            name={item.isLiked ? "heart" : "heart-outline"}
            size={14}
            color={item.isLiked ? "#FF3B30" : theme.foreground.gray}
          />
        </TouchableOpacity>
      </View>

      {item.replies.length > 0 && (
        <View style={styles.repliesContainer}>
          {(expandedReplies.has(item.id)
            ? item.replies
            : item.replies.slice(0, INITIAL_REPLIES_TO_SHOW)
          ).map((reply) => renderReply(reply, item.id))}

          {item.replies.length > INITIAL_REPLIES_TO_SHOW && (
            <TouchableOpacity
              onPress={() => {
                setExpandedReplies((prev) => {
                  const newSet = new Set(prev);
                  if (newSet.has(item.id)) newSet.delete(item.id);
                  else newSet.add(item.id);
                  return newSet;
                });
              }}
              style={styles.viewMoreRepliesButton}
            >
              <View style={styles.viewMoreRepliesLine} />
              <Text style={styles.viewMoreRepliesText}>
                {expandedReplies.has(item.id)
                  ? t("comments.hideReplies")
                  : t("comments.viewReplies")
                      .replace("{count}", String(item.replies.length))
                      .replace(
                        /\{count, plural, one \{reply\} other \{replies\}\}/,
                        item.replies.length === 1
                          ? t("comments.reply")
                          : t("comments.replies"),
                      )}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );

  const renderHeader = () => (
    <View style={styles.headerContent}>
      {post && (
        <>
          <View style={styles.postInfo}>
            {post.user.avatar ? (
              <Image
                source={{ uri: post.user.avatar }}
                style={styles.postUserAvatar}
              />
            ) : (
              <View style={styles.postUserAvatarPlaceholder}>
                <Ionicons
                  name="person"
                  size={16}
                  color={theme.foreground.gray}
                />
              </View>
            )}
            <View style={styles.postUserInfo}>
              <Text style={styles.postUsername}>{post.user.username}</Text>
              <Text style={styles.postCaption}>{post.caption}</Text>
              <Text style={styles.postTimestamp}>
                {formatCommentDateHour(post.timestamp, i18n.language)}
              </Text>
            </View>
          </View>
          <View style={styles.divider} />
        </>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={theme.foreground.white}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("comments.title")}</Text>
        <View style={styles.headerRight} />
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

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        {loading ? (
          <View
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
          >
            <ActivityIndicator color={theme.primary.main} />
          </View>
        ) : (
          <FlatList
            data={comments}
            renderItem={renderComment}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.commentsList}
            ListHeaderComponent={renderHeader}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            automaticallyAdjustKeyboardInsets={true}
          />
        )}

        <View>
          {replyingTo && (
            <View style={styles.replyingToLabel}>
              <Text style={styles.replyingToText}>
                {t("comments.replyingTo")}{" "}
                {comments.find((c) => c.id === replyingTo)?.user.username}
              </Text>
              <TouchableOpacity onPress={() => setReplyingTo(null)}>
                <Ionicons
                  name="close"
                  size={18}
                  color={theme.foreground.gray}
                />
              </TouchableOpacity>
            </View>
          )}
          <View
            style={[
              styles.inputContainer,
              isKeyboardVisible && styles.inputContainerKeyboard,
            ]}
          >
            <TextInput
              style={styles.input}
              placeholder={
                replyingTo ? t("comments.addReply") : t("comments.addComment")
              }
              placeholderTextColor={theme.foreground.gray}
              value={commentText}
              onChangeText={setCommentText}
              multiline
              maxLength={1000}
              editable={!submitting}
            />
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={!commentText.trim() || submitting}
            >
              <Text
                style={[
                  styles.postButton,
                  {
                    color:
                      commentText.trim() && !submitting
                        ? theme.primary.main
                        : theme.foreground.gray,
                  },
                ]}
              >
                {replyingTo ? t("comments.reply") : t("comments.post")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>["theme"]) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background.dark },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.background.darker,
    },
    backButton: { padding: 4 },
    headerTitle: {
      fontSize: 18,
      fontFamily: FONTS.semiBold,
      color: theme.foreground.white,
    },
    headerRight: { width: 32 },
    headerContent: { marginBottom: 8 },
    postInfo: { flexDirection: "row", padding: 16, paddingBottom: 12 },
    postUserAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: 12,
      backgroundColor: theme.background.darker,
    },
    postUserAvatarPlaceholder: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: 12,
      backgroundColor: theme.background.darker,
      alignItems: "center",
      justifyContent: "center",
    },
    postUserInfo: { flex: 1 },
    postUsername: {
      fontSize: 15,
      fontFamily: FONTS.semiBold,
      color: theme.foreground.white,
      marginBottom: 4,
    },
    postCaption: {
      fontSize: 14,
      color: theme.foreground.white,
      lineHeight: 20,
      marginBottom: 4,
    },
    postTimestamp: { fontSize: 12, color: theme.foreground.gray },
    divider: {
      height: 1,
      backgroundColor: theme.background.darker,
      marginHorizontal: 16,
      marginBottom: 8,
    },
    commentsList: { paddingBottom: 16 },
    commentContainer: {
      flexDirection: "row",
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    avatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      marginRight: 12,
      backgroundColor: theme.background.darker,
    },
    avatarPlaceholder: {
      width: 36,
      height: 36,
      borderRadius: 18,
      marginRight: 12,
      backgroundColor: theme.background.darker,
      alignItems: "center",
      justifyContent: "center",
    },
    commentContent: { flex: 1 },
    commentTextContainer: {
      backgroundColor: theme.background.darker,
      borderRadius: 18,
      paddingHorizontal: 14,
      paddingVertical: 10,
      marginBottom: 6,
    },
    username: {
      fontSize: 14,
      fontFamily: FONTS.semiBold,
      color: theme.foreground.white,
      marginBottom: 2,
    },
    commentText: {
      fontSize: 14,
      color: theme.foreground.white,
      lineHeight: 18,
    },
    commentMeta: { flexDirection: "row", paddingHorizontal: 14, gap: 12 },
    timestamp: { fontSize: 12, color: theme.foreground.gray },
    likes: {
      fontSize: 12,
      color: theme.foreground.gray,
      fontFamily: FONTS.semiBold,
    },
    replyButton: {
      fontSize: 12,
      color: theme.foreground.gray,
      fontFamily: FONTS.semiBold,
    },
    likeButton: { padding: 4, marginLeft: 8 },
    inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: theme.background.darker,
      backgroundColor: theme.background.dark,
    },
    inputContainerKeyboard: {
      minHeight: 80,
      alignItems: "flex-start",
      paddingTop: 8,
      paddingBottom: 5,
    },
    input: {
      flex: 1,
      fontSize: 14,
      color: theme.foreground.white,
      maxHeight: 100,
      paddingVertical: 8,
    },
    postButton: {
      fontSize: 16,
      fontFamily: FONTS.semiBold,
      marginLeft: 12,
      paddingVertical: 8,
      textAlignVertical: "center",
    },
    replyingToLabel: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: theme.background.darker,
      borderTopWidth: 1,
      borderTopColor: theme.background.darker,
    },
    replyingToText: {
      fontSize: 12,
      color: theme.foreground.gray,
      fontStyle: "italic",
    },
    repliesContainer: { paddingLeft: 26, marginLeft: 16 },
    replyContainer: {
      flexDirection: "row",
      paddingHorizontal: 16,
      paddingVertical: 10,
      alignItems: "flex-start",
    },
    replyAvatar: {
      width: 28,
      height: 28,
      borderRadius: 14,
      marginRight: 10,
      backgroundColor: theme.background.darker,
    },
    replyAvatarPlaceholder: {
      width: 28,
      height: 28,
      borderRadius: 14,
      marginRight: 10,
      backgroundColor: theme.background.darker,
      alignItems: "center",
      justifyContent: "center",
    },
    replyContent: { flex: 1 },
    replyTextContainer: {
      backgroundColor: theme.background.darker,
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginBottom: 4,
    },
    replyText: { fontSize: 13, color: theme.foreground.white, lineHeight: 17 },
    replyMeta: { flexDirection: "row", paddingHorizontal: 12, gap: 10 },
    viewMoreRepliesButton: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      paddingHorizontal: 16,
      gap: 12,
    },
    viewMoreRepliesLine: {
      width: 24,
      height: 1,
      backgroundColor: theme.foreground.gray,
      opacity: 0.3,
    },
    viewMoreRepliesText: {
      fontSize: 13,
      fontFamily: FONTS.semiBold,
      color: theme.foreground.gray,
    },
  });

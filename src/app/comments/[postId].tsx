import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
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
import { useTranslation } from "react-i18next";
import { useTheme } from "../../contexts/ThemeContext";
import {
  Comment,
  getCommentsWithUserData,
  getPostById,
  getUserById,
} from "../../data/mockData";

interface CommentWithUser extends Comment {
  user: {
    id: string;
    username: string;
    avatar: string;
    bio: string;
  };
  replies?: ReplyWithUser[];
}

interface ReplyWithUser {
  id: string;
  commentId: string;
  userId: string;
  text: string;
  timestamp: string;
  likes: number;
  isLiked: boolean;
  user: {
    id: string;
    username: string;
    avatar: string;
    bio: string;
  };
}

export default function CommentsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { postId } = useLocalSearchParams();
  const { theme } = useTheme();
  const styles = createStyles(theme);

  // Get post and comments data
  const post = getPostById(postId as string);
  const postUser = post ? getUserById(post.userId) : null;

  const [comments, setComments] = useState<CommentWithUser[]>(
    getCommentsWithUserData(postId as string) as CommentWithUser[],
  );
  const [commentText, setCommentText] = useState("");
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(
    new Set(),
  );

  const INITIAL_REPLIES_TO_SHOW = 0;

  useEffect(() => {
    const showSubscription = Keyboard.addListener("keyboardDidShow", () => {
      setIsKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const handleLikeComment = (commentId: string) => {
    setComments((prevComments) =>
      prevComments.map((comment) =>
        comment.id === commentId
          ? {
              ...comment,
              isLiked: !comment.isLiked,
              likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1,
            }
          : comment,
      ),
    );
  };

  const handleLikeReply = (commentId: string, replyId: string) => {
    setComments((prevComments) =>
      prevComments.map((comment) =>
        comment.id === commentId && comment.replies
          ? {
              ...comment,
              replies: comment.replies.map((reply) =>
                reply.id === replyId
                  ? {
                      ...reply,
                      isLiked: !reply.isLiked,
                      likes: reply.isLiked ? reply.likes - 1 : reply.likes + 1,
                    }
                  : reply,
              ),
            }
          : comment,
      ),
    );
  };

  const handleAddComment = () => {
    if (commentText.trim()) {
      if (replyingTo) {
        // Adding a reply
        setComments((prevComments) =>
          prevComments.map((comment) =>
            comment.id === replyingTo
              ? {
                  ...comment,
                  replies: [
                    ...(comment.replies || []),
                    {
                      id: `r${Date.now()}`,
                      commentId: replyingTo,
                      userId: "1",
                      text: commentText.trim(),
                      timestamp: "now",
                      likes: 0,
                      isLiked: false,
                      user: {
                        id: "1",
                        username: "alex_shred",
                        avatar: "https://i.pravatar.cc/150?img=12",
                        bio: "NPC Competitor | Nutrition Coach 🏆",
                      },
                    },
                  ],
                }
              : comment,
          ),
        );
        setReplyingTo(null);
      } else {
        // Adding a new comment
        const newComment: CommentWithUser = {
          id: `c${Date.now()}`,
          postId: postId as string,
          userId: "1",
          text: commentText.trim(),
          timestamp: "Just now",
          likes: 0,
          isLiked: false,
          user: {
            id: "1",
            username: "alex_shred",
            avatar: "https://i.pravatar.cc/150?img=12",
            bio: "NPC Competitor | Nutrition Coach 🏆",
          },
        };

        setComments([newComment, ...comments]);
      }
      setCommentText("");
    }
  };

  const renderReply = (reply: ReplyWithUser, commentId: string) => (
    <View key={reply.id} style={styles.replyContainer}>
      <TouchableOpacity
        onPress={() => router.navigate(`/user/${reply.user.id}` as any)}
      >
        <Image source={{ uri: reply.user.avatar }} style={styles.replyAvatar} />
      </TouchableOpacity>

      <View style={styles.replyContent}>
        <View style={styles.replyTextContainer}>
          <Text style={styles.username}>{reply.user.username}</Text>
          <Text style={styles.replyText}>{reply.text}</Text>
        </View>

        <View style={styles.replyMeta}>
          <Text style={styles.timestamp}>{reply.timestamp}</Text>
          {reply.likes > 0 && (
            <Text style={styles.likes}>
              {reply.likes} {reply.likes === 1 ? t("comments.like") : t("comments.likes")}
            </Text>
          )}
        </View>
      </View>

      <TouchableOpacity
        onPress={() => handleLikeReply(commentId, reply.id)}
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

  const renderComment = ({ item }: { item: CommentWithUser }) => (
    <View>
      <View style={styles.commentContainer}>
        <TouchableOpacity
          onPress={() => router.navigate(`/user/${item.user.id}` as any)}
        >
          <Image source={{ uri: item.user.avatar }} style={styles.avatar} />
        </TouchableOpacity>

        <View style={styles.commentContent}>
          <View style={styles.commentTextContainer}>
            <Text style={styles.username}>{item.user.username}</Text>
            <Text style={styles.commentText}>{item.text}</Text>
          </View>

          <View style={styles.commentMeta}>
            <Text style={styles.timestamp}>{item.timestamp}</Text>
            {item.likes > 0 && (
              <Text style={styles.likes}>
                {item.likes} {item.likes === 1 ? t("comments.like") : t("comments.likes")}
              </Text>
            )}
            <TouchableOpacity onPress={() => setReplyingTo(item.id)}>
              <Text style={styles.replyButton}>{t("comments.reply")}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => handleLikeComment(item.id)}
          style={styles.likeButton}
        >
          <Ionicons
            name={item.isLiked ? "heart" : "heart-outline"}
            size={14}
            color={item.isLiked ? "#FF3B30" : theme.foreground.gray}
          />
        </TouchableOpacity>
      </View>

      {/* Replies */}
      {item.replies && item.replies.length > 0 && (
        <View style={styles.repliesContainer}>
          {/* Show limited or all replies based on expanded state */}
          {(expandedReplies.has(item.id)
            ? item.replies
            : item.replies.slice(0, INITIAL_REPLIES_TO_SHOW)
          ).map((reply) => renderReply(reply, item.id))}

          {/* View more / Hide replies button */}
          {item.replies.length > INITIAL_REPLIES_TO_SHOW && (
            <TouchableOpacity
              onPress={() => {
                setExpandedReplies((prev) => {
                  const newSet = new Set(prev);
                  if (newSet.has(item.id)) {
                    newSet.delete(item.id);
                  } else {
                    newSet.add(item.id);
                  }
                  return newSet;
                });
              }}
              style={styles.viewMoreRepliesButton}
            >
              <View style={styles.viewMoreRepliesLine} />
              <Text style={styles.viewMoreRepliesText}>
                {expandedReplies.has(item.id)
                  ? t("comments.hideReplies")
                  : t("comments.viewReplies").replace("{count}", String(item.replies.length)).replace(/\{count, plural, one \{reply\} other \{replies\}\}/, item.replies.length === 1 ? t("comments.reply") : t("comments.replies"))}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );

  const renderHeader = () => (
    <View style={styles.headerContent}>
      {post && postUser && (
        <>
          <View style={styles.postInfo}>
            <Image
              source={{ uri: postUser.avatar }}
              style={styles.postUserAvatar}
            />
            <View style={styles.postUserInfo}>
              <Text style={styles.postUsername}>{postUser.username}</Text>
              <Text style={styles.postCaption}>{post.caption}</Text>
              <Text style={styles.postTimestamp}>{post.timestamp}</Text>
            </View>
          </View>
          <View style={styles.divider} />
        </>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
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

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        {/* Comments List */}
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

        {/* Comment Input */}
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
            <Image
              source={{ uri: "https://i.pravatar.cc/150?img=12" }}
              style={styles.inputAvatar}
            />
            <TextInput
              style={styles.input}
              placeholder={replyingTo ? t("comments.addReply") : t("comments.addComment")}
              placeholderTextColor={theme.foreground.gray}
              value={commentText}
              onChangeText={setCommentText}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              onPress={handleAddComment}
              disabled={!commentText.trim()}
            >
              <Text
                style={[
                  styles.postButton,
                  {
                    color: commentText.trim()
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
    backButton: {
      padding: 4,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: theme.foreground.white,
    },
    headerRight: {
      width: 32,
    },
    headerContent: {
      marginBottom: 8,
    },
    postInfo: {
      flexDirection: "row",
      padding: 16,
      paddingBottom: 12,
    },
    postUserAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: 12,
    },
    postUserInfo: {
      flex: 1,
    },
    postUsername: {
      fontSize: 15,
      fontWeight: "600",
      color: theme.foreground.white,
      marginBottom: 4,
    },
    postCaption: {
      fontSize: 14,
      color: theme.foreground.white,
      lineHeight: 20,
      marginBottom: 4,
    },
    postTimestamp: {
      fontSize: 12,
      color: theme.foreground.gray,
    },
    divider: {
      height: 1,
      backgroundColor: theme.background.darker,
      marginHorizontal: 16,
      marginBottom: 8,
    },
    commentsList: {
      paddingBottom: 16,
    },
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
    },
    commentContent: {
      flex: 1,
    },
    commentTextContainer: {
      backgroundColor: theme.background.darker,
      borderRadius: 18,
      paddingHorizontal: 14,
      paddingVertical: 10,
      marginBottom: 6,
    },
    username: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.foreground.white,
      marginBottom: 2,
    },
    commentText: {
      fontSize: 14,
      color: theme.foreground.white,
      lineHeight: 18,
    },
    commentMeta: {
      flexDirection: "row",
      paddingHorizontal: 14,
      gap: 12,
    },
    timestamp: {
      fontSize: 12,
      color: theme.foreground.gray,
    },
    likes: {
      fontSize: 12,
      color: theme.foreground.gray,
      fontWeight: "600",
    },
    replyButton: {
      fontSize: 12,
      color: theme.foreground.gray,
      fontWeight: "600",
    },
    likeButton: {
      padding: 4,
      marginLeft: 8,
    },
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
    inputAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      marginRight: 12,
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
      fontWeight: "600",
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
    repliesContainer: {
      paddingLeft: 26,
      marginLeft: 16,
    },
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
    },
    replyContent: {
      flex: 1,
    },
    replyTextContainer: {
      backgroundColor: theme.background.darker,
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginBottom: 4,
    },
    replyText: {
      fontSize: 13,
      color: theme.foreground.white,
      lineHeight: 17,
    },
    replyMeta: {
      flexDirection: "row",
      paddingHorizontal: 12,
      gap: 10,
    },
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
      fontWeight: "600",
      color: theme.foreground.gray,
    },
  });

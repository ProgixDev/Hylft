import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { FONTS } from "../../constants/fonts";
import { Theme } from "../../constants/themes";
import { useTheme } from "../../contexts/ThemeContext";
import { api } from "../../services/api";
import type { BackendPost } from "../../services/feedMappers";
import { mapPostToUi } from "../../services/feedMappers";
import {
  LocalImage,
  MAX_POST_IMAGES,
  pickPostImages,
  uploadPostImages,
} from "../../services/postMediaUploader";
import type { PostData } from "../ui/Post";

type Props = {
  onCreated: (post: PostData) => void;
};

const { width: screenWidth } = Dimensions.get("window");
const PREVIEW_HEIGHT = 220;
const PREVIEW_WIDTH = screenWidth - 24;

export default function FeedComposer({ onCreated }: Props) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(theme);

  const [caption, setCaption] = useState("");
  const [images, setImages] = useState<LocalImage[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [me, setMe] = useState<{ avatar_url?: string | null } | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const profile = (await api.getProfile()) as {
          avatar_url?: string | null;
        };
        if (!cancelled) setMe(profile);
      } catch {
        /* silent */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const canSubmit =
    !submitting && (caption.trim().length > 0 || images.length > 0);

  const handlePick = useCallback(async () => {
    const picked = await pickPostImages(images.length);
    if (picked.length === 0) return;
    setImages((prev) => [...prev, ...picked].slice(0, MAX_POST_IMAGES));
  }, [images.length]);

  const handleRemove = useCallback((index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const media = images.length > 0 ? await uploadPostImages(images) : [];
      const created = (await api.createPost({
        kind: "standard",
        caption: caption.trim() || undefined,
        privacy: "public",
        media,
      })) as BackendPost;
      onCreated(mapPostToUi(created));
      setCaption("");
      setImages([]);
      setActiveIndex(0);
    } catch (e) {
      Alert.alert(
        t("composer.errorTitle", "Erreur"),
        e instanceof Error ? e.message : String(e),
      );
    } finally {
      setSubmitting(false);
    }
  }, [canSubmit, images, caption, onCreated, t]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offset = event.nativeEvent.contentOffset.x;
    const idx = Math.round(offset / PREVIEW_WIDTH);
    setActiveIndex(idx);
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.avatarWrap}>
          {me?.avatar_url ? (
            <Image source={{ uri: me.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Ionicons
                name="person"
                size={18}
                color={theme.foreground.gray}
              />
            </View>
          )}
        </View>
        <TextInput
          style={styles.input}
          placeholder={t("composer.placeholder", "Quoi de neuf ?")}
          placeholderTextColor={theme.foreground.gray}
          value={caption}
          onChangeText={setCaption}
          multiline
          maxLength={2200}
          editable={!submitting}
        />
      </View>

      {images.length > 0 && (
        <View style={styles.previewWrap}>
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            {images.map((img, idx) => (
              <View key={`${img.uri}-${idx}`} style={styles.previewItem}>
                <Image source={{ uri: img.uri }} style={styles.previewImage} />
                <Pressable
                  onPress={() => handleRemove(idx)}
                  style={({ pressed }) => [
                    styles.removeBtn,
                    pressed && { opacity: 0.7 },
                  ]}
                  hitSlop={8}
                >
                  <Ionicons name="close" size={16} color="#fff" />
                </Pressable>
              </View>
            ))}
          </ScrollView>
          {images.length > 1 && (
            <>
              <View style={styles.counter}>
                <Text style={styles.counterText}>
                  {activeIndex + 1}/{images.length}
                </Text>
              </View>
              <View style={styles.dots}>
                {images.map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.dot,
                      {
                        backgroundColor:
                          i === activeIndex
                            ? theme.primary.main
                            : "rgba(255,255,255,0.4)",
                      },
                    ]}
                  />
                ))}
              </View>
            </>
          )}
        </View>
      )}

      <View style={styles.actions}>
        <Pressable
          onPress={handlePick}
          disabled={submitting || images.length >= MAX_POST_IMAGES}
          style={({ pressed }) => [
            styles.iconAction,
            (pressed || submitting) && { opacity: 0.7 },
            images.length >= MAX_POST_IMAGES && { opacity: 0.4 },
          ]}
          hitSlop={6}
        >
          <Ionicons
            name="images-outline"
            size={20}
            color={theme.primary.main}
          />
          <Text style={styles.iconActionText}>
            {images.length > 0
              ? `${images.length}/${MAX_POST_IMAGES}`
              : t("composer.addPhoto", "Photos")}
          </Text>
        </Pressable>

        <Pressable
          onPress={handleSubmit}
          disabled={!canSubmit}
          style={({ pressed }) => [
            styles.submitBtn,
            {
              backgroundColor: canSubmit
                ? theme.primary.main
                : theme.background.accent,
            },
            pressed && canSubmit && { opacity: 0.85 },
          ]}
        >
          {submitting ? (
            <ActivityIndicator size="small" color={theme.background.dark} />
          ) : (
            <Text
              style={[
                styles.submitText,
                {
                  color: canSubmit
                    ? theme.background.dark
                    : theme.foreground.gray,
                },
              ]}
            >
              {t("composer.post", "Publier")}
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      marginHorizontal: 12,
      marginBottom: 12,
      backgroundColor: theme.background.darker,
      borderRadius: 16,
      padding: 12,
      gap: 10,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(255,255,255,0.06)",
    },
    row: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
    },
    avatarWrap: {
      width: 36,
      height: 36,
      borderRadius: 18,
      padding: 2,
      backgroundColor: theme.primary.main + "40",
    },
    avatar: {
      width: "100%",
      height: "100%",
      borderRadius: 16,
    },
    avatarFallback: {
      backgroundColor: theme.background.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    input: {
      flex: 1,
      minHeight: 40,
      maxHeight: 140,
      fontSize: 14,
      fontFamily: FONTS.regular,
      color: theme.foreground.white,
      paddingTop: 8,
      paddingBottom: 8,
    },
    previewWrap: {
      borderRadius: 12,
      overflow: "hidden",
    },
    previewItem: {
      width: PREVIEW_WIDTH,
      height: PREVIEW_HEIGHT,
      backgroundColor: theme.background.dark,
    },
    previewImage: {
      width: "100%",
      height: "100%",
    },
    removeBtn: {
      position: "absolute",
      top: 8,
      right: 8,
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: "rgba(0,0,0,0.6)",
      alignItems: "center",
      justifyContent: "center",
    },
    counter: {
      position: "absolute",
      top: 8,
      left: 8,
      backgroundColor: "rgba(0,0,0,0.5)",
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
    },
    counterText: {
      color: "#fff",
      fontSize: 11,
      fontFamily: FONTS.semiBold,
    },
    dots: {
      position: "absolute",
      bottom: 8,
      left: 0,
      right: 0,
      flexDirection: "row",
      justifyContent: "center",
      gap: 5,
    },
    dot: {
      width: 5,
      height: 5,
      borderRadius: 2.5,
    },
    actions: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    iconAction: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 6,
      paddingVertical: 6,
    },
    iconActionText: {
      fontSize: 12,
      fontFamily: FONTS.semiBold,
      color: theme.foreground.white,
    },
    submitBtn: {
      paddingHorizontal: 18,
      paddingVertical: 8,
      borderRadius: 20,
      minWidth: 76,
      alignItems: "center",
      justifyContent: "center",
    },
    submitText: {
      fontSize: 13,
      fontFamily: FONTS.bold,
    },
  });
}

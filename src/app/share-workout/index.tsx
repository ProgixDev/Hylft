import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Theme } from "../../constants/themes";
import { useTheme } from "../../contexts/ThemeContext";
import { api } from "../../services/api";
import {
  type LocalImage,
  uploadPostImages,
} from "../../services/postMediaUploader";
import { supabase } from "../../services/supabase";
import { FONTS } from "../../constants/fonts";

const MAX_IMAGES = 4;
type Privacy = "public" | "followers" | "private";

type Me = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
};

export default function ShareWorkout() {
  const { t } = useTranslation();
  const router = useRouter();
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const params = useLocalSearchParams<{
    name: string;
    kg: string;
    mins: string;
    sets: string;
    exercises: string;
  }>();

  const workoutName = params.name ?? "";
  const kg = params.kg ?? "0";
  const mins = params.mins ?? "0";
  const sets = params.sets ?? "0";

  const [me, setMe] = useState<Me | null>(null);
  const [caption, setCaption] = useState("");
  const [images, setImages] = useState<LocalImage[]>([]);
  const [privacy, setPrivacy] = useState<Privacy>("public");
  const [showWeight, setShowWeight] = useState(true);
  const [showSets, setShowSets] = useState(true);
  const [showDuration, setShowDuration] = useState(true);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const profile = (await api.getPublicProfile(user.id)) as Me;
        setMe(profile);
      } catch {
        /* silent */
      }
    })();
  }, []);

  const pickImages = useCallback(async () => {
    if (images.length >= MAX_IMAGES) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        t("shareWorkout.permissionDenied", "Permission needed"),
        t(
          "shareWorkout.mediaPermissionBody",
          "Allow access to your photos to attach images.",
        ),
      );
      return;
    }
    const remaining = MAX_IMAGES - images.length;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: remaining > 1,
      selectionLimit: remaining,
      quality: 0.85,
    });
    if (result.canceled) return;
    const picked: LocalImage[] = result.assets.map((a) => ({
      uri: a.uri,
      mimeType: a.mimeType ?? null,
      fileName: a.fileName ?? null,
      width: a.width,
      height: a.height,
    }));
    setImages((prev) => [...prev, ...picked].slice(0, MAX_IMAGES));
  }, [images.length, t]);

  const removeImage = useCallback((index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const canPost = !posting && (caption.trim().length > 0 || images.length > 0);

  const handlePost = useCallback(async () => {
    if (!canPost) return;
    setPosting(true);
    try {
      const media = images.length > 0 ? await uploadPostImages(images) : [];
      const stats: Record<string, string> = {};
      if (showWeight) stats.weight = `${kg} kg`;
      if (showSets) stats.sets = sets;
      if (showDuration) stats.duration = `${mins} min`;

      const trimmedCaption = caption.trim();
      const captionToSend =
        trimmedCaption || (workoutName ? workoutName : undefined);

      await api.createPost({
        kind: "standard",
        privacy,
        caption: captionToSend,
        stats: Object.keys(stats).length > 0 ? stats : undefined,
        media,
      });
      router.replace("/(tabs)/feed" as any);
    } catch (err) {
      Alert.alert(
        t("shareWorkout.postFailed", "Post failed"),
        err instanceof Error ? err.message : String(err),
      );
      setPosting(false);
    }
  }, [
    canPost,
    images,
    caption,
    privacy,
    showWeight,
    showSets,
    showDuration,
    kg,
    sets,
    mins,
    workoutName,
    router,
    t,
  ]);

  const authorName =
    me?.display_name || me?.username || t("common.you", "You");
  const authorAvatar = me?.avatar_url ?? undefined;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerSideBtn}
          onPress={() => router.back()}
          disabled={posting}
        >
          <Ionicons name="close" size={24} color={theme.foreground.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("shareWorkout.title")}</Text>
        <TouchableOpacity
          style={[styles.postBtn, !canPost && styles.postBtnDisabled]}
          onPress={handlePost}
          disabled={!canPost}
        >
          {posting ? (
            <ActivityIndicator color={theme.background.dark} size="small" />
          ) : (
            <Text
              style={[
                styles.postBtnText,
                !canPost && styles.postBtnTextDisabled,
              ]}
            >
              {t("shareWorkout.post")}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.authorRow}>
          <Image
            source={{ uri: authorAvatar }}
            style={[
              styles.avatar,
              { backgroundColor: theme.background.darker },
            ]}
          />
          <View>
            <Text style={styles.authorName}>{authorName}</Text>
            <Text style={styles.authorTime}>{t("shareWorkout.justNow")}</Text>
          </View>
        </View>

        <TextInput
          style={styles.captionInput}
          value={caption}
          onChangeText={setCaption}
          placeholder={t("shareWorkout.captionPlaceholder")}
          placeholderTextColor={theme.foreground.gray}
          multiline
          autoFocus
          textAlignVertical="top"
          editable={!posting}
        />

        {/* Images */}
        <View style={styles.imagesWrap}>
          {images.map((img, i) => (
            <View key={`${img.uri}-${i}`} style={styles.imageTile}>
              <Image source={{ uri: img.uri }} style={styles.imageTileImg} />
              <TouchableOpacity
                style={styles.imageRemoveBtn}
                onPress={() => removeImage(i)}
                hitSlop={8}
                disabled={posting}
              >
                <Ionicons name="close" size={14} color="#fff" />
              </TouchableOpacity>
            </View>
          ))}
          {images.length < MAX_IMAGES && (
            <TouchableOpacity
              style={styles.addImageTile}
              onPress={pickImages}
              disabled={posting}
              activeOpacity={0.7}
            >
              <Ionicons
                name="image-outline"
                size={24}
                color={theme.foreground.gray}
              />
              <Text style={styles.addImageText}>
                {t("shareWorkout.addPhoto", "Add photo")}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {workoutName ? (
          <View style={styles.workoutNameChip}>
            <Ionicons
              name="barbell-outline"
              size={14}
              color={theme.primary.main}
            />
            <Text style={styles.workoutNameText} numberOfLines={1}>
              {workoutName}
            </Text>
          </View>
        ) : null}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {t("shareWorkout.workoutStats")}
          </Text>
          <Text style={styles.sectionHint}>
            {t("shareWorkout.tapToToggle")}
          </Text>
        </View>

        <View style={styles.statsRow}>
          <StatChip
            icon="barbell-outline"
            label={t("post.weight")}
            value={`${kg} kg`}
            active={showWeight}
            onPress={() => setShowWeight((v) => !v)}
            theme={theme}
          />
          <StatChip
            icon="repeat-outline"
            label={t("post.sets")}
            value={`${sets} ${t("shareWorkout.sets")}`}
            active={showSets}
            onPress={() => setShowSets((v) => !v)}
            theme={theme}
          />
          <StatChip
            icon="time-outline"
            label={t("post.duration")}
            value={`${mins} min`}
            active={showDuration}
            onPress={() => setShowDuration((v) => !v)}
            theme={theme}
          />
        </View>

        {/* Privacy selector */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {t("shareWorkout.privacy", "Privacy")}
          </Text>
        </View>
        <View style={styles.privacyRow}>
          <PrivacyChip
            icon="earth"
            label={t("shareWorkout.privacyPublic", "Public")}
            active={privacy === "public"}
            onPress={() => setPrivacy("public")}
            theme={theme}
          />
          <PrivacyChip
            icon="people"
            label={t("shareWorkout.privacyFollowers", "Followers")}
            active={privacy === "followers"}
            onPress={() => setPrivacy("followers")}
            theme={theme}
          />
          <PrivacyChip
            icon="lock-closed"
            label={t("shareWorkout.privacyPrivate", "Only me")}
            active={privacy === "private"}
            onPress={() => setPrivacy("private")}
            theme={theme}
          />
        </View>

        <TouchableOpacity
          style={[styles.bottomPostBtn, !canPost && styles.postBtnDisabled]}
          onPress={handlePost}
          disabled={!canPost}
        >
          {posting ? (
            <ActivityIndicator color={theme.background.dark} size="small" />
          ) : (
            <>
              <Ionicons
                name="send-outline"
                size={18}
                color={canPost ? theme.background.dark : theme.foreground.gray}
              />
              <Text
                style={[
                  styles.bottomPostBtnText,
                  !canPost && styles.postBtnTextDisabled,
                ]}
              >
                {t("shareWorkout.post")}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

interface StatChipProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  active: boolean;
  onPress: () => void;
  theme: Theme;
}

function StatChip({
  icon,
  label,
  value,
  active,
  onPress,
  theme,
}: StatChipProps) {
  const styles = chipStyles(theme);
  return (
    <TouchableOpacity
      style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.chipIconRow}>
        <Ionicons
          name={icon}
          size={16}
          color={active ? theme.primary.main : theme.foreground.gray}
        />
        {active ? (
          <Ionicons
            name="checkmark-circle"
            size={14}
            color={theme.primary.main}
          />
        ) : (
          <Ionicons
            name="eye-off-outline"
            size={14}
            color={theme.foreground.gray}
          />
        )}
      </View>
      <Text style={[styles.chipValue, !active && styles.chipValueInactive]}>
        {value}
      </Text>
      <Text style={[styles.chipLabel, !active && styles.chipLabelInactive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function PrivacyChip({
  icon,
  label,
  active,
  onPress,
  theme,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  active: boolean;
  onPress: () => void;
  theme: Theme;
}) {
  const styles = chipStyles(theme);
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.privacyChip,
        active ? styles.chipActive : styles.chipInactive,
      ]}
    >
      <Ionicons
        name={icon}
        size={14}
        color={active ? theme.primary.main : theme.foreground.gray}
      />
      <Text
        style={[
          styles.privacyLabel,
          active && { color: theme.primary.main },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.background.dark },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.background.darker,
    },
    headerSideBtn: { width: 40, alignItems: "flex-start" },
    headerTitle: {
      fontSize: 17,
      fontFamily: FONTS.bold,
      color: theme.foreground.white,
    },
    postBtn: {
      backgroundColor: theme.primary.main,
      paddingHorizontal: 18,
      paddingVertical: 8,
      borderRadius: 16,
      minWidth: 70,
      alignItems: "center",
    },
    postBtnDisabled: { backgroundColor: theme.background.darker },
    postBtnText: {
      fontSize: 13,
      fontFamily: FONTS.bold,
      color: theme.background.dark,
    },
    postBtnTextDisabled: { color: theme.foreground.gray },
    scroll: { flex: 1 },
    scrollContent: { padding: 16, paddingBottom: 48, gap: 16 },
    authorRow: { flexDirection: "row", alignItems: "center", gap: 12 },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      borderWidth: 2,
      borderColor: theme.primary.main + "50",
    },
    authorName: {
      fontSize: 15,
      fontFamily: FONTS.bold,
      color: theme.foreground.white,
    },
    authorTime: {
      fontSize: 12,
      color: theme.foreground.gray,
      marginTop: 2,
    },
    captionInput: {
      fontSize: 16,
      color: theme.foreground.white,
      minHeight: 80,
      lineHeight: 24,
    },
    imagesWrap: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    imageTile: {
      width: 86,
      height: 86,
      borderRadius: 12,
      overflow: "hidden",
      backgroundColor: theme.background.darker,
    },
    imageTileImg: { width: "100%", height: "100%" },
    imageRemoveBtn: {
      position: "absolute",
      top: 4,
      right: 4,
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: "rgba(0,0,0,0.6)",
      alignItems: "center",
      justifyContent: "center",
    },
    addImageTile: {
      width: 86,
      height: 86,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.background.darker,
      borderStyle: "dashed",
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
    },
    addImageText: {
      fontSize: 11,
      color: theme.foreground.gray,
      fontFamily: FONTS.semiBold,
    },
    workoutNameChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      alignSelf: "flex-start",
      backgroundColor: theme.primary.main + "18",
      borderWidth: 1,
      borderColor: theme.primary.main + "40",
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 20,
    },
    workoutNameText: {
      fontSize: 13,
      fontFamily: FONTS.semiBold,
      color: theme.primary.main,
      maxWidth: 220,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: -4,
    },
    sectionTitle: {
      fontSize: 15,
      fontFamily: FONTS.bold,
      color: theme.foreground.white,
    },
    sectionHint: { fontSize: 12, color: theme.foreground.gray },
    statsRow: { flexDirection: "row", gap: 10 },
    privacyRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
    bottomPostBtn: {
      backgroundColor: theme.primary.main,
      paddingVertical: 16,
      borderRadius: 26,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      marginTop: 8,
    },
    bottomPostBtnText: {
      fontSize: 17,
      fontFamily: FONTS.bold,
      color: theme.background.dark,
    },
  });

const chipStyles = (theme: Theme) =>
  StyleSheet.create({
    chip: {
      flex: 1,
      borderRadius: 14,
      padding: 12,
      alignItems: "center",
      gap: 4,
      borderWidth: 1.5,
    },
    chipActive: {
      backgroundColor: theme.primary.main + "14",
      borderColor: theme.primary.main + "60",
    },
    chipInactive: {
      backgroundColor: theme.background.darker,
      borderColor: theme.background.darker,
      opacity: 0.6,
    },
    chipIconRow: { flexDirection: "row", alignItems: "center", gap: 4 },
    chipValue: {
      fontSize: 15,
      fontFamily: FONTS.bold,
      color: theme.foreground.white,
      textAlign: "center",
    },
    chipValueInactive: { color: theme.foreground.gray },
    chipLabel: {
      fontSize: 11,
      fontFamily: FONTS.semiBold,
      color: theme.foreground.gray,
      textTransform: "uppercase",
      textAlign: "center",
    },
    chipLabelInactive: { color: theme.foreground.gray },
    privacyChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
    },
    privacyLabel: {
      fontSize: 13,
      fontFamily: FONTS.semiBold,
      color: theme.foreground.gray,
    },
  });

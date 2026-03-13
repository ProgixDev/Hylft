import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Theme } from "../../constants/themes";
import { useTheme } from "../../contexts/ThemeContext";

import { FONTS } from "../../constants/fonts";

const MAX_IMAGES = 6;
const AUTHOR_AVATAR = "https://i.pravatar.cc/150?img=12";
const AUTHOR_USERNAME = "alex_shred";

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

  // ── State ─────────────────────────────────────────────────────────────────
  const [caption, setCaption] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [showWeight, setShowWeight] = useState(true);
  const [showSets, setShowSets] = useState(true);
  const [showDuration, setShowDuration] = useState(true);
  const [posting, setPosting] = useState(false);

  // ── Image picker ──────────────────────────────────────────────────────────
  const pickImages = async () => {
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) return;

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        t("shareWorkout.permissionDeniedTitle"),
        t("shareWorkout.permissionDeniedBody"),
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.85,
      orderedSelection: true,
    });

    if (!result.canceled) {
      setImages((prev) =>
        [...prev, ...result.assets.map((a) => a.uri)].slice(0, MAX_IMAGES),
      );
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Post ──────────────────────────────────────────────────────────────────
  const handlePost = () => {
    if (posting) return;
    setPosting(true);

    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { addPost } = require("../../data/mockData");
      addPost({
        id: `post-${Date.now()}`,
        userId: "1",
        images,
        likes: 0,
        caption: caption.trim() || workoutName,
        comments: 0,
        timestamp: "Just now",
        isLiked: false,
        weight: showWeight ? `${kg} kg` : undefined,
        sets: showSets ? sets : undefined,
        duration: showDuration ? `${mins} min` : undefined,
      });
    } catch (err) {
      console.warn("addPost failed:", err);
    }

    // Navigate to home feed
    router.replace("/(tabs)/home" as any);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  const canPost = caption.trim().length > 0 || images.length > 0;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerSideBtn}
          onPress={() => router.back()}
        >
          <Ionicons name="close" size={24} color={theme.foreground.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("shareWorkout.title")}</Text>
        <TouchableOpacity
          style={[styles.postBtn, !canPost && styles.postBtnDisabled]}
          onPress={handlePost}
          disabled={!canPost || posting}
        >
          <Text
            style={[styles.postBtnText, !canPost && styles.postBtnTextDisabled]}
          >
            {t("shareWorkout.post")}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Author row */}
        <View style={styles.authorRow}>
          <Image source={{ uri: AUTHOR_AVATAR }} style={styles.avatar} />
          <View>
            <Text style={styles.authorName}>{AUTHOR_USERNAME}</Text>
            <Text style={styles.authorTime}>{t("shareWorkout.justNow")}</Text>
          </View>
        </View>

        {/* Caption input */}
        <TextInput
          style={styles.captionInput}
          value={caption}
          onChangeText={setCaption}
          placeholder={t("shareWorkout.captionPlaceholder")}
          placeholderTextColor={theme.foreground.gray}
          multiline
          autoFocus
          textAlignVertical="top"
        />

        {/* Workout name chip */}
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

        {/* ── Image grid ────────────────────────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t("shareWorkout.photos")}</Text>
          <Text style={styles.sectionCount}>
            {images.length}/{MAX_IMAGES}
          </Text>
        </View>

        <View style={styles.imageGrid}>
          {images.map((uri, idx) => (
            <View key={uri + idx} style={styles.imageCell}>
              <Image source={{ uri }} style={styles.imageThumbnail} />
              <TouchableOpacity
                style={styles.removeImageBtn}
                onPress={() => removeImage(idx)}
                hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
              >
                <Ionicons name="close-circle" size={22} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ))}
          {images.length < MAX_IMAGES && (
            <TouchableOpacity style={styles.addImageCell} onPress={pickImages}>
              <Ionicons name="add" size={32} color={theme.primary.main} />
              <Text style={styles.addImageText}>
                {t("shareWorkout.addPhoto")}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Stat chips ───────────────────────────────────────────────── */}
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

        {/* Bottom post button */}
        <TouchableOpacity
          style={[styles.bottomPostBtn, !canPost && styles.postBtnDisabled]}
          onPress={handlePost}
          disabled={!canPost || posting}
        >
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
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Stat chip component ────────────────────────────────────────────────────
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

// ── Styles ────────────────────────────────────────────────────────────────
const createStyles = (theme: Theme) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.background.dark,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.background.darker,
    },
    headerSideBtn: {
      width: 40,
      alignItems: "flex-start",
    },
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
    },
    postBtnDisabled: {
      backgroundColor: theme.background.darker,
    },
    postBtnText: {
      fontSize: 13,
      fontFamily: FONTS.bold,
      color: theme.background.dark,
    },
    postBtnTextDisabled: {
      color: theme.foreground.gray,
    },
    scroll: { flex: 1 },
    scrollContent: {
      padding: 16,
      paddingBottom: 48,
      gap: 16,
    },
    authorRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
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
    sectionCount: {
      fontSize: 13,
      color: theme.foreground.gray,
    },
    sectionHint: {
      fontSize: 12,
      color: theme.foreground.gray,
    },
    imageGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    imageCell: {
      width: "31%",
      aspectRatio: 1,
      borderRadius: 12,
      overflow: "visible",
    },
    imageThumbnail: {
      width: "100%",
      height: "100%",
      borderRadius: 12,
    },
    removeImageBtn: {
      position: "absolute",
      top: -8,
      right: -8,
      backgroundColor: theme.background.dark,
      borderRadius: 11,
    },
    addImageCell: {
      width: "31%",
      aspectRatio: 1,
      borderRadius: 12,
      borderWidth: 1.5,
      borderStyle: "dashed",
      borderColor: theme.primary.main + "60",
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
      backgroundColor: theme.background.darker,
    },
    addImageText: {
      fontSize: 11,
      fontFamily: FONTS.semiBold,
      color: theme.primary.main,
    },
    statsRow: {
      flexDirection: "row",
      gap: 10,
    },
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
      opacity: 0.5,
    },
    chipIconRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    chipValue: {
      fontSize: 15,
      fontFamily: FONTS.bold,
      color: theme.foreground.white,
      textAlign: "center",
    },
    chipValueInactive: {
      color: theme.foreground.gray,
    },
    chipLabel: {
      fontSize: 11,
      fontFamily: FONTS.semiBold,
      color: theme.foreground.gray,
      textTransform: "uppercase",
      textAlign: "center",
    },
    chipLabelInactive: {
      color: theme.foreground.gray,
    },
  });

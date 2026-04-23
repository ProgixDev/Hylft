import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  Image,
  ImageSourcePropType,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { FONTS } from "../../constants/fonts";
import { Theme } from "../../constants/themes";
import { useTheme } from "../../contexts/ThemeContext";
import { compactNumber, formatMemberSince } from "../../utils/format";

export type ProfileHeaderMode = "self" | "public";

export interface ProfileHeaderProps {
  coverUrl: string | null;
  avatarUrl: string | null;
  displayName: string;
  username?: string | null;
  memberSinceIso?: string | null;
  badge?: string | null;
  stats: { posts: number; followers: number; likes: number };
  mode: ProfileHeaderMode;
  isFollowing?: boolean;
  locale?: string;
  onSettingsPress?: () => void;
  onAvatarPress?: () => void;
  onCoverPress?: () => void;
  onPrimaryPress?: () => void;
  onSecondaryPress?: () => void;
}

const AVATAR_SIZE = 88;
const COVER_HEIGHT = 220;

export default function ProfileHeader(props: ProfileHeaderProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const {
    coverUrl,
    avatarUrl,
    displayName,
    username,
    memberSinceIso,
    badge,
    stats,
    mode,
    isFollowing,
    locale,
    onSettingsPress,
    onAvatarPress,
    onCoverPress,
    onPrimaryPress,
    onSecondaryPress,
  } = props;

  const coverSource: ImageSourcePropType | null = coverUrl
    ? { uri: coverUrl }
    : null;

  const primaryLabel =
    mode === "self"
      ? "Modifier le profil"
      : isFollowing
        ? "Abonné"
        : "Suivre";
  const primaryIcon: keyof typeof Ionicons.glyphMap | null =
    mode === "self"
      ? "create-outline"
      : isFollowing
        ? "checkmark"
        : "add";
  const secondaryLabel = "Partager";
  const secondaryIcon: keyof typeof Ionicons.glyphMap = "share-social-outline";

  const primaryFilled = !(mode === "public" && isFollowing);

  return (
    <View style={styles.wrapper}>
      <Pressable
        onPress={mode === "self" ? onCoverPress : undefined}
        style={styles.coverWrap}
      >
        {coverSource ? (
          <Image source={coverSource} style={styles.cover} resizeMode="cover" />
        ) : (
          <View style={[styles.cover, styles.coverPlaceholder]}>
            <Ionicons
              name="image-outline"
              size={28}
              color={theme.foreground.gray}
            />
            <Text style={styles.coverPlaceholderTitle}>
              {mode === "self"
                ? t("profile.coverPlaceholderTitle", "Add a cover photo")
                : t("profile.coverPlaceholderTitlePublic", "No cover photo")}
            </Text>
            {mode === "self" ? (
              <Text style={styles.coverPlaceholderHint}>
                {t(
                  "profile.coverPlaceholderHint",
                  "Tap to choose a cover picture for your profile",
                )}
              </Text>
            ) : null}
          </View>
        )}

        {onSettingsPress ? (
          <View style={styles.coverOverlay}>
            <Pressable
              hitSlop={10}
              onPress={onSettingsPress}
              style={styles.cornerBtn}
            >
              <Ionicons name="settings-outline" size={18} color="#fff" />
            </Pressable>
          </View>
        ) : null}

        <View style={styles.avatarFrame} pointerEvents="box-none">
          <Pressable
            onPress={mode === "self" ? onAvatarPress : undefined}
            style={styles.avatarPressable}
          >
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Ionicons
                  name="person"
                  size={44}
                  color={theme.foreground.gray}
                />
              </View>
            )}
            {mode === "self" && (
              <View style={styles.avatarBadge}>
                <Ionicons
                  name="camera"
                  size={14}
                  color={theme.foreground.white}
                />
              </View>
            )}
          </Pressable>
        </View>
      </Pressable>

      <View style={styles.body}>
        {badge ? (
          <View style={styles.badgePill}>
            <Ionicons
              name="sparkles"
              size={12}
              color={theme.primary.main}
              style={{ marginRight: 6 }}
            />
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}

        {memberSinceIso ? (
          <Text style={styles.memberSince}>
            {t("profile.memberSince", {
              date: formatMemberSince(memberSinceIso, locale),
            })}
          </Text>
        ) : null}

        <Text style={styles.name} numberOfLines={1}>
          {displayName}
        </Text>

        {username ? (
          <Text style={styles.handle} numberOfLines={1}>
            @{username}
          </Text>
        ) : null}

        <View style={styles.statsRow}>
          <StatCell
            icon="document-text-outline"
            value={compactNumber(stats.posts)}
            label="Postes"
            theme={theme}
          />
          <StatCell
            icon="people-outline"
            value={compactNumber(stats.followers)}
            label="Abonnés"
            theme={theme}
          />
          <StatCell
            icon="heart-outline"
            value={compactNumber(stats.likes)}
            label="Likes"
            theme={theme}
          />
        </View>

        <View style={styles.actionsRow}>
          <Pressable
            onPress={onPrimaryPress}
            style={[
              styles.primaryBtn,
              !primaryFilled && styles.primaryBtnOutline,
            ]}
          >
            <Text
              style={[
                styles.primaryBtnText,
                !primaryFilled && styles.primaryBtnOutlineText,
              ]}
            >
              {primaryLabel}
            </Text>
            {primaryIcon ? (
              <Ionicons
                name={primaryIcon}
                size={16}
                color={
                  primaryFilled ? theme.background.dark : theme.primary.main
                }
                style={{ marginLeft: 6 }}
              />
            ) : null}
          </Pressable>
          {mode === "self" ? (
            <Pressable onPress={onSecondaryPress} style={styles.secondaryBtn}>
              <Text style={styles.secondaryBtnText}>{secondaryLabel}</Text>
              <Ionicons
                name={secondaryIcon}
                size={16}
                color={theme.foreground.white}
                style={{ marginLeft: 6 }}
              />
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

function StatCell({
  icon,
  value,
  label,
  theme,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
  theme: Theme;
}) {
  return (
    <View style={statCellStyles.cell}>
      <Ionicons name={icon} size={18} color={theme.foreground.gray} />
      <Text style={[statCellStyles.value, { color: theme.foreground.white }]}>
        {value}
      </Text>
      <Text style={[statCellStyles.label, { color: theme.foreground.gray }]}>
        {label}
      </Text>
    </View>
  );
}

const statCellStyles = StyleSheet.create({
  cell: { flex: 1, alignItems: "center" },
  value: { fontSize: 18, fontFamily: FONTS.extraBold, marginTop: 4 },
  label: { fontSize: 12, fontFamily: FONTS.regular, marginTop: 2 },
});

function createStyles(theme: Theme) {
  return StyleSheet.create({
    wrapper: { paddingBottom: 16 },
    coverWrap: {
      height: COVER_HEIGHT,
      marginHorizontal: 12,
      marginTop: 12,
      borderRadius: 24,
      overflow: "visible",
    },
    cover: {
      width: "100%",
      height: COVER_HEIGHT,
      borderRadius: 24,
    },
    coverPlaceholder: {
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.background.darker,
    },
    coverPlaceholderTitle: {
      marginTop: 8,
      color: theme.foreground.white,
      fontSize: 16,
      fontFamily: FONTS.semiBold,
    },
    coverPlaceholderHint: {
      marginTop: 4,
      color: theme.foreground.gray,
      fontSize: 12,
      fontFamily: FONTS.regular,
      textAlign: "center",
      paddingHorizontal: 24,
    },
    coverOverlay: {
      position: "absolute",
      top: 14,
      left: 14,
      right: 14,
      flexDirection: "row",
      justifyContent: "flex-end",
    },
    cornerBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: "rgba(0,0,0,0.7)",
      alignItems: "center",
      justifyContent: "center",
    },
    avatarFrame: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: -AVATAR_SIZE / 2,
      alignItems: "center",
    },
    avatarPressable: {
      width: AVATAR_SIZE,
      height: AVATAR_SIZE,
      borderRadius: AVATAR_SIZE / 2,
      borderWidth: 3,
      borderColor: theme.background.dark,
      overflow: "visible",
    },
    avatar: {
      width: "100%",
      height: "100%",
      borderRadius: AVATAR_SIZE / 2,
      backgroundColor: theme.background.darker,
    },
    avatarPlaceholder: {
      alignItems: "center",
      justifyContent: "center",
    },
    avatarBadge: {
      position: "absolute",
      right: -2,
      bottom: -2,
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: theme.primary.main,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: theme.background.dark,
    },
    body: {
      marginTop: AVATAR_SIZE / 2 + 12,
      alignItems: "center",
      paddingHorizontal: 20,
    },
    badgePill: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: theme.primary.main,
      backgroundColor: `${theme.primary.main}15`,
    },
    badgeText: {
      color: theme.primary.main,
      fontFamily: FONTS.semiBold,
      fontSize: 12,
    },
    memberSince: {
      marginTop: 10,
      color: theme.foreground.gray,
      fontSize: 12,
      fontFamily: FONTS.regular,
    },
    name: {
      marginTop: 4,
      color: theme.foreground.white,
      fontSize: 24,
      fontFamily: FONTS.extraBold,
    },
    handle: {
      marginTop: 2,
      color: theme.foreground.gray,
      fontSize: 14,
      fontFamily: FONTS.medium,
    },
    statsRow: {
      marginTop: 16,
      flexDirection: "row",
      alignSelf: "stretch",
    },
    actionsRow: {
      marginTop: 16,
      flexDirection: "row",
      gap: 10,
      alignSelf: "stretch",
    },
    primaryBtn: {
      flex: 1,
      height: 48,
      borderRadius: 14,
      backgroundColor: theme.primary.main,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
    },
    primaryBtnOutline: {
      backgroundColor: "transparent",
      borderWidth: 1,
      borderColor: theme.primary.main,
    },
    primaryBtnText: {
      color: theme.background.dark,
      fontFamily: FONTS.semiBold,
      fontSize: 15,
    },
    primaryBtnOutlineText: { color: theme.primary.main },
    secondaryBtn: {
      flex: 1,
      height: 48,
      borderRadius: 14,
      backgroundColor: theme.background.accent,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
    },
    secondaryBtnText: {
      color: theme.foreground.white,
      fontFamily: FONTS.semiBold,
      fontSize: 15,
    },
  });
}

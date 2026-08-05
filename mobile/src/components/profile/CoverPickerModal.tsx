import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { FONTS } from "../../constants/fonts";
import { Theme } from "../../constants/themes";
import { useTheme } from "../../contexts/ThemeContext";
import { api } from "../../services/api";

type Wallpaper = {
  id: number;
  public_url: string;
  sort_order: number;
  tier: "free" | "premium";
};

interface Props {
  visible: boolean;
  currentUrl: string | null;
  onClose: () => void;
  onSelect: (url: string) => Promise<void> | void;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const COLS = 3;
const H_PADDING = 16;
const GAP = 10;
const CELL_SIZE =
  (SCREEN_WIDTH - H_PADDING * 2 - GAP * (COLS - 1)) / COLS;

export default function CoverPickerModal({
  visible,
  currentUrl,
  onClose,
  onSelect,
}: Props) {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const [items, setItems] = useState<Wallpaper[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = (await api.listWallpapers()) as { items: Wallpaper[] };
        if (!cancelled) setItems(res.items ?? []);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Failed to load wallpapers");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [visible]);

  const handlePick = async (item: Wallpaper) => {
    if (saving) return;
    if (item.tier === "premium") {
      setError("This cover is available to premium members.");
      return;
    }
    setSaving(item.public_url);
    try {
      await onSelect(item.public_url);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save cover");
    } finally {
      setSaving(null);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={onClose} hitSlop={10}>
            <Ionicons name="close" size={26} color={theme.foreground.white} />
          </Pressable>
          <Text style={styles.title}>Choose cover</Text>
          <View style={{ width: 26 }} />
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={theme.primary.main} />
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => String(item.id)}
            numColumns={COLS}
            columnWrapperStyle={{ gap: GAP }}
            contentContainerStyle={{
              paddingHorizontal: H_PADDING,
              paddingBottom: 32,
              gap: GAP,
            }}
            renderItem={({ item }) => {
              const selected = currentUrl === item.public_url;
              const isSaving = saving === item.public_url;
              const isPremium = item.tier === "premium";
              return (
                <Pressable
                  style={[styles.cell, selected && styles.cellSelected]}
                  onPress={() => handlePick(item)}
                >
                  <Image
                    source={{ uri: item.public_url }}
                    style={styles.thumb}
                    resizeMode="cover"
                  />
                  {isPremium && (
                    <View style={styles.premiumBadge}>
                      <Ionicons name="lock-closed" size={12} color="#fff" />
                    </View>
                  )}
                  {selected && !isSaving && (
                    <View style={styles.checkBadge}>
                      <Ionicons name="checkmark" size={14} color="#fff" />
                    </View>
                  )}
                  {isSaving && (
                    <View style={styles.savingOverlay}>
                      <ActivityIndicator color="#fff" />
                    </View>
                  )}
                </Pressable>
              );
            }}
          />
        )}
      </View>
    </Modal>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background.dark },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    title: {
      color: theme.foreground.white,
      fontFamily: FONTS.semiBold,
      fontSize: 16,
    },
    center: { flex: 1, alignItems: "center", justifyContent: "center" },
    errorText: { color: theme.foreground.gray },
    cell: {
      width: CELL_SIZE,
      height: CELL_SIZE * 1.4,
      borderRadius: 14,
      overflow: "hidden",
      backgroundColor: theme.background.darker,
      borderWidth: 2,
      borderColor: "transparent",
    },
    cellSelected: { borderColor: theme.primary.main },
    thumb: { width: "100%", height: "100%" },
    premiumBadge: {
      position: "absolute",
      top: 6,
      left: 6,
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: "rgba(0,0,0,0.6)",
      alignItems: "center",
      justifyContent: "center",
    },
    checkBadge: {
      position: "absolute",
      top: 6,
      right: 6,
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: theme.primary.main,
      alignItems: "center",
      justifyContent: "center",
    },
    savingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.4)",
      alignItems: "center",
      justifyContent: "center",
    },
  });
}

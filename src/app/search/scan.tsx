import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { FONTS } from "../../constants/fonts";
import { Theme } from "../../constants/themes";
import { useTheme } from "../../contexts/ThemeContext";

const UUID_RE =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

function extractUserId(raw: string): string | null {
  const trimmed = raw.trim();
  const fromPath = trimmed.match(/\/user\/([^/?#\s]+)/i);
  if (fromPath?.[1] && UUID_RE.test(fromPath[1])) return fromPath[1];
  if (UUID_RE.test(trimmed)) return trimmed.match(UUID_RE)![0];
  return null;
}

export default function ScanQrScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [permission, requestPermission] = useCameraPermissions();
  const [error, setError] = useState<string | null>(null);
  const handledRef = useRef(false);

  const handleScan = useCallback(
    ({ data }: { data: string }) => {
      if (handledRef.current) return;
      const userId = extractUserId(data);
      if (!userId) {
        setError("This QR code doesn't point to a Hylift profile.");
        return;
      }
      handledRef.current = true;
      router.replace(`/user/${userId}` as any);
    },
    [router],
  );

  if (!permission) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={theme.primary.main} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.center, { padding: 24 }]}>
        <Ionicons
          name="camera-outline"
          size={48}
          color={theme.foreground.gray}
        />
        <Text style={styles.permTitle}>Camera access required</Text>
        <Text style={styles.permHint}>
          We need your camera to scan profile QR codes.
        </Text>
        <Pressable style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>Grant access</Text>
        </Pressable>
        <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: theme.foreground.gray }}>Cancel</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        onBarcodeScanned={handleScan}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
      />

      <View style={styles.overlay} pointerEvents="box-none">
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            style={styles.closeBtn}
          >
            <Ionicons name="close" size={24} color="#fff" />
          </Pressable>
          <Text style={styles.title}>Scan profile QR</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.frameWrap}>
          <View style={styles.frame} />
          <Text style={styles.hint}>
            Align the QR code inside the frame
          </Text>
          {error ? (
            <Pressable
              onPress={() => {
                setError(null);
                handledRef.current = false;
              }}
              style={styles.errorBtn}
            >
              <Text style={styles.errorText}>{error} Tap to retry.</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: "#000" },
    center: { alignItems: "center", justifyContent: "center" },
    overlay: { flex: 1 },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingTop: 48,
      paddingBottom: 12,
    },
    closeBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: "rgba(0,0,0,0.45)",
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      color: "#fff",
      fontFamily: FONTS.semiBold,
      fontSize: 16,
    },
    frameWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
    frame: {
      width: 260,
      height: 260,
      borderRadius: 24,
      borderWidth: 3,
      borderColor: theme.primary.main,
    },
    hint: {
      marginTop: 16,
      color: "rgba(255,255,255,0.85)",
      fontSize: 13,
      fontFamily: FONTS.medium,
    },
    errorBtn: {
      marginTop: 16,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 12,
      backgroundColor: "rgba(0,0,0,0.65)",
      maxWidth: 300,
    },
    errorText: {
      color: "#ffb4b4",
      fontSize: 12,
      textAlign: "center",
    },
    permTitle: {
      marginTop: 12,
      color: theme.foreground.white,
      fontFamily: FONTS.semiBold,
      fontSize: 16,
    },
    permHint: {
      marginTop: 6,
      color: theme.foreground.gray,
      fontSize: 13,
      textAlign: "center",
      maxWidth: 280,
    },
    permBtn: {
      marginTop: 20,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: theme.primary.main,
    },
    permBtnText: {
      color: theme.background.dark,
      fontFamily: FONTS.semiBold,
      fontSize: 14,
    },
  });
}

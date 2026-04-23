import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { FONTS } from "../../constants/fonts";
import { Theme } from "../../constants/themes";
import { useTheme } from "../../contexts/ThemeContext";

interface Props {
  visible: boolean;
  hasAvatar: boolean;
  onClose: () => void;
  onTakePhoto: () => void;
  onChooseLibrary: () => void;
  onRemove: () => void;
}

export default function AvatarActionSheet({
  visible,
  hasAvatar,
  onClose,
  onTakePhoto,
  onChooseLibrary,
  onRemove,
}: Props) {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const Row = ({
    icon,
    label,
    destructive,
    disabled,
    onPress,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    destructive?: boolean;
    disabled?: boolean;
    onPress: () => void;
  }) => (
    <Pressable
      style={[styles.row, disabled && styles.rowDisabled]}
      disabled={disabled}
      onPress={() => {
        onPress();
      }}
    >
      <Ionicons
        name={icon}
        size={20}
        color={
          disabled
            ? theme.foreground.gray
            : destructive
              ? "#ED6665"
              : theme.foreground.white
        }
      />
      <Text
        style={[
          styles.rowText,
          destructive && { color: "#ED6665" },
          disabled && { color: theme.foreground.gray },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <Text style={styles.title}>Profile photo</Text>
          <Row
            icon="camera-outline"
            label="Take photo"
            onPress={() => {
              onClose();
              onTakePhoto();
            }}
          />
          <Row
            icon="image-outline"
            label="Choose from library"
            onPress={() => {
              onClose();
              onChooseLibrary();
            }}
          />
          <Row
            icon="trash-outline"
            label="Remove photo"
            destructive
            disabled={!hasAvatar}
            onPress={() => {
              onClose();
              onRemove();
            }}
          />
          <Pressable style={styles.cancel} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.45)",
      justifyContent: "flex-end",
    },
    sheet: {
      backgroundColor: theme.background.darker,
      paddingHorizontal: 16,
      paddingTop: 10,
      paddingBottom: 30,
      borderTopLeftRadius: 22,
      borderTopRightRadius: 22,
    },
    handle: {
      alignSelf: "center",
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.foreground.gray,
      opacity: 0.5,
      marginBottom: 12,
    },
    title: {
      color: theme.foreground.white,
      fontFamily: FONTS.semiBold,
      fontSize: 15,
      marginBottom: 10,
      paddingHorizontal: 4,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 10,
      paddingVertical: 14,
      borderRadius: 12,
    },
    rowDisabled: { opacity: 0.5 },
    rowText: {
      marginLeft: 12,
      color: theme.foreground.white,
      fontFamily: FONTS.regular,
      fontSize: 15,
    },
    cancel: {
      marginTop: 10,
      backgroundColor: theme.background.accent,
      borderRadius: 12,
      alignItems: "center",
      paddingVertical: 14,
    },
    cancelText: {
      color: theme.foreground.white,
      fontFamily: FONTS.semiBold,
      fontSize: 15,
    },
  });
}

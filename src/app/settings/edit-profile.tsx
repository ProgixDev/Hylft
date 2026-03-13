import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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
import { getUserById } from "../../data/mockData";

import { FONTS } from "../../constants/fonts";

const MY_USER_ID = "1";
const KEYS = {
  displayName: "@hylift_display_name",
  username: "@hylift_username",
  bio: "@hylift_bio",
  website: "@hylift_website",
};

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background.dark },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.background.accent,
    },
    headerLeft: { flexDirection: "row", alignItems: "center" },
    backBtn: { padding: 6, marginRight: 8 },
    headerTitle: {
      fontSize: 20,
      fontFamily: FONTS.bold,
      color: theme.foreground.white,
    },
    saveBtn: {
      paddingHorizontal: 18,
      paddingVertical: 8,
      borderRadius: 22,
      backgroundColor: theme.primary.main,
    },
    saveBtnText: {
      fontSize: 15,
      fontFamily: FONTS.bold,
      color: theme.background.dark,
    },
    avatarSection: {
      alignItems: "center",
      paddingVertical: 28,
      borderBottomWidth: 1,
      borderBottomColor: theme.background.accent,
    },
    avatarWrapper: { position: "relative", marginBottom: 10 },
    avatar: {
      width: 96,
      height: 96,
      borderRadius: 48,
      borderWidth: 3,
      borderColor: theme.primary.main,
    },
    avatarBadge: {
      position: "absolute",
      bottom: 2,
      right: 2,
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: theme.primary.main,
      alignItems: "center",
      justifyContent: "center",
    },
    changePhotoText: {
      fontSize: 14,
      fontFamily: FONTS.semiBold,
      color: theme.primary.main,
    },
    form: { paddingHorizontal: 16, paddingTop: 8, gap: 4 },
    fieldGroup: { marginTop: 20 },
    fieldLabel: {
      fontSize: 12,
      fontFamily: FONTS.semiBold,
      color: theme.foreground.gray,
      marginBottom: 8,
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    input: {
      backgroundColor: theme.background.accent,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 13,
      fontSize: 15,
      color: theme.foreground.white,
      borderWidth: 1,
      borderColor: "transparent",
    },
    inputFocused: { borderColor: theme.primary.main },
    inputMultiline: { minHeight: 90, textAlignVertical: "top", paddingTop: 12 },
    charCount: {
      fontSize: 11,
      color: theme.foreground.gray,
      textAlign: "right",
      marginTop: 4,
    },
    charCountWarn: { color: "#f87171" },
    divider: {
      height: 1,
      backgroundColor: theme.background.accent,
      marginTop: 28,
      marginBottom: 8,
    },
    sectionLabel: {
      fontSize: 12,
      fontFamily: FONTS.semiBold,
      color: theme.foreground.gray,
      textTransform: "uppercase",
      letterSpacing: 0.6,
      marginTop: 8,
      marginBottom: 4,
    },
  });
}

export default function EditProfile() {
  const router = useRouter();
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const user = getUserById(MY_USER_ID);

  const [displayName, setDisplayName] = useState(user?.username ?? "");
  const [username, setUsername] = useState(user?.username ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [website, setWebsite] = useState("");
  const [saving, setSaving] = useState(false);

  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const [dn, un, b, w] = await Promise.all([
        AsyncStorage.getItem(KEYS.displayName),
        AsyncStorage.getItem(KEYS.username),
        AsyncStorage.getItem(KEYS.bio),
        AsyncStorage.getItem(KEYS.website),
      ]);
      if (dn) setDisplayName(dn);
      if (un) setUsername(un);
      if (b) setBio(b);
      if (w) setWebsite(w);
    };
    load();
  }, []);

  const handleSave = async () => {
    if (!username.trim()) {
      Alert.alert("Validation", "Username cannot be empty.");
      return;
    }
    if (username.includes(" ")) {
      Alert.alert("Validation", "Username cannot contain spaces.");
      return;
    }
    setSaving(true);
    try {
      await Promise.all([
        AsyncStorage.setItem(KEYS.displayName, displayName.trim()),
        AsyncStorage.setItem(KEYS.username, username.trim()),
        AsyncStorage.setItem(KEYS.bio, bio.trim()),
        AsyncStorage.setItem(KEYS.website, website.trim()),
      ]);
      Alert.alert("Saved", "Your profile has been updated.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert("Error", "Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <Ionicons
              name="chevron-back"
              size={26}
              color={theme.foreground.white}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
        </View>
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          <Text style={styles.saveBtnText}>{saving ? "Saving…" : "Save"}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <TouchableOpacity
            style={styles.avatarWrapper}
            activeOpacity={0.8}
            onPress={() =>
              Alert.alert("Change Photo", "Photo picker coming soon.")
            }
          >
            <Image
              source={{
                uri: user?.avatar ?? "https://i.pravatar.cc/150?img=12",
              }}
              style={styles.avatar}
            />
            <View style={styles.avatarBadge}>
              <Ionicons name="camera" size={15} color={theme.background.dark} />
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() =>
              Alert.alert("Change Photo", "Photo picker coming soon.")
            }
          >
            <Text style={styles.changePhotoText}>Change Profile Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Display Name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Display Name</Text>
            <TextInput
              style={[
                styles.input,
                focusedField === "name" && styles.inputFocused,
              ]}
              value={displayName}
              onChangeText={setDisplayName}
              onFocus={() => setFocusedField("name")}
              onBlur={() => setFocusedField(null)}
              placeholder="Your display name"
              placeholderTextColor={theme.foreground.gray}
              maxLength={50}
              returnKeyType="next"
            />
          </View>

          {/* Username */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Username</Text>
            <TextInput
              style={[
                styles.input,
                focusedField === "username" && styles.inputFocused,
              ]}
              value={username}
              onChangeText={(t) =>
                setUsername(t.toLowerCase().replace(/\s/g, ""))
              }
              onFocus={() => setFocusedField("username")}
              onBlur={() => setFocusedField(null)}
              placeholder="username"
              placeholderTextColor={theme.foreground.gray}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={30}
              returnKeyType="next"
            />
          </View>

          {/* Bio */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Bio</Text>
            <TextInput
              style={[
                styles.input,
                styles.inputMultiline,
                focusedField === "bio" && styles.inputFocused,
              ]}
              value={bio}
              onChangeText={setBio}
              onFocus={() => setFocusedField("bio")}
              onBlur={() => setFocusedField(null)}
              placeholder="Tell people about yourself…"
              placeholderTextColor={theme.foreground.gray}
              multiline
              maxLength={150}
            />
            <Text
              style={[
                styles.charCount,
                bio.length > 130 && styles.charCountWarn,
              ]}
            >
              {bio.length}/150
            </Text>
          </View>

          {/* Website */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Website</Text>
            <TextInput
              style={[
                styles.input,
                focusedField === "website" && styles.inputFocused,
              ]}
              value={website}
              onChangeText={setWebsite}
              onFocus={() => setFocusedField("website")}
              onBlur={() => setFocusedField(null)}
              placeholder="https://yourwebsite.com"
              placeholderTextColor={theme.foreground.gray}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              returnKeyType="done"
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

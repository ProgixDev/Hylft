import { Ionicons } from "@expo/vector-icons";
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
import { FONTS } from "../../constants/fonts";
import { Theme } from "../../constants/themes";
import { useTheme } from "../../contexts/ThemeContext";
import { api } from "../../services/api";
import { pickAndUploadAvatar } from "../../services/avatarUploader";

type MyProfile = {
  id: string;
  username: string | null;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  bio?: string | null;
};

const USERNAME_RE = /^[a-z0-9_.]{3,30}$/;

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
    saveBtnDisabled: { opacity: 0.5 },
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
      backgroundColor: theme.background.accent,
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
    nameRow: { flexDirection: "row", gap: 12 },
    nameCol: { flex: 1 },
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
    usernameRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.background.accent,
      borderRadius: 10,
      paddingLeft: 14,
      borderWidth: 1,
      borderColor: "transparent",
    },
    usernameRowFocused: { borderColor: theme.primary.main },
    atSign: {
      fontSize: 15,
      color: theme.foreground.gray,
      fontFamily: FONTS.semiBold,
      marginRight: 2,
    },
    usernameInput: {
      flex: 1,
      paddingHorizontal: 2,
      paddingVertical: 13,
      fontSize: 15,
      color: theme.foreground.white,
    },
    hint: {
      fontSize: 11,
      color: theme.foreground.gray,
      marginTop: 6,
    },
    charCount: {
      fontSize: 11,
      color: theme.foreground.gray,
      textAlign: "right",
      marginTop: 4,
    },
    charCountWarn: { color: "#f87171" },
  });
}

export default function EditProfile() {
  const router = useRouter();
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [originalUsername, setOriginalUsername] = useState<string>("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const p = (await api.getProfile()) as MyProfile;
        const [fallbackFirst, ...rest] = (p.display_name ?? "").trim().split(/\s+/);
        setFirstName(p.first_name ?? fallbackFirst ?? "");
        setLastName(p.last_name ?? rest.join(" "));
        setUsername(p.username ?? "");
        setOriginalUsername(p.username ?? "");
        setBio(p.bio ?? "");
        setAvatarUrl(p.avatar_url ?? null);
      } catch (e) {
        Alert.alert(
          "Erreur",
          e instanceof Error ? e.message : "Impossible de charger le profil.",
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleChangePhoto = async () => {
    try {
      const publicUrl = await pickAndUploadAvatar("library");
      if (!publicUrl) return;
      const updated = (await api.updateProfile({
        avatar_url: publicUrl,
      })) as MyProfile;
      setAvatarUrl(updated.avatar_url ?? null);
    } catch (e) {
      Alert.alert(
        "Erreur",
        e instanceof Error ? e.message : "Impossible de mettre a jour la photo.",
      );
    }
  };

  const handleSave = async () => {
    const trimmedUsername = username.trim().toLowerCase();
    if (!USERNAME_RE.test(trimmedUsername)) {
      Alert.alert(
        "Nom d'utilisateur invalide",
        "Utilisez 3 a 30 caracteres : lettres minuscules, chiffres, underscore ou point.",
      );
      return;
    }

    const first = firstName.trim();
    const last = lastName.trim();
    if (!first) {
      Alert.alert("Validation", "Le prenom ne peut pas etre vide.");
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        first_name: first,
        last_name: last,
        bio: bio.trim(),
      };
      if (trimmedUsername !== originalUsername) {
        payload.username = trimmedUsername;
      }
      await api.updateProfile(payload);
      Alert.alert("Enregistre", "Votre profil a ete mis a jour.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Impossible d'enregistrer.";
      Alert.alert("Erreur", msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
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
          <Text style={styles.headerTitle}>Modifier le profil</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.saveBtn,
            (saving || loading) && styles.saveBtnDisabled,
          ]}
          onPress={handleSave}
          disabled={saving || loading}
          activeOpacity={0.8}
        >
          <Text style={styles.saveBtnText}>{saving ? "Enregistrement..." : "Enregistrer"}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View style={styles.avatarSection}>
          <TouchableOpacity
            style={styles.avatarWrapper}
            activeOpacity={0.8}
            onPress={handleChangePhoto}
          >
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View
                style={[
                  styles.avatar,
                  { alignItems: "center", justifyContent: "center" },
                ]}
              >
                <Ionicons
                  name="person"
                  size={44}
                  color={theme.foreground.gray}
                />
              </View>
            )}
            <View style={styles.avatarBadge}>
              <Ionicons name="camera" size={15} color={theme.background.dark} />
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleChangePhoto}>
            <Text style={styles.changePhotoText}>Changer la photo de profil</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <View style={styles.nameRow}>
            <View style={[styles.fieldGroup, styles.nameCol]}>
              <Text style={styles.fieldLabel}>Prenom</Text>
              <TextInput
                style={[
                  styles.input,
                  focusedField === "first" && styles.inputFocused,
                ]}
                value={firstName}
                onChangeText={setFirstName}
                onFocus={() => setFocusedField("first")}
                onBlur={() => setFocusedField(null)}
                placeholder="Prenom"
                placeholderTextColor={theme.foreground.gray}
                maxLength={40}
                returnKeyType="next"
              />
            </View>
            <View style={[styles.fieldGroup, styles.nameCol]}>
              <Text style={styles.fieldLabel}>Nom</Text>
              <TextInput
                style={[
                  styles.input,
                  focusedField === "last" && styles.inputFocused,
                ]}
                value={lastName}
                onChangeText={setLastName}
                onFocus={() => setFocusedField("last")}
                onBlur={() => setFocusedField(null)}
                placeholder="Nom"
                placeholderTextColor={theme.foreground.gray}
                maxLength={40}
                returnKeyType="next"
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Nom d'utilisateur</Text>
            <View
              style={[
                styles.usernameRow,
                focusedField === "username" && styles.usernameRowFocused,
              ]}
            >
              <Text style={styles.atSign}>@</Text>
              <TextInput
                style={styles.usernameInput}
                value={username}
                onChangeText={(t) =>
                  setUsername(t.toLowerCase().replace(/[^a-z0-9_.]/g, ""))
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
            <Text style={styles.hint}>
              3 a 30 caracteres. Lettres minuscules, chiffres, "_" et "." uniquement.
            </Text>
          </View>

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
              placeholder="Parlez un peu de vous..."
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
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

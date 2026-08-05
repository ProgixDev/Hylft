import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
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

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background.dark },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.background.accent,
    },
    backBtn: { padding: 6, marginRight: 8 },
    headerTitle: {
      fontSize: 20,
      fontFamily: FONTS.bold,
      color: theme.foreground.white,
    },
    form: { paddingHorizontal: 16, paddingTop: 16, gap: 4 },
    fieldGroup: { marginTop: 20 },
    fieldLabel: {
      fontSize: 12,
      fontFamily: FONTS.semiBold,
      color: theme.foreground.gray,
      marginBottom: 8,
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    inputRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.background.accent,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: "transparent",
    },
    inputRowFocused: { borderColor: theme.primary.main },
    input: {
      flex: 1,
      paddingHorizontal: 14,
      paddingVertical: 13,
      fontSize: 15,
      color: theme.foreground.white,
    },
    eyeBtn: { paddingHorizontal: 14 },
    hint: {
      fontSize: 12,
      color: theme.foreground.gray,
      marginTop: 5,
      lineHeight: 17,
    },
    strengthBar: {
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.background.accent,
      marginTop: 8,
      overflow: "hidden",
    },
    strengthFill: { height: "100%", borderRadius: 2 },
    strengthLabel: { fontSize: 12, marginTop: 4, fontFamily: FONTS.semiBold },
    divider: {
      height: 1,
      backgroundColor: theme.background.accent,
      marginTop: 32,
      marginBottom: 24,
    },
    requirementRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 8,
    },
    requirementText: { fontSize: 13, color: theme.foreground.gray },
    requirementMet: { color: theme.primary.main },
    submitBtn: {
      marginHorizontal: 16,
      marginTop: 32,
      paddingVertical: 15,
      borderRadius: 26,
      backgroundColor: theme.primary.main,
      alignItems: "center",
    },
    submitBtnDisabled: { opacity: 0.4 },
    submitBtnText: {
      fontSize: 17,
      fontFamily: FONTS.bold,
      color: theme.background.dark,
    },
  });
}

function getStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  if (password.length === 0)
    return { score: 0, label: "", color: "transparent" };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const map: Record<number, { label: string; color: string }> = {
    1: { label: "Weak", color: "#ef4444" },
    2: { label: "Fair", color: "#f59e0b" },
    3: { label: "Good", color: "#84cc16" },
    4: { label: "Strong", color: "#22c55e" },
  };
  return { score, ...map[score] };
}

export default function ChangePassword() {
  const router = useRouter();
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const strength = getStrength(next);
  const requirements = [
    { label: "At least 8 characters", met: next.length >= 8 },
    { label: "One uppercase letter", met: /[A-Z]/.test(next) },
    { label: "One number", met: /[0-9]/.test(next) },
    { label: "One special character", met: /[^A-Za-z0-9]/.test(next) },
  ];
  const canSubmit =
    current.length > 0 && requirements.every((r) => r.met) && next === confirm;

  const handleSave = async () => {
    if (next !== confirm) {
      Alert.alert("Mismatch", "New passwords do not match.");
      return;
    }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800)); // Simulate network
    setSaving(false);
    Alert.alert(
      "Password Updated",
      "Your password has been changed successfully.",
      [{ text: "OK", onPress: () => router.back() }],
    );
  };

  const PasswordInput = ({
    value,
    onChange,
    placeholder,
    show,
    onToggleShow,
    fieldKey,
  }: {
    value: string;
    onChange: (t: string) => void;
    placeholder: string;
    show: boolean;
    onToggleShow: () => void;
    fieldKey: string;
  }) => (
    <View
      style={[styles.inputRow, focused === fieldKey && styles.inputRowFocused]}
    >
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={theme.foreground.gray}
        secureTextEntry={!show}
        onFocus={() => setFocused(fieldKey)}
        onBlur={() => setFocused(null)}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="next"
      />
      <TouchableOpacity
        style={styles.eyeBtn}
        onPress={onToggleShow}
        activeOpacity={0.7}
      >
        <Ionicons
          name={show ? "eye-off-outline" : "eye-outline"}
          size={20}
          color={theme.foreground.gray}
        />
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons
            name="chevron-back"
            size={26}
            color={theme.foreground.white}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Change Password</Text>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View style={styles.form}>
          {/* Current Password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Current Password</Text>
            <PasswordInput
              value={current}
              onChange={setCurrent}
              placeholder="Enter current password"
              show={showCurrent}
              onToggleShow={() => setShowCurrent((v) => !v)}
              fieldKey="current"
            />
          </View>

          {/* New Password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>New Password</Text>
            <PasswordInput
              value={next}
              onChange={setNext}
              placeholder="Enter new password"
              show={showNext}
              onToggleShow={() => setShowNext((v) => !v)}
              fieldKey="next"
            />
            {next.length > 0 && (
              <>
                <View style={styles.strengthBar}>
                  <View
                    style={[
                      styles.strengthFill,
                      {
                        width: `${(strength.score / 4) * 100}%`,
                        backgroundColor: strength.color,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.strengthLabel, { color: strength.color }]}>
                  {strength.label}
                </Text>
              </>
            )}
          </View>

          {/* Confirm Password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Confirm New Password</Text>
            <PasswordInput
              value={confirm}
              onChange={setConfirm}
              placeholder="Repeat new password"
              show={showConfirm}
              onToggleShow={() => setShowConfirm((v) => !v)}
              fieldKey="confirm"
            />
            {confirm.length > 0 && next !== confirm && (
              <Text style={[styles.hint, { color: "#ef4444" }]}>
                Passwords do not match
              </Text>
            )}
          </View>
        </View>

        {/* Requirements */}
        <View style={{ paddingHorizontal: 16, marginTop: 28 }}>
          <Text style={[styles.fieldLabel, { marginBottom: 12 }]}>
            Requirements
          </Text>
          {requirements.map((r) => (
            <View key={r.label} style={styles.requirementRow}>
              <Ionicons
                name={r.met ? "checkmark-circle" : "ellipse-outline"}
                size={16}
                color={r.met ? theme.primary.main : theme.foreground.gray}
              />
              <Text
                style={[styles.requirementText, r.met && styles.requirementMet]}
              >
                {r.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
          onPress={handleSave}
          disabled={!canSubmit || saving}
          activeOpacity={0.8}
        >
          <Text style={styles.submitBtnText}>
            {saving ? "Updating…" : "Update Password"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
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
import ChipButton from "../../components/ui/ChipButton";
import SignupProgress from "../../components/ui/SignupProgress";
import { FONTS } from "../../constants/fonts";
import { Theme } from "../../constants/themes";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";

export default function AccountScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const { signUp, setGetStartedCompleted } = useAuth();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    AsyncStorage.getItem("@hylift_username").then((v) => {
      if (v) setUsername(v);
    });
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slide, {
        toValue: 0,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fade, slide]);

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const canSubmit =
    isEmailValid && password.length >= 6 && agreed && !loading && username.length >= 2;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      await signUp(email.trim(), password, username);
      try {
        await setGetStartedCompleted();
      } catch {}
      router.replace("/(tabs)/home");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Sign up failed";
      Alert.alert("Sign up error", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Animated.View
        style={{
          flex: 1,
          opacity: fade,
          transform: [{ translateY: slide }],
        }}
      >
        <SignupProgress current={13} total={13} />

        <ScrollView
          contentContainerStyle={{ paddingBottom: 16 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>One last step{username ? `, ${username}` : ""}</Text>
          <Text style={styles.subtitle}>
            Create your account to save your plan and track progress.
          </Text>

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor={theme.foreground.gray}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, { flex: 1, paddingRight: 44 }]}
                placeholder="At least 6 characters"
                placeholderTextColor={theme.foreground.gray}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.eye}
                onPress={() => setShowPassword((s) => !s)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={theme.foreground.gray}
                />
              </TouchableOpacity>
            </View>
          </View>

          <Pressable
            onPress={() => setAgreed((a) => !a)}
            style={styles.agreeRow}
          >
            <View
              style={[
                styles.checkbox,
                {
                  borderColor: agreed
                    ? theme.primary.main
                    : theme.background.accent,
                  backgroundColor: agreed ? theme.primary.main : "transparent",
                },
              ]}
            >
              {agreed && <Ionicons name="checkmark" size={14} color="#fff" />}
            </View>
            <Text style={[styles.agreeText, { color: theme.foreground.gray }]}>
              I agree to the{" "}
              <Text style={{ color: theme.primary.main, fontFamily: FONTS.semiBold }}>
                Hylift Terms
              </Text>{" "}
              and{" "}
              <Text style={{ color: theme.primary.main, fontFamily: FONTS.semiBold }}>
                Privacy Policy
              </Text>
              .
            </Text>
          </Pressable>
        </ScrollView>
      </Animated.View>

      <ChipButton
        title={loading ? "Creating account..." : "Create account"}
        onPress={handleSubmit}
        variant="primary"
        size="lg"
        fullWidth
        disabled={!canSubmit}
        loading={loading}
      />
    </KeyboardAvoidingView>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background.dark,
      paddingHorizontal: 20,
      paddingBottom: 16,
    },
    title: {
      fontSize: 24,
      fontFamily: FONTS.bold,
      color: theme.foreground.white,
      marginBottom: 6,
    },
    subtitle: {
      fontSize: 13,
      color: theme.foreground.gray,
      lineHeight: 20,
      marginBottom: 20,
    },
    field: {
      marginBottom: 14,
    },
    label: {
      fontSize: 13,
      fontFamily: FONTS.semiBold,
      color: theme.foreground.white,
      marginBottom: 8,
    },
    input: {
      backgroundColor: theme.background.darker,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 14,
      fontSize: 15,
      color: theme.foreground.white,
      borderWidth: 1.5,
      borderColor: theme.background.accent,
      fontFamily: FONTS.medium,
    },
    passwordRow: {
      position: "relative",
      justifyContent: "center",
    },
    eye: {
      position: "absolute",
      right: 12,
      height: "100%",
      justifyContent: "center",
      paddingHorizontal: 4,
    },
    agreeRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
      marginTop: 6,
      paddingVertical: 4,
    },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: 6,
      borderWidth: 2,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 2,
    },
    agreeText: {
      flex: 1,
      fontSize: 13,
      lineHeight: 19,
    },
  });
}

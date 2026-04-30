import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import ChipButton from "../../components/ui/ChipButton";
import SignupProgress from "../../components/ui/SignupProgress";
import { FONTS } from "../../constants/fonts";
import { useTheme } from "../../contexts/ThemeContext";
import { supabase } from "../../services/supabase";

const BG = "#FFFFFF";
const TOTAL_STEPS = 13;

const escapeLikePattern = (value: string) =>
  value.replace(/[\\%_]/g, (match) => `\\${match}`);

export default function UsernameScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [username, setUsername] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
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

  const normalizedUsername = username.trim();
  const canContinue =
    normalizedUsername.length >= 2 &&
    !isChecking &&
    isAvailable &&
    !errorMessage;

  useEffect(() => {
    setIsAvailable(false);
    setErrorMessage("");

    if (normalizedUsername.length < 2) {
      setIsChecking(false);
      return;
    }

    const timeout = setTimeout(async () => {
      const usernameToCheck = normalizedUsername;
      setIsChecking(true);

      try {
        const { data, error } = await supabase
          .from("user_profiles")
          .select("id")
          .ilike("username", escapeLikePattern(usernameToCheck))
          .limit(1)
          .maybeSingle();

        if (error) throw error;
        if (usernameToCheck !== username.trim()) return;

        setIsAvailable(!data);
        setErrorMessage(data ? t("onboarding.username.taken") : "");
      } catch (error) {
        if (usernameToCheck !== username.trim()) return;
        console.error("[Username] Failed to check username availability", error);
        setIsAvailable(false);
        setErrorMessage(t("onboarding.username.checkFailed"));
      } finally {
        if (usernameToCheck === username.trim()) {
          setIsChecking(false);
        }
      }
    }, 550);

    return () => clearTimeout(timeout);
  }, [normalizedUsername, t, username]);

  const handleContinue = async () => {
    if (!canContinue) return;
    await AsyncStorage.setItem("@hylift_username", normalizedUsername);
    router.push("/get-started/goal");
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
        <SignupProgress current={1} total={TOTAL_STEPS} />

        <Text style={styles.title}>{t("onboarding.username.title")}</Text>

        <View style={styles.inputWrap}>
          <Text style={styles.label}>{t("onboarding.username.label")}</Text>
          <View
            style={[
              styles.inputBox,
              {
                borderColor: errorMessage
                  ? "#EF4444"
                  : username.length > 0
                    ? theme.primary.main + "60"
                    : "#DDE3EA",
              },
            ]}
          >
            <TextInput
              value={username}
              onChangeText={setUsername}
              placeholder={t("onboarding.username.placeholder")}
              placeholderTextColor="#4A5568"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={20}
              style={styles.input}
            />
            <View style={styles.statusIcon}>
              {isChecking ? (
                <Ionicons name="sync" size={20} color="#64748B" />
              ) : errorMessage ? (
                <Ionicons name="close-circle" size={20} color="#EF4444" />
              ) : isAvailable ? (
                <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
              ) : (
                <Ionicons name="shield-checkmark-outline" size={20} color="#94A3B8" />
              )}
            </View>
          </View>
          {errorMessage ? (
            <Text style={styles.errorText}>{errorMessage}</Text>
          ) : null}
        </View>
      </Animated.View>

      <ChipButton
        threeD
        title={
          isChecking
            ? t("onboarding.username.checking")
            : t("common.continue")
        }
        onPress={handleContinue}
        variant="primary"
        size="lg"
        fullWidth
        disabled={!canContinue}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 26,
    fontFamily: FONTS.bold,
    color: "#111827",
    marginBottom: 28,
  },
  inputWrap: {
    marginTop: 12,
  },
  label: {
    fontSize: 13,
    fontFamily: FONTS.semiBold,
    color: "#111827",
    marginBottom: 8,
  },
  inputBox: {
    alignItems: "center",
    backgroundColor: "#F6F8FA",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 50,
    paddingLeft: 14,
    paddingRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#111827",
    fontFamily: FONTS.medium,
    paddingVertical: 14,
  },
  statusIcon: {
    alignItems: "center",
    height: 24,
    justifyContent: "center",
    marginLeft: 10,
    width: 24,
  },
  errorText: {
    color: "#EF4444",
    fontSize: 12,
    marginTop: 8,
  },
});

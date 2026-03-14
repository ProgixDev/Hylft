import { useRouter } from "expo-router";
import React, { useState } from "react";
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
import { useTranslation } from "react-i18next";
import { Theme } from "../../constants/themes";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";

import { FONTS } from "../../constants/fonts";
import ChipButton from "../../components/ui/ChipButton";

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background.dark,
    },
    logoContainer: {
      alignItems: "center",
      marginBottom: 20,
    },
    logo: {
      width: 120,
      height: 40,
    },
    contentContainer: {
      flex: 1,
      paddingHorizontal: 32,
    },
    title: {
      fontSize: 32,
      fontFamily: FONTS.bold,
      color: theme.foreground.white,
      textAlign: "center",
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: theme.foreground.gray,
      textAlign: "center",
      marginBottom: 32,
    },
    formContainer: {
      flex: 1,
    },
    inputContainer: {
      marginBottom: 20,
    },
    inputLabel: {
      fontSize: 16,
      fontFamily: FONTS.semiBold,
      color: theme.foreground.white,
      marginBottom: 8,
    },
    input: {
      backgroundColor: theme.background.darker,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 16,
      fontSize: 16,
      color: theme.foreground.white,
      borderWidth: 1,
      borderColor: theme.background.accent,
    },
    dividerContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 24,
    },
    divider: {
      flex: 1,
      height: 1,
      backgroundColor: theme.background.accent,
    },
    dividerText: {
      color: theme.foreground.gray,
      fontSize: 14,
      marginHorizontal: 16,
    },
    signInButton: {
      alignItems: "center",
      paddingVertical: 16,
    },
    signInButtonText: {
      color: theme.primary.main,
      fontSize: 16,
      fontFamily: FONTS.semiBold,
    },
  });
}

export default function SignUp() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const styles = createStyles(theme);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const { signUp } = useAuth();

  const handleSignUp = async () => {
    if (!username || !email || !password || !confirmPassword) {
      Alert.alert(t("auth.error"), t("auth.fillAllFields"));
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert(t("auth.error"), t("signup.validEmail"));
      return;
    }

    if (password.length < 6) {
      Alert.alert(t("auth.error"), t("signup.passwordLength"));
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(t("auth.error"), t("signup.passwordsDoNotMatch"));
      return;
    }

    setIsLoading(true);
    try {
      await signUp(email, password, username);
      router.navigate("/get-started/units");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Sign up failed";
      Alert.alert(t("auth.error"), message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = () => {
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image source={theme.logo} style={styles.logo} resizeMode="contain" />
        </View>

        <View style={styles.contentContainer}>
          <Text style={styles.title}>{t("signup.createAccount")}</Text>
          <Text style={styles.subtitle}>
            {t("signup.signUpToStart")}
          </Text>

          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t("signup.username")}</Text>
              <TextInput
                style={styles.input}
                placeholder={t("signup.chooseUsername")}
                placeholderTextColor={theme.foreground.gray}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t("auth.email")}</Text>
              <TextInput
                style={styles.input}
                placeholder={t("auth.enterEmail")}
                placeholderTextColor={theme.foreground.gray}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t("auth.password")}</Text>
              <TextInput
                style={styles.input}
                placeholder={t("signup.createPassword")}
                placeholderTextColor={theme.foreground.gray}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t("signup.confirmPassword")}</Text>
              <TextInput
                style={styles.input}
                placeholder={t("signup.confirmYourPassword")}
                placeholderTextColor={theme.foreground.gray}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={{ marginBottom: 24, marginTop: 8 }}>
              <ChipButton
                title={isLoading ? t("signup.creatingAccount") : t("signup.signUp")}
                onPress={handleSignUp}
                variant="primary"
                size="lg"
                fullWidth
                disabled={isLoading}
                loading={isLoading}
              />
            </View>

            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>{t("common.or")}</Text>
              <View style={styles.divider} />
            </View>

            <TouchableOpacity
              style={styles.signInButton}
              onPress={handleSignIn}
              activeOpacity={0.7}
            >
              <Text style={styles.signInButtonText}>
                {t("signup.alreadyHaveAccountSignIn")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

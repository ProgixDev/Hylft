import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
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
      marginBottom: 24,
    },
    logo: {
      width: 100,
      height: 34,
    },
    contentContainer: {
      flex: 1,
      paddingHorizontal: 28,
      paddingTop: 12,
    },
    title: {
      fontSize: 26,
      fontFamily: FONTS.bold,
      color: theme.foreground.white,
      textAlign: "center",
      marginBottom: 6,
    },
    subtitle: {
      fontSize: 14,
      color: theme.foreground.gray,
      textAlign: "center",
      marginBottom: 28,
    },
    formContainer: {
      flex: 1,
    },
    inputContainer: {
      marginBottom: 14,
    },
    inputLabel: {
      fontSize: 14,
      fontFamily: FONTS.semiBold,
      color: theme.foreground.white,
      marginBottom: 6,
    },
    input: {
      backgroundColor: theme.background.darker,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 14,
      color: theme.foreground.white,
      borderWidth: 1,
      borderColor: theme.background.accent,
    },
    forgotPasswordButton: {
      alignSelf: "flex-end",
      marginBottom: 22,
    },
    forgotPasswordText: {
      color: theme.primary.main,
      fontSize: 13,
      fontFamily: FONTS.semiBold,
    },
    dividerContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 16,
    },
    divider: {
      flex: 1,
      height: 1,
      backgroundColor: theme.background.accent,
    },
    dividerText: {
      color: theme.foreground.gray,
      fontSize: 13,
      marginHorizontal: 12,
    },
    signUpButton: {
      alignItems: "center",
      paddingVertical: 10,
    },
    signUpButtonText: {
      color: theme.primary.main,
      fontSize: 14,
      fontFamily: FONTS.semiBold,
    },
  });
}

export default function SignIn() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const styles = createStyles(theme);

  const { signIn, setOnboardingCompleted, hasCompletedGetStarted } = useAuth();

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert(t("auth.error"), t("auth.fillAllFields"));
      return;
    }

    setIsLoading(true);
    try {
      await signIn(email, password);
      await setOnboardingCompleted();
      const doneGetStarted = await hasCompletedGetStarted();
      router.replace(doneGetStarted ? "/(tabs)/home" : "/get-started/username");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Sign in failed";
      Alert.alert(t("auth.error"), message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = () => {
    router.navigate("/get-started/username");
  };

  const handleForgotPassword = () => {
    Alert.alert(t("auth.forgotPassword"), t("auth.passwordResetComingSoon"));
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Image source={theme.logo} style={styles.logo} resizeMode="contain" />
      </View>

      <View style={styles.contentContainer}>
        <Text style={styles.title}>{t("auth.welcomeBack")}</Text>
        <Text style={styles.subtitle}>
          {t("auth.signInToContinue")}
        </Text>

        <View style={styles.formContainer}>
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
              placeholder={t("auth.enterPassword")}
              placeholderTextColor={theme.foreground.gray}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <TouchableOpacity
            style={styles.forgotPasswordButton}
            onPress={handleForgotPassword}
          >
            <Text style={styles.forgotPasswordText}>{t("auth.forgotPassword")}</Text>
          </TouchableOpacity>

          <View style={{ marginBottom: 18 }}>
            <ChipButton
              title={isLoading ? t("auth.signingIn") : t("auth.signIn")}
              onPress={handleSignIn}
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
            style={styles.signUpButton}
            onPress={handleSignUp}
            activeOpacity={0.7}
          >
            <Text style={styles.signUpButtonText}>{t("auth.createNewAccount")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

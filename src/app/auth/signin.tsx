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
import { auth } from "../../utils/auth";

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
      marginBottom: 40,
    },
    logo: {
      width: 120,
      height: 40,
    },
    contentContainer: {
      flex: 1,
      paddingHorizontal: 32,
      paddingTop: 20,
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
      marginBottom: 40,
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
    forgotPasswordButton: {
      alignSelf: "flex-end",
      marginBottom: 32,
    },
    forgotPasswordText: {
      color: theme.primary.main,
      fontSize: 14,
      fontFamily: FONTS.semiBold,
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
    signUpButton: {
      alignItems: "center",
      paddingVertical: 16,
    },
    signUpButtonText: {
      color: theme.primary.main,
      fontSize: 16,
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

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert(t("auth.error"), t("auth.fillAllFields"));
      return;
    }

    setIsLoading(true);

    // Simulate API call
    setTimeout(async () => {
      // Save the logged in state
      await auth.setLoggedIn();

      setIsLoading(false);
      // Navigate to schedule after successful login
      router.navigate("/(tabs)/schedule");
    }, 1500);
  };

  const handleSignUp = () => {
    router.navigate("/auth/signup");
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

          <View style={{ marginBottom: 24 }}>
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

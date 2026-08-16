import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Text } from "../../components/ui/ScaledText";
import { useTranslation } from "react-i18next";
import { Theme } from "../../constants/themes";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";

import { FONTS } from "../../constants/fonts";
import ChipButton from "../../components/ui/ChipButton";
import { supabase } from "../../services/supabase";

/* ── Custom modal ── */
type ModalConfig = {
  visible: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
  onDismiss: () => void;
};

function AppDialog({ config }: { config: ModalConfig }) {
  return (
    <Modal
      visible={config.visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={config.onDismiss}
    >
      <View style={md.backdrop}>
        <View style={md.card}>
          <View style={md.iconWrap}>
            <Ionicons name={config.icon} size={32} color="#102b4a" />
          </View>
          <Text style={md.title}>{config.title}</Text>
          <Text style={md.message}>{config.message}</Text>
          <TouchableOpacity
            style={md.btn}
            onPress={config.onDismiss}
            activeOpacity={0.85}
          >
            <Text style={md.btnText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const md = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  card: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: "#EEF0F5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  title: {
    fontSize: 20,
    fontFamily: FONTS.extraBold,
    color: "#102b4a",
    textAlign: "center",
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 24,
  },
  btn: {
    width: "100%",
    backgroundColor: "#102b4a",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  btnText: {
    fontSize: 15,
    fontFamily: FONTS.bold,
    color: "#FFFFFF",
  },
});

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#F8F9FC",
    },
    scrollContent: {
      flexGrow: 1,
    },
    logoContainer: {
      alignItems: "center",
      marginBottom: 14,
    },
    logo: {
      width: 100,
      height: 34,
    },
    contentContainer: {
      flex: 1,
      paddingHorizontal: 28,
    },
    title: {
      fontSize: 26,
      fontFamily: FONTS.bold,
      color: "#102b4a",
      textAlign: "center",
      marginBottom: 6,
    },
    subtitle: {
      fontSize: 14,
      color: "#6B7280",
      textAlign: "center",
      marginBottom: 22,
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
      color: "#102b4a",
      marginBottom: 6,
    },
    input: {
      backgroundColor: "#FFFFFF",
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 14,
      fontSize: 14,
      color: "#102b4a",
      borderWidth: 1,
      borderColor: "#E5E7EB",
      fontFamily: FONTS.medium,
    },
    dividerContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 16,
    },
    divider: {
      flex: 1,
      height: 1,
      backgroundColor: "#E5E7EB",
    },
    dividerText: {
      color: "#6B7280",
      fontSize: 13,
      marginHorizontal: 12,
    },
    signInButton: {
      alignItems: "center",
      paddingVertical: 10,
    },
    signInButtonText: {
      color: theme.primary.main,
      fontSize: 14,
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
  const [modal, setModal] = useState<ModalConfig>({
    visible: false,
    icon: "alert-circle-outline",
    title: "",
    message: "",
    onDismiss: () => {},
  });
  const router = useRouter();

  const styles = createStyles(theme);

  const showModal = (
    icon: keyof typeof Ionicons.glyphMap,
    title: string,
    message: string,
    onDismiss?: () => void,
  ) =>
    setModal({
      visible: true,
      icon,
      title,
      message,
      onDismiss: onDismiss ?? dismissModal,
    });

  const dismissModal = () =>
    setModal((prev) => ({ ...prev, visible: false }));

  const validateEmail = (em: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(em);
  };

  const { signUp, setOnboardingCompleted, setGetStartedCompleted } = useAuth();

  const handleSignUp = async () => {
    if (!username || !email || !password || !confirmPassword) {
      showModal("alert-circle-outline", t("auth.error"), t("auth.fillAllFields"));
      return;
    }

    if (!validateEmail(email)) {
      showModal("alert-circle-outline", t("auth.error"), t("signup.validEmail"));
      return;
    }

    if (password.length < 6) {
      showModal("alert-circle-outline", t("auth.error"), t("signup.passwordLength"));
      return;
    }

    if (password !== confirmPassword) {
      showModal("alert-circle-outline", t("auth.error"), t("signup.passwordsDoNotMatch"));
      return;
    }

    setIsLoading(true);
    try {
      const createdUser = await signUp(email, password, username);
      if (!createdUser?.id) {
        throw new Error("We could not create your account. Please try again.");
      }
      await setOnboardingCompleted();
      try {
        await setGetStartedCompleted(createdUser.id);
      } catch {
        // Ignore profile sync timing issues and keep the auth flow moving.
      }
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        showModal(
          "mail-outline",
          "Check your email",
          "Your account was created. Verify your email, then sign in to continue.",
          () => {
            dismissModal();
            router.replace("/auth/signin");
          },
        );
        return;
      }
      router.replace("/(tabs)/home");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Sign up failed";

      let displayMessage = message;
      if (message.toLowerCase().includes("user already registered")) {
        displayMessage = t("auth.userAlreadyRegistered");
      }

      showModal("alert-circle-outline", t("auth.error"), displayMessage);
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
      <AppDialog config={modal} />

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
                placeholderTextColor="#9CA3AF"
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
                placeholderTextColor="#9CA3AF"
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
                placeholderTextColor="#9CA3AF"
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
                placeholderTextColor="#9CA3AF"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={{ marginBottom: 18, marginTop: 6 }}>
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

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
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
      justifyContent: "center",
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
      marginBottom: 28,
    },
    formContainer: {
      flexGrow: 0,
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
    passwordRow: {
      position: "relative",
      justifyContent: "center",
    },
    eyeBtn: {
      position: "absolute",
      right: 14,
      height: "100%",
      justifyContent: "center",
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
      backgroundColor: "#E5E7EB",
    },
    dividerText: {
      color: "#6B7280",
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
    inlineBanner: {
      backgroundColor: "#FFF7ED",
      borderLeftWidth: 3,
      borderLeftColor: "#F59E0B",
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 14,
      marginBottom: 16,
    },
    inlineBannerText: {
      color: "#B45309",
      fontSize: 13,
      fontFamily: FONTS.medium,
      lineHeight: 19,
    },
  });
}

export default function SignIn() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalConfig>({
    visible: false,
    icon: "alert-circle-outline",
    title: "",
    message: "",
    onDismiss: () => {},
  });
  const router = useRouter();

  const styles = createStyles(theme);

  const { signIn, setOnboardingCompleted, hasCompletedGetStarted } = useAuth();

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

  const handleSignIn = async () => {
    setInlineError(null);

    if (!email || !password) {
      showModal("alert-circle-outline", t("auth.error"), t("auth.fillAllFields"));
      return;
    }

    setIsLoading(true);
    try {
      const signedInUser = await signIn(email, password);
      await setOnboardingCompleted();
      const doneGetStarted = await hasCompletedGetStarted(signedInUser?.id);
      router.replace(doneGetStarted ? "/(tabs)/home" : "/get-started/username");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Sign in failed";

      let displayMessage = message;
      if (message.toLowerCase().includes("invalid login credentials")) {
        displayMessage = t("auth.invalidLoginCredentials");
      } else if (message.toLowerCase().includes("email not confirmed")) {
        displayMessage = t("auth.emailNotConfirmed");
      }

      if (displayMessage === t("auth.emailNotConfirmed")) {
        setInlineError(displayMessage);
      } else {
        showModal("alert-circle-outline", t("auth.error"), displayMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = () => {
    router.navigate("/get-started/username");
  };

  const handleForgotPassword = () => {
    showModal("mail-outline", t("auth.forgotPassword"), t("auth.passwordResetComingSoon"));
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <AppDialog config={modal} />

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
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, { paddingRight: 46 }]}
                placeholder={t("auth.enterPassword")}
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPassword((v) => !v)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#9CA3AF"
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={styles.forgotPasswordButton}
            onPress={handleForgotPassword}
          >
            <Text style={styles.forgotPasswordText}>{t("auth.forgotPassword")}</Text>
          </TouchableOpacity>

          {inlineError && (
            <View style={styles.inlineBanner}>
              <Text style={styles.inlineBannerText}>{inlineError}</Text>
            </View>
          )}

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

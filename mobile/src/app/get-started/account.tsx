import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Animated,
    Easing,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { Text } from "../../components/ui/ScaledText";
import ChipButton from "../../components/ui/ChipButton";
import { SignupProgress } from "../../components/ui/SignupProgress";
import { FONTS } from "../../constants/fonts";
import { Theme } from "../../constants/themes";
import {
  APP_TUTORIAL_PENDING_KEY,
  userTutorialStorageKey,
} from "../../constants/tutorial";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
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
      <View style={d.backdrop}>
        <View style={d.card}>
          <View style={d.iconWrap}>
            <Ionicons name={config.icon} size={32} color="#102b4a" />
          </View>
          <Text style={d.title}>{config.title}</Text>
          <Text style={d.message}>{config.message}</Text>
          <TouchableOpacity
            style={d.btn}
            onPress={config.onDismiss}
            activeOpacity={0.85}
          >
            <Text style={d.btnText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const d = StyleSheet.create({
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
    borderRadius: 8,
    padding: 28,
    alignItems: "center",
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 16,
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
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  btnText: {
    fontSize: 15,
    fontFamily: FONTS.bold,
    color: "#FFFFFF",
  },
});

/* ── Screen ── */
export default function AccountScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const { signUp, setGetStartedCompleted, setOnboardingCompleted } = useAuth();
  const isFr = i18n.language?.startsWith("fr");

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<ModalConfig>({
    visible: false,
    icon: "mail-outline",
    title: "",
    message: "",
    onDismiss: () => {},
  });

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
    isEmailValid &&
    password.length >= 6 &&
    agreed &&
    !loading &&
    username.length >= 2;

  const withFallback = (
    key: string,
    enText: string,
    frText: string,
    options?: Record<string, unknown>,
  ) => {
    const value = t(key, options);
    return value === key ? (isFr ? frText : enText) : value;
  };

  const showModal = (
    icon: keyof typeof Ionicons.glyphMap,
    title: string,
    message: string,
    onDismiss: () => void,
  ) => setModal({ visible: true, icon, title, message, onDismiss });

  const dismissModal = () =>
    setModal((prev) => ({ ...prev, visible: false }));

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      const createdUser = await signUp(email, password, username);
      if (!createdUser?.id) {
        throw new Error(
          withFallback(
            "onboarding.account.signUpFailed",
            "We could not create your account. Please try again.",
            "Nous n'avons pas pu creer votre compte. Veuillez reessayer.",
          ),
        );
      }
      await AsyncStorage.setItem(
        userTutorialStorageKey(APP_TUTORIAL_PENDING_KEY, createdUser.id),
        "true",
      );
      await setOnboardingCompleted();
      try {
        await setGetStartedCompleted(createdUser.id);
      } catch {
        // Keep navigation moving even if profile completion sync lags behind auth.
      }
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        showModal(
          "mail-outline",
          withFallback(
            "onboarding.account.verifyEmailTitle",
            "Check your email",
            "Vérifiez votre email",
          ),
          withFallback(
            "onboarding.account.verifyEmailMessage",
            "Your account was created. Verify your email, then sign in to continue.",
            "Votre compte a été créé. Vérifiez votre email, puis connectez-vous pour continuer.",
          ),
          () => {
            dismissModal();
            router.replace("/auth/signin");
          },
        );
        return;
      }
      router.replace("/(tabs)/home");
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : withFallback(
              "onboarding.account.signUpFailed",
              "Sign up failed",
              "Échec de l'inscription",
            );
      showModal(
        "alert-circle-outline",
        withFallback(
          "onboarding.account.signUpError",
          "Sign up error",
          "Erreur d'inscription",
        ),
        message,
        dismissModal,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <AppDialog config={modal} />

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
          <Text style={styles.title}>
            {username
              ? withFallback(
                  "onboarding.account.titleWithName",
                  `One last step, ${username}`,
                  `Une dernière étape, ${username}`,
                  { name: username },
                )
              : withFallback(
                  "onboarding.account.title",
                  "One last step",
                  "Une dernière étape",
                )}
          </Text>
          <View style={styles.field}>
            <Text style={styles.label}>{t("auth.email")}</Text>
            <TextInput
              style={styles.input}
              placeholder={withFallback(
                "onboarding.account.emailPlaceholder",
                "you@example.com",
                "vous@exemple.com",
              )}
              placeholderTextColor={theme.foreground.gray}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{t("auth.password")}</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, { flex: 1, paddingRight: 44 }]}
                placeholder={withFallback(
                  "onboarding.account.passwordPlaceholder",
                  "At least 6 characters",
                  "Au moins 6 caractères",
                )}
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
              {withFallback(
                "onboarding.account.agreePrefix",
                "I agree to the",
                "J'accepte les",
              )}{" "}
              <Text
                style={{
                  color: theme.primary.main,
                  fontFamily: FONTS.semiBold,
                }}
              >
                {t("settings.termsOfService")}
              </Text>{" "}
              {withFallback("onboarding.account.agreeAnd", "and", "et la")}{" "}
              <Text
                style={{
                  color: theme.primary.main,
                  fontFamily: FONTS.semiBold,
                }}
              >
                {t("settings.privacyPolicy")}
              </Text>
              .
            </Text>
          </Pressable>
        </ScrollView>
      </Animated.View>

      <ChipButton
        threeD
        title={
          loading
            ? withFallback(
                "onboarding.account.creatingAccount",
                "Creating account...",
                "Création du compte...",
              )
            : withFallback(
                "onboarding.account.createAccount",
                "Create account",
                "Créer un compte",
              )
        }
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
      backgroundColor: "#F8F9FC",
      paddingHorizontal: 20,
      paddingBottom: 16,
    },
    title: {
      fontSize: 24,
      fontFamily: FONTS.bold,
      color: "#102b4a",
      marginBottom: 20,
    },
    field: {
      marginBottom: 14,
    },
    label: {
      fontSize: 13,
      fontFamily: FONTS.semiBold,
      color: "#102b4a",
      marginBottom: 8,
    },
    input: {
      backgroundColor: "#FFFFFF",
      borderRadius: 8,
      paddingHorizontal: 14,
      paddingVertical: 14,
      fontSize: 15,
      color: "#102b4a",
      borderWidth: 1,
      borderColor: "#E5E7EB",
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

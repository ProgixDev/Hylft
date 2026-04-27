import { AntDesign, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { supabase } from "../../services/supabase";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ChipButton from "../../components/ui/ChipButton";
import { useTranslation } from "react-i18next";
import { Theme } from "../../constants/themes";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { FONTS } from "../../constants/fonts";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

const ICONS: IconName[] = ["dumbbell", "run-fast", "heart-pulse"];

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.primary.main,
    },
    carouselSection: {
      height: SCREEN_HEIGHT * 0.62,
      backgroundColor: "#FFFFFF",
      borderBottomLeftRadius: 40,
      marginBottom: -30,
      zIndex: 2,
      elevation: 8,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.18,
      shadowRadius: 10,
    },
    iconCircle: {
      width: 130,
      height: 130,
      borderRadius: 65,
      backgroundColor: "rgba(10, 22, 40, 0.07)",
      alignItems: "center",
      justifyContent: "center",
    },
    bottomPanel: {
      flex: 1,
      zIndex: 1,
      paddingHorizontal: 28,
      paddingTop: 46,
    },
    dotsRow: {
      flexDirection: "row",
      justifyContent: "center",
      gap: 6,
      marginBottom: 16,
    },
    title: {
      fontSize: 22,
      fontFamily: FONTS.bold,
      color: "#FFFFFF",
      textAlign: "center",
      marginBottom: 20,
    },
    buttonGap: {
      marginBottom: 10,
    },
    signInContainer: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      marginTop: 12,
    },
    signInText: {
      color: "rgba(255,255,255,0.8)",
      fontSize: 13,
    },
    signInLink: {
      color: "#FFFFFF",
      fontSize: 13,
      fontFamily: FONTS.semiBold,
    },
  });
}

export default function AuthLanding() {
  const { t } = useTranslation();
  const router = useRouter();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const styles = createStyles(theme);

  useEffect(() => {
    const interval = setInterval(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 350, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 0.65, duration: 350, useNativeDriver: true }),
      ]).start(() => {
        setCurrentIndex((prev) => (prev + 1) % ICONS.length);
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            damping: 12,
            stiffness: 160,
          }),
        ]).start();
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [fadeAnim, scaleAnim]);

  const { user, signInWithGoogle, setOnboardingCompleted, hasCompletedGetStarted } = useAuth();
  const hasNavigated = useRef(false);

  // Android/Expo Go: Chrome Custom Tabs redirects to exp://... which it can't load
  // as a webpage, so the deep link fires separately via Linking. Catch it here,
  // extract the tokens, and set the session manually.
  useEffect(() => {
    const processUrl = (url: string) => {
      const hash = url.includes("#") ? url.split("#")[1] : "";
      const params = new URLSearchParams(hash);
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");
      if (!accessToken || !refreshToken) return;
      supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
    };

    Linking.getInitialURL().then((url) => { if (url) processUrl(url); });
    const subscription = Linking.addEventListener("url", ({ url }) => processUrl(url));
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!user || hasNavigated.current) return;
    hasNavigated.current = true;
    void (async () => {
      await setOnboardingCompleted();
      const doneGetStarted = await hasCompletedGetStarted(user.id);
      router.replace(doneGetStarted ? "/(tabs)/home" : "/get-started/username");
    })();
  }, [hasCompletedGetStarted, router, setOnboardingCompleted, user]);

  const handleEmailSignUp = () => router.navigate("/get-started/username");

  const handleGoogleSignUp = async () => {
    try {
      await signInWithGoogle();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Google sign in failed";
      Alert.alert("Error", message);
    }
  };

  const handleSignIn = () => router.navigate("/auth/signin");

  return (
    <View style={styles.container}>
      {/* Carousel — white card, rounded bottom, floats above panel */}
      <View style={[styles.carouselSection, { paddingTop: insets.top }]}>
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons
              name={ICONS[currentIndex]}
              size={68}
              color={theme.primary.main}
            />
          </View>
        </Animated.View>
      </View>

      {/* Bottom panel — sits behind carousel */}
      <View style={[styles.bottomPanel, { paddingBottom: insets.bottom + 12 }]}>
        {/* Dots synced with icon index */}
        <View style={styles.dotsRow}>
          {ICONS.map((_, i) => (
            <View
              key={i}
              style={{
                width: i === currentIndex ? 24 : 8,
                height: 8,
                borderRadius: 4,
                backgroundColor:
                  i === currentIndex ? "#FFFFFF" : "rgba(255,255,255,0.35)",
              }}
            />
          ))}
        </View>

        <Text style={styles.title}>{t("auth.signUpToGetStarted")}</Text>

        <View style={styles.buttonGap}>
          <ChipButton
            title={t("auth.continueWithGoogle")}
            onPress={handleGoogleSignUp}
            variant="white"
            size="lg"
            fullWidth
            icon={<AntDesign name="google" size={20} color={theme.primary.main} />}
          />
        </View>

        <View style={styles.buttonGap}>
          <ChipButton
            title={t("auth.continueWithEmail")}
            onPress={handleEmailSignUp}
            variant="white"
            size="lg"
            fullWidth
            icon={<MaterialIcons name="email" size={20} color={theme.primary.main} />}
          />
        </View>

        <View style={styles.signInContainer}>
          <Text style={styles.signInText}>{t("auth.alreadyHaveAccount")}</Text>
          <TouchableOpacity onPress={handleSignIn} activeOpacity={0.7}>
            <Text style={styles.signInLink}>{t("auth.logIn")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

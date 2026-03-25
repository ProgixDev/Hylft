import { AntDesign, MaterialIcons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { supabase } from "../../services/supabase";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ChipButton from "../../components/ui/ChipButton";
import { useTranslation } from "react-i18next";
import { Theme } from "../../constants/themes";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";

import { FONTS } from "../../constants/fonts";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const BACKGROUND_IMAGES = [
  require("../../../assets/images/AuthPage/DeadLiftIGuess.jpg"),
  require("../../../assets/images/AuthPage/HoldingTwoWeights.jpg"),
  require("../../../assets/images/AuthPage/OneKneeOnTheGround.jpg"),
  require("../../../assets/images/AuthPage/PullUp.jpg"),
];

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#000000",
    },
    backgroundImage: {
      position: "absolute",
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT,
    },
    overlay: {
      position: "absolute",
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    content: {
      flex: 1,
      justifyContent: "space-between",
      paddingVertical: 30,
    },
    logoContainer: {
      alignItems: "center",
      marginTop: 14,
    },
    logo: {
      width: 120,
      height: 42,
    },
    bottomSection: {
      paddingHorizontal: 28,
      paddingBottom: 16,
    },
    title: {
      fontSize: 24,
      fontFamily: FONTS.bold,
      color: "#FFFFFF",
      textAlign: "center",
      marginBottom: 24,
    },
    signInContainer: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
    },
    signInText: {
      color: "#FFFFFF",
      fontSize: 13,
    },
    signInLink: {
      color: theme.primary.main,
      fontSize: 13,
      fontFamily: FONTS.semiBold,
    },
  });
}

export default function AuthLanding() {
  const { t } = useTranslation();
  const router = useRouter();
  const { theme } = useTheme();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const styles = createStyles(theme);

  useEffect(() => {
    const interval = setInterval(() => {
      // Fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        // Change image
        setCurrentImageIndex((prev) => (prev + 1) % BACKGROUND_IMAGES.length);

        // Fade in
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      });
    }, 4000); // Change image every 4 seconds

    return () => clearInterval(interval);
  }, [fadeAnim]);

  const { user, signIn, signInWithGoogle, hasCompletedGetStarted } = useAuth();
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

    // Handle URL if app was opened from cold start via deep link
    Linking.getInitialURL().then((url) => { if (url) processUrl(url); });

    // Handle URL if app was already running and receives a deep link
    const subscription = Linking.addEventListener("url", ({ url }) => processUrl(url));
    return () => subscription.remove();
  }, []);

  // Navigate as soon as a session is established (covers both iOS direct redirect
  // and Android deep link path)
  useEffect(() => {
    if (!user || hasNavigated.current) return;
    hasNavigated.current = true;
    hasCompletedGetStarted(user.id).then((done) => {
      router.navigate(done ? "/(tabs)/home" : "/get-started/gender");
    });
  }, [user]);

  const handleEmailSignUp = () => {
    router.navigate("/auth/signup");
  };

  const handleGoogleSignUp = async () => {
    try {
      await signInWithGoogle();
      // Navigation is handled by the user state watcher above
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Google sign in failed";
      Alert.alert("Error", message);
    }
  };

  const handleSignIn = async () => {
    try {
      await signIn("mohameddn988@gmail.com", "mohamed2003");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Auto sign in failed";
      Alert.alert("Error", message);
    }
  };

  return (
    <View style={styles.container}>
      {/* Background Image with fade animation */}
      <Animated.Image
        source={BACKGROUND_IMAGES[currentImageIndex]}
        style={[styles.backgroundImage, { opacity: fadeAnim }]}
        resizeMode="cover"
      />

      {/* Overlay */}
      <View style={styles.overlay} />

      {/* Content */}
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image source={theme.logo} style={styles.logo} resizeMode="contain" />
        </View>

        {/* Bottom Section */}
        <View style={styles.bottomSection}>
          <Text style={styles.title}>{t("auth.signUpToGetStarted")}</Text>

          {/* Google Sign Up Button */}
          <View style={{ marginBottom: 12 }}>
            <ChipButton
              title={t("auth.continueWithGoogle")}
              onPress={handleGoogleSignUp}
              variant="primary"
              size="lg"
              fullWidth
              icon={
                <AntDesign
                  name="google"
                  size={20}
                  color={theme.background.dark}
                />
              }
            />
          </View>

          {/* Email Sign Up Button */}
          <View style={{ marginBottom: 18 }}>
            <ChipButton
              title={t("auth.continueWithEmail")}
              onPress={handleEmailSignUp}
              variant="secondary"
              size="lg"
              fullWidth
              icon={
                <MaterialIcons
                  name="email"
                  size={20}
                  color={theme.primary.main}
                />
              }
            />
          </View>

          {/* Sign In Link */}
          <View style={styles.signInContainer}>
            <Text style={styles.signInText}>{t("auth.alreadyHaveAccount")}</Text>
            <TouchableOpacity onPress={handleSignIn} activeOpacity={0.7}>
              <Text style={styles.signInLink}>{t("auth.logIn")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

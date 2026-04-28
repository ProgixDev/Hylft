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
  ImageSourcePropType,
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

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

type CarouselSlide =
  | { type: "image"; source: ImageSourcePropType }
  | { type: "icon"; name: IconName };

const CAROUSEL_SLIDES: CarouselSlide[] = [
  { type: "image", source: require("../../../assets/images/poster1.png") },
  { type: "image", source: require("../../../assets/images/poster2.png") },
  { type: "image", source: require("../../../assets/images/poster3.png") },
];

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
    posterImage: {
      width: "100%",
      height: "100%",
    },
    bottomPanel: {
      flex: 1,
      zIndex: 3,
      elevation: 12,
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
  const translateAnim = useRef(new Animated.Value(0)).current;

  const styles = createStyles(theme);

  useEffect(() => {
    const interval = setInterval(() => {
      // slide current content left off-screen
      Animated.timing(translateAnim, {
        toValue: -SCREEN_WIDTH,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        // advance index, jump next slide off-screen to the right, then slide into place
        setCurrentIndex((prev) => (prev + 1) % CAROUSEL_SLIDES.length);
        translateAnim.setValue(SCREEN_WIDTH);
        Animated.timing(translateAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }).start();
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [translateAnim]);

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
            transform: [{ translateX: translateAnim }],
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
          }}
        >
          <Image
            source={CAROUSEL_SLIDES[currentIndex].source}
            style={styles.posterImage}
            resizeMode="cover"
          />
        </Animated.View>
      </View>

      {/* Bottom panel — sits behind carousel */}
      <View style={[styles.bottomPanel, { paddingBottom: insets.bottom + 12 }]}>
        {/* Dots synced with icon index */}
        <View style={styles.dotsRow}>
          {CAROUSEL_SLIDES.map((_, i) => (
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

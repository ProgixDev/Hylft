import { AntDesign, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  ImageSourcePropType,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FONTS } from "../../constants/fonts";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../services/supabase";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");
const CAROUSEL_HEIGHT = SCREEN_HEIGHT * 0.62;
const PANEL_OVERLAP = 30;
const CAROUSEL_CORNER_RADIUS = 40;

const CAROUSEL_SLIDES: { type: "image"; source: ImageSourcePropType }[] = [
  { type: "image", source: require("../../../assets/images/poster1.png") },
  { type: "image", source: require("../../../assets/images/poster2.png") },
  { type: "image", source: require("../../../assets/images/poster3.png") },
];

const AUTH_GRADIENT = ["#06101F", "#0E2B57", "#364152"] as const;
const GOOGLE_BLUE = "#1A73E8";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Auth3DButtonProps = {
  title: string;
  onPress: () => void;
  icon: React.ReactNode;
  iconPosition?: "left" | "right";
  faceColor: string;
  depthColor: string;
  textColor: string;
};

function Auth3DButton({
  title,
  onPress,
  icon,
  iconPosition = "left",
  faceColor,
  depthColor,
  textColor,
}: Auth3DButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const pressDepth = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 0.99,
        speed: 40,
        bounciness: 0,
        useNativeDriver: true,
      }),
      Animated.spring(pressDepth, {
        toValue: 8,
        speed: 40,
        bounciness: 0,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        speed: 28,
        bounciness: 6,
        useNativeDriver: true,
      }),
      Animated.spring(pressDepth, {
        toValue: 0,
        speed: 26,
        bounciness: 6,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      hitSlop={6}
      android_ripple={{ color: "rgba(255,255,255,0.14)" }}
      style={[authButtonStyles.buttonShell, { transform: [{ scale }] }]}
    >
      <View
        style={[authButtonStyles.buttonBase, { backgroundColor: depthColor }]}
      >
        <Animated.View
          style={[
            authButtonStyles.buttonFace,
            {
              backgroundColor: faceColor,
              transform: [{ translateY: pressDepth }],
            },
          ]}
        >
          {iconPosition === "left" && (
            <View style={authButtonStyles.iconLeft}>{icon}</View>
          )}
          <Text
            style={[authButtonStyles.buttonText, { color: textColor }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.86}
          >
            {title}
          </Text>
          {iconPosition === "right" && (
            <View style={authButtonStyles.iconRight}>{icon}</View>
          )}
        </Animated.View>
      </View>
    </AnimatedPressable>
  );
}

function createStyles() {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    colorVeil: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(125,175,255,0.08)",
    },
    diagonalBeam: {
      position: "absolute",
      left: -SCREEN_WIDTH * 0.2,
      right: -SCREEN_WIDTH * 0.2,
      bottom: SCREEN_HEIGHT * 0.23,
      height: 76,
      backgroundColor: "rgba(86,148,255,0.18)",
      transform: [{ rotate: "-8deg" }],
    },
    carouselSection: {
      position: "relative",
      height: CAROUSEL_HEIGHT,
      backgroundColor: "#FFFFFF",
      borderBottomLeftRadius: CAROUSEL_CORNER_RADIUS,
      marginBottom: -PANEL_OVERLAP,
      zIndex: 1,
      elevation: 8,
      overflow: "hidden",
      alignItems: "flex-start",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.18,
      shadowRadius: 10,
    },
    posterImage: {
      width: SCREEN_WIDTH,
      height: "100%",
    },
    bottomPanel: {
      position: "relative",
      flex: 1,
      zIndex: 20,
      elevation: 20,
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
      fontSize: 24,
      lineHeight: 31,
      fontFamily: FONTS.extraBold,
      color: "#FFFFFF",
      textAlign: "center",
      marginBottom: 22,
    },
    buttonGap: {
      marginBottom: 13,
    },
    signInContainer: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      marginTop: 12,
    },
    signInText: {
      color: "rgba(255,255,255,0.78)",
      fontSize: 13,
    },
    signInLink: {
      color: "#9EC5FF",
      fontSize: 13,
      fontFamily: FONTS.semiBold,
    },
  });
}

const authButtonStyles = StyleSheet.create({
  buttonShell: {
    width: "100%",
    borderRadius: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#06100D",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.22,
        shadowRadius: 16,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  buttonBase: {
    borderRadius: 20,
    paddingBottom: 9,
    overflow: "hidden",
  },
  buttonFace: {
    minHeight: 58,
    borderRadius: 20,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
  },
  iconLeft: {
    width: 30,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  iconRight: {
    width: 30,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  buttonText: {
    flexShrink: 1,
    fontSize: 16,
    lineHeight: 20,
    fontFamily: FONTS.extraBold,
    textAlign: "center",
  },
});

export default function AuthLanding() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const translateAnim = useRef(new Animated.Value(0)).current;

  const styles = createStyles();
  const nextIndex = (currentIndex + 1) % CAROUSEL_SLIDES.length;

  useEffect(() => {
    const interval = setInterval(() => {
      Animated.timing(translateAnim, {
        toValue: -SCREEN_WIDTH,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        setCurrentIndex((prev) => (prev + 1) % CAROUSEL_SLIDES.length);
        translateAnim.setValue(0);
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [translateAnim]);

  const {
    user,
    signInWithGoogle,
    setOnboardingCompleted,
    hasCompletedGetStarted,
  } = useAuth();
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
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
    };

    Linking.getInitialURL().then((url) => {
      if (url) processUrl(url);
    });
    const subscription = Linking.addEventListener("url", ({ url }) =>
      processUrl(url),
    );
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
      const message =
        error instanceof Error ? error.message : "Google sign in failed";
      Alert.alert("Error", message);
    }
  };

  const handleSignIn = () => router.navigate("/auth/signin");

  return (
    <LinearGradient colors={AUTH_GRADIENT} style={styles.container}>
      <View style={styles.colorVeil} pointerEvents="none" />
      <View style={styles.diagonalBeam} pointerEvents="none" />
      {/* Carousel — white card, rounded bottom, floats above panel */}
      <View style={styles.carouselSection}>
        <Animated.View
          style={{
            transform: [{ translateX: translateAnim }],
            flexDirection: "row",
            width: SCREEN_WIDTH * 2,
            height: "100%",
          }}
        >
          <Image
            source={CAROUSEL_SLIDES[currentIndex].source}
            style={styles.posterImage}
            resizeMode="cover"
          />
          <Image
            source={CAROUSEL_SLIDES[nextIndex].source}
            style={styles.posterImage}
            resizeMode="cover"
          />
        </Animated.View>
      </View>

      {/* Bottom panel — content sits above carousel overlap */}
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
          <Auth3DButton
            title={t("auth.continueWithGoogle")}
            onPress={handleGoogleSignUp}
            icon={
              <AntDesign name="google" size={20} color={GOOGLE_BLUE} />
            }
            faceColor="#F5F8FC"
            depthColor="#9AA8BA"
            textColor="#111827"
          />
        </View>

        <View style={styles.buttonGap}>
          <Auth3DButton
            title={t("auth.continueWithEmail")}
            onPress={handleEmailSignUp}
            icon={
              <MaterialIcons name="keyboard-arrow-right" size={28} color="#FFFFFF" />
            }
            iconPosition="right"
            faceColor="#2563EB"
            depthColor="#143B8F"
            textColor="#FFFFFF"
          />
        </View>

        <View style={styles.signInContainer}>
          <Text style={styles.signInText}>{t("auth.alreadyHaveAccount")}</Text>
          <TouchableOpacity onPress={handleSignIn} activeOpacity={0.7}>
            <Text style={styles.signInLink}>{t("auth.logIn")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}

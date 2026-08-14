import { AntDesign, Ionicons, MaterialIcons } from "@expo/vector-icons";
import Svg, { Path } from "react-native-svg";
import { LinearGradient } from "expo-linear-gradient";
import * as Linking from "expo-linking";
import { usePathname, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Animated,
  Dimensions,
  Image,
  ImageSourcePropType,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Text } from "../../components/ui/ScaledText";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FONTS } from "../../constants/fonts";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../services/supabase";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");
const CAROUSEL_HEIGHT = SCREEN_HEIGHT * 0.62;
const PANEL_OVERLAP = 30;
const CAROUSEL_CORNER_RADIUS = 40;

type CarouselSlide = {
  type: "image";
  source: ImageSourcePropType;
  overlay?: string;
};

const EN_CAROUSEL_SLIDES: CarouselSlide[] = [
  {
    type: "image",
    source: require("../../../assets/images/AuthPage/HoldingTwoWeights.jpg"),
    overlay: "rgba(0, 0, 0, 0.54)",
  },
  { type: "image", source: require("../../../assets/images/poster2.png") },
  { type: "image", source: require("../../../assets/images/poster3.png") },
];

const FR_CAROUSEL_SLIDES: CarouselSlide[] = [
  {
    type: "image",
    source: require("../../../assets/images/AuthPage/HoldingTwoWeights.jpg"),
    overlay: "rgba(0, 0, 0, 0.54)",
  },
  { type: "image", source: require("../../../assets/images/poster2_fr.png") },
  { type: "image", source: require("../../../assets/images/poster3_fr.png") },
];

const AUTH_GRADIENT = ["#0F1F44", "#0F1F44", "#0F1F44"] as const;
const GOOGLE_BLUE = "#1A73E8";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function GoogleIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <Path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <Path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <Path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </Svg>
  );
}

type Auth3DButtonProps = {
  title: string;
  onPress: () => void;
  icon?: React.ReactNode;
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
          {icon && iconPosition === "left" && (
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
          {icon && iconPosition === "right" && (
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
      display: "none",
    },
    diagonalBeam: {
      display: "none",
    },
    carouselSection: {
      position: "relative",
      height: CAROUSEL_HEIGHT,
      backgroundColor: "#FFFFFF",
      borderBottomLeftRadius: CAROUSEL_CORNER_RADIUS,
      borderBottomRightRadius: CAROUSEL_CORNER_RADIUS,
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
      paddingHorizontal: 24,
      paddingTop: PANEL_OVERLAP + 12,
      justifyContent: "center",
      alignItems: "center",
    },
    dotsRow: {
      flexDirection: "row",
      justifyContent: "center",
      gap: 8,
      marginBottom: 14,
    },
    title: {
      fontSize: 16,
      lineHeight: 22,
      fontFamily: FONTS.semiBold,
      color: "rgba(255, 255, 255, 0.85)",
      textAlign: "center",
      marginBottom: 20,
    },
    googleBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      backgroundColor: "#FFFFFF",
      borderRadius: 100,
      height: 54,
      width: "100%",
      marginBottom: 12,
    },
    googleBtnText: {
      fontSize: 16,
      fontFamily: FONTS.bold,
      color: "#111827",
    },
    signUpBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#2563EB",
      borderRadius: 100,
      height: 54,
      width: "100%",
      marginBottom: 20,
    },
    signUpBtnText: {
      fontSize: 16,
      fontFamily: FONTS.bold,
      color: "#FFFFFF",
    },
    signInContainer: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: 6,
    },
    signInText: {
      color: "rgba(255, 255, 255, 0.65)",
      fontSize: 14,
      fontFamily: FONTS.medium,
    },
    signInLink: {
      color: "#FFFFFF",
      fontSize: 14,
      fontFamily: FONTS.bold,
    },
  });
}

const authButtonStyles = StyleSheet.create({
  buttonShell: {
    width: "100%",
    borderRadius: 100,
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
    borderRadius: 100,
    paddingBottom: 6,
    overflow: "hidden",
  },
  buttonFace: {
    minHeight: 58,
    borderRadius: 100,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0,
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
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const translateAnim = useRef(new Animated.Value(-SCREEN_WIDTH)).current;
  const isCarouselAnimating = useRef(false);
  const isCarouselDragging = useRef(false);

  const [errorModal, setErrorModal] = useState({ visible: false, message: "" });
  const styles = createStyles();
  const carouselSlides = i18n.language?.startsWith("fr")
    ? FR_CAROUSEL_SLIDES
    : EN_CAROUSEL_SLIDES;
  const prevIndex =
    (currentIndex - 1 + carouselSlides.length) % carouselSlides.length;
  const nextIndex = (currentIndex + 1) % carouselSlides.length;

  const completeCarouselMove = React.useCallback(
    (direction: "next" | "prev") => {
      if (isCarouselAnimating.current || isCarouselDragging.current) return;
      isCarouselAnimating.current = true;

      Animated.timing(translateAnim, {
        toValue: direction === "next" ? -SCREEN_WIDTH * 2 : 0,
        duration: 260,
        useNativeDriver: true,
      }).start(() => {
        setCurrentIndex((prev) =>
          direction === "next"
            ? (prev + 1) % carouselSlides.length
            : (prev - 1 + carouselSlides.length) % carouselSlides.length,
        );
        translateAnim.setValue(-SCREEN_WIDTH);
        isCarouselAnimating.current = false;
      });
    },
    [carouselSlides.length, translateAnim],
  );

  const resetCarouselPosition = React.useCallback(() => {
    Animated.spring(translateAnim, {
      toValue: -SCREEN_WIDTH,
      speed: 22,
      bounciness: 0,
      useNativeDriver: true,
    }).start();
  }, [translateAnim]);

  const carouselPanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_event, gestureState) =>
        Math.abs(gestureState.dx) > 10 &&
        Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
      onPanResponderGrant: () => {
        isCarouselDragging.current = true;
        translateAnim.stopAnimation();
      },
      onPanResponderMove: (_event, gestureState) => {
        if (isCarouselAnimating.current) return;
        const dragOffset = Math.max(
          -SCREEN_WIDTH,
          Math.min(SCREEN_WIDTH, gestureState.dx),
        );
        translateAnim.setValue(-SCREEN_WIDTH + dragOffset);
      },
      onPanResponderRelease: (_event, gestureState) => {
        isCarouselDragging.current = false;
        if (isCarouselAnimating.current) return;
        const shouldSwipe =
          Math.abs(gestureState.dx) > SCREEN_WIDTH * 0.18 ||
          Math.abs(gestureState.vx) > 0.45;

        if (!shouldSwipe) {
          resetCarouselPosition();
          return;
        }

        completeCarouselMove(gestureState.dx < 0 ? "next" : "prev");
      },
      onPanResponderTerminate: () => {
        isCarouselDragging.current = false;
        resetCarouselPosition();
      },
    }),
  ).current;

  useEffect(() => {
    const interval = setInterval(() => {
      completeCarouselMove("next");
    }, 3000);

    return () => clearInterval(interval);
  }, [completeCarouselMove]);

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
    // Only auto-navigate when this screen is active (e.g. Google OAuth
    // redirect). If user logged in from /auth/signin, that screen
    // handles post-login routing — don't race it.
    if (!user || hasNavigated.current) return;
    if (pathname !== "/auth") return;
    hasNavigated.current = true;
    void (async () => {
      await setOnboardingCompleted();
      const doneGetStarted = await hasCompletedGetStarted(user.id);
      router.replace(doneGetStarted ? "/(tabs)/home" : "/get-started/username");
    })();
  }, [hasCompletedGetStarted, pathname, router, setOnboardingCompleted, user]);

  const handleEmailSignUp = () => router.navigate("/get-started/username");

  const handleGoogleSignUp = async () => {
    try {
      await signInWithGoogle();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Google sign in failed";
      setErrorModal({ visible: true, message });
    }
  };

  const handleSignIn = () => router.navigate("/auth/signin");

  return (
    <LinearGradient colors={AUTH_GRADIENT} style={styles.container}>
      <Modal
        visible={errorModal.visible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setErrorModal({ visible: false, message: "" })}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
          <View style={{ width: "100%", backgroundColor: "#FFFFFF", borderRadius: 24, padding: 28, alignItems: "center" }}>
            <View style={{ width: 72, height: 72, borderRadius: 20, backgroundColor: "#EEF0F5", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
              <Ionicons name="alert-circle-outline" size={32} color="#102b4a" />
            </View>
            <Text style={{ fontSize: 20, fontFamily: FONTS.extraBold, color: "#102b4a", textAlign: "center", marginBottom: 8 }}>Error</Text>
            <Text style={{ fontSize: 14, fontFamily: FONTS.medium, color: "#6B7280", textAlign: "center", lineHeight: 21, marginBottom: 24 }}>{errorModal.message}</Text>
            <TouchableOpacity
              style={{ width: "100%", backgroundColor: "#102b4a", borderRadius: 12, paddingVertical: 14, alignItems: "center" }}
              onPress={() => setErrorModal({ visible: false, message: "" })}
              activeOpacity={0.85}
            >
              <Text style={{ fontSize: 15, fontFamily: FONTS.bold, color: "#FFFFFF" }}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.colorVeil} pointerEvents="none" />
      <View style={styles.diagonalBeam} pointerEvents="none" />
      {/* Carousel — white card, rounded bottom, floats above panel */}
      <View style={styles.carouselSection} {...carouselPanResponder.panHandlers}>
        <Animated.View
          style={{
            transform: [{ translateX: translateAnim }],
            flexDirection: "row",
            width: SCREEN_WIDTH * 3,
            height: "100%",
          }}
        >
          {[prevIndex, currentIndex, nextIndex].map((slideIndex, i) => (
            <View key={i} style={{ width: SCREEN_WIDTH, height: "100%", position: "relative" }}>
              <Image
                source={carouselSlides[slideIndex].source}
                style={styles.posterImage}
                resizeMode="cover"
              />
              {carouselSlides[slideIndex].overlay ? (
                <View
                  style={[
                    StyleSheet.absoluteFill,
                    { backgroundColor: carouselSlides[slideIndex].overlay },
                  ]}
                  pointerEvents="none"
                />
              ) : null}
            </View>
          ))}
        </Animated.View>
      </View>

      {/* Bottom panel — content sits above carousel overlap */}
      <View style={[styles.bottomPanel, { paddingBottom: Math.max(insets.bottom + 12, 20) }]}>
        {/* DotsSynced with icon index */}
        <View style={styles.dotsRow}>
          {carouselSlides.map((_, i) => (
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

        {/* Google button */}
        <TouchableOpacity
          style={styles.googleBtn}
          onPress={handleGoogleSignUp}
          activeOpacity={0.88}
        >
          <GoogleIcon size={22} />
          <Text style={styles.googleBtnText}>{t("auth.continueWithGoogle")}</Text>
        </TouchableOpacity>

        {/* Sign up button */}
        <TouchableOpacity
          style={styles.signUpBtn}
          onPress={handleEmailSignUp}
          activeOpacity={0.88}
        >
          <Text style={styles.signUpBtnText}>{t("auth.continueWithEmail")}</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
        </TouchableOpacity>

        {/* Sign in link */}
        <TouchableOpacity
          style={styles.signInContainer}
          onPress={handleSignIn}
          activeOpacity={0.7}
        >
          <Text style={styles.signInText}>{t("auth.alreadyHaveAccount")} </Text>
          <Text style={styles.signInLink}>{t("auth.logIn")}</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

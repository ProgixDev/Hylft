import { MaterialCommunityIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dimensions,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { FONTS } from "../constants/fonts";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const SWIPE_HEIGHT = 60;
const SWIPE_HANDLE = 52;

interface OnboardingPage {
  id: number;
  image: any;
  title: string;
  titleBold: string;
  subtitle: string;
  buttonText: string;
}

const getOnboardingData = (t: (key: string) => string): OnboardingPage[] => [
  {
    id: 1,
    image: require("../../assets/images/OnBoarding/ManLookingUp.jpg"),
    title: t("onboarding.page1Title"),
    titleBold: t("onboarding.page1TitleBold"),
    subtitle: t("onboarding.page1Subtitle"),
    buttonText: t("onboarding.page1Button"),
  },
  {
    id: 2,
    image: require("../../assets/images/OnBoarding/ManWithOneWeights.jpg"),
    title: t("onboarding.page2Title"),
    titleBold: t("onboarding.page2TitleBold"),
    subtitle: t("onboarding.page2Subtitle"),
    buttonText: t("onboarding.page2Button"),
  },
  {
    id: 3,
    image: require("../../assets/images/OnBoarding/ManWithTwoWeights.jpg"),
    title: t("onboarding.page3Title"),
    titleBold: t("onboarding.page3TitleBold"),
    subtitle: t("onboarding.page3Subtitle"),
    buttonText: t("onboarding.page3Button"),
  },
];

export default function OnBoarding() {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(0);
  const [swipeWidth, setSwipeWidth] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const router = useRouter();
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const ONBOARDING_DATA = getOnboardingData(t);
  const translateX = useSharedValue(0);
  const isCompleting = useSharedValue(false);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const page = Math.round(offsetX / SCREEN_WIDTH);
    if (page !== currentPage) setCurrentPage(page);
  };

  const { setOnboardingCompleted } = useAuth();

  const handleFinish = async () => {
    await setOnboardingCompleted();
    router.replace("/get-started/username");
  };

  const handleNext = () => {
    if (currentPage < ONBOARDING_DATA.length - 1) {
      scrollViewRef.current?.scrollTo({
        x: SCREEN_WIDTH * (currentPage + 1),
        animated: true,
      });
    } else {
      handleFinish();
    }
  };

  useEffect(() => {
    translateX.value = withTiming(0, { duration: 180 });
    isCompleting.value = false;
  }, [currentPage, translateX, isCompleting]);

  const maxSwipe = Math.max(0, swipeWidth - SWIPE_HANDLE - 8);

  const swipeGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (isCompleting.value) return;
      const nextX = Math.max(0, Math.min(maxSwipe, event.translationX));
      translateX.value = nextX;
    })
    .onEnd(() => {
      if (isCompleting.value) return;
      const reachedEnd = maxSwipe > 0 && translateX.value > maxSwipe * 0.72;

      if (reachedEnd) {
        isCompleting.value = true;
        translateX.value = withTiming(maxSwipe, { duration: 140 }, () => {
          runOnJS(handleNext)();
        });
        return;
      }

      translateX.value = withSpring(0, {
        damping: 18,
        stiffness: 180,
      });
    });

  const swipeThumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const swipeFillStyle = useAnimatedStyle(() => ({
    width: SWIPE_HANDLE + translateX.value,
    opacity: 0.3 + (maxSwipe > 0 ? (translateX.value / maxSwipe) * 0.4 : 0),
  }));

  const swipeLabelStyle = useAnimatedStyle(() => ({
    opacity: 1 - (maxSwipe > 0 ? (translateX.value / maxSwipe) * 0.85 : 0),
  }));

  const page = ONBOARDING_DATA[currentPage];

  return (
    <View style={styles.container}>
      {/* Paged background */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={StyleSheet.absoluteFill}
      >
        {ONBOARDING_DATA.map((p) => (
          <View key={p.id} style={styles.page}>
            <Image
              source={p.image}
              style={styles.image}
              resizeMode="cover"
              fadeDuration={0}
            />
            <LinearGradient
              colors={[
                "rgba(0,0,0,0.35)",
                "rgba(0,0,0,0.0)",
                "rgba(0,0,0,0.55)",
              ]}
              locations={[0, 0.45, 1]}
              style={StyleSheet.absoluteFill}
            />
          </View>
        ))}
      </ScrollView>

      {/* Logo */}
      <View style={styles.logoContainer} pointerEvents="none">
        <Image
          source={require("../../assets/images/Logo.png")}
          style={styles.logo}
          resizeMode="contain"
          fadeDuration={0}
        />
      </View>

      {/* Bottom glass card */}
      <View style={styles.bottomCard}>
        {Platform.OS !== "android" ? (
          <BlurView
            intensity={50}
            tint="dark"
            pointerEvents="none"
            style={styles.bottomCardBlur}
          />
        ) : null}
        <View style={[styles.bottomCardGradient, styles.bottomCardBackdrop]}>
          <View style={styles.bottomCardBorder} pointerEvents="none" />

          <Text style={styles.title}>{page.title}</Text>
          {page.titleBold ? (
            <Text style={styles.titleBold}>{page.titleBold}</Text>
          ) : null}
          {page.subtitle ? (
            <Text style={styles.subtitle}>{page.subtitle}</Text>
          ) : null}

          {currentPage === 0 ? (
            <View
              style={styles.actionPill}
              onLayout={(event) =>
                setSwipeWidth(event.nativeEvent.layout.width)
              }
            >
              <Animated.View style={[styles.actionPillFill, swipeFillStyle]} />
              <Animated.Text style={[styles.actionPillText, swipeLabelStyle]}>
                {page.buttonText}
              </Animated.Text>
              <GestureDetector gesture={swipeGesture}>
                <Animated.View style={[styles.actionPillChip, swipeThumbStyle]}>
                  <MaterialCommunityIcons
                    name="chevron-double-right"
                    size={22}
                    color="#fff"
                  />
                </Animated.View>
              </GestureDetector>
            </View>
          ) : (
            <Pressable
              onPress={handleNext}
              style={({ pressed }) => [
                styles.standardButton,
                pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] },
              ]}
            >
              <Text style={styles.standardButtonText}>{page.buttonText}</Text>
              <View style={styles.standardButtonChip}>
                <MaterialCommunityIcons
                  name="arrow-right"
                  size={18}
                  color="#fff"
                />
              </View>
            </Pressable>
          )}

          <View style={styles.dots}>
            {ONBOARDING_DATA.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i === currentPage && styles.dotActive]}
              />
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>["theme"]) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background.dark,
    },
    page: {
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT,
    },
    image: {
      width: "100%",
      height: "100%",
    },

    // Logo
    logoContainer: {
      position: "absolute",
      top: 60,
      left: 20,
      zIndex: 20,
    },
    logo: {
      width: 120,
      height: 40,
    },

    // Bottom glass card (flush to bottom, top corners rounded)
    bottomCard: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      borderTopLeftRadius: 50,
      borderTopRightRadius: 50,
      overflow: "hidden",
      ...(Platform.OS === "ios"
        ? {
            shadowColor: "#000",
            shadowOpacity: 0.35,
            shadowRadius: 20,
            shadowOffset: { width: 0, height: -6 },
          }
        : { elevation: 10 }),
    },
    bottomCardGradient: {
      paddingTop: 24,
      paddingBottom: 32,
      paddingHorizontal: 24,
    },
    bottomCardBlur: {
      ...StyleSheet.absoluteFillObject,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
    },
    bottomCardBackdrop: {
      backgroundColor:
        Platform.OS === "android" ? "rgba(10,12,16,0.78)" : "transparent",
      ...(Platform.OS === "web"
        ? ({
            // @ts-ignore — CSS property for web
            backdropFilter: "blur(40px)",
            // @ts-ignore
            WebkitBackdropFilter: "blur(40px)",
          } as any)
        : {
            // @ts-ignore — experimental RN style accepted by Fabric on 0.76+
            experimental_backgroundImage: undefined,
          }),
    },
    bottomCardBorder: {
      ...StyleSheet.absoluteFillObject,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(255,255,255,0.22)",
    },
    title: {
      fontSize: 22,
      fontFamily: FONTS.regular,
      color: "#FFFFFF",
      lineHeight: 28,
      textAlign: "center",
    },
    titleBold: {
      fontSize: 28,
      fontFamily: FONTS.bold,
      color: "#FFFFFF",
      lineHeight: 34,
      marginTop: 2,
      textAlign: "center",
    },
    subtitle: {
      fontSize: 13,
      color: "rgba(255,255,255,0.72)",
      lineHeight: 19,
      marginTop: 8,
      fontFamily: FONTS.regular,
      textAlign: "center",
    },
    actionPill: {
      marginTop: 18,
      alignSelf: "center",
      width: "100%",
      maxWidth: 340,
      height: SWIPE_HEIGHT,
      borderRadius: 999,
      backgroundColor: "rgba(18,18,22,0.86)",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(255,255,255,0.18)",
      justifyContent: "center",
      overflow: "hidden",
      position: "relative",
    },
    actionPillFill: {
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      borderRadius: 999,
      backgroundColor: theme.primary.main,
    },
    actionPillText: {
      fontSize: 15,
      fontFamily: FONTS.semiBold,
      color: "#fff",
      textAlign: "center",
      paddingHorizontal: 72,
    },
    actionPillChip: {
      position: "absolute",
      left: 4,
      top: 4,
      width: SWIPE_HANDLE,
      height: SWIPE_HANDLE,
      borderRadius: SWIPE_HANDLE / 2,
      backgroundColor: theme.primary.main,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOpacity: 0.22,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 5,
    },
    standardButton: {
      marginTop: 18,
      alignSelf: "center",
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 8,
      paddingLeft: 22,
      paddingRight: 8,
      borderRadius: 999,
      backgroundColor: "rgba(18,18,22,0.86)",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(255,255,255,0.18)",
    },
    standardButtonText: {
      fontSize: 15,
      fontFamily: FONTS.semiBold,
      color: "#fff",
    },
    standardButtonChip: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.primary.main,
      alignItems: "center",
      justifyContent: "center",
    },
    dots: {
      marginTop: 12,
      flexDirection: "row",
      justifyContent: "center",
      gap: 6,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: "rgba(255,255,255,0.3)",
    },
    dotActive: {
      width: 18,
      backgroundColor: "#fff",
    },
  });

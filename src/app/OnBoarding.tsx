import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
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
import { FONTS } from "../constants/fonts";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

type Widget =
  | {
      kind: "stat";
      top: number;
      right?: number;
      left?: number;
      title: string;
      value: string;
      sub?: string;
      icon: React.ComponentProps<typeof Ionicons>["name"];
    }
  | {
      kind: "chip";
      top: number;
      right?: number;
      left?: number;
      title: string;
      value: string;
      avatar?: any;
    };

interface OnboardingPage {
  id: number;
  image: any;
  title: string;
  titleBold: string;
  subtitle: string;
  buttonText: string;
  widgets: Widget[];
}

const getOnboardingData = (t: (key: string) => string): OnboardingPage[] => [
  {
    id: 1,
    image: require("../../assets/images/OnBoarding/ManLookingUp.jpg"),
    title: t("onboarding.page1Title"),
    titleBold: t("onboarding.page1TitleBold"),
    subtitle: t("onboarding.page1Subtitle"),
    buttonText: t("onboarding.page1Button"),
    widgets: [
      {
        kind: "stat",
        top: 140,
        right: 20,
        title: "Kcal Burned",
        value: "950+",
        sub: "Week: 4",
        icon: "flame",
      },
      {
        kind: "stat",
        top: 300,
        left: 20,
        title: "Run Log",
        value: "Lvl 3",
        sub: "Runs This Week: 4",
        icon: "stats-chart",
      },
    ],
  },
  {
    id: 2,
    image: require("../../assets/images/OnBoarding/ManWithOneWeights.jpg"),
    title: t("onboarding.page2Title"),
    titleBold: t("onboarding.page2TitleBold"),
    subtitle: t("onboarding.page2Subtitle"),
    buttonText: t("onboarding.page2Button"),
    widgets: [
      {
        kind: "chip",
        top: 160,
        right: 20,
        title: "3.5 km",
        value: "Luna Beaty",
      },
    ],
  },
  {
    id: 3,
    image: require("../../assets/images/OnBoarding/ManWithTwoWeights.jpg"),
    title: t("onboarding.page3Title"),
    titleBold: t("onboarding.page3TitleBold"),
    subtitle: t("onboarding.page3Subtitle"),
    buttonText: t("onboarding.page3Button"),
    widgets: [
      {
        kind: "stat",
        top: 150,
        right: 20,
        title: "Strength",
        value: "+12%",
        sub: "This month",
        icon: "barbell",
      },
    ],
  },
];

export default function OnBoarding() {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const router = useRouter();
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const ONBOARDING_DATA = getOnboardingData(t);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const page = Math.round(offsetX / SCREEN_WIDTH);
    if (page !== currentPage) setCurrentPage(page);
  };

  const { user, setOnboardingCompleted } = useAuth();

  const handleFinish = async () => {
    await setOnboardingCompleted();
    if (user) router.navigate("/(tabs)/schedule");
    else router.navigate("/auth");
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
            <Image source={p.image} style={styles.image} resizeMode="cover" />
            <LinearGradient
              colors={["rgba(0,0,0,0.35)", "rgba(0,0,0,0.0)", "rgba(0,0,0,0.55)"]}
              locations={[0, 0.45, 1]}
              style={StyleSheet.absoluteFill}
            />

            {/* Floating widgets */}
            {p.widgets.map((w, i) => {
              const position = {
                top: w.top,
                ...(w.right !== undefined ? { right: w.right } : {}),
                ...(w.left !== undefined ? { left: w.left } : {}),
              };
              if (w.kind === "stat") {
                return (
                  <View key={i} style={[styles.statWidget, position]}>
                    <View style={styles.statWidgetIcon}>
                      <Ionicons name={w.icon} size={14} color="#fff" />
                    </View>
                    <Text style={styles.statWidgetTitle}>{w.title}</Text>
                    <Text style={styles.statWidgetValue}>{w.value}</Text>
                    {w.sub ? (
                      <Text style={styles.statWidgetSub}>{w.sub}</Text>
                    ) : null}
                  </View>
                );
              }
              return (
                <View key={i} style={[styles.chipWidget, position]}>
                  <View style={styles.chipAvatar}>
                    <Ionicons name="person" size={14} color="#fff" />
                  </View>
                  <View>
                    <Text style={styles.chipWidgetValue}>{w.title}</Text>
                    <Text style={styles.chipWidgetSub}>{w.value}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        ))}
      </ScrollView>

      {/* Logo */}
      <View style={styles.logoContainer} pointerEvents="none">
        <Image
          source={require("../../assets/images/Logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* Bottom glass card */}
      <View style={styles.bottomCard}>
        <View style={[styles.bottomCardGradient, styles.bottomCardBackdrop]}>
          <View style={styles.bottomCardBorder} pointerEvents="none" />

          <Text style={styles.title}>{page.title}</Text>
          {page.titleBold ? (
            <Text style={styles.titleBold}>{page.titleBold}</Text>
          ) : null}
          {page.subtitle ? (
            <Text style={styles.subtitle}>{page.subtitle}</Text>
          ) : null}

          <Pressable
            onPress={handleNext}
            style={({ pressed }) => [
              styles.actionPill,
              pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] },
            ]}
          >
            <Text style={styles.actionPillText}>{page.buttonText}</Text>
            <View style={styles.actionPillChip}>
              <MaterialCommunityIcons name="arrow-top-right" size={18} color="#fff" />
            </View>
          </Pressable>

          <View style={styles.dots}>
            {ONBOARDING_DATA.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i === currentPage && styles.dotActive,
                ]}
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

    // Floating widgets (glassy)
    statWidget: {
      position: "absolute",
      minWidth: 130,
      padding: 12,
      borderRadius: 16,
      backgroundColor: "rgba(20,20,24,0.55)",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(255,255,255,0.25)",
      ...(Platform.OS === "ios"
        ? {
            shadowColor: "#000",
            shadowOpacity: 0.3,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 6 },
          }
        : { elevation: 4 }),
    },
    statWidgetIcon: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: theme.primary.main + "CC",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 6,
    },
    statWidgetTitle: {
      color: "rgba(255,255,255,0.75)",
      fontSize: 11,
      fontFamily: FONTS.medium,
    },
    statWidgetValue: {
      color: "#fff",
      fontSize: 18,
      fontFamily: FONTS.extraBold,
      marginTop: 2,
    },
    statWidgetSub: {
      color: "rgba(255,255,255,0.6)",
      fontSize: 10,
      fontFamily: FONTS.medium,
      marginTop: 2,
    },
    chipWidget: {
      position: "absolute",
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 18,
      backgroundColor: "rgba(20,20,24,0.6)",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(255,255,255,0.25)",
    },
    chipAvatar: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: theme.primary.main,
      alignItems: "center",
      justifyContent: "center",
    },
    chipWidgetValue: {
      color: "#fff",
      fontSize: 14,
      fontFamily: FONTS.bold,
    },
    chipWidgetSub: {
      color: "rgba(255,255,255,0.7)",
      fontSize: 11,
      fontFamily: FONTS.medium,
    },

    // Bottom glass card (flush to bottom, top corners rounded)
    bottomCard: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
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
    bottomCardBackdrop: {
      backgroundColor: "rgba(20,20,24,0.55)",
      ...(Platform.OS === "web"
        ? ({
            // @ts-ignore — CSS property for web
            backdropFilter: "blur(24px)",
            // @ts-ignore
            WebkitBackdropFilter: "blur(24px)",
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
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 8,
      paddingLeft: 22,
      paddingRight: 8,
      borderRadius: 999,
      backgroundColor: "rgba(30,30,34,0.9)",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(255,255,255,0.18)",
    },
    actionPillText: {
      fontSize: 15,
      fontFamily: FONTS.semiBold,
      color: "#fff",
    },
    actionPillChip: {
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

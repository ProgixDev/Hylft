import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  type ImageSourcePropType,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  Easing,
  runOnJS,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { FONTS } from "../../constants/fonts";
import { Theme } from "../../constants/themes";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

type OnboardingScreenData = {
  id: number;
  title: string;
  emphasis: string;
  subtitle: string;
  centerIcon: IconName;
  icons: {
    name: IconName;
    asset?: ImageSourcePropType;
    color?: string;
    orbit: number;
    angle: number;
    size: number;
  }[];
};

type Props = {
  screenIndex: 0 | 1 | 2;
  nextRoute?: "/onboarding/second" | "/onboarding/third";
};

const SCREEN_DURATION_MS = 4200;
const ORBIT_DURATION_MS = 14000;
const PAGE_FADE_IN_MS = 850;
const PAGE_FADE_OUT_MS = 650;
const FULL_ROTATION = Math.PI * 2;
const ORBIT_ICON_PADDING = 30;
const GIF_PLANET_SCALE = 0.95;

function buildScreens(
  t: (key: string) => string,
  language: string | undefined,
): OnboardingScreenData[] {
  const isFrench = language?.startsWith("fr");

  return [
    {
      id: 1,
      title: isFrench ? "Bienvenue\nsur Hylift" : "Welcome\nto Hylift",
      emphasis: `${t("onboarding.page1Title")} ${t("onboarding.page1TitleBold")}`,
      subtitle: t("onboarding.page1Subtitle").replaceAll('"', ""),
      centerIcon: "leaf",
      icons: [
        {
          name: "chart-line",
          asset: require("../../../assets/gifs/onboarding/evolution.gif"),
          orbit: 188,
          angle: -1.57,
          size: 58,
        },
        {
          name: "target",
          asset: require("../../../assets/gifs/onboarding/mission.gif"),
          orbit: 128,
          angle: -0.52,
          size: 56,
        },
        {
          name: "trophy",
          asset: require("../../../assets/gifs/onboarding/trophy.gif"),
          orbit: 188,
          angle: 0.52,
          size: 58,
        },
        {
          name: "dumbbell",
          asset: require("../../../assets/gifs/onboarding/gym.gif"),
          orbit: 128,
          angle: 1.57,
          size: 56,
        },
        {
          name: "calendar-clock",
          asset: require("../../../assets/gifs/onboarding/calendar-time.gif"),
          orbit: 188,
          angle: 2.62,
          size: 58,
        },
        {
          name: "note-edit",
          asset: require("../../../assets/gifs/onboarding/writing.gif"),
          orbit: 128,
          angle: 3.67,
          size: 58,
        },
      ],
    },
    {
      id: 2,
      title: isFrench
        ? "Votre parcours\ncommence ici"
        : "Your journey\nstarts here",
      emphasis: t("onboarding.page2Subtitle").replaceAll('"', ""),
      subtitle: t("onboarding.page3Subtitle").replaceAll('"', ""),
      centerIcon: "dumbbell",
      icons: [
        {
          name: "dumbbell",
          color: "#101B2B",
          orbit: 132,
          angle: -1.6,
          size: 42,
        },
        {
          name: "run-fast",
          color: "#1E7A5D",
          orbit: 160,
          angle: -0.55,
          size: 40,
        },
        {
          name: "arm-flex",
          color: "#C78B2B",
          orbit: 122,
          angle: 0.35,
          size: 38,
        },
        {
          name: "heart-pulse",
          color: "#E94762",
          orbit: 154,
          angle: 1.55,
          size: 38,
        },
        {
          name: "timer-outline",
          color: "#4C6FFF",
          orbit: 136,
          angle: 2.55,
          size: 36,
        },
        { name: "medal", color: "#D4A44C", orbit: 166, angle: 3.4, size: 38 },
      ],
    },
    {
      id: 3,
      title: `${t("onboarding.page3Title")}\n${t("onboarding.page3TitleBold")}`,
      emphasis: isFrench ? "Hylift s'adapte a vous" : "Hylift adapts to you",
      subtitle: t("onboarding.page1Subtitle").replaceAll('"', ""),
      centerIcon: "chart-line",
      icons: [
        {
          name: "chart-line",
          color: "#1E7A5D",
          orbit: 128,
          angle: -1.25,
          size: 40,
        },
        { name: "fire", color: "#F26A35", orbit: 158, angle: -0.25, size: 38 },
        {
          name: "scale-bathroom",
          color: "#4C6FFF",
          orbit: 138,
          angle: 0.9,
          size: 36,
        },
        {
          name: "silverware-fork-knife",
          color: "#E0A92E",
          orbit: 166,
          angle: 1.95,
          size: 36,
        },
        {
          name: "heart-pulse",
          color: "#E94762",
          orbit: 124,
          angle: 2.85,
          size: 38,
        },
        {
          name: "medal-outline",
          color: "#101B2B",
          orbit: 152,
          angle: 3.75,
          size: 38,
        },
      ],
    },
  ];
}

function OrbitIcon({
  icon,
  progress,
  direction,
  orbitScale,
}: {
  icon: OnboardingScreenData["icons"][number];
  progress: SharedValue<number>;
  direction: 1 | -1;
  orbitScale: number;
}) {
  const isGifPlanet = Boolean(icon.asset);
  const renderedSize = Math.round(
    icon.size * orbitScale * (isGifPlanet ? GIF_PLANET_SCALE : 1),
  );
  const bubbleSize = renderedSize + (isGifPlanet ? 0 : ORBIT_ICON_PADDING);

  const animatedStyle = useAnimatedStyle(() => {
    const theta = icon.angle + progress.value * FULL_ROTATION * direction;
    const radius = icon.orbit * orbitScale;

    return {
      transform: [
        { translateX: Math.cos(theta) * radius },
        { translateY: Math.sin(theta) * radius },
        { rotateZ: `${theta * 0.25}rad` },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.orbitIcon,
        isGifPlanet && styles.gifOrbitIcon,
        {
          width: bubbleSize,
          height: bubbleSize,
          borderRadius: isGifPlanet ? 0 : bubbleSize / 2,
          marginLeft: -bubbleSize / 2,
          marginTop: -bubbleSize / 2,
        },
        animatedStyle,
      ]}
    >
      {icon.asset ? (
        <Image
          source={icon.asset}
          style={{ width: renderedSize, height: renderedSize }}
          contentFit="contain"
          cachePolicy="memory-disk"
          recyclingKey={icon.name}
        />
      ) : (
        <MaterialCommunityIcons
          name={icon.name}
          size={renderedSize}
          color={icon.color}
        />
      )}
    </Animated.View>
  );
}

export default function OrbitOnboardingScreen({
  screenIndex,
  nextRoute,
}: Props) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { theme } = useTheme();
  const { setOnboardingCompleted } = useAuth();
  const { width, height } = useWindowDimensions();
  const orbitProgress = useSharedValue(0);
  const pageOpacity = useSharedValue(1);
  const themedStyles = useMemo(() => createStyles(theme), [theme]);
  const screens = useMemo(
    () => buildScreens(t, i18n.language),
    [i18n.language, t],
  );
  const screen = screens[screenIndex];
  const isFirstScreen = screenIndex === 0;
  const orbitSize = isFirstScreen
    ? Math.min(width * 1.52, height * 0.72, 620)
    : Math.min(width * 0.96, height * 0.58, 420);
  const orbitScale = isFirstScreen
    ? Math.max(1, orbitSize / 390)
    : Math.max(0.78, Math.min(1, orbitSize / 390));
  const orbitRingScales = isFirstScreen ? [1, 0.76, 0.52] : [0.96, 0.76, 0.56];

  useEffect(() => {
    orbitProgress.value = withRepeat(
      withTiming(1, { duration: ORBIT_DURATION_MS, easing: Easing.linear }),
      -1,
      false,
    );
  }, [orbitProgress]);

  useEffect(() => {
    pageOpacity.value = 0;
    pageOpacity.value = withTiming(1, {
      duration: PAGE_FADE_IN_MS,
      easing: Easing.out(Easing.quad),
    });
  }, [pageOpacity]);

  const completeScreen = React.useCallback(() => {
    if (nextRoute) {
      router.replace(nextRoute);
      return;
    }

    void (async () => {
      await setOnboardingCompleted();
      router.replace("/auth");
    })();
  }, [nextRoute, router, setOnboardingCompleted]);

  useEffect(() => {
    const pageTimeout = setTimeout(() => {
      pageOpacity.value = withTiming(
        0,
        {
          duration: PAGE_FADE_OUT_MS,
          easing: Easing.in(Easing.quad),
        },
        (finished) => {
          if (finished) {
            runOnJS(completeScreen)();
          }
        },
      );
    }, SCREEN_DURATION_MS);

    return () => clearTimeout(pageTimeout);
  }, [completeScreen, pageOpacity]);

  const pageAnimatedStyle = useAnimatedStyle(() => ({
    opacity: pageOpacity.value,
  }));

  return (
    <Animated.View
      style={[
        themedStyles.container,
        isFirstScreen && themedStyles.firstScreenContainer,
        pageAnimatedStyle,
      ]}
    >
      <View
        style={[
          styles.planetStage,
          {
            width: orbitSize,
            height: orbitSize,
          },
        ]}
      >
        <View
          style={[
            styles.orbitRing,
            isFirstScreen && styles.firstScreenOrbitRing,
            { width: orbitSize * orbitRingScales[0], height: orbitSize * orbitRingScales[0] },
          ]}
        />
        <View
          style={[
            styles.orbitRing,
            isFirstScreen && styles.firstScreenOrbitRing,
            { width: orbitSize * orbitRingScales[1], height: orbitSize * orbitRingScales[1] },
          ]}
        />
        <View
          style={[
            styles.orbitRing,
            isFirstScreen && styles.firstScreenOrbitRing,
            { width: orbitSize * orbitRingScales[2], height: orbitSize * orbitRingScales[2] },
          ]}
        />

        {screen.icons.map((icon, index) => (
          <OrbitIcon
            key={`${screen.id}-${icon.name}-${index}`}
            icon={icon}
            progress={orbitProgress}
            direction={isFirstScreen ? 1 : index % 2 === 0 ? 1 : -1}
            orbitScale={orbitScale}
          />
        ))}

        <View style={styles.centerCopy}>
          <View style={themedStyles.centerBadge}>
            <MaterialCommunityIcons
              name={screen.centerIcon}
              size={24}
              color={theme.primary.main}
            />
          </View>
          <Text
            style={[
              themedStyles.title,
              isFirstScreen && themedStyles.firstScreenText,
            ]}
          >
            {screen.title}
          </Text>
          <Text
            style={[
              themedStyles.emphasis,
              isFirstScreen && themedStyles.firstScreenText,
            ]}
          >
            {screen.emphasis}
          </Text>
          <Text
            style={[
              themedStyles.subtitle,
              isFirstScreen && themedStyles.firstScreenSubtitle,
            ]}
          >
            {screen.subtitle}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#FBFAF8",
      overflow: "hidden",
    },
    firstScreenContainer: {
      backgroundColor: "#FFFFFF",
    },
    centerBadge: {
      width: 54,
      height: 54,
      borderRadius: 27,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 18,
      backgroundColor: "#FFFFFF",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(10, 22, 40, 0.12)",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.08,
      shadowRadius: 18,
      elevation: 4,
    },
    title: {
      color: "#10141F",
      fontFamily: FONTS.extraBold,
      fontSize: 34,
      lineHeight: 35,
      textAlign: "center",
    },
    emphasis: {
      marginTop: 12,
      color: theme.primary.main,
      fontFamily: FONTS.bold,
      fontSize: 24,
      lineHeight: 28,
      textAlign: "center",
    },
    subtitle: {
      maxWidth: 260,
      marginTop: 8,
      color: "rgba(16, 20, 31, 0.62)",
      fontFamily: FONTS.regular,
      fontSize: 17,
      lineHeight: 22,
      textAlign: "center",
    },
    firstScreenText: {
      color: "#10141F",
    },
    firstScreenSubtitle: {
      color: "rgba(16, 20, 31, 0.62)",
    },
  });

const styles = StyleSheet.create({
  planetStage: {
    alignItems: "center",
    justifyContent: "center",
  },
  orbitRing: {
    position: "absolute",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(16, 20, 31, 0.22)",
  },
  firstScreenOrbitRing: {
    borderColor: "rgba(16, 20, 31, 0.24)",
  },
  orbitIcon: {
    position: "absolute",
    left: "50%",
    top: "50%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.11,
    shadowRadius: 16,
    elevation: 5,
  },
  gifOrbitIcon: {
    backgroundColor: "transparent",
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  centerCopy: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 34,
  },
});

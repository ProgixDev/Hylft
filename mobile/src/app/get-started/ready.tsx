import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { Text } from "../../components/ui/ScaledText";
import Svg, { Circle, Defs, G, LinearGradient, Stop } from "react-native-svg";
import { FONTS } from "../../constants/fonts";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";

const EXERCISES = [
  require("../../../assets/exercise-previews/01qpYSe.gif"),
  require("../../../assets/exercise-previews/03lzqwk.gif"),
  require("../../../assets/exercise-previews/05Cf2v8.gif"),
  require("../../../assets/exercise-previews/0br45wL.gif"),
  require("../../../assets/exercise-previews/0CXGHya.gif"),
  require("../../../assets/exercise-previews/0dCyly0.gif"),
  require("../../../assets/exercise-previews/0IgNjSM.gif"),
  require("../../../assets/exercise-previews/0jp9Rlz.gif"),
  require("../../../assets/exercise-previews/0JtKWum.gif"),
  require("../../../assets/exercise-previews/0L2KwtI.gif"),
  require("../../../assets/exercise-previews/0lQnxMZ.gif"),
  require("../../../assets/exercise-previews/0mB6wHO.gif"),
];

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const PLAN_DURATION = 12000;

/* ── Ring layout ── */
const RING_SIZE = 150;
const CENTER = RING_SIZE / 2;
const R = 62;
const C = 2 * Math.PI * R;
const STROKE_W = 9;

/* ── Exercise card marquee ── */
const CARD_W = 90;
const CARD_H = 90;
const CARD_GAP = 10;
const CARD_STEP = CARD_W + CARD_GAP;

const EXERCISES_1 = EXERCISES;
const EXERCISES_2 = [...EXERCISES].reverse();
const EXERCISES_3 = EXERCISES.slice(4).concat(EXERCISES.slice(0, 4));
const LOOP_DISTANCE = EXERCISES.length * CARD_STEP;

const ExerciseMarquee = React.memo(function ExerciseMarquee({
  sources,
  reverse = false,
  duration,
  style,
}: {
  sources: number[];
  reverse?: boolean;
  duration: number;
  style?: StyleProp<ViewStyle>;
}) {
  const translateX = useRef(
    new Animated.Value(reverse ? -LOOP_DISTANCE : 0),
  ).current;
  const row = useMemo(() => [...sources, ...sources], [sources]);

  useEffect(() => {
    translateX.setValue(reverse ? -LOOP_DISTANCE : 0);
    const animation = Animated.loop(
      Animated.timing(translateX, {
        toValue: reverse ? 0 : -LOOP_DISTANCE,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    animation.start();
    return () => animation.stop();
  }, [duration, reverse, translateX]);

  return (
    <View style={[s.marqueeWindow, style]}>
      <Animated.View
        style={[
          s.cardTrack,
          { width: LOOP_DISTANCE * 2, transform: [{ translateX }] },
        ]}
      >
        {row.map((source, index) => (
          <View key={`${index}`} style={s.card}>
            <Image
              source={source}
              style={s.cardImage}
              contentFit="contain"
              autoplay={false}
            />
          </View>
        ))}
      </Animated.View>
    </View>
  );
});

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function PercentText({ progress }: { progress: Animated.Value }) {
  const { t } = useTranslation();
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    const listener = progress.addListener(({ value }) => {
      setPercent(Math.round(value));
    });
    return () => progress.removeListener(listener);
  }, [progress]);

  return (
    <View style={s.percentWrap}>
      <Text style={s.percent}>{percent}%</Text>
      <Text style={s.percentLabel}>
        {t("onboarding.ready.percentLabel", "POUR CENT")}
      </Text>
    </View>
  );
}

export default function Ready() {
  const router = useRouter();
  const { user } = useAuth();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const progress = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 100,
      duration: PLAN_DURATION,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        router.replace("/get-started/results");
      }
    });

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1400,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [progress, pulse, router, user]);

  const dashOffset = progress.interpolate({
    inputRange: [0, 100],
    outputRange: [C, 0],
  });

  const ringScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.04],
  });

  return (
    <View style={s.root}>
      <StatusBar style="dark" translucent backgroundColor="transparent" />

      {/* Logo */}
      <View style={s.logoContainer}>
        <Image
          source={theme.logo}
          style={s.logo}
          contentFit="contain"
        />
      </View>

      {/* Progress ring */}
      <View style={s.content}>
        <Animated.View
          style={[s.ringWrap, { transform: [{ scale: ringScale }] }]}
        >
          <Svg width={RING_SIZE} height={RING_SIZE}>
            <Defs>
              <LinearGradient id="ringGrad" x1="0.5" y1="1" x2="0.5" y2="0">
                <Stop offset="0" stopColor="#102b4a" />
                <Stop offset="1" stopColor="#10B981" />
              </LinearGradient>
            </Defs>
            {/* Track */}
            <Circle
              cx={CENTER}
              cy={CENTER}
              r={R}
              stroke="#E5E7EB"
              strokeWidth={STROKE_W}
              fill="none"
            />
            {/* Fill */}
            <G rotation="-90" originX={CENTER} originY={CENTER}>
              <AnimatedCircle
                cx={CENTER}
                cy={CENTER}
                r={R}
                stroke="url(#ringGrad)"
                strokeWidth={STROKE_W}
                strokeLinecap="round"
                strokeDasharray={C}
                strokeDashoffset={dashOffset}
                fill="none"
              />
            </G>
          </Svg>
          <PercentText progress={progress} />
        </Animated.View>

        <Text style={s.title}>{t("onboarding.ready.title")}</Text>
        <Text style={s.subtitle}>
          {t("onboarding.ready.subtitle", "Encore quelques secondes")}
        </Text>
      </View>

      {/* Stats + exercise grid */}
      <View style={s.bottom}>
        <Text style={s.count}>
          {t("onboarding.ready.exerciseCount", "1 300+")}
        </Text>
        <Text style={s.caption}>
          {t(
            "onboarding.ready.exerciseCaption",
            "exercices disponibles sur la plateforme",
          )}
        </Text>

        <View style={s.gridContainer}>
          <ExerciseMarquee sources={EXERCISES_1} duration={22000} />
          <ExerciseMarquee
            sources={EXERCISES_2}
            reverse
            duration={24000}
            style={s.rowOffset}
          />
          <ExerciseMarquee sources={EXERCISES_3} duration={25000} />
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F8F9FC",
    overflow: "hidden",
  },
  logoContainer: {
    paddingTop: 56,
    alignItems: "center",
  },
  logo: {
    width: 120,
    height: 40,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 20,
  },
  ringWrap: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  percentWrap: {
    position: "absolute",
    alignItems: "center",
  },
  percent: {
    color: "#102b4a",
    fontSize: 32,
    lineHeight: 36,
    fontFamily: FONTS.extraBold,
  },
  percentLabel: {
    color: "#9CA3AF",
    fontSize: 9,
    fontFamily: FONTS.bold,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginTop: 2,
  },
  title: {
    color: "#102b4a",
    fontSize: 22,
    lineHeight: 28,
    fontFamily: FONTS.extraBold,
    textAlign: "center",
    maxWidth: 280,
  },
  subtitle: {
    color: "#9CA3AF",
    fontSize: 14,
    fontFamily: FONTS.medium,
    textAlign: "center",
    marginTop: 6,
  },
  bottom: {
    alignItems: "center",
    paddingBottom: 16,
  },
  count: {
    color: "#102b4a",
    fontSize: 40,
    lineHeight: 46,
    fontFamily: FONTS.extraBold,
    textAlign: "center",
  },
  caption: {
    color: "#6B7280",
    fontSize: 14,
    fontFamily: FONTS.medium,
    textAlign: "center",
    marginBottom: 16,
  },
  gridContainer: {
    width: SCREEN_WIDTH + CARD_STEP * 2,
    marginHorizontal: -CARD_STEP,
  },
  marqueeWindow: {
    height: CARD_H + 8,
    overflow: "hidden",
    marginBottom: 8,
  },
  rowOffset: {
    marginLeft: -CARD_W / 2,
  },
  cardTrack: {
    flexDirection: "row",
  },
  card: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: 8,
    overflow: "hidden",
    marginRight: CARD_GAP,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
});

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
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Svg, { Circle, G } from "react-native-svg";
import { FONTS } from "../../constants/fonts";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../services/supabase";

const EXERCISES = [
  require("../../../exercisedb/data/media_lowquality/01qpYSe.gif"),
  require("../../../exercisedb/data/media_lowquality/03lzqwk.gif"),
  require("../../../exercisedb/data/media_lowquality/05Cf2v8.gif"),
  require("../../../exercisedb/data/media_lowquality/0br45wL.gif"),
  require("../../../exercisedb/data/media_lowquality/0CXGHya.gif"),
  require("../../../exercisedb/data/media_lowquality/0dCyly0.gif"),
  require("../../../exercisedb/data/media_lowquality/0IgNjSM.gif"),
  require("../../../exercisedb/data/media_lowquality/0jp9Rlz.gif"),
  require("../../../exercisedb/data/media_lowquality/0JtKWum.gif"),
  require("../../../exercisedb/data/media_lowquality/0L2KwtI.gif"),
  require("../../../exercisedb/data/media_lowquality/0lQnxMZ.gif"),
  require("../../../exercisedb/data/media_lowquality/0mB6wHO.gif"),
];

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const PLAN_DURATION = 10000;
const RING_SIZE = 132;
const CENTER = RING_SIZE / 2;

const R_INNER = 36;
const C_INNER = 2 * Math.PI * R_INNER;
const R_MIDDLE = 47;
const C_MIDDLE = 2 * Math.PI * R_MIDDLE;
const R_OUTER = 58;
const C_OUTER = 2 * Math.PI * R_OUTER;

const LOGO = require("../../../assets/images/Logo.png");

const AVATAR_SIZE = 44;
const AVATAR_GAP = 12;
const AVATAR_STEP = AVATAR_SIZE + AVATAR_GAP;

const EXERCISE_SIZE = 44;
const EXERCISE_GAP = 12;
const EXERCISE_STEP = EXERCISE_SIZE + EXERCISE_GAP;
const EXERCISE_LOOP_DISTANCE = EXERCISES.length * EXERCISE_STEP;

const EXERCISES_1 = EXERCISES;
const EXERCISES_2 = [...EXERCISES].reverse();
const EXERCISES_3 = EXERCISES.slice(4).concat(EXERCISES.slice(0, 4));
const EXERCISES_4 = EXERCISES.slice(7).concat(EXERCISES.slice(0, 7));

const AvatarMarquee = React.memo(function AvatarMarquee({
  sources,
  reverse = false,
  duration,
  style,
}: {
  sources: string[];
  reverse?: boolean;
  duration: number;
  style?: StyleProp<ViewStyle>;
}) {
  const loopDistance = sources.length * AVATAR_STEP;

  const translateX = useRef(
    new Animated.Value(reverse ? -loopDistance : 0),
  ).current;
  const row = useMemo(() => [...sources, ...sources], [sources]);

  useEffect(() => {
    if (sources.length === 0) return;
    translateX.setValue(reverse ? -loopDistance : 0);
    const animation = Animated.loop(
      Animated.timing(translateX, {
        toValue: reverse ? 0 : -loopDistance,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    animation.start();
    return () => animation.stop();
  }, [duration, reverse, translateX, loopDistance, sources.length]);

  if (sources.length === 0) return null;

  return (
    <View style={[styles.marqueeWindow, style]}>
      <Animated.View
        style={[
          styles.avatarTrack,
          { width: loopDistance * 2, transform: [{ translateX }] },
        ]}
      >
        {row.map((source, index) => (
          <View key={`${source}-${index}`} style={styles.avatarShell}>
            <Image
              source={{ uri: source }}
              style={styles.avatar}
              contentFit="cover"
            />
          </View>
        ))}
      </Animated.View>
    </View>
  );
});

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
    new Animated.Value(reverse ? -EXERCISE_LOOP_DISTANCE : 0),
  ).current;
  const row = useMemo(() => [...sources, ...sources], [sources]);

  useEffect(() => {
    translateX.setValue(reverse ? -EXERCISE_LOOP_DISTANCE : 0);
    const animation = Animated.loop(
      Animated.timing(translateX, {
        toValue: reverse ? 0 : -EXERCISE_LOOP_DISTANCE,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    animation.start();
    return () => animation.stop();
  }, [duration, reverse, translateX]);

  return (
    <View style={[styles.marqueeWindow, style]}>
      <Animated.View
        style={[styles.exerciseTrack, { transform: [{ translateX }] }]}
      >
        {row.map((source, index) => (
          <View key={`${source}-${index}`} style={styles.exerciseShell}>
            <Image
              source={source}
              style={styles.exerciseImage}
              contentFit="contain"
            />
          </View>
        ))}
      </Animated.View>
    </View>
  );
});

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function PercentText({ progress }: { progress: Animated.Value }) {
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    const listener = progress.addListener(({ value }) => {
      setPercent(Math.round(value));
    });
    return () => progress.removeListener(listener);
  }, [progress]);

  return <Text style={styles.percent}>{percent}%</Text>;
}

export default function Ready() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useTranslation();
  const progress = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  // For remote avatars
  const [avatars, setAvatars] = useState<string[]>([]);

  useEffect(() => {
    const fileNames = [
      "1.jpg",
      "2.jpg",
      "3.jpg",
      "4.jpg",
      "5.jpg",
      "6.jpg",
      "7.jpg",
      "8.avif",
      "9.avif",
    ];
    const urls = fileNames.map(
      (name) =>
        supabase.storage.from("mock_profiles_onboarding").getPublicUrl(name)
          .data.publicUrl,
    );
    setAvatars(urls);
  }, []);

  const avatars1 = useMemo(
    () => (avatars.length > 0 ? avatars : []),
    [avatars],
  );
  const avatars2 = useMemo(
    () => (avatars.length > 0 ? [...avatars].reverse() : []),
    [avatars],
  );
  const avatars3 = useMemo(
    () =>
      avatars.length > 0 ? avatars.slice(4).concat(avatars.slice(0, 4)) : [],
    [avatars],
  );
  const avatars4 = useMemo(
    () =>
      avatars.length > 0 ? avatars.slice(7).concat(avatars.slice(0, 7)) : [],
    [avatars],
  );

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

  const topWidth = progress.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  });

  const dashInner = progress.interpolate({
    inputRange: [0, 100],
    outputRange: [C_INNER, 0],
  });
  const dashMiddle = progress.interpolate({
    inputRange: [0, 100],
    outputRange: [C_MIDDLE, 0],
  });
  const dashOuter = progress.interpolate({
    inputRange: [0, 100],
    outputRange: [C_OUTER, 0],
  });

  const ringScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.04],
  });

  const state1Opacity = progress.interpolate({
    inputRange: [0, 42, 50],
    outputRange: [1, 1, 0],
  });

  const state2Opacity = progress.interpolate({
    inputRange: [50, 58, 100],
    outputRange: [0, 1, 1],
  });

  return (
    <View style={styles.root}>
      <StatusBar style="light" translucent backgroundColor="transparent" />

      <View style={styles.logoContainer}>
        <Image source={LOGO} style={styles.logo} contentFit="contain" />
      </View>

      <View style={styles.content}>
        <Animated.View
          style={[
            styles.ringWrap,
            {
              transform: [{ scale: ringScale }],
            },
          ]}
        >
          <Svg width={RING_SIZE} height={RING_SIZE}>
            <Circle
              cx={CENTER}
              cy={CENTER}
              r={R_OUTER}
              stroke="#1A245B"
              strokeWidth={6}
              fill="none"
            />
            <Circle
              cx={CENTER}
              cy={CENTER}
              r={R_MIDDLE}
              stroke="#1C2456"
              strokeWidth={6}
              fill="none"
            />
            <Circle
              cx={CENTER}
              cy={CENTER}
              r={R_INNER}
              stroke="#141A3E"
              strokeWidth={6}
              fill="none"
            />

            <G rotation="-90" originX={CENTER} originY={CENTER}>
              <AnimatedCircle
                cx={CENTER}
                cy={CENTER}
                r={R_INNER}
                stroke="#FF4B57"
                strokeWidth={6}
                strokeLinecap="round"
                strokeDasharray={C_INNER}
                strokeDashoffset={dashInner}
                fill="none"
              />
              <AnimatedCircle
                cx={CENTER}
                cy={CENTER}
                r={R_MIDDLE}
                stroke="#FFDD50"
                strokeWidth={6}
                strokeLinecap="round"
                strokeDasharray={C_MIDDLE}
                strokeDashoffset={dashMiddle}
                fill="none"
              />
              <AnimatedCircle
                cx={CENTER}
                cy={CENTER}
                r={R_OUTER}
                stroke="#259CFF"
                strokeWidth={6}
                strokeLinecap="round"
                strokeDasharray={C_OUTER}
                strokeDashoffset={dashOuter}
                fill="none"
              />
            </G>
          </Svg>
          <PercentText progress={progress} />
        </Animated.View>

        <Text style={styles.title}>{t("onboarding.ready.title")}</Text>
      </View>

      <View style={styles.community}>
        <View style={styles.statsContainer}>
          <Animated.View
            style={[styles.statOverlay, { opacity: state1Opacity }]}
          >
            <Text style={styles.count}>
              {t("onboarding.ready.memberCount", "200,000+")}
            </Text>
            <Text style={styles.caption}>
              {t("onboarding.ready.memberCaption", "Members crushing it")}
            </Text>
          </Animated.View>
          <Animated.View
            style={[styles.statOverlay, { opacity: state2Opacity }]}
            pointerEvents="none"
          >
            <Text style={[styles.count, { color: "#259CFF" }]}>
              {t("onboarding.ready.exerciseCount", "1,300+")}
            </Text>
            <Text style={styles.caption}>
              {t(
                "onboarding.ready.exerciseCaption",
                "Exercises on our platform",
              )}
            </Text>
          </Animated.View>
        </View>

        <View style={styles.gridContainer}>
          <Animated.View
            style={[styles.avatarGrid, { opacity: state1Opacity }]}
          >
            <AvatarMarquee sources={avatars1} duration={20000} />
            <AvatarMarquee
              sources={avatars2}
              reverse
              duration={23000}
              style={styles.rowOffset}
            />
            <AvatarMarquee sources={avatars3} duration={26000} />
            <AvatarMarquee
              sources={avatars4}
              reverse
              duration={18000}
              style={styles.rowOffset}
            />
          </Animated.View>

          <Animated.View
            style={[
              styles.avatarGrid,
              styles.exerciseOverlay,
              { opacity: state2Opacity },
            ]}
            pointerEvents="none"
          >
            <ExerciseMarquee sources={EXERCISES_1} duration={22000} />
            <ExerciseMarquee
              sources={EXERCISES_2}
              reverse
              duration={24000}
              style={styles.rowOffset}
            />
            <ExerciseMarquee sources={EXERCISES_3} duration={25000} />
            <ExerciseMarquee
              sources={EXERCISES_4}
              reverse
              duration={28000}
              style={styles.fadeRow}
            />
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#101011",
    overflow: "hidden",
    paddingHorizontal: 20,
  },
  topProgressTrack: {
    height: 5,
    borderRadius: 999,
    backgroundColor: "#26282D",
    marginTop: 10,
    overflow: "hidden",
  },
  topProgressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#259CFF",
  },
  logoContainer: {
    paddingTop: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 120,
    height: 40,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 46,
  },
  ringWrap: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 22,
  },
  percent: {
    position: "absolute",
    color: "#FFFFFF",
    fontSize: 20,
    lineHeight: 24,
    fontFamily: FONTS.extraBold,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 23,
    lineHeight: 28,
    fontFamily: FONTS.extraBold,
    textAlign: "center",
    maxWidth: 260,
  },
  community: {
    minHeight: 260,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 10,
  },
  statsContainer: {
    width: "100%",
    height: 80,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statOverlay: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  count: {
    color: "#259CFF",
    fontSize: 45,
    lineHeight: 52,
    fontFamily: FONTS.extraBold,
    textAlign: "center",
  },
  caption: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 21,
    fontFamily: FONTS.bold,
    textAlign: "center",
    marginBottom: 0,
  },
  avatarGrid: {
    width: SCREEN_WIDTH + AVATAR_STEP * 2,
    marginHorizontal: -AVATAR_STEP,
  },
  gridContainer: {
    width: SCREEN_WIDTH + AVATAR_STEP * 2,
    height: 250,
  },
  exerciseOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  marqueeWindow: {
    height: AVATAR_SIZE + 8,
    overflow: "hidden",
    marginBottom: 6,
  },
  rowOffset: {
    marginLeft: -26,
  },
  fadeRow: {
    opacity: 0.55,
  },
  avatarTrack: {
    flexDirection: "row",
  },
  avatarShell: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    overflow: "hidden",
    marginRight: AVATAR_GAP,
    backgroundColor: "#1F2228",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  exerciseTrack: {
    flexDirection: "row",
    width: EXERCISE_LOOP_DISTANCE * 2,
  },
  exerciseShell: {
    width: EXERCISE_SIZE,
    height: EXERCISE_SIZE,
    borderRadius: 8,
    overflow: "hidden",
    marginRight: EXERCISE_GAP,
    backgroundColor: "#161D3A",
  },
  exerciseImage: {
    width: "100%",
    height: "100%",
    opacity: 0.85,
  },
});

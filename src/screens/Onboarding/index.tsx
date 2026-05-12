import React, { useEffect, useReducer, useRef } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  useFonts as useInterFonts,
} from "@expo-google-fonts/inter";
import {
  JetBrainsMono_700Bold,
  useFonts as useJetBrainsFonts,
} from "@expo-google-fonts/jetbrains-mono";
import { useTranslation } from "react-i18next";
import MeshBackground from "./MeshBackground";
import Slide1Welcome from "./Slide1Welcome";
import Slide2Telemetry from "./Slide2Telemetry";
import Slide3Trajectory from "./Slide3Trajectory";
import { timings } from "../../theme/spacing";

type SlideIndex = 0 | 1 | 2;

type State = { current: SlideIndex };
type Action = { type: "next" } | { type: "reset" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "next":
      if (state.current >= 2) return state;
      return { current: (state.current + 1) as SlideIndex };
    case "reset":
      return { current: 0 };
    default:
      return state;
  }
}

type Props = {
  onComplete: () => void;
};

export default function OnboardingScreen({ onComplete }: Props) {
  const [interLoaded] = useInterFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });
  const [monoLoaded] = useJetBrainsFonts({ JetBrainsMono_700Bold });
  const fontsReady = interLoaded && monoLoaded;

  const { t } = useTranslation();
  const [state, dispatch] = useReducer(reducer, { current: 0 });
  const current = state.current;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completedRef = useRef(false);

  useEffect(() => {
    if (!fontsReady) return;

    timeoutRef.current = setTimeout(() => {
      if (current < 2) {
        dispatch({ type: "next" });
      } else if (!completedRef.current) {
        completedRef.current = true;
        onComplete();
      }
    }, timings.slideHoldMs);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [fontsReady, current, onComplete]);

  if (!fontsReady) {
    return <MeshBackground />;
  }

  return (
    <MeshBackground>
      <FadeSlide visible={current === 0} initialFade>
        <Slide1Welcome
          titleStart={t("onboarding.s1.titleStart")}
          brand={t("onboarding.s1.brand")}
          subtitle={t("onboarding.s1.sub")}
        />
      </FadeSlide>

      <FadeSlide visible={current === 1}>
        <Slide2Telemetry
          titleStart={t("onboarding.s2.titleStart")}
          accent={t("onboarding.s2.accent")}
          subtitle={t("onboarding.s2.sub")}
          todayLabel={t("onboarding.s2.today")}
          goalLabel={t("onboarding.s2.goal")}
          mealLabel={t("onboarding.s2.meal")}
          mealDesc={t("onboarding.s2.mealDesc")}
          workoutLabel={t("onboarding.s2.workout")}
          workoutDesc={t("onboarding.s2.workoutDesc")}
        />
      </FadeSlide>

      <FadeSlide visible={current === 2}>
        <Slide3Trajectory
          eyebrow={t("onboarding.s3.eyebrow")}
          badgeLabel={t("onboarding.s3.badge")}
          peakLabel={t("onboarding.s3.peak")}
          titleStart={t("onboarding.s3.titleStart")}
          accent={t("onboarding.s3.accent")}
          subtitle={t("onboarding.s3.sub")}
        />
      </FadeSlide>
    </MeshBackground>
  );
}

function FadeSlide({
  visible,
  initialFade = false,
  children,
}: {
  visible: boolean;
  initialFade?: boolean;
  children: React.ReactNode;
}) {
  const opacity = useSharedValue(initialFade && visible ? 0 : visible ? 1 : 0);
  const hasMounted = useRef(false);

  useEffect(() => {
    const isFirst = !hasMounted.current;
    hasMounted.current = true;
    const duration =
      isFirst && initialFade && visible
        ? timings.initialFadeMs
        : timings.slideTransitionMs;
    opacity.value = withTiming(visible ? 1 : 0, {
      duration,
      easing: Easing.inOut(Easing.ease),
    });
  }, [initialFade, opacity, visible]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      pointerEvents={visible ? "auto" : "none"}
      style={[StyleSheet.absoluteFill, style]}
    >
      <View style={StyleSheet.absoluteFill}>{children}</View>
    </Animated.View>
  );
}

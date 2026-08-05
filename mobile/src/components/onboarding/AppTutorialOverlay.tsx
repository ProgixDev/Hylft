import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  runOnJS,
  withDelay,
  withRepeat,
  withSpring,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FONTS } from "../../constants/fonts";
import { Theme } from "../../constants/themes";
import { useTheme } from "../../contexts/ThemeContext";
import { useTutorialTargetRect } from "../../contexts/TutorialTargetContext";

type TabRoute = "home" | "workout" | "alimentation" | "feed" | "profile";
type IconName = keyof typeof Ionicons.glyphMap;
type TutorialRoute =
  | `/(tabs)/${TabRoute}`
  | "/objective?tutorialStep=days"
  | "/objective?tutorialStep=routines"
  | "/food-search?mealType=breakfast";

type TutorialStep = {
  id: string;
  route: TutorialRoute;
  tabRoute?: TabRoute;
  targetId: string;
  labelKey: string;
  titleKey: string;
  bodyKey: string;
  icon: IconName;
  accent: string;
};

const STEPS: TutorialStep[] = [
  {
    id: "home",
    route: "/(tabs)/home",
    tabRoute: "home",
    targetId: "tab.home",
    labelKey: "tabs.home",
    titleKey: "appTutorial.steps.home.title",
    bodyKey: "appTutorial.steps.home.body",
    icon: "sparkles",
    accent: "#38BDF8",
  },
  {
    id: "workout",
    route: "/(tabs)/workout",
    tabRoute: "workout",
    targetId: "tab.workout",
    labelKey: "tabs.workout",
    titleKey: "appTutorial.steps.workout.title",
    bodyKey: "appTutorial.steps.workout.body",
    icon: "barbell",
    accent: "#F59E0B",
  },
  {
    id: "alimentation",
    route: "/(tabs)/alimentation",
    tabRoute: "alimentation",
    targetId: "alimentation.breakfastAddButton",
    labelKey: "tabs.alimentation",
    titleKey: "appTutorial.steps.alimentation.title",
    bodyKey: "appTutorial.steps.alimentation.body",
    icon: "restaurant",
    accent: "#22C55E",
  },
  {
    id: "food-search",
    route: "/food-search?mealType=breakfast",
    targetId: "foodSearch.searchButton",
    labelKey: "appTutorial.steps.foodSearch.label",
    titleKey: "appTutorial.steps.foodSearch.title",
    bodyKey: "appTutorial.steps.foodSearch.body",
    icon: "search",
    accent: "#10B981",
  },
  {
    id: "profile",
    route: "/(tabs)/profile",
    tabRoute: "profile",
    targetId: "tab.profile",
    labelKey: "tabs.profile",
    titleKey: "appTutorial.steps.profile.title",
    bodyKey: "appTutorial.steps.profile.body",
    icon: "person",
    accent: "#A855F7",
  },
];

const TAB_ROUTES: TabRoute[] = [
  "home",
  "workout",
  "alimentation",
  "feed",
  "profile",
];

interface AppTutorialOverlayProps {
  visible: boolean;
  onFinish: () => void | Promise<void>;
}

export default function AppTutorialOverlay({
  visible,
  onFinish,
}: AppTutorialOverlayProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const overlayRef = useRef<View>(null);

  const [stepIndex, setStepIndex] = useState(0);
  const [overlayOrigin, setOverlayOrigin] = useState({ x: 0, y: 0 });
  const [hasMovedCard, setHasMovedCard] = useState(false);
  const step = STEPS[stepIndex];
  const tabWidth = width / TAB_ROUTES.length;
  const targetRect = useTutorialTargetRect(step.targetId);
  const cardOpacity = useSharedValue(0);
  const cardY = useSharedValue(22);
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  const nudgeX = useSharedValue(0);
  const dragStartX = useSharedValue(0);
  const dragStartY = useSharedValue(0);
  const overlayOpacity = useSharedValue(0);
  const pulse = useSharedValue(0);

  const measureOverlayOrigin = useCallback(() => {
    requestAnimationFrame(() => {
      overlayRef.current?.measureInWindow((x, y) => {
        setOverlayOrigin((current) =>
          Math.abs(current.x - x) < 0.5 && Math.abs(current.y - y) < 0.5
            ? current
            : { x, y },
        );
      });
    });
  }, []);

  useEffect(() => {
    if (!visible) {
      overlayOpacity.value = withTiming(0, { duration: 180 });
      return;
    }

    setStepIndex(0);
    setHasMovedCard(false);
    dragX.value = 0;
    dragY.value = 0;
    nudgeX.value = 0;
    overlayOpacity.value = withTiming(1, {
      duration: 260,
      easing: Easing.out(Easing.cubic),
    });
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) }),
        withTiming(0, { duration: 900, easing: Easing.in(Easing.cubic) }),
      ),
      -1,
      false,
    );
    router.replace("/(tabs)/home" as any);
    measureOverlayOrigin();
    nudgeX.value = withDelay(
      620,
      withSequence(
        withTiming(-22, { duration: 220, easing: Easing.out(Easing.cubic) }),
        withTiming(22, { duration: 320, easing: Easing.inOut(Easing.cubic) }),
        withTiming(0, { duration: 240, easing: Easing.out(Easing.cubic) }),
      ),
    );
  }, [
    dragX,
    dragY,
    measureOverlayOrigin,
    nudgeX,
    visible,
    overlayOpacity,
    pulse,
    router,
  ]);

  useEffect(() => {
    if (!visible) return;

    cardOpacity.value = 0;
    cardY.value = 22;
    cardOpacity.value = withTiming(1, {
      duration: 280,
      easing: Easing.out(Easing.cubic),
    });
    cardY.value = withTiming(0, {
      duration: 320,
      easing: Easing.out(Easing.cubic),
    });
  }, [cardOpacity, cardY, visible]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const spotlightStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(pulse.value, [0, 1], [1, 1.12]) },
    ],
    opacity: interpolate(pulse.value, [0, 1], [0.9, 0.45]),
  }));

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [
      { translateX: dragX.value + nudgeX.value },
      { translateY: cardY.value + dragY.value },
    ],
  }));

  const cardPanGesture = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(10)
        .onStart(() => {
          dragStartX.value = dragX.value;
          dragStartY.value = dragY.value;
        })
        .onUpdate((event) => {
          const maxX = width * 0.26;
          const minY = -(height * 0.5);
          const maxY = 24;
          const nextX = dragStartX.value + event.translationX;
          const nextY = dragStartY.value + event.translationY;

          dragX.value = Math.min(Math.max(nextX, -maxX), maxX);
          dragY.value = Math.min(Math.max(nextY, minY), maxY);
          if (!hasMovedCard) {
            runOnJS(setHasMovedCard)(true);
          }
        })
        .onEnd(() => {
          const maxX = width * 0.26;
          const minY = -(height * 0.5);
          const maxY = 24;

          dragX.value = withSpring(Math.min(Math.max(dragX.value, -maxX), maxX), {
            damping: 18,
            stiffness: 180,
          });
          dragY.value = withSpring(Math.min(Math.max(dragY.value, minY), maxY), {
            damping: 18,
            stiffness: 180,
          });
        }),
    [dragStartX, dragStartY, dragX, dragY, hasMovedCard, height, width],
  );

  const goToStep = (index: number) => {
    if (stepIndex === 0 && !hasMovedCard && index !== 0) return;
    const nextIndex = Math.max(0, Math.min(index, STEPS.length - 1));
    const nextStep = STEPS[nextIndex];
    setStepIndex(nextIndex);
    router.replace(nextStep.route as any);
  };

  const finish = async () => {
    await onFinish();
  };

  const goNext = () => {
    if (stepIndex === 0 && !hasMovedCard) return;
    if (stepIndex === STEPS.length - 1) {
      void finish();
      return;
    }
    goToStep(stepIndex + 1);
  };

  if (!visible) return null;

  const handleOverlayLayout = (_event: LayoutChangeEvent) => {
    measureOverlayOrigin();
  };

  const title = t(step.titleKey as any);
  const body = t(step.bodyKey as any);
  const label = t(step.labelKey as any);
  const stepText = `${stepIndex + 1}/${STEPS.length}`;
  const shouldShowDragHint = stepIndex === 0 && !hasMovedCard;
  const spotlightDiameter = targetRect
    ? Math.max(58, Math.max(targetRect.width, targetRect.height) + 24)
    : 68;
  const fallbackTabIndex = step.tabRoute ? TAB_ROUTES.indexOf(step.tabRoute) : -1;
  const spotlightPositionStyle = targetRect
    ? {
        width: spotlightDiameter,
        height: spotlightDiameter,
        borderRadius: spotlightDiameter / 2,
        left:
          targetRect.x -
          overlayOrigin.x +
          targetRect.width / 2 -
          spotlightDiameter / 2,
        top:
          targetRect.y -
          overlayOrigin.y +
          targetRect.height / 2 -
          spotlightDiameter / 2,
      }
    : {
        left:
          fallbackTabIndex >= 0
            ? fallbackTabIndex * tabWidth + tabWidth / 2 - spotlightDiameter / 2
            : width / 2 - spotlightDiameter / 2,
        bottom: insets.bottom + 3,
      };

  return (
    <Animated.View
      ref={overlayRef}
      pointerEvents="auto"
      onLayout={handleOverlayLayout}
      style={[styles.overlay, overlayStyle, { paddingTop: insets.top + 14 }]}
    >
      <View style={styles.scrim} />

      <View style={styles.topBar}>
        <View style={styles.brandMark}>
          <Ionicons name="compass" size={18} color="#FFFFFF" />
        </View>
        <View style={styles.progressTrack}>
          {STEPS.map((item, index) => (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityLabel={`${
                t(item.labelKey as any)
              } ${index + 1}`}
              onPress={() => goToStep(index)}
              style={[
                styles.progressDot,
                stepIndex === 0 && !hasMovedCard && index > 0 && {
                  opacity: 0.3,
                },
                index <= stepIndex && {
                  backgroundColor: STEPS[index].accent,
                  opacity: 1,
                },
              ]}
            />
          ))}
        </View>
        <Pressable onPress={finish} style={styles.skipButton}>
          <Text style={styles.skipText}>{t("common.skip")}</Text>
        </Pressable>
      </View>

      <View style={styles.modalSpacer} />

      <GestureDetector gesture={cardPanGesture}>
        <Animated.View style={[styles.card, cardStyle]}>
          <View style={styles.dragHandle} />
          {shouldShowDragHint && (
            <View style={styles.dragHint}>
              <Ionicons name="swap-horizontal" size={15} color="#FFFFFF" />
              <Text style={styles.dragHintText}>
                {t("appTutorial.dragHint")}
              </Text>
            </View>
          )}

          <View style={styles.cardHeader}>
            <View style={[styles.stepBadge, { backgroundColor: step.accent }]}>
              <Text style={styles.stepBadgeText}>{stepText}</Text>
            </View>
            <Text style={styles.routeLabel}>{label}</Text>
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.body}>{body}</Text>

          <View style={styles.actions}>
            <Pressable
            disabled={stepIndex === 0}
              onPress={() => goToStep(stepIndex - 1)}
              style={[
                styles.iconButton,
                stepIndex === 0 && styles.iconButtonDisabled,
              ]}
            >
              <Ionicons name="chevron-back" size={21} color="#FFFFFF" />
            </Pressable>

            <Pressable
            onPress={goNext}
            disabled={shouldShowDragHint}
            style={({ pressed }) => [
              styles.nextButton,
              {
                backgroundColor: shouldShowDragHint
                  ? "rgba(255,255,255,0.16)"
                  : step.accent,
              },
              pressed && { transform: [{ scale: 0.98 }] },
            ]}
            >
              <Text style={styles.nextText}>
                {stepIndex === STEPS.length - 1
                  ? t("common.done")
                  : shouldShowDragHint
                    ? t("appTutorial.swipeFirst")
                    : t("common.next")}
              </Text>
              <Ionicons
                name={
                  stepIndex === STEPS.length - 1 ? "checkmark" : "arrow-forward"
                }
                size={19}
                color="#FFFFFF"
              />
            </Pressable>
          </View>
        </Animated.View>
      </GestureDetector>

      <Animated.View
        pointerEvents="none"
        style={[
          styles.spotlight,
          spotlightPositionStyle,
          spotlightStyle,
        ]}
      />
    </Animated.View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 2000,
      justifyContent: "space-between",
      paddingHorizontal: 18,
      paddingBottom: 82,
    },
    scrim: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(3,7,18,0.78)",
    },
    topBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    brandMark: {
      width: 36,
      height: 36,
      borderRadius: 12,
      backgroundColor: theme.primary.main,
      alignItems: "center",
      justifyContent: "center",
    },
    progressTrack: {
      flex: 1,
      height: 36,
      borderRadius: 18,
      backgroundColor: "rgba(255,255,255,0.12)",
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 10,
      gap: 8,
    },
    progressDot: {
      flex: 1,
      height: 5,
      borderRadius: 99,
      backgroundColor: "rgba(255,255,255,0.28)",
      opacity: 0.7,
    },
    skipButton: {
      minHeight: 36,
      paddingHorizontal: 12,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(255,255,255,0.12)",
    },
    skipText: {
      color: "#FFFFFF",
      fontFamily: FONTS.semiBold,
      fontSize: 13,
    },
    modalSpacer: {
      flex: 1,
      minHeight: 48,
    },
    card: {
      borderRadius: 24,
      padding: 18,
      backgroundColor: "rgba(12,18,30,0.96)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.14)",
      shadowColor: "#000000",
      shadowOpacity: 0.32,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 14 },
      elevation: 12,
    },
    dragHandle: {
      alignSelf: "center",
      width: 46,
      height: 5,
      borderRadius: 99,
      backgroundColor: "rgba(255,255,255,0.28)",
      marginBottom: 14,
    },
    dragHint: {
      alignSelf: "center",
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 999,
      backgroundColor: "rgba(255,255,255,0.12)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.16)",
      marginBottom: 14,
    },
    dragHintText: {
      color: "#FFFFFF",
      fontFamily: FONTS.semiBold,
      fontSize: 12,
    },
    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 12,
    },
    stepBadge: {
      minWidth: 44,
      height: 28,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 10,
    },
    stepBadgeText: {
      color: "#FFFFFF",
      fontFamily: FONTS.bold,
      fontSize: 12,
    },
    routeLabel: {
      color: "rgba(255,255,255,0.72)",
      fontFamily: FONTS.semiBold,
      fontSize: 13,
    },
    title: {
      color: "#FFFFFF",
      fontFamily: FONTS.bold,
      fontSize: 25,
      lineHeight: 30,
      letterSpacing: 0,
    },
    body: {
      color: "rgba(255,255,255,0.74)",
      fontFamily: FONTS.regular,
      fontSize: 15,
      lineHeight: 22,
      marginTop: 8,
    },
    actions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginTop: 18,
    },
    iconButton: {
      width: 50,
      height: 50,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(255,255,255,0.12)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.14)",
    },
    iconButtonDisabled: {
      opacity: 0.35,
    },
    nextButton: {
      flex: 1,
      height: 50,
      borderRadius: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    nextText: {
      color: "#FFFFFF",
      fontFamily: FONTS.bold,
      fontSize: 15,
    },
    spotlight: {
      position: "absolute",
      width: 68,
      height: 68,
      borderRadius: 34,
      borderWidth: 2,
      borderColor: "#FFFFFF",
      backgroundColor: "rgba(255,255,255,0.12)",
    },
  });
}

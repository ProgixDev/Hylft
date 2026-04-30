import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FONTS } from "../../constants/fonts";
import { Theme } from "../../constants/themes";
import { useTheme } from "../../contexts/ThemeContext";

type TabRoute = "home" | "workout" | "alimentation" | "feed" | "profile";
type IconName = keyof typeof Ionicons.glyphMap;
type TutorialRoute = `/(tabs)/${TabRoute}` | "/objective";
type SpotlightKind =
  | "tabBar"
  | "homeConfigure"
  | "objectiveFooter"
  | "objectiveContent";

type TutorialStep = {
  id: string;
  route: TutorialRoute;
  tabRoute?: TabRoute;
  labelKey?: string;
  enLabel: string;
  frLabel: string;
  spotlight: SpotlightKind;
  icon: IconName;
  accent: string;
  enTitle: string;
  frTitle: string;
  enBody: string;
  frBody: string;
  enAction: string;
  frAction: string;
};

const STEPS: TutorialStep[] = [
  {
    id: "home",
    route: "/(tabs)/home",
    tabRoute: "home",
    labelKey: "tabs.home",
    enLabel: "Home",
    frLabel: "Accueil",
    spotlight: "tabBar",
    icon: "sparkles",
    accent: "#38BDF8",
    enTitle: "Your daily command center",
    frTitle: "Votre tableau de bord",
    enBody:
      "See today's health summary, workout week, calories and progress in one quick scan.",
    frBody:
      "Consultez votre sante, votre semaine d'entrainement, vos calories et vos progres en un coup d'oeil.",
    enAction: "Open dashboard",
    frAction: "Voir l'accueil",
  },
  {
    id: "home-week-config",
    route: "/(tabs)/home",
    tabRoute: "home",
    labelKey: "home.configureWeek",
    enLabel: "Configure week",
    frLabel: "Configurer",
    spotlight: "homeConfigure",
    icon: "settings",
    accent: "#06B6D4",
    enTitle: "Configure your workout week",
    frTitle: "Configurez votre semaine",
    enBody:
      "In Sessions This Week, the settings button opens the planner for workout days and day-by-day routines.",
    frBody:
      "Dans Seances de la semaine, le bouton reglages ouvre la configuration des jours d'entrainement et des programmes par jour.",
    enAction: "Week settings",
    frAction: "Reglages semaine",
  },
  {
    id: "objective-days",
    route: "/objective",
    enLabel: "Workout days",
    frLabel: "Jours",
    spotlight: "objectiveFooter",
    icon: "calendar",
    accent: "#14B8A6",
    enTitle: "Choose how often you train",
    frTitle: "Choisissez vos jours",
    enBody:
      "Pick the number of sessions per week, select the exact days, then continue while the tutorial stays on top.",
    frBody:
      "Choisissez le nombre de seances par semaine, selectionnez les jours exacts, puis continuez sans quitter le tutoriel.",
    enAction: "Plan days",
    frAction: "Planifier les jours",
  },
  {
    id: "objective-routines",
    route: "/objective",
    enLabel: "Day programs",
    frLabel: "Programmes",
    spotlight: "objectiveContent",
    icon: "clipboard",
    accent: "#84CC16",
    enTitle: "Assign a program to each day",
    frTitle: "Ajoutez un programme par jour",
    enBody:
      "After choosing days, assign an existing routine to each one or create a new routine for that day.",
    frBody:
      "Apres les jours, associez une routine existante a chaque seance ou creez un nouveau programme pour ce jour.",
    enAction: "Assign routines",
    frAction: "Assigner",
  },
  {
    id: "workout",
    route: "/(tabs)/workout",
    tabRoute: "workout",
    labelKey: "tabs.workout",
    enLabel: "Workout",
    frLabel: "Entrainement",
    spotlight: "tabBar",
    icon: "barbell",
    accent: "#F59E0B",
    enTitle: "Train your way",
    frTitle: "Entrainez-vous a votre facon",
    enBody:
      "Start an empty workout, follow saved routines, or build a custom plan around your goals.",
    frBody:
      "Lancez une seance libre, suivez vos programmes ou creez un plan adapte a vos objectifs.",
    enAction: "Explore training",
    frAction: "Voir l'entrainement",
  },
  {
    id: "alimentation",
    route: "/(tabs)/alimentation",
    tabRoute: "alimentation",
    labelKey: "tabs.alimentation",
    enLabel: "Food",
    frLabel: "Repas",
    spotlight: "tabBar",
    icon: "restaurant",
    accent: "#22C55E",
    enTitle: "Track food without friction",
    frTitle: "Suivez vos repas simplement",
    enBody:
      "Log meals, watch macros, add water and keep your nutrition aligned with your plan.",
    frBody:
      "Ajoutez vos repas, suivez vos macros, votre eau et gardez votre nutrition alignee avec votre plan.",
    enAction: "Open food diary",
    frAction: "Voir les repas",
  },
  {
    id: "feed",
    route: "/(tabs)/feed",
    tabRoute: "feed",
    labelKey: "tabs.feed",
    enLabel: "Feed",
    frLabel: "Fil",
    spotlight: "tabBar",
    icon: "newspaper",
    accent: "#EC4899",
    enTitle: "Share the momentum",
    frTitle: "Partagez votre elan",
    enBody:
      "Post workout wins, follow others and keep the community close when motivation dips.",
    frBody:
      "Publiez vos seances, suivez d'autres sportifs et gardez la communaute pres de vous.",
    enAction: "Visit feed",
    frAction: "Voir le fil",
  },
  {
    id: "profile",
    route: "/(tabs)/profile",
    tabRoute: "profile",
    labelKey: "tabs.profile",
    enLabel: "Profile",
    frLabel: "Profil",
    spotlight: "tabBar",
    icon: "person",
    accent: "#A855F7",
    enTitle: "Own your progress",
    frTitle: "Pilotez vos progres",
    enBody:
      "Update your profile, review your activity and tune settings as your routine evolves.",
    frBody:
      "Mettez a jour votre profil, consultez votre activite et ajustez vos reglages avec le temps.",
    enAction: "Open profile",
    frAction: "Voir le profil",
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
  const { t, i18n } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const isFr = i18n.language?.startsWith("fr");

  const [stepIndex, setStepIndex] = useState(0);
  const step = STEPS[stepIndex];
  const tabWidth = width / TAB_ROUTES.length;
  const spotlightX = useSharedValue(tabWidth / 2);
  const cardOpacity = useSharedValue(0);
  const cardY = useSharedValue(22);
  const overlayOpacity = useSharedValue(0);
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (!visible) {
      overlayOpacity.value = withTiming(0, { duration: 180 });
      return;
    }

    setStepIndex(0);
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
  }, [visible, overlayOpacity, pulse, router]);

  useEffect(() => {
    if (!visible) return;

    const tabIndex = step.tabRoute ? TAB_ROUTES.indexOf(step.tabRoute) : 0;
    const nextX = tabIndex * tabWidth + tabWidth / 2;
    spotlightX.value = withTiming(nextX, {
      duration: 360,
      easing: Easing.out(Easing.cubic),
    });
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
  }, [cardOpacity, cardY, spotlightX, step, tabWidth, visible]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const spotlightStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: spotlightX.value - 34 },
      { scale: interpolate(pulse.value, [0, 1], [1, 1.12]) },
    ],
    opacity: interpolate(pulse.value, [0, 1], [0.9, 0.45]),
  }));

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardY.value }],
  }));

  const goToStep = (index: number) => {
    const nextIndex = Math.max(0, Math.min(index, STEPS.length - 1));
    const nextStep = STEPS[nextIndex];
    setStepIndex(nextIndex);
    router.replace(nextStep.route as any);
  };

  const finish = async () => {
    await onFinish();
  };

  const goNext = () => {
    if (stepIndex === STEPS.length - 1) {
      void finish();
      return;
    }
    goToStep(stepIndex + 1);
  };

  if (!visible) return null;

  const title = isFr ? step.frTitle : step.enTitle;
  const body = isFr ? step.frBody : step.enBody;
  const action = isFr ? step.frAction : step.enAction;
  const label = step.labelKey
    ? t(step.labelKey as any, isFr ? step.frLabel : step.enLabel)
    : isFr
      ? step.frLabel
      : step.enLabel;
  const stepText = `${stepIndex + 1}/${STEPS.length}`;
  const isTabSpotlight = step.spotlight === "tabBar";
  const spotlightPositionStyle =
    step.spotlight === "homeConfigure"
      ? {
          top: insets.top + 86,
          left: width - 91,
        }
      : step.spotlight === "objectiveFooter"
        ? {
            bottom: insets.bottom + 30,
            left: width / 2 - 34,
          }
        : step.spotlight === "objectiveContent"
          ? {
              top: Math.max(insets.top + 150, height * 0.42),
              left: width / 2 - 34,
            }
          : {
              bottom: insets.bottom + 3,
            };

  return (
    <Animated.View
      pointerEvents="auto"
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
                item.labelKey
                  ? t(item.labelKey as any, isFr ? item.frLabel : item.enLabel)
                  : isFr
                    ? item.frLabel
                    : item.enLabel
              } ${index + 1}`}
              onPress={() => goToStep(index)}
              style={[
                styles.progressDot,
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

      <View style={styles.heroArea}>
        <Animated.View
          style={[
            styles.iconHalo,
            { borderColor: step.accent, backgroundColor: step.accent + "22" },
            cardStyle,
          ]}
        >
          <Ionicons name={step.icon} size={36} color={step.accent} />
        </Animated.View>
      </View>

      <Animated.View style={[styles.card, cardStyle]}>
        <View style={styles.cardHeader}>
          <View style={[styles.stepBadge, { backgroundColor: step.accent }]}>
            <Text style={styles.stepBadgeText}>{stepText}</Text>
          </View>
          <Text style={styles.routeLabel}>{label}</Text>
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{body}</Text>

        <View style={styles.featureRail}>
          {STEPS.map((item, index) => {
            const selected = index === stepIndex;
            return (
              <Pressable
                key={item.id}
                onPress={() => goToStep(index)}
                style={[
                  styles.featurePill,
                  selected && {
                    ...styles.featurePillActive,
                    backgroundColor: item.accent,
                    borderColor: item.accent,
                  },
                ]}
              >
                <Ionicons
                  name={item.icon}
                  size={16}
                  color={selected ? "#FFFFFF" : "rgba(255,255,255,0.76)"}
                />
                {selected && (
                  <Text style={styles.featureText} numberOfLines={1}>
                    {action}
                  </Text>
                )}
              </Pressable>
            );
          })}
        </View>

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
            style={({ pressed }) => [
              styles.nextButton,
              { backgroundColor: step.accent },
              pressed && { transform: [{ scale: 0.98 }] },
            ]}
          >
            <Text style={styles.nextText}>
              {stepIndex === STEPS.length - 1
                ? t("common.done")
                : t("common.next")}
            </Text>
            <Ionicons
              name={stepIndex === STEPS.length - 1 ? "checkmark" : "arrow-forward"}
              size={19}
              color="#FFFFFF"
            />
          </Pressable>
        </View>
      </Animated.View>

      <Animated.View
        pointerEvents="none"
        style={[
          styles.spotlight,
          spotlightPositionStyle,
          isTabSpotlight && spotlightStyle,
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
    heroArea: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      minHeight: 160,
    },
    iconHalo: {
      width: 118,
      height: 118,
      borderRadius: 59,
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center",
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
    featureRail: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: 18,
      minHeight: 38,
    },
    featurePill: {
      width: 38,
      height: 38,
      borderRadius: 19,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.16)",
      backgroundColor: "rgba(255,255,255,0.09)",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 7,
    },
    featurePillActive: {
      flex: 1,
      width: undefined,
      paddingHorizontal: 10,
    },
    featureText: {
      flexShrink: 1,
      color: "#FFFFFF",
      fontFamily: FONTS.semiBold,
      fontSize: 12,
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

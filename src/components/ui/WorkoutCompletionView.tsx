import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dimensions,
  ImageSourcePropType,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FONTS } from "../../constants/fonts";
import { Theme } from "../../constants/themes";

const { height: SCREEN_H } = Dimensions.get("window");
const HERO_IMAGE = require("../../../assets/images/OnBoarding/ManLookingUp.jpg");
const SCREEN_BLACK = "#000000";
const SURFACE_DARK = "#24242D";
const SURFACE_SELECTED = "#2D2D37";
const TEXT_WHITE = "#FFFFFF";
const TEXT_MUTED = "rgba(255,255,255,0.56)";
const BLUE = "#0B7DFF";

type Effort = "hard" | "right" | "easy";

interface WorkoutCompletionViewProps {
  theme: Theme;
  routineName: string;
  exercises: number;
  calories: number;
  duration: string;
  heroImage?: ImageSourcePropType;
  onFinish: () => void;
}

export default function WorkoutCompletionView({
  theme,
  routineName,
  exercises,
  calories,
  duration,
  heroImage = HERO_IMAGE,
  onFinish,
}: WorkoutCompletionViewProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const styles = createStyles(theme, insets.top, insets.bottom);
  const [effort, setEffort] = useState<Effort | null>("right");

  return (
    <View style={styles.root}>
      <View style={styles.hero}>
        <Image source={heroImage} style={styles.heroImage} contentFit="cover" />
        <LinearGradient
          colors={[
            "rgba(0,0,0,0.05)",
            "rgba(0,0,0,0.42)",
            SCREEN_BLACK,
          ]}
          locations={[0, 0.48, 1]}
          style={StyleSheet.absoluteFill}
        />
        <Text style={styles.title}>
          {t("workoutPlayer.workoutComplete").toUpperCase()}
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.summaryBlock}>
          <Text style={styles.routineName} numberOfLines={2}>
            {routineName.toUpperCase()}
          </Text>

          <View style={styles.statsRow}>
            <CompletionStat
              value={String(exercises)}
              label={t("workoutPlayer.exercises", "Exercises")}
            />
            <View style={styles.statDivider} />
            <CompletionStat
              value={String(calories)}
              label={t("workoutPlayer.calories", "Calories")}
            />
            <View style={styles.statDivider} />
            <CompletionStat
              value={duration}
              label={t("routines.duration")}
            />
          </View>

          <View style={styles.sectionDivider} />

          <Text style={styles.feelTitle}>
            {t("workoutPlayer.howDoYouFeel", "How do you feel")}
          </Text>
          <View style={styles.feelRow}>
            <FeelButton
              effort="hard"
              selected={effort === "hard"}
              layers={3}
              label={t("workoutPlayer.feelHard", "Hard")}
              theme={theme}
              onPress={() => setEffort("hard")}
            />
            <FeelButton
              effort="right"
              selected={effort === "right"}
              layers={2}
              label={t("workoutPlayer.feelRight", "Just right")}
              theme={theme}
              onPress={() => setEffort("right")}
            />
            <FeelButton
              effort="easy"
              selected={effort === "easy"}
              layers={1}
              label={t("workoutPlayer.feelEasy", "Easy")}
              theme={theme}
              onPress={() => setEffort("easy")}
            />
          </View>
        </View>

        <View style={styles.footer}>
          <Pressable style={styles.finishButton} onPress={onFinish}>
            <Text style={styles.finishText}>
              {t("workoutPlayer.finish").toUpperCase()}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function CompletionStat({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  const styles = statStyles();
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function FeelButton({
  selected,
  layers,
  label,
  theme,
  onPress,
}: {
  effort: Effort;
  selected: boolean;
  layers: number;
  label: string;
  theme: Theme;
  onPress: () => void;
}) {
  const styles = statStyles(theme);
  return (
    <Pressable style={styles.feelItem} onPress={onPress}>
      <View style={[styles.feelCircle, selected && styles.feelCircleSelected]}>
        <LayerIcon layers={layers} color={TEXT_WHITE} />
      </View>
      <Text style={[styles.feelLabel, selected && styles.feelLabelSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

function LayerIcon({ layers, color }: { layers: number; color: string }) {
  return (
    <View style={layerIconStyles.wrap}>
      {Array.from({ length: layers }).map((_, index) => (
        <Ionicons
          key={index}
          name="layers"
          size={26 - index * 3}
          color={color}
          style={[
            layerIconStyles.layer,
            { opacity: 1 - index * 0.22, transform: [{ translateY: index * 7 }] },
          ]}
        />
      ))}
    </View>
  );
}

const createStyles = (theme: Theme, topInset: number, bottomInset: number) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: SCREEN_BLACK,
    },
    hero: {
      width: "100%",
      height: Math.max(260, Math.min(330, SCREEN_H * 0.39)),
      paddingTop: topInset + 18,
      paddingHorizontal: 0,
      justifyContent: "flex-end",
      overflow: "hidden",
    },
    heroImage: {
      ...StyleSheet.absoluteFillObject,
      width: "100%",
      height: "100%",
    },
    title: {
      color: TEXT_WHITE,
      fontSize: 42,
      lineHeight: 49,
      fontFamily: FONTS.extraBold,
      marginBottom: 18,
      marginHorizontal: 24,
      maxWidth: 330,
    },
    content: {
      flex: 1,
      backgroundColor: SCREEN_BLACK,
      paddingHorizontal: 24,
      paddingTop: 2,
      paddingBottom: bottomInset + 8,
    },
    summaryBlock: {
      flexShrink: 1,
    },
    routineName: {
      color: TEXT_WHITE,
      fontSize: 24,
      lineHeight: 30,
      fontFamily: FONTS.extraBold,
      marginBottom: 14,
    },
    statsRow: {
      flexDirection: "row",
      alignItems: "center",
      minHeight: 58,
    },
    statDivider: {
      width: StyleSheet.hairlineWidth,
      height: 50,
      backgroundColor: "rgba(255,255,255,0.16)",
      marginHorizontal: 14,
    },
    sectionDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: "rgba(255,255,255,0.12)",
      marginTop: 14,
      marginBottom: 16,
    },
    feelTitle: {
      color: TEXT_WHITE,
      fontSize: 18,
      fontFamily: FONTS.bold,
      marginBottom: 14,
    },
    feelRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 12,
    },
    footer: {
      marginTop: "auto",
      paddingTop: 8,
      backgroundColor: SCREEN_BLACK,
    },
    finishButton: {
      height: 66,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: BLUE,
    },
    finishText: {
      color: TEXT_WHITE,
      fontSize: 19,
      fontFamily: FONTS.extraBold,
    },
  });

const statStyles = (theme?: Theme) =>
  StyleSheet.create({
    statItem: {
      flex: 1,
      alignItems: "flex-start",
    },
    statValue: {
      color: TEXT_WHITE,
      fontSize: 30,
      lineHeight: 35,
      fontFamily: FONTS.extraBold,
    },
    statLabel: {
      color: TEXT_MUTED,
      fontSize: 14,
      fontFamily: FONTS.medium,
      marginTop: 2,
    },
    feelItem: {
      width: "31%",
      alignItems: "center",
    },
    feelCircle: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: SURFACE_DARK,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: "transparent",
    },
    feelCircleSelected: {
      borderColor: theme?.primary.main ?? BLUE,
      backgroundColor: SURFACE_SELECTED,
    },
    feelLabel: {
      color: "rgba(255,255,255,0.7)",
      fontSize: 15,
      fontFamily: FONTS.medium,
      marginTop: 10,
      textAlign: "center",
    },
    feelLabelSelected: {
      color: TEXT_WHITE,
    },
  });

const layerIconStyles = StyleSheet.create({
  wrap: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  layer: {
    position: "absolute",
  },
});

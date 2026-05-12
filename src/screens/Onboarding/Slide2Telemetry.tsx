import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import Svg, { Line, Rect } from "react-native-svg";
import HudCorners from "./HudCorners";
import BackgroundNumeral from "./BackgroundNumeral";
import HudRing from "../../components/onboarding/HudRing";
import GlassCard from "../../components/onboarding/GlassCard";
import GradientText from "../../components/onboarding/GradientText";
import { colors } from "../../theme/colors";
import { fontFamilies, type } from "../../theme/typography";
import { spacing } from "../../theme/spacing";

type Props = {
  titleStart: string;
  accent: string;
  subtitle: string;
  todayLabel: string;
  goalLabel: string;
  mealLabel: string;
  mealDesc: string;
  workoutLabel: string;
  workoutDesc: string;
};

export default function Slide2Telemetry({
  titleStart,
  accent,
  subtitle,
  todayLabel,
  goalLabel,
  mealLabel,
  mealDesc,
  workoutLabel,
  workoutDesc,
}: Props) {
  return (
    <View style={styles.root}>
      <HudCorners />
      <BackgroundNumeral value="02" />

      <View style={styles.body}>
        <View style={styles.heroWrap}>
          <HudRing
            topLabel={todayLabel}
            value="1,847"
            goal={goalLabel}
            size={260}
          />
        </View>

        <View style={styles.glassStack}>
          <GlassCard>
            <Image
              source={{
                uri: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=200&q=80&auto=format&fit=crop",
              }}
              style={styles.thumb}
            />
            <View style={styles.meta}>
              <Text style={styles.metaLabel}>{mealLabel}</Text>
              <Text style={styles.metaSub}>{mealDesc}</Text>
            </View>
            <Text style={styles.value}>420</Text>
          </GlassCard>

          <GlassCard>
            <View style={styles.iconBox}>
              <DumbbellIcon />
            </View>
            <View style={styles.meta}>
              <Text style={styles.metaLabel}>{workoutLabel}</Text>
              <Text style={styles.metaSub}>{workoutDesc}</Text>
            </View>
            <Text style={styles.value}>+312</Text>
          </GlassCard>
        </View>

        <View style={styles.copy}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{titleStart} </Text>
            <GradientText text={accent} style={styles.title} />
          </View>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>

        <View style={styles.ctaZone} />
      </View>
    </View>
  );
}

function DumbbellIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 16 16">
      <Line
        x1={2}
        y1={8}
        x2={14}
        y2={8}
        stroke={colors.blueLight}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Rect x={1} y={5} width={2.5} height={6} rx={0.5} fill={colors.blueLight} />
      <Rect x={12.5} y={5} width={2.5} height={6} rx={0.5} fill={colors.blueLight} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    position: "relative",
  },
  body: {
    position: "absolute",
    top: 80,
    bottom: 24,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.screenPaddingH,
    flexDirection: "column",
  },
  heroWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: spacing.heroMinHeight,
    paddingTop: 8,
    paddingBottom: 12,
  },
  glassStack: {
    width: "100%",
    flexDirection: "column",
    gap: 10,
    paddingHorizontal: 4,
    paddingTop: 4,
    paddingBottom: 8,
  },
  thumb: {
    width: 36,
    height: 36,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "rgba(139,179,255,0.25)",
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(139,179,255,0.25)",
    backgroundColor: "rgba(45,127,249,0.12)",
  },
  meta: {
    flex: 1,
    minWidth: 0,
  },
  metaLabel: {
    color: colors.white,
    fontFamily: fontFamilies.inter700,
    fontSize: 10.5,
    letterSpacing: 0.42,
    textTransform: "uppercase",
  },
  metaSub: {
    color: "rgba(199,211,230,0.7)",
    fontFamily: fontFamilies.mono700,
    fontSize: 9,
    marginTop: 2,
  },
  value: {
    fontFamily: fontFamilies.mono700,
    fontSize: 11,
    color: colors.blue,
    textShadowColor: "rgba(45,127,249,0.6)",
    textShadowRadius: 8,
  },
  copy: {
    paddingTop: 10,
    paddingBottom: 8,
  },
  titleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "baseline",
  },
  title: {
    ...type.h1,
    color: colors.white,
  },
  subtitle: {
    ...type.body,
    color: colors.tintOnDarkSoft,
    marginTop: 8,
  },
  ctaZone: {
    paddingTop: 18,
    paddingBottom: 14,
    minHeight: 76,
  },
});

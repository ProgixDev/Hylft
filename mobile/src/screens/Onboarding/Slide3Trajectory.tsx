import React from "react";
import { StyleSheet, Text, View } from "react-native";
import HudCorners from "./HudCorners";
import BackgroundNumeral from "./BackgroundNumeral";
import EyebrowChip from "../../components/onboarding/EyebrowChip";
import GradientText from "../../components/onboarding/GradientText";
import TrajectoryChart from "../../components/onboarding/TrajectoryChart";
import { colors } from "../../theme/colors";
import { type } from "../../theme/typography";
import { spacing } from "../../theme/spacing";

type Props = {
  eyebrow: string;
  badgeLabel: string;
  peakLabel: string;
  titleStart: string;
  accent: string;
  subtitle: string;
};

export default function Slide3Trajectory({
  eyebrow,
  badgeLabel,
  peakLabel,
  titleStart,
  accent,
  subtitle,
}: Props) {
  return (
    <View style={styles.root}>
      <HudCorners />
      <BackgroundNumeral value="03" />

      <View style={styles.body}>
        <View style={styles.hero}>
          <TrajectoryChart
            badgeLabel={badgeLabel}
            peakLabel={peakLabel}
            width={280}
            height={220}
          />
        </View>

        <View style={styles.copy}>
          <EyebrowChip label={eyebrow} />
          <View style={styles.titleRow}>
            <Text style={styles.title}>{titleStart} </Text>
            <GradientText text={accent} style={styles.title} />
          </View>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
      </View>
    </View>
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
  hero: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: spacing.heroMinHeight,
  },
  copy: {
    paddingBottom: 24,
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
});

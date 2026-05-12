import React, { useEffect } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import HudCorners from "./HudCorners";
import BackgroundNumeral from "./BackgroundNumeral";
import GradientText from "../../components/onboarding/GradientText";
import { colors } from "../../theme/colors";
import { fontFamilies, type } from "../../theme/typography";
import { spacing, timings } from "../../theme/spacing";

type Props = {
  eyebrow?: string;
  titleStart: string;
  brand: string;
  subtitle: string;
};

const HERO_DIAMETER = 280;
const ORBIT_DIAMETER = 340;

export default function Slide1Welcome({
  titleStart,
  brand,
  subtitle,
}: Props) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, {
        duration: timings.orbitSpinMs,
        easing: Easing.linear,
      }),
      -1,
      false,
    );
  }, [rotation]);

  const dashedRingStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View style={styles.root}>
      <HudCorners />
      <BackgroundNumeral value="01" />

      <View style={styles.body}>
        <View style={styles.hero}>
          <View style={styles.orbit}>
            <View style={[styles.orbitDot, styles.orbitDotTop]} />
            <View style={[styles.orbitDot, styles.orbitDotBottomRight]} />
          </View>

          <View style={styles.heroImageWrap}>
            <View style={styles.heroImage}>
              <Image
                source={require("../../../assets/images/OnBoarding/ManWithTwoWeights.jpg")}
                style={styles.image}
                resizeMode="cover"
              />
            </View>
            <Animated.View
              pointerEvents="none"
              style={[styles.dashedRing, dashedRingStyle]}
            />
          </View>
        </View>

        <View style={styles.copy}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{titleStart} </Text>
            <GradientText text={brand} style={styles.title} />
          </View>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>

        <View style={styles.ctaZone} />
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
    position: "relative",
  },
  orbit: {
    position: "absolute",
    width: ORBIT_DIAMETER,
    height: ORBIT_DIAMETER,
    borderRadius: ORBIT_DIAMETER / 2,
    borderWidth: 1,
    borderColor: "rgba(139,179,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  orbitDot: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.blue,
    shadowColor: colors.blue,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 6,
  },
  orbitDotTop: {
    top: -4,
    alignSelf: "center",
  },
  orbitDotBottomRight: {
    bottom: -4,
    right: ORBIT_DIAMETER * 0.3 - 4,
  },
  heroImageWrap: {
    width: HERO_DIAMETER,
    height: HERO_DIAMETER,
    borderRadius: HERO_DIAMETER / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  heroImage: {
    width: HERO_DIAMETER,
    height: HERO_DIAMETER,
    borderRadius: HERO_DIAMETER / 2,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(139,179,255,0.35)",
    shadowColor: colors.blue,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 60,
    elevation: 12,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  dashedRing: {
    position: "absolute",
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: (HERO_DIAMETER + 16) / 2,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(139,179,255,0.5)",
  },
  copy: {
    paddingBottom: 8,
  },
  titleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "baseline",
  },
  title: {
    ...type.h1,
    fontFamily: fontFamilies.inter800,
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

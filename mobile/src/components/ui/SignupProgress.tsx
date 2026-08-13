import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View, Easing } from "react-native";
import { Text } from "./ScaledText";
import { useTranslation } from "react-i18next";
import { FONTS } from "../../constants/fonts";

const MAIN = "#102b4a";

interface Props {
  current: number;
  total: number;
}

export function SignupProgress({ current, total }: Props) {
  const { t } = useTranslation();
  const pct = Math.max(0, Math.min(1, current / total));
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: pct,
      duration: 360,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [pct, anim]);

  const width = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  const stepLabel = t("onboarding.stepOf", {
    current: String(current).padStart(2, "0"),
    total,
  });

  return (
    <View style={styles.container}>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, { width }]} />
      </View>
      <Text style={styles.label}>{stepLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    marginBottom: 20,
  },
  track: {
    height: 7,
    borderRadius: 100,
    backgroundColor: "#E5E7EB",
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 100,
    backgroundColor: MAIN,
  },
  label: {
    marginTop: 10,
    fontSize: 11,
    fontFamily: FONTS.semiBold,
    color: "#9CA3AF",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
});

export default SignupProgress;

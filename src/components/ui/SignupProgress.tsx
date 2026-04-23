import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View, Easing } from "react-native";
import { FONTS } from "../../constants/fonts";
import { useTheme } from "../../contexts/ThemeContext";

interface Props {
  current: number;
  total: number;
}

export function SignupProgress({ current, total }: Props) {
  const { theme } = useTheme();
  const pct = Math.max(0, Math.min(1, current / total));
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: pct,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [pct, anim]);

  const width = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={styles.row}>
      <Text style={[styles.text, { color: theme.primary.main }]}>
        {`STEP ${current} OF ${total}`}
      </Text>
      <View style={[styles.bar, { backgroundColor: theme.background.accent }]}>
        <Animated.View
          style={[
            styles.fill,
            { backgroundColor: theme.primary.main, width },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginBottom: 14,
    marginTop: 4,
  },
  text: {
    fontSize: 11,
    fontFamily: FONTS.bold,
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  bar: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 2,
  },
});

export default SignupProgress;

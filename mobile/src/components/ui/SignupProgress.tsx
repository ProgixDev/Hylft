import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View, Easing } from "react-native";

interface Props {
  current: number;
  total: number;
}

export function SignupProgress({ current, total }: Props) {
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

  return (
    <View style={styles.container}>
      <View style={styles.track}>
        <Animated.View
          style={[
            styles.fill,
            {
              backgroundColor: "#20F0B2",
              width,
              shadowColor: "#20F0B2",
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
    marginTop: 8,
    paddingHorizontal: 2,
  },
  track: {
    height: 13,
    borderRadius: 999,
    backgroundColor: "#E5E7EB",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.08)",
  },
  fill: {
    height: "100%",
    borderRadius: 999,
    shadowOpacity: 0.65,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
});

export default SignupProgress;

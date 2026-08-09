import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Animated,
  Easing,
  Image,
  ImageSourcePropType,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import SignupProgress from "../../components/ui/SignupProgress";
import { FONTS } from "../../constants/fonts";
import { useTheme } from "../../contexts/ThemeContext";


const GOALS: {
  id: "lose_weight" | "maintain" | "gain_weight" | "build_muscle";
  image: ImageSourcePropType;
  iconBg: string;
  recommended?: boolean;
}[] = [
  {
    id: "lose_weight",
    image: require("../../../assets/weight__loss.gif"),
    iconBg: "#FEF9EE",
    recommended: true,
  },
  {
    id: "maintain",
    image: require("../../../assets/maintain_weight.gif"),
    iconBg: "#EFF6FF",
  },
  {
    id: "gain_weight",
    image: require("../../../assets/weight_gain.gif"),
    iconBg: "#F5F3FF",
  },
  {
    id: "build_muscle",
    image: require("../../../assets/muscle_gain.gif"),
    iconBg: "#F0FDF4",
  },
];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function GoalCard({
  g,
  index,
  isSelected,
  onPress,
  t,
}: {
  g: (typeof GOALS)[number];
  index: number;
  isSelected: boolean;
  onPress: () => void;
  t: (key: string) => string;
}) {
  const { theme } = useTheme();
  const primaryColor = theme.primary.main;

  const scale = useRef(new Animated.Value(1)).current;
  const entrance = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(entrance, {
      toValue: 1,
      delay: 120 + index * 80,
      tension: 55,
      friction: 9,
      useNativeDriver: true,
    }).start();
  }, [entrance, index]);

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 40,
      bounciness: 0,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 6,
    }).start();
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      hitSlop={8}
      style={[
        styles.buttonShell,
        {
          opacity: entrance,
          transform: [
            {
              translateY: entrance.interpolate({
                inputRange: [0, 1],
                outputRange: [18, 0],
              }),
            },
            { scale },
          ],
        },
      ]}
    >
      <View
        style={[
          styles.buttonFace,
          {
            backgroundColor: isSelected ? primaryColor + "18" : theme.background.darker,
            borderColor: isSelected ? primaryColor : theme.background.accent,
          },
        ]}
      >
        <View style={styles.leftCluster}>
          <View style={[styles.iconWrap, { backgroundColor: isSelected ? primaryColor + "20" : theme.background.accent }]}>
            <Image source={g.image} style={styles.goalImage} />
          </View>

          <View style={styles.buttonCopy}>
            <Text
              style={[styles.buttonTitle, { color: theme.foreground.white }]}
              numberOfLines={2}
              adjustsFontSizeToFit
              minimumFontScale={0.82}
            >
              {t(`onboarding.goalFlow.options.${g.id}.label`)}
            </Text>
            {g.recommended && (
              <View style={[styles.tag, { borderColor: primaryColor + "40", backgroundColor: primaryColor + "15" }]}>
                <Text style={[styles.tagText, { color: primaryColor }]}>
                  {t("onboarding.goalFlow.popular")}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.arrowBadge}>
          <Ionicons
            name={isSelected ? "checkmark-circle" : "chevron-forward"}
            size={isSelected ? 28 : 22}
            color={isSelected ? primaryColor : theme.foreground.gray}
          />
        </View>
      </View>
    </AnimatedPressable>
  );
}

export default function GoalScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [selected, setSelected] = useState<string>("");
  const [isNavigating, setIsNavigating] = useState(false);

  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(28)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 440,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slide, {
        toValue: 0,
        duration: 440,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fade, slide]);

  const handleSelect = async (id: string) => {
    if (isNavigating) return;
    setSelected(id);
    setIsNavigating(true);
    try {
      await AsyncStorage.setItem("@hylift_goal", id);
    } finally {
      router.push("/get-started/habits");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background.dark }]}>
      <Animated.View
        style={{ flex: 1, opacity: fade, transform: [{ translateY: slide }] }}
      >
        <SignupProgress current={2} total={13} />

        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.foreground.white }]}>{t("onboarding.goalFlow.title")}</Text>
        </View>

        <View style={styles.list}>
          {GOALS.map((g, index) => (
            <GoalCard
              key={g.id}
              g={g}
              index={index}
              isSelected={selected === g.id}
              onPress={() => void handleSelect(g.id)}
              t={t}
            />
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontFamily: FONTS.extraBold,
    lineHeight: 32,
  },
  list: {
    gap: 12,
  },
  buttonShell: {
    borderRadius: 16,
  },
  buttonFace: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 88,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  leftCluster: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingRight: 14,
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  goalImage: {
    width: 50,
    height: 50,
    resizeMode: "contain",
  },
  buttonCopy: {
    flex: 1,
  },
  buttonTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontFamily: FONTS.extraBold,
  },
  tag: {
    alignSelf: "flex-start",
    marginTop: 6,
    borderWidth: 1,
    borderRadius: 100,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  tagText: {
    fontSize: 10,
    fontFamily: FONTS.bold,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  arrowBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
});

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
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import SignupProgress from "../../components/ui/SignupProgress";
import { FONTS } from "../../constants/fonts";

const GOALS: {
  id: "lose_weight" | "maintain" | "gain_weight" | "build_muscle";
  image: ImageSourcePropType;
  accent: string;
  depth: string;
  tint: string;
  recommended?: boolean;
}[] = [
  {
    id: "lose_weight",
    image: require("../../../assets/weight__loss.gif"),
    accent: "#F97316",
    depth: "#C2410C",
    tint: "#FFF1E6",
    recommended: true,
  },
  {
    id: "maintain",
    image: require("../../../assets/maintain_weight.gif"),
    accent: "#3B82F6",
    depth: "#1D5FC4",
    tint: "#EDF4FF",
  },
  {
    id: "gain_weight",
    image: require("../../../assets/weight_gain.gif"),
    accent: "#8B5CF6",
    depth: "#6D28D9",
    tint: "#F3EEFF",
  },
  {
    id: "build_muscle",
    image: require("../../../assets/muscle_gain.gif"),
    accent: "#14B8A6",
    depth: "#0F766E",
    tint: "#E8FAF7",
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
  const scale = useRef(new Animated.Value(1)).current;
  const pressDepth = useRef(new Animated.Value(0)).current;
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
      toValue: 0.99,
      useNativeDriver: true,
      speed: 40,
      bounciness: 0,
    }).start();
    Animated.spring(pressDepth, {
      toValue: 7,
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
    Animated.spring(pressDepth, {
      toValue: 0,
      useNativeDriver: true,
      speed: 26,
      bounciness: 6,
    }).start();
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      hitSlop={8}
      android_ripple={{ color: "rgba(255,255,255,0.18)" }}
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
      <View style={[styles.buttonBase, { backgroundColor: g.depth }]}>
        <Animated.View
          style={[
            styles.buttonFace,
            {
              backgroundColor: g.accent,
              transform: [{ translateY: pressDepth }],
            },
          ]}
        >
          <View style={styles.leftCluster}>
            <View style={[styles.iconWrap, { backgroundColor: g.tint }]}>
              <Image source={g.image} style={styles.goalImage} />
            </View>

            <View style={styles.buttonCopy}>
              <Text
                style={styles.buttonTitle}
                numberOfLines={2}
                adjustsFontSizeToFit
                minimumFontScale={0.82}
              >
                {t(`onboarding.goalFlow.options.${g.id}.label`)}
              </Text>
              {g.recommended && (
                <View style={styles.tag}>
                  <Text style={styles.tagText}>
                    {t("onboarding.goalFlow.popular")}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.arrowBadge}>
            <Ionicons
              name={isSelected ? "checkmark" : "chevron-forward"}
              size={26}
              color="#FFFFFF"
            />
          </View>
        </Animated.View>
      </View>
    </AnimatedPressable>
  );
}

export default function GoalScreen() {
  const router = useRouter();
  const { t } = useTranslation();
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
    <View style={styles.container}>
      <Animated.View
        style={{ flex: 1, opacity: fade, transform: [{ translateY: slide }] }}
      >
        <SignupProgress current={2} total={13} />

        <View style={styles.header}>
          <Text style={styles.title}>{t("onboarding.goalFlow.title")}</Text>
          <Text style={styles.subtitle}>
            {t("onboarding.goalFlow.subtitle")}
          </Text>
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
    backgroundColor: "#FBFCFA",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontFamily: FONTS.extraBold,
    color: "#111827",
    marginBottom: 6,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 14,
    color: "#64748B",
    lineHeight: 21,
  },
  list: {
    gap: 16,
  },
  buttonShell: {
    borderRadius: 24,
    ...Platform.select({
      ios: {
        shadowColor: "#102018",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  buttonBase: {
    borderRadius: 24,
    paddingBottom: 10,
    overflow: "hidden",
  },
  buttonFace: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 92,
    borderRadius: 24,
    paddingHorizontal: 18,
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
    width: 64,
    height: 64,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.55)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  goalImage: {
    width: 54,
    height: 54,
    resizeMode: "contain",
  },
  buttonCopy: {
    flex: 1,
  },
  buttonTitle: {
    color: "#FFFFFF",
    fontSize: 23,
    lineHeight: 28,
    fontFamily: FONTS.extraBold,
  },
  tag: {
    alignSelf: "flex-start",
    marginTop: 7,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.55)",
    borderRadius: 100,
    paddingHorizontal: 9,
    paddingVertical: 3,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  tagText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontFamily: FONTS.bold,
    letterSpacing: 0.2,
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

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { FONTS } from "../../constants/fonts";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { supabase } from "../../services/supabase";

const gifSource = require("../../../assets/celebration.gif");

const { width: SW } = Dimensions.get("window");
const CIRCLE = 200;
const RING = CIRCLE + 60;

export default function Ready() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user, setGetStartedCompleted } = useAuth();
  const { t } = useTranslation();

  const scale = useRef(new Animated.Value(0.5)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;
  const textY = useRef(new Animated.Value(36)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, friction: 5, tension: 70, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(textY, { toValue: 0, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(textOpacity, { toValue: 1, duration: 420, useNativeDriver: true }),
      ]),
    ]).start();

    const startRing = (anim: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1, duration: 2200, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
        ]),
      ).start();
    };

    startRing(ring1, 0);
    startRing(ring2, 1100);
  }, []);

  useEffect(() => {
    const saveProfile = async () => {
      setGetStartedCompleted();

      if (user) {
        const [
          age, heightCm, weightKg, targetWeightKg, gender,
          fitnessGoals, experienceLevel, workoutFrequency, focusAreas, unitSystem,
        ] = await Promise.all([
          AsyncStorage.getItem("@hylift_age"),
          AsyncStorage.getItem("@hylift_height"),
          AsyncStorage.getItem("@hylift_weight"),
          AsyncStorage.getItem("@hylift_target_weight"),
          AsyncStorage.getItem("@hylift_gender"),
          AsyncStorage.getItem("@hylift_fitness_goals"),
          AsyncStorage.getItem("@hylift_experience_level"),
          AsyncStorage.getItem("@hylift_workout_frequency"),
          AsyncStorage.getItem("@hylift_focus_areas"),
          AsyncStorage.getItem("@hylift_unit_system"),
        ]);

        let dateOfBirth: string | null = null;
        if (age) {
          const now = new Date();
          now.setFullYear(now.getFullYear() - parseInt(age, 10));
          dateOfBirth = now.toISOString().split("T")[0];
        }

        await supabase.from("user_profiles").upsert({
          id: user.id,
          username: user.user_metadata?.username || "user_" + user.id.substring(0, 8),
          unit_system: unitSystem || null,
          height_cm: heightCm ? parseFloat(heightCm) : null,
          weight_kg: weightKg ? parseFloat(weightKg) : null,
          target_weight_kg: targetWeightKg ? parseFloat(targetWeightKg) : null,
          date_of_birth: dateOfBirth,
          gender: gender || null,
          fitness_goal: fitnessGoals || null,
          experience_level: experienceLevel || null,
          workout_frequency: workoutFrequency ? parseInt(workoutFrequency, 10) : null,
          focus_areas: focusAreas ? JSON.parse(focusAreas) : null,
          onboarding_completed: true,
        });
      }
    };

    saveProfile();

    const timer = setTimeout(() => {
      router.navigate("/(tabs)/home");
    }, 2800);

    return () => clearTimeout(timer);
  }, [router]);

  const makeRing = (anim: Animated.Value) => ({
    scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 2] }),
    opacity: anim.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 0.55, 0] }),
  });

  const r1 = makeRing(ring1);
  const r2 = makeRing(ring2);
  const isLight = theme.background.dark === "#FFFFFF" || theme.background.dark === "#FFF8F3";

  return (
    <View style={[s.root, { backgroundColor: theme.background.dark }]}>
      <LinearGradient
        colors={[theme.primary.main + "35", theme.background.dark + "00"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.65 }}
      />
      <View
        style={[
          s.ambient,
          { backgroundColor: theme.primary.main + (isLight ? "20" : "28") },
        ]}
      />

      <View style={s.visualZone}>
        {[r1, r2].map((r, i) => (
          <Animated.View
            key={i}
            style={[
              s.ring,
              {
                borderColor: theme.primary.main,
                opacity: r.opacity,
                transform: [{ scale: r.scale }],
              },
            ]}
          />
        ))}

        <View
          style={[
            s.innerGlow,
            { backgroundColor: theme.primary.main + (isLight ? "15" : "20") },
          ]}
        />

        <Animated.View
          style={[
            s.circle,
            {
              backgroundColor: theme.primary.main + (isLight ? "18" : "22"),
              borderColor: theme.primary.main + "55",
              opacity,
              transform: [{ scale }],
            },
          ]}
        >
          {gifSource ? (
            <Image source={gifSource} style={s.gif} contentFit="contain" />
          ) : (
            <View style={[s.iconBadge, { backgroundColor: theme.primary.main }]}>
              <Ionicons name="rocket" size={76} color="#fff" />
            </View>
          )}
        </Animated.View>
      </View>

      <Animated.View
        style={[
          s.textZone,
          {
            opacity: textOpacity,
            transform: [{ translateY: textY }],
          },
        ]}
      >
        <View
          style={[
            s.pill,
            {
              backgroundColor: theme.primary.main + "18",
              borderColor: theme.primary.main + "50",
            },
          ]}
        >
          <Text style={[s.pillText, { color: theme.primary.main }]}>
            All Set
          </Text>
        </View>

        <Text style={[s.headline, { color: theme.foreground.white }]}>
          {t("onboarding.ready.title")}
        </Text>
        <Text style={[s.message, { color: theme.foreground.gray }]}>
          {t("onboarding.ready.subtitle")}
        </Text>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, overflow: "hidden" },
  ambient: {
    position: "absolute",
    width: SW * 1.5,
    height: SW * 1.5,
    borderRadius: SW * 0.75,
    top: -SW * 0.6,
    alignSelf: "center",
  },
  visualZone: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    position: "absolute",
    width: RING,
    height: RING,
    borderRadius: RING / 2,
    borderWidth: 1.5,
  },
  innerGlow: {
    position: "absolute",
    width: CIRCLE + 28,
    height: CIRCLE + 28,
    borderRadius: (CIRCLE + 28) / 2,
  },
  circle: {
    width: CIRCLE,
    height: CIRCLE,
    borderRadius: CIRCLE / 2,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  gif: { width: CIRCLE - 16, height: CIRCLE - 16 },
  iconBadge: {
    width: CIRCLE - 16,
    height: CIRCLE - 16,
    borderRadius: (CIRCLE - 16) / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  textZone: {
    alignItems: "center",
    paddingHorizontal: 28,
    paddingBottom: 60,
  },
  pill: {
    borderWidth: 1,
    borderRadius: 100,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 20,
  },
  pillText: {
    fontSize: 11,
    fontFamily: FONTS.bold,
    letterSpacing: 2.5,
    textTransform: "uppercase",
  },
  headline: {
    fontSize: 32,
    fontFamily: FONTS.extraBold,
    textAlign: "center",
    marginBottom: 12,
    lineHeight: 40,
  },
  message: {
    fontSize: 15,
    fontFamily: FONTS.regular,
    textAlign: "center",
    lineHeight: 24,
  },
});

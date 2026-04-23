import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ChipButton from "../../components/ui/ChipButton";
import SignupProgress from "../../components/ui/SignupProgress";
import { FONTS } from "../../constants/fonts";
import { Theme } from "../../constants/themes";
import { useTheme } from "../../contexts/ThemeContext";

const LEVELS: {
  id: "sedentary" | "light" | "moderate" | "active" | "very_active";
  icon: keyof typeof Ionicons.glyphMap;
  dots: number;
}[] = [
  { id: "sedentary", icon: "cafe-outline", dots: 1 },
  { id: "light", icon: "walk-outline", dots: 2 },
  { id: "moderate", icon: "bicycle-outline", dots: 3 },
  { id: "active", icon: "fitness-outline", dots: 4 },
  { id: "very_active", icon: "flame-outline", dots: 5 },
];

export default function ActivityLevel() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string>("");
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
  }, []);

  const handleContinue = async () => {
    if (!selected) return;
    await AsyncStorage.setItem("@hylift_activity_level", selected);
    router.push("/get-started/gender?flow=signup");
  };

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <Animated.View
        style={{ flex: 1, opacity: fade, transform: [{ translateY: slide }] }}
      >
        <SignupProgress current={5} total={13} />

        <View style={styles.header}>
          <Text style={styles.title}>
            {t("onboarding.activityLevel.title")}
          </Text>
          <Text style={styles.subtitle}>
            {t("onboarding.activityLevel.subtitle")}
          </Text>
        </View>

        <View style={styles.list}>
          {LEVELS.map((lv) => {
            const isSelected = selected === lv.id;
            return (
              <TouchableOpacity
                key={lv.id}
                activeOpacity={0.82}
                onPress={() => setSelected(lv.id)}
                style={[
                  styles.card,
                  {
                    borderColor: isSelected
                      ? theme.primary.main
                      : theme.background.accent,
                    backgroundColor: isSelected
                      ? theme.primary.main + "16"
                      : theme.background.darker,
                  },
                ]}
              >
                <View
                  style={[
                    styles.iconWrap,
                    {
                      backgroundColor: isSelected
                        ? theme.primary.main + "28"
                        : theme.background.accent,
                    },
                  ]}
                >
                  <Ionicons
                    name={lv.icon}
                    size={26}
                    color={
                      isSelected ? theme.primary.main : theme.foreground.gray
                    }
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.cardTitle,
                      {
                        color: isSelected
                          ? theme.primary.main
                          : theme.foreground.white,
                      },
                    ]}
                  >
                    {t(`onboarding.activityLevel.options.${lv.id}.label`)}
                  </Text>
                  <Text
                    style={[styles.cardDesc, { color: theme.foreground.gray }]}
                  >
                    {t(`onboarding.activityLevel.options.${lv.id}.description`)}
                  </Text>

                  {/* Activity dots */}
                  <View style={styles.dots}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <View
                        key={i}
                        style={[
                          styles.dot,
                          {
                            backgroundColor:
                              i < lv.dots
                                ? isSelected
                                  ? theme.primary.main
                                  : theme.foreground.gray
                                : theme.background.accent,
                          },
                        ]}
                      />
                    ))}
                  </View>
                </View>

                <View
                  style={[
                    styles.check,
                    {
                      backgroundColor: isSelected
                        ? theme.primary.main
                        : "transparent",
                      borderColor: isSelected
                        ? theme.primary.main
                        : theme.background.accent,
                    },
                  ]}
                >
                  {isSelected && (
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </Animated.View>

      <ChipButton
        title={t("common.continue")}
        onPress={handleContinue}
        variant="primary"
        size="lg"
        fullWidth
        disabled={!selected}
      />
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background.dark,
      paddingHorizontal: 20,
      paddingBottom: 16,
    },
    header: {
      marginBottom: 20,
    },
    title: {
      fontSize: 26,
      fontFamily: FONTS.extraBold,
      color: theme.foreground.white,
      marginBottom: 6,
      lineHeight: 32,
    },
    subtitle: {
      fontSize: 14,
      color: theme.foreground.gray,
      lineHeight: 21,
    },
    list: {
      gap: 10,
    },
    card: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      borderWidth: 1.5,
      borderRadius: 18,
      padding: 14,
    },
    iconWrap: {
      width: 54,
      height: 54,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    cardTitle: {
      fontSize: 15,
      fontFamily: FONTS.bold,
      marginBottom: 3,
    },
    cardDesc: {
      fontSize: 12,
      lineHeight: 17,
      marginBottom: 6,
    },
    dots: {
      flexDirection: "row",
      gap: 4,
    },
    dot: {
      width: 14,
      height: 4,
      borderRadius: 2,
    },
    check: {
      width: 26,
      height: 26,
      borderRadius: 13,
      borderWidth: 2,
      alignItems: "center",
      justifyContent: "center",
    },
  });
}

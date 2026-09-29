import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "../../components/ui/ScaledText";
import ChipButton from "../../components/ui/ChipButton";
import { SignupProgress } from "../../components/ui/SignupProgress";
import { FONTS } from "../../constants/fonts";
import { useTheme } from "../../contexts/ThemeContext";
import { api } from "../../services/api";

const GOALS: {
  id: "lose_weight" | "maintain" | "gain_weight" | "build_muscle";
  recommended?: boolean;
}[] = [
  { id: "lose_weight", recommended: true },
  { id: "maintain" },
  { id: "gain_weight" },
  { id: "build_muscle" },
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
            backgroundColor: "#FFFFFF",
            borderColor: isSelected ? primaryColor : "#E5E7EB",
            borderWidth: isSelected ? 2 : 1,
          },
        ]}
      >
        <View style={styles.buttonCopy}>
          <Text style={styles.buttonTitle}>
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

        {isSelected && (
          <View style={[styles.selectedDot, { backgroundColor: primaryColor }]} />
        )}
      </View>
    </AnimatedPressable>
  );
}

export default function GoalScreen() {
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const isUpdate = mode === "update";
  const { t, i18n } = useTranslation();
  const isFr = i18n.language?.startsWith("fr");
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<string>("");
  const [isNavigating, setIsNavigating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(28)).current;

  useEffect(() => {
    AsyncStorage.getItem("@hylift_goal").then((val) => {
      if (val) {
        setSelected(val);
      } else if (isUpdate) {
        setSelected("lose_weight");
      }
    });
  }, [isUpdate]);

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

  const handlePressCard = (id: string) => {
    if (isUpdate) {
      setSelected(id);
    } else {
      if (isNavigating) return;
      setSelected(id);
      setIsNavigating(true);
      AsyncStorage.setItem("@hylift_goal", id).finally(() => {
        router.push("/get-started/habits");
      });
    }
  };

  const handleUpdate = async () => {
    if (!selected || isSaving) return;
    setIsSaving(true);
    try {
      await AsyncStorage.setItem("@hylift_goal", selected);
      try {
        await api.updateProfile({ fitness_goal: selected });
      } catch {
        // swallow
      }
      router.back();
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => router.back();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: "#F8F9FC",
        },
      ]}
    >
      <Animated.View
        style={{ flex: 1, opacity: fade, transform: [{ translateY: slide }] }}
      >
        {!isUpdate && <SignupProgress current={2} total={13} />}
        <View style={[styles.header, isUpdate && styles.updateHeader]}>
          <Text style={styles.title}>{t("onboarding.goalFlow.title")}</Text>
        </View>

        <View style={styles.list}>
          {GOALS.map((g, index) => (
            <GoalCard
              key={g.id}
              g={g}
              index={index}
              isSelected={selected === g.id}
              onPress={() => handlePressCard(g.id)}
              t={t}
            />
          ))}
        </View>
      </Animated.View>

      {isUpdate && (
        <View
          style={[
            styles.bottomBar,
            { paddingBottom: Math.max(16, insets.bottom + 8) },
          ]}
        >
          <View style={styles.actionRow}>
            <View style={styles.actionButton}>
              <ChipButton
                title={isFr ? "Annuler" : "Cancel"}
                onPress={handleBack}
                variant="secondary"
                size="lg"
                fullWidth
              />
            </View>
            <View style={styles.actionButton}>
              <ChipButton
                threeD
                title={isFr ? "Mettre à jour" : "Update"}
                onPress={handleUpdate}
                variant="primary"
                size="lg"
                fullWidth
                loading={isSaving}
                disabled={!selected}
              />
            </View>
          </View>
        </View>
      )}
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
  updateHeader: {
    marginTop: 24,
  },
  title: {
    fontSize: 26,
    fontFamily: FONTS.extraBold,
    lineHeight: 32,
    color: "#102b4a",
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },

  list: {
    gap: 12,
  },
  buttonShell: {
    borderRadius: 8,
  },
  buttonFace: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 72,
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  buttonCopy: {
    flex: 1,
  },
  buttonTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontFamily: FONTS.bold,
    color: "#102b4a",
  },
  tag: {
    alignSelf: "flex-start",
    marginTop: 6,
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 3,
    backgroundColor: "#E5E7EB",
  },
  tagText: {
    fontSize: 10,
    fontFamily: FONTS.bold,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: "#6B7280",
  },
  selectedDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    flexShrink: 0,
    marginLeft: 12,
  },
  bottomBar: {
    paddingTop: 12,
  },
});

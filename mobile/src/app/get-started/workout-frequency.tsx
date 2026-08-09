import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Animated,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import ChipButton from "../../components/ui/ChipButton";
import SignupProgress from "../../components/ui/SignupProgress";
import { FONTS } from "../../constants/fonts";
import { useTheme } from "../../contexts/ThemeContext";


interface WeekdayOption {
  id:
    | "monday"
    | "tuesday"
    | "wednesday"
    | "thursday"
    | "friday"
    | "saturday"
    | "sunday";
  shortKey: string;
  accent: string;
}

const WEEKDAYS: WeekdayOption[] = [
  { id: "monday", shortKey: "mon", accent: "#3B82F6" },
  { id: "tuesday", shortKey: "tue", accent: "#0F766E" },
  { id: "wednesday", shortKey: "wed", accent: "#6D28D9" },
  { id: "thursday", shortKey: "thu", accent: "#C2410C" },
  { id: "friday", shortKey: "fri", accent: "#16A34A" },
  { id: "saturday", shortKey: "sat", accent: "#9D174D" },
  { id: "sunday", shortKey: "sun", accent: "#475569" },
];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function DayButton({
  day,
  selected,
  onPress,
  shortLabel,
  label,
}: {
  day: WeekdayOption;
  selected: boolean;
  onPress: () => void;
  shortLabel: string;
  label: string;
}) {
  const { theme } = useTheme();
  const primaryColor = theme.primary.main;

  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () => {
    Animated.spring(scale, {
      toValue: 0.99,
      speed: 40,
      bounciness: 0,
      useNativeDriver: true,
    }).start();
  };

  const pressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      speed: 28,
      bounciness: 6,
      useNativeDriver: true,
    }).start();
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      hitSlop={4}
      android_ripple={{ color: "rgba(255,255,255,0.16)" }}
      style={[styles.dayShell, { transform: [{ scale }] }]}
    >
      <View
        style={[
          styles.dayFace,
          {
            backgroundColor: selected ? primaryColor + "18" : theme.background.darker,
            borderColor: selected ? primaryColor : theme.background.accent,
          },
        ]}
      >
        <Text
          style={[
            styles.dayShort,
            { color: selected ? primaryColor : day.accent },
          ]}
        >
          {shortLabel}
        </Text>
        <Text
          style={[
            styles.dayLabel,
            { color: selected ? primaryColor : theme.foreground.white },
          ]}
        >
          {label}
        </Text>
      </View>
    </AnimatedPressable>
  );
}

export default function WorkoutFrequency() {
  const router = useRouter();
  const params = useLocalSearchParams<{ flow?: string }>();
  const isSignupFlow = params.flow === "signup";
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [selected, setSelected] = useState<string[]>([]);

  const handleSelect = (id: WeekdayOption["id"]) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((day) => day !== id) : [...prev, id],
    );
  };

  const handleContinue = async () => {
    if (selected.length === 0) return;
    const selectedDayIndices = WEEKDAYS.map((day, index) =>
      selected.includes(day.id) ? index : -1,
    ).filter((index) => index >= 0);
    await AsyncStorage.multiSet([
      ["@hylift_workout_days", JSON.stringify(selected)],
      ["@hylift_workout_frequency", selected.length.toString()],
      ["@hylift_home_weekly_objective", selected.length.toString()],
      ["@hylift_home_weekly_objective_days", JSON.stringify(selectedDayIndices)],
    ]);
    if (isSignupFlow) {
      router.navigate("/get-started/ready");
    } else {
      router.navigate("/get-started/focus-areas");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background.dark }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <SignupProgress current={9} total={13} />

        <Text style={[styles.title, { color: theme.foreground.white }]}>
          {t("onboarding.workoutFrequency.title")}
        </Text>

        <View style={styles.list}>
          {WEEKDAYS.map((day) => {
            const isSelected = selected.includes(day.id);
            return (
              <View key={day.id} style={styles.dayCardWrap}>
                <DayButton
                  day={day}
                  selected={isSelected}
                  onPress={() => handleSelect(day.id)}
                  shortLabel={t(
                    `onboarding.workoutFrequency.shortDays.${day.shortKey}`,
                  )}
                  label={t(`onboarding.workoutFrequency.days.${day.id}`)}
                />
              </View>
            );
          })}
        </View>
      </ScrollView>

      <ChipButton
        threeD
        title={t("common.continue")}
        onPress={handleContinue}
        variant="primary"
        size="lg"
        fullWidth
        disabled={selected.length === 0}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  title: {
    fontSize: 26,
    fontFamily: FONTS.extraBold,
    marginBottom: 20,
  },
  list: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  dayCardWrap: {
    width: "48%",
  },
  dayShell: {
    borderRadius: 14,
  },
  dayFace: {
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 10,
    gap: 6,
    minHeight: 86,
    justifyContent: "center",
  },
  dayShort: {
    fontSize: 12,
    fontFamily: FONTS.extraBold,
    textTransform: "uppercase",
  },
  dayLabel: {
    fontSize: 16,
    lineHeight: 20,
    fontFamily: FONTS.bold,
    textAlign: "center",
  },
});

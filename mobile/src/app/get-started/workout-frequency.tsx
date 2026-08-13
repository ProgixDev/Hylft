import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Text } from "../../components/ui/ScaledText";
import ChipButton from "../../components/ui/ChipButton";
import SignupProgress from "../../components/ui/SignupProgress";
import { FONTS } from "../../constants/fonts";
import { useTheme } from "../../contexts/ThemeContext";

const BG_SCREEN = "#F8F9FC";
const BG_CARD = "#FFFFFF";
const TEXT_TITLE = "#102b4a";
const TEXT_BODY = "#6B7280";

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
}

const WEEKDAYS: WeekdayOption[] = [
  { id: "monday", shortKey: "mon" },
  { id: "tuesday", shortKey: "tue" },
  { id: "wednesday", shortKey: "wed" },
  { id: "thursday", shortKey: "thu" },
  { id: "friday", shortKey: "fri" },
  { id: "saturday", shortKey: "sat" },
  { id: "sunday", shortKey: "sun" },
];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function DayRow({
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

  const { theme } = useTheme();

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      hitSlop={4}
      android_ripple={{ color: "rgba(16,43,74,0.08)" }}
      style={[styles.rowShell, { transform: [{ scale }] }]}
    >
      <View
        style={[
          styles.rowFace,
          selected && { borderColor: theme.primary.main, backgroundColor: BG_CARD },
        ]}
      >
        <Text style={styles.rowShort}>{shortLabel}</Text>
        <Text style={[styles.rowLabel, selected && { color: theme.primary.main }]}>
          {label}
        </Text>
        {selected && <View style={[styles.dot, { backgroundColor: theme.primary.main }]} />}
      </View>
    </AnimatedPressable>
  );
}

export default function WorkoutFrequency() {
  const router = useRouter();
  const params = useLocalSearchParams<{ flow?: string }>();
  const isSignupFlow = params.flow === "signup";
  const { t } = useTranslation();
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
    <View style={[styles.container, { backgroundColor: BG_SCREEN }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <SignupProgress current={9} total={13} />

        <Text style={[styles.title, { color: TEXT_TITLE }]}>
          {t("onboarding.workoutFrequency.title")}
        </Text>

        <View style={styles.list}>
          {WEEKDAYS.map((day) => {
            const isSelected = selected.includes(day.id);
            return (
              <DayRow
                key={day.id}
                day={day}
                selected={isSelected}
                onPress={() => handleSelect(day.id)}
                shortLabel={t(
                  `onboarding.workoutFrequency.shortDays.${day.shortKey}`,
                )}
                label={t(`onboarding.workoutFrequency.days.${day.id}`)}
              />
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
    marginBottom: 24,
  },
  list: {
    gap: 0,
  },
  rowShell: {
    borderRadius: 14,
    marginBottom: 10,
  },
  rowFace: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 60,
    borderWidth: 1.5,
    borderRadius: 14,
    borderColor: "#E5E7EB",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: BG_CARD,
  },
  rowShort: {
    width: 40,
    fontSize: 11,
    fontFamily: FONTS.semiBold,
    color: TEXT_BODY,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  rowLabel: {
    flex: 1,
    fontSize: 17,
    fontFamily: FONTS.bold,
    color: TEXT_TITLE,
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
});

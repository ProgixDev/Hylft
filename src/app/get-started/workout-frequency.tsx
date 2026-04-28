import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Animated,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import ChipButton from "../../components/ui/ChipButton";
import SignupProgress from "../../components/ui/SignupProgress";
import { FONTS } from "../../constants/fonts";

const BG = "#FFFFFF";

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
  depth: string;
}

const WEEKDAYS: WeekdayOption[] = [
  { id: "monday", shortKey: "mon", accent: "#3B82F6", depth: "#1D5FC4" },
  { id: "tuesday", shortKey: "tue", accent: "#14B8A6", depth: "#0F766E" },
  { id: "wednesday", shortKey: "wed", accent: "#8B5CF6", depth: "#6D28D9" },
  { id: "thursday", shortKey: "thu", accent: "#F97316", depth: "#C2410C" },
  { id: "friday", shortKey: "fri", accent: "#22C17A", depth: "#168E5A" },
  { id: "saturday", shortKey: "sat", accent: "#EC4899", depth: "#BE185D" },
  { id: "sunday", shortKey: "sun", accent: "#64748B", depth: "#475569" },
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
  const scale = useRef(new Animated.Value(1)).current;
  const pressDepth = useRef(new Animated.Value(0)).current;

  const pressIn = () => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 0.99,
        speed: 40,
        bounciness: 0,
        useNativeDriver: true,
      }),
      Animated.spring(pressDepth, {
        toValue: 6,
        speed: 40,
        bounciness: 0,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const pressOut = () => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        speed: 28,
        bounciness: 6,
        useNativeDriver: true,
      }),
      Animated.spring(pressDepth, {
        toValue: 0,
        speed: 26,
        bounciness: 6,
        useNativeDriver: true,
      }),
    ]).start();
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
          styles.dayBase,
          { backgroundColor: selected ? day.depth : "#DDE3EA" },
        ]}
      >
        <Animated.View
          style={[
            styles.dayFace,
            {
              backgroundColor: selected ? day.accent : "#FFFFFF",
              borderColor: selected ? day.accent : "#E8EDF0",
              transform: [{ translateY: pressDepth }],
            },
          ]}
        >
          <Text
            style={[
              styles.dayShort,
              { color: selected ? "#FFFFFF" : day.accent },
            ]}
          >
            {shortLabel}
          </Text>
          <Text
            style={[
              styles.dayLabel,
              { color: selected ? "#FFFFFF" : "#111827" },
            ]}
          >
            {label}
          </Text>
        </Animated.View>
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
    await AsyncStorage.multiSet([
      ["@hylift_workout_days", JSON.stringify(selected)],
      ["@hylift_workout_frequency", selected.length.toString()],
    ]);
    if (isSignupFlow) {
      router.navigate("/get-started/ready");
    } else {
      router.navigate("/get-started/focus-areas");
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <SignupProgress current={9} total={13} />

        <Text style={styles.title}>
          {t("onboarding.workoutFrequency.title")}
        </Text>
        <Text style={styles.subtitle}>
          {t("onboarding.workoutFrequency.subtitle")}
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
    backgroundColor: BG,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  title: {
    fontSize: 26,
    fontFamily: FONTS.extraBold,
    color: "#111827",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 20,
    lineHeight: 20,
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
    borderRadius: 18,
    ...Platform.select({
      ios: {
        shadowColor: "#102018",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 14,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  dayBase: {
    borderRadius: 18,
    paddingBottom: 7,
    overflow: "hidden",
  },
  dayFace: {
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 18,
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

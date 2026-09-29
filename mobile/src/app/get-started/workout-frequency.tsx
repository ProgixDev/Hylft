import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Animated,
  Pressable,
  ScrollView,
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

const BG_SCREEN = "#F8F9FC";
const BG_CARD = "#FFFFFF";
const TEXT_TITLE = "#102b4a";
const TEXT_BODY = "#6B7280";

const ACTIVITY_LEVELS = {
  light: { rank: 1, color: "#3B82F6" },
  moderate: { rank: 2, color: "#14B8A6" },
  active: { rank: 3, color: "#F59E0B" },
  very_active: { rank: 4, color: "#F97316" },
} as const;

type ActivityLevel = keyof typeof ACTIVITY_LEVELS;

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
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ flow?: string; mode?: string }>();
  const isSignupFlow = params.flow === "signup";
  const isUpdate = params.mode === "update";
  const { t, i18n } = useTranslation();
  const isFr = i18n.language?.startsWith("fr");
  const [selected, setSelected] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem("@hylift_workout_days").then((val) => {
      if (val) {
        try {
          const parsed = JSON.parse(val);
          if (Array.isArray(parsed)) setSelected(parsed);
        } catch {}
      }
    });
  }, []);

  const handleSelect = (id: WeekdayOption["id"]) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((day) => day !== id) : [...prev, id],
    );
  };

  const activityLevel: ActivityLevel =
    selected.length >= 6
      ? "very_active"
      : selected.length >= 4
        ? "active"
        : selected.length >= 2
          ? "moderate"
          : "light";
  const activityStyle = ACTIVITY_LEVELS[activityLevel];

  const handleContinue = async () => {
    if (selected.length === 0 || isSaving) return;
    setIsSaving(true);
    try {
      const selectedDayIndices = WEEKDAYS.map((day, index) =>
        selected.includes(day.id) ? index : -1,
      ).filter((index) => index >= 0);

      const count = selected.length;
      const activityLevel =
        count >= 6
          ? "very_active"
          : count >= 4
            ? "active"
            : count >= 2
              ? "moderate"
              : "light";

      await AsyncStorage.multiSet([
        ["@hylift_workout_days", JSON.stringify(selected)],
        ["@hylift_workout_frequency", count.toString()],
        ["@hylift_home_weekly_objective", count.toString()],
        ["@hylift_home_weekly_objective_days", JSON.stringify(selectedDayIndices)],
        ["@hylift_activity_level", activityLevel],
      ]);

      if (isUpdate) {
        try {
          await api.updateProfile({ activity_level: activityLevel });
        } catch {}
        router.back();
      } else {
        if (isSignupFlow) {
          router.navigate("/get-started/ready");
        } else {
          router.navigate("/get-started/focus-areas");
        }
      }
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
          backgroundColor: BG_SCREEN,
        },
      ]}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.scrollContent,
          isUpdate && styles.updateScrollContent,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {!isUpdate && <SignupProgress current={9} total={13} />}
        <Text style={[styles.title, { color: TEXT_TITLE }]}>
          {t("onboarding.workoutFrequency.title")}
        </Text>

        {selected.length > 0 && (
          <View
            style={[
              styles.activityCard,
              {
                backgroundColor: activityStyle.color + "12",
                borderColor: activityStyle.color + "38",
              },
            ]}
          >
            <View
              style={[
                styles.activityIcon,
                { backgroundColor: activityStyle.color + "20" },
              ]}
            >
              <Ionicons name="pulse" size={20} color={activityStyle.color} />
            </View>
            <View style={styles.activityCopy}>
              <Text style={[styles.activityLabel, { color: activityStyle.color }]}>
                {t(`onboarding.activityLevel.options.${activityLevel}.label`)}
              </Text>
              <Text style={styles.activityDescription} numberOfLines={1}>
                {t(`onboarding.activityLevel.options.${activityLevel}.description`)}
              </Text>
            </View>
            <View style={styles.activityMeter} accessibilityLabel={activityLevel}>
              {[1, 2, 3, 4].map((level) => (
                <View
                  key={level}
                  style={[
                    styles.meterBar,
                    level <= activityStyle.rank && {
                      backgroundColor: activityStyle.color,
                    },
                  ]}
                />
              ))}
            </View>
          </View>
        )}

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

      <View style={{ paddingTop: 12, paddingBottom: Math.max(16, insets.bottom) }}>
        <View style={styles.actionRow}>
          <View style={styles.actionButton}>
            <ChipButton
              title={isUpdate ? t("common.cancel") : t("common.back")}
              onPress={handleBack}
              variant="secondary"
              size="lg"
              fullWidth
            />
          </View>
          <View style={styles.actionButton}>
            <ChipButton
              threeD
              title={
                isUpdate
                  ? isFr
                    ? "Mettre à jour"
                    : "Update"
                  : t("common.continue")
              }
              onPress={handleContinue}
              variant="primary"
              size="lg"
              fullWidth
              disabled={selected.length === 0}
              loading={isSaving}
            />
          </View>
        </View>
      </View>
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
  updateScrollContent: {
    paddingTop: 24,
  },

  title: {
    fontSize: 26,
    fontFamily: FONTS.extraBold,
    marginBottom: 24,
  },
  activityCard: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    marginTop: -10,
    marginBottom: 16,
  },
  activityIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },
  activityCopy: {
    flex: 1,
  },
  activityLabel: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    marginBottom: 3,
  },
  activityDescription: {
    fontSize: 11,
    fontFamily: FONTS.medium,
    color: TEXT_BODY,
  },
  activityMeter: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 3,
    marginLeft: 10,
  },
  meterBar: {
    width: 5,
    height: 10,
    borderRadius: 3,
    backgroundColor: "#D8E0EA",
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  list: {
    gap: 0,
  },
  rowShell: {
    borderRadius: 8,
    marginBottom: 10,
  },
  rowFace: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 60,
    borderWidth: 1.5,
    borderRadius: 8,
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

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import ChipButton from "../../components/ui/ChipButton";
import { FONTS } from "../../constants/fonts";
import { Theme } from "../../constants/themes";
import { useTheme } from "../../contexts/ThemeContext";
import { api } from "../../services/api";
import { ApiRoutine } from "../../utils/routineMapper";

const WEEKLY_OPTIONS = [1, 2, 3, 4, 5, 6, 7];
const DAY_OPTIONS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const DAY_IDS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

type WorkoutDayId = (typeof DAY_IDS)[number];
type SetupStep = "days" | "routines";
type ScheduleAssignment = {
  day_of_week: number;
  is_rest_day: boolean;
  routine_id?: string | null;
};

const CYAN = {
  depth: "#075985",
  depthDim: "#052E48",
  face: "#0E7490",
  faceDim: "#074E68",
  accent: "#67E8F9",
  text: "#F0FDFF",
  muted: "#BAF4FF",
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function RoutineOptionCard({
  routine,
  isSelected,
  onPress,
}: {
  routine: { id: string; name: string; exercises?: unknown[]; estimated_duration?: number };
  isSelected: boolean;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const scale = useRef(new Animated.Value(1)).current;
  const pressDepth = useRef(new Animated.Value(0)).current;

  const pressIn = () => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 0.98, speed: 40, bounciness: 0, useNativeDriver: true }),
      Animated.spring(pressDepth, { toValue: 6, speed: 40, bounciness: 0, useNativeDriver: true }),
    ]).start();
  };

  const pressOut = () => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, speed: 28, bounciness: 6, useNativeDriver: true }),
      Animated.spring(pressDepth, { toValue: 0, speed: 26, bounciness: 6, useNativeDriver: true }),
    ]).start();
  };

  const depthBg = isSelected ? CYAN.depth : CYAN.depthDim;
  const faceBg = isSelected ? CYAN.face : CYAN.faceDim;

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      android_ripple={{ color: "rgba(255,255,255,0.14)" }}
      style={[cardOptionStyles.shell, { transform: [{ scale }] }]}
    >
      <View style={[cardOptionStyles.depth, { backgroundColor: depthBg }]}>
        <Animated.View
          style={[
            cardOptionStyles.face,
            { backgroundColor: faceBg, transform: [{ translateY: pressDepth }] },
            isSelected && cardOptionStyles.faceSelected,
          ]}
        >
          <View style={cardOptionStyles.row}>
            <Text style={cardOptionStyles.name} numberOfLines={1}>
              {routine.name}
            </Text>
            {isSelected && (
              <View style={cardOptionStyles.checkBadge}>
                <Text style={cardOptionStyles.checkMark}>✓</Text>
              </View>
            )}
          </View>
          <Text style={cardOptionStyles.meta}>
            {routine.exercises?.length ?? 0} {t("home.exercises", "Exercises")} –{" "}
            {routine.estimated_duration ?? 0} min
          </Text>
        </Animated.View>
      </View>
    </AnimatedPressable>
  );
}

function CreateRoutineButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const pressDepth = useRef(new Animated.Value(0)).current;

  const pressIn = () => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 0.97, speed: 40, bounciness: 0, useNativeDriver: true }),
      Animated.spring(pressDepth, { toValue: 4, speed: 40, bounciness: 0, useNativeDriver: true }),
    ]).start();
  };

  const pressOut = () => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, speed: 28, bounciness: 6, useNativeDriver: true }),
      Animated.spring(pressDepth, { toValue: 0, speed: 26, bounciness: 6, useNativeDriver: true }),
    ]).start();
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      android_ripple={{ color: "rgba(255,255,255,0.14)" }}
      style={[createBtnStyles.shell, { transform: [{ scale }] }]}
    >
      <View style={[createBtnStyles.depth]}>
        <Animated.View
          style={[
            createBtnStyles.face,
            { transform: [{ translateY: pressDepth }] },
          ]}
        >
          <Text style={createBtnStyles.label}>{label}</Text>
        </Animated.View>
      </View>
    </AnimatedPressable>
  );
}

const createBtnStyles = StyleSheet.create({
  shell: {
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  depth: {
    borderRadius: 12,
    paddingBottom: 4,
    overflow: "hidden",
    backgroundColor: "#14532D",
  },
  face: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    backgroundColor: "#16A34A",
    borderColor: "rgba(134,239,172,0.35)",
  },
  label: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    color: "#F0FDF4",
  },
});

const cardOptionStyles = StyleSheet.create({
  shell: {
    borderRadius: 16,
  },
  depth: {
    borderRadius: 16,
    paddingBottom: 6,
    overflow: "hidden",
  },
  face: {
    borderRadius: 16,
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "rgba(103,232,249,0.20)",
    gap: 4,
  },
  faceSelected: {
    borderColor: "rgba(103,232,249,0.55)",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  name: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    color: CYAN.text,
    flex: 1,
  },
  meta: {
    fontFamily: FONTS.medium,
    fontSize: 11,
    color: CYAN.muted,
  },
  checkBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: CYAN.accent,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  checkMark: {
    color: CYAN.depth,
    fontSize: 11,
    fontFamily: FONTS.extraBold,
  },
});

const OBJECTIVE_KEY = "@hylift_home_weekly_objective";
const OBJECTIVE_DAYS_KEY = "@hylift_home_weekly_objective_days";
const WORKOUT_DAYS_KEY = "@hylift_workout_days";
const WORKOUT_FREQUENCY_KEY = "@hylift_workout_frequency";
const ALL_DAY_INDICES = DAY_OPTIONS.map((_, index) => index);
const VALID_WORKOUT_DAY_IDS = new Set<string>(DAY_IDS);

function parseWorkoutDayIndices(value: string | null): number[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((day) =>
        typeof day === "string" && VALID_WORKOUT_DAY_IDS.has(day)
          ? DAY_IDS.indexOf(day as WorkoutDayId)
          : -1,
      )
      .filter((index) => index >= 0);
  } catch {
    return [];
  }
}

function parseSavedDayIndices(value: string | null): number[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6)
      .slice(0, 7);
  } catch {
    return [];
  }
}

export default function ObjectiveScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const styles = createStyles(theme);
  const [selected, setSelected] = useState<number | null>(null);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [step, setStep] = useState<SetupStep>("days");
  const [routines, setRoutines] = useState<ApiRoutine[]>([]);
  const [selectedRoutineByDay, setSelectedRoutineByDay] = useState<
    Record<number, string>
  >({});
  const [isLoadingRoutines, setIsLoadingRoutines] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadSavedObjective = async () => {
      try {
        const [savedObjective, savedDays, savedWorkoutDays] = await Promise.all([
          AsyncStorage.getItem(OBJECTIVE_KEY),
          AsyncStorage.getItem(OBJECTIVE_DAYS_KEY),
          AsyncStorage.getItem(WORKOUT_DAYS_KEY),
        ]);

        if (!isMounted) return;

        const workoutDayIndices = parseWorkoutDayIndices(savedWorkoutDays);
        if (workoutDayIndices.length > 0) {
          setSelected(workoutDayIndices.length);
          setSelectedDays(workoutDayIndices);
          return;
        }

        const parsedObjective = Number(savedObjective);
        if (
          Number.isFinite(parsedObjective) &&
          parsedObjective >= 1 &&
          parsedObjective <= 7
        ) {
          setSelected(parsedObjective);
        }

        const objectiveDays = parseSavedDayIndices(savedDays);
        if (objectiveDays.length > 0) {
          setSelectedDays(objectiveDays);
        } else if (parsedObjective === 7) {
          setSelectedDays(ALL_DAY_INDICES);
        }
      } catch {
        // Keep default UI state when storage is unavailable.
      }
    };

    loadSavedObjective();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    const loadRoutineSetup = async () => {
      setIsLoadingRoutines(true);
      try {
        const [routinesRes, scheduleRes] = await Promise.all([
          api.getRoutines(),
          api.getSchedule(),
        ]);
        if (!isActive) return;

        setRoutines(Array.isArray(routinesRes) ? routinesRes : []);

        const assignments = (
          Array.isArray(scheduleRes?.items) ? scheduleRes.items : []
        ) as ScheduleAssignment[];
        setSelectedRoutineByDay(
          assignments.reduce(
            (acc: Record<number, string>, item) => {
              if (
                Number.isInteger(item.day_of_week) &&
                item.day_of_week >= 0 &&
                item.day_of_week <= 6 &&
                !item.is_rest_day &&
                item.routine_id
              ) {
                acc[item.day_of_week] = item.routine_id;
              }
              return acc;
            },
            {},
          ),
        );
      } catch (error) {
        console.warn("[Objective] load routines failed:", error);
      } finally {
        if (isActive) setIsLoadingRoutines(false);
      }
    };

    loadRoutineSetup();
    return () => {
      isActive = false;
    };
  }, []);

  const canChooseRoutines = useMemo(
    () => !!selected && selectedDays.length === selected,
    [selected, selectedDays],
  );
  const routineIds = useMemo(
    () => new Set(routines.map((routine) => routine.id)),
    [routines],
  );
  const canSavePlan = useMemo(
    () =>
      canChooseRoutines &&
      selectedDays.every((dayIndex) =>
        routineIds.has(selectedRoutineByDay[dayIndex]),
      ),
    [canChooseRoutines, routineIds, selectedDays, selectedRoutineByDay],
  );

  const getDayLabel = useCallback(
    (dayIndex: number) =>
      t(`onboarding.workoutFrequency.days.${DAY_IDS[dayIndex]}`, DAY_OPTIONS[dayIndex]),
    [t],
  );

  const handleSelect = (days: number) => {
    setSelected(days);
    setSelectedDays(
      days === 7 ? ALL_DAY_INDICES : (prev) => prev.slice(0, days),
    );
  };

  const toggleDay = (dayIndex: number) => {
    if (!selected) return;

    setSelectedDays((prev) => {
      if (prev.includes(dayIndex)) {
        return prev.filter((day) => day !== dayIndex);
      }

      if (prev.length >= selected) {
        return prev;
      }

      return [...prev, dayIndex].sort((a, b) => a - b);
    });
  };

  const persistWorkoutDays = async () => {
    if (!selected || selectedDays.length !== selected) return;
    await AsyncStorage.multiSet([
      [OBJECTIVE_KEY, String(selected)],
      [OBJECTIVE_DAYS_KEY, JSON.stringify(selectedDays)],
      [WORKOUT_DAYS_KEY, JSON.stringify(selectedDays.map((day) => DAY_IDS[day]))],
      [WORKOUT_FREQUENCY_KEY, String(selected)],
    ]);
  };

  const handleNext = () => {
    if (!canChooseRoutines) return;
    setStep("routines");
  };

  const handleCreateRoutineForDay = async (dayIndex: number) => {
    if (!canChooseRoutines) return;
    await persistWorkoutDays();
    router.push({
      pathname: "/create-routine",
      params: {
        fromWeekSetup: "1",
        dayOfWeek: String(dayIndex),
        dayLabel: getDayLabel(dayIndex),
      },
    } as any);
  };

  const handleConfirm = async () => {
    if (!canSavePlan || isSaving) return;
    setIsSaving(true);
    try {
      await persistWorkoutDays();
      await Promise.all(
        ALL_DAY_INDICES.map((dayIndex) => {
          if (selectedDays.includes(dayIndex)) {
            return api.upsertScheduleAssignment(dayIndex, {
              is_rest_day: false,
              routine_id: selectedRoutineByDay[dayIndex],
            });
          }
          return api.upsertScheduleAssignment(dayIndex, {
            is_rest_day: true,
            routine_id: null,
          });
        }),
      );
    } catch (error: any) {
      Alert.alert(
        t("home.weekSetupSaveFailed", "Could not save your week"),
        error?.message || t("createRoutine.tryAgain", "Please try again."),
      );
      setIsSaving(false);
      return;
    }
    setIsSaving(false);
    router.back();
  };

  const footerTitle =
    step === "days"
      ? t("common.next", "Next")
      : isSaving
        ? t("home.savingWeekSetup", "Saving...")
        : t("common.save", "Save");
  const footerDisabled =
    step === "days"
      ? !canChooseRoutines
      : isLoadingRoutines || !canSavePlan || isSaving;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [
            styles.backButton,
            pressed && { opacity: 0.8 },
          ]}
          onPress={() => {
            if (step === "routines") {
              setStep("days");
              return;
            }
            router.back();
          }}
        >
          <Text style={styles.backButtonText}>{"<"}</Text>
        </Pressable>
        <Text style={styles.headerTitle}>
          {step === "days"
            ? t("home.objective", "Objective")
            : t("home.assignRoutines", "Assign routines")}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {step === "days" ? (
          <>
            <Text style={styles.title}>
              {t(
                "home.objectiveQuestion",
                "How many times per week do you want to train?",
              )}
            </Text>

            <View style={styles.optionsList}>
              {WEEKLY_OPTIONS.map((days) => {
                const isSelected = selected === days;
                return (
                  <Pressable
                    key={days}
                    style={({ pressed }) => [
                      styles.optionCard,
                      {
                        borderColor: isSelected
                          ? theme.primary.main
                          : theme.background.accent,
                        backgroundColor: isSelected
                          ? theme.primary.main + "14"
                          : theme.background.darker,
                        opacity: pressed ? 0.9 : 1,
                      },
                    ]}
                    onPress={() => handleSelect(days)}
                  >
                    <Text style={styles.optionText}>
                      {t("home.objectiveOption", "{{count}} x week", {
                        count: days,
                      })}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.daysTitle}>
              {t("home.objectiveChooseDays", "Choose your workout days")}
            </Text>
            <Text style={styles.daysSubtitle}>
              {t(
                "home.objectiveChooseDaysHint",
                "Select {{selected}}/{{target}} days",
                { selected: selectedDays.length, target: selected ?? 0 },
              )}
            </Text>

            <View style={styles.daysGrid}>
              {DAY_OPTIONS.map((dayLabel, dayIndex) => {
                const isActive = selectedDays.includes(dayIndex);
                const disabled = !selected;
                return (
                  <Pressable
                    key={dayLabel}
                    style={({ pressed }) => [
                      styles.dayChip,
                      {
                        borderColor: isActive
                          ? theme.primary.main
                          : theme.background.accent,
                        backgroundColor: isActive
                          ? theme.primary.main + "16"
                          : theme.background.darker,
                        opacity: disabled ? 0.45 : pressed ? 0.9 : 1,
                      },
                    ]}
                    onPress={() => toggleDay(dayIndex)}
                    disabled={disabled}
                  >
                    <Text
                      style={[
                        styles.dayChipText,
                        isActive && { color: theme.primary.main },
                      ]}
                    >
                      {dayLabel}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        ) : (
          <>
            <Text style={styles.title}>
              {t("home.assignRoutinesTitle", "Select a routine for each day")}
            </Text>
            <Text style={styles.daysSubtitle}>
              {t(
                "home.assignRoutinesHint",
                "Pick the routine that should be planned on each selected day.",
              )}
            </Text>

            {isLoadingRoutines ? (
              <View style={styles.loadingBlock}>
                <ActivityIndicator color={theme.primary.main} />
                <Text style={styles.loadingText}>
                  {t("home.loadingRoutines", "Loading routines...")}
                </Text>
              </View>
            ) : routines.length === 0 ? (
              <View style={styles.emptyRoutinesCard}>
                <Text style={styles.emptyRoutinesTitle}>
                  {t("workout.noRoutinesYet", "No routines yet")}
                </Text>
                <Text style={styles.emptyRoutinesText}>
                  {t(
                    "home.createRoutineBeforeAssigning",
                    "Create a routine first, then come back to assign it to your days.",
                  )}
                </Text>
                {selectedDays[0] !== undefined && (
                  <CreateRoutineButton
                    label={t("createRoutine.title", "Create Routine")}
                    onPress={() => handleCreateRoutineForDay(selectedDays[0])}
                  />
                )}
              </View>
            ) : (
              <View style={styles.assignmentList}>
                {selectedDays.map((dayIndex) => (
                  <View key={dayIndex} style={styles.assignmentCard}>
                    <View style={styles.assignmentHeader}>
                      <View>
                        <Text style={styles.assignmentDay}>
                          {getDayLabel(dayIndex)}
                        </Text>
                        <Text style={styles.assignmentMeta}>
                          {selectedRoutineByDay[dayIndex]
                            ? t("home.routineReady", "Ready")
                            : t("home.needsRoutine", "Needs routine")}
                        </Text>
                      </View>
                      <CreateRoutineButton
                        label={t("createRoutine.title", "Create Routine")}
                        onPress={() => handleCreateRoutineForDay(dayIndex)}
                      />
                    </View>

                    <View style={styles.routineOptions}>
                      {routines.map((routine) => (
                        <RoutineOptionCard
                          key={routine.id}
                          routine={routine}
                          isSelected={selectedRoutineByDay[dayIndex] === routine.id}
                          onPress={() =>
                            setSelectedRoutineByDay((prev) => ({
                              ...prev,
                              [dayIndex]: routine.id,
                            }))
                          }
                        />
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      <ChipButton
        title={footerTitle}
        onPress={step === "days" ? handleNext : handleConfirm}
        variant="primary"
        size="lg"
        fullWidth
        disabled={footerDisabled}
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
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingTop: 6,
      marginBottom: 14,
    },
    backButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.background.darker,
    },
    backButtonText: {
      fontFamily: FONTS.extraBold,
      fontSize: 18,
      color: theme.foreground.white,
      marginTop: -1,
    },
    headerTitle: {
      fontFamily: FONTS.bold,
      fontSize: 16,
      color: theme.foreground.white,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    headerSpacer: {
      width: 36,
      height: 36,
    },
    content: {
      paddingBottom: 24,
    },
    title: {
      fontFamily: FONTS.extraBold,
      fontSize: 24,
      color: theme.foreground.white,
      lineHeight: 31,
      marginBottom: 18,
    },
    optionsList: {
      gap: 10,
    },
    optionCard: {
      borderWidth: 1.5,
      borderRadius: 14,
      paddingVertical: 16,
      paddingHorizontal: 14,
    },
    optionText: {
      fontFamily: FONTS.bold,
      fontSize: 17,
      color: theme.foreground.white,
    },
    daysTitle: {
      fontFamily: FONTS.bold,
      fontSize: 18,
      color: theme.foreground.white,
      marginTop: 18,
      marginBottom: 4,
    },
    daysSubtitle: {
      fontFamily: FONTS.regular,
      fontSize: 12,
      color: theme.foreground.gray,
      marginBottom: 10,
      lineHeight: 17,
    },
    daysGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    dayChip: {
      minWidth: 64,
      borderWidth: 1.5,
      borderRadius: 12,
      paddingVertical: 10,
      paddingHorizontal: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    dayChipText: {
      fontFamily: FONTS.semiBold,
      fontSize: 13,
      color: theme.foreground.white,
    },
    loadingBlock: {
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      paddingVertical: 42,
    },
    loadingText: {
      fontFamily: FONTS.medium,
      fontSize: 13,
      color: theme.foreground.gray,
    },
    emptyRoutinesCard: {
      padding: 18,
      borderRadius: 18,
      backgroundColor: theme.background.darker,
      borderWidth: 1,
      borderColor: theme.background.accent,
      gap: 10,
    },
    emptyRoutinesTitle: {
      fontFamily: FONTS.extraBold,
      fontSize: 17,
      color: theme.foreground.white,
    },
    emptyRoutinesText: {
      fontFamily: FONTS.regular,
      fontSize: 13,
      lineHeight: 19,
      color: theme.foreground.gray,
    },
    assignmentList: {
      gap: 14,
      paddingBottom: 4,
    },
    assignmentCard: {
      padding: 14,
      borderRadius: 18,
      backgroundColor: theme.background.darker,
      borderWidth: 1,
      borderColor: theme.background.accent,
      gap: 12,
    },
    assignmentHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 12,
    },
    assignmentDay: {
      fontFamily: FONTS.extraBold,
      fontSize: 17,
      color: theme.foreground.white,
      textTransform: "capitalize",
    },
    assignmentMeta: {
      marginTop: 2,
      fontFamily: FONTS.medium,
      fontSize: 12,
      color: theme.foreground.gray,
    },
    routineOptions: {
      gap: 8,
    },
  });
}

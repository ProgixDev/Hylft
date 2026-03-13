import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Theme } from "../../constants/themes";
import { useActiveWorkout } from "../../contexts/ActiveWorkoutContext";
import { useTheme } from "../../contexts/ThemeContext";
import { formatDate, formatWeekday } from "../../utils/dateFormatter";
import { translateRoutineName, translateRoutineDescription, translateExerciseTerm, translateExerciseName, translateApiData } from "../../utils/exerciseTranslator";
import {
  getRoutineById,
  getScheduleForDate,
  Routine,
  RoutineExercise,
  ScheduledDay,
  updateScheduleDay,
} from "../../data/mockData";

import { FONTS } from "../../constants/fonts";

const MY_USER_ID = "1";

function getDayLabel(dateStr: string, t: (key: string) => string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr + "T00:00:00");
  const diff = Math.round(
    (d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diff === -1) return t("scheduleDetail.yesterday");
  if (diff === 0) return t("scheduleDetail.today");
  if (diff === 1) return t("scheduleDetail.tomorrow");
  if (diff === 2) return t("scheduleDetail.in2Days");
  return formatWeekday(dateStr);
}

function formatRestTime(seconds: number, t: (key: string) => string): string {
  if (seconds >= 60) return `${Math.round(seconds / 60)}${t("scheduleDetail.minRest")}`;
  return `${seconds}${t("scheduleDetail.sRest")}`;
}

// ─── Exercise Row ─────────────────────────────────────────────────────────────

function ExerciseRow({
  exercise,
  index,
  theme,
  isCompleted,
  t,
  i18n,
}: {
  exercise: RoutineExercise;
  index: number;
  theme: Theme;
  isCompleted: boolean;
  t: (key: string) => string;
  i18n: { language: string };
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <TouchableOpacity
      style={[
        styles.exCard,
        {
          backgroundColor: theme.background.accent,
          borderColor: isCompleted ? "#4CAF5033" : theme.background.darker,
        },
      ]}
      onPress={() => setExpanded((v) => !v)}
      activeOpacity={0.8}
    >
      <View style={styles.exCardMain}>
        {/* Number badge */}
        <View
          style={[
            styles.exIndexBadge,
            {
              backgroundColor: isCompleted
                ? "#4CAF5022"
                : theme.primary.main + "22",
            },
          ]}
        >
          {isCompleted ? (
            <Ionicons name="checkmark" size={14} color="#4CAF50" />
          ) : (
            <Text style={[styles.exIndexText, { color: theme.primary.main }]}>
              {index + 1}
            </Text>
          )}
        </View>

        {/* Name + sets×reps */}
        <View style={{ flex: 1 }}>
          <Text style={[styles.exCardName, { color: theme.foreground.white }]}>
            {translateExerciseName(exercise.name)}
          </Text>
          <View style={styles.exMetaRow}>
            <View
              style={[
                styles.exMetaChip,
                { backgroundColor: theme.background.darker },
              ]}
            >
              <Ionicons
                name="layers-outline"
                size={10}
                color={theme.foreground.gray}
              />
              <Text
                style={[styles.exMetaText, { color: theme.foreground.gray }]}
              >
                {exercise.sets} {t("scheduleDetail.sets")}
              </Text>
            </View>
            <View
              style={[
                styles.exMetaChip,
                { backgroundColor: theme.background.darker },
              ]}
            >
              <Ionicons
                name="repeat-outline"
                size={10}
                color={theme.foreground.gray}
              />
              <Text
                style={[styles.exMetaText, { color: theme.foreground.gray }]}
              >
                {exercise.reps} {t("scheduleDetail.reps")}
              </Text>
            </View>
            <View
              style={[
                styles.exMetaChip,
                { backgroundColor: theme.background.darker },
              ]}
            >
              <Ionicons
                name="timer-outline"
                size={10}
                color={theme.foreground.gray}
              />
              <Text
                style={[styles.exMetaText, { color: theme.foreground.gray }]}
              >
                {formatRestTime(exercise.restTime, t)}
              </Text>
            </View>
          </View>
        </View>

        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={16}
          color={theme.foreground.gray}
        />
      </View>

      {/* Expanded notes */}
      {expanded && exercise.notes && (
        <View
          style={[styles.exNotes, { borderTopColor: theme.background.darker }]}
        >
          <Ionicons name="bulb-outline" size={13} color={theme.primary.main} />
          <Text style={[styles.exNotesText, { color: theme.foreground.gray }]}>
            {translateApiData(exercise.notes)}
          </Text>
        </View>
      )}

      {/* Expanded set breakdown */}
      {expanded && (
        <View
          style={[
            styles.setBreakdown,
            { borderTopColor: theme.background.darker },
          ]}
        >
          {Array.from({ length: exercise.sets }).map((_, si) => (
            <View key={si} style={styles.setRow}>
              <View
                style={[
                  styles.setNumBadge,
                  { backgroundColor: theme.background.darker },
                ]}
              >
                <Text
                  style={[styles.setNumText, { color: theme.foreground.gray }]}
                >
                  {t("scheduleDetail.set")} {si + 1}
                </Text>
              </View>
              <Text
                style={[styles.setRepsText, { color: theme.foreground.white }]}
              >
                {exercise.reps} {t("scheduleDetail.reps")}
              </Text>
              {isCompleted && (
                <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
              )}
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function ScheduleDetailPage() {
  const { t, i18n } = useTranslation();
  const { date } = useLocalSearchParams<{ date: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  const { startWorkout } = useActiveWorkout();

  const [schedDay, setSchedDay] = useState<ScheduledDay | undefined>(() =>
    getScheduleForDate(date ?? "", MY_USER_ID),
  );
  const [routine, setRoutine] = useState<Routine | undefined>(() =>
    schedDay?.routineId ? getRoutineById(schedDay.routineId) : undefined,
  );

  useEffect(() => {
    if (!date) return;
    const s = getScheduleForDate(date, MY_USER_ID);
    setSchedDay(s);
    setRoutine(s?.routineId ? getRoutineById(s.routineId) : undefined);
  }, [date]);

  const isCompleted = schedDay?.status === "completed";
  const isRest = !schedDay || schedDay.status === "rest";
  const dayLabel = date ? getDayLabel(date, t) : "";
  const formattedDate = date ? formatDate(date) : "";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayDate = date ? new Date(date + "T00:00:00") : new Date();
  const isPast = dayDate <= today;

  const totalSets = routine?.exercises.reduce((s, e) => s + e.sets, 0) ?? 0;

  const handleMarkCompleted = () => {
    if (!date) return;
    Alert.alert(t("scheduleDetail.markAsCompleted"), t("scheduleDetail.markWorkoutCompleted"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("scheduleDetail.markComplete"),
        onPress: () => {
          updateScheduleDay(date, { status: "completed" });
          setSchedDay((prev) =>
            prev ? { ...prev, status: "completed" } : prev,
          );
        },
      },
    ]);
  };

  const handleMarkRest = () => {
    if (!date) return;
    Alert.alert(t("scheduleDetail.changeToRestDay"), t("scheduleDetail.changeDayToRest"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("scheduleDetail.setRestDay"),
        onPress: () => {
          updateScheduleDay(date, { status: "rest", routineId: undefined });
          setSchedDay((prev) =>
            prev ? { ...prev, status: "rest", routineId: undefined } : prev,
          );
          setRoutine(undefined);
        },
      },
    ]);
  };

  const handleStartWorkout = () => {
    if (!routine) return;
    startWorkout({
      id: `workout-${Date.now()}`,
      duration: 0,
      volume: 0,
      sets: 0,
      exercises: routine.exercises.map((e, idx) => ({
        id: `entry-${Date.now()}-${idx}`,
        exerciseId: 0,
        name: e.name,
        muscles: [],
        equipment: [],
        notes: e.notes,
        addedAt: Date.now(),
        sets: Array.from({ length: e.sets }, (_, si) => ({
          id: `set-${Date.now()}-${idx}-${si}`,
          setNumber: si + 1,
          kg: "",
          reps: e.reps.includes("-") ? e.reps.split("-")[0] : e.reps,
          isCompleted: false,
        })),
      })),
    });
  };

  const diffColor =
    routine?.difficulty === "beginner"
      ? "#4CAF50"
      : routine?.difficulty === "intermediate"
        ? "#FF9800"
        : "#F44336";

  return (
    <View
      style={[styles.container, { backgroundColor: theme.background.dark }]}
    >
      {/* ── Header ── */}
      <View
        style={[styles.header, { borderBottomColor: theme.background.accent }]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Ionicons
            name="chevron-back"
            size={24}
            color={theme.foreground.white}
          />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: theme.foreground.white }]}>
            {dayLabel}
          </Text>
          <Text style={[styles.headerDate, { color: theme.foreground.gray }]}>
            {formattedDate}
          </Text>
        </View>
        {!isCompleted && !isRest && isPast && (
          <TouchableOpacity
            style={[
              styles.completeBtn,
              { backgroundColor: "#4CAF5022", borderColor: "#4CAF50" },
            ]}
            onPress={handleMarkCompleted}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark" size={16} color="#4CAF50" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Status banner ── */}
        <View
          style={[
            styles.statusBanner,
            {
              backgroundColor: isCompleted
                ? "#4CAF5015"
                : isRest
                  ? theme.background.accent
                  : theme.primary.main + "15",
              borderColor: isCompleted
                ? "#4CAF50"
                : isRest
                  ? theme.background.darker
                  : theme.primary.main,
            },
          ]}
        >
          <Ionicons
            name={
              isCompleted
                ? "checkmark-circle"
                : isRest
                  ? "moon"
                  : "time-outline"
            }
            size={20}
            color={
              isCompleted
                ? "#4CAF50"
                : isRest
                  ? theme.foreground.gray
                  : theme.primary.main
            }
          />
          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.statusTitle,
                {
                  color: isCompleted
                    ? "#4CAF50"
                    : isRest
                      ? theme.foreground.gray
                      : theme.primary.main,
                },
              ]}
            >
              {isCompleted
                ? t("scheduleDetail.workoutCompleted")
                : isRest
                  ? t("scheduleDetail.restDay")
                  : t("scheduleDetail.workoutScheduled")}
            </Text>
            {schedDay?.notes && (
              <Text
                style={[styles.statusNotes, { color: theme.foreground.gray }]}
              >
                {schedDay.notes}
              </Text>
            )}
          </View>
        </View>

        {isRest ? (
          /* ── REST DAY VIEW ── */
          <View style={styles.restView}>
            <View
              style={[
                styles.restIconLg,
                { backgroundColor: theme.background.accent },
              ]}
            >
              <Ionicons name="moon" size={48} color={theme.foreground.gray} />
            </View>
            <Text style={[styles.restTitle, { color: theme.foreground.white }]}>
              {t("scheduleDetail.restAndRecovery")}
            </Text>
            <Text style={[styles.restBody, { color: theme.foreground.gray }]}>
              {t("scheduleDetail.restDaysImportant")}
            </Text>
            <View style={styles.restTipsList}>
              {[
                {
                  icon: "water-outline",
                  tip: t("scheduleDetail.drinkWater"),
                },
                {
                  icon: "bed-outline",
                  tip: t("scheduleDetail.qualitySleep"),
                },
                {
                  icon: "walk-outline",
                  tip: t("scheduleDetail.lightWalking"),
                },
                {
                  icon: "nutrition-outline",
                  tip: t("scheduleDetail.eatProtein"),
                },
              ].map((item) => (
                <View
                  key={item.tip}
                  style={[
                    styles.restTipRow,
                    { backgroundColor: theme.background.accent },
                  ]}
                >
                  <Ionicons
                    name={item.icon as any}
                    size={18}
                    color={theme.primary.main}
                  />
                  <Text
                    style={[
                      styles.restTipText,
                      { color: theme.foreground.white },
                    ]}
                  >
                    {item.tip}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : routine ? (
          /* ── WORKOUT VIEW ── */
          <View>
            {/* Routine header card */}
            <View
              style={[
                styles.routineCard,
                { backgroundColor: theme.background.accent },
              ]}
            >
              <View style={styles.routineCardTop}>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.routineName,
                      { color: theme.foreground.white },
                    ]}
                  >
                    {translateRoutineName(routine.name)}
                  </Text>
                  <Text
                    style={[
                      styles.routineDesc,
                      { color: theme.foreground.gray },
                    ]}
                  >
                    {translateRoutineDescription(routine.description)}
                  </Text>
                </View>
                <View
                  style={[
                    styles.diffBadge,
                    {
                      backgroundColor: diffColor + "22",
                      borderColor: diffColor,
                    },
                  ]}
                >
                  <Text style={[styles.diffText, { color: diffColor }]}>
                    {translateApiData(routine.difficulty)}
                  </Text>
                </View>
              </View>

              {/* Stats row */}
              <View
                style={[
                  styles.routineStats,
                  { backgroundColor: theme.background.darker },
                ]}
              >
                <View style={styles.routineStat}>
                  <Text
                    style={[
                      styles.routineStatVal,
                      { color: theme.foreground.white },
                    ]}
                  >
                    {routine.exercises.length}
                  </Text>
                  <Text
                    style={[
                      styles.routineStatLabel,
                      { color: theme.foreground.gray },
                    ]}
                  >
                    {t("scheduleDetail.exercises")}
                  </Text>
                </View>
                <View
                  style={[
                    styles.routineStatDiv,
                    { backgroundColor: theme.background.accent },
                  ]}
                />
                <View style={styles.routineStat}>
                  <Text
                    style={[
                      styles.routineStatVal,
                      { color: theme.foreground.white },
                    ]}
                  >
                    {totalSets}
                  </Text>
                  <Text
                    style={[
                      styles.routineStatLabel,
                      { color: theme.foreground.gray },
                    ]}
                  >
                    {t("scheduleDetail.totalSets")}
                  </Text>
                </View>
                <View
                  style={[
                    styles.routineStatDiv,
                    { backgroundColor: theme.background.accent },
                  ]}
                />
                <View style={styles.routineStat}>
                  <Text
                    style={[
                      styles.routineStatVal,
                      { color: theme.foreground.white },
                    ]}
                  >
                    {routine.estimatedDuration}m
                  </Text>
                  <Text
                    style={[
                      styles.routineStatLabel,
                      { color: theme.foreground.gray },
                    ]}
                  >
                    {t("scheduleDetail.estTime")}
                  </Text>
                </View>
                <View
                  style={[
                    styles.routineStatDiv,
                    { backgroundColor: theme.background.accent },
                  ]}
                />
                <View style={styles.routineStat}>
                  <Text
                    style={[
                      styles.routineStatVal,
                      { color: theme.foreground.white },
                    ]}
                  >
                    {routine.timesCompleted}×
                  </Text>
                  <Text
                    style={[
                      styles.routineStatLabel,
                      { color: theme.foreground.gray },
                    ]}
                  >
                    {t("scheduleDetail.doneBefore")}
                  </Text>
                </View>
              </View>

              {/* Muscle tags */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.muscleTags}
              >
                {routine.targetMuscles.map((m) => {
                  const translatedMuscle = translateExerciseTerm(m, "targetMuscles");
                  return (
                    <View
                      key={m}
                      style={[
                        styles.muscleTag,
                        { backgroundColor: theme.primary.main + "18" },
                      ]}
                    >
                      <Text
                        style={[
                          styles.muscleTagText,
                          { color: theme.primary.main },
                        ]}
                      >
                        {translatedMuscle.charAt(0).toUpperCase() + translatedMuscle.slice(1)}
                      </Text>
                    </View>
                  );
                })}
              </ScrollView>
            </View>

            {/* Exercise list */}
            <Text
              style={[styles.sectionTitle, { color: theme.foreground.gray }]}
            >
              {t("scheduleDetail.exerciseList")}
            </Text>
            {routine.exercises.map((ex, idx) => (
              <ExerciseRow
                key={ex.id}
                exercise={ex}
                index={idx}
                theme={theme}
                isCompleted={isCompleted}
                t={t}
                i18n={i18n}
              />
            ))}

            {/* Actions */}
            <View style={styles.actionsRow}>
              {!isCompleted && (
                <>
                  {isPast && (
                    <TouchableOpacity
                      style={[
                        styles.secondaryBtn,
                        {
                          borderColor: "#4CAF50",
                          backgroundColor: "#4CAF5015",
                        },
                      ]}
                      onPress={handleMarkCompleted}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name="checkmark-circle-outline"
                        size={18}
                        color="#4CAF50"
                      />
                      <Text
                        style={[styles.secondaryBtnText, { color: "#4CAF50" }]}
                      >
                        {t("scheduleDetail.markComplete")}
                      </Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[
                      styles.primaryBtn,
                      { backgroundColor: theme.primary.main },
                    ]}
                    onPress={handleStartWorkout}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="play" size={18} color="#0B0D0E" />
                    <Text style={styles.primaryBtnText}>{t("scheduleDetail.startWorkout")}</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>

            {!isCompleted && (
              <TouchableOpacity
                style={styles.restDayLink}
                onPress={handleMarkRest}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.restDayLinkText,
                    { color: theme.foreground.gray },
                  ]}
                >
                  {t("scheduleDetail.changeToRestInstead")}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons
              name="calendar-outline"
              size={48}
              color={theme.foreground.gray}
            />
            <Text
              style={[styles.emptyTitle, { color: theme.foreground.white }]}
            >
              {t("scheduleDetail.nothingPlanned")}
            </Text>
            <Text style={[styles.emptyBody, { color: theme.foreground.gray }]}>
              {t("scheduleDetail.noWorkoutAssigned")}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
  },
  headerDate: {
    fontSize: 12,
    marginTop: 1,
  },
  completeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  // ── Status banner ──
  statusBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 18,
  },
  statusTitle: {
    fontSize: 14,
    fontFamily: FONTS.bold,
  },
  statusNotes: {
    fontSize: 12,
    marginTop: 3,
    lineHeight: 18,
  },
  // ── Rest view ──
  restView: {
    alignItems: "center",
    paddingTop: 20,
  },
  restIconLg: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  restTitle: {
    fontSize: 22,
    fontFamily: FONTS.bold,
    marginBottom: 10,
  },
  restBody: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  restTipsList: {
    width: "100%",
    gap: 8,
  },
  restTipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 12,
  },
  restTipText: {
    fontSize: 14,
    flex: 1,
  },
  // ── Routine card ──
  routineCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  routineCardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 14,
  },
  routineName: {
    fontSize: 20,
    fontFamily: FONTS.bold,
  },
  routineDesc: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  diffBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 2,
  },
  diffText: {
    fontSize: 10,
    fontFamily: FONTS.bold,
  },
  routineStats: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  routineStat: {
    flex: 1,
    alignItems: "center",
    gap: 3,
  },
  routineStatVal: {
    fontSize: 16,
    fontFamily: FONTS.bold,
  },
  routineStatLabel: {
    fontSize: 9,
    letterSpacing: 0.3,
    textAlign: "center",
  },
  routineStatDiv: {
    width: 1,
    alignSelf: "stretch",
  },
  muscleTags: {
    flexDirection: "row",
    gap: 6,
  },
  muscleTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  muscleTagText: {
    fontSize: 11,
    fontFamily: FONTS.semiBold,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: FONTS.bold,
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  // ── Exercise card ──
  exCard: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    overflow: "hidden",
  },
  exCardMain: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 10,
  },
  exIndexBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  exIndexText: {
    fontSize: 12,
    fontFamily: FONTS.bold,
  },
  exCardName: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    marginBottom: 4,
  },
  exMetaRow: {
    flexDirection: "row",
    gap: 5,
  },
  exMetaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  exMetaText: {
    fontSize: 10,
  },
  exNotes: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
  },
  exNotesText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
  setBreakdown: {
    padding: 12,
    gap: 6,
    borderTopWidth: 1,
  },
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  setNumBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  setNumText: {
    fontSize: 11,
    fontFamily: FONTS.semiBold,
  },
  setRepsText: {
    flex: 1,
    fontSize: 13,
  },
  // ── Actions ──
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 24,
  },
  primaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
    borderRadius: 26,
  },
  primaryBtnText: {
    fontSize: 17,
    fontFamily: FONTS.bold,
    color: "#0B0D0E",
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
    borderRadius: 26,
    borderWidth: 1.5,
  },
  secondaryBtnText: {
    fontSize: 15,
    fontFamily: FONTS.semiBold,
  },
  restDayLink: {
    alignItems: "center",
    paddingVertical: 14,
    marginTop: 6,
  },
  restDayLinkText: {
    fontSize: 13,
    textDecorationLine: "underline",
  },
  // ── Empty ──
  emptyState: {
    alignItems: "center",
    paddingTop: 60,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
  },
  emptyBody: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});

import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewToken,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Theme } from "../../constants/themes";
import { useActiveWorkout } from "../../contexts/ActiveWorkoutContext";
import { useTheme } from "../../contexts/ThemeContext";
import { formatDisplayDate, formatWeekday } from "../../utils/dateFormatter";
import { translateRoutineName } from "../../utils/exerciseTranslator";
import {
  addScheduleListener,
  getRoutineById,
  getScheduleForDate,
  Routine,
  ScheduledDay,
} from "../../data/mockData";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const MY_USER_ID = "1";

// ─── Date helpers ────────────────────────────────────────────────────────────

function toISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getDayLabel(offset: number, t: (key: string) => string): string {
  if (offset === -1) return t("schedule.yesterday");
  if (offset === 0) return t("schedule.today");
  if (offset === 1) return t("schedule.tomorrow");
  return t("schedule.in2Days");
}

function buildSlides(t: (key: string) => string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return [-1, 0, 1, 2].map((offset) => {
    const d = new Date(today);
    d.setDate(today.getDate() + offset);
    return {
      offset,
      date: toISO(d),
      label: getDayLabel(offset, t),
      dayName: formatWeekday(d),
      displayDate: formatDisplayDate(d),
    };
  });
}

// ─── Sub-components ──────────────────────────────────────────────────────────

interface DayCardProps {
  slide: ReturnType<typeof buildSlides>[number];
  schedDay: ScheduledDay | undefined;
  routine: Routine | undefined;
  theme: Theme;
  isToday: boolean;
  onPress: () => void;
  onStartWorkout: () => void;
}

function DayCard({
  slide,
  schedDay,
  routine,
  theme,
  isToday,
  onPress,
  onStartWorkout,
  t,
}: DayCardProps & { t: (key: string) => string }) {
  const isCompleted = schedDay?.status === "completed";
  const isRest = !schedDay || schedDay.status === "rest";

  const labelColor = isToday
    ? theme.primary.main
    : slide.offset < 0
      ? theme.foreground.gray
      : "#4FC3F7";

  const statusBadge = isCompleted
    ? { color: "#4CAF50", icon: "checkmark-circle" as const, text: t("schedule.completed") }
    : isRest
      ? {
          color: theme.foreground.gray,
          icon: "moon-outline" as const,
          text: t("schedule.restDay"),
        }
      : {
          color: theme.primary.main,
          icon: "time-outline" as const,
          text: t("schedule.scheduled"),
        };

  return (
    <View style={[styles.cardOuter, { width: SCREEN_WIDTH }]}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.background.accent,
            borderColor: isToday ? theme.primary.main : "transparent",
            borderWidth: isToday ? 1.5 : 0,
          },
        ]}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.cardScroll}
        >
          {/* ── Day label + status ── */}
          <View style={styles.cardTopRow}>
            <View style={[styles.dayLabelPill, { borderColor: labelColor }]}>
              <Text style={[styles.dayLabelText, { color: labelColor }]}>
                {slide.label}
              </Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: statusBadge.color + "22" },
              ]}
            >
              <Ionicons
                name={statusBadge.icon}
                size={12}
                color={statusBadge.color}
              />
              <Text
                style={[styles.statusBadgeText, { color: statusBadge.color }]}
              >
                {statusBadge.text}
              </Text>
            </View>
          </View>

          {/* ── Day name + date ── */}
          <Text style={[styles.dayName, { color: theme.foreground.white }]}>
            {slide.dayName}
          </Text>
          <Text style={[styles.dayDate, { color: theme.foreground.gray }]}>
            {slide.displayDate}
          </Text>

          {isRest ? (
            /* ── REST DAY ── */
            <RestDayContent theme={theme} notes={schedDay?.notes} t={t} />
          ) : (
            /* ── WORKOUT ── */
            <WorkoutContent
              routine={routine}
              schedDay={schedDay}
              theme={theme}
              isCompleted={isCompleted}
              t={t}
            />
          )}

          {/* ── Notes ── */}
          {schedDay?.notes && !isRest && (
            <View
              style={[
                styles.notesBox,
                { backgroundColor: theme.background.darker },
              ]}
            >
              <Ionicons
                name="document-text-outline"
                size={14}
                color={theme.foreground.gray}
              />
              <Text
                style={[styles.notesText, { color: theme.foreground.gray }]}
                numberOfLines={2}
              >
                {schedDay.notes}
              </Text>
            </View>
          )}

          {/* ── CTA Buttons ── */}
          <View style={styles.ctaRow}>
            {!isRest && (
              <TouchableOpacity
                style={[styles.detailBtn, { borderColor: theme.primary.main }]}
                onPress={onPress}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="list-outline"
                  size={16}
                  color={theme.primary.main}
                />
                <Text
                  style={[styles.detailBtnText, { color: theme.primary.main }]}
                >
                  {t("schedule.viewPlan")}
                </Text>
              </TouchableOpacity>
            )}

            {!isRest && !isCompleted && slide.offset <= 0 && (
              <TouchableOpacity
                style={[
                  styles.startBtn,
                  { backgroundColor: theme.primary.main },
                ]}
                onPress={onStartWorkout}
                activeOpacity={0.8}
              >
                <Ionicons name="play" size={16} color="#0B0D0E" />
                <Text style={styles.startBtnText}>
                  {slide.offset === 0 ? t("schedule.startWorkout") : t("schedule.startNow")}
                </Text>
              </TouchableOpacity>
            )}

            {!isRest && isCompleted && (
              <TouchableOpacity
                style={[styles.startBtn, { backgroundColor: "#4CAF50" }]}
                onPress={onPress}
                activeOpacity={0.8}
              >
                <Ionicons name="trophy-outline" size={16} color="#fff" />
                <Text style={[styles.startBtnText, { color: "#fff" }]}>
                  {t("schedule.viewSummary")}
                </Text>
              </TouchableOpacity>
            )}

            {isRest && (
              <TouchableOpacity
                style={[
                  styles.startBtn,
                  { backgroundColor: theme.background.darker, flex: 1 },
                ]}
                onPress={onPress}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="bed-outline"
                  size={16}
                  color={theme.foreground.gray}
                />
                <Text
                  style={[
                    styles.startBtnText,
                    { color: theme.foreground.gray },
                  ]}
                >
                  {t("schedule.restAndRecover")}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

function RestDayContent({ theme, notes, t }: { theme: Theme; notes?: string; t: (key: string) => string }) {
  return (
    <View style={styles.restContent}>
      <View
        style={[
          styles.restIconBox,
          { backgroundColor: theme.background.darker },
        ]}
      >
        <Ionicons name="moon" size={32} color={theme.foreground.gray} />
      </View>
      <Text style={[styles.restTitle, { color: theme.foreground.white }]}>
        {t("schedule.restDay")}
      </Text>
      <Text style={[styles.restSubtitle, { color: theme.foreground.gray }]}>
        {t("schedule.recoveryIsPart")}
      </Text>
      <View style={styles.restTips}>
        {[t("schedule.stayHydrated"), t("schedule.get8hSleep"), t("schedule.lightStretching")].map(
          (tip) => (
            <View
              key={tip}
              style={[
                styles.restTipChip,
                { backgroundColor: theme.background.darker },
              ]}
            >
              <Text
                style={[styles.restTipText, { color: theme.foreground.gray }]}
              >
                {tip}
              </Text>
            </View>
          ),
        )}
      </View>
    </View>
  );
}

function WorkoutContent({
  routine,
  schedDay,
  theme,
  isCompleted,
  t,
}: {
  routine: Routine | undefined;
  schedDay: ScheduledDay | undefined;
  theme: Theme;
  isCompleted: boolean;
  t: (key: string) => string;
}) {
  const { i18n } = useTranslation();
  const getTranslatedName = (name: string) => {
    return i18n.language === "fr" ? translateRoutineName(name) : name;
  };
  if (!routine) {
    return (
      <View style={styles.noRoutineBox}>
        <Text style={[styles.noRoutineText, { color: theme.foreground.gray }]}>
          {t("schedule.noRoutineAssigned")}
        </Text>
      </View>
    );
  }

  const diffColor =
    routine.difficulty === "beginner"
      ? "#4CAF50"
      : routine.difficulty === "intermediate"
        ? "#FF9800"
        : "#F44336";

  const totalSets = routine.exercises.reduce((s, e) => s + e.sets, 0);

  return (
    <View>
      {/* Workout title + difficulty */}
      <View style={styles.workoutTitleRow}>
        <View style={{ flex: 1 }}>
          <Text
            style={[styles.workoutName, { color: theme.foreground.white }]}
            numberOfLines={1}
          >
            {getTranslatedName(routine.name)}
          </Text>
          <Text
            style={[styles.workoutDesc, { color: theme.foreground.gray }]}
            numberOfLines={2}
          >
            {routine.description}
          </Text>
        </View>
        <View
          style={[
            styles.diffBadge,
            { backgroundColor: diffColor + "22", borderColor: diffColor },
          ]}
        >
          <Text style={[styles.diffText, { color: diffColor }]}>
            {routine.difficulty.charAt(0).toUpperCase() +
              routine.difficulty.slice(1)}
          </Text>
        </View>
      </View>

      {/* Stats strip */}
      <View
        style={[
          styles.statsStrip,
          { backgroundColor: theme.background.darker },
        ]}
      >
        <StatItem
          icon="barbell-outline"
          value={String(routine.exercises.length)}
          label={t("schedule.exercises")}
          theme={theme}
        />
        <View
          style={[
            styles.statDivider,
            { backgroundColor: theme.background.accent },
          ]}
        />
        <StatItem
          icon="layers-outline"
          value={String(totalSets)}
          label={t("schedule.totalSets")}
          theme={theme}
        />
        <View
          style={[
            styles.statDivider,
            { backgroundColor: theme.background.accent },
          ]}
        />
        <StatItem
          icon="time-outline"
          value={`${routine.estimatedDuration}m`}
          label={t("schedule.estTime")}
          theme={theme}
        />
      </View>

      {/* Muscle tags */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.muscleTags}
      >
        {routine.targetMuscles.map((muscle) => (
          <View
            key={muscle}
            style={[
              styles.muscleTag,
              { backgroundColor: theme.primary.main + "18" },
            ]}
          >
            <Text style={[styles.muscleTagText, { color: theme.primary.main }]}>
              {muscle.charAt(0).toUpperCase() + muscle.slice(1)}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Exercise Preview List */}
      <Text style={[styles.exercisesHeader, { color: theme.foreground.gray }]}>
        {t("schedule.exercises").toUpperCase()}
      </Text>
      {routine.exercises.slice(0, 5).map((ex, idx) => (
        <View
          key={ex.id}
          style={[
            styles.exRow,
            {
              backgroundColor:
                idx % 2 === 0 ? theme.background.darker : "transparent",
            },
          ]}
        >
          <View
            style={[
              styles.exNumBadge,
              { backgroundColor: theme.primary.main + "22" },
            ]}
          >
            <Text style={[styles.exNum, { color: theme.primary.main }]}>
              {idx + 1}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={[styles.exName, { color: theme.foreground.white }]}
              numberOfLines={1}
            >
              {ex.name}
            </Text>
          </View>
          <Text style={[styles.exSetsReps, { color: theme.foreground.gray }]}>
            {ex.sets} × {ex.reps}
          </Text>
          {isCompleted && (
            <Ionicons
              name="checkmark-circle"
              size={16}
              color="#4CAF50"
              style={{ marginLeft: 6 }}
            />
          )}
        </View>
      ))}
      {routine.exercises.length > 5 && (
        <Text style={[styles.moreExercises, { color: theme.foreground.gray }]}>
          +{routine.exercises.length - 5} {t("schedule.moreExercises")}
        </Text>
      )}
    </View>
  );
}

function StatItem({
  icon,
  value,
  label,
  theme,
}: {
  icon: keyof typeof import("@expo/vector-icons").Ionicons.glyphMap;
  value: string;
  label: string;
  theme: Theme;
}) {
  return (
    <View style={styles.statItem}>
      <Ionicons name={icon} size={16} color={theme.primary.main} />
      <Text style={[styles.statValue, { color: theme.foreground.white }]}>
        {value}
      </Text>
      <Text style={[styles.statLabel, { color: theme.foreground.gray }]}>
        {label}
      </Text>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function Schedule() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const router = useRouter();
  const { startWorkout } = useActiveWorkout();
  const flatListRef = useRef<FlatList>(null);

  const slides = buildSlides(t); // always fresh
  const todayIndex = 1; // index 1 → offset 0 = "today"

  const [activeIndex, setActiveIndex] = useState(todayIndex);
  const [scheduleData, setScheduleData] = useState<
    Record<string, ScheduledDay | undefined>
  >({});

  const loadData = useCallback(() => {
    const map: Record<string, ScheduledDay | undefined> = {};
    slides.forEach((s) => {
      map[s.date] = getScheduleForDate(s.date, MY_USER_ID);
    });
    setScheduleData(map);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadData();
    const unsub = addScheduleListener(loadData);
    return () => unsub();
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  // Scroll to today on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      flatListRef.current?.scrollToIndex({
        index: todayIndex,
        animated: false,
      });
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setActiveIndex(viewableItems[0].index);
      }
    },
  ).current;

  const viewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 50,
  }).current;

  const handleNavigateToDetail = (date: string) => {
    router.push(`/schedule/${date}` as any);
  };

  const handleStartWorkout = (
    slide: ReturnType<typeof buildSlides>[number],
  ) => {
    const schedDay = scheduleData[slide.date];
    if (!schedDay?.routineId) return;
    const routine = getRoutineById(schedDay.routineId);
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

  // Current day summary for header
  const todaySlide = slides[todayIndex];
  const todayEntry = scheduleData[todaySlide?.date ?? ""];
  const todayRoutine = todayEntry?.routineId
    ? getRoutineById(todayEntry.routineId)
    : undefined;

  return (
    <View
      style={[styles.container, { backgroundColor: theme.background.dark }]}
    >
      {/* ── Header ── */}
      <View
        style={[styles.header, { borderBottomColor: theme.background.accent }]}
      >
        <View>
          <Text style={[styles.headerTitle, { color: theme.foreground.white }]}>
            {t("schedule.mySchedule")}
          </Text>
          <Text style={[styles.headerSub, { color: theme.foreground.gray }]}>
            {formatDisplayDate(new Date(), { weekday: "long", month: "long", day: "numeric" })}
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.headerBtn,
            { backgroundColor: theme.background.accent },
          ]}
          onPress={() => router.push(`/schedule/${toISO(new Date())}` as any)}
          activeOpacity={0.7}
        >
          <Ionicons
            name="calendar-outline"
            size={20}
            color={theme.primary.main}
          />
        </TouchableOpacity>
      </View>

      {/* ── Today's quick summary strip ── */}
      {todayEntry && todayEntry.status !== "rest" && todayRoutine && (
        <TouchableOpacity
          style={[
            styles.summaryStrip,
            {
              backgroundColor: theme.primary.main + "14",
              borderLeftColor: theme.primary.main,
            },
          ]}
          onPress={() => handleNavigateToDetail(todaySlide.date)}
          activeOpacity={0.8}
        >
          <Ionicons name="flash" size={16} color={theme.primary.main} />
          <Text
            style={[styles.summaryText, { color: theme.foreground.white }]}
            numberOfLines={1}
          >
            {t("schedule.today")}:{" "}
            <Text style={{ color: theme.primary.main }}>
              {todayRoutine.name}
            </Text>
            {"  "}
            <Text style={{ color: theme.foreground.gray }}>
              · {todayRoutine.exercises.length} exercises ·{" "}
              {todayRoutine.estimatedDuration}min
            </Text>
          </Text>
          <Ionicons
            name="chevron-forward"
            size={14}
            color={theme.foreground.gray}
          />
        </TouchableOpacity>
      )}

      {/* ── Carousel ── */}
      <FlatList
        ref={flatListRef}
        data={slides}
        keyExtractor={(item) => item.date}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
        renderItem={({ item }) => {
          const schedDay = scheduleData[item.date];
          const routine = schedDay?.routineId
            ? getRoutineById(schedDay.routineId)
            : undefined;
          return (
            <DayCard
              slide={item}
              schedDay={schedDay}
              routine={routine}
              theme={theme}
              isToday={item.offset === 0}
              onPress={() => handleNavigateToDetail(item.date)}
              onStartWorkout={() => handleStartWorkout(item)}
              t={t}
            />
          );
        }}
        style={styles.carousel}
      />

      {/* ── Dots indicator ── */}
      <View style={styles.dotsRow}>
        {slides.map((s, idx) => (
          <TouchableOpacity
            key={s.date}
            onPress={() =>
              flatListRef.current?.scrollToIndex({ index: idx, animated: true })
            }
          >
            <View
              style={[
                styles.dot,
                {
                  backgroundColor:
                    activeIndex === idx
                      ? theme.primary.main
                      : theme.background.accent,
                  width: activeIndex === idx ? 20 : 8,
                },
              ]}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 13,
    marginTop: 2,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryStrip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderLeftWidth: 3,
  },
  summaryText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
  },
  carousel: {
    flex: 1,
    marginTop: 8,
  },
  // ── Card ──
  cardOuter: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  card: {
    flex: 1,
    borderRadius: 20,
    overflow: "hidden",
  },
  cardScroll: {
    padding: 20,
    paddingBottom: 24,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  dayLabelPill: {
    borderWidth: 1.5,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  dayLabelText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  dayName: {
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  dayDate: {
    fontSize: 13,
    marginTop: 2,
    marginBottom: 16,
  },
  // ── Rest Day ──
  restContent: {
    alignItems: "center",
    paddingVertical: 20,
  },
  restIconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  restTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  restSubtitle: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  restTips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
  },
  restTipChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  restTipText: {
    fontSize: 12,
  },
  // ── Workout content ──
  workoutTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 14,
  },
  workoutName: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  workoutDesc: {
    fontSize: 12,
    marginTop: 3,
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
    fontWeight: "700",
  },
  statsStrip: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 10,
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    alignSelf: "stretch",
  },
  muscleTags: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 16,
  },
  muscleTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  muscleTagText: {
    fontSize: 11,
    fontWeight: "600",
  },
  exercisesHeader: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: 8,
    marginTop: 4,
  },
  exRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 8,
    marginBottom: 2,
    gap: 10,
  },
  exNumBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  exNum: {
    fontSize: 11,
    fontWeight: "700",
  },
  exName: {
    fontSize: 13,
    fontWeight: "500",
  },
  exSetsReps: {
    fontSize: 12,
    fontWeight: "600",
  },
  moreExercises: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 4,
  },
  noRoutineBox: {
    padding: 20,
    alignItems: "center",
  },
  noRoutineText: {
    fontSize: 14,
  },
  // ── Notes ──
  notesBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 12,
    borderRadius: 10,
    marginTop: 14,
    marginBottom: 4,
  },
  notesText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
  // ── CTA ──
  ctaRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
  },
  detailBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  detailBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },
  startBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
  },
  startBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0B0D0E",
  },
  // ── Dots ──
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    paddingTop: 12,
    paddingBottom: 90,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
});

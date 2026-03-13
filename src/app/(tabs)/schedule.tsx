import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewToken,
} from "react-native";
import { Theme } from "../../constants/themes";
import { useActiveWorkout } from "../../contexts/ActiveWorkoutContext";
import { useTheme } from "../../contexts/ThemeContext";
import {
  addScheduleListener,
  getRoutineById,
  getScheduleForDate,
  Routine,
  ScheduledDay,
} from "../../data/mockData";
import { formatDisplayDate, formatWeekday } from "../../utils/dateFormatter";
import {
  translateApiData,
  translateExerciseTerm,
  translateRoutineDescription,
  translateRoutineName,
} from "../../utils/exerciseTranslator";

import { FONTS } from "../../constants/fonts";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const MY_USER_ID = "1";

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
      shortDayName: formatWeekday(d, { weekday: "short" }),
      dayNumber: formatDisplayDate(d, { day: "numeric" }),
      dayName: formatWeekday(d),
      displayDate: formatDisplayDate(d),
    };
  });
}

type Slide = ReturnType<typeof buildSlides>[number];

function getStatusMeta(
  schedDay: ScheduledDay | undefined,
  theme: Theme,
  t: (key: string) => string,
) {
  if (schedDay?.status === "completed") {
    return {
      color: "#4CAF50",
      icon: "checkmark-circle" as const,
      text: t("schedule.completed"),
    };
  }

  if (!schedDay || schedDay.status === "rest") {
    return {
      color: theme.foreground.gray,
      icon: "moon-outline" as const,
      text: t("schedule.restDay"),
    };
  }

  return {
    color: theme.primary.main,
    icon: "time-outline" as const,
    text: t("schedule.scheduled"),
  };
}

interface DayCardProps {
  slide: Slide;
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
  i18n,
}: DayCardProps & { t: (key: string) => string; i18n: { language: string } }) {
  const isCompleted = schedDay?.status === "completed";
  const isRest = !schedDay || schedDay.status === "rest";
  const statusBadge = getStatusMeta(schedDay, theme, t);
  const headerTint = isToday
    ? theme.primary.main
    : slide.offset < 0
      ? theme.foreground.gray
      : theme.foreground.white;

  return (
    <TouchableOpacity
      style={[styles.cardOuter, { width: SCREEN_WIDTH }]}
      onPress={onPress}
      activeOpacity={0.88}
    >
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.background.accent,
            borderColor: isToday
              ? theme.primary.main + "44"
              : theme.background.darker,
          },
        ]}
      >
        <View style={styles.cardInner}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderCopy}>
              <Text style={[styles.cardEyebrow, { color: headerTint }]}>
                {slide.label.toUpperCase()}
              </Text>
              <Text style={[styles.dayName, { color: theme.foreground.white }]}>
                {slide.dayName}
              </Text>
              <Text style={[styles.dayDate, { color: theme.foreground.gray }]}>
                {slide.displayDate}
              </Text>
            </View>

            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: statusBadge.color + "18",
                  borderColor: statusBadge.color + "22",
                },
              ]}
            >
              <Ionicons
                name={statusBadge.icon}
                size={13}
                color={statusBadge.color}
              />
              <Text
                style={[styles.statusBadgeText, { color: statusBadge.color }]}
              >
                {statusBadge.text}
              </Text>
            </View>
          </View>

          {isRest ? (
            <RestDayContent theme={theme} notes={schedDay?.notes} t={t} />
          ) : (
            <WorkoutContent routine={routine} theme={theme} t={t} i18n={i18n} />
          )}

          <View style={styles.ctaRow}>
            {!isRest && !isCompleted && slide.offset <= 0 && (
              <TouchableOpacity
                style={[
                  styles.startBtn,
                  { backgroundColor: theme.primary.main, flex: 1 },
                ]}
                onPress={onStartWorkout}
                activeOpacity={0.85}
              >
                <Ionicons name="play" size={16} color="#0B0D0E" />
                <Text style={styles.startBtnText}>
                  {slide.offset === 0
                    ? t("schedule.startWorkout")
                    : t("schedule.startNow")}
                </Text>
              </TouchableOpacity>
            )}

            {!isRest && isCompleted && (
              <TouchableOpacity
                style={[
                  styles.startBtn,
                  { backgroundColor: "#4CAF50", flex: 1 },
                ]}
                onPress={onPress}
                activeOpacity={0.85}
              >
                <Ionicons name="trophy-outline" size={16} color="#fff" />
                <Text style={[styles.startBtnText, { color: "#fff" }]}>
                  {t("schedule.viewSummary")}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function RestDayContent({
  theme,
  notes,
  t,
}: {
  theme: Theme;
  notes?: string;
  t: (key: string) => string;
}) {
  const recoveryTips = [
    t("schedule.stayHydrated"),
    t("schedule.get8hSleep"),
    t("schedule.lightStretching"),
  ];

  return (
    <View style={styles.restContent}>
      <View style={styles.restHero}>
        <View
          style={[
            styles.restIconBox,
            { backgroundColor: theme.background.darker },
          ]}
        >
          <Ionicons name="moon" size={30} color={theme.foreground.gray} />
        </View>
        <Text style={[styles.restTitle, { color: theme.foreground.white }]}>
          {t("schedule.restDay")}
        </Text>
        <Text style={[styles.restSubtitle, { color: theme.foreground.gray }]}>
          {t("schedule.recoveryIsPart")}
        </Text>
      </View>

      <View
        style={[
          styles.restChecklist,
          { backgroundColor: theme.background.darker },
        ]}
      >
        {recoveryTips.map((tip, index) => (
          <View
            key={tip}
            style={[
              styles.restChecklistRow,
              index < recoveryTips.length - 1 && {
                borderBottomColor: theme.background.accent,
                borderBottomWidth: StyleSheet.hairlineWidth,
              },
            ]}
          >
            <Ionicons
              name="checkmark-circle"
              size={18}
              color={theme.primary.main}
            />
            <Text
              style={[styles.restTipText, { color: theme.foreground.white }]}
            >
              {tip}
            </Text>
          </View>
        ))}
      </View>

      {notes ? (
        <View
          style={[
            styles.notesBox,
            { backgroundColor: theme.background.darker, marginTop: 0 },
          ]}
        >
          <Ionicons
            name="document-text-outline"
            size={16}
            color={theme.foreground.gray}
          />
          <Text style={[styles.notesText, { color: theme.foreground.gray }]}>
            {notes}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function WorkoutContent({
  routine,
  theme,
  t,
  i18n,
}: {
  routine: Routine | undefined;
  theme: Theme;
  t: (key: string) => string;
  i18n: { language: string };
}) {
  if (!routine) {
    return (
      <View
        style={[
          styles.noRoutineBox,
          { backgroundColor: theme.background.darker },
        ]}
      >
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

  const totalSets = routine.exercises.reduce((sum, exercise) => {
    return sum + exercise.sets;
  }, 0);

  return (
    <View>
      <View style={styles.workoutTitleRow}>
        <View style={styles.workoutCopy}>
          <Text
            style={[styles.workoutName, { color: theme.foreground.white }]}
            numberOfLines={1}
          >
            {translateRoutineName(routine.name)}
          </Text>
          <Text
            style={[styles.workoutDesc, { color: theme.foreground.gray }]}
            numberOfLines={2}
          >
            {translateRoutineDescription(routine.description)}
          </Text>
        </View>
        <View
          style={[
            styles.diffBadge,
            {
              backgroundColor: diffColor + "18",
              borderColor: diffColor + "26",
            },
          ]}
        >
          <Text style={[styles.diffText, { color: diffColor }]}>
            {translateApiData(routine.difficulty)}
          </Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View
          style={[
            styles.statTile,
            { backgroundColor: theme.background.darker },
          ]}
        >
          <StatItem
            icon="barbell-outline"
            value={String(routine.exercises.length)}
            label={t("schedule.exercises")}
            theme={theme}
          />
        </View>
        <View
          style={[
            styles.statTile,
            { backgroundColor: theme.background.darker },
          ]}
        >
          <StatItem
            icon="layers-outline"
            value={String(totalSets)}
            label={t("schedule.totalSets")}
            theme={theme}
          />
        </View>
        <View
          style={[
            styles.statTile,
            { backgroundColor: theme.background.darker },
          ]}
        >
          <StatItem
            icon="time-outline"
            value={`${routine.estimatedDuration}m`}
            label={t("schedule.estTime")}
            theme={theme}
          />
        </View>
      </View>

      <View style={styles.muscleTags}>
        {routine.targetMuscles.map((muscle) => {
          const translatedMuscle =
            i18n.language === "fr"
              ? translateExerciseTerm(muscle, "targetMuscles")
              : muscle;

          return (
            <View
              key={muscle}
              style={[
                styles.muscleTag,
                { backgroundColor: theme.primary.main + "18" },
              ]}
            >
              <Text
                style={[styles.muscleTagText, { color: theme.primary.main }]}
              >
                {translatedMuscle.charAt(0).toUpperCase() +
                  translatedMuscle.slice(1)}
              </Text>
            </View>
          );
        })}
      </View>
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
      <Text style={[styles.statLabel, { color: theme.foreground.gray }]}>
        {label}
      </Text>
      <Text style={[styles.statValue, { color: theme.foreground.white }]}>
        {value}
      </Text>
    </View>
  );
}

export default function Schedule() {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const router = useRouter();
  const { startWorkout } = useActiveWorkout();
  const flatListRef = useRef<FlatList<Slide>>(null);

  const slides = buildSlides(t);
  const todayIndex = 1;

  const [activeIndex, setActiveIndex] = useState(todayIndex);
  const [scheduleData, setScheduleData] = useState<
    Record<string, ScheduledDay | undefined>
  >({});

  const loadData = useCallback(() => {
    const map: Record<string, ScheduledDay | undefined> = {};
    slides.forEach((slide) => {
      map[slide.date] = getScheduleForDate(slide.date, MY_USER_ID);
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
    viewAreaCoveragePercentThreshold: 55,
  }).current;

  const handleNavigateToDetail = (date: string) => {
    router.push(`/schedule/${date}` as any);
  };

  const handleScrollToIndex = (index: number) => {
    setActiveIndex(index);
    flatListRef.current?.scrollToIndex({ index, animated: true });
  };

  const handleStartWorkout = (slide: Slide) => {
    const schedDay = scheduleData[slide.date];
    if (!schedDay?.routineId) return;

    const routine = getRoutineById(schedDay.routineId);
    if (!routine) return;

    startWorkout({
      id: `workout-${Date.now()}`,
      duration: 0,
      volume: 0,
      sets: 0,
      exercises: routine.exercises.map((exercise, index) => ({
        id: `entry-${Date.now()}-${index}`,
        exerciseId: 0,
        name: exercise.name,
        muscles: [],
        equipment: [],
        notes: exercise.notes,
        addedAt: Date.now(),
        sets: Array.from({ length: exercise.sets }, (_, setIndex) => ({
          id: `set-${Date.now()}-${index}-${setIndex}`,
          setNumber: setIndex + 1,
          kg: "",
          reps: exercise.reps.includes("-")
            ? exercise.reps.split("-")[0]
            : exercise.reps,
          isCompleted: false,
        })),
      })),
    });
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.background.dark }]}
    >
      <View style={styles.topSection}>
        <View style={styles.header}>
          <View style={styles.headerCopyBlock}>
            <Text style={[styles.headerEyebrow, { color: theme.primary.main }]}>
              {formatDisplayDate(new Date(), { weekday: "long" })}
            </Text>
            <Text
              style={[styles.headerTitle, { color: theme.foreground.white }]}
            >
              {t("schedule.mySchedule")}
            </Text>
            <Text style={[styles.headerSub, { color: theme.foreground.gray }]}>
              {formatDisplayDate(new Date(), {
                month: "long",
                day: "numeric",
              })}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.headerBtn,
              {
                backgroundColor: theme.background.accent,
                borderColor: theme.background.darker,
              },
            ]}
            onPress={() => router.push(`/schedule/${toISO(new Date())}` as any)}
            activeOpacity={0.75}
          >
            <Ionicons
              name="calendar-outline"
              size={20}
              color={theme.primary.main}
            />
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.daySwitcher,
            {
              backgroundColor: theme.background.accent,
              borderColor: theme.background.darker,
            },
          ]}
        >
          {slides.map((slide, index) => {
            const isActive = index === activeIndex;

            return (
              <TouchableOpacity
                key={slide.date}
                style={[
                  styles.daySwitcherItem,
                  {
                    backgroundColor: isActive
                      ? theme.background.darker
                      : "transparent",
                    borderColor: isActive
                      ? theme.primary.main + "44"
                      : "transparent",
                  },
                ]}
                onPress={() => handleScrollToIndex(index)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.daySwitcherLabel,
                    {
                      color: isActive
                        ? theme.primary.main
                        : theme.foreground.gray,
                    },
                  ]}
                >
                  {slide.shortDayName}
                </Text>
                <Text
                  style={[
                    styles.daySwitcherDate,
                    {
                      color: theme.foreground.white,
                      opacity: isActive ? 1 : 0.78,
                    },
                  ]}
                >
                  {slide.dayNumber}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

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
              i18n={i18n}
            />
          );
        }}
        style={styles.carousel}
        contentContainerStyle={styles.carouselContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topSection: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  headerCopyBlock: {
    flex: 1,
    paddingRight: 16,
  },
  headerEyebrow: {
    fontSize: 13,
    fontFamily: FONTS.bold,
    letterSpacing: 0.3,
    textTransform: "capitalize",
  },
  headerTitle: {
    fontSize: 34,
    fontFamily: FONTS.extraBold,
    letterSpacing: -1,
    marginTop: 4,
  },
  headerSub: {
    fontSize: 15,
    marginTop: 4,
    lineHeight: 20,
  },
  headerBtn: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginTop: 8,
  },
  daySwitcher: {
    flexDirection: "row",
    gap: 8,
    padding: 6,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 14,
  },
  daySwitcherItem: {
    flex: 1,
    minHeight: 62,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  daySwitcherLabel: {
    fontSize: 11,
    fontFamily: FONTS.bold,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  daySwitcherDate: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    marginTop: 2,
    letterSpacing: -0.4,
  },
  summaryCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  summaryTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
    gap: 12,
  },
  summaryPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  summaryPillText: {
    fontSize: 11,
    fontFamily: FONTS.bold,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  summaryTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    letterSpacing: -0.4,
  },
  summaryCaption: {
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6,
  },
  summaryFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
  },
  summaryAction: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
  },
  carousel: {
    flex: 1,
    marginTop: 8,
  },
  carouselContent: {
    paddingBottom: 90,
  },
  cardOuter: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  card: {
    flex: 1,
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  cardInner: {
    padding: 20,
    paddingBottom: 24,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 18,
  },
  cardHeaderCopy: {
    flex: 1,
  },
  cardEyebrow: {
    fontSize: 11,
    fontFamily: FONTS.bold,
    letterSpacing: 1.1,
    marginBottom: 6,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 11,
    fontFamily: FONTS.semiBold,
  },
  dayName: {
    fontSize: 30,
    fontFamily: FONTS.extraBold,
    letterSpacing: -0.8,
  },
  dayDate: {
    fontSize: 14,
    marginTop: 4,
  },
  restContent: {
    gap: 16,
  },
  restHero: {
    alignItems: "center",
    paddingVertical: 8,
  },
  restIconBox: {
    width: 74,
    height: 74,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  restTitle: {
    fontSize: 22,
    fontFamily: FONTS.bold,
    marginBottom: 8,
  },
  restSubtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 21,
    paddingHorizontal: 16,
  },
  restChecklist: {
    borderRadius: 18,
    overflow: "hidden",
  },
  restChecklistRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  restTipText: {
    flex: 1,
    fontSize: 14,
    fontFamily: FONTS.medium,
  },
  workoutTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 16,
  },
  workoutCopy: {
    flex: 1,
  },
  workoutName: {
    fontSize: 22,
    fontFamily: FONTS.bold,
    letterSpacing: -0.5,
  },
  workoutDesc: {
    fontSize: 13,
    marginTop: 6,
    lineHeight: 20,
  },
  diffBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 2,
  },
  diffText: {
    fontSize: 11,
    fontFamily: FONTS.bold,
    textTransform: "capitalize",
  },
  statsGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  statTile: {
    flex: 1,
    padding: 14,
    borderRadius: 18,
  },
  statItem: {
    gap: 6,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: FONTS.semiBold,
    lineHeight: 14,
  },
  statValue: {
    fontSize: 19,
    fontFamily: FONTS.bold,
    letterSpacing: -0.4,
  },
  muscleTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 18,
  },
  muscleTag: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  muscleTagText: {
    fontSize: 12,
    fontFamily: FONTS.semiBold,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: FONTS.bold,
    letterSpacing: 1,
    marginBottom: 10,
  },
  exerciseList: {
    borderRadius: 18,
    overflow: "hidden",
  },
  exerciseRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  exerciseCopy: {
    flex: 1,
  },
  exNumBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  exNum: {
    fontSize: 12,
    fontFamily: FONTS.bold,
  },
  exName: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
  },
  exSetsReps: {
    fontSize: 13,
    fontFamily: FONTS.semiBold,
  },
  exerciseCheck: {
    marginLeft: 2,
  },
  moreExercises: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 10,
  },
  noRoutineBox: {
    padding: 18,
    borderRadius: 18,
    alignItems: "center",
  },
  noRoutineText: {
    fontSize: 14,
  },
  notesBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    borderRadius: 16,
    marginTop: 16,
  },
  notesText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
  ctaRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 22,
  },
  detailBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    borderRadius: 22,
  },
  detailBtnText: {
    fontSize: 15,
    fontFamily: FONTS.semiBold,
  },
  startBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    borderRadius: 22,
  },
  startBtnText: {
    fontSize: 15,
    fontFamily: FONTS.bold,
    color: "#0B0D0E",
  },
});


import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import { translateExerciseName } from "../../utils/exerciseTranslator";
import { Theme } from "../../constants/themes";
import { useCreateRoutine } from "../../contexts/CreateRoutineContext";
import { useTheme } from "../../contexts/ThemeContext";
import { RoutineExercise, SetTarget } from "../../data/mockData";
import { api } from "../../services/api";
import { ApiRoutine } from "../../utils/routineMapper";

import { FONTS } from "../../constants/fonts";

const WORKOUT_REMINDER_KEY = "@hylift_workout_reminder";
const WORKOUT_REMINDER_TIME_KEY = "@hylift_workout_reminder_time";
const DEFAULT_WORKOUT_REMINDER_TIME = "17:30";

const EDITOR_CARD_COLORS = {
  sets: {
    depth: "#075985",
    face: "#0E7490",
    accent: "#67E8F9",
    text: "#F0FDFF",
    muted: "#BAF4FF",
    input: "#083344",
  },
  reps: {
    depth: "#6D28D9",
    face: "#7C3AED",
    accent: "#C4B5FD",
    text: "#F5F3FF",
    muted: "#DDD6FE",
    input: "#2E1065",
  },
  weight: {
    depth: "#BE123C",
    face: "#E11D48",
    accent: "#FDA4AF",
    text: "#FFF1F2",
    muted: "#FFE4E6",
    input: "#4C0519",
  },
  rest: {
    depth: "#0F766E",
    face: "#0D9488",
    accent: "#99F6E4",
    text: "#F0FDFA",
    muted: "#CCFBF1",
    input: "#134E4A",
  },
  time: {
    depth: "#9A3412",
    face: "#EA580C",
    accent: "#FDBA74",
    text: "#FFF7ED",
    muted: "#FED7AA",
    input: "#431407",
  },
  setDetails: {
    depth: "#1D4ED8",
    face: "#2563EB",
    accent: "#BFDBFE",
    text: "#EFF6FF",
    muted: "#DBEAFE",
    input: "#1E3A8A",
  },
  notes: {
    depth: "#166534",
    face: "#16A34A",
    accent: "#BBF7D0",
    text: "#F0FDF4",
    muted: "#DCFCE7",
    input: "#14532D",
  },
} as const;

type EditorCardColor =
  (typeof EDITOR_CARD_COLORS)[keyof typeof EDITOR_CARD_COLORS];

const getDifficulties = (t: (key: string) => string) => [
  { value: "beginner", label: t("createRoutine.beginner"), color: "#22c55e" },
  { value: "intermediate", label: t("createRoutine.intermediate"), color: "#f59e0b" },
  { value: "advanced", label: t("createRoutine.advanced"), color: "#ef4444" },
] as const;

export default function CreateRoutineScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const router = useRouter();
  const params = useLocalSearchParams<{
    fromWeekSetup?: string;
    dayOfWeek?: string;
    dayLabel?: string;
  }>();
  const DIFFICULTIES = getDifficulties(t);
  const setupDayIndex = Number(params.dayOfWeek);
  const isWeekSetup =
    params.fromWeekSetup === "1" &&
    Number.isInteger(setupDayIndex) &&
    setupDayIndex >= 0 &&
    setupDayIndex <= 6;
  const setupDayLabel =
    typeof params.dayLabel === "string" && params.dayLabel.trim()
      ? params.dayLabel.trim()
      : t("home.todaysWorkout");

  const {
    isCreating,
    draft,
    initCreation,
    updateDraft,
    removeExerciseFromRoutine,
    updateRoutineExercise,
    clearCreation,
  } = useCreateRoutine();

  const didPrefillWeekSetup = useRef(false);
  useEffect(() => {
    if (!isCreating) initCreation();
    if (isWeekSetup && !didPrefillWeekSetup.current && !draft.name.trim()) {
      didPrefillWeekSetup.current = true;
      updateDraft({
        name: t("createRoutine.weekRoutineName", "{{day}} workout", {
          day: setupDayLabel,
        }),
        description: t(
          "createRoutine.weekRoutineDescription",
          "Planned from your weekly workout setup.",
        ),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(
    null,
  );
  const [isSavingRoutine, setIsSavingRoutine] = useState(false);
  const editingExercise = editingExerciseId
    ? draft.exercises.find((e) => e.id === editingExerciseId) ?? null
    : null;

  // Auto scroll when exercises change
  const scrollRef = useRef<ScrollView>(null);
  const prevExCount = useRef(draft.exercises.length);
  useEffect(() => {
    if (draft.exercises.length > prevExCount.current) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
    prevExCount.current = draft.exercises.length;
  }, [draft.exercises.length]);

  const handleSave = async () => {
    if (isSavingRoutine) return;

    if (!draft.name.trim()) {
      Alert.alert(t("createRoutine.missingName"), t("createRoutine.pleaseEnterRoutineName"));
      return;
    }
    if (draft.exercises.length === 0) {
      Alert.alert(t("createRoutine.noExercises"), t("createRoutine.addAtLeastOneExercise"));
      return;
    }

    const estimatedDuration = draft.exercises.reduce(
      (total, ex) =>
        total +
        (ex.sets * (Math.ceil(parseInt(ex.reps) || 10) * 4 + ex.restTime)) / 60,
      0,
    );

    let createdRoutine: ApiRoutine | undefined;
    let saveError: any = null;

    setIsSavingRoutine(true);
    try {
      createdRoutine = (await api.createRoutine({
        name: draft.name.trim(),
        description: draft.description.trim(),
        difficulty: draft.difficulty,
        targetMuscles: draft.targetMuscles,
        exercises: draft.exercises,
        estimatedDuration: Math.round(estimatedDuration),
      })) as ApiRoutine;

      if (isWeekSetup && createdRoutine?.id) {
        await api.upsertScheduleAssignment(setupDayIndex, {
          is_rest_day: false,
          routine_id: createdRoutine.id,
        });
        await AsyncStorage.multiSet([
          [WORKOUT_REMINDER_KEY, "true"],
          [WORKOUT_REMINDER_TIME_KEY, DEFAULT_WORKOUT_REMINDER_TIME],
        ]);
      }
    } catch (error: any) {
      saveError = error;
    }

    setIsSavingRoutine(false);

    if (saveError) {
      Alert.alert(
        t("createRoutine.saveRoutineFailed", "Could not save routine"),
        saveError?.message || t("createRoutine.tryAgain", "Please try again."),
      );
      return;
    }

    clearCreation();
    router.back();
  };

  const handleDiscard = () => {
    Alert.alert(t("createRoutine.discardRoutine"), t("createRoutine.allChangesLost"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("createRoutine.discard"),
        style: "destructive",
        onPress: () => {
          clearCreation();
          router.back();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleDiscard} style={styles.headerBtn}>
          <Ionicons name="close" size={24} color={theme.foreground.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("createRoutine.title")}</Text>
        <TouchableOpacity
          onPress={handleSave}
          style={[styles.saveBtn, isSavingRoutine && styles.saveBtnDisabled]}
          disabled={isSavingRoutine}
        >
          <Text style={styles.saveBtnText}>{t("common.save")}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.content}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Name */}
        <View style={styles.section}>
          <Text style={styles.label}>{t("createRoutine.routineName")}</Text>
          <TextInput
            style={styles.input}
            placeholder={t("createRoutine.routineNamePlaceholder")}
            placeholderTextColor={theme.foreground.gray}
            value={draft.name}
            onChangeText={(v) => updateDraft({ name: v })}
            maxLength={60}
          />
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.label}>{t("createRoutine.description")}</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            placeholder={t("createRoutine.descriptionPlaceholder")}
            placeholderTextColor={theme.foreground.gray}
            value={draft.description}
            onChangeText={(v) => updateDraft({ description: v })}
            multiline
            maxLength={200}
          />
        </View>

        {/* Difficulty */}
        <View style={styles.section}>
          <Text style={styles.label}>{t("createRoutine.difficulty")}</Text>
          <View style={styles.difficultyRow}>
            {DIFFICULTIES.map((d) => (
              <TouchableOpacity
                key={d.value}
                style={[
                  styles.difficultyBtn,
                  draft.difficulty === d.value && {
                    backgroundColor: d.color + "25",
                    borderColor: d.color,
                  },
                ]}
                onPress={() => updateDraft({ difficulty: d.value })}
              >
                <View
                  style={[styles.difficultyDot, { backgroundColor: d.color }]}
                />
                <Text
                  style={[
                    styles.difficultyBtnText,
                    draft.difficulty === d.value && { color: d.color },
                  ]}
                >
                  {d.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Exercises */}
        <View style={styles.section}>
          <View style={styles.exercisesHeader}>
            <Text style={styles.label}>
              {t("createRoutine.exercises")} ({draft.exercises.length})
            </Text>
            <TouchableOpacity
              style={styles.addExBtn}
              onPress={() => router.push("/exercise-picker" as any)}
            >
              <Ionicons name="add" size={18} color={theme.background.dark} />
              <Text style={styles.addExBtnText}>{t("createRoutine.add")}</Text>
            </TouchableOpacity>
          </View>

          {draft.exercises.length === 0 ? (
            <TouchableOpacity
              style={styles.emptyEx}
              onPress={() => router.push("/exercise-picker" as any)}
            >
              <Ionicons
                name="barbell-outline"
                size={32}
                color={theme.foreground.gray}
              />
              <Text style={styles.emptyExText}>{t("createRoutine.tapToAddExercises")}</Text>
            </TouchableOpacity>
          ) : (
            draft.exercises.map((ex, index) => (
              <ExerciseSummaryCard
                key={ex.id}
                exercise={ex}
                index={index}
                theme={theme}
                styles={styles}
                onEdit={() => setEditingExerciseId(ex.id)}
                onRemove={() => removeExerciseFromRoutine(ex.id)}
              />
            ))
          )}
        </View>

        {/* Target Muscles (auto-detected, read-only chips) */}
        {draft.targetMuscles.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.label}>{t("createRoutine.targetMuscles")}</Text>
            <View style={styles.muscleChips}>
              {draft.targetMuscles.map((m) => (
                <View key={m} style={styles.muscleChip}>
                  <Text style={styles.muscleChipText}>{m}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Per-exercise editor sheet */}
      <ExerciseEditorSheet
        visible={!!editingExercise}
        exercise={editingExercise}
        theme={theme}
        styles={styles}
        onClose={() => setEditingExerciseId(null)}
        onUpdate={(updates) => {
          if (editingExerciseId) updateRoutineExercise(editingExerciseId, updates);
        }}
        t={t}
      />

      <Modal
        visible={isSavingRoutine}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => null}
      >
        <View style={styles.savingModalBackdrop}>
          <View style={styles.savingModalDepth}>
            <View style={styles.savingModalCard}>
              <View style={styles.savingSpinnerWrap}>
                <ActivityIndicator size="large" color="#67E8F9" />
              </View>
              <Text style={styles.savingModalTitle}>
                {t("createRoutine.saveRoutineInProgress", "Saving routine...")}
              </Text>
              <Text style={styles.savingModalText}>
                {t(
                  "createRoutine.saveRoutineInProgressSubtitle",
                  "One moment, we are saving your workout.",
                )}
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Summary card shown in the routine list ────────────────────────────
interface SummaryProps {
  exercise: RoutineExercise;
  index: number;
  theme: Theme;
  styles: ReturnType<typeof createStyles>;
  onEdit: () => void;
  onRemove: () => void;
}

function ExerciseSummaryCard({
  exercise,
  index,
  theme,
  styles,
  onEdit,
  onRemove,
}: SummaryProps) {
  return (
    <View style={styles.exerciseCardShell}>
      <Pressable
        onPress={onEdit}
        style={({ pressed }) => [
          styles.exerciseCard,
          pressed && styles.exerciseCardPressed,
        ]}
      >
        <View style={styles.exerciseCardAccent} />

        <View style={styles.exerciseGifWrap}>
          {exercise.gifUrl ? (
            <Image
              source={{ uri: exercise.gifUrl }}
              style={styles.exerciseGif}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View style={[styles.exerciseGif, styles.exerciseGifPlaceholder]}>
              <Ionicons
                name="barbell-outline"
                size={26}
                color="#BAF4FF"
              />
            </View>
          )}
          <View style={styles.exerciseIndexBadge}>
            <Text style={styles.exerciseIndexText}>{index + 1}</Text>
          </View>
        </View>

        <View style={styles.exerciseBody}>
          <Text style={styles.exerciseName} numberOfLines={1}>
            {translateExerciseName(exercise.name)}
          </Text>
          <View style={styles.exerciseSummaryRow}>
            <View style={styles.summaryPill}>
              <Text style={styles.summaryPillStrong}>{exercise.sets}</Text>
              <Text style={styles.summaryPillSoft}>×</Text>
              <Text style={styles.summaryPillStrong}>{exercise.reps}</Text>
            </View>
            {!!exercise.targetWeight && (
              <View style={styles.summaryPill}>
                <Text style={styles.summaryPillStrong}>
                  {exercise.targetWeight}
                </Text>
                <Text style={styles.summaryPillSoft}>kg</Text>
              </View>
            )}
            <View style={styles.summaryPill}>
              <Ionicons
                name="time-outline"
                size={11}
                color="#BAF4FF"
              />
              <Text style={styles.summaryPillSoft}>{exercise.restTime}s</Text>
            </View>
          </View>
        </View>

        <View style={styles.exerciseActions}>
          <Pressable
            onPress={onEdit}
            hitSlop={6}
            style={({ pressed }) => [
              styles.iconBtn,
              pressed && styles.iconBtnPressed,
            ]}
          >
            <Ionicons
              name="create-outline"
              size={18}
              color="#0E7490"
            />
          </Pressable>
          <Pressable
            onPress={onRemove}
            hitSlop={6}
            style={({ pressed }) => [
              styles.iconBtn,
              pressed && styles.iconBtnPressed,
            ]}
          >
            <Ionicons name="trash-outline" size={18} color="#ef4444" />
          </Pressable>
        </View>
      </Pressable>
    </View>
  );
}

// ─── Rest time picker widget ───────────────────────────────────────────
const REST_PRESETS = [30, 45, 60, 90, 120, 180];
const REST_STEP = 15;
const REST_MIN = 0;
const REST_MAX = 600;

function formatRest(seconds: number): string {
  if (seconds <= 0) return "0s";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  if (s === 0) return `${m}m`;
  return `${m}m ${s}s`;
}

interface RestPickerProps {
  value: number;
  onChange: (value: number) => void;
  color: EditorCardColor;
}

function RestTimePicker({ value, onChange, color }: RestPickerProps) {
  const clamp = (n: number) => Math.max(REST_MIN, Math.min(REST_MAX, n));
  const dec = () => onChange(clamp(value - REST_STEP));
  const inc = () => onChange(clamp(value + REST_STEP));
  const s = restPickerStyles(color);

  return (
    <View style={s.wrap}>
      <View style={s.stepperRow}>
        <Pressable
          onPress={dec}
          hitSlop={8}
          style={({ pressed }) => [s.stepBtn, pressed && { opacity: 0.6 }]}
        >
          <Ionicons name="remove" size={22} color={color.depth} />
        </Pressable>

        <View style={s.display}>
          <Text style={s.displayValue}>{formatRest(value)}</Text>
          <Text style={s.displayHint}>−/+ {REST_STEP}s</Text>
        </View>

        <Pressable
          onPress={inc}
          hitSlop={8}
          style={({ pressed }) => [s.stepBtn, pressed && { opacity: 0.6 }]}
        >
          <Ionicons name="add" size={22} color={color.depth} />
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.presetsRow}
      >
        {REST_PRESETS.map((p) => {
          const active = p === value;
          return (
            <Pressable
              key={p}
              onPress={() => onChange(p)}
              style={({ pressed }) => [
                s.preset,
                active && s.presetActive,
                pressed && { opacity: 0.8 },
              ]}
            >
              <Text style={[s.presetText, active && s.presetTextActive]}>
                {formatRest(p)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const restPickerStyles = (color: EditorCardColor) =>
  StyleSheet.create({
    wrap: {
      gap: 12,
    },
    stepperRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: color.input,
      borderRadius: 16,
      padding: 8,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.16)",
    },
    stepBtn: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: color.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    display: {
      flex: 1,
      alignItems: "center",
    },
    displayValue: {
      fontFamily: FONTS.bold,
      fontSize: 22,
      color: color.text,
    },
    displayHint: {
      fontFamily: FONTS.regular,
      fontSize: 11,
      color: color.muted,
      marginTop: 2,
    },
    presetsRow: {
      gap: 8,
      paddingHorizontal: 2,
    },
    preset: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 18,
      backgroundColor: color.input,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.12)",
    },
    presetActive: {
      backgroundColor: color.accent,
      borderColor: "rgba(255,255,255,0.58)",
    },
    presetText: {
      fontFamily: FONTS.semiBold,
      fontSize: 13,
      color: color.muted,
    },
    presetTextActive: {
      color: color.depth,
    },
  });

// ─── Focused per-exercise editor (modal sheet) ─────────────────────────
function Editor3DCard({
  children,
  color,
  flex,
  styles,
}: {
  children: React.ReactNode;
  color: EditorCardColor;
  flex?: boolean;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View
      style={[
        styles.editor3dShell,
        flex && styles.editor3dShellFlex,
        { backgroundColor: color.depth },
      ]}
    >
      <View style={[styles.editor3dFace, { backgroundColor: color.face }]}>
        {children}
      </View>
    </View>
  );
}

interface EditorProps {
  visible: boolean;
  exercise: RoutineExercise | null;
  theme: Theme;
  styles: ReturnType<typeof createStyles>;
  onClose: () => void;
  onUpdate: (updates: Partial<RoutineExercise>) => void;
  t: (key: string) => string;
}

function ExerciseEditorSheet({
  visible,
  exercise,
  theme,
  styles,
  onClose,
  onUpdate,
  t,
}: EditorProps) {
  const [showSetDetails, setShowSetDetails] = useState(false);

  if (!exercise) return null;

  const handleSetTargetUpdate = (
    setIndex: number,
    updates: Partial<SetTarget>,
  ) => {
    const currentTargets = exercise.setTargets ?? [];
    const updated = currentTargets.map((st, i) =>
      i === setIndex ? { ...st, ...updates } : st,
    );
    onUpdate({ setTargets: updated });
  };

  const incSets = () => onUpdate({ sets: Math.min(exercise.sets + 1, 99) });
  const decSets = () => onUpdate({ sets: Math.max(exercise.sets - 1, 1) });
  const cards = EDITOR_CARD_COLORS;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView
        style={styles.editorContainer}
        edges={["top", "bottom", "left", "right"]}
      >
        <View style={styles.editorHeader}>
          <Pressable onPress={onClose} hitSlop={8} style={styles.editorHeaderBtn}>
            <Ionicons name="close" size={22} color={theme.foreground.white} />
          </Pressable>
          <Text style={styles.editorHeaderTitle} numberOfLines={1}>
            {translateExerciseName(exercise.name)}
          </Text>
          <Pressable
            onPress={onClose}
            hitSlop={8}
            style={[styles.editorHeaderBtn, styles.editorDoneBtn]}
          >
            <Text style={styles.editorDoneText}>{t("common.done")}</Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.editorContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.editorGifWrap}>
            <LinearGradient
              colors={[theme.primary.main + "20", "transparent"]}
              style={StyleSheet.absoluteFill}
            />
            {exercise.gifUrl ? (
              <Image
                source={{ uri: exercise.gifUrl }}
                style={styles.editorGif}
                contentFit="contain"
                transition={200}
              />
            ) : (
              <View style={[styles.editorGif, styles.editorGifPlaceholder]}>
                <Ionicons
                  name="barbell-outline"
                  size={48}
                  color={theme.foreground.gray}
                />
              </View>
            )}
          </View>

          {/* Sets stepper */}
          <Editor3DCard color={cards.sets} styles={styles}>
            <Text style={[styles.editorBlockLabel, { color: cards.sets.muted }]}>
              {t("createRoutine.sets")}
            </Text>
            <View
              style={[
                styles.stepperRow,
                {
                  backgroundColor: cards.sets.input,
                  borderColor: "rgba(255,255,255,0.16)",
                },
              ]}
            >
              <Pressable
                onPress={decSets}
                style={({ pressed }) => [
                  styles.stepperBtn,
                  { backgroundColor: cards.sets.accent },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Ionicons name="remove" size={20} color={cards.sets.depth} />
              </Pressable>
              <Text style={[styles.stepperValue, { color: cards.sets.text }]}>
                {exercise.sets}
              </Text>
              <Pressable
                onPress={incSets}
                style={({ pressed }) => [
                  styles.stepperBtn,
                  { backgroundColor: cards.sets.accent },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Ionicons name="add" size={20} color={cards.sets.depth} />
              </Pressable>
            </View>
          </Editor3DCard>

          {/* Reps + Weight */}
          <View style={styles.editorRow}>
            <Editor3DCard color={cards.reps} flex styles={styles}>
              <Text style={[styles.editorBlockLabel, { color: cards.reps.muted }]}>
                {t("createRoutine.reps")}
              </Text>
              <TextInput
                style={[
                  styles.editorBigInput,
                  {
                    backgroundColor: cards.reps.input,
                    borderColor: "rgba(255,255,255,0.16)",
                    color: cards.reps.text,
                  },
                ]}
                value={exercise.reps}
                onChangeText={(v) => onUpdate({ reps: v })}
                placeholder="8-12"
                placeholderTextColor={cards.reps.muted}
                maxLength={8}
              />
            </Editor3DCard>
            <Editor3DCard color={cards.weight} flex styles={styles}>
              <Text style={[styles.editorBlockLabel, { color: cards.weight.muted }]}>
                {t("createRoutine.weight")} (kg)
              </Text>
              <TextInput
                style={[
                  styles.editorBigInput,
                  {
                    backgroundColor: cards.weight.input,
                    borderColor: "rgba(255,255,255,0.16)",
                    color: cards.weight.text,
                  },
                ]}
                keyboardType="numeric"
                value={exercise.targetWeight ? String(exercise.targetWeight) : ""}
                onChangeText={(v) =>
                  onUpdate({ targetWeight: parseFloat(v) || 0 })
                }
                placeholder="0"
                placeholderTextColor={cards.weight.muted}
                maxLength={5}
              />
            </Editor3DCard>
          </View>

          {/* Rest picker */}
          <Editor3DCard color={cards.rest} styles={styles}>
            <Text style={[styles.editorBlockLabel, { color: cards.rest.muted }]}>
              {t("createRoutine.rest")}
            </Text>
            <RestTimePicker
              value={exercise.restTime}
              onChange={(v) => onUpdate({ restTime: v })}
              color={cards.rest}
            />
          </Editor3DCard>

          {/* Training time */}
          <Editor3DCard color={cards.time} styles={styles}>
            <Text style={[styles.editorBlockLabel, { color: cards.time.muted }]}>
              {t("createRoutine.trainingTime")} (s)
            </Text>
            <TextInput
              style={[
                styles.editorBigInput,
                {
                  backgroundColor: cards.time.input,
                  borderColor: "rgba(255,255,255,0.16)",
                  color: cards.time.text,
                },
              ]}
              keyboardType="numeric"
              value={exercise.trainingTime ? String(exercise.trainingTime) : ""}
              onChangeText={(v) =>
                onUpdate({ trainingTime: parseInt(v) || 0 })
              }
              placeholder="0"
              placeholderTextColor={cards.time.muted}
              maxLength={4}
            />
          </Editor3DCard>

          {/* Per-set targets (collapsed by default) */}
          <View
            style={[
              styles.editor3dShell,
              { backgroundColor: cards.setDetails.depth },
            ]}
          >
            <Pressable
              style={({ pressed }) => [
                styles.editorAccordionToggle,
                { backgroundColor: cards.setDetails.face },
                pressed && { transform: [{ translateY: 5 }] },
              ]}
              onPress={() => setShowSetDetails((s) => !s)}
            >
              <View
                style={[
                  styles.editorAccordionIcon,
                  { backgroundColor: cards.setDetails.accent },
                ]}
              >
                <Ionicons
                  name={showSetDetails ? "chevron-up" : "chevron-down"}
                  size={16}
                  color={cards.setDetails.depth}
                />
              </View>
              <Text
                style={[
                  styles.editorAccordionText,
                  { color: cards.setDetails.text },
                ]}
              >
                {t("createRoutine.perSet")}
              </Text>
            </Pressable>
          </View>

          {showSetDetails &&
            exercise.setTargets &&
            exercise.setTargets.length > 0 && (
              <View
                style={[
                  styles.setTargetsContainer,
                  {
                    backgroundColor: cards.setDetails.face,
                    borderColor: "rgba(255,255,255,0.16)",
                  },
                ]}
              >
                <View style={styles.setTargetRow}>
                  <Text
                    style={[
                      styles.setTargetHeader,
                      { flex: 0.5, color: cards.setDetails.muted },
                    ]}
                  >
                    #
                  </Text>
                  <Text
                    style={[
                      styles.setTargetHeader,
                      { color: cards.setDetails.muted },
                    ]}
                  >
                    {t("createRoutine.weight")} (kg)
                  </Text>
                  <Text
                    style={[
                      styles.setTargetHeader,
                      { color: cards.setDetails.muted },
                    ]}
                  >
                    {t("createRoutine.reps")}
                  </Text>
                </View>
                {exercise.setTargets.map((st, i) => (
                  <View key={i} style={styles.setTargetRow}>
                    <Text
                      style={[
                        styles.setTargetNum,
                        { flex: 0.5, color: cards.setDetails.accent },
                      ]}
                    >
                      {i + 1}
                    </Text>
                    <TextInput
                      style={[
                        styles.setTargetInput,
                        {
                          backgroundColor: cards.setDetails.input,
                          borderColor: "rgba(255,255,255,0.16)",
                          color: cards.setDetails.text,
                        },
                      ]}
                      keyboardType="numeric"
                      placeholder={String(exercise.targetWeight || 0)}
                      placeholderTextColor={cards.setDetails.muted}
                      value={st.targetKg ? String(st.targetKg) : ""}
                      onChangeText={(v) =>
                        handleSetTargetUpdate(i, {
                          targetKg: parseFloat(v) || 0,
                        })
                      }
                    />
                    <TextInput
                      style={[
                        styles.setTargetInput,
                        {
                          backgroundColor: cards.setDetails.input,
                          borderColor: "rgba(255,255,255,0.16)",
                          color: cards.setDetails.text,
                        },
                      ]}
                      placeholder={exercise.reps}
                      placeholderTextColor={cards.setDetails.muted}
                      value={
                        st.targetReps !== exercise.reps ? st.targetReps : ""
                      }
                      onChangeText={(v) =>
                        handleSetTargetUpdate(i, {
                          targetReps: v || exercise.reps,
                        })
                      }
                    />
                  </View>
                ))}
              </View>
            )}

          {/* Notes */}
          <Editor3DCard color={cards.notes} styles={styles}>
            <Text style={[styles.editorBlockLabel, { color: cards.notes.muted }]}>
              {t("createRoutine.addNotes")}
            </Text>
            <TextInput
              style={[
                styles.editorBigInput,
                styles.editorNotesInput,
                {
                  backgroundColor: cards.notes.input,
                  borderColor: "rgba(255,255,255,0.16)",
                  color: cards.notes.text,
                },
              ]}
              placeholder={t("createRoutine.addNotes")}
              placeholderTextColor={cards.notes.muted}
              value={exercise.notes ?? ""}
              onChangeText={(v) => onUpdate({ notes: v })}
              multiline
            />
          </Editor3DCard>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const createStyles = (theme: Theme) => {
  const exercise3d = {
    depth: "#075985",
    face: "#0E7490",
    faceTop: "#0891B2",
    accent: "#22D3EE",
    text: "#F0FDFF",
    muted: "#BAF4FF",
    pill: "#083344",
    pillBorder: "rgba(186,244,255,0.18)",
    iconBg: "#E6FAFF",
  };

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background.dark,
    },

    // ── Top bar
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 18,
      paddingTop: 6,
      paddingBottom: 12,
    },
    headerBtn: {
      width: 38,
      height: 38,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.background.darker,
    },
    headerTitle: {
      fontSize: 17,
      fontFamily: FONTS.extraBold,
      color: theme.foreground.white,
      letterSpacing: 0.3,
    },
    saveBtn: {
      backgroundColor: theme.primary.main,
      paddingHorizontal: 18,
      paddingVertical: 9,
      borderRadius: 14,
    },
    saveBtnDisabled: {
      opacity: 0.7,
    },
    saveBtnText: {
      fontSize: 13,
      fontFamily: FONTS.extraBold,
      color: theme.background.dark,
      letterSpacing: 0.5,
    },

    // ── Body
    savingModalBackdrop: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      backgroundColor: "rgba(3,7,18,0.72)",
    },
    savingModalDepth: {
      width: "100%",
      maxWidth: 320,
      borderRadius: 24,
      paddingBottom: 8,
      backgroundColor: "#075985",
      shadowColor: "#000",
      shadowOpacity: 0.28,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 14 },
      elevation: 12,
    },
    savingModalCard: {
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 22,
      paddingVertical: 24,
      borderRadius: 24,
      backgroundColor: "#0E7490",
      borderWidth: 1,
      borderColor: "rgba(186,244,255,0.28)",
    },
    savingSpinnerWrap: {
      width: 68,
      height: 68,
      borderRadius: 24,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 4,
      backgroundColor: "#083344",
      borderWidth: 1,
      borderColor: "rgba(103,232,249,0.36)",
    },
    savingModalTitle: {
      fontSize: 17,
      fontFamily: FONTS.extraBold,
      color: "#F0FDFF",
      textAlign: "center",
    },
    savingModalText: {
      fontSize: 13,
      lineHeight: 19,
      fontFamily: FONTS.medium,
      color: "#BAF4FF",
      textAlign: "center",
    },

    content: { flex: 1 },
    section: {
      paddingHorizontal: 18,
      marginTop: 18,
    },
    label: {
      fontSize: 11,
      fontFamily: FONTS.bold,
      color: theme.foreground.gray,
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: 8,
    },
    input: {
      backgroundColor: theme.background.darker,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 13,
      fontSize: 15,
      fontFamily: FONTS.medium,
      color: theme.foreground.white,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.foreground.gray + "20",
    },
    inputMultiline: {
      minHeight: 80,
      textAlignVertical: "top",
    },

    // ── Difficulty
    difficultyRow: {
      flexDirection: "row",
      gap: 8,
    },
    difficultyBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 12,
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.foreground.gray + "20",
      backgroundColor: theme.background.darker,
    },
    difficultyDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    difficultyBtnText: {
      fontSize: 13,
      fontFamily: FONTS.bold,
      color: theme.foreground.gray,
    },

    // ── Exercises section header
    exercisesHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 10,
    },
    addExBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: theme.primary.main,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 14,
    },
    addExBtnText: {
      fontSize: 12,
      fontFamily: FONTS.extraBold,
      color: theme.background.dark,
      letterSpacing: 0.4,
    },
    emptyEx: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 32,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.foreground.gray + "30",
      borderStyle: "dashed",
      gap: 8,
    },
    emptyExText: {
      fontSize: 13,
      fontFamily: FONTS.medium,
      color: theme.foreground.gray,
    },

    // ── Exercise summary card (collapsed in list)
    exerciseCardShell: {
      marginBottom: 14,
      borderRadius: 18,
      paddingBottom: 7,
      backgroundColor: exercise3d.depth,
      ...Platform.select({
        ios: {
          shadowColor: exercise3d.depth,
          shadowOpacity: 0.2,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 8 },
        },
        android: { elevation: 6 },
        default: {},
      }),
    },
    exerciseCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: exercise3d.face,
      borderRadius: 18,
      padding: 11,
      minHeight: 90,
      borderWidth: 1,
      borderColor: "rgba(186,244,255,0.24)",
      overflow: "hidden",
      transform: [{ translateY: 0 }],
    },
    exerciseCardPressed: {
      opacity: 0.98,
      transform: [{ translateY: 6 }, { scale: 0.995 }],
    },
    exerciseCardAccent: {
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      width: 5,
      backgroundColor: exercise3d.accent,
    },
    exerciseGifWrap: {
      width: 64,
      height: 64,
      borderRadius: 14,
      backgroundColor: exercise3d.faceTop,
      overflow: "hidden",
      position: "relative",
      borderWidth: 1,
      borderColor: "rgba(240,253,255,0.24)",
      ...Platform.select({
        ios: {
          shadowColor: exercise3d.depth,
          shadowOpacity: 0.16,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
        },
        android: { elevation: 2 },
        default: {},
      }),
    },
    exerciseGif: {
      width: "100%",
      height: "100%",
    },
    exerciseGifPlaceholder: {
      alignItems: "center",
      justifyContent: "center",
    },
    exerciseIndexBadge: {
      position: "absolute",
      top: 4,
      left: 4,
      minWidth: 20,
      height: 20,
      paddingHorizontal: 4,
      borderRadius: 10,
      backgroundColor: exercise3d.accent,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: "rgba(240,253,255,0.78)",
    },
    exerciseIndexText: {
      fontSize: 11,
      fontFamily: FONTS.extraBold,
      color: "#082F49",
    },
    exerciseBody: {
      flex: 1,
      gap: 6,
    },
    exerciseName: {
      fontSize: 15,
      fontFamily: FONTS.bold,
      color: exercise3d.text,
    },
    exerciseSummaryRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
    },
    summaryPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      backgroundColor: exercise3d.pill,
      borderRadius: 10,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderWidth: 1,
      borderColor: exercise3d.pillBorder,
    },
    summaryPillStrong: {
      fontSize: 12,
      fontFamily: FONTS.extraBold,
      color: exercise3d.text,
    },
    summaryPillSoft: {
      fontSize: 11,
      fontFamily: FONTS.medium,
      color: exercise3d.muted,
    },
    exerciseActions: {
      gap: 8,
      alignItems: "center",
    },
    iconBtn: {
      width: 32,
      height: 32,
      borderRadius: 11,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: exercise3d.iconBg,
      borderWidth: 1,
      borderColor: "rgba(240,253,255,0.55)",
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOpacity: 0.12,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 3 },
        },
        android: { elevation: 2 },
        default: {},
      }),
    },
    iconBtnPressed: {
      opacity: 0.72,
      transform: [{ translateY: 2 }],
    },

    // ── Editor sheet (modal)
    editorContainer: {
      flex: 1,
      backgroundColor: theme.background.dark,
    },
    editorHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.foreground.gray + "20",
    },
    editorHeaderBtn: {
      minWidth: 64,
      height: 36,
      borderRadius: 12,
      paddingHorizontal: 10,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.background.darker,
    },
    editorDoneBtn: {
      backgroundColor: theme.primary.main,
    },
    editorDoneText: {
      fontSize: 13,
      fontFamily: FONTS.extraBold,
      color: theme.background.dark,
    },
    editorHeaderTitle: {
      flex: 1,
      textAlign: "center",
      fontSize: 15,
      fontFamily: FONTS.bold,
      color: theme.foreground.white,
      paddingHorizontal: 8,
    },
    editorContent: {
      paddingHorizontal: 18,
      paddingTop: 18,
      paddingBottom: 40,
      gap: 16,
    },
    editor3dShell: {
      borderRadius: 18,
      paddingBottom: 7,
      shadowColor: "#000",
      shadowOpacity: 0.16,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 7 },
      elevation: 5,
    },
    editor3dShellFlex: {
      flex: 1,
    },
    editor3dFace: {
      borderRadius: 18,
      padding: 14,
      gap: 10,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.18)",
    },
    editorGifWrap: {
      width: "100%",
      height: 220,
      borderRadius: 22,
      backgroundColor: exercise3d.face,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      borderWidth: 1,
      borderColor: "rgba(240,253,255,0.22)",
      shadowColor: exercise3d.depth,
      shadowOpacity: 0.18,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 7 },
      elevation: 5,
    },
    editorGif: {
      width: "100%",
      height: "100%",
    },
    editorGifPlaceholder: {
      alignItems: "center",
      justifyContent: "center",
    },
    editorBlock: {
      flex: 1,
      backgroundColor: theme.background.darker,
      borderRadius: 16,
      padding: 14,
      gap: 8,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.foreground.gray + "15",
    },
    editorBlockLabel: {
      fontSize: 11,
      fontFamily: FONTS.bold,
      color: theme.foreground.gray,
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    editorRow: {
      flexDirection: "row",
      gap: 10,
    },
    editorBigInput: {
      backgroundColor: theme.background.dark,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 14,
      fontSize: 18,
      fontFamily: FONTS.extraBold,
      color: theme.foreground.white,
      textAlign: "center",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.foreground.gray + "20",
    },
    editorNotesInput: {
      fontFamily: FONTS.regular,
      fontSize: 14,
      textAlign: "left",
      minHeight: 70,
      textAlignVertical: "top",
    },
    stepperRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: theme.background.dark,
      borderRadius: 12,
      paddingHorizontal: 6,
      paddingVertical: 6,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.foreground.gray + "20",
    },
    stepperBtn: {
      width: 38,
      height: 38,
      borderRadius: 10,
      backgroundColor: theme.primary.main + "15",
      alignItems: "center",
      justifyContent: "center",
    },
    stepperValue: {
      fontSize: 22,
      fontFamily: FONTS.extraBold,
      color: theme.foreground.white,
      minWidth: 40,
      textAlign: "center",
    },
    editorAccordionToggle: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 14,
      paddingHorizontal: 14,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.18)",
    },
    editorAccordionIcon: {
      width: 30,
      height: 30,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    editorAccordionText: {
      fontSize: 13,
      fontFamily: FONTS.extraBold,
      color: theme.primary.main,
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },

    // ── Per-set targets table (used inside editor)
    setTargetsContainer: {
      backgroundColor: theme.background.darker,
      borderRadius: 14,
      padding: 12,
      gap: 6,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.foreground.gray + "20",
    },
    setTargetRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    setTargetHeader: {
      flex: 1,
      fontSize: 10,
      fontFamily: FONTS.bold,
      color: theme.foreground.gray,
      textAlign: "center",
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    setTargetNum: {
      fontSize: 14,
      fontFamily: FONTS.extraBold,
      color: theme.primary.main,
      textAlign: "center",
    },
    setTargetInput: {
      flex: 1,
      backgroundColor: theme.background.dark,
      borderRadius: 10,
      paddingHorizontal: 8,
      paddingVertical: 8,
      fontSize: 14,
      fontFamily: FONTS.bold,
      color: theme.foreground.white,
      textAlign: "center",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.foreground.gray + "20",
    },

    // ── Target muscles chips
    muscleChips: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    muscleChip: {
      backgroundColor: theme.primary.main + "15",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.primary.main + "40",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
    },
    muscleChipText: {
      fontSize: 12,
      fontFamily: FONTS.bold,
      color: theme.primary.main,
      textTransform: "capitalize",
    },
  });
};

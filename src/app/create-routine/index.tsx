import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
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
import { translateExerciseName } from "../../utils/exerciseTranslator";
import { Theme } from "../../constants/themes";
import { useCreateRoutine } from "../../contexts/CreateRoutineContext";
import { useTheme } from "../../contexts/ThemeContext";
import { RoutineExercise, SetTarget } from "../../data/mockData";
import { api } from "../../services/api";

import { FONTS } from "../../constants/fonts";

const surfaceShadow = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  android: { elevation: 4 },
  default: {},
});

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
  const DIFFICULTIES = getDifficulties(t);

  const {
    draft,
    updateDraft,
    removeExerciseFromRoutine,
    updateRoutineExercise,
    clearCreation,
  } = useCreateRoutine();

  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(
    null,
  );
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

    try {
      await api.createRoutine({
        name: draft.name.trim(),
        description: draft.description.trim(),
        difficulty: draft.difficulty,
        targetMuscles: draft.targetMuscles,
        exercises: draft.exercises,
        estimatedDuration: Math.round(estimatedDuration),
      });
    } catch (error: any) {
      Alert.alert(
        t("createRoutine.missingName"),
        error?.message || "Failed to save routine",
      );
      return;
    }

    clearCreation();
    Alert.alert(
      t("createRoutine.routineSaved"),
      `"${draft.name}" ${t("createRoutine.routineAdded")}`,
      [{ text: t("common.done"), onPress: () => router.back() }],
    );
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
        <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
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
    <Pressable
      onPress={onEdit}
      style={({ pressed }) => [
        styles.exerciseCard,
        pressed && { opacity: 0.95, transform: [{ scale: 0.99 }] },
      ]}
    >
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
              color={theme.foreground.gray}
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
              color={theme.foreground.gray}
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
            pressed && { opacity: 0.7 },
          ]}
        >
          <Ionicons
            name="create-outline"
            size={18}
            color={theme.primary.main}
          />
        </Pressable>
        <Pressable
          onPress={onRemove}
          hitSlop={6}
          style={({ pressed }) => [
            styles.iconBtn,
            pressed && { opacity: 0.7 },
          ]}
        >
          <Ionicons name="trash-outline" size={18} color="#ef4444" />
        </Pressable>
      </View>
    </Pressable>
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
  theme: Theme;
}

function RestTimePicker({ value, onChange, theme }: RestPickerProps) {
  const clamp = (n: number) => Math.max(REST_MIN, Math.min(REST_MAX, n));
  const dec = () => onChange(clamp(value - REST_STEP));
  const inc = () => onChange(clamp(value + REST_STEP));
  const s = restPickerStyles(theme);

  return (
    <View style={s.wrap}>
      <View style={s.stepperRow}>
        <Pressable
          onPress={dec}
          hitSlop={8}
          style={({ pressed }) => [s.stepBtn, pressed && { opacity: 0.6 }]}
        >
          <Ionicons name="remove" size={22} color={theme.primary.main} />
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
          <Ionicons name="add" size={22} color={theme.primary.main} />
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

const restPickerStyles = (theme: Theme) =>
  StyleSheet.create({
    wrap: {
      gap: 12,
    },
    stepperRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: theme.background.accent,
      borderRadius: 16,
      padding: 8,
    },
    stepBtn: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: theme.primary.main + "18",
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
      color: theme.foreground.white,
    },
    displayHint: {
      fontFamily: FONTS.regular,
      fontSize: 11,
      color: theme.foreground.gray,
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
      backgroundColor: theme.background.accent,
      borderWidth: 1,
      borderColor: "transparent",
    },
    presetActive: {
      backgroundColor: theme.primary.main + "20",
      borderColor: theme.primary.main,
    },
    presetText: {
      fontFamily: FONTS.semiBold,
      fontSize: 13,
      color: theme.foreground.gray,
    },
    presetTextActive: {
      color: theme.primary.main,
    },
  });

// ─── Focused per-exercise editor (modal sheet) ─────────────────────────
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

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.editorContainer}>
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
          <View style={styles.editorBlock}>
            <Text style={styles.editorBlockLabel}>
              {t("createRoutine.sets")}
            </Text>
            <View style={styles.stepperRow}>
              <Pressable
                onPress={decSets}
                style={({ pressed }) => [
                  styles.stepperBtn,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Ionicons name="remove" size={20} color={theme.primary.main} />
              </Pressable>
              <Text style={styles.stepperValue}>{exercise.sets}</Text>
              <Pressable
                onPress={incSets}
                style={({ pressed }) => [
                  styles.stepperBtn,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Ionicons name="add" size={20} color={theme.primary.main} />
              </Pressable>
            </View>
          </View>

          {/* Reps + Weight */}
          <View style={styles.editorRow}>
            <View style={styles.editorBlock}>
              <Text style={styles.editorBlockLabel}>
                {t("createRoutine.reps")}
              </Text>
              <TextInput
                style={styles.editorBigInput}
                value={exercise.reps}
                onChangeText={(v) => onUpdate({ reps: v })}
                placeholder="8-12"
                placeholderTextColor={theme.foreground.gray + "60"}
                maxLength={8}
              />
            </View>
            <View style={styles.editorBlock}>
              <Text style={styles.editorBlockLabel}>
                {t("createRoutine.weight")} (kg)
              </Text>
              <TextInput
                style={styles.editorBigInput}
                keyboardType="numeric"
                value={exercise.targetWeight ? String(exercise.targetWeight) : ""}
                onChangeText={(v) =>
                  onUpdate({ targetWeight: parseFloat(v) || 0 })
                }
                placeholder="0"
                placeholderTextColor={theme.foreground.gray + "60"}
                maxLength={5}
              />
            </View>
          </View>

          {/* Rest picker */}
          <View style={styles.editorBlock}>
            <Text style={styles.editorBlockLabel}>
              {t("createRoutine.rest")}
            </Text>
            <RestTimePicker
              value={exercise.restTime}
              onChange={(v) => onUpdate({ restTime: v })}
              theme={theme}
            />
          </View>

          {/* Training time */}
          <View style={styles.editorBlock}>
            <Text style={styles.editorBlockLabel}>
              {t("createRoutine.trainingTime")} (s)
            </Text>
            <TextInput
              style={styles.editorBigInput}
              keyboardType="numeric"
              value={exercise.trainingTime ? String(exercise.trainingTime) : ""}
              onChangeText={(v) =>
                onUpdate({ trainingTime: parseInt(v) || 0 })
              }
              placeholder="0"
              placeholderTextColor={theme.foreground.gray + "60"}
              maxLength={4}
            />
          </View>

          {/* Per-set targets (collapsed by default) */}
          <Pressable
            style={({ pressed }) => [
              styles.editorAccordionToggle,
              pressed && { opacity: 0.85 },
            ]}
            onPress={() => setShowSetDetails((s) => !s)}
          >
            <Ionicons
              name={showSetDetails ? "chevron-up" : "chevron-down"}
              size={16}
              color={theme.primary.main}
            />
            <Text style={styles.editorAccordionText}>
              {t("createRoutine.perSet")}
            </Text>
          </Pressable>

          {showSetDetails &&
            exercise.setTargets &&
            exercise.setTargets.length > 0 && (
              <View style={styles.setTargetsContainer}>
                <View style={styles.setTargetRow}>
                  <Text style={[styles.setTargetHeader, { flex: 0.5 }]}>#</Text>
                  <Text style={styles.setTargetHeader}>
                    {t("createRoutine.weight")} (kg)
                  </Text>
                  <Text style={styles.setTargetHeader}>
                    {t("createRoutine.reps")}
                  </Text>
                </View>
                {exercise.setTargets.map((st, i) => (
                  <View key={i} style={styles.setTargetRow}>
                    <Text style={[styles.setTargetNum, { flex: 0.5 }]}>
                      {i + 1}
                    </Text>
                    <TextInput
                      style={styles.setTargetInput}
                      keyboardType="numeric"
                      placeholder={String(exercise.targetWeight || 0)}
                      placeholderTextColor={theme.foreground.gray + "80"}
                      value={st.targetKg ? String(st.targetKg) : ""}
                      onChangeText={(v) =>
                        handleSetTargetUpdate(i, {
                          targetKg: parseFloat(v) || 0,
                        })
                      }
                    />
                    <TextInput
                      style={styles.setTargetInput}
                      placeholder={exercise.reps}
                      placeholderTextColor={theme.foreground.gray + "80"}
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
          <View style={styles.editorBlock}>
            <Text style={styles.editorBlockLabel}>
              {t("createRoutine.addNotes")}
            </Text>
            <TextInput
              style={[styles.editorBigInput, styles.editorNotesInput]}
              placeholder={t("createRoutine.addNotes")}
              placeholderTextColor={theme.foreground.gray + "60"}
              value={exercise.notes ?? ""}
              onChangeText={(v) => onUpdate({ notes: v })}
              multiline
            />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
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
    saveBtnText: {
      fontSize: 13,
      fontFamily: FONTS.extraBold,
      color: theme.background.dark,
      letterSpacing: 0.5,
    },

    // ── Body
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
    exerciseCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: theme.background.darker,
      borderRadius: 16,
      padding: 10,
      marginBottom: 10,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.foreground.gray + "15",
      ...surfaceShadow,
    },
    exerciseGifWrap: {
      width: 64,
      height: 64,
      borderRadius: 14,
      backgroundColor: theme.background.dark,
      overflow: "hidden",
      position: "relative",
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
      backgroundColor: theme.primary.main,
      alignItems: "center",
      justifyContent: "center",
    },
    exerciseIndexText: {
      fontSize: 11,
      fontFamily: FONTS.extraBold,
      color: theme.background.dark,
    },
    exerciseBody: {
      flex: 1,
      gap: 6,
    },
    exerciseName: {
      fontSize: 15,
      fontFamily: FONTS.bold,
      color: theme.foreground.white,
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
      backgroundColor: theme.background.dark,
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.foreground.gray + "20",
    },
    summaryPillStrong: {
      fontSize: 12,
      fontFamily: FONTS.extraBold,
      color: theme.foreground.white,
    },
    summaryPillSoft: {
      fontSize: 11,
      fontFamily: FONTS.medium,
      color: theme.foreground.gray,
    },
    exerciseActions: {
      gap: 8,
      alignItems: "center",
    },
    iconBtn: {
      width: 32,
      height: 32,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.background.dark,
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
    editorGifWrap: {
      width: "100%",
      height: 220,
      borderRadius: 22,
      backgroundColor: theme.background.darker,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      ...surfaceShadow,
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
      gap: 6,
      paddingVertical: 12,
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.primary.main + "40",
      backgroundColor: theme.primary.main + "10",
    },
    editorAccordionText: {
      fontSize: 13,
      fontFamily: FONTS.bold,
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

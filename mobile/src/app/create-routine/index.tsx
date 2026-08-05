import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
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
import { FONTS } from "../../constants/fonts";

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
    isCreating,
    draft,
    initCreation,
    updateDraft,
    removeExerciseFromRoutine,
    updateRoutineExercise,
    clearCreation,
  } = useCreateRoutine();

  useEffect(() => {
    if (!isCreating) initCreation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(
    null,
  );
  const [isSavingRoutine, setIsSavingRoutine] = useState(false);
  const editingExercise = editingExerciseId
    ? draft.exercises.find((e) => e.id === editingExerciseId) ?? null
    : null;

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

    if (draft.exercises.length === 0) {
      Alert.alert(
        t("createRoutine.noExercises"),
        t("createRoutine.addAtLeastOneExercise"),
      );
      return;
    }
    if (!draft.name.trim()) {
      Alert.alert(
        t("createRoutine.missingName", "Nom manquant"),
        t(
          "createRoutine.pleaseNameRoutine",
          "Donnez un nom à votre séance.",
        ),
      );
      return;
    }

    const estimatedDuration = draft.exercises.reduce(
      (total, ex) =>
        total +
        (ex.sets * (Math.ceil(parseInt(ex.reps) || 10) * 4 + ex.restTime)) / 60,
      0,
    );

    setIsSavingRoutine(true);
    try {
      await api.createRoutine({
        name: draft.name.trim(),
        description: draft.description.trim(),
        targetMuscles: draft.targetMuscles,
        exercises: draft.exercises,
        estimatedDuration: Math.round(estimatedDuration),
      });
    } catch (error: any) {
      setIsSavingRoutine(false);
      Alert.alert(
        t("createRoutine.saveRoutineFailed", "Could not save routine"),
        error?.message || t("createRoutine.tryAgain", "Please try again."),
      );
      return;
    }

    setIsSavingRoutine(false);
    clearCreation();
    router.back();
  };

  const [isDiscardModalVisible, setIsDiscardModalVisible] = useState(false);
  const handleDiscard = () => setIsDiscardModalVisible(true);
  const confirmDiscard = () => {
    setIsDiscardModalVisible(false);
    clearCreation();
    router.back();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleDiscard}
          style={styles.headerBtn}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t("common.close", "Close")}
        >
          <Ionicons name="close" size={20} color={theme.foreground.gray} />
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
        {/* Routine name */}
        <View style={styles.section}>
          <Text style={styles.label}>
            {t("createRoutine.name", "Nom de la séance")}
          </Text>
          <TextInput
            style={styles.nameInput}
            value={draft.name}
            onChangeText={(value) => updateDraft({ name: value })}
            placeholder={t("createRoutine.namePlaceholder", "Push day, Full body…")}
            placeholderTextColor={theme.foreground.gray}
          />
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
        visible={isDiscardModalVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setIsDiscardModalVisible(false)}
      >
        <Pressable
          style={styles.discardModalBackdrop}
          onPress={() => setIsDiscardModalVisible(false)}
        >
          <Pressable style={styles.discardModalCard} onPress={() => {}}>
            <View style={styles.discardIconWrap}>
              <Ionicons name="warning" size={28} color={theme.primary.main} />
            </View>
            <Text style={styles.discardModalTitle}>
              {t("createRoutine.discardRoutine", "Abandonner la séance ?")}
            </Text>
            <Text style={styles.discardModalText}>
              {t(
                "createRoutine.allChangesLost",
                "Tous les changements seront perdus.",
              )}
            </Text>
            <View style={styles.discardModalActions}>
              <Pressable
                onPress={() => setIsDiscardModalVisible(false)}
                style={({ pressed }) => [
                  styles.discardBtn,
                  styles.discardBtnCancel,
                  pressed && { opacity: 0.75 },
                ]}
                android_ripple={{ color: "rgba(255,255,255,0.1)" }}
              >
                <Text style={[styles.discardBtnText, styles.discardBtnTextCancel]}>
                  {t("common.cancel", "Annuler")}
                </Text>
              </Pressable>
              <Pressable
                onPress={confirmDiscard}
                style={({ pressed }) => [
                  styles.discardBtn,
                  styles.discardBtnDestructive,
                  pressed && { opacity: 0.75 },
                ]}
                android_ripple={{ color: "rgba(255,255,255,0.1)" }}
              >
                <Text style={[styles.discardBtnText, styles.discardBtnTextDestructive]}>
                  {t("createRoutine.discard", "Abandonner")}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={isSavingRoutine}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => null}
      >
        <View style={styles.savingModalBackdrop}>
          <View style={styles.savingModalCard}>
            <View style={styles.savingSpinnerWrap}>
              <ActivityIndicator size="large" color={theme.primary.main} />
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
    <Pressable
      onPress={onEdit}
      style={({ pressed }) => [
        styles.exerciseCard,
        pressed && { opacity: 0.8 },
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
            pressed && { opacity: 0.6 },
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
            pressed && { opacity: 0.6 },
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
      backgroundColor: theme.background.dark,
      borderRadius: 12,
      padding: 8,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.foreground.gray + "30",
    },
    stepBtn: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: theme.primary.main + "15",
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
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.foreground.gray + "20",
    },
    presetActive: {
      backgroundColor: theme.primary.main + "20",
      borderColor: theme.primary.main + "60",
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

// ─── Simple editor card ────────────────────────────────────────────────
function EditorCard({
  children,
  flex,
  styles,
}: {
  children: React.ReactNode;
  flex?: boolean;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={[styles.editorBlock, flex && { flex: 1 }]}>
      {children}
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
          <EditorCard styles={styles}>
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
              <Text style={styles.stepperValue}>
                {exercise.sets}
              </Text>
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
          </EditorCard>

          {/* Reps + Weight */}
          <View style={styles.editorRow}>
            <EditorCard flex styles={styles}>
              <Text style={styles.editorBlockLabel}>
                {t("createRoutine.reps")}
              </Text>
              <TextInput
                style={styles.editorBigInput}
                keyboardType="phone-pad"
                value={exercise.reps}
                onChangeText={(v) => onUpdate({ reps: v })}
                placeholder="8-12"
                placeholderTextColor={theme.foreground.gray}
                maxLength={8}
              />
            </EditorCard>
            <EditorCard flex styles={styles}>
              <Text style={styles.editorBlockLabel}>
                {t("createRoutine.weight")} (kg)
              </Text>
              <TextInput
                style={styles.editorBigInput}
                keyboardType="decimal-pad"
                value={exercise.targetWeight ? String(exercise.targetWeight) : ""}
                onChangeText={(v) =>
                  onUpdate({ targetWeight: parseFloat(v) || 0 })
                }
                placeholder="0"
                placeholderTextColor={theme.foreground.gray}
                maxLength={5}
              />
            </EditorCard>
          </View>

          {/* Rest picker */}
          <EditorCard styles={styles}>
            <Text style={styles.editorBlockLabel}>
              {t("createRoutine.rest")}
            </Text>
            <RestTimePicker
              value={exercise.restTime}
              onChange={(v) => onUpdate({ restTime: v })}
              theme={theme}
            />
          </EditorCard>

          {/* Training time */}
          <EditorCard styles={styles}>
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
              placeholderTextColor={theme.foreground.gray}
              maxLength={4}
            />
          </EditorCard>

          {/* Per-set targets (collapsed by default) */}
          <Pressable
            style={({ pressed }) => [
              styles.editorBlock,
              styles.editorAccordionToggle,
              pressed && { opacity: 0.8 },
            ]}
            onPress={() => setShowSetDetails((s) => !s)}
          >
            <View style={styles.editorAccordionIcon}>
              <Ionicons
                name={showSetDetails ? "chevron-up" : "chevron-down"}
                size={16}
                color={theme.primary.main}
              />
            </View>
            <Text style={styles.editorAccordionText}>
              {t("createRoutine.perSet")}
            </Text>
          </Pressable>

          {showSetDetails &&
            exercise.setTargets &&
            exercise.setTargets.length > 0 && (
              <View style={styles.setTargetsContainer}>
                <View style={styles.setTargetRow}>
                  <Text
                    style={[styles.setTargetHeader, { flex: 0.5 }]}
                  >
                    #
                  </Text>
                  <Text style={styles.setTargetHeader}>
                    {t("createRoutine.weight")} (kg)
                  </Text>
                  <Text style={styles.setTargetHeader}>
                    {t("createRoutine.reps")}
                  </Text>
                </View>
                {exercise.setTargets.map((st, i) => (
                  <View key={i} style={styles.setTargetRow}>
                    <Text
                      style={[styles.setTargetNum, { flex: 0.5 }]}
                    >
                      {i + 1}
                    </Text>
                    <TextInput
                      style={styles.setTargetInput}
                      keyboardType="decimal-pad"
                      placeholder={String(exercise.targetWeight || 0)}
                      placeholderTextColor={theme.foreground.gray}
                      value={st.targetKg ? String(st.targetKg) : ""}
                      onChangeText={(v) =>
                        handleSetTargetUpdate(i, {
                          targetKg: parseFloat(v) || 0,
                        })
                      }
                    />
                    <TextInput
                      style={styles.setTargetInput}
                      keyboardType="phone-pad"
                      placeholder={exercise.reps}
                      placeholderTextColor={theme.foreground.gray}
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
          <EditorCard styles={styles}>
            <Text style={styles.editorBlockLabel}>
              {t("createRoutine.addNotes")}
            </Text>
            <TextInput
              style={[styles.editorBigInput, styles.editorNotesInput]}
              placeholder={t("createRoutine.addNotes")}
              placeholderTextColor={theme.foreground.gray}
              value={exercise.notes ?? ""}
              onChangeText={(v) => onUpdate({ notes: v })}
              multiline
            />
          </EditorCard>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const createStyles = (theme: Theme) => {
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
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.background.darker,
      borderWidth: 1,
      borderColor: theme.foreground.gray + "22",
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

    // ── Saving modal
    savingModalBackdrop: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      backgroundColor: "rgba(3,7,18,0.72)",
    },
    savingModalCard: {
      width: "100%",
      maxWidth: 320,
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 22,
      paddingVertical: 24,
      borderRadius: 20,
      backgroundColor: theme.background.darker,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.foreground.gray + "20",
    },
    savingSpinnerWrap: {
      width: 68,
      height: 68,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 4,
      backgroundColor: theme.background.accent,
    },
    savingModalTitle: {
      fontSize: 17,
      fontFamily: FONTS.extraBold,
      color: theme.foreground.white,
      textAlign: "center",
    },
    savingModalText: {
      fontSize: 13,
      lineHeight: 19,
      fontFamily: FONTS.medium,
      color: theme.foreground.gray,
      textAlign: "center",
    },

    // ── Discard modal
    discardModalBackdrop: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      backgroundColor: "rgba(3,7,18,0.78)",
    },
    discardModalCard: {
      width: "100%",
      maxWidth: 340,
      alignItems: "center",
      gap: 12,
      paddingHorizontal: 22,
      paddingVertical: 24,
      borderRadius: 20,
      backgroundColor: theme.background.darker,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.foreground.gray + "20",
    },
    discardIconWrap: {
      width: 56,
      height: 56,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.background.accent,
      marginBottom: 2,
    },
    discardModalTitle: {
      fontSize: 17,
      fontFamily: FONTS.extraBold,
      color: theme.foreground.white,
      textAlign: "center",
    },
    discardModalText: {
      fontSize: 13,
      lineHeight: 19,
      fontFamily: FONTS.medium,
      color: theme.foreground.gray,
      textAlign: "center",
      marginBottom: 6,
    },
    discardModalActions: {
      flexDirection: "row",
      gap: 10,
      width: "100%",
    },
    discardBtn: {
      flex: 1,
      borderRadius: 14,
      paddingVertical: 13,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    discardBtnCancel: {
      backgroundColor: theme.background.accent,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.foreground.gray + "30",
    },
    discardBtnDestructive: {
      backgroundColor: "#DC2626",
    },
    discardBtnText: {
      fontFamily: FONTS.extraBold,
      fontSize: 14,
      letterSpacing: 0.4,
    },
    discardBtnTextCancel: {
      color: theme.foreground.white,
    },
    discardBtnTextDestructive: {
      color: "#FFF1F2",
    },

    content: { flex: 1 },
    section: {
      paddingHorizontal: 18,
      marginTop: 18,
    },
    nameInput: {
      backgroundColor: theme.background.darker,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 12,
      color: theme.foreground.white,
      fontFamily: FONTS.semiBold,
      fontSize: 15,
      borderWidth: 1,
      borderColor: theme.background.accent,
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

    // ── Exercise summary card
    exerciseCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: theme.background.darker,
      borderRadius: 16,
      padding: 11,
      minHeight: 80,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.background.accent,
      overflow: "hidden",
      marginBottom: 10,
    },
    exerciseCardAccent: {
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      width: 4,
      backgroundColor: theme.primary.main,
    },
    exerciseGifWrap: {
      width: 60,
      height: 60,
      borderRadius: 12,
      backgroundColor: theme.background.accent,
      overflow: "hidden",
      position: "relative",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.foreground.gray + "20",
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
      minWidth: 18,
      height: 18,
      paddingHorizontal: 3,
      borderRadius: 9,
      backgroundColor: theme.primary.main,
      alignItems: "center",
      justifyContent: "center",
    },
    exerciseIndexText: {
      fontSize: 10,
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
      backgroundColor: theme.background.accent,
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
      backgroundColor: theme.background.accent,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.foreground.gray + "20",
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
      gap: 12,
    },
    editorBlock: {
      backgroundColor: theme.background.darker,
      borderRadius: 14,
      padding: 14,
      gap: 10,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.background.accent,
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
    },
    editorAccordionIcon: {
      width: 28,
      height: 28,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.primary.main + "15",
    },
    editorAccordionText: {
      fontSize: 13,
      fontFamily: FONTS.extraBold,
      color: theme.primary.main,
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    editorGifWrap: {
      width: "100%",
      height: 200,
      borderRadius: 16,
      overflow: "hidden",
    },
    editorGif: {
      width: "100%",
      height: "100%",
    },
    editorGifPlaceholder: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },

    // ── Per-set targets table
    setTargetsContainer: {
      backgroundColor: theme.background.darker,
      borderRadius: 14,
      padding: 12,
      gap: 6,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.background.accent,
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

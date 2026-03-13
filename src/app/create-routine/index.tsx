import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Alert,
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
import { addRoutine, RoutineExercise } from "../../data/mockData";

import { FONTS } from "../../constants/fonts";

const getDifficulties = (t: (key: string) => string) => [
  { value: "beginner", label: t("createRoutine.beginner"), color: "#22c55e" },
  { value: "intermediate", label: t("createRoutine.intermediate"), color: "#f59e0b" },
  { value: "advanced", label: t("createRoutine.advanced"), color: "#ef4444" },
] as const;

export default function CreateRoutineScreen() {
  const { t, i18n } = useTranslation();
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

  // Auto scroll when exercises change
  const scrollRef = useRef<ScrollView>(null);
  const prevExCount = useRef(draft.exercises.length);
  useEffect(() => {
    if (draft.exercises.length > prevExCount.current) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
    prevExCount.current = draft.exercises.length;
  }, [draft.exercises.length]);

  const handleSave = () => {
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

    addRoutine({
      id: `routine-${Date.now()}`,
      userId: "1",
      name: draft.name.trim(),
      description: draft.description.trim(),
      exercises: draft.exercises,
      estimatedDuration: Math.round(estimatedDuration),
      targetMuscles: draft.targetMuscles,
      difficulty: draft.difficulty,
      timesCompleted: 0,
    });

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
              <ExerciseRow
                key={ex.id}
                exercise={ex}
                index={index}
                theme={theme}
                styles={styles}
                onUpdate={(updates) => updateRoutineExercise(ex.id, updates)}
                onRemove={() => removeExerciseFromRoutine(ex.id)}
                t={t}
                i18n={i18n}
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
    </View>
  );
}

interface ExerciseRowProps {
  exercise: RoutineExercise;
  index: number;
  theme: Theme;
  styles: ReturnType<typeof createStyles>;
  onUpdate: (updates: Partial<RoutineExercise>) => void;
  onRemove: () => void;
}

function ExerciseRow({
  exercise,
  index,
  theme,
  styles,
  onUpdate,
  onRemove,
  t,
  i18n,
}: ExerciseRowProps & { t: (key: string) => string; i18n: { language: string } }) {
  return (
    <View style={styles.exerciseCard}>
      <View style={styles.exerciseCardHeader}>
        <View style={styles.exerciseIndexBadge}>
          <Text style={styles.exerciseIndexText}>{index + 1}</Text>
        </View>
        <Text style={styles.exerciseName} numberOfLines={1}>
          {translateExerciseName(exercise.name)}
        </Text>
        <TouchableOpacity
          onPress={onRemove}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="trash-outline" size={18} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <View style={styles.exerciseFields}>
        {/* Sets */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>{t("createRoutine.sets")}</Text>
          <TextInput
            style={styles.fieldInput}
            keyboardType="numeric"
            value={String(exercise.sets)}
            onChangeText={(v) => onUpdate({ sets: parseInt(v) || 1 })}
            maxLength={2}
          />
        </View>

        {/* Reps */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>{t("createRoutine.reps")}</Text>
          <TextInput
            style={styles.fieldInput}
            placeholder="e.g. 8-12"
            placeholderTextColor={theme.foreground.gray}
            value={exercise.reps}
            onChangeText={(v) => onUpdate({ reps: v })}
            maxLength={8}
          />
        </View>

        {/* Rest */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>{t("createRoutine.rest")}</Text>
          <TextInput
            style={styles.fieldInput}
            keyboardType="numeric"
            value={String(exercise.restTime)}
            onChangeText={(v) => onUpdate({ restTime: parseInt(v) || 0 })}
            maxLength={4}
          />
        </View>
      </View>

      {/* Notes */}
      <TextInput
        style={styles.notesInput}
        placeholder={t("createRoutine.addNotes")}
        placeholderTextColor={theme.foreground.gray}
        value={exercise.notes ?? ""}
        onChangeText={(v) => onUpdate({ notes: v })}
      />
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background.dark,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.background.darker,
    },
    headerBtn: { padding: 4 },
    headerTitle: {
      fontSize: 18,
      fontFamily: FONTS.bold,
      color: theme.foreground.white,
    },
    saveBtn: {
      backgroundColor: theme.primary.main,
      paddingHorizontal: 16,
      paddingVertical: 7,
      borderRadius: 16,
    },
    saveBtnText: {
      fontSize: 13,
      fontFamily: FONTS.bold,
      color: theme.background.dark,
    },
    content: { flex: 1 },
    section: {
      paddingHorizontal: 16,
      marginTop: 20,
    },
    label: {
      fontSize: 12,
      fontFamily: FONTS.semiBold,
      color: theme.foreground.gray,
      textTransform: "uppercase",
      letterSpacing: 0.8,
      marginBottom: 8,
    },
    input: {
      backgroundColor: theme.background.darker,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      color: theme.foreground.white,
      borderWidth: 1,
      borderColor: theme.background.accent,
    },
    inputMultiline: {
      minHeight: 80,
      textAlignVertical: "top",
    },
    difficultyRow: {
      flexDirection: "row",
      gap: 10,
    },
    difficultyBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.background.accent,
      backgroundColor: theme.background.darker,
    },
    difficultyDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    difficultyBtnText: {
      fontSize: 13,
      fontFamily: FONTS.semiBold,
      color: theme.foreground.gray,
    },
    exercisesHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 8,
    },
    addExBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: theme.primary.main,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
    },
    addExBtnText: {
      fontSize: 13,
      fontFamily: FONTS.bold,
      color: theme.background.dark,
    },
    emptyEx: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 32,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.background.accent,
      borderStyle: "dashed",
      gap: 8,
    },
    emptyExText: {
      fontSize: 14,
      color: theme.foreground.gray,
    },
    exerciseCard: {
      backgroundColor: theme.background.darker,
      borderRadius: 12,
      padding: 14,
      marginBottom: 10,
      borderLeftWidth: 3,
      borderLeftColor: theme.primary.main,
    },
    exerciseCardHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 12,
    },
    exerciseIndexBadge: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: theme.primary.main + "20",
      borderWidth: 1,
      borderColor: theme.primary.main,
      alignItems: "center",
      justifyContent: "center",
    },
    exerciseIndexText: {
      fontSize: 12,
      fontFamily: FONTS.bold,
      color: theme.primary.main,
    },
    exerciseName: {
      fontSize: 15,
      fontFamily: FONTS.semiBold,
      color: theme.foreground.white,
      flex: 1,
    },
    exerciseFields: {
      flexDirection: "row",
      gap: 10,
      marginBottom: 10,
    },
    field: { flex: 1 },
    fieldLabel: {
      fontSize: 11,
      fontFamily: FONTS.semiBold,
      color: theme.foreground.gray,
      marginBottom: 4,
    },
    fieldInput: {
      backgroundColor: theme.background.dark,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 8,
      fontSize: 14,
      fontFamily: FONTS.semiBold,
      color: theme.foreground.white,
      textAlign: "center",
      borderWidth: 1,
      borderColor: theme.background.accent,
    },
    notesInput: {
      backgroundColor: theme.background.dark,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 8,
      fontSize: 13,
      color: theme.foreground.white,
      borderWidth: 1,
      borderColor: theme.background.accent,
    },
    muscleChips: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    muscleChip: {
      backgroundColor: theme.primary.main + "15",
      borderWidth: 1,
      borderColor: theme.primary.main + "40",
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 20,
    },
    muscleChipText: {
      fontSize: 12,
      fontFamily: FONTS.semiBold,
      color: theme.primary.main,
      textTransform: "capitalize",
    },
  });

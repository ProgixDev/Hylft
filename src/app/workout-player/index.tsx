import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  BackHandler,
  Dimensions,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { FONTS } from "../../constants/fonts";
import { Theme } from "../../constants/themes";
import { useActiveWorkout } from "../../contexts/ActiveWorkoutContext";
import { useTheme } from "../../contexts/ThemeContext";
import { RoutineExercise } from "../../data/mockData";
import { findExerciseByNameExerciseDb } from "../../services/exerciseDbApi";
import { translateExerciseName } from "../../utils/exerciseTranslator";

const { width: SCREEN_W } = Dimensions.get("window");
const GIF_SIZE = Math.min(SCREEN_W - 48, 360);

export default function WorkoutPlayerScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const {
    guidedPlayer,
    activeWorkout,
    endGuidedRoutine,
    updateGuidedExercise,
  } = useActiveWorkout();

  const currentExercise: RoutineExercise | undefined =
    guidedPlayer?.exercises[guidedPlayer.currentExerciseIndex];

  // ── Hydrate missing gifUrls lazily (mock routines have no gif) ──────
  useEffect(() => {
    if (!guidedPlayer || !currentExercise) return;
    if (currentExercise.gifUrl) return;
    let cancelled = false;
    (async () => {
      const found = await findExerciseByNameExerciseDb(currentExercise.name);
      if (cancelled || !found) return;
      updateGuidedExercise(guidedPlayer.currentExerciseIndex, {
        gifUrl: found.gifUrl,
        bodyPart: found.bodyPart,
        target: found.target,
        equipment: found.equipment,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [
    currentExercise?.name,
    currentExercise?.gifUrl,
    guidedPlayer?.currentExerciseIndex,
  ]);

  // ── Exit confirmation handler (hardware + header back) ──────────────
  const confirmExit = useCallback(() => {
    Alert.alert(
      t("workoutPlayer.endWorkout"),
      t("workoutPlayer.endWorkoutConfirm"),
      [
        { text: t("workoutPlayer.cancel"), style: "cancel" },
        {
          text: t("workoutPlayer.endAndSave"),
          style: "destructive",
          onPress: async () => {
            await endGuidedRoutine(true);
            router.back();
          },
        },
      ],
    );
  }, [endGuidedRoutine, router, t]);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      confirmExit();
      return true;
    });
    return () => sub.remove();
  }, [confirmExit]);

  // ── Navigate out on COMPLETE ────────────────────────────────────────
  if (!guidedPlayer) {
    return (
      <View style={[styles.root, styles.centered]}>
        <Text style={styles.emptyText}>{t("workoutPlayer.noActive")}</Text>
        <Pressable style={styles.exitButton} onPress={() => router.back()}>
          <Text style={styles.exitButtonText}>{t("routines.goBack")}</Text>
        </Pressable>
      </View>
    );
  }

  const totalSets = guidedPlayer.exercises.reduce((s, e) => s + e.sets, 0);
  const completedSets = guidedPlayer.loggedSets.length;
  const progress = totalSets > 0 ? completedSets / totalSets : 0;

  return (
    <View style={styles.root}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Pressable style={styles.iconButton} onPress={confirmExit}>
          <Ionicons name="close" size={22} color={theme.foreground.white} />
        </Pressable>
        <View style={styles.progressWrap}>
          <View style={styles.progressBar}>
            <View
              style={[styles.progressFill, { width: `${progress * 100}%` }]}
            />
          </View>
          <Text style={styles.progressText}>
            {completedSets}/{totalSets} {t("createRoutine.sets")}
          </Text>
        </View>
        <View style={styles.timerPill}>
          <Ionicons
            name="time-outline"
            size={14}
            color={theme.foreground.white}
          />
          <Text style={styles.timerText}>
            {formatDuration(activeWorkout?.duration ?? 0)}
          </Text>
        </View>
      </View>

      {(guidedPlayer.phase === "EXERCISE" ||
        guidedPlayer.phase === "LOG_SET") && (
        <ExercisePhase theme={theme} />
      )}
      {guidedPlayer.phase === "REST" && <RestPhase theme={theme} />}
      {guidedPlayer.phase === "COMPLETE" && (
        <CompletionPhase
          theme={theme}
          onFinish={async () => {
            await endGuidedRoutine(true);
            router.replace("/(tabs)/workout" as any);
          }}
        />
      )}
    </View>
  );
}

// ─── EXERCISE phase ─────────────────────────────────────────────────────
function ExercisePhase({ theme }: { theme: Theme }) {
  const styles = createStyles(theme);
  const { t } = useTranslation();
  const { guidedPlayer, completeCurrentSet } = useActiveWorkout();

  const [openInputForSet, setOpenInputForSet] = useState(false);

  if (!guidedPlayer) return null;
  const exercise = guidedPlayer.exercises[guidedPlayer.currentExerciseIndex];
  if (!exercise) return null;

  const currentSetNumber = guidedPlayer.currentSetIndex + 1;
  const setTarget = exercise.setTargets?.[guidedPlayer.currentSetIndex];
  const targetKg = setTarget?.targetKg ?? exercise.targetWeight ?? 0;
  const targetReps = setTarget?.targetReps ?? exercise.reps;

  // Timed set: auto-advance when countdown hits 0
  const trainingTime = exercise.trainingTime ?? 0;
  const [remaining, setRemaining] = useState(trainingTime);

  useEffect(() => {
    setRemaining(trainingTime);
  }, [trainingTime, guidedPlayer.currentExerciseIndex, guidedPlayer.currentSetIndex]);

  useEffect(() => {
    if (!trainingTime) return;
    if (remaining <= 0) {
      // auto-complete timed set with target values
      completeCurrentSet(targetKg, 0);
      return;
    }
    const id = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(id);
  }, [remaining, trainingTime]);

  return (
    <View style={styles.phaseContainer}>
      <Text style={styles.exerciseLabel}>
        {t("workoutPlayer.exerciseOf", {
          current: guidedPlayer.currentExerciseIndex + 1,
          total: guidedPlayer.exercises.length,
        })}
      </Text>
      <Text style={styles.exerciseTitle}>
        {translateExerciseName(exercise.name)}
      </Text>

      <View style={styles.gifWrap}>
        {exercise.gifUrl ? (
          <Image
            source={{ uri: exercise.gifUrl }}
            style={styles.gif}
            contentFit="contain"
            transition={200}
          />
        ) : (
          <View style={[styles.gif, styles.gifPlaceholder]}>
            <Ionicons
              name="barbell-outline"
              size={48}
              color={theme.foreground.gray}
            />
          </View>
        )}
      </View>

      {/* Set chip */}
      <View style={styles.setBadge}>
        <Text style={styles.setBadgeText}>
          {t("workoutPlayer.setOf", {
            current: currentSetNumber,
            total: exercise.sets,
          })}
        </Text>
      </View>

      {/* Targets row */}
      <View style={styles.targetRow}>
        <View style={styles.targetItem}>
          <Text style={styles.targetValue}>{targetReps}</Text>
          <Text style={styles.targetLabel}>
            {t("createRoutine.reps")}
          </Text>
        </View>
        <View style={styles.targetDivider} />
        <View style={styles.targetItem}>
          <Text style={styles.targetValue}>
            {targetKg > 0 ? `${targetKg}kg` : "—"}
          </Text>
          <Text style={styles.targetLabel}>
            {t("workoutPlayer.weight")}
          </Text>
        </View>
        {!!trainingTime && (
          <>
            <View style={styles.targetDivider} />
            <View style={styles.targetItem}>
              <Text style={styles.targetValue}>
                {formatSeconds(remaining)}
              </Text>
              <Text style={styles.targetLabel}>
                {t("workoutPlayer.timer")}
              </Text>
            </View>
          </>
        )}
      </View>

      {/* Done Set button */}
      <Pressable
        style={({ pressed }) => [
          styles.primaryButton,
          pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
        ]}
        onPress={() => setOpenInputForSet(true)}
      >
        <Ionicons
          name="checkmark-circle"
          size={20}
          color={theme.background.dark}
        />
        <Text style={styles.primaryButtonText}>
          {t("workoutPlayer.doneSet")}
        </Text>
      </Pressable>

      {openInputForSet && (
        <QuickLogInline
          theme={theme}
          defaultKg={targetKg}
          defaultReps={parseInt(String(targetReps).split("-")[0]) || 0}
          onCancel={() => setOpenInputForSet(false)}
          onConfirm={(kg, reps) => {
            setOpenInputForSet(false);
            completeCurrentSet(kg, reps);
          }}
        />
      )}
    </View>
  );
}

function QuickLogInline({
  theme,
  defaultKg,
  defaultReps,
  onCancel,
  onConfirm,
}: {
  theme: Theme;
  defaultKg: number;
  defaultReps: number;
  onCancel: () => void;
  onConfirm: (kg: number, reps: number) => void;
}) {
  const styles = createStyles(theme);
  const { t } = useTranslation();
  const [kg, setKg] = useState(defaultKg > 0 ? String(defaultKg) : "");
  const [reps, setReps] = useState(defaultReps > 0 ? String(defaultReps) : "");

  return (
    <View style={styles.logCardOverlay}>
      <View style={styles.logCard}>
        <Text style={styles.logTitle}>{t("workoutPlayer.logThisSet")}</Text>
        <View style={styles.logRow}>
          <View style={styles.logField}>
            <Text style={styles.logFieldLabel}>
              {t("workoutPlayer.weight")} (kg)
            </Text>
            <TextInput
              style={styles.logInput}
              keyboardType="numeric"
              value={kg}
              onChangeText={setKg}
              placeholder="0"
              placeholderTextColor={theme.foreground.gray}
            />
          </View>
          <View style={styles.logField}>
            <Text style={styles.logFieldLabel}>{t("createRoutine.reps")}</Text>
            <TextInput
              style={styles.logInput}
              keyboardType="numeric"
              value={reps}
              onChangeText={setReps}
              placeholder="0"
              placeholderTextColor={theme.foreground.gray}
            />
          </View>
        </View>
        <View style={styles.logButtonRow}>
          <Pressable style={styles.logCancelButton} onPress={onCancel}>
            <Text style={styles.logCancelText}>
              {t("workoutPlayer.cancel")}
            </Text>
          </Pressable>
          <Pressable
            style={styles.logConfirmButton}
            onPress={() =>
              onConfirm(parseFloat(kg) || 0, parseInt(reps, 10) || 0)
            }
          >
            <Text style={styles.logConfirmText}>
              {t("workoutPlayer.confirm")}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// ─── REST phase ─────────────────────────────────────────────────────────
function RestPhase({ theme }: { theme: Theme }) {
  const styles = createStyles(theme);
  const { t } = useTranslation();
  const { guidedPlayer, skipRest } = useActiveWorkout();

  if (!guidedPlayer) return null;

  const currentExercise = guidedPlayer.exercises[guidedPlayer.currentExerciseIndex];
  const restTime = currentExercise?.restTime ?? 60;
  const [remaining, setRemaining] = useState(restTime);

  // What comes next after this rest?
  const next = useMemo(() => {
    if (!currentExercise) return null;
    const isLastSet =
      guidedPlayer.currentSetIndex + 1 >= currentExercise.sets;
    if (isLastSet) {
      const nextEx = guidedPlayer.exercises[guidedPlayer.currentExerciseIndex + 1];
      if (!nextEx) return null;
      return {
        label: t("workoutPlayer.nextExercise"),
        name: translateExerciseName(nextEx.name),
        gifUrl: nextEx.gifUrl,
      };
    }
    return {
      label: t("workoutPlayer.nextSet"),
      name: translateExerciseName(currentExercise.name),
      gifUrl: currentExercise.gifUrl,
    };
  }, [guidedPlayer, currentExercise, t]);

  useEffect(() => {
    setRemaining(restTime);
  }, [restTime, guidedPlayer.currentExerciseIndex, guidedPlayer.currentSetIndex]);

  useEffect(() => {
    if (remaining <= 0) {
      skipRest();
      return;
    }
    const id = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(id);
  }, [remaining]);

  return (
    <View style={styles.phaseContainer}>
      <Text style={styles.restTitle}>{t("workoutPlayer.rest")}</Text>
      <Text style={styles.restCountdown}>{formatSeconds(remaining)}</Text>
      <Text style={styles.restSubtitle}>
        {t("workoutPlayer.catchYourBreath")}
      </Text>

      {next && (
        <View style={styles.nextCard}>
          <Text style={styles.nextLabel}>{next.label}</Text>
          <View style={styles.nextRow}>
            {next.gifUrl ? (
              <Image
                source={{ uri: next.gifUrl }}
                style={styles.nextGif}
                contentFit="cover"
              />
            ) : (
              <View style={[styles.nextGif, styles.gifPlaceholder]}>
                <Ionicons
                  name="barbell-outline"
                  size={22}
                  color={theme.foreground.gray}
                />
              </View>
            )}
            <Text style={styles.nextName} numberOfLines={2}>
              {next.name}
            </Text>
          </View>
        </View>
      )}

      <Pressable
        style={({ pressed }) => [
          styles.primaryButton,
          pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
        ]}
        onPress={skipRest}
      >
        <Ionicons
          name="play-skip-forward"
          size={20}
          color={theme.background.dark}
        />
        <Text style={styles.primaryButtonText}>
          {t("workoutPlayer.skipRest")}
        </Text>
      </Pressable>
    </View>
  );
}

// ─── COMPLETE phase ─────────────────────────────────────────────────────
function CompletionPhase({
  theme,
  onFinish,
}: {
  theme: Theme;
  onFinish: () => void;
}) {
  const styles = createStyles(theme);
  const { t } = useTranslation();
  const { guidedPlayer, activeWorkout } = useActiveWorkout();
  if (!guidedPlayer) return null;

  const totalVolume = guidedPlayer.loggedSets.reduce(
    (s, x) => s + x.kg * x.reps,
    0,
  );

  return (
    <View style={styles.phaseContainer}>
      <View style={styles.trophy}>
        <Ionicons name="trophy" size={56} color={theme.primary.main} />
      </View>
      <Text style={styles.completeTitle}>
        {t("workoutPlayer.workoutComplete")}
      </Text>
      <Text style={styles.completeSubtitle}>{guidedPlayer.routineName}</Text>

      <View style={styles.summaryRow}>
        <SummaryStat
          theme={theme}
          value={formatDuration(activeWorkout?.duration ?? 0)}
          label={t("routines.duration")}
        />
        <View style={styles.targetDivider} />
        <SummaryStat
          theme={theme}
          value={String(guidedPlayer.loggedSets.length)}
          label={t("createRoutine.sets")}
        />
        <View style={styles.targetDivider} />
        <SummaryStat
          theme={theme}
          value={`${Math.round(totalVolume)}kg`}
          label={t("workoutPlayer.volume")}
        />
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.primaryButton,
          pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
        ]}
        onPress={onFinish}
      >
        <Ionicons
          name="checkmark-done"
          size={20}
          color={theme.background.dark}
        />
        <Text style={styles.primaryButtonText}>
          {t("workoutPlayer.finish")}
        </Text>
      </Pressable>
    </View>
  );
}

function SummaryStat({
  theme,
  value,
  label,
}: {
  theme: Theme;
  value: string;
  label: string;
}) {
  const styles = createStyles(theme);
  return (
    <View style={styles.targetItem}>
      <Text style={styles.targetValue}>{value}</Text>
      <Text style={styles.targetLabel}>{label}</Text>
    </View>
  );
}

function formatSeconds(seconds: number) {
  if (seconds < 0) seconds = 0;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m > 0) return `${m}:${String(s).padStart(2, "0")}`;
  return `${s}s`;
}

function formatDuration(seconds: number) {
  if (seconds < 0) seconds = 0;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

// ─── Styles ─────────────────────────────────────────────────────────────
const createStyles = (theme: Theme) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.background.dark,
    },
    centered: {
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
    },
    emptyText: {
      color: theme.foreground.gray,
      marginBottom: 16,
      fontSize: 15,
    },
    topBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 12,
    },
    iconButton: {
      width: 40,
      height: 40,
      borderRadius: 14,
      backgroundColor: theme.background.darker,
      alignItems: "center",
      justifyContent: "center",
    },
    progressWrap: {
      flex: 1,
      gap: 4,
    },
    progressBar: {
      height: 6,
      borderRadius: 4,
      backgroundColor: theme.background.darker,
      overflow: "hidden",
    },
    progressFill: {
      height: "100%",
      backgroundColor: theme.primary.main,
      borderRadius: 4,
    },
    progressText: {
      color: theme.foreground.gray,
      fontSize: 11,
      fontFamily: FONTS.semiBold,
    },
    timerPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingVertical: 6,
      paddingHorizontal: 10,
      backgroundColor: theme.background.darker,
      borderRadius: 12,
    },
    timerText: {
      color: theme.foreground.white,
      fontSize: 12,
      fontFamily: FONTS.semiBold,
    },
    phaseContainer: {
      flex: 1,
      paddingHorizontal: 24,
      paddingTop: 8,
      paddingBottom: 32,
      alignItems: "center",
    },
    exerciseLabel: {
      color: theme.foreground.gray,
      fontSize: 13,
      fontFamily: FONTS.semiBold,
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: 6,
    },
    exerciseTitle: {
      color: theme.foreground.white,
      fontSize: 22,
      fontFamily: FONTS.extraBold,
      textAlign: "center",
      marginBottom: 18,
    },
    gifWrap: {
      width: GIF_SIZE,
      height: GIF_SIZE,
      borderRadius: 28,
      backgroundColor: theme.background.darker,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.2,
          shadowRadius: 20,
        },
        android: { elevation: 6 },
      }),
      marginBottom: 18,
    },
    gif: {
      width: "100%",
      height: "100%",
    },
    gifPlaceholder: {
      alignItems: "center",
      justifyContent: "center",
    },
    setBadge: {
      backgroundColor: theme.primary.main + "20",
      borderWidth: 1,
      borderColor: theme.primary.main + "40",
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 20,
      marginBottom: 14,
    },
    setBadgeText: {
      color: theme.primary.main,
      fontSize: 13,
      fontFamily: FONTS.bold,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    targetRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.background.darker,
      borderRadius: 20,
      paddingVertical: 14,
      paddingHorizontal: 8,
      width: "100%",
      marginBottom: 24,
    },
    targetItem: {
      flex: 1,
      alignItems: "center",
    },
    targetValue: {
      color: theme.foreground.white,
      fontSize: 20,
      fontFamily: FONTS.extraBold,
    },
    targetLabel: {
      color: theme.foreground.gray,
      fontSize: 11,
      marginTop: 2,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    targetDivider: {
      width: StyleSheet.hairlineWidth,
      height: 36,
      backgroundColor: "rgba(128,128,128,0.25)",
    },
    primaryButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: theme.primary.main,
      borderRadius: 28,
      paddingVertical: 16,
      paddingHorizontal: 24,
      width: "100%",
      marginTop: "auto",
    },
    primaryButtonText: {
      color: theme.background.dark,
      fontSize: 17,
      fontFamily: FONTS.extraBold,
    },
    exitButton: {
      paddingVertical: 12,
      paddingHorizontal: 28,
      backgroundColor: theme.primary.main,
      borderRadius: 22,
    },
    exitButtonText: {
      color: theme.background.dark,
      fontFamily: FONTS.bold,
      fontSize: 15,
    },
    // Quick log overlay
    logCardOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.55)",
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    logCard: {
      width: "100%",
      backgroundColor: theme.background.darker,
      borderRadius: 24,
      padding: 20,
      gap: 16,
    },
    logTitle: {
      color: theme.foreground.white,
      fontSize: 17,
      fontFamily: FONTS.bold,
      textAlign: "center",
    },
    logRow: {
      flexDirection: "row",
      gap: 12,
    },
    logField: {
      flex: 1,
      gap: 6,
    },
    logFieldLabel: {
      color: theme.foreground.gray,
      fontSize: 12,
      fontFamily: FONTS.semiBold,
    },
    logInput: {
      backgroundColor: theme.background.dark,
      color: theme.foreground.white,
      borderRadius: 14,
      paddingVertical: 14,
      paddingHorizontal: 16,
      fontSize: 18,
      fontFamily: FONTS.bold,
      textAlign: "center",
    },
    logButtonRow: {
      flexDirection: "row",
      gap: 10,
    },
    logCancelButton: {
      flex: 1,
      backgroundColor: theme.background.dark,
      borderRadius: 20,
      paddingVertical: 14,
      alignItems: "center",
    },
    logCancelText: {
      color: theme.foreground.white,
      fontFamily: FONTS.semiBold,
      fontSize: 15,
    },
    logConfirmButton: {
      flex: 2,
      backgroundColor: theme.primary.main,
      borderRadius: 20,
      paddingVertical: 14,
      alignItems: "center",
    },
    logConfirmText: {
      color: theme.background.dark,
      fontFamily: FONTS.extraBold,
      fontSize: 15,
    },
    // Rest
    restTitle: {
      color: theme.foreground.gray,
      fontSize: 14,
      fontFamily: FONTS.semiBold,
      textTransform: "uppercase",
      letterSpacing: 2,
      marginTop: 24,
    },
    restCountdown: {
      color: theme.primary.main,
      fontSize: 96,
      fontFamily: FONTS.extraBold,
      marginTop: 8,
      marginBottom: 4,
    },
    restSubtitle: {
      color: theme.foreground.gray,
      fontSize: 14,
      marginBottom: 24,
    },
    nextCard: {
      width: "100%",
      backgroundColor: theme.background.darker,
      borderRadius: 20,
      padding: 16,
      marginBottom: 24,
    },
    nextLabel: {
      color: theme.foreground.gray,
      fontSize: 11,
      fontFamily: FONTS.semiBold,
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: 10,
    },
    nextRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    nextGif: {
      width: 56,
      height: 56,
      borderRadius: 14,
      backgroundColor: theme.background.dark,
    },
    nextName: {
      flex: 1,
      color: theme.foreground.white,
      fontSize: 15,
      fontFamily: FONTS.bold,
    },
    // Completion
    trophy: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: theme.primary.main + "20",
      alignItems: "center",
      justifyContent: "center",
      marginTop: 32,
      marginBottom: 16,
    },
    completeTitle: {
      color: theme.foreground.white,
      fontSize: 26,
      fontFamily: FONTS.extraBold,
      textAlign: "center",
    },
    completeSubtitle: {
      color: theme.foreground.gray,
      fontSize: 15,
      marginTop: 4,
      marginBottom: 24,
      textAlign: "center",
    },
    summaryRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.background.darker,
      borderRadius: 20,
      paddingVertical: 16,
      paddingHorizontal: 8,
      width: "100%",
      marginBottom: 24,
    },
  });

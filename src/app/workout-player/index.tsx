import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  BackHandler,
  KeyboardAvoidingView,
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
import Svg, { Circle } from "react-native-svg";
import ConfirmationModal from "../../components/ui/ConfirmationModal";
import WorkoutCompletionView from "../../components/ui/WorkoutCompletionView";
import { FONTS } from "../../constants/fonts";
import { Theme } from "../../constants/themes";
import {
  GuidedPlayerExercise,
  PlayerSet,
  useActiveWorkout,
} from "../../contexts/ActiveWorkoutContext";
import { useTheme } from "../../contexts/ThemeContext";
import { findExerciseByNameExerciseDb } from "../../services/exerciseDbApi";
import { translateExerciseName } from "../../utils/exerciseTranslator";

const WARMUP_COLOR = "#F5A524";
const NAVY_BLUE = "#0B1437";

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
    updatePlayerSet,
    addPlayerSet,
    removePlayerSet,
    togglePlayerSetWarmup,
    togglePlayerSetCompleted,
    stopPlayerRest,
    adjustPlayerRest,
  } = useActiveWorkout();

  // ── Lazy-hydrate missing gifUrls for each exercise ────────────────
  useEffect(() => {
    if (!guidedPlayer) return;
    let cancelled = false;
    guidedPlayer.exercises.forEach(async (ex) => {
      if (ex.gifUrl) return;
      const found = await findExerciseByNameExerciseDb(ex.name);
      if (cancelled || !found) return;
      updateGuidedExercise(ex.id, {
        gifUrl: found.gifUrl,
        bodyPart: found.bodyPart,
        target: found.target,
        equipment: found.equipment,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [guidedPlayer?.exercises.length]);

  const [exitModalVisible, setExitModalVisible] = useState(false);
  const [completionVisible, setCompletionVisible] = useState(false);

  const confirmExit = useCallback(() => {
    setExitModalVisible(true);
  }, []);

  const handleEndConfirm = useCallback(async () => {
    setExitModalVisible(false);
    setCompletionVisible(true);
  }, []);

  const handleCompletionFinish = useCallback(async () => {
    setCompletionVisible(false);
    await endGuidedRoutine(true);
    router.replace("/(tabs)/workout" as any);
  }, [endGuidedRoutine, router]);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      confirmExit();
      return true;
    });
    return () => sub.remove();
  }, [confirmExit]);

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

  // ── Aggregated stats ───────────────────────────────────────────────
  const completedSets = guidedPlayer.exercises.reduce(
    (acc, ex) =>
      acc + ex.sets.filter((s) => s.isCompleted && !s.isWarmup).length,
    0,
  );
  const totalVolume = guidedPlayer.exercises.reduce((acc, ex) => {
    return (
      acc +
      ex.sets.reduce((v, s) => {
        if (!s.isCompleted || s.isWarmup) return v;
        const kg = parseFloat(s.kg) || 0;
        const reps = parseInt(s.reps, 10) || 0;
        return v + kg * reps;
      }, 0)
    );
  }, 0);

  const duration = activeWorkout?.duration ?? 0;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.root}>
        {/* ── Header ────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={confirmExit}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name="chevron-down"
              size={22}
              color={theme.foreground.white}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("workoutPlayer.title")}</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.headerIconBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name="alarm-outline"
                size={20}
                color={theme.foreground.white}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.finishBtn}
              onPress={handleEndConfirm}
            >
              <Text style={styles.finishBtnText}>
                {t("workoutPlayer.finish")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Stats strip ───────────────────────────────────────────── */}
        <View style={styles.statsStrip}>
          <View style={styles.statCol}>
            <Text style={styles.statLabel}>{t("workoutPlayer.duration")}</Text>
            <Text style={styles.statValue}>{formatDuration(duration)}</Text>
          </View>
          <View style={styles.statCol}>
            <Text style={styles.statLabel}>{t("workoutPlayer.volume")}</Text>
            <Text style={styles.statValue}>{Math.round(totalVolume)} kg</Text>
          </View>
          <View style={styles.statCol}>
            <Text style={styles.statLabel}>{t("workoutPlayer.sets")}</Text>
            <Text style={styles.statValue}>{completedSets}</Text>
          </View>
        </View>

        {/* ── Rest timer modal ──────────────────────────────────────── */}
        {guidedPlayer.restEndsAt ? (
          <RestTimerModal
            endsAt={guidedPlayer.restEndsAt}
            totalSeconds={guidedPlayer.restTotalSeconds ?? 60}
            onSkip={stopPlayerRest}
            onAdjust={adjustPlayerRest}
          />
        ) : null}

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {guidedPlayer.exercises.map((ex) => (
            <ExerciseCard
              key={ex.id}
              theme={theme}
              exercise={ex}
              onSetChange={(setId, updates) =>
                updatePlayerSet(ex.id, setId, updates)
              }
              onAddSet={() => addPlayerSet(ex.id)}
              onRemoveSet={(setId) => removePlayerSet(ex.id, setId)}
              onToggleWarmup={(setId) => togglePlayerSetWarmup(ex.id, setId)}
              onToggleComplete={(setId) =>
                togglePlayerSetCompleted(ex.id, setId)
              }
            />
          ))}
        </ScrollView>

        <ConfirmationModal
          visible={exitModalVisible}
          variant="success"
          icon="flag"
          title={t("workoutPlayer.endWorkout")}
          message={t("workoutPlayer.endWorkoutConfirm")}
          confirmLabel={t("workoutPlayer.endAndSave")}
          cancelLabel={t("workoutPlayer.cancel")}
          onCancel={() => setExitModalVisible(false)}
          onConfirm={handleEndConfirm}
        />

        <Modal
          visible={completionVisible}
          animationType="slide"
          onRequestClose={handleCompletionFinish}
        >
          <WorkoutCompletionView
            theme={theme}
            routineName={guidedPlayer.routineName}
            exercises={guidedPlayer.exercises.length}
            calories={Math.round(duration * 0.1)}
            duration={formatDuration(duration)}
            onFinish={handleCompletionFinish}
          />
        </Modal>
      </View>
    </KeyboardAvoidingView>
  );
}

const REST_MODAL_BG = "#1254C5";
const RING_SIZE = 240;
const RING_STROKE = 14;
const RING_R = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_R;

// ─── Rest timer modal ─────────────────────────────────────────────────
function RestTimerModal({
  endsAt,
  totalSeconds,
  onSkip,
  onAdjust,
}: {
  endsAt: number;
  totalSeconds: number;
  onSkip: () => void;
  onAdjust: (delta: number) => void;
}) {
  const { t } = useTranslation();
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, Math.round((endsAt - Date.now()) / 1000)),
  );

  useEffect(() => {
    setRemaining(Math.max(0, Math.round((endsAt - Date.now()) / 1000)));
    const id = setInterval(() => {
      const next = Math.max(0, Math.round((endsAt - Date.now()) / 1000));
      setRemaining(next);
      if (next <= 0) {
        clearInterval(id);
        onSkip();
      }
    }, 500);
    return () => clearInterval(id);
  }, [endsAt, onSkip]);

  const progress = totalSeconds > 0 ? Math.min(1, remaining / totalSeconds) : 0;
  const strokeDashoffset = RING_CIRCUMFERENCE * (1 - progress);
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  return (
    <Modal visible transparent animationType="fade">
      <View style={restModalStyles.backdrop}>
        <View style={restModalStyles.card}>
          <Text style={restModalStyles.title}>{t("workoutPlayer.rest")}</Text>

          <View style={restModalStyles.ringWrap}>
            <Svg width={RING_SIZE} height={RING_SIZE} style={StyleSheet.absoluteFillObject}>
              <Circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RING_R}
                stroke="rgba(255,255,255,0.18)"
                strokeWidth={RING_STROKE}
                fill="none"
              />
              <Circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RING_R}
                stroke="#FFFFFF"
                strokeWidth={RING_STROKE}
                fill="none"
                strokeDasharray={[RING_CIRCUMFERENCE, RING_CIRCUMFERENCE]}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                transform={`rotate(-90, ${RING_SIZE / 2}, ${RING_SIZE / 2})`}
              />
            </Svg>
            <Text style={restModalStyles.timerText}>
              {`${minutes}:${String(seconds).padStart(2, "0")}`}
            </Text>
          </View>

          <View style={restModalStyles.adjustRow}>
            <TouchableOpacity
              style={restModalStyles.adjustBtn}
              onPress={() => onAdjust(-15)}
            >
              <Text style={restModalStyles.adjustBtnText}>-15s</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={restModalStyles.adjustBtn}
              onPress={() => onAdjust(15)}
            >
              <Text style={restModalStyles.adjustBtnText}>+15s</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={restModalStyles.skipBtn} onPress={onSkip}>
            <Text style={restModalStyles.skipBtnText}>{t("workoutPlayer.skipRest")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const restModalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: REST_MODAL_BG,
    borderRadius: 28,
    paddingVertical: 36,
    paddingHorizontal: 24,
    alignItems: "center",
    gap: 28,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 20,
    fontFamily: FONTS.bold,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  ringWrap: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  timerText: {
    color: "#FFFFFF",
    fontSize: 58,
    fontFamily: FONTS.bold,
  },
  adjustRow: {
    flexDirection: "row",
    gap: 12,
  },
  adjustBtn: {
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 32,
  },
  adjustBtnText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontFamily: FONTS.bold,
  },
  skipBtn: {
    paddingVertical: 11,
    paddingHorizontal: 32,
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.35)",
  },
  skipBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: FONTS.semiBold,
  },
});

// ─── Exercise card ────────────────────────────────────────────────────
function ExerciseCard({
  theme,
  exercise,
  onSetChange,
  onAddSet,
  onRemoveSet,
  onToggleWarmup,
  onToggleComplete,
}: {
  theme: Theme;
  exercise: GuidedPlayerExercise;
  onSetChange: (setId: string, updates: Partial<PlayerSet>) => void;
  onAddSet: () => void;
  onRemoveSet: (setId: string) => void;
  onToggleWarmup: (setId: string) => void;
  onToggleComplete: (setId: string) => void;
}) {
  const { t } = useTranslation();
  const styles = createStyles(theme);
  const [gifModalVisible, setGifModalVisible] = useState(false);

  const displayName = translateExerciseName(exercise.name);
  const restLabel = useMemo(() => {
    const s = exercise.restSeconds;
    if (s <= 0) return null;
    const m = Math.floor(s / 60);
    const sec = s % 60;
    if (m === 0) return `${sec}s`;
    if (sec === 0) return `${m}min`;
    return `${m}min ${sec}s`;
  }, [exercise.restSeconds]);

  // Number working sets sequentially; warmup sets show "W"
  const setLabels = useMemo(() => {
    let working = 0;
    return exercise.sets.map((s) => {
      if (s.isWarmup) return "W";
      working += 1;
      return String(working);
    });
  }, [exercise.sets]);

  const handleSetLongPress = (set: PlayerSet) => {
    Alert.alert(displayName, undefined, [
      {
        text: set.isWarmup
          ? t("workoutPlayer.markAsWorking")
          : t("workoutPlayer.markAsWarmup"),
        onPress: () => onToggleWarmup(set.id),
      },
      {
        text: t("workoutPlayer.removeSet"),
        style: "destructive",
        onPress: () => onRemoveSet(set.id),
      },
      { text: t("workoutPlayer.cancel"), style: "cancel" },
    ]);
  };

  return (
    <View style={styles.exerciseCard}>
      {/* Header row */}
      <View style={styles.exerciseHeader}>
        <TouchableOpacity
          style={styles.thumbWrap}
          onPress={() => exercise.gifUrl && setGifModalVisible(true)}
          activeOpacity={0.85}
        >
          {exercise.gifUrl ? (
            <Image
              source={{ uri: exercise.gifUrl }}
              style={styles.thumb}
              contentFit="cover"
              transition={150}
              autoplay={true}
            />
          ) : (
            <Ionicons
              name="barbell-outline"
              size={22}
              color={theme.foreground.gray}
            />
          )}
        </TouchableOpacity>
        <Text style={styles.exerciseName} numberOfLines={2}>
          {displayName}
        </Text>
        {exercise.gifUrl ? (
          <TouchableOpacity
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            style={styles.seeExerciseBtn}
            onPress={() => setGifModalVisible(true)}
          >
            <Ionicons name="eye-outline" size={16} color="#FFFFFF" />
            <Text style={styles.seeExerciseText}>
              {t("workoutPlayer.seeExercise")}
            </Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.menuBtn}
        >
          <Ionicons
            name="ellipsis-vertical"
            size={18}
            color={theme.foreground.gray}
          />
        </TouchableOpacity>
      </View>

      {/* Per-exercise rest */}
      {restLabel ? (
        <View style={styles.restRow}>
          <Ionicons name="timer-outline" size={14} color={theme.primary.main} />
          <Text style={styles.restRowText}>
            {t("workoutPlayer.rest2", { value: restLabel })}
          </Text>
        </View>
      ) : null}

      {/* Column headers */}
      <View style={styles.setHeaderRow}>
        <Text style={[styles.setHeaderLabel, styles.colSet]}>
          {t("workoutPlayer.set")}
        </Text>
        <Text style={[styles.setHeaderLabel, styles.colPrev]}>
          {t("workoutPlayer.previous")}
        </Text>
        <Text style={[styles.setHeaderLabel, styles.colInput]}>
          {t("workoutPlayer.kg")}
        </Text>
        <Text style={[styles.setHeaderLabel, styles.colInput]}>
          {t("workoutPlayer.reps")}
        </Text>
        <View style={styles.colCheck}>
          <Ionicons name="checkmark" size={14} color={theme.foreground.gray} />
        </View>
      </View>

      {/* Set rows */}
      {exercise.sets.map((set, idx) => {
        const prevLabel =
          set.previousKg !== undefined && set.previousReps !== undefined
            ? `${set.previousKg}kg x ${set.previousReps}`
            : "—";
        return (
          <View
            key={set.id}
            style={[styles.setRow, set.isCompleted && styles.setRowCompleted]}
          >
            <TouchableOpacity
              style={styles.colSet}
              onLongPress={() => handleSetLongPress(set)}
              onPress={() => handleSetLongPress(set)}
              hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
            >
              <Text
                style={[
                  styles.setLabel,
                  set.isCompleted && { color: "#FFFFFF" },
                  set.isWarmup && { color: WARMUP_COLOR },
                ]}
              >
                {setLabels[idx]}
              </Text>
            </TouchableOpacity>
            <Text
              style={[styles.prevText, set.isCompleted && { color: "#FFFFFF" }]}
            >
              {prevLabel}
            </Text>
            <TextInput
              style={[
                styles.input,
                styles.colInput,
                set.isCompleted && { color: "#FFFFFF" },
              ]}
              value={set.kg}
              onChangeText={(v) => onSetChange(set.id, { kg: v })}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={theme.foreground.gray + "80"}
              selectTextOnFocus
            />
            <TextInput
              style={[
                styles.input,
                styles.colInput,
                set.isCompleted && { color: "#FFFFFF" },
              ]}
              value={set.reps}
              onChangeText={(v) => onSetChange(set.id, { reps: v })}
              keyboardType="default"
              placeholder={exercise.targetReps || "0"}
              placeholderTextColor={theme.foreground.gray + "80"}
              selectTextOnFocus
            />
            <TouchableOpacity
              style={styles.colCheck}
              onPress={() => onToggleComplete(set.id)}
            >
              <View
                style={[styles.checkBox, set.isCompleted && styles.checkBoxOn]}
              >
                {set.isCompleted ? (
                  <Ionicons name="checkmark" size={14} color="#fff" />
                ) : null}
              </View>
            </TouchableOpacity>
          </View>
        );
      })}

      {/* Add set */}
      <TouchableOpacity style={styles.addSetBtn} onPress={onAddSet}>
        <Ionicons name="add" size={16} color="#FFFFFF" />
        <Text style={styles.addSetText}>{t("workoutPlayer.addSet")}</Text>
      </TouchableOpacity>

      {/* Gif preview modal */}
      <Modal
        visible={gifModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setGifModalVisible(false)}
      >
        <Pressable
          style={styles.gifModalOverlay}
          onPress={() => setGifModalVisible(false)}
        >
          <View style={styles.gifModalContent}>
            <Text style={styles.gifModalTitle} numberOfLines={2}>
              {displayName}
            </Text>
            {exercise.gifUrl ? (
              <Image
                source={{ uri: exercise.gifUrl }}
                style={styles.gifModalImage}
                contentFit="contain"
              />
            ) : null}
            <TouchableOpacity
              style={styles.gifModalCloseBtn}
              onPress={() => setGifModalVisible(false)}
            >
              <Ionicons name="close" size={22} color={theme.foreground.white} />
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

function formatDuration(seconds: number) {
  if (seconds < 0) seconds = 0;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}min ${String(s).padStart(2, "0")}s`;
  return `${m}min ${String(s).padStart(2, "0")}s`;
}

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
    // Header
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingTop: 6,
      paddingBottom: 10,
      gap: 8,
    },
    headerIconBtn: {
      width: 32,
      height: 32,
      alignItems: "center",
      justifyContent: "center",
    },
    headerTitle: {
      flex: 1,
      fontSize: 18,
      fontFamily: FONTS.bold,
      color: theme.foreground.white,
    },
    headerRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    finishBtn: {
      backgroundColor: theme.primary.main,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
    },
    finishBtnText: {
      color: theme.background.dark,
      fontFamily: FONTS.bold,
      fontSize: 14,
    },
    // Stats strip
    statsStrip: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-evenly",
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: theme.foreground.gray + "30",
    },
    statCol: {
      gap: 2,
      alignItems: "center",
    },
    statLabel: {
      fontSize: 11,
      fontFamily: FONTS.semiBold,
      color: theme.foreground.gray,
    },
    statValue: {
      fontSize: 15,
      fontFamily: FONTS.bold,
      color: theme.foreground.white,
    },
    // Scroll
    scrollContent: {
      paddingHorizontal: 12,
      paddingTop: 14,
      paddingBottom: 60,
      gap: 24,
    },
    // Exercise card
    exerciseCard: {
      gap: 6,
    },
    exerciseHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    thumbWrap: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.background.darker,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    thumb: {
      width: "100%",
      height: "100%",
    },
    exerciseName: {
      flex: 1,
      color: theme.primary.main,
      fontSize: 16,
      fontFamily: FONTS.bold,
    },
    menuBtn: {
      padding: 4,
    },
    seeExerciseBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: 14,
      backgroundColor: NAVY_BLUE,
    },
    seeExerciseText: {
      color: "#FFFFFF",
      fontSize: 12,
      fontFamily: FONTS.semiBold,
    },
    // Rest row
    restRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: 2,
      marginBottom: 4,
    },
    restRowText: {
      fontSize: 13,
      fontFamily: FONTS.semiBold,
      color: theme.primary.main,
    },
    // Set table headers
    setHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 8,
    },
    setHeaderLabel: {
      fontSize: 11,
      fontFamily: FONTS.bold,
      color: theme.foreground.gray,
      letterSpacing: 0.5,
    },
    colSet: {
      width: 36,
      alignItems: "center",
      textAlign: "center",
    },
    colPrev: {
      flex: 1,
      textAlign: "center",
    },
    colInput: {
      width: 60,
      textAlign: "center",
    },
    colCheck: {
      width: 36,
      alignItems: "center",
      justifyContent: "center",
    },
    // Set rows
    setRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 6,
      borderRadius: 8,
    },
    setRowCompleted: {
      backgroundColor: NAVY_BLUE,
      borderRadius: 14,
      paddingHorizontal: 6,
    },
    setLabel: {
      fontSize: 14,
      fontFamily: FONTS.bold,
      color: theme.foreground.white,
    },
    prevText: {
      flex: 1,
      textAlign: "center",
      color: theme.foreground.gray,
      fontSize: 13,
      fontFamily: FONTS.medium,
    },
    input: {
      backgroundColor: "transparent",
      color: theme.foreground.white,
      fontSize: 14,
      fontFamily: FONTS.semiBold,
      textAlign: "center",
      paddingVertical: 6,
    },
    checkBox: {
      width: 24,
      height: 24,
      borderRadius: 6,
      backgroundColor: theme.background.darker,
      alignItems: "center",
      justifyContent: "center",
    },
    checkBoxOn: {
      backgroundColor: NAVY_BLUE,
    },
    // Add set
    addSetBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      backgroundColor: NAVY_BLUE,
      paddingVertical: 10,
      borderRadius: 10,
      marginTop: 6,
    },
    addSetText: {
      color: "#FFFFFF",
      fontSize: 13,
      fontFamily: FONTS.semiBold,
    },
    // Gif preview modal
    gifModalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.75)",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
    },
    gifModalContent: {
      backgroundColor: theme.background.darker,
      borderRadius: 18,
      padding: 16,
      width: "100%",
      maxWidth: 420,
      alignItems: "center",
      gap: 10,
    },
    gifModalTitle: {
      fontSize: 16,
      fontFamily: FONTS.bold,
      color: theme.foreground.white,
      textAlign: "center",
    },
    gifModalImage: {
      width: "100%",
      aspectRatio: 1,
      borderRadius: 12,
      backgroundColor: theme.background.dark,
    },
    gifModalCloseBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.background.dark,
      alignItems: "center",
      justifyContent: "center",
    },
  });

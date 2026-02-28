import { Ionicons } from "@expo/vector-icons";
import BottomSheet, {
  BottomSheetScrollView,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Theme } from "../../constants/themes";
import {
  ExerciseSet,
  useActiveWorkout,
  WorkoutExerciseEntry,
} from "../../contexts/ActiveWorkoutContext";
import { useTheme } from "../../contexts/ThemeContext";
import { formatDisplayDate, formatTime } from "../../utils/dateFormatter";

const REST_TARGET = 90; // seconds

// ─── Exercise options menu modal ──────────────────────────────────────────────
interface ExerciseMenuProps {
  visible: boolean;
  onClose: () => void;
  onReorder: () => void;
  onReplace: () => void;
  onRemove: () => void;
  theme: Theme;
}

const ExerciseMenu: React.FC<ExerciseMenuProps> = ({
  visible,
  onClose,
  onReorder,
  onReplace,
  onRemove,
  theme,
}) => {
  const styles = menuStyles(theme);
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <TouchableOpacity style={styles.option} onPress={onReorder}>
            <Ionicons
              name="swap-vertical-outline"
              size={20}
              color={theme.foreground.white}
            />
            <Text style={styles.optionText}>Reorder Exercise</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.option} onPress={onReplace}>
            <Ionicons
              name="repeat-outline"
              size={20}
              color={theme.foreground.white}
            />
            <Text style={styles.optionText}>Replace Exercise</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.option} onPress={onRemove}>
            <Ionicons name="trash-outline" size={20} color="#ef4444" />
            <Text style={[styles.optionText, { color: "#ef4444" }]}>
              Remove Exercise
            </Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
};

interface ActiveWorkoutSheetProps {
  isExpanded?: boolean;
}

// ─── Main Sheet ───────────────────────────────────────────────────────────────
const ActiveWorkoutSheet = forwardRef<BottomSheet, ActiveWorkoutSheetProps>(
  ({ isExpanded = false }, ref) => {
    const { t } = useTranslation();
    const router = useRouter();
    const { theme } = useTheme();
    const styles = createStyles(theme);
    const {
      activeWorkout,
      discardWorkout,
      setIsExpanded,
      removeExerciseFromWorkout,
      addSetToExercise,
      updateSet,
      removeSet,
      reorderExercise,
    } = useActiveWorkout();

    // ── Workout name ──────────────────────────────────────────────────────
    const [saveModalVisible, setSaveModalVisible] = useState(false);
    const [tempWorkoutName, setTempWorkoutName] = useState("");

    const handleDiscard = useCallback(() => {
      Alert.alert(
        t("workout.discardWorkout"),
        t("workout.discardWorkoutConfirm"),
        [
          { text: t("common.cancel"), style: "cancel" },
          {
            text: t("workout.discard"),
            style: "destructive",
            onPress: () => {
              discardWorkout();
              setIsExpanded(false);
            },
          },
        ],
      );
    }, [discardWorkout, setIsExpanded]);

    const handleSave = useCallback(() => {
      setTempWorkoutName(`Workout ${formatDisplayDate(new Date())}`);
      setSaveModalVisible(true);
    }, []);

    const handleConfirmSave = useCallback(() => {
      if (!activeWorkout) return;

      // Map active workout -> mockData.Workout
      const toSave = {
        id: `w-${Date.now()}`,
        userId: "1",
        name: tempWorkoutName,
        date: new Date().toISOString().split("T")[0],
        startTime: formatTime(new Date()),
        endTime: formatTime(new Date()),
        duration: Math.max(0, Math.round(activeWorkout.duration / 60)),
        caloriesBurned: 0,
        exercises: activeWorkout.exercises.map((ex) => ({
          id: ex.id,
          name: ex.name,
          sets: ex.sets.length,
          reps: ex.sets[0]?.reps || "",
          weight: ex.sets[0]?.kg ? `${ex.sets[0].kg} kg` : undefined,
        })),
        notes: undefined,
      };

      // Persist in-memory and close
      try {
        // lazy-import to avoid circulars
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { addWorkout } = require("../../data/mockData");
        addWorkout(toSave);
      } catch (err) {
        console.warn("addWorkout failed:", err);
      }

      setSaveModalVisible(false);
      Alert.alert("Save Workout", "Workout saved successfully!", [
        {
          text: "OK",
          onPress: () => {
            discardWorkout();
            setIsExpanded(false);
          },
        },
      ]);
    }, [activeWorkout, discardWorkout, setIsExpanded, tempWorkoutName]);

    const snapPoints = ["100%"];
    // ── Rest timer ────────────────────────────────────────────────────────────
    const [restActive, setRestActive] = useState(false);
    const [restElapsed, setRestElapsed] = useState(0);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
      if (restActive) {
        intervalRef.current = setInterval(() => {
          setRestElapsed((prev) => {
            if (prev >= REST_TARGET) {
              setRestActive(false);
              return 0;
            }
            return prev + 1;
          });
        }, 1000);
      } else {
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }, [restActive]);

    const startRestTimer = useCallback(() => {
      setRestElapsed(0);
      setRestActive(true);
    }, []);

    const skipRestTimer = useCallback(() => {
      setRestActive(false);
      setRestElapsed(0);
    }, []);

    const formatTimer = (secs: number) => {
      const remaining = REST_TARGET - secs;
      const m = Math.floor(remaining / 60);
      const s = remaining % 60;
      return `${m}:${s.toString().padStart(2, "0")}`;
    };

    // ── Workout duration ──────────────────────────────────────────────────────
    const formatDuration = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    // ── Exercise menu state ───────────────────────────────────────────────────
    const [menuExerciseId, setMenuExerciseId] = useState<string | null>(null);

    const handleMenuReorder = useCallback(() => {
      if (!menuExerciseId || !activeWorkout) return;
      setMenuExerciseId(null);
      const idx = activeWorkout.exercises.findIndex(
        (e) => e.id === menuExerciseId,
      );
      Alert.alert(
        "Reorder Exercise",
        `Move "${activeWorkout.exercises[idx]?.name}"`,
        [
          { text: "Move Up", onPress: () => reorderExercise(idx, idx - 1) },
          { text: "Move Down", onPress: () => reorderExercise(idx, idx + 1) },
          { text: "Cancel", style: "cancel" },
        ],
      );
    }, [menuExerciseId, activeWorkout, reorderExercise]);

    const handleMenuReplace = useCallback(() => {
      setMenuExerciseId(null);
      router.navigate("exercise-picker" as any);
    }, [router]);

    const handleMenuRemove = useCallback(() => {
      if (!menuExerciseId) return;
      setMenuExerciseId(null);
      removeExerciseFromWorkout(menuExerciseId);
    }, [menuExerciseId, removeExerciseFromWorkout]);

    // ── Set row ───────────────────────────────────────────────────────────────
    const renderSetRow = useCallback(
      (exerciseId: string, set: ExerciseSet) => {
        const prevLabel =
          set.previousKg !== undefined && set.previousReps !== undefined
            ? `${set.previousKg} × ${set.previousReps}`
            : "—";

        const toggleComplete = () => {
          updateSet(exerciseId, set.id, { isCompleted: !set.isCompleted });
          if (!set.isCompleted) startRestTimer();
        };

        return (
          <View
            key={set.id}
            style={[styles.setRow, set.isCompleted && styles.setRowCompleted]}
          >
            {/* Set number — long-press to delete */}
            <TouchableOpacity
              onLongPress={() => removeSet(exerciseId, set.id)}
              hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
              style={styles.setNumberCell}
            >
              <Text style={styles.setNumberText}>{set.setNumber}</Text>
            </TouchableOpacity>

            {/* Previous */}
            <Text style={styles.setPrevText}>{prevLabel}</Text>

            {/* kg input */}
            <BottomSheetTextInput
              style={[
                styles.setInput,
                set.isCompleted && styles.setInputCompleted,
              ]}
              value={set.kg}
              onChangeText={(v) => updateSet(exerciseId, set.id, { kg: v })}
              keyboardType="decimal-pad"
              placeholder="kg"
              placeholderTextColor={theme.foreground.gray}
              selectTextOnFocus
            />

            {/* reps input */}
            <BottomSheetTextInput
              style={[
                styles.setInput,
                set.isCompleted && styles.setInputCompleted,
              ]}
              value={set.reps}
              onChangeText={(v) => updateSet(exerciseId, set.id, { reps: v })}
              keyboardType="number-pad"
              placeholder="reps"
              placeholderTextColor={theme.foreground.gray}
              selectTextOnFocus
            />

            {/* Done checkmark */}
            <TouchableOpacity
              style={styles.setDoneBtn}
              onPress={toggleComplete}
            >
              <Ionicons
                name={
                  set.isCompleted
                    ? "checkmark-circle"
                    : "checkmark-circle-outline"
                }
                size={24}
                color={
                  set.isCompleted ? theme.primary.main : theme.foreground.gray
                }
              />
            </TouchableOpacity>
          </View>
        );
      },
      [updateSet, removeSet, startRestTimer, styles, theme],
    );

    // ── Exercise card ─────────────────────────────────────────────────────────
    const renderExercise = useCallback(
      (item: WorkoutExerciseEntry) => {
        const muscles = item.muscles.map((m) => m.name_en || m.name).join(", ");

        return (
          <View key={item.id} style={styles.exerciseCard}>
            {/* Header row */}
            <View style={styles.exerciseHeader}>
              <View style={styles.exerciseTitleBlock}>
                <Text style={styles.exerciseName}>{item.name}</Text>
                {muscles ? (
                  <Text style={styles.exerciseMuscles}>{muscles}</Text>
                ) : null}
              </View>
              <TouchableOpacity
                style={styles.menuBtn}
                onPress={() => setMenuExerciseId(item.id)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name="ellipsis-horizontal"
                  size={20}
                  color={theme.foreground.gray}
                />
              </TouchableOpacity>
            </View>

            {/* Column headers */}
            <View style={styles.setHeaderRow}>
              <Text style={[styles.setHeaderLabel, styles.setNumberCell]}>
                {t("workout.set")}
              </Text>
              <Text
                style={[
                  styles.setHeaderLabel,
                  { flex: 1, textAlign: "center" },
                ]}
              >
                {t("workout.previous")}
              </Text>
              <Text style={[styles.setHeaderLabel, styles.setInputHeader]}>
                {t("workout.kg")}
              </Text>
              <Text style={[styles.setHeaderLabel, styles.setInputHeader]}>
                {t("workout.reps")}
              </Text>
              <View style={styles.setDoneBtn} />
            </View>

            {/* Set rows */}
            {item.sets.map((s) => renderSetRow(item.id, s))}

            {/* Add set */}
            <TouchableOpacity
              style={styles.addSetBtn}
              onPress={() => addSetToExercise(item.id)}
            >
              <Ionicons
                name="add-outline"
                size={16}
                color={theme.primary.main}
              />
              <Text style={styles.addSetText}>{t("workout.addSet")}</Text>
            </TouchableOpacity>
          </View>
        );
      },
      [renderSetRow, addSetToExercise, styles, theme],
    );

    if (!activeWorkout) return null;

    return (
      <>
        <BottomSheet
          ref={ref}
          index={isExpanded ? 0 : -1}
          snapPoints={snapPoints}
          enableDynamicSizing={false}
          enablePanDownToClose
          onClose={() => setIsExpanded(false)}
          backgroundStyle={styles.bottomSheetBackground}
          handleIndicatorStyle={styles.handleIndicator}
        >
          {/* ── Header ───────────────────────────────────────────────────── */}
          <View style={styles.header}>
            <Text style={styles.title}>{t("workout.activeWorkout")}</Text>
            <View style={styles.headerButtons}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={handleDiscard}
              >
                <Ionicons name="trash-outline" size={24} color="#ef4444" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={handleSave}
              >
                <Ionicons
                  name="checkmark-circle-outline"
                  size={24}
                  color="#4CAF50"
                />
              </TouchableOpacity>
            </View>
          </View>

          <BottomSheetScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* ── Stats ──────────────────────────────────────────────────── */}
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Ionicons
                  name="time-outline"
                  size={22}
                  color={theme.primary.main}
                />
                <Text style={styles.statValue}>
                  {formatDuration(activeWorkout.duration)}
                </Text>
                <Text style={styles.statLabel}>Duration</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons
                  name="barbell-outline"
                  size={22}
                  color={theme.primary.main}
                />
                <Text style={styles.statValue}>{activeWorkout.volume} lbs</Text>
                <Text style={styles.statLabel}>Volume</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons
                  name="repeat-outline"
                  size={22}
                  color={theme.primary.main}
                />
                <Text style={styles.statValue}>{activeWorkout.sets}</Text>
                <Text style={styles.statLabel}>Sets</Text>
              </View>
            </View>

            {/* ── Rest Timer Banner ───────────────────────────────────────── */}
            {restActive && (
              <View style={styles.timerBanner}>
                <Ionicons
                  name="timer-outline"
                  size={18}
                  color={theme.primary.main}
                />
                <Text style={styles.timerLabel}>{t("scheduleDetail.rest")}</Text>
                <Text style={styles.timerValue}>
                  {formatTimer(restElapsed)}
                </Text>
                <View style={styles.timerTrack}>
                  <View
                    style={[
                      styles.timerFill,
                      {
                        width:
                          `${((REST_TARGET - restElapsed) / REST_TARGET) * 100}%` as any,
                      },
                    ]}
                  />
                </View>
                <TouchableOpacity
                  onPress={skipRestTimer}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name="play-skip-forward-outline"
                    size={18}
                    color={theme.foreground.gray}
                  />
                </TouchableOpacity>
              </View>
            )}

            {/* ── Exercise cards ─────────────────────────────────────────── */}
            {activeWorkout.exercises.length > 0 ? (
              activeWorkout.exercises.map(renderExercise)
            ) : (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconContainer}>
                  <Ionicons
                    name="fitness-outline"
                    size={64}
                    color={theme.foreground.gray}
                  />
                </View>
                <Text style={styles.emptyTitle}>{t("workout.getStarted")}</Text>
                <Text style={styles.emptySubtitle}>
                  {t("workout.addExerciseToStart")}
                </Text>
              </View>
            )}

            {/* ── Add Exercise ───────────────────────────────────────────── */}
            <TouchableOpacity
              style={styles.addExerciseButton}
              onPress={() => router.navigate("exercise-picker" as any)}
            >
              <Ionicons
                name="add-circle"
                size={24}
                color={theme.background.dark}
              />
              <Text style={styles.addExerciseButtonText}>{t("workout.addExercise")}</Text>
            </TouchableOpacity>
          </BottomSheetScrollView>
        </BottomSheet>

        {/* ── Save workout modal ─────────────────────────────────────────── */}
        <Modal
          transparent
          visible={saveModalVisible}
          animationType="fade"
          onRequestClose={() => setSaveModalVisible(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setSaveModalVisible(false)}
          >
            <View style={styles.saveModalContent}>
              <Text style={styles.saveModalTitle}>{t("workout.saveWorkout")}</Text>
              <TextInput
                style={styles.saveModalInput}
                value={tempWorkoutName}
                onChangeText={setTempWorkoutName}
                placeholder={t("workout.enterWorkoutName")}
                placeholderTextColor={theme.foreground.gray}
                selectTextOnFocus
                autoFocus
              />
              <View style={styles.saveModalButtons}>
                <TouchableOpacity
                  style={[styles.saveModalButton, styles.cancelButton]}
                  onPress={() => setSaveModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>{t("common.cancel")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveModalButton, styles.confirmButton]}
                  onPress={handleConfirmSave}
                >
                  <Text style={styles.confirmButtonText}>{t("common.save")}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        </Modal>

        {/* ── Exercise options modal ─────────────────────────────────────── */}
        <ExerciseMenu
          visible={menuExerciseId !== null}
          onClose={() => setMenuExerciseId(null)}
          onReorder={handleMenuReorder}
          onReplace={handleMenuReplace}
          onRemove={handleMenuRemove}
          theme={theme}
        />
      </>
    );
  },
);

ActiveWorkoutSheet.displayName = "ActiveWorkoutSheet";

// ─── Styles ───────────────────────────────────────────────────────────────────
const createStyles = (theme: Theme) =>
  StyleSheet.create({
    bottomSheetBackground: { backgroundColor: theme.background.dark },
    handleIndicator: { backgroundColor: theme.foreground.gray },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingTop: 4,
      paddingBottom: 16,
    },
    title: { fontSize: 24, fontWeight: "700", color: theme.foreground.white },
    headerButtons: { flexDirection: "row", gap: 4 },
    headerButton: { padding: 8 },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 40, gap: 16 },
    // Stats
    statsGrid: { flexDirection: "row", gap: 12 },
    statCard: {
      flex: 1,
      backgroundColor: theme.background.darker,
      borderRadius: 16,
      padding: 14,
      alignItems: "center",
      gap: 6,
    },
    statValue: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.foreground.white,
    },
    statLabel: {
      fontSize: 11,
      fontWeight: "600",
      color: theme.foreground.gray,
      textTransform: "uppercase",
    },
    // Timer banner
    timerBanner: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.background.darker,
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 10,
    },
    timerLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.foreground.white,
    },
    timerValue: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.primary.main,
      minWidth: 42,
    },
    timerTrack: {
      flex: 1,
      height: 4,
      backgroundColor: theme.background.dark,
      borderRadius: 2,
      overflow: "hidden",
    },
    timerFill: {
      height: "100%",
      backgroundColor: theme.primary.main,
      borderRadius: 2,
    },
    // Exercise card
    exerciseCard: {
      backgroundColor: theme.background.darker,
      borderRadius: 16,
      paddingVertical: 14,
      paddingHorizontal: 14,
      gap: 8,
    },
    exerciseHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      marginBottom: 4,
    },
    exerciseTitleBlock: { flex: 1, gap: 2 },
    exerciseName: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.foreground.white,
    },
    exerciseMuscles: { fontSize: 12, color: theme.foreground.gray },
    menuBtn: { padding: 4 },
    // Set header row
    setHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 2,
    },
    setHeaderLabel: {
      fontSize: 10,
      fontWeight: "700",
      color: theme.foreground.gray,
      textTransform: "uppercase",
    },
    setInputHeader: { width: 68, textAlign: "center" },
    // Set rows
    setRow: { flexDirection: "row", alignItems: "center", paddingVertical: 3 },
    setRowCompleted: { opacity: 0.55 },
    setNumberCell: { width: 30, alignItems: "center" },
    setNumberText: {
      fontSize: 14,
      fontWeight: "700",
      color: theme.foreground.gray,
      textAlign: "center",
      width: 30,
    },
    setPrevText: {
      flex: 1,
      fontSize: 13,
      color: theme.foreground.gray,
      textAlign: "center",
    },
    setInput: {
      width: 60,
      height: 36,
      borderRadius: 8,
      backgroundColor: theme.background.dark,
      color: theme.foreground.white,
      fontSize: 14,
      fontWeight: "600",
      textAlign: "center",
      marginHorizontal: 4,
    },
    setInputCompleted: { backgroundColor: theme.background.dark },
    setDoneBtn: { width: 36, alignItems: "center" },
    // Add set
    addSetBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 10,
      gap: 6,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.primary.main + "44",
      marginTop: 4,
    },
    addSetText: {
      fontSize: 13,
      fontWeight: "600",
      color: theme.primary.main,
    },
    // Empty state
    emptyState: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 48,
    },
    emptyIconContainer: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: theme.background.darker,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 20,
    },
    emptyTitle: {
      fontSize: 22,
      fontWeight: "700",
      color: theme.foreground.white,
      marginBottom: 8,
    },
    emptySubtitle: {
      fontSize: 15,
      color: theme.foreground.gray,
      textAlign: "center",
      paddingHorizontal: 32,
    },
    // Add exercise
    addExerciseButton: {
      backgroundColor: theme.primary.main,
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
    },
    addExerciseButtonText: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.background.dark,
    },
    // Save modal
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.6)",
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    saveModalContent: {
      backgroundColor: theme.background.darker,
      borderRadius: 16,
      padding: 24,
      width: "100%",
      maxWidth: 400,
      gap: 20,
    },
    saveModalTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: theme.foreground.white,
      textAlign: "center",
    },
    saveModalInput: {
      borderWidth: 1,
      borderColor: theme.primary.main,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: theme.foreground.white,
      backgroundColor: theme.background.dark,
    },
    saveModalButtons: {
      flexDirection: "row",
      gap: 12,
    },
    saveModalButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: "center",
    },
    cancelButton: {
      backgroundColor: theme.background.dark,
    },
    confirmButton: {
      backgroundColor: theme.primary.main,
    },
    cancelButtonText: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.foreground.gray,
    },
    confirmButtonText: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.foreground.white,
    },
  });

// ─── Menu styles ─────────────────────────────────────────────────────────────
const menuStyles = (theme: Theme) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.6)",
      justifyContent: "flex-end",
    },
    sheet: {
      backgroundColor: theme.background.darker,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingTop: 12,
      paddingBottom: 36,
      paddingHorizontal: 20,
    },
    handle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.foreground.gray,
      alignSelf: "center",
      marginBottom: 16,
      opacity: 0.4,
    },
    option: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 16,
      gap: 14,
    },
    optionText: {
      fontSize: 16,
      fontWeight: "500",
      color: theme.foreground.white,
    },
    divider: {
      height: 1,
      backgroundColor: theme.foreground.gray,
      opacity: 0.15,
    },
  });

export default ActiveWorkoutSheet;

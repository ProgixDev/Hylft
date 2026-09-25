import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { Text } from "../components/ui/ScaledText";
import { FONTS } from "../constants/fonts";
import { useI18n } from "../contexts/I18nContext";
import { useTheme } from "../contexts/ThemeContext";
import {
  BodyMeasurements,
  type MeasurementEntry,
} from "../services/bodyMeasurements";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type Metric = {
  id: string;
  fr: string;
  en: string;
  icon: keyof typeof Ionicons.glyphMap;
  unit: "kg" | "cm";
};

const METRICS: Record<string, Metric> = {
  body_fat: { id: "body_fat", fr: "Masse grasse", en: "Body fat", icon: "water-outline", unit: "kg" },
  muscle_mass: { id: "muscle_mass", fr: "Masse musculaire", en: "Muscle mass", icon: "barbell-outline", unit: "kg" },
  waist: { id: "waist", fr: "Tour de taille", en: "Waist", icon: "resize-outline", unit: "cm" },
  hips: { id: "hips", fr: "Tour de hanches", en: "Hips", icon: "resize-outline", unit: "cm" },
  chest: { id: "chest", fr: "Tour de poitrine", en: "Chest", icon: "resize-outline", unit: "cm" },
  thigh: { id: "thigh", fr: "Tour de cuisse", en: "Thigh", icon: "resize-outline", unit: "cm" },
  arm: { id: "arm", fr: "Tour de bras", en: "Arm", icon: "resize-outline", unit: "cm" },
};

function formatDate(dateStr: string, isFr: boolean): string {
  const d = new Date(dateStr + "T00:00:00");
  const day = d.getDate();
  const months = isFr
    ? ["jan", "fév", "mar", "avr", "mai", "jun", "jul", "aoû", "sep", "oct", "nov", "déc"]
    : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${day} ${months[d.getMonth()]}`;
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

export default function BodyMeasurementDetail() {
  const router = useRouter();
  const { theme } = useTheme();
  const { language } = useI18n();
  const isFr = language.startsWith("fr");
  const { metric: metricId } = useLocalSearchParams<{ metric: string }>();

  const metric = METRICS[metricId ?? ""] ?? METRICS.waist;

  const [entries, setEntries] = useState<MeasurementEntry[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [input, setInput] = useState("");

  const loadData = useCallback(async () => {
    const data = await BodyMeasurements.getByMetric(metric.id);
    setEntries(data);
  }, [metric.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const latestValue = entries.length > 0 ? entries[entries.length - 1].value : null;

  // Chart data
  const chartData = useMemo(() => {
    return entries.map((e) => ({
      value: e.value,
      label: formatShortDate(e.date),
    }));
  }, [entries]);

  const chartBounds = useMemo(() => {
    const values = chartData.map((p) => p.value);
    if (values.length === 0) return { min: 0, max: 100 };
    const lo = Math.min(...values);
    const hi = Math.max(...values);
    const pad = Math.max(1, (hi - lo) * 0.4);
    return { min: Math.floor(lo - pad), max: Math.ceil(hi + pad) };
  }, [chartData]);

  // Delta from first to last
  const delta = useMemo(() => {
    if (entries.length < 2) return null;
    const diff = entries[entries.length - 1].value - entries[0].value;
    return Math.round(diff * 10) / 10;
  }, [entries]);

  const saveEntry = async () => {
    const value = Number(input.replace(",", "."));
    if (!Number.isFinite(value) || value <= 0) return;
    await BodyMeasurements.log(metric.id, value);
    await loadData();
    setInput("");
    setModalVisible(false);
  };

  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="arrow-back" size={26} color={theme.foreground.white} />
        </Pressable>
        <Text style={styles.title}>{isFr ? metric.fr : metric.en}</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Current value card */}
        <View style={styles.valueCard}>
          <View style={styles.valueRow}>
            <View>
              {latestValue !== null ? (
                <Text style={styles.bigValue}>
                  {latestValue} <Text style={styles.unitText}>{metric.unit}</Text>
                </Text>
              ) : (
                <Text style={styles.noData}>
                  {isFr ? "Aucune donnée" : "No data"}
                </Text>
              )}
            </View>
            {delta !== null && (
              <View style={[styles.deltaBadge, {
                backgroundColor: delta <= 0 ? "#34C75920" : "#ED666520",
              }]}>
                <Ionicons
                  name={delta <= 0 ? "trending-down" : "trending-up"}
                  size={14}
                  color={delta <= 0 ? "#34C759" : "#ED6665"}
                />
                <Text style={[styles.deltaText, {
                  color: delta <= 0 ? "#34C759" : "#ED6665",
                }]}>
                  {delta > 0 ? "+" : ""}{delta} {metric.unit}
                </Text>
              </View>
            )}
          </View>

          {/* Chart */}
          {chartData.length >= 2 ? (
            <View style={styles.chartWrap}>
              <LineChart
                data={chartData}
                color={theme.primary.main}
                thickness={2.5}
                noOfSections={4}
                yAxisThickness={0}
                xAxisThickness={0}
                xAxisLabelTextStyle={{
                  color: theme.foreground.gray,
                  fontSize: 9,
                  fontFamily: FONTS.semiBold,
                }}
                yAxisTextStyle={{ color: theme.foreground.gray, fontSize: 9 }}
                yAxisOffset={chartBounds.min}
                maxValue={chartBounds.max - chartBounds.min}
                stepValue={(chartBounds.max - chartBounds.min) / 4}
                hideRules
                curved={chartData.length > 2}
                isAnimated
                height={160}
                width={SCREEN_WIDTH - 80}
                spacing={
                  (SCREEN_WIDTH - 100) / Math.max(chartData.length - 1, 1)
                }
                initialSpacing={10}
                endSpacing={10}
                dataPointsColor={theme.primary.main}
                dataPointsRadius={4}
                textColor={theme.foreground.white}
                textShiftY={-6}
                textFontSize={10}
                startFillColor={`${theme.primary.main}30`}
                endFillColor={`${theme.primary.main}05`}
                startOpacity={0.6}
                endOpacity={0.05}
                areaChart
              />
            </View>
          ) : chartData.length === 1 ? (
            <View style={[styles.chartWrap, styles.chartEmpty]}>
              <Text style={styles.chartHint}>
                {isFr
                  ? "Ajoutez plus de mesures pour voir l'évolution"
                  : "Add more measurements to see the chart"}
              </Text>
            </View>
          ) : null}
        </View>

        {/* History */}
        {entries.length > 0 && (
          <View style={styles.historySection}>
            <Text style={styles.sectionTitle}>
              {isFr ? "Historique" : "History"}
            </Text>
            {[...entries].reverse().map((entry, i) => (
              <View key={`${entry.date}-${i}`} style={styles.historyRow}>
                <View style={styles.historyDot} />
                <View style={styles.historyContent}>
                  <Text style={styles.historyValue}>
                    {entry.value} {metric.unit}
                  </Text>
                  <Text style={styles.historyDate}>
                    {formatDate(entry.date, isFr)}
                  </Text>
                </View>
                {i < entries.length - 1 && (
                  <Text style={styles.historyDelta}>
                    {(() => {
                      const prev = [...entries].reverse()[i + 1];
                      if (!prev) return "";
                      const d = Math.round((entry.value - prev.value) * 10) / 10;
                      if (d === 0) return "=";
                      return d > 0 ? `+${d}` : `${d}`;
                    })()}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      <Pressable
        style={({ pressed }) => [styles.fab, pressed && { opacity: 0.85, transform: [{ scale: 0.95 }] }]}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>

      {/* Input modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => { setModalVisible(false); setInput(""); }}>
        <Pressable style={styles.backdrop} onPress={() => { setModalVisible(false); setInput(""); }}>
          <Pressable style={styles.modal} onPress={() => {}}>
            {/* Handle */}
            <View style={styles.modalHandle} />

            {/* Header with close */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isFr ? "Nouvelle mesure" : "New measurement"}
              </Text>
              <Pressable
                style={({ pressed }) => [styles.modalCloseBtn, pressed && { opacity: 0.7 }]}
                onPress={() => { setModalVisible(false); setInput(""); }}
                hitSlop={8}
              >
                <Ionicons name="close" size={20} color={theme.foreground.white} />
              </Pressable>
            </View>

            <Text style={styles.modalHint}>
              {isFr ? metric.fr : metric.en} ({metric.unit})
            </Text>

            {/* Input with unit */}
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={input}
                onChangeText={setInput}
                keyboardType="decimal-pad"
                autoFocus
                placeholder={latestValue?.toString() ?? "0.0"}
                placeholderTextColor={theme.foreground.gray + "60"}
              />
              <Text style={styles.inputUnit}>{metric.unit}</Text>
            </View>

            {/* Buttons */}
            <View style={styles.modalButtons}>
              <Pressable
                style={({ pressed }) => [styles.cancelButton, pressed && { opacity: 0.7 }]}
                onPress={() => { setModalVisible(false); setInput(""); }}
              >
                <Text style={styles.cancelText}>{isFr ? "Annuler" : "Cancel"}</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.saveButton, pressed && { opacity: 0.85 }]}
                onPress={() => void saveEntry()}
              >
                <Text style={styles.saveText}>{isFr ? "Enregistrer" : "Save"}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>["theme"]) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background.dark },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingTop: 22,
      paddingBottom: 18,
      paddingHorizontal: 20,
    },
    title: { fontFamily: FONTS.bold, fontSize: 22, color: theme.foreground.white },

    // Value card
    valueCard: {
      marginHorizontal: 16,
      backgroundColor: theme.background.darker,
      borderRadius: 20,
      padding: 20,
      marginBottom: 20,
    },
    valueRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 16,
    },
    bigValue: {
      fontFamily: FONTS.bold,
      fontSize: 36,
      color: theme.foreground.white,
    },
    unitText: {
      fontFamily: FONTS.semiBold,
      fontSize: 18,
      color: theme.foreground.gray,
    },
    noData: {
      fontFamily: FONTS.regular,
      fontSize: 18,
      color: theme.foreground.gray,
    },
    deltaBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 10,
    },
    deltaText: {
      fontFamily: FONTS.semiBold,
      fontSize: 13,
    },

    // Chart
    chartWrap: {
      marginTop: 4,
      borderRadius: 14,
      overflow: "hidden",
    },
    chartEmpty: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 24,
    },
    chartHint: {
      fontFamily: FONTS.regular,
      fontSize: 12,
      color: theme.foreground.gray,
      textAlign: "center",
    },

    // History
    historySection: {
      paddingHorizontal: 20,
    },
    sectionTitle: {
      fontFamily: FONTS.bold,
      fontSize: 18,
      color: theme.foreground.white,
      marginBottom: 14,
    },
    historyRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: theme.foreground.gray + "20",
      gap: 12,
    },
    historyDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.primary.main,
    },
    historyContent: {
      flex: 1,
    },
    historyValue: {
      fontFamily: FONTS.semiBold,
      fontSize: 16,
      color: theme.foreground.white,
    },
    historyDate: {
      fontFamily: FONTS.regular,
      fontSize: 12,
      color: theme.foreground.gray,
      marginTop: 2,
    },
    historyDelta: {
      fontFamily: FONTS.semiBold,
      fontSize: 13,
      color: theme.foreground.gray,
    },

    // FAB
    fab: {
      position: "absolute",
      bottom: 30,
      right: 20,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.primary.main,
      alignItems: "center",
      justifyContent: "center",
      elevation: 6,
      shadowColor: "#000",
      shadowOpacity: 0.3,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
    },

    // Modal
    backdrop: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: "rgba(0,0,0,0.55)",
    },
    modal: {
      width: "100%",
      backgroundColor: theme.background.darker,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 22,
      paddingBottom: 34,
      paddingTop: 8,
    },
    modalHandle: {
      alignSelf: "center",
      width: 42,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.foreground.gray,
      opacity: 0.4,
      marginBottom: 16,
    },
    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 4,
    },
    modalCloseBtn: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: theme.background.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    modalTitle: { fontFamily: FONTS.bold, fontSize: 20, color: theme.foreground.white },
    modalHint: {
      fontFamily: FONTS.regular,
      fontSize: 13,
      color: theme.foreground.gray,
      marginTop: 2,
      marginBottom: 16,
    },
    inputRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.background.accent,
      borderRadius: 14,
      paddingRight: 16,
    },
    input: {
      flex: 1,
      borderRadius: 14,
      color: theme.foreground.white,
      fontFamily: FONTS.bold,
      fontSize: 28,
      padding: 16,
    },
    inputUnit: {
      fontFamily: FONTS.semiBold,
      fontSize: 18,
      color: theme.foreground.gray,
    },
    modalButtons: {
      flexDirection: "row",
      gap: 12,
      marginTop: 18,
    },
    cancelButton: {
      flex: 1,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: "center",
      backgroundColor: theme.background.accent,
    },
    cancelText: { fontFamily: FONTS.semiBold, fontSize: 16, color: theme.foreground.white },
    saveButton: {
      flex: 1,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: "center",
      backgroundColor: theme.primary.main,
    },
    saveText: { fontFamily: FONTS.bold, fontSize: 16, color: "#fff" },
  });
}

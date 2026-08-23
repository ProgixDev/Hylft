import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, TextInput, View } from "react-native";
import { Text } from "../components/ui/ScaledText";
import { FONTS } from "../constants/fonts";
import { useI18n } from "../contexts/I18nContext";
import { useTheme } from "../contexts/ThemeContext";

type Metric = {
  id: string;
  fr: string;
  en: string;
  icon: keyof typeof Ionicons.glyphMap;
};

type Entry = { value: number; date: string };

const METRICS: Metric[] = [
  { id: "body_fat", fr: "Masse grasse", en: "Body fat", icon: "water-outline" },
  { id: "muscle_mass", fr: "Masse musculaire", en: "Muscle mass", icon: "barbell-outline" },
  { id: "waist", fr: "Tour de taille", en: "Waist", icon: "resize-outline" },
  { id: "hips", fr: "Tour de hanches", en: "Hips", icon: "resize-outline" },
  { id: "chest", fr: "Tour de poitrine", en: "Chest", icon: "resize-outline" },
  { id: "thigh", fr: "Tour de cuisse", en: "Thigh", icon: "resize-outline" },
  { id: "arm", fr: "Tour de bras", en: "Arm", icon: "resize-outline" },
];

const STORAGE_KEY = "@hylift_body_measurements";

export default function BodyMeasurements() {
  const router = useRouter();
  const { theme } = useTheme();
  const { language } = useI18n();
  const isFr = language.startsWith("fr");
  const [entries, setEntries] = useState<Record<string, Entry[]>>({});
  const [selected, setSelected] = useState<Metric | null>(null);
  const [input, setInput] = useState("");

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((value) => {
      if (!value) return;
      try {
        setEntries(JSON.parse(value) as Record<string, Entry[]>);
      } catch {
        // Ignore malformed local cache.
      }
    });
  }, []);

  const saveEntry = async () => {
    if (!selected) return;
    const value = Number(input.replace(",", "."));
    if (!Number.isFinite(value) || value <= 0) return;
    const next = {
      ...entries,
      [selected.id]: [
        ...(entries[selected.id] ?? []),
        { value, date: new Date().toISOString() },
      ],
    };
    setEntries(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setInput("");
    setSelected(null);
  };

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="arrow-back" size={26} color={theme.foreground.white} />
        </Pressable>
        <Text style={styles.title}>
          {isFr ? "Données corporelles" : "Body measurements"}
        </Text>
        <View style={{ width: 26 }} />
      </View>

      <Text style={styles.subtitle}>
        {isFr
          ? "Ajoutez vos mesures pour suivre votre évolution au fil du temps."
          : "Add your measurements to track your progress over time."}
      </Text>

      <View style={styles.list}>
        {METRICS.map((metric) => {
          const latest = entries[metric.id]?.at(-1);
          return (
            <Pressable
              key={metric.id}
              style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
              onPress={() => setSelected(metric)}
            >
              <Ionicons name={metric.icon} size={25} color={theme.foreground.white} />
              <View style={styles.rowText}>
                <Text style={styles.metricName}>{isFr ? metric.fr : metric.en}</Text>
                {latest && (
                  <Text style={styles.latest}>
                    {latest.value} cm · {isFr ? "Dernière mesure" : "Last measurement"}
                  </Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={22} color={theme.foreground.gray} />
            </Pressable>
          );
        })}
      </View>

      <Modal visible={!!selected} transparent animationType="fade" onRequestClose={() => setSelected(null)}>
        <Pressable style={styles.backdrop} onPress={() => setSelected(null)}>
          <Pressable style={styles.modal} onPress={() => {}}>
            <Text style={styles.modalTitle}>{selected && (isFr ? selected.fr : selected.en)}</Text>
            <Text style={styles.modalHint}>{isFr ? "Valeur en cm" : "Value in cm"}</Text>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              keyboardType="decimal-pad"
              autoFocus
              placeholder="0.0"
              placeholderTextColor={theme.foreground.gray}
            />
            <Pressable style={styles.saveButton} onPress={() => void saveEntry()}>
              <Text style={styles.saveText}>{isFr ? "Enregistrer" : "Save"}</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>["theme"]) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background.dark, paddingHorizontal: 20 },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 22, paddingBottom: 18 },
    title: { fontFamily: FONTS.bold, fontSize: 22, color: theme.foreground.white },
    subtitle: { fontFamily: FONTS.regular, fontSize: 15, lineHeight: 22, color: theme.foreground.gray, marginBottom: 20 },
    list: { borderTopWidth: 1, borderTopColor: theme.foreground.gray + "55" },
    row: { minHeight: 72, flexDirection: "row", alignItems: "center", gap: 15, borderBottomWidth: 1, borderBottomColor: theme.foreground.gray + "55" },
    rowText: { flex: 1 },
    metricName: { fontFamily: FONTS.semiBold, fontSize: 17, color: theme.foreground.white },
    latest: { fontFamily: FONTS.regular, fontSize: 12, color: theme.foreground.gray, marginTop: 4 },
    backdrop: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.55)" },
    modal: { width: "86%", backgroundColor: theme.background.darker, borderRadius: 18, padding: 22 },
    modalTitle: { fontFamily: FONTS.bold, fontSize: 20, color: theme.foreground.white },
    modalHint: { fontFamily: FONTS.regular, fontSize: 13, color: theme.foreground.gray, marginTop: 5 },
    input: { marginTop: 16, borderRadius: 12, backgroundColor: theme.background.accent, color: theme.foreground.white, fontFamily: FONTS.semiBold, fontSize: 20, padding: 14 },
    saveButton: { marginTop: 16, borderRadius: 12, paddingVertical: 14, alignItems: "center", backgroundColor: theme.primary.main },
    saveText: { fontFamily: FONTS.bold, fontSize: 16, color: "#fff" },
  });
}

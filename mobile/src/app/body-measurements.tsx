import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "../components/ui/ScaledText";
import { FONTS } from "../constants/fonts";
import { useI18n } from "../contexts/I18nContext";
import { useTheme } from "../contexts/ThemeContext";
import { BodyMeasurements as BodyMeasurementsService } from "../services/bodyMeasurements";

type Metric = {
  id: string;
  fr: string;
  en: string;
  icon: keyof typeof Ionicons.glyphMap;
  unit: "kg" | "cm";
};

type Entry = { value: number; date: string };

const METRICS: Metric[] = [
  { id: "body_fat", fr: "Masse grasse", en: "Body fat", icon: "water-outline", unit: "kg" },
  { id: "muscle_mass", fr: "Masse musculaire", en: "Muscle mass", icon: "barbell-outline", unit: "kg" },
  { id: "waist", fr: "Tour de taille", en: "Waist", icon: "resize-outline", unit: "cm" },
  { id: "hips", fr: "Tour de hanches", en: "Hips", icon: "resize-outline", unit: "cm" },
  { id: "chest", fr: "Tour de poitrine", en: "Chest", icon: "resize-outline", unit: "cm" },
  { id: "thigh", fr: "Tour de cuisse", en: "Thigh", icon: "resize-outline", unit: "cm" },
  { id: "arm", fr: "Tour de bras", en: "Arm", icon: "resize-outline", unit: "cm" },
];

export default function BodyMeasurements() {
  const router = useRouter();
  const { theme } = useTheme();
  const { language } = useI18n();
  const isFr = language.startsWith("fr");
  const [entries, setEntries] = useState<Record<string, Entry[]>>({});

  useFocusEffect(
    useCallback(() => {
      BodyMeasurementsService.migrateFromAsyncStorage();
      BodyMeasurementsService.getAll().then(setEntries).catch(() => {});
    }, []),
  );

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
              onPress={() => router.push(`/body-measurement-detail?metric=${metric.id}`)}
            >
              <Ionicons name={metric.icon} size={25} color={theme.foreground.white} />
              <View style={styles.rowText}>
                <Text style={styles.metricName}>{isFr ? metric.fr : metric.en}</Text>
                {latest && (
                  <Text style={styles.latest}>
                    {latest.value} {metric.unit} · {latest.date.split("-").reverse().join("/")}
                  </Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={22} color={theme.foreground.gray} />
            </Pressable>
          );
        })}
      </View>
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
  });
}

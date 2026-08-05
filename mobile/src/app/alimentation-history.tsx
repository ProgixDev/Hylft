import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { FONTS } from "../constants/fonts";
import { Theme } from "../constants/themes";
import { useNutrition } from "../contexts/NutritionContext";
import { useTheme } from "../contexts/ThemeContext";
import { api } from "../services/api";

interface HistoryDay {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  meals: any[];
  daily: {
    water_ml?: number;
    weight_kg?: number | null;
  };
}

const MONTHS_FR = [
  "janv.", "févr.", "mars", "avr.", "mai", "juin",
  "juil.", "août", "sept.", "oct.", "nov.", "déc.",
];
const MONTHS_EN = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function formatDate(iso: string, isFr: boolean): string {
  const [y, m, d] = iso.split("-").map(Number);
  const months = isFr ? MONTHS_FR : MONTHS_EN;
  return `${d} ${months[(m || 1) - 1]} ${y}`;
}

function shiftISODate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

export default function AlimentationHistory() {
  const router = useRouter();
  const { theme } = useTheme();
  const { i18n } = useTranslation();
  const isFr = i18n.language?.startsWith("fr");
  const { goals, selectDate } = useNutrition();
  const styles = createStyles(theme);

  const [days, setDays] = useState<HistoryDay[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const end = shiftISODate(0);
        const start = shiftISODate(-29);
        const data = await api.getAlimentationHistory(start, end);
        setDays(Array.isArray(data) ? data : []);
      } catch (error) {
        console.warn("[AlimentationHistory] load failed:", error);
        setDays([]);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const handleOpenDay = (date: string) => {
    selectDate(date);
    router.back();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.foreground.white} />
        </Pressable>
        <Text style={styles.title}>{isFr ? "Historique" : "History"}</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={theme.primary.main} size="large" />
        </View>
      ) : days.length === 0 ? (
        <View style={styles.centerState}>
          <Ionicons name="calendar-outline" size={48} color={theme.foreground.gray} />
          <Text style={styles.emptyText}>{isFr ? "Aucune donnée" : "No data yet"}</Text>
          <Text style={styles.emptySubtext}>
            {isFr ? "Commencez à logger vos repas pour voir l'historique." : "Start logging meals to build your history."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={days}
          keyExtractor={(item) => item.date}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const pct = goals.calorieGoal > 0
              ? Math.min(item.calories / goals.calorieGoal, 1)
              : 0;
            return (
              <Pressable style={styles.dayCard} onPress={() => handleOpenDay(item.date)}>
                <View style={styles.dayHeaderRow}>
                  <Text style={styles.dayDate}>{formatDate(item.date, !!isFr)}</Text>
                  <Ionicons name="chevron-forward" size={18} color={theme.foreground.gray} />
                </View>

                <View style={styles.caloriesRow}>
                  <Text style={styles.caloriesNum}>{Math.round(item.calories)}</Text>
                  <Text style={styles.caloriesLabel}>
                    / {goals.calorieGoal} kcal
                  </Text>
                </View>

                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${pct * 100}%`, backgroundColor: theme.primary.main }]} />
                </View>

                <View style={styles.metaRow}>
                  <Text style={styles.metaItem}>
                    <Ionicons name="restaurant-outline" size={12} color={theme.foreground.gray} />{" "}
                    {item.meals?.length ?? 0} {isFr ? "repas" : "meals"}
                  </Text>
                  {item.daily?.water_ml ? (
                    <Text style={styles.metaItem}>
                      <Ionicons name="water-outline" size={12} color="#4A90D9" />{" "}
                      {(item.daily.water_ml / 1000).toFixed(1)} L
                    </Text>
                  ) : null}
                  {item.daily?.weight_kg != null ? (
                    <Text style={styles.metaItem}>
                      <Ionicons name="scale-outline" size={12} color={theme.foreground.gray} />{" "}
                      {Number(item.daily.weight_kg).toFixed(1)} kg
                    </Text>
                  ) : null}
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background.dark },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: theme.background.accent,
    },
    backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
    title: { fontFamily: FONTS.bold, fontSize: 18, color: theme.foreground.white },
    listContent: { padding: 16, gap: 10, paddingBottom: 32 },
    centerState: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 32,
      gap: 8,
    },
    emptyText: {
      fontFamily: FONTS.semiBold,
      fontSize: 16,
      color: theme.foreground.white,
      marginTop: 12,
    },
    emptySubtext: {
      fontFamily: FONTS.regular,
      fontSize: 13,
      color: theme.foreground.gray,
      textAlign: "center",
    },
    dayCard: {
      backgroundColor: theme.background.darker,
      borderRadius: 14,
      padding: 14,
      gap: 8,
    },
    dayHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    dayDate: {
      fontFamily: FONTS.bold,
      fontSize: 14,
      color: theme.foreground.white,
      textTransform: "capitalize",
    },
    caloriesRow: { flexDirection: "row", alignItems: "baseline", gap: 4 },
    caloriesNum: {
      fontFamily: FONTS.extraBold,
      fontSize: 22,
      color: theme.primary.main,
    },
    caloriesLabel: {
      fontFamily: FONTS.regular,
      fontSize: 12,
      color: theme.foreground.gray,
    },
    progressBar: {
      height: 6,
      borderRadius: 3,
      backgroundColor: `${theme.foreground.gray}20`,
      overflow: "hidden",
    },
    progressFill: { height: "100%", borderRadius: 3 },
    metaRow: { flexDirection: "row", gap: 14, marginTop: 4 },
    metaItem: {
      fontFamily: FONTS.regular,
      fontSize: 11,
      color: theme.foreground.gray,
    },
  });
}

import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ChipButton from "../../components/ui/ChipButton";
import SignupProgress from "../../components/ui/SignupProgress";
import { FONTS } from "../../constants/fonts";
import { useTheme } from "../../contexts/ThemeContext";

const BG = "#FFFFFF";
const SURFACE = "#F6F8FA";
const BORDER = "#DDE3EA";

const HABITS: {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { id: "eat_balanced", icon: "nutrition-outline" },
  { id: "drink_water", icon: "water-outline" },
  { id: "sleep_well", icon: "moon-outline" },
  { id: "move_daily", icon: "walk-outline" },
  { id: "strength", icon: "barbell-outline" },
  { id: "reduce_stress", icon: "leaf-outline" },
  { id: "cut_sugar", icon: "ice-cream-outline" },
  { id: "track_progress", icon: "stats-chart-outline" },
  { id: "mindful_eating", icon: "happy-outline" },
];

export default function HabitsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string[]>([]);

  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(28)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 440,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slide, {
        toValue: 0,
        duration: 440,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleContinue = async () => {
    if (selected.length === 0) return;
    await AsyncStorage.setItem("@hylift_habits", JSON.stringify(selected));
    router.push("/get-started/habits-congrats");
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={{ flex: 1, opacity: fade, transform: [{ translateY: slide }] }}
      >
        <SignupProgress current={3} total={13} />

        <View style={styles.header}>
          <Text style={styles.title}>{t("onboarding.habits.title")}</Text>
          <Text style={styles.subtitle}>{t("onboarding.habits.subtitle")}</Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.grid}
        >
          {HABITS.map((h) => {
            const isSelected = selected.includes(h.id);
            return (
              <View key={h.id}>
                <TouchableOpacity
                  activeOpacity={0.72}
                  onPress={() => toggle(h.id)}
                  style={[
                    styles.tile,
                    {
                      borderColor: isSelected ? theme.primary.main : BORDER,
                      backgroundColor: isSelected
                        ? theme.primary.main + "10"
                        : SURFACE,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.tileIcon,
                      {
                        backgroundColor: isSelected
                          ? theme.primary.main + "18"
                          : "#FFFFFF",
                      },
                    ]}
                  >
                    <Ionicons
                      name={h.icon}
                      size={24}
                      color={isSelected ? theme.primary.main : "#64748B"}
                    />
                  </View>
                  <Text
                    style={[
                      styles.tileLabel,
                      {
                        color: isSelected ? theme.primary.main : "#111827",
                      },
                    ]}
                    numberOfLines={2}
                  >
                    {t(`onboarding.habits.options.${h.id}`)}
                  </Text>
                  {isSelected && (
                    <View
                      style={[
                        styles.tileCheck,
                        { backgroundColor: theme.primary.main },
                      ]}
                    >
                      <Ionicons name="checkmark" size={10} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>
      </Animated.View>

      <ChipButton
        title={t("common.continue")}
        onPress={handleContinue}
        variant="primary"
        size="lg"
        fullWidth
        disabled={selected.length === 0}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontFamily: FONTS.extraBold,
    color: "#111827",
    marginBottom: 6,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 14,
    color: "#64748B",
    lineHeight: 21,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    paddingBottom: 8,
  },
  tile: {
    width: "30%",
    minHeight: 100,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    position: "relative",
  },
  tileIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  tileLabel: {
    fontSize: 12,
    fontFamily: FONTS.semiBold,
    textAlign: "center",
    lineHeight: 16,
  },
  tileCheck: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
});

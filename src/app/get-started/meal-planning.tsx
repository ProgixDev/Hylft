import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ChipButton from "../../components/ui/ChipButton";
import SignupProgress from "../../components/ui/SignupProgress";
import { FONTS } from "../../constants/fonts";
import { useTheme } from "../../contexts/ThemeContext";

const SURFACE = "#F6F8FA";
const BORDER = "#DDE3EA";

const OPTIONS: {
  id: "never" | "rarely" | "occasionally" | "frequently" | "always";
  icon: keyof typeof Ionicons.glyphMap;
  bars: number;
}[] = [
  { id: "never", icon: "help-circle-outline", bars: 1 },
  { id: "rarely", icon: "time-outline", bars: 2 },
  { id: "occasionally", icon: "partly-sunny-outline", bars: 3 },
  { id: "frequently", icon: "calendar-outline", bars: 4 },
  { id: "always", icon: "checkmark-done-outline", bars: 5 },
];

export default function MealPlanningScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string>("");

  const handleSelect = (id: string) => {
    setSelected(id);
  };

  const handleContinue = async () => {
    if (!selected) return;
    await AsyncStorage.setItem("@hylift_meal_planning", selected);
    router.push("/get-started/meal-congrats");
  };

  return (
    <View style={s.container}>
      <View style={{ flex: 1 }}>
        <SignupProgress current={4} total={13} />

        <View style={s.header}>
          <Text style={s.title}>{t("onboarding.mealPlanning.title")}</Text>
          <Text style={s.subtitle}>
            {t("onboarding.mealPlanning.subtitle")}
          </Text>
        </View>

        <View style={s.list}>
          {OPTIONS.map((o) => {
            const isSelected = selected === o.id;
            return (
              <View key={o.id}>
                <TouchableOpacity
                  activeOpacity={0.72}
                  onPress={() => handleSelect(o.id)}
                  style={[
                    s.card,
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
                      s.iconWrap,
                      {
                        backgroundColor: isSelected
                          ? theme.primary.main + "18"
                          : "#FFFFFF",
                      },
                    ]}
                  >
                    <Ionicons
                      name={o.icon}
                      size={24}
                      color={isSelected ? theme.primary.main : "#64748B"}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        s.cardTitle,
                        {
                          color: isSelected ? theme.primary.main : "#111827",
                        },
                      ]}
                    >
                      {t(`onboarding.mealPlanning.options.${o.id}.label`)}
                    </Text>
                    <Text style={s.cardDesc}>
                      {t(`onboarding.mealPlanning.options.${o.id}.description`)}
                    </Text>

                    <View style={s.bars}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <View
                          key={i}
                          style={[
                            s.bar,
                            {
                              backgroundColor:
                                i < o.bars
                                  ? isSelected
                                    ? theme.primary.main
                                    : "#64748B80"
                                  : BORDER,
                              height: 4 + i * 2,
                            },
                          ]}
                        />
                      ))}
                    </View>
                  </View>

                  <View
                    style={[
                      s.check,
                      {
                        backgroundColor: isSelected
                          ? theme.primary.main
                          : "transparent",
                        borderColor: isSelected
                          ? theme.primary.main
                          : "#64748B",
                      },
                    ]}
                  >
                    {isSelected && (
                      <Ionicons name="checkmark" size={14} color="#fff" />
                    )}
                  </View>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </View>

      <ChipButton
        title={t("common.continue")}
        onPress={handleContinue}
        variant="primary"
        size="lg"
        fullWidth
        disabled={!selected}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
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
  list: {
    gap: 10,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: FONTS.bold,
    marginBottom: 3,
  },
  cardDesc: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 7,
    color: "#64748B",
  },
  bars: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 3,
  },
  bar: {
    width: 12,
    borderRadius: 2,
  },
  check: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
});

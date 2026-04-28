import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../contexts/ThemeContext";
import { FONTS } from "../../constants/fonts";
import ChipButton from "../../components/ui/ChipButton";
import SignupProgress from "../../components/ui/SignupProgress";

const BG = "#FFFFFF";
const SURFACE = "#F6F8FA";
const BORDER = "#DDE3EA";

interface MuscleGroup {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const MUSCLE_GROUPS: MuscleGroup[] = [
  { id: "full_body", icon: "flash-outline" },
  { id: "chest", icon: "fitness-outline" },
  { id: "back", icon: "body-outline" },
  { id: "arms", icon: "barbell-outline" },
  { id: "core", icon: "ellipse-outline" },
  { id: "legs", icon: "walk-outline" },
];

export default function FocusAreas() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((s) => s !== id)
        : prev.length < 5
          ? [...prev, id]
          : prev
    );
  };

  const handleContinue = async () => {
    if (selected.length === 0) return;
    await AsyncStorage.setItem("@hylift_focus_areas", JSON.stringify(selected));
    router.navigate("/get-started/health-connect");
  };

  return (
    <View style={s.container}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <SignupProgress current={10} total={13} />

        <Text style={s.title}>{t("onboarding.focusAreas.title")}</Text>
        <Text style={s.subtitle}>{t("onboarding.focusAreas.subtitle")}</Text>

        <View style={s.grid}>
          {MUSCLE_GROUPS.map((muscle) => {
            const isSelected = selected.includes(muscle.id);
            return (
              <View key={muscle.id}>
                <TouchableOpacity
                  style={[
                    s.chip,
                    {
                      borderColor: isSelected ? theme.primary.main : BORDER,
                      backgroundColor: isSelected
                        ? theme.primary.main + "10"
                        : SURFACE,
                    },
                  ]}
                  onPress={() => toggle(muscle.id)}
                  activeOpacity={0.72}
                >
                  <View
                    style={[
                      s.chipIcon,
                      {
                        backgroundColor: isSelected
                          ? theme.primary.main + "18"
                          : "#FFFFFF",
                      },
                    ]}
                  >
                    <Ionicons
                      name={muscle.icon}
                      size={20}
                      color={isSelected ? theme.primary.main : "#64748B"}
                    />
                  </View>
                  <Text
                    style={[
                      s.chipLabel,
                      {
                        color: isSelected ? theme.primary.main : "#111827",
                      },
                    ]}
                  >
                    {t(`onboarding.focusAreas.muscles.${muscle.id}`)}
                  </Text>
                  {isSelected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color={theme.primary.main}
                    />
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {selected.length > 0 && (
          <Text style={s.selectedCount}>
            {t("onboarding.focusAreas.selectedCount", {
              count: selected.length,
            })}
          </Text>
        )}

        {selected.length > 0 && (
          <View style={s.previewBox}>
            <Ionicons
              name="sparkles-outline"
              size={16}
              color={theme.primary.main}
            />
            <Text style={s.previewText}>
              {t("onboarding.focusAreas.previewPrefix")}{" "}
              <Text style={{ color: "#111827", fontFamily: FONTS.semiBold }}>
                {selected
                  .map((id) => t(`onboarding.focusAreas.muscles.${id}`))
                  .join(", ")}
              </Text>{" "}
              {t("onboarding.focusAreas.previewSuffix")}
            </Text>
          </View>
        )}
      </ScrollView>

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

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  title: {
    fontSize: 26,
    fontFamily: FONTS.extraBold,
    color: "#111827",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 20,
    lineHeight: 20,
  },
  grid: {
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  chipIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  chipLabel: {
    flex: 1,
    fontSize: 14,
    fontFamily: FONTS.semiBold,
  },
  selectedCount: {
    textAlign: "center",
    fontSize: 12,
    marginTop: 12,
    color: "#64748B",
  },
  previewBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
    backgroundColor: "#F6F8FA",
  },
  previewText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    color: "#64748B",
  },
});

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

interface GoalOption {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const GOAL_ICONS: GoalOption[] = [
  { id: "build_muscle", icon: "barbell-outline" },
  { id: "lose_fat", icon: "flame-outline" },
  { id: "get_stronger", icon: "trophy-outline" },
  { id: "stay_fit", icon: "heart-outline" },
  { id: "athletic", icon: "flash-outline" },
  { id: "body_recomp", icon: "body-outline" },
];

export default function FitnessGoal() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string[]>([]);

  const toggleGoal = (id: string) => {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((g) => g !== id)
        : prev.length < 3
          ? [...prev, id]
          : prev
    );
  };

  const handleContinue = async () => {
    if (selected.length === 0) return;
    await AsyncStorage.setItem("@hylift_fitness_goals", JSON.stringify(selected));
    router.navigate("/get-started/experience-level");
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <SignupProgress current={3} total={13} />

        <Text style={styles.title}>{t("onboarding.fitnessGoal.title")}</Text>
        <Text style={styles.subtitle}>{t("onboarding.fitnessGoal.subtitle")}</Text>

        <View style={styles.grid}>
          {GOAL_ICONS.map((goal) => {
            const isSelected = selected.includes(goal.id);
            return (
              <View key={goal.id}>
                <TouchableOpacity
                  style={[
                    styles.goalCard,
                    {
                      borderColor: isSelected ? theme.primary.main : BORDER,
                      backgroundColor: isSelected
                        ? theme.primary.main + "10"
                        : SURFACE,
                    },
                  ]}
                  onPress={() => toggleGoal(goal.id)}
                  activeOpacity={0.72}
                >
                  <View style={styles.goalCardContent}>
                    <View
                      style={[
                        styles.goalIcon,
                        {
                          backgroundColor: isSelected
                            ? theme.primary.main + "18"
                            : "#FFFFFF",
                        },
                      ]}
                    >
                      <Ionicons
                        name={goal.icon}
                        size={24}
                        color={isSelected ? theme.primary.main : "#64748B"}
                      />
                    </View>
                    <View style={styles.goalTextContainer}>
                      <Text
                        style={[
                          styles.goalLabel,
                          {
                            color: isSelected
                              ? theme.primary.main
                              : "#111827",
                          },
                        ]}
                      >
                        {t(`onboarding.fitnessGoal.goals.${goal.id}.label`)}
                      </Text>
                      <Text style={styles.goalDesc}>
                        {t(
                          `onboarding.fitnessGoal.goals.${goal.id}.description`
                        )}
                      </Text>
                    </View>
                    {isSelected && (
                      <View
                        style={[
                          styles.checkBadge,
                          { backgroundColor: theme.primary.main },
                        ]}
                      >
                        <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {selected.length > 0 && (
          <Text style={styles.selectedCount}>
            {t("onboarding.fitnessGoal.selectedCount", {
              count: selected.length,
            })}
          </Text>
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

const styles = StyleSheet.create({
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
    flexDirection: "column",
    gap: 10,
  },
  goalCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  goalCardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  goalTextContainer: {
    flex: 1,
  },
  goalIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  checkBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  goalLabel: {
    fontSize: 15,
    fontFamily: FONTS.bold,
    marginBottom: 3,
  },
  goalDesc: {
    fontSize: 12,
    lineHeight: 17,
    color: "#64748B",
  },
  selectedCount: {
    textAlign: "center",
    fontSize: 12,
    marginTop: 14,
    color: "#64748B",
  },
});

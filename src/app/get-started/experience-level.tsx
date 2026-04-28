import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
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

interface LevelOption {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const LEVELS: LevelOption[] = [
  { id: "beginner", icon: "leaf-outline" },
  { id: "intermediate", icon: "barbell-outline" },
  { id: "advanced", icon: "trophy-outline" },
  { id: "elite", icon: "diamond-outline" },
];

export default function ExperienceLevel() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string>("");

  const handleSelect = (id: string) => {
    setSelected(id);
  };

  const handleContinue = async () => {
    if (!selected) return;
    await AsyncStorage.setItem("@hylift_experience_level", selected);
    router.navigate("/get-started/age");
  };

  return (
    <View style={styles.container}>
      <View style={{ flex: 1 }}>
        <SignupProgress current={4} total={13} />

        <Text style={styles.title}>
          {t("onboarding.experienceLevel.title")}
        </Text>
        <Text style={styles.subtitle}>
          {t("onboarding.experienceLevel.subtitle")}
        </Text>

        <View style={styles.list}>
          {LEVELS.map((level) => {
            const isSelected = selected === level.id;
            return (
              <View key={level.id}>
                <TouchableOpacity
                  style={[
                    styles.levelCard,
                    {
                      borderColor: isSelected ? theme.primary.main : BORDER,
                      backgroundColor: isSelected
                        ? theme.primary.main + "10"
                        : SURFACE,
                    },
                  ]}
                  onPress={() => handleSelect(level.id)}
                  activeOpacity={0.72}
                >
                  <View style={styles.levelLeft}>
                    <View
                      style={[
                        styles.iconCircle,
                        {
                          backgroundColor: isSelected
                            ? theme.primary.main + "18"
                            : "#FFFFFF",
                        },
                      ]}
                    >
                      <Ionicons
                        name={level.icon}
                        size={20}
                        color={isSelected ? theme.primary.main : "#64748B"}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.labelRow}>
                        <Text
                          style={[
                            styles.levelLabel,
                            {
                              color: isSelected
                                ? theme.primary.main
                                : "#111827",
                            },
                          ]}
                        >
                          {t(
                            `onboarding.experienceLevel.levels.${level.id}.label`
                          )}
                        </Text>
                        <Text style={styles.timeframe}>
                          {t(
                            `onboarding.experienceLevel.levels.${level.id}.timeframe`
                          )}
                        </Text>
                      </View>
                      <Text style={styles.levelDesc} numberOfLines={2}>
                        {t(
                          `onboarding.experienceLevel.levels.${level.id}.description`
                        )}
                      </Text>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.radioOuter,
                      {
                        borderColor: isSelected
                          ? theme.primary.main
                          : "#64748B",
                      },
                    ]}
                  >
                    {isSelected && (
                      <View
                        style={[
                          styles.radioInner,
                          { backgroundColor: theme.primary.main },
                        ]}
                      />
                    )}
                  </View>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </View>

      <ChipButton
        threeD
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
    paddingHorizontal: 20,
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
  list: {
    gap: 10,
  },
  levelCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  levelLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  levelLabel: {
    fontSize: 15,
    fontFamily: FONTS.bold,
  },
  timeframe: {
    fontSize: 11,
    fontFamily: FONTS.medium,
    color: "#64748B",
  },
  levelDesc: {
    fontSize: 12,
    lineHeight: 18,
    color: "#64748B",
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});

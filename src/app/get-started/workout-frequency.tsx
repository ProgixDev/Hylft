import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
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

interface FreqOption {
  id: string;
  days: number;
  icon: keyof typeof Ionicons.glyphMap;
}

const FREQUENCIES: FreqOption[] = [
  { id: "1", days: 1, icon: "body-outline" },
  { id: "2", days: 2, icon: "walk-outline" },
  { id: "3", days: 3, icon: "fitness-outline" },
  { id: "4", days: 4, icon: "barbell-outline" },
  { id: "5", days: 5, icon: "flame-outline" },
  { id: "6", days: 6, icon: "flash-outline" },
  { id: "7", days: 7, icon: "skull-outline" },
];

export default function WorkoutFrequency() {
  const router = useRouter();
  const params = useLocalSearchParams<{ flow?: string }>();
  const isSignupFlow = params.flow === "signup";
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string>("");

  const handleSelect = (id: string) => {
    setSelected(id);
  };

  const handleContinue = async () => {
    if (!selected) return;
    await AsyncStorage.setItem("@hylift_workout_frequency", selected);
    if (isSignupFlow) {
      router.navigate("/get-started/health-connect?flow=signup");
    } else {
      router.navigate("/get-started/focus-areas");
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <SignupProgress current={9} total={13} />

        <Text style={styles.title}>
          {t("onboarding.workoutFrequency.title")}
        </Text>
        <Text style={styles.subtitle}>
          {t("onboarding.workoutFrequency.subtitle")}
        </Text>

        <View style={styles.list}>
          {FREQUENCIES.map((freq) => {
            const isSelected = selected === freq.id;
            return (
              <View key={freq.id}>
                <TouchableOpacity
                  style={[
                    styles.freqCard,
                    {
                      borderColor: isSelected ? theme.primary.main : BORDER,
                      backgroundColor: isSelected
                        ? theme.primary.main + "10"
                        : SURFACE,
                    },
                  ]}
                  onPress={() => handleSelect(freq.id)}
                  activeOpacity={0.72}
                >
                  <View
                    style={[
                      styles.daysBadge,
                      {
                        backgroundColor: isSelected
                          ? theme.primary.main
                          : BORDER,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.daysNum,
                        {
                          color: isSelected ? "#FFFFFF" : "#111827",
                        },
                      ]}
                    >
                      {freq.days}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.freqLabel,
                        {
                          color: isSelected ? theme.primary.main : "#111827",
                        },
                      ]}
                    >
                      {t(
                        `onboarding.workoutFrequency.options.${freq.id}.label`
                      )}
                    </Text>
                    <Text style={styles.freqDesc}>
                      {t(
                        `onboarding.workoutFrequency.options.${freq.id}.description`
                      )}
                    </Text>
                  </View>
                  <Ionicons
                    name={freq.icon}
                    size={20}
                    color={isSelected ? theme.primary.main : "#64748B"}
                  />
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </ScrollView>

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
  list: {
    gap: 10,
  },
  freqCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  daysBadge: {
    width: 38,
    height: 38,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  daysNum: {
    fontSize: 16,
    fontFamily: FONTS.extraBold,
  },
  freqLabel: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    marginBottom: 2,
  },
  freqDesc: {
    fontSize: 12,
    lineHeight: 17,
    color: "#64748B",
  },
});

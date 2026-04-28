import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { FONTS } from "../../constants/fonts";
import ChipButton from "../../components/ui/ChipButton";
import SignupProgress from "../../components/ui/SignupProgress";

type UnitOption = {
  label: string;
  value: string;
};

export default function UnitsSelection() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [selectedWeight, setSelectedWeight] = useState<string>("kg");
  const [selectedDistance, setSelectedDistance] = useState<string>("m");
  const [selectedHeight, setSelectedHeight] = useState<string>("cm");

  const weightOptions: UnitOption[] = [
    { label: t("onboarding.units.kilograms"), value: "kg" },
    { label: t("onboarding.units.pounds"), value: "lbs" },
  ];

  const distanceOptions: UnitOption[] = [
    { label: t("onboarding.units.meters"), value: "m" },
    { label: t("onboarding.units.miles"), value: "mi" },
  ];

  const heightOptions: UnitOption[] = [
    { label: t("onboarding.units.centimeters"), value: "cm" },
    { label: t("onboarding.units.inches"), value: "in" },
  ];

  const handleContinue = async () => {
    const unitSystem = selectedWeight === "kg" ? "metric" : "imperial";
    await AsyncStorage.setItem("@hylift_unit_system", unitSystem);
    router.navigate("/get-started/fitness-goal");
  };

  const renderOptionGroup = (
    title: string,
    options: UnitOption[],
    selected: string,
    onSelect: (value: string) => void
  ) => (
    <View style={s.optionGroup}>
      <Text style={s.optionTitle}>{title}</Text>
      <View style={s.optionsRow}>
        {options.map((option) => {
          const isSelected = selected === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              style={[
                s.optionButton,
                {
                  borderColor: isSelected ? theme.primary.main : "#DDE3EA",
                  backgroundColor: isSelected
                    ? theme.primary.main + "10"
                    : "#F6F8FA",
                },
              ]}
              onPress={() => onSelect(option.value)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  s.optionText,
                  { color: isSelected ? theme.primary.main : "#64748B" },
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  return (
    <View style={s.container}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <SignupProgress current={2} total={13} />

        <Text style={s.title}>{t("onboarding.units.title")}</Text>
        <Text style={s.subtitle}>{t("onboarding.units.subtitle")}</Text>

        <View style={s.optionsContainer}>
          {renderOptionGroup(
            t("onboarding.units.weight"),
            weightOptions,
            selectedWeight,
            setSelectedWeight
          )}
          {renderOptionGroup(
            t("onboarding.units.distance"),
            distanceOptions,
            selectedDistance,
            setSelectedDistance
          )}
          {renderOptionGroup(
            t("onboarding.units.height"),
            heightOptions,
            selectedHeight,
            setSelectedHeight
          )}
        </View>
      </ScrollView>

      <ChipButton
        threeD
        title={t("common.continue")}
        onPress={handleContinue}
        variant="primary"
        size="lg"
        fullWidth
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
  scrollContent: {
    paddingBottom: 16,
  },
  title: {
    fontSize: 26,
    fontFamily: FONTS.extraBold,
    color: "#111827",
    marginVertical: 6,
  },
  subtitle: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 20,
  },
  optionsContainer: {
    gap: 22,
  },
  optionGroup: {
    gap: 10,
  },
  optionTitle: {
    fontSize: 15,
    fontFamily: FONTS.semiBold,
    color: "#111827",
    marginBottom: 2,
  },
  optionsRow: {
    flexDirection: "row",
    gap: 12,
  },
  optionButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  optionText: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
  },
});

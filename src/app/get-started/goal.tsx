import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Animated,
  Easing,
  Image,
  ImageSourcePropType,
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

const GOALS: {
  id: "lose_weight" | "maintain" | "gain_weight" | "build_muscle";
  image: ImageSourcePropType;
  recommended?: boolean;
}[] = [
  {
    id: "lose_weight",
    image: require("../../../assets/weight__loss.gif"),
    recommended: true,
  },
  { id: "maintain", image: require("../../../assets/maintain_weight.gif") },
  { id: "gain_weight", image: require("../../../assets/weight_gain.gif") },
  { id: "build_muscle", image: require("../../../assets/muscle_gain.gif") },
];

export default function GoalScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string>("");

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

  const handleSelect = (id: string) => {
    setSelected(id);
  };

  const handleContinue = async () => {
    if (!selected) return;
    await AsyncStorage.setItem("@hylift_goal", selected);
    router.push("/get-started/goal-congrats");
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={{ flex: 1, opacity: fade, transform: [{ translateY: slide }] }}
      >
        <SignupProgress current={2} total={13} />

        <View style={styles.header}>
          <Text style={styles.title}>{t("onboarding.goalFlow.title")}</Text>
          <Text style={styles.subtitle}>
            {t("onboarding.goalFlow.subtitle")}
          </Text>
        </View>

        <View style={styles.list}>
          {GOALS.map((g) => {
            const isSelected = selected === g.id;
            return (
              <View key={g.id}>
                <TouchableOpacity
                  activeOpacity={0.72}
                  onPress={() => handleSelect(g.id)}
                  style={[
                    styles.card,
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
                      styles.iconWrap,
                      {
                        backgroundColor: isSelected
                          ? theme.primary.main + "18"
                          : "#FFFFFF",
                      },
                    ]}
                  >
                    <Image source={g.image} style={styles.goalImage} />
                  </View>

                  <View style={{ flex: 1 }}>
                    <View style={styles.labelRow}>
                      <Text
                        style={[
                          styles.cardTitle,
                          {
                            color: isSelected
                              ? theme.primary.main
                              : "#111827",
                          },
                        ]}
                      >
                        {t(
                          `onboarding.goalFlow.options.${g.id}.label`
                        )}
                      </Text>
                      {g.recommended && (
                        <View
                          style={[
                            styles.tag,
                            {
                              backgroundColor: theme.primary.main + "22",
                              borderColor: theme.primary.main + "55",
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.tagText,
                              { color: theme.primary.main },
                            ]}
                          >
                            {t("onboarding.goalFlow.popular")}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.cardDesc}>
                      {t(`onboarding.goalFlow.options.${g.id}.description`)}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.check,
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
      </Animated.View>

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
    padding: 16,
  },
  iconWrap: {
    width: 58,
    height: 58,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  goalImage: {
    width: 50,
    height: 50,
    resizeMode: "contain",
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: FONTS.bold,
  },
  tag: {
    borderWidth: 1,
    borderRadius: 100,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  tagText: {
    fontSize: 10,
    fontFamily: FONTS.bold,
    letterSpacing: 0.5,
  },
  cardDesc: {
    fontSize: 13,
    lineHeight: 18,
    color: "#64748B",
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
});

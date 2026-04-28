import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Animated,
  Easing,
  Image,
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

export default function GenderSelection() {
  const router = useRouter();
  const params = useLocalSearchParams<{ flow?: string }>();
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();
  const [selectedGender, setSelectedGender] = useState<string>("");
  const isSignupFlow = params.flow === "signup";

  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slide, {
        toValue: 0,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleSelectGender = (gender: "male" | "female") => {
    setSelectedGender(gender);
  };

  const handleContinue = async () => {
    if (!selectedGender) return;
    setTheme(selectedGender as "male" | "female");
    await AsyncStorage.setItem("@hylift_gender", selectedGender);
    if (isSignupFlow) {
      router.push("/get-started/age?flow=signup");
    } else {
      router.navigate("/get-started/units");
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={{
          flex: 1,
          opacity: fade,
          transform: [{ translateY: slide }],
        }}
      >
        <SignupProgress current={isSignupFlow ? 6 : 1} total={13} />

        <Text style={styles.title}>{t("onboarding.gender.title")}</Text>
        <Text style={styles.subtitle}>{t("onboarding.gender.subtitle")}</Text>

        <View style={styles.optionsContainer}>
          <View>
            <TouchableOpacity
              style={[
                styles.genderCard,
                selectedGender === "male" && {
                  borderColor: theme.primary.main,
                  borderWidth: 1.5,
                },
              ]}
              onPress={() => handleSelectGender("male")}
              activeOpacity={0.72}
            >
              <Image
                source={require("../../../assets/images/frameboy2.png")}
                style={styles.genderImage}
                resizeMode="cover"
              />
              {selectedGender === "male" && (
                <View
                  style={[
                    styles.selectedOverlay,
                    { backgroundColor: theme.primary.main + "14" },
                  ]}
                />
              )}
              <Text style={styles.genderText}>
                {t("onboarding.gender.male")}
              </Text>
            </TouchableOpacity>
          </View>

          <View>
            <TouchableOpacity
              style={[
                styles.genderCard,
                selectedGender === "female" && {
                  borderColor: theme.primary.main,
                  borderWidth: 1.5,
                },
              ]}
              onPress={() => handleSelectGender("female")}
              activeOpacity={0.72}
            >
              <Image
                source={require("../../../assets/images/framegirl2.png")}
                style={[styles.genderImage, { top: 0 }]}
                resizeMode="cover"
              />
              {selectedGender === "female" && (
                <View
                  style={[
                    styles.selectedOverlay,
                    { backgroundColor: theme.primary.main + "14" },
                  ]}
                />
              )}
              <Text style={styles.genderText}>
                {t("onboarding.gender.female")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      <ChipButton
        title={t("common.continue")}
        onPress={handleContinue}
        variant="primary"
        size="lg"
        fullWidth
        disabled={!selectedGender}
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
    fontFamily: FONTS.bold,
    color: "#111827",
    marginVertical: 6,
  },
  subtitle: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 28,
  },
  optionsContainer: {
    gap: 12,
  },
  genderCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DDE3EA",
    backgroundColor: "#F6F8FA",
    height: 196,
    overflow: "hidden",
  },
  genderImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  selectedOverlay: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  genderText: {
    fontSize: 17,
    fontFamily: FONTS.bold,
    color: "#ffffff",
    position: "absolute",
    bottom: 16,
    left: 16,
    zIndex: 1,
  },
});

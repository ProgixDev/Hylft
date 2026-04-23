import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import ChipButton from "../../components/ui/ChipButton";
import SignupProgress from "../../components/ui/SignupProgress";
import { FONTS } from "../../constants/fonts";
import { Theme } from "../../constants/themes";
import { useTheme } from "../../contexts/ThemeContext";

const TOTAL_STEPS = 13;

export default function UsernameScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(theme);
  const [username, setUsername] = useState("");
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    AsyncStorage.getItem("@hylift_username").then((v) => {
      if (v) setUsername(v);
    });
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
  }, [fade, slide]);

  const canContinue = username.trim().length >= 2;

  const handleContinue = async () => {
    if (!canContinue) return;
    await AsyncStorage.setItem("@hylift_username", username.trim());
    router.push("/get-started/goal");
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Animated.View
        style={{
          flex: 1,
          opacity: fade,
          transform: [{ translateY: slide }],
        }}
      >
        <SignupProgress current={1} total={TOTAL_STEPS} />

        <Text style={styles.title}>{t("onboarding.username.title")}</Text>
        <Text style={styles.subtitle}>{t("onboarding.username.subtitle")}</Text>

        <View style={styles.inputWrap}>
          <Text style={styles.label}>{t("onboarding.username.label")}</Text>
          <TextInput
            value={username}
            onChangeText={setUsername}
            placeholder={t("onboarding.username.placeholder")}
            placeholderTextColor={theme.foreground.gray}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={24}
            style={styles.input}
          />
          <Text style={styles.hint}>{t("onboarding.username.hint")}</Text>
        </View>
      </Animated.View>

      <ChipButton
        title={t("common.continue")}
        onPress={handleContinue}
        variant="primary"
        size="lg"
        fullWidth
        disabled={!canContinue}
      />
    </KeyboardAvoidingView>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background.dark,
      paddingHorizontal: 20,
      paddingBottom: 16,
    },
    title: {
      fontSize: 26,
      fontFamily: FONTS.bold,
      color: theme.foreground.white,
      marginBottom: 6,
    },
    subtitle: {
      fontSize: 14,
      color: theme.foreground.gray,
      lineHeight: 20,
      marginBottom: 28,
    },
    inputWrap: {
      marginTop: 12,
    },
    label: {
      fontSize: 13,
      fontFamily: FONTS.semiBold,
      color: theme.foreground.white,
      marginBottom: 8,
    },
    input: {
      backgroundColor: theme.background.darker,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 14,
      fontSize: 15,
      color: theme.foreground.white,
      borderWidth: 1.5,
      borderColor: theme.background.accent,
      fontFamily: FONTS.medium,
    },
    hint: {
      marginTop: 8,
      fontSize: 12,
      color: theme.foreground.gray,
    },
  });
}

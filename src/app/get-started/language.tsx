import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useI18n } from "../../contexts/I18nContext";
import { useTheme } from "../../contexts/ThemeContext";
import { FONTS } from "../../constants/fonts";
import { Theme } from "../../constants/themes";
import ChipButton from "../../components/ui/ChipButton";

interface LanguageOption {
  code: "en" | "fr";
  localLabel: string;
  flag: string;
}

const LANGUAGES: LanguageOption[] = [
  { code: "en", localLabel: "English", flag: "🇬🇧" },
  { code: "fr", localLabel: "Français", flag: "🇫🇷" },
];

export default function LanguageSelect() {
  const router = useRouter();
  const { theme } = useTheme();
  const { setLanguage } = useI18n();
  const styles = createStyles(theme);
  const [selected, setSelected] = useState<"en" | "fr" | null>(null);

  const handleContinue = async () => {
    if (!selected) return;
    await setLanguage(selected);
    router.navigate("/OnBoarding");
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image source={theme.logo} style={styles.logo} resizeMode="contain" />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Choose your language</Text>
        <Text style={styles.titleAlt}>Choisissez votre langue</Text>
        <Text style={styles.subtitle}>
          You can change this later in settings
        </Text>

        <View style={styles.list}>
          {LANGUAGES.map((lang) => {
            const isSelected = selected === lang.code;
            return (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.langCard,
                  {
                    borderColor: isSelected
                      ? theme.primary.main
                      : theme.background.accent,
                    backgroundColor: isSelected
                      ? theme.primary.main + "12"
                      : theme.background.darker,
                  },
                ]}
                onPress={() => setSelected(lang.code)}
                activeOpacity={0.7}
              >
                <Text style={styles.flag}>{lang.flag}</Text>
                <View style={styles.langTextContainer}>
                  <Text
                    style={[
                      styles.langLabel,
                      {
                        color: isSelected
                          ? theme.primary.main
                          : theme.foreground.white,
                      },
                    ]}
                  >
                    {lang.localLabel}
                  </Text>
                </View>
                <View
                  style={[
                    styles.radio,
                    {
                      borderColor: isSelected
                        ? theme.primary.main
                        : theme.foreground.gray,
                    },
                  ]}
                >
                  {isSelected && (
                    <View
                      style={[
                        styles.radioDot,
                        { backgroundColor: theme.primary.main },
                      ]}
                    />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <ChipButton
        title="Continue"
        onPress={handleContinue}
        variant="primary"
        size="lg"
        fullWidth
        disabled={!selected}
      />
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background.dark,
      paddingHorizontal: 24,
      paddingBottom: 20,
    },
    logoContainer: {
      alignItems: "center",
      paddingTop: 20,
      marginBottom: 40,
    },
    logo: {
      width: 120,
      height: 40,
    },
    content: {
      flex: 1,
    },
    title: {
      fontSize: 30,
      fontFamily: FONTS.bold,
      color: theme.foreground.white,
      marginBottom: 4,
    },
    titleAlt: {
      fontSize: 18,
      fontFamily: FONTS.medium,
      color: theme.foreground.gray,
      marginBottom: 12,
    },
    subtitle: {
      fontSize: 14,
      color: theme.foreground.gray,
      marginBottom: 32,
    },
    list: {
      gap: 14,
    },
    langCard: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1.5,
      borderRadius: 16,
      padding: 18,
      gap: 16,
    },
    flag: {
      fontSize: 32,
    },
    langTextContainer: {
      flex: 1,
    },
    langLabel: {
      fontSize: 18,
      fontFamily: FONTS.semiBold,
    },
    radio: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      alignItems: "center",
      justifyContent: "center",
    },
    radioDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
  });
}

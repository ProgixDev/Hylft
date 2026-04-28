import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
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
import { FONTS } from "../../constants/fonts";
import { Theme } from "../../constants/themes";
import { useI18n } from "../../contexts/I18nContext";
import { useTheme } from "../../contexts/ThemeContext";

interface LanguageOption {
  code: "en" | "fr";
  localLabel: string;
  flag: string;
}

const LANGUAGES: LanguageOption[] = [
  { code: "en", localLabel: "English", flag: "🇬🇧" },
  { code: "fr", localLabel: "Français", flag: "🇫🇷" },
];

const SELECTED_LANGUAGE_COLOR = "#06B6D4";
const SELECTED_LANGUAGE_BACKGROUND = "#ECFEFF";
const PAGE_EXIT_FADE_MS = 450;

export default function LanguageSelect() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const { setLanguage } = useI18n();
  const styles = createStyles(theme);
  const [selected, setSelected] = useState<"en" | "fr" | null>(null);
  const [isChangingLanguage, setIsChangingLanguage] = useState(false);
  const [isContinuing, setIsContinuing] = useState(false);
  const pageOpacity = useRef(new Animated.Value(1)).current;
  const copyTransition = useRef(new Animated.Value(1)).current;
  const selectionProgress = useRef<Record<"en" | "fr", Animated.Value>>({
    en: new Animated.Value(0),
    fr: new Animated.Value(0),
  }).current;

  const animatedCopyStyle = {
    opacity: copyTransition,
    transform: [
      {
        translateY: copyTransition.interpolate({
          inputRange: [0, 1],
          outputRange: [8, 0],
        }),
      },
    ],
  };

  const handleLanguagePress = async (language: "en" | "fr") => {
    if (isChangingLanguage) return;

    setSelected(language);
    LANGUAGES.forEach((lang) => {
      Animated.timing(selectionProgress[lang.code], {
        toValue: lang.code === language ? 1 : 0,
        duration: 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    });

    if (i18n.language?.startsWith(language)) {
      await setLanguage(language);
      return;
    }

    setIsChangingLanguage(true);

    Animated.timing(copyTransition, {
      toValue: 0,
      duration: 130,
      useNativeDriver: true,
    }).start(async () => {
      await setLanguage(language);
      Animated.timing(copyTransition, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }).start(() => setIsChangingLanguage(false));
    });
  };

  const handleContinue = async () => {
    if (!selected || isContinuing) return;

    setIsContinuing(true);
    Animated.timing(pageOpacity, {
      toValue: 0,
      duration: PAGE_EXIT_FADE_MS,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      router.replace("/onboarding" as any);
    });
  };

  return (
    <Animated.View style={[styles.container, { opacity: pageOpacity }]}>
      <View style={styles.logoContainer}>
        <Image source={theme.logo} style={styles.logo} resizeMode="contain" />
      </View>

      <View style={styles.content}>
        <Animated.View style={animatedCopyStyle}>
          <Text style={styles.title}>{t("languageSelect.title")}</Text>
          <Text style={styles.titleAlt}>
            {i18n.language?.startsWith("fr")
              ? "Choose your language"
              : "Choisissez votre langue"}
          </Text>
          <Text style={styles.subtitle}>{t("languageSelect.subtitle")}</Text>
        </Animated.View>

        <View style={styles.list}>
          {LANGUAGES.map((lang) => {
            const progress = selectionProgress[lang.code];
            const animatedCardStyle = {
              borderColor: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [theme.background.accent, SELECTED_LANGUAGE_COLOR],
              }),
              backgroundColor: progress.interpolate({
                inputRange: [0, 1],
                outputRange: ["#F6F8FA", SELECTED_LANGUAGE_BACKGROUND],
              }),
              transform: [
                {
                  scale: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.015],
                  }),
                },
              ],
            };
            const animatedLabelStyle = {
              color: progress.interpolate({
                inputRange: [0, 1],
                outputRange: ["#111827", SELECTED_LANGUAGE_COLOR],
              }),
            };
            const animatedRadioStyle = {
              borderColor: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [theme.foreground.gray, SELECTED_LANGUAGE_COLOR],
              }),
            };
            const animatedDotStyle = {
              opacity: progress,
              transform: [
                {
                  scale: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.45, 1],
                  }),
                },
              ],
            };

            return (
              <Animated.View
                key={lang.code}
                style={[styles.langCard, animatedCardStyle]}
              >
                <TouchableOpacity
                  style={styles.langCardContent}
                  onPress={() => void handleLanguagePress(lang.code)}
                  disabled={isChangingLanguage || isContinuing}
                  activeOpacity={0.72}
                >
                  <Text style={styles.flag}>{lang.flag}</Text>
                  <View style={styles.langTextContainer}>
                    <Animated.Text style={[styles.langLabel, animatedLabelStyle]}>
                      {lang.localLabel}
                    </Animated.Text>
                  </View>
                  <Animated.View style={[styles.radio, animatedRadioStyle]}>
                    <Animated.View
                      style={[
                        styles.radioDot,
                        { backgroundColor: SELECTED_LANGUAGE_COLOR },
                        animatedDotStyle,
                      ]}
                    />
                  </Animated.View>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>
      </View>

      <ChipButton
        title={t("languageSelect.continue")}
        onPress={handleContinue}
        variant="primary"
        size="lg"
        fullWidth
        disabled={!selected || isContinuing}
        borderRadius={16}
      />
    </Animated.View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#FFFFFF",
      paddingHorizontal: 20,
      paddingBottom: 16,
    },
    logoContainer: {
      alignItems: "center",
      paddingTop: 14,
      marginBottom: 24,
    },
    logo: {
      width: 200,
      height: 50,
    },
    content: {
      flex: 1,
    },
    title: {
      fontSize: 24,
      fontFamily: FONTS.bold,
      color: "#111827",
      marginBottom: 4,
    },
    titleAlt: {
      fontSize: 15,
      fontFamily: FONTS.medium,
      color: theme.foreground.gray,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 13,
      color: theme.foreground.gray,
      marginBottom: 22,
    },
    list: {
      gap: 10,
    },
    langCard: {
      borderWidth: 1,
      borderRadius: 12,
      overflow: "hidden",
    },
    langCardContent: {
      flexDirection: "row",
      alignItems: "center",
      padding: 14,
      gap: 12,
    },
    flag: {
      fontSize: 26,
    },
    langTextContainer: {
      flex: 1,
    },
    langLabel: {
      fontSize: 15,
      fontFamily: FONTS.semiBold,
    },
    radio: {
      width: 20,
      height: 20,
      borderRadius: 10,
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

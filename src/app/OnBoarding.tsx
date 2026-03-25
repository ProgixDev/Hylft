import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Dimensions,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";

import { FONTS } from "../constants/fonts";
import ChipButton from "../components/ui/ChipButton";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface OnboardingPage {
  id: number;
  image: any;
  title: string;
  subtitle: string;
  buttonText: string;
}

const getOnboardingData = (t: (key: string) => string): OnboardingPage[] => [
  {
    id: 1,
    image: require("../../assets/images/OnBoarding/ManLookingUp.jpg"),
    title: t("onboarding.page1Title"),
    subtitle: t("onboarding.page1Subtitle"),
    buttonText: t("onboarding.page1Button"),
  },
  {
    id: 2,
    image: require("../../assets/images/OnBoarding/ManWithOneWeights.jpg"),
    title: t("onboarding.page2Title"),
    subtitle: t("onboarding.page2Subtitle"),
    buttonText: t("onboarding.page2Button"),
  },
  {
    id: 3,
    image: require("../../assets/images/OnBoarding/ManWithTwoWeights.jpg"),
    title: t("onboarding.page3Title"),
    subtitle: t("onboarding.page3Subtitle"),
    buttonText: t("onboarding.page3Button"),
  },
];

export default function OnBoarding() {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const router = useRouter();
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const ONBOARDING_DATA = getOnboardingData(t);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const page = Math.round(offsetX / SCREEN_WIDTH);
    setCurrentPage(page);
  };

  const handleNext = () => {
    if (currentPage < ONBOARDING_DATA.length - 1) {
      scrollViewRef.current?.scrollTo({
        x: SCREEN_WIDTH * (currentPage + 1),
        animated: true,
      });
    } else {
      handleFinish();
    }
  };

  const handleSkip = () => {
    handleFinish();
  };

  const { user, setOnboardingCompleted } = useAuth();

  const handleFinish = async () => {
    await setOnboardingCompleted();

    if (user) {
      router.navigate("/(tabs)/schedule");
    } else {
      router.navigate("/auth");
    }
  };

  return (
    <View style={styles.container}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Image
          source={require("../../assets/images/Logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* ScrollView for pages */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {ONBOARDING_DATA.map((page) => (
          <View key={page.id} style={styles.page}>
            <View style={styles.imageContainer}>
              <Image
                source={page.image}
                style={styles.image}
                resizeMode="cover"
              />
              <View style={styles.imageOverlay} />
              <View style={styles.contentContainer}>
                <View style={styles.titleContainer}>
                  <Text style={styles.title}>{page.title}</Text>
                  {page.id === 1 && (
                    <Text style={styles.titleBold}>{t("onboarding.page1TitleBold")}</Text>
                  )}
                  {page.id === 2 && (
                    <Text style={styles.titleBold}>{t("onboarding.page2TitleBold")}</Text>
                  )}
                  {page.id === 3 && (
                    <Text style={styles.titleBold}>{t("onboarding.page3TitleBold")}</Text>
                  )}
                </View>
                <Text style={styles.subtitle}>{page.subtitle}</Text>
              </View>

              {/* Buttons positioned over image */}
              <View style={styles.buttonContainer}>
                <View style={{ marginBottom: 16 }}>
                  <ChipButton
                    title={ONBOARDING_DATA[currentPage].buttonText}
                    onPress={handleNext}
                    variant="primary"
                    size="lg"
                    fullWidth
                  />
                </View>

                <TouchableOpacity
                  style={styles.skipButton}
                  onPress={handleSkip}
                  activeOpacity={0.7}
                >
                  <Text style={styles.skipButtonText}>{t("common.skip")}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>["theme"]) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background.dark,
    },
    logoContainer: {
      position: "absolute",
      top: 60,
      left: 20,
      zIndex: 10,
    },
    logo: {
      width: 120,
      height: 40,
    },
    scrollView: {
      flex: 1,
    },
    page: {
      width: SCREEN_WIDTH,
      flex: 1,
    },
    imageContainer: {
      height: SCREEN_HEIGHT,
      position: "relative",
    },
    image: {
      width: "100%",
      height: "100%",
    },
    imageOverlay: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      top: 0,
      backgroundColor: "#000000",
      opacity: 0.7,
    },
    contentContainer: {
      position: "absolute",
      bottom: 200,
      left: 0,
      right: 0,
      paddingHorizontal: 32,
      alignItems: "flex-start",
    },
    title: {
      fontSize: 32,
      fontFamily: FONTS.regular,
      color: "#FFFFFF",
      marginBottom: 16,
      lineHeight: 30,
      textAlign: "left",
    },
    titleContainer: {
      alignItems: "flex-start",
      marginBottom: 16,
    },
    titleBold: {
      fontSize: 54,
      fontFamily: FONTS.bold,
      color: theme.primary.main,
      lineHeight: 65,
    },
    subtitle: {
      fontSize: 15,
      color: "#FFFFFF",
      lineHeight: 24,
      textAlign: "left",
    },
    buttonContainer: {
      position: "absolute",
      bottom: 48,
      left: 0,
      right: 0,
      paddingHorizontal: 32,
    },
    skipButton: {
      paddingVertical: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    skipButtonText: {
      color: theme.foreground.gray,
      fontSize: 16,
      fontFamily: FONTS.semiBold,
    },
  });



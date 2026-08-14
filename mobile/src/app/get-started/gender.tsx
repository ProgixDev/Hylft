import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Animated,
  Easing,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { Text } from "../../components/ui/ScaledText";
import SignupProgress from "../../components/ui/SignupProgress";
import { FONTS } from "../../constants/fonts";
import { useTheme } from "../../contexts/ThemeContext";

const BG = "#F8F9FC";

export default function GenderSelection() {
  const router = useRouter();
  const params = useLocalSearchParams<{ flow?: string }>();
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();
  const [selectedGender, setSelectedGender] = useState<string>("");
  const [isNavigating, setIsNavigating] = useState(false);
  const isSignupFlow = params.flow === "signup";

  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(24)).current;
  const maleScale = useRef(new Animated.Value(1)).current;
  const femaleScale = useRef(new Animated.Value(1)).current;

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
  }, [fade, slide]);

  const handleSelectGender = async (gender: "male" | "female") => {
    if (isNavigating) return;
    setSelectedGender(gender);
    setIsNavigating(true);

    const scale = gender === "male" ? maleScale : femaleScale;
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.96,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    setTheme(gender);
    try {
      await AsyncStorage.setItem("@hylift_gender", gender);
    } finally {
      if (isSignupFlow) {
        router.push("/get-started/age?flow=signup");
      } else {
        router.navigate("/get-started/units");
      }
    }
  };

  const pressIn = (scale: Animated.Value) => {
    Animated.spring(scale, {
      toValue: 0.97,
      speed: 30,
      bounciness: 4,
      useNativeDriver: true,
    }).start();
  };

  const pressOut = (scale: Animated.Value) => {
    Animated.spring(scale, {
      toValue: 1,
      speed: 20,
      bounciness: 6,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={s.container}>
      <Animated.View
        style={{
          flex: 1,
          opacity: fade,
          transform: [{ translateY: slide }],
        }}
      >
        <SignupProgress current={isSignupFlow ? 6 : 1} total={13} />

        <Text style={s.title}>{t("onboarding.gender.title")}</Text>

        <View style={s.cards}>
          {/* Male */}
          <Animated.View
            style={[
              s.cardWrap,
              { transform: [{ scale: maleScale }] },
              selectedGender === "male" && {
                borderColor: theme.primary.main,
                borderWidth: 2.5,
              },
            ]}
          >
            <Pressable
              style={s.cardInner}
              onPress={() => void handleSelectGender("male")}
              onPressIn={() => pressIn(maleScale)}
              onPressOut={() => pressOut(maleScale)}
            >
              <Image
                source={require("../../../assets/images/frameboy2.png")}
                style={s.img}
                resizeMode="cover"
              />
              <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.55)"]}
                style={s.gradient}
              />
              <View style={s.labelRow}>
                <Text style={s.label}>{t("onboarding.gender.male")}</Text>
              </View>
            </Pressable>
          </Animated.View>

          {/* Female */}
          <Animated.View
            style={[
              s.cardWrap,
              { transform: [{ scale: femaleScale }] },
              selectedGender === "female" && {
                borderColor: theme.primary.main,
                borderWidth: 2.5,
              },
            ]}
          >
            <Pressable
              style={s.cardInner}
              onPress={() => void handleSelectGender("female")}
              onPressIn={() => pressIn(femaleScale)}
              onPressOut={() => pressOut(femaleScale)}
            >
              <Image
                source={require("../../../assets/images/framegirl2.png")}
                style={s.img}
                resizeMode="cover"
              />
              <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.55)"]}
                style={s.gradient}
              />
              <View style={s.labelRow}>
                <Text style={s.label}>{t("onboarding.gender.female")}</Text>
              </View>
            </Pressable>
          </Animated.View>
        </View>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 26,
    fontFamily: FONTS.extraBold,
    color: "#102b4a",
    marginTop: 6,
    marginBottom: 20,
  },
  cards: {
    flex: 1,
    gap: 14,
    paddingBottom: 16,
  },
  cardWrap: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "transparent",
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  cardInner: {
    flex: 1,
  },
  img: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  gradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "50%",
  },
  labelRow: {
    position: "absolute",
    bottom: 18,
    left: 18,
    right: 18,
    flexDirection: "row",
    alignItems: "center",
  },
  label: {
    fontSize: 20,
    fontFamily: FONTS.extraBold,
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
});

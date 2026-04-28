import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { useHealth } from "../../contexts/HealthContext";
import { FONTS } from "../../constants/fonts";
import ChipButton from "../../components/ui/ChipButton";
import SignupProgress from "../../components/ui/SignupProgress";

export default function HealthConnect() {
  const router = useRouter();
  const params = useLocalSearchParams<{ flow?: string }>();
  const isSignupFlow = params.flow === "signup";
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { initialize, requestPermissions } = useHealth();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleEnableHealthConnect = async () => {
    try {
      setIsConnecting(true);
      const available = await initialize();
      if (!available) {
        Alert.alert(
          t("onboarding.healthConnect.unavailableTitle"),
          t("onboarding.healthConnect.unavailableMessage")
        );
        router.navigate(
          isSignupFlow
            ? "/get-started/email-preferences?flow=signup"
            : "/get-started/email-preferences"
        );
        return;
      }
      const granted = await requestPermissions();
      if (!granted) {
        Alert.alert(
          t("onboarding.healthConnect.permissionDeniedTitle"),
          t("onboarding.healthConnect.permissionDeniedMessage")
        );
      }
      router.navigate(
        isSignupFlow
          ? "/get-started/email-preferences?flow=signup"
          : "/get-started/email-preferences"
      );
    } catch (error) {
      console.warn("[HealthConnect] Setup failed:", error);
      router.navigate(
        isSignupFlow
          ? "/get-started/email-preferences?flow=signup"
          : "/get-started/email-preferences"
      );
    } finally {
      setIsConnecting(false);
    }
  };

  const handleNotNow = () => {
    router.navigate(
      isSignupFlow
        ? "/get-started/email-preferences?flow=signup"
        : "/get-started/email-preferences"
    );
  };

  return (
    <View style={s.container}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <SignupProgress current={11} total={13} />

        <View style={s.content}>
          <View style={[s.iconCircle, { backgroundColor: theme.primary.main + "18" }]}>
            <MaterialCommunityIcons
              name="heart-pulse"
              size={52}
              color={theme.primary.main}
            />
          </View>

          <Text style={s.title}>{t("onboarding.healthConnect.title")}</Text>
          <Text style={s.subtitle}>{t("onboarding.healthConnect.subtitle")}</Text>

          <View style={s.benefitsContainer}>
            {[
              t("onboarding.healthConnect.activityTracking"),
              t("onboarding.healthConnect.recommendations"),
              t("onboarding.healthConnect.insights"),
            ].map((benefit, i) => (
              <View key={i} style={s.benefitItem}>
                <View
                  style={[s.benefitDot, { backgroundColor: theme.primary.main }]}
                />
                <Text style={s.benefitText}>{benefit}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={s.buttonsContainer}>
        <ChipButton
          title={
            isConnecting
              ? t("common.continue") + "..."
              : t("onboarding.healthConnect.enable")
          }
          onPress={handleEnableHealthConnect}
          variant="primary"
          size="lg"
          fullWidth
          disabled={isConnecting}
        />
        <TouchableOpacity
          style={s.notNowButton}
          onPress={handleNotNow}
          activeOpacity={0.7}
        >
          <Text style={s.notNowButtonText}>
            {t("onboarding.healthConnect.notNow")}
          </Text>
        </TouchableOpacity>
      </View>
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
  content: {
    flex: 1,
    alignItems: "center",
    paddingTop: 12,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontFamily: FONTS.extraBold,
    color: "#111827",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
  },
  benefitsContainer: {
    width: "100%",
    gap: 10,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DDE3EA",
    backgroundColor: "#F6F8FA",
  },
  benefitDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  benefitText: {
    fontSize: 14,
    color: "#111827",
    flex: 1,
    fontFamily: FONTS.medium,
  },
  buttonsContainer: {
    gap: 8,
  },
  notNowButton: {
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  notNowButtonText: {
    color: "#64748B",
    fontSize: 14,
    fontFamily: FONTS.semiBold,
  },
});

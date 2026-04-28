import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
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

export default function EmailPreferences() {
  const router = useRouter();
  const params = useLocalSearchParams<{ flow?: string }>();
  const isSignupFlow = params.flow === "signup";
  const { theme } = useTheme();
  const { t } = useTranslation();

  const handleAccept = () => {
    router.navigate(isSignupFlow ? "/get-started/account" : "/get-started/ready");
  };

  const handleDecline = () => {
    router.navigate(isSignupFlow ? "/get-started/account" : "/get-started/ready");
  };

  return (
    <View style={s.container}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <SignupProgress current={12} total={13} />

        <View style={s.content}>
          <View
            style={[s.iconCircle, { backgroundColor: theme.primary.main + "18" }]}
          >
            <MaterialIcons name="email" size={52} color={theme.primary.main} />
          </View>

          <Text style={s.title}>
            {t("onboarding.emailPreferences.title")}
          </Text>
          <Text style={s.promiseText}>
            {t("onboarding.emailPreferences.promise")}
          </Text>

          <View style={s.listContainer}>
            {[
              { icon: "lightbulb-outline" as const, key: "tips" },
              { icon: "new-releases" as const, key: "newFeatures" },
              { icon: "local-offer" as const, key: "promotions" },
              { icon: "logout" as const, key: "optOut" },
            ].map((item) => (
              <View key={item.key} style={s.listItem}>
                <View
                  style={[
                    s.listIconWrap,
                    { backgroundColor: theme.primary.main + "18" },
                  ]}
                >
                  <MaterialIcons
                    name={item.icon}
                    size={20}
                    color={theme.primary.main}
                  />
                </View>
                <Text style={s.listItemText}>
                  {t(`onboarding.emailPreferences.${item.key}`)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={s.buttonsContainer}>
        <ChipButton
          title={t("onboarding.emailPreferences.accept")}
          onPress={handleAccept}
          variant="primary"
          size="lg"
          fullWidth
        />
        <TouchableOpacity
          style={s.declineButton}
          onPress={handleDecline}
          activeOpacity={0.7}
        >
          <Text style={s.declineButtonText}>
            {t("onboarding.emailPreferences.decline")}
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
    marginBottom: 8,
  },
  promiseText: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 28,
    fontStyle: "italic",
    lineHeight: 21,
  },
  listContainer: {
    width: "100%",
    gap: 10,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DDE3EA",
    backgroundColor: "#F6F8FA",
  },
  listIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  listItemText: {
    fontSize: 14,
    color: "#111827",
    flex: 1,
    lineHeight: 21,
    fontFamily: FONTS.medium,
  },
  buttonsContainer: {
    gap: 8,
  },
  declineButton: {
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  declineButtonText: {
    color: "#64748B",
    fontSize: 14,
    fontFamily: FONTS.semiBold,
  },
});

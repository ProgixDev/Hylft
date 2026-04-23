import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Animated,
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/AuthContext";

interface ProModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function ProModal({ visible, onClose }: ProModalProps) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">(
    "yearly",
  );
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
  } | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const isCompactWidth = width < 380;
  const isCompactHeight = height < 760;
  const isVeryCompactHeight = height < 700;

  useEffect(() => {
    const calculateTimeLeft = () => {
      const startDate = user?.created_at ? new Date(user.created_at) : new Date();
      const expirationDate = new Date(
        startDate.getTime() + 7 * 24 * 60 * 60 * 1000,
      );
      const now = new Date();
      const difference = expirationDate.getTime() - now.getTime();

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        return { days, hours, minutes };
      }

      return { days: 0, hours: 0, minutes: 0 };
    };

    if (visible) {
      setTimeLeft(calculateTimeLeft());

      const timer = setInterval(() => {
        setTimeLeft(calculateTimeLeft());
      }, 60000);

      return () => clearInterval(timer);
    }
  }, [visible, user?.created_at]);

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [visible, fadeAnim]);

  const features = [
    t("proModal.feature1", "Personalized AI workout plans"),
    t("proModal.feature2", "Advanced nutrition tracking"),
    t("proModal.feature3", "Unlimited exclusive routines"),
  ];

  const handlePlanPress = (plan: "monthly" | "yearly") => {
    setSelectedPlan(plan);
    Alert.alert("Google Pay", "Please set up Google Pay");
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
    >
      <View style={styles.container}>
        <LinearGradient
          colors={["#2A2210", "#0D0D0D", "#000000"]}
          style={styles.backgroundGradient}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.5 }}
        />

        <View
          style={[
            styles.headerRow,
            {
              marginTop:
                Platform.OS === "android" ? insets.top + 16 : insets.top,
            },
          ]}
        >
          <TouchableOpacity onPress={onClose} style={styles.iconButton}>
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {}} style={styles.restoreBtn}>
            <Text style={styles.restoreText}>
              {t("proModal.restore", "Restore")}
            </Text>
          </TouchableOpacity>
        </View>

        <Animated.View
          style={[
            styles.mainLayout,
            {
              opacity: fadeAnim,
              paddingBottom: insets.bottom + 16,
              paddingHorizontal: isCompactWidth ? 18 : 24,
            },
          ]}
        >
          <View
            style={[
              styles.content,
              isCompactHeight && styles.contentCompact,
              isVeryCompactHeight && styles.contentVeryCompact,
            ]}
          >
            <View
              style={[
                styles.topSection,
                isVeryCompactHeight && styles.topSectionVeryCompact,
              ]}
            >
              <Text
                style={[
                  styles.title,
                  isCompactWidth && styles.titleCompact,
                  isVeryCompactHeight && styles.titleVeryCompact,
                ]}
              >
                {t("proModal.title", "Hylft Pro")}
              </Text>
              <Text
                style={[
                  styles.subtitle,
                  isVeryCompactHeight && styles.subtitleVeryCompact,
                ]}
              >
                {t("proModal.subtitle", "Unlock the ultimate fitness experience")}
              </Text>
              <Text
                style={[
                  styles.countdownText,
                  isVeryCompactHeight && styles.countdownTextVeryCompact,
                ]}
              >
                {timeLeft
                  ? t(
                      "proModal.countdownMsg",
                      "{{days}} days, {{hours}} hours & {{minutes}} minutes till your free trial ends",
                      {
                        days: timeLeft.days,
                        hours: timeLeft.hours,
                        minutes: timeLeft.minutes,
                      },
                    )
                  : t("proModal.loadingStatus", "Loading free trial status...")}
              </Text>

              <View
                style={[
                  styles.iconContainer,
                  isCompactHeight && styles.iconContainerCompact,
                  isVeryCompactHeight && styles.iconContainerVeryCompact,
                ]}
              >
                <Image
                  source={require("../../../assets/images/logo_premium.png")}
                  style={[
                    styles.premiumLogo,
                    isCompactHeight && styles.premiumLogoCompact,
                    isVeryCompactHeight && styles.premiumLogoVeryCompact,
                  ]}
                  resizeMode="contain"
                />
              </View>

              <View
                style={[
                  styles.features,
                  isCompactHeight && styles.featuresCompact,
                  isVeryCompactHeight && styles.featuresVeryCompact,
                ]}
              >
                {features.map((item, index) => (
                  <View
                    key={index}
                    style={[
                      styles.featureRow,
                      isVeryCompactHeight && styles.featureRowVeryCompact,
                    ]}
                  >
                    <Ionicons name="checkmark-sharp" size={20} color="#F5CE7A" />
                    <Text
                      style={[
                        styles.featureText,
                        isVeryCompactHeight && styles.featureTextVeryCompact,
                      ]}
                    >
                      {item}
                    </Text>
                  </View>
                ))}
              </View>

              <View
                style={[
                  styles.plansContainer,
                  isCompactWidth && styles.plansContainerCompact,
                ]}
              >
                <Pressable
                  style={[
                    styles.planCard,
                    isCompactWidth && styles.planCardNarrow,
                    isVeryCompactHeight && styles.planCardCompact,
                    selectedPlan === "monthly" && styles.planCardSelected,
                  ]}
                  onPress={() => handlePlanPress("monthly")}
                >
                  {selectedPlan === "monthly" && (
                    <View style={styles.checkmarkBadge}>
                      <Ionicons name="checkmark" size={12} color="#000" />
                    </View>
                  )}
                  <Text style={styles.planTitle}>{t("proModal.monthly", "Monthly")}</Text>
                  <Text style={styles.planPrice}>$9.99</Text>
                  <Text style={styles.planBilling}>
                    {t("proModal.billedMonthly", "Billed Monthly")}
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.planCard,
                    isCompactWidth && styles.planCardNarrow,
                    isVeryCompactHeight && styles.planCardCompact,
                    selectedPlan === "yearly" && styles.planCardSelected,
                  ]}
                  onPress={() => handlePlanPress("yearly")}
                >
                  {selectedPlan === "yearly" && (
                    <View style={styles.checkmarkBadge}>
                      <Ionicons name="checkmark" size={12} color="#000" />
                    </View>
                  )}
                  <View style={styles.yearlyHeader}>
                    <Text style={styles.planTitle}>{t("proModal.yearly", "Yearly")}</Text>
                    <Ionicons
                      name="flame"
                      size={14}
                      color="#F5CE7A"
                      style={styles.fireIcon}
                    />
                  </View>
                  <Text style={styles.planPrice}>$79.99</Text>
                  <View style={styles.saveBadge}>
                    <Text style={styles.saveText}>
                      {t("proModal.saveAmount", "Save $39.89")}
                    </Text>
                  </View>
                  <Text style={styles.planBilling}>
                    {t("proModal.billedYearly", "Billed Yearly")}
                  </Text>
                </Pressable>
              </View>
            </View>

          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D0D0D",
  },
  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    zIndex: 10,
  },
  iconButton: {
    padding: 4,
  },
  restoreBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  restoreText: {
    color: "#E5E5E5",
    fontSize: 15,
    fontFamily: "Zain_400Regular",
  },
  mainLayout: {
    flex: 1,
    paddingTop: 16,
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  contentCompact: {
    paddingTop: 0,
  },
  contentVeryCompact: {
    gap: 10,
  },
  topSection: {
    width: "100%",
    alignItems: "center",
  },
  topSectionVeryCompact: {
    justifyContent: "flex-start",
  },
  title: {
    fontSize: 34,
    color: "#FFFFFF",
    fontFamily: "Zain_800ExtraBold",
    marginBottom: 8,
  },
  titleCompact: {
    fontSize: 30,
  },
  titleVeryCompact: {
    fontSize: 28,
  },
  subtitle: {
    fontSize: 16,
    color: "#D0D0D0",
    fontFamily: "Zain_400Regular",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitleVeryCompact: {
    fontSize: 15,
    marginBottom: 6,
  },
  countdownText: {
    fontSize: 14,
    color: "#F5CE7A",
    fontFamily: "Zain_700Bold",
    marginBottom: 24,
    textAlign: "center",
  },
  countdownTextVeryCompact: {
    fontSize: 13,
    marginBottom: 18,
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 36,
  },
  iconContainerCompact: {
    marginBottom: 24,
  },
  iconContainerVeryCompact: {
    marginBottom: 18,
  },
  premiumLogo: {
    width: 120,
    height: 120,
  },
  premiumLogoCompact: {
    width: 92,
    height: 92,
  },
  premiumLogoVeryCompact: {
    width: 76,
    height: 76,
  },
  features: {
    width: "100%",
    marginBottom: 36,
  },
  featuresCompact: {
    marginBottom: 24,
  },
  featuresVeryCompact: {
    marginBottom: 18,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  featureRowVeryCompact: {
    marginBottom: 9,
  },
  featureText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Zain_400Regular",
    marginLeft: 12,
    flex: 1,
  },
  featureTextVeryCompact: {
    fontSize: 15,
  },
  plansContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "stretch",
    width: "100%",
    gap: 12,
  },
  plansContainerCompact: {
    gap: 10,
  },
  planCard: {
    flex: 1,
    minHeight: 128,
    justifyContent: "flex-start",
    borderRadius: 16,
    padding: 16,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    position: "relative",
  },
  planCardCompact: {
    padding: 14,
    minHeight: 116,
  },
  planCardNarrow: {
    paddingHorizontal: 12,
  },
  planCardSelected: {
    borderColor: "#F5CE7A",
    backgroundColor: "rgba(245, 206, 122, 0.08)",
  },
  checkmarkBadge: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#F5CE7A",
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  yearlyHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  fireIcon: {
    marginLeft: 4,
  },
  planTitle: {
    color: "#D0D0D0",
    fontSize: 15,
    fontFamily: "Zain_400Regular",
    marginBottom: 8,
  },
  planPrice: {
    color: "#FFFFFF",
    fontSize: 26,
    fontFamily: "Zain_700Bold",
    marginBottom: 4,
  },
  saveBadge: {
    backgroundColor: "rgba(245, 206, 122, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  saveText: {
    color: "#F5CE7A",
    fontSize: 12,
    fontFamily: "Zain_700Bold",
  },
  planBilling: {
    color: "#A0A0A0",
    fontSize: 12,
    fontFamily: "Zain_400Regular",
    marginTop: 10,
  },
});

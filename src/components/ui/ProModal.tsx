import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    Alert,
    Animated,
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
import {
    closeGooglePlayBilling,
    finalizeGooglePlayPurchase,
    getGooglePlayBillingUnavailableMessage,
    GOOGLE_PLAY_PRODUCT_IDS,
    isGooglePlayBillingAvailable,
    loadGooglePlaySubscriptions,
    markProEntitled,
    requestGooglePlaySubscription,
    restoreGooglePlaySubscriptions,
    subscribeToGooglePlayPurchaseEvents,
    type GooglePlaySubscriptionProduct,
    type ProPlan,
} from "../../services/googlePlayBilling";

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
  const [trialStatus, setTrialStatus] = useState<{
    isExpired: boolean;
    days: number;
    hours: number;
    minutes: number;
  } | null>(null);
  const [billingProducts, setBillingProducts] = useState<
    Partial<Record<ProPlan, GooglePlaySubscriptionProduct>>
  >({});
  const [isBillingLoading, setIsBillingLoading] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [billingMessage, setBillingMessage] = useState<string | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const isCompactWidth = width < 420;
  const isCompactHeight = height < 760;
  const isVeryCompactHeight = height < 700;

  useEffect(() => {
    const calculateTrialStatus = () => {
      const startDate = user?.created_at
        ? new Date(user.created_at)
        : new Date();
      const expirationDate = new Date(
        startDate.getTime() + 7 * 24 * 60 * 60 * 1000,
      );
      const now = new Date();
      const difference = expirationDate.getTime() - now.getTime();

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        return { isExpired: false, days, hours, minutes };
      }

      return { isExpired: true, days: 0, hours: 0, minutes: 0 };
    };

    if (visible) {
      setTrialStatus(calculateTrialStatus());

      const timer = setInterval(() => {
        setTrialStatus(calculateTrialStatus());
      }, 60000);

      return () => clearInterval(timer);
    }
    setTrialStatus(null);
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

  useEffect(() => {
    if (!visible || !isGooglePlayBillingAvailable()) return;

    let active = true;

    const bootstrapBilling = async () => {
      try {
        setIsBillingLoading(true);
        setBillingMessage(null);

        const subscriptions = await loadGooglePlaySubscriptions();
        if (!active) return;

        const nextProducts: Partial<
          Record<ProPlan, GooglePlaySubscriptionProduct>
        > = {};
        for (const product of subscriptions) {
          if (product.productId === GOOGLE_PLAY_PRODUCT_IDS.monthly) {
            nextProducts.monthly = product;
          }

          if (product.productId === GOOGLE_PLAY_PRODUCT_IDS.yearly) {
            nextProducts.yearly = product;
          }
        }

        setBillingProducts(nextProducts);
      } catch (error) {
        if (!active) return;
        console.error("[ProModal] Failed to load Google Play products", error);
        setBillingMessage(
          t(
            "proModal.googlePlayUnavailable",
            "Google Play purchases could not be loaded right now.",
          ),
        );
      } finally {
        if (active) setIsBillingLoading(false);
      }
    };

    void bootstrapBilling();

    return () => {
      active = false;
      void closeGooglePlayBilling();
    };
  }, [t, visible]);

  useEffect(() => {
    if (!visible || !isGooglePlayBillingAvailable()) return;

    let active = true;
    let purchaseSubscription: { remove: () => void } | null = null;
    let errorSubscription: { remove: () => void } | null = null;

    const attachListeners = async () => {
      const subscriptions = await subscribeToGooglePlayPurchaseEvents(
        async (purchase) => {
          try {
            await finalizeGooglePlayPurchase(purchase);
            if (user?.id) {
              await markProEntitled(user.id);
            }
            onClose();
            Alert.alert(
              t("common.done", "Done"),
              t(
                "proModal.purchaseSuccess",
                "Your Google Play subscription is active.",
              ),
            );
          } catch (error) {
            console.error("[ProModal] Failed to finish purchase", error);
            Alert.alert(
              t("common.error", "Error"),
              t(
                "proModal.purchaseFailed",
                "We could not complete the purchase.",
              ),
            );
          } finally {
            setIsPurchasing(false);
          }
        },
        (error) => {
          console.error("[ProModal] Google Play purchase error", error);
          setIsPurchasing(false);
          Alert.alert(
            t("common.error", "Error"),
            error.message ||
              t(
                "proModal.purchaseFailed",
                "We could not start the purchase flow.",
              ),
          );
        },
      );

      if (!active) {
        subscriptions.purchaseSubscription.remove();
        subscriptions.errorSubscription.remove();
        return;
      }

      purchaseSubscription = subscriptions.purchaseSubscription;
      errorSubscription = subscriptions.errorSubscription;
    };

    void attachListeners();

    return () => {
      active = false;
      purchaseSubscription?.remove();
      errorSubscription?.remove();
    };
  }, [onClose, t, user?.id, visible]);

  const features = [
    t("proModal.feature1", "AI plans adapted to your goal, level and schedule"),
    t("proModal.feature2", "Macro, calories and meal tracking in real time"),
    t("proModal.feature3", "Access +1,300 exercises on the platform"),
    t("proModal.feature4", "Unlimited custom routines and workout history"),
    t("proModal.feature5", "Progress insights to know what to train next"),
  ];

  const getPlanPrice = (plan: ProPlan, fallback: string) =>
    billingProducts[plan]?.localizedPrice ??
    billingProducts[plan]?.price ??
    fallback;

  const handleRestorePress = async () => {
    if (!user?.id) return;

    if (!isGooglePlayBillingAvailable()) {
      Alert.alert("Google Play", getGooglePlayBillingUnavailableMessage());
      return;
    }

    try {
      setIsBillingLoading(true);
      const purchases = await restoreGooglePlaySubscriptions();
      if (purchases.length === 0) {
        Alert.alert(
          t("common.done", "Done"),
          t(
            "proModal.noRestorablePurchases",
            "We could not find an active Google Play subscription for this account.",
          ),
        );
        return;
      }

      await markProEntitled(user.id);
      Alert.alert(
        t("common.done", "Done"),
        t(
          "proModal.restoreSuccess",
          "Your Google Play subscription has been restored.",
        ),
      );
      onClose();
    } catch (error) {
      console.error("[ProModal] Failed to restore purchases", error);
      Alert.alert(
        t("common.error", "Error"),
        t(
          "proModal.restoreFailed",
          "We could not restore your purchase right now.",
        ),
      );
    } finally {
      setIsBillingLoading(false);
    }
  };

  const handlePurchasePress = async () => {
    if (!user?.id) return;

    if (!isGooglePlayBillingAvailable()) {
      Alert.alert("Google Play", getGooglePlayBillingUnavailableMessage());
      return;
    }

    try {
      setIsPurchasing(true);
      setBillingMessage(null);
      await requestGooglePlaySubscription(selectedPlan);
    } catch (error) {
      console.error("[ProModal] Google Play purchase failed", error);
      Alert.alert(
        t("common.error", "Error"),
        error instanceof Error
          ? error.message
          : t(
              "proModal.purchaseFailed",
              "We could not start the purchase flow.",
            ),
      );
      setIsPurchasing(false);
    }
  };

  const handlePlanPress = (plan: "monthly" | "yearly") => {
    setSelectedPlan(plan);
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
          <TouchableOpacity
            onPress={handleRestorePress}
            style={styles.restoreBtn}
          >
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
                {t(
                  "proModal.subtitle",
                  "Unlock the ultimate fitness experience",
                )}
              </Text>
              <View style={styles.socialProofRow}>
                {[0, 1, 2, 3, 4].map((item) => (
                  <Ionicons key={item} name="star" size={13} color="#F5CE7A" />
                ))}
                <Text style={styles.socialProofText}>
                  {t("proModal.socialProof", "+50,000 active members")}
                </Text>
              </View>

              {trialStatus ? (
                <Text
                  style={[
                    styles.countdownText,
                    trialStatus.isExpired && styles.expiredTrialText,
                    isVeryCompactHeight && styles.countdownTextVeryCompact,
                  ]}
                >
                  {trialStatus.isExpired
                    ? t("proModal.trialExpired", "Your free trial has ended")
                    : t(
                        "proModal.countdownMsg",
                        "{{days}} days, {{hours}} hours & {{minutes}} minutes till your free trial ends",
                        {
                          days: trialStatus.days,
                          hours: trialStatus.hours,
                          minutes: trialStatus.minutes,
                        },
                      )}
                </Text>
              ) : (
                <Text
                  style={[
                    styles.countdownText,
                    isVeryCompactHeight && styles.countdownTextVeryCompact,
                  ]}
                >
                  {t("proModal.loadingStatus", "Loading free trial status...")}
                </Text>
              )}

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
                    <Ionicons
                      name="checkmark-sharp"
                      size={20}
                      color="#F5CE7A"
                    />
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
                  <Text style={styles.planTitle}>
                    {t("proModal.monthly", "Monthly")}
                  </Text>
                  <Text style={styles.planPrice}>
                    {getPlanPrice("monthly", "4,99 €")}
                  </Text>
                  <Text style={styles.planBilling}>
                    {t("proModal.billedMonthly", "Billed Monthly")}
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.planCard,
                    isCompactWidth && styles.planCardNarrow,
                    isVeryCompactHeight && styles.planCardCompact,
                    styles.yearlyPlanCard,
                    selectedPlan === "yearly" && styles.planCardSelected,
                  ]}
                  onPress={() => handlePlanPress("yearly")}
                >
                  <View style={styles.popularBadge}>
                    <Ionicons name="flame" size={12} color="#000000" />
                    <Text style={styles.popularBadgeText}>
                      {t("proModal.popular", "Most popular")}
                    </Text>
                  </View>
                  {selectedPlan === "yearly" && (
                    <View style={styles.checkmarkBadge}>
                      <Ionicons name="checkmark" size={12} color="#000" />
                    </View>
                  )}
                  <View style={styles.yearlyHeader}>
                    <Text style={styles.planTitle}>
                      {t("proModal.yearly", "Yearly")}
                    </Text>
                    <Ionicons
                      name="flame"
                      size={14}
                      color="#F5CE7A"
                      style={styles.fireIcon}
                    />
                  </View>
                  <Text style={styles.planPrice}>
                    {getPlanPrice("yearly", "40,12 €")}
                  </Text>
                  <View style={styles.saveBadge}>
                    <Text style={styles.saveText}>
                      {t("proModal.saveAmount", "Save 33%")}
                    </Text>
                  </View>
                  <Text style={styles.planBilling}>
                    {t("proModal.billedYearly", "Billed Yearly")}
                  </Text>
                </Pressable>
              </View>

              {billingMessage && (
                <Text style={styles.billingMessage}>{billingMessage}</Text>
              )}

              <Pressable
                style={({ pressed }) => [
                  styles.purchaseButton,
                  (pressed || isPurchasing || isBillingLoading) &&
                    styles.purchaseButtonPressed,
                  (!isGooglePlayBillingAvailable() || isPurchasing) &&
                    styles.purchaseButtonDisabled,
                ]}
                onPress={handlePurchasePress}
                disabled={isPurchasing || isBillingLoading}
              >
                {isPurchasing || isBillingLoading ? (
                  <ActivityIndicator color="#000000" />
                ) : (
                  <Text style={styles.purchaseButtonText}>
                    {t("proModal.purchaseBtn", "Unlock Hylft Pro")}
                  </Text>
                )}
              </Pressable>

              <View style={styles.guaranteeRow}>
                <Ionicons name="shield-checkmark" size={15} color="#D7D7D7" />
                <Text style={styles.guaranteeText}>
                  {t("proModal.guarantee", "7-day money-back guarantee")}
                </Text>
              </View>

              <Pressable
                onPress={handleRestorePress}
                style={styles.restoreHintBtn}
              >
                <Text style={styles.restoreHintText}>
                  {t("proModal.restore", "Restore")}
                </Text>
              </Pressable>
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
    paddingTop: 8,
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
    fontSize: 32,
    color: "#FFFFFF",
    fontFamily: "Zain_800ExtraBold",
    marginBottom: 4,
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
    marginBottom: 6,
    textAlign: "center",
  },
  subtitleVeryCompact: {
    fontSize: 15,
    marginBottom: 6,
  },
  socialProofRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    marginBottom: 8,
  },
  socialProofText: {
    color: "#EDEDED",
    fontSize: 13,
    fontFamily: "Zain_700Bold",
    marginLeft: 5,
  },
  countdownText: {
    fontSize: 14,
    color: "#F5CE7A",
    fontFamily: "Zain_700Bold",
    marginBottom: 14,
    textAlign: "center",
  },
  expiredTrialText: {
    color: "#FFFFFF",
  },
  countdownTextVeryCompact: {
    fontSize: 13,
    marginBottom: 10,
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  iconContainerCompact: {
    marginBottom: 12,
  },
  iconContainerVeryCompact: {
    marginBottom: 10,
  },
  premiumLogo: {
    width: 64,
    height: 64,
  },
  premiumLogoCompact: {
    width: 56,
    height: 56,
  },
  premiumLogoVeryCompact: {
    width: 48,
    height: 48,
  },
  features: {
    width: "100%",
    marginBottom: 14,
  },
  featuresCompact: {
    marginBottom: 12,
  },
  featuresVeryCompact: {
    marginBottom: 10,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 7,
  },
  featureRowVeryCompact: {
    marginBottom: 6,
  },
  featureText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: "Zain_400Regular",
    marginLeft: 10,
    flex: 1,
  },
  featureTextVeryCompact: {
    fontSize: 14,
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
    minHeight: 122,
    justifyContent: "flex-start",
    borderRadius: 14,
    padding: 14,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    position: "relative",
  },
  yearlyPlanCard: {
    paddingTop: 18,
  },
  planCardCompact: {
    padding: 12,
    minHeight: 112,
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
    marginBottom: 5,
  },
  planPrice: {
    color: "#FFFFFF",
    fontSize: 24,
    fontFamily: "Zain_700Bold",
    marginBottom: 3,
  },
  popularBadge: {
    position: "absolute",
    top: -12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#F5CE7A",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  popularBadgeText: {
    color: "#000000",
    fontSize: 11,
    fontFamily: "Zain_700Bold",
  },
  saveBadge: {
    backgroundColor: "rgba(245, 206, 122, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  saveText: {
    color: "#F5CE7A",
    fontSize: 12,
    fontFamily: "Zain_700Bold",
  },
  billingMessage: {
    marginTop: 12,
    color: "#F5CE7A",
    fontSize: 13,
    fontFamily: "Zain_400Regular",
    textAlign: "center",
  },
  purchaseButton: {
    width: "100%",
    marginTop: 14,
    minHeight: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5CE7A",
  },
  purchaseButtonPressed: {
    opacity: 0.9,
  },
  purchaseButtonDisabled: {
    opacity: 0.55,
  },
  purchaseButtonText: {
    color: "#000000",
    fontSize: 16,
    fontFamily: "Zain_700Bold",
  },
  guaranteeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 9,
    gap: 6,
  },
  guaranteeText: {
    color: "#D7D7D7",
    fontSize: 13,
    fontFamily: "Zain_400Regular",
  },
  restoreHintBtn: {
    marginTop: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  restoreHintText: {
    color: "#A0A0A0",
    fontSize: 13,
    fontFamily: "Zain_400Regular",
  },
  planBilling: {
    color: "#A0A0A0",
    fontSize: 12,
    fontFamily: "Zain_400Regular",
    marginTop: 10,
  },
});

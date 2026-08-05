import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { Platform } from "react-native";

export type ProPlan = "monthly" | "yearly";

export type GooglePlaySubscriptionProduct = {
  productId: string;
  title?: string;
  localizedPrice?: string;
  price?: string;
  subscriptionOfferDetails?: Array<{
    offerToken: string;
  }>;
};

export type GooglePlayBillingAvailability =
  | "available"
  | "not-android"
  | "expo-go";

const PRO_ENTITLEMENT_KEY = "@hylift_google_play_pro";

function getEntitlementKey(userId: string) {
  return `${PRO_ENTITLEMENT_KEY}:${userId}`;
}

export const GOOGLE_PLAY_PRODUCT_IDS: Record<ProPlan, string | undefined> = {
  monthly: process.env.EXPO_PUBLIC_GOOGLE_PLAY_MONTHLY_PRODUCT_ID,
  yearly: process.env.EXPO_PUBLIC_GOOGLE_PLAY_YEARLY_PRODUCT_ID,
};

export function getGooglePlayBillingAvailability(): GooglePlayBillingAvailability {
  if (Platform.OS !== "android") return "not-android";
  if (Constants.appOwnership === "expo") return "expo-go";
  return "available";
}

export function isGooglePlayBillingAvailable() {
  return getGooglePlayBillingAvailability() === "available";
}

export function getGooglePlayBillingUnavailableMessage() {
  const availability = getGooglePlayBillingAvailability();

  if (availability === "expo-go") {
    return "Google Play subscriptions are not supported in Expo Go. Use a development build or Play-distributed build on Android.";
  }

  return "Google Play subscriptions are available on Android only.";
}

async function getIap() {
  return import("react-native-iap");
}

function getConfiguredProductIds() {
  return Object.values(GOOGLE_PLAY_PRODUCT_IDS).filter(
    (productId): productId is string => Boolean(productId),
  );
}

export async function loadGooglePlaySubscriptions() {
  if (!isGooglePlayBillingAvailable())
    return [] as GooglePlaySubscriptionProduct[];

  const productIds = getConfiguredProductIds();
  if (productIds.length === 0) return [] as GooglePlaySubscriptionProduct[];

  const {
    flushFailedPurchasesCachedAsPendingAndroid,
    getSubscriptions,
    initConnection,
  } = await getIap();

  await initConnection();
  await flushFailedPurchasesCachedAsPendingAndroid();

  return (await getSubscriptions({
    skus: productIds,
  })) as GooglePlaySubscriptionProduct[];
}

export async function requestGooglePlaySubscription(plan: ProPlan) {
  if (!isGooglePlayBillingAvailable()) {
    throw new Error(getGooglePlayBillingUnavailableMessage());
  }

  const productId = GOOGLE_PLAY_PRODUCT_IDS[plan];
  if (!productId) {
    throw new Error(
      `Missing product ID for ${plan}. Set EXPO_PUBLIC_GOOGLE_PLAY_${plan.toUpperCase()}_PRODUCT_ID.`,
    );
  }

  const { getSubscriptions, requestSubscription } = await getIap();

  const nextSubscriptions = (await getSubscriptions({
    skus: [productId],
  })) as GooglePlaySubscriptionProduct[];
  const nextSubscription = nextSubscriptions[0];
  const nextOfferToken =
    nextSubscription?.subscriptionOfferDetails?.[0]?.offerToken;

  return requestSubscription(
    nextOfferToken
      ? {
          sku: productId,
          subscriptionOffers: [
            {
              sku: productId,
              offerToken: nextOfferToken,
            },
          ],
        }
      : { sku: productId },
  );
}

export async function restoreGooglePlaySubscriptions() {
  if (!isGooglePlayBillingAvailable())
    return [] as GooglePlaySubscriptionProduct[];

  const productIds = getConfiguredProductIds();
  if (productIds.length === 0) return [] as GooglePlaySubscriptionProduct[];

  const { getAvailablePurchases } = await getIap();

  const purchases = await getAvailablePurchases();
  return purchases.filter((purchase) =>
    productIds.includes((purchase as { productId?: string }).productId ?? ""),
  ) as GooglePlaySubscriptionProduct[];
}

export async function markProEntitled(userId: string) {
  await AsyncStorage.setItem(getEntitlementKey(userId), "true");
}

export async function hasProEntitlement(userId: string) {
  return (await AsyncStorage.getItem(getEntitlementKey(userId))) === "true";
}

export async function clearProEntitlement(userId: string) {
  await AsyncStorage.removeItem(getEntitlementKey(userId));
}

export async function finalizeGooglePlayPurchase(purchase: unknown) {
  const { finishTransaction } = await getIap();
  await finishTransaction({ purchase: purchase as never, isConsumable: false });
}

export async function closeGooglePlayBilling() {
  if (!isGooglePlayBillingAvailable()) return;

  const { endConnection } = await getIap();
  await endConnection();
}

export async function subscribeToGooglePlayPurchaseEvents(
  onPurchase: (purchase: unknown) => Promise<void> | void,
  onError: (error: { message?: string }) => void,
) {
  if (!isGooglePlayBillingAvailable()) {
    return {
      purchaseSubscription: { remove: () => {} },
      errorSubscription: { remove: () => {} },
    };
  }

  const { purchaseErrorListener, purchaseUpdatedListener } = await getIap();

  return {
    purchaseSubscription: purchaseUpdatedListener(onPurchase),
    errorSubscription: purchaseErrorListener(onError),
  };
}

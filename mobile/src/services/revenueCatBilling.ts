import { Platform } from "react-native";
import Purchases, { PurchasesPackage } from "react-native-purchases";

export type ProPlan = "monthly" | "yearly";

const API_KEYS = {
  apple: "appl_fEsKqyLEbMMUkDTRFtLjRIEERqY",
  google: "goog_mrbwBFDrbMcRXoISQkeisMuNPLF"
};
 
const ENTITLEMENT_ID = "pro";

export function initRevenueCat() {
  Purchases.setLogLevel(Purchases.LOG_LEVEL.WARN);
  if (Platform.OS === 'ios') {
    Purchases.configure({ apiKey: API_KEYS.apple });
  } else if (Platform.OS === 'android') {
    Purchases.configure({ apiKey: API_KEYS.google });
  }
}

export async function hasProEntitlement(userId: string) {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== "undefined";
  } catch (e) {
    console.error("Error checking entitlement", e);
    return false;
  }
}

export async function loadOfferings() {
  try {
    const offerings = await Purchases.getOfferings();
    if (offerings.current !== null) {
      return offerings.current.availablePackages;
    }
  } catch (e) {
    console.warn("Error fetching offerings", e);
  }
  return [];
}

export async function purchasePackage(packageToBuy: PurchasesPackage) {
  try {
    const { customerInfo } = await Purchases.purchasePackage(packageToBuy);
    return typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== "undefined";
  } catch (e: any) {
    if (!e.userCancelled) {
      console.error("Error purchasing package", e);
      throw e;
    }
    return false;
  }
}

export async function restorePurchases() {
  try {
    const customerInfo = await Purchases.restorePurchases();
    return typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== "undefined";
  } catch (e) {
    console.error("Error restoring purchases", e);
    return false;
  }
}

export async function clearProEntitlement(userId: string) {
  try {
      await Purchases.logOut();
  } catch (e) {
      console.error("Error logging out of RevenueCat", e);
  }
}

export async function markProEntitled(userId: string) {
  try {
      await Purchases.logIn(userId);
  } catch (e) {
      console.error("Error logging in to RevenueCat", e);
  }
}

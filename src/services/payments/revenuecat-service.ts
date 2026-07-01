import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL, PurchasesPackage, CustomerInfo, PURCHASES_ERROR_CODE } from 'react-native-purchases';
import type { SubscriptionState } from '@/src/types';

export type PurchaseResult = {
  success: boolean;
  subscription?: SubscriptionState;
  message?: string;
  error?: string;
};

// Zmienne środowiskowe zdefiniowane w .env
const API_KEY_IOS = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY || '';
const API_KEY_ANDROID = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY || '';
const ENTITLEMENT_ID = process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID || 'premium';
const FREE_ANALYSIS_LIMIT = 5;
const PREMIUM_ANALYSIS_LIMIT = 200;
const SUBSCRIPTION_ASSIGNED_TO_ANOTHER_ACCOUNT_ERROR = 'Ta subskrypcja jest już przypisana do innego konta. Zaloguj się na właściwe konto, aby ją przywrócić.';

const currentMonth = () => new Date().toISOString().slice(0, 7);
let isConfigured = false;
let configurePromise: Promise<void> | null = null;

const isAnonymousRevenueCatUserId = (userId?: string | null) => Boolean(userId?.startsWith('$RCAnonymous'));

const getRevenueCatApiKey = () => {
  if (Platform.OS === 'ios') return API_KEY_IOS;
  if (Platform.OS === 'android') return API_KEY_ANDROID;
  return '';
};

const isOwnedByAnotherIdentifiedUser = (info: CustomerInfo, currentUserId?: string) => {
  return Boolean(
    currentUserId &&
    info.originalAppUserId &&
    info.originalAppUserId !== currentUserId &&
    !isAnonymousRevenueCatUserId(info.originalAppUserId)
  );
};

const configurePurchases = async (appUserID?: string) => {
  if (isConfigured) return;
  if (configurePromise) return configurePromise;

  configurePromise = Promise.resolve().then(() => {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);

    const apiKey = getRevenueCatApiKey();
    if (!apiKey) {
      throw new Error(`Brak klucza RevenueCat dla platformy ${Platform.OS}.`);
    }

    Purchases.configure({ apiKey, appUserID: appUserID ?? null });
    isConfigured = true;
    console.log(`[RevenueCat] Skonfigurowano SDK dla platformy ${Platform.OS}${appUserID ? ` i usera ${appUserID}` : ''}.`);
  }).catch((error) => {
    isConfigured = false;
    throw error;
  }).finally(() => {
    configurePromise = null;
  });

  return configurePromise;
};

const attachSupabaseUserAttribute = async (userId: string, email?: string | null) => {
  await Purchases.setAttributes({ supabase_user_id: userId }).catch((error) => {
    console.warn('[RevenueCat] Nie udało się ustawić supabase_user_id:', error);
  });

  if (email) {
    await Purchases.setEmail(email).catch((error) => {
      console.warn('[RevenueCat] Nie udało się ustawić email:', error);
    });
  }
};

const ensureRevenueCatUser = async (currentUserId?: string, email?: string | null) => {
  await configurePurchases(currentUserId);

  if (!currentUserId) return;

  const appUserId = await Purchases.getAppUserID().catch(() => null);
  if (appUserId !== currentUserId) {
    await Purchases.logIn(currentUserId);
  }

  await attachSupabaseUserAttribute(currentUserId, email);

  const confirmedAppUserId = await Purchases.getAppUserID().catch(() => null);
  if (confirmedAppUserId !== currentUserId) {
    throw new Error(`RevenueCat jest zalogowany jako ${confirmedAppUserId ?? 'brak'}, a powinien być ${currentUserId}.`);
  }
};

export const mapCustomerInfoToSubscriptionState = (info: CustomerInfo, currentUserId?: string): SubscriptionState | undefined => {
  // BARDZO WAŻNE: Zabezpieczenie przed transferem (szczególnie Android)
  if (isOwnedByAnotherIdentifiedUser(info, currentUserId)) {
    // Ten paragon należy do kogoś innego. Zwracamy stan expired/free żeby aplikacja nie przyznała Premium.
    return {
      tier: 'free',
      analysesUsed: 0,
      usageMonth: currentMonth(),
      monthlyLimit: FREE_ANALYSIS_LIMIT,
      provider: 'revenuecat',
      status: 'expired'
    };
  }

  const entitlement = info.entitlements.active[ENTITLEMENT_ID];
  
  if (entitlement) {
    return {
      tier: 'premium',
      analysesUsed: 0, 
      usageMonth: currentMonth(),
      monthlyLimit: PREMIUM_ANALYSIS_LIMIT,
      provider: 'revenuecat',
      status: entitlement.isActive ? 'active' : 'inactive',
      expiresAt: entitlement.expirationDate || new Date(Date.now() + 31536000000).toISOString() 
    };
  }

  const allEntitlement = info.entitlements.all[ENTITLEMENT_ID];
  if (allEntitlement && !allEntitlement.isActive) {
    return {
      tier: 'free',
      analysesUsed: 0,
      usageMonth: currentMonth(),
      monthlyLimit: FREE_ANALYSIS_LIMIT,
      provider: 'revenuecat',
      status: 'expired'
    };
  }

  return undefined; 
};

export const revenueCatService = {
  isDemoMode() {
    return false; // Wyłączamy tryb demo!
  },

  async configure(appUserID?: string) {
    await configurePurchases(appUserID);
  },

  async login(userId: string, email?: string | null) {
    try {
      await configurePurchases(userId);
      const appUserId = await Purchases.getAppUserID().catch(() => null);
      if (appUserId !== userId) {
        const { created } = await Purchases.logIn(userId);
        console.log(`Zalogowano w RevenueCat: ${userId} (Utworzono nowy? ${created})`);
      } else {
        console.log(`RevenueCat już używa właściwego usera: ${userId}`);
      }
      await attachSupabaseUserAttribute(userId, email);
    } catch (e) {
      console.error("Błąd logowania w RevenueCat:", e);
    }
  },

  async logout() {
    try {
      await configurePurchases();
      await Purchases.logOut();
      console.log("Wylogowano z RevenueCat.");
    } catch (e) {
      console.error("Błąd wylogowywania z RevenueCat:", e);
    }
  },

  async checkSubscriptionStatus(currentUserId?: string): Promise<SubscriptionState | null> {
    try {
      await ensureRevenueCatUser(currentUserId);
      const customerInfo = await Purchases.getCustomerInfo();
      return mapCustomerInfoToSubscriptionState(customerInfo, currentUserId) || null;
    } catch (e) {
      console.warn("Błąd sprawdzania statusu subskrypcji:", e);
      return null;
    }
  },

  async getOfferings(currentUserId?: string) {
    try {
      await ensureRevenueCatUser(currentUserId);
      const offerings = await Purchases.getOfferings();
      if (offerings.current !== null) {
        return offerings.current.availablePackages;
      }
      return [];
    } catch (e) {
      console.warn("Błąd podczas pobierania pakietów RC:", e);
      return [];
    }
  },

  async purchasePackage(pkg: PurchasesPackage, currentUserId?: string): Promise<PurchaseResult> {
    try {
      await ensureRevenueCatUser(currentUserId);
      const appUserId = await Purchases.getAppUserID().catch(() => null);
      console.log(`[RevenueCat] Start zakupu. Supabase user: ${currentUserId ?? 'brak'}, RevenueCat appUserID: ${appUserId ?? 'brak'}.`);
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      if (isOwnedByAnotherIdentifiedUser(customerInfo, currentUserId)) {
        return {
          success: false,
          error: SUBSCRIPTION_ASSIGNED_TO_ANOTHER_ACCOUNT_ERROR
        };
      }

      const subState = mapCustomerInfoToSubscriptionState(customerInfo, currentUserId);
      
      if (subState && subState.status === 'active') {
        return {
          success: true,
          subscription: subState,
          message: 'Płatność zakończona sukcesem. Dziękujemy!'
        };
      } else {
        return {
          success: false,
          error: 'Płatność się powiodła, ale nie otrzymaliśmy potwierdzenia uprawnień. Spróbuj przywrócić zakup.'
        };
      }
    } catch (e: any) {
      if (!e.userCancelled) {
        console.warn("Błąd podczas zakupu:", e);
      }
      if (e.code === PURCHASES_ERROR_CODE.RECEIPT_ALREADY_IN_USE_ERROR) {
        return {
          success: false,
          error: SUBSCRIPTION_ASSIGNED_TO_ANOTHER_ACCOUNT_ERROR
        };
      }
      return {
        success: false,
        error: e.userCancelled ? 'Anulowano płatność' : e.message
      };
    }
  },

  async purchasePremium(plan: 'monthly' | 'yearly' = 'monthly', currentUserId?: string): Promise<PurchaseResult> {
    // Zachowujemy tę metodę dla wstecznej kompatybilności, ale rekomendowane jest wywoływanie purchasePackage bezpośrednio z UI
    return {
      success: false,
      error: 'Użyj purchasePackage zamiast purchasePremium w trybie produkcyjnym.'
    };
  },

  async restorePurchases(currentUserId?: string): Promise<PurchaseResult> {
    try {
      await ensureRevenueCatUser(currentUserId);
      const appUserId = await Purchases.getAppUserID().catch(() => null);
      console.log(`[RevenueCat] Start restore. Supabase user: ${currentUserId ?? 'brak'}, RevenueCat appUserID: ${appUserId ?? 'brak'}.`);
      const customerInfo = await Purchases.restorePurchases();
      
      // Strict check to prevent Android Sandbox (and other edge cases) from transferring the receipt to a new account
      if (isOwnedByAnotherIdentifiedUser(customerInfo, currentUserId)) {
        return {
          success: false,
          error: SUBSCRIPTION_ASSIGNED_TO_ANOTHER_ACCOUNT_ERROR
        };
      }

      const subState = mapCustomerInfoToSubscriptionState(customerInfo, currentUserId);
      
      if (subState && subState.status === 'active') {
        return {
          success: true,
          subscription: subState,
          message: 'Zakupy przywrócone pomyślnie!'
        };
      } else if (subState && subState.status === 'expired') {
        return {
          success: false,
          subscription: subState, // Przekazujemy stan expired żeby zaktualizować backend
          error: 'Twoja subskrypcja wygasła.'
        };
      } else {
        return {
          success: false,
          error: 'Nie znaleziono żadnych aktywnych subskrypcji do przywrócenia.'
        };
      }
    } catch (e: any) {
      console.warn("Błąd podczas przywracania zakupów:", e);
      
      let errorMessage = e.message;
      // Sprawdzamy czy to błąd związany z zablokowaniem przenoszenia na inne konto
      if (e.code === PURCHASES_ERROR_CODE.RECEIPT_ALREADY_IN_USE_ERROR) {
        errorMessage = SUBSCRIPTION_ASSIGNED_TO_ANOTHER_ACCOUNT_ERROR;
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  }
};

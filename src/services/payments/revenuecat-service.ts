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

const currentMonth = () => new Date().toISOString().slice(0, 7);

export const mapCustomerInfoToSubscriptionState = (info: CustomerInfo, currentUserId?: string): SubscriptionState | undefined => {
  // BARDZO WAŻNE: Zabezpieczenie przed transferem (szczególnie Android)
  if (currentUserId && info.originalAppUserId && info.originalAppUserId !== currentUserId) {
    if (!info.originalAppUserId.startsWith('$RCAnonymous')) {
      // Ten paragon należy do kogoś innego. Zwracamy stan expired/free żeby aplikacja nie przyznała Premium.
      return {
        tier: 'free',
        analysesUsed: 0,
        usageMonth: currentMonth(),
        monthlyLimit: 3,
        provider: 'revenuecat',
        status: 'expired'
      };
    }
  }

  const entitlement = info.entitlements.active[ENTITLEMENT_ID];
  
  if (entitlement) {
    return {
      tier: 'premium',
      analysesUsed: 0, 
      usageMonth: currentMonth(),
      monthlyLimit: 200, 
      provider: entitlement.store === 'app_store' ? 'apple' : entitlement.store === 'play_store' ? 'google' : 'revenuecat',
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
      monthlyLimit: 3, 
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

  async configure() {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG); // Przydatne do debugowania

    if (Platform.OS === 'ios') {
      if (API_KEY_IOS) {
        Purchases.configure({ apiKey: API_KEY_IOS });
      }
    } else if (Platform.OS === 'android') {
      if (API_KEY_ANDROID) {
        Purchases.configure({ apiKey: API_KEY_ANDROID });
      }
    }
  },

  async login(userId: string) {
    try {
      const { customerInfo, created } = await Purchases.logIn(userId);
      console.log(`Zalogowano w RevenueCat: ${userId} (Utworzono nowy? ${created})`);
    } catch (e) {
      console.error("Błąd logowania w RevenueCat:", e);
    }
  },

  async logout() {
    try {
      await Purchases.logOut();
      console.log("Wylogowano z RevenueCat.");
    } catch (e) {
      console.error("Błąd wylogowywania z RevenueCat:", e);
    }
  },

  async checkSubscriptionStatus(currentUserId?: string): Promise<SubscriptionState | null> {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      return mapCustomerInfoToSubscriptionState(customerInfo, currentUserId) || null;
    } catch (e) {
      console.warn("Błąd sprawdzania statusu subskrypcji:", e);
      return null;
    }
  },

  async getOfferings() {
    try {
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
      const { customerInfo } = await Purchases.purchasePackage(pkg);
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
      const customerInfo = await Purchases.restorePurchases();
      
      // Strict check to prevent Android Sandbox (and other edge cases) from transferring the receipt to a new account
      if (currentUserId && customerInfo.originalAppUserId && customerInfo.originalAppUserId !== currentUserId) {
        // Sprawdzamy czy to nie jest przypadkiem zanonimizowane ID sprzed logowania
        if (!customerInfo.originalAppUserId.startsWith('$RCAnonymous')) {
          return {
            success: false,
            error: 'Ta subskrypcja została pierwotnie zakupiona na innym koncie. Zaloguj się na właściwe konto, aby ją przywrócić.'
          };
        }
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
        // Fallback: W środowisku testowym czasami ten błąd wyskakuje mimo że mamy to samo konto.
        // Sprawdźmy, czy lokalnie RevenueCat widzi aktywne Premium.
        try {
          const localInfo = await Purchases.getCustomerInfo();
          const localState = mapCustomerInfoToSubscriptionState(localInfo);
          if (localState && localState.status === 'active') {
            return {
              success: true,
              subscription: localState,
              message: 'Zakupy przywrócone (z bazy lokalnej).'
            };
          }
        } catch (innerErr) {
          // Ignoruj błąd i zwróć pierwotny
        }
        errorMessage = 'Ta subskrypcja jest już przypisana do innego konta. Zaloguj się na właściwe konto, aby ją przywrócić.';
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  }
};

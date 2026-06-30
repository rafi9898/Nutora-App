import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL, PurchasesPackage, CustomerInfo } from 'react-native-purchases';
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

const mapCustomerInfoToSubscriptionState = (info: CustomerInfo): SubscriptionState | undefined => {
  const entitlement = info.entitlements.active[ENTITLEMENT_ID];
  
  if (!entitlement) {
    return undefined; // Brak aktywnej subskrypcji
  }

  return {
    tier: 'premium',
    analysesUsed: 0, // docelowo może to pochodzić z bazy Supabase, ale zostawmy na razie tak
    usageMonth: currentMonth(),
    monthlyLimit: 200, // limit 200 zdjęć dla Premium
    provider: entitlement.store === 'app_store' ? 'apple' : entitlement.store === 'play_store' ? 'google' : 'revenuecat',
    status: entitlement.isActive ? 'active' : 'inactive',
    expiresAt: entitlement.expirationDate || new Date(Date.now() + 31536000000).toISOString() // fallback +1 rok
  };
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

  async checkSubscriptionStatus(): Promise<SubscriptionState | null> {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      const subState = mapCustomerInfoToSubscriptionState(customerInfo);
      return subState || null;
    } catch (e) {
      console.warn("Błąd podczas sprawdzania statusu subskrypcji RC:", e);
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

  async purchasePackage(pkg: PurchasesPackage): Promise<PurchaseResult> {
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      
      const subState = mapCustomerInfoToSubscriptionState(customerInfo);
      
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

  async purchasePremium(plan: 'monthly' | 'yearly' = 'monthly'): Promise<PurchaseResult> {
    // Zachowujemy tę metodę dla wstecznej kompatybilności, ale rekomendowane jest wywoływanie purchasePackage bezpośrednio z UI
    return {
      success: false,
      error: 'Użyj purchasePackage zamiast purchasePremium w trybie produkcyjnym.'
    };
  },

  async restorePurchases(): Promise<PurchaseResult> {
    try {
      const customerInfo = await Purchases.restorePurchases();
      const subState = mapCustomerInfoToSubscriptionState(customerInfo);
      
      if (subState && subState.status === 'active') {
        return {
          success: true,
          subscription: subState,
          message: 'Zakupy przywrócone pomyślnie!'
        };
      } else {
        return {
          success: false,
          error: 'Nie znaleziono żadnych aktywnych subskrypcji do przywrócenia.'
        };
      }
    } catch (e: any) {
      console.warn("Błąd podczas przywracania zakupów:", e);
      return {
        success: false,
        error: e.message
      };
    }
  }
};

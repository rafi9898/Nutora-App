import type { SubscriptionState } from '@/src/types';

export type PurchaseResult = {
  success: boolean;
  subscription?: SubscriptionState;
  message?: string;
};

const currentMonth = () => new Date().toISOString().slice(0, 7);

export const revenueCatService = {
  isDemoMode() {
    return true; // Zawsze true na czas odpięcia
  },

  async configure() {
    // Puste - paczka odpięta
  },

  async checkSubscriptionStatus(): Promise<boolean> {
    return false;
  },

  async purchasePremium(plan: 'monthly' | 'yearly' = 'monthly'): Promise<PurchaseResult> {
    const expires = new Date();
    if (plan === 'yearly') {
      expires.setFullYear(expires.getFullYear() + 1);
    } else {
      expires.setMonth(expires.getMonth() + 1);
    }

    return {
      success: true,
      subscription: {
        tier: 'premium',
        analysesUsed: 0,
        usageMonth: currentMonth(),
        monthlyLimit: 200,
        provider: 'demo',
        status: 'active',
        expiresAt: expires.toISOString()
      },
      message: 'Premium aktywowane w trybie demo (płatności tymczasowo wyłączone).'
    };
  },

  async restorePurchases(): Promise<PurchaseResult> {
    const expires = new Date();
    expires.setFullYear(expires.getFullYear() + 1);

    return {
      success: true,
      subscription: {
        tier: 'premium',
        analysesUsed: 0,
        usageMonth: currentMonth(),
        monthlyLimit: 200,
        provider: 'demo',
        status: 'active',
        expiresAt: expires.toISOString()
      },
      message: 'Zakup przywrócony w trybie demo (płatności tymczasowo wyłączone).'
    };
  }
};

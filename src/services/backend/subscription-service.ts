import { getSupabaseClient } from '@/src/lib/supabase';
import type { SubscriptionState, SubscriptionTier } from '@/src/types';

const currentMonth = () => new Date().toISOString().slice(0, 7);
const FREE_ANALYSIS_LIMIT = 5;
const PREMIUM_ANALYSIS_LIMIT = 200;

const mapSubscription = (data: {
  tier: SubscriptionTier;
  analyses_used_month: number;
  usage_month: string;
  analysis_limit_monthly?: number | null;
  status?: SubscriptionState['status'];
  provider?: 'revenuecat' | 'manual' | null;
  current_period_end?: string | null;
}): SubscriptionState => ({
  tier: data.tier,
  analysesUsed: data.analyses_used_month,
  usageMonth: data.usage_month,
  monthlyLimit: data.tier === 'premium' ? PREMIUM_ANALYSIS_LIMIT : data.analysis_limit_monthly ?? FREE_ANALYSIS_LIMIT,
  status: data.status,
  provider: data.provider,
  expiresAt: data.current_period_end ?? undefined
});

export const subscriptionService = {
  async getSubscription(userId?: string): Promise<SubscriptionState | null> {
    const supabase = getSupabaseClient();
    const { data: authData, error: authError } = userId ? { data: null, error: null } : await supabase.auth.getUser();
    const resolvedUserId = userId ?? authData?.user?.id;

    if (authError) throw authError;
    if (!resolvedUserId) return null;

    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', resolvedUserId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return mapSubscription(data);
  },

  async setSubscriptionTier(userId: string, tier: SubscriptionTier, plan: 'monthly' | 'yearly' = 'monthly'): Promise<SubscriptionState> {
    const supabase = getSupabaseClient();
    
    let currentPeriodEnd = null;
    if (tier === 'premium') {
      const expires = new Date();
      if (plan === 'yearly') {
        expires.setFullYear(expires.getFullYear() + 1);
      } else {
        expires.setMonth(expires.getMonth() + 1);
      }
      currentPeriodEnd = expires.toISOString();
    }

    const payload = {
      user_id: userId,
      tier,
      status: tier === 'premium' ? 'active' as const : 'inactive' as const,
      provider: 'manual' as const,
      analysis_limit_monthly: tier === 'premium' ? PREMIUM_ANALYSIS_LIMIT : FREE_ANALYSIS_LIMIT,
      usage_month: currentMonth(),
      updated_at: new Date().toISOString(),
      current_period_end: currentPeriodEnd
    };

    // TODO: Replace manual tier changes with RevenueCat webhook updates in
    // production. Mobile should read entitlement state, not grant it.
    const { data, error } = await supabase
      .from('subscriptions')
      .upsert(payload, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) throw error;

    return mapSubscription(data);
  },

  async syncFromBackend(userId?: string): Promise<SubscriptionState | null> {
    return this.getSubscription(userId);
  }
};

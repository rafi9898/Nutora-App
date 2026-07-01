import { getSupabaseClient } from '@/src/lib/supabase';
import type { SubscriptionState, SubscriptionTier } from '@/src/types';

const currentMonth = () => new Date().toISOString().slice(0, 7);
const FREE_ANALYSIS_LIMIT = 5;
const PREMIUM_ANALYSIS_LIMIT = 200;

const isPastDate = (value?: string | null) => Boolean(value && new Date(value).getTime() <= Date.now());

const mapSubscription = (data: {
  tier: SubscriptionTier;
  analyses_used_month: number;
  usage_month: string;
  analysis_limit_monthly?: number | null;
  status?: SubscriptionState['status'];
  provider?: 'revenuecat' | 'manual' | null;
  current_period_end?: string | null;
}): SubscriptionState => {
  const expiredPremium = data.tier === 'premium' && data.status === 'active' && isPastDate(data.current_period_end);
  const tier = expiredPremium ? 'free' : data.tier;

  return {
    tier,
    analysesUsed: data.analyses_used_month,
    usageMonth: data.usage_month,
    monthlyLimit: tier === 'premium' ? PREMIUM_ANALYSIS_LIMIT : data.analysis_limit_monthly ?? FREE_ANALYSIS_LIMIT,
    status: expiredPremium ? 'expired' : data.status,
    provider: data.provider,
    expiresAt: data.current_period_end ?? undefined
  };
};

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

  async setSubscriptionTier(userId: string, tier: SubscriptionTier, _plan: 'monthly' | 'yearly' = 'monthly'): Promise<SubscriptionState> {
    if (tier === 'premium') {
      throw new Error('Premium subscriptions are managed by RevenueCat webhooks.');
    }

    const supabase = getSupabaseClient();

    const payload = {
      user_id: userId,
      tier,
      status: 'inactive' as const,
      provider: 'manual' as const,
      analysis_limit_monthly: FREE_ANALYSIS_LIMIT,
      usage_month: currentMonth(),
      updated_at: new Date().toISOString(),
      current_period_end: null
    };

    const { data, error } = await supabase
      .from('subscriptions')
      .upsert(payload, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) throw error;

    return mapSubscription(data);
  },

  async syncRevenueCatSubscription(options: { confirmOnly?: boolean } = {}): Promise<SubscriptionState | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.functions.invoke<{
      subscription?: {
        tier: SubscriptionTier;
        analyses_used_month: number;
        usage_month: string;
        analysis_limit_monthly?: number | null;
        status?: SubscriptionState['status'];
        provider?: 'revenuecat' | 'manual' | null;
        current_period_end?: string | null;
      };
      error?: string;
    }>('sync-revenuecat-subscription', {
      method: 'POST',
      body: options
    });

    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    if (!data?.subscription) return null;

    return mapSubscription(data.subscription);
  },

  async syncFromBackend(userId?: string): Promise<SubscriptionState | null> {
    return this.getSubscription(userId);
  }
};

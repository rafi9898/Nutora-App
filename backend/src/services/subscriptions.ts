import { config } from '../config.js';
import { supabaseAdmin } from '../lib/supabase.js';

type SubscriptionRow = {
  user_id: string;
  tier: 'free' | 'premium';
  status: 'active' | 'inactive' | 'trialing' | 'cancelled' | 'expired';
  analyses_used_month: number;
  analysis_limit_monthly: number | null;
  usage_month: string;
  current_period_end?: string | null;
};

const currentMonth = () => new Date().toISOString().slice(0, 7);

const isExpiredPremium = (subscription: SubscriptionRow) => {
  return Boolean(
    subscription.tier === 'premium' &&
    subscription.status === 'active' &&
    subscription.current_period_end &&
    new Date(subscription.current_period_end).getTime() <= Date.now()
  );
};

const expireSubscription = async (subscription: SubscriptionRow): Promise<SubscriptionRow> => {
  if (!supabaseAdmin || !isExpiredPremium(subscription)) return subscription;

  const { data, error } = await supabaseAdmin
    .from('subscriptions')
    .update({
      tier: 'free',
      status: 'expired',
      analysis_limit_monthly: config.FREE_ANALYSIS_LIMIT,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', subscription.user_id)
    .select('user_id,tier,status,analyses_used_month,analysis_limit_monthly,usage_month,current_period_end')
    .single<SubscriptionRow>();

  if (error) throw error;
  return data;
};

export const ensureAnalysisAllowance = async (userId: string) => {
  if (!supabaseAdmin) {
    return {
      allowed: true,
      remaining: config.FREE_ANALYSIS_LIMIT,
      reason: 'supabase_not_configured'
    };
  }

  const month = currentMonth();
  const { data, error } = await supabaseAdmin
    .from('subscriptions')
    .select('user_id,tier,status,analyses_used_month,analysis_limit_monthly,usage_month,current_period_end')
    .eq('user_id', userId)
    .maybeSingle<SubscriptionRow>();

  if (error) throw error;

  if (!data) {
    const { data: inserted, error: insertError } = await supabaseAdmin
      .from('subscriptions')
      .insert({
        user_id: userId,
        tier: 'free',
        status: 'inactive',
        analyses_used_month: 0,
        analysis_limit_monthly: config.FREE_ANALYSIS_LIMIT,
        usage_month: month,
        provider: 'manual'
      })
      .select('user_id,tier,status,analyses_used_month,analysis_limit_monthly,usage_month')
      .single<SubscriptionRow>();

    if (insertError) throw insertError;
    return { allowed: true, remaining: inserted.analysis_limit_monthly ?? config.FREE_ANALYSIS_LIMIT };
  }

  const subscription = await expireSubscription(data);

  if (subscription.tier === 'premium' && subscription.status === 'active') {
    return { allowed: true, remaining: null };
  }

  const used = subscription.usage_month === month ? subscription.analyses_used_month : 0;
  const limit = subscription.analysis_limit_monthly ?? config.FREE_ANALYSIS_LIMIT;
  return { allowed: used < limit, remaining: Math.max(limit - used, 0) };
};

export const incrementAnalysisUsage = async (userId: string) => {
  if (!supabaseAdmin) return;

  const month = currentMonth();
  const { data } = await supabaseAdmin
    .from('subscriptions')
    .select('user_id,tier,status,analyses_used_month,analysis_limit_monthly,usage_month,current_period_end')
    .eq('user_id', userId)
    .maybeSingle<SubscriptionRow>();

  if (!data) return;
  const subscription = await expireSubscription(data);
  if (subscription.tier === 'premium') return;

  const nextUsed = subscription.usage_month === month ? subscription.analyses_used_month + 1 : 1;
  await supabaseAdmin
    .from('subscriptions')
    .update({ analyses_used_month: nextUsed, usage_month: month, updated_at: new Date().toISOString() })
    .eq('user_id', userId);
};

export const updateRevenueCatSubscription = async (input: {
  userId: string;
  customerId?: string;
  tier: 'free' | 'premium';
  status: 'active' | 'inactive' | 'trialing' | 'cancelled' | 'expired';
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
}) => {
  if (!supabaseAdmin) return { skipped: true };

  const { error } = await supabaseAdmin
    .from('subscriptions')
    .upsert({
      user_id: input.userId,
      tier: input.tier,
      status: input.status,
      provider: 'revenuecat',
      provider_customer_id: input.customerId ?? null,
      current_period_start: input.currentPeriodStart ?? null,
      current_period_end: input.currentPeriodEnd ?? null,
      analysis_limit_monthly: input.tier === 'premium' ? null : config.FREE_ANALYSIS_LIMIT,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });

  if (error) throw error;
  return { skipped: false };
};

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.48.1';

type RevenueCatEvent = {
  event?: {
    app_user_id?: string;
    original_app_user_id?: string;
    aliases?: string[];
    type?: string;
    purchased_at_ms?: number | null;
    expiration_at_ms?: number | null;
    product_id?: string;
    entitlement_id?: string;
  };
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json' }
});

const getClient = () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) throw new Error('Supabase service credentials are missing.');

  return createClient(supabaseUrl, serviceRoleKey);
};

const msToIso = (value?: number | null) => value ? new Date(value).toISOString() : null;
const isSupabaseUserId = (value?: string | null) => Boolean(
  value?.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
);

const getUserId = (event?: RevenueCatEvent['event']) => {
  if (isSupabaseUserId(event?.app_user_id)) return event?.app_user_id;
  if (isSupabaseUserId(event?.original_app_user_id)) return event?.original_app_user_id;
  return null;
};

const hasFutureExpiration = (expirationAtMs?: number | null) => {
  return typeof expirationAtMs === 'number' && expirationAtMs > Date.now();
};

const mapRevenueCatEvent = (type?: string, expirationAtMs?: number | null) => {
  if (['INITIAL_PURCHASE', 'RENEWAL', 'UNCANCELLATION', 'PRODUCT_CHANGE', 'NON_RENEWING_PURCHASE'].includes(type ?? '')) {
    return { tier: 'premium' as const, status: 'active' as const };
  }

  if (type === 'CANCELLATION' || type === 'BILLING_ISSUE') {
    return hasFutureExpiration(expirationAtMs)
      ? { tier: 'premium' as const, status: 'active' as const }
      : { tier: 'free' as const, status: 'inactive' as const };
  }

  if (type === 'EXPIRATION') {
    return { tier: 'free' as const, status: 'expired' as const };
  }

  return null;
};

serve(async (request) => {
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const expectedSecret = Deno.env.get('REVENUECAT_WEBHOOK_SECRET');
  const receivedSecret = request.headers.get('Authorization')?.replace('Bearer ', '') ?? request.headers.get('x-revenuecat-signature');

  if (expectedSecret && receivedSecret !== expectedSecret) {
    return json({ error: 'Unauthorized' }, 401);
  }

  let body: RevenueCatEvent;

  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const event = body.event;
  const userId = getUserId(event);

  if (!userId) {
    return json({
      received: true,
      ignored: true,
      reason: 'missing_supabase_user_id',
      app_user_id: event?.app_user_id ?? null,
      original_app_user_id: event?.original_app_user_id ?? null
    });
  }

  const mapped = mapRevenueCatEvent(event?.type, event?.expiration_at_ms);

  if (!mapped) {
    return json({ received: true, ignored: true });
  }

  const supabase = getClient();
  const periodStart = msToIso(event?.purchased_at_ms);
  const periodEnd = msToIso(event?.expiration_at_ms);

  const { error } = await supabase
    .from('subscriptions')
    .upsert({
      user_id: userId,
      tier: mapped.tier,
      provider: 'revenuecat',
      provider_customer_id: userId,
      status: mapped.status,
      current_period_start: periodStart,
      current_period_end: periodEnd,
      analysis_limit_monthly: mapped.tier === 'premium' ? null : Number(Deno.env.get('FREE_ANALYSIS_LIMIT') || 5),
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });

  if (error) return json({ error: error.message }, 500);

  return json({ received: true });
});

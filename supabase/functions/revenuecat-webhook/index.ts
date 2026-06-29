import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.48.1';

type RevenueCatEvent = {
  event?: {
    app_user_id?: string;
    original_app_user_id?: string;
    type?: string;
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

const isActiveRevenueCatEvent = (type?: string) => {
  return ['INITIAL_PURCHASE', 'RENEWAL', 'UNCANCELLATION', 'PRODUCT_CHANGE', 'NON_RENEWING_PURCHASE'].includes(type ?? '');
};

const isInactiveRevenueCatEvent = (type?: string) => {
  return ['CANCELLATION', 'EXPIRATION', 'BILLING_ISSUE'].includes(type ?? '');
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
  const userId = event?.app_user_id ?? event?.original_app_user_id;

  if (!userId) return json({ error: 'Missing app_user_id' }, 400);

  const active = isActiveRevenueCatEvent(event?.type);
  const inactive = isInactiveRevenueCatEvent(event?.type);

  if (!active && !inactive) {
    return json({ received: true, ignored: true });
  }

  const supabase = getClient();
  const periodEnd = event?.expiration_at_ms ? new Date(event.expiration_at_ms).toISOString() : null;

  const { error } = await supabase
    .from('subscriptions')
    .upsert({
      user_id: userId,
      tier: active ? 'premium' : 'free',
      provider: 'revenuecat',
      provider_customer_id: userId,
      status: active ? 'active' : 'inactive',
      current_period_end: periodEnd,
      analysis_limit_monthly: active ? null : Number(Deno.env.get('FREE_ANALYSIS_LIMIT') || 5),
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });

  if (error) return json({ error: error.message }, 500);

  return json({ received: true });
});

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.48.1';

type RevenueCatSubscriberResponse = {
  subscriber?: {
    entitlements?: Record<string, {
      expires_date?: string | null;
      purchase_date?: string | null;
      product_identifier?: string | null;
    }>;
  };
};

type VerifiedEntitlement = {
  activePremium: boolean;
  purchaseDate: string | null;
  expiresDate: string | null;
  source: 'v1' | 'v2';
  projectId?: string | null;
};

type RevenueCatV2List<T> = {
  items?: T[];
  next_page?: string | null;
};

type RevenueCatProject = {
  id?: string;
};

type RevenueCatEntitlement = {
  id?: string;
  lookup_key?: string;
};

type RevenueCatActiveEntitlement = {
  entitlement_id?: string;
  expires_at?: number | string | null;
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json' }
});

const getEnv = (name: string) => {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
};

const getBearerToken = (request: Request) => {
  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) return null;
  return authorization.slice('Bearer '.length).trim();
};

const isFutureDate = (value?: string | null) => {
  if (!value) return true;
  return new Date(value).getTime() > Date.now();
};

const toIsoDate = (value?: string | number | null) => {
  if (!value) return null;
  const timestamp = typeof value === 'number' && value > 0 && value < 1_000_000_000_000
    ? value * 1000
    : value;
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
};

const revenueCatFetch = async (url: string, apiKey: string) => {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json'
    }
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  return { response, data, text };
};

const getRevenueCatProjectId = async (apiKey: string) => {
  const configuredProjectId = Deno.env.get('REVENUECAT_PROJECT_ID');
  if (configuredProjectId) return configuredProjectId;

  const projects = await revenueCatFetch('https://api.revenuecat.com/v2/projects?limit=20', apiKey);
  if (!projects.response.ok) {
    throw new Error(`RevenueCat API v2 projects failed: ${projects.response.status} ${projects.text}`);
  }

  const projectId = ((projects.data as RevenueCatV2List<RevenueCatProject>)?.items ?? []).find(project => project.id)?.id ?? null;
  if (!projectId) throw new Error('RevenueCat API v2 project_id not found.');
  return projectId;
};

const getRevenueCatEntitlement = async (apiKey: string, projectId: string, entitlementId: string) => {
  const entitlements = await revenueCatFetch(`https://api.revenuecat.com/v2/projects/${encodeURIComponent(projectId)}/entitlements?limit=100`, apiKey);
  if (!entitlements.response.ok) {
    throw new Error(`RevenueCat API v2 entitlements failed: ${entitlements.response.status} ${entitlements.text}`);
  }

  return ((entitlements.data as RevenueCatV2List<RevenueCatEntitlement>)?.items ?? [])
    .find(item => item.lookup_key === entitlementId || item.id === entitlementId) ?? null;
};

const verifyWithRevenueCatV2 = async (apiKey: string, userId: string, entitlementId: string): Promise<VerifiedEntitlement> => {
  const projectId = await getRevenueCatProjectId(apiKey);
  const entitlement = await getRevenueCatEntitlement(apiKey, projectId, entitlementId);
  if (!entitlement?.id) {
    throw new Error(`RevenueCat entitlement ${entitlementId} not found.`);
  }

  const activeEntitlements = await revenueCatFetch(`https://api.revenuecat.com/v2/projects/${encodeURIComponent(projectId)}/customers/${encodeURIComponent(userId)}/active_entitlements?limit=100`, apiKey);
  if (activeEntitlements.response.status === 404) {
    return { activePremium: false, purchaseDate: null, expiresDate: null, source: 'v2', projectId };
  }
  if (!activeEntitlements.response.ok) {
    throw new Error(`RevenueCat API v2 active entitlements failed: ${activeEntitlements.response.status} ${activeEntitlements.text}`);
  }

  const items = ((activeEntitlements.data as RevenueCatV2List<RevenueCatActiveEntitlement>)?.items ?? []);
  const activeEntitlement = items.find(item => item.entitlement_id === entitlement.id);

  return {
    activePremium: Boolean(activeEntitlement),
    purchaseDate: null,
    expiresDate: toIsoDate(activeEntitlement?.expires_at),
    source: 'v2',
    projectId
  };
};

const verifyWithRevenueCat = async (apiKey: string, userId: string, entitlementId: string): Promise<VerifiedEntitlement> => {
  const revenueCatResponse = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(userId)}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json'
    }
  });

  const text = await revenueCatResponse.text();
  const data = text ? JSON.parse(text) as RevenueCatSubscriberResponse & { code?: number } : null;

  if (!revenueCatResponse.ok) {
    if (revenueCatResponse.status === 403 && data?.code === 7723) {
      return verifyWithRevenueCatV2(apiKey, userId, entitlementId);
    }

    throw new Error(`RevenueCat verification failed: ${revenueCatResponse.status} ${text}`);
  }

  const entitlement = data?.subscriber?.entitlements?.[entitlementId];
  return {
    activePremium: Boolean(entitlement && isFutureDate(entitlement.expires_date)),
    purchaseDate: entitlement?.purchase_date ?? null,
    expiresDate: entitlement?.expires_date ?? null,
    source: 'v1'
  };
};

serve(async (request) => {
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const requestBody = await request.json().catch(() => ({}));
    const confirmOnly = requestBody?.confirmOnly === true;
    const supabaseUrl = getEnv('SUPABASE_URL');
    const serviceRoleKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');
    const revenueCatSecretKey = getEnv('REVENUECAT_SECRET_API_KEY');
    const entitlementId = Deno.env.get('REVENUECAT_ENTITLEMENT_ID') || 'premium';
    const freeAnalysisLimit = Number(Deno.env.get('FREE_ANALYSIS_LIMIT') || 5);

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const token = getBearerToken(request);
    if (!token) return json({ error: 'Missing auth token' }, 401);

    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authData.user) return json({ error: 'Invalid auth token' }, 401);
    const userId = authData.user.id;

    const verifiedEntitlement = await verifyWithRevenueCat(revenueCatSecretKey, userId, entitlementId);
    const activePremium = verifiedEntitlement.activePremium;
    const now = new Date().toISOString();

    if (confirmOnly && !activePremium) {
      const { data: existingSubscription, error: existingError } = await supabase
        .from('subscriptions')
        .select()
        .eq('user_id', userId)
        .maybeSingle();

      if (existingError) return json({ error: existingError.message }, 500);

      return json({
        subscription: existingSubscription,
        revenueCatAppUserId: userId,
        activePremium,
        verificationPending: true,
        revenueCatApi: verifiedEntitlement.source,
        revenueCatProjectId: verifiedEntitlement.projectId ?? null
      });
    }

    const { data, error } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: userId,
        tier: activePremium ? 'premium' : 'free',
        provider: activePremium ? 'revenuecat' : 'manual',
        provider_customer_id: activePremium ? userId : null,
        status: activePremium ? 'active' : 'inactive',
        current_period_start: verifiedEntitlement.purchaseDate,
        current_period_end: verifiedEntitlement.expiresDate,
        analysis_limit_monthly: activePremium ? null : freeAnalysisLimit,
        updated_at: now
      }, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) return json({ error: error.message }, 500);

    return json({
      subscription: data,
      revenueCatAppUserId: userId,
      activePremium,
      revenueCatApi: verifiedEntitlement.source,
      revenueCatProjectId: verifiedEntitlement.projectId ?? null
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unknown sync error' }, 500);
  }
});

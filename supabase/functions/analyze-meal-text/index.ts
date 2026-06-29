import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.48.1';

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'other';

type AnalyzeMealTextRequest = {
  text?: string;
  locale?: string;
};

type SubscriptionRow = {
  id: string;
  user_id: string;
  tier: 'free' | 'premium';
  status: 'active' | 'inactive' | 'trialing' | 'cancelled' | 'expired';
  analyses_used_month: number;
  analysis_limit_monthly: number | null;
  usage_month: string;
};

type AiMealAnalysis = {
  mealName: string;
  mealType: MealType;
  estimatedCalories: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  confidenceScore: number;
  aiNotes: string;
  items: Array<{
    name: string;
    estimatedWeightG: number;
    estimatedCalories: number;
    proteinG: number;
    fatG: number;
    carbsG: number;
    confidenceScore: number;
  }>;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' }
});

const openAiMealAnalysisSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['mealName', 'mealType', 'estimatedCalories', 'proteinG', 'fatG', 'carbsG', 'confidenceScore', 'aiNotes', 'items'],
  properties: {
    mealName: { type: 'string' },
    mealType: { type: 'string', enum: ['breakfast', 'lunch', 'dinner', 'snack', 'other'] },
    estimatedCalories: { type: 'integer', minimum: 0 },
    proteinG: { type: 'integer', minimum: 0 },
    fatG: { type: 'integer', minimum: 0 },
    carbsG: { type: 'integer', minimum: 0 },
    confidenceScore: { type: 'number', minimum: 0, maximum: 1 },
    aiNotes: { type: 'string' },
    items: {
      type: 'array',
      minItems: 1,
      maxItems: 8,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'estimatedWeightG', 'estimatedCalories', 'proteinG', 'fatG', 'carbsG', 'confidenceScore'],
        properties: {
          name: { type: 'string' },
          estimatedWeightG: { type: 'integer', minimum: 0 },
          estimatedCalories: { type: 'integer', minimum: 0 },
          proteinG: { type: 'integer', minimum: 0 },
          fatG: { type: 'integer', minimum: 0 },
          carbsG: { type: 'integer', minimum: 0 },
          confidenceScore: { type: 'number', minimum: 0, maximum: 1 }
        }
      }
    }
  }
};

const getOutputText = (response: any) => {
  return response.choices?.[0]?.message?.content;
};

const getUserFromAuthHeader = async (authorization: string | null) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

  if (!supabaseUrl || !supabaseAnonKey || !authorization) return null;

  const token = authorization.replace('Bearer ', '');
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authorization } }
  });
  const { data, error } = await supabase.auth.getUser(token);

  if (error) return null;
  return data.user;
};

const createLogClient = () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) return null;

  return createClient(supabaseUrl, serviceRoleKey);
};

const currentMonth = () => new Date().toISOString().slice(0, 7);
const freeAnalysisLimit = () => Number(Deno.env.get('FREE_ANALYSIS_LIMIT') || 5);
const premiumAnalysisLimit = () => Number(Deno.env.get('PREMIUM_ANALYSIS_LIMIT') || 200);

const getOrCreateSubscription = async (userId: string, deviceId: string | null) => {
  const supabase = createLogClient();
  if (!supabase) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured.');

  const month = currentMonth();
  const { data: existing, error: selectError } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle<SubscriptionRow>();

  if (selectError) throw selectError;

  if (!existing) {
    if (deviceId) {
      const { data: deviceSubs, error: deviceError } = await supabase
        .from('subscriptions')
        .select('user_id')
        .eq('device_id', deviceId);

      if (!deviceError && deviceSubs && deviceSubs.length >= 3) {
        throw new Error('device_limit_reached');
      }
    }

    const { data, error } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        device_id: deviceId,
        tier: 'free',
        status: 'inactive',
        provider: 'manual',
        analyses_used_month: 0,
        analysis_limit_monthly: freeAnalysisLimit(),
        usage_month: month
      })
      .select()
      .single<SubscriptionRow>();

    if (error) throw error;
    return data;
  }

  if (existing.usage_month !== month) {
    const { data, error } = await supabase
      .from('subscriptions')
      .update({
        analyses_used_month: 0,
        analysis_limit_monthly: existing.tier === 'premium' ? premiumAnalysisLimit() : existing.analysis_limit_monthly ?? freeAnalysisLimit(),
        usage_month: month,
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id)
      .select()
      .single<SubscriptionRow>();

    if (error) throw error;
    return data;
  }

  return existing;
};

const checkAnalysisAllowance = async (userId: string, deviceId: string | null) => {
  const subscription = await getOrCreateSubscription(userId, deviceId);

  const monthlyLimit = subscription.analysis_limit_monthly ?? (subscription.tier === 'premium' ? premiumAnalysisLimit() : freeAnalysisLimit());

  return {
    allowed: subscription.analyses_used_month < monthlyLimit,
    subscription,
    monthlyLimit
  };
};

const incrementAnalysisUsage = async (subscription: SubscriptionRow) => {
  const supabase = createLogClient();
  if (!supabase) return;

  await supabase
    .from('subscriptions')
    .update({
      analyses_used_month: subscription.analyses_used_month + 1,
      updated_at: new Date().toISOString()
    })
    .eq('id', subscription.id);
};

const logAnalysis = async (payload: {
  userId: string;
  text?: string;
  status: 'completed' | 'failed';
  provider: string;
  requestPayload?: Record<string, unknown>;
  responsePayload?: Record<string, unknown>;
  errorMessage?: string;
}) => {
  const supabase = createLogClient();
  if (!supabase) return;

  await supabase.from('ai_analysis_logs').insert({
    user_id: payload.userId,
    photo_url: payload.text ?? null,
    status: payload.status,
    provider: payload.provider,
    request_payload: payload.requestPayload ?? null,
    response_payload: payload.responsePayload ?? null,
    error_message: payload.errorMessage ?? null
  });
};

const languageNames: Record<string, string> = {
  pl: 'polskim',
  en: 'angielskim',
  es: 'hiszpańskim',
  de: 'niemieckim',
  fr: 'francuskim',
  it: 'włoskim',
  pt: 'portugalskim',
  uk: 'ukraińskim'
};

const analyzeWithOpenAi = async (text: string, locale: string): Promise<AiMealAnalysis> => {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  const model = Deno.env.get('OPENAI_MODEL') || 'gpt-4o-mini';
  const languageName = languageNames[locale] || 'angielskim';

  if (!apiKey) throw new Error('OPENAI_API_KEY is not configured.');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'text',
            text: [
              'Analyze the following text describing a user meal for the Nutora app.',
              `CRITICAL: You MUST write the 'mealName' and the 'name' of ALL ingredients in ${languageName}. This is mandatory.`,
              'Do not round values (weight, calories, macros) to tens or hundreds. Provide precise estimates, e.g., instead of 500 kcal write 482 kcal.',
              'Estimate the weight of each described ingredient and calculate nutritional values based on official tables.',
              'If unsure about an ingredient, lower the confidenceScore and explain in aiNotes (also in the requested language).',
              'Do not provide medical advice. This is a precise nutritional estimate for the user to verify.',
              `Here is the text to analyze: "${text}"`
            ].join(' ')
          }
        ]
      }],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'meal_photo_analysis',
          strict: true,
          schema: openAiMealAnalysisSchema
        }
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const outputText = getOutputText(data);

  if (!outputText) throw new Error('OpenAI response did not contain output text.');

  return JSON.parse(outputText) as AiMealAnalysis;
};

serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const authorization = request.headers.get('Authorization');
  const deviceId = request.headers.get('x-device-id');
  const user = await getUserFromAuthHeader(authorization);

  if (!user) return json({ error: 'Unauthorized' }, 401);

  let body: AnalyzeMealTextRequest;

  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  if (!body.text) return json({ error: 'text is required' }, 400);

  try {
    const allowance = await checkAnalysisAllowance(user.id, deviceId);
    const isPremium = allowance.subscription.tier === 'premium';

    if (!isPremium && !allowance.allowed) {
      return json({
        error: {
          code: 'limit_exceeded',
          message: 'Miesięczny limit darmowych analiz został wykorzystany.'
        },
        subscription: {
          tier: allowance.subscription.tier,
          analysesUsed: allowance.subscription.analyses_used_month,
          monthlyLimit: allowance.monthlyLimit ?? null,
          usageMonth: allowance.subscription.usage_month
        }
      });
    }

    const locale = body.locale || 'en';
    const analysis = await analyzeWithOpenAi(body.text, locale);
    
    if (!isPremium) {
      await incrementAnalysisUsage(allowance.subscription);
    }

    await logAnalysis({
      userId: user.id,
      text: body.text,
      status: 'completed',
      provider: Deno.env.get('OPENAI_MODEL') || 'gpt-4o-mini',
      requestPayload: { text: body.text },
      responsePayload: analysis
    });

    return json({ analysis });
  } catch (error) {
    if (error instanceof Error && error.message === 'device_limit_reached') {
      return json({
        error: {
          code: 'device_limit_reached',
          message: 'Limit darmowych kont na tym urządzeniu został wyczerpany.'
        }
      });
    }

    await logAnalysis({
      userId: user.id,
      text: body.text,
      status: 'failed',
      provider: Deno.env.get('OPENAI_MODEL') || 'gpt-4o-mini',
      requestPayload: { text: body.text },
      errorMessage: error instanceof Error ? error.message : 'Unknown error'
    });

    return json({ error: 'Nie udało się przeanalizować posiłku.' }, 500);
  }
});

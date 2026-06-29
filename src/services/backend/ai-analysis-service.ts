import { getSupabaseClient, supabase } from '@/src/lib/supabase';
import type { AppLanguage } from '@/src/i18n';
import { mockAiService } from '@/src/services/mock-ai-service';
import type { Meal, MealItem, MealType } from '@/src/types';
import * as Application from 'expo-application';
import { Platform } from 'react-native';

const getDeviceId = async () => {
  try {
    if (Platform.OS === 'android') return Application.getAndroidId();
    if (Platform.OS === 'ios') return await Application.getIosIdForVendorAsync();
  } catch (e) {
    console.warn('Failed to get device ID', e);
  }
  return 'unknown-device-id';
};

const aiAnalysisEndpoint = process.env.EXPO_PUBLIC_AI_ANALYSIS_ENDPOINT;
const aiAnalysisMode = process.env.EXPO_PUBLIC_AI_ANALYSIS_MODE || 'mock';
const aiAnalysisEdgeFunction = process.env.EXPO_PUBLIC_AI_ANALYSIS_EDGE_FUNCTION || 'analyze-meal-photo';

export type AnalyzeMealPhotoInput = {
  photoUri: string;
  userId?: string;
  photoUrl?: string;
  locale?: AppLanguage;
};

export type AnalyzeMealTextInput = {
  text: string;
  userId?: string;
  locale?: AppLanguage;
};

type AiMealAnalysisPayload = {
  mealName: string;
  mealType?: MealType;
  estimatedCalories: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  confidenceScore?: number;
  aiNotes?: string;
  items: {
    name: string;
    estimatedWeightG?: number;
    estimatedCalories: number;
    proteinG: number;
    fatG: number;
    carbsG: number;
    confidenceScore?: number;
  }[];
};

const createId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `ai-${Date.now()}-${Math.round(Math.random() * 10000)}`;
};

const payloadToMeal = (payload: AiMealAnalysisPayload, userId = 'user-1', photoUrl?: string): Meal => {
  const id = createId();
  const timestamp = new Date().toISOString();
  const items: MealItem[] = payload.items.map((item) => ({
    id: createId(),
    mealId: id,
    name: item.name,
    estimatedWeightG: item.estimatedWeightG,
    estimatedCalories: Math.round(item.estimatedCalories),
    proteinG: Math.round(item.proteinG),
    fatG: Math.round(item.fatG),
    carbsG: Math.round(item.carbsG),
    confidenceScore: item.confidenceScore
  }));

  return {
    id,
    userId,
    photoUrl,
    mealName: payload.mealName,
    mealType: payload.mealType ?? 'other',
    estimatedCalories: Math.round(payload.estimatedCalories),
    proteinG: Math.round(payload.proteinG),
    fatG: Math.round(payload.fatG),
    carbsG: Math.round(payload.carbsG),
    confidenceScore: payload.confidenceScore,
    aiNotes: payload.aiNotes,
    createdAt: timestamp,
    updatedAt: timestamp,
    items
  };
};

export const aiAnalysisService = {
  async analyzeMealPhoto({ photoUri, userId, photoUrl, locale = 'pl' }: AnalyzeMealPhotoInput): Promise<Meal> {
    if (aiAnalysisMode === 'mock') {
      return mockAiService.analyze(photoUrl || photoUri, locale);
    }

    if (aiAnalysisMode === 'edge' || aiAnalysisMode === 'supabase') {
      const supabase = getSupabaseClient();
      const deviceId = await getDeviceId();
      const { data, error } = await supabase.functions.invoke<{ analysis?: AiMealAnalysisPayload; error?: { code?: string; message?: string } }>(aiAnalysisEdgeFunction, {
        body: { photoUrl: photoUrl || photoUri, locale },
        headers: { 'x-device-id': deviceId ?? 'unknown' }
      });

      if (error) throw error;
      if (data?.error?.code === 'limit_exceeded') throw new Error('limit_exceeded');
      if (data?.error?.code === 'device_limit_reached') throw new Error('device_limit_reached');
      if (data?.error) throw new Error(data.error.message ?? 'Nie udało się przeanalizować zdjęcia posiłku.');
      if (!data?.analysis) throw new Error('Backend AI nie zwrócił analizy posiłku.');

      return payloadToMeal(data.analysis, userId, photoUrl || photoUri);
    }

    if (!aiAnalysisEndpoint) {
      return mockAiService.analyze(photoUrl || photoUri, locale);
    }

    // Custom VPS/backend option. Never call OpenAI/AI providers directly from
    // the mobile app and never ship private AI API keys in EXPO_PUBLIC_* vars.
    const session = supabase ? await supabase.auth.getSession().then(({ data }) => data.session).catch(() => null) : null;
    const deviceId = await getDeviceId();
    const headers: Record<string, string> = { 'Content-Type': 'application/json', 'x-device-id': deviceId ?? 'unknown' };
    if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;

    const response = await fetch(aiAnalysisEndpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({ photoUrl: photoUrl || photoUri, userId, locale })
    });

    if (!response.ok) {
      throw new Error('Nie udało się przeanalizować zdjęcia posiłku.');
    }

    const data = await response.json() as { analysis?: AiMealAnalysisPayload } | AiMealAnalysisPayload;
    const analysis = 'analysis' in data && data.analysis ? data.analysis : data as AiMealAnalysisPayload;

    return payloadToMeal(analysis, userId, photoUrl || photoUri);
  },

  async analyzeMealText({ text, userId, locale = 'pl' }: AnalyzeMealTextInput): Promise<Meal> {
    if (aiAnalysisMode === 'mock') {
      return mockAiService.analyzeText(text, locale);
    }

    if (aiAnalysisMode === 'edge' || aiAnalysisMode === 'supabase') {
      const supabase = getSupabaseClient();
      const deviceId = await getDeviceId();
      const { data, error } = await supabase.functions.invoke<{ analysis?: AiMealAnalysisPayload; error?: { code?: string; message?: string } }>('analyze-meal-text', {
        body: { text, locale },
        headers: { 'x-device-id': deviceId ?? 'unknown' }
      });

      if (error) throw error;
      if (data?.error?.code === 'limit_exceeded') throw new Error('limit_exceeded');
      if (data?.error?.code === 'device_limit_reached') throw new Error('device_limit_reached');
      if (data?.error) throw new Error(data.error.message ?? 'Nie udało się przeanalizować posiłku.');
      if (!data?.analysis) throw new Error('Backend AI nie zwrócił analizy posiłku.');

      return payloadToMeal(data.analysis, userId);
    }

    if (!aiAnalysisEndpoint) {
      return mockAiService.analyzeText(text, locale);
    }

    // Fallback for custom VPS/backend for text
    const session = supabase ? await supabase.auth.getSession().then(({ data }) => data.session).catch(() => null) : null;
    const deviceId = await getDeviceId();
    const headers: Record<string, string> = { 'Content-Type': 'application/json', 'x-device-id': deviceId ?? 'unknown' };
    if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;

    const response = await fetch(aiAnalysisEndpoint.replace('analyze-meal-photo', 'analyze-meal-text'), {
      method: 'POST',
      headers,
      body: JSON.stringify({ text, userId, locale })
    });

    if (!response.ok) {
      throw new Error('Nie udało się przeanalizować posiłku.');
    }

    const data = await response.json() as { analysis?: AiMealAnalysisPayload } | AiMealAnalysisPayload;
    const analysis = 'analysis' in data && data.analysis ? data.analysis : data as AiMealAnalysisPayload;

    return payloadToMeal(analysis, userId);
  }
};

export const analyzeMealPhoto = aiAnalysisService.analyzeMealPhoto;
export const analyzeMealText = aiAnalysisService.analyzeMealText;

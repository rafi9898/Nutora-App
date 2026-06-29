import { supabaseAdmin } from '../lib/supabase.js';
import type { AiMealAnalysis } from '../types.js';

export const logAnalysis = async (input: {
  userId: string;
  photoUrl?: string;
  status: 'completed' | 'failed';
  requestPayload?: unknown;
  responsePayload?: AiMealAnalysis;
  errorMessage?: string;
}) => {
  if (!supabaseAdmin) return;

  await supabaseAdmin.from('ai_analysis_logs').insert({
    user_id: input.userId,
    photo_url: input.photoUrl ?? null,
    status: input.status,
    provider: 'openai',
    request_payload: input.requestPayload ?? null,
    response_payload: input.responsePayload ?? null,
    error_message: input.errorMessage ?? null
  });
};

export type DataMode = 'mock' | 'supabase';
export type AiMode = 'mock' | 'edge' | 'supabase' | 'custom';

export const dataMode = (process.env.EXPO_PUBLIC_DATA_MODE === 'supabase' ? 'supabase' : 'mock') as DataMode;
export const isSupabaseMode = dataMode === 'supabase';

export const aiAnalysisMode = (process.env.EXPO_PUBLIC_AI_ANALYSIS_MODE || 'mock') as AiMode;

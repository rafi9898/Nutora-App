export type DataMode = 'mock' | 'supabase';
export type AiMode = 'mock' | 'edge' | 'supabase' | 'custom';

// Zawsze wymuszamy tryb produkcyjny, usuwamy fallbacki do mocków
export const dataMode = 'supabase' as DataMode;
export const isSupabaseMode = true;

export const aiAnalysisMode = (process.env.EXPO_PUBLIC_AI_ANALYSIS_MODE || 'supabase') as AiMode;

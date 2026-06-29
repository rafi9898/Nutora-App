import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  HOST: z.string().default('0.0.0.0'),
  CORS_ORIGIN: z.string().default('*'),
  ALLOW_DEV_AUTH_BYPASS: z.coerce.boolean().optional(),
  SUPABASE_URL: z.string().url().optional().or(z.literal('')),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional().or(z.literal('')),
  OPENAI_API_KEY: z.string().optional().or(z.literal('')),
  OPENAI_MODEL: z.string().default('gpt-4.1-mini'),
  FREE_ANALYSIS_LIMIT: z.coerce.number().int().positive().default(5),
  REVENUECAT_WEBHOOK_SECRET: z.string().optional().or(z.literal(''))
});

const parsedConfig = envSchema.parse(process.env);

export const config = {
  ...parsedConfig,
  ALLOW_DEV_AUTH_BYPASS: parsedConfig.ALLOW_DEV_AUTH_BYPASS ?? parsedConfig.NODE_ENV !== 'production'
};

export const isSupabaseConfigured = Boolean(config.SUPABASE_URL && config.SUPABASE_SERVICE_ROLE_KEY);
export const isOpenAiConfigured = Boolean(config.OPENAI_API_KEY);

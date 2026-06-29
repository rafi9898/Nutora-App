import type { FastifyInstance } from 'fastify';
import { isOpenAiConfigured, isSupabaseConfigured } from '../config.js';

export const registerHealthRoutes = async (app: FastifyInstance) => {
  app.get('/health', async () => ({
    ok: true,
    service: 'nutora-backend',
    supabaseConfigured: isSupabaseConfigured,
    openAiConfigured: isOpenAiConfigured,
    timestamp: new Date().toISOString()
  }));
};

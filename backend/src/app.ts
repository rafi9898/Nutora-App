import cors from '@fastify/cors';
import Fastify from 'fastify';
import { config } from './config.js';
import { registerAiRoutes } from './routes/ai.js';
import { registerHealthRoutes } from './routes/health.js';
import { registerRevenueCatRoutes } from './routes/revenuecat.js';

export const buildApp = async () => {
  const app = Fastify({
    logger: {
      level: config.NODE_ENV === 'production' ? 'info' : 'debug'
    }
  });

  await app.register(cors, {
    origin: config.CORS_ORIGIN === '*' ? true : config.CORS_ORIGIN.split(',').map((item) => item.trim())
  });

  await registerHealthRoutes(app);
  await registerAiRoutes(app);
  await registerRevenueCatRoutes(app);

  return app;
};

import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticateRequest } from '../services/auth.js';
import { analyzeMealPhoto } from '../services/analysis.js';
import { logAnalysis } from '../services/analysis-logs.js';
import { ensureAnalysisAllowance, incrementAnalysisUsage } from '../services/subscriptions.js';

const bodySchema = z.object({
  photoUrl: z.string().min(1),
  userId: z.string().optional(),
  locale: z.enum(['pl', 'en', 'es', 'de', 'fr', 'it', 'pt', 'uk']).default('pl')
});

export const registerAiRoutes = async (app: FastifyInstance) => {
  app.post('/ai/analyze-meal', async (request, reply) => {
    let userId = 'unknown';
    let photoUrl = '';

    try {
      const user = await authenticateRequest(request);
      userId = user.id;
      const body = bodySchema.parse(request.body);
      photoUrl = body.photoUrl;

      const allowance = await ensureAnalysisAllowance(userId);
      if (!allowance.allowed) {
        return reply.code(402).send({
          error: {
            code: 'limit_exceeded',
            message: 'Monthly free analysis limit exceeded.'
          }
        });
      }

      const analysis = await analyzeMealPhoto({ photoUrl: body.photoUrl, locale: body.locale });
      await incrementAnalysisUsage(userId);
      await logAnalysis({ userId, photoUrl: body.photoUrl, status: 'completed', requestPayload: { locale: body.locale }, responsePayload: analysis });

      return { analysis };
    } catch (error) {
      await logAnalysis({
        userId,
        photoUrl,
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown analysis error'
      }).catch(() => undefined);

      if (error instanceof Error && ['invalid_token', 'missing_token'].includes(error.message)) {
        return reply.code(401).send({ error: { code: error.message, message: 'Unauthorized.' } });
      }

      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: { code: 'invalid_payload', message: error.message } });
      }

      request.log.error(error);
      return reply.code(500).send({ error: { code: 'analysis_failed', message: 'Meal analysis failed.' } });
    }
  });
};

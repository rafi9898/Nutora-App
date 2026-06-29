import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { config } from '../config.js';
import { updateRevenueCatSubscription } from '../services/subscriptions.js';

const revenueCatEventSchema = z.object({
  event: z.object({
    type: z.string(),
    app_user_id: z.string(),
    aliases: z.array(z.string()).optional(),
    original_app_user_id: z.string().optional(),
    subscriber_attributes: z.record(z.unknown()).optional(),
    expiration_at_ms: z.number().nullable().optional(),
    purchased_at_ms: z.number().nullable().optional(),
    product_id: z.string().optional()
  })
});

const getSecret = (request: FastifyRequest) => {
  const auth = request.headers.authorization;
  if (auth?.startsWith('Bearer ')) return auth.slice('Bearer '.length).trim();
  const header = request.headers['x-revenuecat-signature'] ?? request.headers['x-revenuecat-secret'];
  return Array.isArray(header) ? header[0] : header;
};

const eventToStatus = (type: string) => {
  if (['INITIAL_PURCHASE', 'RENEWAL', 'UNCANCELLATION', 'PRODUCT_CHANGE'].includes(type)) {
    return { tier: 'premium' as const, status: 'active' as const };
  }

  if (['CANCELLATION', 'EXPIRATION', 'BILLING_ISSUE'].includes(type)) {
    return { tier: 'free' as const, status: type === 'BILLING_ISSUE' ? 'inactive' as const : 'expired' as const };
  }

  return { tier: 'free' as const, status: 'inactive' as const };
};

const msToIso = (value?: number | null) => value ? new Date(value).toISOString() : null;

export const registerRevenueCatRoutes = async (app: FastifyInstance) => {
  app.post('/webhooks/revenuecat', async (request, reply) => {
    if (config.REVENUECAT_WEBHOOK_SECRET) {
      const providedSecret = getSecret(request);
      if (providedSecret !== config.REVENUECAT_WEBHOOK_SECRET) {
        return reply.code(401).send({ error: { code: 'invalid_webhook_secret', message: 'Invalid webhook secret.' } });
      }
    }

    try {
      const payload = revenueCatEventSchema.parse(request.body);
      const event = payload.event;
      const mapped = eventToStatus(event.type);

      const result = await updateRevenueCatSubscription({
        userId: event.app_user_id,
        customerId: event.original_app_user_id ?? event.app_user_id,
        tier: mapped.tier,
        status: mapped.status,
        currentPeriodStart: msToIso(event.purchased_at_ms),
        currentPeriodEnd: msToIso(event.expiration_at_ms)
      });

      return { ok: true, skipped: result.skipped, eventType: event.type };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: { code: 'invalid_payload', message: error.message } });
      }

      request.log.error(error);
      return reply.code(500).send({ error: { code: 'webhook_failed', message: 'RevenueCat webhook failed.' } });
    }
  });
};

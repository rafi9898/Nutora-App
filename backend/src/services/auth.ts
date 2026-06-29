import type { FastifyRequest } from 'fastify';
import { config } from '../config.js';
import { supabaseAdmin } from '../lib/supabase.js';
import type { AuthenticatedUser } from '../types.js';

const getBearerToken = (request: FastifyRequest) => {
  const header = request.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  return header.slice('Bearer '.length).trim();
};

export const authenticateRequest = async (request: FastifyRequest): Promise<AuthenticatedUser> => {
  const token = getBearerToken(request);

  if (token && supabaseAdmin) {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user) throw new Error('invalid_token');
    return { id: data.user.id, email: data.user.email };
  }

  if (config.ALLOW_DEV_AUTH_BYPASS) {
    const body = typeof request.body === 'object' && request.body !== null ? request.body as { userId?: string } : {};
    return { id: body.userId || 'dev-user' };
  }

  throw new Error('missing_token');
};

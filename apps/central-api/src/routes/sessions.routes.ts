import { FastifyInstance } from 'fastify';
import { createSessionSchema } from '@sahakar/validation';
import { centralStore } from '../store/memory-store.js';
import { authenticate, requirePermission } from '../auth/auth-service.js';

export async function sessionRoutes(fastify: FastifyInstance) {
  fastify.get<{ Querystring: { batchId?: string } }>('/sessions', async (request) => {
    return {
      sessions: centralStore.listSessions(request.query.batchId),
    };
  });

  fastify.get<{ Params: { id: string } }>('/sessions/:id', async (request, reply) => {
    const session = centralStore.getSession(request.params.id);
    if (!session) {
      return reply.status(404).send({ error: 'NOT_FOUND', message: 'Session not found' });
    }
    const batch = centralStore.getBatch(session.batchId);
    return { session, batch };
  });

  fastify.post(
    '/sessions',
    { preHandler: [authenticate, requirePermission('manage:sessions')] },
    async (request, reply) => {
      const parse = createSessionSchema.safeParse(request.body);
      if (!parse.success) {
        return reply.status(400).send({ error: 'VALIDATION_ERROR', details: parse.error.flatten() });
      }

      const session = centralStore.createSession(parse.data);
      return reply.status(201).send({ session });
    }
  );

  fastify.post<{ Params: { id: string } }>(
    '/sessions/:id/start',
    { preHandler: [authenticate, requirePermission('manage:sessions')] },
    async (request, reply) => {
      const session = centralStore.getSession(request.params.id);
      if (!session) {
        return reply.status(404).send({ error: 'NOT_FOUND', message: 'Session not found' });
      }

      return {
        session,
        status: 'STARTED',
        startedAt: new Date().toISOString(),
        message: 'Training session started. Attendance capture active.',
      };
    }
  );

  fastify.post<{ Params: { id: string } }>(
    '/sessions/:id/end',
    { preHandler: [authenticate, requirePermission('manage:sessions')] },
    async (request, reply) => {
      const session = centralStore.getSession(request.params.id);
      if (!session) {
        return reply.status(404).send({ error: 'NOT_FOUND', message: 'Session not found' });
      }

      return {
        session,
        status: 'CONCLUDED',
        endedAt: new Date().toISOString(),
        message: 'Training session concluded.',
      };
    }
  );
}

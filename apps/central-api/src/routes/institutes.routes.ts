import { FastifyInstance } from 'fastify';
import { createInstituteSchema } from '@sahakar/validation';
import { centralStore } from '../store/memory-store.js';
import { authenticate, requirePermission } from '../auth/auth-service.js';

export async function instituteRoutes(fastify: FastifyInstance) {
  // National Multi-Tier Federation Analytics (Phase 9 Milestone 3)
  fastify.get('/analytics/federation', async () => {
    return centralStore.getFederationRollup();
  });

  // List all institutes
  fastify.get('/institutes', async () => {
    return {
      institutes: centralStore.listInstitutes(),
    };
  });

  // Get institute by ID
  fastify.get<{ Params: { id: string } }>('/institutes/:id', async (request, reply) => {
    const inst = centralStore.getInstitute(request.params.id);
    if (!inst) {
      return reply.status(404).send({ error: 'NOT_FOUND', message: 'Institute not found' });
    }
    return { institute: inst };
  });

  // Create new institute (Super Admin only)
  fastify.post(
    '/institutes',
    { preHandler: [authenticate, requirePermission('manage:institutes')] },
    async (request, reply) => {
      const parse = createInstituteSchema.safeParse(request.body);
      if (!parse.success) {
        return reply.status(400).send({ error: 'VALIDATION_ERROR', details: parse.error.flatten() });
      }

      const institute = centralStore.createInstitute(parse.data);
      return reply.status(201).send({ institute });
    }
  );

  // Update institute per 08_API_SPEC.md
  fastify.patch<{ Params: { id: string }; Body: Record<string, unknown> }>(
    '/institutes/:id',
    { preHandler: [authenticate, requirePermission('manage:institutes')] },
    async (request, reply) => {
      const inst = centralStore.getInstitute(request.params.id);
      if (!inst) {
        return reply.status(404).send({ error: 'NOT_FOUND', message: 'Institute not found' });
      }

      Object.assign(inst, request.body, { updatedAt: new Date().toISOString() });
      return reply.send({ institute: inst });
    }
  );
}

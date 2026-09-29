import { FastifyInstance } from 'fastify';
import { createBatchSchema } from '@sahakar/validation';
import { centralStore } from '../store/memory-store.js';
import { authenticate, requirePermission } from '../auth/auth-service.js';

export async function batchRoutes(fastify: FastifyInstance) {
  fastify.get<{ Querystring: { programmeId?: string } }>('/batches', async (request) => {
    return {
      batches: centralStore.listBatches(request.query.programmeId),
    };
  });

  fastify.get<{ Params: { id: string } }>('/batches/:id', async (request, reply) => {
    const batch = centralStore.getBatch(request.params.id);
    if (!batch) {
      return reply.status(404).send({ error: 'NOT_FOUND', message: 'Batch not found' });
    }
    const trainer = centralStore.getUser(batch.trainerId);
    const sessions = centralStore.listSessions(batch.id);
    const enrollments = centralStore.listEnrollments({ batchId: batch.id });

    return {
      batch,
      trainer: trainer ? { id: trainer.id, name: trainer.name } : null,
      sessions,
      enrollments,
    };
  });

  fastify.post(
    '/batches',
    { preHandler: [authenticate, requirePermission('manage:batches')] },
    async (request, reply) => {
      const parse = createBatchSchema.safeParse(request.body);
      if (!parse.success) {
        return reply.status(400).send({ error: 'VALIDATION_ERROR', details: parse.error.flatten() });
      }

      const batch = centralStore.createBatch(parse.data);
      return reply.status(201).send({ batch });
    }
  );
}

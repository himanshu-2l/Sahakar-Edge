import { FastifyInstance } from 'fastify';
import { createProgrammeSchema, enrollTraineeSchema } from '@sahakar/validation';
import { centralStore } from '../store/memory-store.js';
import { authenticate, requirePermission } from '../auth/auth-service.js';

export async function programmeRoutes(fastify: FastifyInstance) {
  // List programmes
  fastify.get<{ Querystring: { instituteId?: string } }>('/programmes', async (request) => {
    return {
      programmes: centralStore.listProgrammes(request.query.instituteId),
    };
  });

  // Get programme by ID
  fastify.get<{ Params: { id: string } }>('/programmes/:id', async (request, reply) => {
    const programme = centralStore.getProgramme(request.params.id);
    if (!programme) {
      return reply.status(404).send({ error: 'NOT_FOUND', message: 'Programme not found' });
    }
    const batches = centralStore.listBatches(programme.id);
    const enrollments = centralStore.listEnrollments({ programmeId: programme.id });

    return {
      programme,
      batches,
      enrollmentCount: enrollments.length,
    };
  });

  // Create programme
  fastify.post(
    '/programmes',
    { preHandler: [authenticate, requirePermission('manage:programmes')] },
    async (request, reply) => {
      const parse = createProgrammeSchema.safeParse(request.body);
      if (!parse.success) {
        return reply.status(400).send({ error: 'VALIDATION_ERROR', details: parse.error.flatten() });
      }

      const programme = centralStore.createProgramme(parse.data);
      return reply.status(201).send({ programme });
    }
  );

  // Update programme per 08_API_SPEC.md
  fastify.patch<{ Params: { id: string }; Body: Record<string, unknown> }>(
    '/programmes/:id',
    { preHandler: [authenticate, requirePermission('manage:programmes')] },
    async (request, reply) => {
      const prog = centralStore.getProgramme(request.params.id);
      if (!prog) {
        return reply.status(404).send({ error: 'NOT_FOUND', message: 'Programme not found' });
      }

      const updated = centralStore.updateProgramme(request.params.id, request.body as any);
      return reply.send({ programme: updated });
    }
  );

  // Enroll trainee in programme/batch
  fastify.post<{ Params: { id: string } }>(
    '/programmes/:id/enrollments',
    { preHandler: [authenticate, requirePermission('manage:enrollments')] },
    async (request, reply) => {
      const payload = {
        ...(request.body as Record<string, unknown>),
        programmeId: request.params.id,
      };

      const parse = enrollTraineeSchema.safeParse(payload);
      if (!parse.success) {
        return reply.status(400).send({ error: 'VALIDATION_ERROR', details: parse.error.flatten() });
      }

      const enrollment = centralStore.enrollTrainee(parse.data);
      return reply.status(201).send({ enrollment });
    }
  );

  // Get all enrollments for programme
  fastify.get<{ Params: { id: string } }>('/programmes/:id/enrollments', async (request) => {
    const enrollments = centralStore.listEnrollments({ programmeId: request.params.id });
    const enriched = enrollments.map((enr) => {
      const trainee = centralStore.getUser(enr.traineeId);
      const batch = centralStore.getBatch(enr.batchId);
      return {
        ...enr,
        trainee: trainee ? { id: trainee.id, name: trainee.name, email: trainee.emailOrPhone } : null,
        batch: batch ? { id: batch.id, name: batch.name } : null,
      };
    });

    return {
      enrollments: enriched,
    };
  });
}

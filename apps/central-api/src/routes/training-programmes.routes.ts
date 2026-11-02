import { FastifyInstance } from 'fastify';
import { createTrainingProgrammeSchema } from '@sahakar/validation';
import { centralStore } from '../store/memory-store.js';

export async function trainingProgrammesRoutes(fastify: FastifyInstance) {
  // List all ATP programmes with capacity & nomination stats
  fastify.get<{
    Querystring: { instituteId?: string };
  }>('/programmes', async (request, reply) => {
    const programmes = centralStore.listTrainingProgrammes(request.query.instituteId);
    return reply.send({
      count: programmes.length,
      programmes,
    });
  });

  // Get single programme details with nomination quota breakdown
  fastify.get<{
    Params: { id: string };
  }>('/programmes/:id', async (request, reply) => {
    const programme = centralStore.getTrainingProgramme(request.params.id);
    if (!programme) {
      return reply.status(404).send({
        error: 'PROGRAMME_NOT_FOUND',
        message: `Training programme ${request.params.id} not found`,
      });
    }

    const nominations = centralStore.listTraineeNominations(programme.id);
    const approved = nominations.filter((n) => n.status === 'APPROVED').length;
    const waitlisted = nominations.filter((n) => n.status === 'WAITLISTED').length;
    const rejected = nominations.filter((n) => n.status === 'REJECTED').length;
    const pending = nominations.filter((n) => n.status === 'PENDING').length;

    return reply.send({
      programme,
      nominationSummary: {
        capacity: programme.capacity,
        approved,
        waitlisted,
        rejected,
        pending,
        isFull: approved >= programme.capacity,
      },
    });
  });

  // Schedule new ATP training programme
  fastify.post('/programmes', async (request, reply) => {
    const parse = createTrainingProgrammeSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({
        error: 'VALIDATION_ERROR',
        details: parse.error.flatten(),
      });
    }

    const created = centralStore.createTrainingProgramme(parse.data);
    return reply.status(201).send({
      success: true,
      programme: created,
    });
  });
}

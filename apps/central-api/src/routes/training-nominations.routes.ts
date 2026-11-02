import { FastifyInstance } from 'fastify';
import { createNominationSchema, decideNominationSchema } from '@sahakar/validation';
import { centralStore } from '../store/memory-store.js';

export async function trainingNominationsRoutes(fastify: FastifyInstance) {
  // Submit candidate nomination for an ATP training batch
  fastify.post('/nominations', async (request, reply) => {
    const parse = createNominationSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({
        error: 'VALIDATION_ERROR',
        details: parse.error.flatten(),
      });
    }

    const nomination = centralStore.createTraineeNomination(parse.data);
    return reply.status(201).send({
      success: true,
      nomination,
    });
  });

  // Review nomination queue (filter by programmeId, status)
  fastify.get<{
    Querystring: { programmeId?: string; status?: string };
  }>('/nominations', async (request, reply) => {
    const { programmeId, status } = request.query;
    const nominations = centralStore.listTraineeNominations(programmeId, status);
    return reply.send({
      count: nominations.length,
      nominations,
    });
  });

  // Trainee personal nomination tracking
  fastify.get<{
    Querystring: { traineeId?: string };
  }>('/nominations/mine', async (request, reply) => {
    const traineeId = request.query.traineeId || (request as any).auth?.user?.id;
    if (!traineeId) {
      return reply.status(400).send({
        error: 'BAD_REQUEST',
        message: 'traineeId parameter or authentication required',
      });
    }

    const all = centralStore.listTraineeNominations();
    const mine = all.filter((n) => n.traineeId === traineeId);
    return reply.send({
      count: mine.length,
      nominations: mine,
    });
  });

  // Get single nomination details
  fastify.get<{
    Params: { id: string };
  }>('/nominations/:id', async (request, reply) => {
    const nomination = centralStore.getTraineeNomination(request.params.id);
    if (!nomination) {
      return reply.status(404).send({
        error: 'NOMINATION_NOT_FOUND',
        message: `Nomination ${request.params.id} not found`,
      });
    }
    return reply.send({ nomination });
  });

  // Administrative decision on trainee nomination
  fastify.patch<{
    Params: { id: string };
  }>('/nominations/:id/decision', async (request, reply) => {
    const parse = decideNominationSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({
        error: 'VALIDATION_ERROR',
        details: parse.error.flatten(),
      });
    }

    const { status, rejectionReason, hostelRoomId, decidedBy } = parse.data;
    const officer = decidedBy || (request as any).auth?.user?.email || 'admin@ncct.gov.in';

    const result = centralStore.decideTraineeNomination(
      request.params.id,
      status as 'APPROVED' | 'WAITLISTED' | 'REJECTED',
      officer,
      rejectionReason,
      hostelRoomId
    );

    if (!result.success) {
      const isCapacityOrRoomError = result.error?.includes('Capacity') || result.error?.includes('vacant beds');
      return reply.status(isCapacityOrRoomError ? 409 : 400).send({
        error: isCapacityOrRoomError ? 'CONFLICT' : 'DECISION_FAILED',
        message: result.error,
        nomination: result.nomination,
      });
    }

    return reply.send({
      success: true,
      nomination: result.nomination,
    });
  });
}

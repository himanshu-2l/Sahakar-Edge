import { FastifyInstance } from 'fastify';
import {
  createCampusHostelRoomSchema,
  toggleNfcProfileSchema,
} from '@sahakar/validation';
import { centralStore } from '../store/memory-store.js';

export async function trainingLogisticsRoutes(fastify: FastifyInstance) {
  // Campus hostel room & bed occupancy inventory
  fastify.get<{
    Querystring: { instituteId?: string };
  }>('/logistics/hostels/rooms', async (request, reply) => {
    const rooms = centralStore.listCampusHostelRooms(request.query.instituteId);
    return reply.send({
      count: rooms.length,
      rooms,
    });
  });

  // Create new campus hostel room
  fastify.post('/logistics/hostels/rooms', async (request, reply) => {
    const parse = createCampusHostelRoomSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({
        error: 'VALIDATION_ERROR',
        details: parse.error.flatten(),
      });
    }

    const room = centralStore.createCampusHostelRoom(parse.data);
    return reply.status(201).send({
      success: true,
      room,
    });
  });

  // Private trainee accommodation card (Private to Trainee)
  fastify.get<{
    Querystring: { traineeId?: string };
  }>('/logistics/hostels/my-card', async (request, reply) => {
    const traineeId = request.query.traineeId || (request as any).auth?.user?.id || 'dddd4444-4444-4444-4444-444444444441';
    const card = centralStore.getTraineeHostelRoomCard(traineeId);
    if (!card) {
      return reply.status(404).send({
        error: 'NO_HOSTEL_ALLOCATION',
        message: 'No active hostel accommodation has been assigned to this trainee',
      });
    }

    return reply.send({ roomCard: card });
  });

  // Trainee private sovereign NFC profile configuration
  fastify.get<{
    Querystring: { traineeId?: string };
  }>('/logistics/nfc-profile', async (request, reply) => {
    const traineeId = request.query.traineeId || (request as any).auth?.user?.id || 'dddd4444-4444-4444-4444-444444444441';
    let profile = centralStore.getTraineeNfcProfile(traineeId);
    if (!profile) {
      profile = centralStore.toggleTraineeNfcProfile(traineeId, true);
    }

    return reply.send({ profile });
  });

  // Rotate public NFC profile code (e.g. if physical badge is lost)
  fastify.post<{
    Body: { traineeId?: string };
  }>('/logistics/nfc-profile/rotate', async (request, reply) => {
    const traineeId = request.body?.traineeId || (request as any).auth?.user?.id || 'dddd4444-4444-4444-4444-444444444441';
    const rotated = centralStore.rotateTraineeNfcProfile(traineeId);
    if (!rotated) {
      return reply.status(404).send({
        error: 'PROFILE_NOT_FOUND',
        message: `NFC profile not found for trainee ${traineeId}`,
      });
    }

    return reply.send({
      success: true,
      profile: rotated,
      message: 'Sovereign NFC profile code rotated successfully',
    });
  });

  // Toggle privacy visibility for sovereign NFC profile
  fastify.patch<{
    Body: { enabled: boolean; rotateCode?: boolean; traineeId?: string };
  }>('/logistics/nfc-profile/toggle', async (request, reply) => {
    const parse = toggleNfcProfileSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({
        error: 'VALIDATION_ERROR',
        details: parse.error.flatten(),
      });
    }

    const traineeId = (request.body as any)?.traineeId || (request as any).auth?.user?.id || 'dddd4444-4444-4444-4444-444444444441';
    const updated = centralStore.toggleTraineeNfcProfile(
      traineeId,
      parse.data.enabled,
      parse.data.rotateCode
    );

    return reply.send({
      success: true,
      profile: updated,
      message: parse.data.enabled ? 'Public profile visibility enabled' : 'Public profile disabled',
    });
  });
}

import { FastifyInstance } from 'fastify';
import { createTimetableSessionSchema } from '@sahakar/validation';
import { centralStore } from '../store/memory-store.js';

export async function trainingTimetableRoutes(fastify: FastifyInstance) {
  // List sessions for a programme
  fastify.get<{
    Querystring: { programmeId?: string };
  }>('/timetable', async (request, reply) => {
    const sessions = centralStore.listTimetableSessions(request.query.programmeId);
    return reply.send({
      count: sessions.length,
      sessions,
    });
  });

  // Get currently active or upcoming session
  fastify.get<{
    Querystring: { programmeId?: string };
  }>('/timetable/active', async (request, reply) => {
    const session = centralStore.getActiveTimetableSession(request.query.programmeId);
    return reply.send({
      activeSession: session,
    });
  });

  // Reveal live 6-digit numeric check-in code for classroom display
  fastify.get<{
    Params: { sessionId: string };
  }>('/timetable/:sessionId/check-in-code', async (request, reply) => {
    const session = centralStore.getTimetableSession(request.params.sessionId);
    if (!session) {
      return reply.status(404).send({
        error: 'SESSION_NOT_FOUND',
        message: `Session ${request.params.sessionId} not found`,
      });
    }

    return reply.send({
      sessionId: session.id,
      title: session.title,
      checkInCode: session.checkInCode,
      startsAt: session.startsAt,
      endsAt: session.endsAt,
      status: session.status,
    });
  });

  // Rotate check-in code with anti-collision retry loop
  fastify.post<{
    Params: { sessionId: string };
  }>('/timetable/:sessionId/regenerate-code', async (request, reply) => {
    try {
      const newCode = centralStore.regenerateSessionCheckInCode(request.params.sessionId);
      return reply.send({
        sessionId: request.params.sessionId,
        checkInCode: newCode,
        message: 'Check-in code regenerated successfully',
      });
    } catch (err: any) {
      return reply.status(404).send({
        error: 'SESSION_NOT_FOUND',
        message: err.message,
      });
    }
  });

  // Create new timetable session
  fastify.post('/timetable', async (request, reply) => {
    const parse = createTimetableSessionSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({
        error: 'VALIDATION_ERROR',
        details: parse.error.flatten(),
      });
    }

    const { sessionDate, startTime, endTime } = parse.data;
    const session = centralStore.createTimetableSession({
      ...parse.data,
      startsAt: `${sessionDate}T${startTime}:00Z`,
      endsAt: `${sessionDate}T${endTime}:00Z`,
    });

    return reply.status(201).send({
      success: true,
      session,
    });
  });
}

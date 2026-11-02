import { FastifyInstance } from 'fastify';
import {
  dynamicAttendanceCheckInSchema,
  facultyManualAttendanceSchema,
} from '@sahakar/validation';
import { centralStore } from '../store/memory-store.js';

export async function trainingAttendanceRoutes(fastify: FastifyInstance) {
  // Self-service attendance check-in (Dynamic 6-Digit Code / QR)
  fastify.post('/attendance/check-in', async (request, reply) => {
    const parse = dynamicAttendanceCheckInSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({
        error: 'VALIDATION_ERROR',
        details: parse.error.flatten(),
      });
    }

    const { sessionId, traineeId, checkInCode, verificationMethod } = parse.data;

    const result = centralStore.recordSessionAttendance({
      sessionId,
      traineeId,
      submittedCode: checkInCode,
      verificationMethod,
    });

    if (!result.success) {
      return reply.status(result.status || 400).send({
        error: result.error,
        message: result.message,
      });
    }

    return reply.status(201).send({
      success: true,
      record: result.record,
      message: 'Attendance verified and logged successfully',
    });
  });

  // Load interactive faculty class roster
  fastify.get<{
    Params: { sessionId: string };
  }>('/attendance/roster/:sessionId', async (request, reply) => {
    const session = centralStore.getTimetableSession(request.params.sessionId);
    if (!session) {
      return reply.status(404).send({
        error: 'SESSION_NOT_FOUND',
        message: `Session ${request.params.sessionId} not found`,
      });
    }

    const nominations = centralStore.listTraineeNominations(session.programmeId, 'APPROVED');
    const records = centralStore.listSessionAttendanceRecords(session.id);
    const presentTraineeIds = new Set(records.filter((r) => r.verified).map((r) => r.traineeId));

    const roster = nominations.map((n) => {
      const isPresent = presentTraineeIds.has(n.traineeId);
      const record = records.find((r) => r.traineeId === n.traineeId);
      return {
        traineeId: n.traineeId,
        traineeName: n.fullName,
        phone: n.phone,
        cooperativeAffiliation: n.cooperativeAffiliation,
        designation: n.designation,
        isPresent,
        attendanceRecord: record,
      };
    });

    return reply.send({
      sessionId: session.id,
      sessionTitle: session.title,
      approvedNominees: nominations.length,
      presentCount: roster.filter((r) => r.isPresent).length,
      roster,
    });
  });

  // Faculty manual attendance override / reconciliation
  fastify.put<{
    Params: { sessionId: string };
  }>('/attendance/roster/:sessionId', async (request, reply) => {
    const parse = facultyManualAttendanceSchema.safeParse({
      ...((request.body as object) || {}),
      sessionId: request.params.sessionId,
    });

    if (!parse.success) {
      return reply.status(400).send({
        error: 'VALIDATION_ERROR',
        details: parse.error.flatten(),
      });
    }

    const { sessionId, traineeId, isPresent, markedBy } = parse.data;

    try {
      const record = centralStore.updateFacultyManualAttendance(
        sessionId,
        traineeId,
        isPresent,
        markedBy
      );

      return reply.send({
        success: true,
        isPresent,
        record,
        message: isPresent
          ? 'Manual attendance marked and verified by faculty'
          : 'Manual attendance revoked by faculty',
      });
    } catch (err: any) {
      return reply.status(404).send({
        error: 'NOT_FOUND',
        message: err.message,
      });
    }
  });

  // List raw attendance records
  fastify.get<{
    Querystring: { sessionId?: string; traineeId?: string };
  }>('/attendance/records', async (request, reply) => {
    const records = centralStore.listSessionAttendanceRecords(
      request.query.sessionId,
      request.query.traineeId
    );
    return reply.send({
      count: records.length,
      records,
    });
  });
}

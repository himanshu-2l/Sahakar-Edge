import { FastifyInstance } from 'fastify';
import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import { EdgeJournalService } from '../services/journal-service.js';
import { EdgeAuthService } from '../services/edge-auth.js';
import { EdgeAttendanceManager } from '../services/attendance-manager.js';
import { AttendanceVerificationMethod } from '@sahakar/types';
import { RfidSmartCardProvider } from '@sahakar/hardware-adapters';

export async function registerAttendanceRoutes(
  app: FastifyInstance,
  db: DatabaseSync,
  journalService: EdgeJournalService,
  authService: EdgeAuthService,
  attendanceManager?: EdgeAttendanceManager,
  rfidProvider?: RfidSmartCardProvider
) {
  const manager =
    attendanceManager || new EdgeAttendanceManager(db, journalService, 'edge-node-ricm-bhopal-01');
  const rfid = rfidProvider || new RfidSmartCardProvider();

  // Hardware Adapter Capture Endpoint (Simulated Face, QR)
  app.post<{
    Body: {
      sessionId: string;
      method: string;
      traineeId?: string;
      rawPayload?: string;
    };
  }>('/api/v1/attendance/capture', async (request, reply) => {
    const { sessionId, method, traineeId, rawPayload } = request.body || {};

    if (!sessionId || !method) {
      return reply.status(400).send({
        error: 'BAD_REQUEST',
        message: 'sessionId and method are required',
      });
    }

    const authUser = authService.authenticate(request);
    const actorId = authUser ? authUser.id : traineeId || 'system';

    const verificationMethod =
      method === 'SIMULATED_FACE'
        ? AttendanceVerificationMethod.SIMULATED_FACE
        : AttendanceVerificationMethod.QR;

    const result = await manager.processCapture(
      {
        sessionId,
        nodeId: 'edge-node-ricm-bhopal-01',
        traineeId,
        rawPayload,
        actorId,
      },
      verificationMethod
    );

    if (!result.evidence.verified) {
      return reply.status(422).send({
        success: false,
        error: result.evidence.error || 'Verification failed',
        evidence: result.evidence,
      });
    }

    return reply.status(201).send({
      success: true,
      evidence: result.evidence,
      event: result.event,
    });
  });

  // Edge Hardware Smart Card / RFID Tap Attendance Endpoint (ISO 14443A / KCC)
  app.post<{
    Body: {
      cardUid: string;
      sessionId?: string;
      traineeId?: string;
    };
  }>('/api/v1/attendance/rfid', async (request, reply) => {
    const { cardUid, sessionId, traineeId } = request.body || {};

    if (!cardUid || typeof cardUid !== 'string' || cardUid.trim().length === 0) {
      return reply.status(400).send({
        error: 'BAD_REQUEST',
        message: 'cardUid is required for RFID attendance tap',
      });
    }

    try {
      // Tap the RFID card through RfidSmartCardProvider with sub-50ms latency check
      const tapResult = await rfid.tapCard(cardUid, sessionId, traineeId);

      // Resolve session: use provided sessionId, or look up active local session, or fallback to default
      let targetSessionId = sessionId;
      if (!targetSessionId) {
        const row = db
          .prepare('SELECT id FROM local_sessions ORDER BY starts_at DESC LIMIT 1')
          .get() as { id: string } | undefined;
        targetSessionId = row?.id || '33333333-3333-3333-3333-333333333331';
      }

      const authUser = authService.authenticate(request);
      const createdBy = authUser ? authUser.id : 'rfid-hub-acr122u';
      const recordId = randomUUID();
      const occurredAt = tapResult.timestamp;

      const payload = {
        recordId,
        sessionId: targetSessionId,
        traineeId: tapResult.traineeId,
        method: AttendanceVerificationMethod.RFID,
        result: 'PRESENT',
        confidence: 1.0,
        quality: 0.99,
        createdBy,
        occurredAt,
        cardUid: tapResult.cardUid,
        cardType: tapResult.cardType,
        traineeName: tapResult.traineeName,
        latencyMs: tapResult.latencyMs,
      };

      // Atomic transaction: local_attendance_records business state + local_event_journal WAL event
      const event = journalService.appendEventInTransaction({
        aggregateType: 'ATTENDANCE',
        aggregateId: targetSessionId,
        eventType: 'ATTENDANCE_RECORDED',
        payload,
        operationalCallback: (txDb) => {
          txDb
            .prepare(`
              INSERT INTO local_attendance_records (
                id, session_id, trainee_id, node_id, method, result,
                confidence, quality, occurred_at, created_by
              ) VALUES (?, ?, ?, 'edge-node-ricm-bhopal-01', ?, ?, ?, ?, ?, ?)
            `)
            .run(
              recordId,
              targetSessionId,
              tapResult.traineeId,
              AttendanceVerificationMethod.RFID,
              'PRESENT',
              1.0,
              0.99,
              occurredAt,
              createdBy
            );
        },
      });

      return reply.status(201).send({
        success: true,
        latencyMs: tapResult.latencyMs,
        cardUid: tapResult.cardUid,
        cardType: tapResult.cardType,
        trainee: {
          id: tapResult.traineeId,
          name: tapResult.traineeName,
        },
        record: payload,
        event,
      });
    } catch (err: any) {
      return reply.status(422).send({
        success: false,
        error: 'RFID_ATTENDANCE_FAILED',
        message: err.message,
      });
    }
  });

  // Providers Health Check
  app.get('/api/v1/attendance/providers/health', async () => {
    const health = await manager.getProvidersHealth();
    return { providers: health };
  });

  // Record attendance event locally (Direct/Legacy path)
  app.post<{
    Body: {
      sessionId: string;
      traineeId: string;
      method: string;
      result?: string;
      confidence?: number;
      quality?: number;
    };
  }>('/api/v1/attendance/events', async (request, reply) => {
    const { sessionId, traineeId, method, result = 'PRESENT', confidence, quality } =
      request.body || {};

    if (!sessionId || !traineeId || !method) {
      return reply.status(400).send({
        error: 'BAD_REQUEST',
        message: 'sessionId, traineeId, and method are required',
      });
    }

    const authUser = authService.authenticate(request);
    const createdBy = authUser ? authUser.id : traineeId;
    const recordId = randomUUID();
    const occurredAt = new Date().toISOString();

    const payload = {
      recordId,
      sessionId,
      traineeId,
      method,
      result,
      confidence: confidence ?? null,
      quality: quality ?? null,
      createdBy,
      occurredAt,
    };

    // Atomic transaction: business state + domain event
    const event = journalService.appendEventInTransaction({
      aggregateType: 'ATTENDANCE',
      aggregateId: sessionId,
      eventType: 'ATTENDANCE_RECORDED',
      payload,
      operationalCallback: (txDb) => {
        txDb
          .prepare(`
            INSERT INTO local_attendance_records (
              id, session_id, trainee_id, node_id, method, result,
              confidence, quality, occurred_at, created_by
            ) VALUES (?, ?, ?, 'edge-node-ricm-bhopal-01', ?, ?, ?, ?, ?, ?)
          `)
          .run(
            recordId,
            sessionId,
            traineeId,
            method,
            result,
            confidence ?? null,
            quality ?? null,
            occurredAt,
            createdBy
          );
      },
    });

    return reply.status(201).send({
      success: true,
      record: payload,
      event,
    });
  });

  // Query session attendance roster
  app.get<{ Params: { id: string } }>('/api/v1/sessions/:id/attendance', async (request, reply) => {
    const sessionId = request.params.id;
    const rows = db
      .prepare(`
        SELECT a.*, u.name as trainee_name, u.email_or_phone as trainee_email
        FROM local_attendance_records a
        LEFT JOIN local_users u ON a.trainee_id = u.id
        WHERE a.session_id = ?
        ORDER BY a.occurred_at DESC
      `)
      .all(sessionId);

    return reply.send({ attendance: rows });
  });

  // Manual override by trainer (with mandatory reason + audit logging per PRD)
  app.post<{
    Params: { id: string };
    Body: { reason: string; result?: string };
  }>('/api/v1/attendance/:id/override', async (request, reply) => {
    const recordId = request.params.id;
    const { reason, result = 'PRESENT' } = request.body || {};

    if (!reason || reason.trim().length === 0) {
      return reply.status(400).send({
        error: 'BAD_REQUEST',
        message: 'Override reason is required for audit trail',
      });
    }

    const authUser = authService.requireAuth(request, reply);
    if (!authUser) return;

    try {
      const { record, event } = manager.overrideAttendance(
        recordId,
        reason,
        authUser.id,
        result as any
      );

      return reply.send({
        success: true,
        overridden: true,
        record,
        event,
      });
    } catch (err: any) {
      return reply.status(404).send({ error: 'ERROR', message: err.message });
    }
  });
}

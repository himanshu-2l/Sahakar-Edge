import { FastifyInstance } from 'fastify';
import { centralStore } from '../store/memory-store.js';
import { verifyEventHash } from '@sahakar/sync-protocol';
import type { SyncEvent } from '@sahakar/types';

export async function registerSyncRoutes(app: FastifyInstance) {
  // 1. Sync Handshake (04_OFFLINE_SYNC_PROTOCOL.md Step 1-2)
  app.post<{
    Body: {
      nodeId: string;
      instituteId?: string;
      edgeVersion?: string;
      lastAcknowledgedSequence?: number;
    };
  }>('/api/v1/sync/handshake', async (request, reply) => {
    const { nodeId, instituteId, edgeVersion = '1.0.0', lastAcknowledgedSequence = 0 } =
      request.body || {};

    if (!nodeId) {
      return reply.status(400).send({ error: 'BAD_REQUEST', message: 'nodeId is required' });
    }

    centralStore.registerOrUpdateEdgeNode(nodeId, {
      instituteId,
      edgeVersion,
      lastAcknowledgedSequence,
      status: 'ONLINE_SYNCED',
    });

    return reply.send({
      accepted: true,
      nodeId,
      centralSequence: centralStore.getCentralSequence(),
      downstreamAvailable: false,
      timestamp: new Date().toISOString(),
    });
  });

  // 2. Ingest Batch of Offline Events (04_OFFLINE_SYNC_PROTOCOL.md Step 3-6)
  app.post<{
    Body: {
      nodeId: string;
      events: SyncEvent[];
    };
  }>('/api/v1/sync/events', async (request, reply) => {
    const { nodeId, events } = request.body || {};

    if (!nodeId || !Array.isArray(events)) {
      return reply.status(400).send({
        error: 'BAD_REQUEST',
        message: 'nodeId and events array are required',
      });
    }

    const accepted: string[] = [];
    const rejected: Array<{ eventId: string; reason: string }> = [];

    for (const event of events) {
      // Step A: Validate hash integrity
      if (!event.id || !event.hash) {
        rejected.push({ eventId: event.id || 'unknown', reason: 'MISSING_METADATA' });
        continue;
      }

      const isValidHash = verifyEventHash(event);
      if (!isValidHash) {
        rejected.push({ eventId: event.id, reason: 'HASH_MISMATCH' });
        continue;
      }

      // Step B: Idempotency check (Duplicate Upload Handling)
      if (centralStore.isEventIngested(event.id)) {
        // Already processed; acknowledge without duplicate mutation
        accepted.push(event.id);
        continue;
      }

      // Step C: Apply domain mutations to Central DB
      const payload = event.payload as any;
      try {
        switch (event.aggregateType) {
          case 'ATTENDANCE':
            centralStore.recordAttendance({
              recordId: payload.recordId || event.id,
              sessionId: payload.sessionId,
              traineeId: payload.traineeId,
              method: payload.method || payload.verificationMethod,
              result: payload.result || payload.status || 'PRESENT',
              occurredAt: event.occurredAt,
              nodeId,
            });
            break;

          case 'PROGRESS':
            centralStore.recordProgress({
              traineeId: payload.traineeId,
              lessonId: payload.lessonId,
              completed: payload.completed ?? true,
              eventType: payload.eventType || 'LESSON_COMPLETED',
              occurredAt: event.occurredAt,
              nodeId,
            });
            break;

          case 'ASSESSMENT':
            centralStore.recordAssessmentSubmission({
              submissionId: payload.submissionId || event.id,
              assessmentId: payload.assessmentId,
              traineeId: payload.traineeId,
              score: payload.score,
              passed: payload.passed,
              correctCount: payload.correctCount,
              totalQuestions: payload.totalQuestions,
              answers: payload.answers,
              occurredAt: event.occurredAt,
              nodeId,
            });
            break;

          default:
            // Generic event record
            break;
        }

        // Record in central event log and advance sequence
        centralStore.recordIngestedEvent(event);
        accepted.push(event.id);
      } catch (err: any) {
        rejected.push({ eventId: event.id, reason: err?.message || 'MUTATION_FAILED' });
      }
    }

    // Update node fleet sync time
    centralStore.registerOrUpdateEdgeNode(nodeId, {
      lastSyncAt: new Date().toISOString(),
      lastAcknowledgedSequence: events.length > 0 ? events[events.length - 1].logicalSequence : 0,
    });

    return reply.send({
      accepted,
      rejected,
      centralSequence: centralStore.getCentralSequence(),
      timestamp: new Date().toISOString(),
    });
  });

  // 3. Node Fleet Status
  app.get<{ Params: { nodeId: string } }>('/api/v1/sync/status/:nodeId', async (request, reply) => {
    const node = centralStore.getEdgeNode(request.params.nodeId);
    if (!node) {
      return reply.status(404).send({ error: 'NOT_FOUND', message: 'Node not registered' });
    }
    return reply.send({ node });
  });

  // 4. Overall Sync Stats for Admin Dashboard
  app.get('/api/v1/sync/stats', async () => {
    return centralStore.getSyncStats();
  });

  // 5. Query Trainee Progress Centrally
  app.get<{ Params: { id: string } }>('/api/v1/trainees/:id/progress', async (request) => {
    return centralStore.getTraineeProgress(request.params.id);
  });

  // 6. Query Session Attendance Centrally
  app.get<{ Params: { id: string } }>('/api/v1/sessions/:id/attendance', async (request) => {
    const records = centralStore.listAttendanceBySession(request.params.id);
    return { attendance: records };
  });

  // 7. Query Assessment Submissions Centrally
  app.get<{ Querystring: { traineeId?: string } }>('/api/v1/assessments/submissions', async (request) => {
    const submissions = centralStore.listAssessmentSubmissions(request.query.traineeId);
    return { submissions };
  });
}

import { FastifyInstance } from 'fastify';
import { EdgeJournalService } from '../services/journal-service.js';
import { EdgeSyncClient } from '../services/sync-client.js';
import type { SyncEvent } from '@sahakar/types';

export async function registerSyncRoutes(
  app: FastifyInstance,
  journalService: EdgeJournalService
) {
  // Sync queue status
  app.get('/api/v1/sync/status', async () => {
    const stats = journalService.getStats();
    return {
      status: stats.queuedCount === 0 ? 'ONLINE_SYNCED' : 'OFFLINE_READY',
      queuedCount: stats.queuedCount,
      syncedCount: stats.syncedCount,
      failedCount: stats.failedCount,
      totalCount: stats.totalCount,
      lastLogicalSequence: stats.lastLogicalSequence,
      lastSyncAt: stats.lastSyncAt,
    };
  });

  // Client device ingestion endpoint: allows Trainee PWA or Classroom terminals to buffer events to Edge Node
  app.post<{
    Body: {
      nodeId?: string;
      events: SyncEvent[];
    };
  }>('/api/v1/sync/events', async (request, reply) => {
    const { events } = request.body || {};
    if (!Array.isArray(events)) {
      return reply.status(400).send({
        error: 'BAD_REQUEST',
        message: 'events must be an array of SyncEvent',
      });
    }

    for (const ev of events) {
      journalService.ingestClientEvent(ev);
    }

    const stats = journalService.getStats();
    return reply.status(200).send({
      success: true,
      processedCount: events.length,
      currentQueued: stats.queuedCount,
    });
  });

  // Pull batch of queued events for central sync
  app.get<{ Querystring: { limit?: string } }>('/api/v1/sync/events', async (request) => {
    const limit = Number(request.query.limit) || 100;
    const events = journalService.getQueuedEvents(limit);
    return {
      events,
      count: events.length,
    };
  });

  // Trigger outbound sync from Edge Node to Central Cloud
  app.post<{
    Body?: {
      centralApiUrl?: string;
      nodeId?: string;
      instituteId?: string;
    };
  }>('/api/v1/sync/trigger', async (request, reply) => {
    const centralApiUrl =
      request.body?.centralApiUrl ||
      process.env.CENTRAL_API_URL ||
      'http://localhost:4000';
    const nodeId =
      request.body?.nodeId || (app as any).nodeId || 'edge-node-ricm-bhopal-01';
    const instituteId =
      request.body?.instituteId || '22222222-2222-2222-2222-222222222221';

    const client = new EdgeSyncClient(
      { centralApiUrl, nodeId, instituteId },
      journalService
    );

    const result = await client.syncBatch();
    return reply.send(result);
  });

  // Acknowledge synced events
  app.post<{
    Body: {
      acceptedEventIds: string[];
      centralSequence?: number;
    };
  }>('/api/v1/sync/ack', async (request, reply) => {
    const { acceptedEventIds, centralSequence } = request.body || {};
    if (!Array.isArray(acceptedEventIds)) {
      return reply.status(400).send({
        error: 'BAD_REQUEST',
        message: 'acceptedEventIds must be an array',
      });
    }

    journalService.markEventsSynced(acceptedEventIds, centralSequence);
    const updatedStats = journalService.getStats();

    return reply.send({
      success: true,
      acknowledgedCount: acceptedEventIds.length,
      remainingQueued: updatedStats.queuedCount,
      lastSyncAt: updatedStats.lastSyncAt,
    });
  });

  // Audit journal view
  app.get<{ Querystring: { limit?: string } }>('/api/v1/sync/journal', async (request) => {
    const limit = Number(request.query.limit) || 50;
    const journal = journalService.getJournalHistory(limit);
    return { journal };
  });
}

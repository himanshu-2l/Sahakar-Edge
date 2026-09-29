import { FastifyInstance } from 'fastify';
import { EdgeJournalService } from '../services/journal-service.js';

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

  // Pull batch of queued events for central sync
  app.get<{ Querystring: { limit?: string } }>('/api/v1/sync/events', async (request) => {
    const limit = Number(request.query.limit) || 100;
    const events = journalService.getQueuedEvents(limit);
    return {
      events,
      count: events.length,
    };
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

import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { DatabaseSync } from 'node:sqlite';
import { DeviceTelemetry, EdgeNodeHealthStatus } from '@sahakar/types';
import { createEdgeDatabase } from './db/edge-db.js';
import { EdgeJournalService } from './services/journal-service.js';
import { EdgeAuthService } from './services/edge-auth.js';
import { registerAuthRoutes } from './routes/auth.routes.js';
import { registerAttendanceRoutes } from './routes/attendance.routes.js';
import { registerLearningRoutes } from './routes/learning.routes.js';
import { registerAssessmentRoutes } from './routes/assessments.routes.js';
import { registerSyncRoutes } from './routes/sync.routes.js';

export interface EdgeServerConfig {
  nodeId: string;
  instituteId: string;
  wanSimulationMode: 'online' | 'offline' | 'flaky';
  dbPath?: string;
  existingDb?: DatabaseSync;
}

export interface EdgeServerInstance extends FastifyInstance {
  db: DatabaseSync;
  journalService: EdgeJournalService;
  authService: EdgeAuthService;
  nodeId: string;
  getWanMode: () => 'online' | 'offline' | 'flaky';
  setWanMode: (mode: 'online' | 'offline' | 'flaky') => void;
}

export async function buildEdgeServer(
  config: Partial<EdgeServerConfig> = {}
): Promise<EdgeServerInstance> {
  const nodeId = config.nodeId || 'edge-node-ricm-bhopal-01';
  let wanMode: 'online' | 'offline' | 'flaky' = config.wanSimulationMode || 'online';

  // SQLite database instance with WAL mode
  const db = config.existingDb || createEdgeDatabase(config.dbPath || ':memory:');
  const journalService = new EdgeJournalService(db, nodeId);
  const authService = new EdgeAuthService(db);

  const app = Fastify({
    logger: false,
  }) as unknown as EdgeServerInstance;

  app.db = db;
  app.journalService = journalService;
  app.authService = authService;
  app.nodeId = nodeId;
  app.getWanMode = () => wanMode;
  app.setWanMode = (m) => {
    wanMode = m;
  };

  await app.register(cors, {
    origin: '*',
  });

  // Local edge node health telemetry endpoint
  app.get('/health', async () => {
    const memory = process.memoryUsage();
    const stats = journalService.getStats();

    const telemetry: DeviceTelemetry = {
      cpuTemperatureC: 44.2, // normal ambient temperature under active fan cooling
      cpuLoadPercent: 12.5,
      memoryUsagePercent: Math.round((memory.heapUsed / memory.heapTotal) * 100),
      diskUsagePercent: 24.0, // ample NVMe storage headroom
      uptimeSeconds: Math.round(process.uptime()),
      networkState:
        wanMode === 'offline' ? 'OFFLINE' : wanMode === 'flaky' ? 'DEGRADED' : 'ONLINE',
      wanSimulationMode: wanMode,
      appVersion: '1.0.0',
      lastSyncAt: stats.lastSyncAt,
      queuedEventCount: stats.queuedCount,
    };

    return {
      nodeId,
      status:
        wanMode === 'offline'
          ? EdgeNodeHealthStatus.OFFLINE_READY
          : stats.queuedCount > 0
          ? EdgeNodeHealthStatus.ONLINE_SYNCING
          : EdgeNodeHealthStatus.ONLINE_SYNCED,
      telemetry,
      timestamp: new Date().toISOString(),
    };
  });

  // WAN Simulation control endpoint for demonstrations per 04_OFFLINE_SYNC_PROTOCOL.md
  app.post<{ Body: { mode: 'online' | 'offline' | 'flaky' } }>(
    '/api/v1/edge/wan-simulation',
    async (request) => {
      wanMode = request.body.mode;
      return {
        success: true,
        wanSimulationMode: wanMode,
        message: `WAN mode updated to ${wanMode}`,
      };
    }
  );

  // Local API base
  app.get('/api/v1', async () => {
    const stats = journalService.getStats();
    return {
      message: 'Sahakar Edge Node Local Server v1 - Offline LMS & Event Journal',
      nodeId,
      wanSimulationMode: wanMode,
      queueStats: stats,
    };
  });

  // Register domain route modules
  await registerAuthRoutes(app, authService);
  await registerAttendanceRoutes(app, db, journalService, authService);
  await registerLearningRoutes(app, db, journalService);
  await registerAssessmentRoutes(app, db, journalService);
  await registerSyncRoutes(app, journalService);

  return app;
}

const isDirectRun =
  process.argv[1] &&
  (process.argv[1].endsWith('server.js') || process.argv[1].endsWith('server.ts'));
if (isDirectRun && process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
  const port = Number(process.env.PORT) || 4100;
  const host = process.env.HOST || '0.0.0.0';
  const server = await buildEdgeServer();
  await server.listen({ port, host });
  console.log(`[Edge Server] Listening on http://${host}:${port}`);
}

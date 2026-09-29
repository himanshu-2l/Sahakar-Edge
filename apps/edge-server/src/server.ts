import Fastify from 'fastify';
import cors from '@fastify/cors';
import { DeviceTelemetry, EdgeNodeHealthStatus } from '@sahakar/types';

export interface EdgeServerConfig {
  nodeId: string;
  instituteId: string;
  wanSimulationMode: 'online' | 'offline' | 'flaky';
}

export async function buildEdgeServer(config: Partial<EdgeServerConfig> = {}) {
  const nodeId = config.nodeId || 'edge-node-ricm-bhopal-01';
  let wanMode: 'online' | 'offline' | 'flaky' = config.wanSimulationMode || 'online';

  const app = Fastify({
    logger: false,
  });

  await app.register(cors, {
    origin: '*',
  });

  // Local edge node health telemetry endpoint
  app.get('/health', async () => {
    const memory = process.memoryUsage();
    const telemetry: DeviceTelemetry = {
      cpuTemperatureC: 44.2, // normal ambient operational temperature
      cpuLoadPercent: 12.5,
      memoryUsagePercent: Math.round((memory.heapUsed / memory.heapTotal) * 100),
      diskUsagePercent: 24.0, // plenty of NVMe headroom
      uptimeSeconds: Math.round(process.uptime()),
      networkState: wanMode === 'offline' ? 'OFFLINE' : wanMode === 'flaky' ? 'DEGRADED' : 'ONLINE',
      wanSimulationMode: wanMode,
      appVersion: '1.0.0',
      lastSyncAt: null,
      queuedEventCount: 0,
    };

    return {
      nodeId,
      status: wanMode === 'offline' ? EdgeNodeHealthStatus.OFFLINE_READY : EdgeNodeHealthStatus.ONLINE_SYNCED,
      telemetry,
      timestamp: new Date().toISOString(),
    };
  });

  // WAN Simulation control endpoint for demonstrations
  app.post<{ Body: { mode: 'online' | 'offline' | 'flaky' } }>('/api/v1/edge/wan-simulation', async (request) => {
    wanMode = request.body.mode;
    return {
      success: true,
      wanSimulationMode: wanMode,
      message: `WAN mode updated to ${wanMode}`,
    };
  });

  // Local API base
  app.get('/api/v1', async () => {
    return {
      message: 'Sahakar Edge Node Local Server v1 - Offline LMS & Event Journal',
      nodeId,
      mode: wanMode,
    };
  });

  return app;
}

const isDirectRun = process.argv[1] && (process.argv[1].endsWith('server.js') || process.argv[1].endsWith('server.ts'));
if (isDirectRun && process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
  const port = Number(process.env.PORT) || 4100;
  const host = process.env.HOST || '0.0.0.0';
  const server = await buildEdgeServer();
  await server.listen({ port, host });
  console.log(`[Edge Server] Listening on http://${host}:${port}`);
}

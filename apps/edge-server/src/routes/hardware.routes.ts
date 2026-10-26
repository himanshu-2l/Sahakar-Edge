import { FastifyInstance } from 'fastify';
import { EdgeHealthDaemon } from '../services/health-daemon.js';

export async function registerHardwareRoutes(
  app: FastifyInstance,
  healthDaemon: EdgeHealthDaemon
) {
  // Edge Hardware Status Telemetry Endpoint
  app.get('/api/v1/hardware/status', async (_request, reply) => {
    const status = await healthDaemon.getHardwareStatus();
    return reply.send(status);
  });
}

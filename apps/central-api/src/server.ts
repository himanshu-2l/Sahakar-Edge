import Fastify from 'fastify';
import cors from '@fastify/cors';
import { authRoutes } from './routes/auth.routes.js';
import { instituteRoutes } from './routes/institutes.routes.js';
import { programmeRoutes } from './routes/programmes.routes.js';
import { batchRoutes } from './routes/batches.routes.js';
import { sessionRoutes } from './routes/sessions.routes.js';
import { courseRoutes } from './routes/courses.routes.js';
import { registerSyncRoutes } from './routes/sync.routes.js';

export async function buildCentralServer() {
  const app = Fastify({
    logger: false,
  });

  await app.register(cors, {
    origin: '*',
  });

  // Health endpoint
  app.get('/health', async () => {
    return {
      status: 'UP',
      surface: 'CENTRAL_API',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
  });

  // API v1 prefix base
  app.get('/api/v1', async () => {
    return {
      message: 'Sahakar Edge Central API v1 - National Council for Cooperative Training (NCCT)',
      docs: '/api/v1/docs',
    };
  });

  // Register domain modules under /api/v1
  await app.register(authRoutes, { prefix: '/api/v1' });
  await app.register(instituteRoutes, { prefix: '/api/v1' });
  await app.register(programmeRoutes, { prefix: '/api/v1' });
  await app.register(batchRoutes, { prefix: '/api/v1' });
  await app.register(sessionRoutes, { prefix: '/api/v1' });
  await app.register(courseRoutes, { prefix: '/api/v1' });
  await app.register(registerSyncRoutes);

  return app;
}

const isDirectRun = process.argv[1] && (process.argv[1].endsWith('server.js') || process.argv[1].endsWith('server.ts'));
if (isDirectRun && process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
  const port = Number(process.env.PORT) || 4000;
  const host = process.env.HOST || '0.0.0.0';
  const server = await buildCentralServer();
  await server.listen({ port, host });
  console.log(`[Central API] Listening on http://${host}:${port}`);
}

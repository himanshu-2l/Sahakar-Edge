import Fastify from 'fastify';
import cors from '@fastify/cors';

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

  return app;
}

if (process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
  const port = Number(process.env.PORT) || 4000;
  const host = process.env.HOST || '0.0.0.0';
  const server = await buildCentralServer();
  await server.listen({ port, host });
  console.log(`[Central API] Listening on http://${host}:${port}`);
}

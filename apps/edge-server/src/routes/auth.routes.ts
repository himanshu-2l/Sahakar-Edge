import { FastifyInstance } from 'fastify';
import { EdgeAuthService } from '../services/edge-auth.js';

export async function registerAuthRoutes(app: FastifyInstance, authService: EdgeAuthService) {
  app.post<{ Body: { emailOrPhone: string; password?: string } }>(
    '/api/v1/auth/login',
    async (request, reply) => {
      const { emailOrPhone } = request.body || {};
      if (!emailOrPhone) {
        return reply.status(400).send({ error: 'BAD_REQUEST', message: 'emailOrPhone is required' });
      }

      const result = authService.login(emailOrPhone);
      if (!result) {
        return reply.status(401).send({ error: 'UNAUTHORIZED', message: 'Identity not provisioned on this edge node' });
      }

      return reply.send({
        token: result.token,
        user: result.user,
        offlineProvisioned: true,
      });
    }
  );

  app.get('/api/v1/me', async (request, reply) => {
    const user = authService.requireAuth(request, reply);
    if (!user) return;
    return reply.send({ user, offlineProvisioned: true });
  });
}

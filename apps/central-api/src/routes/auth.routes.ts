import { FastifyInstance } from 'fastify';
import { loginSchema } from '@sahakar/validation';
import { centralStore } from '../store/memory-store.js';
import { generateToken, authenticate } from '../auth/auth-service.js';

export async function authRoutes(fastify: FastifyInstance) {
  // Login
  fastify.post('/auth/login', async (request, reply) => {
    const parseResult = loginSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'VALIDATION_ERROR',
        details: parseResult.error.flatten(),
      });
    }

    const { emailOrPhone } = parseResult.data;
    const user = centralStore.getUserByEmailOrPhone(emailOrPhone);

    if (!user) {
      return reply.status(401).send({
        error: 'INVALID_CREDENTIALS',
        message: 'No active user found with provided email or phone',
      });
    }

    const token = generateToken(user);

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        emailOrPhone: user.emailOrPhone,
        role: user.role,
        instituteId: user.instituteId,
        preferredLanguage: user.preferredLanguage,
      },
    };
  });

  // Current authenticated user info
  fastify.get('/me', { preHandler: [authenticate] }, async (request) => {
    return {
      user: request.auth?.user,
    };
  });
}

import { FastifyRequest, FastifyReply } from 'fastify';
import { User, UserRole, Permission, hasPermission } from '@sahakar/types';
import { centralStore } from '../store/memory-store.js';

export interface AuthContext {
  user: User;
  token: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    auth?: AuthContext;
  }
}

/**
 * Generate an authenticable token representing a user session.
 */
export function generateToken(user: User): string {
  const payload = {
    userId: user.id,
    email: user.emailOrPhone,
    role: user.role,
    instituteId: user.instituteId,
    iat: Date.now(),
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64url');
}

/**
 * Parses and verifies an incoming Bearer token.
 */
export function verifyToken(token: string): User | null {
  try {
    // Support convenient development seeded tokens
    if (token === 'superadmin-token') {
      const user = centralStore.getUserByEmailOrPhone('superadmin@ncct.gov.in');
      return user || null;
    }
    if (token === 'director-token') {
      const user = centralStore.getUserByEmailOrPhone('director@ricm-bhopal.gov.in');
      return user || null;
    }
    if (token === 'trainer-token') {
      const user = centralStore.getUserByEmailOrPhone('trainer@ricm-bhopal.gov.in');
      return user || null;
    }
    if (token === 'trainee-token') {
      const user = centralStore.getUserByEmailOrPhone('anita.patel@rural.org');
      return user || null;
    }

    const json = Buffer.from(token, 'base64url').toString('utf8');
    const parsed = JSON.parse(json);
    if (!parsed.userId) return null;
    return centralStore.getUser(parsed.userId) || null;
  } catch {
    return null;
  }
}

/**
 * Pre-handler authentication hook to populate request.auth
 */
export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    reply.status(401).send({
      error: 'UNAUTHORIZED',
      message: 'Authorization Bearer header is required',
    });
    return;
  }

  const token = authHeader.slice(7).trim();
  const user = verifyToken(token);
  if (!user) {
    reply.status(401).send({
      error: 'UNAUTHORIZED',
      message: 'Invalid or expired session token',
    });
    return;
  }

  request.auth = { user, token };
}

/**
 * Guard to enforce RBAC permissions
 */
export function requirePermission(permission: Permission) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.auth || !request.auth.user) {
      reply.status(401).send({
        error: 'UNAUTHORIZED',
        message: 'Authentication required for this operation',
      });
      return;
    }

    const { role } = request.auth.user;
    if (!hasPermission(role, permission)) {
      reply.status(403).send({
        error: 'FORBIDDEN',
        message: `Role '${role}' lacks required permission '${permission}'`,
      });
      return;
    }
  };
}

import { DatabaseSync } from 'node:sqlite';
import { FastifyRequest, FastifyReply } from 'fastify';
import type { User } from '@sahakar/types';
import { UserRole } from '@sahakar/types';

export interface LocalAuthSession {
  token: string;
  user: User;
  issuedAt: string;
}

export class EdgeAuthService {
  private db: DatabaseSync;
  private activeSessions = new Map<string, User>();

  constructor(db: DatabaseSync) {
    this.db = db;
  }

  public login(emailOrPhone: string): { token: string; user: User } | null {
    const row = this.db
      .prepare(`
        SELECT id, name, email_or_phone, role, institute_id, preferred_language, active
        FROM local_users
        WHERE email_or_phone = ? AND active = 1
      `)
      .get(emailOrPhone) as any;

    if (!row) {
      return null;
    }

    const user: User = {
      id: row.id,
      name: row.name,
      emailOrPhone: row.email_or_phone,
      role: row.role as UserRole,
      instituteId: row.institute_id,
      preferredLanguage: row.preferred_language,
      active: Boolean(row.active),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const token = `edge_offline_token_${user.id}_${Date.now()}`;
    this.activeSessions.set(token, user);

    return { token, user };
  }

  public authenticate(req: FastifyRequest): User | null {
    const authHeader = req.headers.authorization;
    if (!authHeader) return null;

    const token = authHeader.replace(/^Bearer\s+/i, '');
    if (this.activeSessions.has(token)) {
      return this.activeSessions.get(token)!;
    }

    // Direct token pattern for edge offline convenience
    if (token.startsWith('edge_offline_token_')) {
      const parts = token.split('_');
      const userId = parts[3];
      const row = this.db
        .prepare(`
          SELECT id, name, email_or_phone, role, institute_id, preferred_language, active
          FROM local_users
          WHERE id = ? AND active = 1
        `)
        .get(userId) as any;

      if (row) {
        const user: User = {
          id: row.id,
          name: row.name,
          emailOrPhone: row.email_or_phone,
          role: row.role as UserRole,
          instituteId: row.institute_id,
          preferredLanguage: row.preferred_language,
          active: Boolean(row.active),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        this.activeSessions.set(token, user);
        return user;
      }
    }

    return null;
  }

  public requireAuth(req: FastifyRequest, reply: FastifyReply): User | null {
    const user = this.authenticate(req);
    if (!user) {
      reply.status(401).send({ error: 'UNAUTHORIZED', message: 'Local edge authentication required' });
      return null;
    }
    return user;
  }
}

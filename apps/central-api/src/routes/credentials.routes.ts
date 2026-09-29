import { FastifyInstance } from 'fastify';
import { credentialService } from '../services/credential-service.js';
import { authenticate, requirePermission } from '../auth/auth-service.js';
import { centralStore } from '../store/memory-store.js';

export async function registerCredentialRoutes(app: FastifyInstance) {
  // Public issuer public key discovery
  app.get('/api/v1/credentials/issuer-key', async () => {
    return credentialService.getIssuerPublicKey();
  });

  // Evaluate eligibility before issuance
  app.get<{
    Querystring: { traineeId: string; programmeId: string };
  }>('/api/v1/credentials/eligibility', async (request, reply) => {
    const { traineeId, programmeId } = request.query;
    if (!traineeId || !programmeId) {
      return reply.status(400).send({
        error: 'BAD_REQUEST',
        message: 'traineeId and programmeId query parameters required',
      });
    }

    const eligibility = credentialService.evaluateEligibility(traineeId, programmeId);
    return reply.send({ eligibility });
  });

  // Issue Ed25519 digital credential (Protected by RBAC: issue:credentials)
  app.post<{
    Body: {
      traineeId: string;
      programmeId: string;
      forceOverride?: boolean;
    };
  }>(
    '/api/v1/credentials/issue',
    { preHandler: [authenticate, requirePermission('issue:credentials')] },
    async (request, reply) => {
      const { traineeId, programmeId, forceOverride } = request.body || {};
      if (!traineeId || !programmeId) {
        return reply.status(400).send({
          error: 'BAD_REQUEST',
          message: 'traineeId and programmeId are required',
        });
      }

      const actor = (request as any).user;
      try {
        const result = credentialService.issueCredential({
          traineeId,
          programmeId,
          actorId: actor?.id || 'admin',
          forceOverride,
        });

        return reply.status(201).send({
          success: true,
          credential: result.credential,
          signature: result.signatureHex,
          qrPayload: result.qrPayload,
          verificationUrl: result.verificationUrl,
        });
      } catch (err: any) {
        return reply.status(422).send({
          error: 'UNPROCESSABLE_ENTITY',
          message: err?.message || 'Failed to issue credential',
        });
      }
    }
  );

  // Get credential by ID
  app.get<{ Params: { id: string } }>('/api/v1/credentials/:id', async (request, reply) => {
    const cred = centralStore.getCredential(request.params.id);
    if (!cred) {
      return reply.status(404).send({ error: 'NOT_FOUND', message: 'Credential not found' });
    }
    return reply.send({ credential: cred });
  });

  // Revoke credential (Protected by RBAC: issue:credentials)
  app.post<{
    Params: { id: string };
    Body: { reason: string };
  }>(
    '/api/v1/credentials/:id/revoke',
    { preHandler: [authenticate, requirePermission('issue:credentials')] },
    async (request, reply) => {
      const { reason } = request.body || {};
      if (!reason) {
        return reply.status(400).send({
          error: 'BAD_REQUEST',
          message: 'Revocation reason is required',
        });
      }

      const actor = (request as any).user;
      try {
        const revoked = credentialService.revokeCredential(
          request.params.id,
          reason,
          actor?.id || 'admin'
        );
        return reply.send({ success: true, credential: revoked });
      } catch (err: any) {
        return reply.status(404).send({ error: 'NOT_FOUND', message: err.message });
      }
    }
  );

  // Public verifier endpoint (Online check or offline signature check)
  app.post<{
    Body: {
      credentialId?: string;
      payload?: any;
      signatureHex?: string;
    };
  }>('/api/v1/credentials/verify', async (request, reply) => {
    const { credentialId, payload, signatureHex } = request.body || {};
    const result = credentialService.verifyCredential({
      credentialId,
      payload,
      signatureHex,
    });

    return reply.send({
      valid: result.valid,
      status: result.status,
      credential: result.credential,
      details: result.details,
      verifiedAt: new Date().toISOString(),
    });
  });

  // List trainee credentials
  app.get<{ Params: { id: string } }>('/api/v1/trainees/:id/credentials', async (request) => {
    const credentials = centralStore.listCredentials(request.params.id);
    return { credentials };
  });
}

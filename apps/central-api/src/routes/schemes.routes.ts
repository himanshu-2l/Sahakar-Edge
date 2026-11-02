import { FastifyInstance } from 'fastify';
import { centralStore } from '../store/memory-store.js';
import type { SchemeEvaluationInput } from '@sahakar/types';

export async function schemesRoutes(fastify: FastifyInstance) {
  // 1. List all available national cooperative schemes
  fastify.get('/schemes', async (_request, reply) => {
    const schemes = centralStore.getSchemes();
    return reply.send({
      count: schemes.length,
      schemes,
    });
  });

  // 2. Evaluate eligibility & subsidy benefits for a cooperative society
  fastify.post<{
    Body: SchemeEvaluationInput;
  }>('/schemes/evaluate', async (request, reply) => {
    const body = request.body;
    if (!body || !body.societyType || !body.auditGrade || typeof body.proposedProjectCostLakhs !== 'number') {
      return reply.status(400).send({
        error: 'BAD_REQUEST',
        message: 'societyType, auditGrade, and proposedProjectCostLakhs are required fields',
      });
    }

    const evaluations = centralStore.evaluateSchemeEligibility(body);
    const eligibleCount = evaluations.filter((e) => e.eligible).length;

    return reply.send({
      evaluatedSociety: body.societyName || 'Applicant Cooperative Society',
      societyType: body.societyType,
      auditGrade: body.auditGrade,
      totalSchemesEvaluated: evaluations.length,
      eligibleSchemesCount: eligibleCount,
      evaluations,
    });
  });
}

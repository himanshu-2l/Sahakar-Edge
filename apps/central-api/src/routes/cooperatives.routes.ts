import { FastifyInstance } from 'fastify';
import { centralStore } from '../store/memory-store.js';

export async function cooperativesRoutes(fastify: FastifyInstance) {
  // 1. Get CAMEL Health Scorecards for all registered cooperatives
  fastify.get('/cooperatives/health', async (_request, reply) => {
    const scorecards = centralStore.getSocietyHealthScorecards();
    const gradeDistribution = {
      gradeA: scorecards.filter((s) => s.auditGrade === 'A').length,
      gradeB: scorecards.filter((s) => s.auditGrade === 'B').length,
      gradeC: scorecards.filter((s) => s.auditGrade === 'C').length,
      gradeD: scorecards.filter((s) => s.auditGrade === 'D').length,
    };

    return reply.send({
      count: scorecards.length,
      gradeDistribution,
      scorecards,
    });
  });

  // 2. Get detailed CAMEL Health Scorecard for a specific cooperative society
  fastify.get<{ Params: { id: string } }>('/cooperatives/:id/health', async (request, reply) => {
    const scorecard = centralStore.getSocietyHealthScorecard(request.params.id);
    if (!scorecard) {
      return reply.status(404).send({
        error: 'NOT_FOUND',
        message: `Cooperative society health scorecard not found for ID: ${request.params.id}`,
      });
    }

    return reply.send({ scorecard });
  });
}

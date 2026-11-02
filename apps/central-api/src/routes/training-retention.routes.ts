import { FastifyInstance } from 'fastify';
import { centralStore } from '../store/memory-store.js';

export async function trainingRetentionRoutes(fastify: FastifyInstance) {
  // 4-Factor student dropout-risk triage radar
  fastify.get<{
    Querystring: { programmeId?: string; instituteId?: string; tier?: string };
  }>('/retention/dropout-risk', async (request, reply) => {
    const { programmeId, instituteId, tier } = request.query;
    const analysis = centralStore.getDropoutRiskAnalysis(programmeId, instituteId, tier);
    return reply.send(analysis);
  });

  // Inter-tier geographic reach & training delivery velocity
  fastify.get('/retention/reach-metrics', async (_request, reply) => {
    const metrics = centralStore.getGeographicReachMetrics();
    return reply.send(metrics);
  });

  // Cooperative skill demand vs supply shortage radar
  fastify.get<{
    Querystring: { category?: string };
  }>('/retention/skill-radar', async (request, reply) => {
    const radar = centralStore.getSectorSkillShortageRadar(request.query.category);
    return reply.send({
      count: radar.length,
      radar,
    });
  });
}

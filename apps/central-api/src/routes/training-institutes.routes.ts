import { FastifyInstance } from 'fastify';
import { centralStore } from '../store/memory-store.js';

export async function trainingInstitutesRoutes(fastify: FastifyInstance) {
  // List all NCCT training institutes (with optional tier filter)
  fastify.get<{
    Querystring: { tier?: string };
  }>('/institutes', async (request, reply) => {
    const tier = request.query.tier;
    const institutes = centralStore.listTrainingInstitutes(tier);
    return reply.send({
      count: institutes.length,
      institutes,
    });
  });

  // Get single institute details with hostel accommodation inventory summary
  fastify.get<{
    Params: { id: string };
  }>('/institutes/:id', async (request, reply) => {
    const institute = centralStore.getTrainingInstitute(request.params.id);
    if (!institute) {
      return reply.status(404).send({
        error: 'INSTITUTE_NOT_FOUND',
        message: `Training institute ${request.params.id} not found`,
      });
    }

    const hostelInventory = centralStore.getHostelInventorySummary(institute.id);

    return reply.send({
      institute,
      hostelInventory,
    });
  });
}

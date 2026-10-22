import { FastifyInstance } from 'fastify';
import { centralStore } from '../store/memory-store.js';

export async function counselorRoutes(fastify: FastifyInstance) {
  fastify.post<{
    Body: {
      query: string;
      candidateId?: string;
      language?: 'EN' | 'HI';
    };
  }>('/counselor/query', async (request, reply) => {
    const { query, candidateId, language = 'EN' } = request.body || {};
    if (!query || typeof query !== 'string') {
      return reply.status(400).send({
        error: 'BAD_REQUEST',
        message: 'query is required',
      });
    }

    const result = centralStore.queryCounselor(query, candidateId, language);
    return reply.send(result);
  });
}

import { FastifyInstance } from 'fastify';
import { centralStore } from '../store/memory-store.js';
import type { GrievancePriority, GrievanceStatus, GrievanceComplainantRole } from '@sahakar/types';

export async function grievancesRoutes(fastify: FastifyInstance) {
  // 1. List grievance tickets with optional filters
  fastify.get<{
    Querystring: {
      status?: GrievanceStatus;
      tier?: string;
      priority?: GrievancePriority;
      complainantId?: string;
    };
  }>('/grievances', async (request, reply) => {
    const { status, tier, priority, complainantId } = request.query;
    const grievances = centralStore.getGrievances({
      status,
      tier: tier ? Number(tier) : undefined,
      priority,
      complainantId,
    });

    return reply.send({
      count: grievances.length,
      grievances,
    });
  });

  // 2. Lodge a new member grievance ticket
  fastify.post<{
    Body: {
      complainantId: string;
      complainantName: string;
      complainantRole: GrievanceComplainantRole;
      societyOrInstituteId: string;
      societyName: string;
      category: string;
      title: string;
      description: string;
      priority?: GrievancePriority;
    };
  }>('/grievances', async (request, reply) => {
    const { complainantId, complainantName, societyOrInstituteId, category, title, description } = request.body || {};
    if (!complainantId || !complainantName || !societyOrInstituteId || !category || !title || !description) {
      return reply.status(400).send({
        error: 'BAD_REQUEST',
        message: 'complainantId, complainantName, societyOrInstituteId, category, title, and description are required',
      });
    }

    const ticket = centralStore.createGrievance(request.body);
    return reply.status(201).send({
      success: true,
      ticket,
    });
  });

  // 3. Escalate grievance ticket to next tier (MSCS 2023 SLA trigger)
  fastify.post<{
    Params: { id: string };
    Body?: { reason?: string };
  }>('/grievances/:id/escalate', async (request, reply) => {
    try {
      const updated = centralStore.escalateGrievance(request.params.id, request.body?.reason);
      return reply.send({
        success: true,
        ticket: updated,
      });
    } catch (err: any) {
      return reply.status(400).send({
        error: 'ESCALATION_FAILED',
        message: err.message,
      });
    }
  });

  // 4. Resolve grievance ticket with statutory closure summary
  fastify.post<{
    Params: { id: string };
    Body: { resolutionSummary: string };
  }>('/grievances/:id/resolve', async (request, reply) => {
    const { resolutionSummary } = request.body || {};
    if (!resolutionSummary || resolutionSummary.trim().length === 0) {
      return reply.status(400).send({
        error: 'BAD_REQUEST',
        message: 'resolutionSummary is required to resolve a grievance ticket',
      });
    }

    try {
      const updated = centralStore.resolveGrievance(request.params.id, resolutionSummary);
      return reply.send({
        success: true,
        ticket: updated,
      });
    } catch (err: any) {
      return reply.status(400).send({
        error: 'RESOLUTION_FAILED',
        message: err.message,
      });
    }
  });
}

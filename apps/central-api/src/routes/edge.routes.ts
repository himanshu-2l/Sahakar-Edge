import { FastifyInstance } from 'fastify';
import { centralStore } from '../store/memory-store.js';
import { authenticate, requirePermission } from '../auth/auth-service.js';
import type { DeviceTelemetry, EdgeNode, EdgeNodeHealthStatus } from '@sahakar/types';

export async function edgeRoutes(fastify: FastifyInstance) {
  // 1. List Edge Nodes
  fastify.get('/edge', async () => {
    return {
      edgeNodes: centralStore.listEdgeNodes(),
    };
  });

  // 2. Register Edge Node per 08_API_SPEC.md
  fastify.post<{
    Body: {
      nodeId: string;
      instituteId: string;
      name: string;
      publicKey?: string;
      softwareVersion?: string;
      telemetry?: DeviceTelemetry;
    };
  }>(
    '/edge/register',
    { preHandler: [authenticate, requirePermission('manage:institutes')] },
    async (request, reply) => {
      const { nodeId, instituteId, name, publicKey, softwareVersion, telemetry } = request.body || {};

      if (!nodeId || !instituteId || !name) {
        return reply.status(400).send({
          error: 'VALIDATION_ERROR',
          message: 'nodeId, instituteId, and name are required',
        });
      }

      const nodeData = {
        id: nodeId,
        nodeId,
        instituteId,
        name,
        publicKey: publicKey || 'ed25519-public-key-placeholder',
        softwareVersion: softwareVersion || '1.0.0',
        lastSeenAt: new Date().toISOString(),
        healthStatus: 'ONLINE_SYNCED' as EdgeNodeHealthStatus,
        telemetry,
      };

      centralStore.registerOrUpdateEdgeNode(nodeId, nodeData);

      return reply.status(201).send({
        success: true,
        node: nodeData,
        message: 'Edge node registered successfully in fleet registry',
      });
    }
  );

  // 3. Get Edge Node Health & Telemetry per 08_API_SPEC.md
  fastify.get<{ Params: { id: string } }>('/edge/:id/health', async (request, reply) => {
    const node = centralStore.getEdgeNode(request.params.id);
    if (!node) {
      return reply.status(404).send({
        error: 'NOT_FOUND',
        message: `Edge node ${request.params.id} not found`,
      });
    }

    return {
      nodeId: node.nodeId || node.id,
      healthStatus: node.healthStatus || 'ONLINE_SYNCED',
      lastSeenAt: node.lastSeenAt,
      telemetry: node.telemetry || {
        cpuTemperatureC: 42.0,
        cpuLoadPercent: 10.0,
        memoryUsagePercent: 30.0,
        diskUsagePercent: 20.0,
        uptimeSeconds: 3600,
        networkState: 'ONLINE',
        wanSimulationMode: 'online',
        appVersion: node.softwareVersion || '1.0.0',
        lastSyncAt: node.lastSeenAt,
        queuedEventCount: 0,
      },
    };
  });

  // 4. Edge Node Heartbeat Telemetry Submission per 08_API_SPEC.md & 05_HARDWARE_EDGE.md
  fastify.post<{
    Params: { id: string };
    Body: {
      telemetry: DeviceTelemetry;
      healthStatus?: EdgeNodeHealthStatus;
    };
  }>('/edge/:id/heartbeat', async (request, reply) => {
    const nodeId = request.params.id;
    const { telemetry, healthStatus } = request.body || {};

    if (!telemetry) {
      return reply.status(400).send({
        error: 'VALIDATION_ERROR',
        message: 'telemetry payload is required',
      });
    }

    const existing = centralStore.getEdgeNode(nodeId) || {
      id: nodeId,
      nodeId,
      instituteId: '11111111-1111-1111-1111-111111111111',
      name: `Edge Gateway ${nodeId}`,
    };

    centralStore.registerOrUpdateEdgeNode(nodeId, {
      ...existing,
      telemetry,
      healthStatus: healthStatus || (telemetry.networkState === 'OFFLINE' ? 'OFFLINE_READY' : 'ONLINE_SYNCED'),
      lastSeenAt: new Date().toISOString(),
    });

    return reply.send({
      acknowledged: true,
      nodeId,
      serverTime: new Date().toISOString(),
      centralSequence: centralStore.getCentralSequence(),
    });
  });
}

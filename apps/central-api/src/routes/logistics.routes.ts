import { FastifyInstance } from 'fastify';
import { centralStore, HostelAllotment, TimetableSlot, HardwareDeploymentKit, AuditLogEntry } from '../store/memory-store.js';

export async function logisticsRoutes(fastify: FastifyInstance) {
  // Hostel Allotments
  fastify.get('/logistics/hostels', async () => {
    return {
      hostelAllotments: centralStore.listHostelAllotments(),
      totalCount: centralStore.listHostelAllotments().length,
    };
  });

  fastify.post<{ Body: Partial<HostelAllotment> }>('/logistics/hostels', async (request, reply) => {
    const body = request.body || {};
    if (!body.traineeName || !body.hostelBlock || !body.roomNo) {
      return reply.status(400).send({
        error: 'VALIDATION_ERROR',
        message: 'traineeName, hostelBlock, and roomNo are required',
      });
    }
    const allotment = centralStore.allotHostelRoom({
      traineeName: body.traineeName,
      institute: body.institute || 'RICM Bhopal',
      hostelBlock: body.hostelBlock,
      roomNo: body.roomNo,
      bedType: body.bedType || 'Single Bed',
      checkIn: body.checkIn || new Date().toISOString().split('T')[0],
      checkOut: body.checkOut || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      status: body.status || 'CHECKED_IN',
      messOptIn: body.messOptIn !== undefined ? body.messOptIn : true,
    });
    return reply.status(201).send({ allotment });
  });

  // Timetable
  fastify.get('/logistics/timetable', async () => {
    return {
      timetable: centralStore.listTimetable(),
    };
  });

  fastify.post<{ Body: Partial<TimetableSlot> }>('/logistics/timetable', async (request, reply) => {
    const body = request.body || {};
    if (!body.timeSlot || !body.subject || !body.venue) {
      return reply.status(400).send({
        error: 'VALIDATION_ERROR',
        message: 'timeSlot, subject, and venue are required',
      });
    }
    const slot = centralStore.addTimetableSlot({
      timeSlot: body.timeSlot,
      subject: body.subject,
      venue: body.venue,
      trainer: body.trainer || 'Faculty Member',
      status: body.status || 'SCHEDULED',
    });
    return reply.status(201).send({ slot });
  });

  // Mess
  fastify.get('/logistics/mess', async () => {
    return {
      messMenu: centralStore.getMessMenu(),
    };
  });

  // Hardware Deployment Kits
  fastify.get('/logistics/kits', async () => {
    return {
      hardwareKits: centralStore.listHardwareKits(),
    };
  });

  fastify.get('/logistics/hardware-kits', async () => {
    return {
      hardwareKits: centralStore.listHardwareKits(),
    };
  });

  fastify.post<{ Body: Partial<HardwareDeploymentKit> }>('/logistics/kits', async (request, reply) => {
    const body = request.body || {};
    if (!body.nodeSerial || !body.venue) {
      return reply.status(400).send({
        error: 'VALIDATION_ERROR',
        message: 'nodeSerial and venue are required',
      });
    }
    const kit = centralStore.registerHardwareKit({
      nodeSerial: body.nodeSerial,
      components: body.components || 'Raspberry Pi 4 ARM64 + 64GB NVMe + AP + UPS',
      venue: body.venue,
      status: body.status || 'DEPLOYED_OPERATIONAL',
      dispatchedAt: body.dispatchedAt || new Date().toISOString().split('T')[0],
    });
    return reply.status(201).send({ kit });
  });

  // Central Verified Attendance Records
  fastify.get('/attendance/records', async () => {
    return {
      attendanceRecords: centralStore.listAllAttendance(),
      totalCount: centralStore.listAllAttendance().length,
    };
  });

  // Audit Logs
  fastify.get<{ Querystring: { limit?: string } }>('/audit-logs', async (request) => {
    const limit = Number(request.query.limit) || 100;
    return {
      auditLogs: centralStore.listAuditLogs(limit),
    };
  });

  fastify.get<{ Querystring: { limit?: string } }>('/logistics/audit-logs', async (request) => {
    const limit = Number(request.query.limit) || 100;
    return {
      auditLogs: centralStore.listAuditLogs(limit),
    };
  });

  fastify.post<{ Body: Partial<AuditLogEntry> }>('/audit-logs', async (request, reply) => {
    const body = request.body || {};
    if (!body.action || !body.details) {
      return reply.status(400).send({
        error: 'VALIDATION_ERROR',
        message: 'action and details are required',
      });
    }
    const entry = centralStore.logAuditEvent({
      action: body.action,
      actor: body.actor || 'system',
      details: body.details,
    });
    return reply.status(201).send({ auditLog: entry });
  });

  // Analytics Overview for NCCT Central Monitoring & Outreach (PS 26087)
  fastify.get('/analytics/overview', async () => {
    return centralStore.getAnalyticsOverview();
  });
}

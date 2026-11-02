import { FastifyInstance } from 'fastify';
import { trainingInstitutesRoutes } from './training-institutes.routes.js';
import { trainingProgrammesRoutes } from './training-programmes.routes.js';
import { trainingNominationsRoutes } from './training-nominations.routes.js';
import { trainingTimetableRoutes } from './training-timetable.routes.js';
import { trainingAttendanceRoutes } from './training-attendance.routes.js';
import { trainingEvaluationRoutes } from './training-evaluation.routes.js';
import { trainingRetentionRoutes } from './training-retention.routes.js';
import { trainingLogisticsRoutes } from './training-logistics.routes.js';

export async function trainingRoutes(fastify: FastifyInstance) {
  await fastify.register(trainingInstitutesRoutes);
  await fastify.register(trainingProgrammesRoutes);
  await fastify.register(trainingNominationsRoutes);
  await fastify.register(trainingTimetableRoutes);
  await fastify.register(trainingAttendanceRoutes);
  await fastify.register(trainingEvaluationRoutes);
  await fastify.register(trainingRetentionRoutes);
  await fastify.register(trainingLogisticsRoutes);
}

import { FastifyInstance } from 'fastify';
import {
  createCourseModuleTestSchema,
  submitTestAttemptSchema,
  gradebookExportQuerySchema,
} from '@sahakar/validation';
import { centralStore } from '../store/memory-store.js';

export async function trainingEvaluationRoutes(fastify: FastifyInstance) {
  // List module tests for a course
  fastify.get<{
    Querystring: { courseId?: string };
  }>('/evaluation/tests', async (request, reply) => {
    const tests = centralStore.listCourseModuleTests(request.query.courseId);
    return reply.send({
      count: tests.length,
      tests,
    });
  });

  // Get test details
  fastify.get<{
    Params: { id: string };
  }>('/evaluation/tests/:id', async (request, reply) => {
    const test = centralStore.getCourseModuleTest(request.params.id);
    if (!test) {
      return reply.status(404).send({
        error: 'TEST_NOT_FOUND',
        message: `Course module test ${request.params.id} not found`,
      });
    }
    return reply.send({ test });
  });

  // Create new module test or formative practice quiz
  fastify.post('/evaluation/tests', async (request, reply) => {
    const parse = createCourseModuleTestSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({
        error: 'VALIDATION_ERROR',
        details: parse.error.flatten(),
      });
    }

    const test = centralStore.createCourseModuleTest({
      ...parse.data,
      questionCount: (request.body as any)?.questions?.length || 0,
      questions: (request.body as any)?.questions || [],
    });

    return reply.status(201).send({
      success: true,
      test,
    });
  });

  // Submit test attempt (Formative Quiz or Summative Exam)
  fastify.post<{
    Params: { testId: string };
  }>('/evaluation/tests/:testId/submit', async (request, reply) => {
    const parse = submitTestAttemptSchema.safeParse({
      ...((request.body as object) || {}),
      testId: request.params.testId,
    });

    if (!parse.success) {
      return reply.status(400).send({
        error: 'VALIDATION_ERROR',
        details: parse.error.flatten(),
      });
    }

    const { testId, traineeId, answers } = parse.data;

    try {
      const result = centralStore.submitTestAttempt(testId, traineeId, answers);
      return reply.send(result);
    } catch (err: any) {
      return reply.status(404).send({
        error: 'SUBMISSION_FAILED',
        message: err.message,
      });
    }
  });

  // Trainee Course Marks Tally scorecard
  fastify.get<{
    Querystring: { courseId?: string; traineeId?: string };
  }>('/evaluation/marks-tally', async (request, reply) => {
    const courseId = request.query.courseId || 'cccc1111-1111-1111-1111-111111111111';
    const traineeId = request.query.traineeId || (request as any).auth?.user?.id || 'dddd4444-4444-4444-4444-444444444441';

    const marksTally = centralStore.getTraineeMarksTally(courseId, traineeId);
    if (!marksTally) {
      return reply.status(404).send({
        error: 'COURSE_NOT_FOUND',
        message: `Course ${courseId} not found`,
      });
    }

    return reply.send({ marksTally });
  });

  // Institutional Course Gradebook Matrix
  fastify.get<{
    Querystring: { courseId?: string; programmeId?: string };
  }>('/evaluation/gradebook', async (request, reply) => {
    const courseId = request.query.courseId || 'cccc1111-1111-1111-1111-111111111111';
    const programmeId = request.query.programmeId || 'prog-atp-2026-pacs-01';

    const gradebook = centralStore.getCourseGradebook(courseId, programmeId);
    return reply.send({ gradebook });
  });

  // Statutory Gradebook Export (Multi-Sheet UTF-8 BOM CSV / XLSX)
  fastify.get<{
    Querystring: { courseId?: string; programmeId?: string; format?: string; language?: string };
  }>('/evaluation/gradebook/export', async (request, reply) => {
    const courseId = request.query.courseId || 'cccc1111-1111-1111-1111-111111111111';
    const format = request.query.format || 'XLSX';
    const language = request.query.language || 'EN';

    const exportFile = centralStore.exportCourseGradebook(courseId, format, language);

    return reply
      .header('Content-Type', exportFile.contentType)
      .header('Content-Disposition', `attachment; filename="${exportFile.filename}"`)
      .send(exportFile.data);
  });
}

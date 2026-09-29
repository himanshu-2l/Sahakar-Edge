import { FastifyInstance } from 'fastify';
import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import { EdgeJournalService } from '../services/journal-service.js';

export async function registerLearningRoutes(
  app: FastifyInstance,
  db: DatabaseSync,
  journalService: EdgeJournalService
) {
  // Course catalogue
  app.get('/api/v1/courses', async () => {
    const courses = db.prepare('SELECT * FROM local_courses').all();
    return { courses };
  });

  // Course Content Manifest
  app.get<{ Params: { id: string } }>('/api/v1/courses/:id/content-manifest', async (request, reply) => {
    const courseId = request.params.id;
    const course = db.prepare('SELECT * FROM local_courses WHERE id = ?').get(courseId);
    if (!course) {
      return reply.status(404).send({ error: 'NOT_FOUND', message: 'Course not found' });
    }

    const modules = db.prepare('SELECT * FROM local_modules WHERE course_id = ? ORDER BY "order"').all(courseId);
    const lessons = db.prepare(`
      SELECT l.* FROM local_lessons l
      JOIN local_modules m ON l.module_id = m.id
      WHERE m.course_id = ?
      ORDER BY l."order"
    `).all(courseId);

    const assessments = db.prepare('SELECT * FROM local_assessments WHERE course_id = ?').all(courseId);

    return reply.send({
      manifest: {
        course,
        modules,
        lessons,
        assessments,
        downloadedAt: new Date().toISOString(),
        offlineCapable: true,
      },
    });
  });

  // Record learning progress
  app.post<{
    Body: {
      traineeId: string;
      lessonId: string;
      eventType?: 'LESSON_STARTED' | 'LESSON_COMPLETED';
      value?: number;
    };
  }>('/api/v1/progress/events', async (request, reply) => {
    const { traineeId, lessonId, eventType = 'LESSON_COMPLETED', value = 1.0 } =
      request.body || {};

    if (!traineeId || !lessonId) {
      return reply.status(400).send({
        error: 'BAD_REQUEST',
        message: 'traineeId and lessonId are required',
      });
    }

    const recordId = randomUUID();
    const occurredAt = new Date().toISOString();

    const payload = {
      recordId,
      traineeId,
      lessonId,
      eventType,
      value,
      occurredAt,
    };

    const event = journalService.appendEventInTransaction({
      aggregateType: 'PROGRESS',
      aggregateId: lessonId,
      eventType: 'PROGRESS_RECORDED',
      payload,
      operationalCallback: (txDb) => {
        txDb
          .prepare(`
            INSERT INTO local_progress_records (
              id, trainee_id, lesson_id, event_type, value, occurred_at, node_id
            ) VALUES (?, ?, ?, ?, ?, ?, 'edge-node-ricm-bhopal-01')
          `)
          .run(recordId, traineeId, lessonId, eventType, value, occurredAt);
      },
    });

    return reply.status(201).send({
      success: true,
      record: payload,
      event,
    });
  });

  // Get trainee progress
  app.get<{ Params: { id: string } }>('/api/v1/trainees/:id/progress', async (request, reply) => {
    const traineeId = request.params.id;

    const completedRows = db
      .prepare(`
        SELECT DISTINCT lesson_id
        FROM local_progress_records
        WHERE trainee_id = ? AND event_type = 'LESSON_COMPLETED'
      `)
      .all(traineeId) as { lesson_id: string }[];

    const totalLessons = db
      .prepare('SELECT COUNT(*) as count FROM local_lessons')
      .get() as { count: number };

    const completedCount = completedRows.length;
    const total = totalLessons?.count || 1;
    const percentage = Math.round((completedCount / total) * 100);

    return reply.send({
      traineeId,
      completedLessons: completedRows.map((r) => r.lesson_id),
      completedCount,
      totalLessons: total,
      progressPercentage: percentage,
    });
  });
}

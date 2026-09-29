import { FastifyInstance } from 'fastify';
import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import { EdgeJournalService } from '../services/journal-service.js';

export async function registerAssessmentRoutes(
  app: FastifyInstance,
  db: DatabaseSync,
  journalService: EdgeJournalService
) {
  // Assessment details & questions
  app.get<{ Params: { id: string } }>('/api/v1/assessments/:id', async (request, reply) => {
    const assessmentId = request.params.id;
    const assessment = db
      .prepare('SELECT * FROM local_assessments WHERE id = ?')
      .get(assessmentId) as any;

    if (!assessment) {
      return reply.status(404).send({ error: 'NOT_FOUND', message: 'Assessment not found' });
    }

    const questionRows = db
      .prepare('SELECT id, type, prompt, options_json FROM local_questions WHERE assessment_id = ?')
      .all(assessmentId) as any[];

    const questions = questionRows.map((q) => ({
      id: q.id,
      type: q.type,
      prompt: q.prompt,
      options: JSON.parse(q.options_json),
    }));

    return reply.send({
      assessment: {
        id: assessment.id,
        courseId: assessment.course_id,
        title: assessment.title,
        passingScore: assessment.passing_score,
        questions,
      },
    });
  });

  // Submit assessment attempt locally on Edge
  app.post<{
    Params: { id: string };
    Body: {
      traineeId: string;
      answers: Record<string, string | number>;
    };
  }>('/api/v1/assessments/:id/submissions', async (request, reply) => {
    const assessmentId = request.params.id;
    const { traineeId, answers } = request.body || {};

    if (!traineeId || !answers) {
      return reply.status(400).send({
        error: 'BAD_REQUEST',
        message: 'traineeId and answers are required',
      });
    }

    const assessment = db
      .prepare('SELECT * FROM local_assessments WHERE id = ?')
      .get(assessmentId) as any;

    if (!assessment) {
      return reply.status(404).send({ error: 'NOT_FOUND', message: 'Assessment not found' });
    }

    const questions = db
      .prepare('SELECT id, correct_answer FROM local_questions WHERE assessment_id = ?')
      .all(assessmentId) as any[];

    let correctCount = 0;
    for (const q of questions) {
      const submitted = answers[q.id];
      if (submitted !== undefined && String(submitted) === String(q.correct_answer)) {
        correctCount++;
      }
    }

    const totalQuestions = questions.length;
    const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const passed = score >= assessment.passing_score;
    const submissionId = randomUUID();
    const occurredAt = new Date().toISOString();

    const payload = {
      submissionId,
      assessmentId,
      traineeId,
      score,
      passed,
      correctCount,
      totalQuestions,
      answers,
      occurredAt,
    };

    const event = journalService.appendEventInTransaction({
      aggregateType: 'ASSESSMENT',
      aggregateId: assessmentId,
      eventType: 'ASSESSMENT_SUBMITTED',
      payload,
      operationalCallback: (txDb) => {
        txDb
          .prepare(`
            INSERT INTO local_assessment_submissions (
              id, assessment_id, trainee_id, answers_json, score, passed,
              occurred_at, node_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'edge-node-ricm-bhopal-01')
          `)
          .run(
            submissionId,
            assessmentId,
            traineeId,
            JSON.stringify(answers),
            score,
            passed ? 1 : 0,
            occurredAt
          );
      },
    });

    return reply.status(201).send({
      success: true,
      submission: {
        id: submissionId,
        score,
        passed,
        passingScore: assessment.passing_score,
        correctCount,
        totalQuestions,
      },
      event,
    });
  });
}

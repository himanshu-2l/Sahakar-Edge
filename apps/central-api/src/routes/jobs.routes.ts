import { FastifyInstance } from 'fastify';
import { JobMatchingService } from '../services/job-matching-service.js';
import { authenticate, requirePermission } from '../auth/auth-service.js';
import { centralStore } from '../store/memory-store.js';
import type { JobRequiredSkill } from '@sahakar/types';

export const jobMatchingService = new JobMatchingService(centralStore);

export async function registerJobRoutes(app: FastifyInstance) {
  // ==========================================
  // Skills Taxonomy Endpoints
  // ==========================================

  // List all skills in taxonomy
  app.get('/api/v1/skills', async (_request, reply) => {
    const skills = centralStore.listSkills();
    return reply.send({ count: skills.length, skills });
  });

  // Get specific skill by id
  app.get<{ Params: { id: string } }>('/api/v1/skills/:id', async (request, reply) => {
    const skill = centralStore.getSkill(request.params.id);
    if (!skill) {
      return reply.status(404).send({ error: 'NOT_FOUND', message: 'Skill not found' });
    }
    return reply.send({ skill });
  });

  // Register new skill in taxonomy (Admin protected)
  app.post<{
    Body: {
      code: string;
      name: string;
      description: string;
      parentCategory?: string;
      parentSkillId?: string;
      evidenceRule?: string;
    };
  }>(
    '/api/v1/skills',
    { preHandler: [authenticate, requirePermission('manage:courses')] },
    async (request, reply) => {
      const { code, name, description, parentCategory, parentSkillId, evidenceRule } = request.body || {};
      if (!code || !name) {
        return reply.status(400).send({
          error: 'BAD_REQUEST',
          message: 'Skill code and name are required',
        });
      }

      const existing = centralStore.getSkillByCode(code);
      if (existing) {
        return reply.status(409).send({
          error: 'CONFLICT',
          message: `Skill with code ${code} already exists`,
        });
      }

      const skill = centralStore.createSkill({
        code,
        name,
        description: description || '',
        parentCategory,
        parentSkillId,
        evidenceRule,
      });

      return reply.status(201).send({ success: true, skill });
    }
  );

  // Get verified skill profile for a trainee
  app.get<{ Params: { traineeId: string } }>(
    '/api/v1/skills/trainee/:traineeId',
    async (request, reply) => {
      const { traineeId } = request.params;
      const trainee = centralStore.getUser(traineeId);
      if (!trainee) {
        return reply.status(404).send({ error: 'NOT_FOUND', message: 'Trainee not found' });
      }

      const profileMap = jobMatchingService.getTraineeSkillProfile(traineeId);
      const verifiedSkills = Array.from(profileMap.values());

      return reply.send({
        traineeId,
        traineeName: trainee.name,
        verifiedSkillsCount: verifiedSkills.length,
        skills: verifiedSkills,
      });
    }
  );

  // Alias per 08_API_SPEC.md: GET /trainees/:id/skills
  app.get<{ Params: { id: string } }>(
    '/api/v1/trainees/:id/skills',
    async (request, reply) => {
      const traineeId = request.params.id;
      const trainee = centralStore.getUser(traineeId);
      if (!trainee) {
        return reply.status(404).send({ error: 'NOT_FOUND', message: 'Trainee not found' });
      }

      const profileMap = jobMatchingService.getTraineeSkillProfile(traineeId);
      const verifiedSkills = Array.from(profileMap.values());

      return reply.send({
        traineeId,
        traineeName: trainee.name,
        verifiedSkillsCount: verifiedSkills.length,
        skills: verifiedSkills,
      });
    }
  );

  // ==========================================
  // Job Opportunities Endpoints
  // ==========================================

  // List active job opportunities with their required skills
  app.get('/api/v1/jobs', async (_request, reply) => {
    const jobs = centralStore.listJobs(true);
    const enriched = jobs.map((job) => ({
      ...job,
      requiredSkills: centralStore.getJobRequiredSkills(job.id),
    }));
    return reply.send({ count: enriched.length, jobs: enriched });
  });

  // Get specific job opportunity
  app.get<{ Params: { id: string } }>('/api/v1/jobs/:id', async (request, reply) => {
    const job = centralStore.getJob(request.params.id);
    if (!job) {
      return reply.status(404).send({ error: 'NOT_FOUND', message: 'Job opportunity not found' });
    }
    const requiredSkills = centralStore.getJobRequiredSkills(job.id);
    return reply.send({ job: { ...job, requiredSkills } });
  });

  // Create job opportunity (Employer or Admin protected)
  app.post<{
    Body: {
      title: string;
      description: string;
      employerName?: string;
      location: string;
      qualification: string;
      experienceYears: number;
      requiredSkills?: Array<{
        skillId: string;
        skillCode?: string;
        skillName?: string;
        requiredLevel: number;
        weight: number;
      }>;
    };
  }>(
    '/api/v1/jobs',
    { preHandler: [authenticate, requirePermission('manage:jobs')] },
    async (request, reply) => {
      const {
        title,
        description,
        employerName,
        location,
        qualification,
        experienceYears,
        requiredSkills,
      } = request.body || {};

      if (!title || !description || !location) {
        return reply.status(400).send({
          error: 'BAD_REQUEST',
          message: 'Title, description, and location are required',
        });
      }

      const authUser = (request as any).auth?.user;
      const job = centralStore.createJob(
        {
          employerId: authUser?.id || 'employer-admin',
          employerName: employerName || authUser?.name || 'Cooperative Enterprise',
          title,
          description,
          location,
          qualification: qualification || 'Certificate / Diploma in Cooperative Management',
          experienceYears: Number(experienceYears) || 0,
          active: true,
        },
        requiredSkills as JobRequiredSkill[] | undefined
      );

      const savedRequired = centralStore.getJobRequiredSkills(job.id);
      return reply.status(201).send({
        success: true,
        job: { ...job, requiredSkills: savedRequired },
      });
    }
  );

  // ==========================================
  // Explainable Job Matching Endpoints
  // ==========================================

  // Match a trainee against all available jobs with transparent breakdown
  app.get<{
    Params: { traineeId: string };
    Querystring: { eligibleOnly?: string };
  }>('/api/v1/jobs/match/:traineeId', async (request, reply) => {
    const { traineeId } = request.params;
    const { eligibleOnly } = request.query;

    const trainee = centralStore.getUser(traineeId);
    if (!trainee) {
      return reply.status(404).send({ error: 'NOT_FOUND', message: 'Trainee not found' });
    }

    const matches = jobMatchingService.matchTraineeToAllJobs(
      traineeId,
      eligibleOnly === 'true'
    );

    return reply.send({
      traineeId,
      traineeName: trainee.name,
      totalOpportunitiesChecked: centralStore.listJobs(true).length,
      matches,
    });
  });

  // Alias per 08_API_SPEC.md: GET /trainees/:id/job-matches
  app.get<{
    Params: { id: string };
    Querystring: { eligibleOnly?: string };
  }>('/api/v1/trainees/:id/job-matches', async (request, reply) => {
    const traineeId = request.params.id;
    const { eligibleOnly } = request.query;

    const trainee = centralStore.getUser(traineeId);
    if (!trainee) {
      return reply.status(404).send({ error: 'NOT_FOUND', message: 'Trainee not found' });
    }

    const matches = jobMatchingService.matchTraineeToAllJobs(
      traineeId,
      eligibleOnly === 'true'
    );

    return reply.send({
      traineeId,
      traineeName: trainee.name,
      totalOpportunitiesChecked: centralStore.listJobs(true).length,
      matches,
    });
  });

  // Match a trainee against a specific job
  app.get<{
    Params: { traineeId: string; jobId: string };
  }>('/api/v1/jobs/match/:traineeId/:jobId', async (request, reply) => {
    const { traineeId, jobId } = request.params;
    const trainee = centralStore.getUser(traineeId);
    if (!trainee) {
      return reply.status(404).send({ error: 'NOT_FOUND', message: 'Trainee not found' });
    }

    try {
      const match = jobMatchingService.matchTraineeToJob(traineeId, jobId);
      return reply.send({
        traineeId,
        traineeName: trainee.name,
        match,
      });
    } catch (err: any) {
      return reply.status(404).send({ error: 'NOT_FOUND', message: err.message });
    }
  });

  // Model Evaluation & Benchmark Comparison endpoint
  app.get('/api/v1/jobs/evaluation/benchmark', async (_request, reply) => {
    const benchmark = jobMatchingService.evaluateBenchmark();
    return reply.send({
      benchmarkMode: 'EXPERT_LABELLED_COOPERATIVE_PAIRS',
      metrics: benchmark,
      explanation:
        'Compares naive keyword matching baseline against weighted verified skill overlap model.',
    });
  });
}

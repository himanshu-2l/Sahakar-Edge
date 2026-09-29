import { FastifyInstance } from 'fastify';
import { centralStore } from '../store/memory-store.js';
import { authenticate, requirePermission } from '../auth/auth-service.js';

export async function courseRoutes(fastify: FastifyInstance) {
  // List courses
  fastify.get('/courses', async () => {
    return {
      courses: centralStore.listCourses(),
    };
  });

  // Get course by ID
  fastify.get<{ Params: { id: string } }>('/courses/:id', async (request, reply) => {
    const course = centralStore.getCourse(request.params.id);
    if (!course) {
      return reply.status(404).send({ error: 'NOT_FOUND', message: 'Course not found' });
    }
    return { course };
  });

  // Provisioning manifest for Edge Node (Modules, Lessons, Assessments)
  fastify.get<{ Params: { id: string } }>('/courses/:id/content-manifest', async (request, reply) => {
    const manifest = centralStore.getCourseContentManifest(request.params.id);
    if (!manifest) {
      return reply.status(404).send({ error: 'NOT_FOUND', message: 'Course not found' });
    }
    return { manifest };
  });

  // Create course
  fastify.post(
    '/courses',
    { preHandler: [authenticate, requirePermission('manage:courses')] },
    async (request, reply) => {
      const body = request.body as {
        title: string;
        language?: string;
        description?: string;
        version?: number;
      };

      if (!body.title || body.title.length < 3) {
        return reply.status(400).send({
          error: 'VALIDATION_ERROR',
          message: 'Course title must be at least 3 characters',
        });
      }

      const course = centralStore.createCourse({
        title: body.title,
        language: body.language || 'hi',
        description: body.description || '',
        version: body.version || 1,
      });

      return reply.status(201).send({ course });
    }
  );
}

import { FastifyInstance } from 'fastify';
import { centralStore } from '../store/memory-store.js';

export async function publicProfileRoutes(fastify: FastifyInstance) {
  // Tap-to-verify public profile (e.g. via physical NFC card tap or QR code scan)
  fastify.get<{
    Params: { code: string };
  }>('/public/profile/:code', async (request, reply) => {
    const profile = centralStore.resolvePublicNfcProfile(request.params.code);
    if (!profile) {
      return reply.status(404).send({
        error: 'PROFILE_NOT_FOUND',
        message: 'The requested sovereign credential profile does not exist, has expired, or is currently disabled by the holder.',
      });
    }

    // Zero-leakage public profile response: PII like phone, email, and hostel room are strictly excluded
    return reply.send({
      verified: true,
      profileCode: profile.publicProfileCode,
      fullName: profile.fullName,
      cooperativeAffiliation: profile.cooperativeAffiliation,
      certifiedCoursesCount: profile.certifiedCoursesCount,
      primarySkills: profile.primarySkills,
      issuedCertificates: profile.issuedCertificates,
      verifiedAt: new Date().toISOString(),
      trustIssuer: 'National Council for Cooperative Training (NCCT)',
    });
  });
}

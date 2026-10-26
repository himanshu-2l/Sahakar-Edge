import { z } from 'zod';
import {
  UserRole,
  ProgrammeStatus,
  EnrollmentStatus,
  AttendanceVerificationMethod,
  AttendanceResult,
  SyncStatus,
  EdgeNodeHealthStatus,
  CredentialStatus,
} from '@sahakar/types';

// ==========================================
// 1. Auth & User Validation Schemas
// ==========================================

export const loginSchema = z.object({
  emailOrPhone: z.string().min(3),
  password: z.string().min(6),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const userRoleSchema = z.nativeEnum(UserRole);

export const createUserSchema = z.object({
  name: z.string().min(2),
  emailOrPhone: z.string().min(3),
  role: userRoleSchema,
  instituteId: z.string().uuid().nullable().optional(),
  preferredLanguage: z.string().default('hi'),
  password: z.string().min(6),
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

// ==========================================
// 2. Organization & Programme Schemas
// ==========================================

export const createInstituteSchema = z.object({
  name: z.string().min(3),
  code: z.string().min(2).max(20),
  type: z.string().min(2),
  locationText: z.string().min(2),
});
export type CreateInstituteInput = z.infer<typeof createInstituteSchema>;

export const createProgrammeSchema = z.object({
  instituteId: z.string().uuid(),
  title: z.string().min(3),
  description: z.string().default(''),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  status: z.nativeEnum(ProgrammeStatus).default(ProgrammeStatus.DRAFT),
});
export type CreateProgrammeInput = z.infer<typeof createProgrammeSchema>;

export const createBatchSchema = z.object({
  programmeId: z.string().uuid(),
  name: z.string().min(2),
  capacity: z.number().int().positive().default(40),
  trainerId: z.string().uuid(),
});
export type CreateBatchInput = z.infer<typeof createBatchSchema>;

export const createSessionSchema = z.object({
  batchId: z.string().uuid(),
  title: z.string().min(3),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  attendancePolicy: z
    .object({
      minDurationMinutes: z.number().int().optional(),
      allowLateMinutes: z.number().int().optional(),
    })
    .default({}),
});
export type CreateSessionInput = z.infer<typeof createSessionSchema>;

export const enrollTraineeSchema = z.object({
  traineeId: z.string().uuid(),
  programmeId: z.string().uuid(),
  batchId: z.string().uuid(),
  status: z.nativeEnum(EnrollmentStatus).default(EnrollmentStatus.ENROLLED),
});
export type EnrollTraineeInput = z.infer<typeof enrollTraineeSchema>;

// ==========================================
// 3. Attendance Validation Schemas
// ==========================================

export const attendanceVerificationMethodSchema = z.nativeEnum(AttendanceVerificationMethod);

export const recordAttendanceSchema = z.object({
  sessionId: z.string().uuid(),
  traineeId: z.string().uuid(),
  nodeId: z.string().uuid(),
  method: attendanceVerificationMethodSchema,
  result: z.nativeEnum(AttendanceResult).default(AttendanceResult.PRESENT),
  confidence: z.number().min(0).max(1).optional(),
  quality: z.number().min(0).max(1).optional(),
  occurredAt: z.string().datetime(),
});
export type RecordAttendanceInput = z.infer<typeof recordAttendanceSchema>;

export const rfidAttendanceSchema = z.object({
  cardUid: z.string().min(1, 'Card UID is required'),
  sessionId: z.string().uuid().optional(),
  traineeId: z.string().uuid().optional(),
});
export type RfidAttendanceInput = z.infer<typeof rfidAttendanceSchema>;

export const overrideAttendanceSchema = z.object({
  attendanceId: z.string().uuid(),
  result: z.nativeEnum(AttendanceResult),
  overrideReason: z.string().min(5, 'Override reason must be at least 5 characters for auditing'),
});
export type OverrideAttendanceInput = z.infer<typeof overrideAttendanceSchema>;

// ==========================================
// 4. Learning Progress & Assessments
// ==========================================

export const progressEventSchema = z.object({
  traineeId: z.string().uuid(),
  lessonId: z.string().uuid(),
  eventType: z.enum(['LESSON_STARTED', 'LESSON_COMPLETED', 'CONTENT_ACCESSED']),
  value: z.number().min(0).max(100),
  occurredAt: z.string().datetime(),
  nodeId: z.string().uuid(),
});
export type ProgressEventInput = z.infer<typeof progressEventSchema>;

export const submitAssessmentSchema = z.object({
  assessmentId: z.string().uuid(),
  traineeId: z.string().uuid(),
  answers: z.record(z.union([z.string(), z.number()])),
  occurredAt: z.string().datetime(),
  nodeId: z.string().uuid(),
});
export type SubmitAssessmentInput = z.infer<typeof submitAssessmentSchema>;

// ==========================================
// 5. Sync Protocol Validation Schemas
// ==========================================

export const syncEventSchema = z.object({
  id: z.string().uuid(),
  nodeId: z.string().uuid(),
  aggregateType: z.enum(['ATTENDANCE', 'PROGRESS', 'ASSESSMENT', 'SESSION', 'NODE_HEALTH']),
  aggregateId: z.string(),
  eventType: z.string().min(1),
  payload: z.record(z.unknown()),
  schemaVersion: z.number().int().positive().default(1),
  occurredAt: z.string().datetime(),
  logicalSequence: z.number().int().nonnegative(),
  hash: z.string().min(16),
  syncStatus: z.nativeEnum(SyncStatus).default(SyncStatus.QUEUED),
  retryCount: z.number().int().nonnegative().default(0),
});
export type SyncEventInput = z.infer<typeof syncEventSchema>;

export const syncHandshakeRequestSchema = z.object({
  nodeId: z.string().uuid(),
  softwareVersion: z.string(),
  lastAckSequence: z.number().int().nonnegative(),
});
export type SyncHandshakeRequest = z.infer<typeof syncHandshakeRequestSchema>;

export const syncBatchUploadSchema = z.object({
  nodeId: z.string().uuid(),
  batch: z.array(syncEventSchema).max(250),
});
export type SyncBatchUploadInput = z.infer<typeof syncBatchUploadSchema>;

// ==========================================
// 6. Credentials & Public Verification
// ==========================================

export const verifyCredentialSchema = z.object({
  credentialId: z.string().uuid(),
  signature: z.string().optional(),
});
export type VerifyCredentialInput = z.infer<typeof verifyCredentialSchema>;

// ==========================================
// 7. Edge & Hardware Node Schemas
// ==========================================

export const edgeWanSimulationSchema = z.object({
  mode: z.enum(['online', 'offline', 'flaky']),
});
export type EdgeWanSimulationInput = z.infer<typeof edgeWanSimulationSchema>;

export const edgeHeartbeatSchema = z.object({
  nodeId: z.string().uuid(),
  healthStatus: z.nativeEnum(EdgeNodeHealthStatus),
  telemetry: z.object({
    cpuTemperatureC: z.number(),
    cpuLoadPercent: z.number(),
    memoryUsagePercent: z.number(),
    diskUsagePercent: z.number(),
    uptimeSeconds: z.number(),
    networkState: z.enum(['ONLINE', 'OFFLINE', 'DEGRADED']),
    wanSimulationMode: z.enum(['online', 'offline', 'flaky']),
    appVersion: z.string(),
    lastSyncAt: z.string().nullable(),
    queuedEventCount: z.number().int().nonnegative(),
  }),
});
export type EdgeHeartbeatInput = z.infer<typeof edgeHeartbeatSchema>;

// ==========================================
// 8. Jobs & Opportunities
// ==========================================

export const createJobSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  location: z.string(),
  qualification: z.string(),
  experienceYears: z.number().nonnegative().default(0),
  requiredSkills: z.array(
    z.object({
      skillId: z.string().uuid(),
      requiredLevel: z.number().int().min(1).max(5).default(1),
      weight: z.number().min(0).max(10).default(1),
    })
  ),
});
export type CreateJobInput = z.infer<typeof createJobSchema>;

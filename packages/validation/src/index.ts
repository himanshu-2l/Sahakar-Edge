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

// ==========================================
// 9. Recruiter Pipeline & Digital Offers (M4)
// ==========================================

export const jobApplicationStatusSchema = z.enum([
  'APPLIED',
  'SCHEDULED',
  'OFFERED',
  'PLACED',
  'REJECTED',
]);

export const updateApplicationStatusSchema = z.object({
  status: jobApplicationStatusSchema,
  interviewDate: z.string().optional(),
  interviewVenue: z.string().optional(),
  interviewNotes: z.string().optional(),
});
export type UpdateApplicationStatusInput = z.infer<typeof updateApplicationStatusSchema>;

export const issueOfferLetterSchema = z.object({
  applicationId: z.string().min(1),
  designation: z.string().min(2),
  annualCompensationLPA: z.number().positive(),
  monthlyStipendOrSalary: z.number().positive(),
  joiningDate: z.string(),
  postingLocation: z.string().min(2),
  terms: z.array(z.string()).optional(),
  authorizedSignatory: z.string().optional(),
});
export type IssueOfferLetterInput = z.infer<typeof issueOfferLetterSchema>;

// ==========================================
// 10. ATP Nominations & Programme Lifecycle Schemas (M1 NCCT)
// ==========================================

export const instituteTierSchema = z.enum(['APEX', 'RICM', 'ICM']);

export const programmeDeliveryModeSchema = z.enum(['ONLINE', 'OFFLINE', 'HYBRID']);

export const nominationStatusSchema = z.enum([
  'PENDING',
  'APPROVED',
  'WAITLISTED',
  'REJECTED',
]);

export const createTrainingProgrammeSchema = z.object({
  instituteId: z.string().min(1, 'Institute ID is required'),
  title: z.string().min(3, 'Programme title must be at least 3 characters'),
  code: z.string().min(2, 'Programme code must be at least 2 characters'),
  atpYear: z.string().regex(/^\d{4}-\d{4}$/, 'ATP year must match YYYY-YYYY format (e.g. 2026-2027)'),
  targetSector: z.string().min(2, 'Target sector is required'),
  deliveryMode: programmeDeliveryModeSchema,
  capacity: z.number().int().positive('Capacity must be a positive integer'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be YYYY-MM-DD'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be YYYY-MM-DD'),
  coordinatingFacultyId: z.string().optional(),
});
export type CreateTrainingProgrammeInput = z.infer<typeof createTrainingProgrammeSchema>;

export const createNominationSchema = z.object({
  programmeId: z.string().min(1, 'Programme ID is required'),
  traineeId: z.string().min(1, 'Trainee ID is required'),
  fullName: z.string().min(2, 'Candidate name must be at least 2 characters'),
  phone: z.string().min(10, 'Valid 10-digit mobile number required'),
  email: z.string().email('Invalid email address').optional(),
  cooperativeAffiliation: z.string().min(2, 'Cooperative society affiliation is required'),
  designation: z.string().min(2, 'Designation is required'),
  state: z.string().min(2, 'State is required'),
});
export type CreateNominationInput = z.infer<typeof createNominationSchema>;

export const decideNominationSchema = z.object({
  status: z.enum(['APPROVED', 'WAITLISTED', 'REJECTED']),
  rejectionReason: z.string().optional(),
  hostelRoomId: z.string().optional(),
  decidedBy: z.string().optional(),
});
export type DecideNominationInput = z.infer<typeof decideNominationSchema>;

// ==========================================
// 11. Timetable & Dynamic Attendance Check-In Schemas (M1 NCCT)
// ==========================================

export const sessionAttendanceVerificationMethodSchema = z.enum([
  'DYNAMIC_CODE',
  'QR_SCAN',
  'KIOSK_NFC_FACE',
  'FACULTY_MANUAL',
]);

export const createTimetableSessionSchema = z.object({
  programmeId: z.string().min(1, 'Programme ID is required'),
  courseId: z.string().optional(),
  title: z.string().min(3, 'Session title must be at least 3 characters'),
  facultyId: z.string().min(1, 'Faculty ID is required'),
  facultyName: z.string().min(2, 'Faculty name is required'),
  sessionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Session date must be YYYY-MM-DD'),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Start time must be HH:MM in 24h format'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'End time must be HH:MM in 24h format'),
  venue: z.string().min(2, 'Venue location is required'),
  checkInCode: z.string().regex(/^\d{6}$/, 'Check-in code must be a 6-digit numeric token').optional(),
});
export type CreateTimetableSessionInput = z.infer<typeof createTimetableSessionSchema>;

export const dynamicAttendanceCheckInSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
  traineeId: z.string().min(1, 'Trainee ID is required'),
  checkInCode: z.string().regex(/^\d{6}$/, 'Check-in code must be exactly 6 digits'),
  verificationMethod: sessionAttendanceVerificationMethodSchema.default('DYNAMIC_CODE'),
});
export type DynamicAttendanceCheckInInput = z.infer<typeof dynamicAttendanceCheckInSchema>;

export const facultyManualAttendanceSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
  traineeId: z.string().min(1, 'Trainee ID is required'),
  isPresent: z.boolean(),
  markedBy: z.string().min(1, 'Faculty signatory is required for manual override'),
  reason: z.string().optional(),
});
export type FacultyManualAttendanceInput = z.infer<typeof facultyManualAttendanceSchema>;

// ==========================================
// 12. Assessment & Gradebook Export Schemas (M1 NCCT)
// ==========================================

export const assessmentTypeSchema = z.enum(['FORMATIVE_QUIZ', 'SUMMATIVE_TEST']);

export const createCourseModuleTestSchema = z.object({
  courseId: z.string().min(1, 'Course ID is required'),
  moduleId: z.string().optional(),
  title: z.string().min(3, 'Test title must be at least 3 characters'),
  type: assessmentTypeSchema,
  totalMarks: z.number().int().positive('Total marks must be positive'),
  passMarks: z.number().int().nonnegative('Pass marks must be non-negative'),
  maxAttempts: z.number().int().nonnegative('Max attempts must be >= 0 (0 = unlimited)'),
});
export type CreateCourseModuleTestInput = z.infer<typeof createCourseModuleTestSchema>;

export const submitTestAttemptSchema = z.object({
  testId: z.string().min(1, 'Test ID is required'),
  traineeId: z.string().min(1, 'Trainee ID is required'),
  answers: z.record(z.union([z.string(), z.number()])),
  occurredAt: z.string().optional(),
});
export type SubmitTestAttemptInput = z.infer<typeof submitTestAttemptSchema>;

export const gradebookExportQuerySchema = z.object({
  courseId: z.string().min(1, 'Course ID is required'),
  programmeId: z.string().optional(),
  format: z.enum(['XLSX', 'CSV', 'JSON']).default('XLSX'),
  language: z.enum(['EN', 'HI']).default('EN'),
});
export type GradebookExportQuery = z.infer<typeof gradebookExportQuerySchema>;

// ==========================================
// 13. Predictive Dropout-Risk Query Schemas (M1 NCCT)
// ==========================================

export const dropoutRiskTierSchema = z.enum(['LOW', 'MEDIUM', 'HIGH']);

export const dropoutRiskQuerySchema = z.object({
  programmeId: z.string().optional(),
  instituteId: z.string().optional(),
  tier: dropoutRiskTierSchema.optional(),
  minRiskScore: z.number().min(0).max(100).optional(),
});
export type DropoutRiskQuery = z.infer<typeof dropoutRiskQuerySchema>;

// ==========================================
// 14. Cooperative Skill-Gap & Shortage Schemas (M1 NCCT)
// ==========================================

export const cooperativeSkillCategorySchema = z.enum([
  'PACS_OPERATIONS',
  'FINANCIAL_ACCOUNTING',
  'CREDIT_KCC',
  'COMMODITY_STORAGE',
  'STATUTORY_LEGAL',
  'GOVERNANCE_MANAGEMENT',
]);

export const skillGapQuerySchema = z.object({
  traineeId: z.string().min(1, 'Trainee ID is required'),
  jobId: z.string().min(1, 'Job ID is required'),
});
export type SkillGapQuery = z.infer<typeof skillGapQuerySchema>;

export const sectorSkillShortageQuerySchema = z.object({
  category: cooperativeSkillCategorySchema.optional(),
  minShortage: z.number().int().optional(),
});
export type SectorSkillShortageQuery = z.infer<typeof sectorSkillShortageQuerySchema>;

// ==========================================
// 15. Hostel Logistics & Sovereign NFC Profile Schemas (M1 NCCT)
// ==========================================

export const hostelRoomTypeSchema = z.enum(['SINGLE', 'DOUBLE', 'DORMITORY']);

export const createCampusHostelRoomSchema = z.object({
  instituteId: z.string().min(1, 'Institute ID is required'),
  hostelBlock: z.string().min(1, 'Hostel block identifier is required'),
  roomNumber: z.string().min(1, 'Room number is required'),
  roomType: hostelRoomTypeSchema,
  bedCapacity: z.number().int().positive('Bed capacity must be positive'),
  floor: z.number().int().optional(),
});
export type CreateCampusHostelRoomInput = z.infer<typeof createCampusHostelRoomSchema>;

export const assignHostelRoomSchema = z.object({
  nominationId: z.string().min(1, 'Nomination ID is required'),
  roomId: z.string().min(1, 'Room ID is required'),
  checkInDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Check-in date must be YYYY-MM-DD'),
  checkOutDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Check-out date must be YYYY-MM-DD'),
  allocatedBy: z.string().min(1, 'Allocating official ID is required'),
  notes: z.string().optional(),
});
export type AssignHostelRoomInput = z.infer<typeof assignHostelRoomSchema>;

export const toggleNfcProfileSchema = z.object({
  enabled: z.boolean(),
  rotateCode: z.boolean().default(false),
});
export type ToggleNfcProfileInput = z.infer<typeof toggleNfcProfileSchema>;



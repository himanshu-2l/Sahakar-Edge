/**
 * Sahakar Edge Core Domain Types & Enums
 * Source of truth: 01_PRD.md, 02_SYSTEM_ARCHITECTURE.md, 03_DATA_MODEL.md
 */

// ==========================================
// 1. Roles & RBAC
// ==========================================

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  INSTITUTE_ADMIN = 'INSTITUTE_ADMIN',
  TRAINER = 'TRAINER',
  TRAINEE = 'TRAINEE',
  EMPLOYER = 'EMPLOYER',
}

export type Permission =
  | 'manage:institutes'
  | 'manage:programmes'
  | 'manage:courses'
  | 'manage:batches'
  | 'manage:enrollments'
  | 'manage:sessions'
  | 'record:attendance'
  | 'override:attendance'
  | 'deliver:courses'
  | 'take:assessments'
  | 'issue:credentials'
  | 'verify:credentials'
  | 'view:analytics'
  | 'manage:edge_nodes'
  | 'manage:jobs'
  | 'apply:jobs';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.SUPER_ADMIN]: [
    'manage:institutes',
    'manage:programmes',
    'manage:courses',
    'manage:batches',
    'manage:enrollments',
    'manage:sessions',
    'record:attendance',
    'override:attendance',
    'deliver:courses',
    'issue:credentials',
    'verify:credentials',
    'view:analytics',
    'manage:edge_nodes',
    'manage:jobs',
  ],
  [UserRole.INSTITUTE_ADMIN]: [
    'manage:programmes',
    'manage:batches',
    'manage:enrollments',
    'manage:sessions',
    'record:attendance',
    'override:attendance',
    'deliver:courses',
    'verify:credentials',
    'view:analytics',
    'manage:edge_nodes',
  ],
  [UserRole.TRAINER]: [
    'manage:sessions',
    'record:attendance',
    'override:attendance',
    'deliver:courses',
    'verify:credentials',
  ],
  [UserRole.TRAINEE]: [
    'take:assessments',
    'verify:credentials',
    'apply:jobs',
  ],
  [UserRole.EMPLOYER]: [
    'manage:jobs',
    'verify:credentials',
  ],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  return Boolean(permissions && permissions.includes(permission));
}

// ==========================================
// 2. Organization & Identity
// ==========================================

export interface Institute {
  id: string;
  name: string;
  code: string;
  type: string; // e.g., 'RICM', 'ICM', 'VAMNICOM'
  locationText: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  emailOrPhone: string;
  role: UserRole;
  instituteId: string | null;
  preferredLanguage: string;
  passwordHash?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TraineeProfile {
  userId: string;
  cooperativeAffiliation: string;
  districtState: string;
  skillsSummary: string;
  consentFlags: {
    dataSharing: boolean;
    biometricSimConsent: boolean;
  };
}

export interface TrainerProfile {
  userId: string;
  designation: string;
  specialization?: string;
}

// ==========================================
// 3. Programmes, Batches & Sessions
// ==========================================

export enum ProgrammeStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED',
}

export interface Programme {
  id: string;
  instituteId: string;
  title: string;
  description: string;
  startAt: string;
  endAt: string;
  status: ProgrammeStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Batch {
  id: string;
  programmeId: string;
  name: string;
  capacity: number;
  trainerId: string;
  createdAt: string;
}

export interface TrainingSession {
  id: string;
  batchId: string;
  title: string;
  startsAt: string;
  endsAt: string;
  attendancePolicy: {
    minDurationMinutes?: number;
    allowLateMinutes?: number;
  };
  createdAt: string;
}

export enum EnrollmentStatus {
  ENROLLED = 'ENROLLED',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  DROPPED = 'DROPPED',
}

export interface Enrollment {
  id: string;
  traineeId: string;
  programmeId: string;
  batchId: string;
  status: EnrollmentStatus;
  enrolledAt: string;
}

// ==========================================
// 4. Course & LMS Hierarchy
// ==========================================

export interface Course {
  id: string;
  title: string;
  version: number;
  language: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface Module {
  id: string;
  courseId: string;
  title: string;
  order: number;
}

export interface Lesson {
  id: string;
  moduleId: string;
  type: 'TEXT' | 'VIDEO' | 'INTERACTIVE_DOCUMENT';
  title: string;
  contentUri: string;
  localAssetRef?: string;
  order: number;
}

export interface ContentManifestAsset {
  uri: string;
  sha256: string;
  sizeBytes: number;
}

export interface ContentManifest {
  courseId: string;
  version: number;
  generatedAt: string;
  modules: Module[];
  lessons: Lesson[];
  assessments: Assessment[];
  assets: ContentManifestAsset[];
}

// ==========================================
// 5. Attendance & Identity Verification
// ==========================================

export enum AttendanceVerificationMethod {
  SIMULATED_FACE = 'SIMULATED_FACE',
  QR = 'QR',
  NFC = 'NFC',
  RFID = 'RFID',
  MANUAL_OVERRIDE = 'MANUAL_OVERRIDE',
}

export enum AttendanceResult {
  PRESENT = 'PRESENT',
  LATE = 'LATE',
  ABSENT = 'ABSENT',
  EXCUSED = 'EXCUSED',
}

export interface AttendanceEvent {
  id: string;
  sessionId: string;
  traineeId: string;
  nodeId: string;
  method: AttendanceVerificationMethod;
  result: AttendanceResult;
  confidence?: number;
  quality?: number;
  occurredAt: string;
  createdBy: string;
  overrideReason?: string;
}

export interface RfidTapResult {
  cardUid: string;
  cardType: 'ISO_14443A' | 'KISAN_CREDIT_CARD';
  traineeId: string;
  traineeName: string;
  latencyMs: number;
  timestamp: string;
}

export interface HotspotStatus {
  ssid: string;
  gatewayIp: string;
  subnet: string;
  activeClients: number;
  interface: string;
  status: 'ACTIVE' | 'INACTIVE' | 'DEGRADED';
}

export interface DeviceHealth {
  status: 'HEALTHY' | 'DEGRADED' | 'FAILED';
  providerName: string;
  details: Record<string, unknown>;
}

export interface HardwareStatusResponse {
  cpuTempC: number;
  memoryUsageMb: number;
  memoryTotalMb?: number;
  memoryFreeMb?: number;
  memoryUsagePercent: number;
  sqliteJournalBytes: number;
  sqliteJournalKb: number;
  sqliteWalBytes?: number;
  sqliteShmBytes?: number;
  sqliteDbBytes?: number;
  hotspot: HotspotStatus;
  rfidReader: DeviceHealth;
  timestamp: string;
}

// ==========================================
// 6. Learning Progress & Assessments
// ==========================================

export interface LearningProgressEvent {
  id: string;
  traineeId: string;
  lessonId: string;
  eventType: 'LESSON_STARTED' | 'LESSON_COMPLETED' | 'CONTENT_ACCESSED';
  value: number; // e.g. percent 0-100 or 1 for done
  occurredAt: string;
  nodeId: string;
}

export interface Assessment {
  id: string;
  courseId: string;
  title: string;
  passingScore: number;
  questions?: Question[];
}

export interface Question {
  id: string;
  assessmentId: string;
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE';
  prompt: string;
  options: string[];
  correctAnswer: string | number;
}

export interface AssessmentSubmission {
  id: string;
  assessmentId: string;
  traineeId: string;
  answers: Record<string, string | number>;
  score: number;
  passed: boolean;
  occurredAt: string;
  nodeId: string;
}

export interface OralQuestion {
  id: string;
  topic: string;
  prompt: string;
  promptHi: string;
  expectedKeywords: string[];
  expectedKeywordsHi: string[];
  passingKeywordThreshold: number;
  explanation?: string;
  explanationHi?: string;
}

export interface OralQuestionScore {
  questionId: string;
  prompt: string;
  transcript: string;
  matchedKeywords: string[];
  missingKeywords: string[];
  score: number;
}

export interface OralAssessmentResult {
  assessmentId: string;
  traineeId: string;
  language: 'HI' | 'EN';
  questions: OralQuestionScore[];
  totalScore: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  completedAt: string;
}

export interface OralAssessmentSubmittedPayload extends OralAssessmentResult {
  nodeId?: string;
  score?: number;
  correctCount?: number;
  totalQuestions?: number;
  answers?: Record<string, string>;
}

// ==========================================
// 7. Skills & Credentials
// ==========================================

export interface Skill {
  id: string;
  code: string;
  name: string;
  description: string;
  parentSkillId?: string | null;
  parentCategory?: string;
  evidenceRule?: string;
}

export interface CourseSkill {
  courseId: string;
  skillId: string;
  evidenceRule: string; // e.g. "MIN_ASSESSMENT_SCORE_70"
}

export interface SkillEvidence {
  id: string;
  traineeId: string;
  skillId: string;
  sourceType: 'ASSESSMENT' | 'TRAINING_COMPLETION' | 'ATTENDANCE_RECORD';
  sourceId: string;
  level: number; // e.g. 1 (Beginner), 2 (Intermediate), 3 (Proficient)
  issuedAt: string;
}

export enum CredentialStatus {
  ACTIVE = 'ACTIVE',
  REVOKED = 'REVOKED',
  EXPIRED = 'EXPIRED',
}

export interface SkillSummary {
  skillCode: string;
  skillName: string;
  level: number;
}

export interface CanonicalCredentialPayload {
  credentialId: string;
  issuer: {
    id: string;
    name: string;
    instituteId?: string;
  };
  recipient: {
    traineeId: string;
    name: string;
  };
  programme: {
    id: string;
    title: string;
  };
  skillsSummary: SkillSummary[];
  issuedAt: string;
  expiresAt: string | null;
  schemaVersion: number;
}

export interface Credential {
  id: string;
  traineeId: string;
  programmeId: string;
  payload: CanonicalCredentialPayload;
  signature: string; // Ed25519 signature in hex or base64
  issuerKeyId: string;
  status: CredentialStatus;
  issuedAt: string;
  expiresAt: string | null;
}

// ==========================================
// 8. Employment Opportunities & Matching
// ==========================================

export interface JobOpportunity {
  id: string;
  employerId: string;
  employerName?: string;
  title: string;
  description: string;
  location: string;
  qualification: string;
  experienceYears: number;
  active: boolean;
  createdAt: string;
}

export interface JobRequiredSkill {
  jobId: string;
  skillId: string;
  skillCode?: string;
  skillName?: string;
  requiredLevel: number;
  weight: number;
}

export interface JobMatchResult {
  job: JobOpportunity;
  matchScore: number; // 0 to 100 (weighted verified skill overlap)
  hardEligibilityPassed: boolean;
  eligibilityReasons?: string[];
  matchedSkills: Array<{
    skillCode: string;
    skillName: string;
    traineeLevel: number;
    requiredLevel: number;
    weight?: number;
  }>;
  missingSkills: Array<{
    skillCode: string;
    skillName: string;
    requiredLevel: number;
    weight?: number;
  }>;
  explanation?: string;
}

// ==========================================
// 9. Edge Nodes, Sync Protocol & Durability
// ==========================================

export enum EdgeNodeHealthStatus {
  ONLINE_SYNCED = 'ONLINE_SYNCED',
  ONLINE_SYNCING = 'ONLINE_SYNCING',
  OFFLINE_READY = 'OFFLINE_READY',
  OFFLINE_DEGRADED = 'OFFLINE_DEGRADED',
  STORAGE_WARNING = 'STORAGE_WARNING',
  HARDWARE_WARNING = 'HARDWARE_WARNING',
}

export interface EdgeNode {
  id: string;
  instituteId: string;
  name: string;
  publicKey: string;
  softwareVersion: string;
  lastSeenAt: string;
  healthStatus: EdgeNodeHealthStatus;
}

export interface DeviceTelemetry {
  cpuTemperatureC: number;
  cpuLoadPercent: number;
  memoryUsagePercent: number;
  diskUsagePercent: number;
  uptimeSeconds: number;
  networkState: 'ONLINE' | 'OFFLINE' | 'DEGRADED';
  wanSimulationMode: 'online' | 'offline' | 'flaky';
  appVersion: string;
  lastSyncAt: string | null;
  queuedEventCount: number;
}

export enum SyncStatus {
  LOCAL = 'LOCAL',
  QUEUED = 'QUEUED',
  SYNCING = 'SYNCING',
  SYNCED = 'SYNCED',
  FAILED = 'FAILED',
}

export enum SyncEventType {
  ATTENDANCE_RECORDED = 'ATTENDANCE_RECORDED',
  PROGRESS_RECORDED = 'PROGRESS_RECORDED',
  ASSESSMENT_SUBMITTED = 'ASSESSMENT_SUBMITTED',
  ORAL_ASSESSMENT_SUBMITTED = 'ORAL_ASSESSMENT_SUBMITTED',
  SESSION_STARTED = 'SESSION_STARTED',
  SESSION_ENDED = 'SESSION_ENDED',
  HEALTH_RECORDED = 'HEALTH_RECORDED',
}

export interface SyncEvent<T = Record<string, unknown>> {
  id: string;
  nodeId: string;
  aggregateType: 'ATTENDANCE' | 'PROGRESS' | 'ASSESSMENT' | 'SESSION' | 'NODE_HEALTH';
  aggregateId: string;
  eventType: string;
  payload: T;
  schemaVersion: number;
  occurredAt: string;
  logicalSequence: number;
  hash: string;
  syncStatus: SyncStatus;
  retryCount: number;
}

export interface AuditLog {
  id: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown>;
  occurredAt: string;
}

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
  tier?: 1 | 2 | 3;
  parentInstituteId?: string | null;
  state?: string;
  zone?: 'APEX' | 'NORTH' | 'SOUTH' | 'EAST' | 'WEST' | 'CENTRAL';
  latitude?: number;
  longitude?: number;
  pacsCount?: number;
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

// ==========================================
// 10. Multi-Tier Federation & National Rollup
// ==========================================

export interface FederationInstituteSummary {
  id: string;
  name: string;
  code: string;
  locationText: string;
  state: string;
  zone: string;
  lat: number;
  lng: number;
}

export interface FederationTierRollup {
  tier: 1 | 2 | 3;
  name: string;
  institutesCount: number;
  institutes: FederationInstituteSummary[];
  totalTrainees: number;
  certifiedTrainees: number;
  activeBatches: number;
  attachedPacsCount: number;
  activeEdgeNodes: number;
}

export interface GeoNode {
  id: string;
  name: string;
  code: string;
  tier: number;
  state: string;
  zone: string;
  lat: number;
  lng: number;
  trainees: number;
  certified: number;
  pacs: number;
}

export interface FederationAnalyticsResponse {
  summary: {
    totalInstitutes: number;
    totalTrainees: number;
    certifiedCount: number;
    certificationRate: number;
    totalAttachedPacs: number;
    totalEdgeNodes: number;
    generatedAt: string;
  };
  tiers: {
    tier1_apex: FederationTierRollup;
    tier2_regional: FederationTierRollup;
    tier3_local: FederationTierRollup;
    tier1?: FederationTierRollup;
    tier2?: FederationTierRollup;
    tier3?: FederationTierRollup;
  };
  geoNodes: GeoNode[];
}

// ==========================================
// 12. Recruiter Pipeline & Digital Offer Letters (M4)
// ==========================================

export type JobApplicationStatus = 'APPLIED' | 'SCHEDULED' | 'OFFERED' | 'PLACED' | 'REJECTED';

export interface JobApplication {
  id: string;
  jobId: string;
  jobTitle: string;
  employerId: string;
  employerName: string;
  candidateId: string;
  candidateName: string;
  status: JobApplicationStatus;
  matchScore: number;
  matchedSkills?: Array<{ skillCode: string; skillName: string; traineeLevel: number; requiredLevel: number }>;
  missingSkills?: Array<{ skillCode: string; skillName: string; requiredLevel: number }>;
  interviewDate?: string;
  interviewVenue?: string;
  interviewNotes?: string;
  offerLetterId?: string;
  appliedAt: string;
  updatedAt: string;
}

export interface CanonicalOfferPayload {
  offerId: string;
  applicationId: string;
  jobId: string;
  jobTitle: string;
  employer: {
    id: string;
    name: string;
    authorizedSignatory: string;
  };
  candidate: {
    id: string;
    name: string;
    emailOrPhone: string;
  };
  designation: string;
  annualCompensationLPA: number;
  monthlyStipendOrSalary: number;
  joiningDate: string;
  postingLocation: string;
  terms: string[];
  issuedAt: string;
  schemaVersion: number;
}

export type DigitalOfferLetterPayload = CanonicalOfferPayload;

export interface DigitalOfferLetter {
  id: string;
  applicationId: string;
  jobId: string;
  candidateId: string;
  payload: CanonicalOfferPayload;
  signatureHex: string; // Ed25519 signature hex
  signature?: string; // Alias for backward compatibility
  issuerKeyId: string; // Key ID of issuing authority
  publicKey?: string; // PEM or raw public key of issuer
  canonicalDigest?: string; // SHA-256 over canonical JSON
  verificationUrl: string;
  compactQr?: string;
  status: 'ISSUED' | 'ACCEPTED' | 'DECLINED' | 'REVOKED';
  issuedAt: string;
}

export interface UpdateApplicationStatusDto {
  status: JobApplicationStatus;
  interviewDate?: string;
  interviewVenue?: string;
  interviewNotes?: string;
}

export interface IssueOfferLetterDto {
  applicationId: string;
  designation: string;
  annualCompensationLPA: number;
  monthlyStipendOrSalary: number;
  joiningDate: string;
  postingLocation: string;
  terms?: string[];
  authorizedSignatory?: string;
}

// ==========================================
// 13. Scheme Advisory & Evaluation Engine (M1)
// ==========================================

export type SchemeCategory =
  | 'INFRASTRUCTURE'
  | 'YOUTH_STARTUP'
  | 'COMPUTERIZATION'
  | 'PROCESSING'
  | 'DIVERSIFICATION';

export type CooperativeSocietyType =
  | 'PACS'
  | 'DAIRY'
  | 'FISHERY'
  | 'MULTI_PURPOSE'
  | 'FPO';

export type AuditGrade = 'A' | 'B' | 'C' | 'D';

export type SchemeProjectCategory =
  | 'POST_HARVEST_STORAGE'
  | 'AGRI_INPUT_RETAIL'
  | 'DAIRY_COLD_CHAIN'
  | 'CSC_DIGITAL_SERVICES'
  | 'SOLAR_KUSUM'
  | 'FOOD_PROCESSING';

export interface SchemeDefinition {
  id: string;
  code: string;
  name: string;
  nodalMinistry: string;
  category: SchemeCategory;
  maxProjectCostLakhs: number;
  subsidyPercentage: number;
  maxSubsidyLakhs: number;
  interestSubventionPercent: number;
  eligibleSocietyTypes: string[];
  minimumAuditGrade: 'A' | 'B' | 'C';
  mandatoryDocuments: string[];
  description?: string;
  tenureYears?: number;
  moratoriumMonths?: number;
}

export interface SchemeEvaluationInput {
  societyType: CooperativeSocietyType;
  yearsActive: number;
  auditGrade: AuditGrade;
  memberCount: number;
  womenMemberPercentage: number;
  annualTurnoverLakhs: number;
  netWorthLakhs: number;
  proposedProjectCostLakhs: number;
  projectCategory: SchemeProjectCategory;
  societyName?: string;
  districtState?: string;
}

export interface SchemeEvaluationResult {
  schemeId: string;
  schemeName: string;
  eligible: boolean;
  matchScore: number;
  reasons: string[];
  eligibleSubsidyLakhs: number;
  applicableSubventionPercent: number;
  estimatedAnnualInterestSavingsLakhs: number;
  effectiveInterestRate: number;
  documentChecklist: string[];
}

// ==========================================
// 14. PACS Operations Lab & Accounting Simulator (M1)
// ==========================================

export type PacsAccountCategory =
  | 'CASH'
  | 'LOAN_ASSET'
  | 'INVENTORY'
  | 'SAVINGS_DEPOSIT'
  | 'SHARE_CAPITAL'
  | 'OPERATING_EXPENSE';

export type PacsTransactionType = 'DEBIT' | 'CREDIT';

export interface PacsDayBookEntry {
  id: string;
  accountHead: string;
  category: PacsAccountCategory;
  type: PacsTransactionType;
  amount: number;
  narration: string;
  voucherNumber: string;
  timestamp?: string;
}

export interface PacsDayEndClosingState {
  openingCashVault: number;
  entries: PacsDayBookEntry[];
  totalReceipts: number;
  totalDisbursements: number;
  calculatedClosingCash: number;
  physicalCashCount: number;
  variance: number;
  isBalanced: boolean;
  closingCertificateId?: string;
  closedAt?: string;
}

export interface KccAppraisalState {
  applicantName: string;
  memberId: string;
  cropName: string;
  acreage: number;
  scaleOfFinancePerAcre: number;
  baseCultivationCost: number;
  postHarvestAllowance10Pct: number;
  farmMaintenance20Pct: number;
  totalSanctionLimit: number;
  grossInterestRate: number;
  promptRepaymentIncentive: number;
  effectiveInterestRate: number;
  appraisalStatus: 'PENDING' | 'SANCTIONED' | 'REJECTED';
  sanctionOrderNumber?: string;
  sanctionedAt?: string;
}

export interface PacsInventoryReconciliationState {
  fertilizerType: 'UREA' | 'DAP' | 'MOP' | 'NPK';
  openingBags: number;
  inwardReceiptBags: number;
  posSoldBags: number;
  expectedClosingBags: number;
  actualPhysicalBags: number;
  shrinkageBags: number;
  permissibleShrinkageBags: number;
  shrinkagePermissible: boolean;
  reconciliationStatus: 'BALANCED' | 'DISCREPANCY_FLAGGED';
}

// ==========================================
// 15. NCCT Oral Viva 4-Dimension Rubric (M1)
// ==========================================

export type RubricDimensionType =
  | 'TECHNICAL_ACCURACY'
  | 'PROCEDURAL_LOGIC'
  | 'COOPERATIVE_TERMINOLOGY'
  | 'INTERNAL_CONTROLS';

export interface RubricDimensionScore {
  dimension: RubricDimensionType;
  dimensionLabel: string;
  weight: number;
  score: number;
  weightedScore: number;
  matchedConcepts: string[];
  missingConcepts: string[];
  feedback: string;
}

export interface DetailedOralAssessmentResult extends OralAssessmentResult {
  rubricBreakdown: RubricDimensionScore[];
  phoneticMatchesApplied: number;
  pedagogicalRecommendations: string[];
  overallProficiencyBand?: 'EXEMPLARY' | 'PROFICIENT' | 'DEVELOPING' | 'NEEDS_REMEDIATION';
}

// ==========================================
// 16. Cryptographic Proof Inspection & Tamper Sandbox (M1)
// ==========================================

export interface CredentialTrustChainNode {
  level: 'ROOT' | 'APEX' | 'INSTITUTE';
  authority: string;
  keyId: string;
  validUntil: string;
}

export interface CredentialCryptographicProof {
  canonicalJson: string;
  sha256DigestHex: string;
  signatureHex: string;
  curvePointR: string;
  scalarS: string;
  publicKeyHex: string;
  issuerKeyId: string;
  trustChain?: CredentialTrustChainNode[];
  isValid: boolean;
}

export interface CredentialTamperSimulationResult {
  tamperedPayload: Record<string, unknown>;
  tamperedDigestHex: string;
  originalDigestHex: string;
  verificationResult: boolean;
  errorReason: string;
  fieldModified: string;
  originalValue: unknown;
  modifiedValue: unknown;
}

// ==========================================
// 17. Member Grievance & Ombudsman Escalation (M1)
// ==========================================

export type GrievancePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type GrievanceStatus =
  | 'LODGED'
  | 'UNDER_INVESTIGATION'
  | 'RESOLUTION_PROPOSED'
  | 'RESOLVED'
  | 'ESCALATED_MINISTERIAL';

export type GrievanceCategory =
  | 'TRAINING_CERTIFICATE_DELAY'
  | 'KCC_LOAN_DISPUTE'
  | 'FERTILIZER_PDS_DISCREPANCY'
  | 'HOSTEL_MESS_AMENITIES'
  | 'GOVERNANCE_VOTER_LIST'
  | string;

export type GrievanceComplainantRole =
  | 'TRAINEE'
  | 'PACS_MEMBER'
  | 'FARMER'
  | 'COOPERATIVE_EMPLOYEE';

export interface GrievanceTicket {
  id: string;
  ticketNumber: string;
  complainantId: string;
  complainantName: string;
  complainantRole: GrievanceComplainantRole;
  societyOrInstituteId: string;
  societyName: string;
  category: GrievanceCategory;
  title: string;
  description: string;
  priority: GrievancePriority;
  status: GrievanceStatus;
  currentTier: 1 | 2 | 3 | 4;
  escalationDeadline: string;
  slaHoursRemaining: number;
  slaBreached: boolean;
  resolutionSummary?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GrievanceActionLog {
  id: string;
  ticketId: string;
  actorId: string;
  actorName: string;
  action:
    | 'TICKET_LODGED'
    | 'INVESTIGATION_OPENED'
    | 'TIER_ESCALATED'
    | 'EVIDENCE_ATTACHED'
    | 'RESOLUTION_ISSUED'
    | 'CLOSED';
  notes: string;
  timestamp: string;
}

export interface GrievanceSlaConfig {
  tier: 1 | 2 | 3 | 4;
  tierName: string;
  slaHours: number;
  authorityLevel: string;
}

// ==========================================
// 18. Cooperative Society CAMEL Health Scorecard (M1)
// ==========================================

export interface PacsFinancialMetrics {
  societyId: string;
  societyName: string;
  district: string;
  state: string;
  shareCapitalLakhs: number;
  reservesAndSurplusLakhs: number;
  totalDepositsLakhs: number;
  totalAdvancesLakhs: number;
  grossNpaLakhs: number;
  liquidAssetsLakhs: number;
  netProfitLakhs: number;
  nonCreditRevenueLakhs: number;
  totalRevenueLakhs: number;
  governanceChecklistPassed: number;
}

export interface CamelDimensionScores {
  capitalScore: number;
  assetQualityScore: number;
  managementScore: number;
  earningsScore: number;
  liquidityScore: number;
}

export interface DiagnosticAlert {
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  title: string;
  description: string;
  statutoryDirective: string;
}

export interface PacsHealthScorecard {
  metrics: PacsFinancialMetrics;
  capitalAdequacyRatio: number;
  grossNpaPercentage: number;
  liquidityRatio: number;
  nonCreditRevenuePercentage: number;
  camelScores: CamelDimensionScores;
  compositeHealthScore: number;
  auditGrade: AuditGrade;
  status: 'THRIVING' | 'STABLE' | 'VULNERABLE' | 'CRITICAL';
  diagnosticAlerts: DiagnosticAlert[];
  evaluatedAt: string;
}

// ==========================================
// 19. 100-Point Candidate Matcher & Career Pathway (M1)
// ==========================================

export interface CandidateMatchBreakdown100Pt {
  skillsScore: number;
  certificationsScore: number;
  educationScore: number;
  experienceScore: number;
  locationScore: number;
  preferenceScore: number;
  availabilityScore: number;
}

export interface CandidateMatch100Pt {
  job: JobOpportunity;
  traineeId: string;
  traineeName: string;
  totalScore: number;
  hardEligibilityPassed: boolean;
  eligibilityReasons?: string[];
  breakdown: CandidateMatchBreakdown100Pt;
  matchedSkills: Array<{
    skillCode: string;
    skillName: string;
    traineeLevel: number;
    requiredLevel: number;
    weight: number;
  }>;
  missingSkills: Array<{
    skillCode: string;
    skillName: string;
    requiredLevel: number;
    weight: number;
  }>;
  explanation: string;
  matchedAt: string;
}

export interface CareerPathwayStep {
  stepNumber: number;
  roleTitle: string;
  targetSector: string;
  estimatedTenureMonths: number;
  requiredSkills: string[];
  recommendedCertifications: string[];
  salaryRangeLPA: {
    min: number;
    max: number;
  };
  status: 'COMPLETED' | 'IN_PROGRESS' | 'NEXT_MILESTONE' | 'FUTURE_GOAL';
  completionCriteria: string;
}

export interface TraineeCareerPathway {
  traineeId: string;
  traineeName: string;
  currentRole: string;
  targetAspiration: string;
  currentProgressPercentage: number;
  pathwaySteps: CareerPathwayStep[];
  recommendedImmediateActions: string[];
  generatedAt: string;
}

// ==========================================
// 20. Institute Hierarchy, Annual Training Plan (ATP) & Batch Nominations (M1 NCCT)
// ==========================================

export type InstituteTier = 'APEX' | 'RICM' | 'ICM';

export type ProgrammeDeliveryMode = 'ONLINE' | 'OFFLINE' | 'HYBRID';

export type NominationStatus = 'PENDING' | 'APPROVED' | 'WAITLISTED' | 'REJECTED';

export interface TrainingInstitute {
  id: string;
  code: string;
  name: string;
  tier: InstituteTier;
  state: string;
  city: string;
  directorName: string;
  email: string;
  contactNumber: string;
  hostelCapacity: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TrainingProgramme {
  id: string;
  instituteId: string;
  instituteName?: string;
  title: string;
  code: string;
  atpYear: string; // e.g. "2026-2027"
  targetSector: string; // e.g. "PACS", "DAIRY", "CREDIT_BANKING", "HANDLOOM"
  deliveryMode: ProgrammeDeliveryMode;
  capacity: number;
  approvedCount: number;
  startDate: string; // ISO date YYYY-MM-DD
  endDate: string;   // ISO date YYYY-MM-DD
  coordinatingFacultyId?: string;
  coordinatingFacultyName?: string;
  status: 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
}

export interface TraineeNomination {
  id: string;
  programmeId: string;
  programmeTitle?: string;
  traineeId: string;
  fullName: string;
  phone: string;
  email?: string;
  cooperativeAffiliation: string; // e.g. "Khed Taluka PACS"
  designation: string;            // e.g. "Secretary", "Accountant", "Board Member"
  state: string;
  status: NominationStatus;
  nominatedAt: string;
  decidedAt?: string;
  decidedBy?: string;
  rejectionReason?: string;
  hostelRoomId?: string;
  hostelBlock?: string;
  hostelRoomNumber?: string;
}

// ==========================================
// 21. Timetable Scheduling & Dynamic Attendance Engine (M1 NCCT)
// ==========================================

export type SessionAttendanceVerificationMethod =
  | 'DYNAMIC_CODE'
  | 'QR_SCAN'
  | 'KIOSK_NFC_FACE'
  | 'FACULTY_MANUAL';

export interface TimetableSession {
  id: string;
  programmeId: string;
  courseId?: string;
  courseTitle?: string;
  title: string;
  facultyId: string;
  facultyName: string;
  sessionDate: string; // YYYY-MM-DD
  startTime: string;   // HH:MM (24-hour format)
  endTime: string;     // HH:MM (24-hour format)
  startsAt: string;    // ISO timestamp (for temporal guard arithmetic)
  endsAt: string;      // ISO timestamp
  venue: string;
  checkInCode: string; // 6-digit numeric token e.g. "482910"
  status: 'UPCOMING' | 'ACTIVE' | 'CONCLUDED';
  createdAt: string;
}

export interface SessionAttendanceRecord {
  id: string;
  sessionId: string;
  traineeId: string;
  traineeName: string;
  verificationMethod: SessionAttendanceVerificationMethod;
  markedAt: string;
  markedBy?: string; // Faculty ID or name when verified manually
  verified: boolean;
  matchScore?: number; // Face similarity score (0.00 - 1.00) if biometric kiosk
}

export interface FacultyClassRosterEntry {
  traineeId: string;
  traineeName: string;
  phone?: string;
  cooperativeAffiliation: string;
  designation: string;
  isPresent: boolean;
  attendanceRecord?: SessionAttendanceRecord;
}

// ==========================================
// 22. Continuous Evaluation, Formative Quizzes & Summative Gradebook (M1 NCCT)
// ==========================================

export type AssessmentType = 'FORMATIVE_QUIZ' | 'SUMMATIVE_TEST';
export type AcademicGrade = 'DISTINCTION' | 'FIRST_CLASS' | 'PASS' | 'INCOMPLETE';

export interface CourseModuleTestQuestion {
  id: string;
  questionText: string;
  options: Array<{ id: string; text: string }>;
  correctOptionId: string;
  marks: number;
  explanation?: string;
}

export interface CourseModuleTest {
  id: string;
  courseId: string;
  moduleId?: string;
  moduleTitle?: string;
  title: string;
  type: AssessmentType;
  totalMarks: number;
  passMarks: number;
  maxAttempts: number; // 0 indicates unlimited attempts (for formative quizzes)
  questionCount: number;
  questions?: CourseModuleTestQuestion[];
  createdAt: string;
}

export interface AssessmentAttempt {
  id: string;
  testId: string;
  traineeId: string;
  answers: Record<string, string | number>;
  marksObtained: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  submittedAt: string;
}

export interface TraineeMarksRecord {
  testId: string;
  testTitle: string;
  type: AssessmentType;
  attemptsUsed: number;
  bestScore: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  lastAttemptedAt?: string;
}

export interface CourseMarksTally {
  traineeId: string;
  traineeName: string;
  courseId: string;
  courseTitle: string;
  completedLessonsCount: number;
  totalLessonsCount: number;
  lessonCompletionPercent: number;
  formativeQuizzesAttempted: number;
  summativeTestsPassed: number;
  totalSummativeTests: number;
  cumulativeMarksObtained: number;
  cumulativeTotalMarks: number;
  overallPercentage: number;
  awardGrade?: AcademicGrade;
  certificateEligible: boolean;
  records: TraineeMarksRecord[];
  evaluatedAt: string;
}

export interface CourseGradebookRow {
  traineeId: string;
  traineeName: string;
  cooperativeAffiliation?: string;
  scoresByTestId: Record<
    string,
    { score: number; total: number; passed: boolean; attempts: number }
  >;
  cumulativeMarks: number;
  cumulativeTotal: number;
  overallPercentage: number;
  passedAllSummative: boolean;
  grade: AcademicGrade;
  certificateIssued: boolean;
  certificateCode?: string;
}

export interface CourseGradebookMatrix {
  courseId: string;
  courseTitle: string;
  programmeId?: string;
  programmeTitle?: string;
  tests: Array<{
    id: string;
    title: string;
    type: AssessmentType;
    totalMarks: number;
    passMarks: number;
  }>;
  rows: CourseGradebookRow[];
  classAveragePercentage: number;
  passRatePercentage: number;
  totalEnrolled: number;
  generatedAt: string;
}

// ==========================================
// 23. Predictive Dropout-Risk Retention Heuristic (M1 NCCT)
// ==========================================

export type DropoutRiskTier = 'LOW' | 'MEDIUM' | 'HIGH';

export interface DropoutRiskFactors {
  lowLessonCompletion: boolean; // +40 pts if lesson completion < 25%
  lowAttendance: boolean;       // +30 pts if attendance rate < 50%
  staleEngagement: boolean;     // +20 pts if inactivity > 14 days
  assessmentFailures: number;   // +10 pts per failed summative test (capped at 30 pts)
}

export interface DropoutRiskAssessment {
  traineeId: string;
  traineeName: string;
  programmeId: string;
  programmeTitle?: string;
  riskScore: number; // 0 to 100
  riskTier: DropoutRiskTier;
  riskFactors: DropoutRiskFactors;
  recommendedIntervention: string;
  evaluatedAt: string;
}

export interface DropoutRiskTriageSummary {
  atpYear?: string;
  instituteId?: string;
  totalAssessed: number;
  tierCounts: Record<DropoutRiskTier, number>;
  highRiskTrainees: DropoutRiskAssessment[];
  generatedAt: string;
}

// ==========================================
// 24. Cooperative Skill Taxonomy & Skill-Gap Analysis (M1 NCCT)
// ==========================================

export type CooperativeSkillCategory =
  | 'PACS_OPERATIONS'
  | 'FINANCIAL_ACCOUNTING'
  | 'CREDIT_KCC'
  | 'COMMODITY_STORAGE'
  | 'STATUTORY_LEGAL'
  | 'GOVERNANCE_MANAGEMENT';

export interface CooperativeSkillItem {
  id: string;
  code: string;
  name: string;
  category: CooperativeSkillCategory;
  description?: string;
}

export interface RelatedSkillMatch {
  gapSkillId: string;
  gapSkillName: string;
  relatedAcquiredSkillId: string;
  relatedAcquiredSkillName: string;
  similarityScore: number; // 0.00 to 1.00 (threshold >= 0.40)
}

export interface SkillGapAnalysisResult {
  jobId: string;
  jobTitle: string;
  acquiredSkills: CooperativeSkillItem[];
  gapSkills: CooperativeSkillItem[];
  relatedSkills: RelatedSkillMatch[];
  matchPercentage: number;
  suggestedRemediationSequence: Array<{
    rank: number;
    skillId: string;
    skillName: string;
    remediationReason: string;
  }>;
  analyzedAt: string;
}

export interface SectorSkillShortageRow {
  skillId: string;
  skillName: string;
  category: CooperativeSkillCategory | string;
  jobDemandCount: number;
  traineeSupplyCount: number;
  netShortage: number; // jobDemandCount - traineeSupplyCount
}

export interface SectorSkillShortageRadar {
  skills: SectorSkillShortageRow[];
  totalDemand: number;
  totalSupply: number;
  netShortage: number;
  generatedAt: string;
}

// ==========================================
// 25. Hostel Logistics & Trainee Sovereign Public NFC Profile (M1 NCCT)
// ==========================================

export type HostelRoomType = 'SINGLE' | 'DOUBLE' | 'DORMITORY';

export interface CampusHostelRoom {
  id: string;
  instituteId: string;
  hostelBlock: string;
  roomNumber: string;
  roomType: HostelRoomType;
  bedCapacity: number;
  occupiedBeds: number;
  floor?: number;
  active: boolean;
}

export interface HostelAllocationRecord {
  id: string;
  nominationId: string;
  traineeId: string;
  traineeName: string;
  programmeId: string;
  programmeTitle?: string;
  roomId: string;
  hostelBlock: string;
  roomNumber: string;
  roomType: HostelRoomType;
  checkInDate: string;  // YYYY-MM-DD
  checkOutDate: string; // YYYY-MM-DD
  allocatedAt: string;
  allocatedBy: string;
  notes?: string;
}

export interface TraineeIssuedCertificateItem {
  code: string;
  title: string;
  issuedDate: string;
  verifiableUrl: string;
  scorePercent?: number;
}

export interface TraineePublicNfcProfile {
  traineeId: string;
  publicProfileCode: string; // Unique rotatable alphanumeric code (e.g. "NCCT-P-7X89K2")
  publicUrl: string;         // e.g. "/?profile=NCCT-P-7X89K2"
  enabled: boolean;
  fullName: string;
  cooperativeAffiliation: string;
  certifiedCoursesCount: number;
  primarySkills: string[];
  issuedCertificates: TraineeIssuedCertificateItem[];
  updatedAt: string;
}


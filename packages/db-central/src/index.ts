import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  real,
  bigint,
} from 'drizzle-orm/pg-core';

// ==========================================
// 1. Institutes & Users (Central Authority)
// ==========================================

export const institutes = pgTable('institutes', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  code: text('code').notNull().unique(),
  type: text('type').notNull(), // 'RICM', 'ICM', 'VAMNICOM'
  locationText: text('location_text').notNull(),
  tier: integer('tier'),
  parentInstituteId: text('parent_institute_id'),
  state: text('state'),
  zone: text('zone'),
  latitude: real('latitude'),
  longitude: real('longitude'),
  pacsCount: integer('pacs_count').default(0),
  active: boolean('active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  emailOrPhone: text('email_or_phone').notNull().unique(),
  role: text('role').notNull(), // 'SUPER_ADMIN', 'INSTITUTE_ADMIN', 'TRAINER', 'TRAINEE', 'EMPLOYER'
  instituteId: text('institute_id').references(() => institutes.id),
  preferredLanguage: text('preferred_language').default('hi').notNull(),
  passwordHash: text('password_hash').notNull(),
  active: boolean('active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const traineeProfiles = pgTable('trainee_profiles', {
  userId: text('user_id').primaryKey().references(() => users.id),
  cooperativeAffiliation: text('cooperative_affiliation').notNull(),
  districtState: text('district_state').notNull(),
  skillsSummary: text('skills_summary').default('').notNull(),
  consentFlags: jsonb('consent_flags').notNull(),
});

export const trainerProfiles = pgTable('trainer_profiles', {
  userId: text('user_id').primaryKey().references(() => users.id),
  designation: text('designation').notNull(),
  specialization: text('specialization'),
});

// ==========================================
// 2. Programmes, Batches, Sessions & Enrollments
// ==========================================

export const programmes = pgTable('programmes', {
  id: text('id').primaryKey(),
  instituteId: text('institute_id').references(() => institutes.id).notNull(),
  title: text('title').notNull(),
  description: text('description').default('').notNull(),
  startAt: timestamp('start_at').notNull(),
  endAt: timestamp('end_at').notNull(),
  status: text('status').default('DRAFT').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const batches = pgTable('batches', {
  id: text('id').primaryKey(),
  programmeId: text('programme_id').references(() => programmes.id).notNull(),
  name: text('name').notNull(),
  capacity: integer('capacity').default(40).notNull(),
  trainerId: text('trainer_id').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const trainingSessions = pgTable('training_sessions', {
  id: text('id').primaryKey(),
  batchId: text('batch_id').references(() => batches.id).notNull(),
  title: text('title').notNull(),
  startsAt: timestamp('starts_at').notNull(),
  endsAt: timestamp('ends_at').notNull(),
  attendancePolicy: jsonb('attendance_policy').default({}).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const enrollments = pgTable('enrollments', {
  id: text('id').primaryKey(),
  traineeId: text('trainee_id').references(() => users.id).notNull(),
  programmeId: text('programme_id').references(() => programmes.id).notNull(),
  batchId: text('batch_id').references(() => batches.id).notNull(),
  status: text('status').default('ENROLLED').notNull(),
  enrolledAt: timestamp('enrolled_at').defaultNow().notNull(),
});

// ==========================================
// 3. Courses, Modules & Lessons (LMS)
// ==========================================

export const courses = pgTable('courses', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  version: integer('version').default(1).notNull(),
  language: text('language').default('hi').notNull(),
  description: text('description').default('').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const modules = pgTable('modules', {
  id: text('id').primaryKey(),
  courseId: text('course_id').references(() => courses.id).notNull(),
  title: text('title').notNull(),
  order: integer('order').notNull(),
});

export const lessons = pgTable('lessons', {
  id: text('id').primaryKey(),
  moduleId: text('module_id').references(() => modules.id).notNull(),
  type: text('type').notNull(), // 'TEXT', 'VIDEO', 'INTERACTIVE_DOCUMENT'
  title: text('title').notNull(),
  contentUri: text('content_uri').notNull(),
  localAssetRef: text('local_asset_ref'),
  order: integer('order').notNull(),
});

// ==========================================
// 4. Attendance & Learning Progress
// ==========================================

export const attendanceEvents = pgTable('attendance_events', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').references(() => trainingSessions.id).notNull(),
  traineeId: text('trainee_id').references(() => users.id).notNull(),
  nodeId: text('node_id').notNull(),
  method: text('method').notNull(), // 'SIMULATED_FACE', 'QR', 'NFC', 'MANUAL_OVERRIDE'
  result: text('result').notNull(), // 'PRESENT', 'LATE', 'ABSENT', 'EXCUSED'
  confidence: real('confidence'),
  quality: real('quality'),
  occurredAt: timestamp('occurred_at').notNull(),
  createdBy: text('created_by').references(() => users.id).notNull(),
  overrideReason: text('override_reason'),
});

export const learningProgressEvents = pgTable('learning_progress_events', {
  id: text('id').primaryKey(),
  traineeId: text('trainee_id').references(() => users.id).notNull(),
  lessonId: text('lesson_id').references(() => lessons.id).notNull(),
  eventType: text('event_type').notNull(),
  value: real('value').notNull(),
  occurredAt: timestamp('occurred_at').notNull(),
  nodeId: text('node_id').notNull(),
});

// ==========================================
// 5. Assessments, Skills & Credentials
// ==========================================

export const assessments = pgTable('assessments', {
  id: text('id').primaryKey(),
  courseId: text('course_id').references(() => courses.id).notNull(),
  title: text('title').notNull(),
  passingScore: integer('passing_score').default(70).notNull(),
});

export const questions = pgTable('questions', {
  id: text('id').primaryKey(),
  assessmentId: text('assessment_id').references(() => assessments.id).notNull(),
  type: text('type').notNull(),
  prompt: text('prompt').notNull(),
  options: jsonb('options').notNull(),
  correctAnswer: text('correct_answer').notNull(),
});

export const assessmentSubmissions = pgTable('assessment_submissions', {
  id: text('id').primaryKey(),
  assessmentId: text('assessment_id').references(() => assessments.id).notNull(),
  traineeId: text('trainee_id').references(() => users.id).notNull(),
  answers: jsonb('answers').notNull(),
  score: integer('score').notNull(),
  passed: boolean('passed').notNull(),
  occurredAt: timestamp('occurred_at').notNull(),
  nodeId: text('node_id').notNull(),
});

export const skills = pgTable('skills', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  parentSkillId: text('parent_skill_id'),
});

export const courseSkills = pgTable('course_skills', {
  courseId: text('course_id').references(() => courses.id).notNull(),
  skillId: text('skill_id').references(() => skills.id).notNull(),
  evidenceRule: text('evidence_rule').notNull(),
});

export const skillEvidence = pgTable('skill_evidence', {
  id: text('id').primaryKey(),
  traineeId: text('trainee_id').references(() => users.id).notNull(),
  skillId: text('skill_id').references(() => skills.id).notNull(),
  sourceType: text('source_type').notNull(),
  sourceId: text('source_id').notNull(),
  level: integer('level').default(1).notNull(),
  issuedAt: timestamp('issued_at').defaultNow().notNull(),
});

export const credentials = pgTable('credentials', {
  id: text('id').primaryKey(),
  traineeId: text('trainee_id').references(() => users.id).notNull(),
  programmeId: text('programme_id').references(() => programmes.id).notNull(),
  payload: jsonb('payload').notNull(),
  signature: text('signature').notNull(),
  issuerKeyId: text('issuer_key_id').notNull(),
  status: text('status').default('ACTIVE').notNull(),
  issuedAt: timestamp('issued_at').notNull(),
  expiresAt: timestamp('expires_at'),
});

// ==========================================
// 6. Employment Opportunities
// ==========================================

export const jobOpportunities = pgTable('job_opportunities', {
  id: text('id').primaryKey(),
  employerId: text('employer_id').references(() => users.id).notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  location: text('location').notNull(),
  qualification: text('qualification').notNull(),
  experienceYears: integer('experience_years').default(0).notNull(),
  active: boolean('active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const jobRequiredSkills = pgTable('job_required_skills', {
  jobId: text('job_id').references(() => jobOpportunities.id).notNull(),
  skillId: text('skill_id').references(() => skills.id).notNull(),
  requiredLevel: integer('required_level').default(1).notNull(),
  weight: real('weight').default(1.0).notNull(),
});

export const jobApplications = pgTable('job_applications', {
  id: text('id').primaryKey(),
  jobId: text('job_id').references(() => jobOpportunities.id).notNull(),
  jobTitle: text('job_title').notNull(),
  employerId: text('employer_id').references(() => users.id).notNull(),
  employerName: text('employer_name').notNull(),
  candidateId: text('candidate_id').references(() => users.id).notNull(),
  candidateName: text('candidate_name').notNull(),
  status: text('status').default('APPLIED').notNull(),
  matchScore: real('match_score').default(0).notNull(),
  interviewDate: timestamp('interview_date'),
  interviewVenue: text('interview_venue'),
  interviewNotes: text('interview_notes'),
  offerLetterId: text('offer_letter_id'),
  appliedAt: timestamp('applied_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const jobOfferLetters = pgTable('job_offer_letters', {
  id: text('id').primaryKey(),
  applicationId: text('application_id').references(() => jobApplications.id).notNull(),
  jobId: text('job_id').references(() => jobOpportunities.id).notNull(),
  candidateId: text('candidate_id').references(() => users.id).notNull(),
  payload: jsonb('payload').notNull(),
  signatureHex: text('signature_hex').notNull(),
  issuerKeyId: text('issuer_key_id').notNull(),
  verificationUrl: text('verification_url').notNull(),
  status: text('status').default('ISSUED').notNull(),
  issuedAt: timestamp('issued_at').defaultNow().notNull(),
});

// ==========================================
// 7. Edge Nodes, Sync Events & Audit
// ==========================================

export const edgeNodes = pgTable('edge_nodes', {
  id: text('id').primaryKey(),
  instituteId: text('institute_id').references(() => institutes.id).notNull(),
  name: text('name').notNull(),
  publicKey: text('public_key').notNull(),
  softwareVersion: text('software_version').notNull(),
  lastSeenAt: timestamp('last_seen_at').defaultNow().notNull(),
  healthStatus: text('health_status').default('ONLINE_SYNCED').notNull(),
});

export const syncEvents = pgTable('sync_events', {
  id: text('id').primaryKey(),
  nodeId: text('node_id').references(() => edgeNodes.id).notNull(),
  aggregateType: text('aggregate_type').notNull(),
  aggregateId: text('aggregate_id').notNull(),
  eventType: text('event_type').notNull(),
  payload: jsonb('payload').notNull(),
  schemaVersion: integer('schema_version').default(1).notNull(),
  occurredAt: timestamp('occurred_at').notNull(),
  logicalSequence: bigint('logical_sequence', { mode: 'number' }).notNull(),
  hash: text('hash').notNull(),
  syncStatus: text('sync_status').default('SYNCED').notNull(),
  retryCount: integer('retry_count').default(0).notNull(),
  ingestedAt: timestamp('ingested_at').defaultNow().notNull(),
});

export const auditLogs = pgTable('audit_logs', {
  id: text('id').primaryKey(),
  actorId: text('actor_id').references(() => users.id).notNull(),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').notNull(),
  metadata: jsonb('metadata').default({}).notNull(),
  occurredAt: timestamp('occurred_at').defaultNow().notNull(),
});

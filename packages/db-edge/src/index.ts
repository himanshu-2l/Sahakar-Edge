import {
  sqliteTable,
  text,
  integer,
  real,
} from 'drizzle-orm/sqlite-core';

// ==========================================
// 1. Local Provisioned Users & Rosters
// ==========================================

export const localUsers = sqliteTable('local_users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  emailOrPhone: text('email_or_phone').notNull(),
  role: text('role').notNull(),
  instituteId: text('institute_id'),
  preferredLanguage: text('preferred_language').default('hi').notNull(),
  passwordHash: text('password_hash').notNull(),
  active: integer('active', { mode: 'boolean' }).default(true).notNull(),
  syncedAt: text('synced_at').notNull(),
});

export const localProgrammes = sqliteTable('local_programmes', {
  id: text('id').primaryKey(),
  instituteId: text('institute_id').notNull(),
  title: text('title').notNull(),
  description: text('description').default('').notNull(),
  startAt: text('start_at').notNull(),
  endAt: text('end_at').notNull(),
  status: text('status').default('ACTIVE').notNull(),
  syncedAt: text('synced_at').notNull(),
});

export const localBatches = sqliteTable('local_batches', {
  id: text('id').primaryKey(),
  programmeId: text('programme_id').notNull(),
  name: text('name').notNull(),
  capacity: integer('capacity').default(40).notNull(),
  trainerId: text('trainer_id').notNull(),
  syncedAt: text('synced_at').notNull(),
});

export const localSessions = sqliteTable('local_sessions', {
  id: text('id').primaryKey(),
  batchId: text('batch_id').notNull(),
  title: text('title').notNull(),
  startsAt: text('starts_at').notNull(),
  endsAt: text('ends_at').notNull(),
  attendancePolicyJson: text('attendance_policy_json').default('{}').notNull(),
  syncedAt: text('synced_at').notNull(),
});

export const localEnrollments = sqliteTable('local_enrollments', {
  id: text('id').primaryKey(),
  traineeId: text('trainee_id').notNull(),
  programmeId: text('programme_id').notNull(),
  batchId: text('batch_id').notNull(),
  status: text('status').default('ENROLLED').notNull(),
  enrolledAt: text('enrolled_at').notNull(),
});

// ==========================================
// 2. Local Course Content (Offline LMS)
// ==========================================

export const localCourses = sqliteTable('local_courses', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  version: integer('version').default(1).notNull(),
  language: text('language').default('hi').notNull(),
  description: text('description').default('').notNull(),
  syncedAt: text('synced_at').notNull(),
});

export const localModules = sqliteTable('local_modules', {
  id: text('id').primaryKey(),
  courseId: text('course_id').notNull(),
  title: text('title').notNull(),
  order: integer('order').notNull(),
});

export const localLessons = sqliteTable('local_lessons', {
  id: text('id').primaryKey(),
  moduleId: text('module_id').notNull(),
  type: text('type').notNull(),
  title: text('title').notNull(),
  contentUri: text('content_uri').notNull(),
  localAssetRef: text('local_asset_ref'),
  order: integer('order').notNull(),
});

// ==========================================
// 3. Local Operational Mutation Tables
// ==========================================

export const localAttendanceRecords = sqliteTable('local_attendance_records', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').notNull(),
  traineeId: text('trainee_id').notNull(),
  nodeId: text('node_id').notNull(),
  method: text('method').notNull(),
  result: text('result').notNull(),
  confidence: real('confidence'),
  quality: real('quality'),
  occurredAt: text('occurred_at').notNull(),
  createdBy: text('created_by').notNull(),
  overrideReason: text('override_reason'),
});

export const localProgressRecords = sqliteTable('local_progress_records', {
  id: text('id').primaryKey(),
  traineeId: text('trainee_id').notNull(),
  lessonId: text('lesson_id').notNull(),
  eventType: text('event_type').notNull(),
  value: real('value').notNull(),
  occurredAt: text('occurred_at').notNull(),
  nodeId: text('node_id').notNull(),
});

export const localAssessments = sqliteTable('local_assessments', {
  id: text('id').primaryKey(),
  courseId: text('course_id').notNull(),
  title: text('title').notNull(),
  passingScore: integer('passing_score').default(70).notNull(),
});

export const localQuestions = sqliteTable('local_questions', {
  id: text('id').primaryKey(),
  assessmentId: text('assessment_id').notNull(),
  type: text('type').notNull(),
  prompt: text('prompt').notNull(),
  optionsJson: text('options_json').notNull(),
  correctAnswer: text('correct_answer').notNull(),
});

export const localAssessmentSubmissions = sqliteTable('local_assessment_submissions', {
  id: text('id').primaryKey(),
  assessmentId: text('assessment_id').notNull(),
  traineeId: text('trainee_id').notNull(),
  answersJson: text('answers_json').notNull(),
  score: integer('score').notNull(),
  passed: integer('passed', { mode: 'boolean' }).notNull(),
  occurredAt: text('occurred_at').notNull(),
  nodeId: text('node_id').notNull(),
});

// ==========================================
// 4. Local Event Journal (Core Offline Queue)
// ==========================================

export const localEventJournal = sqliteTable('local_event_journal', {
  id: text('id').primaryKey(),
  nodeId: text('node_id').notNull(),
  aggregateType: text('aggregate_type').notNull(),
  aggregateId: text('aggregate_id').notNull(),
  eventType: text('event_type').notNull(),
  payloadJson: text('payload_json').notNull(),
  schemaVersion: integer('schema_version').default(1).notNull(),
  occurredAt: text('occurred_at').notNull(),
  logicalSequence: integer('logical_sequence').notNull(),
  hash: text('hash').notNull(),
  syncStatus: text('sync_status').default('QUEUED').notNull(), // 'LOCAL', 'QUEUED', 'SYNCING', 'SYNCED', 'FAILED'
  retryCount: integer('retry_count').default(0).notNull(),
  lastError: text('last_error'),
  createdAt: text('created_at').notNull(),
});

// ==========================================
// 5. Edge Node State & Hardware Telemetry
// ==========================================

export const edgeNodeState = sqliteTable('edge_node_state', {
  nodeId: text('node_id').primaryKey(),
  nodeName: text('node_name').notNull(),
  softwareVersion: text('software_version').notNull(),
  lastLogicalSequence: integer('last_logical_sequence').default(0).notNull(),
  lastCentralSequence: integer('last_central_sequence').default(0).notNull(),
  wanSimulationMode: text('wan_simulation_mode').default('online').notNull(), // 'online', 'offline', 'flaky'
  lastSyncAt: text('last_sync_at'),
  healthStatus: text('health_status').default('OFFLINE_READY').notNull(),
  updatedAt: text('updated_at').notNull(),
});

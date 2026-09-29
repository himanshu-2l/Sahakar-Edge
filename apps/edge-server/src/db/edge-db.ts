import { DatabaseSync } from 'node:sqlite';
import {
  SEED_USERS,
  SEED_PROGRAMME,
  SEED_BATCH,
  SEED_SESSION,
  SEED_ENROLLMENTS,
  SEED_COURSE,
  SEED_MODULE,
  SEED_LESSONS,
  SEED_ASSESSMENT,
  SEED_QUESTIONS,
} from '@sahakar/test-fixtures';

export function createEdgeDatabase(dbPath = ':memory:'): DatabaseSync {
  const db = new DatabaseSync(dbPath);

  // WAL mode for durability, high concurrency, and power-loss resilience per 05_HARDWARE_EDGE.md
  if (dbPath !== ':memory:') {
    db.exec('PRAGMA journal_mode = WAL;');
  }
  db.exec('PRAGMA synchronous = NORMAL;');
  db.exec('PRAGMA foreign_keys = ON;');

  // Initialize tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS local_users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email_or_phone TEXT NOT NULL,
      role TEXT NOT NULL,
      institute_id TEXT,
      preferred_language TEXT NOT NULL DEFAULT 'hi',
      password_hash TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      synced_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS local_programmes (
      id TEXT PRIMARY KEY,
      institute_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      start_at TEXT NOT NULL,
      end_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      synced_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS local_batches (
      id TEXT PRIMARY KEY,
      programme_id TEXT NOT NULL,
      name TEXT NOT NULL,
      capacity INTEGER NOT NULL DEFAULT 40,
      trainer_id TEXT NOT NULL,
      synced_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS local_sessions (
      id TEXT PRIMARY KEY,
      batch_id TEXT NOT NULL,
      title TEXT NOT NULL,
      starts_at TEXT NOT NULL,
      ends_at TEXT NOT NULL,
      attendance_policy_json TEXT NOT NULL DEFAULT '{}',
      synced_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS local_enrollments (
      id TEXT PRIMARY KEY,
      trainee_id TEXT NOT NULL,
      programme_id TEXT NOT NULL,
      batch_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'ENROLLED',
      enrolled_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS local_courses (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      version INTEGER NOT NULL DEFAULT 1,
      language TEXT NOT NULL DEFAULT 'hi',
      description TEXT NOT NULL DEFAULT '',
      synced_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS local_modules (
      id TEXT PRIMARY KEY,
      course_id TEXT NOT NULL,
      title TEXT NOT NULL,
      "order" INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS local_lessons (
      id TEXT PRIMARY KEY,
      module_id TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      content_uri TEXT NOT NULL,
      local_asset_ref TEXT,
      "order" INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS local_assessments (
      id TEXT PRIMARY KEY,
      course_id TEXT NOT NULL,
      title TEXT NOT NULL,
      passing_score INTEGER NOT NULL DEFAULT 70
    );

    CREATE TABLE IF NOT EXISTS local_questions (
      id TEXT PRIMARY KEY,
      assessment_id TEXT NOT NULL,
      type TEXT NOT NULL,
      prompt TEXT NOT NULL,
      options_json TEXT NOT NULL,
      correct_answer TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS local_attendance_records (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      trainee_id TEXT NOT NULL,
      node_id TEXT NOT NULL,
      method TEXT NOT NULL,
      result TEXT NOT NULL,
      confidence REAL,
      quality REAL,
      occurred_at TEXT NOT NULL,
      created_by TEXT NOT NULL,
      override_reason TEXT
    );

    CREATE TABLE IF NOT EXISTS local_progress_records (
      id TEXT PRIMARY KEY,
      trainee_id TEXT NOT NULL,
      lesson_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      value REAL NOT NULL,
      occurred_at TEXT NOT NULL,
      node_id TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS local_assessment_submissions (
      id TEXT PRIMARY KEY,
      assessment_id TEXT NOT NULL,
      trainee_id TEXT NOT NULL,
      answers_json TEXT NOT NULL,
      score INTEGER NOT NULL,
      passed INTEGER NOT NULL,
      occurred_at TEXT NOT NULL,
      node_id TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS local_event_journal (
      id TEXT PRIMARY KEY,
      node_id TEXT NOT NULL,
      aggregate_type TEXT NOT NULL,
      aggregate_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      schema_version INTEGER NOT NULL DEFAULT 1,
      occurred_at TEXT NOT NULL,
      logical_sequence INTEGER NOT NULL,
      hash TEXT NOT NULL,
      sync_status TEXT NOT NULL DEFAULT 'QUEUED',
      retry_count INTEGER NOT NULL DEFAULT 0,
      last_error TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS edge_node_state (
      node_id TEXT PRIMARY KEY,
      node_name TEXT NOT NULL,
      software_version TEXT NOT NULL,
      last_logical_sequence INTEGER NOT NULL DEFAULT 0,
      last_central_sequence INTEGER NOT NULL DEFAULT 0,
      wan_simulation_mode TEXT NOT NULL DEFAULT 'online',
      last_sync_at TEXT,
      health_status TEXT NOT NULL DEFAULT 'OFFLINE_READY',
      updated_at TEXT NOT NULL
    );
  `);

  seedEdgeDatabase(db);
  return db;
}

export function seedEdgeDatabase(db: DatabaseSync): void {
  const count = db.prepare('SELECT COUNT(*) as c FROM local_users').get() as { c: number };
  if (count && count.c > 0) {
    return; // already seeded
  }

  const now = new Date().toISOString();

  // 1. Seed provisioned users
  const insertUser = db.prepare(`
    INSERT INTO local_users (id, name, email_or_phone, role, institute_id, preferred_language, password_hash, active, synced_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
  `);

  for (const user of SEED_USERS) {
    insertUser.run(
      user.id,
      user.name,
      user.emailOrPhone,
      user.role,
      user.instituteId,
      user.preferredLanguage,
      user.passwordHash || 'argon2_mock_hash',
      now
    );
  }

  // 2. Seed Programme, Batch, Session
  db.prepare(`
    INSERT INTO local_programmes (id, institute_id, title, description, start_at, end_at, status, synced_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    SEED_PROGRAMME.id,
    SEED_PROGRAMME.instituteId,
    SEED_PROGRAMME.title,
    SEED_PROGRAMME.description,
    SEED_PROGRAMME.startAt,
    SEED_PROGRAMME.endAt,
    SEED_PROGRAMME.status,
    now
  );

  db.prepare(`
    INSERT INTO local_batches (id, programme_id, name, capacity, trainer_id, synced_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    SEED_BATCH.id,
    SEED_BATCH.programmeId,
    SEED_BATCH.name,
    SEED_BATCH.capacity,
    SEED_BATCH.trainerId,
    now
  );

  db.prepare(`
    INSERT INTO local_sessions (id, batch_id, title, starts_at, ends_at, attendance_policy_json, synced_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    SEED_SESSION.id,
    SEED_SESSION.batchId,
    SEED_SESSION.title,
    SEED_SESSION.startsAt,
    SEED_SESSION.endsAt,
    JSON.stringify(SEED_SESSION.attendancePolicy),
    now
  );

  // 3. Seed Enrollments
  const insertEnrollment = db.prepare(`
    INSERT INTO local_enrollments (id, trainee_id, programme_id, batch_id, status, enrolled_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  for (const enr of SEED_ENROLLMENTS) {
    insertEnrollment.run(enr.id, enr.traineeId, enr.programmeId, enr.batchId, enr.status, enr.enrolledAt);
  }

  // 4. Seed Course, Module, Lessons, Assessment, Questions
  db.prepare(`
    INSERT INTO local_courses (id, title, version, language, description, synced_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    SEED_COURSE.id,
    SEED_COURSE.title,
    SEED_COURSE.version,
    SEED_COURSE.language,
    SEED_COURSE.description,
    now
  );

  db.prepare(`
    INSERT INTO local_modules (id, course_id, title, "order")
    VALUES (?, ?, ?, ?)
  `).run(SEED_MODULE.id, SEED_MODULE.courseId, SEED_MODULE.title, SEED_MODULE.order);

  const insertLesson = db.prepare(`
    INSERT INTO local_lessons (id, module_id, type, title, content_uri, local_asset_ref, "order")
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  for (const l of SEED_LESSONS) {
    insertLesson.run(l.id, l.moduleId, l.type, l.title, l.contentUri, l.localAssetRef || null, l.order);
  }

  db.prepare(`
    INSERT INTO local_assessments (id, course_id, title, passing_score)
    VALUES (?, ?, ?, ?)
  `).run(SEED_ASSESSMENT.id, SEED_ASSESSMENT.courseId, SEED_ASSESSMENT.title, SEED_ASSESSMENT.passingScore);

  const insertQuestion = db.prepare(`
    INSERT INTO local_questions (id, assessment_id, type, prompt, options_json, correct_answer)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  for (const q of SEED_QUESTIONS) {
    insertQuestion.run(q.id, q.assessmentId, q.type, q.prompt, JSON.stringify(q.options), String(q.correctAnswer));
  }

  // 5. Seed Edge Node State
  db.prepare(`
    INSERT OR REPLACE INTO edge_node_state (
      node_id, node_name, software_version, last_logical_sequence, last_central_sequence,
      wan_simulation_mode, health_status, updated_at
    )
    VALUES (?, ?, '1.0.0', 0, 0, 'online', 'ONLINE_SYNCED', ?)
  `).run('edge-node-ricm-bhopal-01', 'RICM Bhopal Lab Edge Server 1', now);
}

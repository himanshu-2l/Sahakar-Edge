import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { buildEdgeServer } from '../apps/edge-server/dist/server.js';
import {
  SEED_USERS,
  SEED_SESSION,
  SEED_LESSONS,
  SEED_ASSESSMENT,
  SEED_QUESTIONS,
} from '../packages/test-fixtures/dist/index.js';

console.log('--- RUNNING SAHAKAR EDGE PHASE 3 INTEGRATION TESTS ---\n');

// 1. Initialize Edge Server in-memory
const app = await buildEdgeServer({ wanSimulationMode: 'offline' });

// ========================================================
// Test 1: Local Auth & Provisioned Identities
// ========================================================
console.log('Test 1: Local Offline Authentication (Provisioned Trainee & Trainer)...');
const traineeUser = SEED_USERS[3]; // Anita Patel
const trainerUser = SEED_USERS[2]; // Prof. Ramesh Sharma

const loginRes = await app.inject({
  method: 'POST',
  url: '/api/v1/auth/login',
  payload: { emailOrPhone: traineeUser.emailOrPhone },
});
assert.strictEqual(loginRes.statusCode, 200);
const loginData = JSON.parse(loginRes.body);
assert.ok(loginData.token);
assert.strictEqual(loginData.user.id, traineeUser.id);
assert.strictEqual(loginData.offlineProvisioned, true);
const traineeToken = `Bearer ${loginData.token}`;

// Non-provisioned user rejection
const nonProvRes = await app.inject({
  method: 'POST',
  url: '/api/v1/auth/login',
  payload: { emailOrPhone: 'unknown.user@stranger.org' },
});
assert.strictEqual(nonProvRes.statusCode, 401);
console.log('✓ Provisioned user authenticated offline; unknown user rejected.');

// ========================================================
// Test 2: Local Attendance Check-in & Event Journaling
// ========================================================
console.log('Test 2: Offline Attendance Check-in & Atomic Journaling...');
const attRes = await app.inject({
  method: 'POST',
  url: '/api/v1/attendance/events',
  headers: { authorization: traineeToken },
  payload: {
    sessionId: SEED_SESSION.id,
    traineeId: traineeUser.id,
    method: 'QR',
    result: 'PRESENT',
  },
});
assert.strictEqual(attRes.statusCode, 201);
const attData = JSON.parse(attRes.body);
assert.strictEqual(attData.success, true);
assert.strictEqual(attData.record.result, 'PRESENT');
assert.strictEqual(attData.event.aggregateType, 'ATTENDANCE');
assert.strictEqual(attData.event.logicalSequence, 1);
assert.ok(attData.event.hash.length > 0);
console.log('✓ Attendance recorded atomically in SQLite and appended to local event journal.');

// ========================================================
// Test 3: Trainer Override with Mandatory Audit Trail
// ========================================================
console.log('Test 3: Trainer Attendance Override with Audit Record...');
const trainerLoginRes = await app.inject({
  method: 'POST',
  url: '/api/v1/auth/login',
  payload: { emailOrPhone: trainerUser.emailOrPhone },
});
const trainerToken = `Bearer ${JSON.parse(trainerLoginRes.body).token}`;

// Query attendance roster
const rosterRes = await app.inject({
  method: 'GET',
  url: `/api/v1/sessions/${SEED_SESSION.id}/attendance`,
});
assert.strictEqual(rosterRes.statusCode, 200);
const attendanceRecords = JSON.parse(rosterRes.body).attendance;
assert.ok(attendanceRecords.length >= 1);
const recordToOverride = attendanceRecords[0];

// Execute override
const overrideRes = await app.inject({
  method: 'POST',
  url: `/api/v1/attendance/${recordToOverride.id}/override`,
  headers: { authorization: trainerToken },
  payload: {
    reason: 'Verified in-person presence; QR camera scanner glare issue',
    result: 'PRESENT',
  },
});
assert.strictEqual(overrideRes.statusCode, 200);
const overrideData = JSON.parse(overrideRes.body);
assert.strictEqual(overrideData.event.eventType, 'ATTENDANCE_OVERRIDDEN');
assert.strictEqual(overrideData.event.logicalSequence, 2);
console.log('✓ Trainer override recorded with required reason and journal audit event.');

// ========================================================
// Test 4: Offline Learning Progress Tracking
// ========================================================
console.log('Test 4: Local Learning Progress & Content Manifest...');
const manifestRes = await app.inject({
  method: 'GET',
  url: `/api/v1/courses/${SEED_LESSONS[0].moduleId}/content-manifest`,
});
// Course manifest route
const coursesRes = await app.inject({ method: 'GET', url: '/api/v1/courses' });
assert.strictEqual(coursesRes.statusCode, 200);
const courses = JSON.parse(coursesRes.body).courses;
assert.ok(courses.length > 0);

const courseManifestRes = await app.inject({
  method: 'GET',
  url: `/api/v1/courses/${courses[0].id}/content-manifest`,
});
assert.strictEqual(courseManifestRes.statusCode, 200);

// Record Lesson Progress
const progRes = await app.inject({
  method: 'POST',
  url: '/api/v1/progress/events',
  payload: {
    traineeId: traineeUser.id,
    lessonId: SEED_LESSONS[0].id,
    eventType: 'LESSON_COMPLETED',
    value: 1.0,
  },
});
assert.strictEqual(progRes.statusCode, 201);
const progData = JSON.parse(progRes.body);
assert.strictEqual(progData.event.eventType, 'PROGRESS_RECORDED');
assert.strictEqual(progData.event.logicalSequence, 3);

// Verify Progress API
const getProgRes = await app.inject({
  method: 'GET',
  url: `/api/v1/trainees/${traineeUser.id}/progress`,
});
assert.strictEqual(getProgRes.statusCode, 200);
const traineeProg = JSON.parse(getProgRes.body);
assert.strictEqual(traineeProg.completedCount, 1);
assert.strictEqual(traineeProg.progressPercentage, 50);
console.log('✓ Course manifest served locally; progress updated to 50% with journal sequence #3.');

// ========================================================
// Test 5: Offline Assessment & Instant Automated Grading
// ========================================================
console.log('Test 5: Offline Assessment Submission & Local Grading...');
const examAnswers: Record<string, string | number> = {
  [SEED_QUESTIONS[0].id]: SEED_QUESTIONS[0].correctAnswer,
  [SEED_QUESTIONS[1].id]: SEED_QUESTIONS[1].correctAnswer,
  [SEED_QUESTIONS[2].id]: SEED_QUESTIONS[2].correctAnswer,
};

const examRes = await app.inject({
  method: 'POST',
  url: `/api/v1/assessments/${SEED_ASSESSMENT.id}/submissions`,
  payload: {
    traineeId: traineeUser.id,
    answers: examAnswers,
  },
});
assert.strictEqual(examRes.statusCode, 201);
const examData = JSON.parse(examRes.body);
assert.strictEqual(examData.submission.score, 100);
assert.strictEqual(examData.submission.passed, true);
assert.strictEqual(examData.event.eventType, 'ASSESSMENT_SUBMITTED');
assert.strictEqual(examData.event.logicalSequence, 4);
console.log('✓ Exam graded locally with 100% score; ASSESSMENT_SUBMITTED event queued at sequence #4.');

// ========================================================
// Test 6: Health & Sync Queue Verification
// ========================================================
console.log('Test 6: Node Health & Sync Queue Telemetry...');
const healthRes = await app.inject({ method: 'GET', url: '/health' });
assert.strictEqual(healthRes.statusCode, 200);
const health = JSON.parse(healthRes.body);
assert.strictEqual(health.status, 'OFFLINE_READY');
assert.strictEqual(health.telemetry.queuedEventCount, 4);
assert.strictEqual(health.telemetry.networkState, 'OFFLINE');

const syncEventsRes = await app.inject({ method: 'GET', url: '/api/v1/sync/events' });
assert.strictEqual(syncEventsRes.statusCode, 200);
const queuedEvents = JSON.parse(syncEventsRes.body).events;
assert.strictEqual(queuedEvents.length, 4);
console.log('✓ Health telemetry reports OFFLINE_READY with 4 queued events waiting for WAN.');

// ========================================================
// Test 7: ACCEPTANCE CRITERIA — Survive WAN Loss & Restart
// ========================================================
console.log('Test 7: Edge Crash & Restart Resilience (SQLite WAL Persistence)...');
const tempDbFile = path.join(process.cwd(), 'temp_edge_resilience_test.sqlite');
if (fs.existsSync(tempDbFile)) fs.unlinkSync(tempDbFile);
if (fs.existsSync(`${tempDbFile}-wal`)) fs.unlinkSync(`${tempDbFile}-wal`);
if (fs.existsSync(`${tempDbFile}-shm`)) fs.unlinkSync(`${tempDbFile}-shm`);
try {
  // 1. Start edge instance A on disk
  const edgeA = await buildEdgeServer({ dbPath: tempDbFile, wanSimulationMode: 'offline' });
  
  // Record event on edgeA
  const eventARes = await edgeA.inject({
    method: 'POST',
    url: '/api/v1/attendance/events',
    payload: {
      sessionId: SEED_SESSION.id,
      traineeId: SEED_USERS[4].id, // Vikram Singh
      method: 'QR',
      result: 'PRESENT',
    },
  });
  assert.strictEqual(eventARes.statusCode, 201);
  const eventA = JSON.parse(eventARes.body).event;
  assert.strictEqual(eventA.logicalSequence, 1);

  // 2. Simulate sudden edge node crash / power loss / restart
  await edgeA.close();
  edgeA.db.close();

  // 3. Start edge instance B from same persisted SQLite WAL file
  const edgeB = await buildEdgeServer({ dbPath: tempDbFile, wanSimulationMode: 'offline' });
  
  // Verify state survived crash
  const healthB = await edgeB.inject({ method: 'GET', url: '/health' });
  const healthBData = JSON.parse(healthB.body);
  assert.strictEqual(healthBData.telemetry.queuedEventCount, 1);

  // Record next event on edgeB to verify monotonic sequence continuity
  const eventBRes = await edgeB.inject({
    method: 'POST',
    url: '/api/v1/progress/events',
    payload: {
      traineeId: SEED_USERS[4].id,
      lessonId: SEED_LESSONS[1].id,
      eventType: 'LESSON_COMPLETED',
      value: 1.0,
    },
  });
  assert.strictEqual(eventBRes.statusCode, 201);
  const eventB = JSON.parse(eventBRes.body).event;
  // Sequence must continue strictly from previous max sequence #1 -> #2
  assert.strictEqual(eventB.logicalSequence, 2);

  await edgeB.close();
  edgeB.db.close();
  console.log('✓ Edge node successfully survived crash and restart with zero data loss.');
  console.log('✓ Monotonic sequence continuity verified across restarts (#1 -> #2).');
} finally {
  // Clean up temporary database files
  try {
    if (fs.existsSync(tempDbFile)) fs.unlinkSync(tempDbFile);
    if (fs.existsSync(`${tempDbFile}-wal`)) fs.unlinkSync(`${tempDbFile}-wal`);
    if (fs.existsSync(`${tempDbFile}-shm`)) fs.unlinkSync(`${tempDbFile}-shm`);
  } catch (cleanupErr) {
    // Windows file handle release grace
  }
}

console.log('\n=== ALL PHASE 3 INTEGRATION TESTS PASSED SUCCESSFULLY! ===\n');
process.exit(0);

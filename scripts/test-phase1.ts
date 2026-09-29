import assert from 'node:assert';
import { buildCentralServer } from '../apps/central-api/dist/server.js';
import { SEED_INSTITUTE_RICM_BHOPAL, SEED_USERS } from '../packages/test-fixtures/dist/index.js';

console.log('--- RUNNING SAHAKAR EDGE PHASE 1 INTEGRATION TESTS ---');

const app = await buildCentralServer();

// 1. Auth & Login
console.log('Test 1: Admin Authentication & Token Generation...');
const loginRes = await app.inject({
  method: 'POST',
  url: '/api/v1/auth/login',
  payload: {
    emailOrPhone: 'superadmin@ncct.gov.in',
    password: 'password123',
  },
});
assert.strictEqual(loginRes.statusCode, 200);
const loginData = JSON.parse(loginRes.body);
assert.ok(loginData.token);
assert.strictEqual(loginData.user.role, 'SUPER_ADMIN');
const adminToken = `Bearer ${loginData.token}`;
console.log('✓ Admin login successful. Token acquired.');

// 2. Trainee Login
const traineeLoginRes = await app.inject({
  method: 'POST',
  url: '/api/v1/auth/login',
  payload: {
    emailOrPhone: 'anita.patel@rural.org',
    password: 'password123',
  },
});
assert.strictEqual(traineeLoginRes.statusCode, 200);
const traineeToken = `Bearer ${JSON.parse(traineeLoginRes.body).token}`;

// 3. User info via /me
console.log('Test 2: Authenticated /me endpoint...');
const meRes = await app.inject({
  method: 'GET',
  url: '/api/v1/me',
  headers: { authorization: adminToken },
});
assert.strictEqual(meRes.statusCode, 200);
assert.strictEqual(JSON.parse(meRes.body).user.emailOrPhone, 'superadmin@ncct.gov.in');
console.log('✓ Authenticated identity verified.');

// 4. Institutes List & Creation
console.log('Test 3: Institute Management...');
const institutesRes = await app.inject({
  method: 'GET',
  url: '/api/v1/institutes',
});
assert.strictEqual(institutesRes.statusCode, 200);
const institutes = JSON.parse(institutesRes.body).institutes;
assert.ok(institutes.length >= 2);

const createInstRes = await app.inject({
  method: 'POST',
  url: '/api/v1/institutes',
  headers: { authorization: adminToken },
  payload: {
    name: 'Institute of Cooperative Management (ICM), Lucknow',
    code: 'ICM-LKO',
    type: 'ICM',
    locationText: 'Lucknow, Uttar Pradesh',
  },
});
assert.strictEqual(createInstRes.statusCode, 201);
const createdInst = JSON.parse(createInstRes.body).institute;
assert.strictEqual(createdInst.code, 'ICM-LKO');
console.log('✓ Institute creation verified.');

// 5. Programme, Batch & Session Lifecycle
console.log('Test 4: Programme & Batch Lifecycle...');
const createProgRes = await app.inject({
  method: 'POST',
  url: '/api/v1/programmes',
  headers: { authorization: adminToken },
  payload: {
    instituteId: SEED_INSTITUTE_RICM_BHOPAL.id,
    title: 'Diploma in Rural Cooperative Credit & PACS Audit',
    description: 'Specialized certificate for cooperative banking professionals.',
    startAt: '2026-10-01T09:00:00.000Z',
    endAt: '2026-11-30T17:00:00.000Z',
    status: 'ACTIVE',
  },
});
assert.strictEqual(createProgRes.statusCode, 201);
const newProg = JSON.parse(createProgRes.body).programme;
assert.strictEqual(newProg.title, 'Diploma in Rural Cooperative Credit & PACS Audit');

// Create Batch
const createBatchRes = await app.inject({
  method: 'POST',
  url: '/api/v1/batches',
  headers: { authorization: adminToken },
  payload: {
    programmeId: newProg.id,
    name: 'Cohort 2026-B1',
    capacity: 25,
    trainerId: 'cccc3333-3333-3333-3333-333333333333',
  },
});
assert.strictEqual(createBatchRes.statusCode, 201);
const newBatch = JSON.parse(createBatchRes.body).batch;
assert.strictEqual(newBatch.programmeId, newProg.id);

// Create Session
const createSessionRes = await app.inject({
  method: 'POST',
  url: '/api/v1/sessions',
  headers: { authorization: adminToken },
  payload: {
    batchId: newBatch.id,
    title: 'Session 1: NABARD PACS Audit Guidelines',
    startsAt: '2026-10-02T10:00:00.000Z',
    endsAt: '2026-10-02T12:00:00.000Z',
    attendancePolicy: { minDurationMinutes: 45 },
  },
});
assert.strictEqual(createSessionRes.statusCode, 201);
const newSession = JSON.parse(createSessionRes.body).session;

// Start Session
const startSessionRes = await app.inject({
  method: 'POST',
  url: `/api/v1/sessions/${newSession.id}/start`,
  headers: { authorization: adminToken },
});
assert.strictEqual(startSessionRes.statusCode, 200);
assert.strictEqual(JSON.parse(startSessionRes.body).status, 'STARTED');
console.log('✓ Programme, batch & session lifecycle verified.');

// 6. Acceptance Criteria: Trainee Enrollment Assignment
console.log('Test 5: Trainee Enrollment Assignment (Acceptance Criteria)...');
const traineeId = SEED_USERS[3].id; // Anita Patel
const enrollRes = await app.inject({
  method: 'POST',
  url: `/api/v1/programmes/${newProg.id}/enrollments`,
  headers: { authorization: adminToken },
  payload: {
    traineeId,
    batchId: newBatch.id,
  },
});
assert.strictEqual(enrollRes.statusCode, 201);
const enrollment = JSON.parse(enrollRes.body).enrollment;
assert.strictEqual(enrollment.traineeId, traineeId);
assert.strictEqual(enrollment.batchId, newBatch.id);

// Verify Enrollment in Programme Roster
const rosterRes = await app.inject({
  method: 'GET',
  url: `/api/v1/programmes/${newProg.id}/enrollments`,
});
assert.strictEqual(rosterRes.statusCode, 200);
const roster = JSON.parse(rosterRes.body).enrollments;
assert.strictEqual(roster.length, 1);
assert.strictEqual(roster[0].trainee.id, traineeId);
console.log('✓ Admin successfully created complete programme and assigned trainee.');

// 7. Course Manifest Provisioning
console.log('Test 6: Course Manifest for Edge Provisioning...');
const coursesRes = await app.inject({
  method: 'GET',
  url: '/api/v1/courses',
});
assert.strictEqual(coursesRes.statusCode, 200);
const firstCourse = JSON.parse(coursesRes.body).courses[0];

const manifestRes = await app.inject({
  method: 'GET',
  url: `/api/v1/courses/${firstCourse.id}/content-manifest`,
});
assert.strictEqual(manifestRes.statusCode, 200);
const manifest = JSON.parse(manifestRes.body).manifest;
assert.ok(manifest.modules.length > 0);
assert.ok(manifest.modules[0].lessons.length > 0);
assert.ok(manifest.assessment);
console.log('✓ Course manifest complete with modules, lessons, and assessment questions.');

// 8. RBAC Guard Enforcement: Trainee cannot create programme
console.log('Test 7: RBAC Security Guard Enforcement...');
const unauthorizedCreateRes = await app.inject({
  method: 'POST',
  url: '/api/v1/programmes',
  headers: { authorization: traineeToken },
  payload: {
    instituteId: SEED_INSTITUTE_RICM_BHOPAL.id,
    title: 'Unauthorized Programme Attempt',
    startAt: '2026-10-01T09:00:00.000Z',
    endAt: '2026-10-31T17:00:00.000Z',
  },
});
assert.strictEqual(unauthorizedCreateRes.statusCode, 403);
const forbiddenBody = JSON.parse(unauthorizedCreateRes.body);
assert.strictEqual(forbiddenBody.error, 'FORBIDDEN');
console.log('✓ Trainee forbidden from programme creation (HTTP 403 verified).');

console.log('=== ALL PHASE 1 INTEGRATION TESTS PASSED SUCCESSFULLY! ===');
process.exit(0);

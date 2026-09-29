import assert from 'node:assert';
import { buildCentralServer } from '../apps/central-api/dist/server.js';
import { buildEdgeServer } from '../apps/edge-server/dist/server.js';
import { EdgeSyncClient } from '../apps/edge-server/dist/services/sync-client.js';
import {
  SEED_USERS,
  SEED_SESSION,
  SEED_LESSONS,
  SEED_ASSESSMENT,
  SEED_QUESTIONS,
} from '../packages/test-fixtures/dist/index.js';
import { calculateEventHash, createSyncEvent } from '../packages/sync-protocol/dist/index.js';

console.log('--- RUNNING SAHAKAR EDGE PHASE 4 INTEGRATION TESTS (Offline Sync Engine) ---\n');

// 1. Build Central Server and Edge Server
const centralApp = await buildCentralServer();
const edgeApp = await buildEdgeServer({ wanSimulationMode: 'online' });

// 2. Wire EdgeSyncClient to inject directly into Central API
const syncClient = new EdgeSyncClient(
  {
    centralApiUrl: 'http://central-api.local',
    nodeId: edgeApp.nodeId,
    instituteId: '11111111-1111-1111-1111-111111111111',
  },
  edgeApp.journalService,
  async (url, options) => {
    const route = url.replace('http://central-api.local', '');
    const res = await centralApp.inject({
      method: (options.method as any) || 'POST',
      url: route,
      payload: options.body,
    });
    return {
      status: res.statusCode,
      json: async () => JSON.parse(res.body),
    };
  }
);

// ========================================================
// Test 1: Sync Handshake
// ========================================================
console.log('Test 1: Edge-to-Central Authentication & Sync Handshake...');
const handshakeRes = await syncClient.handshake();
assert.strictEqual(handshakeRes.accepted, true);
assert.strictEqual(typeof handshakeRes.centralSequence, 'number');

// Verify node registered centrally
const nodeStatusRes = await centralApp.inject({
  method: 'GET',
  url: `/api/v1/sync/status/${edgeApp.nodeId}`,
});
assert.strictEqual(nodeStatusRes.statusCode, 200);
const nodeData = JSON.parse(nodeStatusRes.body).node;
assert.strictEqual(nodeData.nodeId, edgeApp.nodeId);
console.log('✓ Handshake completed; Edge node registered in central fleet registry.');

// ========================================================
// Test 2: Generate Offline Events on Edge Server
// ========================================================
console.log('Test 2: Generating Local Domain Events while Offline...');
const traineeUser = SEED_USERS[3]; // Anita Patel

// Event 1: Attendance
const attRes = await edgeApp.inject({
  method: 'POST',
  url: '/api/v1/attendance/events',
  payload: {
    sessionId: SEED_SESSION.id,
    traineeId: traineeUser.id,
    method: 'QR',
    result: 'PRESENT',
  },
});
assert.strictEqual(attRes.statusCode, 201);

// Event 2: Lesson Progress
const progRes = await edgeApp.inject({
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

// Event 3: Assessment Submission (100% Score)
const examRes = await edgeApp.inject({
  method: 'POST',
  url: `/api/v1/assessments/${SEED_ASSESSMENT.id}/submissions`,
  payload: {
    traineeId: traineeUser.id,
    answers: {
      [SEED_QUESTIONS[0].id]: SEED_QUESTIONS[0].correctAnswer,
      [SEED_QUESTIONS[1].id]: SEED_QUESTIONS[1].correctAnswer,
      [SEED_QUESTIONS[2].id]: SEED_QUESTIONS[2].correctAnswer,
    },
  },
});
assert.strictEqual(examRes.statusCode, 201);

// Verify edge queue has 3 events
const initialQueue = edgeApp.journalService.getQueuedEvents();
assert.strictEqual(initialQueue.length, 3);
console.log('✓ 3 local domain events successfully queued in SQLite journal.');

// ========================================================
// Test 3: Batch Upload & Idempotent Ingestion
// ========================================================
console.log('Test 3: Reconnect & Batch Ingestion to Central API...');
const syncBatchResult = await syncClient.syncBatch();
assert.strictEqual(syncBatchResult.success, true);
assert.strictEqual(syncBatchResult.acceptedCount, 3);
assert.strictEqual(syncBatchResult.rejectedCount, 0);
assert.strictEqual(syncBatchResult.remainingQueued, 0);

// Verify Edge SQLite marked events as SYNCED
const remainingQueue = edgeApp.journalService.getQueuedEvents();
assert.strictEqual(remainingQueue.length, 0);
console.log('✓ All 3 events ingested centrally; marked SYNCED in edge SQLite.');

// ========================================================
// Test 4: Central Visibility of Synced Business State
// ========================================================
console.log('Test 4: Central Verification of Synced Business Evidence...');

// 1. Central Attendance
const centralAttRes = await centralApp.inject({
  method: 'GET',
  url: `/api/v1/sessions/${SEED_SESSION.id}/attendance`,
});
assert.strictEqual(centralAttRes.statusCode, 200);
const centralAtt = JSON.parse(centralAttRes.body).attendance;
assert.ok(centralAtt.length >= 1);
assert.strictEqual(centralAtt[0].traineeId, traineeUser.id);
assert.strictEqual(centralAtt[0].result, 'PRESENT');

// 2. Central Progress
const centralProgRes = await centralApp.inject({
  method: 'GET',
  url: `/api/v1/trainees/${traineeUser.id}/progress`,
});
assert.strictEqual(centralProgRes.statusCode, 200);
const centralProg = JSON.parse(centralProgRes.body);
assert.strictEqual(centralProg.completedCount, 1);
assert.ok(centralProg.completedLessons.includes(SEED_LESSONS[0].id));

// 3. Central Assessment Submission
const centralExamRes = await centralApp.inject({
  method: 'GET',
  url: `/api/v1/assessments/submissions?traineeId=${traineeUser.id}`,
});
assert.strictEqual(centralExamRes.statusCode, 200);
const centralSubmissions = JSON.parse(centralExamRes.body).submissions;
assert.strictEqual(centralSubmissions.length, 1);
assert.strictEqual(centralSubmissions[0].score, 100);
assert.strictEqual(centralSubmissions[0].passed, true);
console.log('✓ Synced attendance, progress, and assessment records verified centrally.');

// ========================================================
// Test 5: ACCEPTANCE CRITERIA — Exactly-Once Idempotency
// ========================================================
console.log('Test 5: Idempotent Deduplication (Re-upload exact same events)...');
// Force-feed the same 3 events to simulate duplicate delivery / network retry
const duplicateIngestRes = await centralApp.inject({
  method: 'POST',
  url: '/api/v1/sync/events',
  payload: {
    nodeId: edgeApp.nodeId,
    events: initialQueue, // exact duplicate events
  },
});
assert.strictEqual(duplicateIngestRes.statusCode, 200);
const duplicateData = JSON.parse(duplicateIngestRes.body);
// Central acknowledges all duplicate events as accepted
assert.strictEqual(duplicateData.accepted.length, 3);
assert.strictEqual(duplicateData.rejected.length, 0);

// Verify records are NOT duplicated centrally
const verifyAttAgain = await centralApp.inject({
  method: 'GET',
  url: `/api/v1/sessions/${SEED_SESSION.id}/attendance`,
});
const attRecordsCount = JSON.parse(verifyAttAgain.body).attendance.length;
assert.strictEqual(attRecordsCount, 1); // must remain exactly 1, not 2

const verifySubAgain = await centralApp.inject({
  method: 'GET',
  url: `/api/v1/assessments/submissions?traineeId=${traineeUser.id}`,
});
const subCount = JSON.parse(verifySubAgain.body).submissions.length;
assert.strictEqual(subCount, 1); // must remain exactly 1
console.log('✓ Idempotency verified: Duplicate sync re-upload acknowledged without duplicate records.');

// ========================================================
// Test 6: Tamper Rejection via SHA-256 Event Hash
// ========================================================
console.log('Test 6: Tampered / Malformed Event Rejection...');
const tamperedEvent = createSyncEvent({
  id: '00000000-0000-0000-0000-999999999999',
  nodeId: edgeApp.nodeId,
  aggregateType: 'ATTENDANCE',
  aggregateId: SEED_SESSION.id,
  eventType: 'ATTENDANCE_RECORDED',
  payload: { traineeId: 'malicious-actor', result: 'PRESENT' },
  logicalSequence: 999,
});
// Tamper with payload without updating hash
(tamperedEvent.payload as any).traineeId = 'counterfeit-identity';

const tamperRes = await centralApp.inject({
  method: 'POST',
  url: '/api/v1/sync/events',
  payload: {
    nodeId: edgeApp.nodeId,
    events: [tamperedEvent],
  },
});
assert.strictEqual(tamperRes.statusCode, 200);
const tamperData = JSON.parse(tamperRes.body);
assert.strictEqual(tamperData.accepted.length, 0);
assert.strictEqual(tamperData.rejected.length, 1);
assert.strictEqual(tamperData.rejected[0].reason, 'HASH_MISMATCH');
console.log('✓ Tampered event rejected with HASH_MISMATCH reason.');

// ========================================================
// Test 7: Central Sync Monitor Statistics
// ========================================================
console.log('Test 7: Central Admin Sync Monitor Telemetry...');
const statsRes = await centralApp.inject({ method: 'GET', url: '/api/v1/sync/stats' });
assert.strictEqual(statsRes.statusCode, 200);
const stats = JSON.parse(statsRes.body);
assert.ok(stats.totalIngestedEvents >= 3);
assert.strictEqual(stats.registeredNodesCount, 1);
console.log('✓ Central sync monitor telemetry accurately reports fleet statistics.');

console.log('\n=== ALL PHASE 4 INTEGRATION TESTS PASSED SUCCESSFULLY! ===\n');
process.exit(0);

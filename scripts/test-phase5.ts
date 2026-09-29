import assert from 'node:assert';
import { buildEdgeServer } from '../apps/edge-server/dist/server.js';
import { SEED_USERS, SEED_SESSION } from '../packages/test-fixtures/dist/index.js';

console.log('--- RUNNING SAHAKAR EDGE PHASE 5 INTEGRATION TESTS (Attendance Adapters) ---\n');

// 1. Build Edge Server in offline mode
const edgeApp = await buildEdgeServer({ wanSimulationMode: 'offline' });

const trainee1 = SEED_USERS[3]; // Anita Patel
const trainee2 = SEED_USERS[4]; // Vikram Singh
const trainer = SEED_USERS[2];  // Prof. Ramesh Sharma

// ========================================================
// Test 1: Hardware Providers Health Status
// ========================================================
console.log('Test 1: Hardware Attendance Providers Discovery & Health...');
const healthRes = await edgeApp.inject({
  method: 'GET',
  url: '/api/v1/attendance/providers/health',
});
assert.strictEqual(healthRes.statusCode, 200);
const providersHealth = JSON.parse(healthRes.body).providers;
assert.ok(providersHealth.length >= 2);
assert.ok(providersHealth.some((p: any) => p.providerName === 'SimulatedBiometricProvider' && p.status === 'HEALTHY'));
assert.ok(providersHealth.some((p: any) => p.providerName === 'QrAttendanceProvider' && p.status === 'HEALTHY'));
console.log('✓ Hardware adapters registered and healthy (Simulated Biometric + Session QR).');

// ========================================================
// Test 2: Offline Simulated Biometric Attendance Capture
// ========================================================
console.log('Test 2: Offline Simulated Biometric Face Verification...');
const simCaptureRes = await edgeApp.inject({
  method: 'POST',
  url: '/api/v1/attendance/capture',
  payload: {
    sessionId: SEED_SESSION.id,
    method: 'SIMULATED_FACE',
    traineeId: trainee1.id,
  },
});
assert.strictEqual(simCaptureRes.statusCode, 201);
const simData = JSON.parse(simCaptureRes.body);
assert.strictEqual(simData.success, true);
assert.strictEqual(simData.evidence.verified, true);
assert.strictEqual(simData.evidence.traineeId, trainee1.id);
assert.ok(simData.evidence.confidence >= 0.95);
assert.strictEqual(simData.event.aggregateType, 'ATTENDANCE');
assert.strictEqual(simData.event.eventType, 'ATTENDANCE_RECORDED');
console.log('✓ Biometric face capture processed offline; confidence score >= 0.95 logged.');

// ========================================================
// Test 3: Offline Session QR Code Attendance Capture
// ========================================================
console.log('Test 3: Offline Dynamic Session QR Verification...');
const qrPayload = JSON.stringify({
  traineeId: trainee2.id,
  sessionId: SEED_SESSION.id,
  token: 'dynamic_qr_session_tok_99182',
});

const qrCaptureRes = await edgeApp.inject({
  method: 'POST',
  url: '/api/v1/attendance/capture',
  payload: {
    sessionId: SEED_SESSION.id,
    method: 'QR',
    rawPayload: qrPayload,
  },
});
assert.strictEqual(qrCaptureRes.statusCode, 201);
const qrData = JSON.parse(qrCaptureRes.body);
assert.strictEqual(qrData.success, true);
assert.strictEqual(qrData.evidence.verified, true);
assert.strictEqual(qrData.evidence.traineeId, trainee2.id);
assert.strictEqual(qrData.evidence.confidence, 1.0);
console.log('✓ Session QR scanned and verified offline with 100% confidence.');

// ========================================================
// Test 4: Trainee Roster Review by Trainer
// ========================================================
console.log('Test 4: Trainer Review of Session Attendance Roster...');
const rosterRes = await edgeApp.inject({
  method: 'GET',
  url: `/api/v1/sessions/${SEED_SESSION.id}/attendance`,
});
assert.strictEqual(rosterRes.statusCode, 200);
const roster = JSON.parse(rosterRes.body).attendance;
assert.strictEqual(roster.length, 2);
assert.ok(roster.some((r: any) => r.trainee_id === trainee1.id));
assert.ok(roster.some((r: any) => r.trainee_id === trainee2.id));
console.log('✓ Trainer successfully retrieved offline roster showing both verified trainees.');

// ========================================================
// Test 5: Manual Override with Mandatory Audit Trail
// ========================================================
console.log('Test 5: Trainer Manual Review & Override Audit Trail...');
// Trainer login
const trainerLoginRes = await edgeApp.inject({
  method: 'POST',
  url: '/api/v1/auth/login',
  payload: { emailOrPhone: trainer.emailOrPhone },
});
const trainerToken = `Bearer ${JSON.parse(trainerLoginRes.body).token}`;

// Override trainee2 result to EXCUSED
const targetRecord = roster.find((r: any) => r.trainee_id === trainee2.id);
const overrideRes = await edgeApp.inject({
  method: 'POST',
  url: `/api/v1/attendance/${targetRecord.id}/override`,
  headers: { authorization: trainerToken },
  payload: {
    reason: 'Trainee was dispatched for mandatory PACS audit field duty by RICM Director',
    result: 'EXCUSED',
  },
});
assert.strictEqual(overrideRes.statusCode, 200);
const overrideData = JSON.parse(overrideRes.body);
assert.strictEqual(overrideData.success, true);
assert.strictEqual(overrideData.record.newResult, 'EXCUSED');
assert.strictEqual(overrideData.event.eventType, 'ATTENDANCE_OVERRIDDEN');
console.log('✓ Manual override committed with statutory justification and audit event.');

// ========================================================
// Test 6: Rejection of Invalid / Missing Capture Payload
// ========================================================
console.log('Test 6: Invalid Capture Input Handling...');
const invalidCaptureRes = await edgeApp.inject({
  method: 'POST',
  url: '/api/v1/attendance/capture',
  payload: {
    sessionId: SEED_SESSION.id,
    method: 'QR',
    rawPayload: '', // empty QR
  },
});
assert.strictEqual(invalidCaptureRes.statusCode, 422);
console.log('✓ Invalid capture correctly rejected with HTTP 422 Unprocessable Entity.');

// ========================================================
// Test 7: ACCEPTANCE CRITERIA — Full Offline Operation
// ========================================================
console.log('Test 7: Verification of Complete Offline Attendance Operation...');
const stats = edgeApp.journalService.getStats();
// 2 captures + 1 override = 3 events queued in SQLite journal
assert.strictEqual(stats.queuedCount, 3);
console.log(`✓ All 3 attendance operations executed and queued locally in SQLite (Queue size: ${stats.queuedCount}).`);

console.log('\n=== ALL PHASE 5 INTEGRATION TESTS PASSED SUCCESSFULLY! ===\n');
process.exit(0);

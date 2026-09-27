import assert from 'node:assert';
import { UserRole, hasPermission } from '../packages/types/dist/index.js';
import {
  canonicalJsonStringify,
  calculateEventHash,
  verifyEventHash,
  createSyncEvent,
  getConflictStrategyForAggregate,
  ConflictStrategy,
} from '../packages/sync-protocol/dist/index.js';
import {
  generateIssuerKeyPair,
  signCredentialPayload,
  verifyCredentialSignature,
  createQrVerificationPayload,
} from '../packages/credential-core/dist/index.js';
import {
  SimulatedAttendanceProvider,
  QrAttendanceProvider,
} from '../packages/hardware-adapters/dist/index.js';
import {
  SEED_USERS,
  SEED_PROGRAMME,
  SEED_INSTITUTES,
} from '../packages/test-fixtures/dist/index.js';

console.log('--- RUNNING SAHAKAR EDGE PHASE 0 VERIFICATION TESTS ---');

// 1. RBAC Permissions Matrix
console.log('Test 1: RBAC Permission Verification...');
assert.strictEqual(hasPermission(UserRole.SUPER_ADMIN, 'manage:institutes'), true);
assert.strictEqual(hasPermission(UserRole.SUPER_ADMIN, 'issue:credentials'), true);
assert.strictEqual(hasPermission(UserRole.INSTITUTE_ADMIN, 'manage:institutes'), false);
assert.strictEqual(hasPermission(UserRole.INSTITUTE_ADMIN, 'manage:programmes'), true);
assert.strictEqual(hasPermission(UserRole.TRAINER, 'record:attendance'), true);
assert.strictEqual(hasPermission(UserRole.TRAINER, 'manage:programmes'), false);
assert.strictEqual(hasPermission(UserRole.TRAINEE, 'take:assessments'), true);
assert.strictEqual(hasPermission(UserRole.TRAINEE, 'manage:sessions'), false);
assert.strictEqual(hasPermission(UserRole.EMPLOYER, 'manage:jobs'), true);
assert.strictEqual(hasPermission(UserRole.EMPLOYER, 'record:attendance'), false);
console.log('✓ RBAC Permissions Matrix Verified across all 5 roles.');

// 2. Canonical JSON & SHA-256 Hashing
console.log('Test 2: Canonical JSON & Deterministic Hashing...');
const objA = { b: 2, a: 1, nested: { y: 20, x: 10 } };
const objB = { a: 1, nested: { x: 10, y: 20 }, b: 2 };
assert.strictEqual(canonicalJsonStringify(objA), canonicalJsonStringify(objB));

const hash1 = calculateEventHash('ATTENDANCE', 'session-1', 'ATTENDANCE_RECORDED', { traineeId: 't-1' }, 100);
const hash2 = calculateEventHash('ATTENDANCE', 'session-1', 'ATTENDANCE_RECORDED', { traineeId: 't-1' }, 100);
assert.strictEqual(hash1, hash2);
console.log('✓ Canonical serialization & deterministic hashing verified.');

// 3. Sync Event Creation & Tamper Detection
console.log('Test 3: Sync Protocol Event Creation & Integrity...');
const event = createSyncEvent({
  id: '00000000-0000-0000-0000-000000000001',
  nodeId: 'edge-node-ricm-01',
  aggregateType: 'ATTENDANCE',
  aggregateId: 'session-1',
  eventType: 'ATTENDANCE_RECORDED',
  payload: { traineeId: 'trainee-123', result: 'PRESENT' },
  logicalSequence: 1,
});

assert.strictEqual(verifyEventHash(event), true);

// Tamper payload to verify detection
const tamperedEvent = { ...event, payload: { traineeId: 'trainee-123', result: 'ABSENT' } };
assert.strictEqual(verifyEventHash(tamperedEvent), false);

assert.strictEqual(getConflictStrategyForAggregate('ATTENDANCE'), ConflictStrategy.APPEND_MERGE);
assert.strictEqual(getConflictStrategyForAggregate('SESSION'), ConflictStrategy.CENTRAL_WINS);
console.log('✓ Sync Event creation, verification & tamper detection verified.');

// 4. Ed25519 Digital Credential Signing & Verification
console.log('Test 4: Ed25519 Credential Signing, Verification & Tamper Rejection...');
const keyPair = generateIssuerKeyPair('ncct-master-key-01');
const payload = {
  credentialId: 'cred-pacs-2026-0001',
  issuer: {
    id: 'issuer-ncct',
    name: 'National Council for Cooperative Training',
    instituteId: SEED_INSTITUTES[0].id,
  },
  recipient: {
    traineeId: SEED_USERS[3].id,
    name: SEED_USERS[3].name,
  },
  programme: {
    id: SEED_PROGRAMME.id,
    title: SEED_PROGRAMME.title,
  },
  skillsSummary: [
    { skillCode: 'PACS_ACCOUNTING', skillName: 'PACS Double-Entry Accounting', level: 2 },
  ],
  issuedAt: '2026-09-28T04:00:00.000Z',
  expiresAt: null,
  schemaVersion: 1,
};

const { signatureHex, credential } = signCredentialPayload(payload, keyPair.privateKeyPem, keyPair.keyId);
assert.ok(signatureHex.length > 64);
assert.strictEqual(credential.status, 'ACTIVE');

const isValid = verifyCredentialSignature(payload, signatureHex, keyPair.publicKeyPem);
assert.strictEqual(isValid, true);

// Tampered payload verification failure
const tamperedPayload = { ...payload, recipient: { ...payload.recipient, name: 'Imposter Candidate' } };
const isTamperedValid = verifyCredentialSignature(tamperedPayload, signatureHex, keyPair.publicKeyPem);
assert.strictEqual(isTamperedValid, false);

const { verificationUrl, compactPayload } = createQrVerificationPayload(credential);
assert.ok(verificationUrl.includes(credential.id));
assert.ok(compactPayload.length > 0);
console.log('✓ Ed25519 cryptographic credential generation and verification verified.');

// 5. Hardware Adapters (Simulated & QR)
console.log('Test 5: Hardware Adapters Simulation...');
async function testAdapters() {
  const sim = new SimulatedAttendanceProvider();
  await sim.initialize();
  const simEvidence = await sim.capture({
    sessionId: 'session-1',
    nodeId: 'node-1',
    traineeId: SEED_USERS[3].id,
    actorId: SEED_USERS[2].id,
  });
  assert.strictEqual(simEvidence.verified, true);
  assert.strictEqual(simEvidence.result, 'PRESENT');

  const qr = new QrAttendanceProvider();
  await qr.initialize();
  const qrEvidence = await qr.capture({
    sessionId: 'session-1',
    nodeId: 'node-1',
    rawPayload: JSON.stringify({ traineeId: SEED_USERS[3].id, sessionId: 'session-1' }),
    actorId: SEED_USERS[2].id,
  });
  assert.strictEqual(qrEvidence.verified, true);
  assert.strictEqual(qrEvidence.traineeId, SEED_USERS[3].id);
  console.log('✓ Hardware adapters capture and fallback verified.');
}

await testAdapters();

console.log('=== ALL PHASE 0 VERIFICATION TESTS PASSED SUCCESSFULLY! ===');

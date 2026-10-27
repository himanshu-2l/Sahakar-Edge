import assert from 'node:assert';
import { createHash } from 'node:crypto';
import {
  SEED_ORAL_ASSESSMENT,
  SEED_ORAL_QUESTIONS,
  SEED_USERS,
} from '../packages/test-fixtures/dist/index.js';
import {
  SyncEventType,
  SyncStatus,
} from '../packages/types/dist/index.js';
import type {
  OralQuestion,
  OralAssessmentResult,
} from '../packages/types/dist/index.js';
import {
  canonicalJsonStringify,
  calculateEventHash,
  verifyEventHash,
  sha256Hex,
} from '../packages/sync-protocol/dist/index.js';
import {
  offlineStore,
  evaluateOralQuestion,
} from '../apps/trainee-pwa/src/services/offline-store.ts';
import { speechService } from '../apps/trainee-pwa/src/services/speech-service.ts';
import { centralStore } from '../apps/central-api/dist/store/memory-store.js';

console.log('========================================================================');
console.log('   SAHAKAR EDGE — MILESTONE 2: ORAL VIVA ASSESSMENT PLAYER TEST SUITE   ');
console.log('========================================================================\n');

// -----------------------------------------------------------------------------
// [Test 1] Seed Oral Viva Questions Roster & Taxonomy Verification
// -----------------------------------------------------------------------------
console.log('>>> [Test 1] Verifying Seed Oral Viva Questions & Taxonomy...');
assert.strictEqual(SEED_ORAL_QUESTIONS.length, 3, 'Must have exactly 3 core cooperative oral questions');

// Q1: Daybook & Cashbook balancing
const q1 = SEED_ORAL_QUESTIONS.find((q) => q.id === 'oral-q-01-daybook-balancing');
assert(q1, 'Q1: Daybook balancing question must exist');
assert(q1.prompt.toLowerCase().includes('daybook'), 'Q1 prompt must mention Daybook');
assert(q1.prompt.toLowerCase().includes('cashbook'), 'Q1 prompt must mention Cashbook');
assert(q1.promptHi.includes('रोजनामचा'), 'Q1 Hindi prompt must include रोजनामचा');
assert(q1.expectedKeywords.includes('daybook'), 'Q1 expected keywords must include daybook');
assert(q1.expectedKeywords.includes('vault cash'), 'Q1 expected keywords must include vault cash');
assert(q1.expectedKeywordsHi.includes('तिजोरी'), 'Q1 Hindi keywords must include तिजोरी');

// Q2: Short-Term Crop Loan disbursement
const q2 = SEED_ORAL_QUESTIONS.find((q) => q.id === 'oral-q-02-crop-loan-disbursement');
assert(q2, 'Q2: Crop loan disbursement question must exist');
assert(q2.prompt.toLowerCase().includes('crop loan'), 'Q2 prompt must mention Crop Loan');
assert(q2.promptHi.includes('फसल ऋण'), 'Q2 Hindi prompt must include फसल ऋण');
assert(q2.expectedKeywords.includes('debit'), 'Q2 expected keywords must include debit');
assert(q2.expectedKeywords.includes('credit'), 'Q2 expected keywords must include credit');
assert(q2.expectedKeywordsHi.includes('नामे'), 'Q2 Hindi keywords must include नामे');
assert(q2.expectedKeywordsHi.includes('जमा'), 'Q2 Hindi keywords must include जमा');

// Q3: Statutory Reserve Fund (25%)
const q3 = SEED_ORAL_QUESTIONS.find((q) => q.id === 'oral-q-03-statutory-reserve-fund');
assert(q3, 'Q3: Statutory Reserve Fund question must exist');
assert(q3.prompt.toLowerCase().includes('reserve fund'), 'Q3 prompt must mention Reserve Fund');
assert(q3.promptHi.includes('सांविधिक आरक्षित निधि'), 'Q3 Hindi prompt must include सांविधिक आरक्षित निधि');
assert(q3.expectedKeywords.includes('25%'), 'Q3 expected keywords must include 25%');
assert(q3.expectedKeywords.includes('statutory reserve fund'), 'Q3 expected keywords must include statutory reserve fund');
assert(q3.expectedKeywordsHi.includes('25%'), 'Q3 Hindi keywords must include 25%');

console.log('  ✓ Seed oral questions (Q1: Daybook, Q2: Crop Loan, Q3: 25% Reserve Fund) verified.');

// -----------------------------------------------------------------------------
// [Test 2] Isomorphic SHA-256 Parity vs Node.js Crypto across Edge Cases
// -----------------------------------------------------------------------------
console.log('>>> [Test 2] Testing Isomorphic Pure TS SHA-256 against node:crypto...');
const testStrings = [
  '',
  'a',
  'abc',
  'message digest',
  'In a PACS, Daybook and Cashbook balance against vault cash',
  'सहकार से समृद्धि — पैक्स रोजनामचा और तिजोरी रोकड़ मिलान',
  canonicalJsonStringify({
    aggregateType: 'ASSESSMENT',
    eventType: 'ORAL_ASSESSMENT_SUBMITTED',
    passed: true,
    score: 85,
    keywords: ['daybook', 'रोजनामचा', '25%'],
  }),
];

for (const str of testStrings) {
  const pureTsHash = sha256Hex(str);
  const nodeCryptoHash = createHash('sha256').update(str).digest('hex');
  assert.strictEqual(
    pureTsHash,
    nodeCryptoHash,
    `SHA-256 hash mismatch for input: "${str.slice(0, 30)}..."`
  );
}
console.log('  ✓ Pure TS SHA-256 matches node:crypto 100% bit-for-bit across ascii, unicode, and canonical JSON.');

// -----------------------------------------------------------------------------
// [Test 3] Client-Side Real-Time Keyword Scoring Engine
// -----------------------------------------------------------------------------
console.log('>>> [Test 3] Evaluating Client-Side Keyword Scoring Engine...');

// 3.1: Full Match (English)
const fullMatchTranscript =
  'In a PACS, the Daybook (Rojnamcha) and Cashbook must be balanced daily with reconciliation of physical vault cash before closing balance.';
const evalFull = evaluateOralQuestion(q1, fullMatchTranscript, 'EN');
assert(evalFull.matchedKeywords.length >= 3, 'Must match at least 3 keywords');
assert(evalFull.matchedKeywords.includes('daybook'), 'Must match daybook');
assert(evalFull.matchedKeywords.includes('cashbook'), 'Must match cashbook');
assert(evalFull.matchedKeywords.includes('vault cash'), 'Must match vault cash');
assert.strictEqual(evalFull.score, 100, 'Full keyword match should yield 100%');

// 3.2: Partial Passing Match (Hindi with technical terms)
const partialHindiTranscript =
  'पैक्स में दिन के अंत में रोजनामचा और तिजोरी में रखी भौतिक नकदी का मिलान किया जाता है।';
const evalHindi = evaluateOralQuestion(q1, partialHindiTranscript, 'HI');
assert(evalHindi.matchedKeywords.includes('रोजनामचा'), 'Must match रोजनामचा');
assert(evalHindi.matchedKeywords.includes('तिजोरी'), 'Must match तिजोरी');
assert(evalHindi.score >= 70, 'Meeting 2-keyword threshold must yield score >= 70%');

// 3.3: Insufficient keywords (< threshold)
const insufficientTranscript = 'Daybook is used in the office.';
const evalInsufficient = evaluateOralQuestion(q1, insufficientTranscript, 'EN');
assert.strictEqual(evalInsufficient.matchedKeywords.length, 1, 'Only 1 keyword matched');
assert(evalInsufficient.score < 70, 'Single keyword below threshold must score < 70%');

// 3.4: Zero keywords
const zeroTranscript = 'I do not know the answer to this question.';
const evalZero = evaluateOralQuestion(q1, zeroTranscript, 'EN');
assert.strictEqual(evalZero.matchedKeywords.length, 0, 'No keywords matched');
assert.strictEqual(evalZero.score, 0, 'Zero keywords must score 0%');

console.log('  ✓ Keyword scoring engine correctly evaluates 100% full, >= 70% threshold, < 70% partial, and 0% null responses.');

// -----------------------------------------------------------------------------
// [Test 4] Offline Store submitOralAssessment & Canonical Event Queueing
// -----------------------------------------------------------------------------
console.log('>>> [Test 4] Testing offlineStore.submitOralAssessment & Event Generation...');

const trainee = SEED_USERS.find((u) => u.role === 'TRAINEE') || SEED_USERS[3];
const initialQueuedCount = offlineStore.getQueuedEvents().length;

// Submit a passing oral viva attempt
const passingResponses = [
  {
    questionId: q1.id,
    transcript:
      'Daybook and Cashbook closing balance are balanced every evening against physical vault cash.',
  },
  {
    questionId: q2.id,
    transcript:
      'When disbursing a Crop Loan, Debit the Short-Term Crop Loan Asset Account and Credit Cash in Hand or Bank Account.',
  },
  {
    questionId: q3.id,
    transcript:
      'At least 25% of net profit must be mandatorily transferred to the Statutory Reserve Fund as a permanent buffer against bad debts.',
  },
];

const { result: vivaResult, event: syncEvent } = offlineStore.submitOralAssessment({
  assessmentId: SEED_ORAL_ASSESSMENT.id,
  traineeId: trainee.id,
  language: 'EN',
  responses: passingResponses,
});

assert.strictEqual(vivaResult.traineeId, trainee.id);
assert.strictEqual(vivaResult.passed, true, 'Viva attempt should pass with high score');
assert(vivaResult.percentage >= 70, `Score ${vivaResult.percentage}% should be >= 70%`);
assert.strictEqual(vivaResult.questions.length, 3, 'Must evaluate all 3 questions');

// Verify SyncEvent structure
assert.strictEqual(syncEvent.aggregateType, 'ASSESSMENT');
assert.strictEqual(syncEvent.eventType, 'ORAL_ASSESSMENT_SUBMITTED');
assert.strictEqual(syncEvent.aggregateId, SEED_ORAL_ASSESSMENT.id);
assert.strictEqual(syncEvent.syncStatus, SyncStatus.QUEUED);
assert(syncEvent.hash.length === 64, 'Event hash must be a 64-character SHA-256 hex string');

// Cryptographic validation under verifyEventHash
const isHashValid = verifyEventHash(syncEvent);
assert.strictEqual(isHashValid, true, 'Event hash MUST verify cleanly with verifyEventHash');

// Verify queued in offline store
const updatedQueued = offlineStore.getQueuedEvents();
assert.strictEqual(updatedQueued.length, initialQueuedCount + 1, 'Queued events count must increase by 1');
const storedEvent = updatedQueued.find((e) => e.id === syncEvent.id);
assert(storedEvent, 'Queued event must exist in offline store');

console.log(`  ✓ Oral assessment submitted: Score = ${vivaResult.percentage}% (PASSED). Event hash verified: ${syncEvent.hash.slice(0, 16)}...`);

// -----------------------------------------------------------------------------
// [Test 5] Cryptographic Tamper Rejection on ORAL_ASSESSMENT_SUBMITTED Event
// -----------------------------------------------------------------------------
console.log('>>> [Test 5] Cryptographic Tamper Resistance on Oral Sync Event...');

const tamperedEvent = {
  ...syncEvent,
  payload: {
    ...syncEvent.payload,
    score: 12, // Forcibly tampered score
    passed: false,
  },
};
const isTamperedValid = verifyEventHash(tamperedEvent as any);
assert.strictEqual(isTamperedValid, false, 'Tampered event payload MUST be rejected by verifyEventHash');

const tamperedSeqEvent = {
  ...syncEvent,
  logicalSequence: syncEvent.logicalSequence + 1, // Altered sequence
};
const isTamperedSeqValid = verifyEventHash(tamperedSeqEvent as any);
assert.strictEqual(isTamperedSeqValid, false, 'Tampered logical sequence MUST be rejected');

console.log('  ✓ Tamper resistance verified: Altered payload or sequence triggers immediate cryptographic rejection.');

// -----------------------------------------------------------------------------
// [Test 6] Ingestion of ORAL_ASSESSMENT_SUBMITTED Event into Central Store
// -----------------------------------------------------------------------------
console.log('>>> [Test 6] Testing Central API Ingestion Compatibility...');

// Simulate Central API sync route processing
assert(verifyEventHash(syncEvent), 'Central sync validator must accept valid oral event');

const payload = syncEvent.payload as any;
centralStore.recordAssessmentSubmission({
  submissionId: syncEvent.id,
  assessmentId: payload.assessmentId,
  traineeId: payload.traineeId,
  score: payload.score,
  passed: payload.passed,
  correctCount: payload.correctCount,
  totalQuestions: payload.totalQuestions,
  answers: payload.answers,
  occurredAt: syncEvent.occurredAt,
  nodeId: syncEvent.nodeId,
});

const submissions = centralStore.listAssessmentSubmissions(trainee.id);
const ingested = submissions.find((s) => s.submissionId === syncEvent.id);
assert(ingested, 'Oral viva submission must be persisted in central store');
assert.strictEqual(ingested.passed, true);
assert.strictEqual(ingested.score, vivaResult.percentage);

console.log('  ✓ Central API store smoothly ingested and persisted ORAL_ASSESSMENT_SUBMITTED event.');

// -----------------------------------------------------------------------------
// [Test 7] Speech Service API Contracts
// -----------------------------------------------------------------------------
console.log('>>> [Test 7] Checking Speech Service API Contracts...');
assert(typeof speechService.speak === 'function', 'speechService.speak must be a function');
assert(typeof speechService.stop === 'function', 'speechService.stop must be a function');
assert(typeof speechService.startListening === 'function', 'speechService.startListening must be a function');
assert(typeof speechService.isSupported === 'function', 'speechService.isSupported must be a function');
assert(typeof speechService.isVoiceInputSupported === 'function', 'speechService.isVoiceInputSupported must be a function');

// Safe execution when running in Node.js (no-op without window/browser)
speechService.speak('Test prompt', 'EN');
speechService.stop();
assert.strictEqual(speechService.isPlaying(), false);

console.log('  ✓ SpeechService gracefully handles Node.js headless environment without throwing.');

console.log('\n========================================================================');
console.log('   ✓ ALL MILESTONE 2 ORAL VIVA TESTS PASSED 100%!                      ');
console.log('========================================================================\n');

import assert from 'node:assert';
import { createHash, randomBytes } from 'node:crypto';
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

console.log('========================================================================');
console.log(' FORENSIC AUDITOR 2: ADVERSARIAL INTEGRITY VERIFICATION SUITE (M2)      ');
console.log('========================================================================\n');

// =============================================================================
// PHASE 1: CRYPTOGRAPHIC INTEGRITY OF sha256Hex (Zero-Mock Verification)
// =============================================================================
console.log('>>> [Forensic 1] Boundary & Fuzz Cryptographic Verification of sha256Hex...');

// 1.1 Standard FIPS test vectors
const knownVectors: Array<[string, string]> = [
  ['', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'],
  ['abc', 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'],
  [
    'abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq',
    '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1',
  ],
];

for (const [input, expected] of knownVectors) {
  const actual = sha256Hex(input);
  assert.strictEqual(actual, expected, `Known vector mismatch for "${input}"`);
}
console.log('  ✓ Standard FIPS 180-4 vectors matched.');

// 1.2 Boundary lengths around 64-byte block transitions (55, 56, 64, 119, 120, 128 bytes)
const boundaryLengths = [0, 1, 54, 55, 56, 57, 63, 64, 65, 118, 119, 120, 121, 127, 128, 129, 255, 256, 1024, 65536];
for (const len of boundaryLengths) {
  const str = 'A'.repeat(len);
  const customHash = sha256Hex(str);
  const nativeHash = createHash('sha256').update(str, 'utf8').digest('hex');
  assert.strictEqual(customHash, nativeHash, `Boundary length ${len} mismatch!`);
}
console.log(`  ✓ Boundary lengths verified (${boundaryLengths.join(', ')} bytes).`);

// 1.3 500-vector randomized fuzzing (Unicode, Hindi script, emojis, binary data)
console.log('  Testing 500 randomized fuzz inputs...');
for (let i = 0; i < 500; i++) {
  let fuzzStr = '';
  const mode = i % 5;
  if (mode === 0) {
    fuzzStr = randomBytes((i % 250) + 1).toString('hex');
  } else if (mode === 1) {
    // Devanagari Hindi text
    const hindiWords = ['रोजनामचा', 'रोकड़बही', 'तिजोरी', 'सांविधिक', 'सहकारिता', 'लाभांश', 'ऋण', 'परिसंपत्ति'];
    fuzzStr = Array.from({ length: (i % 20) + 1 }, () => hindiWords[Math.floor(Math.random() * hindiWords.length)]).join(' ');
  } else if (mode === 2) {
    // Emojis and 4-byte unicode
    fuzzStr = '🎙️📚💰🏛️🇮🇳'.repeat((i % 15) + 1) + `_seed_${i}`;
  } else if (mode === 3) {
    // Nested JSON objects
    fuzzStr = JSON.stringify({
      iter: i,
      nested: { rand: Math.random(), active: i % 2 === 0 },
      arr: [1, 'two', { three: 3 }],
    });
  } else {
    // Mixed ASCII and Unicode
    fuzzStr = `PACS-${i}: ` + 'सहकारी समिति '.repeat(i % 10) + ` seq=${i}`;
  }

  const customHash = sha256Hex(fuzzStr);
  const nativeHash = createHash('sha256').update(fuzzStr, 'utf8').digest('hex');
  assert.strictEqual(
    customHash,
    nativeHash,
    `Fuzz iteration ${i} mismatch for string: ${fuzzStr.slice(0, 30)}...`
  );
}
console.log('  ✓ 500/500 randomized fuzz vectors matched node:crypto bit-for-bit.');


// =============================================================================
// PHASE 2: ADVERSARIAL BEHAVIORAL AUDIT OF KEYWORD SCORING ENGINE
// =============================================================================
console.log('\n>>> [Forensic 2] Adversarial Testing on evaluateOralQuestion...');

const q1 = SEED_ORAL_QUESTIONS[0];
const q2 = SEED_ORAL_QUESTIONS[1];
const q3 = SEED_ORAL_QUESTIONS[2];

// 2.1 Keyword repetition attack: trainee says "daybook" 10 times to cheat threshold
const repeatedTranscript = 'daybook daybook daybook daybook daybook daybook daybook daybook';
const repeatedEval = evaluateOralQuestion(q1, repeatedTranscript, 'EN');
assert.strictEqual(
  repeatedEval.matchedKeywords.length,
  1,
  'Duplicate keyword mentions must NOT count as distinct keyword matches!'
);
assert(repeatedEval.score < 70, `Score ${repeatedEval.score} must be < 70% when only 1 distinct keyword is matched`);
console.log('  ✓ Anti-repetition attack check passed: duplicate keywords do not inflate score.');

// 2.2 Case sensitivity and whitespace insensitivity
const messyTranscript = '   In our PACS, the DaYbOoK and cAsHbOoK are reconciled against VaUlT cAsH!   ';
const messyEval = evaluateOralQuestion(q1, messyTranscript, 'EN');
assert(messyEval.matchedKeywords.includes('daybook'), 'Must match daybook regardless of case');
assert(messyEval.matchedKeywords.includes('cashbook'), 'Must match cashbook regardless of case');
assert(messyEval.matchedKeywords.includes('vault cash'), 'Must match vault cash regardless of case');
assert(messyEval.score >= 75, `Score ${messyEval.score} must be >= 75% for 3 valid keywords`);
console.log('  ✓ Case & whitespace normalization verified.');

// 2.3 Bilingual Cross-Lingual Flexibility
// Trainee selects 'HI' but speaks English technical terms ('Daybook', 'Cashbook')
const englishInHindiMode = 'पैक्स में Daybook और Cashbook का दैनिक मिलान होता है।';
const crossLingualEval = evaluateOralQuestion(q1, englishInHindiMode, 'HI');
assert(
  crossLingualEval.matchedKeywords.length >= 2,
  'Should recognize English technical terms even in Hindi mode due to secondary keyword matching'
);
assert(crossLingualEval.score >= 70, 'Bilingual technical flexibility award score >= 70%');
console.log('  ✓ Bilingual cross-lingual recognition verified.');

// 2.4 Empty & nonsense transcripts
const emptyEval = evaluateOralQuestion(q1, '', 'EN');
assert.strictEqual(emptyEval.score, 0);
assert.strictEqual(emptyEval.matchedKeywords.length, 0);

const gibberishEval = evaluateOralQuestion(q1, 'lorem ipsum dolor sit amet consectetur adipiscing elit', 'EN');
assert.strictEqual(gibberishEval.score, 0);
assert.strictEqual(gibberishEval.matchedKeywords.length, 0);
console.log('  ✓ Empty & gibberish transcripts strictly score 0%.');

// 2.5 All questions individually verified with genuine cooperative accounting answers
// Q2: Crop Loan (debit loan asset, credit cash)
const q2Answer = 'Debit the Short-Term Crop Loan Asset Account and Credit Cash in Hand';
const q2Eval = evaluateOralQuestion(q2, q2Answer, 'EN');
assert(q2Eval.score >= 75, 'Q2 answer must score >= 75%');
assert(q2Eval.matchedKeywords.includes('debit'));
assert(q2Eval.matchedKeywords.includes('credit'));

// Q3: 25% Reserve fund
const q3Answer = 'Under the Act, 25% of net profit must be placed in the statutory reserve fund as a permanent buffer against bad debts';
const q3Eval = evaluateOralQuestion(q3, q3Answer, 'EN');
assert(q3Eval.score === 100, 'Q3 comprehensive answer must score 100%');
console.log('  ✓ Genuine cooperative accounting answers verified for Q1, Q2, and Q3.');


// =============================================================================
// PHASE 3: OFFLINE EVENT JOURNAL & TAMPER RESISTANCE
// =============================================================================
console.log('\n>>> [Forensic 3] Testing submitOralAssessment & Cryptographic Tamper Defense...');

const traineeId = SEED_USERS[3].id;
const initialCount = offlineStore.getQueuedEvents().length;

// 3.1 Failing Submission (0% score)
const { result: failResult, event: failEvent } = offlineStore.submitOralAssessment({
  assessmentId: SEED_ORAL_ASSESSMENT.id,
  traineeId,
  language: 'EN',
  responses: [
    { questionId: q1.id, transcript: 'I do not remember.' },
    { questionId: q2.id, transcript: 'No idea.' },
    { questionId: q3.id, transcript: 'Skipped.' },
  ],
});

assert.strictEqual(failResult.passed, false, 'Failing attempt must be marked passed: false');
assert.strictEqual(failResult.percentage, 0, 'Score must be 0%');
assert.strictEqual(verifyEventHash(failEvent), true, 'Failing event must still have a valid canonical hash');
console.log('  ✓ Failing oral viva submission properly recorded with passed: false (0%).');

// 3.2 Passing Submission (100% score)
const { result: passResult, event: passEvent } = offlineStore.submitOralAssessment({
  assessmentId: SEED_ORAL_ASSESSMENT.id,
  traineeId,
  language: 'EN',
  responses: [
    {
      questionId: q1.id,
      transcript: 'Daybook Rojnamcha and Cashbook closing balance balanced against physical vault cash reconciliation.',
    },
    {
      questionId: q2.id,
      transcript: 'Debit Crop Loan asset account and credit cash or bank disbursement.',
    },
    {
      questionId: q3.id,
      transcript: 'Mandatory 25% net profit transfer to statutory reserve fund as buffer against bad debts.',
    },
  ],
});

assert.strictEqual(passResult.passed, true, 'Passing attempt must be marked passed: true');
assert(passResult.percentage >= 70, `Passing score ${passResult.percentage}% must be >= 70%`);
assert.strictEqual(verifyEventHash(passEvent), true, 'Passing event must have valid canonical hash');
console.log(`  ✓ Passing oral viva submission properly recorded with score ${passResult.percentage}%.`);

// 3.3 Deep Tamper Tests: Mutating every single component of the event
console.log('  Verifying tamper rejection across event properties...');

// Mutate score
const t1 = { ...passEvent, payload: { ...passEvent.payload, score: 0 } };
assert.strictEqual(verifyEventHash(t1 as any), false, 'Tampered score MUST fail verification');

// Mutate passed flag
const t2 = { ...passEvent, payload: { ...passEvent.payload, passed: false } };
assert.strictEqual(verifyEventHash(t2 as any), false, 'Tampered passed flag MUST fail verification');

// Mutate answers
const t3 = { ...passEvent, payload: { ...passEvent.payload, answers: { fake: 'fake' } } };
assert.strictEqual(verifyEventHash(t3 as any), false, 'Tampered answers MUST fail verification');

// Mutate aggregateType
const t4 = { ...passEvent, aggregateType: 'ATTENDANCE' as any };
assert.strictEqual(verifyEventHash(t4 as any), false, 'Tampered aggregateType MUST fail verification');

// Mutate aggregateId
const t5 = { ...passEvent, aggregateId: 'tampered-agg-id' };
assert.strictEqual(verifyEventHash(t5 as any), false, 'Tampered aggregateId MUST fail verification');

// Mutate eventType
const t6 = { ...passEvent, eventType: 'ASSESSMENT_SUBMITTED' };
assert.strictEqual(verifyEventHash(t6 as any), false, 'Tampered eventType MUST fail verification');

// Mutate logicalSequence
const t7 = { ...passEvent, logicalSequence: passEvent.logicalSequence + 99 };
assert.strictEqual(verifyEventHash(t7 as any), false, 'Tampered logicalSequence MUST fail verification');

console.log('  ✓ 7/7 adversarial tamper mutations strictly rejected by verifyEventHash.');

// 3.4 Verify offline journal state
const finalQueued = offlineStore.getQueuedEvents();
assert.strictEqual(finalQueued.length, initialCount + 2, 'Queued events should have incremented by 2');
const latestAttempt = offlineStore.getLatestOralAssessment(traineeId);
assert(latestAttempt !== null, 'Latest oral assessment attempt must be accessible');
assert.strictEqual(latestAttempt.passed, true, 'Latest oral attempt matches passResult');
console.log('  ✓ Offline journal and state query methods verified.');

console.log('\n========================================================================');
console.log(' FORENSIC AUDIT 2 COMPLETE: ZERO VIOLATIONS FOUND. 100% CLEAN!          ');
console.log('========================================================================\n');

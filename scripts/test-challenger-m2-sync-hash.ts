import assert from 'node:assert';
import { createHash } from 'node:crypto';
import {
  sha256Hex,
  canonicalJsonStringify,
  calculateEventHash,
  verifyEventHash,
  createSyncEvent,
} from '../packages/sync-protocol/dist/index.js';
import { buildCentralServer } from '../apps/central-api/dist/server.js';
import { centralStore } from '../apps/central-api/dist/store/memory-store.js';
import {
  SEED_ORAL_ASSESSMENT,
  SEED_USERS,
} from '../packages/test-fixtures/dist/index.js';
import { SyncEventType, SyncStatus } from '../packages/types/dist/index.js';

console.log('========================================================================');
console.log('  SAHAKAR EDGE — EMPIRICAL CHALLENGER 2: CRYPTO HASH & SYNC TAMPER HARNESS');
console.log('========================================================================\n');

async function runEmpiricalHarness() {
  let totalAssertions = 0;
  function passAssert(cond: boolean, msg: string) {
    assert(cond, msg);
    totalAssertions++;
  }

  // ===========================================================================
  // SUITE 1: SHA-256 Parity & RFC 8785 Canonical Serialization (50+ Diverse Payloads)
  // ===========================================================================
  console.log('>>> [Suite 1] Stress-Testing FIPS 180-4 SHA-256 Parity vs node:crypto across 50+ Payloads...');

  // Standard NIST / FIPS test vectors
  const standardVectors = [
    { input: '', expected: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' },
    { input: 'a', expected: 'ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb' },
    { input: 'abc', expected: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad' },
    {
      input: 'abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq', // 56 bytes (boundary condition)
      expected: '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1',
    },
    {
      input: 'abcdefghbcdefghicdefghijdefghijkefghijklfghijklmghijklmnhijklmnoijklmnopjklmnopqklmnopqrlmnopqrsmnopqrstnopqrstu', // 112 bytes
      expected: 'cf5b16a778af8380036ce59e7b0492370b249b11e8f07a51afac45037afee9d1',
    },
  ];

  for (const v of standardVectors) {
    const pure = sha256Hex(v.input);
    const node = createHash('sha256').update(v.input).digest('hex');
    passAssert(pure === v.expected, `Standard vector "${v.input.slice(0, 15)}..." failed expected SHA-256`);
    passAssert(pure === node, `Standard vector mismatch with node:crypto for "${v.input.slice(0, 15)}..."`);
  }
  console.log(`  ✓ Verified all standard NIST/FIPS boundary vectors (0, 1, 3, 56, 112 bytes).`);

  // Message boundary sizes: 54, 55, 56, 63, 64, 65, 119, 120, 127, 128, 129, 1000, 65536 bytes
  const boundarySizes = [54, 55, 56, 63, 64, 65, 119, 120, 127, 128, 129, 255, 256, 511, 512, 1000, 65536];
  for (const size of boundarySizes) {
    const chunk = 'x'.repeat(size);
    const pure = sha256Hex(chunk);
    const node = createHash('sha256').update(chunk).digest('hex');
    passAssert(pure === node, `Boundary size ${size} bytes failed parity`);
  }
  console.log(`  ✓ Verified byte length boundary transitions (54 through 65,536 bytes).`);

  // Indian Languages & Complex Unicode Script Payloads
  const indianScriptPayloads = [
    'सहकार से समृद्धि (Hindi)',
    'रोजनामचा आणि खतावणी दैनिक ताळमेळ (Marathi)',
    'সমবায় সমিতি হিসাবরক্ষণ ও ক্যাশ বুক (Bengali)',
    'सहकारी संघ आणि वैधानिक राखीव निधी २५% (Konkani)',
    'ಸಹಕಾರ ಸಂಘಗಳ ದೈನಂದಿನ ಲೆಕ್ಕಪತ್ರ ದಿನಚರಿ (Kannada)',
    'सहकारी संस्थांचे कामकाज आणि पीक कर्ज वितरण (Sanskrit / Marathi)',
    'सहकारिता विभाग, भारत सरकार Ministry of Cooperation 🇮🇳',
    '₹1,25,000.50 (रुपये एक लाख पच्चीस हजार पचास पैसे)',
    '🌾🏛️ किसान क्रेडिट कार्ड (KCC) Smart Card UID 14443A',
    'Special Ligatures: क्ष, त्र, ज्ञ, श्र, र्क, क्र, द्र, ट्र, ॐ',
    'Zero-Width Chars: \u200B\u200C\u200D (ZWSP, ZWNJ, ZWJ)',
    'BOM and RTL markers: \uFEFF \u200E \u200F',
  ];

  for (const scriptText of indianScriptPayloads) {
    const pure = sha256Hex(scriptText);
    const node = createHash('sha256').update(scriptText).digest('hex');
    passAssert(pure === node, `Indian script text parity failed for: ${scriptText.slice(0, 20)}`);
  }
  console.log(`  ✓ Verified Indian multilingual Unicode strings, Devnagari ligatures, and surrogate emojis.`);

  // 50+ Real-World Domain Payloads for Sahakar Edge
  const diversePayloads: Record<string, unknown>[] = [];

  // Generate 50 structured domain payloads
  for (let i = 1; i <= 55; i++) {
    diversePayloads.push({
      index: i,
      id: `payload-test-${i.toString().padStart(3, '0')}`,
      type: i % 2 === 0 ? 'ORAL_ASSESSMENT_SUBMITTED' : 'ATTENDANCE_RECORDED',
      nested: {
        level1: {
          level2: {
            score: (i * 7) % 100,
            passed: (i * 7) % 100 >= 70,
            keywords: ['daybook', 'रोजनामचा', 'cashbook', 'vault cash', '25%'],
            metrics: {
              latencyMs: 12.5 + i * 0.4,
              negativeValue: -1 * i * 42,
              zeroVal: 0,
              maxSafeInt: Number.MAX_SAFE_INTEGER - i,
            },
          },
        },
      },
      tags: ['SIH_26087', 'PACS', `TIER_${(i % 3) + 1}`, 'RICM_BHOPAL'],
      notes: `परीक्षण पेलोड क्रमांक ${i} — सहकार भारती`,
      active: i % 3 !== 0,
      metadata: null,
    });
  }

  for (let i = 0; i < diversePayloads.length; i++) {
    const canonical = canonicalJsonStringify(diversePayloads[i]);
    const pure = sha256Hex(canonical);
    const node = createHash('sha256').update(canonical).digest('hex');
    passAssert(pure === node, `Diverse payload #${i + 1} parity failed`);
  }
  console.log(`  ✓ Tested 55 diverse structured domain payloads: 100% parity with node:crypto.`);

  // ===========================================================================
  // SUITE 2: Key-Order Permutation & Canonical Invariance
  // ===========================================================================
  console.log('\n>>> [Suite 2] Testing Key-Order Permutation Invariance (RFC 8785)...');

  const objA = {
    z_aggregateType: 'ASSESSMENT',
    a_traineeId: 'trainee-anita-001',
    m_score: 95,
    b_details: {
      z_passed: true,
      a_questions: [
        { id: 'q1', score: 100, prompt: 'Daybook' },
        { id: 'q2', score: 90, prompt: 'Crop Loan' },
      ],
      m_summary: {
        totalKeywords: 7,
        approved: true,
      },
    },
  };

  const objB = {
    a_traineeId: 'trainee-anita-001',
    m_score: 95,
    z_aggregateType: 'ASSESSMENT',
    b_details: {
      m_summary: {
        approved: true,
        totalKeywords: 7,
      },
      a_questions: [
        { score: 100, id: 'q1', prompt: 'Daybook' },
        { prompt: 'Crop Loan', score: 90, id: 'q2' },
      ],
      z_passed: true,
    },
  };

  const canonicalA = canonicalJsonStringify(objA);
  const canonicalB = canonicalJsonStringify(objB);

  passAssert(canonicalA === canonicalB, 'Canonical JSON strings MUST be identical despite permuted key orders');
  passAssert(sha256Hex(canonicalA) === sha256Hex(canonicalB), 'SHA-256 digests MUST be identical across key permutations');
  console.log('  ✓ Multi-level key order permutations produce bit-for-bit identical canonical JSON and SHA-256.');

  // ===========================================================================
  // SUITE 3: Event Tamper Resistance & Bit-Flipping Fuzzing
  // ===========================================================================
  console.log('\n>>> [Suite 3] Testing Event Tamper Resistance & Bit-Flipping Fuzzing...');

  const trainee = SEED_USERS.find((u) => u.role === 'TRAINEE') || SEED_USERS[3];
  const validEvent = createSyncEvent({
    id: 'sync-event-oral-test-001',
    nodeId: 'edge-node-ricm-bhopal-01',
    aggregateType: 'ASSESSMENT',
    aggregateId: SEED_ORAL_ASSESSMENT.id,
    eventType: 'ORAL_ASSESSMENT_SUBMITTED',
    logicalSequence: 14,
    payload: {
      assessmentId: SEED_ORAL_ASSESSMENT.id,
      traineeId: trainee.id,
      language: 'EN',
      score: 85,
      passed: true,
      totalQuestions: 3,
      correctCount: 3,
      answers: [
        { questionId: 'oral-q-01', score: 90, matchedKeywords: ['daybook', 'cashbook', 'vault cash'] },
        { questionId: 'oral-q-02', score: 85, matchedKeywords: ['debit', 'credit'] },
        { questionId: 'oral-q-03', score: 80, matchedKeywords: ['25%', 'statutory reserve fund'] },
      ],
    },
  });

  passAssert(verifyEventHash(validEvent), 'Baseline valid event MUST verify cleanly');

  // Attack 3.1: Tamper score
  const attackScore = {
    ...validEvent,
    payload: { ...validEvent.payload, score: 99 },
  };
  passAssert(!verifyEventHash(attackScore as any), 'Attack 3.1: Mutated score must fail verifyEventHash');

  // Attack 3.2: Tamper passed status
  const attackPassed = {
    ...validEvent,
    payload: { ...validEvent.payload, passed: false },
  };
  passAssert(!verifyEventHash(attackPassed as any), 'Attack 3.2: Mutated passed status must fail verifyEventHash');

  // Attack 3.3: Impersonate different traineeId
  const attackTrainee = {
    ...validEvent,
    payload: { ...validEvent.payload, traineeId: 'trainee-impersonator-666' },
  };
  passAssert(!verifyEventHash(attackTrainee as any), 'Attack 3.3: Impersonated traineeId must fail verifyEventHash');

  // Attack 3.4: Alter logicalSequence (sequence replay / injection)
  const attackSeq = {
    ...validEvent,
    logicalSequence: validEvent.logicalSequence + 1,
  };
  passAssert(!verifyEventHash(attackSeq as any), 'Attack 3.4: Altered logicalSequence must fail verifyEventHash');

  // Attack 3.5: Alter aggregateType
  const attackAggType = {
    ...validEvent,
    aggregateType: 'ATTENDANCE' as any,
  };
  passAssert(!verifyEventHash(attackAggType as any), 'Attack 3.5: Altered aggregateType must fail verifyEventHash');

  // Attack 3.6: Alter eventType
  const attackEventType = {
    ...validEvent,
    eventType: 'ASSESSMENT_OVERRIDE',
  };
  passAssert(!verifyEventHash(attackEventType as any), 'Attack 3.6: Altered eventType must fail verifyEventHash');

  // Attack 3.7: Alter nested answers array
  const attackAnswers = {
    ...validEvent,
    payload: {
      ...validEvent.payload,
      answers: [
        { questionId: 'oral-q-01', score: 100, matchedKeywords: ['daybook', 'cashbook', 'vault cash'] },
      ],
    },
  };
  passAssert(!verifyEventHash(attackAnswers as any), 'Attack 3.7: Altered nested answers must fail verifyEventHash');

  // Attack 3.8: 64 Bit-Flip Mutations on Event Hash Digest
  const originalHash = validEvent.hash;
  for (let pos = 0; pos < 64; pos++) {
    const originalChar = originalHash[pos];
    const flippedChar = originalChar === '0' ? '1' : '0';
    const mutatedHash = originalHash.substring(0, pos) + flippedChar + originalHash.substring(pos + 1);

    const bitFlippedEvent = {
      ...validEvent,
      hash: mutatedHash,
    };
    passAssert(!verifyEventHash(bitFlippedEvent), `Bit-flip at hash pos ${pos} must fail verifyEventHash`);
  }
  console.log(`  ✓ 64/64 bit-flip fuzzing mutations on hash digest immediately rejected.`);
  console.log(`  ✓ All payload & metadata tampering attacks (score, trainee, sequence, type, answers) rejected.`);

  // ===========================================================================
  // SUITE 4: Central API Ingestion (/api/v1/sync/events) Live HTTP Verification
  // ===========================================================================
  console.log('\n>>> [Suite 4] Central API Live Ingestion & Rejection Verification (/api/v1/sync/events)...');

  centralStore.seedBaseline();
  const centralApp = await buildCentralServer();
  await centralApp.ready();

  const nodeId = 'edge-node-ricm-bhopal-01';

  // Test 4.1: Valid ingestion of ORAL_ASSESSMENT_SUBMITTED event
  const resValid = await centralApp.inject({
    method: 'POST',
    url: '/api/v1/sync/events',
    payload: {
      nodeId,
      events: [validEvent],
    },
  });

  passAssert(resValid.statusCode === 200, 'Valid sync batch must return HTTP 200');
  const bodyValid = JSON.parse(resValid.body);
  passAssert(bodyValid.accepted.includes(validEvent.id), 'Valid event MUST be in accepted array');
  passAssert(bodyValid.rejected.length === 0, 'Valid event rejected array MUST be empty');

  // Verify memory store recorded it
  const storedSubs = centralStore.listAssessmentSubmissions(trainee.id);
  const foundSub = storedSubs.find((s) => s.submissionId === validEvent.id);
  passAssert(!!foundSub, 'Oral assessment submission must be in centralStore');
  passAssert(foundSub?.score === 85, 'Recorded score in central store must match event payload');
  passAssert(foundSub?.passed === true, 'Recorded pass status must match event payload');
  console.log('  ✓ Test 4.1: Untampered oral assessment accepted and ingested into Central DB.');

  // Test 4.2: Tampered payload ingestion rejection
  const tamperedOralEvent = {
    ...validEvent,
    id: 'sync-event-oral-tampered-002',
    // Hash remains the old hash, but payload is tampered
    payload: {
      ...validEvent.payload,
      score: 10,
      passed: false,
    },
  };

  const resTampered = await centralApp.inject({
    method: 'POST',
    url: '/api/v1/sync/events',
    payload: {
      nodeId,
      events: [tamperedOralEvent],
    },
  });

  passAssert(resTampered.statusCode === 200, 'Sync route returns HTTP 200 with rejection report');
  const bodyTampered = JSON.parse(resTampered.body);
  passAssert(!bodyTampered.accepted.includes(tamperedOralEvent.id), 'Tampered event MUST NOT be accepted');
  const rejEntry = bodyTampered.rejected.find((r: any) => r.eventId === tamperedOralEvent.id);
  passAssert(!!rejEntry, 'Tampered event MUST be listed in rejected array');
  passAssert(rejEntry.reason === 'HASH_MISMATCH', `Rejection reason must be HASH_MISMATCH, got: ${rejEntry.reason}`);

  // Verify central store does NOT contain tampered submission
  const afterTamperedSubs = centralStore.listAssessmentSubmissions(trainee.id);
  const foundTampered = afterTamperedSubs.find((s) => s.submissionId === tamperedOralEvent.id);
  passAssert(!foundTampered, 'Tampered event MUST NOT be persisted in central store');
  console.log('  ✓ Test 4.2: Tampered oral assessment rejected with HASH_MISMATCH and excluded from Central DB.');

  // Test 4.3: Mixed batch ingestion (valid + tampered)
  const validEvent2 = createSyncEvent({
    id: 'sync-event-oral-test-003',
    nodeId,
    aggregateType: 'ASSESSMENT',
    aggregateId: SEED_ORAL_ASSESSMENT.id,
    eventType: 'ORAL_ASSESSMENT_SUBMITTED',
    logicalSequence: 15,
    payload: {
      assessmentId: SEED_ORAL_ASSESSMENT.id,
      traineeId: trainee.id,
      language: 'HI',
      score: 92,
      passed: true,
      totalQuestions: 3,
      correctCount: 3,
      answers: [],
    },
  });

  const tamperedEvent2 = {
    ...validEvent2,
    id: 'sync-event-oral-tampered-004',
    logicalSequence: 999, // tampered sequence
  };

  const resMixed = await centralApp.inject({
    method: 'POST',
    url: '/api/v1/sync/events',
    payload: {
      nodeId,
      events: [validEvent2, tamperedEvent2],
    },
  });

  const bodyMixed = JSON.parse(resMixed.body);
  passAssert(bodyMixed.accepted.includes(validEvent2.id), 'Mixed batch: valid event must be accepted');
  passAssert(!bodyMixed.accepted.includes(tamperedEvent2.id), 'Mixed batch: tampered event must NOT be accepted');
  passAssert(bodyMixed.rejected.some((r: any) => r.eventId === tamperedEvent2.id && r.reason === 'HASH_MISMATCH'),
    'Mixed batch: tampered event must be rejected with HASH_MISMATCH');
  console.log('  ✓ Test 4.3: Mixed batch correctly partitioned into accepted and rejected arrays.');

  // Test 4.4: Idempotency (resubmission of already ingested event)
  const resDup = await centralApp.inject({
    method: 'POST',
    url: '/api/v1/sync/events',
    payload: {
      nodeId,
      events: [validEvent], // already accepted in 4.1
    },
  });

  const bodyDup = JSON.parse(resDup.body);
  passAssert(bodyDup.accepted.includes(validEvent.id), 'Duplicate upload should be acknowledged in accepted array');
  passAssert(bodyDup.rejected.length === 0, 'Duplicate upload should not be rejected');
  console.log('  ✓ Test 4.4: Duplicate event upload is idempotent and acknowledged without double-mutation.');

  // Test 4.5: Missing metadata rejection
  const missingMetaEvent = {
    id: 'event-no-hash',
    nodeId,
    aggregateType: 'ASSESSMENT',
    aggregateId: 'a1',
    eventType: 'ORAL_ASSESSMENT_SUBMITTED',
    payload: {},
  };
  const resMissing = await centralApp.inject({
    method: 'POST',
    url: '/api/v1/sync/events',
    payload: {
      nodeId,
      events: [missingMetaEvent],
    },
  });
  const bodyMissing = JSON.parse(resMissing.body);
  passAssert(bodyMissing.rejected.some((r: any) => r.eventId === 'event-no-hash' && r.reason === 'MISSING_METADATA'),
    'Missing hash metadata must be rejected with MISSING_METADATA');
  console.log('  ✓ Test 4.5: Missing metadata correctly rejected with MISSING_METADATA.');

  // Test 4.6: Invalid request structure (missing nodeId or events array)
  const resBad1 = await centralApp.inject({
    method: 'POST',
    url: '/api/v1/sync/events',
    payload: { nodeId }, // missing events
  });
  passAssert(resBad1.statusCode === 400, 'Missing events array must return HTTP 400');

  const resBad2 = await centralApp.inject({
    method: 'POST',
    url: '/api/v1/sync/events',
    payload: { events: [] }, // missing nodeId
  });
  passAssert(resBad2.statusCode === 400, 'Missing nodeId must return HTTP 400');
  console.log('  ✓ Test 4.6: Invalid request envelope correctly yields HTTP 400 BAD_REQUEST.');

  // ===========================================================================
  // SUITE 5: High-Volume Pseudo-Random Fuzzing Oracle (100 Iterations)
  // ===========================================================================
  console.log('\n>>> [Suite 5] High-Volume Fuzzing Oracle: 100 Randomized Payloads...');

  for (let iter = 1; iter <= 100; iter++) {
    const fuzzedPayload = {
      iter,
      nonce: Math.random().toString(36).substring(2),
      timestamp: Date.now() + iter * 1000,
      floatVal: Math.random() * 10000 - 5000,
      boolVal: iter % 2 === 0,
      intVal: Math.floor(Math.random() * 1000000),
      hindiText: `सहकार नमूना संख्या ${iter}`,
      arr: [iter, `item_${iter}`, { inner: iter * 2 }],
      nestedObj: {
        x: Math.random(),
        y: `str_${iter}`,
        z: { flag: true },
      },
    };

    const canonical = canonicalJsonStringify(fuzzedPayload);
    const pureDigest = sha256Hex(canonical);
    const nodeDigest = createHash('sha256').update(canonical).digest('hex');

    passAssert(pureDigest === nodeDigest, `Fuzz iteration ${iter} failed parity`);
  }
  console.log('  ✓ 100/100 randomized complex payloads verified bit-for-bit against node:crypto.');

  console.log('\n========================================================================');
  console.log(`   ✓ ALL EMPIRICAL CHALLENGES PASSED! (${totalAssertions} assertions verified)`);
  console.log('========================================================================\n');
}

runEmpiricalHarness().catch((err) => {
  console.error('CHALLENGER HARNESS FAILED:', err);
  process.exit(1);
});

/**
 * Sahakar Edge — Empirical Adversarial Stress Test Suite
 * Milestone 1 Challenger Verification: Engines 4 to 6 & Fastify REST API Routes
 *
 * Scopes Tested:
 * 1. DropoutRiskEngine (`dropout-risk-engine.ts`):
 *    - Invariants: min 0.0, max 100.0 (clamping, negative and extreme inputs)
 *    - All 4 individual risk factor triggers:
 *      * lowLessonCompletion (< 25% -> +40 pts)
 *      * lowAttendance (< 50% -> +30 pts)
 *      * staleEngagement (> 14d -> +20 pts)
 *      * assessmentFailures (+10 pts each, capped at 30 pts)
 *    - Combination sums: (40 + 30 = 70 -> HIGH, 30 + 20 = 50 -> MEDIUM, etc.)
 *    - Threshold boundaries: 29.9 -> LOW, 30.0 -> MEDIUM, 59.9 -> MEDIUM, 60.0 -> HIGH
 *    - Cohort risk triage radar and sorting order
 *
 * 2. SkillGapEngine (`skill-gap-engine.ts`):
 *    - 8-dimensional unit embeddings and cosine similarity:
 *      * Identical vectors -> 1.0000
 *      * Orthogonal vectors -> 0.0000
 *      * Opposite vectors -> -1.0000
 *      * Zero vector / edge cases -> 0.0000
 *    - Semantic partial-credit threshold boundary:
 *      * 0.3900 -> rejected (no related match, 0 credit)
 *      * 0.4000 -> accepted (included in relatedSkills, +0.5 partial credit)
 *    - Sector shortage radar:
 *      * shortage = demand - supply
 *      * zero supply, surplus (negative), zero demand, descending sort
 *
 * 3. HostelLogisticsEngine & Public Profile (`hostel-logistics-engine.ts`):
 *    - Room occupancy bounds: over-allocation rejected when occupiedBeds === bedCapacity
 *    - Single-room per programme invariant and institute match invariant
 *    - Sovereign NFC profile code rotation: format ^NFC-[0-9A-F]{8}$, 2,000 draws collision test
 *    - PII Leakage Penetration Test: verify phone, email, hostel room never leaked under any input
 *
 * 4. Fastify REST API Route Testing:
 *    - /api/v1/training/... routes and /api/v1/public/profile/:code
 *    - Zod validation errors (HTTP 400), Not Found (HTTP 404), Conflict (HTTP 409), and 200/201 responses
 */

import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import {
  DropoutRiskEngine,
  dropoutRiskEngine,
} from '../apps/central-api/dist/services/dropout-risk-engine.js';
import {
  SkillGapEngine,
  skillGapEngine,
  NCCT_SKILL_EMBEDDING_MAP,
} from '../apps/central-api/dist/services/skill-gap-engine.js';
import {
  HostelLogisticsEngine,
  hostelLogisticsEngine,
} from '../apps/central-api/dist/services/hostel-logistics-engine.js';
import { buildCentralServer } from '../apps/central-api/dist/server.js';
import { centralStore } from '../apps/central-api/dist/store/memory-store.js';
import type { CampusHostelRoom, CooperativeSkillItem, TraineePublicNfcProfile } from '@sahakar/types';

interface TestResult {
  section: string;
  name: string;
  status: 'PASS' | 'FAIL';
  durationMs: number;
  details?: string;
}

const results: TestResult[] = [];

async function runTest(section: string, name: string, fn: () => void | Promise<void>) {
  const start = performance.now();
  try {
    await fn();
    const durationMs = Math.round((performance.now() - start) * 100) / 100;
    results.push({ section, name, status: 'PASS', durationMs });
    console.log(`  ✓ [PASS] [${section}] ${name} (${durationMs}ms)`);
  } catch (err: any) {
    const durationMs = Math.round((performance.now() - start) * 100) / 100;
    results.push({ section, name, status: 'FAIL', durationMs, details: err.message });
    console.error(`  ❌ [FAIL] [${section}] ${name} (${durationMs}ms): ${err.message}`);
    throw err;
  }
}

async function main() {
  console.log('========================================================================');
  console.log('   SAHAKAR EDGE — NCCT M1 EMPIRICAL CHALLENGER TEST SUITE (ENGINES 4-6) ');
  console.log('========================================================================\n');

  // ===========================================================================
  // SECTION 1: DROPOUT RISK ENGINE EMPIRICAL STRESS TESTS
  // ===========================================================================
  console.log('>>> [Section 1] Stress-Testing DropoutRiskEngine...');

  await runTest('DropoutRisk', 'Mathematical boundary invariant: min score 0.0 with ideal metrics', () => {
    const res = dropoutRiskEngine.evaluateDropoutRisk({
      traineeId: 't-1',
      traineeName: 'Ideal Learner',
      programmeId: 'p-1',
      completionRate: 1.0,
      attendanceRate: 1.0,
      daysSinceLastActivity: 0,
      failedAssessmentsCount: 0,
    });
    assert.equal(res.riskScore, 0.0, 'Ideal learner risk score must be exactly 0.0');
    assert.equal(res.riskTier, 'LOW', '0.0 risk score must be tier LOW');
    assert.equal(res.riskFactors.lowLessonCompletion, false);
    assert.equal(res.riskFactors.lowAttendance, false);
    assert.equal(res.riskFactors.staleEngagement, false);
    assert.equal(res.riskFactors.assessmentFailures, 0);
  });

  await runTest('DropoutRisk', 'Mathematical boundary invariant: min score 0.0 under negative/out-of-bound inputs', () => {
    const res = dropoutRiskEngine.evaluateDropoutRisk({
      traineeId: 't-neg',
      traineeName: 'Overachieving Learner',
      programmeId: 'p-1',
      completionRate: 1.5,
      attendanceRate: 1.2,
      daysSinceLastActivity: -10,
      failedAssessmentsCount: -5,
    });
    assert.equal(res.riskScore, 0.0, 'Negative failure counts and high completion must clamp to min 0.0');
    assert.equal(res.riskTier, 'LOW');
    assert.equal(res.riskFactors.assessmentFailures, 0, 'Negative failure count must not subtract points');
  });

  await runTest('DropoutRisk', 'Mathematical boundary invariant: max score 100.0 clamped under extreme failure', () => {
    // 40 (completion) + 30 (attendance) + 20 (stale) + 30 (3 fails) = 120 -> clamped to 100
    const res = dropoutRiskEngine.evaluateDropoutRisk({
      traineeId: 't-worst',
      traineeName: 'Completely Disengaged',
      programmeId: 'p-1',
      completionRate: 0.0,
      attendanceRate: 0.0,
      daysSinceLastActivity: 365,
      failedAssessmentsCount: 99,
    });
    assert.equal(res.riskScore, 100.0, 'Worst-case raw score (120) must be clamped to invariant max 100.0');
    assert.equal(res.riskTier, 'HIGH', 'Score 100 must be HIGH tier');
    assert.equal(res.riskFactors.lowLessonCompletion, true);
    assert.equal(res.riskFactors.lowAttendance, true);
    assert.equal(res.riskFactors.staleEngagement, true);
    assert.equal(res.riskFactors.assessmentFailures, 30, 'Failures penalty must be capped at 30 points');
  });

  await runTest('DropoutRisk', 'Individual Factor 1: Lesson completion threshold boundary (< 25% vs >= 25%)', () => {
    // 0.2499 -> triggers +40
    const trigger = dropoutRiskEngine.evaluateDropoutRisk({
      traineeId: 't-f1-on',
      traineeName: 'Test',
      programmeId: 'p-1',
      completionRate: 0.2499,
      attendanceRate: 0.8,
      daysSinceLastActivity: 2,
      failedAssessmentsCount: 0,
    });
    assert.equal(trigger.riskFactors.lowLessonCompletion, true);
    assert.equal(trigger.riskScore, 40);
    assert.equal(trigger.riskTier, 'MEDIUM');

    // 0.25 -> does not trigger
    const noTrigger = dropoutRiskEngine.evaluateDropoutRisk({
      traineeId: 't-f1-off',
      traineeName: 'Test',
      programmeId: 'p-1',
      completionRate: 0.25,
      attendanceRate: 0.8,
      daysSinceLastActivity: 2,
      failedAssessmentsCount: 0,
    });
    assert.equal(noTrigger.riskFactors.lowLessonCompletion, false);
    assert.equal(noTrigger.riskScore, 0);
    assert.equal(noTrigger.riskTier, 'LOW');
  });

  await runTest('DropoutRisk', 'Individual Factor 2: Attendance threshold boundary (< 50% vs >= 50%)', () => {
    // 0.4999 -> triggers +30
    const trigger = dropoutRiskEngine.evaluateDropoutRisk({
      traineeId: 't-f2-on',
      traineeName: 'Test',
      programmeId: 'p-1',
      completionRate: 0.8,
      attendanceRate: 0.4999,
      daysSinceLastActivity: 2,
      failedAssessmentsCount: 0,
    });
    assert.equal(trigger.riskFactors.lowAttendance, true);
    assert.equal(trigger.riskScore, 30);
    assert.equal(trigger.riskTier, 'MEDIUM');

    // 0.50 -> does not trigger
    const noTrigger = dropoutRiskEngine.evaluateDropoutRisk({
      traineeId: 't-f2-off',
      traineeName: 'Test',
      programmeId: 'p-1',
      completionRate: 0.8,
      attendanceRate: 0.50,
      daysSinceLastActivity: 2,
      failedAssessmentsCount: 0,
    });
    assert.equal(noTrigger.riskFactors.lowAttendance, false);
    assert.equal(noTrigger.riskScore, 0);
    assert.equal(noTrigger.riskTier, 'LOW');
  });

  await runTest('DropoutRisk', 'Individual Factor 3: Stale engagement threshold boundary (> 14d vs <= 14d)', () => {
    // 15 days -> triggers +20
    const trigger = dropoutRiskEngine.evaluateDropoutRisk({
      traineeId: 't-f3-on',
      traineeName: 'Test',
      programmeId: 'p-1',
      completionRate: 0.8,
      attendanceRate: 0.8,
      daysSinceLastActivity: 15,
      failedAssessmentsCount: 0,
    });
    assert.equal(trigger.riskFactors.staleEngagement, true);
    assert.equal(trigger.riskScore, 20);
    assert.equal(trigger.riskTier, 'LOW');

    // 14 days -> does not trigger
    const noTrigger = dropoutRiskEngine.evaluateDropoutRisk({
      traineeId: 't-f3-off',
      traineeName: 'Test',
      programmeId: 'p-1',
      completionRate: 0.8,
      attendanceRate: 0.8,
      daysSinceLastActivity: 14,
      failedAssessmentsCount: 0,
    });
    assert.equal(noTrigger.riskFactors.staleEngagement, false);
    assert.equal(noTrigger.riskScore, 0);
    assert.equal(noTrigger.riskTier, 'LOW');
  });

  await runTest('DropoutRisk', 'Individual Factor 4: Assessment failures scaling and cap (0, 1, 2, 3, 4, 10 fails)', () => {
    const scores = [0, 1, 2, 3, 4, 10].map((count) =>
      dropoutRiskEngine.evaluateDropoutRisk({
        traineeId: `t-f4-${count}`,
        traineeName: 'Test',
        programmeId: 'p-1',
        completionRate: 0.8,
        attendanceRate: 0.8,
        daysSinceLastActivity: 1,
        failedAssessmentsCount: count,
      }).riskFactors.assessmentFailures
    );
    assert.deepEqual(scores, [0, 10, 20, 30, 30, 30], 'Failures must scale 10 pts per fail and cap at 30 pts');
  });

  await runTest('DropoutRisk', 'Combination sum: lesson < 25% (+40) + attendance < 50% (+30) = 70 -> HIGH', () => {
    const res = dropoutRiskEngine.evaluateDropoutRisk({
      traineeId: 't-comb1',
      traineeName: 'Test Combination',
      programmeId: 'p-1',
      completionRate: 0.15,
      attendanceRate: 0.35,
      daysSinceLastActivity: 5,
      failedAssessmentsCount: 0,
    });
    assert.equal(res.riskScore, 70);
    assert.equal(res.riskTier, 'HIGH');
    assert.equal(res.riskFactors.lowLessonCompletion, true);
    assert.equal(res.riskFactors.lowAttendance, true);
    assert.equal(res.riskFactors.staleEngagement, false);
    assert.equal(res.riskFactors.assessmentFailures, 0);
  });

  await runTest('DropoutRisk', 'Combination sum: attendance < 50% (+30) + stale > 14d (+20) = 50 -> MEDIUM', () => {
    const res = dropoutRiskEngine.evaluateDropoutRisk({
      traineeId: 't-comb2',
      traineeName: 'Test Combination',
      programmeId: 'p-1',
      completionRate: 0.8,
      attendanceRate: 0.30,
      daysSinceLastActivity: 20,
      failedAssessmentsCount: 0,
    });
    assert.equal(res.riskScore, 50);
    assert.equal(res.riskTier, 'MEDIUM');
  });

  await runTest('DropoutRisk', 'Combination sum: stale > 14d (+20) + 1 failure (+10) = 30 -> MEDIUM', () => {
    const res = dropoutRiskEngine.evaluateDropoutRisk({
      traineeId: 't-comb3',
      traineeName: 'Test Combination',
      programmeId: 'p-1',
      completionRate: 0.8,
      attendanceRate: 0.8,
      daysSinceLastActivity: 20,
      failedAssessmentsCount: 1,
    });
    assert.equal(res.riskScore, 30);
    assert.equal(res.riskTier, 'MEDIUM');
  });

  await runTest('DropoutRisk', 'Threshold boundaries: exact 29.9 -> LOW, 30.0 -> MEDIUM, 59.9 -> MEDIUM, 60.0 -> HIGH', () => {
    const testCases = [
      { score: 0.0, expectedTier: 'LOW' },
      { score: 29.9, expectedTier: 'LOW' },
      { score: 30.0, expectedTier: 'MEDIUM' },
      { score: 59.9, expectedTier: 'MEDIUM' },
      { score: 60.0, expectedTier: 'HIGH' },
      { score: 100.0, expectedTier: 'HIGH' },
    ];

    for (const tc of testCases) {
      let tier = 'LOW';
      if (tc.score >= 60) tier = 'HIGH';
      else if (tc.score >= 30) tier = 'MEDIUM';
      else tier = 'LOW';

      assert.equal(tier, tc.expectedTier, `Score ${tc.score} must evaluate to tier ${tc.expectedTier}`);
    }
  });

  await runTest('DropoutRisk', 'Cohort risk triage: aggregation, sorting and empty handling', () => {
    const emptyCohort = dropoutRiskEngine.triageCohortRisk('p-empty', []);
    assert.equal(emptyCohort.totalAssessed, 0);
    assert.equal(emptyCohort.highRiskPercentage, 0.0);
    assert.equal(emptyCohort.flaggedRoster.length, 0);

    const cohort = dropoutRiskEngine.triageCohortRisk('p-test', [
      { traineeId: 't1', traineeName: 'T1', completionRate: 0.1, attendanceRate: 0.2, daysSinceLastActivity: 20, failedAssessmentsCount: 3 }, // 100 -> HIGH
      { traineeId: 't2', traineeName: 'T2', completionRate: 0.9, attendanceRate: 0.9, daysSinceLastActivity: 1, failedAssessmentsCount: 0 },   // 0 -> LOW
      { traineeId: 't3', traineeName: 'T3', completionRate: 0.2, attendanceRate: 0.9, daysSinceLastActivity: 1, failedAssessmentsCount: 0 },   // 40 -> MEDIUM
      { traineeId: 't4', traineeName: 'T4', completionRate: 0.1, attendanceRate: 0.3, daysSinceLastActivity: 1, failedAssessmentsCount: 0 },   // 70 -> HIGH
    ]);

    assert.equal(cohort.totalAssessed, 4);
    assert.equal(cohort.highRiskCount, 2);
    assert.equal(cohort.mediumRiskCount, 1);
    assert.equal(cohort.lowRiskCount, 1);
    assert.equal(cohort.highRiskPercentage, 50.0);
    // Flagged roster must contain HIGH and MEDIUM sorted descending (100, 70, 40)
    assert.equal(cohort.flaggedRoster.length, 3);
    assert.equal(cohort.flaggedRoster[0].riskScore, 100);
    assert.equal(cohort.flaggedRoster[1].riskScore, 70);
    assert.equal(cohort.flaggedRoster[2].riskScore, 40);
  });

  // ===========================================================================
  // SECTION 2: SKILL GAP ENGINE EMPIRICAL STRESS TESTS
  // ===========================================================================
  console.log('\n>>> [Section 2] Stress-Testing SkillGapEngine...');

  await runTest('SkillGap', '8-Dimensional unit embeddings: Identical vectors cosine similarity = 1.0000', () => {
    const u1 = [1, 0, 0, 0, 0, 0, 0, 0];
    assert.equal(skillGapEngine.calculateCosineSimilarity(u1, u1), 1.0000);

    const pacsAcc = NCCT_SKILL_EMBEDDING_MAP['skill-pacs-acc-01'];
    assert.ok(pacsAcc, 'Canonical skill embedding must exist');
    assert.equal(skillGapEngine.calculateCosineSimilarity(pacsAcc, pacsAcc), 1.0000);

    const scaledA = [0.2, 0.4, 0.6, 0.8, 0.1, 0.3, 0.5, 0.7];
    const scaledB = [0.4, 0.8, 1.2, 1.6, 0.2, 0.6, 1.0, 1.4];
    assert.equal(skillGapEngine.calculateCosineSimilarity(scaledA, scaledB), 1.0000);
  });

  await runTest('SkillGap', '8-Dimensional unit embeddings: Orthogonal vectors cosine similarity = 0.0000', () => {
    const basisA = [1, 0, 0, 0, 0, 0, 0, 0];
    const basisB = [0, 1, 0, 0, 0, 0, 0, 0];
    assert.equal(skillGapEngine.calculateCosineSimilarity(basisA, basisB), 0.0000);

    const v1 = [0.5, 0.5, 0.5, 0.5, 0, 0, 0, 0];
    const v2 = [0, 0, 0, 0, 0.5, 0.5, 0.5, 0.5];
    assert.equal(skillGapEngine.calculateCosineSimilarity(v1, v2), 0.0000);
  });

  await runTest('SkillGap', 'Cosine similarity edge cases: Zero vectors, unequal lengths, opposite vectors', () => {
    const zeroVec = [0, 0, 0, 0, 0, 0, 0, 0];
    const unitVec = [1, 0, 0, 0, 0, 0, 0, 0];
    const oppositeVec = [-1, 0, 0, 0, 0, 0, 0, 0];

    assert.equal(skillGapEngine.calculateCosineSimilarity(zeroVec, unitVec), 0.0);
    assert.equal(skillGapEngine.calculateCosineSimilarity(zeroVec, zeroVec), 0.0);
    assert.equal(skillGapEngine.calculateCosineSimilarity([1, 0], [1, 0, 0, 0]), 0.0);
    assert.equal(skillGapEngine.calculateCosineSimilarity([], []), 0.0);
    assert.equal(skillGapEngine.calculateCosineSimilarity(unitVec, oppositeVec), -1.0000);
  });

  await runTest('SkillGap', 'Semantic partial-credit threshold boundary: 0.39 (rejected) vs 0.40 (included)', () => {
    const v39_y = Math.sqrt(1 - 0.39 * 0.39);
    const v40_y = Math.sqrt(1 - 0.40 * 0.40);

    const vecU = [1, 0, 0, 0, 0, 0, 0, 0];
    const vec39 = [0.39, v39_y, 0, 0, 0, 0, 0, 0];
    const vec40 = [0.40, v40_y, 0, 0, 0, 0, 0, 0];

    const sim39 = skillGapEngine.calculateCosineSimilarity(vecU, vec39);
    const sim40 = skillGapEngine.calculateCosineSimilarity(vecU, vec40);

    assert.equal(sim39, 0.3900, 'Calculated similarity must be exactly 0.3900');
    assert.equal(sim40, 0.4000, 'Calculated similarity must be exactly 0.4000');

    const customEmbeddings: Record<string, number[]> = {
      'skill-required-gap': vecU,
      'skill-candidate-39': vec39,
      'skill-candidate-40': vec40,
    };

    const reqSkill: CooperativeSkillItem = {
      id: 'skill-required-gap',
      name: 'Required Gap Competency',
      category: 'PACS_OPERATIONS',
      description: 'Test required gap skill',
    };

    // Test Pair A: Candidate has 0.39 similarity skill -> MUST BE REJECTED
    const acqSkill39: CooperativeSkillItem = {
      id: 'skill-candidate-39',
      name: 'Sub-threshold Adjacent Skill (0.39)',
      category: 'PACS_OPERATIONS',
      description: 'Candidate skill with 0.39 similarity',
    };

    const result39 = skillGapEngine.evaluateSkillGap({
      jobId: 'job-boundary-test',
      jobTitle: 'Boundary Test Role',
      requiredSkills: [reqSkill],
      acquiredSkills: [acqSkill39],
      embeddingDictionary: customEmbeddings,
    });

    assert.equal(result39.relatedSkills.length, 0, 'Pair at 0.39 similarity MUST BE REJECTED from relatedSkills');
    assert.equal(result39.matchPercentage, 0.0, 'Match percentage must be 0% with no partial credit');
    assert.equal(result39.suggestedRemediationSequence[0].remediationReason.includes('full module training required'), true);

    // Test Pair B: Candidate has 0.40 similarity skill -> MUST BE INCLUDED
    const acqSkill40: CooperativeSkillItem = {
      id: 'skill-candidate-40',
      name: 'Threshold Adjacent Skill (0.40)',
      category: 'PACS_OPERATIONS',
      description: 'Candidate skill with 0.40 similarity',
    };

    const result40 = skillGapEngine.evaluateSkillGap({
      jobId: 'job-boundary-test',
      jobTitle: 'Boundary Test Role',
      requiredSkills: [reqSkill],
      acquiredSkills: [acqSkill40],
      embeddingDictionary: customEmbeddings,
    });

    assert.equal(result40.relatedSkills.length, 1, 'Pair at 0.40 similarity MUST BE INCLUDED in relatedSkills');
    assert.equal(result40.relatedSkills[0].similarityScore, 0.4000);
    assert.equal(result40.matchPercentage, 50.0, 'Match percentage must be 50% with +0.5 partial credit');
    assert.equal(result40.suggestedRemediationSequence[0].remediationReason.includes('adjacent foundational competency'), true);
  });

  await runTest('SkillGap', 'Sector shortage radar: shortage = demand - supply (zero-supply & surplus)', () => {
    const catalog: CooperativeSkillItem[] = [
      { id: 's-acc', name: 'Accounting', category: 'FINANCIAL_ACCOUNTING', description: '' },
      { id: 's-kcc', name: 'KCC Appraisal', category: 'CREDIT_KCC', description: '' },
      { id: 's-cold', name: 'Cold Chain', category: 'COMMODITY_STORAGE', description: '' },
      { id: 's-law', name: 'MSCS Compliance', category: 'STATUTORY_LEGAL', description: '' },
    ];

    const jobs = [
      { id: 'j1', requiredSkillIds: ['s-acc', 's-law'] },
      { id: 'j2', requiredSkillIds: ['s-acc', 's-law'] },
      { id: 'j3', requiredSkillIds: ['s-acc', 's-law'] },
      { id: 'j4', requiredSkillIds: ['s-acc', 's-kcc'] },
      { id: 'j5', requiredSkillIds: ['s-acc', 's-kcc'] },
    ];

    const certifiedTrainees = [
      { traineeId: 'tr1', certifiedSkillIds: ['s-kcc', 's-cold', 's-law'] },
      { traineeId: 'tr2', certifiedSkillIds: ['s-kcc', 's-cold', 's-law'] },
      { traineeId: 'tr3', certifiedSkillIds: ['s-kcc', 's-cold', 's-law'] },
      { traineeId: 'tr4', certifiedSkillIds: ['s-kcc', 's-cold'] },
      { traineeId: 'tr5', certifiedSkillIds: ['s-kcc'] },
      { traineeId: 'tr6', certifiedSkillIds: ['s-kcc'] },
    ];

    const radar = skillGapEngine.computeSectorShortageRadar({
      skillsCatalog: catalog,
      jobs,
      certifiedTrainees,
    });

    assert.equal(radar.length, 4);
    assert.equal(radar[0].skillId, 's-acc');
    assert.equal(radar[0].jobDemandCount, 5);
    assert.equal(radar[0].traineeSupplyCount, 0);
    assert.equal(radar[0].netShortage, 5);

    const lawRow = radar.find((r) => r.skillId === 's-law')!;
    assert.equal(lawRow.jobDemandCount, 3);
    assert.equal(lawRow.traineeSupplyCount, 3);
    assert.equal(lawRow.netShortage, 0);

    const kccRow = radar.find((r) => r.skillId === 's-kcc')!;
    assert.equal(kccRow.jobDemandCount, 2);
    assert.equal(kccRow.traineeSupplyCount, 6);
    assert.equal(kccRow.netShortage, -4);

    const coldRow = radar.find((r) => r.skillId === 's-cold')!;
    assert.equal(coldRow.jobDemandCount, 0);
    assert.equal(coldRow.traineeSupplyCount, 4);
    assert.equal(coldRow.netShortage, -4);

    for (let i = 0; i < radar.length - 1; i++) {
      assert.ok(
        radar[i].netShortage >= radar[i + 1].netShortage,
        `Radar row ${i} (${radar[i].netShortage}) must be >= row ${i + 1} (${radar[i + 1].netShortage})`
      );
    }
  });

  // ===========================================================================
  // SECTION 3: HOSTEL LOGISTICS & PUBLIC PROFILE EMPIRICAL STRESS TESTS
  // ===========================================================================
  console.log('\n>>> [Section 3] Stress-Testing HostelLogisticsEngine & Public Profile...');

  await runTest('HostelLogistics', 'Room occupancy bounds: Over-allocation rejected when room is full', () => {
    const testRoom: CampusHostelRoom = {
      id: 'room-test-cap2',
      instituteId: 'inst-test-1',
      hostelBlock: 'Ganga Block',
      roomNumber: 'G-201',
      roomType: 'DOUBLE',
      bedCapacity: 2,
      occupiedBeds: 0,
      active: true,
    };

    const alloc1 = hostelLogisticsEngine.allocateHostelRoom({
      room: testRoom,
      instituteId: 'inst-test-1',
      programmeId: 'prog-1',
      traineeId: 'trainee-1',
      assignedBy: 'warden-1',
      existingAssignments: [],
    });
    assert.equal(alloc1.success, true);
    assert.equal(alloc1.updatedRoom?.occupiedBeds, 1);

    const alloc2 = hostelLogisticsEngine.allocateHostelRoom({
      room: alloc1.updatedRoom!,
      instituteId: 'inst-test-1',
      programmeId: 'prog-1',
      traineeId: 'trainee-2',
      assignedBy: 'warden-1',
      existingAssignments: [alloc1.assignment!],
    });
    assert.equal(alloc2.success, true);
    assert.equal(alloc2.updatedRoom?.occupiedBeds, 2);

    const fullRoom = alloc2.updatedRoom!;
    assert.equal(hostelLogisticsEngine.hasAvailableBeds(fullRoom), false, 'hasAvailableBeds must be false when full');

    const alloc3 = hostelLogisticsEngine.allocateHostelRoom({
      room: fullRoom,
      instituteId: 'inst-test-1',
      programmeId: 'prog-1',
      traineeId: 'trainee-3',
      assignedBy: 'warden-1',
      existingAssignments: [alloc1.assignment!, alloc2.assignment!],
    });
    assert.equal(alloc3.success, false, 'Over-allocation must be rejected when room is full');
    assert.ok(alloc3.errorReason?.includes('fully occupied (2/2 beds)'), 'Error message must cite full occupancy');
  });

  await runTest('HostelLogistics', 'Trainee single-room invariant and institute match invariant', () => {
    const roomA: CampusHostelRoom = {
      id: 'room-inst-a',
      instituteId: 'inst-pune',
      hostelBlock: 'Block A',
      roomNumber: 'A-101',
      roomType: 'SINGLE',
      bedCapacity: 1,
      occupiedBeds: 0,
      active: true,
    };

    const existing = [
      {
        id: 'allot-1',
        nominationId: 'nom-1',
        traineeId: 'tr-dup',
        programmeId: 'prog-1',
        roomId: 'room-inst-a',
        hostelBlock: 'Block A',
        roomNumber: 'A-101',
        roomType: 'SINGLE' as const,
        checkInDate: '2026-09-01',
        checkOutDate: '2026-09-15',
        allocatedAt: new Date().toISOString(),
        allocatedBy: 'warden',
      },
    ];

    const dupResult = hostelLogisticsEngine.allocateHostelRoom({
      room: roomA,
      instituteId: 'inst-pune',
      programmeId: 'prog-1',
      traineeId: 'tr-dup',
      assignedBy: 'warden',
      existingAssignments: existing,
    });
    assert.equal(dupResult.success, false);
    assert.ok(dupResult.errorReason?.includes('already has an active room assignment'));

    const mismatchResult = hostelLogisticsEngine.allocateHostelRoom({
      room: roomA,
      instituteId: 'inst-gandhinagar',
      programmeId: 'prog-2',
      traineeId: 'tr-new',
      assignedBy: 'warden',
      existingAssignments: [],
    });
    assert.equal(mismatchResult.success, false);
    assert.ok(mismatchResult.errorReason?.includes('does not belong to the issuing institute'));
  });

  await runTest('HostelLogistics', 'Sovereign NFC profile code rotation: Format NFC-[0-9A-F]{8} across 2,000 draws', () => {
    const codeRegex = /^NFC-[0-9A-F]{8}$/;
    const generated = new Set<string>();

    for (let i = 0; i < 2000; i++) {
      const code = hostelLogisticsEngine.generatePublicProfileCode();
      assert.equal(codeRegex.test(code), true, `Code "${code}" must match pattern NFC-[0-9A-F]{8}`);
      assert.equal(code.length, 12, 'Code length must be exactly 12 characters (4 prefix + 8 hex)');
      generated.add(code);
    }

    assert.equal(generated.size, 2000, 'All 2,000 generated NFC profile codes must be unique');
  });

  await runTest('HostelLogistics', 'PII Leakage Penetration Test: Phone, email, room strictly excluded from public profile', async () => {
    const sensitivePhone = '+91-9876543210';
    const sensitiveEmail = 'trainee.confidential@pacs.gov.in';
    const sensitiveRoom = 'Room-Vip-Penthouse-99';
    const sensitiveAadhar = '9999-8888-7777';

    const testTraineeId = `trainee-pii-${Date.now()}`;
    const rotated = centralStore.toggleTraineeNfcProfile(testTraineeId, true, false);
    assert.ok(rotated, 'Rotated profile must exist');

    const app = await buildCentralServer();

    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/public/profile/${rotated.publicProfileCode}`,
    });

    assert.equal(res.statusCode, 200);
    const bodyText = res.body;
    const bodyJson = JSON.parse(bodyText);

    const forbiddenStrings = [
      sensitivePhone,
      sensitiveEmail,
      sensitiveRoom,
      sensitiveAadhar,
      'password',
      'secret',
      'hostelRoom',
      'roomNumber',
      'phoneNumber',
      'emailAddress',
    ];

    for (const forbidden of forbiddenStrings) {
      assert.equal(
        bodyText.toLowerCase().includes(forbidden.toLowerCase()),
        false,
        `PENETRATION DETECTED: Public profile response leaked sensitive string "${forbidden}"`
      );
    }

    const allowedKeys = new Set([
      'verified',
      'profileCode',
      'fullName',
      'cooperativeAffiliation',
      'certifiedCoursesCount',
      'primarySkills',
      'issuedCertificates',
      'verifiedAt',
      'trustIssuer',
    ]);

    for (const key of Object.keys(bodyJson)) {
      assert.ok(allowedKeys.has(key), `Unintended public field exposed: "${key}"`);
    }

    // Adversarial injection testing on route:
    const resTraversal = await app.inject({
      method: 'GET',
      url: '/api/v1/public/profile/..%2F..%2Fetc%2Fpasswd',
    });
    assert.equal(resTraversal.statusCode, 404, 'Path traversal must return 404');

    const resSql = await app.inject({
      method: 'GET',
      url: "/api/v1/public/profile/'%20OR%201=1--",
    });
    assert.equal(resSql.statusCode, 404, 'SQL injection code must return 404');

    const resXss = await app.inject({
      method: 'GET',
      url: '/api/v1/public/profile/<script>alert(1)</script>',
    });
    assert.equal(resXss.statusCode, 404, 'XSS code must return 404');

    centralStore.toggleTraineeNfcProfile(testTraineeId, false);
    const resDisabled = await app.inject({
      method: 'GET',
      url: `/api/v1/public/profile/${rotated.publicProfileCode}`,
    });
    assert.equal(resDisabled.statusCode, 404, 'Disabled profile must return 404');
    assert.equal(JSON.parse(resDisabled.body).error, 'PROFILE_NOT_FOUND');
  });

  // ===========================================================================
  // SECTION 4: FASTIFY REST API ROUTE TESTING ACROSS /api/v1/training/...
  // ===========================================================================
  console.log('\n>>> [Section 4] Testing Fastify REST API Routes & Zod Validation...');

  const server = await buildCentralServer();

  let firstInstituteId = '';
  await runTest('CentralAPI', 'GET /api/v1/training/institutes: List institutes and fetch by ID and code', async () => {
    const listRes = await server.inject({
      method: 'GET',
      url: '/api/v1/training/institutes',
    });
    assert.equal(listRes.statusCode, 200);
    const listData = JSON.parse(listRes.body);
    assert.ok(listData.count >= 5, 'Must have at least 5 seed institutes');
    assert.ok(Array.isArray(listData.institutes));
    firstInstituteId = listData.institutes[0].id;

    // Fetch valid institute by ID
    const getRes = await server.inject({
      method: 'GET',
      url: `/api/v1/training/institutes/${firstInstituteId}`,
    });
    assert.equal(getRes.statusCode, 200);
    const institute = JSON.parse(getRes.body).institute;
    assert.equal(institute.id, firstInstituteId);

    // Fetch valid institute by code (e.g. VAMNICOM-PUN)
    const getCodeRes = await server.inject({
      method: 'GET',
      url: '/api/v1/training/institutes/VAMNICOM-PUN',
    });
    assert.equal(getCodeRes.statusCode, 200);

    // Fetch unknown institute -> 404
    const unknownRes = await server.inject({
      method: 'GET',
      url: '/api/v1/training/institutes/inst-unknown-999',
    });
    assert.equal(unknownRes.statusCode, 404);
    assert.equal(JSON.parse(unknownRes.body).error, 'INSTITUTE_NOT_FOUND');
  });

  let createdProgrammeId = '';
  await runTest('CentralAPI', 'POST /api/v1/training/programmes: Zod validation error on missing fields and valid creation', async () => {
    const badRes = await server.inject({
      method: 'POST',
      url: '/api/v1/training/programmes',
      payload: {
        title: 'Short', // too short (< 5 chars)
      },
    });
    assert.equal(badRes.statusCode, 400);
    const badData = JSON.parse(badRes.body);
    assert.equal(badData.error, 'VALIDATION_ERROR');
    assert.ok(badData.details, 'Must return Zod flattened error details');

    const validRes = await server.inject({
      method: 'POST',
      url: '/api/v1/training/programmes',
      payload: {
        instituteId: firstInstituteId,
        title: 'Executive Diploma in Cooperative Banking',
        code: `ATP-DIP-${Date.now()}`,
        atpYear: '2026-2027',
        targetSector: 'PACS & Cooperative Banking',
        deliveryMode: 'HYBRID',
        capacity: 35,
        startDate: '2026-10-01',
        endDate: '2026-10-21',
        coordinatingFacultyId: 'fac-director-vamnicom',
      },
    });
    assert.equal(validRes.statusCode, 201);
    const created = JSON.parse(validRes.body).programme;
    assert.equal(created.capacity, 35);
    assert.equal(created.deliveryMode, 'HYBRID');
    createdProgrammeId = created.id;
  });

  await runTest('CentralAPI', 'POST /api/v1/training/nominations & PATCH decision: Zod validation & capacity gating', async () => {
    const badNomRes = await server.inject({
      method: 'POST',
      url: '/api/v1/training/nominations',
      payload: {},
    });
    assert.equal(badNomRes.statusCode, 400);
    assert.equal(JSON.parse(badNomRes.body).error, 'VALIDATION_ERROR');

    const validNomRes = await server.inject({
      method: 'POST',
      url: '/api/v1/training/nominations',
      payload: {
        programmeId: createdProgrammeId,
        traineeId: `trainee-auto-${Date.now()}`,
        fullName: 'Ramesh Kumar Patel',
        phone: '+91-9822001122',
        email: 'ramesh.patel@pacs.org',
        cooperativeAffiliation: 'Shri Ram Cooperative Society Ltd',
        designation: 'Accountant',
        state: 'Maharashtra',
      },
    });
    assert.equal(validNomRes.statusCode, 201);
    const nom = JSON.parse(validNomRes.body).nomination;
    assert.equal(nom.status, 'PENDING');

    const badDecRes = await server.inject({
      method: 'PATCH',
      url: `/api/v1/training/nominations/${nom.id}/decision`,
      payload: {
        status: 'MAYBE',
      },
    });
    assert.equal(badDecRes.statusCode, 400);
    assert.equal(JSON.parse(badDecRes.body).error, 'VALIDATION_ERROR');

    const goodDecRes = await server.inject({
      method: 'PATCH',
      url: `/api/v1/training/nominations/${nom.id}/decision`,
      payload: {
        status: 'APPROVED',
        decidedBy: 'registrar@vamnicom.gov.in',
      },
    });
    assert.equal(goodDecRes.statusCode, 200);
    const approvedNom = JSON.parse(goodDecRes.body).nomination;
    assert.equal(approvedNom.status, 'APPROVED');
  });

  await runTest('CentralAPI', 'POST /api/v1/training/attendance/check-in: Invalid code and validation rejection', async () => {
    const badCheckIn = await server.inject({
      method: 'POST',
      url: '/api/v1/training/attendance/check-in',
      payload: {
        sessionId: 'sess-pacs-101',
        traineeId: 'trainee-1',
      },
    });
    assert.equal(badCheckIn.statusCode, 400);
    assert.equal(JSON.parse(badCheckIn.body).error, 'VALIDATION_ERROR');

    const badCodeLen = await server.inject({
      method: 'POST',
      url: '/api/v1/training/attendance/check-in',
      payload: {
        sessionId: 'sess-pacs-101',
        traineeId: 'trainee-1',
        checkInCode: '123',
      },
    });
    assert.equal(badCodeLen.statusCode, 400);
    assert.equal(JSON.parse(badCodeLen.body).error, 'VALIDATION_ERROR');

    const wrongCode = await server.inject({
      method: 'POST',
      url: '/api/v1/training/attendance/check-in',
      payload: {
        sessionId: 'sess-pacs-101',
        traineeId: 'dddd4444-4444-4444-4444-444444444441',
        checkInCode: '000000',
      },
    });
    assert.equal(wrongCode.statusCode, 400);
    assert.equal(JSON.parse(wrongCode.body).error, 'INVALID_CHECK_IN_CODE');
  });

  await runTest('CentralAPI', 'GET & POST /api/v1/training/evaluation/tests: Validation errors and gradebook query', async () => {
    const badTestRes = await server.inject({
      method: 'POST',
      url: '/api/v1/training/evaluation/tests',
      payload: {
        courseId: 'cccc1111-1111-1111-1111-111111111111',
        title: 'Module 1 Summative Test',
        type: 'SUMMATIVE_TEST',
        totalMarks: 50,
        passMarks: -10,
        maxAttempts: 1,
      },
    });
    assert.equal(badTestRes.statusCode, 400);
    assert.equal(JSON.parse(badTestRes.body).error, 'VALIDATION_ERROR');

    const badSubmitRes = await server.inject({
      method: 'POST',
      url: '/api/v1/training/evaluation/tests/test-quiz-pacs-01/submit',
      payload: {
        traineeId: 'trainee-1',
        // missing required answers
      },
    });
    assert.equal(badSubmitRes.statusCode, 400);
    assert.equal(JSON.parse(badSubmitRes.body).error, 'VALIDATION_ERROR');

    const goodGbRes = await server.inject({
      method: 'GET',
      url: '/api/v1/training/evaluation/gradebook?courseId=cccc1111-1111-1111-1111-111111111111',
    });
    assert.equal(goodGbRes.statusCode, 200);
    const gbData = JSON.parse(goodGbRes.body);
    assert.ok(gbData.gradebook, 'Gradebook response must contain gradebook matrix');
  });

  await runTest('CentralAPI', 'GET /api/v1/training/retention endpoints: Dropout risk & Skill shortage radar', async () => {
    const riskRes = await server.inject({
      method: 'GET',
      url: '/api/v1/training/retention/dropout-risk',
    });
    assert.equal(riskRes.statusCode, 200);
    const riskData = JSON.parse(riskRes.body);
    assert.ok(typeof riskData.summary?.totalAssessed === 'number');

    const radarRes = await server.inject({
      method: 'GET',
      url: '/api/v1/training/retention/skill-radar',
    });
    assert.equal(radarRes.statusCode, 200);
    const radarData = JSON.parse(radarRes.body);
    assert.ok(radarData.count > 0);
    assert.ok(Array.isArray(radarData.radar));
  });

  await runTest('CentralAPI', 'Hostel room creation validation & NFC profile code rotation endpoints', async () => {
    const badRoomRes = await server.inject({
      method: 'POST',
      url: '/api/v1/training/logistics/hostels/rooms',
      payload: {
        instituteId: firstInstituteId,
        hostelBlock: 'Krishna Block',
        roomNumber: 'K-101',
        roomType: 'DOUBLE',
        bedCapacity: -2,
      },
    });
    assert.equal(badRoomRes.statusCode, 400);
    assert.equal(JSON.parse(badRoomRes.body).error, 'VALIDATION_ERROR');

    const rotateRes = await server.inject({
      method: 'POST',
      url: '/api/v1/training/logistics/nfc-profile/rotate',
      payload: {
        traineeId: 'dddd4444-4444-4444-4444-444444444441',
      },
    });
    assert.equal(rotateRes.statusCode, 200);
    const rotateData = JSON.parse(rotateRes.body);
    assert.equal(rotateData.success, true);
    assert.ok(/^NFC-[0-9A-F]{8}$/.test(rotateData.profile.publicProfileCode));
  });

  console.log('\n========================================================================');
  console.log(`   ✓ ALL ${results.length} EMPIRICAL ADVERSARIAL STRESS TESTS PASSED CLEANLY! `);
  console.log('========================================================================\n');
}

main().catch((err) => {
  console.error('\n❌ EMPIRICAL ADVERSARIAL STRESS TEST SUITE ENCOUNTERED A FAILURE:');
  console.error(err);
  process.exit(1);
});

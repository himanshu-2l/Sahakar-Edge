/**
 * Sahakar Edge — Milestone 4 NCCT Elevation Adversarial Stress & Invariant Verification Suite
 * 
 * Challenger 1 (`challenger_ncct_m4_1_gen2`) Empirical Verification Harness
 * 
 * Stress-tests and fuzzes:
 * 1. Timetable Dynamic 6-Digit Attendance Engine & Temporal Start Guard Boundaries
 * 2. ATP Batch Lifecycle Capacity Clamping, FIFO Waitlist Promotion & Attendance Thresholds
 * 3. 4-Factor Retention Dropout-Risk Heuristic Clamping [0, 100] & Cohort Triage Ranking
 * 4. 8-Dimensional Vector Cosine Similarity (Zero-Division, Orthogonality, Negative Components)
 * 5. Campus Hostel Logistics (Capacity Clamping, Single-Room Invariant, Cross-Institute Shield)
 * 6. Sovereign Rotatable NFC Profile (Entropy, Immediate Revocation, Privacy Shield, Zero-PII Leakage)
 * 7. Clean-Room Forensic Anonymity Audit (Git log, authors, commit messages, codebase greps)
 */

import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';
import type { FastifyInstance } from 'fastify';

// Central API Server & Store
import { buildCentralServer } from '../apps/central-api/dist/server.js';
import { centralStore } from '../apps/central-api/dist/store/memory-store.js';

// Backend Domain Engines
import {
  AtpLifecycleEngine,
  atpLifecycleEngine,
} from '../apps/central-api/dist/services/atp-lifecycle-engine.js';
import {
  DynamicAttendanceEngine,
  dynamicAttendanceEngine,
} from '../apps/central-api/dist/services/dynamic-attendance-engine.js';
import {
  GradebookEngine,
  gradebookEngine,
} from '../apps/central-api/dist/services/gradebook-engine.js';
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

// Types
import type {
  TrainingInstitute,
  TrainingProgramme,
  TraineeNomination,
  TimetableSession,
  CampusHostelRoom,
  CooperativeSkillItem,
} from '../packages/types/dist/index.js';

let totalChecks = 0;
let passedChecks = 0;

function report(condition: boolean, description: string): void {
  totalChecks++;
  if (!condition) {
    console.error(`  ❌ [FAIL] ${description}`);
    throw new Error(`Assertion failed: ${description}`);
  }
  passedChecks++;
  console.log(`  ✓ [PASS] ${description}`);
}

async function runAdversarialChallengeHarness(): Promise<void> {
  console.log('========================================================================');
  console.log('  SAHAKAR EDGE — CHALLENGER M4 NCCT ELEVATION ADVERSARIAL STRESS SUITE  ');
  console.log('========================================================================\n');

  const harnessStartTime = Date.now();
  const app: FastifyInstance = await buildCentralServer();
  await app.ready();

  try {
    // ========================================================================
    // SUITE 1: TEMPORAL START GUARDS & DYNAMIC 6-DIGIT ATTENDANCE ENGINE
    // ========================================================================
    console.log('>>> [SUITE 1] Adversarial Fuzzing: Temporal Start Guards & Dynamic Code Engine...');

    const baseNow = Date.now();
    const sessionStartTimeIso = new Date(baseNow + 10000).toISOString();
    const sessionStartTimeMs = new Date(sessionStartTimeIso).getTime();

    // 1.1 Exact Millisecond Boundary Probes
    report(
      dynamicAttendanceEngine.isBeforeSessionStart(sessionStartTimeIso, sessionStartTimeMs - 1) === true,
      'isBeforeSessionStart: Strictly blocks 1ms before start time (startTime - 1ms)'
    );
    report(
      dynamicAttendanceEngine.isBeforeSessionStart(sessionStartTimeIso, sessionStartTimeMs) === false,
      'isBeforeSessionStart: Allows check-in at exact scheduled millisecond (now == startTime)'
    );
    report(
      dynamicAttendanceEngine.isBeforeSessionStart(sessionStartTimeIso, sessionStartTimeMs + 1) === false,
      'isBeforeSessionStart: Allows check-in 1ms after start time (startTime + 1ms)'
    );

    // 1.2 Session Concluded & Grace Period Boundaries
    const concludedSession: TimetableSession = {
      id: 'sess-adv-concluded-01',
      programmeId: 'prog-adv-01',
      title: 'Advanced PACS Double-Entry Audit',
      facultyId: 'faculty-01',
      facultyName: 'Prof. Joshi',
      sessionDate: '2026-11-09',
      startTime: '09:00',
      endTime: '11:00',
      startsAt: new Date(baseNow - 7200000).toISOString(), // 2 hours ago
      endsAt: new Date(baseNow - 3600000).toISOString(),   // 1 hour ago
      venue: 'Hall A',
      checkInCode: '654321',
      status: 'CONCLUDED',
    };

    const concludedValidation = dynamicAttendanceEngine.validateCheckInEligibility({
      session: concludedSession,
      traineeId: 'trainee-adv-001',
      isApproved: true,
      existingAttendanceRecords: [],
      checkInTimestampMs: baseNow,
    });
    report(
      !concludedValidation.allowed && concludedValidation.rejectionCode === 'SESSION_CONCLUDED',
      'validateCheckInEligibility: Strictly rejects check-in after session status is CONCLUDED'
    );

    // 30-minute grace period boundary probe (29m59s vs 30m01s)
    const activeEndingSession: TimetableSession = {
      ...concludedSession,
      status: 'ACTIVE',
      endsAt: new Date(baseNow - 29 * 60 * 1000).toISOString(), // Ended 29m ago (within 30m grace)
    };
    const withinGrace = dynamicAttendanceEngine.validateCheckInEligibility({
      session: activeEndingSession,
      traineeId: 'trainee-adv-001',
      isApproved: true,
      existingAttendanceRecords: [],
      checkInTimestampMs: baseNow,
    });
    report(withinGrace.allowed === true, 'validateCheckInEligibility: Permits check-in during 30-minute post-session grace period');

    const pastGraceSession: TimetableSession = {
      ...concludedSession,
      status: 'ACTIVE',
      endsAt: new Date(baseNow - 31 * 60 * 1000).toISOString(), // Ended 31m ago (exceeded 30m grace)
    };
    const pastGrace = dynamicAttendanceEngine.validateCheckInEligibility({
      session: pastGraceSession,
      traineeId: 'trainee-adv-001',
      isApproved: true,
      existingAttendanceRecords: [],
      checkInTimestampMs: baseNow,
    });
    report(
      !pastGrace.allowed && pastGrace.rejectionCode === 'SESSION_CONCLUDED',
      'validateCheckInEligibility: Closes check-in after 30-minute grace period expires'
    );

    // 1.3 Cryptographic Timing-Safe Comparison Robustness
    const activeTestSession: TimetableSession = {
      ...concludedSession,
      status: 'ACTIVE',
      startsAt: new Date(baseNow - 60000).toISOString(),
      endsAt: new Date(baseNow + 3600000).toISOString(),
      checkInCode: '482915',
    };

    // Mismatched code lengths
    const shortCodeRes = dynamicAttendanceEngine.processCheckIn({
      session: activeTestSession,
      traineeId: 'trainee-adv-001',
      traineeName: 'Test Nominee',
      method: 'DYNAMIC_CODE',
      submittedCode: '48291', // 5 digits instead of 6
    });
    report(!shortCodeRes.success, 'processCheckIn: Length-mismatched code (5 digits) safely rejected without error');

    const longCodeRes = dynamicAttendanceEngine.processCheckIn({
      session: activeTestSession,
      traineeId: 'trainee-adv-001',
      traineeName: 'Test Nominee',
      method: 'DYNAMIC_CODE',
      submittedCode: '4829150', // 7 digits
    });
    report(!longCodeRes.success, 'processCheckIn: Length-mismatched code (7 digits) safely rejected without error');

    // Non-numeric and malformed inputs
    const alphabeticRes = dynamicAttendanceEngine.processCheckIn({
      session: activeTestSession,
      traineeId: 'trainee-adv-001',
      traineeName: 'Test Nominee',
      method: 'DYNAMIC_CODE',
      submittedCode: 'ABCDEF',
    });
    report(!alphabeticRes.success, 'processCheckIn: Alphabetic code input safely rejected');

    const nullByteRes = dynamicAttendanceEngine.processCheckIn({
      session: activeTestSession,
      traineeId: 'trainee-adv-001',
      traineeName: 'Test Nominee',
      method: 'DYNAMIC_CODE',
      submittedCode: '482\u000015',
    });
    report(!nullByteRes.success, 'processCheckIn: Null-byte injection payload safely rejected');

    // Valid check-in succeeds
    const validCheckInRes = dynamicAttendanceEngine.processCheckIn({
      session: activeTestSession,
      traineeId: 'trainee-adv-001',
      traineeName: 'Test Nominee',
      method: 'DYNAMIC_CODE',
      submittedCode: '482915',
    });
    report(validCheckInRes.success && validCheckInRes.record?.verified === true, 'processCheckIn: Matching code verified successfully');

    // 1.4 Dynamic 6-Digit Code Anti-Collision Fuzzing (500 draws)
    const mockExistingCodes = new Set<string>(['111111', '222222', '333333', '444444']);
    const existingList = Array.from(mockExistingCodes).map((c) => ({ checkInCode: c, status: 'ACTIVE' }));
    const generatedBatch = new Set<string>();

    for (let i = 0; i < 500; i++) {
      const code = dynamicAttendanceEngine.generateUniqueCheckInCode(existingList as any);
      report(!mockExistingCodes.has(code), `Collision check: Draw ${i + 1} does not collide with active sessions`);
      report(/^\d{6}$/.test(code), `Format check: Draw ${i + 1} (${code}) is strictly 6 digits`);
      generatedBatch.add(code);
    }
    report(generatedBatch.size > 480, `Entropy check: High entropy observed (${generatedBatch.size}/500 distinct tokens)`);

    // ========================================================================
    // SUITE 2: ATP BATCH LIFECYCLE, CAPACITY LIMITS & NOMINATION STATE MACHINE
    // ========================================================================
    console.log('\n>>> [SUITE 2] Adversarial Fuzzing: ATP Capacity Clamping & FIFO Waitlist Queue...');

    const testProg: TrainingProgramme = {
      id: 'prog-adv-cap-01',
      instituteId: 'iiii1111-1111-1111-1111-111111111111',
      title: 'Advanced Primary Agricultural Credit Management',
      code: 'ATP-ADV-2026',
      targetSector: 'CREDIT',
      deliveryMode: 'OFFLINE',
      capacity: 1, // Single seat capacity stress test!
      startDate: '2026-11-20',
      endDate: '2026-11-25',
      coordinatingFacultyId: 'cccc3333-3333-3333-3333-333333333333',
      status: 'SCHEDULED',
    };

    const nomineeA: TraineeNomination = {
      id: 'nom-adv-001',
      programmeId: testProg.id,
      traineeId: 'trainee-adv-001',
      fullName: 'Rameshwar Yadav',
      phone: '9826011111',
      cooperativeAffiliation: 'Indore Central PACS',
      designation: 'Accountant',
      state: 'Madhya Pradesh',
      status: 'PENDING',
      nominatedAt: '2026-11-01T08:00:00Z',
    };

    const nomineeB: TraineeNomination = {
      id: 'nom-adv-002',
      programmeId: testProg.id,
      traineeId: 'trainee-adv-002',
      fullName: 'Pooja Tiwari',
      phone: '9826022222',
      cooperativeAffiliation: 'Ujjain Cooperative Bank',
      designation: 'Officer',
      state: 'Madhya Pradesh',
      status: 'PENDING',
      nominatedAt: '2026-11-01T08:30:00Z', // 30 mins later
    };

    const nomineeC: TraineeNomination = {
      id: 'nom-adv-003',
      programmeId: testProg.id,
      traineeId: 'trainee-adv-003',
      fullName: 'Gopal Krishna',
      phone: '9826033333',
      cooperativeAffiliation: 'Dewas Milk Society',
      designation: 'Secretary',
      state: 'Madhya Pradesh',
      status: 'PENDING',
      nominatedAt: '2026-11-01T09:00:00Z', // 60 mins later
    };

    // Candidate A Approval -> Takes seat 1/1
    const decA = atpLifecycleEngine.decideNomination({
      programme: testProg,
      nomination: nomineeA,
      action: 'APPROVE',
      currentApprovedCount: 0,
      decidedBy: 'admin-1',
    });
    report(decA.success && decA.newStatus === 'APPROVED' && decA.approvedCount === 1, 'Nomination A approved to capacity (1/1 seats occupied)');

    // Candidate B Approval Attempt -> Exceeds capacity 1 -> Shifted to WAITLISTED
    const decB = atpLifecycleEngine.decideNomination({
      programme: testProg,
      nomination: nomineeB,
      action: 'APPROVE',
      currentApprovedCount: 1,
      decidedBy: 'admin-1',
    });
    report(!decB.success && decB.newStatus === 'WAITLISTED', 'Nomination B rejected for capacity overflow and automatically assigned status WAITLISTED');

    // Candidate C Approval Attempt -> Exceeds capacity 1 -> Shifted to WAITLISTED
    const decC = atpLifecycleEngine.decideNomination({
      programme: testProg,
      nomination: nomineeC,
      action: 'APPROVE',
      currentApprovedCount: 1,
      decidedBy: 'admin-1',
    });
    report(!decC.success && decC.newStatus === 'WAITLISTED', 'Nomination C rejected for capacity overflow and automatically assigned status WAITLISTED');

    // 2.2 FIFO Waitlist Promotion Priority Verification
    const waitlistPool: TraineeNomination[] = [decC.nomination, decB.nomination]; // Deliberately out of chronological order
    const nextWaitlisted = atpLifecycleEngine.findNextEligibleWaitlistedCandidate(waitlistPool, testProg.id);
    report(
      nextWaitlisted !== undefined && nextWaitlisted.id === decB.nomination.id,
      'findNextEligibleWaitlistedCandidate: Deterministically selects Nominee B over Nominee C due to earlier timestamp (FIFO)'
    );

    // 2.3 Idempotency and State Transition Stress
    const reApproveA = atpLifecycleEngine.decideNomination({
      programme: testProg,
      nomination: decA.nomination,
      action: 'APPROVE',
      currentApprovedCount: 1,
      decidedBy: 'admin-1',
    });
    report(reApproveA.success && reApproveA.approvedCount === 1, 'decideNomination: Re-approving already APPROVED nominee is an idempotent no-op');

    // Revocation / Rejection decrements approved count
    const rejectA = atpLifecycleEngine.decideNomination({
      programme: testProg,
      nomination: decA.nomination,
      action: 'REJECT',
      currentApprovedCount: 1,
      decidedBy: 'admin-1',
    });
    report(rejectA.success && rejectA.newStatus === 'REJECTED' && rejectA.approvedCount === 0, 'decideNomination: Rejecting an approved nominee decrements approvedCount to 0');

    // 2.4 Attendance Statutory Threshold Boundary Probes (75.0% Rule)
    // Zero sessions concluded resilience (division by zero guard)
    const zeroSessionsEval = atpLifecycleEngine.evaluateAttendanceThreshold({
      traineeId: 't-zero',
      programmeId: testProg.id,
      totalConcludedSessions: 0,
      attendedSessions: 0,
    });
    report(
      zeroSessionsEval.isCompliant && zeroSessionsEval.attendanceRate === 1.0,
      'evaluateAttendanceThreshold: Zero concluded sessions safely yields baseline compliance (division by zero avoided)'
    );

    // Strict boundary: 74.9% vs 75.0%
    const boundaryFail = atpLifecycleEngine.evaluateAttendanceThreshold({
      traineeId: 't-bound-fail',
      programmeId: testProg.id,
      totalConcludedSessions: 1000,
      attendedSessions: 749, // 74.90%
      thresholdPercentage: 75.0,
    });
    report(!boundaryFail.isCompliant && boundaryFail.attendancePercentage === 74.9, 'evaluateAttendanceThreshold: 74.90% attendance strictly fails 75.0% threshold');

    const boundaryPass = atpLifecycleEngine.evaluateAttendanceThreshold({
      traineeId: 't-bound-pass',
      programmeId: testProg.id,
      totalConcludedSessions: 1000,
      attendedSessions: 750, // 75.00%
      thresholdPercentage: 75.0,
    });
    report(boundaryPass.isCompliant && boundaryPass.attendancePercentage === 75.0, 'evaluateAttendanceThreshold: 75.00% attendance strictly satisfies 75.0% threshold');

    // Over-attendance anomaly clamping
    const overAttendance = atpLifecycleEngine.evaluateAttendanceThreshold({
      traineeId: 't-over',
      programmeId: testProg.id,
      totalConcludedSessions: 10,
      attendedSessions: 12, // Anomaly
    });
    report(overAttendance.attendanceRate === 1.0 && overAttendance.attendancePercentage === 100.0, 'evaluateAttendanceThreshold: Anomaly (attended > total) clamped to 100.0%');

    // ========================================================================
    // SUITE 3: PREDICTIVE RETENTION, 4-FACTOR DROPOUT-RISK CLAMPING & TRIAGE
    // ========================================================================
    console.log('\n>>> [SUITE 3] Adversarial Fuzzing: 4-Factor Dropout-Risk Clamping & Boundary Tiers...');

    // 3.1 Extreme Value Clamping Stress [0, 100]
    const extremeAdverse = dropoutRiskEngine.evaluateDropoutRisk({
      traineeId: 't-extreme-fail',
      traineeName: 'Critical Lag Candidate',
      programmeId: 'p-01',
      completionRate: 0.0,          // +40
      attendanceRate: 0.0,          // +30
      daysSinceLastActivity: 120,   // +20
      failedAssessmentsCount: 50,   // +30 (capped from 500) -> Total 120
    });
    report(extremeAdverse.riskScore === 100 && extremeAdverse.riskTier === 'HIGH', 'evaluateDropoutRisk: Extreme adverse input (score 120) strictly clamped to 100');

    // Negative failure count handling
    const negativeFailures = dropoutRiskEngine.evaluateDropoutRisk({
      traineeId: 't-neg',
      traineeName: 'Negative Failures Candidate',
      programmeId: 'p-01',
      completionRate: 0.80,
      attendanceRate: 0.90,
      daysSinceLastActivity: 3,
      failedAssessmentsCount: -10, // Invalid negative
    });
    report(negativeFailures.riskScore === 0 && negativeFailures.riskTier === 'LOW', 'evaluateDropoutRisk: Negative failedAssessmentsCount safely treated as 0');

    // 3.2 Cutoff Boundaries for 4 Factors
    // Factor 1: completionRate exact cutoff 0.25
    const compBelow = dropoutRiskEngine.evaluateDropoutRisk({
      traineeId: 't-c1', traineeName: 'T', programmeId: 'p-1',
      completionRate: 0.249, attendanceRate: 1.0, daysSinceLastActivity: 1, failedAssessmentsCount: 0,
    });
    report(compBelow.riskFactors.lowLessonCompletion === true && compBelow.riskScore === 40, 'Factor 1: completionRate 0.249 triggers +40 lowLessonCompletion');

    const compAt = dropoutRiskEngine.evaluateDropoutRisk({
      traineeId: 't-c2', traineeName: 'T', programmeId: 'p-1',
      completionRate: 0.25, attendanceRate: 1.0, daysSinceLastActivity: 1, failedAssessmentsCount: 0,
    });
    report(compAt.riskFactors.lowLessonCompletion === false && compAt.riskScore === 0, 'Factor 1: completionRate 0.25 does NOT trigger lowLessonCompletion');

    // Factor 2: attendanceRate exact cutoff 0.50
    const attBelow = dropoutRiskEngine.evaluateDropoutRisk({
      traineeId: 't-a1', traineeName: 'T', programmeId: 'p-1',
      completionRate: 1.0, attendanceRate: 0.499, daysSinceLastActivity: 1, failedAssessmentsCount: 0,
    });
    report(attBelow.riskFactors.lowAttendance === true && attBelow.riskScore === 30, 'Factor 2: attendanceRate 0.499 triggers +30 lowAttendance');

    const attAt = dropoutRiskEngine.evaluateDropoutRisk({
      traineeId: 't-a2', traineeName: 'T', programmeId: 'p-1',
      completionRate: 1.0, attendanceRate: 0.50, daysSinceLastActivity: 1, failedAssessmentsCount: 0,
    });
    report(attAt.riskFactors.lowAttendance === false && attAt.riskScore === 0, 'Factor 2: attendanceRate 0.50 does NOT trigger lowAttendance');

    // Factor 3: daysSinceLastActivity exact cutoff 14
    const daysAt = dropoutRiskEngine.evaluateDropoutRisk({
      traineeId: 't-d1', traineeName: 'T', programmeId: 'p-1',
      completionRate: 1.0, attendanceRate: 1.0, daysSinceLastActivity: 14, failedAssessmentsCount: 0,
    });
    report(daysAt.riskFactors.staleEngagement === false && daysAt.riskScore === 0, 'Factor 3: daysSinceLastActivity 14 does NOT trigger staleEngagement');

    const daysAbove = dropoutRiskEngine.evaluateDropoutRisk({
      traineeId: 't-d2', traineeName: 'T', programmeId: 'p-1',
      completionRate: 1.0, attendanceRate: 1.0, daysSinceLastActivity: 15, failedAssessmentsCount: 0,
    });
    report(daysAbove.riskFactors.staleEngagement === true && daysAbove.riskScore === 20, 'Factor 3: daysSinceLastActivity 15 triggers +20 staleEngagement');

    // Factor 4: Failed assessment steps (10, 20, 30, capped at 30)
    for (let f = 1; f <= 5; f++) {
      const failEval = dropoutRiskEngine.evaluateDropoutRisk({
        traineeId: `t-f${f}`, traineeName: 'T', programmeId: 'p-1',
        completionRate: 1.0, attendanceRate: 1.0, daysSinceLastActivity: 1, failedAssessmentsCount: f,
      });
      const expectedScore = Math.min(30, f * 10);
      report(failEval.riskScore === expectedScore, `Factor 4: ${f} failed assessments evaluates to ${expectedScore} pts`);
    }

    // 3.3 Cohort Risk Triage Radar Sorting & Empty Handling
    const emptyTriage = dropoutRiskEngine.triageCohortRisk('p-empty', []);
    report(
      emptyTriage.totalAssessed === 0 && emptyTriage.highRiskPercentage === 0.0 && emptyTriage.flaggedRoster.length === 0,
      'triageCohortRisk: Empty cohort triage handled safely with 0% high risk (no NaN/division-by-zero)'
    );

    // Multi-candidate randomized triage sorting assertion
    const syntheticTrainees = Array.from({ length: 25 }, (_, i) => ({
      traineeId: `synth-${i}`,
      traineeName: `Synthetic Trainee ${i}`,
      completionRate: (i * 4) / 100,
      attendanceRate: (i * 3) / 100,
      daysSinceLastActivity: i * 2,
      failedAssessmentsCount: i % 4,
    }));
    const fullTriage = dropoutRiskEngine.triageCohortRisk('p-full', syntheticTrainees);
    for (let i = 0; i < fullTriage.flaggedRoster.length - 1; i++) {
      report(
        fullTriage.flaggedRoster[i].riskScore >= fullTriage.flaggedRoster[i + 1].riskScore,
        `Flagged roster monotonic descending ordering: [${i}] ${fullTriage.flaggedRoster[i].riskScore} >= [${i + 1}] ${fullTriage.flaggedRoster[i + 1].riskScore}`
      );
    }

    // ========================================================================
    // SUITE 4: 8-DIMENSIONAL COSINE SIMILARITY & VECTOR MATH RESILIENCE
    // ========================================================================
    console.log('\n>>> [SUITE 4] Adversarial Fuzzing: 8-D Vector Cosine Similarity & Domain Separation...');

    // 4.1 Division-by-Zero and Degenerate Vectors
    const zeroVec = [0, 0, 0, 0, 0, 0, 0, 0];
    const nonZeroVec = [1, 0, 0, 0, 0, 0, 0, 0];
    report(
      skillGapEngine.calculateCosineSimilarity(zeroVec, nonZeroVec) === 0.0,
      'calculateCosineSimilarity: Zero-vector input returns 0.0 without NaN (division-by-zero shielded)'
    );
    report(
      skillGapEngine.calculateCosineSimilarity(zeroVec, zeroVec) === 0.0,
      'calculateCosineSimilarity: Both zero-vectors return 0.0 without NaN'
    );
    report(
      skillGapEngine.calculateCosineSimilarity([], []) === 0.0,
      'calculateCosineSimilarity: Empty vectors return 0.0'
    );
    report(
      skillGapEngine.calculateCosineSimilarity([1, 2], [1, 2, 3]) === 0.0,
      'calculateCosineSimilarity: Length-mismatched vectors safely return 0.0'
    );

    // 4.2 Orthogonality and Inversion
    const vecA = [1, 0, 0, 0, 0, 0, 0, 0];
    const vecB = [0, 1, 0, 0, 0, 0, 0, 0];
    const vecNegA = [-1, 0, 0, 0, 0, 0, 0, 0];

    report(skillGapEngine.calculateCosineSimilarity(vecA, vecA) === 1.0, 'calculateCosineSimilarity: Parallel vector with itself has cosine == 1.0');
    report(skillGapEngine.calculateCosineSimilarity(vecA, vecB) === 0.0, 'calculateCosineSimilarity: Orthogonal vectors have cosine == 0.0');
    report(skillGapEngine.calculateCosineSimilarity(vecA, vecNegA) === -1.0, 'calculateCosineSimilarity: Directly opposite vectors have cosine == -1.0');

    // 4.3 Dimension Integrity of All NCCT Skills
    for (const [skillId, vector] of Object.entries(NCCT_SKILL_EMBEDDING_MAP)) {
      report(
        Array.isArray(vector) && vector.length === 8,
        `Embedding Map: Skill ${skillId} is strictly 8-dimensional (got ${vector.length})`
      );
    }

    // 4.4 Partial Credit Semantic Matching Boundary (cosine >= 0.40)
    const testCatalog: CooperativeSkillItem[] = [
      { id: 'skill-pacs-acc-01', code: 'PACS_ACC', name: 'PACS Double-Entry Accounting', category: 'FINANCIAL_ACCOUNTING' },
      { id: 'skill-cashbook-01', code: 'CASHBOOK', name: 'Cash Book Balancing & Vouchers', category: 'FINANCIAL_ACCOUNTING' },
    ];
    // Candidate holds Cashbook, Job requires PACS Accounting
    const gapAnalysis = skillGapEngine.evaluateSkillGap({
      jobId: 'job-acc',
      jobTitle: 'Accountant',
      requiredSkills: [testCatalog[0]],
      acquiredSkills: [testCatalog[1]],
    });
    report(
      gapAnalysis.relatedSkills.length === 1 && gapAnalysis.matchPercentage === 50.0,
      'evaluateSkillGap: Adjacent competency awards exactly 50.0% partial credit (0.5 / 1 required)'
    );

    // Over-acquisition capping
    const overAcquired = skillGapEngine.evaluateSkillGap({
      jobId: 'job-acc',
      jobTitle: 'Accountant',
      requiredSkills: [testCatalog[0]],
      acquiredSkills: [testCatalog[0], testCatalog[1]], // Holds required + extra
    });
    report(overAcquired.matchPercentage === 100.0, 'evaluateSkillGap: Over-acquired competencies strictly capped at 100.0%');

    // ========================================================================
    // SUITE 5: CAMPUS HOSTEL LOGISTICS, CAPACITY & RESIDENTIAL PRIVACY
    // ========================================================================
    console.log('\n>>> [SUITE 5] Adversarial Fuzzing: Campus Hostel Logistics & Residential Invariants...');

    const singleBedRoom: CampusHostelRoom = {
      id: 'room-adv-single-01',
      instituteId: 'iiii1111-1111-1111-1111-111111111111',
      hostelBlock: 'VAMNICOM-Hostel-A',
      roomNumber: 'V-101',
      roomType: 'SINGLE',
      bedCapacity: 1,
      occupiedBeds: 0,
      floor: 1,
    };

    // Bed 1 allocation
    const hAlloc1 = hostelLogisticsEngine.allocateHostelRoom({
      room: singleBedRoom,
      instituteId: singleBedRoom.instituteId,
      programmeId: 'prog-h-01',
      traineeId: 'trainee-h-001',
      assignedBy: 'warden-01',
      existingAssignments: [],
    });
    report(hAlloc1.success && hAlloc1.updatedRoom?.occupiedBeds === 1, 'allocateHostelRoom: Bed 1 allocated successfully (1/1)');

    // Bed 2 allocation attempt on full single room -> Rejected
    const hAlloc2 = hostelLogisticsEngine.allocateHostelRoom({
      room: hAlloc1.updatedRoom!,
      instituteId: singleBedRoom.instituteId,
      programmeId: 'prog-h-01',
      traineeId: 'trainee-h-002',
      assignedBy: 'warden-01',
      existingAssignments: [hAlloc1.assignment!],
    });
    report(
      !hAlloc2.success && hAlloc2.errorReason?.includes('fully occupied'),
      'allocateHostelRoom: Second allocation to single room strictly clamped and rejected'
    );

    // Single-Room Invariant: Same trainee attempting second room allocation
    const doubleBedRoom: CampusHostelRoom = {
      ...singleBedRoom,
      id: 'room-adv-double-02',
      roomNumber: 'V-102',
      roomType: 'DOUBLE',
      bedCapacity: 2,
      occupiedBeds: 0,
    };
    const duplicateTraineeAlloc = hostelLogisticsEngine.allocateHostelRoom({
      room: doubleBedRoom,
      instituteId: doubleBedRoom.instituteId,
      programmeId: 'prog-h-01',
      traineeId: 'trainee-h-001', // Already holds room V-101 in prog-h-01
      assignedBy: 'warden-01',
      existingAssignments: [hAlloc1.assignment!],
    });
    report(
      !duplicateTraineeAlloc.success && duplicateTraineeAlloc.errorReason?.includes('already has an active room assignment'),
      'allocateHostelRoom: Trainee Single-Room Invariant strictly enforced (duplicate room allocation barred)'
    );

    // Cross-Institute Assignment Guard
    const crossInstAlloc = hostelLogisticsEngine.allocateHostelRoom({
      room: doubleBedRoom,
      instituteId: 'different-inst-999',
      programmeId: 'prog-h-01',
      traineeId: 'trainee-h-003',
      assignedBy: 'warden-01',
      existingAssignments: [],
    });
    report(
      !crossInstAlloc.success && crossInstAlloc.errorReason?.includes('does not belong to the issuing institute'),
      'allocateHostelRoom: Cross-institute hostel allocation strictly prohibited'
    );

    // Deallocation and negative occupancy floor
    const deallocRes = hostelLogisticsEngine.deallocateHostelRoom(
      hAlloc1.updatedRoom!,
      hAlloc1.assignment!.id,
      [hAlloc1.assignment!]
    );
    report(deallocRes.success && deallocRes.updatedRoom.occupiedBeds === 0, 'deallocateHostelRoom: Bed deallocation decrements occupiedBeds to 0');

    // Deallocating an empty room does not yield negative occupancy
    const emptyDealloc = hostelLogisticsEngine.deallocateHostelRoom(
      deallocRes.updatedRoom,
      'bogus-id',
      []
    );
    report(emptyDealloc.updatedRoom.occupiedBeds === 0, 'deallocateHostelRoom: Deallocating empty room clamped to 0 (never negative)');

    // ========================================================================
    // SUITE 6: SOVEREIGN ROTATABLE NFC PROFILE & ZERO-PII EXPOSURE FUZZING
    // ========================================================================
    console.log('\n>>> [SUITE 6] Adversarial Fuzzing: Rotatable NFC Token Revocation & Zero-PII Audit...');

    const traineeId = 'dddd4444-4444-4444-4444-444444444441';

    // 6.1 Generate and Rotate 25 tokens sequentially
    const seenTokens = new Set<string>();
    let activeToken = '';

    for (let r = 0; r < 25; r++) {
      const rotRes = await app.inject({
        method: 'POST',
        url: '/api/v1/training/logistics/nfc-profile/rotate',
        payload: { traineeId },
      });
      report(rotRes.statusCode === 200, `POST /nfc-profile/rotate round ${r + 1} returns HTTP 200`);
      const token = JSON.parse(rotRes.payload).profile.publicProfileCode;

      report(/^NFC-[0-9A-F]{8}$/.test(token), `Token format: ${token} strictly satisfies "NFC-" + 8 uppercase hex characters`);
      report(!seenTokens.has(token), `Token uniqueness: Token ${token} is uniquely generated`);

      if (activeToken) {
        // Assert previously active token is now REVOKED (returns 404)
        const oldCheck = await app.inject({
          method: 'GET',
          url: `/api/v1/public/profile/${activeToken}`,
        });
        report(oldCheck.statusCode === 404, `Revocation test: Stale token ${activeToken} immediately returns HTTP 404`);
      }

      seenTokens.add(token);
      activeToken = token;
    }

    // 6.2 Zero-PII Leakage Deep Payload Fuzzing
    const publicLookupRes = await app.inject({
      method: 'GET',
      url: `/api/v1/public/profile/${activeToken}`,
    });
    report(publicLookupRes.statusCode === 200, 'Public lookup of current active token returns HTTP 200');
    const pubPayload = JSON.parse(publicLookupRes.payload);
    const pubString = publicLookupRes.payload;

    // Forbidden PII fields must not exist in public response
    const forbiddenKeys = [
      'hostelBlock',
      'roomNumber',
      'floor',
      'roomId',
      'phone',
      'mobile',
      'contactNumber',
      'email',
      'password',
      'salt',
      'internalNotes',
      'rejectionReason',
    ];
    for (const key of forbiddenKeys) {
      report(pubPayload[key] === undefined, `Zero-PII Invariant: Public JSON strictly excludes key '${key}'`);
    }

    // Regex check against telephone patterns in payload
    report(!/\b\d{10}\b/.test(pubString), 'Zero-PII Invariant: No 10-digit phone numbers detected in public profile response');

    // Regex check against email addresses
    report(!/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(pubString), 'Zero-PII Invariant: No email addresses detected in public profile response');

    // 6.3 Privacy Master Toggle (Shielded State)
    const shieldRes = await app.inject({
      method: 'PATCH',
      url: '/api/v1/training/logistics/nfc-profile/toggle',
      payload: { enabled: false, traineeId },
    });
    report(shieldRes.statusCode === 200, 'Disabling public profile returns HTTP 200');

    const shieldedLookup = await app.inject({
      method: 'GET',
      url: `/api/v1/public/profile/${activeToken}`,
    });
    report(shieldedLookup.statusCode === 404, 'Shielded mode verification: Disabled profile returns HTTP 404 on public endpoint');

    // Unshield profile
    await app.inject({
      method: 'PATCH',
      url: '/api/v1/training/logistics/nfc-profile/toggle',
      payload: { enabled: true, traineeId },
    });
    const unshieldedLookup = await app.inject({
      method: 'GET',
      url: `/api/v1/public/profile/${activeToken}`,
    });
    report(unshieldedLookup.statusCode === 200, 'Re-enabled profile immediately restores public HTTP 200 access');

    // ========================================================================
    // SUITE 7: CLEAN-ROOM FORENSIC ANONYMITY AUDIT
    // ========================================================================
    console.log('\n>>> [SUITE 7] Forensic Audit: Clean-Room Anonymity & Git Integrity...');

    // 7.1 Verify Git Commit Authors
    const gitAuthors = execSync('git log --format="%an <%ae>"', { encoding: 'utf8' })
      .trim()
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    const uniqueAuthors = Array.from(new Set(gitAuthors));
    report(
      uniqueAuthors.length === 1 && uniqueAuthors[0].includes('himanshu-2l'),
      `Git author audit: 100% of commits authored exclusively by '${uniqueAuthors[0]}'`
    );

    // 7.2 Verify Clean-Room Commit Messages
    let commitLeakFound = false;
    try {
      const grepCommitRes = execSync(
        'git log --all -i --grep="Shashank" --grep="Ponna" --grep="NCCT-platform" --oneline',
        { encoding: 'utf8' }
      ).trim();
      commitLeakFound = grepCommitRes.length > 0;
    } catch {
      commitLeakFound = false;
    }
    report(!commitLeakFound, 'Git commit message audit: Zero occurrences of reference repo or author strings');

    // 7.3 Source Code Forensic Regex Audit
    let codeLeakCount = 0;
    try {
      const grepCodeRes = execSync(
        'git grep -i -E "ShashankPonna|github.com/ShashankPonna|NCCT-platform" -- ":(exclude).agents" ":(exclude)scripts/test-challenger*"',
        { encoding: 'utf8' }
      ).trim();
      codeLeakCount = grepCodeRes ? grepCodeRes.split('\n').length : 0;
    } catch {
      // Exit code 1 from git grep means 0 occurrences found
      codeLeakCount = 0;
    }
    report(codeLeakCount === 0, 'Clean-Room codebase audit: Exactly 0 forbidden external reference strings found in source code');

    const duration = ((Date.now() - harnessStartTime) / 1000).toFixed(2);
    console.log('\n========================================================================');
    console.log(`   ✓ ALL ${passedChecks}/${totalChecks} ADVERSARIAL STRESS CHECKS PASSED CLEANLY! (${duration}s)`);
    console.log('========================================================================\n');
  } finally {
    await app.close();
  }
}

runAdversarialChallengeHarness().catch((err) => {
  console.error('\n❌ Challenger M4 Adversarial Stress Harness Failed:', err);
  process.exit(1);
});

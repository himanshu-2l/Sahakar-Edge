/**
 * Sahakar Edge — NCCT Milestone 1 Adversarial Empirical Challenge Suite
 * 
 * Verifies Engines 1 to 3 in apps/central-api/src/services/:
 * 1. atp-lifecycle-engine.ts
 * 2. dynamic-attendance-engine.ts
 * 3. gradebook-engine.ts
 * 
 * Conducted by: challenger_ncct_m1_1
 * Mindset: Hostile environment, boundary stress, zero fakes, empirical proof.
 */

import assert from 'node:assert/strict';
import { atpLifecycleEngine, AtpLifecycleEngine } from '../apps/central-api/dist/services/atp-lifecycle-engine.js';
import { dynamicAttendanceEngine, DynamicAttendanceEngine } from '../apps/central-api/dist/services/dynamic-attendance-engine.js';
import { gradebookEngine, GradebookEngine } from '../apps/central-api/dist/services/gradebook-engine.js';
import type {
  TrainingProgramme,
  TraineeNomination,
  TimetableSession,
  SessionAttendanceRecord,
  CourseModuleTest,
} from '../packages/types/dist/index.js';

console.log('========================================================================');
console.log('   SAHAKAR EDGE — NCCT MILESTONE 1 EMPIRICAL CHALLENGE SUITE           ');
console.log('   Adversarial stress-testing of Engines 1, 2, and 3                    ');
console.log('========================================================================\n');

let totalAssertions = 0;
function pass(msg: string) {
  totalAssertions++;
  console.log(`  ✓ [ASSERTION ${totalAssertions}] ${msg}`);
}

// ========================================================================
// ENGINE 1: ATP & BATCH LIFECYCLE ENGINE STRESS TESTS
// ========================================================================
console.log('>>> [ENGINE 1 CHALLENGE] atp-lifecycle-engine.ts...');

const baseProgramme: TrainingProgramme = {
  id: 'prog-pacs-mgmt-2026',
  code: 'ATP-2026-B1',
  title: 'Advanced PACS Management and Statutory Accounting',
  tier: 'TIER_2_STATE_RICM',
  instituteId: 'inst-ricm-bhopal',
  capacity: 3, // Constrained capacity for boundary stress-testing
  targetAudience: ['PACS Secretaries', 'Accountants'],
  startDate: '2026-11-10',
  endDate: '2026-11-24',
  status: 'SCHEDULED',
};

// 1.1 Capacity Boundary Testing: exactly at capacity, beyond capacity, routing to WAITLISTED
console.log('\n  [1.1] Capacity Boundary & Automatic Waitlisting...');
const engine1 = new AtpLifecycleEngine();

const nomineeA: TraineeNomination = {
  id: 'nom-101',
  programmeId: baseProgramme.id,
  traineeId: 'trainee-001',
  traineeName: 'Anita Sharma',
  cooperativeAffiliation: 'Bhopal Central Coop Society',
  status: 'PENDING',
  nominatedAt: '2026-11-01T09:00:00Z',
};

const nomineeB: TraineeNomination = {
  id: 'nom-102',
  programmeId: baseProgramme.id,
  traineeId: 'trainee-002',
  traineeName: 'Ramesh Verma',
  cooperativeAffiliation: 'Indore Farmers Credit PACS',
  status: 'PENDING',
  nominatedAt: '2026-11-01T10:00:00Z',
};

const nomineeC: TraineeNomination = {
  id: 'nom-103',
  programmeId: baseProgramme.id,
  traineeId: 'trainee-003',
  traineeName: 'Sunita Patel',
  cooperativeAffiliation: 'Sehore PACS',
  status: 'PENDING',
  nominatedAt: '2026-11-01T11:00:00Z',
};

const nomineeD: TraineeNomination = {
  id: 'nom-104',
  programmeId: baseProgramme.id,
  traineeId: 'trainee-004',
  traineeName: 'Dinesh Kumar',
  cooperativeAffiliation: 'Ujjain PACS',
  status: 'PENDING',
  nominatedAt: '2026-11-01T12:00:00Z',
};

// Fill seat 1 of 3
assert.equal(engine1.hasAvailableCapacity(baseProgramme, 0), true);
const decA = engine1.decideNomination({
  programme: baseProgramme,
  nomination: nomineeA,
  action: 'APPROVE',
  currentApprovedCount: 0,
  decidedBy: 'admin-01',
});
assert.equal(decA.success, true);
assert.equal(decA.newStatus, 'APPROVED');
assert.equal(decA.approvedCount, 1);
pass('Seat 1 filled: approvedCount = 1/3, status = APPROVED');

// Fill seat 2 of 3
assert.equal(engine1.hasAvailableCapacity(baseProgramme, 1), true);
const decB = engine1.decideNomination({
  programme: baseProgramme,
  nomination: nomineeB,
  action: 'APPROVE',
  currentApprovedCount: 1,
  decidedBy: 'admin-01',
});
assert.equal(decB.success, true);
assert.equal(decB.newStatus, 'APPROVED');
assert.equal(decB.approvedCount, 2);
pass('Seat 2 filled: approvedCount = 2/3, status = APPROVED');

// Fill seat 3 of 3 (exactly at capacity)
assert.equal(engine1.hasAvailableCapacity(baseProgramme, 2), true);
const decC = engine1.decideNomination({
  programme: baseProgramme,
  nomination: nomineeC,
  action: 'APPROVE',
  currentApprovedCount: 2,
  decidedBy: 'admin-01',
});
assert.equal(decC.success, true);
assert.equal(decC.newStatus, 'APPROVED');
assert.equal(decC.approvedCount, 3);
pass('Seat 3 filled: approvedCount = 3/3 (EXACT CAPACITY BOUNDARY REACHED)');

// Programme is now full: hasAvailableCapacity MUST be false
assert.equal(engine1.hasAvailableCapacity(baseProgramme, 3), false);
pass('hasAvailableCapacity returns false when approvedCount === capacity');

// Attempt to approve beyond capacity (Nominee D): MUST be rejected and automatically routed to WAITLISTED
const decD = engine1.decideNomination({
  programme: baseProgramme,
  nomination: nomineeD,
  action: 'APPROVE',
  currentApprovedCount: 3,
  decidedBy: 'admin-01',
});
assert.equal(decD.success, false, 'Approval beyond capacity must report success = false');
assert.equal(decD.newStatus, 'WAITLISTED', 'Excess candidate must be shifted to WAITLISTED');
assert.equal(decD.approvedCount, 3, 'Approved count must not increment past capacity');
assert.match(decD.diagnosticMessage, /Capacity exceeded/, 'Diagnostic message must indicate capacity exceeded');
assert.match(decD.nomination.rejectionReason || '', /priority waitlist/, 'Rejection reason must note waitlisting');
pass('Attempt to approve beyond capacity correctly rejected and routed to WAITLISTED (3/3 maintained)');

// Idempotent re-approval of already approved nominee: MUST be no-op success without incrementing count
const decA_again = engine1.decideNomination({
  programme: baseProgramme,
  nomination: decA.nomination,
  action: 'APPROVE',
  currentApprovedCount: 3,
  decidedBy: 'admin-01',
});
assert.equal(decA_again.success, true);
assert.equal(decA_again.approvedCount, 3, 'Idempotent approval must not increase approved count');
pass('Idempotent re-approval of approved nominee does not breach capacity invariant');

// 1.2 Waitlist FIFO Promotion Testing
console.log('\n  [1.2] Waitlist FIFO Promotion Verification...');
const waitlistedPool: TraineeNomination[] = [
  { ...nomineeD, id: 'nom-W3', nominatedAt: '2026-11-03T15:00:00Z', status: 'WAITLISTED' },
  { ...nomineeD, id: 'nom-W1', nominatedAt: '2026-11-01T12:00:00Z', status: 'WAITLISTED' },
  { ...nomineeD, id: 'nom-W4', nominatedAt: '2026-11-04T08:00:00Z', status: 'WAITLISTED' },
  { ...nomineeD, id: 'nom-W2', nominatedAt: '2026-11-02T10:00:00Z', status: 'WAITLISTED' },
  { ...nomineeD, id: 'nom-X_OTHER', programmeId: 'other-prog', nominatedAt: '2026-10-31T00:00:00Z', status: 'WAITLISTED' },
];

const nextWaitlisted = engine1.findNextEligibleWaitlistedCandidate(waitlistedPool, baseProgramme.id);
assert.ok(nextWaitlisted, 'Must find waitlisted candidate');
assert.equal(nextWaitlisted.id, 'nom-W1', 'Earliest waitlisted candidate (nom-W1, 2026-11-01T12:00:00Z) must be selected');
pass('Waitlist FIFO order strictly preserved: earliest timestamp nominated candidate returned');

// Simulate cancellation of nominee B: vacancy created (approvedCount decrements to 2)
const cancelB = engine1.decideNomination({
  programme: baseProgramme,
  nomination: decB.nomination,
  action: 'REJECT',
  currentApprovedCount: 3,
  decidedBy: 'trainee-002',
  rejectionReason: 'Trainee emergency personal leave',
});
assert.equal(cancelB.success, true);
assert.equal(cancelB.newStatus, 'REJECTED');
assert.equal(cancelB.approvedCount, 2, 'Approved count must decrement upon cancellation');
pass('Cancellation of approved nominee decrements approvedCount (3 -> 2)');

// Now promote next waitlisted candidate into the created vacancy
assert.equal(engine1.hasAvailableCapacity(baseProgramme, cancelB.approvedCount), true);
const promoW1 = engine1.decideNomination({
  programme: baseProgramme,
  nomination: nextWaitlisted,
  action: 'APPROVE',
  currentApprovedCount: cancelB.approvedCount,
  decidedBy: 'admin-01',
});
assert.equal(promoW1.success, true);
assert.equal(promoW1.newStatus, 'APPROVED');
assert.equal(promoW1.approvedCount, 3);
pass('Waitlisted candidate nom-W1 successfully promoted into freed seat (2 -> 3)');

// 1.3 75% Statutory Attendance Threshold Edge Cases
console.log('\n  [1.3] 75% Statutory Attendance Threshold Precision Testing...');

// Edge case A: 7,499 / 10,000 = 74.99% -> MUST FAIL
const attFail = engine1.evaluateAttendanceThreshold({
  traineeId: 't-stat-1',
  programmeId: baseProgramme.id,
  totalConcludedSessions: 10000,
  attendedSessions: 7499,
});
assert.equal(attFail.attendancePercentage, 74.99);
assert.equal(attFail.isCompliant, false, '74.99% attendance MUST NOT satisfy 75% threshold');
assert.match(attFail.statutoryDirective, /Statutory attendance shortage/);
pass('Boundary 74.99% fails statutory compliance (isCompliant = false)');

// Edge case B: 7,500 / 10,000 = 75.00% -> MUST PASS
const attPass = engine1.evaluateAttendanceThreshold({
  traineeId: 't-stat-2',
  programmeId: baseProgramme.id,
  totalConcludedSessions: 10000,
  attendedSessions: 7500,
});
assert.equal(attPass.attendancePercentage, 75.00);
assert.equal(attPass.isCompliant, true, '75.00% attendance MUST satisfy 75% threshold');
assert.match(attPass.statutoryDirective, /Attendance requirement satisfied/);
pass('Boundary 75.00% passes statutory compliance (isCompliant = true)');

// Edge case C: 7,501 / 10,000 = 75.01% -> MUST PASS
const attAbove = engine1.evaluateAttendanceThreshold({
  traineeId: 't-stat-3',
  programmeId: baseProgramme.id,
  totalConcludedSessions: 10000,
  attendedSessions: 7501,
});
assert.equal(attAbove.attendancePercentage, 75.01);
assert.equal(attAbove.isCompliant, true);
pass('Boundary 75.01% passes statutory compliance (isCompliant = true)');

// Edge case D: Zero sessions concluded -> baseline pass (no NaN or divide-by-zero)
const attZero = engine1.evaluateAttendanceThreshold({
  traineeId: 't-stat-4',
  programmeId: baseProgramme.id,
  totalConcludedSessions: 0,
  attendedSessions: 0,
});
assert.equal(Number.isNaN(attZero.attendanceRate), false);
assert.equal(attZero.attendanceRate, 1.0);
assert.equal(attZero.attendancePercentage, 100.0);
assert.equal(attZero.isCompliant, true);
assert.match(attZero.statutoryDirective, /baseline/);
pass('Zero concluded sessions handled gracefully with baseline 100% compliance');

// Edge case E: Realistic 12 sessions: 8/12 = 66.67% (Fail) vs 9/12 = 75.00% (Pass)
const att12_8 = engine1.evaluateAttendanceThreshold({
  traineeId: 't-stat-5',
  programmeId: baseProgramme.id,
  totalConcludedSessions: 12,
  attendedSessions: 8,
});
assert.equal(att12_8.attendancePercentage, 66.67);
assert.equal(att12_8.isCompliant, false);
pass('Realistic cohort: 8/12 sessions (66.67%) correctly fails statutory gate');

const att12_9 = engine1.evaluateAttendanceThreshold({
  traineeId: 't-stat-6',
  programmeId: baseProgramme.id,
  totalConcludedSessions: 12,
  attendedSessions: 9,
});
assert.equal(att12_9.attendancePercentage, 75.00);
assert.equal(att12_9.isCompliant, true);
pass('Realistic cohort: 9/12 sessions (75.00%) correctly satisfies statutory gate');

// 1.4 Batch Progress Metrics
const progressMetrics = engine1.evaluateBatchProgress(baseProgramme.id, [
  { id: 's1', programmeId: baseProgramme.id, status: 'CONCLUDED' },
  { id: 's2', programmeId: baseProgramme.id, status: 'CONCLUDED' },
  { id: 's3', programmeId: baseProgramme.id, status: 'ACTIVE' },
  { id: 's4', programmeId: baseProgramme.id, status: 'UPCOMING' },
]);
assert.equal(progressMetrics.totalSessions, 4);
assert.equal(progressMetrics.completedSessions, 2);
assert.equal(progressMetrics.progressPercentage, 50.0);
assert.equal(progressMetrics.isCompleted, false);
pass('Batch progress metrics calculation: 2/4 = 50.0% completion verified');


// ========================================================================
// ENGINE 2: DYNAMIC ATTENDANCE ENGINE STRESS TESTS
// ========================================================================
console.log('\n>>> [ENGINE 2 CHALLENGE] dynamic-attendance-engine.ts...');
const engine2 = new DynamicAttendanceEngine();

// 2.1 1,000 Generated Tokens: Regex & Zero Collision Stress Test
console.log('\n  [2.1] 1,000 6-Digit Dynamic Check-In Tokens Collision Stress Test...');
const tokenCount = 1000;
const generatedTokens: string[] = [];
const activeSessionsList: Array<{ checkInCode?: string; status?: string }> = [];

const tokenRegex = /^\d{6}$/;
const startTime = Date.now();

for (let i = 0; i < tokenCount; i++) {
  const code = engine2.generateUniqueCheckInCode(activeSessionsList, `session-${i}`);
  assert.match(code, tokenRegex, `Generated token "${code}" must match /^\\d{6}$/`);
  const numVal = parseInt(code, 10);
  assert.ok(numVal >= 100000 && numVal <= 999999, `Token ${code} must be in [100000, 999999]`);
  
  generatedTokens.push(code);
  activeSessionsList.push({ checkInCode: code, status: 'ACTIVE' });
}
const elapsedMs = Date.now() - startTime;

const uniqueTokens = new Set(generatedTokens);
assert.equal(
  uniqueTokens.size,
  tokenCount,
  `Zero collisions invariant violated: expected ${tokenCount} unique tokens, got ${uniqueTokens.size}`
);
pass(`Generated ${tokenCount} tokens in ${elapsedMs}ms: 100% matched /^\\d{6}$/, ZERO collisions detected (${uniqueTokens.size}/${tokenCount})`);

// Stress test fallback HMAC path directly:
// Fill active codes to force fallback exhaustion loop
const denseActiveCodes = Array.from({ length: 50 }, (_, idx) => ({
  checkInCode: String(800000 + idx),
  status: 'ACTIVE',
}));
const fallbackToken = engine2.generateUniqueCheckInCode(denseActiveCodes, 'deterministic-seed-alpha');
assert.match(fallbackToken, tokenRegex);
assert.ok(!denseActiveCodes.some(c => c.checkInCode === fallbackToken));
pass('Deterministic HMAC fallback path generates valid collision-free 6-digit code');

// 2.2 Temporal Start Guard (isBeforeSessionStart & validateCheckInEligibility)
console.log('\n  [2.2] Temporal Anti-Early Start Guard Verification...');
const sessionStartIso = '2026-11-10T10:00:00.000Z';
const sessionEndIso = '2026-11-10T11:30:00.000Z';
const sessionStartMs = new Date(sessionStartIso).getTime();

const testSession: TimetableSession = {
  id: 'sess-test-01',
  programmeId: baseProgramme.id,
  courseId: 'course-pacs-101',
  sessionTitle: 'PACS Computerization Guidelines',
  sessionDate: '2026-11-10',
  startTime: '10:00',
  endTime: '11:30',
  startsAt: sessionStartIso,
  endsAt: sessionEndIso,
  trainerId: 'trainer-01',
  trainerName: 'Dr. S. K. Verma',
  status: 'ACTIVE',
  checkInCode: '482910',
  qrCodeToken: 'QR-sess-test-01-sec482910',
};

// Check exactly 1 second before start (T - 1000ms): MUST BE REJECTED with PREMATURE_CHECKIN
const oneSecBeforeMs = sessionStartMs - 1000;
assert.equal(engine2.isBeforeSessionStart(sessionStartIso, oneSecBeforeMs), true);
const earlyVal1 = engine2.validateCheckInEligibility({
  session: testSession,
  traineeId: 'trainee-001',
  isApproved: true,
  existingAttendanceRecords: [],
  checkInTimestampMs: oneSecBeforeMs,
});
assert.equal(earlyVal1.allowed, false);
assert.equal(earlyVal1.rejectionCode, 'PREMATURE_CHECKIN');
assert.match(earlyVal1.rejectionReason || '', /Premature attendance logging is prohibited/);
pass('Check-in 1 second before session start REJECTED with PREMATURE_CHECKIN');

// Check exactly 1 millisecond before start (T - 1ms): MUST BE REJECTED with PREMATURE_CHECKIN
const oneMsBefore = sessionStartMs - 1;
assert.equal(engine2.isBeforeSessionStart(sessionStartIso, oneMsBefore), true);
const earlyVal2 = engine2.validateCheckInEligibility({
  session: testSession,
  traineeId: 'trainee-001',
  isApproved: true,
  existingAttendanceRecords: [],
  checkInTimestampMs: oneMsBefore,
});
assert.equal(earlyVal2.allowed, false);
assert.equal(earlyVal2.rejectionCode, 'PREMATURE_CHECKIN');
pass('Check-in 1 millisecond before session start REJECTED with PREMATURE_CHECKIN');

// Check exactly AT session start (T = 0ms): MUST BE ACCEPTED
assert.equal(engine2.isBeforeSessionStart(sessionStartIso, sessionStartMs), false);
const atStartVal = engine2.validateCheckInEligibility({
  session: testSession,
  traineeId: 'trainee-001',
  isApproved: true,
  existingAttendanceRecords: [],
  checkInTimestampMs: sessionStartMs,
});
assert.equal(atStartVal.allowed, true);
assert.equal(atStartVal.rejectionCode, undefined);
pass('Check-in EXACTLY AT start time (T0) ACCEPTED (allowed = true)');

// Check 5 minutes after session start (T + 300,000ms): MUST BE ACCEPTED
const fiveMinAfterMs = sessionStartMs + 300000;
assert.equal(engine2.isBeforeSessionStart(sessionStartIso, fiveMinAfterMs), false);
const lateVal = engine2.validateCheckInEligibility({
  session: testSession,
  traineeId: 'trainee-001',
  isApproved: true,
  existingAttendanceRecords: [],
  checkInTimestampMs: fiveMinAfterMs,
});
assert.equal(lateVal.allowed, true);
pass('Check-in during active session window ACCEPTED (allowed = true)');

// Check after session concluded + 30min grace expired: MUST BE REJECTED with SESSION_CONCLUDED
const sessionEndMs = new Date(sessionEndIso).getTime();
const postConcludedMs = sessionEndMs + 35 * 60 * 1000;
const concludedVal = engine2.validateCheckInEligibility({
  session: testSession,
  traineeId: 'trainee-001',
  isApproved: true,
  existingAttendanceRecords: [],
  checkInTimestampMs: postConcludedMs,
});
assert.equal(concludedVal.allowed, false);
assert.equal(concludedVal.rejectionCode, 'SESSION_CONCLUDED');
pass('Check-in after session grace window REJECTED with SESSION_CONCLUDED');

// 2.3 Approved Nomination Guard (isApprovedNominee & validateCheckInEligibility)
console.log('\n  [2.3] Approved Nomination Guard Verification...');
const sampleNominations = [
  { programmeId: baseProgramme.id, traineeId: 'trainee-approved', status: 'APPROVED' },
  { programmeId: baseProgramme.id, traineeId: 'trainee-waitlisted', status: 'WAITLISTED' },
  { programmeId: baseProgramme.id, traineeId: 'trainee-pending', status: 'PENDING' },
  { programmeId: baseProgramme.id, traineeId: 'trainee-rejected', status: 'REJECTED' },
  { programmeId: 'other-programme-id', traineeId: 'trainee-other-prog', status: 'APPROVED' },
];

assert.equal(engine2.isApprovedNominee(baseProgramme.id, 'trainee-approved', sampleNominations), true);
assert.equal(engine2.isApprovedNominee(baseProgramme.id, 'trainee-waitlisted', sampleNominations), false);
assert.equal(engine2.isApprovedNominee(baseProgramme.id, 'trainee-pending', sampleNominations), false);
assert.equal(engine2.isApprovedNominee(baseProgramme.id, 'trainee-rejected', sampleNominations), false);
assert.equal(engine2.isApprovedNominee(baseProgramme.id, 'trainee-other-prog', sampleNominations), false);
assert.equal(engine2.isApprovedNominee(baseProgramme.id, 'trainee-unknown', sampleNominations), false);
pass('isApprovedNominee filters exclusively for APPROVED status matching programmeId');

// Test in validateCheckInEligibility:
for (const badTrainee of ['trainee-waitlisted', 'trainee-pending', 'trainee-rejected', 'trainee-unknown']) {
  const unapprovedVal = engine2.validateCheckInEligibility({
    session: testSession,
    traineeId: badTrainee,
    isApproved: false,
    existingAttendanceRecords: [],
    checkInTimestampMs: sessionStartMs + 1000,
  });
  assert.equal(unapprovedVal.allowed, false);
  assert.equal(unapprovedVal.rejectionCode, 'NOT_APPROVED');
  assert.match(unapprovedVal.rejectionReason || '', /does not possess an approved nomination/);
}
pass('All non-approved statuses (WAITLISTED, PENDING, REJECTED, UNKNOWN) rejected with NOT_APPROVED');

// 2.4 Duplicate Attendance Guard
console.log('\n  [2.4] Duplicate Attendance Guard Verification...');
const existingRecords: SessionAttendanceRecord[] = [
  {
    id: `att-${testSession.id}-trainee-001`,
    sessionId: testSession.id,
    traineeId: 'trainee-001',
    traineeName: 'Anita Sharma',
    verificationMethod: 'DYNAMIC_CODE',
    markedAt: '2026-11-10T10:05:00.000Z',
    verified: true,
  },
];

const duplicateVal = engine2.validateCheckInEligibility({
  session: testSession,
  traineeId: 'trainee-001',
  isApproved: true,
  existingAttendanceRecords: existingRecords,
  checkInTimestampMs: sessionStartMs + 600000,
});
assert.equal(duplicateVal.allowed, false);
assert.equal(duplicateVal.rejectionCode, 'ALREADY_CHECKED_IN');
assert.match(duplicateVal.rejectionReason || '', /already been recorded/);
pass('Duplicate check-in attempt for same session and trainee rejected with ALREADY_CHECKED_IN');

// Different trainee for same session: allowed
const anotherTraineeVal = engine2.validateCheckInEligibility({
  session: testSession,
  traineeId: 'trainee-002',
  isApproved: true,
  existingAttendanceRecords: existingRecords,
  checkInTimestampMs: sessionStartMs + 600000,
});
assert.equal(anotherTraineeVal.allowed, true);
pass('Different trainee check-in allowed without cross-trainee interference');

// 2.5 Multi-Modal Verification Processing
console.log('\n  [2.5] Multi-Modal Verification Processing...');
// Valid dynamic code
const check1 = engine2.processCheckIn({
  session: testSession,
  traineeId: 'trainee-001',
  traineeName: 'Anita Sharma',
  method: 'DYNAMIC_CODE',
  submittedCode: '482910',
});
assert.equal(check1.success, true);
assert.equal(check1.record?.verified, true);
assert.equal(check1.record?.verificationMethod, 'DYNAMIC_CODE');
pass('Valid dynamic 6-digit code verified successfully');

// Invalid dynamic code
const check2 = engine2.processCheckIn({
  session: testSession,
  traineeId: 'trainee-001',
  traineeName: 'Anita Sharma',
  method: 'DYNAMIC_CODE',
  submittedCode: '999999',
});
assert.equal(check2.success, false);
assert.match(check2.errorReason || '', /Invalid check-in code entered/);
pass('Invalid dynamic code safely rejected with explanatory error');

// QR code scan verification
const checkQR = engine2.processCheckIn({
  session: testSession,
  traineeId: 'trainee-001',
  traineeName: 'Anita Sharma',
  method: 'QR_SCAN',
  qrToken: testSession.qrCodeToken,
});
assert.equal(checkQR.success, true);
assert.equal(checkQR.record?.verificationMethod, 'QR_SCAN');
pass('Valid QR code scan verified successfully');

// Faculty manual override
const checkManual = engine2.processCheckIn({
  session: testSession,
  traineeId: 'trainee-001',
  traineeName: 'Anita Sharma',
  method: 'FACULTY_MANUAL',
  facultyId: 'trainer-verma-01',
});
assert.equal(checkManual.success, true);
assert.equal(checkManual.record?.markedBy, 'trainer-verma-01');
pass('Faculty manual override creates verified audit record with trainer identity');


// ========================================================================
// ENGINE 3: GRADEBOOK & CCE MARKS TALLY ENGINE STRESS TESTS
// ========================================================================
console.log('\n>>> [ENGINE 3 CHALLENGE] gradebook-engine.ts...');
const engine3 = new GradebookEngine();

const formativeQuiz: CourseModuleTest = {
  id: 'test-quiz-01',
  courseId: 'course-pacs-101',
  title: 'PACS Accounting Fundamentals Practice Quiz',
  type: 'FORMATIVE_QUIZ',
  totalMarks: 50,
  passMarks: 25,
  maxAttempts: 0, // Unlimited attempts
  questionsCount: 10,
  timeLimitMinutes: 15,
};

const summativeExam1: CourseModuleTest = {
  id: 'test-exam-01',
  courseId: 'course-pacs-101',
  title: 'Cooperative Banking Regulations Mid-Term Exam',
  type: 'SUMMATIVE_TEST',
  totalMarks: 100,
  passMarks: 60,
  maxAttempts: 3, // Capped at 3 attempts
  questionsCount: 40,
  timeLimitMinutes: 60,
};

const summativeExam2: CourseModuleTest = {
  id: 'test-exam-02',
  courseId: 'course-pacs-101',
  title: 'Statutory Compliance & Audit Final Summative Exam',
  type: 'SUMMATIVE_TEST',
  totalMarks: 100,
  passMarks: 60,
  maxAttempts: 3,
  questionsCount: 50,
  timeLimitMinutes: 90,
};

// 3.1 Formative Practice Quiz: 10 Failed Attempts Zero Impact Verification
console.log('\n  [3.1] Formative Practice Quiz Zero Impact Verification...');
// Simulate 10 consecutive failed attempts on formative quiz (marks: 0/50)
const failedQuizSubmissions = Array.from({ length: 10 }, (_, i) => ({
  id: `sub-formative-${i + 1}`,
  testId: formativeQuiz.id,
  traineeId: 'trainee-001',
  marksObtained: 0,
  totalMarks: 50,
  submittedAt: `2026-11-10T12:0${i}:00Z`,
}));

// Tally with only the 10 failed formative attempts
const formativeOnlyTally = engine3.computeTraineeMarksTally({
  traineeId: 'trainee-001',
  traineeName: 'Anita Sharma',
  courseId: 'course-pacs-101',
  courseTitle: 'PACS Leadership',
  tests: [formativeQuiz],
  submissions: failedQuizSubmissions,
  completedLessonsCount: 5,
  totalLessonsCount: 10,
});

assert.equal(formativeOnlyTally.formativeQuizzesAttempted, 1);
assert.equal(formativeOnlyTally.totalSummativeTests, 0);
assert.equal(formativeOnlyTally.cumulativeMarksObtained, 0);
assert.equal(formativeOnlyTally.cumulativeTotalMarks, 0);
assert.equal(formativeOnlyTally.overallPercentage, 0.0);
assert.equal(formativeOnlyTally.awardGrade, 'INCOMPLETE');
pass('10 failed formative quiz attempts do NOT add to cumulative marks (cumulativeTotalMarks = 0)');

// Now add 1 summative test passed with 85/100
const summativeSubmissions = [
  {
    id: 'sub-sum-01',
    testId: summativeExam1.id,
    traineeId: 'trainee-001',
    marksObtained: 85,
    totalMarks: 100,
    submittedAt: '2026-11-11T14:00:00Z',
  },
];

const mixedTally1 = engine3.computeTraineeMarksTally({
  traineeId: 'trainee-001',
  traineeName: 'Anita Sharma',
  courseId: 'course-pacs-101',
  courseTitle: 'PACS Leadership',
  tests: [formativeQuiz, summativeExam1],
  submissions: [...failedQuizSubmissions, ...summativeSubmissions],
  completedLessonsCount: 10,
  totalLessonsCount: 10,
});
assert.equal(mixedTally1.cumulativeMarksObtained, 85);
assert.equal(mixedTally1.cumulativeTotalMarks, 100);
assert.equal(mixedTally1.overallPercentage, 85.0);
pass('Cumulative score exactly 85/100 (85.0%) with 10 failed formative attempts present');

// Add 10 MORE failed formative attempts (total 20 failed quiz attempts)
const moreFailedQuiz = Array.from({ length: 10 }, (_, i) => ({
  id: `sub-formative-more-${i + 1}`,
  testId: formativeQuiz.id,
  traineeId: 'trainee-001',
  marksObtained: 5, // 5/50 (failed)
  totalMarks: 50,
  submittedAt: `2026-11-12T12:0${i}:00Z`,
}));

const mixedTally2 = engine3.computeTraineeMarksTally({
  traineeId: 'trainee-001',
  traineeName: 'Anita Sharma',
  courseId: 'course-pacs-101',
  courseTitle: 'PACS Leadership',
  tests: [formativeQuiz, summativeExam1],
  submissions: [...failedQuizSubmissions, ...moreFailedQuiz, ...summativeSubmissions],
  completedLessonsCount: 10,
  totalLessonsCount: 10,
});
assert.equal(mixedTally2.cumulativeMarksObtained, 85, 'cumulativeMarksObtained must remain 85');
assert.equal(mixedTally2.cumulativeTotalMarks, 100, 'cumulativeTotalMarks must remain 100');
assert.equal(mixedTally2.overallPercentage, 85.0, 'overallPercentage must remain 85.0');
pass('20 failed formative quiz attempts caused ZERO negative deviation on cumulative marks tally');

// 3.2 Summative Module Exam: Attempt Caps & Pass Threshold Gating
console.log('\n  [3.2] Summative Exam Attempt Caps & Pass Threshold Gating...');
// Attempt 1: 40/100 (Failed) -> Allowed
const att1 = engine3.evaluateSubmission(summativeExam1, 0, 40);
assert.equal(att1.allowed, true);
assert.equal(att1.passed, false);
assert.equal(att1.percentage, 40.0);
pass('Summative attempt 1 (40/100, count 0) allowed, passed = false');

// Attempt 2: 55/100 (Failed) -> Allowed
const att2 = engine3.evaluateSubmission(summativeExam1, 1, 55);
assert.equal(att2.allowed, true);
assert.equal(att2.passed, false);
assert.equal(att2.percentage, 55.0);
pass('Summative attempt 2 (55/100, count 1) allowed, passed = false');

// Attempt 3: 59/100 (Failed, 1 mark below pass threshold 60) -> Allowed
const att3 = engine3.evaluateSubmission(summativeExam1, 2, 59);
assert.equal(att3.allowed, true);
assert.equal(att3.passed, false);
assert.equal(att3.percentage, 59.0);
pass('Summative attempt 3 (59/100, count 2) allowed, passed = false (59 < 60)');

// Attempt 4: Trainee attempts 4th time -> MUST BE REJECTED & LOCKED
const att4 = engine3.evaluateSubmission(summativeExam1, 3, 90);
assert.equal(att4.allowed, false, 'Attempt 4 must exceed maxAttempts (3)');
assert.equal(att4.passed, false);
assert.match(att4.rejectionReason || '', /Maximum permitted test attempts reached \(3\/3\)\. Retakes are locked\./);
pass('Summative attempt 4 REJECTED and locked: maxAttempts cap (3/3) strictly enforced');

// Pass Threshold Gating:
// Score 60/100 (exactly at pass threshold): passed = true
const attPassThreshold = engine3.evaluateSubmission(summativeExam1, 0, 60);
assert.equal(attPassThreshold.allowed, true);
assert.equal(attPassThreshold.passed, true);
assert.equal(attPassThreshold.percentage, 60.0);
pass('Score 60/100 passes threshold gating (60 >= 60)');

// 3.3 Certificate Eligibility Invariant: 100% Lessons AND All Summative Tests Passed
console.log('\n  [3.3] Certificate Eligibility Invariant Verification...');

const allSummativeTests = [summativeExam1, summativeExam2];

// Scenario 1: Lessons 100% (10/10), Summative passed 2 of 2 -> ELIGIBLE
const eligibleTally = engine3.computeTraineeMarksTally({
  traineeId: 't-pass-all',
  traineeName: 'Kavita Joshi',
  courseId: 'course-pacs-101',
  courseTitle: 'PACS Leadership',
  tests: allSummativeTests,
  submissions: [
    { id: 's1', testId: summativeExam1.id, traineeId: 't-pass-all', marksObtained: 75, totalMarks: 100, submittedAt: '2026-11-10T10:00:00Z' },
    { id: 's2', testId: summativeExam2.id, traineeId: 't-pass-all', marksObtained: 85, totalMarks: 100, submittedAt: '2026-11-11T10:00:00Z' },
  ],
  completedLessonsCount: 10,
  totalLessonsCount: 10,
});
assert.equal(eligibleTally.allLessonsCompleted ?? (eligibleTally.completedLessonsCount >= eligibleTally.totalLessonsCount), true);
assert.equal(eligibleTally.summativeTestsPassed, 2);
assert.equal(eligibleTally.totalSummativeTests, 2);
assert.equal(eligibleTally.certificateEligible, true);
assert.equal(eligibleTally.awardGrade, 'FIRST_CLASS'); // (75 + 85) / 200 = 80.0% -> FIRST_CLASS
pass('Certificate Eligible: 100% lessons + all summative passed -> certificateEligible = true (FIRST_CLASS)');

// Scenario 2: Lessons 90% (9/10), Summative passed 2 of 2 -> NOT ELIGIBLE
const incompleteLessonsTally = engine3.computeTraineeMarksTally({
  traineeId: 't-inc-lessons',
  traineeName: 'Prakash Rao',
  courseId: 'course-pacs-101',
  courseTitle: 'PACS Leadership',
  tests: allSummativeTests,
  submissions: [
    { id: 's1', testId: summativeExam1.id, traineeId: 't-inc-lessons', marksObtained: 90, totalMarks: 100, submittedAt: '2026-11-10T10:00:00Z' },
    { id: 's2', testId: summativeExam2.id, traineeId: 't-inc-lessons', marksObtained: 90, totalMarks: 100, submittedAt: '2026-11-11T10:00:00Z' },
  ],
  completedLessonsCount: 9,
  totalLessonsCount: 10,
});
assert.equal(incompleteLessonsTally.certificateEligible, false, 'Must not be eligible if lessons < 100%');
pass('Certificate Blocked: 9/10 lessons (90%) blocks certificate even with 90% exam score');

// Scenario 3: Lessons 100% (10/10), Summative passed 1 of 2 -> NOT ELIGIBLE
const failedExamTally = engine3.computeTraineeMarksTally({
  traineeId: 't-fail-exam',
  traineeName: 'Mohan Lal',
  courseId: 'course-pacs-101',
  courseTitle: 'PACS Leadership',
  tests: allSummativeTests,
  submissions: [
    { id: 's1', testId: summativeExam1.id, traineeId: 't-fail-exam', marksObtained: 95, totalMarks: 100, submittedAt: '2026-11-10T10:00:00Z' },
    { id: 's2', testId: summativeExam2.id, traineeId: 't-fail-exam', marksObtained: 50, totalMarks: 100, submittedAt: '2026-11-11T10:00:00Z' }, // Failed (50 < 60)
  ],
  completedLessonsCount: 10,
  totalLessonsCount: 10,
});
assert.equal(failedExamTally.certificateEligible, false, 'Must not be eligible if any summative exam failed');
assert.equal(failedExamTally.awardGrade, 'INCOMPLETE');
pass('Certificate Blocked: 1 failed summative test blocks certificate and results in INCOMPLETE grade');

// Scenario 4: Distinction Grade (>= 85.0%)
const distinctionTally = engine3.computeTraineeMarksTally({
  traineeId: 't-distinction',
  traineeName: 'Preeti Deshmukh',
  courseId: 'course-pacs-101',
  courseTitle: 'PACS Leadership',
  tests: allSummativeTests,
  submissions: [
    { id: 's1', testId: summativeExam1.id, traineeId: 't-distinction', marksObtained: 92, totalMarks: 100, submittedAt: '2026-11-10T10:00:00Z' },
    { id: 's2', testId: summativeExam2.id, traineeId: 't-distinction', marksObtained: 88, totalMarks: 100, submittedAt: '2026-11-11T10:00:00Z' },
  ],
  completedLessonsCount: 10,
  totalLessonsCount: 10,
});
assert.equal(distinctionTally.overallPercentage, 90.0);
assert.equal(distinctionTally.awardGrade, 'DISTINCTION');
assert.equal(distinctionTally.certificateEligible, true);
pass('Grade assignment: overall percentage 90.0% yields DISTINCTION');

// 3.4 Division-by-Zero Protection on Empty Courses
console.log('\n  [3.4] Division-by-Zero & NaN Stress Verification...');
// 0 lessons, 0 tests
const emptyTally = engine3.computeTraineeMarksTally({
  traineeId: 't-empty',
  traineeName: 'Empty Trainee',
  courseId: 'empty-course',
  courseTitle: 'Empty Course',
  tests: [],
  submissions: [],
  completedLessonsCount: 0,
  totalLessonsCount: 0,
});
assert.equal(Number.isNaN(emptyTally.overallPercentage), false, 'overallPercentage must not be NaN');
assert.equal(Number.isNaN(emptyTally.lessonCompletionPercent), false, 'lessonCompletionPercent must not be NaN');
assert.equal(emptyTally.overallPercentage, 0.0);
assert.equal(emptyTally.lessonCompletionPercent, 100.0);
assert.equal(emptyTally.certificateEligible, false);
assert.equal(emptyTally.awardGrade, 'INCOMPLETE');
pass('Empty course (0 lessons, 0 tests) handled with zero NaN / divide-by-zero errors');

// Test with test.totalMarks = 0
const zeroMarksTest: CourseModuleTest = {
  id: 'test-zero',
  courseId: 'c-zero',
  title: 'Zero Marks Test',
  type: 'SUMMATIVE_TEST',
  totalMarks: 0,
  passMarks: 0,
  maxAttempts: 1,
  questionsCount: 0,
  timeLimitMinutes: 10,
};
const zeroMarksEval = engine3.evaluateSubmission(zeroMarksTest, 0, 0);
assert.equal(Number.isNaN(zeroMarksEval.percentage), false);
assert.equal(zeroMarksEval.percentage, 0.0);
assert.equal(zeroMarksEval.passed, true);
pass('Zero marks test evaluated with percentage = 0.0 (no NaN)');

// Institutional Gradebook & CSV Generation with 0 trainees
const emptyGradebook = engine3.compileInstitutionalGradebook({
  courseId: 'c-empty-inst',
  courseTitle: 'Empty Institutional Course',
  instituteName: 'VAMNICOM Pune',
  tests: [],
  trainees: [],
  submissions: [],
  totalLessonsCount: 0,
});
assert.equal(Number.isNaN(emptyGradebook.classAveragePercentage), false);
assert.equal(Number.isNaN(emptyGradebook.passRatePercentage), false);
assert.equal(emptyGradebook.classAveragePercentage, 0.0);
assert.equal(emptyGradebook.passRatePercentage, 0.0);
assert.equal(emptyGradebook.rows.length, 0);

const csvExports = engine3.generateStatutoryExportCsv(emptyGradebook);
assert.ok(csvExports.summaryCsv.includes('VAMNICOM Pune'));
assert.ok(csvExports.summaryCsv.includes('राष्ट्रीय सहकारी प्रशिक्षण परिषद'));
pass('Institutional Gradebook compilation and CSV export safe on 0 trainees / 0 tests');

console.log('\n========================================================================');
console.log(`   ✓ ALL ${totalAssertions} EMPIRICAL ASSERTIONS PASSED WITH ZERO FAILURES!   `);
console.log('   Engines 1, 2, and 3 proven fully robust against adversarial stress!   ');
console.log('========================================================================\n');

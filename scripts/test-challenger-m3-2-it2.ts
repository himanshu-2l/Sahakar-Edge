/**
 * Sahakar Edge — Iteration 2 Deep Empirical Stress Harness
 * Milestone 3 Iteration 2: Temporal Guard, Marks Invariants & Privacy Isolation
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { DynamicAttendanceEngine } from '../apps/central-api/dist/services/dynamic-attendance-engine.js';
import { GradebookEngine } from '../apps/central-api/dist/services/gradebook-engine.js';
import type { TimetableSession, CourseModuleTest } from '../packages/types/dist/index.js';

console.log('========================================================================');
console.log('   ITERATION 2 DEEP EMPIRICAL ADVERSARIAL STRESS HARNESS               ');
console.log('========================================================================\n');

let checksPassed = 0;
function ok(msg: string) {
  checksPassed++;
  console.log(`  ✓ [CHALLENGE IT2-${checksPassed}] ${msg}`);
}

// ------------------------------------------------------------------------
// 1. DYNAMIC ATTENDANCE TEMPORAL GUARD BOUNDARY CHALLENGE
// ------------------------------------------------------------------------
console.log('>>> [1] Temporal Guard Millisecond-Boundary Stress Testing...');

const attEngine = new DynamicAttendanceEngine();

const sessionIso = '2026-11-10T14:00:00.000Z';
const sessionStartMs = new Date(sessionIso).getTime();

// Boundary test: startsAt - 1ms
assert.equal(
  attEngine.isBeforeSessionStart(sessionIso, sessionStartMs - 1),
  true,
  'Temporal Guard must flag startsAt - 1ms as premature'
);
ok('Temporal Guard: startsAt - 1ms is rejected (premature)');

// Boundary test: startsAt + 0ms (exact match)
assert.equal(
  attEngine.isBeforeSessionStart(sessionIso, sessionStartMs),
  false,
  'Temporal Guard must allow startsAt + 0ms'
);
ok('Temporal Guard: startsAt + 0ms is accepted (eligible)');

// Boundary test: startsAt + 1ms
assert.equal(
  attEngine.isBeforeSessionStart(sessionIso, sessionStartMs + 1),
  false,
  'Temporal Guard must allow startsAt + 1ms'
);
ok('Temporal Guard: startsAt + 1ms is accepted (eligible)');

// Session validation with session object
const testSession: TimetableSession = {
  id: 'sess-stress-101',
  programmeId: 'prog-stress-01',
  title: 'PACS Credit Risk Analysis',
  facultyId: 'fac-stress-01',
  facultyName: 'Dr. Sunita Varma',
  sessionDate: '2026-11-10',
  startTime: '14:00',
  endTime: '17:00',
  startsAt: sessionIso,
  endsAt: '2026-11-10T17:00:00.000Z',
  venue: 'Lecture Hall 3',
  checkInCode: '918273',
  status: 'ACTIVE',
};

// Check-in at startsAt - 1ms
const prematureRes = attEngine.validateCheckInEligibility({
  session: testSession,
  traineeId: 'trn-valid-01',
  isApproved: true,
  existingAttendanceRecords: [],
  checkInTimestampMs: sessionStartMs - 1,
});
assert.equal(prematureRes.allowed, false);
assert.equal(prematureRes.rejectionCode, 'PREMATURE_CHECKIN');
ok('Eligibility Pipeline: startsAt - 1ms triggers PREMATURE_CHECKIN');

// Check-in at startsAt + 0ms
const onTimeRes = attEngine.validateCheckInEligibility({
  session: testSession,
  traineeId: 'trn-valid-01',
  isApproved: true,
  existingAttendanceRecords: [],
  checkInTimestampMs: sessionStartMs,
});
assert.equal(onTimeRes.allowed, true);
ok('Eligibility Pipeline: startsAt + 0ms allows check-in');

// Unapproved trainee check
const unapprovedRes = attEngine.validateCheckInEligibility({
  session: testSession,
  traineeId: 'trn-unapproved-99',
  isApproved: false,
  existingAttendanceRecords: [],
  checkInTimestampMs: sessionStartMs + 1000,
});
assert.equal(unapprovedRes.allowed, false);
assert.equal(unapprovedRes.rejectionCode, 'NOT_APPROVED');
ok('Eligibility Pipeline: unapproved trainee rejected with NOT_APPROVED');

// 6-digit code format stress testing
const nonNumericCodes = ['ABCDEF', '12345A', '918 27', '91827!', '12 345', ''];
for (const code of nonNumericCodes) {
  const res = attEngine.processCheckIn({
    session: testSession,
    traineeId: 'trn-valid-01',
    traineeName: 'Test Trainee',
    method: 'DYNAMIC_CODE',
    submittedCode: code,
  });
  assert.equal(res.success, false, `Code "${code}" must be rejected`);
}
ok('6-Digit Validation: Non-numeric and malformed codes strictly rejected');

// Valid 6-digit code check
const validCheckIn = attEngine.processCheckIn({
  session: testSession,
  traineeId: 'trn-valid-01',
  traineeName: 'Test Trainee',
  method: 'DYNAMIC_CODE',
  submittedCode: '918273',
});
assert.equal(validCheckIn.success, true);
assert.equal(validCheckIn.record?.verified, true);
assert.equal(validCheckIn.record?.sessionId, testSession.id);
ok('6-Digit Validation: Exact 6-digit numeric match succeeds with verified attendance record');

// ------------------------------------------------------------------------
// 2. CONTINUOUS EVALUATION MARKS INVARIANTS & DUAL-CONDITION CERTIFICATION
// ------------------------------------------------------------------------
console.log('\n>>> [2] Continuous Evaluation & Certification Invariant Stress Testing...');

const gbEngine = new GradebookEngine();
const courseId = 'course-stress-eval';

const mockTests: CourseModuleTest[] = [
  {
    id: 'quiz-stress-1',
    courseId,
    title: 'Diagnostic Quiz (Formative)',
    type: 'FORMATIVE_QUIZ',
    totalMarks: 25,
    passMarks: 12,
    maxAttempts: 0,
  },
  {
    id: 'quiz-stress-2',
    courseId,
    title: 'Mid-term Practice Quiz (Formative)',
    type: 'FORMATIVE_QUIZ',
    totalMarks: 25,
    passMarks: 12,
    maxAttempts: 0,
  },
  {
    id: 'exam-stress-1',
    courseId,
    title: 'Summative Module Exam 1',
    type: 'SUMMATIVE_TEST',
    totalMarks: 100,
    passMarks: 60,
    maxAttempts: 3,
  },
  {
    id: 'exam-stress-2',
    courseId,
    title: 'Summative Module Exam 2',
    type: 'SUMMATIVE_TEST',
    totalMarks: 100,
    passMarks: 60,
    maxAttempts: 3,
  },
];

// Test: 50 failed formative attempts have 0 effect on GPA
const fiftyFailedQuizzes = Array.from({ length: 50 }, (_, i) => ({
  id: `sub-fq-${i}`,
  testId: 'quiz-stress-1',
  traineeId: 'trn-marks-stress',
  marksObtained: 0,
  totalMarks: 25,
  submittedAt: new Date(Date.now() - 3600000 + i * 1000).toISOString(),
}));

const passingExams = [
  {
    id: 'sub-ex-1',
    testId: 'exam-stress-1',
    traineeId: 'trn-marks-stress',
    marksObtained: 90,
    totalMarks: 100,
    submittedAt: '2026-11-10T15:00:00Z',
  },
  {
    id: 'sub-ex-2',
    testId: 'exam-stress-2',
    traineeId: 'trn-marks-stress',
    marksObtained: 80,
    totalMarks: 100,
    submittedAt: '2026-11-10T16:00:00Z',
  },
];

const stressTally = gbEngine.computeTraineeMarksTally({
  traineeId: 'trn-marks-stress',
  traineeName: 'Marks Stress Trainee',
  courseId,
  courseTitle: 'PACS Advanced Auditing',
  tests: mockTests,
  submissions: [...fiftyFailedQuizzes, ...passingExams],
  completedLessonsCount: 10,
  totalLessonsCount: 10,
});

assert.equal(stressTally.cumulativeMarksObtained, 170); // 90 + 80
assert.equal(stressTally.cumulativeTotalMarks, 200);   // 100 + 100
assert.equal(stressTally.overallPercentage, 85.0);      // 170 / 200 = 85.0%
assert.equal(stressTally.awardGrade, 'DISTINCTION');
assert.equal(stressTally.certificateEligible, true);
ok('Marks Invariant: 50 failed formative quizzes yield ZERO GPA dilution (85.0% DISTINCTION preserved)');

// Test: Dual-Condition Certification Truth Table
// Condition 1: 100% lessons, but 1 exam unpassed (score 50 < 60)
const unpassedExamTally = gbEngine.computeTraineeMarksTally({
  traineeId: 'trn-fail-exam',
  traineeName: 'Unpassed Exam Trainee',
  courseId,
  courseTitle: 'PACS Advanced Auditing',
  tests: mockTests,
  submissions: [
    { id: 'e1', testId: 'exam-stress-1', traineeId: 'trn-fail-exam', marksObtained: 90, totalMarks: 100, submittedAt: '2026-11-10T15:00:00Z' },
    { id: 'e2', testId: 'exam-stress-2', traineeId: 'trn-fail-exam', marksObtained: 50, totalMarks: 100, submittedAt: '2026-11-10T16:00:00Z' },
  ],
  completedLessonsCount: 10,
  totalLessonsCount: 10,
});
assert.equal(unpassedExamTally.certificateEligible, false);
assert.equal(unpassedExamTally.awardGrade, 'INCOMPLETE');
ok('Dual-Condition: 100% lessons + 1 unpassed summative test -> certificateEligible: false, INCOMPLETE');

// Condition 2: 100% exams passed, but 9/10 lessons completed
const incompleteLessonsTally = gbEngine.computeTraineeMarksTally({
  traineeId: 'trn-inc-lessons',
  traineeName: 'Incomplete Lessons Trainee',
  courseId,
  courseTitle: 'PACS Advanced Auditing',
  tests: mockTests,
  submissions: passingExams,
  completedLessonsCount: 9,
  totalLessonsCount: 10,
});
assert.equal(incompleteLessonsTally.certificateEligible, false);
ok('Dual-Condition: 90% lessons + 100% exams passed -> certificateEligible: false');

// ------------------------------------------------------------------------
// 3. RESIDENTIAL PRIVACY LEAKAGE AUDIT
// ------------------------------------------------------------------------
console.log('\n>>> [3] Residential Privacy Isolation & Public Route Audit...');

// Inspect SovereignNfcProfileCard.tsx source
const sovereignCardSource = fs.readFileSync(
  path.resolve('apps/trainee-pwa/src/components/SovereignNfcProfileCard.tsx'),
  'utf8'
);

// Assert zero access to private residential properties
const forbiddenProps = [
  'safeProfile.hostelBlock',
  'safeProfile.roomNumber',
  'safeProfile.floor',
  'safeProfile.phone',
  'safeProfile.email',
  'safeProfile.address',
  'profile.hostelBlock',
  'profile.roomNumber',
  'profile.floor',
  'profile.phone',
  'profile.email',
];
for (const p of forbiddenProps) {
  assert.equal(
    sovereignCardSource.includes(p),
    false,
    `Privacy violation: ${p} must NOT be accessed in SovereignNfcProfileCard`
  );
}
ok('Privacy Isolation: SovereignNfcProfileCard contains ZERO accesses to residential/PII properties');

// Inspect App.tsx visitor profile code block
const appSource = fs.readFileSync(path.resolve('apps/trainee-pwa/src/App.tsx'), 'utf8');
const visitorBlock = appSource.substring(
  appSource.indexOf('if (visitorProfileCode) {'),
  appSource.indexOf('const isOffline =')
);

// Verify visitor route does NOT contain any residential or phone/email strings
const forbiddenVisitorTokens = ['hostelBlock', 'roomNumber', 'floorLabel', 'trainee.phone', 'trainee.email'];
for (const t of forbiddenVisitorTokens) {
  assert.equal(
    visitorBlock.includes(t),
    false,
    `Privacy violation: ${t} found in public visitor route in App.tsx`
  );
}
ok('Privacy Isolation: Public visitor route (/?profile=:code) completely excludes residential/PII data');

// Verify 3D flip card hardware-accelerated CSS properties on disk
assert.ok(sovereignCardSource.includes("perspective: '1000px'"));
assert.ok(sovereignCardSource.includes("transformStyle: 'preserve-3d'"));
assert.ok(sovereignCardSource.includes("backfaceVisibility: 'hidden'"));
assert.ok(sovereignCardSource.includes("rotateY(180deg)"));
ok('3D Flip Card Architecture: perspective: 1000px, preserve-3d, and rotateY transforms verified');

console.log('\n========================================================================');
console.log(`   ✓ ALL ${checksPassed} ITERATION 2 EMPIRICAL CHALLENGES PASSED!      `);
console.log('========================================================================\n');

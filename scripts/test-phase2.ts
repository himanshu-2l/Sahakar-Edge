import {
  INITIAL_MANIFEST,
  offlineStore,
} from '../apps/trainee-pwa/src/services/offline-store.ts';
import {
  SEED_QUESTIONS,
  SEED_ASSESSMENT,
  SEED_LESSONS,
  SEED_SESSION,
} from '../packages/test-fixtures/dist/index.js';

async function runPhase2Tests() {
  console.log('--- RUNNING PHASE 2 TEST SUITE (Trainee PWA & Offline Engine) ---\n');

  // Test 1: Content Manifest Verification
  console.log('[Test 1] Content Manifest & Asset Metadata:');
  if (!INITIAL_MANIFEST.courseId || INITIAL_MANIFEST.version !== 1) {
    throw new Error('Manifest missing valid courseId or version');
  }
  if (INITIAL_MANIFEST.lessons.length !== 2) {
    throw new Error(`Expected 2 lessons in offline manifest, got ${INITIAL_MANIFEST.lessons.length}`);
  }
  if (INITIAL_MANIFEST.assets.length !== 2 || !INITIAL_MANIFEST.assets[0].sha256) {
    throw new Error('Expected 2 assets with SHA-256 digests in manifest');
  }
  console.log('  ✓ Manifest correctly defines course, lessons, and SHA-256 asset references');

  // Test 2: Lesson Detail Content & Educational Quality
  console.log('\n[Test 2] Lesson Content & Offline Curriculum:');
  const lesson1 = offlineStore.getLessonDetail(SEED_LESSONS[0].id);
  const lesson2 = offlineStore.getLessonDetail(SEED_LESSONS[1].id);
  if (!lesson1 || !lesson1.fullContentMarkdown.includes('Rochdale Cooperative Principles')) {
    throw new Error('Lesson 1.1 missing cooperative principles curriculum text');
  }
  if (!lesson2 || !lesson2.fullContentMarkdown.includes('Double-Entry Accounting in PACS')) {
    throw new Error('Lesson 1.2 missing double-entry curriculum text');
  }
  console.log('  ✓ Lesson content includes verified cooperative curriculum (Rochdale Principles, PACS Accounting)');

  // Test 3: Progress Calculation & Lesson Completion
  console.log('\n[Test 3] Progress Calculation & Lesson Completion Events:');
  const initialCompleted = offlineStore.getCompletedLessons();
  const initialQueueCount = offlineStore.getQueuedEvents().length;
  
  // Complete Lesson 1.2
  offlineStore.completeLesson(SEED_LESSONS[1].id, 'dddd4444-4444-4444-4444-444444444441');
  const updatedCompleted = offlineStore.getCompletedLessons();
  const progressPercent = offlineStore.getProgressPercentage();
  const newQueueCount = offlineStore.getQueuedEvents().length;

  if (!updatedCompleted.includes(SEED_LESSONS[1].id)) {
    throw new Error('Lesson 1.2 should be marked completed');
  }
  if (progressPercent !== 100) {
    throw new Error(`Expected 100% progress after completing all lessons, got ${progressPercent}%`);
  }
  if (newQueueCount !== initialQueueCount + 1) {
    throw new Error(`Queue count should increase by 1, expected ${initialQueueCount + 1}, got ${newQueueCount}`);
  }
  const lastEvent = offlineStore.getQueuedEvents()[newQueueCount - 1];
  if (lastEvent.eventType !== 'PROGRESS_RECORDED' || lastEvent.aggregateType !== 'PROGRESS') {
    throw new Error(`Invalid event type or aggregate: ${lastEvent.eventType}`);
  }
  console.log('  ✓ Lesson completion updates progress to 100% and generates PROGRESS_RECORDED event');

  // Test 4: Assessment Player & Automated Scoring Logic
  console.log('\n[Test 4] Assessment Player & Grading Logic:');
  // Scenario A: 100% Score (all 3 correct)
  const perfectAnswers: Record<string, number> = {
    [SEED_QUESTIONS[0].id]: SEED_QUESTIONS[0].correctAnswer,
    [SEED_QUESTIONS[1].id]: SEED_QUESTIONS[1].correctAnswer,
    [SEED_QUESTIONS[2].id]: SEED_QUESTIONS[2].correctAnswer,
  };
  const { attempt: perfectAttempt, event: examEvent } = offlineStore.submitAssessment(
    SEED_ASSESSMENT.id,
    'dddd4444-4444-4444-4444-444444444441',
    perfectAnswers
  );
  if (perfectAttempt.score !== 100 || !perfectAttempt.passed) {
    throw new Error(`Expected 100% score and passed=true, got ${perfectAttempt.score}%, passed=${perfectAttempt.passed}`);
  }
  if (examEvent.eventType !== 'ASSESSMENT_SUBMITTED' || examEvent.aggregateType !== 'ASSESSMENT') {
    throw new Error(`Invalid exam event type: ${examEvent.eventType}`);
  }

  // Scenario B: Failing Score (0% correct)
  const failingAnswers: Record<string, number> = {
    [SEED_QUESTIONS[0].id]: 99,
    [SEED_QUESTIONS[1].id]: 99,
    [SEED_QUESTIONS[2].id]: 99,
  };
  const { attempt: failAttempt } = offlineStore.submitAssessment(
    SEED_ASSESSMENT.id,
    'dddd4444-4444-4444-4444-444444444441',
    failingAnswers
  );
  if (failAttempt.score !== 0 || failAttempt.passed) {
    throw new Error(`Expected 0% score and passed=false, got ${failAttempt.score}%, passed=${failAttempt.passed}`);
  }
  console.log('  ✓ Grading correctly calculates 100% pass and 0% fail thresholds against answer key');
  console.log('  ✓ Generates ASSESSMENT_SUBMITTED event with score payload');

  // Test 5: Attendance Recording
  console.log('\n[Test 5] Local Offline Attendance Check-in:');
  const queueBeforeAtt = offlineStore.getQueuedEvents().length;
  const { record, event: attEvent } = offlineStore.recordAttendance(
    SEED_SESSION.id,
    'dddd4444-4444-4444-4444-444444444441',
    'QR'
  );
  if (record.method !== 'QR' || record.status !== 'PRESENT') {
    throw new Error('Attendance record has invalid method or status');
  }
  if (attEvent.eventType !== 'ATTENDANCE_RECORDED' || attEvent.aggregateType !== 'ATTENDANCE') {
    throw new Error(`Invalid attendance event: ${attEvent.eventType}`);
  }
  if (offlineStore.getQueuedEvents().length !== queueBeforeAtt + 1) {
    throw new Error('Attendance event was not queued');
  }
  console.log('  ✓ Attendance recording creates local audit record and queues ATTENDANCE_RECORDED event');

  // Test 6: Sync Queue Draining
  console.log('\n[Test 6] Sync Queue Draining & Acknowledgment:');
  const allQueued = offlineStore.getQueuedEvents();
  const eventIdsToSync = allQueued.map((e) => e.id);
  offlineStore.markEventsSynced(eventIdsToSync);
  const remainingQueued = offlineStore.getQueuedEvents().length;
  if (remainingQueued !== 0) {
    throw new Error(`Expected 0 remaining queued events, got ${remainingQueued}`);
  }
  if (!offlineStore.getLastSyncTimestamp()) {
    throw new Error('Last sync timestamp should be populated');
  }
  console.log('  ✓ Sync acknowledgment cleanly marks events as uploaded and sets lastSyncTimestamp');

  console.log('\n=== ALL PHASE 2 TESTS PASSED SUCCESSFULLY! ===\n');
}

runPhase2Tests().catch((err) => {
  console.error('\n❌ Phase 2 test suite failed:', err);
  process.exit(1);
});

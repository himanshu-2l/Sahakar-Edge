import type {
  Course,
  Module,
  Lesson,
  Assessment,
  Question,
  SyncEvent,
  ContentManifest,
  OralQuestion,
  OralAssessmentResult,
  OralQuestionScore,
  OralAssessmentSubmittedPayload,
} from '@sahakar/types';
import { SyncStatus, SyncEventType } from '@sahakar/types';
import {
  SEED_COURSE,
  SEED_MODULE,
  SEED_LESSONS,
  SEED_ASSESSMENT,
  SEED_QUESTIONS,
  SEED_USERS,
  SEED_SESSION,
  SEED_ORAL_ASSESSMENT,
  SEED_ORAL_QUESTIONS,
} from '@sahakar/test-fixtures';
import {
  calculateEventHash,
  canonicalJsonStringify,
  sha256Hex,
} from '@sahakar/sync-protocol';

export interface LessonDetail extends Lesson {
  fullContentMarkdown: string;
  keyTakeaways: string[];
}

export interface AssessmentAttempt {
  assessmentId: string;
  traineeId: string;
  score: number;
  passed: boolean;
  totalQuestions: number;
  correctCount: number;
  submittedAt: string;
  answers: Record<string, number>;
}

export interface TraineeAttendanceRecord {
  sessionId: string;
  traineeId: string;
  timestamp: string;
  method: 'SIMULATED_FACE' | 'QR' | 'NFC' | 'MANUAL_OVERRIDE';
  status: 'PRESENT' | 'LATE' | 'ABSENT';
}

export interface LocalOfflineState {
  manifest: ContentManifest;
  lessonsDetail: Record<string, LessonDetail>;
  completedLessonIds: string[];
  assessmentAttempts: AssessmentAttempt[];
  oralAssessmentAttempts: OralAssessmentResult[];
  attendanceRecords: TraineeAttendanceRecord[];
  queuedEvents: SyncEvent[];
  lastSyncTimestamp: string | null;
  edgeNodeId: string;
}

const STORAGE_KEY = 'sahakar_edge_trainee_state_v1';

// Pre-packaged offline curriculum details for rural cooperative training
const INITIAL_LESSONS_DETAIL: Record<string, LessonDetail> = {
  '99999999-9999-9999-9999-999999999991': {
    ...SEED_LESSONS[0],
    fullContentMarkdown: `
# Lesson 1.1: Cooperative Principles & PACS Legal Architecture

### 1. The Core Cooperative Identity
A **Primary Agricultural Credit Society (PACS)** is the village-level foundation of India's short-term cooperative credit structure (STCCS). Under the National Cooperative Policy and State Cooperative Societies Acts, PACS are democratic member-driven institutions designed to provide credit, inputs, and fair-price market linkages.

### 2. The 7 Rochdale Cooperative Principles
1. **Voluntary and Open Membership**: Non-discriminatory access to all eligible rural producers.
2. **Democratic Member Control**: One member, one vote irrespective of shareholding.
3. **Member Economic Participation**: Capital receives limited compensation; surplus belongs to members.
4. **Autonomy and Independence**: Self-reliant, controlled by members.
5. **Education, Training, and Information**: NCCT mandate to upskill PACS staff and secretaries.
6. **Cooperation among Cooperatives**: Linkages between PACS, DCCBs, StCBs, and KRIBHCO/IFFCO.
7. **Concern for Community**: Sustainable rural economic development.

### 3. Statutory Reserve Fund Requirements
- Every cooperative society must transfer a statutory minimum percentage (typically 25%) of its net profits each year into the **Reserve Fund**.
- The Reserve Fund cannot be divided among members as dividends. It acts as an unbreakable buffer against bad debts, natural calamities, and liquidity shocks.
    `.trim(),
    keyTakeaways: [
      'PACS operate on one-member, one-vote democratic governance.',
      'At least 25% of annual net profit must be transferred to the Statutory Reserve Fund.',
      'Reserve funds protect member share capital from bad debts and cannot be distributed as dividend.',
    ],
  },
  '99999999-9999-9999-9999-999999999992': {
    ...SEED_LESSONS[1],
    fullContentMarkdown: `
# Lesson 1.2: Daybook, Cashbook & Member Loan Ledgers

### 1. Double-Entry Accounting in PACS
Every financial transaction impacts at least two accounts in opposing balance:
$$\\text{Total Debits} = \\text{Total Credits}$$

### 2. Daybook (Rojnamcha) Posting Procedures
- **Cash Receipts & Payments**: Must be verified and tallied at the end of each business day with physical vault cash balance.
- **Loan Disbursement Entry**:
  - **Debit**: Short-Term Agricultural Crop Loan Account (Asset increases)
  - **Credit**: Cash in Hand or Member SB Account (Asset decreases / Liability increases)
- **Loan Recovery Entry**:
  - **Debit**: Cash in Hand
  - **Credit**: Crop Loan Principal Account & Interest Receivable Account

### 3. End-of-Day Balancing Rule
Under NABARD computerization guidelines, no cashier or secretary can close the system if:
$$\\text{Opening Balance} + \\text{Total Receipts} \\neq \\text{Total Disbursements} + \\text{Closing Balance}$$
    `.trim(),
    keyTakeaways: [
      'Daybook must balance physically with cash in the vault before closing every evening.',
      'Crop loan disbursement debits the Loan Asset Account and credits Cash/Member SB Account.',
      'Loan recovery separates principal reduction from interest income.',
    ],
  },
};

export const INITIAL_MANIFEST: ContentManifest = {
  courseId: SEED_COURSE.id,
  version: 1,
  generatedAt: '2026-09-01T00:00:00.000Z',
  modules: [SEED_MODULE],
  lessons: SEED_LESSONS,
  assessments: [SEED_ASSESSMENT],
  assets: [
    {
      uri: '/content/lessons/lesson_1_1.md',
      sha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
      sizeBytes: 1540,
    },
    {
      uri: '/content/lessons/lesson_1_2.md',
      sha256: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
      sizeBytes: 1820,
    },
  ],
};

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function computeSimpleHash(input: string): string {
  return sha256Hex(input);
}

export interface SubmitOralAssessmentParams {
  assessmentId?: string;
  traineeId: string;
  language?: 'HI' | 'EN';
  responses: Array<{
    questionId: string;
    transcript: string;
  }>;
}

/**
 * Real-time keyword scoring engine for rural cooperative accounting oral viva.
 * Evaluates trainee oral transcript against expected technical terms.
 */
export function evaluateOralQuestion(
  question: OralQuestion,
  rawTranscript: string,
  language: 'HI' | 'EN' = 'EN'
): OralQuestionScore {
  const normalized = (rawTranscript || '').toLowerCase();

  const primaryKeywords = language === 'HI' ? question.expectedKeywordsHi : question.expectedKeywords;
  const secondaryKeywords = language === 'HI' ? question.expectedKeywords : question.expectedKeywordsHi;

  const matchedKeywords: string[] = [];
  const missingKeywords: string[] = [];

  for (const kw of primaryKeywords) {
    const cleanKw = kw.toLowerCase().trim();
    if (!cleanKw) continue;
    if (normalized.includes(cleanKw)) {
      if (!matchedKeywords.includes(kw)) {
        matchedKeywords.push(kw);
      }
    } else {
      missingKeywords.push(kw);
    }
  }

  // Bilingual flexibility: if trainee used technical loanwords
  for (const kw of secondaryKeywords) {
    const cleanKw = kw.toLowerCase().trim();
    if (!cleanKw) continue;
    if (normalized.includes(cleanKw)) {
      if (!matchedKeywords.includes(kw)) {
        matchedKeywords.push(kw);
      }
    }
  }

  // Scoring rubric: passingKeywordThreshold (e.g. 2 keywords)
  const threshold = Math.max(1, question.passingKeywordThreshold || 2);
  const masteryTarget = Math.min(primaryKeywords.length, Math.max(threshold * 2, 4));
  let score = 0;
  if (matchedKeywords.length >= masteryTarget) {
    score = 100;
  } else if (matchedKeywords.length >= threshold) {
    const ratio = (matchedKeywords.length - threshold) / Math.max(1, masteryTarget - threshold);
    score = Math.min(100, Math.round(75 + ratio * 25));
  } else if (matchedKeywords.length > 0) {
    score = Math.round((matchedKeywords.length / threshold) * 50);
  } else {
    score = 0;
  }

  return {
    questionId: question.id,
    prompt: language === 'HI' ? question.promptHi : question.prompt,
    transcript: rawTranscript,
    matchedKeywords,
    missingKeywords,
    score,
  };
}

class OfflineStore {
  private state: LocalOfflineState;

  constructor() {
    this.state = this.loadFromDisk();
  }

  private loadFromDisk(): LocalOfflineState {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (!parsed.oralAssessmentAttempts) {
            parsed.oralAssessmentAttempts = [];
          }
          return parsed;
        }
      } catch (err) {
        console.warn('Failed to parse localStorage state:', err);
      }
    }

    return {
      manifest: INITIAL_MANIFEST,
      lessonsDetail: INITIAL_LESSONS_DETAIL,
      completedLessonIds: [SEED_LESSONS[0].id], // Seed with Lesson 1.1 already completed
      assessmentAttempts: [],
      oralAssessmentAttempts: [],
      attendanceRecords: [
        {
          sessionId: SEED_SESSION.id,
          traineeId: 'dddd4444-4444-4444-4444-444444444441',
          timestamp: '2026-09-28T09:32:00.000Z',
          method: 'QR',
          status: 'PRESENT',
        },
      ],
      queuedEvents: [
        {
          id: '10000000-0000-0000-0000-000000000001',
          nodeId: 'edge-node-ricm-bhopal-01',
          aggregateType: 'ATTENDANCE',
          aggregateId: SEED_SESSION.id,
          eventType: 'ATTENDANCE_RECORDED',
          payload: {
            sessionId: SEED_SESSION.id,
            traineeId: 'dddd4444-4444-4444-4444-444444444441',
            verificationMethod: 'QR',
            status: 'PRESENT',
            recordedAt: '2026-09-28T09:32:00.000Z',
          },
          schemaVersion: 1,
          occurredAt: '2026-09-28T09:32:00.000Z',
          logicalSequence: 101,
          hash: 'sha256_mock_att_hash_101',
          syncStatus: SyncStatus.QUEUED,
          retryCount: 0,
        },
        {
          id: '10000000-0000-0000-0000-000000000002',
          nodeId: 'edge-node-ricm-bhopal-01',
          aggregateType: 'PROGRESS',
          aggregateId: SEED_LESSONS[0].id,
          eventType: 'PROGRESS_RECORDED',
          payload: {
            traineeId: 'dddd4444-4444-4444-4444-444444444441',
            lessonId: SEED_LESSONS[0].id,
            completed: true,
            completedAt: '2026-09-28T10:15:00.000Z',
          },
          schemaVersion: 1,
          occurredAt: '2026-09-28T10:15:00.000Z',
          logicalSequence: 102,
          hash: 'sha256_mock_prog_hash_102',
          syncStatus: SyncStatus.QUEUED,
          retryCount: 0,
        },
      ],
      lastSyncTimestamp: null,
      edgeNodeId: 'edge-node-ricm-bhopal-01',
    };
  }

  private saveToDisk(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      } catch (err) {
        console.warn('Failed to save to localStorage:', err);
      }
    }
  }

  public getManifest(): ContentManifest {
    return this.state.manifest;
  }

  public getCourse(): Course {
    return SEED_COURSE;
  }

  public getModules(): Module[] {
    return this.state.manifest.modules;
  }

  public getLessons(): Lesson[] {
    return this.state.manifest.lessons;
  }

  public getLessonDetail(id: string): LessonDetail | undefined {
    return this.state.lessonsDetail[id];
  }

  public getAssessment(): Assessment {
    return SEED_ASSESSMENT;
  }

  public getQuestions(): Question[] {
    return SEED_QUESTIONS;
  }

  public isLessonCompleted(lessonId: string): boolean {
    return this.state.completedLessonIds.includes(lessonId);
  }

  public getCompletedLessons(): string[] {
    return [...this.state.completedLessonIds];
  }

  public getProgressPercentage(): number {
    const total = this.state.manifest.lessons.length;
    if (total === 0) return 0;
    const completed = this.state.completedLessonIds.length;
    return Math.round((completed / total) * 100);
  }

  public completeLesson(lessonId: string, traineeId: string): void {
    if (!this.state.completedLessonIds.includes(lessonId)) {
      this.state.completedLessonIds.push(lessonId);
    }

    const eventId = generateUUID();
    const now = new Date().toISOString();
    const seq = 100 + this.state.queuedEvents.length + 1;

    const payload = {
      traineeId,
      lessonId,
      courseId: SEED_COURSE.id,
      completed: true,
      completedAt: now,
    };

    const hash = computeSimpleHash(`PROGRESS:${lessonId}:${JSON.stringify(payload)}`);

    const newEvent: SyncEvent = {
      id: eventId,
      nodeId: this.state.edgeNodeId,
      aggregateType: 'PROGRESS',
      aggregateId: lessonId,
      eventType: 'PROGRESS_RECORDED',
      payload,
      schemaVersion: 1,
      occurredAt: now,
      logicalSequence: seq,
      hash,
      syncStatus: SyncStatus.QUEUED,
      retryCount: 0,
    };

    this.state.queuedEvents.push(newEvent);
    this.saveToDisk();
  }

  public submitAssessment(
    assessmentId: string,
    traineeId: string,
    answers: Record<string, number>
  ): { attempt: AssessmentAttempt; event: SyncEvent } {
    const questions = SEED_QUESTIONS;
    let correctCount = 0;

    questions.forEach((q) => {
      const selected = answers[q.id];
      if (selected !== undefined && selected === q.correctAnswer) {
        correctCount++;
      }
    });

    const score = Math.round((correctCount / questions.length) * 100);
    const passed = score >= SEED_ASSESSMENT.passingScore;
    const now = new Date().toISOString();

    const attempt: AssessmentAttempt = {
      assessmentId,
      traineeId,
      score,
      passed,
      totalQuestions: questions.length,
      correctCount,
      submittedAt: now,
      answers,
    };

    this.state.assessmentAttempts.push(attempt);

    const eventId = generateUUID();
    const seq = 100 + this.state.queuedEvents.length + 1;
    const payload = {
      assessmentId,
      traineeId,
      courseId: SEED_COURSE.id,
      score,
      passed,
      totalQuestions: questions.length,
      correctCount,
      submittedAt: now,
      answers,
    };

    const hash = computeSimpleHash(`ASSESSMENT:${assessmentId}:${JSON.stringify(payload)}`);

    const event: SyncEvent = {
      id: eventId,
      nodeId: this.state.edgeNodeId,
      aggregateType: 'ASSESSMENT',
      aggregateId: assessmentId,
      eventType: 'ASSESSMENT_SUBMITTED',
      payload,
      schemaVersion: 1,
      occurredAt: now,
      logicalSequence: seq,
      hash,
      syncStatus: SyncStatus.QUEUED,
      retryCount: 0,
    };

    this.state.queuedEvents.push(event);
    this.saveToDisk();

    return { attempt, event };
  }

  public recordAttendance(
    sessionId: string,
    traineeId: string,
    method: 'SIMULATED_FACE' | 'QR' | 'NFC' | 'MANUAL_OVERRIDE'
  ): { record: TraineeAttendanceRecord; event: SyncEvent } {
    const now = new Date().toISOString();
    const record: TraineeAttendanceRecord = {
      sessionId,
      traineeId,
      timestamp: now,
      method,
      status: 'PRESENT',
    };

    this.state.attendanceRecords.push(record);

    const eventId = generateUUID();
    const seq = 100 + this.state.queuedEvents.length + 1;
    const payload = {
      sessionId,
      traineeId,
      verificationMethod: method,
      status: 'PRESENT',
      recordedAt: now,
    };

    const hash = computeSimpleHash(`ATTENDANCE:${sessionId}:${JSON.stringify(payload)}`);

    const event: SyncEvent = {
      id: eventId,
      nodeId: this.state.edgeNodeId,
      aggregateType: 'ATTENDANCE',
      aggregateId: sessionId,
      eventType: 'ATTENDANCE_RECORDED',
      payload,
      schemaVersion: 1,
      occurredAt: now,
      logicalSequence: seq,
      hash,
      syncStatus: SyncStatus.QUEUED,
      retryCount: 0,
    };

    this.state.queuedEvents.push(event);
    this.saveToDisk();

    return { record, event };
  }

  /**
   * Submits trainee oral viva assessment:
   * - Evaluates keyword scoring for cooperative terminology across each question
   * - Computes total score, percentage, and 70% passing threshold
   * - Assembles SyncEvent with aggregateType 'ASSESSMENT' and eventType 'ORAL_ASSESSMENT_SUBMITTED'
   * - Computes canonical RFC 8785 JSON SHA-256 hash
   * - Appends to local offline journal (queuedEvents)
   */
  public submitOralAssessment(params: SubmitOralAssessmentParams): {
    result: OralAssessmentResult;
    event: SyncEvent<OralAssessmentSubmittedPayload>;
  } {
    const assessmentId = params.assessmentId || SEED_ORAL_ASSESSMENT.id;
    const traineeId = params.traineeId;
    const language = params.language || 'EN';
    const responseMap = new Map(params.responses.map((r) => [r.questionId, r.transcript]));

    const evaluatedQuestions: OralQuestionScore[] = SEED_ORAL_QUESTIONS.map((q) => {
      const transcript = responseMap.get(q.id) || '';
      return evaluateOralQuestion(q, transcript, language);
    });

    const totalScore = evaluatedQuestions.reduce((sum, q) => sum + q.score, 0);
    const maxScore = evaluatedQuestions.length * 100;
    const percentage = Math.round((totalScore / maxScore) * 100);
    const passed = percentage >= 70;
    const completedAt = new Date().toISOString();

    const result: OralAssessmentResult = {
      assessmentId,
      traineeId,
      language,
      questions: evaluatedQuestions,
      totalScore,
      maxScore,
      percentage,
      passed,
      completedAt,
    };

    if (!this.state.oralAssessmentAttempts) {
      this.state.oralAssessmentAttempts = [];
    }
    this.state.oralAssessmentAttempts.push(result);

    const eventId = generateUUID();
    const seq = 100 + this.state.queuedEvents.length + 1;

    const payload: OralAssessmentSubmittedPayload = {
      ...result,
      nodeId: this.state.edgeNodeId,
      score: percentage,
      correctCount: evaluatedQuestions.filter((q) => q.score >= 70).length,
      totalQuestions: evaluatedQuestions.length,
      answers: Object.fromEntries(responseMap),
    };

    // Calculate RFC 8785 canonical hash using isomorphic sha256Hex
    const hash = calculateEventHash(
      'ASSESSMENT',
      assessmentId,
      'ORAL_ASSESSMENT_SUBMITTED',
      payload as unknown as Record<string, unknown>,
      seq
    );

    const event: SyncEvent<OralAssessmentSubmittedPayload> = {
      id: eventId,
      nodeId: this.state.edgeNodeId,
      aggregateType: 'ASSESSMENT',
      aggregateId: assessmentId,
      eventType: 'ORAL_ASSESSMENT_SUBMITTED',
      payload,
      schemaVersion: 1,
      occurredAt: completedAt,
      logicalSequence: seq,
      hash,
      syncStatus: SyncStatus.QUEUED,
      retryCount: 0,
    };

    this.state.queuedEvents.push(event as unknown as SyncEvent);
    this.saveToDisk();

    return { result, event };
  }

  public getOralAssessmentAttempts(traineeId?: string): OralAssessmentResult[] {
    const list = this.state.oralAssessmentAttempts || [];
    if (traineeId) {
      return list.filter((a) => a.traineeId === traineeId);
    }
    return [...list];
  }

  public getLatestOralAssessment(traineeId?: string): OralAssessmentResult | null {
    const attempts = this.getOralAssessmentAttempts(traineeId);
    if (attempts.length === 0) return null;
    return attempts[attempts.length - 1];
  }

  public getAssessmentAttempts(): AssessmentAttempt[] {
    return [...this.state.assessmentAttempts];
  }

  public getAttendanceRecords(): TraineeAttendanceRecord[] {
    return [...this.state.attendanceRecords];
  }

  public getQueuedEvents(): SyncEvent[] {
    return [...this.state.queuedEvents];
  }

  public markEventsSynced(eventIds: string[]): void {
    this.state.queuedEvents = this.state.queuedEvents.filter(
      (e) => !eventIds.includes(e.id)
    );
    this.state.lastSyncTimestamp = new Date().toISOString();
    this.saveToDisk();
  }

  public clearAllData(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    this.state = this.loadFromDisk();
  }

  public getLastSyncTimestamp(): string | null {
    return this.state.lastSyncTimestamp;
  }
}

export const offlineStore = new OfflineStore();

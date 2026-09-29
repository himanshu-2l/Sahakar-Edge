import React, { useState, useEffect } from 'react';
import {
  SEED_PROGRAMME,
  SEED_COURSE,
  SEED_SESSION,
  SEED_USERS,
  SEED_JOB_OPPORTUNITY,
  SEED_JOB_OPPORTUNITIES,
  SEED_JOB_REQUIRED_SKILLS,
} from '@sahakar/test-fixtures';
import {
  offlineStore,
  LessonDetail,
  AssessmentAttempt,
} from './services/offline-store';
import type { SyncEvent, Question } from '@sahakar/types';

export default function App() {
  const [activeTab, setActiveTab] = useState<
    'HOME' | 'LEARN' | 'PROGRESS' | 'CREDENTIALS' | 'OPPORTUNITIES' | 'PROFILE'
  >('HOME');

  // Network simulation state per 04_OFFLINE_SYNC_PROTOCOL.md
  const [wanMode, setWanMode] = useState<'OFFLINE' | 'ONLINE' | 'FLAKY'>('OFFLINE');
  const [queuedEvents, setQueuedEvents] = useState<SyncEvent[]>([]);
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);
  const [progressPercent, setProgressPercent] = useState<number>(50);
  const [attempts, setAttempts] = useState<AssessmentAttempt[]>([]);

  // Modals
  const [activeLesson, setActiveLesson] = useState<LessonDetail | null>(null);
  const [isAssessmentOpen, setIsAssessmentOpen] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizResult, setQuizResult] = useState<{
    score: number;
    passed: boolean;
    correctCount: number;
    total: number;
  } | null>(null);

  // Trainee identity
  const trainee = SEED_USERS.find((u) => u.role === 'TRAINEE') || SEED_USERS[3];

  const refreshState = () => {
    setQueuedEvents(offlineStore.getQueuedEvents());
    setCompletedLessonIds(offlineStore.getCompletedLessons());
    setProgressPercent(offlineStore.getProgressPercentage());
    setAttempts(offlineStore.getAssessmentAttempts());
  };

  useEffect(() => {
    refreshState();
  }, []);

  const handleCompleteLesson = (lessonId: string) => {
    offlineStore.completeLesson(lessonId, trainee.id);
    refreshState();
    setActiveLesson(null);
  };

  const handleMarkAttendance = () => {
    offlineStore.recordAttendance(SEED_SESSION.id, trainee.id, 'QR');
    refreshState();
  };

  const handleQuizSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const questions = offlineStore.getQuestions();
    const unanswered = questions.filter((q) => quizAnswers[q.id] === undefined);
    if (unanswered.length > 0) {
      alert(`Please answer all questions before submitting. (${unanswered.length} remaining)`);
      return;
    }

    const { attempt } = offlineStore.submitAssessment(
      offlineStore.getAssessment().id,
      trainee.id,
      quizAnswers
    );

    setQuizResult({
      score: attempt.score,
      passed: attempt.passed,
      correctCount: attempt.correctCount,
      total: attempt.totalQuestions,
    });
    refreshState();
  };

  const handleSimulateSync = () => {
    if (wanMode === 'OFFLINE') {
      alert('Cannot sync while in OFFLINE mode. Switch WAN mode to ONLINE first.');
      return;
    }
    const current = offlineStore.getQueuedEvents();
    if (current.length === 0) {
      alert('Queue is already empty.');
      return;
    }
    offlineStore.markEventsSynced(current.map((e) => e.id));
    refreshState();
    alert(`Successfully synchronized ${current.length} domain events with Central Cloud API!`);
  };

  const handleResetData = () => {
    if (confirm('Reset local offline demo data to defaults?')) {
      offlineStore.clearAllData();
      refreshState();
      setQuizAnswers({});
      setQuizResult(null);
    }
  };

  const lessons = offlineStore.getLessons();
  const questions = offlineStore.getQuestions();
  const assessment = offlineStore.getAssessment();
  const isOffline = wanMode === 'OFFLINE' || wanMode === 'FLAKY';

  return (
    <div
      style={{
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        maxWidth: '520px',
        margin: '0 auto',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#f1f5f9',
        color: '#0f172a',
        boxShadow: '0 0 20px rgba(0,0,0,0.05)',
      }}
    >
      {/* Offline Status & WAN Simulation Banner per 07_UI_UX_SPEC.md & 04_OFFLINE_SYNC_PROTOCOL.md */}
      <div
        style={{
          backgroundColor: isOffline ? '#ea580c' : '#16a34a',
          color: '#ffffff',
          padding: '0.6rem 1rem',
          fontSize: '0.8rem',
          fontWeight: 600,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span>{isOffline ? '⚡' : '✓'}</span>
          <span>
            {isOffline
              ? 'Offline — Working from Sahakar Edge Node'
              : 'All records synchronized centrally'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <select
            value={wanMode}
            onChange={(e) => setWanMode(e.target.value as any)}
            style={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              color: '#ffffff',
              border: '1px solid rgba(255,255,255,0.4)',
              borderRadius: '4px',
              padding: '0.2rem 0.4rem',
              fontSize: '0.7rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <option value="OFFLINE" style={{ color: '#000' }}>WAN: OFFLINE</option>
            <option value="ONLINE" style={{ color: '#000' }}>WAN: ONLINE</option>
            <option value="FLAKY" style={{ color: '#000' }}>WAN: FLAKY</option>
          </select>

          <span
            title="Queued local events waiting for sync"
            style={{
              backgroundColor: 'rgba(0,0,0,0.25)',
              padding: '0.15rem 0.5rem',
              borderRadius: '12px',
              fontSize: '0.75rem',
              fontWeight: 700,
            }}
          >
            Queue: {queuedEvents.length}
          </span>
        </div>
      </div>

      {/* Header */}
      <header
        style={{
          padding: '0.85rem 1rem',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <div
            style={{
              fontSize: '0.7rem',
              color: '#0369a1',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            NCCT Cooperative Training
          </div>
          <h1 style={{ fontSize: '1.15rem', margin: '0.15rem 0 0 0', color: '#0f172a' }}>
            Namaste, {trainee.name.split(' ')[0]}
          </h1>
        </div>
        <div
          style={{
            fontSize: '0.7rem',
            backgroundColor: '#e0f2fe',
            color: '#0369a1',
            padding: '0.25rem 0.5rem',
            borderRadius: '4px',
            fontWeight: 700,
          }}
        >
          RICM Bhopal
        </div>
      </header>

      {/* Main Screen Content */}
      <main style={{ flex: 1, padding: '1rem', overflowY: 'auto' }}>
        {/* ========================================================
            TAB 1: HOME
        ======================================================== */}
        {activeTab === 'HOME' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Current Programme Card */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                padding: '1rem',
                border: '1px solid #e2e8f0',
              }}
            >
              <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                Enrolled Programme
              </div>
              <h2 style={{ fontSize: '0.95rem', margin: '0.25rem 0 0.4rem 0', color: '#0369a1', lineHeight: '1.3' }}>
                {SEED_PROGRAMME.title}
              </h2>
              <div style={{ fontSize: '0.8rem', color: '#475569', display: 'flex', gap: '0.5rem' }}>
                <span>Cohort: 2026-A</span>
                <span>•</span>
                <span>Venue: RICM Bhopal Lab 1</span>
              </div>
            </div>

            {/* Attendance Status & Offline Check-in */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                padding: '1rem',
                border: '1px solid #e2e8f0',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                  Today's Session Attendance
                </span>
                <span style={{ fontSize: '0.7rem', backgroundColor: '#dcfce7', color: '#166534', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: 700 }}>
                  Active
                </span>
              </div>
              <h3 style={{ fontSize: '0.9rem', margin: '0.35rem 0 0.25rem 0', color: '#0f172a' }}>
                {SEED_SESSION.title}
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0 0 0.75rem 0' }}>
                Timings: 09:30 AM – 12:30 PM (Required: 60 mins)
              </p>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={handleMarkAttendance}
                  style={{
                    flex: 1,
                    backgroundColor: '#0284c7',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  ⚡ Local QR Check-in
                </button>
                <div
                  style={{
                    padding: '0.4rem 0.75rem',
                    backgroundColor: '#f1f5f9',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    color: '#16a34a',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  ✓ Checked-in
                </div>
              </div>
            </div>

            {/* Course Progress Snapshot */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                padding: '1rem',
                border: '1px solid #e2e8f0',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.4rem' }}>
                <span style={{ fontWeight: 700, color: '#334155' }}>Course Syllabus Progress</span>
                <span style={{ fontWeight: 800, color: '#0284c7' }}>{progressPercent}% Complete</span>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${progressPercent}%`, height: '100%', backgroundColor: '#0284c7', transition: 'width 0.3s ease' }} />
              </div>

              <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: '#475569' }}>
                  {completedLessonIds.length} of {lessons.length} lessons finished
                </span>
                <button
                  onClick={() => setActiveTab('LEARN')}
                  style={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: '#0f172a',
                    cursor: 'pointer',
                  }}
                >
                  Open Lessons →
                </button>
              </div>
            </div>

            {/* Assessment Quick Launcher */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                padding: '1rem',
                border: '1px solid #e2e8f0',
              }}
            >
              <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                Certification Exam
              </div>
              <h3 style={{ fontSize: '0.9rem', margin: '0.25rem 0 0.35rem 0', color: '#0f172a' }}>
                {assessment.title}
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0 0 0.75rem 0' }}>
                Offline Examination • 3 Questions • Passing score: {assessment.passingScore}%
              </p>
              <button
                onClick={() => {
                  setIsAssessmentOpen(true);
                  setQuizResult(null);
                }}
                style={{
                  width: '100%',
                  backgroundColor: '#16a34a',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.55rem',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Launch Offline Exam
              </button>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 2: LEARN
        ======================================================== */}
        {activeTab === 'LEARN' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                padding: '1rem',
                border: '1px solid #e2e8f0',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ fontSize: '0.7rem', backgroundColor: '#e0f2fe', color: '#0369a1', padding: '0.2rem 0.4rem', borderRadius: '4px', fontWeight: 700 }}>
                    Local Content Manifest Ready
                  </span>
                  <h2 style={{ fontSize: '1rem', margin: '0.4rem 0 0.2rem 0', color: '#0f172a' }}>
                    {SEED_COURSE.title}
                  </h2>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>
                    Language: Hindi/English • Version 1.0 • NCCT Approved
                  </p>
                </div>
              </div>
            </div>

            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
              Module 1: Daily Voucher Entry & Ledger Balancing
            </div>

            {lessons.map((lesson, idx) => {
              const isDone = completedLessonIds.includes(lesson.id);
              const detail = offlineStore.getLessonDetail(lesson.id);

              return (
                <div
                  key={lesson.id}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    padding: '1rem',
                    border: isDone ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>
                      Lesson {idx + 1}
                    </span>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        backgroundColor: isDone ? '#dcfce7' : '#f1f5f9',
                        color: isDone ? '#166534' : '#64748b',
                        padding: '0.15rem 0.4rem',
                        borderRadius: '4px',
                      }}
                    >
                      {isDone ? '✓ Completed' : 'Available Offline'}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '0.9rem', margin: '0.4rem 0 0.35rem 0', color: '#0f172a' }}>
                    {lesson.title}
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0 0 0.75rem 0' }}>
                    Format: {lesson.type} • Local Asset: {lesson.localAssetRef}
                  </p>

                  <button
                    onClick={() => {
                      if (detail) {
                        setActiveLesson(detail);
                      }
                    }}
                    style={{
                      backgroundColor: '#0284c7',
                      color: '#ffffff',
                      border: 'none',
                      padding: '0.45rem 0.85rem',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Read Lesson Offline →
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* ========================================================
            TAB 3: PROGRESS
        ======================================================== */}
        {activeTab === 'PROGRESS' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                padding: '1rem',
                border: '1px solid #e2e8f0',
              }}
            >
              <h2 style={{ fontSize: '0.95rem', margin: '0 0 0.5rem 0' }}>Overall Competency Progress</h2>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.3rem' }}>
                <span>Completion Status</span>
                <span style={{ fontWeight: 800, color: '#0284c7' }}>{progressPercent}%</span>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${progressPercent}%`, height: '100%', backgroundColor: '#0284c7' }} />
              </div>
            </div>

            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                padding: '1rem',
                border: '1px solid #e2e8f0',
              }}
            >
              <h3 style={{ fontSize: '0.9rem', margin: '0 0 0.5rem 0' }}>Completed Modules & Lessons</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {lessons.map((lesson) => {
                  const done = completedLessonIds.includes(lesson.id);
                  return (
                    <div
                      key={lesson.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.5rem',
                        backgroundColor: done ? '#f0fdf4' : '#f8fafc',
                        borderRadius: '6px',
                        border: '1px solid #e2e8f0',
                        fontSize: '0.8rem',
                      }}
                    >
                      <span style={{ color: done ? '#166534' : '#64748b' }}>{lesson.title}</span>
                      <span style={{ fontWeight: 700, color: done ? '#16a34a' : '#94a3b8' }}>
                        {done ? '✓ Done' : 'Pending'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Assessment Records */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                padding: '1rem',
                border: '1px solid #e2e8f0',
              }}
            >
              <h3 style={{ fontSize: '0.9rem', margin: '0 0 0.5rem 0' }}>Assessment Evaluation Log</h3>
              {attempts.length === 0 ? (
                <div style={{ fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic' }}>
                  No exam attempts recorded yet. Launch the offline exam to test your competency.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {attempts.map((att, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '0.6rem',
                        borderRadius: '6px',
                        backgroundColor: att.passed ? '#f0fdf4' : '#fef2f2',
                        border: att.passed ? '1px solid #bbf7d0' : '1px solid #fecaca',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}>
                          Attempt #{idx + 1} • {att.score}%
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                          {att.correctCount}/{att.totalQuestions} questions correct
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          color: att.passed ? '#15803d' : '#b91c1c',
                        }}
                      >
                        {att.passed ? 'PASSED' : 'NEEDS RETAKE'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 4: CREDENTIALS
        ======================================================== */}
        {activeTab === 'CREDENTIALS' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                padding: '1.25rem',
                border: '2px solid #0284c7',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#16a34a' }}>
                  ✓ ED25519 CRYPTOGRAPHICALLY SIGNED
                </span>
                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>NCCT Official</span>
              </div>

              <h2 style={{ fontSize: '1.05rem', margin: '0.5rem 0 0.25rem 0', color: '#0f172a' }}>
                Certificate of Competency in PACS Ledgering & Governance
              </h2>
              <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                Awarded to: <strong>{trainee.name}</strong>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
                Credential ID: <code>cred-pacs-2026-0814</code>
              </div>

              <div
                style={{
                  marginTop: '1rem',
                  padding: '1rem',
                  backgroundColor: '#f8fafc',
                  borderRadius: '6px',
                  border: '1px dashed #cbd5e1',
                  textAlign: 'center',
                }}
              >
                <div style={{ width: '100px', height: '100px', margin: '0 auto', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px', fontSize: '0.75rem', color: '#475569', fontWeight: 700 }}>
                  [QR Stamp]
                </div>
                <div style={{ fontSize: '0.75rem', color: '#0369a1', fontWeight: 700, marginTop: '0.5rem' }}>
                  Public Verifier Hash: 8f42…39e1
                </div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.2rem' }}>
                  Algorithm: Ed25519 Native • Offline Tamper-Evident
                </div>
              </div>

              <div style={{ marginTop: '1rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase' }}>
                  Verified Skills Attached:
                </div>
                <ul style={{ margin: '0.4rem 0 0 1rem', padding: 0, fontSize: '0.75rem', color: '#475569' }}>
                  <li>PACS Double-Entry Accounting (Score: 100%)</li>
                  <li>Statutory Reserve Fund Management</li>
                  <li>Attendance Discipline (RICM Bhopal Cohort)</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 5: OPPORTUNITIES (Explainable Job Matching)
        ======================================================== */}
        {activeTab === 'OPPORTUNITIES' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Notice header explaining transparent scoring */}
            <div
              style={{
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '8px',
                padding: '0.75rem',
              }}
            >
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e40af', marginBottom: '0.2rem' }}>
                NCCT Transparent Cooperative Job Matching
              </div>
              <div style={{ fontSize: '0.75rem', color: '#1e3a8a', lineHeight: 1.4 }}>
                Matches are determined strictly by verified skill evidence and Ed25519 credentials.
                No speculative probability or opaque AI scores.
              </div>
            </div>

            {/* List of cooperative job opportunities */}
            {SEED_JOB_OPPORTUNITIES.map((job) => {
              const reqs = SEED_JOB_REQUIRED_SKILLS.filter((r) => r.jobId === job.id);
              // Trainee Anita Patel's verified skills: PACS_ACCOUNTING, VOUCHER_ENTRY, COOP_GOVERNANCE
              const anitaSkillCodes = ['PACS_ACCOUNTING', 'VOUCHER_ENTRY', 'COOP_GOVERNANCE'];
              
              const matchedReqs = reqs.filter((r) => r.skillCode && anitaSkillCodes.includes(r.skillCode));
              const missingReqs = reqs.filter((r) => !r.skillCode || !anitaSkillCodes.includes(r.skillCode));
              
              const totalWeight = reqs.reduce((sum, r) => sum + r.weight, 0);
              const matchedWeight = matchedReqs.reduce((sum, r) => sum + r.weight, 0);
              const matchScore = totalWeight > 0 ? Math.round((matchedWeight / totalWeight) * 100) : 0;
              const isHighMatch = matchScore >= 70;

              return (
                <div
                  key={job.id}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    padding: '1rem',
                    border: isHighMatch ? '1.5px solid #22c55e' : '1px solid #e2e8f0',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        backgroundColor: isHighMatch ? '#dcfce7' : '#f1f5f9',
                        color: isHighMatch ? '#15803d' : '#475569',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        fontWeight: 700,
                      }}
                    >
                      {isHighMatch ? `High Match • ${matchScore}% Verified Overlap` : `${matchScore}% Verified Overlap`}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                      {job.experienceYears > 0 ? `${job.experienceYears} yr exp` : 'Freshers Welcome'}
                    </span>
                  </div>

                  <h2 style={{ fontSize: '1rem', margin: '0.5rem 0 0.25rem 0', color: '#0f172a' }}>
                    {job.title}
                  </h2>
                  <div style={{ fontSize: '0.8rem', color: '#0369a1', fontWeight: 700 }}>
                    Employer: {job.employerName || 'Cooperative Talent Network'}
                  </div>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.25rem 0 0.5rem 0' }}>
                    Location: {job.location} • Qualification: {job.qualification}
                  </p>

                  {/* Explainable Skill Breakdown per 06_CREDENTIALS_SKILLS_EMPLOYMENT.md */}
                  <div
                    style={{
                      backgroundColor: '#f8fafc',
                      padding: '0.75rem',
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0',
                      marginTop: '0.5rem',
                    }}
                  >
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
                      Transparent Skill Breakdown:
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      {matchedReqs.map((m) => (
                        <div
                          key={m.skillId}
                          style={{
                            fontSize: '0.75rem',
                            color: '#16a34a',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                          }}
                        >
                          <span>✓ Matched:</span> {m.skillName || m.skillCode} (Weight: {Math.round(m.weight * 100)}%)
                        </div>
                      ))}
                      {missingReqs.map((m) => (
                        <div
                          key={m.skillId}
                          style={{
                            fontSize: '0.75rem',
                            color: '#64748b',
                            fontWeight: 500,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                          }}
                        >
                          <span>○ Missing:</span> {m.skillName || m.skillCode} (Weight: {Math.round(m.weight * 100)}%)
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      alert(`Application submitted to ${job.employerName || 'Employer'} with verified NCCT credential!`)
                    }
                    style={{
                      width: '100%',
                      marginTop: '0.75rem',
                      backgroundColor: isHighMatch ? '#0284c7' : '#64748b',
                      color: '#ffffff',
                      border: 'none',
                      padding: '0.5rem',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {isHighMatch ? 'Apply with Verified Credential' : 'View Job & Training Pathways'}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* ========================================================
            TAB 6: PROFILE & LOCAL JOURNAL
        ======================================================== */}
        {activeTab === 'PROFILE' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                padding: '1rem',
                border: '1px solid #e2e8f0',
              }}
            >
              <h2 style={{ fontSize: '0.95rem', margin: '0 0 0.5rem 0' }}>Trainee Profile & Identity</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.8rem' }}>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.7rem' }}>NAME</span>
                  <div style={{ fontWeight: 700 }}>{trainee.name}</div>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.7rem' }}>IDENTIFIER</span>
                  <div style={{ fontWeight: 700 }}>{trainee.emailOrPhone}</div>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.7rem' }}>INSTITUTE</span>
                  <div style={{ fontWeight: 700 }}>RICM Bhopal</div>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.7rem' }}>ROLE</span>
                  <div style={{ fontWeight: 700, color: '#0369a1' }}>TRAINEE (Enrolled)</div>
                </div>
              </div>
            </div>

            {/* Edge Node Hardware & Sync Status */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                padding: '1rem',
                border: '1px solid #e2e8f0',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '0.9rem', margin: 0 }}>Edge Node Association</h3>
                <span style={{ fontSize: '0.7rem', backgroundColor: '#e0f2fe', color: '#0369a1', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: 700 }}>
                  RICM-NODE-01
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.35rem' }}>
                IP: 192.168.4.1 • SSID: SahakarEdge_Bhopal • SQLite WAL
              </div>

              <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={handleSimulateSync}
                  style={{
                    flex: 1,
                    backgroundColor: '#16a34a',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.45rem',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Synchronize with Cloud Now
                </button>
                <button
                  onClick={handleResetData}
                  style={{
                    backgroundColor: '#f8fafc',
                    color: '#b91c1c',
                    border: '1px solid #fecaca',
                    padding: '0.45rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Local Event Journal Inspector */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                padding: '1rem',
                border: '1px solid #e2e8f0',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h3 style={{ fontSize: '0.9rem', margin: 0 }}>Local SQLite Event Journal</h3>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0369a1' }}>
                  {queuedEvents.length} Pending Events
                </span>
              </div>

              {queuedEvents.length === 0 ? (
                <div style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>
                  ✓ All events have been synchronized to Central DB.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
                  {queuedEvents.map((ev) => (
                    <div
                      key={ev.id}
                      style={{
                        padding: '0.5rem',
                        borderRadius: '6px',
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        fontSize: '0.75rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                        <span style={{ color: '#0369a1' }}>{ev.eventType}</span>
                        <span style={{ color: '#ea580c' }}>SEQ #{ev.logicalSequence}</span>
                      </div>
                      <div style={{ color: '#64748b', fontSize: '0.65rem', marginTop: '0.2rem' }}>
                        Hash: {ev.hash.slice(0, 24)}… | Time: {ev.occurredAt.split('T')[1].slice(0, 8)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ========================================================
          MODAL: OFFLINE LESSON READER
      ======================================================== */}
      {activeLesson && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            zIndex: 100,
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              maxWidth: '480px',
              width: '100%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '0.95rem', margin: 0, color: '#0f172a' }}>{activeLesson.title}</h3>
              <button
                onClick={() => setActiveLesson(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '1rem', overflowY: 'auto', flex: 1, fontSize: '0.85rem', lineHeight: '1.5', color: '#334155' }}>
              <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                {activeLesson.fullContentMarkdown}
              </div>

              <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#e0f2fe', borderRadius: '6px' }}>
                <strong style={{ color: '#0369a1', fontSize: '0.8rem' }}>Key Takeaways:</strong>
                <ul style={{ margin: '0.3rem 0 0 1rem', padding: 0, fontSize: '0.75rem', color: '#0369a1' }}>
                  {activeLesson.keyTakeaways.map((point, i) => (
                    <li key={i}>{point}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => handleCompleteLesson(activeLesson.id)}
                style={{
                  flex: 1,
                  backgroundColor: '#16a34a',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.55rem',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                ✓ Complete Lesson & Record Progress
              </button>
              <button
                onClick={() => setActiveLesson(null)}
                style={{
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                  border: 'none',
                  padding: '0.55rem 0.85rem',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: INTERACTIVE ASSESSMENT PLAYER
      ======================================================== */}
      {isAssessmentOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            zIndex: 100,
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              maxWidth: '480px',
              width: '100%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#16a34a', fontWeight: 700 }}>OFFLINE EXAM RUNNER</span>
                <h3 style={{ fontSize: '0.95rem', margin: '0.1rem 0 0 0', color: '#0f172a' }}>{assessment.title}</h3>
              </div>
              <button
                onClick={() => setIsAssessmentOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '1rem', overflowY: 'auto', flex: 1 }}>
              {quizResult ? (
                <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                  <div
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '30px',
                      backgroundColor: quizResult.passed ? '#dcfce7' : '#fee2e2',
                      color: quizResult.passed ? '#15803d' : '#b91c1c',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.75rem',
                      margin: '0 auto 0.75rem auto',
                    }}
                  >
                    {quizResult.passed ? '✓' : '✗'}
                  </div>
                  <h3 style={{ fontSize: '1.1rem', margin: '0 0 0.25rem 0' }}>
                    {quizResult.passed ? 'Assessment Passed!' : 'Retake Required'}
                  </h3>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: quizResult.passed ? '#15803d' : '#b91c1c' }}>
                    {quizResult.score}%
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.25rem 0 1rem 0' }}>
                    Answered {quizResult.correctCount} of {quizResult.total} correctly (Passing mark: {assessment.passingScore}%)
                  </p>

                  <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '6px', fontSize: '0.75rem', color: '#475569', textAlign: 'left' }}>
                    ⚡ <strong>Offline Event Generated:</strong> Your submission has been securely written to the local SQLite event journal on this Sahakar Edge node with SHA-256 hash protection. It will be uploaded automatically once the WAN reconnects.
                  </div>
                </div>
              ) : (
                <form id="quiz-form" onSubmit={handleQuizSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {questions.map((q: Question, qIdx: number) => (
                    <div key={q.id} style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.4rem' }}>
                        Q{qIdx + 1}. {q.prompt}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        {q.options.map((opt: string, optIdx: number) => (
                          <label
                            key={optIdx}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              padding: '0.4rem 0.6rem',
                              borderRadius: '4px',
                              backgroundColor: quizAnswers[q.id] === optIdx ? '#e0f2fe' : '#f8fafc',
                              border: quizAnswers[q.id] === optIdx ? '1px solid #0284c7' : '1px solid #e2e8f0',
                              fontSize: '0.8rem',
                              cursor: 'pointer',
                            }}
                          >
                            <input
                              type="radio"
                              name={`question-${q.id}`}
                              checked={quizAnswers[q.id] === optIdx}
                              onChange={() => setQuizAnswers({ ...quizAnswers, [q.id]: optIdx })}
                            />
                            <span>{opt}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </form>
              )}
            </div>

            <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '0.5rem' }}>
              {quizResult ? (
                <button
                  onClick={() => setIsAssessmentOpen(false)}
                  style={{
                    flex: 1,
                    backgroundColor: '#0284c7',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.55rem',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Return to Learning
                </button>
              ) : (
                <>
                  <button
                    type="submit"
                    form="quiz-form"
                    style={{
                      flex: 1,
                      backgroundColor: '#16a34a',
                      color: '#ffffff',
                      border: 'none',
                      padding: '0.55rem',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Submit Exam to Edge Node
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAssessmentOpen(false)}
                    style={{
                      backgroundColor: '#f1f5f9',
                      color: '#475569',
                      border: 'none',
                      padding: '0.55rem 0.85rem',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          BOTTOM NAVIGATION BAR (All 6 Tabs per 07_UI_UX_SPEC.md)
      ======================================================== */}
      <nav
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          backgroundColor: '#ffffff',
          borderTop: '1px solid #e2e8f0',
          padding: '0.4rem 0',
          boxShadow: '0 -2px 5px rgba(0,0,0,0.03)',
        }}
      >
        {(
          [
            { id: 'HOME', label: 'Home' },
            { id: 'LEARN', label: 'Learn' },
            { id: 'PROGRESS', label: 'Progress' },
            { id: 'CREDENTIALS', label: 'Credentials' },
            { id: 'OPPORTUNITIES', label: 'Jobs' },
            { id: 'PROFILE', label: 'Profile' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: 'none',
              border: 'none',
              color: activeTab === tab.id ? '#0284c7' : '#64748b',
              fontWeight: activeTab === tab.id ? 800 : 500,
              fontSize: '0.65rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              cursor: 'pointer',
              padding: '0.2rem 0',
            }}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

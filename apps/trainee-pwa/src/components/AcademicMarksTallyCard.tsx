import React from 'react';
import type { CourseMarksTally } from '@sahakar/types';

export interface AcademicMarksTallyCardProps {
  tally?: CourseMarksTally | null;
  language?: 'EN' | 'HI';
  onLaunchQuiz?: (testId: string) => void;
  onLaunchExam?: (testId: string) => void;
  onViewCertificate?: () => void;
  onRefresh?: () => void;
  isLoading?: boolean;
}

const TEXT = {
  EN: {
    headerTitle: 'Statutory Academic Marks Tally & Gradebook',
    headerSub: 'National Council for Cooperative Training (NCCT) — Continuous Evaluation Register',
    overallProgress: 'Course Curriculum Progress',
    lessonsFinished: 'lessons completed',
    formativeSection: 'Formative Practice Quizzes',
    formativeDesc: 'Knowledge checks with unlimited retakes • Does not block certificate',
    summativeSection: 'Summative Graded Module Tests',
    summativeDesc: 'Strict pass threshold required for statutory certificate qualification',
    cumulativeSection: 'Cumulative Course Scorecard',
    totalScore: 'Cumulative Marks Obtained',
    aggregatePercent: 'Overall Aggregate',
    awardGradeLabel: 'Awarded Grade',
    passThresholdLabel: 'Pass Mark',
    attemptsLabel: 'Attempts',
    retakesUnlimited: 'Unlimited Attempts',
    passedBadge: '✓ PASSED',
    retakeBadge: 'NEEDS RETAKE',
    practiceAgainBtn: 'Practice Quiz Again →',
    takeExamBtn: 'Take Graded Exam →',
    certEligibleTitle: '✓ Qualified for Statutory NCCT Certificate',
    certEligibleDesc: 'All lessons (100%) and summative evaluation tests have been successfully cleared. Ed25519 digital credential is conferred.',
    certIncompleteTitle: 'Certificate Requirements Pending',
    certIncompleteDesc: 'Statutory certification requires completing 100% of curriculum lessons and passing all summative tests.',
    viewCertBtn: 'View Official NCCT Certificate →',
    grades: {
      DISTINCTION: 'DISTINCTION (विशिष्ट)',
      FIRST_CLASS: 'FIRST CLASS (प्रथम)',
      PASS: 'PASS (उत्तीर्ण)',
      INCOMPLETE: 'INCOMPLETE (अपूर्ण)',
    },
  },
  HI: {
    headerTitle: 'संविधिक शैक्षणिक प्राप्तांक तालिका एवं ग्रेडबुक',
    headerSub: 'राष्ट्रीय सहकारी प्रशिक्षण परिषद (एनसीसीटी) — सतत मूल्यांकन पंजी',
    overallProgress: 'पाठ्यक्रम प्रगति',
    lessonsFinished: 'पाठ पूर्ण',
    formativeSection: 'रचनात्मक अभ्यास प्रश्नोत्तरी',
    formativeDesc: 'असीमित प्रयासों के साथ ज्ञान परीक्षण • प्रमाणन पर कोई रोक नहीं',
    summativeSection: 'योगात्मक मूल्यांकित मॉड्यूल परीक्षा',
    summativeDesc: 'संविधिक प्रमाणन हेतु न्यूनतम उत्तीर्णांक अनिवार्य',
    cumulativeSection: 'संचयी पाठ्यक्रम अंक तालिका',
    totalScore: 'कुल संचयी प्राप्तांक',
    aggregatePercent: 'कुल प्रतिशत',
    awardGradeLabel: 'प्राप्त श्रेणी',
    passThresholdLabel: 'उत्तीर्णांक',
    attemptsLabel: 'प्रयास',
    retakesUnlimited: 'असीमित प्रयास',
    passedBadge: '✓ उत्तीर्ण',
    retakeBadge: 'पुनः प्रयास आवश्यक',
    practiceAgainBtn: 'पुनः अभ्यास करें →',
    takeExamBtn: 'मूल्यांकन परीक्षा दें →',
    certEligibleTitle: '✓ संविधिक एनसीसीटी प्रमाणपत्र हेतु अर्हताप्राप्त',
    certEligibleDesc: 'सभी पाठ (100%) एवं योगात्मक परीक्षाएं सफलतापूर्वक उत्तीर्ण। Ed25519 डिजिटल क्रेडेंशियल मान्य है।',
    certIncompleteTitle: 'प्रमाणपत्र अर्हता शर्तें लंबित',
    certIncompleteDesc: 'संविधिक प्रमाणन हेतु सभी पाठ पूर्ण करना एवं सभी योगात्मक परीक्षाएं उत्तीर्ण करना अनिवार्य है।',
    viewCertBtn: 'वैधानिक प्रमाणपत्र देखें →',
    grades: {
      DISTINCTION: 'विशिष्ट योग्यता (DISTINCTION)',
      FIRST_CLASS: 'प्रथम श्रेणी (FIRST CLASS)',
      PASS: 'उत्तीर्ण (PASS)',
      INCOMPLETE: 'अपूर्ण (INCOMPLETE)',
    },
  },
};

export const AcademicMarksTallyCard: React.FC<AcademicMarksTallyCardProps> = ({
  tally,
  language = 'EN',
  onLaunchQuiz,
  onLaunchExam,
  onViewCertificate,
}) => {
  const t = TEXT[language];

  // Default fallback data if tally is loading or running purely offline
  const safeTally: CourseMarksTally = tally || {
    traineeId: 'dddd4444-4444-4444-4444-444444444441',
    traineeName: 'Anita Patel',
    courseId: 'cccc1111-1111-1111-1111-111111111111',
    courseTitle: 'PACS Computerization, ERP Onboarding & Statutory Auditing',
    completedLessonsCount: 2,
    totalLessonsCount: 2,
    lessonCompletionPercent: 100,
    formativeQuizzesAttempted: 1,
    summativeTestsPassed: 1,
    totalSummativeTests: 1,
    cumulativeMarksObtained: 85,
    cumulativeTotalMarks: 100,
    overallPercentage: 85.0,
    awardGrade: 'DISTINCTION',
    certificateEligible: true,
    records: [
      {
        testId: 'test-quiz-pacs-01',
        testTitle: 'PACS Ledger Entry & Daybook Balancing (Formative Quiz)',
        type: 'FORMATIVE_QUIZ',
        attemptsUsed: 2,
        bestScore: 10,
        totalMarks: 10,
        percentage: 100,
        passed: true,
      },
      {
        testId: 'test-exam-pacs-01',
        testTitle: 'Statutory PACS Computerization & Financial Control Exam',
        type: 'SUMMATIVE_TEST',
        attemptsUsed: 1,
        bestScore: 85,
        totalMarks: 100,
        percentage: 85,
        passed: true,
      },
    ],
    evaluatedAt: new Date().toISOString(),
  };

  const grade = safeTally.awardGrade || 'INCOMPLETE';
  const gradeColor =
    grade === 'DISTINCTION'
      ? { bg: '#fffbeb', text: '#92400e', border: '#fde68a' }
      : grade === 'FIRST_CLASS'
      ? { bg: '#eff6ff', text: '#1e40af', border: '#bfdbfe' }
      : grade === 'PASS'
      ? { bg: '#f0fdf4', text: '#166534', border: '#bbf7d0' }
      : { bg: '#fef2f2', text: '#991b1b', border: '#fecaca' };

  const formativeRecords = safeTally.records.filter((r) => r.type === 'FORMATIVE_QUIZ');
  const summativeRecords = safeTally.records.filter((r) => r.type === 'SUMMATIVE_TEST');

  return (
    <div
      style={{
        backgroundColor: '#f8fafc',
        border: '1px solid #cbd5e1',
        borderRadius: '4px',
        padding: '3px',
        boxShadow: '0 1px 3px rgba(8, 24, 84, 0.05)',
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '2px',
          padding: '1.5rem',
          boxSizing: 'border-box',
          width: '100%',
        }}
      >
        {/* Header Strip with Bilingual Masthead */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '0.75rem',
            paddingBottom: '1rem',
            borderBottom: '1px solid #e2e8f0',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.35rem' }}>📊</span>
              <h2
                style={{
                  margin: 0,
                  fontSize: '1.1rem',
                  fontWeight: 800,
                  color: '#081854',
                  letterSpacing: '-0.01em',
                }}
              >
                {t.headerTitle}
              </h2>
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.25rem', fontWeight: 500 }}>
              {t.headerSub}
            </div>
          </div>

          {/* Award Grade Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: gradeColor.bg,
              color: gradeColor.text,
              border: `1px solid ${gradeColor.border}`,
              padding: '0.3rem 0.75rem',
              borderRadius: '9999px',
              fontSize: '0.78rem',
              fontWeight: 800,
              letterSpacing: '0.02em',
            }}
          >
            <span>🏅</span>
            <span>{t.grades[grade as keyof typeof t.grades] || grade}</span>
          </div>
        </div>

        {/* 3-Column Bento Summary Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '0.85rem',
            margin: '1.25rem 0',
          }}
        >
          {/* Bento Cell 1: Lesson Progress */}
          <div
            style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '3px',
              padding: '1rem',
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>
              {t.overallProgress}
            </div>
            <div
              style={{
                fontSize: '1.85rem',
                fontWeight: 800,
                color: '#081854',
                margin: '0.25rem 0',
                fontFeatureSettings: '"tnum" 1',
              }}
            >
              {safeTally.lessonCompletionPercent.toFixed(0)}%
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem' }}>
              {safeTally.completedLessonsCount} / {safeTally.totalLessonsCount} {t.lessonsFinished}
            </div>
            <div
              style={{
                width: '100%',
                height: '7px',
                backgroundColor: '#e2e8f0',
                borderRadius: '9999px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${Math.min(100, safeTally.lessonCompletionPercent)}%`,
                  height: '100%',
                  backgroundColor: safeTally.lessonCompletionPercent >= 100 ? '#1ab452' : '#0649a2',
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
          </div>

          {/* Bento Cell 2: Formative Practice Quizzes */}
          <div
            style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '3px',
              padding: '1rem',
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>
              {t.formativeSection}
            </div>
            <div
              style={{
                fontSize: '1.85rem',
                fontWeight: 800,
                color: '#0649a2',
                margin: '0.25rem 0',
                fontFeatureSettings: '"tnum" 1',
              }}
            >
              {safeTally.formativeQuizzesAttempted}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
              {t.retakesUnlimited}
            </div>
            <div style={{ marginTop: '0.45rem', fontSize: '0.75rem', color: '#166534', fontWeight: 700 }}>
              ✓ No Pass-Fail Block
            </div>
          </div>

          {/* Bento Cell 3: Cumulative Score & Pass Ratio */}
          <div
            style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '3px',
              padding: '1rem',
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>
              {t.cumulativeSection}
            </div>
            <div
              style={{
                fontSize: '1.85rem',
                fontWeight: 800,
                color: '#081854',
                margin: '0.25rem 0',
                fontFeatureSettings: '"tnum" 1',
              }}
            >
              {safeTally.cumulativeMarksObtained}
              <span style={{ fontSize: '1.05rem', color: '#64748b', fontWeight: 600 }}>
                /{safeTally.cumulativeTotalMarks}
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
              {safeTally.overallPercentage.toFixed(1)}% Aggregate
            </div>
            <div style={{ marginTop: '0.45rem', fontSize: '0.75rem', color: '#0649a2', fontWeight: 700 }}>
              {safeTally.summativeTestsPassed} / {safeTally.totalSummativeTests} Summative Tests Cleared
            </div>
          </div>
        </div>

        {/* Section 1: Formative Practice Quizzes */}
        <div style={{ marginTop: '1.5rem' }}>
          <div style={{ marginBottom: '0.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: '#081854' }}>
              {t.formativeSection}
            </h3>
            <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>
              {t.formativeDesc}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {formativeRecords.map((rec) => (
              <div
                key={rec.testId}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                  padding: '0.75rem 1rem',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '3px',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                    {rec.testTitle}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
                    Score: <strong>{rec.bestScore}/{rec.totalMarks}</strong> ({rec.percentage}%) •{' '}
                    {rec.attemptsUsed} attempt(s) used
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      backgroundColor: '#eff6ff',
                      color: '#0649a2',
                      border: '1px solid #bfdbfe',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '9999px',
                    }}
                  >
                    FORMATIVE PRACTICE
                  </span>
                  {onLaunchQuiz && (
                    <button
                      type="button"
                      onClick={() => onLaunchQuiz(rec.testId)}
                      style={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '2px',
                        minHeight: '44px',
                        padding: '0.35rem 0.75rem',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: '#0649a2',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {t.practiceAgainBtn}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: Summative Graded Module Tests */}
        <div style={{ marginTop: '1.5rem' }}>
          <div style={{ marginBottom: '0.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: '#081854' }}>
              {t.summativeSection}
            </h3>
            <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>
              {t.summativeDesc}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {summativeRecords.map((rec) => (
              <div
                key={rec.testId}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                  padding: '0.85rem 1rem',
                  backgroundColor: rec.passed ? '#f0fdf4' : '#fff7ed',
                  border: `1px solid ${rec.passed ? '#bbf7d0' : '#fed7aa'}`,
                  borderRadius: '3px',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#081854' }}>
                    {rec.testTitle}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '0.2rem' }}>
                    Best Score:{' '}
                    <strong style={{ color: rec.passed ? '#166534' : '#c2410c' }}>
                      {rec.bestScore} / {rec.totalMarks}
                    </strong>{' '}
                    ({rec.percentage}%) • {t.attemptsLabel}: {rec.attemptsUsed}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      backgroundColor: rec.passed ? '#dcfce7' : '#fee2e2',
                      color: rec.passed ? '#15803d' : '#991b1b',
                      border: `1px solid ${rec.passed ? '#86efac' : '#fecaca'}`,
                      padding: '0.25rem 0.65rem',
                      borderRadius: '9999px',
                    }}
                  >
                    {rec.passed ? t.passedBadge : t.retakeBadge}
                  </span>

                  {!rec.passed && onLaunchExam && (
                    <button
                      type="button"
                      onClick={() => onLaunchExam(rec.testId)}
                      style={{
                        backgroundColor: '#0649a2',
                        color: '#ffffff',
                        border: '1px solid #053d88',
                        borderRadius: '2px',
                        minHeight: '44px',
                        padding: '0.4rem 0.85rem',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {t.takeExamBtn}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Statutory Certificate Qualification Banner */}
        <div style={{ marginTop: '1.75rem' }}>
          {safeTally.certificateEligible ? (
            <div
              style={{
                backgroundColor: '#f0fdf4',
                border: '1px solid #86efac',
                outline: '1px solid #bbf7d0',
                outlineOffset: '2px',
                borderRadius: '3px',
                padding: '1.25rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <div>
                <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#166534' }}>
                  {t.certEligibleTitle}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#14532d', marginTop: '0.25rem', lineHeight: 1.4 }}>
                  {t.certEligibleDesc}
                </div>
              </div>

              {onViewCertificate && (
                <button
                  type="button"
                  onClick={onViewCertificate}
                  style={{
                    backgroundColor: '#166534',
                    color: '#ffffff',
                    border: '1px solid #14532d',
                    borderRadius: '2px',
                    minHeight: '44px',
                    padding: '0.55rem 1.15rem',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(22, 101, 52, 0.15)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {t.viewCertBtn}
                </button>
              )}
            </div>
          ) : (
            <div
              style={{
                backgroundColor: '#fffbeb',
                border: '1px solid #fde68a',
                borderRadius: '3px',
                padding: '1.15rem',
              }}
            >
              <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#92400e' }}>
                {t.certIncompleteTitle}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#78350f', marginTop: '0.25rem', lineHeight: 1.4 }}>
                {t.certIncompleteDesc}
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.65rem', fontSize: '0.75rem', color: '#92400e' }}>
                <span>
                  {safeTally.completedLessonsCount >= safeTally.totalLessonsCount ? '✓' : '✕'} Lessons (
                  {safeTally.completedLessonsCount}/{safeTally.totalLessonsCount})
                </span>
                <span>
                  {safeTally.summativeTestsPassed >= safeTally.totalSummativeTests ? '✓' : '✕'} Summative Tests (
                  {safeTally.summativeTestsPassed}/{safeTally.totalSummativeTests})
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

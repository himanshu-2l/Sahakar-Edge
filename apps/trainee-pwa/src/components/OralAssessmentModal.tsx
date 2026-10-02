import React, { useState, useEffect, useRef } from 'react';
import {
  SEED_ORAL_ASSESSMENT,
  SEED_ORAL_QUESTIONS,
} from '@sahakar/test-fixtures';
import type {
  OralQuestion,
  OralAssessmentResult,
  OralQuestionScore,
} from '@sahakar/types';
import {
  offlineStore,
  evaluateOralQuestion,
} from '../services/offline-store';
import { speechService } from '../services/speech-service';

export interface OralAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  traineeId: string;
  onSubmitted?: (result: OralAssessmentResult) => void;
  initialLanguage?: 'HI' | 'EN';
}

export const OralAssessmentModal: React.FC<OralAssessmentModalProps> = ({
  isOpen,
  onClose,
  traineeId,
  onSubmitted,
  initialLanguage = 'EN',
}) => {
  const [language, setLanguage] = useState<'HI' | 'EN'>(initialLanguage);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [transcripts, setTranscripts] = useState<Record<string, string>>({});
  const [isListening, setIsListening] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<OralAssessmentResult | null>(null);
  const stopListeningRef = useRef<(() => void) | null>(null);

  const questions: OralQuestion[] = SEED_ORAL_QUESTIONS;
  const currentQuestion = questions[currentIdx];
  const currentTranscript = transcripts[currentQuestion?.id] || '';

  // Real-time keyword scoring on the current question
  const currentEvaluation: OralQuestionScore = currentQuestion
    ? evaluateOralQuestion(currentQuestion, currentTranscript, language)
    : {
        questionId: '',
        prompt: '',
        transcript: '',
        matchedKeywords: [],
        missingKeywords: [],
        score: 0,
      };

  // Clean up any active speech when modal unmounts or closes
  useEffect(() => {
    return () => {
      speechService.stop();
      if (stopListeningRef.current) {
        stopListeningRef.current();
        stopListeningRef.current = null;
      }
    };
  }, []);

  if (!isOpen) return null;

  // Speak current question aloud
  const handleSpeakQuestion = () => {
    if (isPlayingAudio) {
      speechService.stop();
      setIsPlayingAudio(false);
    } else {
      const textToSpeak = language === 'HI' ? currentQuestion.promptHi : currentQuestion.prompt;
      speechService.speak(textToSpeak, language, (playing) => {
        setIsPlayingAudio(playing);
      });
    }
  };

  // Toggle voice recognition
  const handleToggleVoiceInput = () => {
    if (isListening) {
      if (stopListeningRef.current) {
        stopListeningRef.current();
        stopListeningRef.current = null;
      }
      setIsListening(false);
    } else {
      if (!speechService.isVoiceInputSupported()) {
        alert(
          language === 'HI'
            ? 'इस ब्राउज़र में ध्वनि पहचान (Speech Recognition) समर्थित नहीं है। कृपया नीचे बॉक्स में टाइप करें।'
            : 'Speech recognition is not supported in this browser. Please type in the text box below.'
        );
        return;
      }

      speechService.stop();
      setIsPlayingAudio(false);

      const cancelFn = speechService.startListening(
        language,
        (recognizedText) => {
          setTranscripts((prev) => {
            const existing = prev[currentQuestion.id] || '';
            const merged = existing ? `${existing} ${recognizedText}` : recognizedText;
            return { ...prev, [currentQuestion.id]: merged.trim() };
          });
        },
        (listening) => {
          setIsListening(listening);
        }
      );
      stopListeningRef.current = cancelFn;
    }
  };

  // Trainee manually updates text response
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setTranscripts((prev) => ({
      ...prev,
      [currentQuestion.id]: val,
    }));
  };

  // Quick insert of ideal model keywords for test verification or demo
  const handleInsertSampleAnswer = () => {
    let sample = '';
    if (currentQuestion.id === 'oral-q-01-daybook-balancing') {
      sample =
        language === 'HI'
          ? 'पैक्स में कार्यदिवस के अंत में रोजनामचा और रोकड़बही का मिलान तिजोरी में रखी भौतिक नकदी से किया जाता है। कुल प्राप्तियां और प्रारम्भिक शेष का योग भुगतानों और अंतिम तिजोरी शेष के बराबर होना चाहिए।'
          : 'In a PACS, the Daybook and Cashbook closing balance must be reconciled every evening against physical vault cash. Opening balance plus cash receipts must equal disbursements plus physical cash.';
    } else if (currentQuestion.id === 'oral-q-02-crop-loan-disbursement') {
      sample =
        language === 'HI'
          ? 'फसल ऋण वितरण पर दोहरी प्रविष्टि में अल्पकालिक फसल ऋण परिसंपत्ति खाता नामे (Debit) किया जाता है और रोकड़ खाता या बैंक खाता जमा (Credit) किया जाता है।'
          : 'When disbursing a Short-Term Crop Loan, Debit the Short-Term Crop Loan Asset Account and Credit Cash in Hand or the PACS Bank Account.';
    } else if (currentQuestion.id === 'oral-q-03-statutory-reserve-fund') {
      sample =
        language === 'HI'
          ? 'सहकारी नियमों के अंतर्गत शुद्ध लाभ का न्यूनतम 25% अनिवार्य रूप से सांविधिक आरक्षित निधि में स्थानांतरित किया जाता है। यह एक अविभाज्य सुरक्षा बफर है जो अप्रत्याशित डूबंत ऋणों से रक्षा करता है और लाभांश में नहीं बांटा जा सकता।'
          : 'Under cooperative regulations, a mandatory 25% of net profit must be transferred to the Statutory Reserve Fund as a permanent buffer against bad debts and unforeseen losses, and cannot be distributed as dividends.';
    }
    setTranscripts((prev) => ({
      ...prev,
      [currentQuestion.id]: sample,
    }));
  };

  const handleNext = () => {
    speechService.stop();
    setIsPlayingAudio(false);
    if (stopListeningRef.current) {
      stopListeningRef.current();
      stopListeningRef.current = null;
      setIsListening(false);
    }
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    speechService.stop();
    setIsPlayingAudio(false);
    if (stopListeningRef.current) {
      stopListeningRef.current();
      stopListeningRef.current = null;
      setIsListening(false);
    }
    if (currentIdx > 0) {
      setCurrentIdx((prev) => prev - 1);
    }
  };

  const handleSubmit = () => {
    speechService.stop();
    setIsPlayingAudio(false);
    if (stopListeningRef.current) {
      stopListeningRef.current();
      stopListeningRef.current = null;
      setIsListening(false);
    }

    setIsSubmitting(true);
    try {
      const responses = questions.map((q) => ({
        questionId: q.id,
        transcript: transcripts[q.id] || '',
      }));

      const { result: evalResult } = offlineStore.submitOralAssessment({
        assessmentId: SEED_ORAL_ASSESSMENT.id,
        traineeId,
        language,
        responses,
      });

      setResult(evalResult);
      if (onSubmitted) {
        onSubmitted(evalResult);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetake = () => {
    setTranscripts({});
    setCurrentIdx(0);
    setResult(null);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        zIndex: 130,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          maxWidth: '740px',
          width: '100%',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.45)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid #cbd5e1',
          maxHeight: '94vh',
        }}
      >
        {/* National Tricolor Top Ribbon */}
        <div style={{ display: 'flex', height: '4px', width: '100%' }}>
          <div style={{ flex: 1, backgroundColor: '#ea580c' }} />
          <div style={{ flex: 1, backgroundColor: '#ffffff' }} />
          <div style={{ flex: 1, backgroundColor: '#16a34a' }} />
        </div>

        {/* Header Bar */}
        <div
          style={{
            padding: '1rem 1.25rem',
            backgroundColor: '#0f172a',
            color: '#ffffff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #1e293b',
            gap: '0.75rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.4rem' }}>🎙️</span>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, letterSpacing: '0.02em', color: '#ffffff' }}>
                {language === 'HI' ? 'मौखिक परीक्षा (Oral Viva Assessment)' : 'Oral Viva Assessment Player'}
              </div>
              <div style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>
                NCCT Cooperative Accounting • Voice & Keyword Scoring
              </div>
            </div>
          </div>

          {/* Controls: Language toggle & Padded >=44px Close button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                display: 'flex',
                backgroundColor: '#1e293b',
                borderRadius: '8px',
                padding: '3px',
                border: '1px solid #334155',
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setLanguage('EN');
                  speechService.stop();
                  setIsPlayingAudio(false);
                }}
                style={{
                  minHeight: '44px',
                  minWidth: '48px',
                  padding: '0.45rem 0.85rem',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  backgroundColor: language === 'EN' ? '#0369a1' : 'transparent',
                  color: language === 'EN' ? '#ffffff' : '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => {
                  setLanguage('HI');
                  speechService.stop();
                  setIsPlayingAudio(false);
                }}
                style={{
                  minHeight: '44px',
                  minWidth: '48px',
                  padding: '0.45rem 0.85rem',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  backgroundColor: language === 'HI' ? '#0369a1' : 'transparent',
                  color: language === 'HI' ? '#ffffff' : '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                हिंदी
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              style={{
                width: '44px',
                height: '44px',
                minWidth: '44px',
                minHeight: '44px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                border: 'none',
                color: '#ffffff',
                fontSize: '1.25rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.15s ease',
              }}
              title="Close modal"
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Body */}
        {result ? (
          /* ========================================================
             RESULT SCREEN
             ======================================================== */
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', overflowY: 'auto' }}>
            <div
              style={{
                textAlign: 'center',
                padding: '1.5rem',
                backgroundColor: result.passed ? '#f0fdf4' : '#fef2f2',
                borderRadius: '12px',
                border: `2px solid ${result.passed ? '#16a34a' : '#dc2626'}`,
              }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '0.35rem' }}>
                {result.passed ? '🎉' : '⚠️'}
              </div>
              <h2
                style={{
                  margin: '0 0 0.35rem 0',
                  fontSize: '1.4rem',
                  fontWeight: 900,
                  color: result.passed ? '#15803d' : '#b91c1c',
                }}
              >
                {result.passed
                  ? language === 'HI'
                    ? 'मौखिक परीक्षा उत्तीर्ण (Viva Passed)'
                    : 'Oral Viva Assessment Passed!'
                  : language === 'HI'
                  ? 'अंक अपर्याप्त — पुनः प्रयास करें (Assessment Incomplete)'
                  : 'Passing Score Not Met — Retake Recommended'}
              </h2>
              <div style={{ fontSize: '1.05rem', color: '#1e293b', fontWeight: 700 }}>
                {language === 'HI' ? 'अंतिम प्राप्तांक:' : 'Final Viva Score:'}{' '}
                <span style={{ fontSize: '1.45rem', color: result.passed ? '#15803d' : '#dc2626', fontWeight: 900 }}>
                  {result.percentage}%
                </span>{' '}
                <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
                  ({result.totalScore} / {result.maxScore} pts • Threshold: 70%)
                </span>
              </div>
              <div
                style={{
                  marginTop: '0.85rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  backgroundColor: '#ffffff',
                  padding: '0.45rem 0.95rem',
                  borderRadius: '24px',
                  fontSize: '0.8125rem',
                  color: '#334155',
                  border: '1px solid #cbd5e1',
                }}
              >
                <span>📦</span>
                <span>
                  <strong>Sync Event Queued:</strong> <code>ORAL_ASSESSMENT_SUBMITTED</code> (RFC 8785 SHA-256)
                </span>
              </div>
            </div>

            {/* Question Breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ fontSize: '0.925rem', fontWeight: 800, color: '#0f172a' }}>
                {language === 'HI' ? 'प्रश्नानुसार मूल्यांकन विवरण:' : 'Question Evaluation Breakdown:'}
              </div>

              {result.questions.map((q, idx) => (
                <div
                  key={q.questionId}
                  style={{
                    backgroundColor: '#f8fafc',
                    borderRadius: '10px',
                    padding: '1rem 1.15rem',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ fontSize: '0.925rem', fontWeight: 700, color: '#0f172a' }}>
                      Q{idx + 1}: {q.prompt}
                    </div>
                    <span
                      style={{
                        padding: '0.25rem 0.65rem',
                        borderRadius: '6px',
                        fontSize: '0.8125rem',
                        fontWeight: 800,
                        backgroundColor: q.score >= 70 ? '#dcfce7' : '#fee2e2',
                        color: q.score >= 70 ? '#15803d' : '#991b1b',
                        flexShrink: 0,
                      }}
                    >
                      {q.score}%
                    </span>
                  </div>

                  <div style={{ fontSize: '0.8125rem', color: '#475569', marginTop: '0.45rem', lineHeight: 1.5 }}>
                    <strong>Transcript:</strong> {q.transcript || <em>(No response recorded)</em>}
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
                    {q.matchedKeywords.map((kw) => (
                      <span
                        key={kw}
                        style={{
                          fontSize: '0.8125rem',
                          backgroundColor: '#dcfce7',
                          color: '#15803d',
                          border: '1px solid #86efac',
                          borderRadius: '6px',
                          padding: '0.2rem 0.5rem',
                          fontWeight: 700,
                        }}
                      >
                        ✓ {kw}
                      </span>
                    ))}
                    {q.missingKeywords.slice(0, 3).map((kw) => (
                      <span
                        key={kw}
                        style={{
                          fontSize: '0.8125rem',
                          backgroundColor: '#f1f5f9',
                          color: '#64748b',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          padding: '0.2rem 0.5rem',
                        }}
                      >
                        ○ {kw}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Result Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.85rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleRetake}
                style={{
                  minHeight: '46px',
                  padding: '0.65rem 1.25rem',
                  borderRadius: '8px',
                  fontSize: '0.925rem',
                  fontWeight: 700,
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  color: '#334155',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                }}
              >
                <span>🔄</span>
                <span>{language === 'HI' ? 'पुनः परीक्षा दें' : 'Retake Viva'}</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                style={{
                  minHeight: '46px',
                  padding: '0.65rem 1.45rem',
                  borderRadius: '8px',
                  fontSize: '0.925rem',
                  fontWeight: 800,
                  backgroundColor: '#0f172a',
                  border: 'none',
                  color: '#ffffff',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                }}
              >
                <span>✓</span>
                <span>{language === 'HI' ? 'सफलतापूर्वक पूर्ण (बंद करें)' : 'Finish & Close'}</span>
              </button>
            </div>
          </div>
        ) : (
          /* ========================================================
             QUESTION ACTIVE SCREEN
             ======================================================== */
          <div style={{ padding: '1.35rem', display: 'flex', flexDirection: 'column', gap: '1.15rem', overflowY: 'auto' }}>
            {/* Step Progress Bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              {questions.map((q, idx) => (
                <div
                  key={q.id}
                  style={{
                    flex: 1,
                    height: '8px',
                    borderRadius: '4px',
                    backgroundColor:
                      idx < currentIdx
                        ? '#15803d'
                        : idx === currentIdx
                        ? '#0369a1'
                        : '#e2e8f0',
                    transition: 'background-color 0.25s ease',
                  }}
                />
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {language === 'HI' ? `प्रश्न ${currentIdx + 1} / ${questions.length}` : `Question ${currentIdx + 1} of ${questions.length}`}
              </span>
              <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                Topic: <strong style={{ color: '#0f172a' }}>{currentQuestion.topic}</strong>
              </span>
            </div>

            {/* Question Card */}
            <div
              style={{
                backgroundColor: '#f8fafc',
                borderRadius: '12px',
                padding: '1.25rem',
                border: '1px solid #e2e8f0',
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  color: '#0f172a',
                  lineHeight: 1.6,
                }}
              >
                {language === 'HI' ? currentQuestion.promptHi : currentQuestion.prompt}
              </p>

              {/* TTS Read Aloud Button */}
              <div style={{ marginTop: '1rem', display: 'flex', gap: '0.65rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleSpeakQuestion}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    minHeight: '44px',
                    padding: '0.6rem 1.15rem',
                    backgroundColor: isPlayingAudio ? '#dc2626' : '#0369a1',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                  }}
                >
                  <span style={{ fontSize: '1.1rem' }}>{isPlayingAudio ? '⏹️' : '🔊'}</span>
                  <span>
                    {isPlayingAudio
                      ? language === 'HI'
                        ? 'आवाज़ बंद करें'
                        : 'Stop Reading'
                      : language === 'HI'
                      ? 'प्रश्न बोलकर सुनें'
                      : 'Listen Question Aloud'}
                  </span>
                </button>

                {isPlayingAudio && (
                  <span style={{ fontSize: '0.8125rem', color: '#0369a1', fontWeight: 700 }}>
                    Speaking ({language === 'HI' ? 'hi-IN' : 'en-IN'})...
                  </span>
                )}
              </div>
            </div>

            {/* Trainee Response Section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 800, color: '#1e293b' }}>
                  {language === 'HI' ? 'आपका मौखिक उत्तर (Your Answer):' : 'Your Oral Viva Response:'}
                </label>
                <button
                  type="button"
                  onClick={handleInsertSampleAnswer}
                  style={{
                    minHeight: '44px',
                    backgroundColor: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    color: '#0369a1',
                    padding: '0.45rem 0.85rem',
                    borderRadius: '8px',
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <span>⚡</span>
                  <span>{language === 'HI' ? 'नमूना उत्तर भरें (Auto-Fill)' : 'Fill Model Answer'}</span>
                </button>
              </div>

              {/* Voice Input Button & Text Area */}
              <div>
                <textarea
                  value={currentTranscript}
                  onChange={handleTextChange}
                  placeholder={
                    language === 'HI'
                      ? 'माइक दबाकर बोलें या यहाँ अपना उत्तर टाइप करें...'
                      : 'Click microphone to speak or type your answer here...'
                  }
                  rows={4}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '0.85rem',
                    borderRadius: '8px',
                    border: isListening ? '2px solid #dc2626' : '1px solid #cbd5e1',
                    fontSize: '0.9375rem',
                    lineHeight: 1.55,
                    color: '#0f172a',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    outline: 'none',
                    backgroundColor: '#ffffff',
                  }}
                />

                <div
                  style={{
                    marginTop: '0.65rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.65rem',
                  }}
                >
                  <button
                    type="button"
                    onClick={handleToggleVoiceInput}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      minHeight: '46px',
                      padding: '0.65rem 1.25rem',
                      backgroundColor: isListening ? '#dc2626' : '#15803d',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                    }}
                  >
                    <span style={{ fontSize: '1.1rem' }}>{isListening ? '🔴' : '🎙️'}</span>
                    <span>
                      {isListening
                        ? language === 'HI'
                          ? 'रिकॉर्डिंग रोकें'
                          : 'Stop Recording'
                        : language === 'HI'
                        ? 'बोलकर उत्तर दें'
                        : 'Start Voice Input'}
                    </span>
                  </button>

                  {isListening && (
                    <span style={{ fontSize: '0.8125rem', color: '#dc2626', fontWeight: 700 }}>
                      Listening in {language === 'HI' ? 'Hindi (hi-IN)' : 'English (en-IN)'}...
                    </span>
                  )}

                  {currentTranscript && (
                    <button
                      type="button"
                      onClick={() => setTranscripts((prev) => ({ ...prev, [currentQuestion.id]: '' }))}
                      style={{
                        minHeight: '44px',
                        backgroundColor: '#f1f5f9',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        color: '#64748b',
                        fontSize: '0.8125rem',
                        fontWeight: 700,
                        padding: '0.45rem 0.85rem',
                        cursor: 'pointer',
                      }}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Real-time Keyword Scoring Feedback */}
            <div
              style={{
                backgroundColor: '#f8fafc',
                borderRadius: '10px',
                padding: '1rem',
                border: '1px solid #e2e8f0',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.65rem',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                }}
              >
                <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#1e293b' }}>
                  {language === 'HI' ? 'पहचाने गए मुख्य सहकारी शब्द (Scored Keywords):' : 'Cooperative Accounting Keywords:'}
                </div>
                <div
                  style={{
                    fontSize: '0.8125rem',
                    fontWeight: 800,
                    color: currentEvaluation.score >= 70 ? '#15803d' : '#475569',
                    backgroundColor: currentEvaluation.score >= 70 ? '#dcfce7' : '#f1f5f9',
                    padding: '0.2rem 0.55rem',
                    borderRadius: '6px',
                  }}
                >
                  Score: {currentEvaluation.score}% (Pass &ge; 70%)
                </div>
              </div>

              {/* Matched vs Missing Keyword Badges */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                {currentEvaluation.matchedKeywords.length === 0 && (
                  <span style={{ fontSize: '0.8125rem', color: '#94a3b8', fontStyle: 'italic' }}>
                    {language === 'HI'
                      ? 'उत्तर में आवश्यक शब्दावली का प्रयोग करें (उदा. रोजनामचा, तिजोरी, रोकड़बही...)'
                      : 'Speak or type key accounting terms to gain score...'}
                  </span>
                )}

                {currentEvaluation.matchedKeywords.map((kw) => (
                  <span
                    key={kw}
                    style={{
                      fontSize: '0.8125rem',
                      fontWeight: 800,
                      backgroundColor: '#dcfce7',
                      color: '#15803d',
                      border: '1px solid #86efac',
                      borderRadius: '6px',
                      padding: '0.3rem 0.6rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                    }}
                  >
                    <span>✓</span>
                    <span>{kw}</span>
                  </span>
                ))}

                {currentEvaluation.missingKeywords.slice(0, 4).map((kw) => (
                  <span
                    key={kw}
                    style={{
                      fontSize: '0.8125rem',
                      backgroundColor: '#ffffff',
                      color: '#64748b',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      padding: '0.3rem 0.6rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                    }}
                  >
                    <span>○</span>
                    <span>{kw}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Navigation / Submission Footer */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '0.5rem',
                borderTop: '1px solid #e2e8f0',
                paddingTop: '1rem',
                flexWrap: 'wrap',
                gap: '0.65rem',
              }}
            >
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentIdx === 0}
                style={{
                  minHeight: '46px',
                  padding: '0.65rem 1.25rem',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  color: currentIdx === 0 ? '#cbd5e1' : '#334155',
                  cursor: currentIdx === 0 ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <span>←</span>
                <span>{language === 'HI' ? 'पिछला प्रश्न' : 'Previous'}</span>
              </button>

              <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
                {currentIdx < questions.length - 1 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    style={{
                      minHeight: '46px',
                      padding: '0.65rem 1.35rem',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      fontWeight: 800,
                      backgroundColor: '#0369a1',
                      border: 'none',
                      color: '#ffffff',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    <span>{language === 'HI' ? 'अगला प्रश्न' : 'Next Question'}</span>
                    <span>→</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    style={{
                      minHeight: '46px',
                      padding: '0.65rem 1.5rem',
                      borderRadius: '8px',
                      fontSize: '0.925rem',
                      fontWeight: 800,
                      backgroundColor: '#15803d',
                      border: 'none',
                      color: '#ffffff',
                      cursor: isSubmitting ? 'wait' : 'pointer',
                      boxShadow: '0 2px 4px rgba(21, 128, 61, 0.25)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                    }}
                  >
                    <span>✓</span>
                    <span>
                      {isSubmitting
                        ? language === 'HI'
                          ? 'जमा हो रहा है...'
                          : 'Submitting...'
                        : language === 'HI'
                        ? 'मौखिक परीक्षा जमा करें'
                        : 'Submit Oral Viva'}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

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
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
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
          borderRadius: '14px',
          maxWidth: '720px',
          width: '100%',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid #cbd5e1',
        }}
      >
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
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.25rem' }}>🎙️</span>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, letterSpacing: '0.02em' }}>
                {language === 'HI' ? 'मौखिक परीक्षा (Oral Viva Assessment)' : 'Oral Viva Assessment Player'}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                NCCT Cooperative Accounting • Voice & Keyword Scoring
              </div>
            </div>
          </div>

          {/* Controls: Language toggle & Close */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                display: 'flex',
                backgroundColor: '#1e293b',
                borderRadius: '6px',
                padding: '2px',
                border: '1px solid #334155',
              }}
            >
              <button
                onClick={() => {
                  setLanguage('EN');
                  speechService.stop();
                  setIsPlayingAudio(false);
                }}
                style={{
                  padding: '0.25rem 0.55rem',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  backgroundColor: language === 'EN' ? '#0284c7' : 'transparent',
                  color: language === 'EN' ? '#ffffff' : '#94a3b8',
                }}
              >
                EN
              </button>
              <button
                onClick={() => {
                  setLanguage('HI');
                  speechService.stop();
                  setIsPlayingAudio(false);
                }}
                style={{
                  padding: '0.25rem 0.55rem',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  backgroundColor: language === 'HI' ? '#0284c7' : 'transparent',
                  color: language === 'HI' ? '#ffffff' : '#94a3b8',
                }}
              >
                हिंदी
              </button>
            </div>

            <button
              onClick={onClose}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: '#94a3b8',
                fontSize: '1.25rem',
                cursor: 'pointer',
                lineHeight: 1,
                padding: '0.2rem 0.4rem',
              }}
              title="Close modal"
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
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div
              style={{
                textAlign: 'center',
                padding: '1.5rem',
                backgroundColor: result.passed ? '#f0fdf4' : '#fef2f2',
                borderRadius: '10px',
                border: `2px solid ${result.passed ? '#22c55e' : '#ef4444'}`,
              }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '0.25rem' }}>
                {result.passed ? '🎉' : '⚠️'}
              </div>
              <h2
                style={{
                  margin: '0 0 0.25rem 0',
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
              <div style={{ fontSize: '1rem', color: '#334155', fontWeight: 700 }}>
                {language === 'HI' ? 'अंतिम प्राप्तांक:' : 'Final Viva Score:'}{' '}
                <span style={{ fontSize: '1.35rem', color: result.passed ? '#16a34a' : '#dc2626' }}>
                  {result.percentage}%
                </span>{' '}
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  ({result.totalScore} / {result.maxScore} pts • Threshold: 70%)
                </span>
              </div>
              <div
                style={{
                  marginTop: '0.75rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  backgroundColor: '#ffffff',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  color: '#475569',
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>
                {language === 'HI' ? 'प्रश्नानुसार मूल्यांकन विवरण:' : 'Question Evaluation Breakdown:'}
              </div>

              {result.questions.map((q, idx) => (
                <div
                  key={q.questionId}
                  style={{
                    backgroundColor: '#f8fafc',
                    borderRadius: '8px',
                    padding: '0.85rem 1rem',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>
                      Q{idx + 1}: {q.prompt}
                    </div>
                    <span
                      style={{
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        backgroundColor: q.score >= 70 ? '#dcfce7' : '#fee2e2',
                        color: q.score >= 70 ? '#15803d' : '#991b1b',
                      }}
                    >
                      {q.score}%
                    </span>
                  </div>

                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.35rem' }}>
                    <strong>Transcript:</strong> {q.transcript || <em>(No response recorded)</em>}
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.4rem' }}>
                    {q.matchedKeywords.map((kw) => (
                      <span
                        key={kw}
                        style={{
                          fontSize: '0.65rem',
                          backgroundColor: '#dcfce7',
                          color: '#166534',
                          border: '1px solid #86efac',
                          borderRadius: '4px',
                          padding: '0.1rem 0.35rem',
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
                          fontSize: '0.65rem',
                          backgroundColor: '#f1f5f9',
                          color: '#64748b',
                          border: '1px solid #cbd5e1',
                          borderRadius: '4px',
                          padding: '0.1rem 0.35rem',
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
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                onClick={handleRetake}
                style={{
                  padding: '0.6rem 1.1rem',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  color: '#334155',
                  cursor: 'pointer',
                }}
              >
                🔄 {language === 'HI' ? 'पुनः परीक्षा दें' : 'Retake Viva'}
              </button>
              <button
                onClick={onClose}
                style={{
                  padding: '0.6rem 1.25rem',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  backgroundColor: '#0f172a',
                  border: 'none',
                  color: '#ffffff',
                  cursor: 'pointer',
                }}
              >
                ✓ {language === 'HI' ? 'सफलतापूर्वक पूर्ण (बंद करें)' : 'Finish & Close'}
              </button>
            </div>
          </div>
        ) : (
          /* ========================================================
             QUESTION ACTIVE SCREEN
             ======================================================== */
          <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Step Progress Bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {questions.map((q, idx) => (
                <div
                  key={q.id}
                  style={{
                    flex: 1,
                    height: '6px',
                    borderRadius: '3px',
                    backgroundColor:
                      idx < currentIdx
                        ? '#16a34a'
                        : idx === currentIdx
                        ? '#0284c7'
                        : '#e2e8f0',
                  }}
                />
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase' }}>
                {language === 'HI' ? `प्रश्न ${currentIdx + 1} / ${questions.length}` : `Question ${currentIdx + 1} of ${questions.length}`}
              </span>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Topic: <strong>{currentQuestion.topic}</strong>
              </span>
            </div>

            {/* Question Card */}
            <div
              style={{
                backgroundColor: '#f8fafc',
                borderRadius: '10px',
                padding: '1.1rem',
                border: '1px solid #e2e8f0',
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: '#0f172a',
                  lineHeight: 1.5,
                }}
              >
                {language === 'HI' ? currentQuestion.promptHi : currentQuestion.prompt}
              </p>

              {/* TTS Read Aloud Button */}
              <div style={{ marginTop: '0.85rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button
                  onClick={handleSpeakQuestion}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.45rem 0.85rem',
                    backgroundColor: isPlayingAudio ? '#ef4444' : '#0284c7',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <span>{isPlayingAudio ? '⏹️' : '🔊'}</span>
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
                  <span style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: 600 }}>
                    Speaking ({language === 'HI' ? 'hi-IN' : 'en-IN'})...
                  </span>
                )}
              </div>
            </div>

            {/* Trainee Response Section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#334155' }}>
                  {language === 'HI' ? 'आपका मौखिक उत्तर (Your Answer):' : 'Your Oral Viva Response:'}
                </label>
                <button
                  type="button"
                  onClick={handleInsertSampleAnswer}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#0284c7',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  {language === 'HI' ? '⚡ नमूना उत्तर भरें (Auto-Fill)' : '⚡ Fill Model Answer'}
                </button>
              </div>

              {/* Voice Input Button & Text Area */}
              <div style={{ position: 'relative' }}>
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
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: isListening ? '2px solid #ef4444' : '1px solid #cbd5e1',
                    fontSize: '0.9rem',
                    color: '#0f172a',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    outline: 'none',
                  }}
                />

                <div
                  style={{
                    marginTop: '0.4rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <button
                    onClick={handleToggleVoiceInput}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.5rem 0.95rem',
                      backgroundColor: isListening ? '#ef4444' : '#16a34a',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: isListening ? '0 0 10px rgba(239, 68, 68, 0.5)' : 'none',
                    }}
                  >
                    <span>{isListening ? '🔴' : '🎙️'}</span>
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
                    <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 700 }}>
                      Listening in {language === 'HI' ? 'Hindi (hi-IN)' : 'English (en-IN)'}...
                    </span>
                  )}

                  {currentTranscript && (
                    <button
                      onClick={() => setTranscripts((prev) => ({ ...prev, [currentQuestion.id]: '' }))}
                      style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: '#94a3b8',
                        fontSize: '0.75rem',
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
                backgroundColor: '#f1f5f9',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                border: '1px solid #e2e8f0',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.4rem',
                }}
              >
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#334155' }}>
                  {language === 'HI' ? 'पहचाने गए मुख्य सहकारी शब्द (Scored Keywords):' : 'Cooperative Accounting Keywords:'}
                </div>
                <div
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    color: currentEvaluation.score >= 70 ? '#15803d' : '#475569',
                  }}
                >
                  Score: {currentEvaluation.score}% (Pass &gt;= 70%)
                </div>
              </div>

              {/* Matched vs Missing Keyword Badges */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {currentEvaluation.matchedKeywords.length === 0 && (
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontStyle: 'italic' }}>
                    {language === 'HI'
                      ? 'उत्तर में आवश्यक शब्दावली का प्रयोग करें (उदा. रोजनामचा, तिजोरी, रोकड़बही...)'
                      : 'Speak or type key accounting terms to gain score...'}
                  </span>
                )}

                {currentEvaluation.matchedKeywords.map((kw) => (
                  <span
                    key={kw}
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      backgroundColor: '#dcfce7',
                      color: '#15803d',
                      border: '1px solid #86efac',
                      borderRadius: '4px',
                      padding: '0.15rem 0.45rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.2rem',
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
                      fontSize: '0.7rem',
                      backgroundColor: '#ffffff',
                      color: '#64748b',
                      border: '1px solid #cbd5e1',
                      borderRadius: '4px',
                      padding: '0.15rem 0.45rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.2rem',
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
                borderTop: '1px solid #f1f5f9',
                paddingTop: '0.75rem',
              }}
            >
              <button
                onClick={handlePrev}
                disabled={currentIdx === 0}
                style={{
                  padding: '0.55rem 1rem',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  color: currentIdx === 0 ? '#cbd5e1' : '#334155',
                  cursor: currentIdx === 0 ? 'not-allowed' : 'pointer',
                }}
              >
                ← {language === 'HI' ? 'पिछला प्रश्न' : 'Previous'}
              </button>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {currentIdx < questions.length - 1 ? (
                  <button
                    onClick={handleNext}
                    style={{
                      padding: '0.55rem 1.15rem',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      backgroundColor: '#0284c7',
                      border: 'none',
                      color: '#ffffff',
                      cursor: 'pointer',
                    }}
                  >
                    {language === 'HI' ? 'अगला प्रश्न →' : 'Next Question →'}
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    style={{
                      padding: '0.55rem 1.35rem',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      fontWeight: 800,
                      backgroundColor: '#16a34a',
                      border: 'none',
                      color: '#ffffff',
                      cursor: isSubmitting ? 'wait' : 'pointer',
                      boxShadow: '0 2px 4px rgba(22, 163, 74, 0.3)',
                    }}
                  >
                    {isSubmitting
                      ? language === 'HI'
                        ? 'जमा हो रहा है...'
                        : 'Submitting...'
                      : language === 'HI'
                      ? '✓ मौखिक परीक्षा जमा करें'
                      : '✓ Submit Oral Viva'}
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

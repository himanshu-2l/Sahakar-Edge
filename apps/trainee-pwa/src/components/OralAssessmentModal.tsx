import React, { useState, useEffect, useRef } from 'react';
import {
  SEED_ORAL_ASSESSMENT,
  SEED_ORAL_QUESTIONS,
} from '@sahakar/test-fixtures';
import type {
  OralQuestion,
  OralAssessmentResult,
  OralQuestionScore,
  RubricDimensionType,
  RubricDimensionScore,
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
  onOpenLesson?: (lessonId: string) => void;
  onOpenPacsLab?: () => void;
}

export const NCCT_RUBRIC_CONFIG = {
  TECHNICAL_ACCURACY: {
    weight: 0.40,
    labelEn: 'Technical & Statutory Accuracy',
    labelHi: 'तकनीकी एवं सांविधिक सटीकता',
    descriptionEn: 'Statutory compliance (25% reserve fund), NABARD balancing formula, asset classification',
    descriptionHi: 'सांविधिक अनुपालन (25% आरक्षित निधि), नाबार्ड मिलान सूत्र, परिसंपत्ति वर्गीकरण',
    concepts: [
      {
        id: 'c-statutory-reserve-25',
        termsEn: ['25%', 'statutory reserve fund', 'net profit', 'mandatory', 'unforeseen losses'],
        termsHi: ['25%', '25 प्रतिशत', 'सांविधिक आरक्षित निधि', 'शुद्ध लाभ', 'अनिवार्य', 'अप्रत्याशित'],
        feedbackEn: 'Accurate understanding of mandatory 25% net profit transfer to Statutory Reserve Fund.',
        feedbackHi: 'सांविधिक आरक्षित निधि में 25% शुद्ध लाभ के अनिवार्य अंतरण की सटीक समझ।',
      },
      {
        id: 'c-vault-balancing-formula',
        termsEn: ['vault cash', 'reconciliation', 'closing balance', 'physical cash', 'opening balance'],
        termsHi: ['तिजोरी', 'भौतिक नकदी', 'रोकड़ मिलान', 'अंतिम शेष', 'प्रारम्भिक शेष'],
        feedbackEn: 'Correct application of daily cashbook to vault physical cash reconciliation formula.',
        feedbackHi: 'दैनिक रोकड़बही एवं तिजोरी भौतिक नकदी मिलान सूत्र का सही प्रयोग।',
      },
      {
        id: 'c-loan-asset-classification',
        termsEn: ['crop loan', 'loan asset', 'asset account', 'kcc', 'short-term'],
        termsHi: ['फसल ऋण', 'ऋण परिसंपत्ति', 'केसीसी', 'अल्पकालिक ऋण'],
        feedbackEn: 'Precise classification of crop loans under Short-Term Loan Assets.',
        feedbackHi: 'फसल ऋण को अल्पकालिक ऋण परिसंपत्ति के रूप में सटीक वर्गीकरण।',
      },
    ],
  },
  PROCEDURAL_LOGIC: {
    weight: 0.30,
    labelEn: 'Procedural Logic & Double-Entry Sequence',
    labelHi: 'प्रक्रियात्मक तर्क एवं दोहरी प्रविष्टि क्रम',
    descriptionEn: 'Correct debit/credit account sequencing, opposing balance verification, voucher verification',
    descriptionHi: 'नामे/जमा खातों का सही क्रम, दोहरी प्रविष्टि मिलान, वाउचर सत्यापन',
    concepts: [
      {
        id: 'c-debit-credit-direction',
        termsEn: ['debit loan', 'credit cash', 'credit bank', 'debit', 'credit'],
        termsHi: ['नामे', 'जमा', 'डेबिट', 'क्रेडिट', 'खाता नामे', 'खाता जमा'],
        feedbackEn: 'Correct double-entry direction: Debit Loan Asset, Credit Cash/Bank upon disbursement.',
        feedbackHi: 'सही दोहरी प्रविष्टि दिशा: वितरण पर ऋण खाता नामे (Debit) एवं रोकड़/बैंक जमा (Credit)।',
      },
      {
        id: 'c-balancing-tally-logic',
        termsEn: ['receipts', 'disbursements', 'total receipts', 'tally', 'equal'],
        termsHi: ['प्राप्तियां', 'संवितरण', 'कुल प्राप्तियां', 'बराबर', 'योग'],
        feedbackEn: 'Flawless verification that Receipts + Opening Cash equals Disbursements + Closing Cash.',
        feedbackHi: 'प्राप्तियां + प्रारम्भिक रोकड़ = संवितरण + अंतिम तिजोरी रोकड़ का सही सत्यापन।',
      },
      {
        id: 'c-reserve-allocation-order',
        termsEn: ['before dividend', 'transfer', 'appropriation', 'permanent'],
        termsHi: ['लाभांश से पूर्व', 'अंतरण', 'स्थानांतरित', 'स्थायी'],
        feedbackEn: 'Sound logic: Reserve allocation strictly precedes any dividend distribution.',
        feedbackHi: 'तार्किक क्रम: लाभांश वितरण से पूर्व अनिवार्य आरक्षित निधि अंतरण।',
      },
    ],
  },
  COOPERATIVE_TERMINOLOGY: {
    weight: 0.20,
    labelEn: 'Cooperative Vernacular & Terminology',
    labelHi: 'सहकारी शब्दावली एवं प्रादेशिक अभिव्यक्ति',
    descriptionEn: 'Authentic grassroots cooperative nomenclature (Rojnamcha, Rokadbahi, Tijori, KCC)',
    descriptionHi: 'सहकारी लेखा शब्दावली (रोजनामचा, रोकड़बही, तिजोरी, केसीसी, लाभांश)',
    concepts: [
      {
        id: 'c-vernacular-books',
        termsEn: ['rojnamcha', 'rokadbahi', 'tijori', 'daybook', 'cashbook'],
        termsHi: ['रोजनामचा', 'रोकड़बही', 'तिजोरी'],
        feedbackEn: 'Exemplary usage of vernacular ledger names (Rojnamcha & Rokadbahi).',
        feedbackHi: 'सहकारी बहियों (रोजनामचा, रोकड़बही, तिजोरी) की प्रामाणिक शब्दावली का प्रयोग।',
      },
      {
        id: 'c-coop-credit-terms',
        termsEn: ['pacs', 'kcc', 'kisan credit card', 'member loan account'],
        termsHi: ['पैक्स', 'केसीसी', 'किसान क्रेडिट कार्ड', 'सदस्य ऋण खाता'],
        feedbackEn: 'Accurate reference to PACS credit instruments (KCC, member ledgers).',
        feedbackHi: 'पैक्स साख शब्दावली (केसीसी, सदस्य ऋण खाता) का उपयुक्त उपयोग।',
      },
      {
        id: 'c-statutory-terms',
        termsEn: ['indivisible', 'dividend', 'statutory reserve', 'buffer'],
        termsHi: ['अविभाज्य', 'लाभांश', 'सांविधिक निधि', 'सुरक्षा कोष'],
        feedbackEn: 'Mastery of cooperative governance terms: indivisible reserve, dividend prohibition.',
        feedbackHi: 'सहकारी शासन शब्दावली: अविभाज्य निधि, लाभांश पर रोक का प्रभावी प्रयोग।',
      },
    ],
  },
  INTERNAL_CONTROLS: {
    weight: 0.10,
    labelEn: 'Internal Controls & Anti-Fraud Awareness',
    labelHi: 'आंतरिक नियंत्रण एवं धोखाधड़ी रोधी जागरूकता',
    descriptionEn: 'Dual-custody verification, anti-decapitalization rules, physical vault counting',
    descriptionHi: 'दोहरी अभिरक्षा, पूँजी ह्रास रोकथाम, भौतिक रोकड़ सत्यापन',
    concepts: [
      {
        id: 'c-physical-cash-audit',
        termsEn: ['physical cash', 'vault cash', 'physical currency', 'counted in the vault'],
        termsHi: ['भौतिक नकदी', 'तिजोरी नकदी', 'भौतिक मुद्रा', 'तिजोरी में रखी'],
        feedbackEn: 'Strong awareness of physical vault counting as an anti-embezzlement safeguard.',
        feedbackHi: 'गबन रोकथाम हेतु भौतिक तिजोरी रोकड़ गणना की मजबूत समझ।',
      },
      {
        id: 'c-bad-debt-insulation',
        termsEn: ['bad debts', 'unforeseen losses', 'buffer', 'cannot be distributed'],
        termsHi: ['डूबंत ऋण', 'अप्रत्याशित हानि', 'बफर', 'बांटा नहीं जा सकता'],
        feedbackEn: 'Clear understanding that reserves protect member capital from default shocks.',
        feedbackHi: 'स्पष्ट समझ कि आरक्षित निधि समिति की शेयर पूँजी को डूबंत ऋणों से सुरक्षित रखती है।',
      },
    ],
  },
};

export function calculateNCCTRubricBreakdown(
  transcripts: Record<string, string>,
  language: 'HI' | 'EN'
): {
  rubricBreakdown: RubricDimensionScore[];
  compositeScore: number;
  passed: boolean;
  proficiencyBand: 'EXEMPLARY' | 'PROFICIENT' | 'DEVELOPING' | 'NEEDS_REMEDIATION';
  pedagogicalRecommendations: Array<{
    moduleId: string;
    lessonId?: string;
    isLab?: boolean;
    titleEn: string;
    titleHi: string;
    reasonEn: string;
    reasonHi: string;
    actionLabelEn: string;
    actionLabelHi: string;
  }>;
} {
  const combinedText = Object.values(transcripts).join(' ').toLowerCase();

  const dimensions: RubricDimensionType[] = [
    'TECHNICAL_ACCURACY',
    'PROCEDURAL_LOGIC',
    'COOPERATIVE_TERMINOLOGY',
    'INTERNAL_CONTROLS',
  ];

  const rubricBreakdown: RubricDimensionScore[] = dimensions.map((dim) => {
    const config = NCCT_RUBRIC_CONFIG[dim];
    const matchedConcepts: string[] = [];
    const missingConcepts: string[] = [];

    config.concepts.forEach((concept) => {
      const searchTerms = language === 'HI' ? concept.termsHi : concept.termsEn;
      const fallbackTerms = language === 'HI' ? concept.termsEn : concept.termsHi;
      const allTerms = [...searchTerms, ...fallbackTerms];

      const found = allTerms.some((term) => combinedText.includes(term.toLowerCase().trim()));
      const label = language === 'HI' ? concept.termsHi[0] : concept.termsEn[0];

      if (found) {
        matchedConcepts.push(label);
      } else {
        missingConcepts.push(label);
      }
    });

    const ratio = matchedConcepts.length / Math.max(1, config.concepts.length);
    let score = Math.round(ratio * 100);
    if (matchedConcepts.length === config.concepts.length) {
      score = 100;
    } else if (matchedConcepts.length >= 2) {
      score = Math.max(75, Math.round(ratio * 100));
    } else if (matchedConcepts.length === 1) {
      score = 50;
    } else {
      score = 0;
    }

    const weightedScore = Number((score * config.weight).toFixed(1));
    const label = language === 'HI' ? config.labelHi : config.labelEn;
    const feedback =
      score >= 70
        ? language === 'HI'
          ? `उत्कृष्ट: ${matchedConcepts.join(', ')} के प्रयोग द्वारा इस आयाम में सांविधिक मानक पूर्ण।`
          : `Competent: Demonstrated mastery in ${matchedConcepts.join(', ')}.`
        : language === 'HI'
        ? `पुनरावलोकन आवश्यक: ${missingConcepts.join(', ')} शब्दावली एवं नियमों का अध्ययन करें।`
        : `Remediation needed: Review key principles regarding ${missingConcepts.join(', ')}.`;

    return {
      dimension: dim,
      dimensionLabel: label,
      weight: config.weight,
      score,
      weightedScore,
      matchedConcepts,
      missingConcepts,
      feedback,
    };
  });

  const compositeScore = Math.round(
    rubricBreakdown.reduce((sum, item) => sum + item.weightedScore, 0)
  );
  const passed = compositeScore >= 70;

  let proficiencyBand: 'EXEMPLARY' | 'PROFICIENT' | 'DEVELOPING' | 'NEEDS_REMEDIATION' = 'NEEDS_REMEDIATION';
  if (compositeScore >= 85) proficiencyBand = 'EXEMPLARY';
  else if (compositeScore >= 70) proficiencyBand = 'PROFICIENT';
  else if (compositeScore >= 50) proficiencyBand = 'DEVELOPING';

  const pedagogicalRecommendations: Array<{
    moduleId: string;
    lessonId?: string;
    isLab?: boolean;
    titleEn: string;
    titleHi: string;
    reasonEn: string;
    reasonHi: string;
    actionLabelEn: string;
    actionLabelHi: string;
  }> = [];

  const techDim = rubricBreakdown.find((r) => r.dimension === 'TECHNICAL_ACCURACY');
  const procDim = rubricBreakdown.find((r) => r.dimension === 'PROCEDURAL_LOGIC');
  const ctrlDim = rubricBreakdown.find((r) => r.dimension === 'INTERNAL_CONTROLS');

  if (!techDim || techDim.score < 70) {
    pedagogicalRecommendations.push({
      moduleId: '88888888-8888-8888-8888-888888888888',
      lessonId: '99999999-9999-9999-9999-999999999991',
      titleEn: 'Lesson 1.1: Cooperative Principles & Statutory Reserve Fund',
      titleHi: 'पाठ 1.1: सहकारी सिद्धांत एवं सांविधिक आरक्षित निधि',
      reasonEn: 'Deepen statutory knowledge on mandatory 25% net profit transfer and Section 67 reserve fund indivisibility.',
      reasonHi: 'शुद्ध लाभ के 25% सांविधिक आरक्षित निधि अंतरण एवं अविभाज्य पूंजी सुरक्षा नियमों का अध्ययन करें।',
      actionLabelEn: 'Study Lesson 1.1 →',
      actionLabelHi: 'पाठ 1.1 पढ़ें →',
    });
  }

  if (!procDim || procDim.score < 70) {
    pedagogicalRecommendations.push({
      moduleId: '88888888-8888-8888-8888-888888888888',
      lessonId: '99999999-9999-9999-9999-999999999992',
      titleEn: 'Lesson 1.2: Daybook, Cashbook & Double-Entry Ledger Posting',
      titleHi: 'पाठ 1.2: रोजनामचा, रोकड़बही एवं दोहरी प्रविष्टि खाता बही',
      reasonEn: 'Master crop loan asset debiting, vault cash crediting, and daily closing tally procedures.',
      reasonHi: 'फसल ऋण संवितरण नामे/जमा प्रविष्टि एवं दैनिक रोकड़ मिलान प्रक्रिया का पुनः अभ्यास करें।',
      actionLabelEn: 'Study Lesson 1.2 →',
      actionLabelHi: 'पाठ 1.2 पढ़ें →',
    });
  }

  if (!ctrlDim || ctrlDim.score < 70 || compositeScore < 70) {
    pedagogicalRecommendations.push({
      moduleId: 'pacs-operations-lab',
      isLab: true,
      titleEn: 'Interactive PACS Operations Lab: Day-End Balancing Simulator',
      titleHi: 'इंटरैक्टिव पैक्स ऑपरेशन्स लैब: दैनिक रोकड़ मिलान सिमुलेटर',
      reasonEn: 'Practice hands-on physical vault counting with ₹45,000 opening cash and 5 live transaction postings.',
      reasonHi: 'प्रारम्भिक तिजोरी शेष ₹45,000 के साथ 5 व्यवहारों की प्रविष्टि कर वास्तविक रोकड़ मिलान का अभ्यास करें।',
      actionLabelEn: 'Launch PACS Lab Simulator →',
      actionLabelHi: 'पैक्स सिमुलेटर खोलें →',
    });
  }

  return {
    rubricBreakdown,
    compositeScore,
    passed,
    proficiencyBand,
    pedagogicalRecommendations,
  };
}

export const OralAssessmentModal: React.FC<OralAssessmentModalProps> = ({
  isOpen,
  onClose,
  traineeId,
  onSubmitted,
  initialLanguage = 'EN',
  onOpenLesson,
  onOpenPacsLab,
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

  // Derive rubric breakdown when results are available
  const rubricDetails = result ? calculateNCCTRubricBreakdown(transcripts, language) : null;

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
          maxWidth: '760px',
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
                {language === 'HI' ? 'मौखिक परीक्षा (NCCT Oral Viva Rubric Player)' : 'NCCT Oral Viva Rubric Player'}
              </div>
              <div style={{ fontSize: '0.8125rem', color: '#94a3b8', lineHeight: 1.55 }}>
                {language === 'HI'
                  ? 'एनसीटीसीटी 4-आयाम सांविधिक मौखिक मूल्यांकन एवं उपचारात्मक मार्गदर्शन'
                  : '4-Dimension NCCT Statutory Viva Rubric & Remediation'}
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
        {result && rubricDetails ? (
          /* ========================================================
             RESULT SCREEN: 4-DIMENSION NCCT RUBRIC SCORECARD
             ======================================================== */
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', overflowY: 'auto' }}>
            {/* Statutory Competency Header & Badge */}
            <div
              style={{
                textAlign: 'center',
                padding: '1.5rem',
                backgroundColor: rubricDetails.passed ? '#f0fdf4' : '#fef2f2',
                borderRadius: '12px',
                border: `2px solid ${rubricDetails.passed ? '#16a34a' : '#dc2626'}`,
              }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '0.35rem' }}>
                {rubricDetails.passed ? '🛡️' : '⚠️'}
              </div>

              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.35rem 0.85rem',
                  borderRadius: '20px',
                  fontWeight: 900,
                  fontSize: '0.8125rem',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  backgroundColor: rubricDetails.passed ? '#dcfce7' : '#fee2e2',
                  color: rubricDetails.passed ? '#15803d' : '#b91c1c',
                  border: `1px solid ${rubricDetails.passed ? '#86efac' : '#fca5a5'}`,
                  marginBottom: '0.75rem',
                }}
              >
                <span>{rubricDetails.passed ? '✓' : '!'}</span>
                <span>
                  {rubricDetails.passed
                    ? language === 'HI'
                      ? 'सांविधिक योग्यता प्रमाणित (STATUTORY COMPETENCY CERTIFIED)'
                      : 'STATUTORY COMPETENCY CERTIFIED'
                    : language === 'HI'
                    ? 'पुनः परीक्षा आवश्यक (RETAKE REQUIRED • THRESHOLD: 70%)'
                    : 'RETAKE REQUIRED (THRESHOLD: 70%)'}
                </span>
              </div>

              <h2
                style={{
                  margin: '0 0 0.35rem 0',
                  fontSize: '1.35rem',
                  fontWeight: 900,
                  color: rubricDetails.passed ? '#15803d' : '#b91c1c',
                }}
              >
                {rubricDetails.passed
                  ? language === 'HI'
                    ? 'मौखिक परीक्षा 4-आयाम मूल्यांकन में उत्तीर्ण'
                    : 'Oral Viva 4-Dimension Rubric Passed!'
                  : language === 'HI'
                  ? 'अंक अपर्याप्त — उपचारात्मक अध्ययन आवश्यक'
                  : 'Competency Threshold Not Met — Remediation Recommended'}
              </h2>

              <div style={{ fontSize: '1rem', color: '#1e293b', fontWeight: 700 }}>
                {language === 'HI' ? 'संयुक्त प्राप्तांक (Composite Score):' : 'NCCT Composite Viva Score:'}{' '}
                <span
                  style={{
                    fontSize: '1.5rem',
                    color: rubricDetails.passed ? '#15803d' : '#dc2626',
                    fontWeight: 900,
                  }}
                >
                  {rubricDetails.compositeScore}%
                </span>{' '}
                <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                  (Band: <strong>{rubricDetails.proficiencyBand}</strong> • Min Pass: 70%)
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

            {/* 4-Dimension NCCT Rubric Progress Bars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem' }}>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                {language === 'HI'
                  ? 'एनसीटीसीटी 4-आयामी मूल्यांकन रिपोर्ट (4-Dimension Rubric Scorecard):'
                  : 'NCCT 4-Dimension Viva Rubric Scorecard:'}
              </div>

              {rubricDetails.rubricBreakdown.map((dim) => (
                <div
                  key={dim.dimension}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '10px',
                    padding: '1.15rem',
                    border: '1px solid #cbd5e1',
                    boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.925rem', fontWeight: 800, color: '#0f172a' }}>
                        {dim.dimensionLabel}
                      </span>
                      <span
                        style={{
                          fontSize: '0.8125rem',
                          fontWeight: 800,
                          backgroundColor: '#e0f2fe',
                          color: '#0369a1',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '12px',
                        }}
                      >
                        {(dim.weight * 100).toFixed(0)}% Weight
                      </span>
                    </div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 800, color: dim.score >= 70 ? '#15803d' : '#b91c1c' }}>
                      {dim.score}% ({dim.weightedScore.toFixed(1)} / {(dim.weight * 100).toFixed(0)} pts)
                    </div>
                  </div>

                  {/* Visual Progress Bar */}
                  <div
                    style={{
                      marginTop: '0.65rem',
                      height: '10px',
                      borderRadius: '5px',
                      backgroundColor: '#e2e8f0',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${dim.score}%`,
                        height: '100%',
                        backgroundColor: dim.score >= 70 ? '#16a34a' : dim.score >= 50 ? '#d97706' : '#dc2626',
                        borderRadius: '5px',
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>

                  {/* Concept Badges */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.65rem' }}>
                    {dim.matchedConcepts.map((c) => (
                      <span
                        key={c}
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
                        ✓ {c}
                      </span>
                    ))}
                    {dim.missingConcepts.map((c) => (
                      <span
                        key={c}
                        style={{
                          fontSize: '0.8125rem',
                          backgroundColor: '#f1f5f9',
                          color: '#64748b',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          padding: '0.2rem 0.5rem',
                        }}
                      >
                        ○ {c}
                      </span>
                    ))}
                  </div>

                  <div style={{ fontSize: '0.8125rem', color: '#475569', marginTop: '0.5rem', lineHeight: 1.55 }}>
                    {dim.feedback}
                  </div>
                </div>
              ))}
            </div>

            {/* Pedagogical Recommendations & Remediation Links */}
            {rubricDetails.pedagogicalRecommendations.length > 0 && (
              <div
                style={{
                  backgroundColor: '#eff6ff',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  border: '1px solid #bfdbfe',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '1.3rem' }}>📚</span>
                  <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#1e40af' }}>
                    {language === 'HI' ? 'शैक्षणिक अनुशंसाएं एवं उपचारात्मक अध्ययन' : 'Pedagogical Recommendations & Remediation Modules'}
                  </h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {rubricDetails.pedagogicalRecommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      style={{
                        backgroundColor: '#ffffff',
                        borderRadius: '8px',
                        padding: '0.85rem 1rem',
                        border: '1px solid #dbeafe',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '0.65rem',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: '220px' }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#0f172a' }}>
                          {language === 'HI' ? rec.titleHi : rec.titleEn}
                        </div>
                        <div style={{ fontSize: '0.8125rem', color: '#475569', marginTop: '0.2rem', lineHeight: 1.55 }}>
                          {language === 'HI' ? rec.reasonHi : rec.reasonEn}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          if (rec.isLab && onOpenPacsLab) {
                            onOpenPacsLab();
                          } else if (onOpenLesson && rec.lessonId) {
                            onOpenLesson(rec.lessonId);
                          }
                        }}
                        style={{
                          minHeight: '44px',
                          padding: '0.55rem 1rem',
                          borderRadius: '6px',
                          backgroundColor: '#0369a1',
                          color: '#ffffff',
                          border: 'none',
                          fontSize: '0.8125rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                        }}
                      >
                        <span>{language === 'HI' ? rec.actionLabelHi : rec.actionLabelEn}</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Question Evaluation Breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ fontSize: '0.925rem', fontWeight: 800, color: '#0f172a' }}>
                {language === 'HI' ? 'प्रश्नानुसार मूल्यांकन विवरण (Question Breakdown):' : 'Question-by-Question Keyword Audit:'}
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
                    <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a' }}>
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

                  <div style={{ fontSize: '0.8125rem', color: '#475569', marginTop: '0.45rem', lineHeight: 1.55 }}>
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
                          backgroundColor: '#ffffff',
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

            {/* Result Action Buttons (minHeight >= 46px) */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.85rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleRetake}
                style={{
                  minHeight: '46px',
                  padding: '0.65rem 1.25rem',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
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
                  fontSize: '0.875rem',
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
                    fontSize: '0.875rem',
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
                      fontSize: '0.875rem',
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

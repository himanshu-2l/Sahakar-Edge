import React, { useState, useEffect, useRef } from 'react';
import {
  SEED_PROGRAMME,
  SEED_COURSE,
  SEED_SESSION,
  SEED_USERS,
  SEED_JOB_OPPORTUNITY,
  SEED_JOB_OPPORTUNITIES,
  SEED_JOB_REQUIRED_SKILLS,
  SEED_ORAL_ASSESSMENT,
} from '@sahakar/test-fixtures';
import {
  offlineStore,
  LessonDetail,
  AssessmentAttempt,
} from './services/offline-store';
import { networkSync, ConnectivityState } from './services/network-sync';
import { speechService } from './services/speech-service';
import { OfficialCertificateModal } from './components/OfficialCertificateModal';
import { OralAssessmentModal } from './components/OralAssessmentModal';
import { PacsOperationsLabModal } from './components/PacsOperationsLabModal';
import { SchemeCalculatorModal } from './components/SchemeCalculatorModal';
import { GrievanceModal } from './components/GrievanceModal';
import { DynamicAttendanceModal } from './components/DynamicAttendanceModal';
import { AcademicMarksTallyCard } from './components/AcademicMarksTallyCard';
import { HostelRoomCard } from './components/HostelRoomCard';
import { SovereignNfcProfileCard } from './components/SovereignNfcProfileCard';
import {
  AshokChakraIcon,
  NcctEmblemIcon,
  HomeIcon,
  LearnIcon,
  ProgressIcon,
  CredentialsIcon,
  OpportunitiesIcon,
  ProfileIcon,
} from './components/icons';
import { THEME, doubleBezelCardOuter, doubleBezelCardInner, doubleBezelCard } from './theme';
import type {
  SyncEvent,
  Question,
  OralAssessmentResult,
  DigitalOfferLetter,
  CourseMarksTally,
  TraineePublicNfcProfile,
  SessionAttendanceRecord,
} from '@sahakar/types';

const TRANSLATIONS = {
  EN: {
    motto: 'NCCT Cooperative Training',
    subMotto: 'Ministry of Cooperation • Govt of India',
    greeting: 'Namaste',
    offlineBanner: 'Offline Mode — Local Edge Node Buffered',
    onlineBanner: 'All records synchronized centrally',
    flakyBanner: 'Intermittent WAN — Local buffering active',
    enrolledProgram: 'Enrolled Programme',
    cohort: 'Cohort',
    venue: 'Venue',
    venueDetail: 'RICM Bhopal Lab 1 (Attached PACS Hub)',
    todaysAttendance: "Today's Session Attendance",
    activeStatus: 'Active Session',
    sessionTimings: 'Session Timings: 09:30 AM – 12:30 PM (Mandatory: 60 mins)',
    qrCheckInBtn: 'Local QR Check-in',
    faceCheckInBtn: 'Face Biometric Check-in',
    checkedInBadge: '✓ Checked-in',
    syllabusProgress: 'Course Syllabus Progress',
    complete: 'Complete',
    lessonsFinished: 'lessons finished',
    openLessons: 'Open Lessons Overview →',
    certificationExam: 'Statutory Certification Exam',
    launchExam: 'Launch Offline Exam (3 Questions)',
    examDesc: 'Offline Examination • 3 Questions • Passing score: 75%',
    oralVivaTitle: 'Oral Viva Assessment (Voice AI)',
    launchOralViva: 'Launch Oral Viva Exam',
    oralVivaDesc: 'Voice Examination • 3 Cooperative Accounting Questions • Real-Time Keyword Scoring • 70% to Pass',
    oralVivaPassed: '✓ Oral Viva Passed',
    moduleTitle: 'Module 1: Daily Voucher Entry & Ledger Balancing',
    readLesson: 'Read Lesson Offline →',
    completedBadge: '✓ Completed',
    availableOffline: 'Available Offline',
    manifestReady: 'Local Content Manifest Ready',
    courseMeta: 'Language: Hindi / English • Version 1.0 • NCCT Approved',
    lessonFormat: 'Format',
    localAsset: 'Local Asset',
    overallProgress: 'Overall Competency Progress',
    completionStatus: 'Completion Status',
    completedModules: 'Completed Modules & Lessons',
    evalLog: 'Assessment Evaluation Log',
    noExamAttempts: 'No exam attempts recorded yet. Launch the offline exam to test your competency.',
    attempt: 'Attempt',
    questionsCorrect: 'questions correct',
    passedStatus: 'PASSED',
    retakeStatus: 'NEEDS RETAKE',
    doneBadge: '✓ Done',
    pendingBadge: 'Pending',
    statutoryCred: 'Statutory Digital Credential (Ed25519)',
    certifiedBy: 'Certified by National Council for Cooperative Training (NCCT)',
    verifyQr: 'Scan QR at any cooperative bank or society for instant Ed25519 public key verification.',
    awardedTo: 'Awarded to',
    credentialId: 'Credential ID',
    qrVerified: '🛡️ QR VERIFIED',
    issuer: 'Issuer',
    issuerValue: 'NCCT Apex Board',
    algorithm: 'Algorithm',
    algorithmValue: 'Ed25519 (Tamper-Proof)',
    viewCertificateBtn: 'View & Print Official NCCT Certificate',
    tabs: {
      HOME: 'Home',
      LEARN: 'Learn',
      PROGRESS: 'Progress',
      CREDENTIALS: 'Credentials',
      OPPORTUNITIES: 'Jobs',
      PROFILE: 'Profile',
    },
    qrScannerTitle: 'Scan Session Dynamic QR',
    qrScannerSub: 'Align the camera within the optical reticle on the venue screen or trainer terminal',
    simulateScanBtn: '⚡ Capture & Verify Optical QR',
    faceScannerTitle: 'Biometric Face Verification',
    faceScannerSub: 'Center your face within the optical guide. 3D anti-spoofing and liveness detection active.',
    simulateFaceBtn: '👤 Verify Face & Record Attendance',
    queueDrawerTitle: 'Offline Local Event Journal (SQLite WAL)',
    queueDrawerSub: 'Events recorded on this device and buffered for central synchronization',
    eventsBuffered: 'events buffered in SQLite WAL',
    allEventsSynced: '✓ All events synchronized with Central Cloud API!',
    journalUpToDate: '✓ Journal Up to Date',
    pushSyncNow: '⚡ Push Sync Now',
    counselorBtn: '🤖 Sahakar Mitra AI',
    counselorTitle: 'Sahakar Mitra (सहकार मित्र)',
    counselorSubtitle: 'AI Cooperative Career & Scheme Counselor',
    counselorCardTitle: 'Sahakar Mitra (सहकार मित्र) — AI Career Counselor',
    counselorCardSub: 'Get personalized career guidance on PACS recruitment (63,000 posts), Amul opportunities & NCDC youth schemes.',
    openCounselorBtn: 'Chat with Sahakar Mitra →',
    askCounselorPlaceholder: 'Ask about 63,000 PACS jobs, Amul, subsidies...',
    oppsHeader: 'Cooperative society job postings matched to your verified credentials:',
    matchBadge: '95% Match',
    locationLabel: 'Location',
    applyBtn: 'Apply Now',
    appSubmittedAlert: 'Application submitted for',
    profileTitle: 'Trainee Profile & Device State',
    fullNameLabel: 'Full Name',
    contactLabel: 'Contact',
    instituteLabel: 'Assigned Institute',
    instituteValue: 'RICM Bhopal (Lab 1 - Attached PACS Hub)',
    prefLangLabel: 'Preferred Language',
    nodeConnLabel: 'Node Connection',
    triggerSyncBtn: '⚡ Trigger Central Sync',
    syncingBtn: '⏳ Syncing in Progress...',
    resetDemoBtn: 'Reset Demo Data',
    lessonReaderTitle: 'AUDIO-ENABLED COOPERATIVE LESSON',
    stopNarration: '⏹️ Stop Narration',
    listenNarration: '🔊 Listen (ऑडियो सुनें)',
    markLessonComplete: '✓ Mark Lesson Completed',
    examReturnBtn: 'Return to Learning',
    examSubmitBtn: 'Submit Examination',
    pacsLabTitle: 'PACS Operations & Ledger Balancing Lab',
    pacsLabBadge: 'Interactive Simulation',
    pacsLabDesc: 'Hands-on double-entry Day-End balancing simulator with Opening Vault Cash ₹45,000, 5 sequential voucher postings, KCC crop loan appraisal, and fertilizer POS stock reconciliation.',
    launchPacsLabBtn: 'Launch PACS Operations Lab →',
    pacsLabBalancedTag: '✓ Day-End Balanced',
    schemeCalculatorBtn: '📊 Scheme Advisory Wizard',
    schemeCardTitle: 'National Scheme Eligibility Advisory',
    schemeCardSub: 'Calculate capital subsidy (up to ₹10L) & interest subvention (3%) for AIF, PMFME & Yuva Sahakar.',
    openSchemeCalcBtn: 'Open Scheme Advisory Wizard →',
    helpdeskHeaderBtn: 'Helpdesk & Grievance',
    grievanceBtnTitle: 'Member Grievance & Ombudsman SLA Tracker',
    grievanceCardTitle: 'Member Grievance & Ombudsman Helpdesk',
    grievanceCardSub: 'Lodge statutory disputes under MSCS Act 2023 with guaranteed 48-hour Tier 1 resolution.',
    openGrievanceBtn: 'Lodge Grievance / Track SLA →',
    offerSectionTitle: 'Official Digital Offer Letter (Ed25519 Signed)',
    offerSectionSub: 'Conferred under National Council for Cooperative Training (NCCT) Placement Drive',
    offerStatusPending: 'Action Required — Pending Acceptance',
    offerStatusAccepted: '✓ Offer Accepted — Candidate Placed',
    offerStatusDeclined: 'Offer Declined',
    offerSignatoryLabel: 'Authorized Signatory',
    offerCtcLabel: 'Annual Compensation (CTC)',
    offerSalaryLabel: 'Monthly Salary / Stipend',
    offerLocationLabel: 'Posting Location',
    offerJoiningDateLabel: 'Expected Joining Date',
    offerTermsLabel: 'Terms & Conditions of Placement',
    offerCryptoVerifiedBadge: 'Ed25519 Cryptographically Sealed & Validated',
    offerFullLetterBtn: 'View Full Letter',
    offerAcceptBtn: 'Accept Offer (स्वीकार करें)',
    offerDeclineBtn: 'Decline Offer (अस्वीकार करें)',
    offerPlacedStatusNotice: 'Placement Confirmed • Dossier Sent to Amul & NCCT',
  },
  HI: {
    motto: 'एनसीटीसीटी सहकारी प्रशिक्षण',
    subMotto: 'सहकारिता मंत्रालय • भारत सरकार',
    greeting: 'नमस्ते',
    offlineBanner: 'ऑफलाइन मोड — स्थानीय एज नोड बफरिंग सक्रिय',
    onlineBanner: 'सभी रिकॉर्ड केंद्रीय रूप से सिंक हैं',
    flakyBanner: 'धीमा इंटरनेट — स्थानीय बफरिंग सक्रिय',
    enrolledProgram: 'नामांकित प्रशिक्षण कार्यक्रम',
    cohort: 'बैच',
    venue: 'प्रशिक्षण केंद्र',
    venueDetail: 'आरआइसीएम भोपाल लैब 1 (संबद्ध पैक्स केंद्र)',
    todaysAttendance: 'आज के सत्र की उपस्थिति',
    activeStatus: 'सक्रिय सत्र',
    sessionTimings: 'सत्र समय: प्रातः 09:30 – दोपहर 12:30 (अनिवार्य: 60 मिनट)',
    qrCheckInBtn: 'स्थानीय क्यूआर उपस्थिति',
    faceCheckInBtn: 'चेहरा बायोमेट्रिक उपस्थिति',
    checkedInBadge: '✓ उपस्थिति दर्ज',
    syllabusProgress: 'पाठ्यक्रम प्रगति',
    complete: 'पूर्ण',
    lessonsFinished: 'पाठ संपन्न',
    openLessons: 'पाठ सूची देखें →',
    certificationExam: 'वैधानिक प्रमाणन परीक्षा',
    launchExam: 'ऑफलाइन परीक्षा शुरू करें (3 प्रश्न)',
    examDesc: 'ऑफलाइन परीक्षा • 3 प्रश्न • उत्तीर्ण अंक: 75%',
    oralVivaTitle: 'मौखिक परीक्षा (Voice AI मूल्यांकन)',
    launchOralViva: 'मौखिक परीक्षा शुरू करें',
    oralVivaDesc: 'ध्वनि आधारित परीक्षा • 3 सहकारी लेखा प्रश्न • रीयल-टाइम कीवर्ड स्कोरिंग • उत्तीर्ण अंक: 70%',
    oralVivaPassed: '✓ मौखिक परीक्षा उत्तीर्ण',
    moduleTitle: 'मॉड्यूल 1: दैनिक वाउचर प्रविष्टि और बहीखाता संतुलन',
    readLesson: 'ऑफलाइन पाठ पढ़ें →',
    completedBadge: '✓ पूर्ण',
    availableOffline: 'ऑफलाइन उपलब्ध',
    manifestReady: 'स्थानीय सामग्री मैनिफेस्ट तैयार',
    courseMeta: 'भाषा: हिन्दी / अंग्रेजी • संस्करण 1.0 • एनसीटीसीटी अनुमोदित',
    lessonFormat: 'प्रारूप',
    localAsset: 'स्थानीय एसेट',
    overallProgress: 'समग्र योग्यता प्रगति',
    completionStatus: 'पूर्णता स्थिति',
    completedModules: 'पूर्ण मॉड्यूल और पाठ',
    evalLog: 'मूल्यांकन लॉग',
    noExamAttempts: 'अभी कोई परीक्षा प्रयास दर्ज नहीं है। अपनी योग्यता जांचने हेतु ऑफलाइन परीक्षा शुरू करें।',
    attempt: 'प्रयास',
    questionsCorrect: 'प्रश्न सही',
    passedStatus: 'उत्तीर्ण (PASSED)',
    retakeStatus: 'पुनः प्रयास आवश्यक',
    doneBadge: '✓ संपन्न',
    pendingBadge: 'प्रतीक्षारत',
    statutoryCred: 'वैधानिक डिजिटल प्रमाण पत्र (Ed25519)',
    certifiedBy: 'राष्ट्रीय सहकारी प्रशिक्षण परिषद (NCCT) द्वारा प्रमाणित',
    verifyQr: 'किसी भी सहकारी बैंक या समिति में तत्काल Ed25519 सत्यापन हेतु क्यूआर स्कैन करें।',
    awardedTo: 'प्रदान किया गया',
    credentialId: 'प्रमाणपत्र संख्या',
    qrVerified: '🛡️ क्यूआर सत्यापित',
    issuer: 'जारीकर्ता',
    issuerValue: 'एनसीटीसीटी शीर्ष बोर्ड',
    algorithm: 'एल्गोरिदम',
    algorithmValue: 'Ed25519 (छेड़छाड़-मुक्त)',
    viewCertificateBtn: 'आधिकारिक एनसीटीसीटी प्रमाणपत्र देखें व प्रिंट करें',
    tabs: {
      HOME: 'गृह',
      LEARN: 'अध्ययन',
      PROGRESS: 'प्रगति',
      CREDENTIALS: 'प्रमाण पत्र',
      OPPORTUNITIES: 'रोज़गार',
      PROFILE: 'प्रोफ़ाइल',
    },
    qrScannerTitle: 'सत्र डायनामिक क्यूआर स्कैन करें',
    qrScannerSub: 'कैमरा वेन्यू स्क्रीन या ट्रेनर टर्मिनल के ऑप्टिकल फ्रेम में संरेखित करें',
    simulateScanBtn: '⚡ ऑप्टिकल क्यूआर स्कैन और सत्यापित करें',
    faceScannerTitle: 'बायोमेट्रिक चेहरा सत्यापन',
    faceScannerSub: 'चेहरा ऑप्टिकल गाइड के केंद्र में रखें। 3डी एंटी-स्पूफिंग एवं सजीवता जांच सक्रिय है।',
    simulateFaceBtn: '👤 चेहरा सत्यापित कर उपस्थिति दर्ज करें',
    queueDrawerTitle: 'स्थानीय ऑफलाइन इवेंट जर्नल (SQLite WAL)',
    queueDrawerSub: 'इस डिवाइस पर दर्ज इवेंट जो केंद्रीय सिंक के लिए कतारबद्ध हैं',
    eventsBuffered: 'इवेंट SQLite WAL में सुरक्षित रूप से बफर हैं',
    allEventsSynced: '✓ सभी इवेंट केंद्रीय क्लाउड एपीआई के साथ सिंक हो चुके हैं!',
    journalUpToDate: '✓ जर्नल अद्यतन है',
    pushSyncNow: '⚡ अभी केंद्रीय सिंक करें',
    counselorBtn: '🤖 सहकार मित्र AI',
    counselorTitle: 'सहकार मित्र (Sahakar Mitra)',
    counselorSubtitle: 'एआई सहकारी करियर एवं योजना सलाहकार',
    counselorCardTitle: 'सहकार मित्र (Sahakar Mitra) — एआई करियर सलाहकार',
    counselorCardSub: 'पैक्स भर्ती (63,000 पद), अमूल डेयरी और एनसीडीसी युवा सहकार योजनाओं पर व्यक्तिगत मार्गदर्शन प्राप्त करें।',
    openCounselorBtn: 'सहकार मित्र से परामर्श लें →',
    askCounselorPlaceholder: 'पैक्स भर्ती (63,000), अमूल, सब्सिडी के बारे में पूछें...',
    oppsHeader: 'आपकी सत्यापित योग्यताओं से मेल खाती सहकारी रोजगार रिक्तियां:',
    matchBadge: '95% सुसंगत',
    locationLabel: 'स्थान',
    applyBtn: 'आवेदन करें',
    appSubmittedAlert: 'सफलतापूर्वक आवेदन जमा हुआ',
    profileTitle: 'प्रशिक्षु प्रोफ़ाइल एवं डिवाइस स्थिति',
    fullNameLabel: 'पूरा नाम',
    contactLabel: 'संपर्क',
    instituteLabel: 'संबद्ध संस्थान',
    instituteValue: 'आरआइसीएम भोपाल (लैब 1 - संबद्ध पैक्स हब)',
    prefLangLabel: 'प्राथमिक भाषा',
    nodeConnLabel: 'नोड कनेक्टिविटी',
    triggerSyncBtn: '⚡ केंद्रीय सिंक प्रारंभ करें',
    syncingBtn: '⏳ सिंक प्रक्रिया जारी है...',
    resetDemoBtn: 'डेमो डेटा रीसेट करें',
    lessonReaderTitle: 'ऑडियो-सक्षम सहकारी पाठ',
    stopNarration: '⏹️ वाचन रोकें',
    listenNarration: '🔊 पाठ सुनें (ऑडियो)',
    markLessonComplete: '✓ पाठ पूर्ण चिह्नित करें',
    examReturnBtn: 'पाठ्यक्रम पर वापस जाएं',
    examSubmitBtn: 'परीक्षा जमा करें',
    pacsLabTitle: 'पैक्स परिचालन एवं रोकड़बही प्रयोगशाला',
    pacsLabBadge: 'इंटरैक्टिव सिमुलेटर',
    pacsLabDesc: '₹45,000 प्रारंभिक तिजोरी नकदी, 5 रोजनामचा वाउचर प्रविष्टियों, केसीसी फसली ऋण मूल्यांकन, एवं उर्वरक पीओएस स्टॉक मिलान हेतु अभ्यास प्रयोगशाला।',
    launchPacsLabBtn: 'पैक्स प्रयोगशाला शुरू करें →',
    pacsLabBalancedTag: '✓ रोकड़बही मिलान पूर्ण',
    schemeCalculatorBtn: '📊 योजना पात्रता सलाहकार',
    schemeCardTitle: 'राष्ट्रीय योजना पात्रता एवं सब्सिडी सलाहकार',
    schemeCardSub: 'एआईएफ, पीएमएफएमई और युवा सहकार के लिए पूंजीगत सब्सिडी (₹10 लाख तक) एवं ब्याज छूट (3%) की गणना करें।',
    openSchemeCalcBtn: 'योजना सलाहकार विज़ार्ड खोलें →',
    helpdeskHeaderBtn: 'शिकायत निवारण',
    grievanceBtnTitle: 'सदस्य शिकायत एवं लोकपाल समय-सीमा ट्रैकर',
    grievanceCardTitle: 'सदस्य शिकायत एवं लोकपाल सहायता केंद्र',
    grievanceCardSub: 'एमएससीएस अधिनियम 2023 के तहत 48 घंटे की समय-सीमा के भीतर वैधानिक विवाद दर्ज करें।',
    openGrievanceBtn: 'शिकायत दर्ज करें / स्थिति देखें →',
    offerSectionTitle: 'आधिकारिक डिजिटल नियुक्ति पत्र (Ed25519 हस्ताक्षरित)',
    offerSectionSub: 'राष्ट्रीय सहकारी प्रशिक्षण परिषद (NCCT) रोजगार अभियान के अंतर्गत प्रदत्त',
    offerStatusPending: 'कार्रवाई अपेक्षित — स्वीकृति लंबित',
    offerStatusAccepted: '✓ नियुक्ति पत्र स्वीकृत — पदस्थापन पूर्ण',
    offerStatusDeclined: 'नियुक्ति पत्र अस्वीकृत',
    offerSignatoryLabel: 'प्राधिकृत हस्ताक्षरकर्ता',
    offerCtcLabel: 'वार्षिक सीटीसी (कुल पैकेज)',
    offerSalaryLabel: 'मासिक मानदेय / वेतन',
    offerLocationLabel: 'कार्यभार ग्रहण स्थल',
    offerJoiningDateLabel: 'प्रस्तावित कार्यभार ग्रहण तिथि',
    offerTermsLabel: 'पदस्थापन नियम एवं शर्तें',
    offerCryptoVerifiedBadge: 'Ed25519 संप्रभु क्रिप्टोग्राफिक मुहर द्वारा प्रमाणित',
    offerFullLetterBtn: 'पूर्ण नियुक्ति पत्र देखें',
    offerAcceptBtn: 'स्वीकार करें (Accept Offer)',
    offerDeclineBtn: 'अस्वीकार करें (Decline Offer)',
    offerPlacedStatusNotice: 'पदस्थापन पुष्ट • विवरण अमूल एवं एनसीटीसीटी को प्रेषित',
  },
};

export default function App() {
  const [activeTab, setActiveTab] = useState<
    'HOME' | 'LEARN' | 'PROGRESS' | 'CREDENTIALS' | 'OPPORTUNITIES' | 'PROFILE'
  >('HOME');

  // Bilingual Language State
  const [language, setLanguage] = useState<'EN' | 'HI'>('EN');
  const t = TRANSLATIONS[language];

  // Network simulation state per 04_OFFLINE_SYNC_PROTOCOL.md
  const [wanMode, setWanMode] = useState<'OFFLINE' | 'ONLINE' | 'FLAKY'>('ONLINE');
  const [networkConnectivity, setNetworkConnectivity] = useState<ConnectivityState>({
    mode: 'OFFLINE',
    edgeOnline: false,
    centralOnline: false,
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  // WebRTC Camera State
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Audio Narration & Speech Recognition State
  const [isLessonAudioPlaying, setIsLessonAudioPlaying] = useState(false);
  const [isVoiceListening, setIsVoiceListening] = useState(false);

  const [queuedEvents, setQueuedEvents] = useState<SyncEvent[]>([]);
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);
  const [progressPercent, setProgressPercent] = useState<number>(50);
  const [attempts, setAttempts] = useState<AssessmentAttempt[]>([]);

  // Modals & Drawers
  const [activeLesson, setActiveLesson] = useState<LessonDetail | null>(null);
  const [isAssessmentOpen, setIsAssessmentOpen] = useState(false);
  const [isOralAssessmentOpen, setIsOralAssessmentOpen] = useState(false);
  const [oralAssessmentResult, setOralAssessmentResult] = useState<OralAssessmentResult | null>(null);
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [isFaceScannerOpen, setIsFaceScannerOpen] = useState(false);
  const [isQueueDrawerOpen, setIsQueueDrawerOpen] = useState(false);
  const [isCounselorOpen, setIsCounselorOpen] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);
  const [scanSuccessNotice, setScanSuccessNotice] = useState<string | null>(null);

  // Visitor Profile mode for /?profile=:code
  const [visitorProfileCode, setVisitorProfileCode] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('profile');
    }
    return null;
  });

  // Dynamic 6-Digit Attendance state
  const [isDynamicAttendanceOpen, setIsDynamicAttendanceOpen] = useState(false);
  const [todayAttendanceRecord, setTodayAttendanceRecord] = useState<any>(null);

  // Milestone 3 Sovereign NFC & Marks Tally state
  const [nfcProfile, setNfcProfile] = useState<TraineePublicNfcProfile | null>(null);
  const [marksTally, setMarksTally] = useState<CourseMarksTally | null>(null);

  // Live IST Clock
  const [currentIstTime, setCurrentIstTime] = useState<string>('');
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setCurrentIstTime(d.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' IST');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Check attendance on mount
  useEffect(() => {
    const records = offlineStore.getAttendanceRecords();
    const existing = records.find((r) => r.sessionId === SEED_SESSION.id || r.sessionId === 'sess-pacs-101');
    if (existing) {
      setTodayAttendanceRecord(existing);
    }
  }, []);

  const [counselorInput, setCounselorInput] = useState('');
  const [counselorMessages, setCounselorMessages] = useState<
    Array<{ sender: 'USER' | 'AI'; text: string; time: string; tags?: string[] }>
  >([
    {
      sender: 'AI',
      text:
        'Namaste! I am Sahakar Mitra (सहकार मित्र), your AI Cooperative Career & Scheme Counselor. I can guide you on jobs in 63,000 computerized PACS, dairy cooperatives like Amul, and government subsidies like NCDC Yuva Sahakar. What would you like to know?',
      time: 'Just now',
      tags: ['63,000 PACS Drive', 'Amul Dairy Jobs', 'Yuva Sahakar Scheme'],
    },
  ]);

  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizResult, setQuizResult] = useState<{
    score: number;
    passed: boolean;
    correctCount: number;
    total: number;
  } | null>(null);

  // Trainee identity
  const trainee = SEED_USERS.find((u) => u.role === 'TRAINEE') || SEED_USERS[3];

  // Milestone 2 Modals State
  const [isPacsLabOpen, setIsPacsLabOpen] = useState(false);
  const [isSchemeModalOpen, setIsSchemeModalOpen] = useState(false);
  const [isGrievanceModalOpen, setIsGrievanceModalOpen] = useState(false);

  // Milestone 2 Digital Offer Letter State
  const SEED_AMUL_OFFER: DigitalOfferLetter = {
    id: 'off-amul-2026-0814',
    applicationId: 'app-amul-pacs-001',
    jobId: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
    candidateId: trainee.id,
    payload: {
      offerId: 'off-amul-2026-0814',
      applicationId: 'app-amul-pacs-001',
      jobId: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
      jobTitle: 'Assistant Accountant & PACS Field Coordinator',
      employer: {
        id: 'eeee5555-5555-5555-5555-555555555555',
        name: 'Anand Milk Union (Amul) Talent Network',
        authorizedSignatory: 'Head of Human Resources & Recruitment',
      },
      candidate: {
        id: trainee.id,
        name: trainee.name,
        emailOrPhone: trainee.emailOrPhone,
      },
      designation: 'Assistant Accountant & PACS Field Coordinator',
      annualCompensationLPA: 3.8,
      monthlyStipendOrSalary: 31666,
      joiningDate: '15 November 2026',
      postingLocation: 'Anand, Gujarat / Attached PACS Hub (Bhopal, MP)',
      terms: [
        'Subject to verification of NCCT accredited training certification.',
        'Immediate placement under the National Cooperative Development Scheme.',
        'Probation period of 3 months with cooperative performance review.',
      ],
      issuedAt: '2026-10-25T10:00:00.000Z',
      schemaVersion: 1,
    },
    signatureHex:
      '7c98b671a532d88f6b98e1e79201f9bb973941458e0a4f526b7c53d10a28f73b88a9c04d13e2f5b6a7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f901',
    signature:
      '7c98b671a532d88f6b98e1e79201f9bb973941458e0a4f526b7c53d10a28f73b88a9c04d13e2f5b6a7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f901',
    issuerKeyId: 'ncct-master-key-01',
    canonicalDigest: '8f434346648f6b96df89dda901c5176b10e6d83961dd3c1ac88b59b2dc327aa4',
    verificationUrl: 'https://verify.sahakar.gov.in/offers/off-amul-2026-0814',
    compactQr: 'eyJpZCI6Im9mZi1hbXVsLTIwMjYtMDgxNCIsInNpZyI6IjdjOThiNiJ9',
    status: 'ISSUED',
    issuedAt: '2026-10-25T10:00:00.000Z',
  };

  const [receivedOffer, setReceivedOffer] = useState<DigitalOfferLetter>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem('sahakar_edge_offer_state_v1');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {}
      }
    }
    return SEED_AMUL_OFFER;
  });
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerFeedbackNotice, setOfferFeedbackNotice] = useState<string | null>(null);

  const handleAcceptOffer = () => {
    const updated: DigitalOfferLetter = {
      ...receivedOffer,
      status: 'ACCEPTED',
    };
    setReceivedOffer(updated);
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('sahakar_edge_offer_state_v1', JSON.stringify(updated));
    }
    setOfferFeedbackNotice(
      language === 'HI'
        ? 'बधाई हो! आपने अमूल का नियुक्ति पत्र स्वीकार कर लिया है। आपकी स्थिति PLACED के रूप में दर्ज हो गई है।'
        : 'Congratulations! You have accepted the offer from Amul. Candidate status updated to PLACED.'
    );
    setTimeout(() => setOfferFeedbackNotice(null), 6000);
  };

  const handleDeclineOffer = () => {
    if (!confirm(language === 'HI' ? 'क्या आप निश्चित रूप से यह नियुक्ति पत्र अस्वीकार करना चाहते हैं?' : 'Are you sure you want to decline this digital offer?')) {
      return;
    }
    const updated: DigitalOfferLetter = {
      ...receivedOffer,
      status: 'DECLINED',
    };
    setReceivedOffer(updated);
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('sahakar_edge_offer_state_v1', JSON.stringify(updated));
    }
    setOfferFeedbackNotice(
      language === 'HI'
        ? 'नियुक्ति पत्र अस्वीकृत कर दिया गया है। आपकी प्रोफ़ाइल अन्य सहकारी रिक्तियों हेतु सक्रिय रहेगी।'
        : 'Offer declined. Your profile remains active for other cooperative society openings.'
    );
    setTimeout(() => setOfferFeedbackNotice(null), 6000);
  };

  const refreshState = () => {
    setQueuedEvents(offlineStore.getQueuedEvents());
    setCompletedLessonIds(offlineStore.getCompletedLessons());
    setProgressPercent(offlineStore.getProgressPercentage());
    setAttempts(offlineStore.getAssessmentAttempts());
    setOralAssessmentResult(offlineStore.getLatestOralAssessment(trainee.id));
  };

  useEffect(() => {
    refreshState();

    async function probe() {
      const conn = await networkSync.probeConnectivity();
      setNetworkConnectivity(conn);
      if (conn.mode !== 'OFFLINE') {
        setWanMode('ONLINE');
      }
    }
    probe();
    const interval = setInterval(probe, 8000);
    return () => clearInterval(interval);
  }, []);

  // WebRTC Camera Stream Lifecycle (QR & Biometric Face)
  useEffect(() => {
    let stream: MediaStream | null = null;
    if (isQrScannerOpen || isFaceScannerOpen) {
      setCameraError(null);
      if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices
          .getUserMedia({
            video: {
              facingMode: isFaceScannerOpen ? 'user' : 'environment',
              width: { ideal: 640 },
              height: { ideal: 480 },
            },
          })
          .then((s) => {
            stream = s;
            streamRef.current = s;
            if (videoRef.current) {
              videoRef.current.srcObject = s;
              videoRef.current.play().catch(() => {});
            }
            setCameraActive(true);
          })
          .catch((err) => {
            console.warn('Camera stream notice:', err.message);
            setCameraError('Camera stream not attached on this device. Live optical capture aperture active.');
            setCameraActive(false);
          });
      } else {
        setCameraError('WebRTC mediaDevices not supported in this runtime.');
      }
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      setCameraActive(false);
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isQrScannerOpen, isFaceScannerOpen]);

  const handleCompleteLesson = (lessonId: string) => {
    offlineStore.completeLesson(lessonId, trainee.id);
    refreshState();
    setActiveLesson(null);
  };

  const handleSimulateQrScan = () => {
    offlineStore.recordAttendance(SEED_SESSION.id, trainee.id, 'QR');
    refreshState();
    setScanSuccessNotice(language === 'HI' ? 'क्यूआर उपस्थिति दर्ज! इवेंट सुरक्षित रूप से कतारबद्ध।' : 'QR Attendance recorded offline! Event queued in SQLite journal.');
    setTimeout(() => {
      setScanSuccessNotice(null);
      setIsQrScannerOpen(false);
    }, 1200);
  };

  const handleSimulateFaceScan = () => {
    offlineStore.recordAttendance(SEED_SESSION.id, trainee.id, 'SIMULATED_FACE');
    refreshState();
    setScanSuccessNotice(
      language === 'HI'
        ? 'बायोमेट्रिक फेस सत्यापन सफल (98.6% सटीकता)! इवेंट कतारबद्ध।'
        : 'Biometric Face Verified (98.6% Liveness)! Recorded offline in SQLite WAL.'
    );
    setTimeout(() => {
      setScanSuccessNotice(null);
      setIsFaceScannerOpen(false);
    }, 1200);
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

  const handleSimulateSync = async () => {
    if (wanMode === 'OFFLINE' && !networkConnectivity.edgeOnline && !networkConnectivity.centralOnline) {
      alert('Device is currently in OFFLINE mode without reachable network. Buffered events remain safe in local WAL journal.');
      return;
    }
    const current = offlineStore.getQueuedEvents();
    if (current.length === 0) {
      alert('Event journal queue is already empty. All records are up to date.');
      return;
    }

    setIsSyncing(true);
    setSyncNotice('Connecting to Edge Gateway (192.168.4.1) / Central Cloud...');

    try {
      const res = await networkSync.syncEvents('edge-node-ricm-bhopal-01', current);
      if (res.success) {
        offlineStore.markEventsSynced(current.map((e) => e.id));
        refreshState();
        const target = res.destination === 'EDGE_NODE' ? 'RICM Bhopal Edge Node (Local LAN)' : 'NCCT Central Cloud (WAN)';
        alert(`✓ Successfully synchronized ${res.count} domain events with ${target}!\n\nPayload SHA-256 integrity verified and local WAL cleared.`);
        setSyncNotice(`Synced ${res.count} events to ${target}`);
      } else {
        alert(`Sync Notice: ${res.error || 'Server unreachable'}\n\nEvents are safely retained in local SQLite WAL.`);
        setSyncNotice(`Sync buffered: ${res.error}`);
      }
    } catch (e: any) {
      alert(`Sync failed: ${e.message}. Events remain safely buffered in local storage.`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleResetData = () => {
    if (confirm('Reset local offline demo data to defaults?')) {
      offlineStore.clearAllData();
      refreshState();
      setQuizAnswers({});
      setQuizResult(null);
    }
  };

  const handleSendCounselorMessage = async (textToSend?: string) => {
    const q = (textToSend || counselorInput).trim();
    if (!q) return;

    const userMsg = {
      sender: 'USER' as const,
      text: q,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setCounselorMessages((prev) => [...prev, userMsg]);
    setCounselorInput('');

    // Try central counselor API first if online
    try {
      const liveRes = await networkSync.queryCounselor(q, trainee.id, language);
      const aiMsg = {
        sender: 'AI' as const,
        text: liveRes.reply,
        time: liveRes.time,
        tags: liveRes.tags,
      };
      setCounselorMessages((prev) => [...prev, aiMsg]);
      return;
    } catch {
      // Fallback to local offline rule matching
    }

    let reply = '';
    let tags: string[] = [];

    const lower = q.toLowerCase();
    const isHindi = language === 'HI' || /[\u0900-\u097F]/.test(q);

    if (lower.includes('pacs') || lower.includes('पैक्स') || lower.includes('secretary') || lower.includes('accounting') || lower.includes('लेखा')) {
      if (isHindi) {
        reply = 'सहकारिता मंत्रालय के 63,000 पैक्स कंप्यूटरीकरण अभियान के तहत, आपका Ed25519 प्रमाणित कौशल "पैक्स सचिव / कनिष्ठ लेखाकार" पद हेतु 95% उपयुक्त है। प्रारंभिक मानदेय ₹18,000 से ₹32,000/माह है। नाबार्ड के मानकों के अनुसार आपकी डे-बुक एवं वाउचर प्रविष्टि दक्षता को प्राथमिकता दी जाएगी।';
        tags = ['63,000 पैक्स अभियान', 'नाबार्ड मानक', 'वाउचर प्रमाणित'];
      } else {
        reply = 'Under the Ministry of Cooperation nationwide 63,000 PACS computerization drive, your verified Ed25519 certification makes you directly eligible for "PACS Secretary / Junior Accountant" roles (₹18,000 - ₹32,000/month). Your double-entry ledger competency aligns 100% with NABARD standard guidelines.';
        tags = ['63,000 PACS Drive', 'NABARD Guidelines', 'Day-Book Certified'];
      }
    } else if (lower.includes('amul') || lower.includes('dairy') || lower.includes('अमूल') || lower.includes('दूध') || lower.includes('डेयरी')) {
      if (isHindi) {
        reply = 'अमूल / जीसीएमएमएफ तथा राज्य दुग्ध संघों में "दुग्ध संकलन समन्वयक" और "कोल्ड चेन पर्यवेक्षक" के पद उपलब्ध हैं। आपका सहकारी उप-नियम और वित्तीय रिकॉर्ड प्रबंधन प्रमाण पत्र ग्रामीण संकलन केंद्रों के प्रबंधन के लिए पूरी तरह मान्य है।';
        tags = ['अमूल / GCMMF', 'कोल्ड चेन प्रबंधन', 'दुग्ध परीक्षण'];
      } else {
        reply = 'For Dairy Cooperatives such as GCMMF / Amul, certified candidates are matched to "Dairy Procurement Coordinator" and "Cold Chain Supervisor" roles overseeing village-level Bulk Milk Chilling (BMC) units and computerized milk testing protocols.';
        tags = ['GCMMF / Amul', 'Cold Chain Management', 'Milk Testing Protocol'];
      }
    } else if (lower.includes('scheme') || lower.includes('योजना') || lower.includes('subsidy') || lower.includes('startup') || lower.includes('अनुदान') || lower.includes('युवा')) {
      if (isHindi) {
        reply = 'एनसीडीसी की "युवा सहकार योजना" के अंतर्गत ग्रामीण युवाओं को नए सहकारी व्यवसाय शुरू करने हेतु 2% ब्याज अनुदान तथा ₹3 करोड़ तक की परियोजना वित्तीय सहायता मिलती है। साथ ही पैक्स बुनियादी ढांचा कोष से आधुनिक गोदाम और किसान सेवा केंद्र खोले जा सकते हैं।';
        tags = ['युवा सहकार योजना', 'एनसीडीसी अनुदान', 'पैक्स गोदाम'];
      } else {
        reply = 'Under NCDC\'s "Yuva Sahakar Scheme", young cooperative entrepreneurs receive 2% interest subvention and project funding up to ₹3 Crores. You can also leverage the PACS Infrastructure Fund for modern grain storage and multi-service farmer centres.';
        tags = ['Yuva Sahakar Scheme', 'NCDC Subventions', 'PACS Agro-Storage'];
      }
    } else {
      if (isHindi) {
        reply = `सहकारी रोजगार संबंधी प्रश्न के लिए धन्यवाद! आपकी वर्तमान योग्यता (पैक्स कंप्यूटरीकरण, वाउचर प्रविष्टि और ऑडिटिंग) के आधार पर प्राथमिक कृषि साख समितियों और जिला केंद्रीय सहकारी बैंकों में 95% उपयुक्तता है। क्या आप वर्तमान रिक्तियां देखना चाहते हैं?`;
        tags = ['कौशल मिलान', 'एनसीटीसीटी मान्यता', 'रोजगार लिंक'];
      } else {
        reply = `Thank you for your query! Based on your verified skills in PACS Computerization, Voucher Entry, and Statutory Ledger Posting, you have a 95% match with open positions at Primary Agricultural Credit Societies and District Central Cooperative Banks. Would you like to view active vacancies?`;
        tags = ['Tailored Pathway', 'NCCT Accreditation', 'Recruiter Connect'];
      }
    }

    const aiMsg = {
      sender: 'AI' as const,
      text: reply,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      tags,
    };

    setCounselorMessages((prev) => [...prev, aiMsg]);
    setCounselorInput('');
  };

  const isOffline = wanMode === 'OFFLINE' || (!networkConnectivity.edgeOnline && !networkConnectivity.centralOnline);
  const lessons = offlineStore.getManifest().lessons;
  const assessment = offlineStore.getAssessment();
  const questions = offlineStore.getQuestions();

  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  if (visitorProfileCode) {
    const isCodeActive =
      visitorProfileCode === 'NCCT-AP-9941' ||
      (nfcProfile && nfcProfile.publicProfileCode === visitorProfileCode && nfcProfile.enabled);
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          backgroundColor: '#f8fafc',
          fontFamily: THEME.fonts.sans,
        }}
      >
        {/* Tricolor National Identity Ribbon */}
        <div style={{ display: 'flex', height: '4px', width: '100%' }}>
          <div style={{ flex: 1, backgroundColor: THEME.colors.saffronFlag }} />
          <div style={{ flex: 1, backgroundColor: '#ffffff' }} />
          <div style={{ flex: 1, backgroundColor: THEME.colors.greenFlag }} />
        </div>

        {/* Government Deep Navy Masthead */}
        <header
          style={{
            backgroundColor: THEME.colors.navyDeep,
            color: '#ffffff',
            padding: '1rem 1.25rem',
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(8, 24, 84, 0.2)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
            <AshokChakraIcon size={28} color="#ffffff" />
            <span style={{ fontSize: '0.8125rem', color: THEME.colors.goldCoop, fontWeight: 800, letterSpacing: '0.04em' }}>
              भारत सरकार • सहकारिता मंत्रालय • राष्ट्रीय सहकारी प्रशिक्षण परिषद (NCCT)
            </span>
          </div>
          <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#ffffff', letterSpacing: '0.02em' }}>
            Sovereign Field Verification Service
          </h1>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
            Tap-to-Verify Credential Inspector • Zero-PII Protected Public Register
          </div>
        </header>

        <main style={{ maxWidth: '640px', width: '100%', margin: '1.75rem auto', padding: '0 1rem', boxSizing: 'border-box' }}>
          {isCodeActive ? (
            <div style={{ ...doubleBezelCardOuter, marginBottom: '1.5rem' }}>
              <div style={doubleBezelCardInner}>
                {/* Header Verification Seal */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                    borderBottom: `1px solid ${THEME.colors.borderHairline}`,
                    paddingBottom: '0.85rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <NcctEmblemIcon size={38} color="#081854" accentColor="#feb505" greenColor="#1ab452" />
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 800, color: THEME.colors.navyPrimary, letterSpacing: '0.04em' }}>
                        TRUST ISSUER: NCCT APEX BOARD
                      </div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 800, color: THEME.colors.navyDeep }}>
                        National Council for Cooperative Training
                      </div>
                    </div>
                  </div>

                  <span
                    style={{
                      backgroundColor: '#f0fdf4',
                      color: '#166534',
                      border: '1px solid #86efac',
                      borderRadius: '9999px',
                      padding: '0.3rem 0.75rem',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    <span>✓</span>
                    <span>SOVEREIGN VERIFIED CREDENTIAL</span>
                  </span>
                </div>

                {/* Trainee Public Details */}
                <div style={{ margin: '1.25rem 0' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: THEME.colors.inkMuted }}>
                    Verified Candidate Name
                  </div>
                  <div style={{ fontSize: '1.45rem', fontWeight: 900, color: THEME.colors.navyDeep, marginTop: '0.15rem' }}>
                    Anita Patel
                  </div>
                  <div style={{ fontSize: '0.875rem', color: THEME.colors.inkBody, marginTop: '0.25rem', fontWeight: 600 }}>
                    Bilkisganj PACS, Sehore (Madhya Pradesh) • RICM Bhopal
                  </div>
                  <div style={{ fontSize: '0.75rem', color: THEME.colors.inkMuted, marginTop: '0.2rem', fontFamily: THEME.fonts.mono }}>
                    Token Code: {visitorProfileCode} • Ed25519 Cryptographically Validated
                  </div>
                </div>

                {/* Verified Competencies */}
                <div style={{ margin: '1rem 0' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: THEME.colors.navyPrimary, marginBottom: '0.45rem' }}>
                    Verified Assessed Competencies (100% Pass)
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                    {[
                      'PACS Double-Entry Accounting',
                      'Daybook & Cash Voucher Posting',
                      'KCC Loan Disbursement Verification',
                      'Statutory Audit Compliance',
                    ].map((sk, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          backgroundColor: '#eff6ff',
                          color: THEME.colors.navyPrimary,
                          border: '1px solid #bfdbfe',
                          padding: '0.3rem 0.65rem',
                          borderRadius: '3px',
                        }}
                      >
                        ✓ {sk}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Conferred Certificate */}
                <div
                  style={{
                    margin: '1.25rem 0',
                    padding: '1rem',
                    backgroundColor: '#f8fafc',
                    border: `1px solid ${THEME.colors.borderHairline}`,
                    borderRadius: '4px',
                  }}
                >
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: THEME.colors.inkMuted }}>
                    Conferred Statutory Certification
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: THEME.colors.navyDeep, marginTop: '0.25rem' }}>
                    Comprehensive Certificate in PACS Digital Accounting & Cooperative Governance
                  </div>
                  <div style={{ fontSize: '0.75rem', color: THEME.colors.inkMuted, marginTop: '0.25rem', fontFamily: THEME.fonts.mono }}>
                    Certificate Token: EDU-NCCT-2026-9501 • Issued: 25 October 2026
                  </div>
                </div>

                {/* Strict Zero-PII Privacy Guarantee */}
                <div
                  style={{
                    backgroundColor: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: '3px',
                    padding: '0.85rem 1rem',
                    fontSize: '0.75rem',
                    color: '#1e3a8a',
                    lineHeight: 1.45,
                  }}
                >
                  <strong>🔒 Zero-PII Privacy Guarantee:</strong> Under official NCCT data isolation rules, trainee phone numbers, residential addresses, emails, and campus hostel room allotments are strictly private and NEVER exposed to public inquiry.
                </div>
              </div>
            </div>
          ) : (
            <div style={{ ...doubleBezelCardOuter, marginBottom: '1.5rem' }}>
              <div style={{ ...doubleBezelCardInner, textAlign: 'center', padding: '2rem 1.5rem' }}>
                <span style={{ fontSize: '2.5rem' }}>🔒</span>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#991b1b', margin: '0.5rem 0' }}>
                  Profile Shielded or Rotated
                </h2>
                <p style={{ fontSize: '0.8125rem', color: THEME.colors.inkMuted, lineHeight: 1.5, maxWidth: '420px', margin: '0 auto 1.25rem auto' }}>
                  This credential profile code ({visitorProfileCode}) has been set to shielded/private or has been rotated by the trainee. No data is available for this token.
                </p>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.history.replaceState({}, '', '/');
              }
              setVisitorProfileCode(null);
            }}
            style={{
              width: '100%',
              minHeight: '44px',
              backgroundColor: THEME.colors.navyPrimary,
              color: '#ffffff',
              border: `1px solid ${THEME.colors.goldCoop}`,
              borderRadius: '4px',
              padding: '0.75rem 1rem',
              fontSize: '0.875rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 2px 4px rgba(8, 24, 84, 0.15)',
            }}
          >
            <span>←</span>
            <span>Return to Trainee Portal (शिक्षार्थी पोर्टल पर लौटें)</span>
          </button>
        </main>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        maxWidth: '520px',
        margin: '0 auto',
        backgroundColor: '#f8fafc',
        position: 'relative',
        boxShadow: '0 0 24px rgba(15, 23, 42, 0.08)',
        fontFamily: THEME.fonts.sans,
      }}
    >
      {/* Tricolor National Identity Ribbon */}
      <div style={{ display: 'flex', height: '4px', width: '100%' }}>
        <div style={{ flex: 1, backgroundColor: THEME.colors.saffronFlag }} />
        <div style={{ flex: 1, backgroundColor: '#ffffff' }} />
        <div style={{ flex: 1, backgroundColor: THEME.colors.greenFlag }} />
      </div>

      {/* Top Government Deep Navy Utility Strip */}
      <div
        style={{
          padding: '0.55rem 0.85rem',
          backgroundColor: THEME.colors.navyDeep,
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', minWidth: 0 }}>
          <span style={{ fontSize: '0.75rem', color: THEME.colors.goldCoop, fontWeight: 800 }}>
            {currentIstTime || 'IST'}
          </span>
          <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>•</span>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#cbd5e1',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {isSyncing
              ? syncNotice || 'Synchronizing with Gateway...'
              : networkConnectivity.edgeOnline
              ? 'Edge Node Online (RICM Bhopal)'
              : networkConnectivity.centralOnline
              ? 'Central Cloud Direct (api.ncct.gov.in)'
              : isOffline
              ? t.offlineBanner
              : t.onlineBanner}
          </span>
        </div>

        {/* Top WAN Mode Selector & Queue Pill Button (Strict >= 44px) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexShrink: 0 }}>
          <select
            value={wanMode}
            onChange={(e) => setWanMode(e.target.value as any)}
            aria-label="WAN simulation mode"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.35)',
              borderRadius: '4px',
              minHeight: '44px',
              padding: '0.45rem 0.65rem',
              fontSize: '0.8125rem',
              fontWeight: 800,
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="OFFLINE" style={{ color: '#081854' }}>WAN: OFFLINE</option>
            <option value="ONLINE" style={{ color: '#081854' }}>WAN: ONLINE</option>
            <option value="FLAKY" style={{ color: '#081854' }}>WAN: FLAKY</option>
          </select>

          {/* Clickable Queue Pill -> Opens Queue Drawer (Strict >= 44px) */}
          <button
            type="button"
            onClick={() => setIsQueueDrawerOpen(true)}
            title="Inspect pending offline events"
            aria-label="Open offline event journal drawer"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.35)',
              minHeight: '44px',
              padding: '0.45rem 0.85rem',
              borderRadius: '4px',
              fontSize: '0.8125rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            <span>Q:</span>
            <span>{queuedEvents.length}</span>
          </button>
        </div>
      </div>

      {/* Top Header with National Council Masthead & Controls */}
      <header
        style={{
          padding: '0.85rem 1rem',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <AshokChakraIcon size={32} color="#0649a2" />
          <div>
            <div
              style={{
                fontSize: '0.75rem',
                color: THEME.colors.navySovereign,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              {t.motto}
            </div>
            <h1
              style={{
                fontSize: '1.15rem',
                margin: '0.1rem 0 0 0',
                color: THEME.colors.navyDeep,
                fontWeight: 900,
                lineHeight: 1.3,
              }}
            >
              {t.greeting}, {trainee.name.split(' ')[0]}
            </h1>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexShrink: 0 }}>
          {/* Language Switcher Button (Strict >= 44px) */}
          <button
            type="button"
            onClick={() => setLanguage(language === 'EN' ? 'HI' : 'EN')}
            aria-label="Toggle language between English and Hindi"
            style={{
              backgroundColor: '#f1f5f9',
              border: '1px solid #cbd5e1',
              color: THEME.colors.navyDeep,
              minHeight: '44px',
              padding: '0.45rem 0.75rem',
              borderRadius: '4px',
              fontSize: '0.875rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
            }}
          >
            <span>{language === 'EN' ? '🇮🇳 हिन्दी' : '🌐 English'}</span>
          </button>

          {/* Member Grievance & Helpdesk Quick Trigger (Strict >= 44px) */}
          <button
            type="button"
            onClick={() => setIsGrievanceModalOpen(true)}
            aria-label="Open member grievance and helpdesk modal"
            title={t.grievanceBtnTitle}
            style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#b91c1c',
              minHeight: '44px',
              minWidth: '44px',
              padding: '0.45rem 0.75rem',
              borderRadius: '4px',
              fontSize: '0.875rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            <span>⚖️</span>
            <span>{t.helpdeskHeaderBtn}</span>
          </button>

          <div
            style={{
              fontSize: '0.75rem',
              backgroundColor: '#f0fdf4',
              color: '#166534',
              border: '1px solid #86efac',
              minHeight: '44px',
              padding: '0.35rem 0.65rem',
              borderRadius: '4px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              lineHeight: 1.2,
            }}
          >
            RICM<br />Bhopal
          </div>
        </div>
      </header>

      {/* Main Screen Content */}
      <main style={{ flex: 1, padding: '1rem', overflowY: 'auto', paddingBottom: '6rem' }}>
        {/* ========================================================
            TAB 1: HOME
        ======================================================== */}
        {activeTab === 'HOME' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Current Programme Card */}
            <div style={doubleBezelCard('navy')}>
              <div style={{ fontSize: '0.8125rem', color: THEME.colors.navySovereign, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {t.enrolledProgram}
              </div>
              <h2
                style={{
                  fontSize: '1.15rem',
                  margin: '0.35rem 0 0.5rem 0',
                  color: THEME.colors.navyDeep,
                  lineHeight: 1.45,
                  fontWeight: 800,
                }}
              >
                {SEED_PROGRAMME.title}
              </h2>
              <div style={{ fontSize: '0.875rem', color: THEME.colors.inkBody, display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <span><strong>{t.cohort}:</strong> 2026-A</span>
                <span>•</span>
                <span><strong>{t.venue}:</strong> {t.venueDetail}</span>
              </div>
            </div>

            {/* Attendance Status & Offline Check-in */}
            <div style={doubleBezelCard('emerald')}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.8125rem', color: THEME.colors.inkMuted, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {t.todaysAttendance}
                </span>
                <span
                  style={{
                    fontSize: '0.8125rem',
                    backgroundColor: todayAttendanceRecord ? '#dcfce7' : '#eff6ff',
                    color: todayAttendanceRecord ? '#15803d' : '#0649a2',
                    padding: '0.25rem 0.65rem',
                    borderRadius: '4px',
                    fontWeight: 800,
                    border: `1px solid ${todayAttendanceRecord ? '#86efac' : '#bfdbfe'}`,
                  }}
                >
                  {todayAttendanceRecord ? '✓ Verified Present' : t.activeStatus}
                </span>
              </div>

              <h3 style={{ fontSize: '1.05rem', margin: '0.45rem 0 0.25rem 0', color: THEME.colors.navyDeep, fontWeight: 800, lineHeight: 1.4 }}>
                {SEED_SESSION.title}
              </h3>
              <p style={{ fontSize: '0.8125rem', color: THEME.colors.inkMuted, margin: '0 0 0.95rem 0', lineHeight: 1.5 }}>
                {t.sessionTimings}
              </p>

              {/* Primary 6-Digit Dynamic Attendance Button */}
              <button
                type="button"
                onClick={() => setIsDynamicAttendanceOpen(true)}
                style={{
                  width: '100%',
                  minHeight: '48px',
                  backgroundColor: THEME.colors.navyDeep,
                  color: '#ffffff',
                  border: `1px solid ${THEME.colors.goldCoop}`,
                  padding: '0.65rem 1rem',
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.55rem',
                  boxShadow: '0 2px 4px rgba(8, 24, 84, 0.2)',
                  marginBottom: '0.65rem',
                }}
              >
                <span style={{ fontSize: '1.15rem' }}>🔢</span>
                <span>
                  {language === 'HI'
                    ? '6-अंकीय कोड से उपस्थिति दर्ज करें'
                    : 'Enter Dynamic 6-Digit Check-In Code'}
                </span>
              </button>

              <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setIsQrScannerOpen(true)}
                  style={{
                    flex: 1,
                    minWidth: '140px',
                    minHeight: '44px',
                    backgroundColor: '#ffffff',
                    color: THEME.colors.navyPrimary,
                    border: `1px solid ${THEME.colors.borderOuter}`,
                    padding: '0.65rem 0.85rem',
                    borderRadius: '4px',
                    fontSize: '0.8125rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.45rem',
                    boxShadow: '0 1px 2px rgba(8, 24, 84, 0.05)',
                  }}
                >
                  <span style={{ fontSize: '1.1rem' }}>📷</span>
                  <span>{t.qrCheckInBtn}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsFaceScannerOpen(true)}
                  style={{
                    flex: 1,
                    minWidth: '140px',
                    minHeight: '44px',
                    backgroundColor: '#ffffff',
                    color: '#15803d',
                    border: `1px solid ${THEME.colors.borderOuter}`,
                    padding: '0.65rem 0.85rem',
                    borderRadius: '4px',
                    fontSize: '0.8125rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.45rem',
                    boxShadow: '0 1px 2px rgba(22, 101, 52, 0.05)',
                  }}
                >
                  <span style={{ fontSize: '1.1rem' }}>👤</span>
                  <span>{t.faceCheckInBtn}</span>
                </button>
              </div>
            </div>

            {/* Course Progress Snapshot with Circular Ring */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '1.25rem',
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 4px rgba(15, 23, 42, 0.05)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {t.syllabusProgress}
                  </div>
                  <h3 style={{ fontSize: '1.15rem', margin: '0.25rem 0 0.35rem 0', color: '#0f172a', fontWeight: 800 }}>
                    {progressPercent}% {t.complete}
                  </h3>
                  <div style={{ fontSize: '0.875rem', color: '#475569' }}>
                    {completedLessonIds.length} of {lessons.length} {t.lessonsFinished}
                  </div>
                </div>

                {/* SVG Progress Dial */}
                <div style={{ position: 'relative', width: '68px', height: '68px' }}>
                  <svg width="68" height="68" viewBox="0 0 64 64" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="32" cy="32" r={radius} stroke="#e2e8f0" strokeWidth="6" fill="transparent" />
                    <circle
                      cx="32"
                      cy="32"
                      r={radius}
                      stroke="#0369a1"
                      strokeWidth="6"
                      fill="transparent"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                    />
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8125rem', fontWeight: 800, color: '#0369a1' }}>
                    {progressPercent}%
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '1rem', paddingTop: '0.85rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('LEARN')}
                  style={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    minHeight: '44px',
                    padding: '0.55rem 1.15rem',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: 800,
                    color: '#0369a1',
                    cursor: 'pointer',
                  }}
                >
                  {t.openLessons}
                </button>
              </div>
            </div>

            {/* Assessment Quick Launcher */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '1.25rem',
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 4px rgba(15, 23, 42, 0.05)',
              }}
            >
              <div style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {t.certificationExam}
              </div>
              <h3 style={{ fontSize: '1.05rem', margin: '0.35rem 0 0.35rem 0', color: '#0f172a', fontWeight: 700, lineHeight: 1.4 }}>
                {assessment.title}
              </h3>
              <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: '0 0 0.95rem 0', lineHeight: 1.5 }}>
                {t.examDesc}
              </p>
              <button
                type="button"
                onClick={() => {
                  setIsAssessmentOpen(true);
                  setQuizResult(null);
                }}
                style={{
                  width: '100%',
                  minHeight: '46px',
                  backgroundColor: '#15803d',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.65rem 1rem',
                  borderRadius: '8px',
                  fontSize: '0.925rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(21, 128, 61, 0.25)',
                }}
              >
                {t.launchExam}
              </button>
            </div>

            {/* Oral Viva Assessment Card (Voice AI Player) */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '1.25rem',
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 4px rgba(15, 23, 42, 0.05)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ fontSize: '0.8125rem', color: '#0369a1', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {t.oralVivaTitle}
                </div>
                {oralAssessmentResult?.passed && (
                  <span
                    style={{
                      fontSize: '0.8125rem',
                      fontWeight: 800,
                      backgroundColor: '#dcfce7',
                      color: '#15803d',
                      padding: '0.25rem 0.65rem',
                      borderRadius: '6px',
                    }}
                  >
                    {t.oralVivaPassed} ({oralAssessmentResult.percentage}%)
                  </span>
                )}
              </div>
              <h3 style={{ fontSize: '1.05rem', margin: '0.35rem 0 0.35rem 0', color: '#0f172a', fontWeight: 700, lineHeight: 1.4 }}>
                {SEED_ORAL_ASSESSMENT.title}
              </h3>
              <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: '0 0 0.95rem 0', lineHeight: 1.5 }}>
                {t.oralVivaDesc}
              </p>
              <button
                type="button"
                onClick={() => setIsOralAssessmentOpen(true)}
                style={{
                  width: '100%',
                  minHeight: '46px',
                  backgroundColor: '#0369a1',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.65rem 1rem',
                  borderRadius: '8px',
                  fontSize: '0.925rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 1px 3px rgba(3, 105, 161, 0.25)',
                }}
              >
                <span style={{ fontSize: '1.15rem' }}>🎙️</span>
                <span>{t.launchOralViva}</span>
              </button>
            </div>

            {/* National Scheme Advisory Card */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '1.25rem',
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 4px rgba(15, 23, 42, 0.05)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span
                  style={{
                    fontSize: '0.8125rem',
                    color: '#0369a1',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  Central Scheme Engine
                </span>
                <span style={{ fontSize: '1.25rem' }}>📊</span>
              </div>
              <h3 style={{ fontSize: '1.05rem', margin: '0.35rem 0 0.35rem 0', color: '#0f172a', fontWeight: 700, lineHeight: 1.4 }}>
                {t.schemeCardTitle}
              </h3>
              <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: '0 0 0.95rem 0', lineHeight: 1.55 }}>
                {t.schemeCardSub}
              </p>
              <button
                type="button"
                onClick={() => setIsSchemeModalOpen(true)}
                style={{
                  width: '100%',
                  minHeight: '46px',
                  backgroundColor: '#0369a1',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.65rem 1rem',
                  borderRadius: '8px',
                  fontSize: '0.925rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 1px 3px rgba(3, 105, 161, 0.25)',
                }}
              >
                <span>{t.openSchemeCalcBtn}</span>
              </button>
            </div>

            {/* Member Grievance Redressal Card */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '1.25rem',
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 4px rgba(15, 23, 42, 0.05)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span
                  style={{
                    fontSize: '0.8125rem',
                    color: '#b91c1c',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  MSCS Act 2023 Redressal
                </span>
                <span style={{ fontSize: '1.25rem' }}>⚖️</span>
              </div>
              <h3 style={{ fontSize: '1.05rem', margin: '0.35rem 0 0.35rem 0', color: '#0f172a', fontWeight: 700, lineHeight: 1.4 }}>
                {t.grievanceCardTitle}
              </h3>
              <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: '0 0 0.95rem 0', lineHeight: 1.55 }}>
                {t.grievanceCardSub}
              </p>
              <button
                type="button"
                onClick={() => setIsGrievanceModalOpen(true)}
                style={{
                  width: '100%',
                  minHeight: '46px',
                  backgroundColor: '#b91c1c',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.65rem 1rem',
                  borderRadius: '8px',
                  fontSize: '0.925rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 1px 3px rgba(185, 28, 28, 0.25)',
                }}
              >
                <span>{t.openGrievanceBtn}</span>
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
                borderRadius: '12px',
                padding: '1.25rem',
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 4px rgba(15, 23, 42, 0.05)',
              }}
            >
              <span
                style={{
                  fontSize: '0.8125rem',
                  backgroundColor: '#e0f2fe',
                  color: '#0369a1',
                  padding: '0.3rem 0.65rem',
                  borderRadius: '6px',
                  fontWeight: 800,
                  display: 'inline-block',
                }}
              >
                {t.manifestReady}
              </span>
              <h2 style={{ fontSize: '1.15rem', margin: '0.5rem 0 0.35rem 0', color: '#0f172a', fontWeight: 800 }}>
                {SEED_COURSE.title}
              </h2>
              <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                {t.courseMeta}
              </p>
            </div>

            {/* Interactive PACS Operations Lab & Balancing Simulator Card */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '1.25rem',
                border: '2px solid #0284c7',
                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.08)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.65rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span
                  style={{
                    fontSize: '0.8125rem',
                    fontWeight: 800,
                    backgroundColor: '#e0f2fe',
                    color: '#0369a1',
                    padding: '0.25rem 0.65rem',
                    borderRadius: '6px',
                    textTransform: 'uppercase',
                  }}
                >
                  {t.pacsLabBadge}
                </span>
                <span style={{ fontSize: '1.25rem' }}>🏛️</span>
              </div>

              <h3 style={{ fontSize: '1.1rem', margin: 0, color: '#0f172a', fontWeight: 800, lineHeight: 1.4 }}>
                {t.pacsLabTitle}
              </h3>

              <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: 0, lineHeight: 1.55 }}>
                {t.pacsLabDesc}
              </p>

              <button
                type="button"
                onClick={() => setIsPacsLabOpen(true)}
                style={{
                  minHeight: '44px',
                  backgroundColor: '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.65rem 1.25rem',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  marginTop: '0.35rem',
                }}
              >
                <span>{t.launchPacsLabBtn}</span>
              </button>
            </div>

            <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {t.moduleTitle}
            </div>

            {lessons.map((lesson, idx) => {
              const isDone = completedLessonIds.includes(lesson.id);
              const detail = offlineStore.getLessonDetail(lesson.id);

              return (
                <div
                  key={lesson.id}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    border: isDone ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
                    boxShadow: '0 1px 4px rgba(15, 23, 42, 0.05)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: 700 }}>
                      Lesson {idx + 1}
                    </span>
                    <span
                      style={{
                        fontSize: '0.8125rem',
                        fontWeight: 800,
                        backgroundColor: isDone ? '#dcfce7' : '#f1f5f9',
                        color: isDone ? '#15803d' : '#64748b',
                        padding: '0.25rem 0.55rem',
                        borderRadius: '6px',
                      }}
                    >
                      {isDone ? t.completedBadge : t.availableOffline}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.05rem', margin: '0.45rem 0 0.35rem 0', color: '#0f172a', fontWeight: 700, lineHeight: 1.4 }}>
                    {lesson.title}
                  </h3>
                  <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: '0 0 0.95rem 0', lineHeight: 1.5 }}>
                    {t.lessonFormat}: {lesson.type} • {t.localAsset}: <code>{lesson.localAssetRef}</code>
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      if (detail) {
                        setActiveLesson(detail);
                      }
                    }}
                    style={{
                      minHeight: '44px',
                      backgroundColor: '#0369a1',
                      color: '#ffffff',
                      border: 'none',
                      padding: '0.55rem 1.15rem',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    {t.readLesson}
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
            {/* Academic Marks Tally & Gradebook Card */}
            <AcademicMarksTallyCard
              tally={marksTally}
              language={language}
              onLaunchQuiz={() => setIsAssessmentOpen(true)}
              onLaunchExam={() => setIsAssessmentOpen(true)}
              onViewCertificate={() => setShowCertModal(true)}
            />

            <div style={doubleBezelCard('navy')}>
              <h2 style={{ fontSize: '1.05rem', margin: '0 0 0.65rem 0', fontWeight: 800, color: THEME.colors.navyDeep }}>{t.overallProgress}</h2>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.45rem' }}>
                <span style={{ color: THEME.colors.inkBody }}>{t.completionStatus}</span>
                <span style={{ fontWeight: 800, color: THEME.colors.navyPrimary }}>{progressPercent}%</span>
              </div>
              <div style={{ width: '100%', height: '10px', backgroundColor: '#e2e8f0', borderRadius: '5px', overflow: 'hidden' }}>
                <div style={{ width: `${progressPercent}%`, height: '100%', backgroundColor: THEME.colors.navyPrimary, transition: 'width 0.4s ease' }} />
              </div>
            </div>

            <div style={doubleBezelCard('neutral')}>
              <h3 style={{ fontSize: '1rem', margin: '0 0 0.65rem 0', fontWeight: 800, color: THEME.colors.navyDeep }}>{t.completedModules}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {lessons.map((lesson) => {
                  const done = completedLessonIds.includes(lesson.id);
                  return (
                    <div
                      key={lesson.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.65rem 0.85rem',
                        backgroundColor: done ? '#f0fdf4' : '#f8fafc',
                        borderRadius: '8px',
                        border: done ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
                        fontSize: '0.875rem',
                        gap: '0.5rem',
                      }}
                    >
                      <span style={{ color: done ? '#15803d' : '#475569', fontWeight: 600 }}>{lesson.title}</span>
                      <span style={{ fontWeight: 800, color: done ? '#15803d' : '#94a3b8', fontSize: '0.8125rem' }}>
                        {done ? t.doneBadge : t.pendingBadge}
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
                borderRadius: '12px',
                padding: '1.25rem',
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 4px rgba(15, 23, 42, 0.05)',
              }}
            >
              <h3 style={{ fontSize: '1rem', margin: '0 0 0.65rem 0', fontWeight: 800 }}>{t.evalLog}</h3>
              {attempts.length === 0 ? (
                <div style={{ fontSize: '0.875rem', color: '#64748b', fontStyle: 'italic', lineHeight: 1.5 }}>
                  {t.noExamAttempts}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {attempts.map((att, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '0.75rem 1rem',
                        borderRadius: '8px',
                        backgroundColor: att.passed ? '#f0fdf4' : '#fef2f2',
                        border: att.passed ? '1px solid #bbf7d0' : '1px solid #fecaca',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '0.5rem',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#0f172a' }}>
                          {t.attempt} #{idx + 1} • {att.score}%
                        </div>
                        <div style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '0.2rem' }}>
                          {att.correctCount}/{att.totalQuestions} {t.questionsCorrect}
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: '0.8125rem',
                          fontWeight: 800,
                          color: att.passed ? '#15803d' : '#b91c1c',
                        }}
                      >
                        {att.passed ? t.passedStatus : t.retakeStatus}
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
            {/* Sovereign NFC Credential Card */}
            <SovereignNfcProfileCard
              profile={nfcProfile}
              language={language}
              onToggleEnabled={async (en) => {
                setNfcProfile((prev) => (prev ? { ...prev, enabled: en } : null));
              }}
              onRotateCode={async () => {
                const newCode = 'NFC-' + Math.random().toString(36).substring(2, 10).toUpperCase();
                setNfcProfile((prev) =>
                  prev
                    ? {
                        ...prev,
                        publicProfileCode: newCode,
                        publicUrl: `/?profile=${newCode}`,
                      }
                    : null
                );
              }}
              onPreviewPublicUrl={(url) => {
                if (typeof window !== 'undefined') {
                  window.open(url, '_blank');
                }
              }}
            />

            <div style={doubleBezelCard('navy')}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: THEME.colors.emerald }}>
                  ✓ ED25519 CRYPTOGRAPHICALLY SIGNED
                </span>
                <span style={{ fontSize: '0.8125rem', color: THEME.colors.navyPrimary, fontWeight: 700 }}>NCCT Official</span>
              </div>

              <h2 style={{ fontSize: '1.15rem', margin: '0.5rem 0 0.35rem 0', color: THEME.colors.navyDeep, fontWeight: 800, lineHeight: 1.4 }}>
                Certificate of Competency in PACS Ledgering & Governance
              </h2>
              <div style={{ fontSize: '0.875rem', color: THEME.colors.inkBody }}>
                {t.awardedTo}: <strong style={{ color: THEME.colors.navyDeep }}>{trainee.name}</strong>
              </div>
              <div style={{ fontSize: '0.8125rem', color: THEME.colors.inkMuted, marginTop: '0.25rem' }}>
                {t.credentialId}: <code style={{ fontFamily: 'monospace', fontWeight: 700 }}>cred-pacs-2026-0814</code>
              </div>

              <div
                style={{
                  marginTop: '1.15rem',
                  padding: '1.25rem',
                  backgroundColor: THEME.colors.creamWarm,
                  borderRadius: '4px',
                  border: `1px dashed ${THEME.colors.borderInner}`,
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    width: '110px',
                    height: '110px',
                    margin: '0 auto',
                    backgroundColor: '#e0f2fe',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                    color: THEME.colors.navyPrimary,
                    fontWeight: 800,
                    border: `1px solid ${THEME.colors.borderOuter}`,
                  }}
                >
                  {t.qrVerified}
                </div>
                <div style={{ fontSize: '0.8125rem', color: THEME.colors.inkMuted, marginTop: '0.65rem', lineHeight: 1.5 }}>
                  {t.verifyQr}
                </div>
              </div>

              <div
                style={{
                  marginTop: '1.15rem',
                  paddingTop: '0.85rem',
                  borderTop: `1px solid ${THEME.colors.borderInner}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.8125rem',
                  color: THEME.colors.inkMuted,
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                }}
              >
                <span>{t.issuer}: {t.issuerValue}</span>
                <span>{t.algorithm}: {t.algorithmValue}</span>
              </div>

              <button
                type="button"
                onClick={() => setShowCertModal(true)}
                style={{
                  width: '100%',
                  minHeight: '46px',
                  backgroundColor: THEME.colors.navyDeep,
                  color: '#ffffff',
                  border: `1px solid ${THEME.colors.goldCoop}`,
                  padding: '0.65rem 1rem',
                  borderRadius: '4px',
                  fontSize: '0.925rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  marginTop: '1rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 2px 4px rgba(8, 24, 84, 0.2)',
                }}
              >
                <span style={{ fontSize: '1.15rem' }}>🖨️</span>
                <span>{t.viewCertificateBtn}</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 5: OPPORTUNITIES
        ======================================================== */}
        {activeTab === 'OPPORTUNITIES' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Sahakar Mitra AI Counselor Spotlight Card */}
            <div
              style={{
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '12px',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.65rem',
                boxShadow: '0 1px 4px rgba(2, 132, 199, 0.08)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>🤖</span>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#1e40af' }}>
                      {t.counselorCardTitle}
                    </h3>
                    <div style={{ fontSize: '0.8125rem', color: '#0369a1', fontWeight: 700 }}>
                      ● Online & Offline Advisory
                    </div>
                  </div>
                </div>
                <span style={{ fontSize: '0.8125rem', backgroundColor: '#dcfce7', color: '#15803d', padding: '0.25rem 0.65rem', borderRadius: '12px', fontWeight: 800 }}>
                  Active
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#1e3a8a', lineHeight: 1.55 }}>
                {t.counselorCardSub}
              </p>
              <button
                type="button"
                onClick={() => setIsCounselorOpen(true)}
                style={{
                  alignSelf: 'flex-start',
                  backgroundColor: '#0369a1',
                  color: '#ffffff',
                  border: 'none',
                  minHeight: '44px',
                  padding: '0.55rem 1.15rem',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                }}
              >
                <span>💬</span>
                <span>{t.openCounselorBtn}</span>
              </button>
            </div>

            {/* ========================================================
                DIGITAL OFFER LETTER SECTION (Ed25519 Cryptographic Verification)
            ======================================================== */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '2px solid #0369a1',
                boxShadow: '0 4px 12px rgba(3, 105, 161, 0.08)',
                overflow: 'hidden',
              }}
            >
              {/* National Tricolor Top Bar */}
              <div style={{ display: 'flex', height: '4px', width: '100%' }}>
                <div style={{ flex: 1, backgroundColor: '#ea580c' }} />
                <div style={{ flex: 1, backgroundColor: '#ffffff' }} />
                <div style={{ flex: 1, backgroundColor: '#16a34a' }} />
              </div>

              <div style={{ padding: '1.25rem' }}>
                {/* Header row with status badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.35rem' }}>📜</span>
                    <div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                        {t.offerSectionTitle}
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                        {t.offerSectionSub}
                      </div>
                    </div>
                  </div>

                  <span
                    style={{
                      padding: '0.3rem 0.75rem',
                      borderRadius: '16px',
                      fontSize: '0.8125rem',
                      fontWeight: 800,
                      backgroundColor:
                        receivedOffer.status === 'ACCEPTED'
                          ? '#dcfce7'
                          : receivedOffer.status === 'DECLINED'
                          ? '#f1f5f9'
                          : '#fef3c7',
                      color:
                        receivedOffer.status === 'ACCEPTED'
                          ? '#15803d'
                          : receivedOffer.status === 'DECLINED'
                          ? '#64748b'
                          : '#b45309',
                      border: `1px solid ${
                        receivedOffer.status === 'ACCEPTED'
                          ? '#86efac'
                          : receivedOffer.status === 'DECLINED'
                          ? '#cbd5e1'
                          : '#fcd34d'
                      }`,
                    }}
                  >
                    {receivedOffer.status === 'ACCEPTED'
                      ? t.offerStatusAccepted
                      : receivedOffer.status === 'DECLINED'
                      ? t.offerStatusDeclined
                      : t.offerStatusPending}
                  </span>
                </div>

                {/* Feedback Notice */}
                {offerFeedbackNotice && (
                  <div
                    style={{
                      marginTop: '0.85rem',
                      padding: '0.75rem 1rem',
                      borderRadius: '8px',
                      backgroundColor: receivedOffer.status === 'ACCEPTED' ? '#f0fdf4' : '#f8fafc',
                      border: `1px solid ${receivedOffer.status === 'ACCEPTED' ? '#86efac' : '#cbd5e1'}`,
                      fontSize: '0.875rem',
                      color: receivedOffer.status === 'ACCEPTED' ? '#15803d' : '#334155',
                      fontWeight: 700,
                    }}
                  >
                    {offerFeedbackNotice}
                  </div>
                )}

                {/* Employer & Role Summary */}
                <div style={{ marginTop: '1rem', paddingBottom: '0.85rem', borderBottom: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.35 }}>
                    {receivedOffer.payload.designation}
                  </div>
                  <div style={{ fontSize: '0.925rem', color: '#0369a1', fontWeight: 700, marginTop: '0.2rem' }}>
                    {receivedOffer.payload.employer.name}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '0.25rem' }}>
                    {t.offerSignatoryLabel}: <strong>{receivedOffer.payload.employer.authorizedSignatory}</strong>
                  </div>
                </div>

                {/* Compensation & Location Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '0.75rem',
                    marginTop: '0.85rem',
                    backgroundColor: '#f8fafc',
                    padding: '0.85rem',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: 700, display: 'block' }}>
                      {t.offerCtcLabel}
                    </span>
                    <strong style={{ fontSize: '1.05rem', color: '#15803d' }}>
                      ₹{receivedOffer.payload.annualCompensationLPA} Lakhs / Annum
                    </strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: 700, display: 'block' }}>
                      {t.offerSalaryLabel}
                    </span>
                    <strong style={{ fontSize: '1.05rem', color: '#0369a1' }}>
                      ₹{receivedOffer.payload.monthlyStipendOrSalary.toLocaleString()} / month
                    </strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: 700, display: 'block' }}>
                      {t.offerLocationLabel}
                    </span>
                    <strong style={{ fontSize: '0.875rem', color: '#0f172a' }}>
                      {receivedOffer.payload.postingLocation}
                    </strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: 700, display: 'block' }}>
                      {t.offerJoiningDateLabel}
                    </span>
                    <strong style={{ fontSize: '0.875rem', color: '#0f172a' }}>
                      {receivedOffer.payload.joiningDate}
                    </strong>
                  </div>
                </div>

                {/* Terms & Conditions */}
                <div style={{ marginTop: '0.85rem' }}>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.35rem' }}>
                    {t.offerTermsLabel}:
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.8125rem', color: '#475569', lineHeight: 1.55 }}>
                    {receivedOffer.payload.terms.map((term, i) => (
                      <li key={i}>{term}</li>
                    ))}
                  </ul>
                </div>

                {/* Ed25519 Cryptographic Verification Badge */}
                <div
                  style={{
                    marginTop: '1rem',
                    padding: '0.75rem',
                    backgroundColor: '#f0fdf4',
                    borderRadius: '8px',
                    border: '1px solid #86efac',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8125rem', fontWeight: 800, color: '#15803d' }}>
                      <span>🛡️</span>
                      <span>{t.offerCryptoVerifiedBadge}</span>
                    </div>
                    <span style={{ fontSize: '0.8125rem', color: '#64748b', fontFamily: 'monospace' }}>
                      Key: {receivedOffer.issuerKeyId}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#475569', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                    <strong>Sig:</strong> {receivedOffer.signatureHex.slice(0, 48)}...
                  </div>
                </div>

                {/* Action Buttons (minHeight >= 46px) */}
                <div
                  style={{
                    marginTop: '1.15rem',
                    display: 'flex',
                    gap: '0.75rem',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setShowOfferModal(true)}
                    style={{
                      minHeight: '46px',
                      padding: '0.65rem 1.15rem',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      fontWeight: 700,
                      backgroundColor: '#ffffff',
                      border: '1px solid #cbd5e1',
                      color: '#0369a1',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    <span>📄</span>
                    <span>{t.offerFullLetterBtn}</span>
                  </button>

                  {receivedOffer.status === 'ISSUED' && (
                    <>
                      <button
                        type="button"
                        onClick={handleDeclineOffer}
                        style={{
                          minHeight: '46px',
                          padding: '0.65rem 1.15rem',
                          borderRadius: '8px',
                          fontSize: '0.875rem',
                          fontWeight: 700,
                          backgroundColor: '#fee2e2',
                          border: '1px solid #fecaca',
                          color: '#991b1b',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                        }}
                      >
                        <span>✕</span>
                        <span>{t.offerDeclineBtn}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleAcceptOffer}
                        style={{
                          minHeight: '46px',
                          padding: '0.65rem 1.45rem',
                          borderRadius: '8px',
                          fontSize: '0.925rem',
                          fontWeight: 800,
                          backgroundColor: '#15803d',
                          color: '#ffffff',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.45rem',
                          boxShadow: '0 2px 4px rgba(21, 128, 61, 0.25)',
                        }}
                      >
                        <span>✓</span>
                        <span>{t.offerAcceptBtn}</span>
                      </button>
                    </>
                  )}

                  {receivedOffer.status === 'ACCEPTED' && (
                    <span
                      style={{
                        fontSize: '0.875rem',
                        fontWeight: 800,
                        color: '#15803d',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      <span>✓</span>
                      <span>{t.offerPlacedStatusNotice}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div style={{ fontSize: '0.875rem', color: '#475569', fontWeight: 600 }}>
              {t.oppsHeader}
            </div>

            {SEED_JOB_OPPORTUNITIES.map((job) => (
              <div
                key={job.id}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 1px 4px rgba(15, 23, 42, 0.05)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', margin: 0, color: '#0f172a', fontWeight: 700, lineHeight: 1.35 }}>
                      {job.title}
                    </h3>
                    <div style={{ fontSize: '0.875rem', color: '#0369a1', fontWeight: 700, marginTop: '0.2rem' }}>
                      {job.employerName}
                    </div>
                  </div>
                  <span style={{ fontSize: '0.8125rem', backgroundColor: '#dcfce7', color: '#15803d', padding: '0.25rem 0.55rem', borderRadius: '6px', fontWeight: 800, flexShrink: 0 }}>
                    {t.matchBadge}
                  </span>
                </div>
                <p style={{ fontSize: '0.8125rem', color: '#475569', margin: '0.65rem 0 0.95rem 0', lineHeight: 1.55 }}>
                  {job.description}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <span style={{ color: '#64748b' }}><strong>{t.locationLabel}:</strong> {job.location}</span>
                  <button
                    type="button"
                    onClick={() => alert(`${t.appSubmittedAlert} ${job.title}!`)}
                    style={{
                      minHeight: '44px',
                      backgroundColor: '#0369a1',
                      color: '#ffffff',
                      border: 'none',
                      padding: '0.55rem 1.15rem',
                      borderRadius: '8px',
                      fontWeight: 800,
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                    }}
                  >
                    {t.applyBtn}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ========================================================
            TAB 6: PROFILE
        ======================================================== */}
        {activeTab === 'PROFILE' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Campus Hostel Accommodation (Strictly Private) */}
            <HostelRoomCard language={language} />

            {/* Sovereign NFC Profile Controls */}
            <SovereignNfcProfileCard
              profile={nfcProfile}
              language={language}
              onToggleEnabled={async (en) => {
                setNfcProfile((prev) => (prev ? { ...prev, enabled: en } : null));
              }}
              onRotateCode={async () => {
                const newCode = 'NFC-' + Math.random().toString(36).substring(2, 10).toUpperCase();
                setNfcProfile((prev) =>
                  prev
                    ? {
                        ...prev,
                        publicProfileCode: newCode,
                        publicUrl: `/?profile=${newCode}`,
                      }
                    : null
                );
              }}
              onPreviewPublicUrl={(url) => {
                if (typeof window !== 'undefined') {
                  window.open(url, '_blank');
                }
              }}
            />

            <div style={doubleBezelCard('neutral')}>
              <h2 style={{ fontSize: '1.15rem', margin: '0 0 1.15rem 0', fontWeight: 800, color: THEME.colors.navyDeep }}>{t.profileTitle}</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
                <div>
                  <span style={{ color: THEME.colors.inkMuted }}>{t.fullNameLabel}: </span>
                  <strong style={{ color: THEME.colors.navyDeep }}>{trainee.name}</strong>
                </div>
                <div>
                  <span style={{ color: THEME.colors.inkMuted }}>{t.contactLabel}: </span>
                  <strong style={{ color: THEME.colors.navyDeep }}>{trainee.emailOrPhone}</strong>
                </div>
                <div>
                  <span style={{ color: THEME.colors.inkMuted }}>{t.instituteLabel}: </span>
                  <strong style={{ color: THEME.colors.navyDeep }}>{t.instituteValue}</strong>
                </div>
                <div>
                  <span style={{ color: THEME.colors.inkMuted }}>{t.prefLangLabel}: </span>
                  <strong style={{ color: THEME.colors.navyDeep }}>{language === 'HI' ? 'हिन्दी (Hindi)' : 'English'}</strong>
                </div>
                <div>
                  <span style={{ color: THEME.colors.inkMuted }}>{t.nodeConnLabel}: </span>
                  <strong style={{ color: THEME.colors.emerald }}>sahakar.local (192.168.4.1)</strong>
                </div>
              </div>

              <div style={{ marginTop: '1.75rem', paddingTop: '1.15rem', borderTop: `1px solid ${THEME.colors.borderInner}`, display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleSimulateSync}
                  disabled={isSyncing}
                  style={{
                    flex: 1,
                    minWidth: '160px',
                    minHeight: '46px',
                    backgroundColor: isSyncing ? '#94a3b8' : THEME.colors.navyPrimary,
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.65rem 1rem',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                    fontWeight: 800,
                    cursor: isSyncing ? 'wait' : 'pointer',
                  }}
                >
                  {isSyncing ? t.syncingBtn : t.triggerSyncBtn}
                </button>
                <button
                  type="button"
                  onClick={handleResetData}
                  style={{
                    minHeight: '46px',
                    backgroundColor: '#fee2e2',
                    color: '#991b1b',
                    border: '1px solid #fecaca',
                    padding: '0.65rem 1.15rem',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  {t.resetDemoBtn}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================
          MODAL: Clean Professional Optical QR Scanner (No Neon Laser)
      ======================================================== */}
      {isQrScannerOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.94)',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '1.5rem 1.25rem',
            color: '#ffffff',
          }}
        >
          {/* Top Bar with Accessible Close Target */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.8125rem', color: '#38bdf8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                OPTICAL SENSOR VIEW
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff' }}>{t.qrScannerTitle}</div>
            </div>
            <button
              type="button"
              onClick={() => setIsQrScannerOpen(false)}
              style={{
                width: '44px',
                height: '44px',
                minWidth: '44px',
                minHeight: '44px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                border: 'none',
                color: '#ffffff',
                fontSize: '1.4rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Close scanner"
              aria-label="Close scanner"
            >
              ×
            </button>
          </div>

          {/* Center Viewfinder with Clean Optical Framing Reticle */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
            <div
              style={{
                width: '270px',
                height: '270px',
                borderRadius: '16px',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                position: 'relative',
                overflow: 'hidden',
                backgroundColor: '#000000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
              }}
            >
              {/* WebRTC Live Camera Stream */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: cameraActive ? 'block' : 'none',
                }}
              />

              {/* Hardware Camera Fallback */}
              {!cameraActive && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', zIndex: 1, padding: '0 1rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '3rem', opacity: 0.8 }}>📷</div>
                  <span style={{ fontSize: '0.8125rem', color: '#cbd5e1', lineHeight: 1.4 }}>
                    {cameraError || 'Live Optical Capture Aperture Active'}
                  </span>
                </div>
              )}

              {/* High-Contrast Precision Corner Reticles */}
              <div style={{ position: 'absolute', top: '10px', left: '10px', width: '24px', height: '24px', borderTop: '3px solid #ffffff', borderLeft: '3px solid #ffffff', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', top: '10px', right: '10px', width: '24px', height: '24px', borderTop: '3px solid #ffffff', borderRight: '3px solid #ffffff', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', bottom: '10px', left: '10px', width: '24px', height: '24px', borderBottom: '3px solid #ffffff', borderLeft: '3px solid #ffffff', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', bottom: '10px', right: '10px', width: '24px', height: '24px', borderBottom: '3px solid #ffffff', borderRight: '3px solid #ffffff', pointerEvents: 'none' }} />

              {/* Subtle Precision Target Reticle (No Sci-Fi Neon Glow) */}
              <div
                style={{
                  position: 'absolute',
                  width: '180px',
                  height: '180px',
                  border: '1px dashed rgba(255, 255, 255, 0.4)',
                  borderRadius: '10px',
                  pointerEvents: 'none',
                }}
              />
            </div>

            <div style={{ fontSize: '0.875rem', color: '#cbd5e1', textAlign: 'center', maxWidth: '300px', lineHeight: 1.5 }}>
              {t.qrScannerSub}
              {cameraActive && (
                <div style={{ color: '#4ade80', fontSize: '0.8125rem', marginTop: '0.35rem', fontWeight: 800 }}>
                  ● Optical Sensor Active
                </div>
              )}
            </div>

            {scanSuccessNotice && (
              <div style={{ backgroundColor: '#15803d', color: '#ffffff', padding: '0.65rem 1.25rem', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 800 }}>
                ✓ {scanSuccessNotice}
              </div>
            )}
          </div>

          {/* Bottom Trigger Button (Strict >= 44px) */}
          <div>
            <button
              type="button"
              onClick={handleSimulateQrScan}
              style={{
                width: '100%',
                minHeight: '48px',
                backgroundColor: '#0369a1',
                color: '#ffffff',
                border: 'none',
                padding: '0.85rem',
                borderRadius: '8px',
                fontSize: '0.95rem',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
              }}
            >
              {t.simulateScanBtn}
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: Clean Professional Biometric Face Verification (No Neon)
      ======================================================== */}
      {isFaceScannerOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.94)',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '1.5rem 1.25rem',
            color: '#ffffff',
          }}
        >
          {/* Top Bar with Accessible Close Target */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.8125rem', color: '#4ade80', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                AI BIOMETRIC SENSOR
              </span>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff' }}>
                {t.faceScannerTitle}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsFaceScannerOpen(false)}
              style={{
                width: '44px',
                height: '44px',
                minWidth: '44px',
                minHeight: '44px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                border: 'none',
                color: '#ffffff',
                fontSize: '1.4rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Close scanner"
              aria-label="Close scanner"
            >
              ×
            </button>
          </div>

          {/* Center Viewfinder with Biometric Oval Guide */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
            <div
              style={{
                width: '270px',
                height: '270px',
                borderRadius: '50%',
                border: '3px solid #16a34a',
                position: 'relative',
                overflow: 'hidden',
                backgroundColor: '#000000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
              }}
            >
              {/* WebRTC Live Camera Stream */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: cameraActive ? 'block' : 'none',
                }}
              />

              {/* Camera Fallback */}
              {!cameraActive && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', zIndex: 1, padding: '0 1rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '3.5rem', opacity: 0.8 }}>👤</div>
                  <span style={{ fontSize: '0.8125rem', color: '#cbd5e1', lineHeight: 1.4 }}>
                    {cameraError || 'Biometric Face Aperture Ready'}
                  </span>
                </div>
              )}

              {/* Biometric Framing Guide (Crisp Dashed Ring) */}
              <div
                style={{
                  position: 'absolute',
                  inset: '16px',
                  borderRadius: '50%',
                  border: '2px dashed rgba(255, 255, 255, 0.5)',
                  pointerEvents: 'none',
                }}
              />
            </div>

            <div style={{ fontSize: '0.875rem', color: '#cbd5e1', textAlign: 'center', maxWidth: '320px', lineHeight: 1.55 }}>
              {t.faceScannerSub}
              <div style={{ color: '#4ade80', fontSize: '0.8125rem', marginTop: '0.45rem', fontWeight: 800 }}>
                ✓ Liveness Confidence: 98.6% (Anti-Spoofing Passed)
              </div>
            </div>

            {scanSuccessNotice && (
              <div style={{ backgroundColor: '#15803d', color: '#ffffff', padding: '0.65rem 1.25rem', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 800 }}>
                ✓ {scanSuccessNotice}
              </div>
            )}
          </div>

          {/* Bottom Trigger Button (Strict >= 44px) */}
          <div>
            <button
              type="button"
              onClick={handleSimulateFaceScan}
              style={{
                width: '100%',
                minHeight: '48px',
                backgroundColor: '#15803d',
                color: '#ffffff',
                border: 'none',
                padding: '0.85rem',
                borderRadius: '8px',
                fontSize: '0.95rem',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
              }}
            >
              {t.simulateFaceBtn}
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          DRAWER: Offline Sync Queue Inspector
      ======================================================== */}
      {isQueueDrawerOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              width: '100%',
              maxWidth: '520px',
              borderTopLeftRadius: '16px',
              borderTopRightRadius: '16px',
              padding: '1.25rem',
              maxHeight: '78vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 -10px 25px rgba(0, 0, 0, 0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#0f172a', fontWeight: 800 }}>
                  {t.queueDrawerTitle}
                </h3>
                <div style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '0.15rem' }}>
                  {queuedEvents.length} {t.eventsBuffered}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsQueueDrawerOpen(false)}
                style={{
                  width: '44px',
                  height: '44px',
                  minWidth: '44px',
                  minHeight: '44px',
                  borderRadius: '50%',
                  backgroundColor: '#f1f5f9',
                  border: 'none',
                  fontSize: '1.25rem',
                  color: '#475569',
                  cursor: 'pointer',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title="Close drawer"
                aria-label="Close drawer"
              >
                ×
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1rem' }}>
              {queuedEvents.map((ev) => (
                <div
                  key={ev.id}
                  style={{
                    padding: '0.75rem 0.95rem',
                    backgroundColor: '#f8fafc',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '0.8125rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 800, color: '#0369a1', fontFamily: 'monospace' }}>
                      {ev.eventType}
                    </span>
                    <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                      {new Date(ev.occurredAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#475569', marginTop: '0.25rem', fontFamily: 'monospace' }}>
                    ID: {ev.id.slice(0, 20)}...
                  </div>
                </div>
              ))}
              {queuedEvents.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#15803d', fontSize: '0.925rem', fontWeight: 700 }}>
                  {t.allEventsSynced}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleSimulateSync}
              disabled={isSyncing || queuedEvents.length === 0}
              style={{
                backgroundColor: isSyncing || queuedEvents.length === 0 ? '#e2e8f0' : '#0369a1',
                color: isSyncing || queuedEvents.length === 0 ? '#94a3b8' : '#ffffff',
                border: 'none',
                minHeight: '48px',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                fontSize: '0.925rem',
                fontWeight: 800,
                cursor: isSyncing || queuedEvents.length === 0 ? 'default' : 'pointer',
              }}
            >
              {isSyncing
                ? '⏳ Syncing Batch with Server...'
                : queuedEvents.length === 0
                ? t.journalUpToDate
                : t.pushSyncNow}
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: Lesson Content Reader
      ======================================================== */}
      {activeLesson && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              maxWidth: '520px',
              width: '100%',
              maxHeight: '84vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
            }}
          >
            <div style={{ padding: '1rem 1.15rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.65rem' }}>
              <div>
                <span style={{ fontSize: '0.8125rem', color: '#0369a1', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {t.lessonReaderTitle}
                </span>
                <h3 style={{ margin: '0.2rem 0 0 0', fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                  {activeLesson.title}
                </h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={() => {
                    if (isLessonAudioPlaying) {
                      speechService.stop();
                      setIsLessonAudioPlaying(false);
                    } else {
                      speechService.speak(activeLesson.fullContentMarkdown, language, (playing) => {
                        setIsLessonAudioPlaying(playing);
                      });
                    }
                  }}
                  style={{
                    backgroundColor: isLessonAudioPlaying ? '#ea580c' : '#e0f2fe',
                    color: isLessonAudioPlaying ? '#ffffff' : '#0369a1',
                    border: '1px solid #bae6fd',
                    minHeight: '44px',
                    padding: '0.45rem 0.85rem',
                    borderRadius: '8px',
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <span>{isLessonAudioPlaying ? t.stopNarration : t.listenNarration}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    speechService.stop();
                    setIsLessonAudioPlaying(false);
                    setActiveLesson(null);
                  }}
                  style={{
                    width: '44px',
                    height: '44px',
                    minWidth: '44px',
                    minHeight: '44px',
                    borderRadius: '50%',
                    backgroundColor: '#f1f5f9',
                    border: 'none',
                    fontSize: '1.25rem',
                    color: '#64748b',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title="Close lesson reader"
                  aria-label="Close lesson reader"
                >
                  ×
                </button>
              </div>
            </div>

            <div style={{ padding: '1.25rem', overflowY: 'auto', flex: 1, fontSize: '0.9375rem', lineHeight: 1.65, color: '#334155' }}>
              {activeLesson.fullContentMarkdown}
            </div>

            <div style={{ padding: '0.85rem 1.15rem', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => handleCompleteLesson(activeLesson.id)}
                style={{
                  flex: 1,
                  minHeight: '46px',
                  backgroundColor: '#15803d',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.65rem 1rem',
                  borderRadius: '8px',
                  fontSize: '0.925rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(21, 128, 61, 0.25)',
                }}
              >
                {t.markLessonComplete}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: Offline Assessment Examination
      ======================================================== */}
      {isAssessmentOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              maxWidth: '520px',
              width: '100%',
              maxHeight: '88vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
            }}
          >
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>{assessment.title}</h3>
              <button
                type="button"
                onClick={() => setIsAssessmentOpen(false)}
                style={{
                  width: '44px',
                  height: '44px',
                  minWidth: '44px',
                  minHeight: '44px',
                  borderRadius: '50%',
                  backgroundColor: '#f1f5f9',
                  border: 'none',
                  fontSize: '1.25rem',
                  color: '#64748b',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title="Close exam"
                aria-label="Close exam"
              >
                ×
              </button>
            </div>

            <div style={{ padding: '1.25rem', overflowY: 'auto', flex: 1 }}>
              {quizResult ? (
                <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                  <div
                    style={{
                      width: '68px',
                      height: '68px',
                      borderRadius: '50%',
                      margin: '0 auto 1rem auto',
                      backgroundColor: quizResult.passed ? '#dcfce7' : '#fee2e2',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '2rem',
                    }}
                  >
                    {quizResult.passed ? '✓' : '✗'}
                  </div>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.3rem', color: quizResult.passed ? '#15803d' : '#b91c1c', fontWeight: 800 }}>
                    {quizResult.passed ? 'Assessment Passed!' : 'Assessment Not Passed'}
                  </h3>
                  <div style={{ fontSize: '1.6rem', fontWeight: 900, margin: '0.5rem 0', color: '#0f172a' }}>
                    {quizResult.score}%
                  </div>
                  <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.5 }}>
                    You answered {quizResult.correctCount} of {quizResult.total} questions correctly.
                  </p>
                  {quizResult.passed && (
                    <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '0.85rem', borderRadius: '8px', fontSize: '0.875rem', color: '#15803d', fontWeight: 800, marginTop: '1rem', lineHeight: 1.4 }}>
                      ✓ Eligible for NCCT Ed25519 Tamper-Proof Digital Credential!
                    </div>
                  )}
                </div>
              ) : (
                <form id="quiz-form" onSubmit={handleQuizSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                  {questions.map((q, qIdx) => (
                    <div key={q.id} style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.925rem', fontWeight: 800, marginBottom: '0.65rem', color: '#0f172a', lineHeight: 1.5 }}>
                        {qIdx + 1}. {q.prompt}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {q.options.map((opt, optIdx) => (
                          <label
                            key={optIdx}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.65rem',
                              fontSize: '0.875rem',
                              cursor: 'pointer',
                              minHeight: '44px',
                              padding: '0.4rem 0.65rem',
                              borderRadius: '6px',
                              backgroundColor: quizAnswers[q.id] === optIdx ? '#e0f2fe' : 'transparent',
                            }}
                          >
                            <input
                              type="radio"
                              name={`question-${q.id}`}
                              checked={quizAnswers[q.id] === optIdx}
                              onChange={() => setQuizAnswers({ ...quizAnswers, [q.id]: optIdx })}
                              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                            />
                            <span style={{ color: '#1e293b', lineHeight: 1.4 }}>{opt}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </form>
              )}
            </div>

            <div style={{ padding: '0.85rem 1.25rem', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '0.65rem' }}>
              {quizResult ? (
                <button
                  type="button"
                  onClick={() => setIsAssessmentOpen(false)}
                  style={{
                    flex: 1,
                    minHeight: '46px',
                    backgroundColor: '#0369a1',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.65rem 1rem',
                    borderRadius: '8px',
                    fontSize: '0.925rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  {t.examReturnBtn}
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setIsAssessmentOpen(false)}
                    style={{
                      flex: 1,
                      minHeight: '46px',
                      backgroundColor: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      color: '#475569',
                      padding: '0.65rem 1rem',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    form="quiz-form"
                    style={{
                      flex: 2,
                      minHeight: '46px',
                      backgroundColor: '#15803d',
                      color: '#ffffff',
                      border: 'none',
                      padding: '0.65rem 1rem',
                      borderRadius: '8px',
                      fontSize: '0.925rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      boxShadow: '0 1px 3px rgba(21, 128, 61, 0.25)',
                    }}
                  >
                    {t.examSubmitBtn}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Oral Assessment Modal (Voice AI Player) */}
      <OralAssessmentModal
        isOpen={isOralAssessmentOpen}
        onClose={() => {
          setIsOralAssessmentOpen(false);
          refreshState();
        }}
        traineeId={trainee.id}
        initialLanguage={language}
        onSubmitted={() => {
          refreshState();
        }}
        onOpenLesson={(lessonId) => {
          setIsOralAssessmentOpen(false);
          const detail = offlineStore.getLessonDetail(lessonId);
          if (detail) {
            setActiveLesson(detail);
          }
        }}
        onOpenPacsLab={() => {
          setIsOralAssessmentOpen(false);
          setIsPacsLabOpen(true);
        }}
      />

      {/* Floating Action Button for Sahakar Mitra AI (Repositioned to bottom: 88px, right: 16px to prevent bottom nav overlap) */}
      <button
        type="button"
        onClick={() => setIsCounselorOpen(true)}
        style={{
          position: 'fixed',
          bottom: '88px',
          right: '16px',
          backgroundColor: '#0369a1',
          color: '#ffffff',
          border: 'none',
          borderRadius: '28px',
          minHeight: '48px',
          padding: '0.65rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          boxShadow: '0 4px 16px rgba(3, 105, 161, 0.35)',
          fontSize: '0.875rem',
          fontWeight: 800,
          cursor: 'pointer',
          zIndex: 80,
          transition: 'transform 0.15s ease',
        }}
        aria-label="Open Sahakar Mitra AI counselor"
      >
        <span style={{ fontSize: '1.25rem' }}>🤖</span>
        <span>{t.counselorBtn}</span>
      </button>

      {/* ========================================================
          DRAWER / MODAL: Sahakar Mitra AI Career Counselor Sheet
      ======================================================== */}
      {isCounselorOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            zIndex: 110,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            backdropFilter: 'blur(2px)',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              width: '100%',
              maxWidth: '520px',
              borderTopLeftRadius: '16px',
              borderTopRightRadius: '16px',
              maxHeight: '88vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 -10px 30px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div
              style={{
                backgroundColor: '#0369a1',
                color: '#ffffff',
                padding: '0.95rem 1.25rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.35rem',
                  }}
                >
                  🤖
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>
                    {t.counselorTitle}
                  </h3>
                  <div style={{ fontSize: '0.8125rem', color: '#bae6fd' }}>
                    {t.counselorSubtitle} • ● AI Active
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCounselorOpen(false)}
                style={{
                  width: '44px',
                  height: '44px',
                  minWidth: '44px',
                  minHeight: '44px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '1.4rem',
                  cursor: 'pointer',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title="Close counselor"
                aria-label="Close counselor"
              >
                ×
              </button>
            </div>

            {/* Chat Messages */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '1.15rem',
                backgroundColor: '#f8fafc',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem',
                minHeight: '280px',
                maxHeight: '400px',
              }}
            >
              {counselorMessages.map((msg, idx) => (
                <div
                  key={idx}
                  style={{
                    alignSelf: msg.sender === 'USER' ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    backgroundColor: msg.sender === 'USER' ? '#0369a1' : '#ffffff',
                    color: msg.sender === 'USER' ? '#ffffff' : '#0f172a',
                    padding: '0.85rem 1rem',
                    borderRadius: '12px',
                    border: msg.sender === 'USER' ? 'none' : '1px solid #e2e8f0',
                    boxShadow: '0 1px 4px rgba(15, 23, 42, 0.05)',
                  }}
                >
                  <div style={{ fontSize: '0.875rem', lineHeight: 1.6 }}>{msg.text}</div>
                  {msg.tags && (
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.55rem' }}>
                      {msg.tags.map((tg, tidx) => (
                        <span
                          key={tidx}
                          style={{
                            fontSize: '0.8125rem',
                            backgroundColor: '#e0f2fe',
                            color: '#0369a1',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '6px',
                            fontWeight: 700,
                          }}
                        >
                          🏷️ {tg}
                        </span>
                      ))}
                    </div>
                  )}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: msg.sender === 'AI' ? 'space-between' : 'flex-end',
                      alignItems: 'center',
                      fontSize: '0.8125rem',
                      color: msg.sender === 'USER' ? '#bae6fd' : '#94a3b8',
                      marginTop: '0.45rem',
                    }}
                  >
                    {msg.sender === 'AI' && (
                      <button
                        type="button"
                        onClick={() => speechService.speak(msg.text, language)}
                        style={{
                          backgroundColor: '#f0f9ff',
                          border: '1px solid #bae6fd',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.8125rem',
                          color: '#0369a1',
                          padding: '0.45rem 0.75rem',
                          minHeight: '44px',
                          minWidth: '44px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          fontWeight: 700,
                        }}
                        title="Listen (आवाज़ में सुनें)"
                        aria-label="Listen to message in voice"
                      >
                        🔊 Listen
                      </button>
                    )}
                    <span>{msg.time}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Suggestion Chips (Strict >= 44px) */}
            <div
              style={{
                padding: '0.65rem 1rem',
                backgroundColor: '#ffffff',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                gap: '0.5rem',
                overflowX: 'auto',
                whiteSpace: 'nowrap',
              }}
            >
              <button
                type="button"
                onClick={() =>
                  handleSendCounselorMessage(
                    language === 'HI'
                      ? '63,000 पैक्स भर्ती में मेरे लिए कौन से पद हैं?'
                      : 'What jobs can I get in the 63,000 PACS drive?'
                  )
                }
                style={{
                  backgroundColor: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  color: '#0369a1',
                  minHeight: '44px',
                  padding: '0.45rem 0.85rem',
                  borderRadius: '16px',
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                💡 {language === 'HI' ? 'पैक्स भर्ती पद (63,000)' : 'PACS Jobs (63k)'}
              </button>
              <button
                type="button"
                onClick={() =>
                  handleSendCounselorMessage(
                    language === 'HI'
                      ? 'अमूल डेयरी में नौकरी के लिए क्या योग्यता चाहिए?'
                      : 'What are the Amul dairy job requirements?'
                  )
                }
                style={{
                  backgroundColor: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  color: '#0369a1',
                  minHeight: '44px',
                  padding: '0.45rem 0.85rem',
                  borderRadius: '16px',
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                🥛 {language === 'HI' ? 'अमूल डेयरी रिक्तियां' : 'Amul Roles'}
              </button>
              <button
                type="button"
                onClick={() =>
                  handleSendCounselorMessage(
                    language === 'HI'
                      ? 'एनसीडीसी युवा सहकार योजना के क्या लाभ हैं?'
                      : 'What benefits does Yuva Sahakar scheme provide?'
                  )
                }
                style={{
                  backgroundColor: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  color: '#0369a1',
                  minHeight: '44px',
                  padding: '0.45rem 0.85rem',
                  borderRadius: '16px',
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                📜 {language === 'HI' ? 'युवा सहकार योजना' : 'Yuva Sahakar'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCounselorOpen(false);
                  setIsSchemeModalOpen(true);
                }}
                style={{
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  color: '#15803d',
                  minHeight: '44px',
                  padding: '0.45rem 0.85rem',
                  borderRadius: '16px',
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                📊 {t.schemeCalculatorBtn}
              </button>
            </div>

            {/* Input Form with >=44px buttons */}
            <div
              style={{
                padding: '0.85rem 1rem',
                backgroundColor: '#ffffff',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                gap: '0.65rem',
                alignItems: 'center',
              }}
            >
              <input
                type="text"
                value={counselorInput}
                onChange={(e) => setCounselorInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendCounselorMessage();
                }}
                placeholder={t.askCounselorPlaceholder}
                style={{
                  flex: 1,
                  minHeight: '44px',
                  padding: '0.55rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.875rem',
                  outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={() => {
                  if (isVoiceListening) {
                    setIsVoiceListening(false);
                    return;
                  }
                  speechService.startListening(
                    language,
                    (transcript) => {
                      setCounselorInput(transcript);
                      handleSendCounselorMessage(transcript);
                    },
                    (listening) => setIsVoiceListening(listening)
                  );
                }}
                title={language === 'HI' ? 'बोल कर पूछें (Voice Input)' : 'Speak your query'}
                aria-label="Voice input"
                style={{
                  backgroundColor: isVoiceListening ? '#dc2626' : '#f1f5f9',
                  color: isVoiceListening ? '#ffffff' : '#0f172a',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  minHeight: '44px',
                  minWidth: '44px',
                  cursor: 'pointer',
                  fontSize: '1.15rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span>{isVoiceListening ? '🎙️' : '🎤'}</span>
              </button>
              <button
                type="button"
                onClick={() => handleSendCounselorMessage()}
                style={{
                  backgroundColor: '#0369a1',
                  color: '#ffffff',
                  border: 'none',
                  minHeight: '44px',
                  padding: '0.6rem 1.15rem',
                  borderRadius: '8px',
                  fontWeight: 800,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {language === 'HI' ? 'पूछें →' : 'Ask →'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Official Printable NCCT Credential */}
      {showCertModal && (
        <OfficialCertificateModal
          data={{
            credentialId: 'cred-anita-pacs-2026',
            traineeName: trainee.name,
            programmeTitle: SEED_PROGRAMME.title,
            institute: 'Regional Institute of Cooperative Management (RICM), Bhopal',
            issuedAt: '2026-09-28T14:30:00.000Z',
            issuer: 'National Council for Cooperative Training (NCCT)',
            signatureHex: '9f8b4c7d01824a56e6d54f890123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
            skills: [
              'PACS Computerization & Statutory Ledger Posting',
              'Daybook (Rojnamcha) Reconciliations',
              'Double-Entry Accounting & Statutory Reserve Compliance',
              'Cooperative Bylaws & Democratic Governance',
            ],
          }}
          onClose={() => setShowCertModal(false)}
        />
      )}

      {/* PACS Operations Simulator Lab */}
      <PacsOperationsLabModal
        isOpen={isPacsLabOpen}
        onClose={() => setIsPacsLabOpen(false)}
        language={language}
        traineeId={trainee.id}
      />

      {/* Scheme Advisory & Subsidy Calculator */}
      <SchemeCalculatorModal
        isOpen={isSchemeModalOpen}
        onClose={() => setIsSchemeModalOpen(false)}
        language={language}
      />

      {/* Statutory Grievance Redressal (MSCS Act 2023) */}
      <GrievanceModal
        isOpen={isGrievanceModalOpen}
        onClose={() => setIsGrievanceModalOpen(false)}
        language={language}
        trainee={trainee}
      />

      {/* Full Digital Offer Letter Viewer Modal */}
      {showOfferModal && receivedOffer && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            zIndex: 120,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            backdropFilter: 'blur(3px)',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              maxWidth: '560px',
              width: '100%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 45px rgba(0, 0, 0, 0.3)',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div
              style={{
                backgroundColor: '#0369a1',
                color: '#ffffff',
                padding: '1rem 1.25rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <span style={{ fontSize: '1.5rem' }}>📜</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>
                    {t.offerSectionTitle}
                  </h3>
                  <div style={{ fontSize: '0.8125rem', color: '#bae6fd' }}>
                    {receivedOffer.payload.employer.name} • Ref: {receivedOffer.id}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowOfferModal(false)}
                style={{
                  width: '44px',
                  height: '44px',
                  minWidth: '44px',
                  minHeight: '44px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '1.35rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                }}
                aria-label="Close offer letter"
              >
                ×
              </button>
            </div>

            {/* Body */}
            <div
              style={{
                padding: '1.25rem',
                overflowY: 'auto',
                flex: 1,
                fontSize: '0.875rem',
                lineHeight: 1.6,
                color: '#1e293b',
              }}
            >
              <div
                style={{
                  padding: '1rem',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  marginBottom: '1rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 700, color: '#64748b', fontSize: '0.8125rem' }}>
                    {t.offerSignatoryLabel}:
                  </span>
                  <span style={{ fontWeight: 800, color: '#0369a1' }}>
                    {receivedOffer.payload.employer.name}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 700, color: '#64748b', fontSize: '0.8125rem' }}>
                    {language === 'HI' ? 'पद / भूमिका' : 'Designation'}:
                  </span>
                  <span style={{ fontWeight: 800, color: '#0f172a' }}>
                    {receivedOffer.payload.designation}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 700, color: '#64748b', fontSize: '0.8125rem' }}>
                    {t.offerLocationLabel}:
                  </span>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>
                    {receivedOffer.payload.postingLocation}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 700, color: '#64748b', fontSize: '0.8125rem' }}>
                    {t.offerCtcLabel}:
                  </span>
                  <span style={{ fontWeight: 800, color: '#15803d' }}>
                    ₹{receivedOffer.payload.annualCompensationLPA} LPA (₹{receivedOffer.payload.monthlyStipendOrSalary.toLocaleString('en-IN')}/mo)
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 700, color: '#64748b', fontSize: '0.8125rem' }}>
                    {t.offerJoiningDateLabel}:
                  </span>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>
                    {receivedOffer.payload.joiningDate}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 700, color: '#64748b', fontSize: '0.8125rem' }}>
                    {language === 'HI' ? 'प्रस्ताव स्थिति' : 'Offer Status'}:
                  </span>
                  <span
                    style={{
                      fontWeight: 800,
                      color:
                        receivedOffer.status === 'ACCEPTED'
                          ? '#15803d'
                          : receivedOffer.status === 'DECLINED'
                          ? '#dc2626'
                          : '#d97706',
                    }}
                  >
                    {receivedOffer.status}
                  </span>
                </div>
              </div>

              {/* Cryptographic Guarantee Card */}
              <div
                style={{
                  padding: '0.85rem',
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '10px',
                  fontSize: '0.8125rem',
                  color: '#166534',
                }}
              >
                <div style={{ fontWeight: 800, marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span>🛡️</span>
                  <span>{t.offerCryptoVerifiedBadge}</span>
                </div>
                <div style={{ wordBreak: 'break-all', fontFamily: 'monospace', fontSize: '0.8125rem', color: '#15803d' }}>
                  <strong>Issuer Key ID:</strong> {receivedOffer.issuerKeyId}
                </div>
                <div style={{ wordBreak: 'break-all', fontFamily: 'monospace', fontSize: '0.8125rem', color: '#15803d', marginTop: '0.25rem' }}>
                  <strong>Ed25519 Sig:</strong> {receivedOffer.signatureHex}
                </div>
                <div style={{ wordBreak: 'break-all', fontFamily: 'monospace', fontSize: '0.8125rem', color: '#15803d', marginTop: '0.25rem' }}>
                  <strong>Canonical Digest:</strong> {receivedOffer.canonicalDigest}
                </div>
              </div>
            </div>

            {/* Footer with >=44px buttons */}
            <div
              style={{
                padding: '0.85rem 1.25rem',
                backgroundColor: '#f8fafc',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                gap: '0.75rem',
                justifyContent: 'flex-end',
                alignItems: 'center',
              }}
            >
              <button
                type="button"
                onClick={() => window.print()}
                style={{
                  minHeight: '44px',
                  padding: '0.55rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#0f172a',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                }}
              >
                🖨️ {language === 'HI' ? 'प्रिंट / सेव' : 'Print / Save'}
              </button>
              <button
                type="button"
                onClick={() => setShowOfferModal(false)}
                style={{
                  minHeight: '44px',
                  padding: '0.55rem 1.25rem',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#0369a1',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                }}
              >
                {language === 'HI' ? 'बंद करें' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: 6-Digit Dynamic Session Attendance Modal
      ======================================================== */}
      <DynamicAttendanceModal
        isOpen={isDynamicAttendanceOpen}
        onClose={() => setIsDynamicAttendanceOpen(false)}
        session={SEED_SESSION}
        trainee={{
          id: trainee.id,
          name: trainee.name,
          designation: 'PACS Secretary Trainee',
          cooperativeAffiliation: 'Bilkisganj Primary Agriculture Credit Cooperative',
        }}
        isApprovedNominee={true}
        language={language}
        networkConnectivity={networkConnectivity}
        onCheckInSuccess={(record) => {
          setTodayAttendanceRecord(record);
        }}
      />

      {/* ========================================================
          BOTTOM NAVIGATION BAR (All 6 Tabs, Strict >= 48px Touch Height)
      ======================================================== */}
      <nav
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          maxWidth: '520px',
          margin: '0 auto',
          height: '72px',
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          backgroundColor: '#ffffff',
          borderTop: `1px solid ${THEME.colors.borderOuter}`,
          boxShadow: '0 -2px 10px rgba(8, 24, 84, 0.08)',
          zIndex: 90,
          padding: '0 2px',
        }}
      >
        {(
          [
            { id: 'HOME', label: t.tabs.HOME, Icon: HomeIcon },
            { id: 'LEARN', label: t.tabs.LEARN, Icon: LearnIcon },
            { id: 'PROGRESS', label: t.tabs.PROGRESS, Icon: ProgressIcon },
            { id: 'CREDENTIALS', label: t.tabs.CREDENTIALS, Icon: CredentialsIcon },
            { id: 'OPPORTUNITIES', label: t.tabs.OPPORTUNITIES, Icon: OpportunitiesIcon },
            { id: 'PROFILE', label: t.tabs.PROFILE, Icon: ProfileIcon },
          ] as const
        ).map((tab) => {
          const isActive = activeTab === tab.id;
          const TabIcon = tab.Icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: 'none',
                border: 'none',
                color: isActive ? THEME.colors.navyPrimary : '#64748b',
                fontWeight: isActive ? 800 : 600,
                fontSize: '0.8125rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.15rem',
                cursor: 'pointer',
                minHeight: '52px',
                padding: '0.35rem 0.15rem',
                transition: 'all 0.15s ease',
                position: 'relative',
              }}
            >
              <TabIcon size={20} color={isActive ? THEME.colors.navyPrimary : '#64748b'} />
              <span
                style={{
                  fontSize: '0.75rem',
                  maxWidth: '100%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  lineHeight: 1.2,
                }}
              >
                {tab.label}
              </span>
              {isActive && (
                <div
                  style={{
                    position: 'absolute',
                    top: '2px',
                    width: '24px',
                    height: '3px',
                    backgroundColor: THEME.colors.goldCoop,
                    borderRadius: '2px',
                  }}
                />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

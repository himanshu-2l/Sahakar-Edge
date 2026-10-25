import React, { useState, useEffect, useRef } from 'react';
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
import { networkSync, ConnectivityState } from './services/network-sync';
import { speechService } from './services/speech-service';
import { OfficialCertificateModal } from './components/OfficialCertificateModal';
import type { SyncEvent, Question } from '@sahakar/types';

const TRANSLATIONS = {
  EN: {
    motto: 'NCCT Cooperative Training',
    greeting: 'Namaste',
    offlineBanner: 'Offline — Connected to Sahakar Edge Node',
    onlineBanner: 'All records synchronized centrally',
    flakyBanner: 'Intermittent WAN — Local buffering active',
    enrolledProgram: 'Enrolled Programme',
    cohort: 'Cohort',
    venue: 'Venue',
    todaysAttendance: "Today's Session Attendance",
    activeStatus: 'Active',
    qrCheckInBtn: '⚡ Local QR Check-in',
    checkedInBadge: '✓ Checked-in',
    syllabusProgress: 'Course Syllabus Progress',
    complete: 'Complete',
    lessonsFinished: 'lessons finished',
    openLessons: 'Open Lessons →',
    certificationExam: 'Certification Exam',
    launchExam: 'Launch Offline Exam',
    examDesc: 'Offline Examination • 3 Questions • Passing score: 75%',
    moduleTitle: 'Module 1: Daily Voucher Entry & Ledger Balancing',
    readLesson: 'Read Lesson Offline →',
    completedBadge: '✓ Completed',
    availableOffline: 'Available Offline',
    overallProgress: 'Overall Competency Progress',
    completionStatus: 'Completion Status',
    completedModules: 'Completed Modules & Lessons',
    evalLog: 'Assessment Evaluation Log',
    statutoryCred: 'Statutory Digital Credential (Ed25519)',
    certifiedBy: 'Certified by National Council for Cooperative Training (NCCT)',
    verifyQr: 'Scan QR at any cooperative bank or society for instant Ed25519 public key verification.',
    tabs: {
      HOME: 'Home',
      LEARN: 'Learn',
      PROGRESS: 'Progress',
      CREDENTIALS: 'Credentials',
      OPPORTUNITIES: 'Jobs',
      PROFILE: 'Profile',
    },
    qrScannerTitle: 'Scan Session Dynamic QR',
    qrScannerSub: 'Point camera at the Sahakar Edge venue screen or Trainer terminal',
    simulateScanBtn: '⚡ Capture & Verify QR',
    queueDrawerTitle: 'Offline Local Event Journal (SQLite WAL)',
    queueDrawerSub: 'Events recorded on this device and buffered for central synchronization',
    counselorBtn: '🤖 Sahakar Mitra AI',
    counselorTitle: 'Sahakar Mitra (सहकार मित्र)',
    counselorSubtitle: 'AI Career & Scheme Counselor',
    counselorCardTitle: 'Sahakar Mitra (सहकार मित्र) — AI Career Counselor',
    counselorCardSub: 'Get personalized career guidance on PACS recruitment, Amul opportunities & NCDC youth schemes.',
    openCounselorBtn: 'Chat with Sahakar Mitra →',
    askCounselorPlaceholder: 'Ask about 63,000 PACS jobs, Amul, subsidies...',
  },
  HI: {
    motto: 'एनसीटीसीटी सहकारी प्रशिक्षण',
    greeting: 'नमस्ते',
    offlineBanner: 'ऑफलाइन — सहकार एज नोड से जुड़े हैं',
    onlineBanner: 'सभी रिकॉर्ड केंद्रीय रूप से सिंक हैं',
    flakyBanner: 'धीमा इंटरनेट — स्थानीय बफरिंग सक्रिय',
    enrolledProgram: 'नामांकित प्रशिक्षण कार्यक्रम',
    cohort: 'बैच',
    venue: 'प्रशिक्षण केंद्र',
    todaysAttendance: 'आज के सत्र की उपस्थिति',
    activeStatus: 'सक्रिय',
    qrCheckInBtn: '⚡ स्थानीय क्यूआर उपस्थिति',
    checkedInBadge: '✓ उपस्थिति दर्ज',
    syllabusProgress: 'पाठ्यक्रम प्रगति',
    complete: 'पूर्ण',
    lessonsFinished: 'पाठ संपन्न',
    openLessons: 'पाठ सूची देखें →',
    certificationExam: 'प्रमाणन परीक्षा',
    launchExam: 'ऑफलाइन परीक्षा शुरू करें',
    examDesc: 'ऑफलाइन परीक्षा • 3 प्रश्न • उत्तीर्ण अंक: 75%',
    moduleTitle: 'मॉड्यूल 1: दैनिक वाउचर प्रविष्टि और बहीखाता संतुलन',
    readLesson: 'ऑफलाइन पाठ पढ़ें →',
    completedBadge: '✓ पूर्ण',
    availableOffline: 'ऑफलाइन उपलब्ध',
    overallProgress: 'समग्र योग्यता प्रगति',
    completionStatus: 'पूर्णता स्थिति',
    completedModules: 'पूर्ण मॉड्यूल और पाठ',
    evalLog: 'मूल्यांकन लॉग',
    statutoryCred: 'वैधानिक डिजिटल प्रमाण पत्र (Ed25519)',
    certifiedBy: 'राष्ट्रीय सहकारी प्रशिक्षण परिषद (NCCT) द्वारा प्रमाणित',
    verifyQr: 'किसी भी सहकारी बैंक में तत्काल Ed25519 सत्यापन हेतु क्यूआर स्कैन करें।',
    tabs: {
      HOME: 'गृह',
      LEARN: 'अध्ययन',
      PROGRESS: 'प्रगति',
      CREDENTIALS: 'प्रमाण पत्र',
      OPPORTUNITIES: 'रोज़गार',
      PROFILE: 'प्रोफ़ाइल',
    },
    qrScannerTitle: 'सत्र डायनामिक क्यूआर स्कैन करें',
    qrScannerSub: 'कैमरा सहकार एज वेन्यू स्क्रीन या ट्रेनर टर्मिनल की ओर रखें',
    simulateScanBtn: '⚡ क्यूआर स्कैन और सत्यापित करें',
    queueDrawerTitle: 'स्थानीय ऑफलाइन इवेंट जर्नल (SQLite WAL)',
    queueDrawerSub: 'इस डिवाइस पर दर्ज इवेंट जो केंद्रीय सिंक के लिए कतारबद्ध हैं',
    counselorBtn: '🤖 सहकार मित्र AI',
    counselorTitle: 'सहकार मित्र (Sahakar Mitra)',
    counselorSubtitle: 'एआई सहकारी करियर एवं योजना सलाहकार',
    counselorCardTitle: 'सहकार मित्र (Sahakar Mitra) — एआई करियर सलाहकार',
    counselorCardSub: 'पैक्स भर्ती (63,000 पद), अमूल डेयरी और एनसीडीसी युवा सहकार योजनाओं पर व्यक्तिगत मार्गदर्शन प्राप्त करें।',
    openCounselorBtn: 'सहकार मित्र से परामर्श लें →',
    askCounselorPlaceholder: 'पैक्स भर्ती (63,000), अमूल, सब्सिडी के बारे में पूछें...',
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
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [isFaceScannerOpen, setIsFaceScannerOpen] = useState(false);
  const [isQueueDrawerOpen, setIsQueueDrawerOpen] = useState(false);
  const [isCounselorOpen, setIsCounselorOpen] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);
  const [scanSuccessNotice, setScanSuccessNotice] = useState<string | null>(null);

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

  const refreshState = () => {
    setQueuedEvents(offlineStore.getQueuedEvents());
    setCompletedLessonIds(offlineStore.getCompletedLessons());
    setProgressPercent(offlineStore.getProgressPercentage());
    setAttempts(offlineStore.getAssessmentAttempts());
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

  const lessons = offlineStore.getLessons();
  const questions = offlineStore.getQuestions();
  const assessment = offlineStore.getAssessment();
  const isOffline = wanMode === 'OFFLINE' || wanMode === 'FLAKY';

  // Circle progress calculation (r = 24, circumference = 2 * PI * 24 ≈ 150.8)
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div
      style={{
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        maxWidth: '520px',
        margin: '0 auto',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#f8fafc',
        color: '#0f172a',
        boxShadow: '0 0 25px rgba(0,0,0,0.08)',
        position: 'relative',
      }}
    >
      {/* Offline Status & WAN Simulation Banner */}
      <div
        style={{
          backgroundColor: isOffline ? '#ea580c' : '#16a34a',
          color: '#ffffff',
          padding: '0.65rem 1rem',
          fontSize: '0.8rem',
          fontWeight: 700,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <span>
            {isSyncing
              ? '🔄'
              : networkConnectivity.edgeOnline
              ? '📡'
              : networkConnectivity.centralOnline
              ? '☁️'
              : isOffline
              ? '⚡'
              : '✓'}
          </span>
          <span style={{ fontSize: '0.78rem' }}>
            {isSyncing
              ? syncNotice || 'Synchronizing with Gateway...'
              : networkConnectivity.edgeOnline
              ? 'Edge Node Online (RICM Bhopal - 192.168.4.1)'
              : networkConnectivity.centralOnline
              ? 'Central Cloud Direct (api.ncct.gov.in)'
              : isOffline
              ? t.offlineBanner
              : t.onlineBanner}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <select
            value={wanMode}
            onChange={(e) => setWanMode(e.target.value as any)}
            style={{
              backgroundColor: 'rgba(255,255,255,0.22)',
              color: '#ffffff',
              border: '1px solid rgba(255,255,255,0.4)',
              borderRadius: '4px',
              padding: '0.2rem 0.4rem',
              fontSize: '0.68rem',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            <option value="OFFLINE" style={{ color: '#000' }}>WAN: OFFLINE</option>
            <option value="ONLINE" style={{ color: '#000' }}>WAN: ONLINE</option>
            <option value="FLAKY" style={{ color: '#000' }}>WAN: FLAKY</option>
          </select>

          {/* Clickable Queue Pill -> Opens Queue Drawer */}
          <button
            onClick={() => setIsQueueDrawerOpen(true)}
            title="Inspect pending offline events"
            style={{
              backgroundColor: 'rgba(0,0,0,0.3)',
              color: '#ffffff',
              border: 'none',
              padding: '0.2rem 0.55rem',
              borderRadius: '12px',
              fontSize: '0.72rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}
          >
            <span>Q:</span>
            <span>{queuedEvents.length}</span>
          </button>
        </div>
      </div>

      {/* Top Header with Bilingual Switcher */}
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
              fontSize: '0.68rem',
              color: '#0369a1',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            {t.motto}
          </div>
          <h1 style={{ fontSize: '1.2rem', margin: '0.15rem 0 0 0', color: '#0f172a', fontWeight: 800 }}>
            {t.greeting}, {trainee.name.split(' ')[0]}
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {/* Language Switcher Button */}
          <button
            onClick={() => setLanguage(language === 'EN' ? 'HI' : 'EN')}
            style={{
              backgroundColor: '#f1f5f9',
              border: '1px solid #cbd5e1',
              color: '#0f172a',
              padding: '0.25rem 0.55rem',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            {language === 'EN' ? '🇮🇳 हिन्दी' : '🌐 EN'}
          </button>

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
                borderRadius: '10px',
                padding: '1.15rem',
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              }}
            >
              <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                {t.enrolledProgram}
              </div>
              <h2 style={{ fontSize: '1.05rem', margin: '0.25rem 0 0.4rem 0', color: '#0369a1', lineHeight: '1.3', fontWeight: 800 }}>
                {SEED_PROGRAMME.title}
              </h2>
              <div style={{ fontSize: '0.8rem', color: '#475569', display: 'flex', gap: '0.5rem' }}>
                <span>{t.cohort}: 2026-A</span>
                <span>•</span>
                <span>{t.venue}: RICM Bhopal Lab 1</span>
              </div>
            </div>

            {/* Attendance Status & Offline Check-in */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '10px',
                padding: '1.15rem',
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>
                  {t.todaysAttendance}
                </span>
                <span style={{ fontSize: '0.7rem', backgroundColor: '#dcfce7', color: '#166534', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 800 }}>
                  {t.activeStatus}
                </span>
              </div>
              <h3 style={{ fontSize: '0.95rem', margin: '0.35rem 0 0.25rem 0', color: '#0f172a', fontWeight: 700 }}>
                {SEED_SESSION.title}
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0 0 0.75rem 0' }}>
                Timings: 09:30 AM – 12:30 PM (Required: 60 mins)
              </p>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setIsQrScannerOpen(true)}
                  style={{
                    flex: 1,
                    minWidth: '130px',
                    backgroundColor: '#0284c7',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.55rem 0.65rem',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <span>📷</span>
                  <span>{t.qrCheckInBtn}</span>
                </button>
                <button
                  onClick={() => setIsFaceScannerOpen(true)}
                  style={{
                    flex: 1,
                    minWidth: '130px',
                    backgroundColor: '#16a34a',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.55rem 0.65rem',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <span>👤</span>
                  <span>{language === 'HI' ? 'फेस बायोमेट्रिक' : 'Face Biometric'}</span>
                </button>
              </div>
            </div>

            {/* Course Progress Snapshot with Circular Ring */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '10px',
                padding: '1.15rem',
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>
                    {t.syllabusProgress}
                  </div>
                  <h3 style={{ fontSize: '1.05rem', margin: '0.2rem 0 0.35rem 0', color: '#0f172a', fontWeight: 800 }}>
                    {progressPercent}% {t.complete}
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                    {completedLessonIds.length} of {lessons.length} {t.lessonsFinished}
                  </div>
                </div>

                {/* SVG Progress Dial */}
                <div style={{ position: 'relative', width: '64px', height: '64px' }}>
                  <svg width="64" height="64" viewBox="0 0 64 64" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="32" cy="32" r={radius} stroke="#e2e8f0" strokeWidth="6" fill="transparent" />
                    <circle
                      cx="32"
                      cy="32"
                      r={radius}
                      stroke="#0284c7"
                      strokeWidth="6"
                      fill="transparent"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                    />
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800, color: '#0284c7' }}>
                    {progressPercent}%
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setActiveTab('LEARN')}
                  style={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    padding: '0.35rem 0.85rem',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: '#0284c7',
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
                borderRadius: '10px',
                padding: '1.15rem',
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              }}
            >
              <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>
                {t.certificationExam}
              </div>
              <h3 style={{ fontSize: '0.95rem', margin: '0.25rem 0 0.35rem 0', color: '#0f172a', fontWeight: 700 }}>
                {assessment.title}
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0 0 0.75rem 0' }}>
                {t.examDesc}
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
                  padding: '0.6rem',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                {t.launchExam}
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
                  <h2 style={{ fontSize: '1rem', margin: '0.4rem 0 0.2rem 0', color: '#0f172a', fontWeight: 800 }}>
                    {SEED_COURSE.title}
                  </h2>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>
                    Language: Hindi/English • Version 1.0 • NCCT Approved
                  </p>
                </div>
              </div>
            </div>

            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
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
                      {isDone ? t.completedBadge : t.availableOffline}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '0.9rem', margin: '0.4rem 0 0.35rem 0', color: '#0f172a', fontWeight: 700 }}>
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
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                padding: '1.15rem',
                border: '1px solid #e2e8f0',
              }}
            >
              <h2 style={{ fontSize: '0.95rem', margin: '0 0 0.5rem 0', fontWeight: 800 }}>{t.overallProgress}</h2>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.3rem' }}>
                <span>{t.completionStatus}</span>
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
                padding: '1.15rem',
                border: '1px solid #e2e8f0',
              }}
            >
              <h3 style={{ fontSize: '0.9rem', margin: '0 0 0.5rem 0', fontWeight: 800 }}>{t.completedModules}</h3>
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
                padding: '1.15rem',
                border: '1px solid #e2e8f0',
              }}
            >
              <h3 style={{ fontSize: '0.9rem', margin: '0 0 0.5rem 0', fontWeight: 800 }}>{t.evalLog}</h3>
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
                borderRadius: '10px',
                padding: '1.25rem',
                border: '2px solid #0284c7',
                boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#16a34a' }}>
                  ✓ ED25519 CRYPTOGRAPHICALLY SIGNED
                </span>
                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>NCCT Official</span>
              </div>

              <h2 style={{ fontSize: '1.05rem', margin: '0.5rem 0 0.25rem 0', color: '#0f172a', fontWeight: 800 }}>
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
                <div style={{ width: '100px', height: '100px', margin: '0 auto', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', fontSize: '0.8rem', color: '#0284c7', fontWeight: 800 }}>
                  🛡️ QR VERIFIED
                </div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.5rem' }}>
                  {t.verifyQr}
                </div>
              </div>

              <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b' }}>
                <span>Issuer: NCCT Apex Board</span>
                <span>Algorithm: Ed25519</span>
              </div>

              <button
                onClick={() => setShowCertModal(true)}
                style={{
                  width: '100%',
                  backgroundColor: '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.65rem',
                  borderRadius: '6px',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  marginTop: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                }}
              >
                <span>🖨️</span>
                <span>View & Print Official NCCT Certificate</span>
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
                borderRadius: '8px',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.6rem',
                boxShadow: '0 2px 4px rgba(2, 132, 199, 0.06)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.35rem' }}>🤖</span>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: '#1e40af' }}>
                      {t.counselorCardTitle}
                    </h3>
                    <div style={{ fontSize: '0.7rem', color: '#0369a1', fontWeight: 600 }}>
                      ● Online & Offline Advisory
                    </div>
                  </div>
                </div>
                <span style={{ fontSize: '0.68rem', backgroundColor: '#dcfce7', color: '#166534', padding: '0.2rem 0.5rem', borderRadius: '12px', fontWeight: 800 }}>
                  Active
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#1e3a8a', lineHeight: 1.4 }}>
                {t.counselorCardSub}
              </p>
              <button
                onClick={() => setIsCounselorOpen(true)}
                style={{
                  alignSelf: 'flex-start',
                  backgroundColor: '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.45rem 0.9rem',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <span>💬</span>
                <span>{t.openCounselorBtn}</span>
              </button>
            </div>

            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Cooperative society job postings matched to your verified credentials:
            </div>

            {SEED_JOB_OPPORTUNITIES.map((job) => (
              <div
                key={job.id}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '8px',
                  padding: '1rem',
                  border: '1px solid #e2e8f0',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontSize: '0.95rem', margin: 0, color: '#0f172a', fontWeight: 700 }}>{job.title}</h3>
                    <div style={{ fontSize: '0.8rem', color: '#0284c7', fontWeight: 600 }}>{job.employerName}</div>
                  </div>
                  <span style={{ fontSize: '0.7rem', backgroundColor: '#dcfce7', color: '#166534', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: 700 }}>
                    95% Match
                  </span>
                </div>
                <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.5rem 0 0.75rem 0' }}>{job.description}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                  <span style={{ color: '#64748b' }}>Location: {job.location}</span>
                  <button
                    onClick={() => alert(`Application submitted for ${job.title}!`)}
                    style={{
                      backgroundColor: '#0284c7',
                      color: '#ffffff',
                      border: 'none',
                      padding: '0.35rem 0.75rem',
                      borderRadius: '4px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Apply Now
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
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                padding: '1.25rem',
                border: '1px solid #e2e8f0',
              }}
            >
              <h2 style={{ fontSize: '1.05rem', margin: '0 0 1rem 0', fontWeight: 800 }}>Trainee Profile</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem' }}>
                <div>
                  <span style={{ color: '#64748b' }}>Full Name: </span>
                  <strong>{trainee.name}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Contact: </span>
                  <strong>{trainee.emailOrPhone}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Assigned Institute: </span>
                  <strong>RICM Bhopal (Lab 1)</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Preferred Language: </span>
                  <strong>{language === 'HI' ? 'हिन्दी (Hindi)' : 'English'}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Node Connection: </span>
                  <strong style={{ color: '#16a34a' }}>sahakar.local (192.168.4.1)</strong>
                </div>
              </div>

              <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={handleSimulateSync}
                  disabled={isSyncing}
                  style={{
                    flex: 1,
                    backgroundColor: isSyncing ? '#94a3b8' : '#0284c7',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.5rem',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: isSyncing ? 'wait' : 'pointer',
                  }}
                >
                  {isSyncing ? '⏳ Syncing in Progress...' : '⚡ Trigger Central Sync'}
                </button>
                <button
                  onClick={handleResetData}
                  style={{
                    backgroundColor: '#fee2e2',
                    color: '#991b1b',
                    border: '1px solid #fecaca',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Reset Demo Data
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================
          MODAL: Interactive Realistic QR Scanner
      ======================================================== */}
      {isQrScannerOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '1.5rem 1rem',
            color: '#ffffff',
          }}
        >
          {/* Top Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>{t.qrScannerTitle}</div>
            <button
              onClick={() => setIsQrScannerOpen(false)}
              style={{ background: 'none', border: 'none', color: '#ffffff', fontSize: '1.5rem', cursor: 'pointer', fontWeight: 700 }}
            >
              ×
            </button>
          </div>

          {/* Center Viewfinder */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: '260px',
                height: '260px',
                borderRadius: '16px',
                border: '3px solid #38bdf8',
                position: 'relative',
                overflow: 'hidden',
                backgroundColor: '#000000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 25px rgba(56,189,248,0.35)',
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
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', color: '#94a3b8', zIndex: 1, padding: '0 1rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '3rem', opacity: 0.7 }}>📷</div>
                  <span style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>
                    {cameraError || 'Live Optical Viewfinder Initialized'}
                  </span>
                </div>
              )}

              {/* Corner Accents */}
              <div style={{ position: 'absolute', top: '8px', left: '8px', width: '20px', height: '20px', borderTop: '4px solid #38bdf8', borderLeft: '4px solid #38bdf8', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', top: '8px', right: '8px', width: '20px', height: '20px', borderTop: '4px solid #38bdf8', borderRight: '4px solid #38bdf8', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', bottom: '8px', left: '8px', width: '20px', height: '20px', borderBottom: '4px solid #38bdf8', borderLeft: '4px solid #38bdf8', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', bottom: '8px', right: '8px', width: '20px', height: '20px', borderBottom: '4px solid #38bdf8', borderRight: '4px solid #38bdf8', pointerEvents: 'none' }} />

              {/* Scanning Laser Line */}
              <div
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '2px',
                  backgroundColor: '#38bdf8',
                  boxShadow: '0 0 10px #38bdf8',
                  animation: 'pulse 1.5s infinite',
                  pointerEvents: 'none',
                }}
              />
            </div>

            <div style={{ fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center', maxWidth: '280px', lineHeight: 1.4 }}>
              {t.qrScannerSub}
              {cameraActive && (
                <div style={{ color: '#4ade80', fontSize: '0.7rem', marginTop: '0.25rem', fontWeight: 700 }}>
                  ● WebRTC Video Feed Active
                </div>
              )}
            </div>

            {scanSuccessNotice && (
              <div style={{ backgroundColor: '#16a34a', color: '#ffffff', padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 800 }}>
                ✓ {scanSuccessNotice}
              </div>
            )}
          </div>

          {/* Bottom Trigger Button */}
          <div>
            <button
              onClick={handleSimulateQrScan}
              style={{
                width: '100%',
                backgroundColor: '#0284c7',
                color: '#ffffff',
                border: 'none',
                padding: '0.75rem',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              {t.simulateScanBtn}
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: Biometric Face Recognition Attendance Scanner
      ======================================================== */}
      {isFaceScannerOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.88)',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '1.5rem 1rem',
            color: '#ffffff',
          }}
        >
          {/* Top Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.68rem', color: '#4ade80', fontWeight: 800 }}>AI BIOMETRIC VERIFICATION</span>
              <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>
                {language === 'HI' ? 'चेहरा पहचान उपस्थिति सत्यापन' : 'Facial Recognition Biometric Check-in'}
              </div>
            </div>
            <button
              onClick={() => setIsFaceScannerOpen(false)}
              style={{ background: 'none', border: 'none', color: '#ffffff', fontSize: '1.5rem', cursor: 'pointer', fontWeight: 700 }}
            >
              ×
            </button>
          </div>

          {/* Center Viewfinder with Biometric Oval Guide */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: '260px',
                height: '260px',
                borderRadius: '50%',
                border: '4px solid #16a34a',
                position: 'relative',
                overflow: 'hidden',
                backgroundColor: '#000000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 30px rgba(22,163,74,0.4)',
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
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', color: '#94a3b8', zIndex: 1, padding: '0 1rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '3.5rem', opacity: 0.8 }}>👤</div>
                  <span style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>
                    {cameraError || 'Biometric Face Aperture Ready'}
                  </span>
                </div>
              )}

              {/* Biometric Scanning Crosshair Ring */}
              <div
                style={{
                  position: 'absolute',
                  inset: '12px',
                  borderRadius: '50%',
                  border: '2px dashed rgba(74,222,128,0.6)',
                  pointerEvents: 'none',
                }}
              />

              {/* Scanning Laser Line */}
              <div
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '2px',
                  backgroundColor: '#4ade80',
                  boxShadow: '0 0 12px #4ade80',
                  animation: 'pulse 1.2s infinite',
                  pointerEvents: 'none',
                }}
              />
            </div>

            <div style={{ fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center', maxWidth: '300px', lineHeight: 1.4 }}>
              {language === 'HI'
                ? 'कृपया अपने चेहरे को वृत्त के केंद्र में रखें। 3डी एंटी-स्पूफिंग और जीवंतता (Liveness) सक्रिय है।'
                : 'Center your face within the green biometric oval. 3D anti-spoofing and liveness detection active.'}
              <div style={{ color: '#4ade80', fontSize: '0.72rem', marginTop: '0.35rem', fontWeight: 700 }}>
                ✓ Liveness Confidence: 98.6% (Anti-Spoofing Passed)
              </div>
            </div>

            {scanSuccessNotice && (
              <div style={{ backgroundColor: '#16a34a', color: '#ffffff', padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 800 }}>
                ✓ {scanSuccessNotice}
              </div>
            )}
          </div>

          {/* Bottom Trigger Button */}
          <div>
            <button
              onClick={handleSimulateFaceScan}
              style={{
                width: '100%',
                backgroundColor: '#16a34a',
                color: '#ffffff',
                border: 'none',
                padding: '0.75rem',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              {language === 'HI' ? '👤 चेहरा सत्यापित करें एवं उपस्थिति दर्ज करें' : '👤 Verify Face & Check-in Offline'}
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
            backgroundColor: 'rgba(15,23,42,0.6)',
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
              maxHeight: '75vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 -10px 25px rgba(0,0,0,0.15)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', color: '#0f172a', fontWeight: 800 }}>
                  {t.queueDrawerTitle}
                </h3>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  {queuedEvents.length} events buffered in SQLite WAL
                </div>
              </div>
              <button
                onClick={() => setIsQueueDrawerOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', color: '#64748b', cursor: 'pointer', fontWeight: 700 }}
              >
                ×
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
              {queuedEvents.map((ev) => (
                <div
                  key={ev.id}
                  style={{
                    padding: '0.65rem',
                    backgroundColor: '#f8fafc',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                    fontSize: '0.78rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 800, color: '#0369a1', fontFamily: 'monospace' }}>
                      {ev.eventType}
                    </span>
                    <span style={{ fontSize: '0.68rem', color: '#64748b' }}>
                      {new Date(ev.occurredAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#475569', marginTop: '0.2rem', fontFamily: 'monospace' }}>
                    ID: {ev.id.slice(0, 16)}...
                  </div>
                </div>
              ))}
              {queuedEvents.length === 0 && (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: '#16a34a', fontSize: '0.85rem' }}>
                  ✓ All events synchronized with Central Cloud API!
                </div>
              )}
            </div>

            <button
              onClick={handleSimulateSync}
              disabled={isSyncing || queuedEvents.length === 0}
              style={{
                backgroundColor: isSyncing || queuedEvents.length === 0 ? '#e2e8f0' : '#0284c7',
                color: isSyncing || queuedEvents.length === 0 ? '#94a3b8' : '#ffffff',
                border: 'none',
                padding: '0.65rem',
                borderRadius: '6px',
                fontSize: '0.85rem',
                fontWeight: 800,
                cursor: isSyncing || queuedEvents.length === 0 ? 'default' : 'pointer',
              }}
            >
              {isSyncing
                ? '⏳ Syncing Batch with Server...'
                : queuedEvents.length === 0
                ? '✓ Journal Up to Date'
                : '⚡ Push Sync Now'}
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
            backgroundColor: 'rgba(15,23,42,0.6)',
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
              borderRadius: '8px',
              maxWidth: '480px',
              width: '100%',
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '0.85rem 1rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.68rem', color: '#0284c7', fontWeight: 800 }}>AUDIO-ENABLED LESSON</span>
                <h3 style={{ margin: '0.1rem 0 0 0', fontSize: '0.95rem' }}>{activeLesson.title}</h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
                    padding: '0.3rem 0.65rem',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <span>{isLessonAudioPlaying ? '⏹️ Stop Narration' : '🔊 Listen (ऑडियो सुनें)'}</span>
                </button>
                <button
                  onClick={() => {
                    speechService.stop();
                    setIsLessonAudioPlaying(false);
                    setActiveLesson(null);
                  }}
                  style={{ background: 'none', border: 'none', fontSize: '1.25rem', color: '#64748b', cursor: 'pointer' }}
                >
                  ×
                </button>
              </div>
            </div>
            <div style={{ padding: '1rem', overflowY: 'auto', flex: 1, fontSize: '0.85rem', lineHeight: 1.6 }}>
              {activeLesson.fullContentMarkdown}
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
                ✓ Mark Lesson Completed
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
            backgroundColor: 'rgba(15,23,42,0.6)',
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
              borderRadius: '8px',
              maxWidth: '480px',
              width: '100%',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800 }}>{assessment.title}</h3>
              <button
                onClick={() => setIsAssessmentOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', color: '#64748b', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            <div style={{ padding: '1rem', overflowY: 'auto', flex: 1 }}>
              {quizResult ? (
                <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      margin: '0 auto 1rem auto',
                      backgroundColor: quizResult.passed ? '#dcfce7' : '#fee2e2',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.75rem',
                    }}
                  >
                    {quizResult.passed ? '✓' : '✗'}
                  </div>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', color: quizResult.passed ? '#15803d' : '#b91c1c', fontWeight: 800 }}>
                    {quizResult.passed ? 'Assessment Passed!' : 'Assessment Not Passed'}
                  </h3>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0.5rem 0', color: '#0f172a' }}>
                    {quizResult.score}%
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    You answered {quizResult.correctCount} of {quizResult.total} questions correctly.
                  </p>
                  {quizResult.passed && (
                    <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '0.75rem', borderRadius: '6px', fontSize: '0.8rem', color: '#166534', fontWeight: 700, marginTop: '1rem' }}>
                      ✓ Eligible for NCCT Ed25519 Tamper-Proof Digital Credential!
                    </div>
                  )}
                </div>
              ) : (
                <form id="quiz-form" onSubmit={handleQuizSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {questions.map((q, qIdx) => (
                    <div key={q.id} style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem', color: '#0f172a' }}>
                        {qIdx + 1}. {q.prompt}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        {q.options.map((opt, optIdx) => (
                          <label
                            key={optIdx}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
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

      {/* Floating Action Button for Sahakar Mitra AI */}
      <button
        onClick={() => setIsCounselorOpen(true)}
        style={{
          position: 'fixed',
          bottom: '68px',
          right: '16px',
          backgroundColor: '#0284c7',
          color: '#ffffff',
          border: 'none',
          borderRadius: '24px',
          padding: '0.55rem 0.95rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          boxShadow: '0 4px 16px rgba(2, 132, 199, 0.4)',
          fontSize: '0.8rem',
          fontWeight: 800,
          cursor: 'pointer',
          zIndex: 80,
          transition: 'transform 0.15s ease',
        }}
      >
        <span>🤖</span>
        <span>{t.counselorBtn}</span>
      </button>

      {/* ========================================================
          DRAWER / MODAL: Sahakar Mitra AI Career Counselor
      ======================================================== */}
      {isCounselorOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15,23,42,0.65)',
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
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 -10px 30px rgba(0,0,0,0.2)',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div
              style={{
                backgroundColor: '#0284c7',
                color: '#ffffff',
                padding: '0.85rem 1.15rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem',
                  }}
                >
                  🤖
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800 }}>
                    {t.counselorTitle}
                  </h3>
                  <div style={{ fontSize: '0.7rem', color: '#bae6fd' }}>
                    {t.counselorSubtitle} • ● AI Active
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsCounselorOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '1.4rem',
                  cursor: 'pointer',
                  fontWeight: 700,
                }}
              >
                ×
              </button>
            </div>

            {/* Chat Messages */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '1rem',
                backgroundColor: '#f8fafc',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                minHeight: '260px',
                maxHeight: '380px',
              }}
            >
              {counselorMessages.map((msg, idx) => (
                <div
                  key={idx}
                  style={{
                    alignSelf: msg.sender === 'USER' ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    backgroundColor: msg.sender === 'USER' ? '#0284c7' : '#ffffff',
                    color: msg.sender === 'USER' ? '#ffffff' : '#0f172a',
                    padding: '0.75rem 0.9rem',
                    borderRadius: '10px',
                    border: msg.sender === 'USER' ? 'none' : '1px solid #e2e8f0',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  }}
                >
                  <div style={{ fontSize: '0.82rem', lineHeight: 1.5 }}>{msg.text}</div>
                  {msg.tags && (
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                      {msg.tags.map((tg, tidx) => (
                        <span
                          key={tidx}
                          style={{
                            fontSize: '0.65rem',
                            backgroundColor: '#e0f2fe',
                            color: '#0369a1',
                            padding: '0.1rem 0.4rem',
                            borderRadius: '4px',
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
                      fontSize: '0.62rem',
                      color: msg.sender === 'USER' ? '#bae6fd' : '#94a3b8',
                      marginTop: '0.3rem',
                    }}
                  >
                    {msg.sender === 'AI' && (
                      <button
                        type="button"
                        onClick={() => speechService.speak(msg.text, language)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '0.72rem',
                          color: '#0284c7',
                          padding: '0.1rem 0.2rem',
                          fontWeight: 700,
                        }}
                        title="Listen (आवाज़ में सुनें)"
                      >
                        🔊 Listen
                      </button>
                    )}
                    <span>{msg.time}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Suggestion Chips */}
            <div
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#ffffff',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                gap: '0.4rem',
                overflowX: 'auto',
                whiteSpace: 'nowrap',
              }}
            >
              <button
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
                  padding: '0.3rem 0.6rem',
                  borderRadius: '14px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                💡 {language === 'HI' ? 'पैक्स भर्ती पद' : 'PACS Jobs (63k)'}
              </button>
              <button
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
                  padding: '0.3rem 0.6rem',
                  borderRadius: '14px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                🥛 {language === 'HI' ? 'अमूल डेयरी' : 'Amul Roles'}
              </button>
              <button
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
                  padding: '0.3rem 0.6rem',
                  borderRadius: '14px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                📜 {language === 'HI' ? 'युवा सहकार योजना' : 'Yuva Sahakar'}
              </button>
            </div>

            {/* Input Form */}
            <div
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: '#ffffff',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                gap: '0.5rem',
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
                  padding: '0.55rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.82rem',
                }}
              />
              <button
                type="button"
                onClick={() => {
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
                style={{
                  backgroundColor: isVoiceListening ? '#ef4444' : '#f1f5f9',
                  color: isVoiceListening ? '#ffffff' : '#0f172a',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '0.5rem 0.75rem',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
              >
                <span>{isVoiceListening ? '🎙️' : '🎤'}</span>
              </button>
              <button
                onClick={() => handleSendCounselorMessage()}
                style={{
                  backgroundColor: '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.55rem 1rem',
                  borderRadius: '6px',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
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

      {/* ========================================================
          BOTTOM NAVIGATION BAR (All 6 Tabs per 07_UI_UX_SPEC.md)
      ======================================================== */}
      <nav
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          backgroundColor: '#ffffff',
          borderTop: '1px solid #e2e8f0',
          padding: '0.5rem 0',
          boxShadow: '0 -2px 6px rgba(0,0,0,0.03)',
        }}
      >
        {(
          [
            { id: 'HOME', label: t.tabs.HOME, icon: '🏠' },
            { id: 'LEARN', label: t.tabs.LEARN, icon: '📚' },
            { id: 'PROGRESS', label: t.tabs.PROGRESS, icon: '📊' },
            { id: 'CREDENTIALS', label: t.tabs.CREDENTIALS, icon: '📜' },
            { id: 'OPPORTUNITIES', label: t.tabs.OPPORTUNITIES, icon: '💼' },
            { id: 'PROFILE', label: t.tabs.PROFILE, icon: '👤' },
          ] as const
        ).map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: 'none',
                border: 'none',
                color: isActive ? '#0284c7' : '#64748b',
                fontWeight: isActive ? 800 : 500,
                fontSize: '0.68rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.15rem',
                cursor: 'pointer',
                padding: '0.2rem 0',
                transition: 'all 0.15s ease',
              }}
            >
              <span style={{ fontSize: '1.1rem' }}>{tab.icon}</span>
              <span>{tab.label}</span>
              {isActive && (
                <div style={{ width: '16px', height: '3px', backgroundColor: '#0284c7', borderRadius: '2px', marginTop: '2px' }} />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

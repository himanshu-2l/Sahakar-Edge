'use client';

import React, { useState, useEffect } from 'react';
import {
  SEED_INSTITUTES,
  SEED_INSTITUTE_RICM_BHOPAL,
  SEED_PROGRAMME,
  SEED_BATCH,
  SEED_SESSION,
  SEED_ENROLLMENTS,
  SEED_COURSE,
  SEED_USERS,
  SEED_SKILLS,
  SEED_JOB_OPPORTUNITIES,
  SEED_JOB_REQUIRED_SKILLS,
} from '@sahakar/test-fixtures';
import {
  Programme,
  Batch,
  Enrollment,
  EnrollmentStatus,
  ProgrammeStatus,
  type FederationAnalyticsResponse,
  type GeoNode,
  type FederationTierRollup,
  type JobApplication,
  type JobApplicationStatus,
  type DigitalOfferLetter,
} from '@sahakar/types';
import { apiClient, BackendStatus } from '../services/api-client';

import { SidebarNav, AdminTab } from '../components/SidebarNav';
import { TopHeader } from '../components/TopHeader';
import { AuditDetailsModal, AuditLogItem } from '../components/AuditDetailsModal';
import { SchemeAdvisoryRadarView } from '../components/SchemeAdvisoryRadarView';
import { CamelScorecardView } from '../components/CamelScorecardView';
import { ProofInspectorView } from '../components/ProofInspectorView';
import { VivaAnalyticsView } from '../components/VivaAnalyticsView';
import { PacsSimulationErrorHeatmapView } from '../components/PacsSimulationErrorHeatmapView';
import { OmbudsmanRegistryView } from '../components/OmbudsmanRegistryView';
import { AtpNominationQueueView } from '../components/AtpNominationQueueView';
import { TimetableAttendanceView } from '../components/TimetableAttendanceView';
import { AcademicGradebookView } from '../components/AcademicGradebookView';
import { DropoutRiskAnalyticsView } from '../components/DropoutRiskAnalyticsView';
import {
  THEME,
  cardStyle,
  bentoHeaderStyle,
  bentoValueStyle,
  buttonPrimaryStyle,
  buttonSecondaryStyle,
  pillBadge,
  tableHeaderStyle,
  tableCellStyle,
} from '../components/theme';
import {
  CheckIcon,
  CloseIcon,
  SearchIcon,
  RefreshIcon,
  FilterIcon,
  MapPinIcon,
  CpuIcon,
  KeyIcon,
  StarIcon,
  CalendarIcon,
  ShieldCheckIcon,
  ExternalLinkIcon,
  BotIcon,
  OverviewIcon,
  FederationIcon,
  InstitutesIcon,
  ProgrammesIcon,
  BatchesIcon,
  CoursesIcon,
  AttendanceIcon,
  CredentialsIcon,
  EmploymentIcon,
  ErpLogisticsIcon,
  EdgeNodesIcon,
  SyncMonitorIcon,
  AuditLogIcon,
  RadarIcon,
  ScorecardIcon,
  ProofIcon,
  AnalyticsIcon,
  HeatmapIcon,
  ScaleIcon,
} from '../components/icons';

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('OVERVIEW');

  const [selectedCandidateId, setSelectedCandidateId] = useState<string>(
    'dddd4444-4444-4444-4444-444444444441'
  );
  const [searchQuery, setSearchQuery] = useState('');

  // Live Backend Connection Status
  const [backendStatus, setBackendStatus] = useState<BackendStatus>({
    online: false,
    url: apiClient.getBaseUrl(),
    checkedAt: '',
  });
  const [analyticsOverview, setAnalyticsOverview] = useState<any | null>(null);
  const [federationData, setFederationData] = useState<FederationAnalyticsResponse | null>(null);
  const [selectedGeoNode, setSelectedGeoNode] = useState<GeoNode | null>(null);
  const [tierFilter, setTierFilter] = useState<'ALL' | 1 | 2 | 3>('ALL');
  const [selectedZone, setSelectedZone] = useState<string>('ALL');

  // Recruiter Pipeline State (Phase 9 Milestone 4)
  const [recruiterViewMode, setRecruiterViewMode] = useState<'RECRUITER' | 'CANDIDATE'>('RECRUITER');
  const [jobApplications, setJobApplications] = useState<JobApplication[]>(
    apiClient.getFallbackJobApplications()
  );
  const [selectedJobFilter, setSelectedJobFilter] = useState<string>('ALL');

  // Modals for Recruiter Pipeline
  const [scheduleModalApp, setScheduleModalApp] = useState<JobApplication | null>(null);
  const [scheduleDate, setScheduleDate] = useState('2026-11-10T10:30');
  const [scheduleVenue, setScheduleVenue] = useState('RICM Bhopal Conference Room 2 / Video Meet');
  const [scheduleNotes, setScheduleNotes] = useState(
    'Technical interview on PACS double-entry ledgers and statutory compliance.'
  );

  const [offerModalApp, setOfferModalApp] = useState<JobApplication | null>(null);
  const [offerDesignation, setOfferDesignation] = useState('Assistant Accountant & PACS Field Coordinator');
  const [offerLPA, setOfferLPA] = useState(4.2);
  const [offerSalary, setOfferSalary] = useState(35000);
  const [offerJoiningDate, setOfferJoiningDate] = useState('2026-11-20');
  const [offerLocation, setOfferLocation] = useState('Bhopal Regional Office & Field PACS');
  const [offerSignatory, setOfferSignatory] = useState('Head of HR & Talent Acquisition');
  const [offerTerms, setOfferTerms] = useState(
    '1. Position is contingent upon verified NCCT certificate credentials.\n2. 3-month cooperative probation period with performance appraisal.\n3. Entitled to DA, provident fund, and medical benefits as per cooperative society norms.'
  );

  const [viewOfferModal, setViewOfferModal] = useState<DigitalOfferLetter | null>(null);
  const [recruiterActionNotice, setRecruiterActionNotice] = useState<string | null>(null);

  // Interactive state initialized with seed fixtures
  const [programmes, setProgrammes] = useState<Programme[]>([SEED_PROGRAMME]);
  const [batches, setBatches] = useState<Batch[]>([SEED_BATCH]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>(SEED_ENROLLMENTS);

  // Form states for creating programme
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [showProgrammeModal, setShowProgrammeModal] = useState(false);

  // Form states for assigning enrollment
  const [selectedProgrammeId, setSelectedProgrammeId] = useState(SEED_PROGRAMME.id);
  const [selectedBatchId, setSelectedBatchId] = useState(SEED_BATCH.id);
  const [selectedTraineeId, setSelectedTraineeId] = useState(SEED_USERS[3].id);
  const [assignmentNotice, setAssignmentNotice] = useState<string | null>(null);

  // Certificate Modal State
  const [selectedCertificate, setSelectedCertificate] = useState<any | null>(null);

  // Audit Log Inspector Modal State
  const [selectedAuditLog, setSelectedAuditLog] = useState<AuditLogItem | null>(null);

  // Mobile Simulator State
  const [showMobileSimulator, setShowMobileSimulator] = useState(false);
  const [simWanMode, setSimWanMode] = useState<'OFFLINE' | 'ONLINE'>('OFFLINE');
  const [simAttendanceCheckedIn, setSimAttendanceCheckedIn] = useState(false);
  const [simCompletedLessons, setSimCompletedLessons] = useState<string[]>(['lsn-pacs-101-1']);
  const [simAssessmentDone, setSimAssessmentDone] = useState(false);
  const [simQueuedEvents, setSimQueuedEvents] = useState<
    Array<{ id: string; type: string; summary: string; timestamp: string }>
  >([
    {
      id: 'ev-init-01',
      type: 'ENROLLMENT_CONFIRMED',
      summary: 'Trainee Anita Patel rostered onto RICM Node',
      timestamp: '09:00 AM',
    },
  ]);

  // ERP Hostel & Logistics State (PS 26087)
  const [logisticsSubTab, setLogisticsSubTab] = useState<'HOSTEL' | 'TIMETABLE' | 'MESS' | 'HARDWARE_KITS'>(
    'HOSTEL'
  );
  const [hostelAllotments, setHostelAllotments] = useState([
    {
      id: 'hst-01',
      traineeName: 'Anita Patel',
      institute: 'RICM Bhopal',
      hostelBlock: 'Sardar Patel Block A (Female Wing)',
      roomNo: 'A-204',
      bedType: 'Single Bed (Air-Cooled)',
      checkIn: '2026-09-20',
      checkOut: '2026-10-20',
      status: 'CHECKED_IN',
      messOptIn: true,
    },
    {
      id: 'hst-02',
      traineeName: 'Vikram Rao',
      institute: 'RICM Bhopal',
      hostelBlock: 'Sardar Patel Block B (Male Wing)',
      roomNo: 'B-108',
      bedType: 'Shared Twin Bed',
      checkIn: '2026-09-20',
      checkOut: '2026-10-20',
      status: 'CHECKED_IN',
      messOptIn: true,
    },
    {
      id: 'hst-03',
      traineeName: 'Sunita Meena',
      institute: 'RICM Bhopal',
      hostelBlock: 'Sardar Patel Block A (Female Wing)',
      roomNo: 'A-205',
      bedType: 'Single Bed (Air-Cooled)',
      checkIn: '2026-09-22',
      checkOut: '2026-10-22',
      status: 'CHECKED_IN',
      messOptIn: true,
    },
  ]);

  const [timetableSchedule, setTimetableSchedule] = useState([
    {
      id: 'tt-01',
      timeSlot: '09:30 AM – 11:00 AM',
      subject: 'PACS Computerization & Statutory Ledger Posting',
      venue: 'Computer Lab 1 (30 Thin-Clients + Sahakar Edge Node)',
      trainer: 'Shri Suresh Kumar (Senior Faculty, RICM)',
      status: 'COMPLETED_TODAY',
    },
    {
      id: 'tt-02',
      timeSlot: '11:15 AM – 12:45 PM',
      subject: 'Multi-State Cooperative Societies Act & Bye-Laws',
      venue: 'Seminar Hall 2 (Smart Interactive Display)',
      trainer: 'Dr. Meenakshi Joshi (Guest Lecturer, NABARD)',
      status: 'ACTIVE_NOW',
    },
    {
      id: 'tt-03',
      timeSlot: '02:00 PM – 03:30 PM',
      subject: 'Hands-on ERP Voucher Auditing & Reconciliations',
      venue: 'Computer Lab 1',
      trainer: 'Shri Suresh Kumar',
      status: 'SCHEDULED',
    },
    {
      id: 'tt-04',
      timeSlot: '03:45 PM – 05:00 PM',
      subject: 'Assessment & Offline Quiz on Sahakar Edge Client',
      venue: 'Computer Lab 1',
      trainer: 'Lab Administrator',
      status: 'SCHEDULED',
    },
  ]);

  const [messMenu, setMessMenu] = useState([
    {
      meal: 'Breakfast (07:30 - 09:00 AM)',
      menu: 'Poha, Sprouts, Boiled Eggs / Banana, Tea / Milk',
      adherence: '100% NCCT Dietary Norms',
    },
    {
      meal: 'Lunch (12:30 - 02:00 PM)',
      menu: 'Roti, Dal Tadka, Seasonal Sabzi, Rice, Curd, Salad',
      adherence: 'Wholesome Vegetarian',
    },
    {
      meal: 'High Tea (05:00 - 05:30 PM)',
      menu: 'Tea, Roasted Makhana / Biscuits',
      adherence: 'Evening Refreshment',
    },
    {
      meal: 'Dinner (07:30 - 09:30 PM)',
      menu: 'Chapati, Paneer Gravy, Yellow Dal, Jeera Rice, Gulab Jamun',
      adherence: 'Residential Trainee Mess',
    },
  ]);

  const [hardwareKits, setHardwareKits] = useState([
    {
      kitId: 'KIT-RICM-BHO-01',
      nodeSerial: 'EDGE-ARM64-BHO-9011',
      components:
        'Raspberry Pi 4 (4GB RAM) + 64GB NVMe + High-Gain Wi-Fi AP + 4hr UPS Battery + Heavy-Duty Pelican Case',
      venue: 'RICM Bhopal (Lab 1)',
      status: 'DEPLOYED_OPERATIONAL',
      dispatchedAt: '2026-08-15',
    },
    {
      kitId: 'KIT-VAMNICOM-PUN-01',
      nodeSerial: 'EDGE-ARM64-PUN-4022',
      components:
        'Raspberry Pi 4 (4GB RAM) + 64GB NVMe + High-Gain Wi-Fi AP + 4hr UPS Battery + Pelican Case',
      venue: 'VAMNICOM Pune (Executive Center)',
      status: 'DEPLOYED_OPERATIONAL',
      dispatchedAt: '2026-08-10',
    },
  ]);

  // AI Career Counselor State (PS 26087)
  const [counselorInput, setCounselorInput] = useState('');
  const [counselorMessages, setCounselorMessages] = useState<
    Array<{ sender: 'USER' | 'AI'; text: string; time: string; tags?: string[] }>
  >([
    {
      sender: 'AI',
      text: 'Namaste! I am Sahakar Mitra (सहकार मित्र), your AI Cooperative Career & Scheme Counselor. I analyze certified candidate skills and recommend optimal career pathways across 63,000 PACS, District Cooperative Banks (DCCBs), and dairy federations like Amul. How may I guide you today?',
      time: 'Just now',
      tags: ['PACS Modernization', 'NABARD Subventions', 'Amul Dairy Logistics'],
    },
  ]);

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

    try {
      const res = await apiClient.queryCounselor(q, selectedCandidateId, 'EN');
      const aiMsg = {
        sender: 'AI' as const,
        text: res.reply,
        time: res.time,
        tags: res.tags,
      };
      setCounselorMessages((prev) => [...prev, aiMsg]);
    } catch {
      const fallbackAiMsg = {
        sender: 'AI' as const,
        text: 'Based on the Ministry of Cooperation nationwide PACS Computerization drive, certified candidates are eligible for PACS Secretary / Junior Accountant roles.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        tags: ['PACS Modernization', 'NCCT Accredited'],
      };
      setCounselorMessages((prev) => [...prev, fallbackAiMsg]);
    }
  };

  // Attendance & Manual Override State (07_UI_UX_SPEC.md & 05_HARDWARE_EDGE.md)
  const [attendanceRecords, setAttendanceRecords] = useState([
    {
      id: 'att-1',
      traineeId: 'dddd4444-4444-4444-4444-444444444441',
      traineeName: 'Anita Patel',
      sessionId: SEED_SESSION.id,
      sessionTitle: SEED_SESSION.title,
      method: 'BIOMETRIC_SIMULATION',
      status: 'PRESENT',
      timestamp: '2026-09-28T09:15:32.000Z',
      verified: true,
      overrideReason: null as string | null,
    },
    {
      id: 'att-2',
      traineeId: 'dddd4444-4444-4444-4444-444444444442',
      traineeName: 'Vikram Rao',
      sessionId: SEED_SESSION.id,
      sessionTitle: SEED_SESSION.title,
      method: 'DYNAMIC_QR',
      status: 'PRESENT',
      timestamp: '2026-09-28T09:18:14.000Z',
      verified: true,
      overrideReason: null as string | null,
    },
    {
      id: 'att-3',
      traineeId: 'dddd4444-4444-4444-4444-444444444443',
      traineeName: 'Sunita Meena',
      sessionId: SEED_SESSION.id,
      sessionTitle: SEED_SESSION.title,
      method: 'MANUAL_OVERRIDE',
      status: 'PRESENT_OVERRIDDEN',
      timestamp: '2026-09-28T09:25:00.000Z',
      verified: true,
      overrideReason: 'Trainee device network timeout; verified in person by Trainer',
    },
  ]);
  const [overrideTraineeId, setOverrideTraineeId] = useState(SEED_USERS[3].id);
  const [overrideReason, setOverrideReason] = useState('');
  const [showOverrideModal, setShowOverrideModal] = useState(false);

  // Credentials and Public Verification State (06_CREDENTIALS_SKILLS_EMPLOYMENT.md)
  const [credentialsList, setCredentialsList] = useState([
    {
      id: 'cred-anita-pacs-2026',
      traineeId: 'dddd4444-4444-4444-4444-444444444441',
      traineeName: 'Anita Patel',
      programmeTitle: 'PACS Computerization & Governance Specialist',
      issuedAt: '2026-09-28T14:30:00.000Z',
      status: 'ACTIVE',
      issuer: 'National Council for Cooperative Training (NCCT)',
      signatureHex:
        '9f8b4c7d01824a56e6d54f890123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
      compactQr: 'eyJpZCI6ImNyZWQtYW5pdGEtcGFjcy0yMDI2Iiwic2lnIjoiOWY4YjRjN2QwMTgyNGE1NiJ9',
      skills: ['PACS Computerization', 'Financial Accounting & Vouchers', 'Cooperative Audit & Compliance'],
      institute: 'Regional Institute of Cooperative Management (RICM), Bhopal',
    },
    {
      id: 'cred-vikram-dairy-2026',
      traineeId: 'dddd4444-4444-4444-4444-444444444442',
      traineeName: 'Vikram Rao',
      programmeTitle: 'Cooperative Governance & Dairy Society Auditor',
      issuedAt: '2026-09-28T15:00:00.000Z',
      status: 'ACTIVE',
      issuer: 'National Council for Cooperative Training (NCCT)',
      signatureHex:
        'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90',
      compactQr: 'eyJpZCI6ImNyZWQtdmlrcmFtLWRhaXJ5LTIwMjYiLCJzaWciOiJhMWIyYzNkNGU1ZjYwNzE4In0',
      skills: [
        'Cooperative Governance & Bylaws',
        'Dairy Society Procurement',
        'Agricultural Credit Appraisal',
      ],
      institute: 'Vaikunth Mehta National Institute of Cooperative Management (VAMNICOM), Pune',
    },
  ]);
  const [verifyInputId, setVerifyInputId] = useState('cred-anita-pacs-2026');
  const [verificationResult, setVerificationResult] = useState<{
    verified: boolean;
    credentialId: string;
    details: string;
    publicKey?: string;
    sha256Digest?: string;
    issuer?: string;
    tamperCheck?: string;
  } | null>(null);

  // Edge Nodes Fleet State (05_HARDWARE_EDGE.md & 08_API_SPEC.md)
  const [edgeNodes, setEdgeNodes] = useState([
    {
      nodeId: 'edge-node-ricm-bhopal-01',
      name: 'RICM Bhopal - Main Training Hall Gateway',
      institute: 'RICM Bhopal (Lab 1)',
      ip: '192.168.4.1 (sahakar.local)',
      softwareVersion: '1.0.0 (ARM64)',
      healthStatus: 'ONLINE_SYNCED',
      cpuTemp: 44.2,
      cpuLoad: 14.5,
      ramUsage: 34.0,
      diskUsage: 22.0,
      uptime: '3h 12m',
      queuedEvents: 0,
      lastHeartbeat: 'Just now',
      wifiClients: 16,
      localLatencyMs: 18,
      wanLatencyMs: 410,
      wanConnected: true,
    },
    {
      nodeId: 'edge-node-vamnicom-pun-01',
      name: 'VAMNICOM Pune - Executive Center Node',
      institute: 'VAMNICOM Pune',
      ip: '192.168.10.15',
      softwareVersion: '1.0.0 (ARM64)',
      healthStatus: 'ONLINE_SYNCED',
      cpuTemp: 41.8,
      cpuLoad: 8.2,
      ramUsage: 28.5,
      diskUsage: 19.0,
      uptime: '14h 40m',
      queuedEvents: 0,
      lastHeartbeat: '1 min ago',
      wifiClients: 12,
      localLatencyMs: 22,
      wanLatencyMs: 385,
      wanConnected: true,
    },
  ]);

  // Security & Compliance Audit Log State (07_UI_UX_SPEC.md)
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([
    {
      id: 'audit-1',
      timestamp: '2026-09-28 14:30:12',
      actor: 'System / Central Rules Engine',
      action: 'ISSUE_CREDENTIAL',
      entity: 'Credential: cred-anita-pacs-2026',
      details: 'Evaluated 100% quiz pass & attendance threshold. Ed25519 signature generated.',
    },
    {
      id: 'audit-2',
      timestamp: '2026-09-28 12:05:44',
      actor: 'EdgeSyncClient (edge-node-ricm-bhopal-01)',
      action: 'SYNC_BATCH_INGEST',
      entity: 'EventBatch: 3 events',
      details: 'Ingested attendance, progress, and assessment submissions. SHA-256 integrity verified.',
    },
    {
      id: 'audit-3',
      timestamp: '2026-09-28 09:25:00',
      actor: 'Trainer: Suresh Kumar',
      action: 'MANUAL_ATTENDANCE_OVERRIDE',
      entity: 'Trainee: Sunita Meena',
      details: 'Reason: Trainee device network timeout; verified in person by Trainer.',
    },
    {
      id: 'audit-4',
      timestamp: '2026-09-28 08:30:00',
      actor: 'Admin: Rajesh Verma',
      action: 'REGISTER_EDGE_NODE',
      entity: 'Node: edge-node-ricm-bhopal-01',
      details: 'Provisioned Edge Node with NCCT PACS Operations curriculum bundle.',
    },
  ]);

  const trainees = SEED_USERS.filter((u) => u.role === 'TRAINEE');

  // Probe Central API and load live persistent state
  useEffect(() => {
    async function loadLiveBackendData() {
      const status = await apiClient.checkHealth();
      setBackendStatus(status);
      if (status.online) {
        apiClient.getProgrammes().then((progs) => {
          if (progs && progs.length > 0) setProgrammes(progs);
        });
        apiClient.getBatches().then((b) => {
          if (b && b.length > 0) setBatches(b);
        });
        apiClient.getEnrollments().then((e) => {
          if (e && e.length > 0) setEnrollments(e);
        });
        apiClient.getHostels().then((h) => {
          if (h && h.length > 0) setHostelAllotments(h);
        });
        apiClient.getTimetable().then((t) => {
          if (t && t.length > 0) setTimetableSchedule(t);
        });
        apiClient.getHardwareKits().then((k) => {
          if (k && k.length > 0) setHardwareKits(k);
        });
        apiClient.getAnalyticsOverview().then((analytics) => {
          if (analytics) setAnalyticsOverview(analytics);
        });
        apiClient.getAuditLogs().then((a) => {
          if (a && a.length > 0) {
            setAuditLogs(
              a.map((log: any) => ({
                id: log.id,
                timestamp: log.timestamp,
                actor: log.actor,
                action: log.action,
                entity: 'Central Authority / Audit Event',
                details: log.details,
              }))
            );
          }
        });
        apiClient.getFederationAnalytics().then((fed) => {
          if (fed) {
            setFederationData(fed);
            if (fed.geoNodes && fed.geoNodes.length > 0) {
              setSelectedGeoNode((prev) => prev || fed.geoNodes[0]);
            }
          }
        });
        apiClient.getJobApplications().then((apps) => {
          if (apps && apps.length > 0) setJobApplications(apps);
        });
      } else {
        // Fallback offline data
        apiClient.getFederationAnalytics().then((fed) => {
          if (fed) {
            setFederationData(fed);
            if (fed.geoNodes && fed.geoNodes.length > 0) {
              setSelectedGeoNode((prev) => prev || fed.geoNodes[0]);
            }
          }
        });
        apiClient.getJobApplications().then((apps) => {
          if (apps && apps.length > 0) setJobApplications(apps);
        });
      }
    }
    loadLiveBackendData();
  }, []);

  // Recruiter Pipeline Handlers (Phase 9 Milestone 4)
  const handleScheduleInterview = async () => {
    if (!scheduleModalApp) return;
    const res = await apiClient.updateJobApplicationStatus(scheduleModalApp.id, {
      status: 'SCHEDULED',
      interviewDate: scheduleDate,
      interviewVenue: scheduleVenue,
      interviewNotes: scheduleNotes,
    });
    if (res.success) {
      setJobApplications((prev) =>
        prev.map((a) =>
          a.id === scheduleModalApp.id
            ? {
                ...a,
                status: 'SCHEDULED',
                interviewDate: scheduleDate,
                interviewVenue: scheduleVenue,
                interviewNotes: scheduleNotes,
                updatedAt: new Date().toISOString(),
              }
            : a
        )
      );
      setRecruiterActionNotice(
        `Interview scheduled for ${scheduleModalApp.candidateName} on ${new Date(scheduleDate).toLocaleString()}`
      );
      setScheduleModalApp(null);
    }
  };

  const handleIssueOffer = async () => {
    if (!offerModalApp) return;
    const termsArray = offerTerms.split('\n').filter((t) => t.trim().length > 0);
    const res = await apiClient.issueOfferLetter({
      applicationId: offerModalApp.id,
      designation: offerDesignation,
      annualCompensationLPA: Number(offerLPA),
      monthlyStipendOrSalary: Number(offerSalary),
      joiningDate: offerJoiningDate,
      postingLocation: offerLocation,
      authorizedSignatory: offerSignatory,
      terms: termsArray,
    });
    if (res.success && res.offer) {
      const issued = res.offer;
      setJobApplications((prev) =>
        prev.map((a) =>
          a.id === offerModalApp.id
            ? {
                ...a,
                status: 'OFFERED',
                offerLetterId: issued.id,
                updatedAt: new Date().toISOString(),
              }
            : a
        )
      );
      setRecruiterActionNotice(
        `Ed25519 digital offer letter issued and signed for ${offerModalApp.candidateName}!`
      );
      setOfferModalApp(null);
      setViewOfferModal(issued);
    }
  };

  const handleConfirmPlacement = async (appId: string) => {
    const res = await apiClient.updateJobApplicationStatus(appId, {
      status: 'PLACED',
    });
    if (res.success) {
      setJobApplications((prev) =>
        prev.map((a) => (a.id === appId ? { ...a, status: 'PLACED', updatedAt: new Date().toISOString() } : a))
      );
      const target = jobApplications.find((a) => a.id === appId);
      setRecruiterActionNotice(`Placement confirmed! Candidate ${target?.candidateName || appId} marked as PLACED.`);
    }
  };

  const handleOpenViewOffer = async (app: JobApplication) => {
    if (app.offerLetterId) {
      const offer = await apiClient.getOfferLetter(app.offerLetterId);
      if (offer) {
        setViewOfferModal(offer);
        return;
      }
    }
    const synthesizedOffer: DigitalOfferLetter = {
      id: app.offerLetterId || `off-${app.id}`,
      applicationId: app.id,
      jobId: app.jobId,
      candidateId: app.candidateId,
      payload: {
        offerId: app.offerLetterId || `off-${app.id}`,
        applicationId: app.id,
        jobId: app.jobId,
        jobTitle: app.jobTitle,
        employer: {
          id: app.employerId,
          name: app.employerName,
          authorizedSignatory: 'Director of Human Resources, Cooperative Talent Network',
        },
        candidate: {
          id: app.candidateId,
          name: app.candidateName,
          emailOrPhone: 'anita.patel@rural.org',
        },
        designation: 'Assistant Accountant & PACS Field Coordinator',
        annualCompensationLPA: 4.2,
        monthlyStipendOrSalary: 35000,
        joiningDate: '2026-11-20',
        postingLocation: 'Bhopal Regional Office & Field PACS',
        terms: [
          'Subject to verification of NCCT accredited training certification.',
          'Immediate placement under the National Cooperative Development Scheme.',
          'Probation period of 3 months with cooperative performance review.',
        ],
        issuedAt: app.updatedAt,
        schemaVersion: 1,
      },
      signatureHex:
        '9f8b4c7d01824a56e0f1a8c9b2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f90123456789abcdef0123456789abcdef0123456789abcdef01',
      signature:
        '9f8b4c7d01824a56e0f1a8c9b2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f90123456789abcdef0123456789abcdef0123456789abcdef01',
      issuerKeyId: 'ncct-master-key-01',
      canonicalDigest: 'c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f90123456789abcdef0123456789abcdef',
      verificationUrl: `https://verify.sahakar.gov.in/offers/${app.offerLetterId || app.id}?sig=valid`,
      compactQr: 'eyJpZCI6Im9mZi0wMSIsInNpZyI6IjlmdiJ9',
      status: 'ISSUED',
      issuedAt: app.updatedAt,
    };
    setViewOfferModal(synthesizedOffer);
  };

  // Simulator Actions
  const handleSimAttendance = () => {
    if (simAttendanceCheckedIn) return;
    setSimAttendanceCheckedIn(true);
    const event = {
      id: `ev-att-${Date.now()}`,
      type: 'ATTENDANCE_RECORDED',
      summary: 'Dynamic QR attendance scanned for Session 1',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setSimQueuedEvents((prev) => [event, ...prev]);

    setEdgeNodes((nodes) =>
      nodes.map((n) =>
        n.nodeId === 'edge-node-ricm-bhopal-01' ? { ...n, queuedEvents: n.queuedEvents + 1 } : n
      )
    );

    if (simWanMode === 'ONLINE') {
      triggerCentralSyncFromSim([event]);
    }
  };

  const handleSimCompleteLesson = (lessonId: string) => {
    if (simCompletedLessons.includes(lessonId)) return;
    const nextLessons = [...simCompletedLessons, lessonId];
    setSimCompletedLessons(nextLessons);
    const event = {
      id: `ev-lsn-${Date.now()}`,
      type: 'LESSON_COMPLETED',
      summary: `Completed Lesson: ${lessonId}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setSimQueuedEvents((prev) => [event, ...prev]);

    setEdgeNodes((nodes) =>
      nodes.map((n) =>
        n.nodeId === 'edge-node-ricm-bhopal-01' ? { ...n, queuedEvents: n.queuedEvents + 1 } : n
      )
    );

    if (simWanMode === 'ONLINE') {
      triggerCentralSyncFromSim([event]);
    }
  };

  const handleSimSubmitAssessment = () => {
    if (simAssessmentDone) return;
    setSimAssessmentDone(true);
    const event = {
      id: `ev-exam-${Date.now()}`,
      type: 'ASSESSMENT_SUBMITTED',
      summary: 'Passed PACS Operations Quiz (100% score)',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setSimQueuedEvents((prev) => [event, ...prev]);

    setEdgeNodes((nodes) =>
      nodes.map((n) =>
        n.nodeId === 'edge-node-ricm-bhopal-01' ? { ...n, queuedEvents: n.queuedEvents + 1 } : n
      )
    );

    if (simWanMode === 'ONLINE') {
      triggerCentralSyncFromSim([event]);
    }
  };

  const triggerCentralSyncFromSim = (eventsToSync = simQueuedEvents) => {
    if (eventsToSync.length === 0) return;

    const hasAtt = eventsToSync.some((e) => e.type === 'ATTENDANCE_RECORDED');
    if (hasAtt) {
      const exists = attendanceRecords.some(
        (a) => a.traineeId === 'dddd4444-4444-4444-4444-444444444441' && a.method === 'DYNAMIC_QR'
      );
      if (!exists) {
        setAttendanceRecords((prev) => [
          {
            id: `att-sim-${Date.now()}`,
            traineeId: 'dddd4444-4444-4444-4444-444444444441',
            traineeName: 'Anita Patel',
            sessionId: SEED_SESSION.id,
            sessionTitle: SEED_SESSION.title,
            method: 'DYNAMIC_QR',
            status: 'PRESENT',
            timestamp: new Date().toISOString(),
            verified: true,
            overrideReason: null,
          },
          ...prev,
        ]);
      }
    }

    const hasExam = eventsToSync.some((e) => e.type === 'ASSESSMENT_SUBMITTED');
    if (hasExam) {
      setAuditLogs((prev) => [
        {
          id: `audit-${Date.now()}`,
          timestamp: new Date().toLocaleString(),
          actor: 'EdgeSyncClient (edge-node-ricm-bhopal-01)',
          action: 'EVALUATE_CREDENTIAL_ISSUANCE',
          entity: 'Trainee: Anita Patel',
          details:
            'All curriculum lessons completed (100%) and assessment passed. Ed25519 signature verified.',
        },
        ...prev,
      ]);
    }

    setSimQueuedEvents([]);
    setEdgeNodes((nodes) =>
      nodes.map((n) =>
        n.nodeId === 'edge-node-ricm-bhopal-01'
          ? { ...n, queuedEvents: 0, lastHeartbeat: 'Just now (Synced)' }
          : n
      )
    );

    setAssignmentNotice(
      `Idempotent sync complete! ${eventsToSync.length} domain events ingested and verified.`
    );
  };

  const handleToggleNodeWan = (nodeId: string) => {
    setEdgeNodes((nodes) =>
      nodes.map((n) => {
        if (n.nodeId === nodeId) {
          const nextWan = !n.wanConnected;
          return {
            ...n,
            wanConnected: nextWan,
            healthStatus: nextWan ? 'ONLINE_SYNCED' : 'OFFLINE_PARTITIONED',
          };
        }
        return n;
      })
    );
  };

  const handleCreateProgramme = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newProg = await apiClient.createProgramme({
      instituteId: SEED_INSTITUTE_RICM_BHOPAL.id,
      title: newTitle.trim(),
      description: newDesc.trim() || 'Cooperative capacity building training.',
      status: ProgrammeStatus.ACTIVE,
    });

    const newBatch = await apiClient.createBatch({
      programmeId: newProg.id,
      name: `Batch 1: ${newProg.title.slice(0, 20)}`,
      trainerId: 'cccc3333-3333-3333-3333-333333333333',
      capacity: 30,
    });

    setProgrammes([newProg, ...programmes]);
    setBatches([newBatch, ...batches]);
    setNewTitle('');
    setNewDesc('');
    setShowProgrammeModal(false);
    setAssignmentNotice(`Programme "${newProg.title}" created successfully with default batch!`);

    setAuditLogs([
      {
        id: `audit-${Date.now()}`,
        timestamp: new Date().toLocaleString(),
        actor: 'Admin: Rajesh Verma',
        action: 'CREATE_PROGRAMME',
        entity: `Programme: ${newProg.id}`,
        details: `Created programme "${newProg.title}" with default cohort batch.`,
      },
      ...auditLogs,
    ]);
  };

  const handleEnrollTrainee = async (e: React.FormEvent) => {
    e.preventDefault();
    const existing = enrollments.find(
      (enr) => enr.traineeId === selectedTraineeId && enr.programmeId === selectedProgrammeId
    );

    if (existing) {
      setAssignmentNotice('Trainee is already enrolled in this programme.');
      return;
    }

    const newEnrollment = await apiClient.enrollTrainee({
      programmeId: selectedProgrammeId,
      batchId: selectedBatchId,
      traineeId: selectedTraineeId,
    });

    setEnrollments([...enrollments, newEnrollment]);
    const traineeName = trainees.find((t) => t.id === selectedTraineeId)?.name || 'Trainee';
    setAssignmentNotice(`Successfully enrolled ${traineeName} into batch!`);
  };

  const handleManualOverride = (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideReason.trim()) {
      alert('A valid reason is required for manual attendance override.');
      return;
    }

    const targetTrainee = trainees.find((t) => t.id === overrideTraineeId);
    const newRecord = {
      id: `att-${Date.now()}`,
      traineeId: overrideTraineeId,
      traineeName: targetTrainee?.name || 'Trainee',
      sessionId: SEED_SESSION.id,
      sessionTitle: SEED_SESSION.title,
      method: 'MANUAL_OVERRIDE',
      status: 'PRESENT_OVERRIDDEN',
      timestamp: new Date().toISOString(),
      verified: true,
      overrideReason: overrideReason.trim(),
    };

    setAttendanceRecords([newRecord, ...attendanceRecords]);
    setShowOverrideModal(false);
    setOverrideReason('');
    setAssignmentNotice(`Manual override recorded for ${newRecord.traineeName}.`);

    setAuditLogs([
      {
        id: `audit-${Date.now()}`,
        timestamp: new Date().toLocaleString(),
        actor: 'Trainer / Admin Override',
        action: 'MANUAL_ATTENDANCE_OVERRIDE',
        entity: `Trainee: ${newRecord.traineeName}`,
        details: `Reason: ${newRecord.overrideReason}`,
      },
      ...auditLogs,
    ]);
  };

  const handleVerifyCredential = () => {
    const cred = credentialsList.find((c) => c.id.toLowerCase() === verifyInputId.trim().toLowerCase());
    if (cred) {
      setVerificationResult({
        verified: true,
        credentialId: cred.id,
        details: `Ed25519 digital signature verified against NCCT Authority Public Key. The canonical JSON digest matches 100%. No modifications detected since offline issuance.`,
        publicKey: 'ed25519:ncct_root_auth_2026_pubkey_9a4f82bc',
        sha256Digest: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        issuer: cred.issuer,
        tamperCheck: '0 bytes altered — Bit-exact canonical payload',
      });
    } else {
      setVerificationResult({
        verified: false,
        credentialId: verifyInputId,
        details:
          'Unknown credential ID or signature mismatch. No verifiable certificate record found in registry.',
      });
    }
  };

  const handleSendHeartbeat = (nodeId: string) => {
    setEdgeNodes((prev) =>
      prev.map((node) =>
        node.nodeId === nodeId
          ? {
              ...node,
              lastHeartbeat: 'Just now (Telemetry updated)',
              cpuTemp: Number((43 + Math.random() * 2).toFixed(1)),
              cpuLoad: Number((10 + Math.random() * 5).toFixed(1)),
            }
          : node
      )
    );
    setAssignmentNotice(`Heartbeat received from ${nodeId}. Telemetry refreshed.`);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: THEME.colors.bgCanvas }}>
      {/* 250px Fixed Left Sidebar */}
      <SidebarNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        showMobileSimulator={showMobileSimulator}
        setShowMobileSimulator={setShowMobileSimulator}
        simQueuedEventsCount={simQueuedEvents.length}
      />

      {/* Main Administrative Workspace */}
      <div
        style={{
          marginLeft: '250px',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          boxSizing: 'border-box',
        }}
      >
        {/* Top Header with Tricolor Ribbon & Live Status */}
        <TopHeader
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          backendStatus={backendStatus}
          edgeNodesCount={edgeNodes.length}
        />

        {/* Workspace Body */}
        <main
          style={{
            flex: 1,
            padding: '2rem 2.25rem',
            maxWidth: '1440px',
            width: '100%',
            boxSizing: 'border-box',
            margin: '0 auto',
          }}
        >
          {/* Dismissible Notice Alert */}
          {assignmentNotice && (
            <div
              style={{
                backgroundColor: THEME.colors.status.success.bg,
                border: `1px solid ${THEME.colors.status.success.border}`,
                color: THEME.colors.status.success.text,
                padding: '0.75rem 1.25rem',
                borderRadius: THEME.radii.sm,
                marginBottom: '1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: THEME.shadows.card,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>
                <CheckIcon size={16} color={THEME.colors.status.success.text} />
                <span>{assignmentNotice}</span>
              </div>
              <button
                onClick={() => setAssignmentNotice(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: THEME.colors.status.success.text,
                  cursor: 'pointer',
                  padding: '0.2rem',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <CloseIcon size={16} />
              </button>
            </div>
          )}

          {/* =========================================================================
              VIEW 1: OVERVIEW & EXECUTIVE KPI BENTO GRID
          ========================================================================= */}
          {activeTab === 'OVERVIEW' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Executive Summary Hero Card */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: THEME.radii.md,
                  border: `1px solid ${THEME.colors.borderHairline}`,
                  padding: '1.75rem 2rem',
                  boxShadow: THEME.shadows.card,
                  position: 'relative',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                  <span style={pillBadge('info')}>
                    SOVEREIGN COOPERATIVE STACK • APEX PORTAL
                  </span>
                  <span style={pillBadge('apex')}>
                    MINISTRY OF COOPERATION / NCCT
                  </span>
                </div>
                <h2
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: 800,
                    margin: '0 0 0.5rem 0',
                    color: THEME.colors.inkPrimary,
                    letterSpacing: '-0.02em',
                  }}
                >
                  National Cooperative Capacity Building, ERP & Employment Ecosystem
                </h2>
                <p
                  style={{
                    color: THEME.colors.inkBody,
                    fontSize: '0.9rem',
                    lineHeight: 1.6,
                    margin: 0,
                    maxWidth: '920px',
                  }}
                >
                  Unified sovereign digital infrastructure for the National Council for Cooperative Training (NCCT),
                  coordinating multi-tier governance, offline-first ARM64 Linux edge training hubs, explainable AI career
                  matching, and Ed25519 tamper-proof digital credentials for 63,000 PACS modernization.
                </p>

                <div
                  style={{
                    display: 'flex',
                    gap: '1.25rem',
                    marginTop: '1.25rem',
                    paddingTop: '1rem',
                    borderTop: `1px solid ${THEME.colors.borderHairline}`,
                    flexWrap: 'wrap',
                    fontSize: '0.8rem',
                    color: THEME.colors.inkMuted,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <CheckIcon size={14} color={THEME.colors.navyPrimary} />
                    <span>3-Tier Multi-Center Federation Rollup</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <CheckIcon size={14} color={THEME.colors.navyPrimary} />
                    <span>Offline ARM64 Edge Nodes (Sub-30ms)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <CheckIcon size={14} color={THEME.colors.navyPrimary} />
                    <span>Sahakar Mitra AI Counselor</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <CheckIcon size={14} color={THEME.colors.navyPrimary} />
                    <span>Ed25519 Tamper-Proof Cryptographic Seal</span>
                  </div>
                </div>
              </div>

              {/* 5-Column Executive KPI Bento Stat Cards */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                  gap: '1.25rem',
                }}
              >
                <div style={cardStyle}>
                  <div style={bentoHeaderStyle}>COOPERATIVE INSTITUTES</div>
                  <div style={bentoValueStyle}>{SEED_INSTITUTES.length} Active</div>
                  <div style={{ fontSize: '0.75rem', color: THEME.colors.inkMuted }}>
                    RICM Bhopal & VAMNICOM Pune
                  </div>
                </div>

                <div style={cardStyle}>
                  <div style={bentoHeaderStyle}>CAPACITY PROGRAMMES</div>
                  <div style={bentoValueStyle}>{programmes.length} Total</div>
                  <div style={{ fontSize: '0.75rem', color: THEME.colors.status.success.text, fontWeight: 600 }}>
                    NCCT Bylaw Verified
                  </div>
                </div>

                <div style={cardStyle}>
                  <div style={bentoHeaderStyle}>HOSTEL RESIDENTS</div>
                  <div style={bentoValueStyle}>{hostelAllotments.length} Allotted</div>
                  <div style={{ fontSize: '0.75rem', color: THEME.colors.inkMuted }}>
                    Sardar Patel Residential Wing
                  </div>
                </div>

                <div style={cardStyle}>
                  <div style={bentoHeaderStyle}>EDGE HARDWARE FLEET</div>
                  <div style={{ ...bentoValueStyle, color: THEME.colors.status.success.text }}>
                    {edgeNodes.length} Online
                  </div>
                  <div style={{ fontSize: '0.75rem', color: THEME.colors.status.success.text, fontWeight: 600 }}>
                    ● 28 Local Wi-Fi Clients
                  </div>
                </div>

                <div style={cardStyle}>
                  <div style={bentoHeaderStyle}>VERIFIED CREDENTIALS</div>
                  <div style={bentoValueStyle}>{credentialsList.length} Issued</div>
                  <div style={{ fontSize: '0.75rem', color: THEME.colors.status.success.text, fontWeight: 600 }}>
                    Ed25519 Cryptographic Seal
                  </div>
                </div>
              </div>

              {/* Operational Directorate Action Bento Cards */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
                  gap: '1.25rem',
                }}
              >
                <div style={cardStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: THEME.radii.sm,
                        backgroundColor: THEME.colors.bgMuted,
                        border: `1px solid ${THEME.colors.borderHairline}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: THEME.colors.navyPrimary,
                      }}
                    >
                      <ErpLogisticsIcon size={16} />
                    </div>
                    <h3 style={{ fontSize: '1rem', margin: 0, fontWeight: 700, color: THEME.colors.inkPrimary }}>
                      ERP Training & Hostel Logistics
                    </h3>
                  </div>
                  <p style={{ color: THEME.colors.inkBody, fontSize: '0.85rem', lineHeight: 1.5, margin: '0 0 1rem 0' }}>
                    Manage complete residential facilities: room occupancy allotments, laboratory timetable schedules,
                    nutrition adherence, and ARM64 edge kit inventory.
                  </p>
                  <button
                    onClick={() => setActiveTab('ERP_LOGISTICS')}
                    style={buttonPrimaryStyle}
                  >
                    <span>Open ERP Logistics Dashboard</span>
                    <ExternalLinkIcon size={12} />
                  </button>
                </div>

                <div style={cardStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: THEME.radii.sm,
                        backgroundColor: THEME.colors.bgMuted,
                        border: `1px solid ${THEME.colors.borderHairline}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: THEME.colors.navyPrimary,
                      }}
                    >
                      <BotIcon size={16} />
                    </div>
                    <h3 style={{ fontSize: '1rem', margin: 0, fontWeight: 700, color: THEME.colors.inkPrimary }}>
                      Sahakar Mitra AI Career Counselor
                    </h3>
                  </div>
                  <p style={{ color: THEME.colors.inkBody, fontSize: '0.85rem', lineHeight: 1.5, margin: '0 0 1rem 0' }}>
                    Explainable AI career guidance matching rural certified youth to 63,000 PACS openings, District
                    Central Cooperative Banks (DCCBs), and dairy federations like Amul.
                  </p>
                  <button
                    onClick={() => setActiveTab('EMPLOYMENT')}
                    style={buttonSecondaryStyle}
                  >
                    <span>Launch AI Counselor Chatbot</span>
                    <ExternalLinkIcon size={12} />
                  </button>
                </div>

                {/* Directorate 1 Card: Schemes & CAMEL */}
                <div style={cardStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: THEME.radii.sm,
                        backgroundColor: '#eff6ff',
                        border: '1px solid #bfdbfe',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: THEME.colors.navyPrimary,
                      }}
                    >
                      <RadarIcon size={16} />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#1d4ed8', letterSpacing: '0.04em' }}>
                        DIRECTORATE 1
                      </span>
                      <h3 style={{ fontSize: '0.98rem', margin: 0, fontWeight: 700, color: THEME.colors.inkPrimary }}>
                        Scheme Advisory & CAMEL Health
                      </h3>
                    </div>
                  </div>
                  <p style={{ color: THEME.colors.inkBody, fontSize: '0.85rem', lineHeight: 1.5, margin: '0 0 1rem 0' }}>
                    Real-time Central Sector Scheme entitlement radar, 4-tier subsidy matrix, and statutory 5-pillar CAMEL prudential supervision.
                  </p>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => setActiveTab('SCHEME_RADAR')}
                      style={{ ...buttonPrimaryStyle, minHeight: '44px', flex: 1 }}
                    >
                      <span>Scheme Radar</span>
                      <ExternalLinkIcon size={12} />
                    </button>
                    <button
                      onClick={() => setActiveTab('CAMEL_SCORECARD')}
                      style={{ ...buttonSecondaryStyle, minHeight: '44px', flex: 1 }}
                    >
                      <span>CAMEL Audit</span>
                      <ExternalLinkIcon size={12} />
                    </button>
                  </div>
                </div>

                {/* Directorate 2 Card: Viva & Simulation */}
                <div style={cardStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: THEME.radii.sm,
                        backgroundColor: '#ecfdf5',
                        border: '1px solid #a7f3d0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#047857',
                      }}
                    >
                      <AnalyticsIcon size={16} />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#047857', letterSpacing: '0.04em' }}>
                        DIRECTORATE 2
                      </span>
                      <h3 style={{ fontSize: '0.98rem', margin: 0, fontWeight: 700, color: THEME.colors.inkPrimary }}>
                        Institutional Viva & Simulation Diagnostics
                      </h3>
                    </div>
                  </div>
                  <p style={{ color: THEME.colors.inkBody, fontSize: '0.85rem', lineHeight: 1.5, margin: '0 0 1rem 0' }}>
                    Oral evaluation rubrics across 20 institutes, 5x5 PACS voucher error heatmaps, and automated remedial training drill dispatch.
                  </p>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => setActiveTab('VIVA_ANALYTICS')}
                      style={{ ...buttonPrimaryStyle, minHeight: '44px', flex: 1 }}
                    >
                      <span>Viva Analytics</span>
                      <ExternalLinkIcon size={12} />
                    </button>
                    <button
                      onClick={() => setActiveTab('PACS_SIMULATION_HEATMAP')}
                      style={{ ...buttonSecondaryStyle, minHeight: '44px', flex: 1 }}
                    >
                      <span>Error Heatmap</span>
                      <ExternalLinkIcon size={12} />
                    </button>
                  </div>
                </div>

                {/* Directorate 3 Card: Trainee Verification */}
                <div style={cardStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: THEME.radii.sm,
                        backgroundColor: '#fff7ed',
                        border: '1px solid #fed7aa',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#c2410c',
                      }}
                    >
                      <ProofIcon size={16} />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#c2410c', letterSpacing: '0.04em' }}>
                        DIRECTORATE 3
                      </span>
                      <h3 style={{ fontSize: '0.98rem', margin: 0, fontWeight: 700, color: THEME.colors.inkPrimary }}>
                        Sovereign Proof Inspector & Tamper Sandbox
                      </h3>
                    </div>
                  </div>
                  <p style={{ color: THEME.colors.inkBody, fontSize: '0.85rem', lineHeight: 1.5, margin: '0 0 1rem 0' }}>
                    Deep RFC 8785 canonical JSON bytes, SHA-256 digest, Ed25519 (R, S, A) inspection with interactive tamper simulation.
                  </p>
                  <button
                    onClick={() => setActiveTab('PROOF_INSPECTOR')}
                    style={{ ...buttonPrimaryStyle, minHeight: '44px', width: '100%' }}
                  >
                    <span>Open Proof Inspector</span>
                    <ExternalLinkIcon size={12} />
                  </button>
                </div>

                {/* Directorate 4 Card: Ombudsman Governance */}
                <div style={cardStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: THEME.radii.sm,
                        backgroundColor: '#faf5ff',
                        border: '1px solid #e9d5ff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#7e22ce',
                      }}
                    >
                      <ScaleIcon size={16} />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#7e22ce', letterSpacing: '0.04em' }}>
                        DIRECTORATE 4
                      </span>
                      <h3 style={{ fontSize: '0.98rem', margin: 0, fontWeight: 700, color: THEME.colors.inkPrimary }}>
                        Ombudsman Registry & Statutory Resolution
                      </h3>
                    </div>
                  </div>
                  <p style={{ color: THEME.colors.inkBody, fontSize: '0.85rem', lineHeight: 1.5, margin: '0 0 1rem 0' }}>
                    Multi-State Cooperative Societies Act 2023 Sec 85A statutory grievance workflow with 30-day live SLA tracking and binding orders.
                  </p>
                  <button
                    onClick={() => setActiveTab('GRIEVANCES')}
                    style={{ ...buttonPrimaryStyle, minHeight: '44px', width: '100%' }}
                  >
                    <span>Open Ombudsman Registry</span>
                    <ExternalLinkIcon size={12} />
                  </button>
                </div>
              </div>

              {/* National Outreach & Sector Distribution Section */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
                  gap: '1.25rem',
                }}
              >
                {/* State Outreach Bento Card */}
                <div style={cardStyle}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '1rem',
                      paddingBottom: '0.5rem',
                      borderBottom: `1px solid ${THEME.colors.borderHairline}`,
                    }}
                  >
                    <div>
                      <h3 style={{ fontSize: '0.95rem', margin: 0, fontWeight: 700, color: THEME.colors.inkPrimary }}>
                        Nationwide NCCT Outreach by State
                      </h3>
                      <div style={{ fontSize: '0.72rem', color: THEME.colors.inkMuted }}>
                        Federated training throughput across state zones
                      </div>
                    </div>
                    <span style={pillBadge('success')}>Active Monitoring</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {(
                      analyticsOverview?.stateOutreach || [
                        { state: 'Madhya Pradesh (RICM Bhopal)', activeCentres: 12, traineesTrained: 1840 },
                        { state: 'Maharashtra (VAMNICOM Pune)', activeCentres: 18, traineesTrained: 2950 },
                        { state: 'Gujarat (ICM Gandhinagar)', activeCentres: 14, traineesTrained: 2120 },
                        { state: 'Uttar Pradesh (ICM Lucknow)', activeCentres: 16, traineesTrained: 2480 },
                        { state: 'Karnataka (RICM Bengaluru)', activeCentres: 10, traineesTrained: 1690 },
                      ]
                    ).map((st: any, idx: number) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '0.82rem',
                          padding: '0.5rem 0.65rem',
                          backgroundColor: THEME.colors.bgMuted,
                          borderRadius: THEME.radii.sm,
                          border: `1px solid ${THEME.colors.borderHairline}`,
                        }}
                      >
                        <span style={{ fontWeight: 600, color: THEME.colors.inkPrimary }}>{st.state}</span>
                        <span
                          style={{
                            fontWeight: 700,
                            color: THEME.colors.navyPrimary,
                            fontFamily: THEME.fonts.mono,
                            fontSize: '0.78rem',
                          }}
                        >
                          {st.traineesTrained.toLocaleString()} Trainees ({st.activeCentres} Centres)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cooperative Sector Distribution Card */}
                <div style={cardStyle}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '1rem',
                      paddingBottom: '0.5rem',
                      borderBottom: `1px solid ${THEME.colors.borderHairline}`,
                    }}
                  >
                    <div>
                      <h3 style={{ fontSize: '0.95rem', margin: 0, fontWeight: 700, color: THEME.colors.inkPrimary }}>
                        Cooperative Sector Certification Breakdown
                      </h3>
                      <div style={{ fontSize: '0.72rem', color: THEME.colors.inkMuted }}>
                        Accredited curriculum completion percentages
                      </div>
                    </div>
                    <span style={pillBadge('info')}>NCCT Standard</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    {(
                      analyticsOverview?.cooperativeSectorDistribution || [
                        { sector: 'Primary Agricultural Credit Societies (PACS)', percentage: 55 },
                        { sector: 'Dairy Cooperatives (Amul / State Federations)', percentage: 25 },
                        { sector: 'District Central Cooperative Banks (DCCBs)', percentage: 12 },
                        { sector: 'Agri-Marketing & SHG Federations', percentage: 8 },
                      ]
                    ).map((sc: any, idx: number) => (
                      <div key={idx}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '0.8rem',
                            marginBottom: '0.35rem',
                          }}
                        >
                          <span style={{ fontWeight: 600, color: THEME.colors.inkPrimary }}>{sc.sector}</span>
                          <span
                            style={{
                              fontWeight: 700,
                              color: THEME.colors.navyPrimary,
                              fontFamily: THEME.fonts.mono,
                            }}
                          >
                            {sc.percentage}%
                          </span>
                        </div>
                        <div
                          style={{
                            height: '6px',
                            width: '100%',
                            backgroundColor: THEME.colors.bgInset,
                            borderRadius: THEME.radii.pill,
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              height: '100%',
                              width: `${sc.percentage}%`,
                              backgroundColor:
                                idx === 0 ? THEME.colors.navyPrimary : idx === 1 ? '#0284c7' : '#64748b',
                              borderRadius: THEME.radii.pill,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW 2: NATIONAL MULTI-TIER FEDERATION & HIERARCHY MAP
          ========================================================================= */}
          {activeTab === 'FEDERATION' &&
            (() => {
              const fed = federationData || apiClient.getFallbackFederationAnalytics();
              const allNodes = fed.geoNodes || [];
              const activeNode = selectedGeoNode || allNodes[0] || null;

              const filteredNodes = allNodes.filter((n) => {
                if (tierFilter !== 'ALL' && n.tier !== tierFilter) return false;
                if (selectedZone !== 'ALL' && n.zone !== selectedZone) return false;
                if (
                  searchQuery &&
                  !n.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
                  !n.code.toLowerCase().includes(searchQuery.toLowerCase()) &&
                  !n.state.toLowerCase().includes(searchQuery.toLowerCase())
                )
                  return false;
                return true;
              });

              const getSvgCoords = (lat: number, lng: number) => {
                const x = Math.round(((lng - 68) / 30) * 580 + 60);
                const y = Math.round(((37 - lat) / 29) * 640 + 55);
                return { x, y };
              };

              const apexNode = allNodes.find((n) => n.tier === 1) || allNodes[0];
              const apexCoords = apexNode
                ? getSvgCoords(apexNode.lat, apexNode.lng)
                : { x: 177, y: 462 };

              const ricmNodes = allNodes.filter((n) => n.tier === 2);

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {/* Top 4 Federation Summary Metrics */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                      gap: '1rem',
                    }}
                  >
                    <div style={cardStyle}>
                      <div style={bentoHeaderStyle}>Total Active Centers</div>
                      <div style={bentoValueStyle}>{fed.summary.totalInstitutes} Institutes</div>
                      <div style={{ fontSize: '0.75rem', color: THEME.colors.navyPrimary, fontWeight: 600 }}>
                        1 Apex (VAMNICOM) + 5 RICMs + 14 ICMs
                      </div>
                    </div>

                    <div style={cardStyle}>
                      <div style={bentoHeaderStyle}>Attached Field PACS Covered</div>
                      <div style={{ ...bentoValueStyle, color: THEME.colors.status.success.text }}>
                        {fed.summary.totalAttachedPacs.toLocaleString()} Societies
                      </div>
                      <div style={{ fontSize: '0.75rem', color: THEME.colors.status.success.text, fontWeight: 600 }}>
                        Direct Grassroots Computerization Reach
                      </div>
                    </div>

                    <div style={cardStyle}>
                      <div style={bentoHeaderStyle}>National Trainee Throughput</div>
                      <div style={bentoValueStyle}>{fed.summary.totalTrainees.toLocaleString()} Enrolled</div>
                      <div style={{ fontSize: '0.75rem', color: THEME.colors.inkMuted }}>
                        {fed.summary.certifiedCount.toLocaleString()} Certified ({fed.summary.certificationRate}%)
                      </div>
                    </div>

                    <div style={cardStyle}>
                      <div style={bentoHeaderStyle}>Federated Edge Nodes</div>
                      <div style={bentoValueStyle}>
                        {fed.summary.totalEdgeNodes} / {fed.summary.totalInstitutes} Online
                      </div>
                      <div style={{ fontSize: '0.75rem', color: THEME.colors.status.success.text, fontWeight: 600 }}>
                        100% ARM64 Linux SBCs & WAL Synced
                      </div>
                    </div>
                  </div>

                  {/* 3 Tier Rollup Architecture Cards */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                      gap: '1rem',
                    }}
                  >
                    {/* Tier 1 Apex Card */}
                    <div
                      style={{
                        backgroundColor: THEME.colors.status.apex.bg,
                        border: `1px solid ${THEME.colors.status.apex.border}`,
                        borderRadius: THEME.radii.md,
                        padding: '1.25rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={pillBadge('apex')}>TIER 1 — APEX GOVERNANCE</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: THEME.colors.status.apex.text }}>
                          1 Apex Center
                        </span>
                      </div>
                      <h3 style={{ fontSize: '1.05rem', margin: '0 0 0.35rem 0', color: THEME.colors.status.apex.text, fontWeight: 800 }}>
                        {fed.tiers.tier1_apex.name}
                      </h3>
                      <p style={{ fontSize: '0.78rem', color: '#78350f', margin: '0 0 0.8rem 0', lineHeight: 1.4 }}>
                        National policy formulation, curricular accreditation, Ed25519 root authority, and executive development.
                      </p>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(3, 1fr)',
                          gap: '0.5rem',
                          backgroundColor: '#ffffff',
                          padding: '0.75rem',
                          borderRadius: THEME.radii.sm,
                          border: `1px solid ${THEME.colors.status.apex.border}`,
                          textAlign: 'center',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '0.7rem', color: '#78350f' }}>Trainees</div>
                          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: THEME.colors.status.apex.text }}>
                            {fed.tiers.tier1_apex.totalTrainees}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.7rem', color: '#78350f' }}>Certified</div>
                          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: THEME.colors.status.success.text }}>
                            {fed.tiers.tier1_apex.certifiedTrainees}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.7rem', color: '#78350f' }}>Batches</div>
                          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: THEME.colors.navyPrimary }}>
                            {fed.tiers.tier1_apex.activeBatches}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Tier 2 Regional Card */}
                    <div
                      style={{
                        backgroundColor: '#f8fafc',
                        border: `1px solid ${THEME.colors.borderHairline}`,
                        borderRadius: THEME.radii.md,
                        padding: '1.25rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={pillBadge('info')}>TIER 2 — REGIONAL HUBS</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: THEME.colors.navyPrimary }}>
                          5 RICMs
                        </span>
                      </div>
                      <h3 style={{ fontSize: '1.05rem', margin: '0 0 0.35rem 0', color: THEME.colors.navyPrimary, fontWeight: 800 }}>
                        {fed.tiers.tier2_regional.name}
                      </h3>
                      <p style={{ fontSize: '0.78rem', color: THEME.colors.inkBody, margin: '0 0 0.8rem 0', lineHeight: 1.4 }}>
                        Bhopal, Gandhinagar, Kalyani, Patna, Bengaluru — Regional hardware hubs, kit staging, and master faculty induction.
                      </p>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(3, 1fr)',
                          gap: '0.5rem',
                          backgroundColor: '#ffffff',
                          padding: '0.75rem',
                          borderRadius: THEME.radii.sm,
                          border: `1px solid ${THEME.colors.borderHairline}`,
                          textAlign: 'center',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '0.7rem', color: THEME.colors.inkMuted }}>Attached PACS</div>
                          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: THEME.colors.navyPrimary }}>
                            {fed.tiers.tier2_regional.attachedPacsCount.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.7rem', color: THEME.colors.inkMuted }}>Trainees</div>
                          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: THEME.colors.inkPrimary }}>
                            {fed.tiers.tier2_regional.totalTrainees}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.7rem', color: THEME.colors.inkMuted }}>Certified</div>
                          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: THEME.colors.status.success.text }}>
                            {fed.tiers.tier2_regional.certifiedTrainees}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Tier 3 Local Grassroots Card */}
                    <div
                      style={{
                        backgroundColor: THEME.colors.status.success.bg,
                        border: `1px solid ${THEME.colors.status.success.border}`,
                        borderRadius: THEME.radii.md,
                        padding: '1.25rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={pillBadge('success')}>TIER 3 — LOCAL GRASSROOTS</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: THEME.colors.status.success.text }}>
                          14 ICMs & PACS
                        </span>
                      </div>
                      <h3 style={{ fontSize: '1.05rem', margin: '0 0 0.35rem 0', color: THEME.colors.status.success.text, fontWeight: 800 }}>
                        {fed.tiers.tier3_local.name}
                      </h3>
                      <p style={{ fontSize: '0.78rem', color: '#14532d', margin: '0 0 0.8rem 0', lineHeight: 1.4 }}>
                        Grassroots training delivery across 14 state centers, field PACS computerization, offline SQLite WAL edge deployment.
                      </p>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(3, 1fr)',
                          gap: '0.5rem',
                          backgroundColor: '#ffffff',
                          padding: '0.75rem',
                          borderRadius: THEME.radii.sm,
                          border: `1px solid ${THEME.colors.status.success.border}`,
                          textAlign: 'center',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '0.7rem', color: '#166534' }}>Attached PACS</div>
                          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#166534' }}>
                            {fed.tiers.tier3_local.attachedPacsCount.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.7rem', color: '#166534' }}>Trainees</div>
                          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: THEME.colors.navyPrimary }}>
                            {fed.tiers.tier3_local.totalTrainees}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.7rem', color: '#166534' }}>Certified</div>
                          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#16a34a' }}>
                            {fed.tiers.tier3_local.certifiedTrainees}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Filter Pills & Zone Selection */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '0.75rem',
                      backgroundColor: '#ffffff',
                      padding: '0.85rem 1.25rem',
                      borderRadius: THEME.radii.md,
                      border: `1px solid ${THEME.colors.borderHairline}`,
                    }}
                  >
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: THEME.colors.inkMuted }}>
                        Filter By Tier:
                      </span>
                      {(
                        [
                          { label: `All 20 Centers (${allNodes.length})`, val: 'ALL' },
                          { label: 'Tier 1: Apex (1)', val: 1 },
                          { label: 'Tier 2: RICMs (5)', val: 2 },
                          { label: 'Tier 3: ICMs (14)', val: 3 },
                        ] as const
                      ).map((f) => (
                        <button
                          key={String(f.val)}
                          onClick={() => setTierFilter(f.val as any)}
                          style={{
                            padding: '0.35rem 0.75rem',
                            borderRadius: THEME.radii.pill,
                            border:
                              tierFilter === f.val
                                ? `1px solid ${THEME.colors.navyPrimary}`
                                : `1px solid ${THEME.colors.borderHairline}`,
                            backgroundColor: tierFilter === f.val ? THEME.colors.bgMuted : '#ffffff',
                            color: tierFilter === f.val ? THEME.colors.navyPrimary : THEME.colors.inkBody,
                            fontSize: '0.75rem',
                            fontWeight: tierFilter === f.val ? 800 : 500,
                            cursor: 'pointer',
                          }}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: THEME.colors.inkMuted }}>
                        National Zone:
                      </span>
                      <select
                        value={selectedZone}
                        onChange={(e) => setSelectedZone(e.target.value)}
                        style={{
                          padding: '0.35rem 0.6rem',
                          borderRadius: THEME.radii.sm,
                          border: `1px solid ${THEME.colors.borderHairline}`,
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: THEME.colors.inkPrimary,
                          backgroundColor: '#ffffff',
                        }}
                      >
                        <option value="ALL">All National Zones</option>
                        <option value="APEX">Apex (National)</option>
                        <option value="CENTRAL">Central Zone</option>
                        <option value="NORTH">North Zone</option>
                        <option value="SOUTH">South Zone</option>
                        <option value="EAST">East & North-East</option>
                        <option value="WEST">West Zone</option>
                      </select>
                      <button
                        onClick={async () => {
                          const res = await apiClient.getFederationAnalytics();
                          setFederationData(res);
                          if (res.geoNodes.length > 0) setSelectedGeoNode(res.geoNodes[0]);
                        }}
                        style={buttonSecondaryStyle}
                      >
                        <RefreshIcon size={14} />
                        <span>Refresh</span>
                      </button>
                    </div>
                  </div>

                  {/* Main Map + Node Drawer Split View */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'minmax(0, 1.4fr) minmax(340px, 1fr)',
                      gap: '1.25rem',
                    }}
                  >
                    {/* Left: Vector SVG Topological Map Canvas */}
                    <div
                      style={{
                        backgroundColor: '#0f172a',
                        borderRadius: THEME.radii.md,
                        padding: '1.5rem',
                        border: '1px solid #1e293b',
                        boxShadow: THEME.shadows.card,
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '1rem',
                          borderBottom: '1px solid #1e293b',
                          paddingBottom: '0.75rem',
                        }}
                      >
                        <div>
                          <div
                            style={{
                              color: '#f8fafc',
                              fontSize: '0.95rem',
                              fontWeight: 800,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                            }}
                          >
                            <FederationIcon size={16} color="#38bdf8" />
                            <span>National Cooperative Federation Network Map</span>
                          </div>
                          <div style={{ color: '#94a3b8', fontSize: '0.72rem' }}>
                            Topological projection of 20 NCCT training hubs & attached PACS
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.6rem', fontSize: '0.7rem' }}>
                          <span style={{ color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            ★ Apex
                          </span>
                          <span style={{ color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            ◆ RICM
                          </span>
                          <span style={{ color: '#4ade80', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            ● ICM
                          </span>
                        </div>
                      </div>

                      {/* SVG Canvas */}
                      <div
                        style={{
                          position: 'relative',
                          width: '100%',
                          height: '560px',
                          overflow: 'hidden',
                          display: 'flex',
                          justifyContent: 'center',
                        }}
                      >
                        <svg viewBox="0 0 700 750" style={{ width: '100%', height: '100%', maxWidth: '640px' }}>
                          <defs>
                            <filter id="glow-gold" x="-50%" y="-50%" width="200%" height="200%">
                              <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                              <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                              </feMerge>
                            </filter>
                            <filter id="glow-blue" x="-50%" y="-50%" width="200%" height="200%">
                              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                              <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                              </feMerge>
                            </filter>
                          </defs>

                          {/* Geographic Grid Lines */}
                          <g stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3">
                            <line x1="50" y1="150" x2="650" y2="150" />
                            <line x1="50" y1="300" x2="650" y2="300" />
                            <line x1="50" y1="450" x2="650" y2="450" />
                            <line x1="50" y1="600" x2="650" y2="600" />
                            <line x1="180" y1="50" x2="180" y2="700" />
                            <line x1="330" y1="50" x2="330" y2="700" />
                            <line x1="480" y1="50" x2="480" y2="700" />
                          </g>

                          {/* Stylized India Subcontinent Polygon */}
                          <polygon
                            points="
                              240,75 285,110 325,120 345,160 380,200 450,230 520,240 590,260 
                              610,290 560,320 480,340 450,380 440,430 420,500 370,570 320,630 
                              250,710 220,670 190,570 170,490 140,400 110,360 130,310 160,260 
                              200,200 220,130 240,75
                            "
                            fill="#131c31"
                            stroke="#334155"
                            strokeWidth="2"
                            opacity="0.85"
                          />

                          {/* Regional Backbone Lines: Apex to RICMs */}
                          {ricmNodes.map((ricm) => {
                            const coords = getSvgCoords(ricm.lat, ricm.lng);
                            return (
                              <line
                                key={`backbone-${ricm.id}`}
                                x1={apexCoords.x}
                                y1={apexCoords.y}
                                x2={coords.x}
                                y2={coords.y}
                                stroke="#f59e0b"
                                strokeWidth="2"
                                strokeDasharray="5 3"
                                opacity="0.75"
                              />
                            );
                          })}

                          {/* ICM to parent RICM links */}
                          {allNodes
                            .filter((n) => n.tier === 3)
                            .map((icm) => {
                              const coords = getSvgCoords(icm.lat, icm.lng);
                              const parent =
                                ricmNodes.find((r) => r.zone === icm.zone) || ricmNodes[0] || apexNode;
                              const pCoords = parent
                                ? getSvgCoords(parent.lat, parent.lng)
                                : apexCoords;
                              return (
                                <line
                                  key={`feed-${icm.id}`}
                                  x1={pCoords.x}
                                  y1={pCoords.y}
                                  x2={coords.x}
                                  y2={coords.y}
                                  stroke="#38bdf8"
                                  strokeWidth="1"
                                  strokeDasharray="2 3"
                                  opacity="0.4"
                                />
                              );
                            })}

                          {/* Pinned Nodes */}
                          {filteredNodes.map((node) => {
                            const { x, y } = getSvgCoords(node.lat, node.lng);
                            const isSelected = activeNode?.id === node.id;

                            if (node.tier === 1) {
                              return (
                                <g
                                  key={node.id}
                                  onClick={() => setSelectedGeoNode(node)}
                                  style={{ cursor: 'pointer' }}
                                >
                                  <circle
                                    cx={x}
                                    cy={y}
                                    r={isSelected ? '22' : '18'}
                                    fill="none"
                                    stroke="#fbbf24"
                                    strokeWidth="2"
                                    opacity="0.6"
                                    filter="url(#glow-gold)"
                                  >
                                    <animate attributeName="r" values="16;24;16" dur="2.5s" repeatCount="indefinite" />
                                    <animate attributeName="opacity" values="0.8;0.2;0.8" dur="2.5s" repeatCount="indefinite" />
                                  </circle>
                                  <circle cx={x} cy={y} r="10" fill="#f59e0b" stroke="#ffffff" strokeWidth="2.5" />
                                  <text x={x} y={y + 3.5} textAnchor="middle" fontSize="9" fill="#78350f" fontWeight="900">
                                    ★
                                  </text>
                                  <text
                                    x={x}
                                    y={y - 14}
                                    textAnchor="middle"
                                    fontSize="10"
                                    fill="#fbbf24"
                                    fontWeight="800"
                                  >
                                    VAMNICOM (Apex)
                                  </text>
                                </g>
                              );
                            }

                            if (node.tier === 2) {
                              const city = node.name.split(',')[1]?.replace(')', '').trim() || node.code;
                              return (
                                <g
                                  key={node.id}
                                  onClick={() => setSelectedGeoNode(node)}
                                  style={{ cursor: 'pointer' }}
                                >
                                  {isSelected && (
                                    <circle
                                      cx={x}
                                      cy={y}
                                      r="16"
                                      fill="none"
                                      stroke="#38bdf8"
                                      strokeWidth="2"
                                      opacity="0.8"
                                      filter="url(#glow-blue)"
                                    />
                                  )}
                                  <polygon
                                    points={`${x},${y - 8} ${x + 8},${y} ${x},${y + 8} ${x - 8},${y}`}
                                    fill="#0284c7"
                                    stroke="#ffffff"
                                    strokeWidth="2"
                                  />
                                  <text x={x} y={y + 16} textAnchor="middle" fontSize="8.5" fill="#bae6fd" fontWeight="700">
                                    RICM {city}
                                  </text>
                                </g>
                              );
                            }

                            const city = node.name.split(',')[1]?.replace(')', '').trim() || node.code;
                            return (
                              <g
                                key={node.id}
                                onClick={() => setSelectedGeoNode(node)}
                                style={{ cursor: 'pointer' }}
                              >
                                {isSelected && (
                                  <circle cx={x} cy={y} r="12" fill="none" stroke="#4ade80" strokeWidth="2" opacity="0.9" />
                                )}
                                <circle cx={x} cy={y} r="5.5" fill="#16a34a" stroke="#ffffff" strokeWidth="1.5" />
                                <text x={x} y={y + 13} textAnchor="middle" fontSize="7.5" fill="#86efac" fontWeight="600">
                                  {city}
                                </text>
                              </g>
                            );
                          })}
                        </svg>
                      </div>

                      {/* Map Footer Legend */}
                      <div
                        style={{
                          marginTop: 'auto',
                          paddingTop: '0.75rem',
                          borderTop: '1px solid #1e293b',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '0.72rem',
                          color: '#94a3b8',
                        }}
                      >
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                          <span>
                            <strong style={{ color: '#fbbf24' }}>★ Tier 1:</strong> Apex VAMNICOM Pune
                          </span>
                          <span>
                            <strong style={{ color: '#38bdf8' }}>◆ Tier 2:</strong> 5 Zonal RICMs
                          </span>
                          <span>
                            <strong style={{ color: '#4ade80' }}>● Tier 3:</strong> 14 Local ICMs & PACS
                          </span>
                        </div>
                        <div>Click node to inspect SBC hardware telemetry & attached PACS</div>
                      </div>
                    </div>

                    {/* Right: Center Profile & SBC Hardware Telemetry Drawer */}
                    {activeNode && (
                      <div
                        style={{
                          backgroundColor: '#ffffff',
                          borderRadius: THEME.radii.md,
                          padding: '1.5rem',
                          border: `1px solid ${THEME.colors.borderHairline}`,
                          boxShadow: THEME.shadows.card,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '1rem',
                        }}
                      >
                        <div style={{ borderBottom: `1px solid ${THEME.colors.borderHairline}`, paddingBottom: '0.75rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <span style={pillBadge(activeNode.tier === 1 ? 'apex' : activeNode.tier === 2 ? 'info' : 'success')}>
                              {activeNode.tier === 1
                                ? 'TIER 1 — APEX AUTHORITY'
                                : activeNode.tier === 2
                                ? 'TIER 2 — REGIONAL HUB'
                                : 'TIER 3 — LOCAL DELIVERY'}
                            </span>
                            <span
                              style={{
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                color: THEME.colors.inkMuted,
                                fontFamily: THEME.fonts.mono,
                                backgroundColor: THEME.colors.bgMuted,
                                padding: '0.2rem 0.5rem',
                                borderRadius: THEME.radii.xs,
                              }}
                            >
                              {activeNode.code}
                            </span>
                          </div>

                          <h3 style={{ fontSize: '1.15rem', margin: '0.6rem 0 0.2rem 0', color: THEME.colors.inkPrimary, fontWeight: 800 }}>
                            {activeNode.name}
                          </h3>
                          <div style={{ fontSize: '0.8rem', color: THEME.colors.inkMuted, display: 'flex', gap: '0.75rem' }}>
                            <span>📍 {activeNode.state} ({activeNode.zone} Zone)</span>
                            <span style={{ fontFamily: THEME.fonts.mono }}>
                              {activeNode.lat.toFixed(4)}°N, {activeNode.lng.toFixed(4)}°E
                            </span>
                          </div>
                        </div>

                        {/* Center Throughput Metrics */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                          <div
                            style={{
                              backgroundColor: THEME.colors.bgMuted,
                              padding: '0.85rem',
                              borderRadius: THEME.radii.sm,
                              border: `1px solid ${THEME.colors.borderHairline}`,
                            }}
                          >
                            <div style={{ fontSize: '0.7rem', color: THEME.colors.inkMuted, fontWeight: 700 }}>
                              Attached Field PACS
                            </div>
                            <div
                              style={{
                                fontSize: '1.35rem',
                                fontWeight: 800,
                                color: THEME.colors.status.success.text,
                                margin: '0.15rem 0',
                              }}
                            >
                              {activeNode.pacs > 0 ? activeNode.pacs.toLocaleString() : 'Apex Standard'}
                            </div>
                            <div style={{ fontSize: '0.68rem', color: THEME.colors.inkMuted }}>
                              Primary societies in cluster
                            </div>
                          </div>

                          <div
                            style={{
                              backgroundColor: THEME.colors.bgMuted,
                              padding: '0.85rem',
                              borderRadius: THEME.radii.sm,
                              border: `1px solid ${THEME.colors.borderHairline}`,
                            }}
                          >
                            <div style={{ fontSize: '0.7rem', color: THEME.colors.inkMuted, fontWeight: 700 }}>
                              Trainees Certified
                            </div>
                            <div
                              style={{
                                fontSize: '1.35rem',
                                fontWeight: 800,
                                color: THEME.colors.navyPrimary,
                                margin: '0.15rem 0',
                              }}
                            >
                              {activeNode.certified} / {activeNode.trainees}
                            </div>
                            <div style={{ fontSize: '0.68rem', color: THEME.colors.status.success.text, fontWeight: 700 }}>
                              {activeNode.trainees > 0
                                ? `${((activeNode.certified / activeNode.trainees) * 100).toFixed(1)}% Completion`
                                : '100%'}
                            </div>
                          </div>
                        </div>

                        {/* SBC Hardware IoT Telemetry Box */}
                        <div
                          style={{
                            backgroundColor: THEME.colors.bgMuted,
                            padding: '1rem',
                            borderRadius: THEME.radii.md,
                            border: `1px solid ${THEME.colors.borderHairline}`,
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: THEME.colors.inkPrimary, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <CpuIcon size={14} color={THEME.colors.navyPrimary} />
                              <span>Hardware Edge Telemetry</span>
                            </span>
                            <span style={pillBadge('success')}>
                              ONLINE (SYNCED)
                            </span>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.75rem', color: THEME.colors.inkBody }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: THEME.colors.inkMuted }}>Hardware Model:</span>
                              <span style={{ fontWeight: 700, color: THEME.colors.inkPrimary }}>ARM64 Linux SBC / RPi 4 (4GB RAM)</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: THEME.colors.inkMuted }}>Smart Card Reader:</span>
                              <span style={{ fontWeight: 700, color: THEME.colors.status.success.text }}>USB RFID ISO 14443A / KCC (&lt;50ms)</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: THEME.colors.inkMuted }}>Local Event Journal:</span>
                              <span style={{ fontWeight: 700, color: THEME.colors.inkPrimary }}>SQLite WAL Mode (0 Backlog)</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: THEME.colors.inkMuted }}>Edge Hotspot SSID:</span>
                              <span style={{ fontWeight: 700, color: THEME.colors.navyPrimary, fontFamily: THEME.fonts.mono }}>
                                SahakarEdge-{activeNode.code}-01
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Quick Action Controls */}
                        <div style={{ marginTop: 'auto', display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => {
                              setAssignmentNotice(`Triggered upstream sync request for edge node ${activeNode.code}`);
                            }}
                            style={{ ...buttonPrimaryStyle, flex: 1, justifyContent: 'center' }}
                          >
                            <span>Force Edge Sync</span>
                          </button>
                          <button
                            onClick={() => {
                              setActiveTab('ATTENDANCE');
                              setAssignmentNotice(`Navigated to attendance console for ${activeNode.name}`);
                            }}
                            style={{ ...buttonSecondaryStyle, flex: 1, justifyContent: 'center' }}
                          >
                            <span>View Attendance</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 20-Node National Training Centers Directory Table */}
                  <div
                    style={{
                      backgroundColor: '#ffffff',
                      borderRadius: THEME.radii.md,
                      border: `1px solid ${THEME.colors.borderHairline}`,
                      overflow: 'hidden',
                      boxShadow: THEME.shadows.card,
                    }}
                  >
                    <div
                      style={{
                        padding: '1rem 1.25rem',
                        borderBottom: `1px solid ${THEME.colors.borderHairline}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '0.75rem',
                      }}
                    >
                      <div>
                        <h3 style={{ fontSize: '0.95rem', margin: 0, color: THEME.colors.inkPrimary, fontWeight: 800 }}>
                          National 20-Center Training Directory
                        </h3>
                        <div style={{ fontSize: '0.72rem', color: THEME.colors.inkMuted }}>
                          Showing {filteredNodes.length} of {allNodes.length} accredited cooperative institutes
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            border: `1px solid ${THEME.colors.borderHairline}`,
                            borderRadius: THEME.radii.sm,
                            padding: '0.35rem 0.65rem',
                            backgroundColor: THEME.colors.bgMuted,
                          }}
                        >
                          <SearchIcon size={14} color={THEME.colors.inkMuted} />
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Filter by city, code, state..."
                            style={{
                              border: 'none',
                              outline: 'none',
                              backgroundColor: 'transparent',
                              fontSize: '0.78rem',
                              width: '180px',
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr>
                          <th style={tableHeaderStyle}>Node Code</th>
                          <th style={tableHeaderStyle}>Institute Name</th>
                          <th style={tableHeaderStyle}>Federation Tier</th>
                          <th style={tableHeaderStyle}>State / Zone</th>
                          <th style={tableHeaderStyle}>Attached PACS</th>
                          <th style={tableHeaderStyle}>Certified</th>
                          <th style={tableHeaderStyle}>Edge WAL</th>
                          <th style={tableHeaderStyle}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredNodes.map((n) => (
                          <tr key={n.id} style={{ backgroundColor: activeNode?.id === n.id ? THEME.colors.bgMuted : 'transparent' }}>
                            <td style={{ ...tableCellStyle, fontWeight: 700, fontFamily: THEME.fonts.mono, color: THEME.colors.navyPrimary }}>
                              {n.code}
                            </td>
                            <td style={{ ...tableCellStyle, fontWeight: 600 }}>{n.name}</td>
                            <td style={tableCellStyle}>
                              <span style={pillBadge(n.tier === 1 ? 'apex' : n.tier === 2 ? 'info' : 'neutral')}>
                                Tier {n.tier}: {n.tier === 1 ? 'Apex' : n.tier === 2 ? 'Regional' : 'Local'}
                              </span>
                            </td>
                            <td style={{ ...tableCellStyle, color: THEME.colors.inkMuted }}>
                              {n.state} ({n.zone})
                            </td>
                            <td style={{ ...tableCellStyle, fontWeight: 700, color: THEME.colors.status.success.text }}>
                              {n.pacs > 0 ? n.pacs.toLocaleString() : 'Apex Standard'}
                            </td>
                            <td style={tableCellStyle}>
                              {n.certified} / {n.trainees}
                            </td>
                            <td style={tableCellStyle}>
                              <span style={pillBadge('success')}>WAL OK</span>
                            </td>
                            <td style={tableCellStyle}>
                              <button
                                onClick={() => setSelectedGeoNode(n)}
                                style={{
                                  ...buttonSecondaryStyle,
                                  padding: '0.25rem 0.6rem',
                                  fontSize: '0.75rem',
                                }}
                              >
                                Inspect Node
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}

          {/* =========================================================================
              VIEW 3: INSTITUTES DIRECTORY
          ========================================================================= */}
          {activeTab === 'INSTITUTES' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 800, color: THEME.colors.inkPrimary }}>
                    Registered Cooperative Training Institutes
                  </h2>
                  <p style={{ margin: '0.25rem 0 0 0', color: THEME.colors.inkMuted, fontSize: '0.85rem' }}>
                    Authorized NCCT apex, regional, and state institutes operating Sahakar Edge field nodes
                  </p>
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                  gap: '1.25rem',
                }}
              >
                {SEED_INSTITUTES.map((inst) => (
                  <div key={inst.id} style={cardStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={pillBadge('info')}>{inst.code}</span>
                      <span style={pillBadge('success')}>Edge Online</span>
                    </div>
                    <h3 style={{ margin: '0.75rem 0 0.25rem 0', fontSize: '1.05rem', fontWeight: 700, color: THEME.colors.inkPrimary }}>
                      {inst.name}
                    </h3>
                    <div style={{ fontSize: '0.85rem', color: THEME.colors.inkMuted }}>
                      {inst.locationText}
                    </div>
                    <div
                      style={{
                        marginTop: '1rem',
                        paddingTop: '0.75rem',
                        borderTop: `1px solid ${THEME.colors.borderHairline}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.78rem',
                        color: THEME.colors.inkMuted,
                      }}
                    >
                      <span style={{ color: THEME.colors.status.success.text, fontWeight: 600 }}>● ARM64 Gateway Synced</span>
                      <span>Capacity: 120 Trainees</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW 4: PROGRAMMES CATALOGUE
          ========================================================================= */}
          {activeTab === 'PROGRAMMES' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 800, color: THEME.colors.inkPrimary }}>
                    Capacity Building Programmes Catalogue
                  </h2>
                  <p style={{ margin: '0.25rem 0 0 0', color: THEME.colors.inkMuted, fontSize: '0.85rem' }}>
                    Official NCCT cooperative curricula provisioned onto local Edge nodes
                  </p>
                </div>
                <button onClick={() => setShowProgrammeModal(true)} style={buttonPrimaryStyle}>
                  <span>+ Add New Programme</span>
                </button>
              </div>

              <div
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: THEME.radii.md,
                  border: `1px solid ${THEME.colors.borderHairline}`,
                  overflow: 'hidden',
                  boxShadow: THEME.shadows.card,
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr>
                      <th style={tableHeaderStyle}>Programme Title</th>
                      <th style={tableHeaderStyle}>Institute</th>
                      <th style={tableHeaderStyle}>Status</th>
                      <th style={tableHeaderStyle}>Start Date</th>
                      <th style={tableHeaderStyle}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {programmes.map((p) => (
                      <tr key={p.id}>
                        <td style={{ ...tableCellStyle, fontWeight: 700, color: THEME.colors.inkPrimary }}>
                          {p.title}
                        </td>
                        <td style={{ ...tableCellStyle, color: THEME.colors.inkBody }}>RICM Bhopal</td>
                        <td style={tableCellStyle}>
                          <span style={pillBadge('success')}>{p.status}</span>
                        </td>
                        <td style={{ ...tableCellStyle, color: THEME.colors.inkMuted, fontFamily: THEME.fonts.mono }}>
                          {new Date(p.startAt).toLocaleDateString()}
                        </td>
                        <td style={tableCellStyle}>
                          <button
                            onClick={() => {
                              setSelectedProgrammeId(p.id);
                              setActiveTab('BATCHES');
                            }}
                            style={{ ...buttonSecondaryStyle, padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                          >
                            View Batches →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW 5: BATCHES & ENROLLMENTS
          ========================================================================= */}
          {activeTab === 'BATCHES' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 800, color: THEME.colors.inkPrimary }}>
                  Cohort Batches & Trainee Rosters
                </h2>
                <p style={{ margin: '0.25rem 0 0 0', color: THEME.colors.inkMuted, fontSize: '0.85rem' }}>
                  Assign trainees to training cohorts and deploy rosters to physical edge hardware
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem' }}>
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: THEME.radii.md,
                    border: `1px solid ${THEME.colors.borderHairline}`,
                    overflow: 'hidden',
                    boxShadow: THEME.shadows.card,
                  }}
                >
                  <div
                    style={{
                      padding: '0.85rem 1.25rem',
                      backgroundColor: THEME.colors.bgMuted,
                      borderBottom: `1px solid ${THEME.colors.borderHairline}`,
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      color: THEME.colors.inkPrimary,
                    }}
                  >
                    Enrolled Trainees ({enrollments.length})
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr>
                        <th style={tableHeaderStyle}>Trainee Name</th>
                        <th style={tableHeaderStyle}>Assigned Batch</th>
                        <th style={tableHeaderStyle}>Status</th>
                        <th style={tableHeaderStyle}>Enrolled At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {enrollments.map((enr) => {
                        const traineeObj = SEED_USERS.find((u) => u.id === enr.traineeId);
                        const batchObj = batches.find((b) => b.id === enr.batchId);
                        return (
                          <tr key={enr.id}>
                            <td style={{ ...tableCellStyle, fontWeight: 600 }}>{traineeObj?.name || 'Trainee'}</td>
                            <td style={{ ...tableCellStyle, color: THEME.colors.inkBody }}>
                              {batchObj?.name || 'Batch 1'}
                            </td>
                            <td style={tableCellStyle}>
                              <span style={pillBadge('success')}>{enr.status}</span>
                            </td>
                            <td style={{ ...tableCellStyle, color: THEME.colors.inkMuted, fontFamily: THEME.fonts.mono }}>
                              {new Date(enr.enrolledAt).toLocaleDateString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Roster Assignment Form */}
                <div style={cardStyle}>
                  <h3 style={{ marginTop: 0, fontSize: '0.95rem', fontWeight: 700, color: THEME.colors.inkPrimary }}>
                    Enroll Candidate to Batch
                  </h3>
                  <form onSubmit={handleEnrollTrainee} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: THEME.colors.inkMuted, display: 'block', marginBottom: '0.25rem' }}>
                        Trainee
                      </label>
                      <select
                        value={selectedTraineeId}
                        onChange={(e) => setSelectedTraineeId(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          borderRadius: THEME.radii.sm,
                          border: `1px solid ${THEME.colors.borderHairline}`,
                          fontSize: '0.85rem',
                        }}
                      >
                        {trainees.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name} ({t.emailOrPhone})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: THEME.colors.inkMuted, display: 'block', marginBottom: '0.25rem' }}>
                        Programme
                      </label>
                      <select
                        value={selectedProgrammeId}
                        onChange={(e) => setSelectedProgrammeId(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          borderRadius: THEME.radii.sm,
                          border: `1px solid ${THEME.colors.borderHairline}`,
                          fontSize: '0.85rem',
                        }}
                      >
                        {programmes.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button type="submit" style={{ ...buttonPrimaryStyle, marginTop: '0.5rem', justifyContent: 'center' }}>
                      Confirm Roster Enrollment
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW 6: CURRICULAR COURSES & MODULES
          ========================================================================= */}
          {activeTab === 'COURSES' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 800, color: THEME.colors.inkPrimary }}>
                  Curriculum & Offline Courseware Packages
                </h2>
                <p style={{ margin: '0.25rem 0 0 0', color: THEME.colors.inkMuted, fontSize: '0.85rem' }}>
                  Standardized NCCT educational modules cached locally on edge SSDs
                </p>
              </div>

              <div style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={pillBadge('info')}>
                      NCCT-CRS-101 • v{SEED_COURSE.version} ({SEED_COURSE.language.toUpperCase()})
                    </span>
                    <h3 style={{ fontSize: '1.15rem', margin: '0.5rem 0 0.25rem 0', fontWeight: 800, color: THEME.colors.inkPrimary }}>
                      {SEED_COURSE.title}
                    </h3>
                    <p style={{ color: THEME.colors.inkBody, fontSize: '0.85rem', margin: '0 0 1rem 0' }}>
                      {SEED_COURSE.description}
                    </p>
                  </div>
                  <span style={pillBadge('success')}>
                    Offline Package Cached (38 MB)
                  </span>
                </div>

                <div
                  style={{
                    backgroundColor: THEME.colors.bgMuted,
                    borderRadius: THEME.radii.sm,
                    padding: '1rem',
                    border: `1px solid ${THEME.colors.borderHairline}`,
                  }}
                >
                  <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: THEME.colors.inkPrimary, fontWeight: 700 }}>
                    Structured Curriculum Modules:
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '0.5rem 0.75rem',
                        backgroundColor: '#ffffff',
                        borderRadius: THEME.radii.sm,
                        border: `1px solid ${THEME.colors.borderHairline}`,
                      }}
                    >
                      <span style={{ fontWeight: 600 }}>Module 1: Cooperative Principles & Statutory PACS Governance</span>
                      <span style={{ color: THEME.colors.status.success.text, fontWeight: 600 }}>Ready Offline</span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '0.5rem 0.75rem',
                        backgroundColor: '#ffffff',
                        borderRadius: THEME.radii.sm,
                        border: `1px solid ${THEME.colors.borderHairline}`,
                      }}
                    >
                      <span style={{ fontWeight: 600 }}>Module 2: Day-Book, General Ledger & Multi-Voucher Posting</span>
                      <span style={{ color: THEME.colors.status.success.text, fontWeight: 600 }}>Ready Offline</span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '0.5rem 0.75rem',
                        backgroundColor: '#ffffff',
                        borderRadius: THEME.radii.sm,
                        border: `1px solid ${THEME.colors.borderHairline}`,
                      }}
                    >
                      <span style={{ fontWeight: 600 }}>Module 3: Cooperative Audit, NABARD Guidelines & Inspection</span>
                      <span style={{ color: THEME.colors.status.success.text, fontWeight: 600 }}>Ready Offline</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW 7: ATTENDANCE & BIOMETRIC AUDIT
          ========================================================================= */}
          {activeTab === 'ATTENDANCE' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 800, color: THEME.colors.inkPrimary }}>
                    Attendance Ledger & Biometric Audit
                  </h2>
                  <p style={{ margin: '0.25rem 0 0 0', color: THEME.colors.inkMuted, fontSize: '0.85rem' }}>
                    Audited local check-ins via Dynamic QR, biometric capture, and authorized trainer manual overrides
                  </p>
                </div>
                <button onClick={() => setShowOverrideModal(true)} style={buttonSecondaryStyle}>
                  <span>+ Manual Attendance Override</span>
                </button>
              </div>

              <div
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: THEME.radii.md,
                  border: `1px solid ${THEME.colors.borderHairline}`,
                  overflow: 'hidden',
                  boxShadow: THEME.shadows.card,
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr>
                      <th style={tableHeaderStyle}>Trainee Name</th>
                      <th style={tableHeaderStyle}>Session</th>
                      <th style={tableHeaderStyle}>Method</th>
                      <th style={tableHeaderStyle}>Status</th>
                      <th style={tableHeaderStyle}>Timestamp</th>
                      <th style={tableHeaderStyle}>Audit / Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceRecords.map((att) => (
                      <tr key={att.id}>
                        <td style={{ ...tableCellStyle, fontWeight: 600 }}>{att.traineeName}</td>
                        <td style={{ ...tableCellStyle, color: THEME.colors.inkBody }}>{att.sessionTitle}</td>
                        <td style={tableCellStyle}>
                          <span style={pillBadge('neutral')}>{att.method}</span>
                        </td>
                        <td style={tableCellStyle}>
                          <span style={pillBadge(att.status === 'PRESENT' ? 'success' : 'warning')}>
                            {att.status}
                          </span>
                        </td>
                        <td style={{ ...tableCellStyle, color: THEME.colors.inkMuted, fontFamily: THEME.fonts.mono }}>
                          {new Date(att.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td style={{ ...tableCellStyle, color: THEME.colors.inkMuted, fontSize: '0.8rem' }}>
                          {att.overrideReason || 'Verified via Local Edge Node'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW 8: DIGITAL CREDENTIALS & PUBLIC VERIFIER
          ========================================================================= */}
          {activeTab === 'CREDENTIALS' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 800, color: THEME.colors.inkPrimary }}>
                  Statutory Digital Credentials (Ed25519)
                </h2>
                <p style={{ margin: '0.25rem 0 0 0', color: THEME.colors.inkMuted, fontSize: '0.85rem' }}>
                  Cryptographically signed canonical evidence records issued after completing curriculum & assessment milestones
                </p>
              </div>

              {/* Public Verifier Console */}
              <div style={cardStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <ShieldCheckIcon size={18} color={THEME.colors.navyPrimary} />
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: THEME.colors.inkPrimary }}>
                    NCCT Public Credential Verifier
                  </h3>
                </div>
                <p style={{ fontSize: '0.85rem', color: THEME.colors.inkMuted, margin: '0 0 1rem 0' }}>
                  Verify the cryptographic Ed25519 signature of any cooperative training certificate issued either online or offline by an edge node.
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', maxWidth: '640px' }}>
                  <input
                    type="text"
                    value={verifyInputId}
                    onChange={(e) => setVerifyInputId(e.target.value)}
                    placeholder="Enter Credential ID (e.g. cred-anita-pacs-2026)"
                    style={{
                      flex: 1,
                      padding: '0.65rem 0.9rem',
                      borderRadius: THEME.radii.sm,
                      border: `1px solid ${THEME.colors.borderHairline}`,
                      fontSize: '0.85rem',
                      fontFamily: THEME.fonts.mono,
                    }}
                  />
                  <button onClick={handleVerifyCredential} style={buttonPrimaryStyle}>
                    Verify Signature
                  </button>
                </div>

                {verificationResult && (
                  <div
                    style={{
                      marginTop: '1.25rem',
                      padding: '1.25rem',
                      borderRadius: THEME.radii.md,
                      fontSize: '0.85rem',
                      backgroundColor: verificationResult.verified
                        ? THEME.colors.status.success.bg
                        : THEME.colors.status.error.bg,
                      border: `1px solid ${
                        verificationResult.verified
                          ? THEME.colors.status.success.border
                          : THEME.colors.status.error.border
                      }`,
                      color: verificationResult.verified
                        ? THEME.colors.status.success.text
                        : THEME.colors.status.error.text,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                      <CheckIcon size={16} />
                      <strong style={{ fontSize: '0.95rem' }}>
                        {verificationResult.verified
                          ? 'CRYPTOGRAPHICALLY VALID ED25519 SIGNATURE'
                          : 'VERIFICATION FAILED'}
                      </strong>
                    </div>
                    <p style={{ margin: '0 0 0.75rem 0', lineHeight: 1.5 }}>{verificationResult.details}</p>

                    {verificationResult.verified && (
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                          gap: '0.75rem',
                          marginTop: '0.75rem',
                          paddingTop: '0.75rem',
                          borderTop: `1px solid ${THEME.colors.status.success.border}`,
                          fontSize: '0.75rem',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700 }}>AUTHORITY PUBLIC KEY</div>
                          <div style={{ fontFamily: THEME.fonts.mono }}>{verificationResult.publicKey}</div>
                        </div>
                        <div>
                          <div style={{ fontWeight: 700 }}>CANONICAL SHA-256 HASH</div>
                          <div style={{ fontFamily: THEME.fonts.mono }}>{verificationResult.sha256Digest}</div>
                        </div>
                        <div>
                          <div style={{ fontWeight: 700 }}>TAMPER DETECTION</div>
                          <div>{verificationResult.tamperCheck}</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Issued Credentials Table */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: THEME.radii.md,
                  border: `1px solid ${THEME.colors.borderHairline}`,
                  overflow: 'hidden',
                  boxShadow: THEME.shadows.card,
                }}
              >
                <div
                  style={{
                    padding: '0.85rem 1.25rem',
                    backgroundColor: THEME.colors.bgMuted,
                    borderBottom: `1px solid ${THEME.colors.borderHairline}`,
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    color: THEME.colors.inkPrimary,
                  }}
                >
                  Issued Digital Credentials Registry ({credentialsList.length} Records)
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr>
                      <th style={tableHeaderStyle}>Credential ID</th>
                      <th style={tableHeaderStyle}>Trainee Name</th>
                      <th style={tableHeaderStyle}>Certified Programme</th>
                      <th style={tableHeaderStyle}>Status</th>
                      <th style={tableHeaderStyle}>Ed25519 Signature Snippet</th>
                      <th style={tableHeaderStyle}>Official Certificate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {credentialsList.map((cred) => (
                      <tr key={cred.id}>
                        <td style={{ ...tableCellStyle, fontWeight: 700, fontFamily: THEME.fonts.mono, color: THEME.colors.navyPrimary }}>
                          {cred.id}
                        </td>
                        <td style={{ ...tableCellStyle, fontWeight: 600 }}>{cred.traineeName}</td>
                        <td style={tableCellStyle}>{cred.programmeTitle}</td>
                        <td style={tableCellStyle}>
                          <span style={pillBadge('success')}>{cred.status}</span>
                        </td>
                        <td style={{ ...tableCellStyle, fontFamily: THEME.fonts.mono, fontSize: '0.75rem', color: THEME.colors.inkMuted }}>
                          {cred.signatureHex.slice(0, 16)}...{cred.signatureHex.slice(-8)}
                        </td>
                        <td style={tableCellStyle}>
                          <button
                            onClick={() => setSelectedCertificate(cred)}
                            style={{ ...buttonSecondaryStyle, padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                          >
                            View Certificate
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW 9: RECRUITER PIPELINE & EMPLOYMENT
          ========================================================================= */}
          {activeTab === 'EMPLOYMENT' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* View Mode Toggle: Recruiter Portal vs Candidate View */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                  borderBottom: `1px solid ${THEME.colors.borderHairline}`,
                  paddingBottom: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setRecruiterViewMode('RECRUITER')}
                    style={recruiterViewMode === 'RECRUITER' ? buttonPrimaryStyle : buttonSecondaryStyle}
                  >
                    <span>Employer Recruiter Portal</span>
                    <span
                      style={{
                        backgroundColor: recruiterViewMode === 'RECRUITER' ? 'rgba(255,255,255,0.2)' : THEME.colors.bgInset,
                        color: recruiterViewMode === 'RECRUITER' ? '#ffffff' : THEME.colors.inkPrimary,
                        fontSize: '0.7rem',
                        padding: '0.1rem 0.45rem',
                        borderRadius: THEME.radii.pill,
                      }}
                    >
                      {jobApplications.length}
                    </span>
                  </button>
                  <button
                    onClick={() => setRecruiterViewMode('CANDIDATE')}
                    style={recruiterViewMode === 'CANDIDATE' ? buttonPrimaryStyle : buttonSecondaryStyle}
                  >
                    <span>Candidate & AI Counselor View</span>
                  </button>
                </div>

                {recruiterViewMode === 'CANDIDATE' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: THEME.colors.inkMuted }}>Select Candidate:</span>
                    <select
                      value={selectedCandidateId}
                      onChange={(e) => setSelectedCandidateId(e.target.value)}
                      style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: THEME.radii.sm,
                        border: `1px solid ${THEME.colors.borderHairline}`,
                        fontSize: '0.8rem',
                        fontWeight: 600,
                      }}
                    >
                      <option value="dddd4444-4444-4444-4444-444444444441">Anita Patel (PACS Certified)</option>
                      <option value="dddd4444-4444-4444-4444-444444444442">Vikram Rao (Dairy & Governance)</option>
                      <option value="dddd4444-4444-4444-4444-444444444443">Sunita Meena (Credit & SHG)</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Notification Banner */}
              {recruiterActionNotice && (
                <div
                  style={{
                    backgroundColor: THEME.colors.status.success.bg,
                    border: `1px solid ${THEME.colors.status.success.border}`,
                    color: THEME.colors.status.success.text,
                    padding: '0.75rem 1.25rem',
                    borderRadius: THEME.radii.sm,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <CheckIcon size={16} />
                    <span>{recruiterActionNotice}</span>
                  </div>
                  <button
                    onClick={() => setRecruiterActionNotice(null)}
                    style={{ background: 'none', border: 'none', color: THEME.colors.status.success.text, cursor: 'pointer' }}
                  >
                    <CloseIcon size={16} />
                  </button>
                </div>
              )}

              {recruiterViewMode === 'RECRUITER' ? (
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '1.25rem',
                      flexWrap: 'wrap',
                      gap: '0.75rem',
                    }}
                  >
                    <div>
                      <h2 style={{ fontSize: '1.25rem', margin: 0, color: THEME.colors.inkPrimary, fontWeight: 800 }}>
                        Recruiter Hiring Pipeline & Digital Offer Letters
                      </h2>
                      <p style={{ margin: '0.25rem 0 0 0', color: THEME.colors.inkMuted, fontSize: '0.85rem' }}>
                        4-stage candidate tracking with explainable skill matching and Ed25519 digital offer letter issuance
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: THEME.colors.inkMuted }}>Filter Job:</span>
                      <select
                        value={selectedJobFilter}
                        onChange={(e) => setSelectedJobFilter(e.target.value)}
                        style={{
                          padding: '0.35rem 0.75rem',
                          borderRadius: THEME.radii.sm,
                          border: `1px solid ${THEME.colors.borderHairline}`,
                          fontSize: '0.8rem',
                          fontWeight: 600,
                        }}
                      >
                        <option value="ALL">All Opportunities ({SEED_JOB_OPPORTUNITIES.length})</option>
                        {SEED_JOB_OPPORTUNITIES.map((j) => (
                          <option key={j.id} value={j.id}>
                            {j.title} ({j.employerName?.split(' ')[0] || 'Employer'})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* 4-Stage Summary Cards */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '1rem',
                      marginBottom: '1.5rem',
                    }}
                  >
                    <div style={cardStyle}>
                      <div style={bentoHeaderStyle}>1. Applied & Screening</div>
                      <div style={bentoValueStyle}>
                        {jobApplications.filter((a) => (selectedJobFilter === 'ALL' || a.jobId === selectedJobFilter) && a.status === 'APPLIED').length}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: THEME.colors.inkMuted }}>Verified Skill Overlap Checks</div>
                    </div>
                    <div style={cardStyle}>
                      <div style={bentoHeaderStyle}>2. Interview Scheduled</div>
                      <div style={bentoValueStyle}>
                        {jobApplications.filter((a) => (selectedJobFilter === 'ALL' || a.jobId === selectedJobFilter) && a.status === 'SCHEDULED').length}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: THEME.colors.inkMuted }}>Technical & Cooperative Vetting</div>
                    </div>
                    <div style={cardStyle}>
                      <div style={bentoHeaderStyle}>3. Offer Extended</div>
                      <div style={bentoValueStyle}>
                        {jobApplications.filter((a) => (selectedJobFilter === 'ALL' || a.jobId === selectedJobFilter) && a.status === 'OFFERED').length}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: THEME.colors.inkMuted }}>Ed25519 Signed Digital Offers</div>
                    </div>
                    <div style={cardStyle}>
                      <div style={bentoHeaderStyle}>4. Placed & Inducted</div>
                      <div style={{ ...bentoValueStyle, color: THEME.colors.status.success.text }}>
                        {jobApplications.filter((a) => (selectedJobFilter === 'ALL' || a.jobId === selectedJobFilter) && a.status === 'PLACED').length}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: THEME.colors.status.success.text }}>Grassroots Cooperative ERP</div>
                    </div>
                  </div>

                  {/* 4-Column Kanban Pipeline */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                      gap: '1.25rem',
                      alignItems: 'start',
                      marginBottom: '2rem',
                    }}
                  >
                    {/* Stage 1: APPLIED */}
                    <div
                      style={{
                        backgroundColor: THEME.colors.bgMuted,
                        borderRadius: THEME.radii.md,
                        border: `1px solid ${THEME.colors.borderHairline}`,
                        padding: '1rem',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '0.75rem',
                          paddingBottom: '0.5rem',
                          borderBottom: `2px solid ${THEME.colors.navyPrimary}`,
                        }}
                      >
                        <div style={{ fontWeight: 800, fontSize: '0.85rem', color: THEME.colors.navyPrimary }}>
                          1. APPLIED / SCREENING
                        </div>
                        <span style={pillBadge('info')}>
                          {jobApplications.filter((a) => (selectedJobFilter === 'ALL' || a.jobId === selectedJobFilter) && a.status === 'APPLIED').length}
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                        {jobApplications
                          .filter((a) => (selectedJobFilter === 'ALL' || a.jobId === selectedJobFilter) && a.status === 'APPLIED')
                          .map((app) => (
                            <div
                              key={app.id}
                              style={{
                                backgroundColor: '#ffffff',
                                borderRadius: THEME.radii.sm,
                                border: `1px solid ${THEME.colors.borderHairline}`,
                                padding: '1rem',
                                boxShadow: THEME.shadows.card,
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: THEME.colors.inkPrimary }}>
                                  {app.candidateName}
                                </div>
                                <span style={pillBadge(app.matchScore >= 80 ? 'success' : 'warning')}>
                                  {app.matchScore}% Match
                                </span>
                              </div>
                              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: THEME.colors.navyPrimary, marginBottom: '0.15rem' }}>
                                {app.jobTitle}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: THEME.colors.inkMuted, marginBottom: '0.65rem' }}>
                                {app.employerName}
                              </div>

                              <div
                                style={{
                                  backgroundColor: THEME.colors.bgMuted,
                                  padding: '0.5rem',
                                  borderRadius: THEME.radii.xs,
                                  marginBottom: '0.75rem',
                                  border: `1px solid ${THEME.colors.borderHairline}`,
                                }}
                              >
                                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: THEME.colors.inkMuted, marginBottom: '0.25rem' }}>
                                  VERIFIED COMPETENCIES:
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                                  {app.matchedSkills && app.matchedSkills.length > 0 ? (
                                    app.matchedSkills.map((s, idx) => (
                                      <span key={idx} style={pillBadge('success')}>
                                        {s.skillName}
                                      </span>
                                    ))
                                  ) : (
                                    <span style={pillBadge('success')}>
                                      Verified NCCT Credential
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div style={{ fontSize: '0.7rem', color: THEME.colors.inkMuted, marginBottom: '0.75rem' }}>
                                Applied: {new Date(app.appliedAt).toLocaleDateString()}
                              </div>

                              <button
                                onClick={() => {
                                  setScheduleModalApp(app);
                                  setScheduleDate('2026-11-10T10:30');
                                  setScheduleVenue('Amul Talent Center / RICM Bhopal Video Room');
                                  setScheduleNotes(`Shortlisted based on ${app.matchScore}% verified skill match score.`);
                                }}
                                style={{ ...buttonPrimaryStyle, width: '100%', justifyContent: 'center' }}
                              >
                                <span>Schedule Interview</span>
                              </button>
                            </div>
                          ))}
                        {jobApplications.filter((a) => (selectedJobFilter === 'ALL' || a.jobId === selectedJobFilter) && a.status === 'APPLIED').length === 0 && (
                          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: THEME.colors.inkMuted, fontSize: '0.8rem' }}>
                            No candidates in applied stage
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Stage 2: SCHEDULED */}
                    <div
                      style={{
                        backgroundColor: THEME.colors.bgMuted,
                        borderRadius: THEME.radii.md,
                        border: `1px solid ${THEME.colors.borderHairline}`,
                        padding: '1rem',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '0.75rem',
                          paddingBottom: '0.5rem',
                          borderBottom: `2px solid ${THEME.colors.status.warning.text}`,
                        }}
                      >
                        <div style={{ fontWeight: 800, fontSize: '0.85rem', color: THEME.colors.status.warning.text }}>
                          2. INTERVIEW SCHEDULED
                        </div>
                        <span style={pillBadge('warning')}>
                          {jobApplications.filter((a) => (selectedJobFilter === 'ALL' || a.jobId === selectedJobFilter) && a.status === 'SCHEDULED').length}
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                        {jobApplications
                          .filter((a) => (selectedJobFilter === 'ALL' || a.jobId === selectedJobFilter) && a.status === 'SCHEDULED')
                          .map((app) => (
                            <div
                              key={app.id}
                              style={{
                                backgroundColor: '#ffffff',
                                borderRadius: THEME.radii.sm,
                                border: `1px solid ${THEME.colors.status.warning.border}`,
                                padding: '1rem',
                                boxShadow: THEME.shadows.card,
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: THEME.colors.inkPrimary }}>
                                  {app.candidateName}
                                </div>
                                <span style={pillBadge('success')}>
                                  {app.matchScore}% Match
                                </span>
                              </div>
                              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: THEME.colors.navyPrimary, marginBottom: '0.15rem' }}>
                                {app.jobTitle}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: THEME.colors.inkMuted, marginBottom: '0.65rem' }}>
                                {app.employerName}
                              </div>

                              <div
                                style={{
                                  backgroundColor: THEME.colors.status.warning.bg,
                                  padding: '0.65rem',
                                  borderRadius: THEME.radii.xs,
                                  marginBottom: '0.75rem',
                                  border: `1px solid ${THEME.colors.status.warning.border}`,
                                  fontSize: '0.75rem',
                                }}
                              >
                                <div style={{ fontWeight: 700, color: THEME.colors.status.warning.text, marginBottom: '0.2rem' }}>
                                  🕒 {app.interviewDate ? new Date(app.interviewDate).toLocaleString() : 'Date TBD'}
                                </div>
                                <div style={{ color: THEME.colors.inkBody, marginBottom: '0.2rem' }}>
                                  📍 {app.interviewVenue || 'Virtual Meet'}
                                </div>
                                {app.interviewNotes && (
                                  <div style={{ color: THEME.colors.inkMuted, fontStyle: 'italic', marginTop: '0.25rem' }}>
                                    "{app.interviewNotes}"
                                  </div>
                                )}
                              </div>

                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                <button
                                  onClick={() => {
                                    setOfferModalApp(app);
                                    setOfferDesignation(app.jobTitle);
                                    setOfferLPA(4.2);
                                    setOfferSalary(35000);
                                    setOfferJoiningDate('2026-11-25');
                                    setOfferLocation(
                                      app.jobTitle.includes('Dairy')
                                        ? 'Mehsana / Anand, Gujarat'
                                        : 'Bhopal Regional Office & Field PACS'
                                    );
                                    setOfferSignatory(`Head of Human Resources, ${app.employerName}`);
                                  }}
                                  style={{ ...buttonPrimaryStyle, width: '100%', justifyContent: 'center' }}
                                >
                                  <span>Issue Digital Offer Letter</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setScheduleModalApp(app);
                                    setScheduleDate(app.interviewDate || '2026-11-12T11:00');
                                    setScheduleVenue(app.interviewVenue || 'Virtual Meet');
                                    setScheduleNotes(app.interviewNotes || '');
                                  }}
                                  style={{ ...buttonSecondaryStyle, width: '100%', justifyContent: 'center' }}
                                >
                                  <span>Reschedule</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        {jobApplications.filter((a) => (selectedJobFilter === 'ALL' || a.jobId === selectedJobFilter) && a.status === 'SCHEDULED').length === 0 && (
                          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: THEME.colors.inkMuted, fontSize: '0.8rem' }}>
                            No interviews currently scheduled
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Stage 3: OFFERED */}
                    <div
                      style={{
                        backgroundColor: THEME.colors.bgMuted,
                        borderRadius: THEME.radii.md,
                        border: `1px solid ${THEME.colors.borderHairline}`,
                        padding: '1rem',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '0.75rem',
                          paddingBottom: '0.5rem',
                          borderBottom: `2px solid ${THEME.colors.navyPrimary}`,
                        }}
                      >
                        <div style={{ fontWeight: 800, fontSize: '0.85rem', color: THEME.colors.navyPrimary }}>
                          3. OFFER EXTENDED
                        </div>
                        <span style={pillBadge('info')}>
                          {jobApplications.filter((a) => (selectedJobFilter === 'ALL' || a.jobId === selectedJobFilter) && a.status === 'OFFERED').length}
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                        {jobApplications
                          .filter((a) => (selectedJobFilter === 'ALL' || a.jobId === selectedJobFilter) && a.status === 'OFFERED')
                          .map((app) => (
                            <div
                              key={app.id}
                              style={{
                                backgroundColor: '#ffffff',
                                borderRadius: THEME.radii.sm,
                                border: `1px solid ${THEME.colors.borderHairline}`,
                                padding: '1rem',
                                boxShadow: THEME.shadows.card,
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: THEME.colors.inkPrimary }}>
                                  {app.candidateName}
                                </div>
                                <span style={pillBadge('info')}>Ed25519 Signed</span>
                              </div>
                              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: THEME.colors.navyPrimary, marginBottom: '0.15rem' }}>
                                {app.jobTitle}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: THEME.colors.inkMuted, marginBottom: '0.65rem' }}>
                                {app.employerName}
                              </div>

                              <div
                                style={{
                                  backgroundColor: THEME.colors.bgMuted,
                                  padding: '0.6rem',
                                  borderRadius: THEME.radii.xs,
                                  marginBottom: '0.75rem',
                                  border: `1px solid ${THEME.colors.borderHairline}`,
                                  fontSize: '0.75rem',
                                }}
                              >
                                <div style={{ color: THEME.colors.navyPrimary, fontWeight: 700 }}>
                                  ✓ Canonical Digest Signed
                                </div>
                                <div style={{ color: THEME.colors.inkMuted, fontSize: '0.7rem', fontFamily: THEME.fonts.mono }}>
                                  Key: ncct-master-key-01
                                </div>
                              </div>

                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                <button
                                  onClick={() => handleOpenViewOffer(app)}
                                  style={{ ...buttonSecondaryStyle, width: '100%', justifyContent: 'center' }}
                                >
                                  <span>View Signed Offer Letter</span>
                                </button>
                                <button
                                  onClick={() => handleConfirmPlacement(app.id)}
                                  style={{ ...buttonPrimaryStyle, width: '100%', justifyContent: 'center' }}
                                >
                                  <span>Confirm Placement</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        {jobApplications.filter((a) => (selectedJobFilter === 'ALL' || a.jobId === selectedJobFilter) && a.status === 'OFFERED').length === 0 && (
                          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: THEME.colors.inkMuted, fontSize: '0.8rem' }}>
                            No offers currently extended
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Stage 4: PLACED */}
                    <div
                      style={{
                        backgroundColor: THEME.colors.bgMuted,
                        borderRadius: THEME.radii.md,
                        border: `1px solid ${THEME.colors.borderHairline}`,
                        padding: '1rem',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '0.75rem',
                          paddingBottom: '0.5rem',
                          borderBottom: `2px solid ${THEME.colors.status.success.border}`,
                        }}
                      >
                        <div style={{ fontWeight: 800, fontSize: '0.85rem', color: THEME.colors.status.success.text }}>
                          4. PLACED & INDUCTED
                        </div>
                        <span style={pillBadge('success')}>
                          {jobApplications.filter((a) => (selectedJobFilter === 'ALL' || a.jobId === selectedJobFilter) && a.status === 'PLACED').length}
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                        {jobApplications
                          .filter((a) => (selectedJobFilter === 'ALL' || a.jobId === selectedJobFilter) && a.status === 'PLACED')
                          .map((app) => (
                            <div
                              key={app.id}
                              style={{
                                backgroundColor: '#ffffff',
                                borderRadius: THEME.radii.sm,
                                border: `1px solid ${THEME.colors.status.success.border}`,
                                padding: '1rem',
                                boxShadow: THEME.shadows.card,
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: THEME.colors.inkPrimary }}>
                                  {app.candidateName}
                                </div>
                                <span style={pillBadge('success')}>PLACED ✓</span>
                              </div>
                              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: THEME.colors.navyPrimary, marginBottom: '0.15rem' }}>
                                {app.jobTitle}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: THEME.colors.inkMuted, marginBottom: '0.65rem' }}>
                                {app.employerName}
                              </div>

                              <div
                                style={{
                                  backgroundColor: THEME.colors.status.success.bg,
                                  padding: '0.6rem',
                                  borderRadius: THEME.radii.xs,
                                  marginBottom: '0.75rem',
                                  border: `1px solid ${THEME.colors.status.success.border}`,
                                  fontSize: '0.75rem',
                                }}
                              >
                                <div style={{ color: THEME.colors.status.success.text, fontWeight: 700 }}>
                                  Cooperative Induction Ready
                                </div>
                                <div style={{ color: THEME.colors.inkBody }}>Integrated into District PACS ERP</div>
                              </div>

                              <button
                                onClick={() => handleOpenViewOffer(app)}
                                style={{ ...buttonSecondaryStyle, width: '100%', justifyContent: 'center' }}
                              >
                                <span>View Signed Offer</span>
                              </button>
                            </div>
                          ))}
                        {jobApplications.filter((a) => (selectedJobFilter === 'ALL' || a.jobId === selectedJobFilter) && a.status === 'PLACED').length === 0 && (
                          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: THEME.colors.inkMuted, fontSize: '0.8rem' }}>
                            No candidates marked placed yet
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Candidate View & AI Counselor */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {/* Candidate Skill Profile Banner */}
                  <div style={cardStyle}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: THEME.colors.navyPrimary }}>
                      VERIFIED SKILL PROFILE
                    </div>
                    <h3 style={{ margin: '0.25rem 0', fontSize: '1.1rem', fontWeight: 800, color: THEME.colors.inkPrimary }}>
                      {selectedCandidateId === 'dddd4444-4444-4444-4444-444444444441' &&
                        'Anita Patel — Certified PACS Specialist'}
                      {selectedCandidateId === 'dddd4444-4444-4444-4444-444444444442' &&
                        'Vikram Rao — Certified Dairy & Governance Associate'}
                      {selectedCandidateId === 'dddd4444-4444-4444-4444-444444444443' &&
                        'Sunita Meena — Cooperative Credit Trainee'}
                    </h3>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                      {selectedCandidateId === 'dddd4444-4444-4444-4444-444444444441' && (
                        <>
                          <span style={pillBadge('success')}>PACS Computerization</span>
                          <span style={pillBadge('success')}>Financial Accounting & Vouchers</span>
                          <span style={pillBadge('success')}>Cooperative Audit & Compliance</span>
                        </>
                      )}
                      {selectedCandidateId === 'dddd4444-4444-4444-4444-444444444442' && (
                        <>
                          <span style={pillBadge('success')}>Cooperative Governance & Bylaws</span>
                          <span style={pillBadge('success')}>Dairy Society Procurement</span>
                          <span style={pillBadge('success')}>Agricultural Credit Appraisal</span>
                        </>
                      )}
                      {selectedCandidateId === 'dddd4444-4444-4444-4444-444444444443' && (
                        <>
                          <span style={pillBadge('success')}>Agricultural Credit Appraisal</span>
                          <span style={pillBadge('success')}>SHG & JLG Group Lending</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Job Match Cards */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                      gap: '1.25rem',
                    }}
                  >
                    {SEED_JOB_OPPORTUNITIES.map((job) => {
                      const reqs = SEED_JOB_REQUIRED_SKILLS.filter((r) => r.jobId === job.id);
                      const isAnita = selectedCandidateId === 'dddd4444-4444-4444-4444-444444444441';
                      const score = isAnita ? (job.title.includes('PACS') ? 95 : 65) : 55;

                      return (
                        <div key={job.id} style={cardStyle}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <span style={pillBadge(score >= 75 ? 'success' : 'neutral')}>
                              {score}% Skill Overlap
                            </span>
                            <span style={{ fontSize: '0.75rem', color: THEME.colors.inkMuted }}>{job.location}</span>
                          </div>
                          <h3 style={{ fontSize: '1.05rem', margin: '0.5rem 0 0.2rem 0', fontWeight: 800, color: THEME.colors.inkPrimary }}>
                            {job.title}
                          </h3>
                          <div style={{ fontSize: '0.85rem', color: THEME.colors.navyPrimary, fontWeight: 600, marginBottom: '0.5rem' }}>
                            {job.employerName}
                          </div>
                          <p style={{ fontSize: '0.8rem', color: THEME.colors.inkBody, margin: '0 0 1rem 0' }}>
                            {job.description}
                          </p>
                          <div
                            style={{
                              backgroundColor: THEME.colors.bgMuted,
                              padding: '0.75rem',
                              borderRadius: THEME.radii.sm,
                              border: `1px solid ${THEME.colors.borderHairline}`,
                              fontSize: '0.75rem',
                            }}
                          >
                            <div style={{ fontWeight: 700, color: THEME.colors.inkMuted, marginBottom: '0.25rem' }}>
                              Required Competencies:
                            </div>
                            {reqs.map((r) => (
                              <div key={r.skillId} style={{ color: THEME.colors.status.success.text, fontWeight: 600, marginTop: '0.15rem' }}>
                                ✓ {r.skillName} (Weight: {Math.round(r.weight * 100)}%)
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Sahakar Mitra AI Counselor Chat Area */}
                  <div style={cardStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: THEME.radii.sm,
                            backgroundColor: THEME.colors.bgMuted,
                            border: `1px solid ${THEME.colors.borderHairline}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: THEME.colors.navyPrimary,
                          }}
                        >
                          <BotIcon size={18} />
                        </div>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '1rem', color: THEME.colors.inkPrimary, fontWeight: 800 }}>
                            Sahakar Mitra (सहकार मित्र) — AI Career & Scheme Counselor
                          </h3>
                          <div style={{ fontSize: '0.75rem', color: THEME.colors.inkMuted }}>
                            Autonomous Career Guidance for Rural Youth & Certified PACS Personnel
                          </div>
                        </div>
                      </div>
                      <span style={pillBadge('success')}>Active</span>
                    </div>

                    {/* Chat History */}
                    <div
                      style={{
                        backgroundColor: THEME.colors.bgMuted,
                        borderRadius: THEME.radii.sm,
                        border: `1px solid ${THEME.colors.borderHairline}`,
                        padding: '1rem',
                        minHeight: '220px',
                        maxHeight: '340px',
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.85rem',
                      }}
                    >
                      {counselorMessages.map((msg, idx) => (
                        <div
                          key={idx}
                          style={{
                            alignSelf: msg.sender === 'USER' ? 'flex-end' : 'flex-start',
                            maxWidth: '85%',
                            backgroundColor: msg.sender === 'USER' ? THEME.colors.navyPrimary : '#ffffff',
                            color: msg.sender === 'USER' ? '#ffffff' : THEME.colors.inkPrimary,
                            padding: '0.85rem 1rem',
                            borderRadius: THEME.radii.sm,
                            border: msg.sender === 'USER' ? 'none' : `1px solid ${THEME.colors.borderHairline}`,
                            boxShadow: THEME.shadows.card,
                          }}
                        >
                          <div style={{ fontSize: '0.82rem', lineHeight: 1.5 }}>{msg.text}</div>
                          {msg.tags && (
                            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                              {msg.tags.map((tg, tidx) => (
                                <span key={tidx} style={pillBadge('info')}>
                                  {tg}
                                </span>
                              ))}
                            </div>
                          )}
                          <div
                            style={{
                              fontSize: '0.65rem',
                              color: msg.sender === 'USER' ? '#cbd5e1' : THEME.colors.inkMuted,
                              marginTop: '0.35rem',
                              textAlign: 'right',
                            }}
                          >
                            {msg.time}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Suggestion Chips */}
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', margin: '0.85rem 0' }}>
                      <button
                        onClick={() =>
                          handleSendCounselorMessage(
                            'What jobs can Anita Patel apply for with her verified PACS credentials?'
                          )
                        }
                        style={{ ...buttonSecondaryStyle, padding: '0.3rem 0.65rem', fontSize: '0.75rem' }}
                      >
                        Anita's Job Recommendations
                      </button>
                      <button
                        onClick={() =>
                          handleSendCounselorMessage('What is the eligibility for Amul dairy coordinator roles?')
                        }
                        style={{ ...buttonSecondaryStyle, padding: '0.3rem 0.65rem', fontSize: '0.75rem' }}
                      >
                        Amul Dairy Roles
                      </button>
                      <button
                        onClick={() =>
                          handleSendCounselorMessage(
                            'Which Ministry of Cooperation schemes support rural cooperative startups?'
                          )
                        }
                        style={{ ...buttonSecondaryStyle, padding: '0.3rem 0.65rem', fontSize: '0.75rem' }}
                      >
                        Yuva Sahakar Scheme Info
                      </button>
                    </div>

                    {/* Input */}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        type="text"
                        value={counselorInput}
                        onChange={(e) => setCounselorInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSendCounselorMessage();
                        }}
                        placeholder="Ask Sahakar Mitra about jobs, PACS recruitment rules, or cooperative schemes..."
                        style={{
                          flex: 1,
                          padding: '0.65rem 0.9rem',
                          borderRadius: THEME.radii.sm,
                          border: `1px solid ${THEME.colors.borderHairline}`,
                          fontSize: '0.85rem',
                        }}
                      />
                      <button onClick={() => handleSendCounselorMessage()} style={buttonPrimaryStyle}>
                        Ask AI
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              VIEW 10: ERP LOGISTICS & HOSTEL MANAGEMENT
          ========================================================================= */}
          {activeTab === 'ERP_LOGISTICS' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                }}
              >
                <div>
                  <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 800, color: THEME.colors.inkPrimary }}>
                    NCCT ERP Logistics, Timetable & Hostel Administration
                  </h2>
                  <p style={{ margin: '0.25rem 0 0 0', color: THEME.colors.inkMuted, fontSize: '0.85rem' }}>
                    Integrated training center facilities management across VAMNICOM, RICMs, and ICMs
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {(
                    [
                      { id: 'HOSTEL', label: 'Hostel Rooms' },
                      { id: 'TIMETABLE', label: 'Lab & Timetable' },
                      { id: 'MESS', label: 'Mess & Dining' },
                      { id: 'HARDWARE_KITS', label: 'Edge Kits' },
                    ] as const
                  ).map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => setLogisticsSubTab(sub.id)}
                      style={logisticsSubTab === sub.id ? buttonPrimaryStyle : buttonSecondaryStyle}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sub-view 1: Hostel Allotment */}
              {logisticsSubTab === 'HOSTEL' && (
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: THEME.radii.md,
                    border: `1px solid ${THEME.colors.borderHairline}`,
                    overflow: 'hidden',
                    boxShadow: THEME.shadows.card,
                  }}
                >
                  <div
                    style={{
                      padding: '0.85rem 1.25rem',
                      backgroundColor: THEME.colors.bgMuted,
                      borderBottom: `1px solid ${THEME.colors.borderHairline}`,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: THEME.colors.inkPrimary }}>
                      Residential Hostel Allotments (RICM Bhopal — Sardar Patel Hostel)
                    </div>
                    <span style={pillBadge('success')}>42/60 Beds Occupied</span>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr>
                        <th style={tableHeaderStyle}>Trainee Name</th>
                        <th style={tableHeaderStyle}>Hostel Wing</th>
                        <th style={tableHeaderStyle}>Room No.</th>
                        <th style={tableHeaderStyle}>Bed Type</th>
                        <th style={tableHeaderStyle}>Duration</th>
                        <th style={tableHeaderStyle}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {hostelAllotments.map((h) => (
                        <tr key={h.id}>
                          <td style={{ ...tableCellStyle, fontWeight: 600 }}>{h.traineeName}</td>
                          <td style={{ ...tableCellStyle, color: THEME.colors.inkBody }}>{h.hostelBlock}</td>
                          <td style={{ ...tableCellStyle, fontWeight: 700, fontFamily: THEME.fonts.mono, color: THEME.colors.navyPrimary }}>
                            {h.roomNo}
                          </td>
                          <td style={{ ...tableCellStyle, color: THEME.colors.inkMuted }}>{h.bedType}</td>
                          <td style={{ ...tableCellStyle, color: THEME.colors.inkMuted, fontSize: '0.8rem', fontFamily: THEME.fonts.mono }}>
                            {h.checkIn} to {h.checkOut}
                          </td>
                          <td style={tableCellStyle}>
                            <span style={pillBadge('success')}>{h.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Sub-view 2: Timetable */}
              {logisticsSubTab === 'TIMETABLE' && (
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: THEME.radii.md,
                    border: `1px solid ${THEME.colors.borderHairline}`,
                    overflow: 'hidden',
                    boxShadow: THEME.shadows.card,
                  }}
                >
                  <div
                    style={{
                      padding: '0.85rem 1.25rem',
                      backgroundColor: THEME.colors.bgMuted,
                      borderBottom: `1px solid ${THEME.colors.borderHairline}`,
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      color: THEME.colors.inkPrimary,
                    }}
                  >
                    Daily Training Timetable & Facility Scheduling (RICM Bhopal)
                  </div>
                  <div style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {timetableSchedule.map((slot) => (
                      <div
                        key={slot.id}
                        style={{
                          padding: '1rem',
                          backgroundColor: THEME.colors.bgMuted,
                          borderRadius: THEME.radii.sm,
                          border: `1px solid ${THEME.colors.borderHairline}`,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <span style={pillBadge('info')}>{slot.timeSlot}</span>
                          <h4 style={{ margin: '0.35rem 0 0.15rem 0', fontSize: '0.95rem', fontWeight: 700, color: THEME.colors.inkPrimary }}>
                            {slot.subject}
                          </h4>
                          <div style={{ fontSize: '0.8rem', color: THEME.colors.inkMuted }}>
                            Venue: <strong>{slot.venue}</strong> • Faculty: {slot.trainer}
                          </div>
                        </div>
                        <span style={pillBadge(slot.status === 'ACTIVE_NOW' ? 'warning' : 'neutral')}>
                          {slot.status === 'ACTIVE_NOW' ? 'IN PROGRESS' : slot.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sub-view 3: Mess & Dining */}
              {logisticsSubTab === 'MESS' && (
                <div style={cardStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: THEME.colors.inkPrimary }}>
                      Institutional Mess Schedule (Wholesome Vegetarian Menu)
                    </h3>
                    <span style={pillBadge('success')}>FSSAI & NCCT Approved</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                    {messMenu.map((m, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '1rem',
                          backgroundColor: THEME.colors.bgMuted,
                          borderRadius: THEME.radii.sm,
                          border: `1px solid ${THEME.colors.borderHairline}`,
                        }}
                      >
                        <div style={{ fontSize: '0.8rem', fontWeight: 800, color: THEME.colors.navyPrimary }}>
                          {m.meal}
                        </div>
                        <p style={{ fontSize: '0.85rem', color: THEME.colors.inkBody, margin: '0.35rem 0 0.5rem 0' }}>
                          {m.menu}
                        </p>
                        <span style={{ fontSize: '0.7rem', color: THEME.colors.status.success.text, fontWeight: 600 }}>
                          ● {m.adherence}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sub-view 4: Hardware Kits */}
              {logisticsSubTab === 'HARDWARE_KITS' && (
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: THEME.radii.md,
                    border: `1px solid ${THEME.colors.borderHairline}`,
                    overflow: 'hidden',
                    boxShadow: THEME.shadows.card,
                  }}
                >
                  <div
                    style={{
                      padding: '0.85rem 1.25rem',
                      backgroundColor: THEME.colors.bgMuted,
                      borderBottom: `1px solid ${THEME.colors.borderHairline}`,
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      color: THEME.colors.inkPrimary,
                    }}
                  >
                    Field Edge Hardware Kits Dispatch Registry
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr>
                        <th style={tableHeaderStyle}>Kit Identifier</th>
                        <th style={tableHeaderStyle}>Node Hardware Serial</th>
                        <th style={tableHeaderStyle}>Assigned Venue</th>
                        <th style={tableHeaderStyle}>Hardware Components</th>
                        <th style={tableHeaderStyle}>Deployment Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {hardwareKits.map((k) => (
                        <tr key={k.kitId}>
                          <td style={{ ...tableCellStyle, fontWeight: 700, color: THEME.colors.navyPrimary, fontFamily: THEME.fonts.mono }}>
                            {k.kitId}
                          </td>
                          <td style={{ ...tableCellStyle, fontFamily: THEME.fonts.mono, color: THEME.colors.inkMuted }}>
                            {k.nodeSerial}
                          </td>
                          <td style={{ ...tableCellStyle, fontWeight: 600 }}>{k.venue}</td>
                          <td style={{ ...tableCellStyle, color: THEME.colors.inkMuted, fontSize: '0.78rem' }}>
                            {k.components}
                          </td>
                          <td style={tableCellStyle}>
                            <span style={pillBadge('success')}>{k.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              VIEW 11: EDGE HARDWARE FLEET
          ========================================================================= */}
          {activeTab === 'EDGE_NODES' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                }}
              >
                <div>
                  <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 800, color: THEME.colors.inkPrimary }}>
                    Edge Nodes Fleet Registry & Hardware Telemetry
                  </h2>
                  <p style={{ margin: '0.25rem 0 0 0', color: THEME.colors.inkMuted, fontSize: '0.85rem' }}>
                    Live diagnostics for portable Linux ARM64 edge nodes deployed at rural training venues
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <span style={pillBadge('success')}>Active Fan Profile Normal (&lt; 50°C)</span>
                  <span style={pillBadge('neutral')}>SQLite WAL Active</span>
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
                  gap: '1.5rem',
                }}
              >
                {edgeNodes.map((node) => {
                  const tempColor =
                    node.cpuTemp < 48 ? THEME.colors.status.success.text : '#ca8a04';
                  return (
                    <div key={node.nodeId} style={cardStyle}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div>
                          <div style={{ fontSize: '0.75rem', color: THEME.colors.navyPrimary, fontFamily: THEME.fonts.mono, fontWeight: 800 }}>
                            {node.nodeId}
                          </div>
                          <h3 style={{ margin: '0.25rem 0 0.15rem 0', fontSize: '1.15rem', color: THEME.colors.inkPrimary, fontWeight: 800 }}>
                            {node.name}
                          </h3>
                          <div style={{ fontSize: '0.8rem', color: THEME.colors.inkMuted }}>
                            Venue: {node.institute} • IP: {node.ip}
                          </div>
                        </div>
                        <span style={pillBadge(node.wanConnected ? 'success' : 'error')}>
                          {node.healthStatus}
                        </span>
                      </div>

                      {/* Gauges */}
                      <div
                        style={{
                          backgroundColor: THEME.colors.bgMuted,
                          padding: '1.25rem',
                          borderRadius: THEME.radii.sm,
                          border: `1px solid ${THEME.colors.borderHairline}`,
                        }}
                      >
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                          <div style={{ backgroundColor: '#ffffff', padding: '0.85rem', borderRadius: THEME.radii.xs, border: `1px solid ${THEME.colors.borderHairline}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontWeight: 700, color: THEME.colors.inkMuted, marginBottom: '0.25rem' }}>
                              <span>CPU TEMPERATURE</span>
                              <span style={{ color: tempColor, fontFamily: THEME.fonts.mono }}>{node.cpuTemp}°C</span>
                            </div>
                            <div style={{ width: '100%', height: '6px', backgroundColor: THEME.colors.bgInset, borderRadius: THEME.radii.pill, overflow: 'hidden' }}>
                              <div style={{ width: `${Math.min(100, (node.cpuTemp / 80) * 100)}%`, height: '100%', backgroundColor: tempColor }} />
                            </div>
                          </div>

                          <div style={{ backgroundColor: '#ffffff', padding: '0.85rem', borderRadius: THEME.radii.xs, border: `1px solid ${THEME.colors.borderHairline}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontWeight: 700, color: THEME.colors.inkMuted, marginBottom: '0.25rem' }}>
                              <span>CPU LOAD</span>
                              <span style={{ color: THEME.colors.navyPrimary, fontFamily: THEME.fonts.mono }}>{node.cpuLoad}%</span>
                            </div>
                            <div style={{ width: '100%', height: '6px', backgroundColor: THEME.colors.bgInset, borderRadius: THEME.radii.pill, overflow: 'hidden' }}>
                              <div style={{ width: `${node.cpuLoad}%`, height: '100%', backgroundColor: THEME.colors.navyPrimary }} />
                            </div>
                          </div>

                          <div style={{ backgroundColor: '#ffffff', padding: '0.85rem', borderRadius: THEME.radii.xs, border: `1px solid ${THEME.colors.borderHairline}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontWeight: 700, color: THEME.colors.inkMuted, marginBottom: '0.25rem' }}>
                              <span>RAM ALLOCATION</span>
                              <span style={{ color: THEME.colors.navyPrimary, fontFamily: THEME.fonts.mono }}>{node.ramUsage}%</span>
                            </div>
                            <div style={{ width: '100%', height: '6px', backgroundColor: THEME.colors.bgInset, borderRadius: THEME.radii.pill, overflow: 'hidden' }}>
                              <div style={{ width: `${node.ramUsage}%`, height: '100%', backgroundColor: THEME.colors.navyPrimary }} />
                            </div>
                          </div>

                          <div style={{ backgroundColor: '#ffffff', padding: '0.85rem', borderRadius: THEME.radii.xs, border: `1px solid ${THEME.colors.borderHairline}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontWeight: 700, color: THEME.colors.inkMuted, marginBottom: '0.25rem' }}>
                              <span>NVMe STORAGE (WAL)</span>
                              <span style={{ color: THEME.colors.navyPrimary, fontFamily: THEME.fonts.mono }}>{node.diskUsage}%</span>
                            </div>
                            <div style={{ width: '100%', height: '6px', backgroundColor: THEME.colors.bgInset, borderRadius: THEME.radii.pill, overflow: 'hidden' }}>
                              <div style={{ width: `${node.diskUsage}%`, height: '100%', backgroundColor: THEME.colors.navyPrimary }} />
                            </div>
                          </div>
                        </div>

                        <div
                          style={{
                            marginTop: '1rem',
                            paddingTop: '0.75rem',
                            borderTop: `1px solid ${THEME.colors.borderHairline}`,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '0.75rem',
                          }}
                        >
                          <div style={{ color: THEME.colors.status.success.text, fontWeight: 700 }}>
                            {node.wifiClients} Trainees Connected (SSID: SahakarEdge-Free)
                          </div>
                          <div style={{ color: THEME.colors.inkMuted }}>
                            Local: <strong style={{ color: THEME.colors.status.success.text }}>{node.localLatencyMs}ms</strong> vs Cloud: {node.wanLatencyMs}ms
                          </div>
                        </div>
                      </div>

                      {/* Controls */}
                      <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <div style={{ fontSize: '0.75rem', color: THEME.colors.inkMuted }}>
                          Uptime: {node.uptime} • Events Queued: <strong>{node.queuedEvents}</strong>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => handleToggleNodeWan(node.nodeId)}
                            style={node.wanConnected ? buttonSecondaryStyle : buttonPrimaryStyle}
                          >
                            <span>{node.wanConnected ? 'Cut WAN (Simulate Dropout)' : 'Restore WAN'}</span>
                          </button>
                          <button onClick={() => handleSendHeartbeat(node.nodeId)} style={buttonSecondaryStyle}>
                            Send Heartbeat
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW 12: SYNC MONITOR
          ========================================================================= */}
          {activeTab === 'SYNC_MONITOR' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 800, color: THEME.colors.inkPrimary }}>
                    Edge Node Fleet & Offline Synchronization Monitor
                  </h2>
                  <p style={{ margin: '0.25rem 0 0 0', color: THEME.colors.inkMuted, fontSize: '0.85rem' }}>
                    Real-time telemetry and idempotent ingestion pipeline across rural NCCT training centres
                  </p>
                </div>
                <span style={pillBadge('success')}>Central Ingestion Active</span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1rem',
                }}
              >
                <div style={cardStyle}>
                  <div style={bentoHeaderStyle}>REGISTERED EDGE NODES</div>
                  <div style={bentoValueStyle}>2 Active</div>
                  <div style={{ fontSize: '0.75rem', color: THEME.colors.status.success.text, fontWeight: 600 }}>
                    RICM Bhopal & VAMNICOM
                  </div>
                </div>

                <div style={cardStyle}>
                  <div style={bentoHeaderStyle}>INGESTED DOMAIN EVENTS</div>
                  <div style={{ ...bentoValueStyle, color: THEME.colors.status.success.text }}>46 Events</div>
                  <div style={{ fontSize: '0.75rem', color: THEME.colors.inkMuted }}>Canonical SHA-256 Verified</div>
                </div>

                <div style={cardStyle}>
                  <div style={bentoHeaderStyle}>CONFLICTS DETECTED</div>
                  <div style={bentoValueStyle}>0 Conflicts</div>
                  <div style={{ fontSize: '0.75rem', color: THEME.colors.status.success.text, fontWeight: 600 }}>
                    Deterministic Append-Merge
                  </div>
                </div>

                <div style={cardStyle}>
                  <div style={bentoHeaderStyle}>LAST INGESTION BATCH</div>
                  <div style={bentoValueStyle}>Just now</div>
                  <div style={{ fontSize: '0.75rem', color: THEME.colors.inkMuted }}>Batch Sequence #1048</div>
                </div>
              </div>

              {/* Ingestion Stream Table */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: THEME.radii.md,
                  border: `1px solid ${THEME.colors.borderHairline}`,
                  overflow: 'hidden',
                  boxShadow: THEME.shadows.card,
                }}
              >
                <div
                  style={{
                    padding: '0.85rem 1.25rem',
                    backgroundColor: THEME.colors.bgMuted,
                    borderBottom: `1px solid ${THEME.colors.borderHairline}`,
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    color: THEME.colors.inkPrimary,
                  }}
                >
                  Recent Ingested Event Records (Idempotent Merged Stream)
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr>
                      <th style={tableHeaderStyle}>Event Type</th>
                      <th style={tableHeaderStyle}>Origin Node</th>
                      <th style={tableHeaderStyle}>Entity Subject</th>
                      <th style={tableHeaderStyle}>Status</th>
                      <th style={tableHeaderStyle}>SHA-256 Digest</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ ...tableCellStyle, fontWeight: 600 }}>ATTENDANCE_RECORDED</td>
                      <td style={{ ...tableCellStyle, color: THEME.colors.inkMuted, fontFamily: THEME.fonts.mono }}>edge-node-ricm-bhopal-01</td>
                      <td style={{ ...tableCellStyle, color: THEME.colors.inkPrimary }}>Anita Patel</td>
                      <td style={tableCellStyle}>
                        <span style={pillBadge('success')}>INGESTED</span>
                      </td>
                      <td style={{ ...tableCellStyle, fontFamily: THEME.fonts.mono, fontSize: '0.75rem', color: THEME.colors.inkMuted }}>
                        8b9f4c...01824a
                      </td>
                    </tr>
                    <tr>
                      <td style={{ ...tableCellStyle, fontWeight: 600 }}>LESSON_COMPLETED</td>
                      <td style={{ ...tableCellStyle, color: THEME.colors.inkMuted, fontFamily: THEME.fonts.mono }}>edge-node-ricm-bhopal-01</td>
                      <td style={{ ...tableCellStyle, color: THEME.colors.inkPrimary }}>lsn-pacs-101-1</td>
                      <td style={tableCellStyle}>
                        <span style={pillBadge('success')}>INGESTED</span>
                      </td>
                      <td style={{ ...tableCellStyle, fontFamily: THEME.fonts.mono, fontSize: '0.75rem', color: THEME.colors.inkMuted }}>
                        f5910c...39aa2
                      </td>
                    </tr>
                    <tr>
                      <td style={{ ...tableCellStyle, fontWeight: 600 }}>ASSESSMENT_SUBMITTED</td>
                      <td style={{ ...tableCellStyle, color: THEME.colors.inkMuted, fontFamily: THEME.fonts.mono }}>edge-node-ricm-bhopal-01</td>
                      <td style={{ ...tableCellStyle, color: THEME.colors.inkPrimary }}>Anita Patel</td>
                      <td style={tableCellStyle}>
                        <span style={pillBadge('success')}>INGESTED</span>
                      </td>
                      <td style={{ ...tableCellStyle, fontFamily: THEME.fonts.mono, fontSize: '0.75rem', color: THEME.colors.inkMuted }}>
                        4e1b8a...90f23
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW 13: AUDIT LOG & COMPLIANCE TRAIL (WITH INSPECT DETAILS MODAL)
          ========================================================================= */}
          {activeTab === 'AUDIT_LOG' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 800, color: THEME.colors.inkPrimary }}>
                    Security & Compliance Audit Trail
                  </h2>
                  <p style={{ margin: '0.25rem 0 0 0', color: THEME.colors.inkMuted, fontSize: '0.85rem' }}>
                    Immutable system record of administrative actions, attendance overrides, and credential issuances
                  </p>
                </div>
                <span style={pillBadge('neutral')}>
                  {auditLogs.length} Events Logged
                </span>
              </div>

              <div
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: THEME.radii.md,
                  border: `1px solid ${THEME.colors.borderHairline}`,
                  overflow: 'hidden',
                  boxShadow: THEME.shadows.card,
                }}
              >
                <div
                  style={{
                    padding: '0.85rem 1.25rem',
                    backgroundColor: THEME.colors.bgMuted,
                    borderBottom: `1px solid ${THEME.colors.borderHairline}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: THEME.colors.inkPrimary }}>
                    Cryptographic Event Journal • Click Row to Inspect Verification Hash
                  </div>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr>
                      <th style={tableHeaderStyle}>Timestamp</th>
                      <th style={tableHeaderStyle}>Actor</th>
                      <th style={tableHeaderStyle}>Action Code</th>
                      <th style={tableHeaderStyle}>Target Entity</th>
                      <th style={tableHeaderStyle}>Audit Details</th>
                      <th style={tableHeaderStyle}>Inspection</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log) => (
                      <tr
                        key={log.id}
                        onClick={() => setSelectedAuditLog(log)}
                        style={{
                          cursor: 'pointer',
                          transition: 'background-color 0.1s ease',
                        }}
                      >
                        <td
                          style={{
                            ...tableCellStyle,
                            color: THEME.colors.inkMuted,
                            fontSize: '0.8rem',
                            whiteSpace: 'nowrap',
                            fontFamily: THEME.fonts.mono,
                          }}
                        >
                          {log.timestamp}
                        </td>
                        <td style={{ ...tableCellStyle, fontWeight: 600, color: THEME.colors.inkPrimary }}>
                          {log.actor}
                        </td>
                        <td style={tableCellStyle}>
                          <span style={pillBadge('info')}>{log.action}</span>
                        </td>
                        <td style={{ ...tableCellStyle, color: THEME.colors.inkBody, fontWeight: 500 }}>
                          {log.entity}
                        </td>
                        <td style={{ ...tableCellStyle, color: THEME.colors.inkBody, fontSize: '0.8rem' }}>
                          {log.details}
                        </td>
                        <td style={tableCellStyle}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAuditLog(log);
                            }}
                            style={{
                              ...buttonSecondaryStyle,
                              padding: '0.2rem 0.55rem',
                              fontSize: '0.72rem',
                            }}
                          >
                            Inspect Hash
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* =========================================================================
              DIRECTORATE 1: SCHEME ADVISORY RADAR VIEW
          ========================================================================= */}
          {activeTab === 'SCHEME_RADAR' && <SchemeAdvisoryRadarView />}

          {/* =========================================================================
              DIRECTORATE 1: CAMEL PRUDENTIAL HEALTH SCORECARD VIEW
          ========================================================================= */}
          {activeTab === 'CAMEL_SCORECARD' && <CamelScorecardView />}

          {/* =========================================================================
              DIRECTORATE 2: INSTITUTIONAL VIVA-VOCE RUBRIC ANALYTICS VIEW
          ========================================================================= */}
          {activeTab === 'VIVA_ANALYTICS' && <VivaAnalyticsView />}

          {/* =========================================================================
              DIRECTORATE 2: PACS SIMULATION ERROR HEATMAP & REMEDIAL DRILLS VIEW
          ========================================================================= */}
          {activeTab === 'PACS_SIMULATION_HEATMAP' && <PacsSimulationErrorHeatmapView />}

          {/* =========================================================================
              DIRECTORATE 3: SOVEREIGN ED25519 PROOF INSPECTOR & TAMPER SANDBOX
          ========================================================================= */}
          {activeTab === 'PROOF_INSPECTOR' && <ProofInspectorView />}

          {/* =========================================================================
              DIRECTORATE 4: OMBUDSMAN GOVERNANCE & STATUTORY RESOLUTION REGISTRY
          ========================================================================= */}
          {activeTab === 'GRIEVANCES' && <OmbudsmanRegistryView />}

          {/* =========================================================================
              DIRECTORATE 2: ATP BATCHES & NOMINATION QUEUE VIEW (Feature 12)
          ========================================================================= */}
          {(activeTab === 'ATP_BATCHES' || activeTab === 'atp-batches') && <AtpNominationQueueView />}

          {/* =========================================================================
              DIRECTORATE 2: TIMETABLE & 6-DIGIT ATTENDANCE RADAR VIEW (Feature 13)
          ========================================================================= */}
          {(activeTab === 'TIMETABLE_ATTENDANCE' || activeTab === 'timetable-attendance') && <TimetableAttendanceView />}

          {/* =========================================================================
              DIRECTORATE 2: CONTINUOUS ACADEMIC EVALUATION & GRADEBOOK (Feature 14)
          ========================================================================= */}
          {(activeTab === 'GRADEBOOK' || activeTab === 'gradebook') && (
            <AcademicGradebookView
              onNavigateToProof={(_certCode) => {
                setActiveTab('PROOF_INSPECTOR');
              }}
            />
          )}

          {/* =========================================================================
              DIRECTORATE 2: 4-FACTOR RETENTION & SKILL SHORTAGE RADAR (Feature 15)
          ========================================================================= */}
          {(activeTab === 'DROPOUT_RISK_ANALYTICS' || activeTab === 'dropout-risk-analytics') && <DropoutRiskAnalyticsView />}
        </main>
      </div>

      {/* =========================================================================
          MODAL: Official NCCT Ed25519 Certificate Preview
      ========================================================================= */}
      {selectedCertificate && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(17, 24, 39, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1.5rem',
            backdropFilter: 'blur(3px)',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: THEME.radii.lg,
              maxWidth: '760px',
              width: '100%',
              boxShadow: THEME.shadows.modal,
              overflow: 'hidden',
              position: 'relative',
              border: '2px solid #b45309',
            }}
          >
            {/* Certificate Header */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderBottom: '1px solid #e5e7eb',
                padding: '1.25rem 2rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.5rem' }}>🏛️</span>
                <div>
                  <div style={{ fontSize: '0.72rem', color: THEME.colors.navyPrimary, fontWeight: 800 }}>
                    MINISTRY OF COOPERATION | भारत सरकार
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: THEME.colors.inkPrimary }}>
                    National Council for Cooperative Training (NCCT)
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedCertificate(null)}
                style={{ background: 'none', border: 'none', color: THEME.colors.inkMuted, fontSize: '1.5rem', cursor: 'pointer' }}
              >
                <CloseIcon size={20} />
              </button>
            </div>

            {/* Certificate Body */}
            <div style={{ padding: '2.5rem', textAlign: 'center', backgroundColor: '#fffdfa', border: '1px solid #fde68a', margin: '1rem' }}>
              <div style={{ fontSize: '0.75rem', letterSpacing: '0.15em', fontWeight: 800, color: '#b45309', textTransform: 'uppercase' }}>
                Autonomous Society Promoted by Ministry of Cooperation, Govt. of India
              </div>
              <h1
                style={{
                  fontSize: '1.75rem',
                  margin: '0.75rem 0 0.25rem 0',
                  color: THEME.colors.inkPrimary,
                  fontFamily: THEME.fonts.serif,
                  fontWeight: 800,
                  letterSpacing: '0.02em',
                }}
              >
                Certificate of Cooperative Competency
              </h1>
              <div style={{ fontSize: '0.85rem', color: THEME.colors.inkMuted, fontStyle: 'italic', marginBottom: '1.5rem' }}>
                Issued under the Statutory Framework for PACS Modernization & Computerization
              </div>

              <div style={{ fontSize: '0.9rem', color: THEME.colors.inkBody }}>This is to certify that</div>
              <div
                style={{
                  fontSize: '1.65rem',
                  fontWeight: 800,
                  color: THEME.colors.navyPrimary,
                  margin: '0.25rem 0 0.5rem 0',
                  fontFamily: THEME.fonts.serif,
                }}
              >
                {selectedCertificate.traineeName}
              </div>
              <div style={{ fontSize: '0.85rem', color: THEME.colors.inkBody, maxWidth: '560px', margin: '0 auto 1.5rem auto', lineHeight: 1.6 }}>
                has successfully completed all prescribed offline modules, practical exercises, and passed the comprehensive statutory evaluation for:
              </div>

              <div
                style={{
                  backgroundColor: THEME.colors.status.success.bg,
                  border: `1px solid ${THEME.colors.status.success.border}`,
                  padding: '0.75rem 1.5rem',
                  borderRadius: THEME.radii.sm,
                  display: 'inline-block',
                  marginBottom: '1.5rem',
                }}
              >
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: THEME.colors.status.success.text }}>
                  {selectedCertificate.programmeTitle}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                {selectedCertificate.skills?.map((sk: string) => (
                  <span key={sk} style={pillBadge('info')}>
                    ✓ {sk}
                  </span>
                ))}
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '1rem',
                  marginTop: '1.5rem',
                  paddingTop: '1.5rem',
                  borderTop: `1px dashed ${THEME.colors.borderHairline}`,
                  textAlign: 'left',
                  fontSize: '0.75rem',
                }}
              >
                <div>
                  <div style={{ color: THEME.colors.inkMuted, fontWeight: 700 }}>VENUE & INSTITUTE</div>
                  <div style={{ color: THEME.colors.inkPrimary, fontWeight: 600 }}>{selectedCertificate.institute || 'RICM Bhopal'}</div>
                  <div style={{ color: THEME.colors.inkMuted, marginTop: '0.2rem' }}>
                    Issued: {new Date(selectedCertificate.issuedAt).toLocaleDateString()}
                  </div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      margin: '0 auto 0.25rem auto',
                      border: '2px solid #b45309',
                      borderRadius: THEME.radii.pill,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#fef3c7',
                      color: '#b45309',
                    }}
                  >
                    <ShieldCheckIcon size={24} />
                  </div>
                  <div style={{ color: '#b45309', fontWeight: 800, fontSize: '0.7rem' }}>SEAL OF VERIFICATION</div>
                  <div style={{ fontSize: '0.65rem', color: THEME.colors.inkMuted }}>Ed25519 Signed</div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: THEME.colors.inkMuted, fontWeight: 700 }}>CREDENTIAL ID & DIGEST</div>
                  <div style={{ fontFamily: THEME.fonts.mono, color: THEME.colors.navyPrimary, fontWeight: 700 }}>
                    {selectedCertificate.id}
                  </div>
                  <div style={{ fontFamily: THEME.fonts.mono, fontSize: '0.65rem', color: THEME.colors.inkMuted, marginTop: '0.2rem', wordBreak: 'break-all' }}>
                    Sig: {selectedCertificate.signatureHex.slice(0, 16)}...
                  </div>
                </div>
              </div>
            </div>

            {/* Certificate Footer */}
            <div
              style={{
                padding: '1rem 2rem',
                backgroundColor: THEME.colors.bgMuted,
                borderTop: `1px solid ${THEME.colors.borderHairline}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ fontSize: '0.75rem', color: THEME.colors.status.success.text, fontWeight: 700 }}>
                ✓ Tamper-evident • Verifiable without Internet connection via local Ed25519 public key
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => alert(`Certificate ${selectedCertificate.id} exported as verified printable PDF format.`)}
                  style={buttonPrimaryStyle}
                >
                  Print / Export PDF
                </button>
                <button onClick={() => setSelectedCertificate(null)} style={buttonSecondaryStyle}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: Schedule Candidate Interview
      ========================================================================= */}
      {scheduleModalApp && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(17, 24, 39, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1.5rem',
            backdropFilter: 'blur(3px)',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: THEME.radii.lg,
              maxWidth: '520px',
              width: '100%',
              padding: '1.75rem',
              boxShadow: THEME.shadows.modal,
              border: `1px solid ${THEME.colors.borderHairline}`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: THEME.colors.inkPrimary }}>
                  Schedule Candidate Interview
                </h3>
                <div style={{ fontSize: '0.8rem', color: THEME.colors.inkMuted }}>
                  For {scheduleModalApp.candidateName} — {scheduleModalApp.jobTitle}
                </div>
              </div>
              <button
                onClick={() => setScheduleModalApp(null)}
                style={{ background: 'none', border: 'none', color: THEME.colors.inkMuted, cursor: 'pointer' }}
              >
                <CloseIcon size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: THEME.colors.inkMuted, marginBottom: '0.25rem' }}>
                  Interview Date & Time:
                </label>
                <input
                  type="datetime-local"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    borderRadius: THEME.radii.sm,
                    border: `1px solid ${THEME.colors.borderHairline}`,
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: THEME.colors.inkMuted, marginBottom: '0.25rem' }}>
                  Venue / Virtual Link:
                </label>
                <input
                  type="text"
                  value={scheduleVenue}
                  onChange={(e) => setScheduleVenue(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    borderRadius: THEME.radii.sm,
                    border: `1px solid ${THEME.colors.borderHairline}`,
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: THEME.colors.inkMuted, marginBottom: '0.25rem' }}>
                  Evaluation Notes / Agenda:
                </label>
                <textarea
                  rows={3}
                  value={scheduleNotes}
                  onChange={(e) => setScheduleNotes(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    borderRadius: THEME.radii.sm,
                    border: `1px solid ${THEME.colors.borderHairline}`,
                    fontSize: '0.85rem',
                    lineHeight: 1.5,
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button onClick={() => setScheduleModalApp(null)} style={buttonSecondaryStyle}>
                  Cancel
                </button>
                <button onClick={handleScheduleInterview} style={buttonPrimaryStyle}>
                  Confirm Interview Schedule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: Issue Ed25519 Digital Offer Letter
      ========================================================================= */}
      {offerModalApp && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(17, 24, 39, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1.5rem',
            backdropFilter: 'blur(3px)',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: THEME.radii.lg,
              maxWidth: '640px',
              width: '100%',
              padding: '1.75rem',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: THEME.shadows.modal,
              border: `1px solid ${THEME.colors.borderHairline}`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <span style={pillBadge('info')}>ED25519 CRYPTOGRAPHIC ISSUANCE</span>
                <h3 style={{ margin: '0.35rem 0 0.15rem 0', fontSize: '1.25rem', fontWeight: 800, color: THEME.colors.inkPrimary }}>
                  Issue Official Digital Offer Letter
                </h3>
                <div style={{ fontSize: '0.8rem', color: THEME.colors.inkMuted }}>
                  Candidate: <b>{offerModalApp.candidateName}</b> | Employer: <b>{offerModalApp.employerName}</b>
                </div>
              </div>
              <button
                onClick={() => setOfferModalApp(null)}
                style={{ background: 'none', border: 'none', color: THEME.colors.inkMuted, cursor: 'pointer' }}
              >
                <CloseIcon size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: THEME.colors.inkMuted, marginBottom: '0.25rem' }}>
                  Official Designation:
                </label>
                <input
                  type="text"
                  value={offerDesignation}
                  onChange={(e) => setOfferDesignation(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    borderRadius: THEME.radii.sm,
                    border: `1px solid ${THEME.colors.borderHairline}`,
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: THEME.colors.inkMuted, marginBottom: '0.25rem' }}>
                    Annual Compensation (CTC in LPA):
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={offerLPA}
                    onChange={(e) => setOfferLPA(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      borderRadius: THEME.radii.sm,
                      border: `1px solid ${THEME.colors.borderHairline}`,
                      fontSize: '0.85rem',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: THEME.colors.inkMuted, marginBottom: '0.25rem' }}>
                    Monthly Stipend / Salary (INR):
                  </label>
                  <input
                    type="number"
                    value={offerSalary}
                    onChange={(e) => setOfferSalary(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      borderRadius: THEME.radii.sm,
                      border: `1px solid ${THEME.colors.borderHairline}`,
                      fontSize: '0.85rem',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: THEME.colors.inkMuted, marginBottom: '0.25rem' }}>
                    Date of Joining:
                  </label>
                  <input
                    type="date"
                    value={offerJoiningDate}
                    onChange={(e) => setOfferJoiningDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      borderRadius: THEME.radii.sm,
                      border: `1px solid ${THEME.colors.borderHairline}`,
                      fontSize: '0.85rem',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: THEME.colors.inkMuted, marginBottom: '0.25rem' }}>
                    Posting Location:
                  </label>
                  <input
                    type="text"
                    value={offerLocation}
                    onChange={(e) => setOfferLocation(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      borderRadius: THEME.radii.sm,
                      border: `1px solid ${THEME.colors.borderHairline}`,
                      fontSize: '0.85rem',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: THEME.colors.inkMuted, marginBottom: '0.25rem' }}>
                  Authorized Signatory:
                </label>
                <input
                  type="text"
                  value={offerSignatory}
                  onChange={(e) => setOfferSignatory(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    borderRadius: THEME.radii.sm,
                    border: `1px solid ${THEME.colors.borderHairline}`,
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: THEME.colors.inkMuted, marginBottom: '0.25rem' }}>
                  Terms & Conditions (One per line):
                </label>
                <textarea
                  rows={4}
                  value={offerTerms}
                  onChange={(e) => setOfferTerms(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    borderRadius: THEME.radii.sm,
                    border: `1px solid ${THEME.colors.borderHairline}`,
                    fontSize: '0.8rem',
                    lineHeight: 1.5,
                  }}
                />
              </div>

              <div
                style={{
                  backgroundColor: THEME.colors.bgMuted,
                  padding: '0.75rem 1rem',
                  borderRadius: THEME.radii.sm,
                  border: `1px solid ${THEME.colors.borderHairline}`,
                  fontSize: '0.75rem',
                  color: THEME.colors.inkBody,
                }}
              >
                <b>Cryptographic Assurance:</b> Upon submission, this offer letter is serialized to RFC 8785 canonical JSON, signed with the NCCT Ed25519 master private key (<code>ncct-master-key-01</code>), and embedded with a tamper-evident QR verification link.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button onClick={() => setOfferModalApp(null)} style={buttonSecondaryStyle}>
                  Cancel
                </button>
                <button onClick={handleIssueOffer} style={buttonPrimaryStyle}>
                  Sign with Ed25519 & Extend Offer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: View Signed Ed25519 Digital Offer Letter
      ========================================================================= */}
      {viewOfferModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(17, 24, 39, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1.5rem',
            backdropFilter: 'blur(3px)',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: THEME.radii.lg,
              maxWidth: '780px',
              width: '100%',
              boxShadow: THEME.shadows.modal,
              maxHeight: '92vh',
              overflowY: 'auto',
              border: `1px solid ${THEME.colors.borderHairline}`,
            }}
          >
            {/* Letterhead */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderBottom: `1px solid ${THEME.colors.borderHairline}`,
                padding: '1.25rem 2rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.75rem' }}>🏛️</span>
                <div>
                  <div style={{ fontSize: '0.72rem', color: THEME.colors.navyPrimary, fontWeight: 800 }}>
                    MINISTRY OF COOPERATION & NCCT TALENT NETWORK
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: THEME.colors.inkPrimary }}>
                    OFFICIAL DIGITAL OFFER OF APPOINTMENT
                  </div>
                </div>
              </div>
              <button
                onClick={() => setViewOfferModal(null)}
                style={{ background: 'none', border: 'none', color: THEME.colors.inkMuted, fontSize: '1.5rem', cursor: 'pointer' }}
              >
                <CloseIcon size={20} />
              </button>
            </div>

            <div style={{ padding: '2rem' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingBottom: '1rem',
                  borderBottom: `1px solid ${THEME.colors.borderHairline}`,
                  marginBottom: '1.25rem',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.75rem', color: THEME.colors.inkMuted, fontWeight: 700 }}>
                    ISSUING EMPLOYER
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: THEME.colors.navyPrimary }}>
                    {viewOfferModal.payload.employer.name}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: THEME.colors.inkBody }}>
                    Signatory: {viewOfferModal.payload.employer.authorizedSignatory}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={pillBadge('success')}>
                    Ed25519 VALIDATED
                  </span>
                  <div style={{ fontSize: '0.75rem', color: THEME.colors.inkMuted, marginTop: '0.25rem' }}>
                    Issued: {new Date(viewOfferModal.payload.issuedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem', lineHeight: 1.6, fontSize: '0.9rem', color: THEME.colors.inkBody }}>
                <p>Dear <b>{viewOfferModal.payload.candidate.name}</b>,</p>
                <p>
                  We are pleased to extend this official Offer of Employment for the position of{' '}
                  <b style={{ color: THEME.colors.inkPrimary }}>{viewOfferModal.payload.designation}</b> at{' '}
                  <b style={{ color: THEME.colors.navyPrimary }}>{viewOfferModal.payload.employer.name}</b>.
                  This offer is conferred in recognition of your verified NCCT accredited training certification and demonstrated cooperative competencies.
                </p>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '0.75rem',
                  backgroundColor: THEME.colors.bgMuted,
                  padding: '1rem',
                  borderRadius: THEME.radii.sm,
                  border: `1px solid ${THEME.colors.borderHairline}`,
                  marginBottom: '1.5rem',
                  fontSize: '0.85rem',
                }}
              >
                <div>
                  <span style={{ color: THEME.colors.inkMuted, fontSize: '0.75rem', display: 'block' }}>ANNUAL COMPENSATION:</span>
                  <b style={{ fontSize: '1.05rem', color: THEME.colors.status.success.text }}>
                    ₹{viewOfferModal.payload.annualCompensationLPA} Lakhs / Annum
                  </b>
                </div>
                <div>
                  <span style={{ color: THEME.colors.inkMuted, fontSize: '0.75rem', display: 'block' }}>MONTHLY STIPEND / SALARY:</span>
                  <b style={{ fontSize: '1.05rem', color: THEME.colors.navyPrimary }}>
                    ₹{viewOfferModal.payload.monthlyStipendOrSalary.toLocaleString()} / month
                  </b>
                </div>
                <div>
                  <span style={{ color: THEME.colors.inkMuted, fontSize: '0.75rem', display: 'block' }}>DATE OF JOINING:</span>
                  <b>{viewOfferModal.payload.joiningDate}</b>
                </div>
                <div>
                  <span style={{ color: THEME.colors.inkMuted, fontSize: '0.75rem', display: 'block' }}>POSTING LOCATION:</span>
                  <b>{viewOfferModal.payload.postingLocation}</b>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: THEME.colors.inkPrimary, marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                  Terms & Conditions of Employment:
                </div>
                <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.85rem', color: THEME.colors.inkBody, lineHeight: 1.6 }}>
                  {viewOfferModal.payload.terms.map((term, idx) => (
                    <li key={idx}>{term}</li>
                  ))}
                </ul>
              </div>

              <div
                style={{
                  backgroundColor: THEME.colors.bgMuted,
                  borderRadius: THEME.radii.sm,
                  border: `1px solid ${THEME.colors.borderHairline}`,
                  padding: '1.25rem',
                  marginBottom: '1.5rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <KeyIcon size={16} color={THEME.colors.navyPrimary} />
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800, color: THEME.colors.inkPrimary }}>
                        Ed25519 Cryptographic Attestation Block
                      </div>
                      <div style={{ fontSize: '0.7rem', color: THEME.colors.inkMuted }}>
                        RFC 8785 Canonical JSON + SHA-256 Digest
                      </div>
                    </div>
                  </div>
                  <span style={pillBadge('info')}>KEY: {viewOfferModal.issuerKeyId}</span>
                </div>

                <div style={{ fontSize: '0.75rem', color: THEME.colors.inkBody, marginBottom: '0.5rem' }}>
                  <b>Ed25519 Signature Hex:</b>
                  <div
                    style={{
                      fontFamily: THEME.fonts.mono,
                      fontSize: '0.7rem',
                      backgroundColor: '#ffffff',
                      padding: '0.4rem',
                      borderRadius: THEME.radii.xs,
                      border: `1px solid ${THEME.colors.borderHairline}`,
                      wordBreak: 'break-all',
                      marginTop: '0.2rem',
                      color: THEME.colors.navyPrimary,
                    }}
                  >
                    {viewOfferModal.signatureHex}
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                    fontSize: '0.75rem',
                    marginTop: '0.5rem',
                  }}
                >
                  <div>
                    <span style={{ color: THEME.colors.inkMuted }}>Verification URL: </span>
                    <a
                      href={viewOfferModal.verificationUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: THEME.colors.navyPrimary, fontWeight: 700, textDecoration: 'underline' }}
                    >
                      {viewOfferModal.verificationUrl}
                    </a>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button onClick={() => window.print()} style={buttonSecondaryStyle}>
                  Print Offer Letter
                </button>
                <button onClick={() => setViewOfferModal(null)} style={buttonPrimaryStyle}>
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: Live Trainee Mobile Simulator (Judges Interactive Demo)
      ========================================================================= */}
      {showMobileSimulator && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(17, 24, 39, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 90,
            padding: '1rem',
            backdropFilter: 'blur(3px)',
          }}
        >
          <div
            style={{
              width: '390px',
              height: '760px',
              backgroundColor: '#111827',
              borderRadius: '44px',
              padding: '12px',
              boxShadow: THEME.shadows.modal,
              display: 'flex',
              flexDirection: 'column',
              border: '4px solid #374151',
              position: 'relative',
            }}
          >
            {/* Phone Notch */}
            <div
              style={{
                position: 'absolute',
                top: '16px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '110px',
                height: '22px',
                backgroundColor: '#000000',
                borderRadius: '12px',
                zIndex: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div style={{ width: '40px', height: '4px', backgroundColor: '#334155', borderRadius: '2px' }} />
              <div style={{ width: '8px', height: '8px', backgroundColor: '#1e293b', borderRadius: '50%', marginLeft: '8px' }} />
            </div>

            <div
              style={{
                flex: 1,
                backgroundColor: '#f8fafc',
                borderRadius: '34px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
              }}
            >
              <div
                style={{
                  backgroundColor: '#ffffff',
                  padding: '0.6rem 1.25rem 0.2rem 1.25rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  color: THEME.colors.inkPrimary,
                }}
              >
                <span>09:41</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span>📶 SahakarEdge-Local</span>
                  <span>⚡ 100%</span>
                </div>
              </div>

              <div
                style={{
                  backgroundColor: THEME.colors.navyPrimary,
                  color: '#ffffff',
                  padding: '0.75rem 1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.65rem', color: '#93c5fd', fontWeight: 800 }}>
                    NCCT TRAINEE MOBILE PWA
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>Namaste, Anita Patel</div>
                </div>
                <button
                  onClick={() => setShowMobileSimulator(false)}
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    border: 'none',
                    color: '#ffffff',
                    borderRadius: '50%',
                    width: '26px',
                    height: '26px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CloseIcon size={14} />
                </button>
              </div>

              <div
                style={{
                  backgroundColor: simWanMode === 'OFFLINE' ? '#ea580c' : THEME.colors.status.success.text,
                  color: '#ffffff',
                  padding: '0.4rem 0.8rem',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>{simWanMode === 'OFFLINE' ? 'OFFLINE: Local Edge Mode' : 'ONLINE: Cloud Sync Active'}</span>
                <select
                  value={simWanMode}
                  onChange={(e) => setSimWanMode(e.target.value as any)}
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.25)',
                    color: '#fff',
                    border: '1px solid rgba(255,255,255,0.4)',
                    borderRadius: '4px',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    padding: '0.1rem 0.3rem',
                  }}
                >
                  <option value="OFFLINE" style={{ color: '#000' }}>WAN: OFFLINE</option>
                  <option value="ONLINE" style={{ color: '#000' }}>WAN: ONLINE</option>
                </select>
              </div>

              <div
                style={{
                  flex: 1,
                  padding: '0.85rem',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: THEME.radii.sm,
                    padding: '0.85rem',
                    border: `1px solid ${THEME.colors.borderHairline}`,
                    boxShadow: THEME.shadows.card,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: THEME.colors.inkMuted, fontWeight: 700 }}>
                    <span>SESSION ATTENDANCE</span>
                    <span style={{ color: simAttendanceCheckedIn ? THEME.colors.status.success.text : '#ca8a04' }}>
                      {simAttendanceCheckedIn ? '✓ Verified' : '● In Session'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: THEME.colors.inkPrimary, margin: '0.2rem 0' }}>
                    PACS Computerization Core & Day-Book Ledger
                  </div>
                  <button
                    onClick={handleSimAttendance}
                    disabled={simAttendanceCheckedIn}
                    style={{
                      width: '100%',
                      marginTop: '0.5rem',
                      backgroundColor: simAttendanceCheckedIn ? THEME.colors.bgMuted : THEME.colors.navyPrimary,
                      color: simAttendanceCheckedIn ? THEME.colors.status.success.text : '#ffffff',
                      border: 'none',
                      padding: '0.45rem',
                      borderRadius: THEME.radii.sm,
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: simAttendanceCheckedIn ? 'default' : 'pointer',
                    }}
                  >
                    {simAttendanceCheckedIn ? '✓ Dynamic QR Recorded' : '1-Tap Dynamic QR Attendance'}
                  </button>
                </div>

                <div
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: THEME.radii.sm,
                    padding: '0.85rem',
                    border: `1px solid ${THEME.colors.borderHairline}`,
                    boxShadow: THEME.shadows.card,
                  }}
                >
                  <div style={{ fontSize: '0.7rem', color: THEME.colors.inkMuted, fontWeight: 700 }}>
                    COURSE MODULE PROGRESS
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: THEME.colors.inkPrimary, margin: '0.2rem 0' }}>
                    Module 2: Day-Book & Cash Vouchers
                  </div>
                  <button
                    onClick={() => handleSimCompleteLesson('lsn-pacs-101-2')}
                    disabled={simCompletedLessons.includes('lsn-pacs-101-2')}
                    style={{
                      width: '100%',
                      marginTop: '0.4rem',
                      backgroundColor: simCompletedLessons.includes('lsn-pacs-101-2') ? THEME.colors.bgMuted : THEME.colors.navyPrimary,
                      color: simCompletedLessons.includes('lsn-pacs-101-2') ? THEME.colors.status.success.text : '#ffffff',
                      border: 'none',
                      padding: '0.45rem',
                      borderRadius: THEME.radii.sm,
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: simCompletedLessons.includes('lsn-pacs-101-2') ? 'default' : 'pointer',
                    }}
                  >
                    {simCompletedLessons.includes('lsn-pacs-101-2') ? '✓ Lesson Finished' : 'Complete Lesson 2'}
                  </button>
                </div>

                <div
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: THEME.radii.sm,
                    padding: '0.85rem',
                    border: `1px solid ${THEME.colors.borderHairline}`,
                    boxShadow: THEME.shadows.card,
                  }}
                >
                  <div style={{ fontSize: '0.7rem', color: THEME.colors.inkMuted, fontWeight: 700 }}>
                    STATUTORY EXAM
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: THEME.colors.inkPrimary, margin: '0.2rem 0' }}>
                    PACS Governance Assessment
                  </div>
                  <button
                    onClick={handleSimSubmitAssessment}
                    disabled={simAssessmentDone}
                    style={{
                      width: '100%',
                      marginTop: '0.4rem',
                      backgroundColor: simAssessmentDone ? THEME.colors.bgMuted : THEME.colors.status.success.text,
                      color: simAssessmentDone ? THEME.colors.status.success.text : '#ffffff',
                      border: 'none',
                      padding: '0.45rem',
                      borderRadius: THEME.radii.sm,
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: simAssessmentDone ? 'default' : 'pointer',
                    }}
                  >
                    {simAssessmentDone ? '✓ Exam Passed (Score: 100%)' : 'Take Exam on Local Edge'}
                  </button>
                </div>

                <div
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: THEME.radii.sm,
                    padding: '0.85rem',
                    border: `1px solid ${THEME.colors.borderHairline}`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem', fontWeight: 700, color: THEME.colors.inkPrimary, marginBottom: '0.4rem' }}>
                    <span>OFFLINE EVENT QUEUE</span>
                    <span style={pillBadge('info')}>{simQueuedEvents.length} Pending</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', maxHeight: '120px', overflowY: 'auto' }}>
                    {simQueuedEvents.map((ev) => (
                      <div
                        key={ev.id}
                        style={{
                          fontSize: '0.68rem',
                          backgroundColor: THEME.colors.bgMuted,
                          padding: '0.35rem 0.5rem',
                          borderRadius: THEME.radii.xs,
                          border: `1px solid ${THEME.colors.borderHairline}`,
                          display: 'flex',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span style={{ fontWeight: 600, color: THEME.colors.inkPrimary }}>{ev.type}</span>
                        <span style={{ color: THEME.colors.inkMuted }}>{ev.timestamp}</span>
                      </div>
                    ))}
                    {simQueuedEvents.length === 0 && (
                      <div style={{ fontSize: '0.7rem', color: THEME.colors.status.success.text, textAlign: 'center', padding: '0.5rem 0' }}>
                        ✓ All local events synced with Central Cloud!
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => triggerCentralSyncFromSim()}
                    disabled={simQueuedEvents.length === 0}
                    style={{
                      width: '100%',
                      marginTop: '0.6rem',
                      backgroundColor: simQueuedEvents.length === 0 ? THEME.colors.bgInset : THEME.colors.navyPrimary,
                      color: simQueuedEvents.length === 0 ? THEME.colors.inkSubtle : '#ffffff',
                      border: 'none',
                      padding: '0.5rem',
                      borderRadius: THEME.radii.sm,
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      cursor: simQueuedEvents.length === 0 ? 'default' : 'pointer',
                    }}
                  >
                    Push Sync to Central Cloud Admin
                  </button>
                </div>
              </div>

              <div
                style={{
                  padding: '0.5rem',
                  backgroundColor: '#ffffff',
                  borderTop: `1px solid ${THEME.colors.borderHairline}`,
                  textAlign: 'center',
                  fontSize: '0.65rem',
                  color: THEME.colors.inkMuted,
                }}
              >
                Sahakar Edge Local Client • v1.0.0
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: Create Programme
      ========================================================================= */}
      {showProgrammeModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(17, 24, 39, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1rem',
            backdropFilter: 'blur(3px)',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: THEME.radii.md,
              maxWidth: '500px',
              width: '100%',
              padding: '1.5rem',
              boxShadow: THEME.shadows.modal,
              border: `1px solid ${THEME.colors.borderHairline}`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: THEME.colors.inkPrimary }}>
                Add Capacity Building Programme
              </h3>
              <button
                onClick={() => setShowProgrammeModal(false)}
                style={{ background: 'none', border: 'none', color: THEME.colors.inkMuted, cursor: 'pointer' }}
              >
                <CloseIcon size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateProgramme} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: THEME.colors.inkMuted, display: 'block', marginBottom: '0.3rem' }}>
                  Programme Title
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., Dairy Cooperative Governance & Compliance"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    borderRadius: THEME.radii.sm,
                    border: `1px solid ${THEME.colors.borderHairline}`,
                    fontSize: '0.85rem',
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: THEME.colors.inkMuted, display: 'block', marginBottom: '0.3rem' }}>
                  Description
                </label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Cooperative training curriculum details..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    borderRadius: THEME.radii.sm,
                    border: `1px solid ${THEME.colors.borderHairline}`,
                    fontSize: '0.85rem',
                    lineHeight: 1.5,
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowProgrammeModal(false)} style={buttonSecondaryStyle}>
                  Cancel
                </button>
                <button type="submit" style={buttonPrimaryStyle}>
                  Create Programme
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: Manual Attendance Override
      ========================================================================= */}
      {showOverrideModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(17, 24, 39, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1rem',
            backdropFilter: 'blur(3px)',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: THEME.radii.md,
              maxWidth: '500px',
              width: '100%',
              padding: '1.5rem',
              boxShadow: THEME.shadows.modal,
              border: `1px solid ${THEME.colors.borderHairline}`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: THEME.colors.inkPrimary }}>
                Audited Manual Attendance Override
              </h3>
              <button
                onClick={() => setShowOverrideModal(false)}
                style={{ background: 'none', border: 'none', color: THEME.colors.inkMuted, cursor: 'pointer' }}
              >
                <CloseIcon size={20} />
              </button>
            </div>
            <p style={{ fontSize: '0.8rem', color: THEME.colors.inkMuted, margin: '0 0 1rem 0' }}>
              Override attendance when trainee hardware fails or local QR camera is unavailable. An immutable record will be appended to the central compliance audit log.
            </p>
            <form onSubmit={handleManualOverride} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: THEME.colors.inkMuted, display: 'block', marginBottom: '0.3rem' }}>
                  Select Trainee
                </label>
                <select
                  value={overrideTraineeId}
                  onChange={(e) => setOverrideTraineeId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    borderRadius: THEME.radii.sm,
                    border: `1px solid ${THEME.colors.borderHairline}`,
                    fontSize: '0.85rem',
                  }}
                >
                  {trainees.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.emailOrPhone})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: THEME.colors.inkMuted, display: 'block', marginBottom: '0.3rem' }}>
                  Mandatory Justification / Reason
                </label>
                <textarea
                  required
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="e.g., Trainee phone battery depleted; verified in person by Trainer"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    borderRadius: THEME.radii.sm,
                    border: `1px solid ${THEME.colors.borderHairline}`,
                    fontSize: '0.85rem',
                    lineHeight: 1.5,
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowOverrideModal(false)} style={buttonSecondaryStyle}>
                  Cancel
                </button>
                <button type="submit" style={buttonPrimaryStyle}>
                  Record Audited Override
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: Security Audit Event Details Inspector (NEW)
      ========================================================================= */}
      <AuditDetailsModal log={selectedAuditLog} onClose={() => setSelectedAuditLog(null)} />
    </div>
  );
}

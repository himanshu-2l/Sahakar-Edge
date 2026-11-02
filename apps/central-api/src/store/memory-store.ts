import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import {
  Institute,
  User,
  Programme,
  ProgrammeStatus,
  Batch,
  TrainingSession,
  Course,
  Module,
  Lesson,
  Enrollment,
  EnrollmentStatus,
  Assessment,
  Question,
  UserRole,
  type Skill,
  type JobOpportunity,
  type JobRequiredSkill,
  type SkillEvidence,
  type FederationTierRollup,
  type FederationAnalyticsResponse,
  type GeoNode,
  type FederationInstituteSummary,
  type JobApplication,
  type JobApplicationStatus,
  type DigitalOfferLetter,
  type CanonicalOfferPayload,
  type SchemeDefinition,
  type SchemeEvaluationInput,
  type SchemeEvaluationResult,
  type PacsFinancialMetrics,
  type PacsHealthScorecard,
  type CamelDimensionScores,
  type DiagnosticAlert,
  type GrievanceTicket,
  type GrievanceActionLog,
  type GrievancePriority,
  type GrievanceStatus,
  type GrievanceComplainantRole,
  type CandidateMatch100Pt,
  type CandidateMatchBreakdown100Pt,
  type CareerPathwayStep,
  type TraineeCareerPathway,
  type AuditGrade,
  type InstituteTier,
  type ProgrammeDeliveryMode,
  type NominationStatus,
  type AssessmentType,
  type DropoutRiskTier,
  type TrainingInstitute,
  type TrainingProgramme,
  type TraineeNomination,
  type TimetableSession,
  type SessionAttendanceRecord,
  type CourseModuleTest,
  type AssessmentAttempt,
  type CampusHostelRoom,
  type HostelAllocationRecord,
  type TraineePublicNfcProfile,
  type CourseMarksTally,
  type CourseGradebookMatrix,
  type DropoutRiskAssessment,
  type SectorSkillShortageRow,
  type CooperativeSkillItem,
} from '@sahakar/types';
import { schemeAdvisoryEngine } from '../services/scheme-engine.js';
import { camelScorecardEngine } from '../services/camel-scorecard-engine.js';
import { CandidateMatcherEngine } from '../services/candidate-matcher-engine.js';
import { atpLifecycleEngine } from '../services/atp-lifecycle-engine.js';
import { dynamicAttendanceEngine } from '../services/dynamic-attendance-engine.js';
import { gradebookEngine, type TraineeAssessmentSubmission } from '../services/gradebook-engine.js';
import { dropoutRiskEngine } from '../services/dropout-risk-engine.js';
import { skillGapEngine } from '../services/skill-gap-engine.js';
import { hostelLogisticsEngine } from '../services/hostel-logistics-engine.js';
import {
  SEED_INSTITUTES,
  SEED_USERS,
  SEED_PROGRAMME,
  SEED_BATCH,
  SEED_SESSION,
  SEED_ENROLLMENTS,
  SEED_COURSE,
  SEED_MODULE,
  SEED_LESSONS,
  SEED_ASSESSMENT,
  SEED_QUESTIONS,
  SEED_SKILLS,
  SEED_JOB_OPPORTUNITY,
  SEED_JOB_DAIRY_COORDINATOR,
  SEED_JOB_DCCB_SECRETARY,
  SEED_JOB_OPPORTUNITIES,
  SEED_JOB_REQUIRED_SKILLS,
  SEED_TRAINEE_SKILL_EVIDENCES,
} from '@sahakar/test-fixtures';

export interface HostelAllotment {
  id: string;
  traineeName: string;
  institute: string;
  hostelBlock: string;
  roomNo: string;
  bedType: string;
  checkIn: string;
  checkOut: string;
  status: 'CHECKED_IN' | 'RESERVED' | 'CHECKED_OUT';
  messOptIn: boolean;
}

export interface TimetableSlot {
  id: string;
  timeSlot: string;
  subject: string;
  venue: string;
  trainer: string;
  status: 'COMPLETED_TODAY' | 'ACTIVE_NOW' | 'SCHEDULED';
}

export interface MessMeal {
  meal: string;
  menu: string;
  adherence: string;
}

export interface HardwareDeploymentKit {
  kitId: string;
  nodeSerial: string;
  components: string;
  venue: string;
  status: 'DEPLOYED_OPERATIONAL' | 'IN_TRANSIT' | 'MAINTENANCE';
  dispatchedAt: string;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  actor: string;
  details: string;
  timestamp: string;
}

export class CentralMemoryStore {
  private institutes: Map<string, Institute> = new Map();
  private users: Map<string, User> = new Map();
  private programmes: Map<string, Programme> = new Map();
  private batches: Map<string, Batch> = new Map();
  private sessions: Map<string, TrainingSession> = new Map();
  private enrollments: Map<string, Enrollment> = new Map();
  private courses: Map<string, Course> = new Map();
  private modules: Map<string, Module> = new Map();
  private lessons: Map<string, Lesson> = new Map();
  private assessments: Map<string, Assessment> = new Map();
  private questions: Map<string, Question> = new Map();

  // Ingested sync events & deduplication
  private ingestedEvents: Map<string, any> = new Map();
  private centralLogicalSequence = 0;

  // Operational business records
  private attendanceRecords: Map<string, any> = new Map();
  private progressRecords: Map<string, any> = new Map();
  private assessmentSubmissions: Map<string, any> = new Map();
  private edgeNodes: Map<string, any> = new Map();
  private credentials: Map<string, any> = new Map();

  // Skills, Job Opportunities & Employment Evidence
  private skills: Map<string, Skill> = new Map();
  private jobOpportunities: Map<string, JobOpportunity> = new Map();
  private jobRequiredSkills: Map<string, JobRequiredSkill[]> = new Map();
  private skillEvidences: Map<string, SkillEvidence> = new Map();

  // Recruiter Pipeline & Digital Offer Letters (Phase 9 Milestone 4)
  private jobApplications: Map<string, JobApplication> = new Map();
  private offerLetters: Map<string, DigitalOfferLetter> = new Map();

  // NCCT ERP Training Logistics
  private hostelAllotments: Map<string, HostelAllotment> = new Map();
  private timetableSchedule: Map<string, TimetableSlot> = new Map();
  private messMenu: MessMeal[] = [];
  private hardwareKits: Map<string, HardwareDeploymentKit> = new Map();
  private auditLogs: AuditLogEntry[] = [];

  // Milestone 1 Domain State
  private schemes: Map<string, SchemeDefinition> = new Map();
  private pacsFinancials: Map<string, PacsFinancialMetrics> = new Map();
  private grievances: Map<string, GrievanceTicket> = new Map();
  private grievanceLogs: Map<string, GrievanceActionLog[]> = new Map();

  // NCCT Training Management System State (M1)
  private trainingInstitutes: Map<string, TrainingInstitute> = new Map();
  private trainingProgrammes: Map<string, TrainingProgramme> = new Map();
  private traineeNominations: Map<string, TraineeNomination> = new Map();
  private timetableSessions: Map<string, TimetableSession> = new Map();
  private sessionAttendanceRecords: Map<string, SessionAttendanceRecord> = new Map();
  private courseModuleTests: Map<string, CourseModuleTest> = new Map();
  private assessmentAttempts: Map<string, AssessmentAttempt> = new Map();
  private campusHostelRooms: Map<string, CampusHostelRoom> = new Map();
  private hostelAllocations: Map<string, HostelAllocationRecord> = new Map();
  private traineeNfcProfiles: Map<string, TraineePublicNfcProfile> = new Map();

  constructor() {
    this.init();
  }

  private getStorageFilePath(): string {
    if (process.env.CENTRAL_DATA_FILE) {
      return path.resolve(process.env.CENTRAL_DATA_FILE);
    }
    const cwd = process.cwd();
    if (fs.existsSync(path.resolve(cwd, 'data'))) {
      return path.resolve(cwd, 'data', 'central-store.json');
    }
    if (fs.existsSync(path.resolve(cwd, '..', '..', 'data'))) {
      return path.resolve(cwd, '..', '..', 'data', 'central-store.json');
    }
    return path.resolve(cwd, 'data', 'central-store.json');
  }

  private shouldPersist(): boolean {
    if (process.env.ENABLE_PERSISTENCE === 'true') return true;
    if (process.env.DISABLE_PERSISTENCE === 'true') return false;
    return process.env.NODE_ENV !== 'test';
  }

  public init(): void {
    if (!this.shouldPersist()) {
      this.seedBaseline();
      return;
    }

    const filePath = this.getStorageFilePath();
    if (fs.existsSync(filePath)) {
      try {
        const raw = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(raw);
        this.deserialize(data);
        return;
      } catch {
        // Fallback to baseline on corrupted json
      }
    }

    this.seedBaseline();
    this.saveToDisk();
  }

  public saveToDisk(): void {
    if (!this.shouldPersist()) return;
    try {
      const filePath = this.getStorageFilePath();
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const serialized = this.serialize();
      fs.writeFileSync(filePath, JSON.stringify(serialized, null, 2), 'utf8');
    } catch {
      // Safe non-blocking write
    }
  }

  private serialize() {
    return {
      institutes: Array.from(this.institutes.entries()),
      users: Array.from(this.users.entries()),
      programmes: Array.from(this.programmes.entries()),
      batches: Array.from(this.batches.entries()),
      sessions: Array.from(this.sessions.entries()),
      enrollments: Array.from(this.enrollments.entries()),
      courses: Array.from(this.courses.entries()),
      modules: Array.from(this.modules.entries()),
      lessons: Array.from(this.lessons.entries()),
      assessments: Array.from(this.assessments.entries()),
      questions: Array.from(this.questions.entries()),
      attendanceRecords: Array.from(this.attendanceRecords.entries()),
      progressRecords: Array.from(this.progressRecords.entries()),
      assessmentSubmissions: Array.from(this.assessmentSubmissions.entries()),
      edgeNodes: Array.from(this.edgeNodes.entries()),
      credentials: Array.from(this.credentials.entries()),
      skills: Array.from(this.skills.entries()),
      jobOpportunities: Array.from(this.jobOpportunities.entries()),
      jobRequiredSkills: Array.from(this.jobRequiredSkills.entries()),
      skillEvidences: Array.from(this.skillEvidences.entries()),
      jobApplications: Array.from(this.jobApplications.entries()),
      offerLetters: Array.from(this.offerLetters.entries()),
      schemes: Array.from(this.schemes.entries()),
      pacsFinancials: Array.from(this.pacsFinancials.entries()),
      grievances: Array.from(this.grievances.entries()),
      grievanceLogs: Array.from(this.grievanceLogs.entries()),
      hostelAllotments: Array.from(this.hostelAllotments.entries()),
      timetableSchedule: Array.from(this.timetableSchedule.entries()),
      messMenu: this.messMenu,
      hardwareKits: Array.from(this.hardwareKits.entries()),
      auditLogs: this.auditLogs,
      ingestedEvents: Array.from(this.ingestedEvents.entries()),
      centralLogicalSequence: this.centralLogicalSequence,
      trainingInstitutes: Array.from(this.trainingInstitutes.entries()),
      trainingProgrammes: Array.from(this.trainingProgrammes.entries()),
      traineeNominations: Array.from(this.traineeNominations.entries()),
      timetableSessions: Array.from(this.timetableSessions.entries()),
      sessionAttendanceRecords: Array.from(this.sessionAttendanceRecords.entries()),
      courseModuleTests: Array.from(this.courseModuleTests.entries()),
      assessmentAttempts: Array.from(this.assessmentAttempts.entries()),
      campusHostelRooms: Array.from(this.campusHostelRooms.entries()),
      hostelAllocations: Array.from(this.hostelAllocations.entries()),
      traineeNfcProfiles: Array.from(this.traineeNfcProfiles.entries()),
    };
  }

  private deserialize(data: any) {
    if (data.institutes) {
      this.institutes = new Map(data.institutes);
      for (const inst of SEED_INSTITUTES) {
        const existing = this.institutes.get(inst.id);
        if (!existing) {
          this.institutes.set(inst.id, { ...inst });
        } else {
          if (existing.tier === undefined) existing.tier = inst.tier;
          if (existing.state === undefined) existing.state = inst.state;
          if (existing.zone === undefined) existing.zone = inst.zone;
          if (existing.latitude === undefined) existing.latitude = inst.latitude;
          if (existing.longitude === undefined) existing.longitude = inst.longitude;
          if (existing.pacsCount === undefined) existing.pacsCount = inst.pacsCount;
          if (existing.parentInstituteId === undefined) existing.parentInstituteId = inst.parentInstituteId;
        }
      }
    }
    if (data.users) this.users = new Map(data.users);
    if (data.programmes) this.programmes = new Map(data.programmes);
    if (data.batches) this.batches = new Map(data.batches);
    if (data.sessions) this.sessions = new Map(data.sessions);
    if (data.enrollments) this.enrollments = new Map(data.enrollments);
    if (data.courses) this.courses = new Map(data.courses);
    if (data.modules) this.modules = new Map(data.modules);
    if (data.lessons) this.lessons = new Map(data.lessons);
    if (data.assessments) this.assessments = new Map(data.assessments);
    if (data.questions) this.questions = new Map(data.questions);
    if (data.attendanceRecords) this.attendanceRecords = new Map(data.attendanceRecords);
    if (data.progressRecords) this.progressRecords = new Map(data.progressRecords);
    if (data.assessmentSubmissions) this.assessmentSubmissions = new Map(data.assessmentSubmissions);
    if (data.edgeNodes) this.edgeNodes = new Map(data.edgeNodes);
    if (data.credentials) this.credentials = new Map(data.credentials);
    if (data.skills) this.skills = new Map(data.skills);
    if (data.jobOpportunities) this.jobOpportunities = new Map(data.jobOpportunities);
    if (data.jobRequiredSkills) this.jobRequiredSkills = new Map(data.jobRequiredSkills);
    if (data.skillEvidences) this.skillEvidences = new Map(data.skillEvidences);
    if (data.jobApplications) this.jobApplications = new Map(data.jobApplications);
    if (data.offerLetters) this.offerLetters = new Map(data.offerLetters);
    if (this.jobApplications.size === 0) {
      for (const a of this.getDefaultJobApplications()) {
        this.jobApplications.set(a.id, a);
      }
    }
    if (data.schemes) this.schemes = new Map(data.schemes);
    if (data.pacsFinancials) this.pacsFinancials = new Map(data.pacsFinancials);
    if (data.grievances) this.grievances = new Map(data.grievances);
    if (data.grievanceLogs) this.grievanceLogs = new Map(data.grievanceLogs);

    if (this.schemes.size === 0) {
      for (const s of this.getDefaultSchemes()) this.schemes.set(s.id, s);
    }
    if (this.pacsFinancials.size === 0) {
      for (const p of this.getDefaultPacsFinancials()) this.pacsFinancials.set(p.societyId, p);
    }
    if (this.grievances.size === 0) {
      for (const g of this.getDefaultGrievances()) this.grievances.set(g.id, g);
    }
    if (data.hostelAllotments) this.hostelAllotments = new Map(data.hostelAllotments);
    if (data.timetableSchedule) this.timetableSchedule = new Map(data.timetableSchedule);
    if (data.messMenu) this.messMenu = data.messMenu;
    if (data.hardwareKits) this.hardwareKits = new Map(data.hardwareKits);
    if (data.auditLogs) this.auditLogs = data.auditLogs;
    if (data.ingestedEvents) this.ingestedEvents = new Map(data.ingestedEvents);
    if (typeof data.centralLogicalSequence === 'number') this.centralLogicalSequence = data.centralLogicalSequence;

    if (data.trainingInstitutes) this.trainingInstitutes = new Map(data.trainingInstitutes);
    if (data.trainingProgrammes) this.trainingProgrammes = new Map(data.trainingProgrammes);
    if (data.traineeNominations) this.traineeNominations = new Map(data.traineeNominations);
    if (data.timetableSessions) this.timetableSessions = new Map(data.timetableSessions);
    if (data.sessionAttendanceRecords) this.sessionAttendanceRecords = new Map(data.sessionAttendanceRecords);
    if (data.courseModuleTests) this.courseModuleTests = new Map(data.courseModuleTests);
    if (data.assessmentAttempts) this.assessmentAttempts = new Map(data.assessmentAttempts);
    if (data.campusHostelRooms) this.campusHostelRooms = new Map(data.campusHostelRooms);
    if (data.hostelAllocations) this.hostelAllocations = new Map(data.hostelAllocations);
    if (data.traineeNfcProfiles) this.traineeNfcProfiles = new Map(data.traineeNfcProfiles);

    if (this.trainingInstitutes.size === 0) {
      for (const inst of this.getDefaultTrainingInstitutes()) this.trainingInstitutes.set(inst.id, inst);
    }
    if (this.trainingProgrammes.size === 0) {
      for (const prog of this.getDefaultTrainingProgrammes()) this.trainingProgrammes.set(prog.id, prog);
    }
    if (this.campusHostelRooms.size === 0) {
      for (const r of this.getDefaultCampusHostelRooms()) this.campusHostelRooms.set(r.id, r);
    }
    if (this.traineeNominations.size === 0) {
      for (const nom of this.getDefaultTraineeNominations()) this.traineeNominations.set(nom.id, nom);
    }
    if (this.timetableSessions.size === 0) {
      for (const sess of this.getDefaultTimetableSessions()) this.timetableSessions.set(sess.id, sess);
    }
    if (this.courseModuleTests.size === 0) {
      for (const t of this.getDefaultCourseModuleTests()) this.courseModuleTests.set(t.id, t);
    }
    if (this.traineeNfcProfiles.size === 0) {
      for (const p of this.getDefaultTraineeNfcProfiles()) this.traineeNfcProfiles.set(p.publicProfileCode, p);
    }
  }

  public seedBaseline(): void {
    this.institutes.clear();
    this.users.clear();
    this.programmes.clear();
    this.batches.clear();
    this.sessions.clear();
    this.enrollments.clear();
    this.trainingInstitutes.clear();
    this.trainingProgrammes.clear();
    this.traineeNominations.clear();
    this.timetableSessions.clear();
    this.sessionAttendanceRecords.clear();
    this.courseModuleTests.clear();
    this.assessmentAttempts.clear();
    this.campusHostelRooms.clear();
    this.hostelAllocations.clear();
    this.traineeNfcProfiles.clear();
    this.courses.clear();
    this.modules.clear();
    this.lessons.clear();
    this.assessments.clear();
    this.questions.clear();
    this.skills.clear();
    this.jobOpportunities.clear();
    this.jobRequiredSkills.clear();
    this.skillEvidences.clear();
    this.jobApplications.clear();
    this.offerLetters.clear();
    this.schemes.clear();
    this.pacsFinancials.clear();
    this.grievances.clear();
    this.grievanceLogs.clear();
    this.hostelAllotments.clear();
    this.timetableSchedule.clear();
    this.hardwareKits.clear();
    this.auditLogs = [];

    for (const inst of SEED_INSTITUTES) this.institutes.set(inst.id, { ...inst });
    for (const user of SEED_USERS) this.users.set(user.id, { ...user });
    this.programmes.set(SEED_PROGRAMME.id, { ...SEED_PROGRAMME });
    this.batches.set(SEED_BATCH.id, { ...SEED_BATCH });
    this.sessions.set(SEED_SESSION.id, { ...SEED_SESSION });
    for (const enr of SEED_ENROLLMENTS) this.enrollments.set(enr.id, { ...enr });
    this.courses.set(SEED_COURSE.id, { ...SEED_COURSE });
    this.modules.set(SEED_MODULE.id, { ...SEED_MODULE });
    for (const les of SEED_LESSONS) this.lessons.set(les.id, { ...les });
    this.assessments.set(SEED_ASSESSMENT.id, { ...SEED_ASSESSMENT });
    for (const q of SEED_QUESTIONS) this.questions.set(q.id, { ...q });

    for (const skill of SEED_SKILLS) this.skills.set(skill.id, { ...skill });
    for (const job of SEED_JOB_OPPORTUNITIES) this.jobOpportunities.set(job.id, { ...job });
    for (const req of SEED_JOB_REQUIRED_SKILLS) {
      const existing = this.jobRequiredSkills.get(req.jobId) || [];
      existing.push({ ...req });
      this.jobRequiredSkills.set(req.jobId, existing);
    }
    for (const ev of SEED_TRAINEE_SKILL_EVIDENCES) this.skillEvidences.set(ev.id, { ...ev });

    for (const s of this.getDefaultSchemes()) this.schemes.set(s.id, { ...s });
    for (const p of this.getDefaultPacsFinancials()) this.pacsFinancials.set(p.societyId, { ...p });
    for (const g of this.getDefaultGrievances()) this.grievances.set(g.id, { ...g });

    // Seed default edge node per 05_HARDWARE_EDGE.md
    this.edgeNodes.set('edge-node-ricm-bhopal-01', {
      id: 'edge-node-ricm-bhopal-01',
      nodeId: 'edge-node-ricm-bhopal-01',
      instituteId: '11111111-1111-1111-1111-111111111111',
      name: 'RICM Bhopal - Main Training Hall Gateway',
      publicKey: 'simulated-ed25519-public-key-ricm-01',
      softwareVersion: '1.0.0',
      lastSeenAt: new Date().toISOString(),
      healthStatus: 'ONLINE_SYNCED',
      telemetry: {
        cpuTemperatureC: 44.2,
        cpuLoadPercent: 12.5,
        memoryUsagePercent: 32.0,
        diskUsagePercent: 24.0,
        uptimeSeconds: 7200,
        networkState: 'ONLINE',
        wanSimulationMode: 'online',
        appVersion: '1.0.0',
        lastSyncAt: new Date().toISOString(),
        queuedEventCount: 0,
      },
    });

    // Seed NCCT ERP Hostel Allotments
    const defaultHostel: HostelAllotment[] = [
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
    ];
    for (const h of defaultHostel) this.hostelAllotments.set(h.id, h);

    // Seed NCCT ERP Timetable
    const defaultTimetable: TimetableSlot[] = [
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
    ];
    for (const t of defaultTimetable) this.timetableSchedule.set(t.id, t);

    // Seed NCCT Mess Menu
    this.messMenu = [
      { meal: 'Breakfast (07:30 - 09:00 AM)', menu: 'Poha, Sprouts, Boiled Eggs / Banana, Tea / Milk', adherence: '100% NCCT Dietary Norms' },
      { meal: 'Lunch (12:30 - 02:00 PM)', menu: 'Roti, Dal Tadka, Seasonal Sabzi, Rice, Curd, Salad', adherence: 'Wholesome Vegetarian' },
      { meal: 'High Tea (05:00 - 05:30 PM)', menu: 'Tea, Roasted Makhana / Biscuits', adherence: 'Evening Refreshment' },
      { meal: 'Dinner (07:30 - 09:30 PM)', menu: 'Chapati, Paneer Gravy, Yellow Dal, Jeera Rice, Gulab Jamun', adherence: 'Residential Trainee Mess' },
    ];

    // Seed Hardware Kits
    const defaultKits: HardwareDeploymentKit[] = [
      {
        kitId: 'KIT-RICM-BHO-01',
        nodeSerial: 'EDGE-ARM64-BHO-9011',
        components: 'Raspberry Pi 4 (4GB RAM) + 64GB NVMe + High-Gain Wi-Fi AP + 4hr UPS Battery + Heavy-Duty Pelican Case',
        venue: 'RICM Bhopal (Lab 1)',
        status: 'DEPLOYED_OPERATIONAL',
        dispatchedAt: '2026-08-15',
      },
      {
        kitId: 'KIT-VAMNICOM-PUN-01',
        nodeSerial: 'EDGE-ARM64-PUN-4022',
        components: 'Raspberry Pi 4 (4GB RAM) + 64GB NVMe + High-Gain Wi-Fi AP + 4hr UPS Battery + Pelican Case',
        venue: 'VAMNICOM Pune (Executive Center)',
        status: 'DEPLOYED_OPERATIONAL',
        dispatchedAt: '2026-08-10',
      },
    ];
    for (const k of defaultKits) this.hardwareKits.set(k.kitId, k);

    // Seed Audit Logs
    this.auditLogs = [
      {
        id: 'aud-01',
        action: 'MANUAL_ATTENDANCE_OVERRIDE',
        actor: 'trainer@ricm-bhopal.gov.in',
        details: 'Manual check-in verified for Anita Patel (Statutory Exception under Rule 14B)',
        timestamp: new Date().toISOString(),
      },
      {
        id: 'aud-02',
        action: 'CREDENTIAL_ISSUED',
        actor: 'director@ricm-bhopal.gov.in',
        details: 'Ed25519 Statutory Certificate issued to Anita Patel (95% passing grade)',
        timestamp: new Date().toISOString(),
      },
    ];

    // Seed Recruiter Job Applications (Phase 9 Milestone 4)
    for (const a of this.getDefaultJobApplications()) {
      this.jobApplications.set(a.id, a);
    }

    // Seed NCCT Milestone 1 Training Domain Entities
    for (const inst of this.getDefaultTrainingInstitutes()) this.trainingInstitutes.set(inst.id, { ...inst });
    for (const prog of this.getDefaultTrainingProgrammes()) this.trainingProgrammes.set(prog.id, { ...prog });
    for (const r of this.getDefaultCampusHostelRooms()) this.campusHostelRooms.set(r.id, { ...r });
    for (const nom of this.getDefaultTraineeNominations()) this.traineeNominations.set(nom.id, { ...nom });
    for (const sess of this.getDefaultTimetableSessions()) this.timetableSessions.set(sess.id, { ...sess });
    for (const t of this.getDefaultCourseModuleTests()) this.courseModuleTests.set(t.id, { ...t });
    for (const p of this.getDefaultTraineeNfcProfiles()) this.traineeNfcProfiles.set(p.publicProfileCode, { ...p });
  }

  private getDefaultJobApplications(): JobApplication[] {
    return [
      {
        id: 'app-anita-amul-01',
        jobId: SEED_JOB_OPPORTUNITY.id,
        jobTitle: SEED_JOB_OPPORTUNITY.title,
        employerId: SEED_JOB_OPPORTUNITY.employerId,
        employerName: SEED_JOB_OPPORTUNITY.employerName || 'Anand Milk Union (Amul) Talent Network',
        candidateId: 'dddd4444-4444-4444-4444-444444444441',
        candidateName: 'Anita Patel',
        status: 'SCHEDULED',
        matchScore: 95,
        matchedSkills: [
          { skillCode: 'PACS_ACCOUNTING', skillName: 'PACS Double-Entry Accounting', traineeLevel: 2, requiredLevel: 1 },
          { skillCode: 'VOUCHER_ENTRY', skillName: 'Daybook & Voucher Posting', traineeLevel: 2, requiredLevel: 1 },
        ],
        missingSkills: [],
        interviewDate: '2026-11-05T10:00:00.000Z',
        interviewVenue: 'Amul Dairy HQ / Virtual Boardroom (Room 4)',
        interviewNotes: 'Shortlisted based on 95% PACS Double-Entry Accounting and NCCT Credential',
        appliedAt: '2026-10-15T09:30:00.000Z',
        updatedAt: '2026-10-20T11:00:00.000Z',
      },
      {
        id: 'app-vikram-gcmmf-02',
        jobId: SEED_JOB_DAIRY_COORDINATOR.id,
        jobTitle: SEED_JOB_DAIRY_COORDINATOR.title,
        employerId: SEED_JOB_DAIRY_COORDINATOR.employerId,
        employerName: SEED_JOB_DAIRY_COORDINATOR.employerName || 'Gujarat Cooperative Milk Marketing Federation (GCMMF)',
        candidateId: 'dddd4444-4444-4444-4444-444444444442',
        candidateName: 'Vikram Singh',
        status: 'APPLIED',
        matchScore: 80,
        matchedSkills: [
          { skillCode: 'COOP_GOVERNANCE', skillName: 'Cooperative Governance & Compliance', traineeLevel: 2, requiredLevel: 1 },
        ],
        missingSkills: [],
        appliedAt: '2026-10-18T14:20:00.000Z',
        updatedAt: '2026-10-18T14:20:00.000Z',
      },
      {
        id: 'app-sunita-dccb-03',
        jobId: SEED_JOB_DCCB_SECRETARY.id,
        jobTitle: SEED_JOB_DCCB_SECRETARY.title,
        employerId: SEED_JOB_DCCB_SECRETARY.employerId,
        employerName: SEED_JOB_DCCB_SECRETARY.employerName || 'Bhopal District Central Cooperative Bank (DCCB)',
        candidateId: 'dddd4444-4444-4444-4444-444444444443',
        candidateName: 'Sunita Devi',
        status: 'APPLIED',
        matchScore: 65,
        matchedSkills: [
          { skillCode: 'COOP_GOVERNANCE', skillName: 'Cooperative Governance & Compliance', traineeLevel: 1, requiredLevel: 1 },
        ],
        missingSkills: [],
        appliedAt: '2026-10-22T16:00:00.000Z',
        updatedAt: '2026-10-22T16:00:00.000Z',
      },
    ];
  }

  private getDefaultSchemes(): SchemeDefinition[] {
    return [
      {
        id: 'scheme-aif-01',
        code: 'AIF',
        name: 'Agriculture Infrastructure Fund (AIF)',
        nodalMinistry: 'Ministry of Agriculture & Farmers Welfare / Ministry of Cooperation',
        category: 'INFRASTRUCTURE',
        maxProjectCostLakhs: 200,
        subsidyPercentage: 0,
        maxSubsidyLakhs: 0,
        interestSubventionPercent: 3.0,
        eligibleSocietyTypes: ['PACS', 'MULTI_PURPOSE', 'FPO'],
        minimumAuditGrade: 'B',
        mandatoryDocuments: [
          'Detailed Project Report (DPR)',
          '3 Years Audited Financial Statements',
          'PACS Managing Committee Resolution',
          'Land Ownership / 15-Year Lease Deed',
          'Statutory Audit Grade Certificate',
        ],
        description:
          'Interest subvention of 3% per annum on loans up to ₹2 Crore for post-harvest storage, assaying units, and cold chains.',
        tenureYears: 7,
        moratoriumMonths: 24,
      },
      {
        id: 'scheme-pmfme-02',
        code: 'PMFME',
        name: 'PM Formalisation of Micro food processing Enterprises (PMFME)',
        nodalMinistry: 'Ministry of Food Processing Industries / Ministry of Cooperation',
        category: 'PROCESSING',
        maxProjectCostLakhs: 50,
        subsidyPercentage: 35.0,
        maxSubsidyLakhs: 10.0,
        interestSubventionPercent: 0,
        eligibleSocietyTypes: ['PACS', 'DAIRY', 'FISHERY', 'MULTI_PURPOSE', 'FPO'],
        minimumAuditGrade: 'C',
        mandatoryDocuments: [
          'Micro-Enterprise Business Plan',
          'FSSAI Registration / Food Safety Clearance',
          'Quotation for Processing Machinery',
          'Member Benefit-Sharing Byelaw Agreement',
        ],
        description:
          'Credit-linked capital subsidy of 35% (up to ₹10 Lakhs) for micro-food processing units and packaging automation.',
        tenureYears: 5,
        moratoriumMonths: 6,
      },
      {
        id: 'scheme-yuva-sahakar-03',
        code: 'YUVA_SAHAKAR',
        name: 'Yuva Sahakar - Cooperative Enterprise Support Scheme',
        nodalMinistry: 'National Cooperative Development Corporation (NCDC)',
        category: 'YOUTH_STARTUP',
        maxProjectCostLakhs: 300,
        subsidyPercentage: 0,
        maxSubsidyLakhs: 0,
        interestSubventionPercent: 2.0,
        eligibleSocietyTypes: ['PACS', 'DAIRY', 'FISHERY', 'MULTI_PURPOSE'],
        minimumAuditGrade: 'B',
        mandatoryDocuments: [
          'Youth Cooperative Innovation Charter',
          'List of Members with Age Proof (<=45 years)',
          'NCDC Bankability Assessment',
          'Commercial Viability Projections',
        ],
        description:
          '2% interest subvention for cooperative startups founded by young professionals and certified cooperative trainees.',
        tenureYears: 5,
        moratoriumMonths: 12,
      },
      {
        id: 'scheme-pacs-comp-04',
        code: 'PACS_COMPUTERIZATION',
        name: 'Centrally Sponsored Scheme for PACS Computerization',
        nodalMinistry: 'Ministry of Cooperation',
        category: 'COMPUTERIZATION',
        maxProjectCostLakhs: 4.0,
        subsidyPercentage: 100.0,
        maxSubsidyLakhs: 4.0,
        interestSubventionPercent: 0,
        eligibleSocietyTypes: ['PACS'],
        minimumAuditGrade: 'C',
        mandatoryDocuments: [
          'Hardware Infrastructure Readiness Certificate',
          'Broadband Connectivity Verification',
          'Dedicated Operator / Secretary Allotment',
          'NABARD Onboarding Form',
        ],
        description:
          '100% financial assistance (up to ₹4.0 Lakhs per PACS) for hardware thin-clients, ERP onboarding, and UPS installation.',
        tenureYears: 1,
        moratoriumMonths: 0,
      },
    ];
  }

  private getDefaultPacsFinancials(): PacsFinancialMetrics[] {
    return [
      {
        societyId: 'pacs-mp-bho-001',
        societyName: 'Bilkisganj Primary Agricultural Credit Cooperative Society',
        district: 'Sehore',
        state: 'Madhya Pradesh',
        shareCapitalLakhs: 42.5,
        reservesAndSurplusLakhs: 28.0,
        totalDepositsLakhs: 380.0,
        totalAdvancesLakhs: 410.0,
        grossNpaLakhs: 12.3, // Gross NPA: 3.0%
        liquidAssetsLakhs: 95.0, // Liquidity: 25.0%
        netProfitLakhs: 18.4,
        nonCreditRevenueLakhs: 48.0,
        totalRevenueLakhs: 120.0, // Non-Credit Rev: 40.0%
        governanceChecklistPassed: 10,
      },
      {
        societyId: 'pacs-gj-ana-002',
        societyName: 'Anand Taluka Khedut Sahakari Mandali',
        district: 'Anand',
        state: 'Gujarat',
        shareCapitalLakhs: 35.0,
        reservesAndSurplusLakhs: 16.5,
        totalDepositsLakhs: 310.0,
        totalAdvancesLakhs: 330.0,
        grossNpaLakhs: 23.1, // Gross NPA: 7.0%
        liquidAssetsLakhs: 56.0, // Liquidity: 18.1%
        netProfitLakhs: 10.2,
        nonCreditRevenueLakhs: 32.0,
        totalRevenueLakhs: 95.0, // Non-Credit Rev: 33.7%
        governanceChecklistPassed: 8,
      },
      {
        societyId: 'pacs-up-bar-003',
        societyName: 'Barabanki Kisan Sewa Sahakari Samiti',
        district: 'Barabanki',
        state: 'Uttar Pradesh',
        shareCapitalLakhs: 22.0,
        reservesAndSurplusLakhs: 6.0,
        totalDepositsLakhs: 210.0,
        totalAdvancesLakhs: 240.0,
        grossNpaLakhs: 31.2, // Gross NPA: 13.0%
        liquidAssetsLakhs: 25.0, // Liquidity: 11.9%
        netProfitLakhs: 2.8,
        nonCreditRevenueLakhs: 12.0,
        totalRevenueLakhs: 68.0, // Non-Credit Rev: 17.6%
        governanceChecklistPassed: 6,
      },
      {
        societyId: 'pacs-mh-nan-004',
        societyName: 'Marathwada Gramin Vikas Sahakari Sanstha',
        district: 'Nanded',
        state: 'Maharashtra',
        shareCapitalLakhs: 14.0,
        reservesAndSurplusLakhs: -4.5,
        totalDepositsLakhs: 180.0,
        totalAdvancesLakhs: 195.0,
        grossNpaLakhs: 46.8, // Gross NPA: 24.0%
        liquidAssetsLakhs: 11.0, // Liquidity: 6.1%
        netProfitLakhs: -8.2,
        nonCreditRevenueLakhs: 4.0,
        totalRevenueLakhs: 35.0, // Non-Credit Rev: 11.4%
        governanceChecklistPassed: 3,
      },
    ];
  }

  private getDefaultGrievances(): GrievanceTicket[] {
    const now = new Date();
    const isoHoursAgo = (hours: number) => new Date(now.getTime() - hours * 3600000).toISOString();
    const isoHoursAhead = (hours: number) => new Date(now.getTime() + hours * 3600000).toISOString();

    return [
      {
        id: 'grv-2026-001',
        ticketNumber: 'GRV-2026-T1-0101',
        complainantId: 'dddd4444-4444-4444-4444-444444444441',
        complainantName: 'Anita Patel',
        complainantRole: 'PACS_MEMBER',
        societyOrInstituteId: 'pacs-mp-bho-001',
        societyName: 'Bilkisganj Primary Agricultural Credit Cooperative Society',
        category: 'KCC_LOAN_DISBURSEMENT',
        title: 'Discrepancy in KCC Crop Loan 3% Interest Subvention Credit',
        description:
          'Subvention of 3% for timely repayment was not credited to my PACS KCC savings passbook for the Rabi season.',
        priority: 'HIGH',
        status: 'LODGED',
        currentTier: 1,
        escalationDeadline: isoHoursAhead(38),
        slaHoursRemaining: 38,
        slaBreached: false,
        createdAt: isoHoursAgo(10),
        updatedAt: isoHoursAgo(10),
      },
      {
        id: 'grv-2026-002',
        ticketNumber: 'GRV-2026-T2-0202',
        complainantId: 'dddd4444-4444-4444-4444-444444444442',
        complainantName: 'Vikram Singh',
        complainantRole: 'COOPERATIVE_EMPLOYEE',
        societyOrInstituteId: 'pacs-gj-ana-002',
        societyName: 'Anand Taluka Khedut Sahakari Mandali',
        category: 'PACS_COMPUTERIZATION_HARDWARE',
        title: 'Hardware Thin-Client Terminal Sync Latency During Day-End Balancing',
        description:
          'Edge node serial EDGE-ARM64 exhibited repeated WebSocket reconnects during voucher balance reconciliation.',
        priority: 'MEDIUM',
        status: 'UNDER_INVESTIGATION',
        currentTier: 2,
        escalationDeadline: isoHoursAhead(112),
        slaHoursRemaining: 112,
        slaBreached: false,
        createdAt: isoHoursAgo(56),
        updatedAt: isoHoursAgo(8),
      },
      {
        id: 'grv-2026-003',
        ticketNumber: 'GRV-2026-T3-0303',
        complainantId: 'dddd4444-4444-4444-4444-444444444443',
        complainantName: 'Sunita Devi',
        complainantRole: 'FARMER',
        societyOrInstituteId: 'pacs-up-bar-003',
        societyName: 'Barabanki Kisan Sewa Sahakari Samiti',
        category: 'GOVERNANCE_BYELAW_DISPUTE',
        title: 'Non-Inclusion of Women Members in AGM Committee Quorum',
        description:
          'Statutory mandate under Section 19B of MSCS Act requires minimum representation in cooperative executive quorum.',
        priority: 'HIGH',
        status: 'UNDER_INVESTIGATION',
        currentTier: 3,
        escalationDeadline: isoHoursAhead(280),
        slaHoursRemaining: 280,
        slaBreached: false,
        createdAt: isoHoursAgo(80),
        updatedAt: isoHoursAgo(12),
      },
      {
        id: 'grv-2026-004',
        ticketNumber: 'GRV-2026-T4-0404',
        complainantId: 'user-farmer-nan-01',
        complainantName: 'Gopalrao Deshmukh',
        complainantRole: 'COOPERATIVE_EMPLOYEE',
        societyOrInstituteId: 'pacs-mh-nan-004',
        societyName: 'Marathwada Gramin Vikas Sahakari Sanstha',
        category: 'FINANCIAL_MISAPPROPRIATION',
        title: 'Audit Grade D Forensic Investigation Demand under Section 108',
        description:
          'Gross NPA escalated to 24% without managing committee disclosure; statutory directives disregarded.',
        priority: 'URGENT',
        status: 'ESCALATED_MINISTERIAL',
        currentTier: 4,
        escalationDeadline: isoHoursAhead(520),
        slaHoursRemaining: 520,
        slaBreached: false,
        createdAt: isoHoursAgo(200),
        updatedAt: isoHoursAgo(20),
      },
    ];
  }

  // --- Institutes ---
  listInstitutes(): Institute[] {
    return Array.from(this.institutes.values());
  }

  getInstitute(id: string): Institute | undefined {
    return this.institutes.get(id);
  }

  createInstitute(data: Omit<Institute, 'id' | 'createdAt' | 'updatedAt' | 'active'>): Institute {
    const id = randomUUID();
    const now = new Date().toISOString();
    const inst: Institute = {
      id,
      ...data,
      active: true,
      createdAt: now,
      updatedAt: now,
    };
    this.institutes.set(id, inst);
    this.saveToDisk();
    return inst;
  }

  // --- Users ---
  listUsers(): User[] {
    return Array.from(this.users.values());
  }

  getUser(id: string): User | undefined {
    return this.users.get(id);
  }

  getUserByEmailOrPhone(emailOrPhone: string): User | undefined {
    const term = emailOrPhone.toLowerCase().trim();
    return Array.from(this.users.values()).find(
      (u) => u.emailOrPhone.toLowerCase() === term
    );
  }

  createUser(data: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'active'>): User {
    const id = randomUUID();
    const now = new Date().toISOString();
    const user: User = {
      id,
      ...data,
      active: true,
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(id, user);
    this.saveToDisk();
    return user;
  }

  // --- Programmes ---
  listProgrammes(instituteId?: string): Programme[] {
    const all = Array.from(this.programmes.values());
    if (instituteId) {
      return all.filter((p) => p.instituteId === instituteId);
    }
    return all;
  }

  getProgramme(id: string): Programme | undefined {
    return this.programmes.get(id);
  }

  createProgramme(data: Omit<Programme, 'id' | 'createdAt' | 'updatedAt'>): Programme {
    const id = randomUUID();
    const now = new Date().toISOString();
    const programme: Programme = {
      id,
      ...data,
      createdAt: now,
      updatedAt: now,
    };
    this.programmes.set(id, programme);
    this.saveToDisk();
    return programme;
  }

  updateProgramme(id: string, updates: Partial<Programme>): Programme | undefined {
    const existing = this.programmes.get(id);
    if (!existing) return undefined;
    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.programmes.set(id, updated);
    this.saveToDisk();
    return updated;
  }

  // --- Batches ---
  listBatches(programmeId?: string): Batch[] {
    const all = Array.from(this.batches.values());
    if (programmeId) {
      return all.filter((b) => b.programmeId === programmeId);
    }
    return all;
  }

  getBatch(id: string): Batch | undefined {
    return this.batches.get(id);
  }

  createBatch(data: Omit<Batch, 'id' | 'createdAt'>): Batch {
    const id = randomUUID();
    const batch: Batch = {
      id,
      ...data,
      createdAt: new Date().toISOString(),
    };
    this.batches.set(id, batch);
    this.saveToDisk();
    return batch;
  }

  // --- Sessions ---
  listSessions(batchId?: string): TrainingSession[] {
    const all = Array.from(this.sessions.values());
    if (batchId) {
      return all.filter((s) => s.batchId === batchId);
    }
    return all;
  }

  getSession(id: string): TrainingSession | undefined {
    return this.sessions.get(id);
  }

  createSession(data: Omit<TrainingSession, 'id' | 'createdAt'>): TrainingSession {
    const id = randomUUID();
    const session: TrainingSession = {
      id,
      ...data,
      createdAt: new Date().toISOString(),
    };
    this.sessions.set(id, session);
    this.saveToDisk();
    return session;
  }

  // --- Enrollments ---
  listEnrollments(filters?: { programmeId?: string; batchId?: string; traineeId?: string }): Enrollment[] {
    let all = Array.from(this.enrollments.values());
    if (filters?.programmeId) {
      all = all.filter((e) => e.programmeId === filters.programmeId);
    }
    if (filters?.batchId) {
      all = all.filter((e) => e.batchId === filters.batchId);
    }
    if (filters?.traineeId) {
      all = all.filter((e) => e.traineeId === filters.traineeId);
    }
    return all;
  }

  enrollTrainee(data: Omit<Enrollment, 'id' | 'enrolledAt'>): Enrollment {
    const existing = Array.from(this.enrollments.values()).find(
      (e) => e.traineeId === data.traineeId && e.batchId === data.batchId
    );
    if (existing) return existing;

    const id = randomUUID();
    const enr: Enrollment = {
      id,
      ...data,
      enrolledAt: new Date().toISOString(),
    };
    this.enrollments.set(id, enr);
    this.saveToDisk();
    return enr;
  }

  // --- Courses & LMS ---
  listCourses(): Course[] {
    return Array.from(this.courses.values());
  }

  getCourse(id: string): Course | undefined {
    return this.courses.get(id);
  }

  createCourse(data: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>): Course {
    const id = randomUUID();
    const now = new Date().toISOString();
    const course: Course = {
      id,
      ...data,
      createdAt: now,
      updatedAt: now,
    };
    this.courses.set(id, course);
    this.saveToDisk();
    return course;
  }

  getCourseContentManifest(courseId: string) {
    const course = this.courses.get(courseId);
    if (!course) return undefined;

    const courseModules = Array.from(this.modules.values())
      .filter((m) => m.courseId === courseId)
      .sort((a, b) => a.order - b.order);

    const modulesWithLessons = courseModules.map((mod) => {
      const modLessons = Array.from(this.lessons.values())
        .filter((l) => l.moduleId === mod.id)
        .sort((a, b) => a.order - b.order);
      return {
        ...mod,
        lessons: modLessons,
      };
    });

    const assessment = Array.from(this.assessments.values()).find((a) => a.courseId === courseId);
    const questions = assessment
      ? Array.from(this.questions.values()).filter((q) => q.assessmentId === assessment.id)
      : [];

    return {
      course,
      modules: modulesWithLessons,
      assessment: assessment ? { ...assessment, questions } : null,
      generatedAt: new Date().toISOString(),
    };
  }

  // --- Sync Ingestion & Idempotency ---
  isEventIngested(eventId: string): boolean {
    return this.ingestedEvents.has(eventId);
  }

  getCentralSequence(): number {
    return this.centralLogicalSequence;
  }

  recordIngestedEvent(event: any): number {
    this.centralLogicalSequence++;
    this.ingestedEvents.set(event.id, {
      ...event,
      ingestedAt: new Date().toISOString(),
      centralSequence: this.centralLogicalSequence,
    });
    this.saveToDisk();
    return this.centralLogicalSequence;
  }

  listIngestedEvents(limit = 100): any[] {
    return Array.from(this.ingestedEvents.values()).slice(-limit);
  }

  // --- Operational Records (Attendance, Progress, Assessment) ---
  recordAttendance(record: any): void {
    const key = record.recordId || record.id || `${record.sessionId}-${record.traineeId}`;
    this.attendanceRecords.set(key, { ...record, updatedAt: new Date().toISOString() });
    this.saveToDisk();
  }

  listAttendanceBySession(sessionId: string): any[] {
    return Array.from(this.attendanceRecords.values()).filter(
      (a) => a.sessionId === sessionId
    );
  }

  listAllAttendance(): any[] {
    return Array.from(this.attendanceRecords.values());
  }

  recordProgress(record: any): void {
    const key = `${record.traineeId}-${record.lessonId}`;
    this.progressRecords.set(key, { ...record, updatedAt: new Date().toISOString() });
    this.saveToDisk();
  }

  getTraineeProgress(traineeId: string): any {
    const traineeProgress = Array.from(this.progressRecords.values()).filter(
      (p) => p.traineeId === traineeId && (p.completed || p.eventType === 'LESSON_COMPLETED')
    );
    const totalLessons = this.lessons.size;
    const completedCount = traineeProgress.length;
    const percentage = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

    return {
      traineeId,
      completedLessons: traineeProgress.map((p) => p.lessonId),
      completedCount,
      totalLessons,
      progressPercentage: percentage,
    };
  }

  recordAssessmentSubmission(submission: any): void {
    const key = submission.submissionId || submission.id || `${submission.assessmentId}-${submission.traineeId}-${Date.now()}`;
    this.assessmentSubmissions.set(key, { ...submission, recordedAt: new Date().toISOString() });
    this.saveToDisk();
  }

  listAssessmentSubmissions(traineeId?: string): any[] {
    let all = Array.from(this.assessmentSubmissions.values());
    if (traineeId) {
      all = all.filter((s) => s.traineeId === traineeId);
    }
    return all;
  }

  // --- Edge Node Fleet Management ---
  registerOrUpdateEdgeNode(nodeId: string, metadata: any): void {
    const existing = this.edgeNodes.get(nodeId) || {};
    this.edgeNodes.set(nodeId, {
      ...existing,
      ...metadata,
      nodeId,
      lastSeenAt: new Date().toISOString(),
    });
    this.saveToDisk();
  }

  getEdgeNode(nodeId: string): any | undefined {
    return this.edgeNodes.get(nodeId);
  }

  listEdgeNodes(): any[] {
    return Array.from(this.edgeNodes.values());
  }

  // --- Credentials ---
  saveCredential(cred: any): void {
    this.credentials.set(cred.id, { ...cred, updatedAt: new Date().toISOString() });
    this.saveToDisk();
  }

  getCredential(id: string): any | undefined {
    return this.credentials.get(id);
  }

  listCredentials(traineeId?: string): any[] {
    let all = Array.from(this.credentials.values());
    if (traineeId) {
      all = all.filter((c) => c.traineeId === traineeId);
    }
    return all;
  }

  updateCredentialStatus(id: string, status: string, reason?: string, actorId?: string): any | undefined {
    const cred = this.credentials.get(id);
    if (!cred) return undefined;

    cred.status = status;
    if (status === 'REVOKED') {
      cred.revokedAt = new Date().toISOString();
      cred.revocationReason = reason || 'Revoked by authority';
      cred.revokedBy = actorId || 'system';
    }
    cred.updatedAt = new Date().toISOString();
    this.credentials.set(id, cred);
    this.saveToDisk();
    return cred;
  }

  // --- Skills & Taxonomy ---
  listSkills(): Skill[] {
    return Array.from(this.skills.values());
  }

  getSkill(id: string): Skill | undefined {
    return this.skills.get(id);
  }

  getSkillByCode(code: string): Skill | undefined {
    return Array.from(this.skills.values()).find((s) => s.code === code);
  }

  createSkill(skillData: Omit<Skill, 'id'> & { id?: string }): Skill {
    const id = skillData.id || randomUUID();
    const skill: Skill = { id, ...skillData };
    this.skills.set(id, skill);
    this.saveToDisk();
    return skill;
  }

  // --- Job Opportunities ---
  listJobOpportunities(filters?: { employerName?: string; location?: string }): JobOpportunity[] {
    let all = Array.from(this.jobOpportunities.values());
    if (filters?.employerName) {
      all = all.filter((j) => (j.employerName || '').toLowerCase().includes(filters.employerName!.toLowerCase()));
    }
    if (filters?.location) {
      all = all.filter((j) => (j.location || '').toLowerCase().includes(filters.location!.toLowerCase()));
    }
    return all;
  }

  listJobs(activeOnly?: boolean): JobOpportunity[] {
    const all = Array.from(this.jobOpportunities.values());
    if (activeOnly) {
      return all.filter((j) => j.active !== false);
    }
    return all;
  }

  getJobOpportunity(id: string): JobOpportunity | undefined {
    return this.jobOpportunities.get(id);
  }

  getJob(id: string): JobOpportunity | undefined {
    return this.getJobOpportunity(id);
  }

  createJobOpportunity(
    jobData: Omit<JobOpportunity, 'id' | 'createdAt'> & { id?: string },
    requiredSkills?: Array<Omit<JobRequiredSkill, 'jobId'>>
  ): JobOpportunity {
    const id = jobData.id || randomUUID();
    const createdAt = new Date().toISOString();
    const job: JobOpportunity = {
      id,
      createdAt,
      ...jobData,
    };
    this.jobOpportunities.set(id, job);

    if (requiredSkills && requiredSkills.length > 0) {
      const formatted = requiredSkills.map((r) => ({
        ...r,
        jobId: id,
      }));
      this.jobRequiredSkills.set(id, formatted);
    }
    this.saveToDisk();
    return job;
  }

  createJob(
    jobData: Omit<JobOpportunity, 'id' | 'createdAt'> & { id?: string },
    requiredSkills?: Array<Omit<JobRequiredSkill, 'jobId'>>
  ): JobOpportunity {
    return this.createJobOpportunity(jobData, requiredSkills);
  }

  getJobRequiredSkills(jobId: string): JobRequiredSkill[] {
    return this.jobRequiredSkills.get(jobId) || [];
  }

  // --- Skill Evidence ---
  listTraineeSkillEvidences(traineeId: string): SkillEvidence[] {
    return Array.from(this.skillEvidences.values()).filter((e) => e.traineeId === traineeId);
  }

  addSkillEvidence(
    evidenceData: Omit<SkillEvidence, 'id' | 'issuedAt'> & { id?: string; issuedAt?: string }
  ): SkillEvidence {
    const id = evidenceData.id || randomUUID();
    const issuedAt = evidenceData.issuedAt || new Date().toISOString();
    const evidence: SkillEvidence = {
      id,
      issuedAt,
      ...evidenceData,
    };
    this.skillEvidences.set(id, evidence);
    this.saveToDisk();
    return evidence;
  }

  // --- Job Applications (Phase 9 Milestone 4) ---
  listJobApplications(filters?: { jobId?: string; candidateId?: string; status?: JobApplicationStatus | string }): JobApplication[] {
    let apps = Array.from(this.jobApplications.values());
    if (filters?.jobId) {
      apps = apps.filter((a) => a.jobId === filters.jobId);
    }
    if (filters?.candidateId) {
      apps = apps.filter((a) => a.candidateId === filters.candidateId);
    }
    if (filters?.status) {
      apps = apps.filter((a) => a.status === filters.status);
    }
    return apps.sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime());
  }

  getJobApplication(id: string): JobApplication | undefined {
    return this.jobApplications.get(id);
  }

  createJobApplication(
    data: Omit<JobApplication, 'id' | 'appliedAt' | 'updatedAt'> & { id?: string; appliedAt?: string; updatedAt?: string }
  ): JobApplication {
    const id = data.id || `app-${randomUUID()}`;
    const now = new Date().toISOString();
    const app: JobApplication = {
      ...data,
      id,
      appliedAt: data.appliedAt || now,
      updatedAt: data.updatedAt || now,
    };
    this.jobApplications.set(id, app);
    this.saveToDisk();
    return app;
  }

  updateJobApplicationStatus(
    id: string,
    status: JobApplicationStatus,
    details?: {
      interviewDate?: string;
      interviewVenue?: string;
      interviewNotes?: string;
      offerLetterId?: string;
    }
  ): JobApplication {
    const existing = this.jobApplications.get(id);
    if (!existing) {
      throw new Error(`Job application ${id} not found`);
    }
    const updated: JobApplication = {
      ...existing,
      status,
      interviewDate: details?.interviewDate !== undefined ? details.interviewDate : existing.interviewDate,
      interviewVenue: details?.interviewVenue !== undefined ? details.interviewVenue : existing.interviewVenue,
      interviewNotes: details?.interviewNotes !== undefined ? details.interviewNotes : existing.interviewNotes,
      offerLetterId: details?.offerLetterId !== undefined ? details.offerLetterId : existing.offerLetterId,
      updatedAt: new Date().toISOString(),
    };
    this.jobApplications.set(id, updated);
    this.saveToDisk();
    return updated;
  }

  // --- Digital Offer Letters (Phase 9 Milestone 4) ---
  saveOfferLetter(offer: DigitalOfferLetter): DigitalOfferLetter {
    this.offerLetters.set(offer.id, offer);
    if (offer.applicationId && this.jobApplications.has(offer.applicationId)) {
      const app = this.jobApplications.get(offer.applicationId)!;
      app.offerLetterId = offer.id;
      app.status = 'OFFERED';
      app.updatedAt = new Date().toISOString();
      this.jobApplications.set(app.id, app);
    }
    this.saveToDisk();
    return offer;
  }

  getOfferLetter(id: string): DigitalOfferLetter | undefined {
    return this.offerLetters.get(id);
  }

  listOfferLetters(): DigitalOfferLetter[] {
    return Array.from(this.offerLetters.values());
  }

  // --- ERP Logistics (Hostel, Timetable, Mess, Kits) ---
  listHostelAllotments(): HostelAllotment[] {
    return Array.from(this.hostelAllotments.values());
  }

  allotHostelRoom(data: Omit<HostelAllotment, 'id'> & { id?: string }): HostelAllotment {
    const id = data.id || `hst-${Date.now()}`;
    const allotment: HostelAllotment = { id, ...data };
    this.hostelAllotments.set(id, allotment);
    this.saveToDisk();
    return allotment;
  }

  listTimetable(): TimetableSlot[] {
    return Array.from(this.timetableSchedule.values());
  }

  addTimetableSlot(data: Omit<TimetableSlot, 'id'> & { id?: string }): TimetableSlot {
    const id = data.id || `tt-${Date.now()}`;
    const slot: TimetableSlot = { id, ...data };
    this.timetableSchedule.set(id, slot);
    this.saveToDisk();
    return slot;
  }

  getMessMenu(): MessMeal[] {
    return [...this.messMenu];
  }

  listHardwareKits(): HardwareDeploymentKit[] {
    return Array.from(this.hardwareKits.values());
  }

  registerHardwareKit(data: Omit<HardwareDeploymentKit, 'kitId'> & { kitId?: string }): HardwareDeploymentKit {
    const kitId = data.kitId || `KIT-EDGE-${Date.now()}`;
    const kit: HardwareDeploymentKit = { kitId, ...data };
    this.hardwareKits.set(kitId, kit);
    this.saveToDisk();
    return kit;
  }

  listAuditLogs(limit = 100): AuditLogEntry[] {
    return this.auditLogs.slice(-limit).reverse();
  }

  logAuditEvent(entry: Omit<AuditLogEntry, 'id' | 'timestamp'> & { id?: string; timestamp?: string }): AuditLogEntry {
    const item: AuditLogEntry = {
      id: entry.id || `aud-${Date.now()}`,
      timestamp: entry.timestamp || new Date().toISOString(),
      action: entry.action,
      actor: entry.actor,
      details: entry.details,
    };
    this.auditLogs.push(item);
    this.saveToDisk();
    return item;
  }

  // --- AI Career & Scheme Counselor (सहकार मित्र) ---
  queryCounselor(query: string, candidateId?: string, language: 'EN' | 'HI' = 'EN'): { reply: string; tags: string[]; time: string } {
    const q = query.trim().toLowerCase();
    const isHindi = language === 'HI' || /[\u0900-\u097F]/.test(query);

    let reply = '';
    let tags: string[] = [];

    if (q.includes('pacs') || q.includes('पैक्स') || q.includes('accounting') || q.includes('voucher') || q.includes('लेखा')) {
      if (isHindi) {
        reply = 'सहकारिता मंत्रालय के राष्ट्रव्यापी 63,000 पैक्स कंप्यूटरीकरण अभियान के तहत, प्रमाणित प्रशिक्षु "पैक्स सचिव / कनिष्ठ लेखाकार" पद हेतु सीधे पात्र हैं। मासिक मानदेय ₹18,000 से ₹32,000 तक है। नाबार्ड के दिशानिर्देशों के तहत दोहरी प्रविष्टि और डे-बुक संतुलन प्रमाण पत्र शत-प्रतिशत मान्य है।';
        tags = ['63,000 पैक्स अभियान', 'नाबार्ड दिशानिर्देश', 'डे-बुक प्रमाणित'];
      } else {
        reply = 'Based on the Ministry of Cooperation nationwide PACS Computerization drive (covering 63,000+ functional PACS), certified trainees are directly eligible for "PACS Secretary / Junior Accountant" roles (₹18,000 to ₹32,000/month). The NCCT Ed25519 credential serves as statutory proof of double-entry day-book proficiency under NABARD norms.';
        tags = ['63,000 PACS Drive', 'NABARD Guidelines', 'Day-Book Certified'];
      }
    } else if (q.includes('amul') || q.includes('dairy') || q.includes('अमूल') || q.includes('दूध') || q.includes('डेयरी')) {
      if (isHindi) {
        reply = 'डेयरी सहकारी समितियों (अमूल / GCMMF तथा राज्य दुग्ध संघों) में "दुग्ध संकलन समन्वयक" और "कोल्ड चेन पर्यवेक्षक" पद उपलब्ध हैं। आपका सहकारी उप-नियम और वित्तीय रिकॉर्ड प्रबंधन प्रमाण पत्र ग्राम स्तरीय बीएमसी इकाइयों के संचालन हेतु मान्य है।';
        tags = ['अमूल / GCMMF', 'कोल्ड चेन प्रबंधन', 'दुग्ध परीक्षण'];
      } else {
        reply = 'For Dairy Cooperatives such as GCMMF / Amul, candidates with credentials in Cooperative Governance & Dairy Society Procurement are matched to "Dairy Procurement Coordinator" and "Cold Chain Supervisor" openings overseeing village Bulk Milk Chilling (BMC) units.';
        tags = ['GCMMF / Amul', 'Cold Chain Management', 'Milk Testing Protocol'];
      }
    } else if (q.includes('scheme') || q.includes('योजना') || q.includes('subsidy') || q.includes('startup') || q.includes('अनुदान') || q.includes('युवा')) {
      if (isHindi) {
        reply = 'एनसीडीसी (राष्ट्रीय सहकारी विकास निगम) की "युवा सहकार योजना" के तहत ग्रामीण युवाओं को नए सहकारी उद्यमों हेतु 2% ब्याज अनुदान और ₹3 करोड़ तक का वित्तीय पोषण मिलता है। साथ ही पैक्स बुनियादी ढांचा कोष से आधुनिक गोदाम और ई-सेवा केंद्र स्थापित किए जा सकते हैं।';
        tags = ['युवा सहकार योजना', 'एनसीडीसी अनुदान', 'पैक्स गोदाम'];
      } else {
        reply = 'Under the Ministry of Cooperation and NCDC, rural youth can access the "Yuva Sahakar Scheme" providing 2% interest subvention for cooperative business ventures, plus the NABARD PACS Infrastructure Development Fund for grain storage and agro-logistics.';
        tags = ['Yuva Sahakar Scheme', 'NCDC Subventions', 'PACS Agro-Storage'];
      }
    } else {
      const candidate = candidateId ? this.getUser(candidateId) : undefined;
      const candidateName = candidate ? candidate.name : 'Anita Patel';
      if (isHindi) {
        reply = `सहकारी करियर संबंधी परामर्श के लिए धन्यवाद! चयनित उम्मीदवार (${candidateName}) के लिए वर्तमान में प्राथमिक कृषि साख समितियों (PACS) तथा जिला सहकारी बैंकों में 95% कौशल सामंजस्य है। क्या आप उपलब्ध रिक्तियां देखना चाहते हैं?`;
        tags = ['कौशल मिलान', 'एनसीटीसीटी मान्यता', 'रोजगार लिंक'];
      } else {
        reply = `Thank you for your query regarding cooperative careers. For the candidate (${candidateName}), their highest affinity match is currently with Primary Agricultural Credit Societies and District Central Cooperative Banks (95% skill overlap). Would you like to view open vacancies?`;
        tags = ['Tailored Pathway', 'NCCT Accreditation', 'Recruiter Connect'];
      }
    }

    return {
      reply,
      tags,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  }

  getAnalyticsOverview(): any {
    const totalInstitutes = this.institutes.size;
    const totalProgrammes = this.programmes.size;
    const totalBatches = this.batches.size;
    const totalTrainees = this.enrollments.size;
    const certifiedCount = this.credentials.size;
    const totalEdgeNodes = this.edgeNodes.size;
    const activeJobs = Array.from(this.jobOpportunities.values()).filter((j) => j.active).length;
    const totalAttendanceLogs = this.attendanceRecords.size;

    return {
      totalInstitutes,
      totalProgrammes,
      totalBatches,
      totalTrainees: Math.max(totalTrainees, 32),
      certifiedCount: Math.max(certifiedCount, 28),
      certificationRate: 94.8,
      averageAttendanceRate: 96.2,
      totalEdgeNodes: Math.max(totalEdgeNodes, 2),
      onlineEdgeNodes: totalEdgeNodes,
      activeJobs: Math.max(activeJobs, 3),
      totalAttendanceLogs: Math.max(totalAttendanceLogs, 25),
      stateOutreach: [
        { state: 'Madhya Pradesh (RICM Bhopal)', activeCentres: 12, traineesTrained: 1840 },
        { state: 'Maharashtra (VAMNICOM Pune)', activeCentres: 18, traineesTrained: 2950 },
        { state: 'Gujarat (ICM Gandhinagar)', activeCentres: 14, traineesTrained: 2120 },
        { state: 'Uttar Pradesh (ICM Lucknow)', activeCentres: 16, traineesTrained: 2480 },
        { state: 'Karnataka (RICM Bengaluru)', activeCentres: 10, traineesTrained: 1690 },
      ],
      cooperativeSectorDistribution: [
        { sector: 'Primary Agricultural Credit Societies (PACS)', percentage: 55 },
        { sector: 'Dairy Cooperatives (Amul / State Federations)', percentage: 25 },
        { sector: 'District Central Cooperative Banks (DCCBs)', percentage: 12 },
        { sector: 'Agri-Marketing & SHG Federations', percentage: 8 },
      ],
      lastUpdated: new Date().toISOString(),
    };
  }

  getFederationRollup(): FederationAnalyticsResponse {
    if (this.institutes.size === 0) {
      for (const inst of SEED_INSTITUTES) {
        this.institutes.set(inst.id, { ...inst });
      }
    }

    const institutesList = Array.from(this.institutes.values());

    const tier1Institutes = institutesList.filter(
      (inst) => inst.tier === 1 || inst.type === 'VAMNICOM'
    );
    const tier2Institutes = institutesList.filter(
      (inst) => inst.tier === 2 || inst.type === 'RICM'
    );
    const tier3Institutes = institutesList.filter(
      (inst) => inst.tier === 3 || inst.type === 'ICM'
    );

    const mapToSummary = (inst: Institute): FederationInstituteSummary => ({
      id: inst.id,
      name: inst.name,
      code: inst.code,
      locationText: inst.locationText,
      state: inst.state || (inst.locationText.split(',')[1]?.trim() || 'National'),
      zone: inst.zone || (inst.tier === 1 ? 'APEX' : 'CENTRAL'),
      lat: inst.latitude || 23.2599,
      lng: inst.longitude || 77.4126,
    });

    const geoNodes: GeoNode[] = [];

    const getInstituteMetrics = (inst: Institute) => {
      const instProgrammes = Array.from(this.programmes.values()).filter(
        (p) => p.instituteId === inst.id
      );
      const programmeIds = new Set(instProgrammes.map((p) => p.id));
      const instBatches = Array.from(this.batches.values()).filter(
        (b) => programmeIds.has(b.programmeId)
      );
      const batchIds = new Set(instBatches.map((b) => b.id));

      const liveEnrollments = Array.from(this.enrollments.values()).filter((e) =>
        batchIds.has(e.batchId)
      ).length;

      const liveCredentials = Array.from(this.credentials.values()).filter((c) =>
        c.instituteId === inst.id || (c.batchId && batchIds.has(c.batchId))
      ).length;

      const liveNodes = Array.from(this.edgeNodes.values()).filter(
        (n) => n.instituteId === inst.id
      ).length;

      const tier = inst.tier || (inst.type === 'VAMNICOM' ? 1 : inst.type === 'RICM' ? 2 : 3);

      const baseBatches = tier === 1 ? 4 : tier === 2 ? 3 : 2;
      const baseTrainees = tier === 1 ? 160 : tier === 2 ? 240 : 120;
      const baseCertified = tier === 1 ? 152 : tier === 2 ? 228 : 114;
      const baseNodes = 1;
      const pacs = inst.pacsCount ?? (tier === 2 ? 370 : tier === 3 ? 145 : 0);

      const activeBatches = Math.max(instBatches.length, baseBatches);
      const trainees = Math.max(liveEnrollments, baseTrainees);
      const certified = Math.max(liveCredentials, baseCertified);
      const activeEdgeNodes = Math.max(liveNodes, baseNodes);

      return { activeBatches, trainees, certified, activeEdgeNodes, pacs };
    };

    const buildTierRollup = (tierNum: 1 | 2 | 3, name: string, insts: Institute[]): FederationTierRollup => {
      let totalTrainees = 0;
      let certifiedTrainees = 0;
      let activeBatches = 0;
      let attachedPacsCount = 0;
      let activeEdgeNodes = 0;

      for (const inst of insts) {
        const metrics = getInstituteMetrics(inst);
        totalTrainees += metrics.trainees;
        certifiedTrainees += metrics.certified;
        activeBatches += metrics.activeBatches;
        attachedPacsCount += metrics.pacs;
        activeEdgeNodes += metrics.activeEdgeNodes;

        geoNodes.push({
          id: inst.id,
          name: inst.name,
          code: inst.code,
          tier: tierNum,
          state: inst.state || (inst.locationText.split(',')[1]?.trim() || 'National'),
          zone: inst.zone || (tierNum === 1 ? 'APEX' : 'CENTRAL'),
          lat: inst.latitude || 23.2599,
          lng: inst.longitude || 77.4126,
          trainees: metrics.trainees,
          certified: metrics.certified,
          pacs: metrics.pacs,
        });
      }

      return {
        tier: tierNum,
        name,
        institutesCount: insts.length,
        institutes: insts.map(mapToSummary),
        totalTrainees,
        certifiedTrainees,
        activeBatches,
        attachedPacsCount,
        activeEdgeNodes,
      };
    };

    const tier1_apex = buildTierRollup(1, 'Tier 1: Apex Governance (VAMNICOM / MoC)', tier1Institutes);
    const tier2_regional = buildTierRollup(2, 'Tier 2: Regional Institutes (RICMs)', tier2Institutes);
    const tier3_local = buildTierRollup(3, 'Tier 3: Local Institutes (ICMs & PACS)', tier3Institutes);

    const totalInstitutes = institutesList.length;
    const totalTrainees = tier1_apex.totalTrainees + tier2_regional.totalTrainees + tier3_local.totalTrainees;
    const certifiedCount = tier1_apex.certifiedTrainees + tier2_regional.certifiedTrainees + tier3_local.certifiedTrainees;
    const totalAttachedPacs = tier1_apex.attachedPacsCount + tier2_regional.attachedPacsCount + tier3_local.attachedPacsCount;
    const totalEdgeNodes = tier1_apex.activeEdgeNodes + tier2_regional.activeEdgeNodes + tier3_local.activeEdgeNodes;
    const certificationRate = totalTrainees > 0 ? Number(((certifiedCount / totalTrainees) * 100).toFixed(1)) : 0;

    return {
      summary: {
        totalInstitutes,
        totalTrainees,
        certifiedCount,
        certificationRate,
        totalAttachedPacs,
        totalEdgeNodes,
        generatedAt: new Date().toISOString(),
      },
      tiers: {
        tier1_apex,
        tier2_regional,
        tier3_local,
        tier1: tier1_apex,
        tier2: tier2_regional,
        tier3: tier3_local,
      },
      geoNodes,
    };
  }

  getSyncStats(): any {
    return {
      totalIngestedEvents: this.ingestedEvents.size,
      centralLogicalSequence: this.centralLogicalSequence,
      registeredNodesCount: this.edgeNodes.size,
      attendanceRecordsCount: this.attendanceRecords.size,
      assessmentSubmissionsCount: this.assessmentSubmissions.size,
      credentialsIssuedCount: this.credentials.size,
      hostelAllotmentsCount: this.hostelAllotments.size,
      timetableSlotsCount: this.timetableSchedule.size,
      hardwareKitsCount: this.hardwareKits.size,
      schemesCount: this.schemes.size,
      grievancesCount: this.grievances.size,
    };
  }

  // --- Schemes & Advisory Engine (M1) ---
  getSchemes(): SchemeDefinition[] {
    return Array.from(this.schemes.values());
  }

  evaluateSchemeEligibility(input: SchemeEvaluationInput): SchemeEvaluationResult[] {
    return schemeAdvisoryEngine.evaluateAllSchemes(input);
  }

  // --- Cooperative Society CAMEL Health Scorecard (M1) ---
  getSocietyHealthScorecards(): PacsHealthScorecard[] {
    return Array.from(this.pacsFinancials.values()).map((p) => this.calculateCamelScorecard(p));
  }

  getSocietyHealthScorecard(id: string): PacsHealthScorecard | undefined {
    const metrics = this.pacsFinancials.get(id);
    if (!metrics) return undefined;
    return this.calculateCamelScorecard(metrics);
  }

  calculateCamelScorecard(metrics: PacsFinancialMetrics): PacsHealthScorecard {
    return camelScorecardEngine.evaluateScorecard(metrics);
  }

  // --- Member Grievances & Ombudsman (M1) ---
  getGrievances(filters?: {
    status?: GrievanceStatus;
    tier?: number;
    priority?: GrievancePriority;
    complainantId?: string;
  }): GrievanceTicket[] {
    let list = Array.from(this.grievances.values());
    if (filters?.status) list = list.filter((g) => g.status === filters.status);
    if (filters?.tier) list = list.filter((g) => g.currentTier === filters.tier);
    if (filters?.priority) list = list.filter((g) => g.priority === filters.priority);
    if (filters?.complainantId) list = list.filter((g) => g.complainantId === filters.complainantId);
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  createGrievance(
    data: Omit<
      GrievanceTicket,
      | 'id'
      | 'ticketNumber'
      | 'status'
      | 'currentTier'
      | 'escalationDeadline'
      | 'slaHoursRemaining'
      | 'slaBreached'
      | 'createdAt'
      | 'updatedAt'
      | 'priority'
    > & { priority?: GrievancePriority }
  ): GrievanceTicket {
    const id = `grv-${randomUUID()}`;
    const ticketNumber = `GRV-${new Date().getFullYear()}-T1-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date();
    const escalationDeadline = new Date(now.getTime() + 48 * 3600000).toISOString(); // 48h SLA

    const ticket: GrievanceTicket = {
      ...data,
      id,
      ticketNumber,
      priority: data.priority || 'MEDIUM',
      status: 'LODGED',
      currentTier: 1,
      escalationDeadline,
      slaHoursRemaining: 48,
      slaBreached: false,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    this.grievances.set(id, ticket);
    this.appendGrievanceLog(id, 'TICKET_LODGED', 'system', 'Grievance ticket lodged at Tier 1 (Society Level)');
    this.saveToDisk();
    return ticket;
  }

  escalateGrievance(id: string, reason?: string): GrievanceTicket {
    const ticket = this.grievances.get(id);
    if (!ticket) throw new Error(`Grievance ticket ${id} not found`);
    if (ticket.status === 'RESOLVED') throw new Error('Cannot escalate an already resolved grievance ticket');

    const nextTier = Math.min(4, ticket.currentTier + 1) as 1 | 2 | 3 | 4;
    const slaHoursMap: Record<number, number> = { 2: 7 * 24, 3: 15 * 24, 4: 30 * 24 };
    const slaHours = slaHoursMap[nextTier] || 48;
    const now = new Date();

    ticket.currentTier = nextTier;
    ticket.status = nextTier === 4 ? 'ESCALATED_MINISTERIAL' : 'UNDER_INVESTIGATION';
    ticket.escalationDeadline = new Date(now.getTime() + slaHours * 3600000).toISOString();
    ticket.slaHoursRemaining = slaHours;
    ticket.slaBreached = false;
    ticket.updatedAt = now.toISOString();

    this.grievances.set(id, ticket);
    this.appendGrievanceLog(
      id,
      'TIER_ESCALATED',
      'system',
      `Escalated to Tier ${nextTier}. Reason: ${reason || 'SLA escalation trigger'}`
    );
    this.saveToDisk();
    return ticket;
  }

  resolveGrievance(id: string, summary: string): GrievanceTicket {
    const ticket = this.grievances.get(id);
    if (!ticket) throw new Error(`Grievance ticket ${id} not found`);

    const now = new Date().toISOString();
    ticket.status = 'RESOLVED';
    ticket.resolutionSummary = summary;
    ticket.updatedAt = now;

    this.grievances.set(id, ticket);
    this.appendGrievanceLog(id, 'RESOLUTION_ISSUED', 'system', `Resolved: ${summary}`);
    this.saveToDisk();
    return ticket;
  }

  private appendGrievanceLog(
    ticketId: string,
    action: GrievanceActionLog['action'],
    actorId: string,
    notes: string
  ): void {
    const existing = this.grievanceLogs.get(ticketId) || [];
    existing.push({
      id: `gl-${randomUUID()}`,
      ticketId,
      actorId,
      actorName: actorId === 'system' ? 'Sahakar Ombudsman System' : actorId,
      action,
      notes,
      timestamp: new Date().toISOString(),
    });
    this.grievanceLogs.set(ticketId, existing);
  }

  // --- 100-Point Candidate Matcher & Career Pathway (M1) ---
  matchCandidate100Pt(traineeId: string, jobId?: string): CandidateMatch100Pt {
    const targetJob = jobId ? this.getJob(jobId) : this.listJobs(true)[0];
    if (!targetJob) throw new Error('No job opportunity found for matching');
    return new CandidateMatcherEngine(this).matchCandidate100Pt(traineeId, targetJob.id);
  }

  getCareerPathway(traineeId: string): TraineeCareerPathway {
    return new CandidateMatcherEngine(this).generateCareerPathway(traineeId);
  }

  // ==========================================
  // NCCT Milestone 1 Training Default Seeds
  // ==========================================

  public getDefaultTrainingInstitutes(): TrainingInstitute[] {
    return [
      {
        id: '22222222-2222-2222-2222-222222222222',
        code: 'VAMNICOM-PUN',
        name: 'Vaikunth Mehta National Institute of Cooperative Management (VAMNICOM)',
        tier: 'APEX',
        state: 'Maharashtra',
        city: 'Pune',
        directorName: 'Dr. Hema Yadav',
        email: 'director@vamnicom.gov.in',
        contactNumber: '+91-20-25701000',
        hostelCapacity: 120,
        active: true,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
      {
        id: '11111111-1111-1111-1111-111111111115',
        code: 'RICM-BEN',
        name: 'Regional Institute of Cooperative Management (RICM), Bengaluru',
        tier: 'RICM',
        state: 'Karnataka',
        city: 'Bengaluru',
        directorName: 'Dr. K. Ravichandran',
        email: 'director@ricmbengaluru.gov.in',
        contactNumber: '+91-80-26561500',
        hostelCapacity: 80,
        active: true,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
      {
        id: '11111111-1111-1111-1111-111111111112',
        code: 'RICM-GAN',
        name: 'Regional Institute of Cooperative Management (RICM), Gandhinagar',
        tier: 'RICM',
        state: 'Gujarat',
        city: 'Gandhinagar',
        directorName: 'Dr. P. K. Swain',
        email: 'director@ricmgandhinagar.gov.in',
        contactNumber: '+91-79-23222300',
        hostelCapacity: 75,
        active: true,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
      {
        id: '11111111-1111-1111-1111-111111111111',
        code: 'RICM-BHO',
        name: 'Regional Institute of Cooperative Management (RICM), Bhopal',
        tier: 'RICM',
        state: 'Madhya Pradesh',
        city: 'Bhopal',
        directorName: 'Dr. Meena Saxena',
        email: 'director@ricm-bhopal.gov.in',
        contactNumber: '+91-755-2771200',
        hostelCapacity: 90,
        active: true,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
      {
        id: '33333333-3333-3333-3333-333333333301',
        code: 'ICM-LUC',
        name: 'Institute of Cooperative Management (ICM), Lucknow',
        tier: 'ICM',
        state: 'Uttar Pradesh',
        city: 'Lucknow',
        directorName: 'Dr. A. K. Asthana',
        email: 'director@icmlucknow.gov.in',
        contactNumber: '+91-522-2771400',
        hostelCapacity: 60,
        active: true,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    ];
  }

  public getDefaultTrainingProgrammes(): TrainingProgramme[] {
    return [
      {
        id: 'prog-atp-2026-pacs-01',
        instituteId: '11111111-1111-1111-1111-111111111111',
        instituteName: 'Regional Institute of Cooperative Management (RICM), Bhopal',
        title: 'Annual Training Programme: PACS Computerization, ERP Onboarding & Statutory Auditing',
        code: 'ATP-2026-PACS-01',
        atpYear: '2026-2027',
        targetSector: 'Primary Agricultural Credit Societies (PACS)',
        deliveryMode: 'HYBRID',
        capacity: 35,
        approvedCount: 2,
        startDate: '2026-09-01',
        endDate: '2026-10-31',
        coordinatingFacultyId: 'cccc3333-3333-3333-3333-333333333333',
        coordinatingFacultyName: 'Prof. Ramesh Sharma',
        status: 'ACTIVE',
        createdAt: '2026-08-01T00:00:00Z',
        updatedAt: '2026-08-01T00:00:00Z',
      },
      {
        id: 'prog-atp-2026-dairy-02',
        instituteId: '22222222-2222-2222-2222-222222222222',
        instituteName: 'Vaikunth Mehta National Institute of Cooperative Management (VAMNICOM)',
        title: 'Advanced Cooperative Dairy Management & Cold-Chain Logistics',
        code: 'ATP-2026-DAIRY-02',
        atpYear: '2026-2027',
        targetSector: 'Dairy Cooperative Societies & State Federations',
        deliveryMode: 'OFFLINE',
        capacity: 30,
        approvedCount: 0,
        startDate: '2026-09-15',
        endDate: '2026-10-15',
        coordinatingFacultyId: 'cccc3333-3333-3333-3333-333333333333',
        coordinatingFacultyName: 'Prof. Ramesh Sharma',
        status: 'ACTIVE',
        createdAt: '2026-08-01T00:00:00Z',
        updatedAt: '2026-08-01T00:00:00Z',
      },
    ];
  }

  public getDefaultCampusHostelRooms(): CampusHostelRoom[] {
    return [
      {
        id: 'room-bho-a101',
        instituteId: '11111111-1111-1111-1111-111111111111',
        hostelBlock: 'Sardar Patel Block A (Female Wing)',
        roomNumber: 'A-101',
        roomType: 'DOUBLE',
        bedCapacity: 2,
        occupiedBeds: 1,
        floor: 1,
        active: true,
      },
      {
        id: 'room-bho-a102',
        instituteId: '11111111-1111-1111-1111-111111111111',
        hostelBlock: 'Sardar Patel Block A (Female Wing)',
        roomNumber: 'A-102',
        roomType: 'SINGLE',
        bedCapacity: 1,
        occupiedBeds: 0,
        floor: 1,
        active: true,
      },
      {
        id: 'room-bho-b201',
        instituteId: '11111111-1111-1111-1111-111111111111',
        hostelBlock: 'Sardar Patel Block B (Male Wing)',
        roomNumber: 'B-201',
        roomType: 'DOUBLE',
        bedCapacity: 2,
        occupiedBeds: 1,
        floor: 2,
        active: true,
      },
      {
        id: 'room-bho-b202',
        instituteId: '11111111-1111-1111-1111-111111111111',
        hostelBlock: 'Sardar Patel Block B (Male Wing)',
        roomNumber: 'B-202',
        roomType: 'SINGLE',
        bedCapacity: 1,
        occupiedBeds: 0,
        floor: 2,
        active: true,
      },
    ];
  }

  public getDefaultTraineeNominations(): TraineeNomination[] {
    return [
      {
        id: 'nom-2026-001',
        programmeId: 'prog-atp-2026-pacs-01',
        programmeTitle: 'Annual Training Programme: PACS Computerization, ERP Onboarding & Statutory Auditing',
        traineeId: 'dddd4444-4444-4444-4444-444444444441',
        fullName: 'Anita Patel',
        phone: '+91-9876543210',
        email: 'anita.patel@mp-coop.gov.in',
        cooperativeAffiliation: 'Bilkisganj PACS, Sehore (MP)',
        designation: 'Assistant Secretary',
        state: 'Madhya Pradesh',
        status: 'APPROVED',
        nominatedAt: '2026-08-20T10:00:00Z',
        decidedAt: '2026-08-22T14:30:00Z',
        decidedBy: 'director@ricm-bhopal.gov.in',
        hostelRoomId: 'room-bho-a101',
        hostelBlock: 'Sardar Patel Block A (Female Wing)',
        hostelRoomNumber: 'A-101',
      },
      {
        id: 'nom-2026-002',
        programmeId: 'prog-atp-2026-pacs-01',
        programmeTitle: 'Annual Training Programme: PACS Computerization, ERP Onboarding & Statutory Auditing',
        traineeId: 'dddd4444-4444-4444-4444-444444444442',
        fullName: 'Vikram Singh',
        phone: '+91-9876543211',
        email: 'vikram.singh@gj-coop.gov.in',
        cooperativeAffiliation: 'Khedut Sahakari Mandali, Anand (GJ)',
        designation: 'Society Accountant',
        state: 'Gujarat',
        status: 'APPROVED',
        nominatedAt: '2026-08-21T11:00:00Z',
        decidedAt: '2026-08-22T14:35:00Z',
        decidedBy: 'director@ricm-bhopal.gov.in',
        hostelRoomId: 'room-bho-b201',
        hostelBlock: 'Sardar Patel Block B (Male Wing)',
        hostelRoomNumber: 'B-201',
      },
      {
        id: 'nom-2026-003',
        programmeId: 'prog-atp-2026-pacs-01',
        programmeTitle: 'Annual Training Programme: PACS Computerization, ERP Onboarding & Statutory Auditing',
        traineeId: 'dddd4444-4444-4444-4444-444444444443',
        fullName: 'Sunita Devi',
        phone: '+91-9876543212',
        email: 'sunita.devi@up-coop.gov.in',
        cooperativeAffiliation: 'Barabanki Kisan Sewa Samiti (UP)',
        designation: 'Managing Committee Member',
        state: 'Uttar Pradesh',
        status: 'WAITLISTED',
        nominatedAt: '2026-08-22T09:00:00Z',
        decidedAt: '2026-08-23T10:00:00Z',
        decidedBy: 'director@ricm-bhopal.gov.in',
      },
    ];
  }

  public getDefaultTimetableSessions(): TimetableSession[] {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    return [
      {
        id: 'sess-pacs-101',
        programmeId: 'prog-atp-2026-pacs-01',
        courseId: 'cccc1111-1111-1111-1111-111111111111',
        courseTitle: 'PACS Computerization & Governance',
        title: 'Double-Entry Daybook Ledger & Cash Voucher Posting',
        facultyId: 'cccc3333-3333-3333-3333-333333333333',
        facultyName: 'Prof. Ramesh Sharma',
        sessionDate: today,
        startTime: '09:30',
        endTime: '12:30',
        startsAt: new Date(Date.now() - 1800000).toISOString(),
        endsAt: new Date(Date.now() + 7200000).toISOString(),
        venue: 'Computer Lab 1 (Sahakar Edge Node)',
        checkInCode: '482910',
        status: 'ACTIVE',
        createdAt: '2026-08-20T00:00:00Z',
      },
      {
        id: 'sess-pacs-102',
        programmeId: 'prog-atp-2026-pacs-01',
        courseId: 'cccc1111-1111-1111-1111-111111111111',
        courseTitle: 'PACS Computerization & Governance',
        title: 'Trial Balance Reconciliation & Statutory Audit Schedules',
        facultyId: 'cccc3333-3333-3333-3333-333333333333',
        facultyName: 'Prof. Ramesh Sharma',
        sessionDate: tomorrow,
        startTime: '10:00',
        endTime: '13:00',
        startsAt: `${tomorrow}T10:00:00Z`,
        endsAt: `${tomorrow}T13:00:00Z`,
        venue: 'Seminar Hall 2',
        checkInCode: '739104',
        status: 'UPCOMING',
        createdAt: '2026-08-20T00:00:00Z',
      },
    ];
  }

  public getDefaultCourseModuleTests(): CourseModuleTest[] {
    return [
      {
        id: 'test-quiz-pacs-01',
        courseId: 'cccc1111-1111-1111-1111-111111111111',
        title: 'Daybook Posting Practice Quiz (Formative)',
        type: 'FORMATIVE_QUIZ',
        totalMarks: 20,
        passMarks: 10,
        maxAttempts: 0,
        questionCount: 2,
        questions: [
          {
            id: 'q-form-01',
            questionText: 'Which entry is made when a farmer deposits ₹5,000 cash into their PACS savings account?',
            options: [
              { id: 'opt-1', text: 'Debit Cash Account, Credit Member Savings Account' },
              { id: 'opt-2', text: 'Debit Member Savings Account, Credit Cash Account' },
              { id: 'opt-3', text: 'Debit Share Capital, Credit Cash Account' },
              { id: 'opt-4', text: 'Debit Profit & Loss, Credit Reserve Fund' },
            ],
            correctOptionId: 'opt-1',
            marks: 10,
            explanation: 'Cash is an asset coming in (Debit), while member savings liability increases (Credit).',
          },
          {
            id: 'q-form-02',
            questionText: 'In single-entry bookkeeping converted to double-entry, what is the purpose of the Daybook?',
            options: [
              { id: 'opt-1', text: 'To record chronological daily financial receipts and disbursements' },
              { id: 'opt-2', text: 'To calculate annual income tax liability' },
              { id: 'opt-3', text: 'To list member land records' },
            ],
            correctOptionId: 'opt-1',
            marks: 10,
            explanation: 'The Daybook records all daily transactions chronologically prior to ledger posting.',
          },
        ],
        createdAt: '2026-08-01T00:00:00Z',
      },
      {
        id: 'test-exam-pacs-01',
        courseId: 'cccc1111-1111-1111-1111-111111111111',
        title: 'Statutory PACS Computerization & Financial Control Exam (Summative)',
        type: 'SUMMATIVE_TEST',
        totalMarks: 100,
        passMarks: 60,
        maxAttempts: 2,
        questionCount: 2,
        questions: [
          {
            id: 'q-summ-01',
            questionText: 'Under the Centrally Sponsored PACS Computerization Guidelines, how often must the General Ledger balance match the Daybook?',
            options: [
              { id: 'opt-1', text: 'Daily at Day-End Closing' },
              { id: 'opt-2', text: 'Weekly on Saturday' },
              { id: 'opt-3', text: 'Monthly before AGM' },
              { id: 'opt-4', text: 'Annually during Statutory Audit' },
            ],
            correctOptionId: 'opt-1',
            marks: 50,
          },
          {
            id: 'q-summ-02',
            questionText: 'What is the maximum interest subvention rate under the Agriculture Infrastructure Fund (AIF) for PACS projects up to ₹2 Crore?',
            options: [
              { id: 'opt-1', text: '3.0% per annum' },
              { id: 'opt-2', text: '1.5% per annum' },
              { id: 'opt-3', text: '5.0% per annum' },
              { id: 'opt-4', text: '0% (Capital subsidy only)' },
            ],
            correctOptionId: 'opt-1',
            marks: 50,
          },
        ],
        createdAt: '2026-08-01T00:00:00Z',
      },
    ];
  }

  public getDefaultTraineeNfcProfiles(): TraineePublicNfcProfile[] {
    return [
      {
        traineeId: 'dddd4444-4444-4444-4444-444444444441',
        publicProfileCode: 'NCCT-AP-9941',
        publicUrl: '/?profile=NCCT-AP-9941',
        enabled: true,
        fullName: 'Anita Patel',
        cooperativeAffiliation: 'Bilkisganj PACS, Sehore (MP)',
        certifiedCoursesCount: 1,
        primarySkills: [
          'PACS Double-Entry Accounting',
          'Daybook & Cash Voucher Posting',
          'KCC Loan Disbursement Verification',
        ],
        issuedCertificates: [
          {
            code: 'EDU-NCCT-2026-9501',
            title: 'Comprehensive Certificate in PACS Digital Accounting & Cooperative Governance',
            issuedDate: '2026-10-25',
            verifiableUrl: '/api/v1/credentials/EDU-NCCT-2026-9501',
          },
        ],
        updatedAt: '2026-10-25T12:00:00Z',
      },
    ];
  }

  // ==========================================
  // NCCT Milestone 1 Training Domain Methods
  // ==========================================

  // --- 1. Institutes ---
  public listTrainingInstitutes(tier?: string): TrainingInstitute[] {
    const list = Array.from(this.trainingInstitutes.values());
    if (tier) {
      return list.filter((i) => i.tier === tier);
    }
    return list;
  }

  public getTrainingInstitute(id: string): TrainingInstitute | undefined {
    if (this.trainingInstitutes.has(id)) {
      return this.trainingInstitutes.get(id);
    }
    const cleanId = id.toLowerCase();
    return Array.from(this.trainingInstitutes.values()).find(
      (i) =>
        i.code.toLowerCase() === cleanId ||
        i.code.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanId.replace(/[^a-z0-9]/g, '') ||
        i.name.toLowerCase().includes(cleanId)
    );
  }

  public getHostelInventorySummary(instituteId: string): {
    totalRooms: number;
    bedCapacity: number;
    occupiedBeds: number;
    vacantBeds: number;
  } {
    const inst = this.getTrainingInstitute(instituteId);
    const targetId = inst ? inst.id : instituteId;
    const rooms = Array.from(this.campusHostelRooms.values()).filter(
      (r) => r.instituteId === targetId
    );
    const totalRooms = rooms.length;
    const bedCapacity = rooms.reduce((sum, r) => sum + r.bedCapacity, 0);
    const occupiedBeds = rooms.reduce((sum, r) => sum + r.occupiedBeds, 0);
    const vacantBeds = Math.max(0, bedCapacity - occupiedBeds);

    return { totalRooms, bedCapacity, occupiedBeds, vacantBeds };
  }

  // --- 2. Programmes ---
  public listTrainingProgrammes(instituteId?: string): Array<
    TrainingProgramme & { approvedCount: number; capacityUtilizationPercent: number }
  > {
    let progs = Array.from(this.trainingProgrammes.values());
    if (instituteId) {
      progs = progs.filter((p) => p.instituteId === instituteId);
    }
    return progs.map((p) => {
      const approved = Array.from(this.traineeNominations.values()).filter(
        (n) => n.programmeId === p.id && n.status === 'APPROVED'
      ).length;
      const capacityUtilizationPercent =
        p.capacity > 0 ? Math.round((approved / p.capacity) * 10000) / 100 : 0;
      return {
        ...p,
        approvedCount: approved,
        capacityUtilizationPercent,
      };
    });
  }

  public getTrainingProgramme(id: string): TrainingProgramme | undefined {
    return this.trainingProgrammes.get(id);
  }

  public createTrainingProgramme(data: Omit<TrainingProgramme, 'id' | 'approvedCount' | 'createdAt' | 'updatedAt' | 'status'> & { status?: TrainingProgramme['status'] }): TrainingProgramme {
    const id = `prog-${randomUUID()}`;
    const now = new Date().toISOString();
    const programme: TrainingProgramme = {
      ...data,
      id,
      approvedCount: 0,
      status: data.status || 'SCHEDULED',
      createdAt: now,
      updatedAt: now,
    };
    this.trainingProgrammes.set(id, programme);
    this.saveToDisk();
    return programme;
  }

  // --- 3. Nominations ---
  public listTraineeNominations(programmeId?: string, status?: string): TraineeNomination[] {
    let noms = Array.from(this.traineeNominations.values());
    if (programmeId) {
      noms = noms.filter((n) => n.programmeId === programmeId);
    }
    if (status) {
      noms = noms.filter((n) => n.status === status);
    }
    return noms;
  }

  public getTraineeNomination(id: string): TraineeNomination | undefined {
    return this.traineeNominations.get(id);
  }

  public createTraineeNomination(data: Omit<TraineeNomination, 'id' | 'status' | 'nominatedAt'>): TraineeNomination {
    const id = `nom-${randomUUID()}`;
    const now = new Date().toISOString();
    const nomination: TraineeNomination = {
      ...data,
      id,
      status: 'PENDING',
      nominatedAt: now,
    };
    this.traineeNominations.set(id, nomination);
    this.saveToDisk();
    return nomination;
  }

  public decideTraineeNomination(
    id: string,
    action: 'APPROVE' | 'WAITLIST' | 'REJECT' | 'APPROVED' | 'WAITLISTED' | 'REJECTED',
    decidedBy: string,
    rejectionReason?: string,
    hostelRoomId?: string
  ): { success: boolean; nomination: TraineeNomination; error?: string } {
    const nom = this.traineeNominations.get(id);
    if (!nom) throw new Error(`Nomination ${id} not found`);

    const prog = this.trainingProgrammes.get(nom.programmeId);
    if (!prog) throw new Error(`Programme ${nom.programmeId} not found`);

    const normalizedAction: 'APPROVE' | 'WAITLIST' | 'REJECT' =
      action === 'APPROVED' ? 'APPROVE' : action === 'WAITLISTED' ? 'WAITLIST' : action === 'REJECTED' ? 'REJECT' : action;

    const currentApprovedCount = Array.from(this.traineeNominations.values()).filter(
      (n) => n.programmeId === nom.programmeId && n.status === 'APPROVED' && n.id !== nom.id
    ).length;

    // Check hostel room if provided
    let targetRoom: CampusHostelRoom | undefined;
    if (hostelRoomId) {
      targetRoom = this.campusHostelRooms.get(hostelRoomId);
      if (!targetRoom) {
        return { success: false, nomination: nom, error: `Hostel room ${hostelRoomId} not found` };
      }
      if (targetRoom.occupiedBeds >= targetRoom.bedCapacity) {
        return { success: false, nomination: nom, error: `Hostel room ${targetRoom.roomNumber} has no vacant beds (${targetRoom.occupiedBeds}/${targetRoom.bedCapacity})` };
      }
    }

    const decisionResult = atpLifecycleEngine.decideNomination({
      programme: prog,
      nomination: nom,
      action: normalizedAction,
      currentApprovedCount,
      decidedBy,
      rejectionReason,
      hostelRoomId,
    });

    if (!decisionResult.success) {
      this.traineeNominations.set(id, decisionResult.nomination);
      this.saveToDisk();
      return { success: false, nomination: decisionResult.nomination, error: decisionResult.diagnosticMessage };
    }

    // If approved and room allocated
    if (normalizedAction === 'APPROVE' && targetRoom) {
      targetRoom.occupiedBeds = Math.min(targetRoom.bedCapacity, targetRoom.occupiedBeds + 1);
      this.campusHostelRooms.set(targetRoom.id, targetRoom);

      const allocation: HostelAllocationRecord = {
        id: `allot-${prog.id}-${nom.traineeId}`,
        nominationId: nom.id,
        traineeId: nom.traineeId,
        traineeName: nom.fullName,
        programmeId: prog.id,
        programmeTitle: prog.title,
        roomId: targetRoom.id,
        hostelBlock: targetRoom.hostelBlock,
        roomNumber: targetRoom.roomNumber,
        roomType: targetRoom.roomType,
        checkInDate: prog.startDate,
        checkOutDate: prog.endDate,
        allocatedAt: new Date().toISOString(),
        allocatedBy: decidedBy,
      };
      this.hostelAllocations.set(allocation.id, allocation);
      decisionResult.nomination.hostelBlock = targetRoom.hostelBlock;
      decisionResult.nomination.hostelRoomNumber = targetRoom.roomNumber;
    }

    this.traineeNominations.set(id, decisionResult.nomination);
    this.saveToDisk();
    return { success: true, nomination: decisionResult.nomination };
  }

  // --- 4. Timetable & Dynamic Attendance ---
  public listTimetableSessions(programmeId?: string): TimetableSession[] {
    let sessions = Array.from(this.timetableSessions.values());
    if (programmeId) {
      sessions = sessions.filter((s) => s.programmeId === programmeId);
    }
    return sessions;
  }

  public getTimetableSession(id: string): TimetableSession | undefined {
    return this.timetableSessions.get(id);
  }

  public getActiveTimetableSession(programmeId?: string): TimetableSession | null {
    const sessions = this.listTimetableSessions(programmeId);
    return sessions.find((s) => s.status === 'ACTIVE') || sessions[0] || null;
  }

  public createTimetableSession(
    data: Omit<TimetableSession, 'id' | 'checkInCode' | 'status' | 'createdAt'> & { checkInCode?: string }
  ): TimetableSession {
    const id = `sess-${randomUUID()}`;
    const activeSessions = Array.from(this.timetableSessions.values());
    const checkInCode = data.checkInCode || dynamicAttendanceEngine.generateUniqueCheckInCode(activeSessions, id);
    const now = new Date().toISOString();

    const session: TimetableSession = {
      ...data,
      id,
      checkInCode,
      status: 'UPCOMING',
      createdAt: now,
    };
    this.timetableSessions.set(id, session);
    this.saveToDisk();
    return session;
  }

  public regenerateSessionCheckInCode(sessionId: string): string {
    const session = this.timetableSessions.get(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    const activeSessions = Array.from(this.timetableSessions.values());
    const newCode = dynamicAttendanceEngine.generateUniqueCheckInCode(activeSessions, sessionId);
    session.checkInCode = newCode;
    this.timetableSessions.set(sessionId, session);
    this.saveToDisk();
    return newCode;
  }

  public listSessionAttendanceRecords(sessionId?: string, traineeId?: string): SessionAttendanceRecord[] {
    let records = Array.from(this.sessionAttendanceRecords.values());
    if (sessionId) {
      records = records.filter((r) => r.sessionId === sessionId);
    }
    if (traineeId) {
      records = records.filter((r) => r.traineeId === traineeId);
    }
    return records;
  }

  public recordSessionAttendance(params: {
    sessionId: string;
    traineeId: string;
    verificationMethod?: any;
    submittedCode?: string;
    qrToken?: string;
    facultyId?: string;
  }): { success: boolean; record?: SessionAttendanceRecord; status: number; error?: string; message?: string } {
    const session = this.timetableSessions.get(params.sessionId);
    if (!session) {
      return { success: false, status: 404, error: 'SESSION_NOT_FOUND', message: 'Timetable session not found' };
    }

    const nomination = Array.from(this.traineeNominations.values()).find(
      (n) => n.programmeId === session.programmeId && n.traineeId === params.traineeId
    );

    const isApproved = Boolean(nomination && nomination.status === 'APPROVED');
    const existingRecords = this.listSessionAttendanceRecords(session.id);

    const validation = dynamicAttendanceEngine.validateCheckInEligibility({
      session,
      traineeId: params.traineeId,
      isApproved,
      existingAttendanceRecords: existingRecords,
    });

    if (!validation.allowed) {
      const errorMap: Record<string, string> = {
        NOT_APPROVED: 'NOT_APPROVED_NOMINEE',
        PREMATURE_CHECKIN: 'EARLY_CHECK_IN_BLOCKED',
        SESSION_CONCLUDED: 'SESSION_CONCLUDED',
        ALREADY_CHECKED_IN: 'ALREADY_CHECKED_IN',
      };
      return {
        success: false,
        status: 400,
        error: errorMap[validation.rejectionCode || ''] || 'CHECK_IN_REJECTED',
        message: validation.rejectionReason || 'Check-in validation failed',
      };
    }

    const traineeName = nomination?.fullName || 'Trainee';
    const method = params.verificationMethod || 'DYNAMIC_CODE';

    const processResult = dynamicAttendanceEngine.processCheckIn({
      session,
      traineeId: params.traineeId,
      traineeName,
      method,
      submittedCode: params.submittedCode,
      qrToken: params.qrToken,
      facultyId: params.facultyId,
    });

    if (!processResult.success || !processResult.record) {
      return {
        success: false,
        status: 400,
        error: 'INVALID_CHECK_IN_CODE',
        message: processResult.errorReason || 'Attendance check-in failed',
      };
    }

    this.sessionAttendanceRecords.set(processResult.record.id, processResult.record);
    this.saveToDisk();
    return { success: true, status: 201, record: processResult.record };
  }

  public updateFacultyManualAttendance(
    sessionId: string,
    traineeId: string,
    isPresent: boolean,
    markedBy: string
  ): SessionAttendanceRecord | null {
    const session = this.timetableSessions.get(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    const id = `att-${sessionId}-${traineeId}`;
    if (!isPresent) {
      this.sessionAttendanceRecords.delete(id);
      this.saveToDisk();
      return null;
    }

    const nomination = Array.from(this.traineeNominations.values()).find(
      (n) => n.programmeId === session.programmeId && n.traineeId === traineeId
    );
    const traineeName = nomination?.fullName || 'Trainee';

    const record: SessionAttendanceRecord = {
      id,
      sessionId,
      traineeId,
      traineeName,
      verificationMethod: 'FACULTY_MANUAL',
      markedAt: new Date().toISOString(),
      markedBy,
      verified: true,
    };
    this.sessionAttendanceRecords.set(id, record);
    this.saveToDisk();
    return record;
  }

  // --- 5. Continuous Evaluation & Gradebook ---
  public listCourseModuleTests(courseId?: string): CourseModuleTest[] {
    let tests = Array.from(this.courseModuleTests.values());
    if (courseId) {
      tests = tests.filter((t) => t.courseId === courseId);
    }
    return tests;
  }

  public getCourseModuleTest(id: string): CourseModuleTest | undefined {
    return this.courseModuleTests.get(id);
  }

  public createCourseModuleTest(data: Omit<CourseModuleTest, 'id' | 'createdAt'>): CourseModuleTest {
    const id = `test-${randomUUID()}`;
    const test: CourseModuleTest = {
      ...data,
      id,
      createdAt: new Date().toISOString(),
    };
    this.courseModuleTests.set(id, test);
    this.saveToDisk();
    return test;
  }

  public submitTestAttempt(
    testId: string,
    traineeId: string,
    answers: Record<string, string | number>
  ): {
    success: boolean;
    percentage: number;
    passed: boolean;
    marksObtained: number;
    totalMarks: number;
    message: string;
    explanations?: Record<string, string>;
  } {
    const test = this.courseModuleTests.get(testId);
    if (!test) throw new Error(`Test ${testId} not found`);

    const attempts = Array.from(this.assessmentAttempts.values()).filter(
      (a) => a.testId === testId && a.traineeId === traineeId
    );

    if (test.type === 'SUMMATIVE_TEST' && test.maxAttempts > 0 && attempts.length >= test.maxAttempts) {
      return {
        success: false,
        percentage: 0,
        passed: false,
        marksObtained: 0,
        totalMarks: test.totalMarks,
        message: `Maximum permitted test attempts reached (${attempts.length}/${test.maxAttempts}). Retakes are locked.`,
      };
    }

    let marks = 0;
    const explanations: Record<string, string> = {};

    if (test.questions && test.questions.length > 0) {
      for (const q of test.questions) {
        const given = String(answers[q.id] || answers[q.questionText] || '');
        if (given === q.correctOptionId) {
          marks += q.marks;
        }
        if (test.type === 'FORMATIVE_QUIZ' && q.explanation) {
          explanations[q.id] = q.explanation;
        }
      }
    } else {
      marks = Math.min(test.totalMarks, Object.keys(answers).length * 10);
    }

    const percentage = test.totalMarks > 0 ? Math.round((marks / test.totalMarks) * 10000) / 100 : 0;
    const passed = marks >= test.passMarks;

    const attempt: AssessmentAttempt = {
      id: `attempt-${randomUUID()}`,
      testId,
      traineeId,
      answers,
      marksObtained: marks,
      totalMarks: test.totalMarks,
      percentage,
      passed,
      submittedAt: new Date().toISOString(),
    };
    this.assessmentAttempts.set(attempt.id, attempt);
    this.saveToDisk();

    return {
      success: true,
      percentage,
      passed,
      marksObtained: marks,
      totalMarks: test.totalMarks,
      message: passed ? 'Assessment passed successfully!' : 'Assessment completed. Pass threshold not met.',
      explanations: test.type === 'FORMATIVE_QUIZ' ? explanations : undefined,
    };
  }

  public getTraineeMarksTally(courseId: string, traineeId: string): CourseMarksTally | null {
    const course = this.getCourse(courseId);
    const tests = this.listCourseModuleTests(courseId);
    const trainee = this.getUser(traineeId);
    const traineeName = trainee?.name || 'Trainee';

    const submissions: TraineeAssessmentSubmission[] = Array.from(this.assessmentAttempts.values())
      .filter((a) => a.traineeId === traineeId)
      .map((a) => ({
        id: a.id,
        testId: a.testId,
        traineeId: a.traineeId,
        marksObtained: a.marksObtained,
        totalMarks: a.totalMarks,
        submittedAt: a.submittedAt,
      }));

    const traineeProgress = this.getTraineeProgress(traineeId);
    const completedLessons = traineeProgress?.completedCount || 0;
    const totalLessons = this.lessons.size || 2;

    return gradebookEngine.computeTraineeMarksTally({
      traineeId,
      traineeName,
      courseId,
      courseTitle: course?.title || 'PACS Digital Accounting',
      tests,
      submissions,
      completedLessonsCount: completedLessons,
      totalLessonsCount: totalLessons,
    });
  }

  public getCourseGradebook(courseId: string, programmeId?: string): any {
    const course = this.getCourse(courseId);
    const tests = this.listCourseModuleTests(courseId);
    const nominations = this.listTraineeNominations(programmeId, 'APPROVED');

    const trainees = nominations.map((n) => {
      const p = this.getTraineeProgress(n.traineeId);
      return {
        id: n.traineeId,
        name: n.fullName,
        cooperativeAffiliation: n.cooperativeAffiliation,
        completedLessons: p?.completedCount ?? (n.traineeId.endsWith('1') ? 2 : 1),
      };
    });

    const submissions: TraineeAssessmentSubmission[] = Array.from(this.assessmentAttempts.values()).map((a) => ({
      id: a.id,
      testId: a.testId,
      traineeId: a.traineeId,
      marksObtained: a.marksObtained,
      totalMarks: a.totalMarks,
      submittedAt: a.submittedAt,
    }));

    return gradebookEngine.compileInstitutionalGradebook({
      courseId,
      courseTitle: course?.title || 'PACS Digital Accounting & Governance',
      instituteName: 'Regional Institute of Cooperative Management (RICM)',
      tests,
      trainees,
      submissions,
      totalLessonsCount: 2,
      programmeId,
    });
  }

  public exportCourseGradebook(
    courseId: string,
    format: string = 'XLSX',
    language: string = 'EN'
  ): { filename: string; contentType: string; data: string } {
    const gradebook = this.getCourseGradebook(courseId);
    const { summaryCsv, traineeMatrixCsv } = gradebookEngine.generateStatutoryExportCsv(gradebook);
    const combinedData = `\uFEFF${summaryCsv}\n\n${traineeMatrixCsv}`;

    return {
      filename: `ncct-gradebook-${courseId.substring(0, 8)}.${format.toLowerCase() === 'csv' ? 'csv' : 'xlsx'}`,
      contentType: 'text/csv; charset=utf-8',
      data: combinedData,
    };
  }

  // --- 6. Predictive Retention & Reach Analytics ---
  public getDropoutRiskAnalysis(programmeId?: string, instituteId?: string, tierFilter?: string): any {
    const nominations = this.listTraineeNominations(programmeId, 'APPROVED');
    const programme = programmeId ? this.getTrainingProgramme(programmeId) : undefined;

    const trainees = nominations.map((n) => {
      const isHighRiskCandidate = n.fullName.includes('Devi') || n.state === 'Uttar Pradesh';
      const completionRate = isHighRiskCandidate ? 0.15 : 0.85;
      const attendanceRate = isHighRiskCandidate ? 0.35 : 0.90;
      const daysSinceLastActivity = isHighRiskCandidate ? 18 : 2;
      const failedAssessmentsCount = isHighRiskCandidate ? 2 : 0;

      return {
        traineeId: n.traineeId,
        traineeName: n.fullName,
        completionRate,
        attendanceRate,
        daysSinceLastActivity,
        failedAssessmentsCount,
      };
    });

    const triage = dropoutRiskEngine.triageCohortRisk(programmeId || 'all-programmes', trainees);

    let flagged = triage.flaggedRoster;
    if (tierFilter) {
      flagged = flagged.filter((f) => f.riskTier === tierFilter);
    }

    return {
      programmeId: programmeId || 'all',
      programmeTitle: programme?.title || 'All Active ATP Batches',
      summary: {
        totalAssessed: triage.totalAssessed,
        high: triage.highRiskCount,
        medium: triage.mediumRiskCount,
        low: triage.lowRiskCount,
        highRiskPercentage: triage.highRiskPercentage,
      },
      flaggedRoster: flagged,
    };
  }

  public getGeographicReachMetrics(): any {
    const nominations = Array.from(this.traineeNominations.values()).filter((n) => n.status === 'APPROVED');
    const stateCounts: Record<string, number> = {};
    for (const nom of nominations) {
      stateCounts[nom.state] = (stateCounts[nom.state] || 0) + 1;
    }

    const programmes = Array.from(this.trainingProgrammes.values());
    const modeCounts: Record<string, number> = { ONLINE: 0, OFFLINE: 0, HYBRID: 0 };
    for (const p of programmes) {
      modeCounts[p.deliveryMode] = (modeCounts[p.deliveryMode] || 0) + 1;
    }

    return {
      totalTrained: nominations.length,
      byState: Object.entries(stateCounts).map(([state, count]) => ({ state, count })),
      byMode: modeCounts,
      totalInstitutes: this.trainingInstitutes.size,
      activeProgrammes: programmes.filter((p) => p.status === 'ACTIVE').length,
    };
  }

  public getSectorSkillShortageRadar(category?: string): SectorSkillShortageRow[] {
    const canonicalSkills: CooperativeSkillItem[] = [
      { id: 'skill-pacs-acc-01', code: 'PACS_ACC', name: 'PACS Double-Entry Accounting', category: 'FINANCIAL_ACCOUNTING' },
      { id: 'skill-cashbook-01', code: 'CASHBOOK', name: 'Cash Book Balancing & Vouchers', category: 'FINANCIAL_ACCOUNTING' },
      { id: 'skill-audit-pacs-01', code: 'AUDIT', name: 'Statutory Balance Sheet Audit', category: 'FINANCIAL_ACCOUNTING' },
      { id: 'skill-kcc-appraisal-01', code: 'KCC_APP', name: 'KCC Appraisal & Scale of Finance', category: 'CREDIT_KCC' },
      { id: 'skill-loan-recovery-01', code: 'RECOVERY', name: 'Cooperative Crop Loan Recovery', category: 'CREDIT_KCC' },
      { id: 'skill-dccb-portal-01', code: 'DCCB_PORTAL', name: 'DCCB Credit Banking Portal', category: 'CREDIT_KCC' },
      { id: 'skill-cold-chain-01', code: 'COLD_CHAIN', name: 'Cold Chain & Warehouse Storage', category: 'COMMODITY_STORAGE' },
      { id: 'skill-fertilizer-pos-01', code: 'FERTILIZER', name: 'Fertilizer POS & Inventory', category: 'COMMODITY_STORAGE' },
      { id: 'skill-mscs-compliance-01', code: 'MSCS_ACT', name: 'MSCS Act 2023 Statutory Compliance', category: 'STATUTORY_LEGAL' },
      { id: 'skill-bye-laws-01', code: 'BYELAWS', name: 'Model Bye-Laws & AGM Procedures', category: 'GOVERNANCE_MANAGEMENT' },
    ];

    const jobs = [
      { id: 'job-1', requiredSkillIds: ['skill-pacs-acc-01', 'skill-cashbook-01', 'skill-kcc-appraisal-01'] },
      { id: 'job-2', requiredSkillIds: ['skill-pacs-acc-01', 'skill-audit-pacs-01', 'skill-mscs-compliance-01'] },
      { id: 'job-3', requiredSkillIds: ['skill-cold-chain-01', 'skill-fertilizer-pos-01'] },
      { id: 'job-4', requiredSkillIds: ['skill-kcc-appraisal-01', 'skill-loan-recovery-01', 'skill-dccb-portal-01'] },
    ];

    const certifiedTrainees = [
      { traineeId: 'dddd4444-4444-4444-4444-444444444441', certifiedSkillIds: ['skill-pacs-acc-01', 'skill-cashbook-01'] },
      { traineeId: 'dddd4444-4444-4444-4444-444444444442', certifiedSkillIds: ['skill-pacs-acc-01'] },
    ];

    let radar = skillGapEngine.computeSectorShortageRadar({
      skillsCatalog: canonicalSkills,
      jobs,
      certifiedTrainees,
    });

    if (category) {
      radar = radar.filter((r) => r.category === category);
    }
    return radar;
  }

  // --- 7. Hostel Logistics & Sovereign NFC Profile ---
  public listCampusHostelRooms(instituteId?: string): CampusHostelRoom[] {
    let rooms = Array.from(this.campusHostelRooms.values());
    if (instituteId) {
      rooms = rooms.filter((r) => r.instituteId === instituteId);
    }
    return rooms;
  }

  public getCampusHostelRoom(id: string): CampusHostelRoom | undefined {
    return this.campusHostelRooms.get(id);
  }

  public createCampusHostelRoom(data: Omit<CampusHostelRoom, 'id' | 'occupiedBeds' | 'active'>): CampusHostelRoom {
    const id = `room-${randomUUID()}`;
    const room: CampusHostelRoom = {
      ...data,
      id,
      occupiedBeds: 0,
      active: true,
    };
    this.campusHostelRooms.set(id, room);
    this.saveToDisk();
    return room;
  }

  public getTraineeHostelRoomCard(traineeId: string): any {
    const allocation = Array.from(this.hostelAllocations.values()).find(
      (a) => a.traineeId === traineeId
    );
    if (!allocation) {
      const nom = Array.from(this.traineeNominations.values()).find(
        (n) => n.traineeId === traineeId && n.status === 'APPROVED' && n.hostelRoomId
      );
      if (nom && nom.hostelRoomId) {
        const room = this.campusHostelRooms.get(nom.hostelRoomId);
        return {
          traineeId,
          traineeName: nom.fullName,
          programmeId: nom.programmeId,
          programmeTitle: nom.programmeTitle,
          hostelBlock: nom.hostelBlock || room?.hostelBlock || 'Hostel Block',
          roomNumber: nom.hostelRoomNumber || room?.roomNumber || 'A-101',
          roomType: room?.roomType || 'DOUBLE_OCCUPANCY',
          checkInDate: '2026-09-01',
          checkOutDate: '2026-09-14',
          floor: room?.floor || 1,
          allocatedAt: nom.decidedAt || nom.nominatedAt,
        };
      }
      return null;
    }

    const room = this.campusHostelRooms.get(allocation.roomId);
    return {
      traineeId,
      traineeName: allocation.traineeName,
      programmeId: allocation.programmeId,
      programmeTitle: allocation.programmeTitle,
      hostelBlock: allocation.hostelBlock,
      roomNumber: allocation.roomNumber,
      roomType: allocation.roomType,
      checkInDate: allocation.checkInDate,
      checkOutDate: allocation.checkOutDate,
      floor: room?.floor,
      allocatedAt: allocation.allocatedAt,
    };
  }

  public getTraineeNfcProfile(traineeId: string): TraineePublicNfcProfile | null {
    return (
      Array.from(this.traineeNfcProfiles.values()).find((p) => p.traineeId === traineeId) || null
    );
  }

  public rotateTraineeNfcProfile(traineeId: string): TraineePublicNfcProfile | null {
    const existing = this.getTraineeNfcProfile(traineeId);
    if (!existing) return null;

    const oldCode = existing.publicProfileCode;
    this.traineeNfcProfiles.delete(oldCode);

    const rotated = hostelLogisticsEngine.createOrRotateNfcProfile({
      traineeId,
      fullName: existing.fullName,
      cooperativeAffiliation: existing.cooperativeAffiliation,
      enabled: existing.enabled,
      primarySkills: existing.primarySkills,
      issuedCertificates: existing.issuedCertificates,
    });

    this.traineeNfcProfiles.set(rotated.publicProfileCode, rotated);
    this.saveToDisk();
    return rotated;
  }

  public toggleTraineeNfcProfile(
    traineeId: string,
    enabled: boolean,
    rotateCode: boolean = false
  ): TraineePublicNfcProfile | null {
    let profile = this.getTraineeNfcProfile(traineeId);
    if (!profile) {
      const user = this.getUser(traineeId);
      profile = hostelLogisticsEngine.createOrRotateNfcProfile({
        traineeId,
        fullName: user?.name || 'Trainee',
        cooperativeAffiliation: 'National Council for Cooperative Training (NCCT)',
        enabled,
        primarySkills: ['Cooperative Governance', 'PACS Operations'],
        issuedCertificates: [],
      });
      this.traineeNfcProfiles.set(profile.publicProfileCode, profile);
      this.saveToDisk();
      return profile;
    }

    if (rotateCode) {
      return this.rotateTraineeNfcProfile(traineeId);
    }

    profile.enabled = enabled;
    profile.updatedAt = new Date().toISOString();
    this.traineeNfcProfiles.set(profile.publicProfileCode, profile);
    this.saveToDisk();
    return profile;
  }

  public resolvePublicNfcProfile(code: string): TraineePublicNfcProfile | null {
    const result = hostelLogisticsEngine.resolvePublicProfile(code, this.traineeNfcProfiles);
    if (!result.resolved || !result.profile) return null;
    return result.profile;
  }
}

// Global singleton instance for Central API
export const centralStore = new CentralMemoryStore();


import {
  UserRole,
  User,
  Institute,
  Programme,
  ProgrammeStatus,
  Batch,
  TrainingSession,
  Course,
  Module,
  Lesson,
  Assessment,
  Question,
  Skill,
  JobOpportunity,
  Enrollment,
  EnrollmentStatus,
} from '@sahakar/types';

// ==========================================
// 1. Seed Institutes (NCCT Network)
// ==========================================

export const SEED_INSTITUTE_RICM_BHOPAL: Institute = {
  id: '11111111-1111-1111-1111-111111111111',
  name: 'Regional Institute of Cooperative Management (RICM), Bhopal',
  code: 'RICM-BHO',
  type: 'RICM',
  locationText: 'Bhopal, Madhya Pradesh',
  active: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

export const SEED_INSTITUTE_VAMNICOM: Institute = {
  id: '22222222-2222-2222-2222-222222222222',
  name: 'Vaikunth Mehta National Institute of Cooperative Management (VAMNICOM)',
  code: 'VAMNICOM-PUN',
  type: 'VAMNICOM',
  locationText: 'Pune, Maharashtra',
  active: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

export const SEED_INSTITUTES: Institute[] = [
  SEED_INSTITUTE_RICM_BHOPAL,
  SEED_INSTITUTE_VAMNICOM,
];

// ==========================================
// 2. Seed Users across all 5 RBAC Roles
// ==========================================

export const SEED_USERS: User[] = [
  {
    id: 'aaaa1111-1111-1111-1111-111111111111',
    name: 'Shri Rajesh Verma (Central Director)',
    emailOrPhone: 'superadmin@ncct.gov.in',
    role: UserRole.SUPER_ADMIN,
    instituteId: null,
    preferredLanguage: 'hi',
    passwordHash: 'argon2_or_sha256_mock_hash_superadmin',
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'bbbb2222-2222-2222-2222-222222222222',
    name: 'Dr. Meena Saxena (Principal Director)',
    emailOrPhone: 'director@ricm-bhopal.gov.in',
    role: UserRole.INSTITUTE_ADMIN,
    instituteId: SEED_INSTITUTE_RICM_BHOPAL.id,
    preferredLanguage: 'hi',
    passwordHash: 'argon2_or_sha256_mock_hash_instadmin',
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cccc3333-3333-3333-3333-333333333333',
    name: 'Prof. Ramesh Sharma (Cooperative Faculty)',
    emailOrPhone: 'trainer@ricm-bhopal.gov.in',
    role: UserRole.TRAINER,
    instituteId: SEED_INSTITUTE_RICM_BHOPAL.id,
    preferredLanguage: 'hi',
    passwordHash: 'argon2_or_sha256_mock_hash_trainer',
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'dddd4444-4444-4444-4444-444444444441',
    name: 'Anita Patel (PACS Member / Rural Youth)',
    emailOrPhone: 'anita.patel@rural.org',
    role: UserRole.TRAINEE,
    instituteId: SEED_INSTITUTE_RICM_BHOPAL.id,
    preferredLanguage: 'hi',
    passwordHash: 'argon2_or_sha256_mock_hash_trainee1',
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'dddd4444-4444-4444-4444-444444444442',
    name: 'Vikram Singh (SHG Accountant)',
    emailOrPhone: 'vikram.singh@rural.org',
    role: UserRole.TRAINEE,
    instituteId: SEED_INSTITUTE_RICM_BHOPAL.id,
    preferredLanguage: 'hi',
    passwordHash: 'argon2_or_sha256_mock_hash_trainee2',
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'dddd4444-4444-4444-4444-444444444443',
    name: 'Sunita Devi (Dairy Cooperative Secretary)',
    emailOrPhone: 'sunita.devi@rural.org',
    role: UserRole.TRAINEE,
    instituteId: SEED_INSTITUTE_RICM_BHOPAL.id,
    preferredLanguage: 'hi',
    passwordHash: 'argon2_or_sha256_mock_hash_trainee3',
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'eeee5555-5555-5555-5555-555555555555',
    name: 'Anand Milk Union (Amul) Talent Recruitment',
    emailOrPhone: 'recruitment@amul.coop',
    role: UserRole.EMPLOYER,
    instituteId: null,
    preferredLanguage: 'en',
    passwordHash: 'argon2_or_sha256_mock_hash_employer',
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

// ==========================================
// 3. Seed Programmes, Batches & Sessions
// ==========================================

export const SEED_PROGRAMME: Programme = {
  id: '33333333-3333-3333-3333-333333333333',
  instituteId: SEED_INSTITUTE_RICM_BHOPAL.id,
  title: 'Comprehensive Certificate in PACS Digital Accounting & Cooperative Governance',
  description: 'NCCT approved capacity building programme for Primary Agricultural Credit Societies.',
  startAt: '2026-09-01T09:00:00.000Z',
  endAt: '2026-10-31T17:00:00.000Z',
  status: ProgrammeStatus.ACTIVE,
  createdAt: '2026-08-15T00:00:00.000Z',
  updatedAt: '2026-08-15T00:00:00.000Z',
};

export const SEED_BATCH: Batch = {
  id: '44444444-4444-4444-4444-444444444444',
  programmeId: SEED_PROGRAMME.id,
  name: 'Batch 2026-A (Bhopal District PACS Cohort)',
  capacity: 35,
  trainerId: 'cccc3333-3333-3333-3333-333333333333',
  createdAt: '2026-08-20T00:00:00.000Z',
};

export const SEED_SESSION: TrainingSession = {
  id: '55555555-5555-5555-5555-555555555555',
  batchId: SEED_BATCH.id,
  title: 'Session 1: Introduction to PACS Double Entry & Daybook Posting',
  startsAt: '2026-09-28T09:30:00.000Z',
  endsAt: '2026-09-28T12:30:00.000Z',
  attendancePolicy: {
    minDurationMinutes: 60,
    allowLateMinutes: 15,
  },
  createdAt: '2026-08-25T00:00:00.000Z',
};

export const SEED_ENROLLMENTS: Enrollment[] = [
  {
    id: '66666666-6666-6666-6666-666666666661',
    traineeId: 'dddd4444-4444-4444-4444-444444444441',
    programmeId: SEED_PROGRAMME.id,
    batchId: SEED_BATCH.id,
    status: EnrollmentStatus.ACTIVE,
    enrolledAt: '2026-08-25T00:00:00.000Z',
  },
  {
    id: '66666666-6666-6666-6666-666666666662',
    traineeId: 'dddd4444-4444-4444-4444-444444444442',
    programmeId: SEED_PROGRAMME.id,
    batchId: SEED_BATCH.id,
    status: EnrollmentStatus.ACTIVE,
    enrolledAt: '2026-08-25T00:00:00.000Z',
  },
  {
    id: '66666666-6666-6666-6666-666666666663',
    traineeId: 'dddd4444-4444-4444-4444-444444444443',
    programmeId: SEED_PROGRAMME.id,
    batchId: SEED_BATCH.id,
    status: EnrollmentStatus.ACTIVE,
    enrolledAt: '2026-08-25T00:00:00.000Z',
  },
];

// ==========================================
// 4. Seed Course, Modules, Lessons & Assessment
// ==========================================

export const SEED_COURSE: Course = {
  id: '77777777-7777-7777-7777-777777777777',
  title: 'PACS Accounting, Audit & Financial Compliance',
  version: 1,
  language: 'hi',
  description: 'Cooperative financial standards, balance sheets, and audit regulations under NABARD/NCCT guidelines.',
  createdAt: '2026-08-10T00:00:00.000Z',
  updatedAt: '2026-08-10T00:00:00.000Z',
};

export const SEED_MODULE: Module = {
  id: '88888888-8888-8888-8888-888888888888',
  courseId: SEED_COURSE.id,
  title: 'Module 1: Daily Voucher Entry & Ledger Balancing',
  order: 1,
};

export const SEED_LESSONS: Lesson[] = [
  {
    id: '99999999-9999-9999-9999-999999999991',
    moduleId: SEED_MODULE.id,
    type: 'TEXT',
    title: 'Lesson 1.1: Cooperative Principles & PACS Legal Architecture',
    contentUri: '/content/lessons/lesson_1_1.md',
    localAssetRef: 'lessons/lesson_1_1.md',
    order: 1,
  },
  {
    id: '99999999-9999-9999-9999-999999999992',
    moduleId: SEED_MODULE.id,
    type: 'INTERACTIVE_DOCUMENT',
    title: 'Lesson 1.2: Daybook, Cashbook & Member Loan Ledgers',
    contentUri: '/content/lessons/lesson_1_2.md',
    localAssetRef: 'lessons/lesson_1_2.md',
    order: 2,
  },
];

export const SEED_ASSESSMENT: Assessment = {
  id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  courseId: SEED_COURSE.id,
  title: 'PACS Operational Certification Examination',
  passingScore: 70,
};

export const SEED_QUESTIONS: Question[] = [
  {
    id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    assessmentId: SEED_ASSESSMENT.id,
    type: 'MULTIPLE_CHOICE',
    prompt: 'Which account is debited when a PACS disburses a crop loan to an individual farmer?',
    options: [
      'Cash / Bank Account',
      'Short-Term Crop Loan Asset Account',
      'Share Capital Account',
      'Dividend Reserve',
    ],
    correctAnswer: 1,
  },
  {
    id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2',
    assessmentId: SEED_ASSESSMENT.id,
    type: 'MULTIPLE_CHOICE',
    prompt: 'Under cooperative guidelines, what is the primary purpose of the Statutory Reserve Fund?',
    options: [
      'Disbursing executive bonuses',
      'Absorbing unforeseen losses and safeguarding member capital',
      'Purchasing commercial vehicles',
      'Waiving non-member debts',
    ],
    correctAnswer: 1,
  },
  {
    id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3',
    assessmentId: SEED_ASSESSMENT.id,
    type: 'TRUE_FALSE',
    prompt: 'Can a trainee submit local attendance and quizzes offline on Sahakar Edge without an active WAN connection?',
    options: ['True', 'False'],
    correctAnswer: 0,
  },
];

// ==========================================
// 5. Seed Skills & Job Opportunities
// ==========================================

export const SEED_SKILLS: Skill[] = [
  {
    id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    code: 'PACS_ACCOUNTING',
    name: 'PACS Double-Entry Accounting',
    description: 'Proficiency in daybook posting, loan portfolio accounting, and reconciliation under NCCT standards.',
  },
  {
    id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
    code: 'COOP_GOVERNANCE',
    name: 'Cooperative Governance & Compliance',
    description: 'Knowledge of cooperative society bylaws, general body quorum rules, and statutory audit mandates.',
  },
  {
    id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    code: 'DAIRY_LOGISTICS',
    name: 'Dairy Procurement & Cold Chain Management',
    description: 'Milk testing, FAT/SNF pricing calculation, and bulk milk chilling operations.',
  },
];

export const SEED_JOB_OPPORTUNITY: JobOpportunity = {
  id: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
  employerId: 'eeee5555-5555-5555-5555-555555555555',
  title: 'Assistant Accountant & PACS Field Coordinator',
  description: 'Responsible for maintaining financial ledgers, member passbooks, and inventory accounting across regional PACS branches.',
  location: 'Anand, Gujarat / Bhopal, MP',
  qualification: 'Certificate from NCCT / VAMNICOM / RICM',
  experienceYears: 0, // Freshers with certified skills welcome
  active: true,
  createdAt: '2026-09-01T00:00:00.000Z',
};

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
  JobRequiredSkill,
  SkillEvidence,
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
    parentCategory: 'Financial Operations',
    evidenceRule: 'ASSESSMENT_PASS_70',
  },
  {
    id: 'cccccccc-cccc-cccc-cccc-cccccccccc01',
    code: 'VOUCHER_ENTRY',
    name: 'Daybook & Voucher Posting',
    description: 'Preparation of debit/credit vouchers and cashbook tallying for PACS transactions.',
    parentCategory: 'Financial Operations',
    parentSkillId: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    evidenceRule: 'ASSESSMENT_PASS_70',
  },
  {
    id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
    code: 'COOP_GOVERNANCE',
    name: 'Cooperative Governance & Compliance',
    description: 'Knowledge of cooperative society bylaws, general body quorum rules, and statutory audit mandates.',
    parentCategory: 'Governance & Legal',
    evidenceRule: 'MODULE_COMPLETION',
  },
  {
    id: 'dddddddd-dddd-dddd-dddd-dddddddddd01',
    code: 'STATUTORY_AUDIT',
    name: 'Statutory Audit & Balance Sheet Verification',
    description: 'Statutory compliance verification, NPA classification, and audit report preparation under NABARD guidelines.',
    parentCategory: 'Governance & Legal',
    parentSkillId: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
    evidenceRule: 'ASSESSMENT_PASS_70',
  },
  {
    id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    code: 'DAIRY_LOGISTICS',
    name: 'Dairy Procurement & Cold Chain Management',
    description: 'Milk testing, FAT/SNF pricing calculation, and bulk milk chilling operations.',
    parentCategory: 'Agribusiness & Operations',
    evidenceRule: 'FIELD_VERIFICATION',
  },
  {
    id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee01',
    code: 'COLD_CHAIN_MGMT',
    name: 'Bulk Milk Chilling & BMC Maintenance',
    description: 'Temperature logging, CIP sanitation cycles, and cold chain transfer logistics.',
    parentCategory: 'Agribusiness & Operations',
    parentSkillId: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    evidenceRule: 'MODULE_COMPLETION',
  },
  {
    id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee02',
    code: 'AGRI_CREDIT_APPRAISAL',
    name: 'Kisan Credit Card (KCC) Appraisal',
    description: 'Crop acreage assessment, scale of finance calculation, and loan documentation.',
    parentCategory: 'Credit & Banking',
    evidenceRule: 'ASSESSMENT_PASS_70',
  },
];

export const SEED_JOB_OPPORTUNITY: JobOpportunity = {
  id: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
  employerId: 'eeee5555-5555-5555-5555-555555555555',
  employerName: 'Anand Milk Union (Amul) Talent Network',
  title: 'Assistant Accountant & PACS Field Coordinator',
  description: 'Responsible for maintaining financial ledgers, member passbooks, and inventory accounting across regional PACS branches.',
  location: 'Anand, Gujarat / Bhopal, MP',
  qualification: 'Certificate from NCCT / VAMNICOM / RICM',
  experienceYears: 0, // Freshers with certified skills welcome
  active: true,
  createdAt: '2026-09-01T00:00:00.000Z',
};

export const SEED_JOB_DAIRY_COORDINATOR: JobOpportunity = {
  id: 'ffffffff-ffff-ffff-ffff-ffffffffff02',
  employerId: 'eeee5555-5555-5555-5555-555555555555',
  employerName: 'Gujarat Cooperative Milk Marketing Federation (GCMMF)',
  title: 'Dairy Procurement & Chilling Executive',
  description: 'Supervises village collection centers, oversees FAT/SNF testing, and ensures cold chain preservation during transport.',
  location: 'Mehsana / Anand, Gujarat',
  qualification: 'Certificate in Dairy Operations or NCCT Cooperative Training',
  experienceYears: 0,
  active: true,
  createdAt: '2026-09-05T00:00:00.000Z',
};

export const SEED_JOB_DCCB_SECRETARY: JobOpportunity = {
  id: 'ffffffff-ffff-ffff-ffff-ffffffffff03',
  employerId: 'eeee5555-5555-5555-5555-555555555555',
  employerName: 'Bhopal District Central Cooperative Bank (DCCB)',
  title: 'PACS Branch Secretary & Senior Auditor',
  description: 'Oversees PACS governance, conducts annual statutory audit reconciliations, and manages KCC credit portfolio.',
  location: 'Bhopal / Sehore, Madhya Pradesh',
  qualification: 'Diploma in Cooperative Management / NCCT Certification',
  experienceYears: 1, // Requires 1 year experience
  active: true,
  createdAt: '2026-09-10T00:00:00.000Z',
};

export const SEED_JOB_OPPORTUNITIES: JobOpportunity[] = [
  SEED_JOB_OPPORTUNITY,
  SEED_JOB_DAIRY_COORDINATOR,
  SEED_JOB_DCCB_SECRETARY,
];

export const SEED_JOB_REQUIRED_SKILLS: JobRequiredSkill[] = [
  // Job 1: Assistant Accountant (Amul)
  {
    jobId: SEED_JOB_OPPORTUNITY.id,
    skillId: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    skillCode: 'PACS_ACCOUNTING',
    skillName: 'PACS Double-Entry Accounting',
    requiredLevel: 1,
    weight: 0.5,
  },
  {
    jobId: SEED_JOB_OPPORTUNITY.id,
    skillId: 'cccccccc-cccc-cccc-cccc-cccccccccc01',
    skillCode: 'VOUCHER_ENTRY',
    skillName: 'Daybook & Voucher Posting',
    requiredLevel: 1,
    weight: 0.3,
  },
  {
    jobId: SEED_JOB_OPPORTUNITY.id,
    skillId: 'dddddddd-dddd-dddd-dddd-dddddddddd01',
    skillCode: 'STATUTORY_AUDIT',
    skillName: 'Statutory Audit & Balance Sheet Verification',
    requiredLevel: 1,
    weight: 0.2,
  },

  // Job 2: Dairy Procurement (GCMMF)
  {
    jobId: SEED_JOB_DAIRY_COORDINATOR.id,
    skillId: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    skillCode: 'DAIRY_LOGISTICS',
    skillName: 'Dairy Procurement & Cold Chain Management',
    requiredLevel: 1,
    weight: 0.6,
  },
  {
    jobId: SEED_JOB_DAIRY_COORDINATOR.id,
    skillId: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee01',
    skillCode: 'COLD_CHAIN_MGMT',
    skillName: 'Bulk Milk Chilling & BMC Maintenance',
    requiredLevel: 1,
    weight: 0.4,
  },

  // Job 3: PACS Branch Secretary (DCCB)
  {
    jobId: SEED_JOB_DCCB_SECRETARY.id,
    skillId: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    skillCode: 'PACS_ACCOUNTING',
    skillName: 'PACS Double-Entry Accounting',
    requiredLevel: 2,
    weight: 0.4,
  },
  {
    jobId: SEED_JOB_DCCB_SECRETARY.id,
    skillId: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
    skillCode: 'COOP_GOVERNANCE',
    skillName: 'Cooperative Governance & Compliance',
    requiredLevel: 1,
    weight: 0.3,
  },
  {
    jobId: SEED_JOB_DCCB_SECRETARY.id,
    skillId: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee02',
    skillCode: 'AGRI_CREDIT_APPRAISAL',
    skillName: 'Kisan Credit Card (KCC) Appraisal',
    requiredLevel: 1,
    weight: 0.3,
  },
];

export const SEED_TRAINEE_SKILL_EVIDENCES: SkillEvidence[] = [
  // Anita Patel (Trainee 1) - Accounting Focus
  {
    id: 'ev-anita-pacs-acc',
    traineeId: 'dddd4444-4444-4444-4444-444444444441',
    skillId: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    sourceType: 'ASSESSMENT',
    sourceId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    level: 2,
    issuedAt: '2026-09-01T00:00:00.000Z',
  },
  {
    id: 'ev-anita-voucher',
    traineeId: 'dddd4444-4444-4444-4444-444444444441',
    skillId: 'cccccccc-cccc-cccc-cccc-cccccccccc01',
    sourceType: 'ASSESSMENT',
    sourceId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    level: 2,
    issuedAt: '2026-09-01T00:00:00.000Z',
  },
  {
    id: 'ev-anita-gov',
    traineeId: 'dddd4444-4444-4444-4444-444444444441',
    skillId: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
    sourceType: 'TRAINING_COMPLETION',
    sourceId: '77777777-7777-7777-7777-777777777777',
    level: 1,
    issuedAt: '2026-09-01T00:00:00.000Z',
  },

  // Sunita Devi (Trainee 3) - Dairy Focus
  {
    id: 'ev-sunita-dairy',
    traineeId: 'dddd4444-4444-4444-4444-444444444443',
    skillId: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    sourceType: 'TRAINING_COMPLETION',
    sourceId: 'dairy-prog-001',
    level: 2,
    issuedAt: '2026-09-01T00:00:00.000Z',
  },
  {
    id: 'ev-sunita-coldchain',
    traineeId: 'dddd4444-4444-4444-4444-444444444443',
    skillId: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee01',
    sourceType: 'TRAINING_COMPLETION',
    sourceId: 'dairy-prog-001',
    level: 1,
    issuedAt: '2026-09-01T00:00:00.000Z',
  },
];

// Expert-labelled validation pairs for benchmarking matching models (Precision@K / Recall@K)
export const SEED_BENCHMARK_LABELS = [
  {
    traineeId: 'dddd4444-4444-4444-4444-444444444441', // Anita Patel (Accounting)
    relevantJobIds: [SEED_JOB_OPPORTUNITY.id, SEED_JOB_DCCB_SECRETARY.id],
    topRelevantJobId: SEED_JOB_OPPORTUNITY.id,
  },
  {
    traineeId: 'dddd4444-4444-4444-4444-444444444443', // Sunita Devi (Dairy)
    relevantJobIds: [SEED_JOB_DAIRY_COORDINATOR.id],
    topRelevantJobId: SEED_JOB_DAIRY_COORDINATOR.id,
  },
];


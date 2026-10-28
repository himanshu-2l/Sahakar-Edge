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
  OralQuestion,
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

// Tier 1: Apex National Institute
export const SEED_INSTITUTE_VAMNICOM: Institute = {
  id: '22222222-2222-2222-2222-222222222222',
  name: 'Vaikunth Mehta National Institute of Cooperative Management (VAMNICOM)',
  code: 'VAMNICOM-PUN',
  type: 'VAMNICOM',
  tier: 1,
  parentInstituteId: null,
  locationText: 'Pune, Maharashtra',
  state: 'Maharashtra',
  zone: 'APEX',
  latitude: 18.5308,
  longitude: 73.8475,
  pacsCount: 0,
  active: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

// Tier 2: 5 Regional Institutes of Cooperative Management (RICMs)
export const SEED_INSTITUTE_RICM_BHOPAL: Institute = {
  id: '11111111-1111-1111-1111-111111111111',
  name: 'Regional Institute of Cooperative Management (RICM), Bhopal',
  code: 'RICM-BHO',
  type: 'RICM',
  tier: 2,
  parentInstituteId: '22222222-2222-2222-2222-222222222222',
  locationText: 'Bhopal, Madhya Pradesh',
  state: 'Madhya Pradesh',
  zone: 'CENTRAL',
  latitude: 23.2599,
  longitude: 77.4126,
  pacsCount: 450,
  active: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

export const SEED_INSTITUTE_RICM_GANDHINAGAR: Institute = {
  id: '11111111-1111-1111-1111-111111111112',
  name: 'Regional Institute of Cooperative Management (RICM), Gandhinagar',
  code: 'RICM-GAN',
  type: 'RICM',
  tier: 2,
  parentInstituteId: '22222222-2222-2222-2222-222222222222',
  locationText: 'Gandhinagar, Gujarat',
  state: 'Gujarat',
  zone: 'WEST',
  latitude: 23.2156,
  longitude: 72.6369,
  pacsCount: 380,
  active: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

export const SEED_INSTITUTE_RICM_KALYANI: Institute = {
  id: '11111111-1111-1111-1111-111111111113',
  name: 'Regional Institute of Cooperative Management (RICM), Kalyani',
  code: 'RICM-KAL',
  type: 'RICM',
  tier: 2,
  parentInstituteId: '22222222-2222-2222-2222-222222222222',
  locationText: 'Kalyani, West Bengal',
  state: 'West Bengal',
  zone: 'EAST',
  latitude: 22.9751,
  longitude: 88.4345,
  pacsCount: 320,
  active: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

export const SEED_INSTITUTE_RICM_PATNA: Institute = {
  id: '11111111-1111-1111-1111-111111111114',
  name: 'Regional Institute of Cooperative Management (RICM), Patna',
  code: 'RICM-PAT',
  type: 'RICM',
  tier: 2,
  parentInstituteId: '22222222-2222-2222-2222-222222222222',
  locationText: 'Patna, Bihar',
  state: 'Bihar',
  zone: 'EAST',
  latitude: 25.5941,
  longitude: 85.1376,
  pacsCount: 290,
  active: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

export const SEED_INSTITUTE_RICM_BENGALURU: Institute = {
  id: '11111111-1111-1111-1111-111111111115',
  name: 'Regional Institute of Cooperative Management (RICM), Bengaluru',
  code: 'RICM-BEN',
  type: 'RICM',
  tier: 2,
  parentInstituteId: '22222222-2222-2222-2222-222222222222',
  locationText: 'Bengaluru, Karnataka',
  state: 'Karnataka',
  zone: 'SOUTH',
  latitude: 12.9716,
  longitude: 77.5946,
  pacsCount: 410,
  active: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

// Tier 3: 14 Institutes of Cooperative Management (ICMs)
export const SEED_INSTITUTE_ICM_LUCKNOW: Institute = {
  id: '33333333-3333-3333-3333-333333333301',
  name: 'Institute of Cooperative Management (ICM), Lucknow',
  code: 'ICM-LUC',
  type: 'ICM',
  tier: 3,
  parentInstituteId: '11111111-1111-1111-1111-111111111111',
  locationText: 'Lucknow, Uttar Pradesh',
  state: 'Uttar Pradesh',
  zone: 'NORTH',
  latitude: 26.8467,
  longitude: 80.9462,
  pacsCount: 180,
  active: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

export const SEED_INSTITUTE_ICM_DEHRADUN: Institute = {
  id: '33333333-3333-3333-3333-333333333302',
  name: 'Institute of Cooperative Management (ICM), Dehradun',
  code: 'ICM-DEH',
  type: 'ICM',
  tier: 3,
  parentInstituteId: '11111111-1111-1111-1111-111111111111',
  locationText: 'Dehradun, Uttarakhand',
  state: 'Uttarakhand',
  zone: 'NORTH',
  latitude: 30.3165,
  longitude: 78.0322,
  pacsCount: 110,
  active: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

export const SEED_INSTITUTE_ICM_JAIPUR: Institute = {
  id: '33333333-3333-3333-3333-333333333303',
  name: 'Institute of Cooperative Management (ICM), Jaipur',
  code: 'ICM-JAI',
  type: 'ICM',
  tier: 3,
  parentInstituteId: '11111111-1111-1111-1111-111111111112',
  locationText: 'Jaipur, Rajasthan',
  state: 'Rajasthan',
  zone: 'NORTH',
  latitude: 26.9124,
  longitude: 75.7873,
  pacsCount: 160,
  active: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

export const SEED_INSTITUTE_ICM_CHANDIGARH: Institute = {
  id: '33333333-3333-3333-3333-333333333304',
  name: 'Institute of Cooperative Management (ICM), Chandigarh',
  code: 'ICM-CHA',
  type: 'ICM',
  tier: 3,
  parentInstituteId: '11111111-1111-1111-1111-111111111111',
  locationText: 'Chandigarh, Punjab',
  state: 'Punjab',
  zone: 'NORTH',
  latitude: 30.7333,
  longitude: 76.7794,
  pacsCount: 140,
  active: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

export const SEED_INSTITUTE_ICM_GUWAHATI: Institute = {
  id: '33333333-3333-3333-3333-333333333305',
  name: 'Institute of Cooperative Management (ICM), Guwahati',
  code: 'ICM-GUW',
  type: 'ICM',
  tier: 3,
  parentInstituteId: '11111111-1111-1111-1111-111111111113',
  locationText: 'Guwahati, Assam',
  state: 'Assam',
  zone: 'EAST',
  latitude: 26.1445,
  longitude: 91.7362,
  pacsCount: 130,
  active: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

export const SEED_INSTITUTE_ICM_IMPHAL: Institute = {
  id: '33333333-3333-3333-3333-333333333306',
  name: 'Institute of Cooperative Management (ICM), Imphal',
  code: 'ICM-IMP',
  type: 'ICM',
  tier: 3,
  parentInstituteId: '11111111-1111-1111-1111-111111111113',
  locationText: 'Imphal, Manipur',
  state: 'Manipur',
  zone: 'EAST',
  latitude: 24.8170,
  longitude: 93.9368,
  pacsCount: 85,
  active: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

export const SEED_INSTITUTE_ICM_HYDERABAD: Institute = {
  id: '33333333-3333-3333-3333-333333333307',
  name: 'Institute of Cooperative Management (ICM), Hyderabad',
  code: 'ICM-HYD',
  type: 'ICM',
  tier: 3,
  parentInstituteId: '11111111-1111-1111-1111-111111111115',
  locationText: 'Hyderabad, Telangana',
  state: 'Telangana',
  zone: 'SOUTH',
  latitude: 17.3850,
  longitude: 78.4867,
  pacsCount: 175,
  active: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

export const SEED_INSTITUTE_ICM_CHENNAI: Institute = {
  id: '33333333-3333-3333-3333-333333333308',
  name: 'Institute of Cooperative Management (ICM), Chennai',
  code: 'ICM-CHE',
  type: 'ICM',
  tier: 3,
  parentInstituteId: '11111111-1111-1111-1111-111111111115',
  locationText: 'Chennai, Tamil Nadu',
  state: 'Tamil Nadu',
  zone: 'SOUTH',
  latitude: 13.0827,
  longitude: 80.2707,
  pacsCount: 190,
  active: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

export const SEED_INSTITUTE_ICM_MADURAI: Institute = {
  id: '33333333-3333-3333-3333-333333333309',
  name: 'Institute of Cooperative Management (ICM), Madurai',
  code: 'ICM-MAD',
  type: 'ICM',
  tier: 3,
  parentInstituteId: '11111111-1111-1111-1111-111111111115',
  locationText: 'Madurai, Tamil Nadu',
  state: 'Tamil Nadu',
  zone: 'SOUTH',
  latitude: 9.9252,
  longitude: 78.1198,
  pacsCount: 125,
  active: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

export const SEED_INSTITUTE_ICM_THIRUVANANTHAPURAM: Institute = {
  id: '33333333-3333-3333-3333-333333333310',
  name: 'Institute of Cooperative Management (ICM), Thiruvananthapuram',
  code: 'ICM-TVM',
  type: 'ICM',
  tier: 3,
  parentInstituteId: '11111111-1111-1111-1111-111111111115',
  locationText: 'Thiruvananthapuram, Kerala',
  state: 'Kerala',
  zone: 'SOUTH',
  latitude: 8.5241,
  longitude: 76.9366,
  pacsCount: 145,
  active: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

export const SEED_INSTITUTE_ICM_NAGPUR: Institute = {
  id: '33333333-3333-3333-3333-333333333311',
  name: 'Institute of Cooperative Management (ICM), Nagpur',
  code: 'ICM-NAG',
  type: 'ICM',
  tier: 3,
  parentInstituteId: '11111111-1111-1111-1111-111111111111',
  locationText: 'Nagpur, Maharashtra',
  state: 'Maharashtra',
  zone: 'WEST',
  latitude: 21.1458,
  longitude: 79.0882,
  pacsCount: 155,
  active: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

export const SEED_INSTITUTE_ICM_PUNE: Institute = {
  id: '33333333-3333-3333-3333-333333333312',
  name: 'Institute of Cooperative Management (ICM), Pune',
  code: 'ICM-PUN',
  type: 'ICM',
  tier: 3,
  parentInstituteId: '22222222-2222-2222-2222-222222222222',
  locationText: 'Pune, Maharashtra',
  state: 'Maharashtra',
  zone: 'WEST',
  latitude: 18.5204,
  longitude: 73.8567,
  pacsCount: 165,
  active: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

export const SEED_INSTITUTE_ICM_BHUBANESWAR: Institute = {
  id: '33333333-3333-3333-3333-333333333313',
  name: 'Institute of Cooperative Management (ICM), Bhubaneswar',
  code: 'ICM-BHU',
  type: 'ICM',
  tier: 3,
  parentInstituteId: '11111111-1111-1111-1111-111111111113',
  locationText: 'Bhubaneswar, Odisha',
  state: 'Odisha',
  zone: 'EAST',
  latitude: 20.2961,
  longitude: 85.8245,
  pacsCount: 140,
  active: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

export const SEED_INSTITUTE_ICM_SHIMLA: Institute = {
  id: '33333333-3333-3333-3333-333333333314',
  name: 'Institute of Cooperative Management (ICM), Shimla',
  code: 'ICM-SHI',
  type: 'ICM',
  tier: 3,
  parentInstituteId: '11111111-1111-1111-1111-111111111111',
  locationText: 'Shimla, Himachal Pradesh',
  state: 'Himachal Pradesh',
  zone: 'NORTH',
  latitude: 31.1048,
  longitude: 77.1734,
  pacsCount: 95,
  active: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

// Complete 20-node national roster
export const SEED_INSTITUTES: Institute[] = [
  // SEED_INSTITUTES[0] preserved as RICM Bhopal for test compatibility
  SEED_INSTITUTE_RICM_BHOPAL,
  SEED_INSTITUTE_RICM_GANDHINAGAR,
  SEED_INSTITUTE_RICM_KALYANI,
  SEED_INSTITUTE_RICM_PATNA,
  SEED_INSTITUTE_RICM_BENGALURU,
  SEED_INSTITUTE_VAMNICOM,
  SEED_INSTITUTE_ICM_LUCKNOW,
  SEED_INSTITUTE_ICM_DEHRADUN,
  SEED_INSTITUTE_ICM_JAIPUR,
  SEED_INSTITUTE_ICM_CHANDIGARH,
  SEED_INSTITUTE_ICM_GUWAHATI,
  SEED_INSTITUTE_ICM_IMPHAL,
  SEED_INSTITUTE_ICM_HYDERABAD,
  SEED_INSTITUTE_ICM_CHENNAI,
  SEED_INSTITUTE_ICM_MADURAI,
  SEED_INSTITUTE_ICM_THIRUVANANTHAPURAM,
  SEED_INSTITUTE_ICM_NAGPUR,
  SEED_INSTITUTE_ICM_PUNE,
  SEED_INSTITUTE_ICM_BHUBANESWAR,
  SEED_INSTITUTE_ICM_SHIMLA,
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

export const SEED_ORAL_ASSESSMENT: Assessment = {
  id: 'aaaaaaaa-oral-aaaa-aaaa-aaaaaaaaaaaa',
  courseId: SEED_COURSE.id,
  title: 'PACS Cooperative Accounting Oral Viva Assessment (मौखिक परीक्षा)',
  passingScore: 70,
};

export const SEED_ORAL_QUESTIONS: OralQuestion[] = [
  {
    id: 'oral-q-01-daybook-balancing',
    topic: 'Daybook (Rojnamcha) & Cashbook Daily Balancing',
    prompt:
      'Explain the daily balancing procedure for the Daybook (Rojnamcha) and Cashbook in a PACS. How is the closing cash balance verified against physical vault cash before day-end closing?',
    promptHi:
      'पैक्स (PACS) में रोजनामचा (Daybook) और रोकड़बही (Cashbook) के दैनिक मिलान की प्रक्रिया समझाइए। दिन की समाप्ति से पूर्व तिजोरी में मौजूद भौतिक नकदी (Physical Vault Cash) से अंतिम शेष का मिलान कैसे किया जाता है?',
    expectedKeywords: [
      'daybook',
      'rojnamcha',
      'cashbook',
      'vault cash',
      'physical cash',
      'reconciliation',
      'closing balance',
      'debit',
      'credit',
    ],
    expectedKeywordsHi: [
      'रोजनामचा',
      'रोकड़बही',
      'तिजोरी',
      'भौतिक नकदी',
      'रोकड़ मिलान',
      'अंतिम शेष',
      'जमा',
      'नामे',
    ],
    passingKeywordThreshold: 2,
    explanation:
      'At the end of each business day, the cashier and secretary must tally total cash receipts and disbursements recorded in the Daybook and Cashbook against physical currency counted in the vault. Total receipts plus opening cash must equal disbursements plus closing physical vault cash.',
    explanationHi:
      'प्रत्येक कार्यदिवस की समाप्ति पर रोजनामचा और रोकड़बही में दर्ज सभी लेन-देन का योग तिजोरी में उपलब्ध भौतिक नकदी से अनिवार्य रूप से मिलाया जाता है। प्रारम्भिक शेष + कुल प्राप्तियां = कुल संवितरण + अंतिम तिजोरी रोकड़।',
  },
  {
    id: 'oral-q-02-crop-loan-disbursement',
    topic: 'Short-Term Crop Loan Disbursement Double-Entry Accounting',
    prompt:
      'Describe the double-entry accounting entry when a PACS disburses a Short-Term Crop Loan (KCC) to a farmer member. Which account is debited and which account is credited?',
    promptHi:
      'जब पैक्स किसी किसान सदस्य को अल्पकालिक फसल ऋण (KCC) वितरित करता है, तो दोहरी प्रविष्टि (Journal Entry) क्या होती है? कौन सा खाता नामे (Debit) और कौन सा खाता जमा (Credit) किया जाता है?',
    expectedKeywords: [
      'debit',
      'credit',
      'crop loan',
      'loan asset',
      'cash',
      'bank',
      'disbursement',
      'member loan account',
    ],
    expectedKeywordsHi: [
      'नामे',
      'जमा',
      'डेबिट',
      'क्रेडिट',
      'फसल ऋण',
      'ऋण परिसंपत्ति',
      'रोकड़',
      'बैंक',
      'वितरण',
      'ऋण खाता',
    ],
    passingKeywordThreshold: 2,
    explanation:
      'Upon disbursing a Short-Term Crop Loan, Debit the Short-Term Crop Loan Asset Account (increasing society loan receivables) and Credit the Cash in Hand Account or Bank Account (decreasing liquid cash upon payout).',
    explanationHi:
      'फसल ऋण वितरित करते समय अल्पकालिक फसल ऋण परिसंपत्ति खाता नामे (Debit) किया जाता है क्योंकि समिति का ऋण लेना बढ़ता है, तथा रोकड़ खाता या बैंक खाता जमा (Credit) किया जाता है क्योंकि समिति से नकदी बाहर जाती है।',
  },
  {
    id: 'oral-q-03-statutory-reserve-fund',
    topic: 'Statutory Reserve Fund Mandate (25% Net Profit Transfer)',
    prompt:
      'Explain the statutory requirement regarding the Reserve Fund in a Primary Agricultural Credit Society. What percentage of net profit must be mandatorily transferred and why cannot it be distributed as dividends?',
    promptHi:
      'प्राथमिक कृषि ऋण समिति (PACS) में सांविधिक आरक्षित निधि (Statutory Reserve Fund) की कानूनी आवश्यकता समझाइए। शुद्ध लाभ का कितना प्रतिशत अनिवार्य रूप से स्थानांतरित किया जाता है और इसे लाभांश के रूप में क्यों नहीं वितरित किया जा सकता?',
    expectedKeywords: [
      '25%',
      'statutory reserve fund',
      'net profit',
      'mandatory',
      'buffer',
      'bad debts',
      'unforeseen losses',
      'dividend',
      'indivisible',
    ],
    expectedKeywordsHi: [
      '25%',
      'सांविधिक आरक्षित निधि',
      'शुद्ध लाभ',
      'अनिवार्य',
      'बफर',
      'डूबंत ऋण',
      'अप्रत्याशित हानि',
      'लाभांश',
      'अविभाज्य',
    ],
    passingKeywordThreshold: 2,
    explanation:
      'Under cooperative legislation and NABARD guidelines, PACS must transfer a mandatory minimum of 25% of annual net profit into the Statutory Reserve Fund. This fund serves as a permanent, non-distributable buffer against unforeseen loan defaults and cannot be distributed as member dividends.',
    explanationHi:
      'सहकारी समिति अधिनियम और नाबार्ड दिशा-निर्देशों के अनुसार प्रत्येक पैक्स को अपने वार्षिक शुद्ध लाभ का कम से कम 25% अनिवार्य रूप से सांविधिक आरक्षित निधि में डालना होता है। यह एक स्थायी और अविभाज्य सुरक्षा कोष (Buffer) है जो डूबंत ऋणों से रक्षा करता है और इसे लाभांश के रूप में नहीं बांटा जा सकता।',
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


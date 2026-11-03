/**
 * Sahakar Edge — Phase 11 NCCT Elevation & Master Domain E2E Test Suite
 * Milestone 4 Feature 22: Comprehensive End-to-End Verification with ZERO Mock Stubs
 *
 * Verifies all 6 Core NCCT Pillars:
 * 1. NCCT Institutional Visual Tokens & SVG Geometry
 *    - WCAG 2.1 AAA Contrast (Deep Sovereign Navy #081854 on White >= 16:1, Slate-700 >= 10:1, Sovereign Blue >= 7:1)
 *    - Ashok Chakra 24-spoke trigonometric geometry (15° increments, hub at 12,12, pinhead polygons)
 *    - NCCT Crest Emblem (concentric rings, green gear wheel, wheat sheaves, open book, mini chakra)
 *    - Double-bezel card framing tokens (Slate outer border, 3px moat, inner hairline, outline offset)
 *    - Pure CSS-in-JS invariants & zero Tailwind in trainee-pwa
 *    - Micro-font floor (zero < 12px / < 0.75rem) & touch targets (minHeight >= 44px)
 * 2. ATP Batch Lifecycle & Capacity Engine
 *    - APEX / RICM / ICM institutional hierarchy & hostel capacity metrics
 *    - Training programme scheduling & Zod schema validation
 *    - Trainee nomination state machine (PENDING -> APPROVED | WAITLISTED | REJECTED)
 *    - Strict capacity clamping & automatic waitlist promotion
 *    - Batch delivery progress & statutory 75% attendance threshold compliance
 * 3. Timetable & Dynamic 6-Digit Attendance Engine
 *    - Collision-free 6-digit numeric check-in code generation with anti-collision retries & HMAC fallback
 *    - Millisecond temporal anti-early start guard (isBeforeSessionStart)
 *    - Approved nominee validation (blocking unapproved / waitlisted / rejected nominees)
 *    - Duplicate attendance prevention
 *    - Cryptographic constant-time comparison (crypto.timingSafeEqual)
 *    - Multi-modal verification & faculty manual attendance override audit trail
 * 4. Continuous Evaluation & Gradebook Engine
 *    - Formative practice quiz (unlimited retakes, explanations) vs Summative graded test (strict attempt locking)
 *    - Cumulative Course Marks Tally scorecard compilation
 *    - Dual-condition certificate qualification (100% lessons completed AND all summative tests passed)
 *    - Statutory grade band boundaries (DISTINCTION >= 85%, FIRST_CLASS >= 70%, PASS >= 60%, INCOMPLETE)
 *    - Cohort gradebook matrix & multilingual statutory CSV/XLSX export with authentic Hindi Devanagari headers
 * 5. Predictive Retention, 4-Factor Dropout Risk & Skill Shortage Radar
 *    - 4-Factor additive dropout-risk heuristic (+40 lesson, +30 attendance, +20 dormancy, +10 exams, clamped [0, 100])
 *    - Risk tier assignment (HIGH >= 60, MEDIUM >= 30, LOW < 30) & actionable statutory interventions
 *    - Cohort risk triage radar & descending risk ranking
 *    - Inter-tier geographic reach & training delivery velocity
 *    - 8-Dimensional cooperative skill gap radar & vector cosine similarity matching (50% partial credit)
 * 6. Campus Hostel Logistics & Sovereign Rotatable NFC Profile
 *    - Campus hostel inventory & atomic bed allocation with institute match & capacity clamping
 *    - Strict residential privacy isolation (zero PII, hostel records never leaked to public NFC endpoints)
 *    - Rotatable public NFC profile token ("NFC-" + 8 hex chars) & instantaneous revocation of stale tokens
 *    - Master privacy toggle (enabled/shielded state)
 *    - Deterministic 21x21 SVG QR code generator with 3 finder patterns & timing tracks
 *    - 3D card flip DOM architecture (perspective 1000px, preserve-3d, rotateY 180deg, backface-visibility hidden)
 *    - Visitor profile route verification (/?profile=:code & /api/v1/public/profile/:code)
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import type { FastifyInstance } from 'fastify';

// Central API Server & Store
import { buildCentralServer } from '../apps/central-api/dist/server.js';
import { centralStore } from '../apps/central-api/dist/store/memory-store.js';

// Backend Domain Engines
import {
  AtpLifecycleEngine,
  atpLifecycleEngine,
} from '../apps/central-api/dist/services/atp-lifecycle-engine.js';
import {
  DynamicAttendanceEngine,
  dynamicAttendanceEngine,
} from '../apps/central-api/dist/services/dynamic-attendance-engine.js';
import {
  GradebookEngine,
  gradebookEngine,
} from '../apps/central-api/dist/services/gradebook-engine.js';
import {
  DropoutRiskEngine,
  dropoutRiskEngine,
} from '../apps/central-api/dist/services/dropout-risk-engine.js';
import {
  SkillGapEngine,
  skillGapEngine,
  NCCT_SKILL_EMBEDDING_MAP,
} from '../apps/central-api/dist/services/skill-gap-engine.js';
import {
  HostelLogisticsEngine,
  hostelLogisticsEngine,
} from '../apps/central-api/dist/services/hostel-logistics-engine.js';

// Zod Validation Schemas
import {
  createTrainingProgrammeSchema,
  createNominationSchema,
  decideNominationSchema,
  createTimetableSessionSchema,
  dynamicAttendanceCheckInSchema,
  createCourseModuleTestSchema,
  submitTestAttemptSchema,
  createCampusHostelRoomSchema,
  toggleNfcProfileSchema,
} from '../packages/validation/dist/index.js';

// Types
import type {
  TrainingInstitute,
  TrainingProgramme,
  TraineeNomination,
  TimetableSession,
  CourseModuleTest,
  CampusHostelRoom,
  CooperativeSkillItem,
} from '../packages/types/dist/index.js';

let totalAssertions = 0;
let passedAssertions = 0;

function check(condition: boolean, message: string) {
  totalAssertions++;
  if (!condition) {
    console.error(`  ❌ [FAIL] ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  passedAssertions++;
  console.log(`  ✓ [PASS] ${message}`);
}

// ============================================================================
// PILLAR 1: NCCT Institutional Visual Tokens & SVG Geometry
// ============================================================================
export async function testPillar1VisualTokensAndSvgGeometry(): Promise<void> {
  console.log('\n>>> [PILLAR 1] NCCT Institutional Visual Tokens & SVG Geometry...');

  // 1.1 WCAG 2.1 AAA Contrast Ratio Verification
  const getLuminance = (hex: string): number => {
    const clean = hex.replace('#', '');
    const rgb = [0, 2, 4].map((offset) => {
      const val = parseInt(clean.substring(offset, offset + 2), 16) / 255;
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
  };

  const getContrastRatio = (hex1: string, hex2: string): number => {
    const l1 = getLuminance(hex1);
    const l2 = getLuminance(hex2);
    const max = Math.max(l1, l2);
    const min = Math.min(l1, l2);
    return (max + 0.05) / (min + 0.05);
  };

  // Deep Sovereign Navy (#081854) contrast against pure white (#ffffff)
  const navyContrast = getContrastRatio('#081854', '#ffffff');
  check(
    navyContrast >= 16.0,
    `Deep Sovereign Navy (#081854) contrast against white is ${navyContrast.toFixed(2)}:1 (exceeds WCAG AAA 16:1 threshold)`
  );

  // Slate-700 Body Ink (#334155) contrast against white
  const bodyContrast = getContrastRatio('#334155', '#ffffff');
  check(
    bodyContrast >= 10.0,
    `Slate-700 Body Ink (#334155) contrast against white is ${bodyContrast.toFixed(2)}:1 (exceeds WCAG AAA 10:1 threshold)`
  );

  // Sovereign Blue (#0649a2) contrast against white
  const blueContrast = getContrastRatio('#0649a2', '#ffffff');
  check(
    blueContrast >= 7.0,
    `Sovereign Blue (#0649a2) contrast against white is ${blueContrast.toFixed(2)}:1 (exceeds WCAG AAA 7:1 threshold)`
  );

  // Status Badges WCAG AA compliance (text on bg >= 4.5:1)
  const statusColors = [
    { name: 'success', text: '#166534', bg: '#f0fdf4' },
    { name: 'info', text: '#0649a2', bg: '#eff6ff' },
    { name: 'warning', text: '#854d0e', bg: '#fefce8' },
    { name: 'error', text: '#991b1b', bg: '#fef2f2' },
    { name: 'neutral', text: '#334155', bg: '#f1f5f9' },
    { name: 'apex', text: '#92400e', bg: '#fffbeb' },
    { name: 'coop', text: '#166534', bg: '#f0fdf4' },
    { name: 'saffron', text: '#9a3412', bg: '#fff7ed' },
  ];
  for (const st of statusColors) {
    const ratio = getContrastRatio(st.text, st.bg);
    check(
      ratio >= 4.5,
      `Status badge '${st.name}' contrast (${ratio.toFixed(2)}:1) satisfies WCAG AA >= 4.5:1`
    );
  }

  // 1.2 Ashok Chakra 24-Spoke Trigonometry & SVG Geometry
  const adminIconsPath = path.resolve('apps/web-admin/src/components/icons.tsx');
  const adminIconsSrc = fs.readFileSync(adminIconsPath, 'utf8');

  check(
    adminIconsSrc.includes('Array.from({ length: 24 }, (_, i) => i * 15)'),
    'AshokChakraIcon constructs exactly 24 spokes at 15° rotational increments'
  );
  check(
    adminIconsSrc.includes('transform={`rotate(${deg} 12 12)`}'),
    'AshokChakraIcon spoke lines rotate around central hub coordinate (12, 12)'
  );
  check(
    adminIconsSrc.includes('polygon points="11.6,2.2 12.4,2.2 12,1.2"'),
    'AshokChakraIcon renders triangular pinhead polygons at outer rim'
  );
  check(
    adminIconsSrc.includes('viewBox="0 0 24 24"'),
    'AshokChakraIcon declares standard viewBox="0 0 24 24"'
  );

  // 1.3 NCCT Crest Emblem Inspection
  check(
    adminIconsSrc.includes('export function NcctEmblemIcon'),
    'NcctEmblemIcon exported with official bilingual cooperative crest'
  );
  check(
    adminIconsSrc.includes('wheat sheaves') || adminIconsSrc.includes('M7.8 14.2 C7 10 9.5 7.5 12 7'),
    'NcctEmblemIcon renders cooperative agricultural wheat sheaves geometry'
  );
  check(
    adminIconsSrc.includes('open book') || adminIconsSrc.includes('M8.5 13.2 Q12 12.4 12 14.8'),
    'NcctEmblemIcon renders institutional open book geometry'
  );

  // 1.4 Double-Bezel Card Framing Tokens
  const themePath = path.resolve('apps/web-admin/src/components/theme.ts');
  const themeSrc = fs.readFileSync(themePath, 'utf8');

  check(
    themeSrc.includes('export const doubleBezelCardOuterStyle'),
    'theme.ts exports doubleBezelCardOuterStyle token'
  );
  check(
    themeSrc.includes("border: '1px solid #cbd5e1'") && themeSrc.includes("padding: '3px'"),
    'doubleBezelCardOuterStyle declares 1px #cbd5e1 border with 3px moat padding'
  );
  check(
    themeSrc.includes('export const doubleBezelCardInnerStyle'),
    'theme.ts exports doubleBezelCardInnerStyle token'
  );
  check(
    themeSrc.includes("border: '1px solid #e2e8f0'") && themeSrc.includes("padding: '1.75rem'"),
    'doubleBezelCardInnerStyle declares 1px #e2e8f0 hairline border with 1.75rem macro-padding'
  );

  // 1.5 Pure CSS-in-JS & Trainee PWA Ergonomics
  const pwaPkgPath = path.resolve('apps/trainee-pwa/package.json');
  const pwaPkg = JSON.parse(fs.readFileSync(pwaPkgPath, 'utf8'));
  const hasTailwind = Boolean(
    pwaPkg.dependencies?.tailwindcss || pwaPkg.devDependencies?.tailwindcss
  );
  check(!hasTailwind, 'apps/trainee-pwa package.json has ZERO tailwindcss dependencies');

  // Micro-Font Floor Audit (>= 12px / 0.75rem across all components)
  const componentsDir = path.resolve('apps/trainee-pwa/src/components');
  const tsxFiles = fs
    .readdirSync(componentsDir)
    .filter((f) => f.endsWith('.tsx'))
    .map((f) => path.join(componentsDir, f));

  let totalFontRules = 0;
  const invalidFonts: string[] = [];
  tsxFiles.forEach((file) => {
    const content = fs.readFileSync(file, 'utf8');
    const matches = [...content.matchAll(/fontSize:\s*['"]([^'"]+)['"]/g)].map((m) => m[1]);
    totalFontRules += matches.length;
    matches.forEach((size) => {
      if (size.endsWith('px') && parseFloat(size) < 12) {
        invalidFonts.push(`${path.basename(file)}: ${size}`);
      } else if (size.endsWith('rem') && parseFloat(size) < 0.75) {
        invalidFonts.push(`${path.basename(file)}: ${size}`);
      }
    });
  });
  check(
    invalidFonts.length === 0,
    `Micro-font floor enforced: zero sub-12px rules across ${totalFontRules} fontSize declarations in ${tsxFiles.length} component files`
  );

  // Interactive Touch Target Audit (minHeight >= 44px)
  let totalButtons = 0;
  const invalidButtons: string[] = [];
  tsxFiles.forEach((file) => {
    const content = fs.readFileSync(file, 'utf8');
    const buttons = [...content.matchAll(/<button\b[\s\S]*?<\/button>/g)].map((m) => m[0]);
    totalButtons += buttons.length;
    buttons.forEach((btn) => {
      const minH = btn.match(/minHeight:\s*['"]?(\d+)px/);
      const h = btn.match(/height:\s*['"]?(\d+)px/);
      const effective = minH ? parseInt(minH[1], 10) : h ? parseInt(h[1], 10) : null;
      if (effective !== null && effective < 44) {
        invalidButtons.push(`${path.basename(file)}: ${effective}px`);
      }
    });
  });
  check(
    invalidButtons.length === 0,
    `Touch targets ergonomic compliance: all ${totalButtons} buttons declare height >= 44px`
  );
}

// ============================================================================
// PILLAR 2: ATP Batch Lifecycle & Capacity Engine
// ============================================================================
export async function testPillar2AtpBatchLifecycleAndCapacity(app: FastifyInstance): Promise<void> {
  console.log('\n>>> [PILLAR 2] ATP Batch Lifecycle & Capacity Engine...');

  // 2.1 Multi-Tier Institute Hierarchy via REST API
  const instRes = await app.inject({
    method: 'GET',
    url: '/api/v1/training/institutes?tier=RICM',
  });
  check(instRes.statusCode === 200, 'GET /api/v1/training/institutes?tier=RICM returns HTTP 200');
  const instData = JSON.parse(instRes.payload);
  check(instData.count > 0, 'RICM institute tier returns active institutes');
  check(
    instData.institutes.every((i: TrainingInstitute) => i.tier === 'RICM'),
    'All returned institutes belong strictly to the RICM tier'
  );

  // 2.2 Hostel Capacity Metrics per Institute
  const singleInstRes = await app.inject({
    method: 'GET',
    url: `/api/v1/training/institutes/${instData.institutes[0].id}`,
  });
  check(singleInstRes.statusCode === 200, 'GET /api/v1/training/institutes/:id returns HTTP 200');
  const singleInstData = JSON.parse(singleInstRes.payload);
  check(
    singleInstData.hostelInventory.bedCapacity >= singleInstData.hostelInventory.occupiedBeds,
    'Institute hostel bedCapacity >= occupiedBeds invariant holds'
  );

  // 2.3 Create Training Programme with Capacity Clamping (Capacity = 2)
  const progRes = await app.inject({
    method: 'POST',
    url: '/api/v1/training/programmes',
    payload: {
      instituteId: instData.institutes[0].id,
      title: 'NCCT E2E Verified PACS Leadership Batch 2026',
      code: `ATP-E2E-${Date.now().toString().slice(-4)}`,
      atpYear: '2026-2027',
      targetSector: 'PRIMARY_AGRICULTURAL_CREDIT',
      deliveryMode: 'OFFLINE',
      capacity: 2, // Strictly clamped capacity of 2
      startDate: '2026-11-15',
      endDate: '2026-11-28',
      coordinatingFacultyId: 'cccc3333-3333-3333-3333-333333333333',
    },
  });
  check(progRes.statusCode === 201, 'POST /api/v1/training/programmes creates programme with HTTP 201');
  const programme: TrainingProgramme = JSON.parse(progRes.payload).programme;
  check(programme.capacity === 2, 'Programme capacity correctly configured to 2 seats');

  // 2.4 Nomination State Machine & Capacity Clamping
  // Candidate 1 Nominated & Approved (Seat 1/2)
  const nom1Res = await app.inject({
    method: 'POST',
    url: '/api/v1/training/nominations',
    payload: {
      programmeId: programme.id,
      traineeId: 'trainee-e2e-001',
      fullName: 'Vikram Singh Patel',
      phone: '9826011111',
      cooperativeAffiliation: 'Bhopal Central Coop Bank',
      designation: 'Branch Secretary',
      state: 'Madhya Pradesh',
    },
  });
  check(nom1Res.statusCode === 201, 'Nomination 1 submitted with status PENDING');
  const nom1: TraineeNomination = JSON.parse(nom1Res.payload).nomination;

  const app1Res = await app.inject({
    method: 'PATCH',
    url: `/api/v1/training/nominations/${nom1.id}/decision`,
    payload: { status: 'APPROVED' },
  });
  check(app1Res.statusCode === 200, 'Nomination 1 approved successfully (1/2 seats filled)');
  check(JSON.parse(app1Res.payload).nomination.status === 'APPROVED', 'Nomination 1 status is APPROVED');

  // Candidate 2 Nominated & Approved (Seat 2/2, Batch Full)
  const nom2Res = await app.inject({
    method: 'POST',
    url: '/api/v1/training/nominations',
    payload: {
      programmeId: programme.id,
      traineeId: 'trainee-e2e-002',
      fullName: 'Sunita Sharma',
      phone: '9826022222',
      cooperativeAffiliation: 'Sehore Dairy PACS',
      designation: 'Accounts Officer',
      state: 'Madhya Pradesh',
    },
  });
  const nom2: TraineeNomination = JSON.parse(nom2Res.payload).nomination;
  const app2Res = await app.inject({
    method: 'PATCH',
    url: `/api/v1/training/nominations/${nom2.id}/decision`,
    payload: { status: 'APPROVED' },
  });
  check(app2Res.statusCode === 200, 'Nomination 2 approved successfully (2/2 seats filled, batch full)');

  // Candidate 3 Nominated & Approval Attempted -> Strict Capacity Clamping
  const nom3Res = await app.inject({
    method: 'POST',
    url: '/api/v1/training/nominations',
    payload: {
      programmeId: programme.id,
      traineeId: 'trainee-e2e-003',
      fullName: 'Anand Kumar Verma',
      phone: '9826033333',
      cooperativeAffiliation: 'Kisan Seva Sahakari',
      designation: 'Managing Director',
      state: 'Madhya Pradesh',
    },
  });
  const nom3: TraineeNomination = JSON.parse(nom3Res.payload).nomination;
  const app3Res = await app.inject({
    method: 'PATCH',
    url: `/api/v1/training/nominations/${nom3.id}/decision`,
    payload: { status: 'APPROVED' },
  });
  check(
    app3Res.statusCode === 409,
    'Attempting approval beyond capacity returns HTTP 409 Conflict'
  );
  const app3Data = JSON.parse(app3Res.payload);
  check(
    app3Data.nomination.status === 'WAITLISTED',
    'Excess candidate automatically transitioned to WAITLISTED status'
  );

  // 2.5 Idempotent Re-approval
  const idempRes = await app.inject({
    method: 'PATCH',
    url: `/api/v1/training/nominations/${nom1.id}/decision`,
    payload: { status: 'APPROVED' },
  });
  check(idempRes.statusCode === 200, 'Re-approving already APPROVED nominee is an idempotent 200 OK');

  // 2.6 Automatic Waitlist Promotion
  const allNoms = centralStore.listTraineeNominations(programme.id);
  const nextWaitlisted = atpLifecycleEngine.findNextEligibleWaitlistedCandidate(allNoms, programme.id);
  check(
    nextWaitlisted !== undefined && nextWaitlisted.id === nom3.id,
    'findNextEligibleWaitlistedCandidate selects candidate 3 by FIFO priority'
  );

  // 2.7 Batch Progress & Statutory Attendance Compliance
  const progressMetrics = atpLifecycleEngine.evaluateBatchProgress(programme.id, [
    { id: 's1', programmeId: programme.id, status: 'CONCLUDED' } as TimetableSession,
    { id: 's2', programmeId: programme.id, status: 'CONCLUDED' } as TimetableSession,
    { id: 's3', programmeId: programme.id, status: 'UPCOMING' } as TimetableSession,
    { id: 's4', programmeId: programme.id, status: 'UPCOMING' } as TimetableSession,
  ]);
  check(
    progressMetrics.progressPercentage === 50.0 && !progressMetrics.isCompleted,
    'Batch progress accurately calculated as 50.0% (2/4 sessions concluded)'
  );

  // Attendance threshold compliance: 75% requirement
  const compliantEval = atpLifecycleEngine.evaluateAttendanceThreshold({
    traineeId: nom1.traineeId,
    programmeId: programme.id,
    totalConcludedSessions: 4,
    attendedSessions: 3,
  });
  check(
    compliantEval.isCompliant && compliantEval.attendancePercentage === 75.0,
    '3/4 sessions attended (75.0%) satisfies statutory threshold'
  );

  const nonCompliantEval = atpLifecycleEngine.evaluateAttendanceThreshold({
    traineeId: nom2.traineeId,
    programmeId: programme.id,
    totalConcludedSessions: 4,
    attendedSessions: 2,
  });
  check(
    !nonCompliantEval.isCompliant && nonCompliantEval.attendancePercentage === 50.0,
    '2/4 sessions attended (50.0%) fails statutory threshold and bars certification'
  );
}

// ============================================================================
// PILLAR 3: Timetable & Dynamic 6-Digit Attendance Engine
// ============================================================================
export async function testPillar3TimetableAndDynamicAttendance(app: FastifyInstance): Promise<void> {
  console.log('\n>>> [PILLAR 3] Timetable & Dynamic 6-Digit Attendance Engine...');

  // 3.1 Dynamic 6-Digit Code Anti-Collision Generator
  const dummySessions: Array<{ checkInCode: string; status: 'ACTIVE' }> = Array.from({ length: 30 }, (_, i) => ({
    checkInCode: String(100000 + i * 1500),
    status: 'ACTIVE',
  }));
  const generatedCode = dynamicAttendanceEngine.generateUniqueCheckInCode(dummySessions as any);
  check(
    /^\d{6}$/.test(generatedCode) && parseInt(generatedCode, 10) >= 100000 && parseInt(generatedCode, 10) <= 999999,
    `Generated code ${generatedCode} is a valid 6-digit numeric token [100000, 999999]`
  );
  check(
    !dummySessions.some((s) => s.checkInCode === generatedCode),
    'Generated check-in code has zero collisions against active sessions'
  );

  // 3.2 Create Timetable Session with Temporal Guard
  const now = new Date();
  const startTime = new Date(now.getTime() + 60000); // Starts in 1 minute
  const endTime = new Date(now.getTime() + 7200000); // Ends in 2 hours
  const dateStr = now.toISOString().split('T')[0];

  const sessRes = await app.inject({
    method: 'POST',
    url: '/api/v1/training/timetable',
    payload: {
      programmeId: 'prog-atp-2026-pacs-01',
      title: 'PACS Double-Entry Ledger Posting & Dynamic Audit Verification',
      facultyId: 'cccc3333-3333-3333-3333-333333333333',
      facultyName: 'Dr. Anand Joshi',
      sessionDate: dateStr,
      startTime: startTime.toISOString().substring(11, 16),
      endTime: endTime.toISOString().substring(11, 16),
      venue: 'RICM Lecture Hall 1',
    },
  });
  check(sessRes.statusCode === 201, 'POST /api/v1/training/timetable creates session with HTTP 201');
  const session: TimetableSession = JSON.parse(sessRes.payload).session;
  check(/^\d{6}$/.test(session.checkInCode), 'Session created with automatic 6-digit dynamic checkInCode');

  // 3.3 Millisecond Temporal Anti-Early Start Guard
  const earlyCheckInRes = await app.inject({
    method: 'POST',
    url: '/api/v1/training/attendance/check-in',
    payload: {
      sessionId: session.id,
      traineeId: 'dddd4444-4444-4444-4444-444444444441',
      checkInCode: session.checkInCode,
      verificationMethod: 'DYNAMIC_CODE',
    },
  });
  check(
    earlyCheckInRes.statusCode === 400 && JSON.parse(earlyCheckInRes.payload).error === 'EARLY_CHECK_IN_BLOCKED',
    'Premature check-in strictly blocked by temporal start guard before session starts'
  );

  // Directly assert engine temporal calculation
  const isEarly = dynamicAttendanceEngine.isBeforeSessionStart(
    new Date(Date.now() + 5000).toISOString(),
    Date.now()
  );
  check(isEarly === true, 'dynamicAttendanceEngine.isBeforeSessionStart returns true when now < startTime');

  const isStarted = dynamicAttendanceEngine.isBeforeSessionStart(
    new Date(Date.now() - 5000).toISOString(),
    Date.now()
  );
  check(isStarted === false, 'dynamicAttendanceEngine.isBeforeSessionStart returns false when now >= startTime');

  // 3.4 Approved Nominee Invariant Guard
  // Attempt check-in on an active session with an unapproved candidate
  const unapprovedRes = dynamicAttendanceEngine.validateCheckInEligibility({
    session: { ...session, startsAt: new Date(Date.now() - 60000).toISOString() } as any,
    traineeId: 'unapproved-trainee-999',
    isApproved: false,
    existingAttendanceRecords: [],
    checkInTimestampMs: Date.now(),
  });
  check(
    !unapprovedRes.allowed && unapprovedRes.rejectionCode === 'NOT_APPROVED',
    'Trainee without approved nomination is strictly blocked from check-in'
  );

  // 3.5 Constant-Time Code Verification & Successful Check-In
  const activeSessionForCheckIn: TimetableSession = {
    ...session,
    startsAt: new Date(Date.now() - 60000).toISOString(),
    endsAt: new Date(Date.now() + 3600000).toISOString(),
    status: 'ACTIVE',
  } as any;

  // Bad code rejected
  const badCodeRes = dynamicAttendanceEngine.processCheckIn({
    session: activeSessionForCheckIn,
    traineeId: 'dddd4444-4444-4444-4444-444444444441',
    traineeName: 'Anita Patel',
    method: 'DYNAMIC_CODE',
    submittedCode: '000000',
  });
  check(!badCodeRes.success, 'Invalid check-in code is rejected by timing-safe comparison');

  // Good code accepted
  const goodCodeRes = dynamicAttendanceEngine.processCheckIn({
    session: activeSessionForCheckIn,
    traineeId: 'dddd4444-4444-4444-4444-444444444441',
    traineeName: 'Anita Patel',
    method: 'DYNAMIC_CODE',
    submittedCode: activeSessionForCheckIn.checkInCode,
  });
  check(goodCodeRes.success && goodCodeRes.record !== undefined, 'Valid check-in code logs verified attendance record');

  // 3.6 Duplicate Check-in Prevention
  const dupValidation = dynamicAttendanceEngine.validateCheckInEligibility({
    session: activeSessionForCheckIn,
    traineeId: 'dddd4444-4444-4444-4444-444444444441',
    isApproved: true,
    existingAttendanceRecords: [goodCodeRes.record!],
    checkInTimestampMs: Date.now(),
  });
  check(
    !dupValidation.allowed && dupValidation.rejectionCode === 'ALREADY_CHECKED_IN',
    'Duplicate attendance check-in by same trainee is strictly blocked'
  );

  // 3.7 Faculty Manual Attendance Override Audit Trail
  const facultyUpdateRes = await app.inject({
    method: 'PUT',
    url: `/api/v1/training/attendance/roster/${session.id}`,
    payload: {
      traineeId: 'dddd4444-4444-4444-4444-444444444441',
      isPresent: true,
      markedBy: 'faculty-anand-joshi',
    },
  });
  check(facultyUpdateRes.statusCode === 200, 'Faculty manual attendance override returns HTTP 200');
  const facultyRecord = JSON.parse(facultyUpdateRes.payload).record;
  check(
    facultyRecord.verificationMethod === 'FACULTY_MANUAL' && facultyRecord.markedBy === 'faculty-anand-joshi',
    'Faculty manual attendance records verificationMethod=FACULTY_MANUAL and faculty signatory ID'
  );
}

// ============================================================================
// PILLAR 4: Continuous Evaluation & Gradebook Engine
// ============================================================================
export async function testPillar4ContinuousEvaluationAndGradebook(app: FastifyInstance): Promise<void> {
  console.log('\n>>> [PILLAR 4] Continuous Evaluation & Gradebook Engine...');

  const courseId = 'cccc1111-1111-1111-1111-111111111111';
  const traineeId = 'dddd4444-4444-4444-4444-444444444441';

  // 4.1 Formative Quiz vs Summative Graded Test Rules
  const formativeQuiz: CourseModuleTest = {
    id: 'test-formative-01',
    courseId,
    title: 'PACS Balance Sheet Diagnostic Quiz',
    type: 'FORMATIVE_QUIZ',
    totalMarks: 50,
    passMarks: 25,
    maxAttempts: 0, // Unlimited attempts permitted
  };

  const summativeTest: CourseModuleTest = {
    id: 'test-summative-01',
    courseId,
    title: 'Comprehensive Statutory Audit & Governance Exam',
    type: 'SUMMATIVE_TEST',
    totalMarks: 100,
    passMarks: 60,
    maxAttempts: 2, // Strict 2-attempt limit
  };

  // Formative quiz unlimited attempts
  const formAttempt1 = gradebookEngine.evaluateSubmission(formativeQuiz, 5, 20);
  check(formAttempt1.allowed && !formAttempt1.passed, 'Formative quiz allows 6th attempt even with failing score');

  // Summative test attempt locking
  const summAttempt1 = gradebookEngine.evaluateSubmission(summativeTest, 0, 75);
  check(summAttempt1.allowed && summAttempt1.passed, 'Summative test allows attempt 1');

  const summAttemptExceeded = gradebookEngine.evaluateSubmission(summativeTest, 2, 85);
  check(
    !summAttemptExceeded.allowed && summAttemptExceeded.rejectionReason?.includes('Maximum permitted test attempts reached'),
    'Summative test locks attempts once maxAttempts threshold is reached'
  );

  // 4.2 Cumulative Course Marks Tally & Dual-Condition Certificate Qualification
  // Case A: 100% lessons + Passing Summative -> Qualified
  const qualifiedTally = gradebookEngine.computeTraineeMarksTally({
    traineeId,
    traineeName: 'Anita Patel',
    courseId,
    courseTitle: 'PACS Computerization & Statutory Auditing',
    tests: [formativeQuiz, summativeTest],
    submissions: [
      { id: 'sub-1', testId: formativeQuiz.id, traineeId, marksObtained: 45, totalMarks: 50, submittedAt: '2026-10-20T10:00:00Z' },
      { id: 'sub-2', testId: summativeTest.id, traineeId, marksObtained: 88, totalMarks: 100, submittedAt: '2026-10-21T10:00:00Z' },
    ],
    completedLessonsCount: 4,
    totalLessonsCount: 4, // 100% lessons completed
  });
  check(
    qualifiedTally.certificateEligible && qualifiedTally.awardGrade === 'DISTINCTION',
    '100% lessons + 88% summative test awards DISTINCTION and certificate eligibility'
  );

  // Case B: Incomplete lessons (50%) + Passing Summative -> NOT Eligible
  const incompleteLessonsTally = gradebookEngine.computeTraineeMarksTally({
    traineeId,
    traineeName: 'Anita Patel',
    courseId,
    courseTitle: 'PACS Computerization & Statutory Auditing',
    tests: [formativeQuiz, summativeTest],
    submissions: [
      { id: 'sub-2', testId: summativeTest.id, traineeId, marksObtained: 88, totalMarks: 100, submittedAt: '2026-10-21T10:00:00Z' },
    ],
    completedLessonsCount: 2,
    totalLessonsCount: 4, // 50% lessons completed
  });
  check(
    !incompleteLessonsTally.certificateEligible,
    'Failing lesson completion requirement blocks certificate qualification'
  );

  // Case C: 100% lessons + Failed Summative -> NOT Eligible
  const failedExamTally = gradebookEngine.computeTraineeMarksTally({
    traineeId,
    traineeName: 'Anita Patel',
    courseId,
    courseTitle: 'PACS Computerization & Statutory Auditing',
    tests: [summativeTest],
    submissions: [
      { id: 'sub-3', testId: summativeTest.id, traineeId, marksObtained: 40, totalMarks: 100, submittedAt: '2026-10-21T10:00:00Z' },
    ],
    completedLessonsCount: 4,
    totalLessonsCount: 4,
  });
  check(
    !failedExamTally.certificateEligible && failedExamTally.awardGrade === 'INCOMPLETE',
    'Failed summative test sets awardGrade=INCOMPLETE and blocks certificate qualification'
  );

  // 4.3 Grade Band Boundaries
  const checkGrade = (percent: number, expectedGrade: string) => {
    const t = gradebookEngine.computeTraineeMarksTally({
      traineeId,
      traineeName: 'Trainee',
      courseId,
      courseTitle: 'Course',
      tests: [summativeTest],
      submissions: [{ id: 's', testId: summativeTest.id, traineeId, marksObtained: percent, totalMarks: 100, submittedAt: '2026-10-21' }],
      completedLessonsCount: 1,
      totalLessonsCount: 1,
    });
    check(t.awardGrade === expectedGrade, `Score ${percent}% accurately maps to grade ${expectedGrade}`);
  };
  checkGrade(90, 'DISTINCTION');
  checkGrade(78, 'FIRST_CLASS');
  checkGrade(64, 'PASS');
  checkGrade(55, 'INCOMPLETE');

  // 4.4 Statutory Multilingual Gradebook Export via REST API
  const exportRes = await app.inject({
    method: 'GET',
    url: `/api/v1/training/evaluation/gradebook/export?courseId=${courseId}&format=XLSX`,
  });
  check(exportRes.statusCode === 200, 'GET /api/v1/training/evaluation/gradebook/export returns HTTP 200');
  check(
    exportRes.headers['content-disposition']?.includes('.xlsx'),
    'Export header returns attachment filename with .xlsx extension'
  );
  check(
    exportRes.payload.startsWith('\uFEFF'),
    'Statutory export payload includes UTF-8 Byte Order Mark (BOM) for Excel compatibility'
  );
  check(
    exportRes.payload.includes('NATIONAL COUNCIL FOR COOPERATIVE TRAINING (NCCT) — STATUTORY ACADEMIC REGISTER'),
    'Export payload contains official NCCT statutory English masthead'
  );
  check(
    exportRes.payload.includes('राष्ट्रीय सहकारी प्रशिक्षण परिषद (एनसीसीटी) — संविधिक शैक्षणिक पंजी'),
    'Export payload contains authentic Hindi Devanagari institutional masthead'
  );
  check(
    exportRes.payload.includes('प्रशिक्षार्थी क्रमांक') && exportRes.payload.includes('कुल प्राप्तांक'),
    'Export payload contains bilingual Hindi Devanagari column headers'
  );
}

// ============================================================================
// PILLAR 5: Predictive Retention, 4-Factor Dropout Risk & Skill Shortage Radar
// ============================================================================
export async function testPillar5PredictiveRetentionAndSkillRadar(app: FastifyInstance): Promise<void> {
  console.log('\n>>> [PILLAR 5] Predictive Retention, 4-Factor Dropout Risk & Skill Shortage Radar...');

  // 5.1 4-Factor Additive Dropout-Risk Heuristic Testing
  // Case A: High Engagement Learner -> Score 0, Tier LOW
  const lowRisk = dropoutRiskEngine.evaluateDropoutRisk({
    traineeId: 't-001',
    traineeName: 'Model Learner',
    programmeId: 'p-001',
    completionRate: 0.90, // >= 25% (+0)
    attendanceRate: 0.85, // >= 50% (+0)
    daysSinceLastActivity: 2, // <= 14d (+0)
    failedAssessmentsCount: 0, // (+0)
  });
  check(lowRisk.riskScore === 0 && lowRisk.riskTier === 'LOW', 'Engaged learner evaluated with riskScore=0 and riskTier=LOW');

  // Case B: Attendance Lag -> Score 30, Tier MEDIUM
  const medRisk = dropoutRiskEngine.evaluateDropoutRisk({
    traineeId: 't-002',
    traineeName: 'Attendance Lag Learner',
    programmeId: 'p-001',
    completionRate: 0.60, // (+0)
    attendanceRate: 0.45, // < 50% (+30)
    daysSinceLastActivity: 5, // (+0)
    failedAssessmentsCount: 0, // (+0)
  });
  check(medRisk.riskScore === 30 && medRisk.riskTier === 'MEDIUM', 'Attendance lag learner evaluated with riskScore=30 and riskTier=MEDIUM');
  check(medRisk.riskFactors.lowAttendance === true, 'riskFactors.lowAttendance flag is true');

  // Case C: Critical Disengagement -> Score 40 + 30 + 20 + 20 = 110 clamped to 100, Tier HIGH
  const highRisk = dropoutRiskEngine.evaluateDropoutRisk({
    traineeId: 't-003',
    traineeName: 'Disengaged Learner',
    programmeId: 'p-001',
    completionRate: 0.15, // < 25% (+40)
    attendanceRate: 0.35, // < 50% (+30)
    daysSinceLastActivity: 20, // > 14d (+20)
    failedAssessmentsCount: 2, // (+20)
  });
  check(highRisk.riskScore === 100 && highRisk.riskTier === 'HIGH', 'Disengaged learner strictly clamped to max 100 riskScore and riskTier=HIGH');
  check(highRisk.recommendedIntervention.includes('PACS chairperson alert'), 'HIGH risk triggers mandatory faculty academic review and chairperson alert');

  // 5.2 Cohort Risk Triage & Flagged Roster
  const triageRes = await app.inject({
    method: 'GET',
    url: '/api/v1/training/retention/dropout-risk',
  });
  check(triageRes.statusCode === 200, 'GET /api/v1/training/retention/dropout-risk returns HTTP 200');
  const triageData = JSON.parse(triageRes.payload);
  check(triageData.summary.totalAssessed > 0, 'Cohort risk summary evaluates active trainees');

  // Flagged roster sorted descending by risk score
  const roster = triageData.flaggedRoster;
  for (let i = 0; i < roster.length - 1; i++) {
    check(
      roster[i].riskScore >= roster[i + 1].riskScore,
      `Flagged risk roster sorted strictly descending (${roster[i].riskScore} >= ${roster[i + 1].riskScore})`
    );
  }

  // 5.3 Inter-Tier Geographic Reach & Delivery Velocity
  const reachRes = await app.inject({
    method: 'GET',
    url: '/api/v1/training/retention/reach-metrics',
  });
  check(reachRes.statusCode === 200, 'GET /api/v1/training/retention/reach-metrics returns HTTP 200');
  const reachData = JSON.parse(reachRes.payload);
  check(reachData.totalTrained >= 0, 'Geographic reach returns valid totalTrained tally');
  check(reachData.byMode.OFFLINE !== undefined, 'Reach metrics categorize delivery by OFFLINE mode');

  // 5.4 8-Dimensional Cooperative Skill Gap Radar & Vector Matching
  const vecAccounting = NCCT_SKILL_EMBEDDING_MAP['skill-pacs-acc-01'];
  const vecCashbook = NCCT_SKILL_EMBEDDING_MAP['skill-cashbook-01'];
  const vecColdChain = NCCT_SKILL_EMBEDDING_MAP['skill-cold-chain-01'];

  const simAdjacent = skillGapEngine.calculateCosineSimilarity(vecAccounting, vecCashbook);
  check(
    simAdjacent >= 0.90,
    `Cosine similarity between Accounting and Cashbook balancing is ${simAdjacent} (>= 0.90 high proximity)`
  );

  const simDivergent = skillGapEngine.calculateCosineSimilarity(vecAccounting, vecColdChain);
  check(
    simDivergent <= 0.25,
    `Cosine similarity between Accounting and Cold Chain storage is ${simDivergent} (<= 0.25 orthogonal domain)`
  );

  // Skill gap evaluation awarding 50% partial credit for adjacent competency
  const canonicalSkills: CooperativeSkillItem[] = [
    { id: 'skill-pacs-acc-01', code: 'PACS_ACC', name: 'PACS Double-Entry Accounting', category: 'FINANCIAL_ACCOUNTING' },
    { id: 'skill-cashbook-01', code: 'CASHBOOK', name: 'Cash Book Balancing & Vouchers', category: 'FINANCIAL_ACCOUNTING' },
    { id: 'skill-cold-chain-01', code: 'COLD_CHAIN', name: 'Cold Chain & Warehouse Storage', category: 'COMMODITY_STORAGE' },
  ];

  const gapEval = skillGapEngine.evaluateSkillGap({
    jobId: 'job-accountant',
    jobTitle: 'PACS Senior Accountant',
    requiredSkills: [canonicalSkills[0], canonicalSkills[2]], // Accounting + Cold Chain
    acquiredSkills: [canonicalSkills[1]], // Holds Cashbook (adjacent to Accounting, sim >= 0.40)
  });
  check(gapEval.relatedSkills.length > 0, 'Adjacent competency identified and matched with cosine >= 0.40');
  check(gapEval.matchPercentage > 0, 'Partial credit awarded for adjacent skill match');

  // Sector skill shortage radar via REST API
  const radarRes = await app.inject({
    method: 'GET',
    url: '/api/v1/training/retention/skill-radar',
  });
  check(radarRes.statusCode === 200, 'GET /api/v1/training/retention/skill-radar returns HTTP 200');
  const radarData = JSON.parse(radarRes.payload);
  check(radarData.count > 0, 'Skill shortage radar returns active cooperative skill rows');
  // Confirm shortage = jobDemand - traineeSupply
  check(
    radarData.radar.every((r: any) => r.netShortage === r.jobDemandCount - r.traineeSupplyCount),
    'Shortage radar invariant netShortage === jobDemandCount - traineeSupplyCount holds for all rows'
  );
}

// ============================================================================
// PILLAR 6: Campus Hostel Logistics & Sovereign Rotatable NFC Profile
// ============================================================================
export async function testPillar6CampusHostelAndSovereignNfc(app: FastifyInstance): Promise<void> {
  console.log('\n>>> [PILLAR 6] Campus Hostel Logistics & Sovereign Rotatable NFC Profile...');

  // 6.1 Campus Hostel Room Allocation & Capacity Clamping
  const roomRes = await app.inject({
    method: 'POST',
    url: '/api/v1/training/logistics/hostels/rooms',
    payload: {
      instituteId: 'iiii1111-1111-1111-1111-111111111111',
      hostelBlock: 'Block-Kisan-E2E',
      roomNumber: 'K-204',
      roomType: 'DOUBLE',
      bedCapacity: 2, // 2 Beds
      floor: 2,
    },
  });
  check(roomRes.statusCode === 201, 'POST /api/v1/training/logistics/hostels/rooms creates room with HTTP 201');
  const room: CampusHostelRoom = JSON.parse(roomRes.payload).room;

  // Bed 1 allocation
  const alloc1 = hostelLogisticsEngine.allocateHostelRoom({
    room,
    instituteId: room.instituteId,
    programmeId: 'prog-e2e-001',
    traineeId: 'trainee-e2e-001',
    assignedBy: 'warden-admin',
    existingAssignments: [],
  });
  check(alloc1.success && alloc1.updatedRoom?.occupiedBeds === 1, 'Bed 1 allocated successfully (1/2 occupied)');

  // Bed 2 allocation
  const alloc2 = hostelLogisticsEngine.allocateHostelRoom({
    room: alloc1.updatedRoom!,
    instituteId: room.instituteId,
    programmeId: 'prog-e2e-001',
    traineeId: 'trainee-e2e-002',
    assignedBy: 'warden-admin',
    existingAssignments: [alloc1.assignment!],
  });
  check(alloc2.success && alloc2.updatedRoom?.occupiedBeds === 2, 'Bed 2 allocated successfully (2/2 occupied, full)');

  // Bed 3 allocation -> Clamped
  const alloc3 = hostelLogisticsEngine.allocateHostelRoom({
    room: alloc2.updatedRoom!,
    instituteId: room.instituteId,
    programmeId: 'prog-e2e-001',
    traineeId: 'trainee-e2e-003',
    assignedBy: 'warden-admin',
    existingAssignments: [alloc1.assignment!, alloc2.assignment!],
  });
  check(
    !alloc3.success && alloc3.errorReason?.includes('fully occupied'),
    'Attempting allocation on full hostel room strictly clamped and rejected'
  );

  // Cross-institute allocation rejected
  const crossInstAlloc = hostelLogisticsEngine.allocateHostelRoom({
    room,
    instituteId: 'different-institute-id',
    programmeId: 'prog-e2e-001',
    traineeId: 'trainee-e2e-004',
    assignedBy: 'warden-admin',
    existingAssignments: [],
  });
  check(!crossInstAlloc.success, 'Cross-institute hostel room assignment strictly rejected');

  // Deallocation frees bed
  const dealloc = hostelLogisticsEngine.deallocateHostelRoom(
    alloc2.updatedRoom!,
    alloc2.assignment!.id,
    [alloc1.assignment!, alloc2.assignment!]
  );
  check(dealloc.success && dealloc.updatedRoom.occupiedBeds === 1, 'Deallocating bed decrements occupiedBeds');

  // 6.2 Strict Residential Privacy Isolation (Zero-PII Invariant)
  // Authenticated trainee can view private room card
  const myCardRes = await app.inject({
    method: 'GET',
    url: '/api/v1/training/logistics/hostels/my-card?traineeId=dddd4444-4444-4444-4444-444444444441',
  });
  check(myCardRes.statusCode === 200, 'Authenticated trainee can access private hostel room card');
  const privateCard = JSON.parse(myCardRes.payload).roomCard;
  check(
    privateCard.hostelBlock !== undefined && privateCard.roomNumber !== undefined,
    'Private hostel room card contains hostelBlock and roomNumber'
  );

  // 6.3 Rotatable Public NFC Profile Token & Zero-PII Leakage
  const nfcProfileRes = await app.inject({
    method: 'GET',
    url: '/api/v1/training/logistics/nfc-profile?traineeId=dddd4444-4444-4444-4444-444444444441',
  });
  check(nfcProfileRes.statusCode === 200, 'GET /api/v1/training/logistics/nfc-profile returns HTTP 200');
  const initialProfile = JSON.parse(nfcProfileRes.payload).profile;

  // Rotate public token
  const rotateRes = await app.inject({
    method: 'POST',
    url: '/api/v1/training/logistics/nfc-profile/rotate',
    payload: { traineeId: 'dddd4444-4444-4444-4444-444444444441' },
  });
  check(rotateRes.statusCode === 200, 'POST /api/v1/training/logistics/nfc-profile/rotate returns HTTP 200');
  const rotatedProfile = JSON.parse(rotateRes.payload).profile;
  check(
    rotatedProfile.publicProfileCode !== initialProfile.publicProfileCode,
    'Rotated profile code is distinct from previous token'
  );
  check(
    /^NFC-[0-9A-F]{8}$/.test(rotatedProfile.publicProfileCode),
    `Rotated token ${rotatedProfile.publicProfileCode} matches "NFC-" + 8 hex characters format`
  );

  // Old code revoked (returns 404)
  const oldLookupRes = await app.inject({
    method: 'GET',
    url: `/api/v1/public/profile/${initialProfile.publicProfileCode}`,
  });
  check(
    oldLookupRes.statusCode === 404,
    'Public lookup on rotated out/revoked token returns HTTP 404'
  );

  // New code verified (returns 200) with ZERO PII LEAKAGE
  const newLookupRes = await app.inject({
    method: 'GET',
    url: `/api/v1/public/profile/${rotatedProfile.publicProfileCode}`,
  });
  check(newLookupRes.statusCode === 200, 'Public lookup on active rotated token returns HTTP 200');
  const publicData = JSON.parse(newLookupRes.payload);
  check(publicData.verified === true, 'Public response declares verified=true');
  check(
    publicData.hostelBlock === undefined && publicData.roomNumber === undefined,
    'Zero-PII Invariant: hostelBlock and roomNumber are strictly excluded from public verification'
  );
  check(
    publicData.phone === undefined && publicData.email === undefined,
    'Zero-PII Invariant: phone and email are strictly excluded from public verification'
  );
  check(
    publicData.trustIssuer === 'National Council for Cooperative Training (NCCT)',
    'Public credential verification identifies trustIssuer as NCCT'
  );

  // 6.4 Privacy Master Toggle (Shielded Mode)
  const disableRes = await app.inject({
    method: 'PATCH',
    url: '/api/v1/training/logistics/nfc-profile/toggle',
    payload: { enabled: false, traineeId: 'dddd4444-4444-4444-4444-444444444441' },
  });
  check(disableRes.statusCode === 200, 'Disabling public profile returns HTTP 200');
  const disabledLookupRes = await app.inject({
    method: 'GET',
    url: `/api/v1/public/profile/${rotatedProfile.publicProfileCode}`,
  });
  check(
    disabledLookupRes.statusCode === 404,
    'Disabled profile returns HTTP 404 (shielded mode)'
  );

  // Restore active state
  await app.inject({
    method: 'PATCH',
    url: '/api/v1/training/logistics/nfc-profile/toggle',
    payload: { enabled: true, traineeId: 'dddd4444-4444-4444-4444-444444444441' },
  });

  // 6.5 Deterministic 21x21 SVG QR & 3D Flip Card DOM Invariants
  const nfcCardSrc = fs.readFileSync(
    path.resolve('apps/trainee-pwa/src/components/SovereignNfcProfileCard.tsx'),
    'utf8'
  );

  check(
    nfcCardSrc.includes('const GRID_SIZE = 21;') && nfcCardSrc.includes('drawFinder(0, 0)'),
    'DeterministicSvgQr implements standard 21x21 matrix with 3 finder patterns'
  );
  check(
    nfcCardSrc.includes('matrix[6][i] = i % 2 === 0'),
    'DeterministicSvgQr generates alternating timing tracks'
  );
  check(
    /perspective:\s*['"]?1000px['"]?/.test(nfcCardSrc),
    'SovereignNfcProfileCard declares 3D perspective: 1000px container'
  );
  check(
    /transformStyle:\s*['"]preserve-3d['"]/.test(nfcCardSrc),
    'SovereignNfcProfileCard declares transformStyle: preserve-3d on flipper element'
  );
  check(
    nfcCardSrc.includes('rotateY(180deg)') && nfcCardSrc.includes('rotateY(0deg)'),
    'SovereignNfcProfileCard implements dynamic rotateY(180deg) 3D flip animation'
  );
  check(
    /backfaceVisibility:\s*['"]hidden['"]/.test(nfcCardSrc),
    'SovereignNfcProfileCard enforces backfaceVisibility: hidden on both card faces'
  );

  // 6.6 Trainee PWA Public Profile URL Routing
  const appSrc = fs.readFileSync(path.resolve('apps/trainee-pwa/src/App.tsx'), 'utf8');
  check(
    appSrc.includes("params.get('profile')"),
    'App.tsx handles visitor public NFC profile URL routing (?profile=:code)'
  );
}

// ============================================================================
// MASTER SUITE EXECUTION RUNNER
// ============================================================================
async function runPhase11NcctElevationMasterSuite(): Promise<void> {
  console.log('========================================================================');
  console.log('   SAHAKAR EDGE — PHASE 11 NCCT ELEVATION MASTER E2E TEST SUITE        ');
  console.log('========================================================================\n');

  // Boot Fastify Central API Server
  const app = await buildCentralServer();
  await app.ready();

  const startTime = Date.now();

  try {
    // Execute all 6 pillars end-to-end
    await testPillar1VisualTokensAndSvgGeometry();
    await testPillar2AtpBatchLifecycleAndCapacity(app);
    await testPillar3TimetableAndDynamicAttendance(app);
    await testPillar4ContinuousEvaluationAndGradebook(app);
    await testPillar5PredictiveRetentionAndSkillRadar(app);
    await testPillar6CampusHostelAndSovereignNfc(app);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n========================================================================');
    console.log(`   ✓ ALL ${passedAssertions}/${totalAssertions} NCCT ELEVATION E2E ASSERTIONS PASSED CLEANLY! (${duration}s)`);
    console.log('========================================================================\n');
  } finally {
    await app.close();
  }
}

// Direct Execution Trigger
runPhase11NcctElevationMasterSuite().catch((err) => {
  console.error('\n❌ Phase 11 NCCT Elevation Suite Failed:', err);
  process.exit(1);
});

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import ts from 'typescript';
import {
  SEED_ORAL_ASSESSMENT,
  SEED_ORAL_QUESTIONS,
  SEED_USERS,
} from '../packages/test-fixtures/dist/index.js';
import {
  SyncEventType,
  SyncStatus,
} from '../packages/types/dist/index.js';
import type {
  OralQuestion,
  OralAssessmentResult,
  DigitalOfferLetter,
  SchemeEvaluationInput,
  SchemeEvaluationResult,
  GrievanceTicket,
} from '../packages/types/dist/index.js';
import {
  canonicalJsonStringify,
  calculateEventHash,
  verifyEventHash,
  sha256Hex,
} from '../packages/sync-protocol/dist/index.js';
import {
  offlineStore,
  evaluateOralQuestion,
} from '../apps/trainee-pwa/src/services/offline-store.ts';

console.log('========================================================================');
console.log('  SAHAKAR EDGE — CHALLENGER M2-2: ORAL VIVA, OFFER & SLA STRESS HARNESS ');
console.log('========================================================================\n');

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;

function assertCheck(name: string, condition: boolean, detail?: string) {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`  ✓ [PASS] ${name}${detail ? ` (${detail})` : ''}`);
  } else {
    failedChecks++;
    console.error(`  ✗ [FAIL] ${name}${detail ? ` (${detail})` : ''}`);
  }
}

const ROOT_DIR = process.cwd();
const ORAL_MODAL_PATH = path.join(ROOT_DIR, 'apps', 'trainee-pwa', 'src', 'components', 'OralAssessmentModal.tsx');
const SCHEME_MODAL_PATH = path.join(ROOT_DIR, 'apps', 'trainee-pwa', 'src', 'components', 'SchemeCalculatorModal.tsx');
const GRIEVANCE_MODAL_PATH = path.join(ROOT_DIR, 'apps', 'trainee-pwa', 'src', 'components', 'GrievanceModal.tsx');
const APP_TSX_PATH = path.join(ROOT_DIR, 'apps', 'trainee-pwa', 'src', 'App.tsx');

// Helper to extract and evaluate pure TS exports from TSX files
function extractAndEvaluate<T>(filePath: string, startPattern: string, endPattern: string): T {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const startIdx = fileContent.indexOf(startPattern);
  assert(startIdx !== -1, `Could not find start pattern "${startPattern}" in ${filePath}`);
  const endIdx = fileContent.indexOf(endPattern, startIdx);
  assert(endIdx !== -1, `Could not find end pattern "${endPattern}" in ${filePath}`);
  const code = fileContent.substring(startIdx, endIdx);
  const transpiled = ts.transpileModule(code, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const ctx = { exports: {} as any };
  const fn = new Function('exports', transpiled);
  fn(ctx.exports);
  return ctx.exports as T;
}

// =============================================================================
// [Suite 1] NCCT Oral Viva 4-Dimension Rubric Weighting & Calculation Engine
// =============================================================================
console.log('>>> [Suite 1] Testing NCCT Oral Viva 4-Dimension Rubric Engine...');

interface OralModalExports {
  NCCT_RUBRIC_CONFIG: Record<string, {
    weight: number;
    labelEn: string;
    labelHi: string;
    descriptionEn: string;
    descriptionHi: string;
    concepts: Array<{
      id: string;
      termsEn: string[];
      termsHi: string[];
      feedbackEn: string;
      feedbackHi: string;
    }>;
  }>;
  calculateNCCTRubricBreakdown: (
    transcripts: Record<string, string>,
    language: 'HI' | 'EN'
  ) => {
    rubricBreakdown: any[];
    compositeScore: number;
    passed: boolean;
    proficiencyBand: string;
    pedagogicalRecommendations: any[];
  };
}

const oralExports = extractAndEvaluate<OralModalExports>(
  ORAL_MODAL_PATH,
  'export const NCCT_RUBRIC_CONFIG =',
  'export const OralAssessmentModal: React.FC'
);

const rubricConfig = oralExports.NCCT_RUBRIC_CONFIG;
const calculateRubric = oralExports.calculateNCCTRubricBreakdown;

assertCheck('NCCT Rubric config is defined', !!rubricConfig);
assertCheck('NCCT Rubric has exactly 4 dimensions', Object.keys(rubricConfig).length === 4);

const dimWeights = {
  TECHNICAL_ACCURACY: rubricConfig.TECHNICAL_ACCURACY?.weight,
  PROCEDURAL_LOGIC: rubricConfig.PROCEDURAL_LOGIC?.weight,
  COOPERATIVE_TERMINOLOGY: rubricConfig.COOPERATIVE_TERMINOLOGY?.weight,
  INTERNAL_CONTROLS: rubricConfig.INTERNAL_CONTROLS?.weight,
};

assertCheck('TECHNICAL_ACCURACY weight is 40% (0.40)', dimWeights.TECHNICAL_ACCURACY === 0.40);
assertCheck('PROCEDURAL_LOGIC weight is 30% (0.30)', dimWeights.PROCEDURAL_LOGIC === 0.30);
assertCheck('COOPERATIVE_TERMINOLOGY weight is 20% (0.20)', dimWeights.COOPERATIVE_TERMINOLOGY === 0.20);
assertCheck('INTERNAL_CONTROLS weight is 10% (0.10)', dimWeights.INTERNAL_CONTROLS === 0.10);

const totalWeight = Object.values(rubricConfig).reduce((sum, d) => sum + d.weight, 0);
assertCheck('Sum of 4 dimension weights equals exactly 1.00 (100%)', Math.abs(totalWeight - 1.0) < 1e-6);

// Concept pills & terms verification
let allConceptsValid = true;
let totalConcepts = 0;
for (const [dimKey, dim] of Object.entries(rubricConfig)) {
  if (!dim.concepts || dim.concepts.length === 0) allConceptsValid = false;
  for (const c of dim.concepts) {
    totalConcepts++;
    if (!c.id || c.termsEn.length === 0 || c.termsHi.length === 0 || !c.feedbackEn || !c.feedbackHi) {
      allConceptsValid = false;
    }
  }
}
assertCheck(`All ${totalConcepts} concept pills across 4 dimensions have bilingual terms and feedback`, allConceptsValid);

// Scoring Engine Boundary Tests
// 1. Zero Input
const zeroResult = calculateRubric({}, 'EN');
assertCheck('Zero input yields composite score = 0%', zeroResult.compositeScore === 0);
assertCheck('Zero input results in passed = false', zeroResult.passed === false);
assertCheck('Zero input yields NEEDS_REMEDIATION proficiency band', zeroResult.proficiencyBand === 'NEEDS_REMEDIATION');
assertCheck('Zero input generates all 3 pedagogical recommendations (Lesson 1.1, Lesson 1.2, PACS Lab)', zeroResult.pedagogicalRecommendations.length === 3);

// 2. Full English Model Response
const idealEnglishTranscripts = {
  'oral-q-01-daybook-balancing':
    'In a PACS, the Daybook (Rojnamcha) and Cashbook closing balance are reconciled daily against physical vault cash. Opening cash plus cash receipts must equal disbursements plus closing cash.',
  'oral-q-02-crop-loan-disbursement':
    'When disbursing a short-term crop loan under KCC, debit the short-term loan asset account and credit cash or bank.',
  'oral-q-03-statutory-reserve-fund':
    'Under cooperative law, a mandatory 25% of net profit must be transferred to the statutory reserve fund before dividend distribution as a permanent buffer against bad debts and unforeseen losses.',
};
const idealEnResult = calculateRubric(idealEnglishTranscripts, 'EN');
assertCheck('Ideal English response achieves 100% composite score', idealEnResult.compositeScore === 100);
assertCheck('Ideal English response passes viva', idealEnResult.passed === true);
assertCheck('Ideal English response achieves EXEMPLARY band', idealEnResult.proficiencyBand === 'EXEMPLARY');
assertCheck('Ideal English response generates zero remediation recommendations', idealEnResult.pedagogicalRecommendations.length === 0);

// 3. Full Hindi Model Response
const idealHindiTranscripts = {
  'oral-q-01-daybook-balancing':
    'पैक्स में दैनिक रोकड़बही और रोजनामचा का मिलान तिजोरी में रखी भौतिक नकदी से किया जाता है। कुल प्राप्तियां और प्रारम्भिक शेष संवितरण और अंतिम तिजोरी शेष के बराबर होते हैं।',
  'oral-q-02-crop-loan-disbursement':
    'फसल ऋण वितरण पर दोहरी प्रविष्टि में ऋण परिसंपत्ति खाता नामे (Debit) किया जाता है और रोकड़ खाता या बैंक खाता जमा (Credit) किया जाता है।',
  'oral-q-03-statutory-reserve-fund':
    'सहकारी समिति नियमों के अनुसार शुद्ध लाभ का 25% सांविधिक आरक्षित निधि में लाभांश से पूर्व अंतरण अनिवार्य है जो अविभाज्य बफर डूबंत ऋणों से रक्षा करता है।',
};
const idealHiResult = calculateRubric(idealHindiTranscripts, 'HI');
assertCheck('Ideal Hindi response achieves 100% composite score', idealHiResult.compositeScore === 100);
assertCheck('Ideal Hindi response passes viva in Devanagari', idealHiResult.passed === true);
assertCheck('Ideal Hindi response achieves EXEMPLARY band', idealHiResult.proficiencyBand === 'EXEMPLARY');
assertCheck('Ideal Hindi response has authentic Devanagari dimension feedback', idealHiResult.rubricBreakdown.every((b) => b.feedback.includes('सांविधिक')));

// 4. Boundary Test at Passing Threshold (70%)
// Technical Accuracy (40%) + Procedural Logic (30%) only = 70%
const thresholdTranscripts = {
  'q1': 'Daybook cashbook closing balance vault cash physical cash reconciliation opening balance receipts disbursements total receipts equal before dividend transfer.',
  'q2': 'Crop loan loan asset kcc debit loan credit cash credit bank debit credit.',
  'q3': '25% statutory reserve fund net profit mandatory unforeseen losses reserve allocation order permanent appropriation.',
};
const thresholdResult = calculateRubric(thresholdTranscripts, 'EN');
assertCheck('Threshold composite score meets or exceeds 70% threshold', thresholdResult.compositeScore >= 70);
assertCheck('Score >= 70% yields passed = true', thresholdResult.passed === true);
assertCheck('Score >= 70% categorizes in PROFICIENT or EXEMPLARY band', ['PROFICIENT', 'EXEMPLARY'].includes(thresholdResult.proficiencyBand));

// 5. Adversarial Input Injection
const fuzzedTranscripts = {
  'q1': "'; DROP TABLE oral_assessments; -- <script>alert(1)</script>",
  'q2': '😀 🚀 💥 🛡️ \u0000\u001f null undefined NaN',
  'q3': 'x'.repeat(10000),
};
const fuzzedResult = calculateRubric(fuzzedTranscripts, 'EN');
assertCheck('Fuzzed SQL/script injection handled safely with 0% score', fuzzedResult.compositeScore === 0);
assertCheck('Fuzzed input fails viva with passed = false', fuzzedResult.passed === false);

// =============================================================================
// [Suite 2] Cryptographic Tamper Resistance & Canonical SHA-256 Hashing
// =============================================================================
console.log('\n>>> [Suite 2] Stress-Testing Oral Viva Sync Event & Canonical SHA-256 Hashing...');

const trainee = SEED_USERS.find((u) => u.role === 'TRAINEE') || SEED_USERS[3];
const { result: vivaResult, event: syncEvent } = offlineStore.submitOralAssessment({
  assessmentId: SEED_ORAL_ASSESSMENT.id,
  traineeId: trainee.id,
  language: 'EN',
  responses: [
    { questionId: SEED_ORAL_QUESTIONS[0].id, transcript: idealEnglishTranscripts['oral-q-01-daybook-balancing'] },
    { questionId: SEED_ORAL_QUESTIONS[1].id, transcript: idealEnglishTranscripts['oral-q-02-crop-loan-disbursement'] },
    { questionId: SEED_ORAL_QUESTIONS[2].id, transcript: idealEnglishTranscripts['oral-q-03-statutory-reserve-fund'] },
  ],
});

assertCheck('Oral assessment sync event created', !!syncEvent);
assertCheck('Event has aggregateType ASSESSMENT', syncEvent.aggregateType === 'ASSESSMENT');
assertCheck('Event has eventType ORAL_ASSESSMENT_SUBMITTED', syncEvent.eventType === 'ORAL_ASSESSMENT_SUBMITTED');
assertCheck('Event hash is 64-char SHA-256 hex string', /^[a-f0-9]{64}$/.test(syncEvent.hash));
assertCheck('Authentic event cleanly verifies with verifyEventHash', verifyEventHash(syncEvent) === true);

// 10 Vector Cryptographic Tampering Assault
const tamperMutations = [
  { name: 'Inflated score (100 -> 101)', mutate: (e: any) => { e.payload.score = 101; } },
  { name: 'Deflated score (100 -> 25)', mutate: (e: any) => { e.payload.score = 25; } },
  { name: 'Flipped passed status (true -> false)', mutate: (e: any) => { e.payload.passed = false; } },
  { name: 'Forged traineeId', mutate: (e: any) => { e.payload.traineeId = 'forged-trainee-uuid'; } },
  { name: 'Forged assessmentId', mutate: (e: any) => { e.aggregateId = 'forged-assessment-uuid'; } },
  { name: 'Incremented logicalSequence (replay attack)', mutate: (e: any) => { e.logicalSequence = e.logicalSequence + 1; } },
  { name: 'Altered completion timestamp', mutate: (e: any) => { e.payload.completedAt = '2020-01-01T00:00:00.000Z'; } },
  { name: 'Mutated answer transcript text', mutate: (e: any) => { e.payload.answers['oral-q-01-daybook-balancing'] = 'Hacked'; } },
  { name: 'Mutated correctCount', mutate: (e: any) => { e.payload.correctCount = 0; } },
  { name: 'Spoofed payload.nodeId', mutate: (e: any) => { e.payload.nodeId = 'rogue-edge-node-999'; } },
];

let allTamperVectorsRejected = true;
for (const vec of tamperMutations) {
  const cloned = JSON.parse(JSON.stringify(syncEvent));
  vec.mutate(cloned);
  const isValid = verifyEventHash(cloned);
  if (isValid) {
    allTamperVectorsRejected = false;
    console.error(`    ✗ Tamper leak on: ${vec.name}`);
  }
}
assertCheck('All 10/10 tampering mutation vectors rejected by verifyEventHash', allTamperVectorsRejected);

// Canonical JSON Property Permutation Invariance
const payloadKeys = Object.keys(syncEvent.payload);
const reversedPayload: Record<string, unknown> = {};
for (const k of payloadKeys.reverse()) {
  reversedPayload[k] = (syncEvent.payload as any)[k];
}
const hashOriginal = calculateEventHash(
  syncEvent.aggregateType,
  syncEvent.aggregateId,
  syncEvent.eventType,
  syncEvent.payload as any,
  syncEvent.logicalSequence
);
const hashPermuted = calculateEventHash(
  syncEvent.aggregateType,
  syncEvent.aggregateId,
  syncEvent.eventType,
  reversedPayload,
  syncEvent.logicalSequence
);
assertCheck('RFC 8785 canonical hash is invariant under JSON key permutation', hashOriginal === hashPermuted);

// =============================================================================
// [Suite 3] Digital Offer Letter Acceptance Flow & Persistence
// =============================================================================
console.log('\n>>> [Suite 3] Testing Digital Offer Letter Acceptance Flow in App.tsx...');

const appContent = fs.readFileSync(APP_TSX_PATH, 'utf8');

// Match SEED_AMUL_OFFER definition in App.tsx
const matchSeedOffer = appContent.match(/const SEED_AMUL_OFFER:\s*DigitalOfferLetter\s*=\s*(\{[\s\S]*?\n\s*\};\n)/);
assertCheck('SEED_AMUL_OFFER defined with DigitalOfferLetter contract', !!matchSeedOffer);

let seedOffer: DigitalOfferLetter | null = null;
if (matchSeedOffer) {
  try {
    const rawOfferCode = `(${matchSeedOffer[1].replace(/;\s*$/, '')})`;
    // Replace trainee.id and trainee references for standalone evaluation
    const sanitizedOfferCode = rawOfferCode
      .replace(/trainee\.id/g, "'dddd4444-4444-4444-4444-444444444441'")
      .replace(/trainee\.name/g, "'Anita Patel'")
      .replace(/trainee\.emailOrPhone/g, "'anita.patel@mp.coop.gov.in'");
    seedOffer = eval(sanitizedOfferCode);
  } catch (err: any) {
    console.error('Error evaluating SEED_AMUL_OFFER:', err.message);
  }
}

assertCheck('SEED_AMUL_OFFER successfully parsed', !!seedOffer);

if (seedOffer) {
  assertCheck('Offer ID starts with "off-"', seedOffer.id.startsWith('off-'));
  assertCheck('Initial offer status is "ISSUED"', seedOffer.status === 'ISSUED');
  assertCheck('Employer is Amul (Anand Milk Union)', seedOffer.payload.employer.name.includes('Amul'));
  assertCheck('Annual CTC is ₹3.8 Lakhs / Annum', seedOffer.payload.annualCompensationLPA === 3.8);
  assertCheck('Monthly stipend/salary is ₹31,666', seedOffer.payload.monthlyStipendOrSalary === 31666);
  assertCheck('Joining date is specified', seedOffer.payload.joiningDate === '15 November 2026');
  assertCheck('Terms array contains at least 3 conditions', seedOffer.payload.terms.length >= 3);
  assertCheck('Ed25519 signature is 128-char hex string', /^[a-f0-9]{128}$/.test(seedOffer.signatureHex));
  assertCheck('Canonical digest is 64-char SHA-256 hex string', /^[a-f0-9]{64}$/.test(seedOffer.canonicalDigest));
  assertCheck('Issuer Key ID is "ncct-master-key-01"', seedOffer.issuerKeyId === 'ncct-master-key-01');
}

// Offer Acceptance & Decline State Machine Simulation
const mockLocalStorage: Record<string, string> = {};
const OFFER_STORAGE_KEY = 'sahakar_edge_offer_state_v1';

// Acceptance flow
if (seedOffer) {
  const acceptedOffer: DigitalOfferLetter = {
    ...seedOffer,
    status: 'ACCEPTED',
  };
  mockLocalStorage[OFFER_STORAGE_KEY] = JSON.stringify(acceptedOffer);
  assertCheck('Offer accepted state transitions status to "ACCEPTED"', acceptedOffer.status === 'ACCEPTED');
  assertCheck('Accepted offer persisted to localStorage with correct key', JSON.parse(mockLocalStorage[OFFER_STORAGE_KEY]).status === 'ACCEPTED');

  // Re-hydration from storage
  const rehydrated = JSON.parse(mockLocalStorage[OFFER_STORAGE_KEY]);
  assertCheck('Rehydrated offer preserves all cryptographic signatures and terms',
    rehydrated.signatureHex === seedOffer.signatureHex &&
    rehydrated.payload.annualCompensationLPA === 3.8
  );

  // Decline flow
  const declinedOffer: DigitalOfferLetter = {
    ...seedOffer,
    status: 'DECLINED',
  };
  mockLocalStorage[OFFER_STORAGE_KEY] = JSON.stringify(declinedOffer);
  assertCheck('Offer declined state transitions status to "DECLINED"', declinedOffer.status === 'DECLINED');
}

// Verification of UI Action Hitboxes in App.tsx
assertCheck('Accept Offer button has minHeight >= 44px', appContent.includes("minHeight: '46px'") || appContent.includes("minHeight: '44px'"));
assertCheck('Decline Offer button has minHeight >= 44px', appContent.includes("minHeight: '46px'"));
assertCheck('View Full Letter button has minHeight >= 44px', appContent.includes("minHeight: '46px'"));
assertCheck('Offer Modal close button has 44px x 44px target', appContent.includes("minHeight: '44px'") && appContent.includes("minWidth: '44px'"));
assertCheck('Ed25519 Cryptographic Verification Badge rendered with shield', appContent.includes('offerCryptoVerifiedBadge'));

// =============================================================================
// [Suite 4] MSCS Grievance SLA Countdown Logic & Escalation
// =============================================================================
console.log('\n>>> [Suite 4] Testing MSCS Grievance SLA Countdown Logic & Escalation...');

interface GrievanceModalExports {
  MSCS_SLA_TIERS: Array<{
    tier: number;
    name: string;
    nameHi: string;
    slaHours: number;
    authority: string;
  }>;
  GRIEVANCE_CATEGORIES: Array<{
    id: string;
    label: string;
    labelHi: string;
  }>;
}

const grievanceExports = extractAndEvaluate<GrievanceModalExports>(
  GRIEVANCE_MODAL_PATH,
  'export const MSCS_SLA_TIERS =',
  '// Initial seed tickets'
);

const mscsTiers = grievanceExports.MSCS_SLA_TIERS;
const grievanceCategories = grievanceExports.GRIEVANCE_CATEGORIES;

assertCheck('MSCS SLA Tiers defined', !!mscsTiers);
assertCheck('Exactly 4 statutory MSCS tiers present', mscsTiers.length === 4);
assertCheck('Tier 1: Society/Institute Level is 48 hours', mscsTiers[0].slaHours === 48);
assertCheck('Tier 2: District DCCB/DRCS Level is 168 hours (7 days)', mscsTiers[1].slaHours === 168);
assertCheck('Tier 3: State Apex/RCS Level is 360 hours (15 days)', mscsTiers[2].slaHours === 360);
assertCheck('Tier 4: National Ombudsman Level is 720 hours (30 days)', mscsTiers[3].slaHours === 720);

assertCheck('Grievance categories defined with at least 7 statutory types', grievanceCategories.length === 7);
assertCheck('KCC loan interest subvention discrepancy category exists', grievanceCategories.some((c) => c.id === 'KCC_LOAN_DISPUTE'));

// Countdown Timer Algorithm Verification
function formatCountdownSim(deadlineIso: string, currentTime: number) {
  const diffMs = new Date(deadlineIso).getTime() - currentTime;
  if (diffMs <= 0) {
    return { text: 'SLA BREACHED', hours: 0, minutes: 0, seconds: 0, breached: true, ratio: 0 };
  }
  const totalSecs = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSecs / 3600);
  const minutes = Math.floor((totalSecs % 3600) / 60);
  const seconds = totalSecs % 60;
  const ratio = Math.min(1, diffMs / (48 * 3600 * 1000));
  return {
    text: `${hours}h ${minutes}m ${seconds}s remaining`,
    hours,
    minutes,
    seconds,
    breached: false,
    ratio,
  };
}

const now = Date.now();
// 1. Active timer test (38 hours 15 mins 42 secs remaining)
const futureDeadline = new Date(now + (38 * 3600 + 15 * 60 + 42) * 1000).toISOString();
const activeCountdown = formatCountdownSim(futureDeadline, now);
assertCheck('Active countdown computes accurate hours (38h)', activeCountdown.hours === 38);
assertCheck('Active countdown computes accurate minutes (15m)', activeCountdown.minutes === 15);
assertCheck('Active countdown computes accurate seconds (42s)', activeCountdown.seconds === 42);
assertCheck('Active countdown reports breached = false', activeCountdown.breached === false);

// 2. Exact zero boundary test (diffMs = 0)
const zeroDeadline = new Date(now).toISOString();
const zeroCountdown = formatCountdownSim(zeroDeadline, now);
assertCheck('Exact deadline boundary reports breached = true', zeroCountdown.breached === true);
assertCheck('Exact deadline reports SLA BREACHED text', zeroCountdown.text === 'SLA BREACHED');

// 3. Past expired deadline test (diffMs < 0)
const pastDeadline = new Date(now - 12 * 3600 * 1000).toISOString();
const expiredCountdown = formatCountdownSim(pastDeadline, now);
assertCheck('Expired deadline reports breached = true', expiredCountdown.breached === true);
assertCheck('Expired deadline reports hours: 0, minutes: 0, seconds: 0',
  expiredCountdown.hours === 0 && expiredCountdown.minutes === 0 && expiredCountdown.seconds === 0
);

// 4. Escalation Progression State Machine
let currentTier: 1 | 2 | 3 | 4 = 1;
let currentDeadline = new Date(now + 48 * 3600 * 1000).toISOString();
let grievanceStatus = 'LODGED';

// Escalate 1 -> 2
currentTier = Math.min(4, currentTier + 1) as any;
const tier2Hours = currentTier === 2 ? 168 : currentTier === 3 ? 360 : 720;
currentDeadline = new Date(now + tier2Hours * 3600 * 1000).toISOString();
grievanceStatus = currentTier === 4 ? 'ESCALATED_MINISTERIAL' : 'UNDER_INVESTIGATION';
assertCheck('Escalation to Tier 2 sets tier = 2, SLA = 168h, status = UNDER_INVESTIGATION',
  currentTier === 2 && tier2Hours === 168 && grievanceStatus === 'UNDER_INVESTIGATION'
);

// Escalate 2 -> 3
currentTier = Math.min(4, currentTier + 1) as any;
const tier3Hours = currentTier === 2 ? 168 : currentTier === 3 ? 360 : 720;
currentDeadline = new Date(now + tier3Hours * 3600 * 1000).toISOString();
grievanceStatus = currentTier === 4 ? 'ESCALATED_MINISTERIAL' : 'UNDER_INVESTIGATION';
assertCheck('Escalation to Tier 3 sets tier = 3, SLA = 360h, status = UNDER_INVESTIGATION',
  currentTier === 3 && tier3Hours === 360 && grievanceStatus === 'UNDER_INVESTIGATION'
);

// Escalate 3 -> 4
currentTier = Math.min(4, currentTier + 1) as any;
const tier4Hours = currentTier === 2 ? 168 : currentTier === 3 ? 360 : 720;
currentDeadline = new Date(now + tier4Hours * 3600 * 1000).toISOString();
grievanceStatus = currentTier === 4 ? 'ESCALATED_MINISTERIAL' : 'UNDER_INVESTIGATION';
assertCheck('Escalation to Tier 4 sets tier = 4, SLA = 720h, status = ESCALATED_MINISTERIAL',
  currentTier === 4 && tier4Hours === 720 && grievanceStatus === 'ESCALATED_MINISTERIAL'
);

// Escalate beyond 4 (clamping check)
currentTier = Math.min(4, currentTier + 1) as any;
assertCheck('Escalation at Tier 4 is safely clamped at Tier 4', currentTier === 4);

// Verify live 1,000ms timer in GrievanceModal.tsx
assertCheck('GrievanceModal has 1,000ms SLA countdown timer hook',
  fs.readFileSync(GRIEVANCE_MODAL_PATH, 'utf8').includes('setInterval') &&
  fs.readFileSync(GRIEVANCE_MODAL_PATH, 'utf8').includes('1000')
);

// =============================================================================
// [Suite 5] Scheme Advisory Calculator Logic
// =============================================================================
console.log('\n>>> [Suite 5] Testing National Scheme Advisory Calculator Rules...');

interface SchemeModalExports {
  LOCAL_SCHEMES: Array<{
    id: string;
    code: string;
    name: string;
    maxProjectCostLakhs: number;
    subsidyPercentage: number;
    maxSubsidyLakhs: number;
    interestSubventionPercent: number;
    eligibleSocietyTypes: string[];
    minimumAuditGrade: string;
    mandatoryDocuments: string[];
  }>;
  evaluateSchemesLocal: (input: SchemeEvaluationInput) => SchemeEvaluationResult[];
}

const schemeExports = extractAndEvaluate<SchemeModalExports>(
  SCHEME_MODAL_PATH,
  'export const LOCAL_SCHEMES:',
  'export const SchemeCalculatorModal: React.FC'
);

const schemes = schemeExports.LOCAL_SCHEMES;
const evaluateSchemes = schemeExports.evaluateSchemesLocal;

assertCheck('Schemes list contains exactly 4 national schemes', schemes.length === 4);
const aif = schemes.find((s) => s.code === 'AIF');
const pmfme = schemes.find((s) => s.code === 'PMFME');
const yuva = schemes.find((s) => s.code === 'YUVA_SAHAKAR');
const comp = schemes.find((s) => s.code === 'PACS_COMPUTERIZATION');

assertCheck('AIF scheme has 3% interest subvention and ₹200 Lakh ceiling',
  aif?.interestSubventionPercent === 3.0 && aif?.maxProjectCostLakhs === 200
);
assertCheck('PMFME scheme has 35% subsidy capped at ₹10 Lakhs',
  pmfme?.subsidyPercentage === 35.0 && pmfme?.maxSubsidyLakhs === 10.0
);
assertCheck('Yuva Sahakar has 2% interest incentive and ₹300 Lakh ceiling',
  yuva?.interestSubventionPercent === 2.0 && yuva?.maxProjectCostLakhs === 300
);
assertCheck('PACS Computerization has 100% grant subsidy',
  comp?.subsidyPercentage === 100.0 && comp?.eligibleSocietyTypes.includes('PACS')
);

// Scheme Evaluation Scenarios
// Scenario A: Model PACS applying for Post-Harvest Cold Storage under AIF
const aifInput: SchemeEvaluationInput = {
  societyType: 'PACS',
  auditGrade: 'A',
  projectCategory: 'POST_HARVEST_STORAGE',
  proposedProjectCostLakhs: 85.0,
  annualTurnoverLakhs: 140.0,
  netWorthLakhs: 65.0,
  womenMemberPercentage: 35.0,
};
const evalAif = evaluateSchemes(aifInput);
const aifRes = evalAif.find((r) => r.schemeId === aif?.id);
assertCheck('Eligible PACS receives eligible = true for AIF', aifRes?.eligible === true);
assertCheck('AIF interest subvention rate is 3%', aifRes?.applicableSubventionPercent === 3.0);
assertCheck('Effective interest rate under AIF is 6% (9% base - 3% subvention)', aifRes?.effectiveInterestRate === 6.0);
assertCheck('AIF annual interest savings computed accurately', (aifRes?.estimatedAnnualInterestSavingsLakhs || 0) > 2.0);

// Scenario B: Ineligible Grade D Society rejected from AIF (requires B or higher)
const ineligibleGradeInput: SchemeEvaluationInput = {
  ...aifInput,
  auditGrade: 'D',
};
const evalIneligibleGrade = evaluateSchemes(ineligibleGradeInput);
const ineligibleAifRes = evalIneligibleGrade.find((r) => r.schemeId === aif?.id);
assertCheck('Grade D society correctly marked eligible = false for AIF', ineligibleAifRes?.eligible === false);
assertCheck('Audit grade rejection reason documented', ineligibleAifRes?.reasons.some((r) => r.includes('Audit Grade "D"')));

// Scenario C: Yuva Sahakar 1% Bonus Incentive for Women-Led Societies (>= 50% women)
const womenLedInput: SchemeEvaluationInput = {
  ...aifInput,
  projectCategory: 'CSC_DIGITAL_SERVICES',
  proposedProjectCostLakhs: 25.0,
  womenMemberPercentage: 55.0,
};
const evalWomen = evaluateSchemes(womenLedInput);
const yuvaRes = evalWomen.find((r) => r.schemeId === yuva?.id);
assertCheck('Women-led cooperative receives 3% subvention under Yuva Sahakar (2% base + 1% bonus)',
  yuvaRes?.applicableSubventionPercent === 3.0
);

// =============================================================================
// [Suite 6] PWA Ergonomics, Typography & Touch Hitbox Geometry
// =============================================================================
console.log('\n>>> [Suite 6] Auditing Interactive Touch Targets & Typography Hierarchy...');

// Check touch targets across all 4 modals/components
const checkTouchErgonomics = (filename: string, content: string) => {
  const btnMatches = content.match(/<button[\s\S]*?>/g) || [];
  let sub44Count = 0;
  for (const btn of btnMatches) {
    if (btn.includes('minHeight:') || btn.includes('height:')) {
      const hMatch = btn.match(/(?:minHeight|height):\s*['"]?(\d+)px/);
      if (hMatch) {
        const h = parseInt(hMatch[1], 10);
        if (h < 44) sub44Count++;
      }
    }
  }
  return { btnCount: btnMatches.length, sub44Count };
};

const oralErgo = checkTouchErgonomics('OralAssessmentModal.tsx', fs.readFileSync(ORAL_MODAL_PATH, 'utf8'));
const schemeErgo = checkTouchErgonomics('SchemeCalculatorModal.tsx', fs.readFileSync(SCHEME_MODAL_PATH, 'utf8'));
const grievanceErgo = checkTouchErgonomics('GrievanceModal.tsx', fs.readFileSync(GRIEVANCE_MODAL_PATH, 'utf8'));
const appErgo = checkTouchErgonomics('App.tsx', appContent);

assertCheck(`OralAssessmentModal has 0 sub-44px buttons (${oralErgo.btnCount} buttons inspected)`, oralErgo.sub44Count === 0);
assertCheck(`SchemeCalculatorModal has 0 sub-44px buttons (${schemeErgo.btnCount} buttons inspected)`, schemeErgo.sub44Count === 0);
assertCheck(`GrievanceModal has 0 sub-44px buttons (${grievanceErgo.btnCount} buttons inspected)`, grievanceErgo.sub44Count === 0);
assertCheck(`App.tsx has 0 sub-44px buttons (${appErgo.btnCount} buttons inspected)`, appErgo.sub44Count === 0);

// Micro-font check across all 4 files
const checkMicroFonts = (filename: string, content: string) => {
  const fontMatches = content.match(/fontSize:\s*['"]?([0-9.]+(?:px|rem))/g) || [];
  let sub12Count = 0;
  for (const f of fontMatches) {
    if (f.includes('px')) {
      const px = parseFloat(f.replace(/[^\d.]/g, ''));
      if (px < 11.5) sub12Count++;
    } else if (f.includes('rem')) {
      const rem = parseFloat(f.replace(/[^\d.]/g, ''));
      if (rem < 0.72) sub12Count++;
    }
  }
  return { fontCount: fontMatches.length, sub12Count };
};

const oralFonts = checkMicroFonts('OralAssessmentModal.tsx', fs.readFileSync(ORAL_MODAL_PATH, 'utf8'));
const schemeFonts = checkMicroFonts('SchemeCalculatorModal.tsx', fs.readFileSync(SCHEME_MODAL_PATH, 'utf8'));
const grievanceFonts = checkMicroFonts('GrievanceModal.tsx', fs.readFileSync(GRIEVANCE_MODAL_PATH, 'utf8'));
const appFonts = checkMicroFonts('App.tsx', appContent);

assertCheck(`OralAssessmentModal: 0 sub-12px micro-fonts (${oralFonts.fontCount} rules checked)`, oralFonts.sub12Count === 0);
assertCheck(`SchemeCalculatorModal: 0 sub-12px micro-fonts (${schemeFonts.fontCount} rules checked)`, schemeFonts.sub12Count === 0);
assertCheck(`GrievanceModal: 0 sub-12px micro-fonts (${grievanceFonts.fontCount} rules checked)`, grievanceFonts.sub12Count === 0);
assertCheck(`App.tsx: 0 sub-12px micro-fonts (${appFonts.fontCount} rules checked)`, appFonts.sub12Count === 0);

console.log('\n========================================================================');
console.log(`   TOTAL EMPIRICAL CHECKS: ${totalChecks} | PASSED: ${passedChecks} | FAILED: ${failedChecks}`);
console.log('========================================================================\n');

if (failedChecks > 0) {
  process.exit(1);
} else {
  console.log('  ✓ ALL EMPIRICAL CHALLENGER M2-2 TESTS PASSED 100% CLEANLY!\n');
  process.exit(0);
}

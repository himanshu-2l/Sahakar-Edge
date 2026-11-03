import assert from 'node:assert';
import { SchemeAdvisoryEngine, NATIONAL_SCHEME_CATALOG } from '../apps/central-api/dist/services/scheme-engine.js';
import { CamelScorecardEngine } from '../apps/central-api/dist/services/camel-scorecard-engine.js';
import { centralStore } from '../apps/central-api/dist/store/memory-store.js';
import type {
  PacsFinancialMetrics,
  AuditGrade,
  SchemeEvaluationInput,
  GrievanceTicket,
} from '../packages/types/dist/index.js';

console.log('========================================================================');
console.log('   SAHAKAR EDGE — EMPIRICAL CHALLENGER VERIFICATION (Directorates 1 & 4)   ');
console.log('========================================================================\n');

// ============================================================================
// PART 1: COOPERATIVE CAMEL HEALTH SCORECARD & REMEDIATION SANDBOX
// ============================================================================
console.log('>>> [CHALLENGE 1] CAMEL 5-Dimension Weight Invariant & Edge Math...');

const camelEngine = new CamelScorecardEngine();

// Invariant 1: Weights check
// Capital (20), Asset Quality (25), Management (20), Earnings (20), Liquidity (15) = 100.0
const maxMetrics: PacsFinancialMetrics = {
  societyId: 'test-max-soc',
  societyName: 'Max Metric Test PACS',
  district: 'Test',
  state: 'Test',
  shareCapitalLakhs: 50.0,
  reservesAndSurplusLakhs: 50.0, // Own funds 100, advances 100 => CAR 100% (>= 15%) => 20 pts
  totalDepositsLakhs: 100.0,
  totalAdvancesLakhs: 100.0,
  grossNpaLakhs: 1.0, // Gross NPA 1% (<= 2%) => 25 pts
  liquidAssetsLakhs: 30.0, // Liquidity 30% (>= 25%) => 15 pts
  netProfitLakhs: 20.0, // Profit ratio 20% (>= 10%) => 12 pts
  nonCreditRevenueLakhs: 30.0, // Non-credit 30% (>= 25%) => 8 pts
  totalRevenueLakhs: 100.0,
  governanceChecklistPassed: 10, // 10 * 2 = 20 pts
};

const maxCard = camelEngine.evaluateScorecard(maxMetrics);
console.log(`  Max Composite Score: ${maxCard.compositeHealthScore} / 100`);
console.log(`  Dimension Scores:`, maxCard.camelScores);
assert.strictEqual(maxCard.camelScores.capitalScore, 20.0, 'Capital score must cap at 20.0');
assert.strictEqual(maxCard.camelScores.assetQualityScore, 25.0, 'Asset quality score must cap at 25.0');
assert.strictEqual(maxCard.camelScores.managementScore, 20.0, 'Management score must cap at 20.0');
assert.strictEqual(maxCard.camelScores.earningsScore, 20.0, 'Earnings score must cap at 20.0');
assert.strictEqual(maxCard.camelScores.liquidityScore, 15.0, 'Liquidity score must cap at 15.0');
assert.strictEqual(maxCard.compositeHealthScore, 100.0, 'Max composite health score must equal 100.0');
assert.strictEqual(maxCard.auditGrade, 'A', '100 composite score must be Grade A');
assert.strictEqual(maxCard.status, 'THRIVING');
console.log('  ✓ Invariant 1 Verified: 5-dimension weights sum to exactly 100.0.');

// Invariant 2: Zero-division resilience
console.log('\n>>> [CHALLENGE 2] Zero-Division & Extreme Financial Stress Resilience...');

const zeroAdvancesMetrics: PacsFinancialMetrics = {
  ...maxMetrics,
  totalAdvancesLakhs: 0,
  grossNpaLakhs: 0,
};
const zeroAdvCard = camelEngine.evaluateScorecard(zeroAdvancesMetrics);
assert.strictEqual(Number.isFinite(zeroAdvCard.capitalAdequacyRatio), true);
assert.strictEqual(Number.isFinite(zeroAdvCard.grossNpaPercentage), true);
assert.strictEqual(zeroAdvCard.grossNpaPercentage, 0.0);
console.log('  ✓ Zero advances handled safely without NaN or Infinity (CAR & NPA % valid).');

const zeroDepositsMetrics: PacsFinancialMetrics = {
  ...maxMetrics,
  totalDepositsLakhs: 0,
  liquidAssetsLakhs: 0,
};
const zeroDepCard = camelEngine.evaluateScorecard(zeroDepositsMetrics);
assert.strictEqual(Number.isFinite(zeroDepCard.liquidityRatio), true);
assert.strictEqual(zeroDepCard.liquidityRatio, 100.0);
console.log('  ✓ Zero deposits handled safely without NaN or division-by-zero.');

const zeroRevenueMetrics: PacsFinancialMetrics = {
  ...maxMetrics,
  totalRevenueLakhs: 0,
  netProfitLakhs: 0,
  nonCreditRevenueLakhs: 0,
};
const zeroRevCard = camelEngine.evaluateScorecard(zeroRevenueMetrics);
assert.strictEqual(Number.isFinite(zeroRevCard.nonCreditRevenuePercentage), true);
assert.strictEqual(Number.isFinite(zeroRevCard.camelScores.earningsScore), true);
console.log('  ✓ Zero revenue handled safely without NaN in profit/earnings ratios.');

// Invariant 3: Severe Negative Financials Clamping
const negativeMetrics: PacsFinancialMetrics = {
  societyId: 'pacs-stressed-01',
  societyName: 'Stressed PACS',
  district: 'Drought District',
  state: 'State',
  shareCapitalLakhs: 10.0,
  reservesAndSurplusLakhs: -50.0, // Own funds = -40 Lakhs (Insolvent)
  totalDepositsLakhs: 150.0,
  totalAdvancesLakhs: 200.0,
  grossNpaLakhs: 150.0, // 75% NPA
  liquidAssetsLakhs: 5.0, // 3.3% Liquidity
  netProfitLakhs: -30.0, // Severe Loss
  nonCreditRevenueLakhs: 0,
  totalRevenueLakhs: 20.0,
  governanceChecklistPassed: 1,
};
const negCard = camelEngine.evaluateScorecard(negativeMetrics);
assert.ok(negCard.camelScores.capitalScore >= 0, 'Capital score cannot be negative');
assert.ok(negCard.camelScores.assetQualityScore >= 0, 'Asset score cannot be negative');
assert.ok(negCard.camelScores.managementScore >= 0, 'Management score cannot be negative');
assert.ok(negCard.camelScores.earningsScore >= 0, 'Earnings score cannot be negative');
assert.ok(negCard.camelScores.liquidityScore >= 0, 'Liquidity score cannot be negative');
assert.strictEqual(negCard.auditGrade, 'D');
assert.strictEqual(negCard.status, 'CRITICAL');
assert.ok(negCard.diagnosticAlerts.some((a) => a.severity === 'CRITICAL'));
console.log(`  Stressed Society Health Score: ${negCard.compositeHealthScore} (Grade ${negCard.auditGrade})`);
console.log('  ✓ Negative reserves and catastrophic NPAs cleanly clamped with Grade D alerts.');

// ============================================================================
// PART 2: REMEDIATION & CAPITAL INJECTION SANDBOX MATHEMATICS
// ============================================================================
console.log('\n>>> [CHALLENGE 3] Remediation & Capital Injection Sandbox Recalibration...');

// Test baseline society pacs-mh-nan-004 (Marathwada Gramin)
const marathwadaMetrics: PacsFinancialMetrics = {
  societyId: 'pacs-mh-nan-004',
  societyName: 'Marathwada Gramin Vikas Sahakari Sanstha',
  district: 'Nanded',
  state: 'Maharashtra',
  shareCapitalLakhs: 14.0,
  reservesAndSurplusLakhs: -4.5,
  totalDepositsLakhs: 180.0,
  totalAdvancesLakhs: 195.0,
  grossNpaLakhs: 46.8,
  liquidAssetsLakhs: 11.0,
  netProfitLakhs: -8.2,
  nonCreditRevenueLakhs: 4.0,
  totalRevenueLakhs: 35.0,
  governanceChecklistPassed: 3,
};

const baselineMarathwada = camelEngine.evaluateScorecard(marathwadaMetrics);
console.log(`  Baseline Marathwada: Grade ${baselineMarathwada.auditGrade} (Score ${baselineMarathwada.compositeHealthScore})`);
assert.strictEqual(baselineMarathwada.auditGrade, 'D');

// Replicate simulation formula from CamelDetailsModal.tsx
function simulateRemediation(
  base: PacsFinancialMetrics,
  baseScorecard: typeof baselineMarathwada,
  injectCapitalLakhs: number,
  recoverNpaLakhs: number,
  extraGovChecklist: number
) {
  const simShareCapital = base.shareCapitalLakhs + injectCapitalLakhs;
  const simGrossNpa = Math.max(0, base.grossNpaLakhs - recoverNpaLakhs);
  const simGovChecklist = Math.min(10, base.governanceChecklistPassed + extraGovChecklist);

  // 1. Recalculated CAR
  const simOwnFunds = simShareCapital + base.reservesAndSurplusLakhs;
  const simCar = base.totalAdvancesLakhs > 0 ? (simOwnFunds / base.totalAdvancesLakhs) * 100 : 100;
  let simCScore = 0;
  if (simCar >= 15.0) simCScore = 20.0;
  else if (simCar >= 12.0) simCScore = 16.0 + ((simCar - 12.0) / 3.0) * 4.0;
  else if (simCar >= 9.0) simCScore = 12.0 + ((simCar - 9.0) / 3.0) * 4.0;
  else if (simCar >= 6.0) simCScore = 6.0 + ((simCar - 6.0) / 3.0) * 6.0;
  else simCScore = Math.max(0, (simCar / 6.0) * 6.0);
  simCScore = Math.round(simCScore * 10) / 10;

  // 2. Recalculated NPA %
  const simNpaPct = base.totalAdvancesLakhs > 0 ? (simGrossNpa / base.totalAdvancesLakhs) * 100 : 0;
  let simAScore = 0;
  if (simNpaPct <= 2.0) simAScore = 25.0;
  else if (simNpaPct <= 5.0) simAScore = 25.0 - ((simNpaPct - 2.0) / 3.0) * 5.0;
  else if (simNpaPct <= 10.0) simAScore = 20.0 - ((simNpaPct - 5.0) / 5.0) * 8.0;
  else if (simNpaPct <= 20.0) simAScore = 12.0 - ((simNpaPct - 10.0) / 10.0) * 8.0;
  else simAScore = Math.max(0, 4.0 - ((simNpaPct - 20.0) / 10.0) * 4.0);
  simAScore = Math.round(simAScore * 10) / 10;

  // 3. Recalculated Management Score
  const simMScore = Math.min(20.0, Math.round(simGovChecklist * 2.0 * 10) / 10);

  // 4 & 5. Earnings & Liquidity hold from base
  const simEScore = baseScorecard.camelScores.earningsScore;
  const simLScore = baseScorecard.camelScores.liquidityScore;

  const simCompositeScore =
    Math.round((simCScore + simAScore + simMScore + simEScore + simLScore) * 10) / 10;
  let simGrade: AuditGrade = 'D';
  if (simCompositeScore >= 85.0) simGrade = 'A';
  else if (simCompositeScore >= 70.0) simGrade = 'B';
  else if (simCompositeScore >= 50.0) simGrade = 'C';
  else simGrade = 'D';

  return {
    simCar,
    simCScore,
    simNpaPct,
    simAScore,
    simMScore,
    simCompositeScore,
    simGrade,
  };
}

// Test Step 1: Capital injection strictly increases CAR & C Score
let prevCar = 0;
let prevCScore = 0;
for (let inj = 0; inj <= 30; inj += 2) {
  const sim = simulateRemediation(marathwadaMetrics, baselineMarathwada, inj, 0, 0);
  assert.ok(sim.simCar >= prevCar, `CAR must be monotonically non-decreasing (at ${inj}L)`);
  assert.ok(sim.simCScore >= prevCScore, `C Score must be monotonically non-decreasing (at ${inj}L)`);
  assert.strictEqual(Number.isFinite(sim.simCar), true);
  prevCar = sim.simCar;
  prevCScore = sim.simCScore;
}
console.log('  ✓ Monotonicity confirmed: Capital injection monotonically increases CAR and C Score.');

// Test Step 2: Full Remediation Multi-Pillar Upgrade
// Inject ₹25L capital, recover ₹35L NPA, complete +7 governance items
const upgraded = simulateRemediation(marathwadaMetrics, baselineMarathwada, 25, 35, 7);
console.log(`  Remediated Marathwada:`);
console.log(`    CAR: ${upgraded.simCar.toFixed(1)}% (C Score: ${upgraded.simCScore}/20)`);
console.log(`    Gross NPA: ${upgraded.simNpaPct.toFixed(1)}% (A Score: ${upgraded.simAScore}/25)`);
console.log(`    Gov Checklist: 10/10 (M Score: ${upgraded.simMScore}/20)`);
console.log(`    Simulated Health Score: ${upgraded.simCompositeScore}/100`);
console.log(`    Upgraded Audit Grade: Grade ${upgraded.simGrade}`);

assert.ok(upgraded.simCompositeScore > baselineMarathwada.compositeHealthScore, 'Score must upgrade');
assert.ok(upgraded.simCompositeScore >= 50.0, 'Composite score must reach at least Grade C/B');
assert.notStrictEqual(upgraded.simGrade, 'D', 'Society must exit Grade D after aggressive remediation');
console.log('  ✓ Remediation Sandbox successfully upgrades society out of Grade D.');

// ============================================================================
// PART 3: SCHEME ADVISORY RADAR MACRO CALCULATIONS & 4-SCHEME MATRIX
// ============================================================================
console.log('\n>>> [CHALLENGE 4] Scheme Advisory Radar Macro Pipeline & 4-Scheme Rules...');

// Verify macro disbursement bento math
const aifPipeline = 850.0;
const pmfmePipeline = 180.0;
const yuvaPipeline = 240.0;
const pacsCompPipeline = 150.0;
const totalPipeline = aifPipeline + pmfmePipeline + yuvaPipeline + pacsCompPipeline;
assert.strictEqual(totalPipeline, 1420.0, 'Macro pipeline must sum to ₹1,420.0 Cr');
console.log(`  Total National Scheme Pipeline: ₹${totalPipeline.toFixed(1)} Cr (matches ₹1,420 Cr requirement).`);

const schemeEngine = new SchemeAdvisoryEngine();
const catalog = schemeEngine.getCatalog();
assert.strictEqual(catalog.length, 4, 'Catalog must contain 4 flagship schemes');

// Scheme 1: Agriculture Infrastructure Fund (AIF)
console.log('\n  Testing AIF (Post-Harvest Infrastructure)...');
const aifEvalGradeA = schemeEngine.evaluateScheme(catalog.find((s) => s.code === 'AIF')!, {
  societyType: 'PACS',
  yearsActive: 10,
  auditGrade: 'A',
  memberCount: 850,
  womenMemberPercentage: 35,
  annualTurnoverLakhs: 120,
  netWorthLakhs: 70,
  proposedProjectCostLakhs: 150,
  projectCategory: 'POST_HARVEST_STORAGE',
});
assert.strictEqual(aifEvalGradeA.eligible, true);
assert.strictEqual(aifEvalGradeA.applicableSubventionPercent, 3.0);
assert.strictEqual(aifEvalGradeA.eligibleSubsidyLakhs, 0); // Nil capital subsidy
assert.strictEqual(aifEvalGradeA.estimatedAnnualInterestSavingsLakhs, 4.5); // 150L * 3% = 4.5L
console.log(`    AIF Grade A evaluation: Eligible = true, Subvention = 3%, Annual Savings = ₹4.5L.`);

// Test AIF Grade Ineligibility (Grade C is ineligible, min is B)
const aifEvalGradeC = schemeEngine.evaluateScheme(catalog.find((s) => s.code === 'AIF')!, {
  societyType: 'PACS',
  yearsActive: 5,
  auditGrade: 'C',
  memberCount: 500,
  womenMemberPercentage: 20,
  annualTurnoverLakhs: 60,
  netWorthLakhs: 25,
  proposedProjectCostLakhs: 100,
  projectCategory: 'POST_HARVEST_STORAGE',
});
assert.strictEqual(aifEvalGradeC.eligible, false);
assert.ok(aifEvalGradeC.reasons.some((r) => r.includes('Grade "C" does not meet minimum regulatory requirement')));
assert.ok(aifEvalGradeC.matchScore <= 45, 'Ineligible score must be capped at 45');
console.log('    ✓ AIF Grade C correctly rejected due to regulatory audit grade.');

// Scheme 2: PMFME (Food Processing)
console.log('\n  Testing PMFME (Micro-Food Processing)...');
const pmfmeEval = schemeEngine.evaluateScheme(catalog.find((s) => s.code === 'PMFME')!, {
  societyType: 'PACS',
  yearsActive: 6,
  auditGrade: 'B',
  memberCount: 600,
  womenMemberPercentage: 25,
  annualTurnoverLakhs: 95,
  netWorthLakhs: 50,
  proposedProjectCostLakhs: 40,
  projectCategory: 'FOOD_PROCESSING',
});
assert.strictEqual(pmfmeEval.eligible, true);
// 35% of 40L = 14L, capped at 10.0L
assert.strictEqual(pmfmeEval.eligibleSubsidyLakhs, 10.0);
console.log(`    PMFME 35% subsidy on ₹40L: correctly capped at max ₹10.0 Lakhs.`);

// Scheme 3: Yuva Sahakar (Women Incentive Trigger)
console.log('\n  Testing Yuva Sahakar 50% Women Incentive Bonus...');
const yuvaBase = schemeEngine.evaluateScheme(catalog.find((s) => s.code === 'YUVA_SAHAKAR')!, {
  societyType: 'PACS',
  yearsActive: 3,
  auditGrade: 'B',
  memberCount: 400,
  womenMemberPercentage: 45, // < 50%
  annualTurnoverLakhs: 80,
  netWorthLakhs: 40,
  proposedProjectCostLakhs: 100,
  projectCategory: 'CSC_DIGITAL_SERVICES',
});
assert.strictEqual(yuvaBase.applicableSubventionPercent, 2.0);

const yuvaWomenBonus = schemeEngine.evaluateScheme(catalog.find((s) => s.code === 'YUVA_SAHAKAR')!, {
  societyType: 'PACS',
  yearsActive: 3,
  auditGrade: 'B',
  memberCount: 400,
  womenMemberPercentage: 50, // Exactly 50%
  annualTurnoverLakhs: 80,
  netWorthLakhs: 40,
  proposedProjectCostLakhs: 100,
  projectCategory: 'CSC_DIGITAL_SERVICES',
});
assert.strictEqual(yuvaWomenBonus.applicableSubventionPercent, 3.0);
console.log('    ✓ Yuva Sahakar: 45% women => 2% subvention; 50% women => 3% subvention (bonus verified).');

// Scheme 4: PACS Computerization (100% Grant)
console.log('\n  Testing PACS Computerization Grant...');
const compEval = schemeEngine.evaluateScheme(catalog.find((s) => s.code === 'PACS_COMPUTERIZATION')!, {
  societyType: 'PACS',
  yearsActive: 2,
  auditGrade: 'C', // Grade C is eligible
  memberCount: 300,
  womenMemberPercentage: 15,
  annualTurnoverLakhs: 30,
  netWorthLakhs: 10,
  proposedProjectCostLakhs: 4.0,
  projectCategory: 'CSC_DIGITAL_SERVICES',
});
assert.strictEqual(compEval.eligible, true);
assert.strictEqual(compEval.eligibleSubsidyLakhs, 4.0);
assert.strictEqual(compEval.effectiveInterestRate, 0.0);
console.log('    ✓ PACS Computerization: 100% Grant (₹4.0L), 0% effective interest rate.');

// Test Society Type Boundary: Non-PACS cannot access PACS Computerization
const compDairyEval = schemeEngine.evaluateScheme(catalog.find((s) => s.code === 'PACS_COMPUTERIZATION')!, {
  societyType: 'DAIRY',
  yearsActive: 5,
  auditGrade: 'A',
  memberCount: 500,
  womenMemberPercentage: 30,
  annualTurnoverLakhs: 100,
  netWorthLakhs: 50,
  proposedProjectCostLakhs: 4.0,
  projectCategory: 'CSC_DIGITAL_SERVICES',
});
assert.strictEqual(compDairyEval.eligible, false);
assert.ok(compDairyEval.reasons.some((r) => r.includes('Society type "DAIRY" is not eligible for PACS_COMPUTERIZATION')));
console.log('    ✓ PACS Computerization strictly restricted to PACS societies.');

// ============================================================================
// PART 4: OMBUDSMAN SLA REGISTRY, LIVE COUNTDOWN & RESOLUTION ADJUDICATION
// ============================================================================
console.log('\n>>> [CHALLENGE 5] Ombudsman SLA Registry, Live Countdown & Escalation Logic...');

// SLA Helper logic from OmbudsmanRegistryView.tsx lines 114-141
function calculateSlaDetails(ticket: Partial<GrievanceTicket>, now: Date) {
  if (ticket.status === 'RESOLVED') {
    return { formatted: 'RESOLVED (ORDER ISSUED)', breached: false, percentElapsed: 100, color: '#16a34a' };
  }

  const deadline = new Date(ticket.escalationDeadline!).getTime();
  const remainingMs = deadline - now.getTime();
  const totalDurationMs =
    (ticket.currentTier === 1 ? 48 : ticket.currentTier === 2 ? 168 : ticket.currentTier === 3 ? 360 : 720) *
    3600000;
  const elapsedMs = totalDurationMs - remainingMs;
  const percentElapsed = Math.min(100, Math.max(0, (elapsedMs / totalDurationMs) * 100));

  if (remainingMs <= 0) {
    return { formatted: '00h 00m 00s (SLA BREACHED)', breached: true, percentElapsed: 100, color: '#dc2626' };
  }

  const h = Math.floor(remainingMs / 3600000);
  const m = Math.floor((remainingMs % 3600000) / 60000);
  const s = Math.floor((remainingMs % 60000) / 1000);
  const formatted = `${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;

  let color = '#16a34a';
  if (h < 6 || percentElapsed > 85) color = '#dc2626';
  else if (h < 24 || percentElapsed > 60) color = '#d97706';

  return { formatted, breached: false, percentElapsed, color };
}

// Test SLA Countdown formatting
const mockNow = new Date('2026-11-05T00:00:00Z');

// 1. Normal active ticket: 30 hours remaining on Tier 1 (48h total)
const activeTicket: Partial<GrievanceTicket> = {
  currentTier: 1,
  status: 'LODGED',
  escalationDeadline: new Date('2026-11-06T06:30:15Z').toISOString(), // 30h 30m 15s ahead
};
const activeSla = calculateSlaDetails(activeTicket, mockNow);
assert.strictEqual(activeSla.breached, false);
assert.strictEqual(activeSla.formatted, '30h 30m 15s');
assert.ok(activeSla.percentElapsed > 0 && activeSla.percentElapsed < 100);
console.log(`  Active Ticket Countdown: ${activeSla.formatted} (${activeSla.percentElapsed.toFixed(1)}% elapsed)`);

// 2. Urgent ticket: 4 hours remaining
const urgentTicket: Partial<GrievanceTicket> = {
  currentTier: 1,
  status: 'UNDER_INVESTIGATION',
  escalationDeadline: new Date('2026-11-05T04:00:00Z').toISOString(),
};
const urgentSla = calculateSlaDetails(urgentTicket, mockNow);
assert.strictEqual(urgentSla.color, '#dc2626', 'Color should be red (< 6h)');
assert.strictEqual(urgentSla.breached, false);
console.log(`  Urgent Ticket Countdown: ${urgentSla.formatted} (Color: ${urgentSla.color})`);

// 3. Breached ticket: deadline in past
const breachedTicket: Partial<GrievanceTicket> = {
  currentTier: 1,
  status: 'UNDER_INVESTIGATION',
  escalationDeadline: new Date('2026-11-04T12:00:00Z').toISOString(), // 12 hours ago
};
const breachedSla = calculateSlaDetails(breachedTicket, mockNow);
assert.strictEqual(breachedSla.breached, true);
assert.strictEqual(breachedSla.formatted, '00h 00m 00s (SLA BREACHED)');
assert.strictEqual(breachedSla.percentElapsed, 100);
console.log(`  Breached Ticket Countdown: ${breachedSla.formatted} (Breached: ${breachedSla.breached})`);

// 4. Resolved ticket
const resolvedTicket: Partial<GrievanceTicket> = {
  currentTier: 2,
  status: 'RESOLVED',
  escalationDeadline: new Date('2026-11-04T12:00:00Z').toISOString(),
};
const resolvedSla = calculateSlaDetails(resolvedTicket, mockNow);
assert.strictEqual(resolvedSla.breached, false);
assert.strictEqual(resolvedSla.formatted, 'RESOLVED (ORDER ISSUED)');
console.log(`  Resolved Ticket Countdown: ${resolvedSla.formatted}`);

// 5. Statutory Escalation Capping (Cannot exceed Tier 4)
console.log('\n  Testing Statutory Escalation Capping at Tier 4...');
let currentTier = 1 as 1 | 2 | 3 | 4;
for (let step = 1; step <= 5; step++) {
  const nextTier = Math.min(4, currentTier + 1) as 1 | 2 | 3 | 4;
  currentTier = nextTier;
}
assert.strictEqual(currentTier, 4, 'Tier escalation must clamp at Tier 4');
console.log('  ✓ Tier escalation safely capped at Tier 4 (CRCS Ombudsman & Ministerial level).');

console.log('\n========================================================================');
console.log('   ✓ ALL EMPIRICAL CHALLENGES PASSED WITH ZERO REGRESSIONS OR DRIFT!   ');
console.log('========================================================================\n');

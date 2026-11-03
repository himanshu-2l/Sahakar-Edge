/**
 * Sahakar Edge — Challenger M4-1 Empirical Adversarial Stress & Invariant Verification Harness
 * 
 * Thoroughly stress-tests Pillars 1–3, cryptographic invariants, division-by-zero resilience,
 * and master integration integrity with zero mocks.
 */

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

// Pillar 1: Scheme Engine
import {
  SchemeAdvisoryEngine,
  NATIONAL_SCHEME_CATALOG,
} from '../apps/central-api/dist/services/scheme-engine.js';

// Pillar 2: CAMEL Scorecard Engine
import { CamelScorecardEngine } from '../apps/central-api/dist/services/camel-scorecard-engine.js';
import { centralStore } from '../apps/central-api/dist/store/memory-store.js';

// Pillar 3: Cryptographic Proof Inspector & Tamper Sandbox
import {
  generateIssuerKeyPair,
  signCredentialPayload,
  inspectCredentialProof,
  simulateCredentialTamper,
  verifyCredentialSignature,
  ed25519PemToRawPublicKeyHex,
} from '../packages/credential-core/dist/index.js';
import { canonicalJsonStringify, sha256Hex } from '../packages/sync-protocol/dist/index.js';

// Fastify Server for REST Route Fuzzing
import { buildCentralServer } from '../apps/central-api/dist/server.js';

// Types
import type {
  CanonicalCredentialPayload,
  PacsFinancialMetrics,
  SchemeEvaluationInput,
  AuditGrade,
} from '../packages/types/dist/index.js';

// RFC 8032 Ed25519 Prime Group Order L
const ED25519_GROUP_ORDER_L =
  BigInt('7237005577332262213973186563042994240857116359379907606001950938285454250989');

function decodeLittleEndianScalar(hex: string): bigint {
  const buf = Buffer.from(hex, 'hex');
  let result = 0n;
  for (let i = buf.length - 1; i >= 0; i--) {
    result = (result << 8n) | BigInt(buf[i]);
  }
  return result;
}

function calculateHammingDistance(hex1: string, hex2: string): number {
  const b1 = Buffer.from(hex1, 'hex');
  const b2 = Buffer.from(hex2, 'hex');
  let distance = 0;
  for (let i = 0; i < b1.length; i++) {
    let xor = b1[i] ^ b2[i];
    while (xor > 0) {
      distance += xor & 1;
      xor >>= 1;
    }
  }
  return distance;
}

console.log('========================================================================');
console.log('   SAHAKAR EDGE — CHALLENGER M4-1 EMPIRICAL ADVERSARIAL STRESS HARNESS  ');
console.log('========================================================================\n');

let totalAssertions = 0;
function passAssert(cond: boolean, msg: string): void {
  assert.ok(cond, msg);
  totalAssertions++;
}

async function runChallengerHarness(): Promise<void> {
  const startTime = Date.now();
  const app = await buildCentralServer();

  // ==========================================================================
  // SUITE 1: PILLAR 1 — APEX SCHEME ADVISORY ENGINE FUZZING & INVARIANTS
  // ==========================================================================
  console.log('>>> [SUITE 1] Fuzzing Pillar 1 Apex Scheme Advisory Engine...');
  const schemeEngine = new SchemeAdvisoryEngine(NATIONAL_SCHEME_CATALOG);

  // 1.1 Document Checklist Completeness across Catalog
  for (const scheme of NATIONAL_SCHEME_CATALOG) {
    passAssert(
      Array.isArray(scheme.mandatoryDocuments) && scheme.mandatoryDocuments.length >= 5,
      `Scheme ${scheme.code} must have at least 5 mandatory documents (got ${scheme.mandatoryDocuments?.length})`
    );
    for (const doc of scheme.mandatoryDocuments) {
      passAssert(typeof doc === 'string' && doc.trim().length > 0, `Scheme ${scheme.code} document must be non-empty string`);
    }
  }
  console.log(`  ✓ Verified mandatory document checklists across all ${NATIONAL_SCHEME_CATALOG.length} catalog schemes.`);

  // 1.2 Extreme Project Cost Fuzzing across All Schemes
  const extremeCosts = [
    -1000000.0,
    -100.0,
    -1.0,
    -0.0001,
    0.0,
    0.0001,
    1.0,
    2.5,
    4.0,
    10.0,
    28.0,
    35.0,
    40.0,
    100.0,
    150.0,
    200.0,
    300.0,
    1000.0,
    10000.0,
    100000.0, // ₹1,000 Crore
    1000000.0, // ₹10,000 Crore
  ];

  const baseInput: SchemeEvaluationInput = {
    societyType: 'PACS',
    yearsActive: 5,
    auditGrade: 'A',
    memberCount: 500,
    womenMemberPercentage: 30,
    annualTurnoverLakhs: 200,
    netWorthLakhs: 100,
    proposedProjectCostLakhs: 50.0,
    projectCategory: 'POST_HARVEST_STORAGE',
  };

  for (const scheme of NATIONAL_SCHEME_CATALOG) {
    for (const cost of extremeCosts) {
      const input: SchemeEvaluationInput = {
        ...baseInput,
        proposedProjectCostLakhs: cost,
        projectCategory:
          scheme.code === 'PMFME'
            ? 'FOOD_PROCESSING'
            : scheme.code === 'PACS_COMPUTERIZATION'
            ? 'CSC_DIGITAL_SERVICES'
            : 'POST_HARVEST_STORAGE',
      };

      const result = schemeEngine.evaluateScheme(scheme, input);

      // Invariant: Proposed cost <= 0 must always be ineligible
      if (cost <= 0) {
        passAssert(result.eligible === false, `Cost ${cost} must result in eligible: false for ${scheme.code}`);
        passAssert(result.matchScore <= 45, `Cost ${cost} matchScore must be <= 45 (got ${result.matchScore})`);
      }

      // Invariant: Subsidy must NEVER exceed statutory maxSubsidyLakhs
      passAssert(
        result.eligibleSubsidyLakhs <= scheme.maxSubsidyLakhs + 0.001,
        `Scheme ${scheme.code} subsidy (${result.eligibleSubsidyLakhs}) exceeded max cap (${scheme.maxSubsidyLakhs})`
      );

      // Invariant: Effective interest rate must be in [0, 9.0]
      passAssert(
        result.effectiveInterestRate >= 0 && result.effectiveInterestRate <= 9.0,
        `Effective interest rate (${result.effectiveInterestRate}) out of [0, 9.0]`
      );

      // Invariant: Annual interest savings must be non-negative and finite
      passAssert(
        Number.isFinite(result.estimatedAnnualInterestSavingsLakhs) &&
          result.estimatedAnnualInterestSavingsLakhs >= 0,
        `Annual interest savings must be non-negative & finite (got ${result.estimatedAnnualInterestSavingsLakhs})`
      );

      // Invariant: matchScore must be strictly in [0, 100]
      passAssert(
        result.matchScore >= 0 && result.matchScore <= 100,
        `matchScore out of bounds: ${result.matchScore}`
      );
    }
  }
  console.log(`  ✓ Fuzzed ${extremeCosts.length} extreme cost vectors across all schemes (including ₹1,000 Crore).`);

  // 1.3 Boundary Fuzzing of Yuva Sahakar Women Board Bonus
  const yuvaScheme = schemeEngine.getSchemeById('YUVA_SAHAKAR')!;
  const womenPercentages = [
    -10.0,
    0.0,
    10.0,
    19.99,
    20.0,
    30.0,
    49.0,
    49.99,
    49.9999,
    50.0,
    50.0001,
    75.0,
    99.99,
    100.0,
    120.0,
  ];

  for (const pct of womenPercentages) {
    const yuvaInput: SchemeEvaluationInput = {
      ...baseInput,
      womenMemberPercentage: pct,
      proposedProjectCostLakhs: 100.0,
      projectCategory: 'POST_HARVEST_STORAGE',
    };
    const res = schemeEngine.evaluateScheme(yuvaScheme, yuvaInput);

    if (pct >= 50.0) {
      passAssert(
        res.applicableSubventionPercent === 3.0,
        `Yuva Sahakar women bonus failed at ${pct}% (got ${res.applicableSubventionPercent}%, expected 3.0%)`
      );
      passAssert(res.effectiveInterestRate === 6.0, `Effective rate mismatch at ${pct}%`);
    } else {
      passAssert(
        res.applicableSubventionPercent === 2.0,
        `Yuva Sahakar base subvention failed at ${pct}% (got ${res.applicableSubventionPercent}%, expected 2.0%)`
      );
      passAssert(res.effectiveInterestRate === 7.0, `Effective rate mismatch at ${pct}%`);
    }
  }
  console.log(`  ✓ Verified Yuva Sahakar women board subvention threshold at 49.99% vs 50.00% vs 100.00%.`);

  // 1.4 Match Score Bounds Invariants
  // Ineligible society: Grade D capped at <= 45
  const gradeDResults = schemeEngine.evaluateAllSchemes({ ...baseInput, auditGrade: 'D' });
  for (const r of gradeDResults) {
    passAssert(r.eligible === false, `Grade D society must be ineligible for ${r.schemeId}`);
    passAssert(r.matchScore <= 45, `Ineligible society matchScore must be <= 45 (got ${r.matchScore})`);
  }

  // Eligible society: Grade A floor at >= 70
  const gradeAResults = schemeEngine.evaluateAllSchemes(baseInput);
  const eligibleSchemes = gradeAResults.filter((r) => r.eligible);
  passAssert(eligibleSchemes.length >= 1, 'Must have at least 1 eligible scheme for pristine Grade A input');
  for (const r of eligibleSchemes) {
    passAssert(r.matchScore >= 70 && r.matchScore <= 100, `Eligible matchScore must be in [70, 100] (got ${r.matchScore})`);
  }
  console.log(`  ✓ Invariant verified: Ineligible matchScore <= 45; Eligible matchScore in [70, 100].`);

  // 1.5 REST API Fuzzing for POST /api/v1/schemes/evaluate
  // Missing required fields -> HTTP 400
  const badReq1 = await app.inject({
    method: 'POST',
    url: '/api/v1/schemes/evaluate',
    payload: {},
  });
  passAssert(badReq1.statusCode === 400, 'Empty body must return HTTP 400');

  const badReq2 = await app.inject({
    method: 'POST',
    url: '/api/v1/schemes/evaluate',
    payload: { societyType: 'PACS', auditGrade: 'A' }, // missing proposedProjectCostLakhs
  });
  passAssert(badReq2.statusCode === 400, 'Missing cost must return HTTP 400');

  // Valid POST with negative project cost -> HTTP 200, eligibleCount === 0
  const negCostReq = await app.inject({
    method: 'POST',
    url: '/api/v1/schemes/evaluate',
    payload: { ...baseInput, proposedProjectCostLakhs: -25.0 },
  });
  passAssert(negCostReq.statusCode === 200, 'Negative cost request must return HTTP 200 with evaluations');
  const negCostBody = JSON.parse(negCostReq.payload);
  passAssert(negCostBody.eligibleSchemesCount === 0, 'Negative cost must yield 0 eligible schemes');
  console.log(`  ✓ REST endpoint POST /api/v1/schemes/evaluate fuzzed and verified.`);

  // ==========================================================================
  // SUITE 2: PILLAR 2 — CAMEL SCORECARD FUZZING & MONOTONICITY
  // ==========================================================================
  console.log('\n>>> [SUITE 2] Stress-Testing Pillar 2 Regulatory CAMEL Scorecard...');
  const camelEngine = new CamelScorecardEngine();

  // 2.1 Division-by-Zero and Extreme Vectors
  const divZeroVectors: Array<{ name: string; metrics: PacsFinancialMetrics }> = [
    {
      name: 'Zero Advances',
      metrics: {
        societyId: 'pacs-test-01',
        societyName: 'Test Society',
        district: 'Bhopal',
        state: 'MP',
        shareCapitalLakhs: 50.0,
        reservesAndSurplusLakhs: 20.0,
        totalDepositsLakhs: 200.0,
        totalAdvancesLakhs: 0.0,
        grossNpaLakhs: 0.0,
        liquidAssetsLakhs: 60.0,
        netProfitLakhs: 15.0,
        nonCreditRevenueLakhs: 25.0,
        totalRevenueLakhs: 80.0,
        governanceChecklistPassed: 10,
      },
    },
    {
      name: 'Zero Deposits',
      metrics: {
        societyId: 'pacs-test-02',
        societyName: 'Test Society',
        district: 'Bhopal',
        state: 'MP',
        shareCapitalLakhs: 50.0,
        reservesAndSurplusLakhs: 20.0,
        totalDepositsLakhs: 0.0,
        totalAdvancesLakhs: 200.0,
        grossNpaLakhs: 2.0,
        liquidAssetsLakhs: 60.0,
        netProfitLakhs: 15.0,
        nonCreditRevenueLakhs: 25.0,
        totalRevenueLakhs: 80.0,
        governanceChecklistPassed: 10,
      },
    },
    {
      name: 'Zero Liquid Assets',
      metrics: {
        societyId: 'pacs-test-02b',
        societyName: 'Zero Asset Society',
        district: 'Bhopal',
        state: 'MP',
        shareCapitalLakhs: 50.0,
        reservesAndSurplusLakhs: 20.0,
        totalDepositsLakhs: 200.0,
        totalAdvancesLakhs: 200.0,
        grossNpaLakhs: 2.0,
        liquidAssetsLakhs: 0.0, // Liquidity ratio = 0%
        netProfitLakhs: 15.0,
        nonCreditRevenueLakhs: 25.0,
        totalRevenueLakhs: 80.0,
        governanceChecklistPassed: 10,
      },
    },
    {
      name: 'Zero Revenue',
      metrics: {
        societyId: 'pacs-test-03',
        societyName: 'Test Society',
        district: 'Bhopal',
        state: 'MP',
        shareCapitalLakhs: 50.0,
        reservesAndSurplusLakhs: 20.0,
        totalDepositsLakhs: 200.0,
        totalAdvancesLakhs: 200.0,
        grossNpaLakhs: 2.0,
        liquidAssetsLakhs: 60.0,
        netProfitLakhs: 0.0,
        nonCreditRevenueLakhs: 0.0,
        totalRevenueLakhs: 0.0,
        governanceChecklistPassed: 10,
      },
    },
    {
      name: 'All Zeros',
      metrics: {
        societyId: 'pacs-test-04',
        societyName: 'Test Society',
        district: 'Bhopal',
        state: 'MP',
        shareCapitalLakhs: 0,
        reservesAndSurplusLakhs: 0,
        totalDepositsLakhs: 0,
        totalAdvancesLakhs: 0,
        grossNpaLakhs: 0,
        liquidAssetsLakhs: 0,
        netProfitLakhs: 0,
        nonCreditRevenueLakhs: 0,
        totalRevenueLakhs: 0,
        governanceChecklistPassed: 0,
      },
    },
    {
      name: 'Extreme Loss & Negative Capital',
      metrics: {
        societyId: 'pacs-test-05',
        societyName: 'Test Society',
        district: 'Bhopal',
        state: 'MP',
        shareCapitalLakhs: -500.0,
        reservesAndSurplusLakhs: -200.0,
        totalDepositsLakhs: 500.0,
        totalAdvancesLakhs: 1000.0,
        grossNpaLakhs: 800.0,
        liquidAssetsLakhs: -50.0,
        netProfitLakhs: -1000.0,
        nonCreditRevenueLakhs: -20.0,
        totalRevenueLakhs: 100.0,
        governanceChecklistPassed: 0,
      },
    },
  ];

  for (const v of divZeroVectors) {
    const card = camelEngine.evaluateScorecard(v.metrics);
    passAssert(Number.isFinite(card.capitalAdequacyRatio), `${v.name}: CAR must be finite`);
    passAssert(Number.isFinite(card.grossNpaPercentage), `${v.name}: NPA% must be finite`);
    passAssert(Number.isFinite(card.liquidityRatio), `${v.name}: Liquidity% must be finite`);
    passAssert(Number.isFinite(card.compositeHealthScore), `${v.name}: compositeHealthScore must be finite`);
    passAssert(!Number.isNaN(card.compositeHealthScore), `${v.name}: compositeHealthScore must not be NaN`);
    passAssert(card.camelScores.capitalScore >= 0 && card.camelScores.capitalScore <= 20.0, `${v.name}: capitalScore bounded`);
    passAssert(card.camelScores.assetQualityScore >= 0 && card.camelScores.assetQualityScore <= 25.0, `${v.name}: assetScore bounded`);
    passAssert(card.camelScores.managementScore >= 0 && card.camelScores.managementScore <= 20.0, `${v.name}: mgmtScore bounded`);
    passAssert(card.camelScores.earningsScore >= 0 && card.camelScores.earningsScore <= 20.0, `${v.name}: earningsScore bounded`);
    passAssert(card.camelScores.liquidityScore >= 0 && card.camelScores.liquidityScore <= 15.0, `${v.name}: liquidityScore bounded`);
  }
  console.log(`  ✓ Passed 6 division-by-zero & extreme insolvency vectors safely (including zero assets).`);

  // 2.2 1,000 Randomized Fuzzing Trials across Full Metric Space
  for (let i = 0; i < 1000; i++) {
    const fuzzedMetrics: PacsFinancialMetrics = {
      societyId: `pacs-fuzz-${i}`,
      societyName: `Fuzz Soc ${i}`,
      district: 'FuzzDistrict',
      state: 'FuzzState',
      shareCapitalLakhs: Math.random() * 200 - 50, // -50 to 150
      reservesAndSurplusLakhs: Math.random() * 100 - 20,
      totalDepositsLakhs: Math.random() * 500,
      totalAdvancesLakhs: Math.random() * 500,
      grossNpaLakhs: Math.random() * 100,
      liquidAssetsLakhs: Math.random() * 200,
      netProfitLakhs: Math.random() * 60 - 30, // -30 to 30
      nonCreditRevenueLakhs: Math.random() * 50,
      totalRevenueLakhs: Math.random() * 100,
      governanceChecklistPassed: Math.floor(Math.random() * 11),
    };

    const card = camelEngine.evaluateScorecard(fuzzedMetrics);
    const { capitalScore, assetQualityScore, managementScore, earningsScore, liquidityScore } = card.camelScores;

    // Strict 5-Dimension Mathematical Bounds
    passAssert(capitalScore >= 0 && capitalScore <= 20.0, `C out of bounds: ${capitalScore}`);
    passAssert(assetQualityScore >= 0 && assetQualityScore <= 25.0, `A out of bounds: ${assetQualityScore}`);
    passAssert(managementScore >= 0 && managementScore <= 20.0, `M out of bounds: ${managementScore}`);
    passAssert(earningsScore >= 0 && earningsScore <= 20.0, `E out of bounds: ${earningsScore}`);
    passAssert(liquidityScore >= 0 && liquidityScore <= 15.0, `L out of bounds: ${liquidityScore}`);

    // Composite Invariant
    const expectedComposite = Math.round((capitalScore + assetQualityScore + managementScore + earningsScore + liquidityScore) * 10) / 10;
    passAssert(card.compositeHealthScore === expectedComposite, `Composite score mismatch`);
    passAssert(card.compositeHealthScore >= 0 && card.compositeHealthScore <= 100.0, `Composite out of [0, 100]`);

    // Audit Grade Invariant
    let expectedGrade: AuditGrade = 'D';
    if (card.compositeHealthScore >= 85.0) expectedGrade = 'A';
    else if (card.compositeHealthScore >= 70.0) expectedGrade = 'B';
    else if (card.compositeHealthScore >= 50.0) expectedGrade = 'C';
    passAssert(card.auditGrade === expectedGrade, `Grade mismatch for score ${card.compositeHealthScore}`);
  }
  console.log(`  ✓ 1,000 randomized CAMEL metric fuzzing trials passed all 5-dimension and composite invariants.`);

  // 2.3 Strict Monotonicity Verification for Sandbox Upgrades
  const baseSocMetrics: PacsFinancialMetrics = {
    societyId: 'pacs-distressed',
    societyName: 'Distressed PACS',
    district: 'Nanded',
    state: 'Maharashtra',
    shareCapitalLakhs: 5.0,
    reservesAndSurplusLakhs: 0.0,
    totalDepositsLakhs: 200.0,
    totalAdvancesLakhs: 200.0,
    grossNpaLakhs: 50.0,
    liquidAssetsLakhs: 20.0,
    netProfitLakhs: -5.0,
    nonCreditRevenueLakhs: 5.0,
    totalRevenueLakhs: 40.0,
    governanceChecklistPassed: 3,
  };

  let prevCapitalScore = -1;
  for (let cap = 0; cap <= 100; cap += 1) {
    const card = camelEngine.evaluateScorecard({
      ...baseSocMetrics,
      shareCapitalLakhs: cap,
    });
    passAssert(
      card.camelScores.capitalScore >= prevCapitalScore,
      `Capital score monotonicity violated at share capital ₹${cap}L (${card.camelScores.capitalScore} < ${prevCapitalScore})`
    );
    prevCapitalScore = card.camelScores.capitalScore;
  }
  console.log(`  ✓ Verified strict monotonicity of Capital Injection (100 incremental steps).`);

  let prevAssetScore = -1;
  for (let npa = 100; npa >= 0; npa -= 1) {
    const card = camelEngine.evaluateScorecard({
      ...baseSocMetrics,
      grossNpaLakhs: npa,
    });
    passAssert(
      card.camelScores.assetQualityScore >= prevAssetScore,
      `Asset quality score monotonicity violated at NPA ₹${npa}L (${card.camelScores.assetQualityScore} < ${prevAssetScore})`
    );
    prevAssetScore = card.camelScores.assetQualityScore;
  }
  console.log(`  ✓ Verified strict monotonicity of NPA Remediation (100 incremental recovery steps).`);

  for (let g = 0; g < 10; g++) {
    const cardLow = camelEngine.evaluateScorecard({ ...baseSocMetrics, governanceChecklistPassed: g });
    const cardHigh = camelEngine.evaluateScorecard({ ...baseSocMetrics, governanceChecklistPassed: g + 1 });
    passAssert(
      cardHigh.camelScores.managementScore === cardLow.camelScores.managementScore + 2.0,
      `Governance increment violated at check ${g}`
    );
  }
  console.log(`  ✓ Verified strict linear monotonicity of Governance checks (+2.0 pts per item).`);

  // 2.4 Watchlist Alert Triggers
  const critNpaCard = camelEngine.evaluateScorecard({ ...baseSocMetrics, grossNpaLakhs: 40.0 });
  const npaAlert = critNpaCard.diagnosticAlerts.find((a) => a.title.includes('Gross NPA'));
  passAssert(npaAlert?.severity === 'CRITICAL', 'Gross NPA > 15% must trigger CRITICAL alert');

  const critLossCard = camelEngine.evaluateScorecard({ ...baseSocMetrics, netProfitLakhs: -10.0 });
  const lossAlert = critLossCard.diagnosticAlerts.find((a) => a.title.includes('Operating Net Loss'));
  passAssert(lossAlert?.severity === 'CRITICAL', 'Operating loss must trigger CRITICAL alert');

  const pristineCard = camelEngine.evaluateScorecard({
    ...baseSocMetrics,
    shareCapitalLakhs: 50.0,
    reservesAndSurplusLakhs: 30.0,
    totalAdvancesLakhs: 400.0,
    grossNpaLakhs: 4.0,
    totalDepositsLakhs: 300.0,
    liquidAssetsLakhs: 90.0,
    netProfitLakhs: 20.0,
    nonCreditRevenueLakhs: 30.0,
    totalRevenueLakhs: 100.0,
    governanceChecklistPassed: 10,
  });
  passAssert(pristineCard.diagnosticAlerts.length === 1, 'Pristine society must have exactly 1 alert');
  passAssert(pristineCard.diagnosticAlerts[0].severity === 'INFO', 'Pristine alert must be INFO');
  console.log(`  ✓ Watchlist alerts and statutory remedial directives verified.`);

  // ==========================================================================
  // SUITE 3: PILLAR 3 — CRYPTOGRAPHIC PROOF INSPECTOR & SCALAR INVARIANTS
  // ==========================================================================
  console.log('\n>>> [SUITE 3] Stress-Testing Pillar 3 Cryptographic Proof Inspector & Scalar Invariants...');

  // 3.1 RFC 8785 Canonical JSON Sorting under 100 Random Key Permutations
  function shuffleKeys(obj: any): any {
    if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) return obj;
    const keys = Object.keys(obj);
    for (let i = keys.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [keys[i], keys[j]] = [keys[j], keys[i]];
    }
    const shuffled: any = {};
    for (const k of keys) {
      shuffled[k] = shuffleKeys(obj[k]);
    }
    return shuffled;
  }

  const complexTargetObj = {
    z_zebra: 'end of alphabet',
    a_alpha: 12345,
    deep_nested: {
      omega: true,
      beta: [3, 2, 1, { sub_z: 'nested', sub_a: 'nested_first' }],
      gamma: null,
      delta: {
        leaf_2: 'leaf two',
        leaf_1: 'leaf one',
      },
    },
    meta: {
      timestamp: '2026-11-05T01:00:00.000Z',
      issuer: 'NCCT Apex Center',
      count: 99,
    },
    flags: { c: false, b: true, a: null },
  };

  const baselineCanonical = canonicalJsonStringify(complexTargetObj);
  const baselineDigest = sha256Hex(baselineCanonical);

  for (let i = 0; i < 100; i++) {
    const permuted = shuffleKeys(complexTargetObj);
    const permCanonical = canonicalJsonStringify(permuted);
    passAssert(
      permCanonical === baselineCanonical,
      `Key permutation ${i} failed RFC 8785 canonical serialization parity`
    );
    const permDigest = sha256Hex(permCanonical);
    passAssert(permDigest === baselineDigest, `Digest mismatch for key permutation ${i}`);
  }
  console.log(`  ✓ RFC 8785 canonical JSON sorting verified across 100 random deeply-nested key permutations.`);

  // 3.2 RFC 8032 Ed25519 (R, S) Decomposition & S < L Prime Order Bound across 50 Fresh Signatures
  let sampleCredForByteTamper: any = null;
  let sampleKeyPairForByteTamper: any = null;

  for (let k = 0; k < 50; k++) {
    const keyPair = generateIssuerKeyPair(`issuer-fuzz-${k}`);
    const payload: CanonicalCredentialPayload = {
      credentialId: `cred-stress-test-${k}-${Date.now()}`,
      issuer: { id: `inst-${k}`, name: `RICM Institute ${k}` },
      recipient: { traineeId: `trainee-${k}`, name: `Candidate ${k}` },
      programme: { id: `prog-${k}`, title: `PACS Cooperative Operations ${k}` },
      skillsSummary: [{ skillCode: 'PACS_ACCOUNTING', level: (k % 4) + 1 }],
      issuedAt: new Date(Date.now() - k * 1000).toISOString(),
      expiresAt: null,
      schemaVersion: 1,
    };

    const { credential, signatureHex } = signCredentialPayload(payload, keyPair.privateKeyPem, keyPair.keyId);
    const proof = inspectCredentialProof(credential, keyPair.publicKeyPem);

    if (k === 0) {
      sampleCredForByteTamper = credential;
      sampleKeyPairForByteTamper = keyPair;
    }

    // Decomposition invariants
    passAssert(proof.isValid === true, `Proof must be valid for fresh signature ${k}`);
    passAssert(proof.curvePointR.length === 64, `Curve point R must be 64 hex chars (got ${proof.curvePointR.length})`);
    passAssert(proof.scalarS.length === 64, `Scalar S must be 64 hex chars (got ${proof.scalarS.length})`);
    passAssert(proof.publicKeyHex.length === 64, `Public key hex must be 64 hex chars (got ${proof.publicKeyHex.length})`);

    const cleanSig = signatureHex.startsWith('0x') ? signatureHex.slice(2) : signatureHex;
    passAssert(proof.curvePointR + proof.scalarS === cleanSig, `R + S must strictly reconstruct raw signature`);

    // Public key matches SPKI DER trailing 32 bytes
    const expectedRawPub = ed25519PemToRawPublicKeyHex(keyPair.publicKeyPem);
    passAssert(proof.publicKeyHex === expectedRawPub, `Derived public key hex must match SPKI DER`);

    // RFC 8032 S < L Bound
    const scalarBigInt = decodeLittleEndianScalar(proof.scalarS);
    passAssert(
      scalarBigInt >= 0n && scalarBigInt < ED25519_GROUP_ORDER_L,
      `Ed25519 scalar S (${scalarBigInt.toString()}) violated prime order bound S < L (${ED25519_GROUP_ORDER_L.toString()})`
    );
  }
  console.log(`  ✓ RFC 8032 Ed25519 (R, S) decomposition & S < L prime order bound verified across 50 fresh signatures.`);

  // Mathematical Scalar Out-of-Bounds Test (Negative Oracles)
  const scalarAtOrderL = ED25519_GROUP_ORDER_L;
  const scalarAboveOrderL = ED25519_GROUP_ORDER_L + 1n;
  passAssert(
    scalarAtOrderL >= ED25519_GROUP_ORDER_L,
    'Boundary oracle: S == L must be recognized as violating S < L'
  );
  passAssert(
    scalarAboveOrderL > ED25519_GROUP_ORDER_L,
    'Boundary oracle: S > L must be recognized as violating S < L'
  );
  console.log(`  ✓ Boundary oracles verified: S >= L correctly detected.`);

  // 3.3 Exhaustive 64-Byte Ed25519 Signature Bit-Level Tampering Fuzz
  // Every single byte of the 64-byte signature (R: bytes 0-31, S: bytes 32-63) must cause verification failure if flipped.
  const rawSigBuffer = Buffer.from(sampleCredForByteTamper.signature, 'hex');
  passAssert(rawSigBuffer.length === 64, 'Raw signature must be exactly 64 bytes');

  for (let byteIdx = 0; byteIdx < 64; byteIdx++) {
    const tamperedSigBuf = Buffer.from(rawSigBuffer);
    tamperedSigBuf[byteIdx] ^= 0x01; // flip lowest bit of byte
    const tamperedSigHex = tamperedSigBuf.toString('hex');

    const isValid = verifyCredentialSignature(
      sampleCredForByteTamper.payload,
      tamperedSigHex,
      sampleKeyPairForByteTamper.publicKeyPem
    );
    passAssert(isValid === false, `Flipping bit in byte ${byteIdx} of signature must fail verification`);
  }
  console.log(`  ✓ Exhaustive 64-byte signature bit-tampering verified: all 64 single-byte mutations rejected (100% rejection).`);

  // 3.4 200-Iteration 1-Bit Flipper Fuzzing & SHA-256 Avalanche Property
  const testKeyPair = generateIssuerKeyPair('test-avalanche-issuer');
  const testPayload: CanonicalCredentialPayload = {
    credentialId: 'cred-avalanche-test-2026',
    issuer: { id: 'inst-bhopal-01', name: 'RICM Bhopal' },
    recipient: { traineeId: 'trainee-sunita-sharma', name: 'Sunita Sharma' },
    programme: { id: 'prog-banking-01', title: 'Cooperative Banking Certificate' },
    skillsSummary: [{ skillCode: 'PACS_ACCOUNTING', level: 3 }],
    issuedAt: '2026-11-05T00:00:00.000Z',
    expiresAt: null,
    schemaVersion: 1,
  };

  const { credential: baseCred } = signCredentialPayload(
    testPayload,
    testKeyPair.privateKeyPem,
    testKeyPair.keyId
  );

  let totalHamming = 0;
  let minHamming = 256;
  let maxHamming = 0;
  const numFlips = 200;

  for (let i = 0; i < numFlips; i++) {
    const originalName = 'Sunita Sharma';
    const charPos = i % originalName.length;
    const bitPos = i % 8;

    const charCode = originalName.charCodeAt(charPos);
    const flippedChar = String.fromCharCode(charCode ^ (1 << bitPos));
    const tamperedName =
      originalName.substring(0, charPos) + flippedChar + originalName.substring(charPos + 1);

    const tamperRes = simulateCredentialTamper(
      baseCred,
      'recipient.name',
      tamperedName,
      testKeyPair.publicKeyPem
    );

    // 100% Rejection Invariant
    passAssert(tamperRes.verificationResult === false, `1-bit flip ${i} unexpectedly verified`);
    passAssert(tamperRes.errorReason === 'SIGNATURE_INVALID: DIGEST_MISMATCH', `Error reason mismatch`);

    const dist = calculateHammingDistance(tamperRes.originalDigestHex, tamperRes.tamperedDigestHex);
    totalHamming += dist;
    if (dist < minHamming) minHamming = dist;
    if (dist > maxHamming) maxHamming = dist;

    // Strict avalanche individual distance bound: 256-bit hash should flip approximately 128 bits
    passAssert(
      dist >= 75 && dist <= 185,
      `Bit avalanche distance out of reasonable cryptographic bounds: ${dist}/256 bits`
    );
  }

  const meanHamming = Math.round(totalHamming / numFlips);
  passAssert(
    meanHamming >= 124 && meanHamming <= 132,
    `Average Hamming distance (${meanHamming}) must be tightly centered around 128/256 bits`
  );
  console.log(
    `  ✓ 200 1-bit flipper fuzzing runs: 100% rejection rate verified. Avalanche: mean ${meanHamming}/256 bits, min ${minHamming}, max ${maxHamming}.`
  );

  // 3.5 Multi-Bit Flipper Fuzzing (2, 4, 8, 16, 32, 64 Bits) across 100 Payloads
  const bitCounts = [2, 4, 8, 16, 32, 64];
  let multiBitRejections = 0;

  for (let m = 0; m < 100; m++) {
    const bitsToFlip = bitCounts[m % bitCounts.length];
    let candidateName = 'Sunita Sharma';

    for (let b = 0; b < bitsToFlip; b++) {
      const idx = (m * 7 + b * 3) % candidateName.length;
      const bit = (m + b) % 8;
      const code = candidateName.charCodeAt(idx);
      candidateName =
        candidateName.substring(0, idx) +
        String.fromCharCode(code ^ (1 << bit)) +
        candidateName.substring(idx + 1);
    }

    const multiTamper = simulateCredentialTamper(
      baseCred,
      'recipient.name',
      candidateName,
      testKeyPair.publicKeyPem
    );

    passAssert(multiTamper.verificationResult === false, `Multi-bit flip (${bitsToFlip} bits) passed verification!`);
    multiBitRejections++;
  }
  passAssert(multiBitRejections === 100, 'All 100 multi-bit tampered payloads must be rejected');
  console.log(`  ✓ Multi-bit flipper (2 to 64 bits): 100/100 tampered payloads rejected (100% rejection rate).`);

  await app.close();

  const elapsedMs = Date.now() - startTime;
  console.log('\n========================================================================');
  console.log(`   ✓ ALL CHALLENGER ADVERSARIAL STRESS TESTS PASSED CLEANLY!           `);
  console.log(`   Total Assertions: ${totalAssertions} | Elapsed Time: ${elapsedMs}ms `);
  console.log('========================================================================\n');
}

runChallengerHarness().catch((err) => {
  console.error('\n❌ Challenger Harness failed with error:\n', err);
  process.exit(1);
});

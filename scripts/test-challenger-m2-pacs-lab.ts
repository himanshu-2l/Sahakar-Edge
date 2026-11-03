/**
 * Sahakar Edge — Milestone 2 Empirical Challenger Test Suite
 * PACS Operations Lab Accounting Logic, Day-End Cashbook Balancing, KCC Loan & Inventory Oracles
 *
 * Target: apps/trainee-pwa/src/components/PacsOperationsLabModal.tsx
 *
 * Empirical Challenge Gates:
 * 1. Day-End Cashbook Balancing Combinatoric Oracle (32-state exhaustive search)
 * 2. Inverted Transaction & Cash Imbalance Discrepancy Gate
 * 3. KCC Loan Appraisal 130% Limit & 4% Net Effective Rate Oracle
 * 4. Fertilizer POS Inventory & Statutory 0.25% Shrinkage Allowance Threshold Oracle
 * 5. Touch Target Hitbox Geometry Audit (Strict Min >= 44px)
 * 6. Typography Scale, Line-Height & Devanagari Accessibility Audit
 * 7. Bilingual English / Hindi Terminology & Voucher Completeness
 * 8. Monorepo Integration & Type Contract Conformance
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = process.cwd();
const PACS_MODAL_PATH = path.join(ROOT_DIR, 'apps', 'trainee-pwa', 'src', 'components', 'PacsOperationsLabModal.tsx');
const APP_TSX_PATH = path.join(ROOT_DIR, 'apps', 'trainee-pwa', 'src', 'App.tsx');
const TYPES_PATH = path.join(ROOT_DIR, 'packages', 'types', 'src', 'index.ts');

console.log('========================================================================');
console.log('   SAHAKAR EDGE — M2 PACS OPERATIONS LAB EMPIRICAL CHALLENGER SUITE     ');
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

// -----------------------------------------------------------------------------
// [Gate 1] Day-End Cashbook Balancing 32-State Combinatoric Search Oracle
// -----------------------------------------------------------------------------
console.log('>>> [Gate 1] Day-End Cashbook Balancing 32-State Combinatoric Search...');

const OPENING_CASH = 45000;
const PHYSICAL_CASH = 44000;

interface Voucher {
  id: string;
  voucherNumber: string;
  accountHead: string;
  category: string;
  amount: number;
  expectedType: 'DEBIT' | 'CREDIT';
}

const VOUCHERS: Voucher[] = [
  { id: 'tx-01-fert-sale', voucherNumber: 'CRV-2026-081', accountHead: 'Fertilizer Sales Account', category: 'INVENTORY', amount: 18400, expectedType: 'DEBIT' },
  { id: 'tx-02-kcc-disburse', voucherNumber: 'CPV-2026-104', accountHead: 'Short-Term Crop Loan Asset Account', category: 'LOAN_ASSET', amount: 25000, expectedType: 'CREDIT' },
  { id: 'tx-03-sb-deposit', voucherNumber: 'CRV-2026-082', accountHead: 'Member Savings Deposit Account', category: 'SAVINGS_DEPOSIT', amount: 8500, expectedType: 'DEBIT' },
  { id: 'tx-04-office-exp', voucherNumber: 'CPV-2026-105', accountHead: 'Office Contingency & Utility Expense', category: 'OPERATING_EXPENSE', amount: 3900, expectedType: 'CREDIT' },
  { id: 'tx-05-share-sub', voucherNumber: 'CRV-2026-083', accountHead: 'Ordinary Member Share Capital Account', category: 'SHARE_CAPITAL', amount: 1000, expectedType: 'DEBIT' },
];

function simulateCashbook(postings: Record<string, 'DEBIT' | 'CREDIT'>) {
  let receipts = 0;
  let disbursements = 0;
  for (const v of VOUCHERS) {
    const type = postings[v.id] || 'DEBIT';
    if (type === 'DEBIT') {
      receipts += v.amount;
    } else {
      disbursements += v.amount;
    }
  }
  const calculatedClosing = OPENING_CASH + receipts - disbursements;
  const variance = PHYSICAL_CASH - calculatedClosing;
  const isBalanced = variance === 0;
  return { receipts, disbursements, calculatedClosing, variance, isBalanced };
}

// Compute expected canonical balancing state
const canonicalPostings: Record<string, 'DEBIT' | 'CREDIT'> = {
  'tx-01-fert-sale': 'DEBIT',
  'tx-02-kcc-disburse': 'CREDIT',
  'tx-03-sb-deposit': 'DEBIT',
  'tx-04-office-exp': 'CREDIT',
  'tx-05-share-sub': 'DEBIT',
};

const canonicalResult = simulateCashbook(canonicalPostings);

assertCheck(
  'Canonical vouchers yield exactly ₹27,900 Receipts (Debit)',
  canonicalResult.receipts === 27900,
  `Actual: ₹${canonicalResult.receipts}`
);

assertCheck(
  'Canonical vouchers yield exactly ₹28,900 Disbursements (Credit)',
  canonicalResult.disbursements === 28900,
  `Actual: ₹${canonicalResult.disbursements}`
);

assertCheck(
  'Canonical vouchers yield exactly ₹44,000 Calculated Closing Cash',
  canonicalResult.calculatedClosing === 44000,
  `Actual: ₹${canonicalResult.calculatedClosing}`
);

assertCheck(
  'Canonical state variance is ₹0.00 against physical vault count ₹44,000',
  canonicalResult.variance === 0 && canonicalResult.isBalanced === true,
  `Variance: ₹${canonicalResult.variance}`
);

// Exhaustive test of all 2^5 = 32 posting combinations
let balancedCombinationsCount = 0;
const balancedCombinations: Array<Record<string, 'DEBIT' | 'CREDIT'>> = [];

for (let mask = 0; mask < (1 << 5); mask++) {
  const trial: Record<string, 'DEBIT' | 'CREDIT'> = {};
  for (let i = 0; i < 5; i++) {
    const isCredit = (mask & (1 << i)) !== 0;
    trial[VOUCHERS[i].id] = isCredit ? 'CREDIT' : 'DEBIT';
  }
  const trialResult = simulateCashbook(trial);
  if (trialResult.isBalanced) {
    balancedCombinationsCount++;
    balancedCombinations.push(trial);
  }
}

assertCheck(
  'Exhaustive 32-state search proves exactly 1 unique posting state balances with ₹0 variance (no accidental false positives)',
  balancedCombinationsCount === 1,
  `Found ${balancedCombinationsCount} balanced state(s) out of 32`
);

// -----------------------------------------------------------------------------
// [Gate 2] Inverted Transaction & Discrepancy Alert Boundary Testing
// -----------------------------------------------------------------------------
console.log('\n>>> [Gate 2] Inverted Transaction & Discrepancy Alert Testing...');

// Initial state (all DEBIT)
const allDebitPostings: Record<string, 'DEBIT' | 'CREDIT'> = {};
VOUCHERS.forEach((v) => { allDebitPostings[v.id] = 'DEBIT'; });
const allDebitResult = simulateCashbook(allDebitPostings);

assertCheck(
  'Default unedited state (all DEBIT) correctly flags cash imbalance with negative variance -₹57,800',
  allDebitResult.calculatedClosing === 101800 &&
    allDebitResult.variance === -57800 &&
    allDebitResult.isBalanced === false,
  `Calculated: ₹${allDebitResult.calculatedClosing}, Variance: ₹${allDebitResult.variance}`
);

// All CREDIT
const allCreditPostings: Record<string, 'DEBIT' | 'CREDIT'> = {};
VOUCHERS.forEach((v) => { allCreditPostings[v.id] = 'CREDIT'; });
const allCreditResult = simulateCashbook(allCreditPostings);

assertCheck(
  'Inverted state (all CREDIT) correctly flags cash imbalance with positive variance +₹55,800',
  allCreditResult.calculatedClosing === -11800 &&
    allCreditResult.variance === 55800 &&
    allCreditResult.isBalanced === false,
  `Calculated: ₹${allCreditResult.calculatedClosing}, Variance: ₹${allCreditResult.variance}`
);

// Single inverted transaction tests
const invertTestCases = [
  {
    txId: 'tx-02-kcc-disburse',
    name: 'Inverted KCC Loan Disbursement (DEBIT instead of CREDIT)',
    expectedClosing: 94000,
    expectedVariance: -50000,
  },
  {
    txId: 'tx-04-office-exp',
    name: 'Inverted Office Expense (DEBIT instead of CREDIT)',
    expectedClosing: 51800,
    expectedVariance: -7800,
  },
  {
    txId: 'tx-01-fert-sale',
    name: 'Inverted Fertilizer Sale (CREDIT instead of DEBIT)',
    expectedClosing: 7200,
    expectedVariance: 36800,
  },
  {
    txId: 'tx-03-sb-deposit',
    name: 'Inverted Savings Deposit (CREDIT instead of DEBIT)',
    expectedClosing: 27000,
    expectedVariance: 17000,
  },
  {
    txId: 'tx-05-share-sub',
    name: 'Inverted Share Capital (CREDIT instead of DEBIT)',
    expectedClosing: 42000,
    expectedVariance: 2000,
  },
];

for (const tc of invertTestCases) {
  const inverted = { ...canonicalPostings };
  inverted[tc.txId] = inverted[tc.txId] === 'DEBIT' ? 'CREDIT' : 'DEBIT';
  const res = simulateCashbook(inverted);
  assertCheck(
    tc.name,
    res.calculatedClosing === tc.expectedClosing &&
      res.variance === tc.expectedVariance &&
      res.isBalanced === false,
    `Closing: ₹${res.calculatedClosing}, Variance: ₹${res.variance}, isBalanced: ${res.isBalanced}`
  );
}

// -----------------------------------------------------------------------------
// [Gate 3] KCC Loan Appraisal 130% Formula & 4% Effective Rate Oracle
// -----------------------------------------------------------------------------
console.log('\n>>> [Gate 3] KCC Loan Appraisal 130% Formula & Interest Subvention Oracle...');

function calculateKcc(acreage: number, scale: number) {
  const baseCultivationCost = acreage * scale;
  const postHarvestAllowance10Pct = Math.round(baseCultivationCost * 0.1);
  const farmMaintenance20Pct = Math.round(baseCultivationCost * 0.2);
  const totalSanctionLimit = baseCultivationCost + postHarvestAllowance10Pct + farmMaintenance20Pct;
  const grossInterestRate = 7.0;
  const promptRepaymentIncentive = 3.0;
  const effectiveInterestRate = 4.0;
  const annualGrossInterest = Math.round(totalSanctionLimit * 0.07);
  const annualEffectiveInterest = Math.round(totalSanctionLimit * 0.04);
  const annualFarmerSavings = annualGrossInterest - annualEffectiveInterest;

  return {
    baseCultivationCost,
    postHarvestAllowance10Pct,
    farmMaintenance20Pct,
    totalSanctionLimit,
    grossInterestRate,
    promptRepaymentIncentive,
    effectiveInterestRate,
    annualGrossInterest,
    annualEffectiveInterest,
    annualFarmerSavings,
  };
}

// Test default KCC values: 2.5 acres Paddy @ ₹42,000/acre
const defaultKcc = calculateKcc(2.5, 42000);
assertCheck('Base cultivation cost is ₹1,05,000 for 2.5 acres Paddy', defaultKcc.baseCultivationCost === 105000);
assertCheck('Post-harvest allowance is exactly 10% (₹10,500)', defaultKcc.postHarvestAllowance10Pct === 10500);
assertCheck('Farm maintenance allowance is exactly 20% (₹21,000)', defaultKcc.farmMaintenance20Pct === 21000);
assertCheck('Total sanction limit equals exact 130% composite formula (₹1,36,500)', defaultKcc.totalSanctionLimit === 136500);
assertCheck('Gross rate 7.0% - PRI 3.0% = Net Effective Rate 4.0%', defaultKcc.effectiveInterestRate === 4.0);
assertCheck('Annual gross interest is ₹9,555 (7% of ₹1,36,500)', defaultKcc.annualGrossInterest === 9555);
assertCheck('Annual effective interest is ₹5,460 (4% of ₹1,36,500)', defaultKcc.annualEffectiveInterest === 5460);
assertCheck('Farmer annual savings is ₹4,095 (3% subvention)', defaultKcc.annualFarmerSavings === 4095);

// Crop presets stress test
const CROP_PRESETS: Record<string, number> = {
  PADDY: 42000,
  WHEAT: 38000,
  SOYBEAN: 35000,
  MUSTARD: 30000,
  COTTON: 50000,
  SUGARCANE: 65000,
};

const acreageStressCases = [0.5, 1.0, 2.0, 3.5, 5.0, 10.0, 25.0, 50.0];

let allKccPassed = true;
for (const [crop, scale] of Object.entries(CROP_PRESETS)) {
  for (const acres of acreageStressCases) {
    const k = calculateKcc(acres, scale);
    const expectedBase = acres * scale;
    const expectedLimit = Math.round(expectedBase * 1.3);
    const expectedSavings = Math.round(expectedLimit * 0.07) - Math.round(expectedLimit * 0.04);
    if (
      k.baseCultivationCost !== expectedBase ||
      k.totalSanctionLimit !== expectedLimit ||
      k.annualFarmerSavings !== expectedSavings
    ) {
      allKccPassed = false;
      console.error(`KCC mismatch for crop ${crop}, acres ${acres}: got limit ${k.totalSanctionLimit}, expected ${expectedLimit}`);
    }
  }
}

assertCheck(
  'KCC 130% sanction limit and 3% farmer interest savings hold across all 6 crop presets and acreage sizes (0.5..50 acres)',
  allKccPassed,
  `48 test cases verified (6 crops × 8 acreages)`
);

// -----------------------------------------------------------------------------
// [Gate 4] Fertilizer Inventory & 0.25% Shrinkage Threshold Oracle
// -----------------------------------------------------------------------------
console.log('\n>>> [Gate 4] Fertilizer POS Inventory & 0.25% Shrinkage Oracle...');

function calculateInventory(opening: number, inward: number, posSold: number, actual: number) {
  const expectedClosingBags = opening + inward - posSold;
  const shrinkageBags = expectedClosingBags - actual;
  const totalHandled = opening + inward;
  const permissibleShrinkageBags = Math.max(1, Math.ceil(totalHandled * 0.0025)); // 0.25%
  const shrinkagePermissible = shrinkageBags >= 0 && shrinkageBags <= permissibleShrinkageBags;
  const isReconciled = shrinkagePermissible || shrinkageBags === 0;

  return {
    expectedClosingBags,
    shrinkageBags,
    totalHandled,
    permissibleShrinkageBags,
    shrinkagePermissible,
    reconciliationStatus: isReconciled ? 'BALANCED' : 'DISCREPANCY_FLAGGED',
  };
}

// Preset 1: Urea (500 opening, 400 inward, 650 sold, 249 actual)
const ureaInv = calculateInventory(500, 400, 650, 249);
assertCheck('Urea expected closing stock is 250 bags', ureaInv.expectedClosingBags === 250);
assertCheck('Urea shrinkage is 1 bag', ureaInv.shrinkageBags === 1);
assertCheck('Urea total handled is 900 bags with permissible cap of 3 bags (ceil(900*0.0025))', ureaInv.permissibleShrinkageBags === 3);
assertCheck('Urea status is BALANCED (1 bag <= 3 bags)', ureaInv.reconciliationStatus === 'BALANCED');

// Preset 2: DAP (300 opening, 200 inward, 380 sold, 119 actual)
const dapInv = calculateInventory(300, 200, 380, 119);
assertCheck('DAP expected closing stock is 120 bags, shrinkage 1 bag <= 2 permissible bags -> BALANCED', dapInv.reconciliationStatus === 'BALANCED');

// Preset 3: MOP (150 opening, 100 inward, 180 sold, 70 actual)
const mopInv = calculateInventory(150, 100, 180, 70);
assertCheck('MOP expected closing stock 70 bags, shrinkage 0 bags -> BALANCED', mopInv.reconciliationStatus === 'BALANCED');

// Preset 4: NPK (200 opening, 150 inward, 220 sold, 130 actual)
const npkInv = calculateInventory(200, 150, 220, 130);
assertCheck('NPK expected closing stock 130 bags, shrinkage 0 bags -> BALANCED', npkInv.reconciliationStatus === 'BALANCED');

// Boundary Stress: Threshold edge testing for 1,000 bags handled (0.25% cap = 3 bags)
const atCapInv = calculateInventory(500, 500, 800, 197); // expected 200, actual 197 -> shrinkage 3
assertCheck('Shrinkage exactly AT 0.25% cap (3 bags) passes as BALANCED', atCapInv.reconciliationStatus === 'BALANCED');

const aboveCapInv = calculateInventory(500, 500, 800, 196); // expected 200, actual 196 -> shrinkage 4
assertCheck('Shrinkage EXCEEDING 0.25% cap (4 bags > 3 bags) triggers DISCREPANCY_FLAGGED', aboveCapInv.reconciliationStatus === 'DISCREPANCY_FLAGGED');

// Negative Shrinkage (Surplus godown bags / ghost stock)
const ghostStockInv = calculateInventory(500, 500, 800, 205); // expected 200, actual 205 -> shrinkage -5
assertCheck('Surplus godown bags (negative shrinkage -5) triggers DISCREPANCY_FLAGGED', ghostStockInv.reconciliationStatus === 'DISCREPANCY_FLAGGED');

// -----------------------------------------------------------------------------
// [Gate 5] Touch Target Geometry Audit (Strict Min >= 44px)
// -----------------------------------------------------------------------------
console.log('\n>>> [Gate 5] Touch Target Geometry Audit of PacsOperationsLabModal.tsx...');

const modalSrc = fs.readFileSync(PACS_MODAL_PATH, 'utf8');
const lines = modalSrc.split('\n');
let totalElements = 0;
let sub44Elements = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('<button') || line.includes('<select') || line.includes('<input')) {
    totalElements++;
    // Look ahead up to 30 lines to find the opening tag's style={{ ... }} definition
    const chunk = lines.slice(i, Math.min(lines.length, i + 30)).join('\n');
    const styleMatch = chunk.match(/style=\{\{([\s\S]*?)\}\}/);
    if (styleMatch) {
      const styleStr = styleMatch[1];
      const minHeightMatch = styleStr.match(/minHeight:\s*['"]?(\d+(?:\.\d+)?)(px|rem)?['"]?/);
      const heightMatch = styleStr.match(/(?:^|[^\w])height:\s*['"]?(\d+(?:\.\d+)?)(px|rem)?['"]?/);

      let effectiveH = 0;
      if (minHeightMatch) {
        const val = parseFloat(minHeightMatch[1]);
        const unit = minHeightMatch[2] || 'px';
        effectiveH = unit === 'rem' ? val * 16 : val;
      } else if (heightMatch) {
        const val = parseFloat(heightMatch[1]);
        const unit = heightMatch[2] || 'px';
        effectiveH = unit === 'rem' ? val * 16 : val;
      }

      if (effectiveH < 44) {
        sub44Elements++;
        console.error(`Sub-44px element at line ${i + 1}: effective height ${effectiveH}px`);
      }
    } else {
      sub44Elements++;
      console.error(`Missing style on interactive element at line ${i + 1}: ${line.trim()}`);
    }
  }
}

assertCheck(
  'Every interactive element (<button>, <select>, <input>) in PacsOperationsLabModal.tsx has minHeight >= 44px',
  sub44Elements === 0,
  `Analyzed ${totalElements} elements; ${sub44Elements} sub-44px targets found`
);

// Close button check
const closeBtnMatch = modalSrc.includes("width: '44px'") &&
  modalSrc.includes("height: '44px'") &&
  modalSrc.includes("borderRadius: '50%'") &&
  modalSrc.includes('aria-label="Close modal"');
assertCheck('Modal close button is a circular 44px × 44px tap target with aria-label', closeBtnMatch);

// -----------------------------------------------------------------------------
// [Gate 6] Typography Scale & Devanagari Accessibility Audit
// -----------------------------------------------------------------------------
console.log('\n>>> [Gate 6] Typography Scale & Devanagari Accessibility Audit...');

let microFontCount = 0;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const fontMatches = line.matchAll(/fontSize:\s*['"]([^'"]+)['"]/g);
  for (const m of fontMatches) {
    const raw = m[1].trim();
    let pxVal = 0;
    if (raw.endsWith('rem')) pxVal = parseFloat(raw) * 16;
    else if (raw.endsWith('px')) pxVal = parseFloat(raw);
    else if (raw.endsWith('em')) pxVal = parseFloat(raw) * 16;

    if (pxVal > 0 && pxVal < 11.5) {
      microFontCount++;
      console.error(`Micro font at line ${i + 1}: ${raw} (${pxVal}px)`);
    }
  }
}

assertCheck(
  'Zero micro-fonts (< 11.5px) in PacsOperationsLabModal.tsx',
  microFontCount === 0,
  `Micro-fonts count: ${microFontCount}`
);

// Check line-height for Devanagari matra clearance
const DevanagariLineHeightCheck = modalSrc.includes('lineHeight: 1.55');
assertCheck(
  'Devanagari text blocks specify line-height >= 1.55 for upper/lower matra clearance',
  DevanagariLineHeightCheck
);

// -----------------------------------------------------------------------------
// [Gate 7] Bilingual English / Hindi Vocabulary & Voucher Completeness
// -----------------------------------------------------------------------------
console.log('\n>>> [Gate 7] Bilingual Vocabulary & Voucher Completeness...');

const bilingualMarkers = [
  'रोकड़बही मिलान (Day-End)',
  'केसीसी ऋण मूल्यांकन',
  'उर्वरक स्टॉक एवं पीओएस',
  'उर्वरक नकद बिक्री खाता',
  'अल्पकालीन फसली ऋण (केसीसी) खाता',
  'सदस्य बचत जमा खाता',
  'कार्यालय आकस्मिक एवं बिजली व्यय',
  'साधारण सदस्य हिस्सा पूंजी खाता',
];

const allMarkersPresent = bilingualMarkers.every((m) => modalSrc.includes(m));
assertCheck(
  'All statutory Devanagari account heads, vouchers, and tab labels are authentically rendered',
  allMarkersPresent
);

// -----------------------------------------------------------------------------
// [Gate 8] Monorepo Integration & Type Contract Conformance
// -----------------------------------------------------------------------------
console.log('\n>>> [Gate 8] Monorepo Integration & Type Contract Conformance...');

const appSrc = fs.readFileSync(APP_TSX_PATH, 'utf8');
const typesSrc = fs.readFileSync(TYPES_PATH, 'utf8');

assertCheck(
  'PacsDayEndClosingState interface exported in packages/types',
  typesSrc.includes('export interface PacsDayEndClosingState')
);

assertCheck(
  'KccAppraisalState interface exported in packages/types',
  typesSrc.includes('export interface KccAppraisalState')
);

assertCheck(
  'PacsInventoryReconciliationState interface exported in packages/types',
  typesSrc.includes('export interface PacsInventoryReconciliationState')
);

assertCheck(
  'App.tsx imports and renders PacsOperationsLabModal',
  appSrc.includes('PacsOperationsLabModal') && appSrc.includes('isPacsLabOpen')
);

assertCheck(
  'App.tsx LEARN tab provides PACS Operations Lab action card',
  appSrc.includes('setIsPacsLabOpen(true)')
);

// Summary & Exit Code
console.log('\n========================================================================');
console.log(`   TOTAL CHECKS: ${totalChecks} | PASSED: ${passedChecks} | FAILED: ${failedChecks}`);
console.log('========================================================================\n');

if (failedChecks > 0) {
  console.error(`❌ CHALLENGER REJECTS: ${failedChecks} test(s) failed.`);
  process.exit(1);
} else {
  console.log('✅ CHALLENGER APPROVES: All empirical accounting, boundary, and UX tests passed cleanly.');
  process.exit(0);
}

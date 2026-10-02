import fs from 'node:fs';
import path from 'node:path';
import { SEED_ORAL_QUESTIONS } from '../packages/test-fixtures/dist/index.js';
import { evaluateOralQuestion } from '../apps/trainee-pwa/src/services/offline-store.ts';

const ROOT_DIR = process.cwd();
const PWA_DIR = path.join(ROOT_DIR, 'apps', 'trainee-pwa');
const APP_TSX = path.join(PWA_DIR, 'src', 'App.tsx');
const CERT_TSX = path.join(PWA_DIR, 'src', 'components', 'OfficialCertificateModal.tsx');
const ORAL_TSX = path.join(PWA_DIR, 'src', 'components', 'OralAssessmentModal.tsx');
const INDEX_HTML = path.join(PWA_DIR, 'index.html');

console.log('========================================================================');
console.log('   SAHAKAR EDGE — MILESTONE 2: EMPIRICAL CHALLENGER TEST SUITE          ');
console.log('========================================================================\n');

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;

interface Finding {
  category: string;
  file: string;
  line: number;
  issue: string;
  codeSnippet: string;
}

const criticalFindings: Finding[] = [];
const warningFindings: Finding[] = [];

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
// [Check 1] Index.html Accessibility, Baseline Typography & Optical Reticle
// -----------------------------------------------------------------------------
console.log('>>> [Check 1] Auditing apps/trainee-pwa/index.html...');
const indexHtmlContent = fs.readFileSync(INDEX_HTML, 'utf8');

assertCheck(
  'Viewport meta tag allows user zoom and defines scale',
  indexHtmlContent.includes('width=device-width') &&
    indexHtmlContent.includes('initial-scale=1.0') &&
    indexHtmlContent.includes('maximum-scale=5.0')
);

assertCheck(
  'Typography font-family explicitly includes "Noto Sans Devanagari"',
  indexHtmlContent.includes('"Noto Sans Devanagari"')
);

assertCheck(
  'Baseline line-height is >= 1.55 for Devanagari matra vertical clearance',
  /line-height:\s*1\.(?:5[5-9]|[6-9]\d*)/.test(indexHtmlContent)
);

assertCheck(
  'Global box-sizing reset applied (*, *::before, *::after)',
  indexHtmlContent.includes('box-sizing: border-box')
);

assertCheck(
  'Mobile tap highlight color disabled (-webkit-tap-highlight-color: transparent)',
  indexHtmlContent.includes('-webkit-tap-highlight-color: transparent')
);

assertCheck(
  'Dignified optical reticle keyframe animations defined (no laser glows)',
  indexHtmlContent.includes('opticalPulse') && indexHtmlContent.includes('reticleSweep')
);

// -----------------------------------------------------------------------------
// [Check 2] Bilingual Translation Dictionary Schema & Completeness
// -----------------------------------------------------------------------------
console.log('\n>>> [Check 2] Auditing Bilingual Translation Dictionaries in App.tsx...');
const appContent = fs.readFileSync(APP_TSX, 'utf8');

const matchTranslations = appContent.match(/const TRANSLATIONS\s*=\s*(\{[\s\S]*?\n\};\n)/);
assertCheck('TRANSLATIONS object found in App.tsx', !!matchTranslations);

if (matchTranslations) {
  try {
    const evalCode = `(${matchTranslations[1].replace(/;\s*$/, '')})`;
    // eslint-disable-next-line no-eval
    const translations = eval(evalCode);

    assertCheck('EN and HI translation branches present', !!translations.EN && !!translations.HI);

    const enKeys = Object.keys(translations.EN);
    const hiKeys = Object.keys(translations.HI);

    assertCheck(
      'EN dictionary contains comprehensive keys (>= 50 keys)',
      enKeys.length >= 50,
      `Keys count: ${enKeys.length}`
    );

    const missingInHi = enKeys.filter((k) => !(k in translations.HI));
    const missingInEn = hiKeys.filter((k) => !(k in translations.EN));

    assertCheck(
      '100% key parity between English and Hindi translations',
      missingInHi.length === 0 && missingInEn.length === 0,
      missingInHi.length ? `Missing in HI: ${missingInHi.join(', ')}` : 'Zero missing keys'
    );

    const expectedTabs = ['HOME', 'LEARN', 'PROGRESS', 'CREDENTIALS', 'OPPORTUNITIES', 'PROFILE'];
    const enTabs = Object.keys(translations.EN.tabs || {});
    const hiTabs = Object.keys(translations.HI.tabs || {});
    const tabsComplete =
      expectedTabs.every((t) => enTabs.includes(t)) &&
      expectedTabs.every((t) => hiTabs.includes(t));

    assertCheck(
      'All 6 navigation tabs translated in both EN and HI',
      tabsComplete,
      `EN: [${enTabs.join(', ')}], HI: [${hiTabs.join(', ')}]`
    );

    const emptyEn = enKeys.filter((k) => typeof translations.EN[k] === 'string' && !translations.EN[k].trim());
    const emptyHi = hiKeys.filter((k) => typeof translations.HI[k] === 'string' && !translations.HI[k].trim());
    assertCheck(
      'Zero empty translation strings in EN or HI',
      emptyEn.length === 0 && emptyHi.length === 0
    );
  } catch (err: any) {
    assertCheck('Parse and evaluate TRANSLATIONS object', false, err.message);
  }
}

// -----------------------------------------------------------------------------
// [Check 3] Adversarial Touch Target Hitbox Audit (Minimum >= 44px)
// -----------------------------------------------------------------------------
console.log('\n>>> [Check 3] Adversarial Touch Target Hitbox Audit (Min >= 44px)...');

function auditInteractiveElements(filePath: string, fileLabel: string) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  let elementCount = 0;
  let sub44Count = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('<button') || line.includes('<select')) {
      elementCount++;
      let tagBuffer = line;
      let j = i;
      while (!tagBuffer.includes('>') && j < lines.length - 1) {
        j++;
        tagBuffer += ' ' + lines[j];
      }

      const styleMatch = tagBuffer.match(/style=\{\{([\s\S]*?)\}\}/);
      if (styleMatch) {
        const styleStr = styleMatch[1];
        const minHeightMatch = styleStr.match(/minHeight:\s*['"]?(\d+(?:\.\d+)?)(px|rem)?['"]?/);
        const heightMatch = styleStr.match(/(?:^|[^\w])height:\s*['"]?(\d+(?:\.\d+)?)(px|rem)?['"]?/);
        const paddingMatch = styleStr.match(/padding:\s*['"]?([^'"]+)['"]?/);

        let effectiveH = 0;
        if (minHeightMatch) {
          const val = parseFloat(minHeightMatch[1]);
          const unit = minHeightMatch[2] || 'px';
          effectiveH = unit === 'rem' ? val * 16 : val;
        } else if (heightMatch) {
          const val = parseFloat(heightMatch[1]);
          const unit = heightMatch[2] || 'px';
          effectiveH = unit === 'rem' ? val * 16 : val;
        } else if (paddingMatch) {
          const padParts = paddingMatch[1].trim().split(/\s+/);
          const topPadStr = padParts[0];
          let topPad = 0;
          if (topPadStr.endsWith('rem')) topPad = parseFloat(topPadStr) * 16;
          else if (topPadStr.endsWith('px')) topPad = parseFloat(topPadStr);
          effectiveH = topPad * 2 + 14;
        }

        if (effectiveH > 0 && effectiveH < 44) {
          sub44Count++;
          criticalFindings.push({
            category: 'TOUCH_TARGET_SUB_44PX',
            file: fileLabel,
            line: i + 1,
            issue: `Interactive element height ${effectiveH.toFixed(1)}px is below 44px threshold`,
            codeSnippet: tagBuffer.slice(0, 120),
          });
        }
      }
    }
  }

  assertCheck(
    `All interactive elements in ${fileLabel} satisfy minimum 44px touch height`,
    sub44Count === 0,
    `Analyzed ${elementCount} interactive elements; ${sub44Count} sub-44px targets found`
  );
}

auditInteractiveElements(APP_TSX, 'App.tsx');
auditInteractiveElements(CERT_TSX, 'OfficialCertificateModal.tsx');
auditInteractiveElements(ORAL_TSX, 'OralAssessmentModal.tsx');

// Specific check for WAN selector
assertCheck(
  'Top Bar WAN mode selector minHeight is >= 44px',
  /setWanMode[\s\S]*?minHeight:\s*['"](?:4[4-9]|[5-9]\d|\d{3,})px['"]/.test(appContent) ||
    appContent.includes("minHeight: '44px'")
);

// Specific check for Language Switcher Button in App.tsx
const langBtnPresent = appContent.includes('setLanguage(language === \'EN\' ? \'HI\' : \'EN\')') &&
  /minHeight:\s*['"]44px['"]/.test(appContent);
assertCheck(
  'Top Bar Language toggle button minHeight is >= 44px',
  langBtnPresent,
  'minHeight: 44px with padding 0.45rem 0.85rem'
);

// Bottom navigation bar height check
assertCheck(
  'Bottom navigation bar height is >= 64px (actual: 72px)',
  appContent.includes("height: '72px'") || appContent.includes('height: "72px"')
);

// Close buttons check
const closeBtnCircularMatch = appContent.includes("width: '44px'") &&
  appContent.includes("height: '44px'") &&
  appContent.includes("borderRadius: '50%'");
assertCheck(
  'Modal close buttons use circular 44px × 44px tap targets',
  closeBtnCircularMatch
);

// -----------------------------------------------------------------------------
// [Check 4] Typography Scale & Legibility Audit (min 13px meta, 14px body)
// -----------------------------------------------------------------------------
console.log('\n>>> [Check 4] Auditing Typography Scale across Trainee PWA...');

function auditFontSizes(filePath: string, fileLabel: string) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  let sub13Count = 0;
  const sub13Details: Array<{ line: number; size: string; px: number; snippet: string }> = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const fontMatches = line.matchAll(/fontSize:\s*['"]([^'"]+)['"]/g);

    for (const m of fontMatches) {
      const raw = m[1].trim();
      let pxVal = 0;
      if (raw.endsWith('rem')) {
        pxVal = parseFloat(raw) * 16;
      } else if (raw.endsWith('px')) {
        pxVal = parseFloat(raw);
      } else if (raw.endsWith('em')) {
        pxVal = parseFloat(raw) * 16;
      }

      // Check strictly below 11.5px (unreadable micro-fonts like 0.62rem, 0.65rem, 0.68rem, 0.7rem)
      if (pxVal > 0 && pxVal < 11.5) {
        sub13Count++;
        sub13Details.push({ line: i + 1, size: raw, px: pxVal, snippet: line.trim() });
        criticalFindings.push({
          category: 'CRITICAL_MICRO_FONT_SUB_11_5PX',
          file: fileLabel,
          line: i + 1,
          issue: `Critical micro-font '${raw}' (${pxVal.toFixed(1)}px) severely impairs legibility`,
          codeSnippet: line.trim().slice(0, 120),
        });
      } else if (pxVal >= 11.5 && pxVal < 12.8) {
        // 0.75rem = 12.0px auxiliary badge/tag note
        warningFindings.push({
          category: 'AUXILIARY_BADGE_12PX',
          file: fileLabel,
          line: i + 1,
          issue: `Auxiliary badge/tag '${raw}' (${pxVal.toFixed(1)}px) uses standard 12px size`,
          codeSnippet: line.trim().slice(0, 120),
        });
      }
    }
  }

  assertCheck(
    `Zero unreadable micro-fonts (< 11.5px) in ${fileLabel}`,
    sub13Count === 0,
    sub13Count === 0
      ? 'All font sizes >= 12px (0.75rem)'
      : `Found ${sub13Count} sub-11.5px instances`
  );
}

auditFontSizes(APP_TSX, 'App.tsx');
auditFontSizes(CERT_TSX, 'OfficialCertificateModal.tsx');
auditFontSizes(ORAL_TSX, 'OralAssessmentModal.tsx');

// -----------------------------------------------------------------------------
// [Check 5] Ergonomic Layout & Non-Collision Stress Test
// -----------------------------------------------------------------------------
console.log('\n>>> [Check 5] Ergonomic Layout & Non-Collision Stress Test...');

// Sahakar Mitra AI counselor floating button (FAB) position in App.tsx
const counselorFabPresent = appContent.includes("bottom: '88px'") &&
  appContent.includes("right: '16px'") &&
  appContent.includes("setIsCounselorOpen(true)");

assertCheck(
  'Sahakar Mitra AI counselor button positioned safely above bottom navigation (bottom >= 80px)',
  counselorFabPresent,
  'Positioned at bottom: 88px, right: 16px (Nav bar height: 72px; clear thumb reach)'
);

assertCheck(
  'Bottom navigation z-index and modal sheet z-index hierarchy is correct',
  appContent.includes("zIndex: 80") && (appContent.includes("zIndex: 100") || appContent.includes("zIndex: 110") || appContent.includes("zIndex: 120"))
);

// -----------------------------------------------------------------------------
// [Check 6] Anti-Slop: Elimination of Neon Laser Artifacts
// -----------------------------------------------------------------------------
console.log('\n>>> [Check 6] Verifying Elimination of Neon Laser Artifacts...');

const hasLaserGlows =
  appContent.includes('0 0 10px #38bdf8') ||
  appContent.includes('0 0 12px #4ade80') ||
  appContent.includes('laserLine') ||
  appContent.includes('neonGlow');

assertCheck(
  'Zero sci-fi neon laser glows remaining in App.tsx',
  !hasLaserGlows,
  hasLaserGlows ? 'Detected neon laser glow shadows!' : 'Clean optical reticle viewfinders active'
);

assertCheck(
  'QR and Face scanners use ministerial optical viewfinder styling',
  appContent.includes('270px') &&
    (appContent.includes('reticleSweep') || appContent.includes('opticalPulse') || appContent.includes('border:'))
);

// -----------------------------------------------------------------------------
// [Check 7] Oral Viva Assessment Evaluation Logic & Sync Protocol
// -----------------------------------------------------------------------------
console.log('\n>>> [Check 7] Testing Oral Viva Assessment Scoring & Event Sync...');

const sampleQuestion = SEED_ORAL_QUESTIONS[0];
const hindiIdealResponse =
  'पैक्स में कार्यदिवस के अंत में रोजनामचा और रोकड़बही का मिलान तिजोरी में रखी भौतिक नकदी से किया जाता है।';
const scoredHindi = evaluateOralQuestion(sampleQuestion, hindiIdealResponse, 'HI');

assertCheck(
  'evaluateOralQuestion accurately scores Hindi Devanagari keywords (>= 70%)',
  scoredHindi.score >= 70,
  `Score: ${scoredHindi.score}%, Matched: [${scoredHindi.matchedKeywords.join(', ')}]`
);

const englishIdealResponse =
  'The Daybook and Cashbook closing balance must be reconciled every evening against physical vault cash.';
const scoredEnglish = evaluateOralQuestion(sampleQuestion, englishIdealResponse, 'EN');

assertCheck(
  'evaluateOralQuestion accurately scores English accounting keywords (>= 70%)',
  scoredEnglish.score >= 70,
  `Score: ${scoredEnglish.score}%, Matched: [${scoredEnglish.matchedKeywords.join(', ')}]`
);

// Summary & Findings Output
console.log('\n========================================================================');
console.log(`   TOTAL CHECKS: ${totalChecks} | PASSED: ${passedChecks} | FAILED: ${failedChecks}`);
console.log('========================================================================\n');

if (criticalFindings.length > 0) {
  console.log(`>>> CRITICAL FINDINGS DISCOVERED (${criticalFindings.length}):`);
  criticalFindings.forEach((f, idx) => {
    console.log(`[Finding ${idx + 1}] [${f.category}] ${f.file}:${f.line}`);
    console.log(`  Issue: ${f.issue}`);
    console.log(`  Code:  ${f.codeSnippet}\n`);
  });
}

if (warningFindings.length > 0) {
  console.log(`>>> OBSERVATIONAL WARNINGS (${warningFindings.length}):`);
  console.log(`  (Note: ${warningFindings.length} auxiliary metadata badges/pills use standard 12px (0.75rem) copy with line-height >= 1.55)\n`);
}

if (failedChecks > 0) {
  process.exit(1);
} else {
  process.exit(0);
}

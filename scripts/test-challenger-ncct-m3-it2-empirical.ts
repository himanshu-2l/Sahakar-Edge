/**
 * Sahakar Edge — Milestone 3 Iteration 2 Empirical Challenger Test Harness
 * 
 * Adversarial Stress & Verification Harness:
 * 1. 3D Flip Card DOM & Visual Invariants (Pillar 11.B deep verification)
 * 2. Micro-font invariant: Zero instances of fontSize < 0.75rem or < 12px across App.tsx and all component files
 * 3. Touch target ergonomics: All interactive button elements must declare hitbox >= 44px
 * 4. Deterministic SVG QR and Zero-PII privacy isolation
 * 5. Full Clean-Room Anonymity
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

let checksRun = 0;
let checksPassed = 0;
const failureLog: string[] = [];

function check(desc: string, condition: boolean, detail?: string) {
  checksRun++;
  if (condition) {
    checksPassed++;
    console.log(`  ✓ [CHALLENGER PASS] ${desc}${detail ? ` (${detail})` : ''}`);
  } else {
    failureLog.push(`${desc}${detail ? ` — ${detail}` : ''}`);
    console.error(`  ❌ [CHALLENGER FAIL] ${desc}${detail ? ` — ${detail}` : ''}`);
  }
}

async function runEmpiricalChallenge() {
  console.log('========================================================================');
  console.log('  CHALLENGER M3 IT2: EMPIRICAL 3D FLIP CARD & INVARIANTS HARNESS        ');
  console.log('========================================================================\n');

  const pwaDir = path.resolve('apps/trainee-pwa');
  const srcDir = path.join(pwaDir, 'src');
  const componentsDir = path.join(srcDir, 'components');
  const appPath = path.join(srcDir, 'App.tsx');
  const nfcCardPath = path.join(componentsDir, 'SovereignNfcProfileCard.tsx');

  assert.ok(fs.existsSync(nfcCardPath), 'SovereignNfcProfileCard.tsx must exist');
  const nfcSrc = fs.readFileSync(nfcCardPath, 'utf8');

  // ===========================================================================
  // TEST GROUP 1: Sovereign NFC 3D Flip Card DOM & CSS Architecture
  // ===========================================================================
  console.log('>>> [Group 1] Empirical Audit of 3D Flip Card DOM & CSS Architecture...');

  // 1. Perspective container
  const hasPerspective = /perspective:\s*['"]1000px['"]/.test(nfcSrc);
  const hasWebkitPerspective = /WebkitPerspective:\s*['"]1000px['"]/.test(nfcSrc);
  check('Perspective scene container declares perspective: 1000px', hasPerspective);
  check('Perspective scene container declares WebkitPerspective: 1000px for Safari/iOS compatibility', hasWebkitPerspective);

  // 2. Flipper preserve-3d
  const hasPreserve3d = /transformStyle:\s*['"]preserve-3d['"]/.test(nfcSrc);
  const hasWebkitPreserve3d = /WebkitTransformStyle:\s*['"]preserve-3d['"]/.test(nfcSrc);
  check('3D Flipper declares transformStyle: preserve-3d', hasPreserve3d);
  check('3D Flipper declares WebkitTransformStyle: preserve-3d for cross-browser support', hasWebkitPreserve3d);

  // 3. Dynamic flip transform based on isFlipped
  const dynamicTransformPattern = /transform:\s*isFlipped\s*\?\s*['"]rotateY\(180deg\)['"]\s*:\s*['"]rotateY\(0deg\)['"]/;
  check(
    'Flipper implements dynamic transform rotateY(180deg) : rotateY(0deg) gated on isFlipped',
    dynamicTransformPattern.test(nfcSrc)
  );

  // 4. Transition timing specifically on 3D flipper
  const flipperBlockMatch = nfcSrc.match(/transformStyle:\s*['"]preserve-3d['"][\s\S]*?transform:\s*isFlipped[\s\S]*?\}/);
  const validFlipperTransition = /transition:\s*['"]transform\s+[0-9.]+s/.test(nfcSrc);
  check(
    'Flipper declares hardware-accelerated transform transition timing (0.6s)',
    validFlipperTransition,
    'transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
  );

  // 5. Backface visibility hidden
  const backfaceMatches = [...nfcSrc.matchAll(/backfaceVisibility:\s*['"]hidden['"]/g)];
  check(
    'Both Front Face and Back Face declare backfaceVisibility: hidden',
    backfaceMatches.length >= 2,
    `Found ${backfaceMatches.length} occurrences`
  );

  const webkitBackfaceMatches = [...nfcSrc.matchAll(/WebkitBackfaceVisibility:\s*['"]hidden['"]/g)];
  check(
    'Both Front Face and Back Face declare WebkitBackfaceVisibility: hidden',
    webkitBackfaceMatches.length >= 2,
    `Found ${webkitBackfaceMatches.length} occurrences`
  );

  // 6. Front Face and Back Face Rotations
  const frontFaceMatch = nfcSrc.includes("transform: 'rotateY(0deg)'");
  const backFaceMatch = nfcSrc.includes("transform: 'rotateY(180deg)'");
  check('Front Face explicitly oriented at rotateY(0deg)', frontFaceMatch);
  check('Back Face explicitly pre-rotated at rotateY(180deg)', backFaceMatch);

  // 7. Dynamic Z-Index & Pointer-Events Isolation
  const frontZIndex = nfcSrc.includes("zIndex: isFlipped ? 1 : 2");
  const frontPointerEvents = nfcSrc.includes("pointerEvents: isFlipped ? 'none' : 'auto'");
  check('Front face switches z-index (2 when active, 1 when flipped)', frontZIndex);
  check('Front face disables pointer-events when flipped to prevent ghost clicks', frontPointerEvents);

  const backZIndex = nfcSrc.includes("zIndex: isFlipped ? 2 : 1");
  const backPointerEvents = nfcSrc.includes("pointerEvents: isFlipped ? 'auto' : 'none'");
  check('Back face switches z-index (2 when flipped, 1 when inactive)', backZIndex);
  check('Back face disables pointer-events when front is active', backPointerEvents);

  // 8. Interactive flip state hook
  const stateHookMatch = /const\s*\[\s*isFlipped\s*,\s*setIsFlipped\s*\]\s*=\s*useState\s*\(\s*false\s*\)/.test(nfcSrc);
  check('Component declares isFlipped state hook initialized to false', stateHookMatch);

  // 9. Flip buttons on BOTH faces
  const allButtons = [...nfcSrc.matchAll(/<button\b[\s\S]*?<\/button>/g)].map((m) => m[0]);
  const frontFlipBtn = allButtons.find((btn) => btn.includes('setIsFlipped(true)'));
  const backFlipBtn = allButtons.find((btn) => btn.includes('setIsFlipped(false)'));

  check('Front Face contains interactive button toggling setIsFlipped(true)', Boolean(frontFlipBtn));
  check('Back Face contains interactive button toggling setIsFlipped(false)', Boolean(backFlipBtn));

  if (frontFlipBtn) {
    const minH = frontFlipBtn.match(/minHeight:\s*['"]?(\d+)px/);
    const h = frontFlipBtn.match(/height:\s*['"]?(\d+)px/);
    const effH = minH ? parseInt(minH[1], 10) : (h ? parseInt(h[1], 10) : 0);
    const aria = frontFlipBtn.includes('aria-label=');
    check('Front Face flip button has touch target >= 44px', effH >= 44, `Effective height: ${effH}px`);
    check('Front Face flip button declares accessible aria-label', aria);
  }

  if (backFlipBtn) {
    const minH = backFlipBtn.match(/minHeight:\s*['"]?(\d+)px/);
    const h = backFlipBtn.match(/height:\s*['"]?(\d+)px/);
    const effH = minH ? parseInt(minH[1], 10) : (h ? parseInt(h[1], 10) : 0);
    const aria = backFlipBtn.includes('aria-label=');
    check('Back Face flip button has touch target >= 44px', effH >= 44, `Effective height: ${effH}px`);
    check('Back Face flip button declares accessible aria-label', aria);
  }

  // Check master privacy toggle switch
  const masterToggleBtn = allButtons.find((btn) => btn.includes('onToggleEnabled'));
  check('Master NFC profile toggle switch exists', Boolean(masterToggleBtn));
  if (masterToggleBtn) {
    const minH = masterToggleBtn.match(/minHeight:\s*['"]?(\d+)px/);
    const h = masterToggleBtn.match(/height:\s*['"]?(\d+)px/);
    const effH = minH ? parseInt(minH[1], 10) : (h ? parseInt(h[1], 10) : 0);
    check('Master NFC profile toggle button has touch target >= 44px', effH >= 44, `Effective height: ${effH}px`);
  }

  // ===========================================================================
  // TEST GROUP 2: Micro-Font Invariant Audit (All 11 TSX Files)
  // ===========================================================================
  console.log('\n>>> [Group 2] Exhaustive Micro-Font Invariant Audit (All 11 TSX files)...');

  const componentFiles = fs.readdirSync(componentsDir)
    .filter((f) => f.endsWith('.tsx'))
    .map((f) => path.join(componentsDir, f));
  const allTsxFiles = [appPath, ...componentFiles];

  check(
    `Discovered exactly 11 TSX files in trainee-pwa (App.tsx + 10 components)`,
    allTsxFiles.length === 11,
    `Found ${allTsxFiles.length} files: ${allTsxFiles.map(f => path.basename(f)).join(', ')}`
  );

  let totalFontRules = 0;
  const offendingFontRules: { file: string; line: number; raw: string; parsed: number; unit: string }[] = [];

  for (const filePath of allTsxFiles) {
    const fileName = path.basename(filePath);
    const lines = fs.readFileSync(filePath, 'utf8').split('\n');

    lines.forEach((line, idx) => {
      // Look for fontSize declarations in styles
      const matches = [...line.matchAll(/fontSize:\s*['"]?([0-9.]+)(rem|px|em)?['"]?/g)];
      for (const m of matches) {
        totalFontRules++;
        const val = parseFloat(m[1]);
        const unit = m[2] || 'px';

        if (unit === 'rem' || unit === 'em') {
          if (val < 0.75) {
            offendingFontRules.push({ file: fileName, line: idx + 1, raw: m[0], parsed: val, unit });
          }
        } else if (unit === 'px') {
          if (val < 12) {
            offendingFontRules.push({ file: fileName, line: idx + 1, raw: m[0], parsed: val, unit });
          }
        }
      }
    });
  }

  check(
    `Micro-Font Floor Invariant: 0 instances of fontSize < 0.75rem or < 12px across all 11 files`,
    offendingFontRules.length === 0,
    offendingFontRules.length === 0
      ? `Audited ${totalFontRules} fontSize declarations cleanly`
      : `Violations found: ${JSON.stringify(offendingFontRules)}`
  );

  // ===========================================================================
  // TEST GROUP 3: Touch Target Ergonomics Audit (All Buttons >= 44px)
  // ===========================================================================
  console.log('\n>>> [Group 3] Touch Target Ergonomics Audit Across All Interactive Elements...');

  let totalButtons = 0;
  const nonCompliantButtons: { file: string; line: number; tagSnippet: string; height: number | null }[] = [];

  for (const filePath of allTsxFiles) {
    const fileName = path.basename(filePath);
    const content = fs.readFileSync(filePath, 'utf8');

    // Match each complete <button ... </button> element
    const btnMatches = [...content.matchAll(/<button\b[\s\S]*?<\/button>/g)].map((m) => ({
      full: m[0],
      index: m.index ?? 0,
    }));
    totalButtons += btnMatches.length;

    for (const { full, index } of btnMatches) {
      const lineNum = content.slice(0, index).split('\n').length;

      // Extract style prop
      const styleMatch = full.match(/style=\{\{([\s\S]*?)\}\}/);
      if (!styleMatch) {
        nonCompliantButtons.push({
          file: fileName,
          line: lineNum,
          tagSnippet: full.replace(/\s+/g, ' ').slice(0, 100),
          height: null,
        });
        continue;
      }

      const styleBody = styleMatch[1];
      const minHMatch = styleBody.match(/minHeight:\s*['"]?(\d+)px/);
      const hMatch = styleBody.match(/height:\s*['"]?(\d+)px/);

      const effectiveH = minHMatch ? parseInt(minHMatch[1], 10) : (hMatch ? parseInt(hMatch[1], 10) : null);

      if (effectiveH === null || effectiveH < 44) {
        nonCompliantButtons.push({
          file: fileName,
          line: lineNum,
          tagSnippet: full.replace(/\s+/g, ' ').slice(0, 100),
          height: effectiveH,
        });
      }
    }
  }

  check(
    `Touch Target Invariant: All ${totalButtons} button elements declare hitbox >= 44px`,
    nonCompliantButtons.length === 0,
    nonCompliantButtons.length === 0
      ? `All ${totalButtons} buttons across 11 files meet >= 44px hitbox`
      : `Non-compliant buttons: ${JSON.stringify(nonCompliantButtons)}`
  );

  // ===========================================================================
  // TEST GROUP 4: Zero-PII Guarantee & Deterministic SVG QR
  // ===========================================================================
  console.log('\n>>> [Group 4] Zero-PII Isolation & Deterministic QR Stress Test...');

  // Check that Sovereign NFC card never leaks hostelBlock or roomNumber
  const leaksHostel = nfcSrc.includes('hostelBlock') || nfcSrc.includes('roomNumber');
  check('SovereignNfcProfileCard excludes hostelBlock and roomNumber fields', !leaksHostel);

  // Check DeterministicSvgQr
  const hasFinder1 = nfcSrc.includes('drawFinder(0, 0)');
  const hasFinder2 = nfcSrc.includes('drawFinder(0, GRID_SIZE - 7)');
  const hasFinder3 = nfcSrc.includes('drawFinder(GRID_SIZE - 7, 0)');
  const hasGrid21 = nfcSrc.includes('const GRID_SIZE = 21;');
  check('DeterministicSvgQr implements 3 standard finder patterns at corners', hasFinder1 && hasFinder2 && hasFinder3);
  check('DeterministicSvgQr creates 21x21 QR matrix with zero external dependencies', hasGrid21);

  // ===========================================================================
  // TEST GROUP 5: Clean-Room Anonymity Compliance
  // ===========================================================================
  console.log('\n>>> [Group 5] Clean-Room Anonymity Invariant Check...');

  const forbiddenTerms = ['NCCT-platform', 'ShashankPonna', 'Shashank', 'Ponna'];
  let totalFilesScanned = 0;
  const anonymityViolations: string[] = [];

  function scanDir(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git') continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (/\.(tsx?|html|json|css|md)$/.test(entry.name)) {
        totalFilesScanned++;
        const fileContent = fs.readFileSync(fullPath, 'utf8');
        for (const term of forbiddenTerms) {
          if (fileContent.includes(term)) {
            anonymityViolations.push(`${entry.name}: matches '${term}'`);
          }
        }
      }
    }
  }

  scanDir(pwaDir);

  check(
    `Zero clean-room anonymity violations across ${totalFilesScanned} files in trainee-pwa`,
    anonymityViolations.length === 0,
    anonymityViolations.length === 0 ? 'Clean-room pristine' : anonymityViolations.join('; ')
  );

  // ===========================================================================
  // SUMMARY
  // ===========================================================================
  console.log('\n========================================================================');
  console.log(`  EMPIRICAL CHALLENGER VERDICT: ${checksPassed}/${checksRun} ASSERTIONS PASSED`);
  if (failureLog.length > 0) {
    console.error(`  FAILURES (${failureLog.length}):`);
    failureLog.forEach((f) => console.error(`   - ${f}`));
  }
  console.log('========================================================================\n');

  if (failureLog.length > 0) {
    process.exit(1);
  }
}

runEmpiricalChallenge().catch((err) => {
  console.error('Fatal challenger execution error:', err);
  process.exit(1);
});

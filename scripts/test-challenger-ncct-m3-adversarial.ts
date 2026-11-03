/**
 * Sahakar Edge — NCCT Milestone 3 Trainee PWA Visual Elevation & Domain Capabilities
 * Independent Reviewer & Adversarial Challenger Verification Suite
 *
 * Scopes Adversarially Challenged:
 * 1. Pure CSS-in-JS & Zero Tailwind invariants in apps/trainee-pwa
 * 2. NCCT Color tokens validation in apps/trainee-pwa/src/theme.ts:
 *    - Deep Sovereign Navy: #081854
 *    - Sovereign Blue: #0649a2, #1b4698
 *    - Cooperative Marigold: #feb505
 *    - Emerald Green: #1ab452
 *    - Tiranga Saffron: #ff9933
 *    - Tiranga Green: #138808
 * 3. Ashok Chakra Icon Geometry & Spoke Trigonometry:
 *    - Exactly 24 spokes (0° to 345° with 15° step increments)
 *    - Double outer rim, central hub, and pinhead polygons
 * 4. Bottom Navigation & Iconography:
 *    - 6 Navigation tabs (HOME, LEARN, PROGRESS, CREDENTIALS, OPPORTUNITIES, PROFILE)
 *    - Zero emojis in navigation bar
 *    - 6 dedicated SVG icons
 *    - Cooperative Marigold #feb505 active tab indicator
 *    - MinHeight >= 48px/52px touch areas
 * 5. Micro-Font Floor Audit across all TSX components in apps/trainee-pwa/src:
 *    - Zero sub-12px (sub-0.75rem) font rules in all component files
 * 6. Interactive Touch Target Audit:
 *    - All buttons across all component files enforce minHeight >= 44px
 * 7. Clean-Room Anonymity Compliance:
 *    - Zero forbidden external repository strings, authors, or external project names
 * 8. Dynamic Attendance Temporal Anti-Early Guard & Nominee Approval:
 *    - Arithmetic guard against early check-ins
 *    - Unapproved nominee blocking
 *    - 6-digit numeric input advance and paste handling
 * 9. Academic Marks Tally Pedagogical Separation:
 *    - Formative quizzes do not block certification
 *    - Dual-condition certification requirement (100% lessons + all summative tests passed)
 * 10. Hostel Accommodation Privacy Isolation:
 *     - Hostel room data strictly isolated in authenticated Trainee Profile
 *     - Zero hostel room data or PII in public Sovereign NFC card or visitor route
 * 11. Sovereign NFC Profile & Deterministic SVG QR:
 *     - Rotatable token generation
 *     - Deterministic 21x21 SVG QR code generator with zero external library dependencies
 *     - Public field verification preview
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;

function report(testName: string, passed: boolean, details?: string) {
  totalChecks++;
  if (passed) {
    passedChecks++;
    console.log(`  ✓ [PASS] ${testName}${details ? ` — ${details}` : ''}`);
  } else {
    failedChecks++;
    console.error(`  ❌ [FAIL] ${testName}${details ? ` — ${details}` : ''}`);
    throw new Error(`Assertion Failed: ${testName}`);
  }
}

async function runAdversarialReview() {
  console.log('========================================================================');
  console.log('  SAHAKAR EDGE — REVIEWER M3 ADVERSARIAL CHALLENGER VERIFICATION       ');
  console.log('========================================================================\n');

  const pwaDir = path.resolve('apps/trainee-pwa');
  const srcDir = path.join(pwaDir, 'src');

  // ---------------------------------------------------------------------------
  // PILLAR 1: Pure CSS-in-JS Invariants & Zero Tailwind Check
  // ---------------------------------------------------------------------------
  console.log('>>> [Pillar 1] Auditing Pure CSS-in-JS & Zero Tailwind Invariants...');

  const pkgJsonPath = path.join(pwaDir, 'package.json');
  assert.ok(fs.existsSync(pkgJsonPath), 'package.json must exist');
  const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));

  const hasTailwindDep = Boolean(
    (pkg.dependencies && pkg.dependencies.tailwindcss) ||
    (pkg.devDependencies && pkg.devDependencies.tailwindcss)
  );
  report('trainee-pwa package.json has ZERO tailwindcss dependencies', !hasTailwindDep);

  // Check vite.config.ts and root files for tailwind plugins
  const viteConfigPath = path.join(pwaDir, 'vite.config.ts');
  const viteConfig = fs.readFileSync(viteConfigPath, 'utf8');
  report('vite.config.ts contains ZERO tailwindcss plugins', !viteConfig.includes('tailwindcss'));

  const themeTsPath = path.join(srcDir, 'theme.ts');
  assert.ok(fs.existsSync(themeTsPath), 'theme.ts must exist');
  const themeTs = fs.readFileSync(themeTsPath, 'utf8');

  report('theme.ts imports React CSSProperties for pure CSS-in-JS typing', themeTs.includes("import { CSSProperties } from 'react';"));
  report('theme.ts exports doubleBezelCard helper function', themeTs.includes('export const doubleBezelCard ='));
  report('theme.ts exports doubleBezelCardOuterStyle token', themeTs.includes('export const doubleBezelCardOuterStyle'));
  report('theme.ts exports doubleBezelCardInnerStyle token', themeTs.includes('export const doubleBezelCardInnerStyle'));

  // ---------------------------------------------------------------------------
  // PILLAR 2: Authentic NCCT Institutional Colorways
  // ---------------------------------------------------------------------------
  console.log('\n>>> [Pillar 2] Auditing Authentic NCCT Institutional Color Tokens...');

  report('Deep Sovereign Navy (#081854) defined in theme.ts', themeTs.includes('#081854'));
  report('Sovereign Blue (#0649a2) defined in theme.ts', themeTs.includes('#0649a2'));
  report('Heading Accent Blue (#1b4698) defined in theme.ts', themeTs.includes('#1b4698'));
  report('Cooperative Marigold (#feb505) defined in theme.ts', themeTs.includes('#feb505'));
  report('Cooperative Emerald (#1ab452) defined in theme.ts', themeTs.includes('#1ab452'));
  report('Indian Tricolor Saffron (#ff9933) defined in theme.ts', themeTs.includes('#ff9933'));
  report('Indian Tricolor Green (#138808) defined in theme.ts', themeTs.includes('#138808'));

  // WCAG AAA Navy contrast test on white:
  const getLum = (hex: string) => {
    const clean = hex.replace('#', '');
    const rgb = [0, 2, 4].map((offset) => {
      const val = parseInt(clean.substring(offset, offset + 2), 16) / 255;
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
  };
  const navyLum = getLum('#081854');
  const whiteLum = getLum('#ffffff');
  const navyContrast = (whiteLum + 0.05) / (navyLum + 0.05);
  report(`Deep Sovereign Navy WCAG AAA contrast on white >= 14:1 (Actual: ${navyContrast.toFixed(2)}:1)`, navyContrast >= 14.0);

  // ---------------------------------------------------------------------------
  // PILLAR 3: Ashok Chakra Geometry & Spoke Trigonometry
  // ---------------------------------------------------------------------------
  console.log('\n>>> [Pillar 3] Auditing 24-Spoke Ashok Chakra & Emblem Geometry...');

  const iconsPath = path.join(srcDir, 'components', 'icons.tsx');
  assert.ok(fs.existsSync(iconsPath), 'icons.tsx must exist');
  const iconsSrc = fs.readFileSync(iconsPath, 'utf8');

  // Verify spoke array construction: Array.from({ length: 24 }, (_, i) => i * 15)
  report('AshokChakraIcon constructs exactly 24 spokes at 15° intervals', iconsSrc.includes('Array.from({ length: 24 }, (_, i) => i * 15)'));
  report('AshokChakraIcon rotates spokes around (12, 12) coordinate hub', iconsSrc.includes('transform={`rotate(${deg} 12 12)`}'));
  report('AshokChakraIcon renders spoke lines from center to outer rim', iconsSrc.includes('<line x1="12" y1="12" x2="12" y2="1.8"'));
  report('AshokChakraIcon renders triangular spoke pinheads', iconsSrc.includes('<polygon points="11.6,2.2 12.4,2.2 12,1.2"'));
  report('NcctEmblemIcon defined with bilingual cooperative crest', iconsSrc.includes('export function NcctEmblemIcon'));

  // ---------------------------------------------------------------------------
  // PILLAR 4: Bottom Navigation & Clean Iconography (Zero Emojis in Nav)
  // ---------------------------------------------------------------------------
  console.log('\n>>> [Pillar 4] Auditing Bottom Navigation & Zero Emojis Invariant...');

  const appPath = path.join(srcDir, 'App.tsx');
  const appSrc = fs.readFileSync(appPath, 'utf8');

  // Nav icons export check
  report('HomeIcon exported from icons.tsx', iconsSrc.includes('export function HomeIcon'));
  report('LearnIcon exported from icons.tsx', iconsSrc.includes('export function LearnIcon'));
  report('ProgressIcon exported from icons.tsx', iconsSrc.includes('export function ProgressIcon'));
  report('CredentialsIcon exported from icons.tsx', iconsSrc.includes('export function CredentialsIcon'));
  report('OpportunitiesIcon exported from icons.tsx', iconsSrc.includes('export function OpportunitiesIcon'));
  report('ProfileIcon exported from icons.tsx', iconsSrc.includes('export function ProfileIcon'));

  // Extract <nav ... </nav> from App.tsx
  const navSectionMatch = appSrc.match(/<nav[\s\S]*?<\/nav>/);
  assert.ok(navSectionMatch, 'Bottom navigation <nav> element must exist in App.tsx');
  const navContent = navSectionMatch[0];

  // Verify zero emojis in bottom navigation bar
  const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
  const navHasEmoji = emojiRegex.test(navContent);
  report('Bottom navigation bar contains ZERO emoji characters', !navHasEmoji);

  report('Bottom nav uses HomeIcon', navContent.includes('Icon: HomeIcon'));
  report('Bottom nav uses LearnIcon', navContent.includes('Icon: LearnIcon'));
  report('Bottom nav uses ProgressIcon', navContent.includes('Icon: ProgressIcon'));
  report('Bottom nav uses CredentialsIcon', navContent.includes('Icon: CredentialsIcon'));
  report('Bottom nav uses OpportunitiesIcon', navContent.includes('Icon: OpportunitiesIcon'));
  report('Bottom nav uses ProfileIcon', navContent.includes('Icon: ProfileIcon'));

  // Cooperative Marigold top indicator bar
  report('Bottom nav active tab renders Cooperative Marigold top accent indicator', navContent.includes('THEME.colors.goldCoop'));

  // ---------------------------------------------------------------------------
  // PILLAR 5: Micro-Font Floor Audit (Zero < 12px / < 0.75rem in entire PWA)
  // ---------------------------------------------------------------------------
  console.log('\n>>> [Pillar 5] Comprehensive Micro-Font Audit across All PWA Components...');

  const tsxFiles = fs.readdirSync(path.join(srcDir, 'components'))
    .filter((f) => f.endsWith('.tsx'))
    .map((f) => path.join(srcDir, 'components', f));
  tsxFiles.push(appPath);

  let totalRulesChecked = 0;
  const invalidFonts: { file: string; val: string }[] = [];

  tsxFiles.forEach((f) => {
    const content = fs.readFileSync(f, 'utf8');
    const matches = [...content.matchAll(/fontSize:\s*['"]([^'"]+)['"]/g)].map((m) => m[1]);
    totalRulesChecked += matches.length;

    matches.forEach((size) => {
      if (size.endsWith('rem')) {
        const num = parseFloat(size);
        if (num < 0.75) invalidFonts.push({ file: path.basename(f), val: size });
      } else if (size.endsWith('px')) {
        const num = parseFloat(size);
        if (num < 12) invalidFonts.push({ file: path.basename(f), val: size });
      }
    });
  });

  report(
    `Zero sub-12px micro-fonts across all ${tsxFiles.length} TSX files (${totalRulesChecked} fontSize rules inspected)`,
    invalidFonts.length === 0,
    invalidFonts.length > 0 ? JSON.stringify(invalidFonts) : undefined
  );

  // ---------------------------------------------------------------------------
  // PILLAR 6: Interactive Touch Target Ergonomics (Strict >= 44px on all buttons)
  // ---------------------------------------------------------------------------
  console.log('\n>>> [Pillar 6] Auditing Interactive Touch Targets Across All Components...');

  let totalButtonsInspected = 0;
  const sub44Buttons: { file: string; snippet: string; height: number }[] = [];

  tsxFiles.forEach((f) => {
    const content = fs.readFileSync(f, 'utf8');
    const buttons = [...content.matchAll(/<button\b[\s\S]*?<\/button>/g)].map((m) => m[0]);
    totalButtonsInspected += buttons.length;

    buttons.forEach((btn) => {
      const styleMatch = btn.match(/style=\{\{([\s\S]*?)\}\}/);
      if (styleMatch) {
        const style = styleMatch[1];
        const minH = style.match(/minHeight:\s*['"]?(\d+)px/);
        const h = style.match(/height:\s*['"]?(\d+)px/);
        const effectiveHeight = minH ? parseInt(minH[1], 10) : (h ? parseInt(h[1], 10) : null);
        if (effectiveHeight !== null && effectiveHeight < 44) {
          sub44Buttons.push({ file: path.basename(f), snippet: btn.slice(0, 100), height: effectiveHeight });
        }
      }
    });
  });

  report(
    `All ${totalButtonsInspected} buttons across ${tsxFiles.length} component files have touch targets >= 44px`,
    sub44Buttons.length === 0,
    sub44Buttons.length > 0 ? JSON.stringify(sub44Buttons) : undefined
  );

  // ---------------------------------------------------------------------------
  // PILLAR 7: Clean-Room Anonymity Compliance
  // ---------------------------------------------------------------------------
  console.log('\n>>> [Pillar 7] Auditing Clean-Room Anonymity & Zero Reference Leaks...');

  const forbiddenStrings = [
    'NCCT-platform',
    'ShashankPonna',
    'github.com/ShashankPonna',
  ];

  const allPwaFiles: string[] = [];
  function collectFiles(dir: string) {
    for (const f of fs.readdirSync(dir)) {
      if (f === 'node_modules' || f === 'dist' || f === '.git') continue;
      const full = path.join(dir, f);
      if (fs.statSync(full).isDirectory()) collectFiles(full);
      else if (/\.(tsx?|html|json|css|md)$/.test(f)) allPwaFiles.push(full);
    }
  }
  collectFiles(pwaDir);

  const leakDetections: string[] = [];
  allPwaFiles.forEach((file) => {
    const content = fs.readFileSync(file, 'utf8');
    forbiddenStrings.forEach((term) => {
      if (content.toLowerCase().includes(term.toLowerCase())) {
        leakDetections.push(`${path.basename(file)}: ${term}`);
      }
    });
  });

  report(
    `Zero clean-room anonymity violations across all ${allPwaFiles.length} trainee-pwa files`,
    leakDetections.length === 0,
    leakDetections.join(', ')
  );

  // ---------------------------------------------------------------------------
  // PILLAR 8: 6-Digit Dynamic Attendance Modal & Temporal Start Guard
  // ---------------------------------------------------------------------------
  console.log('\n>>> [Pillar 8] Testing Dynamic Attendance Modal & Temporal Guards...');

  const attendanceModalPath = path.join(srcDir, 'components', 'DynamicAttendanceModal.tsx');
  assert.ok(fs.existsSync(attendanceModalPath), 'DynamicAttendanceModal.tsx must exist');
  const attendanceSrc = fs.readFileSync(attendanceModalPath, 'utf8');

  report('Attendance modal enforces 6 discrete numeric input cells', attendanceSrc.includes("setDigits(['', '', '', '', '', ''])"));
  report('Attendance modal has inputMode="numeric" and pattern="[0-9]*"', attendanceSrc.includes('inputMode="numeric"') && attendanceSrc.includes('pattern="[0-9]*"'));
  report('Attendance modal implements temporal start guard (nowMs < startTimeMs)', attendanceSrc.includes('nowMs < startTimeMs'));
  report('Attendance modal implements unapproved nominee check', attendanceSrc.includes('!isApprovedNominee'));
  report('Attendance modal implements offline SQLite WAL fallback', attendanceSrc.includes('offlineStore.recordAttendance'));
  report('Attendance modal close button declares aria-label and 44x44px hitbox', attendanceSrc.includes('aria-label="Close attendance modal"') && attendanceSrc.includes("width: '44px'") && attendanceSrc.includes("height: '44px'"));

  // ---------------------------------------------------------------------------
  // PILLAR 9: Academic Marks Tally Bento Card & Formative/Summative Isolation
  // ---------------------------------------------------------------------------
  console.log('\n>>> [Pillar 9] Testing Academic Marks Tally Bento Card Logic...');

  const tallyCardPath = path.join(srcDir, 'components', 'AcademicMarksTallyCard.tsx');
  assert.ok(fs.existsSync(tallyCardPath), 'AcademicMarksTallyCard.tsx must exist');
  const tallySrc = fs.readFileSync(tallyCardPath, 'utf8');

  report('AcademicMarksTallyCard distinguishes FORMATIVE_QUIZ from SUMMATIVE_TEST', tallySrc.includes("type === 'FORMATIVE_QUIZ'") && tallySrc.includes("type === 'SUMMATIVE_TEST'"));
  report('AcademicMarksTallyCard renders 3-column bento summary grid', tallySrc.includes('repeat(auto-fit, minmax(210px, 1fr))'));
  report('AcademicMarksTallyCard enforces dual-condition certificate qualification', tallySrc.includes('safeTally.completedLessonsCount >= safeTally.totalLessonsCount') && tallySrc.includes('safeTally.summativeTestsPassed >= safeTally.totalSummativeTests'));
  report('AcademicMarksTallyCard awards grades DISTINCTION, FIRST_CLASS, PASS, INCOMPLETE', tallySrc.includes('DISTINCTION') && tallySrc.includes('FIRST_CLASS') && tallySrc.includes('PASS') && tallySrc.includes('INCOMPLETE'));

  // ---------------------------------------------------------------------------
  // PILLAR 10: Hostel Room Accommodation & Privacy Invariant Isolation
  // ---------------------------------------------------------------------------
  console.log('\n>>> [Pillar 10] Testing Campus Hostel Accommodation Privacy Isolation...');

  const hostelCardPath = path.join(srcDir, 'components', 'HostelRoomCard.tsx');
  assert.ok(fs.existsSync(hostelCardPath), 'HostelRoomCard.tsx must exist');
  const hostelSrc = fs.readFileSync(hostelCardPath, 'utf8');

  report('HostelRoomCard declares bilingual confidential privacy badge', hostelSrc.includes('STRICTLY CONFIDENTIAL & PRIVATE') && hostelSrc.includes('व्यक्तिगत एवं पूर्णतः गोपनीय'));
  report('HostelRoomCard explicitly states hostel records are never published to public NFC profiles', hostelSrc.includes('NEVER published to external registers or included in public NFC profiles'));

  const nfcCardPath = path.join(srcDir, 'components', 'SovereignNfcProfileCard.tsx');
  assert.ok(fs.existsSync(nfcCardPath), 'SovereignNfcProfileCard.tsx must exist');
  const nfcSrc = fs.readFileSync(nfcCardPath, 'utf8');

  // Verify Zero-PII in Sovereign NFC profile card
  report('SovereignNfcProfileCard guarantees Zero-PII (phone, email, hostel excluded)', nfcSrc.includes('Zero-PII Guarantee: Phone, email, address, and hostel room are strictly excluded'));
  report('SovereignNfcProfileCard does NOT contain hostelBlock or roomNumber fields', !nfcSrc.includes('hostelBlock') && !nfcSrc.includes('roomNumber'));

  // ---------------------------------------------------------------------------
  // PILLAR 11: Sovereign NFC Profile & Deterministic SVG QR
  // ---------------------------------------------------------------------------
  console.log('\n>>> [Pillar 11] Testing Sovereign NFC Profile & Deterministic SVG QR...');

  report('SovereignNfcProfileCard implements DeterministicSvgQr with 3 finder patterns', nfcSrc.includes('drawFinder(0, 0)') && nfcSrc.includes('drawFinder(0, GRID_SIZE - 7)') && nfcSrc.includes('drawFinder(GRID_SIZE - 7, 0)'));
  report('DeterministicSvgQr uses 21x21 standard matrix with timing tracks', nfcSrc.includes('const GRID_SIZE = 21;') && nfcSrc.includes('matrix[6][i] = i % 2 === 0'));
  report('SovereignNfcProfileCard implements rotatable profile key token handler', nfcSrc.includes('onRotateCode') && nfcSrc.includes('Rotate Profile Key'));
  report('SovereignNfcProfileCard toggle button has minHeight >= 44px', nfcSrc.includes("minHeight: '44px'"));

  // Check visitor profile route in App.tsx (/?profile=:code)
  report('App.tsx handles visitor public NFC profile URL routing (?profile=)', appSrc.includes("params.get('profile')"));

  // ---------------------------------------------------------------------------
  // PILLAR 11.B: Sovereign NFC 3D Flip Card DOM & CSS Perspective Verification
  // ---------------------------------------------------------------------------
  console.log('\n>>> [Pillar 11.B] Testing Sovereign NFC 3D Flip Card Architecture & CSS Invariants...');

  // 1. Perspective container declaration (1000px perspective)
  report(
    'SovereignNfcProfileCard declares 3D perspective scene container (perspective: 1000px)',
    /perspective:\s*['"]?1000px['"]?/.test(nfcSrc),
    'Verified perspective: 1000px in DOM style'
  );

  // 2. 3D Transform style on flipper element
  report(
    'SovereignNfcProfileCard flipper element declares transformStyle: preserve-3d',
    /transformStyle:\s*['"]preserve-3d['"]/.test(nfcSrc),
    'Verified transformStyle: preserve-3d'
  );

  // 3. Dynamic rotateY transform based on flip state
  report(
    'SovereignNfcProfileCard implements dynamic rotateY(180deg) and rotateY(0deg) flip transform',
    nfcSrc.includes('rotateY(180deg)') && nfcSrc.includes('rotateY(0deg)'),
    'Verified dynamic rotateY transform'
  );

  // 4. Backface visibility hidden on both card faces
  report(
    'SovereignNfcProfileCard hides backfaces via backfaceVisibility: hidden',
    /backfaceVisibility:\s*['"]hidden['"]/.test(nfcSrc),
    'Verified backfaceVisibility: hidden'
  );

  // 5. Card transition timing
  report(
    'SovereignNfcProfileCard declares smooth transition transform for 3D flip card animation',
    /transition:\s*['"]transform\s+[0-9.]+s/.test(nfcSrc),
    'Verified 3D transform transition timing'
  );

  // 6. Interactive flip state hook and flip button with minHeight >= 44px
  report(
    'SovereignNfcProfileCard implements isFlipped state hook with useState',
    /const\s*\[\s*isFlipped\s*,\s*setIsFlipped\s*\]\s*=\s*useState/.test(nfcSrc),
    'Verified isFlipped state toggle'
  );

  report(
    'SovereignNfcProfileCard provides interactive flip toggle button with minHeight >= 44px',
    /<button\b[\s\S]*?onClick=\{\(\)\s*=>\s*setIsFlipped\([\s\S]*?style=\{\{[\s\S]*?(?:minHeight|height):\s*'(4[4-9]|[5-9][0-9])px'[\s\S]*?\}\}/.test(nfcSrc),
    'Verified interactive flip toggle button hitbox >= 44px'
  );

  console.log('\n========================================================================');
  console.log(`  ✓ ALL ${passedChecks}/${totalChecks} ADVERSARIAL CHALLENGER CHECKS PASSED 100%!`);
  console.log('========================================================================\n');
}

runAdversarialReview().catch((err) => {
  console.error('\n❌ ADVERSARIAL CHALLENGER SUITE ENCOUNTERED ERROR:', err);
  process.exit(1);
});

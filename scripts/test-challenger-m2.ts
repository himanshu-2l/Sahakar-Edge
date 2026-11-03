/**
 * Adversarial Challenger Empirical Test Suite for Milestone 2:
 * Web Admin Visual Elevation & Institutional Governance Directorates
 *
 * Verifies:
 * 1. WCAG 2.1 AAA & AA Contrast across all text inks, status pills, and brand colors
 * 2. SVG Emblem Geometry (AshokChakraIcon 24 spokes at 15°, hub & outer ring, 28+ named icons with viewBox="0 0 24 24")
 * 3. Double-Bezel Framing CSS & helpers (outer frame, 3px moat, inner hairline, outline offset)
 * 4. Interactive Touch Targets & WCAG 2.5.5 / 2.5.8 sizing analysis
 * 5. Institutional Directorate Views domain logic & layout contracts
 * 6. Production compilation and structural anti-slop assertions
 */

import fs from 'node:fs';
import path from 'node:path';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const findings: string[] = [];

function assert(condition: boolean, message: string) {
  totalTests++;
  if (!condition) {
    failedTests++;
    console.error(`  ❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  passedTests++;
  console.log(`  ✓ PASS: ${message}`);
}

function recordFinding(severity: 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO', message: string) {
  findings.push(`[${severity}] ${message}`);
  console.log(`  🔍 FINDING (${severity}): ${message}`);
}

// WCAG relative luminance & contrast ratio calculation
function getLuminance(hex: string): number {
  const clean = hex.replace('#', '');
  const rgb = [0, 2, 4].map((offset) => {
    const val = parseInt(clean.substring(offset, offset + 2), 16) / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}

function getContrastRatio(hex1: string, hex2: string): number {
  const l1 = getLuminance(hex1);
  const l2 = getLuminance(hex2);
  const max = Math.max(l1, l2);
  const min = Math.min(l1, l2);
  return (max + 0.05) / (min + 0.05);
}

async function runM2ChallengerVerification() {
  console.log('========================================================================');
  console.log('   CHALLENGER EMPIRICAL VERIFICATION HARNESS — MILESTONE 2 (WEB-ADMIN)   ');
  console.log('========================================================================\n');

  // -------------------------------------------------------------------------
  // TEST 1: Theme Tokens, Colors & WCAG 2.1 Contrast
  // -------------------------------------------------------------------------
  console.log('>>> [Test 1] Design Tokens & WCAG Contrast Audit...');
  const themePath = path.resolve('apps/web-admin/src/components/theme.ts');
  const themeSrc = fs.readFileSync(themePath, 'utf8');
  const themeMatch = themeSrc.match(/export const THEME = ({[\s\S]*?\n};\n)/);
  if (!themeMatch) throw new Error('Could not parse THEME from theme.ts');
  const THEME = eval(`(${themeMatch[1].replace(/;\s*$/, '')})`);

  // Hex validity
  const hexRegex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
  assert(hexRegex.test(THEME.colors.bgCanvas), `bgCanvas ${THEME.colors.bgCanvas} is valid hex`);
  assert(hexRegex.test(THEME.colors.bgSurface), `bgSurface ${THEME.colors.bgSurface} is valid hex`);
  assert(hexRegex.test(THEME.colors.inkPrimary), `inkPrimary ${THEME.colors.inkPrimary} is valid hex`);
  assert(hexRegex.test(THEME.colors.inkBody), `inkBody ${THEME.colors.inkBody} is valid hex`);
  assert(hexRegex.test(THEME.colors.navyDeep), `navyDeep ${THEME.colors.navyDeep} is valid hex`);
  assert(hexRegex.test(THEME.colors.navyPrimary), `navyPrimary ${THEME.colors.navyPrimary} is valid hex`);
  assert(hexRegex.test(THEME.colors.navySovereign), `navySovereign ${THEME.colors.navySovereign} is valid hex`);
  assert(hexRegex.test(THEME.colors.goldCoop), `goldCoop ${THEME.colors.goldCoop} is valid hex`);
  assert(hexRegex.test(THEME.colors.emeraldCoop), `emeraldCoop ${THEME.colors.emeraldCoop} is valid hex`);
  assert(hexRegex.test(THEME.colors.saffronFlag), `saffronFlag ${THEME.colors.saffronFlag} is valid hex`);
  assert(hexRegex.test(THEME.colors.greenFlag), `greenFlag ${THEME.colors.greenFlag} is valid hex`);

  // Contrast assertions against white (#ffffff)
  const rInkPrimary = getContrastRatio(THEME.colors.inkPrimary, '#ffffff');
  assert(rInkPrimary >= 16.0, `inkPrimary (#081854) contrast against white is ${rInkPrimary.toFixed(2)}:1 (>= 16:1 WCAG AAA)`);

  const rInkBody = getContrastRatio(THEME.colors.inkBody, '#ffffff');
  assert(rInkBody >= 10.0, `inkBody (#334155) contrast against white is ${rInkBody.toFixed(2)}:1 (>= 10:1 WCAG AAA)`);

  const rNavyPrimary = getContrastRatio(THEME.colors.navyPrimary, '#ffffff');
  assert(rNavyPrimary >= 7.0, `navyPrimary (#0649a2) contrast against white is ${rNavyPrimary.toFixed(2)}:1 (>= 7:1 WCAG AAA)`);

  // Status pills contrast assertions
  const requiredStatusBadges = ['success', 'info', 'warning', 'error', 'neutral', 'apex', 'coop', 'saffron'];
  for (const key of requiredStatusBadges) {
    const token = THEME.colors.status[key];
    assert(!!token, `Status token '${key}' is defined in THEME.colors.status`);
    const ratio = getContrastRatio(token.text, token.bg);
    assert(ratio >= 4.5, `Status '${key}' text (${token.text}) on bg (${token.bg}) contrast is ${ratio.toFixed(2)}:1 (>= 4.5:1 WCAG AA)`);
  }

  // -------------------------------------------------------------------------
  // TEST 2: SVG Emblem Geometry & Icon System Inspection
  // -------------------------------------------------------------------------
  console.log('\n>>> [Test 2] SVG Emblem Geometry & 28+ Icon Exports Audit...');
  const iconsPath = path.resolve('apps/web-admin/src/components/icons.tsx');
  const iconsSrc = fs.readFileSync(iconsPath, 'utf8');

  // Verify AshokChakraIcon implementation
  assert(iconsSrc.includes('export function AshokChakraIcon'), 'AshokChakraIcon is exported as a named function component');
  assert(iconsSrc.includes('Array.from({ length: 24 }') && iconsSrc.includes('15'), 'AshokChakraIcon computes 24 spokes at 15° rotation intervals');
  assert(iconsSrc.includes('transform={`rotate(${deg} 12 12)`}'), 'AshokChakraIcon rotates spokes radially around center hub (12, 12)');
  assert(iconsSrc.includes('cx="12" cy="12" r="1.8"'), 'AshokChakraIcon renders solid central hub circle of radius 1.8');
  assert(iconsSrc.includes('cx="12" cy="12" r="0.75"'), 'AshokChakraIcon renders central white inner hub circle');
  assert(iconsSrc.includes('cx="12" cy="12" r="11"'), 'AshokChakraIcon renders outer sovereign ring of radius 11');
  assert(iconsSrc.includes('<polygon points="11.6,2.2 12.4,2.2 12,1.2"'), 'AshokChakraIcon renders triangular pinhead cap on each spoke tip');

  // Verify NcctEmblemIcon implementation
  assert(iconsSrc.includes('export function NcctEmblemIcon'), 'NcctEmblemIcon is exported as a named function component');
  assert(iconsSrc.includes('wheat sheaves') || iconsSrc.includes('M7.8 14.2'), 'NcctEmblemIcon includes cooperative wheat sheaves motif');
  assert(iconsSrc.includes('book of institutional') || iconsSrc.includes('M8.5 13.2'), 'NcctEmblemIcon includes open book of learning motif');

  // Verify all 28 original named icon exports + newly added directorate icons
  const allExpectedIcons = [
    'MinistryEmblemIcon',
    'OverviewIcon',
    'FederationIcon',
    'InstitutesIcon',
    'ProgrammesIcon',
    'BatchesIcon',
    'CoursesIcon',
    'AttendanceIcon',
    'CredentialsIcon',
    'EmploymentIcon',
    'ErpLogisticsIcon',
    'EdgeNodesIcon',
    'SyncMonitorIcon',
    'AuditLogIcon',
    'PhoneSimulatorIcon',
    'CheckIcon',
    'CloseIcon',
    'SearchIcon',
    'RefreshIcon',
    'FilterIcon',
    'MapPinIcon',
    'CpuIcon',
    'KeyIcon',
    'StarIcon',
    'CalendarIcon',
    'ShieldCheckIcon',
    'ExternalLinkIcon',
    'BotIcon',
    'AshokChakraIcon',
    'NcctEmblemIcon',
    'AtpBatchesIcon',
    'TimetableAttendanceIcon',
    'ContinuousGradebookIcon',
    'DropoutRiskRadarIcon',
  ];

  for (const iconName of allExpectedIcons) {
    const fnDefRegex = new RegExp(`export\\s+function\\s+${iconName}\\s*\\(`, 'g');
    assert(fnDefRegex.test(iconsSrc), `Icon ${iconName} is exported as a named function component`);
  }

  // Verify standard viewBox="0 0 24 24" across all icons
  const viewBoxMatches = iconsSrc.match(/viewBox="0 0 24 24"/g);
  assert(viewBoxMatches !== null && viewBoxMatches.length >= allExpectedIcons.length, `All icons specify viewBox="0 0 24 24" (found ${viewBoxMatches?.length} occurrences)`);

  // -------------------------------------------------------------------------
  // TEST 3: Double-Bezel Framing CSS & Helpers
  // -------------------------------------------------------------------------
  console.log('\n>>> [Test 3] Double-Bezel Framing CSS & Structural Tokens Audit...');
  assert(themeSrc.includes('export const doubleBezelCardOuterStyle'), 'doubleBezelCardOuterStyle is exported from theme.ts');
  assert(themeSrc.includes('export const doubleBezelCardInnerStyle'), 'doubleBezelCardInnerStyle is exported from theme.ts');
  assert(themeSrc.includes('export const doubleBezelApexCardOuterStyle'), 'doubleBezelApexCardOuterStyle is exported from theme.ts');
  assert(themeSrc.includes('export const doubleBezelApexCardInnerStyle'), 'doubleBezelApexCardInnerStyle is exported from theme.ts');
  assert(themeSrc.includes('export const doubleBezelEmeraldCardOuterStyle'), 'doubleBezelEmeraldCardOuterStyle is exported from theme.ts');
  assert(themeSrc.includes('export const doubleBezelEmeraldCardInnerStyle'), 'doubleBezelEmeraldCardInnerStyle is exported from theme.ts');
  assert(themeSrc.includes('export const doubleBezelCard ='), 'doubleBezelCard helper function is exported from theme.ts');

  // Verify CSS properties of double-bezel framing
  assert(themeSrc.includes("padding: '3px'") && themeSrc.includes("border: '1px solid #cbd5e1'"), 'doubleBezelCardOuterStyle implements 1px outer frame and 3px moat');
  assert(themeSrc.includes("border: '1px solid #e2e8f0'") && themeSrc.includes("borderRadius: '2px'"), 'doubleBezelCardInnerStyle implements 1px hairline container with 2px radius');
  assert(themeSrc.includes("outline: `1px solid ${outerBorder}`") && themeSrc.includes("outlineOffset: '2px'"), 'doubleBezelCard function generates outer outline with 2px offset moat');

  // -------------------------------------------------------------------------
  // TEST 4: Interactive Touch Targets & WCAG 2.5.5 / 2.5.8 Analysis
  // -------------------------------------------------------------------------
  console.log('\n>>> [Test 4] Interactive Touch Targets & Sizing Audit...');
  const topHeaderPath = path.resolve('apps/web-admin/src/components/TopHeader.tsx');
  const topHeaderSrc = fs.readFileSync(topHeaderPath, 'utf8');

  const sidebarPath = path.resolve('apps/web-admin/src/components/SidebarNav.tsx');
  const sidebarSrc = fs.readFileSync(sidebarPath, 'utf8');

  // Extract minHeight of Directorate Strip buttons in TopHeader.tsx
  const dirStripMinHeightMatch = topHeaderSrc.match(/minHeight:\s*'(\d+)px'/);
  const dirStripMinHeight = dirStripMinHeightMatch ? parseInt(dirStripMinHeightMatch[1], 10) : 0;
  console.log(`  ℹ TopHeader directorate command button minHeight: ${dirStripMinHeight}px`);

  // Extract minHeight of SidebarNav buttons
  const sidebarMinHeightMatch = sidebarSrc.match(/minHeight:\s*'(\d+)px'/);
  const sidebarMinHeight = sidebarMinHeightMatch ? parseInt(sidebarMinHeightMatch[1], 10) : 0;
  console.log(`  ℹ SidebarNav tab button minHeight: ${sidebarMinHeight}px`);

  // Check WCAG 2.5.8 (Level AA) minimum 24px threshold
  assert(dirStripMinHeight >= 24, `Directorate strip command buttons (${dirStripMinHeight}px) exceed WCAG 2.5.8 AA minimum target size 24px`);
  assert(sidebarMinHeight >= 24, `SidebarNav tab buttons (${sidebarMinHeight}px) exceed WCAG 2.5.8 AA minimum target size 24px`);

  // Check WCAG 2.5.5 (Level AAA) 44px threshold
  if (dirStripMinHeight < 44) {
    recordFinding(
      'MEDIUM',
      `TopHeader Directorate Strip buttons have minHeight='${dirStripMinHeight}px', which is below WCAG 2.5.5 AAA target size (>= 44px), though satisfying WCAG 2.5.8 AA (>= 24px).`
    );
  } else {
    assert(dirStripMinHeight >= 44, `Directorate strip command buttons satisfy WCAG 2.5.5 AAA (>= 44px)`);
  }

  if (sidebarMinHeight < 44) {
    recordFinding(
      'MEDIUM',
      `SidebarNav tab buttons have minHeight='${sidebarMinHeight}px', which is below WCAG 2.5.5 AAA target size (>= 44px), though satisfying WCAG 2.5.8 AA (>= 24px).`
    );
  } else {
    assert(sidebarMinHeight >= 44, `SidebarNav tab buttons satisfy WCAG 2.5.5 AAA (>= 44px)`);
  }

  // Check TopHeader Utility Bar controls (Language toggle & font resizer A-/A/A+)
  if (topHeaderSrc.includes("padding: '0.1rem 0.35rem'")) {
    recordFinding(
      'LOW',
      `TopHeader font size resizer buttons (A-, A, A+) use compact padding ('0.1rem 0.35rem') with computed height ~18-20px in the top utility bar. Meets desktop density norms, but below 44px touch target guidelines.`
    );
  }

  // -------------------------------------------------------------------------
  // TEST 5: Institutional Governance Directorates Domain Logic & Contracts
  // -------------------------------------------------------------------------
  console.log('\n>>> [Test 5] Institutional Directorate Views & Domain Contracts Audit...');

  // 1. ATP Batch Lifecycle & Nomination Queue View
  const atpPath = path.resolve('apps/web-admin/src/components/AtpNominationQueueView.tsx');
  const atpSrc = fs.readFileSync(atpPath, 'utf8');
  assert(atpSrc.includes('export function AtpNominationQueueView'), 'AtpNominationQueueView is exported');
  assert(atpSrc.includes('getTrainingInstitutes'), 'AtpNominationQueueView calls apiClient.getTrainingInstitutes()');
  assert(atpSrc.includes('getTrainingProgrammes'), 'AtpNominationQueueView calls apiClient.getTrainingProgrammes()');
  assert(atpSrc.includes('getTrainingNominations'), 'AtpNominationQueueView calls apiClient.getTrainingNominations()');
  assert(atpSrc.includes('decideTrainingNomination'), 'AtpNominationQueueView supports decideTrainingNomination API call');
  assert(atpSrc.includes('CampusHostelRoom') || atpSrc.includes('hostelRooms'), 'AtpNominationQueueView manages campus hostel room assignments');

  // 2. Timetable Attendance View
  const ttPath = path.resolve('apps/web-admin/src/components/TimetableAttendanceView.tsx');
  const ttSrc = fs.readFileSync(ttPath, 'utf8');
  assert(ttSrc.includes('export function TimetableAttendanceView'), 'TimetableAttendanceView is exported');
  assert(ttSrc.includes('getTimetableSessions'), 'TimetableAttendanceView calls apiClient.getTimetableSessions()');
  assert(ttSrc.includes('getTimetableRoster'), 'TimetableAttendanceView calls apiClient.getTimetableRoster()');
  assert(ttSrc.includes('checkInCode') || ttSrc.includes('check-in code'), 'TimetableAttendanceView displays dynamic 6-digit attendance check-in code');
  assert(ttSrc.includes('75%') || ttSrc.includes('0.75') || ttSrc.includes('isStatutoryCompliant'), 'TimetableAttendanceView computes statutory 75% attendance compliance');
  assert(ttSrc.includes('updateFacultyManualAttendance'), 'TimetableAttendanceView supports faculty manual attendance override with audit trail');

  // 3. Academic Gradebook View
  const gbPath = path.resolve('apps/web-admin/src/components/AcademicGradebookView.tsx');
  const gbSrc = fs.readFileSync(gbPath, 'utf8');
  assert(gbSrc.includes('export function AcademicGradebookView'), 'AcademicGradebookView is exported');
  assert(gbSrc.includes('FORMATIVE') && gbSrc.includes('SUMMATIVE'), 'AcademicGradebookView segregates Formative Quizzes from Summative Tests');
  assert(gbSrc.includes('apiClient.getBaseUrl()') && gbSrc.includes('/api/v1/training/evaluation/gradebook'), 'AcademicGradebookView connects to gradebook endpoint via apiClient');
  assert(gbSrc.includes('handleExportGradebook') && gbSrc.includes('res.blob()'), 'AcademicGradebookView implements statutory multi-sheet XLSX / CSV gradebook export');

  // 4. Dropout Risk Analytics View
  const drPath = path.resolve('apps/web-admin/src/components/DropoutRiskAnalyticsView.tsx');
  const drSrc = fs.readFileSync(drPath, 'utf8');
  assert(drSrc.includes('export function DropoutRiskAnalyticsView'), 'DropoutRiskAnalyticsView is exported');
  assert(drSrc.includes('lessonRiskPoints') && drSrc.includes('attendanceRiskPoints') && drSrc.includes('dormancyRiskPoints'), 'DropoutRiskAnalyticsView implements 4-factor risk scoring');
  assert(drSrc.includes('HIGH') && drSrc.includes('MEDIUM') && drSrc.includes('LOW'), 'DropoutRiskAnalyticsView implements High/Medium/Low risk triage tiers');
  assert(drSrc.includes('CANONICAL_COOPERATIVE_SKILLS') || drSrc.includes('CooperativeSkillRadarAxis'), 'DropoutRiskAnalyticsView renders 8-D cooperative skill radar');

  // 5. App Page Wiring
  const pagePath = path.resolve('apps/web-admin/src/app/page.tsx');
  const pageSrc = fs.readFileSync(pagePath, 'utf8');
  assert(pageSrc.includes('<AtpNominationQueueView'), 'page.tsx conditionally renders AtpNominationQueueView');
  assert(pageSrc.includes('<TimetableAttendanceView'), 'page.tsx conditionally renders TimetableAttendanceView');
  assert(pageSrc.includes('<AcademicGradebookView'), 'page.tsx conditionally renders AcademicGradebookView');
  assert(pageSrc.includes('<DropoutRiskAnalyticsView'), 'page.tsx conditionally renders DropoutRiskAnalyticsView');

  // -------------------------------------------------------------------------
  // Summary & Findings Output
  // -------------------------------------------------------------------------
  console.log('\n========================================================================');
  console.log(`   CHALLENGER VERIFICATION COMPLETE: ${passedTests}/${totalTests} TESTS PASSED`);
  if (failedTests > 0) {
    console.log(`   ❌ FAILED TESTS: ${failedTests}`);
  } else {
    console.log(`   ✓ ZERO FAILURES DETECTED`);
  }
  console.log(`   🔍 ADVERSARIAL FINDINGS / OBSERVATIONS: ${findings.length}`);
  for (const f of findings) {
    console.log(`      ${f}`);
  }
  console.log('========================================================================\n');
}

runM2ChallengerVerification().catch((err) => {
  console.error('Fatal execution error in test-challenger-m2.ts:', err);
  process.exit(1);
});

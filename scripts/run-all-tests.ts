import { spawnSync } from 'node:child_process';
import process from 'node:process';
import { performance } from 'node:perf_hooks';

interface TestSuiteDefinition {
  id: number;
  name: string;
  script: string;
  timeoutMs?: number;
}

interface TestSuiteResult {
  id: number;
  name: string;
  script: string;
  durationMs: number;
  status: number;
  timedOut: boolean;
}

const testSuites: TestSuiteDefinition[] = [
  {
    id: 1,
    name: 'Phase 0 — Monorepo Boundaries, Cryptographic Types & Canonical Serialization',
    script: 'scripts/test-phase0.ts',
  },
  {
    id: 2,
    name: 'Phase 1 — Central Authority RBAC Authentication & Institutional Registries',
    script: 'scripts/test-phase1.ts',
  },
  {
    id: 3,
    name: 'Phase 2 — Trainee PWA Offline Store & Assessment Player',
    script: 'scripts/test-phase2.ts',
  },
  {
    id: 4,
    name: 'Phase 3 — Edge Server SQLite WAL Journal & Crash Resilience',
    script: 'scripts/test-phase3.ts',
  },
  {
    id: 5,
    name: 'Phase 4 — Canonical JSON Serialization & Idempotent Sync Protocol',
    script: 'scripts/test-phase4.ts',
  },
  {
    id: 6,
    name: 'Phase 5 — Attendance Hardware Adapters (Biometric Face & Dynamic QR)',
    script: 'scripts/test-phase5.ts',
  },
  {
    id: 7,
    name: 'Phase 6 — Statutory Ed25519 Digital Credential Issuance & QR Verification',
    script: 'scripts/test-phase6.ts',
  },
  {
    id: 8,
    name: 'Phase 7 — Recruiter Skill Taxonomy & Weighted Matching Vector Benchmarks',
    script: 'scripts/test-phase7.ts',
  },
  {
    id: 9,
    name: 'Phase 8 — Production Hardening, Concurrency Benchmarks & Systemd Daemons',
    script: 'scripts/test-phase8.ts',
  },
  {
    id: 10,
    name: 'Production E2E — Multi-Process HTTP Integration & Data Lifecycle',
    script: 'scripts/test-production-e2e.ts',
  },
  {
    id: 11,
    name: 'Deep Adversarial — Security Fuzzing, Replay Flood & Tamper Rejection',
    script: 'scripts/test-deep-adversarial.ts',
  },
  {
    id: 12,
    name: 'Phase 9 — Hardware RFID Tap (<50ms), Oral Viva Audio & 3-Tier Rollup',
    script: 'scripts/test-phase9.ts',
  },
  {
    id: 13,
    name: 'Phase 10 — Domain Capability Synthesis (Apex Advisory, CAMEL Scorecard, PACS Lab & Grievance SLA)',
    script: 'scripts/test-phase10-domain-synthesis.ts',
  },
  {
    id: 14,
    name: 'NCCT Government Visual Elevation, Authentic Emblems & Domain Synthesis',
    script: 'scripts/test-phase11-ncct-elevation.ts',
  },
];

console.log('================================================================================');
console.log('   SAHAKAR EDGE — AUTOMATED MONOREPO MASTER TEST SUITE RUNNER                   ');
console.log(`   Registered Test Suites: ${testSuites.length} | Node Runtime: ${process.version}`);
console.log('================================================================================\n');

const suiteResults: TestSuiteResult[] = [];
const overallStart = performance.now();

for (let i = 0; i < testSuites.length; i++) {
  const suite = testSuites[i];
  const timeoutMs = suite.timeoutMs ?? 60_000;

  console.log(`--------------------------------------------------------------------------------`);
  console.log(`>>> Executing Suite [${suite.id}/${testSuites.length}]: ${suite.name}`);
  console.log(`>>> Target Script: ${suite.script}`);
  console.log(`--------------------------------------------------------------------------------`);

  const suiteStart = performance.now();
  const result = spawnSync(process.execPath, [suite.script], {
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'test' },
    timeout: timeoutMs,
  });
  const durationMs = Math.round(performance.now() - suiteStart);
  const timedOut = Boolean(result.error && (result.error as NodeJS.ErrnoException).code === 'ETIMEDOUT');
  const exitStatus = timedOut ? 124 : (result.status ?? (result.error ? 1 : 0));

  suiteResults.push({
    id: suite.id,
    name: suite.name,
    script: suite.script,
    durationMs,
    status: exitStatus,
    timedOut,
  });

  if (timedOut) {
    console.error(`\n❌ Suite [${suite.id}/${testSuites.length}] TIMED OUT after ${timeoutMs}ms: ${suite.script}`);
    process.exit(124);
  }

  if (exitStatus !== 0) {
    console.error(`\n❌ Suite [${suite.id}/${testSuites.length}] FAILED with exit code ${exitStatus}: ${suite.script}`);
    process.exit(exitStatus);
  }

  console.log(`\n✓ Suite [${suite.id}/${testSuites.length}] PASSED in ${durationMs}ms: ${suite.script}\n`);
}

const totalDurationSec = ((performance.now() - overallStart) / 1000).toFixed(2);

console.log('================================================================================');
console.log('                      TEST SUITE EXECUTION SCORECARD                            ');
console.log('================================================================================');
console.log(`| #   | Duration | Status | Test Suite Description`);
console.log(`|:---:|:--------:|:------:|:-----------------------------------------------------`);
for (const r of suiteResults) {
  const paddedId = String(r.id).padStart(2, ' ');
  const paddedDur = `${r.durationMs}ms`.padStart(8, ' ');
  const statusStr = r.status === 0 ? 'PASS ' : 'FAIL ';
  console.log(`| ${paddedId}  | ${paddedDur} | ${statusStr}  | ${r.name}`);
}
console.log('================================================================================');
console.log(`   ✓ ALL ${testSuites.length}/${testSuites.length} MONOREPO TEST SUITES PASSED CLEANLY! (Suites 1-${testSuites.length})`);
console.log(`   ✓ Total Duration: ${totalDurationSec}s | Exit Code: 0 | Regressions: 0`);
console.log('================================================================================');

process.exit(0);

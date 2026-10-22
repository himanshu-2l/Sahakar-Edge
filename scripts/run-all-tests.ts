import { spawnSync } from 'node:child_process';
import process from 'node:process';

console.log('========================================================');
console.log('   SAHAKAR EDGE — AUTOMATED SUITE VERIFICATION RUNNER  ');
console.log('========================================================\n');

const testSuites = [
  'scripts/test-phase0.ts',
  'scripts/test-phase1.ts',
  'scripts/test-phase2.ts',
  'scripts/test-phase3.ts',
  'scripts/test-phase4.ts',
  'scripts/test-phase5.ts',
  'scripts/test-phase6.ts',
  'scripts/test-phase7.ts',
  'scripts/test-phase8.ts',
  'scripts/test-production-e2e.ts',
];

for (const suite of testSuites) {
  console.log(`>>> Executing test suite: ${suite}`);
  const result = spawnSync(process.execPath, [suite], {
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'test' },
  });

  if (result.status !== 0) {
    console.error(`\n❌ Test suite failed with exit code ${result.status}: ${suite}`);
    process.exit(result.status || 1);
  }
  console.log(`\n✓ Suite completed successfully: ${suite}\n`);
}

console.log('========================================================');
console.log('   ✓ ALL MONOREPO TEST SUITES PASSED CLEANLY!           ');
console.log('========================================================');

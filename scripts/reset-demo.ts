import fs from 'node:fs';
import path from 'node:path';
import { centralStore } from '../apps/central-api/dist/store/memory-store.js';

const DEMO_DB_PATH = path.resolve(process.cwd(), 'data/demo-edge.sqlite');
const LOCAL_DB_PATH = path.resolve(process.cwd(), 'data/edge.sqlite');

export function resetDemoState() {
  console.log('--- RESETTING SAHAKAR EDGE DEMO ENVIRONMENT ---');

  // 1. Wipe SQLite database files
  const filesToClean = [
    DEMO_DB_PATH,
    `${DEMO_DB_PATH}-wal`,
    `${DEMO_DB_PATH}-shm`,
    LOCAL_DB_PATH,
    `${LOCAL_DB_PATH}-wal`,
    `${LOCAL_DB_PATH}-shm`,
  ];

  for (const file of filesToClean) {
    if (fs.existsSync(file)) {
      try {
        fs.unlinkSync(file);
        console.log(`✓ Removed stale database: ${path.basename(file)}`);
      } catch (err: any) {
        console.warn(`⚠ Could not remove ${path.basename(file)}: ${err.message}`);
      }
    }
  }

  // Ensure data folder exists
  fs.mkdirSync(path.dirname(DEMO_DB_PATH), { recursive: true });

  // 2. Reset central store to clean state
  centralStore.seedBaseline();
  console.log('✓ Central Master In-Memory Store reset to pristine baseline state.');
  console.log('  • 2 Institutes (RICM Bhopal, VAMNICOM Pune)');
  console.log('  • 5 Users across all 5 RBAC roles');
  console.log('  • 1 Active Training Programme & Batch');
  console.log('  • 1 Course with 2 Lessons & 1 Assessment');
  console.log('  • 7 Cooperative Skills in Taxonomy');
  console.log('  • 3 Cooperative Employer Job Listings (Amul, GCMMF, DCCB)');
  console.log('\n=== DEMO RESET COMPLETED SUCCESSFULLY! READY FOR PRESENTATION. ===\n');
}

if (process.argv[1] && process.argv[1].endsWith('reset-demo.ts')) {
  resetDemoState();
}

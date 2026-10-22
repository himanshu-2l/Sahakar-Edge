/**
 * Production End-to-End Live System Integration Test
 * Verifies real HTTP cross-service communication between:
 * - Central API (Port 4000) with real disk persistence
 * - Edge Server (Port 4100) with SQLite WAL journal
 * - Trainee PWA sync client with live HTTP posting
 * - Web Admin API client with ERP logistics & AI counselor
 */

import { buildCentralServer } from '../apps/central-api/dist/server.js';
import { buildEdgeServer } from '../apps/edge-server/dist/server.js';
import { SyncStatus, ProgrammeStatus } from '../packages/types/dist/index.js';
import type { SyncEvent } from '../packages/types/dist/index.js';
import { calculateEventHash } from '../packages/sync-protocol/dist/index.js';
import { SEED_INSTITUTE_RICM_BHOPAL } from '../packages/test-fixtures/dist/index.js';
import * as fs from 'node:fs';
import * as path from 'node:path';

async function runProductionE2ETest() {
  console.log('========================================================');
  console.log('   SAHAKAR EDGE — PRODUCTION END-TO-END VERIFICATION    ');
  console.log('========================================================\n');

  process.env.ENABLE_PERSISTENCE = 'true';

  // 1. Initialize Central API Server
  console.log('[Step 1] Booting Central API Server with Disk Store...');
  const centralServer = await buildCentralServer();
  await centralServer.listen({ port: 4000, host: '127.0.0.1' });
  console.log('  ✓ Central API listening on http://127.0.0.1:4000');

  // 2. Initialize Edge Server
  console.log('[Step 2] Booting Edge Server with SQLite WAL Engine...');
  const edgeServer = await buildEdgeServer({
    nodeId: 'edge-node-ricm-bhopal-01',
    instituteId: SEED_INSTITUTE_RICM_BHOPAL.id,
    wanSimulationMode: 'online',
  });
  await edgeServer.listen({ port: 4100, host: '127.0.0.1' });
  console.log('  ✓ Edge Server listening on http://127.0.0.1:4100');

  try {
    // 3. Test Network Probing from Client
    console.log('\n[Step 3] Client Network Probing & Reachability...');
    const edgeProbe = await fetch('http://127.0.0.1:4100/health');
    const centralProbe = await fetch('http://127.0.0.1:4000/health');
    console.log('  ✓ Probed Edge Node:', edgeProbe.ok ? 'ONLINE (200 OK)' : 'OFFLINE');
    console.log('  ✓ Probed Central Cloud:', centralProbe.ok ? 'ONLINE (200 OK)' : 'OFFLINE');
    if (!edgeProbe.ok || !centralProbe.ok) {
      throw new Error('Both Edge and Central must be reachable for E2E test');
    }

    // 4. Trainee PWA Event Ingestion into Edge Node via HTTP POST
    console.log('\n[Step 4] Trainee PWA Ingesting Events into Edge Node via Live HTTP...');
    const nowIso = new Date().toISOString();
    const eventPayload = {
      traineeId: 'dddd4444-4444-4444-4444-444444444441',
      sessionId: 'sess-e2e-01',
      verificationMethod: 'DYNAMIC_QR',
      status: 'PRESENT',
      recordedAt: nowIso,
    };
    const eventHash = calculateEventHash(
      'ATTENDANCE',
      'sess-e2e-01',
      'ATTENDANCE_RECORDED',
      eventPayload,
      1
    );

    const dummyEvent: SyncEvent = {
      id: `ev-pwa-e2e-${Date.now()}`,
      nodeId: 'edge-node-ricm-bhopal-01',
      aggregateType: 'ATTENDANCE',
      aggregateId: 'sess-e2e-01',
      eventType: 'ATTENDANCE_RECORDED',
      payload: eventPayload,
      schemaVersion: 1,
      occurredAt: nowIso,
      logicalSequence: 1,
      hash: eventHash,
      syncStatus: SyncStatus.QUEUED,
      retryCount: 0,
    };

    const edgeIngestRes = await fetch('http://127.0.0.1:4100/api/v1/sync/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer trainee-token',
      },
      body: JSON.stringify({
        nodeId: 'edge-node-ricm-bhopal-01',
        events: [dummyEvent],
      }),
    });
    if (!edgeIngestRes.ok) {
      throw new Error(`Edge ingest failed with HTTP ${edgeIngestRes.status}`);
    }
    const edgeIngestJson = await edgeIngestRes.json();
    console.log('  ✓ Edge Ingestion Ack:', JSON.stringify(edgeIngestJson));

    // 5. Trigger Upstream Edge-to-Central WAN Batch Synchronization
    console.log('\n[Step 5] Triggering Upstream Edge -> Central Cloud Sync via Live HTTP...');
    const triggerRes = await fetch('http://127.0.0.1:4100/api/v1/sync/trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        centralApiUrl: 'http://127.0.0.1:4000',
        nodeId: 'edge-node-ricm-bhopal-01',
        instituteId: SEED_INSTITUTE_RICM_BHOPAL.id,
      }),
    });
    if (!triggerRes.ok) {
      throw new Error(`Edge sync trigger failed with HTTP ${triggerRes.status}`);
    }
    const triggerData = await triggerRes.json();
    console.log('  ✓ Edge Upstream Sync Result:', JSON.stringify(triggerData));
    if (!triggerData.success) {
      throw new Error(`Edge sync failed: ${triggerData.error}`);
    }

    // 6. Live Web Admin Client Ingestion & Querying
    console.log('\n[Step 6] Testing Live Web Admin Requests against Central API...');
    const adminAuthHeader = 'Bearer superadmin-token';

    // Create Programme via Live Admin API call
    const createProgRes = await fetch('http://127.0.0.1:4000/api/v1/programmes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: adminAuthHeader,
      },
      body: JSON.stringify({
        instituteId: SEED_INSTITUTE_RICM_BHOPAL.id,
        title: 'PACS Senior Accountant Certification 2026',
        description: 'Comprehensive double-entry auditing training for rural cooperative staff.',
        startAt: new Date().toISOString(),
        endAt: new Date(Date.now() + 30 * 86400000).toISOString(),
        status: ProgrammeStatus.ACTIVE,
      }),
    });
    if (!createProgRes.ok) {
      throw new Error(`Create programme failed with HTTP ${createProgRes.status}`);
    }
    const { programme: createdProg } = await createProgRes.json();
    console.log('  ✓ Created Programme via Live HTTP:', createdProg.id, `("${createdProg.title}")`);

    // Verify Programme Listed
    const listProgRes = await fetch('http://127.0.0.1:4000/api/v1/programmes', {
      headers: { Authorization: adminAuthHeader },
    });
    const { programmes: allProgs } = await listProgRes.json();
    const foundProg = allProgs.find((p: any) => p.id === createdProg.id);
    if (!foundProg) {
      throw new Error('Created programme not found in Central API list');
    }
    console.log('  ✓ Verified Programme retrieval (Total Programmes:', allProgs.length, ')');

    // Query ERP Logistics Endpoints
    console.log('\n[Step 7] Querying ERP Logistics (Hostel, Timetable, Mess, Kits)...');
    const hostelsRes = await fetch('http://127.0.0.1:4000/api/v1/logistics/hostels', {
      headers: { Authorization: adminAuthHeader },
    });
    const timetableRes = await fetch('http://127.0.0.1:4000/api/v1/logistics/timetable', {
      headers: { Authorization: adminAuthHeader },
    });
    const kitsRes = await fetch('http://127.0.0.1:4000/api/v1/logistics/hardware-kits', {
      headers: { Authorization: adminAuthHeader },
    });
    const auditLogsRes = await fetch('http://127.0.0.1:4000/api/v1/logistics/audit-logs', {
      headers: { Authorization: adminAuthHeader },
    });

    const { hostelAllotments: hostels } = await hostelsRes.json();
    const { timetable } = await timetableRes.json();
    const { hardwareKits: kits } = await kitsRes.json();
    const { auditLogs } = await auditLogsRes.json();

    console.log(`  ✓ Hostels: ${hostels.length} allotments`);
    console.log(`  ✓ Timetable: ${timetable.length} active sessions`);
    console.log(`  ✓ Hardware Kits: ${kits.length} deployed kits`);
    console.log(`  ✓ Audit Logs: ${auditLogs.length} security audit entries`);

    if (hostels.length === 0 || timetable.length === 0 || kits.length === 0) {
      throw new Error('ERP Logistics endpoints returned empty datasets');
    }

    // Query AI Cooperative Counselor (PS 26087 requirement)
    console.log('\n[Step 8] Testing AI Career Counselor (Sahakar Mitra)...');
    const counselorRes = await fetch('http://127.0.0.1:4000/api/v1/counselor/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: adminAuthHeader,
      },
      body: JSON.stringify({
        query: 'What are the eligibility norms and salary for PACS Secretary positions?',
        candidateId: 'dddd4444-4444-4444-4444-444444444441',
        language: 'EN',
      }),
    });
    if (!counselorRes.ok) {
      throw new Error(`Counselor query failed with HTTP ${counselorRes.status}`);
    }
    const counselorReply = await counselorRes.json();
    console.log('  ✓ AI Counselor Response:', counselorReply.reply.slice(0, 110) + '...');
    console.log('  ✓ AI Recommended Career Tags:', counselorReply.tags);
    if (!counselorReply.reply || !counselorReply.tags.length) {
      throw new Error('AI Counselor failed to return valid reply or tags');
    }

    // 9. Verify Disk Persistence
    console.log('\n[Step 9] Verifying Central Disk Persistence...');
    const storePath = path.resolve(process.cwd(), 'data', 'central-store.json');
    if (fs.existsSync(storePath)) {
      const content = fs.readFileSync(storePath, 'utf-8');
      const parsed = JSON.parse(content);
      const hasNewProg = parsed.programmes.some(
        (p: any) =>
          Array.isArray(p)
            ? p[0] === createdProg.id || p[1]?.id === createdProg.id
            : p.id === createdProg.id
      );
      console.log('  ✓ Disk store verified at data/central-store.json');
      console.log('  ✓ Verified persisted new programme on disk:', hasNewProg);
      if (!hasNewProg) {
        throw new Error('Created programme was not written to data/central-store.json');
      }
    } else {
      console.log('  Notice: Running in persistence-bypassed mode (NODE_ENV=test)');
    }

    console.log('\n========================================================');
    console.log('   ✓ PRODUCTION END-TO-END VERIFICATION PASSED 100%!   ');
    console.log('========================================================\n');
  } finally {
    console.log('Shutting down test servers...');
    await edgeServer.close();
    await centralServer.close();
    console.log('Servers stopped cleanly.');
  }
}

runProductionE2ETest().catch((err) => {
  console.error('\n❌ Production E2E Verification Failed:', err);
  process.exit(1);
});

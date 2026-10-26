import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';

import { RfidSmartCardProvider } from '../packages/hardware-adapters/dist/index.js';
import { buildEdgeServer } from '../apps/edge-server/dist/server.js';
import { EdgeJournalService } from '../apps/edge-server/dist/services/journal-service.js';
import { AttendanceVerificationMethod } from '../packages/types/dist/index.js';
import {
  verifyEventHash,
  calculateEventHash,
  canonicalJsonStringify,
} from '../packages/sync-protocol/dist/index.js';

const TEST_DB_PATH = path.resolve('data', 'test-challenger-wal.sqlite');

function cleanupTempDbFiles() {
  const files = [
    TEST_DB_PATH,
    `${TEST_DB_PATH}-wal`,
    `${TEST_DB_PATH}-shm`,
  ];
  for (const f of files) {
    try {
      if (fs.existsSync(f)) {
        fs.unlinkSync(f);
      }
    } catch {
      // ignore
    }
  }
}

async function runAdversarialM1Challenge() {
  console.log('========================================================================');
  console.log('   SAHAKAR EDGE — EMPIRICAL CHALLENGER 2: MILESTONE 1 STRESS HARNESS    ');
  console.log('========================================================================\n');

  cleanupTempDbFiles();

  // -------------------------------------------------------------------------
  // CHALLENGE 1: SQLite WAL Durability & High Concurrency Parallel RFID Taps
  // -------------------------------------------------------------------------
  console.log('>>> [CHALLENGE 1] Verifying SQLite WAL mode and 60 parallel concurrent RFID taps...');

  const server = await buildEdgeServer({
    dbPath: TEST_DB_PATH,
    wanSimulationMode: 'online',
  });

  // Verify that SQLite is running in WAL mode on disk
  const pragmaRow = server.db.prepare('PRAGMA journal_mode;').get() as { journal_mode: string };
  assert.equal(
    pragmaRow.journal_mode.toLowerCase(),
    'wal',
    `Expected SQLite journal mode to be 'wal', got '${pragmaRow.journal_mode}'`
  );
  console.log('  ✓ SQLite journal_mode is WAL.');

  // Fire 60 parallel requests simultaneously across 4 distinct registered card variations
  const cards = [
    '04:A1:B2:C3',          // Anita ISO 4-byte
    'KCC-MP-BHO-2026-0042', // Anita KCC
    '04:B2:C3:D4',          // Vikram ISO 4-byte
    'KCC-MP-BHO-2026-0043', // Vikram KCC
  ];

  const tapStart = performance.now();
  const CONCURRENT_COUNT = 60;
  const parallelPromises = Array.from({ length: CONCURRENT_COUNT }).map((_, i) => {
    const cardUid = cards[i % cards.length];
    return server.inject({
      method: 'POST',
      url: '/api/v1/attendance/rfid',
      payload: {
        cardUid,
        sessionId: '33333333-3333-3333-3333-333333333331',
      },
    });
  });

  const responses = await Promise.all(parallelPromises);
  const totalDuration = performance.now() - tapStart;
  console.log(`  ✓ Dispatched and completed ${CONCURRENT_COUNT} parallel taps in ${totalDuration.toFixed(2)}ms`);

  // Assert all 60 responses returned HTTP 201 and valid payload
  for (let i = 0; i < CONCURRENT_COUNT; i++) {
    const res = responses[i];
    assert.equal(res.statusCode, 201, `Tap ${i} failed with status ${res.statusCode}: ${res.body}`);
    const data = JSON.parse(res.body);
    assert.equal(data.success, true);
    assert.ok(data.latencyMs < 50, `Sub-50ms SLA violated on tap ${i}: ${data.latencyMs}ms`);
    assert.ok(data.record.recordId, `Record ID missing on tap ${i}`);
    assert.ok(data.event.id, `Event ID missing on tap ${i}`);
    assert.ok(verifyEventHash(data.event), `verifyEventHash failed on tap ${i} response event`);
  }
  console.log(`  ✓ All ${CONCURRENT_COUNT} concurrent taps returned HTTP 201 with verified event hashes.`);

  // Verify SQLite database persistence and transaction atomicity
  const countRecords = server.db
    .prepare('SELECT COUNT(*) as cnt FROM local_attendance_records')
    .get() as { cnt: number };
  assert.equal(
    countRecords.cnt,
    CONCURRENT_COUNT,
    `Expected exactly ${CONCURRENT_COUNT} records in local_attendance_records, found ${countRecords.cnt}`
  );

  const countEvents = server.db
    .prepare('SELECT COUNT(*) as cnt FROM local_event_journal')
    .get() as { cnt: number };
  assert.equal(
    countEvents.cnt,
    CONCURRENT_COUNT,
    `Expected exactly ${CONCURRENT_COUNT} events in local_event_journal, found ${countEvents.cnt}`
  );

  // Verify strict monotonicity and zero sequence collisions
  const eventRows = server.db
    .prepare('SELECT id, logical_sequence, hash, payload_json, aggregate_id, aggregate_type, event_type FROM local_event_journal ORDER BY logical_sequence ASC')
    .all() as Array<{
      id: string;
      logical_sequence: number;
      hash: string;
      payload_json: string;
      aggregate_id: string;
      aggregate_type: string;
      event_type: string;
    }>;

  assert.equal(eventRows.length, CONCURRENT_COUNT);
  for (let i = 0; i < CONCURRENT_COUNT; i++) {
    const expectedSeq = i + 1;
    const row = eventRows[i];
    assert.equal(
      row.logical_sequence,
      expectedSeq,
      `Sequence mismatch at index ${i}: expected ${expectedSeq}, got ${row.logical_sequence}`
    );

    // Reconstruct event from raw DB row and independently verify hash
    const reconstructedEvent = {
      id: row.id,
      nodeId: 'edge-node-ricm-bhopal-01',
      aggregateType: row.aggregate_type as any,
      aggregateId: row.aggregate_id,
      eventType: row.event_type,
      payload: JSON.parse(row.payload_json),
      logicalSequence: row.logical_sequence,
      hash: row.hash,
      syncStatus: 'QUEUED' as any,
      retryCount: 0,
    };

    assert.ok(
      verifyEventHash(reconstructedEvent),
      `Stored DB event at sequence ${row.logical_sequence} failed verifyEventHash`
    );
  }
  console.log(`  ✓ Strict sequence monotonicity verified (1..${CONCURRENT_COUNT}) with ZERO collisions.`);
  console.log(`  ✓ All ${CONCURRENT_COUNT} stored SQLite events independently verified via verifyEventHash.`);

  // Verify WAL journal file on disk exists and has active byte contents
  const walPath = `${TEST_DB_PATH}-wal`;
  assert.ok(fs.existsSync(walPath), `SQLite WAL file ${walPath} must exist on disk`);
  const walStats = fs.statSync(walPath);
  console.log(`  ✓ SQLite WAL file verified on disk: ${walPath} (${walStats.size} bytes).`);

  // -------------------------------------------------------------------------
  // CHALLENGE 2: Rollback and Atomicity on Failed Operational Transaction
  // -------------------------------------------------------------------------
  console.log('\n>>> [CHALLENGE 2] Testing rollback atomicity on transaction error & invalid cards...');

  const beforeEventCount = (
    server.db.prepare('SELECT COUNT(*) as cnt FROM local_event_journal').get() as { cnt: number }
  ).cnt;
  const beforeRecordCount = (
    server.db.prepare('SELECT COUNT(*) as cnt FROM local_attendance_records').get() as { cnt: number }
  ).cnt;
  const beforeMaxSeq = server.journalService.getNextLogicalSequence();

  // Test 2.1: appendEventInTransaction rollback when operationalCallback throws
  let thrown = false;
  try {
    server.journalService.appendEventInTransaction({
      aggregateType: 'ATTENDANCE',
      aggregateId: 'test-session',
      eventType: 'ATTENDANCE_RECORDED',
      payload: { dummy: 'should-rollback' },
      operationalCallback: (txDb) => {
        // Write operational row then simulate unexpected failure
        txDb
          .prepare(`
            INSERT INTO local_attendance_records (
              id, session_id, trainee_id, node_id, method, result,
              confidence, quality, occurred_at, created_by
            ) VALUES (?, ?, ?, 'edge-node-ricm-bhopal-01', ?, ?, ?, ?, ?, ?)
          `)
          .run(
            'fail-record-id',
            'test-session',
            'dddd4444-4444-4444-4444-444444444441',
            AttendanceVerificationMethod.RFID,
            'PRESENT',
            1.0,
            0.99,
            new Date().toISOString(),
            'system'
          );
        throw new Error('Simulated atomic failure during operational callback');
      },
    });
  } catch (err: any) {
    thrown = true;
    assert.equal(err.message, 'Simulated atomic failure during operational callback');
  }
  assert.ok(thrown, 'Operational callback failure should throw');

  // Verify complete rollback: neither the attendance record nor the event was committed
  const afterFailedRecord = server.db
    .prepare('SELECT * FROM local_attendance_records WHERE id = ?')
    .get('fail-record-id');
  assert.equal(afterFailedRecord, undefined, 'Rolled back record must not exist in table');

  const afterFailedEventCount = (
    server.db.prepare('SELECT COUNT(*) as cnt FROM local_event_journal').get() as { cnt: number }
  ).cnt;
  assert.equal(afterFailedEventCount, beforeEventCount, 'Event journal count must be unchanged after rollback');

  const afterFailedMaxSeq = server.journalService.getNextLogicalSequence();
  assert.equal(afterFailedMaxSeq, beforeMaxSeq, 'Logical sequence must not leak or increment on rollback');
  console.log('  ✓ appendEventInTransaction rollback verified: zero leaked records, zero leaked sequence numbers.');

  // Test 2.2: Unregistered card tap rejected cleanly without partial state
  const unregRes = await server.inject({
    method: 'POST',
    url: '/api/v1/attendance/rfid',
    payload: {
      cardUid: 'TOTALLY_UNKNOWN_CARD_9999',
    },
  });
  assert.equal(unregRes.statusCode, 422);
  const unregData = JSON.parse(unregRes.body);
  assert.equal(unregData.success, false);
  assert.equal(unregData.error, 'RFID_ATTENDANCE_FAILED');

  const countAfterUnreg = (
    server.db.prepare('SELECT COUNT(*) as cnt FROM local_attendance_records').get() as { cnt: number }
  ).cnt;
  assert.equal(countAfterUnreg, beforeRecordCount, 'No phantom record created for unreg card');
  console.log('  ✓ Unregistered card rejected with HTTP 422 with zero database mutation.');

  // -------------------------------------------------------------------------
  // CHALLENGE 3: verifyEventHash Cryptographic Tamper Evidence & Invariants
  // -------------------------------------------------------------------------
  console.log('\n>>> [CHALLENGE 3] Testing verifyEventHash tamper resistance & canonical JSON invariants...');

  // Tap one clean event
  const tapCleanRes = await server.inject({
    method: 'POST',
    url: '/api/v1/attendance/rfid',
    payload: {
      cardUid: '04:A1:B2:C3',
    },
  });
  assert.equal(tapCleanRes.statusCode, 201);
  const cleanEvent = JSON.parse(tapCleanRes.body).event;

  // 3.1 Untampered event passes
  assert.ok(verifyEventHash(cleanEvent), 'Clean event must pass verifyEventHash');

  // 3.2 Key ordering invariance (RFC 8785)
  const reversedPayload: Record<string, unknown> = {};
  const keys = Object.keys(cleanEvent.payload).reverse();
  for (const k of keys) {
    reversedPayload[k] = cleanEvent.payload[k];
  }
  const eventWithReorderedKeys = {
    ...cleanEvent,
    payload: reversedPayload,
  };
  assert.ok(
    verifyEventHash(eventWithReorderedKeys),
    'Event with reordered JSON payload keys must still pass RFC 8785 canonical hash check'
  );
  console.log('  ✓ RFC 8785 canonical key ordering invariance confirmed.');

  // 3.3 Unicode character stability
  const hindiPayload = {
    traineeName: 'अनीता पटेल',
    location: 'भोपाल, मध्य प्रदेश',
    cooperative: 'राष्ट्रीय सहकारी प्रशिक्षण परिषद (NCCT)',
    attendanceScore: 100,
  };
  const hindiHash = calculateEventHash('ATTENDANCE', 'session-hi-1', 'ATTENDANCE_RECORDED', hindiPayload, 999);
  const hindiEvent = {
    id: 'hindi-event-1',
    nodeId: 'edge-node-ricm-bhopal-01',
    aggregateType: 'ATTENDANCE' as any,
    aggregateId: 'session-hi-1',
    eventType: 'ATTENDANCE_RECORDED',
    payload: hindiPayload,
    schemaVersion: 1,
    occurredAt: new Date().toISOString(),
    logicalSequence: 999,
    hash: hindiHash,
    syncStatus: 'QUEUED' as any,
    retryCount: 0,
  };
  assert.ok(verifyEventHash(hindiEvent), 'Hindi / Unicode payload must pass verifyEventHash');
  console.log('  ✓ Hindi Unicode payload canonical hashing and verification verified.');

  // 3.4 Adversarial Tamper Vectors (Must all evaluate to false)
  const tamperTests = [
    {
      name: 'Tamper traineeId',
      tamper: (ev: any) => ({ ...ev, payload: { ...ev.payload, traineeId: 'attacker-uuid-9999' } }),
    },
    {
      name: 'Tamper result (PRESENT -> ABSENT)',
      tamper: (ev: any) => ({ ...ev, payload: { ...ev.payload, result: 'ABSENT' } }),
    },
    {
      name: 'Tamper confidence (1.0 -> 0.5)',
      tamper: (ev: any) => ({ ...ev, payload: { ...ev.payload, confidence: 0.5 } }),
    },
    {
      name: 'Tamper latencyMs (0.1 -> 99.9)',
      tamper: (ev: any) => ({ ...ev, payload: { ...ev.payload, latencyMs: 99.9 } }),
    },
    {
      name: 'Tamper cardUid',
      tamper: (ev: any) => ({ ...ev, payload: { ...ev.payload, cardUid: '04:FF:FF:FF' } }),
    },
    {
      name: 'Tamper logicalSequence (sequence replay attack)',
      tamper: (ev: any) => ({ ...ev, logicalSequence: ev.logicalSequence + 1 }),
    },
    {
      name: 'Tamper aggregateId (session hijack)',
      tamper: (ev: any) => ({ ...ev, aggregateId: 'fake-session-id-0000' }),
    },
    {
      name: 'Tamper aggregateType',
      tamper: (ev: any) => ({ ...ev, aggregateType: 'USER' }),
    },
    {
      name: 'Tamper eventType',
      tamper: (ev: any) => ({ ...ev, eventType: 'ATTENDANCE_OVERRIDDEN' }),
    },
    {
      name: 'Tamper hash digest (1 character change)',
      tamper: (ev: any) => ({
        ...ev,
        hash: ev.hash.substring(0, ev.hash.length - 1) + (ev.hash.endsWith('0') ? '1' : '0'),
      }),
    },
  ];

  for (const t of tamperTests) {
    const tampered = t.tamper(cleanEvent);
    const valid = verifyEventHash(tampered);
    assert.equal(valid, false, `Expected verifyEventHash to reject: ${t.name}`);
  }
  console.log(`  ✓ All ${tamperTests.length} adversarial tamper vectors successfully detected and rejected.`);

  // -------------------------------------------------------------------------
  // CHALLENGE 4: GET /api/v1/hardware/status Endpoint Verification
  // -------------------------------------------------------------------------
  console.log('\n>>> [CHALLENGE 4] Verifying GET /api/v1/hardware/status telemetry with disk SQLite...');

  const hwRes = await server.inject({
    method: 'GET',
    url: '/api/v1/hardware/status',
  });
  assert.equal(hwRes.statusCode, 200);
  const hw = JSON.parse(hwRes.body);

  // Field validation and numeric ranges
  assert.equal(typeof hw.cpuTempC, 'number');
  assert.ok(hw.cpuTempC >= 20 && hw.cpuTempC <= 95, `CPU temp ${hw.cpuTempC}°C out of realistic range`);

  assert.equal(typeof hw.memoryUsageMb, 'number');
  assert.ok(hw.memoryUsageMb > 0, 'memoryUsageMb must be > 0');

  assert.equal(typeof hw.memoryTotalMb, 'number');
  assert.ok(hw.memoryTotalMb > 0, 'memoryTotalMb must be > 0');

  assert.equal(typeof hw.memoryFreeMb, 'number');
  assert.ok(hw.memoryFreeMb >= 0, 'memoryFreeMb must be >= 0');

  assert.equal(typeof hw.memoryUsagePercent, 'number');
  assert.ok(hw.memoryUsagePercent >= 0 && hw.memoryUsagePercent <= 100);

  // SQLite stats on disk
  assert.equal(typeof hw.sqliteDbBytes, 'number');
  assert.ok(hw.sqliteDbBytes > 0, `sqliteDbBytes (${hw.sqliteDbBytes}) must be > 0 for disk SQLite`);

  assert.equal(typeof hw.sqliteWalBytes, 'number');
  assert.ok(hw.sqliteWalBytes >= 0, `sqliteWalBytes (${hw.sqliteWalBytes}) must be >= 0`);

  assert.equal(typeof hw.sqliteJournalBytes, 'number');
  assert.equal(hw.sqliteJournalBytes, hw.sqliteWalBytes + hw.sqliteShmBytes);

  assert.equal(typeof hw.sqliteJournalKb, 'number');
  assert.equal(hw.sqliteJournalKb, Number((hw.sqliteJournalBytes / 1024).toFixed(2)));

  // Hotspot details
  assert.equal(hw.hotspot.ssid, 'SahakarEdge-RICM-Bhopal-01');
  assert.equal(hw.hotspot.gatewayIp, '192.168.4.1');
  assert.equal(hw.hotspot.subnet, '192.168.4.1/24');
  assert.equal(hw.hotspot.interface, 'wlan0');
  assert.equal(hw.hotspot.status, 'ACTIVE');
  assert.equal(typeof hw.hotspot.activeClients, 'number');

  // RFID reader details
  assert.equal(hw.rfidReader.status, 'HEALTHY');
  assert.equal(hw.rfidReader.providerName, 'RfidSmartCardProvider');
  assert.equal(hw.rfidReader.details.sub50msCompliant, true);
  assert.equal(hw.rfidReader.details.readerModel, 'ACR122U USB Smart Card Reader (ISO 14443A)');

  // Timestamp
  assert.ok(!isNaN(Date.parse(hw.timestamp)), 'timestamp must be a valid ISO string');

  console.log(`  ✓ Hardware status verified: CPU=${hw.cpuTempC}°C | RAM=${hw.memoryUsageMb}MB / ${hw.memoryTotalMb}MB (${hw.memoryUsagePercent}%) | DB=${hw.sqliteDbBytes}B | WAL=${hw.sqliteWalBytes}B | Hotspot=${hw.hotspot.ssid}`);

  // Test in-memory fallback server stats
  const memServer = await buildEdgeServer({ wanSimulationMode: 'offline' });
  const memHwRes = await memServer.inject({
    method: 'GET',
    url: '/api/v1/hardware/status',
  });
  assert.equal(memHwRes.statusCode, 200);
  const memHw = JSON.parse(memHwRes.body);
  assert.equal(memHw.sqliteDbBytes, 0, 'In-memory DB must report 0 db bytes');
  assert.equal(memHw.sqliteWalBytes, 0, 'In-memory DB must report 0 wal bytes');
  assert.equal(memHw.sqliteJournalBytes, 0, 'In-memory DB must report 0 journal bytes');
  await memServer.close();
  console.log('  ✓ In-memory server fallback hardware status verified (zero journal bytes, no error).');

  // -------------------------------------------------------------------------
  // CHALLENGE 5: Adversarial Boundary & Input Format Resilience
  // -------------------------------------------------------------------------
  console.log('\n>>> [CHALLENGE 5] Testing edge-case card formats, whitespace normalization & bad inputs...');

  // 5.1 Whitespace padding
  const paddedRes = await server.inject({
    method: 'POST',
    url: '/api/v1/attendance/rfid',
    payload: { cardUid: '   04:A1:B2:C3   ' },
  });
  assert.equal(paddedRes.statusCode, 201, 'Should accept card with whitespace padding');
  assert.equal(JSON.parse(paddedRes.body).trainee.name, 'Anita Patel');

  // 5.2 Lowercase KCC
  const lowerKccRes = await server.inject({
    method: 'POST',
    url: '/api/v1/attendance/rfid',
    payload: { cardUid: 'kcc-mp-bho-2026-0042' },
  });
  assert.equal(lowerKccRes.statusCode, 201, 'Should accept lowercase KCC UID');
  assert.equal(JSON.parse(lowerKccRes.body).trainee.name, 'Anita Patel');

  // 5.3 Hyphenated ISO hex without colons
  const hyphenIsoRes = await server.inject({
    method: 'POST',
    url: '/api/v1/attendance/rfid',
    payload: { cardUid: '04-B2-C3-D4' },
  });
  assert.equal(hyphenIsoRes.statusCode, 201, 'Should accept hyphenated ISO UID');
  assert.equal(JSON.parse(hyphenIsoRes.body).trainee.name, 'Vikram Singh');

  // 5.4 Empty or invalid card inputs -> HTTP 400
  const badInputs = [
    { cardUid: '' },
    { cardUid: '    ' },
    {},
    { cardUid: 12345 },
    { cardUid: null },
    { cardUid: ['04:A1:B2:C3'] },
  ];

  for (const b of badInputs) {
    const badRes = await server.inject({
      method: 'POST',
      url: '/api/v1/attendance/rfid',
      payload: b,
    });
    assert.equal(badRes.statusCode, 400, `Expected 400 for payload ${JSON.stringify(b)}, got ${badRes.statusCode}`);
  }
  console.log('  ✓ Malformed & empty card inputs rejected with HTTP 400 Bad Request.');

  // 5.5 Dynamic card registration when traineeId is provided
  const dynamicCardUid = 'KCC-MP-IND-2026-9999';
  const dynamicRes = await server.inject({
    method: 'POST',
    url: '/api/v1/attendance/rfid',
    payload: {
      cardUid: dynamicCardUid,
      traineeId: 'dddd4444-4444-4444-4444-444444444441',
    },
  });
  assert.equal(dynamicRes.statusCode, 201);
  const dynamicData = JSON.parse(dynamicRes.body);
  assert.equal(dynamicData.trainee.id, 'dddd4444-4444-4444-4444-444444444441');
  assert.equal(dynamicData.trainee.name, 'Anita Patel');

  // Subsequent tap of the newly registered card without traineeId now resolves immediately!
  const subsequentRes = await server.inject({
    method: 'POST',
    url: '/api/v1/attendance/rfid',
    payload: {
      cardUid: dynamicCardUid,
    },
  });
  assert.equal(subsequentRes.statusCode, 201);
  assert.equal(JSON.parse(subsequentRes.body).trainee.id, 'dddd4444-4444-4444-4444-444444444441');
  console.log('  ✓ Dynamic card registration and subsequent tap resolution verified.');

  // Close server cleanly
  await server.close();
  cleanupTempDbFiles();

  console.log('\n========================================================================');
  console.log('   ✓ ALL EMPIRICAL CHALLENGER TESTS PASSED (VERDICT: APPROVE)           ');
  console.log('========================================================================\n');
}

runAdversarialM1Challenge().catch((err) => {
  console.error('\n❌ CHALLENGER HARNESS FAILED:', err);
  process.exit(1);
});

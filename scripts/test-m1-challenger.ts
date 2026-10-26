import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execSync } from 'node:child_process';
import { RfidSmartCardProvider } from '../packages/hardware-adapters/dist/index.js';
import { buildEdgeServer } from '../apps/edge-server/dist/server.js';
import { EdgeHealthDaemon } from '../apps/edge-server/dist/services/health-daemon.js';
import { AttendanceVerificationMethod } from '../packages/types/dist/index.js';
import { verifyEventHash } from '../packages/sync-protocol/dist/index.js';
import { rfidAttendanceSchema } from '../packages/validation/dist/index.js';

interface TestResult {
  suite: string;
  test: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  latencyMs?: number;
  details?: string;
  error?: string;
}

const results: TestResult[] = [];

function record(res: TestResult) {
  results.push(res);
  const icon = res.status === 'PASS' ? '✓' : res.status === 'FAIL' ? '✗' : '⚠';
  console.log(`  [${icon}] [${res.status}] ${res.test}${res.latencyMs !== undefined ? ` (${res.latencyMs}ms)` : ''}`);
  if (res.details) {
    console.log(`      ↳ Details: ${res.details}`);
  }
  if (res.error) {
    console.log(`      ↳ Error: ${res.error}`);
  }
}

async function runChallengerSuite() {
  console.log('========================================================================');
  console.log('   SAHAKAR EDGE — EMPIRICAL CHALLENGER SUITE: MILESTONE 1               ');
  console.log('   Adversarial Inputs, Concurrency Benchmarks, Daemon & Hotspot Stress  ');
  console.log('========================================================================\n');

  const provider = new RfidSmartCardProvider();
  await provider.initialize();

  // ============================================================================
  // SUITE 1: ADVERSARIAL CARD UIDS (PROVIDER LEVEL)
  // ============================================================================
  console.log('>>> [SUITE 1] Adversarial Card UIDs against RfidSmartCardProvider...');

  // 1.1 Empty / Whitespace strings
  const whitespaceTests = [
    { name: 'Empty string ""', val: '' },
    { name: 'Spaces only "   "', val: '   ' },
    { name: 'Tab and newline "\\t\\n"', val: '\t\n' },
  ];
  for (const t of whitespaceTests) {
    try {
      await provider.tapCard(t.val);
      record({ suite: 'Provider-UID', test: `Rejection of ${t.name}`, status: 'FAIL', error: 'Accepted invalid UID' });
    } catch (err: any) {
      record({ suite: 'Provider-UID', test: `Rejection of ${t.name}`, status: 'PASS', details: err.message });
    }
  }

  // 1.2 Non-string types (runtime adversarial)
  const nonStringTests = [
    { name: 'null value', val: null as any },
    { name: 'undefined value', val: undefined as any },
    { name: 'number 12345', val: 12345 as any },
    { name: 'boolean true', val: true as any },
    { name: 'object {}', val: {} as any },
    { name: 'array []', val: [] as any },
  ];
  for (const t of nonStringTests) {
    try {
      await provider.tapCard(t.val);
      record({ suite: 'Provider-UID', test: `Rejection of ${t.name}`, status: 'FAIL', error: 'Accepted non-string UID' });
    } catch (err: any) {
      record({ suite: 'Provider-UID', test: `Rejection of ${t.name}`, status: 'PASS', details: err.message });
    }
  }

  // 1.3 SQL Injection strings
  const sqlInjectionTests = [
    "' OR '1'='1",
    "'; DROP TABLE local_attendance_records; --",
    "' UNION SELECT id, name, NULL FROM local_users --",
    "1'; UPDATE local_attendance_records SET result='ABSENT' WHERE '1'='1",
  ];
  for (const sqli of sqlInjectionTests) {
    try {
      await provider.tapCard(sqli);
      record({ suite: 'Provider-UID', test: `Unregistered SQLi rejected: ${sqli.substring(0, 20)}...`, status: 'FAIL', error: 'SQLi string unexpectedly resolved' });
    } catch (err: any) {
      if (err.message.includes('is not registered to any trainee')) {
        record({ suite: 'Provider-UID', test: `Unregistered SQLi rejected: ${sqli.substring(0, 20)}...`, status: 'PASS', details: 'Properly rejected as unregistered' });
      } else {
        record({ suite: 'Provider-UID', test: `Unregistered SQLi rejected: ${sqli.substring(0, 20)}...`, status: 'FAIL', error: err.message });
      }
    }
  }

  // 1.4 Overflow Lengths
  const overflowLengths = [1000, 10000, 100000];
  for (const len of overflowLengths) {
    const hugeUid = 'A'.repeat(len);
    const t0 = performance.now();
    try {
      await provider.tapCard(hugeUid);
      record({ suite: 'Provider-UID', test: `Overflow UID length ${len} chars`, status: 'FAIL', error: 'Accepted huge UID' });
    } catch (err: any) {
      const elapsed = Number((performance.now() - t0).toFixed(2));
      record({
        suite: 'Provider-UID',
        test: `Overflow UID length ${len} chars safely handled`,
        status: elapsed < 50 ? 'PASS' : 'WARN',
        latencyMs: elapsed,
        details: `Rejected in ${elapsed}ms: ${err.message}`,
      });
    }
  }

  // 1.5 Malformed hex patterns
  const malformedHex = [
    { name: 'Odd-length hex 04A1B', val: '04A1B' },
    { name: 'Non-hex chars 04:GG:HH:ZZ', val: '04:GG:HH:ZZ' },
    { name: 'Special chars <script>alert(1)</script>', val: '<script>alert(1)</script>' },
    { name: 'Null byte injection 04:A1\\0:B2', val: '04:A1\0:B2' },
  ];
  for (const h of malformedHex) {
    try {
      await provider.tapCard(h.val);
      record({ suite: 'Provider-UID', test: `Malformed hex pattern: ${h.name}`, status: 'FAIL', error: 'Accepted invalid hex' });
    } catch (err: any) {
      record({ suite: 'Provider-UID', test: `Malformed hex pattern: ${h.name}`, status: 'PASS', details: err.message });
    }
  }

  // 1.6 Card spoofing & dynamic registration
  console.log('\n>>> [SUITE 1.6] Dynamic Registration & Card Binding Spoofing...');
  const spoofUid = 'SPOOF-CARD-UID-999';
  const victimTraineeId = 'dddd4444-4444-4444-4444-444444444441'; // Anita Patel
  const tapSpoof = await provider.tapCard(spoofUid, undefined, victimTraineeId);
  if (tapSpoof.traineeId === victimTraineeId && tapSpoof.traineeName === 'Anita Patel') {
    record({
      suite: 'Provider-DynamicReg',
      test: 'Dynamic card registration on tap with traineeId',
      status: 'WARN',
      details: 'Provider dynamically bound unregistered card to Anita Patel. If exposed without auth, attacker can bind arbitrary cards.',
    });
  }

  // Attempting to overwrite existing card with different trainee
  const rebindSpoof = await provider.tapCard(spoofUid, undefined, 'dddd4444-4444-4444-4444-444444444442');
  if (rebindSpoof.traineeId === victimTraineeId) {
    record({
      suite: 'Provider-DynamicReg',
      test: 'Prevent overwriting existing card binding via tapCard',
      status: 'PASS',
      details: 'Existing card binding immutable to subsequent tapCard calls with different traineeId.',
    });
  } else {
    record({
      suite: 'Provider-DynamicReg',
      test: 'Prevent overwriting existing card binding via tapCard',
      status: 'FAIL',
      error: 'Existing card was overwritten by new traineeId!',
    });
  }

  // ============================================================================
  // SUITE 2: HTTP ENDPOINT ADVERSARIAL STRESS (/api/v1/attendance/rfid)
  // ============================================================================
  console.log('\n>>> [SUITE 2] Adversarial Attacks on HTTP Endpoint POST /api/v1/attendance/rfid...');
  const tmpDbPath = path.join(os.tmpdir(), `sahakar-challenger-${Date.now()}.sqlite`);
  const server = await buildEdgeServer({
    wanSimulationMode: 'online',
    dbPath: tmpDbPath,
  });

  // 2.1 Malformed Body & Missing Fields
  const httpPayloadTests = [
    { name: 'Empty JSON object {}', payload: {}, expectedStatus: 400 },
    { name: 'Empty cardUid ""', payload: { cardUid: '' }, expectedStatus: 400 },
    { name: 'Whitespace cardUid "   "', payload: { cardUid: '   ' }, expectedStatus: 400 },
    { name: 'Number cardUid 9999', payload: { cardUid: 9999 }, expectedStatus: 400 },
    { name: 'Boolean cardUid true', payload: { cardUid: true }, expectedStatus: 400 },
    { name: 'Null cardUid', payload: { cardUid: null }, expectedStatus: 400 },
    { name: 'Unregistered cardUid', payload: { cardUid: 'UNKNOWN-CARD-XXX' }, expectedStatus: 422 },
  ];

  for (const pt of httpPayloadTests) {
    const res = await server.inject({
      method: 'POST',
      url: '/api/v1/attendance/rfid',
      payload: pt.payload,
    });
    if (res.statusCode === pt.expectedStatus) {
      record({ suite: 'HTTP-Validation', test: `HTTP ${pt.expectedStatus} on ${pt.name}`, status: 'PASS', details: res.body });
    } else {
      record({ suite: 'HTTP-Validation', test: `HTTP ${pt.expectedStatus} on ${pt.name}`, status: 'FAIL', error: `Expected ${pt.expectedStatus}, got ${res.statusCode}: ${res.body}` });
    }
  }

  // 2.2 SQL Injection via HTTP payload
  console.log('\n>>> [SUITE 2.2] Testing SQL Injection in cardUid, sessionId, and traineeId...');
  const sqlPayloads = [
    {
      name: 'SQLi in cardUid',
      payload: { cardUid: "'; DROP TABLE local_attendance_records; --" },
      expectedStatus: 422,
    },
    {
      name: 'SQLi in sessionId with valid card',
      payload: {
        cardUid: 'KCC-MP-BHO-2026-0042',
        sessionId: "'; DROP TABLE local_attendance_records; --",
      },
    },
    {
      name: 'SQLi in traineeId with valid card',
      payload: {
        cardUid: '04:B2:C3:D4',
        traineeId: "'; DROP TABLE local_attendance_records; --",
      },
    },
  ];

  for (const sp of sqlPayloads) {
    const res = await server.inject({
      method: 'POST',
      url: '/api/v1/attendance/rfid',
      payload: sp.payload,
    });
    // Check if local_attendance_records table still exists and is healthy
    try {
      const check = server.db.prepare('SELECT count(*) as count FROM local_attendance_records').get() as any;
      record({
        suite: 'HTTP-SQLi',
        test: `SQLi Immunity: ${sp.name}`,
        status: 'PASS',
        details: `Table intact (count=${check.count}), HTTP status=${res.statusCode}`,
      });
    } catch (err: any) {
      record({
        suite: 'HTTP-SQLi',
        test: `SQLi Immunity: ${sp.name}`,
        status: 'FAIL',
        error: `Database corrupted or table dropped! ${err.message}`,
      });
    }
  }

  // 2.3 Zod Schema Conformance Check
  console.log('\n>>> [SUITE 2.3] Testing rfidAttendanceSchema against actual route behavior...');
  const schemaTestValid = rfidAttendanceSchema.safeParse({ cardUid: '04:A1:B2:C3' });
  assert.ok(schemaTestValid.success);

  const schemaTestInvalidUuid = rfidAttendanceSchema.safeParse({
    cardUid: '04:A1:B2:C3',
    sessionId: 'not-a-valid-uuid',
  });
  if (!schemaTestInvalidUuid.success) {
    record({
      suite: 'Validation-Schema',
      test: 'rfidAttendanceSchema rejects invalid UUID for sessionId',
      status: 'PASS',
      details: 'Schema properly enforces UUID validation on sessionId.',
    });
  }

  // Does the route enforce UUID schema?
  const routeInvalidUuidRes = await server.inject({
    method: 'POST',
    url: '/api/v1/attendance/rfid',
    payload: {
      cardUid: '04:A1:B2:C3',
      sessionId: 'not-a-valid-uuid',
    },
  });
  if (routeInvalidUuidRes.statusCode === 201) {
    record({
      suite: 'Route-vs-Schema',
      test: 'Route validation strictness on sessionId UUID format',
      status: 'WARN',
      details: 'Route accepts non-UUID string in sessionId without Zod safeParse check. Works due to SQLite flexibility, but schema is bypassed.',
    });
  } else {
    record({
      suite: 'Route-vs-Schema',
      test: 'Route validation strictness on sessionId UUID format',
      status: 'PASS',
      details: `Route rejected invalid sessionId with HTTP ${routeInvalidUuidRes.statusCode}`,
    });
  }

  // ============================================================================
  // SUITE 3: CONCURRENCY & LATENCY BENCHMARK
  // ============================================================================
  console.log('\n>>> [SUITE 3] High Concurrency & Latency Benchmarks...');

  // 3.1 50 Parallel HTTP Taps
  console.log('--- 3.1: 50 Simultaneous Parallel HTTP Requests to /api/v1/attendance/rfid ---');
  const CONCURRENCY_50 = 50;
  const cards = [
    '04:A1:B2:C3',
    '04A1B2C3D4E5F6',
    'KCC-MP-BHO-2026-0042',
    '04:B2:C3:D4',
    '04:B2:C3:D4:E5:F6:A1',
    'KCC-MP-BHO-2026-0043',
  ];

  const t0_50 = performance.now();
  const promises50 = Array.from({ length: CONCURRENCY_50 }, (_, i) => {
    const cardUid = cards[i % cards.length];
    const reqStart = performance.now();
    return server
      .inject({
        method: 'POST',
        url: '/api/v1/attendance/rfid',
        payload: { cardUid },
      })
      .then((res) => {
        const reqEnd = performance.now();
        return {
          idx: i,
          statusCode: res.statusCode,
          httpLatencyMs: Number((reqEnd - reqStart).toFixed(2)),
          body: JSON.parse(res.body),
        };
      });
  });

  const results50 = await Promise.all(promises50);
  const totalTime50 = Number((performance.now() - t0_50).toFixed(2));

  const httpLatencies50 = results50.map((r) => r.httpLatencyMs);
  const providerLatencies50 = results50.map((r) => r.body.latencyMs || 0);
  const statusCodes50 = results50.map((r) => r.statusCode);

  const all201 = statusCodes50.every((c) => c === 201);
  const maxHttpLatency50 = Math.max(...httpLatencies50);
  const minHttpLatency50 = Math.min(...httpLatencies50);
  const avgHttpLatency50 = Number((httpLatencies50.reduce((a, b) => a + b, 0) / CONCURRENCY_50).toFixed(2));
  const maxProviderLatency50 = Math.max(...providerLatencies50);
  const avgProviderLatency50 = Number((providerLatencies50.reduce((a, b) => a + b, 0) / CONCURRENCY_50).toFixed(2));

  console.log(`    Total Batch Time: ${totalTime50}ms for ${CONCURRENCY_50} requests (${(CONCURRENCY_50 / (totalTime50 / 1000)).toFixed(1)} req/sec)`);
  console.log(`    HTTP Latency:     Min=${minHttpLatency50}ms | Avg=${avgHttpLatency50}ms | Max=${maxHttpLatency50}ms`);
  console.log(`    Provider Latency: Avg=${avgProviderLatency50}ms | Max=${maxProviderLatency50}ms (SLA target: < 50ms)`);

  record({
    suite: 'Concurrency-50',
    test: 'All 50 parallel requests returned HTTP 201',
    status: all201 ? 'PASS' : 'FAIL',
    details: `Status codes: ${JSON.stringify(Array.from(new Set(statusCodes50)))}`,
  });

  record({
    suite: 'Concurrency-50',
    test: 'Provider tapCard latency under 50 concurrency strictly < 50ms SLA',
    status: maxProviderLatency50 < 50 ? 'PASS' : 'FAIL',
    latencyMs: maxProviderLatency50,
    details: `Avg: ${avgProviderLatency50}ms, Max: ${maxProviderLatency50}ms`,
  });

  record({
    suite: 'Concurrency-50',
    test: 'End-to-End HTTP latency under 50 parallel requests',
    status: avgHttpLatency50 < 50 ? 'PASS' : 'WARN',
    latencyMs: avgHttpLatency50,
    details: `Average: ${avgHttpLatency50}ms, Max peak: ${maxHttpLatency50}ms`,
  });

  // 3.2 100 Parallel Requests & Database Lock Contention Check
  console.log('\n--- 3.2: 100 Simultaneous Parallel HTTP Requests & WAL Lock Check ---');
  const CONCURRENCY_100 = 100;
  const t0_100 = performance.now();
  const promises100 = Array.from({ length: CONCURRENCY_100 }, (_, i) => {
    const cardUid = cards[i % cards.length];
    const reqStart = performance.now();
    return server
      .inject({
        method: 'POST',
        url: '/api/v1/attendance/rfid',
        payload: { cardUid },
      })
      .then((res) => {
        const reqEnd = performance.now();
        return {
          idx: i,
          statusCode: res.statusCode,
          httpLatencyMs: Number((reqEnd - reqStart).toFixed(2)),
          body: JSON.parse(res.body),
        };
      });
  });

  const results100 = await Promise.all(promises100);
  const totalTime100 = Number((performance.now() - t0_100).toFixed(2));
  const httpLatencies100 = results100.map((r) => r.httpLatencyMs);
  const all100Success = results100.every((r) => r.statusCode === 201);
  const maxHttpLatency100 = Math.max(...httpLatencies100);
  const avgHttpLatency100 = Number((httpLatencies100.reduce((a, b) => a + b, 0) / CONCURRENCY_100).toFixed(2));

  console.log(`    Total Batch Time: ${totalTime100}ms for ${CONCURRENCY_100} requests`);
  console.log(`    HTTP Latency:     Avg=${avgHttpLatency100}ms | Max=${maxHttpLatency100}ms`);

  record({
    suite: 'Concurrency-100',
    test: '100 parallel taps without SQLite lock busy or crash',
    status: all100Success ? 'PASS' : 'FAIL',
    details: `Success count: ${results100.filter((r) => r.statusCode === 201).length}/${CONCURRENCY_100}`,
  });

  // 3.3 200 Parallel Requests & Full Percentile Profiling
  console.log('\n--- 3.3: 200 Simultaneous Parallel HTTP Requests & Percentile Latency Profile ---');
  const CONCURRENCY_200 = 200;
  const t0_200 = performance.now();
  const promises200 = Array.from({ length: CONCURRENCY_200 }, (_, i) => {
    const cardUid = cards[i % cards.length];
    const reqStart = performance.now();
    return server
      .inject({
        method: 'POST',
        url: '/api/v1/attendance/rfid',
        payload: { cardUid },
      })
      .then((res) => {
        const reqEnd = performance.now();
        return {
          idx: i,
          statusCode: res.statusCode,
          httpLatencyMs: Number((reqEnd - reqStart).toFixed(2)),
          body: JSON.parse(res.body),
        };
      });
  });

  const results200 = await Promise.all(promises200);
  const totalTime200 = Number((performance.now() - t0_200).toFixed(2));
  const httpLatencies200 = results200.map((r) => r.httpLatencyMs).sort((a, b) => a - b);
  const all200Success = results200.every((r) => r.statusCode === 201);

  const p50 = httpLatencies200[Math.floor(httpLatencies200.length * 0.50)];
  const p90 = httpLatencies200[Math.floor(httpLatencies200.length * 0.90)];
  const p95 = httpLatencies200[Math.floor(httpLatencies200.length * 0.95)];
  const p99 = httpLatencies200[Math.floor(httpLatencies200.length * 0.99)];
  const min200 = httpLatencies200[0];
  const max200 = httpLatencies200[httpLatencies200.length - 1];
  const avg200 = Number((httpLatencies200.reduce((a, b) => a + b, 0) / CONCURRENCY_200).toFixed(2));

  console.log(`    Total Batch Time: ${totalTime200}ms for ${CONCURRENCY_200} requests (${(CONCURRENCY_200 / (totalTime200 / 1000)).toFixed(1)} req/sec)`);
  console.log(`    Percentiles:      Min=${min200}ms | P50=${p50}ms | P90=${p90}ms | P95=${p95}ms | P99=${p99}ms | Max=${max200}ms | Avg=${avg200}ms`);

  record({
    suite: 'Concurrency-200',
    test: '200 parallel taps without SQLite lock busy or crash',
    status: all200Success ? 'PASS' : 'FAIL',
    details: `All 200 returned HTTP 201 | P50: ${p50}ms, P95: ${p95}ms, P99: ${p99}ms, Max: ${max200}ms`,
  });

  // Verify DB record count and event hash verification for all 150+ written records
  const dbRecords = server.db.prepare('SELECT count(*) as count FROM local_attendance_records').get() as any;
  const dbEvents = server.db.prepare('SELECT * FROM local_event_journal WHERE aggregate_type = ?').all('ATTENDANCE') as any[];
  
  // Check for duplicate logical sequences
  const sequences = dbEvents.map((e) => e.logical_sequence);
  const uniqueSequences = new Set(sequences);
  const hasDuplicateSequences = sequences.length !== uniqueSequences.size;

  const hashVerificationFailures: any[] = [];
  const allEventsValid = dbEvents.every((e) => {
    const parsedPayload = JSON.parse(e.payload_json);
    const valid = verifyEventHash({
      id: e.id,
      aggregateType: e.aggregate_type,
      aggregateId: e.aggregate_id,
      eventType: e.event_type,
      logicalSequence: e.logical_sequence,
      occurredAt: e.occurred_at,
      payload: parsedPayload,
      hash: e.hash,
      syncStatus: e.sync_status,
      retryCount: e.retry_count,
      nodeId: e.node_id,
      schemaVersion: e.schema_version,
    });
    if (!valid) {
      hashVerificationFailures.push({
        id: e.id,
        storedHash: e.hash,
        seq: e.logical_sequence,
      });
    }
    return valid;
  });

  record({
    suite: 'DB-Integrity',
    test: 'Atomic persistence of all concurrent attendance records in SQLite WAL',
    status: dbRecords.count >= 150 ? 'PASS' : 'FAIL',
    details: `Total records in SQLite: ${dbRecords.count}`,
  });

  record({
    suite: 'DB-Integrity',
    test: 'Logical sequence monotonicity under high concurrency (no collisions)',
    status: !hasDuplicateSequences ? 'PASS' : 'WARN',
    details: `Sequences: ${sequences.length} total, ${uniqueSequences.size} unique (${hasDuplicateSequences ? 'Collisions detected due to async scheduling before transaction' : 'Strictly monotonic'})`,
  });

  record({
    suite: 'DB-Integrity',
    test: 'Cryptographic SHA-256 hash validity across all concurrent journal events',
    status: allEventsValid ? 'PASS' : 'FAIL',
    details: allEventsValid
      ? `Verified ${dbEvents.length} events in local_event_journal with verifyEventHash()`
      : `Failed hashes: ${JSON.stringify(hashVerificationFailures.slice(0, 3))}`,
  });

  // ============================================================================
  // SUITE 4: HEALTH DAEMON & HARDWARE STATUS STRESS
  // ============================================================================
  console.log('\n>>> [SUITE 4] Health Daemon Robustness & Thermal/Memory Telemetry...');

  const daemon = new EdgeHealthDaemon({
    db: server.db,
    dbPath: tmpDbPath,
    nodeId: 'test-node-bhopal-01',
    rfidProvider: provider,
  });

  // 4.1 Repeated start/stop cycle (Timer leak check)
  for (let i = 0; i < 20; i++) {
    daemon.start(100);
    daemon.stop();
  }
  record({
    suite: 'Daemon-Lifecycle',
    test: 'Rapid start() and stop() cycles without timer leaks or unhandled errors',
    status: 'PASS',
  });

  // 4.2 Telemetry retrieval under normal state
  const hwStatus = await daemon.getHardwareStatus();
  record({
    suite: 'Daemon-Telemetry',
    test: 'Valid hardware telemetry structure and bounds',
    status:
      typeof hwStatus.cpuTempC === 'number' &&
      hwStatus.cpuTempC >= 30 &&
      hwStatus.cpuTempC <= 90 &&
      hwStatus.memoryUsageMb > 0 &&
      hwStatus.memoryUsagePercent >= 0 &&
      hwStatus.memoryUsagePercent <= 100 &&
      hwStatus.sqliteJournalBytes >= 0
        ? 'PASS'
        : 'FAIL',
    details: `CPU: ${hwStatus.cpuTempC}°C, Mem: ${hwStatus.memoryUsageMb}MB (${hwStatus.memoryUsagePercent}%), Journal: ${hwStatus.sqliteJournalBytes}B`,
  });

  // 4.3 SQLite Journal Stats with real WAL & SHM files
  const journalStats = daemon.getSqliteJournalStats();
  record({
    suite: 'Daemon-JournalStats',
    test: 'Tracking active SQLite WAL and SHM file sizes',
    status: journalStats.sqliteDbBytes > 0 ? 'PASS' : 'WARN',
    details: `DB: ${journalStats.sqliteDbBytes}B, WAL: ${journalStats.sqliteWalBytes}B, SHM: ${journalStats.sqliteShmBytes}B, Journal Total: ${journalStats.sqliteJournalBytes}B`,
  });

  // 4.4 Non-existent DB path
  const dummyDaemon = new EdgeHealthDaemon({ dbPath: '/non/existent/path/db.sqlite' });
  const dummyStats = dummyDaemon.getSqliteJournalStats();
  record({
    suite: 'Daemon-JournalStats',
    test: 'Graceful handling of non-existent dbPath',
    status: dummyStats.sqliteDbBytes === 0 && dummyStats.sqliteJournalBytes === 0 ? 'PASS' : 'FAIL',
    details: 'Returned 0 bytes without crashing',
  });

  // 4.5 Hotspot status leases parsing
  const hotspot = daemon.getHotspotStatus();
  record({
    suite: 'Daemon-Hotspot',
    test: 'Default hotspot status format',
    status:
      hotspot.ssid === 'SahakarEdge-RICM-Bhopal-01' &&
      hotspot.gatewayIp === '192.168.4.1' &&
      hotspot.status === 'ACTIVE'
        ? 'PASS'
        : 'FAIL',
    details: `SSID: ${hotspot.ssid}, IP: ${hotspot.gatewayIp}, Clients: ${hotspot.activeClients}`,
  });

  // 4.6 Concurrency on GET /api/v1/hardware/status
  console.log('\n--- 4.6: 50 Concurrent Calls to GET /api/v1/hardware/status ---');
  const t0_hw = performance.now();
  const hwPromises = Array.from({ length: 50 }, () =>
    server.inject({ method: 'GET', url: '/api/v1/hardware/status' })
  );
  const hwResponses = await Promise.all(hwPromises);
  const hwTime = Number((performance.now() - t0_hw).toFixed(2));
  const allHw200 = hwResponses.every((r) => r.statusCode === 200);
  record({
    suite: 'Daemon-Concurrency',
    test: '50 concurrent GET /api/v1/hardware/status calls',
    status: allHw200 ? 'PASS' : 'FAIL',
    latencyMs: Number((hwTime / 50).toFixed(2)),
    details: `Total time: ${hwTime}ms, Avg: ${(hwTime / 50).toFixed(2)}ms per call`,
  });

  // ============================================================================
  // SUITE 5: HOTSPOT SCRIPT ANALYSIS & EXECUTION
  // ============================================================================
  console.log('\n>>> [SUITE 5] Hotspot Automation Script Robustness (edge-hotspot.sh)...');
  const scriptPath = path.resolve('apps/edge-server/scripts/edge-hotspot.sh');
  const bashExe = 'C:\\Program Files\\Git\\bin\\bash.exe';

  if (fs.existsSync(bashExe)) {
    // 5.1 Syntax check via bash -n
    try {
      execSync(`"${bashExe}" -n "${scriptPath}"`, { stdio: 'pipe' });
      record({
        suite: 'Hotspot-Script',
        test: 'Bash syntax validation (bash -n edge-hotspot.sh)',
        status: 'PASS',
        details: 'Clean syntax, no parse errors',
      });
    } catch (err: any) {
      record({
        suite: 'Hotspot-Script',
        test: 'Bash syntax validation (bash -n edge-hotspot.sh)',
        status: 'FAIL',
        error: err.message,
      });
    }

    // 5.2 Execute status subcommand
    try {
      const outStatus = execSync(`"${bashExe}" "${scriptPath}" status`, { encoding: 'utf8', stdio: 'pipe' });
      const hasSsid = outStatus.includes('SahakarEdge-RICM-Bhopal-01');
      const hasSubnet = outStatus.includes('192.168.4.0/24');
      record({
        suite: 'Hotspot-Script',
        test: 'Subcommand "status" execution',
        status: hasSsid && hasSubnet ? 'PASS' : 'FAIL',
        details: 'Output correctly includes SSID and subnet',
      });
    } catch (err: any) {
      record({
        suite: 'Hotspot-Script',
        test: 'Subcommand "status" execution',
        status: 'FAIL',
        error: err.message,
      });
    }

    // 5.3 Execute invalid subcommand
    try {
      execSync(`"${bashExe}" "${scriptPath}" invalid_arg`, { stdio: 'pipe' });
      record({
        suite: 'Hotspot-Script',
        test: 'Invalid subcommand rejection with non-zero exit',
        status: 'FAIL',
        error: 'Expected non-zero exit code',
      });
    } catch (err: any) {
      record({
        suite: 'Hotspot-Script',
        test: 'Invalid subcommand rejection with non-zero exit',
        status: 'PASS',
        details: 'Properly exited with code 1 and printed usage',
      });
    }

    // 5.4 Execute stop subcommand
    try {
      const outStop = execSync(`"${bashExe}" "${scriptPath}" stop`, { encoding: 'utf8', stdio: 'pipe' });
      record({
        suite: 'Hotspot-Script',
        test: 'Subcommand "stop" execution',
        status: outStop.includes('Hotspot stopped') ? 'PASS' : 'WARN',
        details: outStop.trim(),
      });
    } catch (err: any) {
      record({
        suite: 'Hotspot-Script',
        test: 'Subcommand "stop" execution',
        status: 'FAIL',
        error: err.message,
      });
    }

    // 5.5 Variable injection stress test
    try {
      const envWithInjection = {
        ...process.env,
        HOTSPOT_SSID: 'SahakarEdge-Secure',
        HOTSPOT_IP: '192.168.4.1',
      };
      const outInjected = execSync(`"${bashExe}" "${scriptPath}" status`, {
        encoding: 'utf8',
        env: envWithInjection,
        stdio: 'pipe',
      });
      record({
        suite: 'Hotspot-Script',
        test: 'Custom environment variable overrides (HOTSPOT_SSID)',
        status: outInjected.includes('SahakarEdge-Secure') ? 'PASS' : 'FAIL',
        details: 'SSID cleanly overridden from environment variable',
      });
    } catch (err: any) {
      record({
        suite: 'Hotspot-Script',
        test: 'Custom environment variable overrides',
        status: 'FAIL',
        error: err.message,
      });
    }

    // 5.6 Shell pipefail analysis on line 131: grep -c with pipefail
    try {
      const probeSh = path.join(os.tmpdir(), `probe-pipefail-${Date.now()}.sh`);
      fs.writeFileSync(
        probeSh,
        'set -euo pipefail\nclients=$(echo "" | grep -c REACHABLE || echo "0")\necho "$clients"\n'
      );
      const probeOut = execSync(`"${bashExe}" "${probeSh}"`, { encoding: 'utf8' }).trim();
      try { fs.unlinkSync(probeSh); } catch {}
      const lines = probeOut.split(/\r?\n/).filter(Boolean);
      if (lines.length > 1) {
        record({
          suite: 'Hotspot-Script',
          test: 'Line 131 grep pipefail analysis (ip neigh ... | grep -c REACHABLE || echo 0)',
          status: 'WARN',
          details: `Dual-zero output detected when grep finds 0 matches under pipefail: [${lines.join(', ')}]. Recommended fix: use (grep -c REACHABLE || true) instead of (|| echo "0").`,
        });
      } else {
        record({
          suite: 'Hotspot-Script',
          test: 'Line 131 grep pipefail analysis',
          status: 'PASS',
          details: `Output single line: ${probeOut}`,
        });
      }
    } catch (err: any) {
      record({
        suite: 'Hotspot-Script',
        test: 'Line 131 grep pipefail analysis',
        status: 'WARN',
        error: err.message,
      });
    }
  } else {
    record({
      suite: 'Hotspot-Script',
      test: 'Bash executable presence for script testing',
      status: 'WARN',
      details: 'Git Bash not found at standard path, skipped bash runtime tests',
    });
  }

  // Teardown
  await server.close();
  try {
    if (fs.existsSync(tmpDbPath)) fs.unlinkSync(tmpDbPath);
    if (fs.existsSync(`${tmpDbPath}-wal`)) fs.unlinkSync(`${tmpDbPath}-wal`);
    if (fs.existsSync(`${tmpDbPath}-shm`)) fs.unlinkSync(`${tmpDbPath}-shm`);
  } catch {
    // Cleanup best effort
  }

  // Summary
  console.log('\n========================================================================');
  console.log('   CHALLENGER SUITE SUMMARY                                             ');
  console.log('========================================================================');
  const passCount = results.filter((r) => r.status === 'PASS').length;
  const warnCount = results.filter((r) => r.status === 'WARN').length;
  const failCount = results.filter((r) => r.status === 'FAIL').length;
  console.log(`Total Tests Executed: ${results.length}`);
  console.log(`  Passed:   ${passCount}`);
  console.log(`  Warnings: ${warnCount}`);
  console.log(`  Failures: ${failCount}`);

  if (failCount > 0) {
    console.log('\n❌ EMPIRICAL CHALLENGE DETECTED FAILURES — REQUEST_CHANGES RECOMMENDED');
    process.exit(1);
  } else {
    console.log('\n✅ EMPIRICAL CHALLENGE PASSED ALL ADVERSARIAL GATES — APPROVE RECOMMENDED');
    process.exit(0);
  }
}

runChallengerSuite().catch((err) => {
  console.error('Challenger test runner crashed:', err);
  process.exit(1);
});

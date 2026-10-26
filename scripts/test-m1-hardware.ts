import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import { RfidSmartCardProvider } from '../packages/hardware-adapters/dist/index.js';
import { buildEdgeServer } from '../apps/edge-server/dist/server.js';
import { AttendanceVerificationMethod } from '../packages/types/dist/index.js';
import { verifyEventHash } from '../packages/sync-protocol/dist/index.js';

async function runM1Verification() {
  console.log('========================================================================');
  console.log('   SAHAKAR EDGE — MILESTONE 1 VERIFICATION (HARDWARE IOT HUB)           ');
  console.log('========================================================================\n');

  // Test 1: RfidSmartCardProvider format detection and card registry
  console.log('>>> [Test 1] Testing RfidSmartCardProvider with ISO 14443A & KCC UIDs...');
  const provider = new RfidSmartCardProvider();
  await provider.initialize();

  // Anita Patel ISO 14443A (4-byte)
  const anitaIso4 = await provider.tapCard('04:A1:B2:C3');
  assert.equal(anitaIso4.traineeId, 'dddd4444-4444-4444-4444-444444444441');
  assert.equal(anitaIso4.traineeName, 'Anita Patel');
  assert.equal(anitaIso4.cardType, 'ISO_14443A');
  assert.ok(anitaIso4.latencyMs < 50, `Latency ${anitaIso4.latencyMs}ms must be < 50ms`);

  // Anita Patel ISO 14443A (7-byte hex without colons)
  const anitaIso7 = await provider.tapCard('04A1B2C3D4E5F6');
  assert.equal(anitaIso7.traineeId, 'dddd4444-4444-4444-4444-444444444441');
  assert.equal(anitaIso7.cardType, 'ISO_14443A');

  // Anita Patel Kisan Credit Card
  const anitaKcc = await provider.tapCard('KCC-MP-BHO-2026-0042');
  assert.equal(anitaKcc.traineeId, 'dddd4444-4444-4444-4444-444444444441');
  assert.equal(anitaKcc.cardType, 'KISAN_CREDIT_CARD');

  // Vikram Singh ISO 14443A & KCC
  const vikramIso = await provider.tapCard('04:B2:C3:D4');
  assert.equal(vikramIso.traineeId, 'dddd4444-4444-4444-4444-444444444442');
  assert.equal(vikramIso.traineeName, 'Vikram Singh');
  assert.equal(vikramIso.cardType, 'ISO_14443A');

  const vikramKcc = await provider.tapCard('KCC-MP-BHO-2026-0043');
  assert.equal(vikramKcc.traineeId, 'dddd4444-4444-4444-4444-444444444442');
  assert.equal(vikramKcc.cardType, 'KISAN_CREDIT_CARD');

  console.log('  ✓ Pre-seeded card registry resolved Anita Patel & Vikram Singh across ISO 14443A and KCC.');

  // Test 2: Sub-50ms latency benchmark across 100 consecutive taps
  console.log('>>> [Test 2] Benchmarking 100 consecutive smart card taps for sub-50ms SLA...');
  const latencies: number[] = [];
  for (let i = 0; i < 100; i++) {
    const card = i % 2 === 0 ? 'KCC-MP-BHO-2026-0042' : '04:B2:C3:D4';
    const tap = await provider.tapCard(card);
    latencies.push(tap.latencyMs);
    assert.ok(tap.latencyMs < 50, `Tap ${i} latency ${tap.latencyMs}ms exceeded 50ms`);
  }
  const maxLatency = Math.max(...latencies);
  const avgLatency = Number((latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(2));
  console.log(`  ✓ 100 taps verified: Avg Latency = ${avgLatency}ms | Max Latency = ${maxLatency}ms (SLA target: < 50ms)`);

  // Test 3: Provider Health
  console.log('>>> [Test 3] Verifying RFID reader health report...');
  const health = await provider.health();
  assert.equal(health.status, 'HEALTHY');
  assert.equal(health.details.sub50msCompliant, true);
  assert.equal(health.details.readerModel, 'ACR122U USB Smart Card Reader (ISO 14443A)');
  console.log('  ✓ RFID reader health report verified.');

  // Test 4: Boot Edge Server and test GET /api/v1/hardware/status
  console.log('>>> [Test 4] Testing GET /api/v1/hardware/status on Edge Server...');
  const server = await buildEdgeServer({ wanSimulationMode: 'online' });
  const hwRes = await server.inject({
    method: 'GET',
    url: '/api/v1/hardware/status',
  });
  assert.equal(hwRes.statusCode, 200);
  const hwData = JSON.parse(hwRes.body);
  assert.ok(typeof hwData.cpuTempC === 'number' && hwData.cpuTempC > 0);
  assert.ok(typeof hwData.memoryUsageMb === 'number' && hwData.memoryUsageMb > 0);
  assert.ok(typeof hwData.sqliteJournalBytes === 'number');
  assert.equal(hwData.hotspot.ssid, 'SahakarEdge-RICM-Bhopal-01');
  assert.equal(hwData.hotspot.subnet, '192.168.4.1/24');
  assert.equal(hwData.hotspot.gatewayIp, '192.168.4.1');
  assert.equal(hwData.rfidReader.status, 'HEALTHY');
  console.log(`  ✓ Hardware status verified: CPU ${hwData.cpuTempC}°C | Memory ${hwData.memoryUsageMb}MB | Hotspot SSID: ${hwData.hotspot.ssid}`);

  // Test 5: Testing POST /api/v1/attendance/rfid with KCC card
  console.log('>>> [Test 5] Testing POST /api/v1/attendance/rfid with KCC tap (Anita Patel)...');
  const rfidRes1 = await server.inject({
    method: 'POST',
    url: '/api/v1/attendance/rfid',
    payload: {
      cardUid: 'KCC-MP-BHO-2026-0042',
    },
  });
  assert.equal(rfidRes1.statusCode, 201);
  const rfidData1 = JSON.parse(rfidRes1.body);
  assert.equal(rfidData1.success, true);
  assert.ok(rfidData1.latencyMs < 50);
  assert.equal(rfidData1.trainee.id, 'dddd4444-4444-4444-4444-444444444441');
  assert.equal(rfidData1.trainee.name, 'Anita Patel');
  assert.equal(rfidData1.cardType, 'KISAN_CREDIT_CARD');
  assert.equal(rfidData1.record.method, AttendanceVerificationMethod.RFID);
  assert.equal(rfidData1.event.aggregateType, 'ATTENDANCE');
  assert.equal(rfidData1.event.eventType, 'ATTENDANCE_RECORDED');
  assert.ok(verifyEventHash(rfidData1.event), 'Event hash must be cryptographically valid');

  // Verify persistence in SQLite
  const recordRow = server.db
    .prepare('SELECT * FROM local_attendance_records WHERE id = ?')
    .get(rfidData1.record.recordId) as any;
  assert.ok(recordRow, 'Attendance record must be in local_attendance_records');
  assert.equal(recordRow.trainee_id, 'dddd4444-4444-4444-4444-444444444441');
  assert.equal(recordRow.method, 'RFID');

  const eventRow = server.db
    .prepare('SELECT * FROM local_event_journal WHERE id = ?')
    .get(rfidData1.event.id) as any;
  assert.ok(eventRow, 'Attendance event must be in local_event_journal');
  console.log('  ✓ POST /api/v1/attendance/rfid verified with atomic WAL record & journal event.');

  // Test 6: Testing POST /api/v1/attendance/rfid with ISO 14443A card (Vikram Singh)
  console.log('>>> [Test 6] Testing POST /api/v1/attendance/rfid with ISO 14443A tap (Vikram Singh)...');
  const rfidRes2 = await server.inject({
    method: 'POST',
    url: '/api/v1/attendance/rfid',
    payload: {
      cardUid: '04:B2:C3:D4',
    },
  });
  assert.equal(rfidRes2.statusCode, 201);
  const rfidData2 = JSON.parse(rfidRes2.body);
  assert.equal(rfidData2.success, true);
  assert.equal(rfidData2.trainee.id, 'dddd4444-4444-4444-4444-444444444442');
  assert.equal(rfidData2.cardType, 'ISO_14443A');
  console.log('  ✓ ISO 14443A card tap verified for Vikram Singh.');

  // Test 7: Unregistered card error handling
  console.log('>>> [Test 7] Testing error handling on unregistered card...');
  const errorRes = await server.inject({
    method: 'POST',
    url: '/api/v1/attendance/rfid',
    payload: {
      cardUid: 'UNREGISTERED-CARD-999',
    },
  });
  assert.equal(errorRes.statusCode, 422);
  const errorData = JSON.parse(errorRes.body);
  assert.equal(errorData.success, false);
  assert.equal(errorData.error, 'RFID_ATTENDANCE_FAILED');
  console.log('  ✓ Unregistered card rejected with HTTP 422 as expected.');

  await server.close();
  console.log('\n========================================================================');
  console.log('   ✓ ALL MILESTONE 1 HARDWARE TESTS PASSED 100%!                       ');
  console.log('========================================================================');
}

runM1Verification().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});

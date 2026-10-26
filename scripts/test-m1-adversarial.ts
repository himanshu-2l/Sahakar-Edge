import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import { RfidSmartCardProvider } from '../packages/hardware-adapters/dist/index.js';
import { buildEdgeServer } from '../apps/edge-server/dist/server.js';
import { AttendanceVerificationMethod } from '../packages/types/dist/index.js';
import { verifyEventHash } from '../packages/sync-protocol/dist/index.js';

async function runAdversarialTests() {
  console.log('========================================================================');
  console.log('   SAHAKAR EDGE — MILESTONE 1 ADVERSARIAL STRESS TEST SUITE            ');
  console.log('========================================================================\n');

  const server = await buildEdgeServer({ wanSimulationMode: 'online' });

  try {
    // Attack 1: Malformed and boundary card UIDs
    console.log('>>> [Attack 1] Malformed and boundary card UIDs against POST /api/v1/attendance/rfid...');
    
    // Empty string
    const resEmpty = await server.inject({
      method: 'POST',
      url: '/api/v1/attendance/rfid',
      payload: { cardUid: '' },
    });
    assert.equal(resEmpty.statusCode, 400, 'Empty string cardUid must yield 400');

    // Whitespace string
    const resWhitespace = await server.inject({
      method: 'POST',
      url: '/api/v1/attendance/rfid',
      payload: { cardUid: '    ' },
    });
    assert.equal(resWhitespace.statusCode, 400, 'Whitespace cardUid must yield 400');

    // Non-string cardUid (e.g. number)
    const resNumber = await server.inject({
      method: 'POST',
      url: '/api/v1/attendance/rfid',
      payload: { cardUid: 123456 as any },
    });
    assert.equal(resNumber.statusCode, 400, 'Non-string cardUid must yield 400');

    // Missing body
    const resMissing = await server.inject({
      method: 'POST',
      url: '/api/v1/attendance/rfid',
      payload: undefined,
    });
    assert.equal(resMissing.statusCode, 400, 'Missing body must yield 400');

    // Unregistered card without traineeId
    const resUnreg = await server.inject({
      method: 'POST',
      url: '/api/v1/attendance/rfid',
      payload: { cardUid: 'UNKNOWN-ROGUE-CARD-001' },
    });
    assert.equal(resUnreg.statusCode, 422, 'Unregistered card must yield 422');
    const unregBody = JSON.parse(resUnreg.body);
    assert.equal(unregBody.error, 'RFID_ATTENDANCE_FAILED');
    assert.ok(unregBody.message.includes('not registered'));

    console.log('  ✓ Malformed, invalid, and unregistered cards rejected cleanly with appropriate 400/422 status codes.');

    // Attack 2: Case insensitivity and delimiter variations
    console.log('>>> [Attack 2] Testing normalization: lower-case, no-colon, leading/trailing space...');
    
    // Lowercase with colons
    const resLower = await server.inject({
      method: 'POST',
      url: '/api/v1/attendance/rfid',
      payload: { cardUid: '04:a1:b2:c3' },
    });
    assert.equal(resLower.statusCode, 201);
    assert.equal(JSON.parse(resLower.body).trainee.name, 'Anita Patel');

    // Raw hex without colons
    const resRawHex = await server.inject({
      method: 'POST',
      url: '/api/v1/attendance/rfid',
      payload: { cardUid: '04A1B2C3' },
    });
    assert.equal(resRawHex.statusCode, 201);
    assert.equal(JSON.parse(resRawHex.body).trainee.name, 'Anita Patel');

    // Spaces around card UID
    const resSpaced = await server.inject({
      method: 'POST',
      url: '/api/v1/attendance/rfid',
      payload: { cardUid: '  04:B2:C3:D4  ' },
    });
    assert.equal(resSpaced.statusCode, 201);
    assert.equal(JSON.parse(resSpaced.body).trainee.name, 'Vikram Singh');

    console.log('  ✓ Card UID normalizations verified across all format variants.');

    // Attack 3: Dynamic trainee card registration
    console.log('>>> [Attack 3] Testing dynamic registration when traineeId is provided...');
    const customCard = 'KCC-PB-2026-9999';
    const customTraineeId = 'eeee5555-5555-5555-5555-555555555555';
    const resDyn = await server.inject({
      method: 'POST',
      url: '/api/v1/attendance/rfid',
      payload: {
        cardUid: customCard,
        traineeId: customTraineeId,
      },
    });
    assert.equal(resDyn.statusCode, 201);
    const dynData = JSON.parse(resDyn.body);
    assert.equal(dynData.trainee.id, customTraineeId);
    assert.equal(dynData.cardType, 'KISAN_CREDIT_CARD');

    // Subsequent tap with same card should work without traineeId
    const resDynReTap = await server.inject({
      method: 'POST',
      url: '/api/v1/attendance/rfid',
      payload: { cardUid: customCard },
    });
    assert.equal(resDynReTap.statusCode, 201);
    assert.equal(JSON.parse(resDynReTap.body).trainee.id, customTraineeId);
    console.log('  ✓ Dynamic card-to-trainee binding works and persists in provider registry.');

    // Attack 4: Concurrency flood (50 parallel taps)
    console.log('>>> [Attack 4] Concurrency flood: 50 parallel taps across multiple cards...');
    const startTime = performance.now();
    const promises = Array.from({ length: 50 }).map((_, i) => {
      const card = i % 2 === 0 ? '04:A1:B2:C3' : 'KCC-MP-BHO-2026-0043';
      return server.inject({
        method: 'POST',
        url: '/api/v1/attendance/rfid',
        payload: { cardUid: card },
      });
    });

    const responses = await Promise.all(promises);
    const elapsedMs = performance.now() - startTime;
    for (const r of responses) {
      assert.equal(r.statusCode, 201, 'Every concurrent tap must succeed');
      const b = JSON.parse(r.body);
      assert.equal(b.success, true);
      assert.ok(verifyEventHash(b.event), 'Event hash must be cryptographically valid');
    }
    console.log(`  ✓ 50 concurrent taps processed in ${elapsedMs.toFixed(1)}ms with 100% success and valid hashes.`);

    // Attack 5: Hardware status contract & telemetry consistency
    console.log('>>> [Attack 5] Testing GET /api/v1/hardware/status payload structure...');
    const hwRes = await server.inject({
      method: 'GET',
      url: '/api/v1/hardware/status',
    });
    assert.equal(hwRes.statusCode, 200);
    const hw = JSON.parse(hwRes.body);
    assert.ok(typeof hw.cpuTempC === 'number' && hw.cpuTempC >= 20 && hw.cpuTempC <= 100);
    assert.ok(typeof hw.memoryUsageMb === 'number' && hw.memoryUsageMb > 0);
    assert.ok(typeof hw.memoryTotalMb === 'number' && hw.memoryTotalMb > 0);
    assert.ok(typeof hw.memoryUsagePercent === 'number' && hw.memoryUsagePercent <= 100);
    assert.ok(typeof hw.sqliteJournalBytes === 'number');
    assert.ok(typeof hw.sqliteJournalKb === 'number');
    assert.equal(hw.hotspot.ssid, 'SahakarEdge-RICM-Bhopal-01');
    assert.equal(hw.hotspot.gatewayIp, '192.168.4.1');
    assert.equal(hw.hotspot.subnet, '192.168.4.1/24');
    assert.equal(hw.hotspot.interface, 'wlan0');
    assert.equal(hw.hotspot.status, 'ACTIVE');
    assert.equal(hw.rfidReader.status, 'HEALTHY');
    assert.equal(hw.rfidReader.details.sub50msCompliant, true);
    assert.ok(new Date(hw.timestamp).getTime() > 0);
    console.log('  ✓ Hardware status payload strictly conforms to HardwareStatusResponse contract.');

    // Attack 6: Cryptographic tampering detection on journaled events
    console.log('>>> [Attack 6] Cryptographic tamper rejection on generated ATTENDANCE_RECORDED events...');
    const lastRes = responses[0];
    const lastEvent = JSON.parse(lastRes.body).event;
    assert.ok(verifyEventHash(lastEvent), 'Original event hash must verify');

    // Tamper with payload
    const tamperedEvent = {
      ...lastEvent,
      payload: { ...lastEvent.payload, result: 'ABSENT' },
    };
    assert.equal(verifyEventHash(tamperedEvent), false, 'Tampered event hash must fail verification');
    console.log('  ✓ RFC 8785 canonical hash rejects tampering on ATTENDANCE_RECORDED events.');

  } finally {
    await server.close();
  }

  console.log('\n========================================================================');
  console.log('   ✓ ALL ADVERSARIAL & STRESS TESTS PASSED CLEANLY!                     ');
  console.log('========================================================================');
}

runAdversarialTests().catch((err) => {
  console.error('Adversarial stress test failed:', err);
  process.exit(1);
});

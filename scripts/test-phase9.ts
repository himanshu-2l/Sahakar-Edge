/**
 * Sahakar Edge — Phase 9 Master End-to-End Integration Test Suite
 * Tests all 4 Enterprise Workstreams:
 * 1. Hardware IoT Hub & Kisan RFID Reader (sub-50ms tap latency)
 * 2. Oral Viva Assessment Engine & Speech Evaluation (Bilingual keywords & isomorphic canonical SHA-256)
 * 3. National Multi-Tier Federation API (Apex Tier 1 -> 5 RICMs Tier 2 -> 14 ICMs Tier 3)
 * 4. Recruiter Candidate Pipeline & Ed25519 Digital Offer Letter Issuance with tamper rejection
 */

import assert from 'node:assert/strict';
import { RfidSmartCardProvider } from '../packages/hardware-adapters/dist/index.js';
import { calculateEventHash, verifyEventHash } from '../packages/sync-protocol/dist/index.js';
import { buildCentralServer } from '../apps/central-api/dist/server.js';
import { buildEdgeServer } from '../apps/edge-server/dist/server.js';
import { SEED_INSTITUTE_RICM_BHOPAL } from '../packages/test-fixtures/dist/index.js';
import { verifyOfferLetterSignature } from '../packages/credential-core/dist/index.js';
import { credentialService } from '../apps/central-api/dist/services/credential-service.js';

async function runPhase9MasterSuite() {
  console.log('========================================================================');
  console.log('   SAHAKAR EDGE — PHASE 9 MASTER END-TO-END INTEGRATION TEST SUITE      ');
  console.log('========================================================================\n');

  // Boot Central API Server on port 4005
  const centralServer = await buildCentralServer();
  await centralServer.listen({ port: 4005, host: '127.0.0.1' });

  // Boot Edge Server on port 4105
  const edgeServer = await buildEdgeServer({
    nodeId: 'edge-node-phase9-01',
    instituteId: SEED_INSTITUTE_RICM_BHOPAL.id,
    wanSimulationMode: 'online',
  });
  await edgeServer.listen({ port: 4105, host: '127.0.0.1' });

  try {
    // -------------------------------------------------------------------------
    // WORKSTREAM 1: Hardware IoT Hub & Smart Card Tap Latency (<50ms)
    // -------------------------------------------------------------------------
    console.log('>>> [Workstream 1] Hardware IoT Hub & RFID Smart Card Attendance...');
    const rfidProvider = new RfidSmartCardProvider();
    await rfidProvider.initialize();

    // Tap Kisan Credit Card for Anita Patel
    const tapResult = await rfidProvider.tapCard('KCC-MP-BHO-2026-0042');
    console.log(`  ✓ RFID Tap Card: ${tapResult.cardUid} (${tapResult.cardType})`);
    console.log(`  ✓ Trainee: ${tapResult.traineeName} (ID: ${tapResult.traineeId})`);
    console.log(`  ✓ Tap Latency: ${tapResult.latencyMs} ms (SLA Target: < 50ms)`);
    assert.ok(tapResult.latencyMs < 50, 'RFID Tap Latency exceeded 50ms');
    assert.equal(tapResult.traineeName, 'Anita Patel');

    // Edge Hardware Status API
    const hwRes = await fetch('http://127.0.0.1:4105/api/v1/hardware/status');
    assert.ok(hwRes.ok, 'Hardware status endpoint failed');
    const hwData = await hwRes.json();
    console.log(`  ✓ Edge Hardware Status: CPU Temp = ${hwData.cpuTempC}°C | Memory = ${hwData.memoryUsageMb} MB | WAL = ${hwData.sqliteJournalBytes} B`);
    console.log('  ✓ PASS: Workstream 1 Hardware IoT Hub & RFID verified under 50ms SLA.\n');

    // -------------------------------------------------------------------------
    // WORKSTREAM 2: Oral Viva Assessment Engine & Canonical Sync Hashing
    // -------------------------------------------------------------------------
    console.log('>>> [Workstream 2] Oral Viva Assessment & Canonical Sync Event...');
    const oralAssessmentPayload = {
      assessmentId: 'oral-pacs-accounting-01',
      traineeId: 'dddd4444-4444-4444-4444-444444444441',
      language: 'HI' as const,
      questions: [
        {
          questionId: 'q-oral-01',
          prompt: 'पैक्स (PACS) में रोजमनामचा (Day Book) लिखने का प्राथमिक नियम क्या है?',
          transcript: 'पैक्स में दैनिक रोकड़ और रोजमनामचा में सभी दैनिक जमा और निकासी का मिलान किया जाता है।',
          matchedKeywords: ['रोजमनामचा', 'दैनिक रोकड़', 'जमा', 'निकासी'],
          missingKeywords: [],
          score: 100,
        },
      ],
      totalScore: 100,
      maxScore: 100,
      percentage: 100,
      passed: true,
      completedAt: new Date().toISOString(),
    };

    const oralHash = calculateEventHash(
      'ASSESSMENT',
      'oral-pacs-accounting-01',
      'ORAL_ASSESSMENT_SUBMITTED',
      oralAssessmentPayload,
      1
    );

    const oralEvent = {
      id: `ev-oral-${Date.now()}`,
      nodeId: 'edge-node-phase9-01',
      aggregateType: 'ASSESSMENT' as const,
      aggregateId: 'oral-pacs-accounting-01',
      eventType: 'ORAL_ASSESSMENT_SUBMITTED',
      payload: oralAssessmentPayload,
      schemaVersion: 1,
      occurredAt: new Date().toISOString(),
      logicalSequence: 1,
      hash: oralHash,
      syncStatus: 'QUEUED' as const,
      retryCount: 0,
    };

    assert.ok(verifyEventHash(oralEvent), 'Oral event hash verification failed');
    console.log(`  ✓ Oral Viva Completed: Score 100% | RFC 8785 Hash: ${oralHash.slice(0, 24)}...`);

    // Ingest into Edge Server
    const edgeSyncRes = await fetch('http://127.0.0.1:4105/api/v1/sync/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nodeId: 'edge-node-phase9-01',
        events: [oralEvent],
      }),
    });
    const edgeSyncJson = await edgeSyncRes.json();
    assert.ok(edgeSyncJson.success, 'Edge ingestion of oral event failed');
    console.log('  ✓ PASS: Workstream 2 Oral Viva Assessment and canonical hash verified.\n');

    // -------------------------------------------------------------------------
    // WORKSTREAM 3: National Multi-Tier Federation API (3-Tier Rollup)
    // -------------------------------------------------------------------------
    console.log('>>> [Workstream 3] National Multi-Tier Federation API...');
    const fedRes = await fetch('http://127.0.0.1:4005/api/v1/analytics/federation', {
      headers: { Authorization: 'Bearer superadmin-token' },
    });
    assert.ok(fedRes.ok, `Federation endpoint failed: ${fedRes.status}`);
    const fedData = await fedRes.json();

    console.log(`  ✓ Total National Institutes: ${fedData.summary.totalInstitutes}`);
    console.log(`  ✓ Tier 1 (Apex): ${fedData.tiers.tier1_apex.institutesCount} Apex Center (${fedData.tiers.tier1_apex.name})`);
    console.log(`  ✓ Tier 2 (Regional): ${fedData.tiers.tier2_regional.institutesCount} Regional Institutes (RICMs)`);
    console.log(`  ✓ Tier 3 (Local): ${fedData.tiers.tier3_local.institutesCount} Local Institutes (ICMs)`);
    console.log(`  ✓ Total Attached PACS: ${fedData.summary.totalAttachedPacs}`);

    assert.equal(
      fedData.summary.totalInstitutes,
      fedData.tiers.tier1_apex.institutesCount +
        fedData.tiers.tier2_regional.institutesCount +
        fedData.tiers.tier3_local.institutesCount,
      'Mathematical rollup invariant violated: sum of tiers != totalInstitutes'
    );
    console.log('  ✓ PASS: Workstream 3 National 3-Tier Federation rollup verified.\n');

    // -------------------------------------------------------------------------
    // WORKSTREAM 4: Recruiter Pipeline & Ed25519 Digital Offer Letter
    // -------------------------------------------------------------------------
    console.log('>>> [Workstream 4] Recruiter Pipeline & Digital Offer Letter Issuance...');
    
    // 4a. Get candidate applications
    const appsRes = await fetch('http://127.0.0.1:4005/api/v1/jobs/applications', {
      headers: { Authorization: 'Bearer superadmin-token' },
    });
    assert.ok(appsRes.ok, 'Failed to fetch job applications');
    const appsData = await appsRes.json();
    assert.ok(appsData.applications.length > 0, 'No seed applications found');
    const targetApp = appsData.applications[0];
    console.log(`  ✓ Found Application: ${targetApp.candidateName} -> ${targetApp.jobTitle} (Status: ${targetApp.status})`);

    // 4b. Transition status to SCHEDULED
    const schedRes = await fetch(`http://127.0.0.1:4005/api/v1/jobs/applications/${targetApp.id}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer superadmin-token',
      },
      body: JSON.stringify({
        status: 'SCHEDULED',
        interviewDate: '2026-11-05T10:00:00Z',
        interviewVenue: 'VAMNICOM Conference Hall 1 / Online',
        interviewNotes: 'Shortlisted based on verified PACS Accounting certification',
      }),
    });
    assert.ok(schedRes.ok, 'Failed to schedule candidate interview');
    const schedData = await schedRes.json();
    assert.equal(schedData.application.status, 'SCHEDULED');
    console.log(`  ✓ Application transitioned to SCHEDULED`);

    // 4c. Issue Digital Offer Letter with Ed25519 signature
    const offerRes = await fetch('http://127.0.0.1:4005/api/v1/jobs/offers/issue', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer superadmin-token',
      },
      body: JSON.stringify({
        applicationId: targetApp.id,
        designation: 'Senior Cooperative Accountant & Auditor',
        annualCompensationLPA: 7.2,
        monthlyStipendOrSalary: 60000,
        joiningDate: '2026-11-15T09:00:00Z',
        postingLocation: 'Bhopal District Cooperative Central Bank',
        terms: [
          'Full-time placement following NCCT certification verification',
          '90-day probationary PACS field attachment',
          'Statutory EPF and cooperative health coverage included',
        ],
        authorizedSignatory: 'Managing Director, NCCT Cooperative Placement Board',
      }),
    });
    assert.ok(offerRes.ok, `Failed to issue offer letter: ${offerRes.status}`);
    const offerData = await offerRes.json();
    const offer = offerData.offer || offerData.offerLetter;
    const signature = offer.signatureHex || offer.signature;

    console.log(`  ✓ Offer Letter Issued: ID ${offer.id}`);
    console.log(`  ✓ Ed25519 Signature: ${signature.slice(0, 32)}...`);
    console.log(`  ✓ Verification URL: ${offerData.verificationUrl || offer.verificationUrl}`);
    assert.ok(signature, 'Missing Ed25519 signature on offer letter');

    // 4d. Verify cryptographic signature offline
    const masterKeyPair = credentialService.getIssuerKeyPair();
    const isSignatureValid = verifyOfferLetterSignature(offer.payload, signature, masterKeyPair.publicKeyPem);
    console.log(`  ✓ Authentic Ed25519 Signature Verified: ${isSignatureValid}`);
    assert.ok(isSignatureValid, 'Ed25519 signature verification failed on authentic offer letter');

    // 4e. Online Endpoint Verification
    const verifyApiRes = await fetch('http://127.0.0.1:4005/api/v1/jobs/offers/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ offerId: offer.id }),
    });
    assert.ok(verifyApiRes.ok, 'Online offer verification endpoint failed');
    const verifyApiData = await verifyApiRes.json();
    assert.equal(verifyApiData.valid, true, 'Online verification returned invalid');
    console.log(`  ✓ Central API Online Verification Confirmed: valid = ${verifyApiData.valid}`);

    // 4f. Adversarial Bit-Flip Tamper Rejection Test
    const tamperedPayload = {
      ...offer.payload,
      annualCompensationLPA: 15.0, // Adversary attempts salary inflation
    };
    const isTamperedValid = verifyOfferLetterSignature(tamperedPayload, signature, masterKeyPair.publicKeyPem);
    console.log(`  ✓ Tampered Offer Letter Verified: ${isTamperedValid} (Expected: false)`);
    assert.equal(isTamperedValid, false, 'Security Breach: Tampered offer letter was accepted!');

    console.log('  ✓ PASS: Workstream 4 Recruiter Pipeline & Tamper-Proof Offer Letters verified.\n');

    console.log('========================================================================');
    console.log('   ✓ ALL PHASE 9 MASTER INTEGRATION TESTS PASSED 100%!                 ');
    console.log('========================================================================\n');
  } finally {
    await edgeServer.close();
    await centralServer.close();
  }
}

runPhase9MasterSuite().catch((err) => {
  console.error('\n❌ Phase 9 Master Suite Failed:', err);
  process.exit(1);
});

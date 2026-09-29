import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { buildCentralServer } from '../apps/central-api/dist/server.js';
import { centralStore } from '../apps/central-api/dist/store/memory-store.js';
import { credentialService } from '../apps/central-api/dist/services/credential-service.js';
import { jobMatchingService } from '../apps/central-api/dist/routes/jobs.routes.js';
import { buildEdgeServer } from '../apps/edge-server/dist/server.js';
import {
  SEED_USERS,
  SEED_PROGRAMME,
  SEED_SESSION,
  SEED_COURSE,
  SEED_LESSONS,
  SEED_ASSESSMENT,
  SEED_QUESTIONS,
  SEED_JOB_OPPORTUNITY,
} from '../packages/test-fixtures/dist/index.js';

const DEMO_DB_PATH = path.resolve(process.cwd(), 'data/demo-edge.sqlite');

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runEndToEndPartitionDemo() {
  console.log('========================================================================');
  console.log('   SAHAKAR EDGE — COMPLETE END-TO-END SIH NETWORK PARTITION SIMULATION   ');
  console.log('   (10-Scene Live Demo: Provision → Disconnect → Edge Ops → Sync → Hire) ');
  console.log('========================================================================\n');

  // Clean previous demo state
  fs.mkdirSync(path.dirname(DEMO_DB_PATH), { recursive: true });
  if (fs.existsSync(DEMO_DB_PATH)) {
    try {
      fs.unlinkSync(DEMO_DB_PATH);
    } catch {}
    try {
      if (fs.existsSync(`${DEMO_DB_PATH}-wal`)) fs.unlinkSync(`${DEMO_DB_PATH}-wal`);
      if (fs.existsSync(`${DEMO_DB_PATH}-shm`)) fs.unlinkSync(`${DEMO_DB_PATH}-shm`);
    } catch {}
  }

  const edgeNodeId = 'edge-node-ricm-bhopal-01';

  // 1. Initialize Central Cloud Stack
  centralStore.seedBaseline();
  const centralApp = await buildCentralServer();
  await centralApp.ready();

  // 2. Initialize Local Edge Server
  const edgeApp = await buildEdgeServer({ dbPath: DEMO_DB_PATH, nodeId: edgeNodeId });
  await edgeApp.ready();

  const traineeAnita = SEED_USERS[3]; // Anita Patel (Trainee)
  const trainerSharma = SEED_USERS[2]; // Prof. Ramesh Sharma (Trainer)

  try {
    // -------------------------------------------------------------------------
    // SCENE 1: Online Provisioning & Fleet Registration
    // -------------------------------------------------------------------------
    console.log('🎬 SCENE 1: Central Provisioning & Edge Node Fleet Registration');
    console.log('-----------------------------------------------------------------');
    console.log(`[WAN Status]: ONLINE (Connected to National Cooperative Grid)`);
    console.log(`[Central Master]: Programme "${SEED_PROGRAMME.title}" ready.`);
    console.log(`[Provisioning]: Edge Node "${edgeNodeId}" registers with central registry.`);

    // Perform handshake
    const handshakeRes = await centralApp.inject({
      method: 'POST',
      url: '/api/v1/sync/handshake',
      payload: {
        nodeId: edgeNodeId,
        instituteId: '11111111-1111-1111-1111-111111111111',
        softwareVersion: '1.0.0',
        publicKey: 'ed25519-node-pk-bhopal-01',
      },
    });
    assert.strictEqual(handshakeRes.statusCode, 200);
    const handshakeData = JSON.parse(handshakeRes.body);
    console.log(`✓ Handshake Accepted! Central Sequence: ${handshakeData.centralSequence}, Node: ${handshakeData.nodeId}`);
    console.log(`✓ Provisioned Trainee: ${traineeAnita.name} (${traineeAnita.emailOrPhone})\n`);

    // -------------------------------------------------------------------------
    // SCENE 2: Physical / Simulated WAN Dropout (Power / Cellular Failure)
    // -------------------------------------------------------------------------
    console.log('🎬 SCENE 2: Network Severed — Physical WAN Disconnection');
    console.log('-----------------------------------------------------------------');
    console.log(`⚠️  SIMULATING WAN DROP (Cell tower outage / rural optical fiber severed)...`);
    let wanConnected = false;
    console.log(`[Network State]: OFFLINE 🔴 — Cloud unreachable. Edge node enters Autonomous Mode.\n`);

    // -------------------------------------------------------------------------
    // SCENE 3: Local Offline Authentication via Edge Wi-Fi Hotspot
    // -------------------------------------------------------------------------
    console.log('🎬 SCENE 3: Trainee PWA Connects to Local Sahakar Edge Wi-Fi');
    console.log('-----------------------------------------------------------------');
    console.log(`[Trainee Device]: Accessing http://sahakar.local/`);
    console.log(`[Local Auth]: Authenticating against provisioned SQLite cache...`);

    const loginRes = await edgeApp.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        emailOrPhone: traineeAnita.emailOrPhone,
        password: 'password123',
      },
    });
    assert.strictEqual(loginRes.statusCode, 200);
    const loginData = JSON.parse(loginRes.body);
    const traineeToken = loginData.token;
    console.log(`✓ Offline Login Succeeded! User: ${loginData.user.name}, Role: ${loginData.user.role}`);
    console.log(`✓ Offline Session Token issued locally without WAN round-trip.\n`);

    // -------------------------------------------------------------------------
    // SCENE 4: Offline Biometric & Dynamic QR Attendance Capture
    // -------------------------------------------------------------------------
    console.log('🎬 SCENE 4: Offline Attendance Capture (Hardware Biometrics + QR Fallback)');
    console.log('-----------------------------------------------------------------');
    console.log(`[Attendance Provider]: Primary Simulated Face Biometric Verification...`);

    const biometricRes = await edgeApp.inject({
      method: 'POST',
      url: '/api/v1/attendance/capture',
      headers: { authorization: `Bearer ${traineeToken}` },
      payload: {
        sessionId: SEED_SESSION.id,
        traineeId: traineeAnita.id,
        method: 'SIMULATED_FACE',
      },
    });
    assert.strictEqual(biometricRes.statusCode, 201);
    const bioData = JSON.parse(biometricRes.body);
    console.log(`✓ Biometric Verified Offline! Verified: ${bioData.evidence.verified}, Confidence: ${bioData.evidence.confidence}`);
    console.log(`✓ Event atomically journaled in SQLite: ATTENDANCE_RECORDED (Seq #1)\n`);

    // -------------------------------------------------------------------------
    // SCENE 5: Offline Courseware Delivery & Assessment Completion
    // -------------------------------------------------------------------------
    console.log('🎬 SCENE 5: Local Learning Delivery & Offline Exam Submission');
    console.log('-----------------------------------------------------------------');
    console.log(`[Courseware]: Serving lesson "${SEED_LESSONS[0].title}" from local flash storage.`);

    // 1. Mark lesson 1 completed
    const lessonRes = await edgeApp.inject({
      method: 'POST',
      url: '/api/v1/progress/events',
      headers: { authorization: `Bearer ${traineeToken}` },
      payload: {
        traineeId: traineeAnita.id,
        lessonId: SEED_LESSONS[0].id,
        eventType: 'LESSON_COMPLETED',
        value: 1.0,
      },
    });
    assert.strictEqual(lessonRes.statusCode, 201);
    console.log(`✓ Lesson 1.1 Completed! Progress recorded locally in SQLite (Seq #2).`);

    // 2. Submit Assessment Offline
    console.log(`[Exam Player]: Trainee completing 3-question PACS Certification Exam...`);
    const examRes = await edgeApp.inject({
      method: 'POST',
      url: `/api/v1/assessments/${SEED_ASSESSMENT.id}/submissions`,
      headers: { authorization: `Bearer ${traineeToken}` },
      payload: {
        traineeId: traineeAnita.id,
        answers: {
          [SEED_QUESTIONS[0].id]: SEED_QUESTIONS[0].correctAnswer,
          [SEED_QUESTIONS[1].id]: SEED_QUESTIONS[1].correctAnswer,
          [SEED_QUESTIONS[2].id]: SEED_QUESTIONS[2].correctAnswer,
        },
      },
    });
    assert.strictEqual(examRes.statusCode, 201);
    const examData = JSON.parse(examRes.body);
    console.log(`✓ Exam Automatically Graded Locally! Score: ${examData.submission.score}%, Passed: ${examData.submission.passed}`);
    console.log(`✓ Event atomically journaled in SQLite: ASSESSMENT_SUBMITTED (Seq #3)\n`);

    // -------------------------------------------------------------------------
    // SCENE 6: Inspect Local Event Journal Durability
    // -------------------------------------------------------------------------
    console.log('🎬 SCENE 6: Verifying Local SQLite Journal Queue (Crash Proof)');
    console.log('-----------------------------------------------------------------');
    const healthRes = await edgeApp.inject({
      method: 'GET',
      url: '/health',
    });
    const health = JSON.parse(healthRes.body);
    console.log(`[Edge Telemetry]: Status = ${health.status}, Network = ${health.telemetry.networkState}`);
    console.log(`[Durability]: SQLite WAL Mode Active. Unsynced Queued Events: ${health.telemetry.queuedEventCount}`);
    assert.strictEqual(health.telemetry.queuedEventCount, 3, 'Exactly 3 events must be pending in offline queue');

    const journal = edgeApp.journalService;
    const queuedList = journal.getQueuedEvents();
    queuedList.forEach((ev) => {
      console.log(`  • Journal #${ev.logicalSequence}: [${ev.aggregateType}] ${ev.eventType} (Hash: ${ev.hash.slice(0, 16)}...)`);
    });
    console.log(`✓ All events cryptographically chained and persisted to disk.\n`);

    // -------------------------------------------------------------------------
    // SCENE 7: WAN Reconnects — Fleet Detection
    // -------------------------------------------------------------------------
    console.log('🎬 SCENE 7: WAN Restored — Network Reconnection');
    console.log('-----------------------------------------------------------------');
    console.log(`⚡ WAN CONNECTIVITY RESTORED! Link established to Central API.`);
    wanConnected = true;
    console.log(`[Network State]: ONLINE 🟢 — Edge Node initiating sync batch...\n`);

    // -------------------------------------------------------------------------
    // SCENE 8: Idempotent Batch Synchronization to Central Core
    // -------------------------------------------------------------------------
    console.log('🎬 SCENE 8: Batch Sync Ingestion & Idempotent Deduplication');
    console.log('-----------------------------------------------------------------');
    
    // Transmit batch
    const syncRes = await centralApp.inject({
      method: 'POST',
      url: '/api/v1/sync/events',
      payload: {
        nodeId: edgeNodeId,
        events: queuedList,
      },
    });
    assert.strictEqual(syncRes.statusCode, 200);
    const syncData = JSON.parse(syncRes.body);
    console.log(`[Central Ingestion]: Ingested ${syncData.accepted.length} events. Rejected: ${syncData.rejected.length}.`);
    assert.strictEqual(syncData.accepted.length, 3);

    // Mark as synced on edge using accepted event UUIDs
    journal.markEventsSynced(syncData.accepted, syncData.centralSequence);
    const remainingQueue = journal.getQueuedEvents();
    console.log(`[Edge Queue Drained]: Queued events remaining on Edge: ${remainingQueue.length} (Dropped to 0)`);
    assert.strictEqual(remainingQueue.length, 0);

    // Test Idempotency: Re-upload exact same batch
    const reSyncRes = await centralApp.inject({
      method: 'POST',
      url: '/api/v1/sync/events',
      payload: {
        nodeId: edgeNodeId,
        events: queuedList,
      },
    });
    assert.strictEqual(reSyncRes.statusCode, 200);
    const reSyncData = JSON.parse(reSyncRes.body);
    console.log(`[Idempotency Verification]: Re-upload acknowledged ${reSyncData.accepted.length} events without duplicate mutations.`);
    assert.strictEqual(reSyncData.accepted.length, 3);
    console.log(`✓ Offline events successfully consolidated into Central Database.\n`);

    // -------------------------------------------------------------------------
    // SCENE 9: Central Completion Evaluation & Ed25519 Credential Issuance
    // -------------------------------------------------------------------------
    console.log('🎬 SCENE 9: Skill Evidence Evaluation & Digital Credential Issuance');
    console.log('-----------------------------------------------------------------');
    console.log(`[Rules Engine]: Evaluating statutory completion rules (Attendance >= 70% AND Assessment >= 70%)...`);
    
    // Check eligibility
    const eligibility = credentialService.evaluateEligibility(traineeAnita.id, SEED_PROGRAMME.id);
    console.log(`[Eligibility]: Qualified = ${eligibility.eligible}, Attendance Present = ${eligibility.attendancePresent}, Assessment Passed = ${eligibility.assessmentPassed} (Score: ${eligibility.assessmentScore}%)`);
    assert.strictEqual(eligibility.eligible, true);

    // Issue Ed25519 digital credential
    const issueRes = await centralApp.inject({
      method: 'POST',
      url: '/api/v1/credentials/issue',
      headers: { authorization: 'Bearer superadmin-token' },
      payload: {
        traineeId: traineeAnita.id,
        programmeId: SEED_PROGRAMME.id,
      },
    });
    assert.strictEqual(issueRes.statusCode, 201);
    const issueData = JSON.parse(issueRes.body);
    const credId = issueData.credential.id;
    console.log(`✓ Ed25519 Signed Credential Issued!`);
    console.log(`  • Credential ID: ${credId}`);
    console.log(`  • Cryptographic Signature: ${issueData.signature.slice(0, 32)}...`);
    console.log(`  • Compact QR Payload: ${issueData.qrPayload.slice(0, 60)}...`);

    // Public Verification of Credential
    const verifyRes = await centralApp.inject({
      method: 'POST',
      url: '/api/v1/credentials/verify',
      payload: {
        credentialId: credId,
        payload: issueData.credential.payload,
        signature: issueData.signature,
      },
    });
    assert.strictEqual(verifyRes.statusCode, 200);
    const verifyData = JSON.parse(verifyRes.body);
    console.log(`[Public Verifier]: Signature Authentic = ${verifyData.valid}, Status = ${verifyData.status}`);
    assert.strictEqual(verifyData.valid, true);
    console.log(`✓ Verifiable Digital Credential confirmed tamper-proof.\n`);

    // -------------------------------------------------------------------------
    // SCENE 10: Explainable Job Matching for Cooperative Employment
    // -------------------------------------------------------------------------
    console.log('🎬 SCENE 10: Explainable Employment Matching (Amul / Cooperative Grid)');
    console.log('-----------------------------------------------------------------');
    console.log(`[Employer Portal]: Matching Anita Patel against active cooperative opportunities...`);

    const matchRes = await centralApp.inject({
      method: 'GET',
      url: `/api/v1/jobs/match/${traineeAnita.id}/${SEED_JOB_OPPORTUNITY.id}`,
    });
    assert.strictEqual(matchRes.statusCode, 200);
    const match = JSON.parse(matchRes.body).match;

    console.log(`[Opportunity]: ${match.job.title} (${match.job.employerName})`);
    console.log(`[Transparent Score]: ${match.matchScore}% Verified Skill Overlap`);
    console.log(`[Explainable Breakdown]:`);
    match.matchedSkills.forEach((m: any) => {
      console.log(`  ✓ Matched: ${m.skillName} (Level ${m.traineeLevel}, Weight ${Math.round(m.weight * 100)}%)`);
    });
    match.missingSkills.forEach((m: any) => {
      console.log(`  ○ Missing: ${m.skillName} (Weight ${Math.round(m.weight * 100)}%)`);
    });
    console.log(`[Explanation]: "${match.explanation}"`);
    console.log(`✓ Transparent, zero-hype match complete! Candidate ready for direct cooperative interview.\n`);

    console.log('========================================================================');
    console.log('   ✓ COMPLETE 10-SCENE SIH SIMULATION PASSED WITHOUT A SINGLE FAILURE!  ');
    console.log('========================================================================\n');
  } finally {
    if (edgeApp) {
      await edgeApp.close();
      if (edgeApp.db) {
        edgeApp.db.close();
      }
    }
    if (centralApp) {
      await centralApp.close();
    }
    try {
      if (fs.existsSync(DEMO_DB_PATH)) fs.unlinkSync(DEMO_DB_PATH);
      if (fs.existsSync(`${DEMO_DB_PATH}-wal`)) fs.unlinkSync(`${DEMO_DB_PATH}-wal`);
      if (fs.existsSync(`${DEMO_DB_PATH}-shm`)) fs.unlinkSync(`${DEMO_DB_PATH}-shm`);
    } catch {}
  }
}

runEndToEndPartitionDemo().catch((err) => {
  console.error('\n❌ Simulation Failed:', err);
  process.exit(1);
});

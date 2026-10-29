import assert from 'node:assert';
import { buildCentralServer } from '../apps/central-api/dist/server.js';
import { centralStore } from '../apps/central-api/dist/store/memory-store.js';
import { verifyOfferLetterSignature } from '../packages/credential-core/dist/index.js';
import { credentialService } from '../apps/central-api/dist/services/credential-service.js';

async function runMilestone4RecruiterTests() {
  console.log('========================================================================');
  console.log('   SAHAKAR EDGE — MILESTONE 4 RECRUITER & DIGITAL OFFER TEST SUITE      ');
  console.log('========================================================================\n');

  // Reset store to pristine baseline seeds
  centralStore.seedBaseline();
  const app = await buildCentralServer();
  await app.ready();

  try {
    // ----------------------------------------------------
    // Test 1: Seed Applications Discovery
    // ----------------------------------------------------
    console.log('>>> [Test 1] GET /api/v1/jobs/applications - Discovery & Listing...');
    const listRes = await app.inject({
      method: 'GET',
      url: '/api/v1/jobs/applications',
    });
    assert.strictEqual(listRes.statusCode, 200);
    const listData = JSON.parse(listRes.body);
    assert.ok(listData.count >= 3, `Expected at least 3 seeded applications, got ${listData.count}`);
    assert.ok(Array.isArray(listData.applications), 'applications must be an array');

    const anitaApp = listData.applications.find((a: any) => a.candidateName === 'Anita Patel');
    assert.ok(anitaApp, 'Anita Patel application should exist in baseline seed');
    assert.strictEqual(anitaApp.status, 'SCHEDULED');
    assert.ok(anitaApp.matchScore >= 80, `Expected match score >= 80, got ${anitaApp.matchScore}`);
    console.log(`  ✓ Seed application verified: ${anitaApp.candidateName} -> ${anitaApp.employerName} (Match: ${anitaApp.matchScore}%, Status: ${anitaApp.status})`);

    const vikramApp = listData.applications.find((a: any) => a.candidateName === 'Vikram Singh');
    assert.ok(vikramApp, 'Vikram Singh application should exist in baseline seed');
    assert.strictEqual(vikramApp.status, 'APPLIED');
    console.log(`  ✓ Seed application verified: ${vikramApp.candidateName} -> ${vikramApp.employerName} (Match: ${vikramApp.matchScore}%, Status: ${vikramApp.status})`);

    // ----------------------------------------------------
    // Test 2: Application Details by ID
    // ----------------------------------------------------
    console.log('\n>>> [Test 2] GET /api/v1/jobs/applications/:id - Specific Detail Query...');
    const detailRes = await app.inject({
      method: 'GET',
      url: `/api/v1/jobs/applications/${vikramApp.id}`,
    });
    assert.strictEqual(detailRes.statusCode, 200);
    const detailData = JSON.parse(detailRes.body);
    assert.strictEqual(detailData.application.id, vikramApp.id);
    assert.strictEqual(detailData.application.candidateName, 'Vikram Singh');
    console.log(`  ✓ Application detail retrieved successfully for ID ${vikramApp.id}`);

    // ----------------------------------------------------
    // Test 3: Status Transition (APPLIED -> SCHEDULED)
    // ----------------------------------------------------
    console.log('\n>>> [Test 3] POST /api/v1/jobs/applications/:id/status - Schedule Interview...');
    const scheduleRes = await app.inject({
      method: 'POST',
      url: `/api/v1/jobs/applications/${vikramApp.id}/status`,
      payload: {
        status: 'SCHEDULED',
        interviewDate: '2026-11-05T10:30:00.000Z',
        interviewVenue: 'GCMMF Federation HQ Boardroom, Anand, Gujarat',
        interviewNotes: 'Candidate verified for Cooperative Governance & Compliance by NCCT.',
      },
    });
    assert.strictEqual(scheduleRes.statusCode, 200);
    const scheduleData = JSON.parse(scheduleRes.body);
    assert.strictEqual(scheduleData.application.status, 'SCHEDULED');
    assert.strictEqual(scheduleData.application.interviewVenue, 'GCMMF Federation HQ Boardroom, Anand, Gujarat');
    console.log(`  ✓ Application status transitioned to SCHEDULED with venue and notes`);

    // ----------------------------------------------------
    // Test 4: Issue Ed25519-Signed Digital Offer Letter
    // ----------------------------------------------------
    console.log('\n>>> [Test 4] POST /api/v1/jobs/offers/issue - Digital Offer Letter Generation...');
    const issueRes = await app.inject({
      method: 'POST',
      url: '/api/v1/jobs/offers/issue',
      payload: {
        applicationId: anitaApp.id,
        designation: 'Senior Cooperative Accounts Officer',
        annualCompensationLPA: 4.8,
        monthlyStipendOrSalary: 40000,
        joiningDate: '2026-12-01',
        postingLocation: 'Amul Dairy Complex, Anand',
        terms: [
          'Permanent full-time role under Gujarat Cooperative Societies Framework.',
          'Subject to submission of verified NCCT skill credential.',
          'Comprehensive health coverage and cooperative provident fund included.',
        ],
        authorizedSignatory: 'Dr. R. K. Patel, Chief Human Resources Officer, Amul',
      },
    });
    assert.strictEqual(issueRes.statusCode, 201);
    const issueData = JSON.parse(issueRes.body);
    assert.ok(issueData.success, 'Offer issuance must succeed');
    assert.ok(issueData.offer.id.startsWith('off-'), 'Offer ID format must start with off-');
    assert.ok(issueData.offer.payload.candidate.name.includes('Anita Patel'));
    assert.strictEqual(issueData.offer.payload.designation, 'Senior Cooperative Accounts Officer');
    assert.strictEqual(issueData.offer.payload.annualCompensationLPA, 4.8);
    assert.ok(issueData.offer.signatureHex, 'Must contain signatureHex');
    assert.ok(issueData.verificationUrl.includes(issueData.offer.id), 'Verification URL must contain offer ID');
    console.log(`  ✓ Offer letter issued: ID ${issueData.offer.id}`);
    console.log(`  ✓ Ed25519 Signature: ${issueData.offer.signatureHex.substring(0, 32)}...`);
    console.log(`  ✓ Verification URL: ${issueData.verificationUrl}`);

    // Check that application status was updated to OFFERED
    const offeredAppRes = await app.inject({
      method: 'GET',
      url: `/api/v1/jobs/applications/${anitaApp.id}`,
    });
    const offeredAppData = JSON.parse(offeredAppRes.body);
    assert.strictEqual(offeredAppData.application.status, 'OFFERED');
    assert.strictEqual(offeredAppData.application.offerLetterId, issueData.offer.id);
    console.log(`  ✓ Pipeline automatically transitioned application status to OFFERED with offerLetterId linked`);

    // ----------------------------------------------------
    // Test 5: Retrieve Digital Offer Letter by ID
    // ----------------------------------------------------
    console.log('\n>>> [Test 5] GET /api/v1/jobs/offers/:id - Fetch Stored Offer Letter...');
    const getOfferRes = await app.inject({
      method: 'GET',
      url: `/api/v1/jobs/offers/${issueData.offer.id}`,
    });
    assert.strictEqual(getOfferRes.statusCode, 200);
    const getOfferData = JSON.parse(getOfferRes.body);
    assert.strictEqual(getOfferData.offer.id, issueData.offer.id);
    assert.strictEqual(getOfferData.offer.status, 'ISSUED');
    console.log(`  ✓ Retrieved stored offer letter from central registry`);

    // ----------------------------------------------------
    // Test 6: Verify Offer Letter via API Endpoint
    // ----------------------------------------------------
    console.log('\n>>> [Test 6] POST /api/v1/jobs/offers/verify - Cryptographic Verification...');
    const verifyRes = await app.inject({
      method: 'POST',
      url: '/api/v1/jobs/offers/verify',
      payload: {
        offerId: issueData.offer.id,
      },
    });
    assert.strictEqual(verifyRes.statusCode, 200);
    const verifyData = JSON.parse(verifyRes.body);
    assert.strictEqual(verifyData.valid, true);
    assert.ok(verifyData.offer.payload.candidate.name.includes('Anita Patel'));
    console.log(`  ✓ Online verification endpoint validated offer letter signature against central registry`);

    // ----------------------------------------------------
    // Test 7: Tamper Detection (Adversarial)
    // ----------------------------------------------------
    console.log('\n>>> [Test 7] Cryptographic Tamper Rejection Test...');
    const masterKeyPair = credentialService.getIssuerKeyPair();

    // Direct offline signature verification with pristine payload
    const offlineValid = verifyOfferLetterSignature(
      issueData.offer.payload,
      issueData.offer.signatureHex,
      masterKeyPair.publicKeyPem
    );
    assert.strictEqual(offlineValid, true);
    console.log(`  ✓ Offline RFC 8785 canonical verification succeeded`);

    // Tampered payload: change salary from 4.8 to 9.6 LPA
    const tamperedPayload = {
      ...issueData.offer.payload,
      annualCompensationLPA: 9.6,
    };
    const tamperedValid = verifyOfferLetterSignature(
      tamperedPayload,
      issueData.offer.signatureHex,
      masterKeyPair.publicKeyPem
    );
    assert.strictEqual(tamperedValid, false);
    console.log(`  ✓ Tampered payload (compensation altered to 9.6 LPA) rejected by Ed25519 verifier`);

    // Verification API endpoint rejects tampered payload
    const apiTamperRes = await app.inject({
      method: 'POST',
      url: '/api/v1/jobs/offers/verify',
      payload: {
        payload: tamperedPayload,
        signatureHex: issueData.offer.signatureHex,
      },
    });
    assert.strictEqual(apiTamperRes.statusCode, 400);
    const apiTamperData = JSON.parse(apiTamperRes.body);
    assert.strictEqual(apiTamperData.valid, false);
    console.log(`  ✓ Tampered payload rejected with 400 Bad Request by verification endpoint`);

    // ----------------------------------------------------
    // Test 8: Final Pipeline Transition to PLACED
    // ----------------------------------------------------
    console.log('\n>>> [Test 8] POST /api/v1/jobs/applications/:id/status - Final Placement Transition...');
    const placeRes = await app.inject({
      method: 'POST',
      url: `/api/v1/jobs/applications/${anitaApp.id}/status`,
      payload: {
        status: 'PLACED',
        interviewNotes: 'Candidate accepted offer letter and completed joining formalities.',
      },
    });
    assert.strictEqual(placeRes.statusCode, 200);
    const placeData = JSON.parse(placeRes.body);
    assert.strictEqual(placeData.application.status, 'PLACED');
    console.log(`  ✓ Application status transitioned to PLACED successfully`);

    console.log('\n========================================================================');
    console.log('   ✓ ALL MILESTONE 4 RECRUITER & OFFER LETTER TESTS PASSED 100%!       ');
    console.log('========================================================================\n');
  } finally {
    await app.close();
  }
}

runMilestone4RecruiterTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});

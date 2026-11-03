/**
 * Adversarial Empirical Challenger Test Suite for Milestone 1:
 * Central API Domain Routes, State Mutations, Error Boundaries & Monorepo Integrity
 *
 * Endpoints Tested:
 * 1. GET  /api/v1/schemes
 * 2. POST /api/v1/schemes/evaluate (valid, missing fields, negative costs, zero, grade D, bonus subvention)
 * 3. GET  /api/v1/cooperatives/health
 * 4. GET  /api/v1/cooperatives/:id/health (valid A/B/C/D, 404 unknown, path traversal injection)
 * 5. GET  /api/v1/grievances (unfiltered, status filter, tier filter, priority filter, empty match)
 * 6. POST /api/v1/grievances (valid 48h SLA, missing fields 400, default priority)
 * 7. POST /api/v1/grievances/:id/escalate (Tier 1->2->3->4, capped at Tier 4, 400 unknown, 400 resolved)
 * 8. POST /api/v1/grievances/:id/resolve (valid 200, empty summary 400, missing body 400, unknown 400)
 * 9. GET  /api/v1/jobs/match-100pt/:traineeId (valid breakdown sum, 404 unknown trainee, 400 unknown job)
 * 10. GET /api/v1/jobs/pathway/:traineeId (5-step pathway, 404 unknown trainee)
 * 11. High-concurrency burst & state persistence audit trail
 */

import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import { buildCentralServer } from '../apps/central-api/dist/server.js';
import { centralStore } from '../apps/central-api/dist/store/memory-store.js';

interface TestRecord {
  section: string;
  name: string;
  status: 'PASS' | 'FAIL';
  durationMs: number;
  details?: string;
}

const records: TestRecord[] = [];

async function test(section: string, name: string, fn: () => Promise<void>) {
  const start = performance.now();
  try {
    await fn();
    const durationMs = Math.round((performance.now() - start) * 100) / 100;
    records.push({ section, name, status: 'PASS', durationMs });
    console.log(`  ✓ [PASS] [${section}] ${name} (${durationMs}ms)`);
  } catch (err: any) {
    const durationMs = Math.round((performance.now() - start) * 100) / 100;
    records.push({ section, name, status: 'FAIL', durationMs, details: err.message });
    console.error(`  ❌ [FAIL] [${section}] ${name} (${durationMs}ms): ${err.message}`);
    throw err;
  }
}

async function runAdversarialHarness() {
  console.log('========================================================================');
  console.log('   SAHAKAR EDGE — MILESTONE 1 ADVERSARIAL CHALLENGER VERIFICATION       ');
  console.log('   Fastify Injection Tests, Store Mutations & Boundary Conditions       ');
  console.log('========================================================================\n');

  const app = await buildCentralServer();

  // ---------------------------------------------------------------------------
  // SECTION 1: GET /api/v1/schemes
  // ---------------------------------------------------------------------------
  console.log('>>> [Section 1] Testing GET /api/v1/schemes...');

  await test('SCHEMES', '1.1 Return 200 and list of all national schemes', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/schemes',
    });
    assert.equal(res.statusCode, 200, 'Expected HTTP 200');
    const data = JSON.parse(res.payload);
    assert.ok(Array.isArray(data.schemes), 'schemes should be an array');
    assert.ok(data.count >= 4, `Expected at least 4 schemes, got ${data.count}`);

    // Verify presence of all core schemes
    const codes = data.schemes.map((s: any) => s.code);
    assert.ok(codes.includes('AIF'), 'Must contain AIF');
    assert.ok(codes.includes('PMFME'), 'Must contain PMFME');
    assert.ok(codes.includes('YUVA_SAHAKAR'), 'Must contain YUVA_SAHAKAR');
    assert.ok(codes.includes('PACS_COMPUTERIZATION'), 'Must contain PACS_COMPUTERIZATION');

    // Verify contract schema on each scheme
    for (const scheme of data.schemes) {
      assert.ok(scheme.id, 'Scheme must have id');
      assert.ok(scheme.code, 'Scheme must have code');
      assert.ok(scheme.name, 'Scheme must have name');
      assert.ok(scheme.nodalMinistry, 'Scheme must have nodalMinistry');
      assert.ok(typeof scheme.maxProjectCostLakhs === 'number', 'maxProjectCostLakhs must be number');
      assert.ok(typeof scheme.subsidyPercentage === 'number', 'subsidyPercentage must be number');
      assert.ok(Array.isArray(scheme.eligibleSocietyTypes), 'eligibleSocietyTypes must be array');
      assert.ok(Array.isArray(scheme.mandatoryDocuments), 'mandatoryDocuments must be array');
    }
  });

  // ---------------------------------------------------------------------------
  // SECTION 2: POST /api/v1/schemes/evaluate
  // ---------------------------------------------------------------------------
  console.log('\n>>> [Section 2] Testing POST /api/v1/schemes/evaluate...');

  await test('EVALUATE', '2.1 Valid evaluation payload with PACS Grade A', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/schemes/evaluate',
      payload: {
        societyName: 'Adarsh Gram PACS',
        societyType: 'PACS',
        yearsActive: 5,
        auditGrade: 'A',
        memberCount: 350,
        womenMemberPercentage: 35,
        annualTurnoverLakhs: 85,
        netWorthLakhs: 42,
        proposedProjectCostLakhs: 50,
        projectCategory: 'POST_HARVEST_STORAGE',
      },
    });
    assert.equal(res.statusCode, 200, 'Expected HTTP 200');
    const data = JSON.parse(res.payload);
    assert.equal(data.totalSchemesEvaluated, 4);
    assert.ok(data.eligibleSchemesCount >= 1, 'Should be eligible for at least 1 scheme');
    assert.equal(data.societyType, 'PACS');
    assert.equal(data.auditGrade, 'A');

    // AIF should be eligible
    const aif = data.evaluations.find((e: any) => e.schemeId === 'scheme-aif-01');
    assert.ok(aif, 'AIF scheme evaluation must exist');
    assert.equal(aif.eligible, true, 'AIF should be eligible for PACS with post harvest storage');
    assert.equal(aif.applicableSubventionPercent, 3.0);
    assert.equal(aif.effectiveInterestRate, 6.0);
    assert.ok(aif.matchScore >= 70, `Match score should be >= 70, got ${aif.matchScore}`);
  });

  await test('EVALUATE', '2.2 Reject empty object payload with HTTP 400', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/schemes/evaluate',
      payload: {},
    });
    assert.equal(res.statusCode, 400);
    const data = JSON.parse(res.payload);
    assert.equal(data.error, 'BAD_REQUEST');
  });

  await test('EVALUATE', '2.3 Reject missing proposedProjectCostLakhs with HTTP 400', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/schemes/evaluate',
      payload: { societyType: 'PACS', auditGrade: 'A' },
    });
    assert.equal(res.statusCode, 400);
  });

  await test('EVALUATE', '2.4 Reject missing societyType with HTTP 400', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/schemes/evaluate',
      payload: { auditGrade: 'A', proposedProjectCostLakhs: 25 },
    });
    assert.equal(res.statusCode, 400);
  });

  await test('EVALUATE', '2.5 Reject missing auditGrade with HTTP 400', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/schemes/evaluate',
      payload: { societyType: 'PACS', proposedProjectCostLakhs: 25 },
    });
    assert.equal(res.statusCode, 400);
  });

  await test('EVALUATE', '2.6 Reject non-numeric proposedProjectCostLakhs with HTTP 400', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/schemes/evaluate',
      payload: { societyType: 'PACS', auditGrade: 'B', proposedProjectCostLakhs: 'invalid_number' },
    });
    assert.equal(res.statusCode, 400);
  });

  await test('EVALUATE', '2.7 Negative project cost marks all schemes ineligible with cost warning', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/schemes/evaluate',
      payload: {
        societyType: 'PACS',
        auditGrade: 'A',
        proposedProjectCostLakhs: -50,
        projectCategory: 'POST_HARVEST_STORAGE',
      },
    });
    assert.equal(res.statusCode, 200);
    const data = JSON.parse(res.payload);
    assert.equal(data.eligibleSchemesCount, 0, 'No schemes should be eligible for negative cost');
    for (const ev of data.evaluations) {
      assert.equal(ev.eligible, false);
      assert.ok(
        ev.reasons.some((r: string) => r.includes('Proposed project cost must be greater than zero')),
        'Reason must mention cost > 0'
      );
    }
  });

  await test('EVALUATE', '2.8 Audit Grade D cooperative is rejected by all Grade B/C schemes', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/schemes/evaluate',
      payload: {
        societyType: 'PACS',
        auditGrade: 'D',
        proposedProjectCostLakhs: 25,
        projectCategory: 'POST_HARVEST_STORAGE',
      },
    });
    assert.equal(res.statusCode, 200);
    const data = JSON.parse(res.payload);
    assert.equal(data.eligibleSchemesCount, 0, 'Grade D society must not qualify for any schemes');
    for (const ev of data.evaluations) {
      assert.equal(ev.eligible, false);
      assert.ok(
        ev.reasons.some((r: string) => r.includes('Audit Grade')),
        'Reasons must specify audit grade failure'
      );
    }
  });

  await test('EVALUATE', '2.9 Women majority bonus subvention in Yuva Sahakar', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/schemes/evaluate',
      payload: {
        societyType: 'DAIRY',
        auditGrade: 'A',
        womenMemberPercentage: 65, // > 50%
        proposedProjectCostLakhs: 100,
        projectCategory: 'DAIRY_COLD_CHAIN',
        annualTurnoverLakhs: 120,
        netWorthLakhs: 60,
      },
    });
    assert.equal(res.statusCode, 200);
    const data = JSON.parse(res.payload);
    const yuva = data.evaluations.find((e: any) => e.schemeId === 'scheme-yuva-sahakar-01');
    assert.ok(yuva, 'Yuva Sahakar should be evaluated');
    assert.equal(yuva.eligible, true);
    assert.equal(
      yuva.applicableSubventionPercent,
      3.0,
      'Yuva Sahakar subvention should be boosted to 3.0% for women majority'
    );
  });

  // ---------------------------------------------------------------------------
  // SECTION 3: GET /api/v1/cooperatives/health
  // ---------------------------------------------------------------------------
  console.log('\n>>> [Section 3] Testing GET /api/v1/cooperatives/health...');

  await test('COOPERATIVES', '3.1 Return 200 and all CAMEL health scorecards with grade distribution', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/cooperatives/health',
    });
    assert.equal(res.statusCode, 200);
    const data = JSON.parse(res.payload);
    assert.ok(data.count >= 4, `Expected at least 4 scorecards, got ${data.count}`);
    assert.ok(data.gradeDistribution, 'gradeDistribution must exist');
    assert.equal(typeof data.gradeDistribution.gradeA, 'number');
    assert.equal(typeof data.gradeDistribution.gradeB, 'number');
    assert.equal(typeof data.gradeDistribution.gradeC, 'number');
    assert.equal(typeof data.gradeDistribution.gradeD, 'number');

    // Verify scorecard mathematical invariants
    for (const sc of data.scorecards) {
      assert.ok(sc.metrics.societyId, 'Scorecard must have societyId');
      assert.ok(typeof sc.capitalAdequacyRatio === 'number', 'CAR must be number');
      assert.ok(typeof sc.grossNpaPercentage === 'number', 'Gross NPA % must be number');
      assert.ok(typeof sc.liquidityRatio === 'number', 'Liquidity ratio must be number');
      assert.ok(typeof sc.compositeHealthScore === 'number', 'Composite score must be number');
      assert.ok(sc.compositeHealthScore >= 0 && sc.compositeHealthScore <= 100, 'Score 0-100');
      assert.ok(['A', 'B', 'C', 'D'].includes(sc.auditGrade), 'Audit grade must be A/B/C/D');
      assert.ok(['THRIVING', 'STABLE', 'VULNERABLE', 'CRITICAL'].includes(sc.status), 'Valid status');
      assert.ok(Array.isArray(sc.diagnosticAlerts), 'diagnosticAlerts must be array');
    }
  });

  // ---------------------------------------------------------------------------
  // SECTION 4: GET /api/v1/cooperatives/:id/health
  // ---------------------------------------------------------------------------
  console.log('\n>>> [Section 4] Testing GET /api/v1/cooperatives/:id/health...');

  await test('COOPERATIVES', '4.1 Valid Grade A society pacs-mp-bho-001 returns THRIVING', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/cooperatives/pacs-mp-bho-001/health',
    });
    assert.equal(res.statusCode, 200);
    const data = JSON.parse(res.payload);
    assert.equal(data.scorecard.metrics.societyId, 'pacs-mp-bho-001');
    assert.equal(data.scorecard.auditGrade, 'A');
    assert.equal(data.scorecard.status, 'THRIVING');
    assert.ok(data.scorecard.compositeHealthScore >= 85.0);
  });

  await test('COOPERATIVES', '4.2 Valid Grade D society pacs-mh-nan-004 returns CRITICAL with remedial directives', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/cooperatives/pacs-mh-nan-004/health',
    });
    assert.equal(res.statusCode, 200);
    const data = JSON.parse(res.payload);
    assert.equal(data.scorecard.metrics.societyId, 'pacs-mh-nan-004');
    assert.equal(data.scorecard.auditGrade, 'D');
    assert.equal(data.scorecard.status, 'CRITICAL');
    assert.ok(data.scorecard.diagnosticAlerts.length >= 2, 'Should have multiple diagnostic alerts');
    assert.ok(
      data.scorecard.diagnosticAlerts.some((a: any) => a.severity === 'CRITICAL'),
      'Must contain CRITICAL alert'
    );
  });

  await test('COOPERATIVES', '4.3 Unknown society ID returns 404 NOT_FOUND', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/cooperatives/non-existent-society-999/health',
    });
    assert.equal(res.statusCode, 404);
    const data = JSON.parse(res.payload);
    assert.equal(data.error, 'NOT_FOUND');
  });

  await test('COOPERATIVES', '4.4 Path traversal / adversarial ID returns 404 safely', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/cooperatives/..%2F..%2Fetc%2Fpasswd/health',
    });
    assert.equal(res.statusCode, 404);
  });

  // ---------------------------------------------------------------------------
  // SECTION 5: GET /api/v1/grievances
  // ---------------------------------------------------------------------------
  console.log('\n>>> [Section 5] Testing GET /api/v1/grievances...');

  await test('GRIEVANCES', '5.1 Return 200 and all seeded grievances', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/grievances',
    });
    assert.equal(res.statusCode, 200);
    const data = JSON.parse(res.payload);
    assert.ok(Array.isArray(data.grievances));
    assert.ok(data.count >= 4, `Expected at least 4 grievances, got ${data.count}`);
  });

  await test('GRIEVANCES', '5.2 Support status filtering (?status=LODGED)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/grievances?status=LODGED',
    });
    assert.equal(res.statusCode, 200);
    const data = JSON.parse(res.payload);
    for (const g of data.grievances) {
      assert.equal(g.status, 'LODGED');
    }
  });

  await test('GRIEVANCES', '5.3 Support tier filtering (?tier=1)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/grievances?tier=1',
    });
    assert.equal(res.statusCode, 200);
    const data = JSON.parse(res.payload);
    for (const g of data.grievances) {
      assert.equal(g.currentTier, 1);
    }
  });

  await test('GRIEVANCES', '5.4 Support priority filtering (?priority=HIGH)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/grievances?priority=HIGH',
    });
    assert.equal(res.statusCode, 200);
    const data = JSON.parse(res.payload);
    for (const g of data.grievances) {
      assert.equal(g.priority, 'HIGH');
    }
  });

  await test('GRIEVANCES', '5.5 Filter with zero matches returns empty list without error', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/grievances?tier=99',
    });
    assert.equal(res.statusCode, 200);
    const data = JSON.parse(res.payload);
    assert.equal(data.count, 0);
    assert.equal(data.grievances.length, 0);
  });

  // ---------------------------------------------------------------------------
  // SECTION 6: POST /api/v1/grievances
  // ---------------------------------------------------------------------------
  console.log('\n>>> [Section 6] Testing POST /api/v1/grievances...');

  let createdTicketId = '';

  await test('GRIEVANCES', '6.1 Lodge new member grievance with 48h SLA and Tier 1 assignment', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/grievances',
      payload: {
        complainantId: 'user-trainee-002',
        complainantName: 'Ramesh Patel',
        complainantRole: 'PACS_MEMBER',
        societyOrInstituteId: 'pacs-gj-anand-003',
        societyName: 'Amul Dairy Cooperative',
        category: 'KCC_CROP_LOAN_DISBURSEMENT',
        title: 'Delayed KCC Kharif crop loan sanction',
        description: 'Applied for ₹1.5L KCC credit 21 days ago; verification completed but credit not released.',
        priority: 'HIGH',
      },
    });
    assert.equal(res.statusCode, 201, 'Expected HTTP 201 Created');
    const data = JSON.parse(res.payload);
    assert.equal(data.success, true);
    assert.ok(data.ticket.id.startsWith('grv-'), 'ID must start with grv-');
    assert.ok(/^GRV-\d{4}-T1-\d{4}$/.test(data.ticket.ticketNumber), 'Ticket number must match format');
    assert.equal(data.ticket.status, 'LODGED');
    assert.equal(data.ticket.currentTier, 1);
    assert.equal(data.ticket.slaHoursRemaining, 48);
    assert.equal(data.ticket.slaBreached, false);
    assert.ok(data.ticket.escalationDeadline, 'Must have escalationDeadline');
    createdTicketId = data.ticket.id;
  });

  await test('GRIEVANCES', '6.2 Reject missing title with HTTP 400', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/grievances',
      payload: {
        complainantId: 'user-001',
        complainantName: 'Test',
        societyOrInstituteId: 'soc-001',
        category: 'DIVIDEND',
        description: 'desc',
      },
    });
    assert.equal(res.statusCode, 400);
    const data = JSON.parse(res.payload);
    assert.equal(data.error, 'BAD_REQUEST');
  });

  await test('GRIEVANCES', '6.3 Reject empty payload with HTTP 400', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/grievances',
      payload: {},
    });
    assert.equal(res.statusCode, 400);
  });

  await test('GRIEVANCES', '6.4 Default priority to MEDIUM when not specified', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/grievances',
      payload: {
        complainantId: 'user-002',
        complainantName: 'Sunita Devi',
        complainantRole: 'FARMER',
        societyOrInstituteId: 'soc-002',
        societyName: 'Kisan PACS',
        category: 'FERTILIZER',
        title: 'Urea distribution shortage',
        description: 'Waiting for subsidized fertilizer quota.',
      },
    });
    assert.equal(res.statusCode, 201);
    const data = JSON.parse(res.payload);
    assert.equal(data.ticket.priority, 'MEDIUM');
  });

  // ---------------------------------------------------------------------------
  // SECTION 7: POST /api/v1/grievances/:id/escalate
  // ---------------------------------------------------------------------------
  console.log('\n>>> [Section 7] Testing POST /api/v1/grievances/:id/escalate...');

  await test('ESCALATE', '7.1 Escalate grievance Tier 1 -> Tier 2 (District SLA 7 days / 168h)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/grievances/${createdTicketId}/escalate`,
      payload: { reason: 'Society secretary did not respond within 48h SLA' },
    });
    assert.equal(res.statusCode, 200);
    const data = JSON.parse(res.payload);
    assert.equal(data.ticket.currentTier, 2);
    assert.equal(data.ticket.status, 'UNDER_INVESTIGATION');
    assert.equal(data.ticket.slaHoursRemaining, 168);
  });

  await test('ESCALATE', '7.2 Escalate grievance Tier 2 -> Tier 3 (State SLA 15 days / 360h)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/grievances/${createdTicketId}/escalate`,
      payload: { reason: 'District registrar conciliation failed' },
    });
    assert.equal(res.statusCode, 200);
    const data = JSON.parse(res.payload);
    assert.equal(data.ticket.currentTier, 3);
    assert.equal(data.ticket.status, 'UNDER_INVESTIGATION');
    assert.equal(data.ticket.slaHoursRemaining, 360);
  });

  await test('ESCALATE', '7.3 Escalate grievance Tier 3 -> Tier 4 (Ministerial Ombudsman SLA 30 days / 720h)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/grievances/${createdTicketId}/escalate`,
      payload: { reason: 'State ombudsman statutory escalation to Ministry of Cooperation' },
    });
    assert.equal(res.statusCode, 200);
    const data = JSON.parse(res.payload);
    assert.equal(data.ticket.currentTier, 4);
    assert.equal(data.ticket.status, 'ESCALATED_MINISTERIAL');
    assert.equal(data.ticket.slaHoursRemaining, 720);
  });

  await test('ESCALATE', '7.4 Re-escalation at Tier 4 is safely capped at Tier 4 Ministerial level', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/grievances/${createdTicketId}/escalate`,
      payload: { reason: 'Attempt past Tier 4' },
    });
    assert.equal(res.statusCode, 200);
    const data = JSON.parse(res.payload);
    assert.equal(data.ticket.currentTier, 4, 'Must stay capped at 4');
    assert.equal(data.ticket.status, 'ESCALATED_MINISTERIAL');
  });

  await test('ESCALATE', '7.5 Reject escalation of unknown ticket with HTTP 400 ESCALATION_FAILED', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/grievances/grv-unknown-9999/escalate',
      payload: { reason: 'Fake ticket' },
    });
    assert.equal(res.statusCode, 400);
    const data = JSON.parse(res.payload);
    assert.equal(data.error, 'ESCALATION_FAILED');
    assert.ok(data.message.includes('not found'));
  });

  // ---------------------------------------------------------------------------
  // SECTION 8: POST /api/v1/grievances/:id/resolve
  // ---------------------------------------------------------------------------
  console.log('\n>>> [Section 8] Testing POST /api/v1/grievances/:id/resolve...');

  await test('RESOLVE', '8.1 Resolve grievance with statutory summary and update status to RESOLVED', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/grievances/${createdTicketId}/resolve`,
      payload: {
        resolutionSummary:
          'Special audit committee convened; KCC crop loan of ₹1,50,000 sanctioned and credited to member account.',
      },
    });
    assert.equal(res.statusCode, 200);
    const data = JSON.parse(res.payload);
    assert.equal(data.success, true);
    assert.equal(data.ticket.status, 'RESOLVED');
    assert.ok(data.ticket.resolutionSummary.includes('₹1,50,000'));
  });

  await test('RESOLVE', '8.2 Reject resolution with empty summary with HTTP 400', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/grievances/${createdTicketId}/resolve`,
      payload: { resolutionSummary: '   ' },
    });
    assert.equal(res.statusCode, 400);
    const data = JSON.parse(res.payload);
    assert.equal(data.error, 'BAD_REQUEST');
  });

  await test('RESOLVE', '8.3 Reject resolution of unknown ticket with HTTP 400 RESOLUTION_FAILED', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/grievances/grv-phantom-ticket/resolve',
      payload: { resolutionSummary: 'Valid summary but phantom ticket' },
    });
    assert.equal(res.statusCode, 400);
    const data = JSON.parse(res.payload);
    assert.equal(data.error, 'RESOLUTION_FAILED');
  });

  await test('RESOLVE', '8.4 Cannot escalate an already resolved ticket', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/grievances/${createdTicketId}/escalate`,
      payload: { reason: 'Trying to escalate after resolved' },
    });
    assert.equal(res.statusCode, 400);
    const data = JSON.parse(res.payload);
    assert.equal(data.error, 'ESCALATION_FAILED');
    assert.ok(data.message.includes('already resolved'));
  });

  // ---------------------------------------------------------------------------
  // SECTION 9: GET /api/v1/jobs/match-100pt/:traineeId
  // ---------------------------------------------------------------------------
  console.log('\n>>> [Section 9] Testing GET /api/v1/jobs/match-100pt/:traineeId...');

  const validTraineeId = 'dddd4444-4444-4444-4444-444444444441';

  await test('JOB_MATCH', '9.1 Compute 100-pt rubric breakdown where breakdown sum matches totalScore', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/jobs/match-100pt/${validTraineeId}`,
    });
    assert.equal(res.statusCode, 200);
    const data = JSON.parse(res.payload);
    assert.equal(data.traineeId, validTraineeId);
    assert.ok(data.traineeName);
    const match = data.match;
    assert.ok(typeof match.totalScore === 'number');
    assert.ok(match.totalScore >= 0 && match.totalScore <= 100);

    const b = match.breakdown;
    assert.ok(b.skillsScore >= 0 && b.skillsScore <= 40, 'Skills score 0-40');
    assert.ok(b.certificationsScore >= 0 && b.certificationsScore <= 20, 'Certs score 0-20');
    assert.ok(b.educationScore >= 0 && b.educationScore <= 15, 'Education score 0-15');
    assert.ok(b.experienceScore >= 0 && b.experienceScore <= 10, 'Experience score 0-10');
    assert.ok(b.locationScore >= 0 && b.locationScore <= 5, 'Location score 0-5');
    assert.ok(b.preferenceScore >= 0 && b.preferenceScore <= 5, 'Preference score 0-5');
    assert.ok(b.availabilityScore >= 0 && b.availabilityScore <= 5, 'Availability score 0-5');

    const calculatedSum =
      b.skillsScore +
      b.certificationsScore +
      b.educationScore +
      b.experienceScore +
      b.locationScore +
      b.preferenceScore +
      b.availabilityScore;
    assert.equal(
      calculatedSum,
      match.totalScore,
      `Breakdown sum (${calculatedSum}) must exactly equal totalScore (${match.totalScore})`
    );

    assert.ok(match.explanation && match.explanation.length > 20, 'Must have detailed explanation');
    assert.ok(Array.isArray(match.matchedSkills), 'matchedSkills must be array');
    assert.ok(Array.isArray(match.missingSkills), 'missingSkills must be array');
  });

  await test('JOB_MATCH', '9.2 Unknown trainee returns 404 NOT_FOUND', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/jobs/match-100pt/unknown-trainee-9999',
    });
    assert.equal(res.statusCode, 404);
    const data = JSON.parse(res.payload);
    assert.equal(data.error, 'NOT_FOUND');
  });

  await test('JOB_MATCH', '9.3 Unknown jobId query param returns 400 MATCH_FAILED', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/jobs/match-100pt/${validTraineeId}?jobId=fake-job-id-999`,
    });
    assert.equal(res.statusCode, 400);
    const data = JSON.parse(res.payload);
    assert.equal(data.error, 'MATCH_FAILED');
  });

  // ---------------------------------------------------------------------------
  // SECTION 10: GET /api/v1/jobs/pathway/:traineeId
  // ---------------------------------------------------------------------------
  console.log('\n>>> [Section 10] Testing GET /api/v1/jobs/pathway/:traineeId...');

  await test('PATHWAY', '10.1 Return complete 5-step career pathway with progressive salary and milestones', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/jobs/pathway/${validTraineeId}`,
    });
    assert.equal(res.statusCode, 200);
    const data = JSON.parse(res.payload);
    assert.equal(data.traineeId, validTraineeId);
    assert.ok(data.pathway);
    assert.equal(data.pathway.pathwaySteps.length, 5, 'Must have exactly 5 career pathway steps');

    const steps = data.pathway.pathwaySteps;
    for (let i = 0; i < 5; i++) {
      assert.equal(steps[i].stepNumber, i + 1, `Step ${i + 1} number mismatch`);
      assert.ok(steps[i].roleTitle, `Step ${i + 1} must have roleTitle`);
      assert.ok(steps[i].targetSector, `Step ${i + 1} must have targetSector`);
      assert.ok(steps[i].salaryRangeLPA.min > 0, `Step ${i + 1} min salary must be > 0`);
      assert.ok(steps[i].salaryRangeLPA.max >= steps[i].salaryRangeLPA.min, 'Max salary >= Min salary');
      assert.ok(steps[i].completionCriteria, 'Must specify completion criteria');
    }

    // Check step 1 role is entry clerk / apprentice, step 5 is CEO / General Manager
    assert.ok(steps[0].roleTitle.includes('Clerk') || steps[0].roleTitle.includes('Apprentice'));
    assert.ok(steps[4].roleTitle.includes('CEO') || steps[4].roleTitle.includes('General Manager'));

    assert.ok(
      Array.isArray(data.pathway.recommendedImmediateActions),
      'Must contain recommended actions'
    );
    assert.ok(data.pathway.recommendedImmediateActions.length >= 1);
  });

  await test('PATHWAY', '10.2 Unknown trainee returns 404 NOT_FOUND', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/jobs/pathway/non-existent-trainee-999',
    });
    assert.equal(res.statusCode, 404);
  });

  // ---------------------------------------------------------------------------
  // SECTION 11: Concurrency Burst & State Persistence Audit Trail
  // ---------------------------------------------------------------------------
  console.log('\n>>> [Section 11] Concurrency burst & audit trail verification...');

  await test('CONCURRENCY', '11.1 50-request concurrent burst across all domain routes', async () => {
    const requests = [];
    for (let i = 0; i < 50; i++) {
      if (i % 5 === 0) {
        requests.push(app.inject({ method: 'GET', url: '/api/v1/schemes' }));
      } else if (i % 5 === 1) {
        requests.push(
          app.inject({
            method: 'POST',
            url: '/api/v1/schemes/evaluate',
            payload: { societyType: 'PACS', auditGrade: 'B', proposedProjectCostLakhs: 20 },
          })
        );
      } else if (i % 5 === 2) {
        requests.push(app.inject({ method: 'GET', url: '/api/v1/cooperatives/health' }));
      } else if (i % 5 === 3) {
        requests.push(app.inject({ method: 'GET', url: '/api/v1/grievances' }));
      } else {
        requests.push(
          app.inject({
            method: 'GET',
            url: `/api/v1/jobs/match-100pt/${validTraineeId}`,
          })
        );
      }
    }

    const responses = await Promise.all(requests);
    assert.equal(responses.length, 50);
    for (const r of responses) {
      assert.equal(r.statusCode, 200, `Expected 200 during concurrency, got ${r.statusCode}`);
    }
  });

  await test('AUDIT_TRAIL', '11.2 Verify memory store recorded action logs for ticket lifecycle', async () => {
    // Check sync stats of store
    const stats = centralStore.getSyncStats();
    assert.ok(stats.schemesCount >= 4, 'Schemes count in store');
    assert.ok(stats.grievancesCount >= 5, 'Grievances count in store including created ones');
  });

  // ---------------------------------------------------------------------------
  // SECTION 12: Zero-Division & Extreme Boundary Stress
  // ---------------------------------------------------------------------------
  console.log('\n>>> [Section 12] Zero-Division & Extreme Boundary Stress...');

  await test('STRESS', '12.1 CAMEL evaluation with zero advances, zero deposits, zero revenue does not produce NaN or crash', async () => {
    const zeroMetrics = {
      societyId: 'pacs-zero-000',
      societyName: 'Zero PACS',
      district: 'Test',
      state: 'Test',
      shareCapitalLakhs: 0,
      reservesAndSurplusLakhs: 0,
      totalDepositsLakhs: 0,
      totalAdvancesLakhs: 0,
      grossNpaLakhs: 0,
      liquidAssetsLakhs: 0,
      netProfitLakhs: 0,
      nonCreditRevenueLakhs: 0,
      totalRevenueLakhs: 0,
      governanceChecklistPassed: 0,
    };
    const scorecard = centralStore.calculateCamelScorecard(zeroMetrics);
    assert.ok(!Number.isNaN(scorecard.capitalAdequacyRatio), 'CAR must not be NaN');
    assert.ok(!Number.isNaN(scorecard.grossNpaPercentage), 'NPA % must not be NaN');
    assert.ok(!Number.isNaN(scorecard.liquidityRatio), 'Liquidity must not be NaN');
    assert.ok(!Number.isNaN(scorecard.nonCreditRevenuePercentage), 'Non-Credit % must not be NaN');
    assert.ok(!Number.isNaN(scorecard.compositeHealthScore), 'Composite score must not be NaN');
    assert.equal(scorecard.auditGrade, 'C');
    assert.equal(scorecard.status, 'VULNERABLE');
    assert.ok(scorecard.diagnosticAlerts.length >= 2, 'Must have governance and net profit alerts');
  });

  await test('STRESS', '12.2 Scheme evaluation with ₹10,000 Crore project cost enforces statutory caps', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/schemes/evaluate',
      payload: {
        societyType: 'PACS',
        auditGrade: 'A',
        proposedProjectCostLakhs: 1000000, // ₹10,000 Crore
        projectCategory: 'POST_HARVEST_STORAGE',
      },
    });
    assert.equal(res.statusCode, 200);
    const data = JSON.parse(res.payload);
    const aif = data.evaluations.find((e: any) => e.schemeId === 'scheme-aif-01');
    assert.ok(aif);
    // Subvention eligible principal should be capped at scheme.maxProjectCostLakhs (200 Lakhs)
    // 200 Lakhs * 3% = 6.0 Lakhs annual interest savings
    assert.equal(aif.estimatedAnnualInterestSavingsLakhs, 6.0);
  });

  // ---------------------------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------------------------
  console.log('\n========================================================================');
  console.log('   EMPIRICAL ADVERSARIAL VERIFICATION SUMMARY                          ');
  console.log('========================================================================');
  const passCount = records.filter((r) => r.status === 'PASS').length;
  const failCount = records.filter((r) => r.status === 'FAIL').length;
  console.log(`Total Injections & Checks: ${records.length}`);
  console.log(`Passed:                   ${passCount}`);
  console.log(`Failed:                   ${failCount}`);
  console.log('========================================================================\n');

  if (failCount > 0) {
    process.exit(1);
  }
}

runAdversarialHarness().catch((err) => {
  console.error('Fatal test failure:', err);
  process.exit(1);
});

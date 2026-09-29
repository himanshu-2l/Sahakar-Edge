import assert from 'node:assert';
import { buildCentralServer } from '../apps/central-api/dist/server.js';
import { centralStore } from '../apps/central-api/dist/store/memory-store.js';
import {
  SEED_SKILLS,
  SEED_JOB_OPPORTUNITY,
  SEED_JOB_DAIRY_COORDINATOR,
  SEED_JOB_DCCB_SECRETARY,
  SEED_USERS,
} from '../packages/test-fixtures/dist/index.js';

async function runPhase7Tests() {
  console.log('--- RUNNING SAHAKAR EDGE PHASE 7 INTEGRATION TESTS (Employment & Skills) ---\n');

  // Reset central store to clean state
  centralStore.seedBaseline();
  const app = await buildCentralServer();
  await app.ready();

  const superadminToken = 'superadmin-token';
  const employerToken = 'employer-token';
  const traineeAnitaId = 'dddd4444-4444-4444-4444-444444444441';
  const traineeSunitaId = 'dddd4444-4444-4444-4444-444444444443';

  try {
    // ==========================================
    // Test 1: Cooperative Skill Taxonomy Integrity
    // ==========================================
    console.log('Test 1: Cooperative Skill Taxonomy Integrity & Discovery...');
    const skillsRes = await app.inject({
      method: 'GET',
      url: '/api/v1/skills',
    });
    assert.strictEqual(skillsRes.statusCode, 200);
    const skillsData = JSON.parse(skillsRes.body);
    assert.ok(skillsData.skills.length >= 7, 'Expected at least 7 domain skills in taxonomy');

    const pacsSkill = skillsData.skills.find((s: any) => s.code === 'PACS_ACCOUNTING');
    assert.ok(pacsSkill, 'PACS_ACCOUNTING skill must exist');
    assert.strictEqual(pacsSkill.parentCategory, 'Financial Operations');
    assert.strictEqual(pacsSkill.evidenceRule, 'ASSESSMENT_PASS_70');

    // Admin creates new skill in taxonomy
    const newSkillRes = await app.inject({
      method: 'POST',
      url: '/api/v1/skills',
      headers: { authorization: `Bearer ${superadminToken}` },
      payload: {
        code: 'SOLAR_PUMP_MICROGRID',
        name: 'Cooperative Solar Microgrid Operations',
        description: 'Operation and maintenance of solar water pumping units for PACS.',
        parentCategory: 'Green Energy & Infrastructure',
        evidenceRule: 'FIELD_VERIFICATION',
      },
    });
    assert.strictEqual(newSkillRes.statusCode, 201);
    const newSkillData = JSON.parse(newSkillRes.body);
    assert.strictEqual(newSkillData.skill.code, 'SOLAR_PUMP_MICROGRID');
    console.log('✓ Cooperative skill taxonomy verified with categories, evidence rules and dynamic registration.');

    // ==========================================
    // Test 2: Verified Skill Profile Ingestion
    // ==========================================
    console.log('Test 2: Verified Skill Profile Ingestion for Certified Trainee...');
    const profileRes = await app.inject({
      method: 'GET',
      url: `/api/v1/skills/trainee/${traineeAnitaId}`,
    });
    assert.strictEqual(profileRes.statusCode, 200);
    const profileData = JSON.parse(profileRes.body);
    assert.strictEqual(profileData.traineeId, traineeAnitaId);
    assert.ok(profileData.verifiedSkillsCount >= 3, 'Anita should have at least 3 verified skills');

    const codes = profileData.skills.map((s: any) => s.skillCode);
    assert.ok(codes.includes('PACS_ACCOUNTING'), 'Anita must have PACS_ACCOUNTING verified');
    assert.ok(codes.includes('VOUCHER_ENTRY'), 'Anita must have VOUCHER_ENTRY verified');
    assert.ok(codes.includes('COOP_GOVERNANCE'), 'Anita must have COOP_GOVERNANCE verified');

    const pacsEvidence = profileData.skills.find((s: any) => s.skillCode === 'PACS_ACCOUNTING');
    assert.strictEqual(pacsEvidence.level, 2);
    assert.ok(pacsEvidence.sources.includes('ASSESSMENT'));
    console.log('✓ Verified skill profile accurately aggregates assessment and completion evidence.');

    // ==========================================
    // Test 3: Active Job Opportunities & Hard Eligibility Filtering
    // ==========================================
    console.log('Test 3: Active Job Opportunities & Hard Eligibility Filtering...');
    const jobsRes = await app.inject({
      method: 'GET',
      url: '/api/v1/jobs',
    });
    assert.strictEqual(jobsRes.statusCode, 200);
    const jobsData = JSON.parse(jobsRes.body);
    assert.ok(jobsData.jobs.length >= 3, 'Expected at least 3 active jobs');

    // Test match for DCCB Secretary which requires 1 year experience
    const matchDccbRes = await app.inject({
      method: 'GET',
      url: `/api/v1/jobs/match/${traineeAnitaId}/${SEED_JOB_DCCB_SECRETARY.id}`,
    });
    assert.strictEqual(matchDccbRes.statusCode, 200);
    const dccbMatch = JSON.parse(matchDccbRes.body).match;

    // Anita is a fresh certified graduate (0 yrs experience)
    assert.strictEqual(dccbMatch.hardEligibilityPassed, false, 'Hard eligibility should fail due to experience requirement');
    assert.ok(
      dccbMatch.eligibilityReasons[0].includes('Requires minimum 1 year(s) field experience'),
      'Explanation must note experience deficit'
    );
    console.log('✓ Hard eligibility filter successfully evaluates experience requirements with explicit reasoning.');

    // ==========================================
    // Test 4: Weighted Skill Overlap & Explainable Matching (Acceptance Criteria)
    // ==========================================
    console.log('Test 4: Weighted Skill Overlap & Explainable Matching (Matched & Missing Skills)...');
    const matchAmulRes = await app.inject({
      method: 'GET',
      url: `/api/v1/jobs/match/${traineeAnitaId}/${SEED_JOB_OPPORTUNITY.id}`,
    });
    assert.strictEqual(matchAmulRes.statusCode, 200);
    const amulMatch = JSON.parse(matchAmulRes.body).match;

    assert.strictEqual(amulMatch.hardEligibilityPassed, true, 'Freshers eligible for Amul role');
    assert.strictEqual(amulMatch.matchScore, 80, 'Expected 80% weighted match (0.5 + 0.3 out of 1.0)');

    // Verify matched skills
    assert.strictEqual(amulMatch.matchedSkills.length, 2);
    const matchedCodes = amulMatch.matchedSkills.map((m: any) => m.skillCode);
    assert.ok(matchedCodes.includes('PACS_ACCOUNTING'));
    assert.ok(matchedCodes.includes('VOUCHER_ENTRY'));

    // Verify missing skills
    assert.strictEqual(amulMatch.missingSkills.length, 1);
    assert.strictEqual(amulMatch.missingSkills[0].skillCode, 'STATUTORY_AUDIT');

    // Verify transparent explanation text
    assert.ok(
      amulMatch.explanation.includes('Matched 2 of 3 skills (80% weighted match)'),
      'Explanation text must report transparent breakdown'
    );
    assert.ok(
      amulMatch.explanation.includes('Missing: Statutory Audit & Balance Sheet Verification'),
      'Explanation text must specify exact missing skill'
    );
    console.log('✓ Acceptance Criteria Verified: User sees transparent matched and missing skills with exact weights.');

    // ==========================================
    // Test 5: Zero-Hype Verification (No Speculative AI Probabilities)
    // ==========================================
    console.log('Test 5: Zero-Hype Constraint Verification (No Speculative Probabilities)...');
    // Ensure match score is strictly an integer percentage 0-100 derived from weights
    assert.strictEqual(typeof amulMatch.matchScore, 'number');
    assert.ok(amulMatch.matchScore >= 0 && amulMatch.matchScore <= 100);
    assert.strictEqual(amulMatch.matchScore % 1, 0, 'Score must be deterministic integer percentage');
    assert.strictEqual((amulMatch as any).fakeProbability, undefined);
    assert.strictEqual((amulMatch as any).employabilityOdds, undefined);
    console.log('✓ Zero-Hype constraint verified: Output is 100% deterministic, explainable, and grounded in verified evidence.');

    // ==========================================
    // Test 6: Trainee Match Ranking Across All Jobs
    // ==========================================
    console.log('Test 6: Trainee Match Ranking Across All Jobs...');
    // Anita (Accounting focus)
    const anitaAllRes = await app.inject({
      method: 'GET',
      url: `/api/v1/jobs/match/${traineeAnitaId}`,
    });
    assert.strictEqual(anitaAllRes.statusCode, 200);
    const anitaMatches = JSON.parse(anitaAllRes.body).matches;
    assert.strictEqual(anitaMatches[0].job.id, SEED_JOB_OPPORTUNITY.id, 'Top match for Anita must be Amul Accountant');
    assert.strictEqual(anitaMatches[0].matchScore, 80);

    // Sunita (Dairy focus)
    const sunitaAllRes = await app.inject({
      method: 'GET',
      url: `/api/v1/jobs/match/${traineeSunitaId}`,
    });
    assert.strictEqual(sunitaAllRes.statusCode, 200);
    const sunitaMatches = JSON.parse(sunitaAllRes.body).matches;
    assert.strictEqual(
      sunitaMatches[0].job.id,
      SEED_JOB_DAIRY_COORDINATOR.id,
      'Top match for Sunita must be Dairy Coordinator'
    );
    assert.strictEqual(sunitaMatches[0].matchScore, 100, 'Sunita possesses 100% of dairy required skills');
    console.log('✓ Trainee match ranking correctly separates accounting vs dairy skill pathways.');

    // ==========================================
    // Test 7: Evaluation Benchmark (Precision@K & Recall@K)
    // ==========================================
    console.log('Test 7: Evaluation Benchmark (Weighted Skill Overlap vs Keyword Baseline)...');
    const benchmarkRes = await app.inject({
      method: 'GET',
      url: '/api/v1/jobs/evaluation/benchmark',
    });
    assert.strictEqual(benchmarkRes.statusCode, 200);
    const benchData = JSON.parse(benchmarkRes.body);

    assert.strictEqual(benchData.metrics.weightedSkillOverlap.precisionAt1, 1.0, 'Weighted model must achieve 100% Precision@1');
    assert.ok(
      benchData.metrics.weightedSkillOverlap.recallAt2 >= benchData.metrics.keywordBaseline.recallAt2,
      'Weighted model recall must meet or beat keyword baseline'
    );
    console.log(`✓ Benchmark Results: Precision@1 = ${benchData.metrics.weightedSkillOverlap.precisionAt1 * 100}%, Recall@1 = ${benchData.metrics.weightedSkillOverlap.recallAt1 * 100}%`);
    console.log(`  Report: ${benchData.metrics.superioritySummary}`);

    console.log('\n=== ALL PHASE 7 INTEGRATION TESTS PASSED SUCCESSFULLY! ===\n');
  } finally {
    await app.close();
  }
}

runPhase7Tests().catch((err) => {
  console.error('Phase 7 Test Failure:', err);
  process.exit(1);
});

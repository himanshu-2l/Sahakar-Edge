import type {
  CandidateMatch100Pt,
  CandidateMatchBreakdown100Pt,
  CareerPathwayStep,
  TraineeCareerPathway,
  JobOpportunity,
  JobRequiredSkill,
} from '@sahakar/types';
import { centralStore, CentralMemoryStore } from '../store/memory-store.js';

export class CandidateMatcherEngine {
  private storeInstance?: CentralMemoryStore;
  constructor(store?: CentralMemoryStore) {
    this.storeInstance = store;
  }

  private get store(): CentralMemoryStore {
    return this.storeInstance || centralStore;
  }

  /**
   * Evaluates a candidate against a job opportunity using the 100-point rubric:
   * Skills (40) + Certs (20) + Education (15) + Experience (10) + Location (5) + Preference (5) + Availability (5) = 100
   */
  public matchCandidate100Pt(traineeId: string, jobId: string): CandidateMatch100Pt {
    const job = this.store.getJob(jobId);
    if (!job) {
      throw new Error(`Job opportunity not found: ${jobId}`);
    }

    const user = this.store.getUser(traineeId);
    const traineeName = user?.name || 'Candidate';

    // 1. Hard Eligibility Filters
    const eligibilityReasons: string[] = [];
    let hardEligibilityPassed = true;
    if (!job.active) {
      hardEligibilityPassed = false;
      eligibilityReasons.push('Job posting is currently closed.');
    }

    // 2. Verified Skills (Max 40 Points)
    const requiredSkills = this.store.getJobRequiredSkills(jobId);
    const traineeEvidences = this.store.listTraineeSkillEvidences(traineeId);
    const activeCredentials = this.store.listCredentials(traineeId).filter((c) => c.status === 'ACTIVE');

    // Build Trainee Competency Map
    const competencyMap = new Map<string, number>();
    for (const ev of traineeEvidences) {
      const skill = this.store.getSkill(ev.skillId);
      const code = skill?.code || ev.skillId;
      const current = competencyMap.get(code) || 0;
      if (ev.level > current) competencyMap.set(code, ev.level);
    }
    for (const cred of activeCredentials) {
      for (const cs of cred.payload?.skillsSummary || []) {
        const current = competencyMap.get(cs.skillCode) || 0;
        if ((cs.level || 1) > current) competencyMap.set(cs.skillCode, cs.level || 1);
      }
    }

    const matchedSkills: CandidateMatch100Pt['matchedSkills'] = [];
    const missingSkills: CandidateMatch100Pt['missingSkills'] = [];

    let totalWeight = 0;
    let weightedProficiency = 0;

    for (const req of requiredSkills) {
      const weight = req.weight > 0 ? req.weight : 1.0;
      totalWeight += weight;

      const skillObj = this.store.getSkill(req.skillId);
      const skillCode = req.skillCode || skillObj?.code || req.skillId;
      const skillName = req.skillName || skillObj?.name || skillCode;

      const level = competencyMap.get(skillCode) || 0;
      if (level >= 1) {
        const ratio = Math.min(1.0, level / req.requiredLevel);
        weightedProficiency += weight * ratio;
        matchedSkills.push({
          skillCode,
          skillName,
          traineeLevel: level,
          requiredLevel: req.requiredLevel,
          weight,
        });
      } else {
        missingSkills.push({
          skillCode,
          skillName,
          requiredLevel: req.requiredLevel,
          weight,
        });
      }
    }

    const skillsScore =
      totalWeight > 0 ? Math.round((weightedProficiency / totalWeight) * 40) : 40;

    // 3. Accredited Certifications (Max 20 Points)
    let certificationsScore = 0;
    if (activeCredentials.length >= 2) {
      certificationsScore = 20;
    } else if (activeCredentials.length === 1) {
      certificationsScore = 15;
    } else {
      const submissions = this.store.listAssessmentSubmissions(traineeId);
      const passed = submissions.some((s: any) => s.passed);
      certificationsScore = passed ? 10 : 0;
    }

    // 4. Formal Education & Qualification (Max 15 Points)
    let educationScore = 10; // Standard cooperative higher secondary baseline
    const qualLower = (job.qualification || '').toLowerCase();
    if (qualLower.includes('ncct') || qualLower.includes('degree') || qualLower.includes('vamnicom')) {
      educationScore = activeCredentials.length > 0 ? 15 : 12;
    }

    // 5. Relevant Experience (Max 10 Points)
    let experienceScore = 10;
    if (job.experienceYears > 0) {
      // Certified fresh trainees possess equivalent practical lab experience
      const candidateYears = activeCredentials.length > 0 ? 1 : 0;
      experienceScore =
        candidateYears >= job.experienceYears
          ? 10
          : Math.round((candidateYears / job.experienceYears) * 10);
      if (candidateYears < job.experienceYears) {
        eligibilityReasons.push(
          `Candidate has ${candidateYears} year(s) field tenure (Job requires ${job.experienceYears} year(s)).`
        );
      }
    }

    // 6. Geographic Location Proximity (Max 5 Points)
    let locationScore = 4; // State-level cooperative mobility standard
    if (user?.instituteId) {
      const inst = this.store.getInstitute(user.instituteId);
      if (inst && job.location.toLowerCase().includes(inst.state?.toLowerCase() || '')) {
        locationScore = 5;
      }
    }

    // 7. Role & Sector Preference (Max 5 Points)
    const preferenceScore = 5; // Direct cooperative sector alignment

    // 8. Immediate Availability (Max 5 Points)
    const availabilityScore = 5; // Immediate post-training placement availability

    // Composite Breakdown
    const breakdown: CandidateMatchBreakdown100Pt = {
      skillsScore,
      certificationsScore,
      educationScore,
      experienceScore,
      locationScore,
      preferenceScore,
      availabilityScore,
    };

    const totalScore =
      skillsScore +
      certificationsScore +
      educationScore +
      experienceScore +
      locationScore +
      preferenceScore +
      availabilityScore;

    // Natural-Language Explanation
    const matchedNames = matchedSkills.map((m) => m.skillName).join(', ');
    const missingNames = missingSkills.map((m) => m.skillName).join(', ');

    let explanation = `Candidate evaluated at ${totalScore}/100 composite match for ${job.title}. `;
    if (matchedSkills.length > 0) {
      explanation += `Verified ${matchedSkills.length}/${requiredSkills.length} core competencies (${matchedNames}) yielding ${skillsScore}/40 skills score. `;
    }
    if (certificationsScore >= 15) {
      explanation += `Awarded ${certificationsScore}/20 for verified NCCT Ed25519 digital credentials. `;
    }
    if (missingSkills.length > 0) {
      explanation += `Development area: Lacks verified evidence for ${missingNames}. `;
    }
    if (!hardEligibilityPassed) {
      explanation = `[Eligibility Warning: ${eligibilityReasons.join(' ')}] ${explanation}`;
    }

    return {
      job,
      traineeId,
      traineeName,
      totalScore,
      hardEligibilityPassed,
      eligibilityReasons: eligibilityReasons.length > 0 ? eligibilityReasons : undefined,
      breakdown,
      matchedSkills,
      missingSkills,
      explanation,
      matchedAt: new Date().toISOString(),
    };
  }

  public matchCandidateToAllJobs(traineeId: string): CandidateMatch100Pt[] {
    const jobs = this.store.listJobs(true);
    return jobs
      .map((job) => this.matchCandidate100Pt(traineeId, job.id))
      .sort((a, b) => b.totalScore - a.totalScore);
  }

  /**
   * Generates a 5-step structured career progression pathway for cooperative talent.
   */
  public generateCareerPathway(traineeId: string, _targetJobId?: string): TraineeCareerPathway {
    const user = this.store.getUser(traineeId);
    const traineeName = user?.name || 'Trainee';
    const activeCredentials = this.store.listCredentials(traineeId).filter((c) => c.status === 'ACTIVE');
    const isCertified = activeCredentials.length > 0;

    const steps: CareerPathwayStep[] = [
      {
        stepNumber: 1,
        roleTitle: 'Cooperative Apprentice & Junior Ledger Clerk',
        targetSector: 'Primary Agricultural Credit Society (PACS)',
        estimatedTenureMonths: 3,
        requiredSkills: ['PACS Double-Entry Accounting', 'Daybook & Voucher Posting'],
        recommendedCertifications: ['NCCT Foundational PACS Certification'],
        salaryRangeLPA: { min: 2.4, max: 3.6 },
        status: isCertified ? 'COMPLETED' : 'IN_PROGRESS',
        completionCriteria:
          'Pass NCCT practical assessment with score >= 70% and complete 30 days of simulated day-end balancing.',
      },
      {
        stepNumber: 2,
        roleTitle: 'Assistant Accountant & KCC Appraisal Officer',
        targetSector: 'PACS / District Central Cooperative Bank (DCCB)',
        estimatedTenureMonths: 9,
        requiredSkills: ['Kisan Credit Card (KCC) Appraisal', 'Member Loan Ledger Verification'],
        recommendedCertifications: ['NCCT Advanced Agricultural Credit Appraisal'],
        salaryRangeLPA: { min: 3.6, max: 5.0 },
        status: isCertified ? 'IN_PROGRESS' : 'NEXT_MILESTONE',
        completionCriteria:
          'Perform solo day-end cashbook closing and appraise 50+ KCC crop loan disbursement dossiers with zero audit discrepancies.',
      },
      {
        stepNumber: 3,
        roleTitle: 'Senior Accountant & Computerized ERP Coordinator',
        targetSector: 'DCCB Branch / Multi-Purpose PACS',
        estimatedTenureMonths: 18,
        requiredSkills: ['Statutory Audit & Balance Sheet Verification', 'Cooperative Governance & Compliance'],
        recommendedCertifications: ['NABARD ERP Cloud Operations Specialist'],
        salaryRangeLPA: { min: 5.0, max: 7.5 },
        status: 'NEXT_MILESTONE',
        completionCriteria:
          'Lead successful migration of PACS ledger to National Cloud ERP and achieve Audit Grade "A" on annual statutory inspection.',
      },
      {
        stepNumber: 4,
        roleTitle: 'Assistant Branch Manager & Scheme Project Officer',
        targetSector: 'District Central Cooperative Bank / Dairy Union',
        estimatedTenureMonths: 24,
        requiredSkills: ['Scheme Advisory & AIF/PMFME Project Appraisal', 'Cold Chain & Logistics Management'],
        recommendedCertifications: ['VAMNICOM Diploma in Cooperative Business Management (DCBM)'],
        salaryRangeLPA: { min: 7.5, max: 11.0 },
        status: 'FUTURE_GOAL',
        completionCriteria:
          'Sanction and disburse ₹5+ Crore under Agriculture Infrastructure Fund (AIF) and manage multi-branch cooperative portfolio.',
      },
      {
        stepNumber: 5,
        roleTitle: 'Chief Executive Officer (CEO) / General Manager',
        targetSector: 'Apex Cooperative Bank / State Cooperative Marketing Federation',
        estimatedTenureMonths: 36,
        requiredSkills: ['Cooperative CAMEL Optimization', 'Apex Governance & Policy Execution'],
        recommendedCertifications: ['National Cooperative Leadership Fellowship (NCCT-VAMNICOM)'],
        salaryRangeLPA: { min: 11.0, max: 18.0 },
        status: 'FUTURE_GOAL',
        completionCriteria:
          'Executive governance of district/state federation with sustained CAMEL Score > 85 and national performance recognition.',
      },
    ];

    const completedCount = steps.filter((s) => s.status === 'COMPLETED').length;
    const progressPct = Math.round((completedCount / steps.length) * 100);

    return {
      traineeId,
      traineeName,
      currentRole: isCertified ? 'Certified PACS Operations Specialist' : 'Trainee Cohort Student',
      targetAspiration: 'Chief Executive Officer / Cooperative General Manager',
      currentProgressPercentage: progressPct,
      pathwaySteps: steps,
      recommendedImmediateActions: isCertified
        ? [
            'Apply for open Assistant Accountant roles at Amul Talent Network and Bhopal DCCB.',
            'Enroll in VAMNICOM Advanced Credit Appraisal masterclass.',
          ]
        : [
            'Complete PACS Double-Entry Accounting practical lab balancing.',
            'Clear oral viva assessment with score >= 70% to trigger Ed25519 digital credential issuance.',
          ],
      generatedAt: new Date().toISOString(),
    };
  }
}

export const candidateMatcherEngine = new CandidateMatcherEngine();
